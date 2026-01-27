---
metaTitle: Модификаторы v-model v-model-modifiers в Vue 3
metaDescription: Разбираем модификаторы v-model v-model-modifiers в Vue 3 - как они работают какие бывают и как настраивать собственные модификаторы в компонентах
author: Олег Марков
title: Модификаторы v-model v-model-modifiers в Vue 3
preview: Узнайте как использовать модификаторы v-model в Vue 3 - встроенные и пользовательские модификаторы работа с формами и настройка поведения двустороннего связывания данных
---

## Введение

Модификаторы `v-model` (или `v-model modifiers`) в Vue 3 позволяют тонко управлять тем, как данные из пользовательского ввода попадают в состояние приложения и обратно. Вы не просто связываете значение поля ввода с переменной, а можете дополнительно:

- очищать и преобразовывать данные
- управлять моментом, когда происходит обновление значения
- настраивать поведение `v-model` в собственных компонентах
- сокращать объем кода в обработчиках событий

Смотрите, в этой статье я покажу вам, как работают стандартные модификаторы (`.lazy`, `.number`, `.trim`), как они устроены под капотом, а затем мы перейдем к пользовательским модификаторам в компонентах (`v-model` с объектом `modifiers`, использование `v-model:foo.bar` и собственная логика обработки).  

Мы будем опираться на Vue 3 (Composition API и Options API), но вы без проблем сможете применить знания и в реальных проектах на любом стиле.

---

## Базовое напоминание о v-model

Прежде чем разбираться с модификаторами, важно зафиксировать, что делает обычный `v-model`.

### Как работает v-model без модификаторов

Если вы пишете:

```html
<input v-model="message">
```

Vue делает за вас две вещи:

1. Читает значение поля ввода и записывает его в переменную `message`.
2. Следит за изменением `message` и обновляет DOM (значение `input`).

Под капотом это можно представить так:

```html
<input
  :value="message"               <!-- Привязка значения к input -->
  @input="event => message = event.target.value"  <!-- Обработка ввода -->
>
```

```js
export default {
  data() {
    return {
      message: '' // Здесь будет лежать строка из поля ввода
    }
  }
}
```

Как видите, `v-model` просто объединяет привязку `:value` и обработчик `@input` в один более удобный синтаксис.

### Где в этой схеме появляются модификаторы

Модификаторы позволяют добавить промежуточную логику между:

- событием DOM (например, `input` или `change`)
- обновлением значения в состоянии компонента

То есть, вместо:

```js
message = event.target.value
```

Vue сделает:

```js
message = преобразовать(нормализовать(event.target.value))
```

Теперь давайте разберемся с конкретными модификаторами.

---

## Встроенные модификаторы v-model для нативных элементов

В Vue есть три стандартных модификатора для работы с нативными элементами форм:

- `.lazy`
- `.number`
- `.trim`

Они работают на элементах:

- `input`
- `textarea`
- отчасти `select` (там поведение особое, мы затронем это отдельно)

### v-model.lazy – обновлять значение по событию change

По умолчанию `v-model` для текстовых полей обновляет значение при каждом событии `input`, то есть при каждом нажатии клавиши.  

Иногда это избыточно. Например, вы хотите начинать валидацию или отправку запросов только когда пользователь «закончил ввод» и ушел из поля.

Здесь и нужен `.lazy`.

```html
<input v-model.lazy="name">
```

Под капотом это будет эквивалентно примерно такому коду:

```html
<input
  :value="name"
  @change="event => name = event.target.value"  <!-- Используем change вместо input -->
>
```

```js
export default {
  data() {
    return {
      name: '' // Обновится, когда сработает событие change
    }
  }
}
```

#### Поведение события change

Смотрите, `change` срабатывает:

- при потере фокуса (если значение изменилось)
- при подтверждении ввода (например, в некоторых браузерах при нажатии Enter)
- для `select` — при выборе другого значения

Поэтому `.lazy` удобно использовать, если:

- вы хотите уменьшить количество дорогостоящих операций (например, запросов к API)
- вам не нужно знать каждое промежуточное состояние строки

