---
metaTitle: Плагины Vue vue-plugins - создание подключение и лучшие практики
metaDescription: Разберитесь как работают плагины Vue vue-plugins - создайте собственный плагин научитесь его правильно подключать и организовывать общий код приложения
author: Олег Марков
title: Плагины Vue vue-plugins - полное практическое руководство
preview: Исследуйте плагины Vue vue-plugins - вы узнаете как писать собственные плагины подключать их к приложению и структурировать общий функционал в проектах на Vue
---

## Введение

Плагины Vue помогают вынести повторяющийся функционал из компонентов и сделать код более гибким и организованным. Вы можете один раз описать логику в плагине, а затем использовать ее во всем приложении через методы, свойства, директивы или компоненты.

Здесь вы разберете:

- что такое плагин Vue и какие задачи он решает;
- как устроен интерфейс установки плагина;
- чем отличаются плагины во Vue 2 и Vue 3;
- как писать свои плагины с нуля;
- как использовать vue-plugins из экосистемы и подключать сторонние решения;
- как тестировать плагины и избегать типичных ошибок.

Я буду опираться на современный Vue 3, но параллельно отмечать отличия для Vue 2, чтобы вы могли уверенно работать с обоими подходами.

---

## Что такое плагин Vue и когда он нужен

### Основная идея плагинов

Плагин Vue — это объект или функция, у которой есть метод install. Во время установки фреймворк вызывает этот метод и передает внутрь экземпляр приложения и дополнительные опции.

Концептуально плагин нужен для того, чтобы:

- расширить глобальное поведение приложения;
- предоставить общий функционал для множества компонентов;
- инкапсулировать интеграцию со сторонними библиотеками.

Типичные задачи для плагина:

- глобальные методы (например, $notify, $api);
- регистрация наборов компонентов (UI-библиотека);
- регистрация директив (v-mask, v-tooltip);
- создание и подключение глобального хранилища или клиента API;
- настройка логирования, метрик, трекинга.

Если вы видите, что код копируется из компонента в компонент и при этом логика явно относится к "инфраструктуре" приложения, а не к конкретному экрану, это хороший кандидат на вынос в плагин.

### Как Vue видит плагин

Во Vue 3 типичная сигнатура плагина выглядит так:

- плагин — это объект с методом install(app, options?),
- либо просто функция install(app, options?).

Vue 3:

- вы создаете приложение через createApp(App),
- затем вызываете app.use(plugin, options),
- Vue вызовет plugin.install(app, options) один раз для всего приложения.

Vue 2:

- вы вызываете Vue.use(plugin, options),
- Vue передаст в install конструктор Vue и опции,
- плагин регистрируется один раз для всех экземпляров Vue.

Давайте разберем все это детально на примерах.

---

## Базовая структура плагина во Vue 3

### Минимальный пример плагина

Смотрите, здесь я покажу вам самый простой плагин Vue 3:

```js
// loggerPlugin.js

// Здесь мы объявляем объект плагина
const LoggerPlugin = {
  // Метод install вызывается Vue один раз при app.use()
  install(app, options) {
    // options - это любые дополнительные настройки при установке
    // Например, можно задать префикс для логов
    const prefix = options?.prefix || '[LOG]'

    // Добавляем глобальный метод в экземпляр приложения
    app.config.globalProperties.$log = function (message) {
      // Здесь мы просто выводим сообщение в консоль
      console.log(`${prefix} ${message}`)
    }
  }
}

export default LoggerPlugin
```

Теперь вы увидите, как этот плагин подключается:

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import LoggerPlugin from './loggerPlugin'

const app = createApp(App)

// Устанавливаем плагин с настройками
app.use(LoggerPlugin, {
  prefix: '[MyApp]' // этот префикс попадет в options.install
})

