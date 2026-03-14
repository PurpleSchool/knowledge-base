---
metaTitle: "Transition API в React — плавные обновления интерфейса"
metaDescription: "Полное руководство по Transition API в React 18+: useTransition, startTransition, разница между срочными и несрочными обновлениями. Практические примеры для повышения отзывчивости UI."
author: Олег Марков
title: Transition API — плавные обновления интерфейса в React
preview: Разбираемся с Transition API в React 18 — механизмом разделения обновлений состояния на срочные и несрочные. Вы узнаете, как useTransition и startTransition помогают устранить «подвисания» интерфейса при тяжёлых перерисовках, и научитесь применять их на практике.
---

## Введение

Одна из самых заметных проблем при разработке React-приложений — «подвисание» интерфейса. Пользователь вводит текст в поле поиска, переключает вкладку или нажимает фильтр, а UI буквально замирает на несколько сотен миллисекунд. Это происходит потому, что React обрабатывает все обновления состояния одинаково — синхронно и без приоритизации.

**Transition API** — это набор инструментов в React 18, который позволяет явно указать: вот это обновление *срочное* (нажатие клавиши, клик), а вот это — *несрочное* (перерисовка большого списка, навигация). React выполнит срочные обновления немедленно, а несрочные отложит, не блокируя UI.

В Transition API входят два основных инструмента:
- **`useTransition`** — хук для компонентов, предоставляет флаг `isPending` для отображения состояния загрузки
- **`startTransition`** — функция для использования вне компонентов (в утилитах, вне хуков)

Если вы хотите глубже изучить React и его возможности, рекомендую [курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=transition-api).

## Проблема: все обновления одинаково приоритетны

До React 18 все вызовы `setState` обрабатывались с одинаковым приоритетом. React начинал рендер и не останавливался, пока не завершит его полностью.

Вот классический пример проблемы — поиск по большому списку:

```tsx
import React, { useState } from 'react';

// Компонент с тяжёлым рендером — имитирует 10 000 элементов
const HeavyList = ({ query }: { query: string }) => {
  const items = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`).filter(
    (item) => item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

// Проблема: каждое нажатие клавиши блокирует UI
function SearchWithoutTransition() {
  const [query, setQuery] = useState('');

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск..."
      />
      <HeavyList query={query} />
    </div>
  );
}
```

При каждом вводе символа React сразу перерисовывает `HeavyList` с 10 000 элементами. Пока идёт рендер, интерфейс не реагирует на новые вводы — пользователь замечает заметную задержку.

## Решение: Transition API

Transition API позволяет сказать React: «обновление поискового запроса в `HeavyList` — несрочное, выполни его, когда будет свободное время».

### Синтаксис useTransition

```tsx
const [isPending, startTransition] = useTransition();
```

`useTransition` возвращает массив из двух элементов:

| Элемент | Тип | Описание |
|---------|-----|----------|
| `isPending` | `boolean` | `true`, пока несрочное обновление в процессе |
| `startTransition` | `(callback: () => void) => void` | Функция, оборачивающая несрочные обновления |

### Пример с useTransition

```tsx
import React, { useState, useTransition } from 'react';

