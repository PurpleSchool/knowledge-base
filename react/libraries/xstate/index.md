---
metaTitle: XState - конечные автоматы и statecharts в React
metaDescription: Полное руководство по XState — библиотеке конечных автоматов для JavaScript и React. Машины состояний, statecharts, акторы, TypeScript и интеграция с React через @xstate/react
author: Олег Марков
title: XState - конечные автоматы
preview: Узнайте, как использовать XState для управления сложной логикой состояний в React-приложениях через конечные автоматы и statecharts — предсказуемо, тестируемо и визуально
---

## Введение

Представьте компонент загрузки данных. На первый взгляд он простой: либо загружается, либо данные есть, либо ошибка. Но в реальности возникают вопросы: что если пользователь обновляет данные во время загрузки? Можно ли повторить запрос при ошибке? Нужно ли отменять предыдущий запрос при новом? Что если данные загрузились, но компонент уже размонтировался?

Управление такой логикой через множество `boolean` флагов (`isLoading`, `isError`, `isRetrying`, `isCancelled`) быстро превращается в непредсказуемую мешанину, где возможны невалидные комбинации состояний. Вы когда-нибудь встречали баг, при котором кнопка одновременно отображает «Загрузка» и «Готово»? Или форму, которая отправляется дважды? Это классические симптомы «состояния-булевых-флагов».

**XState** решает эту проблему через **конечные автоматы** (finite state machines) и **statecharts**. Вместо набора флагов у вас есть явный список состояний и явные переходы между ними. Невалидные состояния становятся физически невозможными.

В этой статье мы разберём XState с нуля до продвинутых концепций: конечные автоматы, переходы, guards, actions, invoke, context, акторная модель и интеграция с React.

## Что такое конечные автоматы (State Machines) и зачем они нужны

### Теория

Конечный автомат (FSM — Finite State Machine) — математическая модель вычислений с чётко определёнными свойствами:

- **Конечный набор состояний** (states) — система всегда находится ровно в одном из них
- **Начальное состояние** — откуда машина стартует
- **Алфавит событий** (events) — входные сигналы, которые может получить машина
- **Функция переходов** — из какого состояния + какое событие = в какое состояние
- **Конечные состояния** (опционально) — состояния, из которых нет выхода

```
Состояние + Событие → Новое состояние (+ побочные эффекты)
```

### Почему это важно для UI

В традиционном React-коде состояние управляется через набор независимых флагов:

```typescript
// Типичный "взрывной" подход
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

// Сколько валидных комбинаций? 2^5 = 32!
// Но реально допустимых только ~4-5
// isLoading=true и isSuccess=true одновременно — невалидно, но возможно
```

С конечным автоматом:

```typescript
// Явный список состояний — только 4 комбинации
type State = 'idle' | 'loading' | 'success' | 'failure';
// isLoading=true и isSuccess=true одновременно — физически невозможно
```

### Преимущества конечных автоматов

1. **Исчерпывающий анализ** — легко перечислить все возможные состояния и переходы
2. **Тестируемость** — каждый переход можно протестировать изолированно
3. **Визуализация** — машина состояний = диаграмма, которую понимает и разработчик, и дизайнер
4. **Самодокументирование** — код описывает поведение, а не только данные
5. **Устойчивость к bagам** — невалидные состояния невозможны по определению

### От FSM к Statecharts

Классические FSM имеют ограничение: при сложных системах количество состояний взрывообразно растёт (проблема «взрыва состояний»). Дэвид Харел в 1987 году предложил **statecharts** — расширение FSM с:

- **Иерархическими состояниями** — состояния внутри состояний
- **Параллельными состояниями** — несколько активных состояний одновременно
- **Историей** — запоминание последнего подсостояния
- **Действиями** — побочные эффекты при входе/выходе из состояний
- **Guards** — условные переходы

XState реализует statecharts в полном объёме.

## Введение в XState: установка и основные концепции

### Установка

```bash
npm install xstate @xstate/react
# или
yarn add xstate @xstate/react
# или
pnpm add xstate @xstate/react
```

XState v5 (актуальная версия) значительно переработан по сравнению с v4. В этой статье используется v5 с современным API. Основные изменения в v5:
- `createMachine` из `xstate` (без отдельного `Machine`)
- `fromPromise`, `fromCallback`, `fromObservable` вместо `invoke.src` как строка
- `setup()` для TypeScript-типизации
- Акторная модель как первый класс

### Основные концепции

| Концепция | Описание |
|-----------|----------|
| **Machine** | Описание поведения системы (конфигурация) |
| **Actor** | Запущенный экземпляр машины с собственным состоянием |
| **State** | Текущее состояние актора (value + context + ...) |
| **Context** | Расширенное состояние (данные, числа, объекты) |
| **Event** | Сообщение, отправленное актору |
| **Transition** | Переход из одного состояния в другое по событию |
| **Action** | Побочный эффект при переходе |
| **Guard** | Условие, разрешающее/запрещающее переход |
| **Service/Invoke** | Асинхронный актор, запускаемый в состоянии |

## States, Transitions, Events — основа машины

### Создание первой машины

```typescript
import { createMachine } from 'xstate';

// Простейший переключатель
const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'off',
  states: {
    off: {
      on: {
        TOGGLE: 'on', // Событие TOGGLE → переходим в состояние 'on'
      },
    },
    on: {
      on: {
        TOGGLE: 'off', // Событие TOGGLE → переходим в состояние 'off'
      },
    },
  },
});
```

### Запуск машины

```typescript
import { createActor } from 'xstate';

const actor = createActor(toggleMachine);
actor.start(); // Запускаем актора

console.log(actor.getSnapshot().value); // 'off'

actor.send({ type: 'TOGGLE' });
console.log(actor.getSnapshot().value); // 'on'

actor.send({ type: 'TOGGLE' });
console.log(actor.getSnapshot().value); // 'off'

// Подписка на изменения состояния
actor.subscribe((snapshot) => {
  console.log('Состояние изменилось:', snapshot.value);
});
```

### Полное описание переходов

Переходы могут быть как краткими, так и полными (объектами):

```typescript
const machine = createMachine({
  id: 'example',
  initial: 'idle',
  states: {
    idle: {
      on: {
        // Краткая форма — только целевое состояние
        SIMPLE: 'loading',

        // Полная форма — объект с дополнительными свойствами
        DETAILED: {
          target: 'loading',
          actions: ['logTransition'], // Действия при переходе
          guard: 'canProceed',        // Условие переходп
        },

        // Переход без смены состояния (internal transition)
        UPDATE: {
          // target не указан → остаёмся в текущем состоянии
          actions: assign({ lastEvent: () => Date.now() }),
        },

        // Несколько возможных переходов (первый прошедший guard победит)
        CONDITIONAL: [
          { target: 'stateA', guard: 'conditionA' },
          { target: 'stateB', guard: 'conditionB' },
          { target: 'fallback' }, // Без guard — всегда выполняется, если дошли до него
        ],
      },

      // Вход в состояние
      entry: 'onEnterIdle',

      // Выход из состояния
      exit: 'onExitIdle',
    },

    loading: {
      // Финальное состояние — нет исходящих переходов
      // type: 'final',
    },
  },
});
```

### Автоматические переходы (after)

