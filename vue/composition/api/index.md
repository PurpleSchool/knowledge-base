---
metaTitle: Composition API во Vue 3
metaDescription: Подробное объяснение Composition API во Vue 3 - как он устроен - чем отличается от Options API и как правильно применять его на практике
author: Олег Марков
title: Composition API во Vue 3 - полный практический разбор
preview: Разберите Composition API во Vue 3 - поймите зачем он нужен - как с ним работать и как организовывать логику компонентов с примерами кода
---

## Введение

Composition API в Vue 3 появился как ответ на реальные проблемы, с которыми сталкиваются разработчики при работе с крупными приложениями на Options API. Когда компонент становится большим, логика, связанная между собой, оказывается разбросана по разным опциям: data, computed, methods, watch и так далее. Поддерживать такой код со временем становится труднее.

Смотрите, что делает Composition API: он позволяет сгруппировать связанную логику по смыслу, а не по типу опции. Вы описываете состояние, вычисления, обработчики и эффекты там, где они логически связаны, а не в разных разделах объекта компонента. В итоге код становится более модульным, тестируемым и удобным для повторного использования.

Ниже мы подробно разберем основные концепции Composition API, посмотрим на примеры, обсудим типичные паттерны и тонкие места, о которые часто спотыкаются разработчики.

---

## Ключевые отличия Composition API от Options API

### Логика по типу против логики по функциональности

В Options API вы группируете код по типу:

- data — для состояния
- computed — для вычисляемых значений
- methods — для методов
- watch — для наблюдателей

Получается такая структура:

```js
export default {
  data() {
    return {
      count: 0,          // состояние
      doubleCount: 0     // еще одно состояние
    }
  },
  computed: {
    isEven() {
      // вычисление, зависящее от count
      return this.count % 2 === 0
    }
  },
  methods: {
    increment() {
      // метод, работающий с count
      this.count++
    }
  },
  watch: {
    count(newValue) {
      // побочный эффект при изменении count
      console.log('Count changed', newValue)
    }
  }
}
```

Логика вокруг `count` разбросана по нескольким разделам. Чем больше логических блоков в компоненте, тем сильнее это ощущается.

В Composition API вы группируете все, что относится к конкретной задаче, рядом:

```js
import { ref, computed, watch } from 'vue'

export default {
  setup() {
    // Состояние
    const count = ref(0)

    // Вычисляемое значение
    const isEven = computed(() => count.value % 2 === 0)

    // Метод
    const increment = () => {
      count.value++
    }

    // Наблюдение за изменениями
    watch(count, (newValue) => {
      console.log('Count changed', newValue)
    })

    // Экспорт в шаблон
    return {
      count,
      isEven,
      increment
    }
  }
}
```

Здесь вы видите все, что связано с `count`, в одном месте. Это основная идея Composition API.

### Более гибкая переиспользуемая логика

Вместо mixins и громоздкого наследования вы выносите общую логику в обычные функции и затем переиспользуете их, подключая в `setup`. Такие функции обычно называют composables (композаблы).

---

## Базовые строительные блоки Composition API

### Функция setup — сердце компонента

`setup` — это точка входа в Composition API внутри компонента. В этом блоке вы:

- создаете реактивное состояние
- описываете вычисляемые значения
- определяете методы и эффекты
- возвращаете то, что нужно использовать в шаблоне

Пример простого компонента с `setup`:

```js
import { ref } from 'vue'

export default {
  // Все, что относится к Composition API, описываем в setup
  setup() {
    // Создаем реактивную переменную
    const message = ref('Привет из Composition API')

    // Метод для изменения состояния
    const updateMessage = () => {
      // Обратите внимание - доступ к значению через .value
      message.value = 'Сообщение обновлено'
    }

    // Возвращаем значения и методы - они попадут в шаблон
    return {
      message,
      updateMessage
    }
  }
}
```

В шаблоне вы можете использовать `message` и `updateMessage` как обычные свойства:

```html
<template>
  <div>
    <!-- Здесь Vue сам развернет .value -->
    <p>{{ message }}</p>
    <button @click="updateMessage">Обновить</button>
  </div>
</template>
```

### Параметры setup: props и context

Функция `setup` может принимать два аргумента:

```js
export default {
  props: {
    initialCount: {
      type: Number,
      required: true
    }
  },
  setup(props, context) {
    // props — это реактивный объект с пропсами
    // context — объект с emit, slots, attrs

    console.log(props.initialCount)

    // emit из context
    context.emit('some-event')

    return {}
  }
}
```

