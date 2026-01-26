---
metaTitle: CSS модули css-modules - полное практическое руководство
metaDescription: Подробное объяснение CSS модулей css-modules - как они работают, как подключать в проектах React Webpack Vite и других сборщиках и как безопасно организовывать стили без конфликтов имен
author: Олег Марков
title: CSS модули css-modules - что это такое и как с ними работать на практике
preview: Разберитесь с CSS модулями css-modules - от концепции локальных стилей до типичных паттернов и интеграции с современными фреймворками и сборщиками
---

## Введение

CSS-модули (css-modules) появились как ответ на одну из самых частых проблем фронтенда — конфликт имен классов и «загрязнение» глобального пространства стилей. Когда стили разрастаются, становится сложно контролировать, какие классы на что влияют, особенно в больших командах.

CSS-модуль — это обычный CSS-файл, который обрабатывается специальным инструментом (чаще всего сборщиком, как Webpack или Vite) так, что:

- имена классов становятся локальными и уникальными;
- вы импортируете стили прямо в JavaScript/TypeScript;
- в коде компонента вы обращаетесь к классам как к свойствам объекта.

Смотрите, дальше я покажу вам, как это работает, на конкретных примерах и в разных окружениях: React, Webpack, Vite и даже без фреймворков.

---

## Что такое CSS-модули на практике

### Ключевая идея

Главная идея CSS-модулей — локальная область видимости классов. То есть:

- стили из одного компонента **не влияют** на разметку других компонентов;
- разные компоненты могут использовать одинаковые имена классов (`.button`, `.title`) без конфликтов;
- сборщик сам генерирует уникальные имена классов вроде `Button_button__3aXg9`.

Давайте разберемся на простом примере.

Пусть у вас есть компонент:

```jsx
// Button.jsx
import React from 'react'
// Импортируем стили как объект
import styles from './Button.module.css'

export function Button() {
  return (
    <button className={styles.button}>
      Нажмите меня
    </button>
  )
}
```

И CSS-модуль:

```css
/* Button.module.css */
.button {
  background-color: #007bff; /* Синий фон */
  color: #fff;               /* Белый текст */
  padding: 8px 16px;         /* Отступы внутри кнопки */
  border-radius: 4px;        /* Скругление углов */
  border: none;              /* Убираем рамку */
  cursor: pointer;           /* Курсор в виде руки */
}
```

После сборки:

- в итоговом HTML класс может превратиться, например, в `Button_button__3aXg9`;
- сам файл `Button.module.css` тоже изменится: `.button` будет заменен на `.Button_button__3aXg9`;
- внутри кода вы продолжаете обращаться к `styles.button`, не задумываясь об этом имени.

Таким образом, если в другом компоненте вы тоже создадите класс `.button`, стили не пересекутся, потому что итоговые имена будут разными.

---

## Как подключить CSS-модули

### Расширение файлов

Общий паттерн — файлы с модулями именуются с суффиксом `.module`:

- для обычного CSS: `Component.module.css`;
- для препроцессоров:
  - `Component.module.scss` или `Component.module.sass`;
  - `Component.module.less`;
  - `Component.module.styl`.

Смотрите, это не строгое требование стандарта, а соглашение, которое используют сборщики. Они по этому суффиксу понимают, что файл нужно обрабатывать как модуль.

### CSS-модули в Create React App

Если вы используете Create React App (CRA), то поддержка CSS-модулей уже встроена. Никакой дополнительной настройки не нужно.

Минимальный пример:

```jsx
// App.jsx
import React from 'react'
import styles from './App.module.css' // Подключаем модуль стилей

export function App() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Приложение с CSS-модулями</h1>
    </div>
  )
}
```

```css
/* App.module.css */
.container {
  padding: 24px;           /* Внешний отступ содержимого */
}

.title {
  font-size: 24px;         /* Размер шрифта заголовка */
  color: #333;             /* Темно-серый цвет текста */
}
```

CRA автоматически включит режим CSS-модулей для всех файлов `*.module.css`.

### CSS-модули в Vite

В Vite CSS-модули тоже включены по умолчанию, если в имени файла есть `.module`.

Пример такой же:

```jsx
// App.jsx
import styles from './App.module.css'

export function App() {
  return <div className={styles.root}>Vite + CSS Modules</div>
}
```

```css
/* App.module.css */
.root {
  font-family: system-ui, sans-serif; /* Устанавливаем системный шрифт */
}
```

