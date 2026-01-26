---
metaTitle: TransitionGroup компонент в React
metaDescription: Подробное руководство по TransitionGroup компоненту в React - как анимировать списки элементов управлять монтированием и размонтированием и избегать типичных ошибок
author: Олег Марков
title: TransitionGroup компонент в React
preview: Разберитесь как использовать TransitionGroup компонент в React - чтобы анимировать появление и исчезновение элементов списков и сложных интерфейсов
---

## Введение

TransitionGroup — это компонент из библиотеки `react-transition-group`, который помогает анимировать появление и исчезновение **группы элементов**. Проще говоря, когда у вас не один компонент с анимацией, а список (карточки, элементы меню, уведомления, строки таблицы), именно TransitionGroup берёт на себя управление тем, **когда** каждый элемент должен монтироваться, размонтироваться и в каком порядке запускать анимации.

Смотрите, идея такая: сам по себе React очень быстро добавляет и удаляет элементы из DOM без промежуточных состояний. Если вы хотите, чтобы элемент не исчезал сразу, а плавно скрывался, или не просто появлялся, а “въезжал” с анимацией, вам нужна прослойка между изменением состояния и фактическим удалением из DOM. TransitionGroup как раз и есть такая прослойка для **коллекций** компонентов.

В этой статье вы увидите:

- Зачем нужен TransitionGroup и когда он действительно полезен.
- Как его правильно подключить и использовать.
- Как он работает вместе с CSSTransition и Transition.
- Какие есть нюансы с ключами, типами контейнеров и анимацией удаления.
- Типичные ошибки и как их избежать.

В конце я соберу несколько частых вопросов, которые обычно появляются у разработчиков, когда они начинают работать с TransitionGroup.

---

## Что такое TransitionGroup и как он работает концептуально

TransitionGroup можно рассматривать как “умную обёртку” вокруг набора анимируемых компонентов. Он сам **не анимирует** ничего, но:

- следит за тем, какие дочерние элементы появились и какие исчезли;
- **не удаляет** элемент из DOM сразу, когда тот исчез из списка, а даёт ему возможность “доанимироваться” с помощью встроенного в него Transition или CSSTransition;
- вызывает у дочерних компонентов правильные фазы: `enter`, `exit`, `appear`, чтобы вы могли повесить на эти этапы CSS‑классы или коллбеки.

Важно: TransitionGroup ожидает, что его **прямые дочерние элементы** будут специальными компонентами, которые умеют анимировать свой жизненный цикл:

- обычно это `CSSTransition`;
- иногда это `Transition` (когда нужна анимация, управляемая вручную, без CSS).

### Простая схема работы

Давайте разберёмся на концептуальной схеме:

1. Вы храните список элементов в состоянии (например, `items` в useState).
2. Этот список рендерится внутри `<TransitionGroup>`, каждый элемент оборачивается в `<CSSTransition>`.
3. Когда вы добавляете элемент в список:
   - React добавляет его в виртуальное дерево;
   - TransitionGroup замечает новый ребёнок;
   - CSSTransition запускает анимацию “входа” (`enter`).
4. Когда вы удаляете элемент из списка:
   - React больше не рендерит этот элемент;
   - TransitionGroup замечает, что этот ребёнок “ушёл”;
   - вместо немедленного удаления из DOM он оставляет его, пока CSSTransition проигрывает анимацию “выхода” (`exit`);
   - после окончания анимации элемент удаляется окончательно.

---

## Подключение и базовый пример использования TransitionGroup

### Установка библиотеки

TransitionGroup — не часть “ядра” React, это отдельная библиотека. Если вы ещё не подключали её, выполните:

```bash
npm install react-transition-group
# или
yarn add react-transition-group
```

### Импорт необходимых компонентов

Чаще всего вы будете использовать три компонента:

```jsx
// Импортируем необходимые компоненты из библиотеки
import { TransitionGroup, CSSTransition, Transition } from 'react-transition-group';
```

- TransitionGroup — управляет коллекцией;
- CSSTransition — отвечает за CSS-классы на этапах анимации;
- Transition — базовый компонент для более ручного управления.

### Базовый пример со списком и CSSTransition

Давайте посмотрим, как анимировать список задач, где элементы будут плавно появляться и исчезать.

