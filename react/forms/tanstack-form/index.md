---
metaTitle: "TanStack Form: управление формами в React"
metaDescription: "TanStack Form — типобезопасная библиотека для управления формами в React с валидацией, async-проверками и полным контролем состояния."
author: "Антон Ларичев"
title: "TanStack Form: управление формами в React"
preview: "Подробное руководство по TanStack Form: установка, создание форм, валидация, async-проверки и управление состоянием на практических примерах."
---

## Что такое TanStack Form

TanStack Form — это headless-библиотека для управления формами, разработанная командой TanStack (авторы TanStack Query, TanStack Table и других популярных инструментов). Библиотека построена на принципах строгой типобезопасности и не привязана к конкретному UI-фреймворку: она поддерживает React, Vue, Angular, Solid и Svelte.

Основные преимущества TanStack Form перед конкурентами:

- Полная типобезопасность на основе TypeScript — типы выводятся автоматически из схемы начальных значений
- Headless-подход — никаких встроенных UI-компонентов, полная свобода в разметке
- Гранулярные ре-рендеры — компоненты обновляются только при изменении связанных полей
- Встроенная поддержка синхронной и асинхронной валидации
- Нет внешних зависимостей, минимальный размер бандла

## Установка и начальная настройка

Для React-проектов устанавливается адаптер `@tanstack/react-form`:

```bash
npm install @tanstack/react-form
```

Если вы хотите использовать схемы валидации через Zod или Valibot, установите соответствующие адаптеры:

```bash
npm install @tanstack/zod-form-adapter zod
# или
npm install @tanstack/valibot-form-adapter valibot
```

## Создание первой формы

Основной хук для работы с формами — `useForm`. Он принимает объект конфигурации с начальными значениями и обработчиком отправки:

```typescript
import { useForm } from '@tanstack/react-form'

function RegistrationForm() {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await registerUser(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="username"
        children={(field) => (
          <div>
            <label htmlFor={field.name}>Имя пользователя</label>
            <input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      />

      <form.Field
        name="email"
        children={(field) => (
          <div>
            <label htmlFor={field.name}>Email</label>
            <input
              id={field.name}
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      />

      <button type="submit">Зарегистрироваться</button>
    </form>
  )
}
```

Компонент `form.Field` принимает проп `name`, который строго типизирован — TypeScript не позволит указать несуществующее поле. Через render-prop `children` передаётся объект поля с его состоянием и обработчиками.

## Состояние поля и формы

### Состояние отдельного поля

Каждое поле через `field.state` предоставляет полную информацию о текущем состоянии:

```typescript
<form.Field
  name="email"
  children={(field) => (
    <div>
      <input
        value={field.state.value}          // текущее значение
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
      {/* Ошибки валидации поля */}
      {field.state.meta.errors.length > 0 && (
        <span>{field.state.meta.errors.join(', ')}</span>
      )}
      {/* Статус валидации */}
      {field.state.meta.isValidating && <span>Проверка...</span>}
      {/* Было ли поле затронуто */}
      {field.state.meta.isTouched && <span>Поле изменено</span>}
    </div>
  )}
/>
```

### Состояние всей формы

Объект `form` даёт доступ к агрегированному состоянию формы через `form.state`:

```typescript
function FormStatus() {
  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting]}
      children={([canSubmit, isSubmitting]) => (
        <button type="submit" disabled={!canSubmit}>
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>
      )}
    />
  )
}
```

`form.Subscribe` — ключевой инструмент оптимизации. Компонент перерисовывается только при изменении значений, выбранных селектором. Это позволяет избежать лишних ре-рендеров родительского компонента.

## Валидация полей

### Синхронная валидация

Валидаторы передаются через проп `validators` компонента `form.Field`. Каждый валидатор — функция, возвращающая строку с ошибкой или `undefined`:

```typescript
<form.Field
  name="username"
  validators={{
    onChange: ({ value }) => {
      if (!value) return 'Имя пользователя обязательно'
      if (value.length < 3) return 'Минимум 3 символа'
      if (value.length > 20) return 'Максимум 20 символов'
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        return 'Только латинские буквы, цифры и символ _'
      }
    },
    onBlur: ({ value }) => {
      if (value.startsWith('_')) return 'Имя не может начинаться с _'
    },
  }}
  children={(field) => (
    <div>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
      {field.state.meta.errors.map((error, i) => (
        <p key={i} style={{ color: 'red' }}>{error}</p>
      ))}
    </div>
  )}
/>
```

Доступные события для валидации:
- `onChange` — при каждом изменении значения
- `onBlur` — при потере фокуса
- `onMount` — при монтировании компонента
- `onSubmit` — только при попытке отправки формы

### Асинхронная валидация

Асинхронные валидаторы работают так же, но возвращают `Promise`. TanStack Form автоматически управляет состоянием `isValidating`:

```typescript
<form.Field
  name="username"
  validators={{
    onChange: ({ value }) => {
      if (value.length < 3) return 'Минимум 3 символа'
    },
    onChangeAsync: async ({ value }) => {
      // Проверка уникальности на сервере
      const isAvailable = await checkUsernameAvailability(value)
      if (!isAvailable) return 'Это имя уже занято'
    },
    onChangeAsyncDebounceMs: 500, // дебаунс 500мс
  }}
  children={(field) => (
    <div>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
      {field.state.meta.isValidating && (
        <span>Проверка доступности...</span>
      )}
      {field.state.meta.errors.map((error, i) => (
        <p key={i}>{error}</p>
      ))}
    </div>
  )}
/>
```

Свойство `onChangeAsyncDebounceMs` устанавливает задержку перед выполнением асинхронного валидатора — это предотвращает лишние запросы к серверу при быстром вводе.

