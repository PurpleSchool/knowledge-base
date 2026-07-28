---
metaTitle: "SEO-оптимизация в Next.js: метаданные, sitemap, JSON-LD"
metaDescription: "Полное руководство по SEO в Next.js: Metadata API, Open Graph, sitemap.xml, robots.txt, JSON-LD и Core Web Vitals с примерами кода."
author: "Антон Ларичев"
title: "SEO-оптимизация в Next.js"
preview: "Как настроить SEO в Next.js с помощью Metadata API, генерации sitemap, структурированных данных и оптимизации Core Web Vitals."
---

## Введение

Next.js предоставляет встроенные инструменты для SEO-оптимизации, которые позволяют управлять метаданными, генерировать sitemap, настраивать структурированные данные и улучшать показатели Core Web Vitals. В этой статье рассмотрим все ключевые подходы на основе App Router.

## Metadata API в App Router

Начиная с Next.js 13, основным способом управления метаданными является `Metadata API`. Вместо компонента `<Head>` из `next/head` теперь используется экспорт объекта `metadata` или функции `generateMetadata` из файлов `layout.tsx` и `page.tsx`.

Метаданные применяются по принципу каскада: данные из вложенных layout и page переопределяют родительские, что позволяет задать базовые метаданные на уровне корневого layout и уточнять их на уровне конкретных страниц.

## Статические метаданные

Для страниц с фиксированным содержимым достаточно экспортировать константу `metadata`:

```typescript
// app/about/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'О компании — PurpleSchool',
  description: 'Узнайте больше о нашей платформе онлайн-обучения для разработчиков.',
  keywords: ['онлайн-курсы', 'программирование', 'TypeScript', 'React'],
  authors: [{ name: 'Антон Ларичев' }],
  robots: {
    index: true,
    follow: true,
  },
}

export default function AboutPage() {
  return <main>...</main>
}
```

На уровне корневого layout задаётся шаблон заголовка, который автоматически применяется ко всем вложенным страницам:

```typescript
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | PurpleSchool',
    default: 'PurpleSchool — обучение программированию',
  },
  description: 'Онлайн-платформа для разработчиков: TypeScript, React, Node.js и другие технологии.',
  metadataBase: new URL('https://purpleschool.ru'),
}
```

Поле `metadataBase` необходимо для корректного формирования абсолютных URL в Open Graph и canonical-тегах.

## Динамические метаданные

Когда содержимое страницы зависит от данных (например, страницы курсов или статей), используется функция `generateMetadata`:

```typescript
// app/courses/[slug]/page.tsx
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await fetchCourse(params.slug)

  if (!course) {
    return {
      title: 'Курс не найден',
    }
  }

  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: [{ url: course.coverImage, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `/courses/${params.slug}`,
    },
  }
}

export default async function CoursePage({ params }: Props) {
  const course = await fetchCourse(params.slug)
  return <main>...</main>
}
```

Next.js автоматически дедублирует запросы: если один и тот же `fetch` вызывается в `generateMetadata` и в компоненте страницы, сетевой запрос выполнится только один раз.

## Open Graph и Twitter Cards

Open Graph управляет внешним видом ссылок в социальных сетях и мессенджерах. Metadata API поддерживает полный набор OG-тегов:

```typescript
export const metadata: Metadata = {
  title: 'Курс по TypeScript',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://purpleschool.ru/course/typescript',
    siteName: 'PurpleSchool',
    title: 'Курс по TypeScript — от основ до продвинутых типов',
    description: 'Научитесь писать строго типизированный код на TypeScript с нуля.',
    images: [
      {
        url: '/og/typescript-course.png',
        width: 1200,
        height: 630,
        alt: 'Курс по TypeScript на PurpleSchool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Курс по TypeScript',
    description: 'Научитесь писать строго типизированный код на TypeScript с нуля.',
    images: ['/og/typescript-course.png'],
  },
}
```

### Динамическая OG-картинка

Next.js позволяет генерировать OG-изображения прямо в рантайме с помощью файла `opengraph-image.tsx`:

```typescript
// app/courses/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }

export default async function OgImage({ params }: { params: { slug: string } }) {
  const course = await fetchCourse(params.slug)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          padding: '60px',
        }}
      >
        <p style={{ color: '#a855f7', fontSize: 28, margin: 0 }}>PurpleSchool</p>
        <h1 style={{ color: '#ffffff', fontSize: 64, margin: '16px 0 0' }}>
          {course.title}
        </h1>
      </div>
    ),
    { ...size },
  )
}
```

## Structured Data (JSON-LD)

Структурированные данные помогают поисковым системам понимать содержимое страницы и показывать расширенные сниппеты в результатах поиска (звёзды рейтинга, цена курса, хлебные крошки и т.д.).

В Next.js JSON-LD внедряется через `<script>` тег непосредственно в компонент:

```typescript
// app/courses/[slug]/page.tsx
interface Course {
  title: string
  description: string
  price: number
  rating: number
  reviewCount: number
  instructor: string
  slug: string
}

function CourseJsonLd({ course }: { course: Course }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'PurpleSchool',
      sameAs: 'https://purpleschool.ru',
    },
    instructor: {
      '@type': 'Person',
      name: course.instructor,
    },
    offers: {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: course.rating,
      reviewCount: course.reviewCount,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await fetchCourse(params.slug)

  return (
    <>
      <CourseJsonLd course={course} />
      <main>...</main>
    </>
  )
}
```

Для хлебных крошек используется тип `BreadcrumbList`:

```typescript
function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

## Sitemap.xml

Next.js поддерживает автоматическую генерацию sitemap через файл `app/sitemap.ts`:

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://purpleschool.ru'

  // Статические страницы
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Динамические страницы курсов
  const courses = await fetchAllCourses()
  const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${baseUrl}/courses/${course.slug}`,
    lastModified: new Date(course.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Страницы базы знаний
  const articles = await fetchAllArticles()
  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/knowledge-base/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...courseRoutes, ...articleRoutes]
}
```

Sitemap будет доступен по адресу `/sitemap.xml` без дополнительной настройки.

Для больших сайтов с тысячами страниц используется разбивка на несколько sitemap-файлов:

```typescript
// app/sitemap/[id]/route.ts
import type { MetadataRoute } from 'next'

const PAGE_SIZE = 5000

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const page = parseInt(params.id)
  const articles = await fetchArticlesPaginated(page, PAGE_SIZE)

  const sitemap: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `https://purpleschool.ru/knowledge-base/${article.slug}`,
    lastModified: new Date(article.updatedAt),
  }))

  // Формируем XML вручную для кастомных нужд
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemap.map((item) => `
  <url>
    <loc>${item.url}</loc>
    <lastmod>${item.lastModified?.toISOString()}</lastmod>
  </url>`).join('')}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
```

## Robots.txt

Аналогично sitemap, файл `robots.txt` генерируется через `app/robots.ts`:

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
    ],
    sitemap: 'https://purpleschool.ru/sitemap.xml',
    host: 'https://purpleschool.ru',
  }
}
```

## Canonical URL

Canonical-тег предотвращает проблему дублированного контента, указывая поисковикам на основную версию страницы. Настраивается через поле `alternates` в метаданных:

```typescript
export const metadata: Metadata = {
  alternates: {
    canonical: '/courses/typescript',
    languages: {
      'ru-RU': '/courses/typescript',
      'en-US': '/en/courses/typescript',
    },
  },
}
```

Next.js автоматически добавит `metadataBase` к относительным путям, поэтому достаточно указывать только путь без домена.

## Оптимизация Core Web Vitals

Core Web Vitals (LCP, FID/INP, CLS) напрямую влияют на ранжирование в Google. Next.js предоставляет несколько инструментов для их улучшения.

### Оптимизация изображений

Компонент `next/image` автоматически оптимизирует изображения: конвертирует в WebP/AVIF, применяет lazy loading и резервирует место в разметке для предотвращения сдвигов (CLS):

```typescript
import Image from 'next/image'

export function CourseCard({ course }: { course: Course }) {
  return (
    <article>
      <Image
        src={course.coverImage}
        alt={course.title}
        width={800}
        height={450}
        // Для изображений в области первого экрана — отключаем lazy loading
        priority={course.isFeatured}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      <h2>{course.title}</h2>
    </article>
  )
}
```

### Оптимизация шрифтов

`next/font` загружает шрифты на этапе сборки, исключая внешние сетевые запросы и устраняя нежелательные смещения при загрузке (CLS):

```typescript
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Настройка заголовков кэширования

Правильные заголовки кэширования для статических ресурсов снижают время загрузки повторных посещений:

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default config
```

## Измерение Web Vitals

Next.js предоставляет хук `useReportWebVitals` для отправки метрик в аналитику:

```typescript
// app/_components/WebVitals.tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Отправка в Google Analytics
    if (typeof window.gtag === 'function') {
      window.gtag('event', metric.name, {
        value: Math.round(
          metric.name === 'CLS' ? metric.value * 1000 : metric.value,
        ),
        event_label: metric.id,
        non_interaction: true,
      })
    }

    // Логирование в консоль во время разработки
    if (process.env.NODE_ENV === 'development') {
      console.log(metric)
    }
  })

  return null
}
```

```typescript
// app/layout.tsx
import { WebVitals } from './_components/WebVitals'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  )
}
```

## Итоговый чеклист

Перед запуском проекта убедитесь, что выполнены следующие условия:

- `metadataBase` задан в корневом layout для корректных абсолютных URL
- Каждая страница имеет уникальный `title` и `description`
- Open Graph изображения имеют размер 1200x630 px
- Файл `sitemap.ts` охватывает все публичные страницы
- `robots.ts` закрывает служебные маршруты (`/api/`, `/admin/`)
- Все изображения используют компонент `next/image` с атрибутом `alt`
- Шрифты подключены через `next/font`, а не через внешние CDN
- JSON-LD добавлен на страницы с курсами, статьями и организацией
- Canonical URL настроен для страниц с возможным дублированием

Полное освоение Next.js, включая продвинутые техники SEO, производительность и деплой — на курсе [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=seo-nextjs).