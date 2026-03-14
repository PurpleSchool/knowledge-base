---
metaTitle: React Server Components (RSC) — что это и как работает
metaDescription: Подробное руководство по React Server Components: что такое RSC, как они работают, отличия от клиентских компонентов, директива use client, преимущества для производительности и SEO, примеры кода
author: Олег Марков
title: React Server Components — серверный рендеринг без JS на клиенте
preview: Разбираемся с React Server Components (RSC) — революционной моделью рендеринга, которая позволяет выполнять компоненты исключительно на сервере, сокращать размер JavaScript-бандла и упрощать работу с данными без дополнительных API-слоёв
---

## Введение

React Server Components (RSC) — это новая модель архитектуры компонентов, введённая командой React и впервые реализованная на практике в Next.js App Router. Суть концепции: компоненты могут рендериться **исключительно на сервере**, не отправляя свой JavaScript-код в браузер.

Это принципиальное отличие от привычного серверного рендеринга (SSR). При SSR компонент рендерится на сервере в HTML, но его JavaScript всё равно загружается на клиент для «гидратации». RSC идёт дальше: серверный компонент никогда не становится частью клиентского бандла.

В этой статье вы узнаете:
- Что такое React Server Components и почему они появились
- Как работает механизм рендеринга RSC
- Чем серверные компоненты отличаются от клиентских
- Как использовать директиву `"use client"`
- Какие преимущества даёт RSC для производительности и SEO
- Практические примеры кода с Next.js App Router

## Что такое React Server Components

React Server Components — это компоненты, которые:

1. **Выполняются только на сервере** — никогда не запускаются в браузере
2. **Не попадают в JS-бандл** — клиент не загружает их код
3. **Могут быть асинхронными** — поддерживают `async/await` на уровне компонента
4. **Имеют прямой доступ к серверным ресурсам** — базы данных, файловая система, переменные окружения

Когда пользователь запрашивает страницу, сервер запускает серверные компоненты, получает данные, формирует специальный формат (React Server Component Payload, или RSC Payload) и отправляет его клиенту. Браузер отображает результат — без необходимости загружать логику серверных компонентов.

```tsx
// app/products/page.tsx — Server Component по умолчанию в Next.js
// Этот файл НИКОГДА не попадёт в браузер

async function ProductsPage() {
  // Прямое обращение к базе данных — безопасно на сервере
  const products = await db.query('SELECT * FROM products WHERE active = true');

  return (
    <div>
      <h1>Каталог товаров</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <strong>{product.name}</strong> — {product.price} ₽
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductsPage;
```

## Как работает механизм рендеринга RSC

Чтобы понять RSC, нужно разобраться с тем, как они рендерятся и как результат доставляется клиенту.

### Шаги рендеринга

1. **Запрос:** Пользователь переходит по URL или происходит навигация внутри приложения
2. **Серверный рендеринг:** Next.js запускает серверные компоненты на сервере, выполняет запросы к данным
3. **Формирование RSC Payload:** React создаёт специальный бинарный поток данных, описывающий дерево компонентов
4. **Потоковая передача:** RSC Payload отправляется клиенту — возможна потоковая передача (streaming) для быстрого отображения
5. **Гидратация клиентских компонентов:** Клиентские компоненты (помеченные `"use client"`) гидратируются в браузере и становятся интерактивными

```
Сервер                          Клиент
┌─────────────────────┐         ┌──────────────────────┐
│ Server Components   │ ──────> │ HTML + RSC Payload   │
│ (выполняются здесь) │         │                      │
│                     │         │ Client Components    │
│ async/await         │         │ (гидратируются здесь)│
│ DB, FS, secrets     │         │ useState, onClick    │
└─────────────────────┘         └──────────────────────┘
```

### RSC Payload и потоковая передача

RSC Payload — это особый формат данных, который React использует для передачи информации о серверных компонентах. Он включает:
- Отрендеренный HTML серверных компонентов
- Ссылки на клиентские компоненты (их код загружается отдельно)
- Данные, переданные как пропсы

