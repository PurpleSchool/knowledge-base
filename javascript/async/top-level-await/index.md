---
metaTitle: "Top-level await в JavaScript — ES2022"
metaDescription: "Как использовать top-level await в ES-модулях JavaScript: синтаксис, влияние на загрузку модулей, практические примеры и подводные камни."
author: "Антон Ларичев"
title: "JavaScript top-level await"
preview: "Top-level await позволяет использовать await на верхнем уровне ES-модуля без оборачивания в async-функцию. Разбираем как это работает и где применять."
---

## Что такое top-level await

Top-level await — это возможность использовать ключевое слово `await` непосредственно на верхнем уровне ES-модуля, без оборачивания в асинхронную функцию. Функциональность стандартизирована в ECMAScript 2022 и поддерживается во всех современных браузерах и в Node.js начиная с версии 14.8.

До появления top-level await, чтобы использовать `await` вне функции, разработчики прибегали к паттерну немедленно вызываемой асинхронной функции (IIFE):

```javascript
// До ES2022 — обходной путь
(async () => {
  const data = await fetch('/api/config').then(r => r.json());
  console.log(data);
})();
```

Теперь то же самое можно написать напрямую:

```javascript
// ES2022 — top-level await
const data = await fetch('/api/config').then(r => r.json());
console.log(data);
```

## Как это работает

### Только в ES-модулях

Top-level await работает **исключительно внутри ES-модулей** — файлы с расширением `.mjs`, файлы с `"type": "module"` в `package.json` или `<script type="module">` в браузере. В CommonJS-модулях (`require`/`module.exports`) он недоступен.

```javascript
// ES-модуль (module.mjs или при "type": "module" в package.json)
const response = await fetch('https://api.example.com/data');
const json = await response.json();

export { json };
```

Попытка использовать top-level await в CommonJS вызовет синтаксическую ошибку:

```javascript
// Ошибка в CommonJS
const data = await Promise.resolve(42); // SyntaxError: await is only valid in async functions
```

### Влияние на загрузку модулей

Ключевое свойство top-level await — он **блокирует выполнение импортирующего модуля** до завершения асинхронной операции. Граф зависимостей при этом работает следующим образом:

- Модуль с top-level await приостанавливает выполнение до разрешения промиса
- Все модули, которые импортируют этот модуль, тоже ждут его завершения
- Остальные независимые ветки графа зависимостей выполняются параллельно

```javascript
// moduleA.mjs
console.log('A: старт');
await new Promise(resolve => setTimeout(resolve, 1000));
console.log('A: завершён');
export const valueA = 'A';

// moduleB.mjs
console.log('B: старт');
export const valueB = 'B';

// main.mjs
import { valueA } from './moduleA.mjs';
import { valueB } from './moduleB.mjs';

// Порядок вывода в консоль:
// A: старт
// B: старт
// (через 1 секунду)
// A: завершён
// (затем выполняется main.mjs)
console.log(valueA, valueB); // 'A' 'B'
```

Модули A и B начинают загружаться параллельно, но `main.mjs` дожидается обоих прежде чем продолжить выполнение.

## Практические применения

### Инициализация конфигурации

Один из самых распространённых случаев — загрузка конфигурации перед экспортом значений из модуля:

```javascript
// config.mjs
let config;

try {
  const response = await fetch('/api/config');
  config = await response.json();
} catch {
  config = { theme: 'light', lang: 'ru' }; // значения по умолчанию
}

export { config };
```

```javascript
// app.mjs
import { config } from './config.mjs';

// config здесь гарантированно уже загружен
console.log(config.theme);
```

### Условный импорт модулей

Top-level await позволяет динамически выбирать реализацию в зависимости от условия:

```javascript
// i18n.mjs
const userLang = navigator.language.startsWith('ru') ? 'ru' : 'en';

const { messages } = await import(`./locales/${userLang}.mjs`);

export { messages };
```

```javascript
// polyfills.mjs
if (!globalThis.fetch) {
  await import('whatwg-fetch');
}

export {};
```

### Инициализация подключения к базе данных

В Node.js top-level await удобен для инициализации соединений перед стартом сервера:

```javascript
// db.mjs
import { createConnection } from './db-driver.mjs';

const connection = await createConnection({
  host: process.env.DB_HOST,
  port: 5432,
  database: 'myapp',
});

await connection.ping();

export { connection };
```

