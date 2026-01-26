---
metaTitle: Реактивность Vue reactivity - полный разбор механизма
metaDescription: Подробное объяснение системы реактивности Vue - работа с ref reactive computed watch и proxy под капотом для уверенного использования фреймворка
author: Олег Марков
title: Реактивность Vue reactivity - как это работает под капотом и как этим пользоваться
preview: Разбор реактивности Vue - от ref и reactive до computed и watch с примерами и объяснениями как Vue отслеживает изменения и обновляет интерфейс
---

## Введение

Реактивность в Vue – это фундамент, на котором строится весь фреймворк. Именно благодаря ей вы можете просто «менять данные», а интерфейс сам обновляется. Без явных вызовов перерисовки, без ручного управления DOM.

Смотрите, в этой статье я покажу вам, как устроена реактивность Vue 3, какие есть ключевые инструменты (`ref`, `reactive`, `computed`, `watch`), в чем их отличия и типичные подводные камни. Мы будем смотреть на код, разбирать поведение и по ходу объяснять, что именно делает Vue, когда вы меняете данные.

Статья ориентирована на Vue 3 и Composition API, но многие идеи применимы и к Options API.

---

## Что такое реактивность в Vue

### Основная идея

Реактивность – это механизм, который:

1. Отслеживает, какие данные используются в каком месте (компонент, вычисляемое свойство, watcher).
2. Автоматически запускает нужный код, когда эти данные меняются.

В терминах Vue можно упростить:

- Есть **источники данных** – `ref`, `reactive` и другие реактивные объекты.
- Есть **эффекты** – рендер-функция компонента, `computed`, `watch`.
- Когда эффект первый раз выполняется, Vue запоминает, какие реактивные данные он прочитал.
- Когда эти данные меняются, Vue повторно запускает соответствующий эффект.

По сути, Vue строит граф зависимостей «данные → эффекты» и сам обновляет те части интерфейса, которые этих данных зависят.

---

## Базовые строительные блоки реактивности

### ref – реактивное значение

`ref` используется для создания реактивного примитивного значения (числа, строки, булева) или отдельного объекта с `.value`.

```js
import { ref } from 'vue'

export default {
  setup() {
    // Создаем реактивное число
    const count = ref(0) // count.value === 0

    // Функция увеличения
    const increment = () => {
      count.value++ // Меняем значение, Vue это отследит
    }

    return {
      count,      // В шаблоне можно писать просто {{ count }}
      increment,  // И вызывать метод при клике
    }
  },
}
```

Комментарии к примеру:

- `ref(0)` возвращает объект `{ value: 0 }`, но в шаблоне `.value` можно не писать – Vue его автоматически разворачивает.
- В JavaScript-коде всегда нужно обращаться через `.value`, иначе вы получите сам объект-обертку.

Давайте посмотрим, как `ref` ведет себя вне компонента:

```js
import { ref, watch } from 'vue'

const message = ref('hello')

// Подписываемся на изменения
watch(message, (newVal, oldVal) => {
  // Этот колбэк вызовется каждый раз, когда message.value изменится
  console.log('message изменилось с', oldVal, 'на', newVal)
})

message.value = 'world' // Триггерит watcher
```

Здесь `watch` воспринимает `ref` как источник данных и отслеживает его `.value`.

#### Когда использовать ref

Используйте `ref`, когда:

- Нужно хранить простое значение (число, строку, булево, дату).
- Нужно иметь «контейнер» для ссылки на что-то (например, DOM-элемент через `template ref`).
- Вы не хотите, чтобы объект автоматически «раскрывался» по всем полям (в отличие от `reactive`).

---

### reactive – реактивный объект или массив

`reactive` создает прокси (Proxy) вокруг объекта и отслеживает чтение и запись его свойств.

```js
import { reactive } from 'vue'

export default {
  setup() {
    // Создаем реактивный объект состояния
    const state = reactive({
      count: 0,
      user: {
        name: 'Alice',
      },
      items: [],
    })

    const increment = () => {
      state.count++ // Реактивно
    }

    const addItem = (item) => {
      state.items.push(item) // Мутация массива тоже отслеживается
    }

    return {
      state,
      increment,
      addItem,
    }
  },
}
```

