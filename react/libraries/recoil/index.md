---
metaTitle: Recoil — библиотека управления состоянием от Facebook
metaDescription: Полное руководство по Recoil — атомарному менеджеру состояния для React от Facebook. Atoms, selectors, хуки, асинхронные запросы, отладка и лучшие практики
author: Олег Марков
title: Recoil — библиотека управления состоянием от Facebook
preview: Узнайте как использовать Recoil для управления состоянием в React-приложениях. Разберём атомы, селекторы, асинхронные данные, интеграцию с TypeScript и лучшие практики
---

# Recoil — библиотека управления состоянием от Facebook

Recoil — это экспериментальная библиотека управления состоянием для React, разработанная командой Facebook. Она предлагает принципиально иной подход к работе с состоянием по сравнению с Redux или MobX: вместо единого глобального хранилища используется граф атомов (atoms) и производных значений (selectors).

В этой статье мы подробно разберём всё, что нужно знать для работы с Recoil: от базовых концепций до продвинутых паттернов использования.

## Почему Recoil?

React имеет встроенные механизмы управления состоянием — `useState` и `useContext`. Однако при росте приложения они сталкиваются с ограничениями:

- **Context + useState** вызывают повторный рендеринг всех подписчиков контекста при любом изменении
- **Redux** требует значительного бойлерплейта и сложной настройки
- **MobX** использует мутации и декораторы, что противоречит функциональному стилю React

Recoil решает эти проблемы, предлагая:

- **Атомарное состояние** — каждый atom является независимой единицей состояния
- **Точечные обновления** — компонент перерисовывается только при изменении подписанных atoms
- **Встроенная асинхронность** — selectors поддерживают Promise и Suspense из коробки
- **Минимальный бойлерплейт** — API близок к `useState`, легко освоить
- **Интеграция с React** — использует те же механизмы что и React (Suspense, Concurrent Mode)

## Установка

Установка Recoil стандартна через npm или yarn:

```bash
npm install recoil
# или
yarn add recoil
```

Для TypeScript никаких дополнительных пакетов не нужно — типы включены в основной пакет.

## Базовая настройка

Для работы Recoil необходимо обернуть приложение в `RecoilRoot`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RecoilRoot>
      <App />
    </RecoilRoot>
  </React.StrictMode>
);
```

`RecoilRoot` создаёт контекст для хранения атомов. Можно использовать несколько `RecoilRoot` в одном приложении — они будут независимыми.

## Atoms — базовые единицы состояния

Atom — это единица состояния в Recoil. Он содержит значение, на которое могут подписаться компоненты.

### Создание атома

```javascript
import { atom } from 'recoil';

const counterAtom = atom({
  key: 'counterAtom',  // уникальный ключ
  default: 0,          // значение по умолчанию
});
```

Параметр `key` должен быть уникальным среди всех atoms и selectors в приложении. Обычно используют имя переменной как часть ключа.

### Чтение и запись атома

Для работы с атомом используются специальные хуки:

```jsx
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

// Читать и писать (аналог useState)
function Counter() {
  const [count, setCount] = useRecoilState(counterAtom);

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
    </div>
  );
}

// Только читать (компонент не зависит от записи)
function CounterDisplay() {
  const count = useRecoilValue(counterAtom);
  return <span>{count}</span>;
}

// Только писать (компонент не подписывается на изменения)
function ResetButton() {
  const setCount = useSetRecoilState(counterAtom);
  return <button onClick={() => setCount(0)}>Сбросить</button>;
}
```

Разделение хуков по операциям позволяет точечно контролировать, когда компонент перерисовывается.

### Атомы со сложными данными

Atoms могут хранить любые данные — объекты, массивы, строки:

```javascript
// Объект пользователя
const userAtom = atom({
  key: 'userAtom',
  default: {
    name: '',
    email: '',
    isLoggedIn: false,
  },
});

// Список задач
const todoListAtom = atom({
  key: 'todoListAtom',
  default: [],
});

// Строка поиска
const searchQueryAtom = atom({
  key: 'searchQueryAtom',
  default: '',
});
```

### Обновление объектов в атоме

При обновлении объектов важно создавать новый объект (иммутабельность):

```jsx
function UserProfile() {
  const [user, setUser] = useRecoilState(userAtom);

  const updateName = (newName) => {
    setUser(prevUser => ({
      ...prevUser,      // копируем старые поля
      name: newName,    // обновляем нужное поле
    }));
  };

  return (
    <input
      value={user.name}
      onChange={e => updateName(e.target.value)}
    />
  );
}
```

## Selectors — производные значения

Selector — это чистая функция, которая вычисляет значение на основе atoms или других selectors. Selectors автоматически пересчитываются при изменении зависимостей.

### Базовый selector

```javascript
import { selector } from 'recoil';

