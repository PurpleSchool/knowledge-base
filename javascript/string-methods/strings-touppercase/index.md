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

Метод `toUpperCase()` преобразует все символы строки в верхний регистр. Это часто используется для приведения строк к единому формату, например, при сравнении текста без учета регистра. Для понимания принципов работы этого и других методов изменения регистра необходимо знать основы работы со строками в JavaScript. Если вы хотите детальнее погрузиться в работу со строками и их преобразованиями — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-touppercase-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

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

Понимание принципа работы `toUpperCase()` – важный шаг. Но для создания сложных и эффективных веб-приложений, вам потребуется более глубокое понимание JavaScript, чем знание отдельных строковых методов. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-touppercase-v-javascript) вы изучите основы языка, научитесь работать с различными типами данных и создавать интерактивные пользовательские интерфейсы. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
