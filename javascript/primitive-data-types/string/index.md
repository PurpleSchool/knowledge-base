---
metaTitle: Строка в JavaScript
metaDescription: Разбираемся как работает строка в JavaScript
author: Дмитрий Нечаев
title: Строка в JavaScript
preview: Учимся пользоваться строкой в JavaScript. Разбираем примеры использования
---

Строка в JavaScript представляет собой последовательность символов, используемую для представления текстовой информации. В этой статье мы рассмотрим основы работы со строками в JavaScript, включая создание строк, доступ к символам, методы и многое другое.

### Создание строк

Для создания строк в JavaScript можно использовать одинарные, двойные или обратные кавычки.

```jsx
const str1 = 'Привет, мир!'; // Одинарные кавычки
const str2 = "Привет, мир!"; // Двойные кавычки
const str3 = `Привет, мир!`; // Обратные кавычки

```

Обратные кавычки также позволяют использовать шаблонные строки для вставки переменных или выражений.

```jsx
const name = "Миша";
const greeting = `Привет, ${name}!`;
console.log(greeting); // Выведет: Привет, Миша!

```

Строки — один из основных типов данных в JavaScript, используемый для представления текста. Понимание работы со строками, их методами и свойствами необходимо для обработки пользовательского ввода, манипулирования данными и создания динамического контента. Если вы хотите детальнее погрузиться в фундаментальные знания JavaScript, получить системное понимание языка и научиться применять его на практике — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=stroka-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Доступ к символам

Символы в строке нумеруются, начиная с нуля. Мы можем получить доступ к символу по его индексу с помощью квадратных скобок `[]`.

```jsx
const str = "Привет";
console.log(str[0]); // Выведет: П
console.log(str[1]); // Выведет: р

```

### Длина строки

Длину строки можно получить с помощью свойства `.length`.

```jsx
const str = "Привет, мир!";
console.log(str.length); // Выведет: 12

```

### Методы строки

JavaScript предоставляет множество методов для работы со строками. Некоторые из них:

- `toUpperCase()`: Преобразует строку в верхний регистр.
- `toLowerCase()`: Преобразует строку в нижний регистр.
- `charAt()`: Возвращает символ по указанному индексу.
- `indexOf()`: Возвращает индекс первого вхождения подстроки.
- `includes()`: Проверяет, содержит ли строка указанную подстроку.

```jsx
const str = "Привет, мир!";
console.log(str.toUpperCase()); // Выведет: ПРИВЕТ, МИР!
console.log(str.indexOf("мир")); // Выведет: 7
console.log(str.includes("мир")); // Выведет: true

```

### Изменение строк

Строки в JavaScript являются неизменяемыми, что означает, что после создания строки ее содержимое нельзя изменить. Однако, можно создать новую строку на основе существующей.

```jsx
let str = "JavaScript";
str = str.slice(0, 4) + " awesome";
console.log(str); // Выведет: Java awesome

```

### Заключение

Строки являются одним из наиболее важных типов данных в JavaScript и широко используются во многих аспектах разработки веб-приложений. Понимание основ работы с этим типом данных позволяет эффективно манипулировать текстовой информацией и создавать более функциональные и удобочитаемые скрипты. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=stroka-v-javascript) вы научитесь работать со строками в JavaScript, используя различные методы, такие как `substring()`, `indexOf()`, `replace()` и другие. Вы также узнаете о шаблонах строк (template literals) и регулярных выражениях, которые значительно упрощают манипулирование текстом. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
