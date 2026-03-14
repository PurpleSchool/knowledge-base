---
metaTitle: Анимация при монтировании компонентов в React
metaDescription: Узнайте, как добавить анимацию при монтировании и размонтировании компонентов в React с помощью react-transition-group, CSS-переходов и хуков useEffect
author: Олег Марков
title: Анимация при монтировании компонентов в React
preview: Научитесь создавать плавные анимации при появлении и исчезновении компонентов в React — разберём подходы с CSS-классами, react-transition-group и нативными хуками
---

## Введение

Анимации при монтировании и размонтировании компонентов — один из ключевых инструментов создания отзывчивого пользовательского интерфейса. Когда элемент появляется или исчезает с экрана плавно, а не мгновенно, это значительно улучшает восприятие продукта.

В React анимация при монтировании связана с определённой сложностью: компонент либо существует в DOM, либо нет. Это делает переходы при появлении/исчезновении нетривиальными по сравнению с обычными CSS-переходами. В этой статье вы узнаете, как решить эту задачу несколькими способами — от простых CSS-классов до библиотеки `react-transition-group`.

## Почему анимация при монтировании сложнее обычной

В обычном HTML вы можете добавить CSS-переход к любому элементу, и он будет срабатывать при изменении свойств. Но в React, когда компонент размонтируется, он немедленно удаляется из DOM — без какой-либо задержки для анимации исчезновения.

Рассмотрим простой пример:

```jsx
function App() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button onClick={() => setShow(!show)}>Переключить</button>
      {show && <div className="box">Я появляюсь и исчезаю</div>}
    </div>
  );
}
```

Здесь `.box` мгновенно появляется и исчезает. Анимацию появления ещё можно добавить через CSS, но анимация исчезновения требует дополнительной логики — нужно сначала запустить анимацию, дождаться её завершения, и только потом убрать элемент из DOM.

## Подход 1: CSS-переходы с useEffect

Самый простой способ — использовать хук `useEffect` для управления CSS-классами.

### Базовая реализация

```jsx
import { useState, useEffect } from 'react';
import './styles.css';

function FadeBox({ children, isVisible }) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Монтируем компонент
      setShouldRender(true);
      // Небольшая задержка для запуска transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      // Запускаем анимацию исчезновения
      setIsAnimating(false);
    }
  }, [isVisible]);

  // Удаляем компонент из DOM после анимации исчезновения
  const handleTransitionEnd = () => {
    if (!isVisible) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fade-box ${isAnimating ? 'fade-box--visible' : ''}`}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  );
}
```

```css
/* styles.css */
.fade-box {
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 300ms ease, transform 300ms ease;
}

.fade-box--visible {
  opacity: 1;
  transform: translateY(0);
}
```

Двойной вызов `requestAnimationFrame` нужен для того, чтобы браузер успел применить начальные стили перед запуском перехода. Это стандартная техника форсирования CSS-перерисовки.

### Использование компонента

```jsx
function App() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button onClick={() => setShow(!show)}>
        {show ? 'Скрыть' : 'Показать'}
      </button>
      <FadeBox isVisible={show}>
        <p>Я анимируюсь при появлении и исчезновении!</p>
      </FadeBox>
    </div>
  );
}
```

## Подход 2: Библиотека react-transition-group

`react-transition-group` — стандартная библиотека для управления жизненным циклом анимаций в React. Она предоставляет несколько компонентов, из которых `Transition` и `CSSTransition` наиболее полезны для анимации при монтировании.

### Установка

```bash
npm install react-transition-group
# или
yarn add react-transition-group
```

### Компонент Transition

`Transition` — базовый компонент, который отслеживает состояния: `entering`, `entered`, `exiting`, `exited`. Вы сами управляете стилями на основе этих состояний.

```jsx
import { Transition } from 'react-transition-group';

const duration = 300;

const defaultStyle = {
  transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
  opacity: 0,
  transform: 'translateY(-10px)',
};

const transitionStyles = {
  entering: { opacity: 1, transform: 'translateY(0)' },
  entered:  { opacity: 1, transform: 'translateY(0)' },
  exiting:  { opacity: 0, transform: 'translateY(-10px)' },
  exited:   { opacity: 0, transform: 'translateY(-10px)' },
};

