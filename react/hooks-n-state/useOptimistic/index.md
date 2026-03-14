---
metaTitle: "useOptimistic в React — оптимистичные обновления UI"
metaDescription: "Полное руководство по хуку useOptimistic в React 19: как делать оптимистичные обновления, интегрировать с Server Actions, обрабатывать ошибки и откатывать состояние. Практические примеры на TypeScript."
author: Олег Марков
title: useOptimistic — оптимистичные обновления UI
preview: Хук useOptimistic позволяет мгновенно обновлять интерфейс до получения ответа от сервера, создавая эффект быстрого приложения. В этой статье разберём синтаксис, реальные сценарии с Server Actions, обработку ошибок и лучшие практики.
---

## Введение

Когда пользователь нажимает «Лайк», «Отправить» или «Удалить» — он ожидает мгновенной реакции интерфейса. Но реальность такова: запрос к серверу занимает время. Показывать спиннер при каждом клике — плохой UX. Решение этой проблемы называется **оптимистичными обновлениями**.

React 19 представил хук `useOptimistic`, который делает реализацию оптимистичных обновлений простой и предсказуемой. Вместо сложных танцев с временными состояниями — один хук, который сам управляет оптимистичным и реальным состоянием.

Если вы хотите глубже изучить современные возможности React, рекомендую [курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useOptimistic).

## Что такое оптимистичные обновления и зачем они нужны

**Оптимистичное обновление** — это техника, при которой интерфейс немедленно отображает предполагаемый результат операции, не дожидаясь ответа сервера. Если сервер подтверждает операцию — всё хорошо. Если возникает ошибка — UI откатывается к предыдущему состоянию.

### Проблема без оптимистичных обновлений

Рассмотрим классическую кнопку лайка:

```tsx
function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    setIsLoading(true);
    try {
      const result = await likePost(postId); // 200-500ms задержка
      setLikes(result.likes);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleLike} disabled={isLoading}>
      {isLoading ? '...' : `❤️ ${likes}`}
    </button>
  );
}
```

Что не так: пользователь нажимает кнопку и видит `...` на 200-500 мс. На мобильном устройстве с медленным интернетом — ещё дольше. Это создаёт ощущение медленного приложения.

### Решение: оптимистичный подход

При оптимистичном подходе мы немедленно обновляем счётчик и отправляем запрос параллельно. Если запрос провалится — откатываемся назад.

Именно для этого и создан `useOptimistic`.

## Синтаксис и параметры хука useOptimistic

```tsx
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn);
```

### Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `state` | `T` | Реальное текущее состояние |
| `updateFn` | `(currentState: T, optimisticValue: A) => T` | Функция вычисления оптимистичного состояния |

### Возвращаемые значения

| Значение | Тип | Описание |
|----------|-----|----------|
| `optimisticState` | `T` | Оптимистичное состояние для отображения в UI |
| `addOptimistic` | `(optimisticValue: A) => void` | Функция для добавления оптимистичного обновления |

### Как это работает

- `optimisticState` равен `state`, когда нет активных асинхронных операций
- Когда вы вызываете `addOptimistic(value)`, React применяет `updateFn(currentState, value)` и немедленно обновляет `optimisticState`
- После завершения асинхронной операции React синхронизирует `optimisticState` с реальным `state`
- Если операция завершилась с ошибкой — `optimisticState` откатывается к исходному `state`

## Как работает хук под капотом

`useOptimistic` — это специальный хук, тесно интегрированный с React Fiber. Вот ключевые механики:

1. **Слоение состояний**: React поддерживает два «слоя» состояния — реальное (committed state) и оптимистичное (pending state). Хук всегда показывает оптимистичный слой в UI.

2. **Автоматический откат**: `useOptimistic` привязан к жизненному циклу транзакции. Когда транзакция (Server Action или другая async операция) завершается, React автоматически убирает оптимистичный слой.

3. **Конкурентный рендеринг**: Хук работает в рамках React Concurrent Mode, что позволяет React прерывать и откатывать рендеры при необходимости.

4. **Батчинг**: Несколько вызовов `addOptimistic` в одном event handler батчуются в одно обновление.

## Примеры использования

### Пример 1: Кнопка лайка

Самый простой пример — мгновенная реакция на лайк:

```tsx
'use client';

import { useOptimistic } from 'react';
import { toggleLike } from './actions';

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
}

export function LikeButton({ postId, initialLikes, initialLiked }: LikeButtonProps) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    { count: initialLikes, liked: initialLiked },
    (currentState, action: 'like' | 'unlike') => ({
      count: action === 'like' ? currentState.count + 1 : currentState.count - 1,
      liked: action === 'like',
    })
  );

  const handleClick = async () => {
    const action = optimisticLikes.liked ? 'unlike' : 'like';
    addOptimisticLike(action); // Мгновенное обновление UI
    await toggleLike(postId);  // Запрос к серверу в фоне
  };

  return (
    <button onClick={handleClick}>
      {optimisticLikes.liked ? '❤️' : '🤍'} {optimisticLikes.count}
    </button>
  );
}
```

Здесь пользователь видит мгновенное изменение счётчика и иконки — никаких спиннеров.

### Пример 2: Отправка комментария

Добавление комментариев — классический сценарий для оптимистичных обновлений:

```tsx
'use client';

import { useOptimistic, useRef } from 'react';
import { addComment } from './actions';

interface Comment {
  id: string;
  text: string;
  author: string;
  pending?: boolean;
}

interface CommentsProps {
  postId: string;
  initialComments: Comment[];
  currentUser: string;
}

export function Comments({ postId, initialComments, currentUser }: CommentsProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    initialComments,
    (currentComments, newComment: Comment) => [...currentComments, newComment]
  );

  const handleSubmit = async (formData: FormData) => {
    const text = formData.get('text') as string;
    if (!text.trim()) return;

    // Оптимистично добавляем комментарий с временным ID
    addOptimisticComment({
      id: `temp-${Date.now()}`,
      text,
      author: currentUser,
      pending: true,
    });

    formRef.current?.reset();

    // Реальный запрос к серверу
    await addComment(postId, text);
  };

  return (
    <div>
      <ul>
        {optimisticComments.map((comment) => (
          <li
            key={comment.id}
            style={{ opacity: comment.pending ? 0.6 : 1 }}
          >
            <strong>{comment.author}:</strong> {comment.text}
            {comment.pending && <span> (отправляется...)</span>}
          </li>
        ))}
      </ul>

      <form ref={formRef} action={handleSubmit}>
        <input name="text" placeholder="Написать комментарий..." />
        <button type="submit">Отправить</button>
      </form>
    </div>
  );
}
```

Обратите внимание на `pending: true` — это позволяет визуально показать пользователю, что комментарий ещё отправляется (приглушённый цвет).

### Пример 3: Список задач (Todo List)

Более сложный пример с несколькими операциями:

```tsx
'use client';

import { useOptimistic } from 'react';
import { createTodo, deleteTodo, toggleTodo } from './actions';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  pending?: boolean;
}

type OptimisticAction =
  | { type: 'add'; todo: Todo }
  | { type: 'delete'; id: string }
  | { type: 'toggle'; id: string };

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, dispatchOptimistic] = useOptimistic(
    initialTodos,
    (todos: Todo[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add':
          return [...todos, action.todo];
        case 'delete':
          return todos.filter((t) => t.id !== action.id);
        case 'toggle':
          return todos.map((t) =>
            t.id === action.id ? { ...t, completed: !t.completed } : t
          );
        default:
          return todos;
      }
    }
  );

  const handleAdd = async (formData: FormData) => {
    const text = formData.get('text') as string;
    const tempTodo: Todo = {
      id: `temp-${Date.now()}`,
      text,
      completed: false,
      pending: true,
    };
    dispatchOptimistic({ type: 'add', todo: tempTodo });
    await createTodo(text);
  };

  const handleDelete = async (id: string) => {
    dispatchOptimistic({ type: 'delete', id });
    await deleteTodo(id);
  };

  const handleToggle = async (id: string) => {
    dispatchOptimistic({ type: 'toggle', id });
    await toggleTodo(id);
  };

  return (
    <div>
      <form action={handleAdd}>
        <input name="text" placeholder="Новая задача..." />
        <button type="submit">Добавить</button>
      </form>

      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.6 : 1 }}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => handleDelete(todo.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Интеграция с Server Actions (Next.js)

`useOptimistic` создан специально для работы с Server Actions в Next.js App Router. Рассмотрим полноценный пример:

### Server Action (`actions.ts`)

```tsx
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function addMessageAction(conversationId: string, text: string) {
  // Имитация задержки сети
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const message = await db.message.create({
    data: {
      conversationId,
      text,
      createdAt: new Date(),
    },
  });

  revalidatePath(`/conversations/${conversationId}`);
  return message;
}
```

### Client Component (`chat.tsx`)

```tsx
'use client';

import { useOptimistic, useRef, startTransition } from 'react';
import { addMessageAction } from './actions';

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  pending?: boolean;
}

