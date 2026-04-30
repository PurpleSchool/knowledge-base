---
metaTitle: "Server Actions в Next.js — полное руководство"
metaDescription: "Как использовать Server Actions в Next.js: мутации данных, формы, валидация, обработка ошибок и revalidation. Примеры кода."
author: "Антон Ларичев"
title: "Server Actions в Next.js"
preview: "Server Actions позволяют выполнять серверный код прямо из компонентов без API-роутов. Разбираем синтаксис, паттерны и подводные камни."
---

## Что такое Server Actions

Server Actions — это асинхронные функции, которые выполняются на сервере, но могут вызываться прямо из клиентских и серверных компонентов. Они появились в Next.js 14 как стабильная фича и кардинально меняют подход к мутациям данных.

До Server Actions типичный сценарий выглядел так: создать API-роут в `app/api/`, отправить `fetch`-запрос из компонента, обработать ответ. Server Actions убирают этот слой — вы пишете серверную функцию и вызываете её напрямую.

Под капотом Next.js компилирует Server Action в отдельный эндпоинт и генерирует `fetch`-вызов на клиенте. Разработчик этого не видит — для него это просто вызов функции.

## Объявление Server Action

Server Action объявляется с директивой `"use server"`. Её можно поставить внутри функции или в начале файла — тогда все экспортируемые функции из этого файла становятся Server Actions.

### Директива внутри функции

```typescript
// app/actions.ts
export async function createPost(title: string, content: string) {
  "use server";

  await db.post.create({
    data: { title, content },
  });
}
```

### Директива в начале файла

Это предпочтительный способ — выносить все actions в отдельный файл:

```typescript
// app/actions.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPost(title: string, content: string) {
  await db.post.create({
    data: { title, content },
  });

  revalidatePath("/posts");
}

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } });
  revalidatePath("/posts");
}
```

Файл с директивой `"use server"` в начале называется **Actions File**. Все функции в нём автоматически становятся Server Actions, даже если не помечены явно.

## Использование в серверных компонентах

В серверных компонентах Server Action можно передать прямо в атрибут `action` формы:

```typescript
// app/posts/new/page.tsx
import { createPost } from "@/app/actions";

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Заголовок" required />
      <textarea name="content" placeholder="Содержимое" required />
      <button type="submit">Создать</button>
    </form>
  );
}
```

При сабмите формы Next.js автоматически соберёт данные из полей и передаст их в функцию как `FormData`. Для доступа к данным внутри action нужно принять `FormData` как аргумент:

```typescript
"use server";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await db.post.create({
    data: { title, content },
  });

  revalidatePath("/posts");
}
```

## Использование в клиентских компонентах

Клиентские компоненты не могут определять Server Actions, но могут их импортировать и вызывать:

```typescript
// app/components/PostForm.tsx
"use client";

import { createPost } from "@/app/actions";
import { useState } from "react";

export function PostForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    await createPost(formData);

    setStatus("done");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Заголовок" />
      <textarea name="content" placeholder="Содержимое" />
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Сохранение..." : "Создать"}
      </button>
    </form>
  );
}
```

## useActionState — управление состоянием

Hook `useActionState` (ранее `useFormState`) позволяет получить состояние и результат выполнения Server Action прямо в компоненте:

```typescript
// app/actions.ts
"use server";

type ActionState = {
  error?: string;
  success?: boolean;
};

export async function createPost(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const title = formData.get("title") as string;

  if (!title || title.trim().length < 3) {
    return { error: "Заголовок должен быть не менее 3 символов" };
  }

  try {
    await db.post.create({ data: { title } });
    revalidatePath("/posts");
    return { success: true };
  } catch {
    return { error: "Не удалось создать пост" };
  }
}
```

```typescript
// app/components/PostForm.tsx
"use client";

import { useActionState } from "react";
import { createPost } from "@/app/actions";

export function PostForm() {
  const [state, action, isPending] = useActionState(createPost, {});

  return (
    <form action={action}>
      <input name="title" placeholder="Заголовок" />
      {state.error && <p style={{ color: "red" }}>{state.error}</p>}
      {state.success && <p style={{ color: "green" }}>Пост создан!</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Сохранение..." : "Создать"}
      </button>
    </form>
  );
}
```

`useActionState` принимает action и начальное состояние. Возвращает текущее состояние, обёрнутый action для формы и флаг `isPending`.

## useFormStatus — состояние формы

`useFormStatus` из `react-dom` позволяет получить состояние ближайшей формы-родителя. Удобен для кнопок Submit:

```typescript
// app/components/SubmitButton.tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Загрузка..." : label}
    </button>
  );
}
```

```typescript
// app/posts/new/page.tsx
import { createPost } from "@/app/actions";
import { SubmitButton } from "@/app/components/SubmitButton";

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Заголовок" />
      <SubmitButton label="Создать пост" />
    </form>
  );
}
```

Важно: `useFormStatus` работает только в дочернем компоненте по отношению к форме, не в самом компоненте с формой.

## Дополнительные аргументы через bind

Часто нужно передать в action данные помимо FormData — например, ID записи при редактировании. Для этого используется `.bind()`:

```typescript
// app/actions.ts
"use server";

export async function updatePost(id: string, formData: FormData) {
  const title = formData.get("title") as string;

  await db.post.update({
    where: { id },
    data: { title },
  });

  revalidatePath(`/posts/${id}`);
}
```

