---
metaTitle: "AbortController в JavaScript — отмена запросов и задач"
metaDescription: "Как использовать AbortController в JavaScript для отмены fetch-запросов, асинхронных операций и потоков. Примеры с таймаутом и очисткой ресурсов."
author: "Антон Ларичев"
title: "JavaScript AbortController"
preview: "AbortController позволяет отменять fetch-запросы и асинхронные операции в JavaScript. Разбираем API, практические паттерны и типичные ошибки."
---

## Что такое AbortController

AbortController — это встроенный браузерный API, который позволяет прерывать асинхронные операции: HTTP-запросы через `fetch`, работу с потоками (`ReadableStream`), обработчики событий и любой собственный асинхронный код.

До появления этого API не было стандартного способа отменить запрос, уже отправленный в сеть. Разработчикам приходилось вводить флаги-признаки отмены и игнорировать результаты, но сам запрос всё равно отправлялся и потреблял трафик и память. AbortController решает проблему на уровне самого запроса.

АPI состоит из двух частей:

- **`AbortController`** — контроллер, у которого есть метод `abort()` для отправки сигнала отмены.
- **`AbortSignal`** — объект-сигнал (`controller.signal`), который передаётся в отменяемую операцию. Он содержит свойство `aborted` и генерирует событие `abort`.

```javascript
const controller = new AbortController();
const signal = controller.signal;

console.log(signal.aborted); // false

controller.abort();

console.log(signal.aborted); // true
```

## Отмена fetch-запроса

Самый распространённый сценарий — прерывание HTTP-запроса. Достаточно передать `signal` вторым аргументом в `fetch`:

```javascript
const controller = new AbortController();

fetch('https://api.example.com/data', { signal: controller.signal })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('Запрос был отменён');
    } else {
      console.error('Сетевая ошибка:', err);
    }
  });

// Отменяем запрос через 2 секунды
setTimeout(() => controller.abort(), 2000);
```

Когда `abort()` вызывается до получения ответа, `fetch` завершается с ошибкой `AbortError`. Важно отличать её от других ошибок сети, поэтому всегда проверяйте `err.name === 'AbortError'`.

### Использование с async/await

С синтаксисом `async/await` паттерн выглядит чище:

```javascript
async function loadUser(userId) {
  const controller = new AbortController();

  // Отменяем, если пользователь ушёл со страницы
  window.addEventListener('beforeunload', () => controller.abort());

  try {
    const response = await fetch(`/api/users/${userId}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Загрузка пользователя отменена');
      return null;
    }
    throw err;
  }
}
```

## Отмена нескольких запросов одновременно

Один контроллер может управлять несколькими запросами. Один вызов `abort()` прерывает их все:

```javascript
async function loadDashboard() {
  const controller = new AbortController();
  const { signal } = controller;

  const cancelButton = document.getElementById('cancel');
  cancelButton.addEventListener('click', () => controller.abort());

  try {
    const [users, orders, stats] = await Promise.all([
      fetch('/api/users', { signal }).then(r => r.json()),
      fetch('/api/orders', { signal }).then(r => r.json()),
      fetch('/api/stats', { signal }).then(r => r.json()),
    ]);

    return { users, orders, stats };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Загрузка дашборда отменена пользователем');
      return null;
    }
    throw err;
  }
}
```

Это особенно полезно в SPA, когда пользователь быстро переключается между разделами: при смене маршрута можно отменить все незавершённые запросы предыдущего экрана.

## Таймаут через AbortSignal.timeout()

С ES2022 появился статический метод `AbortSignal.timeout(ms)`, который создаёт сигнал с встроенным таймаутом. Код становится значительно короче:

```javascript
async function fetchWithTimeout(url) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5 секунд
    });
    return await response.json();
  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.log('Запрос превысил таймаут');
    } else if (err.name === 'AbortError') {
      console.log('Запрос был отменён вручную');
    } else {
      throw err;
    }
  }
}
```

Обратите внимание: при срабатывании таймаута ошибка называется `TimeoutError`, а не `AbortError` — это важно для корректной обработки.

### Комбинирование таймаута и ручной отмены

Часто нужно и ограничить запрос по времени, и предоставить пользователю кнопку отмены. Для этого используют `AbortSignal.any()` (доступен в современных браузерах):

```javascript
const userController = new AbortController();

const signal = AbortSignal.any([
  userController.signal,
  AbortSignal.timeout(10000),
]);

try {
  const response = await fetch('/api/heavy-report', { signal });
  const data = await response.json();
  return data;
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Отменено пользователем');
  } else if (err.name === 'TimeoutError') {
    console.log('Превышен таймаут 10 секунд');
  }
}

