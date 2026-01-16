---
metaTitle: Конфигурация Webpack - webpack config для современных фронтенд проектов
metaDescription: Подробное руководство по настройке webpack config - разбор основных полей конфигурации режимов загрузчиков плагинов и оптимизаций
author: Олег Марков
title: Конфигурация Webpack - webpack config шаг за шагом
preview: Разберитесь в конфигурации Webpack - поймите как работает webpack config какие поля действительно важны и как их настроить на практике
---

## Введение

Webpack часто воспринимают как что‑то сложное и «магическое». Файл конфигурации webpack.config.js выглядит пугающе, особенно когда в нем десятки строк с незнакомыми полями. Смотрите, я покажу вам, как этот файл устроен изнутри и за что отвечает каждая ключевая часть конфигурации.

В этой статье мы разберем:

- базовую структуру webpack.config.js;
- ключевые поля: entry, output, mode, module, resolve, plugins, optimization и другие;
- работу с загрузчиками (loaders) и плагинами;
- разделение конфигураций на dev/prod;
- удобные практики организации конфигов.

Цель статьи — чтобы вы могли уверенно читать чужую конфигурацию Webpack, менять ее под свои задачи и собирать свою с нуля.

---

## Базовая структура webpack.config.js

### Минимальная конфигурация

Давайте начнем с простейшего примера. Ниже я показываю самую базовую конфигурацию, которая уже рабочая:

```js
// webpack.config.js

// Подключаем встроенный модуль Node.js для работы с путями файловой системы
const path = require('path');

module.exports = {
  // Точка входа - с этого файла Webpack начинает строить граф зависимостей
  entry: './src/index.js',

  // Описание того, куда и как собирать итоговый бандл
  output: {
    // path должен быть абсолютным путем - используем path.resolve
    path: path.resolve(__dirname, 'dist'),
    // Имя итогового файла бандла
    filename: 'bundle.js',
  },

  // Режим сборки - development или production
  mode: 'development', // В dev включены удобства для разработки
};
```

Здесь вы видите три главных элемента:

- `entry` — откуда Webpack начинает «обходить» проект;
- `output` — куда и как складывает собранный код;
- `mode` — определяет поведение сборки и оптимизации.

Дальше мы будем надстраивать над этой основой все остальное.

---

## Поле entry — точки входа в приложение

### Одна точка входа

В простых приложениях обычно одна точка входа:

```js
module.exports = {
  entry: './src/index.js',
};
```

- Webpack читает ./src/index.js;
- находит в нем импорты и рекурсивно подтягивает все зависимости;
- в итоге формирует единый бандл (или несколько, если вы настроите код-сплиттинг).

### Несколько точек входа

Иногда вам нужно собрать несколько независимых частей — например, сайт с несколькими страницами или отдельную админку. Тогда `entry` можно сделать объектом:

```js
module.exports = {
  entry: {
    // Основное приложение
    main: './src/main.js',
    // Админка
    admin: './src/admin.js',
  },
  output: {
    // [name] будет заменен на имя entry - main.js, admin.js
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
};
```

Как видите, использование шаблона `[name]` в имени выходного файла помогает связать каждый entry с отдельным бандлом.

### Entry с массивом

Иногда вам нужно объединить несколько файлов в одну точку входа, например подключить полифиллы:

```js
module.exports = {
  entry: {
    main: [
      // Здесь мы подключаем полифилл до основного кода
      'core-js/stable',
      './src/index.js',
    ],
  },
};
```

Webpack пройдет по массиву сверху вниз и объединит все в один бандл.

---

## Поле output — куда складываются бандлы

### Основные параметры output

Давайте разберемся, что вы чаще всего настраиваете в `output`:

```js
const path = require('path');

module.exports = {
  // ...
  output: {
    // Абсолютный путь к папке сборки
    path: path.resolve(__dirname, 'dist'),

    // Имя основного бандла
    filename: '[name].[contenthash].js',

    // Публичный путь - префикс для загрузки ресурсов в браузере
    publicPath: '/',
  },
};
```

Разберем по частям:

- `path` — физический путь на диске, куда Webpack кладет файлы;
- `filename` — имя итогового JS-файла. Часто используют шаблоны:
  - `[name]` — имя точки входа (main, admin и т.д.);
  - `[contenthash]` — хеш содержимого файла. Меняется только когда меняется код, это удобно для кеширования;
- `publicPath` — путь, по которому браузер будет искать ресурсы (JS, изображения, динамические чанки). Например:
  - `/` — корень сайта;
  - `/static/` — все ресурсы будут загружаться из /static.

### Настройка имен чанков

