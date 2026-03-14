---
metaTitle: CSSTransition - CSS переходы в React с react-transition-group
metaDescription: Полное руководство по CSSTransition из react-transition-group: установка, classNames, lifecycle-коллбэки, TransitionGroup, SwitchTransition и анимации появления/исчезновения
author: Олег Марков
title: CSSTransition - переходы
preview: Изучите CSSTransition из react-transition-group для плавных CSS-переходов в React. classNames, lifecycle-коллбэки, TransitionGroup для анимации списков и SwitchTransition для смены компонентов
---

## Введение

Когда вам нужно добавить в React-приложение простые, но эффектные анимации появления и исчезновения элементов — без тяжёлых зависимостей и сложного API — библиотека **react-transition-group** становится отличным выбором. Это низкоуровневый примитив, который управляет состояниями перехода, а вы описываете визуальный эффект через обычный CSS.

**CSSTransition** — основной компонент библиотеки. Он отслеживает, когда элемент появляется или исчезает, и добавляет ему CSS-классы в нужный момент. Вы пишете CSS, который обрабатывает эти классы, и получаете анимацию. Никакой магии, только контролируемые состояния и ваши стили.

react-transition-group существует с 2015 года и давно является частью официальной экосистемы React. Библиотека намеренно минималистична: она не навязывает конкретных анимаций, не генерирует CSS — она только управляет жизненным циклом перехода.

### Когда использовать CSSTransition

CSSTransition хорошо подходит для:

- Анимации появления и исчезновения отдельных элементов (модальные окна, уведомления, тултипы)
- Анимации списков — добавление и удаление элементов с плавным переходом
- Смены компонентов (tabs, роутинг)
- Любых случаев, когда анимация уже написана в CSS и нужно только подключить её к React

Если вы хотите сложные пружинные анимации или анимации на основе жестов — посмотрите в сторону Framer Motion или React Spring. Но для типичных UI-переходов CSSTransition — это просто, надёжно и без лишнего веса.

## Установка

Устанавливайте react-transition-group через npm или yarn:

```bash
npm install react-transition-group
```

Если вы используете TypeScript, типы включены в пакет с версии 4.x:

```bash
npm install react-transition-group
# @types уже не нужны — типы встроены
```

Для более старых версий (если по какой-то причине используете v3):

```bash
npm install @types/react-transition-group
```

Пакет небольшой — около 7 КБ в минифицированном виде. Он не тянет за собой дополнительных зависимостей.

## Основные концепции

Перед тем как смотреть на код, разберём, как работает CSSTransition изнутри.

### Состояния перехода

CSSTransition управляет четырьмя фазами жизненного цикла элемента:

- **entering** — элемент начинает появляться
- **entered** — элемент полностью появился
- **exiting** — элемент начинает исчезать
- **exited** — элемент полностью исчез

В каждой из этих фаз компонент добавляет соответствующий CSS-класс к дочернему элементу. Именно через эти классы вы управляете анимацией.

### Как работают classNames

Проп `classNames` — это ключ к пониманию CSSTransition. Допустим, вы передаёте `classNames="fade"`. Тогда компонент будет добавлять такие классы:

| Фаза | CSS-класс |
|------|-----------|
| Начало появления | `fade-enter` |
| Активная фаза появления | `fade-enter-active` |
| Конец появления | `fade-enter-done` |
| Начало исчезновения | `fade-exit` |
| Активная фаза исчезновения | `fade-exit-active` |
| Конец исчезновения | `fade-exit-done` |

Вы пишете CSS-правила для этих классов, и браузер применяет переходы.

## Первый пример: простой fade

Вот минимальный рабочий пример. Допустим, нужно плавно показывать и скрывать блок:

```tsx
import React, { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import './styles.css';

function FadeExample() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button onClick={() => setShow(!show)}>
        {show ? 'Скрыть' : 'Показать'}
      </button>

      <CSSTransition
        in={show}
        timeout={300}
        classNames="fade"
        unmountOnExit
      >
        <div className="box">
          Этот блок плавно появляется и исчезает
        </div>
      </CSSTransition>
    </div>
  );
}
```

CSS для этого примера:

```css
/* Начальное состояние при появлении */
.fade-enter {
  opacity: 0;
}

/* Активная анимация появления */
.fade-enter-active {
  opacity: 1;
  transition: opacity 300ms ease-in;
}

/* Начальное состояние при исчезновении */
.fade-exit {
  opacity: 1;
}

/* Активная анимация исчезновения */
.fade-exit-active {
  opacity: 0;
  transition: opacity 300ms ease-out;
}
```

Разберём ключевые пропсы:

- **`in`** — булево значение, управляет видимостью. `true` запускает анимацию появления, `false` — исчезновения
- **`timeout`** — длительность анимации в миллисекундах. Должна совпадать с `transition-duration` в CSS
- **`classNames`** — префикс для CSS-классов
- **`unmountOnExit`** — удаляет DOM-элемент после исчезновения (иначе элемент остаётся в DOM со стилями `display: none`)

## Проп timeout в деталях

`timeout` может быть числом или объектом, если время появления и исчезновения разное:

```tsx
<CSSTransition
  in={show}
  timeout={{ enter: 300, exit: 500 }}
  classNames="slide"
>
  <div>Появляется быстро, исчезает медленно</div>
</CSSTransition>
```

CSS должен соответствовать:

```css
.slide-enter-active {
  transition: transform 300ms ease-out;
}

.slide-exit-active {
  transition: transform 500ms ease-in;
}
```

**Важно**: если `timeout` и `transition-duration` в CSS не совпадают, CSSTransition переключит состояние раньше или позже, чем закончится анимация. Это частая причина "прыгающих" анимаций.

## Примеры анимаций

### Slide-анимация (скольжение)

```css
.slide-enter {
  transform: translateX(-100%);
}

.slide-enter-active {
  transform: translateX(0);
  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.slide-exit {
  transform: translateX(0);
}

.slide-exit-active {
  transform: translateX(100%);
  transition: transform 400ms cubic-bezier(0.55, 0, 1, 0.45);
}
```

### Появление с масштабированием (scale + fade)

```css
.zoom-enter {
  opacity: 0;
  transform: scale(0.85);
}

.zoom-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: opacity 250ms ease-out, transform 250ms ease-out;
}

.zoom-exit {
  opacity: 1;
  transform: scale(1);
}

.zoom-exit-active {
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 200ms ease-in, transform 200ms ease-in;
}
```

### Анимация модального окна

```tsx
function Modal({ isOpen, onClose, children }) {
  return (
    <CSSTransition
      in={isOpen}
      timeout={250}
      classNames="modal"
      unmountOnExit
    >
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </CSSTransition>
  );
}
```

```css
.modal-enter .modal-overlay {
  opacity: 0;
}

.modal-enter-active .modal-overlay {
  opacity: 1;
  transition: opacity 250ms ease;
}

/* Или используйте data-атрибуты для вложенных элементов */
.modal-enter {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.modal-enter-active {
  opacity: 1;
  transform: scale(1) translateY(0);
  transition: opacity 250ms ease, transform 250ms ease;
}

.modal-exit {
  opacity: 1;
}

.modal-exit-active {
  opacity: 0;
  transition: opacity 200ms ease;
}
```

## Lifecycle callbacks

CSSTransition предоставляет набор коллбэков, которые вызываются в каждой фазе перехода. Это полезно для точного управления фокусом, скроллом или любой логикой, которую нужно синхронизировать с анимацией:

```tsx
<CSSTransition
  in={show}
  timeout={300}
  classNames="fade"
  onEnter={() => console.log('Начало появления')}
  onEntering={() => console.log('Анимация появления активна')}
  onEntered={() => {
    console.log('Элемент полностью появился');
    inputRef.current?.focus(); // Фокус после появления
  }}
  onExit={() => console.log('Начало исчезновения')}
  onExiting={() => console.log('Анимация исчезновения активна')}
  onExited={() => {
    console.log('Элемент исчез');
    onClose(); // Вызываем закрытие после анимации
  }}
>
  <div>Контент</div>
</CSSTransition>
```

Коллбэки принимают DOM-узел первым аргументом, что позволяет манипулировать элементом напрямую:

```tsx
<CSSTransition
  in={show}
  timeout={300}
  classNames="fade"
  onEnter={(node) => {
    // node — это реальный DOM-элемент
    node.style.height = '0px';
  }}
  onEntering={(node) => {
    node.style.height = node.scrollHeight + 'px';
  }}
  onEntered={(node) => {
    node.style.height = 'auto'; // Убираем фиксированную высоту
  }}
>
  <div>Аккордеон</div>
</CSSTransition>
```

## Проп appear

По умолчанию CSSTransition не анимирует элемент при первом рендере — только при последующих изменениях `in`. Проп `appear` включает анимацию при монтировании:

```tsx
<CSSTransition
  in={true}
  timeout={500}
  classNames="fade"
  appear
>
  <div>Этот блок анимируется при первой загрузке страницы</div>
</CSSTransition>
```

При использовании `appear` добавляются классы `fade-appear` и `fade-appear-active`. Если вы хотите использовать те же стили, что и для `enter`, дублируйте правила:

```css
.fade-enter,
.fade-appear {
  opacity: 0;
}

.fade-enter-active,
.fade-appear-active {
  opacity: 1;
  transition: opacity 500ms ease;
}
```

## Использование с CSS Modules

Если вы используете CSS Modules (или любой CSS-in-JS с генерацией классов), вместо строки `classNames` передайте объект:

```tsx
import styles from './Animation.module.css';

<CSSTransition
  in={show}
  timeout={300}
  classNames={{
    enter: styles.enter,
    enterActive: styles.enterActive,
    enterDone: styles.enterDone,
    exit: styles.exit,
    exitActive: styles.exitActive,
    exitDone: styles.exitDone,
  }}
>
  <div>Контент</div>
</CSSTransition>
```

Это решает проблему глобальных CSS-классов и конфликтов имён.

Пример с CSS Modules:

```css
/* Animation.module.css */
.enter {
  opacity: 0;
  transform: translateY(-20px);
}

.enterActive {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease, transform 300ms ease;
}

.exit {
  opacity: 1;
}

.exitActive {
  opacity: 0;
  transition: opacity 300ms ease;
}
```

## TransitionGroup — анимация списков

**TransitionGroup** — компонент-обёртка для анимации динамических списков. Он отслеживает добавление и удаление дочерних элементов и автоматически управляет их `in`-пропом.

```tsx
import { TransitionGroup, CSSTransition } from 'react-transition-group';

interface TodoItem {
  id: number;
  text: string;
}

function TodoList() {
  const [items, setItems] = useState<TodoItem[]>([
    { id: 1, text: 'Купить продукты' },
    { id: 2, text: 'Написать отчёт' },
  ]);

  const addItem = () => {
    const newId = Date.now();
    setItems([...items, { id: newId, text: `Задача ${newId}` }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div>
      <button onClick={addItem}>Добавить задачу</button>

      <TransitionGroup component="ul">
        {items.map(item => (
          <CSSTransition
            key={item.id}
            timeout={300}
            classNames="list-item"
          >
            <li>
              {item.text}
              <button onClick={() => removeItem(item.id)}>✕</button>
            </li>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
}
```

CSS для анимации списка:

```css
.list-item-enter {
  opacity: 0;
  transform: translateX(-20px);
}

.list-item-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 300ms ease, transform 300ms ease;
}

.list-item-exit {
  opacity: 1;
  transform: translateX(0);
}

.list-item-exit-active {
  opacity: 0;
  transform: translateX(20px);
  transition: opacity 300ms ease, transform 300ms ease;
}
```

Важные особенности TransitionGroup:

- Каждый дочерний CSSTransition **должен иметь уникальный `key`** — по нему TransitionGroup отслеживает добавление и удаление
- Проп `component` задаёт тег-обёртку (по умолчанию `div`). Передайте `null`, чтобы не добавлять лишний DOM-элемент
- TransitionGroup сам управляет пропом `in` — не передавайте его вручную

## SwitchTransition — смена одного компонента другим

**SwitchTransition** управляет переходом между двумя состояниями — когда один компонент должен смениться другим. В отличие от TransitionGroup, здесь всегда присутствует ровно один дочерний элемент.

```tsx
import { SwitchTransition, CSSTransition } from 'react-transition-group';

function TabContent({ activeTab }: { activeTab: string }) {
  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        key={activeTab}
        timeout={200}
        classNames="fade"
      >
        <div className="tab-content">
          Контент вкладки: {activeTab}
        </div>
      </CSSTransition>
    </SwitchTransition>
  );
}
```

