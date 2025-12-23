---
metaTitle: ESLint плагин eslint-plugin - создание и настройка
metaDescription: Подробное руководство по созданию и настройке собственного ESLint плагина - разбор структуры eslint-plugin правил конфигурации и тестирования
author: Олег Марков
title: ESLint плагин eslint-plugin - как создавать и использовать собственные правила
preview: Узнайте как устроены ESLint плагины на примере eslint-plugin - структура проекта написание и подключение правил работа с AST и тестирование
---

## Введение

ESLint давно стал стандартом де-факто для анализа качества JavaScript и TypeScript кода. Однако часто встроенных правил не хватает, и вам нужно описать свои требования к стилю и качеству кода. В таких случаях на помощь приходят плагины ESLint, которые добавляют новые правила, конфигурации, процессоры и даже целые наборы best practices.

Здесь мы разберем, как устроен ESLint плагин (eslint-plugin), как создать собственный пакет, как написать кастомное правило, как его протестировать и подключить в реальном проекте. Смотрите, я покажу вам, как это работает шаг за шагом, чтобы вы могли потом спокойно повторить это в своих проектах.

## Что такое ESLint плагин

### Задачи и возможности плагина

ESLint плагин — это обычный npm‑пакет, который расширяет возможности ESLint. Плагин может:

- добавлять новые правила (rules);
- предоставлять готовые конфигурации (configs);
- подключать процессоры для нестандартных файлов;
- экспортировать утилиты для других разработчиков.

Чаще всего под eslint-plugin имеют в виду именно набор правил. Например, вы можете:

- запретить использование определенных функций;
- навязать единый стиль написания тестов;
- контролировать использование специфичных API фреймворка;
- проверять архитектурные ограничения (например, что слои приложения не зависят друг от друга неправильно).

### Как ESLint загружает плагины

Чтобы плагин заработал, ESLint должен:

1. Найти npm‑пакет, имя которого начинается с eslint-plugin- или указано с префиксом плагина.
2. Загрузить его как обычный Node.js модуль.
3. Ожидать экспорт объекта с полями, среди которых чаще всего:
   - rules — список правил;
   - configs — готовые пресеты (например recommended).

Когда вы пишете в конфиге ESLint:

- `plugins: ["myplugin"]`
- `rules: { "myplugin/my-rule": "error" }`

ESLint ищет пакет eslint-plugin-myplugin, загружает его и берет оттуда rule с именем my-rule.

## Структура проекта eslint-plugin

### Базовая структура пакета

Давайте разберем типичную структуру репозитория ESLint плагина:

- package.json
- index.js / lib/index.js
- lib/rules/
- lib/configs/ (опционально)
- tests/ или test/ с тестами для правил

Обычно структура для Node.js модуля плагина выглядит так:

- lib/index.js — точка входа для плагина;
- lib/rules/my-rule.js — файл с реализацией правила;
- lib/configs/recommended.js — файл с набором правил по умолчанию.

Давайте посмотрим минимальный пример.

### Пример минимального плагина

Допустим, вы хотите создать плагин eslint-plugin-demo, который содержит одно правило no-console-log, запрещающее console.log.

Структура:

- package.json
- lib/index.js
- lib/rules/no-console-log.js

#### package.json

```json
{
  "name": "eslint-plugin-demo",
  "version": "1.0.0",
  "main": "lib/index.js",
  "peerDependencies": {
    "eslint": "^9.0.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

// Здесь мы объявляем пакет eslint-plugin-demo
// В peerDependencies указываем eslint - чтобы он был установлен в проекте пользователя

#### lib/index.js

```js
// Здесь мы описываем публичный интерфейс плагина
// Объект module.exports будет загружать ESLint, когда подключает плагин

module.exports = {
  rules: {
    // Регистрируем правило с именем "no-console-log"
    "no-console-log": require("./rules/no-console-log")
  },
  configs: {
    // Опционально - конфигурация "recommended"
    // Она позволяет пользователю включать набор правил одной строкой
    recommended: {
      rules: {
        "demo/no-console-log": "error"
      }
    }
  }
};
```

#### lib/rules/no-console-log.js

```js
// Это файл с реализацией правила "no-console-log"

