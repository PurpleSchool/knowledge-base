---
metaTitle: Руководство по использованию TypeScript в Nuxt
metaDescription: Пошаговое руководство по добавлению и эффективному применению TypeScript в Nuxt - настройка, примеры, лучшие практики, частые вопросы
author: Олег Марков
title: Руководство по использованию TypeScript в Nuxt
preview: Погрузитесь в интеграцию TypeScript с Nuxt - от установки до сложной типизации, примеры кода и советы для улучшения качества ваших проектов
---

## Введение

Nuxt — это мощный фреймворк для разработки серверных и клиентских приложений на основе Vue. TypeScript, в свою очередь, предоставляет строгую статическую типизацию для JavaScript, делая код более предсказуемым, поддерживаемым и удобным для масштабирования. В современных проектах все чаще возникает задача объединить Nuxt и TypeScript для создания надежных веб-приложений.

В этом руководстве вы найдете подробные инструкции о том, как подключить и использовать TypeScript в проектах Nuxt. Мы рассмотрим настройку среды, примеры кода, правильную организацию файлов и папок, а также типизацию различных аспектов Nuxt — страниц, компонентов, плагинов и стор. Я также расскажу об особенностях типизации во Vue-компонентах и покажу, как легко пользоваться современными возможностями TypeScript в приложении Nuxt.

## Начало работы с TypeScript в Nuxt

### Установка Nuxt с поддержкой TypeScript

Начать можно с нуля либо добавить TypeScript в текущий проект Nuxt. Новый проект создавать просто:

```bash
npx nuxi init my-nuxt-app
cd my-nuxt-app
npm install
```

Теперь добавьте TypeScript:

```bash
npm install --save-dev typescript @nuxt/types @types/node
```

Если вы уже пользуетесь Nuxt версии 3, все еще проще — там поддержка TypeScript встроена практически "из коробки". Стоит только добавить файл конфигурации `tsconfig.json`, и вы сразу же можете писать код на TypeScript.

### Создание tsconfig.json

Вот базовый файл `tsconfig.json`, подходящий для Nuxt-проектов:

```json
{
  "extends": "./.nuxt/tsconfig.json", // Подключение базовых настроек от Nuxt
  "include": [
    "nuxt.config.ts",
    "app.vue",
    "components/**/*",
    "pages/**/*",
    "plugins/**/*",
    "composables/**/*",
    "store/**/*",
    "types/**/*"
  ]
}
```

Обратите внимание, что если файл `.nuxt/tsconfig.json` еще не создан, его создаст сам Nuxt после первого запуска командой `npm run dev`.

### Изменение расширения файлов на TypeScript

Следующий шаг: замените расширение `.js` на `.ts`, `.vue`-файлы оставьте как есть, но внутри них можете использовать `<script lang="ts">`. Например:

```js
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MyComponent',
  props: {
    count: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    // props уже типизированы
    return { double: props.count * 2 }
  }
})
</script>
```

Такая структура позволит сразу использовать все преимущества автодополнения и проверки типов средствами редактора.

