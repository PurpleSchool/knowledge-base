---
metaTitle: Как подключить шрифты Fonts в Nuxt
metaDescription: Пошаговое руководство по интеграции шрифтов в проекты на Nuxt - способы подключения Google Fonts, локальных и кастомных шрифтов
author: Олег Марков
title: Как подключить шрифты Fonts в Nuxt
preview: Узнайте, как интегрировать шрифты в Nuxt — от простейшего подключения Google Fonts до работы с локальными и кастомными файлами и Nuxt Font Module
---

## Введение

Шрифты оказывают огромное влияние на внешний вид и удобство вашего веб-проекта. В Nuxt, как и в любом современном фреймворке, есть несколько способов подключить как стандартные, так и кастомные шрифты. Как правильно добавить Google Fonts? Что делать, если шрифт лежит у вас на диске? Как управлять загрузкой шрифтов для наилучшей производительности? Ниже вы увидите, как пошагово добавить шрифты в Nuxt, с акцентом на версии Nuxt 3 и актуальные best practices.

## Способы подключения шрифтов в Nuxt

В Nuxt доступно несколько подходов для интеграции шрифтов в проект. Вот основные из них, которые я опишу подробно:

- Использование CDN (Google Fonts, Adobe Fonts и др.)
- Подключение локальных (кастомных) шрифтов через assets
- Использование специальных модулей (Nuxt Fonts Module)
- Уточнения по работе с шрифтами через CSS и SCSS

Давайте рассмотрим каждую стратегию, чтобы вы могли выбрать подходящую под свои задачи.

### Подключение Google Fonts через CDN

Самый быстрый путь — воспользоваться официальным CDN-подключением. В случае Google Fonts добавление одной строки в head вашего проекта позволяет использовать множество популярных шрифтов.

#### Пример: Вставка Google Fonts через nuxt.config.ts

Смотрите, я покажу вам, куда и как добавить ссылку на шрифт:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap' // Подключаем Roboto
        }
      ]
    }
  }
})
```

- `rel: 'stylesheet'` сообщает, что ссылка — это CSS-таблица стилей.
- `href` указывает на нужный шрифт Google с пометкой display=swap (это влияет на поведение отображения шрифтов, пока не загрузились все файлы).

Теперь вы можете использовать семейство шрифтов Roboto в своих стилях:

```css
body {
  font-family: 'Roboto', sans-serif; // Используем Roboto по всему сайту
}
```

Этот способ прост, не требует настройки дополнительных модулей и отлично подходит для быстрого старта.

#### Как добавить несколько шрифтов?

Вы можете указать сразу несколько семейств и вариантов весов прямо в одной ссылке:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Montserrat:wght@400;500&display=swap'
        }
      ]
    }
  }
})
```

Достаточно отредактировать URL, чтобы подключить сразу несколько популярных шрифтов.

### Использование Nuxt Fonts Module для управления загрузкой Google Fonts

