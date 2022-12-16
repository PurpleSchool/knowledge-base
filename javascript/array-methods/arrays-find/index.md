---
metaTitle: find() – JavaScript Array – Методы массивов в JS
metaDescription: Как работает метод find() в JavaScript. Всё о методах работы с массивами в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод find() - JavaScript
preview: Метод find() возвращает значение первого элемента массива, который удовлетворяет условиям заданной функции...
---

Метод `find()` возвращает значение первого элемента массива, который удовлетворяет условиям заданной функции.

```javascript
let numbers = [1, 3, 4, 9, 8];

// функция проверки четного числа
function isEven(element) {
  return element % 2 == 0;
}

// получаем первое четное число
let evenNumber = numbers.find(isEven);
console.log(evenNumber);

// Вывод в консоль: 4
```

## Синтаксис find()

Синтаксис метода `find()` следующий:

```javascript
arr.find(callback(element, index, arr), thisArg);
```

Где `arr` - это массив.

## Параметры find()

Метод `find()` принимает:

- `callback` - функцию, которая будет вызываться для каждого элемента массива. Принимает:
  - `element` - текущий элемент в массиве.
- `thisArg` (необязательно) - значение, используемое в качестве `this`, при вызове функции `callback`.

## Возвращаемое значение find()

- Возвращает значение первого элемента массива, удовлетворяющего заданной функции.
- Возвращает `undefined`, если ни один из элементов не удовлетворяет функции.

## Примеры

### Пример 1: Использование метода find()

```javascript
function isEven(element) {
  return element % 2 == 0;
}

let randomArray = [1, 45, 8, 98, 7];

let firstEven = randomArray.find(isEven);
console.log(firstEven); // 8

// используем стрелочную функцию
let firstOdd = randomArray.find((element) => element % 2 == 1);
console.log(firstOdd); // 1
```

Вывод в консоль:

```
8
1
```

### Пример 2: find() с элементами объекта

```javascript
const team = [
  { name: "Bill", age: 10 },
  { name: "Linus", age: 15 },
  { name: "Alan", age: 20 },
  { name: "Steve", age: 34 },
];

function isAdult(member) {
  return member.age >= 18;
}

console.log(team.find(isAdult)); // { name: 'Alan', age: 20 }

// используем стрелочную функцию и деструктуризацию
let adultMember = team.find(({ age }) => age >= 18);

console.log(adultMember); // { name: 'Alan', age: 20 }
```

Вывод в консоль:

```javascript
{ name: 'Alan', age: 20 }
{ name: 'Alan', age: 20 }
```
