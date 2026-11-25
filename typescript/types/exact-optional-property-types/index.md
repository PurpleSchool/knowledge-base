---
metaTitle: "exactOptionalPropertyTypes в TypeScript — строгая проверка опциональных свойств"
metaDescription: "Разбираем флаг exactOptionalPropertyTypes в TypeScript: чем отличается отсутствующее свойство от undefined и как это влияет на типобезопасность."
author: "Антон Ларичев"
title: "exactOptionalPropertyTypes в TypeScript"
preview: "Флаг exactOptionalPropertyTypes делает TypeScript строже: он различает отсутствующее свойство и свойство со значением undefined. Разбираем на примерах."
---

## Что такое exactOptionalPropertyTypes

В TypeScript опциональное свойство объявляется с помощью знака вопроса:

```typescript
interface User {
  name: string;
  age?: number;
}
```

На первый взгляд кажется, что `age?: number` означает «свойство может быть числом или отсутствовать». Но по умолчанию TypeScript трактует это шире: он также разрешает явно присвоить `undefined`:

```typescript
const user: User = {
  name: 'Иван',
  age: undefined, // TypeScript по умолчанию разрешает это
};
```

Это поведение существует по историческим причинам и ради совместимости, но оно размывает границу между двумя принципиально разными состояниями:

- Свойство **отсутствует** — `'age' in user === false`
- Свойство **присутствует, но равно `undefined`** — `'age' in user === true`

Флаг компилятора `exactOptionalPropertyTypes`, добавленный в TypeScript 4.4, устраняет эту двусмысленность и делает систему типов более точной.

## Как включить exactOptionalPropertyTypes

Флаг добавляется в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "strictNullChecks": true
  }
}
```

Важно: `exactOptionalPropertyTypes` требует включённого `strictNullChecks`. Без него флаг не имеет эффекта, потому что сам `strictNullChecks` является фундаментом для работы с `null` и `undefined` в типах.

`exactOptionalPropertyTypes` **не входит** в набор флага `strict: true`, поэтому его нужно включать явно.

## Как изменяется поведение компилятора

После включения флага присвоение `undefined` опциональному свойству становится ошибкой компиляции:

```typescript
interface User {
  name: string;
  age?: number;
}

// Ошибка: Type 'undefined' is not assignable to type 'number'
// with 'exactOptionalPropertyTypes: true'
const user: User = {
  name: 'Иван',
  age: undefined, // TS2375
};
```

Чтобы выразить оба состояния явно, нужно добавить `undefined` в тип:

```typescript
interface User {
  name: string;
  age?: number | undefined; // явно разрешаем undefined
}

// Теперь оба варианта допустимы
const user1: User = { name: 'Иван' };             // свойство отсутствует
const user2: User = { name: 'Иван', age: undefined }; // свойство есть, значение undefined
const user3: User = { name: 'Иван', age: 30 };     // свойство есть, значение задано
```

## Разница между `?:` и `?: T | undefined`

С включённым флагом два объявления означают разное:

```typescript
interface A {
  prop?: string;           // свойство может ОТСУТСТВОВАТЬ, тип — string
}

interface B {
  prop?: string | undefined; // свойство может отсутствовать ИЛИ быть undefined
}
```

Для `A` допустим только вариант без свойства или со строкой:

```typescript
const a1: A = {};                   // OK
const a2: A = { prop: 'hello' };    // OK
const a3: A = { prop: undefined };  // Ошибка!
```

Для `B` допустимы все три варианта:

```typescript
const b1: B = {};                   // OK
const b2: B = { prop: 'hello' };    // OK
const b3: B = { prop: undefined };  // OK
```

## Практический пример: обновление объекта

Одна из типичных задач, где `exactOptionalPropertyTypes` особенно полезен — частичное обновление данных.

Без флага следующий код проходит проверку типов, хотя логически содержит ошибку:

```typescript
interface UserProfile {
  displayName: string;
  bio?: string;
  website?: string;
}

function updateProfile(profile: UserProfile, updates: Partial<UserProfile>): UserProfile {
  return { ...profile, ...updates };
}

const original: UserProfile = {
  displayName: 'Антон',
  bio: 'TypeScript разработчик',
};

// Намерение: «не менять bio»
// Реальный эффект: bio становится undefined в результирующем объекте
const updated = updateProfile(original, { displayName: 'Антон Л.', bio: undefined });
// updated.bio === undefined, хотя мы не хотели его трогать
```

С `exactOptionalPropertyTypes: true` это стало бы ошибкой компиляции, подталкивая к более точному API:

```typescript
type PartialUpdate<T> = {
  [K in keyof T]?: NonNullable<T[K]>; // только реальные значения, не undefined
};

function updateProfile(profile: UserProfile, updates: PartialUpdate<UserProfile>): UserProfile {
  return { ...profile, ...updates };
}

// Теперь передать undefined нельзя — TypeScript выдаст ошибку
// updateProfile(original, { bio: undefined }); // Ошибка!

// Корректное использование:
const updated = updateProfile(original, { displayName: 'Антон Л.' });
```

## Работа с Partial и другими утилитами

Флаг влияет на стандартные утилиты типов. `Partial<T>` по умолчанию добавляет `| undefined` ко всем свойствам:

```typescript
interface Config {
  host: string;
  port: number;
  timeout: number;
}

