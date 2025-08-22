---
metaTitle: Интеграция Express и React полное руководство
metaDescription: Пошаговая инструкция по интеграции Express и React - создание единого приложения с сервером на Node и клиентом на React развертывание роутинг SSR API
author: Олег Марков
title: Интеграция Express и React
preview: Разберитесь как связать Express и React в монорепозиторий или едином приложении настройте взаимодействие API и клиента используйте SSR реализуйте продвинутые сценарии интеграции
---

## Введение

При разработке современных веб-приложений часто необходимо объединить мощный сервер на Node.js и Express с гибким и отзывчивым фронтендом на React. Такая архитектура позволяет разместить серверное API и клиентское приложение в единой структуре проекта, делая интеграцию проще, оптимизируя деплой и упрощая разработку.

В этой статье я помогу вам разобраться в практических аспектах организации взаимодействия между Express и React. Мы подробно рассмотрим, как создать монолитное приложение, как организовать маршрутизацию, передачу данных, использовать возможности Server-Side Rendering (SSR), а также разберем отдельно плюсы и минусы разных подходов интеграции.

## Краткий обзор — почему интегрировать Express и React вместе

Express — это облегчённый, гибкий и быстрый фреймворк для создания серверов и API на Node.js. React — декларативная, компонентная библиотека для создания пользовательских интерфейсов. Оба инструмента часто используют вместе: Express предоставляет серверную логику и API, React отрисовывает UI на стороне клиента или сервера.

Главные сценарии для объединения:

- Создание универсальных (isomorphic) приложений – например, с SSR для SEO и быстрого первого рендеринга.
- Централизация API (Express) и клиента (React) для упрощения разработки, тестирования и деплоя.
- Более простой обмен данными между клиентом и сервером без CORS и необходимости в раздельном деплое.

Теперь разберем, как выстроить такую интеграцию шаг за шагом.

## Основы интеграции Express и React

### Структура проекта: монорепозиторий или раздельные папки

Сначала определим структуру. Чаще всего используют следующий вариант:

```
/my-app
  /client     // React
  /server     // Express
```

Код React хранится в папке `/client`, серверный Express — в `/server`. Иногда простые проекты объединяют код в одну директорию, но разделение — более универсальный вариант.

Пример `package.json` в корне проекта с workspace:

```json
{
  "name": "my-app",
  "private": true,
  "workspaces": ["client", "server"]
}
```

### Настройка React-приложения

В папке `client` разворачиваем стандартное приложение React. Используйте Create React App или Vite — оба варианта подходят:

```bash
npx create-react-app client
# или для Vite
npm create vite@latest client -- --template react
```

В результате у вас будет входная точка, например, `client/src/index.js`.

### Настройка Express-сервера

В папке `server` инициализируем Node.js-приложение и ставим Express:

```bash
mkdir server
cd server
npm init -y
npm install express
```

Создайте файл `server/index.js`:

```js
const express = require('express');
const path = require('path');
const app = express();

// Будем использовать порт 5000 для сервера
const PORT = process.env.PORT || 5000;

// Здесь мы настраиваем API роуты
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Привет из Express!' });
});

// Результат сборки React-приложения будет размещаться в build
app.use(express.static(path.join(__dirname, '../client/build')));

// Все остальные запросы (кроме /api) отдаём index.html React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Express сервер запущен на порту ${PORT}`);
});
```

**Пояснения:**
- Мы создали простой API-эндпойнт `/api/hello`.
- Для всех остальных запросов отдаётся статика React-приложения.
- Такой подход работает при "продакшен-сборке" React (`npm run build`).

### Связь между клиентом (React) и сервером (Express)

Когда вы разрабатываете локально, React (на порту 3000) "общается" с Express (на порту 5000) через прокси.

Чтобы упростить работу с API, добавьте в `client/package.json` строку:

```json
"proxy": "http://localhost:5000"
```

Теперь при обращении к `/api/...` из React, запрос проксируется к Express.

**Пример запроса в React:**

```js
// client/src/App.js

import React, { useEffect, useState } from 'react';

function App() {
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    // Такой запрос при сборке проксируется к localhost:5000/api/hello
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => setApiMessage(data.message));
  }, []);

  return (
    <div>
      <h1>Express + React Integration</h1>
      <p>Сообщение с сервера: {apiMessage}</p>
    </div>
  );
}

export default App;
```
**Пояснения:**
- React отправляет запрос на `/api/hello`, в разработке прокси передаёт его Express.
- В продакшене ваш Express сервер сам отдаёт и статику, и API.

### Сборка и запуск в продакшене

1. Соберите React-приложение:
   ```bash
   cd client
   npm run build
   ```

2. Перейдите в папку сервера и запустите Express:
   ```bash
   cd ../server
   node index.js
   ```

3. Теперь все запросы (кроме `/api`) отдаются как index.html сборки React.

### Важные нюансы прокси в разработке

- `proxy` работает только в режиме разработки и только с Create React App (CRA). Vite и другие сборщики требуют отдельного конфига (например, `vite.config.js` с настройками прокси).
- Для сложных сценариев используйте CORS middleware (`npm install cors`) на стороне Express.

### SSR (Server-Side Rendering) с Express и React

Если ваша задача — не только отдавать API, но и рендерить React на сервере, например, для SEO или быстрого Time To First Byte, рассмотрите SSR.

Для реализации SSR понадобится рендерить React-компоненты с помощью `react-dom/server`:

#### Установка дополнительных библиотек:

```bash
npm install react react-dom
npm install @babel/register @babel/preset-env @babel/preset-react
```

#### Пример минимальной настройки сервера с SSR:

Создайте компонент:

```js
// client/App.js
import React from 'react';

