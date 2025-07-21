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

Метод `startsWith()` позволяет проверить, начинается ли строка с определенной подстроки. Это полезно для анализа и фильтрации текста. Для уверенного использования этого метода необходимо понимать, как работают строки и как использовать различные методы для их обработки. Если вы хотите детальнее погрузиться в особенности работы со строками в JavaScript — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-startswith-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

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

Использование `startsWith()` – это отличный способ улучшить читаемость и эффективность вашего кода при работе со строками. Но мир JavaScript гораздо шире, и для создания по-настоящему сложных приложений вам потребуется знание множества других концепций, таких как DOM, асинхронность и работа с данными. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-startswith-v-javascript) вы получите все необходимые знания и навыки. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