// Монтируем приложение
app.mount('#app')
```

Использование в любом компоненте:

```vue
<script>
export default {
  name: 'ExampleComponent',
  mounted() {
    // this.$log добавлен глобально через плагин
    this.$log('Компонент смонтирован')
  }
}
</script>
```

Комментарии:

- плагин определяет расширение, которое появится у всех компонентов;
- install вызывается один раз, после app.use;
- this.$log стал доступен без дополнительных импортов.

### Плагин как функция

Если вам не нужен объект, можно написать плагин сразу как функцию. Давайте разберемся на примере:

```js
// datePlugin.js

// Это функция-плагин. Vue будет вызывать ее как install(app, options)
export default function DatePlugin(app, options) {
  const locale = options?.locale || 'ru-RU'

  // Добавляем глобальный метод форматирования дат
  app.config.globalProperties.$formatDate = function (date) {
    // Здесь мы используем стандартный Intl.DateTimeFormat
    return new Intl.DateTimeFormat(locale).format(date)
  }
}
```

Подключение ничем не отличается:

```js
import { createApp } from 'vue'
import App from './App.vue'
import DatePlugin from './datePlugin'

const app = createApp(App)

app.use(DatePlugin, { locale: 'en-US' })

app.mount('#app')
```

Важный момент: Vue сам определит, что вы передали функцию, и использует ее как install. В остальном поведение такое же.

---

## Возможности, которые может добавлять плагин

### Глобальные свойства и методы

Один из самых частых сценариев — добавить в контекст компонента методы вида this.$api, this.$auth, this.$notify и так далее.

Во Vue 3 для этого используют app.config.globalProperties.

Пример плагина для HTTP-клиента:

```js
// apiPlugin.js
import axios from 'axios'

const ApiPlugin = {
  install(app, options) {
    // Здесь мы создаем экземпляр axios с базовым URL
    const api = axios.create({
      baseURL: options?.baseURL || 'https://api.example.com',
    })

    // Можно добавить интерцепторы, заголовки и др.
    // api.interceptors.request.use(...)

    // Делаем $api доступным во всех компонентах
    app.config.globalProperties.$api = api
  }
}

export default ApiPlugin
```

Использование:

```vue
<script>
export default {
  name: 'UserList',
  async mounted() {
    try {
      // this.$api был добавлен плагином
      const response = await this.$api.get('/users')
      // Здесь мы работаем с полученными данными
      console.log(response.data)
    } catch (e) {
      // Обрабатываем ошибку
      console.error('Ошибка загрузки пользователей', e)
    }
  }
}
</script>
```

Такой подход помогает:

- убрать дублирующиеся импорты axios в каждом компоненте;
- централизованно настраивать API-клиент;
- легко заменять реализацию (например, на другую библиотеку) без переписывания компонентов.

### Глобальные компоненты

Плагин часто регистрирует набор UI-компонентов: кнопки, модальные окна, поля ввода.

Давайте посмотрим, как это выглядит в коде:

```js
// uiPlugin.js
import BaseButton from './components/BaseButton.vue'
import BaseInput from './components/BaseInput.vue'

const UiPlugin = {
  install(app) {
    // Регистрируем компоненты глобально
    app.component('BaseButton', BaseButton)
    app.component('BaseInput', BaseInput)
  }
}

export default UiPlugin
```

Теперь в любом компоненте можно использовать:

```vue
<template>
  <!-- Компоненты доступны без локальной регистрации -->
  <BaseButton>Отправить</BaseButton>
  <BaseInput v-model="value" />
</template>

<script>
export default {
  name: 'FormExample',
  data() {
    return {
      value: ''
    }
  }
}
</script>
```

Комментарии:

- плагин берет на себя регистрацию, поэтому код компонентов становится чище;
- можно инкапсулировать целую дизайн-систему в одном плагине.

### Глобальные директивы

Если вам нужно добавить специфическое поведение к элементам DOM, плагин может зарегистрировать директиву.

Давайте разберемся на примере директивы auto-focus:

```js
// focusPlugin.js
const FocusPlugin = {
  install(app) {
    // Регистрируем директиву v-focus
    app.directive('focus', {
      mounted(el) {
        // Когда элемент смонтирован, ставим фокус
        el.focus()
      }
    })
  }
}

