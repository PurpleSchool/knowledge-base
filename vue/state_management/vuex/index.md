---
metaTitle: Vuex для Vue пошаговое руководство по управлению состоянием приложения
metaDescription: Разбираем Vuex для Vue - принципы глобального состояния сторы мутации действия геттеры модули и лучшие практики использования в реальных проектах
author: Олег Марков
title: Vuex - полное руководство по управлению состоянием во Vue приложениях
preview: Узнайте как с помощью Vuex управлять состоянием Vue приложения - от базовой настройки стора до модульной архитектуры паттернов организации кода и интеграции с Vue Devtools
---

## Введение

Vuex — это официальная библиотека для управления состоянием в приложениях на Vue 2 и Vue 3 (через совместимый пакет). Она помогает организовать данные так, чтобы разные компоненты могли предсказуемо их читать и изменять.

Смотрите, идея простая. Когда у вас один‑два компонента, вы спокойно передаёте данные через props и генерируете события вверх. Но как только приложение растёт, состояние начинает "расползаться" по разным частям, появляются дублирования и трудно отследить, кто и когда изменяет данные. Vuex решает именно эту проблему.

Ключевая мысль: Vuex вводит единый центр хранения данных — стор (store) — и строгие правила, как это состояние можно обновлять. Это делает поведение приложения более предсказуемым, а отладку — проще.

В этой статье вы увидите:

- как устроен стор Vuex;
- что такое state, getters, mutations, actions;
- как подключать Vuex к Vue приложению;
- как работать с модулями;
- как организовывать код в реальных проектах.

Я буду показывать код с комментариями, чтобы вы могли шаг за шагом проследить, как всё работает.

---

## Основные концепции Vuex

### Одно хранилище для всего приложения

Vuex предлагает использовать один общий стор для всего приложения. Это не означает, что весь код будет в одном файле — наоборот, мы можем разбивать стор на модули. Но с точки зрения архитектуры состояние централизовано.

Схематично взаимодействие выглядит так:

- Компонент не меняет состояние напрямую.
- Компонент вызывает action (действие).
- Action, при необходимости, выполняет асинхронный код.
- Action вызывает mutation (мутацию).
- Мутация синхронно изменяет state.
- Компоненты "подписаны" на state и автоматически обновляются.

Такой однонаправленный поток данных сильно упрощает понимание, что и где происходит.

### Из чего состоит стор Vuex

Стор Vuex — это объект со следующими основными частями:

- state — данные;
- getters — вычисляемые свойства над state;
- mutations — синхронные изменения state;
- actions — бизнес‑логика и асинхронный код;
- modules — разбиение стора на части.

Давайте разберём каждую часть по отдельности.

---

## State — централизованное состояние

### Что такое state

State — это источник истинного состояния вашего приложения. Можно думать о нём как об одном большом объекте, содержащем все важные данные, которыми должны делиться компоненты.

Пример простого стора:

```js
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex) // Подключаем плагин Vuex к Vue 2

export default new Vuex.Store({
  // Здесь мы описываем глобальное состояние приложения
  state: {
    // Счётчик
    count: 0,
    // Пользователь
    user: {
      id: null,
      name: null,
      isAdmin: false
    },
    // Список задач
    todos: [] // Изначально список пустой
  }
})
```

State — это "источник правды". Компоненты не должны хранить свои копии этих данных, если они уже есть в сторе. Вместо этого они берут данные напрямую из store.

### Как читать state в компонентах

Есть несколько способов получить доступ к state из компонента.

#### Через this.$store.state

Самый прямой путь:

```js
// Пример компонента Counter.vue
export default {
  computed: {
    // Здесь мы объявляем вычисляемое свойство count
    // Оно будет брать данные из Vuex стора
    count() {
      return this.$store.state.count
    }
  }
}
```

Этот способ работает, но в больших компонентах код начинает "засоряться". Поэтому Vuex предлагает хелперы.

#### Через mapState

Хелпер `mapState` позволяет подключать свойства state как локальные вычисляемые свойства.

