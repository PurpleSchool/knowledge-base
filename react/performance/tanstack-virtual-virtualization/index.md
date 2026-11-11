---
metaTitle: "TanStack Virtual: виртуализация списков в React"
metaDescription: "Как использовать TanStack Virtual для виртуализации длинных списков в React. useVirtualizer, динамические размеры, бесконечная прокрутка."
author: "Антон Ларичев"
title: "Виртуализация списков в React с TanStack Virtual"
preview: "Рендерим тысячи элементов без потери производительности — разбираем TanStack Virtual с практическими примерами."
---

## Что такое виртуализация списков

Когда приложение отображает список из тысяч элементов, браузер вынужден создать тысячи DOM-узлов одновременно. Это приводит к долгому первоначальному рендеру, тормозам при прокрутке и огромному потреблению памяти.

Виртуализация решает проблему иначе: в DOM присутствуют только элементы, которые видны пользователю прямо сейчас, плюс небольшой буфер. Остальные рендерятся по мере прокрутки и удаляются, когда уходят за пределы видимой области. Список из 100 000 строк при этом работает так же быстро, как список из 20.

**TanStack Virtual** — это headless-библиотека для виртуализации. Она не навязывает разметку или стили — только вычисляет позиции элементов и предоставляет API для их рендера. Это делает её гибкой: подходит для списков, таблиц, сеток и любых кастомных раскладок.

## Установка

```bash
npm install @tanstack/react-virtual
```

Требования: React 16.8+ (используются хуки).

## Вертикальный список с фиксированной высотой элементов

Самый распространённый случай — длинный список, где каждый элемент имеет одинаковую высоту.

```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const items = Array.from({ length: 50000 }, (_, i) => `Элемент ${i + 1}`);

export function FixedList() {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  return (
    <div
      ref={parentRef}
      style={{ height: '600px', overflow: 'auto' }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

Разберём ключевые части:

- `parentRef` — ссылка на скроллируемый контейнер. Virtualizer отслеживает его scroll-позицию.
- `count` — общее количество элементов (не только видимых).
- `getScrollElement` — функция, возвращающая DOM-элемент, на котором происходит прокрутка.
- `estimateSize` — предполагаемая высота одного элемента в пикселях.
- `getTotalSize()` — общая высота всего списка. Нужна для создания фиктивного пространства, чтобы полоса прокрутки отображалась корректно.
- `getVirtualItems()` — массив объектов только для видимых элементов.
- `virtualItem.start` — смещение элемента от начала списка (используется для `translateY`).

## Элементы с динамической высотой

Если высота элементов заранее неизвестна (например, карточки с текстом переменной длины), используется `measureElement`.

```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Post {
  id: number;
  title: string;
  body: string;
}

interface DynamicListProps {
  posts: Post[];
}

