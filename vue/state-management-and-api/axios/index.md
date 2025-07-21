---
metaTitle: Взаимодействие с внешними API через Axios в Vue
metaDescription: Подробное руководство по работе с внешними API во Vue через Axios - настройка запросов, обработка данных, примеры кода и лучшие практики для ваших проектов
author: Олег Марков
title: Взаимодействие с внешними API через Axios в Vue
preview: Узнайте, как использовать библиотеку Axios для интеграции внешних API во Vue проектах, разберитесь с настройкой, обработкой ошибок и примерами кода
---

## Введение

Любое современное веб-приложение так или иначе взаимодействует с внешними сервисами и API. В приложениях на Vue одним из самых стандартных способов обмена данными с backend-сервисами является библиотека Axios. Она обеспечивает удобный, гибкий и мощный интерфейс для выполнения HTTP-запросов. Если вы планируете получать, отправлять или изменять данные с помощью API, Axios станет отличным инструментом в вашем арсенале. В этой статье я покажу вам, как интегрировать Axios во Vue-проекты, разберу разные варианты запросов и дам рекомендации по обработке полученных данных.

## Установка и настройка Axios во Vue

### Почему именно Axios?

Axios – это популярная JavaScript-библиотека для выполнения HTTP-запросов. Она базируется на промисах (Promise), подходит как для браузера, так и для Node.js, имеет лаконичный синтаксис и хорошо документирована. Преимущества Axios по сравнению с встроенным fetch-синтаксисом:

- Интерцепторы для перехвата и обработки запросов/ответов
- Гибкая сериализация объектов
- Продвинутая обработка ошибок
- Прямая поддержка таймаутов и отмены запросов

### Как установить Axios

Начнем с самого простого — установки библиотеки. Если у вас уже есть Vue-проект (например, созданный с помощью Vue CLI или Vite), достаточно выполнить команду:

```bash
npm install axios
# Или, если используется Yarn:
yarn add axios
```

Взаимодействие с внешними API через Axios — один из ключевых навыков для современных Vue.js разработчиков. Правильная настройка запросов, обработка данных и использование лучших практик позволяют создавать эффективные и производительные приложения. Если вы хотите детальнее изучить взаимодействие с API через Axios, разобраться в настройке запросов и обработке данных — приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=vzaimodeistvie-s-vneshnimi-api-cherez-axios). На курсе 173 уроков и 21 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Импорт Axios в проект

Обычно Axios импортируют непосредственно в компоненты или отдельный сервис. Посмотрите на этот пример:

```js
// Импорт шифруем в нужном компоненте или JS-файле
import axios from 'axios'
```

На практике хорошим подходом считается вынос базовой конфигурации Axios в отдельный модуль. Это позволит централизованно управлять API-URL, заголовками, авторизацией и так далее.

```js
// src/services/api.js
import axios from 'axios'

// Создаем экземпляр Axios с базовым URL
const api = axios.create({
  baseURL: 'https://api.example.com/v1'
  // Здесь можно добавить headers, timeout и прочие настройки
})

export default api
```

Теперь в любом компоненте достаточно импортировать этот экземпляр:

```js
import api from '@/services/api'
```

---

## Выполнение HTTP-запросов с Axios во Vue

### Пример простого GET-запроса

Давайте разберём классический пример — получение списка пользователей с внешнего API.

```js
<template>
  <div>
    <h3>Список пользователей:</h3>
    <ul>
      <li v-for="user in users" :key="user.id">{{ user.name }}</li>
    </ul>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  data() {
    return {
      users: [],       // Здесь будут храниться пользователи
      loading: false,  // Для отображения загрузки
      error: ''        // Для ошибок
    }
  },
  mounted() {
    // При монтировании компонента вызывается метод
    this.fetchUsers()
  },
  methods: {
    async fetchUsers() {
      this.loading = true
      this.error = ''
      try {
        const response = await api.get('/users')  // GET-запрос к API
        this.users = response.data               // Сохраняем данные
      } catch (err) {
        this.error = 'Ошибка загрузки пользователей' // Обрабатываем ошибку
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
```

В этом примере:

- `api.get('/users')` выполняет GET-запрос. Путь указывается относительно базового URL.
- Ответ API доступен в свойстве `response.data`.
- Ошибки ловим через `try/catch`.

### Работа с POST, PUT и DELETE

Давайте вспомним, что кроме получения данных, часто нужно их передавать или изменять.

#### POST — создание нового ресурса

```js
methods: {
  async createUser(newUser) {
    try {
      const response = await api.post('/users', newUser)
      // В response.data обычно возвращается созданный пользователь
    } catch (err) {
      // Обработка ошибок
    }
  }
}
```
- Второй аргумент — отправляемые данные.