## Интеграция со схемами валидации

### Валидация через Zod

ТанStack Form поддерживает интеграцию с Zod через адаптер `zodValidator`:

```typescript
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  age: z.number().min(18, 'Необходимо быть старше 18 лет'),
})

function LoginForm() {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      age: 0,
    },
    onSubmit: async ({ value }) => {
      console.log(value)
    },
    validatorAdapter: zodValidator(),
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field
        name="email"
        validators={{
          onChange: userSchema.shape.email,
        }}
        children={(field) => (
          <div>
            <input
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </div>
        )}
      />
      <button type="submit">Войти</button>
    </form>
  )
}
```

## Работа с массивами полей

ТанStack Form предоставляет удобный API для работы с динамическими списками через `form.Field` с вложенным использованием:

```typescript
function InviteForm() {
  const form = useForm({
    defaultValues: {
      teamName: '',
      members: [{ email: '', role: 'viewer' as const }],
    },
    onSubmit: async ({ value }) => {
      await inviteTeamMembers(value)
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field
        name="teamName"
        children={(field) => (
          <input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder="Название команды"
          />
        )}
      />

      <form.Field name="members">
        {(membersField) => (
          <div>
            {membersField.state.value.map((_, index) => (
              <div key={index}>
                <form.Field
                  name={`members[${index}].email`}
                  children={(field) => (
                    <input
                      type="email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Email участника"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() =>
                    membersField.removeValue(index)
                  }
                >
                  Удалить
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                membersField.pushValue({ email: '', role: 'viewer' })
              }
            >
              Добавить участника
            </button>
          </div>
        )}
      </form.Field>

      <button type="submit">Отправить приглашения</button>
    </form>
  )
}
```

Методы для управления массивом: `pushValue`, `removeValue`, `insertValue`, `swapValues`, `moveValue`.

## Программное управление формой

Помимо пользовательских событий, форму можно контролировать программно:

```typescript
function ProfileForm() {
  const form = useForm({
    defaultValues: {
      name: '',
      bio: '',
    },
    onSubmit: async ({ value }) => {
      await updateProfile(value)
    },
  })

  const loadProfile = async () => {
    const profile = await fetchCurrentUser()
    // Установить значения всей формы
    form.reset({
      name: profile.name,
      bio: profile.bio,
    })
  }

  const resetToDefaults = () => {
    // Сброс к defaultValues
    form.reset()
  }

  const setNameManually = () => {
    // Установить значение конкретного поля
    form.setFieldValue('name', 'Новое имя')
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      {/* поля формы */}
      <div>
        <button type="button" onClick={loadProfile}>Загрузить профиль</button>
        <button type="button" onClick={resetToDefaults}>Сбросить</button>
        <button type="submit">Сохранить</button>
      </div>
    </form>
  )
}
```

## Выделение переиспользуемых полей

Поскольку TanStack Form headless, удобно создавать собственные компоненты полей, оборачивая логику и разметку:

```typescript
import { useForm, FieldApi } from '@tanstack/react-form'

interface TextFieldProps {
  field: FieldApi<any, any, any, any, string>
  label: string
  type?: string
  placeholder?: string
}

function TextField({ field, label, type = 'text', placeholder }: TextFieldProps) {
  const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0

  return (
    <div className={`field ${hasError ? 'field--error' : ''}`}>
      <label htmlFor={field.name}>{label}</label>
      <input
        id={field.name}
        type={type}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        aria-invalid={hasError}
      />
      {hasError && (
        <ul className="field__errors">
          {field.state.meta.errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Использование в форме
function ContactForm() {
  const form = useForm({
    defaultValues: { name: '', email: '', message: '' },
    onSubmit: async ({ value }) => console.log(value),
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field
        name="name"
        validators={{ onChange: ({ value }) => !value ? 'Обязательное поле' : undefined }}
        children={(field) => <TextField field={field} label="Имя" />}
      />
      <form.Field
        name="email"
        validators={{ onChange: ({ value }) => !value.includes('@') ? 'Некорректный email' : undefined }}
        children={(field) => <TextField field={field} label="Email" type="email" />}
      />
      <button type="submit">Отправить</button>
    </form>
  )
}
```

## Сравнение с React Hook Form

TanStack Form и React Hook Form решают одну задачу, но по-разному:

**React Hook Form** использует uncontrolled-компоненты через `ref` — это даёт отличную производительность по умолчанию, но TypeScript-интеграция требует ручной аннотации типов через дженерики.

**TanStack Form** работает с controlled-компонентами, но оптимизирует ре-рендеры через `form.Subscribe` и гранулярную подписку. Типы выводятся автоматически из `defaultValues` — это ключевое преимущество при работе со сложными вложенными структурами.

ТанStack Form предпочтительнее, когда:
- Проект активно использует TypeScript и важна точная типизация форм
- Формы содержат сложную вложенную структуру или динамические массивы
- Требуется асинхронная валидация с debounce из коробки
- Нужна интеграция с несколькими фреймворками в монорепозитории

## Итоги

TanStack Form — современная альтернатива для управления формами в React, которая ставит во главу угла типобезопасность и производительность. Headless-архитектура оставляет полный контроль над разметкой, а встроенные механизмы синхронной и асинхронной валидации покрывают большинство практических сценариев без дополнительных зависимостей.

Ключевые концепции для запоминания: `useForm` создаёт экземпляр формы, `form.Field` управляет отдельными полями, `form.Subscribe` оптимизирует ре-рендеры, а `validators` принимает как обычные функции, так и схемы Zod.

Чтобы глубже погрузиться в работу с формами и другими аспектами React, изучите курс по React на PurpleSchool: [React — полный курс](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=tanstack-form).