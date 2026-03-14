---
metaTitle: "useFormStatus в React — отслеживание статуса отправки формы"
metaDescription: "Полное руководство по хуку useFormStatus в React 19. Узнайте, как отслеживать состояние отправки формы, блокировать кнопки во время загрузки и улучшать UX форм с Server Actions."
author: Олег Марков
title: useFormStatus - отслеживание статуса отправки формы
preview: Разбираемся с хуком useFormStatus из React DOM, который позволяет дочерним компонентам формы узнавать о статусе её отправки. Вы научитесь отображать индикаторы загрузки, блокировать повторные отправки и строить удобные переиспользуемые компоненты кнопок.
---

## Введение

Работа с формами — одна из самых частых задач в разработке веб-приложений. При отправке формы пользователь должен видеть, что запрос обрабатывается: кнопка блокируется, появляется спиннер, поля становятся неактивными. До React 19 для этого приходилось вручную управлять состоянием загрузки и пробрасывать его через пропсы.

Хук `useFormStatus` решает эту проблему элегантно: он позволяет любому дочернему компоненту формы получить информацию о текущем статусе её отправки — без лишних пропсов и передачи состояния вручную.

Если вы хотите глубже изучить React и современные подходы к разработке форм, рекомендую [курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useFormStatus).

## Что такое useFormStatus

`useFormStatus` — это хук из пакета `react-dom`, появившийся в React 19. Он предоставляет информацию о состоянии ближайшей родительской формы (`<form>`). Хук возвращает объект с полями, описывающими текущий статус отправки.

**Ключевая особенность:** хук работает только внутри компонента, который является дочерним по отношению к элементу `<form>`. Он не работает в самом компоненте формы — только в его потомках.

### Синтаксис

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  // ...
}
```

### Возвращаемые значения

Хук возвращает объект со следующими полями:

| Поле | Тип | Описание |
|------|-----|----------|
| `pending` | `boolean` | `true`, если форма сейчас отправляется |
| `data` | `FormData \| null` | Данные, которые отправляет форма |
| `method` | `string` | HTTP-метод формы (`"get"` или `"post"`) |
| `action` | `string \| function \| null` | Атрибут `action` формы или Server Action |

Самое используемое поле — `pending`. Именно оно позволяет реагировать на момент ожидания ответа сервера.

## Зачем нужен useFormStatus

Рассмотрим типичную проблему: нужно заблокировать кнопку отправки, пока форма обрабатывается, и показать текст «Отправка...».

### Без useFormStatus (классический подход)

```tsx
import React, { useState } from 'react';

function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sendContactForm(new FormData(e.target as HTMLFormElement));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="Email" />
      <textarea name="message" placeholder="Сообщение" />
      {/* Приходится передавать isSubmitting в кнопку */}
      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Отправка...' : 'Отправить'}
    </button>
  );
}
```

Здесь `isSubmitting` нужно явно передавать через пропсы. При глубокой вложенности компонентов это превращается в «пробрасывание пропсов» (prop drilling).

### С useFormStatus (современный подход)

```tsx
import { useFormStatus } from 'react-dom';

// Компонент кнопки сам знает о статусе формы
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Отправка...' : 'Отправить'}
    </button>
  );
}

function ContactForm() {
  async function handleSubmit(formData: FormData) {
    await sendContactForm(formData);
  }

  return (
    <form action={handleSubmit}>
      <input name="email" type="email" placeholder="Email" />
      <textarea name="message" placeholder="Сообщение" />
      {/* Кнопке не нужны дополнительные пропсы */}
      <SubmitButton />
    </form>
  );
}
```

Кнопка сама определяет свой статус — код стал чище, а компонент переиспользуемым.

## Основные примеры использования

### Пример 1: Кнопка отправки с индикатором загрузки

Самый распространённый кейс — блокировка кнопки и смена её текста.

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn ${pending ? 'btn-loading' : 'btn-primary'}`}
    >
      {pending ? (
        <>
          <span className="spinner" />
          Сохраняем...
        </>
      ) : (
        'Сохранить'
      )}
    </button>
  );
}

