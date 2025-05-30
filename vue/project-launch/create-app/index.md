---
metaTitle: Создание и структурирование Vue.js приложения
metaDescription: Пошаговое руководство по созданию и структурированию Vue.js приложения - разбор структуры директорий, конфигурации, best practices и примеры кода
author: Ирина Лазарева
title: Создание и структурирование Vue.js приложения
preview: Научитесь создавать Vue.js приложения с нуля и профессионально структурировать проект для легкой поддержки и масштабирования - изучите примеры папок, компонентов и инструментов
---

## Введение

Vue.js считается одним из наиболее простых и мощных фреймворков для создания современных интерфейсов. Его гибкость позволяет разрабатывать как небольшие виджеты, так и масштабные приложения. Однако с ростом приложения вы можете столкнуться с вопросами организации кода, поддерживаемости и масштабируемости. Грамотно структурировать Vue.js проект — это фундамент для эффективной разработки и командной работы.

В этой статье я покажу вам, как создать Vue.js приложение с нуля и организовать проект так, чтобы вы могли развивать его без хаоса в кодовой базе. Вы узнаете, как правильно распределить файлы по папкам, как работать с компонентами, роутингом и состоянием приложения. Я приведу кодовые примеры и объясню детали каждого этапа.

## Начальная инициализация Vue.js приложения

### Выбор инструментов

Начинать рекомендую с официального инструмента [Vue CLI](https://cli.vuejs.org/) или с [Vite](https://vitejs.dev/), который стал стандартом для новых Vue 3 проектов.

- **Vue CLI** хорош для проектов с требованиями к большой кастомизации.
- **Vite** обеспечивает молниеносную сборку и горячую перезагрузку, подходит для большинства задач.

Для примера возьмём Vite + Vue 3, так как это самый быстрый и актуальный способ.

### Создание проекта с помощью Vite

Откройте терминал и выполните:

```sh
npm create vite@latest my-vue-app -- --template vue
```

- `my-vue-app` — это ваша будущая папка с проектом.
- Флаг `--template vue` указывает, что нужен шаблон Vue.

Далее:

```sh
cd my-vue-app
npm install
npm run dev
```

Теперь локальный сервер запущен, и вы видите стартовую страницу Vue-приложения.

### Структура начального проекта

Давайте посмотрим, какие файлы вы получаете сразу:

```
my-vue-app/
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ assets/
│  ├─ components/
│  ├─ App.vue
│  └─ main.js
├─ index.html
├─ package.json
├─ vite.config.js
```

На этом скелете дальше строится архитектура реального приложения.

## Развернутая структура приложения

### Почему важна структура?

Грамотная структура директорий упрощает навигацию по проекту, ускоряет онбординг новых участников и помогает избежать путаницы. Вам не придется терять время на поиски нужной функции или компонента. К тому же, хорошая структура облегчает автоматизацию, тестирование и масштабирование.

### Базовая и расширенная структура

Предлагаю следующую схему, которую вы встретите во многих успешных проектах:

```
src/
├─ assets/          # Статические ресурсы (стили, изображения)
├─ components/      # Переиспользуемые компоненты
├─ views/           # Страницы приложения
├─ router/          # Файлы роутинга
├─ store/           # Централизованное состояние (Vuex, Pinia)
├─ services/        # Работа с API
├─ utils/           # Утилиты и хелперы
├─ composables/     # Композиционные функции (Vue 3)
├─ App.vue          # Корневой компонент
├─ main.js          # Точка входа
```

Давайте обсудим назначение каждой папки.

#### assets

Содержит изображения, иконки, стили и шрифты:

```
src/assets/logo.png
src/assets/styles/global.css
```

#### components

Здесь лежат микро-компоненты, которые можно использовать во многих местах, например, кнопки или карточки товаров:

```
src/components/BaseButton.vue
src/components/ProductCard.vue
```

#### views

Это страницы для роутинга. Например, главная и профиль пользователя:

```
src/views/HomeView.vue
src/views/ProfileView.vue
```

#### router

Здесь размещается настройка роутера:

```
src/router/index.js   // или router.js
```

##### Пример файла роутинга

```js
// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/profile',
    name: 'Profile',
    // Ленивая загрузка компонента
    component: () => import('../views/ProfileView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

#### store

Здесь хранятся модули состояния. В Vue 3 чаще всего используется Pinia вместо Vuex.

##### Пример файла Pinia-стора

```js
// src/store/user.js

import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    authenticated: false
  }),
  actions: {
    login(name) {
      this.name = name
      this.authenticated = true
    },
    logout() {
      this.name = ''
      this.authenticated = false
    }
  }
})
```

#### services

Вынесите API-запросы и другую бизнес-логику.

```js
// src/services/api.js

import axios from 'axios'

export function getUser(id) {
  // Получение информации о пользователе по id
  return axios.get(`/api/users/${id}`)
}
```

#### utils

Здесь находятся функции-помощники:

```js
// src/utils/formatDate.js

export function formatDate(date) {
  // Преобразует дату в вид 'dd.mm.yyyy'
  const d = new Date(date)
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}
```

#### composables (в Vue 3)

В Vue 3 используются composables для повторного использования логики.

```js
// src/composables/useToggle.js

import { ref } from 'vue'

