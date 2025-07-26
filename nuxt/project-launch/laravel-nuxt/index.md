---
metaTitle: Интеграция Laravel и Nuxt
metaDescription: Пошаговое руководство по интеграции Laravel и Nuxt — настройка API, взаимодействие через SPA и SSR, обмен токенами, архитектура, примеры кода
author: Олег Марков
title: Интеграция Laravel и Nuxt
preview: Разберите на практике интеграцию Laravel и Nuxt — организация архитектуры, настройка API, обмен токенами, особенности SSR и SPA. Руководство с примерами и решениями типовых задач
---

## Введение

Интеграция Laravel и Nuxt — одна из самых востребованных схем архитектуры для современных веб-приложений. Такой дуэт позволяет использовать возможности Laravel как мощного backend-фреймворка и гибкость Nuxt как фреймворка для создания современных клиентских приложений на Vue. В результате вы получаете масштабируемый, производительный и приятный для пользователей сервис, где каждая часть отвечает за свое: Laravel — за данные, логику и безопасность, Nuxt — за интерфейс, динамику и отзывчивость.

Я расскажу вам, как организовать такую интеграцию, какие есть подходы, на что обратить внимание, и покажу на реальных примерах, как наладить работу между этими инструментами. Мы разберем не только основные шаги, но и углубимся в архитектуру, безопасную работу с авторизацией, SSR-рендеринг и deployment.

## Подходы к интеграции Laravel и Nuxt

### Monorepo (единственный проект)

Этот подход подразумевает, что и Laravel, и Nuxt размещаются в одной репозитории, часто в отдельных папках (`/backend` и `/frontend` или что-то подобное). Вы можете управлять всеми зависимостями централизованно, а деплой становится чуть сложнее, но упрощающаяся локальная разработка и поддержка common-линков — веские плюсы.

```
/project-root
  /backend    // Здесь Laravel
  /frontend   // Здесь Nuxt
```

### Раздельное размещение (microservices)

Здесь Laravel и Nuxt — независимые сервисы, которые могут жить даже на разных доменах или серверах. Это чуть сложнее в настройке коммуникации, но дает максимум гибкости для масштабирования и развития проектов.