export function DynamicList({ posts }: DynamicListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const post = posts[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
                <h3>{post.title}</h3>
                <p>{post.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Ключевые отличия от фиксированного варианта:

- `measureElement` — колбэк, вызываемый при монтировании элемента. Virtualizer получает реальную высоту через `getBoundingClientRect` и пересчитывает позиции.
- `data-index={virtualItem.index}` — обязательный атрибут при использовании `measureElement`. По нему virtualizer находит нужный элемент в DOM.
- `ref={virtualizer.measureElement}` — передаём функцию-ref прямо в JSX для автоматического измерения.

`estimateSize` при динамических размерах используется как начальное приближение до реального измерения. Чем точнее оценка, тем меньше скачков при прокрутке.

## Бесконечная прокрутка

ТанStack Virtual хорошо сочетается с бесконечной подгрузкой данных. Определяем момент, когда пользователь приблизился к концу списка, и запрашиваем следующую порцию.

```tsx
import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface InfiniteListProps {
  items: string[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function InfiniteList({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasNextPage ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= items.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualItems, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const isLoaderRow = virtualItem.index > items.length - 1;
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  {hasNextPage ? 'Загрузка...' : 'Все данные загружены'}
                </div>
              ) : (
                <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
                  {items[virtualItem.index]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Логика работы:

- `count` увеличивается на 1 при наличии следующей страницы — это место для строки-заглушки "Загрузка...".
- `overscan: 5` — количество элементов, рендерящихся за пределами видимой области. Увеличьте это значение, если при быстрой прокрутке видны пустые места.
- В `useEffect` отслеживаем последний видимый элемент. Когда его индекс приближается к концу массива — запрашиваем следующую страницу.

В реальном проекте этот компонент удобно использовать вместе с `useInfiniteQuery` из TanStack Query.

## Горизонтальный список

Виртуализация работает и в горизонтальном направлении — достаточно добавить опцию `horizontal: true`.

```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const ITEMS = Array.from({ length: 1000 }, (_, i) => ({ id: i, label: `Карточка ${i + 1}` }));

export function HorizontalList() {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    horizontal: true,
    count: ITEMS.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    gap: 16,
  });

  return (
    <div
      ref={parentRef}
      style={{ overflow: 'auto', width: '100%' }}
    >
      <div
        style={{
          width: virtualizer.getTotalSize(),
          height: '160px',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${virtualItem.size}px`,
              transform: `translateX(${virtualItem.start}px)`,
            }}
          >
            <div
              style={{
                background: '#f0f4ff',
                borderRadius: '8px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {ITEMS[virtualItem.index].label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Отличия от вертикального варианта:
- `horizontal: true` — переключает направление виртуализации.
- `gap` — расстояние между элементами (учитывается в вычислениях позиций).
- Вместо `translateY` используется `translateX`.
- `getTotalSize()` теперь возвращает ширину, а не высоту.

## Программный скролл к элементу

Virtualizer предоставляет методы для управления прокруткой из кода — полезно для реализации поиска, пагинации с переходом или навигации с клавиатуры.

```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const ITEMS = Array.from({ length: 10000 }, (_, i) => `Запись #${i}`);

export function ScrollToExample() {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: ITEMS.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  const scrollToRandom = () => {
    const index = Math.floor(Math.random() * ITEMS.length);
    virtualizer.scrollToIndex(index, { align: 'center' });
  };

  const scrollToEnd = () => {
    virtualizer.scrollToIndex(ITEMS.length - 1, { align: 'end' });
  };

  return (
    <div>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        <button onClick={scrollToRandom}>Случайный элемент</button>
        <button onClick={scrollToEnd}>В конец</button>
        <button onClick={() => virtualizer.scrollToOffset(0)}>В начало</button>
      </div>
      <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                borderBottom: '1px solid #eee',
              }}
            >
              {ITEMS[virtualItem.index]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Методы управления прокруткой:
- `scrollToIndex(index, options)` — прокрутить к элементу по индексу. Опция `align` принимает значения `start`, `center`, `end`, `auto`.
- `scrollToOffset(offset)` — прокрутить к конкретной позиции в пикселях.

## Частые проблемы и их решения

**Элементы мерцают или перекрываются при прокрутке**

Проверьте, что внешний контейнер имеет `position: relative` или `position: absolute`. Также убедитесь, что все элементы имеют `position: absolute` и используют `transform` для позиционирования.

**Список не заполняет контейнер**

`getTotalSize()` возвращает корректное значение только после первого рендера. Убедитесь, что контейнер-обёртка имеет явно заданный размер (`height` или `width`).

**Динамические элементы не измеряются**

Атрибут `data-index` обязателен при использовании `measureElement`. Без него virtualizer не сможет сопоставить DOM-элемент с его индексом.

**Прокрутка дёргается при загрузке новых данных**

При добавлении элементов в начало списка используйте `scrollToIndex(0)` или управляйте `scrollOffset` вручную, чтобы сохранить позицию просмотра.

## Когда стоит использовать виртуализацию

Виртуализация добавляет сложность, поэтому применяйте её только там, где это оправдано:

- Список содержит более 100–200 элементов одновременно в DOM.
- Измерения производительности (React DevTools Profiler, Lighthouse) показывают проблемы с рендером или памятью.
- Элементы содержат тяжёлые компоненты (изображения, графики, сложная разметка).

Для небольших списков (до 100 элементов) стандартный рендер через `.map()` работает отлично и не требует дополнительных инструментов.

---

Чтобы глубже разобраться с оптимизацией React-приложений и современными паттернами разработки, изучите курс по React на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=tanstack-virtual-virtualization