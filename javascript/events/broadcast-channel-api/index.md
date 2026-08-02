---
metaTitle: "Broadcast Channel API — синхронизация вкладок браузера"
metaDescription: "Разбираем Broadcast Channel API: как передавать сообщения между вкладками, окнами и воркерами одного origin. Примеры синхронизации авторизации и данных."
author: "Антон Ларичев"
title: "Broadcast Channel API в JavaScript"
preview: "Broadcast Channel API позволяет обмениваться сообщениями между вкладками, окнами и воркерами одного origin — без хаков с localStorage и без сложной настройки SharedWorker."
---

## Что такое Broadcast Channel API

Broadcast Channel API — это браузерный интерфейс, позволяющий передавать сообщения между несколькими контекстами браузера, которые принадлежат одному источнику (origin). Под контекстами понимаются вкладки, окна, iframe и Web Workers одного и того же домена.

До появления этого API разработчики прибегали к обходным путям: использовали `localStorage` с событием `storage`, поднимали SharedWorker или синхронизировали состояние через сервер. Broadcast Channel API даёт прямолинейное решение без лишних ухищрений.

## Как создать канал

Для создания канала достаточно вызвать конструктор `BroadcastChannel` с именем канала:

```javascript
const channel = new BroadcastChannel('notifications');
```

Все контексты одного origin, создавшие канал с одинаковым именем, автоматически подключаются к одному каналу и могут обмениваться сообщениями. Имя канала — произвольная строка, которую вы выбираете сами.

## Отправка сообщений

Для отправки используется метод `postMessage`:

```javascript
const channel = new BroadcastChannel('notifications');
channel.postMessage('Новое уведомление получено');
```

Метод принимает любые данные, которые поддерживает алгоритм структурированного клонирования: строки, числа, объекты, массивы, `Blob`, `ArrayBuffer` и другие типы. Функции и экземпляры классов с методами передать нельзя.

```javascript
channel.postMessage({
  type: 'USER_LOGGED_IN',
  payload: {
    userId: 42,
    username: 'Anton'
  }
});
```

## Получение сообщений

Для получения сообщений нужно подписаться на событие `message`:

```javascript
const channel = new BroadcastChannel('notifications');

channel.addEventListener('message', (event) => {
  console.log('Получено сообщение:', event.data);
});
```

Или через свойство `onmessage`:

```javascript
channel.onmessage = (event) => {
  console.log('Тип:', event.data.type);
  console.log('Данные:', event.data.payload);
};
```

Важно понимать: отправитель не получает собственное сообщение. Событие `message` срабатывает только в других контекстах, подключённых к тому же каналу.

## Обработка ошибок

Для перехвата ошибок десериализации (когда данные нельзя клонировать или восстановить) используется событие `messageerror`:

```javascript
channel.addEventListener('messageerror', (event) => {
  console.error('Ошибка при получении сообщения:', event);
});
```

## Закрытие канала

Когда канал больше не нужен, его следует закрыть методом `close()`:

```javascript
channel.close();
```

После закрытия канал перестаёт принимать и отправлять сообщения. Закрывать канал важно при размонтировании компонентов или завершении работы воркера, чтобы избежать утечек памяти.

## Практические примеры

### Синхронизация авторизации между вкладками

Один из самых распространённых сценариев — синхронизация состояния авторизации. Если пользователь вышел из аккаунта в одной вкладке, остальные вкладки должны это отразить:

```javascript
// auth.js — общий модуль авторизации
const authChannel = new BroadcastChannel('auth');

export function logout() {
  localStorage.removeItem('token');

  // Уведомляем остальные вкладки
  authChannel.postMessage({ type: 'LOGOUT' });
}

export function login(user) {
  localStorage.setItem('token', user.token);

  authChannel.postMessage({ type: 'LOGIN', payload: { user } });
}

export function initAuthSync() {
  authChannel.addEventListener('message', (event) => {
    if (event.data.type === 'LOGOUT') {
      window.location.href = '/login';
    }

    if (event.data.type === 'LOGIN') {
      updateUserInterface(event.data.payload.user);
    }
  });
}
```

### Трансляция обновлений данных из WebSocket

Если одна вкладка держит активное WebSocket-соединение, она может транслировать входящие данные во все остальные, избегая дублирования соединений:

```javascript
// Вкладка с активным WebSocket
const dataChannel = new BroadcastChannel('realtime-data');
const socket = new WebSocket('wss://api.example.com/updates');

socket.addEventListener('message', (wsEvent) => {
  const data = JSON.parse(wsEvent.data);

  // Рассылаем данные остальным вкладкам
  dataChannel.postMessage({ type: 'DATA_UPDATE', payload: data });

  // Обновляем текущую вкладку напрямую
  handleDataUpdate(data);
});

// Остальные вкладки
const dataChannel = new BroadcastChannel('realtime-data');

dataChannel.addEventListener('message', (event) => {
  if (event.data.type === 'DATA_UPDATE') {
    handleDataUpdate(event.data.payload);
  }
});
```

### Счётчик активных вкладок

```javascript
const tabChannel = new BroadcastChannel('tabs');
let activeTabs = 1;

// Сообщаем остальным о своём открытии
tabChannel.postMessage({ type: 'TAB_OPENED' });

tabChannel.addEventListener('message', (event) => {
  if (event.data.type === 'TAB_OPENED') {
    activeTabs++;
    console.log(`Активных вкладок: ${activeTabs}`);
  }

  if (event.data.type === 'TAB_CLOSED') {
    activeTabs--;
    console.log(`Активных вкладок: ${activeTabs}`);
  }
});

window.addEventListener('beforeunload', () => {
  tabChannel.postMessage({ type: 'TAB_CLOSED' });
  tabChannel.close();
});
```

