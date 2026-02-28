---
metaTitle: Правила использования хуков в React
metaDescription: Изучите основные правила использования хуков в React — когда и где можно вызывать хуки, как избежать типичных ошибок и почему эти правила важны для корректной работы приложения
author: Олег Марков
title: Правила хуков — правила использования
preview: Разберитесь с правилами использования хуков в React — почему нельзя вызывать хуки внутри условий и циклов, как работают только функциональные компоненты и кастомные хуки, и как инструменты помогают соблюдать эти правила
---

## Введение

Хуки — одна из ключевых концепций современного React. Начиная с версии 16.8, они позволяют использовать состояние и другие возможности React в функциональных компонентах. Однако у хуков есть строгие правила использования, без соблюдения которых ваше приложение будет вести себя непредсказуемо, а React не сможет корректно отслеживать состояние компонентов.

В этой статье я расскажу о двух главных правилах хуков, объясню, почему они существуют, покажу типичные ошибки и как их избежать. Также разберём инструменты, которые помогают следить за соблюдением правил в команде.

## Два главных правила хуков

React официально устанавливает два основных правила для использования хуков:

1. **Вызывайте хуки только на верхнем уровне** — не внутри циклов, условий или вложенных функций
2. **Вызывайте хуки только из React-функций** — из функциональных компонентов или кастомных хуков

Давайте подробно разберём каждое из них.

## Правило 1: Вызывайте хуки только на верхнем уровне

### Что это означает

Хуки нельзя вызывать внутри:
- Условных операторов (`if`, `else`, тернарный оператор)
- Циклов (`for`, `while`, `forEach` и т.д.)
- Вложенных функций
- Блоков `try/catch`

Хуки всегда должны вызываться на верхнем уровне вашего функционального компонента или кастомного хука — до любых условных проверок или ранних возвратов.

### Неправильное использование

```jsx
function UserProfile({ userId, isAdmin }) {
  // ❌ Неправильно: хук внутри условия
  if (isAdmin) {
    const [adminData, setAdminData] = useState(null);
  }

  // ❌ Неправильно: хук внутри цикла
  const permissions = ['read', 'write', 'delete'];
  permissions.forEach(permission => {
    const [hasPermission, setHasPermission] = useState(false);
  });

  // ❌ Неправильно: хук внутри вложенной функции
  function loadData() {
    const [data, setData] = useState(null);
    useEffect(() => {
      // ...
    }, []);
  }

  return <div>Профиль пользователя</div>;
}
```

### Правильное использование

```jsx
function UserProfile({ userId, isAdmin }) {
  // ✅ Правильно: все хуки на верхнем уровне
  const [adminData, setAdminData] = useState(null);
  const [permissions, setPermissions] = useState({
    read: false,
    write: false,
    delete: false
  });
  const [data, setData] = useState(null);

  // Теперь можно использовать условия в логике — но не для вызова хуков
  useEffect(() => {
    if (isAdmin) {
      // Загружаем данные администратора
      fetchAdminData(userId).then(setAdminData);
    }
  }, [isAdmin, userId]);

  return <div>Профиль пользователя</div>;
}
```

### Почему это правило существует

Чтобы понять причину, нужно разобраться, как React отслеживает состояние хуков. React не привязывает хуки к именам переменных — он использует **порядок вызова хуков**.

При каждом рендере React просматривает вызовы хуков в строго фиксированном порядке и сопоставляет их с сохранёнными значениями. Это похоже на пронумерованный список:

```
Рендер 1:
  [0] useState(null)   → adminData = null
  [1] useState(false)  → isLoading = false
  [2] useEffect(...)   → подписка на данные

Рендер 2 (если isAdmin изменился):
  [0] useState(null)   → adminData = null  ✅ правильно
  [1] useState(false)  → isLoading = false ✅ правильно
  [2] useEffect(...)   → подписка на данные ✅ правильно
```

Если добавить хук внутри условия, порядок может измениться:

```
// Если isAdmin = true
Рендер 1:
  [0] useState(null)   → adminData = null
  [1] useState(false)  → isLoading = false
  [2] useEffect(...)

// Если isAdmin = false (хук пропущен!)
Рендер 2:
  [0] useState(false)  → adminData получает значение isLoading! ❌
  [1] useEffect(...)   → подписка получает данные useState! ❌
```

React потеряет соответствие между хуком и его сохранённым состоянием, что приведёт к непредсказуемым ошибкам.

### Исключение: ранний возврат

Ранний возврат также нарушает правило, если хуки вызываются после него:

```jsx
function Component({ data }) {
  // ❌ Неправильно: хук после раннего возврата
  if (!data) {
    return <div>Загрузка...</div>;
  }

  // Этот хук будет вызван только когда data существует
  const [processed, setProcessed] = useState(data);

  return <div>{processed}</div>;
}
```

