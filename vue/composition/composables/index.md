---
metaTitle: Композаблы composables во Vue 3
metaDescription: Разбираем как устроены композаблы в Vue 3 - зачем они нужны как их писать структурировать и переиспользовать в реальных проектах
author: Олег Марков
title: Композаблы composables во Vue 3
preview: Пошагово разбираем подход composables в Vue 3 - от базовой идеи до продвинутых паттернов проектирования и типизации
---

## Введение

Композаблы (composables) во Vue 3 – это функции, в которых вы выносите переиспользуемую логику, построенную на Composition API. По сути, это способ собрать реактивные данные, вычисления и побочные эффекты в отдельный модуль, а затем многократно использовать его в компонентах.

Смотрите, идея простая: вместо того чтобы дублировать один и тот же код в нескольких компонентах, вы пишете чистую функцию, которая:

- создает реактивное состояние
- настраивает эффекты (watch, lifecycle-хуки)
- возвращает все, что нужно компоненту

Так вы получаете:

- меньше дублирования кода
- более чистые и короткие компоненты
- лучшую тестируемость
- более гибкую архитектуру проекта

Давайте разберемся, как это устроено на практике.

## Что такое композабл и как он выглядит

### Базовая форма композабла

Композабл – это обычная функция JavaScript/TypeScript, которая внутри использует функции из Vue Composition API (ref, reactive, computed и т. д.) и возвращает нужные значения.

Давайте посмотрим на максимально простой пример:

```ts
// useCounter.ts
import { ref, computed } from "vue"

export function useCounter() {
  // Создаем реактивное состояние
  const count = ref(0) // ref оборачивает значение, и Vue отслеживает его изменения

  // Создаем вычисляемое значение
  const double = computed(() => count.value * 2) // автоматически пересчитается при изменении count

  // Создаем методы для изменения состояния
  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  // Возвращаем то, что хотим использовать в компоненте
  return {
    count,
    double,
    increment,
    decrement,
  }
}
```

Теперь давайте посмотрим, как этот композабл использовать в компоненте:

```vue
<!-- Counter.vue -->
<script setup lang="ts">
import { useCounter } from "../composables/useCounter"

// Вызываем composable-функцию внутри setup
// Каждый вызов создает собственное независимое состояние
const { count, double, increment, decrement } = useCounter()
</script>

<template>
  <div>
    <p>Счетчик: {{ count }}</p>
    <p>Удвоенное значение: {{ double }}</p>
    <button @click="increment">Плюс</button>
    <button @click="decrement">Минус</button>
  </div>
</template>
```

Как видите, компонент остается довольно простым: он только "подключает" уже готовую логику.

### Где хранить композаблы в проекте

Обычно композаблы кладут в папку `composables` (или `use`, или `hooks`) в корне проекта или рядом с фичами. Наиболее распространенный вариант:

- `src/composables/useCounter.ts`
- `src/composables/useFetch.ts`
- `src/composables/useUser.ts`

Важно соблюдать понятные имена. Хороший практический подход – начинать имя композабла с `use`:

- `useAuth`
- `useForm`
- `useTodoList`

Так при чтении кода сразу понятно, что это функция-композабл.

## Типы логики, которые удобно выносить в композаблы

### Логика работы с данными (запросы, кеширование, пагинация)

Очень часто в разных компонентах повторяется одно и то же:

- запрос на сервер
- обработка ошибок
- показ состояния загрузки
- автообновление при изменении параметров

Давайте разберемся на примере универсального `useFetch`.

