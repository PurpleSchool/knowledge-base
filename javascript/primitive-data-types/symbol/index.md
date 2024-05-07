---
metaTitle: Symbol в JavaScript
metaDescription: Разбираемся как работает Symbol в JavaScript
author: Дмитрий Нечаев
title: Symbol в JavaScript
preview: Учимся пользоваться Symbol в JavaScript. Разбираем примеры использования
---

В JavaScript символы (Symbol) представляют собой примитивный тип данных, который используется для создания уникальных идентификаторов. Они были добавлены в ECMAScript 6 (ES6) и предоставляют уникальные значения, которые не равны ни одному другому значению, включая другие символы. Давайте рассмотрим, как использовать символы и их особенности.

### Создание символов

Символы создаются с помощью глобальной функции `Symbol()`. Каждый символ, созданный этой функцией, уникален.

```jsx
const symbol1 = Symbol();
const symbol2 = Symbol();

console.log(symbol1 === symbol2); // Выведет: false, потому что символы уникальны

```

### Описание символа

Для создания описания (description) символа можно передать строку в функцию `Symbol()`.

```jsx
const symbol = Symbol("Описание символа");
console.log(symbol); // Выведет: Symbol(Описание символа)

```

### Использование символов

Символы часто используются в качестве имен свойств объектов, чтобы гарантировать их уникальность.

```jsx
const firstName = Symbol("Имя");
const person = {};

person[firstName] = "John";
console.log(person[firstName]); // Выведет: John

```

### Символы и for...in

Символы не участвуют в итерации с помощью цикла `for...in`.

```jsx
const symbol = Symbol();
const obj = { [symbol]: "value" };

for (let key in obj) {
  console.log(key); // Ничего не выведет, так как символы не участвуют в итерации
}

```

### Глобальные символы

Глобальные символы создаются с помощью метода `Symbol.for()`. Если символ с указанным именем уже существует, он будет возвращен, в противном случае новый символ будет создан.

```jsx
const globalSymbol1 = Symbol.for("globalSymbol");
const globalSymbol2 = Symbol.for("globalSymbol");

console.log(globalSymbol1 === globalSymbol2); // Выведет: true, потому что символы с одинаковым именем равны

```

### Встроенные символы

JavaScript также предоставляет ряд встроенных символов, доступных через глобальные свойства, такие как `Symbol.iterator`, `Symbol.match`, `Symbol.toPrimitive` и другие.

```jsx
const arr = [1, 2, 3];
const iterator = arr[Symbol.iterator]();

console.log(iterator.next()); // Выведет: { value: 1, done: false }
console.log(iterator.next()); // Выведет: { value: 2, done: false }
console.log(iterator.next()); // Выведет: { value: 3, done: false }
console.log(iterator.next()); // Выведет: { value: undefined, done: true }

```

### Заключение

Символы в JavaScript представляют собой уникальные идентификаторы, которые используются для обеспечения уникальности имен свойств объектов. Они полезны во многих сценариях программирования, где требуется гарантировать уникальность идентификаторов. Использование символов улучшает безопасность и читаемость кода, а также предотвращает конфликты имен в приложениях.