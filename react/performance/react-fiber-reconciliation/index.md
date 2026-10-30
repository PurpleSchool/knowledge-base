---
metaTitle: "React Fiber: алгоритм согласования и виртуальный DOM"
metaDescription: "Подробный разбор React Fiber: как работает виртуальный DOM, алгоритм reconciliation, фазы render и commit, приоритеты обновлений."
author: "Антон Ларичев"
title: "React Fiber — алгоритм согласования и виртуальный DOM"
preview: "Разбираем внутреннее устройство React: как Fiber-архитектура заменила стековый рекурсивный рендер и что это значит для производительности."
---

## Что такое React Fiber

Fiber — это полная переработка внутреннего движка React, представленная в версии 16. Главная цель — сделать рендеринг **прерываемым**: разбить большую работу по обновлению дерева компонентов на маленькие единицы и выполнять их с учётом приоритетов, не блокируя главный поток.

До Fiber React использовал рекурсивный обход дерева на основе стека вызовов. Такой подход нельзя прервать посередине: начав обход, движок доводил его до конца, даже если это занимало десятки миллисекунд и замораживало интерфейс.

## Виртуальный DOM и зачем он нужен

Виртуальный DOM — это легковесное JavaScript-представление реального дерева DOM. Вместо того чтобы при каждом изменении состояния напрямую манипулировать DOM (дорогая операция), React:

1. Строит новое виртуальное дерево.
2. Сравнивает его с предыдущим (reconciliation).
3. Вычисляет минимальный набор изменений.
4. Применяет только эти изменения к реальному DOM.

```jsx
// React превращает JSX в вызов React.createElement
const element = <h1 className="title">Hello</h1>;

// Что реально происходит под капотом:
const element = React.createElement(
  'h1',
  { className: 'title' },
  'Hello'
);
// Результат — простой объект:
// { type: 'h1', props: { className: 'title', children: 'Hello' } }
```

Однако виртуальный DOM сам по себе — лишь структура данных. Fiber — это алгоритм, который умеет с ней работать асинхронно.

## Fiber-узел: единица работы

Каждый компонент в дереве React соответствует **fiber-узлу** — JavaScript-объекту со множеством полей:

```javascript
// Упрощённая схема fiber-объекта
{
  // Идентификация
  type: 'div' | MyComponent | null,
  key: null | string,

  // Связи в дереве
  child: Fiber | null,      // первый дочерний узел
  sibling: Fiber | null,    // следующий сиблинг
  return: Fiber | null,     // родительский узел

  // Состояние
  pendingProps: object,
  memoizedProps: object,
  memoizedState: object,

  // Работа
  effectTag: number,        // тип изменения (UPDATE, PLACEMENT, DELETION)
  alternate: Fiber | null,  // ссылка на «зеркальный» узел (double buffering)

  // Приоритет
  lanes: Lanes,
}
```

Вместо стека вызовов Fiber строит **связный список**: обход дерева можно остановить в любой момент, сохранить ссылку на текущий узел и продолжить позже.

## Двойная буферизация (double buffering)

React поддерживает два дерева одновременно:

- **current** — дерево, отображённое в данный момент в DOM.
- **workInProgress** — дерево, которое строится в процессе текущего обновления.

Когда работа завершена, указатель `current` переключается на `workInProgress`. Старое дерево становится запасным буфером для следующего обновления. Это позволяет подготавливать новый экран, не трогая то, что видит пользователь.

```
current tree          workInProgress tree

 App (current) ←——→ App (alternate)
  └─ Header         └─ Header
  └─ Main           └─ Main
      └─ List           └─ List (обновляется)
```

## Фазы рендеринга

Работа Fiber делится на две строго разделённые фазы.

### Фаза render (reconciliation)

Asynchronous-фаза. React обходит дерево, вызывает функции компонентов, вычисляет различия — но **не изменяет DOM**. Работа выполняется кусочками и может прерываться браузером в пользу более срочных задач (ввод пользователя, анимации).