Важная деталь: RSC поддерживает **потоковую передачу (Streaming)**. Это значит, что браузер начинает получать и отображать контент немедленно, не дожидаясь полного завершения рендеринга на сервере.

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { UserStats } from './UserStats';
import { RecentOrders } from './RecentOrders';

// Оба компонента загружаются параллельно и стримятся на клиент
export default function DashboardPage() {
  return (
    <div>
      <h1>Дашборд</h1>
      {/* Показываем заглушку пока данные загружаются */}
      <Suspense fallback={<div>Загрузка статистики...</div>}>
        <UserStats />
      </Suspense>
      <Suspense fallback={<div>Загрузка заказов...</div>}>
        <RecentOrders />
      </Suspense>
    </div>
  );
}
```

## Серверные компоненты vs Клиентские компоненты

Понимание разницы между серверными и клиентскими компонентами — ключ к правильной архитектуре RSC-приложений.

| Характеристика | Server Component | Client Component |
|----------------|-----------------|-----------------|
| Где выполняется | Только на сервере | Браузер + SSR на сервере |
| Интерактивность | Нет | Да |
| Хуки React (`useState`, `useEffect`) | Нельзя | Можно |
| Обработчики событий (`onClick`) | Нельзя | Можно |
| Доступ к DOM / Web APIs | Нет | Да |
| Доступ к БД, файловой системе | Да, напрямую | Только через API |
| Секретные ключи (env) | Безопасно | Опасно (утечка в браузер) |
| Попадает в JS-бандл клиента | Нет | Да |
| `async/await` на уровне компонента | Да | Нет |
| Использование `use()` хука | Нет | Да (React 19+) |

### Когда использовать серверный компонент

Серверный компонент подходит, когда нужно:
- Получать данные напрямую из базы данных или API
- Работать с секретными ключами или токенами
- Рендерить статичный или редко меняющийся контент
- Уменьшить количество JavaScript на клиенте
- Выполнять тяжёлые вычисления (парсинг, форматирование)

```tsx
// app/blog/[slug]/page.tsx — Server Component
interface Props {
  params: { slug: string };
}

async function BlogPostPage({ params }: Props) {
  // Прямой запрос к БД — нет нужды создавать API endpoint
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: { author: true, tags: true },
  });

  if (!post) {
    notFound(); // Next.js 404
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>Автор: {post.author.name}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

### Когда использовать клиентский компонент

Клиентский компонент необходим, когда нужно:
- Добавить интерактивность (обработчики событий, формы)
- Использовать хуки React (`useState`, `useEffect`, `useRef`)
- Работать с браузерными API (`localStorage`, `window`, `navigator`)
- Анимировать элементы
- Использовать контекст React

```tsx
// components/AddToCart.tsx — Client Component
'use client';

import { useState } from 'react';

interface Props {
  productId: string;
  productName: string;
}

export function AddToCart({ productId, productName }: Props) {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);
    await addToCart(productId);
    setAdded(true);
    setLoading(false);
  }

  return (
    <button onClick={handleAdd} disabled={loading || added}>
      {added ? '✓ Добавлено' : loading ? 'Добавляем...' : 'В корзину'}
    </button>
  );
}
```

## Директива "use client"

`"use client"` — специальная директива, которая определяет **границу** между серверными и клиентскими компонентами.

### Как работает директива

Директива `"use client"` должна быть первой строкой файла (до импортов):

```tsx
'use client'; // Эта строка должна быть первой

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.length > 2) {
      fetch(`/api/search?q=${query}`)
        .then(res => res.json())
        .then(data => setResults(data));
    }
  }, [query]);

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Поиск..."
      />
      <ul>
        {results.map(item => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Граница "use client" распространяется на дочерние компоненты

Когда вы добавляете `"use client"` в файл, **все** компоненты, импортированные в этот файл, также становятся клиентскими:

```tsx
'use client';

// Все эти компоненты теперь тоже будут работать на клиенте
import { Button } from './Button'; // Клиентский
import { Icon } from './Icon';     // Клиентский
import { Modal } from './Modal';   // Клиентский

export function InteractiveCard() {
  // ...
}
```

### Нельзя импортировать серверные компоненты в клиентские

Это важное ограничение RSC: серверный компонент нельзя напрямую импортировать внутри клиентского компонента:

```tsx
// ❌ НЕПРАВИЛЬНО — нельзя импортировать серверный компонент в клиентский
'use client';

import { ServerSideData } from './ServerSideData'; // Ошибка!

export function ClientComponent() {
  return <ServerSideData />; // Не сработает
}
```

Вместо этого передавайте серверные компоненты как `children` или `props`:

```tsx
// app/page.tsx — Server Component (родитель)
import { ClientWrapper } from './ClientWrapper';
import { ServerContent } from './ServerContent';

export default function Page() {
  return (
    // Передаём серверный компонент как children клиентскому
    <ClientWrapper>
      <ServerContent />
    </ClientWrapper>
  );
}
```

```tsx
// ClientWrapper.tsx — Client Component
'use client';

import { useState } from 'react';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Скрыть' : 'Показать'}
      </button>
      {expanded && children} {/* children — серверный компонент, рендерится на сервере */}
    </div>
  );
}
```

## Получение данных в Server Components

Одно из главных преимуществ RSC — упрощённый доступ к данным. Больше не нужны `useEffect`, `useState` для загрузки данных и отдельные API-маршруты.

### Прямые запросы к базе данных

```tsx
// app/users/page.tsx
import { prisma } from '@/lib/prisma';

