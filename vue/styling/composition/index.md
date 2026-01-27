---
metaTitle: Стили в Composition API Vue 3 - полный гид по styling-composition
metaDescription: Подробное руководство по работе со стилями в Vue 3 с использованием Composition API - способы подключения стилей, работа с scoped и модулями, динамические классы и CSS переменные
author: Олег Марков
title: Стили в Composition API Vue 3 - практическое руководство
preview: Разберитесь как организовать стили в приложении на Vue 3 с Composition API - от простых классов до динамических стилей и переиспользуемой логики оформления
---

## Введение

Стилизация компонентов в Vue 3 с Composition API на первый взгляд почти не отличается от привычного подхода с Options API. Но как только вы начинаете выносить логику в `setup`, `composables` и переиспользуемые хуки, сразу появляется вопрос: где и как лучше управлять стилями, чтобы не превратить проект в хаос?

Здесь я покажу вам, как грамотно организовать стили в компонентах, построенных на Composition API, какие паттерны использовать, как комбинировать стили и логику в `setup`, а также как оформлять переиспользуемые композиционные функции, которые управляют классами, CSS-переменными и состоянием оформления.

В статье мы будем опираться на Vue 3, но многие принципы подойдут и для будущих версий фреймворка.

---

## Базовые принципы стилизации в компонентах с Composition API

### Классический `<style>` и Composition API

Сначала давайте зафиксируем базовый сценарий: стили по-прежнему объявляются в блоке `<style>` компонента, а логика — в `setup`. Сочетание довольно простое.

Пример простого компонента с Composition API и базовыми стилями:

```vue
<script setup>
// Импортируем reactivity API
import { ref } from 'vue'

// Управляем состоянием кнопки в setup
const isPrimary = ref(true)

const toggleVariant = () => {
  // Переключаем вариант оформления
  isPrimary.value = !isPrimary.value
}
</script>

<template>
  <button
    class="btn"
    :class="{
      'btn--primary': isPrimary,
      'btn--secondary': !isPrimary
    }"
    @click="toggleVariant"
  >
    Нажмите меня
  </button>
</template>

<style>
/* Базовый стиль кнопки */
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

/* Вариант primary */
.btn--primary {
  background-color: #3b82f6;
  color: white;
}

/* Вариант secondary */
.btn--secondary {
  background-color: #e5e7eb;
  color: #111827;
}
</style>
```

Здесь логика выбора класса полностью живет в `setup`, а стили — в `<style>`. Для простых случаев этого достаточно. Но как только вы захотите переиспользовать логику классов или управлять стилями из нескольких компонентов, этого становится мало.

---

## Scoped стили и Composition API

### Как работает `scoped` в контексте Composition API

Атрибут `scoped` у блока `<style>` продолжает работать так же, как и в Options API: Vue добавляет уникальный атрибут к элементам шаблона и к селекторам стилей, чтобы они применялись только внутри компонента.

Пример:

```vue
<script setup>
const colorVariant = 'success' // Простая константа в setup
</script>

<template>
  <div class="alert" :class="`alert--${colorVariant}`">
    Сообщение
  </div>
</template>

<style scoped>
/* Эти стили применятся только к элементам внутри данного компонента */
.alert {
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
}

/* Модификатор для success */
.alert--success {
  background-color: #dcfce7;
  color: #166534;
}
</style>
```

Важный момент: `scoped` **никак** не зависит от того, используете вы Composition API или Options API. Все, что вы делаете в `setup`, просто влияет на классы и атрибуты в шаблоне. Уже по ним Vue сопоставляет нужные стили.

### Вложенные компоненты и стили родителя

Если вы используете `scoped`, стили по умолчанию не "просачиваются" в дочерние компоненты. Иногда это хорошо, но бывают ситуации, когда нужно отстилизовать внутреннюю разметку дочернего компонента.

Для этого Vue 3 предлагает псевдо-селектор `:deep()`.

Давайте разберемся на примере:

```vue
<!-- ParentComponent.vue -->
<script setup>
import ChildComponent from './ChildComponent.vue'
</script>

<template>
  <div class="card">
    <ChildComponent />
  </div>
</template>

<style scoped>
.card {
  padding: 16px;
  border: 1px solid #e5e7eb;
}

/* Стили применяются к элементам внутри ChildComponent */
:deep(.child-title) {
  font-weight: bold;
  color: #111827;
}
</style>
```