Комментарии:

- `reactive` возвращает **прокси**, а не обычный объект.
- Vue отслеживает каждое чтение `state.count`, `state.user.name`, `state.items.length` и т.д.
- При изменении нужного свойства Vue триггерит связанные эффекты.

#### Важные особенности reactive

1. Работает только с объектами (включая массивы, Map, Set и др.). Нельзя `reactive(1)` – получится ошибка.
2. Реактивность глубокая: вложенные объекты тоже превращаются в прокси.
3. Нельзя деструктурировать без потери реактивности (подробнее разберем ниже).

---

### Отличия ref и reactive

Давайте разберемся, когда выбирать `ref`, а когда `reactive`.

#### Основные отличия

- `ref` хранит значение в `.value`, `reactive` – возвращает сам объект-прокси.
- `ref` удобен для работы с примитивами и отдельными значениями.
- `reactive` удобен для сложных состояний (объекты с несколькими полями, массивы, коллекции).

Пример, чтобы показать разницу:

```js
import { ref, reactive } from 'vue'

const count = ref(0)        // count.value = 0
const state = reactive({    // state.count = 0
  count: 0,
})
```

Если вы хотите передать «ссылку на одно значение» – обычно выгоднее взять `ref`. Если хотите единый объект состояния – `reactive`.

#### ref внутри reactive

Важно понимать, как `ref` ведет себя, если вы кладете его внутрь `reactive`:

```js
import { ref, reactive } from 'vue'

const n = ref(1)

const state = reactive({
  n, // Кладем ref внутрь reactive
})

// Здесь n "распакуется":
console.log(state.n) // 1, а не { value: 1 }

// Но если вы переприсвоите:
state.n = 10
// Теперь state.n — просто число, а исходный n.value не изменился
console.log(n.value) // 1
```

Vue делает «автораспаковку» `ref` внутри `reactive` **при чтении**, но при записи вы уже меняете само поле объекта, а не исходный `ref`. Это важный момент, который часто вызывает путаницу.

---

## Как Vue отслеживает зависимости

### Proxy и эффекты

Под капотом в Vue 3 используется стандарт JavaScript Proxy. Каждый `reactive`-объект – это прокси, у которого Vue переопределяет обработчики:

- `get` – когда вы читаете свойство.
- `set` – когда вы записываете свойство.

Смотрите, я упрощенно покажу идею:

```js
// Это не настоящий код Vue, а упрощенная иллюстрация

const depsMap = new Map() 
// Здесь мы будем хранить зависимости "свойство -> список эффектов"

let activeEffect = null // Текущий выполняющийся эффект (например, render)

function effect(fn) {
  activeEffect = fn
  fn()               // Выполняем функцию и собираем зависимости
  activeEffect = null
}

function track(key) {
  if (!activeEffect) return
  // Получаем список эффектов для свойства
  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }
  deps.add(activeEffect) // Добавляем текущий эффект как зависимый
}

function trigger(key) {
  const deps = depsMap.get(key)
  if (!deps) return
  deps.forEach(fn => fn()) // При изменении свойства выполняем эффекты
}

const state = new Proxy({ count: 0 }, {
  get(target, key, receiver) {
    const result = Reflect.get(target, key, receiver)
    track(key) // Отслеживаем чтение свойства
    return result
  },
  set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver)
    trigger(key) // Сообщаем об изменении свойства
    return result
  },
})

// Используем
effect(() => {
  console.log('render', state.count) 
  // При первом запуске effect вызовет track('count')
})

state.count++ 
// При изменении count будет вызван trigger('count') и снова effect
```

Комментарии:

- В реальном Vue все гораздо сложнее и оптимизированнее, но идея такая же.
- `effect` – абстракция, которая используется для рендера компонента, вычисляемых свойств, watchers и т.п.
- Каждый раз при чтении свойства Vue записывает «активный эффект».
- При записи в свойство Vue находит все связанные эффекты и заново их запускает.

