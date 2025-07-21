---
metaTitle: reduce() – JavaScript Array – Методы массивов в JS
metaDescription: Как работает метод reduce() в JavaScript. Всё о методах работы с массивами в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод reduce() - JavaScript
preview: Метод reduce() выполняет callback функцию для каждого элемента массива и возвращает одно значение...
---

Метод `reduce()` вызывает `callback` функцию для каждого элемента массива и возвращает одно значение.

### Пример

```javascript
const message = ["JavaScript ", "is ", "fun."];

// функция для объединения всех строковых элементов
function joinStrings(accumulator, currentValue) {
  return accumulator + currentValue;
}

// метод reduce объединяет каждый элемент строки
let joinedString = message.reduce(joinStrings);
console.log(joinedString);

// вывод в консоль: JavaScript is fun.
```

## Синтаксис reduce()

Синтаксис метода `reduce()` следующий:

```javascript
arr.reduce(callback(accumulator, currentValue), initialValue);
```

Где `arr` - это массив.

Метод `reduce()` позволяет свернуть массив в одно значение, применяя функцию-аккумулятор к каждому элементу. Это мощный инструмент для обработки данных. Для освоения `reduce()` и других методов работы с массивами, важно обладать хорошей базой знаний JavaScript. Если вы хотите детальнее погрузиться в JavaScript — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-reduce-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры reduce()

Метод `reduce()` принимает:

- `callback` - функцию, которая будет вызываться для каждого элемента массива (кроме первого элемента, если не указано значение `initialValue`). Принимает:
- `accumulator` - аккумулятор, накапливающий возвращаемые значения функции `callback`.
- `currentValue` - текущий обрабатываемый элемент в массиве.
- `InitialValue` (необязательно) — значение, которое будет передано в callback() при первом вызове. Если он не указан, первый элемент действует как `accumulator` при первом вызове, и `callback()` выполняться для него не будет.

> Примечание: Вызов метода `reduce()` для пустого массива без начального значения вернёт `TypeError`.

## Возвращаемое значение reduce()

Возвращает одно значение, полученное после обработки массива.

> ### Примечания:
>
> - `reduce()` вызывает заданную функцию для каждого элемента массива слева направо.
> - `reduce()` не изменяет исходный массив.
> - Почти всегда безопаснее указать `initialValue`.

## Примеры

### Пример 1: Сумма всех элементов массива

```javascript
const numbers = [1, 2, 3, 4, 5, 6];

function sum_reducer(accumulator, currentValue) {
  return accumulator + currentValue;
}

let sum = numbers.reduce(sum_reducer);
console.log(sum); // 21

// используем стрелочную функцию
let summation = numbers.reduce(
  (accumulator, currentValue) => accumulator + currentValue
);
console.log(summation); // 21
```

Вывод в консоль:

```
21
21
```

### Пример 2: Вычитание чисел в массиве

```javascript
const numbers = [1800, 50, 300, 20, 100];

// вычитает все числа из первого числа
// так как первый элемент яляется аккумулятором
// 1800 - 50 - 300 - 20 - 100
let difference = numbers.reduce(
  (accumulator, currentValue) => accumulator - currentValue
);
console.log(difference); // 1330

const expenses = [1800, 2000, 3000, 5000, 500];
const salary = 15000;

// функция, которая вычитает все элементы массива из заданного числа
// 15000 - 1800 - 2000 - 3000 - 5000 - 500
let remaining = expenses.reduce(
  (accumulator, currentValue) => accumulator - currentValue,
  salary
);
console.log(remaining); // 2700
```

Вывод в консоль:

```
1330
2700
```

Этот пример ясно передаёт разницу между указанием initialValue и его отсутствием.

### Пример 3: Удаление повторяющихся элементов из массива

```javascript
let ageGroup = [18, 21, 1, 1, 51, 18, 21, 5, 18, 7, 10];
let uniqueAgeGroup = ageGroup.reduce(function (accumulator, currentValue) {
  if (accumulator.indexOf(currentValue) === -1) {
    accumulator.push(currentValue);
  }
  return accumulator;
}, []);

console.log(uniqueAgeGroup); // [ 18, 21, 1, 51, 5, 7, 10 ]
```

Вывод в консоль:

```javascript
[18, 21, 1, 51, 5, 7, 10];
```

### Пример 4: Группировка объектов по свойству

```javascript
let people = [
  { name: "John", age: 21 },
  { name: "Oliver", age: 55 },
  { name: "Michael", age: 55 },
  { name: "Dwight", age: 19 },
  { name: "Oscar", age: 21 },
  { name: "Kevin", age: 55 },
];

function groupBy(objectArray, property) {
  return objectArray.reduce(function (accumulator, currentObject) {
    let key = currentObject[property];
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(currentObject);
    return accumulator;
  }, {});
}

let groupedPeople = groupBy(people, "age");
console.log(groupedPeople);
```

Вывод в консоль:

```javascript
{
  '19': [ { name: 'Dwight', age: 19 } ],
  '21': [ { name: 'John', age: 21 }, { name: 'Oscar', age: 21 } ],
  '55': [
    { name: 'Oliver', age: 55 },
    { name: 'Michael', age: 55 },
    { name: 'Kevin', age: 55 }
  ]
}
```

`reduce()` предоставляет широкие возможности для обработки данных. Но для эффективного использования этого и других методов, важно понимать принципы работы с массивами, функции высшего порядка и другие концепции JavaScript. Курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-reduce-javascript) поможет вам освоить все необходимые навыки. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир JavaScript прямо сегодня.