// Использование в форме
function ProfileForm() {
  async function updateProfile(formData: FormData) {
    'use server';
    await saveProfileToDatabase({
      name: formData.get('name') as string,
      bio: formData.get('bio') as string,
    });
  }

  return (
    <form action={updateProfile}>
      <input name="name" placeholder="Имя" defaultValue="Иван Петров" />
      <textarea name="bio" placeholder="О себе" />
      <SubmitButton />
    </form>
  );
}
```

### Пример 2: Блокировка всей формы во время отправки

Иногда нужно заблокировать не только кнопку, но и все поля формы.

```tsx
import { useFormStatus } from 'react-dom';

function FormField({
  name,
  label,
  type = 'text',
}: {
  name: string;
  label: string;
  type?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        disabled={pending}
        className={pending ? 'input-disabled' : ''}
      />
    </div>
  );
}

function RegisterForm() {
  async function registerUser(formData: FormData) {
    'use server';
    await createUserAccount({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    });
  }

  return (
    <form action={registerUser}>
      <FormField name="name" label="Имя" />
      <FormField name="email" label="Email" type="email" />
      <FormField name="password" label="Пароль" type="password" />
      <SubmitButton />
    </form>
  );
}
```

### Пример 3: Отображение прогресса с данными формы

Поле `data` позволяет показать, какие данные отправляются прямо сейчас.

```tsx
import { useFormStatus } from 'react-dom';

function FormStatus() {
  const { pending, data } = useFormStatus();

  if (!pending || !data) return null;

  const email = data.get('email');

  return (
    <div className="form-status">
      <span className="spinner" />
      <p>
        Отправляем на <strong>{email as string}</strong>...
      </p>
    </div>
  );
}

function NewsletterForm() {
  async function subscribe(formData: FormData) {
    'use server';
    await addToNewsletter(formData.get('email') as string);
  }

  return (
    <form action={subscribe}>
      <input name="email" type="email" placeholder="Ваш email" />
      <FormStatus />
      <button type="submit">Подписаться</button>
    </form>
  );
}
```

## Интеграция с Next.js Server Actions

`useFormStatus` особенно полезен в Next.js App Router, где формы часто работают с Server Actions.

### Базовый пример с Server Action

```tsx
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // Имитируем задержку сервера
  await new Promise((resolve) => setTimeout(resolve, 1500));

  await db.post.create({ data: { title, content } });
  revalidatePath('/posts');
}
```

```tsx
// app/posts/new/page.tsx
import { createPost } from '../actions';
import { SubmitButton } from '@/components/SubmitButton';

export default function NewPostPage() {
  return (
    <div className="container">
      <h1>Новая запись</h1>
      <form action={createPost}>
        <div>
          <label htmlFor="title">Заголовок</label>
          <input id="title" name="title" required />
        </div>
        <div>
          <label htmlFor="content">Содержание</label>
          <textarea id="content" name="content" rows={10} required />
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
```

```tsx
// components/SubmitButton.tsx
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Публикуем...' : 'Опубликовать'}
    </button>
  );
}
```

Обратите внимание: компонент с `useFormStatus` должен быть клиентским (`'use client'`), потому что `useFormStatus` — это клиентский хук. Но форма и Server Action могут оставаться серверными.

### Паттерн: переиспользуемый компонент кнопки

В реальных проектах удобно создать универсальную кнопку отправки.

```tsx
// components/SubmitButton.tsx
'use client';

import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

interface SubmitButtonProps {
  children: ReactNode;
  loadingText?: string;
  className?: string;
}

export function SubmitButton({
  children,
  loadingText = 'Загрузка...',
  className = '',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`submit-btn ${pending ? 'submit-btn--loading' : ''} ${className}`}
    >
      {pending ? loadingText : children}
    </button>
  );
}
```

Использование:

```tsx
// В любой форме
<form action={someServerAction}>
  {/* ... поля ... */}
  <SubmitButton loadingText="Сохраняем профиль...">
    Сохранить профиль
  </SubmitButton>
</form>

// В другой форме
<form action={anotherAction}>
  {/* ... поля ... */}
  <SubmitButton loadingText="Отправляем...">
    Отправить сообщение
  </SubmitButton>
