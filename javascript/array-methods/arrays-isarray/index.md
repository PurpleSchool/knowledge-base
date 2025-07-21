---
metaTitle: isArray() – JavaScript Array – Методы массивов в JS
metaDescription: Как работает метод isArray() в JavaScript. Всё о методах работы с массивами в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод isArray() - JavaScript
preview: Метод isArray() проверяет, является ли переданный аргумент массивом или нет...
---

Метод `isArray()` проверяет, является ли переданный аргумент массивом или нет.

### Пример

```javascript
let numbers = [1, 2, 3, 4];

// / проверяем является ли numbers массивом или нет
console.log(Array.isArray(numbers));

let text = "JavaScript";

// проверяем является ли text массивом или нет
console.log(Array.isArray(text));

// Вывод в консоль:
// true
// false
```

## Синтаксис isArray()

Синтаксис метода `isArray()` следующий:

```javascript
Array.isArray(value);
```

Метод `isArray()`, будучи статическим методом, вызывается с использованием имени класса `Array`.

## Параметры isArray()

Метод `isArray()` принимает:

- `value` - значение, которое необходимо проверить.

Метод `isArray()` позволяет проверить, является ли переданное значение массивом. Знание этого метода важно для корректной обработки данных. Если вы хотите детальнее погрузиться в JavaScript и узнать больше о массивах и других типах данных, — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-isarray-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Возвращаемое значение isArray()

Метод `isArray()` возвращает:

- `true`, если переданное значение является `Array`
- `false`, если переданное значение не является `Array`

> Примечание: Этот метод всегда возвращает `false` для экземпляров `TypedArray`.

## Примеры

### Пример 1: Используем метод isArray()

```javascript
let fruits = ["Apple", "Grapes", "Banana"];

// / проверка того, является ли fruits массивом или нет
console.log(Array.isArray(fruits));

let text = "Apple";

// проверка того, является ли text массивом или нет
console.log(Array.isArray(text));
```

Вывод в консоль:

```
true
false
```

В приведенном выше примере мы использовали метод `isArray()`, чтобы выяснить, являются ли `fruits` и `text` массивами или нет.

`(Array.isArray(fruits))` возвращает `true`, поскольку `fruits` является объектом массива, а `(Array.isArray(text))` возвращает `false`, поскольку `text` не является массивом (это строка).

### Пример 2: isArray() для проверки других типов данных

```javascript
// передаём пустой массив []
console.log(Array.isArray([])); // true

// мы создали массив с элементом 7 и
// передали это значение в isArray()
console.log(Array.isArray(new Array(7))); // true

// передача булевого значения
console.log(Array.isArray(true)); // false

// передача undefined
console.log(Array.isArray(undefined)); // false

// не передаём ни одного аргумента в isArray()
console.log(Array.isArray()); // false
```

Вывод в консоль:

```
true
true
false
false
false
```

`isArray()` - полезный инструмент для проверки типов данных. Для уверенной работы с JavaScript необходимо понимать, как работают массивы, как их создавать и как использовать различные методы для манипуляции данными. Курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-isarray-javascript) предоставит вам все необходимые знания. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир JavaScript прямо сегодня.
