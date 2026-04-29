---
metaTitle: Utility Types в TypeScript — Partial, Pick, Omit, Record и другие
metaDescription: "Разбираем встроенные Utility Types в TypeScript: Partial, Required, Readonly, Pick, Omit, Record, Exclude, Extract, ReturnType и другие. Примеры кода."
author: Антон Ларичев
title: Utility Types в TypeScript — полный разбор встроенных утилит
preview: Полный разбор Utility Types в TypeScript — Partial, Required, Readonly, Pick, Omit, Record, Exclude, Extract, ReturnType. Как работают и когда применять.
---

## Введение

TypeScript поставляется с набором встроенных утилитарных типов (Utility Types), которые позволяют трансформировать существующие типы, не дублируя их. Знание этих инструментов — обязательный навык для работы с TypeScript: они используются повсюду в стандартной библиотеке, React, Angular и любом крупном проекте.

В этой статье разберём все ключевые Utility Types с примерами: когда применять, как они работают под капотом и как избежать типичных ошибок.

## Partial\<T\>

Делает все свойства типа необязательными (добавляет `?` к каждому):

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type PartialUser = Partial<User>;
// {
//   id?: number;
//   name?: string;
//   email?: string;
//   age?: number;
// }
```

**Когда использовать:** при обновлении объекта (PATCH-запросы), когда нужно передать только часть полей.

```typescript
function updateUser(id: number, fields: Partial<User>): User {
  // Обновляем только переданные поля
  return { ...currentUser, ...fields };
}

updateUser(1, { name: 'Иван' }); // OK — только name
updateUser(1, { email: 'ivan@example.com', age: 30 }); // OK
```

Под капотом: `type Partial<T> = { [P in keyof T]?: T[P] }`.

## Required\<T\>

Противоположность `Partial` — делает все свойства обязательными, убирает `?`:

```typescript
interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
}

type RequiredConfig = Required<Config>;
// {
//   host: string;
//   port: number;
//   debug: boolean;
// }
```

**Когда использовать:** когда нужно убедиться, что конфигурация заполнена полностью перед её применением.

## Readonly\<T\>

Делает все свойства только для чтения — попытка изменить их вызывает ошибку компиляции:

```typescript
interface Point {
  x: number;
  y: number;
}

const origin: Readonly<Point> = { x: 0, y: 0 };

origin.x = 5; // Ошибка: Cannot assign to 'x' because it is a read-only property.
```

**Когда использовать:** для иммутабельных данных, констант конфигурации, состояний Redux.

```typescript
// Типичный паттерн в Redux
type State = Readonly<{
  users: User[];
  loading: boolean;
  error: string | null;
}>;
```

Если вы хотите детально изучить систему типов TypeScript, включая Utility Types и дженерики — приходите на наш курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=utility-types). На курсе 180 уроков, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Pick\<T, K\>

Создаёт новый тип, включающий только указанные свойства:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Публичный профиль — без чувствительных данных
type PublicUser = Pick<User, 'id' | 'name' | 'email'>;
// { id: number; name: string; email: string; }
```

**Когда использовать:** для DTO (Data Transfer Objects), представлений данных без чувствительных полей, пропсов компонентов.

```typescript
// Компонент принимает только нужные поля User
function UserCard({ id, name }: Pick<User, 'id' | 'name'>) {
  return <div>{id}: {name}</div>;
}
```

## Omit\<T, K\>

Создаёт новый тип, исключая указанные свойства (противоположность `Pick`):

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Убираем password и createdAt
type PublicUser = Omit<User, 'password' | 'createdAt'>;
// { id: number; name: string; email: string; }
```

**Когда использовать:** когда нужно исключить несколько полей, а остальные сохранить. Особенно удобно, когда полей много и `Pick` пришлось бы писать длинно.

```typescript
// Тип для создания пользователя — без id и createdAt (они генерируются на сервере)
type CreateUserDto = Omit<User, 'id' | 'createdAt'>;
```

## Record\<K, V\>

Создаёт тип объекта с ключами типа `K` и значениями типа `V`:

```typescript
// Словарь: ключ — строка, значение — число
type ScoreMap = Record<string, number>;

const scores: ScoreMap = {
  Иван: 95,
  Мария: 88,
  Петр: 77
};
```

```typescript
// Ключи — строгий union тип
type Status = 'active' | 'inactive' | 'pending';
type StatusLabels = Record<Status, string>;

