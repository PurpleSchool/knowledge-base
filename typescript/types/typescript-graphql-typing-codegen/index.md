---
metaTitle: "TypeScript с GraphQL: типизация и кодогенерация"
metaDescription: "Как типизировать GraphQL-запросы в TypeScript с помощью graphql-codegen: настройка, генерация типов, интеграция с Apollo Client и React."
author: "Антон Ларичев"
title: "TypeScript с GraphQL — типизация и кодогенерация"
preview: "Разбираем, как избавиться от any в GraphQL-запросах: ручная типизация, graphql-codegen, плагины и интеграция с Apollo Client."
---

## Зачем типизировать GraphQL-запросы

GraphQL уже гарантирует корректность данных на уровне схемы — но только на сервере. Клиентский код без типизации по-прежнему работает с `any`, что делает рефакторинг опасным, а автодополнение — недоступным.

Рассмотрим типичную проблему:

```typescript
const { data } = useQuery(GET_USER);
// data имеет тип any
console.log(data.user.naem); // опечатка — TypeScript промолчит
```

Типизация GraphQL решает несколько задач:

- Ошибки несоответствия типов обнаруживаются на этапе компиляции, а не в продакшене
- IDE предлагает автодополнение по полям запроса
- Рефакторинг схемы немедленно подсвечивает затронутые места в клиентском коде
- Фрагменты получают собственные типы и переиспользуются безопасно

## Ручная типизация — отправная точка

До появления инструментов кодогенерации типы писали вручную.

```typescript
// Определяем типы вручную
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'GUEST';
}

interface GetUserQuery {
  user: User | null;
}

interface GetUserQueryVariables {
  id: string;
}

// Используем с Apollo Client
const { data } = useQuery<GetUserQuery, GetUserQueryVariables>(GET_USER, {
  variables: { id: '123' },
});

// Теперь data.user.naem вызовет ошибку TypeScript
console.log(data?.user?.name); // ok
```

Проблема ручного подхода — синхронизация. При изменении схемы сервера придётся вручную обновлять все интерфейсы. В крупных проектах это становится источником ошибок.

## GraphQL Code Generator

`graphql-codegen` — де-факто стандарт для автоматической генерации TypeScript-типов из GraphQL-схемы и клиентских операций. Он читает схему сервера и файлы с запросами, после чего генерирует точные типы для каждой операции.

### Установка

```bash
npm install -D @graphql-codegen/cli @graphql-codegen/client-preset
```

Для проектов с Apollo Client дополнительно потребуется:

```bash
npm install -D @graphql-codegen/typescript @graphql-codegen/typescript-operations
```

### Настройка codegen.yml

Создайте файл конфигурации в корне проекта:

```yaml
# codegen.yml
schema: 'http://localhost:4000/graphql'
documents: 'src/**/*.graphql'
generates:
  src/gql/:
    preset: client
    presetConfig:
      gqlTagName: gql
    config:
      scalars:
        DateTime: string
        UUID: string
```

Опция `schema` указывает на источник схемы — это может быть URL работающего сервера, файл `.graphql` или несколько источников сразу:

```yaml
schema:
  - 'src/schema/**/*.graphql'
  - 'http://localhost:4000/graphql':
      headers:
        Authorization: 'Bearer ${TOKEN}'
```

Добавьте команду в `package.json`:

```json
{
  "scripts": {
    "codegen": "graphql-codegen",
    "codegen:watch": "graphql-codegen --watch"
  }
}
```

## Структура сгенерированных файлов

После запуска `npm run codegen` инструмент создаёт типизированные хелперы. При использовании `client-preset` структура выглядит так:

```
src/
  gql/
    graphql.ts       # все сгенерированные типы
    gql.ts           # функция gql с поддержкой TypeScript
    index.ts         # реэкспорты
```

Пример сгенерированного содержимого `graphql.ts`:

```typescript
// Этот файл генерируется автоматически — не редактируйте вручную

export type Maybe<T> = T | null;

export enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
  Guest = 'GUEST'
}

export type User = {
  __typename?: 'User';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  email: Scalars['String']['output'];
  role: UserRole;
  createdAt: Scalars['DateTime']['output'];
};

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetUserQuery = {
  __typename?: 'Query';
  user?: {
    __typename?: 'User';
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
};
```

Обратите внимание: тип `GetUserQuery` содержит только те поля, которые запрашиваются в конкретной операции, а не все поля типа `User`. Это ключевое отличие от ручной типизации.

## Написание типизированных операций

Опишите GraphQL-операции в отдельных `.graphql` файлах:

```graphql
# src/features/users/queries.graphql

query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    role
  }
}

query GetUsers($filter: UserFilter) {
  users(filter: $filter) {
    items {
      id
      name
      role
    }
    total
    hasNextPage
  }
}

mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    email
  }
}
```

После `npm run codegen` все эти операции получат точные TypeScript-типы.

## Интеграция с Apollo Client

```typescript
import { useQuery, useMutation } from '@apollo/client';
import { graphql } from '../../gql';

// graphql() — типизированная замена gql из Apollo
const GET_USER = graphql(`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      role
    }
  }
`);

const UPDATE_USER = graphql(`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
    }
  }
`);

function UserProfile({ userId }: { userId: string }) {
  // data автоматически имеет тип GetUserQuery
  const { data, loading, error } = useQuery(GET_USER, {
    variables: { id: userId }, // id: number вызовет ошибку TypeScript
  });

  const [updateUser] = useMutation(UPDATE_USER);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;

  const user = data?.user;
  if (!user) return <div>Пользователь не найден</div>;

  const handleUpdate = async () => {
    await updateUser({
      variables: {
        id: user.id,
        input: {
          name: 'Новое имя',
          // TypeScript проверит структуру UpdateUserInput
        },
      },
    });
  };

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      {/* user.role — тип UserRole, не string */}
      <span>{user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}</span>
      <button onClick={handleUpdate}>Обновить</button>
    </div>
  );
}
```

## Фрагменты и типизация переиспользуемых частей

Фрагменты — мощный инструмент GraphQL, и `graphql-codegen` генерирует для них отдельные типы:

```graphql
# src/features/users/fragments.graphql

fragment UserBase on User {
  id
  name
  email
}

fragment UserWithRole on User {
  ...UserBase
  role
  createdAt
}
```

```graphql
# Использование фрагмента в запросе
query GetAllUsers {
  users {
    items {
      ...UserWithRole
    }
    total
  }
}
```

Сгенерированные типы фрагментов можно использовать в компонентах напрямую:

```typescript
import { FragmentType, useFragment, graphql } from '../../gql';

const USER_BASE_FRAGMENT = graphql(`
  fragment UserBase on User {
    id
    name
    email
  }
`);

interface UserCardProps {
  // FragmentType обеспечивает type-safe передачу фрагментов
  user: FragmentType<typeof USER_BASE_FRAGMENT>;
}

function UserCard({ user }: UserCardProps) {
  // useFragment «разворачивает» тип фрагмента
  const userData = useFragment(USER_BASE_FRAGMENT, user);

  return (
    <div>
      <strong>{userData.name}</strong>
      <span>{userData.email}</span>
    </div>
  );
}
```

Такой паттерн называют «colocated fragments» — каждый компонент сам описывает, какие данные ему нужны.

## Кастомные скаляры

GraphQL позволяет определять собственные скалярные типы. По умолчанию `graphql-codegen` типизирует их как `any`. Переопределите это в конфигурации:

```yaml
# codegen.yml
generates:
  src/gql/:
    preset: client
    config:
      scalars:
        DateTime: string
        Date: string
        UUID: string
        JSON: Record<string, unknown>
        BigInt: number
        Upload: File
```

Или используйте более строгие типы через пакет `graphql-scalars`:

```bash
npm install graphql-scalars
```

```yaml
config:
  scalars:
    DateTime: 'Date'
    UUID: 'string & { __brand: "UUID" }'
```