const doubleCounterSelector = selector({
  key: 'doubleCounterSelector',
  get: ({ get }) => {
    const count = get(counterAtom);  // подписываемся на atom
    return count * 2;
  },
});
```

Функция `get` в селекторе регистрирует зависимость — при изменении `counterAtom` selector пересчитается автоматически.

### Использование selector в компоненте

```jsx
function DoubleCounter() {
  const doubleCount = useRecoilValue(doubleCounterSelector);
  return <p>Удвоенное значение: {doubleCount}</p>;
}
```

### Selector с несколькими зависимостями

```javascript
const todoStatsSelector = selector({
  key: 'todoStatsSelector',
  get: ({ get }) => {
    const todos = get(todoListAtom);
    const filter = get(filterAtom);

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const remaining = total - completed;

    const filteredTodos = todos.filter(todo => {
      if (filter === 'completed') return todo.completed;
      if (filter === 'active') return !todo.completed;
      return true;
    });

    return { total, completed, remaining, filteredTodos };
  },
});
```

### Writeable selector

Selectors могут быть двунаправленными — поддерживать запись:

```javascript
const temperatureSelector = selector({
  key: 'temperatureSelector',
  get: ({ get }) => {
    const celsius = get(celsiusAtom);
    return celsius * 9/5 + 32;  // конвертируем в Fahrenheit
  },
  set: ({ set }, fahrenheit) => {
    // конвертируем обратно в Celsius при записи
    set(celsiusAtom, (fahrenheit - 32) * 5/9);
  },
});

// Использование
function TemperatureInput() {
  const [fahrenheit, setFahrenheit] = useRecoilState(temperatureSelector);

  return (
    <input
      type="number"
      value={fahrenheit}
      onChange={e => setFahrenheit(Number(e.target.value))}
      placeholder="Fahrenheit"
    />
  );
}
```

## Практический пример: Todo-приложение

Рассмотрим полноценный пример приложения для управления задачами:

### Определяем atoms и selectors

```javascript
// atoms.js
import { atom, selector } from 'recoil';

let todoId = 0;

export const todoListAtom = atom({
  key: 'todoListAtom',
  default: [],
});

export const filterAtom = atom({
  key: 'filterAtom',
  default: 'all',  // 'all' | 'active' | 'completed'
});

export const filteredTodosSelector = selector({
  key: 'filteredTodosSelector',
  get: ({ get }) => {
    const todos = get(todoListAtom);
    const filter = get(filterAtom);

    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  },
});

export const todoStatsSelector = selector({
  key: 'todoStatsSelector',
  get: ({ get }) => {
    const todos = get(todoListAtom);
    return {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      remaining: todos.filter(t => !t.completed).length,
    };
  },
});
```

### Компонент добавления задачи

```jsx
// AddTodo.jsx
import { useSetRecoilState } from 'recoil';
import { todoListAtom } from './atoms';
import { useState } from 'react';

let nextId = 1;

export function AddTodo() {
  const [text, setText] = useState('');
  const setTodos = useSetRecoilState(todoListAtom);

  const handleAdd = () => {
    if (!text.trim()) return;

    setTodos(prev => [
      ...prev,
      { id: nextId++, text, completed: false },
    ]);
    setText('');
  };

  return (
    <div className="add-todo">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && handleAdd()}
        placeholder="Новая задача..."
      />
      <button onClick={handleAdd}>Добавить</button>
    </div>
  );
}
```

### Компонент списка задач

```jsx
// TodoList.jsx
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { filteredTodosSelector, todoListAtom } from './atoms';

export function TodoList() {
  const todos = useRecoilValue(filteredTodosSelector);
  const setTodos = useSetRecoilState(todoListAtom);

  const toggleTodo = (id) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id} className={todo.completed ? 'completed' : ''}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          <span>{todo.text}</span>
          <button onClick={() => deleteTodo(todo.id)}>×</button>
        </li>
      ))}
    </ul>
  );
}
```

### Компонент статистики и фильтров

```jsx
// TodoStats.jsx
import { useRecoilState, useRecoilValue } from 'recoil';
import { todoStatsSelector, filterAtom } from './atoms';