const labels: StatusLabels = {
  active: 'Активный',
  inactive: 'Неактивный',
  pending: 'Ожидает' // TypeScript потребует все три ключа
};
```

**Когда использовать:** для словарей с предсказуемой структурой, маппинга значений, кэшей.

## Exclude\<T, U\>

Исключает из union-типа `T` все типы, которые входят в `U`:

```typescript
type AllStatuses = 'active' | 'inactive' | 'pending' | 'deleted';
type ActiveStatuses = Exclude<AllStatuses, 'deleted' | 'inactive'>;
// 'active' | 'pending'
```

```typescript
// Исключаем примитивы из union
type NonNullable<T> = Exclude<T, null | undefined>;
```

## Extract\<T, U\>

Противоположность `Exclude` — оставляет только те типы из `T`, которые входят в `U`:

```typescript
type A = 'a' | 'b' | 'c' | 'd';
type B = 'b' | 'd' | 'f';

type Common = Extract<A, B>; // 'b' | 'd'
```

```typescript
// Фильтрация union по условию
type StringsOnly = Extract<string | number | boolean | null, string>;
// string
```

## NonNullable\<T\>

Удаляет `null` и `undefined` из типа:

```typescript
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string
```

```typescript
function processInput(value: string | null | undefined) {
  const safe: NonNullable<typeof value> = value!; // убеждены, что не null
  // ...
}
```

## ReturnType\<T\>

Извлекает тип возвращаемого значения функции:

```typescript
function getUser() {
  return {
    id: 1,
    name: 'Иван',
    email: 'ivan@example.com'
  };
}

type User = ReturnType<typeof getUser>;
// { id: number; name: string; email: string; }
```

**Когда использовать:** когда тип возвращаемого значения сложный или выводится автоматически, и вы хотите переиспользовать его без явного объявления.

```typescript
// Полезно для функций-фабрик и хуков
function useAuth() {
  return { user: null as User | null, login, logout };
}

type AuthContext = ReturnType<typeof useAuth>;
```

## Parameters\<T\>

Извлекает типы параметров функции в виде кортежа:

```typescript
function createUser(name: string, age: number, role: 'admin' | 'user') {
  // ...
}

type CreateUserParams = Parameters<typeof createUser>;
// [name: string, age: number, role: 'admin' | 'user']

// Используем первый параметр
type FirstParam = Parameters<typeof createUser>[0]; // string
```

## Awaited\<T\>

Рекурсивно разворачивает тип Promise:

```typescript
type Result = Awaited<Promise<Promise<string>>>; // string

async function fetchUser(): Promise<User> { /* ... */ }
type FetchedUser = Awaited<ReturnType<typeof fetchUser>>; // User
```

## Практические комбинации

### Частичное обновление с защитой ключей

```typescript
type UpdatePayload<T> = Partial<Omit<T, 'id' | 'createdAt'>>;

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
}

function updatePost(id: number, payload: UpdatePayload<Post>) {
  // payload не может содержать id или createdAt
}

updatePost(1, { title: 'Новый заголовок' }); // OK
updatePost(1, { id: 999 }); // Ошибка
```

### Глубокое readonly для состояния

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

## Частые ошибки

* **`Partial` не делает вложенные объекты частичными.** `Partial<{ user: { name: string } }>` сделает `user` необязательным, но `name` внутри него останется обязательным. Для вложенной частичности нужен рекурсивный тип.

* **Путаница `Pick` и `Omit`.** `Pick` — белый список (берём только эти), `Omit` — чёрный список (берём всё кроме этих). При большом количестве полей `Omit` компактнее.

* **`Record<string, T>` не гарантирует наличие ключа.** При обращении `record[key]` TypeScript не знает, есть ли этот ключ. Используйте `--noUncheckedIndexedAccess` или проверяйте наличие через `in`.

* **`ReturnType` с перегрузками.** Для перегруженных функций `ReturnType` вернёт тип последней перегрузки. Это ограничение TypeScript.

## Часто задаваемые вопросы

**Можно ли комбинировать несколько Utility Types?**

Да, это распространённая практика: `Partial<Omit<User, 'id'>>`, `Readonly<Record<string, User[]>>`.

**Чем `Omit` отличается от `Exclude`?**

`Omit` работает с ключами объектного типа (удаляет свойства). `Exclude` работает с union-типами (удаляет варианты из объединения).

**Как создать свой Utility Type?**

Используя `keyof`, `in`, условные типы и `infer`. Например, `DeepPartial` для рекурсивной частичности или `Nullable<T> = T | null`.

**Влияют ли Utility Types на производительность в runtime?**

Нет. Все типы TypeScript стираются при компиляции. Utility Types — это чисто компиляционный инструмент без влияния на JavaScript-код.

## Заключение

Utility Types в TypeScript — это мощный инструмент для создания новых типов на основе существующих. Правильное применение `Partial`, `Pick`, `Omit`, `Record` и других утилит помогает избежать дублирования типов и делает код более выразительным и безопасным.

Для углублённого изучения TypeScript рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=utility-types). В первых модулях доступно бесплатное содержание, что позволяет познакомиться с форматом обучения до покупки полного доступа.
