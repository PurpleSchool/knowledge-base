---
metaTitle: "Оператор satisfies в TypeScript — проверка типов без сужения"
metaDescription: "Разбираем оператор satisfies в TypeScript 4.9+: как проверять соответствие типу, сохраняя точный вывод типов. Примеры и сравнение с аннотациями."
author: "Антон Ларичев"
title: "Оператор satisfies в TypeScript"
preview: "Узнайте, как оператор satisfies позволяет проверять тип значения без потери точной информации о нём — и когда это критично."
---

## Что такое оператор satisfies

Оператор `satisfies` появился в TypeScript 4.9. Он решает конкретную проблему: иногда нужно убедиться, что значение соответствует некоторому типу, но при этом не терять более точную информацию о его структуре, которую TypeScript способен вывести самостоятельно.

До появления `satisfies` разработчики стояли перед выбором: либо задать аннотацию типа и получить безопасность проверки, либо не задавать её и сохранить точный вывод типов. Оператор `satisfies` снимает это противоречие.

## Проблема, которую решает satisfies

Рассмотрим классический пример. Есть объект с настройками цветов палитры:

```typescript
type Color = "red" | "green" | "blue";
type ColorMap = Record<Color, string | [number, number, number]>;

const palette: ColorMap = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
};

// Ошибка: Property 'toUpperCase' does not exist on type 'string | [number, number, number]'
const greenHex = palette.green.toUpperCase();
```

Типизация через `ColorMap` гарантирует, что объект содержит все три ключа и значения нужного вида. Но она же «расширяет» тип каждого значения до `string | [number, number, number]` — TypeScript забывает, что `green` конкретно является строкой.

Можно убрать аннотацию и дать TypeScript вывести тип самостоятельно:

```typescript
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
};

// Теперь работает — TypeScript знает, что green это string
const greenHex = palette.green.toUpperCase();

// Но теперь можно добавить несуществующий ключ без ошибки
const bad = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
  yellow: "#ffff00", // Не является ключом Color — а ошибки нет
};
```

Оператор `satisfies` даёт оба преимущества сразу:

```typescript
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies ColorMap;

// TypeScript знает, что green — строка
const greenHex = palette.green.toUpperCase(); // OK

// TypeScript проверяет соответствие ColorMap
const badPalette = {
  red: [255, 0, 0],
  green: "#00ff00",
  yellow: "#ffff00", // Ошибка: Object literal may only specify known properties
} satisfies ColorMap;
```

## Синтаксис

Оператор используется как постфиксное выражение:

```typescript
const value = expression satisfies SomeType;
```

Важно: `satisfies` не меняет тип переменной в рантайме — он только добавляет проверку во время компиляции. Если выражение не соответствует типу, TypeScript выдаст ошибку. Если соответствует — переменная получает тип, выведенный из самого выражения, а не из аннотации.

## satisfies против аннотации типа

Посмотрим на разницу поведения на конкретных примерах.

### Аннотация расширяет тип

```typescript
type Route = {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
};

const getUsers: Route = {
  path: "/users",
  method: "GET",
};

// Тип method — "GET" | "POST" | "PUT" | "DELETE"
// TypeScript не знает, что это конкретно "GET"
type MethodType = typeof getUsers.method; // "GET" | "POST" | "PUT" | "DELETE"
```

### satisfies сохраняет точный тип

```typescript
const getUsers = {
  path: "/users",
  method: "GET",
} satisfies Route;

// TypeScript знает точный литеральный тип
type MethodType = typeof getUsers.method; // "GET"

// Проверка соответствия Route работает — ошибочный метод не пройдёт
const badRoute = {
  path: "/users",
  method: "PATCH", // Ошибка: Type '"PATCH"' is not assignable to type '"GET" | "POST" | "PUT" | "DELETE"'
} satisfies Route;
```

## Практические сценарии применения

### Конфигурационные объекты

Очень частый сценарий — типизация конфигураций, где важно сохранить точные ключи и значения:

```typescript
type FeatureFlags = {
  [key: string]: boolean;
};

const flags = {
  darkMode: true,
  betaFeatures: false,
  newDashboard: true,
} satisfies FeatureFlags;

// TypeScript знает все конкретные ключи
const hasDarkMode = flags.darkMode; // boolean (а не any)

// Автодополнение работает только для известных ключей
// flags.unknownFlag — ошибка компиляции, хотя FeatureFlags это допускает
```

### Маршруты и роутинг

```typescript
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type ApiRoute = {
  method: HttpMethod;
  path: string;
  requiresAuth: boolean;
};

const routes = {
  listUsers: { method: "GET", path: "/api/users", requiresAuth: true },
  createUser: { method: "POST", path: "/api/users", requiresAuth: true },
  publicHealth: { method: "GET", path: "/health", requiresAuth: false },
} satisfies Record<string, ApiRoute>;

// TypeScript выводит точный тип каждого поля
const listMethod = routes.listUsers.method; // "GET", не HttpMethod
const isAuthRequired = routes.publicHealth.requiresAuth; // false, не boolean
```

### Объекты с функциями

```typescript
type Handler = (input: string) => string;

const transformers = {
  trim: (s: string) => s.trim(),
  upper: (s: string) => s.toUpperCase(),
  lower: (s: string) => s.toLowerCase(),
} satisfies Record<string, Handler>;

// Тип transformers.trim — (s: string) => string
// Функции типизированы точно, без потери информации
const result = transformers.upper("hello"); // string
```