module.exports = {
  // meta описывает правило для ESLint и IDE
  meta: {
    type: "problem", // Тип - "problem" - потенциальная ошибка
    docs: {
      description: "Запрещает использование console.log",
      recommended: true
    },
    schema: [], // Нет опций для этого правила
    messages: {
      noConsoleLog: "Использование console.log запрещено"
    }
  },

  // create - основная функция правила
  // context - объект, через который правило взаимодействует с ESLint
  create(context) {
    // Возвращаем набор обработчиков для разных типов AST-узлов
    return {
      // Нас интересуют вызовы функции - CallExpression
      CallExpression(node) {
        // Проверяем, что это console.log(...)
        // node.callee - это выражение слева от скобок
        if (
          node.callee &&
          node.callee.type === "MemberExpression" &&
          node.callee.object &&
          node.callee.object.name === "console" &&
          node.callee.property &&
          node.callee.property.name === "log"
        ) {
          // Сообщаем об ошибке
          context.report({
            node,
            messageId: "noConsoleLog"
          });
        }
      }
    };
  }
};
```

// В этом коде мы подписываемся на все вызовы функций
// И если встречаем console.log - генерируем ошибку

Теперь у вас есть минимально рабочий ESLint плагин.

## Как создается правило ESLint внутри плагина

### Общая структура файла правила

Каждое правило — это модуль, который экспортирует объект с двумя ключевыми частями:

- meta — статическая информация о правиле;
- create(context) — функция, которая возвращает набор обработчиков AST-узлов.

Шаблон:

```js
module.exports = {
  meta: {
    type: "problem", // "problem" | "suggestion" | "layout"
    docs: {
      description: "Краткое описание правила",
      recommended: false
    },
    schema: [
      // Описание опций правила (JSON Schema)
    ],
    messages: {
      // Строки сообщений для report
      someMessageId: "Текст сообщения об ошибке"
    },
    fixable: "code" // или "whitespace" или ничего, если правило не умеет исправлять
  },

  create(context) {
    // Здесь вы подписываетесь на нужные типы AST-узлов
    return {
      // "ТипУзла"(node) - обработчик
      Identifier(node) {
        // Здесь вы можете анализировать идентификаторы
      }
    };
  }
};
```

Смотрите, дальше я покажу вам на примере, как использовать эти части для реального правила.

### Как работает create(context)

Функция create вызывается ESLint один раз для файла, который анализируется. Она получает объект context и возвращает объект с обработчиками узлов.

Каждый ключ в возвращаемом объекте — это имя типа узла AST (например, VariableDeclarator, FunctionDeclaration, CallExpression и т.д.) или более сложный "селектор" (подобно CSS-селекторам, но для AST).

Когда ESLint обходит дерево разбора кода, он:

- при входе в узел вызывает соответствующий обработчик;
- передает в него объект node;
- вы можете анализировать node и при необходимости вызывать context.report.

Теперь вы увидите, как это выглядит в коде более сложного правила.

### Пример правила с опциями и автофиксом

Допустим, вам нужно правило, которое:

- запрещает использование var;
- предлагает заменить var на let или const;
- принимает опцию, которая определяет, на что именно заменять.

#### lib/rules/no-var.js

```js
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Запрещает использование var - используйте let или const",
      recommended: true
    },
    schema: [
      // Единственная опция - строка "let" или "const"
      {
        type: "string",
        enum: ["let", "const"]
      }
    ],
    fixable: "code",
    messages: {
      noVar: "Используйте {{ replacement }} вместо var"
    }
  },

  create(context) {
    // Берем первую опцию - желаемую замену
    const replacement = context.options[0] || "let";

    return {
      VariableDeclaration(node) {
        // Проверяем, что объявление сделано с var
        if (node.kind === "var") {
          context.report({
            node,
            messageId: "noVar",
            data: { replacement },
            fix(fixer) {
              // fixer - объект, позволяющий вернуть изменения кода
              // Мы заменяем ключевое слово "var" на replacement
              // node.range[0] и node.range[1] - диапазон узла в исходном коде
              // node.kind - текст "var"
              return fixer.replaceTextRange(
                // Берем диапазон только для ключевого слова
                // В упрощенном примере используем node.start и длину слова "var"
                // На практике лучше использовать sourceCode.getFirstToken
                [node.range[0], node.range[0] + 3],
                replacement
              );
            }
          });
        }
      }
    };
  }
};
```

// В этом примере мы:
// 1. Читаем опцию replacement из context.options
// 2. Находим объявления переменных с var
// 3. Репортим ошибку и предлагаем автофикс - замену var на let или const

Обратите внимание, что для более точной работы с токенами обычно используют методы context.getSourceCode(), но здесь мы упрощаем пример ради понятности.

## Работа с AST в ESLint правилах

### Откуда берется AST

ESLint использует парсер (по умолчанию Espree), чтобы перевести исходный код в абстрактное синтаксическое дерево (AST). Каждое правило видит это дерево через объекты node, которые приходят в обработчики.

Для TypeScript обычно используют парсер @typescript-eslint/parser. Важно понимать, что структура AST может немного отличаться в зависимости от парсера, но общие принципы остаются.

### Как понять, какие типы узлов использовать

Чтобы писать правила осознанно, вам нужно знать:

- какие типы узлов существуют;
- какие у них свойства.

Для этого удобно использовать:

- сайт AST Explorer (astexplorer.net) с выбранным парсером (Espree или @typescript-eslint/parser);
- официальную документацию ESTree.

Давайте разберем на примере, как найти все вызовы функции alert и запретить их.

#### Пример правила no-alert

```js
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Запрещает использование alert",
      recommended: false
    },
    schema: [],
    messages: {
      noAlert: "Использование alert не рекомендуется"
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        // Ищем вызов вида alert(...)
        // В AST это Identifier с именем "alert"
        if (node.callee.type === "Identifier" && node.callee.name === "alert") {
          context.report({
            node,
            messageId: "noAlert"
          });
        }
      }
    };
  }
};
```

// Здесь мы изучили AST для кода alert("hi")
// И выяснили, что это CallExpression с callee типа Identifier

Таким образом, когда вы разрабатываете новое правило, полезно:

1. Взять пример кода, который нужно ловить.
2. Вставить его в AST Explorer.
3. Посмотреть, как выглядит нужный фрагмент в AST.
4. Написать обработчик для соответствующих типов узлов.

## Подключение страницы правил и конфигураций в плагине

### Секция rules в плагине

В файле lib/index.js вы экспортируете объект rules:

```js
module.exports = {
  rules: {
    "no-console-log": require("./rules/no-console-log"),
    "no-var": require("./rules/no-var")
  }
};
```

// Ключи - это имена правил внутри плагина
// Значения - модули с реализацией правил

Пользователь будет ссылаться на эти правила в конфиге ESLint так:

- `"demo/no-console-log": "error"`
- `"demo/no-var": ["error", "const"]`

где demo — это "имя плагина без префикса eslint-plugin-".

### Секция configs в плагине

Здесь вы можете собрать несколько правил в готовый пресет. Часто используются имена recommended или all.

Пример:

```js
module.exports = {
  rules: {
    "no-console-log": require("./rules/no-console-log"),
    "no-var": require("./rules/no-var")
  },
  configs: {
    recommended: {
      // Эта конфигурация включает наши правила
      rules: {
        "demo/no-console-log": "warn",
        "demo/no-var": ["error", "const"]
      }
    },
    strict: {
      // Более строгий набор правил
      rules: {
        "demo/no-console-log": "error",
        "demo/no-var": ["error", "let"]
      }
    }
  }
};
```

// В конфиге вы используете полные имена правил с префиксом "demo/"
// То есть так же, как будет использовать пользователь

Подключая эту конфигурацию, пользователь может написать:

```js
// .eslintrc.js
module.exports = {
  plugins: ["demo"],
  extends: ["plugin:demo/recommended"],
  rules: {
    // Здесь можно переопределить настройки
  }
};
```

// plugin:demo/recommended - это указание взять конфиг "recommended" из плагина "demo"

## Создание собственного eslint-plugin с нуля

Теперь давайте разберем весь процесс создания плагина пошагово.

### Шаг 1. Инициализация npm проекта

```bash
mkdir eslint-plugin-demo
cd eslint-plugin-demo

