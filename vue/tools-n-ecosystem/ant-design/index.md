---
metaTitle: Работа с Ant Design Vue для создания UI на Vue
metaDescription: Познакомьтесь с возможностями Ant Design Vue - эффективного UI-фреймворка для Vue приложений. Получите инструкции, примеры и лучшие практики для быстрой интеграции интерфейсов
author: Олег Марков
title: Работа с Ant Design Vue для создания UI на Vue
preview: Погрузитесь в практическую работу с Ant Design Vue - как устанавливать библиотеку, использовать готовые UI-компоненты, настраивать темы и собирать современные интерфейсы на Vue
---

## Введение

Ant Design Vue — это один из самых популярных UI-фреймворков для Vue. Библиотека создана как порт известного React-фреймворка Ant Design и несет в себе лучшие практики UI/UX, широкую компонентную базу, подробную документацию и гибкие возможности кастомизации внешнего вида. Вы сможете быстро собирать современные интерфейсы с продуманной системой компонентов, темизацией, поддержкой адаптивности и полезной экосистемой.

В этой статье вы узнаете:

- Как интегрировать Ant Design Vue в Vue-проект;
- Как использовать базовые и сложные компоненты;
- Какие методы работы с формами, таблицами, модальными окнами предлагает библиотека;
- Как использовать глобальные параметры, темы, иконки;
- Какие подводные камни и нюансы стоит учесть при работе.

Давайте перейдём к практическим примерам и разберём всё по шагам.

Ant Design Vue – мощный UI-фреймворк для Vue.js, который позволяет быстро создавать красивые и функциональные интерфейсы.  Изучение возможностей Ant Design Vue и его интеграции с вашими проектами значительно упростит разработку UI. Если вы хотите детальнее погрузиться в Vue.js, изучить основы, компоненты, свойства и события, реактивность, жизненный цикл, а также научиться работать с Vue Router и Pinia, приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=Rabota-s-Ant-Design-Vue-dlya-sozdaniya-UI-na-Vue). На курсе 173 уроков и 21 упражнение, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Установка и базовая настройка Ant Design Vue

### Быстрый старт

Ant Design Vue поддерживает Vue 3 и Vue 2, но большинство новых возможностей и обновлений выходят для Vue 3. Перед началом убедитесь, что ваш проект основан на актуальной версии Vue.

Выполните установку через npm или yarn:

```bash
npm install ant-design-vue --save
# или
yarn add ant-design-vue
```

Теперь зарегистрируйте библиотеку в вашем проекте. Здесь я показываю подключение для основного файла проекта, например, `main.js` или `main.ts`:

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

const app = createApp(App);
app.use(Antd);
app.mount('#app');
```

Это подключит все компоненты. Если требуется облегчить сборку, можно регистрировать только нужные компоненты — об этом расскажу чуть позже.

### Импорт отдельных компонентов

Для оптимизации bundle-объёма рекомендуется импортировать только используемые компоненты. Пример для Vue 3:

```js
import { Button, Input } from 'ant-design-vue';
app.use(Button);
app.use(Input);
```

Вы также можете подключать CSS только выбранных компонентов, если используете postcss/pluggable CSS.

## Использование базовых компонентов

Ant Design Vue предлагает десятки готовых компонентов, от простых кнопок и инпутов до продвинутых таблиц, форм, модальных окон.

### Кнопки и типы кнопок

```vue
<template>
  <a-button type="primary">Primary Button</a-button>
  <a-button>Default Button</a-button>
  <a-button type="dashed">Dashed Button</a-button>
  <a-button type="text">Text Button</a-button>
  <a-button type="link">Link Button</a-button>
</template>
```

- `type="primary"` — выделяет главную кнопку.
- `type="dashed"`, `type="text"`, `type="link"` — стилизованные варианты.

Каждый компонент начинается с префикса `a-` (ant design), чтобы избежать конфликтов с другими библиотеками.

### Использование иконок

Для иконок Ant Design предоставлен отдельный пакет, начиная с версии 2.x:

```bash
npm install @ant-design/icons-vue --save
```

Теперь вы можете использовать иконки:

```vue
<script setup>
import { UserOutlined } from '@ant-design/icons-vue';
</script>

<template>
  <a-button type="primary" icon>
    <UserOutlined />
    Войти
  </a-button>
