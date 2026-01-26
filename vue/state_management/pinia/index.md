---
metaTitle: Pinia состояние приложения во Vue нового поколения
metaDescription: Подробное практическое руководство по Pinia - объяснение концепций стора состояния и реактивности во Vue с примерами и разбором типичных сценариев
author: Олег Марков
title: Pinia современный менеджер состояния для Vue
preview: Разбор Pinia - как устроен стор какие есть режимы работы как типизировать хранилище и интегрировать его в реальные проекты на Vue
---

## Введение

Pinia — это официальная библиотека для управления состоянием во Vue 3 (и поддержкой Vue 2 через плагин). Если раньше основным решением был Vuex, то сейчас рекомендуемый путь для новых проектов — именно Pinia.

Цель Pinia — сделать работу с глобальным состоянием проще, прозрачнее и ближе к обычному коду на Vue. Вы пишете сторы как обычные модули JavaScript/TypeScript, получаете типизацию "из коробки" и при этом не теряете удобные инструменты вроде Devtools, горячей перезагрузки и серверного рендеринга.

В этой статье вы увидите, как:

- подключить Pinia к проекту Vue 2 и Vue 3  
- создавать сторы в разных стилях (Options API и Setup Store)  
- работать с состоянием, действиями и геттерами  
- модульно организовывать хранилище и делить его на части  
- использовать Pinia с TypeScript  
- применять плагины, персистентность и SSR  

Я буду сопровождать теорию практическими примерами, чтобы вы сразу видели связь с реальным кодом.

## Что такое Pinia и чем она отличается от Vuex

### Основные идеи Pinia

Pinia строится вокруг нескольких простых принципов:

1. **Каждый стор — это функция**  
   Вы создаете функцию `useXStore`, которая возвращает реактивный объект с состоянием, геттерами и действиями.

2. **Минимум "магии" и шаблонного кода**  
   Нет обязательных мутаций, нет вложенной громоздкой конфигурации. Действия изменяют состояние напрямую.

3. **Простая интеграция с Composition API**  
   Сторы ощущаются как обычные "композиционные" функции, которые вы вызываете внутри компонентов.

4. **Хорошая поддержка TypeScript**  
   Типы выводятся автоматически из стора, а не прописываются вручную.

5. **Поддержка Vue Devtools**  
   Состояние, действия и изменения можно отслеживать в привычном интерфейсе.

### Pinia vs Vuex (коротко по сути)

Давайте сразу разберём ключевые отличия, чтобы вы понимали, почему сейчас чаще выбирают Pinia:

- В Pinia **нет мутаций**. Вы просто пишете действия и в них меняете состояние.
- Структура стора проще — нет обязательных уровней "state / mutations / actions / getters", только `state`, `getters`, `actions`.
- Отлично работает с TypeScript без сложных типов и дженериков.
- Сторы — обычные модули, поэтому модульность достигается естественно, без громоздких пространств имён.

Если вы работали с Vuex, Pinia покажется более естественной и менее "ритуальной": вы делаете меньше обвязки и больше полезного кода.

## Установка и подключение Pinia

### Установка для Vue 3

Для проекта на Vue 3, созданного через Vite или Vue CLI, установка выглядит так:

```bash
npm install pinia
# или
yarn add pinia
```

Теперь подключаем Pinia в точке входа приложения, чаще всего в файле main.ts или main.js:

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)

// Создаем экземпляр Pinia
const pinia = createPinia()

// Подключаем его как плагин к приложению Vue
app.use(pinia)

app.mount('#app')
```

Комментарии:

- Мы создаем экземпляр Pinia один раз на всё приложение.
- Через `app.use(pinia)` Pinia становится доступна во всех компонентах через `useXStore()`.

### Установка для Vue 2

Pinia можно использовать и с Vue 2, если подключить плагин совместимости:

```bash
npm install pinia @vue/composition-api
```

Подключаем в main.js:

```js
// main.js
import Vue from 'vue'
import App from './App.vue'
import { createPinia, PiniaVuePlugin } from 'pinia'
import VueCompositionAPI from '@vue/composition-api'

