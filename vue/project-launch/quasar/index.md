---
metaTitle: Использование Quasar Framework для разработки на Vue с готовыми UI-компонентами
metaDescription: Узнайте, как применять Quasar Framework для ускорения и удобства разработки на Vue с расширенным набором готовых UI-компонентов и инструментов
author: Олег Марков
title: Использование Quasar Framework для разработки на Vue с готовыми UI-компонентами
preview: Обзор возможностей Quasar Framework для Vue - готовые UI-компоненты, инструменты, примеры реализации, лучшие практики интеграции и кастомизации
---

## Введение

Если вы разрабатываете современные веб-приложения на Vue, то наверняка сталкивались с необходимостью быстро создавать удобные интерфейсы без больших затрат времени на стилизацию и верстку. Именно для этих задач создан Quasar Framework — это полноценная экосистема для Vue, предоставляющая готовые UI-компоненты, мощные CLI-инструменты и подробную документацию для быстрой и продуктивной разработки.

Quasar ориентирован на разработчиков, которым нужны не только стандартные визуальные элементы, но и возможность вывода приложения под разные платформы: веб, мобильные устройства, десктоп. Фреймворк берёт на себя огромное количество рутинных задач, позволяя сфокусироваться на бизнес-логике. Здесь я покажу, как вы сможете использовать возможности Quasar, чтобы сделать процесс разработки максимально комфортным.

## Понятие и основные возможности Quasar Framework

### Что такое Quasar Framework

Quasar Framework — это open source фреймворк, построенный на базе Vue.js, дающий доступ к обширной коллекции гибко настраиваемых UI-компонентов. Главная особенность — возможность писать единый код и деплоить его сразу в веб, в мобильные приложения (через Cordova или Capacitor), а также в виде desktop-приложений (через Electron).

Quasar Framework предоставляет разработчикам мощный набор инструментов и готовых UI-компонентов для быстрой разработки приложений на Vue. Если вы хотите узнать, как применять Quasar Framework для ускорения разработки, приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=ispolzovanie-quasar-framework-dlya-razrabotki-na-vue-s-gotovymi-ui-komponentami). На курсе 173 урока и 21 упражнение, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

#### Ключевые особенности Quasar:

- Более 70 готовых UI-компонентов: от кнопок и таблиц до полноценных layout-решений.
- Продвинутый CLI, помогающий быстро развернуть, собрать и протестировать проект.
- Встроенные утилиты для адаптивности, кастомизации тем, работы с иконками и анимациями.
- Возможность создавать PWA, SPA, SSR, мобильные и desktop приложения из одной codebase.

Давайте рассмотрим, как начать работу с Quasar и использовать его возможности для разработки интерфейсов.

## Установка Quasar Framework

Для начала вам потребуется установленный Node.js и npm (или Yarn). Самый быстрый способ старта — использовать официальный CLI Quasar. Вот как это делается:

```bash
npm install -g @quasar/cli
# или с помощью yarn:
# yarn global add @quasar/cli
```

После установки CLI создайте новый проект:

```bash
quasar create my-quasar-app
```

CLI задаст вам ряд вопросов о типе проекта, поддержке TypeScript, настройках линтеров и т. д. После создания переходите в директорию и запускайте dev server:

```bash
cd my-quasar-app
quasar dev
```

Это позволит вам сразу увидеть приложение в браузере. Как видите, старт работы очень простой.

## Структура проекта Quasar

Quasar scaffold создает папку с готовой структурой:

- `src/` — исходники приложения
- `src/components/` — пользовательские компоненты
- `src/pages/` — страницы приложения
- `src/layouts/` — шаблоны (layouts) для страниц
- `quasar.conf.js` — основной файл конфигурации проекта

Смотрите, куда стоит добавлять основные элементы вашего интерфейса:

- UI-компоненты Quasar используются внутри `src/pages` или `src/components`.
- Layout компоненты (например, с навигацией, хедером) размещаются в `src/layouts`.
- Тема, плагины и глобальные настройки указываются в `quasar.conf.js`.

## Использование готовых UI-компонентов

Quasar поставляется с огромным набором UI-компонентов — кнопки (`QBtn`), формы (`QInput`, `QSelect`), таблицы (`QTable`), карточки (`QCard`), уведомления, модальные окна и ещё много других.

### Пример простого использования компонентов

Допустим, вы хотите создать страницу с кнопкой и полем ввода. Давайте посмотрим, как это делается:

```vue
<template>
  <q-page padding>
    <q-input v-model="name" label="Введите ваше имя" />
    <q-btn label="Отправить" color="primary" @click="submit" />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const name = ref('')

function submit() {
  // Здесь вы обрабатываете данные формы
  alert(`Имя - ${name.value}`)
}
</script>
```

