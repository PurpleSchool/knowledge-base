---
metaTitle: Навигационные хуки navigation guards во фронтенд маршрутизации
metaDescription: Подробный разбор навигационных хуков navigation guards во фронтенд маршрутизаторах - маршрутизация защита маршрутов проверка прав и асинхронные переходы
author: Олег Марков
title: Навигационные хуки navigation guards - полный практический разбор
preview: Разбираем навигационные хуки navigation guards - как они работают в маршрутизаторе как проверять доступ и контролировать переходы с примерами кода
---

## Введение

Навигационные хуки (navigation guards) — это механизм маршрутизаторов во фронтенде, который позволяет вам перехватывать переходы между страницами и управлять ими. Говоря проще, вы можете выполнить свой код **до**, **после** или **во время** смены маршрута и при необходимости:

- отменить переход;
- перенаправить пользователя;
- подождать выполнения асинхронной операции (например, запроса к API);
- проверить авторизацию или другие условия.

Чаще всего вы встретите навигационные хуки в контексте Vue Router, React Router или аналогичных решений. В этой статье я буду объяснять на примерах Vue Router (потому что в нем термин navigation guards используется буквально), но сами идеи одинаково полезны и для других библиотек маршрутизации.

Смотрите, я покажу вам, как с помощью хуков:

- закрывать разделы приложения от неавторизованных пользователей;
- загружать данные до отображения страницы;
- предотвращать переход с несохраненными данными;
- логировать маршрутизацию и измерять время переходов.

## Типы навигационных хуков

Навигационные хуки в Vue Router (и большинстве похожих маршрутизаторов) можно условно разделить на несколько групп:

1. **Глобальные хуки** — действуют для всех маршрутов.
2. **Хуки на уровне маршрута** — задаются в конфигурации конкретного маршрута.
3. **Хуки на уровне компонента** — описываются прямо внутри компонента страницы.
4. **Дополнительные механизмы** — например, `beforeResolve` и `afterEach` для логирования и тонкой настройки потока.

Давайте разбираться постепенно.

### Глобальные навигационные хуки

Глобальные хуки регистрируются один раз при инициализации роутера и будут вызываться при каждом переходе.

В Vue Router (v3 / v4) есть такие глобальные хуки:

- `router.beforeEach` — срабатывает **перед каждым переходом**;
- `router.beforeResolve` — срабатывает после всех `beforeRouteEnter`, но до финального подтверждения перехода;
- `router.afterEach` — срабатывает **после** завершения перехода.

#### Глобальный beforeEach

Это самый часто используемый хук. Давайте разберемся на примере защиты маршрутов по требованию авторизации.

```js
// router.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import store from './store'
import HomePage from './pages/HomePage.vue'
import ProfilePage from './pages/ProfilePage.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
    meta: {
      requiresAuth: true // Маршрут доступен только авторизованным
    }
  }
]

const router = new VueRouter({
  mode: 'history', // Используем history API
  routes
})

// Глобальный навигационный хук
router.beforeEach((to, from, next) => {
  // Проверяем, требует ли маршрут авторизации
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // Получаем состояние авторизации из хранилища
  const isAuthenticated = store.getters['auth/isAuthenticated']

  if (requiresAuth && !isAuthenticated) {
    // Если нужен вход, а пользователя нет — перенаправляем
    next({
      name: 'home',
      query: { redirect: to.fullPath } // Сохраняем изначальный путь
    })
  } else {
    // Иначе разрешаем переход
    next()
  }
})

export default router
```

Что здесь важно:

- Параметры `to`, `from` — объекты маршрута:
  - `to` — куда переходим;
  - `from` — откуда пришли.
- Аргумент `next` — функция управления навигацией:
  - `next()` — продолжить переход;
  - `next(false)` — отменить переход и остаться на текущем маршруте;
  - `next('/login')` или объект маршрута — выполнить перенаправление;
  - `next(new Error('...'))` — прервать переход с ошибкой.

Обратите внимание, как `to.matched.some(...)` позволяет учитывать вложенные маршруты: если любой из уровней вложенности требует авторизацию, мы это увидим.

