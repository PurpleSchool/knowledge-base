---
metaTitle: Применение script setup синтаксиса во Vue 3
metaDescription: Узнайте как script setup во Vue 3 позволяет упростить компоненты - примеры использования, преимущества синтаксиса, инструкции по переходу и рекомендации для работы с props, emits и шаблонами
author: Олег Марков
title: Применение script setup синтаксиса в Vue 3 для упрощения компонентов
preview: Поймите как script setup упрощает работу с компонентами во Vue 3 - основные возможности, теоретические основы и развернутые примеры для современного фронтенда
---

## Введение

С релизом Vue 3 разработчики получили не просто новый движок, но и фундаментальные изменения в работе с компонентами. Одно из сильнейших нововведений — синтаксис `script setup`. Это способ организации кода, который существенно упрощает написание и читаемость компонентов. Благодаря этому синтаксису можно не только избавиться от лишней "обвязки", но и писать код максимально просто, прозрачно и эффективно. В этой статье я покажу, как `script setup` повышает качество работы с Vue 3, разберу его основные возможности, проиллюстрирую использование на практике, а также дам рекомендации по переходу со старых подходов.

## Преимущества и предназначение синтаксиса script setup

Сначала давайте разберемся, зачем вообще понадобился новый синтаксис.

### Почему потребовалось обновление синтаксиса

До появления `script setup` большинство компонентов во Vue описывались или в Options API (с известными блоками props, data, methods, computed и так далее), или через Composition API (export default {}, с использованием функций в блоке script). Итог - очень много "болтовни", большого количества кода, который повторяется от компонента к компоненту, и запутывается между JavaScript и шаблоном.

`script setup`, появившийся в Vue 3.2 и выше, позволяет радикально сокращать подобную "обвязку", повышая скорость работы и читабельность. Это компиляторный фичер, который работает на этапе сборки кода, делая её максимально легкой для разработчика.

### Преимущества script setup

- Значительно меньше лишнего кода и шаблонных конструкций.
- Лучшая поддержка TypeScript за счет автотипизации.
- Более явное связывание JavaScript и шаблона.
- Прямой доступ к переменным, функциям и реактивным данным внутри шаблона.
- Локальный scoping и отсутствие конфликтов with this.

Давайте сразу на практическом примере посмотрим, в чем отличие.

#### Пример на классическом Composition API

```vue
<script>
import { ref } from 'vue'

export default {
  setup() {
    // Создаем реактивную переменную
    const counter = ref(0)
    // Функция для инкремента
    function increase() {
      counter.value++
    }
    // Возвращаем переменные и функции для шаблона
    return { counter, increase }
  }
}
</script>

<template>
  <button @click="increase">Value {{ counter }}</button>
</template>
```

#### Тот же пример на script setup

```vue
<script setup>
import { ref } from 'vue'

// Сразу определяем реактивную переменную
const counter = ref(0)
// Функция для инкремента
function increase() {
  counter.value++
}
</script>

<template>
  <button @click="increase">Value {{ counter }}</button>
</template>
```

Как видите, стало на порядок короче. Нет ни export default, ни return. Всё работает проще.

## Как работает script setup под капотом

Давайте разберемся, почему этот синтаксис делает работу проще.

### Краткая суть

- Всё, что вы объявляете в блоке `<script setup>`, становится видимым в шаблоне (template).
- Не нужно вручную что-то возвращать из функции setup, как это было раньше.
- Все импорты, переменные, функции, реактивные свойства — доступны в шаблоне автоматически.
- Поддерживается прямое подключение props, emits, slots и provide/inject.

Этот подход облегчает перенос кода, улучшает масштабируемость и тестируемость компонентов.

### Как это работает при компиляции

Компилятор Vue обрабатывает `<script setup>` и генерирует необходимый "classical" Vue-компонент, просто избавляя вас от необходимости писать объёмный шаблон с return и export default. Все элементы из блока script setup автоматически инкапсулируются и подготавливаются для шаблона.

## Использование props и emits с script setup

Одна из сильных сторон Vue — возможность определять пропсы и события (emits). Синтаксис script setup здесь тоже упрощает код.

### Как объявлять props

Смотрите, как можно объявить пропсы:

```vue
<script setup>
defineProps({
  title: String,
  count: {
    type: Number,
    required: true
  }
})
</script>

<template>
  <h1>{{ title }} ({{ count }})</h1>
</template>
```

Если вы используете TypeScript, объявить пропсы можно так:

```vue
<script setup lang="ts">
interface Props {
  title: string
  count: number
}

const props = defineProps<Props>()
</script>
```

#### Особенности работы с defineProps

- Если вы не сохраняете результат в переменную, поля становятся доступны напрямую — это удобно.
- Если требуется сложная логика работы с пропсами, присваивайте результат в переменную `const props = defineProps()`.

### Как объявлять emits

Объединяем переход к событийному API через defineEmits:

```vue
<script setup>
const emit = defineEmits(['submit', 'cancel'])

function onSubmit() {
  // ...какая-то логика
  emit('submit')
}
</script>
```

В случае TypeScript вы можете типизировать события:

```vue
<script setup lang="ts">
const emit = defineEmits<{
  (event: 'submit', value: number): void,
  (event: 'cancel'): void
}>()
</script>
```

Теперь события строго типизированы, ошибок будет меньше.

## Работа с реактивностью и вычисляемыми значениями

В script setup поддерживаются все возможности реактивности Vue — ref, reactive, computed и watch.

### Пример с ref и computed

```vue
<script setup>
import { ref, computed } from 'vue'

// Обычная реактивная переменная
const firstName = ref('')
const lastName = ref('')

// Вычисляемое значение
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
</script>

<template>
  <label>
    Имя: <input v-model="firstName" />
  </label>
  <label>
    Фамилия: <input v-model="lastName" />
  </label>
  <p>Полное имя: {{ fullName }}</p>
</template>
```

