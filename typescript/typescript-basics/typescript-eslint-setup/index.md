---
metaTitle: "TypeScript ESLint: настройка линтера для проекта"
metaDescription: "Полное руководство по настройке ESLint для TypeScript-проекта: установка, конфигурация правил, интеграция с Prettier и IDE."
author: "Антон Ларичев"
title: "TypeScript ESLint — настройка линтера для проекта"
preview: "Узнайте, как настроить ESLint для TypeScript-проекта: установка пакетов, базовая и расширенная конфигурация, правила, Prettier."
---

## Что такое TypeScript ESLint

ESLint — это статический анализатор кода для JavaScript и TypeScript, который помогает находить и исправлять ошибки, обеспечивать единый стиль кода в команде и предотвращать типичные антипаттерны ещё до запуска программы.

По умолчанию ESLint работает только с JavaScript. Для TypeScript существует отдельный набор инструментов — `@typescript-eslint`, который включает:

- **парсер** (`@typescript-eslint/parser`) — разбирает TypeScript-код в AST, который понимает ESLint;
- **плагин** (`@typescript-eslint/eslint-plugin`) — набор правил, специфичных для TypeScript;
- **конфигурации** — готовые наборы правил (`recommended`, `strict`, `stylistic`).

Настройка линтера для TypeScript-проекта — это обязательный шаг в профессиональной разработке. Без него сложно поддерживать качество кода при росте команды и кодовой базы.

## Установка пакетов

Для начала убедитесь, что в проекте уже установлены `typescript` и `eslint`. Если нет — установите их.

```bash
npm install --save-dev typescript eslint
```

Затем установите пакеты TypeScript ESLint:

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Для проектов на React дополнительно потребуется:

```bash
npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks
```

Для интеграции с Prettier:

```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

## Базовая конфигурация

ESLint поддерживает несколько форматов конфигурационного файла. Начиная с ESLint 9.x используется новый формат Flat Config (`eslint.config.js`). Для ESLint 8.x применяется файл `.eslintrc.js` или `.eslintrc.json`.

### Конфигурация для ESLint 8.x

Создайте файл `.eslintrc.js` в корне проекта:

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {},
};
```

Поле `project` в `parserOptions` указывает на `tsconfig.json` и даёт парсеру доступ к информации о типах. Это необходимо для правил, требующих анализа типов (`type-aware rules`).

### Конфигурация для ESLint 9.x (Flat Config)

```javascript
// eslint.config.js
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
];
```

## Наборы правил

Плагин `@typescript-eslint` предоставляет несколько готовых конфигураций с разным уровнем строгости.

### recommended

Базовый набор правил, подходящий для большинства проектов. Включает наиболее критичные проверки без чрезмерной строгости.

```javascript
extends: ['plugin:@typescript-eslint/recommended']
```

### recommended-type-checked

Расширяет `recommended` правилами, требующими информации о типах. Более мощный вариант, но требует настройки `parserOptions.project`.

```javascript
extends: ['plugin:@typescript-eslint/recommended-type-checked']
```

### strict

Самый строгий набор правил. Подходит для проектов, где качество кода критично, и команда готова к жёстким ограничениям.

```javascript
extends: ['plugin:@typescript-eslint/strict']
```

### stylistic

Правила, касающиеся стиля кода, а не корректности. Часто используется совместно с `recommended` или `strict`.

```javascript
extends: [
  'plugin:@typescript-eslint/recommended',
  'plugin:@typescript-eslint/stylistic',
]
```

## Ключевые правила TypeScript ESLint

Разберём наиболее важные правила, которые стоит настроить в проекте.

### no-explicit-any

Запрещает использование типа `any`. Одно из самых важных правил — именно `any` разрушает смысл TypeScript.

```typescript
// Ошибка
function process(data: any) {
  return data;
}

// Правильно
function process<T>(data: T): T {
  return data;
}
```

```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'error',
}
```

### explicit-function-return-type

Требует явного указания возвращаемого типа у функций. Помогает избежать случайных ошибок в типах возвращаемых значений.

```typescript
// Ошибка
function getUser() {
  return { id: 1, name: 'Антон' };
}

// Правильно
function getUser(): { id: number; name: string } {
  return { id: 1, name: 'Антон' };
}
```

```javascript
rules: {
  '@typescript-eslint/explicit-function-return-type': 'warn',
}
```

### no-unused-vars

Стандартное правило ESLint конфликтует с TypeScript (например, с параметрами типов). Используйте TypeScript-версию.

```javascript
rules: {
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
}
```

Паттерн `^_` позволяет называть намеренно неиспользуемые переменные с префиксом `_`:

```typescript
function handler(_event: Event, data: string): void {
  console.log(data);
}
```

### no-floating-promises

Предупреждает, когда промис не обрабатывается. Требует информации о типах.

