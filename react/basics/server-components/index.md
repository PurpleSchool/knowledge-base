---
metaTitle: "Серверные компоненты React (Server Components) — полное руководство"
metaDescription: "React Server Components: что это такое, как работают, отличие от Client Components, использование в Next.js App Router, паттерны и лучшие практики."
author: Олег Марков
title: Серверные компоненты React (RSC) — подробный разбор и практика
preview: Глубокое погружение в React Server Components. Разбираем, как рендерить компоненты на сервере, уменьшать размер бандла, работать с базой данных напрямую и правильно сочетать серверные и клиентские части приложения.
---

# Серверные компоненты (React Server Components)

**React Server Components (RSC)** — компоненты, которые рендерятся **исключительно на сервере** и не включаются в JavaScript-бандл клиента. Они позволяют напрямую обращаться к базам данных, файловой системе и внутренним сервисам без передачи этого кода в браузер.

```tsx
// app/users/page.tsx — Server Component по умолчанию в Next.js App Router
async function UsersPage() {
  // Прямой запрос к БД — этот код никогда не попадёт в браузер
  const users = await db.query('SELECT * FROM users');

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

export default UsersPage;
```

## Server Components vs Client Components

| Характеристика | Server Component | Client Component |
|----------------|-----------------|-----------------|
| Где рендерится | Сервер | Браузер (+ SSR на сервере) |
| Интерактивность | ❌ Нет | ✅ Да |
| Хуки React | ❌ Нельзя | ✅ Можно |
| Обработчики событий | ❌ Нельзя | ✅ Можно |
| Доступ к DOM | ❌ Нет | ✅ Есть |
| Доступ к БД/FS | ✅ Прямой | ❌ Только через API |
| Секретные ключи | ✅ Безопасно | ❌ Опасно |
| Попадает в JS-бандл | ❌ Нет | ✅ Да |
| `async/await` | ✅ Нативно | ❌ Нет (только useEffect) |

## Директива "use client"

В Next.js App Router все компоненты по умолчанию являются серверными. Для создания клиентского компонента добавьте директиву `"use client"` в начало файла:

```tsx
// components/Counter.tsx — Client Component
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Нажато: {count}
    </button>
  );
}
```

```tsx
// app/page.tsx — Server Component (без директивы)
import { Counter } from '@/components/Counter';
import { db } from '@/lib/db';

async function HomePage() {
  const stats = await db.getStats(); // Server-only код

  return (
    <main>
      <h1>Статистика: {stats.total}</h1>
      <Counter /> {/* Client Component внутри Server Component */}
    </main>
  );
}
```

## Получение данных в Server Components

Server Components позволяют использовать `async/await` напрямую:

```tsx
// app/posts/[id]/page.tsx
interface Props {
  params: { id: string };
}

async function PostPage({ params }: Props) {
  // Прямой fetch без useEffect — работает из коробки
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    // Next.js расширяет fetch: кэширование, ревалидация
    next: { revalidate: 3600 } // Кэш на 1 час
  }).then(res => res.json());

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

```tsx
// Прямое обращение к базе данных
import { prisma } from '@/lib/prisma';

async function UserProfile({ userId }: { userId: string }) {
  // Prisma запрос выполняется на сервере — клиент не видит этого кода
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { posts: true },
  });

  if (!user) return <p>Пользователь не найден</p>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>Постов: {user.posts.length}</p>
    </div>
  );
}
```

## Передача данных от Server к Client Component

Server Components могут передавать данные в Client Components только через **сериализуемые пропсы** (данные, не функции):

```tsx
// app/dashboard/page.tsx — Server Component
import { StatsChart } from '@/components/StatsChart'; // Client Component

async function DashboardPage() {
  const data = await fetchAnalytics();

  return (
    <div>
      {/* ✅ Передаём сериализуемые данные */}
      <StatsChart data={data.series} labels={data.labels} />

      {/* ❌ Нельзя передавать функции серверного кода */}
      {/* <StatsChart onFetch={fetchAnalytics} /> */}
    </div>
  );
}
```

## Паттерн: Server Component оборачивает Client Component

```tsx
// components/UserCard.tsx — Client Component
'use client';

