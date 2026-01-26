---
metaTitle: JSX с Vue с использованием плагина vue-jsx
metaDescription: Разбор работы с JSX в Vue 3 с использованием плагина vue-jsx - синтаксис настройка проектов типизация и практические примеры
author: Олег Марков
title: JSX в Vue с использованием плагина vue-jsx
preview: Узнайте как использовать JSX в Vue 3 с помощью плагина vue-jsx - настройка окружения примеры компонентов типизация и лучшие практики
---

## Введение

JSX традиционно ассоциируется с React, но многие разработчики хотят использовать его и в Vue. Это понятное желание, потому что JSX даёт привычный JavaScript-синтаксис без шаблонов и позволяет использовать мощь языка прямо в разметке.

В экосистеме Vue за поддержку JSX в основном отвечает официальный плагин для сборщика `@vue/babel-plugin-jsx`, который чаще всего и называют vue-jsx. С его помощью вы можете писать компоненты Vue в виде функций, использовать хуки, слоты и директивы прямо в JSX и при этом не отказываться от типичных возможностей Vue.

Здесь я покажу вам, как это работает на практике: мы разберём базовую настройку, синтаксис, особенности отличий от шаблонов и типичные приёмы, которые пригодятся в реальных проектах.

---

## Что такое JSX в контексте Vue

### Кратко о JSX

JSX — это синтаксический сахар поверх JavaScript, который позволяет писать разметку, похожую на HTML, прямо внутри JS/TS-кода. В итоге JSX превращается в обычные вызовы функций, которые создают виртуальные узлы.

В Vue 3 JSX компилируется в вызовы `h` (`createVNode`) из пакета `vue`. То есть этот код:

```tsx
// Компонент на JSX
export default () => {
  return <div class="box">Привет</div>
}
```

В итоге будет преобразован в нечто вроде:

```ts
// Примерный результат трансформации
import { h } from "vue"

export default () => {
  // Здесь создаётся виртуальный DOM-узел <div class="box">Привет</div>
  return h("div", { class: "box" }, "Привет")
}
```

Вам не нужно писать вызовы `h` руками — за это отвечает транспилер (Babel или esbuild/tsc в связке с плагинами).

### Почему использовать JSX с Vue

Давайте перечислим основные причины, почему разработчики выбирают JSX вместо стандартных шаблонов `.vue`:

1. Единый язык  
   Вся логика и разметка на одном языке — JavaScript или TypeScript, без отдельного синтаксиса шаблонов.

2. Выражаемость  
   Более гибкие возможности по сравнению с директивами `v-if`, `v-for` и т.п. Например, вы можете использовать любые условия и циклы JS без ограничений.

3. Легче для людей с опытом React  
   Если вы уже работали с React, JSX в Vue покажется знакомым, а порог входа в экосистему будет ниже.

4. Гибкие компоненты высшего порядка и рендер-функции  
   Vue поддерживает рендер-функции, и JSX — более удобная форма их записи.

Важно понимать, что Vue JSX — это надстройка над системой рендеринга Vue, а не замена. Все реактивные возможности, хуки жизненного цикла и композиционный API остаются теми же.

---

## Установка и настройка vue-jsx

В этом разделе вы увидите, как быстро поднять проект с JSX в разных сценариях: Vite, Vue CLI и ручная конфигурация Babel.

### JSX с Vite и Vue 3

На текущий момент Vite — стандартный инструмент для Vue 3. Вам достаточно подключить официальный плагин `@vitejs/plugin-vue-jsx`.

#### Шаг 1. Установка зависимостей

```bash
# Если проект ещё не создан
npm create vite@latest my-vue-jsx-app -- --template vue-ts

cd my-vue-jsx-app

# Плагин для JSX
npm install -D @vitejs/plugin-vue-jsx
```

#### Шаг 2. Настройка Vite

В файле `vite.config.ts` подключите плагин:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
// Плагин добавляет поддержку JSX/TSX
import vueJsx from "@vitejs/plugin-vue-jsx"