```typescript
// app/posts/[id]/edit/page.tsx
import { updatePost } from "@/app/actions";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await db.post.findUnique({ where: { id: params.id } });
  const updatePostWithId = updatePost.bind(null, params.id);

  return (
    <form action={updatePostWithId}>
      <input name="title" defaultValue={post?.title} />
      <button type="submit">Сохранить</button>
    </form>
  );
}
```

Аргументы, переданные через `bind`, будут идти перед `formData` в сигнатуре функции.

## Оптимистичные обновления с useOptimistic

Dля мгновенного отклика UI без ожидания сервера используйте `useOptimistic`:

```typescript
"use client";

import { useOptimistic } from "react";
import { toggleLike } from "@/app/actions";

type Post = { id: string; likes: number; liked: boolean };

export function LikeButton({ post }: { post: Post }) {
  const [optimisticPost, setOptimisticPost] = useOptimistic(post);

  async function handleLike() {
    setOptimisticPost((p) => ({
      ...p,
      liked: !p.liked,
      likes: p.liked ? p.likes - 1 : p.likes + 1,
    }));
    await toggleLike(post.id);
  }

  return (
    <button onClick={handleLike}>
      {optimisticPost.liked ? "♥" : "♡"} {optimisticPost.likes}
    </button>
  );
}
```

Пока `toggleLike` выполняется на сервере, пользователь видит обновлённое состояние немедленно. Если action завершится с ошибкой, состояние автоматически откатится.

## Revalidation и редиректы

После мутации обычно нужно обновить кэшированные данные или перенаправить пользователя:

```typescript
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const post = await db.post.create({
    data: {
      title: formData.get("title") as string,
    },
  });

  // Инвалидировать кэш конкретного пути
  revalidatePath("/posts");

  // Инвалидировать по тегу (если использовался fetch с { next: { tags: ["posts"] } })
  revalidateTag("posts");

  // Перенаправить на страницу созданного поста
  redirect(`/posts/${post.id}`);
}
```

`redirect` внутри Server Action бросает специальное исключение — не оборачивайте его в `try/catch`, иначе редирект не сработает.

## Обработка ошибок

Сервер может бросать ошибки по разным причинам. Паттерн с возвратом объекта состояния — самый безопасный:

```typescript
"use server";

type Result =
  | { success: true; id: string }
  | { success: false; error: string };

export async function createPost(formData: FormData): Promise<Result> {
  const title = formData.get("title") as string;

  if (!title) {
    return { success: false, error: "Заголовок обязателен" };
  }

  try {
    const post = await db.post.create({ data: { title } });
    revalidatePath("/posts");
    return { success: true, id: post.id };
  } catch (e) {
    console.error("Ошибка создания поста:", e);
    return { success: false, error: "Ошибка сервера. Попробуйте позже." };
  }
}
```

Для некритичных ошибок, которые должны показать Error Boundary, можно выбросить исключение — Next.js его перехватит:

```typescript
export async function deletePost(id: string) {
  "use server";

  const post = await db.post.findUnique({ where: { id } });
  if (!post) throw new Error("Пост не найден");

  await db.post.delete({ where: { id } });
  revalidatePath("/posts");
}
```

## Безопасность: авторизация

Server Actions доступны из любого места — это публичные эндпоинты. Проверка прав должна быть внутри самой функции:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function deletePost(id: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const post = await db.post.findUnique({ where: { id } });

  if (post?.authorId !== session.user.id) {
    throw new Error("Нет прав для удаления этого поста");
  }

  await db.post.delete({ where: { id } });
  revalidatePath("/posts");
}
```

Никогда не доверяйте данным, пришедшим от клиента. ID пользователя всегда берите из сессии на сервере, а не из `formData`.

## Валидация с Zod

Для структурированной валидации входных данных удобно использовать Zod:

```typescript
"use server";

import { z } from "zod";

const PostSchema = z.object({
  title: z.string().min(3, "Минимум 3 символа").max(100, "Максимум 100 символов"),
  content: z.string().min(10, "Минимум 10 символов"),
});

type PostFormState = {
  errors?: {
    title?: string[];
    content?: string[];
  };
  message?: string;
};

export async function createPost(
  prevState: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  const validated = PostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }

  await db.post.create({ data: validated.data });
  revalidatePath("/posts");

  return { message: "Пост успешно создан" };
}
```

```typescript
// app/components/PostForm.tsx
"use client";

import { useActionState } from "react";
import { createPost } from "@/app/actions";

export function PostForm() {
  const [state, action, isPending] = useActionState(createPost, {});

  return (
    <form action={action}>
      <div>
        <input name="title" placeholder="Заголовок" />
        {state.errors?.title && (
          <p style={{ color: "red" }}>{state.errors.title[0]}</p>
        )}
      </div>
      <div>
        <textarea name="content" placeholder="Содержимое" />
        {state.errors?.content && (
          <p style={{ color: "red" }}>{state.errors.content[0]}</p>
        )}
      </div>
      {state.message && <p style={{ color: "green" }}>{state.message}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Сохранение..." : "Создать"}
      </button>
    </form>
  );
}
```

## Когда не стоит использовать Server Actions

Server Actions оптимальны для мутаций — создания, обновления, удаления данных. Для чтения данных (GET-запросы) продолжайте использовать серверные компоненты с прямым обращением к БД или `fetch` с кэшированием.

Также Server Actions не подходят для длительных операций — соединение может разорваться. Для таких задач используйте очереди задач или фоновые джобы.

---

Освоить Next.js App Router и Server Actions с нуля до продвинутого уровня поможет курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=server-actions).