#### Глобальный beforeResolve

`beforeResolve` похож на `beforeEach`, но вызывается **после**:

- глобальных `beforeEach`;
- хуков маршрутов;
- хуков компонентов `beforeRouteEnter`.

Это удобно, когда вам нужно быть уверенным, что все остальные проверки уже прошли, и вы можете, например, финально загрузить какие‑то данные.

```js
router.beforeResolve(async (to, from, next) => {
  try {
    // Здесь мы можем, например, отслеживать загрузку
    // и запускать финальные асинхронные операции
    // beforeResolve будет последним "барьером" перед рендером
    await someFinalAsyncOperation(to)

    next() // Переход разрешен
  } catch (error) {
    // В случае ошибки можно перенаправить
    next({ name: 'error', params: { message: error.message } })
  }
})
```

Комментарии:

- `beforeResolve` часто используют для глобального индикатора загрузки, который нужно скрыть только когда уже все подготовлено к показу.
- Вызов `next` обязательно — иначе переход «зависнет».

#### Глобальный afterEach

`afterEach` вызывается **после** завершения перехода. Здесь уже нельзя отменить навигацию или перенаправить — этот хук только для побочных эффектов.

```js
router.afterEach((to, from) => {
  // Пример 1 - логирование
  console.log(
    `[ROUTER] Перешли с ${from.fullPath} на ${to.fullPath}`
  )

  // Пример 2 - отправка данных в аналитику
  sendPageView({
    path: to.fullPath,
    name: to.name
  })

  // Пример 3 - смена заголовка страницы
  if (to.meta && to.meta.title) {
    document.title = to.meta.title
  }
})
```

Как видите, этот хук хорошо подходит для аналитики, логирования, метрик и побочных действий, которые не должны влиять на сам факт перехода.

### Навигационные хуки на уровне маршрута

Иногда логично привязать хук к конкретному маршруту, а не ко всем подряд. В Vue Router вы можете указать `beforeEnter` прямо в объекте маршрута.

```js
const routes = [
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./pages/AdminPage.vue'),
    beforeEnter: (to, from, next) => {
      // Здесь можно, например, проверить роль пользователя
      const userRole = store.getters['auth/role']

      if (userRole === 'admin') {
        // Пускаем
        next()
      } else {
        // Отклоняем и отправляем на 403
        next({ name: 'forbidden' })
      }
    }
  }
]
```

Важные моменты:

- `beforeEnter` вызывается **после** глобальных `beforeEach`, но **до** хуков компонентов.
- Внутри `beforeEnter` вы не имеете доступа к `this` компонента, потому что компонент еще не создан. Это целенаправленно: guard не должен зависеть от состояния компонента.
- Этот хук удобно использовать для маршрутов с особой логикой доступа (админка, платные разделы, закрытые beta‑функции).

### Навигационные хуки в компонентах

Теперь перейдем к хукам, которые определяются прямо в компоненте маршрута. В Vue Router есть три таких хука:

- `beforeRouteEnter`
- `beforeRouteUpdate`
- `beforeRouteLeave`

Они описываются как методы компонента.

#### beforeRouteEnter

Смотрите, я покажу вам пример базового использования:

```js
// UserPage.vue
export default {
  name: 'UserPage',
  data() {
    return {
      user: null // Здесь мы будем хранить данные пользователя
    }
  },

  // Хук вызывается перед тем, как компонент будет создан
  beforeRouteEnter(to, from, next) {
    // Получаем идентификатор пользователя из параметров маршрута
    const userId = to.params.id

    // Загружаем данные пользователя до создания компонента
    fetch(`/api/users/${userId}`)
      .then(response => response.json())
      .then(userData => {
        // Передаем callback в next, чтобы получить доступ к экземпляру
        next(vm => {
          // vm — это экземпляр созданного компонента
          vm.user = userData // Сохраняем данные в состояние компонента
        })
      })
      .catch(error => {
        console.error('Ошибка загрузки пользователя', error)
        // Можно перенаправить пользователя на страницу ошибки
        next({ name: 'user-not-found' })
      })
  }
}
```

