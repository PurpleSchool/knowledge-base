---
metaTitle: "useInsertionEffect в React — внедрение стилей до мутаций DOM"
metaDescription: "Полное руководство по хуку useInsertionEffect в React 18. Узнайте, когда и зачем он нужен, чем отличается от useEffect и useLayoutEffect, как его используют CSS-in-JS библиотеки для вставки стилей."
author: Олег Марков
title: useInsertionEffect — внедрение стилей до мутаций DOM
preview: Хук useInsertionEffect запускается синхронно до любых мутаций DOM, раньше useLayoutEffect и useEffect. Он предназначен для CSS-in-JS библиотек, которым нужно вставлять теги <style> до того, как браузер вычислит стили. Разберём синтаксис, отличия от других хуков жизненного цикла и правила использования.
---

## Введение

React предоставляет несколько хуков для выполнения побочных эффектов: `useEffect`, `useLayoutEffect` и, начиная с React 18, `useInsertionEffect`. Каждый из них запускается в разный момент жизненного цикла компонента — и понимание этих отличий критично для правильного применения.

`useInsertionEffect` — это специализированный хук, созданный не для общего использования, а для нужд авторов CSS-in-JS библиотек. Он позволяет вставлять динамически сгенерированные `<style>` теги в DOM до того, как React применит мутации и браузер вычислит стили. Это решает специфическую проблему некорректного расчёта стилей при использовании `useLayoutEffect` совместно с CSS-in-JS.

Если вы хотите глубже разобраться в механизмах React и научиться строить современные приложения — приходите на [наш курс по React](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useInsertionEffect). Там мы разбираем все аспекты React на практических проектах.

## Что такое useInsertionEffect и зачем он нужен

До появления `useInsertionEffect` авторы CSS-in-JS библиотек (styled-components, Emotion, и другие) сталкивались с серьёзной проблемой: когда компонент читал размеры элементов через `useLayoutEffect`, стили могли ещё не быть вставлены в DOM. Это приводило к некорректным вычислениям.

Порядок выполнения эффектов в React до React 18:

```
Рендер → Мутации DOM → useLayoutEffect → useEffect
```

Проблема в том, что CSS-in-JS библиотеки также использовали `useLayoutEffect` для вставки стилей. Если компонент A вставлял стили через `useLayoutEffect`, а компонент B читал геометрию через `useLayoutEffect`, порядок выполнения был непредсказуем — компонент B мог прочитать геометрию до вставки стилей компонентом A.

`useInsertionEffect` решает эту проблему, добавляя новую фазу выполнения перед мутациями DOM:

```
Рендер → useInsertionEffect → Мутации DOM → useLayoutEffect → useEffect
```

Теперь CSS-in-JS библиотеки могут вставлять стили в `useInsertionEffect`, и к моменту, когда `useLayoutEffect` в пользовательских компонентах прочитает геометрию, все стили уже будут в DOM.

## Синтаксис useInsertionEffect

```tsx
useInsertionEffect(setup, dependencies?)
```

| Параметр | Тип | Описание |
|----------|-----|---------|
| `setup` | `() => void \| (() => void)` | Функция эффекта. Может возвращать функцию очистки. В отличие от `useEffect` и `useLayoutEffect`, **не имеет доступа к refs** в момент выполнения |
| `dependencies` | `any[]` | (Опционально) Массив зависимостей. Эффект перезапускается при изменении любой зависимости. Если не передан — выполняется после каждого рендера |

| Возвращаемое значение | Описание |
|----------------------|---------|
| `undefined` | Хук ничего не возвращает |

```tsx
import { useInsertionEffect } from 'react';

function MyComponent() {
  useInsertionEffect(() => {
    // Код здесь выполняется ДО мутаций DOM
    // Идеально для вставки <style> тегов

    return () => {
      // Функция очистки (опционально)
    };
  }, [/* зависимости */]);
}
```

## Порядок выполнения: useInsertionEffect vs useLayoutEffect vs useEffect

Чтобы понять `useInsertionEffect`, важно чётко представлять, когда каждый из хуков выполняется:

```
1. React рендерит компонент (вычисляет Virtual DOM)
2. useInsertionEffect (до мутаций DOM) ← здесь вставляем стили
3. React применяет мутации к реальному DOM
4. useLayoutEffect (синхронно, после мутаций DOM) ← здесь читаем геометрию
5. Браузер отрисовывает экран
6. useEffect (асинхронно, после отрисовки) ← здесь работаем с данными
```

Посмотрим на это в коде:

```tsx
import { useEffect, useLayoutEffect, useInsertionEffect } from 'react';

function OrderDemo() {
  useInsertionEffect(() => {
    console.log('1. useInsertionEffect — до мутаций DOM');
    return () => console.log('1. useInsertionEffect cleanup');
  }, []);

  useLayoutEffect(() => {
    console.log('2. useLayoutEffect — после мутаций DOM, до отрисовки');
    return () => console.log('2. useLayoutEffect cleanup');
  }, []);

  useEffect(() => {
    console.log('3. useEffect — после отрисовки браузера');
    return () => console.log('3. useEffect cleanup');
  }, []);

  return <div>Проверка порядка</div>;
}

// В консоли при монтировании:
// 1. useInsertionEffect — до мутаций DOM
// 2. useLayoutEffect — после мутаций DOM, до отрисовки
// 3. useEffect — после отрисовки браузера
```

## Основной сценарий использования: CSS-in-JS библиотеки

`useInsertionEffect` создан специально для одного сценария — вставки динамических `<style>` тегов. Вот как это используется в CSS-in-JS библиотеках:

### Простая реализация CSS-in-JS

```tsx
import { useInsertionEffect } from 'react';

// Кеш для отслеживания уже вставленных стилей
const injectedStyles = new Set<string>();

function injectStyle(css: string): string {
  // Генерируем уникальный идентификатор класса на основе CSS
  const className = `css-${hashString(css)}`;

  if (!injectedStyles.has(className)) {
    injectedStyles.add(className);

    // Создаём тег <style> и вставляем в <head>
    const style = document.createElement('style');
    style.textContent = `.${className} { ${css} }`;
    document.head.appendChild(style);
  }

  return className;
}

// Упрощённая хеш-функция для примера
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// Хук для использования динамических стилей
function useCSS(css: string): string {
  // useInsertionEffect гарантирует, что стили вставляются ДО мутаций DOM
  useInsertionEffect(() => {
    injectStyle(css);
  }, [css]);

  // Вычисляем имя класса синхронно для рендера
  return `css-${hashString(css)}`;
}

// Использование в компоненте
function StyledButton({ primary }: { primary?: boolean }) {
  const baseClass = useCSS('padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer;');
  const colorClass = useCSS(
    primary
      ? 'background: #007bff; color: white;'
      : 'background: #6c757d; color: white;'
  );

  return (
    <button className={`${baseClass} ${colorClass}`}>
      {primary ? 'Основная кнопка' : 'Вторичная кнопка'}
    </button>
  );
}
```

### Как это используется в Emotion

Emotion (популярная CSS-in-JS библиотека) использует `useInsertionEffect` внутренне начиная с версии 11.10.0:

```tsx
// Упрощённая схема работы Emotion под капотом
import { useInsertionEffect } from 'react';

class StyleSheet {
  private rules: Map<string, string> = new Map();
  private styleTag: HTMLStyleElement | null = null;

  private getOrCreateStyleTag(): HTMLStyleElement {
    if (!this.styleTag) {
      this.styleTag = document.createElement('style');
      this.styleTag.setAttribute('data-emotion', '');
      document.head.appendChild(this.styleTag);
    }
    return this.styleTag;
  }

  insert(key: string, rule: string): void {
    if (!this.rules.has(key)) {
      this.rules.set(key, rule);
      const tag = this.getOrCreateStyleTag();
      if (tag.sheet) {
        tag.sheet.insertRule(rule, tag.sheet.cssRules.length);
      } else {
        tag.textContent += rule;
      }
    }
  }
}

const sheet = new StyleSheet();

// Emotion вызывает это через useInsertionEffect:
function useStyles(styles: Record<string, string | number>): string {
  const cssText = Object.entries(styles)
    .map(([prop, val]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${val};`)
    .join(' ');

  const key = hashString(cssText);
  const className = `emotion-${key}`;
  const rule = `.${className} { ${cssText} }`;

  useInsertionEffect(() => {
    sheet.insert(key, rule);
  }, [key, rule]);

  return className;
}
```

## Важные ограничения useInsertionEffect

`useInsertionEffect` имеет намеренно строгие ограничения, которые отличают его от `useLayoutEffect` и `useEffect`:

### 1. Нет доступа к refs

В момент выполнения `useInsertionEffect` React ещё не применил мутации к DOM, поэтому refs не указывают на реальные DOM-узлы:

```tsx
import { useRef, useInsertionEffect } from 'react';

