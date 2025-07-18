---
metaTitle: slice() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод slice() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод slice() - JavaScript
preview: Метод slice() извлекает и возвращает определённый участок строки...
---

Метод `slice()` извлекает и возвращает определённый участок строки.

```javascript
const message = "JavaScript is fun";

// разрез подстроки от индекса 0 до 10
let result = message.slice(0, 10);
console.log(result);

// Вывод в консоль: JavaScript
```

## Синтаксис slice()

Синтаксис метода `slice()` следующий:

```javascript
str.slice(beginIndex, endIndex);
```

Где `str` - это строка.

## Параметры slice()

Метод `slice()` принимает:

- `beginIndex` - начальный индекс выделения.
- `endIndex` (необязательно) - конечный индекс выделения (исключительный). По умолчанию выделяется до конца строки.

Метод `slice()` извлекает часть строки или массива, возвращая новую строку или массив. Это универсальный инструмент для работы с данными. Чтобы эффективно использовать `slice()`, необходимо понимать, как работают строки и массивы, а также как использовать индексы для доступа к элементам. Если вы хотите детальнее погрузиться в работу со строками и массивами в JavaScript — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-slice-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Возвращаемое значение slice()

Возвращает новую строку, содержащую выделенный участок строки.

> **Примечание:** метод `slice()` не изменяет исходную строку.

## Примеры

### Пример 1: Использование метода slice()

```javascript
const str = "JavaScript is a very absurd programming language.";

// с индекса 28 до конца
console.log(str.slice(28)); // 'programming language.'

// с индекса 4 до 14
console.log(str.slice(4, 15)); // 'Script is a'
```

Вывод в консоль:

```
programming language.
Script is a
```

### Пример 1: Использование метода slice() с отрицательными индексами

Если `beginIndex` или `endIndex` отрицательные, то значения отсчитываются от обратного. Например, **-1** представляет последний элемент, **-2** - предпоследний элемент и так далее.

```javascript
const str = "JavaScript is a very absurd programming language.";

// с 9-го по последний элемент до конца
console.log(str.slice(-9)); // 'language.'

// от 9-го к последнему элементу до 2-го к последнему элементу
console.log(str.slice(-9, -1)); // 'language'
```

Вывод в консоль:

```
language.
language
```

Понимание метода `slice()` – важный элемент в арсенале JavaScript разработчика. Но для создания сложных веб-приложений, вам потребуется знание не только отдельных методов, но и принципов объектно-ориентированного программирования, работы с DOM и асинхронного кода. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-slice-v-javascript) вы получите все необходимые знания. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