## Настройка для монорепозитория

В проектах с несколькими сервисами конфигурация может описывать несколько источников:

```yaml
# codegen.yml
generates:
  # Типы для основного API
  src/gql/main/:
    schema: 'http://localhost:4000/graphql'
    documents: 'src/features/**/*.graphql'
    preset: client

  # Типы для микросервиса уведомлений
  src/gql/notifications/:
    schema: 'http://localhost:4001/graphql'
    documents: 'src/notifications/**/*.graphql'
    preset: client
```

## Режим наблюдения в разработке

В процессе разработки удобно запускать кодогенерацию в режиме отслеживания изменений:

```bash
npm run codegen:watch
```

При каждом изменении `.graphql` файла или схемы типы пересоздаются автоматически. Это позволяет видеть ошибки типизации сразу после правки запроса.

Чтобы подключить кодогенерацию к общему dev-серверу, настройте `concurrently`:

```json
{
  "scripts": {
    "dev": "concurrently \"next dev\" \"graphql-codegen --watch\""
  }
}
```

## Валидация операций

`graphql-codegen` можно использовать не только для генерации типов, но и для валидации всех клиентских запросов относительно схемы:

```bash
npm install -D @graphql-codegen/schema-ast @graphql-inspector/cli
```

```json
{
  "scripts": {
    "validate:graphql": "graphql-inspector validate src/**/*.graphql http://localhost:4000/graphql"
  }
}
```

Это позволяет поймать использование несуществующих полей или неправильных аргументов ещё на этапе CI, до деплоя.

## Типизация без файлов .graphql

Если запросы определяются прямо в TypeScript-коде через теговые шаблонные строки, конфигурацию нужно скорректировать:

```typescript
// Запросы прямо в .tsx файлах
const GET_POSTS = graphql(`
  query GetPosts($authorId: ID!) {
    posts(authorId: $authorId) {
      id
      title
      publishedAt
    }
  }
`);
```

```yaml
# codegen.yml
documents:
  - 'src/**/*.tsx'
  - 'src/**/*.ts'
  - '!src/gql/**'  # исключаем уже сгенерированные файлы
```

`graphql-codegen` умеет извлекать операции прямо из TypeScript-файлов — достаточно указать правильный `gqlTagName` в конфигурации.

## Практические рекомендации

Несколько правил, которые упрощают работу с типизированным GraphQL:

**Никогда не редактируйте сгенерированные файлы.** Добавьте директорию `src/gql/` в `.gitignore` или коммитьте только результат — но никогда не правьте файлы вручную. Они перезаписываются при следующей генерации.

**Используйте строгий режим TypeScript.** В `tsconfig.json` включите `"strict": true` — это активирует проверки на `null` и `undefined`, которые критически важны для GraphQL, где многие поля могут быть nullable.

**Разделяйте фрагменты по компонентам.** Каждый компонент описывает свой фрагмент — это упрощает понимание зависимостей и уменьшает объём передаваемых данных.

**Включайте кодогенерацию в CI.** Добавьте `npm run codegen` перед шагом проверки типов — это гарантирует, что типы всегда актуальны относительно схемы.

```yaml
# .github/workflows/ci.yml
- name: Generate GraphQL types
  run: npm run codegen
- name: Type check
  run: npx tsc --noEmit
```

## Итог

Типизация GraphQL с помощью `graphql-codegen` переводит взаимодействие с API из режима «надейся, что данные придут правильные» в режим полной проверки на этапе компиляции. Схема сервера становится источником истины для клиентских типов, а любое изменение API немедленно отражается в TypeScript-ошибках.

Основной стек для старта:
- `@graphql-codegen/cli` + `@graphql-codegen/client-preset` — генерация типов
- `graphql` — основная библиотека
- Apollo Client или urql — клиент с поддержкой типизированных операций
- Режим `--watch` в разработке для мгновенной обратной связи

Освоить TypeScript глубоко и применять его в реальных проектах, включая работу с GraphQL, можно на курсе [TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-graphql-typing-codegen).