# Инициализируем npm
npm init -y
```

// Здесь мы создаем новый каталог и делаем его npm-пакетом

После этого откройте package.json и скорректируйте:

- name: "eslint-plugin-demo"
- main: "lib/index.js"
- peerDependencies: eslint
- engines: node

### Шаг 2. Установка зависимостей

```bash
npm install --save-dev eslint
```

// Устанавливаем ESLint для разработки и тестирования плагина

Если будете писать правила на TypeScript или использовать утилиты, можно добавить дополнительные пакеты, но для базового плагина достаточно eslint.

### Шаг 3. Создание структуры каталогов

```bash
mkdir -p lib/rules
```

Создайте файл lib/index.js:

```js
module.exports = {
  rules: {
    // Позже добавим сюда правила
  },
  configs: {
    // Позже добавим сюда конфиги
  }
};
```

// Пока это пустой каркас плагина

### Шаг 4. Написание первого правила

Добавим правило lib/rules/no-console-log.js (пример из начала статьи, можно упростить или изменить):

```js
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Запрещает использование console.log",
      recommended: true
    },
    schema: [],
    messages: {
      noConsoleLog: "Использование console.log запрещено"
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.type === "MemberExpression" &&
          node.callee.object &&
          node.callee.object.name === "console" &&
          node.callee.property &&
          node.callee.property.name === "log"
        ) {
          context.report({
            node,
            messageId: "noConsoleLog"
          });
        }
      }
    };
  }
};
```

Теперь зарегистрируем это правило в lib/index.js:

```js
module.exports = {
  rules: {
    "no-console-log": require("./rules/no-console-log")
  },
  configs: {
    recommended: {
      rules: {
        "demo/no-console-log": "error"
      }
    }
  }
};
```

### Шаг 5. Локальное тестирование плагина в реальном проекте

Есть два основных подхода:

1. Линковка через npm link.
2. Локальная установка через путь к папке.

#### Вариант 1. npm link

Внутри папки eslint-plugin-demo:

```bash
npm link
```

// Регистрируем глобальную ссылку на этот пакет

В вашем тестовом проекте:

```bash
npm link eslint-plugin-demo
```

// Подключаем глобальную ссылку в текущий проект

Теперь в .eslintrc.js тестового проекта можете написать:

```js
module.exports = {
  plugins: ["demo"], // имя без "eslint-plugin-"
  rules: {
    "demo/no-console-log": "error"
  }
};
```

#### Вариант 2. Локальная установка из файловой системы

В тестовом проекте:

```bash
npm install --save-dev ../eslint-plugin-demo
```

// Устанавливаем плагин из локальной папки

Дальше настройки такие же, как при установке из npm.

## Тестирование правил внутри ESLint плагина

### Почему важно писать тесты для правил

Правила ESLint часто содержат нетривиальную логику и могут обрабатываться большим количеством разработчиков. Даже небольшая ошибка может:

- сломать сборку CI;
- неправильно подсветить код в IDE;
- предлагать некорректные автофиксы.

Поэтому в мире ESLint принято писать тесты для каждого правила с помощью RuleTester.

### Настройка RuleTester

Внутри плагина создадим папку tests/rules/ и файл no-console-log.js:

```js
// tests/rules/no-console-log.js
const { RuleTester } = require("eslint");
const rule = require("../../lib/rules/no-console-log");