function FadeBox({ isVisible, children }) {
  return (
    <Transition in={isVisible} timeout={duration} unmountOnExit mountOnEnter>
      {(state) => (
        <div
          style={{
            ...defaultStyle,
            ...transitionStyles[state],
          }}
        >
          {children}
        </div>
      )}
    </Transition>
  );
}
```

Обратите внимание на два важных пропа:
- `unmountOnExit` — удаляет компонент из DOM после завершения анимации исчезновения
- `mountOnEnter` — добавляет компонент в DOM только при первом появлении (ленивая инициализация)

### Состояния Transition

`Transition` проходит через четыре состояния:

| Состояние | Когда | Описание |
|-----------|-------|----------|
| `entering` | Начало появления | Компонент добавлен в DOM, переход начинается |
| `entered` | После появления | Переход завершён, компонент полностью виден |
| `exiting` | Начало исчезновения | Запущен переход на исчезновение |
| `exited` | После исчезновения | Переход завершён, компонент скрыт или удалён |

### Пропы Transition

```jsx
<Transition
  in={isVisible}        // boolean — триггер появления/исчезновения
  timeout={300}         // мс — длительность перехода
  mountOnEnter          // монтировать только при первом in=true
  unmountOnExit         // размонтировать после exited
  appear                // анимировать при первом рендере (если in=true)
  onEnter={fn}          // callback при начале появления
  onEntering={fn}       // callback во время появления
  onEntered={fn}        // callback после завершения появления
  onExit={fn}           // callback при начале исчезновения
  onExiting={fn}        // callback во время исчезновения
  onExited={fn}         // callback после завершения исчезновения
>
  {(state) => <div>...</div>}
</Transition>
```

### Компонент CSSTransition

`CSSTransition` — более удобный вариант, когда стили задаются через CSS-классы. Он автоматически добавляет и удаляет классы в зависимости от состояния.

```jsx
import { CSSTransition } from 'react-transition-group';
import './fade.css';

function FadeBox({ isVisible, children }) {
  return (
    <CSSTransition
      in={isVisible}
      timeout={300}
      classNames="fade"
      unmountOnExit
      mountOnEnter
    >
      <div>{children}</div>
    </CSSTransition>
  );
}
```

```css
/* fade.css */

/* Начальное состояние при появлении */
.fade-enter {
  opacity: 0;
  transform: translateY(-10px);
}

/* Активная фаза появления */
.fade-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease, transform 300ms ease;
}

/* Состояние после появления (можно не задавать, если совпадает с обычными стилями) */
.fade-enter-done {
  opacity: 1;
  transform: translateY(0);
}

/* Начальное состояние при исчезновении */
.fade-exit {
  opacity: 1;
  transform: translateY(0);
}

/* Активная фаза исчезновения */
.fade-exit-active {
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 300ms ease, transform 300ms ease;
}
```

Паттерн именования классов: `{classNames}-enter`, `{classNames}-enter-active`, `{classNames}-enter-done`, `{classNames}-exit`, `{classNames}-exit-active`, `{classNames}-exit-done`.

### Пропа appear

По умолчанию анимация при монтировании не воспроизводится, если компонент уже виден при первом рендере. Пропа `appear` изменяет это поведение:

```jsx
<CSSTransition
  in={true}
  timeout={300}
  classNames="fade"
  appear  // анимировать при первом рендере
>
  <div>Я анимируюсь сразу при загрузке страницы</div>
</CSSTransition>
```

При использовании `appear` добавляются дополнительные классы: `fade-appear` и `fade-appear-active`.

```css
.fade-appear {
  opacity: 0;
}

.fade-appear-active {
  opacity: 1;
  transition: opacity 500ms ease;
}
```

## Подход 3: Кастомный хук useMountTransition

Вы можете инкапсулировать логику анимации при монтировании в переиспользуемый хук:

```jsx
import { useState, useEffect } from 'react';