export function TodoStats() {
  const stats = useRecoilValue(todoStatsSelector);
  const [filter, setFilter] = useRecoilState(filterAtom);

  return (
    <div className="stats">
      <p>Всего: {stats.total} | Выполнено: {stats.completed} | Осталось: {stats.remaining}</p>
      <div className="filters">
        {['all', 'active', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'active' : ''}
          >
            {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Выполненные'}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Главный компонент

```jsx
// App.jsx
import { RecoilRoot } from 'recoil';
import { AddTodo } from './AddTodo';
import { TodoList } from './TodoList';
import { TodoStats } from './TodoStats';

function TodoApp() {
  return (
    <div className="todo-app">
      <h1>Список задач</h1>
      <AddTodo />
      <TodoStats />
      <TodoList />
    </div>
  );
}

export default function App() {
  return (
    <RecoilRoot>
      <TodoApp />
    </RecoilRoot>
  );
}
```

## Асинхронные selectors

Одна из killer-фичей Recoil — поддержка асинхронных операций прямо в selectors.

### Async selector с Suspense

```javascript
// Асинхронный selector для загрузки данных пользователя
const userDataSelector = selector({
  key: 'userDataSelector',
  get: async ({ get }) => {
    const userId = get(currentUserIdAtom);

    if (!userId) return null;

    // Обычный fetch — Recoil сам обработает Promise через Suspense
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.status}`);
    }
    return response.json();
  },
});
```

```jsx
// Использование с Suspense и ErrorBoundary
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function UserProfile() {
  const user = useRecoilValue(userDataSelector);

  if (!user) return <p>Выберите пользователя</p>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  return (
    <RecoilRoot>
      <ErrorBoundary fallback={<p>Произошла ошибка загрузки</p>}>
        <Suspense fallback={<p>Загрузка...</p>}>
          <UserProfile />
        </Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

### useRecoilValueLoadable — без Suspense

Если Suspense не подходит, используйте `useRecoilValueLoadable`:

```jsx
import { useRecoilValueLoadable } from 'recoil';

function UserProfile() {
  const loadable = useRecoilValueLoadable(userDataSelector);

  switch (loadable.state) {
    case 'loading':
      return <Spinner />;

    case 'hasValue':
      return <div>{loadable.contents.name}</div>;

    case 'hasError':
      return <p>Ошибка: {loadable.contents.message}</p>;
  }
}
```

### Кеширование и параметризация

Для загрузки данных по разным ключам используйте `selectorFamily`:

```javascript
import { selectorFamily } from 'recoil';

// Создаём фабрику селекторов — каждый параметр создаёт отдельный кеш
const userByIdSelector = selectorFamily({
  key: 'userByIdSelector',
  get: (userId) => async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
});

// Использование
function UserCard({ userId }) {
  const user = useRecoilValue(userByIdSelector(userId));
  return <div>{user.name}</div>;
}
```

## atomFamily — параметризованные атомы

Аналогично `selectorFamily`, для атомов есть `atomFamily`:

```javascript
import { atomFamily } from 'recoil';

// Атом для каждого элемента списка
const todoItemAtom = atomFamily({
  key: 'todoItemAtom',
  default: (id) => ({
    id,
    text: '',
    completed: false,
  }),
});

// Использование
function TodoItem({ id }) {
  const [todo, setTodo] = useRecoilState(todoItemAtom(id));

  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => setTodo(t => ({ ...t, completed: !t.completed }))}
      />
      <span>{todo.text}</span>
    </li>
  );
}
```

Этот паттерн позволяет каждому элементу иметь независимое состояние без накладных расходов на фильтрацию всего списка.

## Работа с TypeScript

Recoil хорошо интегрируется с TypeScript. Типы автоматически выводятся из значений по умолчанию.

### Типизация atoms

```typescript
import { atom } from 'recoil';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

// TypeScript выводит тип как RecoilState<User | null>
const currentUserAtom = atom<User | null>({
  key: 'currentUserAtom',
  default: null,
});

// RecoilState<string>
const searchQueryAtom = atom<string>({
  key: 'searchQueryAtom',
  default: '',
});

// RecoilState<string[]>
const selectedTagsAtom = atom<string[]>({
  key: 'selectedTagsAtom',
  default: [],
});
```

### Типизация selectors

```typescript
import { selector, selectorFamily } from 'recoil';

// Тип выводится автоматически из возвращаемого значения
const filteredUsersSelector = selector<User[]>({
  key: 'filteredUsersSelector',
  get: ({ get }) => {
    const users = get(usersAtom);
    const query = get(searchQueryAtom);

    return users.filter(u =>
      u.name.toLowerCase().includes(query.toLowerCase())
    );
  },
});

// Типизация selectorFamily
const userByIdSelector = selectorFamily<User | undefined, number>({
  key: 'userByIdSelector',
  get: (userId: number) => ({ get }) => {
    const users = get(usersAtom);
    return users.find(u => u.id === userId);
  },
});
```

### Типизация atomFamily

```typescript
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const todoItemAtom = atomFamily<TodoItem, string>({
  key: 'todoItemAtom',
  default: (id: string): TodoItem => ({
    id,
    text: '',
    completed: false,
    priority: 'medium',
  }),
});
```

## Инициализация состояния

### initializeState — начальные данные

```jsx
// Инициализация из API или localStorage
function App() {
  const initializeState = ({ set }) => {
    // Восстанавливаем состояние из localStorage
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      set(todoListAtom, JSON.parse(savedTodos));
    }

    // Устанавливаем начального пользователя
    set(currentUserAtom, { id: 1, name: 'Гость', role: 'guest' });
  };

  return (
    <RecoilRoot initializeState={initializeState}>
      <TodoApp />
    </RecoilRoot>
  );
}
```

### useRecoilTransactionObserver_UNSTABLE

Позволяет реагировать на любые изменения состояния (например, для синхронизации с localStorage):

```jsx
import { useRecoilTransactionObserver_UNSTABLE } from 'recoil';

function PersistenceObserver() {
  useRecoilTransactionObserver_UNSTABLE(({ snapshot }) => {
    // Вызывается при каждом изменении любого атома
    const todos = snapshot.getLoadable(todoListAtom);
    if (todos.state === 'hasValue') {
      localStorage.setItem('todos', JSON.stringify(todos.contents));
    }
  });

  return null;
}

function App() {
  return (
    <RecoilRoot>
      <PersistenceObserver />
      <TodoApp />
    </RecoilRoot>
  );
}
```

## Effects — side-эффекты для атомов

Atom Effects — механизм для привязки side-эффектов к атомам. Аналог middleware в Redux.

### localStorage синхронизация

```javascript
// Эффект для синхронизации с localStorage
const localStorageEffect = (key) => ({ setSelf, onSet }) => {
  // Восстанавливаем при первом чтении
  const savedValue = localStorage.getItem(key);
  if (savedValue !== null) {
    setSelf(JSON.parse(savedValue));
  }

  // Сохраняем при каждом изменении
  onSet((newValue, _, isReset) => {
    if (isReset) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  });
};

// Применяем эффект к атому
const persistedTodosAtom = atom({
  key: 'persistedTodosAtom',
  default: [],
  effects: [localStorageEffect('todos')],
});
```

### WebSocket синхронизация

```javascript
const websocketEffect = (roomId) => ({ setSelf, onSet }) => {
  const ws = new WebSocket(`wss://api.example.com/room/${roomId}`);

  // Получаем обновления от сервера
  ws.onmessage = (event) => {
    setSelf(JSON.parse(event.data));
  };

  // Отправляем локальные изменения
  onSet((newValue) => {
    ws.send(JSON.stringify(newValue));
  });

  // Cleanup
  return () => ws.close();
};

const sharedStateAtom = atom({
  key: 'sharedStateAtom',
  default: {},
  effects: [websocketEffect('room-123')],
});
```

### Логирование изменений

```javascript
const loggingEffect = (atomKey) => ({ onSet }) => {
  onSet((newValue, oldValue) => {
    console.group(`[Recoil] ${atomKey} изменился`);
    console.log('Старое значение:', oldValue);
    console.log('Новое значение:', newValue);
    console.groupEnd();
  });
};

const debugCounterAtom = atom({
  key: 'debugCounterAtom',
  default: 0,
  effects: [loggingEffect('debugCounterAtom')],
});
```

## Snapshot API

Snapshot — это снимок состояния всех atoms в конкретный момент времени. Полезен для отладки и реализации undo/redo.

### Чтение snapshot

```jsx
import { useRecoilSnapshot, useGotoRecoilSnapshot } from 'recoil';

function DebugPanel() {
  const snapshot = useRecoilSnapshot();

  // Итерируем по всем изменённым атомам
  useEffect(() => {
    console.log('Изменения состояния:');
    for (const node of snapshot.getNodes_UNSTABLE({ isModified: true })) {
      const value = snapshot.getLoadable(node);
      console.log(node.key, '=', value.contents);
    }
  }, [snapshot]);

  return null;
}
```

### Реализация Undo/Redo

```jsx
import { useRecoilSnapshot, useGotoRecoilSnapshot } from 'recoil';
import { useState } from 'react';

function UndoRedoManager() {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const snapshot = useRecoilSnapshot();
  const gotoSnapshot = useGotoRecoilSnapshot();

  // Сохраняем снимки в историю
  useEffect(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, snapshot];
    });
    setHistoryIndex(prev => prev + 1);
  }, [snapshot]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevSnapshot = history[historyIndex - 1];
      gotoSnapshot(prevSnapshot);
      setHistoryIndex(prev => prev - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextSnapshot = history[historyIndex + 1];
      gotoSnapshot(nextSnapshot);
      setHistoryIndex(prev => prev + 1);
    }
  };

  return (
    <div>
      <button onClick={undo} disabled={historyIndex <= 0}>Отменить</button>
      <button onClick={redo} disabled={historyIndex >= history.length - 1}>Повторить</button>
    </div>
  );
}
```

## Отладка с Recoil DevTools

### Recoil Inspector

Для отладки используйте Recoil Inspector — расширение для Chrome DevTools:

```bash
npm install recoil-inspector
```

```jsx
import { RecoilInspector } from 'recoil-inspector';

