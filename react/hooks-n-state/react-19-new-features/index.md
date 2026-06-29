---
metaTitle: "Новые возможности React 19: Actions, хуки и Server Components"
metaDescription: "Разбираем ключевые нововведения React 19: Actions, хуки useActionState, useOptimistic, use(), ref как проп и улучшения Server Components."
author: "Антон Ларичев"
title: "Новые возможности React 19"
preview: "Полный разбор новинок React 19: Actions, новые хуки, ref как проп, нативная поддержка метаданных документа и улучшения Server Components."
---

React 19 — первый мажорный релиз после React 18, который вышел в 2022 году. Он привнёс концепцию Actions как стандартный способ работы с асинхронными операциями, стабилизировал Server Components и Server Actions, добавил несколько новых хуков и упростил ряд паттернов, которые раньше требовали обходных решений.

В этой статье разберём каждое нововведение с практическими примерами.

## Концепция Actions

Actions — центральная идея React 19. В предыдущих версиях не существовало стандартного способа обработки асинхронных операций (отправка форм, мутации данных) с управлением pending-состоянием и ошибками. Каждый разработчик решал это по-своему.

React 19 вводит соглашение: функция, которая принимает переход (transition) и выполняет асинхронную операцию, называется Action.

```typescript
async function updateUser(formData: FormData) {
  'use server'; // только для Server Actions
  const name = formData.get('name') as string;
  await db.user.update({ data: { name } });
}
```

Actions интегрированы с элементом `<form>` через проп `action`, а также с новыми хуками `useActionState` и `useFormStatus`.

## Хук useActionState

`useActionState` — новый хук для управления состоянием Action. Он заменяет ручное отслеживание `isPending`, `error` и результата операции.

```typescript
import { useActionState } from 'react';

type State = {
  error: string | null;
  success: boolean;
};

async function submitForm(
  prevState: State,
  formData: FormData
): Promise<State> {
  const name = formData.get('name') as string;

  if (!name || name.length < 2) {
    return { error: 'Имя должно содержать минимум 2 символа', success: false };
  }

  await updateUserName(name);
  return { error: null, success: true };
}

function UserForm() {
  const [state, formAction, isPending] = useActionState(submitForm, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction}>
      <input name="name" type="text" disabled={isPending} />
      {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state.success && <p style={{ color: 'green' }}>Сохранено</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Сохранение...' : 'Сохранить'}
      </button>
    </form>
  );
}
```

Хук принимает функцию-Action и начальное состояние, возвращает кортеж из трёх элементов:

- `state` — текущее состояние (результат последнего вызова Action или начальное значение)
- `formAction` — функция, которую передаём в проп `action` формы
- `isPending` — флаг выполнения асинхронной операции

Функция Action получает `prevState` первым аргументом и `formData` вторым — это стандартный сигнатурный контракт для всех Actions.

## Хук useFormStatus

`useFormStatus` позволяет дочернему компоненту внутри формы получить статус родительской формы без пробрасывания пропсов.

```typescript
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Отправка...' : 'Отправить'}
    </button>
  );
}

function ContactForm() {
  const [state, formAction] = useActionState(sendMessage, null);

  return (
    <form action={formAction}>
      <textarea name="message" />
      <SubmitButton />
    </form>
  );
}
```

Важный момент: `useFormStatus` работает только внутри компонента, который является потомком элемента `<form>`. Хук читает контекст формы через React-контекст и недоступен в самом компоненте формы.

Помимо `pending`, хук возвращает `data`, `method` и `action` — полные данные о форме и выполняемом запросе.

## Хук useOptimistic

`useOptimistic` решает задачу оптимистичных обновлений UI — когда интерфейс реагирует мгновенно, не дожидаясь ответа сервера.

```typescript
import { useOptimistic, useActionState } from 'react';

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

type AddTodoAction = {
  type: 'add';
  todo: Todo;
};

function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic<Todo[], AddTodoAction>(
    initialTodos,
    (state, action) => {
      if (action.type === 'add') {
        return [...state, action.todo];
      }
      return state;
    }
  );

  const [, formAction] = useActionState(async (_: null, formData: FormData) => {
    const text = formData.get('text') as string;
    const tempTodo = { id: Date.now(), text, completed: false };

    addOptimisticTodo({ type: 'add', todo: tempTodo });

    const savedTodo = await createTodo(text);
    return null;
  }, null);

  return (
    <>
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
      <form action={formAction}>
        <input name="text" type="text" />
        <button type="submit">Добавить</button>
      </form>
    </>
  );
}
```

