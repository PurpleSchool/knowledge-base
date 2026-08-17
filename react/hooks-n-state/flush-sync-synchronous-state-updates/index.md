---
metaTitle: "flushSync в React — синхронные обновления состояния"
metaDescription: "Что такое flushSync в React, как и когда его использовать для синхронных обновлений DOM. Практические примеры с прокруткой, измерениями и интеграцией."
author: "Антон Ларичев"
title: "flushSync — синхронные обновления состояния в React"
preview: "Разбираем flushSync из react-dom: когда батчинг мешает и как принудительно синхронизировать обновления состояния с DOM."
---

## Что такое flushSync

`flushSync` — функция из пакета `react-dom`, которая заставляет React немедленно применить все обновления состояния внутри переданного колбэка и синхронно обновить DOM до возврата управления.

По умолчанию React откладывает и группирует (батчит) обновления состояния, чтобы минимизировать количество перерисовок. Это поведение называется автоматическим батчингом и существенно улучшает производительность. Но иногда вам нужно гарантировать, что после вызова `setState` DOM уже обновлён — прямо в той же функции, не дожидаясь следующего рендер-цикла. Именно здесь и нужен `flushSync`.

```typescript
import { flushSync } from 'react-dom';

flushSync(() => {
  setSomeState(newValue);
});
// После этой строки DOM уже обновлён
```

## Проблема: асинхронные обновления состояния

Начиная с React 18, все обновления состояния батчатся автоматически — даже те, что вызываются внутри обработчиков событий браузера, таймаутов и промисов. Это поведение почти всегда желательно, но создаёт трудности в специфических сценариях.

Рассмотрим типичный пример: вы хотите добавить элемент в список и сразу же прокрутить к нему.

```typescript
import { useState, useRef } from 'react';

function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  const addTodo = () => {
    setTodos(prev => [...prev, `Задача ${prev.length + 1}`]);

    // Проблема: DOM ещё не обновлён в этот момент!
    // lastChild указывает на старый последний элемент
    listRef.current?.lastElementChild?.scrollIntoView();
  };

  return (
    <>
      <button onClick={addTodo}>Добавить задачу</button>
      <ul ref={listRef}>
        {todos.map((todo, i) => (
          <li key={i}>{todo}</li>
        ))}
      </ul>
    </>
  );
}
```

Прокрутка происходит к старому последнему элементу, потому что React ещё не применил новое состояние к DOM. Вы получаете устаревший снимок DOM.

## Синтаксис flushSync

```typescript
import { flushSync } from 'react-dom';

flushSync(callback: () => void): void
```

Функция принимает один аргумент — колбэк, внутри которого вызываются обновления состояния. После выхода из `flushSync` React гарантирует, что DOM отражает новое состояние.

Важные характеристики:
- `flushSync` — синхронная функция, она блокирует выполнение до завершения рендеринга
- Все обновления внутри колбэка применяются немедленно
- Обновления состояния за пределами колбэка не затрагиваются
- Нельзя вызывать `flushSync` внутри другого `flushSync`

## Практические примеры

### Прокрутка к новому элементу

Исправим пример выше с помощью `flushSync`:

```typescript
import { useState, useRef } from 'react';
import { flushSync } from 'react-dom';

function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  const addTodo = () => {
    // flushSync гарантирует, что после этого блока DOM уже обновлён
    flushSync(() => {
      setTodos(prev => [...prev, `Задача ${prev.length + 1}`]);
    });

    // Теперь lastElementChild — это именно новый элемент
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <button onClick={addTodo}>Добавить задачу</button>
      <ul ref={listRef}>
        {todos.map((todo, i) => (
          <li key={i}>{todo}</li>
        ))}
      </ul>
    </>
  );
}
```

Теперь прокрутка всегда попадает на только что добавленный элемент.

### Синхронизация с DOM-измерениями

Другой распространённый сценарий — вам нужно обновить состояние, сразу измерить результирующий DOM-элемент и использовать полученные размеры для следующего обновления состояния:

```typescript
import { useState, useRef } from 'react';
import { flushSync } from 'react-dom';

interface TooltipState {
  text: string;
  position: { top: number; left: number };
}

function Tooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = (event: React.MouseEvent, text: string) => {
    const { clientX, clientY } = event;

    // Сначала рендерим тултип с предварительной позицией
    flushSync(() => {
      setTooltip({ text, position: { top: clientY, left: clientX } });
    });

    // Теперь тултип в DOM — можем измерить его реальный размер
    if (tooltipRef.current) {
      const { width, height } = tooltipRef.current.getBoundingClientRect();
      const adjustedLeft = clientX + width > window.innerWidth
        ? clientX - width
        : clientX;
      const adjustedTop = clientY + height > window.innerHeight
        ? clientY - height
        : clientY;

      // Корректируем позицию на основе реального размера
      setTooltip(prev => prev
        ? { ...prev, position: { top: adjustedTop, left: adjustedLeft } }
        : null
      );
    }
  };

  return (
    <div>
      <span onMouseEnter={e => showTooltip(e, 'Подсказка')}>
        Наведи на меня
      </span>
      {tooltip && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: tooltip.position.top,
            left: tooltip.position.left,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
```

### Интеграция с не-React кодом

`flushSync` особенно полезен при интеграции React-компонентов со сторонними библиотеками или нативным браузерным API, которые ожидают синхронных обновлений DOM:

```typescript
import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';

function VirtualizedList() {
  const [items, setItems] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    // Пример: обработчик клавиатуры вне React-дерева
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        // Стороннему коду нужен актуальный DOM сразу после обновления
        flushSync(() => {
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        });

        // Фокусируем нужный элемент синхронно
        const selected = document.querySelector('[data-selected="true"]');
        (selected as HTMLElement)?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  return (
    <ul>
      {items.map((item, i) => (
        <li
          key={i}
          data-selected={i === selectedIndex}
          tabIndex={i === selectedIndex ? 0 : -1}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
```

### Несколько обновлений состояния в одном flushSync

Все вызовы `setState` внутри одного `flushSync` батчатся вместе и применяются за один рендер:

```typescript
import { useState } from 'react';
import { flushSync } from 'react-dom';

function Counter() {
  const [count, setCount] = useState(0);
  const [label, setLabel] = useState('старт');

  const updateBoth = () => {
    flushSync(() => {
      // Оба обновления применяются за один рендер
      setCount(c => c + 1);
      setLabel('обновлено');
    });
    // Здесь DOM уже содержит и новый count, и новый label
    console.log(document.querySelector('#counter')?.textContent);
  };

  return (
    <div>
      <span id="counter">{label}: {count}</span>
      <button onClick={updateBoth}>Обновить</button>
    </div>
  );
}
```

## Когда использовать flushSync

`flushSync` нужен в узком наборе сценариев:

**Читаете DOM сразу после обновления состояния.** Если вам нужен актуальный DOM — размеры, позиции, наличие элемента — сразу после `setState` в той же функции.

**Прокручиваете к динамически добавленному элементу.** Классический кейс — чат, виртуализированный список, бесконечная лента.

**Интегрируетесь с не-React библиотеками.** Сторонний код, который ожидает синхронное обновление DOM после вашей операции.

**Управляете фокусом программно.** Когда вам нужно переместить фокус на элемент, который появляется в DOM только после обновления состояния.

## Когда НЕ использовать flushSync

Поскольку `flushSync` блокирует браузер до завершения рендеринга, его неправильное применение ухудшает производительность.

**Не используйте flushSync без явной необходимости.** Если вам не нужно читать DOM сразу после обновления — оставьте батчинг работать.

**Не оборачивайте каждый setState.** Это уничтожает оптимизацию React и делает интерфейс менее отзывчивым.

**Не вызывайте внутри рендер-функции.** `flushSync` вызывается в обработчиках событий и эффектах, но не во время рендеринга компонента.

