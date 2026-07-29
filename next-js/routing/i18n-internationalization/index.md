---
metaTitle: "Интернационализация i18n в Next.js — полное руководство"
metaDescription: "Как настроить i18n в Next.js App Router: middleware, словари переводов, переключение языков и SEO для мультиязычных приложений."
author: "Антон Ларичев"
title: "Интернационализация (i18n) в Next.js"
preview: "Пошаговое руководство по настройке мультиязычности в Next.js: структура папок, middleware, словари и переключение локалей."
---

## Что такое i18n и зачем это нужно

Интернационализация (i18n — сокращение от «internationalization», где 18 — количество букв между «i» и «n») — это процесс проектирования приложения таким образом, чтобы оно могло адаптироваться к разным языкам и регионам без изменения исходного кода.

Для веб-приложений i18n включает:

- отображение текстов на языке пользователя;
- форматирование дат, чисел и валют по региональным стандартам;
- правильную маршрутизацию с учётом локали (например, `/ru/about` и `/en/about`);
- SEO-оптимизацию для каждого языка через `hreflang`.

Next.js предоставляет встроенную поддержку i18n через App Router, которая основана на сегменте `[locale]` в структуре папок и middleware для автоматического определения языка пользователя.

## Структура проекта для мультиязычного приложения

В App Router подход к i18n строится на вложении всех страниц в динамический сегмент `[locale]`:

```
app/
  [locale]/
    layout.tsx
    page.tsx
    about/
      page.tsx
    blog/
      [slug]/
        page.tsx
middleware.ts
dictionaries/
  ru.json
  en.json
```

Каждая страница получает доступ к текущей локали через параметр `params.locale`, а middleware перехватывает запросы и перенаправляет пользователя на нужную версию.

## Настройка middleware

Middleware — ключевой компонент i18n-системы. Он определяет предпочтительный язык пользователя из заголовка `Accept-Language` и редиректит на корректный URL.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['ru', 'en'] as const;
const DEFAULT_LOCALE = 'ru';

type Locale = typeof LOCALES[number];

function getLocaleFromRequest(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('Accept-Language');
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferred = acceptLanguage
    .split(',')
    .map((lang) => lang.split(';')[0].trim().slice(0, 2))
    .find((lang) => LOCALES.includes(lang as Locale));

  return (preferred as Locale) ?? DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Пропускаем статические файлы и API-роуты
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Проверяем, есть ли уже локаль в пути
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Редиректим на путь с локалью
  const locale = getLocaleFromRequest(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

Middleware проверяет каждый входящий запрос: если в URL уже есть префикс локали — пропускает его, если нет — определяет язык из заголовков браузера и выполняет редирект.

## Создание словарей переводов

Словари — это JSON-файлы, которые хранят переведённые строки для каждого языка:

```json
// dictionaries/ru.json
{
  "common": {
    "home": "Главная",
    "about": "О нас",
    "contact": "Контакты",
    "loading": "Загрузка..."
  },
  "home": {
    "title": "Добро пожаловать",
    "description": "Это мультиязычное приложение на Next.js",
    "cta": "Начать работу"
  },
  "blog": {
    "title": "Блог",
    "readMore": "Читать далее",
    "postedOn": "Опубликовано"
  }
}
```

```json
// dictionaries/en.json
{
  "common": {
    "home": "Home",
    "about": "About",
    "contact": "Contact",
    "loading": "Loading..."
  },
  "home": {
    "title": "Welcome",
    "description": "This is a multilingual Next.js application",
    "cta": "Get started"
  },
  "blog": {
    "title": "Blog",
    "readMore": "Read more",
    "postedOn": "Posted on"
  }
}
```

### Утилита для загрузки словаря

Чтобы не дублировать логику загрузки, создаём вспомогательную функцию:

```typescript
// lib/dictionaries.ts
import type { Locale } from './types';

const dictionaries = {
  ru: () => import('../dictionaries/ru.json').then((m) => m.default),
  en: () => import('../dictionaries/en.json').then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  const loader = dictionaries[locale];
  if (!loader) {
    throw new Error(`Dictionary not found for locale: ${locale}`);
  }
  return loader();
}
```

```typescript
// lib/types.ts
export type Locale = 'ru' | 'en';
export const LOCALES: Locale[] = ['ru', 'en'];
export const DEFAULT_LOCALE: Locale = 'ru';
```

Динамический `import()` позволяет Next.js подгружать только нужный языковой файл, не увеличивая бандл без необходимости.

## Layout с поддержкой локали

Корневой layout для `[locale]` устанавливает атрибут `lang` на теге `<html>` и передаёт словарь дочерним компонентам через props или Context:

```typescript
// app/[locale]/layout.tsx
import { LOCALES } from '@/lib/types';
import type { Locale } from '@/lib/types';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
```

Функция `generateStaticParams` сообщает Next.js, какие локали нужно статически сгенерировать при сборке.

## Использование переводов на страницах

Серверные компоненты получают словарь напрямую через `await`:

```typescript
// app/[locale]/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '@/lib/types';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <main>
      <h1>{dict.home.title}</h1>
      <p>{dict.home.description}</p>
      <a href={`/${locale}/about`}>{dict.home.cta}</a>
    </main>
  );
}
```

### Клиентские компоненты и переводы

Для клиентских компонентов словарь нужно передать через props, так как они не могут вызывать `async`-функции напрямую:

```typescript
// components/Navigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/types';

interface NavDict {
  home: string;
  about: string;
  contact: string;
}

interface NavigationProps {
  locale: Locale;
  dict: NavDict;
}

export function Navigation({ locale, dict }: NavigationProps) {
  const pathname = usePathname();

  const links = [
    { href: `/${locale}`, label: dict.home },
    { href: `/${locale}/about`, label: dict.about },
    { href: `/${locale}/contact`, label: dict.contact },
  ];

  return (
    <nav>
      <ul>
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

Родительский серверный компонент загружает словарь и передаёт его клиентскому компоненту:

```typescript
// app/[locale]/layout.tsx (дополненная версия)
import { getDictionary } from '@/lib/dictionaries';
import { Navigation } from '@/components/Navigation';
import { LOCALES } from '@/lib/types';
import type { Locale } from '@/lib/types';

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <html lang={locale}>
      <body>
        <Navigation locale={locale} dict={dict.common} />
        {children}
      </body>
    </html>
  );
}
```

## Переключение языка

Компонент переключения языка должен переводить пользователя на ту же страницу, но с другой локалью:

```typescript
// components/LocaleSwitcher.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/lib/types';
import { LOCALES } from '@/lib/types';

