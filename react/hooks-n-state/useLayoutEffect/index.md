---
metaTitle: useLayoutEffect в React — эффект до отрисовки
metaDescription: Полное руководство по useLayoutEffect в React: отличие от useEffect, синтаксис, когда применять, практические примеры с DOM-измерениями, анимациями и TypeScript
author: Олег Марков
title: useLayoutEffect в React — эффект до отрисовки
preview: Разберитесь, чем useLayoutEffect отличается от useEffect, когда нужно выполнять код синхронно до отрисовки браузером и как правильно применять этот хук для работы с DOM
---

## Введение

В React большинство задач с побочными эффектами решается с помощью `useEffect`. Но иногда вам нужно измерить DOM-элемент, обновить его позицию или изменить стили **до того, как браузер отрисует изменения на экране**. Если сделать это в `useEffect`, пользователь может заметить неприятное мигание — элемент появится на миг в «неправильном» состоянии, а потом скачком перейдёт в «правильное».

Именно для таких случаев существует `useLayoutEffect`. Он работает так же, как `useEffect`, но выполняется **синхронно** — после всех изменений DOM, но **до** того, как браузер успел что-либо отрисовать.

В этой статье вы узнаете, как работает `useLayoutEffect`, чем он отличается от `useEffect`, и в каких ситуациях его стоит использовать. Хотите глубже освоить React? Приходите на наш курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=use-layout-effect). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Как React рендерит компонент

Чтобы понять разницу между `useEffect` и `useLayoutEffect`, нужно понять порядок шагов рендеринга в React:

1. **React рендерит компонент** — вычисляет новый VDOM
2. **React обновляет реальный DOM** — применяет изменения
3. **`useLayoutEffect` выполняется** (синхронно, блокирует отрисовку)
4. **Браузер отрисовывает экран** — пользователь видит результат
5. **`useEffect` выполняется** (асинхронно, после отрисовки)

Это ключевое отличие: `useLayoutEffect` выполняется **между обновлением DOM и отрисовкой браузером**, а `useEffect` — **после отрисовки**.

## Синтаксис useLayoutEffect

Синтаксис полностью идентичен `useEffect`:

```tsx
import { useLayoutEffect } from 'react';

useLayoutEffect(() => {
  // Код выполняется синхронно после обновления DOM,
  // но до отрисовки браузером

  return () => {
    // Функция очистки (опционально)
  };
}, [dependencies]); // Массив зависимостей
```

**Параметры:**
- **Функция эффекта** — код, который нужно выполнить синхронно
- **Массив зависимостей** — значения, при изменении которых эффект перезапускается

**Варианты массива зависимостей:**
- `[]` — выполняется один раз после монтирования
- `[a, b]` — выполняется при изменении `a` или `b`
- Отсутствует — выполняется после каждого рендера

## Отличие от useEffect: наглядный пример

Рассмотрим компонент, который показывает тултип (подсказку) рядом с кнопкой:

```tsx
// ❌ С useEffect — мигание заметно
function TooltipWithFlicker({ text, anchor }: { text: string; anchor: DOMRect | null }) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!tooltipRef.current || !anchor) return;
    const tooltip = tooltipRef.current;
    const top = anchor.top - tooltip.offsetHeight - 8;
    const left = anchor.left + anchor.width / 2 - tooltip.offsetWidth / 2;
    setPosition({ top, left }); // Обновляется ПОСЛЕ отрисовки → мигание!
  }, [anchor]);

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        background: 'black',
        color: 'white',
        padding: '4px 8px',
        borderRadius: 4
      }}
    >
      {text}
    </div>
  );
}
```

