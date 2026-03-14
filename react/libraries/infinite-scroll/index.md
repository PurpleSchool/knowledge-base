---
metaTitle: Бесконечная прокрутка в React - Infinite Scroll с Intersection Observer
metaDescription: Как реализовать infinite scroll в React: Intersection Observer, react-infinite-scroll-component, useInfiniteQuery и виртуализация списков
author: Олег Марков
title: Бесконечная прокрутка
preview: Реализуйте бесконечную прокрутку в React с помощью Intersection Observer, react-infinite-scroll-component или useInfiniteQuery из React Query
---

## Введение

Бесконечная прокрутка (infinite scroll) — это паттерн загрузки контента, при котором новые данные автоматически подгружаются по мере того, как пользователь прокручивает страницу вниз. Вы наверняка видели его в социальных сетях: Instagram, Twitter, Facebook — везде, где контент потенциально бесконечен.

В противовес традиционной пагинации (когда пользователь вручную кликает по номерам страниц), infinite scroll создаёт ощущение непрерывного потока данных. Это повышает вовлечённость, так как пользователю не нужно делать лишних кликов.

В этой статье мы разберём несколько подходов к реализации бесконечной прокрутки в React:

- Нативный `Intersection Observer API` — без лишних зависимостей
- Кастомный хук `useIntersectionObserver`
- Библиотека `react-infinite-scroll-component` — быстрый старт
- `useInfiniteQuery` из TanStack Query (React Query)
- `useSWRInfinite` из SWR
- Виртуализация списков с `react-window` и `@tanstack/react-virtual`
- Кнопка «Загрузить ещё» — более простая альтернатива

## Что такое infinite scroll и когда его использовать

Infinite scroll имеет смысл применять, когда:

- **Контент последовательный и однородный** — ленты постов, карточки товаров, комментарии
- **Порядок просмотра не критичен** — пользователь не ищет конкретный элемент на конкретной странице
- **Данных очень много** — загружать всё сразу нецелесообразно

Когда лучше **не** использовать infinite scroll:

- **Пользователю нужно вернуться к определённой позиции** — при перезагрузке страницы позиция в бесконечном списке теряется
- **Контент требует навигации** — поиск в таблице, прайс-листы
- **Есть важный footer** — до него пользователь никогда не доберётся
- **Контент нужно найти по номеру страницы** — SEO-требования к пагинации

## Реализация с Intersection Observer API

`Intersection Observer API` — встроенный браузерный механизм, позволяющий отслеживать, когда элемент становится видимым в viewport. Это именно то, что нужно для infinite scroll: когда пользователь видит нижнюю часть списка — загружаем следующую страницу.

Давайте реализуем базовый пример:

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Post {
  id: number;
  title: string;
  body: string;
}

interface FetchResult {
  posts: Post[];
  hasMore: boolean;
}

