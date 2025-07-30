---
metaTitle: Типизация и использование TypeScript в Vuejs
metaDescription: Раскройте эффективные подходы к типизации и применению TypeScript в Vuejs - подробные инструкции, практические примеры, советы по интеграции и организация типов
author: Олег Марков
title: Типизация и использование TypeScript в Vuejs
preview: Погрузитесь в мир типизации с TypeScript в Vuejs - разбор ключевых концепций, практических примеров и лучших подходов для создания надежных Vue приложений
---

## Введение

Современная разработка фронтенда невозможна без качественной типизации, особенно если вы разрабатываете сложные и масштабируемые приложения. Языки с динамической типизацией, такие как JavaScript, зачастую становятся причиной неожиданных ошибок на этапе исполнения. Именно поэтому многие команды переходят на TypeScript — статически типизированное надмножество JavaScript, позволяющее находить ошибки на этапе компиляции и обеспечивать лучшую читаемость кода.

Vue.js — один из самых популярных фронтенд-фреймворков, который активно поддерживает интеграцию с TypeScript, начиная с версии 2.x, а с выходом Vue 3 работа с типами стала еще проще. В этой статье я подробно расскажу, как организовать типизацию в проектах на Vue.js, приведу примеры кода и пояснения к ним. Мы рассмотрим, как подключить TypeScript, какие есть подходы к написанию компонентов, как типизировать props, emit-события, provide/inject, state и многое другое.

## Интеграция TypeScript в Vue.js

### Почему стоит использовать TypeScript с Vue.js

TypeScript значительно увеличивает надежность кода. Вот несколько основных причин использовать его с Vue:

- **Раннее обнаружение ошибок** — проверка типов еще до запуска приложения.
- **Поддержка редакторов кода** — автодополнение, рефакторинг, навигация по коду.
- **Ясность структуры данных** — проще поддерживать и расширять проект.
- **Улучшение документации** — типы выступают как дополнительная документация для вашей команды.

Использование TypeScript в Vue.js проектах значительно повышает надежность кода, упрощает его поддержку и позволяет избежать многих ошибок на этапе разработки. Однако, для эффективного применения TypeScript необходимо глубокое понимание системы типов и особенностей интеграции с Vue. Если вы хотите освоить эффективные подходы к типизации в Vue, научиться интегрировать TypeScript в свои проекты и организовывать типы — приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=tipizaciya-i-ispolzovanie-typescript-v-vuejs). На курсе 173 уроков и 21 упражнение, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Начало работы: настройка окружения

Для начала потребуется создать проект Vue с поддержкой TypeScript. Самый простой способ — использовать официальный Vue CLI.

```bash
vue create my-vue-ts-project
```

В процессе создания выберите опцию **TypeScript**. Если вы уже используете Vite, просто выполните:

```bash
npm create vite@latest my-vue-ts-app -- --template vue-ts
```

> После этого у вас уже будет преднастроенная структура файлов с поддержкой TypeScript.

### Конфигурация tsconfig.json

Файл `tsconfig.json` создается автоматически, но иногда его нужно подправить под ваши нужды. Например, если вы используете alias-импорты или специфические настройки компилятора.

Важные параметры:
- `strict: true` — рекомендуемый режим для строгой проверки типов.
- `jsx: "preserve"` — если вы планируете использовать JSX/TSX внутри Vue.
- `types` — явно указать глобальные типы или типы плагинов, если требуется.

Вот пример минимальной конфигурации:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "strict": true,
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "allowJs": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules"]
}
```
> Добавление "src/**/*.vue" в "include" обязательно для корректной работы с .vue файлами.

## Синтаксис: использование TypeScript в Vue-компонентах

В Vue 3 появилась сильная поддержка TypeScript из коробки. Рассмотрим основные способы объявления компонентов.

### SFC (Single File Component) с <script lang="ts">

Это рекомендуемый подход: каждый компонент живет в своем `.vue` файле.

```js
<template>
  <div>{{ count }}</div>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue'

