---
metaTitle: "Zod в TypeScript: валидация и генерация типов"
metaDescription: "Полное руководство по Zod в TypeScript: создание схем, валидация данных, вывод типов через z.infer, обработка ошибок и реальные примеры."
author: "Антон Ларичев"
title: "TypeScript с Zod: генерация и валидация типов"
preview: "Как использовать Zod для runtime-валидации данных и автоматической генерации TypeScript-типов из схем."
---

## Что такое Zod и зачем он нужен

TypeScript даёт статическую типизацию на этапе компиляции, но во время выполнения программы типы исчезают. Когда приходит ответ от API, данные из формы или конфигурационный файл — TypeScript уже не может гарантировать, что данные соответствуют ожидаемой структуре.

Zod — библиотека для определения схем данных и их валидации в runtime. Главная особенность: схема одновременно является источником TypeScript-типа. Вы описываете структуру один раз, получаете и валидацию, и тип.

```bash
npm install zod
```

## Первая схема и вывод типа

Создадим простую схему и выведем из неё тип:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  isActive: z.boolean(),
});

// Автоматически выводим TypeScript-тип из схемы
type User = z.infer<typeof UserSchema>;

// Эквивалентно:
// type User = {
//   id: number;
//   name: string;
//   email: string;
//   age: number;
//   isActive: boolean;
// }
```

Теперь `User` — полноценный TypeScript-тип, который автоматически синхронизирован со схемой. Изменили схему — тип обновился.

## Базовые типы

Zod покрывает все примитивы TypeScript:

```typescript
import { z } from 'zod';

// Примитивы
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();
const dateSchema = z.date();
const nullSchema = z.null();
const undefinedSchema = z.undefined();
const bigintSchema = z.bigint();

// Специальные
const anySchema = z.any();
const unknownSchema = z.unknown();
const neverSchema = z.never();
void z.void();

// Литеральные типы
const literalSchema = z.literal('admin');
const numLiteralSchema = z.literal(42);
```

## Валидация строк

Для строк доступен богатый набор встроенных валидаторов:

```typescript
import { z } from 'zod';

const PasswordSchema = z.string()
  .min(8, 'Минимум 8 символов')
  .max(100, 'Максимум 100 символов')
  .regex(/[A-Z]/, 'Нужна хотя бы одна заглавная буква')
  .regex(/[0-9]/, 'Нужна хотя бы одна цифра');

const ContactSchema = z.object({
  email: z.string().email('Некорректный email'),
  phone: z.string().regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX'),
  website: z.string().url('Некорректный URL').optional(),
  uuid: z.string().uuid(),
  slug: z.string().toLowerCase().trim(),
});

type Contact = z.infer<typeof ContactSchema>;
```

## Валидация чисел

```typescript
import { z } from 'zod';

const PriceSchema = z.number()
  .positive('Цена должна быть положительной')
  .multipleOf(0.01, 'Максимум два знака после запятой');

const AgeSchema = z.number()
  .int('Возраст — целое число')
  .min(18, 'Минимальный возраст: 18')
  .max(100, 'Максимальный возраст: 100');

// Coerce: преобразует строку в число
const CoercedNumber = z.coerce.number();
CoercedNumber.parse('42');  // => 42
CoercedNumber.parse('3.14'); // => 3.14
```

## Объекты: работа с полями

```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  price: z.number().positive(),
  // optional — поле может отсутствовать
  description: z.string().optional(),
  // nullable — поле может быть null
  discountPrice: z.number().nullable(),
  // optional + nullable
  tags: z.array(z.string()).optional().nullable(),
});

type Product = z.infer<typeof ProductSchema>;
// discountPrice: number | null
// description?: string | undefined
// tags?: string[] | null | undefined
```

### Методы работы с объектами

```typescript
import { z } from 'zod';

const BaseSchema = z.object({
  id: z.number(),
  createdAt: z.date(),
});

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// extend — добавить поля
const UserWithBaseSchema = UserSchema.extend(BaseSchema.shape);

// merge — объединить две схемы
const MergedSchema = BaseSchema.merge(UserSchema);

// pick — выбрать только нужные поля
const UserPreviewSchema = UserWithBaseSchema.pick({ id: true, name: true });

// omit — исключить поля
const UserWithoutIdSchema = UserWithBaseSchema.omit({ id: true });