// Подключаем Composition API для Vue 2
Vue.use(VueCompositionAPI)

// Подключаем Pinia как плагин
Vue.use(PiniaVuePlugin)

const pinia = createPinia()

new Vue({
  // Передаем pinia в корневой экземпляр Vue 2
  pinia,
  render: (h) => h(App),
}).$mount('#app')
```

Pinia в таком режиме работает очень похоже на Vue 3, только с Vue 2-спецификой (через опции компонента или Composition API, если вы его используете).

## Создание первого стора в Pinia

В Pinia есть два основных стилевых подхода к созданию стора:

- Options Store — ближе к старому Vuex и Options API.  
- Setup Store — ближе к Composition API, более гибкий и предпочтительный для новых проектов.

Давайте посмотрим на оба варианта.

### Options Store: знакомый стиль

Создадим простой стор счётчика `useCounterStore` в файле `src/stores/counter.ts`:

```ts
// src/stores/counter.ts
import { defineStore } from 'pinia'

// Определяем стор через Options API-подобный синтаксис
export const useCounterStore = defineStore('counter', {
  // state - это функция, возвращающая объект состояния
  state: () => ({
    count: 0 as number,
    title: 'Счетчик' as string,
  }),

  // getters - это вычисляемые свойства на основе state
  getters: {
    // Простой геттер, возвращает удвоенное значение
    doubleCount(state) {
      // Используем state, переданный в геттер
      return state.count * 2
    },
    // Геттер, который зависит от других геттеров
    description(): string {
      // Здесь this типизирован как стор
      return `${this.title} - значение ${this.count}`
    },
  },

  // actions - методы, которые могут изменять состояние и выполнять логику
  actions: {
    increment() {
      // Меняем состояние напрямую
      this.count++
    },
    setCount(value: number) {
      // Явно задаем значение счетчика
      this.count = value
    },
    async incrementAsync() {
      // Пример асинхронного действия
      await new Promise((resolve) => setTimeout(resolve, 1000))
      this.count++
    },
  },
})
```

Обратите внимание:

- В `state` вы всегда возвращаете новый объект — это важно для SSR и изоляции состояний.
- В `getters` вы можете использовать как `state`, так и `this`, который ссылается на стор.
- В `actions` доступ к состоянию и геттерам идёт через `this`, как у обычного объекта.

Теперь давайте используем этот стор в компоненте.

```vue
<!-- CounterView.vue -->
<template>
  <div>
    <h2>{{ counter.title }}</h2>
    <p>Текущее значение - {{ counter.count }}</p>
    <p>Удвоенное значение - {{ counter.doubleCount }}</p>

    <button @click="counter.increment">
      Увеличить
    </button>

    <button @click="incrementLater">
      Увеличить через секунду
    </button>
  </div>
</template>

<script setup lang="ts">
// Подключаем стор
import { useCounterStore } from '@/stores/counter'

// Вызываем функцию стора, чтобы получить экземпляр
const counter = useCounterStore()