#### Пример с валидацией

```html
<input v-model.lazy="email" @change="validateEmail">

<p v-if="error" style="color: red">{{ error }}</p>
```

```js
export default {
  data() {
    return {
      email: '',
      error: ''
    }
  },
  methods: {
    validateEmail() {
      // Здесь this.email уже обновлен, но только после change
      if (!this.email.includes('@')) {
        this.error = 'Неверный email'
      } else {
        this.error = ''
      }
    }
  }
}
```

Обратите внимание, валидация сработает не при каждом вводе символа, а только после завершения ввода.

---

### v-model.number – преобразование строки в число

Все значения, приходящие из `input`, изначально строки. Даже если вы используете `type="number"`, браузер все равно отдаст строку, и без конвертации вы получите, например:

- `'5' + '7'` → `'57'` (конкатенация строк)
- а не `12`

Модификатор `.number` решает эту проблему: Vue автоматически преобразует строку в число.

```html
<input v-model.number="age" type="number">
```

Под капотом это будет работать примерно так:

```html
<input
  :value="age"
  @input="event => {
    const value = event.target.value
    // Vue делает преобразование в число
    age = value === '' ? null : Number(value)
  }"
/>
```

```js
export default {
  data() {
    return {
      age: null // Здесь лежит число, а не строка
    }
  }
}
```

#### Важные нюансы .number

1. Преобразование происходит при каждом событии ввода (если вы не используете `.lazy` вместе с ним).
2. Если значение нельзя преобразовать в число (`Number(value)` дает `NaN`), Vue оставляет строку как есть. Это поведение важно помнить.

Давайте посмотрим пример с обработкой:

```html
<input v-model.number="amount" type="text">

<p>Тип значения - {{ typeof amount }}</p>
<p>Значение - {{ amount }}</p>
```

```js
export default {
  data() {
    return {
      amount: 0 // Начальное число
    }
  }
}
```

- Если вы введете `10`, в `amount` будет число `10`.
- Если вы введете `10abc`, `Number('10abc')` станет `NaN`, и Vue оставит `'10abc'` строкой.

Поэтому, если вы ожидаете строго числа, имеет смысл добавить дополнительную валидацию.

#### Комбинирование с .lazy

Вы можете комбинировать модификаторы:

```html
<input v-model.lazy.number="price" type="number">
```

В таком случае:

- значение обновится только при `change`
- и сразу будет преобразовано в `Number`

---

### v-model.trim – обрезка пробелов по краям

Модификатор `.trim` автоматически вызывает `.trim()` у строки (удаляет пробелы в начале и в конце).

```html
<input v-model.trim="username">
```

Под капотом это близко к следующему:

```html
<input
  :value="username"
  @input="event => {
    const value = event.target.value
    username = value.trim() // Удаляем пробелы по краям
  }"
/>
```

```js
export default {
  data() {
    return {
      username: '' // Здесь будет уже «очищенная» строка
    }
  }
}
```

#### Зачем нужен .trim

Посмотрите на распространенный сценарий:

- пользователь случайно добавляет пробел в начале или в конце
- вы потом сравниваете значения с логином, email, токеном и т.п.
- проверка не проходит из-за лишних пробелов

`.trim` решает это без дополнительных обработчиков событий.

---

### Комбинации встроенных модификаторов

Вы можете использовать несколько модификаторов сразу:

```html
<input v-model.lazy.trim="query">
```

Порядок записи модификаторов важен с точки зрения того, как вы читаете код, но Vue обрабатывает их как набор операций, которые вы задали.  

Например:

- `.lazy.trim` → событие `change`, затем тримминг строки
- `.trim.number` → сначала убираются пробелы, затем строка преобразуется в число

Пример:

```html
<input v-model.trim.number="amount">

<p>amount - {{ amount }} (тип {{ typeof amount }})</p>
```

```js
export default {
  data() {
    return {
      amount: null
    }
  }
}
```

Если вы введете строку `'  42  '`, сначала удалятся пробелы, затем строка `'42'` станет числом `42`.

---

## v-model и нативные элементы разных типов