</form>
```

## Как работает useFormStatus под капотом

`useFormStatus` использует React Context внутри реализации форм. Когда форма начинает отправку (через нативный механизм `<form>` или Server Action), React автоматически обновляет контекст формы, который потребляют все дочерние компоненты, использующие `useFormStatus`.

Это значит:
- **Нет лишних ре-рендеров** родительского компонента — статус обновляется только в тех компонентах, которые его используют.
- **Автоматическая синхронизация** — вам не нужно вручную управлять состоянием загрузки.
- **Работает с нативными формами** — хук реагирует на отправку `<form>` через `action` атрибут.

### Важное ограничение: место вызова

`useFormStatus` должен вызываться внутри дочернего компонента формы, но **не** в компоненте самой формы.

```tsx
// ❌ НЕПРАВИЛЬНО — useFormStatus вызывается в компоненте формы
function Form() {
  const { pending } = useFormStatus(); // Всегда вернёт { pending: false }!

  return (
    <form action={handleSubmit}>
      <button disabled={pending}>Отправить</button>
    </form>
  );
}

// ✅ ПРАВИЛЬНО — useFormStatus вызывается в дочернем компоненте
function SubmitButton() {
  const { pending } = useFormStatus(); // Корректно отслеживает форму

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Отправка...' : 'Отправить'}
    </button>
  );
}

function Form() {
  return (
    <form action={handleSubmit}>
      <SubmitButton /> {/* Корректный дочерний компонент */}
    </form>
  );
}
```

## Поле action: работа с различными типами

Поле `action` из `useFormStatus` может принимать разные значения в зависимости от атрибута `action` формы.

```tsx
import { useFormStatus } from 'react-dom';

function FormDebugInfo() {
  const { pending, method, action } = useFormStatus();

  if (!pending) return null;

  return (
    <div className="debug-info">
      <p>Метод: {method}</p>
      <p>
        Действие:{' '}
        {typeof action === 'function'
          ? 'Server Action'
          : action || 'не указано'}
      </p>
    </div>
  );
}

// Форма с URL в action
<form action="/api/submit" method="post">
  <FormDebugInfo /> {/* action = "/api/submit", method = "post" */}
  <SubmitButton />
</form>

// Форма с Server Action
<form action={serverAction}>
  <FormDebugInfo /> {/* action = [Function], method = "post" */}
  <SubmitButton />
</form>
```

## Обработка ошибок и повторная отправка

`useFormStatus` автоматически возвращает `pending: false` после завершения отправки — независимо от успеха или ошибки. Для отображения ошибок используйте отдельное состояние или `useActionState`.

```tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitForm } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Отправка...' : 'Отправить'}
    </button>
  );
}

type FormState = {
  error?: string;
  success?: boolean;
};

export function ContactForm() {
  const [state, action] = useActionState<FormState, FormData>(
    submitForm,
    {}
  );

  return (
    <form action={action}>
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Сообщение" required />

      {state.error && (
        <p className="error-message">{state.error}</p>
      )}

      {state.success && (
        <p className="success-message">Сообщение успешно отправлено!</p>
      )}

      <SubmitButton />
    </form>
  );
}
```

## Сравнение useFormStatus с другими подходами

### useFormStatus vs ручное управление состоянием

| Критерий | Ручной useState | useFormStatus |
|----------|-----------------|---------------|
| Код | Больше бойлерплейта | Компактный |
| Передача состояния | Через пропсы | Автоматически |
| Переиспользуемость | Ограничена | Высокая |
| Поддержка Server Actions | Нужна доработка | Встроена |
| React версия | Любая | React 19+ |

### useFormStatus vs useActionState

Эти два хука дополняют друг друга:

- **`useFormStatus`** — отвечает на вопрос «форма сейчас отправляется?». Используется в дочерних компонентах для UI-реакции.
- **`useActionState`** (ранее `useFormState`) — управляет состоянием, которое возвращает Server Action. Используется в компоненте формы для работы с результатами.

```tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

// useFormStatus — для дочернего компонента (статус отправки)
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>Отправить</button>;
}

// useActionState — для компонента формы (результат действия)
function MyForm() {
  const [state, action] = useActionState(serverAction, null);

  return (
    <form action={action}>
      <input name="data" />
      {state?.error && <p>{state.error}</p>}
      <SubmitButton /> {/* Использует useFormStatus */}
    </form>
  );
}
```

## Доступность (Accessibility)

При использовании `useFormStatus` важно не забывать об атрибутах доступности.

```tsx
import { useFormStatus } from 'react-dom';

function AccessibleSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      aria-busy={pending}
      aria-label={pending ? 'Форма отправляется, подождите' : 'Отправить форму'}
    >
      {pending ? (
        <>
          <span aria-hidden="true" className="spinner" />
          <span>Отправка...</span>
        </>
      ) : (
        'Отправить'
      )}
    </button>
  );
}
```

Атрибут `aria-busy` сообщает скринридерам, что элемент обновляется. Это улучшает опыт пользователей со вспомогательными технологиями.

## Лучшие практики

### 1. Выносите кнопку в отдельный компонент

```tsx
// ✅ Хорошо — кнопка переиспользуемая
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Загрузка...' : children}
    </button>
  );
}

// ❌ Плохо — логика смешана с формой
function Form() {
  // Здесь useFormStatus не работает корректно
  return <form action={action}><button type="submit">Отправить</button></form>;
}
```

### 2. Используйте семантические атрибуты

Всегда добавляйте `disabled` и `aria-disabled` одновременно: `disabled` блокирует кнопку, а `aria-disabled` информирует вспомогательные технологии.

### 3. Показывайте визуальный фидбек

Пользователь должен всегда видеть, что происходит. Используйте спиннеры, анимации или смену текста.

```tsx
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="btn">
      {pending && <Spinner className="btn-spinner" />}
      <span>{pending ? 'Сохраняем...' : 'Сохранить'}</span>
    </button>
  );
}
```

### 4. Не злоупотребляйте полем data

Поле `data` содержит все данные формы. Не показывайте чувствительные данные (пароли, токены) в UI.

```tsx
function FormStatus() {
  const { pending, data } = useFormStatus();

  if (!pending || !data) return null;

  // ✅ Безопасно — показываем только email
  const email = data.get('email');

  // ❌ Небезопасно — не показывайте пароли!
  // const password = data.get('password');

  return <p>Отправляем на {email as string}...</p>;
}
```

### 5. Комбинируйте с useActionState для полного контроля

`useFormStatus` + `useActionState` = полноценная обработка форм с загрузкой, результатами и ошибками.

## Требования и совместимость

| Требование | Версия |
|-----------|--------|
| React | 19.0+ |
| react-dom | 19.0+ |
| Next.js | 14+ (с App Router) |
| Импорт | `import { useFormStatus } from 'react-dom'` |

> **Примечание:** `useFormStatus` появился в React 19. В React 18 он не работает. Для Next.js 13 с App Router в экспериментальном режиме была ограниченная поддержка, но стабильной она стала только с React 19.

## Частые вопросы

**Почему `pending` всегда `false` в моём компоненте?**

Убедитесь, что компонент с `useFormStatus` является дочерним элементом `<form>`, а не самой формой. Хук не работает в компоненте, который рендерит саму форму.

**Работает ли `useFormStatus` с обычным `onSubmit`?**

`useFormStatus` работает только с формами, использующими нативный атрибут `action` (строка URL или Server Action). С `onSubmit` хук не обновляет `pending`.

**Можно ли использовать `useFormStatus` в серверном компоненте?**

Нет. `useFormStatus` — клиентский хук. Компонент, его использующий, должен иметь директиву `'use client'`.

**Что происходит при ошибке в Server Action?**

Если Server Action выбрасывает ошибку, `pending` автоматически сбросится в `false`. Обрабатывайте ошибки через `useActionState` или `try/catch` внутри действия.

## Итог

`useFormStatus` — это элегантное решение для отслеживания статуса отправки формы в React 19. Хук позволяет:

- **Убрать prop drilling** — дочерние компоненты сами получают нужный статус.
- **Создавать переиспользуемые компоненты** — универсальные кнопки, поля, индикаторы загрузки.
- **Улучшать UX** — пользователь всегда видит, что форма обрабатывается.
- **Легко интегрироваться с Server Actions** — особенно в Next.js App Router.

Хук прост в использовании, но важно помнить главное правило: вызывайте его только в дочерних компонентах формы, а не в самом компоненте с `<form>`. В паре с `useActionState` он даёт полный контроль над жизненным циклом отправки форм.

Хотите углубиться в React и научиться строить современные формы? Загляните на [курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useFormStatus) — там вы найдёте практические примеры и разберёте все аспекты работы с современными хуками React.
