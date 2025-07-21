---
metaTitle: Использование Vuetify для современных интерфейсов на Vue
metaDescription: Узнайте как применить Vuetify для создания привлекательных и современных интерфейсов на Vue - от установки до использования компонентов и темизации
author: Олег Марков
title: Использование Vuetify для создания современных интерфейсов на Vue
preview: Освойте создание современных интерфейсов на Vue с помощью Vuetify - настройка, примеры компонентов, работа с темами и адаптивный дизайн
---

## Введение

Современные веб-приложения требуют не только производительности, но и удобного, приятного интерфейса. Часто хочется, чтобы дизайн был не только уникальным, но и классическим — например, подходящим под Material Design от Google. Один из самых популярных способов реализовать такой подход на Vue.js — использовать библиотеку Vuetify.

Vuetify позволяет существенно упростить разработку интерфейсов: большинство задач по верстке уже реализованы, а компоненты соответствуют рекомендациям Material Design. Вы работаете с готовыми блоками, которые легко компонуются, стилизуются и адаптируются под разные экраны. Такой подход особенно удобен для быстрого прототипирования, MVP и крупных коммерческих проектов.

В этой статье я расскажу, как начать работу с Vuetify, покажу основные принципы использования компонентов, настройку тем и объясню, на какие нюансы стоит обратить внимание. Также вы увидите, как реализовать адаптивный дизайн, собственные темы и использовать продвинутые возможности фреймворка.

## Установка и быстрый старт

Прежде всего, разберёмся, как добавить Vuetify в проект на Vue.js. Сейчас мы рассмотрим наиболее современный стек — Vue 3 и Vuetify 3.

Vuetify значительно упрощает создание привлекательных и современных интерфейсов на Vue. Чтобы эффективно использовать Vuetify и настраивать компоненты и темы, необходимо хорошее понимание Vue.js. Если вы хотите детально погрузиться в Vue.js и научиться использовать Vuetify, приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=ispolzovanie-vuetify-dlya-sozdaniya-sovremennyh-interfeisov-na-vue). На курсе 173 урока и 21 упражнение, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Установка Vuetify

У вас уже должен быть установлен проект на Vue 3 (например, созданный через Vue CLI или с помощью Vite). Добавлять Vuetify стоит после инициализации основного проекта. Вот как это делается:

```bash
# Установите Vuetify и Vite plugin для поддержки Vuetify
npm install vuetify@next vue-router@4
npm install vite-plugin-vuetify --save-dev
```

Затем откройте основной файл и инициализируйте Vuetify. Если вы используете Vite, настройте плагин vite-plugin-vuetify в vite.config.js:

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }), // Подключение Vuetify
  ],
})
```

Теперь добавьте Vuetify в ваш main.js или main.ts:

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'

// Импортируйте Vuetify и основные стили
import { createVuetify } from 'vuetify'
import 'vuetify/styles' // Базовые стили Vuetify
import '@mdi/font/css/materialdesignicons.css' // Иконки

const vuetify = createVuetify({
  // Здесь можно добавить начальную тему и параметры
})

const app = createApp(App)
app.use(vuetify)
app.mount('#app')
```

На этом этапе Vuetify добавлен и готов к работе. Далее вы можете начинать использовать компоненты прямо в шаблонах.

## Использование основных компонентов Vuetify

Библиотека Vuetify содержит множество готовых визуальных блоков, которые значительно ускоряют разработку. Давайте рассмотрим, как ими пользоваться.

### Кнопки (v-btn)

Кнопка — самый базовый и часто используемый элемент любого интерфейса. Вот пример её использования:

```vue
<template>
  <v-btn color="primary" @click="handleClick">
    Нажми меня
  </v-btn>
</template>

<script setup>
// Здесь можно поместить методы для обработки событий
const handleClick = () => {
  console.log('Кнопка нажата')
}
</script>
```

В данном примере:
- Кнопка окрашена в основной цвет темы (`primary`)
- При нажатии вызывается обработчик событий.

Смотрите, цвет можно легко изменять через проп `color`, используя как стандартные, так и кастомные значения.

### Текстовые поля (v-text-field)

Для ввода данных Vuetify предлагает поле `v-text-field`:

```vue
<template>
  <v-text-field
    label="Введите имя"
    v-model="name"
    outlined
    clearable
  />
</template>

<script setup>
import { ref } from 'vue'
const name = ref('')
</script>
```