```js
// Counter.vue
import { mapState } from 'vuex'

export default {
  computed: {
    // Здесь мы разворачиваем объект из mapState в локальные computed
    ...mapState({
      // Левое имя - имя локального computed
      // Правое выражение - путь к данным в state
      count: state => state.count,
      userName: state => state.user.name
    })
  }
}
```

Можно использовать более короткую запись, если имя совпадает:

```js
import { mapState } from 'vuex'

export default {
  computed: {
    // В этом случае Vuex будет искать state.count и state.todos
    ...mapState(['count', 'todos'])
  }
}
```

Такой подход делает связи с состоянием явными и удобочитаемыми.

---

## Getters — вычисляемые представления данных

### Зачем нужны getters

В компонентах часто нужны не "сырые" данные, а их производные:

- отфильтрованный список;
- количество элементов по какому‑то условию;
- комбинированные данные из разных частей state.

Конечно, вы можете считать это прямо в компонентах, но тогда логика будет дублироваться. Getters решают это: они похожи на computed‑свойства для store.

### Пример использования getters

```js
// store/index.js
export default new Vuex.Store({
  state: {
    todos: [
      { id: 1, text: 'Купить молоко', done: false },
      { id: 2, text: 'Написать статью', done: true }
    ]
  },
  getters: {
    // Возвращаем только выполненные задачи
    doneTodos(state) {
      // Здесь мы фильтруем массив по полю done
      return state.todos.filter(todo => todo.done)
    },
    // Возвращаем количество выполненных задач
    doneTodosCount(state, getters) {
      // Мы можем использовать другие геттеры внутри геттера
      return getters.doneTodos.length
    },
    // Геттер, который возвращает функцию - для параметров
    getTodoById: (state) => (id) => {
      // Здесь мы ищем задачу по идентификатору
      return state.todos.find(todo => todo.id === id)
    }
  }
})
```

Getters кэшируются так же, как computed. Пока зависимое состояние не меняется, геттер не будет пересчитываться.

### Как использовать getters в компонентах

Точно так же, как state, через this.$store или `mapGetters`.

```js
import { mapGetters } from 'vuex'

export default {
  computed: {
    // Подключаем геттеры в качестве computed-свойств компонента
    ...mapGetters(['doneTodos', 'doneTodosCount']),

    // Можем переименовывать локальные имена
    ...mapGetters({
      completed: 'doneTodos'
    })
  },
  methods: {
    showTodo(id) {
      // Когда геттер возвращает функцию, мы вызываем его как обычную функцию
      const todo = this.$store.getters.getTodoById(id)
      console.log(todo)
    }
  }
}
```

Getters помогают вынести повторяющуюся логику выборки и обработки данных из компонентов в одно место.

---

## Mutations — единственный способ изменить state

### Основной принцип

Очень важное правило Vuex:

- НЕЛЬЗЯ изменять `state` напрямую из компонента.
- МОЖНО изменять `state` только через `mutations`.

Почему так? Мутации:

- всегда синхронные;
- всегда явные;
- легко отслеживаются в Vue Devtools.

Это позволяет понять, какие именно изменения были сделаны и в какой последовательности.

### Пример мутаций

```js
export default new Vuex.Store({
  state: {
    count: 0,
    todos: []
  },
  mutations: {
    // Простая мутация - увеличение счётчика
    increment(state) {
      // Здесь мы напрямую изменяем state
      state.count++
    },
    // Мутация с полезной нагрузкой (payload)
    setCount(state, newCount) {
      // Мы явно задаём новое значение счётчика
      state.count = newCount
    },
    // Мутация с объектом payload
    addTodo(state, payload) {
      // Ожидаем, что payload - это объект задачи
      state.todos.push(payload)
    }
  }
})
```

Обратите внимание: мутации всегда получают `state` первым аргументом, а вторым — полезную нагрузку (payload), если она нужна.

### Как вызывать mutations из компонентов

Мутации вызываются через метод `commit`:

```js
export default {
  methods: {
    increment() {
      // Вызываем мутацию increment
      this.$store.commit('increment')
    },
    setSpecificCount() {
      // Передаём конкретное значение счётчика
      this.$store.commit('setCount', 10)
    },
    addNewTodo() {
      // Передаём объект задачи
      this.$store.commit('addTodo', {
        id: Date.now(),
        text: 'Новая задача',
        done: false
      })
    }
  }
}
```

Для удобства есть хелпер `mapMutations`:

```js
import { mapMutations } from 'vuex'

export default {
  methods: {
    // Здесь мы подключаем мутации как методы компонента
    ...mapMutations(['increment', 'addTodo']),

    // Можно переименовать локальный метод
    ...mapMutations({
      set: 'setCount'
    })
  }
}
```

Смотрите, я показываю простой пример: теперь вы можете в шаблоне писать `@click="increment"` и быть уверенными, что это приведёт к предсказуемому изменению state.

---

## Actions — бизнес‑логика и асинхронность

### Зачем нужны actions

Если мутации должны быть синхронными, то как быть с асинхронными операциями, например HTTP‑запросами? Для этого нужны actions.

Actions:

- могут выполнять асинхронный код;
- могут вызывать несколько мутаций;
- могут вызывать другие actions;
- инкапсулируют бизнес‑логику.

Важно: actions не изменяют state напрямую. Они вызывают мутации через `commit`.

### Пример actions

```js
// store/index.js
export default new Vuex.Store({
  state: {
    todos: [],
    isLoading: false,
    error: null
  },
  mutations: {
    setLoading(state, value) {
      // Устанавливаем флаг загрузки
      state.isLoading = value
    },
    setError(state, error) {
      // Сохраняем текст ошибки
      state.error = error
    },
    setTodos(state, todos) {
      // Заменяем список задач новыми данными
      state.todos = todos
    }
  },
  actions: {
    // Асинхронное действие для загрузки задач
    async fetchTodos({ commit }) {
      // Перед началом запроса включаем индикатор загрузки
      commit('setLoading', true)
      commit('setError', null)

      try {
        // Здесь мы выполняем асинхронный HTTP-запрос
        const response = await fetch('/api/todos')
        // Проверяем успешность ответа
        if (!response.ok) {
          throw new Error('Ошибка при загрузке задач')
        }
        const data = await response.json()
        // Сохраняем полученные задачи в state
        commit('setTodos', data)
      } catch (error) {
        // В случае ошибки записываем её текст
        commit('setError', error.message)
      } finally {
        // В любом случае отключаем индикатор загрузки
        commit('setLoading', false)
      }
    }
  }
})
```

В этом примере вы видите типичный паттерн: action управляет процессом, а мутации изменяют состояние шаг за шагом.

### Как вызывать actions из компонентов

Actions вызываются через `dispatch`:

```js
export default {
  methods: {
    loadTodos() {
      // Запускаем асинхронное действие
      this.$store.dispatch('fetchTodos')
    }
  },
  mounted() {
    // Например, загружаем данные при монтировании компонента
    this.loadTodos()
  }
}
```

Конечно, есть и хелпер `mapActions`:

```js
import { mapActions } from 'vuex'

export default {
  methods: {
    // Подключаем действия как методы компонента
    ...mapActions(['fetchTodos']),

    // Переименование
    ...mapActions({
      loadTodos: 'fetchTodos'
    })
  }
}
```

Actions — правильное место для:

- HTTP‑запросов;
- вызова нескольких мутаций подряд;
- выполнения сложной логики, зависящей от внешних данных.

---

## Подключение Vuex к приложению Vue

### Пример для Vue 2

Для Vue 2 процесс достаточно прямой.

```js
// main.js
import Vue from 'vue'
import App from './App.vue'
import store from './store' // Импортируем стор

new Vue({
  store, // Подключаем стор ко всему приложению
  render: h => h(App) // Рендерим корневой компонент
}).$mount('#app')
```

После этого во всех компонентах будет доступен `this.$store`.

### Пример для Vue 3

Vue 3 использует немного другой синтаксис, но сама идея та же.

```js
// store/index.js
import { createStore } from 'vuex'

// Создаём стор с помощью функции createStore
export const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      // Увеличиваем счётчик
      state.count++
    }
  }
})
```

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import { store } from './store' // Импортируем созданный стор

