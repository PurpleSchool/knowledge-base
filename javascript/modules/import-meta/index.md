---
metaTitle: "import.meta в JavaScript — свойства и применение"
metaDescription: "Разбираем import.meta в JavaScript: url, resolve, dirname, filename, env и glob. Практические примеры для браузера, Node.js и Vite."
author: "Антон Ларичев"
title: "import.meta в JavaScript"
preview: "Что такое import.meta, какие свойства оно предоставляет и как использовать их в браузере, Node.js и современных сборщиках."
---

## Что такое import.meta

`import.meta` — это специальный объект, доступный внутри ES-модулей. Он содержит метаинформацию о текущем модуле: откуда он загружен, какой у него URL, и другие свойства, которые среда выполнения или сборщик добавляют по своему усмотрению.

Объект `import.meta` появился вместе со спецификацией ES Modules и поддерживается во всех современных браузерах, а также в Node.js начиная с версии 12 (при использовании `"type": "module"` в `package.json` или файлов с расширением `.mjs`).

Важно понимать: `import.meta` доступен **только внутри модулей**. В CommonJS-коде (с `require`) его нет.

```javascript
// module.mjs или файл с "type": "module" в package.json
console.log(import.meta);
// { url: 'file:///home/user/project/module.mjs' }
```

Набор свойств объекта зависит от среды выполнения. Спецификация гарантирует только `import.meta.url`, всё остальное — расширения конкретной платформы или сборщика.

## import.meta.url

Самое универсальное свойство. Возвращает абсолютный URL текущего модуля в виде строки.

```javascript
// В браузере
console.log(import.meta.url);
// https://example.com/assets/utils.js

// В Node.js
console.log(import.meta.url);
// file:///home/user/project/src/utils.mjs
```

Это позволяет строить пути относительно текущего файла — задача, которую в CommonJS решали через `__dirname` и `__filename`.

### Построение путей в Node.js через import.meta.url

До появления `import.meta.dirname` (о нём ниже) стандартным способом получить путь к директории модуля была комбинация `URL` и `fileURLToPath`:

```javascript
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, 'config.json');
console.log(configPath);
// /home/user/project/src/config.json
```

### Загрузка ресурсов в браузере

В браузере `import.meta.url` удобен для загрузки файлов, расположенных рядом с модулем:

```javascript
// Загружаем Worker из той же директории, что и текущий модуль
const workerUrl = new URL('./worker.js', import.meta.url);
const worker = new Worker(workerUrl, { type: 'module' });

// Загружаем JSON-файл с данными
async function loadData() {
  const dataUrl = new URL('./data.json', import.meta.url);
  const response = await fetch(dataUrl);
  return response.json();
}
```

Такой подход работает независимо от того, где развёрнуто приложение, потому что URL вычисляется относительно текущего модуля, а не страницы.

## import.meta.resolve()

Метод `import.meta.resolve(specifier)` принимает строку-спецификатор модуля (так же как `import`) и возвращает промис с его абсолютным URL, не загружая сам модуль.

```javascript
// Разрешаем путь к пакету из node_modules
const lodashUrl = await import.meta.resolve('lodash-es');
console.log(lodashUrl);
// file:///home/user/project/node_modules/lodash-es/lodash.js

// Разрешаем относительный путь
const helperUrl = await import.meta.resolve('./helpers/format.js');
console.log(helperUrl);
// file:///home/user/project/src/helpers/format.js
```

В Node.js метод доступен начиная с версии 20.6 без флагов. В браузерах поддержка пока ограничена — проверяйте актуальность через MDN.

Практический пример — динамическая загрузка модуля по условию:

```javascript
async function loadPlugin(name) {
  const url = await import.meta.resolve(`./plugins/${name}.js`);
  const module = await import(url);
  return module.default;
}

const plugin = await loadPlugin('markdown');
plugin.init();
```

## import.meta.dirname и import.meta.filename

Node.js версии 20.11 и 21.2 добавил два удобных свойства, которые повторяют поведение `__dirname` и `__filename` из CommonJS:

```javascript
console.log(import.meta.filename);
// /home/user/project/src/utils.mjs

console.log(import.meta.dirname);
// /home/user/project/src
```

Теперь можно строить пути без `fileURLToPath`:

```javascript
import { join } from 'node:path';

// Раньше
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, 'config.json');

// Теперь (Node.js >= 20.11)
const configPath = join(import.meta.dirname, 'config.json');
```

Если нужна поддержка старых версий Node.js, используйте вариант с `fileURLToPath`.

## import.meta в Vite

Vite — один из самых популярных инструментов сборки — активно использует `import.meta` для предоставления дополнительных возможностей во время разработки и сборки.

### import.meta.env

`import.meta.env` содержит переменные окружения, доступные в клиентском коде. Vite автоматически встраивает их во время сборки.

```javascript
// Встроенные переменные Vite
console.log(import.meta.env.MODE);
// 'development' или 'production'

console.log(import.meta.env.DEV);
// true в режиме разработки

console.log(import.meta.env.PROD);
// true в продакшн-сборке

console.log(import.meta.env.BASE_URL);
// Базовый URL приложения
```