Чтобы полнее понять, как работают модификаторы, полезно вспомнить, как `v-model` ведет себя с разными типами элементов.

### Текстовые input и textarea

- Событие по умолчанию: `input`
- Модификаторы:
  - `.lazy` → переключает на `change`
  - `.trim` → обрезает пробелы
  - `.number` → конвертирует в число

### Чекбоксы и радио-кнопки

Для `checkbox` и `radio` важны другие детали:

```html
<input type="checkbox" v-model="checked">
<input type="radio" v-model="choice" value="A">
```

- для `checkbox` значение — `true` или `false`, либо элементы массива
- для `radio` значение — значение атрибута `value`

Здесь встроенные модификаторы (`.number`, `.trim`) обычно не используются, но технически вы можете применить их, если планируете преобразовывать `value`:

```html
<input type="radio" v-model.number="choice" value="1">
<input type="radio" v-model.number="choice" value="2">
```

В этом случае `choice` будет числом (1 или 2), а не строкой `'1'` или `'2'`.

### select

В `select` значение тоже приходит как строка. При необходимости вы можете использовать `.number`:

```html
<select v-model.number="selectedId">
  <option value="1">Первый</option>
  <option value="2">Второй</option>
</select>
```

Здесь `selectedId` будет числом.

---

## v-model в компонентах и модификаторы

Теперь давайте перейдем к более интересной части — пользовательским модификаторам `v-model` внутри компонентов.

### Как v-model работает с компонентами

Когда вы пишете:

```html
<MyInput v-model="title" />
```

Vue преобразует это примерно в:

```html
<MyInput
  :modelValue="title"
  @update:modelValue="value => title = value"
/>
```

То есть:

- проп `modelValue` — входное значение
- событие `update:modelValue` — механизм обновления

Внутри компонента вы обычно:

- принимаете `modelValue` в `props`
- испускаете событие `update:modelValue` при изменении

```vue
<!-- MyInput.vue -->
<template>
  <input
    :value="modelValue"               <!-- Берем значение из пропа -->
    @input="onInput"                  <!-- При вводе генерируем событие -->
  >
</template>

<script>
export default {
  name: 'MyInput',
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  methods: {
    onInput(event) {
      // Здесь мы сами решаем, что отправить наружу
      const value = event.target.value
      this.$emit('update:modelValue', value)
    }
  }
}
</script>
```

Теперь самое важное: как к этому добавить модификаторы.

---

## Модификаторы v-model для пользовательских компонентов

Vue позволяет передавать модификаторы `v-model` в компонент и использовать их внутри. Смотрите, как это выглядит:

```html
<MyInput v-model.trim="username" />
```

Здесь `.trim` не обрабатывается автоматически, как для нативных элементов. Вместо этого Vue передаст информацию о модификаторе в компонент.

### Как модификаторы попадают внутрь компонента

Для первого `v-model`:

```html
<MyInput v-model.trim="username" />
```

Vue создаст проп:

- `modelModifiers` (обратите внимание на имя)

И передаст туда объект:

```js
{
  trim: true
}
```

Поэтому внутри компонента вы можете объявить:

```js
props: {
  modelValue: String,
  modelModifiers: {
    type: Object,
    default: () => ({})
  }
}
```

И использовать:

```js
methods: {
  onInput(event) {
    let value = event.target.value

    // Проверяем, есть ли модификатор trim
    if (this.modelModifiers.trim) {
      value = value.trim()
    }

    this.$emit('update:modelValue', value)
  }
}
```

Теперь давайте соберем полный пример.

---

### Пример компонента с поддержкой модификатора trim

```vue
<!-- TrimInput.vue -->
<template>
  <input
    :value="modelValue"       <!-- Получаем строку от родителя -->
    @input="onInput"          <!-- При каждом вводе обрабатываем значение -->
  >
</template>

<script>
export default {
  name: 'TrimInput',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    // Здесь Vue автоматически передаст объект модификаторов
    modelModifiers: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  methods: {
    onInput(event) {
      let value = event.target.value

      // Смотрите, мы сами решаем, как применять модификатор
      if (this.modelModifiers.trim) {
        value = value.trim()
      }

      this.$emit('update:modelValue', value)
    }
  }
}
</script>
```

