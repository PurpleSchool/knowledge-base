---
metaTitle: Incremental Static Regeneration (ISR) в Next.js — revalidate
metaDescription: Разбираем ISR в Next.js — как работает инкрементальная регенерация страниц, параметр revalidate, on-demand revalidation и когда использовать ISR.
author: Антон Ларичев
title: Incremental Static Regeneration (ISR) в Next.js — как работает и зачем нужен
preview: Подробный разбор ISR в Next.js — инкрементальная регенерация статических страниц через revalidate, обновление по запросу через revalidatePath и практические примеры.
---

## Введение

Incremental Static Regeneration (ISR) — стратегия рендеринга в Next.js, которая объединяет лучшее от SSG и SSR. Страницы генерируются статически при сборке, но в отличие от чистого SSG — могут автоматически обновляться в фоне через заданный интервал времени, без полного перезапуска сборки.

Это решает главную проблему SSG: данные устаревают. С ISR страница «протухает» через N секунд, и при следующем запросе Next.js регенерирует её в фоне, пока пользователь получает старую (кешированную) версию. После завершения регенерации кеш обновляется.

В этой статье разберём как ISR работает под капотом, как его настроить в Pages Router и App Router, и когда он предпочтительнее SSG или SSR.

## Как работает ISR

Механизм ISR основан на паттерне **stale-while-revalidate**:

1. При первом запросе к странице Next.js отдаёт кешированный HTML (статически сгенерированный при сборке).
2. Если время жизни кеша (revalidate) истекло — Next.js запускает регенерацию страницы **в фоне**.
3. Пока идёт регенерация, текущий и последующие пользователи получают **старую** версию страницы.
4. Как только регенерация завершена — кеш обновляется, следующий запрос получит новую версию.

Важно: пользователь **никогда** не ждёт регенерации. В худшем случае он видит данные, устаревшие не более чем на `revalidate` секунд.

## ISR в Pages Router через revalidate

В Pages Router ISR включается добавлением поля `revalidate` в возвращаемый объект из `getStaticProps`:

### Базовый пример

```typescript
// pages/products.tsx
import type { GetStaticProps, NextPage } from 'next';

interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
}

interface Props {
  products: Product[];
  lastUpdated: string;
}

const ProductsPage: NextPage<Props> = ({ products, lastUpdated }) => {
  return (
    <div>
      <h1>Каталог товаров</h1>
      <p>Обновлено: {lastUpdated}</p>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.title} — {product.price} ₽
          </li>
        ))}
      </ul>
    </div>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const response = await fetch('https://fakestoreapi.com/products');
  const products: Product[] = await response.json();

  return {
    props: {
      products,
      lastUpdated: new Date().toLocaleString('ru-RU'),
    },
    // Регенерировать страницу не чаще, чем раз в 60 секунд
    revalidate: 60,
  };
};

export default ProductsPage;
```

### ISR для динамических страниц

ISR отлично работает в связке с `getStaticPaths` и `fallback: 'blocking'`:

```typescript
// pages/products/[id].tsx
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
}

interface Props {
  product: Product;
}

const ProductPage: NextPage<Props> = ({ product }) => {
  return (
    <div>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <strong>Цена: {product.price} ₽</strong>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Предгенерируем только первые 10 товаров
  const response = await fetch('https://fakestoreapi.com/products?limit=10');
  const products: Product[] = await response.json();

  const paths = products.map((p) => ({
    params: { id: String(p.id) },
  }));

  return {
    paths,
    // Остальные товары сгенерируются при первом обращении и закешируются
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<Props> = async (context) => {
  const { id } = context.params as { id: string };

  const response = await fetch(`https://fakestoreapi.com/products/${id}`);

  if (!response.ok) {
    return { notFound: true };
  }

  const product: Product = await response.json();

  return {
    props: { product },
    // Обновлять цену каждые 5 минут
    revalidate: 300,
  };
};

export default ProductPage;
```

Если хотите детальнее разобраться с ISR, SSG и SSR в Next.js — приходите на наш курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=incremental-static-regeneration). На курсе 120 уроков и 30 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## On-Demand Revalidation

Помимо интервала `revalidate`, Next.js поддерживает **принудительную регенерацию по запросу**. Это удобно при работе с CMS: при публикации новой статьи CMS делает вебхук-запрос к вашему API, который запускает регенерацию нужных страниц.

### Настройка on-demand revalidation

```typescript
// pages/api/revalidate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Проверяем секретный токен для защиты эндпоинта
  if (req.query.secret !== process.env.REVALIDATION_SECRET) {
    return res.status(401).json({ message: 'Неверный токен' });
  }

  // Получаем путь для регенерации из тела запроса
  const { path } = req.body as { path: string };

  if (!path) {
    return res.status(400).json({ message: 'Не указан path' });
  }

  try {
    // Принудительно регенерируем указанную страницу
    await res.revalidate(path);
    return res.json({ revalidated: true, path });
  } catch (err) {
    return res.status(500).json({ message: 'Ошибка регенерации', error: String(err) });
  }
}
```

Пример вызова из CMS при публикации нового поста:

```typescript
// Этот код выполняется в CMS при публикации
const response = await fetch('https://mysite.com/api/revalidate?secret=MY_SECRET', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ path: '/blog/new-post-slug' }),
});

