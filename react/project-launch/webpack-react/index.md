---
metaTitle: Webpack и React - настройка сборщика для React проектов
metaDescription: Полное руководство по настройке Webpack для React проектов: webpack.config.js, Babel, CSS/SCSS лоадеры, HtmlWebpackPlugin, code splitting и оптимизация для production
author: Олег Марков
title: Webpack и React
preview: Узнайте как настроить Webpack для React проекта с нуля: конфигурация webpack.config.js, Babel для JSX, CSS/SCSS лоадеры, dev-server, оптимизация и code splitting для production
---

## Введение

Когда вы создаёте React-приложение, вам нужен инструмент, который соберёт десятки (а то и сотни) отдельных файлов в один оптимизированный бандл для браузера. Именно эту задачу решает **Webpack** — один из самых мощных и гибких модульных бундлеров в экосистеме JavaScript.

**Webpack** — это статический модульный бундлер для приложений на JavaScript. Он строит граф зависимостей всех модулей вашего проекта и создаёт один или несколько бандлов. Webpack умеет обрабатывать не только JavaScript, но и CSS, изображения, шрифты и другие ресурсы.

### Почему стоит изучить ручную настройку Webpack?

Многие разработчики начинают с Create React App (CRA) или Vite, которые скрывают детали конфигурации. Это удобно, но создаёт проблемы, когда нужно:

- настроить нестандартные алиасы для путей;
- добавить поддержку SVG-компонентов;
- оптимизировать бандл под конкретные требования;
- настроить Module Federation для микрофронтендов;
- интегрировать специфические плагины.

Понимание Webpack даёт вам полный контроль над процессом сборки и делает вас более компетентным разработчиком.

В этой статье вы узнаете как настроить Webpack для React-проекта с нуля, разберёте ключевые концепции конфигурации и научитесь оптимизировать сборку для production.

## Основные концепции Webpack

Прежде чем перейти к практике, давайте разберём ключевые концепции:

### Entry (точка входа)

Entry — это файл, с которого Webpack начинает строить граф зависимостей. Обычно это главный файл вашего приложения.

```js
module.exports = {
  entry: './src/index.js',
};
```

### Output (выходной файл)

Output определяет, куда Webpack сохраняет готовый бандл и как его назвать.

```js
const path = require('path');

module.exports = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
};
```

### Loaders (загрузчики)

Webpack по умолчанию понимает только JavaScript и JSON. Лоадеры позволяют обрабатывать другие типы файлов — CSS, TypeScript, изображения. Лоадер — это функция, которая трансформирует содержимое файла.

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
```

### Plugins (плагины)

Плагины выполняют более широкий круг задач, чем лоадеры: оптимизация бандла, управление переменными окружения, генерация HTML-файлов. Плагины могут взаимодействовать со всем жизненным циклом сборки.

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
};
```

### Mode (режим)

Режим определяет, какие оптимизации применяет Webpack. В режиме `production` включается минификация и tree-shaking. В режиме `development` — source maps и быстрая пересборка.

```js
module.exports = {
  mode: 'development', // или 'production'
};
```

## Создание React-проекта с нуля

Давайте создадим React-проект с нулевой конфигурацией Webpack шаг за шагом.

### Инициализация проекта

```bash
mkdir my-react-app
cd my-react-app
npm init -y
```

### Установка зависимостей

Вам понадобится несколько групп пакетов:

**React:**
```bash
npm install react react-dom
```

**Webpack:**
```bash
npm install --save-dev webpack webpack-cli webpack-dev-server
```

**Babel (для JSX и современного JS):**
```bash
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react babel-loader
```

**Плагины и лоадеры для HTML и CSS:**
```bash
npm install --save-dev html-webpack-plugin css-loader style-loader
```

### Структура проекта

После установки создайте следующую структуру:

```
my-react-app/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx
│   └── index.js
├── .babelrc
├── package.json
└── webpack.config.js
```

### Создание файлов проекта

**public/index.html** — шаблон HTML-страницы:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + Webpack</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

**src/index.js** — точка входа React-приложения:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

**src/App.jsx** — корневой компонент:

```jsx
import React from 'react';

function App() {
  return (
    <div>
      <h1>Hello, Webpack + React!</h1>
      <p>Приложение собрано с помощью Webpack</p>
    </div>
  );
}

export default App;
```

## Настройка Babel

Babel транспилирует JSX и современный JavaScript в код, который понимает большинство браузеров.

### Файл .babelrc

Создайте файл `.babelrc` в корне проекта:

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": ["> 1%", "last 2 versions", "not dead"]
        },
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ],
    [
      "@babel/preset-react",
      {
        "runtime": "automatic"
      }
    ]
  ]
}
```

Параметр `"runtime": "automatic"` в `@babel/preset-react` означает, что вам не нужно импортировать React в каждый файл с JSX (начиная с React 17). Babel автоматически добавит нужные импорты.

Если вы используете TypeScript, добавьте:

```bash
npm install --save-dev @babel/preset-typescript
```

И обновите `.babelrc`:

```json
{
  "presets": [
    "@babel/preset-env",
    ["@babel/preset-react", { "runtime": "automatic" }],
    "@babel/preset-typescript"
  ]
}
```

## Конфигурация webpack.config.js

Теперь создадим основной файл конфигурации:

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Точка входа — главный файл приложения
  entry: './src/index.js',

  // Настройки выходного файла
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true, // Очищать папку dist перед каждой сборкой
    publicPath: '/',
  },

  // Режим — development или production
  mode: 'development',

  // Source maps для удобной отладки
  devtool: 'eval-source-map',

  // Правила обработки модулей
  module: {
    rules: [
      // Обработка JSX и JavaScript через Babel
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      // Обработка CSS
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      // Обработка изображений
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
      },
      // Обработка шрифтов
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },

  // Плагины
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico', // если есть
    }),
  ],

  // Разрешение модулей
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};
```

Разберём ключевые настройки:

- `output.filename: 'bundle.[contenthash].js'` — `contenthash` изменяется при изменении содержимого файла. Это решает проблему кэширования браузера.
- `output.clean: true` — автоматически очищает папку `dist` перед каждой сборкой.
- `devtool: 'eval-source-map'` — быстрые source maps для разработки. В production используйте `'source-map'`.
- `resolve.alias` — алиас `@` позволяет писать `import Button from '@/components/Button'` вместо относительных путей.

## Настройка webpack-dev-server

`webpack-dev-server` запускает локальный сервер разработки с поддержкой Hot Module Replacement (HMR) — автоматической заменой модулей без перезагрузки страницы.

Добавьте настройки в `webpack.config.js`:

```js
module.exports = {
  // ... остальная конфигурация

  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3000,
    hot: true,           // Hot Module Replacement
    open: true,          // Автоматически открывать браузер
    historyApiFallback: true, // Для React Router — перенаправлять все запросы на index.html
    compress: true,      // Gzip сжатие
  },
};
```

Параметр `historyApiFallback: true` критически важен, если вы используете React Router. Без него при обновлении страницы на маршруте `/about` сервер вернёт 404.

Добавьте скрипты в `package.json`:

```json
{
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production",
    "build:dev": "webpack --mode development"
  }
}
```

## Поддержка CSS и SCSS

### Базовая настройка CSS

Правило, которое мы уже добавили, обрабатывает CSS:

```js
{
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
}
```

Лоадеры применяются справа налево:
1. `css-loader` — читает CSS-файл и разрешает `@import` и `url()`.
2. `style-loader` — вставляет CSS в `<style>` теги в DOM.

### CSS Modules

CSS Modules позволяют писать CSS с локальными именами классов:

```js
{
  test: /\.module\.css$/,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        modules: {
          localIdentName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  ],
},
{
  test: /\.css$/,
  exclude: /\.module\.css$/,
  use: ['style-loader', 'css-loader'],
},
```

Теперь файлы `*.module.css` обрабатываются как CSS Modules:

```jsx
import styles from './Button.module.css';

function Button({ children }) {
  return <button className={styles.button}>{children}</button>;
}
```

### Поддержка SCSS/Sass

Установите необходимые пакеты:

```bash
npm install --save-dev sass sass-loader
```

Добавьте правило:

```js
{
  test: /\.(scss|sass)$/,
  use: ['style-loader', 'css-loader', 'sass-loader'],
},
```