// Partial<Config> эквивалентно:
interface PartialConfig {
  host?: string | undefined;
  port?: number | undefined;
  timeout?: number | undefined;
}
```

С включённым `exactOptionalPropertyTypes` это позволяет передавать `undefined` как значения `Partial<Config>`, поскольку `| undefined` явно указан в типе.

Если нужна более строгая версия `Partial`, можно определить собственную утилиту:

```typescript
type StrictPartial<T> = {
  [K in keyof T]?: T[K]; // без | undefined
};

type StrictPartialConfig = StrictPartial<Config>;
// Теперь свойства могут только отсутствовать, но не быть undefined

const c1: StrictPartialConfig = { host: 'localhost' };     // OK
const c2: StrictPartialConfig = { host: undefined };       // Ошибка с флагом!
```

## Проверка наличия свойства через `in`

С `exactOptionalPropertyTypes` имеет смысл использовать оператор `in` для проверки наличия свойства, а не просто сравнение с `undefined`:

```typescript
interface Settings {
  theme?: 'light' | 'dark';
  language?: string;
}

function applySettings(settings: Settings) {
  // Без флага: оба варианта одинаковы
  // С флагом: in проверяет наличие ключа, !== undefined проверяет значение
  
  if ('theme' in settings) {
    // settings.theme существует как ключ
    // но может быть 'light', 'dark' (или undefined если тип включает его)
    console.log('Применяем тему:', settings.theme);
  }
  
  if (settings.language !== undefined) {
    // language задан и не undefined
    console.log('Применяем язык:', settings.language);
  }
}
```

## Работа с Record и индексными сигнатурами

Флаг также влияет на доступ к свойствам через индексные сигнатуры:

```typescript
type StringMap = Record<string, string>;

// С exactOptionalPropertyTypes доступ к несуществующему ключу
// возвращает string | undefined, но присваивать undefined нельзя
const map: StringMap = {};

// Ошибка: нельзя присвоить undefined значению типа string
// map['key'] = undefined;

// Правильно: удаляем ключ
delete (map as Record<string, string | undefined>)['key'];
```

## Миграция существующего кода

Включение `exactOptionalPropertyTypes` в существующем проекте может выявить множество мест, где неявно использовался `undefined`. Вот стратегия миграции:

**Шаг 1.** Включите флаг и соберите список ошибок:

```bash
tsc --noEmit --exactOptionalPropertyTypes 2>&1 | grep 'TS2375' | wc -l
```

**Шаг 2.** Разделите исправления на категории:

```typescript
// Категория 1: Явно добавить | undefined туда, где это осмысленно
interface FormField {
  value?: string | undefined; // поле может быть пустым или незаполненным
}

// Категория 2: Убрать присвоение undefined — использовать delete или опускать свойство
const obj: { name?: string } = { name: 'test' };
// obj.name = undefined; // было
delete obj.name;        // стало

// Категория 3: Пересмотреть API — возможно, тип был некорректным изначально
function createUser(name: string, role?: 'admin' | 'user') {
  // role теперь точно 'admin' | 'user', а не 'admin' | 'user' | undefined
  // доступ к нему: if (role !== undefined) { ... }
}
```

**Шаг 3.** Используйте постепенное включение через `// @ts-expect-error` для временного подавления ошибок в сложных местах, планируя их исправить позже.

## Взаимодействие с JSON и внешними данными

Одна из причин, почему это важно на практике — работа с JSON и внешними API:

```typescript
interface ApiResponse {
  userId: number;
  username: string;
  email?: string; // Email может отсутствовать в ответе
}

function processResponse(data: unknown): ApiResponse {
  const response = data as ApiResponse;
  
  // JSON.parse никогда не создаёт свойство со значением undefined —
  // ключ либо есть с реальным значением, либо отсутствует.
  // exactOptionalPropertyTypes отражает эту реальность в типах.
  
  return response;
}

// При сериализации в JSON:
const obj: ApiResponse = { userId: 1, username: 'ivan' };
const json = JSON.stringify(obj);
// {"userId":1,"username":"ivan"} — email отсутствует, а не null/undefined
```

## Когда стоит включать флаг

Флаг рекомендуется включать в следующих ситуациях:

- **Новые проекты** — с самого начала устанавливает правильные семантические границы.
- **Проекты с API** — когда важно различать «поле не передано» и «поле передано как null/undefined».
- **Библиотеки** — помогает создавать более точные публичные интерфейсы.
- **Проекты с `strict: true`** — логичное дополнение к строгому режиму.

С осторожностью стоит применять в крупных существующих проектах без хорошего тестового покрытия — миграция может потребовать значительных усилий.

## Итог

`exactOptionalPropertyTypes` — это один из флагов TypeScript, который делает систему типов более точной за счёт разграничения двух принципиально разных состояний: отсутствие свойства и свойство со значением `undefined`. После его включения:

- `prop?: T` означает «свойство может отсутствовать, тип — `T`»
- `prop?: T | undefined` означает «свойство может отсутствовать или быть `undefined`»
- Явное присвоение `undefined` опциональному свойству без `| undefined` в типе является ошибкой

Флаг не входит в `strict`, но хорошо дополняет строгий режим и помогает выявить скрытые логические ошибки в коде, особенно при работе с обновлением объектов и внешними данными.

Чтобы глубже разобраться в системе типов TypeScript и научиться писать надёжный типизированный код, изучите курс по TypeScript на PurpleSchool: [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=exactOptionalPropertyTypes).
