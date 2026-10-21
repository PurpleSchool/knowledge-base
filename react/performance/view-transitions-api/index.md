---
metaTitle: "View Transitions API в React: анимации навигации"
metaDescription: "Как использовать View Transitions API в React 19 для плавных анимаций при навигации между страницами с компонентом ViewTransition."
author: "Антон Ларичев"
title: "View Transitions API в React: анимации навигации"
preview: "Разбираем компонент ViewTransition из React 19, CSS-настройку переходов и интеграцию с роутером для плавной навигации."
---

## Что такое View Transitions API

View Transitions API — браузерный механизм, позволяющий создавать плавные анимированные переходы между двумя состояниями DOM. Браузер автоматически делает снимок старого состояния экрана, рендерит новое состояние, а затем воспроизводит анимацию между ними. По умолчанию это перекрёстное затухание (cross-fade), но с помощью CSS анимацию можно полностью настроить.

До React 19 разработчики вызывали `document.startViewTransition()` вручную и синхронизировали его с обновлениями состояния самостоятельно. React 19 встроил поддержку на уровне фреймворка.

## ViewTransition в React 19

React 19 добавил компонент `<ViewTransition>` и научил `startTransition` автоматически запускать `document.startViewTransition` при поддержке браузером.

Принцип работы:

1. Вы оборачиваете элементы в `<ViewTransition>`.
2. Обновление состояния запускается через `startTransition`.
3. React берёт снимок DOM, применяет изменения, затем проигрывает переход.

### Установка

```bash
npm install react@19 react-dom@19
```

Реакт не нужен отдельный пакет — компонент `ViewTransition` экспортируется прямо из `react`.

```typescript
import { ViewTransition, startTransition, useState } from 'react';
```

## Базовый пример

Простейший случай — переключение между двумя панелями:

```typescript
import { ViewTransition, startTransition, useState } from 'react';

type Tab = 'home' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');

  function switchTab(next: Tab) {
    startTransition(() => {
      setTab(next);
    });
  }

  return (
    <div>
      <nav>
        <button onClick={() => switchTab('home')}>Главная</button>
        <button onClick={() => switchTab('profile')}>Профиль</button>
      </nav>

      <ViewTransition>
        {tab === 'home' ? <HomePanel /> : <ProfilePanel />}
      </ViewTransition>
    </div>
  );
}

function HomePanel() {
  return <div style={{ padding: 24 }}>Добро пожаловать на главную страницу</div>;
}

function ProfilePanel() {
  return <div style={{ padding: 24 }}>Ваш профиль</div>;
}
```

Браузер сам сделает перекрёстное затухание. Ключевое условие — обновление состояния должно быть внутри `startTransition`.

## Именованные переходы и CSS

Для анимации конкретного элемента (а не всей страницы) ему задаётся уникальное `view-transition-name`.

```typescript
import { ViewTransition } from 'react';

interface ProductCardProps {
  id: number;
  name: string;
  image: string;
}

export function ProductCard({ id, name, image }: ProductCardProps) {
  return (
    <ViewTransition name={`product-${id}`}>
      <div className="card">
        <img src={image} alt={name} />
        <h2>{name}</h2>
      </div>
    </ViewTransition>
  );
}
```

CSS для управления анимацией через псевдоэлементы:

```css
/* Плавное появление нового состояния снизу */
::view-transition-new(root) {
  animation: slide-in 300ms ease-out;
}

/* Плавное исчезновение старого состояния вверх */
::view-transition-old(root) {
  animation: slide-out 300ms ease-in;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* Анимация конкретной карточки продукта */
::view-transition-old(product-1),
::view-transition-new(product-1) {
  animation-duration: 500ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Типы переходов с addTransitionType

React 19 добавил функцию `addTransitionType`, позволяющую пометить переход типом и применять разные анимации для разных видов навигации — например, вперёд и назад.

```typescript
import { ViewTransition, startTransition, addTransitionType, useState } from 'react';

type Page = 'list' | 'detail';

export default function Catalog() {
  const [page, setPage] = useState<Page>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function openDetail(id: number) {
    startTransition(() => {
      addTransitionType('forward');
      setSelectedId(id);
      setPage('detail');
    });
  }

  function goBack() {
    startTransition(() => {
      addTransitionType('backward');
      setPage('list');
      setSelectedId(null);
    });
  }

  return (
    <ViewTransition>
      {page === 'list' ? (
        <ItemList onSelect={openDetail} />
      ) : (
        <ItemDetail id={selectedId!} onBack={goBack} />
      )}
    </ViewTransition>
  );
}
```

Теперь в CSS можно таргетировать конкретный тип через атрибут `data-transition-type` на корневом элементе:

```css
/* Переход вперёд: новый контент летит справа */
:root[data-transition-type~='forward']::view-transition-new(root) {
  animation: enter-from-right 350ms ease-out;
}

:root[data-transition-type~='forward']::view-transition-old(root) {
  animation: exit-to-left 350ms ease-in;
}

/* Переход назад: новый контент летит слева */
:root[data-transition-type~='backward']::view-transition-new(root) {
  animation: enter-from-left 350ms ease-out;
}

