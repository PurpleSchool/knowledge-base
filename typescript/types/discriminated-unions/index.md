---
metaTitle: "Дискриминированные объединения в TypeScript (Discriminated Unions)"
metaDescription: "Что такое дискриминированные объединения в TypeScript, как их использовать для безопасной обработки сложных типов и исчерпывающих проверок."
author: "Антон Ларичев"
title: "Дискриминированные объединения в TypeScript"
preview: "Разбираем дискриминированные объединения — мощный паттерн TypeScript для моделирования состояний, безопасного сужения типов и исчерпывающих проверок."
---

## Что такое дискриминированные объединения

Дискриминированные объединения (discriminated unions, или tagged unions) — это паттерн TypeScript, позволяющий объединить несколько типов в один через поле-«метку» (discriminant). Компилятор использует это поле, чтобы точно определить, с каким из типов вы работаете в каждой конкретной ветке кода.

Паттерн строится на трёх составляющих:

1. Несколько типов с общим полем-дискриминантом (обычно `kind`, `type` или `status`), значение которого — строковый или числовой литерал.
2. Объединение этих типов через `|`.
3. Сужение типа (type narrowing) через `switch` или `if` по значению дискриминанта.

```typescript
type Circle = {
  kind: 'circle';
  radius: number;
};

type Rectangle = {
  kind: 'rectangle';
  width: number;
  height: number;
};

type Triangle = {
  kind: 'triangle';
  base: number;
  height: number;
};

type Shape = Circle | Rectangle | Triangle;
```

Здесь `kind` — дискриминант. Каждый тип имеет это поле с уникальным литеральным значением, поэтому TypeScript способен автоматически сузить тип внутри каждой ветки.

## Сужение типов через switch

Самый идиоматичный способ работы с дискриминированными объединениями — оператор `switch` по полю-дискриминанту.

```typescript
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      // здесь TypeScript знает, что shape — Circle
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      // здесь shape — Rectangle
      return shape.width * shape.height;
    case 'triangle':
      // здесь shape — Triangle
      return (shape.base * shape.height) / 2;
  }
}
```

Внутри каждого `case` компилятор автоматически сужает тип: в ветке `'circle'` обращение к `shape.radius` безопасно, попытка получить `shape.width` вызовет ошибку компиляции.

```typescript
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return shape.width; // Error: Property 'width' does not exist on type 'Circle'
  }
}
```

## Исчерпывающие проверки (exhaustiveness checking)

Одно из главных преимуществ дискриминированных объединений — возможность убедиться, что вы обработали все варианты типа. Если добавить новый вариант в объединение, компилятор укажет на все места, где обработка неполна.

Для этого используют тип `never` и вспомогательную функцию:

```typescript
function assertNever(value: never): never {
  throw new Error(`Unhandled discriminant value: ${JSON.stringify(value)}`);
}

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    default:
      return assertNever(shape); // если забыли ветку — ошибка компиляции
  }
}
```

Теперь добавим новую фигуру:

```typescript
type Ellipse = {
  kind: 'ellipse';
  semiA: number;
  semiB: number;
};

type Shape = Circle | Rectangle | Triangle | Ellipse;

// Ошибка: Argument of type 'Ellipse' is not assignable to parameter of type 'never'
// TypeScript сообщает, что ветка 'ellipse' не обработана
```

Компилятор немедленно сигнализирует о пропущенной ветке — это делает код устойчивым к расширению.

## Моделирование состояний приложения

Дискриминированные объединения особенно удобны для представления состояний загрузки данных — классическая задача в любом приложении.

```typescript
type LoadingState = {
  status: 'loading';
};

type SuccessState<T> = {
  status: 'success';
  data: T;
};

type ErrorState = {
  status: 'error';
  message: string;
  code: number;
};

type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState;
```

Теперь функция рендеринга не даст перепутать состояния:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};

function renderUserProfile(state: AsyncState<User>): string {
  switch (state.status) {
    case 'loading':
      return '<Spinner />';
    case 'success':
      // state.data гарантированно доступен
      return `<Profile name="${state.data.name}" email="${state.data.email}" />`;
    case 'error':
      // state.message и state.code гарантированно доступны
      return `<Error code="${state.code}" message="${state.message}" />`;
  }
}
```

Без дискриминированных объединений пришлось бы либо делать все поля необязательными, либо постоянно проверять их наличие вручную — оба подхода ненадёжны.

## Обработка событий и сообщений

Паттерн прекрасно подходит для систем событий, где каждое событие имеет собственный набор данных.

```typescript
type UserCreatedEvent = {
  type: 'USER_CREATED';
  payload: {
    userId: string;
    email: string;
    createdAt: string;
  };
};

type UserDeletedEvent = {
  type: 'USER_DELETED';
  payload: {
    userId: string;
    reason: string;
  };
};

type OrderPlacedEvent = {
  type: 'ORDER_PLACED';
  payload: {
    orderId: string;
    userId: string;
    totalAmount: number;
    items: string[];
  };
};

type AppEvent = UserCreatedEvent | UserDeletedEvent | OrderPlacedEvent;

function handleEvent(event: AppEvent): void {
  switch (event.type) {
    case 'USER_CREATED':
      console.log(`Новый пользователь: ${event.payload.email}`);
      sendWelcomeEmail(event.payload.email);
      break;
    case 'USER_DELETED':
      console.log(`Удалён пользователь ${event.payload.userId}: ${event.payload.reason}`);
      cleanupUserData(event.payload.userId);
      break;
    case 'ORDER_PLACED':
      console.log(`Заказ ${event.payload.orderId} на сумму ${event.payload.totalAmount}`);
      processOrder(event.payload.orderId);
      break;
    default:
      assertNever(event);
  }
}

