---
metaTitle: Как типизировать массивы в TypeScript
metaDescription: Разбираемся как типизировать массив в TypeScript
author: Вячеслав Руденко
title: Как типизировать массивы TypeScript
preview: Как типизировать массивы. Охватываем основы объявления и использования типов для массивов
---

В TypeScript вы можете объявить тип элементов массива, указав его в угловых скобках после имени переменной. Например:

```typescript
const ages: number[] = [18, 35, 51, 28, 12];
```

В этом примере мы объявляем массив с именем ages, который содержит только числовые значения. Это означает, что при попытке добавить в массив что-то другое, TypeScript выдаст ошибку на этапе компиляции.

Правильная типизация массивов — это фундамент безопасного и предсказуемого кода. Ошибки в типизации массивов могут привести к непредсказуемым runtime-ошибкам и затруднить отладку. Если вы хотите детальнее изучить систему типов TypeScript и научиться писать надежный код — приходите на наш большой [курс TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-tipizirovat-massivy-typescript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Array<string>

Для более сложных случаев, когда вы хотите определить типы элементов массива более подробно, вы можете использовать обобщенные типы. Например:

```typescript
const users: Array<{name: string; age: number}> = [
  {name: 'Анна', age: 25},
  {name: 'Петр', age: 30},
  {name: 'Иван', age: 22},
];
```

Выглядит не особо красиво, давайте попробуем так:

```typescript
type UserType = {
  name: string;
  age: number;
};

const users: Array<UserType> = [
  {name: 'Анна', age: 25},
  {name: 'Петр', age: 30},
  {name: 'Иван', age: 22},
];
```

## Типизация массивов с использованием кортежей

Когда нужно типизировать массив, содержащий элементы разных типов, можно воспользоваться кортежами. В этом случае мы указываем типы элементов в круглых скобках:

```typescript
const point: [number, number] = [0, -5];
```

В этом примере мы рассматриваем координаты точки на оси координат

Давайте рассмотрим ошибки:

```typescript
const point: [number, number, string] = [0, -5, 9];
// Type 'number' is not assignable to type 'string'.

const point3D: [number, number] = [0, -5, 9];
// Type '[number, number, number]' is not assignable to type '[number, number]'.
// Source has 3 element(s) but target allows only 2.
```

## ReadonlyArray

TypeScript также позволяет определять массивы, элементы которых нельзя изменять. Для этого применяется тип `ReadonlyArray<>`, для которого в угловых скобках указывается тип элементов массива. Например:

```typescript
const fruits: ReadonlyArray<string> = ['Яблоко', 'Банан', 'Апельсин'];

fruits.push('Груша'); // Property 'push' does not exist on type 'readonly string[]`
fruits[1] = 'Груша'; // Index signature in type 'readonly string[]' only permits reading
```

Для определения подобных массивов также можно использовать сокращение типа - `readonly` Тип_данных[]

```typescript
const fruits: readonly string[] = ['Яблоко', 'Банан', 'Апельсин'];

fruits.push('Груша'); // Property 'push' does not exist on type 'readonly string[]
fruits[1] = 'Груша'; // Index signature in type 'readonly string[]' only permits reading
```

Глубокое понимание типизации массивов невозможно без знания продвинутых концепций TypeScript, таких как generics, mapped types и conditional types. На нашем [курсе TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-tipizirovat-massivy-typescript) вы получите комплексные знания о системе типов TypeScript и научитесь эффективно использовать их на практике. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