export default defineConfig({
  plugins: [
    vue(),     // Поддержка SFC (.vue)
    vueJsx(),  // Поддержка JSX и TSX
  ],
})
```

После этого вы можете создавать файлы `.jsx` или `.tsx` и писать в них компоненты Vue.

### JSX с Vue CLI (Babel)

Если вы используете Vue CLI (проекты Vue 2 или ранние Vue 3), основа — Babel-плагин `@vue/babel-plugin-jsx`.

#### Шаг 1. Установка плагина

```bash
npm install -D @vue/babel-plugin-jsx
```

#### Шаг 2. Настройка Babel

В `babel.config.js` добавьте плагин:

```js
// babel.config.js
module.exports = {
  presets: [
    "@vue/cli-plugin-babel/preset",
  ],
  plugins: [
    // Плагин добавляет поддержку JSX
    "@vue/babel-plugin-jsx",
  ],
}
```

Теперь сборка будет понимать JSX в файлах `.jsx` и `.tsx`.

### Минимальная ручная конфигурация Babel (без Vue CLI)

Если у вас кастомный Babel-конфиг, настройка похожа:

```bash
npm install -D @babel/core @babel/preset-env @vue/babel-plugin-jsx
```

```js
// babel.config.js
module.exports = {
  presets: [
    "@babel/preset-env",
  ],
  plugins: [
    "@vue/babel-plugin-jsx",
  ],
}
```

Важный момент: `@vue/babel-plugin-jsx` уже сам знает, как обрабатывать особенности Vue (например, `v-model` или директивы), вам не нужен классический `@babel/plugin-transform-react-jsx`.

---

## Базовый синтаксис Vue-компонентов в JSX

Теперь давайте посмотрим, как выглядит простой компонент Vue, написанный на JSX.

### Функциональный компонент

Простейшая форма компонента — это функция, которая возвращает JSX. В Vue 3 такая функция может быть компонентом.

```tsx
// src/components/HelloMessage.tsx
import { defineComponent } from "vue"

export default defineComponent({
  name: "HelloMessage",
  props: {
    name: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    // Здесь мы используем пропс name и возвращаем JSX
    return () => (
      <div class="hello-message">
        Привет, {props.name}
      </div>
    )
  },
})
```

Здесь я размещаю пример, чтобы вам было проще увидеть ключевую идею:

- В `setup` мы описываем логику и реактивное состояние.
- Функция, возвращённая из `setup`, — это рендер-функция, которая использует JSX.
- В JSX мы спокойно используем `props.name` и любые выражения на JavaScript.

### Компонент как чистая функция

При простых сценариях можно вообще не вызывать `defineComponent`. Vue умеет интерпретировать простую функцию как компонент.

```tsx
// Очень простой функциональный компонент
export const SimpleBox = (props: { text: string }) => {
  // Здесь мы просто возвращаем JSX, не используя setup
  return <div class="simple-box">{props.text}</div>
}
```

Однако для более сложных случаев (реактивность, хуки) лучше использовать `defineComponent` — это улучшает типизацию и делает код предсказуемее.

---

## Работа с пропсами, событиями и слотом в JSX

### Описание пропсов

В TypeScript-проектах часто удобнее описывать пропсы с помощью `defineComponent` и опции `props`. Давайте разберёмся на примере.

```tsx
// Card.tsx
import { defineComponent } from "vue"

export default defineComponent({
  name: "Card",
  props: {
    title: {
      type: String,
      required: true,
    },
    bordered: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { slots }) {
    return () => (
      <div class={["card", { "card--bordered": props.bordered }]}>
        <h3 class="card__title">{props.title}</h3>

        {/* Здесь мы выводим слот по умолчанию, если он передан */}
        <div class="card__content">
          {slots.default ? slots.default() : null}
        </div>
      </div>
    )
  },
})
```

Обратите внимание:

- Пропсы получаем через `props` из `setup`.
- Классы можно задавать как строкой, так и массивом или объектом — так же, как в шаблонах.
- Слоты доступны через объект `slots`.

### Обработка событий (emit) в JSX

Теперь давайте посмотрим, как работать с событиями. В Vue вы часто используете `emit`, и в JSX всё аналогично.

```tsx
// Button.tsx
import { defineComponent } from "vue"