</template>
```
  
- Иконки интегрируются как компоненты Vue.
- Можно использовать любые из обширной библиотеки иконок.

### Использование форм

Работа с формами — одна из сильных сторон Ant Design Vue. Здесь предлагается удобная валидация, форматирование, управление состоянием:

```vue
<template>
  <a-form
    :model="form"
    :rules="rules"
    @finish="onFinish"
  >
    <a-form-item
      label="Имя пользователя"
      name="username"
      :rules="[{ required: true, message: 'Введите имя!' }]"
    >
      <a-input v-model:value="form.username" />
    </a-form-item>

    <a-form-item
      label="Пароль"
      name="password"
      :rules="[{ required: true, message: 'Введите пароль!' }]"
    >
      <a-input-password v-model:value="form.password" />
    </a-form-item>

    <a-form-item>
      <a-button type="primary" html-type="submit">
        Вход
      </a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({
  username: '',
  password: ''
})

const onFinish = values => {
  // Форма успешно отправлена, здесь values содержит введённые данные
  console.log('Данные формы:', values);
}
</script>
```

- Используются директивы `v-model:value` для двусторонней привязки.
- Правила валидации задаются на уровне каждого поля, возможно применение встроенных и кастомных валидаторов.

### Таблицы (Table)

Компонент таблицы позволяет работать с массивами данных, поддерживает сортировку, пагинацию, фильтрацию:

```vue
<template>
  <a-table :columns="columns" :data-source="data" :pagination="false" />
</template>

<script setup>
const columns = [
  { title: 'Имя', dataIndex: 'name', key: 'name' },
  { title: 'Возраст', dataIndex: 'age', key: 'age' },
  { title: 'Адрес', dataIndex: 'address', key: 'address' }
]
const data = [
  { key: '1', name: 'Алексей', age: 32, address: 'Москва' },
  { key: '2', name: 'Мария', age: 28, address: 'Санкт-Петербург' }
]
</script>
```

- `columns` — описание колонок с подписями, свойствами объекта данных, ключами.
- `data-source` — массив ваших данных.

Для сортировки, фильтрации, пагинации на большем количестве данных можно добавлять свойства: `pagination`, `rowSelection`, `filters`.

### Модальные окна (Modal)

```vue
<template>
  <a-button type="primary" @click="showModal = true">
    Открыть модальное окно
  </a-button>
  <a-modal v-model:visible="showModal" title="Заголовок">
    <p>Содержимое окна</p>
  </a-modal>
</template>

<script setup>
import { ref } from 'vue'
const showModal = ref(false)
</script>
```

- Управляйте отображением окна через переменную, связанной с директивой `v-model:visible`.

### Оповещения и уведомления

Для вывода кратких сообщений — используйте компонент Notification или Message. Они вызываются через методы:

```js
// Вызов всплывающего сообщения об успехе
import { message } from 'ant-design-vue'

message.success('Данные успешно сохранены')
```

```js
// Оповещение с более сложным содержимым
import { notification } from 'ant-design-vue'

notification.open({
  message: 'Ошибка',
  description: 'Произошла ошибка при сохранении данных'
})
```

Эти методы работают вне шаблона компонента, идеальны для асинхронных действий.

## Расширенные возможности и интеграция

### Темизация и настройка внешнего вида

Ant Design Vue построен на preprocessor Less, что облегчает переопределение переменных темы. Стандартный подход в Vue CLI-проектах:

1. Установите зависимость:

```bash
npm install less less-loader --save-dev
```

2. В `vue.config.js` (или аналогичных настройках сборки) добавьте:

```js
// vue.config.js
module.exports = {
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {
            'primary-color': '#52c41a', // Зелёный вместо синего
            'border-radius-base': '6px'
          },
          javascriptEnabled: true
        }
      }
    }
  }
}
```
  
3. Теперь все ваши компоненты Ant Design примут новую палитру.

В проектах Vite подход аналогичен, но конфигурация подключается через `vite.config.js`.

### Ленивая загрузка (On-demand loading)

Чтобы уменьшить размер финального бандла, рекомендуется использовать загрузку компонентов и стилей по требованию. Смотрите, как это сделать с помощью `unplugin-vue-components` и `unplugin-auto-import`:

```bash
npm install -D unplugin-vue-components unplugin-auto-import
```

Добавьте в вашу vite или webpack конфигурацию поддержку авто-импорта Ant Design компонентов.

**Vite пример:**
```js
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    Components({
      resolvers: [AntDesignVueResolver()],
    }),
  ],
})
```

Теперь компоненты подключаются автоматически при их использовании.

### Использование слотов и кастомизация

Большинство компонентов поддерживают кастомизацию через “слоты” — вы можете передавать в компоненты HTML и другие компоненты:

```vue
<a-button>
  <template #icon>
    <UserOutlined />
  </template>
  Кнопка c иконкой
</a-button>
```

Точно так же таблицы, селекты, модальные окна поддерживают user-defined slots для рендера кнопок, хедеров, футеров и так далее.

### Локализация (i18n)

Ant Design Vue поддерживает мультиязычность через функцию `ConfigProvider`. Для русского языка:

```js
import ruRU from 'ant-design-vue/es/locale/ru_RU'