Обратите внимание:
- Используется двустороннее связывание с помощью `v-model`
- Свойство `outlined` отвечает за внешний вид — поле с контуром
- Свойство `clearable` добавляет иконку очистки поля

### Списки (v-list)

Списки удобны для отображения массивов данных, навигации и меню.

```vue
<template>
  <v-list>
    <v-list-item v-for="user in users" :key="user.id">
      <v-list-item-title>{{ user.name }}</v-list-item-title>
      <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<script setup>
const users = [
  { id: 1, name: 'Иван', email: 'ivan@mail.ru' },
  { id: 2, name: 'Мария', email: 'maria@mail.ru' },
]
</script>
```

Здесь:
- Список строится динамически из массива
- В каждом пункте есть заголовок и подзаголовок

### Диалоги и модальные окна (v-dialog)

Модальные окна — ещё одна важная часть современных интерфейсов. Пример:

```vue
<template>
  <v-btn @click="dialog = true">Открыть диалог</v-btn>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>Заголовок окна</v-card-title>
      <v-card-text>Текстовое описание внутри окна</v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn color="primary" @click="dialog = false">Закрыть</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
const dialog = ref(false)
</script>
```

Ключевые моменты:
- Используйте `v-model` для контроля показа окна
- Внутри окна удобно размещать любые компоненты Vuetify

### Карточки (v-card)

Карточки — универсальный контейнер для отображения информации.

```vue
<template>
  <v-card class="mx-auto" max-width="400">
    <v-img src="https://picsum.photos/400/200" height="200px"/>
    <v-card-title>Заголовок</v-card-title>
    <v-card-subtitle>Описание</v-card-subtitle>
    <v-card-text>
      Здесь можно разместить дополнительную информацию и элементы управления.
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary">Подробнее</v-btn>
    </v-card-actions>
  </v-card>
</template>
```

- Блоки `v-img`, `v-card-title`, `v-card-subtitle` можно использовать не обязательно все сразу
- В карточке удобно комбинировать разные элементы

## Темизация и настройка стилей

В современном приложении всё чаще возникает задача подстроить стиль под фирменный или пользовательский. Vuetify позволяет это сделать очень гибко.

### Смена темы прямо в рантайме

В Vuetify реализована поддержка светлой и темной темы "из коробки". Посмотрите, как можно подключить тему:

```js
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light', // Можно указать 'dark' для темной темы
    themes: {
      light: {
        colors: {
          primary: '#1976D2', // Основной цвет
          secondary: '#424242', // Дополнительный цвет
          accent: '#82B1FF',
        },
      },
      dark: {
        colors: {
          primary: '#2196F3',
          secondary: '#FF8A65',
          accent: '#FF4081',
        },
      },
    },
  },
})
```

- Меняйте значения цветов для адаптации под ваш фирменный стиль
- Можно добавлять кастомные темы в любое время

### Переключение темы из приложения

Вы можете позволить пользователю выбирать тему:

```vue
<template>
  <v-btn @click="toggleTheme">
    Переключить тему
  </v-btn>
</template>

<script setup>
import { useTheme } from 'vuetify'

const theme = useTheme()

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value === 'light' ? 'dark' : 'light'
}
</script>
```

- Используется `useTheme` для доступа к параметрам темы
- Переключение реализовано программно

## Адаптивная вёрстка и системы сеток

Важная часть современного UI — адаптация под любые устройства. Vuetify предоставляет полноценную систему 12-колоночной сетки по принципу Material Design.

### Пример использования системы сеток

```vue
<template>
  <v-container>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-card>1-я колонка</v-card>
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-card>2-я колонка</v-card>
      </v-col>
      <v-col
        cols="12"
        sm="12"
        md="4"
      >
        <v-card>3-я колонка</v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
```

Объяснения:
- `v-container` — это базовый контейнер, внутри которого располагается сетка
- `v-row` задаёт строку
- `v-col` – колонки, число колонок зависит от ширины экрана (см., sm, md)

Смотрите на экран: на мобильных три карточки будут под друг другом, а на больших — в одну строку. Управлять поведением можно используя свойства `cols`, `sm`, `md`, `lg` и `xl`.

## Работа с иконками

