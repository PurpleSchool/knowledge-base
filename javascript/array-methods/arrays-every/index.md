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