TypeScript значительно повышает надежность и поддерживаемость Nuxt-приложений, но требует понимания статической типизации и умения правильно использовать типы. Важно не только знать синтаксис TypeScript, но и уметь проектировать сложные типы, использовать generics и создавать декларации для сторонних библиотек. Если вы хотите стать экспертом в использовании TypeScript в Nuxt, приходите на наш большой курс [Nuxt - fullstack Vue фреймворк](https://purpleschool.ru/course/nuxt?utm_source=knowledgebase&utm_medium=article&utm_campaign=rukovodstvo-po-ispolzovaniyu-typescript-v-nuxt). На курсе 129 уроков и 13 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Типизация в Nuxt: Главные аспекты

### Автоматическая генерация типов

Nuxt (особенно начиная с версии 3) умеет сам генерировать типы для маршрутизации, компонентов и плагинов. После первого запуска (`npm run dev`) или сборки (`npm run build`), Nuxt создаст папку `.nuxt` с автосгенерированными типами, которые используются в проекте.

Обратите внимание: файлы в `.nuxt` генерируются автоматически, изменять их вручную не следует. Все типы подхватываются из вашего кода и конфигурации.

### Типизация страниц

Страницы в Nuxt лежат в папке `pages/` и автоматически становятся маршрутами. В TypeScript-коде для страницы легко получить автодополнение параметров маршрута:

```js
<script lang="ts">
import { defineComponent } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  setup() {
    const route = useRoute()
    // route.params теперь типизированы!
    return { id: route.params.id }
  }
})
</script>
```

Если добавить строгие типы для параметров, используйте собственные интерфейсы:

```ts
interface RouteParams {
  id: string
}
```
И затем явно описывать контекст во внутренних методах.

### Типизация компонентов

При создании новых компонентов вы указываете типы пропсов:

```ts
export default defineComponent({
  props: {
    title: {
      type: String as () => string, // Здесь мы явно указываем тип
      required: true
    }
  }
})
```

Для больших компонентов удобно использовать интерфейсы:

```ts
interface MyProps {
  title: string
  count?: number
}

export default defineComponent({
  props: {
    title: String,
    count: Number
  },
  setup(props: MyProps) {
    // props будет иметь тип MyProps
    // Теперь получите автодополнение для props.title и props.count
    return { ... }
  }
})
```

### Типизация composables

В Nuxt папка `composables/` предназначена для функций-композиций (composition API). Получите типизацию сразу, если будете описывать возвращаемые значения функции:

```ts
export function useCounter() {
  const count = ref<number>(0)
  const increment = () => { count.value++ }
  return { count, increment }
}
```

Теперь используем в компонентах:

```ts
const { count, increment } = useCounter()
// count всегда будет number, increment — функция
```

### Типизация плагинов

Плагины подключаются через папку `plugins/`. Настройте типизацию глобальных свойств следующим образом:

Создайте файл, например, `plugins/axios.ts`:

```ts
// plugins/axios.ts
import { defineNuxtPlugin } from '#app'
import axios from 'axios'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('axios', axios)
})
```

Чтобы обеспечить автодополнение, добавьте глобальное объявление типа:

```ts
// types/nuxt.d.ts
import type { AxiosInstance } from 'axios'

declare module '#app' {
  interface NuxtApp {
    $axios: AxiosInstance
  }
}
```
Это позволит внутри любых компонентов использовать `const axios = useNuxtApp().$axios`.

### Типизация Vuex-стора

До Nuxt 2 поддерживалась собственная система стор (Vuex), с типами через declare module:

```ts
// store/index.ts
import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { RootState } from '~/types'

export const state = () => ({
  counter: 0
})

export type RootState = ReturnType<typeof state>

export const mutations: MutationTree<RootState> = {
  increment(state) {
    state.counter++
  }
}
```
В Nuxt 3 вместо Vuex обычно используют Pinia, где типизация еще удобнее:

```ts
// stores/counter.ts
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
Теперь Pinia Store становится полностью типизированным без дополнительных объявлений.

### Типизация nuxt.config

Конфигурационный файл с настройками Nuxt пишется в формате `nuxt.config.ts`, а не `nuxt.config.js`:

```ts
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  typescript: {
    strict: true // Включаем строгий режим типизации
  },
  runtimeConfig: {
    public: {
      apiBase: '/api'
    }
  }
})
```

Все доступные опции будут типизированы благодаря импорту `defineNuxtConfig`.

## Рекомендации по структуре проекта с TypeScript

### Расширение типов через ambient declarations

Создайте папку `types/` и храните там свои .d.ts-файлы. Это удобно для глобальных типов:

```ts
// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    API_URL: string
  }
}
```

### Советы по организации

- Используйте явные типы для всех экспортируемых функций и переменных.
- Назовите свои интерфейсы и типы понятно и однозначно — например, `User`, `Product`, `ApiResponse<T>`.
- Для комплексных структур данных используйте Generics и Utility Types из TypeScript (`Partial`, `Readonly`, `Record` и др.).
- Всегда используйте строгий режим в tsconfig (`"strict": true`).

## Распространённые ошибки и их исправление

### Ошибки типов при импорте файлов

Иногда редактор не видит типы auto-import. В этом случае:

- Перезапустите сервер разработки (`npm run dev`).
- Убедитесь, что пути во всех импортируемых файлах в tsconfig прописаны корректно.

### Не видны типы плагинов

Проверьте, что файл `.d.ts` для плагинов находится в папке, включенной в `"include"` в tsconfig.

### Ошибки типизации при использовании this

В composition API используйте композицию, а не this. Если используете class-style vue (что редко для Nuxt 3), подключите декораторы и корректно укажите типы компонентов.

### Конфликты типов между зависимостями

Иногда сторонние библиотеки для Vue/TypeScript конфликтуют с версиями. Следите за версиями @types/vue, @nuxt/types и используемых библиотек.

## Передовые практики использования TypeScript в Nuxt

### Используйте более строгую типизацию props и emit

Vue позволяет явно объявлять не только типы входных данных, но и событий:

```ts
export default defineComponent({
  props: {
    label: String,
    value: Number
  },
  emits: {
    'update:value': (value: number) => typeof value === 'number'
  }
})
```

### Явное определение возвращаемых типов

Типы функций внутри composable объявляйте явно:

```ts
export function useApi<T>(endpoint: string): Promise<T> {
  return fetch(endpoint).then(res => res.json())
}
```

### Передавайте типы между слоями приложения

Продумывайте типы для API-ответов, пользовательских данных, результатов обработки и прокидывайте их через все уровни: стор, компоненты, плагины.

### Проверяйте типы во время сборки

Используйте отдельную команду проверки типов:

```bash
npx tsc --noEmit
```
Это позволит избежать неожиданной ошибки в продакшене.

## Использование современных возможностей TypeScript с Nuxt

### Работа с Composition API и defineComponent

TypeScript и Composition API идеально совместимы:

```ts
<script setup lang="ts">
import { ref } from 'vue'