Интеграция Laravel и Nuxt может значительно расширить возможности вашего приложения, но требует понимания обеих технологий. Важно не только настроить взаимодействие между фронтендом и бэкендом, но и правильно организовать структуру проекта, настроить авторизацию и обеспечить безопасность. Если вы хотите освоить все тонкости интеграции Laravel и Nuxt, приходите на наш большой курс [Nuxt - fullstack Vue фреймворк](https://purpleschool.ru/course/nuxt?utm_source=knowledgebase&utm_medium=article&utm_campaign=integratsiya-laravel-i-nuxt). На курсе 129 уроков и 13 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Когда выбирать какой подход

- **Monorepo** подойдет, если не планируется масштабировать сервисы или выполнять отдельный деплой; для небольших и средних команд.
- **Раздельное размещение** дает больше свободы, позволяет независимо обновлять и масштабировать компоненты, но требует грамотной настройки CORS, авторизации, инфраструктуры.

Теперь давайте разберёмся с настройкой обоих инструментов и их взаимодействием.

## Шаг 1. Инициализация Laravel API

### Установка Laravel

Сначала нужно развернуть Laravel API. Вот команда:

```bash
composer create-project laravel/laravel backend
```

### Создание маршрутов для API

Откройте файл `routes/api.php` и добавьте простой пример:

```php
Route::get('/user', function(Request $request) {
    // Возвращаем пользователя, если он авторизован
    return $request->user();
})->middleware('auth:sanctum');
```
Этот маршрут защищён авторизацией через Sanctum (подключите пакет, если нужно).

### Настройка CORS

Nuxt и Laravel часто живут на разных портах или хостах, поэтому настройте CORS:

В `config/cors.php` настройте параметр `allowed_origins`:

```php
'allowed_origins' => ['http://localhost:3000'], // Порт Nuxt по умолчанию
```

### Запуск сервера

```bash
php artisan serve --host=localhost --port=8000
```

## Шаг 2. Создание frontend на Nuxt

### Установка Nuxt

В проекте создайте фронтенд:

```bash
npx nuxi init frontend
cd frontend
npm install
```

### Базовая настройка доступа к API

Добавьте в Nuxt `.env` файл:

```
API_BASE_URL=http://localhost:8000/api
```

Теперь подключите этот URL в Nuxt (например, с помощью pinia или напрямую в fetch):

```js
// frontend/plugins/api.js
export default function({ $config }, inject) {
  const api = $fetch.create({
    baseURL: process.env.API_BASE_URL,
  });
  inject('api', api);
}
```

### Получение данных с API

Пример использования API в странице:

```vue
<script setup>
const { data: user } = await useFetch('/user', {
  baseURL: useRuntimeConfig().public.apiBase
})
</script>

<template>
  <div v-if="user">
    Привет, {{ user.name }}!
  </div>
</template>
```

// Здесь выводим информацию о пользователе, если она получена с сервера.

## Шаг 3. Подключение авторизации и токенов

### Используем Sanctum для SPA

Laravel Sanctum идеально подходит для SPA, так как поддерживает session-based авторизацию.

1. Установите Sanctum:
    ```bash
    composer require laravel/sanctum
    php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
    php artisan migrate
    ```

2. В `kernel.php` добавьте мидлварь:
    ```php
    use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
    ...
    'api' => [
        EnsureFrontendRequestsAreStateful::class,
        'throttle:api',
        'bindings',
    ]
    ```

3. В файле `config/sanctum.php` настройте:
    ```php
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost:3000')),
    ```
    // Здесь перечислены домены, с которых разрешено принимать куки авторизации.

4. В Nuxt отправляйте запрос на `login`, чтобы получить cookie:

```js
// frontend/composables/useAuth.js
export const useLogin = async ({ email, password }) => {
  return await $fetch('/login', {
    baseURL: useRuntimeConfig().public.apiBase,
    method: 'POST',
    body: { email, password },
    credentials: 'include' // Критично важно для работы с cookie
  })
}
```
Теперь все последующие запросы с `credentials: "include"` будут автоматически авторизованы, если куки сохранены браузером.

### Тестируем авторизацию

```vue
<script setup>
import { useLogin } from '~/composables/useAuth'

const email = ref('')
const password = ref('')
const loggedIn = ref(false)

const login = async () => {
  try {
    await useLogin({ email: email.value, password: password.value })
    loggedIn.value = true
  } catch (error) {
    // Обработка ошибки авторизации
  }
}
</script>

<template>
  <form @submit.prevent="login">
    <input v-model="email" type="email" />
    <input v-model="password" type="password" />
    <button>Войти</button>
    <p v-if="loggedIn">Вы вошли!</p>
  </form>
</template>
```

## Шаг 4. SSR и проксирование запросов

### Проксирование API через Nuxt

Для SSR вам важно, чтобы запросы с сервера шли напрямую на правильный API и не ломали политику CORS.

Добавьте в `nuxt.config.ts` модуль proxy:

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/proxy'],
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
    },
  },
})
```

Теперь ваши fetch/post запросы к `/api/...` будут автоматически отправлены на Laravel.

### SSR и session-based авторизация

Если вы хотите, чтобы пользователи были авторизованы на сервере во время SSR:

- На стороне сервера передавайте куки `laravel_session` — Nuxt автоматически подхватит их из браузера.
- Используйте серверные middleware в Nuxt для автоподключения пользователя к текущей сессии.

Пример серверного middleware:

```js
// frontend/server/middleware/auth.js
export default defineEventHandler(async (event) => {
  // Извлекаем куки из запроса Nuxt
  const cookies = parseCookies(event)
  if (!cookies['laravel_session']) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  // Дальше можно обращаться к Laravel API с этими куки
})

// Этот код на сервере Nuxt проверяет, что сессия есть, и при необходимости авторизует пользователя.
```

## Шаг 5. Deployment и архитектура в продакшн

### Сервинг Nuxt из Laravel

В малых проектах иногда Nuxt билдится как static SPA в папку `public/` Laravel, которая раздается Laravel сервером или nginx:

```bash
npm run build
npm run generate
# Копируем dist в public
cp -r .output/public ../backend/public/nuxt
```

Теперь ваши Nuxt-страницы доступны вместе с Laravel-контентом. Но такой способ работает, только если не нужен полноценный SSR.

### Классическая схема: разделенные серверы

Nuxt деплоится изолированно на node.js сервер (или Vercel, Netlify, Cloud-run и др.), а Laravel — на своем php/mariadb/nginx/apache сервере. Всё взаимодействие по HTTPS API.

#### Пример nginx-конфига:

```
server {
    server_name your-app.com;
    location /api/ {
        proxy_pass http://laravel:8000/api/;
    }
    location / {
        proxy_pass http://nuxt:3000/;
    }
}
```

Обратите внимание: `http://laravel:8000` и `http://nuxt:3000` — внутренние адреса сервисов docker/kubernetes.