async function fetchPosts(page: number): Promise<FetchResult> {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=10`
  );
  const posts: Post[] = await response.json();
  return {
    posts,
    hasMore: posts.length === 10, // Если вернулось 10 — скорее всего есть ещё
  };
}

function InfiniteScrollBasic() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref для "сигнального" элемента внизу списка
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;

      // Отключаем предыдущий observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Создаём новый observer для последнего элемента
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [loading, hasMore]
  );

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchPosts(page)
      .then(({ posts: newPosts, hasMore: more }) => {
        setPosts((prev) => [...prev, ...newPosts]);
        setHasMore(more);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page]);

  return (
    <div>
      {posts.map((post, index) => {
        // Последний элемент получает ref для наблюдения
        const isLast = index === posts.length - 1;
        return (
          <div
            key={post.id}
            ref={isLast ? lastPostRef : null}
            style={{
              padding: '16px',
              margin: '8px 0',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
            }}
          >
            <h3>{post.title}</h3>
            <p>{post.body}</p>
          </div>
        );
      })}

      {loading && <div>Загружаем...</div>}
      {error && <div style={{ color: 'red' }}>Ошибка: {error}</div>}
      {!hasMore && <div>Все посты загружены</div>}
    </div>
  );
}

export default InfiniteScrollBasic;
```

Ключевая идея: мы вешаем `ref` на последний элемент списка. Когда он появляется в viewport, `IntersectionObserver` вызывает callback, и мы увеличиваем номер страницы. `useEffect` следит за изменением `page` и загружает следующую порцию данных.

## useIntersectionObserver кастомный хук

Чтобы не дублировать логику с `IntersectionObserver` в каждом компоненте, вынесем её в кастомный хук:

```tsx
import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: RefObject<HTMLDivElement | null>;
  isIntersecting: boolean;
}

function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Если freezeOnceVisible=true и элемент уже был виден — не создаём observer
    if (freezeOnceVisible && isIntersecting) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, isIntersecting]);

  return { ref, isIntersecting };
}

export default useIntersectionObserver;
```

Теперь применим хук в компоненте бесконечной прокрутки:

```tsx
import React, { useState, useEffect } from 'react';
import useIntersectionObserver from './useIntersectionObserver';

interface Product {
  id: number;
  name: string;
  price: number;
}

// Имитация API
async function loadProducts(page: number): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return Array.from({ length: 12 }, (_, i) => ({
    id: page * 12 + i,
    name: `Товар ${page * 12 + i + 1}`,
    price: Math.floor(Math.random() * 10000) + 500,
  }));
}

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Хук возвращает ref для "триггерного" элемента и флаг видимости
  const { ref: triggerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px', // Загружаем заранее, до достижения конца
  });

  // Загружаем следующую страницу, когда триггер становится видимым
  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  }, [isIntersecting, hasMore, loading]);

  useEffect(() => {
    if (page === 0) return;

    setLoading(true);
    loadProducts(page).then((newProducts) => {
      setProducts((prev) => [...prev, ...newProducts]);
      // Имитируем конец данных на 5-й странице
      if (page >= 5) setHasMore(false);
      setLoading(false);
    });
  }, [page]);

  return (
    <div>
      <h1>Каталог товаров</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              padding: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          >
            <h3>{product.name}</h3>
            <p>{product.price} ₽</p>
          </div>
        ))}
      </div>

      {/* Триггерный элемент — когда он попадает в viewport, загружается следующая страница */}
      {hasMore && (
        <div ref={triggerRef} style={{ height: '20px', margin: '20px 0' }} />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Загружаем товары...
        </div>
      )}

      {!hasMore && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
          Все товары загружены
        </div>
      )}
    </div>
  );
}

export default ProductList;
```

Обратите внимание на `rootMargin: '200px'` — это заставляет observer срабатывать за 200 пикселей до того, как триггерный элемент окажется в видимой области. Пользователь не заметит момент загрузки — данные появятся заблаговременно.

## Библиотека react-infinite-scroll-component

Если вы хотите быстро добавить infinite scroll без написания кастомной логики, `react-infinite-scroll-component` — хороший выбор:

```bash
npm install react-infinite-scroll-component
```

Базовое использование:

```tsx
import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

interface Comment {
  id: number;
  name: string;
  email: string;
  body: string;
}

function CommentsFeed() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchComments = async () => {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/comments?_page=${page}&_limit=15`
    );
    const data: Comment[] = await response.json();

    setComments((prev) => [...prev, ...data]);
    setHasMore(data.length === 15);
    setPage((prev) => prev + 1);
  };

  useEffect(() => {
    fetchComments();
  }, []);

  return (
    <InfiniteScroll
      dataLength={comments.length}     // Текущее количество элементов
      next={fetchComments}              // Функция загрузки следующей страницы
      hasMore={hasMore}                 // Есть ли ещё данные
      loader={<h4>Загружаем...</h4>}   // Компонент загрузки
      endMessage={
        <p style={{ textAlign: 'center' }}>
          <b>Все комментарии загружены</b>
        </p>
      }
      // Опционально: pull-to-refresh на мобильных
      pullDownToRefresh
      refreshFunction={() => {
        setComments([]);
        setPage(1);
        setHasMore(true);
      }}
      pullDownToRefreshThreshold={50}
      pullDownToRefreshContent={<h3>&#8595; Потяните для обновления</h3>}
      releaseToRefreshContent={<h3>&#8593; Отпустите для обновления</h3>}
    >
      {comments.map((comment) => (
        <div
          key={comment.id}
          style={{
            padding: '16px',
            margin: '8px',
            background: '#f9f9f9',
            borderRadius: '8px',
          }}
        >
          <strong>{comment.name}</strong>
          <p style={{ color: '#666', fontSize: '14px' }}>{comment.email}</p>
          <p>{comment.body}</p>
        </div>
      ))}
    </InfiniteScroll>
  );
}

export default CommentsFeed;
```

Прокрутка внутри контейнера фиксированной высоты:

```tsx
import InfiniteScroll from 'react-infinite-scroll-component';

function ScrollableContainer() {
  const [items, setItems] = useState<string[]>(
    Array.from({ length: 20 }, (_, i) => `Элемент ${i + 1}`)
  );
  const [hasMore, setHasMore] = useState(true);

  const fetchMore = () => {
    const currentLength = items.length;
    if (currentLength >= 100) {
      setHasMore(false);
      return;
    }
    const newItems = Array.from(
      { length: 20 },
      (_, i) => `Элемент ${currentLength + i + 1}`
    );
    setItems((prev) => [...prev, ...newItems]);
  };

  return (
    // scrollableTarget — ID контейнера с прокруткой
    <div
      id="scrollable-div"
      style={{ height: '400px', overflow: 'auto', border: '1px solid #ddd' }}
    >
      <InfiniteScroll
        dataLength={items.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={<p>Загружаем...</p>}
        scrollableTarget="scrollable-div" // Указываем контейнер с прокруткой
        endMessage={<p>Всё загружено!</p>}
      >
        {items.map((item, index) => (
          <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            {item}
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
}
```

## Бесконечная прокрутка с React Query (useInfiniteQuery)

TanStack Query (React Query) предоставляет хук `useInfiniteQuery`, специально разработанный для бесконечной пагинации. Он автоматически управляет кэшированием, состояниями загрузки и ошибок:

```bash
npm install @tanstack/react-query
```

Сначала настроим провайдер:

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InfinitePostList />
    </QueryClientProvider>
  );
}
```

Теперь реализуем компонент с `useInfiniteQuery`:

```tsx
import React, { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import useIntersectionObserver from './useIntersectionObserver';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface PostsPage {
  posts: Post[];
  nextPage: number | undefined;
  totalPages: number;
}

// Функция получения данных с поддержкой пагинации
async function fetchPosts(page: number): Promise<PostsPage> {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=10`
  );
  const posts: Post[] = await response.json();
  const totalCount = parseInt(response.headers.get('x-total-count') || '100');
  const totalPages = Math.ceil(totalCount / 10);

  return {
    posts,
    nextPage: page < totalPages ? page + 1 : undefined,
    totalPages,
  };
}

function InfinitePostList() {
  const { ref: triggerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Загружаем следующую страницу при появлении триггера
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <div>Начальная загрузка...</div>;
  }

  if (isError) {
    return <div>Ошибка: {error.message}</div>;
  }

  // data.pages — массив страниц, каждая страница содержит массив постов
  const allPosts = data.pages.flatMap((page) => page.posts);

  return (
    <div>
      <h1>Посты</h1>

      {allPosts.map((post) => (
        <article
          key={post.id}
          style={{
            padding: '16px',
            margin: '12px 0',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
          }}
        >
          <h2 style={{ fontSize: '18px' }}>{post.title}</h2>
          <p>{post.body}</p>
        </article>
      ))}

      {/* Триггер для загрузки следующей страницы */}
      <div ref={triggerRef} style={{ padding: '10px', textAlign: 'center' }}>
        {isFetchingNextPage && <span>Загружаем следующую страницу...</span>}
        {!hasNextPage && <span>Все посты загружены</span>}
      </div>
    </div>
  );
}

export default InfinitePostList;
```

Разберём ключевые параметры `useInfiniteQuery`:

- `queryKey` — уникальный ключ кэша. Если вы добавляете фильтры, включайте их сюда: `['posts', { category }]`
- `queryFn` — функция запроса данных, получает `pageParam` как параметр
- `initialPageParam` — начальный параметр страницы (обычно 1 или 0)
- `getNextPageParam` — функция, которая определяет параметр для следующей страницы. Если возвращает `undefined`, `hasNextPage` будет `false`

Пример с курсорной пагинацией (когда API возвращает курсор вместо номера страницы):

```tsx
interface UsersPage {
  users: User[];
  nextCursor: string | null;
}

const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['users'],
  queryFn: async ({ pageParam }) => {
    const url = pageParam
      ? `/api/users?cursor=${pageParam}`
      : '/api/users';
    const response = await fetch(url);
    return response.json() as Promise<UsersPage>;
  },
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

## Бесконечная прокрутка с SWR (useSWRInfinite)

SWR предоставляет `useSWRInfinite` для бесконечной пагинации. Подход немного отличается от React Query:

```bash
npm install swr
```

```tsx
import React, { useEffect } from 'react';
import useSWRInfinite from 'swr/infinite';
import useIntersectionObserver from './useIntersectionObserver';

interface Photo {
  id: number;
  title: string;
  thumbnailUrl: string;
  url: string;
}

const PAGE_SIZE = 12;

// fetcher функция
const fetcher = (url: string): Promise<Photo[]> =>
  fetch(url).then((res) => res.json());

// Функция генерации ключей страниц
// Если предыдущая страница вернула пустой массив — возвращаем null (прекращаем загрузку)
function getKey(pageIndex: number, previousPageData: Photo[] | null): string | null {
  if (previousPageData && previousPageData.length === 0) return null;
  return `https://jsonplaceholder.typicode.com/photos?_page=${pageIndex + 1}&_limit=${PAGE_SIZE}`;
}

function PhotoGallery() {
  const { ref: triggerRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '300px',
  });

  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
  } = useSWRInfinite<Photo[]>(getKey, fetcher, {
    revalidateFirstPage: false, // Не перепроверяем первую страницу при загрузке новых
    revalidateOnFocus: false,
  });

  const photos = data ? data.flat() : [];
  const isLoadingMore = isValidating && size > 1 && data && typeof data[size - 1] === 'undefined';
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE);

  useEffect(() => {
    if (isIntersecting && !isReachingEnd && !isValidating) {
      setSize((prev) => prev + 1);
    }
  }, [isIntersecting, isReachingEnd, isValidating, setSize]);

  if (isLoading) return <div>Загружаем галерею...</div>;
  if (error) return <div>Ошибка загрузки</div>;

  return (
    <div>
      <h1>Галерея фото</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
        }}
      >
        {photos.map((photo) => (
          <div key={photo.id} style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <img
              src={photo.thumbnailUrl}
              alt={photo.title}
              style={{ width: '100%', display: 'block' }}
              loading="lazy"
            />
            <p
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                background: '#f5f5f5',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {photo.title}
            </p>
          </div>
        ))}
      </div>

      <div ref={triggerRef} style={{ textAlign: 'center', padding: '20px' }}>
        {isLoadingMore && <span>Загружаем ещё...</span>}
        {isReachingEnd && <span>Все фото загружены</span>}
      </div>
    </div>
  );
}

