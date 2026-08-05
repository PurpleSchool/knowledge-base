---
metaTitle: "TypeScript с tRPC — типобезопасный API без кодогенерации"
metaDescription: "Как создать типобезопасный API с tRPC и TypeScript: роутеры, процедуры, Zod-валидация, контекст, middleware и React-клиент с примерами."
author: "Антон Ларичев"
title: "TypeScript с tRPC — типобезопасный API"
preview: "Как построить полностью типобезопасный API с tRPC и TypeScript без схем и кодогенерации — от роутера до React-компонента."
---

## Что такое tRPC

tRPC (TypeScript Remote Procedure Call) — это библиотека для построения API, в которой типы автоматически передаются с сервера на клиент через механизмы самого TypeScript. В отличие от REST или GraphQL, здесь не нужны схемы OpenAPI, SDL-файлы или этап кодогенерации: достаточно написать серверную функцию, и клиент немедленно получает полный тип её ответа.

Главное преимущество подхода — ошибки рассинхронизации API и клиента становятся ошибками компиляции. Если вы переименуете поле на сервере, TypeScript сразу покажет все места на клиенте, которые нужно обновить.

## Когда выбирать tRPC

tRPC отлично подходит для монорепозиториев и fullstack-приложений на TypeScript, где сервер и клиент находятся в одном репозитории. Типичные стеки: Next.js, Remix, SvelteKit с TypeScript. Если же API публичный и должен поддерживать клиенты на других языках — лучше рассмотреть REST с OpenAPI или GraphQL.

## Установка

Для проекта на Next.js с React-клиентом установите следующие пакеты:

```bash
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod
```

- `@trpc/server` — серверная часть, роутеры и процедуры
- `@trpc/client` — базовый HTTP-клиент
- `@trpc/react-query` — React-хуки поверх TanStack Query
- `@tanstack/react-query` — менеджер состояния запросов
- `zod` — библиотека валидации, которую tRPC использует для проверки входных данных

## Инициализация tRPC

Вся конфигурация tRPC сосредоточена в одном файле инициализации. Функция `initTRPC.create()` возвращает объект с методами для создания роутеров и процедур:

```typescript
// src/server/trpc.ts
import { initTRPC } from '@trpc/server';

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;
```

Экспортированные `router` и `publicProcedure` — строительные блоки всего API. Позже сюда добавятся защищённые процедуры и middleware.

## Создание роутера и процедур

Процедура в tRPC — это аналог эндпоинта в REST. Существует два основных типа:

- `query` — для чтения данных (аналог GET)
- `mutation` — для создания, обновления и удаления (аналог POST/PUT/DELETE)

Создадим роутер для работы с пользователями:

```typescript
// src/server/routers/user.ts
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // input.id — полностью типизирован как string
      const user = await db.user.findUnique({ where: { id: input.id } });
      return user;
    }),

  list: publicProcedure
    .query(async () => {
      return await db.user.findMany();
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
        email: z.string().email('Некорректный email'),
      })
    )
    .mutation(async ({ input }) => {
      return await db.user.create({ data: input });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.user.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
```

Метод `.input()` принимает Zod-схему. tRPC автоматически валидирует входящие данные и выбрасывает ошибку с кодом `BAD_REQUEST`, если данные не проходят проверку.

## Корневой роутер и экспорт типа

Все роутеры приложения объединяются в один корневой. Именно тип этого роутера передаётся клиенту:

```typescript
// src/server/routers/_app.ts
import { router } from '../trpc';
import { userRouter } from './user';
import { postRouter } from './post';

export const appRouter = router({
  user: userRouter,
  post: postRouter,
});

// Этот тип экспортируется только как тип — никакого серверного кода на клиент
export type AppRouter = typeof appRouter;
```

Критически важно: `AppRouter` — это только TypeScript-тип. На клиент не попадает никакого серверного кода, только информация о структуре API для системы типов.

## Контекст

Контекст — это объект, который создаётся при каждом запросе и передаётся во все процедуры. В нём обычно хранятся сессия пользователя, экземпляр базы данных и другие зависимости:

```typescript
// src/server/context.ts
import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

export async function createContext({ req, res }: CreateNextContextOptions) {
  const session = await getServerSession(req, res, authOptions);

  return {
    req,
    res,
    session,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

Подключите контекст к инициализации tRPC:

```typescript
// src/server/trpc.ts
import { initTRPC } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
```

## Middleware и защищённые процедуры

Middleware позволяет выполнять логику до вызова процедуры. Самый распространённый случай — проверка аутентификации:

```typescript
// src/server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Требуется авторизация',
    });
  }

  // TypeScript сужает тип ctx.session.user до non-null
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
```

Теперь в защищённых процедурах `ctx.user` будет иметь корректный тип без `null`:

```typescript
// src/server/routers/profile.ts
import { router, protectedProcedure } from '../trpc';

