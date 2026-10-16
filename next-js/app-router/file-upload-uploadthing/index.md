---
metaTitle: "Загрузка файлов в Next.js с UploadThing"
metaDescription: "Пошаговая настройка загрузки файлов в Next.js App Router с помощью UploadThing: роутер, API, клиентский компонент и отображение."
author: "Антон Ларичев"
title: "Загрузка файлов в Next.js с UploadThing"
preview: "Как интегрировать UploadThing в Next.js App Router: настройка роутера файлов, API-маршрута и клиентского компонента загрузки."
---

## Загрузка файлов в Next.js с UploadThing

UploadThing — библиотека для загрузки файлов, созданная специально под экосистему Next.js. Она берёт на себя хранение файлов в облаке, генерацию подписанных URL, валидацию типов и размеров, а разработчику остаётся только описать правила и подключить готовые компоненты.

В этой статье разберём полный цикл: от установки пакетов до отображения загруженных файлов на странице.

## Почему UploadThing, а не multer или formidable

Традиционные подходы с `multer` или `formidable` требуют собственного сервера для хранения файлов. В Next.js с App Router API-маршруты работают в serverless-окружении — там нет постоянной файловой системы. UploadThing решает эту проблему: файлы уходят напрямую в облачное хранилище, а сервер только авторизует загрузку.

Преимущества:
- Нативная поддержка App Router и Server Components
- Типобезопасность через TypeScript от роутера до клиента
- Встроенные React-компоненты с прогресс-баром
- Бесплатный тариф покрывает большинство учебных проектов

## Установка и получение ключей

Сначала установите пакеты:

```bash
npm install uploadthing @uploadthing/react
```