export default defineComponent({
  setup() {
    // Тип переменной подсчитывается автоматически как Ref<number>
    const count = ref(0)
    return { count }
  }
})
</script>
```

Как видите, при использовании Composition API и TypeScript редактор кода всегда знает, какие значения и методы доступны внутри шаблона. Этот подход минимизирует количество ручного объявления типов, делая код чище и надежнее.

### Класс-компоненты (Class Components)

Ранее активно применялись с помощью библиотеки [vue-class-component](https://github.com/vuejs/vue-class-component). Сейчас этот подход используется реже, так как Composition API предлагает большую гибкость и лучшие возможности для типизации.

Пример класс-компонента:

```ts
import { Vue, Options } from 'vue-class-component'

@Options({
  props: {
    msg: String
  }
})
export default class HelloWorld extends Vue {
  msg!: string

  mounted() {
    // Здесь msg уже типизирована как string
    console.log(this.msg)
  }
}
```
> В современных проектах рекомендуется использовать Composition API.

### Composition API с setup и defineComponent

Composition API, появившийся в Vue 3, предлагает компактный синтаксис и лучшую интеграцию с TypeScript.

```js
<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const message = ref<string>('Привет, мир!')
    return { message }
  }
})
</script>
```
> Тип переменной message строго задан, ошибка типа будет сразу видна в редакторе.

## Типизация props, emits, slots

### Типизация props

TypeScript позволяет явно указывать типы props с помощью дженериков и отдельных интерфейсов.

#### Использование с defineProps (SFC с <script setup>)

Vue 3 поддерживает `<script setup>` — это самый лаконичный способ сочетания Vue и TypeScript.

```js
<script lang="ts" setup>
interface Props {
  title: string
  count?: number
}

const props = defineProps<Props>()
</script>
```

Для дефолтных значений используйте defineProps + слияние с default-значениями:

```js
<script lang="ts" setup>
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})
</script>
```
> Теперь props.count будет всегда числом, ошибок типов не возникнет.

#### TypeScript и классический синтаксис

Если используете объектный синтаксис:

```ts
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    title: {
      type: String,
      required: true
    },
    count: Number
  }
})
```
> В этом случае проверка типов будет только на уровне рантайма.

### Типизация emits

События можно типизировать с помощью defineEmits.

```js
<script lang="ts" setup>
const emit = defineEmits<{
  (e: 'increment', value: number): void
  (e: 'close'): void
}>()

function inc() {
  emit('increment', 5) // Ошибка компиляции, если передан не number
}
</script>
```

### Типизация slots

```js
<script lang="ts" setup>
interface Slots {
  default: (props: { text: string }) => any
  header?: (props: { title: string }) => any
}

const slots = defineSlots<Slots>()
</script>
```
> Теперь при обращении к слоту в шаблоне или коде получите автодополнение с типами пропсов.

## Типизация реактивных переменных и computed

### ref и reactive

`ref` и `reactive` автоматически выводят тип, но иногда бывает нужно указать его явно:

```ts
import { ref, reactive } from 'vue'

// Явно указываем тип переменной
const loading = ref<boolean>(false)

// Типизация сложных объектов
interface User {
  id: number
  name: string
}

const user = reactive<User>({ id: 0, name: '' })
```

### computed

Для вычисляемых значений указывайте тип возвращаемого значения:

```ts
import { computed, ref } from 'vue'

const count = ref(5)

const doubled = computed<number>(() => count.value * 2)
```
> В случае передачи функции в computed редактор сам определит тип, но если функция сложная, всегда полезно прописывать его явно.

## Типизация provide и inject

При использовании dependency injection важно типизировать данные, чтобы избежать ошибок.

```ts
import { provide, inject } from 'vue'

interface AppConfig {
  apiUrl: string
}

provide('appConfig', { apiUrl: 'https://api.ex.com' })

// В другом компоненте:
const config = inject<AppConfig>('appConfig')
if (config) {
  console.log(config.apiUrl)
}
```
> Если inject не найдет значение, вернет undefined, поэтому всегда делайте проверку.

## Указание и организация типов

### Вынос типов в отдельные файлы

Хорошая практика — выносить интерфейсы и типы в отдельные файлы, например `types.ts`, особенно если типы используются в нескольких компонентах.

```ts
// src/types.ts
export interface User {
  id: number
  name: string
}
```

```ts
// В компоненте
import type { User } from '@/types'

