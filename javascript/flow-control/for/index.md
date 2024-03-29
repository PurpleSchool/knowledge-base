---
metaTitle: for – JavaScript Flow Control - Управление потоком в JS
metaDescription: Подробное описание цикла for в JS. Рассмотрим синтаксис и конкретные примеры использования цикла for в javascript | База знаний PurpleSchool
author: Виталий Котов
title: Цикл for в JavaScript - примеры, условия, break, continue
preview: В JavaScript циклы используются для повторения блока кода...
---

В JavaScript циклы используются для повторения блока кода.

Например, если нужно показать сообщение 100 раз, можно использовать цикл. Это всего лишь простой пример; с помощью циклов можно добиться гораздо большего.

Синтаксис цикла `for` следующий:

```javascript
for (initialExpression; condition; updateExpression) {
  // тело цикла
}
```

1.  **initialExpression** инициализирует и/или объявляет переменные и выполняется только один раз.
2.  Оценивание **condition** (условие).
    - Если условие - `false`, цикл `for` завершается.
    - Если условие - `true`, выполняется блок кода внутри цикла `for`.
3.  Выражение **updateExpression** обновляет значение **initialExpression**, когда условие равно `true`.
4.  **condition** (условие) оценивается снова. Этот процесс продолжается до тех пор, пока условие не станет `false`.

### Пример 1: Вывести текст пять раз

```javascript
// программа для вывода текста на консоль 5 раз
const n = 5;

// цикл от i = 1 до 5
for (let i = 1; i <= n; i++) {
  console.log(`Я люблю JavaScript.`);
}
```

**Вывод в консоль:**

```
Я люблю JavaScript.
Я люблю JavaScript.
Я люблю JavaScript.
Я люблю JavaScript.
Я люблю JavaScript.
```

### Пример 2: Вывод чисел от 1 до 5

```javascript
// программа для вывода чисел от 1 до 5
const n = 5;

// цикл от i = 1 до 5
// на каждой итерации i увеличивается на 1
for (let i = 1; i <= n; i++) {
  console.log(i); // вывод на консоль значения i
}
```

**Вывод в консоль:**

```
1
2
3
4
5
```

### Пример 3: Вывод суммы n натуральных чисел

```javascript
// программа для вывода суммы натуральных чисел
let sum = 0;
const n = 100;

// цикл от i = 1 до n
// на каждой итерации i увеличивается на 1
for (let i = 1; i <= n; i++) {
  sum += i; // sum = sum + i
}

console.log('сумма:', sum);
```

**Вывод в консоль:**

```
сумма: 5050
```

Здесь значение `sum` изначально равно **0**. Затем выполняется итерация цикла `for` от `i = 1 до 100`. На каждой итерации `i` добавляется к `sum` и ее значение увеличивается на **1**.

Когда **i** станет равным **101**, условие проверки станет `false` и `sum` будет равна `0 + 1 + 2 + ... + 100`.

## Бесконечный цикл for

Если условие проверки в цикле `for` всегда `true`, он будет работать вечно (пока не заполнится память). Например,

```javascript
// бесконечный цикл
for (let i = 1; i > 0; i++) {
  // тело цикла
}
```

В приведенной выше программе условие всегда `true`, что приведет к выполнению кода бесконечное число раз.

## Цикл for или while

Цикл `for` обычно используется, когда известно количество итераций. Например:

```javascript
// этот цикл итерируется 5 раз
for (let i = 1; i <= 5; ++i) {
  // тело цикла
}
```

Циклы `while` и `do...while` обычно используются, когда количество итераций неизвестно. Например:

```javascript
while (condition) {
  // тело цикла
}
```