### Использование с Web Workers

BroadcastChannel работает как в главном потоке, так и в воркерах. Это позволяет воркеру уведомлять несколько вкладок о завершении тяжёлой задачи:

```javascript
// worker.js
const channel = new BroadcastChannel('worker-results');

self.addEventListener('message', async (event) => {
  const { task, data } = event.data;

  const result = await processHeavyTask(data);

  // Рассылаем результат всем заинтересованным контекстам
  channel.postMessage({
    type: 'TASK_COMPLETE',
    taskId: task.id,
    result
  });
});

// main.js
const worker = new Worker('worker.js');
const resultChannel = new BroadcastChannel('worker-results');

resultChannel.addEventListener('message', (event) => {
  if (event.data.type === 'TASK_COMPLETE') {
    displayResult(event.data.taskId, event.data.result);
  }
});

worker.postMessage({ task: { id: 1 }, data: heavyData });
```

## Использование в React

В React удобно инкапсулировать работу с каналом в пользовательский хук:

```javascript
import { useEffect, useRef, useCallback } from 'react';

function useBroadcastChannel(channelName, onMessage) {
  const channelRef = useRef(null);

  useEffect(() => {
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;
    channel.addEventListener('message', onMessage);

    return () => {
      channel.removeEventListener('message', onMessage);
      channel.close();
    };
  }, [channelName, onMessage]);

  const postMessage = useCallback((data) => {
    channelRef.current?.postMessage(data);
  }, []);

  return { postMessage };
}

// Использование в компоненте
function NotificationCenter() {
  const handleMessage = useCallback((event) => {
    console.log('Новое уведомление:', event.data);
  }, []);

  const { postMessage } = useBroadcastChannel('notifications', handleMessage);

  return (
    <button onClick={() => postMessage({ type: 'ALERT', text: 'Важное сообщение!' })}>
      Отправить уведомление
    </button>
  );
}
```

## Сравнение с альтернативами

### localStorage + событие storage

```javascript
// Отправка
localStorage.setItem('broadcast', JSON.stringify({ type: 'UPDATE', data }));

// Получение
window.addEventListener('storage', (event) => {
  if (event.key === 'broadcast') {
    const message = JSON.parse(event.newValue);
    handleMessage(message);
  }
});
```

Недостатки: данные сохраняются на диск, нет поддержки воркеров, ограничен строками, требует ручного парсинга JSON и засоряет localStorage побочными значениями.

### SharedWorker

SharedWorker мощнее: он поддерживает централизованное состояние, маршрутизацию сообщений и сохраняет соединение между вкладками. Но требует отдельного файла воркера, сложнее в отладке и не поддерживается в Safari до версии 16. Используйте SharedWorker, когда нужна централизованная логика; Broadcast Channel подходит для простой трансляции событий.

### window.postMessage

`window.postMessage` требует явной ссылки на целевой контекст (окно или фрейм), что делает его неудобным для широковещательной рассылки по нескольким вкладкам. Broadcast Channel API не требует ссылок — достаточно совпадающего имени канала.

## Ограничения и нюансы

**Same-origin policy.** Каналы работают только в рамках одного origin. Вкладки `http://example.com` и `https://example.com` не могут общаться через один канал — протокол является частью origin.

**Отправитель не получает свои сообщения.** Это намеренное поведение, предотвращающее бесконечные циклы обратной связи.

**Нет гарантий доставки.** Если контекст закрыт или ещё не подключился к каналу в момент отправки, он не получит сообщение. Broadcast Channel работает по принципу fire-and-forget.

**Нет истории сообщений.** Новые контексты не получат сообщения, отправленные до их подключения к каналу.

**Структурированное клонирование.** Передаваемые данные должны поддерживать алгоритм структурированного клонирования. Функции, DOM-узлы и экземпляры с прототипными методами не передаются.

## Поддержка браузеров

Broadcast Channel API поддерживается во всех современных браузерах: Chrome 54+, Firefox 38+, Safari 15.4+, Edge 79+. Internet Explorer не поддерживается.

Для проверки поддержки перед использованием:

```javascript
if ('BroadcastChannel' in window) {
  const channel = new BroadcastChannel('my-channel');
  // работаем с каналом
} else {
  // полифилл или альтернативное решение
  console.warn('BroadcastChannel не поддерживается в этом браузере');
}
```

Если нужна поддержка старых браузеров, существуют полифиллы на основе localStorage, которые воспроизводят тот же интерфейс.

## Итог

Broadcast Channel API — простой и нативный способ организовать обмен сообщениями между вкладками, окнами и воркерами одного origin. Он устраняет необходимость в хаках с localStorage, не требует сложной настройки SharedWorker и органично вписывается в событийную модель браузера.

Используйте его для синхронизации состояния авторизации, трансляции обновлений данных, координации между воркерами и других сценариев, где нужно уведомить несколько контекстов об одном событии.

Глубже изучить JavaScript, включая работу с браузерными API и современные паттерны разработки, можно на курсе [JavaScript с нуля до про](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=broadcast-channel-api) на PurpleSchool.
