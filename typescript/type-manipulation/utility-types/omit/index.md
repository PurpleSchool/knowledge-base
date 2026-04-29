---
metaTitle: Omit в TypeScript — исключаем поля из типа
metaDescription: Разбираем Omit в TypeScript — как исключить ненужные поля из существующего типа, синтаксис, примеры с DTO, API и React-компонентами.
author: Антон Ларичев
title: Omit в TypeScript
preview: Подробный разбор утилитарного типа Omit в TypeScript — как исключить поля из существующего типа, когда использовать вместо Pick и практические примеры.
tags:
  - typescript
---

## Что такое Omit

`Omit<T, K>` — встроенный утилитарный тип TypeScript, который создаёт новый тип на основе `T`, исключая из него поля с ключами `K`. Это «чёрный список» свойств: берём всё, кроме указанного.

Используется везде, где нужно передать объект с чуть меньшим набором полей — например, скрыть пароль при отдаче пользователя клиенту или убрать `id` и `createdAt` при создании новой записи.

## Синтаксис

```typescript
type Result = Omit<OriginalType, 'field1' | 'field2'>;
```

Пример:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

type PublicUser = Omit<User, 'password'>;
// {
//   id: number;
//   name: string;
//   email: string;
//   createdAt: Date;
// }
```

Поле `password` исчезло из типа — передать его больше нельзя, и TypeScript проконтролирует это на этапе компиляции.

## Как работает под капотом

`Omit` реализован через комбинацию `Pick` и `Exclude`:

```typescript
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

`Exclude<keyof T, K>` получает все ключи `T`, кроме перечисленных в `K`, а `Pick` создаёт тип только из этих ключей.

## Примеры использования

### Создание DTO без серверных полей

```typescript
interface Article {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

// При создании статьи id и даты генерирует сервер
type CreateArticleDto = Omit<Article, 'id' | 'createdAt' | 'updatedAt'>;
// { title: string; content: string; authorId: number; }

async function createArticle(dto: CreateArticleDto): Promise<Article> {
  const response = await fetch('/api/articles', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return response.json();
}
```

### Безопасный ответ API

```typescript
interface UserEntity {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'user';
}

// Никогда не возвращаем хэш пароля и соль клиенту
type UserResponse = Omit<UserEntity, 'passwordHash' | 'salt'>;

function toUserResponse(user: UserEntity): UserResponse {
  const { passwordHash, salt, ...publicData } = user;
  return publicData;
}
```

### Расширение типа с заменой поля

```typescript
interface BaseButton {
  label: string;
  onClick: () => void;
  disabled: boolean;
  size: 'sm' | 'md' | 'lg';
}

// Создаём вариант с другим типом onClick
type AsyncButton = Omit<BaseButton, 'onClick'> & {
  onClick: () => Promise<void>;
};
```

Если вы хотите детально изучить TypeScript и все утилитарные типы — приходите на курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=omit). На курсе 180 уроков, AI-тренажёры для практики 24/7 и живое ревью от наставников.

### React-компоненты

```typescript
import { InputHTMLAttributes } from 'react';

interface CustomInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  // Заменяем стандартный onChange на типизированный
  onChange: (value: string) => void;
  label: string;
}

function CustomInput({ label, onChange, ...rest }: CustomInputProps) {
  return (
    <label>
      {label}
      <input {...rest} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
```

## Omit vs Pick

`Omit` и `Pick` — противоположные подходы к созданию подтипов:

| | Omit | Pick |
|---|---|---|
| Подход | Чёрный список (исключаем) | Белый список (берём) |
| Когда удобнее | Полей много, убрать нужно мало | Полей много, взять нужно мало |
| Синтаксис | `Omit<T, 'a' \| 'b'>` | `Pick<T, 'c' \| 'd'>` |

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Нужны все поля кроме password, createdAt, updatedAt
// Omit короче — убираем 3 поля вместо выбора 4
type PublicUser = Omit<User, 'password' | 'createdAt' | 'updatedAt'>;

// Нужны только id и name
// Pick короче — берём 2 поля вместо исключения 5
type UserPreview = Pick<User, 'id' | 'name'>;
```

## Частые ошибки

### Typo в имени поля

TypeScript не выдаст ошибку, если указать несуществующее поле в `Omit` — тип просто останется без изменений:

```typescript
interface User {
  id: number;
  name: string;
}

// Опечатка — поле 'nane' не существует, но ошибки нет
type BuggyType = Omit<User, 'nane'>;
// { id: number; name: string; } — name не удалено!
```

Это поведение TypeScript — будьте внимательны при именах полей.

### Omit не делает исключение рекурсивным

Как и другие Utility Types, `Omit` работает только на верхнем уровне:

```typescript
interface Config {
  db: {
    host: string;
    password: string; // это поле нельзя убрать через верхний Omit
  };
  secret: string;
}

type SafeConfig = Omit<Config, 'secret'>;
// { db: { host: string; password: string; } } — password внутри db остался
```

## Итог

`Omit<T, K>` — удобный способ создать новый тип, убрав из существующего несколько полей. Чаще всего применяется для DTO при создании записей, публичных представлений объектов без чувствительных данных и кастомизации типов библиотек. Когда нужно убрать мало полей — используй `Omit`; когда взять мало полей — предпочти `Pick`.

Для углублённого изучения TypeScript рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=omit). В первых модулях доступно бесплатное содержание.
