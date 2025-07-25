---
metaTitle: Метод .includes() в JavaScript
metaDescription: Разбираемся как работает метод .includes() в JavaScript
author: Дмитрий Нечаев
title: Метод .includes() в JavaScript
preview: Учимся пользоваться методом .includes() в JavaScript. Разбираем примеры использования
---

Метод `includes()` в JavaScript предоставляет простой способ проверить наличие элемента в массиве или подстроки в строке. Этот метод возвращает логическое значение `true`, если элемент или подстрока найдены, и `false`, если нет. Давайте рассмотрим работу этого метода более подробно.

### Синтаксис

```jsx
array.includes(searchElement[, fromIndex])

```

- `searchElement`: Элемент или подстрока, которую мы ищем в массиве или строке.
- `fromIndex` (опциональный): Начальный индекс, с которого начинается поиск. Если не указан, поиск начинается с индекса 0.

### Проверка наличия элемента в массиве

Давайте рассмотрим пример использования метода `includes()` для проверки наличия элемента в массиве.

```jsx
const numbers = [1, 2, 3, 4, 5];

// Проверка наличия элемента 3 в массиве
const includesThree = numbers.includes(3);
console.log(includesThree); // Выведет: true

```

Если элемент не найден, метод `includes()` вернет `false`.

```jsx
const includesTen = numbers.includes(10);
console.log(includesTen); // Выведет: false

```

Метод `.includes()` позволяет проверить, содержит ли строка указанную подстроку. Это удобный и простой способ для выполнения поиска в строках в JavaScript. Чтобы эффективно использовать этот и другие методы, необходимо понимать основы работы со строками и типами данных. Если вы хотите детальнее погрузиться в особенности работы со строками и другими типами данных в JavaScript — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=metod-includes-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Проверка наличия подстроки в строке

Метод `includes()` также может использоваться для проверки наличия подстроки в строке.

```jsx
const str = "JavaScript - это потрясающий язык программирования";

// Проверка наличия подстроки "потрясающий" в строке
const includesSubstring = str.includes("потрясающий");
console.log(includesSubstring); // Выведет: true

```

### Указание начального индекса для поиска

Метод `includes()` также позволяет указать начальный индекс, с которого начнется поиск.

```jsx
const str = "JavaScript - это потрясающий язык программирования";

// Проверка наличия подстроки "потрясающий" начиная с индекса 20
const includesSubstring = str.includes("потрясающий", 20);
console.log(includesSubstring); // Выведет: false, так как подстрока не найдена после индекса 20

```

### Использование метода includes() в условных выражениях

Метод `includes()` также часто используется в условных выражениях для проверки наличия элемента в массиве или подстроки в строке.

```jsx
const fruits = ["яблоко", "груша", "апельсин"];

if (fruits.includes("груша")) {
  console.log("Груша найдена!");
} else {
  console.log("Груша не найдена!");
}

```

### Заключение

Метод `includes()` в JavaScript является удобным инструментом для проверки наличия элемента в массиве или подстроки в строке. Он предоставляет простой и эффективный способ выполнить эту задачу и улучшить читаемость вашего кода. Понимание работы этого метода поможет вам легко и уверенно использовать его в ваших скриптах.

`.includes()` - это лишь один из многих инструментов, доступных для работы со строками в JavaScript. Чтобы уверенно использовать все возможности языка и создавать сложные приложения, необходимо понимание фундаментальных концепций. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=metod-includes-v-javascript) вы найдете все необходимое для построения прочного фундамента знаний. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
