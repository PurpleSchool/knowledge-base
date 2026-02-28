# Правила хуков в React

Хуки — мощный инструмент React, но для их корректной работы необходимо соблюдать два фундаментальных правила. Эти правила не произвольны: они определяются внутренней архитектурой React.

## Два главных правила

### Правило 1: Вызывай хуки только на верхнем уровне

**Никогда не вызывай хуки внутри циклов, условных операторов или вложенных функций.** Хуки всегда должны вызываться на верхнем уровне функционального компонента или кастомного хука — до любого раннего возврата.

```jsx
// ❌ Неправильно — хук внутри условия
function UserProfile({ userId, showDetails }) {
  if (showDetails) {
    const [details, setDetails] = useState(null); // Нарушение!
    useEffect(() => {
      fetchDetails(userId).then(setDetails);
    }, [userId]);
  }

  return <div>{/* ... */}</div>;
}

// ✅ Правильно — хуки всегда вызываются
function UserProfile({ userId, showDetails }) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (showDetails) {
      fetchDetails(userId).then(setDetails);
    }
  }, [userId, showDetails]);

  return <div>{showDetails && details ? <Details data={details} /> : null}</div>;
}
```

#### Почему это важно?

React отслеживает состояние каждого хука по **порядку его вызова**. При каждом рендере React ожидает, что хуки будут вызваны в том же порядке. Если хук вызывается условно, порядок может измениться, и React потеряет соответствие между состояниями и хуками.

```jsx
// Пример: что происходит внутри React
// Первый рендер (showDetails = true):
useState(null)   // Hook 1: details → null
useEffect(...)   // Hook 2: загрузка данных
useState(false)  // Hook 3: isLoading → false

// Второй рендер (showDetails = false):
// Hook 1 пропущен! React думает, что Hook 1 — это isLoading
// Это вызывает баги и непредсказуемое поведение
```

### Правило 2: Вызывай хуки только из React-функций

**Хуки можно вызывать только:**
- Из функциональных компонентов React
- Из кастомных хуков (функций, начинающихся с `use`)

```jsx
// ❌ Неправильно — хук в обычной функции
function fetchUserData(userId) {
  const [data, setData] = useState(null); // Нарушение!
  // ...
}

// ❌ Неправильно — хук в классовом компоненте
class MyComponent extends React.Component {
  render() {
    const [count, setCount] = useState(0); // Нарушение!
    return <div>{count}</div>;
  }
}

// ✅ Правильно — хук в функциональном компоненте
function MyComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ✅ Правильно — хук в кастомном хуке
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialValue);
  return { count, increment, decrement, reset };
}
```

## Почему существуют эти правила?

### Внутренняя реализация React

React хранит состояние хуков в виде **связного списка**, привязанного к компоненту. При каждом рендере React обходит этот список по порядку и сопоставляет каждый вызов хука с соответствующим элементом списка.

```
Компонент: ProfilePage
├── Hook[0]: useState → { value: 'John', setter: setName }
├── Hook[1]: useState → { value: 25, setter: setAge }
├── Hook[2]: useEffect → { cleanup: fn, deps: ['John'] }
└── Hook[3]: useRef → { current: null }
```

Если порядок вызовов меняется между рендерами, React начинает читать неправильные данные из списка.

### Пример ошибки

```jsx
// ❌ Этот код создаёт серьёзный баг
function SearchResults({ query, sortByDate }) {
  const [results, setResults] = useState([]);

  // Этот useEffect ВСЕГДА должен вызываться
  useEffect(() => {
    search(query).then(setResults);
  }, [query]);

  // ❌ Условный хук — нарушение порядка!
  if (sortByDate) {
    const sortedResults = useMemo(
      () => [...results].sort((a, b) => new Date(b.date) - new Date(a.date)),
      [results]
    );
    return <ResultsList items={sortedResults} />;
  }

  return <ResultsList items={results} />;
}

// ✅ Правильное решение
function SearchResults({ query, sortByDate }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    search(query).then(setResults);
  }, [query]);

  // useMemo всегда вызывается, но логика внутри зависит от sortByDate
  const displayResults = useMemo(() => {
    if (!sortByDate) return results;
    return [...results].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [results, sortByDate]);

  return <ResultsList items={displayResults} />;
}
```

## ESLint Plugin: eslint-plugin-react-hooks

React предоставляет официальный ESLint-плагин для автоматической проверки правил хуков.

### Установка

```bash
npm install eslint-plugin-react-hooks --save-dev
```

### Конфигурация (.eslintrc.json)

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### С использованием flat config (ESLint 9+)

