---
metaTitle: "TypeScript 5: новые возможности и изменения"
metaDescription: "Обзор ключевых нововведений TypeScript 5: декораторы, const-параметры типов, using-объявления, NoInfer, предикаты типов и многое другое."
author: "Антон Ларичев"
title: "TypeScript 5: новые возможности и изменения"
preview: "Разбираем главные нововведения линейки TypeScript 5.x: стабильные декораторы, const type parameters, using-объявления, утилитарный тип NoInfer и автоматические предикаты типов."
---

TypeScript 5 — значительный релиз, который принёс стабилизацию давно ожидаемых возможностей и целый ряд практичных улучшений. В этой статье разберём ключевые нововведения линейки 5.x: что изменилось, как использовать новые возможности и зачем они нужны в реальных проектах.

## Стабильные декораторы (TypeScript 5.0)

До TypeScript 5 декораторы существовали в «экспериментальном» режиме и были основаны на устаревшем предложении TC39. В TypeScript 5.0 реализован новый стандарт декораторов (Stage 3), который кардинально отличается от предыдущего.

Основные отличия нового API:

- декораторы теперь являются обычными функциями, а не фабриками через `experimentalDecorators`
- нет зависимости от `emitDecoratorMetadata`
- поведение предсказуемо и соответствует спецификации ECMAScript

```typescript
// Декоратор метода
function log(target: any, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name);
  return function (this: any, ...args: any[]) {
    console.log(`Вызов метода: ${methodName}`, args);
    return target.call(this, ...args);
  };
}

class UserService {
  @log
  getUser(id: number) {
    return { id, name: 'Alice' };
  }
}

const service = new UserService();
service.getUser(42);
// Вывод: Вызов метода: getUser [42]
```

```typescript
// Декоратор класса
function singleton<T extends { new (...args: any[]): {} }>(Base: T, _context: ClassDecoratorContext) {
  let instance: InstanceType<T>;
  return class extends Base {
    constructor(...args: any[]) {
      if (instance) return instance;
      super(...args);
      instance = this as InstanceType<T>;
    }
  } as T;
}

@singleton
class Config {
  value = Math.random();
}

const a = new Config();
const b = new Config();
console.log(a.value === b.value); // true
```

Если вы использовали старые декораторы с `experimentalDecorators: true`, они по-прежнему работают при включённом флаге — обратная совместимость сохранена. Мигрировать проекты можно постепенно.

## Параметры типов с модификатором const (TypeScript 5.0)

До TypeScript 5 при передаче литералов в обобщённые функции TypeScript расширял тип до базового. Новый модификатор `const` на параметре типа позволяет сохранять точные литеральные типы без явного `as const`.

```typescript
// Без const — тип расширяется до string[]
function createTags<T extends string>(tags: T[]) {
  return tags;
}
const tags = createTags(['ts', 'js', 'node']);
// Тип: string[]

// С const — тип сохраняется как кортеж литералов
function createTagsConst<const T extends string>(tags: T[]) {
  return tags;
}
const tagsConst = createTagsConst(['ts', 'js', 'node']);
// Тип: ['ts', 'js', 'node']
```

Это особенно полезно для построения типобезопасных API, где важно сохранять точные значения:

```typescript
function makeRoute<const T extends string>(path: T): { path: T } {
  return { path };
}

const route = makeRoute('/users/:id');
// Тип route.path: '/users/:id', а не string
```

## Множественное наследование конфигурации tsconfig.json (TypeScript 5.0)

Раньше поле `extends` принимало только одну строку. TypeScript 5.0 позволяет передавать массив конфигураций, объединяя несколько базовых файлов:

```json
{
  "extends": [
    "@tsconfig/strictest/tsconfig.json",
    "@tsconfig/node20/tsconfig.json",
    "./tsconfig.paths.json"
  ],
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

При конфликте настроек побеждает последний в массиве. Это упрощает монорепозитории и проекты с несколькими базовыми конфигурациями.

## Флаг --verbatimModuleSyntax (TypeScript 5.0)

Этот флаг пришёл на смену запутанной паре `importsNotUsedAsValues` и `preserveValueImports`. Он устанавливает простое правило: импорт без `type` всегда сохраняется в выходном файле, импорт с `type` всегда удаляется.

```typescript
// ❌ Ошибка при verbatimModuleSyntax: импорт значения используется только как тип
import { User } from './types';
type Admin = User & { role: 'admin' };

// ✓ Правильно — явно помечаем как тип
import type { User } from './types';
type Admin = User & { role: 'admin' };