const HeavyList = ({ query }: { query: string }) => {
  const items = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`).filter(
    (item) => item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

function SearchWithTransition() {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Срочное обновление — отображение введённого символа в поле
    setInputValue(e.target.value);

    // Несрочное обновление — перерисовка тяжёлого списка
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input
        value={inputValue}
        onChange={handleChange}
        placeholder="Поиск..."
      />
      {isPending && <span>Загрузка результатов...</span>}
      <HeavyList query={query} />
    </div>
  );
}
```

Теперь поле ввода обновляется мгновенно (срочное обновление), а `HeavyList` перерисовывается с задержкой (несрочное). Пока идёт несрочный рендер, `isPending === true` — можно показать индикатор загрузки.

## startTransition — автономная функция

`startTransition` также экспортируется из пакета `react` как самостоятельная функция. Используйте её там, где нет доступа к хукам: вне компонентов, в утилитах, обработчиках событий вне React-дерева.

```tsx
import { startTransition } from 'react';

// Использование вне компонента
function handleNavigate(newPage: string) {
  startTransition(() => {
    setCurrentPage(newPage); // несрочное обновление
  });
}
```

### Отличие useTransition от startTransition

| Характеристика | `useTransition` | `startTransition` |
|---------------|-----------------|-------------------|
| Где используется | Только в компонентах (хук) | Везде, включая утилиты |
| Флаг `isPending` | Есть | Нет |
| Доступ к состоянию | Полный | Только вызов функции |

Правило простое: если вам нужен `isPending` — используйте `useTransition`. Если просто нужно пометить обновление как несрочное — достаточно `startTransition`.

## Срочные vs несрочные обновления

Ключевая концепция Transition API — разделение обновлений на два типа.

### Срочные обновления (Urgent Updates)

Это обновления, которые пользователь ожидает *немедленно*:
- Нажатие клавиши → символ появляется в поле
- Клик по кнопке → кнопка визуально нажимается
- Скролл страницы → страница прокручивается

Такие обновления должны выполняться синхронно. Малейшая задержка воспринимается как «лаг».

```tsx
// Срочное обновление — выполняется немедленно
setInputValue(e.target.value);
```

### Несрочные обновления (Transition Updates)

Это обновления, где небольшая задержка допустима:
- Обновление списка результатов поиска
- Переход между страницами/вкладками
- Обновление графика или визуализации данных
- Рендер тяжёлого компонента после действия пользователя

```tsx
// Несрочное обновление — React может отложить его
startTransition(() => {
  setSearchResults(filteredData);
});
```

### Что происходит внутри React

Когда React обрабатывает обновления, он всегда отдаёт приоритет срочным:

1. Пользователь вводит символ → срочное обновление ставится в очередь
2. Если в это время идёт несрочный рендер — React **прерывает** его
3. Сначала выполняется срочное обновление (поле ввода обновляется)
4. Затем React возобновляет несрочный рендер с новыми данными

Этот механизм называется *прерываемым рендерингом* и является частью Concurrent Mode.

## Практические примеры

### Пример 1: Навигация между вкладками

```tsx
import React, { useState, useTransition, Suspense, lazy } from 'react';

// Ленивая загрузка тяжёлых вкладок
const HeavyTab = lazy(() => import('./HeavyTab'));
const LightTab = lazy(() => import('./LightTab'));

type Tab = 'light' | 'heavy';

function TabsWithTransition() {
  const [activeTab, setActiveTab] = useState<Tab>('light');
  const [isPending, startTransition] = useTransition();

  const handleTabClick = (tab: Tab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div>
      <nav>
        <button
          onClick={() => handleTabClick('light')}
          style={{ opacity: isPending ? 0.7 : 1 }}
        >
          Лёгкая вкладка
        </button>
        <button
          onClick={() => handleTabClick('heavy')}
          style={{ opacity: isPending ? 0.7 : 1 }}
        >
          Тяжёлая вкладка
        </button>
      </nav>

      {/* isPending позволяет оставить старый контент видимым во время перехода */}
      <div style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        <Suspense fallback={<p>Загрузка вкладки...</p>}>
          {activeTab === 'light' ? <LightTab /> : <HeavyTab />}
        </Suspense>
      </div>
    </div>
  );
}
```

Обратите внимание: при переходе вкладок `isPending === true`, и мы снижаем `opacity` текущего контента, показывая, что переход в процессе. Кнопки при этом остаются кликабельными — UI не блокируется.

### Пример 2: Фильтрация и сортировка данных

```tsx
import React, { useState, useTransition, useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

type SortField = 'name' | 'price';

function ProductCatalog({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [displayFilter, setDisplayFilter] = useState('');
  const [displaySortBy, setDisplaySortBy] = useState<SortField>('name');
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Обновляем поле ввода сразу (срочное)
    setFilter(e.target.value);

    // Тяжёлую фильтрацию откладываем (несрочное)
    startTransition(() => {
      setDisplayFilter(e.target.value);
    });
  };

  const handleSortChange = (field: SortField) => {
    setSortBy(field);
    startTransition(() => {
      setDisplaySortBy(field);
    });
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) =>
        p.name.toLowerCase().includes(displayFilter.toLowerCase())
      )
      .sort((a, b) => {
        if (displaySortBy === 'price') return a.price - b.price;
        return a.name.localeCompare(b.name);
      });
  }, [products, displayFilter, displaySortBy]);

  return (
    <div>
      <div>
        <input
          value={filter}
          onChange={handleFilterChange}
          placeholder="Фильтр по названию"
        />
        <button onClick={() => handleSortChange('name')}>
          По названию {sortBy === 'name' && '✓'}
        </button>
        <button onClick={() => handleSortChange('price')}>
          По цене {sortBy === 'price' && '✓'}
        </button>
      </div>

      {isPending && <div className="loading-bar">Обновление списка...</div>}

      <ul style={{ opacity: isPending ? 0.7 : 1 }}>
        {filteredProducts.map((product) => (
          <li key={product.id}>
            {product.name} — {product.price} ₽
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Пример 3: Оптимистичные переходы с откатом

```tsx
import React, { useState, useTransition } from 'react';

interface Page {
  id: string;
  title: string;
  content: string;
}

async function fetchPage(id: string): Promise<Page> {
  // Имитация API-запроса
  const response = await fetch(`/api/pages/${id}`);
  return response.json();
}

function PageNavigator() {
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const navigateTo = async (pageId: string) => {
    setError(null);

    startTransition(async () => {
      try {
        const page = await fetchPage(pageId);
        setCurrentPage(page);
      } catch (err) {
        // При ошибке React откатит несрочное обновление
        setError('Не удалось загрузить страницу');
      }
    });
  };

  return (
    <div>
      <nav>
        <button onClick={() => navigateTo('home')} disabled={isPending}>
          Главная
        </button>
        <button onClick={() => navigateTo('about')} disabled={isPending}>
          О нас
        </button>
        {isPending && <span>Загрузка...</span>}
      </nav>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {currentPage ? (
        <article>
          <h1>{currentPage.title}</h1>
          <p>{currentPage.content}</p>
        </article>
      ) : (
        <p>Выберите страницу</p>
      )}
    </div>
  );
}
```

> **Примечание:** Поддержка `async`-функций внутри `startTransition` добавлена в React 19. В React 18 коллбэк должен быть синхронным, а асинхронные операции нужно выполнять до вызова `startTransition`.

## Transition API и Suspense

Transition API тесно интегрирован с `Suspense`. Когда несрочное обновление вызывает «приостановку» (Suspense), React не показывает fallback немедленно — вместо этого он продолжает показывать *предыдущий* контент, пока `isPending === true`.

```tsx
import React, { useState, useTransition, Suspense } from 'react';

// Компонент, который «приостанавливается» при загрузке данных
function UserProfile({ userId }: { userId: string }) {
  // Этот хук бросает Promise при первом вызове (упрощённо)
  const user = useUserData(userId); // кастомный хук с поддержкой Suspense

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
    </div>
  );
}