export default defineComponent({
  name: "UiButton",
  emits: ["click"],
  props: {
    label: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const handleClick = (event: MouseEvent) => {
      // Здесь мы пробрасываем событие клика вверх
      emit("click", event)
    }

    return () => (
      <button class="ui-button" onClick={handleClick}>
        {props.label}
      </button>
    )
  },
})
```

В JSX обработчики событий записываются через `onClick`, `onInput`, `onChange` и т.д. Плагин `vue-jsx` автоматически мапит их на события Vue.

Например:

- `onClick` → прослушивание нативного события `click`.
- `onUpdate:modelValue` → слушатель для `update:modelValue`, полезен с `v-model`.

### Работа со слотами

В JSX вы работаете со слотами не через специальные директивы, а через передачу функций-слотов. Вот как может выглядеть родительский компонент, который использует `Card`:

```tsx
// Parent.tsx
import { defineComponent } from "vue"
import Card from "./Card"

export default defineComponent({
  name: "Parent",
  setup() {
    return () => (
      <Card title="Заголовок карточки">
        {/* Содержимое слота по умолчанию */}
        <p>Текст внутри карточки</p>
      </Card>
    )
  },
})
```

Если у компонента есть именованные слоты, они передаются как пропсы, содержащие функции:

```tsx
// Layout.tsx
import { defineComponent } from "vue"

export default defineComponent({
  name: "Layout",
  setup(props, { slots }) {
    return () => (
      <div class="layout">
        <header class="layout__header">
          {/* Именованный слот header */}
          {slots.header ? slots.header() : null}
        </header>

        <main class="layout__content">
          {slots.default ? slots.default() : null}
        </main>
      </div>
    )
  },
})
```

А использовать такой компонент можно так:

```tsx
// App.tsx
import { defineComponent } from "vue"
import Layout from "./Layout"

export default defineComponent({
  name: "App",
  setup() {
    return () => (
      <Layout
        v-slots={{
          header: () => <h1>Здесь шапка</h1>,
          default: () => <p>Основной контент</p>,
        }}
      />
    )
  },
})
```

В JSX для передачи именованных слотов есть удобный синтаксис `v-slots`, который работает как объект с функциями.

---

## Управляющие конструкции: условия и циклы в JSX

Одно из главных преимуществ JSX — использование нативных конструкций JavaScript для ветвления и итераций.

### Условия

Вместо директивы `v-if` вы используете обычный `if`, тернарные выражения или логические операторы. Давайте разберёмся на примере.

```tsx
// StatusLabel.tsx
import { defineComponent } from "vue"

export default defineComponent({
  name: "StatusLabel",
  props: {
    online: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <span class={["status-label", props.online ? "online" : "offline"]}>
        {props.online ? "Онлайн" : "Оффлайн"}
      </span>
    )
  },
})
```

Можно использовать и конструкции с ранним возвратом:

```tsx
// Если компонент ничего не должен отрисовать — возвращаем null
if (!props.online) {
  return null
}
```

Компилятор JSX корректно обрабатывает `null` и `false`, они просто не попадают в результирующую разметку.

### Циклы

Вместо `v-for` используйте обычный `map`. Теперь вы увидите, как это выглядит.

```tsx
// TodoList.tsx
import { defineComponent } from "vue"

type Todo = {
  id: number
  text: string
  done: boolean
}

export default defineComponent({
  name: "TodoList",
  props: {
    items: {
      type: Array as () => Todo[],
      required: true,
    },
  },
  setup(props) {
    return () => (
      <ul class="todo-list">
        {props.items.map(item => (
          <li key={item.id} class={{ done: item.done }}>
            {/* Здесь мы выводим текст задачи */}
            {item.text}
          </li>
        ))}
      </ul>
    )
  },
})
```

Обратите внимание:

- Атрибут `key` задаётся как в React — простое свойство на JSX-элементе.
- Для классов можно использовать объект `class={{ done: item.done }}`.

---

## Атрибуты, классы, стили и привязки

Vue JSX повторяет многие правила, к которым вы привыкли в шаблонах, но в JS-форме.

### Классы

Можно использовать:

- Строку
- Массив
- Объект

```tsx
<div class="box" />

