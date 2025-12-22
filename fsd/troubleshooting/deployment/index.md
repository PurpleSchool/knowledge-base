---
metaTitle: Деплой FSD проекта - полное руководство по deployment
metaDescription: Подробное практическое руководство по деплою фронтенда на архитектуре Feature Sliced Design - настройка окружений сборки и автоматизации
author: Олег Марков
title: Деплой FSD проекта - deployment
preview: Разберитесь как грамотно выстроить процесс деплоя FSD проекта - от структуры окружений и сборки до CI CD и конфигурации серверов
---

## Введение

Деплой проекта с архитектурой Feature Sliced Design (FSD) на первый взгляд мало отличается от обычного фронтенд‑деплоя. Но как только вы начинаете разделять фичи, слои и конфигурацию по FSD‑подходу, появляются вопросы:

- где хранить настройки для разных окружений  
- как собирать и выкладывать только нужные слои  
- как описать деплой так, чтобы его было легко поддерживать и новым разработчикам, и DevOps  
- как не превратить FSD‑проект в хаос при добавлении новых фич и окружений

Смотрите, я покажу вам, как можно выстроить понятный и предсказуемый процесс деплоя FSD‑проекта, начиная от структуры конфигурации и заканчивая автоматизацией в CI/CD. Будем отталкиваться от классического SPA/CSR проекта (React/Vue/Svelte — не так важно), но все принципы подойдут и для SSR/Next.js.

Наша цель — не просто "как залить билд на сервер", а как встроить деплой в саму архитектуру FSD: чтобы конфигурация и инфраструктура подчинялись тем же принципам модульности, изоляции и удобства сопровождения.

---

## Базовые принципы деплоя FSD проекта

### Логическое разделение уровней

В FSD вы уже разделяете код по слоям:

- `app` — оболочка приложения  
- `processes` — крупные бизнес‑процессы  
- `pages` — страницы  
- `features` — функциональные фичи  
- `entities` — бизнес‑сущности  
- `shared` — переиспользуемые примитивы

Для деплоя важно не нарушить это разделение. Давайте посмотрим, как обычно организуют:

1. **Технический уровень** — сборка, упаковка, транспорт до сервера  
2. **Конфигурационный уровень** — настройки для окружений, ключи, эндпоинты  
3. **Инфраструктурный уровень** — сервера, Docker, Kubernetes, CDN

Хорошая практика — держать "технический" и "конфигурационный" уровни максимально близко к коду приложения, но при этом не смешивать их с бизнес‑логикой. В FSD‑проекте это обычно означает:

- хранить общую конфигурацию деплоя рядом с `app`  
- выносить чувствительные данные за пределы репозитория (переменные окружения, секреты)  
- конфигурировать фичи через публичные API (например, настройка базового API‑URL в `shared/config`)

### Типичный pipeline деплоя

Давайте разложим стандартный pipeline деплоя FSD‑проекта по шагам:

1. **Получение кода** — checkout из репозитория  
2. **Установка зависимостей** — `npm install` или `pnpm install`  
3. **Сборка** — `npm run build` с нужным окружением  
4. **Пакетирование** — архив, Docker‑образ или артефакт CI  
5. **Транспорт** — отправка артефакта на сервер, в S3, в Kubernetes и т.п.  
6. **Развертывание** — раскладка файлов, запуск контейнера, настройка nginx  
7. **Пост‑деплой шаги** — миграции, очистка кэшей, проверка статуса

Теперь давайте увяжем это с FSD и разберем, где именно вступают в игру особенности архитектуры.

---

## Окружения и конфигурация в FSD проекте

### Что такое окружения на практике

Обычно вам нужны как минимум:

- `development` — локальная разработка  
- `staging` (или `test`) — тестовое окружение  
- `production` — боевое окружение

Иногда добавляют `preview`/`review` окружения для каждой ветки/PR.