import { useState } from 'react';

interface UserCardProps {
  name: string;
  email: string;
  avatar: string;
}

export function UserCard({ name, email, avatar }: UserCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      {expanded && <p>{email}</p>}
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Скрыть' : 'Показать email'}
      </button>
    </div>
  );
}
```

```tsx
// app/users/page.tsx — Server Component
import { prisma } from '@/lib/prisma';
import { UserCard } from '@/components/UserCard';

async function UsersPage() {
  // Запрос к БД на сервере — не попадает в бандл
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, avatar: true }
  });

  return (
    <div className="users-grid">
      {users.map(user => (
        // Передаём только сериализуемые данные
        <UserCard
          key={user.id}
          name={user.name}
          email={user.email}
          avatar={user.avatar}
        />
      ))}
    </div>
  );
}
```

## Паттерн: children как Server Component

Передача `children` позволяет вкладывать серверные компоненты в клиентские:

```tsx
// components/Modal.tsx — Client Component
'use client';

import { useState } from 'react';

interface ModalProps {
  children: React.ReactNode; // Может быть Server Component!
  title: string;
}

export function Modal({ children, title }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Открыть</button>
      {isOpen && (
        <div className="modal">
          <h2>{title}</h2>
          {children} {/* Server Component контент */}
          <button onClick={() => setIsOpen(false)}>Закрыть</button>
        </div>
      )}
    </>
  );
}
```

```tsx
// app/page.tsx — Server Component
import { Modal } from '@/components/Modal';
import { prisma } from '@/lib/prisma';

async function Page() {
  const details = await prisma.product.findFirst();

  return (
    <Modal title="Детали продукта">
      {/* Server Component как children в Client Component */}
      <div>
        <p>{details?.description}</p>
        <p>Цена: {details?.price}</p>
      </div>
    </Modal>
  );
}
```

## Ограничения Server Components

```tsx
// ❌ Нельзя использовать хуки в Server Component
async function ServerComponent() {
  const [state, setState] = useState(0); // Ошибка!
  useEffect(() => {}, []);               // Ошибка!

  return <div />;
}

// ❌ Нельзя использовать обработчики событий
async function ServerComponent() {
  return <button onClick={() => console.log('click')}>Button</button>; // Ошибка!
}

// ❌ Нельзя использовать браузерные API
async function ServerComponent() {
  const width = window.innerWidth; // Ошибка! window не существует на сервере
  return <div>{width}</div>;
}
```

## Server Actions

Server Actions позволяют вызывать серверный код из клиентских компонентов через форму или кнопку:

```tsx
// app/actions.ts
'use server';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  await prisma.user.create({ data: { name, email } });
  revalidatePath('/users');
}
```

```tsx
// app/create-user/page.tsx — Server Component с формой
import { createUser } from '@/app/actions';

export default function CreateUserPage() {
  return (
    <form action={createUser}>
      <input name="name" placeholder="Имя" />
      <input name="email" placeholder="Email" />
      <button type="submit">Создать</button>
    </form>
  );
}
```

## Стриминг с Suspense

Server Components поддерживают стриминг — частичный рендер страницы по мере готовности данных:

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { SlowComponent } from './SlowComponent';
import { FastComponent } from './FastComponent';

export default function Dashboard() {
  return (
    <div>
      {/* Быстрый контент показывается сразу */}
      <FastComponent />

      {/* Медленный контент стримится когда готов */}
      <Suspense fallback={<div>Загрузка статистики...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}
```

## Краткое резюме

| Концепция | Суть |
|-----------|------|
| Server Component | Рендерится только на сервере, не попадает в JS-бандл |
| `"use client"` | Превращает файл в Client Component |
| `async/await` | Нативно поддерживается в Server Components |
| Пропсы | Только сериализуемые данные от Server к Client |
| `children` | Способ вложить Server Component в Client Component |
| Server Actions | Вызов серверного кода из клиентских форм |

## Дополнительные материалы

- [React Docs — Server Components](https://react.dev/reference/rsc/server-components)
- [Next.js — Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js — Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
