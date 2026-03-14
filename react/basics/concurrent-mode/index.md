---
metaTitle: "Concurrent Mode в React — конкурентный режим рендеринга"
metaDescription: "Полное руководство по Concurrent Mode в React 18: как работает планировщик, прерывание рендера, Suspense и Transitions. Практические примеры useTransition и startTransition."
author: Олег Марков
title: Concurrent Mode — конкурентный режим в React
preview: Разбираемся с Concurrent Mode в React 18 — конкурентным режимом рендеринга, который позволяет React прерывать, откладывать и приоритизировать обновления интерфейса для обеспечения максимальной отзывчивости приложения.
---

## Введение

До появления React 18 рендеринг был полностью синхронным и блокирующим: React начинал обновление и не останавливался, пока не завершит его. Любое сложное обновление, занимающее более 16 мс, приводило к видимым «подвисаниям» интерфейса. Пользователь нажимал кнопку или вводил текст — и наблюдал за замёрзшим UI.

**Concurrent Mode** (конкурентный режим) — это фундаментальное изменение внутренней архитектуры React, которое позволяет рендерингу быть *прерываемым*. React теперь может приостановить работу над одним обновлением, обработать более приоритетное событие (например, нажатие клавиши) и вернуться к прерванному обновлению позже.

Начиная с React 18, конкурентные возможности включены по умолчанию при использовании `createRoot`. Это не отдельный «режим» в смысле переключателя, а набор функций, которые активируются при использовании конкурентных API: `useTransition`, `startTransition`, `useDeferredValue`, `Suspense`.

Если вы хотите глубже изучить React и его внутренние механизмы, рекомендую [курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=concurrent-mode).

## Как работает планировщик (Scheduler)

В основе Concurrent Mode лежит внутренний модуль React — **Scheduler**. Он отвечает за распределение работы по рендерингу во времени.

### Архитектура Fiber

Concurrent Mode стал возможен благодаря переходу React с рекурсивного алгоритма «Stack Reconciler» (React 15) на **Fiber Reconciler** (React 16+). Fiber — это переработанная внутренняя архитектура, где каждый компонент представлен отдельной единицей работы (fiber-узлом).

Каждый fiber-узел содержит:
- Тип компонента и пропсы
- Ссылки на родительский, дочерний и соседний узлы
- Информацию о состоянии и эффектах
- **Приоритет обновления** — ключевое поле для Concurrent Mode

### Уровни приоритетов

Scheduler назначает обновлениям один из нескольких уровней приоритета:

| Приоритет | Примеры | Таймаут |
|-----------|---------|---------|
| **Immediate** | Синхронные обновления, критичные для UX | 0 мс |
| **UserBlocking** | Клики, ввод с клавиатуры | ~250 мс |
| **Normal** | Обновления данных, fetch | ~5 с |
| **Low** | Аналитика, логирование | ~10 с |
| **Idle** | Фоновые задачи | бесконечно |

```tsx
import { flushSync } from 'react-dom';
import { startTransition } from 'react';

// UserBlocking приоритет — React обработает это в первую очередь
const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  // Срочное обновление: немедленно показать введённый символ
  setInputValue(e.target.value);

  // Normal/Low приоритет — React может отложить это обновление
  startTransition(() => {
    setSearchResults(filterItems(e.target.value));
  });
};
```

### Работа планировщика

Scheduler использует **кооперативную многозадачность**: он делит работу на небольшие единицы и периодически «спрашивает» браузер, нет ли более важных задач. Для этого применяется `MessageChannel` (или `setTimeout` как запасной вариант) — оба механизма позволяют уступить управление браузеру между порциями работы.

```
Фрейм браузера (16.67 мс при 60 FPS):
┌─────────────────────────────────────────────────────┐
│ Ввод пользователя  │ React работа (5 мс) │ Рисование │
│    (1 мс)          │ → проверяет время   │   (3 мс)  │
└─────────────────────────────────────────────────────┘
                          ↓
              Если > deadline — прерваться,
              передать управление браузеру
```

## Прерывание рендера (Interruptible Rendering)

До Concurrent Mode React не мог остановиться на полпути при обновлении — это называлось «blocking rendering». С Concurrent Mode React получил возможность **прерывать**, **откладывать** и **отменять** незавершённые обновления.

### Как работает прерывание

Когда React обрабатывает дерево компонентов в конкурентном режиме:

1. Он выполняет работу небольшими «чанками» (порциями)
2. После каждого чанка проверяет, нет ли более приоритетных задач
3. Если есть — прерывает текущую работу и выполняет приоритетную задачу
4. Затем либо продолжает прерванную работу, либо начинает заново (если данные изменились)