С точки зрения FSD самое важное — **не размазывать конфигурацию по слоям**. Лучше держать точку входа в конфиг в одном месте, например, в `shared/config`, а дальше уже пробрасывать нужные значения вниз в фичи и сущности.

### Организация конфигурации в коде

Давайте разберемся на примере. Представим, что у вас есть API‑клиент, который должен знать базовый URL для запросов. Вместо того чтобы "зашивать" его в разные фичи, выносите конфиг:

```ts
// shared/config/env.ts
// Здесь мы читаем значения из переменных окружения сборки
export const ENV = {
  APP_ENV: process.env.APP_ENV, // development | staging | production
  API_BASE_URL: process.env.API_BASE_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  FEATURE_FLAGS: process.env.FEATURE_FLAGS, // например, JSON‑строка
}
```

```ts
// shared/api/client.ts
// Здесь мы создаем инстанс HTTP‑клиента с учетом конфигурации
import axios from 'axios'
import { ENV } from '../config/env'

export const apiClient = axios.create({
  // Обратите внимание - базовый URL приходит из конфигурации окружения
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
})
```

Теперь любой слой (feature, page, entity) не думает о том, какой это сервер — dev или prod, он просто использует `apiClient`.

### Связь окружений с инструментами сборки

Как правило, вы будете использовать:

- Vite  
- Webpack  
- CRA/Next.js (со своими системами env‑переменных)

Смотрите, я покажу вам пример для Vite, так как он сейчас часто используется в FSD‑проектах:

```ts
// vite.config.ts
// Здесь мы подключаем плагин для работы с переменными окружения и задаем базовые пути
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Здесь мы загружаем env‑переменные для текущего режима
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      // Здесь пробрасываем env‑переменные в код фронтенда
      'process.env.APP_ENV': JSON.stringify(env.APP_ENV),
      'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL),
      'process.env.SENTRY_DSN': JSON.stringify(env.SENTRY_DSN),
    },
    // Здесь можно указать базовый публичный путь для деплоя
    base: env.APP_BASE_PATH || '/',
  }
})
```

Теперь при сборке `mode` управляет тем, какие `.env` файлы будут использованы.

### Структура env‑файлов

Один из удобных подходов:

- `.env` — общие настройки по умолчанию  
- `.env.development` — настройки для `development`  
- `.env.staging` — настройки для `staging`  
- `.env.production` — настройки для `production`

Пример:

```bash
# .env
APP_ENV=development
API_BASE_URL=http://localhost:3000/api
APP_BASE_PATH=/

# .env.staging
APP_ENV=staging
API_BASE_URL=https://staging.api.example.com
APP_BASE_PATH=/app/

# .env.production
APP_ENV=production
API_BASE_URL=https://api.example.com
APP_BASE_PATH=/app/
```

При этом для боевого деплоя чувствительные значения (ключи, токены) лучше не хранить в файлах, а передавать в виде переменных окружения на CI/CD или на сервере.

---

## Подготовка FSD проекта к деплою

### Чистая структура входных точек

Для удобного деплоя полезно, чтобы у вас была одна явная точка входа в приложение, например:

- `src/app/index.tsx` — инициализация приложения  
- `src/app/providers` — провайдеры (роутер, стейт‑менеджер, i18n)  
- `src/app/config` — базовая конфигурация приложения

Здесь я размещаю пример, чтобы вам было проще понять:

```ts
// app/index.tsx
// Здесь мы инициализируем и монтируем React‑приложение
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { withProviders } from './providers'

// Здесь мы оборачиваем App в провайдеры (роутер, стор и т.д.)
const Root = withProviders(App)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
```

```ts
// app/providers/index.ts
// Здесь мы подключаем все провайдеры и формируем единую обертку
import { withRouter } from './with-router'
import { withStore } from './with-store'
import { withErrorBoundary } from './with-error-boundary'

export const withProviders = (Component: React.ComponentType) =>
  withErrorBoundary(withStore(withRouter(Component)))
```

Такой подход упрощает деплой: сборка всегда знает одну точку входа (`app/index.tsx`), а остальное подхватывается через импорты по FSD‑структуре.

