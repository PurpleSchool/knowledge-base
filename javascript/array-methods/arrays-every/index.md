---
metaTitle: every() – JavaScript Array – Методы массивов в JS
metaDescription: Как работает метод every() в JavaScript. Всё о методах работы с массивами в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод every() - JavaScript
preview: Метод every() проверяет, все ли элементы массива проходят заданную тестовую функцию...
---

Метод `every()` проверяет, все ли элементы массива проходят заданную тестовую функцию.

## Синтаксис every()

Синтаксис метода `every()` следующий:

```javascript
arr.every(callback(currentValue), thisArg);
```

Где `arr` - это массив.

Метод `every()` проверяет, удовлетворяют ли все элементы массива заданному условию. Этот метод полезен для проверки соответствия массива определенным критериям. Для эффективного использования `every()` необходимо хорошее понимание основ JavaScript и работы с функциями. Если вы хотите детальнее погрузиться в JavaScript и узнать больше о методах проверки массивов, — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-every-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры every()

Метод `every()` принимает:

- `callback` - функцию для проверки каждого элемента массива. Принимает:
  - `currentValue` - текущий обрабатываемый элемент в массиве.
- `thisArg` (необязательно) - значение, используемое в качестве `this`, при вызове функции `callback`. По умолчанию определен как `undefined`.

## Возвращаемое значение every()

Возвращает `true`, если все элементы массива проходят проверку заданной функции (`callback` возвращает истинное значение).

> ### Примечания:
>
> - `every()` не изменяет исходный массив.
> - `every()` не вызывает функцию `callback` для элементов массива без значений.

## Примеры

### Пример 1: Проверяем значение элемента массива

```javascript
function checkAdult(age) {
  return age >= 18;
}

const ageArray = [34, 23, 20, 26, 12];
let check = ageArray.every(checkAdult); // false

if (!check) {
  console.log("All members must be at least 18 years of age.");
}

// используем стрелочную функцию
let check1 = ageArray.every((age) => age >= 18); // false
console.log(check1);
```

Вывод в консоль:

```
All members must be at least 18 years of age.
false
```

`every()` - это важный метод для проверки массивов на соответствие определенным условиям. Чтобы уверенно использовать этот и другие методы проверки, необходимо понимать структуру массивов, принципы работы с функциями и концепцию callback-функций. Курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-every-javascript) предоставит вам все необходимые знания. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир JavaScript прямо сегодня.