export default PhotoGallery;
```

Особенности `useSWRInfinite`:

- `getKey` — функция, которая получает `pageIndex` и данные предыдущей страницы. Должна возвращать `null`, чтобы остановить загрузку
- `data` — массив страниц (аналогично `data.pages` в React Query)
- `setSize` — функция для изменения количества загруженных страниц
- `size` — текущее количество загруженных страниц

## Виртуализация списков с react-window и react-virtual для производительности

Когда в DOM находятся тысячи элементов, производительность резко падает. Виртуализация решает эту проблему: в DOM рендерится только то, что видно на экране.

### react-window

```bash
npm install react-window
npm install @types/react-window --save-dev
```

Простой список с виртуализацией:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

interface Item {
  id: number;
  text: string;
}

const ITEMS_PER_PAGE = 20;
const TOTAL_ITEMS = 1000;

function VirtualizedInfiniteList() {
  const [items, setItems] = useState<(Item | undefined)[]>(
    new Array(TOTAL_ITEMS).fill(undefined)
  );
  const [loadedCount, setLoadedCount] = useState(0);

  // Загружаем диапазон элементов
  const loadMoreItems = (startIndex: number, stopIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setItems((prev) => {
          const next = [...prev];
          for (let i = startIndex; i <= stopIndex; i++) {
            next[i] = { id: i, text: `Элемент ${i + 1} (загружен с сервера)` };
          }
          return next;
        });
        setLoadedCount((prev) => Math.max(prev, stopIndex + 1));
        resolve();
      }, 500);
    });
  };

  // Проверяем, загружен ли элемент
  const isItemLoaded = (index: number): boolean => items[index] !== undefined;

  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return (
      <div
        style={{
          ...style,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
          background: index % 2 === 0 ? '#fff' : '#f9f9f9',
        }}
      >
        {item ? item.text : 'Загружается...'}
      </div>
    );
  };

  return (
    <div>
      <h2>Виртуализированный список ({TOTAL_ITEMS} элементов)</h2>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={TOTAL_ITEMS}
        loadMoreItems={loadMoreItems}
        minimumBatchSize={ITEMS_PER_PAGE}
        threshold={10} // Загружаем следующую порцию за 10 элементов до конца
      >
        {({ onItemsRendered, ref }) => (
          <FixedSizeList
            height={600}
            width="100%"
            itemCount={TOTAL_ITEMS}
            itemSize={50} // Высота каждого элемента в пикселях
            onItemsRendered={onItemsRendered}
            ref={ref}
          >
            {Row}
          </FixedSizeList>
        )}
      </InfiniteLoader>
    </div>
  );
}

export default VirtualizedInfiniteList;
```

