---
metaTitle: Настройка ESLint для Vue проектов и поддержка качества кода
metaDescription: Пошаговое руководство по настройке ESLint для проектов на Vue - лучшие практики и примеры для поддержания качества и читаемости кода
author: Олег Марков
title: Настройка ESLint для Vue проектов и поддержка качества кода
preview: Разберитесь как ESLint помогает улучшить качество кода в Vue приложениях - настройка с нуля, интеграция с редакторами, типичные проблемы и их решение
---

## Введение

Когда вы создаёте проекты на Vue, со временем становится сложнее поддерживать чистоту, структуру и читаемость кода. Ошибки в стиле, случайные баги и несоответствие стандартам могут возникать даже у опытных разработчиков. Решить эти проблемы помогает автоматизация контроля за качеством кода. Один из самых эффективных инструментов для этой задачи — ESLint, статический анализатор кода, который выявляет ошибки и помогает придерживаться стиля кодирования в JavaScript-проектах, включая Vue.

ESLint работает не только как средство выявления синтаксических ошибок, но и как гайдлайн по стилю (лучшие практики написания кода), снижая количество багов еще до тестирования или запуска приложения. В этой статье я подробно расскажу, как с нуля настроить ESLint в Vue-проекте, объясню ключевые настройки и правила, расскажу про интеграцию с редакторами кода и покажу, как поддерживать высокий уровень качества на постоянной основе.

## Почему качество кода так важно в проектах на Vue

Vue – мощный и гибкий фреймворк, который позволяет быстро создавать интерфейсы любой сложности. Однако, как и в любом другом JavaScript-фреймворке, при увеличении размера кода возникает вероятность допустить неконсистентность, технический долг и сложноуловимые ошибки. Поддерживать чистоту кода в таких условиях важно по нескольким причинам:

- **Читаемость** — упрощает анализ чужого и даже собственного кода спустя время
- **Минимизация багов** — многие ошибки улавливаются автоматически
- **Ускорение ревью** — команда тратит меньше времени на разбор отступов и синтаксиса, концентрируясь на бизнес-логике
- **Облегчение рефакторинга** — структурированный код проще изменять и поддерживать

ESLint дополняет стандартные возможности Vue-команд и Webpack, помогая внедрить культуру качественного кода на всех этапах разработки.

Поддержание качества и читаемости кода — важная задача для любого разработчика. Настройка ESLint во Vue.js проектах позволяет автоматизировать проверку кода на соответствие стандартам и выявлять потенциальные ошибки. Если вы хотите детальнее погрузиться в Vue.js, изучить основы, компоненты, свойства и события, реактивность, жизненный цикл, а также научиться работать с Vue Router и Pinia, приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=Nastrojka-ESLint-dlya-Vue-proektov-i-podderzhka-kachestva-koda). На курсе 173 уроков и 21 упражнение, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Установка и базовая настройка ESLint в Vue-проекте

Давайте рассмотрим, как можно подключить ESLint в новый или уже созданный проект на Vue. Я покажу инструкции для обоих случаев.

### Создание нового проекта с ESLint через Vue CLI

Если вы создаёте проект через официальную Vue CLI, вы сможете выбрать ESLint на этапе настройки:

1. Запустите команду:
   ```
   vue create my-vue-app
   ```
2. В интерактивном меню выберите `Manually select features` (Выбрать компоненты вручную).
3. Отметьте опцию `ESLint` и дополнительные опции — по желанию.
4. Дальше CLI предложит выбрать конфигурацию. Выберите подходящую — например, базовую или с Airbnb, или настройте вручную.

После этих шагов у вас уже будет настроенный файл конфигурации `.eslintrc.js`, `.eslintrc.json` или `.eslintrc.yaml` (в зависимости от вашего выбора).

### Как подключить ESLint к существующему Vue-проекту

Если у вас уже есть проект и вы хотите добавить ESLint, используйте пакетный менеджер вашего проекта:

```
npm install --save-dev eslint eslint-plugin-vue
```

Или с Yarn:

```
yarn add -D eslint eslint-plugin-vue
```

Сгенерируйте файл конфигурации:

```
npx eslint --init
```

Этот мастер задаст вам вопросы об используемом фреймворке (выберите Vue), стиле (например, Airbnb, Stantdard или собственный), формате конфигурации и предпочтениях.

## Конфигурация ESLint для Vue