## Шаг 6. Лучшие практики интеграции

1. **Документируйте API** — используйте OpenAPI/Swagger или Laravel Swagger для автогенерации документации.
2. **Валидация данных** — валидируйте всё на обеих сторонах: на frontend перед отправкой, на backend перед обработкой.
3. **Разделяйте ответственность** — избегайте смешивания бизнес-логики с роутингом и отдачей данных на frontend.
4. **Работайте с ошибками правильно** — реализуйте глобальный обработчик ошибок на frontend и backend.
5. **Масштабируйте роутинг** — не делайте сверх универсальных catch-all роутов на Laravel и Nuxt без явной необходимости.
6. **Безопасность прежде всего** — внедрите CSRF, XSS-защиту, rate limiter, HTTPS.

## Особенности взаимодействия при использовании SSR и SPA

- Для SPA (Nuxt Client-side): используем session cookie авторизацию через Sanctum или JWT.
- Для SSR: отдельно прокидываем куки и/или токены, чтобы сервер Nuxt мог авторизовать пользователя для предпросмотра страницы.

## Пример полной структуры проекта

```
/project-root
  /backend    // Laravel API, в корне — routes, app, config и пр.
  /frontend   // Nuxt, все .vue страницы, assets, config и SSR настройки
  .env        // Общие переменные окружения, отдельно .env для Laravel, .env для Nuxt
  docker-compose.yml // (рекомендуется)
```

## Заключение

Интеграция Laravel и Nuxt помогает создать современное, масштабируемое и производительное веб-приложение. Вы получаете сильный backend на Laravel для обработки логики и данных, а с помощью Nuxt реализуете откликающийся, динамичный интерфейс. В статье мы рассмотрели основные архитектурные подходы, подключение API и авторизации, взаимодействие через SSR/SPA, примеры для запуска и деплоя, а также ключевые моменты безопасности и стабильности.

Интеграция с Laravel - это лишь один из возможных сценариев использования Nuxt. Чтобы создавать гибкие и масштабируемые приложения, необходимо освоить все возможности фреймворка, включая работу с различными API, управление состоянием и SEO-оптимизацию. На нашем курсе [Nuxt - fullstack Vue фреймворк](https://purpleschool.ru/course/nuxt?utm_source=knowledgebase&utm_medium=article&utm_campaign=integratsiya-laravel-i-nuxt) вы найдете все необходимые знания и навыки для решения любых задач. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в Nuxt прямо сегодня.

## Частозадаваемые технические вопросы по теме и ответы

### Как правильно настраивать CORS для работы Nuxt и Laravel на разных доменах?

В Laravel укажите в `config/cors.php` список всех origin ваших frontend-доменов. Если используется авторизация по cookie, обязательно настройте credentials в CORS и не используйте wildcard `*`.

### Как вынести Nuxt и Laravel на отдельные домены и при этом не потерять сессионную авторизацию?

В `config/session.php` Laravel поменяйте `domain` на `.yourdomain.com`, чтобы cookie распространялись на все поддомены. В Sanctum настройте `stateful` на список фронтовых доменов.

### Как отлаживать Nuxt SSR вместе с Laravel API во время разработки?

Запускайте Laravel на одном порту, Nuxt на другом, в Nuxt конфиге указывайте proxy на порт backend API. Используйте инструмент для инспекции cookie и network в браузере, чтобы убедиться в корректном обмене.

### Почему не работает сохранение авторизации (cookie) между Nuxt и Laravel?

Часто проблема в том, что либо неправильно настроен CORS (нет поддержки credentials), либо домены не совпадают, либо cookie отправляются только по HTTP, а вы пытаетесь работать по HTTPS, или наоборот.

### Как обработать ошибки API централизованно в Nuxt?

Вы создаете в Nuxt runtime middleware, который перехватывает ответы с ошибками и перенаправляет пользователей на страницу ошибки или отображает глобальные уведомления. Пример:

```js
export default function ({ $axios }) {
  $axios.onError(error => {
    // Ваш код обработки ошибок
  })
}
```
Используйте этот подход для единообразной обработки ошибок с Laravel API.
