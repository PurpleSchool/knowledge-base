---
metaTitle: "Оптимизация Core Web Vitals в Next.js — LCP, INP, CLS"
metaDescription: "Как улучшить Core Web Vitals в Next.js: оптимизация LCP, INP и CLS с практическими примерами кода и инструментами измерения."
author: "Антон Ларичев"
title: "Оптимизация Core Web Vitals в Next.js"
preview: "Разбираем каждый из показателей Core Web Vitals и конкретные инструменты Next.js для их улучшения: Image, Font, Script, Server Components, Suspense."
---

## Что такое Core Web Vitals и почему они важны

Core Web Vitals — набор метрик, которые Google использует для оценки пользовательского опыта. Они влияют на позиции сайта в поисковой выдаче и напрямую отражают, насколько комфортно людям пользоваться приложением.

На сегодняшний день в Core Web Vitals входят три показателя:

- **LCP (Largest Contentful Paint)** — время до отрисовки самого крупного видимого элемента. Хорошее значение: до 2.5 секунды.
- **INP (Interaction to Next Paint)** — задержка между действием пользователя и следующей отрисовкой. Хорошее значение: до 200 мс.
- **CLS (Cumulative Layout Shift)** — суммарный сдвиг элементов при загрузке страницы. Хорошее значение: до 0.1.

Next.js предоставляет встроенные инструменты для улучшения каждого из этих показателей. Разберём их последовательно.

---

## LCP: ускоряем загрузку главного контента

### Оптимизация изображений через компонент Image

Компонент `next/image` автоматически применяет ряд оптимизаций: конвертирует изображения в WebP/AVIF, добавляет lazy loading, задаёт правильные размеры через `srcset`. Для LCP-элемента (обычно это hero-изображение) нужно отключить отложенную загрузку и добавить `fetchpriority`.

```tsx
import Image from 'next/image';

export default function HeroBanner() {
  return (
    <Image
      src="/hero.jpg"
      alt="Главный баннер"
      width={1200}
      height={600}
      priority
      sizes="(max-width: 768px) 100vw, 1200px"
    />
  );
}
```

Проп `priority` добавляет `fetchpriority="high"` и `preload`-тег в `<head>`, сигнализируя браузеру загрузить изображение как можно раньше. Используйте его только для изображений в первом экране — для остальных достаточно дефолтного lazy loading.

Атрибут `sizes` помогает браузеру выбрать оптимальный вариант из `srcset`, не загружая лишнее. Чем точнее описаны размеры под разные брейкпоинты, тем меньше трафика.

### Предзагрузка шрифтов

Пользовательские шрифты — частая причина плохого LCP. Если шрифт не загрузился, текст либо не показывается (`font-display: block`), либо отображается запасным начертанием с последующим перескоком (`font-display: swap`). Компонент `next/font` решает обе проблемы: он скачивает шрифт на этапе сборки и встраивает его как локальный ресурс.

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  preload: true,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

При таком подходе шрифт отдаётся с того же домена, что и приложение, без внешних DNS-запросов. Браузер получает `preload`-заголовок автоматически.

### Server Components и потоковый рендеринг

Чем раньше браузер получает HTML с реальным контентом, тем лучше LCP. Server Components в App Router позволяют рендерить тяжёлые части страницы на сервере, не гоняя данные через клиент.

```tsx
// app/products/page.tsx
async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 60 },
  });
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

Для страниц с несколькими независимыми источниками данных используйте `Suspense`, чтобы не блокировать отрисовку быстрых секций медленными запросами.

```tsx
import { Suspense } from 'react';
import ProductList from './ProductList';
import RecommendationsSkeleton from './RecommendationsSkeleton';
import Recommendations from './Recommendations';

export default function Page() {
  return (
    <main>
      <ProductList />
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </main>
  );
}
```

Next.js стримит HTML по мере готовности каждой части. Пользователь видит основной контент раньше, чем завершатся все запросы.

---

## INP: снижаем задержку реакции на действия

### Сокращение клиентского JavaScript

INP страдает, когда главный поток занят выполнением JS в момент, когда пользователь нажал кнопку или ввёл текст. Первый шаг — сократить объём клиентского кода.

Проанализируйте бандл встроенным инструментом:

```bash
npx @next/bundle-analyzer
```

Добавьте в `next.config.js`:

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({});
```

Запустите анализ:

```bash
ANALYZE=true npm run build
```

Откроется интерактивная карта бандла. Ищите крупные зависимости, которые можно заменить более лёгкими аналогами или перенести на сервер.

### Динамический импорт тяжёлых компонентов

Компоненты, которые не нужны при первой загрузке, загружайте лениво.

```tsx
import dynamic from 'next/dynamic';

const HeavyEditor = dynamic(() => import('./HeavyEditor'), {
  loading: () => <p>Загрузка редактора...</p>,
  ssr: false,
});

export default function Page() {
  const [editorOpen, setEditorOpen] = React.useState(false);

  return (
    <div>
      <button onClick={() => setEditorOpen(true)}>Открыть редактор</button>
      {editorOpen && <HeavyEditor />}
    </div>
  );
}
```

`ssr: false` исключает компонент из серверного рендеринга — полезно для библиотек, которые работают только в браузере (редакторы, графики, карты).

### Оптимизация обработчиков событий

Долгие вычисления в обработчиках напрямую ухудшают INP. Тяжёлую синхронную работу разбивайте на части через `scheduler.yield()` или `setTimeout`.

