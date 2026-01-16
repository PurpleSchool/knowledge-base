---
metaTitle: Архитектура Feature Sliced Design для Vue - практическое руководство по vue-fsd
metaDescription: Разбираем подход Feature Sliced Design для Vue - vue-fsd - как организовать структуру фронтенд проекта по фичам и слоям с понятными примерами и рекомендациями
author: Олег Марков
title: Feature Sliced Design для Vue - vue-fsd - подробный разбор подхода и практики применения
preview: Узнайте как применять Feature Sliced Design в Vue проектах - vue-fsd - структура слоев и срезов, организация компонентов, стора и роутинга на практике
---

## Введение

Feature-Sliced Design (FSD) для Vue, или сокращенно vue-fsd, — это подход к архитектуре фронтенд-проектов, который помогает держать код в порядке по мере роста приложения. Вместо организации кода по технологиям (components, store, services) вы группируете его по смыслам: фичам, страницам, сущностям и слоям ответственности.

Смотрите, я покажу вам, как этот подход помогает ответить на вопросы:

- Где хранить бизнес-логику компонента?
- Куда положить новый модальный диалог?
- Как разделить код между страницами, фичами и общими модулями?
- Как подготовить проект к масштабированию и команде из нескольких разработчиков?

Мы будем опираться на общую методологию Feature-Sliced Design и адаптировать ее под экосистему Vue. В качестве примеров я буду использовать Vue 3 с Composition API и Pinia, так как это наиболее типичная связка для современных приложений.

## Основные принципы Feature-Sliced Design для Vue

### Зачем нужен FSD в Vue-проектах

Классическая структура Vue-проекта часто выглядит так:

- components/
- views/
- store/
- services/

Сначала это удобно, но потом начинаются типичные проблемы:

- Логика одной бизнес-фичи размазана по разным папкам.
- Общие компоненты превращаются в свалку.
- Становится сложно переиспользовать части фич между страницами.
- Рефакторинг страниц приводит к ломаным импортам по всему проекту.

Feature-Sliced Design предлагает смотреть на приложение как на набор слоев и срезов (features, entities, pages и так далее), а не как на набор технических папок.

Основные идеи:

- Структура по домену, а не по технологии.
- Слои сверху вниз — от более высокоуровневых к более низкоуровневым.
- Ограниченные зависимости между слоями (кто кого может импортировать).
- Фичи и сущности как единицы проектирования.

### Слои в vue-fsd

Давайте разберемся с базовыми слоями, которые чаще всего используют в Vue-проектах по FSD:

- app — инициализация приложения.
- processes — сквозные процессы (например, onboarding).
- pages — страницы, связанные с роутами.
- widgets — крупные интерфейсные блоки (хедер, боковая панель).
- features — бизнес-фичи (логин, поиск, корзина).
- entities — бизнес-сущности (User, Product, Order).
- shared — переиспользуемые, максимально изолированные штуки (UI-кит, хелперы, API-клиенты).

Слои располагаются сверху вниз. Чем выше слой — тем ближе к конкретному сценарию пользователя, чем ниже — тем более абстрактный и переиспользуемый код.

Типичное дерево директорий в vue-fsd может выглядеть так:

src  
- app  
- processes  
- pages  
- widgets  
- features  
- entities  
- shared  

Теперь давайте разберем каждый слой на примерах.

## Слой app

Слой app отвечает за инициализацию и каркас приложения: точка входа, провайдеры, глобальные стили, настройка роутера и стора.

### Структура слоя app

Пример структуры:

src/app  
- index.ts  
- providers/  
  - router.ts  
  - store.ts  
  - i18n.ts  
- layout/  
  - AppLayout.vue  
- styles/  
  - index.scss  

index.ts — это точка, куда «сходится» конфигурация приложения.

Давайте посмотрим базовый пример:

```ts
// src/app/index.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './layout/AppLayout.vue'
import { router } from './providers/router'
// Здесь мы добавляем глобальные стили
import './styles/index.scss'

const app = createApp(App)

// Здесь мы подключаем глобальный стор
app.use(createPinia())

// Здесь мы подключаем роутер
app.use(router)

// Здесь мы монтируем приложение к DOM
app.mount('#app')
```