```typescript
const timerMachine = createMachine({
  id: 'timer',
  initial: 'active',
  states: {
    active: {
      after: {
        // Через 5000 мс автоматически переходим в idle
        5000: 'idle',
      },
      on: {
        RESET: 'active', // Перезапуск таймера
      },
    },
    idle: {
      on: {
        START: 'active',
      },
    },
  },
});
```

## Guards — условия переходов

Guards (охранники, guards) — чистые функции, возвращающие `boolean`. Переход происходит только если guard возвращает `true`.

### Базовые guards

```typescript
import { createMachine, assign } from 'xstate';

const loginMachine = createMachine({
  id: 'login',
  initial: 'idle',
  context: {
    email: '',
    password: '',
    attempts: 0,
    maxAttempts: 3,
  },
  states: {
    idle: {
      on: {
        SUBMIT: {
          target: 'validating',
          // Guard: форма заполнена
          guard: ({ context }) =>
            context.email.length > 0 && context.password.length >= 6,
        },
      },
    },
    validating: {
      always: [
        {
          // Слишком много попыток — блокируем
          target: 'blocked',
          guard: ({ context }) => context.attempts >= context.maxAttempts,
        },
        {
          // Продолжаем авторизацию
          target: 'authenticating',
        },
      ],
    },
    authenticating: {
      // ...
    },
    blocked: {
      after: {
        // Разблокируем через 30 секунд
        30000: {
          target: 'idle',
          actions: assign({ attempts: 0 }),
        },
      },
    },
  },
});
```

### Именованные guards с setup()

```typescript
import { setup } from 'xstate';

const machine = setup({
  types: {
    context: {} as { items: string[]; maxItems: number },
    events: {} as
      | { type: 'ADD'; item: string }
      | { type: 'REMOVE'; index: number }
      | { type: 'SUBMIT' },
  },
  guards: {
    // Именованный guard — переиспользуется в нескольких местах
    hasItems: ({ context }) => context.items.length > 0,
    isNotFull: ({ context }) => context.items.length < context.maxItems,
    canSubmit: ({ context }) =>
      context.items.length > 0 && context.items.length <= context.maxItems,
  },
}).createMachine({
  initial: 'editing',
  context: {
    items: [],
    maxItems: 5,
  },
  states: {
    editing: {
      on: {
        ADD: {
          actions: assign({
            items: ({ context, event }) => [...context.items, event.item],
          }),
          guard: 'isNotFull', // Ссылка на именованный guard
        },
        REMOVE: {
          actions: assign({
            items: ({ context, event }) =>
              context.items.filter((_, i) => i !== event.index),
          }),
          guard: 'hasItems',
        },
        SUBMIT: {
          target: 'submitted',
          guard: 'canSubmit',
        },
      },
    },
    submitted: {
      type: 'final',
    },
  },
});
```

### Guards с параметрами

```typescript
import { setup } from 'xstate';

const machine = setup({
  guards: {
    // Guard с параметрами через замыкание
    minLength: ({ context }, params: { field: string; min: number }) => {
      const value = context[params.field as keyof typeof context] as string;
      return typeof value === 'string' && value.length >= params.min;
    },
  },
}).createMachine({
  // ...
  states: {
    idle: {
      on: {
        SUBMIT: {
          target: 'submitting',
          guard: {
            type: 'minLength',
            params: { field: 'password', min: 8 },
          },
        },
      },
    },
  },
});
```

## Actions — побочные эффекты

Actions — это побочные эффекты, которые выполняются при переходах, входе или выходе из состояний. Важно: actions не возвращают новое состояние, они лишь выполняют эффекты.

### Типы actions

```typescript
import { createMachine, assign, raise, send, log, cancel } from 'xstate';

const machine = createMachine({
  id: 'example',
  initial: 'idle',
  context: { count: 0, items: [] as string[] },
  states: {
    idle: {
      entry: [
        // 1. assign — изменяет context
        assign({ count: 0 }),

        // 2. log — вывод в консоль (полезно для отладки)
        log('Entered idle state'),

        // 3. raise — отправляет событие самому себе
        raise({ type: 'INIT' }),
      ],
      on: {
        START: {
          target: 'running',
          actions: [
            // Несколько actions выполняются последовательно
            assign({ count: ({ context }) => context.count + 1 }),
            log(({ context }) => `Starting, count: ${context.count}`),
          ],
        },
        INIT: {
          // Обрабатываем поднятое событие
          actions: log('Initialized'),
        },
      },
    },
    running: {
      exit: log('Exiting running state'),
    },
  },
});
```

### assign — обновление контекста

`assign` — самый часто используемый action, обновляет context машины:

```typescript
import { assign } from 'xstate';

// 1. Обновить одно поле
assign({ count: 0 })

// 2. Вычислить новое значение на основе текущего context
assign({ count: ({ context }) => context.count + 1 })

// 3. Обновить несколько полей сразу
assign({
  count: ({ context }) => context.count + 1,
  lastUpdated: () => new Date().toISOString(),
})

// 4. Использовать данные из события
assign({
  user: ({ event }) => event.user,  // event — входящее событие
})

// 5. Функциональная форма — весь объект сразу
assign(({ context, event }) => ({
  items: [...context.items, event.item],
  count: context.items.length + 1,
}))
```

### Пользовательские actions

```typescript
import { setup } from 'xstate';

const machine = setup({
  actions: {
    // Именованный action
    saveToLocalStorage: ({ context }) => {
      localStorage.setItem('formData', JSON.stringify(context));
    },
    clearLocalStorage: () => {
      localStorage.removeItem('formData');
    },
    notifyParent: ({ event }, params: { message: string }) => {
      console.log(`Сообщение для родителя: ${params.message}`);
    },
    trackAnalytics: ({ context, event }) => {
      // Отправка данных в аналитику
      analytics.track('event', { state: context, event });
    },
  },
}).createMachine({
  initial: 'filling',
  context: { name: '', email: '' },
  states: {
    filling: {
      entry: 'saveToLocalStorage',
      on: {
        SUBMIT: {
          target: 'submitted',
          actions: [
            'saveToLocalStorage',
            'trackAnalytics',
            {
              type: 'notifyParent',
              params: { message: 'Форма отправлена' },
            },
          ],
        },
        RESET: {
          actions: ['clearLocalStorage', assign({ name: '', email: '' })],
        },
      },
    },
    submitted: {
      type: 'final',
    },
  },
});
```

### enqueueActions — продвинутое управление

```typescript
import { enqueueActions } from 'xstate';

const machine = createMachine({
  // ...
  states: {
    processing: {
      on: {
        COMPLETE: {
          actions: enqueueActions(({ context, enqueue }) => {
            // Условные actions
            if (context.hasErrors) {
              enqueue.assign({ status: 'error' });
              enqueue.raise({ type: 'SHOW_ERRORS' });
            } else {
              enqueue.assign({ status: 'success' });
              enqueue.raise({ type: 'NAVIGATE_HOME' });
            }
          }),
        },
      },
    },
  },
});
```

## Services/Invoke — асинхронные операции

Invoke позволяет запускать асинхронные операции (Promise, callback, observable, другую машину) при входе в состояние. Когда машина покидает состояние, актор автоматически отменяется.