### Оптимизация сборки под деплой

FSD подразумевает большое количество файлов, модулей и слоев. Для деплоя важно:

1. **Lazy loading страниц и тяжелых фич**  
2. **Code splitting на уровне роутов и "процессов"**  
3. **Минимизация общего бандла shared‑слоя**

Давайте посмотрим, что происходит в следующем примере:

```ts
// pages/index.ts
// Здесь мы лениво подгружаем страницы для уменьшения размера начального бандла
import { lazy } from 'react'

export const MainPage = lazy(() => import('./main'))
export const ProfilePage = lazy(() => import('./profile'))
export const SettingsPage = lazy(() => import('./settings'))
```

```ts
// app/router.tsx
// Здесь мы используем ленивые страницы в роутере
import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainPage, ProfilePage, SettingsPage } from '@/pages'

export const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<div>Loading...</div>}>
      {/* Здесь мы подключаем ленивые страницы для каждого маршрута */}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
)
```

Таким образом, деплой получает несколько чанков, а не один огромный файл, и первая загрузка становится быстрее.

---

## Варианты деплоя FSD проекта

### Статический деплой (SPA/CSR)

Самый частый сценарий: вы собираете SPA и выкладываете его как статические файлы (HTML, CSS, JS) на:

- обычный веб‑сервер (nginx, Apache)  
- облачный storage (S3 + CloudFront, GCS + CDN)  
- хостинг типа Vercel/Netlify (для SPA‑режима)

Общий подход:

1. `npm run build` генерирует папку `dist` или `build`  
2. Вы выкладываете содержимое этой папки на сервер  
3. Настраиваете сервер так, чтобы все запросы отдавали `index.html` (SPA‑роутинг)  
4. Подключаете кэширование и gzip/brotli

Пример простого Dockerfile для такого деплоя:

```Dockerfile
# Этап сборки
# Здесь мы собираем фронтенд-проект в режиме production
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Этап сервера
# Здесь мы поднимаем nginx и копируем собранные файлы
FROM nginx:1.27-alpine AS runtime

# Здесь мы удаляем стандартную конфигурацию nginx
RUN rm /etc/nginx/conf.d/default.conf

# Здесь мы копируем нашу конфигурацию nginx внутрь контейнера
COPY deploy/nginx.conf /etc/nginx/conf.d/app.conf

# Здесь мы копируем статические файлы сборки в корень nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Здесь мы открываем 80 порт для доступа к приложению
EXPOSE 80

# Здесь мы запускаем nginx в форграунде
CMD ["nginx", "-g", "daemon off;"]
```

А вот пример простой конфигурации `nginx`, с учетом SPA‑роутинга:

```nginx
# deploy/nginx.conf
# Здесь мы создаем сервер для обслуживания статического SPA
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;

    # Здесь мы задаем кэширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files $uri =404;
    }

    # Здесь мы обрабатываем все остальные запросы через index.html (SPA маршрутизация)
    location / {
        try_files $uri /index.html;
    }
}
```

### SSR / Next.js / Remix

Если у вас FSD поверх фреймворка с SSR (например, Next.js + FSD‑структура внутри `src`), деплой немного меняется:

- собирается не только фронтенд, но и серверная часть  
- вам нужен Node.js‑сервер (или serverless‑платформа)  
- роутинг обрабатывается на сервере

Но архитектурные принципы FSD сохраняются: слои, фичи и сущности остаются, просто точка входа в приложение уходит в SSR‑фреймворк. В этом случае:

- конфигурацию окружений вы по‑прежнему храните в `shared/config`  
- используете API‑route/handlers для серверной части  
- деплой крутится вокруг `next build` и запуска `next start` или serverless‑вытасовки

---

## Интеграция FSD с CI/CD

### Стратегия веток и окружений

Обычно удобно связать ветки репозитория с окружениями:

