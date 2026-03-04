---
metaTitle: XState - конечные автоматы и statecharts в React
metaDescription: Полное руководство по XState — библиотеке конечных автоматов для JavaScript и React. Машины состояний, statecharts, акторы, TypeScript и интеграция с React через @xstate/react
author: Олег Марков
title: XState - конечные автоматы
preview: Узнайте, как использовать XState для управления сложной логикой состояний в React-приложениях через конечные автоматы и statecharts — предсказуемо, тестируемо и визуально
---

## Введение

Представьте компонент загрузки данных. На первый взгляд он простой: либо загружается, либо данные есть, либо ошибка. Но в реальности возникают вопросы: что если пользователь обновляет данные во время загрузки? Можно ли повторить запрос при ошибке? Нужно ли отменять предыдущий запрос при новом? Что если данные загрузились, но компонент уже размонтировался?

Управление такой логикой через множество `boolean` флагов (`isLoading`, `isError`, `isRetrying`, `isCancelled`) быстро превращается в непредсказуемую мешанину, где возможны невалидные комбинации состояний.

**XState** решает эту проблему через **конечные автоматы** (finite state machines) и **statecharts**. Вместо набора флагов у вас есть явный список состояний и явные переходы между ними. Невалидные состояния становятся физически невозможными.

## Что такое конечный автомат

Конечный автомат (FSM — Finite State Machine) — математическая модель с:
- Конечным набором **состояний** (states)
- **Начальным состоянием**
- Набором **событий** (events/transitions)
- Правилами переходов: **из какого состояния** + **какое событие** = **в какое состояние**

```javascript
// Светофор как конечный автомат
const trafficLightMachine = {
  states: ['green', 'yellow', 'red'],
  initial: 'green',
  transitions: {
    green: { TIMER: 'yellow' },
    yellow: { TIMER: 'red' },
    red: { TIMER: 'green' },
  }
};
// В состоянии 'green' событие TIMER → переходим в 'yellow'
// Никакое другое событие не может нарушить этот порядок
```

**Ключевое преимущество**: невалидные состояния исключены по определению. Светофор не может одновременно быть зелёным и красным.

## Установка XState

```bash
npm install xstate @xstate/react
# или
yarn add xstate @xstate/react
```

XState v5 (актуальная версия) значительно переработан по сравнению с v4. В этой статье используется v5.

## Первая машина состояний

### Создание машины

```typescript
import { createMachine, assign } from 'xstate';

// Машина состояний для загрузки данных
const fetchMachine = createMachine({
  // Уникальный идентификатор
  id: 'fetch',

  // Начальное состояние
  initial: 'idle',

  // Типизация контекста (данные машины)
  context: {
    data: null as string[] | null,
    error: null as string | null,
    retries: 0,
  },

  // Определение состояний
  states: {
    // Ожидание
    idle: {
      on: {
        FETCH: 'loading', // Событие FETCH → переходим в loading
      },
    },

    // Загрузка
    loading: {
      on: {
        RESOLVE: {
          target: 'success',
          actions: assign({
            data: ({ event }) => event.data, // Сохраняем данные в context
            error: null,
          }),
        },
        REJECT: {
          target: 'failure',
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
        CANCEL: 'idle', // Отмена загрузки
      },
    },

    // Успех
    success: {
      on: {
        FETCH: 'loading', // Можно обновить
        RESET: 'idle',
      },
    },

    // Ошибка
    failure: {
      on: {
        RETRY: {
          target: 'loading',
          actions: assign({
            retries: ({ context }) => context.retries + 1,
          }),
        },
        RESET: {
          target: 'idle',
          actions: assign({ error: null, retries: 0 }),
        },
      },
    },
  },
});
```

### Использование с React

