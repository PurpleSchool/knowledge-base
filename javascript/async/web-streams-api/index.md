---
metaTitle: "Web Streams API в JavaScript — полное руководство"
metaDescription: "Web Streams API: ReadableStream, WritableStream, TransformStream. Как работать с потоками данных в браузере и Node.js с примерами кода."
author: "Антон Ларичев"
title: "Web Streams API в JavaScript"
preview: "Разбираем Web Streams API: читаемые, записываемые и трансформирующие потоки, piping и практические сценарии применения."
---

## Что такое Web Streams API

Web Streams API — это стандартизированный интерфейс для работы с потоками данных в JavaScript. Потоки позволяют обрабатывать данные по частям (чанками) по мере их поступления, не дожидаясь полной загрузки. Это особенно важно при работе с большими файлами, сетевыми ответами или данными в реальном времени.

До появления Streams API разработчики были вынуждены либо загружать данные целиком в память, либо использовать нестандартные решения. Теперь браузеры и Node.js (начиная с v16) поддерживают единый API, совместимый со спецификацией WHATWG.

API состоит из трёх основных типов потоков:

- **ReadableStream** — поток для чтения данных
- **WritableStream** — поток для записи данных
- **TransformStream** — поток для преобразования данных на лету

## ReadableStream

`ReadableStream` представляет источник данных, из которого можно читать. Именно его возвращает `fetch()` в свойстве `response.body`.

### Чтение через Reader

Самый низкоуровневый способ — получить `ReadableStreamDefaultReader` и читать чанки вручную:

```javascript
async function readStream(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    result += decoder.decode(value, { stream: true });
    console.log('Получено байт:', value.byteLength);
  }

  return result;
}
```

Метод `reader.read()` возвращает промис с объектом `{ done, value }`. Когда поток исчерпан, `done` становится `true`. Значение `value` — это `Uint8Array` с очередным чанком данных.

### Создание собственного ReadableStream

Вы можете создать поток с нуля, передав объект с методами `start`, `pull` и `cancel`:

```javascript
function createCounterStream(max) {
  let count = 0;

  return new ReadableStream({
    start(controller) {
      // Вызывается при создании потока
      console.log('Поток запущен');
    },

    pull(controller) {
      // Вызывается, когда потребитель готов получить следующий чанк
      if (count < max) {
        controller.enqueue(count++);
      } else {
        controller.close();
      }
    },

    cancel(reason) {
      console.log('Поток отменён:', reason);
    }
  });
}

const stream = createCounterStream(5);
const reader = stream.getReader();

(async () => {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(value); // 0, 1, 2, 3, 4
  }
})();
```

Метод `controller.enqueue()` помещает данные в очередь потока, `controller.close()` сигнализирует о завершении, а `controller.error()` — об ошибке.

### Асинхронный итератор

Современные среды поддерживают итерирование потока через `for await...of`:

```javascript
async function processStream(stream) {
  const decoder = new TextDecoder();

  for await (const chunk of stream) {
    console.log(decoder.decode(chunk));
  }
}

const response = await fetch('/api/data');
await processStream(response.body);
```

Это значительно чище, чем ручное управление ридером.

## WritableStream

`WritableStream` принимает данные и записывает их в назначение — файл, сокет, DOM-элемент или любую другую цель.

```javascript
function createLogStream() {
  return new WritableStream({
    start(controller) {
      console.log('Запись начата');
    },

    write(chunk, controller) {
      // Вызывается для каждого чанка
      console.log('[LOG]', chunk);
    },

    close() {
      console.log('Запись завершена');
    },

    abort(reason) {
      console.error('Запись прервана:', reason);
    }
  });
}

const logStream = createLogStream();
const writer = logStream.getWriter();

await writer.write('Первое сообщение');
await writer.write('Второе сообщение');
await writer.close();
```

Обратите внимание: `writer.write()` возвращает промис, который разрешается, когда запись обработана. Это позволяет управлять обратным давлением (backpressure).

### Backpressure

Одна из ключевых концепций Streams API — обратное давление. Если производитель генерирует данные быстрее, чем потребитель их обрабатывает, нужен механизм замедления производителя.

```javascript
const writer = writableStream.getWriter();

async function writeWithBackpressure(data) {
  for (const chunk of data) {
    // Ждём, пока внутренняя очередь не освободится
    await writer.ready;
    await writer.write(chunk);
  }

  await writer.close();
}
```

Свойство `writer.ready` — это промис, который разрешается, когда поток готов принять новые данные. Использование его перед каждой записью предотвращает переполнение буфера.

## TransformStream

`TransformStream` — это дуплексный поток: он одновременно читает данные на входе и выдаёт преобразованные данные на выходе. Идеален для операций вроде сжатия, шифрования или парсинга.

```javascript
function createUpperCaseTransform() {
  return new TransformStream({
    transform(chunk, controller) {
      // Получаем строку, отдаём в верхнем регистре
      controller.enqueue(chunk.toUpperCase());
    },

    flush(controller) {
      // Вызывается, когда входной поток завершился
      console.log('Трансформация завершена');
    }
  });
}

const { readable, writable } = createUpperCaseTransform();

const writer = writable.getWriter();
const reader = readable.getReader();

await writer.write('hello');
await writer.write('world');
await writer.close();

const chunks = [];
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  chunks.push(value);
}

console.log(chunks); // ['HELLO', 'WORLD']
```

`TransformStream` предоставляет два свойства — `readable` и `writable`, которые являются экземплярами соответствующих типов потоков.

## Цепочки потоков: pipeThrough и pipeTo

Настоящая сила Streams API раскрывается при создании цепочек. Методы `pipeThrough()` и `pipeTo()` позволяют соединять потоки в конвейер.

