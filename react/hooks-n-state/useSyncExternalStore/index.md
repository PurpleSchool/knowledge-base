---
metaTitle: "useSyncExternalStore в React — работа с внешними сторами"
metaDescription: "Полное руководство по хуку useSyncExternalStore в React 18. Узнайте, как подписываться на внешние источники данных, обеспечивать совместимость с Concurrent..."
author: Олег Марков
title: useSyncExternalStore — работа с внешними сторами
preview: Хук useSyncExternalStore позволяет безопасно подписываться на внешние источники данных вне React. Разберём синтаксис, интеграцию с Redux и Zustand, поддержку SSR и Concurrent Mode, а также типичные паттерны использования.
---

## Введение

Современные React-приложения редко хранят весь стейт внутри самого React. Чаще всего часть данных живёт во внешних хранилищах: Redux-сторах, Zustand, MobX, браузерных API вроде `localStorage` или `history`. До React 18 интеграция таких хранилищ с React строилась на подписках через `useEffect` и `useState`, что создавало так называемую проблему «разрыва рендера» (tearing) при использовании Concurrent Mode.

`useSyncExternalStore` — хук, появившийся в React 18, который решает эту проблему. Он предоставляет официальный, безопасный способ подписки на любой внешний источник данных: от глобального стора до браузерного API. При этом React гарантирует, что все компоненты, подписанные на один и тот же стор, видят согласованный снимок данных — даже в Concurrent Mode.

Если вы хотите глубже разобраться в механизмах React и научиться строить сложные приложения — приходите на [наш курс по React](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useSyncExternalStore). Там мы разбираем все аспекты современного React на практических проектах.

## Что такое useSyncExternalStore и зачем он нужен

До появления `useSyncExternalStore` разработчики использовали `useEffect` + `useState` для подписки на внешние данные. Вот как выглядела типичная реализация:

```tsx
// ❌ Проблемный подход — уязвим к tearing в Concurrent Mode
import { useState, useEffect } from 'react';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return width;
}
```

Проблема этого подхода: в Concurrent Mode React может прерывать и возобновлять рендер. Если между начальным рендером и подпиской (которая происходит в `useEffect` после монтирования) данные успеют измениться — компонент отобразит устаревшее значение. Если несколько компонентов подписаны на один стор, они могут одновременно показывать разные снимки данных — это и называется «tearing» (разрывом).

`useSyncExternalStore` решает эту задачу на уровне React runtime, синхронизируя чтение стора с рендер-циклом:

```tsx
// ✅ Правильный подход с useSyncExternalStore
import { useSyncExternalStore } from 'react';

function useWindowWidth() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerWidth,       // getSnapshot для браузера
    () => 1024                     // getServerSnapshot для SSR (опционально)
  );
}
```

Главные преимущества `useSyncExternalStore`:
- **Защита от tearing** — все компоненты видят согласованный снимок данных.
- **Concurrent Mode совместимость** — безопасная работа с прерываемым рендерингом React.
- **SSR поддержка** — отдельный `getServerSnapshot` для серверного рендеринга.
- **Без лишних зависимостей** — встроенный хук React 18, не требует сторонних библиотек.

## Синтаксис useSyncExternalStore

```tsx
const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?);
```

| Параметр | Тип | Описание |
|----------|-----|---------|
| `subscribe` | `(callback: () => void) => () => void` | Функция подписки. Принимает колбэк, который нужно вызывать при изменении стора. Возвращает функцию отписки |
| `getSnapshot` | `() => Snapshot` | Функция, возвращающая текущий снимок данных из стора. Должна возвращать одинаковое значение, пока стор не изменился |
| `getServerSnapshot` | `() => Snapshot` | (Опционально) Функция для SSR. Если не указана и компонент рендерится на сервере — будет ошибка |

| Возвращаемое значение | Тип | Описание |
|----------------------|-----|---------|
| `snapshot` | `Snapshot` | Текущий снимок данных из стора |

### Требования к параметрам

**`subscribe`** должна:
- Подписываться на изменения стора и вызывать `callback` при каждом изменении.
- Возвращать функцию отписки (аналогично возврату из `useEffect`).
- Быть стабильной между рендерами (определяйте вне компонента или оборачивайте в `useCallback`).

**`getSnapshot`** должна:
- Возвращать сериализуемое значение или одну и ту же ссылку на объект, если данные не изменились.
- Работать синхронно — React вызывает её во время рендера.
- Давать одинаковый результат при многократных вызовах, если стор не изменился.

