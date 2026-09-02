---
metaTitle: "JavaScript Import Maps: управление зависимостями в браузере"
metaDescription: "Как использовать Import Maps для управления ES-модулями в браузере без сборщиков. Синтаксис, scoped mappings, CDN и поддержка браузеров."
author: "Антон Ларичев"
title: "JavaScript Import Maps: управление зависимостями в браузере"
preview: "Import Maps позволяют управлять путями к ES-модулям прямо в браузере — без Webpack и других сборщиков. Разбираем синтаксис и практические сценарии применения."
---

## Что такое Import Maps

Import Maps — это механизм браузера, позволяющий контролировать, как разрешаются пути в инструкциях `import`. С помощью JSON-карты в HTML-документе вы указываете браузеру: «когда встречаешь импорт `lodash` — загружай файл по вот этому URL».

До появления Import Maps браузер понимал только два вида путей в `import`:

- Абсолютный URL: `import { debounce } from 'https://cdn.example.com/lodash.js'`
- Относительный путь: `import { helper } from './utils.js'`

Записи вида `import { debounce } from 'lodash'` называются **bare specifiers** (голые спецификаторы) и раньше браузер просто выбрасывал ошибку — такой синтаксис поддерживали только Node.js и сборщики типа Webpack или Rollup. Import Maps решают эту проблему нативно.

## Базовый синтаксис

Import Map объявляется тегом `<script type="importmap">` в `<head>` документа и должен появляться **до** любого модульного скрипта.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <script type="importmap">
    {
      "imports": {
        "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js",
        "lodash/": "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/"
      }
    }
  </script>
</head>
<body>
  <script type="module">
    import { debounce } from 'lodash';
    import { cloneDeep } from 'lodash/cloneDeep.js';

    const fn = debounce(() => console.log('called'), 300);
  </script>
</body>
</html>
```

Обратите внимание на запись `"lodash/"` с косой чертой в конце — это **path prefix mapping**. Она позволяет импортировать конкретные файлы пакета, подставляя суффикс пути автоматически.

## Структура объекта Import Map

Объект карты поддерживает два ключа верхнего уровня:

```json
{
  "imports": { ... },
  "scopes": { ... }
}
```

### Раздел imports

`imports` — глобальная таблица соответствий. Браузер применяет её ко всем модулям в документе.

```html
<script type="importmap">
  {
    "imports": {
      "utils": "/src/utils/index.js",
      "api/": "/src/api/",
      "react": "https://esm.sh/react@18",
      "react-dom/client": "https://esm.sh/react-dom@18/client"
    }
  }
</script>
```

```javascript
// /src/app.js
import { formatDate } from 'utils';
import { fetchUsers } from 'api/users.js';   // -> /src/api/users.js
import React from 'react';
import { createRoot } from 'react-dom/client';
```

### Раздел scopes

`scopes` позволяет задавать **локальные переопределения** для конкретных директорий или файлов. Это нужно, когда разные части приложения должны использовать разные версии одной зависимости.

```html
<script type="importmap">
  {
    "imports": {
      "helpers": "/src/helpers-v2.js"
    },
    "scopes": {
      "/src/legacy/": {
        "helpers": "/src/helpers-v1.js"
      }
    }
  }
</script>
```

Здесь все модули по умолчанию получат `helpers-v2.js`, но скрипты из директории `/src/legacy/` получат `helpers-v1.js`. Браузер применяет наиболее специфичный подходящий scope.

## Практические сценарии применения

### Работа без сборщика

Import Maps открывают возможность писать модульный JavaScript непосредственно в браузере, подключая пакеты с CDN.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <script type="importmap">
    {
      "imports": {
        "date-fns": "https://cdn.jsdelivr.net/npm/date-fns@3/cdn.js",
        "date-fns/": "https://cdn.jsdelivr.net/npm/date-fns@3/esm/"
      }
    }
  </script>
</head>
<body>
  <div id="output"></div>
  <script type="module">
    import { format, addDays } from 'date-fns';

    const today = new Date();
    const nextWeek = addDays(today, 7);

    document.getElementById('output').textContent =
      `Сегодня: ${format(today, 'dd.MM.yyyy')}, через неделю: ${format(nextWeek, 'dd.MM.yyyy')}`;
  </script>
</body>
</html>
```

### Алиасы для локальных модулей

Import Maps удобно использовать для создания коротких алиасов, чтобы избавиться от длинных относительных путей.

```html
<script type="importmap">
  {
    "imports": {
      "@components/": "/src/components/",
      "@utils/": "/src/utils/",
      "@store": "/src/store/index.js"
    }
  }
</script>
```

```javascript
// Было:
import { Button } from '../../../components/ui/Button.js';
import { formatCurrency } from '../../utils/format.js';

// Стало:
import { Button } from '@components/ui/Button.js';
import { formatCurrency } from '@utils/format.js';
```

### Подмена зависимостей для тестирования

Scopes позволяют в тестовой среде заменить реальную библиотеку на мок без изменения исходного кода.

```html
<!-- test.html -->
<script type="importmap">
  {
    "imports": {
      "api-client": "/src/api-client.js"
    },
    "scopes": {
      "/tests/": {
        "api-client": "/tests/mocks/api-client.mock.js"
      }
    }
  }
</script>
```

### Динамическое обновление карты через JavaScript

Import Map нельзя изменить после загрузки страницы — он иммутабелен. Но его можно сформировать динамически на сервере и встроить в HTML при рендере. Например, для A/B-тестирования разных версий компонента.

