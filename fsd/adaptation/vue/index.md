---
metaTitle: Архитектура FSD для Vue - vue-fsd
metaDescription: Разберитесь как применять архитектуру Feature Sliced Design в проектах на Vue с помощью подхода vue-fsd - структура слоев правила организации кода и практические примеры
author: Олег Марков
title: Архитектура FSD для Vue - vue-fsd
preview: Узнайте как выстроить масштабируемую архитектуру Vue приложений с помощью подхода vue-fsd - слои структура папок примеры кода и рекомендации по внедрению в существующие проекты
---

## Введение

Архитектура Feature Sliced Design (FSD) стала популярным способом организации фронтенд-проектов, потому что помогает не утонуть в росте кода и зависимостей. Чаще всего вы могли видеть FSD в связке с React, но те же идеи отлично ложатся и на Vue. Именно для этого появился подход, который обычно называют vue-fsd.

Задача vue-fsd — дать вам понятную структуру для Vue-приложений: куда класть компоненты, где хранить бизнес-логику, как разделять ответственность так, чтобы проект можно было развивать годами без боли и бесконечных рефакторингов.

Сейчас вы увидите, как можно:

- разложить Vue-проект по слоям FSD;
- организовать папки и модули;
- соединить Pinia, Vue Router и Composition API с этим подходом;
- выстроить зависимости так, чтобы их легко было контролировать;
- постепенно мигрировать существующий монолитный Vue-проект к vue-fsd.

Давайте начнем с базовых принципов, а затем перейдем к структуре папок и примерам кода.

## Основные принципы FSD в контексте Vue

### Почему классическая структура Vue-проекта часто не хватает

Обычная структура, которую генерирует, например, Vue CLI или Vite:

- src/components
- src/views
- src/store
- src/router

Со временем здесь появляются проблемы:

- компоненты в components превращаются в свалку переиспользуемых и очень специфичных модулей вперемешку;
- логика размазана: часть в компонентах, часть в store, часть в utils;
- импортировать что-то становится рискованным — легко выстрелить себе в ногу циклическими зависимостями или утечками логики между страницами.

FSD предлагает решить это за счет строгой структуры и четкого правила — делить проект по функциям (фичам) и слоям, а не по техническим сущностям.

### Слои FSD в vue-fsd

В контексте Vue используется тот же набор слоев, что и в классическом FSD (немного адаптированный под экосистему):

1. app — инициализация приложения, глобальные провайдеры, маршрутизация, глобальные стили;
2. processes — долгоживущие бизнес-процессы, которые объединяют несколько страниц и фич (например, онбординг);
3. pages — страницы приложения, сборка экрана из фич и виджетов;
4. widgets — крупные самостоятельные блоки интерфейса (хедер, сайдбар, лента новостей);
5. features — функциональные возможности (логин, поиск, фильтрация, лайк, загрузка файла);
6. entities — бизнес-сущности (User, Article, Product), их модель, состояние, примитивные UI-компоненты;
7. shared — переиспользуемые "строительные блоки" — UI-библиотека, хелперы, api-клиенты, конфиги.

Давайте разберем структуру папок в vue-fsd на конкретном примере.

## Структура проекта vue-fsd

### Пример дерева проекта

Теперь вы увидите, как может выглядеть типичный Vue-проект, организованный по FSD:

```bash
src/
  app/
    providers/
      router/
        index.ts        # Инициализация Vue Router
      store/
        index.ts        # Инициализация Pinia или другого стора
    index.vue           # Корневой компонент приложения
    app.ts              # Точка входа - создание приложения
  processes/
    onboarding/
      model/
        useOnboarding.ts    # Логика прохождения онбординга
      ui/
        OnboardingLayout.vue
  pages/
    home/
      index.vue         # Страница Home
      model/
        useHomePage.ts  # Хуки и эффекты уровня страницы
    profile/
      index.vue
      model/
        useProfilePage.ts
  widgets/
    header/
      ui/
        AppHeader.vue
      model/
        useHeaderMenu.ts
    sidebar/
      ui/
        AppSidebar.vue
  features/
    auth/
      login-by-email/
        model/
          useLoginByEmail.ts
        ui/
          LoginForm.vue
    search/
      search-bar/
        model/
          useSearchBar.ts
        ui/
          SearchBar.vue
  entities/
    user/
      model/
        useCurrentUser.ts   # Состояние текущего пользователя
        types.ts            # Типы сущности User
        api.ts              # Запросы, связанные с User
      ui/
        UserAvatar.vue
        UserProfileCard.vue
    article/
      model/
        useArticleList.ts
        types.ts
      ui/
        ArticleCard.vue
  shared/
    ui/
      Button.vue
      Input.vue
      Modal.vue
    lib/
      axios/
        instance.ts      # Настройка axios
      validators/
        email.ts
    config/
      api.ts
    router/
      routes.ts          # Описание маршрутов на уровне app/pages
    types/
      global.d.ts
```

Смотрите, здесь важна не только глубина, но и модель мышления: вы начинаете думать не "где компонент", а "какая это фича или сущность" и в какой слой она относится.

### Базовые правила зависимости слоев

Чтобы архитектура работала, мало просто разложить папки. Нужны правила, что от чего может зависеть. В vue-fsd можно придерживаться такой схемы:

- shared — может использоваться всеми;
- entities — может зависеть только от shared;
- features — может зависеть от entities и shared;
- widgets — может зависеть от features, entities, shared;
- pages — может зависеть от widgets, features, entities, shared;
- processes — может зависеть от pages, widgets, features, entities, shared;
- app — может зависеть от всех слоев (но сам не должен использоваться кем-то).

Так вы избегаете ситуации, когда, например, сущность User внезапно начинает знать о конкретной странице или виджете.

## Слой app — точка входа и инфраструктура

### Инициализация приложения

Давайте разберемся на примере базовой точки входа с использованием Vue 3, Vite и Pinia.

```ts
// src/app/app.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Импортируем корневой компонент
import App from './index.vue'

// Импортируем провайдеры - например, роутер
import { router } from './providers/router'

// Создаем инстанс приложения
const app = createApp(App)

// Подключаем глобальный стор
const pinia = createPinia()
app.use(pinia)

// Подключаем роутер
app.use(router)

// Монтируем приложение в DOM
app.mount('#app')
```

Комментарии в коде показывают, как именно части приложения подключаются друг к другу. Здесь слой app отвечает только за сборку.

### Роутер в контексте FSD

Частая ошибка — описывать маршруты прямо в компонентах страниц. В vue-fsd лучше держать их отдельно:

```ts
// src/app/providers/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { routes } from '@/shared/router/routes'

// Создаем инстанс роутера на основе заранее описанных маршрутов
export const router = createRouter({
  history: createWebHistory(),
  routes: routes as RouteRecordRaw[],
})
```

```ts
// src/shared/router/routes.ts
// Здесь мы подключаем только компоненты страниц
import HomePage from '@/pages/home/index.vue'
import ProfilePage from '@/pages/profile/index.vue'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
  },
]
```

Обратите внимание: shared/router знает только о страницах (pages). Это допустимая зависимость, потому что router — часть "каркаса" приложения, который связывает слои между собой.

## Слой entities — бизнес-сущности

Сущности — это фундамент доменной модели. В Vue-проектах это обычно:

- типы данных (User, Article, Product);
- API, связанные с этими сущностями;
- стейт-хуки или store-модули, работающие с конкретной сущностью;
- простые UI-компоненты для отображения сущности.

### Пример сущности User

Смотрите, я покажу вам простой пример сущности пользователя.

```ts
// src/entities/user/model/types.ts
export interface User {
  id: number
  name: string
  email: string
  avatarUrl?: string
}
```