---

## computed – вычисляемые значения

### Что такое computed

`computed` позволяет объявить значение, которое:

- Зависит от других реактивных данных.
- Кэшируется.
- Пересчитывается только при изменении зависимостей.

Давайте разберемся на примере:

```js
import { ref, computed } from 'vue'

export default {
  setup() {
    const firstName = ref('John')
    const lastName = ref('Doe')

    const fullName = computed(() => {
      // Это getter вычисляемого значения
      // Он будет выполняться только когда меняется firstName или lastName
      return firstName.value + ' ' + lastName.value
    })

    return {
      firstName,
      lastName,
      fullName, // В шаблоне можно использовать {{ fullName }}
    }
  },
}
```

Комментарии:

- При первом обращении к `fullName.value` выполняется функция, Vue собирает зависимости (`firstName`, `lastName`).
- Затем результат кэшируется.
- Если `firstName.value` и `lastName.value` не менялись, следующие обращения к `fullName.value` просто возвращают закэшированное значение.
- При изменении зависимостей computed помечается как «грязный» и при следующем чтении пересчитывается.

### computed с getter и setter

Иногда нужно не только читать computed, но и записывать в него – тогда определяют setter.

```js
import { ref, computed } from 'vue'

export default {
  setup() {
    const firstName = ref('John')
    const lastName = ref('Doe')

    const fullName = computed({
      get() {
        return firstName.value + ' ' + lastName.value
      },
      set(newValue) {
        // Разбиваем строку по пробелу
        const parts = newValue.split(' ')
        // Меняем исходные значения
        firstName.value = parts[0] || ''
        lastName.value = parts[1] || ''
      },
    })

    const changeName = () => {
      // При записи fullName setter сам обновит firstName и lastName
      fullName.value = 'Alice Smith'
    }

    return {
      firstName,
      lastName,
      fullName,
      changeName,
    }
  },
}
```

---

## watch и watchEffect – реакция на изменения

### watch – явное отслеживание источника

`watch` позволяет выполнить побочный эффект (например, запрос на сервер), когда меняются одни или несколько источников.

```js
import { ref, watch } from 'vue'

export default {
  setup() {
    const searchQuery = ref('')

    watch(
      searchQuery,                         // Что отслеживаем
      (newVal, oldVal) => {                // Колбэк при изменении
        // Здесь можно вызывать API, логировать и т.д.
        console.log('searchQuery изменился', oldVal, '->', newVal)
      },
      {
        immediate: true, // Выполнить колбэк сразу при инициализации
      }
    )

    return {
      searchQuery,
    }
  },
}
```

Важно:

- Первый аргумент – источник. Это может быть:
  - `ref`
  - `reactive`-объект
  - функция, которая синхронно возвращает значение на основе реактивных данных
  - массив из нескольких источников.
- Второй аргумент – колбэк с аргументами `newValue`, `oldValue`.
- Третий аргумент – опции.

#### Пример с функцией-источником

Иногда выгодно отслеживать не весь объект, а только одно его поле:

```js
import { reactive, watch } from 'vue'

export default {
  setup() {
    const user = reactive({
      name: 'Alice',
      age: 25,
    })

    watch(
      () => user.age, // Отслеживаем только возраст
      (newAge, oldAge) => {
        console.log('Возраст изменился', oldAge, '->', newAge)
      }
    )

    return { user }
  },
}
```

Так вы избегаете ненужных срабатываний при изменении других полей.

### watchEffect – авто-сбор зависимостей

`watchEffect` работает похоже на `effect` из примера выше: вы передаете функцию, а Vue сам определяет, какие реактивные значения она читает.

```js
import { ref, watchEffect } from 'vue'

export default {
  setup() {
    const x = ref(0)
    const y = ref(0)

    watchEffect(() => {
      // Все реактивные значения, используемые здесь,
      // автоматически станут зависимостями эффекта
      console.log('Сумма координат', x.value + y.value)
    })

    // При изменении x или y watchEffect выполнится снова

    return { x, y }
  },
}
```

