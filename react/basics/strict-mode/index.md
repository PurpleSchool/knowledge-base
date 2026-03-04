---
metaTitle: "StrictMode в React — строгий режим разработки"
metaDescription: "Полное руководство по React StrictMode: что проверяет строгий режим, как его использовать, какие предупреждения выдаёт, и зачем он нужен в разработке."
author: Олег Марков
title: "StrictMode в React — как находить ошибки на этапе разработки"
preview: "Разбираем работу StrictMode в React: почему компоненты рендерятся дважды, как строгий режим помогает выявить утечки памяти и побочные эффекты, а также подготовить приложение к переходу на новые версии библиотеки."
---

# StrictMode — строгий режим в React

**StrictMode** — это инструмент React для выявления потенциальных проблем в приложении **только в режиме разработки**. Он не рендерит дополнительный DOM-элемент и не влияет на производительность в продакшене.

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

## Что делает StrictMode

StrictMode активирует дополнительные проверки и предупреждения для своих потомков:

- **Двойной вызов** рендер-функций, state initializers и reducer-функций для обнаружения побочных эффектов
- **Двойной вызов** функций, переданных в `useMemo`, `useReducer`, `useState`
- **Предупреждения** об устаревших API и паттернах
- **Обнаружение** компонентов с неожиданными побочными эффектами

> ⚠️ StrictMode работает только в `development`-режиме. В `production`-сборке поведение компонентов не изменяется.

## Двойной рендер для выявления побочных эффектов

В StrictMode React специально вызывает следующие функции **дважды**:

- Тело функционального компонента
- Функции, переданные в `useState`, `useMemo`, `useReducer`
- Конструктор класса
- Метод `render` классового компонента

```tsx
// Этот компонент вызовется дважды в StrictMode
function Counter() {
  console.log('render'); // Увидите дважды в dev-режиме

  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

Если после двойного вызова компонент работает некорректно — значит, у него **нечистая функция рендера** с побочными эффектами.

```tsx
// ❌ Плохо — побочный эффект в рендере
let globalCounter = 0;

function BadComponent() {
  globalCounter++; // Побочный эффект! StrictMode обнаружит проблему
  return <div>Счётчик: {globalCounter}</div>;
}

// ✅ Хорошо — чистый рендер без побочных эффектов
function GoodComponent({ count }: { count: number }) {
  return <div>Счётчик: {count}</div>;
}
```

## Проверка эффектов монтирования/размонтирования

Начиная с React 18, StrictMode намеренно **монтирует и сразу размонтирует** каждый компонент при первом рендере, а затем монтирует снова. Это позволяет выявить проблемы с функцией очистки `useEffect`.

```tsx
// В StrictMode (dev) последовательность такова:
// 1. mount → effect запускается
// 2. unmount → cleanup запускается
// 3. mount → effect запускается снова

useEffect(() => {
  console.log('effect');    // Вызовется дважды в dev/StrictMode
  const timer = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);

  return () => {
    console.log('cleanup'); // Должен корректно отменять подписки
    clearInterval(timer);   // ✅ Хорошая очистка
  };
}, []);
```

```tsx
// ❌ Плохо — нет очистки, утечка подписки
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // StrictMode обнаружит, что после повторного монтирования
  // будет два обработчика resize вместо одного
}, []);

// ✅ Хорошо — корректная очистка
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Предупреждения об устаревших API

StrictMode выдаёт предупреждения при использовании устаревших возможностей React:

### Устаревшие методы жизненного цикла

```tsx
// ⚠️ StrictMode предупредит об использовании этих методов:
class OldComponent extends React.Component {
  componentWillMount() { /* UNSAFE_componentWillMount */ }
  componentWillReceiveProps(nextProps) { /* UNSAFE_componentWillReceiveProps */ }
  componentWillUpdate(nextProps, nextState) { /* UNSAFE_componentWillUpdate */ }
}

// ✅ Современные аналоги:
class ModernComponent extends React.Component {
  // Вместо componentWillMount:
  componentDidMount() { /* Используйте componentDidMount */ }

  // Вместо componentWillReceiveProps:
  static getDerivedStateFromProps(props, state) { return null; }

  // Вместо componentWillUpdate:
  getSnapshotBeforeUpdate(prevProps, prevState) { return null; }
}
```