Здесь есть важная особенность: внутри `beforeRouteEnter` у вас **нет доступа к this**, потому что компонент еще не создан. Именно поэтому используется конструкция `next(vm => { ... })`, где `vm` — уже созданный экземпляр компонента.

Резюме по `beforeRouteEnter`:

- Отлично подходит для предзагрузки данных до показа страницы.
- Можно перенаправлять, отменять переход.
- Для доступа к компоненту используйте `next(vm => { ... })`.

#### beforeRouteUpdate

Этот хук срабатывает, когда **тот же самый компонент** повторно используется маршрутизатором, но изменяются параметры маршрута или query. Типичный случай — страница пользователя `/users/:id`: при переходе с `/users/1` на `/users/2` компонент `UserPage` может переиспользоваться, а не создаваться заново.

```js
// UserPage.vue
export default {
  name: 'UserPage',
  data() {
    return {
      user: null
    }
  },

  async created() {
    // Загружаем пользователя при первичном создании компонента
    await this.loadUser()
  },

  methods: {
    async loadUser() {
      // Получаем id из маршрута
      const userId = this.$route.params.id

      // Показываем индикатор загрузки
      this.loading = true

      try {
        const response = await fetch(`/api/users/${userId}`)
        this.user = await response.json()
      } finally {
        this.loading = false
      }
    }
  },

  // Хук вызывается при изменении параметров маршрута,
  // когда компонент переиспользуется
  beforeRouteUpdate(to, from, next) {
    // Обновляем данные на основе нового маршрута
    this.loadUser()
      .then(() => {
        // Разрешаем переход после завершения загрузки
        next()
      })
      .catch(error => {
        console.error('Ошибка при обновлении пользователя', error)
        // Можно перенаправить на страницу ошибки
        next({ name: 'user-not-found' })
      })
  }
}
```

Как видите, в `beforeRouteUpdate` уже можно использовать `this`, потому что компонент существует и просто обновляет свое состояние.

Ключевые моменты:

- `beforeRouteUpdate` обеспечивает корректную работу при переиспользовании компонентов.
- Если вы не обработаете этот кейс, компонент может продолжить показывать старые данные при смене параметров маршрута.

#### beforeRouteLeave

Этот хук вызывается, когда вы **покидаете** страницу. Чаще всего он нужен, чтобы предотвратить потерю несохраненных данных.

```js
// EditPostPage.vue
export default {
  name: 'EditPostPage',
  data() {
    return {
      form: {
        title: '',
        content: ''
      },
      originalForm: null // Состояние формы при загрузке
    }
  },

  created() {
    // Загружаем пост и сохраняем исходное состояние
    this.loadPost()
  },

  methods: {
    async loadPost() {
      const id = this.$route.params.id
      const response = await fetch(`/api/posts/${id}`)
      const post = await response.json()

      this.form.title = post.title
      this.form.content = post.content
      // Сохраняем копию для сравнения
      this.originalForm = { ...this.form }
    },

    hasChanges() {
      return (
        this.form.title !== this.originalForm.title ||
        this.form.content !== this.originalForm.content
      )
    }
  },

  beforeRouteLeave(to, from, next) {
    // Если есть несохраненные изменения — спросим пользователя
    if (this.hasChanges()) {
      const answer = window.confirm(
        'У вас есть несохраненные изменения. Уйти со страницы?'
      )
      if (!answer) {
        // Отменяем переход
        next(false)
      } else {
        // Разрешаем переход
        next()
      }
    } else {
      // Изменений нет — можно спокойно уходить
      next()
    }
  }
}
```

Обратите внимание:

- В `beforeRouteLeave` уже есть доступ к `this`, потому что компонент существует до самого последнего момента.
- Этот хук отлично подходит для подтверждений, autosave‑логики, сброса таймеров, отписки от сторонних подписок, если по какой‑то причине вы не делаете это в `beforeDestroy`/`unmounted`.

## Как работает поток навигации

Чтобы уверенно пользоваться навигационными хуками, полезно понимать порядок их вызова. Давайте посмотрим последовательность для перехода с маршрута A на маршрут B в Vue Router.

### Порядок вызова хуков