function sendWelcomeEmail(email: string): void { /* ... */ }
function cleanupUserData(userId: string): void { /* ... */ }
function processOrder(orderId: string): void { /* ... */ }
```

## Дискриминированные объединения с if-else

Помимо `switch`, для сужения типов можно использовать `if-else`. Это полезно, когда нужна более сложная логика или несколько дискриминантов.

```typescript
type AdminUser = {
  role: 'admin';
  name: string;
  permissions: string[];
};

type RegularUser = {
  role: 'user';
  name: string;
  subscriptionLevel: 'free' | 'pro';
};

type GuestUser = {
  role: 'guest';
  sessionId: string;
};

type AppUser = AdminUser | RegularUser | GuestUser;

function getUserDisplayName(user: AppUser): string {
  if (user.role === 'guest') {
    return `Гость (${user.sessionId})`;
  }

  // Здесь TypeScript знает, что user — AdminUser | RegularUser
  // Оба типа имеют поле name
  const baseName = user.name;

  if (user.role === 'admin') {
    return `${baseName} [Администратор]`;
  }

  // Здесь user — RegularUser
  return user.subscriptionLevel === 'pro'
    ? `${baseName} [Pro]`
    : baseName;
}
```

## Вложенные дискриминированные объединения

Дискриминированные объединения можно комбинировать с другими паттернами TypeScript для моделирования сложных доменных структур.

```typescript
type PaymentMethod =
  | { method: 'card'; last4: string; brand: 'visa' | 'mastercard' }
  | { method: 'paypal'; email: string }
  | { method: 'crypto'; wallet: string; currency: 'BTC' | 'ETH' };

type PaymentStatus =
  | { status: 'pending' }
  | { status: 'completed'; transactionId: string; paidAt: string }
  | { status: 'failed'; errorCode: string; retryable: boolean };

type Payment = {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
};

function describePayment(payment: Payment): string {
  const method = describeMethod(payment.paymentMethod);
  const status = describeStatus(payment.paymentStatus);
  return `Платёж ${payment.id}: ${payment.amount} руб., метод: ${method}, статус: ${status}`;
}

function describeMethod(method: PaymentMethod): string {
  switch (method.method) {
    case 'card':
      return `${method.brand} •••• ${method.last4}`;
    case 'paypal':
      return `PayPal (${method.email})`;
    case 'crypto':
      return `${method.currency} (${method.wallet})`;
  }
}

function describeStatus(status: PaymentStatus): string {
  switch (status.status) {
    case 'pending':
      return 'ожидание';
    case 'completed':
      return `завершён (${status.transactionId})`;
    case 'failed':
      return status.retryable
        ? `ошибка ${status.errorCode}, можно повторить`
        : `ошибка ${status.errorCode}, повтор невозможен`;
  }
}
```

## Распространённые ошибки

### Нелитеральный тип дискриминанта

Дискриминант обязан быть литеральным типом — `string`, `number` или `boolean` литерал. Если использовать просто `string`, сужение не сработает.

```typescript
// Неправильно — дискриминант не литерал
type Bad = {
  kind: string; // string, не 'circle'
  radius: number;
};

// Правильно — литеральный тип
type Good = {
  kind: 'circle'; // строго 'circle'
  radius: number;
};
```

### Отсутствие дискриминанта в некоторых типах

Все члены объединения должны иметь одно и то же поле-дискриминант. Если хотя бы в одном оно отсутствует, TypeScript не сможет корректно сузить тип.

```typescript
// Неправильно
type A = { kind: 'a'; value: number };
type B = { label: 'b'; value: string }; // другое поле!

type Union = A | B;

function process(x: Union) {
  if (x.kind === 'a') { // Ошибка: Property 'kind' does not exist on type 'B'
    console.log(x.value);
  }
}
```

### Пересекающиеся значения дискриминанта

Каждый вариант должен иметь уникальное значение дискриминанта. При совпадении TypeScript объединит ветки, а не разделит их.

```typescript
// Неправильно — одинаковые значения kind
type A = { kind: 'same'; valueA: number };
type B = { kind: 'same'; valueB: string };

type Union = A | B;

function process(x: Union) {
  if (x.kind === 'same') {
    // x имеет тип A & B — не то, что нужно
    console.log(x.valueA); // ошибка
  }
}
```

## Дискриминированные объединения и Result-паттерн

Дискриминированные объединения лежат в основе функционального паттерна `Result` — типобезопасной альтернативы исключениям.

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { ok: false, error: 'Деление на ноль' };
  }
  return { ok: true, value: a / b };
}

const result = divide(10, 2);

if (result.ok) {
  console.log(`Результат: ${result.value}`);
} else {
  console.error(`Ошибка: ${result.error}`);
}
```

Этот паттерн вынуждает обработать оба случая явно — компилятор не позволит использовать `result.value`, не проверив `result.ok`.

## Заключение

Дискриминированные объединения — один из фундаментальных инструментов типобезопасного программирования на TypeScript. Они позволяют:

- Точно моделировать предметную область с взаимоисключающими состояниями.
- Получать автоматическое сужение типов в каждой ветке кода.
- Обеспечивать исчерпывающие проверки через тип `never`.
- Устранять целый класс ошибок, связанных с несовместимыми полями в объединениях.

Паттерн особенно эффективен в сочетании с `switch`-оператором и функцией `assertNever` — такая связка превращает добавление нового варианта типа в управляемое, пошаговое обновление кода под руководством компилятора.

Чтобы глубже разобраться с системой типов TypeScript и научиться применять подобные паттерны в реальных проектах, приходите на курс по TypeScript на PurpleSchool.

[Курс по TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=discriminated-unions)