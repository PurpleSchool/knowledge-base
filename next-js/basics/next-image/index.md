---
metaTitle: next/image — оптимизация изображений в Next.js
metaDescription: Разбираем компонент next/image в Next.js — автоматическая оптимизация, lazy loading, форматы WebP/AVIF, параметры fill и priority, локальные и удалённые изображения.
author: Антон Ларичев
title: next/image — оптимизация изображений в Next.js
preview: Подробный разбор компонента Image из next/image — как он оптимизирует изображения автоматически, настройка размеров, форматов, ленивой загрузки и работа с удалёнными источниками.
---

## Введение

Работа с изображениями — одна из самых частых причин низкой производительности веб-сайтов. Обычный тег `<img>` не оптимизирует ничего: загружает оригинальный файл полностью, не конвертирует в современные форматы и не откладывает загрузку изображений вне экрана.

Next.js решает эту проблему встроенным компонентом `<Image>` из пакета `next/image`. Он автоматически сжимает изображения, конвертирует в WebP или AVIF, добавляет ленивую загрузку и предотвращает CLS (Cumulative Layout Shift) — сдвиги макета при загрузке.

## Базовое использование

Импортируйте компонент `Image` вместо стандартного тега `<img>`:

```typescript
import Image from 'next/image';

export default function Avatar() {
  return (
    <Image
      src="/avatar.jpg"
      alt="Аватар пользователя"
      width={200}
      height={200}
    />
  );
}
```

Параметры `width` и `height` обязательны для локальных изображений с фиксированным размером. Они нужны не для отображения, а чтобы браузер заранее зарезервировал место и не было сдвигов макета.

## Локальные изображения

Для локальных изображений из папки `public/` или любой другой директории проекта можно передавать строку-путь или импортировать файл напрямую:

```typescript
import Image from 'next/image';
import heroImage from '@/public/hero.jpg'; // статический импорт

export default function Hero() {
  return (
    // Статический импорт: width/height вычисляются автоматически
    <Image
      src={heroImage}
      alt="Главный баннер"
      placeholder="blur" // размытый предпросмотр пока грузится
    />
  );
}
```

При статическом импорте (`import heroImage from '...'`) Next.js автоматически определяет размеры и генерирует `blurDataURL` для плавного появления.

## Удалённые изображения

Для изображений с внешних URL нужно явно указать размеры и добавить домен в `next.config.js`:

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        pathname: '/images/**',
      },
    ],
  },
};

module.exports = nextConfig;
```

```typescript
import Image from 'next/image';

export default function UserCard() {
  return (
    <Image
      src="https://cdn.example.com/images/user-123.jpg"
      alt="Фото пользователя"
      width={300}
      height={300}
    />
  );
}
```

Без добавления домена в `remotePatterns` Next.js выбросит ошибку — это защита от нежелательной обработки сторонних изображений.

## Режим fill — изображения без фиксированных размеров

Когда размер контейнера неизвестен заранее или изображение должно занимать всю область родителя, используйте параметр `fill`:

```typescript
import Image from 'next/image';

export default function Banner() {
  return (
    // Родительский контейнер обязательно должен иметь position: relative
    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
      <Image
        src="/banner.jpg"
        alt="Баннер"
        fill
        style={{ objectFit: 'cover' }} // или 'contain'
      />
    </div>
  );
}
```

При использовании `fill` параметры `width` и `height` не нужны — изображение растягивается на весь родительский элемент. Родитель должен иметь `position: relative`, `absolute`, или `fixed`.

## Параметр priority — критические изображения

По умолчанию все изображения загружаются лениво (lazy). Для изображений, видимых при первой загрузке страницы (LCP-элементы), используйте `priority`:

```typescript
import Image from 'next/image';

export default function HeroSection() {
  return (
    <Image
      src="/hero.jpg"
      alt="Главный экран"
      width={1200}
      height={600}
      priority // предзагрузка, без lazy loading
    />
  );
}
```

`priority` сигнализирует браузеру загрузить изображение немедленно через `<link rel="preload">`. Используйте его только для изображений в первом экране — для остальных он замедлит начальную загрузку.

## Форматы и качество

Next.js автоматически конвертирует изображения в WebP или AVIF (если браузер поддерживает) через встроенный оптимизатор. Вы можете управлять качеством:

```typescript
<Image
  src="/photo.jpg"
  alt="Фотография"
  width={800}
  height={600}
  quality={75} // от 1 до 100, по умолчанию 75
/>
```

Конвертация происходит на лету при первом запросе и кешируется на сервере. Повторные запросы используют кеш.

## sizes — адаптивные изображения

Параметр `sizes` помогает браузеру выбрать правильный размер изображения для текущего экрана. Это аналог атрибута `sizes` у `<img>` и работает совместно с автоматически генерируемым `srcSet`:

```typescript
<Image
  src="/article-cover.jpg"
  alt="Обложка статьи"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  style={{ objectFit: 'cover' }}
/>
```

Здесь: на мобильных изображение занимает 100% ширины экрана, на планшетах — 50%, на десктопах — треть. Браузер загрузит оптимальный вариант.

## Loader — кастомный обработчик изображений

Если изображения обслуживаются через CDN с собственным API (например, Cloudinary, Imgix), вы можете подключить кастомный loader:

```typescript
// Кастомный Cloudinary loader
const cloudinaryLoader = ({ src, width, quality }: {
  src: string;
  width: number;
  quality?: number;
}) => {
  return `https://res.cloudinary.com/demo/image/upload/f_auto,q_${quality || 75},w_${width}/${src}`;
};

export default function CloudinaryImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      loader={cloudinaryLoader}
      src={src}
      alt={alt}
      width={800}
      height={600}
    />
  );
}
```

## Частые ошибки

**Ошибка: Image with src "..." has "fill" but is missing "sizes"**

При использовании `fill` рекомендуется указывать `sizes` — иначе Next.js загрузит изображение максимального размера для любого экрана.

**Ошибка: Invalid src prop on next/image**

Домен изображения не добавлен в `remotePatterns` в `next.config.js`. Добавьте нужный хост.

**Ошибка: Image is missing required "alt" property**

Атрибут `alt` обязателен. Для декоративных изображений передайте пустую строку: `alt=""`.

## Итог

Компонент `next/image` — правильный способ работать с изображениями в Next.js:

- **Автоматическая оптимизация** — сжатие и конвертация в WebP/AVIF
- **Ленивая загрузка** — изображения вне видимой области не загружаются
- **Предотвращение CLS** — резервирование места предотвращает сдвиги макета
- **Адаптивность** — `sizes` и `srcSet` для разных размеров экрана
- **Гибкость** — `fill` для флюидных контейнеров, `priority` для LCP-элементов

Для углублённого изучения Next.js — смотрите курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledge-base&utm_medium=article&utm_campaign=next-image).
