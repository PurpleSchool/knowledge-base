---
metaTitle: Шаблоны Vue templates - подробный разбор
metaDescription: Подробное руководство по шаблонам Vue templates - синтаксис директив привязки данных условный рендеринг списки и лучшие практики
author: Олег Марков
title: Шаблоны Vue templates - практическое руководство для разработчиков
preview: Разберитесь как устроены шаблоны Vue templates - научитесь связывать данные и разметку использовать директивы и строить понятные компоненты
---

## Введение

Шаблоны Vue (templates) — это декларативный способ описать разметку вашего приложения и связать её с данными и логикой компонента. Смотрите, идея простая: вы описываете, **как должен выглядеть интерфейс**, а Vue сам следит за изменениями данных и обновляет DOM.

В этой статье я разберу, как устроены шаблоны Vue, какие есть возможности синтаксиса, как правильно использовать директивы и привязки и какие подходы помогают писать читаемый и поддерживаемый код. Мы будем опираться на Vue 3, но большинство принципов актуальны и для Vue 2.

---

## Базовые принципы шаблонов Vue

### Декларативный подход

Вместо того чтобы вручную обращаться к DOM и менять текст, классы или атрибуты, вы описываете состояние в JavaScript (в `data`, `setup`, `computed`) и связываете его с разметкой.

Vue-шаблон компилируется во внутренние render-функции, а затем Vue эффективно обновляет DOM при изменении состояния. Это значит, что вы фокусируетесь на данных, а не на низкоуровневых операциях с DOM.

### Где можно определять шаблон

В Vue шаблон можно задать несколькими способами:

1. В компонентах Single File Component (SFC) — самый распространённый способ:

```vue
<template>
  <h1>{{ title }}</h1>
  <!-- Здесь мы выводим значение поля title из компонента -->
</template>

<script setup>
// Здесь мы объявляем реактивное состояние компонента
import { ref } from 'vue'

const title = ref('Заголовок из шаблона Vue')
</script>
```

2. Через опцию `template` в объекте компонента:

```js
// Здесь мы создаем компонент с шаблоном в виде строки
export default {
  template: `
    <div>
      <p>{{ message }}</p>
    </div>
  `,
  data() {
    return {
      // Это поле будет привязано к шаблону
      message: 'Сообщение из data'
    }
  }
}
```

3. Инлайн-шаблон в корневом создании приложения (для простых примеров):

```js
// Здесь мы создаем приложение с шаблоном прямо в createApp
const app = Vue.createApp({
  template: `
    <button @click="count++">
      Вы нажали {{ count }} раз
    </button>
  `,
  data() {
    return {
      // Это состояние будет изменяться при клике
      count: 0
    }
  }
})

app.mount('#app')
```

В реальных проектах чаще всего используется первый вариант — SFC.

---

## Интерполяция данных в шаблоне

### Текстовая интерполяция

Самый базовый элемент шаблона — текстовая интерполяция с помощью двойных фигурных скобок.

```vue
<template>
  <div>
    <!-- Здесь мы выводим текстовое значение переменной username -->
    <p>Пользователь {{ username }}</p>

    <!-- Здесь мы выполняем простое выражение прямо в шаблоне -->
    <p>Длина имени {{ username.length }}</p>
  </div>
</template>

<script setup>
// Здесь мы подключаем реактивность
import { ref } from 'vue'

// Создаем реактивную переменную username
const username = ref('Vue Developer')
</script>
```

Внутри скобок можно использовать выражения JavaScript, но не инструкции (например, нельзя использовать `if`, `for`, объявления переменных). Vue рекомендует держать логику в вычисляемых свойствах и методах, а в шаблоне — только простые выражения.

### Экранирование HTML и v-html

По умолчанию Vue экранирует HTML, чтобы защититься от XSS. Посмотрите на пример:

```vue
<template>
  <div>
    <!-- Здесь HTML будет экранирован и выведен как текст -->
    <p>{{ rawHtml }}</p>

    <!-- Здесь HTML будет интерпретирован браузером -->
    <p v-html="rawHtml"></p>
  </div>
</template>

<script setup>
// Здесь мы задаем строку с HTML
const rawHtml = '<strong>Жирный текст</strong>'
</script>
```

Важно: `v-html` может быть небезопасен, если вы вставляете данные от пользователя или внешних сервисов без фильтрации. В таких случаях нужно либо очищать HTML на сервере, либо использовать проверенные библиотеки санитайзинга.

---

## Привязка атрибутов и классов

### v-bind и сокращённый синтаксис

Директива `v-bind` позволяет привязать значение выражения к атрибуту.

```vue
<template>
  <a
    v-bind:href="linkUrl"
    v-bind:title="linkTitle"
  >
    Перейти
  </a>
</template>

<script setup>
// Здесь мы задаем данные для атрибутов
const linkUrl = 'https://vuejs.org'
const linkTitle = 'Официальный сайт Vue'
</script>
```

Чаще вы будете использовать сокращение — двоеточие:

```vue
<template>
  <!-- Здесь мы используем короткий синтаксис bind для href и title -->
  <a :href="linkUrl" :title="linkTitle">Перейти</a>
</template>
```

### Привязка к boolean-атрибутам

Некоторые атрибуты (например, `disabled`, `checked`) — логические. Если значение `true`, атрибут присутствует, если `false` — атрибута нет.

```vue
<template>
  <!-- Кнопка будет неактивной, если isLoading === true -->
  <button :disabled="isLoading">
    Сохранить
  </button>
</template>

<script setup>
// Здесь мы храним состояние загрузки
import { ref } from 'vue'

const isLoading = ref(false)
</script>
```

### Привязка классов

Vue не только подставляет строки, но и умеет работать с объектами и массивами для классов.

#### Классы — объект

```vue
<template>
  <button
    class="btn"
    :class="{
      'btn-primary': isPrimary,    // Класс будет добавлен, если isPrimary === true
      'btn-disabled': isDisabled   // Этот класс зависит от isDisabled
    }"
  >
    Кнопка
  </button>
</template>

<script setup>
// Здесь мы задаём флаги, управляющие классами
import { ref } from 'vue'

const isPrimary = ref(true)
const isDisabled = ref(false)
</script>
```

#### Классы — массив

```vue
<template>
  <div :class="[baseClass, isError ? 'text-error' : 'text-normal']">
    Сообщение
  </div>
</template>

<script setup>
// Здесь мы задаем базовый класс и признак ошибки
const baseClass = 'message'
const isError = true
</script>
```

Такой подход упрощает управление состояниями (активный, выделенный, ошибка и т.д.) без ручной работы со строками.

### Привязка стилей

Аналогично классам, к стилям можно привязывать объект или массив:

```vue
<template>
  <div
    :style="{
      color: isError ? 'red' : 'black', // Цвет зависит от состояния ошибки
      fontSize: fontSize + 'px'        // Размер текста формируется из числа
    }"
  >
    Текст со стилями
  </div>
</template>

<script setup>
// Здесь мы объявляем реактивные поля для стилей
import { ref } from 'vue'

const isError = ref(false)
const fontSize = ref(16)
</script>
```

Или с объектом из `script`:

```vue
<template>
  <!-- Здесь мы просто привязываем готовый объект стилей -->
  <div :style="styleObject">Текст</div>
</template>

<script setup>
// Здесь мы готовим объект стилей
const styleObject = {
  color: 'blue',
  padding: '10px'
}
</script>
```

---

## Обработка событий

### v-on и сокращённый синтаксис

Для обработки событий используется директива `v-on` или сокращение `@`.

```vue
<template>
  <!-- Сокращенный синтаксис: @click вместо v-on:click -->
  <button @click="increment">
    Нажали {{ count }} раз
  </button>
</template>

<script setup>
// Здесь мы настраиваем состояние и функцию-обработчик
import { ref } from 'vue'

const count = ref(0)

// Функция вызывается при событии click
const increment = () => {
  count.value++
}
</script>
```