const user = ref<User>({ id: 1, name: 'Алиса' })
```

### Реализация глобальных типов

Для глобальных свойств (например, $http) можно добавить типизацию путем расширения интерфейсов:

```ts
// src/shims-vue.d.ts
import { ComponentCustomProperties } from 'vue'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $http: typeof axios
  }
}
```

> Теперь во всех компонентах this.$http будет корректно определен.

## Тестирование типов

TypeScript помогает находить ошибки, но в случае сложных типов полезно писать отдельные unit-тесты на типы с помощью [tsd](https://github.com/SamVerschueren/tsd) или аналогичных инструментов.

Пример проверки корректности типа через то, что некорректные значения вызовут ошибки компиляции:

```ts
// test-types.ts
import { expectType } from 'tsd'

// Проверяем, что value — строка
expectType<string>(props.value)
```

## Работа с сторонними библиотеками

Большинство популярных библиотек для работы с Vue (например, Vue Router, Vuex, Pinia) тоже поддерживают TypeScript. Важно проверять, что у новых подключаемых библиотек есть глобальные определения типов, либо добавлять их вручную через DefinitelyTyped (`@types/*`).

Пример с типизацией стора Pinia:

```ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0 as number
  }),
  actions: {
    increment() {
      this.count++
    }
  }
})
```
> TypeScript обеспечит строгую типизацию state и методов.

## Ошибки и подводные камни типизации

- **Некорректная типизация пропсов** — если не указать тип интерфейса у props, TypeScript будет выводить `any`.
- **Ограничения типизации шаблона (template)** — типы проверяются в script-блоке, но не всегда в шаблоне. Следует использовать `<script setup>`, чтобы получать автодополнение и проверки типов прямо в шаблоне.
- **Типы provide/inject** — нет гарантии, что injected значение не undefined. Я рекомендую всегда делать проверки или использовать non-null assertion.
- **Работа с this в Options API** — в классическом синтаксисе типизация this сложна, используйте Composition API где возможно.

## Заключение

TypeScript серьезно упрощает жизнь разработчикам Vue-приложений благодаря статической проверке типов, улучшенной читаемости и лучшей документации кода. С развитием Vue 3 интеграция TypeScript стала максимально гладкой и мощной: достаточно использовать `<script lang="ts">` или `<script setup lang="ts">`, чтобы получить все плюсы статической типизации.

Обратная совместимость, большой выбор инструментов, поддержка сторонних библиотек и удобный DX делают связку Vue.js + TypeScript лучшим выбором для профессиональной разработки современного фронтенда. Используйте типы для props, events, slots, реактивных данных, глобальных свойств, выносите типы в отдельные файлы и тестируйте их — так вы избежите массы неприятных сюрпризов на продакшн-этапе.

Важно также понимать принципы работы с компонентами, маршрутизацией и управлением состоянием.  Освойте все необходимые навыки для создания современных веб-приложений на Vue с помощью курса [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=tipizaciya-i-ispolzovanie-typescript-v-vuejs). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Vue прямо сейчас.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

#### Как правильно типизировать refs на DOM-элементы?

Используйте дженерик параметр `<HTMLElement | null>` для ref, чтобы указать, что ссылка может быть как на элемент, так и null до монтирования:
```ts
import { ref, onMounted } from 'vue'
const inputRef = ref<HTMLInputElement | null>(null)
onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
})
```

#### Как типизировать параметры v-model с TypeScript?

Если используете v-model, обязательно используйте явную типизацию:
```js
<script lang="ts" setup>
const modelValue = defineModel<string>()
</script>
```
Если на emits, то добавляйте соответствующий тип для событий:
```ts
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
```

#### Как типизировать глобальные плагины или расширить глобальные свойства?

Расширяйте `ComponentCustomProperties` в файле `shims-vue.d.ts`:
```ts
import { ComponentCustomProperties } from 'vue'
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $myService: MyServiceType
  }
}
```

#### Как использовать типизацию для динамических компонентов?

Импортируйте компонент с defineAsyncComponent или через defineComponent и используйте тип компонента:
```ts
import { defineAsyncComponent, type DefineComponent } from 'vue'
const MyComp = defineAsyncComponent(() => import('./MyComp.vue')) as DefineComponent<MyPropsType>
```

#### Почему в шаблоне иногда нет автодополнения props/методов в TypeScript?

Это происходит если используете старый синтаксис `<script>` без setup или неправильную конфигурацию IDE. Используйте `<script setup lang="ts">` для максимального автодополнения, и убедитесь, что у вас установлены последние расширения поддержки для Vue и TypeScript.
