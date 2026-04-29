---
metaTitle: Template Literal Types в TypeScript — шаблонные типы
metaDescription: "Разбираем Template Literal Types в TypeScript: строковые шаблонные типы, комбинации с union, утилиты Uppercase, Lowercase, Capitalize и практические примеры."
author: Антон Ларичев
title: Template Literal Types в TypeScript
preview: Изучаем Template Literal Types в TypeScript — строковые шаблонные типы, их комбинации с union, встроенные утилиты Uppercase и Capitalize, практические примеры применения.
---

## Введение

Template Literal Types (шаблонные литеральные типы) — это возможность TypeScript, появившаяся в версии 4.1, которая позволяет создавать типы-строки по тем же правилам, что и JavaScript-шаблонные строки. Если в JS вы пишете `` `Hello, ${name}!` ``, то в TypeScript вы можете писать `` `get${Capitalize<string>}` `` — и получите тип, описывающий все строки вида `getName`, `getUser`, `getProduct` и т.д.

Это открывает принципиально новые возможности для статической типизации: строго типизированные CSS-классы, имена событий, ключи API и многое другое.

## Базовый синтаксис

Template Literal Types используют те же обратные кавычки и `${}`, что и обычные шаблонные строки:

```typescript
// Создаём тип для строк с определённым префиксом
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<"click">;   // "onClick"
type FocusEvent = EventName<"focus">;   // "onFocus"
type ChangeEvent = EventName<"change">; // "onChange"

// Простые составные строки
type Greeting = `Hello, ${string}!`;

const g1: Greeting = "Hello, World!";    // OK
const g2: Greeting = "Hello, TypeScript!"; // OK
// const g3: Greeting = "Hi, World!";    // Ошибка! Не соответствует шаблону
```

## Комбинирование с Union Types

Настоящая мощь Template Literal Types раскрывается при комбинировании с union-типами. TypeScript автоматически создаёт все возможные комбинации:

```typescript
// Два union-типа перемножаются
type Direction = "top" | "right" | "bottom" | "left";
type Axis = "X" | "Y";

type DirectionAxis = `${Direction}-${Axis}`;
// "top-X" | "top-Y" | "right-X" | "right-Y" | "bottom-X" | "bottom-Y" | "left-X" | "left-Y"

// CSS-свойства с направлениями
type CSSProperty = "margin" | "padding";
type CSSDirection = "top" | "right" | "bottom" | "left";

type CSSDirectionalProperty = `${CSSProperty}-${CSSDirection}`;
// "margin-top" | "margin-right" | "margin-bottom" | "margin-left" |
// "padding-top" | "padding-right" | "padding-bottom" | "padding-left"

// Строго типизированные стили для компонента
function setStyle(property: CSSDirectionalProperty, value: string): void {
  console.log(`Устанавливаем ${property}: ${value}`);
}

setStyle("margin-top", "16px");     // OK
setStyle("padding-left", "8px");    // OK
// setStyle("border-top", "1px");   // Ошибка! Не входит в тип
```

Если вы хотите детально изучить систему типов TypeScript, включая Template Literal Types — приходите на наш большой курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=template-literal-types).
На курсе 192 урока и 17 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Встроенные утилиты для строковых типов

TypeScript предоставляет четыре встроенных утилиты для трансформации строковых типов:

### Uppercase\<S\>

Переводит все символы строки в верхний регистр:

```typescript
type Shout<T extends string> = Uppercase<T>;

type Hello = Shout<"hello">;     // "HELLO"
type World = Shout<"world">;     // "WORLD"

// Практический пример: константы для Redux actions
type ActionType = "fetchUser" | "updateProfile" | "deleteAccount";
type ReduxAction = Uppercase<ActionType>;
// "FETCHUSER" | "UPDATEPROFILE" | "DELETEACCOUNT"
```

### Lowercase\<S\>

Переводит все символы строки в нижний регистр:

```typescript
type Normalize<T extends string> = Lowercase<T>;

type NormalizedRoute = Normalize<"GET" | "POST" | "PUT" | "DELETE">;
// "get" | "post" | "put" | "delete"

// Строго типизированные HTTP-методы
type HttpMethod = Lowercase<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">;

interface ApiClient {
  request(method: HttpMethod, url: string): Promise<Response>;
}
```

### Capitalize\<S\>