```ts
// src/entities/user/model/api.ts
import { axiosInstance } from '@/shared/lib/axios/instance'
import type { User } from './types'

// Получение текущего пользователя
export async function fetchCurrentUser(): Promise<User> {
  // Делаем GET запрос к /me
  const { data } = await axiosInstance.get<User>('/me')
  return data
}
```

```ts
// src/entities/user/model/useCurrentUser.ts
import { ref, onMounted } from 'vue'
import { fetchCurrentUser } from './api'
import type { User } from './types'

// Хук, который хранит и загружает данные о текущем пользователе
export function useCurrentUser() {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Функция загрузки данных пользователя
  const loadUser = async () => {
    isLoading.value = true
    error.value = null

    try {
      user.value = await fetchCurrentUser()
    } catch (e) {
      // Здесь мы упрощенно приводим ошибку к строке
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  }

  // Загружаем пользователя при монтировании компонента
  onMounted(loadUser)

  return {
    user,
    isLoading,
    error,
    loadUser,
  }
}
```

```vue
<!-- src/entities/user/ui/UserAvatar.vue -->
<template>
  <div class="user-avatar">
    <!-- Если есть аватар - показываем его -->
    <img v-if="src" :src="src" :alt="alt" class="user-avatar__img" />
    <!-- Если аватара нет - показываем заглушку с инициалами -->
    <div v-else class="user-avatar__placeholder">
      {{ initials }}
    </div>
  </div>
</template>

<script setup lang="ts">
// Импортируем тип из сущности User
import type { User } from '../model/types'
import { computed } from 'vue'

// Пропс - сам пользователь
const props = defineProps<{
  user: User
}>()

// Вычисляем ссылку на аватар
const src = computed(() => props.user.avatarUrl || '')

// Вычисляем текст для атрибута alt
const alt = computed(() => `Avatar of ${props.user.name}`)

// Считаем инициалы пользователя
const initials = computed(() => {
  // Берем первую букву имени
  return props.user.name.charAt(0).toUpperCase()
})
</script>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.user-avatar__img {
  border-radius: 50%;
}
.user-avatar__placeholder {
  border-radius: 50%;
  background: #ccc;
  color: #fff;
}
</style>
```

Здесь вы видите, что сущность сосредоточена на данных и простом UI. Эта сущность дальше будет использоваться в features и widgets.

## Слой features — функциональные возможности

Фича — это ответ на вопрос "что пользователь может сделать". Например:

- залогиниться;
- отфильтровать список товаров;
- добавить статью в избранное;
- выполнить поиск.

Фича довольно часто "склеивает" несколько сущностей и предоставляет законченное действие.

### Пример фичи: логин по email

Давайте посмотрим, что входит в одну небольшую фичу — форму логина.

```ts
// src/features/auth/login-by-email/model/useLoginByEmail.ts
import { ref } from 'vue'
import { axiosInstance } from '@/shared/lib/axios/instance'
import { isValidEmail } from '@/shared/lib/validators/email'

// Хук для работы с формой логина по email
export function useLoginByEmail() {
  const email = ref('')
  const password = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Простейшая валидация формы
  const validate = () => {
    if (!isValidEmail(email.value)) {
      error.value = 'Некорректный email'
      return false
    }
    if (!password.value) {
      error.value = 'Пароль не может быть пустым'
      return false
    }
    return true
  }

  // Обработчик отправки формы
  const submit = async () => {
    // Сбрасываем предыдущую ошибку
    error.value = null

    // Проверяем данные формы
    if (!validate()) {
      return
    }

    isLoading.value = true

    try {
      // Отправляем запрос логина
      await axiosInstance.post('/auth/login', {
        email: email.value,
        password: password.value,
      })
      // В реальном проекте здесь можно сохранить токен или обновить стора
    } catch (e) {
      // Упрощенно приводим ошибку к строке
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  }

  return {
    email,
    password,
    isLoading,
    error,
    submit,
  }
}
```