### fromPromise — работа с Promise

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
          actions: assign({ userId: ({ event }) => event.userId }),
        },
      },
    },
    loading: {
      invoke: {
        // Описываем промис через fromPromise
        src: fromPromise(async ({ input }: { input: { userId: number } }) => {
          const response = await fetch(`/api/users/${input.userId}`);
          if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
          }
          return response.json() as Promise<User>;
        }),
        // Входные данные для промиса (из context или event)
        input: ({ context }) => ({ userId: context.userId! }),
        // Успешное завершение
        onDone: {
          target: 'success',
          actions: assign({
            user: ({ event }) => event.output, // event.output — результат промиса
            error: null,
          }),
        },
        // Ошибка
        onError: {
          target: 'failure',
          actions: assign({
            error: ({ event }) => String(event.error),
          }),
        },
      },
      on: {
        // Отмена загрузки — машина выходит из loading, промис отменяется
        CANCEL: 'idle',
      },
    },
    success: {
      on: {
        RELOAD: 'loading',
        RESET: {
          target: 'idle',
          actions: assign({ user: null, userId: null }),
        },
      },
    },
    failure: {
      on: {
        RETRY: 'loading',
        RESET: {
          target: 'idle',
          actions: assign({ error: null }),
        },
      },
    },
  },
});
```

### fromCallback — работа с подписками

`fromCallback` идеально подходит для WebSocket, EventSource, таймеров и других подписок:

```typescript
import { fromCallback } from 'xstate';

const websocketMachine = createMachine({
  id: 'websocket',
  initial: 'disconnected',
  context: {
    messages: [] as string[],
    url: 'wss://example.com/socket',
  },
  states: {
    disconnected: {
      on: { CONNECT: 'connecting' },
    },
    connecting: {
      invoke: {
        src: fromCallback(({ sendBack, input }) => {
          // Открываем WebSocket
          const ws = new WebSocket(input.url);

          ws.onopen = () => sendBack({ type: 'CONNECTED' });
          ws.onmessage = (event) => sendBack({ type: 'MESSAGE', data: event.data });
          ws.onerror = () => sendBack({ type: 'ERROR' });
          ws.onclose = () => sendBack({ type: 'DISCONNECTED' });

          // Функция cleanup — вызывается при выходе из состояния
          return () => {
            ws.close();
          };
        }),
        input: ({ context }) => ({ url: context.url }),
      },
      on: {
        CONNECTED: 'connected',
        ERROR: 'error',
      },
    },
    connected: {
      invoke: {
        // Продолжаем слушать сообщения в состоянии connected
        src: fromCallback(({ sendBack, input }) => {
          const ws = input.ws as WebSocket;
          ws.onmessage = (event) => sendBack({ type: 'MESSAGE', data: event.data });
          ws.onclose = () => sendBack({ type: 'DISCONNECTED' });

          return () => {
            ws.onmessage = null;
          };
        }),
        input: ({ context }) => ({ ws: context.ws }),
      },
      on: {
        MESSAGE: {
          actions: assign({
            messages: ({ context, event }) => [...context.messages, event.data],
          }),
        },
        DISCONNECTED: 'disconnected',
        DISCONNECT: {
          target: 'disconnected',
          actions: ({ context }) => context.ws?.close(),
        },
      },
    },
    error: {
      on: { RECONNECT: 'connecting' },
    },
  },
});
```

### fromObservable — работа с RxJS

```typescript
import { fromObservable } from 'xstate';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

const timerMachine = createMachine({
  id: 'timer',
  initial: 'idle',
  context: { elapsed: 0 },
  states: {
    idle: {
      on: { START: 'running' },
    },
    running: {
      invoke: {
        src: fromObservable(() =>
          interval(1000).pipe(map((i) => ({ type: 'TICK', seconds: i + 1 })))
        ),
        onSnapshot: {
          // Каждый emit observable → обновляем context
          actions: assign({
            elapsed: ({ event }) => event.snapshot.context.seconds,
          }),
        },
      },
      on: {
        TICK: {
          actions: assign({ elapsed: ({ event }) => event.seconds }),
        },
        PAUSE: 'paused',
        STOP: {
          target: 'idle',
          actions: assign({ elapsed: 0 }),
        },
      },
    },
    paused: {
      on: {
        RESUME: 'running',
        STOP: {
          target: 'idle',
          actions: assign({ elapsed: 0 }),
        },
      },
    },
  },
});
```

## Context — расширенное состояние

Context в XState — это «память» машины, данные, которые не меняют граф состояний, но важны для поведения и отображения.

### Отличие состояния от контекста

```typescript
// Состояние (state value) — конечное множество, меняет граф
type AuthState = 'unauthenticated' | 'loading' | 'authenticated';

// Context — расширенное состояние, произвольные данные
interface AuthContext {
  user: User | null;      // Зависит от состояния, но не определяет его
  token: string | null;
  error: string | null;
  loginAttempts: number;  // Счётчик — изменяется, но не меняет граф
  lastLoginAt: Date | null;
}
```

### Инициализация контекста

```typescript
import { setup } from 'xstate';

const machine = setup({
  types: {
    context: {} as {
      items: string[];
      selectedItem: string | null;
      filter: string;
    },
    // Тип входных данных (input) при запуске машины
    input: {} as { initialItems?: string[] },
  },
}).createMachine({
  initial: 'idle',
  // context как функция — получает input при создании актора
  context: ({ input }) => ({
    items: input.initialItems ?? [],
    selectedItem: null,
    filter: '',
  }),
  states: {
    // ...
  },
});

// Запуск с input
const actor = createActor(machine, {
  input: { initialItems: ['item1', 'item2'] },
});
actor.start();
```

### Иммутабельное обновление контекста

Context в XState всегда обновляется иммутабельно через `assign`:

```typescript
const cartMachine = createMachine({
  id: 'cart',
  initial: 'browsing',
  context: {
    items: [] as CartItem[],
    total: 0,
    coupon: null as string | null,
    discount: 0,
  },
  states: {
    browsing: {
      on: {
        ADD_ITEM: {
          actions: assign(({ context, event }) => {
            const newItems = [...context.items, event.item];
            return {
              items: newItems,
              total: calculateTotal(newItems, context.discount),
            };
          }),
        },
        REMOVE_ITEM: {
          actions: assign(({ context, event }) => {
            const newItems = context.items.filter(
              (item) => item.id !== event.itemId
            );
            return {
              items: newItems,
              total: calculateTotal(newItems, context.discount),
            };
          }),
        },
        APPLY_COUPON: {
          actions: assign({
            coupon: ({ event }) => event.code,
            discount: ({ event }) => event.discountPercent,
          }),
        },
        CHECKOUT: 'checkout',
      },
    },
    checkout: {
      // ...
    },
  },
});

function calculateTotal(items: CartItem[], discount: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return subtotal * (1 - discount / 100);
}
```

## Акторная модель в XState v5

XState v5 полностью переработал концепцию акторов. Актор — это сущность, которая:

1. **Имеет поведение** (машина состояний, функция, промис)
2. **Имеет собственную очередь сообщений**
3. **Общается через сообщения** (события)
4. **Изолирована** — не разделяет состояние с другими акторами

### Создание актора

```typescript
import { createActor, createMachine } from 'xstate';