function useMountTransition(isVisible, transitionDuration) {
  const [hasTransitionedIn, setHasTransitionedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (isVisible && !isMounted) {
      setIsMounted(true);
      // Небольшая задержка для форсирования перерисовки
      timeoutId = setTimeout(() => setHasTransitionedIn(true), 10);
    } else if (!isVisible && hasTransitionedIn) {
      setHasTransitionedIn(false);
      // Ждём завершения анимации, затем размонтируем
      timeoutId = setTimeout(() => setIsMounted(false), transitionDuration);
    }

    return () => clearTimeout(timeoutId);
  }, [isVisible, transitionDuration, hasTransitionedIn, isMounted]);

  return { isMounted, hasTransitionedIn };
}
```

### Использование хука

```jsx
import './styles.css';

function Modal({ isVisible, children }) {
  const { isMounted, hasTransitionedIn } = useMountTransition(isVisible, 300);

  if (!isMounted) return null;

  return (
    <div className={`modal ${hasTransitionedIn ? 'modal--visible' : ''}`}>
      {children}
    </div>
  );
}
```

```css
.modal {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 300ms ease, transform 300ms ease;
}

.modal--visible {
  opacity: 1;
  transform: scale(1);
}
```

## Практические примеры

### Анимированное модальное окно

```jsx
import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import './modal.css';

function AnimatedModal({ isOpen, onClose, children }) {
  const nodeRef = useRef(null);

  return (
    <>
      {/* Оверлей */}
      <CSSTransition
        in={isOpen}
        timeout={300}
        classNames="overlay"
        unmountOnExit
        mountOnEnter
      >
        <div className="overlay" onClick={onClose} />
      </CSSTransition>

      {/* Само модальное окно */}
      <CSSTransition
        in={isOpen}
        timeout={300}
        classNames="modal"
        unmountOnExit
        mountOnEnter
        nodeRef={nodeRef}
      >
        <div ref={nodeRef} className="modal">
          <button className="modal__close" onClick={onClose}>×</button>
          <div className="modal__content">{children}</div>
        </div>
      </CSSTransition>
    </>
  );
}
```

```css
/* Оверлей */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.overlay-enter {
  opacity: 0;
}
.overlay-enter-active {
  opacity: 1;
  transition: opacity 300ms ease;
}
.overlay-exit {
  opacity: 1;
}
.overlay-exit-active {
  opacity: 0;
  transition: opacity 300ms ease;
}