// Кнопка отмены
cancelBtn.onclick = () => userController.abort();
```

## Отмена в React-компонентах

В React классический сценарий — отмена запроса при размонтировании компонента. Без отмены обновление состояния после размонтирования вызывает утечки памяти и предупреждения в консоли.

```javascript
import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setUser(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      }
    }

    loadUser();

    return () => controller.abort();
  }, [userId]);

  if (error) return <div>Ошибка: {error}</div>;
  if (!user) return <div>Загрузка...</div>;
  return <div>{user.name}</div>;
}
```

Функция очистки `return () => controller.abort()` вызывается при каждом изменении `userId` и при размонтировании компонента, автоматически отменяя предыдущий незавершённый запрос.

## Отмена собственного асинхронного кода

AbortSignal не ограничен только `fetch`. Его можно использовать в любом асинхронном коде, проверяя `signal.aborted` или подписываясь на событие `abort`.

### Прерываемая задержка

```javascript
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

const controller = new AbortController();

delay(5000, controller.signal)
  .then(() => console.log('Прошло 5 секунд'))
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('Задержка прервана');
    }
  });

setTimeout(() => controller.abort(), 1000); // Прерываем через 1 секунду
```

### Прерываемый цикл обработки данных

```javascript
async function processItems(items, signal) {
  const results = [];

  for (const item of items) {
    if (signal.aborted) {
      throw new DOMException('Обработка прервана', 'AbortError');
    }

    // Имитация асинхронной обработки каждого элемента
    const result = await processItem(item, signal);
    results.push(result);
  }

  return results;
}

async function processItem(item, signal) {
  const response = await fetch(`/api/process/${item.id}`, { signal });
  return response.json();
}
```

## Передача причины отмены

Метод `abort()` принимает необязательный аргумент — причину отмены. Она доступна через `signal.reason`:

```javascript
const controller = new AbortController();

fetch('/api/data', { signal: controller.signal }).catch(err => {
  if (err.name === 'AbortError') {
    console.log('Причина:', controller.signal.reason);
    // Причина: NavigatedAway
  }
});

controller.abort('NavigatedAway');
```

Причиной может быть строка, объект ошибки или любое значение — это удобно для диагностики в сложных системах с несколькими источниками отмены.

## Типичные ошибки

**Повторное использование контроллера после abort().** После вызова `abort()` сигнал остаётся в состоянии `aborted` навсегда. Для нового запроса нужен новый контроллер:

```javascript
// Неправильно
const controller = new AbortController();
controller.abort();
await fetch('/api/data', { signal: controller.signal }); // Сразу упадёт с AbortError

// Правильно
let controller = new AbortController();

function startNewRequest() {
  controller.abort(); // Отменяем предыдущий, если есть
  controller = new AbortController(); // Создаём новый
  return fetch('/api/data', { signal: controller.signal });
}
```

**Игнорирование AbortError.** Если не обрабатывать `AbortError` отдельно, пользователь увидит сообщение об ошибке там, где её быть не должно:

```javascript
// Неправильно
async function load(signal) {
  const data = await fetch('/api', { signal }).then(r => r.json());
  setData(data); // При отмене здесь упадёт необработанная ошибка
}

// Правильно
async function load(signal) {
  try {
    const data = await fetch('/api', { signal }).then(r => r.json());
    setData(data);
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
    // Отмена — нормальное поведение, просто выходим
  }
}
```

**Не передавать signal глубже по цепочке.** Если функция делает несколько вложенных запросов, нужно передать сигнал в каждый из них:

```javascript
// Неправильно — вложенный fetch не знает о сигнале
async function loadOrder(orderId, signal) {
  const order = await fetch(`/api/orders/${orderId}`, { signal }).then(r => r.json());
  const user = await fetch(`/api/users/${order.userId}`).then(r => r.json()); // Нет signal!
  return { order, user };
}

// Правильно
async function loadOrder(orderId, signal) {
  const order = await fetch(`/api/orders/${orderId}`, { signal }).then(r => r.json());
  const user = await fetch(`/api/users/${order.userId}`, { signal }).then(r => r.json());
  return { order, user };
}
```

## Поддержка в браузерах и Node.js

AbortController поддерживается во всех современных браузерах и в Node.js начиная с версии 15. В Node.js 18+ `AbortSignal.timeout()` также доступен нативно. Для старых окружений существуют полифиллы, например `abortcontroller-polyfill`.

```bash
npm install abortcontroller-polyfill
```

```javascript
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';
```

## Итог

AbortController — стандартный и надёжный способ управлять жизненным циклом асинхронных операций в JavaScript. Основные правила:

- Создавайте новый контроллер для каждого независимого набора запросов.
- Всегда отдельно обрабатывайте `AbortError`, чтобы не показывать пользователю ложные ошибки.
- Передавайте `signal` во все вложенные асинхронные вызовы.
- Используйте `AbortSignal.timeout()` для краткого синтаксиса таймаута.
- В React очищайте запросы в функции очистки `useEffect`.

Глубже освоить асинхронный JavaScript, включая работу с `fetch`, промисами и управлением состоянием запросов, можно на курсе PurpleSchool.

[Курс по JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=abort-controller)