Второй аргумент обычно деструктурируют:

```js
setup(props, { emit, slots, attrs }) {
  // Теперь можно вызывать emit напрямую
  const handleClick = () => {
    emit('clicked')
  }

  return {
    handleClick
  }
}
```

Важно понимать: `props` — это реактивный объект. Не рекомендуется мутировать его напрямую, лучше создавать локальные refs или computed.

---

## Реактивное состояние: ref и reactive

### ref — реактивное значение

`ref` оборачивает примитив или объект, создавая реактивную ссылку. Смотрите, как это работает:

```js
import { ref } from 'vue'

export default {
  setup() {
    // Создаем реактивное число
    const count = ref(0)

    // Создаем реактивную строку
    const title = ref('Заголовок')

    // Метод, который изменяет состояние
    const increment = () => {
      // Изменяем значение через .value
      count.value++
    }

    // В шаблоне .value не нужно - Vue сам его "развернет"
    return {
      count,
      title,
      increment
    }
  }
}
```

Несколько важных нюансов:

- В JavaScript-коде доступ к значению всегда через `.value`
- В шаблоне `.value` не нужен — Vue автоматически разыменует `ref`
- Если вы передаете `ref` в другие функции, не забывайте, что это объект, а не просто число или строка

### reactive — реактивный объект

`reactive` делает объект целиком реактивным:

```js
import { reactive } from 'vue'

export default {
  setup() {
    // Создаем один реактивный объект вместо нескольких ref
    const state = reactive({
      count: 0,
      title: 'Счетчик',
      user: {
        name: 'Иван'
      }
    })

    const increment = () => {
      // Обновляем поля напрямую - без .value
      state.count++
    }

    return {
      state,
      increment
    }
  }
}
```

В шаблоне:

```html
<template>
  <div>
    <h1>{{ state.title }}</h1>
    <p>{{ state.count }}</p>
    <p>{{ state.user.name }}</p>
    <button @click="increment">+</button>
  </div>
</template>
```

### Как выбрать между ref и reactive

Подход можно сформулировать так:

- `ref` удобно использовать для:
  - отдельных примитивов (число, строка, булево)
  - когда значение нужно передавать и возвращать как единый объект (например, из composable)
- `reactive` удобно использовать для:
  - логически связанного состояния (например, форма)
  - вложенных объектов, где вам важно, чтобы вложенные свойства тоже были реактивны

Комбинировать тоже можно:

```js
import { ref, reactive } from 'vue'

export default {
  setup() {
    const count = ref(0)

    const form = reactive({
      name: '',
      email: ''
    })

    return {
      count,
      form
    }
  }
}
```

---

## Вычисляемые значения: computed

`computed` создает значение, которое автоматически пересчитывается при изменении зависимостей. Давайте разберемся на примере:

```js
import { ref, computed } from 'vue'

export default {
  setup() {
    const firstName = ref('Иван')
    const lastName = ref('Петров')

    // Здесь я размещаю пример, чтобы вам было проще понять,
    // как computed собирает данные из нескольких источников.
    const fullName = computed(() => {
      // Эта функция будет вызываться при изменении firstName или lastName
      return `${firstName.value} ${lastName.value}`
    })

    const updateName = () => {
      firstName.value = 'Сергей'
      lastName.value = 'Иванов'
    }

    return {
      firstName,
      lastName,
      fullName,
      updateName
    }
  }
}
```

В чем преимущества computed:

- Кеширование — пока зависимые значения не меняются, вычисление не запускается повторно
- Упрощает шаблон — сложную логику можно вынести в `computed`
- Удобен для фильтрации, сортировки и форматирования данных

---

## Побочные эффекты: watch и watchEffect

Реактивность сама по себе не выполняет действий. Для этого нужны наблюдатели.

### watch — явный контроль над зависимостями

`watch` отслеживает одну или несколько реактивных переменных и запускает колбэк при изменении.

Пример:

```js
import { ref, watch } from 'vue'

export default {
  setup() {
    const search = ref('')

    // Следим за изменениями строки поиска
    watch(search, (newValue, oldValue) => {
      // Здесь можно вызывать API, логировать, дебаунсить и т.д.
      console.log('Поиск изменился с', oldValue, 'на', newValue)
    })

    return {
      search
    }
  }
}
```

