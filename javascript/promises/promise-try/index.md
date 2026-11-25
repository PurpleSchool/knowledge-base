---
metaTitle: "Promise.try() в JavaScript — как использовать новый метод"
metaDescription: "Promise.try() — новый метод для безопасного запуска синхронного и асинхронного кода. Узнайте, как он упрощает обработку ошибок в Promise-цепочках."
author: "Антон Ларичев"
title: "Promise.try() — новый метод Promise"
preview: "Promise.try() позволяет единообразно обрабатывать ошибки в синхронном и асинхронном коде, оборачивая любую функцию в Promise."
---

## Promise.try() — новый метод Promise

`Promise.try()` — это статический метод, добавленный в спецификацию ECMAScript, который позволяет запускать любую функцию (синхронную или асинхронную) внутри Promise-обёртки. Главная цель метода — унифицировать обработку ошибок: неважно, бросает ли ваш код исключение синхронно или отклоняет Promise асинхронно — `Promise.try()` перехватит оба случая одинаково.

## Проблема, которую решает Promise.try()

Представьте функцию, которая может работать как синхронно, так и асинхронно в зависимости от условий:

```javascript
function getUserData(userId) {
  if (!userId) {
    throw new Error('userId обязателен'); // синхронное исключение
  }
  return fetch(`/api/users/${userId}`).then(r => r.json()); // асинхронное
}
```

Если вы вызовете эту функцию в `.then()`, синхронное исключение не будет поймано цепочкой `.catch()`:

```javascript
Promise.resolve()
  .then(() => getUserData(null)) // throw внутри .then() всё же попадает в .catch()
  .catch(err => console.error(err)); // здесь всё нормально
```

Однако проблема возникает, когда функция вызывается не в `.then()`, а напрямую:

```javascript
function processUser(userId) {
  const promise = getUserData(userId); // бросает синхронно — необработанный throw!
  return promise
    .then(data => transform(data))
    .catch(err => handleError(err)); // этот .catch() НЕ поймает синхронный throw выше
}
```

До появления `Promise.try()` разработчики решали это через `new Promise()` или `Promise.resolve().then()`:

```javascript
// Старый способ — громоздко
function processUser(userId) {
  return new Promise((resolve, reject) => {
    try {
      resolve(getUserData(userId));
    } catch (err) {
      reject(err);
    }
  }).then(data => transform(data))
    .catch(err => handleError(err));
}

// Или через Promise.resolve().then() — не очевидно
function processUser(userId) {
  return Promise.resolve()
    .then(() => getUserData(userId))
    .then(data => transform(data))
    .catch(err => handleError(err));
}
```

Оба варианта работают, но первый многословен, а второй — неочевиден по намерению.

## Синтаксис Promise.try()

```javascript
Promise.try(callback)
Promise.try(callback, ...args)
```

`callback` — функция, которую нужно выполнить. Может быть синхронной, возвращать значение, или возвращать Promise. Аргументы `args` передаются в `callback` при вызове.

Метод всегда возвращает Promise:

- Если `callback` возвращает значение — Promise resolves с этим значением.
- Если `callback` возвращает Promise — возвращаемый Promise следует за ним.
- Если `callback` бросает исключение (синхронно) — Promise rejects с этой ошибкой.

## Базовые примеры

### Синхронный код

```javascript
Promise.try(() => {
  return 42;
}).then(value => {
  console.log(value); // 42
});
```

### Синхронное исключение

```javascript
Promise.try(() => {
  throw new Error('Что-то пошло не так');
}).catch(err => {
  console.error(err.message); // 'Что-то пошло не так'
});
```

### Асинхронный код

```javascript
Promise.try(async () => {
  const response = await fetch('/api/data');
  return response.json();
}).then(data => {
  console.log(data);
}).catch(err => {
  console.error('Ошибка запроса:', err);
});
```

### Передача аргументов

```javascript
Promise.try((userId, role) => {
  if (!userId) throw new Error('userId обязателен');
  return fetchUser(userId, role);
}, currentUserId, 'admin')
  .then(user => console.log(user))
  .catch(err => console.error(err));
```

## Решение проблемы из примера выше

С `Promise.try()` код становится чистым и намерение очевидно:

```javascript
function processUser(userId) {
  return Promise.try(() => getUserData(userId))
    .then(data => transform(data))
    .catch(err => handleError(err));
}
```

Теперь и синхронный throw из `getUserData(null)`, и асинхронный reject из `fetch` будут пойманы одним `.catch()`.

## Практические сценарии применения

### Работа с неизвестным кодом

Когда вы вызываете функцию из внешней библиотеки и не знаете точно — синхронная она или асинхронная:

```javascript
function runPlugin(plugin, data) {
  return Promise.try(() => plugin.process(data))
    .then(result => ({ success: true, result }))
    .catch(err => ({ success: false, error: err.message }));
}

// plugin.process() может быть любым:
const syncPlugin = { process: (d) => d.toUpperCase() };
const asyncPlugin = { process: async (d) => await transform(d) };
const buggyPlugin = { process: (d) => { throw new Error('bug'); } };

// Все три обрабатываются одинаково:
await runPlugin(syncPlugin, 'hello');  // { success: true, result: 'HELLO' }
await runPlugin(asyncPlugin, 'hello'); // { success: true, result: ... }
await runPlugin(buggyPlugin, 'hello'); // { success: false, error: 'bug' }
```