Никаких специальных настроек в `vite.config.js` не требуется для базового использования.

### CSS-модули в Webpack

Здесь уже надо немного настроить `css-loader`. Покажу вам простой конфиг для проекта с React:

```js
// webpack.config.js
const path = require('path')

module.exports = {
  entry: './src/index.jsx', // Входной файл приложения
  output: {
    path: path.resolve(__dirname, 'dist'), // Путь к каталогу сборки
    filename: 'bundle.js',                 // Имя итогового бандла
  },
  module: {
    rules: [
      {
        test: /\.module\.css$/i,           // Только файлы *.module.css
        use: [
          'style-loader',                  // Вставляет CSS в DOM
          {
            loader: 'css-loader',
            options: {
              modules: {
                // Схема генерации имен классов
                localIdentName: '[name]_[local]__[hash:base64:5]',
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,                   // Обычный CSS без .module
        exclude: /\.module\.css$/i,        // Исключаем модули
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(js|jsx)$/i,
        exclude: /node_modules/,
        use: 'babel-loader',               // Транспиляция JS/JSX
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],           // Расширения по умолчанию
  },
  mode: 'development',                     // Режим сборки
}
```

Здесь важно:

- файлы с `.module.css` обрабатываются с включенным режимом `modules`;
- обычные `.css` остаются глобальными.

Теперь вы можете использовать импорты вида:

```jsx
import styles from './Button.module.css'

<button className={styles.button}>Кнопка</button>
```

---

## Как использовать классы из CSS-модулей

### Импорт и объект стилей

Когда вы импортируете CSS-модуль, вы получаете объект. Ключи — это имена классов из файла, значения — сгенерированные уникальные имена.

Давайте посмотрим пример:

```css
/* Card.module.css */
.card {
  border: 1px solid #ddd;      /* Серая рамка вокруг карточки */
  padding: 16px;               /* Внутренние отступы */
  border-radius: 8px;          /* Скругленные углы */
}

.title {
  font-weight: 600;            /* Полужирный текст */
  margin-bottom: 8px;          /* Отступ снизу */
}
```

```jsx
// Card.jsx
import React from 'react'
import styles from './Card.module.css' // Импортируем модуль

export function Card({ title, children }) {
  return (
    <div className={styles.card}>
      {/* Используем класс title из модуля */}
      <div className={styles.title}>{title}</div>
      <div>{children}</div>
    </div>
  )
}
```

Если вы выведите `console.log(styles)`, увидите что-то вроде:

```js
// Примерный вывод
{
  card: 'Card_card__3fg5K',
  title: 'Card_title__1aB9Z'
}
```

### Несколько классов на одном элементе

Частый вопрос — как добавить несколько классов одновременно. Поскольку `styles` — это объект, нам нужно собрать строку из нескольких значений.

Простейший вариант — использовать шаблонные строки:

```jsx
// Badge.jsx
import React from 'react'
import styles from './Badge.module.css'

export function Badge({ type, children }) {
  // Здесь мы решаем, какой модификатор применить
  const typeClass = type === 'success' 
    ? styles.success 
    : styles.warning

  return (
    <span className={`${styles.badge} ${typeClass}`}>
      {children}
    </span>
  )
}
```

```css
/* Badge.module.css */
.badge {
  padding: 4px 8px;          /* Внутренние отступы */
  border-radius: 4px;        /* Скругленные углы */
  font-size: 12px;           /* Размер текста */
}

.success {
  background-color: #d4edda; /* Зеленоватый фон */
  color: #155724;            /* Темно-зеленый текст */
}

.warning {
  background-color: #fff3cd; /* Желтый фон */
  color: #856404;            /* Темно-желтый текст */
}
```

Можно использовать и утилиты вроде `clsx` или `classnames`, но для понимания принципа достаточно и простых строк.

### Динамические классы

Иногда вам нужно включать класс по условию. Покажу простой пример без дополнительных библиотек:

```jsx
// TodoItem.jsx
import React from 'react'
import styles from './TodoItem.module.css'

export function TodoItem({ text, done }) {
  // Если задача выполнена, добавляем класс done
  const className = done
    ? `${styles.item} ${styles.done}`
    : styles.item

  return <li className={className}>{text}</li>
}
```