Затем зарегистрируйтесь на [uploadthing.com](https://uploadthing.com) и создайте новое приложение. В разделе **API Keys** скопируйте значения `UPLOADTHING_TOKEN`.

Добавьте переменную окружения в `.env.local`:

```bash
UPLOADTHING_TOKEN=ваш_токен_здесь
```

> Токен содержит все необходимые ключи в закодированном виде — одна переменная вместо двух (App ID + Secret).

## Создание файлового роутера

Файловый роутер — это центральное место конфигурации. Здесь описываются «эндпоинты» загрузки: какие типы файлов принимать, какой максимальный размер, кто имеет право загружать.

Создайте файл `app/api/uploadthing/core.ts`:

```typescript
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth"; // ваш механизм аутентификации

const f = createUploadthing();

export const ourFileRouter = {
  // Эндпоинт для загрузки аватаров
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // Эта функция выполняется на сервере перед загрузкой
      const user = await auth(req);

      if (!user) throw new Error("Unauthorized");

      // Всё, что вернёт middleware, попадёт в onUploadComplete
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Загрузка завершена для userId:", metadata.userId);
      console.log("URL файла:", file.url);

      // Здесь можно сохранить URL в базу данных
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Эндпоинт для загрузки документов PDF
  pdfUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 3 } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, name: file.name };
    }),

  // Эндпоинт без аутентификации — например, для публичных форм
  publicImageUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 4 } })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

Обратите внимание на `satisfies FileRouter` в конце — это даёт TypeScript полную информацию о роутере, и все клиентские хуки будут типизированы автоматически.

## Создание API-маршрута

Создайте файл `app/api/uploadthing/route.ts`:

```typescript
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

Это всё, что нужно для серверной части. `createRouteHandler` создаёт обработчики GET и POST, которые Next.js подхватывает автоматически.

## Настройка провайдера на клиенте

UploadThing предоставляет функцию генерации типизированных хуков. Создайте файл `lib/uploadthing.ts`:

```typescript
import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
```

Теперь эти компоненты знают о всех эндпоинтах вашего роутера — IDE подскажет допустимые значения через автодополнение.

## Клиентский компонент загрузки

Создайте компонент `components/ImageUploader.tsx`:

```typescript
"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";

interface UploadedFile {
  url: string;
  name: string;
}

export function ImageUploader() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          // res — массив загруженных файлов
          const files = res.map((file) => ({
            url: file.url,
            name: file.name,
          }));
          setUploadedFiles((prev) => [...prev, ...files]);
          setError(null);
        }}
        onUploadError={(error) => {
          setError(error.message);
        }}
        appearance={{
          button: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded",
          allowedContent: "text-gray-500 text-sm",
        }}
        content={{
          button({ ready }) {
            return ready ? "Выбрать изображение" : "Загрузка...";
          },
          allowedContent: "Изображения до 4 МБ",
        }}
      />

      {error && (
        <p className="text-red-500 text-sm">Ошибка: {error}</p>
      )}

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {uploadedFiles.map((file) => (
            <img
              key={file.url}
              src={file.url}
              alt={file.name}
              className="w-full h-32 object-cover rounded"
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Компонент с зоной перетаскивания

Для загрузки нескольких файлов через drag-and-drop используйте `UploadDropzone`:

```typescript
"use client";

import { useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";

export function PdfDropzone() {
  const [urls, setUrls] = useState<string[]>([]);

  return (
    <div>
      <UploadDropzone
        endpoint="pdfUploader"
        onClientUploadComplete={(res) => {
          setUrls(res.map((f) => f.url));
        }}
        onUploadError={(error) => {
          alert(`Ошибка загрузки: ${error.message}`);
        }}
        appearance={{
          container:
            "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center",
          label: "text-gray-600",
          uploadIcon: "text-gray-400",
        }}
        content={{
          label: "Перетащите PDF-файлы сюда",
          allowedContent: "PDF до 16 МБ, не более 3 файлов",
        }}
      />

      {urls.length > 0 && (
        <ul className="mt-4 space-y-1">
          {urls.map((url) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                {url.split("/").pop()}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Сохранение URL в базу данных

В реальных приложениях после загрузки нужно записать URL файла в базу данных. Это делается в `onUploadComplete` внутри `core.ts` — там есть доступ к серверному контексту:

```typescript
import { db } from "@/lib/db"; // ваш Prisma/Drizzle клиент

export const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Сохраняем URL аватара в профиле пользователя
      await db.user.update({
        where: { id: metadata.userId },
        data: { avatarUrl: file.url },
      });

      // Возвращаем данные клиенту — они попадут в onClientUploadComplete
      return { avatarUrl: file.url };
    }),
} satisfies FileRouter;
```

На клиенте получить эти данные можно через `res[0].serverData`:

```typescript
<UploadButton
  endpoint="avatarUploader"
  onClientUploadComplete={(res) => {
    const avatarUrl = res[0].serverData?.avatarUrl;
    // Обновить UI с новым аватаром
  }}
/>
```

## Кастомный хук для программной загрузки

Иногда стандартной кнопки недостаточно — нужно запускать загрузку из кода. Используйте `useUploadThing`:

```typescript
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export function CustomDropzone() {
  const [files, setFiles] = useState<File[]>([]);

  const { startUpload, isUploading } = useUploadThing<OurFileRouter>("imageUploader", {
    onClientUploadComplete: (res) => {
      console.log("Загружено:", res);
      setFiles([]);
    },
    onUploadError: (error) => {
      console.error("Ошибка:", error);
    },
    onUploadProgress: (progress) => {
      console.log(`Прогресс: ${progress}%`);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        <p>Перетащите файлы или кликните для выбора</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Выбрано: {files.map((f) => f.name).join(", ")}
          </p>
          <button
            onClick={() => startUpload(files)}
            disabled={isUploading}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isUploading ? "Загружается..." : "Загрузить"}
          </button>
        </div>
      )}
    </div>
  );
}
```

## Обработка ошибок

UploadThing выбрасывает ошибки с понятными кодами. Наиболее частые:

| Код | Причина |
|-----|---------|
| `FileSizeMismatch` | Файл превышает лимит из роутера |
| `FileCountMismatch` | Превышено количество файлов |
| `InvalidFileType` | Тип файла не разрешён |
| `UploadThingError` | Ошибка на стороне сервиса |

Перехватить их можно в `onUploadError` у компонентов или через `try/catch` при использовании `startUpload`:

```typescript
try {
  await startUpload(files);
} catch (err) {
  if (err instanceof UploadThingError) {
    switch (err.code) {
      case "FILE_LIMIT_EXCEEDED":
        setError("Слишком много файлов");
        break;
      case "TOO_LARGE":
        setError("Файл слишком большой");
        break;
      default:
        setError("Ошибка загрузки");
    }
  }
}
```

## Использование компонентов на странице

Подключите компоненты в любой серверной или клиентской странице:

```typescript
// app/profile/page.tsx
import { ImageUploader } from "@/components/ImageUploader";
import { PdfDropzone } from "@/components/PdfDropzone";

export default function ProfilePage() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Аватар</h2>
        <ImageUploader />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Документы</h2>
        <PdfDropzone />
      </section>
    </main>
  );
}
```

## Итог

UploadThing отлично встраивается в Next.js App Router: минимум серверного кода, автоматическая типизация от роутера до клиента, встроенные компоненты. Основные шаги:

1. Установить пакеты и добавить `UPLOADTHING_TOKEN` в переменные окружения
2. Описать эндпоинты в `app/api/uploadthing/core.ts` с правилами валидации и middleware
3. Создать маршрут `app/api/uploadthing/route.ts` через `createRouteHandler`
4. Сгенерировать типизированные компоненты через `generateUploadButton`/`generateUploadDropzone`
5. Использовать готовые компоненты или хук `useUploadThing` для кастомного UI

Осваивайте полный стек Next.js — от маршрутизации до работы с файлами и базами данных — на курсе PurpleSchool:
https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=file-upload-uploadthing
