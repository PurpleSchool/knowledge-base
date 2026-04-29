---
metaTitle: Pick в TypeScript — выбираем нужные поля из типа
metaDescription: Разбираем Pick в TypeScript — как выбрать только нужные поля из существующего типа, синтаксис, примеры с компонентами, DTO и публичными API.
author: Антон Ларичев
title: Pick в TypeScript
preview: Подробный разбор утилитарного типа Pick в TypeScript — как создать тип с выбранными полями, когда предпочесть Pick вместо Omit и практические примеры.
tags:
  - typescript
---

## Что такое Pick

`Pick<T, K>` — встроенный утилитарный тип TypeScript, который создаёт новый тип, включающий только указанные поля из `T`. Это «белый список» свойств: берём ровно то, что нужно, всё остальное отбрасываем.

Используется для создания минимальных срезов данных — например, когда компоненту нужны только `id` и `name` из большого объекта `User`, или когда API должен вернуть только публичные поля.

## Синтаксис

```typescript
type Result = Pick<OriginalType, 'field1' | 'field2'>;
```

Пример:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

type UserPreview = Pick<User, 'id' | 'name'>;
// {
//   id: number;
//   name: string;
// }
```

Новый тип содержит только два поля — `id` и `name`. Передать остальные поля туда, где ожидается `UserPreview`, уже не получится.

## Как работает под капотом

`Pick` реализован через Mapped Types:

```typescript
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

`K extends keyof T` гарантирует, что указанные ключи действительно существуют в типе `T` — TypeScript сообщит об ошибке при опечатке в имени поля. Это принципиальное отличие от `Omit`, который не проверяет существование ключей.

## Примеры использования

### Пропсы React-компонентов

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Аватар отображает только имя и картинку
type AvatarProps = Pick<User, 'name' | 'avatarUrl'>;

function UserAvatar({ name, avatarUrl }: AvatarProps) {
  return (
    <div>
      <img src={avatarUrl} alt={name} />
      <span>{name}</span>
    </div>
  );
}

// Карточка профиля показывает больше
type ProfileCardProps = Pick<User, 'id' | 'name' | 'email' | 'bio'>;

function ProfileCard(props: ProfileCardProps) {
  return <div>{/* ... */}</div>;
}
```

Компонент явно декларирует, какие данные ему нужны. Изменение исходного `User` автоматически влияет на типы пропсов — ничего не нужно обновлять вручную.

### Минимальный DTO для поиска

```typescript
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  categoryId: number;
  tags: string[];
}

// Для списка товаров в поиске нужны только базовые поля
type ProductSearchResult = Pick<Product, 'id' | 'title' | 'price' | 'images'>;

async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const response = await fetch(`/api/products?q=${query}`);
  return response.json();
}
```

### Типизация функций с частью объекта

```typescript
interface Task {
  id: number;
  title: string;
  description: string;
  assigneeId: number;
  dueDate: Date;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

// Функция меняет только статус и приоритет
function updateTaskMeta(
  id: number,
  meta: Pick<Task, 'status' | 'priority'>
): Promise<Task> {
  return fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(meta),
  }).then((r) => r.json());
}

updateTaskMeta(5, { status: 'done', priority: 'high' }); // OK
updateTaskMeta(5, { title: 'New title' }); // Ошибка — title не входит в Pick
```

Если вы хотите детально изучить TypeScript и систему типов — приходите на курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=pick). На курсе 180 уроков, AI-тренажёры для практики 24/7 и живое ревью от наставников.

## Pick vs Omit: когда выбирать

Оба типа создают подмножество существующего типа, но с разной логикой:

```typescript
interface Article {
  id: number;
  title: string;
  content: string;
  authorId: number;
  slug: string;
  publishedAt: Date;
  views: number;
  likes: number;
}

// Нужны только id и title — Pick короче (2 поля vs исключение 6)
type ArticleLink = Pick<Article, 'id' | 'title'>;

// Нужно всё кроме content — Omit короче (1 поле vs выбор 7)
type ArticleMeta = Omit<Article, 'content'>;
```

**Правило:** если берёшь меньше половины полей — `Pick`; если убираешь меньше половины — `Omit`.

## Комбинирование с другими Utility Types

### Pick + Partial для опциональных обновлений

```typescript
interface Settings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  emailFrequency: 'daily' | 'weekly' | 'never';
}

// Обновляем только визуальные настройки, причём не все обязательно
type VisualSettingsUpdate = Partial<Pick<Settings, 'theme' | 'language'>>;
// { theme?: 'light' | 'dark'; language?: string; }
```

### Pick для строгой типизации функций-маперов

```typescript
function toPreview<T>(obj: T, keys: (keyof T)[]): Pick<T, keyof T> {
  const result = {} as Pick<T, keyof T>;
  keys.forEach((key) => {
    result[key] = obj[key];
  });
  return result;
}
```

## Частые ошибки

### Указание несуществующего ключа

В отличие от `Omit`, `Pick` проверяет ключи во время компиляции:

```typescript
interface User {
  id: number;
  name: string;
}

// Ошибка компиляции: тип '"phone"' не входит в keyof User
type WithPhone = Pick<User, 'id' | 'phone'>;
//                                    ^^^^^
// Type '"phone"' does not satisfy the constraint 'keyof User'
```

Это полезное поведение — TypeScript сразу укажет на опечатку.

## Итог

`Pick<T, K>` — инструмент для создания минимально необходимых типов из существующих. Он позволяет явно декларировать, какие поля нужны конкретной функции или компоненту, избегая случайной передачи лишних данных. При добавлении полей в исходный тип `Pick` не потребует изменений — он останется корректным.

Для углублённого изучения TypeScript рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=pick). В первых модулях доступно бесплатное содержание.