interface ChatProps {
  conversationId: string;
  initialMessages: Message[];
}

export function Chat({ conversationId, initialMessages }: ChatProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    initialMessages,
    (messages, newMessage: Message) => [...messages, newMessage]
  );

  const handleSubmit = async (formData: FormData) => {
    const text = formData.get('message') as string;
    if (!text.trim()) return;

    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      text,
      createdAt: new Date(),
      pending: true,
    };

    // startTransition нужен при вызове вне form action
    startTransition(async () => {
      addOptimisticMessage(optimisticMessage);
      formRef.current?.reset();
      await addMessageAction(conversationId, text);
    });
  };

  return (
    <div className="chat">
      <div className="messages">
        {optimisticMessages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.pending ? 'pending' : ''}`}
          >
            <p>{msg.text}</p>
            <span>{msg.pending ? 'Отправляется...' : msg.createdAt.toLocaleTimeString()}</span>
          </div>
        ))}
      </div>

      <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSubmit(new FormData(e.currentTarget)); }}>
        <input name="message" placeholder="Написать сообщение..." autoComplete="off" />
        <button type="submit">Отправить</button>
      </form>
    </div>
  );
}
```

### Использование с `<form action={serverAction}>`

Когда Server Action передаётся напрямую в `action` формы, `useOptimistic` автоматически откатывается после завершения действия:

```tsx
'use client';

import { useOptimistic } from 'react';
import { sendMessage } from './actions';

export function MessageForm({ messages, conversationId }: MessageFormProps) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newText: string) => [
      ...state,
      { id: `temp-${Date.now()}`, text: newText, pending: true },
    ]
  );

  return (
    <>
      <MessageList messages={optimisticMessages} />
      <form
        action={async (formData) => {
          addOptimisticMessage(formData.get('message') as string);
          await sendMessage(conversationId, formData);
        }}
      >
        <input name="message" />
        <button type="submit">Отправить</button>
      </form>
    </>
  );
}
```

## Обработка ошибок и откат состояния

`useOptimistic` автоматически откатывает оптимистичное состояние при ошибке. Однако важно правильно обрабатывать ошибки, чтобы уведомить пользователя:

```tsx
'use client';

import { useOptimistic, useState } from 'react';
import { deleteItem } from './actions';

interface Item {
  id: string;
  name: string;
}

export function ItemList({ initialItems }: { initialItems: Item[] }) {
  const [error, setError] = useState<string | null>(null);

  const [optimisticItems, removeOptimistic] = useOptimistic(
    initialItems,
    (items, deletedId: string) => items.filter((item) => item.id !== deletedId)
  );

  const handleDelete = async (id: string) => {
    setError(null);
    removeOptimistic(id); // Мгновенно убираем из списка

    try {
      await deleteItem(id);
    } catch (err) {
      // useOptimistic автоматически откатит состояние,
      // но нам нужно показать сообщение об ошибке
      setError('Не удалось удалить элемент. Попробуйте снова.');
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <ul>
        {optimisticItems.map((item) => (
          <li key={item.id}>
            {item.name}
            <button onClick={() => handleDelete(item.id)}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Ключевое поведение при ошибках

- **Автоматический откат**: React автоматически возвращает `optimisticState` к реальному `state` после завершения транзакции — вне зависимости от успеха или ошибки
- **Пользователь не теряет данные**: Откат происходит только в UI — реальное состояние (пришедшее с сервера) остаётся нетронутым
- **Ручное уведомление**: `useOptimistic` не показывает ошибки сам — вы должны добавить логику отображения ошибок (toast, alert и т.д.)

## Сравнение с ручной реализацией

До появления `useOptimistic` разработчики реализовывали оптимистичные обновления вручную:

### Ручная реализация (до React 19)

```tsx
// Сложно, много кода, легко ошибиться
function OldLikeButton({ postId, initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiking, setIsLiking] = useState(false);
  const previousLikesRef = useRef(initialLikes);

  const handleLike = async () => {
    if (isLiking) return;

    previousLikesRef.current = likes;
    setLikes((prev) => prev + 1); // Оптимистичное обновление
    setIsLiking(true);

    try {
      const result = await likePost(postId);
      setLikes(result.likes); // Синхронизация с сервером
    } catch {
      setLikes(previousLikesRef.current); // Ручной откат
    } finally {
      setIsLiking(false);
    }
  };

  return <button onClick={handleLike}>❤️ {likes}</button>;
}
```

### С useOptimistic (React 19)

```tsx
// Чисто, декларативно, безопасно
function NewLikeButton({ postId, initialLikes }) {
  const [optimisticLikes, addOptimistic] = useOptimistic(
    initialLikes,
    (state, delta: number) => state + delta
  );

  const handleLike = async () => {
    addOptimistic(1);
    await likePost(postId);
    // Откат происходит автоматически при ошибке
  };

  return <button onClick={handleLike}>❤️ {optimisticLikes}</button>;
}
```

### Преимущества useOptimistic

| Аспект | Ручная реализация | useOptimistic |
|--------|-------------------|---------------|
| Откат при ошибке | Ручной | Автоматический |
| Код | Много boilerplate | Декларативный |
| Конкурентность | Сложно управлять | React управляет |
| Интеграция с Suspense | Не поддерживается | Поддерживается |
| Батчинг | Нужно настраивать | Встроен |

## Лучшие практики и подводные камни

### Практика 1: Всегда показывайте pending состояние

Пользователь должен понимать, что данные ещё не сохранены. Используйте визуальные индикаторы:

```tsx
// Хорошо: пользователь видит, что операция выполняется
{optimisticItems.map((item) => (
  <li key={item.id} className={item.pending ? 'opacity-50 italic' : ''}>
    {item.name}
    {item.pending && <span className="text-gray-400"> (сохраняется...)</span>}
  </li>
))}
```

### Практика 2: Уникальные временные ID

При добавлении новых элементов оптимистично используйте гарантированно уникальные временные ID:

```tsx
// Хорошо
const tempId = `optimistic-${crypto.randomUUID()}`;

// Плохо: может совпасть с реальным ID
const tempId = `temp-${Math.random()}`;
```

### Практика 3: Используйте startTransition при вызове вне form action

`useOptimistic` работает только внутри `startTransition` или `form action`:

```tsx
import { startTransition } from 'react';

// При вызове из обычного event handler — нужен startTransition
const handleClick = () => {
  startTransition(async () => {
    addOptimistic(newValue);
    await serverAction();
  });
};

// При использовании с form action — startTransition не нужен
<form action={async (formData) => {
  addOptimistic(formData.get('text'));
  await serverAction(formData);
}}>
```

### Практика 4: Не злоупотребляйте оптимизмом

Оптимистичные обновления подходят не для всех операций. Избегайте их при:

- **Финансовых транзакциях**: пользователь должен видеть подтверждение от сервера
- **Критичных операциях удаления**: лучше показать диалог подтверждения
- **Операциях с конфликтами**: если несколько пользователей могут изменять одни данные

### Практика 5: Обрабатывайте повторные запросы

Если пользователь кликает несколько раз до завершения запроса, `updateFn` будет вызвана для каждого оптимистичного обновления:

```tsx
// Защита от многократного лайка
const [isProcessing, setIsProcessing] = useState(false);

const handleLike = async () => {
  if (isProcessing) return; // Защита
  setIsProcessing(true);

  addOptimistic('toggle');

  try {
    await toggleLike(postId);
  } finally {
    setIsProcessing(false);
  }
};
```

### Подводный камень: useOptimistic не работает с useState напрямую

```tsx
// Неверно: optimisticState не будет обновляться,
// если state — это локальный useState
const [items, setItems] = useState(initialItems);
const [optimisticItems, addOptimistic] = useOptimistic(items, reducer);

// После server action setItems не вызывается автоматически!
// Нужно использовать revalidatePath/revalidateTag в Server Action
// или обновлять items вручную
```

## Требования и совместимость

- **React версия**: 19+ (нестабильная версия в React 18 `canary`)
- **Среда**: Работает только внутри `startTransition` или `form action`
- **Server Components**: Хук недоступен в Server Components (`use client` обязателен)
- **Next.js**: 14+ с App Router для полной интеграции с Server Actions

## Заключение

`useOptimistic` — это элегантный инструмент для создания отзывчивых интерфейсов. Ключевые выводы:

1. **Мгновенная реакция**: пользователь видит результат немедленно, без спиннеров
2. **Автоматический откат**: при ошибке React сам вернёт состояние — не нужно писать откат вручную
3. **Декларативный подход**: вы описываете как вычислить оптимистичное состояние, React управляет деталями
4. **Идеален для Server Actions**: хук создан для работы в связке с Next.js Server Actions

Хук особенно хорошо работает для социальных взаимодействий (лайки, репосты), чатов, todo-списков и любых операций, где важна немедленная обратная связь.

Чтобы получить системные знания по React и его экосистеме, рекомендую пройти [курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useOptimistic).
