---
metaTitle: "Variadic Tuple Types в TypeScript — полное руководство"
metaDescription: "Вариативные кортежи TypeScript: синтаксис, spread в позициях кортежа, конкатенация, curry, middleware. Примеры кода на русском языке."
author: "Антон Ларичев"
title: "Вариативные кортежи (Variadic Tuple Types) в TypeScript"
preview: "Разбираем вариативные кортежи TypeScript: как использовать spread-типы в позициях кортежа, типизировать concat, curry и middleware."
---

## Что такое вариативные кортежи

Вариативные кортежи (Variadic Tuple Types) — возможность TypeScript, появившаяся в версии 4.0, которая позволяет использовать обобщённые spread-выражения внутри типов кортежей. До этой версии кортежи были жёстко фиксированы: нельзя было описать тип, принимающий произвольный набор элементов и при этом сохраняющий информацию о типах каждого из них.

Кортеж в TypeScript — это массив с фиксированной длиной и известными типами на каждой позиции:

```typescript
type Point = [number, number];
type Named = [string, number, boolean];
```

До появления вариативных кортежей операции вроде "добавить элемент в начало кортежа" или "склеить два кортежа" нельзя было типизировать обобщённым образом. Вариативные кортежи решают именно эту задачу.

## Синтаксис: spread внутри кортежа

Ключевая идея — возможность применить оператор `...` к обобщённому параметру-типу прямо внутри кортежного типа:

```typescript
type Prepend<T, Arr extends unknown[]> = [T, ...Arr];
type Append<Arr extends unknown[], T> = [...Arr, T];
```

Здесь `...Arr` — это spread обобщённого параметра, ограниченного `unknown[]`. TypeScript понимает, что результирующий кортеж начинается с `T`, а затем идут все элементы `Arr` в том же порядке.

Пример использования:

```typescript
type WithId<T extends unknown[]> = [id: string, ...T];

type UserArgs = [name: string, age: number];
type UserWithId = WithId<UserArgs>;
// => [id: string, name: string, age: number]
```

TypeScript вычисляет итоговый тип статически — никакой потери информации.

## Конкатенация кортежей

Один из самых очевидных примеров применения — типизация функции `concat`:

```typescript
function concat<A extends unknown[], B extends unknown[]>(
  a: [...A],
  b: [...B]
): [...A, ...B] {
  return [...a, ...b];
}

const result = concat([1, 'hello'], [true, 42]);
// result: [number, string, boolean, number]

console.log(result); // [1, 'hello', true, 42]
```

Обратите внимание на запись параметров как `[...A]` вместо просто `A`. Такая запись подсказывает TypeScript, что нужно выводить тип как кортеж, а не как обычный массив. Без неё вывод типа может потерять информацию о позициях:

```typescript
// Без [...A] — TypeScript выводит массивы, теряя позиции
function concatBad<A extends unknown[], B extends unknown[]>(
  a: A,
  b: B
): [...A, ...B] {
  return [...a, ...b];
}

const r1 = concatBad([1, 'hello'], [true]);
// r1: (string | number | boolean)[]  — потеря информации о позициях

// С [...A] — TypeScript сохраняет позиционную информацию
const r2 = concat([1, 'hello'], [true]);
// r2: [number, string, boolean]  — точный тип
```

## Добавление и удаление элементов

Вариативные кортежи позволяют описать операции над структурой кортежа на уровне типов:

```typescript
// Добавить элемент в начало
type Prepend<Head, Tail extends unknown[]> = [Head, ...Tail];

// Добавить элемент в конец
type Append<Init extends unknown[], Last> = [...Init, Last];

// Получить первый элемент
type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;

// Получить все элементы кроме первого
type Tail<T extends unknown[]> = T extends [unknown, ...infer Rest] ? Rest : never;

// Получить последний элемент
type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;

// Получить все элементы кроме последнего
type Init<T extends unknown[]> = T extends [...infer I, unknown] ? I : never;

// Примеры
type A = Head<[string, number, boolean]>;  // string
type B = Tail<[string, number, boolean]>;  // [number, boolean]
type C = Last<[string, number, boolean]>;  // boolean
type D = Init<[string, number, boolean]>;  // [string, number]
```

Это фундаментальные строительные блоки для более сложных манипуляций с типами.