```javascript
// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

### Что проверяет плагин?

**`rules-of-hooks`** (error):
- Хуки не вызываются внутри условий, циклов, вложенных функций
- Хуки вызываются только из компонентов или кастомных хуков

**`exhaustive-deps`** (warn):
- Все зависимости, используемые внутри `useEffect`, `useCallback`, `useMemo`, указаны в массиве зависимостей
- Предупреждает о лишних или недостающих зависимостях

### Примеры ошибок, которые ловит плагин

```jsx
// rules-of-hooks: ERROR — хук в условии
function Component({ isLoggedIn }) {
  if (isLoggedIn) {
    const [user, setUser] = useState(null); // ❌ Error: rules-of-hooks
  }
}

// exhaustive-deps: WARNING — пропущена зависимость
function Component({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser); // ⚠️ Warning: userId не в deps
  }, []); // ❌ Должно быть [userId]
}

// Правильно
function Component({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // ✅
}
```

## Правило именования кастомных хуков

Кастомные хуки **должны** начинаться с префикса `use`. Это не просто конвенция — React и ESLint используют это правило для определения, является ли функция хуком.

```jsx
// ✅ Правильно
function useUserData(userId) { /* ... */ }
function useFetch(url) { /* ... */ }
function useLocalStorage(key, defaultValue) { /* ... */ }
function useDebounce(value, delay) { /* ... */ }

// ❌ Неправильно — React не распознает как хук
function getUserData(userId) {
  const [data, setData] = useState(null); // Нарушение правил!
}

function fetchData(url) {
  useEffect(() => { /* ... */ }); // Нарушение правил!
}
```

Если функция не начинается с `use`, вы не можете использовать в ней другие хуки — это нарушение правил.

## Частые ошибки и их исправление

### Ошибка 1: Хук в обработчике события

```jsx
// ❌ Неправильно
function Button({ onClick }) {
  return (
    <button
      onClick={() => {
        const [clicked, setClicked] = useState(false); // Нарушение!
        setClicked(true);
        onClick();
      }}
    >
      Click me
    </button>
  );
}

// ✅ Правильно
function Button({ onClick }) {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    onClick();
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Ошибка 2: Хук в цикле

```jsx
// ❌ Неправильно
function TodoList({ items }) {
  return items.map((item, index) => {
    const [isExpanded, setIsExpanded] = useState(false); // Нарушение!
    return (
      <div key={item.id}>
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {item.title}
        </button>
        {isExpanded && <p>{item.description}</p>}
      </div>
    );
  });
}

// ✅ Правильно — выноси в отдельный компонент
function TodoItem({ item }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {item.title}
      </button>
      {isExpanded && <p>{item.description}</p>}
    </div>
  );
}

function TodoList({ items }) {
  return items.map(item => <TodoItem key={item.id} item={item} />);
}
```

### Ошибка 3: Ранний возврат до хука

```jsx
// ❌ Неправильно
function UserCard({ user }) {
  if (!user) return null; // Ранний возврат ДО хуков

  const [isExpanded, setIsExpanded] = useState(false); // Хук после возврата!
  const formattedDate = useMemo(
    () => formatDate(user.createdAt),
    [user.createdAt]
  );

  return <div>{/* ... */}</div>;
}

// ✅ Правильно
function UserCard({ user }) {
  // Все хуки — до любых условных возвратов
  const [isExpanded, setIsExpanded] = useState(false);
  const formattedDate = useMemo(
    () => (user ? formatDate(user.createdAt) : ''),
    [user]
  );

  if (!user) return null; // Ранний возврат ПОСЛЕ хуков

  return <div>{/* ... */}</div>;
}
```

## TypeScript и правила хуков

TypeScript помогает соблюдать правила хуков через типизацию возвращаемых значений.

```typescript
// Правильно типизированный кастомный хук
function useToggle(initialValue: boolean = false): [boolean, () => void] {
  const [value, setValue] = useState<boolean>(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}

// Использование
function Component() {
  const [isOpen, toggleOpen] = useToggle(false);
  // TypeScript знает: isOpen — boolean, toggleOpen — () => void
  return <Modal isOpen={isOpen} onClose={toggleOpen} />;
}
```

## Резюме

| Правило | Описание | Почему важно |
|---------|----------|--------------|
| Только верхний уровень | Не используй хуки в условиях, циклах, вложенных функциях | React отслеживает хуки по порядку вызова |
| Только React-функции | Вызывай хуки только из компонентов и кастомных хуков | Гарантирует доступ к состоянию React |
| Префикс `use` | Кастомные хуки должны начинаться с `use` | React и ESLint используют это для идентификации хуков |

Соблюдение этих правил — основа написания корректного и предсказуемого кода с использованием React Hooks.

## Дополнительные ресурсы

- [Rules of Hooks — React Docs](https://react.dev/reference/rules/rules-of-hooks)
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [Custom Hooks — React Docs](https://react.dev/learn/reusing-logic-with-custom-hooks)