- `main` → `production`  
- `develop` → `staging`  
- любые feature‑ветки → preview‑окружения (опционально)

Это облегчает жизнь: достаточно настроить три pipeline:

- build + deploy на staging при пуше в `develop`  
- build + deploy на production при пуше/мерже в `main`  
- build + deploy preview при создании pull‑request

Теперь давайте перейдем к реальному примеру конфигурации.

### Пример pipeline на GitHub Actions

Здесь я размещаю пример, чтобы вам было проще понять, как связать сборку и деплой. Допустим, вы деплоите Docker‑образ в контейнерный реестр, а потом раскатываете его на сервер.

```yaml
# .github/workflows/deploy.yml
# Здесь мы описываем workflow для деплоя FSD приложения
name: Deploy FSD App

on:
  push:
    branches:
      - main
      - develop

env:
  # Здесь мы задаем общие переменные для workflow
  REGISTRY: ghcr.io
  IMAGE_NAME: my-org/my-fsd-app

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      # Здесь мы получаем код из репозитория
      - name: Checkout
        uses: actions/checkout@v4

      # Здесь мы настраиваем Node.js подходящей версии
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      # Здесь мы устанавливаем зависимости
      - name: Install dependencies
        run: npm ci

      # Здесь мы определяем окружение на основе ветки
      - name: Set APP_ENV
        run: |
          if [ "${{ github.ref_name }}" = "main" ]; then
            echo "APP_ENV=production" >> $GITHUB_ENV
          else
            echo "APP_ENV=staging" >> $GITHUB_ENV
          fi

      # Здесь мы запускаем сборку с учетом окружения
      - name: Build
        run: |
          if [ "$APP_ENV" = "production" ]; then
            npm run build:prod
          else
            npm run build:staging
          fi

      # Здесь мы логинимся в контейнерный реестр GitHub
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # Здесь мы билдим и пушим Docker образ
      - name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ env.APP_ENV }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest

    steps:
      # Здесь мы инициируем деплой через SSH или вызов API
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            # Здесь мы обновляем Docker образ на сервере и перезапускаем контейнер
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ env.APP_ENV }}
            docker stop fsd-app || true
            docker rm fsd-app || true
            docker run -d --name fsd-app -p 80:80 \
              ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ env.APP_ENV }}
```

Обратите внимание, как мы:

- определяем `APP_ENV` на основе ветки  
- вызываем разные скрипты сборки `build:prod` и `build:staging`  
- строим Docker‑образ, который уже содержит собранный фронтенд и nginx

---

## Скрипты сборки под разные окружения

### Единая точка для команд

Частая ошибка — плодить сложные команды:

- `npm run build-dev`  
- `npm run build-staging`  
- `npm run build-prod`  
- и еще пару‑тройку вариантов

Лучше сделать единый скрипт, который опирается на `NODE_ENV` или `APP_ENV`. Но если вам удобнее разделить команды, сделайте их максимально простыми и предсказуемыми.

Давайте посмотрим, как это можно оформить:

```json
// package.json
{
  "scripts": {
    "dev": "vite",                    // Здесь мы запускаем dev сервер
    "build": "vite build",            // Здесь мы выполняем сборку (env по умолчанию)
    "build:staging": "vite build --mode staging",  // Здесь мы собираем staging
    "build:prod": "vite build --mode production",  // Здесь мы собираем production
    "preview": "vite preview"         // Здесь мы запускаем предпросмотр билда
  }
}
```

Теперь связка:

- `vite build --mode staging` → `.env.staging` + `mode=staging`  
- `vite build --mode production` → `.env.production` + `mode=production`

В FSD‑проекте важно, чтобы ваши фичи не начинали самостоятельно "угадывать" окружение. Пусть все окружение идет через:

- `shared/config` (обертка над `process.env`)  
- или провайдеры/контекст в `app/providers` (если есть сложная конфигурация)

---

## Feature flags и условный деплой фич

### Зачем это нужно в FSD проекте

