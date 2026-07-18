---
metaTitle: "notFound и redirect в серверных компонентах Next.js"
metaDescription: "Как использовать функции notFound() и redirect() в серверных компонентах Next.js App Router: примеры, нюансы, кастомные страницы ошибок."
author: "Антон Ларичев"
title: "notFound и redirect в серверных компонентах Next.js"
preview: "Разбираем функции notFound() и redirect() в App Router: когда вызывать, как создать кастомную 404-страницу и делать редиректы из серверных компонентов."
---

## Зачем нужны notFound и redirect в серверных компонентах

При работе с App Router в Next.js серверные компоненты выполняются на сервере до отправки HTML клиенту. Это открывает возможность делать важные вещи ещё на этапе рендера: если запрошенный ресурс не существует — прервать рендер и вернуть 404, а если нужно перенаправить пользователя — сделать это без клиентского JavaScript.

Для этого Next.js предоставляет два специальных хелпера из пакета `next/navigation`:

- `notFound()` — прерывает рендер и возвращает HTTP 404
- `redirect()` — прерывает рендер и возвращает HTTP 307 или 308

Оба работают через механизм исключений: под капотом они бросают специальный объект, который Next.js перехватывает и обрабатывает нужным образом. Именно поэтому после их вызова никакой код в компоненте не выполняется.

## Функция notFound()

### Как работает notFound()

Функция `notFound()` прерывает рендер текущего сегмента и ищет ближайший файл `not-found.tsx` вверх по дереву сегментов. Если такого файла нет — используется встроенная страница Next.js.

```typescript
import { notFound } from 'next/navigation';

async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id);

  if (!user) {
    notFound(); // дальнейший код не выполняется
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

Важная особенность: `notFound()` не принимает никаких аргументов. Её задача — только сигнализировать об отсутствии ресурса.

### Создание кастомной страницы 404

По умолчанию Next.js покажет встроенную страницу 404. Чтобы создать собственную, нужно добавить файл `not-found.tsx` в нужную директорию.

```
app/
├── not-found.tsx          # глобальная 404 для всего приложения
├── users/
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── not-found.tsx  # 404 только для раздела /users/[id]
│   └── page.tsx
└── page.tsx
```

Пример глобального `not-found.tsx`:

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h2>Страница не найдена</h2>
      <p>Запрошенный ресурс не существует или был удалён.</p>
      <Link href="/">Вернуться на главную</Link>
    </div>
  );
}
```

Пример локального `not-found.tsx` для раздела пользователей:

```tsx
import Link from 'next/link';

export default function UserNotFound() {
  return (
    <div>
      <h2>Пользователь не найден</h2>
      <p>Пользователь с таким ID не существует.</p>
      <Link href="/users">Все пользователи</Link>
    </div>
  );
}
```

Когда вы вызываете `notFound()` внутри `/users/[id]/page.tsx`, Next.js найдёт ближайший `not-found.tsx` — в данном случае `/users/[id]/not-found.tsx`. Если его нет — поднимется к `/not-found.tsx`.

### Генерация метаданных для страницы 404

Файл `not-found.tsx` поддерживает экспорт метаданных:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Страница не найдена — PurpleSchool',
  description: 'Запрошенная страница не существует.',
};

export default function NotFound() {
  return (
    <div>
      <h2>404 — Страница не найдена</h2>
      <Link href="/">На главную</Link>
    </div>
  );
}
```

### Практический пример с базой данных

Типичный сценарий: динамический маршрут для статьи блога, которая может не существовать.

```typescript
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

interface Props {
  params: { slug: string };
}

export default async function ArticlePage({ params }: Props) {
  const article = await db.article.findUnique({
    where: { slug: params.slug },
  });

  if (!article) {
    notFound();
  }

  if (!article.published) {
    notFound(); // черновики тоже недоступны
  }

  return (
    <article>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
}
```

## Функция redirect()

### Как работает redirect()

Функция `redirect()` прерывает текущий рендер и возвращает клиенту HTTP-ответ с кодом 307 (временный редирект). Она принимает два аргумента:

```typescript
redirect(url: string, type?: RedirectType)
```

Где `type` может быть:
- `RedirectType.replace` (по умолчанию) — HTTP 307, браузер не добавляет запись в историю
- `RedirectType.push` — HTTP 307, но поведение аналогично `router.push`

```typescript
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login'); // перенаправляем неавторизованных
  }

  return (
    <div>
      <h1>Добро пожаловать, {session.user.name}</h1>
    </div>
  );
}
```

### permanentRedirect()

Для постоянных редиректов (HTTP 308) используйте `permanentRedirect()`:

```typescript
import { permanentRedirect } from 'next/navigation';

export default async function OldProfilePage({ params }: { params: { id: string } }) {
  // Страница переехала на новый URL
  permanentRedirect(`/users/${params.id}`);
}
```

HTTP 308 сообщает браузерам и поисковикам, что ресурс переехал навсегда. Используйте его для SEO-значимых редиректов: смены URL страниц, слиянии разделов сайта.

### Практические примеры

**Редирект после проверки роли:**

```typescript
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/403'); // нет прав
  }

  return <div>Панель администратора</div>;
}
```

**Редирект с сохранением URL для возврата:**

```typescript
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';