router.ts в слое app отвечает только за сборку роутов, сами же страницы лежат в слое pages:

```ts
// src/app/providers/router.ts
import { createRouter, createWebHistory } from 'vue-router'
// Здесь мы импортируем только "entry points" страниц
import { HomePage } from '@/pages/home'
import { ProductPage } from '@/pages/product'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/product/:id',
      component: ProductPage,
    },
  ],
})
```

Обратите внимание: роутер знает только о страницах, но не о фичах и сущностях напрямую.

## Слой pages

Страницы — это связка роут + набор виджетов и фич. Они не должны содержать сложную бизнес-логику, а должны составлять из элементов интерфейс.

### Структура слоя pages

Пример:

src/pages  
- home/  
  - ui/  
    - HomePage.vue  
  - index.ts  
- product/  
  - ui/  
    - ProductPage.vue  
  - index.ts  

index.ts каждой страницы экспортирует ее «entry point»:

```ts
// src/pages/home/index.ts
export { default as HomePage } from './ui/HomePage.vue'
```

А теперь давайте посмотрим, как может выглядеть сама страница:

```vue
<!-- src/pages/home/ui/HomePage.vue -->
<template>
  <main>
    <!-- Здесь мы используем виджет - шапку -->
    <AppHeader />

    <!-- Здесь мы используем фичу фильтрации товаров -->
    <ProductFilters />

    <!-- Здесь мы используем виджет - список товаров -->
    <ProductListWidget />
  </main>
</template>

<script setup lang="ts">
// Здесь мы импортируем виджет из слоя widgets
import { AppHeader } from '@/widgets/app-header'
// Здесь мы импортируем фичу из слоя features
import { ProductFilters } from '@/features/product-filters'
// Здесь мы импортируем виджет из слоя widgets
import { ProductListWidget } from '@/widgets/product-list'
</script>
```

Как видите, страница просто собирает интерфейс из готовых блоков и не должна знать детали их внутренней реализации.

## Слой widgets

Виджеты — это крупные, самодостаточные части интерфейса, которые могут включать в себя несколько фич и сущностей. Например: AppHeader, Sidebar, ProductListWidget.

### Структура слоя widgets

Пример:

src/widgets  
- app-header/  
  - ui/  
    - AppHeader.vue  
  - index.ts  
- product-list/  
  - ui/  
    - ProductListWidget.vue  
  - model/  
    - useProductList.ts  
  - index.ts  

Теперь давайте разберемся на примере списка товаров.

```ts
// src/widgets/product-list/index.ts
export { default as ProductListWidget } from './ui/ProductListWidget.vue'
```

```ts
// src/widgets/product-list/model/useProductList.ts
import { ref, onMounted } from 'vue'
import { fetchProducts } from '@/entities/product/api'
// Здесь мы импортируем тип сущности Product
import type { Product } from '@/entities/product/model/types'

export function useProductList() {
  // Здесь мы храним список товаров
  const products = ref<Product[]>([])
  // Здесь мы храним статус загрузки
  const isLoading = ref(false)
  // Здесь мы храним возможную ошибку
  const error = ref<string | null>(null)

  async function loadProducts() {
    isLoading.value = true
    error.value = null
    try {
      // Здесь мы загружаем данные через слой entities
      products.value = await fetchProducts()
    } catch (e) {
      // Здесь мы обрабатываем ошибку и записываем сообщение
      error.value = 'Не удалось загрузить список товаров'
    } finally {
      isLoading.value = false
    }
  }

  // Здесь мы загружаем данные при монтировании виджета
  onMounted(loadProducts)

  return {
    products,
    isLoading,
    error,
    reload: loadProducts,
  }
}
```