```html
<!-- Серверный шаблон (Node.js / Python / PHP) -->
<script type="importmap">
  {
    "imports": {
      "checkout": "<%= abVariant === 'B' ? '/v2/checkout.js' : '/v1/checkout.js' %>"
    }
  }
</script>
```

## Загрузка Import Map из внешнего файла

С атрибутом `src` можно вынести карту в отдельный JSON-файл:

```html
<script type="importmap" src="/importmap.json"></script>
```

Файл `importmap.json`:

```json
{
  "imports": {
    "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js",
    "chart.js": "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.js"
  }
}
```

Это удобно при работе с системами сборки, которые автоматически генерируют карту зависимостей.

## Важные ограничения

### Один Import Map на документ

В документе допускается ровно один тег `<script type="importmap">`. Если встречается второй — браузер игнорирует его и выдаёт предупреждение в консоль.

### Порядок тегов в документе имеет значение

Import Map должен быть объявлен **до** всех модульных скриптов и ссылок на модули. Следующий код приведёт к ошибке:

```html
<!-- НЕВЕРНО -->
<script type="module" src="/app.js"></script>
<script type="importmap">{ "imports": { "utils": "/utils.js" } }</script>
```

```html
<!-- ВЕРНО -->
<script type="importmap">{ "imports": { "utils": "/utils.js" } }</script>
<script type="module" src="/app.js"></script>
```

### Значения должны быть валидными URL или путями

Правая часть карты — всегда URL или путь, начинающийся с `/`, `./` или `../`. Произвольные строки не допускаются.

```json
// ВЕРНО:
"imports": {
  "utils": "/src/utils.js",
  "lodash": "./node_modules/lodash-es/lodash.js",
  "react": "https://esm.sh/react@18"
}

// НЕВЕРНО — значение не является URL:
"imports": {
  "utils": "src/utils"
}
```

### Нет поддержки условных экспортов из package.json

Import Maps не читают `package.json`. Если пакет использует поле `exports` для условных экспортов, вам нужно вручную указать нужный путь к файлу в карте.

## Совместная работа с инструментами сборки

Import Maps не замена сборщикам для production-приложений — они дополняют экосистему. Основные случаи совместной работы:

**Vite** поддерживает Import Maps в dev-режиме через плагин `@vitejs/plugin-importmap`. В production Vite собирает бандл стандартным образом.

**ES Module Shims** — полифилл, расширяющий поддержку Import Maps для старых браузеров и добавляющий дополнительные возможности (например, несколько Import Map на страницу):

```html
<script async src="https://ga.jspm.io/npm:es-module-shims@1.10.0/dist/es-module-shims.js"></script>
<script type="importmap">
  {
    "imports": {
      "react": "https://ga.jspm.io/npm:react@18.2.0/index.js"
    }
  }
</script>
```

**JSPM Generator** — онлайн-инструмент и CLI для автоматической генерации Import Maps из `package.json`:

```bash
npx jspm install react react-dom --env browser,module,production
```

Команда создаёт `importmap.json` с правильными URL для всех транзитивных зависимостей.

## Поддержка браузеров

Import Maps поддерживаются всеми современными браузерами:

- Chrome / Edge — с версии 89
- Firefox — с версии 108
- Safari — с версии 16.4

Для проверки поддержки в коде:

```javascript
if (HTMLScriptElement.supports && HTMLScriptElement.supports('importmap')) {
  console.log('Import Maps поддерживаются');
} else {
  console.log('Нужен полифилл');
}
```

## Сравнение с подходами без Import Maps

```javascript
// Без Import Maps — длинные CDN-пути в каждом файле
import { debounce } from 'https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js';

// С Import Maps — чистый bare specifier, URL только в одном месте
import { debounce } from 'lodash';
```

Когда вы решите обновить версию библиотеки, изменить нужно только Import Map — все импорты в коде остаются нетронутыми.

## Полный рабочий пример

Пример мини-приложения, использующего несколько пакетов через Import Maps без сборщика:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Список задач</title>
  <script type="importmap">
    {
      "imports": {
        "uuid": "https://cdn.jsdelivr.net/npm/uuid@9/dist/esm-browser/index.js",
        "@utils/": "/src/utils/"
      }
    }
  </script>
</head>
<body>
  <form id="form">
    <input id="input" placeholder="Новая задача" required />
    <button type="submit">Добавить</button>
  </form>
  <ul id="list"></ul>

  <script type="module">
    import { v4 as uuidv4 } from 'uuid';
    import { escapeHtml } from '@utils/escape.js';

    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const list = document.getElementById('list');

    const tasks = [];

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const task = { id: uuidv4(), text: input.value };
      tasks.push(task);
      input.value = '';
      render();
    });

    function render() {
      list.innerHTML = tasks
        .map(t => `<li data-id="${t.id}">${escapeHtml(t.text)}</li>`)
        .join('');
    }
  </script>
</body>
</html>
```

```javascript
// /src/utils/escape.js
export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

Это полностью работающее приложение — никаких `node_modules`, никакого `webpack.config.js`, никакого шага сборки.

## Итог

Import Maps — нативный стандарт, который приближает браузерную разработку к серверной: bare specifiers, централизованное управление версиями, scoped переопределения. Они не вытесняют сборщики для production-сборок, но существенно упрощают прототипирование, тестирование и разработку без шага сборки.

Глубже разобраться в модульной системе JavaScript, асинхронности и современным возможностям языка можно на курсе PurpleSchool: [JavaScript с нуля до PRO](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=import-maps).