### pipeThrough

Подключает `TransformStream` к `ReadableStream` и возвращает новый `ReadableStream`:

```javascript
async function fetchAndDecode(url) {
  const response = await fetch(url);

  const decodedStream = response.body
    .pipeThrough(new TextDecoderStream());

  let result = '';
  for await (const chunk of decodedStream) {
    result += chunk;
  }

  return result;
}
```

`TextDecoderStream` — встроенный трансформирующий поток, который декодирует байты в строку. Аналогично работает `TextEncoderStream` в обратную сторону.

### pipeTo

Подключает `ReadableStream` к `WritableStream` и возвращает промис, который разрешается по завершении:

```javascript
async function downloadToStorage(url) {
  const response = await fetch(url);

  const fileStream = new WritableStream({
    write(chunk) {
      // Сохраняем чанк в хранилище
      storage.append(chunk);
    }
  });

  await response.body.pipeTo(fileStream);
  console.log('Загрузка завершена');
}
```

### Полный конвейер

Пример с несколькими трансформациями:

```javascript
function createJsonParser() {
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
    },
    flush(controller) {
      try {
        controller.enqueue(JSON.parse(buffer));
      } catch (e) {
        controller.error(new Error('Невалидный JSON'));
      }
    }
  });
}

async function fetchJson(url) {
  const response = await fetch(url);

  const [parsed] = await response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(createJsonParser())
    .pipeTo(
      new WritableStream({
        write(data) {
          console.log('Данные:', data);
        }
      })
    );
}
```

## Работа с потоковыми ответами

Практический сценарий — стриминг от LLM или SSE-эндпоинта:

```javascript
async function streamChatResponse(prompt) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader();

  const output = document.getElementById('output');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Добавляем текст по мере поступления
    output.textContent += value;
  }
}
```

## Tee: разветвление потока

Метод `tee()` создаёт два независимых потока из одного. Оба получат одинаковые данные:

```javascript
async function fetchWithLogging(url) {
  const response = await fetch(url);
  const [streamForUse, streamForLog] = response.body.tee();

  // Логируем трафик
  streamForLog.pipeTo(new WritableStream({
    write(chunk) {
      console.log('Байт получено:', chunk.byteLength);
    }
  }));

  // Используем данные
  const text = await new Response(streamForUse).text();
  return text;
}
```

Важно: после вызова `tee()` исходный поток заблокирован — читать из него напрямую уже нельзя.

## Контроль потока через AbortController

Потоки можно отменять с помощью `AbortController`:

```javascript
async function cancellableStream(url) {
  const controller = new AbortController();
  const { signal } = controller;

  // Отмена через 5 секунд
  setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal });
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log('Чанк:', value);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Загрузка отменена');
    } else {
      throw err;
    }
  }
}
```

## Встроенные трансформирующие потоки

Браузеры предоставляют несколько готовых трансформеров:

```javascript
// Декодирование байтов в строку
const decoder = new TextDecoderStream('utf-8');

// Кодирование строки в байты
const encoder = new TextEncoderStream();

// Сжатие (gzip, deflate, deflate-raw)
const compressor = new CompressionStream('gzip');

// Распаковка
const decompressor = new DecompressionStream('gzip');

// Пример: сжатие данных на лету
async function compressData(data) {
  const stream = new Blob([data]).stream();

  const compressedStream = stream.pipeThrough(
    new CompressionStream('gzip')
  );

  const chunks = [];
  for await (const chunk of compressedStream) {
    chunks.push(chunk);
  }

  return new Blob(chunks);
}
```

## Совместимость с Node.js

Starting with Node.js 18, Web Streams API доступен глобально без импортов. В Node.js 16 нужен явный импорт:

```javascript
// Node.js 16
import {
  ReadableStream,
  WritableStream,
  TransformStream
} from 'node:stream/web';

// Node.js 18+
// Все классы доступны глобально
```

Node.js также предоставляет утилиты для конвертации между Web Streams и Node.js Streams:

```javascript
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

// Из Node.js Stream в Web Stream
const nodeStream = fs.createReadStream('file.txt');
const webStream = Readable.toWeb(nodeStream);

// Из Web Stream в Node.js Stream
const nodeReadable = Readable.fromWeb(webStream);
```

## Практический пример: прогресс загрузки файла

```javascript
async function downloadWithProgress(url, onProgress) {
  const response = await fetch(url);
  const contentLength = response.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength) : null;

  let loaded = 0;
  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    loaded += value.byteLength;

    if (total) {
      onProgress(Math.round((loaded / total) * 100));
    }
  }

  const allChunks = new Uint8Array(loaded);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.byteLength;
  }

  return new Blob([allChunks]);
}

// Использование
const blob = await downloadWithProgress(
  '/large-file.zip',
  percent => console.log(`Загружено: ${percent}%`)
);
```

## Итог

Web Streams API — мощный инструмент для обработки данных порциями без лишней нагрузки на память. Ключевые концепции:

- `ReadableStream` — источник данных, читается через `getReader()` или `for await...of`
- `WritableStream` — приёмник данных, пишется через `getWriter()`
- `TransformStream` — преобразователь, имеет `readable` и `writable` стороны
- `pipeThrough()` — цепочка трансформеров
- `pipeTo()` — финальная запись в `WritableStream`
- `tee()` — разветвление потока на два
- Backpressure через `writer.ready` предотвращает переполнение буфера

API особенно полезен при работе с `fetch`, стриминговыми ответами, загрузкой файлов и потоковой обработкой больших данных.

Чтобы уверенно работать с асинхронным JavaScript и современными браузерными API, рекомендуем курс [JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=web-streams-api).