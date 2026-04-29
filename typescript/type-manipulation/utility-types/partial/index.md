---
metaTitle: Partial в TypeScript — делаем все поля необязательными
metaDescription: Разбираем Partial в TypeScript — как работает утилитарный тип, синтаксис, примеры использования с PATCH-запросами, формами и обновлением объектов.
author: Антон Ларичев
title: Partial в TypeScript
preview: Подробный разбор утилитарного типа Partial в TypeScript — как сделать все поля объекта необязательными, когда применять и как реализован под капотом.
tags:
  - typescript
---

## Что такое Partial

`Partial<T>` — встроенный утилитарный тип TypeScript, который делает все свойства типа `T` необязательными. После применения `Partial` каждое поле объекта можно не указывать — компилятор не выдаст ошибку.

Это один из самых часто используемых Utility Types: без него пришлось бы вручную дублировать интерфейсы, добавляя `?` к каждому полю.

## Синтаксис

```typescript
type PartialType = Partial<OriginalType>;
```

Пример:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type PartialUser = Partial<User>;
// Результат:
// {
//   id?: number;
//   name?: string;
//   email?: string;
//   age?: number;
// }
```

Все четыре поля становятся необязательными — можно передать объект с любым их набором, включая пустой объект `{}`.

## Как работает под капотом

`Partial` реализован через Mapped Types — TypeScript итерируется по всем ключам типа и добавляет модификатор `?`:

```typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};
```

`keyof T` возвращает union всех ключей типа `T`, а `[P in keyof T]?` добавляет к каждому из них `?`, делая поле опциональным.

## Примеры использования

### PATCH-запросы к API

Самый распространённый сценарий — обновление ресурса, когда нужно передать только изменённые поля:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

async function updateUser(id: number, changes: Partial<User>): Promise<User> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
  return response.json();
}

// Обновляем только имя — остальные поля не обязательны
await updateUser(1, { name: 'Мария' });

// Обновляем email и роль
await updateUser(2, { email: 'maria@example.com', role: 'admin' });
```

### Начальное состояние формы

```typescript
interface ProfileForm {
  username: string;
  bio: string;
  website: string;
  location: string;
}

// При инициализации форма может быть пустой
function createFormState(initial: Partial<ProfileForm> = {}): ProfileForm {
  return {
    username: '',
    bio: '',
    website: '',
    location: '',
    ...initial,
  };
}

const state = createFormState({ username: 'johndoe' });
// { username: 'johndoe', bio: '', website: '', location: '' }
```

### Конфигурация с дефолтными значениями

```typescript
interface ServerConfig {
  host: string;
  port: number;
  timeout: number;
  retries: number;
}

const defaults: ServerConfig = {
  host: 'localhost',
  port: 3000,
  timeout: 5000,
  retries: 3,
};

function createConfig(overrides: Partial<ServerConfig>): ServerConfig {
  return { ...defaults, ...overrides };
}

const config = createConfig({ port: 8080 });
// { host: 'localhost', port: 8080, timeout: 5000, retries: 3 }
```

Если вы хотите детально изучить систему типов TypeScript, включая все Utility Types и дженерики — приходите на курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=partial). На курсе 180 уроков, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника.

## Когда применять Partial

- **PATCH-запросы** — обновление только части полей объекта
- **Дефолтные значения** — слияние пользовательских настроек с умолчаниями
- **Начальное состояние** — инициализация формы или объекта до заполнения
- **Тестирование** — создание mock-объектов без всех обязательных полей
- **Builder-паттерн** — пошаговое построение объекта

## Ограничения

### Partial не работает рекурсивно

`Partial` делает необязательными только верхний уровень. Вложенные объекты остаются без изменений:

```typescript
interface Post {
  id: number;
  title: string;
  author: {
    id: number;
    name: string; // это поле всё ещё обязательно
  };
}

type PartialPost = Partial<Post>;
// {
//   id?: number;
//   title?: string;
//   author?: {
//     id: number;    // обязательно!
//     name: string;  // обязательно!
//   };
// }
```

Для глубокой частичности нужен рекурсивный тип:

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

## Комбинирование с другими Utility Types

`Partial` хорошо сочетается с `Omit` и `Pick`:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Обновляем поля, но исключаем id и createdAt
type UpdateUserDto = Partial<Omit<User, 'id' | 'createdAt'>>;
// { name?: string; email?: string; }

function updateUser(id: number, dto: UpdateUserDto): User {
  // id и createdAt нельзя изменить через этот метод
  return { ...currentUser, ...dto };
}
```

## Итог

`Partial<T>` — незаменимый инструмент для работы с частичными данными. Он избавляет от необходимости создавать дублирующие интерфейсы вроде `UserUpdate` или `UserPatch` вручную, делая код лаконичнее и безопаснее. Используй его всякий раз, когда функция принимает объект, в котором не все поля обязательны.

Для углублённого изучения TypeScript рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=partial). В первых модулях доступно бесплатное содержание.
