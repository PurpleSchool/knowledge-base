---
metaTitle: "Next.js i18n интернационализация в App Router (2024)"
metaDescription: "Как настроить интернационализацию i18n в Next.js App Router: структура папок, middleware, переводы, next-intl и SEO с hreflang."
author: "Антон Ларичев"
title: "Интернационализация i18n в Next.js App Router"
preview: "Пошаговое руководство по реализации мультиязычности в Next.js App Router: структура маршрутов, middleware для редиректов, словари переводов и библиотека next-intl."
---

## Что такое i18n и зачем это нужно

Интернационализация (i18n) — это процесс адаптации приложения для разных языков и регионов. В контексте Next.js это означает поддержку нескольких языковых версий сайта с корректными URL, переводами контента и SEO-мета-тегами.

В Pages Router Next.js имел встроенную поддержку i18n через конфигурацию `next.config.js`. В App Router подход кардинально изменился: теперь локаль является частью структуры файловой системы, а не конфигурации роутера. Это даёт больше гибкости, но требует ручной настройки.

## Архитектура i18n в App Router

Основная идея — добавить динамический сегмент `[lang]` в корень дерева маршрутов:

```
app/
  [lang]/
    layout.tsx
    page.tsx
    about/
      page.tsx
    blog/
      [slug]/
        page.tsx
```

Таким образом каждый URL будет содержать код языка:
- `/ru` — русская версия главной страницы
- `/en` — английская версия
- `/ru/about` — страница «О нас» на русском
- `/en/blog/my-post` — пост блога на английском

## Шаг 1. Определяем поддерживаемые локали

Создайте файл конфигурации для хранения допустимых локалей:

```typescript
// lib/i18n/config.ts
export const locales = ['ru', 'en', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ru'
```

Использование `as const` позволяет TypeScript вывести литеральный тип для массива, что обеспечивает строгую типизацию при работе с локалями.

## Шаг 2. Middleware для автоматического определения языка

Middleware перехватывает каждый запрос и перенаправляет пользователя на нужную локаль, если она не указана в URL.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config'

function getPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language')
  if (!acceptLanguage) return defaultLocale

  const preferred = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim().slice(0, 2))
    .find((lang) => locales.includes(lang as Locale))

  return (preferred as Locale) ?? defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Пропускаем статику и API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Проверяем, есть ли уже локаль в пути
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!pathnameHasLocale) {
    const locale = getPreferredLocale(request)
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

Middleware определяет предпочтительный язык из заголовка `Accept-Language` браузера и перенаправляет пользователя, если локаль ещё не указана в URL.

## Шаг 3. Корневой layout с параметром lang

```typescript
// app/[lang]/layout.tsx
import { type Locale, locales } from '@/lib/i18n/config'

interface RootLayoutProps {
  children: React.ReactNode
  params: { lang: Locale }
}

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default function RootLayout({ children, params }: RootLayoutProps) {
  return (
    <html lang={params.lang}>
      <body>{children}</body>
    </html>
  )
}
```

`generateStaticParams` сообщает Next.js, какие значения параметра `lang` нужно предварительно рендерить при сборке. Атрибут `lang` на элементе `<html>` важен для доступности и поисковых роботов.

## Шаг 4. Словари переводов

Словарь — это простые JSON-файлы с переводами для каждого языка:

```json
// lib/i18n/dictionaries/ru.json
{
  "nav": {
    "home": "Главная",
    "about": "О нас",
    "blog": "Блог",
    "contacts": "Контакты"
  },
  "home": {
    "hero": {
      "title": "Добро пожаловать",
      "subtitle": "Изучайте программирование с нуля до профессионального уровня",
      "cta": "Начать обучение"
    }
  },
  "common": {
    "loading": "Загрузка...",
    "error": "Произошла ошибка"
  }
}
```

```json
// lib/i18n/dictionaries/en.json
{
  "nav": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "contacts": "Contacts"
  },
  "home": {
    "hero": {
      "title": "Welcome",
      "subtitle": "Learn programming from scratch to professional level",
      "cta": "Start learning"
    }
  },
  "common": {
    "loading": "Loading...",
    "error": "An error occurred"
  }
}
```

Создайте функцию для динамической загрузки словаря:

```typescript
// lib/i18n/dictionaries.ts
import type { Locale } from './config'

const dictionaries = {
  ru: () => import('./dictionaries/ru.json').then((m) => m.default),
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  de: () => import('./dictionaries/de.json').then((m) => m.default),
}

export type Dictionary = Awaited<ReturnType<typeof dictionaries.ru>>

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]()
}
```

Динамический импорт (`import()`) гарантирует, что словарь нужного языка будет загружен отдельным чанком, а не попадёт в основной бандл.

## Шаг 5. Использование переводов в Server Components

В Server Components словарь загружается напрямую:

```typescript
// app/[lang]/page.tsx
import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

interface HomePageProps {
  params: { lang: Locale }
}

export default async function HomePage({ params }: HomePageProps) {
  const dict = await getDictionary(params.lang)

  return (
    <main>
      <section>
        <h1>{dict.home.hero.title}</h1>
        <p>{dict.home.hero.subtitle}</p>
        <a href={`/${params.lang}/courses`}>{dict.home.hero.cta}</a>
      </section>
    </main>
  )
}
```

## Шаг 6. Переводы в Client Components

Для Client Components нельзя напрямую вызывать `getDictionary` (это асинхронная функция серверной стороны). Вместо этого передавайте переводы через пропсы или Context API.

### Через пропсы (рекомендуется для простых случаев)

```typescript
// components/HeroSection.tsx
'use client'

import type { Dictionary } from '@/lib/i18n/dictionaries'

interface HeroSectionProps {
  dict: Dictionary['home']['hero']
  lang: string
}

export function HeroSection({ dict, lang }: HeroSectionProps) {
  return (
    <section>
      <h1>{dict.title}</h1>
      <p>{dict.subtitle}</p>
      <button onClick={() => console.log('start')}>{dict.cta}</button>
    </section>
  )
}
```

```typescript
// app/[lang]/page.tsx
import { HeroSection } from '@/components/HeroSection'
import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

export default async function HomePage({ params }: { params: { lang: Locale } }) {
  const dict = await getDictionary(params.lang)
  return <HeroSection dict={dict.home.hero} lang={params.lang} />
}
```

### Через Context API (для глубоко вложенных компонентов)

```typescript
// lib/i18n/DictionaryProvider.tsx
'use client'

import { createContext, useContext } from 'react'
import type { Dictionary } from './dictionaries'

const DictionaryContext = createContext<Dictionary | null>(null)

export function DictionaryProvider({
  children,
  dictionary,
}: {
  children: React.ReactNode
  dictionary: Dictionary
}) {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  )
}

export function useDictionary(): Dictionary {
  const context = useContext(DictionaryContext)
  if (!context) throw new Error('useDictionary must be used within DictionaryProvider')
  return context
}
```

```typescript
// app/[lang]/layout.tsx
import { DictionaryProvider } from '@/lib/i18n/DictionaryProvider'
import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: Locale }
}) {
  const dict = await getDictionary(params.lang)
  return (
    <html lang={params.lang}>
      <body>
        <DictionaryProvider dictionary={dict}>
          {children}
        </DictionaryProvider>
      </body>
    </html>
  )
}
```

## Шаг 7. Переключатель языков

```typescript
// components/LanguageSwitcher.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/lib/i18n/config'

const languageNames: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  de: 'Deutsch',
}

export function LanguageSwitcher({ currentLang }: { currentLang: Locale }) {
  const pathname = usePathname()
  const router = useRouter()

  function switchLanguage(newLang: Locale) {
    // Заменяем текущую локаль на новую в пути
    const segments = pathname.split('/')
    segments[1] = newLang
    router.push(segments.join('/'))
  }

  return (
    <nav>
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLanguage(locale)}
          disabled={locale === currentLang}
          aria-current={locale === currentLang ? 'true' : undefined}
        >
          {languageNames[locale]}
        </button>
      ))}
    </nav>
  )
}
```

## SEO: alternate и hreflang

Для корректной индексации поисковыми системами необходимо добавлять мета-теги `hreflang`. В App Router это делается через функцию `generateMetadata`:

```typescript
// app/[lang]/page.tsx
import type { Metadata } from 'next'
import { locales, type Locale } from '@/lib/i18n/config'

const baseUrl = 'https://example.com'

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const alternates: Record<string, string> = {}
  for (const locale of locales) {
    alternates[locale] = `${baseUrl}/${locale}`
  }

  return {
    alternates: {
      canonical: `${baseUrl}/${params.lang}`,
      languages: alternates,
    },
  }
}
```

Next.js автоматически преобразует объект `languages` в теги `<link rel="alternate" hreflang="...">` в `<head>` страницы.

## Использование библиотеки next-intl

Для сложных проектов рекомендуется использовать библиотеку `next-intl`, которая предоставляет дополнительные возможности: форматирование дат, чисел, плюральные формы.

```bash
npm install next-intl
```

```typescript
// i18n.ts (в корне проекта)
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./lib/i18n/dictionaries/${locale}.json`)).default,
}))
```

```typescript
// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