```vue
<!-- src/features/auth/login-by-email/ui/LoginForm.vue -->
<template>
  <form class="login-form" @submit.prevent="onSubmit">
    <!-- Поле email -->
    <Input
      v-model="email"
      type="email"
      label="Email"
      :disabled="isLoading"
    />

    <!-- Поле пароль -->
    <Input
      v-model="password"
      type="password"
      label="Пароль"
      :disabled="isLoading"
    />

    <!-- Сообщение об ошибке -->
    <p v-if="error" class="login-form__error">
      {{ error }}
    </p>

    <!-- Кнопка отправки формы -->
    <Button :disabled="isLoading" type="submit">
      Войти
    </Button>
  </form>
</template>

<script setup lang="ts">
// Импортируем хук фичи
import { useLoginByEmail } from '../model/useLoginByEmail'
// Используем общие UI-компоненты
import Button from '@/shared/ui/Button.vue'
import Input from '@/shared/ui/Input.vue'

// Инициализируем состояние формы
const { email, password, isLoading, error, submit } = useLoginByEmail()

// Обработчик отправки формы
const onSubmit = () => {
  // Вызываем функцию submit из хука формы
  submit()
}
</script>

<style scoped>
.login-form {
  display: grid;
  gap: 12px;
}
.login-form__error {
  color: red;
}
</style>
```

Как видите, фича использует:

- shared/ui (Button, Input);
- shared/lib (валидатор email, axios);
- может использовать entities (например, user) — но в этом примере мы сохранили фичу максимально изолированной.

## Слой widgets — крупные блоки интерфейса

Виджеты помогают переиспользовать типичные блоки экрана: хедер, футер, панель пользователя, ленту, список уведомлений и т.д. Они собирают фичи и сущности в более сложные конструкции.

### Пример виджета: Header

Покажу вам, как собрать простой хедер, который отображает логотип и информацию о текущем пользователе.

```vue
<!-- src/widgets/header/ui/AppHeader.vue -->
<template>
  <header class="app-header">
    <!-- Логотип приложения -->
    <router-link to="/" class="app-header__logo">
      MyApp
    </router-link>

    <!-- Блок справа - информация о пользователе -->
    <div class="app-header__right">
      <UserAvatar
        v-if="user"
        :user="user"
      />
      <!-- Если пользователь не загружен - можем показать skeleton или кнопку Войти -->
      <Button v-else @click="goToLogin">
        Войти
      </Button>
    </div>
  </header>
</template>

<script setup lang="ts">
// Импортируем хук сущности user
import { useCurrentUser } from '@/entities/user/model/useCurrentUser'
// Импортируем UI-компонент сущности user
import UserAvatar from '@/entities/user/ui/UserAvatar.vue'
// Кнопка из shared/ui
import Button from '@/shared/ui/Button.vue'
import { useRouter } from 'vue-router'

// Получаем состояние текущего пользователя
const { user } = useCurrentUser()

// Получаем роутер, чтобы программно переходить по маршрутам
const router = useRouter()

// Обработчик перехода на страницу логина
const goToLogin = () => {
  router.push({ name: 'login' })
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid #eee;
}
.app-header__logo {
  font-weight: bold;
}
</style>
```

Здесь виджет не содержит внутри "сырой" логики работы с API — он использует сущность user и общие компоненты.

## Слой pages — сборка экранов

Страница — это композиция из widgets, features и иногда прямых обращений к entities и shared. В идеале сама логика страницы минимальна, она только связывает готовые кирпичики.

### Пример страницы Home