```ts
// useFetch.ts
import { ref, watchEffect } from "vue"

export function useFetch<T>(url: string | (() => string)) {
  const data = ref<T | null>(null)          // Реактивные данные ответа
  const error = ref<Error | null>(null)     // Ошибка запроса, если она есть
  const loading = ref(false)                // Состояние загрузки

  async function load() {
    loading.value = true
    error.value = null

    try {
      const resolvedUrl = typeof url === "function" ? url() : url // Позволяем передавать и строку и функцию
      const res = await fetch(resolvedUrl)

      if (!res.ok) {
        // Если статус не 2xx - считаем это ошибкой
        throw new Error(`Request failed with status ${res.status}`)
      }

      const json = await res.json()
      data.value = json as T
    } catch (e) {
      error.value = e as Error
      data.value = null
    } finally {
      loading.value = false
    }
  }

  // Автоматически загружаем данные при первом использовании композабла
  watchEffect(() => {
    // watchEffect будет заново выполняться, если url - функция и она зависит от реактивных значений
    load()
  })

  return {
    data,
    error,
    loading,
    reload: load, // Позволяем компоненту перезагружать данные вручную
  }
}
```

Теперь вы увидите, как это выглядит в компоненте:

```vue
<script setup lang="ts">
import { ref } from "vue"
import { useFetch } from "../composables/useFetch"

const userId = ref(1) // Реактивный параметр запроса

// Здесь мы передаем функцию, чтобы URL автоматически менялся при изменении userId
const { data: user, error, loading, reload } = useFetch<{ id: number; name: string }>(
  () => `https://api.example.com/users/${userId.value}`
)

function nextUser() {
  userId.value++
  // reload можно не вызывать - watchEffect сам перезапустит load,
  // потому что URL зависит от userId
}
</script>

<template>
  <div>
    <button @click="nextUser">Следующий пользователь</button>

    <p v-if="loading">Загрузка...</p>
    <p v-else-if="error">Ошибка - {{ error.message }}</p>
    <pre v-else-if="user">{{ user }}</pre>
  </div>
</template>
```

Обратите внимание, как этот фрагмент кода решает задачу: вся сложность работы с запросами спрятана в `useFetch`, а компонент остается декларативным и простым.

### Логика работы с формами

Формы – это еще один хороший кандидат для композаблов: валидация, состояние ошибок, отправка на сервер.

Покажу вам, как это реализовано на практике на простом примере.

```ts
// useLoginForm.ts
import { reactive, ref } from "vue"

interface LoginForm {
  email: string
  password: string
}

export function useLoginForm() {
  const form = reactive<LoginForm>({
    email: "",
    password: "",
  })

  const errors = reactive<Record<keyof LoginForm, string | null>>({
    email: null,
    password: null,
  })

  const submitting = ref(false)
  const serverError = ref<string | null>(null)

  function validate() {
    let valid = true

    // Сбрасываем ошибки
    errors.email = null
    errors.password = null

    if (!form.email.includes("@")) {
      errors.email = "Введите корректный email"
      valid = false
    }

    if (form.password.length < 6) {
      errors.password = "Пароль должен быть не короче 6 символов"
      valid = false
    }

    return valid
  }

  async function submit() {
    serverError.value = null

    if (!validate()) {
      return false // Не отправляем запрос, если валидация не прошла
    }

    submitting.value = true

    try {
      // Здесь мы эмулируем запрос
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // В реальном коде здесь был бы запрос к API:
      // const res = await api.login(form.email, form.password)
      // ...
      return true
    } catch (e) {
      serverError.value = "Не удалось выполнить вход"
      return false
    } finally {
      submitting.value = false
    }
  }

  return {
    form,
    errors,
    submitting,
    serverError,
    submit,
  }
}
```

Теперь давайте перейдем к использованию в компоненте:

```vue
<script setup lang="ts">
import { useLoginForm } from "../composables/useLoginForm"

const { form, errors, submitting, serverError, submit } = useLoginForm()