```vue
<!-- ChildComponent.vue -->
<template>
  <h2 class="child-title">Заголовок</h2>
</template>

<style scoped>
.child-title {
  font-size: 18px;
}
</style>
```

Покажу вам, как это работает:

- `.child-title` внутри `ChildComponent` получает стили как из своего `scoped` блока, так и из `:deep(.child-title)` родителя.
- `:deep()` позволяет родителю пробраться через границу `scoped` и применить свои правила.

---

## Динамические классы и инлайн-стили в Composition API

### Использование `computed` для классов

Один из ключевых плюсов Composition API — удобно выносить вычисление классов в `computed`. Это делает шаблон чище и упрощает повторное использование.

Давайте разберемся на примере компонента, который отображает статус элемента:

```vue
<script setup>
import { computed } from 'vue'

// Проп status передается снаружи
const props = defineProps({
  status: {
    type: String,
    default: 'pending' // pending | success | error
  }
})

// Вычисляем CSS-классы для статуса
const statusClass = computed(() => {
  // Базовый класс
  const base = 'status-tag'

  // Маппинг статусов в модификаторы
  const map = {
    pending: 'status-tag--pending',
    success: 'status-tag--success',
    error: 'status-tag--error'
  }

  // Возвращаем массив классов
  return [base, map[props.status] || map.pending]
})
</script>

<template>
  <!-- К computed-свойству можно привязываться напрямую -->
  <span :class="statusClass">
    {{ status === 'success' ? 'Успех' : status === 'error' ? 'Ошибка' : 'В процессе' }}
  </span>
</template>

<style scoped>
.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-tag--pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-tag--success {
  background-color: #dcfce7;
  color: #166534;
}

.status-tag--error {
  background-color: #fee2e2;
  color: #991b1b;
}
</style>
```

Как видите, логика определения класса теперь сосредоточена в `computed`. Такой подход удобно выносить в композиционные функции.

### Инлайн-стили через `computed` и `style` binding

Иногда нужен контроль до уровня конкретных CSS-свойств. Тогда вы можете вернуть объект стилей из `computed` и привязать его к `:style`.

```vue
<script setup>
import { ref, computed } from 'vue'

const progress = ref(30) // Значение прогресса в процентах

// Вычисляем ширину полосы прогресса
const barStyle = computed(() => {
  return {
    width: `${progress.value}%`, // Ширина зависит от состояния
    transition: 'width 0.3s ease' // Плавная анимация
  }
})

// Метод для обновления прогресса
const setProgress = (value) => {
  // Ограничиваем значение от 0 до 100
  progress.value = Math.min(100, Math.max(0, value))
}
</script>

<template>
  <div class="progress">
    <!-- Применяем вычисленные инлайн-стили -->
    <div class="progress__bar" :style="barStyle"></div>
  </div>

  <button @click="setProgress(progress + 10)">Увеличить</button>
</template>

<style scoped>
.progress {
  width: 200px;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress__bar {
  height: 100%;
  background-color: #3b82f6;
}
</style>
```

Здесь динамика оформлена максимально прозрачно: `barStyle` живет в Composition API, а CSS-правила по умолчанию остаются в `<style>`.

---

## Переиспользуемая логика стилизации в композиционных функциях

Теперь давайте перейдем к самому интересному: как упаковать логику работы со стилями в композиционные функции (`composables`), чтобы вы могли использовать ее в разных компонентах.

### Базовый паттерн `useXxxClasses`

Самый распространенный подход — создавать функции вида `useButtonClasses`, `useTypography`, `useThemeColors` и т.п.

Пример простой композиционной функции для кнопки:

```ts
// useButtonStyles.ts
import { computed } from 'vue'

export function useButtonStyles(props: {
  variant?: string
  size?: string
  disabled?: boolean
}) {
  // Вычисляем классы кнопки
  const buttonClasses = computed(() => {
    return [
      'btn', // базовый класс
      props.variant ? `btn--${props.variant}` : 'btn--primary',
      props.size ? `btn--${props.size}` : 'btn--medium',
      props.disabled && 'btn--disabled'
    ]
  })

  return {
    buttonClasses
  }
}
```

Теперь давайте посмотрим, как это выглядит в компоненте:

```vue
<script setup lang="ts">
// Подключаем композиционную функцию
import { useButtonStyles } from './useButtonStyles'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}>()

// Получаем классы из композиционной функции
const { buttonClasses } = useButtonStyles(props)
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
/* Базовый стиль */
.btn {
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Варианты цветов */
.btn--primary {
  background-color: #3b82f6;
  color: white;
}

.btn--secondary {
  background-color: #e5e7eb;
  color: #111827;
}

.btn--danger {
  background-color: #ef4444;
  color: white;
}

/* Размеры */
.btn--small {
  padding: 4px 8px;
  font-size: 12px;
}

.btn--medium {
  padding: 8px 16px;
  font-size: 14px;
}

.btn--large {
  padding: 12px 20px;
  font-size: 16px;
}

/* Состояние disabled */
.btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

Смотрите, как это работает:

- Вся логика выбора классов сосредоточена в `useButtonStyles`.
- Сам компонент становится тонким: он просто связывает пропсы и шаблон.
- Стили по-прежнему определяются в одном месте — в `<style>` компонента или даже в отдельном CSS-файле.

### Комбинирование нескольких композиционных функций стилизации

Иногда один компонент использует сразу несколько "слоев" стилей: например, тема, размер, состояние ошибки. В этом случае удобно разбивать логику на отдельные хуки и комбинировать их.

```ts
// useSizeClasses.ts
import { computed } from 'vue'

export function useSizeClasses(props: { size?: string }, baseClass: string) {
  const sizeClass = computed(() => {
    const size = props.size || 'medium'

    return `${baseClass}--${size}`
  })

  return { sizeClass }
}
```

```ts
// useThemeClasses.ts
import { computed } from 'vue'

export function useThemeClasses(props: { theme?: string }, baseClass: string) {
  const themeClass = computed(() => {
    const theme = props.theme || 'light'
    return `${baseClass}--theme-${theme}`
  })

  return { themeClass }
}
```

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useSizeClasses } from './useSizeClasses'
import { useThemeClasses } from './useThemeClasses'

const props = defineProps<{
  size?: 'small' | 'medium' | 'large'
  theme?: 'light' | 'dark'
  hasError?: boolean
}>()

const baseClass = 'input'

// Получаем классы размера и темы
const { sizeClass } = useSizeClasses(props, baseClass)
const { themeClass } = useThemeClasses(props, baseClass)

// Собираем итоговый список классов
const inputClasses = computed(() => {
  return [
    baseClass,
    sizeClass.value,
    themeClass.value,
    props.hasError && `${baseClass}--error`
  ]
})
</script>

<template>
  <input :class="inputClasses" />
</template>

<style scoped>
.input {
  border-radius: 4px;
  border: 1px solid #d1d5db;
}

/* Размеры */
.input--small {
  padding: 4px 8px;
  font-size: 12px;
}

.input--medium {
  padding: 6px 10px;
  font-size: 14px;
}

.input--large {
  padding: 8px 12px;
  font-size: 16px;
}

/* Темы */
.input--theme-light {
  background-color: white;
  color: #111827;
}

.input--theme-dark {
  background-color: #111827;
  color: white;
}

/* Ошибка */
.input--error {
  border-color: #ef4444;
}
</style>
```

Теперь вы видите, как легко масштабировать систему стилей, не меняя архитектуру компонентов.

---

## CSS Modules и Composition API

### Что такое CSS Modules в контексте Vue 3

CSS Modules позволяют импортировать классы как объект, где имена классов превращаются в уникальные хэши. Это помогает избежать конфликтов имен в больших проектах.

В Vue 3 вы можете использовать CSS Modules в рамках однокомпонентного файла (`.vue`), указав `module` у блока `<style>`.

Пример:

```vue
<script setup>
// Импортируем сгенерированный объект модулей
// В script setup он автоматически доступен как useCssModule
const $style = useCssModule()
// Теперь $style содержит соответствие имен классов и сгенерированных имен
</script>

<template>
  <!-- Применяем классы через объект $style -->
  <div :class="$style.container">
    <p :class="$style.text">Текст</p>
  </div>
</template>

<style module>
.container {
  padding: 16px;
  background-color: #f3f4f6;
}

.text {
  color: #111827;
}
</style>
```

### Использование CSS Modules в композиционных функциях

Один из частых вопросов: как использовать CSS Modules внутри композиционных функций, чтобы не привязывать логику к конкретному компоненту?

Давайте разберемся на примере. Мы можем передавать `$style` внутрь композиционной функции как аргумент.