Использование:

```html
<TrimInput v-model.trim="login" />
<TrimInput v-model="rawLogin" />
```

```js
export default {
  data() {
    return {
      login: '',
      rawLogin: ''
    }
  }
}
```

- Для `login` будет работать обрезка пробелов.
- Для `rawLogin` — нет, потому что модификатор не указан.

---

### Несколько v-model в одном компоненте и их модификаторы

В Vue 3 можно использовать несколько `v-model` с разными именами:

```html
<MyRange
  v-model:minValue="min"
  v-model:maxValue="max"
/>
```

Внутри компонент получит пропы:

- `minValue`
- `maxValue`

И события:

- `update:minValue`
- `update:maxValue`

Для модификаторов с именованным `v-model` Vue создаст отдельные пропы модификаторов по шаблону:

- `minValueModifiers`
- `maxValueModifiers`

Давайте разберемся на примере.

---

### Пример компонента с несколькими v-model и модификаторами

Представим компонент диапазона чисел:

```vue
<!-- RangeInput.vue -->
<template>
  <div>
    <input
      type="number"
      :value="minValue"
      @input="onMinInput"
    >
    <input
      type="number"
      :value="maxValue"
      @input="onMaxInput"
    >
  </div>
</template>

<script>
export default {
  name: 'RangeInput',
  props: {
    minValue: {
      type: Number,
      default: 0
    },
    maxValue: {
      type: Number,
      default: 100
    },
    // Модификаторы для minValue
    minValueModifiers: {
      type: Object,
      default: () => ({})
    },
    // Модификаторы для maxValue
    maxValueModifiers: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:minValue', 'update:maxValue'],
  methods: {
    onMinInput(event) {
      let value = event.target.value

      // Если передан модификатор number, конвертируем
      if (this.minValueModifiers.number) {
        value = Number(value)
      }

      this.$emit('update:minValue', value)
    },
    onMaxInput(event) {
      let value = event.target.value

      if (this.maxValueModifiers.number) {
        value = Number(value)
      }

      this.$emit('update:maxValue', value)
    }
  }
}
</script>
```

Использование:

```html
<RangeInput
  v-model:minValue.number="from"
  v-model:maxValue.number="to"
/>
```

```js
export default {
  data() {
    return {
      from: 10,
      to: 50
    }
  }
}
```

Как видите, вы сами определяете, какие модификаторы будут поддержаны и как именно они повлияют на данные.

---

## Собственные логические модификаторы

Самое интересное начинается, когда вы используете модификаторы не только для `.number` или `.trim`, а придумываете собственную логику.

Например, вы хотите модификатор:

- `.uppercase` — переводить текст в верхний регистр
- `.sanitize` — очищать HTML
- `.positive` — не допускать отрицательных чисел

### Пример собственного модификатора uppercase

Посмотрите, как это можно реализовать.

#### Компонент

```vue
<!-- CustomInput.vue -->
<template>
  <input
    :value="modelValue"
    @input="onInput"
  >
</template>

<script>
export default {
  name: 'CustomInput',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    modelModifiers: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  methods: {
    onInput(event) {
      let value = event.target.value

      // Если модификатор uppercase включен
      if (this.modelModifiers.uppercase) {
        value = value.toUpperCase()
      }

      // Можно комбинировать с trim, если вы решите его поддержать
      if (this.modelModifiers.trim) {
        value = value.trim()
      }

      this.$emit('update:modelValue', value)
    }
  }
}
</script>
```

#### Использование

```html
<CustomInput v-model.uppercase="title" />
<CustomInput v-model.uppercase.trim="shortTitle" />
```

```js
export default {
  data() {
    return {
      title: '',
      shortTitle: ''
    }
  }
}
```

Теперь вы увидите, как текст автоматически становится верхним регистром и при необходимости очищается от пробелов по краям.

---

### Модификаторы, влияющие на момент обновления

Вы также можете реализовать собственные аналогии `.lazy` внутри компонента.  