const app = createApp(App)

// Подключаем Vuex стор к приложению
app.use(store)

// Монтируем приложение в DOM
app.mount('#app')
```

Теперь во всех компонентах Vue 3 также будет доступен `this.$store` (в опциональном API) или `useStore` (в Composition API).

---

## Vuex и Composition API

### Доступ к стору через useStore

В приложениях на Vue 3 с Composition API удобнее использовать хук `useStore`.

```js
// Counter.vue
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  setup() {
    // Получаем экземпляр стора
    const store = useStore()

    // Создаём вычисляемое свойство, связанное со state.count
    const count = computed(() => store.state.count)

    // Создаём метод для увеличения счётчика через мутацию
    const increment = () => {
      store.commit('increment')
    }

    // Возвращаем свойства и методы в шаблон
    return {
      count,
      increment
    }
  }
}
```

Здесь вы видите, что логика становится чуть более "функциональной": мы явно берём store, создаём обёртки поверх state и mutations и возвращаем их.

---

## Модули Vuex — структурирование большого стора

### Зачем нужны модули

В реальном приложении один файл со всем state быстро становится громоздким. Чтобы избежать "гигантского" стора, Vuex поддерживает модули.

Модуль — это мини‑стор со своим state, mutations, actions и getters. Все модули соединяются в один общий стор.

### Пример организации модулей

Допустим, у нас есть две области данных:

- аутентификация пользователя;
- список задач.

Смотрите, я покажу вам, как это разбить на модули.

```js
// store/modules/auth.js
export const auth = {
  // Пространство имён по умолчанию выключено, рассмотрим его позже
  state: () => ({
    user: null,
    token: null
  }),
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    setToken(state, token) {
      state.token = token
    },
    logout(state) {
      state.user = null
      state.token = null
    }
  },
  actions: {
    async login({ commit }, credentials) {
      // Здесь должен быть реальный HTTP-запрос к API авторизации
      // Для примера используем фейковые данные
      const fakeUser = { id: 1, name: 'Test User' }
      const fakeToken = 'abc123'

      // Сохраняем данные пользователя и токен
      commit('setUser', fakeUser)
      commit('setToken', fakeToken)
    }
  },
  getters: {
    isAuthenticated(state) {
      // Пользователь считается авторизованным, если есть токен
      return !!state.token
    }
  }
}
```

```js
// store/modules/todos.js
export const todos = {
  state: () => ({
    items: []
  }),
  mutations: {
    setTodos(state, todos) {
      state.items = todos
    },
    addTodo(state, todo) {
      state.items.push(todo)
    }
  },
  actions: {
    async fetchTodos({ commit }) {
      // Здесь должен быть реальный HTTP-запрос
      const fakeTodos = [
        { id: 1, text: 'Пример задачи', done: false }
      ]
      // Сохраняем фейковые данные в state
      commit('setTodos', fakeTodos)
    }
  },
  getters: {
    completedTodos(state) {
      // Возвращаем только выполненные задачи
      return state.items.filter(t => t.done)
    }
  }
}
```

Теперь подключим модули к общему стору.

```js
// store/index.js
import { createStore } from 'vuex'
import { auth } from './modules/auth'
import { todos } from './modules/todos'

