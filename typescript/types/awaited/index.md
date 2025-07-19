---
metaTitle: Служебный тип Awaited в TypeScript
metaDescription: Изучите служебный тип Awaited в TypeScript - как он применяется для работы с асинхронностью, распаковкой Promise и типами, а также его синтаксис и реальные примеры
author: Олег Марков
title: Служебный тип Awaited в TypeScript
preview: Разберитесь в возможностях служебного типа Awaited в TypeScript - всё о его предназначении, синтаксисе и типовых сценариях применения для работы с Promise
---

## Введение

С ростом популярности асинхронного программирования в JavaScript и TypeScript появилась потребность в более удобных инструментах работы с Promise и асинхронными функциями. Один из таких инструментов — служебный (или utility) тип Awaited в TypeScript. Awaited предназначен для того, чтобы "распаковывать" результат асинхронных операций и давать возможность статически определить, какой тип выдаст асинхронная функция после ожидания её выполнения. 

Давайте подробно разберём, зачем нужен Awaited, как он работает, какие задачи решает и как применять его на практике для повышения безопасности и предсказуемости вашего кода.

## Что такое служебный тип Awaited

В TypeScript есть множество встроенных и служебных типов, которые помогают работать с типами на более высоком уровне. Awaited — сравнительно новый тип, который был добавлен начиная с TypeScript 4.5 и теперь считается стандартной частью языка.

Awaited предназначен для извлечения типа значения, возвращаемого Promise-подобным объектом, либо возврата самого значения, если такой объект не передан. Проще говоря: Awaited имитирует поведение оператора await, но делает это на уровне типов, а не в рантайме.

