---
metaTitle: Yup - валидация схем в JavaScript и React
metaDescription: Полное руководство по Yup — библиотеке валидации схем для JavaScript. Создание схем, валидация форм, кастомные правила, интеграция с Formik и React Hook Form
author: Олег Марков
title: Yup - валидация схем
preview: Узнайте, как использовать Yup для декларативной валидации данных в JavaScript и React-приложениях — от простых строк до сложных объектных схем с условной логикой
---

# Yup — валидация схем в JavaScript и React

## Введение

Валидация данных — обязательная часть любого серьёзного приложения. Без неё пользователи могут отправить пустые формы, невалидные email-адреса или пароли, которые не соответствуют требованиям безопасности. Ручная проверка каждого поля быстро превращается в громоздкий и сложно поддерживаемый код.

**Yup** — это библиотека для декларативного описания схем валидации объектов на JavaScript. Вместо того чтобы писать условия `if/else` для каждого поля, вы описываете, каким должен быть объект, а Yup проверяет соответствие этому описанию. Yup активно используется совместно с Formik и React Hook Form — популярными библиотеками управления формами в React.

В этой статье вы узнаете, как создавать схемы валидации, работать с разными типами данных, писать кастомные правила и интегрировать Yup в React-приложения.

## Установка

```bash
npm install yup
# или
yarn add yup
```

Если вы используете TypeScript, типы уже включены в пакет — отдельной установки не требуется.

## Основные концепции

Yup строится на нескольких ключевых концепциях:

### Схемы (Schemas)

Схема — это описание ожидаемой структуры и правил для данных. Вы создаёте схему с помощью методов Yup, а затем вызываете `.validate()` для проверки данных.

```javascript
import * as yup from 'yup';

const schema = yup.object({
  name: yup.string().required('Имя обязательно'),
  age: yup.number().min(18, 'Минимальный возраст — 18 лет'),
});
```

### Синхронная и асинхронная валидация

Yup поддерживает оба режима:

```javascript
// Асинхронная (рекомендуется)
try {
  await schema.validate({ name: 'Иван', age: 20 });
  console.log('Данные валидны');
} catch (err) {
  console.error(err.message);
}

// Синхронная
try {
  schema.validateSync({ name: '', age: 15 });
} catch (err) {
  console.error(err.message);
}
```

### ValidationError

Когда данные не проходят валидацию, Yup выбрасывает `ValidationError` с подробным описанием ошибок.

```javascript
try {
  await schema.validate({ name: '', age: 15 });
} catch (err) {
  if (err instanceof yup.ValidationError) {
    console.log(err.path);    // Путь к полю ('name')
    console.log(err.message); // Сообщение об ошибке
    console.log(err.errors);  // Массив всех ошибок
  }
}
```

## Типы данных

### Строки — `yup.string()`

```javascript
const stringSchema = yup.string()
  .required('Поле обязательно')
  .min(3, 'Минимум 3 символа')
  .max(100, 'Максимум 100 символов')
  .email('Некорректный email')
  .url('Некорректный URL')
  .matches(/^[а-яё]+$/i, 'Только кириллица')
  .trim() // Убирает пробелы по краям перед валидацией
  .lowercase(); // Приводит к нижнему регистру
```

### Числа — `yup.number()`

```javascript
const numberSchema = yup.number()
  .required('Введите число')
  .integer('Только целые числа')
  .positive('Число должно быть положительным')
  .min(1, 'Минимум 1')
  .max(1000, 'Максимум 1000')
  .typeError('Введите корректное число');
```

### Булевы значения — `yup.boolean()`

```javascript
const booleanSchema = yup.boolean()
  .required()
  .oneOf([true], 'Необходимо принять условия');
```

### Даты — `yup.date()`

```javascript
const dateSchema = yup.date()
  .required('Введите дату')
  .min(new Date('2020-01-01'), 'Дата не может быть раньше 2020 года')
  .max(new Date(), 'Дата не может быть в будущем')
  .typeError('Введите корректную дату');
```

### Массивы — `yup.array()`

```javascript
const arraySchema = yup.array()
  .of(yup.string().required())
  .min(1, 'Выберите хотя бы один элемент')
  .max(5, 'Максимум 5 элементов')
  .required();
```

### Объекты — `yup.object()`

```javascript
const objectSchema = yup.object({
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  address: yup.object({
    city: yup.string().required(),
    street: yup.string().required(),
  }),
});
```

## Работа с объектными схемами

