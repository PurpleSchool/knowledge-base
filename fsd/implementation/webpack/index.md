---
metaTitle: Конфигурация Webpack webpack-config для современных фронтенд проектов
metaDescription: Разбор настройки Webpack webpack-config - от базовой конфигурации до оптимизации сборки кода и работы с ассетами
author: Олег Марков
title: Конфигурация Webpack webpack-config - практическое руководство
preview: Подробно разбираем конфигурацию Webpack webpack-config - как устроен файл настроек какие ключевые поля используются и как собрать удобный и расширяемый конфиг
---

## Введение

Webpack часто называют сборщиком модулей. На практике это означает, что вы описываете в конфигурации, как ваш проект нужно собрать, а Webpack по этим правилам превращает исходный код, стили и изображения в оптимизированный бандл для браузера.

Давайте разберемся, как устроен webpack-config, что в нем обязательно должно быть и как шаг за шагом превратить минимальный конфиг в гибкую систему, которую удобно поддерживать в реальном проекте.

## Что такое webpack.config.js и как он подключается

Webpack по умолчанию ищет файл конфигурации с названием:

- webpack.config.js
- webpack.config.cjs
- webpack.config.mjs
- или файл, указанный через параметр командной строки `--config`

Если вы запускаете:

```bash
npx webpack
```

и в корне проекта лежит webpack.config.js, Webpack автоматически возьмет настройки из этого файла.

Типичный минимальный конфиг выглядит так:

```js
// webpack.config.js

// Модуль path нужен для корректной работы с путями к файлам
const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  // Точка входа приложения
  entry: './src/index.js',

  // Настройки вывода собранных файлов
  output: {
    // Абсолютный путь к папке для сборки
    path: path.resolve(__dirname, 'dist'),
    // Имя результирующего файла
    filename: 'bundle.js'
  },

  // Режим сборки - влияет на оптимизацию и служебный код
  mode: 'development'
};
```

Смотрите, здесь вы уже видите три ключевых элемента: `entry`, `output` и `mode`. На них и построена вся логика сборки.

## Поле entry – откуда начинается сборка

### Один входной файл

Поле `entry` говорит Webpack, с какого файла начинать анализ зависимостей.

```js
module.exports = {
  entry: './src/index.js',
  // ...
};
```

Здесь Webpack возьмет `./src/index.js` как корень графа зависимостей, найдет все `import` и `require`, и включит их в итоговый бандл.

### Несколько точек входа

В реальных проектах часто нужны несколько независимых бандлов, например для разных страниц.

```js
module.exports = {
  entry: {
    main: './src/index.js',       // Главный бандл
    admin: './src/admin.js'       // Бандл для админки
  },
  output: {
    // [name] будет заменен на название ключа из entry
    filename: '[name].bundle.js'
  },
  mode: 'development'
};
```

Теперь Webpack соберет два файла:

- main.bundle.js
- admin.bundle.js

Если вы посмотрите на эту схему, то становится понятно, что объект в `entry` фактически задает "имена" будущих бандлов.

### Расширенные варианты entry

Можно использовать массивы, если вам нужно подключить, например, полифилы:

```js
module.exports = {
  entry: {
    main: [
      './src/polyfills.js', // Полифилы
      './src/index.js'      // Основной код
    ]
  },
  // ...
};
```

Webpack соберет один бандл, в который сначала попадут polyfills, а потом основной код.

## Поле output – куда и как складывать результат

### Базовые настройки output

`output` описывает, где окажутся результаты сборки.

```js
const path = require('path');

module.exports = {
  // ...
  output: {
    path: path.resolve(__dirname, 'dist'), // Папка для сборки
    filename: 'bundle.js'                  // Имя файла
  }
};
```

Важно, чтобы `path` был абсолютным путем, поэтому чаще всего используют `path.resolve`.

### Шаблоны имен файлов

Webpack поддерживает плейсхолдеры:

- `[name]` – имя точки входа
- `[contenthash]` – хэш содержимого файла (для кэширования)
- `[chunkhash]` – хэш чанка
- `[id]` – идентификатор чанка

