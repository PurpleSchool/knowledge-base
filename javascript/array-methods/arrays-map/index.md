---
metaTitle: Как работает метод map()
metaDescription: Разбираемся как использовать метод map() правильно
author: Виталий Котов
title: Как работает метод map()
preview: Метод map() создаёт новый массив с результатами вызова функции для каждого элемента массива...
---

# Как работает метод map()

Метод `map()` создаёт новый массив с результатами вызова функции для каждого элемента массива.

### Пример

```javascript
let numbers = [2, 4, 6, 8, 10];

// функция для возврата квадрата числа
function square(number) {
  return number * number;
}

// выполнить функцию Square() к каждому элементу массива numbers
let square_numbers = numbers.map(square);
console.log(square_numbers);

// Вывод в консоль: [ 4, 16, 36, 64, 100 ]
```

## Синтаксис map()

Синтаксис метода `map()` следующий:

```javascript
arr.map(callback(currentValue), thisArg);
```

Где `arr` - это массив.

## Параметры map()

Метод `map()` принимает:

- `callback` - функцию, которая будет выполняться для каждого элемента массива, добавляя возвращаемые значения в новый массив. Принимает:
  - `currentValue` - текущий обрабатываемый элемент в массиве.
- `thisArg` (необязательно) - значение, используемое в качестве `this`, при вызове функции `callback`. По умолчанию определен как `undefined`.

## Возвращаемое значение map()

Возвращает новый массив с элементами в качестве значений, возвращаемых функцией `callback` для каждого элемента.

> ### Примечания:
>
> - `map()` не изменяет исходный массив.
> - `map()` вызывает функцию `callback` один раз для каждого элемента массива по порядку.
> - `map()` не вызывает функцию `callback` для элементов массива без значений.

## Примеры

### Пример 1: Применяем метод map() с использованием пользовательской функции

```javascript
const prices = [1800, 2000, 3000, 5000, 500, 8000];

let newPrices = prices.map(Math.sqrt);
// [ 42.42640687119285, 44.721359549995796, 54.772255750516614,
//   70.71067811865476, 22.360679774997898, 89.44271909999159 ]
console.log(newPrices);

// пользовательская стрелочная функция
const string = "JavaScript";
const stringArr = string.split(""); // массив с пустой строкой

let asciiArr = stringArr.map((x) => x.charCodeAt(0));

// метод map() не изменяет исходный массив
console.log(stringArr); // ['J', 'a', 'v', 'a','S', 'c', 'r', 'i', 'p', 't']

console.log(asciiArr); // [ 74,  97, 118,  97, 83,  99, 114, 105, 112, 116 ]
```

### Пример 2: Применяем метод map() в массивах с объектами

```javascript
const employees = [
  { name: "Adam", salary: 5000, bonus: 500, tax: 1000 },
  { name: "Noah", salary: 8000, bonus: 1500, tax: 2500 },
  { name: "Fabiano", salary: 1500, bonus: 500, tax: 200 },
  { name: "Alireza", salary: 4500, bonus: 1000, tax: 900 },
];

// рассчёт чистой суммы (после вычета налогов), которая будет выдана сотрудникам
const calcAmt = (obj) => {
  newObj = {};
  newObj.name = obj.name;
  newObj.netEarning = obj.salary + obj.bonus - obj.tax;
  return newObj;
};

let newArr = employees.map(calcAmt);
console.log(newArr);
```

Вывод в консоль:

```javascript
[
  { name: "Adam", netEarning: 4500 },
  { name: "Noah", netEarning: 7000 },
  { name: "Fabiano", netEarning: 1800 },
  { name: "Alireza", netEarning: 4600 },
];
```

> Примечание: метод `map()` присваивает значение `undefined` новому массиву, если `callback` функция возвращает `undefined` или ничего.
