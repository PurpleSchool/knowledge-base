---
metaTitle: Условные типы в TypeScript — infer и дистрибутивность
metaDescription: Углублённый разбор Conditional Types в TypeScript: синтаксис T extends U ? X : Y, ключевое слово infer, дистрибутивные типы и утилиты на их основе.
author: Антон Ларичев
title: Продвинутые Conditional Types в TypeScript
preview: Разбираем продвинутые возможности Conditional Types в TypeScript — ключевое слово infer, дистрибутивные условные типы и создание утилитных типов на их основе.
---

## Введение

Conditional Types (условные типы) в TypeScript — это конструкция, которая позволяет выбирать тип в зависимости от условия. Синтаксис напоминает тернарный оператор, только вместо значений — типы. На первый взгляд это кажется простым, но за этим механизмом скрываются мощнейшие возможности: вывод типов через `infer`, дистрибутивность относительно union-типов и создание сложных утилитных типов.

В этой статье мы сосредоточимся на продвинутых аспектах Conditional Types: разберём `infer` во всех его применениях, изучим дистрибутивность и создадим собственные утилитные типы.

## Базовый синтаксис

Условный тип имеет форму:

```typescript
T extends U ? X : Y
```

Читается это так: «если тип `T` совместим с типом `U`, то используй тип `X`, иначе — тип `Y`».

```typescript
// Простой пример: проверяем, является ли тип строкой
type IsString<T> = T extends string ? "да, строка" : "нет, не строка";

type Test1 = IsString<string>;  // "да, строка"
type Test2 = IsString<number>;  // "нет, не строка"
type Test3 = IsString<"hello">; // "да, строка" — литерал string тоже подходит

// Практический пример: тип для «разворачивания» массива
type Flatten<T> = T extends Array<infer Item> ? Item : T;

type Str = Flatten<string[]>;    // string
type Num = Flatten<number[]>;    // number
type NotArr = Flatten<boolean>;  // boolean (не массив — возвращаем как есть)
```

## Ключевое слово infer

`infer` — это главная суперспособность Conditional Types. Оно позволяет «захватить» и назвать часть типа прямо внутри условия, чтобы использовать её в ветке `true`.

```typescript
// Извлекаем тип возвращаемого значения функции
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(name: string): string {
  return `Привет, ${name}!`;
}

function add(a: number, b: number): number {
  return a + b;
}

type GreetReturn = ReturnType<typeof greet>; // string
type AddReturn = ReturnType<typeof add>;     // number
```

Если вы хотите детально изучить Conditional Types, generics и всю систему типов TypeScript — приходите на наш большой курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=advanced-conditional-types).
На курсе 192 урока и 17 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### infer для извлечения типов параметров

```typescript
// Извлекаем типы параметров функции
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

function createUser(name: string, age: number, admin: boolean): void {}

type CreateUserParams = Parameters<typeof createUser>;
// [name: string, age: number, admin: boolean]

// Извлекаем тип первого параметра
type FirstParameter<T> = T extends (first: infer F, ...rest: any[]) => any
  ? F
  : never;

type FirstParam = FirstParameter<typeof createUser>; // string
```

### infer для работы с Promise

```typescript
// Извлекаем тип из Promise
type Awaited<T> = T extends Promise<infer U>
  ? U extends Promise<any>
    ? Awaited<U> // Рекурсивно разворачиваем вложенные Promise
    : U
  : T;

type Resolved1 = Awaited<Promise<string>>;           // string
type Resolved2 = Awaited<Promise<Promise<number>>>;  // number
type Resolved3 = Awaited<boolean>;                   // boolean (не Promise)
```

### infer для работы с массивами и кортежами

```typescript
// Извлекаем тип элементов массива
type ArrayElement<T> = T extends (infer E)[] ? E : never;

type StringElement = ArrayElement<string[]>; // string
type NumElement = ArrayElement<number[]>;    // number

// Извлекаем первый и последний элементы кортежа
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type H = Head<[string, number, boolean]>; // string
type T = Tail<[string, number, boolean]>; // [number, boolean]
type L = Last<[string, number, boolean]>; // boolean
```

## Дистрибутивные Conditional Types

Когда условный тип применяется к naked type parameter (тип без обёртки), он автоматически становится дистрибутивным: применяется к каждому члену union-типа по отдельности.