## Остаточные элементы в кортежах

Раньше в TypeScript остаточные элементы (`...rest`) могли стоять только в конце кортежа. Начиная с TypeScript 4.0 ограничение частично снято: rest-элемент может стоять в любом месте, если остальные элементы — фиксированные.

```typescript
// Rest в начале
type StringsAndNumber = [...string[], number];
const a: StringsAndNumber = [1];              // OK
const b: StringsAndNumber = ['a', 'b', 1];    // OK
const c: StringsAndNumber = ['a', 'b'];       // Ошибка — нет финального number

// Rest в середине
type Sandwich<T> = [string, ...T[], boolean];
const s1: Sandwich<number> = ['start', true];           // OK
const s2: Sandwich<number> = ['start', 1, 2, 3, true];  // OK
```

Ограничение: в одном кортеже может быть не более одного rest-элемента. TypeScript не умеет разрешать два произвольных rest-элемента одновременно, так как это привело бы к неоднозначности при выводе типов.

```typescript
// Ошибка: два rest-элемента
type Invalid = [...string[], ...number[]]; // TS2574: rest element type must be an array type
```

## Именованные элементы кортежей

TypeScript 4.0 также добавил поддержку именованных элементов кортежей (labeled tuple elements). Они не влияют на систему типов, но улучшают читаемость и подсказки в IDE:

```typescript
type Range = [start: number, end: number];
type HttpRequest = [method: string, url: string, body?: unknown];

function makeRange(start: number, end: number): Range {
  return [start, end];
}
```

Важное правило: если один элемент именован, все остальные тоже должны быть именованы. Смешивать именованные и безымянные нельзя:

```typescript
// Ошибка: нельзя миксовать именованные и безымянные
type Mixed = [string, end: number]; // TS4022

// Корректно
type Correct = [start: string, end: number];
```

Имена в вариативных контекстах сохраняются при разворачивании:

```typescript
type EventPayload<T extends unknown[]> = [type: string, ...T];
type ClickEvent = EventPayload<[x: number, y: number]>;
// => [type: string, x: number, y: number]
```

## Практический пример: типизация curry

Одна из классических задач, где вариативные кортежи незаменимы — типизация функций с частичным применением аргументов (currying):

```typescript
type PartialApply<
  Params extends unknown[],
  Applied extends unknown[]
> = Params extends [...Applied, ...infer Rest] ? Rest : never;

function partial<F extends (...args: any[]) => any>(
  fn: F,
  ...applied: PartialApply<Parameters<F>, []>
) {
  return (...rest: PartialApply<Parameters<F>, typeof applied>) =>
    fn(...applied, ...rest);
}

function add(a: number, b: number, c: number): number {
  return a + b + c;
}

const addFive = partial(add, 5);
// addFive: (b: number, c: number) => number

console.log(addFive(3, 2)); // 10
```

TypeScript точно вычитает, какие аргументы уже "зафиксированы", а какие ещё нужно передать.

## Практический пример: типизация middleware

Вариативные кортежи хорошо подходят для описания цепочек обработчиков, где каждый обработчик расширяет контекст:

```typescript
type Middleware<In, Out> = (ctx: In) => Out;

type Pipeline<
  Middlewares extends Middleware<any, any>[]
> = Middlewares extends []
  ? Middleware<unknown, unknown>
  : Middlewares extends [Middleware<infer In, infer Out>]
  ? Middleware<In, Out>
  : Middlewares extends [
      Middleware<infer In, infer Mid>,
      ...infer Rest extends Middleware<any, any>[]
    ]
  ? Pipeline<[Middleware<Mid, any>, ...Rest]> extends Middleware<any, infer FinalOut>
    ? Middleware<In, FinalOut>
    : never
  : never;

// Упрощённый вариант для compose
function compose<A, B, C>(
  f: (a: A) => B,
  g: (b: B) => C
): (a: A) => C {
  return (a) => g(f(a));
}

const parseNumber = (s: string): number => parseInt(s, 10);
const double = (n: number): number => n * 2;
const toString = (n: number): string => `Result: ${n}`;

const pipeline = compose(compose(parseNumber, double), toString);
console.log(pipeline('21')); // 'Result: 42'
```

## Практический пример: функция zip