const counterMachine = createMachine({
  id: 'counter',
  initial: 'active',
  context: { count: 0 },
  states: {
    active: {
      on: {
        INCREMENT: {
          actions: assign({ count: ({ context }) => context.count + 1 }),
        },
        DECREMENT: {
          actions: assign({ count: ({ context }) => context.count - 1 }),
        },
      },
    },
  },
});

// Создаём актора из машины
const counterActor = createActor(counterMachine, {
  input: undefined,       // Начальные данные (если нужны)
  snapshot: undefined,    // Восстановление из снимка (для персистентности)
});

// Запускаем
counterActor.start();

// Подписываемся на изменения
const subscription = counterActor.subscribe((snapshot) => {
  console.log('Счётчик:', snapshot.context.count);
});

// Отправляем события
counterActor.send({ type: 'INCREMENT' });
counterActor.send({ type: 'INCREMENT' });
counterActor.send({ type: 'DECREMENT' });

// Получаем текущий снимок
const snapshot = counterActor.getSnapshot();
console.log(snapshot.value);   // 'active'
console.log(snapshot.context); // { count: 1 }

// Останавливаем и отписываемся
counterActor.stop();
subscription.unsubscribe();
```

### Spawn — дочерние акторы

Машина может создавать дочерних акторов через `spawn`:

```typescript
import { setup, assign, spawnChild } from 'xstate';

const childMachine = createMachine({
  id: 'child',
  initial: 'working',
  context: { result: null as string | null },
  states: {
    working: {
      invoke: {
        src: fromPromise(async ({ input }: { input: { taskId: string } }) => {
          return await doWork(input.taskId);
        }),
        input: ({ event }) => ({ taskId: event.taskId }),
        onDone: {
          target: 'done',
          actions: assign({ result: ({ event }) => event.output }),
        },
      },
    },
    done: { type: 'final' },
  },
});

const parentMachine = setup({
  actors: { childMachine },
}).createMachine({
  id: 'parent',
  initial: 'idle',
  context: {
    workers: {} as Record<string, ActorRefFrom<typeof childMachine>>,
    results: [] as string[],
  },
  states: {
    idle: {
      on: {
        SPAWN_WORKER: {
          actions: assign({
            workers: ({ context, event, spawn }) => ({
              ...context.workers,
              [event.workerId]: spawn('childMachine', {
                id: event.workerId,
                input: { taskId: event.taskId },
              }),
            }),
          }),
        },
      },
    },
  },
});
```

### Взаимодействие между акторами

```typescript
import { sendTo } from 'xstate';

const machine = createMachine({
  // ...
  states: {
    active: {
      on: {
        NOTIFY_CHILD: {
          // sendTo отправляет событие другому актору
          actions: sendTo(
            ({ context }) => context.childRef, // Ссылка на актора
            { type: 'NOTIFY', message: 'Hello' }
          ),
        },
      },
    },
  },
});
```

### Персистентность состояния актора

```typescript
import { createActor } from 'xstate';

// Сохранение снимка
const actor = createActor(machine);
actor.start();
// ... работа ...
const snapshot = actor.getPersistedSnapshot();
localStorage.setItem('machineState', JSON.stringify(snapshot));
actor.stop();