```jsx
function Component({ data }) {
  // ✅ Правильно: хуки до раннего возврата
  const [processed, setProcessed] = useState(data);

  if (!data) {
    return <div>Загрузка...</div>;
  }

  return <div>{processed}</div>;
}
```

## Правило 2: Вызывайте хуки только из React-функций

### Где можно использовать хуки

Хуки можно вызывать только из двух мест:

1. **Функциональные компоненты React**
2. **Кастомные хуки** (функции, имя которых начинается с `use`)

### Неправильное использование

```jsx
// ❌ Неправильно: хук в обычной JavaScript-функции
function calculateTotal(items) {
  const [total, setTotal] = useState(0); // Ошибка!

  items.forEach(item => {
    setTotal(prev => prev + item.price);
  });

  return total;
}

// ❌ Неправильно: хук в обработчике события
document.addEventListener('click', () => {
  const [clicked, setClicked] = useState(false); // Ошибка!
});

// ❌ Неправильно: хук в классовом компоненте
class MyComponent extends React.Component {
  render() {
    const [count, setCount] = useState(0); // Ошибка!
    return <div>{count}</div>;
  }
}
```

### Правильное использование

```jsx
// ✅ Правильно: хук в функциональном компоненте
function ShoppingCart({ items }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + item.price, 0);
    setTotal(newTotal);
  }, [items]);

  return <div>Итого: {total} руб.</div>;
}

// ✅ Правильно: хук в кастомном хуке
function useTotal(items) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + item.price, 0);
    setTotal(newTotal);
  }, [items]);

  return total;
}

// ✅ Правильно: использование кастомного хука
function ShoppingCart({ items }) {
  const total = useTotal(items);
  return <div>Итого: {total} руб.</div>;
}
```

### Почему это правило существует

React должен знать, какому компоненту принадлежит каждый вызов хука. Это позволяет:

- Правильно изолировать состояние между компонентами
- Корректно выполнять обновления при перерисовке
- Отображать понятные сообщения об ошибках в DevTools

Если вызвать хук из обычной функции, React не сможет связать его с конкретным компонентом и деревом рендера, что нарушит всю систему управления состоянием.

## Правило именования кастомных хуков

Хотя это не строгое техническое правило, а соглашение, оно тесно связано с предыдущим правилом. **Кастомные хуки должны начинаться с префикса `use`**.

```jsx
// ✅ Правильно: начинается с use
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateSize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', updateSize);
    updateSize();

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

// ❌ Неправильно: не начинается с use
function getWindowSize() {
  // Даже если внутри используются хуки — это нарушение соглашения
  const [size, setSize] = useState({ width: 0, height: 0 });
  // ...
}
```

Префикс `use` важен по нескольким причинам:
- Плагин ESLint `eslint-plugin-react-hooks` проверяет правила только для функций с префиксом `use`
- Другие разработчики сразу понимают, что функция является хуком
- React DevTools корректно отображает кастомные хуки в дереве компонентов

## Типичные ошибки и как их исправить

### Ошибка 1: Хук в условии для оптимизации

```jsx
// ❌ Попытка "оптимизировать" — не вызывать эффект без данных
function DataViewer({ data }) {
  if (!data) return null; // ← Ранний возврат

  // Этот хук пропускается когда data = null
  const [formatted, setFormatted] = useState(
    formatData(data)
  );

  return <div>{formatted}</div>;
}
```

```jsx
// ✅ Правильное решение: перенести логику внутрь эффекта
function DataViewer({ data }) {
  const [formatted, setFormatted] = useState(null);

  useEffect(() => {
    if (data) {
      setFormatted(formatData(data));
    }
  }, [data]);

  if (!data) return null;

  return <div>{formatted}</div>;
}
```

### Ошибка 2: Динамическое количество хуков

```jsx
// ❌ Количество хуков зависит от данных
function TagList({ tags }) {
  return (
    <div>
      {tags.map(tag => {
        // Каждый рендер может создать разное количество хуков!
        const [isSelected, setIsSelected] = useState(false);
        return (
          <button
            key={tag.id}
            onClick={() => setIsSelected(!isSelected)}
            className={isSelected ? 'selected' : ''}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
```

```jsx
// ✅ Правильное решение: вынести в отдельный компонент
function Tag({ tag }) {
  // Теперь каждый компонент имеет свой стабильный хук
  const [isSelected, setIsSelected] = useState(false);

  return (
    <button
      onClick={() => setIsSelected(!isSelected)}
      className={isSelected ? 'selected' : ''}
    >
      {tag.name}
    </button>
  );
}

function TagList({ tags }) {
  return (
    <div>
      {tags.map(tag => (
        <Tag key={tag.id} tag={tag} />
      ))}
    </div>
  );
}
```

### Ошибка 3: Хук внутри try/catch

