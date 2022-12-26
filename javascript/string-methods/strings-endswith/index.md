---
metaTitle: endsWith() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод endsWith() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод endsWith() - JavaScript
preview: Метод endsWith() возвращает true, если строка заканчивается указанной строкой. Если нет, метод возвращает false...
---

Метод `endsWith()` возвращает `true`, если строка заканчивается указанной строкой. Если нет, метод возвращает `false`.

```javascript
// объявление строки
let sentence = "Java is to JavaScript what Car is to Carpet.";

// проверка, заканчивается ли заданная строка словами "to Carpet".
let check = sentence.endsWith("to Carpet.");

console.log(check);

// Вывод в консоль:
// true
```

## Синтаксис endsWith()

Синтаксис метода `endsWith()` следующий:

```javascript
str.endsWith(searchString, length);
```

Где `str` - это строка.

## Параметры endsWith()

Метод `endsWith()` принимает:

- `searchString` - cтрока, которую нужно искать в конце `str`.
- `length` (необязательно) - используется как длина строки `str`, в которой производится поиск `SearchString`. Значение по умолчанию - `str.length`.

## Возвращаемое значение endsWith()

Метод `endswith()` возвращает:

- `true` - если заданные символы найдены в конце строки.
- `false` - если заданные символы не найдены в конце строки.

## Примеры

### Пример 1: Использование метода endsWith()

```javascript
// объявление строки
let sentence = "JavaScript is fun";

// проверка, заканчивается ли данная строка на "fun"
let check = sentence.endsWith("fun");

console.log(check);

// проверка, заканчивается ли данная строка на "is"
let check1 = sentence.endsWith("is");

console.log(check1);
```

Вывод в консоль:

```
true
false
```

В приведенном выше примере мы используем метод `endsWith()`, чтобы проверить, заканчивается ли `sentence` указанной строкой или нет.

Поскольку строка `"JavaScript is fun"` заканчивается на `"fun"`, `sentence.endsWith("fun")` возвращает `true`.

`sentence.endsWith("is")` возвращает `false`, так как заданная строка не заканчивается на `"is"`.

### Пример 2: endsWith() для строк с учетом регистра

Метод `endsWith()` чувствителен к регистру. Например,

```javascript
// объявление строки
let sentence = "JavaScript is fun";

// проверка, заканчивается ли заданная строка словом "fun"
let check = sentence.endsWith("fun");

console.log(check);

// проверка, заканчивается ли заданная строка на "Fun"
let check1 = sentence.endsWith("Fun");

console.log(check1);
```

Вывод в консоль:

```
true
false
```

Здесь мы проверяем, заканчивается ли `sentence` на `"fun"` или `"Fun"`.

Поскольку метод `endsWith()` чувствителен к регистру, он рассматривает `"fun"` и `"Fun"` как две разные строки. Поэтому метод возвращает `true` для **"fun"** и `false` для **"Fun"**.

### Пример 3: endsWith() с двумя параметрами

Метод `endsWith()` чувствителен к регистру. Например,

```javascript
let sentence = "JavaScript is fun";

// второй аргумент определяет часть строки, которую необходимо учесть
let check = sentence.endsWith("JavaScript", 10);

console.log(check);
```

Вывод в консоль:

```
true
```

В приведенном выше примере мы указываем часть строки, которую нужно учитывать при проверке заданной строки `searchString` с помощью метода `endsWith()`.

Мы передали два аргумента, `"JavaScript"` и `10`, где `"JavaScript"` указывает на строку для поиска, а `10` - на часть строки, которую нужно учитывать.

Метод проверяет, заканчиваются ли первые **10** символов строки на `"JavaScript"`, и возвращает `true`.