function App() {
  return (
    <RecoilRoot>
      {process.env.NODE_ENV === 'development' && <RecoilInspector />}
      <YourApp />
    </RecoilRoot>
  );
}
```

### Логирование через observer

```jsx
import { useRecoilSnapshot } from 'recoil';

function RecoilLogger() {
  const snapshot = useRecoilSnapshot();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const modified = [...snapshot.getNodes_UNSTABLE({ isModified: true })];
      if (modified.length > 0) {
        modified.forEach(node => {
          const loadable = snapshot.getLoadable(node);
          console.log(`[Recoil] ${node.key}:`, loadable.contents);
        });
      }
    }
  }, [snapshot]);

  return null;
}
```

## Сравнение с другими библиотеками

### Recoil vs Redux

| Критерий | Recoil | Redux |
|---------|--------|-------|
| Сложность | Низкая | Высокая |
| Бойлерплейт | Минимальный | Значительный |
| Асинхронность | Встроена | Redux Thunk/Saga |
| DevTools | Базовые | Превосходные |
| TypeScript | Хорошо | Отлично |
| Экосистема | Небольшая | Огромная |
| Производительность | Высокая | Высокая |

### Recoil vs Zustand

| Критерий | Recoil | Zustand |
|---------|--------|---------|
| Парадигма | Атомарная | Единый стор |
| Бойлерплейт | Минимальный | Минимальный |
| Размер бандла | ~22kb | ~3kb |
| Асинхронность | Встроена через Suspense | Ручная |
| Гибкость | Высокая | Высокая |
| Стабильность API | Экспериментальный | Стабильный |

### Recoil vs MobX

| Критерий | Recoil | MobX |
|---------|--------|------|
| Парадигма | Атомарная | Реактивная ООП |
| Стиль кода | Функциональный | ООП/декораторы |
| Кривая обучения | Пологая | Средняя |
| Асинхронность | Через Suspense | Ручная/reaction |
| React-интеграция | Нативная | Через observer |

## Лучшие практики

### 1. Группируйте связанные atoms в модули

```javascript
// store/auth.js
export const isAuthenticatedAtom = atom({
  key: 'auth/isAuthenticated',
  default: false,
});