#### PUT/PATCH — обновление ресурса

```js
methods: {
  async updateUser(id, updatedUser) {
    try {
      await api.put(`/users/${id}`, updatedUser)
    } catch (err) {
      // Обработка ошибок
    }
  }
}
```

#### DELETE — удаление ресурса

```js
methods: {
  async deleteUser(id) {
    try {
      await api.delete(`/users/${id}`)
    } catch (err) {
      // Обработка ошибок
    }
  }
}
```

### Передача параметров и заголовков

#### URL-параметры

В Axios можно легко передать query string через параметр `params`. Пример — фильтрация:

```js
async fetchUsersByRole(role) {
  try {
    const response = await api.get('/users', {
      params: { role }
    })
    this.users = response.data
  } catch (err) {
    // Обработка ошибок
  }
}
```

#### Кастомные заголовки

Добавим авторизационный токен:

```js
async fetchSecureData() {
  try {
    const response = await api.get('/secure-data', {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    })
    // Используем response.data
  } catch (err) {
    // Обработка ошибок
  }
}
```

### Универсальная обработка ошибок

Axios всегда выбрасывает ошибку при статусах ответа, отличных от успешных (2xx). Важно учитывать это в вашем коде. Для глубокого анализа можно смотреть объект error:

```js
try {
  await api.get('/some-endpoint')
} catch (err) {
  if (err.response) {
    // Сервер вернул ответ с ошибочным статусом
    console.log('Ошибка сервера', err.response.status, err.response.data)
  } else if (err.request) {
    // Запрос был отправлен, но ответ не получен
    console.log('Нет ответа', err.request)
  } else {
    // Какая-то другая ошибка (например, синтаксис)
    console.log('Ошибка', err.message)
  }
}
```

---

## Организация архитектуры работы с API

### Вынесение логики взаимодействия с API в сервисы

Хорошая практика — не помещать логику работы с API прямо в компоненты, а выносить её в отдельные сервисные модули. Это улучшает читаемость кода, повторное использование и тестируемость.

```js
// src/services/userService.js
import api from '@/services/api'

export default {
  async getUsers(params) {
    return api.get('/users', { params })
  },
  async createUser(payload) {
    return api.post('/users', payload)
  },
  // Другие методы
}
```

В компоненте:

```js
import userService from '@/services/userService'

methods: {
  async loadUsers() {
    try {
      const response = await userService.getUsers({ role: 'admin' })
      this.users = response.data
    } catch (err) {
      // Обработка ошибок
    }
  }
}
```

### Использование Axios-интерцепторов

Интерцепторы (interceptors) — это очень полезная особенность Axios, позволяющая централизованно обрабатывать запросы и ответы: например, автоматически добавлять токены, логировать, перехватывать 401-ошибки и обновлять токен доступа (refresh-token flow).

#### Пример добавления токена к каждому запросу

```js
// src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.example.com/v1'
})

// Интерцептор для автоматического добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
```

#### Перехватчик ошибок

```js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если 401 – возможно, требуется выйти из аккаунта или обновить токен
    if (error.response && error.response.status === 401) {
      // Логика выхода или обновления токена
    }
    return Promise.reject(error)
  }
)
```

---

## Реактивность и асинхронные запросы

### Рекомендации по работе с асинхронностью и хранением данных

Vue отлично работает с реактивными данными. После получения ответа API данные, сохранённые в state (data или store), автоматически обновляют представление (view). Действия накладываем через методы или функции.

- Лучше помещать вызовы API во хуки жизненного цикла (например, `mounted` или `created`), а не в конструкторы компонентов.
- Для сложных приложений используйте глобальное хранилище состояния (Vuex или Pinia).

### Пример интеграции с Pinia

Pinia — современный state-менеджер для Vue. Работа с Axios тут аналогична:

```js
// stores/userStore.js
import { defineStore } from 'pinia'
import userService from '@/services/userService'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchUsers() {
      this.loading = true
      this.error = null
      try {
        const response = await userService.getUsers()
        this.users = response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Ошибка загрузки'
      } finally {
        this.loading = false
      }
    }
  }
})
```

---

## Дополнительные возможности Axios

### Тайм-ауты, отмена запросов и прогресс

#### Установка тайм-аута

```js
const api = axios.create({
  baseURL: 'https://api.example.com/',
  timeout: 5000 // 5 секунд
})
```
- Если сервер не ответит за 5 секунд, будет выброшена ошибка.

#### Как отменять запросы (Abort)