export default FocusPlugin
```

Использование:

```vue
<template>
  <!-- Поле ввода автоматически получит фокус при появлении -->
  <input v-focus />
</template>
```

Можно регистрировать несколько директив в одном плагине. Это удобно для целых наборов (например, директивы форматирования, масок и так далее).

### Provide/Inject и общие сервисы

Во Vue 3 вы можете создавать сервисы на основе механизма provide/inject и оформлять их в виде плагина. Это позволяет делиться объектами и функциями без глобальных свойств this.

Вот пример простого сервис-плагина:

```js
// themePlugin.js

// Ключ для provide/inject
const ThemeSymbol = Symbol('Theme')

export function useThemeInjectionKey() {
  // Возвращаем символ, чтобы можно было импортировать его из одного места
  return ThemeSymbol
}

const ThemePlugin = {
  install(app, options) {
    // Здесь мы создаем объект темы
    const theme = {
      // Текущее название темы
      current: options?.defaultTheme || 'light',

      // Метод переключения темы
      setTheme(newTheme) {
        this.current = newTheme
      }
    }

    // Делаем объект темы доступным через provide
    app.provide(ThemeSymbol, theme)
  }
}

export default ThemePlugin
```

Использование в компоненте:

```js
// SomeComponent.vue
<script>
import { inject } from 'vue'
import { useThemeInjectionKey } from '../plugins/themePlugin'

export default {
  name: 'SomeComponent',
  setup() {
    // Получаем символ ключа
    const ThemeSymbol = useThemeInjectionKey()

    // Инжектим объект темы
    const theme = inject(ThemeSymbol)

    // Здесь theme - это тот самый объект, который мы передали в provide
    // Можно вызывать theme.setTheme() и читать theme.current

    return {
      theme
    }
  }
}
</script>
```

Такой подход особенно полезен для:

- конфигурации приложения (настройки, локаль);
- общих сервисов, которые используются в Composition API;
- логики, которую неудобно привязывать к this.$.

---

## Отличия плагинов во Vue 2 и Vue 3

### Сигнатура install

Vue 2:

- install(VueConstructor, options)
- вы вызываете Vue.use(plugin)

Пример:

```js
// loggerPluginVue2.js

const LoggerPluginVue2 = {
  install(Vue, options) {
    const prefix = options?.prefix || '[LOG]'

    // Добавляем метод к прототипу Vue
    Vue.prototype.$log = function (message) {
      console.log(`${prefix} ${message}`)
    }
  }
}

export default LoggerPluginVue2
```

Подключение:

```js
// main.js (Vue 2)
import Vue from 'vue'
import App from './App.vue'
import LoggerPluginVue2 from './loggerPluginVue2'

Vue.use(LoggerPluginVue2, { prefix: '[MyApp]' })

new Vue({
  render: h => h(App),
}).$mount('#app')
```

Vue 3:

- install(app, options)
- вы вызываете app.use(plugin)

Ключевое отличие:

- Vue 2 использует Vue.prototype;
- Vue 3 использует app.config.globalProperties.

### Где объявлять use

Vue 2:

- плагин подключают глобально до создания корневого экземпляра,
- все экземпляры Vue автоматически видят плагины.

Vue 3:

- вы создаете app через createApp,
- на объекте app вызываете use,
- разные приложения могут использовать разные плагины (что удобно, если у вас несколько точек входа).

### Совместимость и миграция

Если у вас есть старый плагин под Vue 2:

- нужно заменить Vue.prototype.$something на app.config.globalProperties.$something;
- нужно поменять сигнатуру install(Vue, options) на install(app, options);
- если плагин использовал mixins, global filters и прочие устаревшие механизмы, возможно, потребуется переработка.

---

## Создание собственного плагина шаг за шагом

Теперь давайте соберем все вместе и напишем с нуля чуть более "живой" плагин. Пусть это будет плагин уведомлений с глобальным методом $notify.

### Шаг 1. Определяем интерфейс

Сначала полезно описать, как вы хотите использовать плагин в компонентах. Допустим:

```js
this.$notify.success('Данные сохранены')
this.$notify.error('Произошла ошибка')
```

Или через Composition API:

```js
import { inject } from 'vue'
import { NotifySymbol } from '../plugins/notifyPlugin'

