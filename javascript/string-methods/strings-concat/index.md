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