Давайте разберемся на примере:

```js
module.exports = {
  entry: {
    main: './src/index.js',
    admin: './src/admin.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    // Для каждого entry будет свой файл
    filename: '[name].[contenthash].js', 
    clean: true // Очищает папку dist перед каждой сборкой
  },
  mode: 'production'
};
```

Как видите, Webpack создаст файлы с уникальными именами вида:

- main.2f3a1c9d.js
- admin.45aa8f01.js

При изменении содержимого меняется и хэш. Это удобно для кеширования в браузере.

### Дополнительные поля output

Полезные настройки:

```js
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: '[name].[contenthash].js',

  publicPath: '/', 
  // Здесь вы задаете базовый путь, по которому будут доступны файлы на сервере

  assetModuleFilename: 'assets/[hash][ext][query]'
  // Шаблон для файлов, обработанных через asset-модули
}
```

`publicPath` особенно важен, если у вас SPA с history API или файлы лежат не в корне домена.

## Поле mode – development, production и none

`mode` переключает набор встроенных оптимизаций и дефолтных настроек.

```js
module.exports = {
  // ...
  mode: 'development'
};
```

Основные режимы:

- development  
  - включены удобные имена модулей
  - не минифицируются файлы
  - включен полезный сервисный код для отладки
- production  
  - включена минификация
  - удаляется мертвый код (tree shaking)
  - включены различные оптимизации для размера и скорости
- none  
  - вообще без дополнительных оптимизаций

Часто удобно использовать разные конфиги для dev и prod. Чуть позже я покажу, как это организовать.

## module.rules – работа с файлами и загрузчиками (loaders)

Webpack сам по себе "понимает" только JavaScript и JSON. Все остальное (CSS, картинки, TypeScript, JSX) обрабатывается через загрузчики.

### Общая структура rules

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.js$/,           // Условие - какие файлы обрабатывать
        exclude: /node_modules/, // Исключения
        use: 'babel-loader'      // Какой загрузчик применять
      }
    ]
  }
};
```

Смотрите, `rules` – это массив объектов. Каждый объект описывает:

- какие файлы нужно поймать (test, include, exclude)
- какими лоадерами их обрабатывать (`use`)

### Пример – работа с JavaScript и Babel

Если вам нужно поддерживать старые браузеры, вы подключаете Babel.

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.m?js$/,           // Обрабатываем .js и .mjs
        exclude: /node_modules/,   // Не трогаем зависимости
        use: {
          loader: 'babel-loader',  // Лоадер
          options: {
            // Здесь вы можете задать пресеты
            presets: [
              ['@babel/preset-env', {
                // Настройка целевых браузеров
                targets: '> 0.25%, not dead'
              }]
            ]
          }
        }
      }
    ]
  }
};
```

Комментариями вы можете для себя пояснить, почему выбраны те или иные настройки, чтобы другим было легче понять конфигурацию.

### Пример – CSS, style-loader и css-loader

CSS обрабатывается цепочкой загрузчиков: один читает файлы, другой внедряет их в DOM.

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.css$/,            // Все файлы .css
        use: [
          'style-loader',          // Встраивает стили в DOM через тег <style>
          'css-loader'             // Позволяет импортировать CSS в JS
        ]
      }
    ]
  }
};
```

Важно, что порядок `use` идет справа налево: сначала `css-loader`, затем `style-loader`.

### Пример – SASS/SCSS

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(scss|sass)$/,      // Файлы .scss и .sass
        use: [
          'style-loader',            // Встраиваем стили в DOM
          'css-loader',              // Интерпретируем @import и url()
          'sass-loader'              // Компилируем SCSS в CSS
        ]
      }
    ]
  }
};
```

Здесь я выстраиваю цепочку так, чтобы на вход в sass-loader попадал исходный SCSS код, а на выходе в style-loader – уже готовый CSS.

### Пример – изображения и asset-модули