const notify = inject(NotifySymbol)
notify.success('Сохранено')
```

То есть нужен объект notify с методами success и error, доступный глобально.

### Шаг 2. Реализуем плагин

```js
// notifyPlugin.js
import { reactive } from 'vue'

// Создаем символ для provide/inject
export const NotifySymbol = Symbol('Notify')

const NotifyPlugin = {
  install(app, options) {
    // Создаем реактивное состояние списка уведомлений
    const state = reactive({
      messages: [] // Здесь будут храниться все уведомления
    })

    // Функция добавления уведомления
    function addMessage(type, text) {
      // Каждому сообщению даем id для удобного удаления
      const id = Date.now() + Math.random()

      state.messages.push({
        id,
        type,
        text
      })

      // Если включен autoClose, удаляем сообщение автоматически
      const autoClose = options?.autoClose ?? 3000
      if (autoClose) {
        setTimeout(() => {
          removeMessage(id)
        }, autoClose)
      }
    }

    // Функция удаления уведомления
    function removeMessage(id) {
      const index = state.messages.findIndex(msg => msg.id === id)
      if (index !== -1) {
        state.messages.splice(index, 1)
      }
    }

    // Объект сервиса уведомлений
    const notify = {
      success(text) {
        // Здесь мы создаем уведомление типа success
        addMessage('success', text)
      },
      error(text) {
        // Здесь мы создаем уведомление типа error
        addMessage('error', text)
      },
      info(text) {
        // Здесь мы создаем уведомление типа info
        addMessage('info', text)
      },
      // Список текущих сообщений
      state,
      // Метод ручного удаления (если нужно)
      remove: removeMessage
    }

    // Делаем notify доступным через provide/inject
    app.provide(NotifySymbol, notify)

    // И добавляем его в глобальные свойства для доступа через this.$notify
    app.config.globalProperties.$notify = notify
  }
}

export default NotifyPlugin
```

### Шаг 3. Подключаем плагин

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import NotifyPlugin from './plugins/notifyPlugin'

const app = createApp(App)

// Подключаем плагин с авто-закрытием через 5 секунд
app.use(NotifyPlugin, {
  autoClose: 5000
})

app.mount('#app')
```

### Шаг 4. Создаем компонент для отображения уведомлений

```vue
<!-- components/NotifyContainer.vue -->
<template>
  <div class="notify-container">
    <!-- Перебираем все сообщения из состояния notify -->
    <div
      v-for="msg in notify.state.messages"
      :key="msg.id"
      class="notify-message"
      :class="`notify-message--${msg.type}`"
    >
      <span>{{ msg.text }}</span>
      <!-- Кнопка закрытия уведомления -->
      <button @click="notify.remove(msg.id)">×</button>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { NotifySymbol } from '../plugins/notifyPlugin'

export default {
  name: 'NotifyContainer',
  setup() {
    // Получаем объект notify через inject
    const notify = inject(NotifySymbol)

    return {
      notify
    }
  }
}
</script>

<style scoped>
/* Здесь простая стилизация контейнера и сообщений */
.notify-container {
  position: fixed;
  right: 16px;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notify-message {
  padding: 8px 12px;
  border-radius: 4px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notify-message--success {
  background-color: #2e7d32;
}

.notify-message--error {
  background-color: #c62828;
}

.notify-message--info {
  background-color: #1565c0;
}

.notify-message button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
}
</style>
```