// Дополнительная логика компонента
const incrementLater = () => {
  // Вызываем асинхронное действие стора
  counter.incrementAsync()
}
</script>
```

Комментарии:

- `useCounterStore()` можно вызывать в любом компоненте, Pinia сама вернёт один и тот же экземпляр стора в пределах приложения.
- Состояние (`count`, `title`) и геттеры (`doubleCount`) доступны как свойства объекта `counter`.
- Действия (`increment`, `incrementAsync`) вызываются как методы.

### Setup Store: гибкий современный подход

Теперь вы увидите Setup Store, который ближе к Composition API и чувствуется как "обычная" функция с `ref` и `computed`.

Создадим тот же счётчик, но в Setup-стиле:

```ts
// src/stores/counterSetup.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// defineStore с функцией вместо объекта опций
export const useCounterSetupStore = defineStore('counterSetup', () => {
  // Создаем реактивные переменные
  const count = ref(0)
  const title = ref('Счетчик Setup Store')

  // Создаем вычисляемое значение
  const doubleCount = computed(() => count.value * 2)

  const description = computed(() => {
    return `${title.value} - значение ${count.value}`
  })

  // Создаем действия как обычные функции
  const increment = () => {
    count.value++
  }

  const setCount = (value: number) => {
    count.value = value
  }

  const incrementAsync = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    count.value++
  }

  // Возвращаем все, что хотим сделать публичным
  return {
    count,
    title,
    doubleCount,
    description,
    increment,
    setCount,
    incrementAsync,
  }
})
```

Здесь вы буквально пишете код так же, как в обычном Composition API:

- `ref` для состояния
- `computed` для геттеров
- функции для действий
- `return` — "публичный интерфейс" стора

Использование в компоненте аналогично:

```vue
<!-- CounterSetupView.vue -->
<template>
  <div>
    <h2>{{ store.title }}</h2>
    <p>Текущее значение - {{ store.count }}</p>
    <p>Удвоенное значение - {{ store.doubleCount }}</p>

    <button @click="store.increment">
      Увеличить
    </button>

    <button @click="store.incrementAsync">
      Увеличить через секунду
    </button>
  </div>
</template>

<script setup lang="ts">
import { useCounterSetupStore } from '@/stores/counterSetup'

// Получаем стор
const store = useCounterSetupStore()
</script>
```

Для новых проектов на Vue 3 Setup Store обычно предпочтителен, потому что:

- легче комбинировать с другими композиционными функциями;
- типизация получается естественной;
- код легче рефакторить и выносить в отдельные модули.

## Работа с состоянием, геттерами и действиями глубже

### Мутация состояния

В Pinia вы можете изменять состояние напрямую — это одно из ключевых отличий от Vuex.

Смотрите, как это выглядит:

```ts
const counter = useCounterStore()

// Прямое изменение свойства
counter.count++

// Установка значения
counter.count = 10
```

Для более сложных обновлений есть метод `$patch`, который позволяет "патчить" состояние объектом или функцией.

#### Патч через объект

```ts
counter.$patch({
  count: 100,
  title: 'Новый заголовок',
})
```

Здесь `Pinia` обновит только указанные свойства, похожим образом, как делает `Object.assign`.

#### Патч через функцию

```ts
counter.$patch((state) => {
  // Здесь мы можем выполнить несколько изменений за один "патч"
  state.count += 10
  state.title = `Обновлено в ${new Date().toLocaleTimeString()}`
})
```

Такой подход полезен, когда вы хотите явно группировать изменения в одно логическое действие для Devtools.

### Геттеры как вычисляемые свойства

Геттеры в Options Store по сути являются обёрткой над `computed`. Важный момент: геттеры кэшируются и пересчитываются только при изменении зависимостей.

Пример практического геттера:

```ts
export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: [
      // Массив задач
      // { id: 1, text: '...', done: false }
    ] as { id: number; text: string; done: boolean }[],
  }),
  getters: {
    // Возвращает только завершенные задачи
    doneTodos(state) {
      return state.todos.filter((todo) => todo.done)
    },
    // Возвращает количество незавершенных задач
    pendingCount(state): number {
      return state.todos.filter((todo) => !todo.done).length
    },
  },
})
```

В компоненте:

```vue
<script setup lang="ts">
import { useTodoStore } from '@/stores/todo'

const todoStore = useTodoStore()

