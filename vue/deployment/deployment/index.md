---
metaTitle: Деплой Vue приложения - ключевые стратегии и практики
metaDescription: Детальное руководство по деплою Vue приложений - от сборки и настройки окружения до деплоя на GitHub Pages Vercel Render и собственный сервер
author: Олег Марков
title: Деплой Vue приложения - полное руководство по deployment
preview: Узнайте как подготовить и задеплоить Vue приложение - разберем разные платформы настройки окружения и типичные ошибки при публикации фронтенда
---

## Введение

Деплой Vue приложения — это процесс превращения вашего кода, который сейчас работает у вас локально в режиме разработки, в готовый продукт, доступный пользователям через интернет. На практике это цепочка шагов: сборка проекта, подготовка окружения, загрузка артефактов на сервер или платформу, настройка домена и проверка работы.

Здесь я покажу вам, как подойти к деплою Vue пошагово, чтобы вы понимали не только «куда нажать», но и что именно происходит. Мы разберем:

- чем режим разработки отличается от production-сборки;
- как собрать Vue-приложение с помощью Vue CLI и Vite;
- как задеплоить проект на статический хостинг (GitHub Pages, Netlify, Vercel);
- как выложить приложение на обычный VPS (Nginx + Node.js или только Nginx со статикой);
- как настроить переменные окружения;
- как обрабатывать все маршруты SPA на стороне сервера.

По ходу статьи я буду добавлять примеры конфигураций и команд, а рядом пояснять, зачем каждая настройка нужна.  

---

## Что такое деплой Vue приложения с практической точки зрения

### Режим разработки vs production

Когда вы запускаете `npm run serve` или `npm run dev`, Vue-проект работает в режиме разработки:

- код хранится в виде модулей, собирается «на лету»;
- включены source maps и расширенные ошибки;
- включен hot-reload;
- нет агрессивной минификации и оптимизации.

Продакшн-режим отличается:

- собирается статический бандл (обычно в папку `dist`);
- код минифицируется и разбивается на чанки;
- убираются dev-проверки, предупреждения, инструменты для разработки;
- включаются оптимизации для загрузки в браузер.

Деплой Vue чаще всего сводится к тому, что вы:

1. выполняете production-сборку;
2. загружаете содержимое папки `dist` на сервер / хостинг;
3. настраиваете сервер, чтобы он корректно отдавал файлы и обрабатывал все маршруты вашего SPA.

---

## Подготовка проекта к деплою

### Структура Vue-проекта перед публикацией

Обычно у вас есть что-то вроде:

- `src/` — исходный код;
- `public/` — статика, попадающая в корень сборки;
- `package.json` — скрипты, зависимости;
- конфиг сборщика (`vue.config.js` или `vite.config.js`);
- папка `dist/` — появляется после сборки.

Ваша задача при деплое — работать именно с `dist`. В нее попадают:

- `index.html` — точка входа;
- `assets/` — стили, скрипты, картинки;
- иногда `manifest.json`, `robots.txt` и др. файлы.

Не надо пытаться деплоить `src` и собирать на сервере, если вы этого специально не хотите. В 90% случаев сборка делается локально или в CI, а на сервер отправляется только `dist`.

### Билд Vue CLI: npm run build

Если проект создан через Vue CLI (vue create), вы обычно видите такой скрипт:

```json
{
  "scripts": {
    "serve": "vue-cli-service serve",    // dev-сервер
    "build": "vue-cli-service build"     // production-сборка
  }
}
```

Смотрите, здесь мы просто вызываем сервис CLI. Перед деплоем выполняем:

```bash
npm install      # ставим зависимости, если ещё не установлены
npm run build    # собираем production-версию
```

После этого появится папка `dist`, её содержимое и нужно деплоить.

### Билд Vite: npm run build

Если проект создан на Vite (шаблон Vue + Vite), скрипты немного отличаются:

```json
{
  "scripts": {
    "dev": "vite",              // dev-сервер
    "build": "vite build",      // production-сборка
    "preview": "vite preview"   // локальный предпросмотр сборки
  }
}
```

Команда сборки аналогична:

```bash
npm install
npm run build      # создаст папку dist
npm run preview    # опционально - локальный просмотр, как в продакшене
```

Опять же, деплоится папка `dist`.

---

## Настройка базового пути (publicPath / base / baseUrl)

### Когда нужно менять базовый путь

По умолчанию Vue предполагает, что ваше приложение доступно по корню домена, например:

- `https://example.com/`
- `https://myapp.com/`

Но если приложение лежит не в корне, а в подпапке (например, GitHub Pages `https://username.github.io/my-vue-app/`), нужно явно указать базовый путь.

