---
metaTitle: "TypeScript Branded Types — номинальная типизация"
metaDescription: "Что такое Branded Types в TypeScript, как реализовать номинальную типизацию и защитить код от логических ошибок на этапе компиляции."
author: "Антон Ларичев"
title: "Branded Types в TypeScript — номинальная типизация"
preview: "Техника Branded Types позволяет добавить номинальную типизацию в TypeScript и защититься от случайной подмены значений одного типа другим."
---

## Что такое структурная типизация и почему она создаёт проблемы

TypeScript использует структурную типизацию (structural typing): два типа считаются совместимыми, если у них совпадает структура — набор полей и их типы. Это удобно в большинстве случаев, но иногда приводит к трудноуловимым ошибкам.

Рассмотрим типичный пример:

```typescript
type UserId = string;
type ProductId = string;

function getUserById(id: UserId): User {
  // ...
}

const productId: ProductId = 'prod-123';
getUserById(productId); // TypeScript не видит ошибки!
```

Оба типа — просто псевдонимы для `string`, поэтому TypeScript считает их взаимозаменяемыми. Вы можете передать `ProductId` туда, где ожидается `UserId`, и компилятор промолчит. Ошибку обнаружит уже рантайм — или, что хуже, не обнаружит вовсе, вернув неожиданные данные.

То же самое происходит с числовыми величинами:

```typescript
type Meters = number;
type Kilograms = number;

function calculateSpeed(distance: Meters, time: number): number {
  return distance / time;
}

const weight: Kilograms = 70;
calculateSpeed(weight, 10); // Компилятор доволен, логика сломана
```

## Номинальная типизация — альтернативный подход

Языки с номинальной типизацией (Java, C#, Rust) считают типы совместимыми только если они явно объявлены одним и тем же типом или связаны через наследование. Имя типа — часть его идентичности.

TypeScript не поддерживает номинальную типизацию нативно, но её можно эмулировать с помощью техники **Branded Types** (также называемой Opaque Types или Tagged Types).

## Реализация Branded Types

Идея проста: добавить к базовому типу уникальное «клеймо» (brand) — фиктивное свойство, которое существует только в системе типов, но не в рантайме.

```typescript
type Brand<T, B> = T & { readonly __brand: B };

type UserId = Brand<string, 'UserId'>;
type ProductId = Brand<string, 'ProductId'>;
```

Теперь `UserId` и `ProductId` — структурно разные типы, потому что поле `__brand` имеет разные литеральные типы. TypeScript не позволит использовать один вместо другого:

```typescript
function getUserById(id: UserId): void {
  console.log('Getting user:', id);
}

const productId = 'prod-123' as ProductId;
getUserById(productId);
// Ошибка: Argument of type 'ProductId' is not assignable
// to parameter of type 'UserId'.
```

## Создание значений Branded Types

Обычная строка или число не совместимы с branded-типом напрямую. Для создания значений нужны специальные функции-конструкторы:

```typescript
type Brand<T, B> = T & { readonly __brand: B };

type UserId = Brand<string, 'UserId'>;
type ProductId = Brand<string, 'ProductId'>;
type Meters = Brand<number, 'Meters'>;
type Kilograms = Brand<number, 'Kilograms'>;

function createUserId(id: string): UserId {
  return id as UserId;
}

function createProductId(id: string): ProductId {
  return id as ProductId;
}

function createMeters(value: number): Meters {
  return value as Meters;
}

const userId = createUserId('user-456');
const productId = createProductId('prod-123');

// Теперь перепутать невозможно:
// getUserById(productId); // Ошибка компилятора
getUserById(userId); // OK
```

`as` используется только внутри функции-конструктора — единственного места, где производится небезопасное приведение типа. Весь остальной код работает с типобезопасными значениями.

## Валидация в конструкторах

Конструктор — отличное место для добавления валидации. Это гарантирует, что branded-значение всегда находится в корректном состоянии:

```typescript
type Email = Brand<string, 'Email'>;
type PositiveInt = Brand<number, 'PositiveInt'>;

function createEmail(value: string): Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new Error(`Invalid email: ${value}`);
  }
  return value as Email;
}

function createPositiveInt(value: number): PositiveInt {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Expected positive integer, got: ${value}`);
  }
  return value as PositiveInt;
}

const email = createEmail('user@example.com'); // OK
const count = createPositiveInt(42); // OK

const badEmail = createEmail('not-an-email'); // Бросает ошибку в рантайме
const badCount = createPositiveInt(-5); // Бросает ошибку в рантайме
```

Теперь любая функция, принимающая `Email`, может быть уверена: если значение дошло до неё, оно уже прошло валидацию.

## Универсальный утилитарный тип

Вместо дублирования типа `Brand` в каждом проекте, оформите его как переиспользуемый утилитарный тип:

```typescript
// utils/brand.ts
declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type { Brand };
```

Использование `unique symbol` вместо строки `'__brand'` делает клеймо ещё надёжнее — такое поле нельзя случайно «подделать» извне.

```typescript
import type { Brand } from './utils/brand';

export type UserId = Brand<string, 'UserId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type Price = Brand<number, 'Price'>;
export type Quantity = Brand<number, 'Quantity'>;
```

## Практический пример: интернет-магазин

Посмотрим, как branded types работают в реальном сценарии:

```typescript
import type { Brand } from './utils/brand';

type UserId = Brand<string, 'UserId'>;
type ProductId = Brand<string, 'ProductId'>;
type OrderId = Brand<string, 'OrderId'>;
type Price = Brand<number, 'Price'>;
type Quantity = Brand<number, 'Quantity'>;