Размещение в корневом компоненте:

```vue
<!-- App.vue -->
<template>
  <div>
    <!-- Здесь ваш основной контент -->
    <router-view />

    <!-- Контейнер уведомлений подключаем один раз -->
    <NotifyContainer />
  </div>
</template>

<script>
import NotifyContainer from './components/NotifyContainer.vue'

export default {
  name: 'App',
  components: {
    NotifyContainer
  }
}
</script>
```

Использование в любом компоненте:

```vue
<script>
export default {
  name: 'ProfilePage',
  methods: {
    onSave() {
      // Здесь мы показываем уведомление об успешном сохранении
      this.$notify.success('Профиль сохранен')
    }
  }
}
</script>
```

Так вы получили законченный плагин, который:

- предоставляет API this.$notify;
- работает с Composition API через inject;
- управляет реактивным состоянием;
- рендерится через отдельный компонент.

---

## Подключение сторонних vue-plugins

### Общий подход

Для сторонних плагинов схема обычно одна:

1. Установить пакет через npm или yarn.
2. Импортировать плагин.
3. Вызвать app.use(plugin, options) (Vue 3) или Vue.use(plugin, options) (Vue 2).
4. Использовать предоставленный функционал (компоненты, директives, методы).

Давайте посмотрим, как это выглядит, на обобщенном примере.

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'

// Импортируем сторонний плагин
import SomeVuePlugin from 'some-vue-plugin'

const app = createApp(App)

// Устанавливаем плагин с нужными опциями
app.use(SomeVuePlugin, {
  // Здесь обычно передают ключи API, базовые настройки и т.п.
  optionA: true,
  optionB: 'value'
})

app.mount('#app')
```

После этого вы можете:

- использовать глобальные компоненты плагина;
- вызывать методы вида this.$something, если плагин их добавляет;
- применять директивы, если плагин их зарегистрировал.

При работе с внешними vue-plugins внимательно смотрите документацию: разработчики плагина обычно описывают, какие именно свойства он добавляет и как с ними работать.

### Комбинирование нескольких плагинов

В одном приложении можно использовать сразу несколько плагинов:

```js
import { createApp } from 'vue'
import App from './App.vue'

import LoggerPlugin from './plugins/loggerPlugin'
import ApiPlugin from './plugins/apiPlugin'
import NotifyPlugin from './plugins/notifyPlugin'

const app = createApp(App)

// Порядок установки обычно не критичен, но иногда важен,
// если один плагин использует другой внутри себя
app.use(LoggerPlugin, { prefix: '[MyApp]' })
app.use(ApiPlugin, { baseURL: '/api' })
app.use(NotifyPlugin, { autoClose: 4000 })

app.mount('#app')
```

Если один плагин зависит от другого (например, логгер использует уведомления), порядок может иметь значение. В таком случае логично устанавливать зависимые плагины после тех, от кого они зависят.

---

## Организация структуры проекта с плагинами

### Где хранить плагины

Обычно плагины кладут в отдельную папку, например:

- src/plugins/loggerPlugin.js
- src/plugins/apiPlugin.js
- src/plugins/notifyPlugin.js

Так вы отделяете "инфраструктурный" код от компонентов и стилей. Это упрощает навигацию по проекту, особенно когда плагинов становится больше.

### Индексный файл для плагинов

Иногда удобно создать единый файл, который подключает все плагины сразу. Давайте разберемся на примере:

```js
// src/plugins/index.js
import LoggerPlugin from './loggerPlugin'
import ApiPlugin from './apiPlugin'
import NotifyPlugin from './notifyPlugin'