export default withNextIntl({
  // остальная конфигурация Next.js
})
```

После настройки переводы доступны через хук `useTranslations` в Client Components и `getTranslations` в Server Components:

```typescript
// Server Component
import { getTranslations } from 'next-intl/server'

export default async function AboutPage() {
  const t = await getTranslations('about')
  return <h1>{t('title')}</h1>
}
```

```typescript
// Client Component
'use client'
import { useTranslations } from 'next-intl'

export function NavMenu() {
  const t = useTranslations('nav')
  return (
    <nav>
      <a href="/">{t('home')}</a>
      <a href="/about">{t('about')}</a>
    </nav>
  )
}
```

`next-intl` также поддерживает ICU-синтаксис для плюральных форм и интерполяции:

```json
{
  "items": "{count, plural, one {# товар} few {# товара} many {# товаров} other {# товара}}",
  "greeting": "Привет, {name}!"
}
```

```typescript
t('items', { count: 5 }) // «5 товаров»
t('greeting', { name: 'Антон' }) // «Привет, Антон!»
```

## Типизация словаря

Для автодополнения и защиты от опечаток в ключах переводов создайте типы на основе словаря:

```typescript
// lib/i18n/types.ts
import type ruDictionary from './dictionaries/ru.json'

export type Dictionary = typeof ruDictionary

type PathsToStringProps<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: PathsToStringProps<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K}`>
    }[keyof T & string]

export type TranslationKey = PathsToStringProps<Dictionary>
```

Этот тип позволит TypeScript подсказывать допустимые ключи вида `'nav.home'`, `'home.hero.title'` и выдавать ошибку при несуществующих ключах.

## Распространённые ошибки

**Забыть про `generateStaticParams`.** Без этой функции все языковые версии будут рендериться только на сервере по запросу. Добавьте её во все layouts и pages для статической генерации.

**Хранить локаль в State вместо URL.** Локаль должна быть частью URL — это критично для SEO и для работы кнопки «Назад» в браузере.

**Не передавать `lang` в Client Components.** Серверный параметр `params.lang` недоступен в Client Components без явной передачи через пропсы или Context.

**Отсутствие fallback для неизвестных локалей.** Middleware должен обрабатывать случай, когда в URL передана неизвестная локаль, и перенаправлять на локаль по умолчанию.

## Итоги

Интернационализация в Next.js App Router строится на трёх столпах: структура маршрутов с `[lang]`-сегментом, middleware для автоматического определения языка и словари переводов. Для небольших проектов достаточно встроенного подхода с JSON-словарями. Для сложных проектов с форматированием дат и плюральными формами используйте `next-intl`.

Главное преимущество App Router перед Pages Router — каждая языковая версия является полноценным маршрутом, что даёт полный контроль над кэшированием, мета-тегами и статической генерацией на уровне каждой страницы.

Чтобы глубже освоить Next.js App Router и построение полноценных приложений, изучите курс на PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=i18n-app-router