<div class={["box", "box--large"]} />

<div class={["box", { "box--active": isActive }]} />
```

### Стили

Стили можно задавать объектом:

```tsx
<div
  style={{
    color: "red",
    fontSize: "14px",
  }}
/>
```

Если вы используете CSS-переменные, их можно указать строкой:

```tsx
<div style="--primary-color: #42b883;" />
```

### Передача произвольных атрибутов

Вы можете передавать пропсы и атрибуты с помощью оператора spread. Давайте посмотрим:

```tsx
const extraProps = {
  id: "my-id",
  "data-test": "example", // нестандартный атрибут
}

return () => <div class="box" {...extraProps}>Текст</div>
```

Плагин `vue-jsx` корректно обрабатывает kebab-case атрибуты, если вы описываете их как строки.

---

## v-model и двухсторонняя привязка в JSX

В шаблонах Vue вы привыкли к `v-model`. В JSX его нужно записывать чуть иначе, но идея остаётся той же.

### Базовый v-model

Предположим, у нас есть компонент `TextInput`, который использует `modelValue` и `update:modelValue`.

```tsx
// TextInput.tsx
import { defineComponent } from "vue"

export default defineComponent({
  name: "TextInput",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement
      // Отправляем новое значение в родительский компонент
      emit("update:modelValue", target.value)
    }

    return () => (
      <input
        class="text-input"
        value={props.modelValue}
        onInput={onInput}
      />
    )
  },
})
```

Использовать этот компонент с v-model можно в JSX следующим образом:

```tsx
// Parent.tsx
import { defineComponent, ref } from "vue"
import TextInput from "./TextInput"

export default defineComponent({
  name: "Parent",
  setup() {
    const name = ref("")

    return () => (
      <div>
        <TextInput
          // Указываем значение
          modelValue={name.value}
          // Обрабатываем событие обновления
          onUpdate:modelValue={val => (name.value = val)}
        />

        <p>Вы ввели: {name.value}</p>
      </div>
    )
  },
})
```

Ключевой момент: `onUpdate:modelValue` пишется через двоеточие в имени пропса, так как это синтаксис Vue-события `update:modelValue`.

### Несколько v-model

Если компонент поддерживает несколько моделей, например:

- `modelValue` для значения
- `checked` для флажка

Схема та же — вы используете соответствующие события:

```tsx
<MyComponent
  modelValue={value.value}
  onUpdate:modelValue={val => (value.value = val)}
  checked={checked.value}
  onUpdate:checked={val => (checked.value = val)}
/>
```

---

## Директивы в JSX

Vue поддерживает пользовательские директивы (`v-focus`, `v-tooltip` и т.п.). В шаблонах вы пишете их в явном виде, а в JSX используется немного другой синтаксис.

### Базовое использование директив

В JSX директивы передаются через специальный проп `v-fx` внутри объекта `directives`. Однако `@vue/babel-plugin-jsx` поддерживает упрощённый синтаксис.

Смотрите, я покажу вам пример пользовательской директивы `v-focus`, которая фокусирует input при монтировании.

```ts
// directives/focus.ts
import { Directive } from "vue"

export const vFocus: Directive<HTMLInputElement> = {
  mounted(el) {
    // Здесь мы фокусируем элемент после монтирования
    el.focus()
  },
}
```

Использование в JSX выглядит так:

```tsx
// InputWithFocus.tsx
import { defineComponent } from "vue"
import { vFocus } from "./directives/focus"

export default defineComponent({
  name: "InputWithFocus",
  directives: {
    focus: vFocus, // Регистрируем директиву на уровне компонента
  },
  setup() {
    return () => (
      <input
        v-focus
        class="input-with-focus"
      />
    )
  },
})
```

Плагин позволяет использовать запись `v-focus` прямо как проп, если директива зарегистрирована в `directives` или глобально.

Если нужен аргумент или модификаторы, используется более развёрнутая форма, например:

```tsx
<input v-focus={[value, "arg", ["mod1", "mod2"]]} />
```

Но такой синтаксис используется редко. Чаще всего достаточно простого указания `v-myDirective`.

---

## JSX и Composition API

JSX отлично сочетается с Composition API. Вы пишете логику так же, как в `.vue` файлах, но возвращаете JSX.

Давайте разберёмся на примере небольшого компонента со счётчиком.

```tsx
// Counter.tsx
import { defineComponent, ref } from "vue"