Параметр `mode` определяет порядок анимаций:

- **`out-in`** (по умолчанию) — сначала уходит старый элемент, потом появляется новый
- **`in-out`** — сначала появляется новый, потом уходит старый

При смене `key` SwitchTransition видит, что элемент изменился, и запускает сначала exit-анимацию, потом enter-анимацию.

### Пример: анимированный счётчик

```tsx
function AnimatedCounter() {
  const [count, setCount] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  const increment = () => {
    setDirection('up');
    setCount(c => c + 1);
  };

  const decrement = () => {
    setDirection('down');
    setCount(c => c - 1);
  };

  return (
    <div>
      <button onClick={decrement}>−</button>

      <SwitchTransition>
        <CSSTransition
          key={count}
          timeout={200}
          classNames={direction === 'up' ? 'slide-up' : 'slide-down'}
        >
          <span className="counter-value">{count}</span>
        </CSSTransition>
      </SwitchTransition>

      <button onClick={increment}>+</button>
    </div>
  );
}
```

```css
/* Увеличение: новое число приходит снизу */
.slide-up-enter {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-enter-active {
  transform: translateY(0);
  opacity: 1;
  transition: transform 200ms ease, opacity 200ms ease;
}

.slide-up-exit {
  transform: translateY(0);
  opacity: 1;
}

.slide-up-exit-active {
  transform: translateY(-20px);
  opacity: 0;
  transition: transform 200ms ease, opacity 200ms ease;
}

/* Уменьшение: новое число приходит сверху */
.slide-down-enter {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-down-enter-active {
  transform: translateY(0);
  opacity: 1;
  transition: transform 200ms ease, opacity 200ms ease;
}

.slide-down-exit {
  transform: translateY(0);
  opacity: 1;
}

.slide-down-exit-active {
  transform: translateY(20px);
  opacity: 0;
  transition: transform 200ms ease, opacity 200ms ease;
}
```

## Интеграция с React Router

CSSTransition хорошо работает с анимацией переходов между страницами. С React Router v6 схема выглядит так:

```tsx
import { useLocation } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <TransitionGroup>
      <CSSTransition
        key={location.pathname}
        classNames="page"
        timeout={300}
        unmountOnExit
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
}
```

```css
.page-enter {
  opacity: 0;
  transform: translateX(30px);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 300ms ease, transform 300ms ease;
}

.page-exit {
  opacity: 1;
  transform: translateX(0);
}

.page-exit-active {
  opacity: 0;
  transform: translateX(-30px);
  transition: opacity 300ms ease, transform 300ms ease;
}
```

Страницы должны быть позиционированы абсолютно, чтобы не занимать место при одновременном отображении:

```css
.page-enter,
.page-exit {
  position: absolute;
  width: 100%;
}
```

## Использование nodeRef

В современных версиях react-transition-group рекомендуется передавать `nodeRef` — ссылку на DOM-элемент. Это позволяет избежать использования `findDOMNode` (который помечен как устаревший):

```tsx
import React, { useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';

function SafeExample() {
  const [show, setShow] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <button onClick={() => setShow(!show)}>Переключить</button>

      <CSSTransition
        in={show}
        timeout={300}
        classNames="fade"
        nodeRef={nodeRef}
        unmountOnExit
      >
        <div ref={nodeRef} className="box">
          Контент с nodeRef
        </div>
      </CSSTransition>
    </>
  );
}
```

Когда `nodeRef` передан, коллбэки `onEnter`, `onEntering` и т.д. больше не получают DOM-узел первым аргументом — используйте `nodeRef.current` напрямую.

## Типичные проблемы и решения

### Анимация не запускается

Проверьте:

1. **Совпадают ли `timeout` и `transition-duration` в CSS?** Если `timeout={300}`, в CSS должно быть `transition: ... 300ms`.

2. **Есть ли `enter`/`exit` классы в CSS?** Без них у браузера нет начальной точки для перехода.

3. **Не применяется ли `display: none` к элементу?** CSSTransition не работает, когда элемент скрыт через `display: none`. Используйте `unmountOnExit` или управляйте видимостью через opacity/visibility.