Для элементов переменной высоты используйте `VariableSizeList`:

```tsx
import { VariableSizeList } from 'react-window';

function VariableHeightList() {
  const listRef = useRef<VariableSizeList>(null);

  // Функция вычисления высоты элемента по индексу
  const getItemSize = (index: number): number => {
    // Логика зависит от контента — можно хранить в массиве заранее вычисленных высот
    return index % 3 === 0 ? 100 : 60;
  };

  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={{ ...style, padding: '8px 16px', borderBottom: '1px solid #eee' }}>
      Элемент {index + 1} (высота: {getItemSize(index)}px)
    </div>
  );

  return (
    <VariableSizeList
      height={500}
      width="100%"
      itemCount={10000}
      itemSize={getItemSize}
      ref={listRef}
    >
      {Row}
    </VariableSizeList>
  );
}
```

### @tanstack/react-virtual

`@tanstack/react-virtual` — более гибкая и современная библиотека виртуализации без встроенного компонента (headless):

```bash
npm install @tanstack/react-virtual
```

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  category: string;
  publishedAt: string;
}

async function fetchNews(page: number): Promise<NewsItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return Array.from({ length: 20 }, (_, i) => ({
    id: page * 20 + i,
    headline: `Заголовок новости ${page * 20 + i + 1}`,
    summary: `Краткое описание новости. Здесь может быть несколько предложений с деталями о произошедшем событии.`,
    category: ['Политика', 'Технологии', 'Спорт', 'Культура'][i % 4],
    publishedAt: new Date(Date.now() - i * 3600000).toLocaleString('ru-RU'),
  }));
}

function VirtualNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: news.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Примерная высота каждого элемента
    overscan: 5, // Количество элементов вне viewport для предзагрузки
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Определяем, нужно ли загрузить следующую страницу
  useEffect(() => {
    if (!virtualItems.length) return;

    const lastVirtualItem = virtualItems[virtualItems.length - 1];
    if (lastVirtualItem.index >= news.length - 5 && hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  }, [virtualItems, news.length, hasMore, loading]);

  useEffect(() => {
    if (page === 0) {
      setPage(1);
      return;
    }

    setLoading(true);
    fetchNews(page).then((newNews) => {
      setNews((prev) => [...prev, ...newNews]);
      if (page >= 10) setHasMore(false);
      setLoading(false);
    });
  }, [page]);

  return (
    <div>
      <h1>Новостная лента</h1>

      <div
        ref={parentRef}
        style={{ height: '600px', overflow: 'auto', border: '1px solid #ddd' }}
      >
        {/* Контейнер виртуального списка — высота равна общей высоте всех элементов */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const newsItem = news[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement} // Для точного измерения высоты
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #eee',
                    background: '#fff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#888',
                        background: '#f0f0f0',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {newsItem.category}
                    </span>
                    <span style={{ fontSize: '12px', color: '#aaa' }}>
                      {newsItem.publishedAt}
                    </span>
                  </div>
                  <h3 style={{ margin: '8px 0 4px', fontSize: '16px' }}>
                    {newsItem.headline}
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    {newsItem.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          Загружаем новости...
        </div>
      )}
    </div>
  );
}