### Модификаторы событий

Vue позволяет "настраивать" обработку событий через модификаторы.

Примеры:

- `.prevent` — вызывает `event.preventDefault()`
- `.stop` — вызывает `event.stopPropagation()`
- `.once` — обработчик сработает только один раз
- `.capture`, `.self`, `.passive` — для более тонкого управления

```vue
<template>
  <!-- Здесь мы предотвращаем стандартное поведение отправки формы -->
  <form @submit.prevent="handleSubmit">
    <!-- Обработка только одного клика -->
    <button @click.once="logClick">Отправить</button>
  </form>
</template>

<script setup>
// Здесь мы реализуем обработчики
const handleSubmit = () => {
  // Здесь вместо реальной отправки формы мы делаем свою логику
  console.log('Форма отправлена через Vue')
}

const logClick = () => {
  console.log('Кнопка была нажата один раз')
}
</script>
```

### Обработчики с аргументами

Если нужно передать аргумент, делается это через выражение в шаблоне:

```vue
<template>
  <!-- Здесь мы передаем конкретное значение в обработчик -->
  <button @click="selectUser('admin')">Выбрать администратора</button>
</template>

<script setup>
// Здесь мы описываем функцию, принимающую роль
const selectUser = (role) => {
  console.log('Выбрана роль', role)
}
</script>
```

Если нужно использовать и аргумент, и сам `event`, Vue позволяет передать ` $event`:

```vue
<template>
  <!-- Здесь мы передаем и свое значение и сам объект события -->
  <input @input="handleInput($event, 'username')" />
</template>

<script setup>
// Здесь мы читаем значение поля и дополнительный аргумент
const handleInput = (event, fieldName) => {
  console.log('Поле', fieldName, 'изменено на', event.target.value)
}
</script>
```

---

## Директивы Vue в шаблонах

Директивы — это специальные атрибуты с префиксом `v-`, которые изменяют поведение элемента.

Рассмотрим самые важные директивы шаблонов.

### v-if, v-else-if, v-else — условный рендеринг

С помощью `v-if` вы можете показывать или скрывать элементы в зависимости от состояния. Элемент с `v-if` полностью добавляется или удаляется из DOM.

```vue
<template>
  <!-- Здесь мы показываем текст, если isLoggedIn === true -->
  <p v-if="isLoggedIn">Добро пожаловать</p>
  <!-- Если isLoggedIn === false, показываем этот блок -->
  <p v-else>Пожалуйста, войдите в систему</p>
</template>

<script setup>
// Здесь мы управляем состоянием авторизации
import { ref } from 'vue'

const isLoggedIn = ref(false)
</script>
```

Для нескольких условий:

```vue
<template>
  <!-- Проверка роли пользователя -->
  <p v-if="role === 'admin'">Панель администратора</p>
  <p v-else-if="role === 'manager'">Панель менеджера</p>
  <p v-else>Обычный пользователь</p>
</template>

<script setup>
// Здесь мы задаем роль пользователя
const role = 'admin'
</script>
```

### v-show — скрытие через CSS

`v-show` не удаляет элемент из DOM, а только управляет стилем `display`.

```vue
<template>
  <!-- Элемент всегда в DOM, но может быть скрыт через display none -->
  <p v-show="isVisible">Этот текст можно скрыть</p>
</template>

<script setup>
// Здесь мы управляем простым флагом видимости
import { ref } from 'vue'

const isVisible = ref(true)
</script>
```

Когда использовать:

- `v-if` — если элемент часто не нужен вообще (дорогой для отрисовки, сложная структура)
- `v-show` — если вы часто переключаете видимость (например, вкладки)

### v-for — циклы и списки

Для вывода списков используется `v-for`. Давайте разберёмся на примере:

```vue
<template>
  <!-- Мы проходимся по массиву users и для каждого элемента выводим строку -->
  <ul>
    <li
      v-for="user in users"
      :key="user.id"               <!-- Ключ помогает Vue эффективно обновлять DOM -->
    >
      {{ user.name }} ({{ user.email }})
    </li>
  </ul>
</template>

<script setup>
// Здесь мы создаем массив пользователей
const users = [
  { id: 1, name: 'Анна', email: 'anna@example.com' },
  { id: 2, name: 'Игорь', email: 'igor@example.com' }
]
</script>
```

Можно получать и индекс:

```vue
<template>
  <ul>
    <li
      v-for="(item, index) in items"
      :key="index"    <!-- В реальных проектах лучше использовать стабильный id -->
    >
      {{ index }} - {{ item }}
    </li>
  </ul>
</template>

<script setup>
// Здесь мы задаем простой список значений
const items = ['Первый', 'Второй', 'Третий']
</script>
```

#### v-for по объекту

```vue
<template>
  <ul>
    <li
      v-for="(value, key) in user"
      :key="key"
    >
      {{ key }} - {{ value }}
    </li>
  </ul>
</template>

<script setup>
// Здесь мы создаем объект пользователя
const user = {
  name: 'Анна',
  age: 25,
  city: 'Москва'
}
</script>
```

#### Обязательность key

Ключ (`:key`) помогает Vue отслеживать элементы между обновлениями и не путать их. Без ключа при изменении массива Vue может переиспользовать старые элементы не так, как вы ожидаете.

**Правило:** всегда указывайте `:key` для `v-for` и используйте уникальные и стабильные значения (id, uuid и т.п.).

---

## Комбинирование директив и особенности

### v-if и v-for вместе

Vue официально не рекомендует использовать `v-if` и `v-for` на одном и том же элементе, потому что приоритет у `v-for`, и логика может стать запутанной.

Непредпочтительный вариант:

```vue
<template>
  <!-- Здесь сначала будет выполняться v-for, а уже потом фильтрация через v-if -->
  <li
    v-for="user in users"
    v-if="user.active"
    :key="user.id"
  >
    {{ user.name }}
  </li>
</template>
```

Лучший вариант — отфильтровать данные заранее либо использовать обёртку:

```vue
<template>
  <!-- Здесь мы рендерим только заранее отфильтрованный список -->
  <li
    v-for="user in activeUsers"
    :key="user.id"
  >
    {{ user.name }}
  </li>
</template>

<script setup>
// Здесь мы считаем активных пользователей через вычисляемое свойство
import { computed } from 'vue'

const users = [
  { id: 1, name: 'Анна', active: true },
  { id: 2, name: 'Игорь', active: false }
]

const activeUsers = computed(() => users.filter(u => u.active))
</script>
```

---

## Формы и двусторонняя привязка v-model

### Базовый v-model

`v-model` связывает значение поля ввода и переменную в состоянии компонента. Посмотрите, как это выглядит:

```vue
<template>
  <!-- Здесь v-model автоматически читает и записывает значение input -->
  <input v-model="name" placeholder="Введите имя" />

  <!-- Шаблон сразу отображает актуальное значение -->
  <p>Вы ввели - {{ name }}</p>
</template>

<script setup>
// Здесь мы заводим реактивную переменную, связанную с полем ввода
import { ref } from 'vue'

const name = ref('')
</script>
```

Vue сам подставляет обработчики событий (`input`, `change`) и обновляет переменную.

### v-model с разными типами полей

#### Чекбокс

```vue
<template>
  <!-- Булевый чекбокс -->
  <label>
    <input type="checkbox" v-model="isAccepted" />
    Принимаю условия
  </label>
  <p>Статус - {{ isAccepted }}</p>
</template>

<script setup>
// Здесь мы храним состояние чекбокса
import { ref } from 'vue'

const isAccepted = ref(false)
</script>
```

#### Группа чекбоксов (массив)

