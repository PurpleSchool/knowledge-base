---
metaTitle: replace() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод replace() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод replace() - JavaScript
preview: Метод replace() возвращает новую строку с заменой указанной строки/регулярного выражения...
---

Метод `replace()` возвращает новую строку с заменой указанной строки/регулярного выражения.

```javascript
const message = "ball bat";

// замена первой b на c
let result = message.replace("b", "c");
console.log(result);

// Вывод в консоль: call bat
```

## Синтаксис replace()

Синтаксис метода `replace()` следующий:

```javascript
str.replace(pattern, replacement);
```

Где `str` - это строка.

## Параметры replace()

Метод `replace()` принимает:

- `pattern` - либо строка, либо регулярное выражение, которое необходимо заменить.
- replacement - `pattern` заменяется на `replacement` (может быть строкой или функцией).

## Возвращаемое значение replace()

Метод `replace()` возвращает новую строку с замененным указанным шаблоном.

## Примеры

### Пример 1: Замена первого вхождения

```javascript
const text = "Java is awesome. Java is fun.";

// передача строки в качестве первого параметра
let pattern = "Java";
let new_text = text.replace(pattern, "JavaScript");
console.log(new_text);

// передача регулярного выражения в качестве первого параметра
pattern = /Java/;
new_text = text.replace(pattern, "JavaScript");
console.log(new_text);
```

Вывод в консоль:

```
JavaScript is awesome. Java is fun.
JavaScript is awesome. Java is fun.
```

В обоих методах `replace()` первое вхождение `Java` заменяется на `JavaScript`.

### Пример 2: Замена всех вхождений

Чтобы заменить все вхождения `pattern`, необходимо использовать регулярное выражение с ключом `g` (глобальный поиск). Например, `/Java/g` вместо `/Java/`.

```javascript
const text = "Java is awesome. Java is fun.";

// обратите внимание на ключ g в шаблоне регулярного выражения
const pattern = /Java/g;
const new_text = text.replace(pattern, "JavaScript");
console.log(new_text);
```

Вывод в консоль:

```
JavaScript is awesome. JavaScript is fun.
```

Здесь метод `replace()` заменяет оба вхождения `Java` на `JavaScript`.

### Замена без учета верхнего/нижнего регистра

Метод `replace()` чувствителен к регистру. Чтобы выполнить замену без учета регистра, необходимо использовать регулярное выражение с ключом `i` (поиск без учета регистра).

#### Пример 3: Замена без учета регистра

```javascript
const text = "javaSCRIPT JavaScript";

// первое вхождение javascript заменено
let pattern = /javascript/i; // поиск без учета регистра
let new_text = text.replace(pattern, "JS");
console.log(new_text); // JS JavaScript

// все вхождения javascript заменяются
pattern = /javascript/gi; // глобальный поиск без учета регистра
new_text = text.replace(pattern, "JS");
console.log(new_text); // JS JS
```

Вывод в консоль:

```
JS JavaScript
JS JS
```

#### Пример 4: Передача функции в качестве replacement

Вы также можете передать функцию (вместо строки) в качестве второго параметра в метод `replace()`.

```javascript
const text = "Random digit: 3";

// генерация случайной цифры от 0 до 9
function generateRandomDigit() {
  return Math.floor(Math.random() * 10);
}

// регулярное выражение для сопоставления с цифрой
const pattern = /\d/;

const new_text = text.replace(pattern, generateRandomDigit);
console.log(new_text);
```

Вывод в консоль:

```
Random digit: 8
```

При запуске этой программы вы можете получить разные результаты. Это связано с тем, что первая цифра в `text` заменяется случайной цифрой от **0** до **9**.