// Создаём главный стор и регистрируем модули
export const store = createStore({
  modules: {
    auth,  // Модуль авторизации
    todos  // Модуль задач
  }
})
```

### Доступ к модульному state и геттерам

Теперь state и getters разделены по модулям:

```js
// Пример доступа в компоненте
export default {
  computed: {
    // Доступ к модульному state
    user() {
      return this.$store.state.auth.user
    },
    todos() {
      return this.$store.state.todos.items
    },
    // Доступ к модульному геттеру
    isAuthenticated() {
      return this.$store.getters.isAuthenticated
    }
  }
}
```

А вот с actions и mutations есть нюанс: имена по умолчанию попадают в глобальное пространство имён. Повторяющиеся названия будут конфликтовать. Для решения этого Vuex предлагает namespaced‑модули.

---

## Модули с пространством имён (namespaced)

### Зачем нужно namespaced

Если вы используете много модулей, названия мутаций и действий легко могут пересекаться: `setLoading`, `setError`, `fetchData` и так далее. Чтобы избежать конфликтов и сделать код более читаемым, можно включить `namespaced: true`.

```js
// store/modules/auth.js
export const auth = {
  namespaced: true, // Включаем пространство имён для модуля
  state: () => ({
    user: null,
    token: null
  }),
  mutations: {
    setUser(state, user) {
      state.user = user
    }
  },
  actions: {
    async login({ commit }, credentials) {
      // Здесь могла бы быть реальная авторизация
      const fakeUser = { id: 1, name: 'Auth User' }
      commit('setUser', fakeUser)
    }
  },
  getters: {
    isAuthenticated(state) {
      return !!state.token
    }
  }
}
```

Теперь имена "полных" действий и мутаций будут выглядеть как `auth/login`, `auth/setUser`.

### Вызов действий и мутаций у namespaced модулей

```js
export default {
  methods: {
    // Вызов namespaced-действия
    login() {
      // Вызываем действие login из модуля auth
      this.$store.dispatch('auth/login', { email: 'a@b.c', password: '123' })
    }
  },
  computed: {
    isAuthenticated() {
      // Доступ к геттеру auth/isAuthenticated
      return this.$store.getters['auth/isAuthenticated']
    }
  }
}
```

### mapActions и mapGetters с пространствами имён

Хелперы поддерживают указание имени модуля.

```js
import { mapActions, mapGetters } from 'vuex'

export default {
  computed: {
    // Подключаем геттеры из модуля auth
    ...mapGetters('auth', ['isAuthenticated'])
  },
  methods: {
    // Подключаем действия из модуля auth
    ...mapActions('auth', ['login'])
  }
}
```

Здесь я показываю удобный приём: модульное имя передаётся первым аргументом, а дальше — список геттеров или действий.

---

## Паттерны и лучшие практики при работе с Vuex

### Когда стоит использовать Vuex

Vuex хорошо подходит, когда:

- у вас среднее или большое приложение;
- одни и те же данные нужны в разных, не связанных напрямую компонентах;
- важна прозрачная отладка и предсказуемость;
- вы хотите явно отделить бизнес‑логику от компонентов.

Не всегда нужно начинать с Vuex в самом начале. Но как только вы замечаете:

- что много данных приходится "проталкивать" через цепочку компонентов;
- что появляются "глобальные" события;
- что становится трудно понять, кто и когда изменяет данные,

— имеет смысл вынести общее состояние в Vuex.

### Организация файловой структуры

Хорошей практикой является разделение по доменам:

- `store/modules/auth.js`
- `store/modules/todos.js`
- `store/modules/profile.js`
- и так далее.

В каждом модуле удобно группировать:

- state вверху;
- затем getters;
- затем mutations;
- затем actions.

Это помогает быстро ориентироваться в коде.

### Где держать бизнес‑логику

Основной принцип: бизнес‑логика должна быть в actions, а не в компонентах.

Компонент:

- отвечает за отображение;
- вызывает actions и отображает результат.

Actions:

- описывают, что нужно сделать с данными;
- выполняют запросы к API;
- вызывают нужные мутации.

Такой подход делает компоненты более простыми, а логику — переиспользуемой.

### Избегайте избыточного использования Vuex

Не нужно класть в Vuex всё подряд. Держите там только то, что:

- важно для нескольких частей приложения;
- должно переживать переходы между страницами (пока страницы в рамках одного SPA);
- нужно сохранять в истории (например, для "time travel" через Devtools).

Локальное состояние конкретного компонента (состояние модального окна, значение одного локального инпута и так далее) вполне можно хранить в самом компоненте.

---

## Типичные ошибки при работе с Vuex

### 1. Изменение state напрямую

Проблема: изменение state не через мутации.

```js
// Плохо - меняем state напрямую из компонента
this.$store.state.count++
```

Это ломает концепцию Vuex и делает отладку сложнее. Делать нужно только так:

```js
// Хорошо - изменение происходит через мутацию
this.$store.commit('increment')
```

### 2. Асинхронный код внутри мутаций

Мутации должны быть синхронными. Вставка асинхронного кода приводит к непредсказуемому порядку изменений.

```js
// Плохо
mutations: {
  async incrementLater(state) {
    // Асинхронный код внутри мутации - плохая идея
    await new Promise(resolve => setTimeout(resolve, 1000))
    state.count++
  }
}
```

Нужно выносить асинхронность в actions:

```js
actions: {
  async incrementLater({ commit }) {
    // Ждём одну секунду
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Теперь вызываем синхронную мутацию
    commit('increment')
  }
}
```

### 3. Смешивание логики во всех слоях

Иногда в приложениях можно встретить:

- часть логики в компонентах;
- часть — в actions;
- часть — в мутациях.

Старайтесь придерживаться разделения:

- мутации — только изменение state;
- actions — бизнес‑логика и асинхронность;
- компоненты — только связка "показать данные" и "отреагировать на пользовательский ввод".

---

## Заключение

Vuex вводит жёсткие, но понятные правила обращения с состоянием:

- одно централизованное хранилище;
- только мутации могут изменять state;
- actions управляют асинхронным кодом и бизнес‑логикой;
- getters предоставляют "представления" данных;
- модули помогают структурировать большой стор.

Такой подход особенно полезен, когда приложение растёт, команда увеличивается, а отладка и предсказуемость становятся критически важными. С помощью Vuex вы можете держать состояние под контролем, а компоненты — сделать более простыми и понятными.

---

## Частозадаваемые технические вопросы по Vuex

### Как типизировать Vuex стор в TypeScript

Создайте интерфейсы для state и используйте их при создании стора.

```ts
// Описываем тип состояния
interface RootState {
  count: number
}

