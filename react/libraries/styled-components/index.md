---
metaTitle: Styled Components — стилизация React-компонентов через JavaScript
metaDescription: Полное руководство по Styled Components — библиотеке CSS-in-JS для React. Создание стилизованных компонентов, динамические стили, темизация, производительность и лучшие практики
author: Олег Марков
title: Styled Components — стилизация через JS
preview: Узнайте, как использовать Styled Components для написания CSS прямо в JavaScript — от базового синтаксиса до продвинутых паттернов с темами и динамическими стилями
---

## Введение

Когда приложение на React растёт, управление стилями становится нетривиальной задачей. Обычный CSS страдает от глобальной области видимости — классы из разных файлов могут конфликтовать. CSS-модули решают эту проблему, но требуют отдельных файлов. Styled Components предлагает другой подход: писать CSS прямо внутри JavaScript, создавая полностью инкапсулированные стилизованные компоненты.

**Styled Components** — это библиотека CSS-in-JS, которая использует теговые шаблонные строки (tagged template literals) для определения стилей. Каждый стилизованный компонент получает уникальный класс, что гарантирует изоляцию стилей. Библиотека тесно интегрирована с React и поддерживает SSR, темизацию, динамические стили и автоматический критический CSS.

В этой статье вы изучите всё необходимое для работы со Styled Components: от установки и базового синтаксиса до продвинутых паттернов.

## Установка и базовая настройка

Начнём с установки библиотеки в React-проект:

```bash
npm install styled-components
# Для TypeScript — типы включены в пакет начиная с v6
# Для v5 и ниже нужны отдельные типы:
npm install --save-dev @types/styled-components
```

Если вы используете Babel, добавьте плагин для удобной отладки:

```bash
npm install --save-dev babel-plugin-styled-components
```

```json
// .babelrc
{
  "plugins": ["babel-plugin-styled-components"]
}
```

Этот плагин добавляет понятные имена классов в режиме разработки и улучшает поддержку SSR.

## Создание первого стилизованного компонента

Основной синтаксис Styled Components — это тегированные шаблонные строки. Вы вызываете `styled.element` и передаёте CSS в обратных кавычках:

```jsx
import styled from 'styled-components';

// Создаём стилизованный компонент на основе HTML-элемента
const Button = styled.button`
  background-color: #6c63ff;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #5a52d5;
  }

  &:active {
    transform: scale(0.98);
  }
`;

// Используем как обычный React-компонент
function App() {
  return <Button onClick={() => console.log('clicked')}>Нажми меня</Button>;
}
```

Обратите внимание: синтаксис CSS внутри шаблонной строки полностью стандартный, включая псевдоклассы (`&:hover`), псевдоэлементы (`&::before`) и вложенные селекторы.

## Динамические стили через пропсы

Главное преимущество Styled Components — доступ к пропсам React внутри стилей. Это позволяет создавать по-настоящему динамические компоненты:

```jsx
const Button = styled.button`
  background-color: ${props => props.primary ? '#6c63ff' : 'white'};
  color: ${props => props.primary ? 'white' : '#6c63ff'};
  border: 2px solid #6c63ff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
`;

// Использование
function App() {
  return (
    <div>
      <Button primary>Основная кнопка</Button>
      <Button>Вторичная кнопка</Button>
    </div>
  );
}
```

Для TypeScript нужно указать тип пропсов:

```tsx
interface ButtonProps {
  primary?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Button = styled.button<ButtonProps>`
  background-color: ${props => props.primary ? '#6c63ff' : 'white'};
  color: ${props => props.primary ? 'white' : '#6c63ff'};
  padding: ${props => {
    switch (props.size) {
      case 'small': return '6px 12px';
      case 'large': return '18px 36px';
      default: return '12px 24px';
    }
  }};
  font-size: ${props => props.size === 'small' ? '14px' : props.size === 'large' ? '18px' : '16px'};
  border: 2px solid #6c63ff;
  border-radius: 8px;
  cursor: pointer;
`;
```

## Наследование и расширение стилей

Styled Components позволяет расширять существующие компоненты, добавляя или переопределяя стили:

```jsx
const BaseButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  border: none;
`;

// Наследуем от BaseButton и добавляем свои стили
const PrimaryButton = styled(BaseButton)`
  background-color: #6c63ff;
  color: white;
`;

const DangerButton = styled(BaseButton)`
  background-color: #e53e3e;
  color: white;
`;

const OutlineButton = styled(BaseButton)`
  background-color: transparent;
  border: 2px solid #6c63ff;
  color: #6c63ff;
`;
```

Расширение работает не только с компонентами Styled Components, но и с любыми React-компонентами, которые принимают `className`:

```jsx
// Расширяем сторонний компонент
import { Link } from 'react-router-dom';