export const profileRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    // ctx.user гарантированно не null — TypeScript это знает
    return ctx.user;
  }),
});
```

## Интеграция с Next.js

Для обработки запросов создайте API-роут:

```typescript
// src/pages/api/trpc/[trpc].ts
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../../server/routers/_app';
import { createContext } from '../../../server/context';

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError:
    process.env.NODE_ENV === 'development'
      ? ({ path, error }) => {
          console.error(`tRPC error on ${path}:`, error);
        }
      : undefined,
});
```

## Настройка клиента

Создайте хуки tRPC для React с передачей типа `AppRouter`:

```typescript
// src/utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
```

Оберните приложение провайдерами:

```typescript
// src/pages/_app.tsx
import { useState } from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../utils/trpc';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

`httpBatchLink` автоматически объединяет несколько параллельных запросов в один HTTP-запрос, что снижает количество round-trip'ов.

## Использование в React-компонентах

тRPC-хуки работают как хуки TanStack Query, но с полной типизацией:

```typescript
// src/components/UserList.tsx
import { trpc } from '../utils/trpc';

export function UserList() {
  const { data: users, isLoading, error } = trpc.user.list.useQuery();

  if (isLoading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {error.message}</p>;

  return (
    <ul>
      {users.map((user) => (
        // user полностью типизирован — IDE подскажет все поля
        <li key={user.id}>{user.name} — {user.email}</li>
      ))}
    </ul>
  );
}
```

Для мутаций используйте `useMutation`:

```typescript
// src/components/CreateUserForm.tsx
import { trpc } from '../utils/trpc';

export function CreateUserForm() {
  const utils = trpc.useUtils();
  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      // Инвалидируем кеш списка пользователей после создания
      utils.user.list.invalidate();
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    await createUser.mutateAsync({
      name: data.get('name') as string,
      email: data.get('email') as string,
    });

    form.reset();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Имя" required />
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? 'Создание...' : 'Создать'}
      </button>
      {createUser.error && (
        <p style={{ color: 'red' }}>{createUser.error.message}</p>
      )}
    </form>
  );
}
```

## Обработка ошибок

tRPC предоставляет стандартные коды ошибок, аналогичные HTTP-статусам:

```typescript
import { TRPCError } from '@trpc/server';

getById: publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const user = await db.user.findUnique({ where: { id: input.id } });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Пользователь с id ${input.id} не найден`,
      });
    }

    return user;
  }),
```

Доступные коды: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR` и другие. На клиенте ошибка доступна через `error.message` и `error.data?.code`.

## Серверный рендеринг и prefetch

Для SSR в Next.js используйте вспомогательный метод `createServerSideHelpers`:

```typescript
// src/pages/users/[id].tsx
import { createServerSideHelpers } from '@trpc/react-query/server';
import type { GetServerSideProps } from 'next';
import superjson from 'superjson';
import { appRouter } from '../../server/routers/_app';
import { createContext } from '../../server/context';
import { trpc } from '../../utils/trpc';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: await createContext(ctx as any),
    transformer: superjson,
  });

  const id = ctx.params?.id as string;
  await helpers.user.getById.prefetch({ id });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      id,
    },
  };
};

export default function UserPage({ id }: { id: string }) {
  // Данные уже в кеше — запрос не делается повторно
  const { data } = trpc.user.getById.useQuery({ id });

  return <div>{data?.name}</div>;
}
```

## Практические советы

**Организация роутеров.** Разделяйте роутеры по доменным сущностям: `userRouter`, `postRouter`, `orderRouter`. Каждый файл отвечает только за свою область.

**Повторное использование Zod-схем.** Выносите схемы валидации в отдельные файлы, чтобы использовать их и на сервере, и на клиенте для валидации форм:

```typescript
// src/shared/schemas/user.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

**Избегайте избыточных round-trip'ов.** Используйте `useQueries` или объединяйте связанные данные в одну процедуру, если они всегда нужны вместе.

**Transformer для дат.** Стандартный JSON не поддерживает объекты `Date`. Установите `superjson` как трансформер, чтобы даты правильно сериализовались:

```typescript
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});
```

То же самое добавьте в клиентский `httpBatchLink` и `createServerSideHelpers`.

## Итог

tRPC устраняет целый класс ошибок — рассинхронизацию между контрактом API и его клиентами. Вместо поддержки схем, кодогенерации и ручной типизации ответов вы получаете единственный источник правды: серверный код. TypeScript транслирует изменения немедленно, а IDE предоставляет автодополнение для каждого эндпоинта и поля ответа.

Подход работает наилучшим образом в fullstack TypeScript-проектах, где сервер и клиент находятся под одним контролем. Если вы строите именно такое приложение — tRPC значительно ускоряет разработку и снижает количество ошибок интеграции.

Чтобы глубже разобраться с TypeScript и системой типов, которая делает tRPC возможным, изучите курс на PurpleSchool: https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=trpc-typescript