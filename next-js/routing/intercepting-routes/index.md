---
metaTitle: "Intercepting Routes в Next.js — перехват маршрутов"
metaDescription: "Intercepting Routes в Next.js: синтаксис (.)(..)(…), модальные окна с сохранением URL, комбинирование с Parallel Routes. Примеры кода."
author: "Антон Ларичев"
title: "Перехват маршрутов (Intercepting Routes) в Next.js"
preview: "Intercepting Routes позволяют отображать контент другого маршрута без полной навигации — идеально для модальных окон с сохранением URL."
---

## Что такое Intercepting Routes

Intercepting Routes (перехват маршрутов) — механизм Next.js App Router, позволяющий загрузить содержимое одного маршрута внутри текущего layout, не выполняя полный переход. При этом URL в адресной строке меняется, но пользователь визуально остаётся в контексте предыдущей страницы.

Классический пример — галерея изображений: клик по фотографии открывает её в модальном окне поверх ленты, а URL обновляется до `/photos/42`. При прямом переходе на `/photos/42` или обновлении страницы пользователь видит полноценную страницу фотографии без модального окна.

Это решает давнюю проблему: либо URL не отражает состояние UI, либо пользователь полностью покидает текущую страницу.

## Синтаксис именования папок

Пеrehват задаётся специальным префиксом в имени папки. Префикс определяет, относительно какого сегмента пути происходит перехват:

| Префикс | Перехватывает сегменты |
|---------|----------------------|
| `(.)` | того же уровня |
| `(..)` | на один уровень выше |
| `(..)(..)` | на два уровня выше |
| `(...)` | от корня `app/` |

Префикс относится к **файловой системе маршрутизатора**, а не к URL-сегментам. Это важно: группы маршрутов `(folder)`, route groups без сегмента URL, не учитываются при подсчёте уровней.

### Пример структуры с `(..)`

```
app/
├── feed/
│   ├── page.tsx          # /feed
│   └── (..)photos/
│       └── [id]/
│           └── page.tsx  # перехватывает /photos/[id] из /feed
├── photos/
│   └── [id]/
│       └── page.tsx      # /photos/[id] — обычный маршрут
```

Папка `(..)photos` находится внутри `feed/`, то есть на один уровень ниже `app/`. Префикс `(..)` поднимает её на уровень выше — до `app/` — и перехватывает сегмент `photos`.

## Практический пример: фотогалерея с модальным окном

### Структура файлов

```
app/
├── @modal/
│   ├── (.)photos/
│   │   └── [id]/
│   │       └── page.tsx
│   └── default.tsx
├── photos/
│   └── [id]/
│       └── page.tsx
├── layout.tsx
└── page.tsx
```

Здесь задействованы Parallel Routes (`@modal`) совместно с Intercepting Routes. Рассмотрим каждый файл.

### `app/layout.tsx` — корневой layout с параллельным слотом

```tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
```

Слот `modal` будет рендериться рядом с основным контентом.

### `app/page.tsx` — лента с фотографиями

```tsx
import Link from 'next/link';

const photos = [
  { id: '1', src: '/img/photo-1.jpg', alt: 'Горы' },
  { id: '2', src: '/img/photo-2.jpg', alt: 'Море' },
  { id: '3', src: '/img/photo-3.jpg', alt: 'Лес' },
];

export default function GalleryPage() {
  return (
    <main>
      <h1>Галерея</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {photos.map((photo) => (
          <Link key={photo.id} href={`/photos/${photo.id}`}>
            <img src={photo.src} alt={photo.alt} style={{ width: '100%' }} />
          </Link>
        ))}
      </div>
    </main>
  );
}
```

### `app/photos/[id]/page.tsx` — полная страница фотографии

Эта страница показывается при прямом переходе или обновлении:

```tsx
interface Props {
  params: { id: string };
}

export default function PhotoPage({ params }: Props) {
  return (
    <div>
      <h1>Фотография #{params.id}</h1>
      <img
        src={`/img/photo-${params.id}.jpg`}
        alt={`Фото ${params.id}`}
        style={{ maxWidth: '100%' }}
      />
    </div>
  );
}
```