```vue
<!-- src/pages/home/index.vue -->
<template>
  <main class="home-page">
    <!-- Хедер приложения -->
    <AppHeader />

    <section class="home-page__content">
      <!-- Здесь может быть виджет ленты, список статей или другие фичи -->
      <h1>Главная страница</h1>

      <!-- Пример использования фичи поиска -->
      <SearchBar @search="onSearch" />

      <!-- Пример отображения списка статей -->
      <div class="home-page__articles">
        <ArticleCard
          v-for="article in articles"
          :key="article.id"
          :article="article"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
// Импортируем виджет Header
import AppHeader from '@/widgets/header/ui/AppHeader.vue'
// Импортируем фичу поиска
import SearchBar from '@/features/search/search-bar/ui/SearchBar.vue'
// Импортируем сущность Article
import ArticleCard from '@/entities/article/ui/ArticleCard.vue'
import { useArticleList } from '@/entities/article/model/useArticleList'

// Получаем список статей через сущность
const { articles, filterByQuery } = useArticleList()

// Обработчик поиска на уровне страницы
const onSearch = (query: string) => {
  // Вызываем метод сущности, чтобы отфильтровать список
  filterByQuery(query)
}
</script>

<style scoped>
.home-page__content {
  padding: 16px;
}
.home-page__articles {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}
</style>
```

Теперь давайте посмотрим, как может быть реализована фича поиска, чтобы она была универсальной.

### Фича SearchBar

```ts
// src/features/search/search-bar/model/useSearchBar.ts
import { ref } from 'vue'

// Хук, который управляет состоянием поисковой строки
export function useSearchBar(onSearch: (query: string) => void) {
  const query = ref('')

  // Обработчик изменения поля ввода
  const onChange = (value: string) => {
    query.value = value
  }

  // Отправка поискового запроса
  const submit = () => {
    // Вызываем переданный колбэк с текущей строкой поиска
    onSearch(query.value)
  }

  return {
    query,
    onChange,
    submit,
  }
}
```

```vue
<!-- src/features/search/search-bar/ui/SearchBar.vue -->
<template>
  <form class="search-bar" @submit.prevent="onSubmit">
    <Input
      v-model="query"
      type="text"
      placeholder="Поиск..."
    />
    <Button type="submit">
      Найти
    </Button>
  </form>
</template>

<script setup lang="ts">
import { useSearchBar } from '../model/useSearchBar'
import Input from '@/shared/ui/Input.vue'
import Button from '@/shared/ui/Button.vue'

// Описываем событие search
const emit = defineEmits<{
  (e: 'search', query: string): void
}>()

// Инициализируем логику поиска
const { query, submit } = useSearchBar((value) => {
  // При submit вызываем событие search наружу
  emit('search', value)
})

// Обработчик отправки формы
const onSubmit = () => {
  submit()
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
}
</style>
```

Как видите, здесь фича ничего не знает о том, как именно используется список статей — она просто эмитит событие с поисковым запросом.

## Слой processes — долгие сценарии

Processes в Vue-проектах используются реже, но они полезны для сложных сценариев, которые:

- растягиваются на несколько экранов (онбординг, воронка покупки);
- включают несколько разных фич и виджетов;
- имеют собственные состояния.

### Пример процесса: онбординг

Представим, что у вас есть онбординг с несколькими шагами.

```ts
// src/processes/onboarding/model/useOnboarding.ts
import { ref } from 'vue'

// Хук, который управляет шагами онбординга
export function useOnboarding() {
  const step = ref(1)
  const totalSteps = 3

  // Переход к следующему шагу
  const nextStep = () => {
    if (step.value < totalSteps) {
      step.value += 1
    }
  }

  // Переход к предыдущему шагу
  const prevStep = () => {
    if (step.value > 1) {
      step.value -= 1
    }
  }

  // Завершение онбординга
  const complete = () => {
    // Здесь можно вызвать API или обновить состояние сторы
    // Например, пометить пользователя как завершившего онбординг
  }

  return {
    step,
    totalSteps,
    nextStep,
    prevStep,
    complete,
  }
}
```

```vue
<!-- src/processes/onboarding/ui/OnboardingLayout.vue -->
<template>
  <div class="onboarding">
    <!-- Прогресс онбординга -->
    <p>
      Шаг {{ step }} из {{ totalSteps }}
    </p>

    <!-- Здесь в зависимости от шага показываем разные фичи -->
    <component
      :is="currentComponent"
      @next="nextStep"
      @previous="prevStep"
      @complete="complete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOnboarding } from '../model/useOnboarding'

// Импортируем компоненты шагов
import StepOne from './steps/StepOne.vue'
import StepTwo from './steps/StepTwo.vue'
import StepThree from './steps/StepThree.vue'

// Инициализируем состояние процесса онбординга
const { step, totalSteps, nextStep, prevStep, complete } = useOnboarding()

// Определяем, какой компонент показать на текущем шаге
const currentComponent = computed(() => {
  switch (step.value) {
    case 1:
      return StepOne
    case 2:
      return StepTwo
    case 3:
      return StepThree
    default:
      return StepOne
  }
})
</script>
```