```ts
// useCardStyles.ts
import { computed } from 'vue'

export function useCardStyles(
  styleModule: Record<string, string>, // Объект CSS Modules
  props: { elevated?: boolean }
) {
  const cardClass = computed(() => {
    return [
      styleModule.card,
      props.elevated && styleModule['card--elevated']
    ]
  })

  return { cardClass }
}
```

```vue
<script setup lang="ts">
import { useCardStyles } from './useCardStyles'

// Получаем модуль стилей из useCssModule
const $style = useCssModule()

const props = defineProps<{
  elevated?: boolean
}>()

// Передаем модуль стилей в композиционную функцию
const { cardClass } = useCardStyles($style, props)
</script>

<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>

<style module>
.card {
  padding: 16px;
  border-radius: 8px;
  background-color: white;
}

/* Приподнятая карточка */
.card--elevated {
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.15);
}
</style>
```

Смотрите, как это реализовано:

- Композиционная функция ничего не знает о Vue-шаблоне, она просто работает с объектом стилей.
- Компонент решает, какой именно модуль стилей ему передать.
- Такой подход делает логику максимально переиспользуемой.

---

## Управление темами и CSS-переменными через Composition API

### Тема через корневые CSS-переменные

Распространенный сценарий — реализовать светлую и темную тему через CSS-переменные (`--color-primary`, `--background` и т.п.) и управлять ими из Composition API.

Давайте посмотрим, как это может выглядеть.

Сначала создадим общие CSS-переменные:

```css
/* theme.css */
/* Светлая тема по умолчанию */
:root {
  --bg-color: #ffffff;
  --text-color: #111827;
  --accent-color: #3b82f6;
}

/* Темная тема */
:root[data-theme='dark'] {
  --bg-color: #0f172a;
  --text-color: #f9fafb;
  --accent-color: #60a5fa;
}
```

Теперь сделаем композиционную функцию, которая будет управлять атрибутом `data-theme` на уровне `document.documentElement`.

```ts
// useTheme.ts
import { ref, watchEffect, onMounted } from 'vue'

type Theme = 'light' | 'dark'

export function useTheme() {
  const theme = ref<Theme>('light')

  // Синхронизируем тему с DOM
  const applyTheme = (value: Theme) => {
    // Устанавливаем атрибут data-theme на html
    document.documentElement.setAttribute('data-theme', value)
  }

  // Применяем тему при изменении значения
  watchEffect(() => {
    applyTheme(theme.value)
  })

  // При монтировании можно считать сохраненное значение из localStorage
  onMounted(() => {
    const saved = window.localStorage.getItem('app-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') {
      theme.value = saved
    } else {
      // Опционально определяем тему по prefers-color-scheme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
    }
  })

  const toggleTheme = () => {
    // Переключаем тему
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    window.localStorage.setItem('app-theme', theme.value)
  }

  return {
    theme,
    toggleTheme
  }
}
```

Теперь вы увидите, как это выглядит в коде компонента:

```vue
<script setup lang="ts">
import { useTheme } from './useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button @click="toggleTheme">
    Текущая тема - {{ theme === 'light' ? 'светлая' : 'темная' }}
  </button>

  <div class="theme-demo">
    Этот блок меняет цвета в зависимости от темы
  </div>
</template>

<style scoped>
.theme-demo {
  /* Используем CSS-переменные */
  background-color: var(--bg-color);
  color: var(--text-color);
  border: 1px solid var(--accent-color);
  padding: 16px;
  border-radius: 8px;
}
</style>
```

Как только вы меняете `theme.value`, все компоненты, использующие CSS-переменные, автоматически подстраиваются под новую тему. Composition API в данном случае управляет только атрибутом и состоянием, а все визуальные эффекты описаны в CSS.

### Локальные CSS-переменные на уровне компонента

Иногда нужно управлять CSS-переменными только внутри одного компонента, например, цветом прогресс-бара или размером отступов.

Здесь удобно использовать биндинг к `style` с установкой `--variable-name`.

```vue
<script setup>
import { ref, computed } from 'vue'

const color = ref('#3b82f6')
const size = ref(40)

// Вычисляем объект инлайн-стилей с CSS-переменными
const circleVars = computed(() => {
  return {
    '--circle-color': color.value,
    '--circle-size': `${size.value}px`
  }
})
</script>

<template>
  <!-- Прокидываем CSS-переменные через style -->
  <div class="circle" :style="circleVars"></div>

  <input type="color" v-model="color" />
  <input type="range" :min="20" :max="80" v-model="size" />
</template>

<style scoped>
.circle {
  /* Используем локальные CSS-переменные */
  width: var(--circle-size);
  height: var(--circle-size);
  border-radius: 50%;
  background-color: var(--circle-color);
}
</style>
```