// Передаём тип в createStore
export const store = createStore<RootState>({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++
    }
  }
})
```

В компонентах с Composition API используйте дженерик:

```ts
import { useStore } from 'vuex'

const store = useStore<RootState>()
```

Так вы получите типизированный доступ к state и геттерам.

### Как сделать переиспользуемый модуль Vuex с динамическими именами

Используйте функцию‑фабрику и динамическую регистрацию модулей:

```js
// Фабрика модуля
function createListModule() {
  return {
    namespaced: true,
    state: () => ({ items: [] }),
    mutations: {
      setItems(state, items) {
        state.items = items
      }
    }
  }
}

// Динамическая регистрация
store.registerModule('products', createListModule())
store.registerModule('users', createListModule())
```

Теперь у вас два независимых модуля с одинаковой логикой.

### Как сбросить состояние стора к начальному

Храните начальное состояние в функции и используйте мутацию для полного сброса.

```js
const getDefaultState = () => ({
  count: 0,
  todos: []
})

const state = getDefaultState()

const mutations = {
  resetState(state) {
    Object.assign(state, getDefaultState())
  }
}
```

Вызовите `commit('resetState')`, чтобы вернуть state в исходное состояние.

### Как использовать Vuex в модульных тестах

Создавайте "тестовый" стор с нужной частью логики и подключайте его к компоненту.

```js
import { createStore } from 'vuex'
import { shallowMount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

const store = createStore({
  state: { count: 0 },
  mutations: {
    increment(state) {
      state.count++
    }
  }
})

const wrapper = shallowMount(MyComponent, {
  global: {
    plugins: [store] // Подключаем стор для теста
  }
})
```

Так вы изолируете тест и сможете проверять взаимодейcтвие компонента со стором.

### Как разделять Vuex код между несколькими проектами

Вынесите общие модули Vuex в отдельный npm‑пакет:

1. Создайте отдельный репозиторий с модулями.
2. Экспортируйте модули как функции‑фабрики (чтобы не было конфликтов state).
3. Публикуйте пакет в приватный или публичный npm.
4. Подключайте модули в проектах через `import` и `modules`.

Это помогает переиспользовать общую бизнес‑логику в нескольких приложениях.