// partial — все поля необязательны (для PATCH-запросов)
const UpdateUserSchema = UserSchema.partial();

// required — все поля обязательны
const StrictUserSchema = UserSchema.required();
```

## Массивы и кортежи

```typescript
import { z } from 'zod';

// Массив строк
const TagsSchema = z.array(z.string()).min(1).max(10);

// Массив объектов
const UsersSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
}));

// Кортеж — фиксированная структура массива
const CoordinatesSchema = z.tuple([
  z.number(), // latitude
  z.number(), // longitude
]);

type Coordinates = z.infer<typeof CoordinatesSchema>;
// [number, number]

// Кортеж с rest-параметрами
const VarArgsSchema = z.tuple([z.string(), z.number()]).rest(z.boolean());
// [string, number, ...boolean[]]
```

## Union и Discriminated Union

```typescript
import { z } from 'zod';

// Union — одно из нескольких значений
const StringOrNumberSchema = z.union([z.string(), z.number()]);

// Enum через union
const RoleSchema = z.enum(['admin', 'user', 'moderator']);
type Role = z.infer<typeof RoleSchema>;
// 'admin' | 'user' | 'moderator'

// Discriminated Union — оптимизированный union с дискриминатором
const NotificationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    email: z.string().email(),
    subject: z.string(),
  }),
  z.object({
    type: z.literal('sms'),
    phone: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal('push'),
    deviceToken: z.string(),
    title: z.string(),
    body: z.string(),
  }),
]);

type Notification = z.infer<typeof NotificationSchema>;
```

Discriminated union работает быстрее обычного union, потому что сначала проверяет поле-дискриминатор и сразу переходит к нужной схеме.

## Методы parse, safeParse и parseAsync

Zod предоставляет несколько методов для валидации:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  age: z.number().min(0),
});

// parse — бросает исключение при ошибке
try {
  const user = UserSchema.parse({ name: 'Иван', age: 25 });
  console.log(user); // { name: 'Иван', age: 25 }
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(error.errors);
  }
}

// safeParse — возвращает объект с результатом, не бросает исключение
const result = UserSchema.safeParse({ name: 123, age: -1 });

if (result.success) {
  console.log(result.data); // типизированные данные
} else {
  console.error(result.error.errors);
  // [
  //   { path: ['name'], message: 'Expected string, received number' },
  //   { path: ['age'], message: 'Number must be greater than or equal to 0' }
  // ]
}

// parseAsync — для схем с асинхронными валидаторами
const data = await UserSchema.parseAsync(rawData);
```

## Кастомная валидация с refine и superRefine

```typescript
import { z } from 'zod';

// refine — добавить одно кастомное правило
const PasswordConfirmSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'], // к какому полю привязать ошибку
  }
);

// superRefine — полный контроль над ошибками
const EventSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).superRefine((data, ctx) => {
  if (data.endDate <= data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Дата окончания должна быть позже даты начала',
      path: ['endDate'],
    });
  }
});

// Асинхронная валидация (например, проверка уникальности в БД)
const UniqueEmailSchema = z.string().email().refine(
  async (email) => {
    const exists = await checkEmailExists(email);
    return !exists;
  },
  { message: 'Email уже занят' }
);
```

## Трансформация данных с transform

```typescript
import { z } from 'zod';

// Преобразование после валидации
const TrimmedStringSchema = z.string().transform((val) => val.trim());

const DateStringSchema = z.string()
  .datetime()
  .transform((val) => new Date(val));

type ParsedDate = z.infer<typeof DateStringSchema>;
// Date — тип изменился после трансформации!

// Сложное преобразование объекта
const ApiUserSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  birth_year: z.number(),
}).transform((data) => ({
  fullName: `${data.first_name} ${data.last_name}`,
  age: new Date().getFullYear() - data.birth_year,
}));

type ApiUser = z.infer<typeof ApiUserSchema>;
// { fullName: string; age: number }

const result = ApiUserSchema.parse({
  first_name: 'Иван',
  last_name: 'Петров',
  birth_year: 1990,
});
// { fullName: 'Иван Петров', age: 36 }
```

## Реальный пример: валидация ответа API

