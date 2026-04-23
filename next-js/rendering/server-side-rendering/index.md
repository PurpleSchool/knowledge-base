---
metaTitle: Server-Side Rendering (SSR) в Next.js — getServerSideProps
metaDescription: Разбираем Server-Side Rendering в Next.js — как работает getServerSideProps, когда применять SSR, примеры кода с TypeScript и типичные ошибки.
author: Антон Ларичев
title: Server-Side Rendering (SSR) в Next.js — как работает и когда использовать
preview: Подробный разбор SSR в Next.js — серверный рендеринг при каждом запросе, функция getServerSideProps, работа с контекстом запроса, кеширование и ограничения.
---

## Введение

Server-Side Rendering (SSR) — стратегия рендеринга, при которой HTML-страница генерируется на сервере при каждом входящем запросе пользователя. В отличие от Client-Side Rendering (CSR), где браузер строит страницу из JavaScript, при SSR пользователь сразу получает готовый HTML с данными.

В Next.js SSR реализован через функцию `getServerSideProps` в Pages Router. В App Router серверный рендеринг встроен в каждый Server Component, а для принудительного отказа от кеширования используется опция `cache: 'no-store'`.

В этой статье разберём классический SSR через `getServerSideProps`, как он работает под капотом, когда его использовать и чего следует избегать.

## Как работает SSR в Next.js

Когда пользователь открывает страницу с SSR, происходит следующая цепочка событий:

1. Браузер отправляет HTTP-запрос на сервер Next.js.
2. Next.js вызывает `getServerSideProps` — функцию, выполняющуюся исключительно на сервере.
3. Внутри `getServerSideProps` происходит получение данных (из БД, API, файловой системы).
4. Данные передаются в React-компонент через `props`.
5. React рендерит компонент в HTML-строку прямо на сервере.
6. Готовый HTML отправляется в браузер.
7. Браузер показывает страницу, затем загружает JavaScript для гидрации (hydration).

Ключевой момент: шаги 2–6 происходят при **каждом** запросе. Это отличает SSR от SSG, где HTML генерируется один раз при сборке.

## Функция getServerSideProps

`getServerSideProps` — это асинхронная функция, которую нужно экспортировать из файла страницы в Pages Router. Next.js автоматически вызывает её перед рендерингом страницы.

### Базовый пример

```typescript
// pages/posts.tsx
import type { GetServerSideProps, NextPage } from 'next';

interface Post {
  id: number;
  title: string;
  body: string;
}

interface Props {
  posts: Post[];
}

// Компонент страницы получает данные через props
const PostsPage: NextPage<Props> = ({ posts }) => {
  return (
    <div>
      <h1>Все статьи</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Выполняется на сервере при каждом запросе
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  const posts: Post[] = await response.json();

  return {
    props: {
      posts: posts.slice(0, 10), // Берём только первые 10
    },
  };
};

export default PostsPage;
```

### Работа с контекстом запроса

`getServerSideProps` получает объект `context`, содержащий информацию о текущем запросе: параметры URL, query-строку, заголовки и куки.

```typescript
// pages/profile.tsx
import type { GetServerSideProps, NextPage } from 'next';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Props {
  user: User | null;
}

const ProfilePage: NextPage<Props> = ({ user }) => {
  if (!user) {
    return <div>Пользователь не найден</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  // Получаем токен авторизации из кук
  const token = context.req.cookies['auth-token'];

  if (!token) {
    // Редирект на страницу входа если не авторизован
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const response = await fetch('https://api.example.com/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Не удалось получить данные пользователя');
    }

    const user: User = await response.json();

    return {
      props: { user },
    };
  } catch {
    return {
      props: { user: null },
    };
  }
};

export default ProfilePage;
```

Если хотите детальнее изучить Next.js с нуля — приходите на наш большой курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=server-side-rendering). На курсе 120 уроков и 30 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Динамические маршруты и SSR

Часто SSR нужен для страниц с динамическими параметрами — например, `/posts/[id]`:

```typescript
// pages/posts/[id].tsx
import type { GetServerSideProps, NextPage } from 'next';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface Props {
  post: Post;
}

const PostPage: NextPage<Props> = ({ post }) => {
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  // Получаем id из параметров маршрута
  const { id } = context.params as { id: string };

  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);

  // Если пост не найден — показываем 404
  if (!response.ok) {
    return {
      notFound: true,
    };
  }

  const post: Post = await response.json();

  return {
    props: { post },
  };
};

export default PostPage;
```

