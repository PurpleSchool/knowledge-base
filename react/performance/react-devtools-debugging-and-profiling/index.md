---
metaTitle: "React DevTools: отладка и профилирование компонентов"
metaDescription: "Как использовать React DevTools для отладки, инспекции состояния и профилирования производительности React-приложений."
author: "Антон Ларичев"
title: "React DevTools: отладка и профилирование компонентов"
preview: "Полное руководство по React DevTools: инспекция дерева компонентов, отладка состояния и хуков, профилирование рендеров и поиск узких мест производительности."
---

## Что такое React DevTools

React DevTools — официальное расширение для браузера и отдельный пакет, которое позволяет инспектировать дерево компонентов React, просматривать и редактировать состояние и пропсы в реальном времени, а также профилировать производительность рендеров.

Расширение доступно для Chrome, Firefox и Edge. Установить его можно из магазина расширений вашего браузера, найдя «React Developer Tools».

После установки в DevTools браузера появятся две новые вкладки:
- **Components** — инспектор дерева компонентов
- **Profiler** — инструмент профилирования рендеров

## Вкладка Components

### Навигация по дереву компонентов

Вкладка Components отображает иерархию React-компонентов текущей страницы. Вы можете:

- Раскрывать и сворачивать узлы дерева
- Искать компоненты по имени через поисковую строку
- Кликать на компонент, чтобы увидеть его пропсы, состояние и контекст в правой панели

Пример простого приложения для демонстрации:

```tsx
import { useState } from 'react';

function Counter({ label }: { label: string }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <span>{label}: {count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}

export function App() {
  return (
    <div>
      <Counter label="Первый" />
      <Counter label="Второй" />
    </div>
  );
}
```

В дереве DevTools вы увидите `App`, внутри него два экземпляра `Counter`. При выборе любого из них правая панель покажет текущее значение `count` и проп `label`.

### Инспекция и редактирование состояния

Правая панель вкладки Components разделена на несколько секций:

**props** — пропсы, переданные компоненту. Значения можно редактировать прямо в DevTools (двойной клик на значении), что мгновенно обновит рендер.

**hooks** — список хуков компонента с их текущими значениями. Для `useState` отображается текущее состояние, для `useReducer` — состояние и диспетчер, для `useContext` — текущее значение контекста.

**rendered by** — цепочка компонентов, породивших данный компонент. Помогает понять, откуда пришёл компонент в глубоко вложенных деревьях.

### Поиск и фильтрация

В строке поиска можно вводить имя компонента или его часть. DevTools поддерживает поиск по регулярным выражениям — достаточно включить иконку `/.*$/`.

В настройках (иконка шестерёнки) можно скрыть хост-элементы (`<div>`, `<span>` и прочие DOM-узлы), чтобы видеть только React-компоненты, или отфильтровать компоненты по имени.

### Выбор элемента на странице

Иконка курсора в левом верхнем углу вкладки Components позволяет кликнуть на любой элемент страницы — DevTools автоматически выберет соответствующий React-компонент в дереве. Это удобно, когда нужно быстро найти компонент, не зная его имени.

### Консольный доступ к компоненту

Выбрав компонент во вкладке Components, можно перейти в консоль браузера и обратиться к нему через специальную переменную:

```javascript
// $r — ссылка на последний выбранный компонент в React DevTools
console.log($r);
// Для DOM-узлов — аналог $0 в Elements
```

Переменная `$r` аналогична `$0` на вкладке Elements — она всегда указывает на последний выбранный компонент.

## Отладка хуков

### useState и useReducer

DevTools отображает текущее значение состояния рядом с именем хука. Для `useState` это выглядит так:

```
hooks
  State: 0           ← текущее значение useState
```

Для `useReducer`:

```
hooks
  Reducer: { count: 0, status: 'idle' }   ← текущий объект состояния
```

Обоим можно редактировать значение прямо в DevTools — двойной клик открывает поле ввода.

### useContext

Контекст отображается в секции hooks как:

```
hooks
  Context: { theme: 'dark', lang: 'ru' }
```

Пример компонента с контекстом:

```tsx
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext<'light' | 'dark'>('light');

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Кнопка</button>;
}

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={theme}>
      <ThemedButton />
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Переключить тему
      </button>
    </ThemeContext.Provider>
  );
}
```

В DevTools для `ThemedButton` в секции hooks будет отображено текущее значение контекста и подсвечен Provider, откуда оно пришло.

### Пользовательские хуки

DevTools группирует хуки пользовательского хука под его именем:

```tsx
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}

function Layout() {
  const size = useWindowSize();
  return <div>{size.width}x{size.height}</div>;
}
```

В DevTools вы увидите:

```
hooks
  WindowSize
    State: { width: 1440, height: 900 }
    Effect
```

## Вкладка Profiler

### Как начать запись

Вкладка Profiler позволяет записывать сессию взаимодействия с приложением и анализировать, какие компоненты рендерились, сколько раз и как долго.

1. Откройте вкладку Profiler
2. Нажмите кнопку записи (круглая иконка)
3. Выполните действия в приложении, которые хотите проанализировать
4. Нажмите «Stop» для завершения записи

### Flamegraph — граф пламени

После записи отображается flamegraph — визуализация каждого коммита рендера. По горизонтали расположено время, по вертикали — глубина дерева компонентов.

Цвета блоков:
- **Серый** — компонент не рендерился в этом коммите
- **Голубой (холодный)** — компонент рендерился быстро
- **Жёлтый/оранжевый** — компонент рендерился дольше
- **Красный** — компонент рендерился медленнее всего

Клик на блок компонента показывает, почему он рендерился: изменились пропсы, состояние или хук.

### Ranked chart — ранжированный список