function Component() {
  const divRef = useRef<HTMLDivElement>(null);

  useInsertionEffect(() => {
    // ❌ divRef.current будет null — DOM ещё не обновлён
    console.log(divRef.current); // null

    // ❌ Нельзя читать геометрию
    // const rect = divRef.current?.getBoundingClientRect(); // undefined
  }, []);

  useLayoutEffect(() => {
    // ✅ Здесь refs уже доступны
    console.log(divRef.current); // <div>...</div>
  }, []);

  return <div ref={divRef}>Hello</div>;
}
```

### 2. Нет обновления состояния

Вызов `setState` внутри `useInsertionEffect` не поддерживается и приведёт к ошибке:

```tsx
import { useState, useInsertionEffect } from 'react';

function BadComponent() {
  const [count, setCount] = useState(0);

  useInsertionEffect(() => {
    // ❌ Нельзя вызывать setState внутри useInsertionEffect
    setCount(1); // Выбросит ошибку в режиме разработки
  }, []);

  return <div>{count}</div>;
}
```

### 3. Синхронное выполнение

Как и `useLayoutEffect`, `useInsertionEffect` выполняется синхронно. Длительные операции заблокируют поток:

```tsx
useInsertionEffect(() => {
  // ❌ Асинхронные операции здесь не имеют смысла
  // fetch('/api/styles').then(css => injectStyle(css)); // стили придут слишком поздно

  // ✅ Только синхронная вставка стилей
  injectStyle('.button { color: red; }');
}, []);
```

### 4. Не запускается на сервере

`useInsertionEffect` не запускается при серверном рендеринге (SSR). Для SSR необходима отдельная логика сбора стилей:

```tsx
import { useInsertionEffect } from 'react';

// На сервере этот эффект не выполнится
function useStyles(css: string) {
  useInsertionEffect(() => {
    // Выполняется только в браузере
    injectStyle(css);
  }, [css]);
}
```

## Сравнение useInsertionEffect с другими хуками

| Характеристика | useInsertionEffect | useLayoutEffect | useEffect |
|----------------|-------------------|-----------------|-----------|
| Момент запуска | До мутаций DOM | После мутаций DOM | После отрисовки |
| Доступ к refs | Нет | Да | Да |
| Блокирует отрисовку | Да | Да | Нет |
| Выполняется на сервере | Нет | Нет | Нет |
| setState внутри | Нет | Да (осторожно) | Да |
| Основное использование | Вставка CSS | Чтение геометрии | Побочные эффекты |
| Для кого предназначен | Авторы библиотек | Разработчики | Разработчики |

## Когда НЕ использовать useInsertionEffect

`useInsertionEffect` — это инструмент для авторов библиотек, а не для обычной разработки. Документация React явно указывает: **не используйте этот хук в прикладном коде**.

```tsx
// ❌ НЕ используйте useInsertionEffect для общих побочных эффектов
function BadUsage() {
  useInsertionEffect(() => {
    document.title = 'Hello'; // Используйте useEffect для этого
    localStorage.setItem('key', 'value'); // И для этого тоже
    analyticsService.track('page_view'); // И для этого
  }, []);
}

// ✅ useEffect — правильный инструмент для большинства побочных эффектов
function GoodUsage() {
  useEffect(() => {
    document.title = 'Hello';
    localStorage.setItem('key', 'value');
    analyticsService.track('page_view');
  }, []);
}