Процесс можно подключить как отдельный маршрут или как часть определенной страницы.

## Слой shared — общие ресурсы

Shared — это то, что вы можете смело переиспользовать в любом слое, не рискуя привнести ненужные зависимости.

Обычно сюда попадает:

- UI: кнопки, инпуты, модальные окна;
- lib: axios, form-helpers, date-helpers;
- config: базовые URL, фичефлаги;
- types: глобальные типы, общие интерфейсы.

### Пример настройки axios

```ts
// src/shared/lib/axios/instance.ts
import axios from 'axios'
import { API_BASE_URL } from '@/shared/config/api'

// Создаем общий axios-инстанс
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Пример использования интерцептора запросов
axiosInstance.interceptors.request.use((config) => {
  // Здесь можно подставить токен авторизации из стора
  // config.headers.Authorization = `Bearer ${token}`
  return config
})
```

```ts
// src/shared/config/api.ts
// Базовый URL для всех запросов к API
export const API_BASE_URL = 'https://api.example.com'
```

### Пример общего UI-компонента Button

```vue
<!-- src/shared/ui/Button.vue -->
<template>
  <button
    class="btn"
    :class="`btn--${variant}`"
    v-bind="$attrs"
  >
    <!-- Слот для содержимого кнопки -->
    <slot />
  </button>
</template>

<script setup lang="ts">
// Пропс variant управляет визуальным стилем
const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
}>()

// Значение по умолчанию - primary
if (!props.variant) {
  // Здесь мы можем задать дефолтное значение через attrs или computed
}
</script>

<style scoped>
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
.btn--primary {
  background: #2f80ed;
  color: #fff;
}
.btn--secondary {
  background: #eee;
  color: #000;
}
.btn--ghost {
  background: transparent;
  border: 1px solid #ccc;
}
</style>
```

Shared-слой должен быть максимально "чистым": никакой логики бизнеса, никаких обращений к сущностям.

## Организация логики: Composition API и vue-fsd

### Где хранить бизнес-логику

В Vue 3 логика часто оформляется в виде composables — функций useSomething. В контексте vue-fsd лучше:

- логику работы с данными конкретной сущности держать в entities/entityName/model;
- логику конкретной фичи — в features/featureName/model;
- логику страницы (подготовка данных, обработка событий нескольких фич) — в pages/pageName/model/usePageName.ts.

Давайте посмотрим на пример страницы с отдельным composable.

```ts
// src/pages/profile/model/useProfilePage.ts
import { computed } from 'vue'
import { useCurrentUser } from '@/entities/user/model/useCurrentUser'

// Хук, который инкапсулирует логику страницы профиля
export function useProfilePage() {
  const { user, isLoading, error } = useCurrentUser()

  // Вычисляем заголовок страницы на основе пользователя
  const title = computed(() => {
    if (!user.value) {
      return 'Профиль'
    }
    return `Профиль - ${user.value.name}`
  })

  return {
    user,
    isLoading,
    error,
    title,
  }
}
```

```vue
<!-- src/pages/profile/index.vue -->
<template>
  <main class="profile-page">
    <AppHeader />

    <section class="profile-page__content">
      <h1>{{ title }}</h1>

      <p v-if="isLoading">Загрузка...</p>
      <p v-else-if="error">{{ error }}</p>
      <UserProfileCard v-else-if="user" :user="user" />
    </section>
  </main>
</template>

<script setup lang="ts">
import AppHeader from '@/widgets/header/ui/AppHeader.vue'
import UserProfileCard from '@/entities/user/ui/UserProfileCard.vue'
import { useProfilePage } from './model/useProfilePage'

// Подключаем хук страницы профиля
const { user, isLoading, error, title } = useProfilePage()
</script>
```