```css
/* TodoItem.module.css */
.item {
  padding: 4px 0;           /* Отступы сверху и снизу */
}

.done {
  text-decoration: line-through; /* Зачеркиваем текст */
  color: #888;                   /* Делаем текст более бледным */
}
```

---

## Локальные и глобальные стили в CSS-модулях

### Локальный режим по умолчанию

По умолчанию все классы в CSS-модуле считаются локальными. Это главное отличие от обычного CSS.

```css
/* Button.module.css */
.button {
  /* Локальный класс, который не виден вне модуля */
}
```

Если вы попробуете в другом компоненте написать `class="button"` без модуля, этот стиль не сработает, потому что итоговый класс в DOM уже другой.

### Как объявить глобальный класс

Иногда все-таки нужно определить глобальный стиль, например, для тега `body` или для сторонней библиотеки. Для этого используется псевдокласс `:global`.

Давайте разберемся на примере:

```css
/* globalStyles.module.css */
:global(body) {
  margin: 0;                    /* Убираем отступы у body */
  font-family: sans-serif;      /* Задаем шрифт по умолчанию */
}

/* Глобальный класс .container */
:global(.container) {
  max-width: 1200px;            /* Максимальная ширина */
  margin: 0 auto;               /* Центрирование по горизонтали */
}

/* Локальный класс .title как обычно */
.title {
  font-size: 24px;
}
```

- `body` и `.container` станут глобальными стилями;
- `.title` останется локальным и будет доступен как `styles.title`.

Покажу, как это использовать:

```jsx
// App.jsx
import React from 'react'
import styles from './globalStyles.module.css'

export function App() {
  return (
    <div className="container">
      {/* Здесь container — глобальный класс из :global */}
      <h1 className={styles.title}>Заголовок в контейнере</h1>
    </div>
  )
}
```

Обратите внимание: для глобального `.container` мы не используем `styles.container`, а пишем просто строку `"container"`.

### Локальный и глобальный селекторы вместе

Иногда нужно смешивать локальные и глобальные селекторы, например, стилизовать глобальный класс внутри локального блока. Смотрите, я покажу вам такой пример:

```css
/* Dialog.module.css */
.dialog {
  padding: 16px;                /* Отступ внутри диалога */
  background-color: #fff;       /* Белый фон */
}

/* Стилизуем глобальный .btn внутри локального .dialog */
.dialog :global(.btn) {
  margin-right: 8px;            /* Отступ между кнопками */
}
```

В итоге:

- `.dialog` будет локальным классом (например, `Dialog_dialog__3xFaP`);
- `.btn` остается глобальным;
- селектор в итоговом CSS будет примерно таким: `.Dialog_dialog__3xFaP .btn`.

---

## Псевдоклассы, псевдоэлементы и вложенности

### Псевдоклассы и псевдоэлементы

С ними все работает так же, как в обычном CSS, только применительно к локальным классам.

```css
/* Link.module.css */
.link {
  color: #007bff;           /* Синий текст */
  text-decoration: none;    /* Убираем подчеркивание */
}

.link:hover {
  text-decoration: underline; /* Подчеркиваем при наведении */
}

.link:active {
  color: #0056b3;            /* Темнее при клике */
}

.link::after {
  content: ' ↗';             /* Добавляем стрелку после ссылки */
}
```

Комбинировать ничего дополнительно не нужно: сборщик подставляет итоговый класс, и псевдоклассы также применяются к правильному элементу.

### Селекторы потомков

Вы можете писать вложенные селекторы на уровне CSS (без препроцессоров) стандартным способом:

```css
/* Menu.module.css */
.menu {
  list-style: none;        /* Убираем маркеры списка */
  padding: 0;              /* Убираем отступы */
  display: flex;           /* Строим пункты в ряд */
}

.menu li {
  margin-right: 16px;      /* Отступ между пунктами */
}

.menu a {
  color: #333;             /* Цвет ссылок */
}
```

Здесь:

- `.menu` станет локальным классом;
- `li` и `a` останутся обычными тегами;
- вся цепочка будет работать корректно.

Если вы используете препроцессоры (Sass, Less), можно записывать это и через вложенность, но это уже не особенность CSS-модулей, а самих препроцессоров.

---

## Работа с препроцессорами (Sass, Less) и CSS-модулями

### Пример с Sass (SCSS)

Давайте посмотрим на пример с `SCSS` и CSS-модулями в React с Vite (но принцип одинаков и для Webpack).

Файл стилей:

```scss
/* Button.module.scss */
$primary: #007bff;        // Переменная для основного цвета
$primary-dark: #0056b3;   // Темный вариант основного цвета

.button {
  padding: 8px 16px;             // Отступы
  border-radius: 4px;            // Скругление углов
  border: none;                  // Без рамки
  background-color: $primary;    // Используем переменную
  color: #fff;                   // Белый текст

  &:hover {
    background-color: $primary-dark; // Темнее при наведении
  }
}
```

Компонент:

```jsx
// Button.jsx
import React from 'react'
import styles from './Button.module.scss' // Обратите внимание на .scss

export function Button({ children }) {
  return (
    <button className={styles.button}>
      {children}
    </button>
  )
}
```

Чтобы это работало, нужно:

- установить Sass: `npm install sass --save-dev`;
- для Vite ничего дополнительно не нужно;
- для Webpack — добавить правило для `scss` с `sass-loader`.

Пример правила для Webpack:

```js
// Часть webpack.config.js
{
  test: /\.module\.scss$/i,        // Файлы с .module.scss
  use: [
    'style-loader',                // Вставляет CSS в DOM
    {
      loader: 'css-loader',
      options: {
        modules: true,             // Включаем режим модулей
      },
    },
    'sass-loader',                 // Компилирует SCSS в CSS
  ],
}
```

---

## Составные стили и композиция

CSS-модули поддерживают особую директиву `composes`, которая позволяет «наследовать» стили одного класса от другого.

### Пример композиции классов

Представьте, что у вас есть базовый стиль кнопки:

```css
/* base.module.css */
.buttonBase {
  padding: 8px 16px;              /* Базовые отступы */
  border-radius: 4px;             /* Скругление */
  border: none;                   /* Без рамки */
  cursor: pointer;                /* Курсор рука */
}
```

И вы хотите создать несколько вариантов кнопок: первичную, вторичную и т.п.

```css
/* buttons.module.css */
.primaryButton {
  composes: buttonBase from './base.module.css'; /* Наследуем базовый стиль */
  background-color: #007bff;                     /* Синий фон */
  color: #fff;                                   /* Белый текст */
}

.secondaryButton {
  composes: buttonBase from './base.module.css'; /* Наследуем базовый стиль */
  background-color: #6c757d;                     /* Серый фон */
  color: #fff;                                   /* Белый текст */
}
```

Использование:

```jsx
// ButtonsPanel.jsx
import React from 'react'
import styles from './buttons.module.css'

export function ButtonsPanel() {
  return (
    <div>
      <button className={styles.primaryButton}>Ок</button>
      <button className={styles.secondaryButton}>Отмена</button>
    </div>
  )
}
```

Что происходит:

- класс `primaryButton` включает в себя все свойства `buttonBase` плюс свои;
- при этом итоговый класс может выглядеть как несколько сгенерированных имен, «склеенных» в одну строку.

### Композиция внутри одного файла

Можно использовать `composes` без `from`, чтобы объединить стили в рамках одного модуля.

```css
/* badge.module.css */
.base {
  padding: 2px 6px;             /* Базовые отступы */
  border-radius: 3px;           /* Скругление */
  font-size: 10px;              /* Размер шрифта */
}

.success {
  composes: base;               /* Наследуем базовый стиль */
  background-color: #d4edda;    /* Зеленоватый фон */
  color: #155724;               /* Темно-зеленый текст */
}

.error {
  composes: base;               /* Наследуем базовый стиль */
  background-color: #f8d7da;    /* Розоватый фон */
  color: #721c24;               /* Темно-красный текст */
}
```

Так вы избегаете дублирования и при этом продолжаете использовать локальные классы.

---

## CSS-модули и типизация (TypeScript)

### Проблема с импортом в TypeScript

Если вы используете TypeScript, при попытке импортировать CSS-модуль:

```ts
import styles from './App.module.css'
```

TypeScript может пожаловаться, что не знает, что это за модуль. Давайте решим это.

### Объявление типов для CSS-модулей

Создайте файл с декларациями, например `global.d.ts` или `css-modules.d.ts` в корне `src`:

```ts
// css-modules.d.ts

// Объявляем модули с расширением .module.css
declare module '*.module.css' {
  // Экспортируем объект с ключами строкового типа
  const classes: { [key: string]: string }
  export default classes
}

// Аналогично для .module.scss, если используете Sass
declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}
```