Если у вас есть динамический импорт, Webpack создает дополнительные чанки. Вы можете управлять их именем:

```js
module.exports = {
  // ...
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    // Здесь мы задаем шаблон имени для динамических чанков
    chunkFilename: 'chunks/[name].[contenthash].js',
  },
};
```

Так вам проще наводить порядок в структуре сборки.

---

## Поле mode — режим работы Webpack

### Режимы development и production

Поле `mode` сильно влияет на поведение Webpack:

```js
module.exports = {
  // ...
  mode: 'development', // или 'production'
};
```

Что делает каждый режим:

- `development`:
  - не минифицирует код (или делает это мягко, зависит от настроек);
  - включает более подробные source map;
  - добавляет полезные сообщения для разработки;
  - ускоряет сборку, жертвуя частью оптимизаций.

- `production`:
  - минифицирует JS;
  - удаляет «мертвый» код (tree shaking там, где это возможно);
  - включает более агрессивные оптимизации чанков;
  - по умолчанию делает сборку максимально компактной.

### Автоматический выбор режима

Часто режим передают через переменную окружения:

```js
// webpack.config.js
const path = require('path');

// Здесь мы читаем значение NODE_ENV из окружения
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProd ? 'production' : 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    // В проде добавляем хеш, в деве оставляем простое имя
    filename: isProd ? 'bundle.[contenthash].js' : 'bundle.js',
  },
};
```

Теперь давайте посмотрим, как конфигурация может различаться для dev/prod гораздо сильнее — через разделение файлов.

---

## Разделение конфигураций на dev и prod

### Зачем разделять конфиг

Обычно вам нужны:

- одни настройки для разработки (быстрота, удобство отладки);
- другие для продакшена (минимальный размер, кеширование).

Смешивать всё в одном файле можно, но он быстро разрастается и становится трудночитаемым. Гораздо удобнее вынести общие части и сделать два отдельных конфига.

### Базовый общий конфиг

Давайте разберемся на примере. Сначала создадим общий конфиг:

```js
// webpack.common.js
const path = require('path');

module.exports = {
  // Общая точка входа
  entry: './src/index.js',

  // Общий output - часть может меняться в dev/prod отдельно
  output: {
    path: path.resolve(__dirname, 'dist'),
  },

  // Общие правила для модулей
  module: {
    rules: [
      {
        test: /\.js$/, // Обрабатываем все .js файлы
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Транспилируем современный JS
          options: {
            // Здесь лежит конфигурация Babel
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};
```

### Конфиг для разработки

Теперь создадим dev-конфиг и будем «досливать» в него общие настройки:

```js
// webpack.dev.js
const { merge } = require('webpack-merge'); // Пакет для объединения конфигов
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  // Удобный source map для отладки
  devtool: 'eval-source-map',

  output: {
    // В dev часто оставляют читаемые имена файлов
    filename: '[name].js',
    publicPath: '/',
  },

  devServer: {
    // Здесь настраиваем webpack-dev-server
    static: './dist',
    hot: true, // Включаем HMR - обновление модулей без перезагрузки страницы
  },
});
```

### Конфиг для продакшена

И, наконец, прод:

```js
// webpack.prod.js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',

  output: {
    // Используем contenthash для кеширования
    filename: '[name].[contenthash].js',
    publicPath: '/',
    clean: true, // Очищаем dist перед каждой сборкой
  },

  devtool: 'source-map', // Точный source map для прод (можно отключить)
});
```

Теперь вы можете запускать:

```bash
# Сборка для разработки
npx webpack --config webpack.dev.js

# Сборка для продакшена
npx webpack --config webpack.prod.js
```

---

## Поле module и rules — загрузчики (loaders)

### Зачем нужны loaders

Webpack «понимает» только JavaScript и JSON из коробки. Всё остальное — CSS, изображения, TypeScript, JSX — он обрабатывает через загрузчики.

Вы настраиваете, какие файлы каким загрузчиком обрабатывать, через `module.rules`.

### Пример использования babel-loader

Давайте посмотрим на пример с Babel, чтобы вам было проще понять:

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.m?js$/,       // Ищем файлы .js или .mjs
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // preset-env превращает современный JS в более совместимый
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};
```

Что здесь происходит:

- `test` — регулярное выражение, по которому Webpack выбирает файлы;
- `exclude` — папки/файлы, которые нужно пропустить;
- `use` — какой loader применить и с какими опциями.

### Обработка CSS

Теперь давайте разберемся, как подключать CSS. Для этого часто используют связку `style-loader` + `css-loader`:

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.css$/, // Все файлы с расширением .css
        use: [
          // Загрузчики применяются справа налево
          'style-loader', // Встраивает стили в <style> в HTML
          'css-loader',   // Позволяет импортировать CSS в JS
        ],
      },
    ],
  },
};
```

