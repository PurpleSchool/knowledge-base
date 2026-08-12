---
metaTitle: "Ошибки гидратации в React: причины и устранение"
metaDescription: "Разбираем ошибки гидратации в React: что вызывает расхождение между сервером и клиентом и как их устранить с примерами кода."
author: "Антон Ларичев"
title: "Ошибки гидратации в React и способы их устранения"
preview: "Что такое гидратация, почему она ломается и как исправить расхождения между серверным и клиентским рендерингом в React-приложениях."
---

## Что такое гидратация в React

Гидратация (hydration) — это процесс, при котором React берёт HTML, уже отрендеренный на сервере, и «оживляет» его на клиенте: подключает обработчики событий, инициализирует состояние и синхронизирует виртуальный DOM с реальным.

При серверном рендеринге (SSR) последовательность выглядит так:

1. Сервер выполняет React-компоненты и отдаёт браузеру готовый HTML.
2. Браузер показывает этот HTML пользователю — страница уже видна, но не интерактивна.
3. Загружается JavaScript-бандл.
4. React запускается на клиенте и проходит по тому же дереву компонентов.
5. React сравнивает виртуальный DOM с реальным DOM — это и есть гидратация.
6. Если они совпадают, React только навешивает обработчики, не перерисовывая DOM.

Если на шаге 5 структура или содержимое не совпадают, React выбрасывает **ошибку гидратации** и в production заменяет серверный HTML клиентским рендером, что приводит к вспышке перерисовки (flash of content).

## Как выглядит ошибка гидратации

В консоли браузера ошибка гидратации выглядит примерно так:

```
Warning: Text content did not match.
  Server: "Привет, Антон"
  Client: "Привет, Гость"
```

Или в React 18+:

```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

В React 18 ошибки гидратации стали жёстче: вместо предупреждения они бросают исключение, которое может привести к размонтированию всего дерева, если не обработано через Error Boundary.

## Частые причины ошибок гидратации

### Использование Date и Math.random()

Самый распространённый сценарий — вывод текущей даты или случайного значения прямо в JSX.

```tsx
// Плохо: сервер и клиент выполняются в разное время
function Timestamp() {
  return <span>{new Date().toLocaleTimeString()}</span>;
}
```

Сервер рендерит `«12:00:01»`, а клиент в момент гидратации выдаёт `«12:00:03»` — расхождение гарантировано.

То же самое с `Math.random()`:

```tsx
// Плохо: каждый вызов даёт новое значение
function Avatar() {
  const seed = Math.floor(Math.random() * 1000);
  return <img src={`https://picsum.photos/seed/${seed}/50/50`} />;
}
```

### Чтение window, localStorage, navigator

Объект `window` на сервере не существует. Если обратиться к нему при рендере, код просто упадёт с `ReferenceError`. Но даже защита через `typeof window !== 'undefined'` создаёт расхождение:

```tsx
// Плохо: сервер рендерит один вариант, клиент — другой
function Theme() {
  const theme = typeof window !== 'undefined'
    ? localStorage.getItem('theme') ?? 'light'
    : 'light';

  return <div className={`app app--${theme}`}>...</div>;
}
```

Сервер всегда выдаст `app--light`, а клиент может выдать `app--dark` — расхождение в атрибуте `className`.

### Условный рендеринг по User-Agent

```tsx
// Плохо: сервер и клиент могут видеть разный UA
function MobileMenu() {
  const isMobile = navigator.userAgent.includes('Mobile');
  if (!isMobile) return null;
  return <nav className="mobile-menu">...</nav>;
}
```

Даже если сервер пробрасывает заголовок `User-Agent`, после гидратации браузер вычисляет его заново и может получить иное значение.

### Неправильно закрытые HTML-теги

Если в JSX или шаблоне нарушена вложенность тегов, браузер самостоятельно исправляет HTML — и получившееся дерево отличается от того, что построил React.

```tsx
// Плохо: таблица без tbody
function Table({ rows }) {
  return (
    <table>
      {rows.map(row => (
        <tr key={row.id}>
          <td>{row.name}</td>
        </tr>
      ))}
    </table>
  );
}
```

Браузер вставляет `<tbody>` автоматически — React видит `<tbody>` там, где его нет в виртуальном DOM.

### Сторонние библиотеки и порталы

Некоторые UI-библиотеки добавляют элементы в `document.body` или используют `window` при инициализации. Такие компоненты изначально несовместимы с SSR без специальной обработки.

## Способы устранения ошибок гидратации

### 1. Перенести динамический контент в useEffect

Золотое правило: всё, что зависит от браузерного окружения или меняется между сервером и клиентом, должно вычисляться в `useEffect` — он выполняется только на клиенте, после гидратации.

```tsx
import { useState, useEffect } from 'react';

function Timestamp() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (time === null) return <span>--:--:--</span>;
  return <span>{time}</span>;
}
```

Сервер и клиент при первом рендере оба выдадут `«--:--:--»`. После гидратации `useEffect` запустится и установит реальное время.

### 2. Паттерн isMounted

Универсальный паттерн для компонентов, которые не должны рендерить браузерозависимый контент до завершения гидратации:

```tsx
import { useState, useEffect } from 'react';

function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

function ThemeToggle() {
  const isMounted = useIsMounted();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') ?? 'light';
    setTheme(saved);
  }, []);

  if (!isMounted) {
    return <button disabled>Загрузка...</button>;
  }

  return (
    <button onClick={() => {
      const next = theme === 'light' ? 'dark' : 'light';
      setTheme(next);
      localStorage.setItem('theme', next);
    }}>
      {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
    </button>
  );
}
```

### 3. Компонент ClientOnly

Если таких мест в приложении много, удобно вынести логику в переиспользуемый компонент-обёртку:

```tsx
import { useState, useEffect, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return <>{fallback}</>;
  return <>{children}</>;
}