### Извлечение CSS в отдельный файл (production)

В production лучше выносить CSS в отдельные файлы вместо встраивания в JS. Используйте `MiniCssExtractPlugin`:

```bash
npm install --save-dev mini-css-extract-plugin
```

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  plugins: [
    ...(isProduction ? [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })] : []),
  ],
};
```

## Полная конфигурация для development и production

Часто удобно разделить конфигурацию на несколько файлов. Установите `webpack-merge`:

```bash
npm install --save-dev webpack-merge
```

Структура конфигурационных файлов:

```
webpack/
├── webpack.common.js   # Общая конфигурация
├── webpack.dev.js      # Конфигурация для разработки
└── webpack.prod.js     # Конфигурация для production
webpack.config.js       # Точка входа, мёрджит нужную конфигурацию
```

**webpack/webpack.common.js:**

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',

  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
    publicPath: '/',
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
```

**webpack/webpack.dev.js:**

```js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',

  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(scss|sass)$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },

  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
});
```

**webpack/webpack.prod.js:**

```js
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(scss|sass)$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],

  optimization: {
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
    },
  },
});
```

**webpack.config.js (корневой файл):**

```js
module.exports = (env, argv) => {
  if (argv.mode === 'production') {
    return require('./webpack/webpack.prod.js');
  }
  return require('./webpack/webpack.dev.js');
};
```

Обновите скрипты в `package.json`:

```json
{
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production",
    "build:analyze": "webpack --mode production --env analyze"
  }
}
```

## Code Splitting и оптимизация

Code splitting — это разбиение бандла на несколько меньших частей, которые загружаются по требованию. Это критически важно для производительности крупных React-приложений.

### Автоматический code splitting через SplitChunksPlugin

Webpack автоматически разделяет vendor-код (зависимости из node_modules) и код приложения:

```js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Выделяем React в отдельный чанк
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        // Все остальные vendor-зависимости
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
      },
    },
    // Выносим runtime в отдельный файл
    runtimeChunk: 'single',
  },
};
```

### Динамический импорт (Lazy Loading)

React поддерживает динамический импорт компонентов через `React.lazy`:

```jsx
import React, { Suspense, lazy } from 'react';

// Компонент загружается только когда он нужен
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Загрузка...</div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

Каждый динамически импортируемый компонент создаёт отдельный chunk, который загружается только при переходе на соответствующий маршрут.

### Bundle Analyzer

Для анализа размера бандла используйте `webpack-bundle-analyzer`:

```bash
npm install --save-dev webpack-bundle-analyzer
```

```js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE ? 'server' : 'disabled',
    }),
  ],
};
```

Запуск:

```bash
ANALYZE=true npm run build
```

## Полезные плагины

### DefinePlugin — переменные окружения

```js
const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.API_URL': JSON.stringify(process.env.API_URL),
    }),
  ],
};
```

### DotenvPlugin — загрузка .env файлов

```bash
npm install --save-dev dotenv-webpack
```

```js
const Dotenv = require('dotenv-webpack');

module.exports = {
  plugins: [
    new Dotenv({
      path: `./.env.${process.env.NODE_ENV}`,
    }),
  ],
};
```

### CopyWebpackPlugin — копирование статики

```bash
npm install --save-dev copy-webpack-plugin
```

```js
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: 'public', globOptions: { ignore: ['**/index.html'] } },
      ],
    }),
  ],
};
```

## Настройка TypeScript

Для проектов на TypeScript установите необходимые пакеты:

```bash
npm install typescript
npm install --save-dev @babel/preset-typescript @types/react @types/react-dom
```

Создайте `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

Обновите правило в Webpack для обработки TypeScript:

```js
{
  test: /\.(ts|tsx|js|jsx)$/,
  exclude: /node_modules/,
  use: 'babel-loader',
}
```

Если вы хотите проверку типов во время сборки (не только через IDE), добавьте `fork-ts-checker-webpack-plugin`:

```bash
npm install --save-dev fork-ts-checker-webpack-plugin
```

```js
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
  ],
};
```

## Webpack vs Create React App vs Vite

Давайте сравним три подхода к созданию React-приложений:

| Критерий | Ручной Webpack | Create React App | Vite |
|----------|---------------|-----------------|------|
| Скорость первого запуска | Медленно | Средне | Очень быстро |
| Скорость HMR | Средне | Средне | Мгновенно |
| Скорость production-сборки | Средне | Средне | Быстро |
| Гибкость конфигурации | Максимальная | Низкая (eject) | Высокая |
| Кривая обучения | Высокая | Низкая | Низкая |
| Поддержка legacy браузеров | Отличная | Хорошая | Требует настройки |
| Экосистема плагинов | Огромная | Ограничена | Растёт |
| Module Federation | Да | Нет | Через плагин |

### Когда выбирать ручной Webpack

Выбирайте ручную настройку Webpack, когда:

- нужна архитектура микрофронтендов через Module Federation;
- требуется тонкая настройка оптимизации под специфические требования;
- используются нестандартные лоадеры или плагины;
- важна поддержка старых браузеров;
- необходима кастомная логика сборки.

### Когда выбирать Vite

Vite — отличный выбор для:

- новых проектов, где скорость разработки критична;
- простых SPA без сложных требований к сборке;
- команды, которая хочет сосредоточиться на функциональности, а не конфигурации.

### Create React App

CRA фактически устарел — Meta перестала его активно поддерживать. Для новых проектов рекомендуется использовать Vite или Next.js. Для существующих проектов на CRA можно рассмотреть миграцию на Vite через `vite-react-app`.

## Полная итоговая конфигурация

Вот полная `webpack.config.js` для типичного React-проекта:

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.tsx',

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
      publicPath: '/',
    },

    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',

    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
        {
          test: /\.(scss|sass)$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name].[hash][ext]',
          },
        },
        {
          test: /\.svg$/,
          use: ['@svgr/webpack'],
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash][ext]',
          },
        },
      ],
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
      new Dotenv({
        path: `./.env${isProduction ? '.production' : '.development'}`,
        safe: true,
        defaults: './.env',
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: '[name].[contenthash].css',
            }),
          ]
        : []),
    ],

    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
            },
          },
        }),
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
      runtimeChunk: 'single',
    },

    devServer: {
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, 'public'),
      },
    },
  };
};
```

## Типичные проблемы и их решения

### Ошибка: Cannot find module при импорте

Убедитесь, что расширение файла указано в `resolve.extensions` или добавьте его явно в импорт.

### Медленная сборка в development

Используйте `cache` для ускорения повторных сборок:

```js
module.exports = {
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
  },
};
```

### Большой размер бандла

1. Запустите Bundle Analyzer для анализа.
2. Убедитесь, что tree-shaking работает — используйте ES модули (`import/export`), а не CommonJS (`require`).
3. Проверьте, нет ли дублирующихся зависимостей через `npm dedupe`.

### Hot reload не работает

Убедитесь, что у вас установлен `hot: true` в конфигурации `devServer` и что вы используете `webpack serve`, а не просто `webpack`.

### Изображения не загружаются

С Webpack 5 используйте `type: 'asset/resource'` вместо `file-loader` и `url-loader`. Эти лоадеры устарели.

## Заключение

Webpack — мощный и гибкий инструмент для сборки React-приложений. Несмотря на то что инструменты вроде Vite предлагают более быстрый старт, знание Webpack остаётся востребованным навыком для работы с legacy-проектами, оптимизации сборки и архитектуры микрофронтендов.

Ключевые выводы из этой статьи:

- Webpack строит граф зависимостей из entry point и создаёт один или несколько оптимизированных бандлов.
- Babel через `babel-loader` обрабатывает JSX и современный JavaScript/TypeScript.
- Лоадеры трансформируют файлы (CSS, изображения, шрифты), плагины — управляют процессом сборки.
- Разделяйте конфигурацию на development и production с помощью `webpack-merge`.
- Code splitting через `splitChunks` и динамический импорт критически важны для производительности больших приложений.
- `contenthash` в именах файлов решает проблему кэширования браузера.

По мере освоения базовой конфигурации изучайте Module Federation для микрофронтендов — это одна из самых мощных возможностей Webpack 5, которая недоступна в большинстве альтернативных бундлеров.