const counter = ref<number>(0)
function increment(amount: number): void {
  counter.value += amount
}
</script>
```

Здесь вы сразу получаете автодополнение и строгую проверку входных параметров.

### Немного о хранении и повторном использовании типов

Если тип, описывающий, например, пользователя, нужен сразу в нескольких файлах — заведите его в types/user.ts и импортируйте везде, где необходимо.

```ts
// types/user.ts
export interface User {
  id: number
  name: string
}
```

### Генерация типов автоматически из вашей API

Для сложных проектов, где используется OpenAPI или GraphQL, можно автоматически генерировать типы клиентов для TypeScript и использовать напрямую в Nuxt — тогда не придется самим заботиться о корректности описаний.

## Поддержание типов в актуальном состоянии

Следите за тем, чтобы все новые функции, компоненты и плагины были типизированы с самого начала — до их активного использования. Это существенно снизит количество багов в больших проектах.

Хорошей практикой будет включение строгого режима TypeScript. Это позволит получать больше преимуществ от автодополнения и обнаружения ошибок до запуска приложения в браузере.

## Заключение

TypeScript отлично интегрируется с Nuxt, помогая делать проект более стабильным, читаемым и масштабируемым. Современные версии Nuxt поддерживают TypeScript практически "из коробки", а настройка понадобится минимальная. Инвестируя немного времени в настройку типизации и поддержание честных типов, вы существенно улучшите качество своего кода и продукт в целом. Применяйте строгие типы для компонентов, страниц, стор, плагинов, composables и API, чтобы пользоваться преимуществами статической проверки уже на этапе написания кода.

Использование TypeScript - это важный шаг к созданию качественных и масштабируемых Nuxt-приложений. Чтобы создавать действительно надежный и поддерживаемый код, необходимо освоить все возможности фреймворка, включая работу с компонентами, роутингом и Vuex. На нашем курсе [Nuxt - fullstack Vue фреймворк](https://purpleschool.ru/course/nuxt?utm_source=knowledgebase&utm_medium=article&utm_campaign=rukovodstvo-po-ispolzovaniyu-typescript-v-nuxt) вы найдете все необходимые знания и навыки для достижения этой цели. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в Nuxt прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как подключить глобальные типы, чтобы они были видны во всем проекте?

Добавьте свои файл(-ы) расширения типов в папку types/ и убедитесь, что в tsconfig указаны эти файлы в секции "include". Обычно достаточно добавить строку "types/**/*" в массив.

### Как типизировать Nuxt Middleware на TypeScript?

Для middleware используйте объявление типа для аргумента — это объект контекста приложения. Например:
```ts
import { Middleware } from '@nuxt/types'
const myMiddleware: Middleware = (context) => { /*…*/ }
export default myMiddleware
```

### Почему не работает auto-import composables в TypeScript, хотя работает в JavaScript?

Auto-import composables доступен после первого запуска проекта и только если они размещены в папке composables/. Проверьте, что путь верный и название функции начинается с use, например useApi. Перезапустите сервер разработки, если типы не подтянулись.

### Можно ли использовать decorators (например, @Component) в Nuxt с TypeScript?

Да, но для этого необходимо настроить поддержку декораторов в tsconfig (поля "experimentalDecorators" и "emitDecoratorMetadata" включите в true) и использовать сторонние решения типа vue-property-decorator. Важно: этот стиль устарел и не рекомендуется для новых Nuxt 3 проектов.

### Как исправить ошибку "Cannot find module '~/...' or its corresponding type declarations"?

Проверьте, что в tsconfig указано поле "paths" c нужными алиасами:
```json
"paths": {
  "~/*": ["./*"],
  "@/*": ["./*"]
}
```
Добавьте эти значения, сохраните файл и перезапустите сервер разработки.