На этом этапе React:
- вызывает `render`-методы / функциональные компоненты;
- запускает хуки `useState`, `useReducer`, `useMemo`, `useCallback`;
- формирует список эффектов (список fiber-узлов с изменениями).

### Фаза commit

Synchronous-фаза. React применяет накопленные изменения к реальному DOM за один проход — прерваться уже нельзя. Здесь выполняются:
- мутации DOM (вставка, обновление, удаление узлов);
- запуск `useLayoutEffect`;
- после отрисовки браузером — запуск `useEffect`.

```
render phase (прерываемая)
─────────────────────────────
beginWork → completeWork → ...
           ↓
commit phase (синхронная)
─────────────────────────────
before mutation → mutation → layout → passive effects
```

## Алгоритм согласования (reconciliation)

Reconciliation — это процесс сравнения старого и нового деревьев fiber-узлов. React использует два эвристических правила, которые снижают сложность алгоритма с O(n³) до O(n).

### Правило 1: элементы разного типа — разные деревья

Если тип узла изменился (например, `<div>` стал `<section>`), React не пытается переиспользовать узел. Он уничтожает старое поддерево и строит новое с нуля.

```jsx
// До обновления
<div>
  <Counter />
</div>

// После — Counter будет размонтирован и смонтирован заново
<section>
  <Counter />
</section>
```

### Правило 2: ключи помогают переиспользовать узлы в списках

Без ключей React сравнивает элементы по позиции. Это приводит к ненужным пересозданиям при перестановке элементов.

```jsx
// Плохо: при вставке нового элемента в начало React обновит все элементы
<ul>
  {items.map(item => <li>{item.name}</li>)}
</ul>

// Хорошо: React точно знает, какой элемент переместился
<ul>
  {items.map(item => <li key={item.id}>{item.name}</li>)}
</ul>
```

### beginWork и completeWork

При обходе каждого fiber-узла React вызывает две функции:

```
beginWork(current, workInProgress, renderLanes)
  → обрабатывает входящие пропсы, запускает компонент,
    возвращает следующий дочерний узел для обхода

completeWork(current, workInProgress, renderLanes)
  → вызывается при выходе из узла (все дети обработаны),
    формирует список DOM-операций, прокидывает эффекты наверх
```

## Приоритеты и планировщик (Scheduler)

Fiber вводит понятие **lanes** (дорожек): числовое значение, кодирующее приоритет обновления. Разные события получают разные приоритеты:

```
SyncLane             — синхронные обновления (устаревшие API)
InputContinuousLane  — непрерывный ввод (drag, scroll)
DefaultLane          — обычные setState-обновления
TransitionLane       — медленные переходы (startTransition)
IdleLane             — фоновая работа
```

Пакет `scheduler` планирует выполнение единиц работы в `MessageChannel` (макротаск), позволяя браузеру обработать события между ними.

### startTransition

С помощью `startTransition` можно пометить обновление как некритичное — React сможет прервать его в пользу ввода пользователя:

```jsx
import { useState, useTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    // Критичное: обновить инпут немедленно
    setQuery(e.target.value);

    // Некритичное: обновление списка можно прервать
    startTransition(() => {
      setResults(performSearch(e.target.value));
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <ResultList items={results} />}
    </>
  );
}
```

## Как Fiber влияет на практику

### Concurrent Mode и useTransition

Conurrent-возможности React работают именно благодаря Fiber. `useTransition`, `useDeferredValue`, `<Suspense>` — все они опираются на прерываемость рендера.

```jsx
import { useDeferredValue, memo } from 'react';

// Список компонентов оборачиваем в memo, чтобы
// он не перерисовывался при каждом нажатии клавиши
const HeavyList = memo(function HeavyList({ query }) {
  // дорогая фильтрация
  const items = heavyFilter(query);
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
});

function App() {
  const [query, setQuery] = useState('');
  // deferred-значение обновится позже, не блокируя инпут
  const deferredQuery = useDeferredValue(query);

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <HeavyList query={deferredQuery} />
    </>
  );
}
```

