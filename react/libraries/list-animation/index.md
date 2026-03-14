---
metaTitle: "Анимация списков в React — TransitionGroup из react-transition-group"
metaDescription: "Полное руководство по анимации списков в React с помощью компонента TransitionGroup из библиотеки react-transition-group. Примеры добавления и удаления элементов с плавной анимацией, настройка CSS переходов и лучшие практики."
author: Олег Марков
title: Анимация списков в React
preview: В этой статье мы разберём, как анимировать добавление и удаление элементов списка в React с помощью компонента TransitionGroup из библиотеки react-transition-group. Рассмотрим установку, базовое использование, CSS-стили для переходов, важность prop key и практические примеры с лучшими практиками.
---

## Введение

Анимация списков — одна из самых распространённых задач в современных веб-приложениях. Когда пользователь добавляет новый элемент в список задач, удаляет сообщение из ленты или фильтрует карточки товаров, резкое появление и исчезновение элементов выглядит грубо и непрофессионально. Плавные переходы делают интерфейс живым, интуитивно понятным и приятным в использовании.

В React анимация списков сложнее, чем анимация одиночных элементов. Проблема в том, что React управляет DOM декларативно: когда элемент удаляется из состояния, он мгновенно исчезает из DOM — у анимации исчезновения просто нет времени сыграть. Чтобы решить эту проблему, нужен инструмент, который удерживает элемент в DOM достаточно долго, пока анимация не завершится.

Именно для этого создан компонент **TransitionGroup** из библиотеки **react-transition-group**. Он отслеживает, какие дочерние элементы добавились или удалились, и управляет их жизненным циклом так, чтобы у вас было время анимировать оба события — и появление, и исчезновение.

### Зачем нужна анимация списков

Анимированные списки решают сразу несколько UX-задач:

- **Ориентация пользователя.** Когда элемент плавно появляется или уходит, пользователь точно понимает, что произошло и с каким конкретным элементом. Без анимации список «перескакивает», и человек может потерять контекст.
- **Обратная связь.** Анимация подтверждает действие: нажал «Удалить» — элемент плавно ушёл. Это снижает тревогу («А удалилось ли?»).
- **Привлечение внимания.** Новый элемент, который появляется с анимацией, сразу заметен — пользователь видит изменение, даже если список длинный.
- **Ощущение качества.** Приложения с продуманными анимациями воспринимаются как более надёжные и профессиональные.

### react-transition-group и TransitionGroup

Библиотека **react-transition-group** — официально поддерживаемый инструмент экосистемы React для управления переходами. Она существует с 2015 года и прошла несколько итераций рефакторинга. Сегодня это стабильная, минималистичная библиотека, которая не навязывает конкретных анимаций, а лишь управляет состояниями перехода.

В библиотеке есть несколько компонентов:

- **Transition** — базовый компонент, отслеживает состояния `entering`, `entered`, `exiting`, `exited`
- **CSSTransition** — расширяет Transition, добавляя CSS-классы в нужный момент
- **SwitchTransition** — анимирует смену одного компонента на другой
- **TransitionGroup** — управляет списком переходов, отслеживает добавление и удаление дочерних элементов

Для анимации списков нас интересует именно **TransitionGroup** в связке с **CSSTransition**.

## Установка

Устанавливайте react-transition-group через npm или yarn:

```bash
npm install react-transition-group
```

Или с yarn:

```bash
yarn add react-transition-group
```

Начиная с версии 4.x типы TypeScript встроены в пакет, отдельно устанавливать `@types/react-transition-group` не нужно. Пакет лёгкий — около 7 КБ в минифицированном виде, без дополнительных зависимостей.

Проверьте установку, посмотрев версию в `package.json`:

```json
{
  "dependencies": {
    "react-transition-group": "^4.4.5"
  }
}
```

## Компонент TransitionGroup

**TransitionGroup** — это компонент-обёртка, который управляет набором переходов для изменяющегося списка элементов. Его главная задача: отслеживать, какие дочерние элементы появились или исчезли, и давать каждому из них возможность отыграть анимацию входа и выхода.

