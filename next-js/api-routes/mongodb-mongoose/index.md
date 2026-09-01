---
metaTitle: "Next.js с MongoDB и Mongoose: подключение и работа с базой данных"
metaDescription: "Как подключить MongoDB к Next.js через Mongoose: настройка соединения, модели, CRUD-операции в API Routes и App Router."
author: "Антон Ларичев"
title: "Next.js с MongoDB и Mongoose"
preview: "Пошаговое руководство по интеграции MongoDB и Mongoose в Next.js-приложение с примерами моделей и API-маршрутов."
---

## Введение

MongoDB — документоориентированная база данных, которая хорошо сочетается с Next.js благодаря гибкой схеме и нативной поддержке JSON-подобных структур. Mongoose добавляет поверх нативного драйвера удобный слой схем, валидации и методов, что делает работу с данными предсказуемой и типизированной.

В этой статье разберём, как правильно подключить MongoDB к Next.js, создать переиспользуемое соединение, описать модели и реализовать CRUD-операции через App Router API Routes.

## Установка зависимостей

Для работы с MongoDB через Mongoose потребуются два пакета:

```bash
npm install mongoose
```

Монговый нативный драйвер (`mongodb`) устанавливается автоматически как зависимость Mongoose, так что отдельно его ставить не нужно.

## Настройка переменных окружения

Строка подключения к MongoDB хранится в переменной окружения. Создайте файл `.env.local` в корне проекта:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mydb?retryWrites=true&w=majority
```

Если вы используете локальный MongoDB:

```bash
MONGODB_URI=mongodb://localhost:27017/mydb
```

Next.js автоматически загружает `.env.local` — дополнительных пакетов типа `dotenv` не нужно. Переменная без префикса `NEXT_PUBLIC_` доступна только на сервере, что правильно для строк подключения к базе данных.

## Переиспользуемое соединение с MongoDB

Next.js работает в serverless-режиме: каждый API-запрос может выполняться в отдельном контексте. Если открывать новое соединение при каждом вызове, быстро исчерпается лимит подключений MongoDB.

Решение — кэшировать соединение в глобальном объекте Node.js, который сохраняется между горячими перезагрузками в режиме разработки и переиспользуется в рамках одного процесса.

Создайте файл `lib/mongoose.ts`:

```typescript
import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

Логика проста: при первом вызове функция создаёт соединение и сохраняет промис в `cached.promise`. Все последующие вызовы получают уже готовое соединение из `cached.conn`. Это предотвращает создание множества параллельных подключений.

Параметр `bufferCommands: false` отключает внутреннюю буферизацию команд Mongoose. Без него запросы к базе могут молча «висеть» вместо того, чтобы выбросить ошибку при отсутствии соединения.

## Определение моделей Mongoose

Модели описывают структуру документов в коллекции. Их принято хранить в папке `models/`.

### Простая модель пользователя

Создайте файл `models/User.ts`:

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Имя обязательно'],
      trim: true,
      maxlength: [100, 'Имя не может быть длиннее 100 символов'],
    },
    email: {
      type: String,
      required: [true, 'Email обязателен'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Некорректный формат email'],
    },
  },
  {
    timestamps: true,
  }
);

// Защита от повторной регистрации модели при горячей перезагрузке
const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