```typescript
import { z } from 'zod';

// Описываем схему ответа API
const ApiResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      completed: z.boolean(),
      userId: z.number(),
    })
  ),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

type ApiResponse = z.infer<typeof ApiResponseSchema>;

async function fetchTodos(page: number): Promise<ApiResponse> {
  const response = await fetch(`/api/todos?page=${page}`);
  const json = await response.json();

  // Валидируем данные — если API вернёт неожиданную структуру,
  // получим понятную ошибку, а не undefined в рантайме
  const result = ApiResponseSchema.safeParse(json);

  if (!result.success) {
    console.error('API вернул неожиданную структуру:', result.error.errors);
    throw new Error('Ошибка валидации данных');
  }

  return result.data;
}
```

## Реальный пример: схема для React-формы

```typescript
import { z } from 'zod';

const RegistrationSchema = z.object({
  username: z
    .string()
    .min(3, 'Минимум 3 символа')
    .max(20, 'Максимум 20 символов')
    .regex(/^[a-zA-Z0-9_]+$/, 'Только латиница, цифры и _'),
  email: z
    .string()
    .email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Минимум 8 символов')
    .regex(/[A-Z]/, 'Нужна заглавная буква')
    .regex(/[0-9]/, 'Нужна цифра'),
  confirmPassword: z.string(),
  role: z.enum(['user', 'admin']).default('user'),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, 'Необходимо согласиться с условиями'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  }
);

type RegistrationFormData = z.infer<typeof RegistrationSchema>;

// Использование с react-hook-form
// import { zodResolver } from '@hookform/resolvers/zod';
// const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormData>({
//   resolver: zodResolver(RegistrationSchema),
// });
```

## Переиспользование схем и модульность

```typescript
import { z } from 'zod';

// Базовые переиспользуемые схемы
const IdSchema = z.string().uuid();
const EmailSchema = z.string().email();
const DateSchema = z.string().datetime().transform((v) => new Date(v));

const TimestampsSchema = z.object({
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// Собираем схемы из кусков
const ArticleSchema = z
  .object({
    id: IdSchema,
    title: z.string().min(1).max(200),
    content: z.string(),
    authorId: IdSchema,
    tags: z.array(z.string()).default([]),
    published: z.boolean().default(false),
  })
  .merge(TimestampsSchema);

// Схема для создания (без id и timestamps)
const CreateArticleSchema = ArticleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Схема для обновления (все поля необязательны)
const UpdateArticleSchema = CreateArticleSchema.partial();

type Article = z.infer<typeof ArticleSchema>;
type CreateArticleDto = z.infer<typeof CreateArticleSchema>;
type UpdateArticleDto = z.infer<typeof UpdateArticleSchema>;
```

## Обработка ошибок

```typescript
import { z } from 'zod';

const Schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

const result = Schema.safeParse({
  name: 123,
  age: 'not a number',
  email: 'invalid',
});

if (!result.success) {
  // Все ошибки сразу — Zod не останавливается на первой
  result.error.errors.forEach((err) => {
    console.log(`Поле: ${err.path.join('.')}, Ошибка: ${err.message}`);
  });
  // Поле: name, Ошибка: Expected string, received number
  // Поле: age, Ошибка: Expected number, received string
  // Поле: email, Ошибка: Invalid email

  // Группировка ошибок по полям
  const fieldErrors = result.error.flatten().fieldErrors;
  // { name: ['Expected string, received number'], age: [...], email: [...] }

  // Форматирование для UI
  const formatted = result.error.format();
  console.log(formatted.email?._errors); // ['Invalid email']
}
```

## Заключение

Zod решает фундаментальную проблему TypeScript: разрыв между статическими типами и реальностью runtime. Ключевые преимущества:

- Единый источник правды — схема определяет и тип, и правила валидации
- `z.infer` автоматически выводит TypeScript-тип из схемы
- `safeParse` даёт полный контроль над обработкой ошибок без try/catch
- Богатый набор методов: `pick`, `omit`, `partial`, `extend`, `merge`
- Трансформации с `transform` меняют форму данных после валидации
- Хорошо интегрируется с react-hook-form, tRPC, FastifyType и другими библиотеками

Zod особенно ценен на границах системы: при получении данных из API, обработке форм, чтении конфигурации из переменных окружения и при работе с внешними источниками данных.

Чтобы углубить знания TypeScript и научиться применять продвинутые инструменты типизации на реальных проектах, смотрите курс на PurpleSchool: https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=zod-type-generation-and-validation