### Элемент мигает или "прыгает"

Убедитесь, что начальный класс (`fade-enter`) применяется мгновенно, до того как браузер успеет перерендерить. React-transition-group добавляет enter-класс, затем в следующем фрейме добавляет enter-active. Если у вас есть side-effects между этими моментами — анимация может не работать.

Используйте `appear` вместо `in={true}` при первом рендере, если нужна начальная анимация.

### Анимация при удалении из списка не работает

В TransitionGroup убедитесь, что:

1. У каждого элемента есть уникальный стабильный `key`
2. CSSTransition обёртывает каждый элемент списка напрямую (не через промежуточный компонент без передачи пропов)
3. Вы не мутируете массив напрямую, а создаёте новый

### Несколько анимаций одновременно конфликтуют

Если у вас есть несколько независимых переходов с одинаковыми classNames — используйте разные префиксы для каждого или CSS Modules.

## Производительность

CSSTransition использует CSS transitions — это самый производительный способ анимации в браузере. Анимации `transform` и `opacity` выполняются на GPU и не вызывают reflow.

Несколько советов:

```css
/* Хорошо — только GPU-свойства */
.fade-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease, transform 300ms ease;
}

/* Плохо — вызывает reflow */
.fade-enter-active {
  height: auto;
  margin-top: 0;
  transition: height 300ms ease, margin 300ms ease;
}
```

Для анимации высоты (аккордеон) используйте `max-height` вместо `height`, или управляйте высотой через коллбэки `onEnter`/`onEntering`.

Добавьте `will-change` только если действительно нужно и только на время анимации:

```css
.fade-enter-active,
.fade-exit-active {
  will-change: opacity, transform;
}
```

## Итоговый пример: уведомления

Объединим всё изученное в практичном компоненте уведомлений:

```tsx
import React, { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import styles from './Notifications.module.css';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: Notification['type']) => {
    const id = Date.now();
    setNotifications(prev => [
      ...prev,
      { id, message: `${type}: сообщение ${id}`, type }
    ]);

    // Автоудаление через 3 секунды
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const remove = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div>
      <div className={styles.buttons}>
        <button onClick={() => addNotification('success')}>Success</button>
        <button onClick={() => addNotification('error')}>Error</button>
        <button onClick={() => addNotification('info')}>Info</button>
      </div>

      <div className={styles.container}>
        <TransitionGroup>
          {notifications.map(notification => (
            <CSSTransition
              key={notification.id}
              timeout={350}
              classNames={{
                enter: styles.enter,
                enterActive: styles.enterActive,
                exit: styles.exit,
                exitActive: styles.exitActive,
              }}
            >
              <div
                className={`${styles.notification} ${styles[notification.type]}`}
                onClick={() => remove(notification.id)}
              >
                {notification.message}
              </div>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
    </div>
  );
}
```

```css
/* Notifications.module.css */
.container {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification {
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  min-width: 250px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.success { background: #d4edda; color: #155724; }
.error   { background: #f8d7da; color: #721c24; }
.info    { background: #d1ecf1; color: #0c5460; }

.enter {
  opacity: 0;
  transform: translateX(100%);
}

.enterActive {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 350ms ease, transform 350ms ease;
}

.exit {
  opacity: 1;
  transform: translateX(0);
}

.exitActive {
  opacity: 0;
  transform: translateX(100%);
  transition: opacity 350ms ease, transform 350ms ease;
}
```

## Заключение

CSSTransition из react-transition-group — это надёжный инструмент для добавления анимаций в React-приложения. Он намеренно прост: управляет состояниями перехода и добавляет CSS-классы, оставляя визуальную часть на ваше усмотрение.

Ключевые выводы:

- **CSSTransition** анимирует одиночный элемент через CSS-классы и проп `in`
- **TransitionGroup** управляет анимацией динамических списков
- **SwitchTransition** организует переход между двумя состояниями (one-at-a-time)
- Используйте `nodeRef` для корректной работы без `findDOMNode`
- Анимируйте только `transform` и `opacity` для максимальной производительности
- CSS Modules решают проблему конфликтов имён классов

Если ваши анимации в основном про плавное появление, исчезновение и переходы между состояниями — react-transition-group даёт всё необходимое без излишних абстракций.