Особенности:

- Не нужно указывать источник явно, Vue сам его обнаруживает.
- Не дают `oldValue`, потому что вычисление может быть более сложным и многократным.
- Удобен для «реактивного кода» без жестких связей (логирование, синхронизация и т.п.).

---

## Работа с глубоко вложенными структурами

### Глубокое отслеживание в watch

Когда вы передаете в `watch` реактивный объект, по умолчанию Vue:

- Для обычного `ref` – отслеживает `.value` по ссылке.
- Для `reactive` объекта – ведет себя как `deep: true`, то есть реагирует на изменения любых вложенных свойств.

Давайте посмотрим на пример:

```js
import { reactive, watch } from 'vue'

export default {
  setup() {
    const state = reactive({
      user: {
        name: 'Alice',
        address: {
          city: 'Paris',
        },
      },
    })

    watch(
      () => state.user, // Источник — объект user
      (newVal, oldVal) => {
        // Этот колбэк сработает при изменении любого вложенного свойства user
        console.log('user изменился')
      },
      { deep: true } // Для reactive достаточно и без этого, но ставлю для наглядности
    )

    const changeCity = () => {
      state.user.address.city = 'Berlin' // Триггерит watcher
    }

    return { state, changeCity }
  },
}
```

### Почему иногда нужен deep

Если вы отслеживаете `ref`, содержащий объект, `watch` не будет по умолчанию уходить вглубь.

```js
import { ref, watch } from 'vue'

const user = ref({
  name: 'Alice',
  address: {
    city: 'Paris',
  },
})

watch(
  user,
  () => {
    console.log('user изменился')
  }
)

user.value.address.city = 'Berlin' 
// Это изменение НЕ вызовет watcher без deep,
// потому что ссылка user.value не менялась.
```

Чтобы это работало, нужно явно включить глубокое отслеживание:

```js
watch(
  user,
  () => {
    console.log('user изменился глубоко')
  },
  { deep: true }
)
```

---

## Особенности деструктуризации и потеря реактивности

### Проблема с деструктуризацией reactive

Если вы попробуете деструктурировать `reactive`-объект, вы потеряете реактивность полей.

```js
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  text: 'hello',
})

// Неправильно - деструктуризация "ломает" реактивность
const { count, text } = state

// Теперь count и text — обычные значения, а не реактивные
```

Почему так? Потому что `reactive` возвращает **прокси-объект**. При деструктуризации вы просто читаете значения и записываете их в новые переменные, теряя связь с прокси.

### Как правильно вытащить поля из reactive

В Composition API для этого есть специальный хелпер `toRefs`:

```js
import { reactive, toRefs } from 'vue'

export default {
  setup() {
    const state = reactive({
      count: 0,
      text: 'hello',
    })

    // toRefs превращает каждое поле объекта в ref
    const { count, text } = toRefs(state)

    const increment = () => {
      count.value++ // Меняем значение через ref, state.count тоже изменится
    }

    return {
      count,
      text,
      increment,
    }
  },
}
```

Здесь:

- `toRefs(state)` возвращает объект `{ count: Ref, text: Ref }`.
- Вы можете спокойно деструктурировать и при этом сохраняете реактивность.

### toRef – ссылка на одно поле

Если вам нужно сделать `ref` только для одного свойства объекта, есть `toRef`:

```js
import { reactive, toRef } from 'vue'

const state = reactive({
  count: 0,
  text: 'hello',
})

// Создаем ref, который "смотрит" на state.count
const countRef = toRef(state, 'count')

countRef.value++      // Меняет state.count
state.count += 1      // Меняет countRef.value
```

---

## Реактивность и шаблоны

### Автораспаковка ref в шаблоне

В шаблоне Vue 3 вы можете использовать `ref` без `.value`:

```vue
<template>
  <div>
    <!-- count — это ref, но в шаблоне достаточно {{ count }} -->
    <p>{{ count }}</p>
    <button @click="increment">+</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)

const increment = () => {
  count.value++
}
</script>
```