Когда дочерний элемент добавляется в TransitionGroup, он автоматически получает `in={true}` — начинается анимация появления. Когда элемент удаляется из списка, TransitionGroup не убирает его из DOM сразу, а сначала передаёт ему `in={false}`, дожидается окончания анимации выхода и только потом удаляет узел из DOM.

### Ключевые особенности TransitionGroup

- Работает с любыми дочерними компонентами Transition (чаще всего — CSSTransition)
- Автоматически управляет `in` prop для дочерних элементов
- Требует уникального `key` для каждого дочернего элемента
- Поддерживает кастомизацию через prop `component` (по умолчанию рендерит `<div>`)
- Позволяет отключить начальную анимацию через prop `appear`

### Базовая структура

```jsx
import { TransitionGroup, CSSTransition } from 'react-transition-group';

function AnimatedList({ items }) {
  return (
    <TransitionGroup component="ul">
      {items.map((item) => (
        <CSSTransition
          key={item.id}
          timeout={300}
          classNames="fade"
        >
          <li>{item.text}</li>
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
}
```

Здесь `TransitionGroup` рендерится как `<ul>`, а каждый элемент списка обёрнут в `CSSTransition`. Когда элемент добавляется или удаляется из массива `items`, TransitionGroup автоматически запускает соответствующую анимацию.

## Базовое использование с CSSTransition

CSSTransition добавляет CSS-классы в нужные моменты жизненного цикла перехода. Для каждой фазы создаются пары классов:

| Фаза | Классы при `in={true}` | Классы при `in={false}` |
|------|------------------------|-------------------------|
| Начало | `{name}-enter` | `{name}-exit` |
| Активная | `{name}-enter-active` | `{name}-exit-active` |
| Завершение | `{name}-enter-done` | `{name}-exit-done` |

Параметр `classNames` задаёт префикс `{name}`. Параметр `timeout` определяет, сколько миллисекунд длится переход — это должно совпадать с длительностью CSS-анимации.

### Пример: простой список с анимацией fade

Давайте создадим полноценный пример — список задач, в котором элементы появляются и исчезают плавно.

**Компонент:**

```jsx
import React, { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './TodoList.css';

let nextId = 1;

function TodoList() {
  const [items, setItems] = useState([
    { id: nextId++, text: 'Изучить TransitionGroup' },
    { id: nextId++, text: 'Написать анимированный список' },
  ]);
  const [inputValue, setInputValue] = useState('');

  const addItem = () => {
    if (!inputValue.trim()) return;
    setItems([...items, { id: nextId++, text: inputValue }]);
    setInputValue('');
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="todo-container">
      <div className="todo-input">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Добавить задачу..."
        />
        <button onClick={addItem}>Добавить</button>
      </div>

      <TransitionGroup component="ul" className="todo-list">
        {items.map((item) => (
          <CSSTransition
            key={item.id}
            timeout={300}
            classNames="todo-item"
          >
            <li className="todo-item">
              <span>{item.text}</span>
              <button onClick={() => removeItem(item.id)}>✕</button>
            </li>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
}

export default TodoList;
```

**CSS-стили (`TodoList.css`):**

```css
/* Начальное состояние при появлении */
.todo-item-enter {
  opacity: 0;
  transform: translateX(-20px);
}

/* Активная фаза появления */
.todo-item-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 300ms ease, transform 300ms ease;
}

/* Начало анимации исчезновения */
.todo-item-exit {
  opacity: 1;
  transform: translateX(0);
}

/* Активная фаза исчезновения */
.todo-item-exit-active {
  opacity: 0;
  transform: translateX(20px);
  transition: opacity 300ms ease, transform 300ms ease;
}
```

Обратите внимание: мы задаём `transition` именно в `*-active` классах, а не в базовых. Это гарантирует, что браузер успевает применить начальное состояние перед стартом перехода.

## Анимация добавления элементов

Когда элемент добавляется в список, TransitionGroup передаёт ему `in={true}`. CSSTransition сначала добавляет класс `classNames-enter`, затем в следующем тике — `classNames-enter-active`. Это создаёт CSS-переход от начального к конечному состоянию.

