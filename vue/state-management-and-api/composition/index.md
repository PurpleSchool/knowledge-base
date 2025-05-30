---
metaTitle: Понимание и применение Composition API в Vue 3
metaDescription: Узнайте как использовать Composition API в Vue 3 - подробное руководство с примерами на практике и разбором основных функций и подходов
author: Олег Марков
title: Понимание и применение Composition API в Vue 3
preview: Исследуйте особенности и преимущества Composition API в Vue 3 - пошаговое руководство для разработки более читаемого и масштабируемого кода
---

## Введение

Vue.js долгое время ассоциировался с Options API — подходом, при котором логика компонента располагается по опциям (`data`, `methods`, `computed` и прочее). В третьей версии фреймворка появился совершенно новый способ написания компонентов — Composition API.  
Этот API позволяет вам более гибко и удобно структурировать логику, лучше переиспользовать код и создавать более масштабируемые приложения.

Давайте разберёмся, зачем понадобился Composition API, какие у него ключевые возможности, а потом разберёмся в примерах — вы увидите, как он работает на практике и как его применять в повседневных задачах.

## Для чего нужен Composition API

### Кратко о мотивации появления

Options API был великолепен для небольших и средних компонентов. Но когда компоненты становились большими и логика усложнялась, код иногда превращался в нечто запутанное.  
Вот основные проблемы, которые стали причиной появления нового подхода:
- **Трудно организовать и переиспользовать логику.** Функции, связанные по смыслу, могут быть разбросаны между разными разделами компонента.
- **Переиспользование логики — только миксины.** А миксины имеют массу недостатков: коллизии имён, запутанность зависимостей, неявные связи.

Composition API предлагает решение этих проблем.

### Ключевые преимущества

- **Гибкость:** вы сами решаете, как структурировать код.
- **Явные зависимости:** видно, какие данные и функции используются и возвращаются из компонента.
- **Удобное переиспользование логики:** с помощью composables — простых функций, которые вы можете вызывать повторно.

Давайте теперь перейдём к практике.

## Основные концепции Composition API

### setup функция — точка входа

Всё начинается с функции `setup`. Она вызывается сразу после создания экземпляра компонента, но до вычисления шаблона.

```js
<script setup>
import { ref } from 'vue'

// Создаем реактивное состояние
const count = ref(0)

// Функция для увеличения значения
function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>
```

// Здесь создается переменная count как реактивное состояние, функция increment изменяет значение. Всё, что объявлено в setup, будет доступно внутри шаблона (в `<script setup>` это происходит автоматически).

#### Когда используется обычная форма setup

Если не использовать `<script setup>`, функция выглядит так:

```js
export default {
  setup() {
    const count = ref(0)
    function increment() {
      count.value++
    }
    return { count, increment }
  }
}
```

// Объекты, возвращённые из setup, становятся доступны в шаблоне. 

### Работа с реактивностью: ref и reactive

#### ref — для простых типов

`ref` создаёт реактивную ссылку на примитив или объект. Чтобы получить или изменить значение, используйте свойство `.value`.

```js
import { ref } from 'vue'
const message = ref('Привет, Vue!')
message.value = 'Новый текст'
```

// Вы в любой момент можете присваивать новое значение через .value.

#### reactive — для объектов и массивов

Если работать хочется с объектами или массивами, удобней использовать `reactive` — он превращает весь объект целиком в реактивный:

```js
import { reactive } from 'vue'
const state = reactive({
  counter: 0,
  user: {
    name: 'Аня'
  }
})

state.counter++           // Автоматически обновит шаблон
state.user.name = 'Иван'
```

// Здесь весь state становится реактивным, все его свойства отслеживаются Vue.

### computed — вычисляемые значения

В Composition API вычисляемые значения создаются функцией `computed`. Это удобно для зависимых данных.

```js
import { ref, computed } from 'vue'

const count = ref(2)
const double = computed(() => count.value * 2)
```

// double будет обновляться автоматически, если поменяется count.value.

### watch и watchEffect — отслеживание изменений

Иногда нужно следить за изменениями переменных и запускать побочный эффект.