FSD поощряет изоляцию фич: каждая фича — отдельный независимый модуль. Это хорошо масштабируется с feature flags:

- включение/выключение фичи на уровне окружения  
- тестирование новых фич только на staging  
- постепенный rollout на production

Теперь вы увидите, как это выглядит в коде.

```ts
// shared/config/features.ts
// Здесь мы описываем включение и выключение фич через конфигурацию
type FeatureName = 'newProfile' | 'betaSearch' | 'darkMode'

type FeatureFlags = Record<FeatureName, boolean>

// Здесь мы парсим feature flags из переменной окружения (например, JSON)
const rawFlags = process.env.FEATURE_FLAGS || '{}'

export const FEATURES: FeatureFlags = {
  newProfile: false,
  betaSearch: false,
  darkMode: false,
  // Здесь мы переопределяем дефолтные значения на основе env
  ...(JSON.parse(rawFlags) as Partial<FeatureFlags>),
}
```

```ts
// features/new-profile/ui/ProfilePage.tsx
// Здесь мы рендерим новую страницу профиля только если фича включена
import { FEATURES } from '@/shared/config/features'
import { OldProfilePage } from '@/pages/profile-old'

export const ProfilePage = () => {
  if (!FEATURES.newProfile) {
    // Здесь мы возвращаем старую страницу если фича выключена
    return <OldProfilePage />
  }

  // Здесь рендерится новая реализация профиля если фича включена
  return <div>New profile implementation</div>
}
```

Теперь достаточно на staging окружении задать:

```bash
FEATURE_FLAGS={"newProfile":true}
```

И вы получаете новую страницу профиля только на staging, без изменения кода фичи. Это особенно удобно, когда у вас несколько окружений и сложный жизненный цикл фич.

---

## Локальная проверка деплоя

### Зачем нужен локальный "production‑режим"

Перед тем как выкатывать на staging или production, полезно убедиться, что:

- сборка проходит успешно  
- бандл не разваливается из‑за переменных окружения  
- SPA корректно работает в собранном виде

Большинство сборщиков позволяют поднять локальный сервер поверх собранного билда. Например, в Vite:

```bash
# Здесь мы собираем приложение в production режиме
npm run build:prod

# Здесь мы запускаем локальный сервер для предпросмотра билда
npm run preview
```

Это поднимает `localhost:4173` (по умолчанию) и показывает именно тот артефакт, который вы будете деплоить.

### Локальный стенд в Docker

Еще один уровень — локальный запуск той же Docker‑сборки, что и на проде:

```bash
# Здесь мы собираем Docker образ локально
docker build -t fsd-app:local .

# Здесь мы запускаем контейнер с приложением на 8080 порту
docker run -p 8080:80 fsd-app:local
```

Теперь вы можете открыть `http://localhost:8080` и проверить, что на уровне nginx и статических файлов все работает так же, как будет работать на сервере.

---

## Типичные проблемы при деплое FSD проекта

### Неправильный base path при деплое не в корень домена

Частая ситуация: вы деплоите приложение не в `/`, а в `/app/` или `/my-project/`. Если не учесть это в конфигурации сборки (`base` в Vite, `homepage` в CRA, `assetPrefix` в Next.js), маршруты и статические ресурсы могут ломаться.

Решение:

1. Настроить базовый путь в сборщике  
2. Учесть его при конфигурации роутера

Например, для Vite:

```ts
// vite.config.ts
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.APP_BASE_PATH || '/', // Здесь мы задаем базовый публичный путь
  }
})
```

А в `BrowserRouter`:

```ts
// app/router.tsx
// Здесь мы подключаем basename чтобы роутер знал о вложенном пути
import { BrowserRouter } from 'react-router-dom'
import { ENV } from '@/shared/config/env'

// Здесь мы передаем APP_BASE_PATH в basename
export const AppRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter basename={ENV.APP_BASE_PATH || '/'}>
    {children}
  </BrowserRouter>
)
```

### Несоответствие env‑переменных между билдом и рантаймом

