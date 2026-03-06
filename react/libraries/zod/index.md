---
metaTitle: Zod - валидация с TypeScript в React
metaDescription: Полное руководство по Zod — TypeScript-first библиотеке валидации схем. Парсинг данных, вывод типов, интеграция с React Hook Form, Express и tRPC
author: Олег Марков
title: Zod - валидация с TypeScript
preview: Узнайте, как использовать Zod для строгой валидации данных с полной поддержкой TypeScript — от базовых типов до сложных трансформаций и кастомных схем
---

# Zod — валидация с TypeScript в React

## Введение

Одна из главных проблем при работе с внешними данными (API-ответы, пользовательский ввод, конфигурационные файлы) — TypeScript не может гарантировать корректность данных во время выполнения. Вы можете описать тип `User`, но если API вернёт объект без обязательных полей, TypeScript об этом не знает.

**Zod** решает эту проблему: это TypeScript-first библиотека для объявления и валидации схем, которая одновременно обеспечивает type-safety во время компиляции и валидацию данных во время выполнения. В отличие от других библиотек (например, Yup), Zod разработан с нуля с расчётом на TypeScript и имеет более строгий и предсказуемый API.

Zod скачивают более 9 миллионов раз в неделю — это один из самых популярных инструментов в TypeScript-экосистеме. Его используют в tRPC, Prisma, Next.js и многих других проектах.

## Установка

```bash
npm install zod
# или
yarn add zod
```

Zod требует TypeScript >= 4.5 и `strict: true` в `tsconfig.json`. Отдельных `@types` пакетов не нужно — типы уже включены.

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

## Ключевое отличие от Yup: parse, не validate

Философия Zod основана на **парсинге**, а не просто валидации. Метод `.parse()` возвращает трансформированные данные (или выбрасывает ошибку), а `.safeParse()` возвращает результирующий объект без исключений.

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// .parse() — выбрасывает ZodError при ошибке
const user = UserSchema.parse(rawData); // user имеет тип { id: number; name: string; email: string }

// .safeParse() — возвращает { success: true, data } или { success: false, error }
const result = UserSchema.safeParse(rawData);
if (result.success) {
  console.log(result.data); // полная типизация
} else {
  console.error(result.error.issues);
}
```

## Базовые типы

### Примитивы

```typescript
import { z } from 'zod';

// Строки
const stringSchema = z.string();
const emailSchema = z.string().email();
const urlSchema = z.string().url();
const uuidSchema = z.string().uuid();
const minMaxSchema = z.string().min(3).max(50);
const regexSchema = z.string().regex(/^[a-z]+$/, 'Только строчные буквы');
const trimSchema = z.string().trim();

// Числа
const numberSchema = z.number();
const intSchema = z.number().int();
const positiveSchema = z.number().positive();
const rangeSchema = z.number().min(0).max(100);

// Булевы
const boolSchema = z.boolean();

// Даты
const dateSchema = z.date();
const dateMinSchema = z.date().min(new Date('2020-01-01'));

// BigInt
const bigIntSchema = z.bigint();

// Символы
const symbolSchema = z.symbol();

// undefined, null, void, any, unknown, never
const undefinedSchema = z.undefined();
const nullSchema = z.null();
const anySchema = z.any();
const unknownSchema = z.unknown();
```

### Объекты

```typescript
const PersonSchema = z.object({
  name: z.string(),
  age: z.number().int().positive(),
  email: z.string().email().optional(),
});

// Тип выводится автоматически
type Person = z.infer<typeof PersonSchema>;
// { name: string; age: number; email?: string }

// Вложенные объекты
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string().default('RU'),
});

const UserSchema = z.object({
  id: z.number(),
  person: PersonSchema,
  address: AddressSchema.optional(),
});
```

### Массивы

```typescript
const TagsSchema = z.array(z.string());
const NumbersSchema = z.array(z.number()).min(1).max(10);
const NonEmptyArray = z.array(z.string()).nonempty(); // Тип [string, ...string[]]

// Кортежи
const TupleSchema = z.tuple([z.string(), z.number(), z.boolean()]);
// [string, number, boolean]
```

### Перечисления и объединения

```typescript
// Enum
const RoleSchema = z.enum(['admin', 'user', 'moderator']);
type Role = z.infer<typeof RoleSchema>; // 'admin' | 'user' | 'moderator'

