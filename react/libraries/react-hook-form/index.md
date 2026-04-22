---
metaTitle: React Hook Form — валидация форм в React с примерами
metaDescription: React Hook Form — установка, useForm, register, handleSubmit, Controller, валидация с Zod. Замена Formik. Примеры с TypeScript и React.
author: Антон Ларичев
title: React Hook Form — валидация форм в React
preview: Полное руководство по React Hook Form — useForm, register, Controller, интеграция с Zod, TypeScript. Создайте форму с валидацией за 15 минут.
---

## Введение

React Hook Form (RHF) — самая популярная библиотека для работы с формами в React. В 2024 году она вытесняет Formik как de-facto стандарт: в разы меньше ре-рендеров, меньше кода, нативная интеграция с TypeScript и отличная поддержка библиотек валидации (Zod, Yup, Joi).

По данным npm trends, React Hook Form загружают в 3 раза чаще, чем Formik.

**Ключевые преимущества перед Formik:**
* Меньше ре-рендеров — подписка на конкретные поля, а не весь стейт
* Меньше кода — декларативный `register` вместо `Formik.Field`
* Нативный TypeScript без лишних типов
* Работает с неконтролируемыми компонентами (нет `value`/`onChange` на каждом поле)

## Установка

```bash
npm install react-hook-form

# Для валидации через Zod
npm install @hookform/resolvers zod
```

## Базовый пример

```tsx
import { useForm, SubmitHandler } from 'react-hook-form';

type LoginFormData = {
  email: string;
  password: string;
};

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    // data — типизированный объект { email: string, password: string }
    await login(data.email, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('email', {
            required: 'Email обязателен',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Неверный формат email'
            }
          })}
          placeholder="Email"
        />
        {errors.email && <p>{errors.email.message}</p>}
      </div>

      <div>
        <input
          type="password"
          {...register('password', {
            required: 'Пароль обязателен',
            minLength: {
              value: 8,
              message: 'Минимум 8 символов'
            }
          })}
          placeholder="Пароль"
        />
        {errors.password && <p>{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
}
```

## Основные концепции

### useForm

Главный хук библиотеки. Возвращает методы и состояние формы:

```tsx
const {
  register,         // регистрирует поле
  handleSubmit,     // обёртка для onSubmit с валидацией
  formState,        // { errors, isSubmitting, isDirty, isValid, ... }
  watch,            // подписка на значения полей
  setValue,         // программная установка значения
  getValues,        // получение текущих значений
  reset,            // сброс формы
  setError,         // установка ошибки вручную
  clearErrors,      // очистка ошибок
  trigger,          // ручной запуск валидации
} = useForm<FormData>({
  defaultValues: {  // начальные значения
    email: '',
    role: 'user'
  },
  mode: 'onBlur'    // когда валидировать: onChange | onBlur | onSubmit | all
});
```

Если вы хотите детально изучить React, включая работу с формами и хуками — приходите на наш курс [React с нуля](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=article&utm_campaign=react-hook-form). На курсе 300+ уроков, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### register

Подключает поле к форме:

```tsx
// Регистрация с правилами валидации
<input {...register('fieldName', {
  required: 'Обязательное поле',
  minLength: { value: 3, message: 'Минимум 3 символа' },
  maxLength: { value: 50, message: 'Максимум 50 символов' },
  min: { value: 0, message: 'Не может быть отрицательным' },
  max: { value: 100, message: 'Не более 100' },
  pattern: { value: /\d+/, message: 'Только цифры' },
  validate: (value) => value !== 'admin' || 'Нельзя использовать "admin"',
  // Несколько правил validate:
  validate: {
    notAdmin: (v) => v !== 'admin' || 'Нельзя "admin"',
    notEmpty: (v) => v.trim().length > 0 || 'Нельзя пустую строку'
  }
})} />
```

### watch

Подписка на изменения полей без ре-рендера всей формы:

```tsx
function PasswordForm() {
  const { register, watch, formState: { errors } } = useForm();
  const password = watch('password'); // перерендер только при изменении password

  return (
    <>
      <input type="password" {...register('password', { required: true })} />
      <input
        type="password"
        {...register('confirmPassword', {
          validate: (value) => value === password || 'Пароли не совпадают'
        })}
      />
      {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
    </>
  );
}
```

## Controller — для UI-компонентов

Когда UI-компонент не поддерживает нативные `ref` (компоненты из MUI, Ant Design, react-select, кастомные инпуты), используйте `Controller`:

```tsx
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import DatePicker from 'react-datepicker';

function AdvancedForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      country: null,
      birthDate: null
    }
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      {/* react-select */}
      <Controller
        name="country"
        control={control}
        rules={{ required: 'Выберите страну' }}
        render={({ field, fieldState }) => (
          <>
            <Select
              {...field}
              options={[
                { value: 'ru', label: 'Россия' },
                { value: 'us', label: 'США' }
              ]}
              placeholder="Выберите страну"
            />
            {fieldState.error && <p>{fieldState.error.message}</p>}
          </>
        )}
      />

      {/* react-datepicker */}
      <Controller
        name="birthDate"
        control={control}
        render={({ field }) => (
          <DatePicker
            selected={field.value}
            onChange={field.onChange}
            dateFormat="dd.MM.yyyy"
          />
        )}
      />

      <button type="submit">Отправить</button>
    </form>
  );
}
```

## Интеграция с Zod

Zod + RHF — мощная связка для схемной валидации:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Определяем схему валидации
const registerSchema = z.object({
  name: z.string().min(2, 'Имя минимум 2 символа').max(50),
  email: z.string().email('Неверный формат email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Пароли не совпадают',
    path: ['confirmPassword']
  }
);

// Тип автоматически выводится из схемы
type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = (data: RegisterFormData) => {
    console.log(data); // данные прошли валидацию
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Имя" />
      {errors.name && <p>{errors.name.message}</p>}

      <input {...register('email')} placeholder="Email" />
      {errors.email && <p>{errors.email.message}</p>}

      <input type="password" {...register('password')} placeholder="Пароль" />
      {errors.password && <p>{errors.password.message}</p>}

      <input type="password" {...register('confirmPassword')} placeholder="Повтор пароля" />
      {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}

      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

## useFieldArray — массивы полей

Для динамических списков (добавление/удаление строк):

```tsx
import { useForm, useFieldArray } from 'react-hook-form';

type FormData = {
  skills: { name: string; level: number }[];
};

function SkillsForm() {
  const { register, control, handleSubmit } = useForm<FormData>({
    defaultValues: { skills: [{ name: '', level: 1 }] }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skills'
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`skills.${index}.name`)} placeholder="Навык" />
          <input
            type="number"
            {...register(`skills.${index}.level`, { valueAsNumber: true })}
            min={1}
            max={10}
          />
          <button type="button" onClick={() => remove(index)}>Удалить</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: '', level: 1 })}>
        Добавить навык
      </button>
      <button type="submit">Сохранить</button>
    </form>
  );
}
```

## Частые ошибки

* **Использование `Controller` там, где достаточно `register`.** Для нативных HTML-инпутов (`input`, `textarea`, `select`) используйте `register`. `Controller` — только для кастомных UI-компонентов.

* **Отсутствие `key` на элементах `useFieldArray`.** Используйте `field.id` (не `index`) как key — это уникальный идентификатор, который RHF генерирует для каждого элемента массива.

* **`valueAsNumber` для числовых полей.** По умолчанию `register` возвращает строки. Для чисел добавьте `{ valueAsNumber: true }`, иначе придёт `"5"` вместо `5`.

* **Ошибки сервера не показываются.** После неудачного запроса используйте `setError('root', { message: 'Ошибка сервера' })` для глобальных ошибок или `setError('email', { message: 'Email занят' })` для поля.

## Часто задаваемые вопросы

**React Hook Form vs Formik — что выбрать?**

React Hook Form предпочтительнее для новых проектов: меньше ре-рендеров, меньше кода, лучшая TypeScript-интеграция. Formik можно оставить в legacy-коде, но активно не рекомендуется начинать новые проекты с ним.

**Как получить значения формы вне handleSubmit?**

Используйте `getValues()` — синхронно возвращает текущие значения без подписки. Или `watch()` — возвращает значения и подписывается на изменения (вызывает ре-рендер).

**Как сбросить форму к начальным значениям?**

`reset()` — сбросит к `defaultValues`. `reset(newValues)` — установит новые значения и сбросит состояние.

## Заключение

React Hook Form — современный стандарт для работы с формами в React. Минимум ре-рендеров, лаконичный API и отличная интеграция с Zod делают его лучшим выбором для большинства проектов.

Для углублённого изучения React рекомендуем курс [React с нуля](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=article&utm_campaign=react-hook-form). В первых модулях доступно бесплатное содержание — познакомьтесь с форматом обучения до покупки полного доступа.
