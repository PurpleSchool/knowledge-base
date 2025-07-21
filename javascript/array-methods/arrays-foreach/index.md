---
metaTitle: forEach() – JavaScript Array – Методы массивов в JS
metaDescription: Как работает метод forEach() в JavaScript. Всё о методах работы с массивами в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод forEach() - JavaScript
preview: Метод forEach() последовательно перебирает все элементы массива и выполняет для каждой полученную в параметрах функцию...
---

Метод `forEach()` последовательно перебирает все элементы массива и выполняет для каждой полученную в параметрах функцию.

```javascript
let numbers = [1, 3, 4, 9, 8];

// функция для вычисления квадрата
function computeSquare(element) {
  console.log(element * element);
}

// вычисление квадрата каждого элемента
numbers.forEach(computeSquare);
```

## Синтаксис forEach()

Синтаксис метода `forEach()` следующий:

```javascript
arr.forEach(callback(currentValue), thisArg);
```

Где `arr` - это массив.

Метод `forEach()` позволяет выполнить функцию для каждого элемента массива. Это один из основных способов итерации по массивам в JavaScript. Для эффективного использования `forEach()` необходимо хорошее понимание основ JavaScript и работы с функциями. Если вы хотите детальнее погрузиться в JavaScript — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-foreach-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры forEach()

Метод `forEach()` принимает:

- `callback` - функцию, которая будет вызываться для каждого элемента массива. Принимает:
  - `currentValue` - текущий обрабатываемый элемент в массиве.
- `thisArg` (необязательно) - значение, используемое в качестве `this`, при вызове функции `callback`. По умолчанию определен как `undefined`.

## Возвращаемое значение forEach()

Возвращает `undefined`.

> ### Примечания
>
> - `forEach()` не изменяет исходный массив.
> - `forEach()` вызывает функцию `callback` один раз для каждого элемента массива по порядку.
> - `forEach()` не вызывает функцию `callback` для элементов массива без значений.

## Примеры

### Пример 1: Печать содержимого массива

```javascript
function printElements(element, index) {
  console.log("Array Element " + index + ": " + element);
}

const prices = [1800, 2000, 3000, , 5000, 500, 8000];

// forEach() не выполняется для элементов без значения
// поскольку элемент под номером три пуст, в такой ситуации он пропускается
prices.forEach(printElements);
```

Вывод в консоль:

```
Элемент массива 0: 1800
Элемент массива 1: 2000
Элемент массива 2: 3000
Элемент массива 4: 5000
Элемент массива 5: 500
Элемент массива 6: 8000
```

### Пример 2: Использование thisArg

```javascript
function Counter() {
  this.count = 0;
  this.sum = 0;
  this.product = 1;
}

Counter.prototype.execute = function (array) {
  array.forEach((entry) => {
    this.sum += entry;
    ++this.count;
    this.product *= entry;
  }, this);
};

const obj = new Counter();
obj.execute([4, 1, , 45, 8]);

console.log(obj.count); // 4

console.log(obj.sum); // 58

console.log(obj.product); // 1440
```

Вывод в консоль:

```
4
58
1440
```

Здесь мы снова видим, что метод `forEach()` пропускает пустой элемент. `thisArg` передается как `this` внутри определения метода `execute` объекта `Counter`.

`forEach()` - это базовый метод для итерации по массивам. Чтобы уверенно использовать этот и другие методы, необходимо понимать структуру массивов, принципы работы с функциями и концепцию callback-функций. Курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-foreach-javascript) предоставит вам все необходимые знания. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир JavaScript прямо сегодня.