// Создаем инстанс RuleTester
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020, // Версия ECMAScript, которую мы хотим поддерживать
    sourceType: "module"
  }
});

// Описываем тесты
ruleTester.run("no-console-log", rule, {
  valid: [
    // Код, который НЕ должен вызывать ошибок
    "console.error('error')",
    "log('some')"
  ],
  invalid: [
    {
      // Код, который должен дать ошибку
      code: "console.log('test')",
      errors: [
        {
          messageId: "noConsoleLog"
        }
      ]
    }
  ]
});
```

// Здесь мы проверяем, что console.error не трогается
// А console.log вызывает нашу ошибку с messageId "noConsoleLog"

### Запуск тестов

Обычно тесты запускают через команду npm test. В package.json добавьте:

```json
{
  "scripts": {
    "test": "node tests/rules/no-console-log.js"
  }
}
```

// В реальных проектах часто используют Mocha или Jest для запуска всех тестов
// Но для простоты можно запускать RuleTester напрямую

Потом:

```bash
npm test
```

Если правило работает корректно, ошибок не будет, а при проблемах вы увидите подробный вывод.

## Лучшие практики при разработке eslint-plugin

### Четкая граница ответственности правил

Старайтесь, чтобы каждое правило решало одну понятную задачу. Например:

- одно правило занимается console.log;
- другое — только var;
- третье — только архитектурными зависимостями.

Так пользователю удобнее:

- включать и отключать нужные правила;
- понимать сообщения об ошибках;
- настраивать уровни строгости.

### Понятные сообщения и документация

В meta.docs.description старайтесь писать конкретное и короткое описание. В messages используйте ясные формулировки без жаргона.

Пример:

```js
messages: {
  missingId: "Элемент должен иметь атрибут id",
  noPublicField: "Публичные поля класса не разрешены - используйте приватные поля или аксессоры"
}
```

Это помогает и в IDE, и в CI-логах.

### Аккуратное использование автофиксов

Автофиксы — мощный инструмент, но ими легко повредить код. Несколько рекомендаций:

- делайте фиксы только тогда, когда уверены в корректности результата;
- избегайте автоисправления, которое может изменить поведение программы;
- проверяйте автофиксы в тестах RuleTester с секцией output.

Пример теста с проверкой автофикса:

```js
ruleTester.run("no-var", rule, {
  valid: [],
  invalid: [
    {
      code: "var x = 1;",
      output: "let x = 1;", // Ожидаемый результат после автофикса
      errors: [{ messageId: "noVar" }]
    }
  ]
});
```

// Здесь мы проверяем не только наличие ошибки
// Но и то, что автофикс меняет var на let

### Поддержка разных версий ESLint и Node

В package.json:

- указывайте диапазон peerDependencies для eslint;
- указывайте engines.node, чтобы пользователи знали, какие версии поддерживаются.

Например:

```json
"peerDependencies": {
  "eslint": "^8.0.0 || ^9.0.0"
},
"engines": {
  "node": ">=18"
}
```

## Использование сторонних утилит для правил

### @eslint-community/eslint-utils

Чтобы не изобретать велосипед, можно использовать готовые утилиты. Один из популярных пакетов — @eslint-community/eslint-utils. Он помогает:

- работать с AST;
- создавать сообщения об ошибках;
- проверять опции правила.

Пример использования:

```js
// Пример (упрощенный) - как вы могли бы использовать RuleTester из этого пакета
const { RuleTester } = require("@eslint-community/eslint-utils");