export default async function ProtectedPage() {
  const session = await getSession();

  if (!session) {
    const headersList = await headers();
    const path = headersList.get('x-pathname') ?? '/protected';
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }

  return <div>Защищённый контент</div>;
}
```

**Редирект по результату запроса к базе:**

```typescript
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

interface Props {
  params: { shortCode: string };
}

export default async function ShortLinkPage({ params }: Props) {
  const link = await db.shortLink.findUnique({
    where: { code: params.shortCode },
  });

  if (!link) {
    notFound();
  }

  // Увеличиваем счётчик переходов
  await db.shortLink.update({
    where: { id: link.id },
    data: { clicks: { increment: 1 } },
  });

  redirect(link.originalUrl);
}
```

## Использование в различных контекстах

### В layout.tsx

И `notFound()`, и `redirect()` можно вызывать в `layout.tsx`. Это удобно, когда нужно защитить целый раздел:

```typescript
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <nav>/* навигация аккаунта */</nav>
      {children}
    </div>
  );
}
```

Теперь все страницы внутри `/account/**` автоматически защищены.

### В Server Actions

Server Actions — ещё одно место, где часто используется `redirect()`:

```typescript
'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  const post = await db.post.create({
    data: { title, content },
  });

  redirect(`/posts/${post.id}`); // перенаправляем на созданную запись
}
```

```typescript
'use server';

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

export async function deletePost(id: string) {
  const post = await db.post.findUnique({ where: { id } });

  if (!post) {
    notFound();
  }

  await db.post.delete({ where: { id } });
  redirect('/posts');
}
```

Важно: `redirect()` в Server Actions всегда нужно вызывать вне блока `try/catch`. Поскольку `redirect()` работает через бросание исключения, блок `catch` его перехватит и редирект не произойдёт:

```typescript
'use server';

import { redirect } from 'next/navigation';

export async function processForm(formData: FormData) {
  try {
    await saveToDb(formData);
    // redirect() НЕЛЬЗЯ вызывать здесь — catch его поймает
  } catch (error) {
    console.error(error);
    return { error: 'Ошибка сохранения' };
  }

  redirect('/success'); // вызываем ПОСЛЕ try/catch
}
```

### В generateMetadata

Функции `notFound()` и `redirect()` работают и в `generateMetadata`:

```typescript
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await db.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    notFound(); // 404 до рендера страницы
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await db.product.findUnique({
    where: { id: params.id },
  });

  // product гарантированно существует — мы проверили в generateMetadata
  return <div>{product!.name}</div>;
}
```

## Важные нюансы и частые ошибки

### notFound() и redirect() не работают в клиентских компонентах при рендере

Эти функции предназначены для серверного контекста. В клиентских компонентах `redirect()` нужно заменить на `useRouter().push()`:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClientRedirect({ condition }: { condition: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (condition) {
      router.push('/target'); // клиентский редирект
    }
  }, [condition, router]);

  return null;
}
```

### Нельзя перехватить redirect() через try/catch в серверном компоненте

Поскольку `redirect()` бросает специальный объект `NEXT_REDIRECT`, его перехват нарушит работу редиректа. Если нужно выполнить cleanup-логику перед редиректом — делайте это до вызова функции:

```typescript
import { redirect } from 'next/navigation';

export default async function Page() {
  const data = await fetchData();

  if (!data.valid) {
    await cleanupResources(); // сначала очистка
    redirect('/error');       // потом редирект
  }

  return <div>{data.content}</div>;
}
```

### Проверка типа исключения при необходимости перехвата

Если всё же нужно использовать `try/catch` и при этом не блокировать работу `redirect()` и `notFound()`, проверяйте тип ошибки:

```typescript
import { redirect, isRedirectError } from 'next/dist/client/components/redirect';
import { isNotFoundError } from 'next/dist/client/components/not-found';

export async function serverAction() {
  try {
    await riskyOperation();
    redirect('/success');
  } catch (error) {
    if (isRedirectError(error) || isNotFoundError(error)) {
      throw error; // пробрасываем специальные ошибки Next.js
    }
    console.error('Обычная ошибка:', error);
    return { error: 'Что-то пошло не так' };
  }
}
```

### redirect() не работает в middleware для App Router страниц

Для редиректов в middleware используйте `NextResponse.redirect()`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

### Кодирование URL в redirect()

При передаче динамических данных в URL редиректа всегда кодируйте параметры:

```typescript
import { redirect } from 'next/navigation';

export async function searchAction(formData: FormData) {
  const query = formData.get('query') as string;
  redirect(`/search?q=${encodeURIComponent(query)}`);
}
```

## Итог

Функции `notFound()` и `redirect()` — фундаментальные инструменты App Router, которые позволяют управлять навигацией непосредственно на сервере:

- `notFound()` — сигнализирует об отсутствии ресурса, Next.js показывает ближайший `not-found.tsx`
- `redirect()` — временный редирект (HTTP 307), не добавляет запись в историю браузера
- `permanentRedirect()` — постоянный редирект (HTTP 308), используйте для SEO-значимых изменений URL
- Оба работают через механизм исключений — после вызова код не выполняется
- В Server Actions вызывайте `redirect()` за пределами `try/catch`
- В middleware используйте `NextResponse.redirect()` вместо `redirect()`

Глубже разобраться с App Router, серверными компонентами и другими возможностями Next.js можно на курсе [Next.js — с нуля до продакшена](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=notfound-redirect-server-components).