Пользовательские переменные задаются в файлах `.env` и должны начинаться с префикса `VITE_`:

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My Application
```

```javascript
// В коде приложения
const apiUrl = import.meta.env.VITE_API_URL;
const title = import.meta.env.VITE_APP_TITLE;

async function fetchUsers() {
  const response = await fetch(`${apiUrl}/users`);
  return response.json();
}
```

Переменные без префикса `VITE_` недоступны в клиентском коде — это защита от случайной утечки серверных секретов.

### import.meta.glob

`import.meta.glob` — функция Vite для динамического импорта сразу нескольких файлов по паттерну. Полезна для автоматической регистрации компонентов, маршрутов, плагинов.

```javascript
// Импортируем все компоненты из директории
const modules = import.meta.glob('./components/*.vue');

// modules — объект вида:
// {
//   './components/Button.vue': () => import('./components/Button.vue'),
//   './components/Input.vue': () => import('./components/Input.vue'),
// }

// Загружаем все компоненты
for (const [path, loader] of Object.entries(modules)) {
  const module = await loader();
  const componentName = path.match(/\.\/(\w+)\.vue$/)[1];
  app.component(componentName, module.default);
}
```

Чтобы загрузить все модули сразу (eager import), используем опцию `{ eager: true }`:

```javascript
const routes = import.meta.glob('./pages/*.jsx', { eager: true });

const routeList = Object.entries(routes).map(([path, module]) => ({
  path: path.replace('./pages', '').replace('.jsx', ''),
  component: module.default,
}));
```

### import.meta.hot

Во время разработки Vite добавляет `import.meta.hot` для работы с Hot Module Replacement (HMR) — механизмом обновления модулей без перезагрузки страницы.

```javascript
if (import.meta.hot) {
  // Принимаем обновления для текущего модуля
  import.meta.hot.accept((newModule) => {
    // newModule — обновлённая версия модуля
    if (newModule) {
      newModule.init();
    }
  });

  // Очищаем ресурсы при замене модуля
  import.meta.hot.dispose((data) => {
    clearInterval(data.timerId);
  });
}
```

Проверка `if (import.meta.hot)` обязательна: в продакшн-сборке это свойство отсутствует, и Vite при сборке автоматически удаляет весь код внутри таких блоков.

## import.meta в webpack и других сборщиках

Webpack 5 также поддерживает ряд свойств `import.meta`:

```javascript
// Webpack предоставляет похожий url
console.log(import.meta.url);
// webpack-internal:///./src/module.js

// Или с outputModule: true — настоящий URL
```

Esbuild и Rollup обрабатывают `import.meta.url` корректно по стандарту, а дополнительные свойства можно добавлять через плагины.

## Добавление собственных свойств

В Node.js через поле `importMetaProperties` loader-хуков можно расширять `import.meta` при кастомной загрузке модулей. В браузере это недоступно — стандарт не позволяет менять `import.meta` извне.

Сборщики (Vite, webpack) заменяют вхождения `import.meta.env.SOMETHING` конкретными значениями на этапе сборки с помощью статического анализа и строковой замены — это не настоящее изменение объекта, а трансформация исходного кода.

## Практический пример: универсальный загрузчик конфига

Объединим несколько возможностей в реальном сценарии — загрузка конфигурации в зависимости от окружения:

```javascript
// config-loader.mjs
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadConfig() {
  // В Node.js >= 20.11 используем import.meta.dirname
  const baseDir = import.meta.dirname;

  // Определяем файл конфига по окружению
  const env = process.env.NODE_ENV ?? 'development';
  const configFile = join(baseDir, `config.${env}.json`);

  try {
    const raw = await readFile(configFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // Fallback на базовый конфиг
    const defaultFile = join(baseDir, 'config.json');
    const raw = await readFile(defaultFile, 'utf-8');
    return JSON.parse(raw);
  }
}
```

```javascript
// main.mjs
import { loadConfig } from './config-loader.mjs';

const config = await loadConfig();
console.log(`Connecting to: ${config.apiUrl}`);
```

## Совместимость

| Среда | import.meta.url | import.meta.resolve | import.meta.dirname |
|---|---|---|---|
| Браузер (современный) | Да | Частично | Нет |
| Node.js 12+ | Да | С флагом | Нет |
| Node.js 20.11+ | Да | Да | Да |
| Vite | Да | Через плагин | Нет (есть import.meta.env) |

Проверить поддержку `import.meta.url` в браузере можно так:

```javascript
function supportsImportMeta() {
  try {
    // Этот код выполняется только если import.meta доступен
    return typeof import.meta !== 'undefined';
  } catch {
    return false;
  }
}
```

Но на практике такая проверка нужна редко: если вы пишете ES-модуль, `import.meta` всегда доступен в поддерживаемых средах.

## Итог

`import.meta` — точка входа в метаинформацию о модуле. Стандарт гарантирует только `import.meta.url`, но среды выполнения и сборщики добавляют много полезного поверх: `resolve()` и `dirname`/`filename` в Node.js, `env`, `glob` и `hot` в Vite. Разобравшись с базовым `import.meta.url`, вы сможете строить пути к ресурсам, загружать воркеры и управлять зависимостями без привязки к конкретному расположению файлов.

Чтобы глубже разобраться с модульной системой JavaScript и современными инструментами разработки, приходите на курс [JavaScript для профессионалов](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=import-meta) на PurpleSchool.