Иногда бывает необходимо отменить "зависший" запрос, например, если пользователь уходит со страницы.

```js
const controller = new AbortController()

api.get('/users', {
  signal: controller.signal
})
// Позже в коде
controller.abort()
```

#### Слежение за прогрессом загрузки/отправки

Полезно для загрузки больших файлов.

```js
api.post('/upload', formData, {
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    // Показываем пользователю прогресс
  }
})
```

---

## Тестирование API-вызовов (unit-тесты)

Покажу вам подход к тестированию сервисов, использующих Axios. Обычно используется библиотека `jest` с моками.

```js
// userService.test.js
import api from '@/services/api'
import userService from '@/services/userService'

// Мокаем get-запрос
jest.mock('@/services/api', () => ({
  get: jest.fn()
}))

test('getUsers вызывает api.get с параметрами', async () => {
  api.get.mockResolvedValue({ data: [{ id: 1, name: 'Ivan' }] })
  const result = await userService.getUsers()
  expect(api.get).toHaveBeenCalledWith('/users', { params: undefined })
  expect(result.data[0].name).toBe('Ivan')
})
```
- Мокаем и подставляем ожидаемый результат, не обращаясь к реальному API.

---

## Интеграция с современными Vue-подходами

### Композиционный API (Composition API) и Axios

Vue 3 располагает новым подходом — Composition API с реэкспортируемыми функциями.

```js
// useUsers.js
import { ref } from 'vue'
import userService from '@/services/userService'

export function useUsers() {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      const response = await userService.getUsers()
      users.value = response.data
    } catch (err) {
      error.value = 'Ошибка загрузки'
    } finally {
      loading.value = false
    }
  }

  return { users, loading, error, fetchUsers }
}
```

Использование в компоненте:

```js
<script setup>
import { onMounted } from 'vue'
import { useUsers } from '@/composables/useUsers'

const { users, loading, error, fetchUsers } = useUsers()
onMounted(fetchUsers)
</script>
```

---

## Локализация и интернационализация запросов

Если вы работаете с многоязычными данными или API поддерживает локализацию, можно передавать локаль прямо в заголовках или параметрах.

```js
api.get('/catalog', {
  headers: {
    'Accept-Language': 'ru'
  }
})
```
- Это может управляться динамически, если пользователь выбирает язык в вашем приложении.

## Заключение

Axios — мощный и гибкий инструмент для интеграции внешних API в проекты на Vue. Он предлагает удобный синтаксис, расширяемую конфигурацию, отличную обработку ошибок и ряд продвинутых функций. Грамотное вынесение запросов в сервисы, использование интерцепторов, управление асинхронностью и работа с Vue-хранилищами позволяют строить масштабируемые и поддерживаемые фронтенд-приложения. Следуя приведённым выше рекомендациям и шаблонам, вы легко сможете взаимодействовать с любым HTTP API наиболее эффективным способом.

Эффективное взаимодействие с внешними API через Axios — залог создания функциональных Vue.js приложений. Это позволяет вашим приложениям получать данные из внешних источников, обрабатывать их и отображать пользователям. Чтобы закрепить полученные знания и научиться применять их на практике, а также узнать больше о работе с API — начните обучение на нашем курсе [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=vzaimodeistvie-s-vneshnimi-api-cherez-axios). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Vue.js прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как настроить базовый URL для разных окружений (dev/prod)?

Часто проекты используют разные API-адреса для разработки и продакшена. Самый удобный способ — использовать переменные окружения. В файле .env:

```
VUE_APP_API_URL=https://api.dev.example.com
```
Затем при создании экземпляра Axios:

```js
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL
})
```

### Как отменить неактуальные API-запросы при переключении маршрута?

Создайте AbortController и передавайте его сигнал в запрос. При смене маршрута вызывайте `controller.abort()`, например, в хуке beforeRouteLeave или onUnmounted (Vue 3).

### Как обработать ошибку сети при запросе в Axios?

Если сервер не отвечает (отключен интернет или API недоступно), Axios выбросит ошибку с пустым error.response. Для таких случаев проверяйте наличие error.response — если его нет, покажите “Нет соединения с сервером”.

### Как объединять несколько запросов в один (например, Promise.all)?

Axios возвращает промисы, и вы можете использовать `Promise.all()`:

```js
const [res1, res2] = await Promise.all([
  api.get('/users'),
  api.get('/posts')
])
```

### Как добавить глобальный preloader для всех запросов?

Добавьте состояние загрузки (например, с помощью Vuex/Pinia или реактивной переменной) и переключайте его через Axios-интерцепторы: до запроса ставьте в true, после — в false.

---
