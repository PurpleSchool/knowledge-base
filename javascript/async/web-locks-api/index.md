---
metaTitle: "Web Locks API — синхронизация вкладок в JavaScript"
metaDescription: "Как использовать Web Locks API для синхронизации между вкладками браузера: эксклюзивные и разделяемые блокировки, очереди, AbortController."
author: "Антон Ларичев"
title: "Web Locks API: синхронизация между вкладками"
preview: "Web Locks API позволяет координировать доступ к общим ресурсам между несколькими вкладками и воркерами без гонок и дублирования операций."
---

## Что такое Web Locks API

Web Locks API — браузерный интерфейс, который позволяет вкладкам, воркерам и другим контекстам одного источника (same-origin) координировать доступ к общим ресурсам. По аналогии с мьютексами в многопоточном программировании, он гарантирует, что критический участок кода в один момент времени выполняется только в одном контексте.

Типичные задачи, которые он решает:

- запрет параллельного выполнения фоновой синхронизации в нескольких вкладках;
- атомарное чтение-изменение-запись данных в IndexedDB;
- координация Service Worker и страницы при обновлении кэша;
- предотвращение дублирующихся WebSocket-соединений.

API доступен через объект `navigator.locks` и поддерживается во всех современных браузерах (Chrome 69+, Firefox 96+, Safari 15.4+).

## Основной метод: navigator.locks.request

Единственный способ получить блокировку — метод `request`. Он принимает имя блокировки, опциональные параметры и колбэк-функцию, которая вызывается сразу после захвата:

```javascript
await navigator.locks.request('my-lock', async (lock) => {
  // этот код выполняется эксклюзивно
  // блокировка удерживается до завершения промиса
  await doSomething();
});
```

Важный момент: блокировка удерживается ровно столько, сколько выполняется возвращённый из колбэка промис. Как только промис завершается (успехом или ошибкой), блокировка освобождается автоматически.

Если другая вкладка уже удерживает блокировку с тем же именем, вызов `request` встаёт в очередь и ждёт — никакого активного поллинга не происходит, браузер управляет очередью сам.

## Режимы блокировки

### Эксклюзивный режим (exclusive)

Режим по умолчанию. В любой момент времени блокировку может удерживать только один контекст. Все остальные запросы с тем же именем выстраиваются в очередь.

```javascript
navigator.locks.request('sync', { mode: 'exclusive' }, async (lock) => {
  await syncDataWithServer();
});
```

### Разделяемый режим (shared)

Несколько контекстов могут одновременно удерживать одну и ту же блокировку в режиме `shared`. Эксклюзивный запрос подождёт, пока все `shared`-держатели не завершатся.

Это аналог read/write lock: многие читатели могут работать параллельно, но запись требует эксклюзивного доступа.

```javascript
// Несколько вкладок могут читать одновременно
async function readData() {
  return navigator.locks.request(
    'cache-resource',
    { mode: 'shared' },
    async () => {
      return await getCachedData();
    }
  );
}

// Запись требует эксклюзивного доступа
async function writeData(payload) {
  return navigator.locks.request(
    'cache-resource',
    { mode: 'exclusive' },
    async () => {
      await setCachedData(payload);
    }
  );
}
```

## Практический пример: фоновая синхронизация без дублирования

Предположим, приложение открыто в нескольких вкладках. Каждая вкладка пытается запустить периодическую синхронизацию с сервером. Без координации все вкладки будут делать одинаковые запросы одновременно.

С Web Locks API достаточно одной строки логики:

```javascript
class SyncService {
  async startPeriodicSync() {
    while (true) {
      await navigator.locks.request('background-sync', async (lock) => {
        console.log('Эта вкладка выполняет синхронизацию');
        await this.sync();
        await sleep(30_000); // держим блокировку 30 секунд
      });
      // После освобождения блокировки следующая вкладка в очереди
      // немедленно её захватит
    }
  }

  async sync() {
    const response = await fetch('/api/sync');
    const data = await response.json();
    await saveToIndexedDB(data);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

Теперь в любой момент синхронизацию ведёт ровно одна вкладка. Если она закрывается, блокировка освобождается и следующая вкладка из очереди автоматически берёт работу на себя.

## Опция ifAvailable: не ждать, а проверить

Иногда нужно не ждать блокировку, а просто проверить — доступна ли она прямо сейчас. Для этого используется опция `ifAvailable: true`.

Если блокировка занята, колбэк всё равно вызывается, но аргумент `lock` будет `null`:

```javascript
async function tryRunExclusiveTask() {
  await navigator.locks.request(
    'exclusive-task',
    { ifAvailable: true },
    async (lock) => {
      if (lock === null) {
        console.log('Задача уже выполняется в другой вкладке, пропускаем');
        return;
      }
      await performTask();
    }
  );
}
```

Это полезно для оппортунистических задач: сделать работу, если никто другой её не делает, но не блокироваться в ожидании.

## Отмена запроса через AbortController

Если нужно отменить ожидание блокировки (например, пользователь закрыл диалог), используйте `AbortController`:

```javascript
const controller = new AbortController();