Переводит первый символ строки в верхний регистр:

```typescript
type CapitalizeWord<T extends string> = Capitalize<T>;

type Title = CapitalizeWord<"typescript">; // "Typescript"

// Генерация геттеров и сеттеров
type FieldName = "name" | "age" | "email";
type Getter = `get${Capitalize<FieldName>}`;
// "getName" | "getAge" | "getEmail"

type Setter = `set${Capitalize<FieldName>}`;
// "setName" | "setAge" | "setEmail"
```

### Uncapitalize\<S\>

Переводит первый символ строки в нижний регистр:

```typescript
type LowercaseFirst<T extends string> = Uncapitalize<T>;

type CamelCase = LowercaseFirst<"UserName" | "UserId">;
// "userName" | "userId"
```

## Практические примеры

### Строго типизированные события DOM

```typescript
// Типизированная система событий
type EventMap = {
  click: MouseEvent;
  keydown: KeyboardEvent;
  focus: FocusEvent;
  blur: FocusEvent;
  input: InputEvent;
};

type EventHandler<T extends keyof EventMap> = `on${Capitalize<T>}`;

// Результат: "onClick" | "onKeydown" | "onFocus" | "onBlur" | "onInput"
type AllHandlers = EventHandler<keyof EventMap>;

// Объект с обработчиками событий
type EventHandlers = {
  [K in keyof EventMap as `on${Capitalize<K>}`]?: (event: EventMap[K]) => void;
};

const handlers: EventHandlers = {
  onClick: (e) => console.log("Клик:", e.clientX, e.clientY),
  onKeydown: (e) => console.log("Клавиша:", e.key),
};
```

### Строго типизированные пути API

```typescript
// Версионированные API-маршруты
type ApiVersion = "v1" | "v2";
type Resource = "users" | "products" | "orders";

type ApiPath = `/api/${ApiVersion}/${Resource}`;
// "/api/v1/users" | "/api/v1/products" | "/api/v1/orders" |
// "/api/v2/users" | "/api/v2/products" | "/api/v2/orders"

async function fetchApi(path: ApiPath): Promise<Response> {
  return fetch(path);
}

fetchApi("/api/v1/users");    // OK
fetchApi("/api/v2/products"); // OK
// fetchApi("/api/v3/users"); // Ошибка! Версии v3 нет
```

### Извлечение частей строкового типа через infer

```typescript
// Извлекаем параметры из пути API
type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : T extends `${infer _Start}:${infer Param}`
    ? Param
    : never;

type Params = ExtractRouteParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"

// Строго типизированный роутер
type RouteParams<T extends string> = {
  [K in ExtractRouteParams<T>]: string;
};

function navigate<T extends string>(path: T, params: RouteParams<T>): string {
  let result: string = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value as string);
  }
  return result;
}

const url = navigate("/users/:userId/posts/:postId", {
  userId: "42",
  postId: "123",
});
// "/users/42/posts/123"
```

## Частые ошибки

* **Взрывной рост union-типов** — комбинирование нескольких union-типов в Template Literal может создать тысячи комбинаций и существенно замедлить компиляцию; TypeScript выдаст ошибку при превышении 100 000 элементов
* **Путаница с `string` vs литеральным типом** — `Template<string>` создаёт `string` (не полезно), а нужно использовать конкретные union-типы литералов
* **infer в Template Literal без рекурсии** — при разборе сложных строк нередко забывают о рекурсии, и паттерн работает только для первого вхождения
* **Регистрозависимость** — TypeScript различает `"GET"` и `"get"` как разные типы; используйте `Uppercase`/`Lowercase` для нормализации
* **Избыточная сложность** — не стоит использовать Template Literal Types там, где хватит обычного `string`; усложнение типов должно давать реальную пользу

## Заключение

Template Literal Types расширяют систему типов TypeScript до уровня, где можно строго типизировать строки по их структуре и содержанию. Это особенно ценно в больших проектах с REST API, системами событий, i18n и любым другим кодом, где строки несут структурную нагрузку.

В сочетании с Mapped Types и Conditional Types они позволяют создавать утилитные типы, которые автоматически генерируют правильные имена методов, маршруты и обработчики событий. Для глубокого изучения всех инструментов системы типов TypeScript рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=template-literal-types).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет начать изучение TypeScript и оценить качество материалов до покупки полного доступа.
