---
metaTitle: "JavaScript Web Workers: фоновые потоки в браузере"
metaDescription: "Что такое Web Workers в JavaScript, как создать воркер, передавать данные через postMessage и избежать блокировки главного потока."
author: "Антон Ларичев"
title: "JavaScript Web Workers"
preview: "Web Workers позволяют запускать тяжёлые вычисления в фоновом потоке, не блокируя интерфейс пользователя."
---

## Зачем нужны Web Workers

JavaScript — однопоточный язык. Весь код браузерного приложения: обработка событий, рендеринг DOM, пользовательские скрипты — выполняется в одном потоке, который называется главным (main thread). Если в этом потоке запустить долгую операцию, браузер перестаёт реагировать на действия пользователя: интерфейс «замерзает», анимации останавливаются.

Пример блокирующего кода:

```javascript
function heavyCalculation() {
  let result = 0;
  for (let i = 0; i < 2_000_000_000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

document.getElementById('btn').addEventListener('click', () => {
  const result = heavyCalculation(); // UI заморожен на несколько секунд
  console.log(result);
});
```

Web Workers решают эту проблему, предоставляя возможность выполнять JavaScript-код в отдельном фоновом потоке операционной системы. Воркер работает параллельно с главным потоком и общается с ним через обмен сообщениями.

## Как работает Web Worker

Каждый воркер — это отдельный глобальный контекст выполнения, изолированный от главного потока. У него нет доступа к `window`, `document` и DOM. Зато доступны:

- `self` — глобальный объект воркера (аналог `window`)
- `fetch`, `XMLHttpRequest` — сетевые запросы
- `setTimeout`, `setInterval`
- `IndexedDB`
- `crypto`, `performance`
- Большинство стандартных встроенных объектов (`Array`, `Map`, `Promise` и т.д.)

Общение между главным потоком и воркером происходит через метод `postMessage` и обработчик события `message`. Данные при передаче **копируются** (по умолчанию), а не передаются по ссылке.

## Создание Web Worker

Воркер создаётся из файла JavaScript с помощью конструктора `Worker`.

Файл `worker.js`:

```javascript
// Обработчик входящих сообщений от главного потока
self.onmessage = function(event) {
  const { data } = event;
  const result = heavyCalculation(data.limit);
  self.postMessage({ result });
};

function heavyCalculation(limit) {
  let sum = 0;
  for (let i = 0; i < limit; i++) {
    sum += Math.sqrt(i);
  }
  return sum;
}
```

Файл `main.js`:

```javascript
const worker = new Worker('worker.js');

// Отправляем задание воркеру
worker.postMessage({ limit: 2_000_000_000 });

// Получаем результат — главный поток не заблокирован
worker.onmessage = function(event) {
  console.log('Результат:', event.data.result);
};

worker.onerror = function(error) {
  console.error('Ошибка в воркере:', error.message);
};
```

Теперь тяжёлые вычисления выполняются в фоне, и UI остаётся отзывчивым.

## Inline Worker через Blob

Если нет возможности выносить код воркера в отдельный файл (например, при работе с бандлерами или для простых случаев), можно создать воркер прямо в коде через `Blob` и `URL.createObjectURL`:

```javascript
const workerCode = `
  self.onmessage = function(event) {
    const numbers = event.data;
    const sorted = numbers.slice().sort((a, b) => a - b);
    self.postMessage(sorted);
  };
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);
const worker = new Worker(workerUrl);

worker.postMessage([5, 2, 8, 1, 9, 3]);
worker.onmessage = (e) => {
  console.log('Отсортировано:', e.data); // [1, 2, 3, 5, 8, 9]
  URL.revokeObjectURL(workerUrl); // освобождаем память
};
```

## Двусторонний обмен сообщениями

Воркер и главный поток могут обмениваться данными в любом направлении в любое время.

```javascript
// worker.js
self.onmessage = function(event) {
  const { type, payload } = event.data;

  if (type === 'START') {
    // Отправляем промежуточные обновления прогресса
    for (let i = 0; i <= 100; i += 10) {
      self.postMessage({ type: 'PROGRESS', value: i });
    }
    const result = doWork(payload);
    self.postMessage({ type: 'DONE', result });
  }
};

function doWork(data) {
  return data.reduce((acc, n) => acc + n, 0);
}
```

```javascript
// main.js
const worker = new Worker('worker.js');

worker.onmessage = function(event) {
  const { type, value, result } = event.data;

  if (type === 'PROGRESS') {
    progressBar.style.width = value + '%';
  } else if (type === 'DONE') {
    console.log('Итог:', result);
    worker.terminate();
  }
};

worker.postMessage({
  type: 'START',
  payload: [1, 2, 3, 4, 5]
});
```

## Transferable Objects — передача без копирования

По умолчанию данные между потоками **копируются** через алгоритм структурированного клонирования. Для больших объектов (например, `ArrayBuffer` с изображением) это дорого по памяти и времени.

**Transferable objects** позволяют передать владение объектом без копирования. После передачи исходный объект становится недоступным в отправляющем потоке.

```javascript
// main.js
const buffer = new ArrayBuffer(1024 * 1024 * 50); // 50 МБ

// Второй аргумент — список передаваемых объектов
worker.postMessage({ buffer }, [buffer]);