Теперь TypeScript знает, что импорт из `*.module.css` — это объект, и перестанет ругаться.

---

## Организация структуры проекта со стилями

### Популярные подходы

С CSS-модулями обычно используют один из двух вариантов организации:

1. **Стили рядом с компонентом**  
   - `Button.jsx`  
   - `Button.module.css`  

   Этот подход хорошо изолирует стили компонента и упрощает переиспользование.

2. **Отдельная папка styles**  
   - `components/Button/Button.jsx`  
   - `components/Button/Button.module.css`  
   или  
   - `styles/Button.module.css`

Оба варианта рабочие, выбирайте то, что удобнее вашей команде. На практике чаще выбирают первый.

### Именование классов

Поскольку имена классов все равно становятся уникальными, вы можете не бояться повторов. Но хорошие названия помогают читать код.

Типичные рекомендации:

- называйте классы по семантике, а не по внешнему виду:
  - хорошо: `.card`, `.title`, `.actions`;
  - менее удачно: `.redButton`, `.bigText`;
- для модификаторов используйте дополнительные классы:
  - `.button`;
  - `.primary`;
  - `.danger`.

Пример:

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  border-radius: 4px;
}

.primary {
  background-color: #007bff;
  color: #fff;
}

.danger {
  background-color: #dc3545;
  color: #fff;
}
```

```jsx
// Button.jsx
import styles from './Button.module.css'

export function Button({ variant = 'primary', children }) {
  const variantClass =
    variant === 'danger' ? styles.danger : styles.primary

  return (
    <button className={`${styles.button} ${variantClass}`}>
      {children}
    </button>
  )
}
```

---

## CSS-модули против других подходов к стилям

Чтобы лучше понимать сильные и слабые стороны CSS-модулей, полезно сравнить их с другими решениями.

### CSS-модули vs глобальный CSS

**Глобальный CSS:**

- стили видны везде;
- легко получить конфликты имен;
- сложно удалять неиспользуемые стили;
- сложнее поддерживать большие проекты.

**CSS-модули:**

- стили локальны по умолчанию;
- каждый компонент «носит» свои стили;
- легче рефакторить и удалять неиспользуемые классы;
- структура проекта отражает структуру интерфейса.

### CSS-модули vs CSS-in-JS (styled-components, emotion)

**CSS-in-JS:**

- стили пишутся в JS/TS-файлах;
- поддерживаются переменные, логика прямо внутри стилей;
- динамические стили очень гибкие;
- возможен дополнительный runtime в браузере.

**CSS-модули:**

- стили остаются CSS (или SCSS), что привычно для верстальщиков;
- меньше логики в стилях, больше в компонентах;
- нет зависимости от конкретной библиотеки CSS-in-JS;
- проще подключать существующие инструменты для CSS (PostCSS, Autoprefixer).

Практический вывод: CSS-модули — хороший баланс для проектов, где хочется изолировать стили, но не добавлять большой runtime-слой и сложность CSS-in-JS.

---

## Типичные ошибки и подводные камни

### Ошибка: попытка использовать локальный класс как глобальный

Например:

```css
/* Button.module.css */
.button {
  background: red;
}
```

И в другом компоненте:

```jsx
// Другой компонент (без импорта Button.module.css)
export function Other() {
  return <button className="button">Кнопка</button>
}
```

Этот стиль не сработает, потому что `button` в DOM станет, например, `Button_button__3aXg9`. Чтобы использовать стиль в другом компоненте, нужно:

- либо импортировать модуль и использовать `styles.button`;
- либо вынести нужный класс в глобальный CSS или в `:global`.

### Ошибка: опечатка в имени класса

```css
/* App.module.css */
.conatiner {
  padding: 16px;
}
```

```jsx
import styles from './App.module.css'