Обратите внимание: порядок загрузчиков важен. Как видите, сначала css-loader превращает CSS в JS-модуль, затем style-loader вставляет результат в DOM.

### Пример с препроцессорами (SASS/SCSS)

Если вы используете SCSS, схема похожая, просто добавляется еще один loader:

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i, // .sass и .scss
        use: [
          'style-loader',      // Встраивает стили в DOM
          'css-loader',        // Обрабатывает @import и url()
          'sass-loader',       // Компилирует SASS/SCSS в CSS
        ],
      },
    ],
  },
};
```

### Обработка изображений и файлов

Начиная с Webpack 5, для статических файлов уже не нужен file-loader, есть встроенные asset-модули:

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/i, // Все основные изображения
        type: 'asset', // Webpack сам решит - inline или отдельный файл
      },
    ],
  },
};
```

Вы можете управлять порогом размера:

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // Здесь мы задаем порог в 8 КБ
          },
        },
      },
    ],
  },
};
```

Если хотите всегда получать отдельный файл:

```js
{
  test: /\.(png|jpe?g|gif|svg)$/i,
  type: 'asset/resource', // Всегда выносит в файл
}
```

---

## Поле resolve — как Webpack ищет модули

### Расширения файлов

Чтобы не писать расширения в импортах каждый раз, вы можете указать список расширений:

```js
module.exports = {
  // ...
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
};
```

Теперь вы можете писать:

```js
// Вместо ./App.jsx Webpack сам подставит нужное расширение
import App from './App';
```

### Алиасы путей

Если вы устали от относительных путей вроде ../../../components/Button, можно настроить alias:

```js
const path = require('path');

module.exports = {
  // ...
  resolve: {
    alias: {
      // Здесь мы задаем короткий путь '@components' к 'src/components'
      '@components': path.resolve(__dirname, 'src/components/'),
      '@utils': path.resolve(__dirname, 'src/utils/'),
    },
  },
};
```

Теперь в коде:

```js
// Здесь мы используем alias вместо длинного относительного пути
import Button from '@components/Button';
```

Это сильно упрощает навигацию в больших проектах.

---

## Поле plugins — подключение плагинов

### Зачем нужны плагины

Loaders обрабатывают отдельные файлы, а плагины вмешиваются в процесс сборки на более высоком уровне: генерируют HTML, копируют ассеты, очищают папку dist и т.п.

Чтобы использовать плагин, вы:

1. устанавливаете его через npm;
2. подключаете в конфиг;
3. добавляете в массив plugins.

### HtmlWebpackPlugin — генерация HTML

Давайте начнем с самого часто используемого плагина:

```bash
npm install --save-dev html-webpack-plugin
```

Теперь добавим его в конфиг:

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // ...
  plugins: [
    new HtmlWebpackPlugin({
      // Здесь мы указываем шаблон HTML
      template: './src/index.html',
      // Имя итогового файла
      filename: 'index.html',
    }),
  ],
};
```

Что делает HtmlWebpackPlugin:

- берет ваш шаблон ./src/index.html;
- автоматически подключает все собранные бандлы (JS, CSS);
- создает итоговый dist/index.html.

### MiniCssExtractPlugin — вынос CSS в отдельный файл

В продакшене удобно иметь отдельные CSS-файлы вместо инлайна через style-loader:

```bash
npm install --save-dev mini-css-extract-plugin
```

Добавим конфиг:

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          // В продакшене используем MiniCssExtractPlugin вместо style-loader
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
    ],
  },
  plugins: [
    // Здесь мы настраиваем имя итогового CSS-файла
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],
};
```

Теперь Webpack создаст отдельные CSS-файлы, которые удобно кешируются браузером.

### DefinePlugin — переменные окружения

Вам часто нужно пробросить в код значения, зависящие от окружения (API_URL, флаги). Для этого есть встроенный DefinePlugin:

```js
const webpack = require('webpack');

