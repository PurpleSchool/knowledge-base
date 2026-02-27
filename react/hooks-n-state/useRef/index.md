---
metaTitle: useRef в React — создание ссылок на DOM и значения
metaDescription: Полное руководство по useRef в React: работа с DOM-элементами, хранение значений без ре-рендера, форвардинг рефов, TypeScript и практические примеры
author: Олег Марков
title: useRef в React — создание ссылок на DOM и значения
preview: Изучите хук useRef в React — как получить прямой доступ к DOM-элементам, хранить изменяемые значения без вызова ре-рендера и правильно применять рефы в реальных проектах
---

## Введение

В React данные обычно текут сверху вниз через пропсы, а обновление состояния через `useState` вызывает перерисовку компонента. Но иногда нужно взаимодействовать с чем-то напрямую — обратиться к DOM-элементу, сохранить значение между рендерами без перерисовки или запомнить предыдущее состояние.

Для всего этого в React существует хук `useRef`. Он предоставляет изменяемый контейнер, который живёт на протяжении всего жизненного цикла компонента и не вызывает ре-рендер при обновлении.

В этой статье вы разберётесь, что такое `useRef`, как работать с DOM через рефы, когда использовать `useRef` вместо `useState` и какие ошибки чаще всего допускают разработчики. Хотите углублённо изучить React и научиться правильно работать с хуками? Приходите на наш курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=use-ref). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Что такое useRef

`useRef` — это хук React, который возвращает изменяемый объект с единственным свойством `.current`. Этот объект сохраняется между рендерами компонента и **не вызывает ре-рендер при изменении**.

```tsx
import { useRef } from 'react';

const ref = useRef(initialValue);
// ref.current === initialValue при первом вызове
```

**Ключевые свойства `useRef`:**
- `ref.current` — текущее значение рефа
- Изменение `ref.current` **не вызывает ре-рендер**
- Объект `ref` остаётся стабильным между рендерами (та же ссылка)
- Может хранить любое значение: DOM-элемент, число, строку, объект, функцию

## Синтаксис useRef

```tsx
import { useRef } from 'react';

const ref = useRef<T>(initialValue);
```

**Параметры:**
- `initialValue` — начальное значение `ref.current`. После первого рендера игнорируется.

**Возвращаемое значение:** Объект `{ current: T }`.

## Использование 1: Работа с DOM-элементами

Самое распространённое применение `useRef` — прямой доступ к DOM-узлам: управление фокусом, прокруткой, анимациями и интеграция со сторонними библиотеками.

### Управление фокусом

```tsx
import { useRef } from 'react';

function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    // Прямой доступ к DOM-элементу
    inputRef.current?.focus();
  };

  return (
    <div>
      {/* Связываем ref с DOM-элементом через атрибут ref */}
      <input ref={inputRef} placeholder="Поиск..." />
      <button onClick={focusInput}>Сфокусироваться</button>
    </div>
  );
}
```

После монтирования компонента `inputRef.current` будет указывать на DOM-элемент `<input>`. При размонтировании React автоматически устанавливает `ref.current = null`.

### Управление воспроизведением медиа

```tsx
import { useRef } from 'react';

function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => videoRef.current?.play();
  const handlePause = () => videoRef.current?.pause();

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  return (
    <div>
      <video ref={videoRef} src={src} />
      <button onClick={handlePlay}>▶ Воспроизвести</button>
      <button onClick={handlePause}>⏸ Пауза</button>
      <button onClick={() => handleSeek(0)}>⏮ В начало</button>
    </div>
  );
}
```

### Измерение размеров элемента

```tsx
import { useRef, useState, useEffect } from 'react';

function ResizablePanel({ children }: { children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!panelRef.current) return;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={panelRef} style={{ resize: 'both', overflow: 'auto', border: '1px solid #ccc' }}>
      <p>Размер: {dimensions.width.toFixed(0)} × {dimensions.height.toFixed(0)}</p>
      {children}
    </div>
  );
}
```

## Использование 2: Хранение значений без ре-рендера

`useRef` — это не только про DOM. Он отлично подходит для хранения любых значений, изменение которых не должно вызывать перерисовку компонента.

