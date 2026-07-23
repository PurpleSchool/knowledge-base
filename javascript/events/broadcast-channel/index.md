---
metaTitle: "BroadcastChannel в JavaScript — общение между вкладками"
metaDescription: "BroadcastChannel API в JavaScript: отправка сообщений между вкладками, воркерами и фреймами одного источника. Примеры синхронизации данных."
author: "Антон Ларичев"
title: "JavaScript BroadcastChannel — межвкладочное взаимодействие"
preview: "Разбираем BroadcastChannel API — встроенный механизм JavaScript для передачи сообщений между вкладками, окнами и воркерами одного происхождения."
---

## Что такое BroadcastChannel

BroadcastChannel — это браузерный API, который позволяет разным контекстам одного происхождения (вкладкам, окнам, iframe, воркерам) обмениваться сообщениями в режиме «один ко всем». Достаточно создать канал с одинаковым именем в нескольких контекстах — и они автоматически начнут получать сообщения друг от друга.

АPI доступно в браузерах без какой-либо установки пакетов. Оно работает в рамках одного [origin](https://developer.mozilla.org/ru/docs/Glossary/Origin) — протокол, домен и порт должны совпадать. Вкладки `https://example.com` и `http://example.com` находятся в разных origin и не смогут общаться через один канал.

## Создание канала

Для создания канала используется конструктор `BroadcastChannel`, которому передаётся строка-имя:

```javascript
const channel = new BroadcastChannel('notifications');
```

Каждый контекст, создавший канал с именем `'notifications'`, становится его участником. Имя канала — произвольная строка; рекомендуется выбирать осмысленные имена, чтобы разные части приложения не конфликтовали друг с другом.

## Отправка сообщений

Отправка выполняется методом `postMessage`. Данные сериализуются по алгоритму [структурированного клонирования](https://developer.mozilla.org/ru/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), поэтому можно передавать не только строки, но и объекты, массивы, `Map`, `Set`, `ArrayBuffer` и другие типы.

```javascript
const channel = new BroadcastChannel('cart');

// Отправить обычный объект
channel.postMessage({
  type: 'ITEM_ADDED',
  payload: { id: 42, name: 'Книга по JavaScript', quantity: 1 }
});

// Отправить строку
channel.postMessage('ping');

// Отправить массив
channel.postMessage([1, 2, 3]);
```

Важно: отправитель не получает собственное сообщение. `postMessage` доставляет данные только другим контекстам, подписанным на тот же канал.

## Получение сообщений

Для получения сообщений нужно назначить обработчик события `message` через свойство `onmessage` или метод `addEventListener`:

```javascript
const channel = new BroadcastChannel('cart');

// Через свойство
channel.onmessage = (event) => {
  console.log('Получено:', event.data);
};

// Через addEventListener (предпочтительно — можно добавить несколько обработчиков)
channel.addEventListener('message', (event) => {
  console.log('Получено:', event.data);
});
```

Объект события содержит:
- `event.data` — переданные данные;
- `event.origin` — origin отправителя;
- `event.lastEventId` — идентификатор события (обычно пустая строка);
- `event.source` — всегда `null` для BroadcastChannel.

## Обработка ошибок

Если данные не удаётся сериализовать (например, при передаче объекта с циклическими ссылками или функциями), генерируется исключение. Дополнительно можно обработать событие `messageerror` — оно возникает, когда полученное сообщение не удаётся десериализовать:

```javascript
const channel = new BroadcastChannel('sync');

channel.addEventListener('messageerror', (event) => {
  console.error('Ошибка десериализации сообщения', event);
});

// Попытка отправить несериализуемые данные вызовет исключение
try {
  const circular = {};
  circular.self = circular;
  channel.postMessage(circular); // DataCloneError
} catch (error) {
  console.error('Ошибка отправки:', error.message);
}
```

## Закрытие канала

Когда канал больше не нужен, его следует закрыть методом `close`. После закрытия канал перестаёт получать сообщения и высвобождает ресурсы:

```javascript
const channel = new BroadcastChannel('session');

// Закрываем при уходе пользователя со страницы
window.addEventListener('beforeunload', () => {
  channel.close();
});
```

Закрытый канал нельзя переоткрыть — нужно создавать новый экземпляр.

## Практический пример: синхронизация корзины

Представьте интернет-магазин: пользователь открывает несколько вкладок и добавляет товары в корзину. Без синхронизации вкладки будут показывать разное содержимое.

```javascript
// cart.js — модуль, подключаемый на каждой странице
const cartChannel = new BroadcastChannel('shopping-cart');

let cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

function addItem(item) {
  cartItems.push(item);
  localStorage.setItem('cart', JSON.stringify(cartItems));

  // Уведомляем остальные вкладки
  cartChannel.postMessage({
    type: 'CART_UPDATED',
    items: cartItems
  });

  renderCart();
}

function removeItem(itemId) {
  cartItems = cartItems.filter(i => i.id !== itemId);
  localStorage.setItem('cart', JSON.stringify(cartItems));

  cartChannel.postMessage({
    type: 'CART_UPDATED',
    items: cartItems
  });

  renderCart();
}

// Слушаем изменения из других вкладок
cartChannel.addEventListener('message', (event) => {
  if (event.data.type === 'CART_UPDATED') {
    cartItems = event.data.items;
    renderCart();
  }
});

function renderCart() {
  const counter = document.querySelector('.cart-counter');
  if (counter) {
    counter.textContent = cartItems.length;
  }
}
```

## Практический пример: выход из аккаунта во всех вкладках

Это одна из самых распространённых задач: когда пользователь выходит из системы, нужно закрыть сессию во всех открытых вкладках.

```javascript
// auth.js
const authChannel = new BroadcastChannel('auth');

function logout() {
  // Чистим локальное состояние
  localStorage.removeItem('token');
  sessionStorage.clear();

  // Сообщаем всем остальным вкладкам
  authChannel.postMessage({ type: 'LOGOUT' });

  // Перенаправляем текущую вкладку
  window.location.href = '/login';
}

function login(token) {
  localStorage.setItem('token', token);

  authChannel.postMessage({ type: 'LOGIN', token });
}

// Реагируем на события других вкладок
authChannel.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'LOGOUT':
      // Другая вкладка разлогинилась — делаем то же самое
      localStorage.removeItem('token');
      window.location.href = '/login';
      break;

    case 'LOGIN':
      // Другая вкладка вошла — обновляем токен
      localStorage.setItem('token', event.data.token);
      break;
  }
});
```

## Практический пример: синхронизация темы оформления

```javascript
// theme.js
const themeChannel = new BroadcastChannel('ui-theme');

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);

  themeChannel.postMessage({ theme });
}

themeChannel.addEventListener('message', (event) => {
  document.documentElement.dataset.theme = event.data.theme;
});

// Инициализация при загрузке страницы
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.dataset.theme = savedTheme;
```

## Использование в Service Worker

BroadcastChannel работает и в Service Worker — это позволяет отправлять уведомления из воркера во все вкладки приложения:

```javascript
// service-worker.js
const swChannel = new BroadcastChannel('sw-updates');

self.addEventListener('push', (event) => {
  const data = event.data.json();

  // Показываем уведомление
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body
    })
  );

  // Уведомляем все открытые вкладки
  swChannel.postMessage({
    type: 'PUSH_RECEIVED',
    payload: data
  });
});

// app.js (на стороне страницы)
const swChannel = new BroadcastChannel('sw-updates');

swChannel.addEventListener('message', (event) => {
  if (event.data.type === 'PUSH_RECEIVED') {
    showInAppNotification(event.data.payload);
  }
});
```

## Паттерн: запрос состояния при открытии новой вкладки

Новая вкладка может запросить актуальное состояние у уже открытых вкладок:

```javascript
const stateChannel = new BroadcastChannel('app-state');

let appState = {
  user: null,
  theme: 'light',
  language: 'ru'
};

stateChannel.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'REQUEST_STATE':
      // Другая вкладка просит поделиться состоянием
      stateChannel.postMessage({
        type: 'STATE_RESPONSE',
        state: appState
      });
      break;

    case 'STATE_RESPONSE':
      // Получили состояние от другой вкладки
      if (!appState.user) {
        appState = event.data.state;
        applyState(appState);
      }
      break;

    case 'STATE_CHANGED':
      appState = { ...appState, ...event.data.changes };
      applyState(appState);
      break;
  }
});

function updateState(changes) {
  appState = { ...appState, ...changes };
  stateChannel.postMessage({ type: 'STATE_CHANGED', changes });
  applyState(appState);
}

function applyState(state) {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.lang = state.language;
  // ...
}

// При загрузке страницы запрашиваем состояние у существующих вкладок
stateChannel.postMessage({ type: 'REQUEST_STATE' });
```

## BroadcastChannel vs альтернативы

### LocalStorage события

До появления BroadcastChannel разработчики синхронизировали вкладки через событие `storage` на объекте `window`. Этот подход требует сохранения данных в localStorage — даже если они нужны только для передачи сообщения:

```javascript
// Старый подход
window.addEventListener('storage', (event) => {
  if (event.key === 'cart-update') {
    const data = JSON.parse(event.newValue);
    updateCart(data);
  }
});

localStorage.setItem('cart-update', JSON.stringify(cartData));
```

BroadcastChannel чище: не засоряет localStorage и позволяет передавать богатые типы данных без ручной сериализации.

### SharedWorker

SharedWorker — более мощный инструмент: позволяет выполнять код в отдельном потоке и управлять сложной логикой централизованно. Но он требует написания отдельного файла воркера и более сложного API. BroadcastChannel подходит для простой pub/sub коммуникации.

### postMessage через window.opener

Для общения с конкретным окном можно использовать `window.opener.postMessage`. Но этот способ работает только между окном и его открывателем — нельзя обратиться к произвольной вкладке.

## Поддержка браузеров

BroadcastChannel поддерживается во всех современных браузерах: Chrome 54+, Firefox 38+, Edge 79+, Safari 15.4+. В Node.js API недоступно нативно, но существуют полифилы для тестирования.

Если требуется поддержка Safari до 15.4 или Internet Explorer, нужен полифил на основе localStorage.

## Итог

BroadcastChannel — элегантный и простой API для синхронизации состояния между вкладками. Он подходит для задач, которые раньше решались через localStorage-хаки: выход из системы, синхронизация корзины, обновление темы, рассылка уведомлений из Service Worker.

Основные правила работы с BroadcastChannel:
- Один канал — одно имя, все участники с этим именем получают сообщения.
- Отправитель не получает собственные сообщения.
- Данные сериализуются структурным клонированием — функции и циклические ссылки не поддерживаются.
- Всегда закрывайте канал методом `close()`, когда он больше не нужен.
- API работает только в пределах одного origin.

Для глубокого изучения JavaScript, включая браузерные API, асинхронное программирование и работу с событиями, рекомендую курс [JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=broadcast-channel).