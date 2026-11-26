---
metaTitle: "TypeScript noUncheckedIndexedAccess: безопасные индексы"
metaDescription: "Как работает опция noUncheckedIndexedAccess в TypeScript: защита от undefined при доступе по индексу к массивам и объектам."
author: "Антон Ларичев"
title: "noUncheckedIndexedAccess — безопасные индексы в TypeScript"
preview: "Разбираем опцию компилятора noUncheckedIndexedAccess — что она делает, почему не входит в strict и как правильно с ней работать."
---

## Что такое noUncheckedIndexedAccess

Когда вы обращаетесь к элементу массива по индексу или к свойству объекта через динамический ключ, TypeScript по умолчанию считает, что элемент существует. Это удобно, но опасно: в реальной программе индекс может выйти за границы, а ключ — отсутствовать в объекте.

Опция компилятора `noUncheckedIndexedAccess` исправляет это поведение. При её включении тип результата индексированного доступа расширяется на `undefined`, что заставляет вас явно обрабатывать случай отсутствия значения.

Опция появилась в TypeScript 4.1 и не входит в набор `strict`. Её нужно включать отдельно.

## Включение опции

Добавьте флаг в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

Больше ничего не требуется — изменения вступают в силу немедленно, без перезапуска среды.

## Как меняется тип при доступе по индексу

### Массивы

Без опции тип элемента массива `string[]` при доступе по индексу — `string`. С опцией — `string | undefined`.

```typescript
const names: string[] = ["Alice", "Bob", "Carol"];

// без noUncheckedIndexedAccess
const first = names[0]; // тип: string
console.log(first.toUpperCase()); // ошибки нет, но может упасть в рантайме

// с noUncheckedIndexedAccess
const first = names[0]; // тип: string | undefined
console.log(first.toUpperCase()); // ошибка TS: Object is possibly 'undefined'
```

Даже если массив определён прямо здесь и явно содержит элементы, TypeScript всё равно добавляет `undefined` — он не отслеживает длину массивов в общем случае.

### Объекты с индексной сигнатурой

То же самое происходит с объектами, у которых есть индексная сигнатура:

```typescript
const scores: Record<string, number> = {
  alice: 95,
  bob: 87,
};

// с noUncheckedIndexedAccess
const aliceScore = scores["alice"]; // тип: number | undefined
const unknown = scores["unknown"]; // тип: number | undefined

// без проверки — ошибка компилятора
const doubled = aliceScore * 2; // TS2532: Object is possibly 'undefined'
```

### Кортежи

Кортежи (tuple) ведут себя иначе: их элементы имеют фиксированные индексы и типы, поэтому `noUncheckedIndexedAccess` не затрагивает доступ к известным позициям.

```typescript
const pair: [string, number] = ["age", 30];

const label = pair[0]; // тип: string — без undefined
const value = pair[1]; // тип: number — без undefined
```

Однако если вы обращаетесь к индексу, который выходит за размер кортежа, TypeScript уже без этой опции даст ошибку.

## Способы безопасной работы с индексами

### Проверка через if

Самый простой способ — явная проверка на `undefined` перед использованием:

```typescript
const items: string[] = ["apple", "banana"];
const item = items[0];

if (item !== undefined) {
  console.log(item.toUpperCase()); // string здесь
}
```

### Оператор опциональной цепочки

Если вам нужно просто получить производное значение или вызвать метод без побочных эффектов, подойдёт `?.`:

```typescript
const items: string[] = ["apple", "banana"];
const upper = items[0]?.toUpperCase(); // тип: string | undefined
```

### Оператор нулевого слияния

Когда нужно значение по умолчанию:

```typescript
const config: Record<string, string> = { theme: "dark" };

const lang = config["lang"] ?? "en"; // тип: string
console.log(lang); // "en"
```

### Итерация вместо индексного доступа

Если вы проходите по всем элементам, используйте `for...of` или методы массива — они возвращают элементы без `undefined`:

```typescript
const numbers: number[] = [1, 2, 3, 4, 5];

// безопасно — item имеет тип number, не number | undefined
for (const item of numbers) {
  console.log(item * 2);
}

// то же с методами
const doubled = numbers.map((n) => n * 2); // n: number
```

### Деструктуризация

Деструктуризация также не добавляет `undefined` к типам элементов при доступе к конкретным позициям:

```typescript
const matrix: number[][] = [[1, 2], [3, 4]];

const [firstRow] = matrix; // firstRow: number[] | undefined — первый элемент
const [[a, b]] = matrix;   // a: number, b: number — элементы кортежа
```

Обратите внимание: деструктуризация самого массива даёт `undefined` для первого элемента, потому что `matrix` может быть пустым. Но элементы внутри `firstRow` при вложенной деструктуризации типизированы как `number`.

## Практический пример: парсинг CSV

Рассмотрим реалистичный пример — чтение строк CSV-файла:

```typescript
type User = {
  name: string;
  age: number;
  email: string;
};

function parseUserRow(row: string): User | null {
  const parts = row.split(",");

  // без noUncheckedIndexedAccess этот код компилируется без ошибок,
  // но падает если в строке меньше трёх полей
  const name = parts[0];
  const ageStr = parts[1];
  const email = parts[2];

  // с noUncheckedIndexedAccess — все три переменные имеют тип string | undefined
  if (!name || !ageStr || !email) {
    return null;
  }

  const age = parseInt(ageStr, 10);
  if (isNaN(age)) {
    return null;
  }

  return { name, age, email };
}

const row1 = parseUserRow("Alice,30,alice@example.com");
const row2 = parseUserRow("Bob"); // без защиты — рантайм-ошибка, с защитой — null
```

Опция заставила нас добавить проверку, которую легко было пропустить.

## Практический пример: кэш объектов

```typescript
type CacheEntry = {
  value: string;
  expiresAt: number;
};

const cache: Record<string, CacheEntry> = {};

function get(key: string): string | null {
  const entry = cache[key]; // тип: CacheEntry | undefined

  if (entry === undefined) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    delete cache[key];
    return null;
  }

  return entry.value;
}

function set(key: string, value: string, ttlMs: number): void {
  cache[key] = {
    value,
    expiresAt: Date.now() + ttlMs,
  };
}
```

Без опции вызов `entry.expiresAt` на потенциально несуществующем ключе не вызвал бы предупреждения компилятора. С опцией — ошибка заметна на этапе компиляции.

## Почему опция не входит в strict

Команда TypeScript приняла сознательное решение не добавлять `noUncheckedIndexedAccess` в пресет `strict`, несмотря на то что опция повышает безопасность. Причина — количество ложных срабатываний в обычном коде.

Рассмотрим типичный пример:

```typescript
const arr = [1, 2, 3];

for (let i = 0; i < arr.length; i++) {
  const item = arr[i]; // тип: number | undefined
  console.log(item + 1); // ошибка: объект может быть undefined
}
```

Здесь мы знаем, что `arr[i]` существует — цикл ограничен `arr.length`. Но TypeScript не может это доказать в общем случае. Добавление проверки `if (item !== undefined)` или использование `item!` превращает идиоматичный цикл в громоздкую конструкцию.

Одна из альтернатив — написать цикл иначе:

```typescript
for (const item of arr) {
  console.log(item + 1); // item: number, всё чисто
}
```

В большинстве случаев переход на `for...of` и методы массива решает проблему элегантнее, чем проверки на `undefined`.

## Включать или нет

Опция полезна в следующих ситуациях:

- Новый проект, где можно сразу установить строгие правила.
- Код активно работает с динамическими ключами (`Record<string, T>`, словари, кэши).
- Данные приходят извне (CSV, JSON, API) и индексный доступ применяется при парсинге.
- Команда хочет максимальную строгость и готова переписать циклы на `for...of`.

Опция создаёт трения в коде с классическими `for`-циклами по индексу. Если такого кода много, переход потребует рефакторинга. Оцените объём изменений заранее с помощью `tsc --noEmit`.

## Включение в существующем проекте

Чтобы оценить масштаб, запустите компилятор без вывода файлов:

```bash
npx tsc --noEmit --noUncheckedIndexedAccess
```

Если ошибок много, можно включать опцию постепенно — например, сначала только в новых файлах через `paths` или отдельный `tsconfig.strict.json`, а затем распространять на весь проект по мере рефакторинга.

Вот типичные паттерны исправлений:

```typescript
// было
const head = arr[0];
processItem(head); // TS-ошибка с опцией

// стало — вариант 1: проверка
const head = arr[0];
if (head !== undefined) {
  processItem(head);
}

// стало — вариант 2: значение по умолчанию
const head = arr[0] ?? defaultItem;
processItem(head);

// стало — вариант 3: non-null assertion (если вы уверены)
const head = arr[0]!;
processItem(head);

// стало — вариант 4: переписать логику без индексов
const [head] = arr;
if (head !== undefined) {
  processItem(head);
}
```

Не злоупотребляйте `!` — он отключает проверку компилятора и возвращает вас к исходной опасности.

## Взаимодействие с другими опциями

`noUncheckedIndexedAccess` хорошо сочетается с:

- `strictNullChecks` — базовая опция, без которой `undefined` в типе не имеет смысла. Входит в `strict`.
- `noPropertyAccessFromIndexSignature` — запрещает точечную нотацию для индексных сигнатур, заставляя явно использовать `obj["key"]`. Дополняет безопасность.
- `exactOptionalPropertyTypes` — уточняет разницу между `{ x?: string }` (свойство может отсутствовать) и `{ x: string | undefined }` (свойство есть, но может быть `undefined`).

Вместе эти опции образуют слой защиты, выходящий за рамки стандартного `strict`.

## Итог

Опция `noUncheckedIndexedAccess` закрывает распространённую дыру в системе типов TypeScript: доступ по индексу к массиву или динамическому ключу объекта больше не молча возвращает `T` там, где реально может быть `undefined`. Это небольшое изменение, но оно заставляет обрабатывать граничные случаи явно — на этапе компиляции, а не в рантайме.

Опция не входит в `strict` из-за частых ложных срабатываний в `for`-циклах по индексу, но в большинстве случаев переход на `for...of` и методы массива делает код одновременно безопаснее и чище.

Если вы хотите глубже разобраться в системе типов TypeScript и настройке компилятора, приходите на курс [TypeScript от PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=no-unchecked-indexed-access).