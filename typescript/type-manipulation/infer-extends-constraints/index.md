---
metaTitle: "TypeScript infer extends: ограничения в условных типах"
metaDescription: "Как использовать infer extends в TypeScript для ограничения выводимых типов в условных конструкциях. Примеры, паттерны и отличия от классического infer."
author: "Антон Ларичев"
title: "TypeScript infer extends — ограничения в условных типах"
preview: "Разбираем синтаксис infer extends в TypeScript 4.7+: зачем он нужен, как сокращает вложенные условия и где применяется на практике."
---

## Что такое infer в условных типах

Условные типы в TypeScript позволяют задавать логику на уровне системы типов: если тип `T` удовлетворяет некоторому условию, вернуть один тип, иначе — другой. Ключевое слово `infer` даёт возможность извлекать (выводить) части типа прямо внутри условного выражения.

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(): string {
  return 'hello';
}

type Result = ReturnType<typeof greet>; // string
```

Здесь `infer R` говорит компилятору: «выведи тип возвращаемого значения функции и назови его `R`». Если `T` — функция, `R` будет её возвращаемым типом; иначе результат — `never`.

Но у классического `infer` есть существенное ограничение: выведенный тип никак не ограничен. Компилятор знает только, что `R` — это «какой-то тип», и не сужает его автоматически.

## Проблема до TypeScript 4.7

Предположим, нужно извлечь первый элемент кортежа, но только если он является строкой.

```typescript
type FirstString<T> = T extends [infer S, ...unknown[]]
  ? S extends string
    ? S
    : never
  : never;

type A = FirstString<[string, number]>; // string
type B = FirstString<[number, string]>; // never
type C = FirstString<['hello', boolean]>; // 'hello'
```

Код работает, но требует двух вложенных условий. Внешнее — для проверки формы кортежа, внутреннее — для проверки типа выведенного `S`. Чем сложнее тип, тем глубже вложенность и тем труднее читать код.

Эту проблему решает синтаксис `infer extends`, появившийся в TypeScript 4.7.

## Синтаксис infer extends

`infer extends` позволяет указать ограничение прямо при объявлении выводимого типа:

```typescript
infer Имя extends Ограничение
```

Если выведенный тип не удовлетворяет ограничению, всё условное выражение переходит к ветке `false` (обычно `never`).

Перепишем предыдущий пример:

```typescript
type FirstString<T> = T extends [infer S extends string, ...unknown[]]
  ? S
  : never;

type A = FirstString<[string, number]>; // string
type B = FirstString<[number, string]>; // never
type C = FirstString<['hello', boolean]>; // 'hello'
```

Результат тот же, но код стал вдвое короче и значительно читаемее.

## Как работает сужение типа

Важная деталь: при использовании `infer S extends string` компилятор не просто проверяет совместимость — он сужает тип `S` до пересечения выведенного типа с ограничением. Это означает, что литеральные типы сохраняются.

```typescript
type GetLiteral<T> = T extends [infer S extends string]
  ? S
  : never;

type X = GetLiteral<['hello']>; // 'hello', а не string
type Y = GetLiteral<[string]>;  // string
```

Без `extends string` компилятор вернул бы просто `string`, потеряв информацию о литерале. С ограничением `S` остаётся `'hello'` — конкретным строковым литералом.

Сравним поведение:

```typescript
// Без extends — теряем литерал
type WithoutConstraint<T> = T extends [infer S] ? S : never;
type A = WithoutConstraint<['hello']>; // 'hello' | string — зависит от контекста

// С extends — сужаем и сохраняем
type WithConstraint<T> = T extends [infer S extends string] ? S : never;
type B = WithConstraint<['hello']>; // 'hello'
```

## Практические примеры

### Извлечение ключей с конкретным типом значения

```typescript
type KeysWithStringValues<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type StringKeys = KeysWithStringValues<User>; // 'name' | 'email'
```

Можно переписать через `infer extends`, чтобы извлекать не ключи, а сами значения-строки:

```typescript
type StringValues<T> = T extends Record<string, infer V extends string>
  ? V
  : never;

type Values = StringValues<{ a: 'foo'; b: 'bar'; c: 42 }>;
// 'foo' | 'bar'
```

### Парсинг типов из строковых литералов

`infer extends` особенно полезен при работе с шаблонными строковыми типами:

```typescript
type ParseInt<T extends string> =
  T extends `${infer N extends number}` ? N : never;

type A = ParseInt<'42'>; // 42 (числовой литерал, не string)
type B = ParseInt<'hello'>; // never
type C = ParseInt<'3.14'>; // 3.14
```

До появления `infer extends` получить числовой литерал из строкового было крайне затруднительно. Теперь это делается в одну строку.

```typescript
type ParseBoolean<T extends string> =
  T extends `${infer B extends boolean}` ? B : never;

type D = ParseBoolean<'true'>;  // true
type E = ParseBoolean<'false'>; // false
type F = ParseBoolean<'yes'>;   // never
```

### Извлечение типов из промисов с проверкой

```typescript
type UnwrapPromise<T> = T extends Promise<infer V extends object>
  ? V
  : never;