Здесь fullName автоматически обновится, когда firstName или lastName изменится.

### Использование watch

Всё как в Composition API, только никаких return и export default:

```vue
<script setup>
import { ref, watch } from 'vue'

const msg = ref('Hello')

watch(msg, (newVal, oldVal) => {
  // Этот блок запустится при изменении msg
  console.log(`Сообщение изменилось: с "${oldVal}" на "${newVal}"`)
})
</script>
```

## Использование provide/inject

Иногда компоненты обмениваются состоянием через provide/inject. Синтаксис в `script setup` становится даже проще:

```vue
<!-- Provider.vue -->
<script setup>
import { provide } from 'vue'

const theme = ref('light')
provide('theme', theme)
</script>

<template><!-- ... --></template>
```

```vue
<!-- Consumer.vue -->
<script setup>
import { inject } from 'vue'

const theme = inject('theme', ref('default'))
</script>

<template>
  <div>Тема: {{ theme }}</div>
</template>
```

## Работа с слотами в script setup

Вам не нужно явно описывать slots — они будут автоматически доступны через специальный объект `useSlots`.

Пример:

```vue
<script setup>
const slots = useSlots()
</script>

<template>
  <div>
    <header v-if="slots.header">
      <slot name="header"></slot>
    </header>
    <main>
      <slot></slot>
    </main>
  </div>
</template>
```

## Реализация реактивных методов и обработчиков событий

Вам доступны любые методы и слушатели, а писать их в script setup особенно удобно.

```vue
<script setup>
const count = ref(0)

function increment() {
  count.value++
}

function reset() {
  count.value = 0
}
</script>

<template>
  <button @click="increment">+1</button>
  <button @click="reset">Сброс</button>
  <span>Значение: {{ count }}</span>
</template>
```

## Использование внешних composables

Script setup отлично интегрируется с composables — переиспользуемыми функциями для логики.

```js
// useCounter.js
import { ref } from 'vue'
export function useCounter() {
  const count = ref(0)
  const inc = () => count.value++
  return { count, inc }
}
```

```vue
<script setup>
import { useCounter } from './useCounter'

const { count, inc } = useCounter()
</script>

<template>
  <button @click="inc">+1</button>
  <span>{{ count }}</span>
</template>
```

## Использование TypeScript

Script setup был разработан с прицелом на лаконичную работу с TypeScript. Вам доступны:

- Автоматическая типизация props и emits.
- Type-only import (`import type { MyType } from './types'`)
- Явное определение структур без дублирования кода.

Пример:

```vue
<script setup lang="ts">
import type { Todo } from './types'

defineProps<{
  todos: Todo[]
}>()
</script>
```

## Интеграция с серверным рендерингом (SSR)

Script setup полностью совместим с Nuxt 3 и другими решениями SSR на Vue 3. Работа со стейтом, props, emits и реактивностью происходит так же, как на клиенте.

## Особенности scoped CSS с script setup

Никаких ограничений — используйте `<style scoped>` как обычно. script setup никак не мешает организации стилей и хорошо работает с CSS Variables, preprocessors, и модульными стилями.

## Чем не является script setup

- Это не замена всему, что было до этого — Options API продолжает поддерживаться.
- Не подходит для случаев, когда нужен доступ к компоненту как объекту, например, для плагинов.
- Некоторые advanced-patterны вроде render-функций вам придется реализовать иначе.

## Советы по переходу на script setup

1. Поочередно переписывайте компоненты, начиная с простейших.
2. Если внутри компонента много сложных computed/watched свойств, переход окупится быстрее.
3. Не забывайте тестировать функции в script setup через unit-тесты.
4. Используйте linter и автотесты для контроля за переходом.

## Заключение

Script setup — это современный способ написания компонентов во Vue 3, который уменьшает объем шаблонного кода, увеличивает прозрачность связей между логикой и представлением и делает интеграцию с TypeScript и разработку на Vue проще и приятнее. Несмотря на простой синтаксис, функционал не теряется: доступны все механизмы реактивности, composables, props, emits, slots и многое другое. Если вы хотите писать компоненты быстро и понятно, этот синтаксис станет незаменимым инструментом для вашей команды.

---

## Частозадаваемые технические вопросы по теме и их решения

### Как динамически определять список props, если их структура заранее неизвестна?

Используйте интерфейсы (в TypeScript) или функцию defineProps(), чтобы определить тип как Record<string, any>:

```vue
<script setup lang="ts">
const props = defineProps<Record<string, unknown>>()
</script>
```
Это позволит принимать любой набор ключей на уровне props.

---

### Как подключать provide/inject для сложных типов с TypeScript?

Определяйте тип при вызове inject:

```vue
const user = inject<User>('userKey')
```

---

### Как использовать глобальные миксины или плагины внутри script setup?

Если миксин содержит методы, импортируйте их как функции или используйте provide/inject. Для глобальных плагинов (например, $axios), обращайтесь через getCurrentInstance:

```js
import { getCurrentInstance } from 'vue'
const { proxy } = getCurrentInstance()
proxy.$axios.get(…)
```

---

### Можно ли объединять несколько блоков script setup в одном компоненте?

Нет, только ОДИН <script setup> допустим на компонент. Для логического разбиения используйте обычный <script> вместе с <script setup> или выносите логику в composables.

---

### Что делать, если вашему плагину нужен доступ к экземпляру компонента?

Получите доступ с помощью getCurrentInstance внутри script setup:

```js
import { getCurrentInstance } from 'vue'
const instance = getCurrentInstance()
```
Теперь instance.proxy даст вам this-компонента, чтобы вызывать методы или свойства плагинов.

---