Vue автоматически делает:

- Чтение `count` → `count.value`.
- Запись `count = 1` в некоторых контекстах (например, в `v-model`) → `count.value = 1`.

### v-model и реактивность

`v-model` работает отлично с `ref`:

```vue
<template>
  <input v-model="message" />
  <p>{{ message }}</p>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('Привет') 
// Изменение input меняет message.value
// Изменение message.value обновляет input
</script>
```

С `reactive` тоже можно использовать `v-model`, работая с полями:

```vue
<template>
  <input v-model="form.name" />
  <input v-model="form.email" />
</template>

<script setup>
import { reactive } from 'vue'

const form = reactive({
  name: '',
  email: '',
})
</script>
```

---

## Работа с DOM через template refs

### ref для доступа к DOM

`ref` используется не только для значений, но и для получения ссылки на DOM-элемент.

```vue
<template>
  <!-- Шаблонный ref "inputEl" будет записан в inputRef.value -->
  <input ref="inputRef" />
  <button @click="focusInput">Фокус</button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Создаем ref без начального значения
const inputRef = ref(null)

const focusInput = () => {
  // Проверяем, что элемент уже смонтирован
  if (inputRef.value) {
    inputRef.value.focus() // Доступ к DOM-методу
  }
}

onMounted(() => {
  // Здесь inputRef.value уже указывает на реальный input в DOM
  console.log('input:', inputRef.value)
})
</script>
```

Комментарии:

- `ref="inputRef"` в шаблоне связывается с `inputRef` в скрипте.
- В момент `onMounted` DOM уже доступен, и вы можете вызывать методы.

---

## Ограничения и подводные камни реактивности

### Нельзя напрямую мутировать объект из props

Внутри компонента props – тоже реактивны, но Vue запрещает их мутировать напрямую.

```js
export default {
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    // Неправильно — нельзя менять props напрямую
    const changeName = () => {
      // Это вызовет предупреждение Vue
      props.user.name = 'Alice'
    }

    return { changeName }
  },
}
```

Правильные варианты:

1. Сделать локальную копию (через `ref` или `reactive`) и менять ее.
2. Через события `emit` попросить родителя изменить значение.

### Потеря реактивности при работе с внешними библиотеками

Если вы передаете реактивный объект в библиотеку, которая его клонирует или сериализует (например, `JSON.stringify`), вы часто теряете реактивность на результате.

```js
import { reactive } from 'vue'

const state = reactive({ count: 0 })

const cloned = JSON.parse(JSON.stringify(state))
// cloned — обычный объект, не реактивный
```

Если вам нужен «сырой» объект без прокси, Vue предоставляет хелпер `toRaw`, но использовать его стоит осторожно.

```js
import { reactive, toRaw } from 'vue'

const state = reactive({ count: 0 })

const raw = toRaw(state) 
// raw — исходный объект без прокси. Изменения raw не реактивны.
```

---

## Реактивность в Options API vs Composition API

### data и this в Options API

В Options API вы привыкли к такому синтаксису:

```js
export default {
  data() {
    return {
      count: 0,
    }
  },
  methods: {
    increment() {
      this.count++ // Реактивно
    },
  },
}
```

Под капотом Vue 3 все равно использует тот же реактивный движок (Proxy), просто оборачивает `data` в `reactive` и мапит все поля на `this`.

### Использование Composition API внутри Options API

Вы можете комбинировать подходы, но важно не путать их:

```js
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(0)

    const increment = () => {
      count.value++
    }

    return {
      count,
      increment,
    }
  },
}
```

Здесь `count` – это ref, и в шаблоне вы будете использовать его как обычное свойство.

---

## Оптимизация и производительность реактивности

### Батчинг обновлений

Vue не обновляет DOM мгновенно при каждом изменении. Изменения собираются и применяются в следующем «тик» (микрозадачу).

```js
import { ref, nextTick } from 'vue'

const count = ref(0)

const incrementTwice = async () => {
  count.value++
  count.value++

  // DOM пока может не успеть обновиться
  await nextTick() 
  // После nextTick в DOM уже будет актуальное значение
}
```

