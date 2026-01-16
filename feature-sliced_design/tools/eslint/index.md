---
metaTitle: ESLint плагин eslint-plugin - полное руководство по созданию и настройке
metaDescription: Узнайте как работает ESLint плагин eslint-plugin - разберитесь с архитектурой правил настройкой конфигураций и созданием собственных плагинов с примерами
author: Олег Марков
title: ESLint плагин eslint-plugin - создание конфигурация и практическое использование
preview: Исследуйте как устроены ESLint плагины - eslint-plugin - научитесь писать собственные правила добавлять конфигурации и интегрировать плагин в проект
---

## Введение

ESLint плагины позволяют расширять базовые возможности ESLint и добавлять в проект собственные правила, линты для конкретных технологий и наборы конфигураций. Если вы когда‑нибудь подключали eslint-plugin-react, eslint-plugin-import или eslint-plugin-jsx-a11y, вы уже работали с плагинами, даже если не задумывались о том, как они устроены внутри.

В этой статье вы разберетесь, как работает обычный ESLint плагин (пакет формата eslint-plugin-...), какие части он содержит, как написать свои правила, как тестировать поведение плагина и как подключать его в проект. Смотрите, я покажу вам, как это устроено шаг за шагом, с примерами кода и комментариями.

---

## Что такое ESLint плагин и как он устроен

### Задачи ESLint плагина

Плагин ESLint — это обычный npm-пакет, который экспортирует набор расширений для ESLint. В плагине обычно есть:

- правила (rules) — логика анализа кода;
- предустановленные конфигурации (configs) — наборы правил с готовыми настройками;
- процессоры (processors) — преобразование нестандартных файлов в JavaScript-код для анализа;
- дополнительные настройки (environment, globals), если это нужно.

Когда вы подключаете плагин в ESLint-конфигурацию, вы получаете новый "именной" набор правил: rule-name внутри плагина становится доступен как plugin-name/rule-name.

Например:
- правило no-missing-import из eslint-plugin-import включается как import/no-unresolved;
- правило jsx-uses-react из eslint-plugin-react — как react/jsx-uses-react.

### Структура типичного плагина

Давайте разберемся, как обычно выглядит структура проекта eslint-plugin-имя:

- package.json  
- lib/  
  - index.js — точка входа плагина  
  - rules/  
    - no-foo.js — реализация отдельного правила  
    - require-bar.js — еще одно правило  
  - configs/  
    - recommended.js — рекомендованный набор правил  
    - strict.js — более строгая конфигурация  
  - processors/ (необязательно)  
    - markdown.js — пример процессора для .md файлов  
- tests/ или __tests__/ — тесты для правил и конфигураций  

Важное требование: плагин должен экспортировать объект с ожидаемой структурой. Сейчас стандартная форма экспорта выглядит так:

- для CommonJS: module.exports = { rules, configs, processors }
- для ESM: export default { rules, configs, processors }

ESLint находит плагин по имени в package.json (eslint-plugin-имя), а вы в конфиге указываете только часть после префикса: имя.

---

## Минимальный пример плагина eslint-plugin-myplugin

### Инициализация проекта

Сначала создадим новый npm-пакет. Давайте разберемся на примере.

```bash
mkdir eslint-plugin-myplugin
cd eslint-plugin-myplugin

# Инициализируем package.json
npm init -y
```

Теперь корректируем package.json. Обратите внимание на имя: оно должно начинаться с eslint-plugin-, чтобы ESLint мог корректно его находить.

```jsonc
{
  "name": "eslint-plugin-myplugin",   // имя пакета
  "version": "1.0.0",
  "main": "lib/index.js",             // точка входа для ESLint
  "type": "commonjs",                 // будем использовать CommonJS для простоты
  "peerDependencies": {
    "eslint": "^9.0.0"                // требуемая версия ESLint
  }
}
```

Здесь peerDependencies говорит: "плагину нужен ESLint, но устанавливать вы его будете сами в своем проекте". Это стандартный подход для eslint-плагинов.

Создадим базовую структуру каталогов:

```bash
mkdir -p lib/rules
mkdir -p lib/configs
```