Например, модификатор `.lazyLocal` — хранить локальное значение и отправлять его наружу только при `blur`.

#### Пример: модификатор lazyLocal

```vue
<!-- SmartInput.vue -->
<template>
  <input
    :value="localValue"
    @input="onInput"
    @blur="onBlur"
  >
</template>

<script>
export default {
  name: 'SmartInput',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    modelModifiers: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      // Локальное состояние, чтобы не трогать modelValue сразу
      localValue: this.modelValue
    }
  },
  watch: {
    modelValue(newVal) {
      // Если родитель изменил значение, синхронизируем локальное
      this.localValue = newVal
    }
  },
  methods: {
    onInput(event) {
      this.localValue = event.target.value

      // Если модификатор lazyLocal не включен, сразу отправляем наружу
      if (!this.modelModifiers.lazyLocal) {
        this.$emit('update:modelValue', this.localValue)
      }
    },
    onBlur() {
      // Если lazyLocal включен, обновляем родителя только при blur
      if (this.modelModifiers.lazyLocal) {
        this.$emit('update:modelValue', this.localValue)
      }
    }
  }
}
</script>
```

Использование:

```html
<SmartInput v-model.lazyLocal="note" />
<SmartInput v-model="liveNote" />
```

Здесь вы сами контролируете, как и когда используются модификаторы.

---

## v-model и Composition API

До этого я показывал в основном Options API. Теперь давайте кратко посмотрим, как модификаторы работают с Composition API.

### Нативные элементы + script setup

```vue
<template>
  <input v-model.trim="name" />
  <input v-model.number="age" type="number" />
</template>

<script setup>
import { ref } from 'vue'

const name = ref('')
const age = ref(null)
</script>
```

Здесь все то же самое, модификаторы работают прозрачно, как и в Options API.

### Компоненты + script setup

#### Родитель

```vue
<template>
  <CustomInput v-model.uppercase="title" />
</template>

<script setup>
import { ref } from 'vue'
import CustomInput from './CustomInput.vue'

const title = ref('')
</script>
```

#### Дочерний компонент

```vue
<!-- CustomInput.vue -->
<template>
  <input
    :value="modelValue"
    @input="onInput"
  >
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  modelModifiers: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

function onInput(event) {
  let value = event.target.value

  if (props.modelModifiers.uppercase) {
    value = value.toUpperCase()
  }

  emit('update:modelValue', value)
}
</script>
```

Здесь вся логика та же, только синтаксис другой.

---

## Типичные ошибки и подводные камни при работе с v-model-modifiers

Чтобы вам не наступать на одни и те же грабли, давайте перечислим частые проблемы.

### 1. Ожидание, что .trim и .number будут работать в компонентах «магически»

Для нативных элементов `.trim` и `.number` обрабатывает сам Vue.  

Для пользовательских компонентов:

- Vue лишь передает информацию о модификаторах через `modelModifiers`
- все преобразования вы должны реализовать сами

Если вы написали:

```html
<MyInput v-model.trim.number="value" />
```

и внутри не используете `modelModifiers`, модификаторы просто не сработают.

### 2. Неверные имена пропов модификаторов для именованных v-model

Для первого `v-model`:

- значение — `modelValue`
- модификаторы — `modelModifiers`

Для других `v-model`:

- значение — `<имя>`
- модификаторы — `<имя>Modifiers`

Пример:

```html
<MyComp v-model:title.trim="title" v-model:count.number="count" />
```

В компоненте должны быть пропы:

```js
props: {
  title: String,
  count: Number,
  titleModifiers: Object,
  countModifiers: Object
}
```

Если вы случайно назовете проп `titleModifier` (без `s` на конце), Vue просто не передаст туда модификаторы.

### 3. Забытый emits

Если вы объявили `emits`, но забыли туда добавить `update:modelValue` (или `update:yourProp`), Vue выдаст предупреждение, а `v-model` работать не будет как ожидается.

```js
export default {
  emits: ['update:modelValue'] // сюда нужно явно добавить событие
}
```

Если `emits` нет, Vue в режиме разработки тоже может подсказать о неожиданных событиях.

### 4. Сложные преобразования без учета типа данных