## Базовый пример: подписка на браузерное API

```tsx
import { useSyncExternalStore } from 'react';

// Выносим subscribe и getSnapshot за пределы компонента —
// это важно для стабильности ссылок
function subscribeToOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getOnlineServerSnapshot() {
  return true; // На сервере считаем, что соединение есть
}

function NetworkStatus() {
  const isOnline = useSyncExternalStore(
    subscribeToOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );

  return (
    <div>
      Статус: {isOnline ? '🟢 Онлайн' : '🔴 Оффлайн'}
    </div>
  );
}
```

Здесь функции `subscribeToOnline`, `getOnlineSnapshot` и `getOnlineServerSnapshot` определены вне компонента — это гарантирует их стабильность между рендерами без `useCallback`.

## Создание переиспользуемого стора

`useSyncExternalStore` — это примитив для построения своих мини-сторов. Рассмотрим, как создать простой реактивный стор:

```tsx
import { useSyncExternalStore } from 'react';

// Создаём фабрику сторов
function createStore<State>(initialState: State) {
  let state = initialState;
  const listeners = new Set<() => void>();

  function getState(): State {
    return state;
  }

  function setState(newState: Partial<State>) {
    state = { ...state, ...newState };
    listeners.forEach((listener) => listener());
  }

  function subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  return { getState, setState, subscribe };
}

// Создаём конкретный стор для счётчика
const counterStore = createStore({ count: 0 });

// Хук для использования стора
function useCounter() {
  const count = useSyncExternalStore(
    counterStore.subscribe,
    () => counterStore.getState().count
  );

  return {
    count,
    increment: () => counterStore.setState({ count: counterStore.getState().count + 1 }),
    decrement: () => counterStore.setState({ count: counterStore.getState().count - 1 }),
    reset: () => counterStore.setState({ count: 0 }),
  };
}

// Компоненты используют один и тот же стор
function CounterDisplay() {
  const { count } = useCounter();
  return <div>Счётчик: {count}</div>;
}

function CounterControls() {
  const { increment, decrement, reset } = useCounter();
  return (
    <div>
      <button onClick={decrement}>−</button>
      <button onClick={reset}>Сброс</button>
      <button onClick={increment}>+</button>
    </div>
  );
}

function App() {
  return (
    <>
      <CounterDisplay />
      <CounterControls />
    </>
  );
}
```

Оба компонента — `CounterDisplay` и `CounterControls` — подписаны на один стор и всегда видят одинаковое значение `count`.

## Как работает useSyncExternalStore под капотом

React вызывает `getSnapshot` во время каждого рендера и сравнивает результат с предыдущим значением. Если значение изменилось — React запускает принудительный ре-рендер компонента. Если значение не изменилось — компонент не перерисовывается.

```
Жизненный цикл:

1. Первый рендер:
   - React вызывает getSnapshot() → получает текущий снимок
   - Рендерит компонент с этим снимком
   - После монтирования вызывает subscribe(callback)

2. Обновление стора:
   - Стор вызывает callback (переданный в subscribe)
   - React вызывает getSnapshot() снова
   - Сравнивает с предыдущим значением (Object.is)
   - Если отличается → ре-рендер компонента

3. Размонтирование:
   - React вызывает функцию отписки (результат subscribe)
```

Ключевое отличие от `useEffect + useState`: `getSnapshot` вызывается синхронно во время рендера, что позволяет React обнаруживать изменения стора прямо во время рендер-цикла и гарантировать консистентность.

## Интеграция с существующими сторами

### Redux

Redux Toolkit и react-redux начиная с версии 8 используют `useSyncExternalStore` внутренне. Но если вы хотите подписаться на Redux-стор напрямую:

```tsx
import { useSyncExternalStore } from 'react';
import { store } from './store'; // ваш Redux store
import type { RootState } from './store';

function useSelector<T>(selector: (state: RootState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()) // для SSR
  );
}

// Использование
function UserProfile() {
  const user = useSelector((state) => state.user.profile);
  return <div>{user.name}</div>;
}
```

### Zustand

Zustand также использует `useSyncExternalStore` под капотом. При необходимости подписаться на Zustand-стор вне компонента:

```tsx
import { useSyncExternalStore } from 'react';
import { createStore } from 'zustand/vanilla';

interface BearState {
  bears: number;
  addBear: () => void;
}

// Vanilla Zustand store (без React)
const bearStore = createStore<BearState>((set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
}));

// Подписываемся через useSyncExternalStore
function useBears() {
  return useSyncExternalStore(
    bearStore.subscribe,
    () => bearStore.getState().bears,
    () => 0 // SSR snapshot
  );
}

function BearCounter() {
  const bears = useBears();
  return (
    <div>
      <p>Медведей: {bears}</p>
      <button onClick={bearStore.getState().addBear}>Добавить медведя</button>
    </div>
  );
}
```

### localStorage

```tsx
import { useSyncExternalStore, useCallback } from 'react';

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function useLocalStorage(key: string, defaultValue: string = '') {
  const getSnapshot = useCallback(
    () => localStorage.getItem(key) ?? defaultValue,
    [key, defaultValue]
  );

  const value = useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    () => defaultValue // SSR не имеет доступа к localStorage
  );

  const setValue = useCallback(
    (newValue: string) => {
      localStorage.setItem(key, newValue);
      // Вручную уведомляем подписчиков (storage event не срабатывает в текущей вкладке)
      window.dispatchEvent(new StorageEvent('storage', { key }));
    },
    [key]
  );

  return [value, setValue] as const;
}

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Тема: {theme}
    </button>
  );
}
```

## Поддержка SSR

При серверном рендеринге третий аргумент `getServerSnapshot` обязателен — без него React выбросит ошибку, если компонент рендерится на сервере.

```tsx
import { useSyncExternalStore } from 'react';

// Пример: подписка на ширину окна с SSR
function useWindowSize() {
  const width = useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerWidth,   // Клиентский snapshot
    () => 0                    // Серверный snapshot (window недоступен на сервере)
  );

  const height = useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerHeight,
    () => 0
  );

  return { width, height };
}

function ResponsiveLayout() {
  const { width } = useWindowSize();

  return (
    <div>
      {width > 768 ? (
        <DesktopLayout />
      ) : (
        <MobileLayout />
      )}
    </div>
  );
}
```

> **Важно**: Серверный и клиентский снимки могут отличаться — это нормально. React покажет серверный снимок при первом рендере, а после гидратации переключится на клиентский. Если они отличаются, React предупредит о несоответствии при гидратации.

## Типизация с TypeScript

`useSyncExternalStore` полностью типизирован в React 18. TypeScript выводит тип `snapshot` из возвращаемого значения `getSnapshot`:

```tsx
import { useSyncExternalStore } from 'react';

interface StoreState {
  user: {
    name: string;
    email: string;
    isAuthenticated: boolean;
  };
  settings: {
    theme: 'light' | 'dark';
    language: 'ru' | 'en';
  };
}

// Типизированная фабрика стора
function createTypedStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: (): T => state,
    setState: (updater: (prev: T) => T): void => {
      state = updater(state);
      listeners.forEach((cb) => cb());
    },
    subscribe: (callback: () => void): (() => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}

const appStore = createTypedStore<StoreState>({
  user: { name: '', email: '', isAuthenticated: false },
  settings: { theme: 'light', language: 'ru' },
});

// TypeScript автоматически выводит тип из getSnapshot
function useAppStore<T>(selector: (state: StoreState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.getState()),
    () => selector(appStore.getState())
  );
}

function UserGreeting() {
  // TypeScript знает, что name — string
  const name = useAppStore((state) => state.user.name);
  const isAuthenticated = useAppStore((state) => state.user.isAuthenticated);

  if (!isAuthenticated) return <div>Войдите в систему</div>;
  return <div>Привет, {name}!</div>;
}
```

## Продвинутые паттерны

### Паттерн 1: Стор с историей (undo/redo)

```tsx
import { useSyncExternalStore } from 'react';

interface HistoryStore<T> {
  state: T;
  past: T[];
  future: T[];
}

function createHistoryStore<T>(initialState: T) {
  let history: HistoryStore<T> = {
    state: initialState,
    past: [],
    future: [],
  };
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((cb) => cb());

  return {
    getSnapshot: () => history,
    subscribe: (cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    setState: (newState: T) => {
      history = {
        state: newState,
        past: [...history.past, history.state],
        future: [],
      };
      notify();
    },
    undo: () => {
      if (history.past.length === 0) return;
      const previous = history.past[history.past.length - 1];
      history = {
        state: previous,
        past: history.past.slice(0, -1),
        future: [history.state, ...history.future],
      };
      notify();
    },
    redo: () => {
      if (history.future.length === 0) return;
      const next = history.future[0];
      history = {
        state: next,
        past: [...history.past, history.state],
        future: history.future.slice(1),
      };
      notify();
    },
  };
}

const textStore = createHistoryStore('');

function TextEditor() {
  const { state: text, past, future } = useSyncExternalStore(
    textStore.subscribe,
    textStore.getSnapshot,
    textStore.getSnapshot
  );

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => textStore.setState(e.target.value)}
        rows={5}
        cols={40}
      />
      <div>
        <button onClick={textStore.undo} disabled={past.length === 0}>
          Отмена ({past.length})
        </button>
        <button onClick={textStore.redo} disabled={future.length === 0}>
          Повтор ({future.length})
        </button>
      </div>
    </div>
  );
}
```