// ✅ useInsertionEffect — только для вставки стилей в DOM
function StyleInjectionLibrary({ css }: { css: string }) {
  useInsertionEffect(() => {
    injectStyleTag(css);
  }, [css]);
}
```

## Практический пример: минимальная CSS-in-JS библиотека

Рассмотрим полноценный пример минимальной CSS-in-JS библиотеки, правильно использующей `useInsertionEffect`:

```tsx
import { useInsertionEffect } from 'react';

// --- Ядро библиотеки ---

type CSSProperties = Partial<{
  color: string;
  backgroundColor: string;
  padding: string;
  margin: string;
  fontSize: string;
  fontWeight: string;
  borderRadius: string;
  border: string;
  display: string;
  flexDirection: string;
  alignItems: string;
  justifyContent: string;
  width: string;
  height: string;
  cursor: string;
  transition: string;
  boxShadow: string;
}>;

// Кеш вставленных классов
const classCache = new Map<string, string>();
let styleElement: HTMLStyleElement | null = null;

function getStyleElement(): HTMLStyleElement {
  if (!styleElement || !document.head.contains(styleElement)) {
    styleElement = document.createElement('style');
    styleElement.setAttribute('data-mini-css', '');
    document.head.appendChild(styleElement);
  }
  return styleElement;
}

function cssPropsToString(props: CSSProperties): string {
  return Object.entries(props)
    .map(([key, val]) => {
      const kebab = key.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
      return `${kebab}: ${val}`;
    })
    .join('; ');
}

function generateClassName(cssString: string): string {
  let hash = 5381;
  for (let i = 0; i < cssString.length; i++) {
    hash = ((hash << 5) + hash) ^ cssString.charCodeAt(i);
  }
  return `mini-${(hash >>> 0).toString(36)}`;
}

function insertClass(className: string, cssString: string): void {
  if (classCache.has(className)) return;

  const rule = `.${className} { ${cssString} }`;
  const el = getStyleElement();

  if (el.sheet) {
    try {
      el.sheet.insertRule(rule, el.sheet.cssRules.length);
    } catch {
      el.textContent += rule + '\n';
    }
  } else {
    el.textContent += rule + '\n';
  }

  classCache.set(className, cssString);
}

// --- Публичный API библиотеки ---

/**
 * Хук для применения динамических CSS стилей.
 * Использует useInsertionEffect для вставки стилей до мутаций DOM.
 */
export function useStyle(props: CSSProperties): string {
  const cssString = cssPropsToString(props);
  const className = generateClassName(cssString);

  // Ключевой момент: вставка стилей через useInsertionEffect
  useInsertionEffect(() => {
    insertClass(className, cssString);
  }, [className, cssString]);

  return className;
}

/**
 * Хук для применения нескольких наборов стилей с условиями.
 */
export function useStyles(stylesMap: Record<string, CSSProperties>): Record<string, string> {
  const classes: Record<string, string> = {};

  for (const [key, props] of Object.entries(stylesMap)) {
    const cssString = cssPropsToString(props);
    const className = generateClassName(cssString);

    useInsertionEffect(() => {
      insertClass(className, cssString);
    }, [className, cssString]);

    classes[key] = className;
  }

  return classes;
}

// --- Пример использования ---