:root[data-transition-type~='backward']::view-transition-old(root) {
  animation: exit-to-right 350ms ease-in;
}

@keyframes enter-from-right {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

@keyframes exit-to-left {
  from { transform: translateX(0); }
  to   { transform: translateX(-100%); }
}

@keyframes enter-from-left {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}

@keyframes exit-to-right {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}
```

## Интеграция с React Router v7

React Router v7 имеет встроенную поддержку View Transitions. Достаточно передать пропс `viewTransition` в компонент `<Link>`.

```typescript
import { Link, Outlet } from 'react-router';
import { ViewTransition } from 'react';

export default function Layout() {
  return (
    <div>
      <nav>
        <Link to="/" viewTransition>Главная</Link>
        <Link to="/catalog" viewTransition>Каталог</Link>
        <Link to="/about" viewTransition>О нас</Link>
      </nav>

      <ViewTransition>
        <Outlet />
      </ViewTransition>
    </div>
  );
}
```

Для программной навигации с переходом используется хук `useNavigate` с опцией `viewTransition`:

```typescript
import { useNavigate } from 'react-router';

export function ProductCard({ id, name }: { id: number; name: string }) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/product/${id}`, { viewTransition: true });
  }

  return (
    <div
      style={{ viewTransitionName: `product-card-${id}` }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {name}
    </div>
  );
}
```

## Анимация общего элемента (shared element transition)

Одна из самых эффектных возможностей — анимация одного элемента между двумя страницами. Карточка товара в списке «перелетает» в шапку страницы детали.

```typescript
// pages/catalog.tsx
import { Link } from 'react-router';

const products = [
  { id: 1, name: 'Ноутбук', image: '/laptop.jpg' },
  { id: 2, name: 'Телефон', image: '/phone.jpg' },
];

export default function CatalogPage() {
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          <Link to={`/product/${p.id}`} viewTransition>
            <img
              src={p.image}
              alt={p.name}
              style={{ viewTransitionName: `product-image-${p.id}` }}
            />
            <span>{p.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

```typescript
// pages/product.tsx
import { useParams } from 'react-router';

export default function ProductPage() {
  const { id } = useParams();

  return (
    <div>
      <img
        src={`/${id === '1' ? 'laptop' : 'phone'}.jpg`}
        alt="Продукт"
        style={{ viewTransitionName: `product-image-${id}` }}
      />
      <h1>Страница продукта {id}</h1>
    </div>
  );
}
```

Единственное правило: `view-transition-name` должно совпадать на обеих страницах. Браузер сам интерполирует позицию, размер и форму элемента между двумя состояниями.

## Обработка отключённой анимации

Уважайте настройку `prefers-reduced-motion`. Пользователи с вестибулярными расстройствами или просто отключившие анимации не должны страдать.

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

В React можно сделать проверку программно:

```typescript
import { startTransition } from 'react';

function navigate(callback: () => void) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !document.startViewTransition) {
    callback();
    return;
  }

  startTransition(callback);
}
```

## Поддержка браузеров и деградация

View Transitions API поддерживается в Chrome 111+, Edge 111+, Safari 18+ (частично). Firefox на момент написания статьи поддержку ещё не добавил.

React корректно деградирует: если браузер не поддерживает `document.startViewTransition`, переход происходит мгновенно без анимации. Дополнительный код для деградации писать не нужно.

```typescript
// Проверка поддержки для условного рендеринга подсказки
export function useViewTransitionsSupported() {
  return typeof document !== 'undefined' &&
    'startViewTransition' in document;
}
```

## Типичные ошибки

**Обновление состояния вне startTransition.** Если вызвать `setState` напрямую, React не запустит view transition.

```typescript
// Неправильно — анимации не будет
function handleClick() {
  setPage('detail');
}

// Правильно
function handleClick() {
  startTransition(() => {
    setPage('detail');
  });
}
```

**Дублирование view-transition-name.** На странице не должно быть двух элементов с одинаковым именем одновременно — браузер проигнорирует переход для обоих.

```typescript
// Ошибка: если оба элемента видны одновременно
<img style={{ viewTransitionName: 'hero' }} />
<img style={{ viewTransitionName: 'hero' }} /> {/* конфликт */}

// Правильно: уникальные имена на основе id
<img style={{ viewTransitionName: `product-${product.id}` }} />
```

**Анимация тяжёлых компонентов.** View Transitions делает растровый снимок DOM. Если в переходе участвует большая область экрана с canvas или WebGL, производительность может просесть. Ограничивайте `view-transition-name` только теми элементами, которые нужно анимировать.

## Итоги

View Transitions API в React 19 даёт мощный инструмент для создания плавных переходов без сторонних библиотек анимации. Основные моменты:

- Оборачивайте анимируемые области в `<ViewTransition>`.
- Запускайте обновления через `startTransition`.
- Используйте `addTransitionType` для разных видов навигации.
- Задавайте `view-transition-name` для анимации конкретных элементов.
- Не забывайте про `prefers-reduced-motion`.
- React Router v7 поддерживает переходы из коробки через пропс `viewTransition`.

Полное погружение в React — включая новые возможности 19-й версии, архитектуру компонентов и работу с состоянием — на курсе PurpleSchool:
https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-view-transitions