export default defineComponent({
  name: "Counter",
  setup() {
    const count = ref(0)

    const increment = () => {
      // Увеличиваем счётчик при каждом клике
      count.value += 1
    }

    return () => (
      <div class="counter">
        <p>Значение: {count.value}</p>
        <button onClick={increment}>Увеличить</button>
      </div>
    )
  },
})
```

Все хуки `onMounted`, `onUnmounted`, `computed`, `watch` и т.п. работают так же, как в любых других компонентах Vue.

---

## Типизация JSX компонентов в TypeScript

TypeScript и Vue JSX дают хорошую автодополняемость и проверку типов, если правильно их настроить.

### Типизация пропсов

Самый надёжный способ — описать пропсы в опции `props` и использовать `defineComponent`. Тогда Vue-типизация автоматически вычислит тип `props` в `setup`.

```tsx
// TypedButton.tsx
import { defineComponent } from "vue"

export default defineComponent({
  name: "TypedButton",
  props: {
    label: {
      type: String,
      required: true,
    },
    primary: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    return () => (
      <button
        class={["btn", { "btn--primary": props.primary }]}
      >
        {props.label}
      </button>
    )
  },
})
```

В `setup` `props.label` и `props.primary` уже будут строго типизированы.

### Функциональные компоненты с типами

Если вы пишете функциональные компоненты без `defineComponent`, можно описывать пропсы через интерфейсы или типы:

```tsx
// Badge.tsx
export type BadgeProps = {
  text: string
  color?: "green" | "red" | "gray"
}

export const Badge = (props: BadgeProps) => {
  const colorClass = props.color ? `badge--${props.color}` : "badge--gray"

  return (
    <span class={["badge", colorClass]}>
      {/* Здесь мы выводим текст бейджа */}
      {props.text}
    </span>
  )
}
```

Минус такого подхода — Vue не знает о типах пропсов на уровне рантайма, поэтому валидация пропсов будет на совести TypeScript.

---

## Сравнение JSX и шаблонов Vue

Давайте кратко сравним два подхода, чтобы вы чётче понимали, когда использовать JSX.

### Плюсы JSX в Vue

- Полноценный JavaScript в разметке без ограничений.
- Гибкие паттерны, связанные с рендер-функциями и компонентами высшего порядка.
- Привычный синтаксис для разработчиков, привыкших к React.
- Удобная интеграция с TypeScript при правильной конфигурации.

### Минусы JSX в Vue

- Хуже читаемость для команды, которая привыкла к `.vue` шаблонам.
- Слабее инструменты в экосистеме: меньше визуальных редакторов и подсветок именно под Vue JSX.
- Некоторым сложнее визуально отделять разметку от логики.

Обычно рекомендуется использовать JSX:

- В библиотечных, низкоуровневых и переиспользуемых компонентах.
- В случаях, когда стандартный синтаксис шаблонов слишком ограничивает.
- В проектах, где команда уже активно использует JSX (например, мигрирует с React).

---

## Практический пример: список с фильтрацией в JSX

Чтобы собрать всё воедино, давайте реализуем простой список с фильтрацией. Это покажет, как JSX и Composition API работают вместе в реальной задаче.

```tsx
// FilteredList.tsx
import { defineComponent, computed, ref } from "vue"

type Item = {
  id: number
  name: string
}