```vue
<template>
  <!-- Каждый чекбокс добавляет или убирает значение в массив selected -->
  <label>
    <input type="checkbox" value="js" v-model="selected" />
    JavaScript
  </label>
  <label>
    <input type="checkbox" value="ts" v-model="selected" />
    TypeScript
  </label>

  <p>Вы выбрали - {{ selected.join(', ') }}</p>
</template>

<script setup>
// Здесь мы храним список выбранных значений
import { ref } from 'vue'

const selected = ref([])
</script>
```

#### Радиокнопки

```vue
<template>
  <label>
    <input type="radio" value="light" v-model="theme" />
    Светлая тема
  </label>
  <label>
    <input type="radio" value="dark" v-model="theme" />
    Темная тема
  </label>

  <p>Текущая тема - {{ theme }}</p>
</template>

<script setup>
// Здесь мы задаем активную тему
import { ref } from 'vue'

const theme = ref('light')
</script>
```

#### Select

```vue
<template>
  <select v-model="country">
    <option value="">Выберите страну</option>
    <option value="ru">Россия</option>
    <option value="us">США</option>
  </select>

  <p>Страна - {{ country }}</p>
</template>

<script setup>
// Здесь мы храним выбранное значение из списка
import { ref } from 'vue'

const country = ref('')
</script>
```

---

## Слоты и шаблоны для составных компонентов

### Базовые слоты

Слоты позволяют передавать разметку внутрь компонента. Это тоже часть шаблонов, только с "обратной" стороны.

```vue
<!-- ParentComponent.vue -->
<template>
  <!-- Здесь мы используем компонент Card и передаем внутрь разметку -->
  <Card>
    <h2>Заголовок карточки</h2>
    <p>Текст внутри карточки</p>
  </Card>
</template>
```

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <!-- Слот — место, куда попадет вложенная разметка -->
    <slot></slot>
  </div>
</template>
```

### Именованные слоты

```vue
<!-- ParentComponent.vue -->
<template>
  <!-- Здесь мы заполняем разные именованные слоты -->
  <Modal>
    <template #header>
      <h3>Заголовок окна</h3>
    </template>

    <template #body>
      <p>Основной текст</p>
    </template>

    <template #footer>
      <button>Закрыть</button>
    </template>
  </Modal>
</template>
```

```vue
<!-- Modal.vue -->
<template>
  <div class="modal">
    <header class="modal-header">
      <!-- Слот для заголовка -->
      <slot name="header"></slot>
    </header>

    <section class="modal-body">
      <!-- Слот для тела -->
      <slot name="body"></slot>
    </section>

    <footer class="modal-footer">
      <!-- Слот для подвала -->
      <slot name="footer"></slot>
    </footer>
  </div>
</template>
```

Здесь вы видите, как шаблоны позволяют гибко собирать интерфейс из переиспользуемых блоков.

---

## Специальный тег template в разметке

Иногда вам нужно сгруппировать несколько элементов без добавления лишнего контейнера в DOM. Для этого Vue позволяет использовать служебный тег `template` в самом HTML-шаблоне.

### template с v-if

```vue
<template>
  <template v-if="isAdmin">
    <!-- В DOM эти элементы будут добавлены без обертки template -->
    <p>Вы администратор</p>
    <button>Управление пользователями</button>
  </template>
</template>

<script setup>
// Здесь мы контролируем, показывать ли набор элементов
import { ref } from 'vue'

const isAdmin = ref(true)
</script>
```

### template с v-for

```vue
<template>
  <ul>
    <!-- Здесь мы генерируем по два элемента для каждой записи без лишних оберток -->
    <template v-for="user in users" :key="user.id">
      <li>{{ user.name }}</li>
      <li>({{ user.email }})</li>
    </template>
  </ul>
</template>

<script setup>
// Здесь массив пользователей
const users = [
  { id: 1, name: 'Анна', email: 'anna@example.com' },
  { id: 2, name: 'Игорь', email: 'igor@example.com' }
]
</script>
```

---

## Ограничения и подводные камни шаблонов Vue

### Один корневой элемент

В обычных компонентных шаблонах Vue 3 позволяет использовать несколько корневых элементов, но раньше (в Vue 2) требовался один. Однако многие команды по-прежнему придерживаются одного корневого контейнера ради единообразия.

```vue
<template>
  <!-- Vue 3 - так уже можно -->
  <header>...</header>
  <main>...</main>
