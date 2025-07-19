---
metaTitle: Как собрать TypeScript проект с Rollup
metaDescription: Узнайте как настроить сборку TypeScript проекта с помощью Rollup - пошаговый гайд по конфигурированию, плагинам, транспиляции и оптимизации
author: Олег Марков
title: Как собрать TypeScript проект с Rollup
preview: Сборка TypeScript проекта с помощью Rollup - настройка, транспиляция, подключение плагинов и оптимизация финального бандла простыми инструкциями
---

## Введение

TypeScript укрепился как стандарт для современного JavaScript-разработчика. Он помогает писать более надежный, масштабируемый код благодаря строгой типизации. Однако, чтобы превратить TypeScript-код в работающие в браузере или на сервере JS-файлы, нужна сборка — именно здесь на сцену выходит Rollup.

Rollup — популярный инструмент для сборки JavaScript и TypeScript, который позволяет создавать оптимизированные и компактные бандлы. Он прекрасно подходит для библиотек и конечных приложений, обеспечивает tree-shaking (удаляет неиспользуемый код), легко расширяется через плагины.

В этой статье я подробно объясню, как собрать TypeScript проект с помощью Rollup. Разберем пошаговую настройку, подключение необходимых плагинов, конфигурирование сборщика и варианты оптимизации проекта.

## Почему именно Rollup для TypeScript

Давайте немного теории. Rollup отлично показывает себя в следующих сценариях:

- Сборка библиотек, где важна минимизация веса.
- Проекты, использующие ES-модули.
- Уверенное поддержание tree-shaking для TypeScript/JavaScript.
- Гибкость через обширную экосистему плагинов.

Rollup по умолчанию не умеет собирать TypeScript, но существуют плагины, которые легко закрывают этот вопрос. Ниже — как все это реализовать руками.

Сборка TypeScript проекта с использованием Rollup позволяет оптимизировать финальный бандл, удаляя неиспользуемый код и улучшая производительность. Понимание конфигурации Rollup, плагинов и процессов транспиляции критически важно для создания эффективных веб-приложений. Если вы хотите освоить все этапы разработки на TypeScript, от настройки окружения до сборки проекта — приходите на наш большой курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=Kak_sobrat_TypeScript_proekt_s_Rollup). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Установка необходимых пакетов

Первым шагом мы подготовим среду: установим Rollup, плагины и TypeScript.

### Инициализация проекта

Создайте новую папку для проекта и проинициализируйте npm:

```sh
mkdir my-ts-rollup-project
cd my-ts-rollup-project
npm init -y
```

### Установка зависимостей

Вам понадобятся основные пакеты:

- `rollup` — сам сборщик.
- `typescript` — язык программирования.
- `@rollup/plugin-typescript` — плагин для поддержки TypeScript.
- `rollup-plugin-terser` — для минификации (не обязательно, но пригодится).
- `@types/node` — типы Node.js (полезны, если вы используете импорты Node или работаете с Node модулями).

Команда установки:

```sh
npm install --save-dev rollup typescript @rollup/plugin-typescript rollup-plugin-terser @types/node
```

## Настройка TypeScript

Чтобы сборка проходила корректно, нужен tsconfig.json. Его можно сгенерировать, выполнив:

```sh
npx tsc --init
```

Это создаст tsconfig.json с базовыми настройками. Вот пример конфигурации для проекта с Rollup:

```json
{
  "compilerOptions": {
    "target": "ES2017",           // Конечная версия JS. Можно менять под свой проект
    "module": "ESNext",           // Для правильной работы с ES-модулями Rollup
    "declaration": true,          // Генерировать .d.ts-файлы (если делаете библиотеку)
    "sourceMap": true,            // Удобно для дебага
    "outDir": "dist",             // Каталог для скомпилированных файлов
    "strict": true,               // Включить строгую типизацию
    "esModuleInterop": true,      // Для поддержки импортов из CommonJS
    "skipLibCheck": true          // Немного ускоряет компиляцию
  },
  "include": ["src"],             // Какие папки/файлы компилировать
  "exclude": ["node_modules", "dist"]
}
```

Пояснение:
- `"module": "ESNext"` — ключевой параметр. Rollup работает с ES-модулями, не используйте здесь CommonJS, иначе tree-shaking будет невозможен.
- `"declaration": true` — если вы планируете распространять собственную библиотеку, генерируйте объявления типов.