// Нативный TypeScript enum
enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}
const DirectionSchema = z.nativeEnum(Direction);

// Union (объединение)
const IdSchema = z.union([z.string(), z.number()]);
// Или краткая форма:
const IdSchema2 = z.string().or(z.number());

// Discriminated union (дискриминированное объединение)
const ResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('success'), data: z.string() }),
  z.object({ status: z.literal('error'), message: z.string() }),
]);

// Intersection (пересечение)
const AdminSchema = z.object({ role: z.literal('admin') });
const BaseUserSchema = z.object({ name: z.string() });
const AdminUserSchema = BaseUserSchema.and(AdminSchema);
```

## Автоматический вывод типов

Главная суперсила Zod — вывод TypeScript-типов из схем:

```typescript
const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number().positive(),
  category: z.enum(['electronics', 'clothing', 'food']),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
});

// Zod выводит точный тип
type Product = z.infer<typeof ProductSchema>;
/*
{
  id: number;
  name: string;
  price: number;
  category: 'electronics' | 'clothing' | 'food';
  tags?: string[];
  metadata?: Record<string, string>;
}
*/

// Теперь Product — это живой тип, всегда синхронизированный со схемой
function processProduct(product: Product) {
  // TypeScript знает все поля и их типы
}
```

## Трансформации

Zod позволяет трансформировать данные в процессе парсинга:

```typescript
// .transform() — преобразование данных
const TrimmedString = z.string().transform((s) => s.trim());
const NumberFromString = z.string().transform((s) => parseInt(s, 10));

// .preprocess() — обработка до валидации
const NumberSchema = z.preprocess(
  (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
  z.number()
);

// Цепочка: сначала валидация, потом трансформация
const FormDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((s) => new Date(s));

// Тип у результата будет Date, а не string
type FormDate = z.infer<typeof FormDateSchema>; // Date
```

## Опциональные и nullable поля

```typescript
// optional: значение или undefined
const schema1 = z.string().optional(); // string | undefined

// nullable: значение или null
const schema2 = z.string().nullable(); // string | null

// nullish: значение, null или undefined
const schema3 = z.string().nullish(); // string | null | undefined

// Значения по умолчанию
const schema4 = z.string().default('Аноним');
const schema5 = z.number().default(0);

// Функция как дефолтное значение
const schema6 = z.date().default(() => new Date());
```

## Рефайнменты и кастомная валидация

```typescript
// .refine() — кастомное правило
const PasswordSchema = z.string()
  .min(8, 'Минимум 8 символов')
  .refine(
    (val) => /[A-Z]/.test(val),
    { message: 'Должна быть хотя бы одна заглавная буква' }
  )
  .refine(
    (val) => /[0-9]/.test(val),
    { message: 'Должна быть хотя бы одна цифра' }
  );

// .superRefine() — расширенный контроль ошибок
const RegistrationSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Пароли не совпадают',
      path: ['confirmPassword'], // Привязываем ошибку к конкретному полю
    });
  }
});

// Асинхронный refine (например, проверка в базе данных)
const UniqueEmailSchema = z.string().email().refine(
  async (email) => {
    const exists = await checkEmailExists(email);
    return !exists;
  },
  { message: 'Email уже используется' }
);
```

## Схемы объектов: pick, omit, partial, required

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.enum(['admin', 'user']),
});

// Выбрать только нужные поля
const PublicUserSchema = UserSchema.pick({ id: true, name: true, email: true });

// Исключить поля
const UserWithoutPassword = UserSchema.omit({ password: true });

// Сделать все поля необязательными (для PATCH запросов)
const UpdateUserSchema = UserSchema.partial();

// Сделать только некоторые поля необязательными
const PartialUserSchema = UserSchema.partial({ email: true, role: true });

// Сделать все поля обязательными
const RequiredUserSchema = UserSchema.required();

// Расширить схему
const AdminUserSchema = UserSchema.extend({
  permissions: z.array(z.string()),
  lastLogin: z.date().optional(),
});

// Объединить две схемы
const MergedSchema = UserSchema.merge(AdminUserSchema);
```

## Интеграция с React Hook Form

