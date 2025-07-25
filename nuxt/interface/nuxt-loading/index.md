---
metaTitle: Настройка индикатора загрузки в Nuxt
metaDescription: Узнайте как настраивать индикатор загрузки в Nuxt - варианты кастомизации, интеграция сторонних решений и практические советы разработчикам
author: Олег Марков
title: Настройка индикатора загрузки в Nuxt
preview: Освойте настройку индикатора загрузки в Nuxt - изучите стандартные методы, кастомизацию и подключение внешних лоадеров, чтобы улучшить пользовательский опыт
---

## Введение

В веб-приложениях на основе Nuxt очень важно обеспечить пользователю своевременную и понятную обратную связь о процессе загрузки страниц или данных. Для таких задач в Nuxt предусмотрен специальный индикатор загрузки (loading indicator). Правильная настройка этого элемента позволит улучшить пользовательский опыт — никто не любит сидеть в неведении после клика по ссылке или отправки формы.

В этой статье я помогу вам разобраться с возможностями индикатора загрузки в Nuxt, покажу стандартные подходы, нюансы кастомизации и способы интеграции собственных или сторонних решений. Будут приведены рабочие примеры, на которые вы сможете опереться при реализации своих проектов. Давайте вместе разберёмся, как сделать загрузку вашего приложения понятной и приятной для пользователя.

## Виды индикаторов загрузки в Nuxt

Nuxt поддерживает несколько способов отображения загрузки. Основных сценария два:

- Глобальный индикатор (Progress Bar): плавная полоска в верхней части экрана, показывающая процесс перехода между страницами.
- Локальные методы загрузки: обработка загрузки данных на уровне страницы или компонента с помощью собственной логики и отображения любого собственного индикатора.

В Nuxt 2 реализован встроенный progress bar. В Nuxt 3 отдельный progress bar из коробки не входит, но его можно включить или добавить внешний плагин. В этой статье я рассмотрю оба варианта, потому что до сих пор широко используются обе версии Nuxt.

## Настройка стандартного индикатора загрузки в Nuxt 2

В Nuxt 2 индикатор загрузки включён по умолчанию и реализован на базе пакета `nprogress`, который создает простую анимированную полоску в верхней части приложения.

### Основные опции настройки

Все настройки индикатора производятся через объект `loading` в файле `nuxt.config.js`. Вот базовый пример его использования:

```js
// nuxt.config.js

export default {
  loading: {
    color: '#00c58e', // Основной цвет полоски загрузки
    height: '4px',    // Толщина полоски
    duration: 5000,   // Максимальное время в ms до исчезновения полоски
    continuous: true, // Полоса будет пульсировать при длительной загрузке
    rtl: false,       // Отображение справа налево
    failedColor: '#f56c6c', // Цвет полоски если загрузка завершилась ошибкой
  }
}
```

#### Объяснение параметров:

- `color` — основной цвет полоски (поддерживаются любые значения CSS цвета).
- `height` — задаёт высоту (тонкую или более жирную линию).
- `duration` — максимальное время жизни индикатора, после чего он скрывается.
- `continuous` — если true, полоска будет пульсировать при долгих запросах.
- `failedColor` — цвет для неуспешных загрузок.
- `rtl` — направление отображения (например, для арабского).

Если вы не укажете объект `loading`, будет использоваться стандартное оформление полоски Nuxt.

Вот как легко изменить цвет и высоту полоски под фирменный стиль:

```js
// nuxt.config.js

export default {
  loading: {
    color: '#2196f3',
    height: '3px'
  }
}
```

Теперь пользователи увидят полоску вашего цвета при каждом переходе.

### Отключение индикатора

Если стандартный индикатор не нужен, вы можете его отключить полностью:

```js
// nuxt.config.js

export default {
  loading: false,
}
```

Это освобождает пространство для интеграции кастомного решения - будь то собственный дизайн или сторонний компонент.

### Использование кастомного компонента загрузки

Nuxt 2 позволяет подменять встроенную полоску собственным компонентом. Для этого укажите путь к Vue-компоненту:

```js
// nuxt.config.js

export default {
  loading: '~/components/MyCustomLoader.vue'
}
```

