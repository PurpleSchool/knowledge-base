---
metaTitle: concat() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод concat() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод concat() - JavaScript
preview: Метод concat() объединяет заданные аргументы в заданную строку...
---

Метод `concat()` объединяет заданные аргументы в заданную строку.

```javascript
let emptyString = "";

// строка совместных аргументов
let joinedString = emptyString.concat("JavaScript", " - это", " весело.");
console.log(joinedString);

// Вывод в консоль: JavaScript - это весело.
```

## Синтаксис concat()

Синтаксис метода `concat()` следующий:

```javascript
str.concat(str1, ..., strN)
```

Где `str` - это строка.

Объединение строк с помощью метода `concat()` в JavaScript требует понимания его особенностей. Для глубокого понимания всех нюансов работы со строками и написания оптимального кода, необходимо иметь крепкий фундамент в основах JavaScript. Если вы хотите детальнее погрузиться в фундаментальные знания языка — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-concat-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры concat()

Метод `concat()` принимает произвольное количество строк для объединения в `str`.

## Возвращаемое значение concat()

Возвращает новую строку, содержащую объединенный текст предоставленных строк.

> **Примечание:** операторы присваивания, такие как `+` и `+=`, настоятельно рекомендуется использовать вместо метода `concat()`.

## Примеры

### Пример 1: Использование метода concat()

```javascript
console.log("".concat({})); // [object Object]
console.log("".concat(null)); // null
console.log("".concat(true)); // true
console.log("".concat(4, 5)); // 45

let str1 = "Hello";
let str2 = "World";

// объединение двух строк
let newStr = str1.concat(", ", str2, "!");
console.log(newStr); // Hello, World!
```

Вывод в консоль:

```
[object Object]
null
true
45
Hello, World!
```

Понимание метода `concat()` и других способов работы со строками критически важно для любого JavaScript-разработчика. Для уверенного использования этого и других строковых методов необходимы крепкие базовые знания. На нашем курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-concat-javascript) вы изучите все необходимые основы. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
