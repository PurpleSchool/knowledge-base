---
metaTitle: toLowerCase() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод toLowerCase() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод toLowerCase() - JavaScript
preview: Метод toLowerCase() возвращает строку, преобразованную в нижний регистр...
---

Метод `toLowerCase()` возвращает строку, преобразованную в нижний регистр.

```javascript
const message = "JAVASCRIPT IS FUN";

// преобразование сообщения в нижний регистр
const lowerMessage = message.toLowerCase();
console.log(lowerMessage);

// Вывод в консоль: javascript is fun
```

## Синтаксис toLowerCase()

Синтаксис метода `toLowerCase()` следующий:

```javascript
str.toLowerCase();
```

Где `str` - это строка.

## Параметры toLowerCase()

Метод `toLowerCase()` не принимает никаких параметров.

## Возвращаемое значение toLowerCase()

Возвращает новую строку, представляющую вызывающую строку, преобразованную в нижний регистр.

> **Примечания:**
>
> - Метод `toLowerCase()` вызывает ошибку `TypeError` при вызове c `null` или `undefined`.
> - Метод `toLowerCase()` не изменяет исходную строку.

## Примеры

### Пример 1: Использование метода toLowerCase()

```javascript
let str = "Hello World!";
let sentence = "Java is to JavaScript what Car is to Carpet.";

let lowercase_str = str.toLowerCase();
console.log(lowercase_str); // hello world!

let lowercase = sentence.toLowerCase();
console.log(lowercase); // java is to javascript what car is to carpet.
```

Вывод в консоль:

```
hello world!
java is to javascript what car is to carpet.
```