async function UsersPage() {
  // Прямой доступ к базе данных — никакого API-слоя
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div>
      <h1>Пользователи ({users.length})</h1>
      {users.map(user => (
        <div key={user.id}>
          <span>{user.name}</span>
          <span>{user.email}</span>
        </div>
      ))}
    </div>
  );
}
```

### Fetch с кэшированием Next.js

Next.js расширяет стандартный `fetch` API, добавляя управление кэшированием:

```tsx
// app/posts/page.tsx
async function PostsPage() {
  // Данные кэшируются и обновляются каждые 60 секунд
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 },
  }).then(res => res.json());

  return (
    <div>
      {posts.map((post: Post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

```tsx
// Разные стратегии кэширования
// 1. Статический (кэшируется навсегда, до следующего деплоя)
const data = await fetch(url, { cache: 'force-cache' });

// 2. Динамический (не кэшируется, всегда свежие данные)
const data = await fetch(url, { cache: 'no-store' });

// 3. ISR (кэшируется на N секунд)
const data = await fetch(url, { next: { revalidate: 3600 } });

// 4. On-demand revalidation (ревалидация по тегу)
const data = await fetch(url, { next: { tags: ['posts'] } });
```

### Параллельные запросы данных

```tsx
// app/dashboard/page.tsx
async function DashboardPage() {
  // Запускаем все запросы параллельно с Promise.all
  const [user, orders, notifications] = await Promise.all([
    prisma.user.findFirst({ where: { id: getCurrentUserId() } }),
    prisma.order.findMany({ where: { userId: getCurrentUserId() }, take: 5 }),
    prisma.notification.count({ where: { userId: getCurrentUserId(), read: false } }),
  ]);

  return (
    <main>
      <h1>Привет, {user?.name}!</h1>
      <p>Непрочитанных уведомлений: {notifications}</p>
      <OrdersList orders={orders} />
    </main>
  );
}
```

## Преимущества React Server Components

### 1. Меньше JavaScript на клиенте

Серверные компоненты не попадают в JS-бандл. Это напрямую влияет на производительность:

```tsx
// Этот компонент использует тяжёлые библиотеки — но только на сервере
import { marked } from 'marked';        // ~450 KB — НЕ попадёт в бандл
import { sanitizeHtml } from 'sanitize-html'; // ~200 KB — НЕ попадёт в бандл

async function MarkdownContent({ slug }: { slug: string }) {
  const rawContent = await fetchMarkdown(slug);
  const html = sanitizeHtml(marked(rawContent));

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

Если бы этот компонент был клиентским, пользователь загружал бы дополнительные ~650 KB JavaScript только для рендеринга текста.

### 2. Улучшение SEO

Поскольку контент рендерится на сервере, поисковые роботы сразу получают полностью заполненный HTML:

```tsx
// app/product/[id]/page.tsx — Полный HTML отправляется в браузер
import { Metadata } from 'next';

// Динамические метатеги для SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.imageUrl],
    },
  };
}

async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <span>{product.price} ₽</span>
    </div>
  );
}
```

### 3. Безопасная работа с секретными данными

Ключи API, токены, пароли — всё это остаётся на сервере:

```tsx
// app/weather/page.tsx — Server Component
// API-ключ никогда не попадёт в браузер
const API_KEY = process.env.WEATHER_API_KEY; // Только серверная переменная