module.exports = {
  // ...
  plugins: [
    new webpack.DefinePlugin({
      // Здесь мы создаем глобальную константу process.env.API_URL
      'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3000'),
    }),
  ],
};
```

Теперь в коде вы можете написать:

```js
// Здесь мы используем переменную окружения, определенную в DefinePlugin
fetch(`${process.env.API_URL}/users`);
```

---

## DevServer — конфигурация для разработки

### Webpack Dev Server

Для удобной разработки вы можете использовать webpack-dev-server — встроенный сервер с автообновлением.

Установка:

```bash
npm install --save-dev webpack-dev-server
```

Настройка:

```js
module.exports = {
  // ...
  devServer: {
    static: {
      // Здесь мы указываем папку, из которой сервер отдает статические файлы
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,  // Включаем gzip-сжатие
    port: 3000,      // Порт dev-сервера
    hot: true,       // Горячая перезагрузка модулей
    historyApiFallback: true, // Поддержка SPA с маршрутизацией
  },
};
```

Теперь запуск:

```bash
npx webpack serve --config webpack.dev.js
```

Сервер будет пересобирать проект при изменении файлов и обновлять страницу (или модули) автоматически.

---

## Поле optimization — управление чанками и минификацией

### Минимальная настройка optimization

Webpack имеет мощную систему оптимизации. Часть ее включена по умолчанию, но вы можете управлять этим через поле `optimization`:

```js
module.exports = {
  // ...
  optimization: {
    // Включает или отключает минификацию кода
    minimize: true,
  },
};
```

Как правило, `minimize` автоматически включено в режиме production и выключено в development.

### Разделение кода на чанки (splitChunks)

Давайте разберемся, как вынести общие зависимости (например, react, lodash) в отдельный бандл vendors:

```js
module.exports = {
  // ...
  optimization: {
    splitChunks: {
      // Включить разделение кода для всех типов чанков
      chunks: 'all',
      cacheGroups: {
        // Группа для внешних зависимостей
        vendors: {
          test: /[\\/]node_modules[\\/]/, // Ищем модули в node_modules
          name: 'vendors',                // Имя итогового чанка
          chunks: 'all',
        },
      },
    },
  },
};
```

Теперь Webpack:

- соберет ваш код в один или несколько бандлов;
- вынесет модули из node_modules в отдельный файл vendors.[hash].js.

Это помогает кешировать библиотеки дольше, даже если ваш прикладной код меняется.

### runtimeChunk — вынос runtime-кода

Чтобы еще лучше использовать кеширование, runtime-код (служебный код Webpack) можно вынести отдельно:

```js
module.exports = {
  // ...
  optimization: {
    runtimeChunk: 'single', // Здесь мы выносим runtime в отдельный файл
  },
};
```

Теперь изменения в одном чанке меньше влияют на хеши других.

---

## Source maps — настройки devtool

### Зачем нужны source maps

Source map позволяют вам в браузерных DevTools видеть исходный код (до сборки), даже если бандл минифицирован или объединен.

Вы управляете этим через поле `devtool`:

```js
module.exports = {
  // ...
  devtool: 'source-map',
};
```

### Разные настройки для dev и prod

Давайте посмотрим, как выбирать варианты:

- `eval-source-map` — очень быстрый, удобный для разработки;
- `cheap-module-source-map` — компромисс по качеству и скорости;
- `source-map` — точный, но более медленный, чаще используется в проде (или отключают совсем).

Пример различия:

```js
// webpack.dev.js
module.exports = {
  // ...
  devtool: 'eval-source-map',
};

// webpack.prod.js
module.exports = {
  // ...
  devtool: 'source-map', // или false, если вы не хотите отдавать карты в проде
};
```

---

## Конфигурация для React / SPA — пример целостного конфига

Теперь давайте посмотрим на более «живой» пример — SPA на React с разделением конфигов.

### Общий конфиг

```js
// webpack.common.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.jsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
  },

  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@components': path.resolve(__dirname, 'src/components/'),
      '@hooks': path.resolve(__dirname, 'src/hooks/'),
    },
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,  // Обрабатываем JS и JSX
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // Здесь мы используем пресеты для современного JS и React
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader', // В dev подойдет, в prod заменим на MiniCssExtractPlugin
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource', // Всегда выносим изображения в отдельные файлы
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
```

### Dev-конфиг для React SPA

```js
// webpack.dev.js
const { merge } = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',

  output: {
    filename: '[name].js',
    publicPath: '/', // В SPA это важно для history API
  },

  devtool: 'eval-source-map',

  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    historyApiFallback: true, // Все запросы отдаем на index.html
    hot: true,
    port: 3000,
  },
});
```

### Prod-конфиг с выносом CSS

```js
// webpack.prod.js
const { merge } = require('webpack-merge');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',

  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          // В продакшене вытаскиваем CSS в отдельные файлы
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: 'single',
  },

  devtool: 'source-map',
});
```

Теперь вы видите, как разные части конфигурации сочетаются в реальном проекте.

---

## Полезные практики организации webpack config

### Держите конфиг модульным

Если конфигурация растет, вы можете разбивать ее на логические части:

- отдельный файл для loaders;
- отдельный для plugins;
- функции-хелперы для повторяющихся кусочков.

Пример вынесения общих правил:

```js
// webpack.rules.js
module.exports = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    use: 'babel-loader',
  },
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  },
];
```

И подключение:

```js
// webpack.common.js
const rules = require('./webpack.rules.js');

