---
metaTitle: "TypeScript Isolated Declarations — ускорение сборки"
metaDescription: "Что такое isolatedDeclarations в TypeScript 5.5+, зачем нужны явные аннотации типов на экспортах и как это ускоряет параллельную сборку."
author: "Антон Ларичев"
title: "Isolated Declarations в TypeScript"
preview: "Флаг isolatedDeclarations требует явных аннотаций на всех экспортах — это позволяет генерировать .d.ts-файлы параллельно и значительно ускорить сборку больших проектов."
---

## Что такое Isolated Declarations

Начиная с TypeScript 5.5, в компиляторе появился флаг `isolatedDeclarations`. Он требует, чтобы все экспортируемые объявления содержали явные аннотации типов — достаточные для того, чтобы TypeScript мог сгенерировать файл деклараций `.d.ts` для каждого модуля **независимо**, не анализируя соседние файлы.

Это не просто стилевое ограничение. За ним стоит конкретная архитектурная цель: **параллельная генерация деклараций** в монорепозиториях и крупных проектах.

## Зачем это нужно

Обычно TypeScript генерирует `.d.ts`-файлы за один проход: он читает весь граф импортов, выводит типы через логический вывод (`inference`) и только потом записывает декларации. При большом количестве файлов этот процесс становится узким местом.

Если каждый файл содержит **достаточно явных аннотаций**, то `.d.ts` можно сгенерировать для каждого файла отдельно, без знания о соседях. Именно это позволяют инструменты вроде `ts-blank-space`, `oxc-transform`, `swc` и сам `tsc --isolatedDeclarations` при параллельном запуске.

Флаг `isolatedDeclarations` сигнализирует сборщику: «все экспорты в этом файле аннотированы явно — можешь обработать его независимо».

## Как включить

Добавьте флаг в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "declaration": true,
    "isolatedDeclarations": true
  }
}
```

Флаг `declaration: true` обязателен — без него `isolatedDeclarations` не имеет смысла.

## Что именно требует флаг

### Возвращаемый тип функций

Без `isolatedDeclarations` TypeScript может вывести тип возврата автоматически:

```typescript
// Ошибка при isolatedDeclarations: возвращаемый тип должен быть явным
export function add(a: number, b: number) {
  return a + b;
}
```

С включённым флагом это вызывает ошибку:

```
Return type of exported function has or is using private name.
```

Правильный вариант:

```typescript
export function add(a: number, b: number): number {
  return a + b;
}
```

### Тип переменных и констант

```typescript
// Ошибка — тип выводится из значения
export const VERSION = '1.0.0';

// Правильно — тип указан явно
export const VERSION: string = '1.0.0';
```

Здесь важна оговорка: примитивные литеральные значения (`'1.0.0'`, `42`, `true`) TypeScript может вывести самостоятельно при генерации `.d.ts`, поэтому в ряде случаев компилятор не выдаёт ошибку. Но как только значение сложнее литерала — аннотация обязательна.

```typescript
// Ошибка — результат вызова функции не может быть выведен изолированно
export const config = createConfig({ debug: true });

// Правильно
export const config: AppConfig = createConfig({ debug: true });
```

### Экспортируемые классы

Методы и свойства класса, доступные снаружи, должны иметь аннотации:

```typescript
// Ошибка
export class UserService {
  getUser(id: number) {
    return this.repository.find(id);
  }
}

// Правильно
export class UserService {
  getUser(id: number): Promise<User> {
    return this.repository.find(id);
  }
}
```

### Стрелочные функции

```typescript
// Ошибка
export const multiply = (a: number, b: number) => a * b;

// Правильно
export const multiply = (a: number, b: number): number => a * b;
```

### Реэкспорты

Если вы реэкспортируете что-то из другого модуля, это обычно работает без изменений, поскольку декларации импортируемого модуля уже существуют:

```typescript
export { UserService } from './user.service';
export type { User } from './user.model';
```

## Правила, которые флаг не затрагивает

Важно понимать границы флага. Он **не требует** аннотаций для:

- Локальных (не экспортируемых) переменных и функций
- Параметров функций — их типы всегда нужны для проверки, но это не связано с `isolatedDeclarations`
- Внутренних методов приватных классов

```typescript
// Это нормально — функция не экспортируется
function internalHelper(x: string) {
  return x.trim();
}