// ✓ Правильно — используем type-only import для конкретного имени
import { type User, createUser } from './user';
```

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

Флаг особенно полезен в проектах с бандлерами (Vite, esbuild, SWC), где стирание типов происходит без анализа зависимостей.

## Разрешение модулей bundler (TypeScript 5.0)

Новый режим `moduleResolution: "bundler"` отражает реальное поведение современных бандлеров: расширения файлов в импортах необязательны, поддерживаются условия `exports` из `package.json`, но нет требований Node.js-режима указывать `.js`.

```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

```typescript
// bundler: допустимо без расширения
import { helper } from './utils';

// node16/nodenext: требуется явное расширение
import { helper } from './utils.js';
```

Используйте `bundler` для проектов на Vite, Next.js или других инструментах, которые сами разрешают модули.

## Объявления using и await using (TypeScript 5.2)

TypeScript 5.2 реализовал предложение ECMAScript «Explicit Resource Management». Ключевые слова `using` и `await using` автоматически вызывают метод `[Symbol.dispose]()` или `[Symbol.asyncDispose]()` при выходе из области видимости — даже при исключении.

```typescript
class DatabaseConnection {
  constructor(private url: string) {
    console.log(`Подключение к ${url}`);
  }

  query(sql: string) {
    return `Результат: ${sql}`;
  }

  [Symbol.dispose]() {
    console.log('Соединение закрыто');
  }
}

function processData() {
  using conn = new DatabaseConnection('postgres://localhost/db');
  const result = conn.query('SELECT * FROM users');
  console.log(result);
  // conn[Symbol.dispose]() вызывается автоматически здесь
}

processData();
// Подключение к postgres://localhost/db
// Результат: SELECT * FROM users
// Соединение закрыто
```

Асинхронный вариант:

```typescript
class FileHandle {
  constructor(public path: string) {}

  async [Symbol.asyncDispose]() {
    await new Promise((resolve) => setTimeout(resolve, 10));
    console.log(`Файл ${this.path} закрыт`);
  }
}

async function readFile() {
  await using file = new FileHandle('/tmp/data.txt');
  console.log(`Читаем ${file.path}`);
}

await readFile();
// Читаем /tmp/data.txt
// Файл /tmp/data.txt закрыт
```

`using` особенно удобен для работы с ресурсами: файлами, подключениями к БД, мьютексами, временными директориями.

## Утилитарный тип NoInfer (TypeScript 5.4)

`NoInfer<T>` запрещает TypeScript использовать конкретное место в сигнатуре функции для вывода параметра типа. Это полезно, когда нужно, чтобы тип выводился из одного аргумента, а другой лишь проверялся на соответствие.

```typescript
// Проблема: TypeScript выводит T из обоих аргументов
function createState<T>(initial: T, fallback: T): T {
  return initial ?? fallback;
}

// Тип выводится как 'active' | 'inactive' — слишком широко
const state = createState('active', 'inactive');

// С NoInfer: тип выводится только из initial
function createStateFixed<T>(initial: T, fallback: NoInfer<T>): T {
  return initial ?? fallback;
}

// ✓ Работает — 'inactive' совместим с 'active'
const stateFixed = createStateFixed('active', 'inactive');

// ❌ Ошибка — 'pending' не выводится из начального значения
const stateBad = createStateFixed('active', 'pending');
```

Практичный пример с маршрутами:

```typescript
function navigate<const T extends string>(
  routes: T[],
  defaultRoute: NoInfer<T>
): void {
  console.log(`Маршрут по умолчанию: ${defaultRoute}`);
}

navigate(['/home', '/about', '/contact'], '/home'); // ✓
navigate(['/home', '/about', '/contact'], '/login'); // ❌ Ошибка
```

## Автоматические предикаты типов (TypeScript 5.5)

Раньше для сужения типов в методах вроде `filter` нужно было вручную писать предикат типа с `is`. TypeScript 5.5 умеет выводить предикат типа автоматически, если тело функции достаточно очевидно.

```typescript
type Shape = Circle | Square;
interface Circle { kind: 'circle'; radius: number; }
interface Square { kind: 'square'; side: number; }

const shapes: Shape[] = [
  { kind: 'circle', radius: 10 },
  { kind: 'square', side: 5 },
  { kind: 'circle', radius: 3 },
];

// До TypeScript 5.5: нужен явный предикат
function isCircle(s: Shape): s is Circle {
  return s.kind === 'circle';
}

// С TypeScript 5.5: тип выводится автоматически
const isCircleAuto = (s: Shape) => s.kind === 'circle';
// TypeScript сам понимает, что это (s: Shape) => s is Circle

const circles = shapes.filter(isCircleAuto);
// Тип: Circle[] — а не Shape[]

circles.forEach((c) => {
  console.log(c.radius); // ✓ Без ошибки
});
```