/* Модальное окно */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  padding: 24px;
  min-width: 320px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-enter {
  opacity: 0;
  transform: translate(-50%, -48%) scale(0.95);
}
.modal-enter-active {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  transition: opacity 300ms ease, transform 300ms ease;
}
.modal-exit {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
.modal-exit-active {
  opacity: 0;
  transform: translate(-50%, -48%) scale(0.95);
  transition: opacity 300ms ease, transform 300ms ease;
}
```

### Анимированное уведомление (Toast)

```jsx
import { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import './toast.css';

function Toast({ message, isVisible, onHide }) {
  return (
    <CSSTransition
      in={isVisible}
      timeout={400}
      classNames="toast"
      unmountOnExit
      mountOnEnter
    >
      <div className="toast">
        <span>{message}</span>
        <button onClick={onHide}>✕</button>
      </div>
    </CSSTransition>
  );
}

// Использование
function App() {
  const [show, setShow] = useState(false);

  const showToast = () => {
    setShow(true);
    setTimeout(() => setShow(false), 3000);
  };

  return (
    <div>
      <button onClick={showToast}>Показать уведомление</button>
      <Toast
        message="Операция выполнена успешно!"
        isVisible={show}
        onHide={() => setShow(false)}
      />
    </div>
  );
}
```

```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #333;
  color: white;
  padding: 12px 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-enter {
  opacity: 0;
  transform: translateX(100%);
}
.toast-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 400ms ease, transform 400ms ease;
}
.toast-exit {
  opacity: 1;
  transform: translateX(0);
}
.toast-exit-active {
  opacity: 0;
  transform: translateX(100%);
  transition: opacity 400ms ease, transform 400ms ease;
}
```

### Анимированный выпадающий список

```jsx
import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import './dropdown.css';

function Dropdown({ isOpen, items }) {
  const dropdownRef = useRef(null);

  return (
    <CSSTransition
      in={isOpen}
      timeout={200}
      classNames="dropdown"
      unmountOnExit
      mountOnEnter
      nodeRef={dropdownRef}
    >
      <ul ref={dropdownRef} className="dropdown">
        {items.map((item, index) => (
          <li key={index} className="dropdown__item">
            {item}
          </li>
        ))}
      </ul>
    </CSSTransition>
  );
}
```

```css
.dropdown {
  position: absolute;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  list-style: none;
  padding: 4px 0;
  margin: 0;
  overflow: hidden;
}

.dropdown-enter {
  opacity: 0;
  transform: scaleY(0.8);
  transform-origin: top;
}
.dropdown-enter-active {
  opacity: 1;
  transform: scaleY(1);
  transition: opacity 200ms ease, transform 200ms ease;
}
.dropdown-exit {
  opacity: 1;
  transform: scaleY(1);
  transform-origin: top;
}
.dropdown-exit-active {
  opacity: 0;
  transform: scaleY(0.8);
  transition: opacity 200ms ease, transform 200ms ease;
}
```

## Советы и лучшие практики

### Используйте nodeRef для избежания устаревшего API

В последних версиях `react-transition-group` рекомендуется передавать `nodeRef`, чтобы избежать использования `findDOMNode`:

```jsx
import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

function AnimatedBox({ isVisible }) {
  const nodeRef = useRef(null);

  return (
    <CSSTransition
      in={isVisible}
      timeout={300}
      classNames="box"
      nodeRef={nodeRef}
      unmountOnExit
    >
      <div ref={nodeRef} className="box">
        Содержимое
      </div>
    </CSSTransition>
  );
}
```

### Согласуйте timeout с длительностью CSS-перехода

Значение `timeout` в `Transition`/`CSSTransition` должно соответствовать длительности вашего CSS-перехода. Если они не совпадают, анимация будет обрезана или классы удалятся раньше времени:

```jsx
// ✓ Правильно: timeout совпадает с transition-duration в CSS
<CSSTransition timeout={300} classNames="fade">
  ...
</CSSTransition>
```

```css
/* transition-duration тоже 300ms */
.fade-enter-active {
  transition: opacity 300ms ease;
}
```

### Задавайте разные timeout для появления и исчезновения

Иногда полезно сделать исчезновение быстрее появления:

```jsx
<CSSTransition
  timeout={{ enter: 400, exit: 200 }}
  classNames="slide"
>
  ...
</CSSTransition>
```

```css
.slide-enter-active {
  transition: transform 400ms ease;
}
.slide-exit-active {
  transition: transform 200ms ease;
}
```

### Избегайте анимации для пользователей с prefers-reduced-motion

Уважайте системные настройки пользователей, которые предпочитают уменьшенное движение:

```css
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-exit-active {
    transition: none;
  }
}
```

### Производительность: используйте transform вместо top/left

Анимации через `transform` и `opacity` выполняются на GPU и не вызывают перекомпоновки (reflow), что обеспечивает 60fps:

```css
/* ✓ Хорошо — GPU анимация */
.element-enter {
  opacity: 0;
  transform: translateY(20px);
}

/* ✗ Плохо — вызывает reflow */
.element-enter {
  top: -20px;
}
```

## Сравнение подходов

| Подход | Плюсы | Минусы | Когда использовать |
|--------|-------|--------|--------------------|
| `useEffect` + CSS-классы | Без зависимостей | Больше кода, сложнее поддерживать | Простые случаи |
| `Transition` | Гибкость, inline-стили | Verbose синтаксис | Динамические стили |
| `CSSTransition` | Чистый код, CSS-классы | Зависимость от библиотеки | Большинство случаев |
| Кастомный хук | Переиспользование | Нужно реализовать самому | Много одинаковых анимаций |

## Итоги

Анимация при монтировании в React требует особого подхода, поскольку компонент удаляется из DOM немедленно. Основные решения:

- **Нативный подход** с `useEffect`: подходит для простых случаев без лишних зависимостей, но требует больше кода.
- **`Transition`** из `react-transition-group`: максимальная гибкость, inline-стили на основе состояния.
- **`CSSTransition`** из `react-transition-group`: самый удобный вариант для большинства задач — управляет CSS-классами автоматически.
- **Кастомный хук**: отличный вариант для переиспользования логики в нескольких компонентах.

Помните о производительности (используйте `transform` и `opacity`), о пользователях с `prefers-reduced-motion`, и всегда синхронизируйте `timeout` библиотеки с `transition-duration` в CSS.