```tsx
import { useMachine } from '@xstate/react';
import { fetchMachine } from './fetchMachine';

function DataLoader() {
  const [state, send] = useMachine(fetchMachine);

  const handleFetch = async () => {
    send({ type: 'FETCH' });
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      send({ type: 'RESOLVE', data });
    } catch (error) {
      send({ type: 'REJECT', error: error.message });
    }
  };

  return (
    <div>
      {/* Рендер по текущему состоянию */}
      {state.matches('idle') && (
        <button onClick={handleFetch}>Загрузить данные</button>
      )}

      {state.matches('loading') && (
        <div>
          <p>Загрузка...</p>
          <button onClick={() => send({ type: 'CANCEL' })}>Отмена</button>
        </div>
      )}

      {state.matches('success') && (
        <div>
          <ul>
            {state.context.data?.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
          <button onClick={handleFetch}>Обновить</button>
        </div>
      )}

      {state.matches('failure') && (
        <div>
          <p>Ошибка: {state.context.error}</p>
          <p>Попыток: {state.context.retries}</p>
          <button onClick={() => send({ type: 'RETRY' })}>Повторить</button>
          <button onClick={() => send({ type: 'RESET' })}>Сбросить</button>
        </div>
      )}
    </div>
  );
}
```

## Actors и invoke

XState поддерживает **акторов** — асинхронные сервисы, которые машина вызывает при входе в состояние.