export function App() {
  return <div className={styles.container}>Текст</div> // Ошибка в имени
}
```

В рантайме вы получите `undefined` вместо правильного имени класса, и стиль не применится. В таких случаях полезно:

- проверять консоль разработчика (будут заметные странные className);
- использовать линтеры или плагины для проверки.

### Ошибка: неправильная конфигурация сборщика

Если вы случайно забыли суффикс `.module` или не настроили `css-loader` с `modules: true`, импорт будет вести себя как обычный CSS (или вовсе не сработает).

Проверьте:

- что файл называется `*.module.css` (или `*.module.scss`);
- что в Webpack `css-loader` настроен с `modules` для этих файлов;
- что в Vite/CRA вы не переопределили стандартные настройки.

---

## Когда CSS-модули особенно полезны

### Компонентный подход

CSS-модули идеально ложатся на компонентный подход в React, Vue, Svelte и других фреймворках. Каждый компонент может иметь:

- свой файл разметки/логики;
- свой файл модульных стилей.

Это уменьшает связанность между частями приложения.

### Большие команды и долгоживущие проекты

Когда над проектом работает много людей, легко создать «CSS-спагетти», если использовать только глобальные стили. Локализация классов:

- снижает риск случайно «сломать» чужой экран;
- упрощает ревью — легче понять, что где используется;
- позволяет безопаснее удалять и рефакторить код.

---

## Заключение

CSS-модули — это простой и эффективный способ организовать стили так, чтобы они:

- были локальными и не конфликтовали друг с другом;
- удобно подключались прямо из кода компонентов;
- работали вместе с привычными инструментами — CSS, Sass, PostCSS.

Вы подключаете файл `*.module.css` или `*.module.scss`, импортируете его как объект и используете свойства этого объекта в `className`. При необходимости можно:

- объявлять глобальные стили через `:global`;
- комбинировать несколько классов на одном элементе;
- использовать композицию через `composes`, чтобы не дублировать код;
- подключать типизацию в TypeScript через декларации модулей.

CSS-модули хорошо сочетаются с современными сборщиками вроде Vite и Webpack, а в Create React App работают «из коробки». Если вы придерживаетесь компонентного подхода и хотите сделать стили управляемыми, предсказуемыми и менее конфликтными, CSS-модули — один из самых практичных вариантов.

---

## Частозадаваемые технические вопросы по CSS-модулям

### 1. Как подключить PostCSS и Autoprefixer для CSS-модулей

1. Установите зависимости:
   - `npm install postcss postcss-loader autoprefixer --save-dev`
2. Создайте `postcss.config.js`:
   ```js
   module.exports = {
     plugins: [
       require('autoprefixer')(), // Добавляет вендорные префиксы
     ],
   }
   ```
3. В Webpack добавьте `postcss-loader` **после** `css-loader`:
   ```js
   {
     test: /\.module\.css$/i,
     use: [
       'style-loader',
       {
         loader: 'css-loader',
         options: { modules: true },
       },
       'postcss-loader', // Обрабатывает CSS-модули PostCSS
     ],
   }
   ```

### 2. Как настроить tree-shaking для неиспользуемых классов CSS-модулей

1. Используйте сборщик с поддержкой удаления неиспользуемого CSS (например, Webpack + `mini-css-extract-plugin` + `css-minimizer-webpack-plugin`).
2. Включите режим production, чтобы работали оптимизации.
3. Убедитесь, что классы не генерируются динамически строками (иначе анализатор не поймет, какие из них используются).
4. При необходимости добавьте PostCSS-плагин типа `purgecss` и укажите пути к файлам компонентов, чтобы он знал, какие классы реально используются.

### 3. Как использовать CSS-модули в Vue

1. В Vue 3 с Vite можно использовать блок `<style module>`:
   ```vue
   <template>
     <div :class="$style.container">Текст</div>
   </template>

   <style module>
   .container {
     padding: 16px;
   }
   </style>
   ```
2. В SFC доступен объект `$style`, аналогичный `styles` в React.
3. Для Sass используйте `<style module lang="scss">`.

### 4. Как подключить CSS-модули в Next.js

1. Файлы `*.module.css` и `*.module.scss` поддерживаются по умолчанию.
2. В компоненте:
   ```jsx
   import styles from './Home.module.css'

   export default function Home() {
     return <div className={styles.container}>Главная</div>
   }
   ```
3. Для Sass установите `sass`, Next.js автоматически настроит поддержку `.module.scss`.

### 5. Как переопределить стили сторонней библиотеки при использовании CSS-модулей

1. Узнайте глобальный класс, который использует библиотека (например, `.btn`).
2. В своем модуле используйте `:global`:
   ```css
   /* overrides.module.css */
   :global(.btn) {
     border-radius: 0;        /* Переопределяем скругление */
   }
   ```
3. Импортируйте модуль в корневой компонент:
   ```jsx
   import './overrides.module.css' // Сайд-эффектный импорт для глобальных стилей
   ```
4. Не забудьте, что такие стили действуют глобально, используйте их точечно.