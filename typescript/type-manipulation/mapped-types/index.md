---
metaTitle: Mapped Types в TypeScript — маппинг типов
metaDescription: Разбираем Mapped Types в TypeScript: синтаксис, встроенные утилиты Partial, Required, Readonly, Record, создание кастомных Mapped Types с примерами.
author: Антон Ларичев
title: Mapped Types в TypeScript
preview: Изучаем Mapped Types в TypeScript — мощный инструмент для трансформации типов. Разбираем встроенные утилиты и создаём собственные маппинговые типы.
---

## Введение

Mapped Types (маппинговые типы) — один из самых выразительных инструментов системы типов TypeScript. Они позволяют создавать новые типы на основе существующих, итерируясь по всем свойствам объекта и применяя к ним трансформации. Представьте, что вы можете «пройтись» по каждому ключу типа и автоматически сделать все свойства необязательными, только для чтения или преобразовать типы значений.

В этой статье мы разберём синтаксис Mapped Types, изучим встроенные утилиты TypeScript, которые построены на их основе, и научимся создавать собственные маппинговые типы для решения реальных задач.

## Синтаксис Mapped Types

Базовый синтаксис Mapped Types выглядит следующим образом:

```typescript
type MappedType<T> = {
  [K in keyof T]: T[K];
};
```

Разберём каждую часть:
* `[K in keyof T]` — итерация по всем ключам типа `T`
* `T[K]` — тип значения для ключа `K`

Конструкция `in keyof` — это сердце Mapped Types. `keyof T` возвращает union-тип всех ключей объекта `T`, а `in` перебирает каждый из них.

```typescript
// Исходный тип
interface User {
  id: number;
  name: string;
  email: string;
}

// Mapped Type, который копирует тип без изменений
type UserCopy = {
  [K in keyof User]: User[K];
};

// UserCopy идентичен User:
// { id: number; name: string; email: string; }
```

## Модификаторы в Mapped Types

Mapped Types поддерживают модификаторы `?` (необязательное свойство) и `readonly`. Их можно добавлять или удалять с помощью префиксов `+` и `-`:

```typescript
interface Config {
  host: string;
  port: number;
  debug: boolean;
}

// Делаем все свойства необязательными
type PartialConfig = {
  [K in keyof Config]?: Config[K];
};

// Делаем все свойства только для чтения
type ReadonlyConfig = {
  readonly [K in keyof Config]: Config[K];
};

// Убираем readonly с помощью модификатора "-"
type MutableConfig = {
  -readonly [K in keyof ReadonlyConfig]: ReadonlyConfig[K];
};

// Убираем необязательность (делаем все поля обязательными)
type RequiredConfig = {
  [K in keyof PartialConfig]-?: PartialConfig[K];
};
```

Если вы хотите детальнее изучить систему типов TypeScript и Mapped Types — приходите на наш большой курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=mapped-types).
На курсе 192 урока и 17 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Встроенные утилиты на основе Mapped Types

TypeScript поставляется с рядом встроенных утилитных типов, которые реализованы именно через Mapped Types.

### Partial\<T\>

Делает все свойства типа `T` необязательными:

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

// Использование Partial для обновления продукта
function updateProduct(id: number, changes: Partial<Product>): void {
  // Можно передать только те поля, которые нужно обновить
  console.log(`Обновляем продукт ${id}:`, changes);
}

updateProduct(1, { price: 999 }); // OK — остальные поля необязательны
updateProduct(2, { name: "Новый товар", description: "Описание" }); // OK

// Реализация Partial под капотом:
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};
```

### Required\<T\>

Делает все свойства типа `T` обязательными (противоположность `Partial`):

```typescript
interface FormData {
  username?: string;
  email?: string;
  password?: string;
}

// Required требует наличия всех полей
type SubmittedForm = Required<FormData>;

const form: SubmittedForm = {
  username: "john_doe",
  email: "john@example.com",
  password: "secret123",
  // Пропустить поле нельзя — будет ошибка компиляции
};

// Реализация Required под капотом:
type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};
```

### Readonly\<T\>

Делает все свойства типа `T` доступными только для чтения:

```typescript
interface AppState {
  userId: number;
  theme: "light" | "dark";
  language: string;
}

// После создания состояние нельзя изменить
const initialState: Readonly<AppState> = {
  userId: 42,
  theme: "light",
  language: "ru",
};

// Ошибка! Нельзя изменять readonly свойства
// initialState.theme = "dark"; // Error: Cannot assign to 'theme'

// Реализация Readonly под капотом:
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