const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
};

interface LocaleSwitcherProps {
  currentLocale: Locale;
}

export function LocaleSwitcher({ currentLocale }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: Locale) {
    // Заменяем текущую локаль в пути на новую
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  }

  return (
    <div>
      {LOCALES.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          disabled={locale === currentLocale}
          aria-label={`Switch to ${LOCALE_LABELS[locale]}`}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
```

## SEO: метаданные и hreflang

Для корректной индексации поисковыми системами необходимо добавить `hreflang`-теги и локализованные метаданные:

```typescript
// app/[locale]/page.tsx с метаданными
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '@/lib/types';
import type { Metadata } from 'next';
import { LOCALES } from '@/lib/types';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

const BASE_URL = 'https://example.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const alternates: Record<string, string> = {};
  LOCALES.forEach((loc) => {
    alternates[loc] = `${BASE_URL}/${loc}`;
  });

  return {
    title: dict.home.title,
    description: dict.home.description,
    alternates: {
      languages: alternates,
      canonical: `${BASE_URL}/${locale}`,
    },
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <main>
      <h1>{dict.home.title}</h1>
      <p>{dict.home.description}</p>
    </main>
  );
}
```

Next.js автоматически рендерит теги `<link rel="alternate" hreflang="...">` в `<head>` на основе объекта `alternates.languages`.

## Форматирование дат и чисел

Локализация — это не только переводы. Даты, числа и валюты тоже нужно форматировать по региональным стандартам:

```typescript
// lib/formatters.ts
import type { Locale } from './types';

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatPrice(amount: number, locale: Locale): string {
  const currency = locale === 'ru' ? 'RUB' : 'USD';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value);
}
```

Использование в компоненте:

```typescript
// app/[locale]/blog/[slug]/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import { formatDate } from '@/lib/formatters';
import type { Locale } from '@/lib/types';

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);

  // Имитация получения данных поста
  const post = { title: 'Заголовок', publishedAt: new Date('2024-06-15') };

  return (
    <article>
      <h1>{post.title}</h1>
      <time dateTime={post.publishedAt.toISOString()}>
        {dict.blog.postedOn} {formatDate(post.publishedAt, locale)}
      </time>
    </article>
  );
}
```

## Обработка переменных в переводах

Часто в строках нужно вставлять динамические значения. Для этого используется простое соглашение с плейсхолдерами:

```json
// dictionaries/ru.json
{
  "user": {
    "greeting": "Привет, {name}!",
    "itemsCount": "У вас {count} товаров в корзине"
  }
}
```

```typescript
// lib/t.ts
export function t(template: string, variables: Record<string, string | number>): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template
  );
}
```

```typescript
// Использование
import { t } from '@/lib/t';

const greeting = t(dict.user.greeting, { name: 'Антон' });
// Результат: "Привет, Антон!"
```

## Распространённые ошибки

### Жёсткие пути без локали

Использование `<Link href="/about">` вместо `<Link href={`/${locale}/about`}>` приведёт к потере локали при переходах. Всегда включайте текущую локаль в ссылки.

### Отсутствие fallback для отсутствующих ключей

Если ключ перевода отсутствует в одном из словарей, приложение может упасть с ошибкой. Добавьте защитную функцию:

```typescript
export function safeGet<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  fallback = ''
): string {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return typeof value === 'string' ? value : fallback;
}
```

### Кэширование словарей

При большом числе запросов функция `getDictionary` будет вызываться на каждый запрос. Next.js автоматически кэширует результаты `fetch`, но для `import()` кэширование выполняется на уровне модульной системы Node.js — повторные вызовы не создают лишних запросов к файловой системе.

## Итог

Мультиязычность в Next.js App Router строится на трёх компонентах: структура папок с `[locale]`, middleware для перехвата и перенаправления запросов, и словари переводов. Такой подход полностью статически типизирован, хорошо масштабируется и не требует сторонних библиотек для базовых сценариев.

Для сложных проектов с множеством языков, плюрализацией (одно яблоко / два яблока / пять яблок) и форматированием рекомендуется рассмотреть библиотеку `next-intl`, которая надстраивается поверх описанного подхода и решает эти задачи декларативно.

Освоить Next.js с нуля до уверенного уровня, включая работу с роутингом, серверными компонентами и деплоем, можно на курсе [Next.js от PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=i18n-internationalization).