### Устаревший API ref

```tsx
// ⚠️ Устаревший string ref — StrictMode предупредит
class OldRef extends React.Component {
  render() {
    return <input ref="myInput" />; // Устарело!
  }
}

// ✅ Современный createRef или useRef
class ModernRef extends React.Component {
  myInput = React.createRef<HTMLInputElement>();

  render() {
    return <input ref={this.myInput} />;
  }
}

// ✅ Или useRef для функциональных компонентов
function FunctionRef() {
  const myInput = useRef<HTMLInputElement>(null);
  return <input ref={myInput} />;
}
```

### Устаревший Context API

```tsx
// ⚠️ Устаревший legacy context — предупреждение StrictMode
class OldContext extends React.Component {
  static contextTypes = {
    color: PropTypes.string
  };
}

// ✅ Современный Context API
const ColorContext = createContext<string>('black');

function ModernContext() {
  const color = useContext(ColorContext);
  return <div style={{ color }}>Текст</div>;
}
```

## Использование в части приложения

StrictMode можно применять не ко всему приложению, а только к определённым частям:

```tsx
function App() {
  return (
    <div>
      {/* Этот компонент рендерится без строгого режима */}
      <Header />

      {/* Только этот поддерев проверяется StrictMode */}
      <StrictMode>
        <main>
          <Sidebar />
          <Content />
        </main>
      </StrictMode>

      {/* Тоже без строгого режима */}
      <Footer />
    </div>
  );
}
```

## StrictMode в Next.js

В Next.js StrictMode включается в конфигурации:

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Включён по умолчанию с Next.js 13+
};

export default nextConfig;
```

## Отладка двойного рендера

Если двойной рендер мешает отладке (например, дублируются console.log), можно временно отключить StrictMode:

```tsx
// В development: временно уберите StrictMode для отладки
root.render(
  // <StrictMode>
    <App />
  // </StrictMode>
);

// ⚠️ Не забудьте вернуть StrictMode после отладки!
```

Или используйте `useEffect` вместо прямых вызовов для side effects:

```tsx
// ❌ Сайд-эффект в теле компонента
function Component() {
  console.log('render'); // Дублируется в StrictMode — это сигнал о проблеме
  fetch('/api/data');    // Дублируется — плохо!
  return <div />;
}

// ✅ Сайд-эффекты в useEffect
function Component() {
  useEffect(() => {
    fetch('/api/data'); // Запускается после рендера, с корректной очисткой
  }, []);
  return <div />;
}
```

## Чеклист для StrictMode

| Проблема | Симптом | Решение |
|----------|---------|---------|
| Побочный эффект в рендере | Компонент ломается при двойном вызове | Убрать side effects из рендер-функции |
| Нет очистки в useEffect | Дублирование подписок/таймеров | Добавить return cleanup функцию |
| Устаревшие lifecycle методы | Предупреждения в консоли | Мигрировать на современные аналоги |
| String refs | Предупреждение в консоли | Использовать createRef/useRef |
| Legacy Context | Предупреждение в консоли | Перейти на createContext/useContext |

## Краткое резюме

| Концепция | Суть |
|-----------|------|
| StrictMode | Инструмент dev-режима для выявления проблем |
| Двойной рендер | Помогает найти нечистые функции и побочные эффекты |
| Двойное монтирование | Выявляет некорректные useEffect без очистки |
| Устаревшие API | Предупреждения о componentWillMount, string refs и т.д. |
| Продакшен | StrictMode не влияет на поведение в production |

## Дополнительные материалы

- [React Docs — StrictMode](https://react.dev/reference/react/StrictMode)
- [React 18 — новое поведение StrictMode](https://react.dev/blog/2022/03/29/react-v18#new-strict-mode-behaviors)
- [Почему компоненты монтируются дважды в StrictMode](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)