Файл конфигурации ESLint — это сердце настройки. Обычно он называется `.eslintrc.js` или `.eslintrc.json` и находится в корне проекта. Давайте рассмотрим пример и поясним ключевые параметры.

### Пример базовой конфигурации

```js
// .eslintrc.js
module.exports = {
  root: true, // Означает, что ESLint не будет искать настройки выше по дереву каталогов
  env: {
    node: true, // Включает глобальные переменные Node.js
  },
  extends: [
    'plugin:vue/vue3-essential', // Использует базовые правила для Vue 3
    'eslint:recommended',        // Рекомендуемые правила от ESLint
  ],
  parserOptions: {
    ecmaVersion: 2020, // Позволяет использовать современный JS
  },
  rules: {
    // Свои правила — можно переопределить стандартные
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // В проде предупреждать об использовании console
    'vue/no-unused-vars': 'error', // Ошибка если есть неиспользуемые переменные во Vue
    'indent': ['error', 2], // Требуется отступ в 2 пробела
    'quotes': ['error', 'single'], // Только одинарные кавычки
    'semi': ['error', 'always'], // Всегда ставить точку с запятой
  },
};
```

Смотрите, этот конфиг делает код унифицированным буквально с первых строчек!

#### Разъяснения к основным параметрам конфигурации

- **root** — препятствует поиску других конфигов выше по папкам. Это удобно для монорепозиториев.
- **env** — подсказывает ESLint, какие глобальные переменные доступны (браузер, node и т.д.).
- **extends** — включает готовые наборы правил для Vue и JavaScript.
- **parserOptions** — настраивает парсер для поддержки последних возможностей языка.
- **rules** — здесь вы задаёте индивидуальные правила и их уровень (off, warn, error).

### Подключение популярных наборов правил и стилей

Для Vue существует несколько пресетов. Например, вы можете выбрать:
- `plugin:vue/vue3-recommended` — рекомендует более строгие стандарты для Vue 3
- `plugin:vue/vue3-strongly-recommended` — включает еще больше проверок
- `@vue/eslint-config-airbnb` — конфиг на основании Airbnb

Установка — как обычного npm-пакета:

```
npm install --save-dev @vue/eslint-config-airbnb
```

И добавьте в `.eslintrc.js`:

```js
extends: [
  'plugin:vue/vue3-essential',
  'eslint:recommended',
  '@vue/airbnb'
],
```

### Пример конфигурации с кастомной настройкой для проекта

Иногда вы захотите добавить собственные правила:

```js
rules: {
  'vue/html-indent': ['error', 2],      // Отступ внутри тегов <template>
  'vue/max-attributes-per-line': ['error', {
    singleline: 3,                      // В строке не более 3 атрибутов
    multiline: 1,                       // В многострочном режиме — один атрибут на строку
  }],
  'no-param-reassign': 'off',           // Нужно, чтобы разрешить изменение аргументов
  'vue/multi-word-component-names': 'off', // Можно использовать односоставные имена компонентов
}
```

## Проверка и форматирование кода

Использование ESLint полезно не только через ручную команду, но и как часть процесса разработки — например, при каждом сохранении или перед коммитом.

### Проверка кода вручную

Вы можете запустить проверку командой:

```
npx eslint --ext .js,.vue src/
```

Заметьте, что мы указываем расширения .js и .vue, потому что Vue-компоненты обычно живут в файлах с расширением .vue.

### Автоматическое исправление ошибок

Часто ошибки можно исправить автоматически:

```
npx eslint --ext .js,.vue src/ --fix
```

Этот флаг попытается привести код к стандарту, исправляя отступы, пробелы, кавычки и даже переупорядочивая некоторые конструкции там, где это возможно.

## Интеграция с редакторами кода

Чтобы ESLint всегда оставался у вас под рукой, очень удобно интегрировать его с вашим редактором кода.

### ESLint + VSCode

1. Откройте Marketplace в VSCode
2. Найдите и установите расширение ESLint.
3. В настройках убедитесь, что опция `"eslint.validate"` включает оба типа файлов:
    ```json
    "eslint.validate": [
      "javascript",
      "vue"
    ]
    ```
4. После этого ошибки будут подсвечиваться прямо во время набора кода.

### ESLint + WebStorm

WebStorm автоматически определяет конфигурации ESLint. Если что-то не работает:
- Перейдите в *Preferences → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint*
- Включите "Automatic ESLint Configuration" или укажите путь к вашему конфигу.