function Button({
  children,
  variant = 'primary',
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
}) {
  const baseClass = useStyle({
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  });

  const variantClass = useStyle({
    primary: {
      backgroundColor: '#007bff',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#6c757d',
      color: 'white',
    },
    danger: {
      backgroundColor: '#dc3545',
      color: 'white',
    },
  }[variant]);

  return (
    <button className={`${baseClass} ${variantClass}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const classes = useStyles({
    card: {
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '16px',
      margin: '8px',
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      margin: '0 0 12px 0',
    },
    body: {
      fontSize: '14px',
    },
  });

  return (
    <div className={classes.card}>
      <h3 className={classes.title}>{title}</h3>
      <div className={classes.body}>{children}</div>
    </div>
  );
}

function App() {
  return (
    <Card title="Пример CSS-in-JS с useInsertionEffect">
      <p>Стили вставляются до мутаций DOM — геометрия всегда корректна.</p>
      <Button variant="primary" onClick={() => alert('Нажато!')}>
        Основная кнопка
      </Button>
      <Button variant="secondary">
        Вторичная кнопка
      </Button>
    </Card>
  );
}
```

## Взаимодействие с useLayoutEffect

Главное преимущество `useInsertionEffect` проявляется в связке с `useLayoutEffect`. Покажем проблему, которую он решает:

```tsx
import { useRef, useEffect, useLayoutEffect, useInsertionEffect } from 'react';

// ❌ Проблема без useInsertionEffect:
// Если CSS-in-JS вставляет стили через useLayoutEffect,
// а компонент читает геометрию тоже через useLayoutEffect —
// порядок выполнения может быть непредсказуемым.

function ProblematicLayout() {
  const boxRef = useRef<HTMLDivElement>(null);

  // CSS-in-JS библиотека (старый подход): вставляет стили в useLayoutEffect
  useLayoutEffect(() => {
    const style = document.createElement('style');
    style.textContent = '.dynamic-box { width: 200px; height: 200px; }';
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Компонент: читает геометрию в useLayoutEffect
  useLayoutEffect(() => {
    // Может выполниться ДО вставки стилей выше!
    const rect = boxRef.current?.getBoundingClientRect();
    console.log('Ширина:', rect?.width); // может быть 0 или неверное значение
  }, []);

  return <div ref={boxRef} className="dynamic-box">Box</div>;
}

// ✅ Решение с useInsertionEffect:
// CSS-in-JS вставляет стили в useInsertionEffect —
// гарантированно ДО любых useLayoutEffect.

function CorrectLayout() {
  const boxRef = useRef<HTMLDivElement>(null);

  // CSS-in-JS библиотека (правильный подход): вставляет стили в useInsertionEffect
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.textContent = '.dynamic-box { width: 200px; height: 200px; }';
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Компонент: читает геометрию в useLayoutEffect
  useLayoutEffect(() => {
    // Теперь стили гарантированно вставлены к этому моменту
    const rect = boxRef.current?.getBoundingClientRect();
    console.log('Ширина:', rect?.width); // 200 — корректное значение
  }, []);

  return <div ref={boxRef} className="dynamic-box">Box</div>;
}
```

## Поддержка SSR: что делать на сервере

Поскольку `useInsertionEffect` не выполняется на сервере, CSS-in-JS библиотеки для SSR используют альтернативный механизм сбора стилей:

```tsx
import { useInsertionEffect } from 'react';

// Серверный коллектор стилей (не использует хуки)
class ServerStyleCollector {
  private styles: string[] = [];

  collect(css: string): void {
    this.styles.push(css);
  }

  getStyleTag(): string {
    return `<style>${this.styles.join('\n')}</style>`;
  }
}

// Контекст для выбора стратегии: сервер или браузер
const isBrowser = typeof window !== 'undefined';
let serverCollector: ServerStyleCollector | null = null;

// Инициализация для SSR
export function createServerCollector(): ServerStyleCollector {
  serverCollector = new ServerStyleCollector();
  return serverCollector;
}

// Хук, который работает и на сервере, и в браузере
export function useStyleSSR(className: string, css: string): string {
  if (!isBrowser && serverCollector) {
    // На сервере: собираем стили синхронно
    serverCollector.collect(`.${className} { ${css} }`);
  }

  // В браузере: вставляем через useInsertionEffect
  useInsertionEffect(() => {
    if (isBrowser) {
      insertClass(className, css);
    }
  }, [className, css]);

  return className;
}

// Использование при SSR (например, в Next.js с Pages Router):
//
// export async function getServerSideProps() {
//   const collector = createServerCollector();
//   const html = renderToString(<App />);
//   const styles = collector.getStyleTag();
//   return { props: { html, styles } };
// }
```

## Лучшие практики

### 1. Используйте только для вставки стилей

```tsx
// ✅ Правильное применение: вставка CSS
useInsertionEffect(() => {
  const el = document.createElement('style');
  el.textContent = `.my-class { color: red; }`;
  document.head.appendChild(el);
  return () => document.head.removeChild(el);
}, []);

// ❌ Неправильное применение: общие побочные эффекты
useInsertionEffect(() => {
  fetch('/api/data'); // Используйте useEffect
  document.title = 'Hello'; // Используйте useEffect
  const size = element.getBoundingClientRect(); // Используйте useLayoutEffect
}, []);
```

### 2. Кешируйте вставленные стили

```tsx
const injectedRules = new Set<string>();

function safeInjectStyle(className: string, css: string): void {
  if (injectedRules.has(className)) return; // не вставляем дважды

  const rule = `.${className} { ${css} }`;
  const style = document.querySelector('style[data-my-lib]') as HTMLStyleElement
    || (() => {
        const el = document.createElement('style');
        el.setAttribute('data-my-lib', '');
        document.head.appendChild(el);
        return el;
      })();

  style.textContent += rule + '\n';
  injectedRules.add(className);
}

function useStyle(css: string): string {
  const className = generateClassName(css);

  useInsertionEffect(() => {
    safeInjectStyle(className, css);
  }, [className, css]);

  return className;
}
```

### 3. Не полагайтесь на refs

```tsx
import { useRef, useInsertionEffect, useLayoutEffect } from 'react';

function Component() {
  const ref = useRef<HTMLDivElement>(null);

  useInsertionEffect(() => {
    // ❌ ref.current здесь null
    // const width = ref.current?.offsetWidth;

    // ✅ Только операции, не требующие DOM-узлов
    injectStyles('.my-component { display: flex; }');
  }, []);

  useLayoutEffect(() => {
    // ✅ Здесь ref.current доступен и стили уже вставлены
    const width = ref.current?.offsetWidth;
    console.log('Ширина компонента:', width);
  }, []);

  return <div ref={ref} className="my-component">Content</div>;
}
```

### 4. Предпочитайте статические таблицы стилей

`useInsertionEffect` — для динамических случаев. Если стили статичны — используйте обычные CSS-файлы или CSS-модули:

```tsx
// ✅ Лучше: статические стили через import
import styles from './Button.module.css';

function Button({ children }: { children: React.ReactNode }) {
  return <button className={styles.button}>{children}</button>;
}

// Используйте useInsertionEffect только когда стили динамические:
function DynamicButton({ color, children }: { color: string; children: React.ReactNode }) {
  const className = useStyle(`background-color: ${color};`);
  return <button className={className}>{children}</button>;
}
```

## Итоги

`useInsertionEffect` — это узкоспециализированный хук React 18, созданный для авторов CSS-in-JS библиотек. Вот ключевые выводы:

- **Запускается до мутаций DOM** — раньше `useLayoutEffect` и `useEffect`, что гарантирует корректность расчётов геометрии после вставки стилей.
- **Предназначен для вставки CSS** — это его единственный легитимный сценарий использования. Для всего остального есть `useEffect` и `useLayoutEffect`.
- **Строгие ограничения** — нет доступа к refs, нельзя вызывать `setState`, только синхронные операции.
- **Не выполняется на сервере** — при SSR нужна отдельная стратегия сбора стилей.
- **Не для прикладного кода** — если вы не пишете CSS-in-JS библиотеку, этот хук вам не нужен.

Порядок хуков жизненного цикла для запоминания:

```
useInsertionEffect → [Мутации DOM] → useLayoutEffect → [Отрисовка] → useEffect
```

Если вы разрабатываете собственную CSS-in-JS систему или вносите вклад в такие библиотеки, `useInsertionEffect` даёт вам надёжный механизм гарантированной вставки стилей в нужный момент. Для всех остальных задач выбирайте `useEffect` или `useLayoutEffect` в зависимости от требований к синхронности.

Хотите освоить продвинутые возможности React, включая хуки жизненного цикла и оптимизацию производительности? Записывайтесь на [наш курс по React](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useInsertionEffect) и практикуйтесь на реальных проектах вместе с опытными разработчиками.