async function WeatherPage() {
  const weather = await fetch(
    `https://api.weather.com/current?key=${API_KEY}&city=Moscow`
  ).then(res => res.json());

  return (
    <div>
      <h1>Погода в Москве</h1>
      <p>Температура: {weather.temp}°C</p>
    </div>
  );
}
```

### 4. Устранение проблемы водопадов данных

С RSC вы можете получать данные на каждом уровне дерева компонентов без N+1 запросов:

```tsx
// app/post/[id]/page.tsx
async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

  return (
    <article>
      <h1>{post.title}</h1>
      <AuthorInfo authorId={post.authorId} />
      <PostContent content={post.content} />
      <RelatedPosts tags={post.tags} />
    </article>
  );
}

// Каждый компонент сам запрашивает нужные данные
async function AuthorInfo({ authorId }: { authorId: string }) {
  const author = await getAuthor(authorId); // Независимый запрос

  return (
    <div>
      <img src={author.avatar} alt={author.name} />
      <span>{author.name}</span>
    </div>
  );
}

async function RelatedPosts({ tags }: { tags: string[] }) {
  const related = await getPostsByTags(tags, { limit: 3 }); // Независимый запрос

  return (
    <aside>
      <h2>Похожие статьи</h2>
      {related.map(post => <a key={post.id} href={`/post/${post.id}`}>{post.title}</a>)}
    </aside>
  );
}
```

## Композиция серверных и клиентских компонентов

В реальных приложениях серверные и клиентские компоненты работают вместе. Вот как это выглядит:

### Паттерн: Серверный компонент передаёт данные клиентскому

```tsx
// app/product/[id]/page.tsx — Server Component
import { ProductGallery } from './ProductGallery'; // Client Component
import { AddToCart } from './AddToCart';             // Client Component

async function ProductPage({ params }: { params: { id: string } }) {
  // Получаем данные на сервере
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: true },
  });

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {/* Передаём сериализуемые данные в клиентские компоненты */}
      <ProductGallery images={product.images} />
      <AddToCart productId={product.id} price={product.price} />
    </div>
  );
}
```

```tsx
// ProductGallery.tsx — Client Component (нужна интерактивность)
'use client';

import { useState } from 'react';

interface Image {
  id: string;
  url: string;
  alt: string;
}