Упрощенная схема:

1. Все глобальные `beforeEach`.
2. Хуки `beforeRouteLeave` в компонентах **откуда** уходим.
3. Хуки `beforeRouteUpdate` в компонентах, которые переиспользуются (и присутствуют и в A, и в B).
4. Хуки маршрутов `beforeEnter`.
5. Асинхронные загрузки компонентов маршрутов (если есть).
6. Хуки `beforeRouteEnter` в компонентах **куда** приходим.
7. Все глобальные `beforeResolve`.
8. Переход подтверждается, роутер обновляет текущий маршрут.
9. Глобальные `afterEach`.
10. Колбэки `next(vm => ...)` из `beforeRouteEnter`.

Теперь давайте разберемся, почему это важно.

- Если вы хотите **гарантировать, что все проверки уже прошли**, используйте `beforeResolve`.
- Если нужно **останавливать пользователя при уходе со страницы**, используйте `beforeRouteLeave`.
- Если вам важно логировать **факт уже совершенного перехода**, то это `afterEach`.

### Синхронные и асинхронные хуки

Каждый хук может быть:

- синхронным (вызываете `next()` сразу);
- асинхронным (вы выполняете запросы, а потом в `.then`/`await` вызываете `next()`).

Важное правило: **вы обязаны один раз вызвать `next` (или вернуть промис в Vue Router 4 с `async/await`)**. Если не вызвать `next`, переход "зависнет".

Вот пример с `async/await`:

```js
router.beforeEach(async (to, from, next) => {
  try {
    // Ждем результата проверки токена
    const isValid = await checkToken()

    if (!isValid && to.meta.requiresAuth) {
      // Токен невалиден и маршрут требует авторизации
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else {
      // Все хорошо - идем дальше
      next()
    }
  } catch (error) {
    console.error('Ошибка при проверке токена', error)
    // Можно отправить на страницу с ошибкой
    next({ name: 'error' })
  }
})
```

Здесь:

- `async (to, from, next)` позволяет вам писать асинхронный код в привычной форме.
- `await checkToken()` — любая асинхронная проверка.
- Переход не продолжится, пока вы не вызовете `next()` или не сделаете перенаправление.

## Типичные сценарии использования navigation-guards

Теперь давайте посмотрим на практические задачи, которые вы, скорее всего, будете решать с помощью навигационных хуков.

### Авторизация и защита маршрутов

Это самый распространенный сценарий. Маршрутизатору нужно понять, можно ли пускать пользователя на конкретную страницу.

Шаги обычно такие:

1. Помечаете маршруты, требующие авторизации.
2. Включаете глобальный `beforeEach`, который проверяет статус пользователя.
3. В зависимости от результата пускаете его или перенаправляете.

```js
// routes.js
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./pages/LoginPage.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('./pages/DashboardPage.vue'),
    meta: {
      requiresAuth: true
    }
  }
]

// router.js
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
  const isLoggedIn = store.getters['auth/isAuthenticated']

  if (requiresAuth && !isLoggedIn) {
    // Перенаправляем на /login
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
  } else if (to.name === 'login' && isLoggedIn) {
    // Уже залогинен и идет на login - отправляем в личный кабинет
    next({ name: 'dashboard' })
  } else {
    next()
  }
})
```

Обратите внимание, как используется `query.redirect`, чтобы после успешного входа вернуть пользователя туда, куда он изначально хотел попасть.

### Проверка ролей и прав доступа

Иногда не хватает простого "вошел / не вошел". Нужно учитывать роли и права.

Давайте посмотрим, как можно определить требуемые роли в мета‑поле маршрута:

```js
const routes = [
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('./pages/AdminUsersPage.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin'] // Только админы
    }
  },
  {
    path: '/billing',
    name: 'billing',
    component: () => import('./pages/BillingPage.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'manager'] // Админы и менеджеры
    }
  }
]

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
  const requiredRoles = to.matched
    .flatMap(r => r.meta.roles || [])

  const isLoggedIn = store.getters['auth/isAuthenticated']
  const userRole = store.getters['auth/role']

  if (requiresAuth && !isLoggedIn) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (requiredRoles.length && !requiredRoles.includes(userRole)) {
    // Нет нужной роли - отправляем на 403
    return next({ name: 'forbidden' })
  }

  next()
})
```