```vue
<!-- src/widgets/product-list/ui/ProductListWidget.vue -->
<template>
  <section>
    <!-- Здесь мы показываем индикатор загрузки -->
    <div v-if="isLoading">Загрузка...</div>
    <!-- Здесь мы показываем ошибку, если она есть -->
    <div v-else-if="error">{{ error }}</div>
    <!-- Здесь мы показываем список товаров -->
    <ul v-else>
      <li v-for="product in products" :key="product.id">
        <!-- Здесь мы используем компонент сущности ProductCard -->
        <ProductCard :product="product" />
      </li>
    </ul>
    <!-- Здесь кнопка перезагрузки -->
    <button @click="reload">Обновить</button>
  </section>
</template>

<script setup lang="ts">
// Здесь мы подключаем наш композиционный хук виджета
import { useProductList } from '../model/useProductList'
// Здесь мы импортируем UI-компонент сущности Product
import { ProductCard } from '@/entities/product'

const { products, isLoading, error, reload } = useProductList()
</script>
```

Обратите внимание, что виджет работает через слой entities и не лезет в shared/api напрямую. Это помогает не смешивать уровни ответственности.

## Слой features

Фичи — это законченные пользовательские сценарии. Примеры:

- feature-auth/login
- feature-auth/logout
- feature-product/add-to-cart
- feature-search/search-bar

Фича часто:

- имеет собственный UI,
- может использовать сущности и shared-слой,
- предоставляет наружу понятный интерфейс (компонент, хук, экшены).

### Структура фичи

Типичная структура фичи:

src/features  
- auth-login/  
  - ui/  
    - LoginForm.vue  
  - model/  
    - useLogin.ts  
  - lib/  
    - validators.ts  
  - index.ts  

Теперь вы увидите, как это выглядит в коде.

```ts
// src/features/auth-login/index.ts
export { default as LoginForm } from './ui/LoginForm.vue'
```

```ts
// src/features/auth-login/model/useLogin.ts
import { ref } from 'vue'
// Здесь мы обращаемся к сущности User через store
import { useUserStore } from '@/entities/user'
import { loginByEmail } from '@/shared/api/auth'
import { validateEmail } from '../lib/validators'

export function useLogin() {
  const email = ref('')
  const password = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const userStore = useUserStore()

  async function submit() {
    // Здесь мы сбрасываем ошибку перед новой попыткой
    error.value = null

    // Здесь мы валидируем email до отправки
    if (!validateEmail(email.value)) {
      error.value = 'Некорректный email'
      return
    }

    isLoading.value = true
    try {
      // Здесь мы вызываем API-метод авторизации
      const user = await loginByEmail({
        email: email.value,
        password: password.value,
      })
      // Здесь мы сохраняем пользователя в store сущности
      userStore.setUser(user)
    } catch (e) {
      // Здесь мы показываем пользователю сообщение об ошибке
      error.value = 'Не удалось выполнить вход'
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
<!-- src/features/auth-login/ui/LoginForm.vue -->
<template>
  <form @submit.prevent="submit">
    <!-- Здесь мы двусторонне связываем поле email -->
    <input v-model="email" type="email" placeholder="Email" />
    <!-- Здесь мы двусторонне связываем поле пароля -->
    <input v-model="password" type="password" placeholder="Пароль" />

    <!-- Здесь показываем ошибку, если она есть -->
    <p v-if="error" class="error">{{ error }}</p>

    <!-- Здесь блокируем кнопку во время загрузки -->
    <button type="submit" :disabled="isLoading">
      {{ isLoading ? 'Входим...' : 'Войти' }}
    </button>
  </form>
</template>

<script setup lang="ts">
// Здесь мы используем композиционный хук фичи
import { useLogin } from '../model/useLogin'

const { email, password, isLoading, error, submit } = useLogin()
</script>

<style scoped>
/* Здесь мы описываем локальные стили формы */
.error {
  color: red;
}
</style>
```

Такую фичу вы можете использовать в любой странице или виджете, не задумываясь, как именно реализована авторизация.

## Слой entities

Сущности описывают предметную область: пользователя, продукт, заказ. Здесь удобно хранить:

- типы и интерфейсы,
- store или композиционные хуки, связанные с сущностью,
- UI-компоненты, жестко привязанные к сущности (UserAvatar, ProductCard),
- API-методы, работающие именно с этой сущностью (но чаще — просто тонкая обертка над shared/api).