Vuetify по умолчанию поддерживает Material Design Icons, а также позволяет подключать сторонние пакеты. Вот как использовать иконки на практике:

```vue
<template>
  <v-icon icon="mdi-home" color="primary"/>
</template>
```

- Иконка указывается по названию
- Можно менять цвет (color), размер, добавлять стили CSS

#### Подключение сторонних пакетов иконок

Если нужно использовать Font Awesome, это делается так:

1. Установите пакет:
   ```bash
   npm install @fortawesome/fontawesome-free
   ```
2. Импортируйте стили:
   ```js
   import '@fortawesome/fontawesome-free/css/all.css'
   ```
3. При инициализации Vuetify настройте опцию:
   ```js
   const vuetify = createVuetify({
     icons: {
       defaultSet: 'fa',
       sets: {
         fa: { /* настройка иконок, см. доку Vuetify */ }
       }
     }
   })
   ```
Теперь можно использовать, например, `<v-icon icon="fa-solid fa-star"/>`.

## Интеграция с Vue Router и Vuex (Pinia)

В большинстве реальных проектов присутствует роутинг и глобальное хранилище. Vuetify прекрасно сочетается с роутером и Pinia (или Vuex).

### Пример интеграции с Vue Router

Создание меню для навигации:

```vue
<template>
  <v-list>
    <v-list-item
      v-for="item in menu"
      :key="item.title"
      :to="item.route"
      link
    >
      <v-list-item-title>{{ item.title }}</v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script setup>
const menu = [
  { title: 'Главная', route: '/' },
  { title: 'Контакты', route: '/contact' },
]
</script>
```

Свойство `to` поддерживает объектные и строковые ссылки как в стандартном vue-router.

### Пример работы с глобальным стором Pinia

```vue
<template>
  <v-btn @click="increment">
    Увеличить: {{ counter }}
  </v-btn>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
const counter = store.counter

const increment = () => {
  store.increment()
}
</script>
```

- Используем Pinia как обычный store, интерфейс Vuetify не мешает его использованию.

## Ленивая загрузка компонентов

Vuetify поддерживает ленивую загрузку тяжелых компонентов, таких как диалоги и списки, что ускоряет загрузку страницы. Это делается с помощью стандартных средств Vue. Давайте посмотрим пример:

```vue
<template>
  <Suspense>
    <template #default>
      <LazyDialog v-if="showDialog" />
    </template>
    <template #fallback>
      <v-progress-circular indeterminate />
    </template>
  </Suspense>
  <v-btn @click="showDialog = true">Открыть диалог</v-btn>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'

// Ленивая загрузка компонента
const LazyDialog = defineAsyncComponent(() => import('./LazyDialog.vue'))
const showDialog = ref(false)
</script>
```

- Используется `<Suspense>` для отображения прелоадера пока компонент подгружается

## Формы и валидация

В любой современный UI часто используются формы. Vuetify реализует собственную систему валидации.

### Пример формы с валидацией

```vue
<template>
  <v-form v-model="valid" @submit.prevent="onSubmit">
    <v-text-field
      label="Email"
      v-model="email"
      :rules="emailRules"
      required
    />
    <v-btn :disabled="!valid" type="submit">Отправить</v-btn>
  </v-form>
</template>

<script setup>
import { ref } from 'vue'

const valid = ref(false)
const email = ref('')

// Функция-правило для валидации email
const emailRules = [
  v => !!v || 'Email обязателен',
  v => /.+@.+\..+/.test(v) || 'Введите корректный email',
]

function onSubmit() {
  // Здесь обработка отправки формы
  alert('Форма успешно отправлена')
}
</script>
```

- Валидация осуществляется через массив правил, который передается в компонент
- Свойство `v-model="valid"` позволит отслеживать валидность всей формы

## Расширение и кастомизация компонентов

Далеко не всегда стандартные компоненты подходят "как есть". Vuetify отлично расширяется за счет слотов и собственных классов.

### Использование слотов для расширения

```vue
<template>
  <v-card>
    <template #title>
      <h3>Свой заголовок в карточке</h3>
    </template>
    <template #actions>
      <v-btn color="success">Согласен</v-btn>
      <v-btn color="error">Отмена</v-btn>
    </template>
    <div>
      Основное содержимое карточки задаём как обычно
    </div>
  </v-card>
</template>
```