### Сравнение useState и useRef

```tsx
// useState — вызывает ре-рендер при изменении
const [count, setCount] = useState(0);
setCount(count + 1); // Компонент перерисуется

// useRef — НЕ вызывает ре-рендер при изменении
const countRef = useRef(0);
countRef.current += 1; // Компонент НЕ перерисуется
```

### Хранение идентификатора таймера

```tsx
import { useRef, useState } from 'react';

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (intervalRef.current !== null) return; // Уже запущен

    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current === null) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const reset = () => {
    stop();
    setElapsed(0);
  };

  return (
    <div>
      <p>Прошло: {elapsed} сек</p>
      <button onClick={start}>Старт</button>
      <button onClick={stop}>Стоп</button>
      <button onClick={reset}>Сброс</button>
    </div>
  );
}
```

Если бы мы использовали `useState` для `intervalId`, каждое обновление таймера вызывало бы лишний ре-рендер. `useRef` решает это элегантно.

### Запоминание предыдущего значения

```tsx
import { useRef, useEffect } from 'react';

function usePrevious<T>(value: T): T | undefined {
  const prevRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    // Обновляем реф ПОСЛЕ рендера
    prevRef.current = value;
  });

  // Возвращаем предыдущее значение (до текущего рендера)
  return prevRef.current;
}

// Использование
function PriceTracker({ price }: { price: number }) {
  const prevPrice = usePrevious(price);

  return (
    <div>
      <p>Текущая цена: {price} ₽</p>
      {prevPrice !== undefined && (
        <p style={{ color: price > prevPrice ? 'green' : 'red' }}>
          {price > prevPrice ? '▲' : '▼'} Прошлая цена: {prevPrice} ₽
        </p>
      )}
    </div>
  );
}
```

### Флаг монтирования компонента

```tsx
import { useRef, useEffect, useState } from 'react';

function AsyncComponent({ url }: { url: string }) {
  const [data, setData] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        // Проверяем, что компонент ещё смонтирован
        if (isMountedRef.current) {
          setData(data);
        }
      });

    return () => {
      isMountedRef.current = false; // Компонент размонтирован
    };
  }, [url]);

  return <div>{data ? JSON.stringify(data) : 'Загрузка...'}</div>;
}
```

## Использование с TypeScript

При работе с DOM-элементами TypeScript требует указания типа элемента:

```tsx
// DOM-элементы — начальное значение null
const divRef = useRef<HTMLDivElement>(null);
const inputRef = useRef<HTMLInputElement>(null);
const buttonRef = useRef<HTMLButtonElement>(null);
const formRef = useRef<HTMLFormElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

// Обычные значения — указываем тип данных
const countRef = useRef<number>(0);
const nameRef = useRef<string>('');
const listRef = useRef<string[]>([]);

// Обнуляемые значения
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

**Важный нюанс:** для DOM-рефов используйте `useRef<HTMLElement>(null)` — значение будет `null` до монтирования. При обращении используйте опциональную цепочку или проверку:

```tsx
const inputRef = useRef<HTMLInputElement>(null);

// ✅ Безопасно через опциональную цепочку
inputRef.current?.focus();

// ✅ Безопасно через проверку
if (inputRef.current) {
  inputRef.current.value = '';
}

// ❌ Опасно — может быть null
inputRef.current.focus(); // TypeError!
```

## Forwarding Refs (форвардинг рефов)

По умолчанию рефы не передаются в дочерние компоненты. Для этого используется `React.forwardRef`:

```tsx
import { forwardRef, useRef } from 'react';

// Компонент с поддержкой рефов
const CustomInput = forwardRef<HTMLInputElement, { placeholder?: string }>(
  ({ placeholder }, ref) => {
    return (
      <input
        ref={ref}
        placeholder={placeholder}
        style={{ border: '2px solid #6366f1', borderRadius: 4, padding: '4px 8px' }}
      />
    );
  }
);