const data = await response.json();
console.log(data); // { revalidated: true, path: '/blog/new-post-slug' }
```

## ISR в App Router

В App Router ISR конфигурируется через параметр `next.revalidate` в опциях `fetch` или через экспорт переменной `revalidate` на уровне сегмента:

```typescript
// app/products/page.tsx

interface Product {
  id: number;
  title: string;
  price: number;
}

async function ProductsPage() {
  // Кешировать результат на 60 секунд, затем регенерировать
  const response = await fetch('https://fakestoreapi.com/products', {
    next: { revalidate: 60 },
  });

  const products: Product[] = await response.json();

  return (
    <div>
      <h1>Каталог</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.title} — {p.price}$</li>
        ))}
      </ul>
    </div>
  );
}

export default ProductsPage;
```

Можно задать `revalidate` для целого сегмента маршрута:

```typescript
// app/blog/layout.tsx или app/blog/page.tsx

// Все страницы в этом сегменте будут ревалидироваться каждые 3600 секунд (1 час)
export const revalidate = 3600;

async function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="blog">{children}</div>;
}

export default BlogLayout;
```

On-demand revalidation в App Router через `revalidatePath` и `revalidateTag`:

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Неверный токен' }, { status: 401 });
  }

  const body = await request.json();

  if (body.path) {
    // Регенерируем конкретный путь
    revalidatePath(body.path);
  }

  if (body.tag) {
    // Регенерируем все запросы с указанным тегом кеша
    revalidateTag(body.tag);
  }

  return NextResponse.json({ revalidated: true });
}
```

## Сравнение ISR, SSG и SSR

| Критерий | SSG | ISR | SSR |
|----------|-----|-----|-----|
| Скорость ответа | Максимальная (CDN) | Высокая (CDN + фоновая генерация) | Средняя (серверная обработка) |
| Свежесть данных | Только при ребилде | Настраиваемый интервал | Всегда свежие |
| Нагрузка на сервер | Минимальная | Низкая | Высокая |
| Персонализация | Нет | Нет | Да |
| Подходит для | Документация, лендинги | Каталоги, блоги | Личные кабинеты |

## Когда использовать ISR

* **Каталоги товаров** — цены и наличие меняются, но не поминутно. `revalidate: 300` (5 минут) — хороший баланс.
* **Новостные сайты** — статьи публикуются несколько раз в день. `revalidate: 60` плюс on-demand revalidation при публикации.
* **Лендинги с A/B-тестами** — обновление без ребилда через on-demand revalidation.
* **Большие сайты** — тысячи страниц, которые нельзя сгенерировать все при сборке. Предгенерируйте ТОП-страницы, остальные — `fallback: 'blocking'` с `revalidate`.

## Частые ошибки

* **Ожидание мгновенного обновления.** ISR по интервалу обновляет кеш **после** первого запроса, пришедшего после истечения `revalidate`. Пользователь, запросивший страницу в момент устаревания, ещё видит старую версию.

* **Слишком малый revalidate.** Значение `revalidate: 1` превращает ISR почти в SSR, но с накладными расходами. Если нужны свежие данные чаще чем раз в несколько секунд — используйте SSR.

* **Отсутствие защиты API регенерации.** Публичный эндпоинт on-demand revalidation может быть вызван злоумышленником и перегрузить сервер. Всегда защищайте его секретным токеном.

* **Несоответствие revalidate и реальной частоты обновления данных.** Если ваши данные обновляются раз в день — нет смысла ставить `revalidate: 10`. Настраивайте интервал исходя из реальных требований к свежести.

## Часто задаваемые вопросы

**Что происходит, если регенерация страницы завершается ошибкой?**

Next.js продолжает отдавать последнюю успешно сгенерированную версию страницы. Сломанный API не приведёт к показу 500 пользователям — они просто получат устаревшие данные до восстановления источника.

**Можно ли отключить ISR для конкретного запроса и вернуть SSG?**

В Pages Router достаточно убрать `revalidate` из `getStaticProps` — страница вернётся к чистому SSG. В App Router используйте `cache: 'force-cache'` или `revalidate = false`.

**Как проверить, что ISR работает?**

В ответе сервера проверьте заголовок `x-nextjs-cache`. Значение `HIT` означает кеш, `STALE` — устаревший кеш (идёт регенерация), `MISS` — первый запрос или ошибка.

## Заключение

ISR — элегантное решение для большинства production-сайтов, которым нужна свежесть данных без накладных расходов SSR. Страницы остаются быстрыми и кешируемыми, а данные обновляются в фоне по расписанию или по событию из CMS.

Для закрепления навыков и глубокого понимания всех стратегий рендеринга в Next.js рекомендуем курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=incremental-static-regeneration). В первых модулях курса доступно бесплатное содержание — можно изучить основы и понять структуру курса до покупки полного доступа.