```typescript
// Плохо: избыточное использование
function BadExample() {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Нет смысла: DOM читать не нужно
    flushSync(() => {
      setValue(e.target.value);
    });
  };

  return <input onChange={handleChange} value={value} />;
}

// Хорошо: только когда нужно читать DOM
function GoodExample() {
  const [items, setItems] = useState<string[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  const addAndScroll = () => {
    flushSync(() => {
      setItems(prev => [...prev, 'Новый элемент']);
    });
    listRef.current?.lastElementChild?.scrollIntoView();
  };

  return (
    <ul ref={listRef}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}
```

## flushSync и Suspense

При использовании `flushSync` с Suspense нужно учитывать особенность: если рендер внутри `flushSync` приостанавливается (throws Promise), React не обрабатывает это корректно и выбрасывает исключение. Не используйте `flushSync` с компонентами, которые могут приостанавливаться:

```typescript
// Опасно: DataComponent может приостановиться
flushSync(() => {
  setShowData(true); // рендерит <Suspense><DataComponent /></Suspense>
});

// Безопасно: обновляем только "стабильные" части дерева
flushSync(() => {
  setCount(c => c + 1); // не затрагивает Suspense-компоненты
});
```

## flushSync в тестах

В тестах `flushSync` часто используется, чтобы убедиться, что React применил все обновления перед проверкой DOM:

```typescript
import { render, screen } from '@testing-library/react';
import { flushSync } from 'react-dom';
import { act } from 'react';

test('элемент появляется после обновления состояния', () => {
  const { result } = renderHook(() => useMyHook());

  act(() => {
    flushSync(() => {
      result.current.triggerUpdate();
    });
  });

  expect(screen.getByText('Обновлено')).toBeInTheDocument();
});
```

Однако в большинстве тестов достаточно `act()` от Testing Library — она сама заботится о синхронизации обновлений.

## Альтернативы flushSync

Прежде чем тянуться за `flushSync`, проверьте, решает ли задачу более идиоматичный подход:

**`useLayoutEffect`** — выполняется синхронно после того, как React обновил DOM, но до отрисовки браузером. Подходит для DOM-измерений и манипуляций:

```typescript
function Component() {
  const [height, setHeight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // DOM уже обновлён, браузер ещё не отрисовал
    if (ref.current) {
      setHeight(ref.current.offsetHeight);
    }
  });

  return <div ref={ref}>...</div>;
}
```

**Ref-колбэки** — позволяют получить DOM-узел в момент его монтирования и сразу работать с ним:

```typescript
function Component() {
  const handleRef = (node: HTMLElement | null) => {
    if (node) {
      node.scrollIntoView();
    }
  };

  return <div ref={handleRef}>Новый элемент</div>;
}
```

**`startTransition`** — противоположность `flushSync`: помечает обновление как некритичное, давая React возможность прерывать рендеринг для более срочных обновлений.

## Совместимость и импорт

`flushSync` доступен в `react-dom` начиная с React 16. В React 18 его поведение стало более строгим в режиме разработки — при вложенных вызовах будет выброшено предупреждение:

```typescript
// Единственный корректный импорт
import { flushSync } from 'react-dom';

// В React Native используется react-dom/server — flushSync там недоступен
// Для React Native используйте InteractionManager или другие механизмы
```

Для TypeScript типы уже включены в `@types/react-dom` и не требуют отдельной установки.

## Итог

`flushSync` — точечный инструмент для случаев, когда батчинг мешает: вам нужно прочитать или взаимодействовать с DOM прямо после обновления состояния, не дожидаясь следующего цикла рендеринга. Используйте его осознанно — каждый вызов блокирует браузер и отменяет оптимизации React. В большинстве задач справятся `useLayoutEffect`, реф-колбэки или просто правильная структура компонента.

Основные сценарии применения: прокрутка к новому элементу, DOM-измерения до следующего рендера, программное управление фокусом и интеграция со сторонними библиотеками.

Чтобы глубже разобраться в управлении состоянием, жизненном цикле компонентов и хуках React, изучите курс на PurpleSchool:

[Курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=flush-sync-synchronous-state-updates)