// Здесь RuleTester может быть оберткой над стандартным ESLint RuleTester с дополнительными возможностями
```

// В реальном проекте обязательно смотрите документацию к пакету
// Там есть полезные функции типа getStaticValue и другие

### @typescript-eslint/utils

Если вы пишете правила для TypeScript, сильно помогает @typescript-eslint/utils:

- экспортирует типы и утилиты для работы с AST TypeScript;
- помогает не ошибаться при поддержке TS-синтаксиса.

Использовать его стоит, если ваш плагин целенаправленно заточен под TypeScript.

## Пример полноценного маленького eslint-plugin

Давайте соберем мини-плагин eslint-plugin-clean-code, который содержит:

- правило no-console-log;
- правило no-var;
- конфигурацию recommended, включающую оба правила.

### Структура

- package.json
- lib/index.js
- lib/rules/no-console-log.js
- lib/rules/no-var.js
- tests/rules/no-console-log.js
- tests/rules/no-var.js

### lib/index.js

```js
module.exports = {
  rules: {
    "no-console-log": require("./rules/no-console-log"),
    "no-var": require("./rules/no-var")
  },
  configs: {
    recommended: {
      rules: {
        "clean-code/no-console-log": "error",
        "clean-code/no-var": ["error", "const"]
      }
    }
  }
};
```

### lib/rules/no-console-log.js

(пример мы уже подробно разбирали выше, можно использовать тот же код)

### lib/rules/no-var.js

(также берем из примера с опциями и автофиксом, при желании дорабатываем работу с токенами через sourceCode)

### tests/rules/no-console-log.js

```js
const { RuleTester } = require("eslint");
const rule = require("../../lib/rules/no-console-log");

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: "module" }
});

ruleTester.run("no-console-log", rule, {
  valid: ["console.error('error')", "log('test')"],
  invalid: [
    {
      code: "console.log('hello')",
      errors: [{ messageId: "noConsoleLog" }]
    }
  ]
});
```

### tests/rules/no-var.js

```js
const { RuleTester } = require("eslint");
const rule = require("../../lib/rules/no-var");

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: "module" }
});