```tsx
// Пример: без Concurrent Mode это «заморозило» бы UI
function HeavyComponent({ items }: { items: string[] }) {
  // В синхронном режиме React перерисует все 50 000 элементов без остановки
  // В Concurrent Mode React может прервать этот рендер при срочном вводе
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{expensiveTransform(item)}</li>
      ))}
    </ul>
  );
}
```

### Double-rendering в StrictMode

В режиме разработки `StrictMode` намеренно вызывает двойной рендер компонентов — это связано с тем, что в Concurrent Mode React может отбрасывать незавершённые рендеры. `StrictMode` помогает выявить побочные эффекты в render-фазе, которые не должны там находиться.

```tsx
import { StrictMode } from 'react';

// В development: каждый компонент рендерится дважды
// В production: один раз
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

## Связь с Suspense

**Suspense** — это механизм, позволяющий компонентам «приостановить» рендеринг до тех пор, пока не будут готовы нужные данные или код. В синхронном React Suspense работал только для code splitting (`React.lazy`). С Concurrent Mode Suspense стал полноценным инструментом для управления асинхронными состояниями.

### Как Suspense интегрируется с Concurrent Mode

Когда компонент «приостанавливается» (throws Promise), React в конкурентном режиме:

1. Не блокирует весь UI — продолжает рендерить другие части дерева
2. Показывает ближайший `fallback` из `<Suspense>`
3. Продолжает «в фоне» пытаться завершить приостановленный рендер
4. Когда данные готовы — мгновенно переключается на результат

```tsx
import { Suspense, lazy } from 'react';

// Code splitting — компонент загружается лениво
const Dashboard = lazy(() => import('./Dashboard'));

function App() {
  return (
    <Suspense fallback={<div>Загрузка дашборда...</div>}>
      <Dashboard />
    </Suspense>
  );
}
```

### Suspense с серверными данными (React 19+)

```tsx
// Компонент, который «приостанавливается» при ожидании данных
async function UserProfile({ userId }: { userId: string }) {
  // В React Server Components это работает нативно
  const user = await fetchUser(userId);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <UserProfile userId="123" />
    </Suspense>
  );
}
```

### SuspenseList для координации загрузки

`SuspenseList` (экспериментальный) позволяет координировать порядок появления нескольких Suspense-компонентов:

```tsx
import { SuspenseList, Suspense } from 'react';

function FeedPage() {
  return (
    // revealOrder: forwards — показывать по порядку сверху вниз
    // tail: collapsed — показывать только один fallback
    <SuspenseList revealOrder="forwards" tail="collapsed">
      <Suspense fallback={<ArticleSkeleton />}>
        <Article id="1" />
      </Suspense>
      <Suspense fallback={<ArticleSkeleton />}>
        <Article id="2" />
      </Suspense>
      <Suspense fallback={<ArticleSkeleton />}>
        <Article id="3" />
      </Suspense>
    </SuspenseList>
  );
}
```

## Transitions (useTransition, startTransition)

Transitions — это центральная концепция Concurrent Mode для разработчиков. Они позволяют явно пометить обновления состояния как «несрочные», давая React право откладывать их выполнение.

### startTransition

`startTransition` — функция (не хук), которую можно вызвать в любом месте:

```tsx
import { startTransition, useState } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Срочное обновление — поле ввода должно реагировать мгновенно
    setQuery(e.target.value);

    // Несрочное обновление — результаты поиска можно показать чуть позже
    startTransition(() => {
      setResults(performSearch(e.target.value));
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} placeholder="Поиск..." />
      <ul>
        {results.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </div>
  );
}
```

### useTransition

`useTransition` — хук, который дополнительно предоставляет флаг `isPending`, позволяющий показывать индикатор загрузки:

```tsx
import { useTransition, useState } from 'react';