```typescript
import { createMachine, assign, fromPromise } from 'xstate';

interface User {
  id: number;
  name: string;
  email: string;
}

const userMachine = createMachine({
  id: 'user',
  initial: 'idle',
  context: {
    userId: null as number | null,
    user: null as User | null,
    error: null as string | null,
  },
  states: {
    idle: {
      on: {
        LOAD: {
          target: 'loading',
          actions: assign({
            userId: ({ event }) => event.userId,
          }),
        },
      },
    },
    loading: {
      // invoke запускает актора при входе в состояние
      invoke: {
        src: fromPromise(async ({ input }: { input: { userId: number } }) => {
          const response = await fetch(`/api/users/${input.userId}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json() as Promise<User>;
        }),
        input: ({ context }) => ({ userId: context.userId! }),
        onDone: {
          target: 'success',
          actions: assign({
            user: ({ event }) => event.output,
            error: null,
          }),
        },
        onError: {
          target: 'failure',
          actions: assign({
            error: ({ event }) => String(event.error),
          }),
        },
      },
      on: {
        // Можно отменить — машина выйдет из состояния loading
        // и актор будет автоматически отменён
        CANCEL: 'idle',
      },
    },
    success: {
      on: {
        RELOAD: 'loading',
      },
    },
    failure: {
      on: {
        RETRY: 'loading',
        RESET: {
          target: 'idle',
          actions: assign({ user: null, error: null }),
        },
      },
    },
  },
});
```

```tsx
function UserProfile({ userId }: { userId: number }) {
  const [state, send] = useMachine(userMachine);

  useEffect(() => {
    send({ type: 'LOAD', userId });
  }, [userId, send]);

  if (state.matches('loading')) return <p>Загрузка пользователя...</p>;
  if (state.matches('failure')) {
    return (
      <div>
        <p>Ошибка: {state.context.error}</p>
        <button onClick={() => send({ type: 'RETRY' })}>Повторить</button>
      </div>
    );
  }
  if (state.matches('success') && state.context.user) {
    return (
      <div>
        <h2>{state.context.user.name}</h2>
        <p>{state.context.user.email}</p>
        <button onClick={() => send({ type: 'RELOAD' })}>Обновить</button>
      </div>
    );
  }
  return null;
}
```

## Вложенные состояния (Hierarchical States)

Statecharts позволяют создавать **вложенные состояния** — подсостояния внутри состояний:

```typescript
const authMachine = createMachine({
  id: 'auth',
  initial: 'unauthenticated',
  states: {
    unauthenticated: {
      initial: 'idle',
      states: {
        idle: {
          on: { LOGIN: 'submitting' },
        },
        submitting: {
          invoke: {
            src: fromPromise(async ({ input }) => {
              return await api.login(input.credentials);
            }),
            input: ({ event }) => ({ credentials: event.credentials }),
            onDone: '#auth.authenticated',
            onError: 'error',
          },
        },
        error: {
          on: { RETRY: 'idle' },
        },
      },
    },
    authenticated: {
      initial: 'active',
      states: {
        active: {
          on: { IDLE_TIMEOUT: 'idle' },
        },
        idle: {
          on: {
            ACTIVITY: 'active',
            SESSION_TIMEOUT: '#auth.unauthenticated',
          },
        },
      },
      on: {
        LOGOUT: 'unauthenticated',
      },
    },
  },
});
```

```tsx
function App() {
  const [state, send] = useMachine(authMachine);

  // Проверяем наличие в родительском состоянии
  if (state.matches('unauthenticated')) {
    return <LoginPage onLogin={(creds) => send({ type: 'LOGIN', credentials: creds })} />;
  }

  // matches поддерживает вложенные состояния
  return (
    <div>
      <MainApp />
      {state.matches({ authenticated: 'idle' }) && (
        <SessionWarning onContinue={() => send({ type: 'ACTIVITY' })} />
      )}
    </div>
  );
}
```

## Параллельные состояния

XState поддерживает **параллельные состояния** — несколько активных состояний одновременно:

```typescript
const formMachine = createMachine({
  id: 'form',
  type: 'parallel', // Все дочерние состояния активны одновременно
  states: {
    // Состояние заполнения
    filling: {
      initial: 'invalid',
      states: {
        valid: {},
        invalid: {},
      },
    },
    // Состояние отправки (независимо от filling)
    submission: {
      initial: 'idle',
      states: {
        idle: {
          on: { SUBMIT: 'submitting' },
        },
        submitting: {
          invoke: {
            src: 'submitForm',
            onDone: 'success',
            onError: 'error',
          },
        },
        success: {},
        error: {
          on: { RETRY: 'submitting' },
        },
      },
    },
    // Состояние автосохранения (независимо от других)
    autosave: {
      initial: 'idle',
      states: {
        idle: {
          after: {
            2000: 'saving', // Переход через 2 секунды без активности
          },
        },
        saving: {
          invoke: {
            src: 'saveDraft',
            onDone: 'idle',
            onError: 'idle',
          },
        },
      },
    },
  },
});
```

## Guards — условные переходы

**Guards** (охранники) — условия, при которых переход разрешён:

```typescript
const checkoutMachine = createMachine({
  id: 'checkout',
  initial: 'cart',
  context: {
    items: [] as CartItem[],
    paymentMethod: null as string | null,
    shippingAddress: null as Address | null,
  },
  states: {
    cart: {
      on: {
        PROCEED: {
          target: 'shipping',
          // Переход только если корзина не пустая
          guard: ({ context }) => context.items.length > 0,
        },
      },
    },
    shipping: {
      on: {
        SET_ADDRESS: {
          actions: assign({
            shippingAddress: ({ event }) => event.address,
          }),
        },
        PROCEED: {
          target: 'payment',
          guard: ({ context }) => context.shippingAddress !== null,
        },
        BACK: 'cart',
      },
    },
    payment: {
      on: {
        SET_PAYMENT: {
          actions: assign({
            paymentMethod: ({ event }) => event.method,
          }),
        },
        CONFIRM: {
          target: 'processing',
          guard: ({ context }) =>
            context.paymentMethod !== null && context.shippingAddress !== null,
        },
        BACK: 'shipping',
      },
    },
    processing: {
      invoke: {
        src: 'processOrder',
        onDone: 'success',
        onError: 'failed',
      },
    },
    success: { type: 'final' },
    failed: {
      on: { RETRY: 'processing' },
    },
  },
});
```

## TypeScript с XState

XState v5 имеет отличную поддержку TypeScript:

```typescript
import { createMachine, assign } from 'xstate';

// Описываем типы через setup()
import { setup } from 'xstate';