</template>
```

Если в проекте принята практика одного корня, лучше обернуть всё в `<div>` или другой контейнер.

### Чрезмерная логика в шаблоне

Технически вы можете писать сложные выражения в шаблоне, но это ухудшает читаемость и может замедлить обновления. Лучше выносить всё, что сложнее простого условия, в вычисляемые свойства или методы.

Плохой пример:

```vue
<template>
  <!-- Здесь слишком много логики в одном выражении -->
  <p>{{ items.filter(i => i.active).map(i => i.name).join(', ') }}</p>
</template>
```

Лучше:

```vue
<template>
  <!-- Здесь мы используем уже подготовленное значение -->
  <p>{{ activeItemNames }}</p>
</template>

<script setup>
// Здесь мы выносим вычисления в computed
import { computed } from 'vue'

const items = [
  { name: 'A', active: true },
  { name: 'B', active: false }
]

const activeItemNames = computed(() =>
  items.filter(i => i.active).map(i => i.name).join(', ')
)
</script>
```

### Использование ref и реактивных данных

В шаблоне Vue автоматически "распаковывает" `ref` (property unwrapping), поэтому вы можете писать `{{ count }}`, а не `{{ count.value }}`.

```vue
<template>
  <!-- Vue автоматически использует count.value -->
  <button @click="count++">Счетчик - {{ count }}</button>
</template>

<script setup>
// Здесь мы создаем ref, но в шаблоне не обращаемся к .value
import { ref } from 'vue'

const count = ref(0)
</script>
```

Но в JavaScript-коде нужно не забывать использовать `.value`.

---

## Практический пример компонента с шаблоном

Давайте соберём небольшой, но показательный компонент, который использует основные возможности шаблонов: вывод списка, обработку событий, условный рендеринг и формы.

```vue
<template>
  <div class="todo">
    <!-- Форма для добавления задачи -->
    <form @submit.prevent="addTodo">
      <!-- Поле ввода новой задачи -->
      <input
        v-model="newTodoText"
        placeholder="Новая задача"
      />
      <!-- Кнопка добавления задачи -->
      <button type="submit">Добавить</button>
    </form>

    <!-- Условный рендеринг списка задач -->
    <p v-if="todos.length === 0">
      Задач пока нет
    </p>
    <ul v-else>
      <!-- Перебираем список задач -->
      <li
        v-for="todo in todos"
        :key="todo.id"
        :class="{ done: todo.done }"   <!-- Класс done зависит от состояния задачи -->
      >
        <!-- Чекбокс завершенности -->
        <label>
          <input
            type="checkbox"
            v-model="todo.done"
          />
          {{ todo.text }}
        </label>

        <!-- Кнопка удаления задачи -->
        <button @click="removeTodo(todo.id)">
          Удалить
        </button>
      </li>
    </ul>

    <!-- Итоговая статистика -->
    <p>
      Всего задач - {{ todos.length }},
      выполнено - {{ doneCount }}
    </p>
  </div>
</template>

<script setup>
// Здесь мы настраиваем состояние и логику компонента
import { ref, computed } from 'vue'

// Список задач
const todos = ref([
  { id: 1, text: 'Разобраться с шаблонами Vue', done: false },
  { id: 2, text: 'Написать первый компонент', done: true }
])

// Текст новой задачи
const newTodoText = ref('')

// Вычисляем количество выполненных задач
const doneCount = computed(() => todos.value.filter(t => t.done).length)

// Добавление новой задачи
const addTodo = () => {
  // Если строка пустая, ничего не делаем
  if (!newTodoText.value.trim()) return

  // Создаем новый объект задачи
  todos.value.push({
    id: Date.now(),           // Простой уникальный идентификатор
    text: newTodoText.value,  // Текст из поля ввода
    done: false               // Новая задача помечена как невыполненная
  })

  // Очищаем поле ввода
  newTodoText.value = ''
}