type A = UnwrapPromise<Promise<{ id: number }>>; // { id: number }
type B = UnwrapPromise<Promise<string>>;          // never — string не object
type C = UnwrapPromise<string>;                   // never
```

### Фильтрация элементов кортежа

```typescript
type FilterStrings<T extends unknown[]> = T extends []
  ? []
  : T extends [infer Head extends string, ...infer Tail extends unknown[]]
  ? [Head, ...FilterStrings<Tail>]
  : T extends [unknown, ...infer Tail extends unknown[]]
  ? FilterStrings<Tail>
  : [];

type Result = FilterStrings<[1, 'hello', true, 'world', 42]>;
// ['hello', 'world']
```

Здесь рекурсивный условный тип проходит по кортежу и оставляет только элементы, расширяющие `string`.

## Ограничения и особенности

### Только extends, не equals

`infer S extends string` означает «`S` должен быть совместим со `string`», а не «`S` должен быть в точности `string`». Подтипы строки — строковые литералы — также проходят проверку.

```typescript
type MustBeString<T> = T extends [infer S extends string] ? S : never;

type A = MustBeString<['hello']>; // 'hello' — литерал, подтип string
type B = MustBeString<[string]>;  // string
type C = MustBeString<[number]>;  // never
```

### Поведение при union-типах

Когда `T` — это union, условный тип применяется дистрибутивно к каждому члену:

```typescript
type ExtractString<T> = T extends [infer S extends string] ? S : never;

type Input = [string] | [number] | ['literal'];
type Result = ExtractString<Input>;
// string | 'literal'
// Ветка [number] отфильтровалась как never
```

### Ограничения с объектными типами

```typescript
type ExtractId<T> = T extends infer U extends { id: number }
  ? U['id']
  : never;

type A = ExtractId<{ id: 42; name: string }>;  // 42
type B = ExtractId<{ id: number; age: number }>; // number
type C = ExtractId<{ name: string }>;            // never — нет поля id
```

### Версия TypeScript

`infer extends` доступен начиная с TypeScript 4.7. Если проект использует более раннюю версию, придётся применять двойное условие:

```typescript
// TypeScript < 4.7
type OldWay<T> = T extends [infer S]
  ? S extends string
    ? S
    : never
  : never;

// TypeScript >= 4.7
type NewWay<T> = T extends [infer S extends string] ? S : never;
```

## Сравнение с классическим подходом

Рассмотрим более сложный пример — извлечение числового параметра из шаблонной строки:

```typescript
// Классический подход: двойное условие
type ExtractNumberOld<T extends string> =
  T extends `item-${infer N}`
    ? N extends `${number}`
      ? N
      : never
    : never;

// Подход с infer extends: одно условие + числовой литерал
type ExtractNumberNew<T extends string> =
  T extends `item-${infer N extends number}` ? N : never;

type A = ExtractNumberOld<'item-5'>; // '5' — строка!
type B = ExtractNumberNew<'item-5'>; // 5 — число!
```

Помимо краткости, `infer extends` даёт преимущество в точности: выводимый тип автоматически сужается до числового литерала, а не остаётся строкой.

## Реальный сценарий: типобезопасный роутер

Предположим, нужно извлекать параметры из шаблона маршрута:

```typescript
type ExtractRouteParams<T extends string> =
  T extends `${string}:${infer Param extends string}/${infer Rest extends string}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : T extends `${string}:${infer Param extends string}`
    ? Param
    : never;

type Params = ExtractRouteParams<'/users/:userId/posts/:postId'>;
// 'userId' | 'postId'

type RouteHandler<T extends string> = (
  params: Record<ExtractRouteParams<T>, string>
) => void;

const handler: RouteHandler<'/users/:userId/posts/:postId'> = (params) => {
  console.log(params.userId);  // OK
  console.log(params.postId);  // OK
  // console.log(params.unknown); // Ошибка компиляции
};
```

Здесь `infer Param extends string` гарантирует, что `Param` — строка, а рекурсивное применение обходит все сегменты маршрута.

## Когда использовать infer extends

`infer extends` стоит применять когда:

- Нужно извлечь часть типа и сразу проверить, что она соответствует определённой форме.
- Требуется сохранить литеральный тип (число, строку, булево) при парсинге шаблонных строк.
- Условный тип становится громоздким из-за двойной вложенности `S extends Constraint`.
- Работа ведётся с рекурсивными типами, где каждый дополнительный уровень вложенности снижает читаемость.

Не стоит применять этот синтаксис, если ограничение не нужно — лишний `extends` усложняет чтение без пользы.

## Итог

`infer extends` — это элегантное расширение системы условных типов TypeScript, появившееся в версии 4.7. Оно решает две задачи одновременно: проверяет, что выведенный тип удовлетворяет ограничению, и сужает его до более конкретного типа внутри истинной ветки условия.

Основные преимущества:

- Сокращает двойные вложенные условия до одного.
- Сохраняет литеральные типы при работе с шаблонными строками.
- Делает сложные манипуляции с типами более читаемыми.
- Открывает возможности для точного парсинга числовых и булевых значений из строк.

Если вы хотите глубоко разобраться в системе типов TypeScript, условных типах и продвинутых паттернах — приходите на курс по TypeScript на PurpleSchool.

[Курс по TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=infer-extends-constraints)