console.log(buffer.byteLength); // 0 — владение передано воркеру
```

```javascript
// worker.js
self.onmessage = function(event) {
  const { buffer } = event.data;
  // Обрабатываем данные
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) {
    view[i] = view[i] * 2;
  }
  // Возвращаем обратно
  self.postMessage({ buffer }, [buffer]);
};
```

Transferable objects поддерживают: `ArrayBuffer`, `MessagePort`, `ImageBitmap`, `OffscreenCanvas`, `ReadableStream`, `WritableStream`.

## Обработка ошибок

Ошибки в воркере перехватываются через обработчик `onerror` в главном потоке или через `addEventListener('error', ...)` внутри самого воркера.

```javascript
// main.js
worker.onerror = function(event) {
  console.error('Файл:', event.filename);
  console.error('Строка:', event.lineno);
  console.error('Сообщение:', event.message);
  event.preventDefault(); // не пробрасывать ошибку дальше
};

// Также можно ловить необработанные промисы
worker.addEventListener('messageerror', function(event) {
  console.error('Ошибка десериализации сообщения:', event);
});
```

Внутри воркера можно использовать стандартный `try/catch` для синхронного кода и обрабатывать отклонения промисов через `self.addEventListener('unhandledrejection', ...)`:

```javascript
// worker.js
self.addEventListener('unhandledrejection', function(event) {
  self.postMessage({ type: 'ERROR', message: event.reason.message });
  event.preventDefault();
});

self.onmessage = async function(event) {
  try {
    const result = await riskyOperation(event.data);
    self.postMessage({ type: 'OK', result });
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: err.message });
  }
};
```

## Завершение работы воркера

Воркер занимает ресурсы. Когда работа выполнена, его нужно завершить.

Из главного потока:

```javascript
worker.terminate(); // немедленное завершение
```

Изнутри воркера:

```javascript
self.close(); // воркер завершает себя сам
```

Практика: создавайте воркер по требованию и завершайте после получения результата, либо используйте пул воркеров для переиспользования.

## Практический пример: обработка изображения

Типичный сценарий — обработка пикселей изображения без заморозки UI.

```javascript
// image-worker.js
self.onmessage = function(event) {
  const { imageData } = event.data;
  const data = imageData.data; // Uint8ClampedArray

  // Применяем фильтр «оттенки серого»
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // data[i + 3] — альфа, не меняем
  }

  self.postMessage({ imageData }, [imageData.data.buffer]);
};
```

```javascript
// main.js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const img = document.getElementById('source-image');

ctx.drawImage(img, 0, 0);
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const worker = new Worker('image-worker.js');
worker.postMessage({ imageData }, [imageData.data.buffer]);

worker.onmessage = function(event) {
  ctx.putImageData(event.data.imageData, 0, 0);
  worker.terminate();
};
```

## Практический пример: парсинг большого JSON

```javascript
// json-worker.js
self.onmessage = function(event) {
  const { jsonString } = event.data;
  try {
    const parsed = JSON.parse(jsonString);
    const processed = parsed.items.map(item => ({
      id: item.id,
      name: item.name.trim().toUpperCase(),
      value: item.price * item.quantity,
    }));
    self.postMessage({ result: processed });
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
```

```javascript
// main.js
async function processLargeFile(url) {
  const response = await fetch(url);
  const jsonString = await response.text(); // не парсим в главном потоке

  return new Promise((resolve, reject) => {
    const worker = new Worker('json-worker.js');
    worker.postMessage({ jsonString });
    worker.onmessage = (e) => {
      worker.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.result);
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message));
    };
  });
}
```

## Shared Workers

Обычный `Worker` привязан к одной вкладке. `SharedWorker` может использоваться несколькими вкладками или фреймами одного источника одновременно.

```javascript
// shared-worker.js
const connections = [];

self.onconnect = function(event) {
  const port = event.ports[0];
  connections.push(port);

  port.onmessage = function(e) {
    // Рассылаем сообщение всем подключённым вкладкам
    const message = `Вкладка сообщает: ${e.data}`;
    connections.forEach(p => p.postMessage(message));
  };

  port.start();
};
```

```javascript
// main.js (в каждой вкладке)
const worker = new SharedWorker('shared-worker.js');

worker.port.onmessage = function(event) {
  console.log(event.data);
};

worker.port.start();
worker.port.postMessage('Привет от вкладки!');
```

`SharedWorker` удобен для синхронизации данных между вкладками, хотя на практике для этой задачи чаще используют `BroadcastChannel` или `localStorage` + `storage` event.

## Ограничения Web Workers

Несмотря на полезность, у воркеров есть важные ограничения:

- Нет доступа к DOM и `window` — нельзя напрямую менять интерфейс
- Нет доступа к `localStorage` и `sessionStorage`
- `document` недоступен
- Создание воркера требует отдельного файла или Blob (в классическом режиме)
- Воркеры живут в одном источнике (same-origin) — нельзя загрузить воркер с другого домена
- Отладка сложнее, чем для кода в главном потоке (DevTools вкладка Workers)

## Когда использовать Web Workers

Web Workers оправданы, когда задача занимает более 50 мс и должна выполняться без блокировки UI:

- Тяжёлые математические вычисления (криптография, симуляции, сжатие)
- Парсинг и трансформация больших массивов данных
- Обработка изображений и аудио
- Поиск по большим наборам данных
- Компиляция кода или шаблонов на клиенте

Для коротких задач, которые выполняются быстро, накладные расходы на создание воркера и сериализацию данных не оправданы — в таких случаях достаточно `setTimeout` или разбивки задачи через `requestIdleCallback`.

## Итог

Web Workers — ключевой инструмент для создания производительных браузерных приложений. Они позволяют вынести дорогостоящие операции из главного потока, сохранив UI отзывчивым. Основные принципы работы: создание воркера через `new Worker()`, обмен данными через `postMessage`/`onmessage`, эффективная передача больших буферов через Transferable objects и корректное завершение через `terminate()` или `close()`.

Чтобы освоить JavaScript глубоко — от базовых концепций до продвинутых браузерных API — пройдите курс на PurpleSchool: [JavaScript с нуля до профессионала](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=web-workers).