Можно следить за несколькими источниками:

```js
import { ref, watch } from 'vue'

export default {
  setup() {
    const min = ref(0)
    const max = ref(100)

    watch([min, max], ([newMin, newMax], [oldMin, oldMax]) => {
      console.log('Диапазон изменился', newMin, newMax)
    })

    return {
      min,
      max
    }
  }
}
```

### watchEffect — автоматический сбор зависимостей

`watchEffect` сам «подписывается» на все реактивные значения, которые используются внутри его функции.

```js
import { ref, watchEffect } from 'vue'

export default {
  setup() {
    const count = ref(0)

    watchEffect(() => {
      // Как только count изменится, эта функция вызовется снова
      console.log('Текущее значение count', count.value)
    })

    const increment = () => {
      count.value++
    }

    return {
      count,
      increment
    }
  }
}
```

`watchEffect` удобен для быстрых прототипов и случаев, когда вам не нужно вручную перечислять зависимости.

---

## Жизненный цикл компонента с Composition API

### Хуки жизненного цикла в setup

Во Vue 3 для Composition API есть специальные функции-хуки, которые соответствуют хуксам Options API, например:

- onMounted — аналог mounted
- onUnmounted — аналог beforeDestroy/destroyed в зависимости от сценария
- onUpdated — аналог updated
- и другие (onBeforeMount, onBeforeUpdate, onBeforeUnmount и т.д.)

Пример:

```js
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    const width = ref(window.innerWidth)

    const handleResize = () => {
      width.value = window.innerWidth
    }

    onMounted(() => {
      // Подписываемся на событие при монтировании
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      // Обязательно отписываемся при размонтировании
      window.removeEventListener('resize', handleResize)
    })

    return {
      width
    }
  }
}
```

Такой подход хорошо показывает, как рядом группируется логика: состояние `width`, обработчик `handleResize` и жизненный цикл.

---

## Организация логики с помощью composables

### Что такое composable

Composable — это обычная функция JavaScript, которая внутри использует Composition API (`ref`, `reactive`, `computed`, `watch`, хуки жизненного цикла) и возвращает часть логики для использования в компонентах.

Идея: один раз описать логику, затем переиспользовать ее в нескольких компонентах.

### Пример простого composable: useCounter

Давайте разберемся на примере счетчика.

Создадим файл `useCounter.js`:

```js
// useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  // Здесь создаем внутреннее состояние счетчика
  const count = ref(initialValue)

  const increment = () => {
    count.value++
  }

  const decrement = () => {
    count.value--
  }

  const reset = () => {
    count.value = initialValue
  }

  // Вычисляемое значение для удобства
  const isPositive = computed(() => count.value > 0)

  // Возвращаем все, что хотим дать компоненту
  return {
    count,
    increment,
    decrement,
    reset,
    isPositive
  }
}
```

Теперь вы увидите, как это выглядит в компоненте:

```js
// Counter.vue
import { useCounter } from './useCounter'

export default {
  setup() {
    // Подключаем готовую логику
    const {
      count,
      increment,
      decrement,
      reset,
      isPositive
    } = useCounter(5) // стартовое значение 5

    return {
      count,
      increment,
      decrement,
      reset,
      isPositive
    }
  }
}
```

В шаблоне:

```html
<template>
  <div>
    <p>Текущее значение - {{ count }}</p>
    <p>Положительное - {{ isPositive ? 'да' : 'нет' }}</p>
    <button @click="decrement">-</button>
    <button @click="increment">+</button>
    <button @click="reset">Сброс</button>
  </div>
</template>
```

Такой подход удобен, когда нужно разделить:

- работу с формами
- логику API-запросов
- работу с WebSocket
- управление состоянием интерфейса (модальные окна, лоадеры)

### Composable с побочными эффектами и жизненным циклом

Покажу вам, как это реализовано на практике для отслеживания размера окна:

```js
// useWindowSize.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    // Подписываемся на событие
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    // Отписываемся при уничтожении
    window.removeEventListener('resize', update)
  })

  return {
    width,
    height
  }
}
```

Дальше вы можете использовать `useWindowSize` в нескольких компонентах, не дублируя код.

---

## Работа с шаблоном и this в Composition API

### Отсутствие this в setup

Внутри `setup` объект `this` не используется. Это намеренное решение: `setup` вызывается до создания экземпляра компонента, поэтому там просто еще нет привычного `this`.