## Возможные возвращаемые значения

`getServerSideProps` может вернуть три типа объектов:

| Тип | Описание | Пример |
|-----|----------|--------|
| `{ props }` | Данные для компонента | `{ props: { user } }` |
| `{ redirect }` | Перенаправление | `{ redirect: { destination: '/login', permanent: false } }` |
| `{ notFound: true }` | Страница 404 | `{ notFound: true }` |

## Когда использовать SSR

SSR — правильный выбор в следующих ситуациях:

* **Персонализированный контент** — страница зависит от авторизации, региона, настроек пользователя.
* **Данные меняются часто** — новостная лента, курсы валют, биржевые котировки.
* **Работа с куками и сессиями** — нужен доступ к `req.cookies` или сессионным данным.
* **SEO важен, но данные динамические** — страница продукта, которая должна индексироваться с актуальными ценами.
* **A/B-тестирование** — разные версии страницы для разных сегментов пользователей.

## SSR в App Router

В App Router SSR работает иначе — все Server Components рендерятся на сервере по умолчанию. Для получения свежих данных при каждом запросе (отключение кеша) используется `cache: 'no-store'`:

```typescript
// app/dashboard/page.tsx
// Этот компонент — Server Component по умолчанию

interface Stats {
  visitors: number;
  sales: number;
}

async function DashboardPage() {
  // cache: 'no-store' отключает кеш — данные свежие при каждом запросе
  const response = await fetch('https://api.example.com/stats', {
    cache: 'no-store',
  });

  const stats: Stats = await response.json();

  return (
    <div>
      <h1>Дашборд</h1>
      <p>Посетители: {stats.visitors}</p>
      <p>Продажи: {stats.sales}</p>
    </div>
  );
}

export default DashboardPage;
```

Можно также использовать `export const dynamic = 'force-dynamic'` на уровне файла страницы:

```typescript
// app/feed/page.tsx
// Принудительный динамический рендеринг без кеша
export const dynamic = 'force-dynamic';

async function FeedPage() {
  const posts = await getPosts(); // Ваша серверная функция
  return <PostList posts={posts} />;
}
```

## Частые ошибки

* **Слишком медленный источник данных.** `getServerSideProps` блокирует отправку HTML до завершения запроса к API. Если API тормозит — пользователь видит пустой экран. Решение: использовать SSG с ISR или показывать skeleton-загрузку через Suspense в App Router.

* **Использование браузерных API в getServerSideProps.** `window`, `document`, `localStorage` недоступны на сервере. Код в `getServerSideProps` выполняется только в Node.js.

* **Запись чувствительных данных в props.** Всё, что возвращается в `props`, становится частью HTML-ответа и видно в исходном коде страницы. Не передавайте пароли, токены, секретные ключи.

* **Отсутствие обработки ошибок.** Если `fetch` внутри `getServerSideProps` падает с ошибкой, страница вернёт 500. Всегда оборачивайте запросы в `try/catch`.

## Часто задаваемые вопросы

**Можно ли вызывать функции из базы данных напрямую в getServerSideProps?**

Да, `getServerSideProps` выполняется на сервере в среде Node.js, поэтому можно использовать ORM (Prisma, Drizzle) и напрямую обращаться к базе данных без промежуточного API.

**Кешируется ли ответ при SSR?**

По умолчанию — нет. Каждый запрос генерирует новый HTML. Можно добавить HTTP-заголовок `Cache-Control` через `res.setHeader`, но это редкий сценарий. Если нужен кеш — рассмотрите ISR.

**Что лучше: SSR или ISR?**

Зависит от задачи. ISR (Incremental Static Regeneration) быстрее и снижает нагрузку на сервер — страница генерируется один раз и переиспользуется. SSR гарантирует свежесть данных, но медленнее и нагружает сервер при каждом запросе.

## Заключение

SSR в Next.js — мощный инструмент для страниц с персонализированным или часто меняющимся контентом. `getServerSideProps` даёт прямой доступ к запросу, кукам и возможность делать серверные запросы к данным перед рендерингом.

Однако SSR — не серебряная пуля. Для большинства статичного или редко меняющегося контента лучше подойдёт SSG или ISR. Выбор стратегии рендеринга — один из ключевых архитектурных решений в Next.js-проекте.

Для углублённого изучения всех стратегий рендеринга и полного цикла разработки на Next.js рекомендуем курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=server-side-rendering). В первых модулях курса доступно бесплатное содержание — можно познакомиться с форматом обучения до покупки полного доступа.
