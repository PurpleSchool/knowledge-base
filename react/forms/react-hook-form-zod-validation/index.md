---
metaTitle: "React Hook Form + Zod валидация — интеграция форм"
metaDescription: "Полное руководство по интеграции React Hook Form с Zod валидацией: схемы, типы, вложенные объекты, массивы и обработка ошибок."
author: "Антон Ларичев"
title: "React Hook Form с Zod: интеграция и валидация форм"
preview: "Как подключить Zod к React Hook Form, создавать типобезопасные схемы валидации и строить надёжные формы с минимальным кодом."
---

## Зачем связывать React Hook Form и Zod

React Hook Form решает задачу управления состоянием формы и сбора данных с минимальным числом ре-рендеров. Zod решает задачу описания структуры данных и их проверки с автоматическим выводом TypeScript-типов. Вместе они покрывают весь цикл работы с формой: от ввода до валидированного, типобезопасного значения.

Обычный подход без этой связки выглядит так:
- вручную описывать типы для состояния формы;
- дублировать правила валидации в нескольких местах;
- отдельно писать проверки для TypeScript и для рантайма.

После интеграции схема Zod становится единственным источником истины: из неё автоматически получается тип данных формы и логика проверки.

## Установка

```bash
npm install react-hook-form zod @hookform/resolvers
```

Пакет `@hookform/resolvers` — официальный мост между React Hook Form и различными библиотеками валидации, включая Zod.

## Первая форма с Zod-схемой

Рассмотрим форму регистрации с полями email и пароль.

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registrationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Введите корректный email'),
  password: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export function RegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationFormData) => {
    // data уже прошёл валидацию и имеет тип RegistrationFormData
    await registerUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <p>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password">Пароль</label>
        <input id="password" type="password" {...register('password')} />
        {errors.password && <p>{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Отправка...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
```

Ключевые моменты:
- `zodResolver(registrationSchema)` передаётся в опцию `resolver` — это единственное место, где нужно упомянуть Zod;
- `z.infer<typeof registrationSchema>` выводит TypeScript-тип из схемы, дублирование отсутствует;
- сообщения об ошибках задаются прямо в схеме и автоматически попадают в `errors`.

## Валидация с взаимозависимыми полями

Часто нужно проверять поля в связке — например, убедиться, что два поля пароля совпадают. Для этого используется метод `.refine()` или `.superRefine()`.

```typescript
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z
      .string()
      .min(8, 'Минимум 8 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Новый пароль должен отличаться от текущего',
    path: ['newPassword'],
  });

type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
```

Параметр `path` в `.refine()` указывает, к какому полю привязать ошибку. Если его опустить, ошибка попадёт в корень формы (`errors.root`).

## Вложенные объекты

Zod и React Hook Form одинаково хорошо работают с вложенными структурами.

```typescript
const checkoutSchema = z.object({
  customer: z.object({
    firstName: z.string().min(2, 'Введите имя'),
    lastName: z.string().min(2, 'Введите фамилию'),
    phone: z
      .string()
      .regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX'),
  }),
  address: z.object({
    city: z.string().min(1, 'Укажите город'),
    street: z.string().min(1, 'Укажите улицу'),
    apartment: z.string().optional(),
  }),
});

type CheckoutData = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input
        {...register('customer.firstName')}
        placeholder="Имя"
      />
      {errors.customer?.firstName && (
        <p>{errors.customer.firstName.message}</p>
      )}

      <input
        {...register('address.city')}
        placeholder="Город"
      />
      {errors.address?.city && (
        <p>{errors.address.city.message}</p>
      )}
    </form>
  );
}
```

Точечная нотация в `register('customer.firstName')` автоматически создаёт вложенную структуру в объекте данных формы.

## Динамические массивы полей

Для работы с массивами React Hook Form предоставляет хук `useFieldArray`, а Zod описывает схему элемента.

```typescript
const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Выберите товар'),
        quantity: z
          .number()
          .int('Только целые числа')
          .min(1, 'Минимальное количество — 1')
          .max(99, 'Максимальное количество — 99'),
        note: z.string().max(200, 'Не более 200 символов').optional(),
      })
    )
    .min(1, 'Добавьте хотя бы один товар'),
});

type OrderData = z.infer<typeof orderSchema>;

export function OrderForm() {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderData>({
    resolver: zodResolver(orderSchema),
    defaultValues: { items: [{ productId: '', quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input
            {...register(`items.${index}.productId`)}
            placeholder="ID товара"
          />
          {errors.items?.[index]?.productId && (
            <p>{errors.items[index].productId.message}</p>
          )}

          <input
            type="number"
            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
          />
          {errors.items?.[index]?.quantity && (
            <p>{errors.items[index].quantity.message}</p>
          )}

          <button type="button" onClick={() => remove(index)}>
            Удалить
          </button>
        </div>
      ))}

      {errors.items?.root && <p>{errors.items.root.message}</p>}

      <button
        type="button"
        onClick={() => append({ productId: '', quantity: 1 })}
      >
        Добавить товар
      </button>

      <button type="submit">Оформить заказ</button>
    </form>
  );
}
```

Обратите внимание на `valueAsNumber: true` в опциях `register` — HTML-инпут всегда возвращает строку, эта опция преобразует значение в число до передачи в Zod.

## Преобразование данных с помощью .transform()

Zod позволяет преобразовывать данные в процессе валидации. Это полезно, когда форма работает со строками, но API ожидает другие типы.

```typescript
const profileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .transform((val) => val.toLowerCase().trim()),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты: ГГГГ-ММ-ДД')
    .transform((val) => new Date(val)),
  tags: z
    .string()
    .transform((val) =>
      val
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    ),
});