// todos - массив всех задач
// doneTodos - только завершенные
// pendingCount - число незавершенных
</script>
```

Pinia автоматически отслеживает зависимости. Если вы не меняете `todos`, геттеры не будут пересчитываться.

### Действия: синхронные и асинхронные

Действия — обычные методы, которые:

- могут быть асинхронными;
- имеют доступ к состоянию и геттерам через `this` (Options Store) или замыкание (Setup Store);
- могут вызывать другие действия.

Пример стора с запросом на сервер:

```ts
// src/stores/user.ts
import { defineStore } from 'pinia'

interface User {
  id: number
  name: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as User[],
    loading: false as boolean,
    error: null as string | null,
  }),
  actions: {
    async fetchUsers() {
      // Устанавливаем флаг загрузки
      this.loading = true
      this.error = null

      try {
        // Пример запроса к API
        const response = await fetch('/api/users')
        if (!response.ok) {
          // Обрабатываем HTTP-ошибку
          throw new Error(`Ошибка загрузки - ${response.status}`)
        }
        const data: User[] = await response.json()
        // Сохраняем данные в состояние
        this.users = data
      } catch (err: any) {
        // Сохраняем текст ошибки
        this.error = err.message || 'Неизвестная ошибка'
      } finally {
        // Снимаем флаг загрузки в любом случае
        this.loading = false
      }
    },
  },
})
```

В компоненте:

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

// Получаем стор
const userStore = useUserStore()

// Загружаем данные при монтировании компонента
onMounted(() => {
  userStore.fetchUsers()
})
</script>
```

Как видите, работа с асинхронностью не отличается от обычного кода на JavaScript.

## Использование Pinia в компонентах

### Вариант с Composition API (рекомендуется)

Вы уже видели его выше, но давайте разберём подробнее часто используемые варианты.

#### Прямое использование стора

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useTodoStore } from '@/stores/todo'

const todoStore = useTodoStore()

// Создаем локальное вычисляемое значение на основе стора
const hasTodos = computed(() => todoStore.todos.length > 0)
</script>
```

Комментарии:

- `todoStore` — это реактивный объект. Вы можете использовать его свойства напрямую в шаблоне.
- Дополнительные вычисления можно делать в компоненте через `computed`.

#### Использование mapHelpers (для Options API)

Если вы используете Options API, вам подойдут вспомогательные функции: `mapStores`, `mapState`, `mapGetters`, `mapActions`.

Пример:

```ts
// MyComponent.vue - Options API
<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores, mapState, mapActions } from 'pinia'
import { useTodoStore } from '@/stores/todo'

export default defineComponent({
  name: 'MyComponent',
  computed: {
    // Привязываем инстанс стора к this.todoStore
    ...mapStores(useTodoStore),
    // Привязываем отдельные поля состояния и геттеры
    ...mapState(useTodoStore, ['todos', 'doneTodos', 'pendingCount']),
  },
  methods: {
    // Привязываем действия
    ...mapActions(useTodoStore, ['addTodo', 'toggleTodo']),
  },
})
</script>
```

Комментарии:

- `mapStores` создаёт свойство `todoStore`, которое ссылается на стор.
- `mapState` и `mapActions` позволяют сократить обращения к `this.todoStore`.

В новых проектах рекомендуется Composition API, поэтому дальше будем опираться именно на него.

## Организация стора по модулям

Pinia не требует явной декларации "модулей" в одном большом файле. Вы просто создаете несколько сторашек в разных файлах и используете их там, где нужно.

Пример структуры:

```
src/
  stores/
    user.ts
    todo.ts
    settings.ts
    cart/
      cart.ts
      coupon.ts
