---
metaTitle: startsWith() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод startsWith() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод startsWith() - JavaScript
preview: Метод startsWith() возвращает true, если строка начинается с указанного символа(ов). Если нет, возвращается false...
---

Метод `startsWith()` возвращает `true`, если строка начинается с указанного символа(ов). Если нет, возвращается `false`.

```javascript
const message = "JavaScript is fun";

// проверка, начинается ли message с Java
let result = message.startsWith("Java");

console.log(result); // true

// проверка, начинается ли message с Script
result = message.startsWith("Script");

console.log(result); // false
```

## Синтаксис startsWith()

Синтаксис метода `startsWith()` следующий:

```javascript
str.startsWith(searchString, position);
```

Где `str` - это строка.

## Параметры startsWith()

Метод `startsWith()` принимает:

- `searchString` - Символы, которые нужно искать в начале `str`.
- `position` (необязательно) - позиция в `str`, с которой следует начинать поиск `SearchString`. Значение по умолчанию равно **0**.

## Возвращаемое значение startsWith()

- Возвращает `true`, если заданные символы найдены в начале строки.
- Возвращает `false`, если заданные символы не найдены в начале строки.

> **Примечание:** метод `startsWith()` чувствителен к регистру.

## Примеры

### Пример 1: Использование метода startsWith()

```javascript
sentence = "Java is to JavaScript what Car is to Carpet.";

let check = sentence.startsWith("Java");
console.log(check); // true

let check1 = sentence.startsWith("Java is");
console.log(check1); // true

// чувствительный к регистру
let check2 = sentence.startsWith("JavaScript");
console.log(check2); // false

// второй аргумент указывает начальную позицию
let check3 = sentence.startsWith("JavaScript", 11);
console.log(check3); // true
```

Вывод в консоль:

```
true
true
false
true
```
