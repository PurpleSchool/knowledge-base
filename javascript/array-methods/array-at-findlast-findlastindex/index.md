---
metaTitle: "Array.at, findLast, findLastIndex в JavaScript"
metaDescription: "Разбираем новые методы массивов JavaScript: Array.at(), findLast() и findLastIndex() — синтаксис, примеры и отличия от устаревших подходов."
author: "Антон Ларичев"
title: "Array.at, findLast, findLastIndex — новые методы массивов"
preview: "Как удобно обращаться к последним элементам массива и искать с конца — разбираем Array.at, findLast и findLastIndex с практическими примерами."
---

## Зачем появились новые методы

Исторически JavaScript не предоставлял удобного способа обратиться к последнему элементу массива или выполнить поиск с конца. Разработчики использовали конструкции вроде `arr[arr.length - 1]` или `arr.slice(-1)[0]`, что многословно и легко приводит к ошибкам. В 2022 году в стандарт ECMAScript были добавлены три метода, которые закрывают эти пробелы: `Array.at()`, `Array.findLast()` и `Array.findLastIndex()`.

Все три метода поддерживаются во всех актуальных браузерах и в Node.js начиная с версии 16.9 (для `at`) и 18.0 (для `findLast` / `findLastIndex`).

---

## Array.at()

### Синтаксис

```javascript
array.at(index)
```

Метод принимает целочисленный индекс и возвращает элемент массива по этой позиции. Ключевое отличие от обычной индексации через квадратные скобки — поддержка отрицательных индексов.

- `0` — первый элемент
- `-1` — последний элемент
- `-2` — предпоследний элемент
- и так далее

Если индекс выходит за пределы массива, метод возвращает `undefined`.

### Примеры

```javascript
const fruits = ['яблоко', 'банан', 'вишня', 'манго', 'апельсин'];

console.log(fruits.at(0));   // 'яблоко'
console.log(fruits.at(2));   // 'вишня'
console.log(fruits.at(-1));  // 'апельсин'
console.log(fruits.at(-2));  // 'манго'
console.log(fruits.at(10));  // undefined
```

### Сравнение со старыми подходами

```javascript
const items = [10, 20, 30, 40, 50];

// Старый способ — получить последний элемент
const lastOld = items[items.length - 1]; // 50

// Альтернатива через slice
const lastSlice = items.slice(-1)[0]; // 50

// Современный способ
const lastNew = items.at(-1); // 50

// Старый способ — получить второй с конца
const secondLastOld = items[items.length - 2]; // 40

// Современный способ
const secondLastNew = items.at(-2); // 40
```

`Array.at()` значительно лаконичнее, особенно когда нужно обратиться к нескольким элементам с конца или когда массив передаётся через цепочку вызовов.

### Практический пример: история браузера

```javascript
function getBrowserHistory() {
  return [
    { url: 'https://example.com', title: 'Example' },
    { url: 'https://github.com', title: 'GitHub' },
    { url: 'https://developer.mozilla.org', title: 'MDN' },
    { url: 'https://nodejs.org', title: 'Node.js' },
  ];
}

const history = getBrowserHistory();

// Текущая страница (последняя в истории)
console.log(history.at(-1).title); // 'Node.js'

// Предыдущая страница
console.log(history.at(-2).title); // 'MDN'
```

### Метод at() работает не только с массивами

Метод `at()` определён в прототипе не только `Array`, но и `String` и `TypedArray`:

```javascript
const str = 'Привет';
console.log(str.at(0));  // 'П'
console.log(str.at(-1)); // 'т'

const typedArr = new Int32Array([100, 200, 300]);
console.log(typedArr.at(-1)); // 300
```

---

## Array.findLast()

### Синтаксис

```javascript
array.findLast(callback(element, index, array))
```

Метод работает аналогично `Array.find()`, но перебирает элементы в обратном порядке — с конца к началу. Возвращает первый найденный элемент, удовлетворяющий условию, или `undefined`, если ничего не найдено.

### Примеры

```javascript
const numbers = [5, 12, 8, 130, 44, 7, 130, 2];

// Найти последний элемент, превышающий 100
const lastLarge = numbers.findLast(n => n > 100);
console.log(lastLarge); // 130 (элемент с индексом 6, не 3)

// Найти последнее чётное число
const lastEven = numbers.findLast(n => n % 2 === 0);
console.log(lastEven); // 2

// Ничего не найдено
const notFound = numbers.findLast(n => n > 1000);
console.log(notFound); // undefined
```

