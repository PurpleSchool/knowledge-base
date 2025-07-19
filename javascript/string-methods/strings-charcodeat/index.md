---
metaTitle: charCodeAt() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод charCodeAt() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод charCodeAt() - JavaScript
preview: Метод charCodeAt() возвращает целое число от 0 до 65535, представляющее кодовую единицу UTF-16 с заданным индексом...
---

Метод `charCodeAt()` возвращает целое число от **0** до **65535**, представляющее кодовую единицу UTF-16 с заданным индексом.

```javascript
// объявление строки
const greeting = "Good morning!";

// Единица кода UTF-16 символа с индексом 5
let result = greeting.charCodeAt(5);

console.log(result);

// Вывод в консоль: 109
```

## Синтаксис charCodeAt()

Синтаксис метода `charCodeAt()` следующий:

```javascript
str.charCodeAt(index);
```

Где `str` - это строка.

Метод `charCodeAt()` предоставляет возможность узнать Unicode-значение символа в строке. Для глубокого понимания работы этого метода и обработки сложных символов необходимо знание продвинутых концепций JavaScript, таких как работа с кодировками и символьными наборами. Если вы хотите детальнее погрузиться в продвинутые знания языка — приходите на наш большой курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-charcodeat-javascript). На курсе 196 уроков и 18 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры charCodeAt()

Метод `charCodeAt()` принимает:

- `index` — целое число от **0** до **(str.length — 1)**.

> **Примечание:** `str.length` возвращает длину заданной строки.

## Возвращаемое значение charCodeAt()

Возвращает число, представляющее значение кодовой единицы UTF-16 символа по заданному индексу.

> **Примечания**:
>
> - Метод `charCodeAt()` всегда возвращает значение меньшее 65 536.
> - Если точка Unicode не может быть представлена в одной единице кода UTF-16 (значения больше 0xFFFF), то возвращается первая часть пары для этой точки кода.

## Примеры

### Пример 1: Использование метода charCodeAt()

```javascript
const greeting = "Good morning!";

// Единица кода UTF-16 символа с индексом 5
let result1 = greeting.charCodeAt(5);

console.log(result1);

// Единица кода UTF-16 символа с индексом 5.2
let result2 = greeting.charCodeAt(5.2);

console.log(result2);

// Единица кода UTF-16 символа с индексом 5.9
let result3 = greeting.charCodeAt(5.9);

console.log(result3);
```

Вывод в консоль:

```
109
109
109
```

В приведенном выше примере мы используем метод `charCodeAt()` для доступа к кодовой единице UTF-16 символа с индексом **5**.

Поскольку символ, присутствующий в индексе **5**, - это `"m"`, метод возвращает кодовую единицу UTF-16 символа `"m"`.

Аналогично, для нецелых индексов **5.2** и **5.9** числа преобразуются в ближайшее целое значение, т.е. **5**, поэтому метод снова возвращает кодовую единицу UTF-16 символа `"m"`, т.е. **109**.

### Пример 2: Метод charCodeAt() с индексом вне диапазона

```javascript
const greeting = "Good morning!";

// передача индекса, превышающего длину строки
let result3 = greeting.charCodeAt(18);

console.log(result3);

// передача неотрицательного значения индекса
let result4 = greeting.charCodeAt(-9);

console.log(result4);
```

Вывод в консоль:

```
NaN
NaN
```

В приведенном выше примере мы создали строку `"Good morning!"`.

Здесь оба кода `greeting.charCodeAt(18)` и `greeting.charCodeAt(-9)` возвращают `NaN`, потому что индексы **18** и **-9** отсутствуют в данной строке.

### Пример 3: charCodeAt() с параметром по умолчанию

```javascript
const greeting = "Good morning!";

// без передачи параметра в charCodeAt()
let result1 = greeting.charCodeAt();

console.log(result1);

// передача 0 в качестве параметра
let result2 = greeting.charCodeAt(0);

console.log(result2);
```

Вывод в консоль:

```
71
71
```

В приведенном выше примере, поскольку мы не передали ни одного параметра в `charCodeAt()`, значение по умолчанию будет равно **0**.

Поэтому метод возвращает единицу кода UTF-16 символа с индексом **0**, т.е. **71**.

Понимание Unicode-значений символов важно для эффективной работы со строками и создания многоязычных приложений в JavaScript. Для углубления знаний в этой области и изучения других продвинутых техник, посетите наш курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-charcodeat-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в продвинутый JavaScript прямо сегодня.