// Допустим, пользователь нажал «Отмена»
cancelButton.addEventListener('click', () => controller.abort());

try {
  await navigator.locks.request(
    'long-operation',
    { signal: controller.signal },
    async (lock) => {
      await longRunningOperation();
    }
  );
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Ожидание блокировки отменено пользователем');
  } else {
    throw err;
  }
}
```

Если блокировка уже захвачена в момент вызова `abort()`, отмена не работает — это прерывает только ожидание в очереди, но не выполняющийся колбэк.

## Диагностика: navigator.locks.query

Метод `query` возвращает снимок текущего состояния блокировок: какие удерживаются, какие ждут в очереди.

```javascript
async function debugLocks() {
  const state = await navigator.locks.query();

  console.log('Удерживаемые блокировки:');
  for (const lock of state.held) {
    console.log(`  ${lock.name} [${lock.mode}] clientId=${lock.clientId}`);
  }

  console.log('Ожидающие блокировки:');
  for (const lock of state.pending) {
    console.log(`  ${lock.name} [${lock.mode}] clientId=${lock.clientId}`);
  }
}
```

Поле `clientId` соответствует `self.clientId` в Service Worker или уникальному идентификатору вкладки. Это позволяет понять, какая именно вкладка держит блокировку.

`query` предназначен исключительно для отладки и мониторинга — принимать решения на основе его результата не стоит, так как состояние может измениться между вызовом `query` и следующей операцией.

## Реализация однократного выполнения при старте

Частый паттерн — убедиться, что инициализация (миграция базы, первый запрос к API) происходит только в одной вкладке, даже если несколько открылись почти одновременно:

```javascript
async function initializeApp() {
  await navigator.locks.request(
    'app-init',
    { ifAvailable: true },
    async (lock) => {
      if (lock === null) {
        // Другая вкладка уже инициализируется, подождём её завершения
        await navigator.locks.request('app-init', { mode: 'shared' }, () => {});
        console.log('Инициализация выполнена другой вкладкой');
        return;
      }

      const initialized = await checkIfAlreadyInitialized();
      if (!initialized) {
        await runMigrations();
        await fetchInitialData();
        await markAsInitialized();
      }
    }
  );
}
```

Здесь вкладка, которая не получила эксклюзивную блокировку сразу, ждёт её освобождения через `shared`-запрос — это сигнал, что инициализация завершена.

## Блокировки и Service Worker

Web Locks API работает в одном пространстве имён для всех same-origin контекстов: вкладок, iframe, Service Worker, Shared Worker. Это позволяет организовать координацию между страницей и воркером.

```javascript
// В Service Worker: fetch-событие ждёт завершения обновления кэша
self.addEventListener('fetch', (event) => {
  event.respondWith(
    navigator.locks.request(
      'cache-update',
      { mode: 'shared' },
      async () => {
        return caches.match(event.request);
      }
    )
  );
});

// В странице: обновление кэша берёт эксклюзивную блокировку
async function refreshCache() {
  await navigator.locks.request('cache-update', async () => {
    const cache = await caches.open('v1');
    await cache.add('/api/data');
  });
}
```

Пока `refreshCache` работает, все `fetch`-запросы из воркера ждут завершения обновления.

## Обработка ошибок

Если колбэк выбрасывает ошибку, промис `request` отклоняется с той же ошибкой. Блокировка при этом всё равно освобождается корректно:

```javascript
try {
  await navigator.locks.request('critical-section', async (lock) => {
    await riskyOperation(); // может выбросить ошибку
  });
} catch (err) {
  // Блокировка уже освобождена, можно безопасно обработать ошибку
  console.error('Операция завершилась с ошибкой:', err);
}
```

Это принципиально отличает Web Locks API от ручного управления семафорами, где легко забыть освободить блокировку в блоке `finally`.

## Ограничения и особенности

**Блокировки не персистентны.** При закрытии вкладки все её блокировки немедленно освобождаются. Это предотвращает deadlock, но означает, что нельзя передать блокировку между сессиями.

**Нет приоритетов.** Очередь работает по принципу FIFO. Если нужна приоритизация, придётся реализовывать её поверх API.

**Только same-origin.** Разные домены не могут делить блокировки. В рамках одного домена пространство имён общее для всех контекстов.

**Имена — просто строки.** Пространство имён единое, поэтому стоит использовать префиксы во избежание коллизий: `'myapp:sync'`, `'myapp:cache'`.

## Проверка поддержки

Перед использованием проверьте доступность API:

```javascript
if ('locks' in navigator) {
  await navigator.locks.request('resource', async (lock) => {
    await doWork();
  });
} else {
  // Фолбэк для старых браузеров
  await doWork();
}
```

Для полноценного полифила существует пакет `navigator.locks` на npm, но большинство современных приложений могут рассчитывать на нативную поддержку.

---

Чтобы глубже разобраться с асинхронным JavaScript, Service Worker и браузерными API — смотрите полный курс на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=web-locks-api