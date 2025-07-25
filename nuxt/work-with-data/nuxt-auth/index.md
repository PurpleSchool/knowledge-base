---
metaTitle: Работа с аутентификацией в Nuxt через nuxt-auth
metaDescription: Полное руководство по работе с аутентификацией в Nuxt с помощью nuxt-auth - настройка, интеграция, примеры кода, лучшие практики
author: Олег Марков
title: Гайд по аутентификации (auth) в Nuxt
preview: Изучите, как реализовать безопасную и гибкую аутентификацию в Nuxt приложениях. Пошаговые инструкции, пояснения и примеры конфигурации nuxt-auth
---

## Введение

Аутентификация — один из ключевых аспектов современных веб-приложений. В Nuxt.js для организации аутентификации часто используют модуль nuxt-auth (или @sidebase/nuxt-auth, если нужен более свежий функционал). Он предоставляет мощные средства для внедрения аутентификации в SPA, SSR и SSG приложениях. С помощью nuxt-auth вы можете быстро добавить поддержку входа через сторонние сервисы (OAuth, OpenID Connect), локальной аутентификации (email/password), хранение токенов, обработку маршрутов и многое другое.

В этом руководстве я расскажу, как интегрировать nuxt-auth в ваше Nuxt-приложение, на что обратить внимание при настройке различных провайдеров и как обрабатывать токены, а также приведу реальные примеры кода. Всё объясняется максимально доступно, чтобы даже если вы только начинаете работать с Nuxt, вы сразу поняли, как использовать nuxt-auth.

---

## Установка и настройка nuxt-auth

### Выбор модуля

Существует несколько пакетов для аутентификации в Nuxt. Среди них:
- `@nuxt/auth-next` — популярный, но уже не поддерживается, только Nuxt 2.
- `@sidebase/nuxt-auth` — современный поддерживаемый модуль для Nuxt 3, работает на базе next-auth (server и edge).
- Некоторые интеграции вокруг Auth.js.

В этой статье я сфокусируюсь на `@sidebase/nuxt-auth`, так как он максимально актуален и гибок для Nuxt 3. Однако многие концепции и примеры подойдут для других схожих модулей.

### Установка nuxt-auth

Для начала убедитесь, что у вас установлен Nuxt 3. Затем добавьте nuxt-auth следующей командой:

```bash
npm install @sidebase/nuxt-auth
```

После этого подключите модуль в ваш nuxt.config.ts:

```typescript
export default defineNuxtConfig({
  modules: [
    '@sidebase/nuxt-auth'
  ],
  auth: {
    // Здесь будет ваша конфигурация провайдеров и опций
  }
});
```

### Первичная конфигурация

Настройка nuxt-auth начинается с указания одного или нескольких провайдеров (например, GitHub, Google или кастомный Credentials), а также параметров, отвечающих за сессии, куки и поведение клиента.

Пример минимальной конфигурации с провайдером GitHub:

```typescript
export default defineNuxtConfig({
  modules: [
    '@sidebase/nuxt-auth'
  ],
  auth: {
    origin: process.env.NUXT_PUBLIC_SITE_URL,
    enableGlobalAppMiddleware: true,
    providers: [
      {
        provider: 'github',
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET
      }
    ]
  }
});
```

// Здесь мы указываем URL вашего приложения, включаем глобальную middleware для обработки сессий и добавляем GitHub как OAuth-провайдер.

---

## Выбор и настройка провайдеров аутентификации

### Встроенные и кастомные провайдеры

nuxt-auth поддерживает множество популярных провайдеров из "коробки": Google, GitHub, Auth0, Discord и другие. Каждый провайдер требует отдельной настройки (обычно clientId и clientSecret).

**Пример с Google:**

```typescript
providers: [
  {
    provider: 'google',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  }
]
```

// Для Google OAuth вы получите clientId и clientSecret из консоли разработчика Google.

### Кастомный провайдер (Credentials)

Иногда вам нужна собственная логика авторизации (например, проверка email и пароля с бэкендом). Для этого подойдет credentials-провайдер:

```typescript
providers: [
  {
    provider: 'credentials',
    name: 'Credentials',
    credentials: {
      username: { label: "Email", type: "text", placeholder: "example@email.com" },
      password: { label: "Password", type: "password" }
    },
    authorize: async (credentials) => {
      // Здесь отправляем данные на наш API и возвращаем пользователя
      const res = await fetch('https://myapi.com/auth', {
        method: 'POST',
        body: JSON.stringify(credentials),
        headers: { 'Content-Type': 'application/json' }
      })
      const user = await res.json()
      if (res.ok && user) {
        return user
      }
      return null
    }
  }
]
```

// На этом этапе можно реализовать любую логику (например, с JWT от своего API).

---

## Работа с сессиями, токенами и куки

### Как nuxt-auth хранит сессии

Сессия пользователя может сохраняться в куках (стандартно — httpOnly cookies), что безопасно для SSR/SPA и позволяет автоматически получать текущего пользователя на сервере.

По умолчанию, nuxt-auth берет управление куками на себя, но вы можете указать свои параметры:

```typescript
session: {
  strategy: 'jwt', // или 'database', если используете свою БД
  maxAge: 30 * 24 * 60 * 60 // 30 дней
}
```

**Комментарий:** В большинстве случаев подходит strategy: 'jwt', так как данные токена хранятся в куки и проверяются на сервере.

### Как получить данные текущего пользователя

В клиентском коде вы делаете следующее:

```javascript
const { data: session, status } = useSession()
// session содержит объект пользователя, если он залогинен
```

// useSession — это Composable (hook), предоставляемый nuxt-auth. Он управляет загрузкой и реактивными изменениями сессии.

Если пользователь не залогинен, session.value будет null.

### Пример использования сессии в компоненте

Смотрите пример компонента LoginStatus.vue:

```vue
<script setup>
const { data: session, status } = useSession()

function signInWithGithub() {
  signIn('github') // Запускает flow авторизации через GitHub
}
function signOutUser() {
  signOut() // Производит выход пользователя
}
</script>

<template>
  <div>
    <div v-if="status === 'authenticated'">
        Здравствуйте, {{ session.user.name }}
        <button @click="signOutUser">Выйти</button>
    </div>
    <div v-else>
        <button @click="signInWithGithub">Войти через GitHub</button>
    </div>
  </div>
</template>
```

// Здесь, в зависимости от статуса аутентификации, показывается разный UI. Всё максимально просто.

---

## Защита маршрутов и middleware

### Как ограничить доступ к маршрутам

nuxt-auth добавляет middleware, которое можно использовать для защиты страниц. Просто укажите в meta объекта маршрута флаг, например:

```typescript
// pages/secret.vue
definePageMeta({
  auth: true // Эта страница теперь только для авторизованных пользователей
})
```

Теперь если неавторизованный пользователь зайдет на эту страницу, его автоматически переадресует на страницу входа.

Также вы можете гибко настраивать, какие роли или типы пользователей допускаются:

```typescript
definePageMeta({
  auth: {
    roles: ['admin', 'editor']
  }
})
```

### Кастомизация поведения middleware

Вы можете настроить, куда отправлять пользователя, если у него нет доступа, через конфиг:

```typescript
auth: {
  pages: {
    signIn: '/login', // Страница входа
    error: '/auth/error' // Страница ошибок
  }
}
```

---

## Управление состоянием аутентификации во всем приложении

### Использование useSession и реактивности

Вы всегда можете получить актуальное состояние пользователя через useSession:

```javascript
const { data: session, status, update } = useSession()
```

- session — объект пользователя с email, именем, и другими полями
- status — 'authenticated', 'unauthenticated', 'loading'
- update — ручное обновление сессии (если, например, пользователь изменил профиль)

Также можно использовать useAuthState, если нужны только булевые флаги:

```javascript
const { isLoggedIn, isLoading } = useAuthState()
```

### Автоматическая реакторизация при изменении токена

Если вы обновляете токен или иные данные на сервере, можно вручную вызвать обновление сессии:

```javascript
await update() // Перезагрузит данные пользователя без выхода и входа
```

Это удобно при изменении профиля или прав пользователя.

---