export const currentUserAtom = atom({
  key: 'auth/currentUser',
  default: null,
});

export const authTokenAtom = atom({
  key: 'auth/token',
  default: null,
  effects: [localStorageEffect('authToken')],
});
```

### 2. Префиксы в ключах для уникальности

```javascript
// Используйте понятные, уникальные ключи
const cartItemsAtom = atom({ key: 'cart/items', default: [] });
const cartTotalSelector = selector({ key: 'cart/total', get: () => {} });
const orderHistoryAtom = atom({ key: 'orders/history', default: [] });
```

### 3. Не храните производные данные в atoms

```javascript
// Неправильно — хранить вычисленные данные в atom
const filteredTodosAtom = atom({
  key: 'filteredTodos',
  default: [],
});

// Правильно — использовать selector для производных данных
const filteredTodosSelector = selector({
  key: 'filteredTodos',
  get: ({ get }) => {
    const todos = get(todoListAtom);
    const filter = get(filterAtom);
    return todos.filter(t => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    });
  },
});
```

### 4. Используйте atomFamily для списков

```javascript
// Неправильно — один большой объект для всех элементов
const allTodosAtom = atom({ key: 'todos', default: {} });

// Правильно — atomFamily для независимых элементов
const todoAtom = atomFamily({
  key: 'todo',
  default: null,
});

