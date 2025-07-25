---
metaTitle: Настройка и использование cookie в Nuxt
metaDescription: Обзор работы с cookie в Nuxt - разбор настроек, методов чтения и записи, SSR и best practices для защиты данных и удобства работы с куками
author: Олег Марков
title: Настройка и использование cookie в Nuxt
preview: Пошаговое руководство по настройке и использованию cookie в Nuxt - узнайте, как читать, устанавливать и защищать куки на сервере и клиенте с примерами кода
---

## Введение

Работа с cookie — неотъемлемая часть современных веб-приложений, в особенности при разработке на таких фреймворках, как Nuxt. Cookie позволяют сохранять состояния пользователя, передавать токены авторизации, настраивать персонализацию и отслеживать активность. В приложениях на Nuxt взаимодействие с cookie имеет ряд особенностей: из-за универсального рендеринга (SSR и SSG), разделения контекстов сервера и клиента и строгих политик безопасности.

Здесь вы узнаете, как в Nuxt правильно читать, записывать и удалять cookie как на клиенте, так и на сервере. Мы рассмотрим лучшие подходы, популярные библиотеки, практики для повышения безопасности и надежности работы с cookie. Примеры и комментарии к коду помогут вам с легкостью внедрить работу с cookie в ваш проект.

## Особенности работы с cookie в Nuxt

### Клиентская и серверная работа с cookie

Nuxt поддерживает универсальный рендеринг, поэтому код может выполняться как на сервере (Node.js), так и на клиенте (в браузере). Это значит, что контекст работы с cookie зависит от этапа исполнения.

- **На клиенте** вы используете стандартные браузерные методы (например, document.cookie).
- **На сервере** работа с cookie идет через HTTP-заголовки (например, req.headers.cookie и res.setHeader).

Это важно помнить при написании универсального кода Nuxt — некоторые методы доступны только на одной стороне.

### Когда можно использовать cookie

- Для хранения токенов сеанса (с осторожностью!).
- Для хранения пользовательских настроек (например, выбора языка).
- Для трекинга и аналитики (например, идентификатор сессии).
- Для хранения признаков согласия на cookie/рекламу.

Но cookie не предназначены для хранения больших объемов данных или чувствительных сведений без должной защиты.

## Использование cookie на клиенте Nuxt

### Стандартный способ

В браузере вы обращаетесь к cookie через свойство `document.cookie`. Вот как это выглядит:

```js
// Устанавливаем cookie
document.cookie = 'username=oleg; SameSite=Lax; path=/'

// Читаем cookie
const cookies = document.cookie // Строка всех cookie вида "key1=val1; key2=val2"

// Парсим cookie в объект
function parseCookies(cookieString) {
  const cookies = {}
  cookieString.split(';').forEach(cookie => {
    const [key, value] = cookie.split('=')
    if (key && value) {
      cookies[key.trim()] = decodeURIComponent(value)
    }
  })
  return cookies
}

const cookiesObj = parseCookies(document.cookie)
```

Но этот способ работает **только в браузере**, при серверном рендеринге `document` не существует.

### Использование библиотек для работы с cookie

