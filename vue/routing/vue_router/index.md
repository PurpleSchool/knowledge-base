---
metaTitle: Vue Router - полноценное руководство по маршрутизации во Vue
metaDescription: Подробное руководство по Vue Router - настройка маршрутов - динамические пути - вложенные маршруты - защита маршрутов - работа с History API и навигацией
author: Олег Марков
title: Vue Router - как настроить маршрутизацию в приложении Vue
preview: Практическое объяснение Vue Router - от базовой настройки и подключения до динамических маршрутов - навигационных гардов и ленивой загрузки компонентов
---

## Введение

Vue Router — это официальный маршрутизатор для Vue.js, который помогает строить одностраничные приложения (SPA), разделяя интерфейс на логические страницы. Вместо того чтобы перезагружать всю страницу при переходе между разделами, вы меняете только нужные компоненты, сохраняя ощущение обычного сайта.

В этой статье вы увидите, как шаг за шагом настроить Vue Router, объявить маршруты, передавать параметры, защищать страницы, работать с историей браузера и организовать структуру приложения так, чтобы она была удобной и расширяемой. Я буду пояснять на практике — через примеры кода и разбор типичных сценариев.

---

## Установка и базовая настройка Vue Router

### Установка для Vue 3

Для начала вы устанавливаете пакет vue-router:

```bash
npm install vue-router
# или
yarn add vue-router
# или
pnpm add vue-router
```

Теперь давайте настроим маршрутизатор. Обычно создают отдельный файл `src/router/index.js` (или `index.ts`, если вы используете TypeScript).

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
// Импортируем компоненты, которые будут рендериться по маршрутам
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'

// Описываем массив маршрутов
const routes = [
  {
    path: '/',            // Путь в адресной строке
    name: 'home',         // Удобное имя маршрута
    component: HomeView,  // Компонент, который нужно отрендерить
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
  },
]

// Создаем экземпляр роутера
const router = createRouter({
  history: createWebHistory(), // Используем HTML5 History API
  routes,                      // Передаем массив маршрутов
})

export default router
```

Теперь подключим роутер к приложению:

```js
// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Импортируем настроенный роутер

const app = createApp(App)

// Подключаем роутер к приложению
app.use(router)

// Монтируем приложение
app.mount('#app')
```

И не забудьте добавить место, куда будут подставляться компоненты текущего маршрута.

```vue
<!-- App.vue -->
<template>
  <div>
    <!-- Здесь будет рендериться активный маршрут -->
    <router-view />
  </div>
</template>

<script setup>
// Здесь может быть логика корневого компонента
</script>
```

Как видите, базовая конфигурация достаточно проста: вы объявляете маршруты, создаете экземпляр роутера и подключаете его к приложению.

---

## Определение маршрутов и их структура

### Минимальная конфигурация маршрута

Каждый маршрут — это объект с набором свойств. Давайте посмотрим на базовый вариант:

```js
const routes = [
  {
    path: '/users',       // URL-путь
    name: 'users',        // Имя маршрута (необязательно, но очень полезно)
    component: () => import('../views/UsersView.vue'),
    // Здесь можно добавить дополнительные параметры
  },
]
```

Комментарий к важным полям:

- `path` — строка пути, по которой будет срабатывать маршрут.
- `name` — удобный идентификатор, по которому вы сможете обращаться к маршруту в коде.
- `component` — компонент, который нужно отрисовать. Здесь я использую динамический импорт для ленивой загрузки (мы разберем это позже подробнее).

### Маршруты и структура проекта

Обычно выносить все маршруты в один огромный файл не очень удобно. Лучше группировать их по модулям. Например:

```js
// src/router/userRoutes.js
import UserListView from '../views/users/UserListView.vue'
import UserProfileView from '../views/users/UserProfileView.vue'