Теперь во время загрузки Nuxt будет рендерить ваш компонент. Пример простого кастомного loader-компонента:

```vue
<!-- components/MyCustomLoader.vue -->
<template>
  <div class="my-loader">
    <!-- Например, кастомная SVG анимация -->
    <svg viewBox="0 0 50 50">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="#00c58e"
        stroke-width="5"
        stroke-dasharray="31.415, 31.415"
        stroke-linecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="1s"
          repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
</template>
```

Не забудьте добавить стили для вашего loader-компонента, чтобы занять правильное место на экране.

## Индикатор загрузки в Nuxt 3

В Nuxt 3 подход изменился — индикатор загрузки из коробки не встроен, но реализуется очень просто с помощью community пакетов, либо кастомных решений.

### Установка официального пакета @nuxt/loading-indicator

Команда Nuxt предлагает пакет `@nuxt/loading-indicator`, который возвращает классический прогресс-бар. Давайте добавим его к вашему проекту:

```bash
npm install --save-dev @nuxt/loading-indicator
```

Теперь регистрируем модуль в nuxt.config.ts:

```js
// nuxt.config.ts

export default defineNuxtConfig({
  modules: [
    '@nuxt/loading-indicator'
  ],
  loadingIndicator: {
    color: '#00c58e',
    background: 'white',
    height: '4px',
    duration: 5000,
    continuous: true
  }
})
```

Как видите, параметры похожи на те, что в Nuxt 2. <br>
Компонент теперь тоже легко гибко стилизовать с помощью свойств.

### Локальные (компонентные) индикаторы в Nuxt 3

Переходите к локальным индикаторам, когда вам нужно отображать состояния загрузки данных, например, при инициализации новых данных страницы (fetch, ajax, api-запросы).

#### Пример с useAsyncData и кастомным loader

Я покажу вам классическую схему с использованием Nuxt composable:

```vue
<template>
  <div>
    <div v-if="pending">
      <MyLoader />
    </div>
    <div v-else>
      <ul>
        <li v-for="post in data" :key="post.id">{{ post.title }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const { data, pending, error } = await useAsyncData('posts', () =>
  $fetch('https://jsonplaceholder.typicode.com/posts')
)
// pending — булевое состояние загрузки
</script>
```

Здесь `<MyLoader />` — это ваш собственный компонент индикатора.

Этот подход удобен для сложных страниц, где загрузка идёт только внутри определённых компонентов, а не глобально по всему приложению.

### Интеграция внешних лоадеров (например, nprogress или vue-loading-overlay)

Если вам нужен индивидуальный стиль или расширенные возможности, вы спокойно можете добавить проверенные решения из npm.

#### Пример интеграции nprogress

1. Устанавливаем пакет:

```bash
npm install nprogress
```

2. Создаём плагин (например, `plugins/nprogress.ts`):

```js
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:start', () => {
    NProgress.start() // Показываем прогресс-бар при начале перехода
  })

  nuxtApp.hook('page:finish', () => {
    NProgress.done() // Скрываем после завершения загрузки
  })
})
```

3. Добавляем плагин в `nuxt.config.ts`:

```js
export default defineNuxtConfig({
  plugins: [
    '~/plugins/nprogress.ts'
  ]
})
```

Теперь при каждом переходе между страницами будет появляться и исчезать прогресс-бар NProgress.

#### Пример интеграции vue-loading-overlay