async function onSubmit() {
  const ok = await submit()
  if (ok) {
    // Здесь вы можете, например, перенаправить пользователя
    // router.push("/dashboard")
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <div>
      <label>Email</label>
      <input v-model="form.email" type="email" />
      <span v-if="errors.email" class="error">{{ errors.email }}</span>
    </div>

    <div>
      <label>Пароль</label>
      <input v-model="form.password" type="password" />
      <span v-if="errors.password" class="error">{{ errors.password }}</span>
    </div>

    <p v-if="serverError" class="error">{{ serverError }}</p>

    <button type="submit" :disabled="submitting">
      {{ submitting ? "Отправка..." : "Войти" }}
    </button>
  </form>
</template>
```

Такой подход позволяет писать разные формы, используя один и тот же паттерн, а бизнес-логику логина можно переиспользовать в нескольких местах.

### Логика взаимодействия с окружением (окно, события, localStorage)

Многие проекты содержат похожую "инфраструктурную" логику:

- отслеживание размеров окна
- работа с событиями клавиатуры
- сохранение состояния в `localStorage`
- работа с URL-параметрами

Все это отлично ложится в композаблы.

Например, отслеживание размеров окна:

```ts
// useWindowSize.ts
import { ref, onMounted, onUnmounted } from "vue"

export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  function update() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    // Подписываемся на событие изменения размеров окна
    window.addEventListener("resize", update)
  })

  onUnmounted(() => {
    // Не забываем отписаться, чтобы избежать утечки памяти
    window.removeEventListener("resize", update)
  })

  return {
    width,
    height,
  }
}
```

И использование:

```vue
<script setup lang="ts">
import { useWindowSize } from "../composables/useWindowSize"

const { width, height } = useWindowSize()
</script>

<template>
  <p>Ширина окна: {{ width }}</p>
  <p>Высота окна: {{ height }}</p>
</template>
```

Здесь вы видите важный момент: композаблы могут использовать lifecycle-хуки (`onMounted`, `onUnmounted`), и эти хуки будут привязаны к компоненту, который вызвал композабл.

## Жизненный цикл внутри композаблов

### Как работают хуки жизненного цикла

Внутри композаблов вы можете использовать те же хуки, что и в `setup` компонента:

- `onMounted`
- `onUnmounted`
- `onBeforeMount`
- `onBeforeUnmount`
- и другие

Эти хуки “привяжутся” к текущему активному компоненту, который вызывает композабл. То есть фактически вы как бы расширяете логику компонента дополнительными частями жизненного цикла.

Давайте разберемся на примере:

```ts
// useEventListener.ts
import { onMounted, onUnmounted } from "vue"

export function useEventListener(
  target: Window | Document | HTMLElement,
  event: string,
  handler: EventListenerOrEventListenerObject
) {
  onMounted(() => {
    // Подписываемся на событие при монтировании компонента
    target.addEventListener(event, handler)
  })

  onUnmounted(() => {
    // Отписываемся, когда компонент удаляется из DOM
    target.removeEventListener(event, handler)
  })
}
```

И применение:

```vue
<script setup lang="ts">
import { ref } from "vue"
import { useEventListener } from "../composables/useEventListener"

const mouseX = ref(0)
const mouseY = ref(0)

useEventListener(window, "mousemove", (event: MouseEvent) => {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
})
</script>

<template>
  <p>Координаты мыши - X {{ mouseX }} Y {{ mouseY }}</p>
</template>
```

Как только компонент размонтируется, слушатель события будет снят, потому что `useEventListener` зарегистрировал `onUnmounted`.

### Важный момент: вызывать композаблы только внутри setup

Композаблы должны вызываться:

- внутри `setup` функции компонента
- или внутри других композаблов

Так Vue сможет корректно привязать:

- реактивность
- хуки жизненного цикла
- контекст компонента

Не стоит вызывать композаблы вне контекста компонента (например, прямо в модуле при импорте), потому что тогда у Vue не будет "активного" компонента, к которому можно привязаться.

## Обмен состоянием между несколькими компонентами

### Локальное состояние (на каждый компонент свой экземпляр)

По умолчанию, если вы вызываете композабл в нескольких компонентах, каждый компонент получает независимый экземпляр состояния. Так работает наш `useCounter`:

```ts
const { count } = useCounter() // в каждом компоненте будет свое count
```

Это удобно для повторяющихся независимых кусков логики.

### Глобальное разделяемое состояние (shared state)

Иногда вам нужно, чтобы несколько компонентов разделяли одно и то же состояние – например, авторизацию пользователя. В этом случае можно сделать “одиночный” композабл.

Смотрите, я покажу вам, как это работает:

```ts
// useAuth.ts
import { ref, computed } from "vue"

