---
metaTitle: "Анализ и оптимизация бандла в Next.js"
metaDescription: "Как уменьшить размер бандла в Next.js: bundle analyzer, динамические импорты, tree shaking, оптимизация зависимостей. Практическое руководство."
author: "Антон Ларичев"
title: "Next.js — анализ и оптимизация бандла"
preview: "Разбираем инструменты анализа бандла в Next.js и конкретные техники его оптимизации: динамические импорты, tree shaking, замена тяжёлых библиотек."
---

## Зачем анализировать бандл

Размер JavaScript-бандла напрямую влияет на время загрузки приложения. Браузер должен загрузить, разобрать и выполнить весь JavaScript до того, как страница станет интерактивной — этот показатель называется Time to Interactive (TTI). Даже при быстром соединении бандл в 1 МБ увеличивает TTI на несколько секунд на мобильных устройствах.

Next.js автоматически применяет многие оптимизации: разделение кода по страницам, оптимизацию изображений, серверный рендеринг. Но приложение всё равно может страдать от лишних зависимостей, дублированного кода и неправильно импортированных библиотек. Анализ бандла позволяет найти узкие места и устранить их.

## Подключение Bundle Analyzer

Официальный инструмент для анализа бандла в Next.js — пакет `@next/bundle-analyzer`. Он строит интерактивную карту модулей на основе данных Webpack.

```bash
npm install --save-dev @next/bundle-analyzer
```

Настройка в `next.config.js`:

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ваши настройки
}

module.exports = withBundleAnalyzer(nextConfig)
```

Добавьте скрипт в `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "analyze": "ANALYZE=true next build"
  }
}
```

На Windows используйте `cross-env`:

```bash
npm install --save-dev cross-env
```

```json
{
  "scripts": {
    "analyze": "cross-env ANALYZE=true next build"
  }
}
```

Запустите анализ:

```bash
npm run analyze
```

После сборки автоматически откроются две страницы в браузере: карта клиентского бандла и серверного бандла. Каждый прямоугольник — это модуль, его размер пропорционален занимаемому объёму.

## Чтение результатов анализа

На карте бандла ищите:

- **Неожиданно большие блоки** — библиотека занимает 200–300 КБ там, где ожидалось 10–20 КБ. Это сигнал, что она подтягивает весь свой код, хотя используется лишь часть.
- **Дублирующиеся модули** — один и тот же пакет встречается несколько раз в разных чанках. Это происходит, когда разные части приложения импортируют несовместимые версии одной библиотеки.
- **Библиотеки в неправильных чанках** — серверный код попал в клиентский бандл или утилита, нужная только на одной странице, присутствует на всех страницах.

Обратите внимание на вкладку `node_modules` в анализаторе — она показывает сторонние зависимости отдельно от вашего кода. Это удобная отправная точка для поиска лишнего веса.

## Динамические импорты

Next.js поддерживает динамические импорты через `next/dynamic` — это основной инструмент разделения кода на уровне компонентов. Компонент загружается только тогда, когда он действительно нужен.

```typescript
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('../components/HeavyChart'), {
  loading: () => <p>Загрузка графика...</p>,
  ssr: false,
})

export default function DashboardPage() {
  return (
    <main>
      <h1>Дашборд</h1>
      <HeavyChart />
    </main>
  )
}
```

Параметр `ssr: false` отключает серверный рендеринг для компонента. Это обязательно для библиотек, которые обращаются к `window` или `document` — они не существуют на сервере.

### Динамический импорт с условием

Часто тяжёлые компоненты нужны только при определённом действии пользователя. Загружайте их по требованию:

```typescript
import { useState } from 'react'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('../components/RichTextEditor'), {
  ssr: false,
})

export default function ArticleEditor() {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div>
      {!isEditing && (
        <button onClick={() => setIsEditing(true)}>Редактировать</button>
      )}
      {isEditing && <RichTextEditor />}
    </div>
  )
}
```

Пока пользователь не нажмёт кнопку, бандл редактора не загружается. Это особенно эффективно для визуальных редакторов, PDF-генераторов, карт и графиков.

### Динамический импорт библиотек

Динамические импорты работают не только для React-компонентов:

```typescript
export async function generatePdf(data: ReportData) {
  // jsPDF загружается только при вызове этой функции
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  doc.text(data.title, 10, 10)
  return doc.output('blob')
}
```

## Tree Shaking — встряхивание дерева

Tree shaking удаляет неиспользуемый код при сборке. Webpack, который использует Next.js, поддерживает его из коробки, но для работы нужно соблюдать несколько условий.

### Именованные импорты вместо импорта всего модуля

Плохо:

```typescript
import _ from 'lodash'

const result = _.groupBy(items, 'category')
```

Это импортирует весь lodash (~70 КБ), хотя нужна одна функция.

Хорошо:

```typescript
import { groupBy } from 'lodash-es'

