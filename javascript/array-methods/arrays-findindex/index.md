---
metaTitle: findIndex() – JavaScript Array – Методы массивов в JS
metaDescription: Как работает метод findIndex() в JavaScript. Всё о методах работы с массивами в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод findIndex() - JavaScript
preview: Метод findIndex() возвращает индекс первого элемента массива, удовлетворяющего условиям заданной функции, или возвращает -1...
---

Метод `findIndex()` возвращает индекс первого элемента массива, удовлетворяющего условиям заданной функции, или возвращает -1.

```javascript
// функция возврата нечётного числа
function isOdd(element) {
  return element % 2 !== 0;
}

// объявляем массив целых чисел
let numbers = [2, 8, 1, 3, 4];

// возвращяем индекс первого нечётного числа в массиве
let firstOdd = numbers.findIndex(isOdd);

console.log(firstOdd);

// Вывод в консоль: 2
```

## Синтаксис findIndex()

Синтаксис метода `findIndex()` следующий:

```javascript
arr.findIndex(callback(element, index, arr), thisArg);
```

Где `arr` - это массив.

Метод `findIndex()` возвращает индекс первого элемента в массиве, который удовлетворяет заданному условию. Этот метод предоставляет мощный способ для поиска элементов в массивах по определенным критериям. Для эффективного использования `findIndex()` необходимо хорошее знание основ JavaScript и работы с функциями. Если вы хотите детальнее погрузиться в JavaScript — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-findindex-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры findIndex()

Метод `findIndex()` принимает:

- `callback` - функцию, которая будет вызываться для каждого элемента массива. Принимает:
  - `element` - текущий обрабатываемый элемент в массиве.
- `thisArg` (необязательно) - значение, используемое в качестве `this`, при вызове функции `callback`.

## Возвращаемое значение findIndex()

- Возвращает индекс первого элемента в массиве, который удовлетворяет заданной функции.
- Возвращает -1, если ни один из элементов не удовлетворяет функции.

## Примеры

### Пример 1: Используем метод findIndex()

```javascript
// функция возврата чётных чисел
function isEven(element) {
  return element % 2 == 0;
}

// объявляем массив целых чисел
let numbers = [1, 45, 8, 98, 7];

// возвращаем индекс первого чётного числа в массиве
let firstEven = numbers.findIndex(isEven);

console.log(firstEven); // 2
```

Вывод в консоль:

```
2
```

В приведенном выше примере мы использовали метод `findIndex()`, чтобы найти индекс первого четного числа в массиве `numbers`.

`isEven()` - это функция, которая возвращает четное число. Мы передали `isEven()` в качестве `callback` функции в метод `findIndex()` как - `numbers.findIndex(isEven)`.

Метод возвращает 2 - индекс первого четного числа в массиве `numbers`, т.е. 8.

### Пример 2: findIndex() со стрелочной функцией

```javascript
// объявляем массив
let days = ["Sunday", "Wednesday", "Tuesday", "Friday"];

// возвращаем первый индекс у 'Wednesday' в массиве
let index = days.findIndex((day) => day === "Wednesday");

console.log(index); // 1
```

Вывод в консоль:

```
1
```

Здесь мы передали стрелочную функцию в качестве `callback` функции в методе findIndex(). Метод возвращает первый индекс 'Wednesday'.

### Пример 3: findIndex() с элементами объекта

```javascript
// объявляем объект
const team = [
  { name: "Bill", age: 10 },
  { name: "Linus", age: 15 },
  { name: "Alan", age: 20 },
  { name: "Steve", age: 34 },
];

// функция, возвращающая возраст больший или равный 18
function isAdult(member) {
  return member.age >= 18;
}

// возвращает индекс первого элемента, который
// больше или равен 18
console.log(team.findIndex(isAdult)); // 2
```

Вывод в консоль:

```
2
```

`findIndex()` - это важный инструмент для поиска элементов в массивах. Чтобы уверенно использовать этот и другие методы поиска, необходимо понимать структуру массивов, принципы работы с функциями и концепцию callback-функций. Курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-findindex-javascript) предоставит вам все необходимые знания. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир JavaScript прямо сегодня.
