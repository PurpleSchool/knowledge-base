---
metaTitle: "useActionState в React 19: управление формами"
metaDescription: "Хук useActionState в React 19: как управлять состоянием форм, обрабатывать ошибки и pending-состояние. Примеры с Server Actions."
author: "Антон Ларичев"
title: "useActionState в React 19"
preview: "Полный разбор хука useActionState из React 19: синтаксис, примеры с формами, обработка ошибок и интеграция с Server Actions."
---

## Что такое useActionState

`useActionState` — хук, появившийся в React 19, который упрощает управление состоянием формы при выполнении асинхронных действий (actions). Он заменяет паттерн с ручным `useState` + `try/catch` + флагом загрузки и предоставляет единый интерфейс для:

- хранения результата последнего вызова action;
- отслеживания pending-состояния;
- обновления состояния компонента после завершения action.

До React 19 для отправки формы и отображения ошибок приходилось писать:

```tsx
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  try {
    await submitData(formData);
  } catch (err) {
    setError('Ошибка отправки');
  } finally {
    setLoading(false);
  }
}
```

С `useActionState` весь этот шаблонный код сводится к нескольким строкам.

## Синтаксис

```tsx
const [state, formAction, isPending] = useActionState(action, initialState, permalink?);
```

### Параметры

- **`action`** — асинхронная функция `(prevState, formData) => newState`. Вызывается при отправке формы или явно через возвращённый `formAction`.
- **`initialState`** — начальное значение `state`. Может быть любым сериализуемым значением: `null`, объект с полями ошибок, строка и т.д.
- **`permalink`** (необязательный) — URL страницы. Используется при SSR и прогрессивном улучшении: если JS ещё не загрузился, браузер перенаправит на этот URL после отправки формы.

### Возвращаемые значения

- **`state`** — текущее состояние. При первом рендере равно `initialState`, после вызова action — возвращаемому значению action.
- **`formAction`** — функция, которую нужно передать в `action` элемента `<form>` или в `onClick` кнопки.
- **`isPending`** — `true`, пока action выполняется. Позволяет блокировать форму или показывать индикатор загрузки.

## Базовый пример: форма входа

```tsx
import { useActionState } from 'react';

type LoginState = {
  error: string | null;
  success: boolean;
};

async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    return { error: 'Неверный email или пароль', success: false };
  }

  return { error: null, success: true };
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: null,
    success: false,
  });

  if (state.success) {
    return <p>Вы успешно вошли!</p>;
  }

  return (
    <form action={formAction}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Пароль" required />

      {state.error && <p style={{ color: 'red' }}>{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Вхожу...' : 'Войти'}
      </button>
    </form>
  );
}
```

Обратите внимание: `formAction` передаётся напрямую в атрибут `action` тега `<form>`. React перехватывает отправку формы и вызывает action с объектом `FormData`.

## Обработка ошибок валидации

Часто нужно валидировать несколько полей и возвращать сообщения для каждого:

```tsx
type RegisterState = {
  errors: {
    name?: string;
    email?: string;
    password?: string;
  };
  success: boolean;
};

async function registerAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = (formData.get('name') as string).trim();
  const email = (formData.get('email') as string).trim();
  const password = formData.get('password') as string;

  const errors: RegisterState['errors'] = {};

  if (!name) errors.name = 'Имя обязательно';
  if (!email.includes('@')) errors.email = 'Укажите корректный email';
  if (password.length < 8) errors.password = 'Минимум 8 символов';

  if (Object.keys(errors).length > 0) {
    return { errors, success: false };
  }

  await createUser({ name, email, password });
  return { errors: {}, success: true };
}

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, {
    errors: {},
    success: false,
  });

  return (
    <form action={formAction}>
      <div>
        <input name="name" placeholder="Имя" />
        {state.errors.name && <span>{state.errors.name}</span>}
      </div>
      <div>
        <input name="email" type="email" placeholder="Email" />
        {state.errors.email && <span>{state.errors.email}</span>}
      </div>
      <div>
        <input name="password" type="password" placeholder="Пароль" />
        {state.errors.password && <span>{state.errors.password}</span>}
      </div>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
```

## Использование с Server Actions в Next.js

Основная сила `useActionState` проявляется в связке с Server Actions. Action выполняется на сервере, а результат автоматически возвращается клиенту.

```tsx
// app/actions/newsletter.ts
'use server';

import { db } from '@/lib/db';

type NewsletterState = {
  message: string | null;
  type: 'success' | 'error' | null;
};

export async function subscribeAction(
  prevState: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { message: 'Введите корректный email', type: 'error' };
  }

  const exists = await db.subscriber.findUnique({ where: { email } });
  if (exists) {
    return { message: 'Вы уже подписаны', type: 'error' };
  }

  await db.subscriber.create({ data: { email } });
  return { message: 'Вы успешно подписались!', type: 'success' };
}
```

```tsx
// app/components/NewsletterForm.tsx
'use client';

import { useActionState } from 'react';
import { subscribeAction } from '@/app/actions/newsletter';

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(subscribeAction, {
    message: null,
    type: null,
  });

  return (
    <form action={formAction}>
      <input name="email" type="email" placeholder="Ваш email" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Отправка...' : 'Подписаться'}
      </button>
      {state.message && (
        <p style={{ color: state.type === 'error' ? 'red' : 'green' }}>
          {state.message}
        </p>
      )}
    </form>
  );
}
```

