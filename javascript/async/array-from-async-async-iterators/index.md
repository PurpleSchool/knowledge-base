---
metaTitle: "Array.fromAsync и асинхронные итераторы в JavaScript"
metaDescription: "Как работает Array.fromAsync в JavaScript, зачем нужны асинхронные итераторы и как применять их в реальных задачах с примерами кода."
author: "Антон Ларичев"
title: "Array.fromAsync и асинхронные итераторы в JavaScript"
preview: "Разбираем Array.fromAsync — новый статический метод для сбора данных из асинхронных источников в массив, и протокол async iterable."
---

## Зачем понадобился Array.fromAsync

Метод `Array.from` давно стал привычным инструментом: он превращает любой итерируемый объект или псевдомассив в настоящий массив. Но у него есть принципиальное ограничение — он работает только с синхронными источниками данных.

Когда данные поступают асинхронно — из потока, пагинированного API, базы данных или файловой системы — `Array.from` не подходит. Приходилось писать вспомогательные функции или собирать элементы вручную через `for await...of`.

`Array.fromAsync` закрывает этот пробел. Метод появился в стандарте ES2024 и позволяет собрать значения из асинхронного итерируемого объекта в массив одной строкой.

## Протокол асинхронного итератора

Прежде чем разбирать `Array.fromAsync`, важно понять, что такое асинхронный итератор и как устроен протокол.

### Синхронный итератор для сравнения

Синхронный итератор — это объект с методом `next()`, который возвращает `{ value, done }`:

```javascript
const range = {
  [Symbol.iterator]() {
    let i = 0;
    return {
      next() {
        return i < 3
          ? { value: i++, done: false }
          : { value: undefined, done: true };
      },
    };
  },
};

console.log([...range]); // [0, 1, 2]
```

### Асинхронный итератор

Асинхронный итератор устроен аналогично, но метод `next()` возвращает **промис**, который разрешается в `{ value, done }`:

```javascript
const asyncRange = {
  [Symbol.asyncIterator]() {
    let i = 0;
    return {
      async next() {
        // имитируем задержку, как при запросе к API
        await new Promise((resolve) => setTimeout(resolve, 100));
        return i < 3
          ? { value: i++, done: false }
          : { value: undefined, done: true };
      },
    };
  },
};
```

Ключ — символ `Symbol.asyncIterator`. Именно его наличие делает объект **async iterable** (асинхронно итерируемым). Такие объекты можно обходить через `for await...of`:

```javascript
for await (const value of asyncRange) {
  console.log(value); // 0, 1, 2 — с задержкой 100 мс между значениями
}
```

## Array.fromAsync: базовое использование

Синтаксис полностью повторяет `Array.from`:

```javascript
Array.fromAsync(asyncIterable);
Array.fromAsync(asyncIterable, mapFn);
Array.fromAsync(asyncIterable, mapFn, thisArg);
```

Метод возвращает промис, разрешающийся в массив:

```javascript
const result = await Array.fromAsync(asyncRange);
console.log(result); // [0, 1, 2]
```

## Практические примеры

### Сбор данных из пагинированного API

Реальный сценарий — обход нескольких страниц API и сбор всех записей в один массив:

```javascript
async function* fetchPages(baseUrl) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${baseUrl}?page=${page}&limit=10`);
    const data = await response.json();

    yield* data.items;

    hasMore = data.hasNextPage;
    page++;
  }
}

// собираем все товары из всех страниц в один массив
const allProducts = await Array.fromAsync(fetchPages('/api/products'));
console.log(allProducts.length); // все товары
```

Без `Array.fromAsync` пришлось бы писать вручную:

```javascript
const allProducts = [];
for await (const product of fetchPages('/api/products')) {
  allProducts.push(product);
}
```

`Array.fromAsync` делает то же самое, но декларативно и лаконично.

### Асинхронный генератор с обработкой файлов

```javascript
const { createReadStream } = require('fs');
const readline = require('readline');

async function* readLines(filePath) {
  const fileStream = createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });

  for await (const line of rl) {
    yield line;
  }
}

// читаем все строки файла в массив
const lines = await Array.fromAsync(readLines('./data.csv'));
const rows = lines.map((line) => line.split(','));
```

### Трансформация значений через mapFn

Второй аргумент `Array.fromAsync` — функция-маппер, аналогичная `Array.from`. Важная особенность: маппер может быть **асинхронным**:

```javascript
async function* userIds() {
  yield 1;
  yield 2;
  yield 3;
}

