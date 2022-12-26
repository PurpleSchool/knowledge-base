---
metaTitle: includes() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод includes() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод includes() - JavaScript
preview: Метод includes() проверяет, можно ли найти данную строку внутри другой строки...
---

Метод `includes()` проверяет, можно ли найти данную строку внутри другой строки.

```javascript
const message = "JavaScript is fun";

// проверка, включает ли message строку "Java"
let result = message.includes("Java");
console.log(result);

// Вывод в консоль: true
```

## Синтаксис includes()

Синтаксис метода `includes()` следующий:

```javascript
str.includes(searchString, position);
```

Где `str` - это строка.

## Параметры includes()

Метод `includes()` принимает:

- `searchString` - строка, которую нужно искать в пределах `str`.
- `position` (необязательно) - позиция в строке `str`, с которой начинается поиск `searchString`. По умолчанию это значение равно **0**.

## Возвращаемое значение includes()

- Возвращает `true`, если строка `searchString` найдена в каком-либо месте `str`.
- Возвращает `false`, если `searchString` не найден нигде в пределах `str`.

> **Примечание:** метод `includes()` чувствителен к регистру.

## Примеры

### Пример 1: Использование метода includes()

```javascript
let sentence = "Java is to JavaScript what Car is to Carpet.";

let check = sentence.includes("Java");
console.log(check); // true

// чувствительность к регистру
let check1 = sentence.includes("java");
console.log(check1); // false

// второй аргумент указывающий позицию, с которой нужно начинать
let check2 = sentence.includes("Java", 20);
console.log(check2); // false

let check3 = sentence.includes("whose");
console.log(check3); // false

let check4 = sentence.includes("");
console.log(check4); // true
```

Вывод в консоль:

```
true
false
false
false
true
```