Zod отлично работает с React Hook Form через `@hookform/resolvers`:

```bash
npm install @hookform/resolvers
```

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Определяем схему
const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  rememberMe: z.boolean().default(false),
});

// Выводим тип
type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    // data здесь полностью типизирован как LoginFormData
    await login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('email')} type="email" placeholder="Email" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input {...register('password')} type="password" placeholder="Пароль" />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <label>
        <input {...register('rememberMe')} type="checkbox" />
        Запомнить меня
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
}
```

## Валидация API-ответов

Одно из главных применений Zod — валидация данных от внешних API:

```typescript
import { z } from 'zod';

const ApiUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(), // ISO 8601 строка
  role: z.enum(['admin', 'user']).default('user'),
});

type ApiUser = z.infer<typeof ApiUserSchema>;

async function fetchUser(id: number): Promise<ApiUser> {
  const response = await fetch(`/api/users/${id}`);
  const rawData = await response.json();

  // Zod проверит данные и выбросит ошибку, если они некорректны
  return ApiUserSchema.parse(rawData);
}

// Или безопасная версия
async function fetchUserSafe(id: number) {
  const response = await fetch(`/api/users/${id}`);
  const rawData = await response.json();

  const result = ApiUserSchema.safeParse(rawData);
  if (!result.success) {
    console.error('Невалидный ответ API:', result.error.issues);
    return null;
  }
  return result.data; // ApiUser
}
```

## Обработка ошибок

```typescript
import { z, ZodError } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  age: z.number().min(0),
});

try {
  schema.parse({ name: '', age: -1 });
} catch (err) {
  if (err instanceof ZodError) {
    // Все ошибки в одном месте
    err.issues.forEach((issue) => {
      console.log(`Путь: ${issue.path.join('.')}`);
      console.log(`Код: ${issue.code}`);
      console.log(`Сообщение: ${issue.message}`);
    });

    // Преобразование в формат { поле: 'ошибка' }
    const fieldErrors = err.flatten().fieldErrors;
    // { name: ['Минимум 1 символ'], age: ['Число должно быть >= 0'] }

    // Или более детальная структура
    const formatted = err.format();
  }
}
```

## Кастомные сообщения об ошибках

```typescript
// Встроенные сообщения об ошибках можно переопределить
const schema = z.object({
  name: z.string({
    required_error: 'Имя обязательно',
    invalid_type_error: 'Имя должно быть строкой',
  }).min(1, 'Имя не может быть пустым'),

  age: z.number({
    required_error: 'Возраст обязателен',
    invalid_type_error: 'Возраст должен быть числом',
  }).min(0, 'Возраст не может быть отрицательным'),
});
```

## Сравнение Zod и Yup

| Характеристика | Zod | Yup |
|----------------|-----|-----|
| TypeScript | TypeScript-first | Добавлен позже |
| Вывод типов | Автоматический через `z.infer<>` | Через `yup.InferType<>` |
| API | Цепочки методов | Цепочки методов |
| Производительность | Быстрее | Немного медленнее |
| Bundle size | ~14kb | ~40kb |
| Трансформации | Встроены через `.transform()` | Ограничены |
| Интеграция | tRPC, Prisma, Next.js | Formik, React Hook Form |
| Зрелость | Активно развивается | Режим поддержки |

**Когда выбрать Zod:**
- Проект на TypeScript (особенно с strict: true)
- Нужна валидация API-ответов
- Используете tRPC или Prisma
- Важен размер бандла

**Когда выбрать Yup:**
- Существующий проект с Formik
- Нужна более сложная асинхронная валидация
- Проект на JavaScript без TypeScript

## Заключение

Zod стал стандартом де-факто для валидации данных в TypeScript-проектах. Его главные преимущества:

- **TypeScript-first** — типы выводятся автоматически, схема и тип всегда синхронизированы
- **Runtime-валидация** — защита от некорректных данных из внешних источников
- **Безопасный парсинг** — `.safeParse()` без исключений
- **Богатый API** — трансформации, рефайнменты, условная логика
- **Экосистема** — нативная поддержка в популярных библиотеках

Начните с валидации форм через React Hook Form, а затем расширьте использование на валидацию API-ответов и переменных окружения — Zod справится со всем этим элегантно.