<ConfigProvider :locale="ruRU">
  <App />
</ConfigProvider>
```

Вы можете локализовать подписи и форматы дат на лету.

### Подключение к Vuex/Pinia

Хотите привязать компоненты к глобальному состоянию приложения? Просто используйте стандартные подходы Vue и любую state management библиотеку:

```vue
<script setup>
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
// Теперь userStore.username доступен в шаблоне через v-model
</script>
```

Всё работает так же, как и с любыми Vue компонентами.

## Частые проблемы и советы по использованию

- **Конфликт стилей:** Если вы используете сторонние UI-фреймворки, могут возникать конфликты CSS.
- **SSR/Server Side Rendering:** Для Nuxt или Vue SSR учитывайте, что не все методы и компоненты Ant Design Vue рендерятся 100% на сервере. Потребуются специальные настройки.
- **Динамическое подключение**: Не забывайте использовать динамический импорт и ленивую загрузку для тяжёлых компонентов (таких как таблицы с огромными объёмами данных или сложные формы).

Покажу простой пример динамического подключения компонента:

```vue
<template>
  <Suspense>
    <template #default>
      <LazyTable />
    </template>
    <template #fallback>
      <a-spin />
    </template>
  </Suspense>
</template>

<script setup>
// Компонент будет загружен только если понадобится
const LazyTable = defineAsyncComponent(() => import('./TableComponent.vue'))
</script>
```

## Заключение

Ant Design Vue — это мощный инструмент для быстрой и современной верстки интерфейсов на Vue. Приятная документация, обилие компонентов, широкие опции кастомизации и тесная интеграция с экосистемой Vue делают его отличным выбором для малых и крупных проектов. Вы с лёгкостью реализуете сложные UI, не жертвуя скоростью разработки или качеством.

От установки и базовых компонентов до тонкой настройки, Ant Design Vue покрывает большинство повседневных задач frontend-разработчика. Следуйте приведённым практикам, используйте современные инструменты сборки и подключайте только нужное — это поможет держать проект быстрым и удобным в поддержке.

Использование Ant Design Vue поможет вам создавать современные и удобные пользовательские интерфейсы. В первых 3 модулях курса [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=Rabota-s-Ant-Design-Vue-dlya-sozdaniya-UI-na-Vue) уже доступно бесплатное содержание — начните погружаться в мир Vue.js и Ant Design Vue прямо сейчас.

## Частозадаваемые технические вопросы

### Как добавить Ant Design Vue только в часть проекта (например, в конкретный модуль или компонент)?

Вы можете импортировать и использовать только нужные компоненты Ant Design Vue внутри конкретного файла компонента. Просто импортируйте их локально и зарегистрируйте в секции компонента:

```js
import { Button } from 'ant-design-vue'
export default {
  components: { 'a-button': Button }
}
```
CSS для компонентов всё равно должен быть импортирован глобально.

### Как настроить иконки в Ant Design Vue с помощью собственного набора SVG?

Для использования собственных SVG-иконок импортируйте их как компоненты и используйте в слоте `<template #icon>` или прямо внутри кнопок:

```vue
<template>
  <a-button>
    <CustomIcon />
    Пользовательская иконка
  </a-button>
</template>
<script>
import CustomIcon from '@/assets/custom-icon.svg'
</script>
```

### Как избавиться от предупреждения "You are using the wrong version of Vue"?

Убедитесь, что все зависимости проекта (включая ant-design-vue, vue, vue-router и т.д.) используют совместимые версии. Проверьте peer-dependencies и при необходимости удалите папку `node_modules` и файл `package-lock.json` (или `yarn.lock`), затем выполните повторную установку зависимостей.

### Как решить проблему с динамическими формами (например, массив полей формы)?

Используйте `v-for` для генерации динамических `<a-form-item>` с уникальными свойствами `:name` на каждом элементе массива:

```vue
<a-form-item
  v-for="(item, idx) in items"
  :key="idx"
  :name="['items', idx, 'value']"
>
  <a-input v-model:value="item.value" />
</a-form-item>
```
Следите, чтобы `name` соответствовал форме данных вашей модели.

### Почему не применяются стили кастомной темы в Vite при использовании Ant Design Vue?

Убедитесь, что вы используете официальный [vite-plugin-theme](https://github.com/vbenjs/vite-plugin-theme) либо корректно настраиваете less-переменные через `vite.config.js` с ключами `modifyVars`. Пример для Vite:

```js
css: {
  preprocessorOptions: {
    less: {
      modifyVars: { 'primary-color': '#ff4d4f' },
      javascriptEnabled: true,
    },
  },
}
```
Перезапустите dev-server после изменения конфигурации.