Хук принимает текущее состояние и функцию-редьюсер, которая описывает как применять оптимистичное обновление. Пока выполняется реальный запрос, компонент отображает оптимистичное значение. После завершения запроса React автоматически заменяет его актуальными данными.

## API use()

`use()` — новый примитив, который позволяет читать значение Promise или Context внутри компонента, в том числе условно.

### Чтение Promise

```typescript
import { use, Suspense } from 'react';

async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

function Page({ userId }: { userId: number }) {
  const userPromise = fetchUser(userId);

  return (
    <Suspense fallback={<p>Загрузка...</p>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

В отличие от `await`, `use()` можно вызывать условно и в циклах. Если Promise ещё не выполнен, компонент приостанавливается и показывается ближайший `Suspense` fallback.

### Чтение Context

```typescript
import { use, createContext } from 'react';

const ThemeContext = createContext<'light' | 'dark'>('light');

function Button({ children }: { children: React.ReactNode }) {
  const isAdmin = checkAdmin();

  // use() можно вызывать условно, в отличие от useContext
  if (!isAdmin) {
    return null;
  }

  const theme = use(ThemeContext);

  return (
    <button className={`btn btn--${theme}`}>
      {children}
    </button>
  );
}
```

Для чтения Context `use()` функционально эквивалентен `useContext()`, но снимает ограничение «хук только на верхнем уровне».

## ref как проп (без forwardRef)

Одно из самых долгожданных упрощений — `ref` теперь является обычным пропом функциональных компонентов. `forwardRef` больше не нужен.

```typescript
// React 18 — требовался forwardRef
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, ...props }, ref) => (
    <label>
      {label}
      <input ref={ref} {...props} />
    </label>
  )
);

// React 19 — ref передаётся как обычный проп
function Input({ label, ref, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <label>
      {label}
      <input ref={ref} {...props} />
    </label>
  );
}

// Использование одинаковое
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  return <Input label="Имя" ref={inputRef} />;
}
```

`forwardRef` сохраняется в React 19 для обратной совместимости, но помечен как устаревший и будет удалён в будущих версиях.

## Context как провайдер

Eщё одно упрощение синтаксиса: теперь можно использовать сам объект Context в качестве провайдера, без `.Provider`.

```typescript
const ThemeContext = createContext<'light' | 'dark'>('light');

// React 18
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}

// React 19 — Provider не нужен
function App() {
  return (
    <ThemeContext value="dark">
      <Page />
    </ThemeContext>
  );
}
```

Старый синтаксис `<ThemeContext.Provider>` продолжает работать, но будет устаревшим.

## Нативная поддержка метаданных документа

React 19 позволяет использовать теги `<title>`, `<meta>` и `<link>` прямо в JSX компонентов. React автоматически поднимает их в `<head>` документа.

```typescript
function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <title>{product.name} — Магазин</title>
      <meta name="description" content={product.description} />
      <link rel="canonical" href={`/products/${product.slug}`} />

      <main>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
      </main>
    </>
  );
}
```

Это работает и на клиенте, и при серверном рендеринге. При Client-Side Navigation теги корректно обновляются — удаляются теги предыдущей страницы и добавляются теги новой.

## API предзагрузки ресурсов

React 19 добавляет набор функций для управления загрузкой ресурсов. Они помогают оптимизировать производительность, давая браузеру ранние подсказки.

```typescript
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom';

function App() {
  // DNS-резолвинг для внешнего домена
  prefetchDNS('https://fonts.googleapis.com');

  // Установка соединения заранее
  preconnect('https://api.example.com');

  // Загрузка шрифта
  preload('https://fonts.googleapis.com/css2?family=Inter', {
    as: 'style',
  });

  // Загрузка и выполнение скрипта
  preinit('https://cdn.example.com/analytics.js', {
    as: 'script',
  });

  return <Router />;
}
```

Эти функции можно вызывать в любом месте рендера — React дедуплицирует вызовы и генерирует соответствующие HTML-подсказки (в случае SSR) или вставляет теги в `<head>` (на клиенте).

## Улучшения Server Components и Server Actions

Server Components и Server Actions, которые появились в экспериментальном режиме в React 18, теперь являются стабильной частью React 19.

### Server Actions через директиву use server

```typescript
// actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function deletePost(postId: number): Promise<void> {
  await db.post.delete({ where: { id: postId } });
  revalidatePath('/posts');
}
```

### Передача Server Actions в Client Components

```typescript
// PostList.tsx (Server Component)
import { deletePost } from './actions';
import { DeleteButton } from './DeleteButton';