Так вы разделяете UI (разметка) и сценарии (логика) даже на уровне страниц.

## Миграция к vue-fsd из существующего проекта

Многие приходят к FSD не на чистом проекте, а уже на достаточно запущенном. Давайте посмотрим пошаговый подход.

### Шаг 1. Ввести слои и минимальную структуру

Для начала создайте верхний уровень папок:

- app
- pages
- shared

И постепенно переносите туда:

- app — точку входа (main.ts / app.ts), роутер, глобальные стили;
- pages — все, что раньше было в views;
- shared — утилиты, общие компоненты (components, которые переиспользуются в нескольких страницах).

### Шаг 2. Выделить сущности

Проанализируйте код:

- какие типы данных повторяются повсюду (User, Product, Order);
- какие запросы к API вокруг этих типов крутятся.

Создайте entities и переносите туда:

- типы;
- API-методы;
- базовые UI-компоненты для отображения сущностей;
- логические composables.

### Шаг 3. Выделить фичи

Смотрите на сценарии пользователя:

- вход;
- редактирование профиля;
- оформление заказа.

Каждый такой сценарий можно оформить как фичу:

- создать директорию features/featureName;
- перенести туда связанную логику и компоненты;
- оставить в pages только "склейку" фич и сущностей.

### Шаг 4. Разобрать widgets и processes

Когда главные уровни устаканятся:

- вынесите повторяющиеся крупные блоки (header, sidebar, layout) в widgets;
- если есть сложные процессы (многошаговые формы, онбординг) — рассмотрите processes.

Главное — не пытаться переписать весь проект за один раз. Начните с одной новой страницы или фичи в FSD-формате и постепенно расширяйте.

## Работа с Pinia или Vuex в контексте FSD

### Где хранить store

Если вы используете Pinia, проще всего привязать сторы к сущностям или фичам:

- entities/user/model/userStore.ts;
- features/cart/model/cartStore.ts.

Давайте посмотрим на пример стора для сущности Article.

```ts
// src/entities/article/model/articleStore.ts
import { defineStore } from 'pinia'
import { axiosInstance } from '@/shared/lib/axios/instance'
import type { Article } from './types'

interface ArticleState {
  list: Article[]
  isLoading: boolean
  error: string | null
}

// Стор для списка статей
export const useArticleStore = defineStore('article', {
  state: (): ArticleState => ({
    list: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchArticles() {
      this.isLoading = true
      this.error = null

      try {
        const { data } = await axiosInstance.get<Article[]>('/articles')
        this.list = data
      } catch (e) {
        this.error = (e as Error).message
      } finally {
        this.isLoading = false
      }
    },
  },
})
```

```ts
// src/entities/article/model/useArticleList.ts
import { computed, onMounted } from 'vue'
import { useArticleStore } from './articleStore'

// Хук, который инкапсулирует работу со стором статей
export function useArticleList() {
  const store = useArticleStore()

  // При первом использовании загружаем список статей
  onMounted(() => {
    if (!store.list.length) {
      store.fetchArticles()
    }
  })

  // Фильтрация по поисковому запросу
  const filterByQuery = (query: string) => {
    // Для простоты здесь мутируем список напрямую
    // В реальном приложении можно хранить исходный список отдельно
    if (!query) {
      return
    }
    store.list = store.list.filter((article) =>
      article.title.toLowerCase().includes(query.toLowerCase()),
    )
  }

  return {
    articles: computed(() => store.list),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),
    filterByQuery,
  }
}
```

Таким образом, логика стора "привязана" к сущности и не размазана по всему приложению.

## Ограничение импортов и контроль архитектуры

Когда структура и правила есть, их важно соблюдать. На больших проектах это можно контролировать автоматически:

- с помощью eslint-правил с настройкой import/order;
- с помощью кастомных линтеров (например, на основе eslint-plugin-boundaries или аналогов);
- с помощью модульных alias-ов (@/entities, @/features и т.д.).

Общая идея — запретить "обратные" импорты, например:

- из features в widgets (вместо этого widget должен знать о feature);
- из entities в features/pages/widgets/app (сущности не должны знать, кто их использует).

Это можно формализовать: "слой может импортировать только из shared и слоев ниже по иерархии".

## Заключение

Подход vue-fsd переносит принципы Feature Sliced Design в мир Vue и помогает:

- разделить проект на осмысленные слои (app, processes, pages, widgets, features, entities, shared);
- класть код не "по типу файла", а по назначению — фича, сущность, виджет;
- сделать зависимости между частями проекта понятными и контролируемыми;
- упростить сопровождение, добавление новых фич и рефакторинг.

Ключевые моменты, на которые стоит опираться:

- entities описывают данные и базовый UI;
- features отвечают за действия пользователя;
- widgets собирают фичи и сущности в крупные блоки;
- pages собирают все в экран;
- shared предоставляет строительные блоки без знания бизнеса.

Начните с выделения слоев и сущностей, затем аккуратно переносите фичи и страницы. По мере роста проекта архитектурные преимущества vue-fsd будут становиться заметнее: меньше "магических" зависимостей, меньше "god-компонентов", проще тестировать и расширять.

## Частозадаваемые технические вопросы

### Как правильно организовать алиасы путей при использовании vue-fsd

Чтобы не писать длинные относительные пути, удобно в Vite или Webpack настроить алиасы. Для Vite:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
```

Дальше вы можете импортировать части слоев так:

- '@/shared/ui/Button.vue';
- '@/entities/user/model/useCurrentUser';
- '@/features/auth/login-by-email/ui/LoginForm.vue'.

Важно придерживаться единого стиля: не смешивать относительные и абсолютные импорты для одних и тех же модулей.

### Как разделять фичи и виджеты если компонент кажется и тем и другим

Смотрите на назначение:

- если компонент описывает конкретное действие пользователя (логин, поиск, оформление заказа) — это фича;
- если компонент — часть layout или большой блок интерфейса, который внутри использует несколько фич и сущностей — это виджет.

Если компонент "сомнительный", сначала поместите его в widgets, а по мере роста логики вынесите часть функциональности в features.

### Как тестировать код в архитектуре vue-fsd

Удобно использовать разные уровни тестов:

- unit-тесты для model-частей в entities и features (чистая логика без UI);
- компонентные тесты для ui-частей в shared, entities, features;
- интеграционные тесты для widgets и pages (проверка связки нескольких фич и сущностей).

Структура тестов может повторять структуру слоев, например:

- src/entities/user/model/useCurrentUser.spec.ts;
- src/features/auth/login-by-email/model/useLoginByEmail.spec.ts.

### Как подключать сторонние UI-библиотеки в контексте vue-fsd

Сторонние UI-библиотеки (Element Plus, Naive UI и т.п.) лучше "оборачивать" в shared/ui:

- создайте адаптеры-компоненты (например, AppButton, AppInput);
- внутри используйте компоненты библиотеки;
- наружу отдавайте единый API, который контролируете вы.

Так вы сможете сменить библиотеку без переписывания всего проекта, поменяв только адаптеры в shared/ui.

### Как обрабатывать глобальные ошибки в архитектуре vue-fsd

Глобальный обработчик ошибок удобно размещать в слое app:

1. Настройте перехват ошибок axios в shared/lib/axios/instance.
2. В интерцепторе при необходимости диспатчите событие или обновляйте общий стор (например, appStore).
3. В widgets (например, Layout) подписывайтесь на состояние глобальной ошибки и показывайте уведомления или модальные окна.

Таким образом, нижние слои (entities, features) могут просто выбрасывать ошибки, а глобальная обработка будет централизована в верхних слоях.