export default VirtualNewsFeed;
```

Виртуализация особенно важна, когда вы знаете, что пользователь будет прокручивать тысячи элементов. Без неё браузер будет тратить ресурсы на рендер скрытых элементов.

## Загрузка по кнопке "Загрузить ещё" — альтернатива

Иногда бесконечная прокрутка — не лучший выбор. Кнопка «Загрузить ещё» даёт пользователю контроль над тем, когда загружать новый контент:

```tsx
import React, { useState, useCallback } from 'react';

interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  date: string;
}

const REVIEWS_PER_PAGE = 5;

async function fetchReviews(page: number): Promise<Review[]> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (page > 4) return []; // Имитация конца данных

  return Array.from({ length: REVIEWS_PER_PAGE }, (_, i) => ({
    id: (page - 1) * REVIEWS_PER_PAGE + i + 1,
    author: `Пользователь ${(page - 1) * REVIEWS_PER_PAGE + i + 1}`,
    rating: Math.floor(Math.random() * 2) + 4,
    text: 'Отличный продукт! Рекомендую всем. Доставка быстрая, качество на высоте.',
    date: new Date(Date.now() - Math.random() * 30 * 24 * 3600000).toLocaleDateString('ru-RU'),
  }));
}

function ReviewList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadReviews = useCallback(async (pageToLoad: number) => {
    setLoading(true);
    try {
      const newReviews = await fetchReviews(pageToLoad);
      if (newReviews.length === 0) {
        setHasMore(false);
      } else {
        setReviews((prev) => [...prev, ...newReviews]);
        setPage((prev) => prev + 1);
        if (newReviews.length < REVIEWS_PER_PAGE) {
          setHasMore(false);
        }
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  // Загружаем первую страницу при монтировании
  React.useEffect(() => {
    loadReviews(1);
  }, []);

  const renderStars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  if (initialLoading) {
    return <div>Загружаем отзывы...</div>;
  }

  return (
    <div>
      <h2>Отзывы покупателей ({reviews.length} загружено)</h2>

      <div>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              padding: '16px',
              margin: '12px 0',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <strong>{review.author}</strong>
              <span style={{ color: '#888', fontSize: '14px' }}>{review.date}</span>
            </div>
            <div style={{ color: '#f4b942', marginBottom: '8px', fontSize: '18px' }}>
              {renderStars(review.rating)}
            </div>
            <p style={{ margin: 0 }}>{review.text}</p>
          </div>
        ))}
      </div>

      {hasMore ? (
        <button
          onClick={() => loadReviews(page)}
          disabled={loading}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            marginTop: '16px',
            background: loading ? '#ccc' : '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Загружаем...' : 'Загрузить ещё отзывы'}
        </button>
      ) : (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '16px' }}>
          Все отзывы загружены
        </p>
      )}
    </div>
  );
}

export default ReviewList;
```

Кнопка «Загрузить ещё» также легко реализуется с `useInfiniteQuery`:

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';

function ReviewsWithReactQuery() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['reviews'],
    queryFn: ({ pageParam }) => fetchReviews(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === REVIEWS_PER_PAGE ? allPages.length + 1 : undefined,
  });

  const allReviews = data?.pages.flat() ?? [];

  return (
    <div>
      {allReviews.map((review) => (
        <div key={review.id}>{/* ... карточка отзыва */}</div>
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Загружаем...' : 'Загрузить ещё'}
        </button>
      )}
    </div>
  );
}
```

## Обработка loading и error состояний

Грамотная обработка состояний — ключ к хорошему UX. Рассмотрим полноценный компонент с обработкой всех возможных состояний:

```tsx
import React, { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import useIntersectionObserver from './useIntersectionObserver';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  readTime: number;
}

interface ArticlesPage {
  articles: Article[];
  nextCursor: string | null;
  total: number;
}

async function fetchArticles(cursor: string | null): Promise<ArticlesPage> {
  const params = cursor ? `?cursor=${cursor}` : '';
  const response = await fetch(`/api/articles${params}`);

  if (!response.ok) {
    throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Скелетон карточки для состояния загрузки
function ArticleSkeleton() {
  return (
    <div
      style={{
        padding: '16px',
        margin: '12px 0',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        animation: 'pulse 1.5s infinite',
      }}
    >
      <div
        style={{ height: '20px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px' }}
      />
      <div
        style={{ height: '14px', background: '#e0e0e0', borderRadius: '4px', width: '60%' }}
      />
    </div>
  );
}

// Компонент отображения ошибки с возможностью повтора
interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      style={{
        padding: '16px',
        margin: '12px 0',
        border: '1px solid #ffcdd2',
        borderRadius: '8px',
        background: '#fff3f3',
        textAlign: 'center',
      }}
    >
      <p style={{ color: '#c62828', margin: '0 0 12px' }}>{message}</p>
      <button
        onClick={onRetry}
        style={{
          padding: '8px 16px',
          background: '#c62828',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Попробовать снова
      </button>
    </div>
  );
}

function ArticlesFeed() {
  const { ref: triggerRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '400px',
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['articles'],
    queryFn: ({ pageParam }) => fetchArticles(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    retry: 3,           // Автоматически повторяем при ошибке (3 раза)
    retryDelay: 1000,   // Пауза между попытками — 1 секунда
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Состояние начальной загрузки
  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <ArticleSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Ошибка при начальной загрузке
  if (isError) {
    return (
      <ErrorMessage
        message={`Не удалось загрузить статьи: ${error.message}`}
        onRetry={() => refetch()}
      />
    );
  }

  const allArticles = data.pages.flatMap((page) => page.articles);
  const total = data.pages[0]?.total ?? 0;

  return (
    <div>
      <h1>Статьи ({total})</h1>

      {allArticles.map((article) => (
        <article
          key={article.id}
          style={{
            padding: '20px',
            margin: '12px 0',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>{article.title}</h2>
          <p style={{ color: '#555', margin: '0 0 12px' }}>{article.excerpt}</p>
          <div style={{ display: 'flex', gap: '16px', color: '#888', fontSize: '14px' }}>
            <span>Автор: {article.author}</span>
            <span>Время чтения: {article.readTime} мин</span>
          </div>
        </article>
      ))}

      {/* Область с триггером и индикатором загрузки */}
      <div ref={triggerRef} style={{ padding: '20px', textAlign: 'center' }}>
        {isFetchingNextPage && (
          <div>
            {/* Скелетоны для следующей страницы */}
            {Array.from({ length: 3 }).map((_, i) => (
              <ArticleSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Ошибка при загрузке следующей страницы */}
        {isError && isFetching && (
          <ErrorMessage
            message="Не удалось загрузить следующую страницу"
            onRetry={() => fetchNextPage()}
          />
        )}

        {!hasNextPage && !isFetchingNextPage && (
          <p style={{ color: '#888' }}>Все статьи загружены ({allArticles.length} из {total})</p>
        )}
      </div>
    </div>
  );
}

export default ArticlesFeed;
```

## Сохранение позиции прокрутки

Одна из проблем infinite scroll — при переходе на страницу деталей и возврате назад пользователь теряет позицию. Вот как её сохранить:

```tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function PostListWithScrollRestore() {
  const scrollPositionRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Сохраняем позицию перед уходом
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
      sessionStorage.setItem('postsScrollY', String(window.scrollY));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Восстанавливаем позицию при возврате
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('postsScrollY');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }
  }, []);

  return <div ref={containerRef}>{/* Список постов */}</div>;
}
```

## Заключение

Бесконечная прокрутка — мощный инструмент для улучшения UX при работе с большими списками данных. В этой статье мы рассмотрели несколько подходов:

| Подход | Когда использовать |
|---|---|
| `Intersection Observer` нативный | Нет зависимостей, полный контроль |
| `useIntersectionObserver` хук | Переиспользуемое решение в проекте |
| `react-infinite-scroll-component` | Быстрый старт, pull-to-refresh |
| `useInfiniteQuery` (React Query) | Кэширование, сложная логика, TypeScript |
| `useSWRInfinite` | Если уже используете SWR |
| `react-window` / `react-virtual` | Тысячи элементов, производительность |
| Кнопка «Загрузить ещё» | Контент, где важна позиция; мобильные |

Для большинства проектов рекомендуем `useInfiniteQuery` из TanStack Query — он предоставляет всё необходимое: кэширование, состояния загрузки, обработку ошибок, повторные попытки и TypeScript поддержку из коробки. Если данных очень много (тысячи элементов), добавьте виртуализацию с `@tanstack/react-virtual`.

Не забывайте о доступности: бесконечный список должен иметь альтернативу для пользователей с ограниченными возможностями, а также корректно работать с клавиатурной навигацией.