const user = ref<{ id: number; name: string } | null>(null) // Вынесено за пределы функции
const token = ref<string | null>(null)

const isAuthenticated = computed(() => !!token.value)

export function useAuth() {
  async function login(username: string, password: string) {
    // Эмулируем запрос авторизации
    await new Promise((resolve) => setTimeout(resolve, 500))

    // В реальности здесь был бы запрос к API и получение токена
    user.value = { id: 1, name: username }
    token.value = "fake-token"
  }

  function logout() {
    user.value = null
    token.value = null
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
  }
}
```

Теперь каждый вызов `useAuth` возвращает ссылки на одни и те же `user` и `token`, потому что они созданы вне функции и существуют в модуле.

Использование в разных компонентах:

```vue
<!-- HeaderUserInfo.vue -->
<script setup lang="ts">
import { useAuth } from "../composables/useAuth"

const { user, isAuthenticated, logout } = useAuth()
</script>

<template>
  <div v-if="isAuthenticated">
    <span>Здравствуйте {{ user?.name }}</span>
    <button @click="logout">Выйти</button>
  </div>
  <div v-else>
    <span>Не авторизованы</span>
  </div>
</template>
```

```vue
<!-- LoginPage.vue -->
<script setup lang="ts">
import { ref } from "vue"
import { useAuth } from "../composables/useAuth"

const { login } = useAuth()

const username = ref("")
const password = ref("")