### Сравнение с find() + reverse()

До появления `findLast()` разработчики нередко использовали следующий подход:

```javascript
const numbers = [5, 12, 8, 130, 44, 7, 130, 2];

// Старый способ — ОПАСНЫЙ: reverse() мутирует исходный массив!
const lastLargeOld = numbers.reverse().find(n => n > 100);
console.log(lastLargeOld); // 130
console.log(numbers); // [2, 130, 7, 44, 130, 8, 12, 5] — массив изменён!

// Безопасный старый вариант через spread, но многословный
const lastLargeSafe = [...numbers].reverse().find(n => n > 100);

// Современный способ — без мутации и лаконично
const lastLargeNew = numbers.findLast(n => n > 100);
```

`findLast()` не изменяет исходный массив и не требует его копирования.

### Практический пример: лог событий

```javascript
const eventLog = [
  { type: 'info', message: 'Приложение запущено', timestamp: 1700000000 },
  { type: 'error', message: 'Ошибка подключения к БД', timestamp: 1700000060 },
  { type: 'info', message: 'Переподключение...', timestamp: 1700000120 },
  { type: 'error', message: 'Таймаут запроса', timestamp: 1700000180 },
  { type: 'info', message: 'Соединение восстановлено', timestamp: 1700000240 },
];

// Получить последнюю ошибку
const lastError = eventLog.findLast(event => event.type === 'error');
console.log(lastError.message); // 'Таймаут запроса'
console.log(lastError.timestamp); // 1700000180
```

### Практический пример: работа с версиями

```javascript
const releases = [
  { version: '1.0.0', stable: true },
  { version: '1.1.0', stable: true },
  { version: '2.0.0-beta', stable: false },
  { version: '2.0.0-rc1', stable: false },
  { version: '1.2.0', stable: true },
  { version: '2.0.0-rc2', stable: false },
];

// Последний стабильный релиз
const latestStable = releases.findLast(r => r.stable);
console.log(latestStable.version); // '1.2.0'
```

---

## Array.findLastIndex()

### Синтаксис

```javascript
array.findLastIndex(callback(element, index, array))
```

Работает так же, как `findLast()`, но возвращает не сам элемент, а его индекс в исходном массиве. Если элемент не найден, возвращает `-1` — аналогично `findIndex()`.

### Примеры

```javascript
const numbers = [5, 12, 8, 130, 44, 7, 130, 2];

// Найти индекс последнего элемента, превышающего 100
const lastLargeIndex = numbers.findLastIndex(n => n > 100);
console.log(lastLargeIndex); // 6

// Убедимся, что это правильный элемент
console.log(numbers[lastLargeIndex]); // 130

// Элемент не найден — возвращает -1
const notFoundIndex = numbers.findLastIndex(n => n > 1000);
console.log(notFoundIndex); // -1
```

### Разница между findLast и findLastIndex

```javascript
const tasks = [
  { id: 1, status: 'done', title: 'Написать тесты' },
  { id: 2, status: 'pending', title: 'Сделать ревью' },
  { id: 3, status: 'done', title: 'Задеплоить' },
  { id: 4, status: 'pending', title: 'Обновить документацию' },
  { id: 5, status: 'done', title: 'Закрыть задачи' },
];

// findLast вернёт сам объект задачи
const lastDoneTask = tasks.findLast(t => t.status === 'done');
console.log(lastDoneTask); // { id: 5, status: 'done', title: 'Закрыть задачи' }

// findLastIndex вернёт позицию в массиве
const lastDoneIndex = tasks.findLastIndex(t => t.status === 'done');
console.log(lastDoneIndex); // 4

// Индекс можно использовать для операций с позицией
// Например, вставить новый элемент после последней выполненной задачи
const newTask = { id: 6, status: 'pending', title: 'Новая задача' };
const updatedTasks = [
  ...tasks.slice(0, lastDoneIndex + 1),
  newTask,
  ...tasks.slice(lastDoneIndex + 1),
];
```

### Практический пример: поиск последнего вхождения в строках