function UserGallery() {
  const [userId, setUserId] = useState('user-1');
  const [pendingUserId, setPendingUserId] = useState('user-1');
  const [isPending, startTransition] = useTransition();

  const selectUser = (id: string) => {
    // Показываем выбранного пользователя в кнопке немедленно
    setPendingUserId(id);

    // Загрузку данных откладываем
    startTransition(() => {
      setUserId(id);
    });
  };

  return (
    <div>
      <aside>
        {['user-1', 'user-2', 'user-3'].map((id) => (
          <button
            key={id}
            onClick={() => selectUser(id)}
            style={{
              fontWeight: pendingUserId === id ? 'bold' : 'normal',
            }}
          >
            {id}
          </button>
        ))}
      </aside>

      {/* Suspense показывает fallback только при первой загрузке */}
      {/* При Transition-переходе — сохраняется старый контент */}
      <Suspense fallback={<p>Первоначальная загрузка...</p>}>
        <div style={{ opacity: isPending ? 0.6 : 1 }}>
          <UserProfile userId={userId} />
        </div>
      </Suspense>
    </div>
  );
}
```

Это ключевое отличие от обычного обновления через Suspense: без Transition React сразу показывает fallback при каждой смене `userId`. С Transition — сохраняет старый контент до готовности нового.

## Ограничения и правила

### 1. Только синхронный код внутри коллбэка (React 18)

В React 18 функция внутри `startTransition` должна выполняться синхронно. React не будет «ждать» асинхронных операций.

```tsx
// ❌ Неправильно в React 18 — setTimeout не является частью transition
startTransition(() => {
  setTimeout(() => {
    setState(newValue); // Это обновление НЕ будет несрочным
  }, 0);
});

// ✅ Правильно — async в React 19
// В React 18: выполните асинхронную операцию до startTransition
async function handleClick() {
  const data = await fetchData(); // ожидаем до startTransition
  startTransition(() => {
    setState(data); // синхронный вызов внутри
  });
}
```

### 2. Нельзя управлять текстовыми полями через transition

Если вы попытаетесь обновить `value` управляемого `<input>` внутри `startTransition`, это вызовет ошибку, потому что React ожидает немедленного обновления для текстовых полей.

```tsx
// ❌ Неправильно — управляемый input нельзя обновлять как transition
startTransition(() => {
  setInputValue(e.target.value); // Вызовет предупреждение/ошибку
});