---

### Файл lib/index.js — точка входа плагина

Теперь добавим самый важный файл — lib/index.js. Именно его будет импортировать ESLint, когда вы подключите плагин:

```js
// lib/index.js

// Подключаем правила из локальной папки
const noFooRule = require("./rules/no-foo");

// Подключаем конфиги
const recommendedConfig = require("./configs/recommended");

module.exports = {
  // Здесь мы регистрируем все правила плагина
  rules: {
    // Имя правила внутри плагина - объект с реализацией
    "no-foo": noFooRule
  },

  // Здесь мы объявляем доступные конфигурации
  configs: {
    // Конфигурация "myplugin/recommended"
    recommended: recommendedConfig
  }

  // Здесь могли бы быть processors или другие поля
};
```

Смотрите, здесь важны две вещи:

1. Ключевые свойства:
   - rules — словарь доступных правил;
   - configs — словарь предустановленных конфигураций.
2. Имя "no-foo" внутри rules станет доступно как myplugin/no-foo в конфиге ESLint.

---

## Создание собственного правила ESLint внутри плагина

Теперь переходим к самой интересной части: как описать собственное правило.

### Общая структура файла правила

Каждое правило — это объект с описанием метаданных и функцией create. Давайте посмотрим на типичную структуру:

```js
// lib/rules/no-foo.js

/**
 * Простое правило, запрещающее идентификатор "foo".
 * Например: const foo = 1; будет ошибкой.
 */
module.exports = {
  meta: {
    type: "problem", // тип правила - влияет на категорию в отчетах ESLint

    docs: {
      description: "Запрещает использование идентификатора foo",
      recommended: true // может использоваться при генерации конфигов
    },

    schema: [], // здесь можно описать опции правила

    messages: {
      noFoo: 'Нельзя использовать идентификатор "foo"' // шаблон сообщения
    }
  },

  // Основная логика правила
  create(context) {
    // context - объект, который предоставляет API для работы с AST и отчетов

    return {
      // Подписываемся на конкретные типы AST-узлов
      Identifier(node) {
        // Проверяем, что имя идентификатора - "foo"
        if (node.name === "foo") {
          context.report({
            node,              // узел, к которому относится ошибка
            messageId: "noFoo" // ссылка на шаблон сообщения из meta.messages
          });
        }
      }
    };
  }
};
```

Обратите внимание, как это работает:

- ESLint парсит ваш код в AST (абстрактное синтаксическое дерево);
- для каждого узла типа Identifier он вызывает ваш обработчик;
- если вы находите нарушение, вы вызываете context.report.

#### Поле meta

Поле meta — это "паспорт" правила:

- type: "problem" | "suggestion" | "layout"  
  помогает пользователям понимать, какого типа проблему решает правило;
- docs — описание для документации;
- schema — описание опций правила (валидируется ESLint);
- messages — именованные шаблоны сообщений;
- fixable (опционально) — "code" или "whitespace", если правило можно автоисправлять.

### Добавление автофиксера в правило

Часто хочется, чтобы правило не только находило проблему, но и предлагало исправление. Давайте доработаем правило no-foo так, чтобы оно заменяло foo на bar.

```js
// lib/rules/no-foo.js

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Запрещает использование идентификатора foo и предлагает заменить на bar",
      recommended: true
    },
    schema: [],
    messages: {
      noFoo: 'Нельзя использовать идентификатор "foo" - замените на "bar"'
    },
    fixable: "code" // говорим ESLint, что правило поддерживает автофиксы
  },

  create(context) {
    return {
      Identifier(node) {
        if (node.name === "foo") {
          context.report({
            node,
            messageId: "noFoo",
            fix(fixer) {
              // Здесь я показываю, как можно изменить код
              return fixer.replaceText(node, "bar");
              // Важно - всегда возвращать изменения через fixer
            }
          });
        }
      }
    };
  }
};
```

Как видите, добавился метод fix. Он принимает fixer — специальный объект, с помощью которого вы описываете изменения в коде. В данном случае мы просто заменяем текст узла Identifier на bar.

---

## Создание конфигураций внутри плагина