### Базовый пример формы регистрации

```javascript
import * as yup from 'yup';

const registrationSchema = yup.object({
  username: yup
    .string()
    .required('Введите имя пользователя')
    .min(3, 'Минимум 3 символа')
    .max(20, 'Максимум 20 символов')
    .matches(/^[a-z0-9_]+$/, 'Только латинские буквы, цифры и подчёркивание'),

  email: yup
    .string()
    .required('Введите email')
    .email('Некорректный формат email'),

  password: yup
    .string()
    .required('Введите пароль')
    .min(8, 'Минимум 8 символов')
    .matches(/[A-Z]/, 'Должна быть хотя бы одна заглавная буква')
    .matches(/[0-9]/, 'Должна быть хотя бы одна цифра'),

  confirmPassword: yup
    .string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref('password')], 'Пароли не совпадают'),

  age: yup
    .number()
    .required('Введите возраст')
    .min(18, 'Вам должно быть не менее 18 лет')
    .max(120, 'Введите корректный возраст')
    .integer('Возраст должен быть целым числом'),

  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'Необходимо принять условия использования'),
});

// Использование
async function validateRegistration(data) {
  try {
    const validData = await registrationSchema.validate(data, {
      abortEarly: false, // Собирает все ошибки, а не останавливается на первой
    });
    return { success: true, data: validData };
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors = err.inner.reduce((acc, error) => {
        acc[error.path] = error.message;
        return acc;
      }, {});
      return { success: false, errors };
    }
    throw err;
  }
}
```

## Опция `abortEarly`

По умолчанию Yup останавливается на первой ошибке. Чтобы собрать все ошибки сразу, используйте `abortEarly: false`:

```javascript
await schema.validate(data, { abortEarly: false });

// err.inner содержит массив всех ValidationError
err.inner.forEach(error => {
  console.log(`${error.path}: ${error.message}`);
});
```

## Условная валидация

### `when()` — зависимость от другого поля

```javascript
const schema = yup.object({
  hasJob: yup.boolean(),

  company: yup.string().when('hasJob', {
    is: true,
    then: (schema) => schema.required('Введите название компании'),
    otherwise: (schema) => schema.optional(),
  }),

  salary: yup.number().when('hasJob', {
    is: (val) => val === true,
    then: (schema) => schema.required('Введите зарплату').min(1),
    otherwise: (schema) => schema.optional(),
  }),
});
```

### Зависимость от нескольких полей

```javascript
const schema = yup.object({
  country: yup.string().required(),
  state: yup.string().required(),

  zipCode: yup.string().when(['country', 'state'], {
    is: (country, state) => country === 'US' && state !== '',
    then: (schema) => schema
      .required('Введите ZIP-код')
      .matches(/^\d{5}(-\d{4})?$/, 'Некорректный ZIP-код'),
    otherwise: (schema) => schema.optional(),
  }),
});
```

## Кастомные правила валидации

### Метод `test()`

```javascript
const phoneSchema = yup.string().test(
  'valid-phone',          // Имя теста
  'Некорректный номер телефона', // Сообщение об ошибке
  (value) => {           // Функция проверки
    if (!value) return true; // Пустое значение — пропускаем (для required отдельно)
    return /^\+7\d{10}$/.test(value);
  }
);

// Асинхронный тест (например, проверка уникальности в базе данных)
const usernameSchema = yup.string().test(
  'unique-username',
  'Имя пользователя уже занято',
  async (value) => {
    if (!value) return true;
    const exists = await checkUsernameExists(value);
    return !exists;
  }
);
```

### Доступ к другим полям в `test()`

```javascript
const passwordSchema = yup.object({
  password: yup.string().required(),
  confirmPassword: yup.string().test(
    'passwords-match',
    'Пароли не совпадают',
    function (value) {
      // this.parent содержит все значения объекта
      return value === this.parent.password;
    }
  ),
});
```

## Трансформация данных

Yup не только валидирует, но и может преобразовывать данные:

```javascript
const schema = yup.object({
  email: yup.string().lowercase().trim().email(),
  age: yup.number().positive().integer(),
  tags: yup.array().of(yup.string().trim()),
});

// Данные будут приведены к нужному формату
const result = await schema.cast({
  email: '  USER@EXAMPLE.COM  ',
  age: '25',
  tags: ['  react  ', '  typescript  '],
});
// { email: 'user@example.com', age: 25, tags: ['react', 'typescript'] }
```