## Интеграция ESLint с git-хуками (lint-staged + husky)

Вы можете настроить запуск ESLint перед каждым коммитом с помощью git-хуков, чтобы случайно не закоммитить некачественный код. Это делается с помощью инструментов `husky` и `lint-staged`.

### Установка

```
npm install --save-dev husky lint-staged
```

### Инициализация Husky и настройка lint-staged

1. Инициализируйте Husky:
   ```
   npx husky install
   ```

2. Добавьте в `package.json`:

```json
"lint-staged": {
  "*.{js,vue}": [
    "eslint --fix"
  ]
}
```

3. Создайте pre-commit хук:
   ```
   npx husky add .husky/pre-commit "npx lint-staged"
   ```

Теперь перед каждым коммитом ESLint будет автоматически проверять и исправлять staged файлы с расширениями `.js` и `.vue`. Это сильно снижает вероятность попадания небрежного кода в репозиторий.

## Настройка игнорирования файлов

Иногда требуется исключить некоторые файлы и папки из проверки ESLint — временные файлы, сборочные папки, сторонние библиотеки. Вы можете описать их в `.eslintignore`.

Пример `.eslintignore`:

```
node_modules/
dist/
public/
*.min.js
```

Всё, что указано в этом файле, будет проигнорировано ESLint.

## Настройка совместимости ESLint и Prettier

Многие разработчики хотят, чтобы помимо соблюдения стиля кода и отлавливания ошибок, код автоматически форматировался по определённым правилам — для этого удобно используют Prettier.

Чтобы совместить оба инструмента (и избежать конфликтов между правилами форматирования), делайте так:

1. Установите Prettier и соответствующие плагины:

```
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

2. Добавьте Prettier в список расширяемых конфигов:

```js
extends: [
  'plugin:vue/vue3-essential',
  'eslint:recommended',
  'plugin:prettier/recommended'
],
```

3. Создайте конфиг Prettier (`.prettierrc`):

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2
}
```

Теперь ESLint и Prettier будут работать согласованно. Все конфликты между их правилами будут учтены и решены в сторону Prettier, а значит стиль кода не будет противоречивым.

Освоение лучших практик настройки ESLint поможет вам писать более чистый и поддерживаемый код. В первых 3 модулях курса [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=Nastrojka-ESLint-dlya-Vue-proektov-i-podderzhka-kachestva-koda) уже доступно бесплатное содержание — начните погружаться в мир Vue.js и ESLint прямо сейчас.

## Как поддерживать качество кода в команде

Настроить инструменты — это только полдела. Далее важно:

- Документировать ваш стиль кодирования (например, хранить пример style guide рядом с проектом)
- Согласовать правила с командой и избегать избыточной строгости (чтобы не было желания обойти чек-листы)
- Добавлять линтер в Pipelines CI/CD (например, требовать прохождение ESLint перед деплоем)
- Использовать git-хуки для локальной проверки (см. раздел выше)
- Обновлять правила по мере развития проекта и появления новых best-practices

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как добавить свои собственные правила для отдельных файлов или папок?

Для этого используйте ключ `overrides` в конфиге ESLint:

```js
overrides: [
  {
    files: ['src/components/**/*.vue'],
    rules: {
      'vue/max-attributes-per-line': ['warn', { singleline: 5 }],
    },
  },
],
```
Это позволит вам сделать отдельные настройки для выбранных директорий.

### Как вывести список всех нарушений стиля (в том числе предупреждения)?

Выполните команду:

```
npx eslint src/ --max-warnings=0
```
Если количество предупреждений больше нуля — eslint завершится с ошибкой.

### Почему lint не работает с файлами .vue?

Убедитесь, что установлен пакет `eslint-plugin-vue`, а также что в правило `eslint.validate` в настройках редактора добавлен тип файлов `"vue"`. Проверьте `"parserOptions"` (например, нужен парсер `@babel/eslint-parser` при использовании некоторых синтаксисов).

### Как отключить конкретное правило в одном файле?

В начале файла добавьте комментарий:

```js
/* eslint-disable no-console */
console.log('Этот console.log не вызовет ошибку');
```
Или для одной строки:
```js
console.log('test'); // eslint-disable-line no-console
```

### Как настроить ESLint на работу с TypeScript в Vue?

Установите `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` и `'plugin:@typescript-eslint/recommended'` в `extends`. Также включите соответствующий парсер в `parserOptions`.