module.exports = {
  // ...
  module: {
    rules,
  },
};
```

### Используйте переменные окружения

Вы можете сделать конфиг функцией и принимать env-параметры:

```js
// webpack.config.js
const path = require('path');

module.exports = (env, argv) => {
  // Здесь мы читаем mode из аргументов
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'bundle.[contenthash].js' : 'bundle.js',
    },
    // Здесь вы можете менять правила и плагины в зависимости от режима
  };
};
```

Теперь вы можете запускать:

```bash
npx webpack --mode development
npx webpack --mode production
```

И одна и та же конфигурация будет адаптироваться под нужный режим.

---

## Заключение

Конфигурация Webpack — это не просто «файл настроек», а описание всего процесса сборки вашего фронтенд‑проекта. Когда вы понимаете, как работают ключевые поля `entry`, `output`, `mode`, `module.rules`, `resolve`, `plugins`, `optimization` и `devServer`, Webpack из «черного ящика» превращается в инструмент, которым можно уверенно управлять.

Подходите к конфигу постепенно:

- начните с минимальной рабочей версии;
- добавьте loaders для JS, стилей и изображений;
- подключите HtmlWebpackPlugin;
- разделите конфиги на dev и prod;
- оптимизируйте чанки и кеширование, когда проект вырастет.

Давайте посмотрим на конфигурацию как на конструктор: у вас есть набор блоков (loaders, plugins, optimization), и вы собираете из них сборку, которая соответствует вашим требованиям по скорости разработки, размеру бандла и удобству поддержки.

---

## Частозадаваемые технические вопросы и ответы

### Как настроить алиасы в TypeScript так же, как в Webpack

Если вы используете alias в `resolve.alias`, их нужно продублировать в tsconfig.json:

```json
// Здесь мы настраиваем пути для TypeScript
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@components/*": ["components/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
```

В Webpack при этом:

```js
resolve: {
  alias: {
    '@components': path.resolve(__dirname, 'src/components/'),
    '@utils': path.resolve(__dirname, 'src/utils/'),
  },
},
```

Так IDE и компилятор будут понимать те же пути, что и Webpack.

### Как настроить прокси на backend в devServer

Когда API работает на другом порту/домене, используйте devServer.proxy:

```js
devServer: {
  proxy: {
    // Все запросы на /api отправляем на backend
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
      pathRewrite: { '^/api': '' }, // Здесь мы убираем префикс /api при отправке
    },
  },
},
```

Теперь запросы вида /api/users в dev будут проксироваться на http://localhost:4000/users.

### Как сделать отдельный бандл только для полифиллов

Создайте отдельную точку входа polyfills и подключите строго в нужных местах:

```js
module.exports = {
  entry: {
    main: './src/index.js',
    polyfills: './src/polyfills.js',
  },
  output: {
    filename: '[name].[contenthash].js',
  },
};
```

В HTML-шаблоне:

```html
<!-- Здесь мы подключаем polyfills перед основным приложением -->
<script src="polyfills.js"></script>
<script src="main.js"></script>
```

Так старые браузеры получат нужные полифиллы, а современные могут вообще не загружать этот бандл, если вы настроите условное подключение.

### Как исключить конкретную библиотеку из бандла (externals)

Если библиотека уже подключена через CDN и вы не хотите тянуть ее в бандл, используйте externals:

```js
module.exports = {
  // ...
  externals: {
    // Здесь мы говорим Webpack - не бандль react, он доступен как глобальная переменная React
    react: 'React',
    'react-dom': 'ReactDOM',
  },
};
```

В HTML вы должны подключить CDN-скрипты до вашего бандла. В коде при этом продолжаете использовать обычные импорты.

### Как ускорить сборку большого проекта

Несколько практических шагов:

1. Ограничить область поиска loaders:
   ```js
   {
     test: /\.js$/,
     include: path.resolve(__dirname, 'src'), // Здесь мы обрабатываем только src
     use: 'babel-loader',
   }
   ```
2. Включить cache для babel-loader:
   ```js
   use: {
     loader: 'babel-loader',
     options: {
       cacheDirectory: true, // Здесь мы включаем кэширование результатов
     },
   }
   ```
3. Использовать `thread-loader` для тяжелых задач (например, TS, Babel), если у вас многоядерный процессор.