---
metaTitle: "Порталы в React (Portals) — рендер вне иерархии компонентов"
metaDescription: "Полное руководство по React Portals: как рендерить компоненты вне родительского DOM-узла, применение для модальных окон, тултипов, уведомлений и обработка событий."
author: Олег Марков
title: "Порталы в React: рендер компонентов вне иерархии DOM"
preview: Разбираем React Portals — createPortal, применение для модальных окон и тултипов, всплытие событий через React-дерево и особенности SSR.
---

# Портals — рендер вне иерархии DOM

**Portal** — это механизм React, позволяющий рендерить дочерний компонент в **другой узел DOM**, находящийся вне иерархии родительского компонента. При этом компонент остаётся частью React-дерева и получает события и контекст от своих родителей.

```tsx
import { createPortal } from 'react-dom';

function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="modal">{children}</div>,
    document.body  // Рендерим прямо в body, а не внутри родителя
  );
}
```

## Проблема: CSS overflow и z-index

Порталы решают классическую проблему: компонент внутри контейнера с `overflow: hidden` или `z-index` не может выйти за его пределы.

```tsx
// ❌ Проблема: модальное окно обрезается overflow: hidden
// HTML-структура:
// <div style="overflow: hidden; position: relative;">  ← родитель
//   <div class="modal">...</div>                        ← модалка обрезана!
// </div>

// ✅ Решение с Portal: модалка рендерится в body
// <div style="overflow: hidden;">...</div>             ← родитель в DOM
// <div class="modal">...</div>                         ← модалка в body!
```

## Создание портала: createPortal

```tsx
import { createPortal } from 'react-dom';

// Сигнатура:
// createPortal(children, domNode, key?)
//   children — JSX для рендера
//   domNode  — DOM-узел назначения
//   key      — опциональный уникальный ключ

function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && createPortal(
        <div className="tooltip">{text}</div>,
        document.body
      )}
    </div>
  );
}
```

## Модальное окно через Portal

Наиболее распространённый случай применения порталов — модальные окна:

```tsx
// components/Modal.tsx
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Блокируем скролл
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-content"
        ref={modalRef}
        onClick={e => e.stopPropagation()} // Не закрывать при клике внутри
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
```

```tsx
// Использование
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ overflow: 'hidden', height: '200px' }}>
      <button onClick={() => setIsModalOpen(true)}>Открыть модальное окно</button>

      {/* Modal рендерится в document.body, не внутри overflow: hidden */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Подтверждение"
      >
        <p>Вы уверены?</p>
        <button onClick={() => setIsModalOpen(false)}>Да</button>
      </Modal>
    </div>
  );
}
```

## Всплытие событий через Portal

Несмотря на то что портал рендерится вне DOM-иерархии, **события всплывают по React-дереву**, а не по DOM-дереву.

```tsx
function Parent() {
  const handleClick = () => {
    console.log('Клик перехвачен родителем!');
    // Сработает, даже если портал рендерится в document.body
  };

  return (
    <div onClick={handleClick}>
      <p>Родительский элемент</p>
      {createPortal(
        <button>Кнопка в портале</button>, // Рендерится в body
        document.body
      )}
    </div>
  );
}
```

Это означает, что:
- **Контекст** React доступен внутри портала
- **Обработчики событий** родителей перехватывают события из портала
- **Состояние** и **пропсы** работают как обычно

## Кастомный хук usePortal

```tsx
// hooks/usePortal.ts
import { useEffect, useRef } from 'react';

function usePortal(id: string = 'portal-root') {
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Ищем существующий контейнер или создаём новый
    let portal = document.getElementById(id) as HTMLDivElement;

    if (!portal) {
      portal = document.createElement('div');
      portal.id = id;
      document.body.appendChild(portal);
    }

    portalRef.current = portal;

    return () => {
      // Удаляем контейнер если он пустой
      if (portal.childNodes.length === 0) {
        portal.remove();
      }
    };
  }, [id]);

  return portalRef.current;
}

// Использование хука
function Notification({ message }: { message: string }) {
  const portal = usePortal('notifications');

  if (!portal) return null;

  return createPortal(
    <div className="notification">{message}</div>,
    portal
  );
}
```

## Server-Side Rendering (SSR)

При SSR `document` недоступен. Порталы нужно рендерить только на клиенте:

```tsx
// components/ClientPortal.tsx
'use client'; // Next.js App Router

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

interface ClientPortalProps {
  children: React.ReactNode;
  selector?: string;
}

function ClientPortal({ children, selector = 'body' }: ClientPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target = document.querySelector(selector);
  if (!target) return null;

  return createPortal(children, target);
}

// Использование в Next.js
function MyModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <ClientPortal selector="body">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content">
          <p>Контент модального окна</p>
        </div>
      </div>
    </ClientPortal>
  );
}
```

## Использование в React 19

В React 19 появилась возможность рендерить порталы в `<head>` для метаданных:

```tsx
// React 19 — нативные метаданные через Portal-подобный механизм
function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      {/* React 19 автоматически перемещает эти теги в <head> */}
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <link rel="canonical" href={post.url} />

      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

## Типичные случаи применения

| Случай | Причина использования Portal |
|--------|------------------------------|
| Модальные окна | Выход за пределы `overflow: hidden` |
| Тултипы и поповеры | Корректный `z-index` поверх любого контента |
| Уведомления (toasts) | Всегда в углу экрана вне зависимости от родителя |
| Выпадающие меню | Избежать обрезания по границам контейнера |
| Глобальный лоадер | Перекрытие всего интерфейса |

## Краткое резюме

| Концепция | Суть |
|-----------|------|
| Portal | Рендер в другой DOM-узел, оставаясь в React-дереве |
| `createPortal` | API для создания портала |
| Всплытие событий | Идёт по React-дереву, не по DOM |
| Контекст | Полностью доступен внутри портала |
| SSR | Нужна защита от `document is not defined` |

## Дополнительные материалы

- [React Docs — createPortal](https://react.dev/reference/react-dom/createPortal)
- [React Docs — Portals](https://react.dev/learn/portals)
- [MDN — Dialog элемент](https://developer.mozilla.org/ru/docs/Web/HTML/Element/dialog)