Здесь мы:

- собираем список всех ролей из вложенных маршрутов (`to.matched`);
- сравниваем их с реальной ролью пользователя;
- в случае несоответствия перенаправляем на страницу 403.

### Предзагрузка данных

Иногда вам важно, чтобы данные были загружены **до** того, как пользователь увидит страницу. Навигационные хуки отлично подходят для такого сценария.

Подходов несколько:

1. Глобальный `beforeResolve` для общей предзагрузки.
2. `beforeRouteEnter` на уровне компонента.

Покажу вам пример с `beforeRouteEnter` и Vuex:

```js
// ProductPage.vue
export default {
  name: 'ProductPage',
  computed: {
    product() {
      // Получаем товар из хранилища
      return this.$store.getters['products/currentProduct']
    }
  },

  beforeRouteEnter(to, from, next) {
    const id = to.params.id

    // Запускаем загрузку товара до создания компонента
    // dispatch возвращает промис
    store
      .dispatch('products/fetchProductById', id)
      .then(() => {
        // Когда данные загружены - создаем компонент
        next()
      })
      .catch(error => {
        console.error('Ошибка загрузки товара', error)
        // Перенаправляем на страницу "товар не найден"
        next({ name: 'product-not-found' })
      })
  }
}
```

Комментарии:

- В этом случае компонент создается только после успешной загрузки.
- Сам компонент читает данные из хранилища через `computed`, а не хранит их локально.
- Такой подход удобен, если у вас много мест, где нужно обращаться к одним и тем же данным.

### Предотвращение потери несохраненных данных

Мы уже смотрели пример с `beforeRouteLeave`, но давайте чуть аккуратнее оформим типичный кейс формы.

```js
// ProfileEditPage.vue
export default {
  data() {
    return {
      form: {
        name: '',
        email: ''
      },
      initialForm: null,
      submitting: false
    }
  },

  async created() {
    // Загружаем профиль и заполняем форму
    const response = await fetch('/api/profile')
    const profile = await response.json()

    this.form.name = profile.name
    this.form.email = profile.email
    this.initialForm = { ...this.form }
  },

  methods: {
    isDirty() {
      // Проверяем, изменялась ли форма
      return (
        this.form.name !== this.initialForm.name ||
        this.form.email !== this.initialForm.email
      )
    },

    async submit() {
      this.submitting = true
      try {
        await fetch('/api/profile', {
          method: 'POST',
          body: JSON.stringify(this.form)
        })

        // После успешного сохранения обновляем initialForm
        this.initialForm = { ...this.form }
      } finally {
        this.submitting = false
      }
    }
  },

  beforeRouteLeave(to, from, next) {
    // Не спрашиваем, если идет отправка формы
    if (this.submitting) {
      return next(false) // Блокируем уход во время отправки
    }

    if (this.isDirty()) {
      const answer = window.confirm(
        'Изменения не сохранены. Действительно уйти?'
      )
      if (answer) {
        next()
      } else {
        next(false)
      }
    } else {
      next()
    }
  }
}
```

Как видите, этот хук позволяет довольно гибко управлять поведением, включая проверку разных состояний (загрузка, отправка, локальный драфт и т.п.).

### Логирование, аналитика и измерение времени перехода

Навигационные хуки удобно использовать для сбора метрик:

- сколько времени занимает переход между маршрутами;
- какие страницы посещаются чаще всего;
- где происходят ошибки.

Давайте посмотрим, как можно измерять время перехода:

```js
// performance-plugin.js
export default function setupRouterPerformance(router) {
  let navigationStartTime = null

  router.beforeEach((to, from, next) => {
    // Запоминаем время начала навигации
    navigationStartTime = performance.now()
    next()
  })

  router.afterEach((to, from) => {
    if (navigationStartTime !== null) {
      const navigationEndTime = performance.now()
      const duration = navigationEndTime - navigationStartTime

      // Отправляем данные куда-нибудь в аналитику
      sendNavigationTiming({
        from: from.fullPath,
        to: to.fullPath,
        duration // Время в миллисекундах
      })
    }
  })
}
```