export function ProductGallery({ images }: { images: Image[] }) {
  const [current, setCurrent] = useState(0);

  return (
    <div>
      <img src={images[current].url} alt={images[current].alt} />
      <div>
        {images.map((img, i) => (
          <button key={img.id} onClick={() => setCurrent(i)}>
            <img src={img.url} alt={img.alt} width={60} />
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Паттерн: Провайдеры контекста

Context API работает только в клиентских компонентах, но можно обернуть серверные компоненты в клиентский провайдер:

```tsx
// providers/ThemeProvider.tsx — Client Component
'use client';

import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
      {children} {/* children могут включать серверные компоненты */}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

```tsx
// app/layout.tsx — Server Component
import { ThemeProvider } from '@/providers/ThemeProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children} {/* Серверные компоненты внутри клиентского провайдера */}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Server Actions: мутации из серверных компонентов

Server Actions — дополнение к RSC, позволяющее определять серверные функции прямо в компонентах и вызывать их из форм или клиентских компонентов:

```tsx
// app/contact/page.tsx — Server Component с Server Action
async function ContactPage() {
  // Server Action — функция выполняется на сервере
  async function sendMessage(formData: FormData) {
    'use server'; // Директива Server Action

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    // Прямо сохраняем в БД — нет нужды создавать API endpoint
    await prisma.contactMessage.create({
      data: { name, email, message },
    });

    // Отправляем email через серверный сервис
    await sendEmail({ to: 'admin@example.com', subject: `Сообщение от ${name}`, body: message });
  }

  return (
    <form action={sendMessage}>
      <input name="name" placeholder="Ваше имя" required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Сообщение" required />
      <button type="submit">Отправить</button>
    </form>
  );
}
```

## Ограничения Server Components

Зная ограничения, вы избежите распространённых ошибок:

### Нельзя использовать

- `useState`, `useEffect` и другие хуки React
- Обработчики событий (`onClick`, `onChange`)
- Браузерные API (`localStorage`, `sessionStorage`, `window`, `document`)
- Context API (только создание провайдера, не потребление)

```tsx
// ❌ ОШИБКА — хуки в серверном компоненте
async function ServerComponent() {
  const [count, setCount] = useState(0); // Ошибка!
  useEffect(() => { /* ... */ }, []);    // Ошибка!

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>; // Ошибка!
}
```

### Пропсы должны быть сериализуемыми

Данные, передаваемые от серверного компонента клиентскому, должны быть сериализуемы в JSON:

```tsx
// ❌ ОШИБКА — функция не сериализуема
<ClientComponent callback={() => console.log('hello')} />

// ✅ ПРАВИЛЬНО — примитивы и объекты сериализуемы
<ClientComponent id="123" name="Пример" data={{ key: 'value' }} />
```

## RSC в Next.js App Router

Next.js — первый фреймворк с полноценной поддержкой RSC. В App Router (директория `app/`) все компоненты по умолчанию являются серверными.

### Структура App Router

```
app/
├── layout.tsx          # Server Component — общий макет
├── page.tsx            # Server Component — главная страница
├── loading.tsx         # Автоматический Suspense
├── error.tsx           # Клиентский — обработчик ошибок
├── not-found.tsx       # Server Component — страница 404
└── products/
    ├── page.tsx        # Server Component — список товаров
    └── [id]/
        ├── page.tsx    # Server Component — карточка товара
        └── edit/
            └── page.tsx # Может быть Client Component — форма
```

### Специальные файлы

```tsx
// app/products/loading.tsx — Показывается пока page.tsx загружается
export default function Loading() {
  return (
    <div className="skeleton">
      <div className="skeleton-title" />
      <div className="skeleton-text" />
      <div className="skeleton-text" />
    </div>
  );
}
```

```tsx
// app/products/error.tsx — Обработчик ошибок (Client Component)
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Что-то пошло не так!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Попробовать снова</button>
    </div>
  );
}
```

## Сравнение RSC с традиционными подходами

| Подход | Где данные | JS на клиенте | SEO | Интерактивность |
|--------|-----------|--------------|-----|----------------|
| CSR (только React) | Клиент (`useEffect`) | Полный бандл | Плохой | Отличная |
| SSR (традиционный) | Сервер + клиент | Полный бандл | Хороший | Отличная |
| SSG (Gatsby, Next.js Pages) | Сервер (build time) | Полный бандл | Отличный | Хорошая |
| RSC (Next.js App Router) | Сервер (run time) | Только клиентские | Отличный | Хорошая |

## Итоги

React Server Components — это фундаментальное изменение в архитектуре React-приложений:

1. **Серверные компоненты** выполняются только на сервере, не попадают в JS-бандл клиента и поддерживают `async/await`
2. **Клиентские компоненты** помечаются директивой `"use client"` и поддерживают все интерактивные возможности React
3. **Граница** между серверными и клиентскими компонентами определяется директивой `"use client"`, которая влияет на весь поддерев
4. **Данные** можно получать прямо в серверных компонентах без дополнительных API-маршрутов
5. **Преимущества RSC:** меньше JavaScript, лучшее SEO, безопасность секретов, упрощённая работа с данными

RSC не заменяет клиентские компоненты — они дополняют друг друга. Цель — использовать серверные компоненты там, где нет необходимости в интерактивности, и переходить к клиентским только при необходимости. Это позволяет создавать приложения, которые быстро загружаются, хорошо индексируются и при этом остаются интерактивными.