Одно из главных удобств плагина — возможность предоставить готовые конфигурации. Тогда пользователям достаточно написать:

- "extends": ["plugin:myplugin/recommended"]

и все нужные правила включатся автоматически.

### Пример файла конфигурации recommended

Создадим файл lib/configs/recommended.js:

```js
// lib/configs/recommended.js

// Здесь мы формируем объект конфигурации ESLint
module.exports = {
  // В базовой форме достаточно указать rules
  rules: {
    // Имя правила в конфиге - "уровень" или массив [уровень, опции]
    "myplugin/no-foo": "error" // включаем наше правило как ошибку
  }
};
```

Теперь давайте вернемся к lib/index.js и убедимся, что конфиг зарегистрирован:

```js
// lib/index.js

const noFooRule = require("./rules/no-foo");
const recommendedConfig = require("./configs/recommended");

module.exports = {
  rules: {
    "no-foo": noFooRule
  },
  configs: {
    recommended: recommendedConfig
  }
};
```

---

## Как подключить плагин в реальный проект

Теперь у нас есть минимальный рабочий плагин. Посмотрим, как его подключить в обычном проекте.

### Установка плагина

Если плагин опубликован в npm, установка выглядит стандартно:

```bash
npm install --save-dev eslint eslint-plugin-myplugin
```

Если вы разрабатываете плагин локально и хотите сразу же тестировать его в своем проекте, можно использовать npm link:

```bash
# В папке плагина
npm link

# В целевом проекте
npm link eslint-plugin-myplugin
```

Так вы сможете менять код плагина и сразу проверять эффекты в проекте без публикации.

### Подключение в .eslintrc

Допустим, в проекте есть файл .eslintrc.json. Подключим туда наш плагин и конфигурацию:

```jsonc
{
  "plugins": [
    "myplugin" // имя без префикса eslint-plugin-
  ],
  "extends": [
    "plugin:myplugin/recommended" // наша предустановленная конфигурация
  ],
  "rules": {
    // При желании можно переопределить настройки
    "myplugin/no-foo": "warn"
  }
}
```

Теперь при запуске ESLint:

```bash
npx eslint src/**/*.js
```

все использования идентификатора foo будут подсвечены, а при запуске с флагом --fix — автоматически заменены на bar (согласно нашему автофиксеру).

---

## Подробно про API правил и AST

Чтобы писать осмысленные правила, нужно понимать, с чем именно вы работаете. ESLint использует AST — дерево, которое описывает структуру кода.

### Как выбрать нужные узлы AST

Каждый обработчик в create — это имя типа узла AST. Например:

- VariableDeclarator — объявление переменной;
- CallExpression — вызов функции;
- FunctionDeclaration — объявление функции;
- MemberExpression — обращение к свойству (obj.prop).

Покажу вам пример правила, которое запрещает вызовы console.log:

```js
// lib/rules/no-console-log.js

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Запрещает использование console.log в коде",
      recommended: false
    },
    schema: [],
    messages: {
      unexpectedConsoleLog: 'Не используйте console.log - лучше примените логгер'
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        // Проверяем вызовы вида console.log(...)
        const callee = node.callee;

        // Убеждаемся, что это доступ к свойству (MemberExpression)
        if (
          callee.type === "MemberExpression" &&
          !callee.computed &&                 // console["log"] мы пока не трогаем
          callee.object.type === "Identifier" &&
          callee.object.name === "console" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "log"
        ) {
          context.report({
            node,
            messageId: "unexpectedConsoleLog"
          });
        }
      }
    };
  }
};
```

Здесь я размещаю пример, чтобы вам было проще понять, как ориентироваться в AST:

- мы "подписались" на CallExpression — все вызовы функций;
- среди них отфильтровали только console.log;
- для каждого такого вызова делаем report.

---

## Работа с опциями правила (schema)

Часто правило нужно сделать настраиваемым. Для этого в meta.schema описывается формат опций, а в create(context) вы извлекаете их через context.options.

### Пример правила с опциями

Давайте создадим правило, которое запрещает указанные идентификаторы. Список "запрещенных слов" будет передаваться в опциях.