Иначе:

- ассеты будут запрашиваться по неверным путям;
- роуты могут работать некорректно;
- стили/скрипты могут не грузиться.

### Vue CLI: publicPath в vue.config.js

В проекте на Vue CLI создаём или редактируем файл `vue.config.js` в корне проекта:

```js
// vue.config.js

module.exports = {
  // Здесь мы задаем базовый путь для всех ассетов и роутов
  publicPath: process.env.NODE_ENV === 'production'
    ? '/my-vue-app/'   // путь в продакшене, например папка на GitHub Pages
    : '/'              // путь при локальной разработке
}
```

Теперь при `npm run build` Vue будет генерировать относительные пути с учетом `/my-vue-app/`.

### Vite: base в vite.config.js

В Vite аналогичная настройка называется `base`:

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Здесь мы указываем базовый URL для сборки
  base: process.env.NODE_ENV === 'production'
    ? '/my-vue-app/'
    : '/'
})
```

Если вы деплоите в корень домена — оставляете `/`. Если в подпапку — прописываете нужный путь.

---

## Деплой Vue приложения как статического сайта

Vue SPA — это, по сути, набор статических файлов. Смотрите, я покажу вам несколько популярных вариантов:

- GitHub Pages;
- Netlify;
- Vercel;
- любой статический хостинг или CDN.

### Деплой на GitHub Pages (Vue CLI)

#### Шаг 1: настройка publicPath

Вспомним настройку `publicPath`:

```js
// vue.config.js

module.exports = {
  // Подставьте здесь имя вашего репозитория
  publicPath: process.env.NODE_ENV === 'production'
    ? '/my-vue-app/'
    : '/'
}
```

Здесь `my-vue-app` — это имя репозитория, по которому GitHub Pages отдаёт проект.

#### Шаг 2: установка gh-pages

Добавим пакет для публикации:

```bash
npm install --save-dev gh-pages
```

#### Шаг 3: скрипт деплоя

Теперь откроем `package.json` и добавим скрипт:

```json
{
  "scripts": {
    "build": "vue-cli-service build",     // сборка проекта
    "deploy": "gh-pages -d dist"          // деплой содержимого папки dist
  }
}
```

Комментариями обозначаем, что происходит.

#### Шаг 4: деплой

Выполняем последовательно:

```bash
npm run build     # создаем production-сборку
npm run deploy    # отправляем dist в ветку gh-pages
```

GitHub создаст ветку `gh-pages` и опубликует её как GitHub Pages.

В настройках репозитория (Settings → Pages) убедитесь, что источником выбрана ветка `gh-pages`.

### Деплой на GitHub Pages (Vite)

С Vite принцип тот же, только внимательно на `base`:

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Указываем базовый путь для GitHub Pages
  base: '/my-vue-app/'
})
```

После этого:

```bash
npm run build
npm install --save-dev gh-pages
```

Добавляем в `package.json`:

```json
{
  "scripts": {
    "build": "vite build",           // сборка
    "deploy": "gh-pages -d dist"     // деплой на GitHub Pages
  }
}
```

И затем:

```bash
npm run build
npm run deploy
```

### Деплой на Netlify

Netlify хорошо подходит для Vue-приложений, особенно на Vite.

#### Что указать в настройках билда

При создании нового сайта на Netlify (через подключение репозитория):

- Build command:
  - для Vue CLI: `npm run build`
  - для Vite: `npm run build`
- Publish directory:
  - `dist`

#### Настройка маршрутов SPA

Чтобы все пути вашего SPA (например, `/about`, `/profile/123`) попадали в `index.html`, создадим файл `_redirects` в папке `public` проекта:

```txt
/*    /index.html   200
```

Комментарии тут не поддерживаются, но поясним текстом:

- строка `/*` говорит, что любой маршрут;
- перенаправляется на `/index.html`;
- статус `200` говорит Netlify, что это не редирект, а просто отдача страницы (SPA роутинг).

После сборки этот файл попадет в `dist`, и Netlify будет корректно обрабатывать ваши маршруты.

### Деплой на Vercel

Vercel особенно дружелюбен к Vite и Vue 3.

#### Быстрый вариант через UI

1. Залогиньтесь на Vercel.
2. Импортируйте репозиторий (GitHub/GitLab/Bitbucket).
3. Vercel, как правило, сам определит:
   - Build Command — `npm run build`;
   - Output Directory — `dist`.

Если не определил — задайте эти значения вручную.

#### Настройка SPA маршрутов