```javascript
// server.mjs
import { connection } from './db.mjs';
import express from 'express';

// К этому моменту соединение с БД уже установлено
const app = express();

app.get('/users', async (req, res) => {
  const users = await connection.query('SELECT * FROM users');
  res.json(users);
});

app.listen(3000);
```

### Загрузка тяжёлых зависимостей по условию

```javascript
// heavy-processor.mjs
const { processImage } = await (
  typeof ImageData !== 'undefined'
    ? import('./image-worker.mjs')
    : import('./image-fallback.mjs')
);

export { processImage };
```

## Обработка ошибок

Если промис на верхнем уровне отклоняется, это приводит к ошибке загрузки всего модуля. Импортирующий модуль получит ошибку при попытке использовать такой модуль. Поэтому важно оборачивать рискованные операции в `try/catch`:

```javascript
// Непойманная ошибка ломает весь модуль
const data = await fetch('/api/might-fail').then(r => r.json());
// Если запрос упадёт — модуль не загрузится вообще
```

```javascript
// Правильно — обрабатываем ошибку явно
let data = null;
try {
  data = await fetch('/api/might-fail').then(r => r.json());
} catch (error) {
  console.error('Не удалось загрузить данные:', error);
}

export { data };
```

Ошибку загрузки модуля с top-level await можно перехватить через динамический `import()`:

```javascript
// main.mjs
try {
  const module = await import('./risky-module.mjs');
  console.log(module.data);
} catch (error) {
  console.error('Модуль не загрузился:', error);
}
```

## Подводные камни

### Циклические зависимости

Top-level await в сочетании с циклическими зависимостями может привести к взаимоблокировке. Если модуль A ждёт завершения модуля B, а модуль B ждёт завершения модуля A — оба зависнут навсегда. Избегайте top-level await в модулях, которые участвуют в циклических зависимостях.

### Последовательность вместо параллельности

Внутри ES-модуля `await` работает последовательно так же, как и в обычной async-функции:

```javascript
// Медленно: запросы выполняются последовательно
const users = await fetchUsers();
const posts = await fetchPosts();

// Быстро: запросы выполняются параллельно
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);

export { users, posts };
```

### Производительность загрузки страницы

Чрезмерное использование top-level await в браузерных модулях может замедлить начальную загрузку страницы — каждый зависимый модуль вынужден ждать завершения асинхронных операций. Выносите медленные инициализации в модули, которые загружаются лениво (по требованию).

```javascript
// Плохо: тяжёлый модуль блокирует всё дерево зависимостей
import { heavyChart } from './heavy-chart-lib.mjs'; // heavy-chart-lib использует top-level await

// Лучше: загружаем по требованию
const loadChart = async () => {
  const { heavyChart } = await import('./heavy-chart-lib.mjs');
  return heavyChart;
};
```

## Настройка Node.js

Чтобы использовать top-level await в Node.js, необходимо убедиться, что файл является ES-модулем.

Через `package.json`:

```json
{
  "type": "module"
}
```

Или через расширение файла:

```bash
# Файл должен называться script.mjs
node script.mjs
```

Или через флаг при передаче кода через stdin:

```bash
node --input-type=module <<EOF
const data = await Promise.resolve(42);
console.log(data);
EOF
```

## Поддержка окружений

| Окружение | Версия с поддержкой |
|---|---|
| Chrome | 89+ |
| Firefox | 89+ |
| Safari | 15+ |
| Node.js | 14.8+ (только ESM) |
| Deno | Полная |
| Bun | Полная |

## Сравнение с паттернами до ES2022

```javascript
// Паттерн 1: IIFE
let config;
(async () => {
  config = await loadConfig();
  startApp(config); // логика запуска вынуждена быть внутри IIFE
})();
```

```javascript
// Паттерн 2: цепочка .then()
loadConfig()
  .then(config => startApp(config))
  .catch(console.error);
```

```javascript
// Паттерн 3: top-level await — линейный и читаемый
const config = await loadConfig();
startApp(config);
```

Top-level await устраняет необходимость в обходных путях и делает асинхронный код на верхнем уровне модуля таким же читаемым, как синхронный, при этом не меняя семантику работы с промисами.

Чтобы глубже разобраться с асинхронным JavaScript и освоить современные возможности языка, пройдите курс на PurpleSchool: [JavaScript с нуля до профи](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=top-level-await).