#### watch

`watch` позволяет следить за одной или несколькими реактивными переменными.

```js
import { ref, watch } from 'vue'

const name = ref('Аня')
watch(name, (newValue, oldValue) => {
  // Будет вызван при каждом изменении name.value
  console.log(`Имя изменилось: ${oldValue} → ${newValue}`)
})
```

// Можно следить и за computed, и за ref, и за массивами.

#### watchEffect

`watchEffect` отслеживает все реактивные переменные, которые используются внутри его функции.

```js
import { ref, watchEffect } from 'vue'

const price = ref(100)
watchEffect(() => {
  console.log(`Актуальная цена: ${price.value}`)
})
```

// Эффект будет запускаться каждый раз, когда price.value изменится.

### Взаимодействие с пропсами и событиями

#### Получение пропсов 

Внутри setup функция получает пропсы через первый аргумент:

```js
export default {
  props: {
    userId: String
  },
  setup(props) {
    console.log(props.userId)
  }
}
```

// Props — это реактивный объект, можно наблюдать за их изменениями.

#### Вызов событий

Вторым аргументом в setup поступает функция emit:

```js
export default {
  emits: ['save'],
  setup(props, { emit }) {
    function saveForm() {
      emit('save')
    }
    return { saveForm }
  }
}
```

// Теперь можете вызывать saveForm внутри шаблона, и событие "save" будет передано наружу.

### Переиспользование логики: composables

Одна из главных "фишек" Composition API — возможность переиспользовать логику легко и прозрачно. Выносите повторяющийся код в отдельные функции.

```js
// useCounter.js
import { ref } from 'vue'
export function useCounter() {
  const count = ref(0)
  function increment() {
    count.value++
  }
  return { count, increment }
}
```

И подключаете их в компонентах:

```js
<script setup>
import { useCounter } from './useCounter'

const { count, increment } = useCounter()
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>
```

// Здесь вы разбиваете код так, как удобно: бизнес-логику выносите в отдельные файлы и переиспользуете.

### Ограничения и "подводные камни" Composition API

- **Отслеживание вложенных изменений:** При использовании `reactive` с массивами и вложенными объектами не забывайте, что Vue отслеживает только существующие свойства. Если добавить новое свойство динамически, оно не станет реактивным.
- **ref внутри объектов:** Если создать объект с полями типа ref, обращайтесь к ним всегда через `.value` или распаковывайте их через `toRefs`.
- **Типизация:** При использовании TypeScript, Composition API работает гораздо удобнее и позволяет явно указывать типы ваших переменных.

## Пример: Todo список на Composition API

Давайте соберём простой Todo-компонент с добавлением задач:

```js
<script setup>
// Весь код внутри script setup будет доступен в шаблоне

import { ref } from 'vue'

const todos = ref([
  { text: 'Изучить Vue 3', done: false }
])
const newTodo = ref('')

function addTodo() {
  if (newTodo.value.trim()) {
    todos.value.push({
      text: newTodo.value,
      done: false
    })
    newTodo.value = ''
  }
}

function toggleTodo(index) {
  todos.value[index].done = !todos.value[index].done
}
</script>

<template>
  <div>
    <input v-model="newTodo" placeholder="Новая задача" />
    <button @click="addTodo">Добавить</button>
    <ul>
      <li v-for="(todo, index) in todos" :key="index">
        <label>
          <input type="checkbox" v-model="todo.done" @change="toggleTodo(index)" />
          <span :style="{ textDecoration: todo.done ? 'line-through' : 'none' }">{{ todo.text }}</span>
        </label>
      </li>
    </ul>
  </div>
</template>
```

// Здесь понятно видно — состояние лежит в ref, вся логика аккуратно размещена внутри setup, подключение в шаблоне выглядит просто.

## Взаимодействие с жизненным циклом компонента

Для реакций на жизненный цикл компонента предусмотрены специальные хуки: `onMounted`, `onUpdated`, `onUnmounted`, `onBeforeMount` и другие.

