---
metaTitle: "Promise.withResolvers в JavaScript | PurpleSchool"
metaDescription: "Как использовать Promise.withResolvers() в JavaScript: синтаксис, практические примеры с событиями, очередями и WebSocket. ES2024."
author: "Антон Ларичев"
title: "Promise.withResolvers — создание промисов с внешним управлением"
preview: "Разбираемся с новым статическим методом Promise.withResolvers() из ES2024: для чего он нужен и как упрощает работу с асинхронным кодом"
---

## Что такое Promise.withResolvers

`Promise.withResolvers()` — статический метод, добавленный в спецификацию ECMAScript 2024. Он позволяет создать промис вместе с его функциями `resolve` и `reject`, возвращая их единым объектом. Это решает распространённую задачу: управлять промисом из-за пределов колбэка конструктора.

## Проблема, которую решает метод

До появления `Promise.withResolvers` разработчики использовали паттерн «deferred» — объявляли переменные для `resolve` и `reject` снаружи конструктора:

```javascript
let resolve, reject;
const promise = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});
```

Код работает, но многословен и неочевиден: переменные объявлены как `let`, хотя после первого присваивания никогда не меняются. Часто разработчики оборачивали это в вспомогательную функцию `createDeferred()`. `Promise.withResolvers()` встраивает эту логику прямо в стандарт.

## Синтаксис и возвращаемое значение

```javascript
const { promise, resolve, reject } = Promise.withResolvers();
```

Метод не принимает аргументов и возвращает объект с тремя свойствами:

- `promise` — новый объект `Promise` в состоянии `pending`
- `resolve` — функция перевода промиса в состояние `fulfilled`
- `reject` — функция перевода промиса в состояние `rejected`

## Базовые примеры

### Разрешение промиса извне

```javascript
const { promise, resolve } = Promise.withResolvers();

setTimeout(() => resolve('Данные загружены'), 1000);

promise.then(value => console.log(value)); // "Данные загружены"
```

### Отклонение промиса

```javascript
const { promise, reject } = Promise.withResolvers();

setTimeout(() => reject(new Error('Ошибка сети')), 500);

promise.catch(err => console.error(err.message)); // "Ошибка сети"
```

## Практические сценарии

### Ожидание события

Паттерн особенно полезен при работе с EventEmitter или DOM-событиями, где промис нужно разрешить из обработчика:

```javascript
function waitForEvent(emitter, eventName) {
  const { promise, resolve, reject } = Promise.withResolvers();

  emitter.once(eventName, resolve);
  emitter.once('error', reject);

  return promise;
}

// Node.js EventEmitter
const stream = fs.createReadStream('file.txt');
await waitForEvent(stream, 'end');
console.log('Файл прочитан');
```

```javascript
// DOM-событие
function waitForClick(element) {
  const { promise, resolve } = Promise.withResolvers();
  element.addEventListener('click', resolve, { once: true });
  return promise;
}

const button = document.querySelector('#submit');
await waitForClick(button);
console.log('Кнопка нажата');
```

### Отменяемый запрос

`Promise.withResolvers` упрощает реализацию операций с возможностью отмены:

```javascript
function createCancellableRequest(url) {
  const { promise, resolve, reject } = Promise.withResolvers();
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(response => response.json())
    .then(resolve)
    .catch(reject);

  return {
    promise,
    cancel: () => {
      controller.abort();
      reject(new Error('Запрос отменён'));
    }
  };
}

const { promise, cancel } = createCancellableRequest('https://api.example.com/data');

const timeout = setTimeout(cancel, 3000);

promise
  .then(data => {
    clearTimeout(timeout);
    console.log('Данные:', data);
  })
  .catch(err => console.error(err.message));
```

### Очередь задач

При построении очереди с контролируемым выполнением каждая задача возвращает промис, который разрешается по завершении:

```javascript
class TaskQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  enqueue(task) {
    const { promise, resolve, reject } = Promise.withResolvers();
    this.queue.push({ task, resolve, reject });

    if (!this.processing) {
      this.process();
    }

    return promise;
  }

  async process() {
    this.processing = true;

    while (this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();

      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }
}

const queue = new TaskQueue();

const r1 = queue.enqueue(() => fetchUserData(1));
const r2 = queue.enqueue(() => fetchUserData(2));
const r3 = queue.enqueue(() => fetchUserData(3));

// Задачи выполняются последовательно, результаты доступны параллельно
const [user1, user2, user3] = await Promise.all([r1, r2, r3]);
```

### WebSocket с запрос-ответ

При двусторонней связи через WebSocket каждый отправленный запрос ожидает конкретный ответ по идентификатору:

```javascript
class WebSocketClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.pending = new Map();

    this.socket.addEventListener('message', (event) => {
      const { id, data, error } = JSON.parse(event.data);

      if (this.pending.has(id)) {
        const { resolve, reject } = this.pending.get(id);
        this.pending.delete(id);

        if (error) {
          reject(new Error(error));
        } else {
          resolve(data);
        }
      }
    });
  }

  send(payload) {
    const id = crypto.randomUUID();
    const { promise, resolve, reject } = Promise.withResolvers();

    this.pending.set(id, { resolve, reject });
    this.socket.send(JSON.stringify({ id, ...payload }));

    return promise;
  }
}

const client = new WebSocketClient('wss://api.example.com/ws');
const user = await client.send({ type: 'getUser', userId: 42 });
console.log('Пользователь:', user);
```

### Тайм-аут для произвольного промиса

```javascript
function withTimeout(promise, ms) {
  const { promise: timeoutPromise, reject } = Promise.withResolvers();

  const timer = setTimeout(
    () => reject(new Error(`Превышено время ожидания: ${ms} мс`)),
    ms
  );

  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise
  ]);
}

try {
  const data = await withTimeout(fetchData(), 5000);
  console.log(data);
} catch (err) {
  console.error(err.message); // "Превышено время ожидания: 5000 мс"
}
```

### Диалог с ожиданием подтверждения

Паттерн полезен, когда нужно дождаться действия пользователя:

```javascript
class ConfirmationDialog {
  constructor() {
    const { promise, resolve, reject } = Promise.withResolvers();
    this.promise = promise;
    this._resolve = resolve;
    this._reject = reject;
  }

  confirm() {
    this._resolve(true);
  }

  cancel() {
    this._resolve(false);
  }

  dismiss() {
    this._reject(new Error('Диалог закрыт принудительно'));
  }
}

const dialog = new ConfirmationDialog();
showModal('Удалить файл?', {
  onConfirm: () => dialog.confirm(),
  onCancel: () => dialog.cancel(),
  onDismiss: () => dialog.dismiss(),
});

const confirmed = await dialog.promise;
if (confirmed) {
  await deleteFile();
}
```

## Сравнение с традиционным подходом

**До ES2024 — вспомогательная функция:**

```javascript
function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const { promise, resolve, reject } = createDeferred();
```

**ES2024 — встроенный метод:**

```javascript
const { promise, resolve, reject } = Promise.withResolvers();
```

Функциональность идентична. Встроенный метод не требует вспомогательного кода и сразу понятен читателю, знакомому со стандартом.

## Совместимость и полифилл

Метод поддерживается в актуальных окружениях:

- Chrome 119+
- Firefox 121+
- Safari 17.4+
- Node.js 22+

Для более старых окружений достаточно простого полифилла:

```javascript
if (!Promise.withResolvers) {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
```

## Важные нюансы

### Промис разрешается только один раз

Как и в обычном промисе, первый вызов `resolve` или `reject` фиксирует итоговое состояние. Все последующие вызовы игнорируются:

```javascript
const { promise, resolve, reject } = Promise.withResolvers();

resolve('первое значение');
resolve('второе значение'); // игнорируется
reject(new Error('ошибка')); // тоже игнорируется

promise.then(v => console.log(v)); // "первое значение"
```

### Промис может остаться в pending навсегда

Если не вызвать ни `resolve`, ни `reject`, промис останется в состоянии `pending`. Это приводит к утечкам памяти, поэтому важно предусмотреть все пути завершения, включая обработку ошибок:

```javascript
function loadData(url) {
  const { promise, resolve, reject } = Promise.withResolvers();

  fetch(url)
    .then(r => r.json())
    .then(resolve)
    .catch(reject); // без этой строки промис зависнет при ошибке fetch

  return promise;
}
```

### resolve и reject можно передавать как колбэки

Функции не привязаны к контексту вызова, поэтому их можно передавать напрямую туда, где ожидается колбэк:

```javascript
const { promise, resolve } = Promise.withResolvers();

// Прямая передача как колбэк — без обёртки в стрелочную функцию
setTimeout(resolve, 1000, 'готово');

promise.then(console.log); // "готово"
```

## Заключение

`Promise.withResolvers()` — небольшое, но ценное дополнение к стандартному API. Метод устраняет необходимость в самодельных вспомогательных функциях и делает код с «внешним» управлением промисом чище и понятнее. Сценарии применения широки: ожидание событий, построение очередей, реализация WebSocket-клиентов, добавление тайм-аутов. Везде, где промис нужно разрешить из кода, внешнего по отношению к исполнителю задачи, этот метод — правильный инструмент.

Для глубокого изучения промисов, async/await и всей асинхронной модели JavaScript приглашаем на курс PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=promise-with-resolvers