const result = groupBy(items, 'category')
```

`lodash-es` — это версия lodash с ES-модулями, которая поддерживает tree shaking. Альтернатива — импортировать функцию напрямую:

```typescript
import groupBy from 'lodash/groupBy'
```

### Проверка поддержки ESM в библиотеке

Tree shaking работает только с ES-модулями. Проверьте, есть ли в `package.json` библиотеки поле `module` или `exports`:

```json
{
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js"
    }
  }
}
```

Если библиотека поставляет только CommonJS (`main`), tree shaking не сработает — Webpack включит весь модуль.

### Директива sideEffects

Чтобы помочь Webpack понять, что ваш код можно встряхивать, добавьте в `package.json` собственного пакета или монорепо:

```json
{
  "sideEffects": false
}
```

Или укажите конкретные файлы с побочными эффектами (например, файлы со стилями):

```json
{
  "sideEffects": ["*.css", "./src/polyfills.js"]
}
```

## Оптимизация конкретных библиотек

### Date-fns

Before:

```typescript
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
```

`date-fns` v3 поддерживает tree shaking нативно — такой импорт уже оптимален.

### Moment.js — замена на альтернативу

Moment.js весит около 330 КБ и не поддерживает tree shaking. Замените его на `date-fns` или `dayjs`:

```typescript
// Вместо Moment.js (330 КБ)
import moment from 'moment'
const formatted = moment(date).format('DD.MM.YYYY')

// Day.js (2 КБ)
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
dayjs.locale('ru')
const formatted = dayjs(date).format('DD.MM.YYYY')
```

### Иконочные библиотеки

Библиотеки иконок — один из главных источников раздутых бандлов.

Плохо:

```typescript
import { FaHome, FaUser } from 'react-icons/fa'
```

Этот импорт может затянуть всю коллекцию FontAwesome. Проверьте, что ваша версия `react-icons` поддерживает tree shaking — начиная с v4 она это делает.

Если бандл всё равно велик, импортируйте иконки напрямую:

```typescript
import FaHome from 'react-icons/fa/FaHome'
import FaUser from 'react-icons/fa/FaUser'
```

### Material UI

MUI v5 поддерживает tree shaking при правильном импорте:

```typescript
// Правильно
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

// Менее оптимально (но тоже работает с tree shaking в v5)
import { Button, TextField } from '@mui/material'
```

## Анализ через встроенный инструмент Next.js

Начиная с Next.js 13, в dev-режиме доступна страница `/_next/static/chunks/` для просмотра чанков. Но более полезен вывод в терминале при сборке:

```bash
next build
```

Next.js выводит таблицу с размерами всех страниц и их чанков. Обратите внимание на колонку `First Load JS` — это объём JavaScript, который загружается при первом посещении страницы. Хорошим показателем считается значение до 100 КБ.

Если страница выделена жёлтым или красным цветом — это сигнал тревоги. Жёлтый: 128–256 КБ. Красный: больше 256 КБ.

## Настройка splitChunks

В большинстве случаев стратегия разбивки чанков по умолчанию в Next.js оптимальна. Но если несколько страниц делят одну тяжёлую зависимость, её стоит вынести в общий чанк явно:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Тяжёлые зависимости — в отдельный чанк
          vendors: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Общие компоненты вашего приложения
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 5,
          },
        },
      }
    }
    return config
  },
}

module.exports = nextConfig
```

Будьте осторожны с ручной настройкой `splitChunks` — неправильная конфигурация может привести к обратному эффекту и увеличить количество сетевых запросов.

## Контроль размера бандла в CI

Автоматизируйте контроль за размером бандла с помощью `bundlewatch`:

```bash
npm install --save-dev bundlewatch
```

```json
{
  "bundlewatch": {
    "files": [
      {
        "path": ".next/static/chunks/*.js",
        "maxSize": "100 kB"
      },
      {
        "path": ".next/static/chunks/pages/*.js",
        "maxSize": "50 kB"
      }
    ]
  }
}
```

Или используйте GitHub Action `preactjs/compressed-size-action`, который автоматически комментирует pull-request с информацией об изменении размера бандла.

## Аудит зависимостей

Перед оптимизацией полезно понять, откуда берутся крупные зависимости. Инструмент `cost-of-modules` показывает размер каждого пакета:

```bash
npx cost-of-modules --yarn
```

А `package-phobia` или `bundlephobia.com` позволяют проверить вес пакета до его установки.

Для поиска дублирующихся зависимостей:

```bash
npx npm-dedupe-check
# или
npm ls <package-name>
```

Если один пакет присутствует в нескольких версиях, попробуйте принудительно зафиксировать версию через `resolutions` в `package.json` (для Yarn) или `overrides` для npm:

```json
{
  "overrides": {
    "some-package": "^2.0.0"
  }
}
```

## Практический чеклист оптимизации

Последовательность действий при работе с большим бандлом:

1. Запустите `npm run analyze` и найдите три самых крупных модуля.
2. Проверьте, используется ли каждый из них полностью или только частично.
3. Для частично используемых библиотек перейдите на именованные импорты или найдите более лёгкую альтернативу.
4. Компоненты, которые не нужны при первом рендере, оберните в `dynamic()`.
5. Убедитесь, что серверный код не попадает в клиентский бандл.
6. Повторно запустите `npm run analyze` и сравните результат.
7. Проверьте вывод `next build` — все страницы должны быть зелёными.

Стандартная оптимизация по этому чеклисту позволяет сократить бандл на 30–60% в большинстве реальных проектов.

---

Чтобы глубже погрузиться в Next.js и научиться строить высокопроизводительные приложения с нуля, пройдите курс на PurpleSchool: [Next.js — полный курс](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-bundle-optimization)