### Почему порядок хуков нельзя менять

Состояние хуков хранится в виде **связного списка** на fiber-узле компонента. React при каждом рендере проходит по этому списку по порядку, сопоставляя вызовы `useState` / `useEffect` с сохранёнными значениями. Изменение порядка хуков ломает это сопоставление.

```jsx
// Ошибка: хук внутри условия
function BadComponent({ isLoggedIn }) {
  if (isLoggedIn) {
    const [name, setName] = useState(''); // порядок нарушается!
  }
  const [age, setAge] = useState(0);
}

// Правильно:
function GoodComponent({ isLoggedIn }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  // используем значения по условию, но хуки вызываем всегда
}
```

### Batching обновлений

Fiber накапливает несколько вызовов `setState` в одном событии и выполняет их как одно обновление. В React 18 автоматический batching распространился на промисы и setTimeout:

```jsx
// React 18: оба setState — одно обновление, один ре-рендер
async function handleClick() {
  await fetch('/api/data');
  setLoading(false); // не вызовет ре-рендер сразу
  setData(result);   // оба применятся вместе
}
```

## Жизненный цикл с точки зрения Fiber

```
Триггер обновления (setState, props, context)
          ↓
   Планировщик (Scheduler)
   определяет приоритет и время запуска
          ↓
   Render-фаза
   beginWork → reconcile children → completeWork
   (прерываемая, может выполняться в нескольких фреймах)
          ↓
   Commit-фаза
   before mutation → mutation (DOM) → layout
   (синхронная, завершается за один проход)
          ↓
   passive effects (useEffect)
   (асинхронно, после отрисовки браузером)
```

## Что это означает для оптимизации

Понимание Fiber помогает принимать правильные решения:

- **`memo` и `useMemo`** — предотвращают повторные вызовы `beginWork` для неизменившихся поддеревьев.
- **`key`** — даёт алгоритму reconciliation подсказку для переиспользования узлов.
- **`startTransition`** — понижает приоритет тяжёлых обновлений, освобождая поток для ввода.
- **`useLayoutEffect` vs `useEffect`** — первый выполняется синхронно в commit-фазе, второй — асинхронно после; используйте `useLayoutEffect` только тогда, когда нужно читать/писать DOM до отрисовки.
- **Разбиение компонентов** — мелкие компоненты позволяют React точнее определять, что нужно обновить, избегая лишней работы.

```jsx
// Плохо: весь список перерисовывается при изменении одного элемента
function TodoList({ todos, onToggle }) {
  return (
    <ul>
      {todos.map(todo => (
        <li
          key={todo.id}
          style={{ textDecoration: todo.done ? 'line-through' : 'none' }}
          onClick={() => onToggle(todo.id)}
        >
          {todo.text}
        </li>
      ))}
    </ul>
  );
}

// Лучше: каждый элемент — отдельный компонент с memo
const TodoItem = memo(function TodoItem({ todo, onToggle }) {
  return (
    <li
      style={{ textDecoration: todo.done ? 'line-through' : 'none' }}
      onClick={() => onToggle(todo.id)}
    >
      {todo.text}
    </li>
  );
});

function TodoList({ todos, onToggle }) {
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} />
      ))}
    </ul>
  );
}
```

## Итог

React Fiber — это не просто деталь реализации, а фундамент, на котором построены все современные возможности React:

- Прерываемый рендер через связный список fiber-узлов вместо стека вызовов.
- Двойная буферизация деревьев `current` / `workInProgress`.
- Разделение работы на render-фазу (прерываемую) и commit-фазу (синхронную).
- Система приоритетов lanes и планировщик Scheduler.
- Concurrent-возможности: `startTransition`, `useDeferredValue`, `Suspense`.

Знание этих механизмов позволяет не гадать, почему компонент перерисовывается, а точно понимать, что происходит внутри React, и писать производительный код осознанно.

Для глубокого погружения в React и его внутреннее устройство смотрите курс на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-fiber-reconciliation