Обратите внимание, как этот фрагмент кода решает задачу:

- Composition API управляет только значениями переменных.
- CSS отвечает за конечный вид.
- Такой подход удобно расширять и переиспользовать, не усложняя шаблон.

---

## Организация и архитектура стилей в проекте с Composition API

### Четкое разделение: "логика — в composables, стили — в CSS"

Хороший практический принцип:

- В composables храните **логику выбора** стилей: какие классы, когда и почему применять.
- В CSS/SCSS храните **описание** этих стилей: как конкретно выглядит класс.

Это позволяет:

- Менять оформление, не трогая логику.
- Переиспользовать одну и ту же композиционную функцию с разными темами (или даже с разными CSS-реализациями).

### Пример структуры проекта

Давайте посмотрим возможную структуру:

```text
src/
  components/
    Button.vue
    Input.vue
    Card.vue
  composables/
    useButtonStyles.ts
    useInputStyles.ts
    useTheme.ts
  styles/
    theme.css
    typography.css
    layout.css
```

- `composables/*Styles.ts` — вычисляют классы и варианты.
- `styles/*` — глобальные и темовые стили (переменные, базовая типографика).
- Компоненты — связывают эти две части через шаблон.

### Переиспользуемые "стилевые пресеты"

Иногда имеет смысл вынести не только логику, но и конкретные наборы классов в отдельные константы или фабрики. Например, для типографики:

```ts
// useTypography.ts
import { computed } from 'vue'

type TextVariant = 'title' | 'subtitle' | 'body' | 'caption'

export function useTypography(props: { variant?: TextVariant }) {
  const textClass = computed(() => {
    const map: Record<TextVariant, string> = {
      title: 'text-title',
      subtitle: 'text-subtitle',
      body: 'text-body',
      caption: 'text-caption'
    }

    const variant = props.variant || 'body'
    return map[variant]
  })

  return {
    textClass
  }
}
```

```vue
<script setup lang="ts">
import { useTypography } from './useTypography'

const props = defineProps<{
  variant?: 'title' | 'subtitle' | 'body' | 'caption'
}>()

const { textClass } = useTypography(props)
</script>

<template>
  <!-- Компонент типографики -->
  <p :class="textClass">
    <slot />
  </p>
</template>

<style scoped>
.text-title {
  font-size: 24px;
  font-weight: 600;
}

.text-subtitle {
  font-size: 18px;
  font-weight: 500;
}

.text-body {
  font-size: 14px;
}

.text-caption {
  font-size: 12px;
  color: #6b7280;
}
</style>
```

Так вы можете создавать единые правила оформления и использовать их по всему приложению.

---

## Работа с утилитарными CSS-фреймворками (Tailwind, Windi и др.)

### Комбинация Tailwind и Composition API

Если вы используете Tailwind CSS или похожий утилитарный фреймворк, Composition API становится особенно удобным для генерации классов.

Например, можно вычислять строки классов на основе пропсов.

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  intent: {
    type: String,
    default: 'primary' // primary | success | danger
  },
  outline: {
    type: Boolean,
    default: false
  }
})

const buttonClasses = computed(() => {
  const base = 'px-3 py-2 rounded text-sm font-medium transition'

  const intents = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }

  const outlined = {
    primary: 'border border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50',
    success: 'border border-green-600 text-green-600 bg-transparent hover:bg-green-50',
    danger: 'border border-red-600 text-red-600 bg-transparent hover:bg-red-50'
  }

  const map = props.outline ? outlined : intents

  return [base, map[props.intent] || map.primary].join(' ')
})
</script>

<template>
  <button :class="buttonClasses">
    <slot />
  </button>
</template>
```

Здесь вы по сути создаете слой абстракции над утилитарными классами, а Composition API помогает управлять этим слоем в зависимости от входных параметров.

---

## Тестирование логики стилизации в Composition API

Когда вы выносите логику формирования классов в композиционные функции, их становится проще тестировать.

Предположим, у нас есть `useButtonStyles` из предыдущего примера. Мы можем протестировать ее как обычную функцию, не поднимая Vue-компонент.

Пример псевдотеста (на упрощенном синтаксисе):

```ts
// useButtonStyles.test.ts
import { useButtonStyles } from './useButtonStyles'
import { nextTick, reactive } from 'vue'

