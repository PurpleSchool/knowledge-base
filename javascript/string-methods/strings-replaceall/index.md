---
metaTitle: replaceAll() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод replaceAll() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод replaceAll() - JavaScript
preview: Метод replaceAll() возвращает новую строку, в которой все совпадения шаблона заменены на replacement...
---

Метод `replaceAll()` возвращает новую строку, в которой все совпадения шаблона заменены на `replacement`.

```javascript
const message = "ball bat";

// замена всех вхождений b на c
let result = message.replaceAll("b", "c");
console.log(result);

// Вывод в консоль: call cat
```

## Синтаксис replaceAll()

Синтаксис метода `replaceAll()` следующий:

```javascript
str.replaceAll(pattern, replacement);
```

Где `str` - это строка.

## Параметры replaceAll()

Метод `replaceAll()` принимает:

- `pattern` - либо подстрока, либо регулярное выражение, которое должно быть заменено.
- `replacement` - `pattern` заменяется на `replacement` (может быть строкой или функцией).

## Возвращаемое значение replaceAll()

Метод `replaceAll()` возвращает новую строку, в которой все совпадения шаблона заменены заменой.

> **Примечание:** регулярное выражение без глобального флага ("**g**") выдаст ошибку `TypeError`.

## Примеры

### Пример 1: Использование метода replaceAll()

```javascript
const text = "Java is awesome. Java is fun.";

// передача строки в качестве первого параметра
let pattern = "Java";
let new_text = text.replaceAll(pattern, "JavaScript");
console.log(new_text);

// передача регулярного выражения в качестве первого параметра
pattern = /Java/g;
new_text = text.replaceAll(pattern, "JavaScript");
console.log(new_text);
```

Вывод в консоль:

```
JavaScript is awesome. JavaScript is fun
JavaScript is awesome. JavaScript is fun.
```

### Замена без учета верхнего/нижнего регистра

Метод `replaceAll()` чувствителен к регистру. Чтобы выполнить замену без учета регистра, необходимо использовать regex с ключом `i` (поиск без учета регистра).

#### Пример 2: Замена без учета регистра

```javascript
const text = "javaSCRIPT JavaScript";

// все вхождения javascript заменены
let pattern = /javascript/gi; // глобальный поиск без учета регистра
let new_text = text.replaceAll(pattern, "JS");
console.log(new_text); // JS JS
```

Вывод в консоль:

```
JS JS
```

#### Пример 3: Передача функции в качестве замены

Вы также можете передать функцию (вместо строки) в качестве второго параметра в метод `replaceAll()`.

```javascript
const text = "3.1415";

// генерирация случайного числа от 0 до 9
function generateRandomDigit() {
  return Math.floor(Math.random() * 10);
}

// регулярное выражение для сопоставления с цифрой
const pattern = /\d/g;
const new_text = text.replaceAll(pattern, generateRandomDigit);
console.log(new_text);
```

Вывод в консоль:

```
4.3518
```

При запуске этой программы вы можете получить разные результаты. Это связано с тем, что первая цифра в `text` заменяется случайной цифрой от **0** до **9**.