- Слоты позволяют вставлять произвольный HTML и компоненты внутрь каркаса, кастомизируя внешний вид

### Добавление пользовательских стилей

Если нужно "докрутить" внешний вид, можно использовать CSS-классы и deep-селекторы:

```vue
<template>
  <v-btn class="my-special-btn" color="primary">Кнопка</v-btn>
</template>

<style scoped>
.my-special-btn {
  border-radius: 20px;
  font-weight: bold;
  /* Вы также можете использовать >>> или ::v-deep для глубокого изменения стилей */
}
</style>
```

- Для глубокого изменения внутренних элементов используйте `::v-deep`

## Международлизация и RTL

Vuetify поддерживает интернационализацию (i18n) и режимы Right-To-Left для арабских и подобных языков.

### Активация RTL

```js
const vuetify = createVuetify({
  rtl: true // Значение по умолчанию — false
})
```

- Все компоненты автоматически меняют направление текста и порядок элементов

### Подключение i18n

Vuetify можно интегрировать с плагином vue-i18n. Передайте ваш переводчик в опциях Vuetify.

## Работа с таблицами данных (Datatables)

Отображение больших таблиц и списков — обычная задача. Vuetify предоставляет компонент `v-data-table` с сортировкой, пагинацией, фильтрацией.

```vue
<template>
  <v-data-table
    :items="desserts"
    :headers="headers"
    class="elevation-1"
  />
</template>

<script setup>
const headers = [
  { text: 'Десерт', value: 'name' },
  { text: 'Калории', value: 'calories' },
  { text: 'Жиры', value: 'fat' },
]
const desserts = [
  { name: 'Мороженое', calories: 200, fat: 7 },
  { name: 'Торт', calories: 350, fat: 15 },
]
</script>
```

- Можно настраивать внешний вид, добавлять фильтры, экспорт данных, постраничный вывод

## Итоги

Vuetify — это мощная и гибкая библиотека компонентов для Vue.js, полностью соответствующая принципам Material Design. Она позволяет быстро строить современные интерфейсы, не "изобретая велосипед" заново, а используя проверенные подходы. Вы получили представление о базовой структуре работы с Vuetify, увидели основные компоненты, узнали, как настраивать темы, адаптировать дизайн, внедрять таблицы, формы, роутинг и глобальное хранилище. Ваша задача теперь — применять эти знания и собирать из готовых и кастомных компонентов нужный именно вам UI.

После изучения возможностей Vuetify, рекомендуем закрепить знания и углубить понимание Vue.js с помощью нашего курса [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=ispolzovanie-vuetify-dlya-sozdaniya-sovremennyh-interfeisov-na-vue). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Vue прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как добавить кастомную SVG иконку в Vuetify?

Чтобы использовать свою SVG-иконку, добавьте ее в объект `aliases` или используйте компонент напрямую:

```js
const vuetify = createVuetify({
  icons: {
    aliases: {
      myicon: {
        component: {
          template: `<svg>...</svg>`,
        }
      },
    },
  },
})
```
Теперь используйте `<v-icon icon="myicon"/>` в шаблоне.

### Почему компоненты Vuetify не отображаются или выглядят "сломано"?

Обычно это связано с отсутствием базовых стилей или пакета иконок. Убедитесь, что подключили `'vuetify/styles'` и нужные шрифты иконок (`@mdi/font` или другие).

### Как при создании проекта на Vue 3 и Vite подключить Vuetify без ошибок?

Установите `vite-plugin-vuetify`, добавьте его в `vite.config.js` и обязательно импортируйте `'vuetify/styles'` в main.js. Это устранит типичные ошибки с отсутствием CSS.

### Можно ли использовать Vuetify вместе с TailwindCSS?

Да, такие варианты часто встречаются. Используйте только служебные классы Tailwind для расположения или своих уникальных компонентов, чтобы стили не пересекались с Vuetify и не было конфликтов по селекторам. Есть смысл ограничить зоны применения Tailwind (например, внутри отдельных компонентов).

### Как сделать SSR (Server Side Rendering) приложение с Vuetify?

Вам потребуется использовать плагин Nuxt или ручную настройку рендеринга на сервере. Следите за документацией к Vuetify и Nuxt для корректной интеграции SSR — часто нужно включить поддержку стилей на сервере и правильно импортировать плагины.