export const userRoutes = [
  {
    path: '/users',
    name: 'users-list',
    component: UserListView,
  },
  {
    path: '/users/:id',
    name: 'user-profile',
    component: UserProfileView,
  },
]
```

А затем объединить:

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { userRoutes } from './userRoutes'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  ...userRoutes, // Здесь мы разворачиваем массив маршрутов пользователей
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

Такой подход помогает вам держать маршруты рядом с соответствующими частями приложения.

---

## Типы history и работа с адресной строкой

### createWebHistory vs createWebHashHistory

Vue Router поддерживает несколько способов управления историей:

- `createWebHistory()` — использует HTML5 History API, адреса вида `/users/10`.
- `createWebHashHistory()` — использует хэш-часть URL, адреса вида `/#/users/10`.
- `createMemoryHistory()` — хранит историю в памяти, часто используется для тестов или не-браузерной среды.

Пример с хэш-историей:

```js
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(), // Путь вида /#/about
  routes,
})
```

Хэш-режим проще с точки зрения настройки сервера, потому что все после `#` не обрабатывается сервером. Но с точки зрения UX и SEO чаще выбирают `createWebHistory()`, и тогда важно правильно настроить сервер, чтобы все запросы отдавали `index.html` (кроме статики).

### Настройка fallback на сервере (кратко)

Если вы используете `createWebHistory()`, сервер должен отдавать один и тот же HTML для любых маршрутов приложения. В противном случае обновление страницы по адресу `/users/10` даст 404.

Например, в Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Комментарий:

// Сначала пытаемся отдать файл по пути
// Если файла нет — отдаем index.html, где уже работает Vue Router

---

## Навигация: ссылки и программные переходы

### Компонент RouterLink

Для создания ссылок используется компонент `<router-link>`. Давайте разберемся на примере:

```vue
<template>
  <nav>
    <!-- Переход по имени маршрута -->
    <router-link :to="{ name: 'home' }">
      Главная
    </router-link>

    <!-- Переход по пути -->
    <router-link to="/users">
      Пользователи
    </router-link>
  </nav>
</template>

<script setup>
// Дополнительная логика навигации здесь не требуется,
// компонент RouterLink сам обрабатывает клики
</script>
```

Несколько моментов:

- `<router-link>` автоматически предотвращает перезагрузку страницы.
- По умолчанию он рендерится как `<a>` с корректным `href`.
- Активной ссылке добавляются классы `router-link-active` и `router-link-exact-active`.

Вы можете переопределить классы через настройки роутера:

```js
const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'is-active',        // Класс для "частично" активных ссылок
  linkExactActiveClass: 'is-exact',    // Класс для "точно" активных ссылок
})
```

### Программная навигация

Иногда нужно перейти по маршруту из кода — например, после успешного логина. Для этого используется метод `router.push`.

```vue
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const onLoginSuccess = () => {
  // Переходим на страницу профиля по имени маршрута
  router.push({ name: 'user-profile', params: { id: 42 } })
}
</script>
```

Подробности:

- `router.push` добавляет новый элемент в историю (как клик по ссылке).
- Если нужно заменить текущий URL (например, после редиректа), используйте `router.replace`.

```js
router.replace({ name: 'home' }) // Заменяем текущую запись в истории
```

Есть также методы назад и вперед:

```js
router.back()   // Аналог history.back()
router.forward() // Аналог history.forward()
router.go(-2)   // Шагнуть на 2 шага назад по истории
```

---

## Динамические маршруты и параметры

### Параметры в path

Динамические сегменты позволяют описывать маршруты вроде `/users/10` или `/posts/2023-01-01`. Запись делается через `:имяПараметра`.

```js
const routes = [
  {
    path: '/users/:id',          // :id — динамический сегмент
    name: 'user-profile',
    component: () => import('../views/UserProfileView.vue'),
  },
]
```

Теперь вы увидите, как это выглядит в компоненте:

```vue
<!-- UserProfileView.vue -->
<template>
  <div>
    <h1>Профиль пользователя {{ userId }}</h1>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// Здесь мы читаем параметр id из URL
const userId = route.params.id
// Если ожидаете число, лучше конвертировать:
// const userId = Number(route.params.id)
</script>
```

`useRoute()` возвращает реактивный объект маршрута. То есть, если вы перейдете с `/users/1` на `/users/2`, компонент останется тем же, но `route.params.id` изменится.

### Следим за изменениями параметров

По умолчанию Vue не размонтирует компонент, если маршрут меняется только в параметрах (например, `/users/1` → `/users/2`). Поэтому часто бывает нужно реагировать на изменение параметров.

Давайте разберемся на примере:

```vue
<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Изначальная загрузка
const loadUser = (id) => {
  // Здесь вы можете сделать запрос к API
  // Например, fetch(`/api/users/${id}`)
  console.log('Загружаем пользователя', id)
}

// Загружаем пользователя при первом монтировании
loadUser(route.params.id)

// Следим за изменением параметра id
watch(
  () => route.params.id,
  (newId, oldId) => {
    // Здесь мы вызываем загрузку при смене id
    loadUser(newId)
  }
)
</script>
```

Обратите внимание, как этот фрагмент кода решает задачу повторной загрузки данных при смене только параметров маршрута.

### Необязательные параметры и "catch-all"

Вы можете описать параметр, который захватывает несколько сегментов пути.

```js
const routes = [
  {
    path: '/files/:pathMatch(.*)*', // Захватывает все, что идет после /files/
    name: 'files',
    component: () => import('../views/FilesView.vue'),
  },
]
```

Теперь URL `/files/a/b/c.txt` будет иметь `route.params.pathMatch` как массив `['a', 'b', 'c.txt']`.

---

## Query-параметры (строка запроса)

### Чтение query-параметров

Query-параметры — это часть URL после `?`, например `/users?role=admin&page=2`. Вы можете читать их через `route.query`.

```vue
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// Здесь мы читаем параметры строки запроса
const role = route.query.role      // например "admin"
const page = Number(route.query.page || 1)  // преобразуем к числу
</script>
```

Важно помнить, что все значения в `route.query` — строки или массивы строк, поэтому при необходимости делайте приведение типов.

### Установка query-параметров

Теперь давайте посмотрим, как менять строку запроса программно:

```vue
<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const setPage = (page) => {
  router.push({
    name: 'users-list',
    query: {
      // Сохраняем остальные query-параметры
      ...route.query,
      page, // Меняем только page
    },
  })
}
</script>
```

Такой подход особенно удобен для фильтров и пагинации.

---

## Вложенные маршруты и RouterView внутри компонентов

### Зачем нужны вложенные маршруты

Вложенные маршруты позволяют вам создавать иерархию страниц. Например:

- `/users` — список пользователей
- `/users/10` — профиль пользователя
- `/users/10/settings` — настройки пользователя

Давайте разберемся, как это описать в конфигурации.

```js
const routes = [
  {
    path: '/users',
    component: () => import('../views/users/UsersLayout.vue'),
    children: [
      {
        path: '', // Пустой путь — совпадает с /users
        name: 'users-list',
        component: () => import('../views/users/UserListView.vue'),
      },
      {
        path: ':id', // /users/:id
        name: 'user-profile',
        component: () => import('../views/users/UserProfileView.vue'),
      },
      {
        path: ':id/settings', // /users/:id/settings
        name: 'user-settings',
        component: () => import('../views/users/UserSettingsView.vue'),
      },
    ],
  },
]
```

Теперь вы увидите, как это реализовано на практике в компоненте `UsersLayout.vue`:

```vue
<!-- src/views/users/UsersLayout.vue -->
<template>
  <div class="users-layout">
    <aside>
      <!-- Боковая панель со ссылками -->
      <router-link :to="{ name: 'users-list' }">Список пользователей</router-link>
    </aside>

    <main>
      <!-- Здесь будет рендериться активный дочерний маршрут -->
      <router-view />
    </main>
  </div>
</template>

<script setup>
// UsersLayout отвечает за общий макет для раздела "Пользователи"
</script>
```

Компонент `UsersLayout` всегда отображается при всех путях, которые начинаются с `/users`, а в его `<router-view>` подставляется уже дочерний компонент.

---

## Именованные RouterView и сложные макеты

Иногда у вас есть не один, а несколько областей, куда нужно подставлять компоненты в зависимости от маршрута: например, основная область и правый сайдбар. Для этого Vue Router поддерживает именованные `router-view`.

```vue
<!-- App.vue -->
<template>
  <header>Шапка сайта</header>

  <main>
    <!-- Основная область -->
    <router-view />

    <!-- Боковая область -->
    <router-view name="sidebar" />
  </main>
</template>
```

Теперь давайте добавим маршрут, который будет рендерить два компонента одновременно:

```js
import MainView from '../views/MainView.vue'
import SidebarView from '../views/SidebarView.vue'

const routes = [
  {
    path: '/dashboard',
    components: {
      // Обратите внимание - здесь свойство components (множественное число)
      default: MainView,     // Это попадет в обычный <router-view>
      sidebar: SidebarView,  // Это попадет в <router-view name="sidebar">
    },
  },
]
```

Так можно строить довольно сложные макеты, не придумывая лишних "оберток".

---

## Навигационные гарды (guards) и защита маршрутов

### Глобальные гарды: beforeEach и afterEach

Частая задача — пустить пользователя на страницу только при наличии токена или определенной роли. Для этого отлично подходят навигационные гарды.

Давайте разберемся на примере глобального `beforeEach`:

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Пример простой функции проверки авторизации
const isAuthenticated = () => {
  // Здесь можно проверять токен в localStorage или состояние хранилища
  return !!localStorage.getItem('token')
}

// Глобальный гард
router.beforeEach((to, from, next) => {
  // Смотрим на метаданные маршрута
  if (to.meta.requiresAuth && !isAuthenticated()) {
    // Если требуется авторизация и пользователь не залогинен,
    // перенаправляем на страницу логина
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    // Иначе продолжаем навигацию
    next()
  }
})