export function registerPlugins(app) {
  // Здесь мы собираем единое место для регистрации всех плагинов
  app
    .use(LoggerPlugin, { prefix: '[MyApp]' })
    .use(ApiPlugin, { baseURL: '/api' })
    .use(NotifyPlugin, { autoClose: 3000 })
}
```

Подключение в main.js:

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import { registerPlugins } from './plugins'

const app = createApp(App)

// Устанавливаем все плагины из одного места
registerPlugins(app)

app.mount('#app')
```

Такое разделение:

- облегчает перенос плагинов между проектами;
- делает main.js компактным и понятным;
- помогает лучше видеть "инфраструктурную конфигурацию" приложения.

---

## Тестирование плагинов

### Идея тестирования

Плагин — это обычный модуль, поэтому его тоже стоит покрывать тестами. Мы хотим проверить, что:

- install корректно добавляет свойства и методы;
- настройки (options) правильно обрабатываются;
- поведение плагина предсказуемо и не зависит от порядка вызова.

### Пример тестирования с помощью @vue/test-utils (Vue 3)

Покажу вам упрощенный подход для LoggerPlugin.

Сам плагин:

```js
// loggerPlugin.js
const LoggerPlugin = {
  install(app, options) {
    const prefix = options?.prefix || '[LOG]'

    app.config.globalProperties.$log = function (message) {
      // Здесь мы выводим сообщение в консоль
      console.log(`${prefix} ${message}`)
    }
  }
}

export default LoggerPlugin
```

Тест (на псевдокоде с Jest):

```js
// loggerPlugin.spec.js
import { createApp } from 'vue'
import LoggerPlugin from './loggerPlugin'

// Здесь мы подменяем console.log
const originalLog = console.log

beforeEach(() => {
  console.log = jest.fn()
})

afterEach(() => {
  console.log = originalLog
})

test('LoggerPlugin добавляет метод $log', () => {
  const app = createApp({})

  // Устанавливаем плагин
  app.use(LoggerPlugin, { prefix: '[Test]' })

  // Создаем компонент для проверки
  const comp = {
    template: '<div></div>',
    mounted() {
      // Здесь вызываем $log при монтировании
      this.$log('hello')
    }
  }

  // Монтируем компонент
  const vm = app.mount(document.createElement('div'), comp)

  // Проверяем, что console.log был вызван
  expect(console.log).toHaveBeenCalledWith('[Test] hello')
})
```

Здесь важно:

- создавать отдельный экземпляр приложения для теста;
- управлять побочными эффектами (как перехват console.log);
- проверять именно публичное поведение (наличие метода и корректность результата).

---

## Лучшие практики при работе с vue-plugins

### Не перегружайте глобальные свойства

Глобальные методы с префиксом $ удобны, но:

- если их становится слишком много, контекст компонента перегружается;
- сложнее понять, откуда именно появился тот или иной метод.

Рекомендации:

- вводите осмысленные имена ($api, $auth, $logger, $notify);
- группируйте функции в объекты (this.$api.getUsers(), а не this.$getUsersApi());
- для функционала, специфичного для отдельных модулей, лучше использовать локальные импорты вместо плагинов.

### Делайте плагины конфигурируемыми

Хороший плагин:

- имеет разумные значения по умолчанию;
- но позволяет изменить базовые настройки через options.

Например:

```js
app.use(ApiPlugin, { baseURL: '/api', timeout: 5000 })
```

Внутри плагина:

- используйте значения по умолчанию;
- аккуратно проверяйте, что опции заданы.

### Следите за одноразовой установкой

Vue гарантирует, что app.use(plugin) не установит один и тот же плагин дважды, если он использует стандартный механизм. Тем не менее:

- не завязывайтесь на побочные эффекты, которые могут быть опасны при повторных вызовах;
- не меняйте поведение приложения неожиданным образом внутри install;
- избегайте хранения состояния в модуле плагина, если оно должно быть специфично для приложения (лучше создавать состояние внутри install).

### Разделяйте "инфраструктуру" и "бизнес-логику"

Плагины хороши для инфраструктурных задач:

- логирование;
- трекинг;
- работа с API;
- общие визуальные компоненты.

Бизнес-логику конкретных экранов лучше оставлять в компонентах или в специализированных модулях (composables, store). Если вы начнете помещать всю предметную область в плагины, код станет сложнее поддерживать.

---

## Заключение

Плагины Vue — это способ расширить возможности фреймворка и структурировать общий функционал вашего приложения. Через механизм install вы можете:

- регистрировать глобальные компоненты и директивы;
- добавлять методы и свойства в контекст компонентов;
- организовывать сервисы с помощью provide/inject;
- инкапсулировать интеграцию со сторонними библиотеками.

Во Vue 3 плагины работают через app.use(plugin), а основной точкой расширения служит app.config.globalProperties и app.provide. Во Vue 2 плагин подключается через Vue.use(plugin), а методы добавляются в Vue.prototype.

Если вы выносите повторяемый и инфраструктурный код в плагины, приложение становится проще: компоненты концентрируются на отображении данных и пользовательском взаимодействии, а общие сервисы живут отдельно и переиспользуются без дублирования.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как типизировать плагины Vue 3 с TypeScript чтобы this.$api и другие свойства подсвечивались в компонентах

Создайте файл типизации, например src/types/vue.d.ts:

```ts
// Здесь мы расширяем тип ComponentCustomProperties
import { ComponentCustomProperties } from 'vue'
import { AxiosInstance } from 'axios'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    // Объявляем $api как AxiosInstance
    $api: AxiosInstance
  }
}
```

Убедитесь, что этот файл попадает в компиляцию TypeScript (указан в include в tsconfig). После этого в компонентах на TypeScript свойство this.$api будет корректно типизировано.

---

### Как сделать так чтобы плагин работал и во Vue 2 и во Vue 3

Создайте "адаптер", который проверяет, что ему передали:

```js
const MyPlugin = {
  install(target, options) {
    // Если есть config - это Vue 3 (app)
    const isVue3 = !!target.config
    if (isVue3) {
      const app = target
      app.config.globalProperties.$my = 'value'
    } else {
      const Vue = target
      Vue.prototype.$my = 'value'
    }
  }
}

export default MyPlugin
```

Во Vue 2 подключайте через Vue.use(MyPlugin), во Vue 3 — через app.use(MyPlugin). Внутри install определяйте поведение по версии.

---

### Как отключить или переинициализировать плагин в тестах

Создайте фабрику приложения для тестов, где вы контролируете подключение плагинов:

```js
import { createApp } from 'vue'
import App from '../App.vue'

export function createTestApp({ usePlugins = true } = {}) {
  const app = createApp(App)

  if (usePlugins) {
    // Здесь подключаете плагины для e2e тестов
  }

  return app
}
```

В юнит-тестах можно использовать отдельное приложение без плагинов либо подключать вместо реального плагина тестовый "заглушку" с тем же API.

---

### Как организовать плагины в монорепозитории чтобы переиспользовать их между проектами

В монорепо вынесите плагины в отдельный пакет, например packages/vue-plugins, и экспортируйте их из index.js. Затем в каждом фронтенд-проекте устанавливайте пакет через workspace-зависимость и подключайте плагины как обычный npm-пакет. Важно настроить сборку пакета (например, через Rollup или Vite library mode), чтобы он корректно импортировался в другие проекты.

---

### Можно ли в плагине использовать router или store и как это лучше делать

Да, можно. Во Vue 3:

```js
// В main.js сначала создайте router и store
const app = createApp(App)
const router = createRouter(...)
const store = createStore(...)

app.use(router)
app.use(store)

// Затем передайте их в плагин через options
app.use(MyPlugin, { router, store })
```

Внутри плагина используйте options.router и options.store. Так вы не привязываете плагин к конкретной реализации роутера или стора и можете переиспользовать его в разных проектах, просто передавая нужные зависимости при установке.