---
metaTitle: Темизация в React — реализация светлой и тёмной темы
metaDescription: Полное руководство по темизации React-приложений. Контекст, CSS переменные, Styled Components ThemeProvider, хранение темы и переключение между светлой и тёмной темой
author: Олег Марков
title: Темизация в React
preview: Узнайте, как реализовать полноценную систему тем в React-приложении — от простого переключателя тёмного режима до многотемной дизайн-системы с CSS переменными
---

## Введение

Темизация — это способность приложения менять свой визуальный стиль централизованно, без изменения каждого компонента по отдельности. Самый известный пример — тёмный режим (dark mode), но темизация может включать и брендовые темы, тему для слабовидящих, сезонные темы и т.д.

В этой статье мы рассмотрим несколько подходов к темизации в React: от простого CSS-переменных решения до полноценных систем с TypeScript и централизованным управлением.

## Подход 1: CSS Custom Properties (рекомендуемый)

Самый производительный и гибкий подход — CSS Custom Properties (переменные). Смена темы не требует перерендера React-компонентов.

### Определение переменных

```css
/* globals.css */
:root {
  /* Светлая тема (по умолчанию) */
  --color-background: #ffffff;
  --color-surface: #f7f8fc;
  --color-text-primary: #1a202c;
  --color-text-secondary: #718096;
  --color-border: #e2e8f0;
  
  --color-primary: #6c63ff;
  --color-primary-hover: #5a52d5;
  --color-primary-light: #f5f3ff;
  
  --color-success: #48bb78;
  --color-warning: #ed8936;
  --color-error: #e53e3e;
  
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.15);
  
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
}

/* Тёмная тема */
[data-theme="dark"] {
  --color-background: #1a202c;
  --color-surface: #2d3748;
  --color-text-primary: #f7fafc;
  --color-text-secondary: #a0aec0;
  --color-border: #4a5568;
  
  --color-primary: #8b85ff;
  --color-primary-hover: #7a74ee;
  --color-primary-light: #2d2a4a;
  
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.5);
}
```

### Хук для управления темой

```tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Читаем сохранённую тему из localStorage
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const resolve = () => {
      if (theme === 'system') {
        return mediaQuery.matches ? 'dark' : 'light';
      }
      return theme as 'light' | 'dark';
    };

    const applyTheme = () => {
      const resolved = resolve();
      setResolvedTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    };

    applyTheme();

    // Слушаем изменения системной темы
    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Переключатель темы

```tsx
import { useTheme } from '@/hooks/useTheme';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => setTheme('light')}
        style={{
          padding: '8px',
          borderRadius: '6px',
          border: 'none',
          background: theme === 'light' ? 'var(--color-primary)' : 'transparent',
          color: theme === 'light' ? 'white' : 'var(--color-text-primary)',
          cursor: 'pointer',
        }}
        title="Светлая тема"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('dark')}
        style={{
          padding: '8px',
          borderRadius: '6px',
          border: 'none',
          background: theme === 'dark' ? 'var(--color-primary)' : 'transparent',
          color: theme === 'dark' ? 'white' : 'var(--color-text-primary)',
          cursor: 'pointer',
        }}
        title="Тёмная тема"
      >
        🌙
      </button>
      <button
        onClick={() => setTheme('system')}
        style={{
          padding: '8px',
          borderRadius: '6px',
          border: 'none',
          background: theme === 'system' ? 'var(--color-primary)' : 'transparent',
          color: theme === 'system' ? 'white' : 'var(--color-text-primary)',
          cursor: 'pointer',
        }}
        title="Системная тема"
      >
        💻
      </button>
    </div>
  );
}
```

### Компоненты, использующие переменные

```css
/* components.css */
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.button-primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  font-size: var(--font-size-md);
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
}

.text-primary {
  color: var(--color-text-primary);
}

.text-secondary {
  color: var(--color-text-secondary);
}
```

## Подход 2: ThemeProvider из styled-components / Emotion

Если вы используете CSS-in-JS, ThemeProvider — нативный способ темизации:

```tsx
import { ThemeProvider, DefaultTheme } from 'styled-components';

const lightTheme: DefaultTheme = {
  mode: 'light',
  colors: {
    background: '#ffffff',
    surface: '#f7f8fc',
    text: {
      primary: '#1a202c',
      secondary: '#718096',
    },
    primary: {
      main: '#6c63ff',
      hover: '#5a52d5',
      light: '#f5f3ff',
      contrastText: '#ffffff',
    },
    border: '#e2e8f0',
    status: {
      success: '#48bb78',
      warning: '#ed8936',
      error: '#e53e3e',
      info: '#4299e1',
    },
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.05)',
    md: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
  },
};