export default defineComponent({
  name: "FilteredList",
  props: {
    items: {
      type: Array as () => Item[],
      required: true,
    },
  },
  setup(props) {
    const query = ref("")

    // Здесь мы вычисляем отфильтрованный список по введённой строке
    const filteredItems = computed(() => {
      if (!query.value.trim()) {
        return props.items
      }
      const lower = query.value.toLowerCase()
      return props.items.filter(item =>
        item.name.toLowerCase().includes(lower),
      )
    })

    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement
      query.value = target.value
    }

    return () => (
      <div class="filtered-list">
        <input
          class="filtered-list__input"
          placeholder="Фильтр по имени"
          value={query.value}
          onInput={onInput}
        />

        <ul class="filtered-list__items">
          {filteredItems.value.map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      </div>
    )
  },
})
```

Как видите, этот код выполняет сразу несколько задач:

- Хранит строку поиска в реактивном `ref`.
- С помощью `computed` считает отфильтрованный массив.
- Рендерит список с помощью `map` и JSX.

---

## Заключение

JSX с Vue через плагин vue-jsx даёт вам возможность писать компоненты без шаблонов и использовать весь арсенал JavaScript прямо в разметке. Это особенно удобно при создании библиотек компонентов, сложных рендер-функций и в командах, где уже привыкли работать с JSX.

Ключевые моменты, которые важно запомнить:

- Используйте `@vitejs/plugin-vue-jsx` с Vite или `@vue/babel-plugin-jsx` с Babel.
- В JSX для Vue остаются все привычные концепции: пропсы, emit, слоты, директивы и v-model, только выражаются они в виде пропсов и функций.
- Управляющие конструкции выполняются на чистом JavaScript: `if`, тернарные операторы и `map` вместо `v-if` и `v-for`.
- Типизация с TypeScript работает особенно хорошо в связке с `defineComponent`.

Если в вашем проекте есть место для функций-рендеров или вы хотите использовать более выразительный JavaScript в разметке, JSX с Vue — сильный инструмент, который стоит рассмотреть.

---

## Частозадаваемые технические вопросы по JSX с Vue и vue-jsx

### Как настроить автодополнение и подсветку JSX в VS Code для Vue проекта

1. Убедитесь, что используете TypeScript и файлы с расширением `.tsx`.
2. В `tsconfig.json` добавьте:
   ```json
   {
     "compilerOptions": {
       "jsx": "preserve",
       "jsxImportSource": "vue"
     }
   }
   ```
3. Установите расширения Volar и TypeScript Vue Plugin.
4. В настройках VS Code отключите Vetur, если он конфликтует с Volar.

### Почему события не срабатывают при использовании onClick в JSX

1. Проверьте, правильно ли вы написали имя события: должно быть `onClick`, а не `onclick`.
2. Убедитесь, что вы не забыли вернуть JSX из функции `setup`.
3. Если вы вешаете обработчик на пользовательский компонент, а не на DOM-элемент, убедитесь, что компонент эмитит событие `click` через `emit("click")`.
4. Для нативных событий обычно достаточно `onClick`, для кастомных — `onMyEvent`.

### Как использовать ref на DOM элементе в JSX

1. Создайте ref в `setup`:
   ```ts
   const inputRef = ref<HTMLInputElement | null>(null)
   ```
2. В JSX передайте его как `ref`:
   ```tsx
   <input ref={inputRef} />
   ```
3. Используйте `inputRef.value` внутри хуков `onMounted` или обработчиков, проверяя, что значение не `null`.

### Как подключить глобальные компоненты в проекте с JSX

1. Зарегистрируйте компонент глобально в `main.ts`:
   ```ts
   app.component("MyGlobalComponent", MyGlobalComponent)
   ```
2. В JSX вы можете использовать его по имени:
   ```tsx
   return () => <MyGlobalComponent someProp="value" />
   ```
3. Для автодополнения в TS добавьте декларацию глобальных компонентов в `env.d.ts` или аналогичный файл.

### Как использовать Suspense и асинхронные компоненты с JSX

1. Импортируйте `defineAsyncComponent` и `Suspense`:
   ```ts
   import { defineAsyncComponent, h, Suspense } from "vue"
   ```
2. Определите асинхронный компонент:
   ```ts
   const AsyncView = defineAsyncComponent(() => import("./AsyncView"))
   ```
3. Используйте в JSX:
   ```tsx
   return () => (
     <Suspense>
       {{
         default: () => <AsyncView />,
         fallback: () => <div>Загрузка...</div>,
       }}
     </Suspense>
   )
   ```