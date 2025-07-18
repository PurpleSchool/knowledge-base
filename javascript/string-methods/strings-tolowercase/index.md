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

Метод `toLowerCase()` преобразует все символы строки в нижний регистр. Это часто используется для нормализации строк, чтобы сравнение текста не зависело от регистра символов. Глубокое понимание работы со строками, включая изменение регистра, необходимо для создания надежных веб-приложений. Если вы хотите детальнее погрузиться в работу со строками и их преобразованиями — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-tolowercase-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

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

Умение приводить строки к нижнему регистру, безусловно, полезно. Но настоящая сила JavaScript раскрывается тогда, когда вы владеете не только отдельными методами, но и понимаете принципы объектно-ориентированного программирования, асинхронности и работы с DOM. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-tolowercase-v-javascript) вы получите все необходимые знания и навыки. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