```javascript
const lines = [
  'import React from "react";',
  'import { useState } from "react";',
  'import styles from "./App.module.css";',
  '',
  'function App() {',
  '  return <div>Hello</div>;',
  '}',
];

// Найти индекс последней строки импорта
const lastImportIndex = lines.findLastIndex(line => line.startsWith('import'));
console.log(lastImportIndex); // 2

// Вставить новый импорт после всех существующих
const newImport = 'import axios from "axios";';
lines.splice(lastImportIndex + 1, 0, newImport);
console.log(lines[3]); // 'import axios from "axios";'
```

---

## Совместное использование методов

Методы хорошо сочетаются друг с другом и с другими инструментами массивов.

### Пример: анализ транзакций

```javascript
const transactions = [
  { id: 1, amount: 500, type: 'credit', date: '2024-01-10' },
  { id: 2, amount: 200, type: 'debit', date: '2024-01-11' },
  { id: 3, amount: 1500, type: 'credit', date: '2024-01-12' },
  { id: 4, amount: 100, type: 'debit', date: '2024-01-13' },
  { id: 5, amount: 3000, type: 'credit', date: '2024-01-14' },
  { id: 6, amount: 800, type: 'debit', date: '2024-01-15' },
];

// Последняя транзакция
const latestTransaction = transactions.at(-1);
console.log(latestTransaction.date); // '2024-01-15'

// Последнее зачисление
const lastCredit = transactions.findLast(t => t.type === 'credit');
console.log(lastCredit.amount); // 3000

// Индекс последнего крупного списания (больше 500)
const lastLargeDebitIndex = transactions.findLastIndex(
  t => t.type === 'debit' && t.amount > 500
);
console.log(lastLargeDebitIndex); // 5
console.log(transactions[lastLargeDebitIndex].amount); // 800
```

### Пример: работа с DOM-узлами

```javascript
const listItems = Array.from(document.querySelectorAll('li'));

// Последний активный элемент списка
const lastActive = listItems.findLast(item =>
  item.classList.contains('active')
);

if (lastActive) {
  lastActive.scrollIntoView();
}

// Индекс последнего выделенного элемента
const lastSelectedIndex = listItems.findLastIndex(item =>
  item.classList.contains('selected')
);
console.log(`Последний выбранный элемент на позиции: ${lastSelectedIndex}`);
```

---

## Поддержка и полифилы

Поддержка всех трёх методов в актуальных средах:

- Chrome 92+ (at), Chrome 97+ (findLast / findLastIndex)
- Firefox 90+ (at), Firefox 104+ (findLast / findLastIndex)
- Safari 15.4+ (at), Safari 15.4+ (findLast / findLastIndex)
- Node.js 16.9+ (at), Node.js 18.0+ (findLast / findLastIndex)

Если нужна поддержка старых окружений, можно добавить полифил вручную:

```javascript
if (!Array.prototype.at) {
  Array.prototype.at = function (index) {
    const normalized = index >= 0 ? index : this.length + index;
    return this[normalized];
  };
}

if (!Array.prototype.findLast) {
  Array.prototype.findLast = function (callback) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (callback(this[i], i, this)) {
        return this[i];
      }
    }
    return undefined;
  };
}

if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function (callback) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (callback(this[i], i, this)) {
        return i;
      }
    }
    return -1;
  };
}
```

Либо использовать core-js:

```bash
npm install core-js
```

```javascript
import 'core-js/actual/array/at';
import 'core-js/actual/array/find-last';
import 'core-js/actual/array/find-last-index';
```

---

## Итоги

Три новых метода дополняют стандартный инструментарий работы с массивами:

- `Array.at(index)` — доступ к элементу по индексу с поддержкой отрицательных значений. Заменяет громоздкую запись `arr[arr.length - n]`.
- `Array.findLast(callback)` — поиск последнего элемента, удовлетворяющего условию. Работает как `find()`, но с конца массива и без мутации.
- `Array.findLastIndex(callback)` — то же самое, но возвращает индекс, а не сам элемент. Возвращает `-1`, если ничего не найдено.

Все три метода не мутируют исходный массив, что соответствует принципу неизменяемости данных и делает код более предсказуемым.

Для изучения JavaScript с нуля до профессионального уровня и освоения всех современных возможностей языка смотрите курс на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=array-at-findlast-findlastindex