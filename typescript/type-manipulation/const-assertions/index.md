---
metaTitle: "TypeScript const assertions: as const с примерами"
metaDescription: "Что такое const assertions в TypeScript, как использовать as const для литеральных типов, readonly объектов и кортежей. Практические примеры."
author: "Антон Ларичев"
title: "const assertions в TypeScript"
preview: "Как as const превращает широкие типы в точные литеральные и делает объекты полностью неизменяемыми на уровне типов."
---

## Что такое const assertions

Когда TypeScript выводит тип переменной, он по умолчанию «расширяет» его до наиболее общего варианта. Строка `"hello"` получает тип `string`, число `42` — тип `number`, а объект со строковым полем — тип с полем типа `string`, а не конкретного литерала. Это удобно для обычных переменных, которые могут меняться, но мешает там, где нужна точность.

`as const` — это специальная конструкция утверждения типа (type assertion), которая говорит компилятору: «считай это значение максимально конкретным и неизменяемым». Официально такая конструкция называется _const assertion_.

```typescript
const greeting = "hello";        // тип: string
const greeting2 = "hello" as const; // тип: "hello"
```

Разница кажется незначительной, но на практике она принципиальна.

## Расширение типов и почему это проблема

Рассмотрим пример без `as const`:

```typescript
const config = {
  env: "production",
  port: 3000,
  debug: false,
};

// TypeScript выводит:
// {
//   env: string;
//   port: number;
//   debug: boolean;
// }
```

Тип полей расширен до примитивов. Значит, TypeScript не сможет отличить `"production"` от `"development"` на уровне типов. Если функция принимает только допустимые значения окружения, проверка провалится:

```typescript
function startServer(env: "production" | "development") {
  console.log(`Starting in ${env} mode`);
}

startServer(config.env); // Ошибка: Argument of type 'string' is not assignable
                          // to parameter of type '"production" | "development"'
```

Компилятор не знает, что `config.env` будет именно `"production"` — с его точки зрения это любая строка.

## as const для объектов

Добавление `as const` фиксирует все значения объекта как литеральные типы и помечает каждое поле как `readonly`:

```typescript
const config = {
  env: "production",
  port: 3000,
  debug: false,
} as const;

// TypeScript выводит:
// {
//   readonly env: "production";
//   readonly port: 3000;
//   readonly debug: false;
// }

startServer(config.env); // Теперь работает
```

Попытка изменить поле вызовет ошибку компиляции:

```typescript
config.env = "development"; // Ошибка: Cannot assign to 'env'
                             // because it is a read-only property
```

### Вложенные объекты

`as const` работает рекурсивно — все вложенные структуры тоже становятся `readonly` с литеральными типами:

```typescript
const settings = {
  database: {
    host: "localhost",
    port: 5432,
  },
  cache: {
    ttl: 3600,
    strategy: "lru",
  },
} as const;

// settings.database.host имеет тип "localhost", а не string
// settings.cache.strategy имеет тип "lru", а не string

settings.database.port = 5433; // Ошибка: Cannot assign to 'port'
```

## as const для массивов и кортежей

Без `as const` TypeScript выводит тип массива как `string[]` или `number[]`, теряя информацию о конкретных элементах и их порядке:

```typescript
const colors = ["red", "green", "blue"];
// Тип: string[]

const point = [10, 20];
// Тип: number[]
```

С `as const` массив превращается в кортеж (`tuple`) с точными типами элементов:

```typescript
const colors = ["red", "green", "blue"] as const;
// Тип: readonly ["red", "green", "blue"]

const point = [10, 20] as const;
// Тип: readonly [10, 20]
```

Теперь TypeScript знает не только типы элементов, но и их количество и порядок. Это особенно полезно при деструктуризации:

```typescript
const [x, y] = point;
// x: 10, y: 20 — точные литеральные типы
```

### Применение с union-типами

Типичный паттерн — создать массив допустимых значений и извлечь из него union-тип:

```typescript
const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE"] as const;

type HttpMethod = typeof ALLOWED_METHODS[number];
// type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

function request(url: string, method: HttpMethod) {
  // ...
}

request("/api/users", "GET");    // Работает
request("/api/users", "PATCH");  // Ошибка: 'PATCH' не входит в тип HttpMethod
```

## Замена enum через as const

Enum в TypeScript имеет ряд особенностей, которые иногда нежелательны: они компилируются в объект в рантайме, не работают с обычными строками без явного приведения, а `const enum` полностью стирается, что мешает при изолированной компиляции.

Альтернатива — объект с `as const`:

```typescript
const Direction = {
  Up: "UP",
  Down: "DOWN",
  Left: "LEFT",
  Right: "RIGHT",
} as const;

type Direction = typeof Direction[keyof typeof Direction];
// type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

function move(direction: Direction) {
  console.log(`Moving ${direction}`);
}

move(Direction.Up);  // Работает
move("DOWN");        // Тоже работает — строка совместима с типом
move("diagonal");    // Ошибка
```

Такой подход прозрачнее: в рантайме это обычный объект, типы полностью выведены, а строковые литералы совместимы с типом напрямую.

## Практический пример: конфигурация маршрутов

```typescript
const ROUTES = {
  home: "/",
  users: "/users",
  userDetail: "/users/:id",
  settings: "/settings",
} as const;

type AppRoute = typeof ROUTES[keyof typeof ROUTES];
// type AppRoute = "/" | "/users" | "/users/:id" | "/settings"

function navigate(route: AppRoute) {
  window.location.href = route;
}

navigate(ROUTES.home);     // Работает
navigate("/unknown");      // Ошибка
```

## Практический пример: варианты компонента

```typescript
const BUTTON_VARIANTS = ["primary", "secondary", "danger", "ghost"] as const;
const BUTTON_SIZES = ["sm", "md", "lg"] as const;

type ButtonVariant = typeof BUTTON_VARIANTS[number];
type ButtonSize = typeof BUTTON_SIZES[number];

interface ButtonProps {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled?: boolean;
  children: React.ReactNode;
}

function Button({ variant, size, disabled, children }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// Использование:
<Button variant="primary" size="md">Отправить</Button>   // Работает
<Button variant="outline" size="md">Отправить</Button>   // Ошибка
```

## as const против Object.freeze

Важно понимать разницу между `as const` и `Object.freeze`:

| Характеристика | `as const` | `Object.freeze` |
|---|---|---|
| Уровень действия | Только типы (compile-time) | Только рантайм |
| Вложенные объекты | Рекурсивно readonly в типах | Только первый уровень |
| Влияние на рантайм | Нет | Запрещает изменения |
| Производительность | Бесплатно | Небольшой overhead |

```typescript
// Object.freeze не даёт литеральных типов
const frozenConfig = Object.freeze({
  env: "production",
});
// frozenConfig.env имеет тип string, а не "production"

// as const даёт литеральные типы, но не защищает в рантайме от JS
const constConfig = { env: "production" } as const;
// constConfig.env имеет тип "production"
// В рантайме TypeScript не существует — JS может изменить объект
// (но компилятор предупредит при попытке это сделать)
```

Для максимальной защиты можно комбинировать оба подхода:

```typescript
const config = Object.freeze({
  env: "production",
  port: 3000,
} as const);

// TypeScript знает точные типы + рантайм защищает от мутаций
```

## Ограничения as const

`as const` применяется только к литеральным значениям, известным на этапе компиляции. Использовать его с динамическими данными нельзя:

```typescript
const userInput = prompt("Enter value") as const; // Ошибка
// 'as const' can only be applied to a literal expression

const fromApi = fetchData() as const; // Ошибка
```

Также стоит помнить, что `readonly` в TypeScript — это только типовое ограничение. Оно не существует в скомпилированном JavaScript:

```typescript
const obj = { value: 42 } as const;

// TypeScript не позволит написать:
// obj.value = 99; // Ошибка компиляции

// Но в рантайме (уже в JS) это сработает без ошибок:
(obj as any).value = 99; // Значение изменится
```

## Вывод типов из функций с as const

Иногда нужно, чтобы функция возвращала константный тип. Для этого можно применить `as const` к возвращаемому значению:

```typescript
function getConfig() {
  return {
    apiUrl: "https://api.example.com",
    timeout: 5000,
  } as const;
}

type Config = ReturnType<typeof getConfig>;
// {
//   readonly apiUrl: "https://api.example.com";
//   readonly timeout: 5000;
// }

const config = getConfig();
// config.apiUrl имеет тип "https://api.example.com"
```

## Итог

`as const` — небольшое дополнение с большим эффектом:

- Превращает широкие примитивные типы (`string`, `number`) в точные литеральные (`"production"`, `3000`)
- Помечает все поля объекта как `readonly` рекурсивно
- Превращает массивы в кортежи с фиксированным составом
- Позволяет создавать union-типы из массивов и объектов через `typeof ... [number]` и `typeof ... [keyof typeof ...]`
- Служит чистой альтернативой `enum` без побочных эффектов в рантайме

Применяйте `as const` везде, где значение задаётся один раз и не должно меняться: конфигурации, словари, списки допустимых значений, константы маршрутов и вариантов компонентов.

Чтобы глубже разобраться с системой типов TypeScript и научиться применять подобные техники в реальных проектах, пройдите курс [TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-const-assertions).