### Паттерн 2: Подписка на несколько источников

```tsx
import { useSyncExternalStore } from 'react';

// Подписка на медиа-запрос
function useMediaQuery(query: string): boolean {
  const mediaQuery = window.matchMedia(query);

  return useSyncExternalStore(
    (callback) => {
      mediaQuery.addEventListener('change', callback);
      return () => mediaQuery.removeEventListener('change', callback);
    },
    () => mediaQuery.matches,
    () => false // SSR: считаем, что медиа-запрос не совпадает
  );
}

// Подписка на положение прокрутки
function useScrollY(): number {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('scroll', callback, { passive: true });
      return () => window.removeEventListener('scroll', callback);
    },
    () => window.scrollY,
    () => 0
  );
}

// Компонент использует оба хука
function StickyHeader() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const scrollY = useScrollY();
  const isSticky = scrollY > 100;

  return (
    <header
      style={{
        position: isSticky ? 'fixed' : 'static',
        top: 0,
        fontSize: isMobile ? '14px' : '16px',
        background: isSticky ? '#fff' : 'transparent',
        boxShadow: isSticky ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <nav>Навигация</nav>
    </header>
  );
}
```

### Паттерн 3: Оптимизация getSnapshot с мемоизацией

Если `getSnapshot` возвращает объект, важно возвращать стабильные ссылки, иначе React будет перерисовывать компонент при каждом вызове:

```tsx
import { useSyncExternalStore, useRef } from 'react';

interface StoreData {
  items: string[];
  total: number;
}

const dataStore = createStore<StoreData>({ items: [], total: 0 });

// ❌ Проблема: каждый вызов создаёт новый объект
function useBadSnapshot() {
  return useSyncExternalStore(
    dataStore.subscribe,
    () => ({
      items: dataStore.getState().items,
      count: dataStore.getState().items.length,
    }) // новый объект каждый раз → бесконечный рендер
  );
}

// ✅ Правильно: кешируем снимок и возвращаем ту же ссылку
function useGoodSnapshot() {
  const cachedSnapshot = useRef<{ items: string[]; count: number } | null>(null);

  return useSyncExternalStore(dataStore.subscribe, () => {
    const state = dataStore.getState();
    const newSnapshot = { items: state.items, count: state.items.length };

    // Возвращаем кешированный объект, если данные не изменились
    if (
      cachedSnapshot.current &&
      cachedSnapshot.current.items === state.items &&
      cachedSnapshot.current.count === newSnapshot.count
    ) {
      return cachedSnapshot.current;
    }

    cachedSnapshot.current = newSnapshot;
    return cachedSnapshot.current;
  });
}
```

## Типичные ошибки и как их избежать

### Ошибка 1: Нестабильная функция subscribe

```tsx
// ❌ Неправильно: subscribe создаётся внутри компонента
function BadComponent() {
  const count = useSyncExternalStore(
    // Каждый рендер создаёт новую функцию → React постоянно переподписывается
    (callback) => {
      myStore.on('change', callback);
      return () => myStore.off('change', callback);
    },
    () => myStore.getCount()
  );
  return <div>{count}</div>;
}

// ✅ Правильно: subscribe определён вне компонента
function subscribeToMyStore(callback: () => void) {
  myStore.on('change', callback);
  return () => myStore.off('change', callback);
}

function GoodComponent() {
  const count = useSyncExternalStore(
    subscribeToMyStore, // стабильная ссылка
    () => myStore.getCount()
  );
  return <div>{count}</div>;
}
```

### Ошибка 2: Мутация стора без уведомления подписчиков

```tsx
// ❌ Неправильно: прямая мутация без вызова listeners
class BadStore {
  state = { count: 0 };
  listeners = new Set<() => void>();

  increment() {
    this.state.count++; // прямая мутация — подписчики не узнают об изменении!
  }
}

// ✅ Правильно: всегда уведомляйте подписчиков
class GoodStore {
  private state = { count: 0 };
  private listeners = new Set<() => void>();

  getState() {
    return this.state;
  }

  increment() {
    this.state = { count: this.state.count + 1 }; // новый объект
    this.listeners.forEach((cb) => cb()); // уведомляем подписчиков
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}
```