Server Action имеет доступ к базе данных, ORM, переменным окружения — и всё это без единого API-маршрута.

## Доступ к предыдущему состоянию

Первым аргументом action всегда получает предыдущее `state`. Это позволяет накапливать данные или реализовывать логику "retry":

```tsx
type RetryState = {
  attempts: number;
  lastError: string | null;
  success: boolean;
};

async function submitWithRetry(
  prevState: RetryState,
  formData: FormData
): Promise<RetryState> {
  if (prevState.attempts >= 3) {
    return {
      ...prevState,
      lastError: 'Превышен лимит попыток. Попробуйте позже.',
    };
  }

  try {
    await riskyOperation(formData);
    return { attempts: prevState.attempts + 1, lastError: null, success: true };
  } catch {
    return {
      attempts: prevState.attempts + 1,
      lastError: `Попытка ${prevState.attempts + 1} не удалась`,
      success: false,
    };
  }
}

export function RetryForm() {
  const [state, formAction, isPending] = useActionState(submitWithRetry, {
    attempts: 0,
    lastError: null,
    success: false,
  });

  return (
    <form action={formAction}>
      <button type="submit" disabled={isPending || state.attempts >= 3}>
        Отправить
      </button>
      {state.lastError && <p>{state.lastError}</p>}
      {state.attempts > 0 && !state.success && (
        <p>Попыток: {state.attempts} из 3</p>
      )}
    </form>
  );
}
```

## Вызов action вне формы

`formAction` можно вызывать программно, не только через `<form>`. Например, при нажатии на кнопку без формы:

```tsx
export function DeleteButton({ itemId }: { itemId: string }) {
  const [state, deleteAction, isPending] = useActionState(
    async (prevState: { deleted: boolean }, formData: FormData) => {
      await deleteItem(formData.get('id') as string);
      return { deleted: true };
    },
    { deleted: false }
  );

  if (state.deleted) return <p>Элемент удалён</p>;

  return (
    <form action={deleteAction}>
      <input type="hidden" name="id" value={itemId} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Удаление...' : 'Удалить'}
      </button>
    </form>
  );
}
```

## Сравнение с альтернативами

### useActionState vs useState + useTransition

```tsx
// До React 19: ручное управление
function ManualForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitAction(formData);
      if (result.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit}>
      {error && <p>{error}</p>}
      <button disabled={isPending}>Отправить</button>
    </form>
  );
}

// React 19: useActionState
function ModernForm() {
  const [state, formAction, isPending] = useActionState(submitAction, {
    error: null,
  });

  return (
    <form action={formAction}>
      {state.error && <p>{state.error}</p>}
      <button disabled={isPending}>Отправить</button>
    </form>
  );
}
```

`useActionState` — это не просто синтаксический сахар. Он правильно интегрирован с React Concurrent Mode, поддерживает Server Actions и прогрессивное улучшение без JS.

### useActionState vs react-hook-form

`react-hook-form` подходит для сложных форм с динамическими полями, зависимой валидацией и rich UX (валидация по blur, debounce). `useActionState` оптимален для простых форм с серверной логикой, особенно в Next.js App Router.

## Прогрессивное улучшение

Одно из главных преимуществ `useActionState` — форма работает даже без JavaScript. Браузер отправляет форму нативным способом, а параметр `permalink` указывает, куда перенаправить пользователя после ответа сервера:

```tsx
const [state, formAction] = useActionState(
  subscribeAction,
  { message: null },
  '/newsletter/confirm' // редирект при работе без JS
);
```

Это особенно важно для SEO и доступности: форма функционирует даже при медленной загрузке или отключённом JS.

## Типичные ошибки

### Мутация prevState

```tsx
// Неправильно — мутируем объект
async function badAction(prevState: State, formData: FormData) {
  prevState.count++; // ошибка!
  return prevState;
}

// Правильно — возвращаем новый объект
async function goodAction(prevState: State, formData: FormData) {
  return { ...prevState, count: prevState.count + 1 };
}
```

### Несериализуемое состояние с Server Actions

При использовании Server Actions состояние сериализуется и передаётся через сеть. Не используйте функции, классовые экземпляры или Symbol:

```tsx
// Неправильно
return { callback: () => doSomething() };

// Правильно
return { status: 'done', id: '123' };
```

### Забытый await в action

```tsx
// Неправильно — action вернёт Promise, а не результат
async function action(prevState: State, formData: FormData) {
  return fetch('/api/data'); // забыли await
}

// Правильно
async function action(prevState: State, formData: FormData) {
  const res = await fetch('/api/data');
  return res.json();
}
```

## Итог

`useActionState` — это правильный способ работы с формами в React 19+. Он убирает шаблонный код управления состоянием, корректно интегрируется с Server Actions в Next.js и поддерживает прогрессивное улучшение из коробки.

Ключевые моменты:

- Action получает `(prevState, formData)` и возвращает новый state.
- `isPending` — встроенный флаг загрузки, не нужен отдельный `useState`.
- Для Server Actions состояние должно быть сериализуемым.
- `permalink` обеспечивает работу формы без JavaScript.

Чтобы освоить React 19, Server Actions и современные паттерны работы с формами на практике, изучите курс [React с нуля до PRO](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=use-action-state) на PurpleSchool.