ruleTester.run("no-var", rule, {
  valid: [
    "let x = 1;",
    "const y = 2;"
  ],
  invalid: [
    {
      code: "var x = 1;",
      output: "let x = 1;", // Если replacement по умолчанию "let"
      errors: [{ messageId: "noVar" }]
    }
  ]
});
```

Теперь вы можете:

- локально прогонять тесты;
- линковать плагин в другие проекты;
- публиковать пакет в npm, когда он стабилен.

## Заключение

ESLint плагины (eslint-plugin) позволяют формализовать требования к коду, которые выходят за рамки стандартных правил. Вы можете:

- создать собственный npm‑пакет с правилами;
- описать логику проверки через AST;
- предоставить готовые конфигурации вроде recommended;
- протестировать каждое правило через RuleTester и быть уверенным в стабильной работе.

Ключевые моменты, которые важно помнить:

- каждое правило — это модуль с meta и create;
- create возвращает набор обработчиков AST-узлов;
- context.report — основной способ сообщить об ошибке;
- автофиксы нужно использовать аккуратно и обязательно покрывать тестами;
- в lib/index.js вы регистрируете правила и конфиги, а название пакета должно начинаться с eslint-plugin-.

Когда вы освоите базовый цикл "написал правило — протестировал — подключил", вы сможете постепенно добавлять более сложные проверки, интегрировать TypeScript, использовать дополнительные утилиты и строить вокруг плагина собственные стандарты кодирования.

## Частозадаваемые технические вопросы по теме статьи

### 1. Как заставить правило работать только для файлов с определенным расширением

ESLint сам не передает расширение файла в правило напрямую, но вы можете получить имя файла через context.getFilename().

Мини-инструкция:

```js
create(context) {
  const filename = context.getFilename();

  // Например - включать правило только для .js файлов
  if (!filename.endsWith(".js")) {
    return {}; // Не регистрируем ни одного обработчика
  }

  return {
    CallExpression(node) {
      // Здесь правило будет работать только для .js
    }
  };
}
```

### 2. Как получить исходный текст узла внутри правила

Для этого используется объект SourceCode, который можно взять из context.

Мини-инструкция:

```js
create(context) {
  const sourceCode = context.getSourceCode();

  return {
    Identifier(node) {
      const text = sourceCode.getText(node);
      // text - строка исходного кода для данного узла
    }
  };
}
```

### 3. Как сделать правило, зависящее от настроек проекта ESLint (например parserOptions)

Иногда нужно знать настройки парсера, используемые ESLint. Их можно получить через context.getParserOptions().

```js
create(context) {
  const parserOptions = context.getParserOptions();
  // Например - проверить ecmaVersion
  const ecmaVersion = parserOptions.ecmaVersion;

  return {
    // Используйте ecmaVersion в логике при необходимости
  };
}
```

### 4. Как разрешить правило только при наличии определенной зависимости в package.json

Правило может прочитать package.json проекта через Node.js fs и path. Делайте это осторожно, чтобы не снижать производительность.

Мини-инструкция:

```js
const fs = require("fs");
const path = require("path");

function hasDependency(depName) {
  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return (
      (pkg.dependencies && pkg.dependencies[depName]) ||
      (pkg.devDependencies && pkg.devDependencies[depName])
    );
  } catch {
    return false;
  }
}

module.exports = {
  create(context) {
    const enabled = hasDependency("react");

    if (!enabled) {
      return {};
    }

    return {
      // Логика правила - будет работать только если есть зависимость "react"
    };
  }
};
```

### 5. Как сделать правило для TypeScript кода в общем ESLint плагине

Чтобы правило понимало TypeScript, вам нужно:

1. Настроить парсер @typescript-eslint/parser в конфиге ESLint.
2. В правиле учитывать возможные отличия AST.

Мини-инструкция:

- В конфиге ESLint:

```js
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  plugins: ["your-plugin"],
  rules: {
    "your-plugin/your-ts-rule": "error"
  }
};
```

- В правиле используйте AST Explorer с парсером @typescript-eslint/parser, чтобы увидеть реальные типы узлов и их поля, а затем пишите обработчики по тем же принципам, что и для обычного JS кода.