```jsx
import React, { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const TodoList = () => {
  // Состояние со списком задач
  const [items, setItems] = useState([
    { id: 1, text: 'Купить молоко' },
    { id: 2, text: 'Написать статью' },
  ]);

  // Обработчик добавления задачи
  const addItem = () => {
    const newItem = {
      id: Date.now(), // Уникальный id для ключа
      text: `Новая задача ${items.length + 1}`,
    };
    setItems(prev => [...prev, newItem]);
  };

  // Обработчик удаления задачи по id
  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div>
      <button onClick={addItem}>
        Добавить задачу
      </button>

      {/* TransitionGroup управляет коллекцией анимируемых элементов */}
      <TransitionGroup component="ul">
        {items.map(item => (
          <CSSTransition
            key={item.id}           // Обязательно уникальный ключ
            timeout={300}           // Длительность анимации
            classNames="todo"       // Префикс для CSS-классов
          >
            {/* Элемент списка, который будет анимирован */}
            <li>
              {item.text}
              <button onClick={() => removeItem(item.id)}>
                Удалить
              </button>
            </li>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
};

export default TodoList;
```

Комментарии к этому примеру:

- TransitionGroup оборачивает **весь список** и следит за тем, какие CSSTransition появляются и исчезают.
- Каждый CSSTransition получает `key` (по `item.id`), чтобы TransitionGroup мог связать старые и новые элементы.
- Параметр `component="ul"` указывает, что TransitionGroup должен рендерить `<ul>` как корневой HTML-элемент.

Теперь нам нужны стили, чтобы анимация действительно работала.

```css
/* Базовый стиль элемента списка */
.todo-enter,
.todo-appear {
  /* Стартовое состояние при появлении */
  opacity: 0;
  transform: translateY(-10px);
}

.todo-enter-active,
.todo-appear-active {
  /* Состояние во время анимации появления */
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}

.todo-exit {
  /* Стартовое состояние при выходе */
  opacity: 1;
  transform: translateY(0);
}

.todo-exit-active {
  /* Состояние во время анимации выхода */
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 300ms ease-in, transform 300ms ease-in;
}
```

- Префикс `todo` соответствует пропу `classNames="todo"` в CSSTransition.
- TransitionGroup сам не добавляет классы, это делает CSSTransition при монтировании, появлении и исчезновении элемента.

---

## Основные props TransitionGroup и их поведение

TransitionGroup — довольно простой по набору пропсов компонент, но их понимание критично для корректной работы.

### prop `component`

По умолчанию TransitionGroup рендерит `<div>` вокруг всех детей. Вы можете поменять это, если вам нужен другой контейнер или вообще обойтись без него.

```jsx
<TransitionGroup component="ul">
  {/* ...элементы списка... */}
</TransitionGroup>
```

- Здесь TransitionGroup срендерит `<ul>` и вложит внутрь анимируемые элементы.
- Важно: именно **прямыми дочерними элементами** должны быть Transition / CSSTransition.

Если вы хотите, чтобы TransitionGroup **не добавлял лишний DOM-элемент**, используйте `component={null}`:

```jsx
<TransitionGroup component={null}>
  {/* В этом случае TransitionGroup не будет рендерить контейнер */}
  {items.map(item => (
    <CSSTransition key={item.id} timeout={300} classNames="fade">
      <div>{item.text}</div>
    </CSSTransition>
  ))}
</TransitionGroup>
```

Это удобно, когда структура DOM важна: например, вам нужно, чтобы потомки были непосредственными детьми другого контейнера без промежуточного div.

### prop `childFactory`

Этот prop нужен реже, но он важен в более продвинутых сценариях. Он позволяет **изменять детей**, которых создаёт TransitionGroup, прежде чем они будут отрисованы.

Обычно его используют для того, чтобы:

- пробросить дополнительные пропсы в каждый дочерний Transition / CSSTransition;
- динамически менять настройки анимации для всех детей (например, разные направления).

Пример с childFactory:

```jsx
<TransitionGroup
  component="div"
  // childFactory позволяет модифицировать дочерние элементы
  childFactory={child =>
    React.cloneElement(child, {
      // Добавляем общие пропсы анимации
      timeout: 500,
      classNames: 'fade',
    })
  }
>
  {items.map(item => (
    <CSSTransition key={item.id}>
      <div>{item.text}</div>
    </CSSTransition>
  ))}
</TransitionGroup>
```

