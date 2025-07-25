---
metaTitle: Boolean в JavaScript
metaDescription: Разбираемся как работает Boolean в JavaScript
author: Дмитрий Нечаев
title: Boolean в JavaScript
preview: Учимся пользоваться Boolean в JavaScript. Разбираем примеры использования
---

Булев тип данных в JavaScript представляет собой логическое значение, которое может быть только двух видов: `true` (истина) или `false` (ложь). Он используется для выполнения логических операций и управления потоком выполнения программы. Давайте рассмотрим основные аспекты работы с булевым типом в JavaScript.

### Создание булевых значений

Булевы значения могут быть явно указаны в коде или могут быть результатом выполнения логических операций.

```jsx
const isTrue = true; // истина
const isFalse = false; // ложь

const isGreater = 10 > 5; // результат будет true
const isEqual = 10 === 5; // результат будет false

```

Boolean (булевский) тип данных в JavaScript представляет собой логическое значение: `true` (истина) или `false` (ложь). Эти значения играют ключевую роль в условных операторах и логических выражениях. Если вы хотите детальнее погрузиться в фундаментальные знания JavaScript, получить системное понимание языка и научиться применять его на практике — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=boolean-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Логические операторы

В JavaScript есть несколько логических операторов, которые могут использоваться для создания или проверки булевых значений.

- `&&` (логическое "И"): возвращает `true`, если оба операнда истинны.
- `||` (логическое "ИЛИ"): возвращает `true`, если хотя бы один из операндов истинен.
- `!` (логическое "НЕ"): возвращает `true`, если операнд ложен, и наоборот.

```jsx
const x = 10;
const y = 5;

const resultAnd = x > 5 && y < 10; // будет true, так как оба условия истинны
const resultOr = x === 5 || y === 10; // будет false, так как ни одно из условий не истинно
const resultNot = !(x === y); // будет true, так как условие ложно

```

### Использование в условных операторах

Булевые значения часто используются в условных операторах, таких как `if`, `else if` и `else`.

```jsx
const age = 20;

if (age >= 18) {
  console.log("Вы совершеннолетний");
} else {
  console.log("Вы несовершеннолетний");
}

```

### Преобразование в булев тип

Некоторые значения могут быть преобразованы в булев тип с помощью оператора `Boolean()` или двойного отрицания `!!`.

```jsx
console.log(Boolean("hello")); // true
console.log(!!0); // false

```

### Заключение

Булев тип данных в JavaScript является важным инструментом для выполнения логических операций и управления потоком выполнения программы. Понимание основ работы с булевыми значениями позволяет писать более структурированный и эффективный код, который легко читать и поддерживать.

Boolean значения – основа логики в программировании. Умение правильно использовать их позволяет создавать гибкие и масштабируемые решения. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=boolean-v-javascript) вы научитесь работать с булевскими значениями в JavaScript, использовать их в условных операторах (`if`, `else`), логических операциях (`&&`, `||`, `!`) и тернарных выражениях. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