// Удаление задачи по id
const removeTodo = (id) => {
  // Фильтруем список, убирая задачу с нужным id
  todos.value = todos.value.filter(t => t.id !== id)
}
</script>

<style scoped>
/* Стиль для завершенной задачи */
.done {
  text-decoration: line-through;
  color: gray;
}
</style>
```

Как видите, шаблон делает компонент наглядным: вы сразу понимаете структуру интерфейса и то, как он связан с логикой.

---

## Заключение

Шаблоны Vue позволяют описывать интерфейс декларативно и связывать его с данными и логикой компонента через понятный и гибкий синтаксис. Вы используете интерполяцию для вывода значений, директивы `v-bind` и `v-on` для привязки атрибутов и событий, управляете отображением через `v-if` и `v-show`, строите списки с `v-for` и работаете с формами через `v-model`.

Важно помнить о нескольких принципах:

- держать сложную логику вне шаблона — в вычисляемых свойствах и методах;
- всегда задавать `:key` в циклах `v-for`;
- аккуратно использовать `v-html`, только с доверенным содержимым;
- выбирать между `v-if` и `v-show` в зависимости от частоты переключения видимости;
- использовать слоты и `template` для построения гибких и переиспользуемых компонентов.

Понимание шаблонов — основа работы с Vue. Когда вы уверенно чувствуете себя в этой области, становится проще проектировать архитектуру компонентов, поддерживать код и строить сложные интерфейсы.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как использовать шаблоны Vue вместе с JSX или render-функциями

Vue позволяет использовать **либо шаблоны, либо render-функции/JSX** в одном компоненте. Если вы задаёте `render`, то `template` будет проигнорирован. Если хотите частично применять JSX, обычно выносят сложную часть в отдельный компонент с render-функцией, а родительский оставляют на шаблонах.

Мини-инструкция:
1. Создайте новый компонент и опишите в нём `render(h)` или JSX.
2. Используйте этот компонент в обычном SFC с `<template>`.
3. Следите, чтобы в одном компоненте не пересекались `template` и `render`.

### Как подключать шаблон из отдельного HTML-файла

В классической сборке без SFC (например, через CDN) можно использовать `template` по `id`:

1. В HTML создайте `<template id="user-template">...</template>`.
2. В компоненте укажите `template: '#user-template'`.
3. Внутри этого шаблона используйте обычный Vue-синтаксис.

В проектах с Vite/Webpack лучше использовать SFC, а не внешние файлы.

### Как организовать многострочные шаблоны без SFC

Если вы пишете без SFC, многострочные шаблоны удобно задавать как шаблонные строки:

```js
// Здесь мы используем многострочную строку для template
const app = Vue.createApp({
  template: `
    <div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>
  `,
  data() {
    return {
      title: 'Заголовок',
      description: 'Описание'
    }
  }
})
```

Следите за тем, чтобы шаблон не стал слишком громоздким — в таком случае переходите на SFC.

### Как локализовать текст в шаблонах Vue

Обычно используют библиотеку `vue-i18n`:

1. Установите `vue-i18n`.
2. Настройте инстанс i18n с переводами.
3. В шаблонах используйте `{{ $t('ключ') }}` или директивы/компоненты библиотеки.
4. Для параметров используйте плейсхолдеры в строках и передавайте объект с параметрами в `$t`.

### Как тестировать шаблоны Vue

Для тестирования используют `@vue/test-utils`:

1. Установите `@vue/test-utils` и тестовый раннер (Jest, Vitest).
2. Смонтируйте компонент через `mount`.
3. Проверяйте содержимое DOM через селекторы: `wrapper.text()`, `wrapper.find()`, `classes()`.
4. Эмулируйте события: `wrapper.find('button').trigger('click')` и проверяйте изменения в шаблоне.