### Пример с появлением сверху

```jsx
import React, { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './NotificationList.css';

function NotificationList() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div>
      <button onClick={() => addNotification('success', 'Операция выполнена!')}>
        Успех
      </button>
      <button onClick={() => addNotification('error', 'Что-то пошло не так')}>
        Ошибка
      </button>

      <TransitionGroup className="notification-list">
        {notifications.map((notification) => (
          <CSSTransition
            key={notification.id}
            timeout={400}
            classNames="notification"
          >
            <div
              className={`notification notification--${notification.type}`}
              onClick={() => removeNotification(notification.id)}
            >
              {notification.message}
            </div>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
}
```

```css
/* Уведомления появляются сверху */
.notification-enter {
  opacity: 0;
  transform: translateY(-100%);
  max-height: 0;
}

.notification-enter-active {
  opacity: 1;
  transform: translateY(0);
  max-height: 100px;
  transition: all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.notification-enter-done {
  opacity: 1;
  transform: translateY(0);
}
```

### Управление высотой при добавлении

Важный момент: при добавлении элемент не только становится видимым, но и «раздвигает» соседние элементы. Если вы хотите анимировать это раздвигание плавно, можно использовать `max-height`:

```css
.item-enter {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.item-enter-active {
  opacity: 1;
  max-height: 200px; /* достаточно большое значение */
  transition: opacity 300ms ease, max-height 300ms ease;
}
```

Это простой трюк — анимировать `max-height` от 0 до некоторого максимума. Он работает хорошо, когда высота элементов примерно известна.

## Анимация удаления элементов

Удаление — самая интересная часть. Без TransitionGroup React сразу убирает элемент из DOM, и анимация не успевает сыграть. TransitionGroup решает это: когда элемент исчезает из `key`-списка дочерних элементов, компонент удерживает его в DOM, добавляет классы `*-exit` и `*-exit-active`, ждёт `timeout` миллисекунд и только потом убирает узел.

### Пример с анимацией удаления

```jsx
import React, { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './CardList.css';

const initialCards = [
  { id: 1, title: 'Карточка первая', color: '#ff6b6b' },
  { id: 2, title: 'Карточка вторая', color: '#4ecdc4' },
  { id: 3, title: 'Карточка третья', color: '#45b7d1' },
  { id: 4, title: 'Карточка четвёртая', color: '#96ceb4' },
];

function CardList() {
  const [cards, setCards] = useState(initialCards);

  const removeCard = (id) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  };

  const resetCards = () => {
    setCards(initialCards);
  };

  return (
    <div>
      <button onClick={resetCards}>Сбросить</button>
      <TransitionGroup className="card-list">
        {cards.map((card) => (
          <CSSTransition
            key={card.id}
            timeout={500}
            classNames="card"
          >
            <div
              className="card"
              style={{ backgroundColor: card.color }}
            >
              <h3>{card.title}</h3>
              <button onClick={() => removeCard(card.id)}>
                Удалить
              </button>
            </div>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
}
```

```css
.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.card {
  padding: 20px;
  border-radius: 8px;
  color: white;
  width: 200px;
}

/* Удаление: схлопывание с исчезновением */
.card-exit {
  opacity: 1;
  transform: scale(1);
  max-height: 200px;
}

.card-exit-active {
  opacity: 0;
  transform: scale(0.8);
  max-height: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
  transition:
    opacity 500ms ease,
    transform 500ms ease,
    max-height 500ms ease,
    padding 500ms ease,
    margin 500ms ease;
}
```

Здесь мы анимируем не только прозрачность, но и масштаб и высоту, чтобы остальные карточки плавно «сдвигались» на место удалённой.

## CSS-стили для переходов

Правильное написание CSS — ключ к плавным анимациям. Разберём несколько важных деталей.

### Timing function

Выбор функции плавности существенно влияет на ощущение анимации:

```css
/* Линейная — механическая, подходит редко */
transition: opacity 300ms linear;

/* ease — стандартная, мягко разгоняется и тормозит */
transition: opacity 300ms ease;

/* ease-out — быстрый старт, плавное завершение. Хороша для появления */
transition: opacity 300ms ease-out;

/* ease-in — медленный старт, быстрое завершение. Хороша для исчезновения */
transition: opacity 300ms ease-in;

/* cubic-bezier — полный контроль */
transition: opacity 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

Профессиональный совет: используйте `ease-out` для входа (элемент появляется быстро и плавно останавливается) и `ease-in` для выхода (элемент медленно начинает уходить и ускоряется к концу).

```css
/* Появление */
.item-enter-active {
  transition: all 300ms ease-out;
}

/* Исчезновение */
.item-exit-active {
  transition: all 300ms ease-in;
}
```

### Использование CSS-переменных

Если у вас много анимированных компонентов, удобно вынести длительность в переменную:

```css
:root {
  --transition-duration: 300ms;
  --transition-easing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.item-enter-active,
.item-exit-active {
  transition: all var(--transition-duration) var(--transition-easing);
}
```

### Согласование timeout и CSS

Критически важно, чтобы значение `timeout` в CSSTransition совпадало с длительностью CSS-перехода. Если они расходятся, элемент либо исчезнет из DOM раньше, чем анимация завершится, либо останется в DOM дольше нужного.

```jsx
// timeout должен совпадать с CSS transition-duration
<CSSTransition timeout={300} classNames="item">
  ...
</CSSTransition>
```

```css
.item-enter-active,
.item-exit-active {
  transition: all 300ms ease; /* то же самое значение */
}
```

Если у вас разные длительности для появления и исчезновения, передавайте объект:

```jsx
<CSSTransition
  timeout={{ enter: 300, exit: 500 }}
  classNames="item"
>
  ...
</CSSTransition>
```

```css
.item-enter-active {
  transition: all 300ms ease-out;
}

.item-exit-active {
  transition: all 500ms ease-in;
}
```

## Важность prop key

`key` — это фундаментальный механизм, на котором строится работа TransitionGroup. React использует `key` для идентификации элементов при рендеринге. TransitionGroup использует его для отслеживания того, какие элементы появились, а какие исчезли.

### Правила использования key

**Всегда используйте стабильный уникальный идентификатор**, а не индекс массива:

```jsx
// ❌ Плохо — индекс массива как key
{items.map((item, index) => (
  <CSSTransition key={index} timeout={300} classNames="item">
    <li>{item.text}</li>
  </CSSTransition>
))}

// ✅ Хорошо — уникальный id элемента
{items.map((item) => (
  <CSSTransition key={item.id} timeout={300} classNames="item">
    <li>{item.text}</li>
  </CSSTransition>
))}
```

Почему индекс — плохой выбор? Если вы удалите элемент из середины списка, индексы сдвинутся. React подумает, что изменились элементы с этими индексами, а не что один элемент был удалён. Анимации будут работать неправильно.

### Что происходит без уникального key

Предположим, у вас список `[A, B, C]` с ключами `[0, 1, 2]`. Вы удаляете элемент B. Список становится `[A, C]` с ключами `[0, 1]`. React видит, что элемент с ключом `1` изменился (с B на C), а элемент с ключом `2` исчез. В результате анимация удаления сыграет для последнего элемента C, хотя удалили B — это визуально неправильно.

С уникальными id: список `[A(id:1), B(id:2), C(id:3)]`. Удаляем B(id:2). React видит, что элемент с ключом `2` исчез — анимация применяется именно к B. Всё работает корректно.

### Генерация уникальных id

Для простых случаев можно использовать счётчик:

```jsx
let counter = 0;
const createItem = (text) => ({ id: ++counter, text });
```

Для продакшена лучше использовать `crypto.randomUUID()` или библиотеку `uuid`:

```jsx
import { v4 as uuidv4 } from 'uuid';
const createItem = (text) => ({ id: uuidv4(), text });
```

## Prop component

По умолчанию TransitionGroup рендерит `<div>`. Вы можете изменить это через prop `component`:

```jsx
// Рендерится как <ul>
<TransitionGroup component="ul">
  ...
</TransitionGroup>

// Рендерится как <ol>
<TransitionGroup component="ol">
  ...
</TransitionGroup>

// Рендерится как React-компонент
<TransitionGroup component={MyCustomList}>
  ...
</TransitionGroup>
```

### Рендеринг без обёртки

Если TransitionGroup мешает вашей разметке, установите `component={null}`. В этом случае TransitionGroup не рендерит никакого DOM-элемента:

```jsx
<TransitionGroup component={null}>
  {items.map((item) => (
    <CSSTransition key={item.id} timeout={300} classNames="item">
      <div className="item">{item.text}</div>
    </CSSTransition>
  ))}
</TransitionGroup>
```

Это удобно, когда вы хотите управлять разметкой самостоятельно или когда TransitionGroup находится внутри flex или grid контейнера.

### Кастомный компонент как обёртка

Иногда удобно передать собственный компонент-обёртку:

```jsx
function AnimatedGrid({ children, ...props }) {
  return (
    <div className="grid" {...props}>
      {children}
    </div>
  );
}

function App() {
  return (
    <TransitionGroup component={AnimatedGrid}>
      {items.map((item) => (
        <CSSTransition key={item.id} timeout={300} classNames="card">
          <Card item={item} />
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
}
```

## Управление начальной анимацией

По умолчанию элементы, которые уже есть в списке при первом рендере, не анимируются — только последующие добавления. Это поведение управляется через prop `appear` на CSSTransition.

```jsx
// Без анимации при первом рендере (по умолчанию)
<CSSTransition timeout={300} classNames="item">
  <div>Элемент</div>
</CSSTransition>

// С анимацией при первом рендере
<CSSTransition timeout={300} classNames="item" appear>
  <div>Элемент</div>
</CSSTransition>
```

Если `appear={true}`, при первом рендере будут добавлены классы `item-appear` и `item-appear-active`:

```css
.item-appear {
  opacity: 0;
}

.item-appear-active {
  opacity: 1;
  transition: opacity 300ms ease;
}
```

Это позволяет создавать эффект «загрузки» — когда список появляется на странице с анимацией.

## Практические примеры

### Пример 1: Анимированный список покупок

```jsx
import React, { useState, useRef } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './ShoppingList.css';

function ShoppingList() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;

    setItems((prev) => [
      { id: Date.now(), text, checked: false },
      ...prev, // новые элементы появляются сверху
    ]);
    setInput('');
    inputRef.current?.focus();
  };

  const handleToggle = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleRemove = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearDone = () => {
    setItems((prev) => prev.filter((item) => !item.checked));
  };

  return (
    <div className="shopping-list">
      <h2>Список покупок</h2>

      <div className="shopping-list__input">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Что купить?"
        />
        <button onClick={handleAdd}>+</button>
      </div>

      <TransitionGroup component="ul" className="shopping-list__items">
        {items.map((item) => (
          <CSSTransition
            key={item.id}
            timeout={350}
            classNames="shopping-item"
          >
            <li className={`shopping-item ${item.checked ? 'shopping-item--done' : ''}`}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleToggle(item.id)}
              />
              <span>{item.text}</span>
              <button
                className="shopping-item__remove"
                onClick={() => handleRemove(item.id)}
              >
                ✕
              </button>
            </li>
          </CSSTransition>
        ))}
      </TransitionGroup>

      {items.some((item) => item.checked) && (
        <button className="shopping-list__clear" onClick={handleClearDone}>
          Удалить выполненные
        </button>
      )}
    </div>
  );
}
```

```css
/* Shopping list styles */
.shopping-list {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.shopping-list__items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.shopping-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #4ecdc4;
}

.shopping-item--done {
  opacity: 0.6;
  border-left-color: #ccc;
  text-decoration: line-through;
}

/* Анимация появления — сверху вниз */
.shopping-item-enter {
  opacity: 0;
  transform: translateY(-20px);
  max-height: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.shopping-item-enter-active {
  opacity: 1;
  transform: translateY(0);
  max-height: 80px;
  margin-bottom: 8px;
  padding-top: 12px;
  padding-bottom: 12px;
  transition: all 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Анимация удаления — вправо */
.shopping-item-exit {
  opacity: 1;
  transform: translateX(0);
  max-height: 80px;
  margin-bottom: 8px;
}

.shopping-item-exit-active {
  opacity: 0;
  transform: translateX(100px);
  max-height: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  transition: all 350ms cubic-bezier(0.55, 0, 1, 0.45);
}
```

### Пример 2: Фильтрация с анимацией

Интересный случай — когда вы фильтруете список. С TransitionGroup элементы, которые не прошли фильтр, будут анимированно исчезать:

```jsx
import React, { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const ALL_TAGS = ['React', 'TypeScript', 'CSS', 'Node.js', 'GraphQL', 'Docker'];

const articles = [
  { id: 1, title: 'React Hooks в деталях', tags: ['React', 'TypeScript'] },
  { id: 2, title: 'Анимации в CSS', tags: ['CSS'] },
  { id: 3, title: 'GraphQL с Node.js', tags: ['Node.js', 'GraphQL'] },
  { id: 4, title: 'TypeScript для React', tags: ['React', 'TypeScript'] },
  { id: 5, title: 'Docker для разработчиков', tags: ['Docker', 'Node.js'] },
  { id: 6, title: 'Tailwind CSS', tags: ['CSS', 'React'] },
];

function FilteredList() {
  const [activeTag, setActiveTag] = useState(null);

  const filtered = activeTag
    ? articles.filter((a) => a.tags.includes(activeTag))
    : articles;

  return (
    <div className="filtered-list">
      <div className="tags">
        <button
          className={!activeTag ? 'tag tag--active' : 'tag'}
          onClick={() => setActiveTag(null)}
        >
          Все
        </button>
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            className={activeTag === tag ? 'tag tag--active' : 'tag'}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <TransitionGroup className="articles">
        {filtered.map((article) => (
          <CSSTransition
            key={article.id}
            timeout={300}
            classNames="article"
          >
            <div className="article-card">
              <h3>{article.title}</h3>
              <div className="article-tags">
                {article.tags.map((tag) => (
                  <span key={tag} className="article-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
}
```

```css
.article-enter {
  opacity: 0;
  transform: scale(0.9);
}

.article-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: all 300ms ease-out;
}

.article-exit {
  opacity: 1;
  transform: scale(1);
}

.article-exit-active {
  opacity: 0;
  transform: scale(0.9);
  transition: all 300ms ease-in;
}
```

### Пример 3: Использование с TypeScript

```tsx
import React, { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

interface ListItem {
  id: number;
  text: string;
}

interface AnimatedListProps {
  initialItems?: ListItem[];
}

let idCounter = 0;

const AnimatedList: React.FC<AnimatedListProps> = ({ initialItems = [] }) => {
  const [items, setItems] = useState<ListItem[]>(initialItems);
  const [inputValue, setInputValue] = useState<string>('');

  const addItem = (): void => {
    if (!inputValue.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: ++idCounter, text: inputValue.trim() },
    ]);
    setInputValue('');
  };

  const removeItem = (id: number): void => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div>
      <input
        value={inputValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setInputValue(e.target.value)
        }
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') addItem();
        }}
      />
      <button onClick={addItem}>Добавить</button>

      <TransitionGroup component="ul">
        {items.map((item) => (
          <CSSTransition
            key={item.id}
            timeout={300}
            classNames="item"
          >
            <li>
              {item.text}
              <button onClick={() => removeItem(item.id)}>Удалить</button>
            </li>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
};

export default AnimatedList;
```

## Советы и лучшие практики

### 1. Согласовывайте timeout и CSS-длительность

Это самая частая ошибка. Всегда проверяйте, что `timeout` в CSSTransition равен `transition-duration` в CSS. Если они расходятся, анимации будут обрываться или элементы будут зависать в DOM.

### 2. Не используйте индексы массива как key

Как разобрано выше, это приводит к неправильным анимациям при удалении из середины списка. Всегда используйте стабильный уникальный идентификатор.

### 3. Помещайте transition на *-active, а не на базовый класс

```css
/* ❌ Неправильно — transition на базовом классе */
.item-enter {
  opacity: 0;
  transition: opacity 300ms ease; /* здесь не нужно */
}

.item-enter-active {
  opacity: 1;
}

/* ✅ Правильно — transition только на *-active */
.item-enter {
  opacity: 0;
}

.item-enter-active {
  opacity: 1;
  transition: opacity 300ms ease;
}
```

### 4. Анимируйте высоту через max-height осторожно

Анимация `height` через `max-height` работает, но имеет ограничение: фактическое время анимации зависит от соотношения реальной высоты к `max-height`. Если элемент 50px, а `max-height: 500px`, анимация пройдёт 90% пути мгновенно. Подбирайте `max-height` близко к реальной высоте элементов.

### 5. Используйте will-change для сложных анимаций

Для тяжёлых анимаций, которые тормозят, добавьте `will-change`:

```css
.item-enter,
.item-exit {
  will-change: opacity, transform;
}
```

Но не злоупотребляйте этим — `will-change` потребляет память GPU.

### 6. Тестируйте на медленных устройствах

Анимации, которые отлично выглядят на вашем ноутбуке, могут тормозить на смартфонах среднего класса. Проверяйте в Chrome DevTools с эмуляцией throttling CPU.

### 7. Учитывайте prefers-reduced-motion

Некоторые пользователи включают режим сниженной анимации по медицинским причинам (эпилепсия, вестибулярные нарушения). Уважайте эту настройку:

```css
@media (prefers-reduced-motion: reduce) {
  .item-enter-active,
  .item-exit-active {
    transition: opacity 100ms ease;
    transform: none !important;
  }
}
```

### 8. Рассмотрите Framer Motion для сложных сценариев

TransitionGroup отлично подходит для простых появлений и исчезновений. Но если вам нужны:
- Анимации перетаскивания (drag and drop)
- Сложные пружинные анимации
- Анимации с физикой
- Shared element transitions

Тогда стоит посмотреть на **Framer Motion** или **React Spring** — они предоставляют более богатый API ценой большего размера bundle.

## Решение типичных проблем

### Анимация не запускается

Убедитесь, что:
1. Каждый дочерний элемент TransitionGroup — это компонент Transition (CSSTransition)
2. У каждого CSSTransition есть уникальный `key`
3. CSS-классы именованы в соответствии с `classNames` prop (например, `classNames="item"` → `.item-enter`, `.item-enter-active`)

### Элементы дублируются на время анимации

Это нормальное поведение: при удалении TransitionGroup удерживает элемент в DOM до конца анимации. Убедитесь, что `timeout` не слишком большой.

### Анимация работает, но список «прыгает»

Часто это происходит, когда высота элементов не анимируется. Добавьте анимацию `max-height` и уберите `overflow: hidden` после завершения (используйте `*-enter-done` и `*-exit-done` классы).

### Начальные элементы анимируются при загрузке страницы

Если не хотите этого — убедитесь, что на CSSTransition нет prop `appear={true}`. По умолчанию начальные элементы не анимируются.

## Заключение

TransitionGroup из react-transition-group — это надёжный и хорошо проверенный инструмент для анимации списков в React. Его главная ценность в том, что он решает главную проблему анимации удаления: элементы не исчезают мгновенно, а остаются в DOM достаточно долго, чтобы анимация успела сыграть.

Библиотека намеренно минималистична — она управляет только жизненным циклом перехода, а визуальную часть вы описываете через обычный CSS. Это делает её предсказуемой и лёгкой в отладке.

Ключевые вещи, которые нужно помнить:

- **TransitionGroup** отслеживает добавление и удаление дочерних элементов
- **CSSTransition** внутри TransitionGroup добавляет классы для анимации
- **key** на CSSTransition должен быть уникальным и стабильным
- **timeout** должен совпадать с `transition-duration` в CSS
- **component** prop позволяет рендерить любой HTML-тег или компонент вместо `<div>`
- Для сложных анимаций рассматривайте Framer Motion или React Spring

Начните с простого fade-анимации и постепенно усложняйте по мере необходимости. Плавные анимации списков значительно улучшают UX и делают ваше приложение более живым и профессиональным.