export default router
```

Теперь добавим метаданные маршрута, чтобы включить защиту.

```js
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: {
      requiresAuth: true, // Говорим гардy, что сюда нужен доступ только для авторизованных
    },
  },
]
```

Комментарии к коду:

// to — маршрут, на который мы переходим
// from — маршрут, с которого уходим
// next — функция, которую нужно вызвать, чтобы продолжить или прервать навигацию

Дополнительно есть `router.afterEach((to, from) => { ... })`, который вызывается уже после завершения перехода. Часто он используется для аналитики или смены заголовка страницы.

### Гарды на уровне компонента и маршрута

Кроме глобальных гардов есть:

- Гарды на уровне маршрута: `beforeEnter`.
- Гарды внутри компонента: `beforeRouteEnter`, `beforeRouteUpdate`, `beforeRouteLeave`.

#### beforeEnter в конфигурации маршрута

```js
const routes = [
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
    beforeEnter: (to, from, next) => {
      // Здесь может быть специфичная для этого маршрута проверка
      const isAdmin = localStorage.getItem('role') === 'admin'

      if (!isAdmin) {
        next({ name: 'home' }) // Перенаправляем, если нет прав
      } else {
        next()
      }
    },
  },
]
```

#### Гарды внутри компонента (вариант с Options API)

Если вы используете Options API, можно объявить гарды прямо в компоненте:

```vue
<script>
export default {
  name: 'UserProfileView',

  // Вызывается до входа на маршрут с этим компонентом
  beforeRouteEnter(to, from, next) {
    // Здесь у вас еще нет доступа к this
    // Можно, например, загрузить данные
    next()
  },

  // Вызывается при изменении параметров маршрута для уже смонтированного компонента
  beforeRouteUpdate(to, from, next) {
    // Здесь this уже доступен
    // Можно отреагировать на изменение URL-параметров
    next()
  },

  // Вызывается перед уходом с маршрута
  beforeRouteLeave(to, from, next) {
    // Например, спрашиваем подтверждение, если есть несохраненные изменения
    const answer = window.confirm('Есть несохраненные изменения. Уйти со страницы?')
    if (answer) {
      next()
    } else {
      next(false) // Отменяем навигацию
    }
  },
}
</script>
```

Для Composition API гарды можно использовать через функцию `onBeforeRouteLeave` из `vue-router`, но это уже дополнительный уровень — многие начинают без этого.

---

## Ленивые загрузки и code splitting

### Зачем нужна ленивость

Если вы импортируете все компоненты сразу, бандл может стать слишком большим, и первое открытие страницы будет медленным. Чтобы этого избежать, для маршрутов часто используют ленивую загрузку: браузер загружает код компонента только при первом переходе на соответствующий маршрут.

Смотрите, я покажу вам, как это выглядит:

```js
const routes = [
  {
    path: '/about',
    name: 'about',
    // Вместо прямого импорта используем динамический импорт
    component: () => import('../views/AboutView.vue'),
  },
]
```

Комментарий:

// Webpack, Vite и другие сборщики автоматически создадут отдельный чанк
// для этого компонента и подгрузят его по требованию

Можно дать чанку имя:

```js
const routes = [
  {
    path: '/about',
    name: 'about',
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/AboutView.vue'),
  },
]
```

Для Vite с ESBuild или Rollup обычно достаточно просто динамического импорта, без дополнительных комментариев.

---

## Работа с ошибками маршрутизации и 404

### Маршрут "страница не найдена"

Важно обрабатывать ситуацию, когда пользователь зашел на несуществующий URL. С Vue Router это делается через "catch-all" маршрут.

```js
const routes = [
  // ...ваши маршруты выше
  {
    path: '/:pathMatch(.*)*', // Совпадает с любым путем
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
]
```

Теперь, если ни один маршрут не совпал, отрендерится компонент `NotFoundView`.

```vue
<!-- NotFoundView.vue -->
<template>
  <div>
    <h1>Страница не найдена</h1>
    <p>Похоже, вы перешли по неверному адресу.</p>

    <!-- Ссылка назад на главную -->
    <router-link :to="{ name: 'home' }">
      Вернуться на главную
    </router-link>
  </div>
</template>

<script setup>
// Дополнительной логики может не быть
</script>
```

### Обработка ошибок при переходах

Методы `router.push` и `router.replace` могут возвращать промис. Это позволяет вам обрабатывать ошибки навигации.

```js
router
  .push({ name: 'profile' })
  .then(() => {
    // Навигация завершилась успешно
  })
  .catch((err) => {
    // Здесь вы можете обработать ошибку
    console.error('Ошибка навигации', err)
  })
```

Частая ситуация — попытка перейти на тот же самый маршрут с теми же параметрами. Vue Router в этом случае не делает ничего и может вернуть "NavigationDuplicated" (для Vue Router 3) или "NavigationFailure" (в Vue Router 4). Это нормальное поведение, и его стоит учитывать.

---

## Управление заголовком страницы и метаданными

Нередко нужно менять заголовок вкладки браузера в зависимости от маршрута. Вы можете использовать поле `meta` в определении маршрутов.

```js
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Главная' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
    meta: { title: 'О проекте' },
  },
]
```

Теперь добавим глобальный `afterEach`, который будет обновлять `document.title`.

```js
router.afterEach((to) => {
  const defaultTitle = 'Мое Vue приложение'
  // Если у маршрута есть meta.title, используем его
  document.title = to.meta.title
    ? `${to.meta.title} | Мое Vue приложение`
    : defaultTitle
})
```

Комментарий:

// Мы берем значение из to.meta.title
// и комбинируем его с базовым названием приложения

Так вы сможете легко поддерживать читабельные и понятные заголовки страниц, что важно и для UX, и для SEO (особенно в связке с SSR).

---

## Прокрутка страницы при навигации (scrollBehavior)

При переходах часто нужно управлять позицией прокрутки: возвращать пользователя к началу страницы или пытаться восстановить положение, как это делает браузер.

Vue Router поддерживает функцию `scrollBehavior` в конфигурации:

```js
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Если есть сохраненная позиция (например, навигация назад),
    // восстанавливаем ее
    if (savedPosition) {
      return savedPosition
    }

    // Если есть хэш (например, #section-2), прокручиваем к нему
    if (to.hash) {
      return {
        el: to.hash, // CSS-селектор элемента
        behavior: 'smooth', // Плавная прокрутка
      }
    }

    // Иначе прокручиваем в начало страницы
    return { top: 0 }
  },
})
```

Теперь давайте посмотрим, что происходит при обычной навигации: пользователь попадает в начало страницы; при навигации назад — позиция восстанавливается; при наличии якоря — страница прокручивается к нужному блоку.

---

## Организация структуры маршрутов в реальном приложении

Чтобы маршруты не превратились в хаос, полезно придерживаться нескольких практик.

### Разделяйте маршруты по доменным областям

Например:

- `src/router/authRoutes.js` — все, что связано с авторизацией.
- `src/router/userRoutes.js` — профиль и управление пользователями.
- `src/router/adminRoutes.js` — админка.
- `src/router/publicRoutes.js` — публичные страницы.

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from './authRoutes'
import { userRoutes } from './userRoutes'
import { adminRoutes } from './adminRoutes'
import { publicRoutes } from './publicRoutes'

const routes = [
  ...publicRoutes,
  ...authRoutes,
  ...userRoutes,
  ...adminRoutes,
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

Так вы облегчаете себе поддержку и добавление новых разделов.

### Храните константы маршрутов отдельно (по желанию)

Чтобы не копировать строки с именами маршрутов по всему проекту, можно вынести их в константы.

```js
// src/router/routeNames.js
export const ROUTE_NAMES = {
  HOME: 'home',
  LOGIN: 'login',
  USER_PROFILE: 'user-profile',
}
```

И использовать:

```js
import { ROUTE_NAMES } from '../router/routeNames'