### Middleware-цепочки

```javascript
class Pipeline {
  constructor() {
    this.middlewares = [];
  }

  use(fn) {
    this.middlewares.push(fn);
    return this;
  }

  run(context) {
    return this.middlewares.reduce(
      (chain, middleware) => chain.then(ctx => Promise.try(() => middleware(ctx))),
      Promise.resolve(context)
    );
  }
}

const pipeline = new Pipeline()
  .use(ctx => { ctx.step1 = true; return ctx; })       // синхронный
  .use(async ctx => { ctx.step2 = await fetchData(); return ctx; }) // асинхронный
  .use(ctx => { if (!ctx.step2) throw new Error('step2 failed'); return ctx; });

pipeline.run({})
  .then(ctx => console.log('Готово:', ctx))
  .catch(err => console.error('Ошибка:', err));
```

### Оборачивание callback-based API

```javascript
function readConfigFile(path) {
  return Promise.try(() => {
    const normalizedPath = normalizePath(path); // может бросить синхронно
    return fs.promises.readFile(normalizedPath, 'utf-8');
  }).then(content => JSON.parse(content)) // JSON.parse тоже может бросить
    .catch(err => {
      console.error(`Не удалось прочитать конфиг ${path}:`, err.message);
      return {}; // возвращаем дефолтный конфиг
    });
}
```

### Retry-логика

```javascript
async function withRetry(fn, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await Promise.try(fn);
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.log(`Попытка ${attempt} неудачна, повтор через ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// fn может быть синхронной или асинхронной — withRetry справится с обоими
await withRetry(() => fetch('/api/unstable').then(r => r.json()));
```

## Сравнение с альтернативами

### Promise.try() vs new Promise()

```javascript
// new Promise() — 7 строк
function wrap(fn) {
  return new Promise((resolve, reject) => {
    try {
      resolve(fn());
    } catch (err) {
      reject(err);
    }
  });
}

// Promise.try() — 1 строка
function wrap(fn) {
  return Promise.try(fn);
}
```

### Promise.try() vs Promise.resolve().then()

```javascript
// Promise.resolve().then() — работает, но неочевидно по намерению
Promise.resolve().then(() => mightThrowSync());

// Promise.try() — явно выражает намерение
Promise.try(() => mightThrowSync());
```

### Promise.try() vs async/await

Async/await тоже решает проблему, но требует объявления async-функции:

```javascript
// async IIFE — работает, но многословнее в контексте цепочки
(async () => mightThrowSync())()
  .then(handle)
  .catch(handleError);

// Promise.try() — лаконичнее и читаемее
Promise.try(() => mightThrowSync())
  .then(handle)
  .catch(handleError);
```

## Поддержка и полифилл

`Promise.try()` находится на Stage 4 в процессе стандартизации TC39 (финальная стадия перед включением в спецификацию). На момент написания статьи метод доступен в:

- Node.js 22+
- Chrome 130+
- Firefox 132+
- Safari 18.2+

Для старых окружений можно использовать полифилл:

```javascript
if (!Promise.try) {
  Promise.try = function(callback, ...args) {
    return new Promise((resolve, reject) => {
      try {
        resolve(callback(...args));
      } catch (err) {
        reject(err);
      }
    });
  };
}
```

Или через npm-пакет `promise.try`:

```bash
npm install promise.try
```

```javascript
import 'promise.try'; // автоматически добавляет полифилл
```

## Важные нюансы

**Callback вызывается синхронно.** `Promise.try()` вызывает callback немедленно, а не откладывает на следующий тик. Это важно, если callback имеет побочные эффекты:

```javascript
let called = false;

const p = Promise.try(() => {
  called = true; // выполнится синхронно
  return 42;
});

console.log(called); // true — уже выполнено!
```

**Аргументы передаются напрямую в callback, не через промежуточный Promise.** Это отличает `Promise.try(fn, arg)` от `Promise.resolve(arg).then(fn)`, где `fn` получает `arg` как результат resolve:

```javascript
// Promise.try — arg передаётся как аргумент функции
Promise.try((x) => x * 2, 5).then(console.log); // 10

// Promise.resolve().then — fn получает resolved value
Promise.resolve(5).then((x) => x * 2).then(console.log); // 10 (тот же результат, другая семантика)
```

**Возвращаемый thenable «разворачивается».** Если callback вернул Promise или любой thenable-объект, `Promise.try()` следует за ним:

```javascript
Promise.try(() => Promise.resolve(42))
  .then(v => console.log(v)); // 42, не Promise { 42 }
```

## Итог

`Promise.try()` — небольшое, но важное дополнение к Promise API. Он решает реальную проблему: несогласованность между синхронными исключениями и асинхронными отклонениями при работе с кодом, тип которого заранее неизвестен. Метод делает код более читаемым и явно выражает намерение — «выполни этот код и дай мне Promise, независимо от того, синхронный он или асинхронный».

Особенно полезен `Promise.try()` при создании библиотек, middleware-систем, и везде, где вы работаете с пользовательскими callback-функциями.

Чтобы углубить знания по асинхронному JavaScript и научиться уверенно работать с Promise, async/await и современными паттернами — смотрите курс по JavaScript на PurpleSchool: [https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=promise-try](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=promise-try)