it('должен возвращать правильные классы для primary large', async () => {
  const props = reactive({
    variant: 'primary',
    size: 'large',
    disabled: false
  })

  const { buttonClasses } = useButtonStyles(props)

  await nextTick() // Ждем, пока computed обновится

  expect(buttonClasses.value).toContain('btn')
  expect(buttonClasses.value).toContain('btn--primary')
  expect(buttonClasses.value).toContain('btn--large')
  expect(buttonClasses.value).not.toContain('btn--disabled')
})
```

Смотрите, что здесь важно:

- Composition API позволяет вынести часть логики, которая не зависит от DOM.
- Вы можете проверить, какие классы будут applied, не рендеря компонент.
- Это особенно полезно для сложных систем тем и состояний.

---

## Заключение

Взаимодействие стилей и Composition API в Vue 3 строится вокруг простой идеи: **логика — в `setup` и composables, оформление — в CSS**. Но на практике это раскрывается в целый набор паттернов:

- Использование `computed` для классов и инлайн-стилей.
- Создание композиционных функций для стилизации (`useXxxStyles`).
- Применение `scoped`, `:deep()` и CSS Modules вместе с Composition API.
- Управление темами через CSS-переменные из composables.
- Интеграция с утилитарными CSS-фреймворками на уровне вычисляемых классов.

Если вы будете строго разделять вычисление стилей и их описание, проект останется управляемым даже при большом количестве компонентов и сложной системе тем.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как в композиционной функции получить доступ к `useCssModule`, если она вызывается не из `script setup`?

В `script setup` вы можете вызвать `useCssModule` и передать результат в композиционную функцию:

```ts
// В компоненте
const $style = useCssModule()
const { cardClass } = useCardStyles($style, props)
```

Внутри композиционной функции не надо напрямую вызывать `useCssModule`, чтобы не связывать ее с конкретным компонентом. Лучше всегда передавать модуль стилей параметром. Это делает функцию независимой от контекста Vue.

---

### Как организовать общие стили для нескольких компонентов, если логика оформления у них разная?

Вынесите **базовые** стили в глобальные файлы (`layout.css`, `typography.css`) или в один "базовый" компонент, а логику классов — в отдельные composables. Например, создайте `useSurfaceStyles` для фоновых блоков (карточки, панели, модалки) и подключайте его там, где нужен общий визуальный язык. Сами CSS-классы (`.surface`, `.surface--elevated`) могут быть общими, но логика их применения будет разной в разных компонентах.

---

### Можно ли внутри композиционной функции напрямую изменять стили элемента через `document.querySelector`?

Технически — да, но это считается плохой практикой. Лучше:

1. Хранить состояние (например, `isHighlighted`) в `ref`.
2. Возвращать из composable или классы, или объект стилей.
3. В шаблоне компонента привязать их к `:class` или `:style`.

Прямое изменение DOM-стилей через `document` нарушает реактивность Vue и усложняет тестирование. Используйте такой подход только для низкоуровневых случаев (интеграция с внешними библиотеками, canvas и т.п.).

---

### Как лучше передавать стилизующие пропсы из родителя, чтобы не нарушить инкапсуляцию?

Используйте "контролируемые" пропсы: `variant`, `size`, `theme`, `elevated`, но не передавайте напрямую имена классов (`className`) внутрь компонента. Внутри компонента создайте маппинг пропсов в классы. Так вы сохраните контроль над оформлением и сможете менять CSS, не ломая API компонента.

---

### Как объединить стили от Scoped, CSS Modules и глобального CSS в одном компоненте?

1. Глобальный CSS — для базовых правил (reset, typography, layout).
2. `scoped` — для специфических правил конкретного компонента.
3. CSS Modules — когда нужно избежать конфликтов имен и сделать стили "локальными" на уровне файла.

В компоненте вы можете:

- использовать глобальные классы напрямую (`class="container"`),
- подключать модульные (`:class="$style.card"`),
- и добавлять локальные `scoped`-стили для точечной донастройки.  
Главное — четко разделить, какой слой за что отвечает, и не дублировать одни и те же правила в разных слоях.