Здесь используются компоненты Quasar: QInput (поле ввода), QBtn (кнопка), QPage (контейнер страницы). Такой подход позволяет очень быстро собирать рабочий UI.

### Кастомизация компонентов

Почти каждый компонент в Quasar поддерживает множество props для изменений внешнего вида и поведения. Смотрите пример:

```vue
<q-btn
  label="Добавить"
  color="secondary"
  icon="add"
  size="lg"
  rounded
  unelevated
  @click="addItem"
/>
```

// Кнопка с иконкой, большим размером, скруглёнными углами и без тени

### Использование layout и слотов

Для построения сложных страниц удобно использовать layout-компоненты. Например:

```vue
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title>
          Пример Quasar Layout
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
```

// Этот пример показывает, как организовать хедер, тулбар и страницу с помощью QLayout и QHeader

## Работа с темами и кастомизацией стилей

Quasar позволяет кастомизировать внешний вид через сконфигурированные SCSS или через props компонентов. Вы также можете выбрать светлую или тёмную тему для всего приложения или отдельных компонентов.

### Пример переключения темы

```vue
<template>
  <q-toggle v-model="isDark" label="Тёмная тема" />
  <div :class="{ 'bg-grey-2': !isDark, 'bg-grey-10 text-white': isDark }">
    Ваш контент здесь
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Dark } from 'quasar'

const isDark = ref(Dark.isActive)

watch(isDark, (val) => {
  Dark.set(val)
})
</script>
```

// С этим кодом можно реализовать переключение между светлой и тёмной темой на лету

## Интеграция с иконками и анимациями

Quasar поддерживает несколько икон-паков (Material Icons, Font Awesome и др.). Чтобы использовать, например, Material Icons:

1. Включите их в конфиге `quasar.conf.js` (раздел framework.icons).
2. Используйте как свойство `icon` в любом компоненте.

```vue
<q-btn icon="star" label="Like" color="warning" />
```

Для анимаций доступна утилита Quasar Animate с десятками эффектов, например:

```vue
<q-btn
  label="Animated"
  class="animate__animated animate__bounce"
  color="primary"
/>
```

// Класс добавляет анимацию кнопке через animate.css, интегрированной в Quasar

## Работа с формами, валидацией и управлением состоянием

Многие задачи решаются уже готовыми компонентами. Например, смотрите как просто реализовать форму с валидацией:

```vue
<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <q-input
      v-model="email"
      label="Email"
      type="email"
      :rules="[val => !!val || 'Введите email', val => /.+@.+\..+/.test(val) || 'Некорректный email']"
      lazy-rules
    />
    <q-btn type="submit" label="Отправить" color="primary" />
  </q-form>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')

function onSubmit() {
  // Обработка формы
  alert(`Email: ${email.value}`)
}
</script>
```

// QForm поддерживает валидацию через rules, что сильно упрощает контроль над данными

## Таблицы, списки и пагинация

Quasar QTable — один из самых мощных компонентов для работы с таблицами. Пример:

```vue
<template>
  <q-table
    :rows="rows"
    :columns="columns"
    row-key="name"
    :pagination="pagination"
  />
</template>

<script setup>
const columns = [
  { name: 'name', label: 'Имя', field: 'name' },
  { name: 'age', label: 'Возраст', field: 'age', sortable: true },
]
const rows = [
  { name: 'Иван', age: 22 },
  { name: 'Анна', age: 34 },
  { name: 'Петр', age: 49 },
]
const pagination = { rowsPerPage: 5 }
</script>
```

// QTable легко настраивается для сортировки, пагинации, фильтрации, кастомной рендеризации ячеек

## Модальные окна, диалоги и уведомления

Для обратной связи с пользователем или подтверждения действий используйте QDialog и Notify:

```vue
<template>
  <q-btn label="Открыть диалог" @click="dialog = true" />
  <q-dialog v-model="dialog">
    <q-card>
      <q-card-section>
        Подтвердите своё действие
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Отмена" v-close-popup />
        <q-btn flat label="ОК" color="primary" @click="confirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
const dialog = ref(false)
function confirm() {
  // Реакция на подтверждение
  dialog.value = false
}
</script>
```

// Пример показывает стандартный паттерн для окон подтверждения

Для быстрых уведомлений (pop-up) — используйте Notify:

```js
import { Notify } from 'quasar'

Notify.create({
  message: 'Сохранено!',
  color: 'positive',
  position: 'top-right',
  timeout: 2000
})
```

// Notify позволяет быстро выводить сообщения пользователю

## Локализация и межплатформенность