Здесь я размещаю пример, чтобы вам было проще понять, как с помощью пары хуков можно реализовать измерение производительности без вмешательства в сами компоненты.

## Распространенные ошибки при работе с navigation-guards

Чтобы навигационные хуки не превращались в источник "магических" багов, полезно заранее знать типичные ошибки.

### Забыли вызвать next

Самая частая проблема — хук ничего не завершает.

```js
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // Провели проверку, но забыли вызвать next()
    checkAuth()
  }
})
```

В результате:

- переход никогда не завершится;
- пользователь останется на текущей странице, без ошибок в консоли.

Правильно:

```js
router.beforeEach(async (to, from, next) => {
  if (!to.meta.requiresAuth) {
    return next()
  }

  try {
    const isOk = await checkAuth()
    if (isOk) {
      next()
    } else {
      next({ name: 'login' })
    }
  } catch (e) {
    next({ name: 'error' })
  }
})
```

### Множественный вызов next

Другая частая ошибка — вызвать `next` несколько раз.

```js
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    next('/login')
  }
  next() // Вторая попытка вызвать next
})
```

Результат:

- роутер выдаст предупреждение;
- поведение может стать непредсказуемым.

Решение — строго структурировать условие и использовать `return`:

```js
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    return next('/login')
  }
  next()
})
```

### Слишком тяжелые операции в хуках

Если вы будете выполнять в навигационных хуках:

- большие синхронные вычисления;
- блокирующие циклы;
- длительный рендер на стороне клиента,

то переходы станут "тормозными". Пользователь будет ощущать, что интерфейс «зависает».

Рекомендации:

- По возможности выносите тяжелые вычисления за пределы хуков (например, в отдельные воркеры).
- Для долгих асинхронных операций показывайте индикаторы загрузки.
- Не храните в хуках лишнюю бизнес‑логику, если ее можно вынести в сервисы.

### Смешивание ответственности

Иногда в один `beforeEach` пытаются запихнуть:

- проверку токена;
- загрузку справочников;
- определение языка;
- инициализацию аналитики.

Со временем такой хук превращается в сложно читаемый "монолит".

Лучше:

- разбивать логику на отдельные функции;
- регистрировать несколько `beforeEach` хуков;
- использовать плагины/модули, которые добавляют свои хуки.

```js
// auth-guard.js
export function createAuthGuard(router, store) {
  router.beforeEach((to, from, next) => {
    // Логика авторизации
    // ...
  })
}

// i18n-guard.js
export function createI18nGuard(router, i18n) {
  router.beforeEach((to, from, next) => {
    // Логика выбора языка
    // ...
  })
}
```

Так код легче поддерживать и тестировать.

## Рекомендации по архитектуре и стилю

Напоследок давайте соберем несколько общих рекомендаций, которые помогут вам использовать навигационные хуки организованно.

### Храните бизнес‑логику вне хуков

Навигационный хук — это скорее "точка входа", чем место для полноценной реализации всей бизнес‑логики.

Давайте посмотрим на пример:

```js
// auth-service.js
export async function canAccessRoute(to, store) {
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
  const requiredRoles = to.matched.flatMap(r => r.meta.roles || [])

  const isLoggedIn = store.getters['auth/isAuthenticated']
  const userRole = store.getters['auth/role']

  if (requiresAuth && !isLoggedIn) {
    return { allowed: false, redirect: { name: 'login' } }
  }

  if (requiredRoles.length && !requiredRoles.includes(userRole)) {
    return { allowed: false, redirect: { name: 'forbidden' } }
  }

  return { allowed: true }
}

// router.js
import { canAccessRoute } from './auth-service'

router.beforeEach(async (to, from, next) => {
  const result = await canAccessRoute(to, store)

  if (!result.allowed) {
    next(result.redirect)
  } else {
    next()
  }
})
```

Такой подход:

- упрощает тестирование (можно тестировать `canAccessRoute` отдельно);
- делает навигационный хук компактным и понятным.

