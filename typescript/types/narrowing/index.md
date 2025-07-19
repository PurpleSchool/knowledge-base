---
metaTitle: Сужение типов (Narrowing) в TypeScript
metaDescription: Разбираемся как использовать cужение типов (Narrowing) в TypeScript
author: Дмитрий Нечаев
title: Сужение типов (Narrowing) в TypeScript
preview: Учимся пользоваться сужением типов (Narrowing) в TypeScript. Разбираем примеры использования
---

## Введение

**Сужение типа (`Narrowing`)** в TypeScript - это процесс уточнения типов переменных. Это ключевой механизм для работы с типами в TypeScript, позволяющий разработчикам более точно указывать, какие типы данных используются в их коде. Сужение типа помогает избегать ошибок, связанных с неправильным использованием типов, и делает код более читаемым и безопасным. В TypeScript существует множество способов для сужения типа, каждый из которых подходит для определенных ситуаций.

Для более глубокого изучения сужения типов и условных типов, приглашаем вас на наш курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=Suzhenie_tipov_(Narrowing)_v_TypeScript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Защитник типа (`typeof`)

Type guards используются для проверки типа переменной во время выполнения. С помощью оператора `typeof` можно проверить простые типы (`string`, `number`, `boolean`, и `symbol`). Это позволяет уточнить тип переменной в блоке кода.

```tsx
function printText(text: string | number) {
  if (typeof text === "string") {
    console.log(text.toUpperCase()); // text теперь имеет тип string
  } else {
    console.log(text); // text теперь имеет тип number
  }
}

```

## Проверка на истинность (Truthiness narrowing)

TypeScript учитывает значения, которые могут быть истинными или ложными (`true` или `false`). При использовании условных операторов, таких как `if`, можно автоматически уточнить тип переменной.

```tsx
function printText(text: string | null) {
  if (text) {
    console.log(text); // text здесь не null
  } else {
    console.log("Text is null"); // text здесь null
  }
}

```

## Проверка на равенство (Equality narrowing)

При использовании операторов сравнения, таких как `===` или `!==`, TypeScript может сузить тип переменной на основе этих проверок.

```tsx
function printLength(x: string | string[]) {
  if (typeof x === "string") {
    console.log(x.length); // x теперь имеет тип string
  } else {
    console.log(x.length); // x теперь имеет тип string[]
  }
}

```

## Сужение типов с помощью оператора `in`

Оператор `in` проверяет наличие свойства в объекте, что позволяет TypeScript сузить тип объекта до конкретного типа, имеющего это свойство.

```tsx
function printArea(shape: Square | Circle) {
  if ("radius" in shape) {
    console.log(Math.PI * shape.radius ** 2); // shape теперь имеет тип Circle
  } else {
    console.log(shape.sideLength ** 2); // shape теперь имеет тип Square
  }
}

```

## Сужение типов с помощью оператора `instanceof`

Оператор `instanceof` проверяет, создан ли объект с помощью определенной функции конструктора. Это позволяет уточнить тип переменной до типа этого конструктора.

```tsx
function printDate(date: Date | string) {
  if (date instanceof Date) {
    console.log(date.toISOString()); // date теперь имеет тип Date
  } else {
    console.log(date); // date теперь имеет тип string
  }
}

```

## Использование предикатов типа (type predicates)

Type predicates - это специальные функции, которые позволяют явно указать, какой тип имеет переменная в определенном контексте.

```tsx
function isString(test: any): test is string {
  return typeof test === "string";
}

function printText(text: any) {
  if (isString(text)) {
    console.log(text.toUpperCase()); // text теперь явно имеет тип string
  }
}

```

## Исключающие объединения (Discriminated unions)

Исключающие объединения (или Discriminated unions) - это шаблон, который включает общее свойство (например, `kind`) в каждом элементе объединения, позволяющий TypeScript точно определить, к какому типу относится значение.

```tsx
type Square = { kind: "square"; size: number; };
type Circle = { kind: "circle"; radius: number; };

function getArea(shape: Square | Circle) {
  switch (shape.kind) {
    case "square":
      return shape.size ** 2;
    case "circle":
      return Math.PI * shape.radius ** 2;
  }
}

```

## Тип `never`

Тип `never` используется для представления значений, которые никогда не должны произойти. В контексте сужения типов, это полезно для функций, которые не возвращают управление (например, выбрасывают исключение) или для исчерпывающей проверки случаев в switch.

```tsx
function throwError(message: string): never {
  throw new Error(message);
}

function getArea(shape: Square | Circle): number {
  switch (shape.kind) {
    case "square":
      return shape.size ** 2;
    case "circle":
      return Math.PI * shape.radius ** 2;
    default:
      // Если добавится новый тип, TypeScript укажет на ошибку здесь
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}

```

## Исчерпывающие проверки (Exhaustiveness checking)

Исчерпывающая проверка гарантирует, что все возможные случаи обработаны. Это особенно полезно при работе с дискриминированными объединениями, где TypeScript может убедиться, что все варианты типа были проверены.

```tsx
type Shape = Square | Circle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "square":
      return shape.size ** 2;
    case "circle":
      return Math.PI * shape.radius ** 2;
    default:
      // Если забыть добавить новый тип, TypeScript укажет здесь на ошибку
      const _exhaustiveCheck: never = shape;
      throw new Error("Unknown shape type");
  }
}

```

## Заключение

Сужение типов (Narrowing) в TypeScript - это мощный инструмент для работы с типами, который обеспечивает безопасность типов во время компиляции и помогает избежать ошибок во время выполнения. Использование различных стратегий narrowing, включая type guards, assertion functions, исключающие объединения и исчерпывающую проверку, делает код более надежным и удобным для понимания.

Narrowing позволяет TypeScript понимать, какой тип данных находится в переменной в определенный момент времени. Узнайте как использовать type guards, discriminated unions и другие техники на нашем курсе [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=Suzhenie_tipov_(Narrowing)_v_TypeScript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
