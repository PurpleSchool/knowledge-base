---
metaTitle: "Service Workers в JavaScript — кэширование и офлайн-режим"
metaDescription: "Разбираем Service Workers: жизненный цикл, стратегии кэширования, перехват запросов и создание офлайн-приложений на JavaScript."
author: "Антон Ларичев"
title: "Service Workers в JavaScript"
preview: "Что такое Service Workers, как они работают, как настроить кэширование и реализовать офлайн-режим в веб-приложении."
---

## Что такое Service Worker

Service Worker — это скрипт, который браузер запускает в фоне, отдельно от основного потока страницы. Он работает как прокси между веб-приложением, браузером и сетью, перехватывает сетевые запросы и управляет кэшем.

Ключевые особенности:

- Работает в отдельном потоке — не имеет доступа к DOM
- Полностью асинхронный — взаимодействует через события и промисы
- Требует HTTPS (исключение — `localhost`)
- Работает даже когда страница закрыта
- Позволяет реализовать офлайн-режим, фоновую синхронизацию и push-уведомления

## Жизненный цикл Service Worker

Понимание жизненного цикла критично для правильной работы с Service Workers.

### Регистрация

Первый шаг — регистрация Service Worker из основного скрипта страницы:

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker зарегистрирован:', registration.scope);
    } catch (error) {
      console.error('Ошибка регистрации:', error);
    }
  });
}
```

Параметр `scope` определяет, какие URL будет контролировать Service Worker. По умолчанию — папка, в которой находится файл `sw.js`. Service Worker из `/sw.js` контролирует всё приложение, а из `/admin/sw.js` — только `/admin/`.

### Установка (install)

После регистрации браузер скачивает файл Service Worker и запускает событие `install`. Здесь принято кэшировать статические ресурсы:

```javascript
const CACHE_NAME = 'app-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});
```

`event.waitUntil()` принимает промис и удерживает Service Worker в состоянии установки до его завершения. Если промис отклоняется — установка считается неуспешной.

### Активация (activate)

После успешной установки Service Worker переходит в состояние ожидания. Он активируется, когда все вкладки под управлением предыдущей версии закрыты. В обработчике `activate` удаляют устаревшие кэши:

```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

Чтобы новый Service Worker активировался немедленно, не дожидаясь закрытия вкладок:

```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // очистка кэша...
      self.clients.claim()
    ])
  );
});
```

`self.clients.claim()` позволяет активированному Service Worker немедленно взять под контроль все открытые страницы.

## Перехват сетевых запросов

Основная мощь Service Workers — в обработке события `fetch`. Здесь реализуются стратегии кэширования:

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
```

## Стратегии кэширования

Выбор стратегии зависит от типа ресурса и требований к актуальности данных.

### Cache First (кэш в приоритете)

Сначала проверяем кэш, при промахе обращаемся к сети. Подходит для статических ресурсов (шрифты, изображения, JS/CSS-бандлы с хэшами):

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
```

### Network First (сеть в приоритете)

Сначала пробуем сеть, при ошибке отдаём из кэша. Подходит для API-запросов, где важна актуальность данных:

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
```

### Stale While Revalidate

Возвращаем кэшированный ответ немедленно и одновременно обновляем кэш из сети. Хороший баланс между скоростью и актуальностью:

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
        return cached || networkFetch;
      });
    })
  );
});
```

### Cache Only и Network Only

Стратегии для крайних случаев:

```javascript
// Cache Only — только из кэша (офлайн-ресурсы)
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});

// Network Only — всегда из сети (аналитика, POST-запросы)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
```

## Практический пример: офлайн-страница

Покажем типичный паттерн: статика из кэша, API из сети, при ошибке — офлайн-страница:

```javascript
// sw.js
const CACHE_NAME = 'app-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/styles.css',
  '/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // POST-запросы не кэшируем
  if (request.method !== 'GET') return;

  // API — Network First
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
    return;
  }

  // Статика — Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return response;
      }).catch(() => {
        // Для навигационных запросов — офлайн-страница
        if (request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
```

## Обновление Service Worker

Браузер автоматически проверяет обновления Service Worker при каждой навигации. Даже разница в 1 байт запустит процесс переустановки.

Чтобы сообщить пользователю о доступном обновлении:

```javascript
// main.js
async function registerSW() {
  const registration = await navigator.serviceWorker.register('/sw.js');

  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;

    newWorker.addEventListener('statechange', () => {
      if (
        newWorker.state === 'installed' &&
        navigator.serviceWorker.controller
      ) {
        showUpdateNotification();
      }
    });
  });
}

function showUpdateNotification() {
  const banner = document.createElement('div');
  banner.textContent = 'Доступна новая версия приложения. ';

  const button = document.createElement('button');
  button.textContent = 'Обновить';
  button.addEventListener('click', () => {
    window.location.reload();
  });

  banner.appendChild(button);
  document.body.prepend(banner);
}
```

## Взаимодействие страницы и Service Worker

Для обмена сообщениями используется `postMessage`:

```javascript
// Из страницы в Service Worker
async function sendMessage(data) {
  const registration = await navigator.serviceWorker.ready;
  registration.active.postMessage(data);
}

// Ответ в Service Worker
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.source.postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});

// Получение ответа на странице
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('Сообщение от SW:', event.data);
});
```

## Отладка Service Workers

В Chrome DevTools откройте вкладку **Application > Service Workers**. Там можно:

- Просмотреть статус (installing, waiting, active)
- Принудительно обновить (`Update on reload`)
- Имитировать офлайн-режим (`Offline`)
- Вручную отправить push-уведомление или событие синхронизации

Просмотр содержимого кэша — **Application > Cache Storage**.

Полезные паттерны для разработки:

```javascript
// Добавьте в sw.js для наглядности
self.addEventListener('fetch', (event) => {
  console.log('[SW] Fetch:', event.request.url);
  // ...
});
```

## Типичные ошибки

**Кэширование непрозрачных ответов.** Запросы к сторонним ресурсам без CORS возвращают непрозрачные ответы со статусом 0. Браузер не может проверить их корректность, а занимают они на диске значительно больше места:

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then((response) => {
      // Не кэшируем непрозрачные ответы
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      const cloned = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
      return response;
    })
  );
});
```

**Забытая инвалидация кэша.** Всегда включайте версию в имя кэша и удаляйте старые в обработчике `activate`.

**Кэширование POST-запросов.** Cache API не поддерживает кэширование POST-запросов по умолчанию. Для фоновой синхронизации POST-запросов используйте Background Sync API.

## Когда использовать Service Workers

Service Workers оправданы, когда приложению нужно:

- Работать офлайн или при нестабильном соединении
- Агрессивно кэшировать статику для быстрой загрузки (PWA)
- Получать push-уведомления
- Синхронизировать данные в фоне через Background Sync API

Для простых сайтов-визиток или внутренних инструментов без требований к офлайн-работе Service Workers добавляют сложность без значимой пользы.

---

Получить системные знания по JavaScript, включая современные браузерные API, асинхронное программирование и работу с сетью, можно на курсе [JavaScript для профессионалов на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=service-workers).