// ✅ Правильно — разделяем срочное и несрочное обновление
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setInputValue(e.target.value); // срочно — значение поля
  startTransition(() => {
    setFilterQuery(e.target.value); // несрочно — тяжёлый список
  });
};
```

### 3. Нельзя прерывать, если обновление уже началось

`startTransition` помечает обновление как несрочное, но не гарантирует точное время выполнения. React может выполнить несрочное обновление быстрее, если нет срочных обновлений в очереди.

### 4. useTransition — только в компонентах и кастомных хуках

Как любой хук, `useTransition` нельзя вызывать за пределами компонента или на верхнем уровне вне функции-компонента. Для таких случаев используйте `startTransition` из `'react'`.

```tsx
// ❌ Неправильно — вне компонента
const [isPending, startTransition] = useTransition();

// ✅ Правильно — вне компонента
import { startTransition } from 'react';
```

## useTransition vs useDeferredValue

Оба инструмента решают схожую задачу — снижение приоритета «тяжёлых» обновлений. Разница в подходе:

| Характеристика | `useTransition` | `useDeferredValue` |
|---------------|-----------------|-------------------|
| Управление | Оборачиваем *установку состояния* | Оборачиваем *значение* |
| Где применяется | Там, где есть доступ к `setState` | Там, где только читаем значение |
| `isPending` | Есть | Нет |
| Сложность | Чуть больше кода | Проще в использовании |

```tsx
// useTransition — контролируем вызов setState
const [isPending, startTransition] = useTransition();
const handleChange = (val: string) => {
  setInputValue(val); // срочно
  startTransition(() => setQuery(val)); // несрочно
};

// useDeferredValue — просто откладываем значение
const deferredQuery = useDeferredValue(query);
// deferredQuery обновится позже, чем query
```

Используйте `useDeferredValue`, когда у вас нет прямого доступа к `setState` (например, в дочернем компоненте или при получении пропсов). В остальных случаях предпочтительнее `useTransition` — он явнее и предоставляет `isPending`.

## Когда использовать Transition API

### Использовать стоит

- Навигация между страницами/вкладками с тяжёлым контентом
- Фильтрация, сортировка, поиск по большим спискам
- Обновление визуализаций, графиков, таблиц
- Переключение темы/языка с перерисовкой многих компонентов
- Любые обновления, где небольшая задержка (100–200 мс) допустима

### Не стоит использовать

- Обновление управляемых полей ввода (`<input>`, `<textarea>`)
- Реакция на критичные для UX события, где нужна немедленная синхронная обратная связь
- Случаи, когда обновление само по себе быстрое — нет смысла его откладывать
- Анимации, требующие точного тайминга (используйте CSS-анимации или библиотеки)

## Transition API в следующих версиях React

### React 19: async transitions

В React 19 добавлена поддержка асинхронных функций внутри `startTransition`. Это открывает новый паттерн — **асинхронные переходы**:

```tsx
// React 19 — async transition
function DataFetcher() {
  const [data, setData] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const loadData = () => {
    startTransition(async () => {
      // Можно await прямо внутри!
      const result = await fetch('/api/data').then((r) => r.json());
      setData(result);
    });
  };

  return (
    <div>
      <button onClick={loadData} disabled={isPending}>
        {isPending ? 'Загрузка...' : 'Загрузить данные'}
      </button>
      <ul>
        {data.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

Связанный с этим хук `useActionState` в React 19 строится именно на механизме Transitions.

## Отладка и DevTools

В React DevTools Profiler переходы отображаются особым образом — как отложенные обновления. Это помогает понять, какие рендеры вызваны несрочными обновлениями.

Чтобы идентифицировать transition в DevTools, нажатие на узел дерева компонентов покажет источник обновления: `startTransition` или `useTransition`.

## Итоги

Transition API — это мощный инструмент для повышения отзывчивости React-приложений:

- **`useTransition`** — хук, возвращает `[isPending, startTransition]`. Используйте в компонентах, когда нужно показывать состояние ожидания.
- **`startTransition`** — отдельная функция для несрочных обновлений вне компонентов или когда `isPending` не нужен.
- **Срочные обновления** (ввод, клики) всегда имеют приоритет над несрочными.
- **Несрочные обновления** внутри `startTransition` могут быть прерваны, если придут срочные.
- Работает в связке с **Suspense** — при transition React показывает старый контент вместо fallback.
- В React 18 коллбэк должен быть синхронным; в React 19 поддерживаются `async`-функции.

Правильное разделение срочных и несрочных обновлений кардинально улучшает UX — интерфейс остаётся отзывчивым даже при сложных перерисовках.