C Webpack 5 появились встроенные asset-модули, и в большинстве случаев можно не использовать file-loader и url-loader.

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/i, // Картинки
        type: 'asset',                   // Автоматический выбор - inline или файл
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024            // Файлы до 8 KB зашиваются в код как base64
          }
        }
      }
    ]
  }
};
```

Как видите, один тип asset уже позволяет решить сразу несколько задач: мелкие картинки инлайнить, большие – складывать в файлы.

Другие варианты `type`:

- asset/resource – всегда файл
- asset/inline – всегда data URL (base64)
- asset/source – сырое содержимое (например, для текстовых файлов)

## resolve – как Webpack ищет модули

`resolve` управляет тем, как Webpack обрабатывает `import` и `require`.

### Расширения по умолчанию

```js
module.exports = {
  // ...
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'] 
    // Список расширений, которые подставляются автоматически
  }
};
```

Теперь вы можете писать:

```js
// Вместо './App.jsx' можно просто './App'
import App from './App';
```

### Алиасы путей

Чтобы не писать длинные относительные пути, удобно использовать alias.

```js
const path = require('path');

module.exports = {
  // ...
  resolve: {
    alias: {
      // Теперь вы можете импортировать из '@components/Button'
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  }
};
```

Покажу, как это выглядит в коде:

```js
// Вместо '../../../components/Button'
import Button from '@components/Button';

// Вместо '../../utils/helpers'
import { formatDate } from '@utils/date';
```

Это сильно улучшает читаемость импортов в больших проектах.

## devtool – source map для отладки

Source map связывает скомпилированный код с исходным, чтобы в браузере вы видели "настоящие" строки из своих файлов.

```js
module.exports = {
  // ...
  devtool: 'source-map'
};
```

Полезные варианты:

- `eval-cheap-module-source-map` – быстрый для разработки
- `source-map` – полный, но медленнее, чаще используют в продакшене
- `false` – без source map

Обычно делают так:

```js
module.exports = {
  // ...
  mode: 'development',
  devtool: 'eval-cheap-module-source-map'
};
```

И в прод-конфиге:

```js
module.exports = {
  // ...
  mode: 'production',
  devtool: 'source-map' // или отключить, если вам это не нужно
};
```

## plugins – расширение возможностей Webpack

Плагины позволяют делать то, чего не могут лоадеры: генерировать HTML, выносить CSS в отдельные файлы, чистить папки, анализировать бандлы и многое другое.

### Общая структура

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // ...
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Шаблон
      filename: 'index.html',          // Имя выходного файла
      inject: 'body'                   // Вставлять скрипты в конец body
    })
  ]
};
```

Смотрите, в отличие от лоадеров, плагины создаются как экземпляры классов.

### HtmlWebpackPlugin – автогенерация HTML

Частый сценарий – вы хотите, чтобы Webpack сам подключал собранные скрипты в HTML.

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Исходный HTML
      minify: false                    // В dev можно не минифицировать
    })
  ]
};
```

Теперь при каждой сборке в dist/index.html автоматически будут подставляться актуальные имена файлов с хэшами.

### MiniCssExtractPlugin – вынос CSS в отдельные файлы

В production лучше не держать стили в JS, а вынести их.

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          // В продакшене вместо style-loader используем плагин
          MiniCssExtractPlugin.loader, // Выносит CSS в отдельные файлы
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css' // Имя css-файлов
    })
  ]
};
```

Как видите, плагин работает в паре с лоадером: он перехватывает стили и складывает их в отдельный файл, а не встраивает в JS.

### DefinePlugin – передача переменных окружения в код

Чтобы использовать переменные окружения в фронтенд-коде, применяют DefinePlugin.

```js
const webpack = require('webpack');

module.exports = {
  // ...
  plugins: [
    new webpack.DefinePlugin({
      // Здесь мы определяем глобальную константу
      'process.env.API_URL': JSON.stringify(process.env.API_URL || 'https://api.dev.local')
    })
  ]
};
```

Теперь вы можете в коде писать:

```js
// Здесь мы используем переменную окружения, подставленную Webpack
const apiUrl = process.env.API_URL;
```

Webpack на этапе сборки заменит это выражение на конкретную строку.

## devServer – локальная разработка

