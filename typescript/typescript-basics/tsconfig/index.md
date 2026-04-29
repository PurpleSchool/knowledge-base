---
metaTitle: tsconfig.json — полный разбор настроек TypeScript
metaDescription: "tsconfig.json в TypeScript — полный разбор compilerOptions: target, module, strict, paths, baseUrl, include, exclude. Настройка для React и Node.js проектов."
author: Антон Ларичев
title: tsconfig.json — полный разбор настроек TypeScript компилятора
preview: Полный разбор tsconfig.json — compilerOptions, strict режим, target, module, paths, baseUrl. Готовые конфиги для React, Next.js и Node.js проектов.
---

## Введение

`tsconfig.json` — файл конфигурации TypeScript компилятора (tsc). Он определяет, какие файлы компилировать, как компилировать (в какую версию JavaScript) и насколько строгую проверку типов применять.

Правильная настройка `tsconfig.json` — основа TypeScript-проекта. Слишком мягкие настройки сводят пользу от типизации к минимуму; слишком строгие — замедляют разработку в начале.

## Создание tsconfig.json

```bash
# Автоматическая генерация с комментариями
npx tsc --init
```

Базовая структура файла:

```json
{
  "compilerOptions": {
    // Настройки компилятора
  },
  "include": ["src/**/*"],      // Какие файлы включить
  "exclude": ["node_modules"]   // Какие файлы исключить
}
```

## target — целевая версия JavaScript

Определяет, в какую версию JavaScript компилируется TypeScript:

```json
{
  "compilerOptions": {
    "target": "ES2022"
  }
}
```

| Значение | Когда использовать |
|---------|-------------------|
| `ES5` | Максимальная совместимость (IE11 и старше) |
| `ES6` / `ES2015` | Современные браузеры без Babel |
| `ES2017` | Node.js 8+ |
| `ES2020` | Node.js 12+, современные браузеры |
| `ES2022` | Node.js 16+, текущий стандарт |
| `ESNext` | Последние возможности (осторожно с совместимостью) |

Для современных проектов: **`ES2022`** или **`ESNext`**.

## module — система модулей

```json
{
  "compilerOptions": {
    "module": "NodeNext"
  }
}
```

| Значение | Когда использовать |
|---------|-------------------|
| `CommonJS` | Node.js (с require/exports) |
| `ESNext` / `ES2022` | Браузерные проекты с бандлером (Vite, Webpack) |
| `NodeNext` | Node.js с нативными ESM (.mjs, package.json type:module) |
| `Preserve` | Современный стандарт (TS 5.4+), сохраняет исходный синтаксис |

Если вы хотите детально изучить настройку TypeScript и работу с системой типов — приходите на наш курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=tsconfig). На курсе 180 уроков, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## moduleResolution — разрешение модулей

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

* `node` — классический Node.js алгоритм (для CommonJS)
* `node16` / `nodenext` — Node.js ESM алгоритм
* `bundler` — для проектов с бандлером (Vite, Webpack, Parcel) — **рекомендуется** для фронтенда

## strict — строгий режим

Самая важная настройка. `"strict": true` включает группу проверок:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Это эквивалентно включению всех этих опций:

```json
{
  "compilerOptions": {
    "strictNullChecks": true,           // нет неявного null/undefined
    "strictFunctionTypes": true,        // строгая проверка типов функций
    "strictBindCallApply": true,        // проверка bind/call/apply
    "strictPropertyInitialization": true, // свойства класса должны быть инициализированы
    "noImplicitAny": true,              // запрет неявного any
    "noImplicitThis": true,             // запрет this без типа
    "alwaysStrict": true,               // 'use strict' в каждом файле
    "useUnknownInCatchVariables": true  // catch (e: unknown) вместо any
  }
}
```

**Рекомендация:** всегда включайте `"strict": true` в новых проектах. Для миграции legacy-кода можно включать опции постепенно.

## Важные дополнительные опции

### noUncheckedIndexedAccess

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}
```

Доступ к элементам массива по индексу возвращает `T | undefined`:

```typescript
const arr = [1, 2, 3];
const first = arr[0]; // number | undefined (с опцией)
                      // number (без опции)