## Структура исходников

Перед тем как двигаться дальше, вот базовый пример структуры проекта:

```
my-ts-rollup-project/
├── dist/        // Сюда будет собираться итоговый код
├── src/         // Исходники (TypeScript)
│   └── index.ts
├── package.json
├── tsconfig.json
└── rollup.config.js
```

В папке `src` создайте `index.ts` — это входная точка вашего проекта.

Пример src/index.ts:

```ts
export function greet(name: string): string {
  return `Привет, ${name}!`; // Простая функция приветствия
}
```

## Настройка Rollup

Теперь переходим к основному — конфигурации Rollup. Она обычно находится в файле `rollup.config.js` в корне проекта.

Вот базовый пример рабочего rollup.config.js с комментариями:

```js
import typescript from '@rollup/plugin-typescript'; // Плагин для TypeScript
import { terser } from 'rollup-plugin-terser';      // Для минификации

export default {
  input: 'src/index.ts',         // Входная точка
  output: [
    {
      file: 'dist/bundle.cjs.js',
      format: 'cjs',             // CommonJS для Node
      sourcemap: true
    },
    {
      file: 'dist/bundle.esm.js',
      format: 'es',              // ES-модули для современных сборщиков/браузеров
      sourcemap: true
    }
  ],
  plugins: [
    typescript({                 // Используем конфиг tsconfig.json
      tsconfig: "./tsconfig.json"
    }),
    terser()                     // Минифицируем исходный код
  ]
};
```

Что здесь происходит:

- Входная точка — ваш TypeScript-файл `src/index.ts`.
- Выход — два формата: CommonJS (`.cjs.js`) и ES-модули (`.esm.js`).
- Подключение TypeScript-плагина автоматически транслирует .ts-файлы в JS.
- Terser минифицирует выходной JS. Можно не добавлять, если минификация не нужна.

Если хотите только для ES-модулей или CommonJS — уберите лишнее из `output`.

## Сборка проекта

Запускается сборка очень просто:

```sh
npx rollup -c
```

- `-c` — это сокращение для использования конфигурационного файла rollup.config.js.

В папке `dist` вы получите итоговые файлы. Если открывать их в редакторе, увидите скомпилированный и минифицированный JavaScript-код, а если указали `"declaration": true` в `tsconfig.json`, то и `.d.ts` файлы с описаниями типов.

## Дополнительные опции и плагины

### Путь к файлам, alias и externals

Если используете alias-импорты, удобно подключить плагин-алиас:

```sh
npm install --save-dev @rollup/plugin-alias
```

Пример настройки:

```js
import alias from '@rollup/plugin-alias';

plugins: [
  alias({
    entries: [
      { find: '@utils', replacement: './src/utils' }
    ]
  }),
  // далее остальные плагины…
]
```

### Исключение зависимостей из бандла

Чтобы не включать, например, зависимости из node_modules в итоговый бандл (для библиотек), рекомендуют использовать плагин `@rollup/plugin-node-resolve` и свойство `external`.

```sh
npm install --save-dev @rollup/plugin-node-resolve
```

Пример добавления externals:

```js
import resolve from '@rollup/plugin-node-resolve';

export default {
  //...
  external: ['lodash'],             // lodash не попадет в бандл
  plugins: [
    resolve(),
    // остальные плагины…
  ]
}
```

Такой подход удобен для получения более легких библиотек.

### Многовходные точки (Multi-entry)

Если у вас несколько точек входа, используйте массив или объект с ключами:

```js
export default {
  input: {
    main: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  // ...
}
```

Каждый входной файл даст отдельный скомпилированный выходной модуль.

### Генерация только `.d.ts`