// Использование
function App() {
  return (
    <div>
      <h1>Мой сайт</h1>
      <ClientOnly fallback={<p>Загрузка карты...</p>}>
        <MapComponent />
      </ClientOnly>
    </div>
  );
}
```

### 4. suppressHydrationWarning

Для случаев, когда расхождение неизбежно и некритично (например, временная метка, которую вы немедленно обновите через `useEffect`), React предоставляет атрибут `suppressHydrationWarning`:

```tsx
function LastUpdated() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
  }, []);

  return (
    <time suppressHydrationWarning>
      {time}
    </time>
  );
}
```

Атрибут работает только на уровне одного элемента и его прямых текстовых потомков. Он не подавляет ошибки в дочерних компонентах и не является заменой правильной архитектуры — используйте его только как последнее средство.

### 5. Директива use client в Next.js App Router

В Next.js 13+ с App Router компоненты по умолчанию серверные. Если компонент использует браузерные API, хуки состояния или эффекты, его нужно явно пометить:

```tsx
'use client';

import { useState, useEffect } from 'react';

export function UserGreeting() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(localStorage.getItem('username'));
  }, []);

  return <p>Привет, {name ?? 'Гость'}!</p>;
}
```

Директива `'use client'` не означает «не рендерить на сервере» — компонент всё равно получит серверный рендер. Она означает «этот компонент будет гидратирован на клиенте». Чтобы полностью отключить SSR для компонента, используйте `dynamic` с `ssr: false`:

```tsx
import dynamic from 'next/dynamic';

const HeavyClientComponent = dynamic(
  () => import('./HeavyClientComponent'),
  { ssr: false, loading: () => <p>Загрузка...</p> }
);
```

### 6. Правильная HTML-структура

Проверяйте, что вложенность тегов корректна. Особенно часто проблемы возникают с таблицами и параграфами:

```tsx
// Правильно: явный tbody
function DataTable({ rows }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Имя</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Плохо: параграф внутри параграфа (браузер сломает структуру)
function BadParagraph() {
  return (
    <p>
      Текст
      <p>Вложенный параграф</p>
    </p>
  );
}
```

## Отладка ошибок гидратации

### Читайте сообщение об ошибке внимательно

React 18 выводит конкретное расхождение: что было на сервере и что пришло с клиента. Это сразу указывает на проблемное место.

### Сравните серверный HTML с клиентским

Откройте DevTools, перейдите на вкладку Elements и посмотрите на HTML сразу после загрузки страницы (до гидратации это сложнее, но можно отключить JavaScript и посмотреть «чистый» серверный HTML). Сравните с тем, что рендерит компонент на клиенте.

### Используйте React DevTools

Extension React DevTools для Chrome и Firefox показывает дерево компонентов после гидратации. Если компонент помечен как имеющий несоответствие, он будет выделен.

### Временно добавьте логирование

```tsx
function DebugComponent() {
  const isServer = typeof window === 'undefined';
  console.log('Рендер на', isServer ? 'сервере' : 'клиенте');

  return <div>...</div>;
}
```

Посмотрите в логах сервера и в консоли браузера — что именно рендерится в каждом окружении.

## Лучшие практики

**Делайте серверный рендер детерминированным.** Компоненты должны возвращать одинаковый результат при одинаковых пропсах. Если результат зависит от времени, случайных чисел или браузерного окружения — это сигнал, что логику нужно перенести в `useEffect`.

**Разделяйте серверные и клиентские компоненты.** Держите браузерозависимую логику в листовых компонентах, как можно ближе к краю дерева. Чем меньше компонент, который оборачивается в `ClientOnly` или помечается `'use client'`, тем лучше.

**Не используйте `suppressHydrationWarning` как заглушку.** Это средство для исключительных случаев, а не способ «замести под ковёр» архитектурную проблему.

**Тестируйте SSR явно.** Пишите тесты, которые рендерят компоненты через `renderToString` из `react-dom/server` и проверяют, что вывод совпадает с клиентским рендером:

```tsx
import { renderToString } from 'react-dom/server';
import { render } from '@testing-library/react';

test('не вызывает ошибок гидратации', () => {
  const serverHtml = renderToString(<MyComponent />);
  const container = document.createElement('div');
  container.innerHTML = serverHtml;

  expect(() => {
    render(<MyComponent />, { container, hydrate: true });
  }).not.toThrow();
});
```

**Синхронизируйте начальное состояние через пропсы, а не через браузерные API.** Если странице нужны данные пользователя при первом рендере, пробрасывайте их как пропсы с сервера, а не читайте из `localStorage` при монтировании:

```tsx
// Серверный компонент (Next.js)
async function Page() {
  const user = await getUserFromSession();
  return <UserDashboard initialUser={user} />;
}

// Клиентский компонент
'use client';
function UserDashboard({ initialUser }) {
  const [user, setUser] = useState(initialUser);
  // Сервер и клиент стартуют с одинаковым значением
  return <div>Привет, {user.name}!</div>;
}
```

Ошибки гидратации — это сигнал о рассинхронизации между двумя средами выполнения. Понимание этого разрыва и осознанное управление тем, где происходит каждый тип вычислений, позволяет строить надёжные SSR-приложения без мерцания и неожиданных перерисовок.

Чтобы глубже разобраться в React, включая серверный рендеринг, хуки и паттерны проектирования компонентов, приходите на курс: [React — полный курс для разработчиков](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-hydration-errors)