Модуль [@nuxtjs/google-fonts](https://github.com/nuxt-modules/google-fonts) предоставляет более гибкий способ работы с Google Fonts, автоматически вставляя нужные ссылки и даже оптимизируя загрузку.

#### Установка:

Сначала устанавливаем модуль через npm или yarn:

```bash
npm install --save-dev @nuxtjs/google-fonts
```

#### Подключение модуля:

Добавьте модуль в `modules` вашего nuxt.config:

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/google-fonts' // Подключаем модуль
  ],
  googleFonts: {
    families: {
      Roboto: [400, 700], // Вес 400 и 700
      Montserrat: [400, 500]
    },
    display: 'swap' // Поведение swap для быстрой отрисовки
  }
})
```

**Преимущество:** Модуль сам сгенерирует и вставит правильные ссылки, вам не нужно руками писать теги `<link>`. Также он поддерживает advanced-настройки типа preload, prefetch, subsetting и пр.

### Подключение локального или кастомного шрифта

Если вы используете свой собственный шрифт (например, .woff2 или .ttf-файл), его нужно положить в папку assets вашего проекта.

#### Инструкция, как добавить локальный шрифт (например, MyFont.woff2):

1. Поместите ваш файл шрифта в папку `assets/fonts/`.

2. Создайте или отредактируйте глобальный CSS-файл, например, `assets/css/fonts.css`:

```css
/* assets/css/fonts.css */
@font-face {
  font-family: 'MyFont'; // Название шрифта
  src: url('@/assets/fonts/MyFont.woff2') format('woff2'),
       url('@/assets/fonts/MyFont.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap; // Рекомендуется для производительности
}
```

3. Подключите этот CSS-файл глобально. В Nuxt 3 добавьте его в nuxt.config:

```ts
export default defineNuxtConfig({
  css: [
    '@/assets/css/fonts.css' // Подключаем свои шрифты глобально
  ]
})
```

4. Теперь используйте свой шрифт:

```css
body {
  font-family: 'MyFont', sans-serif;
}
```

Всё, шрифт теперь доступен для любого компонента.

### Как загрузить несколько кастомных шрифтов с разными начертаниями и стилями

В случае, если у вас есть, например, одно начертание regular (`font-weight: 400`) и одно bold (`font-weight: 700`), нужно явно прописать оба варианта в файле CSS:

```css
@font-face {
  font-family: 'MyFont';
  src: url('@/assets/fonts/MyFont-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'MyFont';
  src: url('@/assets/fonts/MyFont-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

Позже можно назначать вес через font-weight:

```css
h1 {
  font-family: 'MyFont', sans-serif;
  font-weight: 700; // Будет использоваться MyFont-Bold
}
```

### Использование Nuxt Font Module для подключения и оптимизации кастомных шрифтов

Для Nuxt есть специальный модуль [@nuxtjs/fontaine](https://github.com/nuxt-modules/fontaine), который добавляет поддержку preload, регулирует FOUT и FOIT, и работает с кастомными файлами.

#### Установка и базовое использование:

```bash
npm install --save-dev @nuxtjs/fontaine
```

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/fontaine'
  ],
  fontaine: {
    // применяйте нужные вам параметры, например:
    preconnect: true, // Можно ускорить подключение внешних шрифтов
    fonts: [
      {
        family: 'MyFont',
        src: '/fonts/MyFont-Bold.woff2'
      }
    ]
  }
})
```

Nuxt сам сгенерирует preload для вашего кастомного шрифта, чтобы ускорить его загрузку для пользователя. Подробнее о настройках рекомендую смотреть в [официальной документации](https://github.com/nuxt-modules/fontaine).

### Вариант: Подключение шрифтов через SCSS/LESS или CSS-модули

Если вы используете SCSS/LESS для стилей компонентов, шрифты прописывайте так же, как и в обычном CSS, либо импортируйте общий fonts.css в главный scss-файл:

```scss
// assets/scss/main.scss
@import "fonts"; // fonts.scss лежит в этой же папке
```

И в nuxt.config:

```ts
export default defineNuxtConfig({
  css: [
    '@/assets/scss/main.scss'
  ]
})
```

### Важные советы по производительности и доступности

- Используйте `font-display: swap` для кастомных шрифтов — это позволяет сначала отобразить текст системным шрифтом, и после загрузки кастомного подменить его без резкого мигания.
- Следите за размером файлов — используйте woff2 и только нужные начертания и символы.
- Для Google Fonts минимизируйте количество семейств и начертаний.
- Следите за легальным использованием лицензий шрифтов.

### Использование Adobe Fonts (Typekit) в Nuxt

Для Adobe Fonts порядок такой же, как с Google Fonts через CDN: получите embed-код — обычно это `<link>` или `<script>` — и вставьте его через раздел head в nuxt.config.ts:

```ts
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://use.typekit.net/xxxxxxx.css'
        }
      ]
    }
  }
})
```

Названия классов и шрифтов указаны вам в консоли на сайте Adobe Fonts.

### Общие шаги для проверки работы шрифтов

1. Убедитесь, что файл шрифта находится по нужному пути.
2. Проверьте, что CSS-файл с @font-face действительно загружается.
3. Откройте DevTools — вкладка Network покажет, грузятся ли ваши файлы.
4. В Elements убедитесь, что применяется нужный font-family.

## Заключение

Вам доступны разные пути подключения шрифтов в Nuxt: от простого CDN Google Fonts и Adobe Fonts до продвинутой работы с локальными файлами и использования модулей Nuxt. Каждый вариант хорошо подходит для своих задач: CDN — для базовых случаев, кастомные шрифты — для уникального дизайна, модули — для оптимизации и сложных сценариев. Следите за производительностью, оптимизируйте размеры шрифтов, не забывайте про лицензионные ограничения. Способы комбинируются — экспериментируйте и выбирайте наиболее удобный.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**Как сделать preload для кастомного шрифта в Nuxt 3?**  
Добавьте ссылку preload вручную в head через nuxt.config.ts:
```ts
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/MyFont.woff2', crossorigin: 'anonymous' }
      ]
    }
  }
})
```
Это ускоряет первичную загрузку шрифта браузером.

**Что делать, если шрифт не загружается или отображается некорректно?**  
Проверьте путь до файлов, правильность формата в src в @font-face, убедитесь в наличии настройки font-display. Откройте вкладку Network и Elements в DevTools — убедитесь, что шрифты загружаются без ошибок.

**Можно ли подключать шрифты через CDN и локальные одновременно?**  
Можно. Просто подключайте и внешний CDN (Google, Adobe) через head, и локальные через assets — используйте разные font-family в CSS.

**Как сделать так, чтобы шрифты загружались только для некоторых страниц или компонентов?**  
Вместо глобального подключения импортируйте CSS-файлы с @font-face только в нужных компонентах. Например, используйте `<style scoped src="@/assets/css/page-specific-font.css">` внутри нужного .vue-файла.

**Могу ли я использовать переменные шрифты (variable fonts) с помощью Nuxt?**  
Да, добавьте variable-шрифт как файл, укажите format('woff2-variations') и диапазон font-weight, далее используйте font-variation-settings в CSS для нужной настройки в компонентах.