Для SPA логика похожа на Netlify. Можно использовать файл `vercel.json` в корне проекта:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",      // все пути
      "destination": "/"      // отправляем на index.html
    }
  ]
}
```

Vercel сам поймет, что нужно возвращать `index.html` из `dist`.

---

## Деплой Vue приложения на собственный сервер (VPS)

Здесь покажу два подхода:

1. Отдача только статики (Vue как чистое SPA) через Nginx.
2. Отдача статики через Nginx + API на Node.js (Express, Nest) в качестве бэкенда.

### Вариант 1: только статика через Nginx

В этом случае у вас есть:

- Vue SPA (`dist`);
- Nginx, который просто раздает файлы и перенаправляет любые маршруты на `index.html`.

#### Шаг 1: сборка

На локальной машине или в CI:

```bash
npm install
npm run build   # получаем dist
```

Затем содержимое папки `dist` копируем на сервер, например в `/var/www/my-vue-app`.

#### Шаг 2: настройка Nginx

Создаем конфиг сайта, допустим `/etc/nginx/sites-available/my-vue-app`:

```nginx
server {
    listen 80;
    server_name myapp.example.com;  # здесь ваш домен

    root /var/www/my-vue-app;       # путь к папке dist
    index index.html;

    # Обслуживание статических файлов
    location / {
        try_files $uri $uri/ /index.html;
        # try_files пытается отдать файл;
        # если не нашел, отправляет index.html для обработки роутером Vue
    }
}
```

Активируем сайт:

```bash
ln -s /etc/nginx/sites-available/my-vue-app /etc/nginx/sites-enabled/my-vue-app
nginx -t       # проверяем конфигурацию
systemctl reload nginx   # перезапускаем с перезагрузкой конфига
```

Теперь вы увидите, что любые маршруты (`/`, `/about`, `/user/1`) будут отдавать `index.html`, а Vue Router возьмет на себя разбор пути.

### Вариант 2: Vue + Node.js API за Nginx

Здесь схема такая:

- Nginx:
  - раздаёт статику Vue из `dist`;
  - проксирует API-запросы на Node.js (например, Express на порту 3000).
- Node.js:
  - обслуживает `/api/*`.

#### Пример конфигурации Nginx

```nginx
server {
    listen 80;
    server_name myapp.example.com;

    root /var/www/my-vue-app;
    index index.html;

    # Отдача фронтенда
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Проксирование API-запросов к Node.js
    location /api/ {
        proxy_pass http://localhost:3000;     # Node-приложение на 3000 порту
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        # Эти заголовки нужны для корректной работы, например, с WebSocket и кэшем
    }
}
```

На стороне Node.js (например, Express):

```js
// server.js
const express = require('express')
const app = express()

// Здесь мы определяем обработчик API-запроса
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(3000, () => {
  console.log('API server listening on port 3000')
})
```

Такой подход удобен, когда фронтенд и бэкенд живут на одном домене, а по пути `/api` торчит ваше Node-приложение.

---

## Переменные окружения и разные конфиги для dev/prod

В реальном проекте вам часто нужно отличать:

- URL API в разработке и в продакшене;
- ключи интеграций;
- флаги включения/отключения определённых функций.

### Переменные окружения в Vue CLI

Vue CLI использует файлы формата `.env`:

- `.env` — общие переменные;
- `.env.development` — только для разработки;
- `.env.production` — только для продакшена.

Важно: переменные, доступные в клиентском коде, должны начинаться с `VUE_APP_`.

Например:

```env
# .env.production
VUE_APP_API_URL=https://api.example.com
VUE_APP_FEATURE_X_ENABLED=true
```

Использование в коде:

```js
// Здесь мы читаем переменные окружения, внедренные во время сборки
const apiUrl = process.env.VUE_APP_API_URL
const featureXEnabled = process.env.VUE_APP_FEATURE_X_ENABLED === 'true'
```

При `npm run build` эти значения «зашиваются» в сборку.

### Переменные окружения в Vite

В Vite похожий механизм, но с префиксом `VITE_`:

- `.env.development`
- `.env.production`
- `.env.local`, `.env.production.local` и т.д.

Пример:

```env
# .env.production
VITE_API_URL=https://api.example.com
VITE_APP_VERSION=1.0.0
```

Использование:

```js
// Здесь мы обращаемся к переменным через import.meta.env
const apiUrl = import.meta.env.VITE_API_URL
const version = import.meta.env.VITE_APP_VERSION
```

Vite подставит реальные значения на этапе сборки.

---

## Работа с Vue Router при деплое (history mode)

### Проблема history mode

Если вы используете Vue Router в режиме `history`, путь выглядит красиво:

- `/about`
- `/users/10/orders`

Но браузер при прямом запросе `/about` спросит сервер: «дай мне страницу `/about`». Если сервер не знает, что нужно вернуть `index.html`, он вернет `404`.

Поэтому при деплое приложения с `history mode` нужно:

- настроить сервер, чтобы он всегда возвращал `index.html` для всех маршрутов SPA;
- а статику (css, js, картинки) отдавал напрямую.

### Настройка в Nginx

Мы уже использовали директиву `try_files`:

```nginx
location / {
    try_files $uri $uri/ /index.html;
    # $uri     - конкретный файл, например /assets/main.js
    # $uri/    - директория
    # /index.html - если ничего не найдено, отдаем SPA
}
```

Эта одна строка в конфиге обычно решает проблему 404 при перезагрузке страницы по любому маршруту.

### Настройка для GitHub Pages

GitHub Pages не позволяет так гибко настраивать сервер, но там есть обходной путь:

- вы можете использовать `hash`-режим в Vue Router (`mode: 'hash'`), тогда все маршруты будут иметь вид `/#/about`;
- серверу в этом случае достаточно отдавать один `index.html`, а всё после `#` трактуется как hash в браузере.

Пример инициализации Vue Router в hash-режиме (Vue 2):

```js
// router.js
import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

// Здесь мы явно указываем режим 'hash'
// Маршруты будут выглядеть как /#/about
export default new Router({
  mode: 'hash',
  routes: [
    { path: '/', component: Home }
  ]
})
```

В современных проектах чаще используют history mode + правильная настройка сервера. Но для GitHub Pages hash-режим по-прежнему популярен, потому что его проще внедрить без доступа к конфигу сервера.

---

## CI/CD для Vue: автоматизация деплоя

Когда приложение растет, деплой «вручную» становится неудобным. Здесь удобно использовать CI/CD:

- при каждом пуше в основную ветку:
  - запускаются тесты;
  - выполняется сборка;
  - результат автоматически деплоится.

### Пример: GitHub Actions + деплой на сервер по SSH

Допустим, вы хотите:

- собирать Vue на GitHub Actions;
- затем отправлять `dist` на свой VPS.

Простейший workflow `.github/workflows/deploy.yml` может выглядеть так:

```yaml
name: Deploy Vue app

on:
  push:
    branches:
      - main        # Здесь указываем ветку, при пуше в которую запускается деплой

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'   # здесь задаем версию Node.js

      - name: Install dependencies
        run: npm ci            # более строгая установка зависимостей

      - name: Build project
        run: npm run build     # сборка Vue приложения (создает dist)

      - name: Deploy via rsync
        uses: burnett01/rsync-deployments@5.2
        with:
          switches: -avz --delete
          path: dist/                       # локальный путь, который деплоим
          remote_path: /var/www/my-vue-app  # путь на сервере
          remote_host: ${{ secrets.SSH_HOST }}
          remote_user: ${{ secrets.SSH_USER }}
          remote_key: ${{ secrets.SSH_KEY }}
```

- В секции `secrets` в настройках репозитория вы храните данные доступа по SSH.
- После каждого пуша в `main` GitHub Actions соберет проект и синхронизирует `dist` с каталогом на сервере.

---

## Практический пример полного цикла деплоя

Давайте разберемся на конкретном сценарии:

- у вас проект на Vite + Vue 3;
- вы деплоите на VPS;
- хотите сервить статику через Nginx и иметь Node.js API.

### Шаг 1: конфиги Vite и переменные окружения

`vite.config.js`:

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Здесь мы оставляем корневой путь, т.к. приложение будет в корне домена
  base: '/',
  build: {
    outDir: 'dist',    // папка выходной сборки
    sourcemap: false   // обычно sourcemap в продакшене отключают
  }
})
```

`.env.production`:

```env
# URL продакшн API
VITE_API_URL=https://api.myapp.example.com
```

Компонент, который использует API:

```js
// src/services/api.js

// Здесь мы читаем URL API из окружения
const API_URL = import.meta.env.VITE_API_URL

// Функция для получения данных с сервера
export async function fetchUsers() {
  const res = await fetch(`${API_URL}/users`)
  if (!res.ok) {
    // Если статус не ок, бросаем ошибку
    throw new Error('Failed to fetch users')
  }
  return res.json()
}
```

### Шаг 2: сборка и копирование на сервер

Локально (или в CI):

```bash
npm install
npm run build
```

Копируем `dist` на сервер в `/var/www/my-vue-app`.

### Шаг 3: настройка Node.js API

Простейший `server.js`:

```js
// server.js
const express = require('express')
const app = express()

// Здесь мы описываем простой REST-эндпоинт
app.get('/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ])
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`)
})
```

Запуск через pm2 (для продакшена удобно):

```bash
npm install -g pm2
pm2 start server.js --name my-vue-api
pm2 save
pm2 startup   # чтобы pm2 запускался после перезагрузки сервера
```

### Шаг 4: настройка Nginx

Конфиг `/etc/nginx/sites-available/my-vue-app`:

```nginx
server {
    listen 80;
    server_name myapp.example.com;

    root /var/www/my-vue-app;
    index index.html;

    # Отдаём Vue SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Прокси API на Node.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Не забудьте:

```bash
ln -s /etc/nginx/sites-available/my-vue-app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Теперь вы можете открыть `http://myapp.example.com`, приложение запросит `https://api.myapp.example.com/users` (если так настроено), и полный стек будет работать.

---

## Заключение

Деплой Vue приложения — это не только заливка папки dist на сервер, а набор технических решений, связанных с:

- корректной production-сборкой (Vue CLI или Vite);
- настройкой базового пути для ассетов при деплое в подпапку;
- обработкой маршрутов SPA на стороне сервера;
- разделением окружений (development/production) через переменные окружения;
- выбором хостинга — от GitHub Pages и Netlify до собственного VPS с Nginx и Node.js;
- автоматизацией через CI/CD, чтобы минимизировать ручные действия.

Если вы понимаете, как связаны эти части, деплой становится предсказуемой и контролируемой процедурой. Дальше вы сможете постепенно усложнять инфраструктуру — добавлять HTTPS, балансировку, версионирование фронтенда, разные окружения (staging/production), не меняя базовых принципов, о которых мы говорили.

---

## Частозадаваемые технические вопросы

### 1. Как использовать относительные пути к ассетам, чтобы сборка работала и локально, и на продакшене?

Если вы хотите, чтобы пути к картинкам и другим ресурсам корректно работали и в dev, и после деплоя в подпапку, лучше использовать импорт или алиасы, а не «жесткие» пути. Пример в компоненте:

```vue
<script>
// Здесь мы импортируем картинку как модуль
import logo from '@/assets/logo.png'

export default {
  data() {
    return { logo }
  }
}
</script>

<template>
  <!-- Здесь src привязан к импортированному пути -->
  <img :src="logo" alt="Logo" />
</template>
```

Сборщик сам подставит правильный путь, учитывая `publicPath` или `base`.

### 2. Как сделать, чтобы разные ветки репозитория деплоились на разные окружения?

Обычно для этого используют CI (GitHub Actions, GitLab CI). В workflow можно добавить несколько jobs, которые реагируют на разные ветки. Например, ветка `develop` деплоится на тестовый сервер, а `main` — на боевой. В условии `on.push.branches` указываете разные ветки и в каждом job настраиваете свой `remote_host` и `remote_path`. Таким образом вы разделяете окружения по веткам.

### 3. Как ограничить доступ к тестовому деплою Vue (staging), чтобы его не видели пользователи?

На уровне сервера можно ввести базовую HTTP-авторизацию. В Nginx это делается через `auth_basic` и `auth_basic_user_file`. Вы создаете файл паролей через `htpasswd`, а затем добавляете в конфиг:

```nginx
location / {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
    try_files $uri $uri/ /index.html;
}
```

Теперь любой, кто откроет staging-домен, сначала увидит запрос логина/пароля.

### 4. Как настроить кэширование статики, чтобы ускорить загрузку Vue приложения?

Современные сборщики (Vue CLI, Vite) генерируют файлы с хешами в имени (например, `app.8f3a2b.js`). Это позволяет безопасно кэшировать их надолго. На уровне Nginx вы можете добавить:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|svg)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
}
```

Так браузер будет кэшировать статику до 30 дней, а при изменении файла его имя изменится (из-за хеша), и пользователь получит новую версию.

### 5. Как откатиться на предыдущую версию фронтенда, если после деплоя всё сломалось?

Если вы деплоите статику без «перезаписи» предыдущей версии, имеет смысл вести версии сборок. Например, каждый билд складывать в отдельную папку `/var/www/my-vue-app-releases/2024-01-26_12-30/`, а текущий сайт указывать через символическую ссылку `/var/www/my-vue-app -> .../2024-01-26_12-30/`. Тогда откат — это смена симлинка на предыдущую папку и перезагрузка Nginx. В CI/CD это реализуется через скрипты деплоя, которые создают релиз и обновляют симлинк.