```typescript
// Ошибка — промис не awaited и не обрабатывается
async function fetchData(): Promise<void> {
  getData(); // ESLint выдаст предупреждение
}

// Правильно
async function fetchData(): Promise<void> {
  await getData();
}

// Правильно — явное игнорирование
void getData();
```

```javascript
rules: {
  '@typescript-eslint/no-floating-promises': 'error',
}
```

### consistent-type-imports

Требует использования `import type` для импорта только типов. Улучшает читаемость и ускоряет сборку.

```typescript
// Ошибка
import { User, fetchUser } from './api';

// Правильно
import type { User } from './api';
import { fetchUser } from './api';
```

```javascript
rules: {
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
}
```

## Интеграция с Prettier

Prettier форматирует код, ESLint анализирует его. Они должны работать вместе, не конфликтуя.

Пакет `eslint-config-prettier` отключает все ESLint-правила, которые могут конфликтовать с Prettier. Он должен стоять последним в массиве `extends`.

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // Всегда последним
  ],
};
```

Создайте файл `.prettierrc` с настройками форматирования:

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## Настройка для React-проекта

Для проектов на React с TypeScript конфигурация расширяется:

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off', // Не нужно в React 17+
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

## Файл .eslintignore

Создайте `.eslintignore`, чтобы исключить ненужные директории из проверки:

```
node_modules
dist
build
coverage
*.js
```

Обратите внимание: если проект на TypeScript, исключение `*.js` позволяет не проверять скомпилированные файлы и конфигурационные файлы в корне.

## Скрипты в package.json

Добавьте команды для запуска линтера:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```

Команда `lint:fix` автоматически исправит все ошибки, которые ESLint умеет исправлять самостоятельно.

## Интеграция с IDE

### VS Code

Установите расширение **ESLint** от Microsoft. Добавьте в `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "typescript",
    "typescriptreact"
  ]
}
```

Теперь при сохранении файла VS Code автоматически запустит ESLint и Prettier.

## Проверка перед коммитом с Husky

Чтобы гарантировать, что в репозиторий попадает только проверенный код, настройте автоматический запуск линтера перед каждым коммитом.

```bash
npm install --save-dev husky lint-staged
npx husky init
```

В файле `.husky/pre-commit`:

```bash
npx lint-staged
```

В `package.json` добавьте конфигурацию `lint-staged`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

Теперь при попытке сделать коммит автоматически запустятся ESLint и Prettier только для изменённых файлов.

## Типичные проблемы и решения

### Ошибка: Parsing error: Cannot read file tsconfig.json

Проверьте путь к `tsconfig.json` в `parserOptions`. Используйте абсолютный путь через `__dirname`:

```javascript
parserOptions: {
  project: './tsconfig.json',
  tsconfigRootDir: __dirname,
}
```

### Ошибка: The file does not match your project config

ESLint пытается проверить файл, не входящий в `tsconfig.json`. Добавьте директорию в `include` в `tsconfig.json` или создайте отдельный `tsconfig.eslint.json`:

```json
{
  "extends": "./tsconfig.json",
  "include": [
    "src/**/*",
    ".eslintrc.js",
    "jest.config.ts"
  ]
}
```

И укажите его в конфигурации ESLint:

```javascript
parserOptions: {
  project: './tsconfig.eslint.json',
}
```

### Медленная работа линтера

Правила, требующие информации о типах, работают значительно медленнее. Если скорость критична, используйте `recommended` вместо `recommended-type-checked` или ограничьте применение type-aware правил:

```javascript
overrides: [
  {
    files: ['*.ts', '*.tsx'],
    extends: ['plugin:@typescript-eslint/recommended-type-checked'],
    parserOptions: {
      project: true,
    },
  },
],
```

## Полная конфигурация для TypeScript-проекта

Вот итоговая конфигурация, которую можно использовать как отправную точку:

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    'no-console': 'warn',
  },
};
```

Эта конфигурация покрывает базовые потребности большинства TypeScript-проектов и легко расширяется под требования конкретной команды.

## Заключение

Настройка ESLint для TypeScript — это инвестиция, которая быстро окупается. Линтер помогает:

- находить ошибки типизации ещё в редакторе;
- поддерживать единый стиль кода в команде без споров на ревью;
- предотвращать типичные баги, связанные с необработанными промисами или случайным использованием `any`;
- ускорять онбординг новых разработчиков через автоматические проверки.

Начните с минимальной конфигурации на основе `recommended`, затем постепенно добавляйте правила по мере роста проекта. Не включайте сразу весь `strict` — это создаёт большой объём работы и снижает доверие команды к инструменту.

Для углублённого изучения TypeScript, включая продвинутые паттерны и работу с инструментами экосистемы, пройдите курс на PurpleSchool: https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-eslint-setup