Если вы используете `.number` и затем пытаетесь, например, вызвать у значения строковый метод, возможны ошибки.  

Лучше всегда выносить сложную логику в отдельные функции и явно проверять типы.

---

## Заключение

Модификаторы `v-model` в Vue 3 — это удобный механизм, который позволяет:

- управлять моментом обновления значения (`.lazy`)
- автоматически приводить входные данные к нужному типу (`.number`)
- очищать строки от лишних пробелов (`.trim`)
- настраивать собственные правила обработки в компонентах через `modelModifiers` и `<propName>Modifiers`

Если вы работаете с формами, модификаторы помогают убрать дублирующийся код из обработчиков событий, а в случае пользовательских компонентов — сделать их более универсальными и настраиваемыми.  

Ключевой момент: для нативных элементов встроенные модификаторы работают автоматически, а для компонентов вы сами отвечаете за то, как и когда применять модификаторы, которые передает Vue.

Используя `v-model-modifiers` осознанно, вы можете значительно упростить работу с формами и сделать компоненты более гибкими без лишней сложности.

---

## Частозадаваемые технические вопросы

### 1. Как применить несколько разных v-model с разными модификаторами в одном компоненте

Вы можете комбинировать именованные `v-model` с разными модификаторами:

```html
<MyField
  v-model:title.trim="title"
  v-model:price.number="price"
/>
```

Внутри компонента:

```js
props: {
  title: String,
  price: Number,
  titleModifiers: {
    type: Object,
    default: () => ({})
  },
  priceModifiers: {
    type: Object,
    default: () => ({})
  }
},
emits: ['update:title', 'update:price']
```

В обработчиках проверяете `props.titleModifiers` и `props.priceModifiers` и применяете соответствующие преобразования.

---

### 2. Как организовать типизацию модификаторов v-model в TypeScript

В `<script setup lang="ts">` вы можете явно описать тип модификаторов:

```ts
type ModelModifiers = {
  trim?: boolean
  number?: boolean
  uppercase?: boolean
}

const props = defineProps<{
  modelValue: string
  modelModifiers?: ModelModifiers
}>()
```

Далее используйте `props.modelModifiers?.trim` и получайте подсказки типов. Для именованных `v-model` аналогично описывайте `<propName>Modifiers`.

---

### 3. Как сделать модификатор, который работает и в нативном input и в компоненте одинаково

Решение — выносите логику в отдельную функцию и вызывайте ее:

- для нативного `input` в обработчике `@input`
- в компоненте — внутри `onInput` с проверкой модификаторов

```js
function sanitize(value) {
  // Здесь вы очищаете строку от опасных символов
  return value.replace(/<[^>]*>/g, '')
}
```

В компоненте:

```js
if (props.modelModifiers.sanitize) {
  value = sanitize(value)
}
```

В шаблоне нативного input:

```html
<input :value="text" @input="e => text = sanitize(e.target.value)" />
```

---

### 4. Как применять модификаторы к v-model в шаблонных рефах (v-for или динамических формах)

Если вы рендерите список полей через `v-for`, модификаторы работают так же:

```html
<input
  v-for="(item, index) in items"
  :key="index"
  v-model.trim="item.value"
/>
```

Важно помнить, что модификатор применяется к каждому полю отдельно, потому что `item.value` — конкретная ссылка на значение. Дополнительно ничего настраивать не нужно.

---

### 5. Как реализовать модификатор, который отменяет ввод по определенному правилу

Например, вы хотите модификатор `.digitsOnly`, который не пропускает нецифровые символы.  

В компоненте:

```js
onInput(event) {
  let value = event.target.value

  if (this.modelModifiers.digitsOnly) {
    const filtered = value.replace(/\D+/g, '') // Удаляем все нецифры
    // Обновляем DOM, если строка изменилась
    if (filtered !== value) {
      event.target.value = filtered
    }
    value = filtered
  }

  this.$emit('update:modelValue', value)
}
```

Так вы не только отправляете наружу очищенное значение, но и обновляете само поле ввода, чтобы пользователь видел результат фильтрации сразу.