const darkTheme: DefaultTheme = {
  mode: 'dark',
  colors: {
    background: '#1a202c',
    surface: '#2d3748',
    text: {
      primary: '#f7fafc',
      secondary: '#a0aec0',
    },
    primary: {
      main: '#8b85ff',
      hover: '#7a74ee',
      light: '#2d2a4a',
      contrastText: '#ffffff',
    },
    border: '#4a5568',
    status: lightTheme.colors.status,
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
};

function App() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  );
}
```

Компоненты используют тему через `props.theme`:

```tsx
import styled from 'styled-components';

const Card = styled.div`
  background-color: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.lg};
  padding: ${p => p.theme.spacing.lg};
  box-shadow: ${p => p.theme.shadows.sm};
  transition: box-shadow 0.2s, background-color 0.3s;

  &:hover {
    box-shadow: ${p => p.theme.shadows.md};
  }
`;

const Button = styled.button`
  background-color: ${p => p.theme.colors.primary.main};
  color: ${p => p.theme.colors.primary.contrastText};
  border: none;
  border-radius: ${p => p.theme.borderRadius.md};
  padding: ${p => p.theme.spacing.sm} ${p => p.theme.spacing.md};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${p => p.theme.colors.primary.hover};
  }
`;
```

## Предотвращение мерцания при SSR

При серверном рендеринге (Next.js) может возникать мерцание (flash of unstyled content) при первой загрузке. Решение — инлайновый скрипт в `<head>`:

```tsx
// app/layout.tsx (Next.js App Router)
export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        {/* Этот скрипт выполняется до парсинга HTML, предотвращая мерцание */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var resolved = theme === 'dark' || (!theme && systemDark) || (theme === 'system' && systemDark)
                    ? 'dark'
                    : 'light';
                  document.documentElement.setAttribute('data-theme', resolved);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Многотемная система

Для продвинутых требований — несколько тем с возможностью выбора:

```tsx
const themes = {
  light: { /* ... */ },
  dark: { /* ... */ },
  ocean: {
    mode: 'dark' as const,
    colors: {
      background: '#0d1b2a',
      surface: '#1b2a3b',
      text: { primary: '#e0f0ff', secondary: '#93b9d4' },
      primary: { main: '#00b4d8', hover: '#0096b7', light: '#0d2d3d', contrastText: '#fff' },
      border: '#1e3a4f',
      status: lightTheme.colors.status,
    },
    // ...
  },
  forest: {
    mode: 'dark' as const,
    colors: {
      background: '#0f1a10',
      surface: '#1a2b1b',
      text: { primary: '#e0ffe0', secondary: '#90b890' },
      primary: { main: '#4caf50', hover: '#43a047', light: '#1a2d1a', contrastText: '#fff' },
      border: '#1e3b1f',
      status: lightTheme.colors.status,
    },
    // ...
  },
};

type ThemeName = keyof typeof themes;

function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('light');

  const themeLabels: Record<ThemeName, string> = {
    light: '☀️ Светлая',
    dark: '🌙 Тёмная',
    ocean: '🌊 Океан',
    forest: '🌿 Лес',
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {(Object.keys(themes) as ThemeName[]).map(name => (
        <button
          key={name}
          onClick={() => setCurrentTheme(name)}
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            border: currentTheme === name ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: currentTheme === name ? 'var(--color-primary-light)' : 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {themeLabels[name]}
        </button>
      ))}
    </div>
  );
}
```

## Тема в Tailwind CSS

Для Tailwind темизация реализуется через `class` стратегию:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Семантические цвета через CSS переменные
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        primary: 'var(--color-primary)',
      },
    },
  },
};
```

```jsx
// Tailwind автоматически применяет dark: классы
function Card({ children }) {
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl p-6 shadow-sm dark:shadow-gray-900/30">
      {children}
    </div>
  );
}
```

## Итоги

Система тем в React — важная часть современного UI. Выбор подхода зависит от стека:

| Подход | Когда использовать |
|-------|--------------------|
| CSS Custom Properties | Любой проект, нет привязки к библиотеке |
| Styled Components ThemeProvider | Проекты с Styled Components |
| Emotion ThemeProvider | Проекты с Emotion/MUI |
| Tailwind dark: классы | Проекты с Tailwind |

Независимо от подхода, ключевые принципы одинаковы:
- Храните тему в localStorage и синхронизируйте с системными настройками
- Предотвращайте мерцание через инлайновый скрипт в `<head>`
- Используйте семантические имена (`--color-background`, не `--color-white`)
- Поддерживайте `prefers-color-scheme` для автоматического выбора темы