Комментарий:

// childFactory принимает уже созданного ребёнка и возвращает его же,
// но с дополнительными или изменёнными пропсами

Без childFactory вам бы пришлось указывать `timeout` и `classNames` вручную для каждого CSSTransition.

---

## Взаимодействие TransitionGroup с CSSTransition

Чаще всего вы будете работать именно с парой TransitionGroup + CSSTransition. Давайте посмотрим на ключевые моменты этого взаимодействия.

### Обязательный ключ `key`

TransitionGroup сравнивает предыдущий и новый список детей по ключам. От корректности `key` зависит, поймёт ли он, что:

- элемент **добавился**;
- элемент **исчез**;
- элемент **поменял порядок**.

Поэтому:

- Никогда не используйте индекс массива в качетсве ключа, если элементы могут удаляться/добавляться не только в конец.
- Используйте стабильный уникальный идентификатор (id из базы, Date.now, uuid и т. д.).

```jsx
<TransitionGroup>
  {items.map(item => (
    <CSSTransition key={item.id} timeout={300} classNames="fade">
      <div>{item.text}</div>
    </CSSTransition>
  ))}
</TransitionGroup>
```

Если ключи будут нестабильны, TransitionGroup будет “думать”, что старый элемент исчез, а новый появился, и вы получите лишние анимации, мерцание и другие визуальные артефакты.

### Порядок элементов и анимации

TransitionGroup не меняет порядок детей сам по себе. Он просто следит за тем, какие ключи были и какие стали. Если вы меняете порядок массива `items`, изменения будут отражены в DOM, и TransitionGroup в этом процессе участвует только для монтирования/размонтирования.

При перестановке элементов:

- если вы меняете только порядок, но ключи остаются теми же, TransitionGroup не будет анимировать “исчезновение” и “появление” — элементы просто поменяются местами;
- если элементы сменили ключи (или вы неправильно задали ключи), TransitionGroup может воспринять это как удаление/добавление и запустить анимации.

---

## Использование TransitionGroup с Transition (без CSS-классов)

Иногда вам не нужны CSS-классы, а хочется управлять анимацией вручную через JS, например, с помощью `requestAnimationFrame` или сторонних библиотек (GSAP, anime.js и т. д.). Для этого можно использовать компонент Transition.

Смотрите, я покажу вам пример, где мы анимируем прозрачность с помощью JS:

```jsx
import React, { useRef } from 'react';
import { TransitionGroup, Transition } from 'react-transition-group';

const duration = 300;

// Функция, которая применяет стили при разных состояниях
const defaultStyle = {
  transition: `opacity ${duration}ms ease-in-out`,
  opacity: 0,
};

// Карта стилей по стадиям
const transitionStyles = {
  entering: { opacity: 1 }, // Когда элемент входит
  entered:  { opacity: 1 }, // Когда элемент уже вошёл
  exiting:  { opacity: 0 }, // Когда элемент выходит
  exited:   { opacity: 0 }, // Когда элемент уже вышел
};

const FadeList = ({ items }) => {
  return (
    <TransitionGroup>
      {items.map(item => (
        <Transition
          key={item.id}
          timeout={duration}
        >
          {state => (
            // Здесь мы используем функцию-ребёнка для получения состояния
            <div
              style={{
                ...defaultStyle,
                ...transitionStyles[state], // Применяем стиль по текущему состоянию
              }}
            >
              {item.text}
            </div>
          )}
        </Transition>
      ))}
    </TransitionGroup>
  );
};

export default FadeList;
```

Комментарии:

// Transition не добавляет CSS-классы, он просто управляет состоянием
// "entering", "entered", "exiting", "exited", которое мы используем в стиле

Такой подход удобен, если вы:

- хотите использовать анимацию, завязанную не только на CSS, но и на JS;
- планируете интеграцию с другими анимационными библиотеками;
- хотите более гибкий контроль, например, динамическую смену стилей в зависимости от данных.

---

## Появление элементов при первом рендере (appear)