### `app/@modal/(.)photos/[id]/page.tsx` — перехваченный маршрут (модальное окно)

Папка `(.)photos` перехватывает сегмент `photos` на том же уровне относительно `@modal`:

```tsx
'use client';

import { useRouter } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default function PhotoModal({ params }: Props) {
  const router = useRouter();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={() => router.back()}
    >
      <div
        style={{ background: '#fff', padding: 24, borderRadius: 8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={`/img/photo-${params.id}.jpg`}
          alt={`Фото ${params.id}`}
          style={{ maxWidth: 600 }}
        />
        <p>Фотография #{params.id}</p>
      </div>
    </div>
  );
}
```

Клик по затемнённому фону вызывает `router.back()` — это закрывает модальное окно и возвращает пользователя в галерею.

### `app/@modal/default.tsx` — заглушка для слота

Когда модальное окно не активно, слот должен рендерить `null`:

```tsx
export default function DefaultModal() {
  return null;
}
```

Без этого файла Next.js выдаст ошибку при навигации, когда параллельный слот не имеет активного маршрута.

## Как это работает изнутри

### Навигация через `<Link>`

Когда пользователь кликает по ссылке `/photos/1` со страницы галереи:

1. Next.js находит `app/@modal/(.)photos/[id]/page.tsx` и определяет его как перехватчик.
2. В слот `@modal` загружается компонент модального окна.
3. В слот `children` остаётся страница галереи.
4. URL меняется на `/photos/1`.

### Прямой переход или обновление страницы

Когда пользователь открывает `/photos/1` напрямую или нажимает F5:

1. Перехват не срабатывает — нет предыдущего контекста навигации.
2. Next.js загружает `app/photos/[id]/page.tsx` как обычный маршрут.
3. Слот `@modal` рендерит `default.tsx` (возвращает `null`).

### Возврат назад (`router.back()`)

1. URL возвращается к `/`.
2. Слот `@modal` снова рендерит `default.tsx`.
3. Галерея остаётся в `children` без перезагрузки.

## Уровни перехвата: разбор `(..)` и `(...)`

### Перехват через два сегмента `(..)(..)`

```
app/
├── dashboard/
│   └── settings/
│       ├── page.tsx
│       └── (..)(..)photos/
│           └── [id]/
│               └── page.tsx  # перехватывает /photos/[id]
├── photos/
│   └── [id]/
│       └── page.tsx
```

Папка `(..)(..)photos` находится на уровне `dashboard/settings/`. Каждый `(..)` поднимает на уровень: сначала до `dashboard/`, затем до `app/`. После подъёма идёт перехват сегмента `photos`.

### Перехват от корня `(...)`

```
app/
├── (shop)/
│   └── cart/
│       └── (...)photos/
│           └── [id]/
│               └── page.tsx  # перехватывает /photos/[id] от корня app/
├── photos/
│   └── [id]/
│       └── page.tsx
```

Три точки `(...)` означают перехват относительно корня `app/` независимо от текущей вложенности. Route group `(shop)` не учитывается в уровнях — он не добавляет сегмент URL.

## Типичные сценарии применения

### Модальное окно для создания записи

Пользователь находится на `/dashboard/tasks`. Клик на кнопку «Создать задачу» открывает форму в модальном окне, URL становится `/dashboard/tasks/new`. При обновлении страницы открывается полноценная страница создания задачи.

```
app/
├── dashboard/
│   ├── @modal/
│   │   ├── (.)tasks/
│   │   │   └── new/
│   │   │       └── page.tsx  # модальная форма
│   │   └── default.tsx
│   ├── tasks/
│   │   ├── page.tsx          # список задач
│   │   └── new/
│   │       └── page.tsx      # полная страница создания
│   └── layout.tsx
```

### Предпросмотр товара в каталоге

Клик по карточке товара в каталоге `/shop` показывает быстрый просмотр с ценой и кнопкой покупки, не покидая каталог. URL обновляется до `/shop/products/123`.

### Логин-форма поверх текущей страницы

Пользователь на любой странице кликает «Войти». Открывается модальное окно авторизации, URL становится `/login`. При обновлении страницы — полноценная страница входа.

