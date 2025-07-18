---
metaTitle: lastIndexOf() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод lastIndexOf() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод lastIndexOf() - JavaScript
preview: Метод lastIndexOf() возвращает последний индекс появления данной подстроки в строке...
---

Метод `lastIndexOf()` возвращает последний индекс появления данной подстроки в строке.

```javascript
// объявление строки
var str = "Programming";

var substr = "g";

// поиск последнего вхождения "g" в строке
var result = str.lastIndexOf(substr);

console.log(result);

// Вывод в консоль: 10
```

## Синтаксис lastIndexOf()

Синтаксис метода `lastIndexOf()` следующий:

```javascript
str.lastIndexOf(searchValue, fromIndex);
```

Где `str` - это строка.

`lastIndexOf()` возвращает индекс последнего вхождения указанной подстроки в строке. Это полезный инструмент для поиска и анализа текста, особенно когда необходимо найти последнее появление определенного символа или слова. Для эффективного использования `lastIndexOf()` необходимо понимать, как работают строки и как использовать индексы для доступа к символам. Если вы хотите детальнее погрузиться в работу со строками и научиться эффективно использовать методы поиска — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-lastindexof-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры lastIndexOf()

Метод lastIndexOf() принимает:

- `substr` - значение для поиска в заданной строке.
- `fromIndex` (необязательно) - индекс, с которого начинается поиск строки в обратном направлении. По умолчанию он равен **+Infinity**.

> **Примечания:**
>
> - Если **fromIndex >= string.length**, то поиск выполняется во всей строке.
> - Если **fromIndex < 0**, то считается, что он равен **0**.

## Возвращаемое значение lastIndexOf()

Метод `lastIndexOf()` возвращает:

- последний индекс значения в строке, если он присутствует хотя бы один раз.
- `fromIndex`, если строка не указана явно.

> **Примечание:** метод возвращает **-1**, если подстрока не найдена в заданной строке.

## Примеры

### Пример 1: Использование метода lastIndexOf()

```javascript
// объявление строки
var str = "Programming";

var substr = "m";

// поиск последнего вхождения «m» в str
var result = str.lastIndexOf(substr);

console.log(result);
```

Вывод в консоль:

```
7
```

В приведенном выше примере мы определили строку с именем `str`. Переменная `substr` содержит `"m"`, которая является подстрокой данной строки.

Метод `lastIndexOf()` определяет индекс последнего вхождения `substr`. Поскольку индексация строки начинается с **0**, `str.lastIndexOf(substr)` возвращает значение **7**.

### Пример 2: lastIndexOf() с двумя параметрами

```javascript
// объявление строки
var str = "Programming";

// объявление подстроки «substr», которая содержит символ «g»
var substr = "g";

var fromIndex = 6;

// передача второго параметра fromIndex в lastIndexOf()
var result = str.lastIndexOf(substr, fromIndex);

console.log(result);
```

Вывод в консоль:

```
3
```

В приведенном выше примере мы передали `fromIndex` в качестве второго параметра. Таким образом, метод `lastIndexOf()` выполняет поиск подстроки в обратном направлении от `fromIndex`.

`str.lastIndexOf(substr,fromIndex)` ищет `"g"` в обратном направлении от индекса `fromIndex` и находит последнее вхождение `"g"`, которое находится в индексе **3**.

### Пример 3: Когда подстрока не найдена

```javascript
var str = "I love JavaScript";

// передача подстроки, которой нет в данной строке
var result = str.lastIndexOf("Python");

console.log(result);
```

Вывод в консоль:

```
-1
```

Здесь мы передали `"Python"` в качестве `substr`. Поскольку `"Python"` не встречается в строке `"I love JavaScript"`, метод возвращает **-1**.

### Пример 4: lastIndexOf() для поиска с учетом регистра

Метод `lastIndexOf()` чувствителен к регистру. Например:

```javascript
var str = "I love JavaScript";

//  lastIndexOf() с "JavaScript" в качестве substr
var result1 = str.lastIndexOf("JavaScript");

console.log(result1);

//  lastIndexOf() с "javaScript" в качестве substr
var result2 = str.lastIndexOf("javaScript");

console.log(result2);
```

Вывод в консоль:

```
7
-1
```

Здесь метод `lastIndexOf()` чувствителен к регистру, поэтому он рассматривает `"JavaScript"` и `"javaScript"` как две разные `substr`.

Метод возвращает значение индекса **7** для `"JavaScript"` и **-1** для `"javaScript"`.

`lastIndexOf()` – это полезный метод для работы со строками, но он лишь часть огромного мира JavaScript. Для создания современных веб-приложений необходимо освоить и другие концепции, такие как работа с DOM, асинхронный код и взаимодействие с сервером. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-lastindexof-v-javascript) вы найдете все необходимые знания и навыки для достижения ваших целей. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