async function onSubmit() {
  await login(username.value, password.value)
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <input v-model="username" placeholder="Логин" />
    <input v-model="password" type="password" placeholder="Пароль" />
    <button type="submit">Войти</button>
  </form>
</template>
```

Оба компонента работают с одним и тем же состоянием авторизации.

### Когда нужен композабл, а когда store (Vuex / Pinia)

Разделяемое состояние через композаблы похоже на легковесный store. Нередко разработчики задают себе вопрос – что использовать.

Ориентир такой:

- Если состояние связано с одной-двумя фичами и не слишком большое – удобно использовать композабл.
- Если нужно централизованное управление состоянием всего приложения, сложные зависимости и интеграции – имеет смысл использовать Pinia или другой store.

Хорошая практика – комбинировать: часть логики выносить в композаблы, а глобальное состояние хранить в store.

## Структура и организация композаблов в проекте

### Именование и группировка

Чтобы проект не превращался в хаос из десятков файлов `useSomething`, полезно договориться о структуре.

Один из удобных вариантов:

- `src/composables/useAuth.ts`
- `src/composables/useUser.ts`
- `src/composables/useWindowSize.ts`
- `src/composables/useEventListener.ts`

А более крупные фичи можно группировать по подпапкам:

- `src/composables/auth/useAuth.ts`
- `src/composables/auth/useLoginForm.ts`
- `src/composables/ui/useModal.ts`
- `src/composables/ui/useTooltip.ts`

Так вы будете быстрее ориентироваться и по названию файла сразу поймете, за что он отвечает.

### Чистые vs "грязные" композаблы

Иногда полезно разделять:

- "чистые" композаблы – не знают о DOM, не обращаются к окну, не используют жизненный цикл, просто работают с данными (например, валидация, бизнес-правила)
- "грязные" композаблы – работают с побочными эффектами: запросы, события, таймеры, DOM

Такой подход делает код более тестируемым: чистые композаблы можно тестировать как обычные функции, не поднимая браузерное окружение.

## Типизация композаблов в TypeScript

### Общие принципы

Композаблы прекрасно работают с TypeScript, и важно правильно типизировать:

- аргументы функции
- возвращаемые значения
- данные, которые вы кладете в ref и reactive

Разберем короткий пример универсального хука, который работает с массивом данных.

```ts
// useList.ts
import { ref, computed } from "vue"

export function useList<T>(initial: T[] = []) {
  const items = ref<T[]>(initial) // ref типизирован массивом T

  function add(item: T) {
    items.value.push(item)
  }

  function remove(index: number) {
    items.value.splice(index, 1)
  }

  const length = computed(() => items.value.length)

  return {
    items,
    add,
    remove,
    length,
  }
}
```

Использование:

```ts
import { useList } from "../composables/useList"

const { items, add, remove, length } = useList<string>(["a", "b"])

// TS подскажет, что add принимает только строки
add("c")
// add(123) // будет ошибка типов
```

Здесь важный момент: за счет дженерика `<T>` композабл становится переиспользуемым для разных типов данных.

### Типизация результатов fetch

В `useFetch` мы уже использовали дженерик `<T>`. Это позволяет строго типизировать форму ответа API.

Еще один вариант – сделать API чуть более гибким:

```ts
// useFetchJson.ts
import { ref } from "vue"

interface FetchOptions {
  immediate?: boolean // Запускать ли запрос сразу
}

export function useFetchJson<T>(url: string, options: FetchOptions = {}) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Status ${res.status}`)
      }
      data.value = (await res.json()) as T
    } catch (e) {
      error.value = e as Error
      data.value = null
    } finally {
      loading.value = false
    }
  }

  if (options.immediate !== false) {
    // По умолчанию immediate = true
    void execute()
  }

  return {
    data,
    error,
    loading,
    execute,
  }
}
```

Использование:

```ts
const { data: posts, loading } = useFetchJson<{ id: number; title: string }[]>(
  "/api/posts"
)
```

TS везде будет знать, что `posts.value` – это массив объектов с `id` и `title`.

## Составление композаблов из других композаблов

### Композиция как основная идея

Название "composable" как раз намекает, что эти функции легко "собираются" друг из друга. Вместо одного огромного хука на 300 строк, вы можете собрать его из нескольких маленьких.

Давайте разберемся на примере `useModal`, который использует общий `useToggle`:

```ts
// useToggle.ts
import { ref } from "vue"

export function useToggle(initial = false) {
  const state = ref(initial)

  function toggle() {
    state.value = !state.value
  }

  function set(value: boolean) {
    state.value = value
  }

  return {
    state,
    toggle,
    set,
  }
}
```

```ts
// useModal.ts
import { useToggle } from "./useToggle"

export function useModal() {
  const { state: isOpen, toggle, set } = useToggle(false)

  function open() {
    set(true)
  }

  function close() {
    set(false)
  }

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}
```

Теперь вы получаете:

```ts
const { isOpen, open, close } = useModal()
```

Если вам когда-нибудь понадобится доделать `useModal` (например, закрытие по Esc, блокировка скролла), вы сможете добавить эту логику внутри, а компоненты останутся прежними.

## Тестирование композаблов

### Подход к тестам

Смотрите, здесь принцип простой: чем меньше ваш композабл зависит от браузерного окружения и DOM, тем легче его тестировать, как обычную функцию.

Например, `useCounter` тестируется так:

```ts
// useCounter.spec.ts
import { useCounter } from "./useCounter"
import { ref } from "vue"
import { describe, it, expect } from "vitest"

describe("useCounter", () => {
  it("increments and decrements", () => {
    const { count, increment, decrement } = useCounter()

    expect(count.value).toBe(0)
    increment()
    expect(count.value).toBe(1)
    decrement()
    expect(count.value).toBe(0)
  })
})
```

Комментарии к этому коду:

// Мы вызываем composable-функцию как обычную функцию
// Проверяем, что поведение increment/decrement меняет состояние count как ожидается

Для композаблов с жизненным циклом или `watch`-эффектами удобно использовать хелперы из `@vue/test-utils` или библиотеки типа `@vueuse/core` для тестирования, но базовый принцип тот же: вы вызываете функцию и проверяете ее поведение.

### Разделение логики для более легкого тестирования

Если какой-то композабл сложно тестировать, часто это сигнал, что стоит разделить его на:

- чистую часть (расчеты, бизнес-логика)
- обертку, которая добавляет реактивность и жизненный цикл

Так вы сможете тестировать "ядро" без Vue, а обертку – минимально.

## Практические советы по проектированию композаблов

### Когда точно стоит выделить композабл

Хорошие сигналы:

- в двух и более компонентах появился одинаковый или очень похожий код в `setup`
- компонент стал слишком большим и его `setup` тяжело читать
- вы хотите протестировать какую-то часть логики отдельно
- вы планируете переиспользовать кусок логики в будущем

### Как сделать API композабла понятным

Небольшой чек-лист:

- хорошее имя `useSomething`, которое ясно описывает роль
- минимум внешних зависимостей (принимает параметры и возвращает значения)
- четкая структура возвращаемых значений – обычно объект с понятными полями
- возможность конфигурации через параметры (например, `useFetch(url, { immediate: false })`)

Старайтесь не возвращать "все подряд". Лучше вернуть ровно то, что нужно для конкретной задачи.

---

## Заключение

Композаблы во Vue 3 – это простой, но очень мощный способ организовывать логику приложения. Они позволяют:

- выносить повторяющийся код из компонентов
- разделять бизнес-логику и представление
- гибко управлять состоянием и побочными эффектами
- улучшать тестируемость и сопровождаемость проекта

Ключевые практики:

- создавать маленькие, хорошо названные композаблы
- объединять их, строя более сложную логику
- аккуратно выбирать, где состояние должно быть локальным, а где разделяемым
- использовать TypeScript для четкой типизации аргументов и возвращаемых значений

Если вы будете последовательно применять этот подход, структура проекта станет более предсказуемой, а компоненты – проще и яснее.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как передать в композабл доступ к router или store

Обычно вы просто импортируете `useRouter` или `useRoute` (или `useStore` в случае Pinia) внутри композабла:

```ts
// useNavigateToProfile.ts
import { useRouter } from "vue-router"

export function useNavigateToProfile() {
  const router = useRouter()

  function goToProfile(userId: number) {
    router.push({ name: "profile", params: { id: userId } })
  }

  return { goToProfile }
}
```

Важно: вызывать такие композаблы по-прежнему нужно внутри `setup`, чтобы контекст роутера был доступен.

### Как сделать, чтобы композабл работал и на клиенте и на сервере (SSR)

Главное правило – не обращаться к `window`, `document` и другим браузерным объектам напрямую при выполнении на сервере. Оберните доступ в проверки:

```ts
if (typeof window !== "undefined") {
  // код, зависящий от браузера
}
```

Или выделите такую логику в отдельный композабл, который используете только в клиентских компонентах.

### Как правильно "очищать" ресурсы, созданные в композабле (таймеры, подписки)

Используйте `onUnmounted` внутри композабла:

```ts
import { onUnmounted } from "vue"

export function useInterval(callback: () => void, delay: number) {
  const id = setInterval(callback, delay)

  onUnmounted(() => {
    clearInterval(id) // очищаем таймер при уничтожении компонента
  })
}
```

Так вы избегаете утечек памяти и нежелательного поведения после удаления компонента.

### Можно ли внутри одного композабла использовать другой и как избежать "кольцевых" зависимостей

Можно и нужно – это основа композиции: один композабл вызывает другой внутри своей функции. Кольцевых зависимостей стоит избегать так же, как и в обычных модулях: выносите общую часть в третий, более базовый композабл и подключайте его в оба места.

### Как передать в композабл слоты или render-функции

Обычно композаблы не работают напрямую со слотами – они оперируют только данными и логикой. Если вам нужно управлять рендерингом, используйте паттерн "renderless компонент": компонент получает на вход слоты, а композабл – только состояние и методы, которые этот компонент пробрасывает в слоты как props. Такой подход разделяет ответственность и делает композаблы чище.