`webpack-dev-server` поднимает локальный сервер, пересобирает проект при изменениях и может автоматически обновлять страницу.

### Базовая конфигурация devServer

```js
module.exports = {
  // ...
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist') // Папка с собранными файлами
    },
    port: 3000,          // Порт сервера
    open: true,          // Автооткрытие браузера
    hot: true,           // Горячая перезагрузка модулей (HMR)
    historyApiFallback: true 
    // Важная настройка для SPA - перенаправляет 404 на index.html
  }
};
```

Смотрите, при `hot: true` Webpack будет стараться обновлять только изменившиеся модули без полной перезагрузки страницы. Это ускоряет разработку.

### Proxy для API

Часто на dev-сервере нужно проксировать запросы к backend.

```js
module.exports = {
  // ...
  devServer: {
    // ...
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Адрес backend
        changeOrigin: true,              // Подменять Origin в запросах
        pathRewrite: { '^/api': '' }     // Удалять /api из пути
      }
    }
  }
};
```

Теперь запрос из фронтенда к /api/users уйдет на http://localhost:5000/users.

## Оптимизация – splitChunks и кэширование

### Разделение кода – splitChunks

При большой кодовой базе хорошо отделить сторонние библиотеки от вашего кода. Это позволяет браузеру кэшировать vendor-часть.

```js
module.exports = {
  // ...
  optimization: {
    splitChunks: {
      chunks: 'all', // Анализировать и синхронные, и асинхронные чанки
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/, // Все из node_modules
          name: 'vendors',               // Имя чанка
          chunks: 'all'
        }
      }
    }
  }
};
```

Давайте посмотрим, как это помогает:

- меняется ваш код – перезагружается только main.[hash].js
- библиотеки из node_modules остаются в vendors.[hash].js, и его можно кэшировать дольше

### Runtime chunk

Еще одна полезная настройка:

```js
module.exports = {
  // ...
  optimization: {
    runtimeChunk: 'single'
  }
};
```

Webpack выносит служебный код (runtime) в отдельный файл, что уменьшает количество изменений в основных чанках и улучшает кэширование.

## Разделение конфигураций на dev и prod

В одном файле неудобно держать и dev, и prod-настройки. Обычно конфиг разделяют.

Структура проекта:

- webpack.common.js – общие настройки
- webpack.dev.js – только для разработки
- webpack.prod.js – только для продакшена

### Общий конфиг (webpack.common.js)

```js
// webpack.common.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: './src/index.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true
  },

  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: 'babel-loader' // Подключаем Babel для JS
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ],

  resolve: {
    extensions: ['.js']
  }
};
```

### Dev-конфиг (webpack.dev.js)

```js
// webpack.dev.js
const { merge } = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.js');

/** @type {import('webpack').Configuration} */
module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',

  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist')
    },
    port: 3000,
    open: true,
    hot: true,
    historyApiFallback: true
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader', // В dev стили встраиваем в DOM
          'css-loader'
        ]
      }
    ]
  }
});
```

### Prod-конфиг (webpack.prod.js)

```js
// webpack.prod.js
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const common = require('./webpack.common.js');

/** @type {import('webpack').Configuration} */
module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, // В продакшене выносим стили в файлы
          'css-loader'
        ]
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    })
  ],

  optimization: {
    splitChunks: {
      chunks: 'all'
    },
    runtimeChunk: 'single'
  }
});
```

Теперь вы можете запускать:

```bash
# Сборка для разработки
npx webpack serve --config webpack.dev.js

# Сборка для продакшена
npx webpack --config webpack.prod.js
```

Смотрите, подход с разделением конфигов позволяет вам четко отделить "как мы собираем код" и "для какого окружения мы его собираем".

## Типичные практические шаблоны конфигурации

### Базовый конфиг для React-приложения

Здесь я покажу пример, который можно взять за основу для React.