// Использование
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    console.log('Значение:', inputRef.current?.value);
    inputRef.current?.focus();
  };

  return (
    <div>
      <CustomInput ref={inputRef} placeholder="Введите имя" />
      <button onClick={handleSubmit}>Отправить</button>
    </div>
  );
}
```

## Распространённые ошибки

### Ошибка 1: Читать ref во время рендера

```tsx
// ❌ Ошибка — ref.current может быть null при рендере
function Component() {
  const divRef = useRef<HTMLDivElement>(null);
  const width = divRef.current?.offsetWidth; // null при первом рендере!

  return <div ref={divRef}>Ширина: {width}px</div>;
}

// ✅ Правильно — читаем в useEffect или обработчиках
function Component() {
  const divRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (divRef.current) {
      setWidth(divRef.current.offsetWidth);
    }
  }, []);

  return <div ref={divRef}>Ширина: {width}px</div>;
}
```

### Ошибка 2: Использовать useRef вместо useState для отображаемых данных

```tsx
// ❌ Ошибка — изменение ref не вызывает ре-рендер, UI не обновится
function Counter() {
  const countRef = useRef(0);
  return (
    <div>
      <p>{countRef.current}</p> {/* Не обновится на экране! */}
      <button onClick={() => countRef.current++}>+1</button>
    </div>
  );
}

// ✅ Правильно — для отображаемых данных используйте useState
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

### Ошибка 3: Изменять ref в теле компонента во время рендера

```tsx
// ❌ Ошибка — изменение рефа во время рендера ведёт к непредсказуемому поведению
function Component({ value }: { value: number }) {
  const ref = useRef(0);
  ref.current = value; // Не делайте так при рендере!
  return <div>{ref.current}</div>;
}

// ✅ Исключение — если это нужно для синхронизации (например, сохранить последний пропс)
// Делайте это без условий и не в цикле
function Component({ onAction }: { onAction: () => void }) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction; // OK — синхронизируем реф с пропсом
  // ...
}
```

## Практический пример: автосохранение формы

```tsx
import { useRef, useState, useEffect, useCallback } from 'react';

function AutoSaveForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Реф для хранения таймера — не вызывает ре-рендер
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Реф для актуальных данных формы — избегаем замыкания в таймере
  const formDataRef = useRef({ title, content });

  // Синхронизируем реф с текущими данными
  formDataRef.current = { title, content };

  const save = useCallback(async () => {
    setSaveStatus('saving');
    await new Promise(resolve => setTimeout(resolve, 800)); // Имитация запроса
    console.log('Сохранено:', formDataRef.current);
    setSaveStatus('saved');
  }, []);

  // Автосохранение с дебаунсингом
  useEffect(() => {
    if (!title && !content) return;

    setSaveStatus('unsaved');

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      save();
    }, 1500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [title, content, save]);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2>Редактор</h2>
        <span style={{ color: saveStatus === 'saved' ? 'green' : saveStatus === 'saving' ? 'orange' : 'gray' }}>
          {saveStatus === 'saved' ? '✓ Сохранено' : saveStatus === 'saving' ? '⏳ Сохраняем...' : '● Не сохранено'}
        </span>
      </div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Заголовок"
        style={{ width: '100%', marginBottom: 8, padding: 8, fontSize: 18 }}
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Содержание..."
        rows={10}
        style={{ width: '100%', padding: 8 }}
      />
    </div>
  );
}
```

## Когда использовать useRef

| Ситуация | useState | useRef |
|----------|----------|--------|
| Данные для отображения в UI | ✅ | ❌ |
| Прямой доступ к DOM | ❌ | ✅ |
| Таймеры и интервалы | ❌ | ✅ |
| Предыдущие значения | ❌ | ✅ |
| Флаги (смонтирован/нет) | ❌ | ✅ |
| Кеш значений (не для UI) | ❌ | ✅ |

## Заключение

`useRef` — это универсальный инструмент для двух задач:

1. **Прямой доступ к DOM** — управление фокусом, прокруткой, анимациями, интеграция со сторонними библиотеками
2. **Хранение изменяемых значений** — без вызова ре-рендера при изменении

Главное правило: если значение нужно отображать в UI — используйте `useState`. Если значение нужно только для внутренней логики компонента и не должно вызывать перерисовку — используйте `useRef`.
