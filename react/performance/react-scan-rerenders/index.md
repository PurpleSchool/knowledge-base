---
metaTitle: "React Scan: анализ и визуализация ре-рендеров"
metaDescription: "Как использовать React Scan для поиска лишних ре-рендеров в React-приложении: установка, настройка, интерпретация результатов и оптимизация."
author: "Антон Ларичев"
title: "React Scan: анализ и визуализация ре-рендеров"
preview: "Инструмент React Scan визуализирует ре-рендеры компонентов прямо в браузере. Узнайте, как его подключить и использовать для поиска узких мест производительности."
---

## Что такое React Scan

React Scan — это библиотека с открытым исходным кодом, которая выделяет компоненты, перерисовывающиеся в реальном времени, и показывает, почему они это делают. В отличие от React DevTools Profiler, которому нужна ручная запись сессии, React Scan работает непрерывно: каждый ре-рендер немедленно подсвечивается рамкой прямо поверх DOM-элемента.

Инструмент решает конкретную проблему: в средних и крупных приложениях сложно понять, какой компонент рендерится лишний раз и из-за какого пропса или стейта. React Scan делает эту информацию визуально очевидной без необходимости расставлять `console.log` или открывать DevTools.

## Установка

Библиотека устанавливается как обычная npm-зависимость:

```bash
npm install react-scan
```

Так как это инструмент разработки, его стоит добавить в `devDependencies`:

```bash
npm install --save-dev react-scan
```

Альтернативный вариант — подключить через CDN напрямую в HTML, что удобно для быстрой проверки на существующем проекте:

```html
<script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>
```

Скрипт должен идти **до** любых скриптов React, иначе перехват рендеров не сработает.

## Базовое подключение

Для проекта на Vite или Create React App достаточно одной строки в точке входа приложения:

```typescript
// main.tsx
import { scan } from 'react-scan';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

scan({
  enabled: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

После запуска приложения в браузере компоненты, которые ре-рендерятся, будут подсвечиваться цветной рамкой. По умолчанию используется зелёный цвет, яркость которого увеличивается с частотой рендеров.

## Подключение в Next.js

Для Next.js App Router подключение немного отличается, так как нужно убедиться, что код выполняется только на клиенте:

```typescript
// app/layout.tsx
import { ReactScan } from 'react-scan/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <ReactScan options={{ enabled: true }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Компонент `ReactScan` из пакета `react-scan/next` автоматически вставляет скрипт с правильными настройками гидратации.

Для Pages Router используется `_document.tsx`:

```typescript
// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ru">
      <Head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

## Опции конфигурации

Функция `scan` принимает объект с настройками:

```typescript
import { scan } from 'react-scan';

scan({
  // Включить/выключить сканирование
  enabled: process.env.NODE_ENV === 'development',

  // Показывать логи о ре-рендерах в консоли
  log: false,

  // Показывать оверлей с тулбаром поверх страницы
  showToolbar: true,

  // Анимировать подсветку (false = мгновенное появление)
  animationSpeed: 'fast',

  // Callback, вызываемый при каждом ре-рендере
  onCommitStart: () => {},

  // Callback с информацией о рендере конкретного компонента
  onRender: (fiber, renders) => {
    console.log('Component rendered:', fiber.type?.name, renders);
  },
});
```

Параметр `enabled: process.env.NODE_ENV === 'development'` гарантирует, что инструмент не попадёт в продакшн-сборку.

## Как читать подсветку

Когда компонент ре-рендерится, React Scan рисует рамку вокруг его DOM-узла. Цвет и интенсивность рамки несут смысловую нагрузку:

- Одиночная вспышка зелёной рамки — нормальный ожидаемый рендер
- Быстрое мигание — компонент рендерится слишком часто
- Красная подсветка — компонент рендерится более 10 раз подряд за короткий промежуток времени

Оверлей с тулбаром в углу экрана показывает общее количество ре-рендеров за сессию и список самых «горячих» компонентов.

## Получение детальной информации

Callback `onRender` позволяет логировать подробности о каждом ре-рендере:

```typescript
import { scan } from 'react-scan';

scan({
  enabled: true,
  onRender: (fiber, renders) => {
    const name = fiber.type?.displayName ?? fiber.type?.name ?? 'Unknown';

    renders.forEach((render) => {
      if (render.unnecessary) {
        console.warn(
          `[ReactScan] Лишний ре-рендер: ${name}`,
          'Изменившиеся пропсы:',
          render.changes
        );
      }
    });
  },
});
```

Объект `render` содержит:
- `type` — тип рендера (`update`, `initial`, `unmount`)
- `count` — количество рендеров подряд
- `changes` — массив изменившихся пропсов или стейта
- `unnecessary` — флаг, указывающий, что рендер произошёл без реальных изменений данных

## Типичные причины лишних ре-рендеров

### Новые объекты и массивы в пропсах

Самая частая причина — передача объектных литералов или функций прямо в JSX:

```typescript
// Плохо: новый объект при каждом рендере родителя
function Parent() {
  return <Child style={{ color: 'red' }} />;
}

// Хорошо: константа объявлена вне компонента
const childStyle = { color: 'red' };