// Восстановление из снимка
const savedSnapshot = JSON.parse(localStorage.getItem('machineState') || 'null');
const restoredActor = createActor(machine, {
  snapshot: savedSnapshot,
});
restoredActor.start();
// Машина продолжит с сохранённого состояния
```

## Вложенные и параллельные состояния

### Hierarchical States — иерархические состояния

```typescript
const authMachine = createMachine({
  id: 'auth',
  initial: 'unauthenticated',
  states: {
    unauthenticated: {
      // Начальное подсостояние
      initial: 'idle',
      states: {
        idle: {
          on: { START_LOGIN: 'loginForm' },
        },
        loginForm: {
          initial: 'filling',
          states: {
            filling: {
              on: {
                UPDATE_EMAIL: {
                  actions: assign({ email: ({ event }) => event.value }),
                },
                UPDATE_PASSWORD: {
                  actions: assign({ password: ({ event }) => event.value }),
                },
                SUBMIT: {
                  target: 'submitting',
                  guard: ({ context }) =>
                    context.email.includes('@') && context.password.length >= 6,
                },
              },
            },
            submitting: {
              invoke: {
                src: fromPromise(async ({ input }) => login(input)),
                input: ({ context }) => ({
                  email: context.email,
                  password: context.password,
                }),
                // '#auth.authenticated' — абсолютная ссылка на состояние
                onDone: '#auth.authenticated',
                onError: 'error',
              },
            },
            error: {
              on: { RETRY: 'filling' },
            },
          },
          on: {
            CANCEL: 'idle',
          },
        },
      },
    },
    authenticated: {
      initial: 'active',
      states: {
        active: {
          on: {
            IDLE_TIMEOUT: 'idle',
          },
        },
        idle: {
          after: {
            // Выход через 5 минут бездействия
            300000: '#auth.unauthenticated',
          },
          on: {
            ACTIVITY: 'active',
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

### Parallel States — параллельные состояния

```typescript
const videoPlayerMachine = createMachine({
  id: 'videoPlayer',
  // type: 'parallel' — все дочерние состояния активны одновременно
  type: 'parallel',
  context: {
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
  },
  states: {
    // Состояние воспроизведения
    playback: {
      initial: 'paused',
      states: {
        paused: {
          on: { PLAY: 'playing' },
        },
        playing: {
          invoke: {
            src: fromCallback(({ sendBack }) => {
              const interval = setInterval(
                () => sendBack({ type: 'TICK' }),
                1000
              );
              return () => clearInterval(interval);
            }),
          },
          on: {
            TICK: {
              actions: assign({
                currentTime: ({ context }) => context.currentTime + 1,
              }),
            },
            PAUSE: 'paused',
            END: 'ended',
          },
        },
        ended: {
          on: { RESTART: 'paused' },
        },
      },
    },

    // Состояние звука (независимо от playback)
    audio: {
      initial: 'unmuted',
      states: {
        unmuted: {
          on: {
            MUTE: 'muted',
            SET_VOLUME: {
              actions: assign({ volume: ({ event }) => event.volume }),
            },
          },
        },
        muted: {
          on: { UNMUTE: 'unmuted' },
        },
      },
    },

    // Состояние полноэкранного режима (тоже независимо)
    fullscreen: {
      initial: 'windowed',
      states: {
        windowed: {
          on: { ENTER_FULLSCREEN: 'fullscreen' },
        },
        fullscreen: {
          on: { EXIT_FULLSCREEN: 'windowed' },
        },
      },
    },
  },
});
```

```tsx
function VideoPlayer() {
  const [state, send] = useMachine(videoPlayerMachine);

  // Проверка параллельных состояний
  const isPlaying = state.matches({ playback: 'playing' });
  const isMuted = state.matches({ audio: 'muted' });
  const isFullscreen = state.matches({ fullscreen: 'fullscreen' });

  return (
    <div>
      <video />
      <div className="controls">
        <button onClick={() => send({ type: isPlaying ? 'PAUSE' : 'PLAY' })}>
          {isPlaying ? '⏸' : '▶️'}
        </button>
        <button onClick={() => send({ type: isMuted ? 'UNMUTE' : 'MUTE' })}>
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button onClick={() => send({ type: isFullscreen ? 'EXIT_FULLSCREEN' : 'ENTER_FULLSCREEN' })}>
          {isFullscreen ? '⛶' : '⛶'}
        </button>
      </div>
      <p>{state.context.currentTime}s / {state.context.duration}s</p>
    </div>
  );
}
```

## Интеграция с React

### useMachine — основной хук

```tsx
import { useMachine } from '@xstate/react';
import { counterMachine } from './counterMachine';

function Counter() {
  // useMachine создаёт актора, запускает его и возвращает [snapshot, send, actorRef]
  const [state, send] = useMachine(counterMachine);

  return (
    <div>
      <p>Состояние: {state.value}</p>
      <p>Счётчик: {state.context.count}</p>

      <button
        onClick={() => send({ type: 'INCREMENT' })}
        disabled={state.matches('loading')} // Блокируем во время загрузки
      >
        +
      </button>

      <button onClick={() => send({ type: 'DECREMENT' })}>
        -
      </button>

      {/* Рендер по состоянию */}
      {state.matches('error') && (
        <p>Ошибка: {state.context.error}</p>
      )}
    </div>
  );
}
```

### useActor — работа с переданными акторами

```tsx
import { useActor } from '@xstate/react';
import type { ActorRefFrom } from 'xstate';
import { counterMachine } from './counterMachine';

// Компонент принимает actorRef вместо создания своего
function CounterDisplay({
  actorRef,
}: {
  actorRef: ActorRefFrom<typeof counterMachine>;
}) {
  // useActor подписывается на существующего актора
  const [state, send] = useActor(actorRef);

  return (
    <div>
      <p>{state.context.count}</p>
      <button onClick={() => send({ type: 'INCREMENT' })}>+</button>
    </div>
  );
}

// Родительский компонент
function App() {
  // Создаём одного актора...
  const [state, send, actorRef] = useMachine(counterMachine);

  return (
    <div>
      {/* ...и передаём его нескольким потребителям */}
      <CounterDisplay actorRef={actorRef} />
      <CounterDisplay actorRef={actorRef} />
    </div>
  );
}
```

### useSelector — оптимизация рендеров

```tsx
import { useSelector } from '@xstate/react';
import type { ActorRefFrom } from 'xstate';

// Этот компонент ре-рендерится ТОЛЬКО когда изменяется count
function CountDisplay({
  actorRef,
}: {
  actorRef: ActorRefFrom<typeof counterMachine>;
}) {
  const count = useSelector(actorRef, (snapshot) => snapshot.context.count);
  return <p>Счётчик: {count}</p>;
}

// Этот компонент ре-рендерится ТОЛЬКО когда изменяется value состояния
function StateDisplay({
  actorRef,
}: {
  actorRef: ActorRefFrom<typeof counterMachine>;
}) {
  const stateName = useSelector(actorRef, (snapshot) =>
    String(snapshot.value)
  );
  return <p>Состояние: {stateName}</p>;
}

// Сравнение с пользовательской функцией сравнения
function UserDisplay({
  actorRef,
}: {
  actorRef: ActorRefFrom<typeof userMachine>;
}) {
  // Ре-рендерится только если изменился id или name пользователя
  const userInfo = useSelector(
    actorRef,
    (snapshot) => ({
      id: snapshot.context.user?.id,
      name: snapshot.context.user?.name,
    }),
    // Кастомная функция сравнения (иначе useSelector сравнивает по ссылке)
    (a, b) => a.id === b.id && a.name === b.name
  );

  return <p>{userInfo.name}</p>;
}
```

## Практические примеры

### Пример 1: Форма входа

```typescript
// loginMachine.ts
import { setup, assign, fromPromise } from 'xstate';

interface LoginContext {
  email: string;
  password: string;
  error: string | null;
  token: string | null;
}

type LoginEvent =
  | { type: 'UPDATE_EMAIL'; value: string }
  | { type: 'UPDATE_PASSWORD'; value: string }
  | { type: 'SUBMIT' }
  | { type: 'LOGOUT' };

export const loginMachine = setup({
  types: {
    context: {} as LoginContext,
    events: {} as LoginEvent,
  },
  actors: {
    loginUser: fromPromise(async ({
      input,
    }: {
      input: { email: string; password: string };
    }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || 'Ошибка авторизации');
      }
      return response.json() as Promise<{ token: string }>;
    }),
  },
  guards: {
    isFormValid: ({ context }) =>
      context.email.includes('@') && context.password.length >= 6,
  },
  actions: {
    saveToken: ({ context }) => {
      if (context.token) {
        localStorage.setItem('token', context.token);
      }
    },
    clearToken: () => {
      localStorage.removeItem('token');
    },
  },
}).createMachine({
  id: 'login',
  initial: 'idle',
  context: {
    email: '',
    password: '',
    error: null,
    token: null,
  },
  states: {
    idle: {
      on: {
        UPDATE_EMAIL: {
          actions: assign({ email: ({ event }) => event.value }),
        },
        UPDATE_PASSWORD: {
          actions: assign({ password: ({ event }) => event.value }),
        },
        SUBMIT: {
          target: 'loading',
          guard: 'isFormValid',
        },
      },
    },
    loading: {
      invoke: {
        src: 'loginUser',
        input: ({ context }) => ({
          email: context.email,
          password: context.password,
        }),
        onDone: {
          target: 'authenticated',
          actions: [
            assign({ token: ({ event }) => event.output.token, error: null }),
            'saveToken',
          ],
        },
        onError: {
          target: 'idle',
          actions: assign({
            error: ({ event }) => String(event.error),
          }),
        },
      },
    },
    authenticated: {
      on: {
        LOGOUT: {
          target: 'idle',
          actions: [
            assign({ token: null, email: '', password: '' }),
            'clearToken',
          ],
        },
      },
    },
  },
});
```

```tsx
// LoginForm.tsx
import { useMachine } from '@xstate/react';
import { loginMachine } from './loginMachine';

export function LoginForm() {
  const [state, send] = useMachine(loginMachine);

  if (state.matches('authenticated')) {
    return (
      <div>
        <p>Вы вошли в систему!</p>
        <button onClick={() => send({ type: 'LOGOUT' })}>Выйти</button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send({ type: 'SUBMIT' });
      }}
    >
      <h1>Вход</h1>

      {state.context.error && (
        <div className="error">{state.context.error}</div>
      )}

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={state.context.email}
          onChange={(e) =>
            send({ type: 'UPDATE_EMAIL', value: e.target.value })
          }
          disabled={state.matches('loading')}
        />
      </div>

      <div>
        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          value={state.context.password}
          onChange={(e) =>
            send({ type: 'UPDATE_PASSWORD', value: e.target.value })
          }
          disabled={state.matches('loading')}
        />
      </div>

      <button
        type="submit"
        disabled={state.matches('loading')}
      >
        {state.matches('loading') ? 'Загрузка...' : 'Войти'}
      </button>
    </form>
  );
}
```

### Пример 2: Загрузка и отображение данных

```typescript
// dataFetchMachine.ts
import { setup, assign, fromPromise } from 'xstate';

export function createDataFetchMachine<T>(
  fetcher: (params: Record<string, unknown>) => Promise<T>
) {
  return setup({
    types: {
      context: {} as {
        data: T | null;
        error: string | null;
        params: Record<string, unknown>;
        retryCount: number;
      },
      events: {} as
        | { type: 'FETCH'; params?: Record<string, unknown> }
        | { type: 'RETRY' }
        | { type: 'CANCEL' }
        | { type: 'RESET' },
    },
    actors: {
      fetchData: fromPromise(async ({
        input,
      }: {
        input: { params: Record<string, unknown> };
      }) => {
        return fetcher(input.params);
      }),
    },
    guards: {
      canRetry: ({ context }) => context.retryCount < 3,
    },
  }).createMachine({
    id: 'dataFetch',
    initial: 'idle',
    context: {
      data: null,
      error: null,
      params: {},
      retryCount: 0,
    },
    states: {
      idle: {
        on: {
          FETCH: {
            target: 'loading',
            actions: assign({
              params: ({ event }) => event.params ?? {},
              error: null,
            }),
          },
        },
      },
      loading: {
        invoke: {
          src: 'fetchData',
          input: ({ context }) => ({ params: context.params }),
          onDone: {
            target: 'success',
            actions: assign({ data: ({ event }) => event.output, retryCount: 0 }),
          },
          onError: {
            target: 'error',
            actions: assign({ error: ({ event }) => String(event.error) }),
          },
        },
        on: {
          CANCEL: 'idle',
        },
      },
      success: {
        on: {
          FETCH: {
            target: 'loading',
            actions: assign({ params: ({ event }) => event.params ?? {} }),
          },
          RESET: {
            target: 'idle',
            actions: assign({ data: null }),
          },
        },
      },
      error: {
        on: {
          RETRY: {
            target: 'loading',
            guard: 'canRetry',
            actions: assign({ retryCount: ({ context }) => context.retryCount + 1 }),
          },
          RESET: {
            target: 'idle',
            actions: assign({ error: null, retryCount: 0 }),
          },
        },
      },
    },
  });
}
```

```tsx
// UsersPage.tsx
import { useMachine } from '@xstate/react';
import { createDataFetchMachine } from './dataFetchMachine';
import { useEffect } from 'react';

interface User { id: number; name: string; }

const usersFetchMachine = createDataFetchMachine<User[]>(
  async () => {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Ошибка загрузки');
    return res.json();
  }
);

export function UsersPage() {
  const [state, send] = useMachine(usersFetchMachine);

  useEffect(() => {
    send({ type: 'FETCH' });
  }, []);

  return (
    <div>
      {state.matches('idle') && (
        <button onClick={() => send({ type: 'FETCH' })}>Загрузить</button>
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
            {state.context.data?.map((user) => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
          <button onClick={() => send({ type: 'FETCH' })}>Обновить</button>
        </div>
      )}

      {state.matches('error') && (
        <div>
          <p>Ошибка: {state.context.error}</p>
          <p>Попытка {state.context.retryCount} из 3</p>
          <button onClick={() => send({ type: 'RETRY' })}>Повторить</button>
          <button onClick={() => send({ type: 'RESET' })}>Сбросить</button>
        </div>
      )}
    </div>
  );
}
```

### Пример 3: Мультишаговая форма (wizard)

```typescript
// wizardMachine.ts
import { setup, assign, fromPromise } from 'xstate';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface AddressInfo {
  street: string;
  city: string;
  country: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiry: string;
  cvv: string;
}

interface WizardContext {
  step: number;
  totalSteps: number;
  personal: PersonalInfo;
  address: AddressInfo;
  payment: PaymentInfo;
  orderId: string | null;
  error: string | null;
}

export const wizardMachine = setup({
  types: {
    context: {} as WizardContext,
    events: {} as
      | { type: 'UPDATE_PERSONAL'; data: Partial<PersonalInfo> }
      | { type: 'UPDATE_ADDRESS'; data: Partial<AddressInfo> }
      | { type: 'UPDATE_PAYMENT'; data: Partial<PaymentInfo> }
      | { type: 'NEXT' }
      | { type: 'BACK' }
      | { type: 'SUBMIT' }
      | { type: 'RESTART' },
  },
  actors: {
    submitOrder: fromPromise(async ({ input }: { input: WizardContext }) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Ошибка при создании заказа');
      return response.json() as Promise<{ orderId: string }>;
    }),
  },
  guards: {
    isPersonalValid: ({ context }) =>
      context.personal.firstName.length > 0 &&
      context.personal.lastName.length > 0 &&
      context.personal.email.includes('@'),
    isAddressValid: ({ context }) =>
      context.address.street.length > 0 &&
      context.address.city.length > 0 &&
      context.address.country.length > 0,
    isPaymentValid: ({ context }) =>
      context.payment.cardNumber.replace(/\s/g, '').length === 16 &&
      context.payment.expiry.length === 5 &&
      context.payment.cvv.length === 3,
  },
}).createMachine({
  id: 'wizard',
  initial: 'personal',
  context: {
    step: 1,
    totalSteps: 4,
    personal: { firstName: '', lastName: '', email: '' },
    address: { street: '', city: '', country: '' },
    payment: { cardNumber: '', expiry: '', cvv: '' },
    orderId: null,
    error: null,
  },
  states: {
    personal: {
      entry: assign({ step: 1 }),
      on: {
        UPDATE_PERSONAL: {
          actions: assign({
            personal: ({ context, event }) => ({
              ...context.personal,
              ...event.data,
            }),
          }),
        },
        NEXT: {
          target: 'address',
          guard: 'isPersonalValid',
        },
      },
    },
    address: {
      entry: assign({ step: 2 }),
      on: {
        UPDATE_ADDRESS: {
          actions: assign({
            address: ({ context, event }) => ({
              ...context.address,
              ...event.data,
            }),
          }),
        },
        NEXT: {
          target: 'payment',
          guard: 'isAddressValid',
        },
        BACK: 'personal',
      },
    },
    payment: {
      entry: assign({ step: 3 }),
      on: {
        UPDATE_PAYMENT: {
          actions: assign({
            payment: ({ context, event }) => ({
              ...context.payment,
              ...event.data,
            }),
          }),
        },
        NEXT: {
          target: 'review',
          guard: 'isPaymentValid',
        },
        BACK: 'address',
      },
    },
    review: {
      entry: assign({ step: 4 }),
      on: {
        SUBMIT: 'submitting',
        BACK: 'payment',
      },
    },
    submitting: {
      invoke: {
        src: 'submitOrder',
        input: ({ context }) => context,
        onDone: {
          target: 'success',
          actions: assign({
            orderId: ({ event }) => event.output.orderId,
          }),
        },
        onError: {
          target: 'review',
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
    },
    success: {
      type: 'final',
      on: {
        RESTART: {
          target: 'personal',
          actions: assign({
            personal: { firstName: '', lastName: '', email: '' },
            address: { street: '', city: '', country: '' },
            payment: { cardNumber: '', expiry: '', cvv: '' },
            orderId: null,
            error: null,
          }),
        },
      },
    },
  },
});
```

```tsx
// CheckoutWizard.tsx
import { useMachine } from '@xstate/react';
import { wizardMachine } from './wizardMachine';

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="progress">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`step ${i + 1 <= step ? 'active' : ''}`}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

export function CheckoutWizard() {
  const [state, send] = useMachine(wizardMachine);

  return (
    <div className="wizard">
      <ProgressBar step={state.context.step} total={state.context.totalSteps} />

      {state.matches('personal') && (
        <div>
          <h2>Шаг 1: Личные данные</h2>
          <input
            placeholder="Имя"
            value={state.context.personal.firstName}
            onChange={(e) =>
              send({ type: 'UPDATE_PERSONAL', data: { firstName: e.target.value } })
            }
          />
          <input
            placeholder="Фамилия"
            value={state.context.personal.lastName}
            onChange={(e) =>
              send({ type: 'UPDATE_PERSONAL', data: { lastName: e.target.value } })
            }
          />
          <input
            type="email"
            placeholder="Email"
            value={state.context.personal.email}
            onChange={(e) =>
              send({ type: 'UPDATE_PERSONAL', data: { email: e.target.value } })
            }
          />
          <button onClick={() => send({ type: 'NEXT' })}>Далее →</button>
        </div>
      )}

      {state.matches('address') && (
        <div>
          <h2>Шаг 2: Адрес доставки</h2>
          <input
            placeholder="Улица, дом"
            value={state.context.address.street}
            onChange={(e) =>
              send({ type: 'UPDATE_ADDRESS', data: { street: e.target.value } })
            }
          />
          <input
            placeholder="Город"
            value={state.context.address.city}
            onChange={(e) =>
              send({ type: 'UPDATE_ADDRESS', data: { city: e.target.value } })
            }
          />
          <input
            placeholder="Страна"
            value={state.context.address.country}
            onChange={(e) =>
              send({ type: 'UPDATE_ADDRESS', data: { country: e.target.value } })
            }
          />
          <button onClick={() => send({ type: 'BACK' })}>← Назад</button>
          <button onClick={() => send({ type: 'NEXT' })}>Далее →</button>
        </div>
      )}

      {state.matches('payment') && (
        <div>
          <h2>Шаг 3: Оплата</h2>
          <input
            placeholder="Номер карты"
            value={state.context.payment.cardNumber}
            onChange={(e) =>
              send({ type: 'UPDATE_PAYMENT', data: { cardNumber: e.target.value } })
            }
          />
          <input
            placeholder="MM/YY"
            value={state.context.payment.expiry}
            onChange={(e) =>
              send({ type: 'UPDATE_PAYMENT', data: { expiry: e.target.value } })
            }
          />
          <input
            placeholder="CVV"
            value={state.context.payment.cvv}
            onChange={(e) =>
              send({ type: 'UPDATE_PAYMENT', data: { cvv: e.target.value } })
            }
          />
          <button onClick={() => send({ type: 'BACK' })}>← Назад</button>
          <button onClick={() => send({ type: 'NEXT' })}>Далее →</button>
        </div>
      )}

      {state.matches('review') && (
        <div>
          <h2>Шаг 4: Подтверждение заказа</h2>
          {state.context.error && (
            <p className="error">{state.context.error}</p>
          )}
          <div>
            <p>Имя: {state.context.personal.firstName} {state.context.personal.lastName}</p>
            <p>Email: {state.context.personal.email}</p>
            <p>Адрес: {state.context.address.street}, {state.context.address.city}</p>
            <p>Карта: **** {state.context.payment.cardNumber.slice(-4)}</p>
          </div>
          <button onClick={() => send({ type: 'BACK' })}>← Назад</button>
          <button onClick={() => send({ type: 'SUBMIT' })}>Оформить заказ</button>
        </div>
      )}

      {state.matches('submitting') && (
        <div>
          <p>Оформляем заказ...</p>
        </div>
      )}

      {state.matches('success') && (
        <div>
          <h2>Заказ оформлен!</h2>
          <p>Номер заказа: {state.context.orderId}</p>
          <button onClick={() => send({ type: 'RESTART' })}>
            Сделать ещё один заказ
          </button>
        </div>
      )}
    </div>
  );
}
```

## Визуализация с XState Visualizer

Одно из главных преимуществ XState — возможность визуализации машины состояний.

### Stately Inspector в браузере

```tsx
import { createBrowserInspector } from '@statelyai/inspect';

// Установка: npm install @statelyai/inspect
const { inspect } = createBrowserInspector();

function App() {
  const [state, send] = useMachine(loginMachine, {
    inspect, // Подключаем инспектор
  });

  return <LoginForm state={state} send={send} />;
}
```

После добавления инспектора при запуске откроется боковая панель, где можно:
- Видеть текущее состояние и историю переходов
- Просматривать context в реальном времени
- Вручную отправлять события
- Просматривать диаграмму переходов

### Stately Editor — визуальное редактирование

На сайте [stately.ai](https://stately.ai) вы можете:
1. Вставить код машины и получить интерактивную диаграмму
2. Редактировать машину визуально и получать код
3. Симулировать переходы прямо в браузере
4. Генерировать тесты на основе диаграммы
5. Делиться диаграммами с командой

```bash
# Экспорт машины для Stately Editor
npx xstate-codegen generate --source ./src/machines
```

### Автоматическое тестирование переходов

```typescript
import { createTestModel } from '@xstate/test';
import { createMachine } from 'xstate';

// Создаём тестовую модель
const testModel = createTestModel(loginMachine);

// Генерируем все возможные пути
const paths = testModel.getShortestPaths();

// Выполняем тесты для каждого пути
for (const path of paths) {
  it(`Переход: ${path.description}`, async () => {
    await path.test({
      states: {
        idle: async () => {
          expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
        },
        loading: async () => {
          expect(screen.getByText(/загрузка/i)).toBeInTheDocument();
        },
        authenticated: async () => {
          expect(screen.getByText(/вы вошли/i)).toBeInTheDocument();
        },
      },
      events: {
        SUBMIT: async () => {
          fireEvent.click(screen.getByRole('button', { name: /войти/i }));
        },
        LOGOUT: async () => {
          fireEvent.click(screen.getByRole('button', { name: /выйти/i }));
        },
      },
    });
  });
}
```

## TypeScript и XState

### setup() — типобезопасная конфигурация

```typescript
import { setup, assign, fromPromise } from 'xstate';

// Объявляем все типы в одном месте
const machine = setup({
  types: {
    // Тип контекста
    context: {} as {
      user: User | null;
      token: string | null;
      error: string | null;
      loginAttempts: number;
    },
    // Тип событий (дискриминируемый union)
    events: {} as
      | { type: 'LOGIN'; email: string; password: string }
      | { type: 'LOGOUT' }
      | { type: 'REFRESH_TOKEN'; token: string }
      | { type: 'CLEAR_ERROR' },
    // Тип входных данных при создании актора
    input: {} as {
      initialToken?: string;
    },
  },
  // Декларируем actors с типами
  actors: {
    authenticateUser: fromPromise(
      async ({ input }: { input: { email: string; password: string } }) => {
        // TypeScript знает тип input
        const response = await fetch('/api/auth', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        return response.json() as Promise<{ user: User; token: string }>;
      }
    ),
  },
  // Декларируем guards с типизированным context и events
  guards: {
    isAuthenticated: ({ context }) => context.token !== null,
    // TypeScript выведет типы context и event
    hasValidCredentials: ({ event }) => {
      if (event.type !== 'LOGIN') return false;
      return event.email.includes('@') && event.password.length >= 8;
    },
  },
  // Декларируем actions
  actions: {
    clearError: assign({ error: null }),
    incrementAttempts: assign({
      loginAttempts: ({ context }) => context.loginAttempts + 1,
    }),
  },
}).createMachine({
  id: 'auth',
  initial: 'idle',
  context: ({ input }) => ({
    user: null,
    token: input.initialToken ?? null,
    error: null,
    loginAttempts: 0,
  }),
  states: {
    idle: {
      on: {
        LOGIN: {
          target: 'loading',
          guard: 'hasValidCredentials', // TypeScript проверяет имя
        },
      },
    },
    loading: {
      invoke: {
        src: 'authenticateUser', // TypeScript проверяет имя
        input: ({ event }) => {
          if (event.type !== 'LOGIN') throw new Error('Unexpected event');
          return { email: event.email, password: event.password };
        },
        onDone: {
          target: 'authenticated',
          actions: assign({
            user: ({ event }) => event.output.user, // TypeScript знает тип output
            token: ({ event }) => event.output.token,
          }),
        },
        onError: {
          target: 'idle',
          actions: [
            assign({ error: ({ event }) => String(event.error) }),
            'incrementAttempts',
          ],
        },
      },
    },
    authenticated: {
      on: {
        LOGOUT: {
          target: 'idle',
          actions: assign({ user: null, token: null }),
        },
      },
    },
  },
});

// Типизированный экземпляр
type MachineType = typeof machine;
type MachineState = ReturnType<MachineType['transition']>;
type ActorRef = ActorRefFrom<MachineType>;
```

## Советы и лучшие практики

### 1. Называйте состояния существительными

```typescript
// Плохо — глаголы создают неоднозначность
const states = { loading: {}, loaded: {}, failing: {} };

// Хорошо — существительные, описывают текущую ситуацию
const states = { idle: {}, loading: {}, success: {}, failure: {} };
```

### 2. Называйте события глаголами в повелительном наклонении или именами событий

```typescript
// Плохо
send({ type: 'loading' });
send({ type: 'loaded' });

// Хорошо
send({ type: 'FETCH' });
send({ type: 'FETCH_SUCCESS' });
send({ type: 'FETCH_FAILURE' });
```

### 3. Выносите машины в отдельные файлы

```
src/
├── machines/
│   ├── loginMachine.ts
│   ├── checkoutMachine.ts
│   └── userMachine.ts
├── components/
│   ├── LoginForm.tsx   # Использует loginMachine
│   └── Checkout.tsx    # Использует checkoutMachine
```

### 4. Не злоупотребляйте XState

```typescript
// Не нужен XState — простой useState достаточен
const [isOpen, setIsOpen] = useState(false);

// Стоит рассмотреть XState
// - Больше 2-3 состояний
// - Асинхронные операции с обработкой ошибок
// - Переходы зависят от текущего состояния
// - Нужна история переходов
// - Нужна визуализация для команды
```

### 5. Используйте always для немедленных переходов

```typescript
states: {
  validating: {
    // always выполняется немедленно при входе в состояние
    always: [
      { target: 'valid', guard: 'isFormValid' },
      { target: 'invalid' },
    ],
  },
}
```

### 6. Не изменяйте context напрямую

```typescript
// Неправильно — прямое изменение context
actions: {
  badAction: ({ context }) => {
    context.count += 1; // Никогда так не делайте!
  },
}

// Правильно — через assign
actions: {
  goodAction: assign({ count: ({ context }) => context.count + 1 }),
}
```

### 7. Тестируйте переходы, а не состояние компонентов

```typescript
import { createActor } from 'xstate';
import { loginMachine } from './loginMachine';

describe('loginMachine', () => {
  it('должен перейти из idle в loading при SUBMIT с валидными данными', () => {
    const actor = createActor(loginMachine).start();
    actor.send({ type: 'UPDATE_EMAIL', value: 'test@example.com' });
    actor.send({ type: 'UPDATE_PASSWORD', value: 'password123' });
    actor.send({ type: 'SUBMIT' });

    expect(actor.getSnapshot().matches('loading')).toBe(true);
  });

  it('не должен переходить при невалидном email', () => {
    const actor = createActor(loginMachine).start();
    actor.send({ type: 'UPDATE_EMAIL', value: 'notanemail' });
    actor.send({ type: 'UPDATE_PASSWORD', value: 'password123' });
    actor.send({ type: 'SUBMIT' });

    expect(actor.getSnapshot().matches('idle')).toBe(true); // Остались в idle
  });
});
```

### 8. Используйте history-состояния для восстановления подсостояний

```typescript
const machine = createMachine({
  id: 'app',
  initial: 'main',
  states: {
    main: {
      initial: 'dashboard',
      states: {
        dashboard: {},
        settings: {
          initial: 'profile',
          states: {
            profile: {},
            security: {},
            notifications: {},
          },
        },
        // history — запоминает последнее активное подсостояние
        hist: { type: 'history', history: 'deep' },
      },
    },
    modal: {
      on: {
        CLOSE: 'main.hist', // Возвращаемся к последнему подсостоянию
      },
    },
  },
});
```

## Сравнение с другими подходами

| Аспект | XState | useState/useReducer | Zustand | Redux Toolkit |
|--------|--------|---------------------|---------|---------------|
| Концепция | Конечные автоматы | Свободное состояние | Хранилище с методами | Flux/Redux |
| Явные состояния | Да | Нет | Нет | Нет |
| Невалидные состояния | Исключены | Возможны | Возможны | Возможны |
| Визуализация | Да (Stately) | Нет | Нет | Да (DevTools) |
| Async из коробки | Да (actors) | Через useEffect | Нет | Через thunk/saga |
| Кривая обучения | Высокая | Низкая | Низкая | Средняя |
| Тестируемость | Отличная | Хорошая | Хорошая | Хорошая |
| Лучше для | Сложная UI-логика | Простое локальное состояние | Простое глобальное | Большие глобальные |
| Размер бандла | ~18kb | 0 (встроен) | ~1.1kb | ~20kb |

## Заключение

XState — мощный инструмент для управления сложными состояниями в JavaScript и React-приложениях. Ключевые преимущества:

**Предсказуемость**: конечные автоматы делают поведение системы явным. Вы точно знаете, в каком состоянии может находиться система и какие переходы возможны.

**Безопасность типов**: интеграция с TypeScript через `setup()` обеспечивает полную типизацию: context, events, actors, guards и actions — всё типизировано.

**Визуализация**: Stately Inspector и stately.ai позволяют видеть диаграмму состояний в реальном времени. Это бесценно при работе в команде — дизайнеры и менеджеры могут понять логику без чтения кода.

**Тестируемость**: каждый переход тестируется изолированно. `@xstate/test` генерирует тесты автоматически из диаграммы.

**Акторная модель**: XState v5 строится на акторной модели, что делает асинхронные операции первоклассными гражданами библиотеки.

XState стоит применять, когда:
- У вас есть многошаговые процессы (оформление заказа, онбординг, wizards)
- Логика имеет более 3-4 состояний с различными переходами
- Важна надёжность и предсказуемость (банковские операции, медицинские системы)
- Нужна визуализация для команды
- Асинхронные операции требуют сложной обработки (retry, cancel, timeout)

Начните с малого — возьмите один компонент с несколькими флагами состояния и переведите его на XState. Увидите разницу сразу.