### Перечисление значений через const объект

Паттерн «const enum замена» с `satisfies` становится безопаснее:

```typescript
type Direction = "north" | "south" | "east" | "west";

const DIRECTIONS = {
  NORTH: "north",
  SOUTH: "south",
  EAST: "east",
  WEST: "west",
} satisfies Record<string, Direction>;

// Тип DIRECTIONS.NORTH — "north" (литеральный), а не Direction
function move(direction: Direction) {
  console.log(`Moving ${direction}`);
}

move(DIRECTIONS.NORTH); // OK — "north" совместимо с Direction

// При опечатке в значении сразу получим ошибку
const BAD_DIRECTIONS = {
  NORTH: "norht", // Ошибка: Type '"norht"' is not assignable to type 'Direction'
} satisfies Record<string, Direction>;
```

## Комбинирование с as const

`satisfies` хорошо сочетается с `as const` для максимальной точности типов:

```typescript
type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonConfig = {
  label: string;
  variant: ButtonVariant;
  disabled?: boolean;
};

const buttons = [
  { label: "Сохранить", variant: "primary" },
  { label: "Отмена", variant: "secondary" },
  { label: "Удалить", variant: "danger", disabled: false },
] as const satisfies readonly ButtonConfig[];

// Каждый элемент имеет точный литеральный тип
type FirstLabel = typeof buttons[0]["label"]; // "Сохранить"
type FirstVariant = typeof buttons[0]["variant"]; // "primary"
```

Обратите внимание: при совместном использовании `as const` пишется первым, `satisfies` — последним. Порядок важен: сначала TypeScript делает все типы readonly и литеральными, затем проверяет соответствие.

## satisfies и вложенные объекты

Оператор корректно работает с вложенными структурами:

```typescript
type Theme = {
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
};

const lightTheme = {
  colors: {
    primary: "#3b82f6",
    secondary: "#64748b",
    background: "#ffffff",
  },
  spacing: {
    small: 4,
    medium: 8,
    large: 16,
  },
} satisfies Theme;

// TypeScript сохраняет точные типы на всех уровнях
type PrimaryColor = typeof lightTheme.colors.primary; // string (из литерала)
type SmallSpacing = typeof lightTheme.spacing.small;  // number

// Валидация работает и для вложенных свойств
const badTheme = {
  colors: {
    primary: 123, // Ошибка: Type 'number' is not assignable to type 'string'
    secondary: "#64748b",
    background: "#ffffff",
  },
  spacing: {
    small: 4,
    medium: 8,
    large: 16,
  },
} satisfies Theme;
```

## Типичные ошибки и ограничения

### satisfies не меняет тип переменной

Если переменной нужно присвоить несовместимое значение позже — аннотация всё равно нужна:

```typescript
type Animal = { name: string };

// satisfies не даёт переменной тип Animal
const dog = { name: "Rex", breed: "Labrador" } satisfies Animal;

// Тип dog — { name: string; breed: string }, а не Animal
// Это может быть проблемой при передаче в функцию, ожидающую Animal
function greet(animal: Animal) {
  console.log(animal.name);
}

greet(dog); // OK — структурная совместимость работает

// Но если нужно явно Animal:
let animal: Animal;
animal = dog; // OK
// vs
const animal2 = dog satisfies Animal; // animal2 — { name: string; breed: string }
```

### Проверка неполных объектов

```typescript
type Config = {
  host: string;
  port: number;
  ssl: boolean;
};

// Ошибка: Property 'ssl' is missing
const partialConfig = {
  host: "localhost",
  port: 3000,
} satisfies Config;

// Если нужны частичные объекты — используйте Partial<>
const partialConfig2 = {
  host: "localhost",
  port: 3000,
} satisfies Partial<Config>; // OK
```

## Когда использовать satisfies, а когда аннотацию

Правило простое: если важно сохранить точный выводимый тип значения — используйте `satisfies`. Если важно, чтобы переменная имела конкретный тип (например, для последующего переприсвоения или передачи в типизированные хранилища) — используйте аннотацию.

Используйте `satisfies`, когда:
- Создаёте конфигурационные объекты и хотите проверить их корректность без потери деталей
- Работаете с `Record`-типами и хотите сохранить конкретные ключи
- Нужна валидация массивов объектов с сохранением литеральных типов
- Комбинируете с `as const` для строгой типизации констант

Используйте аннотацию типа, когда:
- Переменная будет переприсваиваться значениями разных подтипов
- Нужно явно документировать, что переменная имеет широкий тип
- Работаете с классами, где важен nominal typing через implements

## Итог

Оператор `satisfies` заполняет важный пробел в системе типов TypeScript. Он даёт одновременно проверку соответствия типу и сохранение точного выводимого типа — то, что раньше было невозможно достичь без компромиссов.

Особенно полезен при работе с конфигурациями, маршрутами, словарями и любыми объектами, где структура фиксирована, но TypeScript должен видеть конкретные значения, а не обобщённые типы.

Чтобы глубже разобраться в системе типов TypeScript и научиться уверенно применять подобные инструменты на практике, изучите курс на PurpleSchool:

[Курс по TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=satisfies-operator)