interface Product {
  id: ProductId;
  name: string;
  price: Price;
}

interface OrderItem {
  productId: ProductId;
  quantity: Quantity;
}

interface Order {
  id: OrderId;
  userId: UserId;
  items: OrderItem[];
  total: Price;
}

// Конструкторы
const toUserId = (id: string): UserId => id as UserId;
const toProductId = (id: string): ProductId => id as ProductId;
const toOrderId = (id: string): OrderId => id as OrderId;
const toPrice = (amount: number): Price => {
  if (amount < 0) throw new Error('Price cannot be negative');
  return amount as Price;
};
const toQuantity = (n: number): Quantity => {
  if (!Number.isInteger(n) || n < 1) throw new Error('Quantity must be a positive integer');
  return n as Quantity;
};

// Бизнес-логика
function calculateOrderTotal(items: OrderItem[], catalog: Map<ProductId, Product>): Price {
  const total = items.reduce((sum, item) => {
    const product = catalog.get(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    return sum + product.price * item.quantity;
  }, 0);
  return toPrice(total);
}

function createOrder(userId: UserId, items: OrderItem[], catalog: Map<ProductId, Product>): Order {
  return {
    id: toOrderId(crypto.randomUUID()),
    userId,
    items,
    total: calculateOrderTotal(items, catalog),
  };
}

// Использование
const userId = toUserId('user-001');
const productId = toProductId('prod-42');

const items: OrderItem[] = [
  { productId, quantity: toQuantity(2) },
];

// Нельзя перепутать userId и productId или orderId:
// createOrder(productId, items, catalog); // Ошибка компилятора!
createOrder(userId, items, catalog); // OK
```

## Брендирование с дженериками

Branded Types хорошо сочетаются с дженериками для создания обобщённых абстракций:

```typescript
type Nullable<T> = T | null;
type Brand<T, B extends string> = T & { readonly __brand: B };

// Тип для идентификаторов разных сущностей
type Id<Entity extends string> = Brand<string, `${Entity}Id`>;

type UserId = Id<'User'>;
type ProductId = Id<'Product'>;
type CategoryId = Id<'Category'>;

function findById<T, E extends string>(
  id: Id<E>,
  collection: Map<Id<E>, T>
): Nullable<T> {
  return collection.get(id) ?? null;
}
```

## Type Guard для безопасного создания

Иногда вместо исключений удобнее использовать type guard, чтобы обрабатывать невалидные значения без бросания ошибок:

```typescript
type Email = Brand<string, 'Email'>;

function isEmail(value: string): value is Email {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function processEmail(input: string): void {
  if (!isEmail(input)) {
    console.error('Invalid email provided');
    return;
  }
  // В этом блоке input имеет тип Email
  sendWelcomeEmail(input);
}

function sendWelcomeEmail(email: Email): void {
  console.log(`Sending welcome email to ${email}`);
}
```

## Совместимость с базовым типом

Branded type совместим с базовым типом «вниз» — там, где ожидается `string`, можно передать `UserId`:

```typescript
type UserId = Brand<string, 'UserId'>;

const userId = 'user-123' as UserId;

// Работает, потому что UserId расширяет string
const upperCased: string = userId.toUpperCase();
console.log(userId.length);
const parts: string[] = userId.split('-');

// Но обратное — нет:
// const id: UserId = 'raw-string'; // Ошибка!
```

Это удобно: branded-значения можно использовать в стандартных операциях со строками и числами без дополнительных преобразований.

## Branded Types vs. классы и обёртки

Альтернативный подход — создавать отдельные классы-обёртки:

```typescript
class UserId {
  constructor(readonly value: string) {}
}

class ProductId {
  constructor(readonly value: string) {}
}
```

Однако этот подход имеет недостатки:
- Нужно везде использовать `.value` для получения значения
- Накладные расходы в рантайме: создание объектов, дополнительная память
- Несовместимость с API, ожидающими примитивные типы (JSON-сериализация и т.д.)

Branded Types не существуют в рантайме — это чисто компиляторная концепция. Никаких объектов, никаких накладных расходов.

## Интеграция с Zod

При использовании Zod для валидации входных данных branded types легко встраиваются через `.brand()`:

```typescript
import { z } from 'zod';

const UserIdSchema = z.string().uuid().brand('UserId');
const PriceSchema = z.number().positive().brand('Price');

type UserId = z.infer<typeof UserIdSchema>;
type Price = z.infer<typeof PriceSchema>;

// Парсинг автоматически возвращает branded-тип
const userId = UserIdSchema.parse('550e8400-e29b-41d4-a716-446655440000');
// userId имеет тип UserId

const price = PriceSchema.parse(99.99);
// price имеет тип Price
```

## Когда применять Branded Types

Branded types наиболее полезны в следующих ситуациях:

**Идентификаторы сущностей** — когда в системе много разных ID и их легко перепутать. Это самый частый сценарий.

**Физические величины** — метры, килограммы, секунды, рубли. Компилятор не даст сложить метры с килограммами.

**Валидированные строки** — email-адреса, URL, номера телефонов, slug-и. Branded type гарантирует, что строка прошла валидацию.

**Денежные суммы** — разные валюты как разные типы, чтобы избежать смешения.

**Индексы массивов** — отличить индекс в одном массиве от индекса в другом.

Не стоит злоупотреблять техникой там, где структурной типизации достаточно. Каждый branded type — это дополнительная сложность: нужны конструкторы, нужно помнить о преобразованиях. Применяйте там, где цена ошибки высока.

---

Глубже освоить систему типов TypeScript и научиться применять продвинутые техники типизации в реальных проектах можно на курсе [TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=branded-types).