### Используйте meta‑поля маршрутов

`meta` — удобный способ передавать параметры в guard‑ы:

- `requiresAuth`;
- `roles`;
- `layout`;
- `trackPageView` и т.д.

```js
const routes = [
  {
    path: '/reports',
    name: 'reports',
    component: ReportsPage,
    meta: {
      requiresAuth: true,
      trackPageView: true
    }
  }
]

router.afterEach((to, from) => {
  if (to.meta.trackPageView) {
    sendPageView({ path: to.fullPath })
  }
})
```

Так вы не привязываете логику к конкретным путям и именам маршрутов, а описываете поведение декларативно.

### Обрабатывайте ошибки аккуратно

Если вы используете `async/await` в хуках, не забывайте о `try/catch`. Иначе при ошибке переход может либо "зависнуть", либо привести к нежелательному состоянию.

```js
router.beforeEach(async (to, from, next) => {
  try {
    await someAsyncCheck(to)
    next()
  } catch (error) {
    console.error('Ошибка в навигационном хуке', error)
    next({ name: 'error' })
  }
})
```

Здесь важно:

- всегда завершать навигацию, даже в случае ошибки;
- не "глотать" исключения тихо, а хотя бы логировать их.

---

Навигационные хуки — мощный инструмент управления маршрутизацией. С их помощью вы можете:

- централизованно контролировать авторизацию и права;
- предзагружать данные;
- защищать пользователя от потери несохраненных изменений;
- собирать аналитику и измерять производительность переходов.

Главное — относиться к ним как к части архитектуры, а не как к месту для "быстрого хака". Тогда навигация в вашем приложении останется предсказуемой и управляемой.

## Частозадаваемые технические вопросы

### Как отменить навигацию и остаться на текущей странице без ошибок?

Используйте `next(false)` в любом `before*` хуке.

```js
router.beforeEach((to, from, next) => {
  if (to.name === 'restricted') {
    // Отменяем переход - остаемся на from
    next(false)
  } else {
    next()
  }
})
```

Важно: в `afterEach` уже нельзя отменить переход.

### Можно ли внутри beforeRouteEnter получить доступ к this без next(vm => ...)?

Напрямую — нет. Компонент еще не создан. Если вам нужен доступ к экземпляру, используйте:

```js
beforeRouteEnter(to, from, next) {
  next(vm => {
    // vm - это экземпляр компонента
    vm.initSomething()
  })
}
```

Альтернатива — перенести инициализацию в `created` и не трогать экземпляр из guard‑а.

### Как правильно работать с переходами по hash внутри одной страницы?

Переход по hash (например, с `/docs#section1` на `/docs#section2`) обычно не триггерит полную навигацию, но в Vue Router можно включить поведение скролла через `scrollBehavior`. Навигационные хуки при этом срабатывают, но вы можете игнорировать изменения, если путь и имя маршрута те же, а изменился только hash.

```js
router.beforeEach((to, from, next) => {
  if (to.path === from.path && to.hash !== from.hash) {
    // Можно пропустить часть логики
  }
  next()
})
```

### Как выполнить несколько независимых проверок в разных модулях, но при этом не запутаться в порядке next?

Вы можете регистрировать несколько `beforeEach` хуков:

```js
createAuthGuard(router, store)
createI18nGuard(router, i18n)
createFeatureFlagsGuard(router, featureService)
```

Все они будут вызваны по очереди. Каждый из них обязан один раз вызвать `next`. Если один из хуков делает перенаправление, следующие хуки для этого перехода не вызываются.

### Как протестировать навигационные хуки без запуска всего приложения?

В unit‑тестах вы можете:

1. Создать экземпляр роутера с нужной конфигурацией.
2. Зарегистрировать нужные `beforeEach`/`beforeEnter`.
3. Вызвать `router.push` и дождаться завершения навигации (`router.isReady` или промис `router.push` в Vue Router 4).
4. Проверить итоговый маршрут и побочные эффекты.

Логику можно вынести в чистые функции и тестировать их отдельно, передавая им поддельные объекты `to`, `from` и имитируя `store` или сервисы.