function App(props) {
  return (
    <div>
      <h1>SSR с React и Express</h1>
      <p>Данные с сервера: {props.serverData}</p>
    </div>
  );
}

export default App;
```

Серверный код для SSR:

```js
// server/ssrIndex.js

require('@babel/register')({
  presets: ['@babel/preset-env', '@babel/preset-react'],
});

const express = require('express');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const App = require('../client/App').default;

const app = express();
const PORT = 5000;

app.use(express.static(path.resolve(__dirname, '../client/build')));

app.get('/', (req, res) => {
  // Пример передачи данных напрямую в React-компонент
  const serverData = 'Это данные, пришедшие с сервера';
  const appHtml = ReactDOMServer.renderToString(<App serverData={serverData} />);

  // Минимальный html-шаблон
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Express + React SSR</title>
      </head>
      <body>
        <div id="root">${appHtml}</div>
        <script>
          // Можно пробросить данные для гидратации в window.__INITIAL_DATA__
          window.__INITIAL_DATA__ = ${JSON.stringify(serverData)};
        </script>
        <script src="/static/js/main.js"></script>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log('SSR-сервер на порту', PORT);
});
```

#### Важные моменты SSR:

- Не забудьте о гидратации на клиенте — используйте `ReactDOM.hydrate`.
- Для сложных приложений часто используют Next.js, но руками можно сделать свой SSR, как показано выше.
- SSR усложняет логику хранения состояния приложения, но позволяет добиваться максимальной производительности и SEO.

### Роутинг: деление на серверные и клиентские маршруты

- Все, что начинается с `/api` — передаём Express для обработки API.
- Остальные запросы (спа-роутинг React: `/`, `/about`, `/profile/123`) всегда должны возвращать index.html.

Вот пример обработки на сервере:

```js
// ...
app.get('/api/*', apiRouter); // только API

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});
```

### Общие рекомендации и best practices

- **Храните переменные окружения** отдельно для клиента и сервера. Для React используются переменные с префиксом `REACT_APP_` в `.env`, для Express — любые.
- **Используйте единый package.json в корне** для монорепозиториев.
- **Подключайте middleware для CORS** только если клиент и сервер работают на разных портах в продакшене.
- **Не храните чувствительную логику в клиентском коде** — только сервер должен обрабатывать приватные данные.
- **Добавляйте логгирование и обработку ошибок** как для Express, так и для React.

## Заключение

Вы ознакомились с основными подходами и практическими примерами интеграции Express и React. Мы рассмотрели общую структуру проекта, взаимодействие через прокси, передачу данных, базовую серверную маршрутизацию, основы SSR, а также нюансы работы с API и статикой.

Этот подход позволяет максимально эффективно использовать возможности обеих технологий, создавая производительные и легко масштабируемые приложения. Выберите тот способ интеграции, который больше подходит вашей задаче — будь то полностью разделённая инфраструктура или монолитный проект.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как добавить поддержку TypeScript для Express и React вместе?

1. Инициализируйте TypeScript в каждом из пакетов: `npx tsc --init` в `client` и `server`.
2. Установите типы: для сервера — `npm install @types/express`, для клиента — `npm install @types/react @types/react-dom`.
3. Переименуйте файлы на .ts/.tsx и настройте сборку (например, используйте Vite для клиента).

### Как настроить Hot Reloading для сервера и клиента?

Для клиента используйте Create React App или Vite — Hot Reload уже включен. Для Express-сервера установите `nodemon`:
```
npm install -g nodemon
nodemon index.js
```
Можно запускать оба через один скрипт с `concurrently`.

### Как обеспечить безопасную передачу переменных окружения?

Для Express используйте `.env` и библиотеку `dotenv`. Для React только переменные с префиксом `REACT_APP_` попадут в клиентский код.

### Как совместить SSR и REST API в одном сервере?

Инкапсулируйте API-роуты (`/api/*`) отдельно, остальные запросы обрабатывайте SSR-логикой. Например:
```js
app.use('/api', apiRouter);
app.get('*', ssrHandler);
```

### Как деплоить такое приложение на Vercel или Heroku?

Heroku: корневой Procfile с командой запуска серверного файла (например, `web: node server/index.js`). Заранее соберите React (`npm run build` в client).
Vercel: используйте `vercel.json` для настройки serverless функций, или выбирайте шаблоны Monorepo.