export default User;
```

Конструкция `mongoose.models.User ?? mongoose.model(...)` — важный паттерн для Next.js. В режиме разработки модули могут перезагружаться, и Mongoose выбросит ошибку, если попытаться зарегистрировать модель с уже существующим именем. Проверка `mongoose.models.User` предотвращает это.

### Модель со связями

Создайте файл `models/Post.ts`:

```typescript
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  tags: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Заголовок обязателен'],
      trim: true,
      maxlength: [200, 'Заголовок не может быть длиннее 200 символов'],
    },
    content: {
      type: String,
      required: [true, 'Содержимое обязательно'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [{ type: String, trim: true }],
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Post: Model<IPost> =
  mongoose.models.Post ?? mongoose.model<IPost>('Post', PostSchema);

export default Post;
```

## API Routes в App Router

В App Router API-маршруты находятся в `app/api/`. Каждый маршрут — это файл `route.ts` с именованными экспортами для HTTP-методов.

### Получение и создание пользователей

Создайте файл `app/api/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';
import { MongoServerError } from 'mongodb';

export async function GET() {
  try {
    await connectToDatabase();

    const users = await User.find({}).select('-__v').lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Имя и email обязательны' },
        { status: 400 }
      );
    }

    const user = await User.create({ name, email });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
```

Метод `.lean()` возвращает обычные JavaScript-объекты вместо Mongoose-документов, что заметно ускоряет запросы только на чтение.

### Операции с конкретным пользователем

Создайте файл `app/api/users/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';

interface RouteParams {
  params: { id: string };
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!isValidObjectId(params.id)) {
    return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const user = await User.findById(params.id).select('-__v').lean();

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isValidObjectId(params.id)) {
    return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const body = await request.json();
    const allowedFields = ['name', 'email'];
    const update = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );

    const user = await User.findByIdAndUpdate(
      params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error('PATCH /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!isValidObjectId(params.id)) {
    return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const user = await User.findByIdAndDelete(params.id);

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
```

Обратите внимание на параметры `findByIdAndUpdate`: `new: true` возвращает обновлённый документ (а не исходный), а `runValidators: true` применяет валидацию схемы при обновлении — по умолчанию она не запускается.

## Запросы с фильтрацией и пагинацией

Практически в любом приложении нужна пагинация. Вот пример API для получения постов с фильтрами:

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Post from '@/models/Post';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '10')));
    const skip = (page - 1) * limit;
    const tag = searchParams.get('tag');
    const published = searchParams.get('published');

    const filter: Record<string, unknown> = {};

    if (tag) {
      filter.tags = tag;
    }

    if (published !== null) {
      filter.published = published === 'true';
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/posts error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
```

Запрос выполняется параллельно через `Promise.all`: одновременно получаем данные и считаем общее количество документов. Это вдвое быстрее последовательных запросов.

## Использование данных в Server Components

Если данные нужны только для рендеринга страницы, можно обращаться к базе напрямую из Server Components, минуя API-маршрут:

```typescript
// app/posts/page.tsx
import { connectToDatabase } from '@/lib/mongoose';
import Post from '@/models/Post';

export default async function PostsPage() {
  await connectToDatabase();

  const posts = await Post.find({ published: true })
    .populate('author', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return (
    <main>
      <h1>Статьи</h1>
      <ul>
        {posts.map((post) => (
          <li key={String(post._id)}>
            <h2>{post.title}</h2>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Server Components выполняются только на сервере, поэтому прямой доступ к базе безопасен. Используйте этот подход для страниц с SSR или ISR, где данные не нужно получать на клиенте.

## Типичные ошибки и как их избежать

### Не проверять ObjectId перед запросом

MongoDB выбросит исключение, если передать невалидный ObjectId в `findById`. Всегда проверяйте входящие идентификаторы:

```typescript
import mongoose from 'mongoose';

if (!mongoose.Types.ObjectId.isValid(id)) {
  return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
}
```

### Утечка ошибок базы данных в ответ

Никогда не передавайте объект ошибки напрямую в JSON-ответ — он может содержать чувствительную информацию о структуре базы:

```typescript
// Плохо
return NextResponse.json({ error }, { status: 500 });

// Хорошо
console.error(error);
return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
```

### Игнорировать индексы

MongoDB не создаёт индексы автоматически (кроме `_id`). Поля, по которым часто фильтруют или сортируют, нужно индексировать явно:

```typescript
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ published: 1, createdAt: -1 });
```

Без индексов запросы на большой коллекции будут выполнять полный скан, что резко замедляет приложение.

### Не использовать lean() для запросов на чтение

Mongose-документы — тяжёлые объекты с методами, геттерами и прокси. Если результат нужен только для чтения, `.lean()` возвращает чистые POJO и работает в 3-5 раз быстрее.

## Структура проекта

Рекомендуемая организация файлов:

```
├── app/
│   └── api/
│       ├── users/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       └── posts/
│           └── route.ts
├── lib/
│   └── mongoose.ts
├── models/
│   ├── User.ts
│   └── Post.ts
└── .env.local
```

Такое разделение — соединение в `lib/`, модели в `models/`, маршруты в `app/api/` — делает код предсказуемым и простым для навигации.

## Заключение

Интеграция MongoDB с Next.js через Mongoose сводится к трём шагам: создать переиспользуемое соединение с кэшированием в глобальном объекте, описать модели с типизацией и валидацией, реализовать API-маршруты с корректной обработкой ошибок. Такой подход масштабируется от небольшого прототипа до продакшн-приложения.

Подробнее о построении full-stack приложений на Next.js — в курсе на PurpleSchool:
https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=mongodb-mongoose