### Структура сущности Product

Пример:

src/entities/product  
- model/  
  - types.ts  
  - useProductStore.ts  
- ui/  
  - ProductCard.vue  
- api/  
  - index.ts  
- index.ts  

Теперь давайте посмотрим, что внутри.

```ts
// src/entities/product/model/types.ts
// Здесь мы описываем тип данных продукта
export interface Product {
  id: number
  title: string
  price: number
  imageUrl: string
}
```

```ts
// src/entities/product/api/index.ts
import { httpClient } from '@/shared/api/http'
import type { Product } from '../model/types'

// Здесь мы загружаем список товаров с сервера
export async function fetchProducts(): Promise<Product[]> {
  const response = await httpClient.get('/products')
  // Здесь мы предполагаем, что сервер возвращает массив объектов Product
  return response.data as Product[]
}
```

```ts
// src/entities/product/model/useProductStore.ts
import { defineStore } from 'pinia'
import type { Product } from './types'
import { fetchProducts } from '../api'

// Здесь мы создаем store для сущности Product
export const useProductStore = defineStore('product', {
  state: () => ({
    // Здесь мы храним список всех продуктов
    items: [] as Product[],
    // Здесь мы храним индикатор загрузки
    isLoading: false,
  }),
  actions: {
    async loadAll() {
      this.isLoading = true
      try {
        // Здесь мы получаем товары через API метода сущности
        this.items = await fetchProducts()
      } finally {
        this.isLoading = false
      }
    },
  },
})
```

```vue
<!-- src/entities/product/ui/ProductCard.vue -->
<template>
  <article class="product-card">
    <!-- Здесь мы показываем картинку товара -->
    <img :src="product.imageUrl" :alt="product.title" />
    <!-- Здесь мы показываем название товара -->
    <h3>{{ product.title }}</h3>
    <!-- Здесь мы показываем цену товара -->
    <p>{{ product.price }} ₽</p>
    <!-- Здесь мы рендерим слот для действий над товаром -->
    <slot name="actions" />
  </article>
</template>

<script setup lang="ts">
import type { Product } from '../model/types'

// Здесь мы принимаем объект продукта через пропсы
defineProps<{
  product: Product
}>()
</script>

<style scoped>
/* Здесь мы описываем базовые стили карточки */
.product-card {
  border: 1px solid #ccc;
  padding: 8px;
}
</style>
```

```ts
// src/entities/product/index.ts
export type { Product } from './model/types'
export { useProductStore } from './model/useProductStore'
export { default as ProductCard } from './ui/ProductCard.vue'
export * as productApi from './api'
```

Благодаря такой структуре любой слой выше может работать с продуктами через понятный интерфейс сущности, не зная, как именно устроен API или хранилище.

## Слой shared

Shared — это самый нижний слой, от которого зависят все остальные. Здесь лежит все, что не относится к конкретной предметной области:

- UI-кит (кнопки, инпуты, модалки),
- хелперы и утилиты,
- общие API-клиенты (httpClient),
- конфигурация, константы.

### Структура слоя shared

Пример:

src/shared  
- ui/  
  - Button.vue  
  - Input.vue  
- api/  
  - http.ts  
- lib/  
  - formatCurrency.ts  
- config/  
  - env.ts  

Покажу вам, как это реализовано на практике.

```ts
// src/shared/api/http.ts
import axios from 'axios'

// Здесь мы создаем общий экземпляр http-клиента
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
})
```

```ts
// src/shared/lib/formatCurrency.ts
// Здесь мы форматируем число в строку с валютой
export function formatCurrency(value: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  }).format(value)
}
```

```vue
<!-- src/shared/ui/Button.vue -->
<template>
  <button :class="['btn', theme]" v-bind="$attrs">
    <!-- Здесь мы рендерим содержимое кнопки -->
    <slot />
  </button>
</template>

<script setup lang="ts">
// Здесь мы описываем тему кнопки через пропсы
defineProps<{
  theme?: 'primary' | 'secondary'
}>()
</script>

<style scoped>
/* Здесь базовый стиль кнопки */
.btn {
  padding: 8px 12px;
  border: none;
  cursor: pointer;
}
/* Здесь стиль для основной кнопки */
.primary {
  background: #42b883;
  color: white;
}
/* Здесь стиль для второстепенной кнопки */
.secondary {
  background: #e0e0e0;
  color: #333;
}
</style>
```