export function process(input: string): string {
  return internalHelper(input);
}
```

## Практический пример: модуль утилит

Представьте модуль `utils/format.ts`:

```typescript
// Без isolatedDeclarations — работает, но медленнее собирается
export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const DEFAULT_LOCALE = Intl.NumberFormat().resolvedOptions().locale;

export class Formatter {
  format(value: number) {
    return value.toFixed(2);
  }
}
```

С включённым `isolatedDeclarations` тот же модуль выглядит так:

```typescript
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const DEFAULT_LOCALE: string =
  Intl.NumberFormat().resolvedOptions().locale;

export class Formatter {
  format(value: number): string {
    return value.toFixed(2);
  }
}
```

Изменения минимальны, зато теперь этот файл можно передать в любой инструмент, который умеет генерировать `.d.ts` изолированно.

## Совместимость с isolatedModules

`isolatedDeclarations` отличается от `isolatedModules`, хотя названия похожи.

| Флаг | Что делает |
|---|---|
| `isolatedModules` | Запрещает конструкции, которые нельзя транспилировать файл-за-файлом (enum, namespace, неявный type re-export) |
| `isolatedDeclarations` | Требует явных аннотаций на экспортах для независимой генерации `.d.ts` |

Оба флага можно использовать одновременно — они дополняют друг друга:

```json
{
  "compilerOptions": {
    "declaration": true,
    "isolatedModules": true,
    "isolatedDeclarations": true
  }
}
```

## Когда стоит включать

`isolatedDeclarations` особенно полезен в следующих ситуациях:

**Монорепозитории с turborepo или nx.** Эти инструменты умеют запускать генерацию деклараций параллельно по пакетам. Флаг гарантирует, что каждый пакет может быть обработан независимо.

**Большие кодовые базы с медленной сборкой.** Если `tsc --declaration` занимает минуты, `isolatedDeclarations` открывает путь к параллелизации на уровне файлов через внешние инструменты.

**Публичные библиотеки.** Явные аннотации на экспортах — хорошая практика сама по себе: они делают API читаемым без погружения в реализацию.

**Проекты с `swc` или `esbuild` для транспиляции.** Эти инструменты не запускают проверку типов, и для генерации деклараций им нужны явные аннотации. `isolatedDeclarations` закрепляет это требование на уровне компилятора.

## Автоматическое исправление ошибок

TypeScript 5.5 включает **quick fix** в редакторах, совместимых с Language Server (VS Code, WebStorm, Neovim с LSP). Если вы наводите курсор на ошибку `isolatedDeclarations`, редактор предложит автоматически добавить недостающую аннотацию.

Для массового исправления можно использовать `ts-morph` или встроенный в TypeScript 5.6+ `--fixIsolatedDeclarations` (экспериментальный флаг CLI).

## Ограничения

Флаг не решает все задачи изолированной обработки. Некоторые паттерны остаются сложными даже с явными аннотациями:

```typescript
// Проблема: тип возврата зависит от условного типа из другого файла
import type { Config } from './config';

export function createHandler(config: Config): Config extends { strict: true } ? StrictHandler : BaseHandler {
  // ...
}
```

В таких случаях TypeScript не сможет вывести тип изолированно — нужен явный union или перенос условного типа в тот же файл.

## Итог

`isolatedDeclarations` — это инструмент масштабируемости. Он вносит небольшие ограничения на стиль кода (явные аннотации на экспортах), но взамен открывает возможность параллельной и независимой генерации деклараций. Для небольших проектов выигрыш незаметен, но в монорепозиториях и крупных библиотеках это значимое ускорение сборки.

Кроме того, явные аннотации на публичном API — это хорошая инженерная практика: код становится самодокументируемым, а намерения автора очевидны без запуска компилятора.

---

Хотите глубоко разобраться в системе типов TypeScript и научиться писать масштабируемый типобезопасный код? Пройдите курс по TypeScript на PurpleSchool: [https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=isolated-declarations](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=isolated-declarations)