const StyledLink = styled(Link)`
  color: #6c63ff;
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;
```

## Атрибуты по умолчанию

Метод `.attrs()` позволяет задать атрибуты по умолчанию для компонента:

```jsx
const Input = styled.input.attrs(props => ({
  type: props.type || 'text',
  placeholder: props.placeholder || 'Введите значение...',
}))`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 16px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #6c63ff;
    box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1);
  }
`;

// Использование — не нужно указывать type="text"
<Input placeholder="Имя пользователя" />
<Input type="email" placeholder="Email" />
```

## Глобальные стили

Для глобальных стилей используется `createGlobalStyle`:

```jsx
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f7f8fc;
    color: #2d3748;
    line-height: 1.6;
  }

  a {
    color: inherit;
  }
`;

// Добавляем в корень приложения
function App() {
  return (
    <>
      <GlobalStyle />
      <Router>
        <Layout />
      </Router>
    </>
  );
}
```

## Темизация с ThemeProvider

Один из мощнейших инструментов Styled Components — система тем через `ThemeProvider`. Она позволяет централизованно управлять цветами, шрифтами и другими переменными дизайна:

```jsx
import { ThemeProvider } from 'styled-components';

// Определяем тему
const lightTheme = {
  colors: {
    primary: '#6c63ff',
    secondary: '#48bb78',
    background: '#ffffff',
    surface: '#f7f8fc',
    text: '#2d3748',
    textSecondary: '#718096',
    border: '#e2e8f0',
    error: '#e53e3e',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: '"Inter", sans-serif',
    mono: '"Fira Code", monospace',
  },
  fontSizes: {
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '24px',
    xxl: '32px',
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
    full: '9999px',
  },
};

const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#1a202c',
    surface: '#2d3748',
    text: '#f7fafc',
    textSecondary: '#a0aec0',
    border: '#4a5568',
  },
};

// Оборачиваем приложение в ThemeProvider
function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Layout />
    </ThemeProvider>
  );
}
```

Доступ к теме в компонентах:

```jsx
const Card = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text};
  font-family: ${props => props.theme.fonts.heading};
  font-size: ${props => props.theme.fontSizes.xl};
  margin-bottom: ${props => props.theme.spacing.md};
`;
```

Для TypeScript определите тип темы:

```tsx
// types/styled.d.ts
import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      error: string;
    };
    fonts: {
      body: string;
      heading: string;
      mono: string;
    };
    fontSizes: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      full: string;
    };
  }
}
```

## Анимации

Для анимаций используйте хелпер `keyframes`:

```jsx
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const Modal = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;
```

## Использование хука useTheme

Если вам нужен доступ к теме внутри компонента (не в стилях), используйте хук `useTheme`:

```jsx
import { useTheme } from 'styled-components';

function Chart() {
  const theme = useTheme();

  // Используем значения темы для библиотеки графиков
  const chartColors = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.error,
  ];

  return <LineChart colors={chartColors} data={data} />;
}
```

## SSR с Next.js

Для корректной работы Styled Components в Next.js нужна дополнительная настройка:

```javascript
// next.config.js
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
};

module.exports = nextConfig;
```

Это включает встроенную поддержку Styled Components в SWC компиляторе Next.js, обеспечивая корректный SSR без дополнительных пакетов.

## Производительность

Styled Components версии 6 значительно улучшила производительность по сравнению с предыдущими версиями. Тем не менее, соблюдайте эти практики:

**Выносите стилизованные компоненты за пределы рендер-функции:**

```jsx
// ❌ Плохо — компонент пересоздаётся на каждый рендер
function UserCard({ user }) {
  const Card = styled.div`
    padding: 16px;
    border-radius: 8px;
  `;
  
  return <Card>{user.name}</Card>;
}

// ✅ Хорошо — компонент создаётся один раз
const Card = styled.div`
  padding: 16px;
  border-radius: 8px;
`;

function UserCard({ user }) {
  return <Card>{user.name}</Card>;
}
```

**Используйте `shouldForwardProp` для предотвращения передачи кастомных пропсов в DOM:**

```jsx
const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['primary', 'size', 'variant'].includes(prop),
})<ButtonProps>`
  /* стили */
`;
```

## Итоги

Styled Components — зрелая и мощная библиотека для стилизации React-компонентов. Она предлагает:
- Полную изоляцию стилей без риска конфликтов классов
- Динамические стили через пропсы React
- Мощную систему тем для поддержки светлой/тёмной темы
- Отличную интеграцию с TypeScript
- Поддержку SSR в Next.js

Главный компромисс — небольшой overhead в runtime по сравнению с нулевым-runtime решениями (vanilla-extract, Linaria). Для большинства проектов это несущественно, но для высоконагруженных приложений стоит рассмотреть альтернативы.