```js
import { ref, onMounted, onUnmounted } from 'vue'

const timer = ref(0)
let intervalId

onMounted(() => {
  intervalId = setInterval(() => {
    timer.value++
  }, 1000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})
```

// onMounted работает аналогично mounted, но теперь его можно вызывать сколько угодно раз и в любом месте setup либо в composables.

## Интеграция с Options API

Многие проекты переходят на Composition API постепенно. Композиционный и опционный API могут сосуществовать в одном проекте и даже в одном компоненте.

```js
export default {
  data() {
    return { a: 10 }
  },
  setup() {
    const b = ref(20)
    return { b }
  }
}
```

// В шаблоне этого компонента будет доступно и `a`, и `b`.

## Использование provide и inject

Composition API предоставляет удобный способ делиться состоянием между вложенными компонентами через provide и inject.

```js
// Родительский компонент
import { provide, ref } from 'vue'
export default {
  setup() {
    const color = ref('blue')
    provide('color', color)
  }
}

// Дочерний компонент
import { inject } from 'vue'
export default {
  setup() {
    const color = inject('color')
    // Теперь color можно использовать в шаблоне
    return { color }
  }
}
```

// Значения, переданные через provide, поддерживают реактивность, если делитесь ref или reactive.

## Реализация сложных логик с помощью composables

Рассмотрим реальный пример: создание composable, который будет отслеживать положение мыши.

```js
// useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event) {
    x.value = event.clientX
    y.value = event.clientY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))
  
  return { x, y }
}
```

```js
// В компоненте
<script setup>
import { useMouse } from './useMouse'

const { x, y } = useMouse()
</script>

<template>
  <p>Координаты мыши: {{ x }}, {{ y }}</p>
</template>
```

// Обратите внимание: состояния и коллбэки полностью изолированы, компонент просто подключает готовую функцию.

## Организация больших проектов с помощью Composition API

- **Группируйте бизнес-логику по отдельным composables.** Один composable — одна задача (например, форма, запрос к API, работа с локальным состоянием).
- **Используйте отдельные папки для composables.** Обычно их кладут в `src/composables`.
- **Используйте TypeScript для декларации возвращаемых типов и аргументов.**

Такой подход поможет вам безболезненно развивать проект, переиспользовать и тестировать логику.

---

Composition API в Vue 3 — это мощный инструмент, который открывает новые горизонты для структурирования вашего приложения. Он не отменяет Options API, но существенно дополняет его. С помощью Composition API вы получаете крайне гибкий и прозрачный способ работы с данными, жизненным циклом и логикой переиспользования.

## Частозадаваемые технические вопросы по теме

### Как получить доступ к this внутри setup?

В функции setup не существует контекста `this`, вместо этого используйте переменные, созданные внутри функции, либо повторно используйте ссылки из composables. Для доступа к свойствам компонента используйте первый аргумент функции (props), события через { emit }, а роутинг или store — импортируйте напрямую.

### Как вызвать методы жизненного цикла, если логика вынесена в composable?

Просто импортируйте хук (например, onMounted) из 'vue' и вызывайте его прямо внутри вашего composable. Vue корректно зарегистрирует все обработчики.

```js
// useInit.js
import { onMounted } from 'vue'
export function useInit() {
  onMounted(() => {
    // логика запуска
  })
}
```

### Можно ли использовать v-model с Composition API?

Да, вы можете использовать v-model, если возвращаете переменную из setup. Чтобы настроить v-model на кастомный компонент, используйте emit для события 'update:modelValue', и принимайте 'modelValue' как props.

### Как работает provide/inject в Composition API, если значение поменялось?

Если вы передали реактивное значение (ref или reactive), изменения будут автоматически распространяться на все дочерние компоненты, где оно инжектировано.

### Как типизировать props, возвращаемые значения и зависимости в Composition API при использовании TypeScript?

Декларируйте типы props через defineProps<[тип]>(), возвращаемые значения setup — через интерфейсы, composables — через явные типы. Используйте тип Ref<T> для ref-переменных:

```ts
import { Ref } from 'vue'
const count: Ref<number> = ref(0)
```