## Интеграция с backend API и авторизацией

### Получение токена для API запросов

Если ваш backend требует API-токен, nuxt-auth сохраняет JWT токен в httpOnly cookie. Чтобы получить токен на сервере (например, в server routes или API handlers), используйте useSession внутри server context:

```typescript
// server/api/example.ts
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  // Теперь у вас есть доступ к сессии пользователя сервера
  // Можно проверить права или отправить запрос к другому сервису
  if (!session) {
    throw createError({ statusCode: 401, message: 'Not authorized' })
  }
  
  // Используйте session.token для ваших задач
  // ...
})
```

### Пример: отправка авторизованных запросов на backend

Если пользователь залогинен и nuxt-auth выдает JWT токен, вы можете отправлять авторизованные запросы на backend по httpOnly cookie — никакие токены в LocalStorage не нужны.

---

## Гибкая настройка и события аутентификации

### Обработка событий

nuxt-auth позволяет слушать события (signIn, signOut, error и тд):

```typescript
auth: {
  events: {
    signIn: async (message) => {
      // message содержит данные о входе пользователя
      // Можно логировать или отправлять на внешний сервис мониторинга
    },
    signOut: async (message) => {
      // После выхода пользователя, например очистка данных
    }
  }
}
```

### Расширение объекта сессии

Можно добавить дополнительные поля в объект пользователя через callbacks:

```typescript
auth: {
  callbacks: {
    async session({ session, token }) {
      // Например, добавим userId
      session.userId = token.userId
      return session
    }
  }
}
```

---

## Безопасность и лучшие практики

### HTTPS, httpOnly Cookies и CSRF

- Используйте https — httpOnly cookie защищены только по https
- Никогда не храните токены в localStorage или заголовках, если можете их положить в httpOnly cookie
- Проверьте настройку cookie SameSite (по умолчанию 'lax', лучше 'strict' для большей безопасности)

### Как не потерять аутентификацию при SSR/SSG

Благодаря тому, что nuxt-auth использует серверные куки, вы можете получать session и user внутри Server Routes и Middleware — это безопасно и "работает из коробки" даже при SSR/SSG.

---

## Заключение

Модуль nuxt-auth — это мощный и гибкий инструмент для организации аутентификации в современных Nuxt-приложениях. С помощью удобной конфигурации, большого количества встроенных и кастомных провайдеров, поддержки SSR и возможности легко защищать маршруты, вы реализуете надежную аутентификацию для пользователей с минимальными усилиями.

Помните, что безопасность всегда важна: используйте https, внимательно проверяйте работу сессий и куки, не храните чувствительные данные на клиенте. Nuxt-auth предоставляет все необходимые механизмы для соблюдения этих правил.

---

## Частозадаваемые технические вопросы по nuxt-auth

### Как добавить несколько провайдеров одновременно?

Воспользуйтесь массивом в ключе providers:

```typescript
providers: [
  { provider: 'github', ... },
  { provider: 'google', ... }
]
```
Пользователь сможет выбрать способ входа.

---

### Как обработать ошибку авторизации (например, при невалидных данных)?

Вы можете настроить redirect на страницу ошибок или показать сообщение пользователю:

```typescript
auth: {
  pages: {
    error: '/auth/error'
  }
}
```
А внутри error.vue обработать разные варианты ошибки.

---

### Могу ли я получить access token стороннего провайдера (например, Google) на клиенте?

Стандартно access token хранится в session, возвращаемой hook useSession(). Для безопасности он может быть недоступен на клиенте. Если нужно использовать токен на клиентбе, настройте callbacks.session и явно добавьте token в session.user.

---

### Как работать с SSR-запросами к backend, если требуется авторизация?

Используйте getServerSession(event) в server routes. Он даст вам сессию (и токен) пользователя прямо на сервере, токен в httpOnly cookie.

---

### Как кастомизировать поля пользователя в session?

Добавьте callback session:

```typescript
auth: {
  callbacks: {
    async session({ session, token }) {
      session.role = token.role
      // Любые данные, которые вам нужны
      return session
    }
  }
}
```
Теперь эти поля будут приходить в useSession.