Также работает для проверок на `null`/`undefined`:

```typescript
const values = [1, null, 2, undefined, 3];
const notNull = (v: number | null | undefined) => v != null;
const numbers = values.filter(notNull);
// Тип: number[]
```

## Проверка синтаксиса регулярных выражений (TypeScript 5.5)

TypeScript 5.5 добавил базовую проверку синтаксиса регулярных выражений прямо в компиляторе. Опечатки и недопустимые конструкции теперь выдают ошибки на этапе компиляции.

```typescript
// ❌ Ошибка: незакрытая группа
const regex1 = /Hello (World/;

// ❌ Ошибка: неверный квантификатор
const regex2 = /\w{2,1}/;

// ❌ Ошибка: неверная группа именованного захвата
const regex3 = /(?<)/;

// ✓ Корректные выражения
const email = /^[\w.-]+@[\w.-]+\.\w{2,}$/;
const phone = /^\+?[\d\s()-]{7,15}$/;
```

Проверка не требует никаких дополнительных настроек — она включена по умолчанию.

## Методы итераторов (TypeScript 5.6)

TypeScript 5.6 добавил типизацию для нового набора методов встроенных итераторов (`Iterator.prototype`), которые входят в предложение TC39 «Iterator Helpers». Это позволяет применять `map`, `filter`, `take`, `drop` и другие операции непосредственно к итераторам без преобразования в массив.

```typescript
// Бесконечный генератор чисел
function* naturals(): Generator<number> {
  let n = 1;
  while (true) yield n++;
}

const result = naturals()
  .filter((n) => n % 2 === 0) // чётные
  .map((n) => n ** 2)         // квадраты
  .take(5)                    // первые 5
  .toArray();                 // собрать в массив

console.log(result); // [4, 16, 36, 64, 100]
```

Для использования в TypeScript-проектах нужно указать в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["esnext", "esnext.iterator"]
  }
}
```

## Улучшения производительности

На протяжении всей линейки TypeScript 5.x команда активно работала над скоростью компиляции:

- TypeScript 5.0 ускорил сборку на 10–25% за счёт миграции компилятора с пространств имён на модули ES
- TypeScript 5.2 улучшил кеширование результатов разрешения модулей
- TypeScript 5.5 оптимизировал инкрементальную компиляцию для крупных проектов

В большинстве реальных кодовых баз вы заметите ощутимое ускорение `tsc` и работы языкового сервера в редакторе.

## Сводная таблица нововведений

| Версия | Функциональность |
|--------|------------------|
| 5.0 | Стабильные декораторы, `const` type parameters, множественный `extends`, `verbatimModuleSyntax`, `moduleResolution: bundler` |
| 5.1 | Улучшения возвращаемого типа геттеров, поддержка unrelated типов getter/setter |
| 5.2 | `using` / `await using`, декораторы абстрактных классов |
| 5.3 | Import attributes (`with {}`), улучшения вывода типов в `switch (true)` |
| 5.4 | `NoInfer<T>`, уточнение закрытых переменных в замыканиях |
| 5.5 | Автоматические предикаты типов, проверка синтаксиса RegExp |
| 5.6 | Методы итераторов, запрет явно бессмысленных значений |

## Миграция на TypeScript 5

Переход с TypeScript 4.x обычно проходит безболезненно. Несколько вещей стоит проверить:

1. Если используете старые декораторы — оставьте `experimentalDecorators: true`, они продолжают работать.
2. Замените устаревшие флаги `importsNotUsedAsValues` и `preserveValueImports` на `verbatimModuleSyntax`.
3. Обновите `target` и `lib` при необходимости использовать `using` (требует поддержки `Symbol.dispose`).
4. Проверьте `moduleResolution` — если проект использует бандлер, переключитесь на `"bundler"`.

```bash
npm install typescript@latest --save-dev
npx tsc --noEmit
```

Запустите компилятор с `--noEmit` для выявления ошибок без генерации файлов — это поможет оценить объём необходимых изменений.

---

Подробно изучить TypeScript, включая новые возможности пятой версии, можно на курсе [TypeScript с нуля до продвинутого уровня](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript5-new-features) на PurpleSchool.