`nextTick` позволяет дождаться, когда все запланированные обновления будут применены.

### Избегайте избыточных watchers

Чем больше `watch` вы создаете, тем больше работы у реактивного движка. Нередко можно заменить `watch` на `computed` или использовать один `watch` вместо нескольких, отслеживающий массив источников.

---

## Заключение

Реактивность в Vue 3 строится вокруг нескольких ключевых понятий – `ref`, `reactive`, `computed`, `watch` и `watchEffect`. Под капотом используется Proxy и система эффектов, которая отслеживает зависимости при чтении свойств и повторно запускает нужный код при изменении.

Важно понимать, чем отличаются `ref` и `reactive`, как ведут себя деструктуризация и вложенные структуры, когда нужен `deep`, а когда достаточно функции-источника. От этого напрямую зависит предсказуемость поведения приложения и удобство отладки.

На практике вы комбинируете:

- `ref` для отдельных значений и ссылок на DOM.
- `reactive` для сложного состояния.
- `computed` для кэшируемых производных данных.
- `watch` и `watchEffect` для побочных эффектов и интеграции с внешним миром.

Чем лучше вы понимаете, как Vue отслеживает зависимости и когда именно запускает эффекты, тем проще писать надежные и понятные компоненты.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как корректно типизировать ref и reactive в TypeScript

В TypeScript вы можете передать дженерик:

```ts
import { ref, reactive } from 'vue'

const count = ref<number>(0) // ref с числом

interface User {
  name: string
  age: number
}

const user = reactive<User>({
  name: 'Alice',
  age: 30,
})
```

Для `reactive` лучше использовать интерфейсы или типы объектов. Если нужно типизировать массив:

```ts
const list = ref<string[]>([])
```

### Почему watch не срабатывает при изменении поля объекта внутри ref

Проблема в том, что `watch(refObj, cb)` по умолчанию отслеживает только смену ссылки `refObj.value`. Если вы меняете вложенное поле, ссылка остается прежней. Решение:

```js
const user = ref({ name: 'Alice' })

watch(
  user,
  () => { console.log('меняется любой внутренний ключ user') },
  { deep: true } // Включаем глубокое отслеживание
)
```

Либо отслеживайте конкретное поле функцией:

```js
watch(
  () => user.value.name,
  () => { console.log('name изменился') }
)
```

### Как избежать циклических обновлений между watch и изменениями состояния

Если внутри `watch` вы модифицируете данные, которые он же отслеживает, можно получить цикл. Решения:

- Отслеживать более узкий источник.
- Использовать проверку на изменение:

```js
watch(
  () => state.value,
  (val, old) => {
    if (val !== old) {
      // Меняем только при реальном изменении
    }
  }
)
```

Или использовать флаги:

```js
let internalUpdate = false

watch(
  source,
  () => {
    if (internalUpdate) return
    internalUpdate = true
    // меняем состояние
    internalUpdate = false
  }
)
```

### Как «заморозить» объект чтобы он не был реактивным

Используйте `markRaw` или `Object.freeze`:

```js
import { markRaw } from 'vue'

const rawObj = markRaw({
  some: 'data',
})
```

Такой объект не будет превращен в Proxy и не попадет в систему реактивности. Это полезно для больших библиотечных объектов, экземпляров классов и т.п.

### Как правильно использовать reactive с классическими классами (class)

Vue не делает экземпляры классов реактивными полностью. Обычно вы:

- Либо храните только «простые» данные в `reactive`-объекте.
- Либо создаете класс, но не ожидаете, что его методы и прототип будут полностью интегрированы в реативность.

Решение – использовать `reactive` для «чистых» данных, а класс держать снаружи:

```js
class Model {
  constructor(data) {
    this.data = data
  }
  increment() {
    this.data.count++
  }
}

const state = reactive({ count: 0 })
const model = new Model(state)
// Реактивность работает на state, а model инкапсулирует логику
```