const machine = setup({
  types: {
    context: {} as {
      count: number;
      user: User | null;
      error: string | null;
    },
    events: {} as
      | { type: 'INCREMENT' }
      | { type: 'DECREMENT' }
      | { type: 'FETCH_USER'; userId: string }
      | { type: 'RESOLVE'; user: User }
      | { type: 'REJECT'; error: string },
    input: {} as { initialCount: number },
  },
  actions: {
    increment: assign({ count: ({ context }) => context.count + 1 }),
    decrement: assign({ count: ({ context }) => context.count - 1 }),
    setUser: assign({ user: ({ event }) => {
      if (event.type !== 'RESOLVE') return null;
      return event.user;
    }}),
  },
  guards: {
    canDecrement: ({ context }) => context.count > 0,
  },
}).createMachine({
  initial: 'idle',
  context: ({ input }) => ({
    count: input.initialCount,
    user: null,
    error: null,
  }),
  states: {
    idle: {
      on: {
        INCREMENT: { actions: 'increment' },
        DECREMENT: {
          actions: 'decrement',
          guard: 'canDecrement',
        },
      },
    },
  },
});
```

## useSelector — оптимизация ре-рендеров

```tsx
import { useSelector } from '@xstate/react';

function CounterDisplay({ actorRef }) {
  // Компонент перерендерится только при изменении count
  const count = useSelector(actorRef, (state) => state.context.count);
  return <p>{count}</p>;
}

function StateDisplay({ actorRef }) {
  // Перерендерится только при смене состояния
  const stateName = useSelector(actorRef, (state) => state.value);
  return <p>Состояние: {String(stateName)}</p>;
}
```

## XState DevTools и визуализация

XState предоставляет мощные инструменты отладки:

### Stately Inspector

```tsx
import { createBrowserInspector } from '@statelyai/inspect';

const { inspect } = createBrowserInspector();

function App() {
  const [state, send] = useMachine(machine, { inspect });
  // ...
}
```

### Визуализация на stately.ai

XState-машины можно визуализировать как диаграммы состояний на [stately.ai/viz](https://stately.ai/viz). Вставьте код машины и получите интерактивную диаграму с возможностью симуляции.

## Когда использовать XState

XState хорошо подходит для:

**Многошаговые процессы:**
- Мастера настройки (wizard)
- Процессы оплаты
- Онбординг новых пользователей

**Сложные UI-состояния:**
- Drag-and-drop с несколькими состояниями (idle → hover → dragging → dropping)
- Медиаплееры (idle → buffering → playing → paused → ended)
- Формы с валидацией и асинхронной отправкой

**Сетевые запросы со сложной логикой:**
- Повторные попытки с exponential backoff
- Отмена предыдущего запроса
- Кэширование и обновление

### Когда XState — лишняя сложность

- Простые переключатели (`isOpen`, `isVisible`)
- Одно-двух-уровневые состояния без сложных переходов
- Если команда не знакома с FSM-концепциями и нет времени на обучение

## Сравнение с другими подходами

| Аспект | XState | useState/useReducer | Redux |
|--------|--------|---------------------|-------|
| Концепция | Конечные автоматы | Свободное состояние | Flux/Redux |
| Явные состояния | Да | Нет | Нет |
| Невалидные состояния | Исключены | Возможны | Возможны |
| Визуализация | Да (Stately) | Нет | Нет |
| Async | Нативно (actors) | useEffect | thunk/saga |
| Кривая обучения | Высокая | Низкая | Средняя |
| Лучше для | Сложная логика | Простое состояние | Глобальное состояние |

## Заключение

XState — мощный инструмент для сложных сценариев управления состоянием. Конечные автоматы делают логику явной и предсказуемой:

- **Невозможные состояния** физически исключены из модели
- **Явные переходы** — понятно, что происходит при каждом событии
- **Визуализация** через Stately Inspector или stately.ai
- **Тестирование** упрощается — можно проверить каждый переход
- **Actors** для нативной поддержки асинхронности

Попробуйте XState для следующего многошагового процесса или сложного UI-компонента. Диаграмма состояний поможет вам яснее увидеть всю логику до написания кода.