```js
// lib/rules/no-bad-identifiers.js

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Запрещает использование определенных идентификаторов",
      recommended: false
    },
    // Ожидается массив строк в первой опции: ["foo", "bar"]
    schema: [
      {
        type: "array",
        items: {
          type: "string"
        },
        uniqueItems: true
      }
    ],
    messages: {
      forbiddenIdentifier: 'Идентификатор "{{name}}" запрещен этим правилом'
    }
  },

  create(context) {
    // Получаем список запрещенных имен
    const forbidden = context.options[0] || [];

    return {
      Identifier(node) {
        if (forbidden.includes(node.name)) {
          context.report({
            node,
            messageId: "forbiddenIdentifier",
            data: {
              // Здесь мы подставляем значение в шаблон сообщения
              name: node.name
            }
          });
        }
      }
    };
  }
};
```

Теперь давайте посмотрим, как это выглядит в конфигурации ESLint:

```jsonc
{
  "rules": {
    // Включаем правило и передаем опции
    "myplugin/no-bad-identifiers": ["error", ["foo", "bar", "baz"]]
  }
}
```

Как видите, этот код выполняет простую, но полезную задачу — позволяет централизованно запретить определенные имена в проекте.

---

## Организация документации для правил плагина

Чтобы пользователям вашего eslint-плагина было удобно им пользоваться, стоит добавить документацию. Распространенный подход — хранить документацию в отдельной папке docs/rules и генерировать README автоматически, но можно начать с простого варианта.

### Пример структуры документации

- docs/  
  - rules/  
    - no-foo.md  
    - no-bad-identifiers.md  
- README.md  

Внутри файла docs/rules/no-foo.md можно описать:

- цель правила;
- примеры кода "плохо" и "хорошо";
- доступные опции.

Пример содержимого:

```md
## myplugin/no-foo

Запрещает использование идентификатора foo и предлагает заменить его на bar.

### Неправильно

```js
const foo = 1;
console.log(foo);
```

### Правильно

```js
const bar = 1;
console.log(bar);
```
```

Комментарии в таких примерах кода тоже полезно добавлять, но зачастую правило очевидно. В более сложных случаях стоит помечать, почему тот или иной вариант считается ошибочным.

---

## Тестирование правил ESLint-плагина

Чтобы ваш плагин был надежным, важно покрыть правила тестами. ESLint предоставляет удобный помощник RuleTester.

### Настройка RuleTester

Сначала установите ESLint как dev-зависимость в проекте плагина (если еще не сделали):

```bash
npm install --save-dev eslint
```

Создадим простейший тест для правила no-foo. Предположим, у нас есть папка tests/lib/rules.

```bash
mkdir -p tests/lib/rules
```

Теперь добавим тест:

```js
// tests/lib/rules/no-foo.js

// Импортируем RuleTester из ESLint
const { RuleTester } = require("eslint");

// Импортируем наше правило
const rule = require("../../../lib/rules/no-foo");

// Создаем экземпляр RuleTester
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020, // указываем версию ECMAScript
    sourceType: "module"
  }
});

// Запускаем тесты для правила
ruleTester.run("no-foo", rule, {
  // Примеры кода, которые НЕ должны вызывать ошибок
  valid: [
    "const bar = 1;",            // здесь идентификатор bar
    "function baz() {}",         // здесь нет foo
    "let fooBar = 2;"            // foo не используется как отдельный идентификатор
  ],

  // Примеры кода, которые ДОЛЖНЫ вызвать ошибки
  invalid: [
    {
      code: "const foo = 1;",    // запрещенный идентификатор
      errors: [{ messageId: "noFoo" }]
    },
    {
      code: "function foo() {}", // тоже запрещенный идентификатор
      errors: [{ messageId: "noFoo" }]
    }
  ]
});
```

Теперь добавим скрипт в package.json:

```jsonc
{
  "scripts": {
    "test": "node ./node_modules/mocha/bin/mocha tests/**/*.js"
  },
  "devDependencies": {
    "mocha": "^10.0.0"
  }
}
```

Теперь вы можете запускать тесты правила:

```bash
npm test
```