```typescript
// Дистрибутивное поведение
type ToArray<T> = T extends any ? T[] : never;

type StringOrNumberArray = ToArray<string | number>;
// Эквивалентно: ToArray<string> | ToArray<number>
// Результат: string[] | number[]
```

### Практическое применение дистрибутивности

```typescript
// Исключение типов из union (аналог встроенного Exclude)
type MyExclude<T, U> = T extends U ? never : T;

type WithoutString = MyExclude<string | number | boolean, string>;
// number | boolean

// Извлечение совместимых типов из union (аналог Extract)
type MyExtract<T, U> = T extends U ? T : never;

type OnlyStrings = MyExtract<string | number | boolean | null, string | null>;
// string | null

// NonNullable — убираем null и undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;

type CleanType = MyNonNullable<string | number | null | undefined>;
// string | number
```

### Отключение дистрибутивности

Иногда дистрибутивное поведение нежелательно. Чтобы его отключить, оберните тип в кортеж:

```typescript
// Дистрибутивный вариант
type IsString<T> = T extends string ? true : false;
type D1 = IsString<string | number>; // boolean (true | false)

// Недистрибутивный вариант (обёртка в кортеж)
type IsStringExact<T> = [T] extends [string] ? true : false;
type D2 = IsStringExact<string | number>; // false (весь union не extends string)
type D3 = IsStringExact<string>;          // true
```

## Создание утилитных типов на основе Conditional Types

### DeepPartial — рекурсивный Partial

```typescript
// Обычный Partial работает только на первом уровне вложенности
// DeepPartial рекурсивно делает опциональными все вложенные свойства
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

interface Address {
  city: string;
  street: string;
  building: number;
}

interface Person {
  name: string;
  age: number;
  address: Address;
}

// Теперь можно передавать частичные вложенные объекты
function updatePerson(id: number, data: DeepPartial<Person>): void {
  // Можно обновить только город, не передавая всю Address
  console.log(data.address?.city);
}

updatePerson(1, { address: { city: "Москва" } }); // OK!
```

### UnwrapPromise — разворачивание вложенных Promise

```typescript
// Рекурсивно извлекаем тип из Promise
type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;

type Result1 = UnwrapPromise<Promise<string>>;                    // string
type Result2 = UnwrapPromise<Promise<Promise<Promise<number>>>>;  // number
type Result3 = UnwrapPromise<string>;                             // string
```

### FunctionKeys — извлечение ключей-функций

```typescript
interface Service {
  id: number;
  name: string;
  fetchData: () => Promise<string[]>;
  processItem: (id: number) => void;
  isActive: boolean;
}

// Извлекаем только ключи, значения которых — функции
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type ServiceMethods = FunctionKeys<Service>;
// "fetchData" | "processItem"
```

## Частые ошибки

* **Путаница дистрибутивности** — забывать, что `T extends U ? X : Y` дистрибутивен при naked type parameter, что приводит к неожиданным результатам с union-типами
* **infer вне ветки true** — `infer` можно использовать только в условии `extends`, а саму переменную — только в ветке `true`; в ветке `false` переменная недоступна
* **Бесконечная рекурсия** — рекурсивные Conditional Types без правильного базового случая могут привести к ошибке компилятора «Type instantiation is excessively deep»
* **never в union** — когда результат Conditional Type — `never`, он автоматически исчезает из union: `string | never` → `string`; это часто используется намеренно, но может удивить
* **Слишком сложные типы** — очень глубокие цепочки условных типов замедляют проверку типов; стоит разбивать на промежуточные типы с понятными именами

## Заключение

Conditional Types с ключевым словом `infer` — это то, что превращает систему типов TypeScript из простой аннотационной в полноценный язык программирования на уровне типов. С их помощью можно извлекать типы из функций, разворачивать Promise, фильтровать union-типы и создавать сложные утилиты.

Дистрибутивность добавляет ещё один уровень мощи: автоматическое применение к каждому члену union открывает двери к созданию таких утилит, как `Exclude`, `Extract`, `NonNullable` — и к написанию собственных не менее полезных типов. Для закрепления навыков работы с продвинутыми типами TypeScript рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=advanced-conditional-types).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет начать изучение системы типов и понять структуру курса до покупки полного доступа.