Quasar уже содержит встроенную поддержку локализации. Просто выберите нужный язык в конфиге приложения. Для сложных приложений используйте интеграцию с vue-i18n:

```js
import { createI18n } from 'vue-i18n'
const i18n = createI18n({
  locale: 'ru',
  messages: {
    ru: { welcome: 'Добро пожаловать' },
    en: { welcome: 'Welcome' }
  }
})
// Примените i18n при создании приложения
```

// Поддержка мультиязычности — must-have для большинства production-проектов

## Сборка и деплой на разные платформы

Quasar — не только UI-фреймворк, но и универсальный инструмент сборки. Вы можете за один клик собрать приложение как:

- браузерное SPA / SSR / PWA (`quasar build`)
- мобильное приложение (Android/iOS через Cordova или Capacitor) (`quasar mode add capacitor; quasar dev -m capacitor`)
- desktop-приложение (Electron) (`quasar mode add electron; quasar dev -m electron`)

С CLI это делается очень быстро, и не требует ручной настройки webpack, babel, etc.

```bash
quasar build -m spa           # Сборка обычного веб-приложения
quasar build -m pwa           # Сборка PWA
quasar build -m electron      # Сборка desktop-приложения
```

Для мобильных платформ используйте Cordova или Capacitor:

```bash
quasar mode add capacitor
quasar dev -m capacitor -T android
```

// Теперь одно Vue-приложение разворачивается сразу под несколько платформ

## Примеры сложных интерфейсов и лучшие практики

Если вам требуется сложный UI — например, многоуровневое меню, дашборды, фильтры и уведомления — Quasar сильно упрощает процесс. Вам стоит грамотно разделять логику между layout, page и вспомогательными компонентами, а также активно использовать слоты и scoped slots для кастомизации вывода.

Покажу пример реализации дашборда:

```vue
<template>
  <q-layout>
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>Дашборд</q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="drawer" show-if-above>
      <q-list>
        <q-item clickable v-for="item in menu" :key="item.label" @click="navigate(item)">
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
const drawer = ref(true)
const menu = [
  { label: 'Главная', route: '/' },
  { label: 'Отчет', route: '/report' }
]
function navigate(item) {
  // Ваша логика навигации
}
</script>
```

// Пример рабочего дашборда с меню и страницами

Использование слотов позволяет вставлять любой контент туда, где это нужно, а scoped slots дают доступ к динамическим данным из компонента.

## Заключение

Quasar Framework представляет собой мощный и гибкий инструмент для быстрой и качественной разработки Vue-приложений, предлагая набор production-ready компонентов, систему роутирования, сборку под разные платформы и множество опций кастомизации. Все компоненты легко интегрируются между собой, что снижает количество кода и увеличивает продуктивность. Благодаря продуманной архитектуре, мощным CLI инструментам и углубленной документации, вы сможете реализовать практически любой UI и даже больше — без необходимости городить “велосипед” на голом CSS или из сторонних пакетов.

Использование Quasar Framework позволит вам значительно ускорить разработку Vue-приложений. Для углубленного изучения работы с Quasar Framework, рекомендуем наш курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=ispolzovanie-quasar-framework-dlya-razrabotki-na-vue-s-gotovymi-ui-komponentami). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Quasar Framework уже сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

#### Как добавить свой кастомный SCSS или CSS к стилям Quasar?

Создайте файл стилей (например, `src/css/my-styles.scss`) и подключите его в `quasar.conf.js` внутри массива `css`, например:  
```js
css: [
  'app.scss',
  'css/my-styles.scss'
]
```
Теперь все ваши стили будут доступны приложению.

#### Как использовать сторонние Vue-плагины вместе с Quasar?

Добавьте нужный плагин через npm. После установки подключите его в файле `src/boot/имя.js` и добавьте этот файл в раздел `boot` в `quasar.conf.js`. В самом boot-файле делайте import и регистрацию плагина внутри setup.

#### Возникают ли конфликты между Quasar и Vuetify/Buefy?

Нежелательно использовать Quasar совместно с другими UI-фреймворками на одном проекте, потому что возможны конфликты стилей и зависимостей компонентов. Лучше придерживаться одного большого UI-фреймворка.

#### Как оптимизировать сборку Quasar для production?

В файле `quasar.conf.js` настройте minification, tree-shaking, выключите source-maps, используйте code splitting. Можно задать анализ бандла через опцию `analyze: true` в разделе build.

#### Как использовать Vuex или Pinia (состояние) внутри проекта Quasar?

Quasar полностью совместим с Vuex и Pinia. Просто установите нужный пакет, создайте store, и подключите его как обычно — через импорт и передачу в createApp в main.js. Доступ к store во всех компонентах обеспечен стандартным способом.