// для каждого id делаем отдельный запрос
const users = await Array.fromAsync(userIds(), async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

console.log(users);
// [{id: 1, name: '...'}, {id: 2, name: '...'}, {id: 3, name: '...'}]
```

Здесь запросы выполняются **последовательно**: следующий id обрабатывается только после завершения предыдущего. Это поведение соответствует `for await...of` и гарантирует порядок элементов.

### Работа с Web Streams API

`ReadableStream` в браузере реализует протокол асинхронного итератора, поэтому его можно передать напрямую:

```javascript
async function fetchJSON(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  // собираем чанки потока в массив
  const chunks = await Array.fromAsync(
    response.body,
    (chunk) => decoder.decode(chunk)
  );

  return JSON.parse(chunks.join(''));
}
```

### Синхронный итерируемый объект с промисами

`Array.fromAsync` умеет работать не только с async iterable, но и с **синхронным итерируемым объектом промисов**. Он автоматически дождётся разрешения каждого промиса:

```javascript
const promises = [
  fetch('/api/users').then((r) => r.json()),
  fetch('/api/posts').then((r) => r.json()),
  fetch('/api/comments').then((r) => r.json()),
];

// аналог Promise.all, но последовательный, а не параллельный
const [users, posts, comments] = await Array.fromAsync(promises);
```

Важное отличие от `Promise.all`: промисы **не выполняются параллельно** — каждый следующий ожидается только после предыдущего. Для параллельных запросов используйте `Promise.all`.

## Создание собственного async iterable объекта

Рассмотрим реалистичный пример: класс для пагинированных запросов к базе данных.

```javascript
class DatabaseCursor {
  constructor(query, pageSize = 100) {
    this.query = query;
    this.pageSize = pageSize;
    this.offset = 0;
    this.done = false;
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  async next() {
    if (this.done) {
      return { value: undefined, done: true };
    }

    const rows = await db.query(
      `${this.query} LIMIT ${this.pageSize} OFFSET ${this.offset}`
    );

    if (rows.length === 0) {
      this.done = true;
      return { value: undefined, done: true };
    }

    this.offset += rows.length;

    // если строк меньше pageSize — это последняя страница
    if (rows.length < this.pageSize) {
      this.done = true;
    }

    return { value: rows, done: false };
  }
}

// использование
const cursor = new DatabaseCursor('SELECT * FROM orders WHERE status = $active');
const pages = await Array.fromAsync(cursor);
const allOrders = pages.flat();
```

## Асинхронные генераторы как async iterable

Асинхронные генераторные функции (`async function*`) — самый удобный способ создавать async iterable объекты. Они автоматически реализуют протокол `Symbol.asyncIterator`.

```javascript
async function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    yield a;
    [a, b] = [b, a + b];
  }
}

// взять первые 10 чисел Фибоначчи
async function take(asyncIterable, n) {
  const result = [];
  for await (const value of asyncIterable) {
    result.push(value);
    if (result.length >= n) break;
  }
  return result;
}

const first10 = await take(fibonacci(), 10);
console.log(first10); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

Для конечных генераторов `Array.fromAsync` работает напрямую:

```javascript
async function* take(asyncIterable, n) {
  let count = 0;
  for await (const value of asyncIterable) {
    if (count++ >= n) return;
    yield value;
  }
}

const first10 = await Array.fromAsync(take(fibonacci(), 10));
```

## Обработка ошибок

Если в процессе итерации возникает ошибка, промис, возвращённый `Array.fromAsync`, отклоняется:

```javascript
async function* unstableSource() {
  yield 1;
  yield 2;
  throw new Error('Соединение прервано');
  yield 3; // никогда не будет достигнуто
}

try {
  const data = await Array.fromAsync(unstableSource());
} catch (error) {
  console.error(error.message); // 'Соединение прервано'
}
```

При необходимости обрабатывайте частичные результаты через `for await...of` с `try/catch` внутри цикла.

## Array.fromAsync против for await...of

Оба подхода решают схожие задачи, но имеют разные сильные стороны:

```javascript
// Array.fromAsync — когда нужен готовый массив
const items = await Array.fromAsync(source, transform);
const filtered = items.filter(predicate);

// for await...of — когда нужна обработка на лету или ранний выход
for await (const item of source) {
  if (shouldStop(item)) break;
  process(item);
}
```

Выбирайте `Array.fromAsync`, когда:
- нужен финальный массив для последующей обработки через `filter`, `map`, `reduce`
- объём данных заранее ограничен и помещается в память
- важна читаемость и декларативность кода

Выбирайте `for await...of`, когда:
- нужен ранний выход при выполнении условия
- данные обрабатываются потоково, без накопления в памяти
- требуется сложная логика с `continue` или `break`

## Поддержка и полифиллы

`Array.fromAsync` входит в ES2024 и поддерживается в:
- Chrome 121+
- Firefox 115+
- Safari 16.4+
- Node.js 22+

Для старых окружений можно использовать полифилл или написать утилиту самостоятельно:

```javascript
if (!Array.fromAsync) {
  Array.fromAsync = async function (source, mapFn, thisArg) {
    const result = [];
    for await (let value of source) {
      if (mapFn) {
        value = await mapFn.call(thisArg, value);
      }
      result.push(value);
    }
    return result;
  };
}
```

## Итог

`Array.fromAsync` заполняет логичный пробел в стандартной библиотеке JavaScript: теперь есть симметрия между `Array.from` для синхронных источников и `Array.fromAsync` для асинхронных.

Ключевые моменты:
- принимает async iterable (объекты с `Symbol.asyncIterator`) и синхронные итерируемые объекты промисов
- возвращает промис, разрешающийся в массив
- поддерживает асинхронный маппер вторым аргументом
- обрабатывает элементы последовательно, сохраняя порядок
- при ошибке в генераторе промис отклоняется

Асинхронные итераторы — мощный примитив для работы с потоковыми, пагинированными или ленивыми источниками данных. Освоив их вместе с `Array.fromAsync`, вы получаете выразительный и стандартный способ работы с асинхронными коллекциями.

Чтобы глубже разобраться в асинхронном JavaScript, промисах, генераторах и современных API, пройдите курс на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=array-from-async