Если нужно распределять типы отдельно, советую использовать отдельный пакет, например [rollup-plugin-dts](https://github.com/Swatinem/rollup-plugin-dts):

```sh
npm install --save-dev rollup-plugin-dts
```

Пример конфига для типов:

```js
import dts from "rollup-plugin-dts";

export default {
  input: "dist/types/index.d.ts",
  output: [{ file: "dist/index.d.ts", format: "es" }],
  plugins: [dts()],
};
```

Этот шаг делают после компиляции исходного кода (часто как отдельную npm-скрипт-команду).

## Интеграция с React и другими библиотеками

Если вы пишете React-компоненты, ваш TypeScript-код часто будет содержать jsx-элементы. В этом случае в tsconfig.json указывайте:

```json
"jsx": "react-jsx"
```

или

```json
"jsx": "react"
```

И убедитесь, что расширения файлов — `.tsx`.

В Rollup конфиге ничего менять не нужно: TypeScript-плагин сам обрабатывает .tsx-файлы.

## Настройка npm-скриптов

После ручных запусков стоит добавить команды для сборки в package.json:

```json
"scripts": {
  "build": "rollup -c",
  "build:types": "tsc --emitDeclarationOnly"
}
```

Теперь можно запускать сборку через:

```sh
npm run build
```

## Загрузка и тестирование итоговой сборки

Когда всё собрано, проверьте, как это работает на практике — импортируйте ваш модуль в небольшой JS-файл или даже в Node REPL. Удостоверьтесь, что все функции работают, типы корректно подтягиваются (если поддерживаете TypeScript).

## Решение распространённых проблем

### Ошибка "Unexpected token" или "Rollup does not handle .ts"

Скорее всего, вы забыли подключить TypeScript-плагин в Rollup. Убедитесь, что он есть в разделе `plugins` вашего rollup.config.js.

### Не собираются type-декларации

Rollup по умолчанию не трогает .d.ts-файлы. Используйте `tsc` с флагом `--declaration`, либо rollup-plugin-dts, как выше.

### Сторонние модули не подхватываются

Добавьте `@rollup/plugin-node-resolve`, а если нужны CommonJS-пакеты — и `@rollup/plugin-commonjs`.

### Tree-shaking не работает

Проверьте, что экспортируете только необходимые функции, а не весь модуль сразу. Удостоверьтесь, что сборка идет с format: 'es'.

## Заключение

Сборка TypeScript проектов с помощью Rollup — гибкий, настраиваемый и эффективный способ получить компактный, современный бандл. Rollup требуется правильно сконфигурировать, добавить плагины для поддержки TypeScript, настроить входные и выходные точки. В этой статье вы получили обзор ключевых шагов, от инициализации проекта до оптимизации сборки, что позволяет быстро стартовать и использовать Rollup на полную мощность для вашего TypeScript-кода.

----

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как собрать TypeScript-проект с Rollup так, чтобы итоговая папка dist содержала только финальные JS и .d.ts файлы?**

Сначала настройте "outDir": "dist" и "declaration": true в tsconfig.json. Сборку делаете через rollup, а типы отдельно через `tsc --emitDeclarationOnly`. Используйте npm-скрипты:
```json
"scripts": {
  "build": "rollup -c",
  "build:types": "tsc --emitDeclarationOnly"
}
```
Если хотите обработать типы через rollup, используйте `rollup-plugin-dts`.

**2. Как сделать так, чтобы Rollup автоматически следил за изменениями файлов и пересобирал проект?**

Добавьте ключ `--watch` к команде Rollup:
```
npx rollup -c --watch
```
Или добавьте в package.json скрипт: `"watch": "rollup -c --watch"`

**3. Как исключить node_modules из итогового файла?**

Добавьте свойство `external` в rollup.config.js:
```js
export default {
  //...
  external: id => /node_modules/.test(id)
}
```
И используйте `@rollup/plugin-node-resolve` для корректной сборки зависимостей.

**4. Почему Tree-shaking не работает с некоторыми библиотеками?**

Они могут поставляться в CommonJS-формате. Tree-shaking с CommonJS невозможен. Обычно помогает использование ES-версии библиотеки (например, через import из 'lodash-es' вместо 'lodash').

**5. Как подключить dotenv или переменные среды при сборке Rollup?**

Поставьте пакет `rollup-plugin-dotenv` или используйте `@rollup/plugin-replace`:
```js
import replace from '@rollup/plugin-replace';

plugins: [
  replace({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  })
]
```
Это внедрит значения переменных окружения в итоговый код.

Сборка проекта — это завершающий этап разработки, но чтобы до него дойти, необходимо освоить множество других концепций TypeScript. На нашем курсе [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=Kak_sobrat_TypeScript_proekt_s_Rollup) вы получите все необходимые знания и навыки. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
