---
metaTitle: "Async-генераторы в JavaScript — полное руководство"
metaDescription: "Async-генераторы в JavaScript: синтаксис, for await...of, пагинация API, обработка потоков и пайплайны. Примеры кода и практические кейсы."
author: "Антон Ларичев"
title: "Async-генераторы в JavaScript"
preview: "Разбираемся, что такое async-генераторы, как работает протокол асинхронной итерации и где применять их на практике."
---

## Что такое async-генераторы

Async-генераторы объединяют два механизма языка: генераторы и async/await. Обычный генератор позволяет лениво производить последовательность значений через `yield`. Async-генератор добавляет к этому возможность ожидать асинхронные операции внутри тела функции.

Если обычный генератор возвращает синхронный итератор, то async-генератор возвращает асинхронный итератор — объект, метод `next()` которого возвращает `Promise`. Async-генераторы появились в спецификации ES2018 вместе с протоколом асинхронной итерации.

## Синтаксис

Async-генератор объявляется с помощью ключевых слов `async function*`:

```javascript
async function* asyncGenerator() {
  yield 1;
  yield 2;
  yield 3;
}
```

Внутри async-генератора можно использовать как `yield`, так и `await`:

```javascript
async function* fetchPages(url) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${url}?page=${page}`);
    const data = await response.json();

    yield data.items;

    hasMore = data.hasNextPage;
    page++;
  }
}
```

## Сравнение с обычными генераторами

Чтобы понять разницу, рассмотрим оба варианта рядом.

Обычный генератор производит синхронные значения:

```javascript
function* syncGenerator() {
  yield 1;
  yield 2;
}

const gen = syncGenerator();
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: undefined, done: true }
```

Async-генератор оборачивает каждое значение в промис:

```javascript
async function* asyncGen() {
  yield 1;
  yield 2;
}

const asyncIterator = asyncGen();
asyncIterator.next().then(console.log); // { value: 1, done: false }
asyncIterator.next().then(console.log); // { value: 2, done: false }
asyncIterator.next().then(console.log); // { value: undefined, done: true }
```

Ключевое отличие: `next()` у async-генератора всегда возвращает `Promise<{ value, done }>`, даже если `yield` производит синхронное значение.

## Перебор с помощью for await...of

Самый удобный способ работы с async-генераторами — цикл `for await...of`. Он автоматически ожидает каждый промис и извлекает значение:

```javascript
async function* countdown(from) {
  while (from > 0) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield from--;
  }
}

async function main() {
  for await (const value of countdown(5)) {
    console.log(value); // 5, 4, 3, 2, 1 — с паузой в 1 секунду
  }
}

main();
```

`for await...of` работает с любым объектом, реализующим протокол асинхронной итерации — то есть имеющим метод `[Symbol.asyncIterator]`. Он также совместим с обычными итерируемыми объектами: массивами, строками, `Map`, `Set`.

## Практические примеры

### Пагинация API

Один из самых распространённых кейсов — загрузка данных постранично. Async-генератор абстрагирует логику пагинации, и вызывающий код работает с данными как с единым потоком:

```javascript
async function* fetchAllUsers(apiUrl) {
  let cursor = null;

  do {
    const url = cursor ? `${apiUrl}?cursor=${cursor}` : apiUrl;

    const response = await fetch(url);
    const { users, nextCursor } = await response.json();

    for (const user of users) {
      yield user;
    }

    cursor = nextCursor;
  } while (cursor !== null);
}

async function printAllUsers() {
  for await (const user of fetchAllUsers('/api/users')) {
    console.log(user.name);
  }
}
```

Вызывающий код не знает ничего о пагинации. Следующий HTTP-запрос отправляется только тогда, когда данные текущей страницы полностью обработаны.

### Чтение потоков данных

Async-генераторы хорошо сочетаются с Web Streams API для построчной обработки больших ответов:

```javascript
async function* streamLines(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      if (buffer.length > 0) yield buffer;
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // незавершённая строка остаётся в буфере

    for (const line of lines) {
      if (line.trim()) yield line;
    }
  }
}

async function processLog(url) {
  for await (const line of streamLines(url)) {
    if (line.includes('ERROR')) {
      console.error('Found error:', line);
    }
  }
}
```

### Опрос (polling) внешнего API

Async-генераторы удобны для периодической проверки статуса долгой операции:

```javascript
async function* pollJobStatus(jobId, interval = 2000) {
  while (true) {
    const response = await fetch(`/api/jobs/${jobId}`);
    const job = await response.json();

    yield job;

    if (job.status === 'completed' || job.status === 'failed') {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

async function waitForJob(jobId) {
  for await (const job of pollJobStatus(jobId)) {
    console.log(`Job status: ${job.status}`);

    if (job.status === 'completed') {
      console.log('Result:', job.result);
      break;
    }

    if (job.status === 'failed') {
      throw new Error(`Job failed: ${job.error}`);
    }
  }
}
```

## Обработка ошибок

Ошибки в async-генераторах обрабатываются стандартными средствами.

### Обработка внутри генератора

```javascript
async function* safeDataFetcher(urls) {
  for (const url of urls) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      yield await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error.message);
      // Продолжаем с следующим URL
    }
  }
}
```

### Обработка снаружи через for await...of

```javascript
async function* numberGenerator() {
  yield 1;
  throw new Error('Something went wrong');
  yield 2; // никогда не выполнится
}