```

Каждый файл экспортирует свою функцию `useXStore`. Это уже и есть модульное разделение.

### Взаимодействие стор–стор

Иногда один стор должен использовать данные из другого. В Pinia это делается очень просто — вы просто импортируете функцию стора и вызываете её внутри другого стора.

```ts
// src/stores/cart.ts
import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as { id: number; title: string; price: number }[],
  }),
  getters: {
    totalPrice(state) {
      return state.items.reduce((sum, item) => sum + item.price, 0)
    },
  },
  actions: {
    checkout() {
      // Получаем доступ к другому стору
      const userStore = useUserStore()

      if (!userStore.currentUser) {
        throw new Error('Пользователь не авторизован')
      }

      // Здесь могла бы быть логика оформления заказа
      // Например, отправка запроса на сервер

      // Очищаем корзину после оформления
      this.items = []
    },
  },
})
```

Здесь важно:

- Вызов `useUserStore()` внутри действия безопасен — Pinia возвращает уже существующий стор.
- Так вы избегаете жёсткого связывания — сторы остаются независимыми модулями, которые лишь знают о "публичном интерфейсе" друг друга.

## Pinia и TypeScript

Pinia спроектирована так, чтобы поддержка TypeScript была естественной. В большинстве случаев типы выводятся автоматически, и вам не нужно писать много дополнительных аннотаций.

### Типизация Options Store

В `state` достаточно указать типы полей:

```ts
interface Todo {
  id: number
  text: string
  done: boolean
}

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: [] as Todo[],
    filter: 'all' as 'all' | 'done' | 'pending',
  }),
  getters: {
    filteredTodos(state): Todo[] {
      if (state.filter === 'done') {
        return state.todos.filter((t) => t.done)
      }
      if (state.filter === 'pending') {
        return state.todos.filter((t) => !t.done)
      }
      return state.todos
    },
  },
  actions: {
    addTodo(text: string) {
      this.todos.push({
        id: Date.now(),
        text,
        done: false,
      })
    },
  },
})
```

Дальше, при использовании стора:

```ts
const todoStore = useTodoStore()

// todoStore.todos имеет тип Todo[]
// todoStore.filter имеет тип 'all' | 'done' | 'pending'
// todoStore.addTodo ожидает строку
```

IDE подсказывает доступные поля, геттеры и типы аргументов у действий.

### Типизация Setup Store

В Setup Store типы выводятся из `ref` и `computed`:

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Product {
  id: number
  title: string
  price: number
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)

  const total = computed(() =>
    products.value.reduce((sum, p) => sum + p.price, 0)
  )

  const addProduct = (product: Product) => {
    products.value.push(product)
  }

  return {
    products,
    loading,
    total,
    addProduct,
  }
})
```

Здесь комментарии достаточно очевидны:

- `products` — `Ref<Product[]>`
- `total` — `ComputedRef<number>`
- `addProduct` — функция `(product: Product) => void`

В компонентах можно использовать это с полной типизацией.

### Вывод типов стора через typeof

Иногда нужно явно получить тип стора, например, для пропсов или тестов.

```ts
import { useProductStore } from '@/stores/product'

type ProductStore = ReturnType<typeof useProductStore>

// Теперь ProductStore - это тип экземпляра стора
```

Такой приём часто применяют для моков в тестах.

## Расширенные возможности Pinia

Теперь давайте перейдём к более продвинутым возможностям, которые полезны в реальных проектах.

### Подписки на изменение состояния

Pinia позволяет подписываться на изменения стора. Это удобно, если вы хотите, например, сохранять состояние в localStorage или логировать изменения.

#### Подписка на изменение состояния через $subscribe

```ts
import { useTodoStore } from '@/stores/todo'

const todoStore = useTodoStore()

// Подписка на любые изменения состояния
const unsubscribe = todoStore.$subscribe((mutation, state) => {
  // mutation - информация о том, что изменилось
  // state - текущее состояние стора

  // Например, сохраняем состояние в localStorage
  localStorage.setItem('todoState', JSON.stringify(state))
})

// Позже вы можете отписаться
// unsubscribe()
```

Комментарий:

- `mutation` содержит тип изменения (`'direct'`, `'patch object'`, `'patch function'`) и `storeId`.
- Подписки полезны для персистентности, но не рекомендуется использовать их для сложной бизнес-логики (для этого лучше действия).