// Тип входных данных (до трансформации)
type ProfileInput = z.input<typeof profileSchema>;
// Тип выходных данных (после трансформации)
type ProfileOutput = z.output<typeof profileSchema>;
```

При использовании `.transform()` тип `input` и `output` расходятся. Для `useForm` нужно передавать входной тип:

```typescript
const form = useForm<ProfileInput, unknown, ProfileOutput>({
  resolver: zodResolver(profileSchema),
});

const onSubmit: SubmitHandler<ProfileOutput> = (data) => {
  // data.username — строка в нижнем регистре
  // data.birthDate — объект Date
  // data.tags — массив строк
};
```

## Условная валидация

Иногда обязательность поля зависит от значения другого поля. Для этого подходит `.superRefine()` или `z.discriminatedUnion()`.

```typescript
const deliverySchema = z
  .object({
    deliveryType: z.enum(['pickup', 'courier']),
    address: z.string().optional(),
    timeSlot: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType === 'courier') {
      if (!data.address || data.address.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Для курьерской доставки укажите адрес',
          path: ['address'],
        });
      }
      if (!data.timeSlot) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Выберите временной слот',
          path: ['timeSlot'],
        });
      }
    }
  });
```

Alternative: `discriminatedUnion` для взаимно исключающих вариантов:

```typescript
const paymentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('card'),
    cardNumber: z.string().regex(/^\d{16}$/, '16 цифр без пробелов'),
    cvv: z.string().regex(/^\d{3,4}$/, '3 или 4 цифры'),
  }),
  z.object({
    method: z.literal('cash'),
    changeFrom: z.number().positive('Сумма должна быть положительной').optional(),
  }),
]);
```

## Значения по умолчанию и defaultValues

Print `defaultValues` лучше согласовывать со схемой через `z.input`:

```typescript
const articleSchema = z.object({
  title: z.string().min(5, 'Минимум 5 символов'),
  content: z.string().min(100, 'Минимум 100 символов'),
  published: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

type ArticleInput = z.input<typeof articleSchema>;

const form = useForm<ArticleInput>({
  resolver: zodResolver(articleSchema),
  defaultValues: {
    title: '',
    content: '',
    published: false,
    tags: [],
  },
});
```

Если форма используется для редактирования, передайте существующие данные:

```typescript
const form = useForm<ArticleInput>({
  resolver: zodResolver(articleSchema),
  defaultValues: async () => {
    const article = await fetchArticle(articleId);
    return article;
  },
});
```

## Переиспользование частей схемы

Zod позволяет выносить части схемы в отдельные переменные и переиспользовать их.

```typescript
const emailField = z
  .string()
  .min(1, 'Email обязателен')
  .email('Некорректный email');

const passwordField = z
  .string()
  .min(8, 'Минимум 8 символов')
  .regex(/[A-Z]/, 'Нужна заглавная буква')
  .regex(/[0-9]/, 'Нужна цифра');

const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

const registrationSchema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: passwordField,
    name: z.string().min(2, 'Минимум 2 символа'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });
```

## Отображение ошибок: вспомогательный компонент

Чтобы не повторять условный рендеринг в каждом поле, вынесите его в отдельный компонент:

```typescript
import { FieldError } from 'react-hook-form';

interface FieldErrorMessageProps {
  error?: FieldError;
}

function FieldErrorMessage({ error }: FieldErrorMessageProps) {
  if (!error) return null;
  return (
    <p role="alert" style={{ color: 'red', fontSize: '0.875rem' }}>
      {error.message}
    </p>
  );
}

// Использование
<input {...register('email')} />
<FieldErrorMessage error={errors.email} />
```

## Типичные ошибки и их решения

**Числовые поля возвращают NaN.** HTML-инпут всегда передаёт строку. Решение: добавить `valueAsNumber: true` в `register` или использовать `z.coerce.number()` в схеме.

```typescript
// Вариант 1: через register
<input type="number" {...register('age', { valueAsNumber: true })} />

// Вариант 2: через Zod
age: z.coerce.number().min(0).max(120)
```

**Чекбоксы не проходят валидацию.** Булевы поля нужно явно указывать:

```typescript
agreed: z.literal(true, {
  errorMap: () => ({ message: 'Необходимо принять условия' }),
})
```

**Опциональные поля с пустой строкой.** Пустая строка — это не `undefined`, поэтому `z.string().optional()` её пропустит. Если нужно принимать пустую строку как «не заполнено»:

```typescript
phone: z.string().optional().or(z.literal(''))
// или
phone: z.union([z.string().min(10), z.literal('')])
```

## Итог

Интеграция React Hook Form с Zod строится на трёх принципах:

1. **Единый источник истины** — схема Zod описывает и структуру, и правила валидации, и TypeScript-тип одновременно.
2. **Минимальный клей** — `zodResolver` из `@hookform/resolvers` — единственное, что нужно для связки.
3. **Гибкость без сложности** — вложенные объекты, массивы, условная валидация и трансформации работают через стандартные API Zod без специфических адаптеров.

Результат — формы, которые сложно сломать: данные, дошедшие до `onSubmit`, гарантированно соответствуют схеме и имеют правильный тип.

Чтобы разобраться в React Hook Form, Zod и других инструментах экосистемы React, приходите на курс [React — с нуля до мастера](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-hook-form-zod-validation) на PurpleSchool.