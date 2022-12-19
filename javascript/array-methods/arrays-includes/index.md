---
metaTitle: includes() – JavaScript Array – Методы массивов в JS
metaDescription: Как работает метод includes() в JavaScript. Всё о методах работы с массивами в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод includes() - JavaScript
preview: Метод includes() проверяет, содержит ли массив указанный элемент или нет...
---

Метод `includes()` проверяет, содержит ли массив указанный элемент или нет.

### Пример

```javascript
// объявляем массив
let languages = ["JavaScript", "Java", "C"];

// проверяем содержит ли массив 'Java'
let check = languages.includes("Java");

console.log(check);

// Вывод в консоль: true
```

## Синтаксис includes()

Синтаксис метода `includes()` следующий:

```javascript
arr.includes(valueToFind, fromIndex);
```

Где `arr` - это массив.

## Параметры includes()

Метод `includes()` принимает:

- `searchValue` — значение для поиска.
- `fromIndex` (необязательно) — позиция в массиве, с которой начинается поиск. По умолчанию это 0.

> ### Примечание:
>
> Для отрицательных значений поиск начинается с `array.length + fromIndex` (отсчет идет от обратного). Например, -1 представляет собой последний элемент.

## Возвращаемое значение includes()

Метод `includes()` возвращает:

- `true`, если `searchValue` найдено в каком-то месте массива
- `false`, если `searchValue` не найдено в массиве

## Примеры

### Пример 1: Использование метода includes()

```javascript
let languages = ["JavaScript", "Java", "C", "C++"];

// проверяем содержит ли массив 'C'
let check1 = languages.includes("C");

console.log(check1); // true

// проверяем содержит ли массив 'Ruby'
let check2 = languages.includes("Ruby");

console.log(check2); // false
```

Вывод в консоль:

```
true
false
```

В приведенном выше примере мы использовали метод `includes()`, чтобы проверить, содержит ли массив `languages` элементы 'C' и 'Ruby'.

`languages.includes("C")` возвращает `true`, поскольку массив содержит 'C', а `languages.includes("Ruby")` возвращает `false`, поскольку массив не содержит 'Ruby'.

### Пример 2: includes() для поиска с учётом регистра

Метод `includes()` чувствителен к регистру. Например:

```javascript
let languages = ["JavaScript", "Java", "C", "Python"];

// проверяем содержит ли массив 'Python'
let check1 = languages.includes("Python");

console.log(check1); // true

// проверяем содержит ли массив 'python'
let check2 = languages.includes("python");

console.log(check2); // false
```

Вывод в консоль:

```
true
false
```

Здесь метод `includes()` возвращает `true` для `searchValue` - `'Python'` и `false` для `'python'`.

Это происходит потому, что метод чувствителен к регистру и рассматривает `'Python'` и `'python'` как две разные строки.

### Пример 3: includes() с двумя параметрами

```javascript
let languages = ["JavaScript", "Java", "C", "Python"];

// второй аргумент указывает позицию для начала поиска
let check1 = languages.includes("Java", 2);

console.log(check1); // false

// поиск начинается с третьего последнего элемента
let check2 = languages.includes("Java", -3);

console.log(check2); // true
```

Вывод в консоль:

```
false
true
```

В приведенном выше примере мы передали два значения аргумента в метод `includes()`.

`languages.includes("Java", 2)` возвращает `false`, так как метод не находит `'Java'` со второго индекса массива.

В `languages.includes("Java", -3)` метод начинает поиск `'Java'` с третьего последнего элемента из-за отрицательного аргумента -3.