Shared-слой не должен знать о фичах, страницах и тем более о конкретных сущностях.

## Правила зависимостей между слоями

Чтобы архитектура оставалась устойчивой, важно соблюдать «направление» импортов. Удобно мыслить так: верхний слой может зависеть от нижнего, но не наоборот.

### Допустимые зависимости

Смотрите, давайте зададим простое правило:

- app может импортировать все слои.
- processes может импортировать pages, widgets, features, entities, shared.
- pages может импортировать widgets, features, entities, shared.
- widgets может импортировать features, entities, shared.
- features может импортировать entities, shared.
- entities может импортировать shared.
- shared не импортирует никого сверху.

Если вы видите импорт, который нарушает эту иерархию (например, shared/ui/Button.vue вдруг импортирует компонент из entities/user), это сигнал, что вы перепутали уровни абстракции.

### Как контролировать зависимости

В реальных проектах часто подключают линтеры (например, eslint с правилами для import/order и alias) и/или кастомные плагины, чтобы не допускать неправильных импортов.

Базовые советы:

- Используйте alias вида @/shared, @/entities, @/features и так далее.
- Не импортируйте напрямую из «глубины» слоя другого типа (например, из features/auth-login/model) вне самой фичи. Делайте index.ts как точку входа.

Пример правильного импорта фичи:

```ts
// Правильно - импорт из entry point фичи
import { LoginForm } from '@/features/auth-login'

// Потенциальная проблема - импорт из внутренней структуры фичи
// import { useLogin } from '@/features/auth-login/model/useLogin'
```

Если вам нужен более тонкий доступ, можно экспортировать дополнительные сущности через index.ts фичи, но стараться не раскрывать слишком много внутренних деталей.

## Организация стора в vue-fsd

В Vue-проектах часто возникает вопрос: куда класть Pinia-сторы в структуре FSD? Общий принцип — стора относятся к тем сущностям, за состояние которых они отвечают.

### Стора в слое entities

Состояние конкретных доменных сущностей (User, Product, Cart):

- идут в entities/user, entities/product и так далее;
- могут использоваться во многих фичах и виджетах.

Мы выше уже смотрели пример useProductStore. Аналогично можно сделать store пользователя:

```ts
// src/entities/user/model/useUserStore.ts
import { defineStore } from 'pinia'

// Здесь мы описываем тип пользователя
export interface User {
  id: number
  email: string
  name: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    // Здесь мы храним текущего авторизованного пользователя
    current: null as User | null,
  }),
  actions: {
    // Здесь мы устанавливаем пользователя после логина
    setUser(user: User) {
      this.current = user
    },
    // Здесь мы очищаем пользователя при выходе из системы
    clearUser() {
      this.current = null
    },
  },
})
```

### Локальное состояние в фичах и виджетах

Состояние, которое актуально только внутри конкретной фичи или виджета (например, открыта ли модалка, текст поиска в локальном инпуте), лучше держать внутри композиционных хуков слоя features или widgets, а не в глобальном сторе.

Это снижает связанность и делает поведение более предсказуемым.

```ts
// src/features/search-bar/model/useSearchBar.ts
import { ref } from 'vue'

// Здесь мы храним состояние только для строки поиска
export function useSearchBar() {
  const query = ref('')

  function updateQuery(value: string) {
    query.value = value
  }

  return {
    query,
    updateQuery,
  }
}
```

Такое состояние не нужно делать глобальным, если им пользуется одна фича и один виджет.

## Маршрутизация и страницы

### Где хранить конфигурацию роутов

Сами компоненты страниц лежат в pages, а конфигурация роутера — в app/providers/router.ts. Можно пойти дальше и вынести описания роутов рядом со страницами.

Например:

src/pages/product  
- ui/  
  - ProductPage.vue  
- config/  
  - routes.ts  
- index.ts  

```ts
// src/pages/product/config/routes.ts
import { ProductPage } from '../index'

export const productRoutes = [
  {
    path: '/product/:id',
    component: ProductPage,
  },
]
```

А в app/providers/router.ts вы собираете все маршруты:

```ts
// src/app/providers/router.ts
import { createRouter, createWebHistory } from 'vue-router'
import { HomePage } from '@/pages/home'
import { productRoutes } from '@/pages/product/config/routes'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    // Здесь мы добавляем роуты страницы продукта
    ...productRoutes,
  ],
})
```

Такой подход упрощает поддержку, когда страниц становится много.

### Код-сплиттинг и lazy-loading

Vue Router поддерживает ленивую загрузку страниц. FSD этому не мешает, а скорее помогает.

```ts
// src/pages/home/index.ts
// Здесь мы экспортируем ленивый компонент как entry point
export const HomePage = () => import('./ui/HomePage.vue')
```

```ts
// src/app/providers/router.ts
import { HomePage } from '@/pages/home'
import { ProductPage } from '@/pages/product'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      // Здесь роутер сам выполнит ленивую загрузку компонента
      component: HomePage,
    },
    {
      path: '/product/:id',
      component: ProductPage,
    },
  ],
})
```

FSD не ограничивает вас в том, как именно делать lazy-loading, но рекомендует оставлять точку входа страницы в ее собственном index.ts.

## Слои processes и более сложные сценарии

Processes — слой для сквозных пользовательских процессов, которые включают несколько страниц, фич и виджетов. Например:

- процесс регистрации пользователя с несколькими шагами;
- процесс оформления заказа;
- процесс онбординга.

Этот слой вам может не понадобиться в небольших проектах. Но если вы видите, что логика какого-то многошагового процесса размазана по нескольким страницам, имеет смысл вынести его в processes.

### Пример процесса оформления заказа

Структура:

src/processes  
- checkout/  
  - model/  
    - useCheckout.ts  
  - ui/  
    - CheckoutProgressBar.vue  
  - index.ts  

```ts
// src/processes/checkout/model/useCheckout.ts
import { ref } from 'vue'
import { useCartStore } from '@/entities/cart'
import { createOrder } from '@/entities/order/api'

// Здесь мы управляем шагами оформления заказа
export function useCheckout() {
  const step = ref(1)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  const cartStore = useCartStore()

  function nextStep() {
    step.value += 1
  }

  async function submitOrder() {
    isSubmitting.value = true
    error.value = null
    try {
      // Здесь мы создаем заказ на основе содержимого корзины
      await createOrder(cartStore.items)
      // Здесь мы очищаем корзину после успешного заказа
      cartStore.clear()
    } catch (e) {
      // Здесь мы записываем сообщение об ошибке
      error.value = 'Не удалось оформить заказ'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    step,
    isSubmitting,
    error,
    nextStep,
    submitOrder,
  }
}
```

Этот процесс затем может использоваться внутри нескольких страниц, где нужно показывать прогресс, кнопки «Далее», «Назад» и финальное подтверждение.

## Практические рекомендации по переходу на vue-fsd

### Как начать с уже существующим проектом

Если у вас уже есть Vue-проект с классической структурой, не обязательно переписывать все сразу. Можно двигаться итеративно.

Давайте разберем пример пошагового перехода:

1. Введите базовые слои: shared, entities, features, pages, app.
2. Перенесите общие компоненты в shared/ui.
3. Выделите явные доменные сущности и перенесите их в entities (типы, API, UI).
4. Для одного-двух ключевых сценариев создайте фичи в features и страницы в pages.
5. Постепенно переносите остальной код, когда к нему возвращаетесь.

### Быстрый чек-лист для нового кода

Когда вы добавляете новый компонент или модуль, задавайте себе вопросы:

- Это общая, переиспользуемая вещь без бизнес-смысла? Тогда shared.
- Это про конкретную сущность (User, Product)? Тогда entities.
- Это законченный пользовательский сценарий (login, add-to-cart)? Тогда features.
- Это большой блок интерфейса, собирающий несколько фич? Тогда widgets.
- Это целая страница, привязанная к роуту? Тогда pages.
- Это про инициализацию, провайдеры, корневой layout? Тогда app.

Если не получается однозначно ответить, возможно, архитектуру конкретного места стоит уточнить: иногда полезно сначала сформулировать бизнес-смысл, а уже потом выбирать слой.

### Нейминг и алиасы

Чтобы работа с vue-fsd была удобнее, используйте алиасы в Vite (или Webpack):

```ts
// vite.config.ts - пример настройки алиасов
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Здесь мы задаем алиасы под каждый слой
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
})
```

Такой подход делает зависимости явными и облегчает навигацию по проекту.

## Заключение

Feature-Sliced Design для Vue (vue-fsd) помогает выстраивать структуру фронтенд-проекта вокруг бизнес-смыслов, а не вокруг технологий. Вы делите код на слои (app, pages, widgets, features, entities, shared), каждый из которых отвечает за свой уровень абстракции и имеет понятные правила зависимостей.

Вы видели примеры:

- как организовать точку входа и роутер в слое app;
- как описывать страницы в pages без избыточной логики;
- как строить виджеты, которые собирают несколько фич и сущностей;
- как выделять фичи как единицы бизнес-функционала;
- как оформлять сущности с типами, store, UI и API;
- как использовать shared для общих компонентов, утилит и http-клиента;
- как работать с Pinia и маршрутизацией в контексте FSD.

Подход не навязывает конкретные библиотеки, а описывает архитектурные принципы, которые хорошо ложатся на Vue 3 и современный стек (Vite, Pinia, Vue Router). Чем больше растет приложение, тем заметнее становится польза от четкого разделения слоев и сокращения связности.

Главная идея vue-fsd — сделать так, чтобы каждый модуль было легко найти, легко понять и безопасно изменять, не ломая остальную систему. Если вы будете постепенно применять описанные принципы и адаптировать их под свой проект, структура кода станет более предсказуемой и устойчивой к изменениям.

## Частозадаваемые технические вопросы

### Как подключать глобальные плагины Vue в структуре FSD?

Подключайте плагины в слое app, обычно в app/index.ts или в отдельной папке providers:

- создайте файл, например app/providers/ui.ts;
- внутри экспортируйте функцию setupUi(app) с подключением плагина;
- вызовите ее в app/index.ts.

Так плагины остаются на уровне инициализации и не протекают в доменную логику.

### Куда класть глобальные стили и CSS-переменные?

Глобальные стили и темы удобно держать в app/styles:

- app/styles/index.scss — глобальное подключение;
- app/styles/themes — файлы с CSS-переменными для тем;
- импортируйте index.scss в app/index.ts.

Компонентные стили остаются локальными в соответствующих слоях (scoped-стили).

### Как в vue-fsd организовать i18n?

Слой app:

- создайте app/providers/i18n.ts, где настраиваете Vue I18n;
- в app/index.ts подключите i18n как плагин;
- словари можно разбить по слоям, но собирать их в одном месте (например, app/providers/i18n/messages.ts), импортируя локали из features, entities и так далее.

Главное — не тянуть i18n-конфигурацию в lower-level слои напрямую.

### Где хранить типы, которые используются в нескольких сущностях?

Если тип относится к конкретной сущности (например, ProductStatus), держите его в entities/product/model. Если тип действительно сквозной и не принадлежит одной сущности (например, PaginationParams), перенесите его в shared/lib/types или shared/config, в зависимости от смысла.

### Как лучше тестировать модули в структуре vue-fsd?

Организуйте тесты рядом с кодом слоя:

- для сущностей — entities/product/model/__tests__;
- для фич — features/auth-login/model/__tests__;
- для shared — shared/lib/__tests__.

Тестируйте:

- entities — как чистую доменную логику и взаимодействие с API;
- features — как пользовательские сценарии (submit, add-to-cart);
- widgets и pages — через компонентные тесты, проверяя сборку интерфейса, а не детали реализации слоев ниже.