function TabsComponent() {
  const [activeTab, setActiveTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  const switchTab = (tab: string) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div>
      <nav>
        {['home', 'about', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            style={{
              // Визуальная индикация, что переход выполняется
              opacity: isPending ? 0.7 : 1
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* isPending: true — React рендерит новую вкладку в фоне */}
      {isPending && <span>Загрузка...</span>}

      {/* Текущая вкладка остаётся видимой, пока грузится новая */}
      <TabContent tab={activeTab} />
    </div>
  );
}
```

### Transition с Suspense — избегаем нежелательного fallback

Одно из важнейших преимуществ Transitions — они предотвращают показ `fallback` при навигации между уже загруженными страницами:

```tsx
import { useTransition, Suspense, useState } from 'react';

function Router() {
  const [page, setPage] = useState('home');
  const [isPending, startTransition] = useTransition();

  const navigate = (newPage: string) => {
    startTransition(() => {
      setPage(newPage);
    });
  };

  return (
    <div>
      <nav>
        <button onClick={() => navigate('home')}>Главная</button>
        <button onClick={() => navigate('profile')}>Профиль</button>
        <button onClick={() => navigate('settings')}>Настройки</button>
      </nav>

      {/*
        Без Transition: при клике сразу показывается fallback
        С Transition: текущая страница остаётся пока грузится новая,
        fallback показывается только если загрузка занимает слишком долго
      */}
      <Suspense fallback={<PageSkeleton />}>
        {isPending && <div className="loading-indicator">Переход...</div>}
        <Page name={page} />
      </Suspense>
    </div>
  );
}
```

### Практический пример: фильтрация большого списка

```tsx
import { useState, useTransition, useMemo } from 'react';

// Имитация большого набора данных
const ITEMS = Array.from({ length: 10_000 }, (_, i) => ({
  id: i,
  name: `Элемент ${i}`,
  category: i % 5 === 0 ? 'special' : 'normal',
}));

function HeavyFilteredList() {
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Это обновление срочное — поле должно реагировать немедленно
    const value = e.target.value;
    setFilter(value); // Оба setState можно разделить

    // Фильтрация 10 000 элементов — несрочная операция
    startTransition(() => {
      setFilter(value);
    });
  };

  const filteredItems = useMemo(
    () => ITEMS.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    ),
    [filter]
  );

  return (
    <div>
      <input
        value={filter}
        onChange={handleFilterChange}
        placeholder="Фильтр..."
      />

      <p style={{ opacity: isPending ? 0.5 : 1 }}>
        Найдено: {filteredItems.length}
        {isPending && ' (обновляется...)'}
      </p>

      <ul style={{ opacity: isPending ? 0.7 : 1 }}>
        {filteredItems.slice(0, 100).map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Включение Concurrent Mode

Concurrent Mode включается при использовании нового API `createRoot` (React 18+):

```tsx
import { createRoot } from 'react-dom/client';
import App from './App';

// Новый API — включает все конкурентные возможности
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

Старый API `ReactDOM.render` работает в «легасі» режиме без конкурентных возможностей:

```tsx
// Устаревший API — синхронный рендеринг без Concurrent Mode
// Не использовать в новых проектах!
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));
```

### Автоматический батчинг в React 18

Дополнительная возможность Concurrent Mode — автоматический батчинг обновлений состояния. В React 17 батчинг работал только внутри обработчиков событий React. В React 18 батчинг применяется везде: в `setTimeout`, `Promise`, нативных обработчиках событий:

```tsx
// React 17: два отдельных рендера
setTimeout(() => {
  setCount(c => c + 1); // рендер
  setFlag(f => !f);     // ещё один рендер
}, 1000);

// React 18 с createRoot: один рендер (автоматический батчинг)
setTimeout(() => {
  setCount(c => c + 1); // не рендерит
  setFlag(f => !f);     // один рендер в конце
}, 1000);

// Если нужно отключить батчинг в отдельном случае:
import { flushSync } from 'react-dom';

flushSync(() => setCount(c => c + 1)); // сразу рендерит
flushSync(() => setFlag(f => !f));      // сразу рендерит
```

## Когда использовать Concurrent Mode API

Не все обновления нужно оборачивать в `startTransition`. Используйте правильный инструмент для каждой ситуации:

| Ситуация | Инструмент |
|----------|-----------|
| Ввод пользователя (текст, чекбокс) | `useState` — без transition |
| Фильтрация/сортировка большого списка | `startTransition` / `useTransition` |
| Навигация между страницами | `useTransition` |
| Отложенное обновление производного значения | `useDeferredValue` |
| Ожидание загрузки данных/кода | `Suspense` |
| Начальная загрузка страницы | `Suspense` + `useTransition` |

```tsx
// ✅ Правильно: transition для несрочных обновлений
const [isPending, startTransition] = useTransition();

const handleSearch = (query: string) => {
  setQuery(query);                          // срочно: поле ввода
  startTransition(() => setResults(...));   // несрочно: результаты
};

// ❌ Неправильно: transition для срочных UI-обновлений
startTransition(() => {
  setInputValue(e.target.value); // поле ввода должно реагировать мгновенно!
});
```

## Заключение

Concurrent Mode — это фундаментальное изменение архитектуры React, которое открывает новые возможности для создания отзывчивых интерфейсов:

- **Планировщик (Scheduler)** распределяет работу по приоритетам и позволяет React «уступать» браузеру при необходимости
- **Прерываемый рендеринг** означает, что сложные обновления не блокируют UI
- **Suspense** в конкурентном режиме позволяет элегантно управлять асинхронными состояниями
- **Transitions** дают разработчикам явный контроль над приоритетами обновлений
- **Автоматический батчинг** сокращает количество лишних рендеров

Начиная с React 18, все эти возможности доступны «из коробки» при использовании `createRoot`. Ключ к эффективному применению — понимание, какие обновления срочные (ввод пользователя), а какие можно отложить (вычисление результатов, навигация).

Для углублённого изучения архитектуры React и производительных паттернов рекомендую [курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=concurrent-mode).