router.push({ name: ROUTE_NAMES.LOGIN })
```

Это снижает риск опечаток и упрощает рефакторинг.

---

## Заключение

Вы увидели, как с помощью Vue Router можно построить маршрутизацию для одностраничного приложения: от базового объявления маршрутов и настройки history до динамических параметров, вложенных маршрутов, навигационных гардов и ленивой загрузки компонентов. Мы прошли через ключевые элементы:

- конфигурация маршрутов и подключение роутера;
- навигация через `<router-link>` и программные переходы;
- работа с `params` и `query`;
- организация вложенных маршрутов и именованных областей;
- защита страниц с помощью гардов;
- обработка 404 и настройка заголовков;
- управление прокруткой и структурой маршрутов в крупном приложении.

Эти концепции составляют основу повседневной работы с Vue Router. Освоив их, вы сможете уверенно проектировать маршрутизацию, поддерживать читаемую структуру URL и контролировать переходы между экранами так, как это требуется вашему приложению.

---

## Частозадаваемые технические вопросы по Vue Router

### Как передать пропсы в компонент маршрута, а не читать напрямую из route?

Вы можете включить опцию `props` в определении маршрута.

```js
const routes = [
  {
    path: '/users/:id',
    name: 'user-profile',
    component: () => import('../views/UserProfileView.vue'),
    props: (route) => ({
      // Здесь вы сами формируете пропсы
      userId: Number(route.params.id),
      tab: route.query.tab || 'info',
    }),
  },
]
```

Теперь в компоненте:

```vue
<script setup>
// Здесь мы принимаем userId как обычный проп
const props = defineProps({
  userId: Number,
  tab: String,
})
</script>
```

Такой подход делает компонент более переиспользуемым и независимым от роутера.

---

### Как сделать "активное" состояние для ссылки без RouterLink?

Вы можете использовать объект `useRoute` и сравнивать путь или имя маршрута вручную.

```vue
<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const goToUsers = () => {
  router.push({ name: 'users-list' })
}
</script>

<template>
  <button
    :class="{ active: route.name === 'users-list' }"
    @click="goToUsers"
  >
    Пользователи
  </button>
</template>
```

Класс `active` вы уже стилизуете в CSS по своему вкусу.

---

### Как дождаться завершения навигации, прежде чем выполнять код?

Метод `router.push` возвращает промис. Можно написать:

```js
await router.push({ name: 'profile' })
// Здесь код выполнится только после завершения перехода
initProfileWidgets()
```

Если вы используете Composition API, просто вызывайте `await` внутри async-функции.

---

### Как отменить переход при выполнении асинхронной проверки?

Внутри `beforeEach` или `beforeEnter` вы можете ждать асинхронный код и потом вызвать `next(false)`.

```js
router.beforeEach(async (to, from, next) => {
  const hasAccess = await checkPermissionsOnServer(to.name)

  if (!hasAccess) {
    next(false) // Отменяем переход
  } else {
    next()
  }
})
```

Если вы используете Vue Router 4, вы можете также выбросить ошибку: `throw new Error('No access')`, и навигация будет прервана.

---

### Как временно выключить историю браузера (например, в embedded-режиме)?

Можно использовать `createMemoryHistory()` вместо `createWebHistory()`.

```js
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(), // История в памяти, URL не меняется
  routes,
})
```

Такой режим удобен для встраиваемых виджетов или тестов, когда вам не нужно трогать адресную строку браузера.