```js
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: './src/index.jsx', // Точка входа с React

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    publicPath: '/'
  },

  mode: 'development',
  devtool: 'eval-cheap-module-source-map',

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,          // Поддерживаем JS и JSX
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // Здесь мы настраиваем пресеты для React
            presets: [
              '@babel/preset-react',
              '@babel/preset-env'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader', // Встраиваем стили
          'css-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset',               // Обработка картинок через asset-модули
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx']
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      title: 'React App'
    })
  ],

  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist')
    },
    historyApiFallback: true, // Для React Router
    port: 3000,
    open: true,
    hot: true
  }
};
```

Теперь вы увидите, как это выглядит в коде:

```jsx
// src/index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css'; // Импорт стилей

// Здесь мы подключаем React-приложение к DOM
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

Такой конфиг уже достаточно удобен для учебных и небольших боевых проектов.

---

## Заключение

Конфигурация Webpack – это описание того, как именно ваш проект превращается из набора исходников в итоговый бандл. Основные элементы, которые важно понимать:

- `entry` – точки входа, с которых Webpack начинает построение графа модулей
- `output` – структура и расположение итоговых файлов
- `mode` – набор дефолтных оптимизаций для dev или prod
- `module.rules` – правила обработки разных типов файлов через загрузчики
- `resolve` – как находятся модули и как упрощаются пути
- `devtool` – настройка source map для отладки
- `plugins` – расширение возможностей сборки
- `devServer` – локальная разработка с автообновлением
- `optimization` – разделение кода и улучшение кэширования

Когда вы начинаете осмысленно собирать эти части, webpack-config из непонятного файла превращается в прозрачную схему сборки, которую можно адаптировать под любые требования проекта.

Главная идея в том, чтобы конфигурация была не "магией", а описанием понятного вам процесса: какие файлы есть в проекте, как их нужно преобразовать и в каком виде вы хотите получить результат.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как передавать разные API URL для dev и prod через webpack-config

Используйте переменные окружения и DefinePlugin:

1. Установите `cross-env` для кроссплатформенной установки переменных.
2. В package.json:

```json
{
  "scripts": {
    "build:dev": "cross-env API_URL=https://dev.api.local webpack --config webpack.dev.js",
    "build:prod": "cross-env API_URL=https://api.prod.local webpack --config webpack.prod.js"
  }
}
```

3. В webpack-конфиге:

```js
const webpack = require('webpack');

plugins: [
  new webpack.DefinePlugin({
    'process.env.API_URL': JSON.stringify(process.env.API_URL)
  })
]
```

Теперь вы можете читать `process.env.API_URL` в коде.

### Как подключить TypeScript в webpack-config

1. Установите зависимости:

```bash
npm install --save-dev typescript ts-loader
```

2. Создайте tsconfig.json с нужными настройками.
3. В webpack-конфиге:

```js
module: {
  rules: [
    {
      test: /\.tsx?$/,       // Файлы .ts и .tsx
      use: 'ts-loader',
      exclude: /node_modules/
    }
  ]
},
resolve: {
  extensions: ['.ts', '.tsx', '.js']
}
```

Теперь Webpack будет собирать TypeScript-код.

### Как настроить код-сплиттинг по роутам в SPA

Используйте динамические импорты:

```js
// В React Router
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
```

В webpack-конфиге достаточно иметь базовую настройку, Webpack сам создаст отдельные чанки. Для более тонкого контроля:

```js
output: {
  // ...
  chunkFilename: '[name].[contenthash].js' // Имя для асинхронных чанков
}
```

### Как настроить абсолютные импорты из src без alias

Один из вариантов – добавить `src` в `resolve.modules`:

```js
resolve: {
  modules: [
    path.resolve(__dirname, 'src'),
    'node_modules'
  ]
}
```

Теперь вы можете писать:

```js
// Импорт из src/components/Button.jsx
import Button from 'components/Button';
```

### Как сделать, чтобы Webpack не падал при ошибках TypeScript или ESLint, а только показывал их

Для TSC:

- Используйте `fork-ts-checker-webpack-plugin` и задайте `async: true`, чтобы проверки шли параллельно и не блокировали сборку.

Для ESLint:

- Включите `eslint-webpack-plugin` с опцией `failOnWarning: false` и `failOnError: false`, чтобы ошибки не прерывали сборку, а только отображались в консоли.