Вид «Ranked» показывает все компоненты текущего коммита, отсортированные по времени рендера от медленного к быстрому. Это удобно для быстрого поиска самых затратных компонентов.

### Анализ конкретного коммита

Каждое изменение состояния, вызвавшее ре-рендер, создаёт отдельный «коммит» на временной шкале. Навигационные стрелки позволяют переключаться между коммитами и видеть состояние дерева компонентов на каждом из них.

Пример ситуации, которую легко поймать через Profiler:

```tsx
import { useState } from 'react';

// Этот компонент будет ре-рендериться каждый раз при изменении count,
// даже если его пропсы не менялись
function ExpensiveChild({ name }: { name: string }) {
  // Имитация тяжёлых вычислений
  const result = Array.from({ length: 10000 }, (_, i) => i).reduce((a, b) => a + b, 0);
  return <div>{name}: {result}</div>;
}

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ExpensiveChild name="Дорогой компонент" />
    </div>
  );
}
```

В Profiler при каждом клике кнопки будет видно, что `ExpensiveChild` рендерится с пометкой «Props did not change» — это сигнал обернуть его в `React.memo`.

### Решение: React.memo

```tsx
import { useState, memo } from 'react';

const ExpensiveChild = memo(function ExpensiveChild({ name }: { name: string }) {
  const result = Array.from({ length: 10000 }, (_, i) => i).reduce((a, b) => a + b, 0);
  return <div>{name}: {result}</div>;
});

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ExpensiveChild name="Дорогой компонент" />
    </div>
  );
}
```

Теперь в Profiler `ExpensiveChild` будет серым (не рендерился) при изменении `count`.

## Настройки Profiler

### Запись причин рендера

В настройках DevTools (иконка шестерёнки на вкладке Profiler) включите опцию **«Record why each component rendered while profiling»**. После этого для каждого компонента в текущем коммите будет отображаться конкретная причина ре-рендера:

- `State changed` — изменилось состояние
- `Props changed` — изменились пропсы (с указанием, какие именно)
- `Hooks changed` — изменился результат хука
- `Context changed` — изменился контекст
- `The parent component rendered` — родитель перерендерился

### Timeline-профилирование (React 18+)

В React 18 и новее Profiler поддерживает временну́ю шкалу с разметкой задач планировщика (Scheduler). Это позволяет видеть, как React распределяет работу между фреймами анимации, и находить места, где долгий рендер блокирует основной поток.

## Практические сценарии отладки

### Поиск лишних ре-рендеров

Алгоритм:
1. Запустить запись в Profiler
2. Выполнить одно конкретное действие (например, нажать кнопку)
3. Остановить запись
4. Во вкладке Ranked найти компоненты, которые отрендерились, хотя не должны были
5. Проверить причину рендера — если «The parent component rendered» и пропсы не менялись, рассмотреть `React.memo`, `useMemo` или `useCallback`

### Отладка useCallback и useMemo

```tsx
import { useState, useCallback, memo } from 'react';

const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  console.log('Child rendered');
  return <button onClick={onClick}>Нажми</button>;
});

export function App() {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);

  // Без useCallback Child будет рендериться при каждом изменении other
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []); // пустой массив зависимостей — функция создаётся один раз

  return (
    <div>
      <Child onClick={handleClick} />
      <button onClick={() => setOther(o => o + 1)}>Other: {other}</button>
      <span>Count: {count}</span>
    </div>
  );
}
```

В Profiler при нажатии «Other» компонент `Child` должен оставаться серым — это подтверждает, что `useCallback` работает корректно.

### Поиск медленных вычислений

Если компонент регулярно попадает в красную зону Profiler, причиной может быть тяжёлое вычисление при рендере:

```tsx
import { useState, useMemo } from 'react';

function FibList({ n }: { n: number }) {
  // Без useMemo это вычисление будет выполняться при каждом ре-рендере
  const fibs = useMemo(() => {
    const result = [0, 1];
    for (let i = 2; i <= n; i++) {
      result.push(result[i - 1] + result[i - 2]);
    }
    return result;
  }, [n]); // пересчитывается только при изменении n

  return <ul>{fibs.map((f, i) => <li key={i}>{f}</li>)}</ul>;
}
```

После добавления `useMemo` в Profiler время рендера `FibList` резко сократится при рендерах, не связанных с изменением `n`.

## DevTools в production-сборке

По умолчанию React DevTools работают только с development-сборкой. В production-сборке многие функции недоступны — это сделано намеренно для защиты данных и производительности.

Если нужно профилировать production-сборку, используйте специальный profiling-билд:

```bash
npm install react-dom/profiling
```

Или настройте алиас в webpack/vite:

```javascript
// vite.config.ts
export default {
  resolve: {
    alias: {
      'react-dom': 'react-dom/profiling',
    },
  },
};
```

## Полезные клавиатурные сокращения

| Действие | Сочетание |
|---|---|
| Поиск компонента | `Ctrl/Cmd + F` на вкладке Components |
| Навигация по результатам поиска | `Enter` / `Shift + Enter` |
| Переход к DOM-узлу | Иконка `<>` в правой панели |
| Копировать значение пропа | Правый клик → Copy value |

## Итог

React DevTools — незаменимый инструмент в арсенале React-разработчика. Вкладка Components позволяет быстро инспектировать и модифицировать состояние без изменения кода, а вкладка Profiler даёт точные данные о том, какие компоненты замедляют приложение и почему. Регулярный анализ через Profiler в связке с `React.memo`, `useMemo` и `useCallback` — основа для построения производительных React-приложений.

Чтобы глубже освоить React и научиться строить быстрые приложения с нуля, приходите на курс [React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-devtools-debugging-and-profiling).