export function useToggle(init = false) {
  // Возвращает реактивное состояние и функцию для его переключения
  const state = ref(init)
  function toggle() {
    state.value = !state.value
  }
  return { state, toggle }
}
```

## Структура и написание компонентов

### Однофайловые компоненты (Single File Components)

В Vue.js компонент обычно размещается в файле с расширением `.vue`. Такая структура делит компонент на три части:

- `<template>` — шаблон разметки,
- `<script>` — логика компонента,
- `<style>` — непосредственные стили, часто с модификаторами `scoped`.

#### Пример простого компонента

```vue
<template>
  <button @click="increment">{{ count }}</button>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    // Создание реактивной переменной count
    const count = ref(0)
    function increment() {
      count.value++
    }
    return { count, increment }
  }
}
</script>

<style scoped>
button {
  padding: 10px 24px;
  font-size: 18px;
}
</style>
```

### Организация крупных компонентов

Если компонент становится громоздким, разделите его на дочерние:

- Вынесите части интерфейса или повторяющуюся логику в отдельные файлы в папке components/.
- Используйте Base-префикс для базовых компонентов (BaseButton.vue, BaseInput.vue).

### Использование props и событий

Vue-компоненты "общаются" между собой через props (пропсы) и события:

```vue
<!-- src/components/UserGreeting.vue -->
<template>
  <div @click="$emit('clicked')">Привет, {{ name }}!</div>
</template>

<script>
export default {
  props: {
    name: String
  }
}
</script>
```

## Подключение роутинга и состояния

### Роутинг: переход между страницами

В файле `main.js` регистрируем роутер:

```js
// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App)
  .use(router)
  .mount('#app')
```

### Состояние: глобальный store

Для глобального состояния современный выбор — Pinia:

```js
// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
```

Теперь вы можете использовать store в компонентах:

```js
import { useUserStore } from '../store/user'

export default {
  setup() {
    const user = useUserStore()
    // user.login('Ирина')
    // user.logout()
    return { user }
  }
}
```

## Организация стилей и ассетов

### Использование глобальных, модульных и scoped-стилей

- **global.css** кладём в assets и импортируем один раз в main.js.
- В каждом компоненте используйте `<style scoped>`, если стили применимы только к этому компоненту.
- Применяйте CSS-модули, если нужно исключить конфликты стилей в больших проектах.

### Работа с ассетами

Импортировать изображения можно прямо в шаблонах или скриптах:

```vue
<template>
  <img :src="logo" alt="Логотип" />
</template>
<script>
import logo from '../assets/logo.png'

export default {
  setup() {
    return { logo }
  }
}
</script>
```

## Тестирование и best practices

### Где размещать тесты

Локализуйте тесты рядом с файлами компонентов или внутри отдельной папки `tests/`.

```
src/components/
  ├─ BaseButton.vue
  └─ __tests__/
       └─ BaseButton.spec.js
```

### Советы по организации кода

- Соблюдайте принцип "однофайловых компонентов": всё, что относится к одному компоненту — в одном файле.
- Не копируйте код, а выносите повторяемую логику в composables или утилиты.
- Именуйте компоненты в PascalCase (`UserProfile.vue`).
- Используйте папки для модулей — по фичам и доменам для больших приложений.

## Заключение

Создание Vue.js приложения начинается с грамотной и продуманной структуры — это обеспечивает максимум удобства и адаптивности проекта при его развитии. Используя современные инструменты вроде Vite и Pinia, комбинируя компоненты, роутинг, глобальное состояние и четкую структуру директорий, вы делаете приложение поддерживаемым и легким для расширения. Деление по принципу "views–components–store–services–utils–composables" позволит избежать хаоса в будущем, особенно если проект быстро растет или вы работаете в команде.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### 1. Как подключить стороннюю библиотеку компонентов (например, Element Plus) в проекте на Vue 3?

**Ответ:**  
Установите библиотеку через npm:  
`npm install element-plus`  
Импортируйте нужные компоненты и css в main.js:  
```js
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
```
Теперь вы можете использовать компоненты Element Plus в шаблонах.

---

### 2. Что делать, если роутер не работает — ссылки не меняют страницу?

**Ответ:**  
Убедитесь, что вы правильно используете `<router-view />` в App.vue, а навигацию осуществляете с помощью `<router-link>` или `$router.push()`. Проверьте, что пути указываются правильно в файле routes, и что роутер зарегистрирован в `main.js` через app.use(router).

---

### 3. Как работать с environment-переменными в Vite/Vue?  

**Ответ:**  
Создайте файл `.env` (или `.env.local`) в корне проекта.  
Переменные должны начинаться с `VITE_`, например:  
`VITE_API_URL=https://api.example.com`  
В коде эти значения доступны через `import.meta.env.VITE_API_URL`.

---

### 4. Где лучше размещать глобальные фильтры и как их реализовать в Vue 3?

**Ответ:**  
Вместо фильтров из Vue 2 используйте функции (например, в `src/utils`). Импортируйте и используйте их в компонентах либо регистрируйте как глобальные методы через provide/inject или app.config.globalProperties.

---

### 5. Как настроить абсолютные пути для импортов, чтобы не писать '../../../'?

**Ответ:**  
В Vite настройте поле `resolve.alias` в файле `vite.config.js`:  
```js
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```
Теперь можно импортировать, например, `@/components/MyComponent.vue`.

---