Вместо этого вы работаете напрямую с переменными, которые объявляете в `setup`, и возвращаете их наружу.

Неправильно:

```js
export default {
  setup() {
    const count = ref(0)

    const increment = () => {
      // Так делать нельзя - this не определен в setup
      this.count++
    }

    return {
      count,
      increment
    }
  }
}
```

Правильно:

```js
export default {
  setup() {
    const count = ref(0)

    const increment = () => {
      // Обращаемся к ref напрямую
      count.value++
    }

    return {
      count,
      increment
    }
  }
}
```

### Что именно возвращать из setup

Все, что вы вернете из `setup`, станет доступно в шаблоне. Это удобный способ явно контролировать «публичный интерфейс» компонента.

```js
setup() {
  const internalValue = ref(0)
  const publicValue = ref(10)

  const increment = () => {
    internalValue.value++
  }

  // internalValue здесь не экспортируем - он используется только внутри setup
  return {
    publicValue,
    increment
  }
}
```

В шаблоне вы увидите только `publicValue` и `increment`. `internalValue` останется внутренней деталью реализации.

---

## Типичные паттерны использования Composition API

### Локальное состояние формы

Давайте посмотрим, что происходит в следующем примере формы логина:

```js
import { reactive, ref, computed } from 'vue'

export default {
  setup() {
    // Состояние формы
    const form = reactive({
      email: '',
      password: ''
    })

    // Локальный статус загрузки
    const isSubmitting = ref(false)

    // Примитивная валидация
    const isValid = computed(() => {
      return form.email.includes('@') && form.password.length >= 6
    })

    const errorMessage = ref('')

    const submit = async () => {
      if (!isValid.value) {
        errorMessage.value = 'Заполните форму корректно'
        return
      }

      isSubmitting.value = true
      errorMessage.value = ''

      try {
        // Здесь можно вызвать реальный API
        // await api.login(form.email, form.password)
        console.log('Отправляем данные формы', form.email, form.password)
      } catch (e) {
        errorMessage.value = 'Ошибка при входе'
      } finally {
        isSubmitting.value = false
      }
    }

    return {
      form,
      isValid,
      isSubmitting,
      errorMessage,
      submit
    }
  }
}
```

Здесь вы видите, как рядом находится:

- состояние формы
- вычисляемая валидация
- состояние отправки
- обработчик отправки

Это облегчает поддержку, по сравнению с разбросом по data/methods/computed/watch.

### Разделение бизнес-логики и UI

Хороший подход — выносить бизнес-логику в composables, оставляя в компоненте только привязку к шаблону.

Например, вы создаете:

- `useAuth` — вся логика авторизации, токенов, проверки статуса
- `useTodos` — логика работы со списком задач, с фильтрами, загрузкой данных

А сами компоненты (страницы, виджеты) просто используют эти composables в `setup` и рендерят нужный интерфейс.

---

## Работа с TypeScript (кратко о типизации)

Если вы используете TypeScript, Composition API дает гораздо более естественную типизацию, чем Options API. Сигнатуры функций, возвращаемых значений и параметров composables типизируются обычными средствами TypeScript.

Пример типизации composable:

```ts
// useCounter.ts
import { Ref, ref } from 'vue'

export function useCounter(initialValue: number = 0): {
  count: Ref<number>
  increment: () => void
  decrement: () => void
} {
  const count = ref<number>(initialValue)

  const increment = () => {
    count.value++
  }

  const decrement = () => {
    count.value--
  }

  return {
    count,
    increment,
    decrement
  }
}
```

Компонент автоматически получит корректные типы для `count`, `increment`, `decrement`.

---

## Смешивание Options API и Composition API

Vue 3 позволяет использовать оба подхода одновременно. Это удобно при миграции с Vue 2 или постепенном рефакторинге.

Пример компонента, который использует и `setup`, и обычные опции:

```js
import { ref } from 'vue'

export default {
  props: {
    title: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      legacyMessage: 'Сообщение из data'
    }
  },

  setup(props) {
    const count = ref(0)

    const increment = () => {
      count.value++
    }

    return {
      count,
      increment
    }
  },

  methods: {
    logTitle() {
      // Здесь мы используем this - это контекст Options API
      console.log('Текущий заголовок', this.title)
    }
  }
}
```

Важно понимать:

- Все, что возвращено из `setup`, смешивается в одну область видимости с `data`, `methods`, `computed`
- В `methods` и других опциях вы можете использовать свойства из `setup` через `this`
- В самом `setup` `this` использовать нельзя

---

## Частые ошибки и подводные камни

### Ошибка с .value в шаблоне

В шаблоне не нужно писать `.value` для `ref`:

```html
<!-- Неправильно -->
<p>{{ count.value }}</p>

<!-- Правильно -->
<p>{{ count }}</p>
```

Vue сам разыменует `ref` в шаблоне.

### Потеря реактивности при деструктуризации reactive

Если вы деструктурируете объект, созданный через `reactive`, вы теряете реактивность:

```js
const state = reactive({
  count: 0,
  title: 'Счетчик'
})

// Неправильно - count и title станут обычными значениями
const { count, title } = state
```

В таком случае лучше использовать `toRefs`:

```js
import { reactive, toRefs } from 'vue'

const state = reactive({
  count: 0,
  title: 'Счетчик'
})

// Здесь count и title станут ref, и реактивность сохранится
const { count, title } = toRefs(state)
```

### Изменение props напрямую

Внутри `setup` не стоит мутировать `props`:

```js
export default {
  props: {
    value: Number
  },
  setup(props) {
    // Неправильно - props управляется родителем
    // props.value = 10

    // Правильнее создать локальное состояние
    const localValue = ref(props.value)

    return {
      localValue
    }
  }
}
```

---

## Заключение

Composition API во Vue 3 дает более гибкий и масштабируемый способ организации логики компонентов. Вы группируете код по смысловым блокам, легко выносите повторяемую логику в composables, естественно используете TypeScript и получаете лучше управляемую архитектуру.

Ключевые идеи, которые важно удерживать:

- `setup` — единая точка входа для логики компонента
- `ref` и `reactive` — основа реактивного состояния
- `computed` — для производительных вычисляемых значений
- `watch` и `watchEffect` — для побочных эффектов
- composables — для переиспользуемой логики
- отсутствие `this` в `setup` и явный возврат значений наружу

Если вы уже знакомы с Options API, имеет смысл начать с смешанного подхода, постепенно перенося связные куски логики в `setup` и composables. Со временем структура проектов становится проще, тесты — понятнее, а переиспользование кода — естественным.

---

## Частозадаваемые технические вопросы по теме статьи

### 1. Как обратиться к элементу DOM в Composition API без this.$refs

Используйте `ref` из Vue и директиву ref в шаблоне.

```js
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const inputEl = ref(null)

    onMounted(() => {
      // Здесь inputEl.value — реальный DOM-элемент
      inputEl.value.focus()
    })

    return {
      inputEl
    }
  }
}
```

В шаблоне:

```html
<input ref="inputEl" />
```

### 2. Как использовать provide / inject с Composition API

Вы можете вызывать `provide` и `inject` напрямую внутри `setup` или composables.

```js
// Родитель
import { provide, ref } from 'vue'

setup() {
  const theme = ref('light')
  provide('theme', theme)
  return { theme }
}
```

```js
// Потомок
import { inject } from 'vue'

setup() {
  const theme = inject('theme', 'light') // второй аргумент — значение по умолчанию
  return { theme }
}
```

### 3. Как правильно отменять асинхронные операции при размонтировании компонента

Используйте флаг и хуки жизненного цикла.

```js
import { ref, onUnmounted } from 'vue'

setup() {
  const isActive = ref(true)

  const loadData = async () => {
    const data = await fetch('/api').then(r => r.json())
    if (!isActive.value) return
    // Обновляем состояние только если компонент еще жив
  }

  onUnmounted(() => {
    isActive.value = false
  })

  loadData()

  return {}
}
```

### 4. Как использовать router и store (Vuex/Pinia) внутри setup

Вызывайте соответствующие хуки:

```js
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'

setup() {
  const router = useRouter()
  const route = useRoute()
  const store = useStore()

  const goHome = () => router.push('/')
  const userName = computed(() => store.state.user.name)

  return { goHome, route, userName }
}
```

### 5. Как протестировать composable-функцию

Тестируйте ее как обычную функцию, используя реальный Vue-реактивный контекст (например, через @vue/test-utils или просто импортируя `ref`, `computed`).

```js
// useCounter.test.js
import { useCounter } from './useCounter'

test('increment increases count', () => {
  const { count, increment } = useCounter(0)
  increment()
  expect(count.value).toBe(1)
})
```