Еще одна проблема — разница между теми переменными окружения, с которыми вы собираете приложение, и теми, которые есть на сервере. Для SPA‑бандла это особенно критично: все env‑переменные "впечатываются" в код на этапе сборки, и после деплоя вы уже не можете их поменять без пересборки.

Чтобы не запутаться:

- четко фиксируйте, какие env‑переменные используются фронтом  
- документируйте их где‑то в `shared/config/README.md` или в общем `docs/deploy.md`  
- на CI/CD явно указывайте env для `build`‑шага, а не рассчитывайте на "случайные" значения на раннере

Если вам нужно менять конфигурацию *после* деплоя без пересборки, можно вынести часть настроек в отдельный `config.json`, который отдается сервером и считывается фронтом при старте. Но это уже отдельная архитектурная задача.

---

## Итог

Деплой FSD‑проекта опирается на те же принципы, что и архитектура самого приложения:

- **модульность** — конфигурация и инфраструктура собраны в понятные модули (например, `shared/config`, `deploy/`)  
- **явность** — точки входа в приложение и в конфиг не размазаны по коду  
- **изоляция** — фичи и сущности не "знают" подробностей окружения, они получают уже готовые зависимости

Если вы:

- разделяете окружения (`development`, `staging`, `production`)  
- выстраиваете понятную схему env‑переменных  
- используете инструменты сборки осознанно (base path, mode, env)  
- подключаете CI/CD, связанный с ветками и окружениями  
- не нарушаете границы слоев FSD в конфигурации

то деплой становится предсказуемым, а добавление новых фич и окружений — рутинной задачей, а не серией экспериментов.

Дальше вы можете постепенно усложнять инфраструктуру: добавлять Kubernetes, Canary‑деплой, Blue‑Green, отдельные preview‑окружения. Но фундамент будет тот же — четкая конфигурация и уважение к архитектурным границам FSD‑проекта.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как деплоить FSD проект, если backend и frontend в одном репозитории

Сделайте отдельные директории `frontend/` и `backend/`, используйте два отдельных pipeline в CI. Для фронта собирайте SPA/SSR так же, как в отдельном репозитории, но деплой можно объединить в один шаг: backend‑контейнер + frontend‑контейнер или один общий контейнер с nginx и проксированием на backend. Важно не смешивать фронтовую конфигурацию в бэкенд‑коде, храните их в своих `env` и `config`.

### Как правильно проксировать API запросы через nginx для FSD SPA

В конфиге nginx добавьте отдельный `location` под API. Например:

```nginx
location /api/ {
    proxy_pass http://backend:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Фронт при этом использует `API_BASE_URL=/api`. Так вы избегаете CORS и можете менять реальный backend URL на сервере без пересборки фронта.

### Как включить source maps на production для FSD проекта

В Vite установите `build.sourcemap = true` в конфиге или через `mode`‑специфичные настройки. В Webpack — `devtool: 'source-map'`. Учтите требования безопасности: не всегда безопасно открывать source maps в продакшене. Можно загружать их только в систему логирования (Sentry) и не отдавать напрямую клиентам.

### Как деплоить FSD проект на GitHub Pages

Соберите SPA в статический бандл (`npm run build`), в `vite.config.ts` выставьте `base` как `/repo-name/`. Затем используйте GitHub Actions с `peaceiris/actions-gh-pages` или `actions/deploy-pages` и публикуйте содержимое `dist` в ветку `gh-pages`. Важно включить SPA‑fallback: на GitHub Pages это делается через `404.html`, который дублирует `index.html`.

### Как разрулить разные API URL на одном домене для нескольких FSD приложений

Используйте разные base path и подкаталоги, например, `/app1/` и `/app2/`, и разные префиксы для API `/app1/api/`, `/app2/api/`. В nginx настраивайте отдельные `location` под каждое приложение. В конфиге фронта (`APP_BASE_PATH`, `API_BASE_URL`) задавайте значения под конкретное приложение и окружение.