Понимание `Awaited` и других служебных типов TypeScript позволяет создавать более гибкий и безопасный код, особенно при работе с асинхронными операциями. Для глубокого понимания асинхронности в TypeScript и других продвинутых концепций, приходите на наш большой [курс TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=sluzhebnyy-tip-awaited-v-typescript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример использования Awaited на простом Promise

Смотрите, я покажу вам, как это работает:

```typescript
type Result = Awaited<Promise<number>>;
// Result примет значение number
```

Это значит, что если у какой-то функции есть возвращаемый тип Promise<T>, то благодаря Awaited вы легко пишете тип для уже "распакованного" значения.

### Awaited и обычные типы

Awaited не преобразует обычные типы:

```typescript
type Simple = Awaited<string>;
// Simple останется string
```
Awaited проверяет — если на входе "чистый" тип, он и останется без изменений.

### Awaited и вложенные Promise

Часто бывают ситуации, когда имеем дело с Promise<Promise<T>>. Awaited распаковует все уровни Promise, пока не доберется до настоящего значения.

```typescript
type Nested = Awaited<Promise<Promise<number>>>;
// Nested примет значение number
```

## Как работает Awaited внутри TypeScript

Если взглянуть на определение Awaited в стандартной библиотеке TypeScript, оно выглядит примерно так:

```typescript
type Awaited<T> =
    T extends null | undefined ? T :
    T extends object & { then(onfulfilled: infer F, ...args: any): any } ?
        F extends (value: infer V, ...args: any) => any ? Awaited<V> : never :
    T;
```

Здесь происходит несколько важных вещей:
- Если тип null или undefined — возвращается сам тип.
- Если тип похож на объект с методом then (то есть, Promise-подобный) — извлекает то, что будет передано в then, и снова применяет Awaited, пока не достигнет конечного значения.
- Если ничего выше не подходит — возвращает сам тип.

### Почему был введён Awaited

До его появления часто использовали пользовательские типы, чтобы "вытащить" результат из Promise. Это вызывало путаницу и часто приводило к ошибкам — разные реализации могли вести себя по-разному, и не всегда поддерживали вложенные Promise корректно.

Теперь у нас есть общий и стандартный инструмент, гарантированно совместимый с остальной инфраструктурой TypeScript.

## Когда и зачем применять Awaited

Использование Awaited не всегда обязательно, но он делает типы более точными и предсказуемыми. Давайте рассмотрим основные ситуации, когда вам пригодится этот служебный тип.

### 1. Типизация возвращаемого значения асинхронных функций

Асинхронная функция всегда возвращает Promise. Иногда вы хотите узнать, какой именно тип будет получен после завершения операции:

```typescript
async function loadUser(): Promise<{ id: number; name: string }> {
  // асинхронная логика
  return { id: 1, name: 'Ivan' };
}

type User = Awaited<ReturnType<typeof loadUser>>;
// User — это { id: number; name: string }
```

Здесь мы определяем тип User как результат разрешения асинхронной функции. Без Awaited тип был бы Promise<{ id: number; name: string }>, а с ним мы сразу получаем "распакованный" объект пользователя.

### 2. Унификация асинхронности в обобщённых типах (generics)

Иногда передается значение, которое может быть как синхронным, так и асинхронным. Awaited помогает автоматически "распаковать" Promise или оставить тип без изменений.

```typescript
type MaybePromise<T> = T | Promise<T>;

function processValue<T>(value: MaybePromise<T>): Promise<Awaited<T>> {
  return Promise.resolve(value);
}
```

В этом примере вы легко обрабатываете значения, вне зависимости от того, передан ли Promise или уже готовое значение, а Awaited гарантирует корректный тип результата.

### 3. Работа с типами, возвращаемыми другими объектами с then

TypeScript поддерживает не только настоящие Promise, но и так называемые "Thenable" объекты. Awaited справляется и с такими случаями.

```typescript
type Thenable<T> = { then: (onfulfilled: (value: T) => any) => any };

type Res = Awaited<Thenable<number>>;
// Res — это number
```

### 4. Сложные вложенные сценарии

Awaited рекурсивно распаковывает типы, поэтому он удобен, когда вы работаете с типами вроде Promise<Promise<MaybePromise<T>>> — он всегда дойдет до "чистой" сущности.

```typescript
type Foo = Awaited<Promise<Promise<{ done: boolean }>>>;
// Foo — это { done: boolean }
```

## Awaited совместно с другими служебными типами

Awaited становится особенно мощным в комбинации с ReturnType, Parameters, а также с условными и обобщёнными типами.

### Awaited и ReturnType

Когда вы хотите определить тип результата для асинхронной функции, важно указать не Promise<...>, а само значение:

```typescript
async function example() { return 42; }

type Resolved = Awaited<ReturnType<typeof example>>;
// Resolved — это number
```

ReturnType возвращает Promise<number>, а Awaited превращает его просто в number.

### Awaited и Parameters

Если перед вами функция, принимающая асинхронные аргументы:

```typescript
async function process(input: string): Promise<boolean> {
  return input.length > 0;
}

type InputArg = Parameters<typeof process>[0];
// InputArg — это string
type Output = Awaited<ReturnType<typeof process>>;
// Output — boolean
```

Особенно удобно использовать это при динамической генерации типов для API или RPC-интерфейсов.

### Awaited и пользовательские generic типы

Многие библиотеки реализуют собственные обертки или декораторы. Awaited помогает корректно типизировать их результаты:

```typescript
type Wrap<T> = () => Promise<T>;

function getValue<T>(fn: Wrap<T>): Promise<Awaited<ReturnType<Wrap<T>>>> {
  return fn();
}
```

Обратите внимание, что Awaited позволяет абстрагироваться от количества Promise-оберток вокруг результата.

## Использование Awaited в реальных задачах

### Типизация резолва Promise.all

Promise.all возвращает Promise массив соответствующих результату элементов. Когда вы хотите типизировать результат:

```typescript
const promises = [Promise.resolve(1), Promise.resolve('two')] as const;
type Resolved = Awaited<typeof promises[number]>;
// Resolved — 1 | 'two'
```

Для массива Promise использование Awaited упрощает описание комплексных результатов.

### Wrapper для асинхронных функций

Бывает нужно "заворачивать" асинхронные функции и корректно типизировать их выход:

```typescript
function withLogger<T extends (...args: any[]) => Promise<any>>(fn: T): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args) => {
    console.log('Вызов с аргументами:', args);
    const result = await fn(...args);
    console.log('Результат:', result);
    return result;
  };
}
```

Здесь Awaited гарантирует, что вы всегда получите то, что ожидали и после распаковки Promise.

### Типизация async middleware

Если вы используете middleware в своем приложении, и middleware может возвращать или значение, или Promise от него — Awaited позволит корректно типизировать результат стека middleware:

```typescript
type MiddlewareOutput<T> = Awaited<T>;

async function middlewareHandler<T>(output: T): Promise<MiddlewareOutput<T>> {
  return await output;
}
```

## Различия с пользовательскими UnwrapPromise и аналогами

До стандартизации Awaited часто создавался свой тип вроде UnwrapPromise:

```typescript
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
```

Однако у такого типа есть нюансы: он не всегда корректно работал с вложенными Promise и не поддерживал thenable-объекты. Awaited же делает это полностью автоматически и на всех уровнях вложенности.

## Типичные ошибки, связанные с Awaited

### 1. Попытка распаковать уже "чистый" тип

Awaited<string> все равно вернет string — это не ошибка, но может быть неожиданно на первый взгляд.

### 2. Ошибки при работе с необобщёнными или нестандартными Promise

Awaited корректно работает только с типами, поддерживающими then (promise-like объекты). С не асинхронными типами он никаких преобразований не сделает.

### 3. Неправильное использование без ReturnType

Если функция асинхронная, используйте ReturnType совместно с Awaited, чтобы получить ожидаемый результат.

## Заключение

Служебный тип Awaited — мощный инструмент для точной и предсказуемой типизации асинхронного кода в TypeScript. Он автоматически извлекает результат из Promise и похожих thenable объектов, а также корректно работает с вложенными асинхронными обертками. Awaited повышает безопасность вашего кода, облегчает его сопровождение и делает возможным написание сложных и гибких generic-типов без неожиданностей.

В современных версиях TypeScript рекомендовано использовать именно Awaited вместо собственных реализаций распаковки Promise-типов. Он особенно полезен при документировании и автоматизации типизации API, middleware, ассинхронных обработчиков и обобщённых функций.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### 1. Как типизировать функцию, возвращающую Promise<any>, чтобы получить конкретный тип результата?

Если у вас есть функция, возвращающая `Promise<any>`, и нужно указать конкретный тип результата на уровне типов, используйте обобщения и Awaited:

```typescript
async function fetchData<T>(): Promise<T> {
  // ваша логика
}
// Здесь Awaited гарантирует "распаковку" внутреннего типа
type Data = Awaited<ReturnType<typeof fetchData<string>>>;
```

### 2. Чем Awaited отличается от UnwrapPromise<T>?

`UnwrapPromise<T>` обычно реализуется с помощью конструкции `T extends Promise<infer U> ? U : T`. Awaited работает глубже: он не только рекурсивно распаковывает вложенные Promise, но и поддерживает thenable-объекты.

### 3. Поддерживает ли Awaited пользовательские thenable объекты?

Да, если объект реализует метод then с нужной сигнатурой, Awaited корректно определит тип результата.

```typescript
type ThenableObj = { then: (cb: (x: number) => void) => void };
type Result = Awaited<ThenableObj>; // Result — number
```

### 4. Как типизировать функцию-хелпер, работающую с sync и async-аргументами?

Вы можете объявить тип аргумента как T | Promise<T> и использовать Awaited<T> для результата:

```typescript
function helper<T>(value: T | Promise<T>): Promise<Awaited<T>> {
  return Promise.resolve(value);
}
```

### 5. Почему Awaited иногда не распаковывает кастомные объекты?

Если ваш thenable-объект не соответствует сигнатуре then из Promise, Awaited может не распознать его корректно. Убедитесь, что метод then реализован правильно и принимает функцию-обработчик с единственным аргументом, который является результатом.

Эффективное использование `Awaited` требует уверенного владения асинхронным программированием и понимания нюансов работы с `Promise`. Чтобы избежать ошибок и создавать надежный код, необходима систематизированная программа обучения, охватывающая все аспекты TypeScript. На нашем [курсе TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=sluzhebnyy-tip-awaited-v-typescript) вы найдете полный путь от новичка до уверенного пользователя TypeScript. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
