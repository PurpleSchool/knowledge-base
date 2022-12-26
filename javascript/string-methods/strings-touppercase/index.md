---
metaTitle: toUpperCase() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод toUpperCase() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод toUpperCase() - JavaScript
preview: Метод toUpperCase() возвращает строку, преобразованную в верхний регистр...
---

Метод `toUpperCase()` возвращает строку, преобразованную в верхний регистр.

```javascript
const message = "javascript is fun";

// преобразование сообщения в верхний регистр
const upperMessage = message.toUpperCase();
console.log(upperMessage);

// Вывод в консоль: JAVASCRIPT IS FUN
```

## Синтаксис toUpperCase()

Синтаксис метода `toUpperCase()` следующий:

```javascript
str.toUpperCase();
```

Где `str` - это строка.

## Параметры toUpperCase()

Метод `toUpperCase()` не принимает никаких параметров.

## Возвращаемое значение toUpperCase()

Возвращает новую строку, представляющую вызывающую строку, преобразованную в верхний регистр.

> **Примечания:**
>
> - Метод `toUpperCase()` вызывает ошибку `TypeError` при вызове с `null` или `undefined`.
> - Метод `toUpperCase()` не изменяет исходную строку.

## Примеры

### Пример 1: Использование метода toUpperCase()

```javascript
let str = "Hello World!";
let sentence = "Java is to JavaScript what Car is to Carpet.";

let uppercase_str = str.toUpperCase();
console.log(uppercase_str); // HELLO WORLD!

let uppercase = sentence.toUpperCase();
console.log(uppercase); // JAVA IS TO JAVASCRIPT WHAT CAR IS TO CARPET.
```

Вывод в консоль:

```
HELLO WORLD!
JAVA IS TO JAVASCRIPT WHAT CAR IS TO CARPET.
```
