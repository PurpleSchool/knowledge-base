---
metaTitle: codePointAt() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод codePointAt() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод codePointAt() - JavaScript
preview: Метод codePointAt() возвращает целое число, обозначающее значение Unicode позиции символа в строке...
---

Метод `codePointAt()` возвращает целое число, обозначающее значение Unicode позиции символа в строке.

```javascript
let message = "Happy Birthday";

// unicode позиция символа с индексом 1
let codePoint1 = message.codePointAt(1);

console.log("Кодовая позиция Unicode для «a» равна " + codePoint1);

// Вывод в консоль:
// Кодовая позиция Unicode для «a» равна 97
```

## Синтаксис codePointAt()

Синтаксис метода `codePointAt()` следующий:

```javascript
str.codePointAt(pos);
```

Где `str` - это строка.

Изучение метода `codePointAt()` позволяет получить кодовую точку символа в строке. Для уверенной работы с этим методом и эффективной обработки сложных символов Unicode необходимо понимание продвинутых концепций JavaScript. Если вы хотите детальнее погрузиться в продвинутые знания языка — приходите на наш большой курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-codepointat-javascript). На курсе 196 уроков и 18 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры codePointAt()

Метод `codePointAt()` принимает:

- `pos` - значение индекса элемента в `str`.

## Возвращаемое значение codePointAt()

Метод `codePointAt()` возвращает:

- число, представляющее значение unicode позиции для символа в данной `pos`.
- `undefined`, если по индексу `pos` не найден элемент.

## Примеры

### Пример 1: Использование метода codePointAt()

```javascript
let fruit = "Apple";

// кодовая позиция unicode символа А
let codePoint = fruit.codePointAt(0);

console.log("Кодовая позиция unicode символа А " + codePoint);
```

Вывод в консоль:

```
Кодовая позиция unicode символа А равна 65
```

В приведенном выше примере мы используем метод `codePointAt()` для поиска кодовой позиции unicode символа `'A'`.

`'A'` - это первый элемент строки, и поскольку индексация строки начинается с **0**, мы передали методу параметр **0**. Код `fruit.codePointAt(0)` возвращает кодовую позицию unicode символа `'A'`, которая равна **65**.

> **Примечание:** Кодовая позиция unicode - это числовое значение для каждого символа, которое определяется международным стандартом. Например, unicode значение для буквы A - 65, B - 66, C - 67 и так далее.

### Пример 2: codePointAt() с параметром по умолчанию

```javascript
let message = "Happy Birthday";

// без передачи параметра в codePointAt()
let codePoint = message.codePointAt();

console.log(codePoint);

// передача 0 в качестве параметра
let codePoint0 = message.codePointAt(0);

console.log(codePoint0);
```

Вывод в консоль:

```
72
72
```

В приведенном выше примере, поскольку мы не передали ни одного параметра в `charPointAt()`, значение по умолчанию будет равно **0**.

Поэтому метод возвращает кодовую позицию Unicode символа с индексом **0**, т.е. **72**.

### Пример 3: codePointAt() со значением индекса вне диапазона

```javascript
let message = "Happy Birthday";

// получение unicode позиции символа с индексом 53
let codePoint53 = message.codePointAt(53);

console.log(codePoint53);
```

Вывод в консоль:

```
undefined
```

В приведенном выше примере мы использовали метод `codePointAt()` для доступа к unicode позиции символа с индексом **53**.

Однако в строке `"Happy Birthday"` нет символа с индексом **53**. Следовательно, `message.codePointAt(53)` возвращает `undefined`.

Понимание работы с кодовыми точками и их представлением в JavaScript необходимо для создания современных веб-приложений, поддерживающих различные языки и символы. Чтобы углубить свои знания и узнать о других продвинутых методах работы со строками, посетите наш курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-codepointat-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в продвинутый JavaScript прямо сегодня.