Иногда нужно, чтобы элементы анимировались **не только** при добавлении в список, но и при первом рендере компонента. Для этого у CSSTransition есть проп `appear`.

```jsx
<TransitionGroup component="ul">
  {items.map(item => (
    <CSSTransition
      key={item.id}
      timeout={300}
      classNames="todo"
      appear={true}  // Включаем анимацию при первом появлении
    >
      <li>{item.text}</li>
    </CSSTransition>
  ))}
</TransitionGroup>
```

В этом случае при первой отрисовке будут использоваться классы:

- `.todo-appear`
- `.todo-appear-active`
- `.todo-appear-done` (если вы его используете)

По умолчанию `appear` выключен, чтобы не было лишних анимаций при initial render, особенно когда список большой.

---

## Особенности анимации удаления элементов

Ключевой момент, который иногда вызывает вопросы: как именно реализуется “отложенное” удаление элемента при выходе.

- Когда вы удаляете элемент из массива состояния, React больше его не рендерит.
- TransitionGroup понимает, что ребёнка с таким `key` больше нет в новом списке.
- Вместо немедленного удаления из DOM он:
  - оставляет старый экземпляр ребёнка;
  - говорит CSSTransition запустить `exit`-анимацию;
  - после истечения таймаута (или когда сработает `onExited`) удаляет элемент окончательно.

Если у вас анимация не проигрывается при удалении, проверьте:

1. Что у CSSTransition прописан `timeout` (или `timeout={{ enter: ..., exit: ... }}`).
2. Что у него есть соответствующие CSS-классы `*-exit` и `*-exit-active`.
3. Что элемент действительно удаляется из массива (а не просто скрывается через условный рендеринг без TransitionGroup).

Пример таймаута с разными значениями для входа и выхода:

```jsx
<CSSTransition
  key={item.id}
  timeout={{ enter: 300, exit: 500 }} // Разные длительности
  classNames="fade"
>
  <li>{item.text}</li>
</CSSTransition>
```

---

## Управление DOM-структурой: component={null} и кастомные контейнеры

Иногда вы хотите, чтобы TransitionGroup **не вмешивался** в разметку, особенно если:

- внутри уже есть ul, table, flex-контейнер или сложная сетка;
- лишний div может сломать стили или layout (например, `display: flex` ожидает определённую структуру).

Тогда вы можете:

### Использовать существующий контейнер как обёртку

```jsx
<ul>
  <TransitionGroup component={null}>
    {items.map(item => (
      <CSSTransition key={item.id} timeout={300} classNames="fade">
        <li>{item.text}</li>
      </CSSTransition>
    ))}
  </TransitionGroup>
</ul>
```

Комментарий:

// Здесь ul — это ваш контейнер, а TransitionGroup не добавляет свой DOM-узел

### Использовать кастомный React-компонент как контейнер

Если вам нужно более сложное поведение, вы можете передать в `component` свой React-компонент.

```jsx
const ListContainer = ({ children }) => {
  // Здесь можно добавить свои классы, стили, логику
  return (
    <ul className="custom-list">
      {children}
    </ul>
  );
};

<TransitionGroup component={ListContainer}>
  {items.map(item => (
    <CSSTransition key={item.id} timeout={300} classNames="fade">
      <li>{item.text}</li>
    </CSSTransition>
  ))}
</TransitionGroup>
```

Важный момент: ваш компонент, переданный в `component`, должен уметь принимать `children` и корректно их рендерить.

---

## Контроль над порядком анимаций и коллбэки жизненного цикла

CSSTransition и Transition предоставляют набор коллбэков жизненного цикла, которые часто используются вместе с TransitionGroup.

Основные коллбэки для CSSTransition:

- `onEnter(node, isAppearing)`
- `onEntering(node, isAppearing)`
- `onEntered(node, isAppearing)`
- `onExit(node)`
- `onExiting(node)`
- `onExited(node)`

Вы можете использовать их, чтобы:

- запускать сторонние анимации;
- логировать события;
- синхронизировать состояние с анимацией (например, блокировать кнопки на время анимации).

Пример:

```jsx
<CSSTransition
  key={item.id}
  timeout={300}
  classNames="fade"
  onEnter={(node) => {
    // Здесь можно подготовить DOM-узел перед анимацией входа
    node.style.backgroundColor = 'lightyellow';
  }}
  onEntered={(node) => {
    // Здесь можно сбросить временные стили после входа
    node.style.backgroundColor = '';
  }}
  onExit={(node) => {
    // Здесь можно что-то сделать при начале выхода
    console.log('Элемент начинает исчезать', node);
  }}
  onExited={(node) => {
    // Здесь можно выполнить очистку или отправить событие
    console.log('Элемент полностью удалён', node);
  }}
>
  <li>{item.text}</li>
</CSSTransition>
```

Комментарий:

// Коллбэки помогают вам "подхватывать" моменты,
// когда элемент входит или выходит, и вмешиваться при необходимости

TransitionGroup просто запускает эти коллбэки в нужное время, когда элементы появляются или исчезают из списка.

---

## Типичные ошибки и как их избежать

Давайте соберём несколько ошибок, с которыми разработчики часто сталкиваются, когда начинают использовать TransitionGroup.

### Ошибка 1 — отсутствие ключей или неправильные ключи

Симптомы:

- Анимация “скачет”;
- элементы анимируются, хотя их содержимое просто поменялось;
- при обновлении списка всё мигает.

Решение:

- Всегда задавайте **стабильные** уникальные ключи (id элементов, а не индекс массива).
- Следите, чтобы этот id не менялся при простом обновлении содержимого.

### Ошибка 2 — анимация не запускается при удалении

Симптомы:

- При добавлении элемента анимация есть, при удалении — нет;
- элемент исчезает мгновенно.

Проверьте:

1. Есть ли у CSSTransition `timeout` (или `exit` часть в объекте timeout).
2. Определены ли в CSS классы `*-exit` и `*-exit-active`.
3. Удаляется ли элемент из списка **через состояние** (setState), а не просто условием вроде `item.visible && <li>...`.

### Ошибка 3 — TransitionGroup рендерит лишний div и ломает разметку

Симптомы:

- Нарушается сетка;
- стили flex/grid перестают работать как ожидалось.

Решение:

- Используйте `component={null}`, если вам не нужен дополнительный контейнер.
- Либо передайте кастомный компонент или нужный HTML-тег через `component="ul"`, `component="tbody"` и т. д.

### Ошибка 4 — смешивание условного рендера и TransitionGroup без обёртки

Иногда делают так:

```jsx
{isVisible && (
  <TransitionGroup>
    {/* ... */}
  </TransitionGroup>
)}
```

Если вы включаете/выключаете сам TransitionGroup, помните, что:

- при отключении TransitionGroup всё содержимое исчезает сразу, а не через анимацию;
- чтобы анимация выхода отработала, лучше оставлять TransitionGroup в DOM, а управлять только списком детей.

---

## Практический пример — анимированный список уведомлений

Покажу вам более жизненный пример — стек уведомлений, которые появляются и исчезают через несколько секунд.

```jsx
import React, { useState, useEffect } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  // Функция для добавления уведомления
  const addNotification = (text) => {
    const id = Date.now();
    const newNotification = { id, text };

    setNotifications(prev => [...prev, newNotification]);

    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  useEffect(() => {
    // Для примера добавим первое уведомление при монтировании
    addNotification('Добро пожаловать в систему уведомлений');
  }, []);

  return (
    <div>
      <button onClick={() => addNotification('Новое уведомление')}>
        Показать уведомление
      </button>

      {/* Контейнер для уведомлений */}
      <div className="notifications-container">
        <TransitionGroup component={null}>
          {notifications.map(notification => (
            <CSSTransition
              key={notification.id}
              timeout={300}
              classNames="notification"
            >
              <div className="notification-item">
                {notification.text}
              </div>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
    </div>
  );
};

export default Notifications;
```

CSS:

```css
.notifications-container {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  background: #333;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
}

/* Появление уведомления */
.notification-enter {
  opacity: 0;
  transform: translateX(20px);
}

.notification-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}

/* Исчезновение уведомления */
.notification-exit {
  opacity: 1;
  transform: translateX(0);
}

.notification-exit-active {
  opacity: 0;
  transform: translateX(20px);
  transition: opacity 300ms ease-in, transform 300ms ease-in;
}
```