Функция `zip`, объединяющая несколько массивов в массив кортежей, требует вариативных типов для корректной типизации:

```typescript
function zip<T extends unknown[][]>(
  ...arrays: { [K in keyof T]: T[K] extends (infer V)[] ? V[] : never }
): { [K in keyof T]: T[K] extends (infer V)[] ? V : never }[] {
  const length = Math.min(...arrays.map((a) => a.length));
  return Array.from({ length }, (_, i) =>
    arrays.map((arr) => arr[i])
  ) as any;
}

const names = ['Alice', 'Bob', 'Charlie'];
const ages = [30, 25, 35];
const scores = [98, 87, 92];

const zipped = zip(names, ages, scores);
// zipped: [string, number, number][]

zipped.forEach(([name, age, score]) => {
  console.log(`${name}: age ${age}, score ${score}`);
});
// Alice: age 30, score 98
// Bob: age 25, score 87
// Charlie: age 35, score 92
```

## Взаимодействие с Parameters и ReturnType

Вариативные кортежи хорошо работают вместе со встроенными утилитными типами `Parameters` и `ReturnType`:

```typescript
function fetchUser(id: number, includeRoles: boolean): Promise<{ name: string }> {
  return fetch(`/users/${id}?roles=${includeRoles}`).then((r) => r.json());
}

// Parameters возвращает кортеж
type FetchUserParams = Parameters<typeof fetchUser>;
// => [id: number, includeRoles: boolean]

// Можно расширить
type WithRequestId<T extends unknown[]> = [requestId: string, ...T];
type FetchUserWithRequestId = WithRequestId<FetchUserParams>;
// => [requestId: string, id: number, includeRoles: boolean]

// Обёртка с трассировкой
function withTracing<F extends (...args: any[]) => any>(
  fn: F,
  name: string
): (...args: Parameters<F>) => ReturnType<F> {
  return (...args) => {
    console.log(`[${name}] called with`, args);
    const result = fn(...args);
    console.log(`[${name}] returned`, result);
    return result;
  };
}

const tracedFetch = withTracing(fetchUser, 'fetchUser');
// tracedFetch: (id: number, includeRoles: boolean) => Promise<{ name: string }>
```

## Ограничения

Несмотря на мощь вариативных кортежей, у них есть ряд ограничений:

**Один rest-элемент.** В кортеже может быть только один spread неизвестной длины. Два обобщённых spread в одном кортеже TypeScript разрешить не может.

```typescript
// Нельзя
type TwoSpreads<A extends unknown[], B extends unknown[]> = [...A, ...B]; // OK только если A или B — конкретный тип
```

**Рекурсивные типы требуют осторожности.** Глубокая рекурсия с кортежами может исчерпать лимит вычислений TypeScript и вызвать ошибку `Type instantiation is excessively deep`.

```typescript
// Такой тип может вызвать проблемы при большой глубине рекурсии
type Flatten<T extends unknown[]> =
  T extends [infer Head, ...infer Tail]
    ? Head extends unknown[]
      ? [...Flatten<Head>, ...Flatten<Tail>]
      : [Head, ...Flatten<Tail>]
    : [];
```

**Вывод типов при mixed rest.** Когда rest-элемент стоит не в конце, TypeScript иногда выводит менее точные типы.

```typescript
type WithHeader<T extends unknown[]> = [string, ...T, number];

function process<T extends unknown[]>(...args: WithHeader<T>): T {
  const [, ...middle] = args;
  return middle.slice(0, -1) as T; // TypeScript не может точно отследить
}
```

## Итог

Вариативные кортежи — инструмент для работы с типами переменной длины без потери позиционной информации. Они особенно полезны при типизации:

- функций высшего порядка (`concat`, `zip`, `compose`)
- частичного применения и каррирования
- декораторов и middleware-цепочек
- утилитных типов, манипулирующих структурой кортежей

Знание вариативных кортежей позволяет писать библиотечный код с полной типобезопасностью там, где раньше приходилось прибегать к `any` или перегрузкам функций.

Чтобы глубоко освоить систему типов TypeScript, включая продвинутые техники работы с обобщёнными типами и утилитными типами, приходите на курс по TypeScript: [TypeScript курс на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=variadic-tuple-types)
