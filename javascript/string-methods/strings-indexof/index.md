---
metaTitle: indexOf() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод indexOf() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод indexOf() - JavaScript
preview: Метод indexOf() возвращает индекс первого вхождения данной подстроки в строке...
---

Метод `indexOf()` возвращает индекс первого вхождения данной подстроки в строке.

```javascript
const message = "JavaScript is not Java";

// возврат индекса 'v' в первом вхождении 'va'
const index = message.indexOf("va");

console.log("index: " + index); // index: 2
```

## Синтаксис indexOf()

Синтаксис метода `indexOf()` следующий:

```javascript
str.indexOf(searchValue, fromIndex);
```

Где `str` - это строка.

## Параметры indexOf()

Метод `indexOf()` принимает:

- `searchValue` - значение для поиска в строке. Если строка не указана явно, будет искаться значение **"undefined"**.
- `fromIndex` (необязательно) - индекс, с которого начинается поиск. По умолчанию он равен **0**. Если **fromIndex < 0**, поиск начинается с индекса **0**.

## Возвращаемое значение indexOf()

- Возвращает первый индекс значения в строке, если оно присутствует хотя бы один раз.
- Возвращает **-1**, если значение не найдено в строке.

> **Примечание:** метод `indexOf()` чувствителен к регистру.

Для пустой строки `searchValue` и `fromIndex` меньше длины строки, `indexOf` возвращает значение, равное `fromIndex`.

Аналогично, для пустой строки `searchValue` и `fromIndex` превышающей длину строки, `indexOf` возвращает длину строки.

```javascript
"Purpleschool JavaScript".indexOf("", 0); // возвращает 0
"Purpleschool JavaScript".indexOf("", 3); // возвращает 3

// длина строки здесь равна 20
"Purpleschool JavaScript".indexOf("", 25); // возвращает 20
"Purpleschool JavaScript".indexOf("", 21); // возвращает 20
```

## Примеры

### Пример 1: Использование метода indexOf()

```javascript
var str = "JavaScript is the world's most misunderstood programming language.";

// indexOf() возвращает первое вхождение
var index1 = str.indexOf("language");
console.log(index1); // 57

var index2 = str.indexOf("p");
console.log(index2); // 8

// второй аргумент указывает начальный индекс поиска
var index3 = str.indexOf("p", 9);
console.log(index3); // 45

// indexOf возвращает -1, если ничего не найдено
var index4 = str.indexOf("Python");
console.log(index4); // -1
```

Вывод в консоль:

```
57
8
45
-1
```

### Пример 2: Поиск всех вхождений элемента

```javascript
function findAllIndex(string, value) {
  indices = [];
  var currentIndex = string.indexOf(value);
  while (currentIndex != -1) {
    indices.push(currentIndex);
    currentIndex = string.indexOf(value, currentIndex + value.length);
  }
  return indices;
}

var str = "JavaScript is as related to Java as Carpenter is to Carpet.";

var occurance1 = findAllIndex(str, "J");
console.log(occurance1); // [ 0, 28 ]

var occurance2 = findAllIndex(str, "Carpet");
console.log(occurance2); // [ 52 ]

var occurance3 = findAllIndex(str, "x");
console.log(occurance3); // []
```

Вывод в консоль:

```
[ 0, 28 ]
[ 52 ]
[]
```