Для более удобной работы рекомендуют использовать сторонние пакеты, такие как [js-cookie](https://github.com/js-cookie/js-cookie):

```bash
npm install js-cookie
```

Пример с `js-cookie` внутри компонента Nuxt:

```js
import Cookie from 'js-cookie'

export default {
  mounted() {
    // Устанавливаем cookie
    Cookie.set('username', 'oleg', { path: '/', sameSite: 'Lax' })
    // Читаем cookie
    const user = Cookie.get('username')
    // Удаляем cookie
    Cookie.remove('username')
  }
}
```

Преимущество: удобные методы для работы с cookie, поддержка опций безопасности, нет необходимости разрабатывать собственный парсер.

## Работа с cookie на сервере (SSR) в Nuxt

Когда страница рендерится на сервере, обращаться к cookie нужно через HTTP-запросы и ответы.

### Получение cookie из запроса

В `asyncData`, `serverMiddleware`, хук `nuxtServerInit` или в `middleware` вы получаете доступ к объекту `context` или отдельным объектам `req` (Request) и `res` (Response).

Посмотрим на практический пример:

```js
// Пример использования в серверном middleware
export default function (req, res, next) {
  // req.headers.cookie - строка всех cookie, если они есть
  const cookieHeader = req.headers.cookie || ''

  // Примитивный парсинг cookie в объект
  const cookies = {}
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=')
    if (parts.length === 2) {
      cookies[parts[0].trim()] = decodeURIComponent(parts[1])
    }
  })

  // Кладем cookies в req для дальнейшего использования
  req.cookies = cookies

  // Теперь любые данные из куки доступны как req.cookies['название']
  next()
}
```

### Использование пакета cookie для SSR

Лучше использовать специализированные парсеры, например [cookie](https://www.npmjs.com/package/cookie):

```bash
npm install cookie
```

В middleware:

```js
import cookie from 'cookie'

export default function (req, res, next) {
  req.cookies = cookie.parse(req.headers.cookie || '')
  next()
}
```

Теперь в серверных методах вы получаете `req.cookies['my_cookie']`.

### Установка cookie на сервере

Чтобы установить куку с сервера, нужно добавить заголовок Set-Cookie:

```js
export default function (req, res, next) {
  // Формируем строку cookie
  res.setHeader('Set-Cookie', 'theme=dark; Path=/; HttpOnly; SameSite=Strict')
  next()
}
```

Если используется несколько cookie, используйте массив:

```js
res.setHeader('Set-Cookie', [
  'theme=dark; Path=/',
  'lang=ru; Path=/'
])
```

Пакет `cookie` помогает формировать корректные строки:

```js
import cookie from 'cookie'

res.setHeader('Set-Cookie', cookie.serialize('user_id', '12345', {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 1 неделя
  path: '/'
}))
```

Показываю, как ставить несколько cookie:

```js
res.setHeader('Set-Cookie', [
  cookie.serialize('theme', 'dark', { path: '/' }),
  cookie.serialize('lang', 'ru', { path: '/' })
])
```

## Cookie в middleware Nuxt

### Клиентское middleware

В клиентском `middleware` вы работаете с cookie через браузерные методы или `js-cookie`.

```js
// middleware/auth.js
import Cookie from 'js-cookie'

export default function ({ redirect }) {
  if (!Cookie.get('token')) {
    return redirect('/login')
  }
}
```

### Серверное middleware

В серверном (universal/server) middleware — используйте `req` и парсинг, как показано выше:

```js
// middleware/only-auth.js
export default function ({ req, redirect }) {
  const cookieHeader = req && req.headers ? req.headers.cookie : ''
  if (!cookieHeader || !cookieHeader.includes('token=')) {
    return redirect('/login')
  }
}
```

## Работа с cookie в Nuxt 3

В Nuxt 3 появился встроенный Composables API для работы с cookie (например, `useCookie`). Это упрощает многие сценарии.

```js
// На сервере (например, в server/api/…)
export default defineEventHandler((event) => {
  // Чтение cookie
  const theme = useCookie('theme').value

  // Установка cookie
  const counter = useCookie('counter')
  counter.value = 5

  // Возвращаем данные с учетом куки
  return { theme, counter: counter.value }
})
```

На клиенте `useCookie` тоже работает — для синхронизации статуса между сервером и клиентом:

```js
const lang = useCookie('lang')
lang.value = 'en'
```

### Опции безопасности

Nuxt 3 `useCookie` поддерживает передаваемые опции:

```js
const userId = useCookie('user_id', {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 3600
})
userId.value = '54321'
```

**Комментарий:** httpOnly разрешает доступ к куке только серверным скриптам, а `sameSite` защищает от CSRF-атак.

## Защита и best practices

### HttpOnly и Secure

- Используйте флаг `HttpOnly` для cookie, которые не должны читаться на клиенте (например, токены сесcий).
- Включайте флаг `Secure` для cookie, передаваемых только по HTTPS.
- Всегда задавайте параметр `SameSite` (lax или strict) для улучшения безопасности.

### Ограничивайте жизненный цикл cookie

- Используйте опцию `maxAge` или `expires`, чтобы задать срок действия cookie.
- Не делайте cookie «бессрочными» без необходимости.

### Не храните чувствительные данные в cookie

- Хранить только токены (например, JWT), не секретные данные.
- Для авторизации лучше отдавать предпочтение HttpOnly cookie.

### Используйте отдельные cookie для авторизации и пользовательских настроек

Это позволит точнее настраивать права доступа и механизмы очистки.

## Примеры: Чтение, создание, удаление cookie в Nuxt

### Получение cookie (универсальный способ)

Давайте реализуем фасад, который скрывает детали клиента и сервера:

```js
// utils/cookies.js
import Cookie from 'js-cookie'
import cookie from 'cookie'

// Получить cookie
export function getCookie(ctx, name) {
  if (process.server && ctx.req) {
    // Сервер — парсим заголовок
    const cookies = cookie.parse(ctx.req.headers.cookie || '')
    return cookies[name]
  } else {
    // Браузер — используем js-cookie
    return Cookie.get(name)
  }
}

// Установить cookie
export function setCookie(ctx, name, value, opts = {}) {
  if (process.server && ctx.res) {
    // Сервер — готовим заголовок
    ctx.res.setHeader('Set-Cookie', cookie.serialize(name, value, opts))
  } else {
    // Клиент
    Cookie.set(name, value, opts)
  }
}

// Удалить cookie
export function removeCookie(ctx, name) {
  if (process.server && ctx.res) {
    ctx.res.setHeader('Set-Cookie', cookie.serialize(name, '', {
      maxAge: -1
    }))
  } else {
    Cookie.remove(name)
  }
}
```

В любом компоненте или middleware теперь можно делать так:

```js
import { getCookie, setCookie, removeCookie } from '~/utils/cookies'

// Читаем
const token = getCookie(ctx, 'token')
// Сохраняем
setCookie(ctx, 'lang', 'en', { path: '/' })
// Удаляем
removeCookie(ctx, 'token')
```

Это позволяет избежать дублирования логики для сервера и клиента.

## Как работать с cookie в плагинах Nuxt

В Nuxt плагины позволяют внедрять обработку cookie на раннем этапе загрузки.

```js
// plugins/cookies.js
import Cookie from 'js-cookie'
export default ({ app }, inject) => {
  inject('cookies', {
    get: Cookie.get,
    set: Cookie.set,
    remove: Cookie.remove
  })
}
```

Теперь в компонентах и сторе вы можете использовать:

```js
this.$cookies.set('theme', 'dark')
const theme = this.$cookies.get('theme')
this.$cookies.remove('theme')
```

Если нужен SSR, комбинируйте этот подход с серверным парсером.

## Пример согласия на cookie

Частая задача — показать баннер с просьбой согласиться на использование cookie и сохранить решение:

```vue
<template>
  <div v-if="showBanner" class="cookie-banner">
    Этот сайт использует cookie.
    <button @click="acceptCookies">ОК</button>
  </div>
</template>

<script>
import Cookie from 'js-cookie'

export default {
  data() {
    return {
      showBanner: false
    }
  },
  mounted() {
    this.showBanner = !Cookie.get('cookie_accepted')
  },
  methods: {
    acceptCookies() {
      Cookie.set('cookie_accepted', true, { expires: 365 })
      this.showBanner = false
    }
  }
}
</script>
```
**Комментарий:** Этот пример прост, но блокирует повторное появление баннера, если пользователь согласился.

## Cookie и Vuex (nuxtServerInit)

В `nuxtServerInit` вы можете синхронизировать cookie с глобальным стором:

```js
// store/index.js
import cookie from 'cookie'

export const actions = {
  nuxtServerInit({ commit }, { req }) {
    const cookies = cookie.parse(req.headers.cookie || '')
    commit('SET_LANG', cookies.lang || 'ru')
  }
}
```

Теперь при создании стор вы можете автоматически устанавливать состояние в зависимости от cookie.

## Заключение

Конечно, работа с cookie в Nuxt требует понимания нюансов SSR и различий между клиентским и серверным контекстом. На практике вы часто комбинируете подходы: используете удобные библиотеки на клиенте, строгие парсеры на сервере и фасадные методы для унификации логики. Не забывайте о безопасности: всегда используйте `HttpOnly`, `Secure` и `SameSite` флаги, ограничивайте срок действия и минимизируйте объем и значимость хранимых данных. Такой подход обеспечит стабильную и безопасную работу вашего приложения.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как обновлять cookie на сервере в Nuxt 2 после первого ответа?

**Ответ:** После отправки заголовков HTTP изменить cookie нельзя. Измените куку в middleware или api route до того, как Nuxt подготовил ответ. Если нужно обновить куку после ответа (например, из клиента), используйте JS-библиотеку для работы с cookie c client-side.

---

### Как удалить HttpOnly cookie с клиента?

**Ответ:** HttpOnly cookie нельзя удалить через JS — это защищающий механизм. Удалять такие cookie можно только с сервера, установив их с истекшим временем жизни (`maxAge: -1` или `expires: прошедшая дата`).

---

### Почему cookie не устанавливаются из serverMiddleware на продакшене?

**Ответ:** Обычно проблема в том, что backend и frontend раздаются разными доменами. Проверьте, что вы указываете корректный параметр `domain` в cookie и используете протокол HTTPS с флагом `Secure` там, где требуется.

---

### Как работать с cookie при SSR и статической генерации (SSG)?

**Ответ:** При SSG (статической генерации) cookie недоступны на этапе сборки, только в рантайме на клиенте. Для SSR используйте куки через `req`/`res` как описано выше, а для SSG всё делайте через client-side.

---

### Как синхронизировать cookie между несколькими поддоменами?

**Ответ:** При выставлении куки указывайте параметр `domain=ваш.домен` без поддоменов (например, `.mydomain.com`), чтобы они работали на всех поддоменах. Настройте также одинаковый `path` и следите за политиками SameSite.

---