## Частые ошибки и как их избежать

### Ошибка: неверный уровень перехвата

Если перехват не срабатывает и показывается обычная страница вместо модального окна, проверьте уровень. Нарисуйте дерево файловой системы и посчитайте, сколько уровней нужно подняться от папки с перехватчиком до папки с целевым сегментом.

```
# Неверно: папка (.)photos находится на два уровня выше photos/
app/
├── @modal/
│   └── nested/
│       └── (.)photos/  # (.) перехватывает только на том же уровне

# Верно:
app/
├── @modal/
│   └── nested/
│       └── (..)photos/  # (..) поднимается на уровень выше
```

### Ошибка: отсутствует `default.tsx`

Без файла `default.tsx` в параллельном слоте Next.js не знает, что рендерить когда слот не активен. Это приводит к ошибке `No default export found`.

```tsx
// app/@modal/default.tsx — обязателен
export default function Default() {
  return null;
}
```

### Ошибка: использование `router.push` вместо `router.back`

Для закрытия модального окна нужно именно `router.back()`, а не `router.push('/')`. Push создаёт новую запись в истории браузера, back — возвращает к предыдущему состоянию и корректно убирает модальное окно.

### Ошибка: отсутствует `stopPropagation` на контенте модального окна

Если клик по контенту внутри модального окна закрывает его, добавьте `e.stopPropagation()` на обёртку контента, чтобы клик не всплывал до оверлея.

## Сочетание с другими возможностями App Router

### Загрузка данных через Server Components

Компонент перехваченного маршрута может быть Server Component и получать данные напрямую:

```tsx
// app/@modal/(.)photos/[id]/page.tsx
async function getPhoto(id: string) {
  const res = await fetch(`https://api.example.com/photos/${id}`, {
    next: { revalidate: 60 },
  });
  return res.json();
}

export default async function PhotoModal({ params }: { params: { id: string } }) {
  const photo = await getPhoto(params.id);

  return (
    <ModalWrapper>
      <img src={photo.url} alt={photo.title} />
      <h2>{photo.title}</h2>
    </ModalWrapper>
  );
}
```

### Loading UI для модального окна

Добавьте `loading.tsx` рядом с перехватчиком для Suspense-границы:

```tsx
// app/@modal/(.)photos/[id]/loading.tsx
export default function ModalLoading() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)' }}>
      <p style={{ color: '#fff', textAlign: 'center', marginTop: '40vh' }}>
        Загрузка...
      </p>
    </div>
  );
}
```

### Метаданные

Добавьте `generateMetadata` в перехваченный маршрут — браузер обновит заголовок вкладки, что улучшает доступность и SEO для прямых переходов:

```tsx
export async function generateMetadata({ params }: Props) {
  const photo = await getPhoto(params.id);
  return { title: photo.title };
}
```

## Отличия от обычных модальных окон через состояние

| Критерий | useState/context | Intercepting Routes |
|----------|-----------------|---------------------|
| URL отражает состояние | Нет | Да |
| Работает при обновлении | Нет | Да |
| Можно поделиться ссылкой | Нет | Да |
| Кнопка «Назад» работает | Нет | Да |
| SEO для полной страницы | Нет | Да |
| Сложность настройки | Низкая | Средняя |

Intercepting Routes — правильный выбор, когда контент в модальном окне имеет собственный URL и должен быть доступен напрямую.

## Итог

Intercepting Routes решают задачу, с которой сталкиваются все SPA-приложения: отобразить вложенный контент поверх текущей страницы с корректным URL. Механизм основан на соглашении об именовании папок `(.)`, `(..)`, `(..)(..)` и `(...)` и наиболее мощен в сочетании с Parallel Routes.

Основные моменты для запоминания:
- Префикс задаётся относительно файловой системы, не URL-сегментов.
- Route Groups не учитываются при подсчёте уровней.
- Всегда нужен `default.tsx` в параллельном слоте.
- Для закрытия модального окна используйте `router.back()`.

Подробнее о маршрутизации и других возможностях Next.js App Router — на курсе [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=intercepting-routes).