```tsx
async function handleSearch(query: string) {
  const results = [];

  for (let i = 0; i < largeDataset.length; i++) {
    results.push(filterItem(largeDataset[i], query));

    // Отдаём управление браузеру каждые 50 итераций
    if (i % 50 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  setResults(results);
}
```

Для React 18+ используйте `useTransition`, чтобы пометить обновление состояния как некритичное и не блокировать пользовательский ввод.

```tsx
import { useTransition, useState } from 'react';

export default function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);

    startTransition(() => {
      setResults(filterData(value));
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <ResultList items={results} />}
    </>
  );
}
```

### Управление загрузкой сторонних скриптов

Сторонние скрипты (аналитика, чаты, пиксели) блокируют главный поток. Компонент `next/script` позволяет контролировать момент их загрузки.

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}

        {/* Загружается после hydration страницы */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"
          strategy="afterInteractive"
        />

        {/* Загружается в idle-время браузера */}
        <Script
          src="https://widget.intercom.io/widget/xxxx"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

Доступные стратегии:
- `beforeInteractive` — до hydration, для критичных скриптов (согласие с куки).
- `afterInteractive` — после hydration, для аналитики.
- `lazyOnload` — в idle-время, для виджетов и чатов.

---

## CLS: устраняем сдвиги макета

### Резервируем место для изображений

Если у изображения не заданы размеры, браузер не знает, сколько места выделить до загрузки, и сдвигает контент, когда картинка появляется. Компонент `next/image` требует явных `width` и `height` — это решает проблему автоматически.

Для адаптивных изображений, которые должны занимать всю ширину контейнера, используйте `fill` вместе с CSS-контейнером:

```tsx
import Image from 'next/image';

export function ArticleCover({ src }: { src: string }) {
  return (
    <div style={{ position: 'relative', aspectRatio: '16 / 9' }}>
      <Image
        src={src}
        alt="Обложка статьи"
        fill
        style={{ objectFit: 'cover' }}
        sizes="(max-width: 768px) 100vw, 800px"
      />
    </div>
  );
}
```

Контейнер с `aspect-ratio` задаёт нужную высоту до загрузки изображения — сдвига макета не происходит.

### Скелетоны для динамического контента

Контент, который подгружается асинхронно, часто становится причиной CLS. Если после монтажа компонент получает данные и меняет высоту — страница прыгает. Используйте скелетоны с фиксированными размерами.

```tsx
function ProductCardSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        height: 280,
        background: '#f0f0f0',
        borderRadius: 8,
      }}
    />
  );
}

export default function ProductSection() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <ProductGrid />
    </Suspense>
  );
}
```

Скелетон должен максимально точно воспроизводить геометрию реального контента — иначе при замене всё равно возникнет сдвиг.

### Стабилизация шрифтов

Даже с `font-display: swap` возможен небольшой сдвиг при замене запасного шрифта на загруженный. `next/font` решает эту проблему через CSS-переменные с автоматической корректировкой размеров запасного шрифта.

```tsx
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  adjustFontFallback: true, // включено по умолчанию
});
```

Next.js вычисляет `size-adjust`, `ascent-override`, `descent-override` для максимально близкого совпадения запасного шрифта с целевым — визуальный сдвиг при замене становится минимальным.

---

## Инструменты измерения

### Встроенный Speed Insights

Next.js поддерживает интеграцию с Vercel Speed Insights. Для самостоятельного измерения используйте `web-vitals`:

```tsx
// app/layout.tsx
import { WebVitals } from './web-vitals';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <WebVitals />
      </body>
    </html>
  );
}
```

```tsx
// app/web-vitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric.name, metric.value);

    // Отправка в собственную аналитику
    fetch('/api/vitals', {
      method: 'POST',
      body: JSON.stringify(metric),
    });
  });

  return null;
}
```

Хук `useReportWebVitals` отдаёт все Core Web Vitals плюс дополнительные метрики Next.js: `Next.js-hydration`, `Next.js-route-change-to-render`, `Next.js-render`.

### Lighthouse и PageSpeed Insights

Для локального тестирования запускайте Lighthouse в режиме production-сборки — режим разработки даёт ложные результаты:

```bash
npm run build && npm start
# В другом терминале:
npx lighthouse http://localhost:3000 --view
```

PageSpeed Insights (pagespeed.web.dev) показывает реальные данные из Chrome User Experience Report — это то, что видит Google при ранжировании.

---

## Практический чеклист

Перед деплоем проверьте следующее.

**LCP:**
- Главное изображение использует `priority` в `next/image`.
- Шрифты подключены через `next/font`.
- Страница рендерится на сервере, тяжёлые данные не ждут клиентского JS.

**INP:**
- Бандл проанализирован, тяжёлые зависимости разбиты через `dynamic()`.
- Сторонние скрипты используют `strategy="afterInteractive"` или `strategy="lazyOnload"`.
- Дорогие вычисления вынесены из синхронных обработчиков.

**CLS:**
- У всех `<Image>` заданы размеры или используется `fill` с CSS-контейнером.
- Для асинхронного контента подготовлены скелетоны совпадающей геометрии.
- Шрифты подключены через `next/font` с `adjustFontFallback`.

---

Освоить Next.js глубже и научиться строить производительные приложения с нуля можно на курсе [Next.js от PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=core-web-vitals).