### Подписки на действия

Можно подписаться на вызовы действий:

```ts
const unsubscribeAction = todoStore.$onAction(
  ({ name, store, args, after, onError }) => {
    // name - имя действия
    // args - аргументы, с которыми оно вызвано

    // Логируем вызов
    console.log(`Действие ${name} вызвано с аргументами`, args)

    // after вызывается после успешного завершения действия
    after((result) => {
      console.log(`Действие ${name} завершилось`, result)
    })

    // onError вызывается при исключении
    onError((error) => {
      console.error(`Ошибка в действии ${name}`, error)
    })
  }
)
```

Это удобно для глобального логирования или "аналітики" действий, не вмешиваясь в сами сторы.

### Сохранение состояния (персистентность)

У Pinia нет встроенной персистентности, но вы можете легко реализовать её сами или использовать сторонний плагин.

Давайте посмотрим минимальный "ручной" пример для одного стора.

```ts
// src/stores/settings.ts
import { defineStore } from 'pinia'

interface SettingsState {
  theme: 'light' | 'dark'
  language: 'ru' | 'en'
}

const STORAGE_KEY = 'app_settings'

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    theme: 'light',
    language: 'ru',
  }),
  actions: {
    loadFromStorage() {
      // Пытаемся прочитать сохраненные настройки
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      try {
        const data = JSON.parse(raw) as Partial<SettingsState>
        // Акуратно патчим состояние, не удаляя отсутствующие поля
        this.$patch(data)
      } catch {
        // В случае ошибки парсинга просто игнорируем
      }
    },
    saveToStorage() {
      // Сохраняем текущее состояние в localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
    },
    setTheme(theme: SettingsState['theme']) {
      this.theme = theme
      // Сохраняем изменения
      this.saveToStorage()
    },
    setLanguage(lang: SettingsState['language']) {
      this.language = lang
      this.saveToStorage()
    },
  },
})
```

В корневом компоненте:

```ts
// App.vue <script setup>
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

onMounted(() => {
  // Восстанавливаем настройки при запуске приложения
  settingsStore.loadFromStorage()
})
```

Здесь вы видите:

- минимум "магии" — всего лишь сохранение и загрузка JSON;
- `$state` — полное состояние стора, которое удобно сериализовать.

### Плагины Pinia

Pinia поддерживает плагины, которые позволяют расширять функциональность всех сторашек сразу.

Например, вы можете добавить "метаданные" к каждому стору или автоматически включать персистентность.

Подключение плагина:

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia, PiniaPluginContext } from 'pinia'
import App from './App.vue'

const pinia = createPinia()

// Пример простого плагина
function myPiniaPlugin(context: PiniaPluginContext) {
  // context.pinia - экземпляр Pinia
  // context.app - экземпляр приложения
  // context.store - конкретный стор
  // context.options - опции defineStore

  // Добавим каждому стору метод logState
  context.store.logState = () => {
    // Выводим состояние стора в консоль
    console.log(context.store.$id, JSON.stringify(context.store.$state))
  }
}

pinia.use(myPiniaPlugin)

