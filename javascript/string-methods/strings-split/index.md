---
metaTitle: split() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод split() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод split() - JavaScript
preview: Метод split() делит строку на список подстрок и возвращает их в виде массива...
---

Метод `split()` делит строку на список подстрок и возвращает их в виде массива.

```javascript
const message = "JavaScript::is::fun";

// разделяет строку message на ::
let result = message.split("::");
console.log(result);

// Вывод в консоль: [ 'JavaScript', 'is', 'fun' ]
```

## Синтаксис split()

Синтаксис метода `split()` следующий:

```javascript
str.split(separator, limit);
```

Где `str` - это строка.

Метод `split()` разбивает строку на массив подстрок, используя указанный разделитель. Это мощный инструмент для обработки текста и извлечения данных. Чтобы эффективно использовать `split()`, необходимо понимать, как работают массивы и строки в JavaScript. Если вы хотите детальнее погрузиться в особенности работы со строками и массивами в JavaScript — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-split-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры split()

Метод split() принимает:

- `separator` (необязательно) - шаблон (строка или регулярное выражение), описывающий, где должно происходить каждое разделение.
- `limit` (необязательно) - неотрицательное целое число, ограничивающее количество частей, на которые нужно разделить заданную строку.

## Возвращаемое значение split()

Возвращает `Array` строк, разделенных в каждой точке, где в данной строке встречается разделитель.

> **Примечание:** метод `split()` не изменяет исходную строку.

## Примеры

### Пример 1: Использование метода split()

```javascript
console.log("ABCDEF".split("")); // [ 'A', 'B', 'C', 'D', 'E', 'F' ]

const text = "Java is awesome. Java is fun.";

let pattern = ".";
let newText = text.split(pattern);
console.log(newText); // [ 'Java is awesome', ' Java is fun', '' ]

let pattern1 = ".";
let newText1 = text.split(pattern1, 2);
console.log(newText1); // [ 'Java is awesome', ' Java is fun' ]

const text2 = "JavaScript ;  Python ;C;C++";
let pattern2 = ";";
let newText2 = text2.split(pattern2);
console.log(newText2); // [ 'JavaScript ', '  Python ', 'C', 'C++' ]

// использование регулярного выражения
let pattern3 = /\s*(?:;|$)\s*/;
let newText3 = text2.split(pattern3);
console.log(newText3); // [ 'JavaScript', 'Python', 'C', 'C++' ]
```

Вывод в консоль:

```
[ 'A', 'B', 'C', 'D', 'E', 'F' ]
[ 'Java is awesome', ' Java is fun', '' ]
[ 'Java is awesome', ' Java is fun' ]
[ 'JavaScript ', '  Python ', 'C', 'C++' ]
[ 'JavaScript', 'Python', 'C', 'C++' ]
```

> **Примечание:** если разделитель является регулярным выражением с захватывающими круглыми скобками, то каждый раз, когда разделитель совпадает, результаты захватывающих круглых скобок вставляются в выходной массив.

Умение разбивать строки на части с помощью `split()` открывает множество возможностей. Однако, чтобы полностью раскрыть потенциал JavaScript, вам потребуется освоить и другие концепции, такие как функции, объекты и работа с DOM. Только тогда вы сможете создавать по-настоящему интерактивные и динамичные веб-приложения. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-split-v-javascript) вы получите комплексные знания. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