function Parent() {
  return <Child style={childStyle} />;
}
```

Если объект зависит от пропсов или стейта, используйте `useMemo`:

```typescript
function Parent({ theme }: { theme: string }) {
  const style = useMemo(
    () => ({ color: theme === 'dark' ? 'white' : 'black' }),
    [theme]
  );

  return <Child style={style} />;
}
```

### Нестабильные колбэки

Функции, создаваемые при каждом рендере, нарушают мемоизацию дочерних компонентов:

```typescript
// Плохо: новая функция при каждом рендере родителя
function Parent() {
  const handleClick = () => {
    console.log('click');
  };

  return <Child onClick={handleClick} />;
}

// Хорошо: стабильная ссылка
function Parent() {
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);

  return <Child onClick={handleClick} />;
}
```

### Пропущенный React.memo

Без мемоизации дочерний компонент рендерится при каждом ре-рендере родителя, даже если его пропсы не изменились:

```typescript
// Без мемоизации компонент рендерится вместе с родителем
function ExpensiveList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// С мемоизацией рендер происходит только при изменении items
const ExpensiveList = React.memo(function ExpensiveList({
  items,
}: {
  items: string[];
}) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
});
```

### Контекст с широким охватом

Каждый потребитель контекста перерисовывается при любом изменении значения контекста. Если объект контекста пересоздаётся, это затрагивает всё дерево:

```typescript
// Плохо: новый объект при каждом рендере провайдера
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Хорошо: мемоизированное значение контекста
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light');

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## Интеграция в рабочий процесс

React Scan удобнее всего использовать в паре с браузерными DevTools. Рекомендуемый сценарий:

1. Открыть страницу с подключённым React Scan
2. Выполнить действие, которое ощущается медленным (прокрутка, ввод текста, открытие модального окна)
3. Найти компоненты с быстрым миганием или красной подсветкой
4. Навести курсор на компонент — тулбар покажет имя компонента и количество рендеров
5. Использовать `onRender` callback для детального логирования изменившихся пропсов
6. Применить мемоизацию или рефакторинг и убедиться, что мигание прекратилось

## Программное управление

React Scan предоставляет API для динамического включения и выключения:

```typescript
import { scan, getReport } from 'react-scan';

// Включить сканирование
scan({ enabled: true });

// Получить статистику после тестирования
const report = getReport();
console.log('Компоненты с наибольшим числом рендеров:');

Object.entries(report)
  .sort(([, a], [, b]) => b.count - a.count)
  .slice(0, 10)
  .forEach(([name, stats]) => {
    console.log(`${name}: ${stats.count} рендеров`);
  });
```

Функция `getReport` возвращает объект, где ключ — имя компонента, а значение содержит количество рендеров и время. Это полезно для автоматизированных проверок в тестах производительности.

## Использование в тестах

React Scan можно встроить в playwright или cypress для автоматической проверки производительности:

```typescript
// performance.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test('главная страница не имеет лишних ре-рендеров', async ({ page }) => {
  await page.goto('/');

  // Имитация пользовательского взаимодействия
  await page.fill('[data-testid="search-input"]', 'react');
  await page.waitForTimeout(500);

  // Получение отчёта через window
  const report = await page.evaluate(() => {
    return (window as any).__REACT_SCAN_REPORT__;
  });

  const unnecessaryRenders = Object.entries(report ?? {}).filter(
    ([, stats]: any) => stats.unnecessary > 5
  );

  expect(unnecessaryRenders).toHaveLength(0);
});
```

## Сравнение с альтернативами

React Scan занимает свою нишу среди инструментов профилирования React:

- **React DevTools Profiler** — мощный инструмент для детального анализа, но требует ручной записи и не даёт мгновенной визуальной обратной связи
- **why-did-you-render** — библиотека, которая логирует лишние ре-рендеры в консоль, но не визуализирует их на странице
- **React Scan** — работает непрерывно в фоне, не требует дополнительных настроек для каждого компонента, визуализирует ре-рендеры прямо в интерфейсе

Оптимальный подход — использовать React Scan для быстрого обнаружения проблемных компонентов, а затем Profiler для глубокого анализа конкретных узких мест.

## Безопасное отключение в продакшне

Важно убедиться, что React Scan не попадает в продакшн-сборку. Несколько способов это гарантировать:

```typescript
// Вариант 1: проверка переменной окружения
import { scan } from 'react-scan';

if (process.env.NODE_ENV === 'development') {
  scan({ enabled: true });
}
```

```typescript
// Вариант 2: динамический импорт
if (process.env.NODE_ENV === 'development') {
  import('react-scan').then(({ scan }) => {
    scan({ enabled: true });
  });
}
```

Второй вариант исключает код библиотеки из продакшн-бандла полностью благодаря tree-shaking.

## Итог

React Scan упрощает поиск проблем производительности, делая ре-рендеры видимыми без необходимости открывать DevTools и вручную записывать профайл. Инструмент особенно полезен на этапе разработки новых фич — подключив его один раз, можно сразу замечать компоненты, которые рендерятся подозрительно часто, и устранять проблему до того, как она попадёт в продакшн.

Практика мемоизации через `React.memo`, `useMemo` и `useCallback` в сочетании с визуальной обратной связью от React Scan позволяет поддерживать приложение отзывчивым даже по мере роста числа компонентов.

Чтобы глубже разобраться с оптимизацией React-приложений и другими техниками производительности, изучите курс [React — с нуля до профессионала](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-scan-rerenders) на PurpleSchool.