```

Рекомендуется включать — предотвращает ошибки при доступе за пределами массива.

### exactOptionalPropertyTypes

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true
  }
}
```

С этой опцией `name?: string` означает, что свойство может **отсутствовать**, но не может быть явно `undefined`.

```typescript
interface User {
  name?: string;
}

const user: User = { name: undefined }; // Ошибка с exactOptionalPropertyTypes
const user2: User = {};                 // OK — свойство отсутствует
```

### noImplicitReturns

```json
{
  "compilerOptions": {
    "noImplicitReturns": true
  }
}
```

Ошибка, если не все ветки кода функции возвращают значение.

### paths и baseUrl — алиасы путей

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

После этого можно писать:

```typescript
import { Button } from '@components/Button';
// вместо
import { Button } from '../../../components/Button';
```

Важно: TypeScript только понимает алиасы, но не транспилирует их. Для webpack/vite нужно настроить алиасы и там.

### lib — библиотеки типов

```json
{
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

* `ES2022` — типы стандартной библиотеки JS (Array, Promise, Map и т.д.)
* `DOM` — типы браузерного API (document, window, HTMLElement)
* `DOM.Iterable` — поддержка итерации DOM-коллекций

Для Node.js без браузерного API: `["ES2022"]`.

### outDir и rootDir

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  }
}
```

`rootDir` — корень исходников. `outDir` — куда помещать скомпилированный JavaScript.

### declaration и declarationMap

```json
{
  "compilerOptions": {
    "declaration": true,         // генерировать .d.ts файлы
    "declarationMap": true,      // source maps для .d.ts
    "sourceMap": true            // source maps для .js
  }
}
```

Обязательно для npm-пакетов, которые предоставляют типы.

## Готовые конфиги

### React + Vite

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Next.js (App Router)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Node.js (ESM)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Расширение конфигов

TypeScript поддерживает наследование через `extends`:

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022"
  }
}
```

```json
// tsconfig.json (проект)
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"  // переопределяем или добавляем опции
  }
}
```

Используется в monorepo и для разделения конфигов (dev/prod/test).

## Частые ошибки

* **Отсутствие `"strict": true`.** Без строгого режима TypeScript почти не помогает — неявные `any` и незащищённые `null` убивают преимущества типизации.

* **Неверный `moduleResolution` с бандлером.** Для Vite/Webpack используйте `"bundler"`, не `"node"`. Иначе возникают ошибки при импорте без расширения файла.

* **Алиасы в `paths` не работают в runtime.** TypeScript не транспилирует алиасы — их нужно настроить в Vite, Webpack или использовать `tsc-alias`.

* **`"noEmit": true` при использовании tsc для сборки.** `noEmit` только проверяет типы, не генерирует файлы. Для сборки нужно убрать эту опцию.

## Часто задаваемые вопросы

**Нужно ли редактировать tsconfig.json в Next.js / Create React App?**

Эти фреймворки создают готовый tsconfig. Можно добавлять настройки (например, `paths` для алиасов), но лучше не менять ключевые опции (`jsx`, `module`, `moduleResolution`) без понимания последствий.

**Что означает `"skipLibCheck": true`?**

Пропускает проверку типов в `.d.ts` файлах зависимостей. Ускоряет компиляцию и устраняет конфликты между типами из разных пакетов. Безопасно для большинства проектов.

**Как настроить разные tsconfig для тестов?**

Создайте `tsconfig.test.json` с `"extends": "./tsconfig.json"` и переопределите нужные опции (например, `"types": ["jest"]`). В Jest-конфиге укажите `tsconfig: './tsconfig.test.json'`.

## Заключение

`tsconfig.json` — это не просто технический файл, это декларация правил вашего TypeScript-проекта. Правильная настройка `strict` режима, правильный `target` и `moduleResolution` определяют качество и предсказуемость типизации.

Начните с готового конфига для вашей платформы (React + Vite, Next.js или Node.js) и постепенно добавляйте строгости по мере роста проекта.

Для углублённого изучения TypeScript рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=tsconfig). В первых модулях доступно бесплатное содержание — познакомьтесь с форматом обучения до покупки полного доступа.