```jsx
// ❌ Неправильно: хук внутри try/catch
function SafeComponent({ config }) {
  try {
    const [value, setValue] = useState(config.defaultValue);
    return <div>{value}</div>;
  } catch (error) {
    return <div>Ошибка конфигурации</div>;
  }
}
```

```jsx
// ✅ Правильно: хук на верхнем уровне
function SafeComponent({ config }) {
  const defaultValue = config?.defaultValue ?? '';
  const [value, setValue] = useState(defaultValue);

  if (!config) {
    return <div>Ошибка конфигурации</div>;
  }

  return <div>{value}</div>;
}
```

## Инструменты для соблюдения правил

### eslint-plugin-react-hooks

React предоставляет официальный плагин ESLint для автоматической проверки правил хуков. Он входит в стандартную конфигурацию Create React App и большинства современных шаблонов.

**Установка:**

```bash
npm install eslint-plugin-react-hooks --save-dev
```

**Конфигурация в `.eslintrc.js`:**

```js
module.exports = {
  plugins: ['react-hooks'],
  rules: {
    // Проверяет правила вызова хуков
    'react-hooks/rules-of-hooks': 'error',
    // Проверяет полноту массива зависимостей useEffect
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

**Что проверяет плагин:**

```jsx
// Эти ошибки плагин обнаружит автоматически

// ❌ react-hooks/rules-of-hooks: хук в условии
function Component({ show }) {
  if (show) {
    useState(0); // ESLint: React Hook "useState" is called conditionally
  }
}

// ❌ react-hooks/rules-of-hooks: хук в обычной функции
function notAHook() {
  useState(0); // ESLint: React Hook "useState" cannot be called in a regular function
}

// ❌ react-hooks/exhaustive-deps: неполный массив зависимостей
function Component({ userId }) {
  useEffect(() => {
    fetchUser(userId); // ESLint: React Hook useEffect has a missing dependency: 'userId'
  }, []); // Предупреждение: userId отсутствует в зависимостях
}
```

### React DevTools

React DevTools помогают визуально проверить работу хуков в компоненте. В панели компонента вы можете увидеть все хуки и их текущие значения, что помогает отлаживать проблемы.

## Правила хуков и React Strict Mode

React Strict Mode в режиме разработки намеренно вызывает функции компонентов дважды, чтобы выявить побочные эффекты. Это помогает обнаружить нарушения правил хуков:

```jsx
// В index.js или main.tsx
import { StrictMode } from 'react';

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

В Strict Mode React выполняет двойной вызов:
- Тела функциональных компонентов
- Тел функций, переданных в `useState`, `useMemo`, `useReducer`
- Функций `setup` в `useEffect`

Это позволяет выявить компоненты, которые нарушают правила хуков или имеют нечистые побочные эффекты.

## Проверка знаний: найдите ошибки

Попробуйте найти нарушения правил хуков в следующем примере:

```jsx
function ProductCard({ product, isLoggedIn }) {
  const [price, setPrice] = useState(product.price);

  if (!isLoggedIn) {
    return <div>Войдите для просмотра</div>;
  }

  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (product.category === 'sale') {
      for (let i = 0; i < product.discounts.length; i++) {
        const [applied, setApplied] = useState(false);
      }
    }
  }, [product]);

  return <div>{price - discount}</div>;
}
```

**Ошибки в примере:**

1. `useState(0)` для `discount` вызывается после раннего возврата — нарушение правила верхнего уровня
2. `useState(false)` внутри цикла `for` — нарушение правила верхнего уровня
3. `useState(false)` внутри `useEffect` — нарушение правила верхнего уровня

**Исправленная версия:**

```jsx
function ProductCard({ product, isLoggedIn }) {
  const [price, setPrice] = useState(product.price);
  const [discount, setDiscount] = useState(0);
  // Заменяем массив хуков на один хук с массивом
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);

  useEffect(() => {
    if (product.category === 'sale') {
      const applied = product.discounts.map(() => false);
      setAppliedDiscounts(applied);
    }
  }, [product]);

  if (!isLoggedIn) {
    return <div>Войдите для просмотра</div>;
  }

  return <div>{price - discount}</div>;
}
```

## Заключение

Правила хуков существуют не случайно — они обеспечивают предсказуемую работу системы состояния в React. Запомните два главных правила:

1. **Вызывайте хуки только на верхнем уровне** — никогда внутри условий, циклов или вложенных функций
2. **Вызывайте хуки только из React-функций** — из функциональных компонентов или кастомных хуков (имя которых начинается с `use`)

Используйте `eslint-plugin-react-hooks` для автоматической проверки правил. Этот плагин поймает большинство нарушений ещё до запуска приложения. Понимание того, почему эти правила существуют (React отслеживает хуки по порядку вызова), помогает писать правильный код интуитивно, не заглядывая в документацию каждый раз.