export async function PostList() {
  const posts = await db.post.findMany();

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          {post.title}
          <DeleteButton postId={post.id} onDelete={deletePost} />
        </li>
      ))}
    </ul>
  );
}

// DeleteButton.tsx (Client Component)
'use client';

import { useActionState } from 'react';

type Props = {
  postId: number;
  onDelete: (postId: number) => Promise<void>;
};

export function DeleteButton({ postId, onDelete }: Props) {
  const [, action, isPending] = useActionState(
    async () => {
      await onDelete(postId);
    },
    null
  );

  return (
    <button onClick={() => action()} disabled={isPending}>
      {isPending ? 'Удаление...' : 'Удалить'}
    </button>
  );
}
```

## Улучшенные сообщения об ошибках гидратации

Ошибки гидратации в React 18 выдавали малоинформативные сообщения. React 19 показывает конкретный фрагмент HTML, в котором возникло расхождение между серверным и клиентским деревом.

Пример нового формата ошибки:

```
Hydration failed because the server rendered HTML didn't match the client.

Server:   <div class="dark">
Client:   <div class="light">

  ...
    <ThemeProvider>
  +   <div class="light">
  -   <div class="dark">
```

Это значительно ускоряет отладку SSR-приложений.

## Очистка ref

React 19 поддерживает возврат функции очистки из ref-коллбэка. Это эквивалент деструктора для ref.

```typescript
function VideoPlayer({ src }: { src: string }) {
  return (
    <video
      ref={(node) => {
        if (!node) return;

        const player = initVideoPlayer(node, src);

        // Функция очистки — вызывается при размонтировании
        return () => {
          player.destroy();
        };
      }}
      controls
    />
  );
}
```

Раньше нужно было проверять `node === null` внутри ref-коллбэка вручную. Теперь React вызывает возвращённую функцию при размонтировании, а сам коллбэк — только при монтировании с реальным DOM-узлом.

## Изменения в useDeferredValue

`useDeferredValue` получил необязательный параметр `initialValue`, который используется при первом рендере.

```typescript
function SearchResults({ query }: { query: string }) {
  // При первом рендере используется пустая строка,
  // чтобы не блокировать начальный рендер
  const deferredQuery = useDeferredValue(query, '');

  return <ResultsList query={deferredQuery} />;
}
```

Это особенно полезно в Server Components: начальный рендер использует `initialValue`, а после гидратации значение обновляется до актуального `query`.

## Миграция с React 18

React 19 содержит ряд breaking changes:

- Удалены устаревшие API: `ReactDOM.render`, `ReactDOM.hydrate`, `ReactDOMServer.renderToString` (без streaming)
- Удалён `defaultProps` для функциональных компонентов — используйте деструктуризацию со значениями по умолчанию
- Изменено поведение `Context.displayName`
- Строгий режим двойного вызова эффектов теперь применяется ещё агрессивнее

Для большинства приложений миграция сводится к:

```bash
npx react-codemod update-react-imports
```

После чего — замена устаревших API и проверка, что компоненты корректно работают при двойном вызове эффектов в строгом режиме.

## Итог

React 19 систематизирует паттерны работы с асинхронными операциями через концепцию Actions и новые хуки `useActionState`, `useFormStatus`, `useOptimistic`. Новый примитив `use()` упрощает работу с Promise и Context. Синтаксические улучшения — ref как проп, Context без `.Provider` — убирают шаблонный код. Нативная поддержка метаданных документа и API предзагрузки закрывают задачи, которые раньше решались сторонними библиотеками или фреймворками.

Стабилизация Server Components и Server Actions делает React 19 основой для полноценных full-stack приложений без необходимости в дополнительных инструментах для управления серверной логикой.

Для глубокого изучения React и применения всех этих возможностей на практике — [курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-19-new-features).