async function main() {
  try {
    for await (const num of numberGenerator()) {
      console.log(num); // выведет 1, затем пробросится ошибка
    }
  } catch (error) {
    console.error('Caught:', error.message); // 'Something went wrong'
  }
}
```

### Метод throw()

Можно передать ошибку в генератор извне через метод `throw()`:

```javascript
async function* resilientGenerator() {
  try {
    while (true) {
      const item = await fetchNextItem();
      yield item;
    }
  } catch (error) {
    console.log('Generator received error:', error.message);
    yield 'fallback value';
  }
}

const gen = resilientGenerator();
await gen.next();                        // нормальное продолжение
await gen.throw(new Error('abort'));     // передаём ошибку внутрь
```

## Досрочное завершение и очистка ресурсов

При раннем выходе из `for await...of` через `break` или `return` среда выполнения автоматически вызывает метод `return()` генератора. Блок `finally` гарантированно выполняется при любом способе завершения:

```javascript
async function* infiniteCounter() {
  let i = 0;
  try {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 100));
      yield i++;
    }
  } finally {
    console.log('Cleanup: releasing resources');
    // Здесь закрываем соединения, отменяем запросы и т.д.
  }
}

async function main() {
  for await (const value of infiniteCounter()) {
    console.log(value);

    if (value >= 4) {
      break; // вызывает gen.return(), что триггерит finally
    }
  }
  // Выведет: 0, 1, 2, 3, 4, затем 'Cleanup: releasing resources'
}
```

## Реализация протокола асинхронной итерации в классах

Любой класс может реализовать асинхронную итерацию, определив метод `[Symbol.asyncIterator]`:

```javascript
class PaginatedResource {
  constructor(url) {
    this.url = url;
  }

  async *[Symbol.asyncIterator]() {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${this.url}?page=${page}`);
      const { items, totalPages } = await response.json();

      for (const item of items) {
        yield item;
      }

      hasMore = page < totalPages;
      page++;
    }
  }
}

const products = new PaginatedResource('/api/products');

for await (const product of products) {
  console.log(product.name);
}
```

## Построение пайплайнов

Async-генераторы хорошо компонуются: выход одного можно передать на вход другому, строя пайплайны обработки данных:

```javascript
async function* generateNumbers(count) {
  for (let i = 1; i <= count; i++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    yield i;
  }
}

async function* filter(iterable, predicate) {
  for await (const value of iterable) {
    if (predicate(value)) {
      yield value;
    }
  }
}

async function* map(iterable, transform) {
  for await (const value of iterable) {
    yield transform(value);
  }
}

async function collect(iterable) {
  const results = [];
  for await (const value of iterable) {
    results.push(value);
  }
  return results;
}

async function main() {
  const numbers = generateNumbers(10);
  const evens = filter(numbers, n => n % 2 === 0);
  const doubled = map(evens, n => n * 2);

  const result = await collect(doubled);
  console.log(result); // [4, 8, 12, 16, 20]
}

main();
```

Каждый этап обрабатывает элементы по одному, без загрузки всего набора данных в память.

## Сравнение с Promise.all

Важно понимать, когда async-генераторы — правильный выбор, а когда лучше подходит `Promise.all`.

```javascript
// Promise.all — параллельно, всё сразу
async function fetchAllAtOnce(ids) {
  return Promise.all(
    ids.map(id => fetch(`/api/items/${id}`).then(r => r.json()))
  );
}

// Async-генератор — последовательно, по одному
async function* fetchLazily(ids) {
  for (const id of ids) {
    const response = await fetch(`/api/items/${id}`);
    yield await response.json();
  }
}
```

`Promise.all` выполняет все запросы параллельно — это быстрее, но всё держится в памяти одновременно. Async-генератор обрабатывает элементы последовательно и позволяет начать работу с первым результатом до получения остальных.

Async-генераторы подходят, когда:
- Данных много и их нельзя держать в памяти одновременно
- Нужна ленивая загрузка — следующий запрос отправляется только после обработки текущего
- Данные поступают из потока
- Нужна абстракция над пагинацией или polling

`Promise.all` предпочтителен, когда:
- Количество элементов невелико
- Важна максимальная параллельность
- Все данные нужны одновременно перед дальнейшей обработкой

## Итог

Async-генераторы — мощный инструмент для работы с асинхронными последовательностями данных. Они избавляют от ручного управления состоянием при пагинации, опросе API и обработке потоков. Ключевые моменты:

- Объявляются через `async function*`, внутри доступны и `yield`, и `await`
- Метод `next()` всегда возвращает `Promise<{ value, done }>`
- Перебираются циклом `for await...of`
- Блок `finally` гарантирует очистку ресурсов при любом способе завершения
- Хорошо компонуются в пайплайны обработки данных

Для углублённого изучения JavaScript и асинхронного программирования рекомендуем курс на PurpleSchool: [JavaScript с нуля до профессионала](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=async-generators)