Здесь я привел один из вариантов — с mocha. Можно использовать Jest или встроенный test runner Node.js — RuleTester от этого никак не зависит.

---

## Версия ESLint 9 и flat config против старого формата

С развитием ESLint появились два типа конфигураций:

- "старый" (eslintrc) — через .eslintrc.* файлы;
- "новый" (flat config) — через eslint.config.js.

Плагины типа eslint-plugin-... продолжают работать в обоих вариантах, но подключаются немного по-разному.

### Подключение плагина в flat config

Давайте посмотрим, как подключить eslint-plugin-myplugin в eslint.config.js.

```js
// eslint.config.js

// Импортируем плагин
const myplugin = require("eslint-plugin-myplugin");

// Экспортируем массив конфигураций
module.exports = [
  {
    files: ["**/*.js"],
    plugins: {
      // Ключ (myplugin) - имя плагина
      // Значение - сам импортированный объект
      myplugin
    },
    rules: {
      // Здесь мы сразу указываем имя правила через объект plugins
      "myplugin/no-foo": "error"
    }
  }
];
```

Если вы хотите использовать предустановленную конфигурацию recommended из плагина, то в flat config нет такого же синтаксиса plugin:myplugin/recommended. Вместо этого вы можете явно "подмешать" конфиг из плагина.

```js
// eslint.config.js

const myplugin = require("eslint-plugin-myplugin");

module.exports = [
  {
    files: ["**/*.js"],
    plugins: {
      myplugin
    },
    rules: {
      // Подключаем правила из myplugin.configs.recommended.rules
      ...myplugin.configs.recommended.rules
    }
  }
];
```

Теперь давайте перейдем к следующему аспекту — как сделать плагин более удобным, если вы хотите поддерживать оба типа конфигураций.

---

## Продвинутые возможности плагина

### Несколько конфигураций в одном плагине

Часто плагин предоставляет не одну, а несколько конфигураций:

- recommended — базовый набор;
- strict — строгий набор (больше правил, выше уровни);
- all — включает все правила плагина.

Пример lib/configs/strict.js:

```js
// lib/configs/strict.js

module.exports = {
  rules: {
    "myplugin/no-foo": "error",
    "myplugin/no-bad-identifiers": [
      "error",
      ["foo", "bar", "baz"] // здесь мы сразу задаем строгий запрет
    ]
  }
};
```

Тогда в index.js вы просто добавляете еще один ключ:

```js
// lib/index.js

const noFooRule = require("./rules/no-foo");
const noBadIdentifiersRule = require("./rules/no-bad-identifiers");
const recommendedConfig = require("./configs/recommended");
const strictConfig = require("./configs/strict");

module.exports = {
  rules: {
    "no-foo": noFooRule,
    "no-bad-identifiers": noBadIdentifiersRule
  },
  configs: {
    recommended: recommendedConfig,
    strict: strictConfig
  }
};
```

### Создание собственного environment или globals

Иногда плагин ориентирован на специфичную среду (например, тестовый раннер или платформу) и хочет добавить новые глобальные переменные.

Сейчас наиболее распространенный способ — добавить их в конфигурацию:

```js
// lib/configs/env.js

module.exports = {
  env: {
    browser: true
  },
  globals: {
    MY_GLOBAL: "readonly" // объявляем глобальную переменную
  },
  rules: {
    "myplugin/no-foo": "error"
  }
};
```

Подключение в eslintrc:

```jsonc
{
  "extends": [
    "plugin:myplugin/env"
  ]
}
```

---

## Типичные ошибки при создании eslint-плагина

Теперь давайте посмотрим, какие проблемы чаще всего встречаются, когда вы впервые пишете плагин.

### Ошибка 1: неправильное имя плагина

В package.json имя должно начинаться с eslint-plugin-. В конфиге ESLint вы используете только хвост:

- package.json: "name": "eslint-plugin-myplugin"
- .eslintrc: "plugins": ["myplugin"]

Если вы назовете пакет myplugin без префикса, ESLint не найдет его автоматически по имени плагина.

### Ошибка 2: отсутствие поля main или index.js