### Record\<K, V\>

Создаёт объектный тип с ключами типа `K` и значениями типа `V`:

```typescript
// Словарь для хранения переводов
type Locale = "ru" | "en" | "de";

const translations: Record<Locale, string> = {
  ru: "Привет",
  en: "Hello",
  de: "Hallo",
};

// Маппинг ролей к правам доступа
type Role = "admin" | "editor" | "viewer";

interface Permissions {
  read: boolean;
  write: boolean;
  delete: boolean;
}

const rolePermissions: Record<Role, Permissions> = {
  admin: { read: true, write: true, delete: true },
  editor: { read: true, write: true, delete: false },
  viewer: { read: true, write: false, delete: false },
};

// Реализация Record под капотом:
type MyRecord<K extends keyof any, V> = {
  [P in K]: V;
};
```

## Кастомные Mapped Types

Самое мощное в Mapped Types — возможность создавать собственные трансформации типов.

### Трансформация типов значений

```typescript
interface ApiResponse {
  userId: number;
  userName: string;
  userAge: number;
}

// Создаём тип, где все значения обёрнуты в Promise
type Promisified<T> = {
  [K in keyof T]: Promise<T[K]>;
};

type AsyncApiResponse = Promisified<ApiResponse>;
// { userId: Promise<number>; userName: Promise<string>; userAge: Promise<number>; }

// Создаём тип, где все значения становятся массивами
type Arrayified<T> = {
  [K in keyof T]: T[K][];
};

type ArrayApiResponse = Arrayified<ApiResponse>;
// { userId: number[]; userName: string[]; userAge: number[]; }
```

### Ремаппинг ключей с `as`

В TypeScript 4.1+ появилась возможность переименовывать ключи в Mapped Types с помощью `as`:

```typescript
interface UserProfile {
  id: number;
  name: string;
  email: string;
}

// Добавляем префикс "get" к каждому ключу
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<UserProfile>;
// {
//   getId: () => number;
//   getName: () => string;
//   getEmail: () => string;
// }

// Фильтрация ключей через never
type OnlyStringValues<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface Mixed {
  id: number;
  name: string;
  active: boolean;
  email: string;
}

type StringFields = OnlyStringValues<Mixed>;
// { name: string; email: string; }
```

## Практический пример: форма с валидацией

Рассмотрим реальный сценарий: создание типов для формы с состоянием валидации:

```typescript
interface LoginForm {
  username: string;
  password: string;
  rememberMe: boolean;
}

// Состояние ошибок валидации для каждого поля
type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

// Состояние «тронутых» полей (пользователь взаимодействовал)
type TouchedFields<T> = {
  [K in keyof T]: boolean;
};

// Составной тип формы
interface FormState<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: TouchedFields<T>;
  isSubmitting: boolean;
}

// Использование
const loginFormState: FormState<LoginForm> = {
  values: { username: "", password: "", rememberMe: false },
  errors: { username: "Обязательное поле" }, // Только поля с ошибками
  touched: { username: true, password: false, rememberMe: false },
  isSubmitting: false,
};
```

## Частые ошибки

* **Использование `K in T` вместо `K in keyof T`** — `in` работает с union-типами, поэтому нужен `keyof` для получения ключей объекта
* **Потеря информации о типе значения** — вместо `T[K]` написать `any`, теряя смысл Mapped Type
* **Забыть про модификатор `-?`** — когда нужно сделать свойства обязательными из опциональных, нужен именно `-?`, а не просто убрать `?`
* **Конфликт с индексными сигнатурами** — Mapped Types и index signatures (`[key: string]: any`) не совместимы напрямую, нужно использовать разные подходы
* **Слишком сложные вложенные Mapped Types** — глубоко вложенные трансформации могут замедлить компилятор; стоит разбивать на несколько промежуточных типов

## Заключение

Mapped Types — фундаментальный инструмент TypeScript для создания производных типов. Они позволяют избежать дублирования кода при описании похожих структур: вместо написания `PartialUser`, `ReadonlyUser`, `NullableUser` вручную, достаточно один раз написать обобщённый Mapped Type и применять его к любому типу.

Встроенные утилиты `Partial`, `Required`, `Readonly` и `Record` — это лишь вершина айсберга. По-настоящему мощь Mapped Types раскрывается при создании кастомных трансформаций, ремаппинге ключей и фильтрации свойств. Для закрепления навыков работы с типами TypeScript рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=mapped-types).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет изучить основы системы типов и понять структуру курса до покупки полного доступа.