## Ленивые схемы

Для сложных сценариев можно использовать `yup.lazy()`:

```javascript
const schema = yup.object({
  value: yup.lazy((val) => {
    if (typeof val === 'string') return yup.string().required();
    if (typeof val === 'number') return yup.number().required();
    return yup.mixed().required();
  }),
});
```

## Интеграция с Formik

Yup прекрасно работает с Formik через параметр `validationSchema`:

```jsx
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';

const loginSchema = yup.object({
  email: yup
    .string()
    .email('Введите корректный email')
    .required('Email обязателен'),
  password: yup
    .string()
    .min(6, 'Минимум 6 символов')
    .required('Пароль обязателен'),
});

function LoginForm() {
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={loginSchema}
      onSubmit={(values) => {
        console.log('Отправка:', values);
      }}
    >
      {({ isSubmitting }) => (
        <Form>
          <div>
            <Field type="email" name="email" placeholder="Email" />
            <ErrorMessage name="email" component="div" className="error" />
          </div>

          <div>
            <Field type="password" name="password" placeholder="Пароль" />
            <ErrorMessage name="password" component="div" className="error" />
          </div>

          <button type="submit" disabled={isSubmitting}>
            Войти
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

## Интеграция с React Hook Form

С React Hook Form используется метод `yupResolver`:

```jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  firstName: yup.string().required('Введите имя'),
  lastName: yup.string().required('Введите фамилию'),
  email: yup.string().email('Некорректный email').required('Введите email'),
});

function RegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('firstName')} placeholder="Имя" />
      {errors.firstName && <p>{errors.firstName.message}</p>}

      <input {...register('lastName')} placeholder="Фамилия" />
      {errors.lastName && <p>{errors.lastName.message}</p>}

      <input {...register('email')} placeholder="Email" />
      {errors.email && <p>{errors.email.message}</p>}

      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

## Работа с TypeScript

Yup хорошо интегрируется с TypeScript через метод `InferType`:

```typescript
import * as yup from 'yup';

const userSchema = yup.object({
  id: yup.number().required(),
  name: yup.string().required(),
  email: yup.string().email().required(),
  role: yup.mixed<'admin' | 'user'>().oneOf(['admin', 'user']).required(),
  createdAt: yup.date().required(),
});

// Автоматически выводим тип из схемы
type User = yup.InferType<typeof userSchema>;
// {
//   id: number;
//   name: string;
//   email: string;
//   role: 'admin' | 'user';
//   createdAt: Date;
// }

async function processUser(data: unknown): Promise<User> {
  return await userSchema.validate(data);
}
```

## Повторное использование схем

### Расширение схем через `concat()`

```javascript
const baseSchema = yup.object({
  name: yup.string().required(),
  email: yup.string().email().required(),
});

const adminSchema = baseSchema.concat(
  yup.object({
    role: yup.string().oneOf(['admin', 'superadmin']).required(),
    permissions: yup.array().of(yup.string()).min(1),
  })
);
```

### Частичные схемы для обновления

```javascript
const updateSchema = baseSchema.partial(); // Все поля становятся необязательными
```

## Локализация сообщений об ошибках

```javascript
import { setLocale } from 'yup';

setLocale({
  mixed: {
    required: 'Это поле обязательно',
    oneOf: 'Выберите допустимое значение',
    notType: 'Некорректный формат данных',
  },
  string: {
    min: ({ min }) => `Минимум ${min} символов`,
    max: ({ max }) => `Максимум ${max} символов`,
    email: 'Введите корректный email',
    url: 'Введите корректный URL',
  },
  number: {
    min: ({ min }) => `Значение должно быть не менее ${min}`,
    max: ({ max }) => `Значение должно быть не более ${max}`,
    integer: 'Значение должно быть целым числом',
    positive: 'Значение должно быть положительным',
  },
});
```

## Заключение

Yup — мощный и гибкий инструмент для валидации данных в JavaScript-приложениях. Главные его достоинства:

- **Декларативный подход** — схемы читаются как документация
- **Богатый API** — встроенные валидаторы для всех распространённых случаев
- **Кастомизируемость** — лёгкое добавление собственных правил через `test()`
- **Интеграция с экосистемой** — нативная поддержка в Formik и React Hook Form
- **TypeScript** — автоматический вывод типов из схем

Начните с простых схем для отдельных полей, а затем переходите к сложным объектным схемам с условной логикой по мере роста требований вашего приложения.