В package.json нужно указать main (или использовать стандартный index.js в корне). В нашем примере мы явно указали:

- "main": "lib/index.js"

Если main не указывает на правильный файл или index.js отсутствует, ESLint не сможет импортировать плагин.

### Ошибка 3: несовместимая версия ESLint

В peerDependencies нужно указывать реальную минимальную версию ESLint, с которой вы тестировали плагин. Если ваш плагин использует возможности RuleTester или API из ESLint 9, не стоит писать "^6.0.0" только ради "совместимости на бумаге".

### Ошибка 4: неправильная структура экспорта

Плагин должен экспортировать объект вида:

- module.exports = { rules, configs, processors }

Если вы случайно экспортируете rules напрямую, ESLint не сможет прочитать ни правила, ни конфиги.

---

## Заключение

ESLint плагины формата eslint-plugin-... — это мощный способ адаптировать линтинг под конкретные требования проекта или команды. Вы увидели, что под капотом плагин — всего лишь npm-пакет с понятной структурой:

- набор правил, каждое из которых — обычный объект с meta и create;
- конфигурации, которые собирают правила в удобные пресеты;
- опциональные env, globals и процессоры.

Давайте кратко зафиксируем основные шаги создания собственного плагина:

1. Создать пакет с именем eslint-plugin-имя.
2. Настроить main в package.json и подготовить файл lib/index.js.
3. Реализовать одно или несколько правил в lib/rules.
4. По желанию — описать рекомендованные/строгие конфигурации в lib/configs.
5. Покрыть правила тестами через RuleTester.
6. Опубликовать пакет или подключить его в проект локально и использовать через plugins и extends.

Если вы понимаете структуру AST и API create(context), дальше все сводится к формализации собственных "стайлгайдов" и требований в виде правил. А плагин — удобная оболочка, чтобы эти правила можно было переиспользовать между проектами и командами.

---

## Частозадаваемые технические вопросы по теме статьи

### Можно ли сделать правило только для TypeScript-кода внутри плагина

Да, можно. Для этого в тестах и в документации к правилу явно укажите, что требуется @typescript-eslint/parser, а в конфиге, который вы экспортируете из плагина, задайте parser:

```js
// lib/configs/typescript.js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["myplugin"],
  rules: {
    "myplugin/ts-only-rule": "error"
  }
};
```

Внутри create(context) вы сможете опираться на типы узлов, которые добавляет TypeScript-парсер.

---

### Как в плагине поддержать и CommonJS и ESM сразу

Один из вариантов — написать код на ESM и добавить обертку для CommonJS:

- основной код: export default { rules, configs }
- файл cjs/index.cjs, который делает require и module.exports = default.

Затем в package.json указать:

- "main": "cjs/index.cjs"
- "exports": { ".": { "require": "./cjs/index.cjs", "import": "./lib/index.js" } }

Так плагин будет корректно импортироваться и из старого ESLint, и из нового окружения с ESM.

---

### Как в тестах использовать flat config вместо eslintrc

RuleTester из ESLint 9 поддерживает режим flat config. Нужно передать параметр languageOptions и другие опции в конструктор RuleTester и использовать run с новым API. Конкретный пример есть в официальной документации ESLint 9, но идея в том, что конфигурация задается через параметры RuleTester, а не через .eslintrc.

---

### Можно ли из плагина временно выключать другие правила

Напрямую нет — правило не может программно влиять на включение других правил во время линтинга. Но вы можете:

- задокументировать, что ваш конфиг myplugin/strict не совместим с каким-то конкретным правилом;
- в своем конфиге явно выключить конфликтующее правило, установив "off".

---

### Как в одном плагине использовать разные парсеры для разных конфигов

Указывайте parser и parserOptions в каждой конфигурации отдельно:

```js
// lib/configs/react.js
module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaFeatures: { jsx: true }
  },
  plugins: ["myplugin"],
  rules: {
    "myplugin/jsx-rule": "error"
  }
};
```

Пользователь сам выбирает, какой конфиг подключить (например, plugin:myplugin/react или plugin:myplugin/recommended), и тем самым выбирает нужный парсер.