Если удобнее спиннер/оверлей, воспользуйтесь библиотекой [vue-loading-overlay](https://github.com/ankurk91/vue-loading-overlay):

1. Устанавливаем пакет:

```bash
npm install vue-loading-overlay
```

2. Импортируем компонент в нужном месте и показываем при загрузке:

```vue
<template>
  <div>
    <loading :active.sync="isLoading" />
    <!-- Контент -->
  </div>
</template>

<script setup>
import Loading from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/vue-loading.css'

const isLoading = ref(false)

const loadData = async () => {
  isLoading.value = true
  // Имитация сетевого запроса
  await new Promise((resolve) => setTimeout(resolve, 1000))
  isLoading.value = false
}

// Вызываете loadData() при необходимости
</script>
```

### Автоматизация и контроль индикатора из кода

Не всегда достаточно только конфигурировать внешний вид. Иногда вы захотите управлять индикацией загрузки программно, например, при асинхронных действиях пользователя (не связанных с навигацией роутера).

В Nuxt 2 для этого используйте методы `$nuxt.$loading`:

```js
// где-нибудь в методах компонента Nuxt 2

this.$nuxt.$loading.start() // Запустить индикатор загрузки

// ... асинхронный код ...

this.$nuxt.$loading.finish() // Завершить
// Можно использовать this.$nuxt.$loading.fail() — если нужно показать ошибку
```

В Nuxt 3 обрабатывайте это через подключенный внешний loader (например, через события или состояния reactive переменных, ref/pinia и т.д.).

## Особенности и советы по UX

### Какой индикатор выбрать?

- **Для большинства приложений** достаточно встроенного индикатора прогресса — его видят сразу на навигационных переходах.
- **Если ваше приложение активно работает с API** внутри страниц, добавьте локальные лоадеры внутри компонента: это лучше отражает реальное состояние данных.
- **Не злоупотребляйте индикаторами** — если данные грузятся мгновенно, пользователь может даже не успеть увидеть индикатор, не увеличивайте искусственно время отображения.

### Дизайн и анимации индикаторов

- Используйте плавные анимации: фирменные цвета, мягкие переходы.
- Спиннеры и оверлеи не должны мешать взаимодействию с приложением, если это не обязательно с точки зрения UI/UX.
- На мобильных устройствах индикатор должен быть хорошо виден, но не перекрывать важные элементы.

### Цепочки загрузок и комбинированные лоадеры

В сложных приложениях может потребоваться комбинировать индикаторы: глобальный progress bar и локальные спиннеры для отдельных зон или компонентов. Не бойтесь совмещать оба подхода для полного контроля над информированием пользователя.

## Заключение

Настройка индикатора загрузки в Nuxt — это не только вопрос эстетики, но и важный элемент позитивного пользовательского опыта. Nuxt предоставляет гибкие возможности: стандартные полоски, собственные компоненты и интеграцию внешних решений. Выбор зависит от ваших целей: показать базовый прогресс, добавить сложную анимацию или интегрировать кастомное решение под специфику ваших данных.

В современных приложения забота о моменте загрузки становится ещё важнее — не давайте пользователю скучать или терять уверенность в том, что приложение работает. С помощью приведённых выше решений вы сможете гибко настроить индикацию загрузки под любые задачи и стили.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как в Nuxt 3 добавить индикатор загрузки только на внутренние API-запросы, а не на роутинг?

Для этого используйте reactive переменную (например, ref через useState/pinia) и в нужных местах оборачивайте вызовы fetch/axios:  
```js
const isApiLoading = useState('isApiLoading', () => false)
isApiLoading.value = true
await $fetch(...)
isApiLoading.value = false
```  
В шаблоне делайте показ кастомного loader-компонента по значению isApiLoading.

### Как изменить скорость анимации стандартного progress-bar?

В параметрах объекта loading/ loadingIndicator укажите свойство duration:  
```js
loading: { duration: 10000 } // 10 секунд
```  
Это ограничит или увеличит максимальное время анимации полоски.

### Как обработать ошибку при загрузке и показать "красный" индикатор?

В Nuxt 2 можно использовать this.$nuxt.$loading.fail(). В Nuxt 3 — передать нужный цвет в стороннее решение (например, NProgress):  
```js
NProgress.done(true) // true — отображает красным цветом завершение с ошибкой
```

### Как убрать margin фиксированного индикатора, чтобы прогресс-бар не съедал верхний пиксель сайта?

В Nuxt 2 настройте свойство throttle, высоту height и занулите отступы в кастомном css:  
```css
#nprogress .bar {
  top: 0;
  margin: 0;
}
```

### Можно ли полностью скрыть индикатор на мобильных устройствах?

Да, через media query в кастомных стилях скройте элемент:  
```css
@media (max-width: 600px) {
  #nprogress { display: none; }
}
```
Это позволит не отвлекать пользователя с малым экраном лишней визуализацией.