Обратите внимание, как этот фрагмент кода решает задачу:

- TransitionGroup управляет списком уведомлений;
- CSSTransition добавляет/удаляет CSS-классы при входе и выходе;
- setTimeout управляет временем жизни уведомления, но само удаление проходит через TransitionGroup, и мы получаем плавную анимацию.

---

## Заключение

TransitionGroup — это небольшой, но очень полезный компонент для анимации **динамических списков** в React. Он не делает анимацию сам по себе, а координирует появление и исчезновение детей, передавая управление CSSTransition или Transition.

Главные моменты, которые стоит запомнить:

- Всегда давайте детям уникальные и стабильные ключи.
- TransitionGroup лучше не скрывать условным рендерингом, управляйте именно списком детей.
- Используйте `component={null}` или нужный тег/компонент, чтобы не ломать структуру DOM.
- Подберите подходящий инструмент:
  - CSSTransition — если вам удобнее работать с CSS-классами;
  - Transition — если нужна кастомная JS-анимация.

Если вы понимаете, как TransitionGroup отслеживает изменения списка и как он синхронизируется с жизненным циклом дочерних компонентов, дальше остаётся только подбирать анимации под задачи вашего интерфейса.

---

## Частозадаваемые технические вопросы по теме статьи

### Как анимировать элементы таблицы (tr) с помощью TransitionGroup

Для таблиц важно не ломать структуру DOM. Оборачивать `tr` в div нельзя. Используйте `component="tbody"` у TransitionGroup и рендерьте `CSSTransition` так, чтобы внутри него был именно `tr`.

Пример:

```jsx
<table>
  <TransitionGroup component="tbody">
    {rows.map(row => (
      <CSSTransition key={row.id} timeout={300} classNames="fade">
        <tr>
          <td>{row.name}</td>
          <td>{row.value}</td>
        </tr>
      </CSSTransition>
    ))}
  </TransitionGroup>
</table>
```

Так структура `table > tbody > tr` остаётся валидной, а строки получают анимацию.

### Как сделать так чтобы анимация не накладывалась при быстрых добавлениях и удалениях

Используйте корректные `timeout` и убедитесь, что ваши CSS-переходы не длиннее указанного значения. Если анимации “накладываются”, можно:

- сократить продолжительность переходов;
- использовать флаг состояния “busy”, чтобы предотвращать добавление/удаление до завершения анимации (отслеживать через `onEntered` / `onExited`);
- при сложных кейсах — использовать Transition с кастомной логикой, где вы вручную управляете отменой или сменой анимаций.

### Можно ли запускать анимации с разной длительностью для разных элементов в одном TransitionGroup

Да, можно. У каждого CSSTransition свой `timeout`, и TransitionGroup это поддерживает. Просто передавайте нужное значение таймаута в зависимости от элемента:

```jsx
<TransitionGroup>
  {items.map(item => (
    <CSSTransition
      key={item.id}
      timeout={item.fast ? 200 : 600}
      classNames="fade"
    >
      <div>{item.text}</div>
    </CSSTransition>
  ))}
</TransitionGroup>
```

Важно синхронизировать CSS-анимацию с указанным таймаутом для каждого случая.

### Как корректно типизировать TransitionGroup и CSSTransition в TypeScript

Установите типы через `npm install --save-dev @types/react-transition-group`. Затем импортируйте компоненты как обычно. Для `TransitionGroup` и `CSSTransition` типы уже описаны, но если вы используете `childFactory`, типизируйте параметр как `ReactElement<any>` и возвращайте тот же тип через `React.cloneElement`. В функциях-детях Transition используйте тип `TransitionStatus` для state, импортируя его из библиотеки.

### Почему анимация не работает в SSR окружении Next.js или Gatsby

SSR сам по себе не мешает TransitionGroup, но:

- анимации завязаны на `window` и DOM, поэтому любые обращения к ним должны быть только на клиенте;
- оборачивайте компоненты с TransitionGroup в проверку `useEffect` или проверяйте `typeof window !== 'undefined'`, если используете сторонние анимационные библиотеки;
- при гидратации следите, чтобы серверный и клиентский рендер совпадали по структуре, иначе React может перерисовать узел, и первая анимация не сработает как ожидается.