### Ошибка 3: Асинхронный getSnapshot

```tsx
// ❌ Неправильно: getSnapshot не может быть async
function BadUsage() {
  const data = useSyncExternalStore(
    subscribe,
    async () => await fetchData() // React игнорирует Promise, это ошибка!
  );
}

// ✅ Правильно: храните данные синхронно, загружайте асинхронно отдельно
const dataStore = createStore<{ data: string | null; loading: boolean }>({
  data: null,
  loading: false,
});

async function loadData() {
  dataStore.setState({ loading: true });
  const result = await fetch('/api/data').then((r) => r.text());
  dataStore.setState({ data: result, loading: false });
}

function DataComponent() {
  const { data, loading } = useSyncExternalStore(
    dataStore.subscribe,
    () => dataStore.getState()
  );

  if (loading) return <div>Загрузка...</div>;
  return <div>{data}</div>;
}
```

## useSyncExternalStore vs альтернативы

| Подход | Concurrent Mode | SSR | Tearing | Сложность |
|--------|----------------|-----|---------|-----------|
| `useSyncExternalStore` | ✅ Безопасен | ✅ Поддержка | ✅ Защита | Низкая |
| `useEffect + useState` | ⚠️ Уязвим | ⚠️ Сложно | ❌ Возможен | Средняя |
| `useRef + forceUpdate` | ⚠️ Уязвим | ❌ Нет | ❌ Возможен | Высокая |
| Context API | ✅ Безопасен | ✅ Поддержка | ✅ Защита | Средняя |
| Redux Toolkit | ✅ (внутри использует useSyncExternalStore) | ✅ Поддержка | ✅ Защита | Высокая |

`useSyncExternalStore` — правильный выбор, когда:
- Вы пишете библиотеку управления состоянием.
- Подписываетесь на браузерные API (resize, scroll, online/offline, matchMedia).
- Интегрируетесь с внешними сторами, не использующими React.
- Хотите обойтись без сторонних библиотек.

## Практический пример: хук useOnlineStatus с поддержкой SSR

```tsx
import { useSyncExternalStore } from 'react';

// Функции подписки и снимков вынесены за пределы компонента
function subscribeToOnlineStatus(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

function getOnlineServerSnapshot(): boolean {
  // На сервере нет navigator, считаем, что онлайн
  return true;
}

// Переиспользуемый хук
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );
}

// Использование в компоненте
function SaveButton({ onSave }: { onSave: () => void }) {
  const isOnline = useOnlineStatus();

  return (
    <button
      onClick={onSave}
      disabled={!isOnline}
      title={!isOnline ? 'Нет соединения с интернетом' : undefined}
    >
      {isOnline ? 'Сохранить' : 'Нет соединения'}
    </button>
  );
}

// Можно использовать в нескольких местах —
// все компоненты получат согласованное состояние
function StatusBar() {
  const isOnline = useOnlineStatus();

  return (
    <div className={`status-bar ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? 'Подключено' : 'Нет подключения'}
    </div>
  );
}
```

## Итоги

`useSyncExternalStore` — специализированный, но мощный хук для работы с данными вне React. Вот ключевые моменты:

- **Используйте для внешних сторов** — Redux, Zustand, MobX, ваши собственные хранилища.
- **Используйте для браузерных API** — resize, scroll, online/offline, matchMedia, localStorage.
- **Три параметра** — `subscribe` (подписка + отписка), `getSnapshot` (синхронный снимок), `getServerSnapshot` (для SSR).
- **Стабильные ссылки** — выносите `subscribe` за пределы компонента или используйте `useCallback`.
- **Синхронный getSnapshot** — никаких `async/await`, только синхронный доступ к данным.
- **Защита от tearing** — React гарантирует согласованность данных между компонентами.

Хук `useSyncExternalStore` — это официальный ответ React команды на вопрос «как правильно интегрировать внешние источники данных». Если вы создаёте React-приложение с нетривиальным стором или используете Concurrent Mode — этот хук станет надёжным фундаментом вашей архитектуры.

Хотите освоить продвинутые возможности React и научиться строить масштабируемые приложения? Записывайтесь на [наш курс по React](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useSyncExternalStore) и практикуйтесь на реальных проектах.