```tsx
// ✅ С useLayoutEffect — мигания нет
function Tooltip({ text, anchor }: { text: string; anchor: DOMRect | null }) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!tooltipRef.current || !anchor) return;
    const tooltip = tooltipRef.current;
    const top = anchor.top - tooltip.offsetHeight - 8;
    const left = anchor.left + anchor.width / 2 - tooltip.offsetWidth / 2;
    setPosition({ top, left }); // Обновляется ДО отрисовки → без мигания!
  }, [anchor]);

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        background: 'black',
        color: 'white',
        padding: '4px 8px',
        borderRadius: 4
      }}
    >
      {text}
    </div>
  );
}
```

С `useEffect` пользователь на долю секунды увидит тултип в неверной позиции (обычно в `top: 0, left: 0`), а затем он скачком переместится. С `useLayoutEffect` позиция вычисляется до отрисовки — никакого мигания.

## Практические примеры

### Пример 1: Синхронизация высоты колонок

```tsx
import { useLayoutEffect, useRef, useState } from 'react';

function EqualHeightColumns({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!leftRef.current || !rightRef.current) return;

    const leftHeight = leftRef.current.scrollHeight;
    const rightHeight = rightRef.current.scrollHeight;
    setHeight(Math.max(leftHeight, rightHeight));
  }, [left, right]);

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div ref={leftRef} style={{ flex: 1, height }}>
        {left}
      </div>
      <div ref={rightRef} style={{ flex: 1, height }}>
        {right}
      </div>
    </div>
  );
}
```

### Пример 2: Анимация при монтировании

```tsx
import { useLayoutEffect, useRef } from 'react';

function FadeInComponent({ children }: { children: React.ReactNode }) {
  const elementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Устанавливаем начальное состояние ДО первой отрисовки
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';

    // Запускаем анимацию через requestAnimationFrame
    const rafId = requestAnimationFrame(() => {
      element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  return <div ref={elementRef}>{children}</div>;
}
```

### Пример 3: Позиционирование выпадающего меню

```tsx
import { useLayoutEffect, useRef, useState } from 'react';

function DropdownMenu({
  trigger,
  children
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Если снизу места меньше, чем нужно меню — открываем вверх
    const openUpward = spaceBelow < menuRect.height && spaceAbove > menuRect.height;

    setMenuStyle({
      position: 'fixed',
      left: triggerRect.left,
      top: openUpward
        ? triggerRect.top - menuRect.height - 4
        : triggerRect.bottom + 4,
      minWidth: triggerRect.width,
      zIndex: 1000
    });
  }, [isOpen]);

  return (
    <div>
      <button ref={triggerRef} onClick={() => setIsOpen(o => !o)}>
        {trigger}
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          style={{
            ...menuStyle,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: 8
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
```

### Пример 4: Скролл к активному элементу

```tsx
import { useLayoutEffect, useRef } from 'react';

function TabList({ tabs, activeTab }: { tabs: string[]; activeTab: string }) {
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!activeTabRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const tab = activeTabRef.current;
    const tabRect = tab.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Скроллим синхронно, чтобы активная вкладка была видна с первого кадра
    if (tabRect.left < containerRect.left) {
      container.scrollLeft -= containerRect.left - tabRect.left + 16;
    } else if (tabRect.right > containerRect.right) {
      container.scrollLeft += tabRect.right - containerRect.right + 16;
    }
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', overflowX: 'auto', gap: 8, scrollBehavior: 'auto' }}
    >
      {tabs.map(tab => (
        <button
          key={tab}
          ref={tab === activeTab ? activeTabRef : undefined}
          style={{
            whiteSpace: 'nowrap',
            padding: '8px 16px',
            background: tab === activeTab ? '#6366f1' : 'transparent',
            color: tab === activeTab ? 'white' : 'inherit',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
```

## Использование с TypeScript

`useLayoutEffect` используется точно так же, как `useEffect`:

```tsx
import { useLayoutEffect, useRef, MutableRefObject } from 'react';

function useMeasure(ref: MutableRefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;

    // Измеряем сразу после рендера, до отрисовки
    const { offsetWidth, offsetHeight } = ref.current;
    setSize({ width: offsetWidth, height: offsetHeight });
  }, []); // Зависимости — пустой массив для однократного измерения

  return size;
}

// Использование
function Component() {
  const boxRef = useRef<HTMLDivElement>(null);
  const { width, height } = useMeasure(boxRef);

  return (
    <div ref={boxRef}>
      Размер: {width} × {height}
    </div>
  );
}
```

## Сравнение useEffect и useLayoutEffect

| Характеристика | `useEffect` | `useLayoutEffect` |
|----------------|-------------|-------------------|
| Время выполнения | После отрисовки браузером | После обновления DOM, до отрисовки |
| Тип выполнения | Асинхронный | Синхронный |
| Блокирует ли отрисовку | Нет | Да |
| Влияет на производительность | Минимально | Может замедлить рендер |
| Подходит для | 90% задач с побочными эффектами | Измерение DOM, синхронные обновления стилей |
| SSR | Работает | Выдаёт предупреждение |

## SSR и useLayoutEffect

Важное ограничение: `useLayoutEffect` **не выполняется на сервере** при Server-Side Rendering. При этом React выдаёт предупреждение:

```
Warning: useLayoutEffect does nothing on the server because its effect
cannot be encoded into the server renderer's output format.
```

**Способы решения:**

**1. Заменить на useEffect**, если это возможно — в большинстве случаев лучший вариант:
```tsx
// На сервере DOM недоступен, так что useEffect достаточен
useEffect(() => {
  // ...
}, [deps]);
```

**2. Использовать хук с определением среды:**
```tsx
import { useEffect, useLayoutEffect } from 'react';

// Безопасный useLayoutEffect — на сервере работает как useEffect
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function Component() {
  useIsomorphicLayoutEffect(() => {
    // Безопасно для SSR
  }, []);
}
```

**3. Откладывать рендер до монтирования:**
```tsx
function ClientOnlyComponent({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <>{children}</>;
}
```

## Когда использовать useLayoutEffect

### ✅ Используйте useLayoutEffect, когда:

1. **Измеряете DOM и сразу обновляете стили/позицию** — чтобы избежать мигания
2. **Позиционируете элементы** (тултипы, дропдауны, попапы) — нужно знать размеры перед отрисовкой
3. **Запускаете анимации** — нужно установить начальное состояние до первой отрисовки
4. **Синхронизируете несколько DOM-элементов** — выравнивание высот, ширин
5. **Работаете со сторонними DOM-библиотеками**, которые требуют синхронных операций

### ❌ Не используйте useLayoutEffect, когда:

1. **Эффект не взаимодействует с DOM** — используйте `useEffect`
2. **Асинхронные операции** (fetch, setTimeout) — используйте `useEffect`
3. **Большинство обычных побочных эффектов** — `useEffect` достаточен
4. **SSR-приложения** — без крайней необходимости

## Правило выбора

Простое правило:

> Начинайте с `useEffect`. Переходите к `useLayoutEffect` только если замечаете визуальное мигание или мерцание, связанное с обновлением DOM.

`useLayoutEffect` блокирует отрисовку браузера — долгие операции в нём замедляют весь интерфейс. Используйте его только для минимального необходимого кода.

## Заключение

`useLayoutEffect` — это мощный инструмент для тех редких случаев, когда нужно выполнить синхронную работу с DOM до того, как пользователь увидит результат рендера. Он решает проблему мигания (flicker) при динамическом позиционировании элементов и синхронизации DOM-свойств.

Ключевые выводы:
- `useLayoutEffect` выполняется **синхронно** после обновления DOM, но **до отрисовки** браузером
- Используйте его для **измерения DOM и синхронного обновления позиций/стилей**
- В **SSR** используйте `useIsomorphicLayoutEffect` или замените на `useEffect`
- **По умолчанию** предпочитайте `useEffect` — он не блокирует отрисовку и подходит для большинства задач