const app = createApp(App)
app.use(pinia)
app.mount('#app')
```

Теперь любой стор получит новый метод:

```ts
const todoStore = useTodoStore()
todoStore.logState()
// В консоли увидите идентификатор стора и его состояние
```

В реальных проектах плагины чаще используют для:

- глобальной персистентности;
- интеграции с трекинговыми системами;
- добавления общих методов (например, `reset()`).

### SSR и Pinia (кратко)

Pinia хорошо работает с SSR (Nuxt 3, Vite SSR и т.п.), но важная идея здесь одна: **state в store всегда должен быть функцией**, чтобы при рендеринге на сервере у каждого запроса был свой экземпляр состояния.

Мы уже делали так во всех примерах:

```ts
state: () => ({
  // ...
})
```

В более сложных SSR-настройках используются методы `pinia.state.value` для гидратации и сериализации состояния между сервером и клиентом, но базовый принцип — не делиться одним объектом состояния между запросами — вы уже соблюдаете.

## Заключение

Pinia предлагает простой и при этом мощный способ управлять состоянием во Vue-приложениях. Вместо сложной конфигурации вы получаете:

- сторы как обычные функции;
- прямой доступ к состоянию без мутаций;
- естественную интеграцию с Composition API;
- удобную типизацию с TypeScript;
- поддержку Devtools и SSR.

Вы увидели, как:

- подключить Pinia к проекту Vue 3 и Vue 2;
- создать стор в двух стилях (Options Store и Setup Store);
- работать с состоянием, геттерами и действиями;
- организовать хранилище по модулям и связывать сторы;
- использовать подписки, персистентность и плагины.

Этого набора знаний достаточно, чтобы использовать Pinia в большинстве типичных проектов. Дальше вы можете постепенно добавлять более продвинутые вещи — сложную типизацию, SSR-интеграцию, собственные плагины — когда в этом появится реальная необходимость.

## Частозадаваемые технические вопросы по Pinia

### 1. Как сбросить состояние стора к начальному значению

Pinia предоставляет метод `$reset`, но он работает только для Options Store (где `state` — объект опций). Пример:

```ts
const counter = useCounterStore()

// Изменяем состояние
counter.count = 42

// Сбрасываем к начальному состоянию
counter.$reset()
```

В Setup Store `$reset` недоступен из коробки. Здесь вы можете реализовать сброс вручную:

```ts
export const useCounterSetupStore = defineStore('counterSetup', () => {
  const count = ref(0)

  const reset = () => {
    count.value = 0
  }

  return { count, reset }
})
```

Вы вызываете `store.reset()` там, где нужно.

### 2. Как использовать один и тот же стор с разными "экземплярами" данных

Иногда нужно "переиспользуемый" стор для разных сущностей (например, список товаров для разных категорий). Pinia по умолчанию создаёт один экземпляр стора на приложение. Для множественных экземпляров используют обычные композиционные функции, а не Pinia. То есть вы выносите логику в `useList`, `useEntityStore` и т.п., а Pinia оставляете для действительно глобального состояния.

### 3. Как правильно мокать сторы Pinia в тестах

В тестах удобно использовать `setActivePinia(createPinia())` из `pinia` и работать с реальными сторами, либо подменять методы вручную:

```ts
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

beforeEach(() => {
  setActivePinia(createPinia())
})

test('fetchUsers загружает данные', async () => {
  const userStore = useUserStore()
  // Мокаем метод fetch
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ id: 1, name: 'Test' }],
  } as any)

  await userStore.fetchUsers()
  expect(userStore.users).toHaveLength(1)
})
```

### 4. Как типизировать this в actions у Options Store

Если вы используете TypeScript и Options Store, `this` внутри `actions` типизируется автоматически на основе стора. Важно не использовать стрелочные функции внутри `actions`, иначе `this` потеряется. То есть:

```ts
actions: {
  // Правильно
  addTodo(text: string) {
    this.todos.push({ id: Date.now(), text, done: false })
  },
  // Неправильно - this будет undefined
  // addTodo: (text: string) => { ... }
}
```

### 5. Как хранить в сторе большие объекты вроде Map или Set

Pinia использует реактивность Vue, которая лучше всего работает с plain-объектами и массивами. `Map` и `Set` можно использовать, но Devtools и сериализация могут работать хуже. Для совместимости чаще всего такие структуры превращают в массивы или объекты:

- для `Map` — массив пар или объект с ключами;
- для `Set` — массив значений.

Например, в состоянии вы храните массив, а вокруг него строите удобные геттеры и действия, которые ведут себя как `Map` или `Set`. Это упрощает отладку и сохранение состояния.