// Индекс для получения всех ID
const todoIdsAtom = atom({
  key: 'todoIds',
  default: [],
});
```

### 5. Избегайте дублирования состояния

```javascript
// Неправильно — дублирование данных
const userAtom = atom({ key: 'user', default: null });
const userNameAtom = atom({ key: 'userName', default: '' }); // дублирует!

// Правильно — один источник правды + selector
const userAtom = atom({ key: 'user', default: null });
const userNameSelector = selector({
  key: 'userName',
  get: ({ get }) => get(userAtom)?.name ?? '',
});
```

### 6. Мемоизация в selector с тяжёлыми вычислениями

```javascript
import { selector } from 'recoil';

// Selector автоматически кешируется — не нужно вручную мемоизировать
const expensiveComputationSelector = selector({
  key: 'expensiveComputation',
  get: ({ get }) => {
    const data = get(largeDatasetAtom);
    // Эта функция не будет вызвана повторно,
    // если largeDatasetAtom не изменился
    return heavyComputation(data);
  },
});
```

## Ограничения и особенности

### Экспериментальный статус

Важно понимать: Recoil официально всё ещё помечен как "experimental". Это означает:

- API может меняться между версиями
- Некоторые функции имеют суффикс `_UNSTABLE`
- Для production нужно тщательно тестировать

### Циклические зависимости

Recoil обнаруживает циклические зависимости между selectors:

```javascript
// Это вызовет ошибку
const aSelector = selector({
  key: 'a',
  get: ({ get }) => get(bSelector) + 1,
});

const bSelector = selector({
  key: 'b',
  get: ({ get }) => get(aSelector) + 1, // циклическая зависимость!
});
```

### Производительность с большими списками

При работе с большими списками используйте atomFamily вместо одного большого atom:

```javascript
// Для 10000+ элементов atomFamily значительно эффективнее
const itemAtom = atomFamily({
  key: 'item',
  default: (id) => ({ id, value: '' }),
});
```

## Когда использовать Recoil

**Recoil подходит, если:**
- Приложение имеет сложный граф зависимостей между состояниями
- Нужна встроенная поддержка Suspense для асинхронных данных
- Важна точечность обновлений (избегать лишних ре-рендеров)
- Команда предпочитает функциональный стиль кода
- Разрабатывается новое React приложение без легаси-кода

**Лучше выбрать альтернативу, если:**
- Нужна максимальная стабильность API (выберите Zustand или Redux Toolkit)
- Размер бандла критичен (выберите Zustand ~3kb)
- Проект уже использует MobX или Redux (не стоит мигрировать без весомых причин)
- Необходима поддержка React Native (Recoil менее протестирован там)

## Заключение

Recoil предлагает свежий взгляд на управление состоянием в React-приложениях. Его атомарная модель, встроенная поддержка асинхронности через Suspense и минимальный бойлерплейт делают его привлекательным выбором для современных React-приложений.

Ключевые концепции, которые вы освоили в этой статье:

- **Atoms** — базовые единицы состояния, на которые подписываются компоненты
- **Selectors** — производные значения, автоматически пересчитываемые при изменении зависимостей
- **Хуки** — `useRecoilState`, `useRecoilValue`, `useSetRecoilState` для работы с состоянием
- **atomFamily/selectorFamily** — параметризованные atoms и selectors
- **Async selectors** — нативная поддержка Promise с Suspense
- **Atom Effects** — механизм side-эффектов для синхронизации с внешними источниками
- **Snapshot API** — снимки состояния для отладки и undo/redo

Несмотря на экспериментальный статус, Recoil уже используется в production в Facebook и многих других компаниях. Следите за обновлениями — команда активно работает над стабилизацией API.
