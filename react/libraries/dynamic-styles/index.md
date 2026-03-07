---
metaTitle: Динамические стили в React — полное руководство
metaDescription: Все способы создания динамических стилей в React: inline styles, CSS переменные, CSS-in-JS, условные классы, анимации на основе состояния и лучшие практики
author: Олег Марков
title: Динамические стили в React
preview: Изучите все подходы к динамической стилизации в React — от простых inline styles до мощных CSS-in-JS паттернов с анимациями и адаптивным дизайном
---

## Введение

Динамические стили — это стили, которые меняются в зависимости от состояния приложения, действий пользователя или данных. В React для этого существует несколько подходов, каждый со своими сценариями применения.

В этой статье вы изучите все инструменты для создания динамических стилей: от простейших inline styles до мощных CSS-in-JS решений с анимациями.

## Inline Styles

Самый базовый способ — объект стилей в `style` проп:

```jsx
function ProgressBar({ value, max = 100 }) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', height: '8px' }}>
      <div
        style={{
          width: `${percentage}%`,
          backgroundColor: percentage > 80 ? '#48bb78' : percentage > 50 ? '#ed8936' : '#e53e3e',
          height: '100%',
          borderRadius: '4px',
          transition: 'width 0.3s ease, background-color 0.3s ease',
        }}
      />
    </div>
  );
}
```

**Когда использовать inline styles:**
- Для стилей, зависящих от вычисляемых значений (ширина, высота, координаты)
- Когда нужно передать значение из JavaScript (цвет из API, позиция мыши)
- Для единичных динамических свойств

**Ограничения inline styles:**
- Не поддерживают псевдоклассы (`:hover`, `:focus`)
- Не поддерживают медиа-запросы
- Медленнее статических классов при частых перерендерах
- Плохо работают с анимациями (кроме `transition`)

## CSS Custom Properties (переменные)

CSS переменные — отличный способ передавать динамические значения из JavaScript в CSS без inline styles:

```jsx
function ThemeableCard({ accentColor, children }) {
  return (
    <div
      className="card"
      style={{ '--accent-color': accentColor }}
    >
      {children}
    </div>
  );
}
```

```css
/* styles.css */
.card {
  --accent-color: #6c63ff; /* Значение по умолчанию */
  
  border-radius: 12px;
  padding: 24px;
  border-left: 4px solid var(--accent-color);
  background: white;
}

.card h3 {
  color: var(--accent-color);
}

.card button {
  background-color: var(--accent-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
}

/* Псевдоклассы работают нормально */
.card button:hover {
  opacity: 0.9;
}
```

Это особенно мощно для анимаций — CSS может анимировать переменные нативно:

```jsx
function AnimatedProgress({ value }) {
  return (
    <div
      className="progress-container"
      style={{ '--progress': `${value}%` }}
    >
      <div className="progress-bar" />
    </div>
  );
}
```

```css
.progress-container {
  --progress: 0%;
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: var(--progress);
  background: #6c63ff;
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Условные классы

Самый распространённый подход — динамическое формирование `className`:

### Простое условие

```jsx
function Button({ isActive, children }) {
  return (
    <button className={`btn ${isActive ? 'btn--active' : 'btn--inactive'}`}>
      {children}
    </button>
  );
}
```

### Библиотека clsx

```bash
npm install clsx
```

```jsx
import clsx from 'clsx';

function NavItem({ isActive, hasNotification, disabled, children }) {
  return (
    <li
      className={clsx(
        'nav-item',
        isActive && 'nav-item--active',
        hasNotification && 'nav-item--notification',
        disabled && 'nav-item--disabled',
      )}
    >
      {children}
    </li>
  );
}
```

### Динамические стили в CSS-in-JS

```jsx
import styled from 'styled-components';

// Динамика через пропсы
const Card = styled.div`
  background: ${props => props.selected ? '#f0edff' : 'white'};
  border: 2px solid ${props => props.selected ? '#6c63ff' : '#e2e8f0'};
  transform: ${props => props.selected ? 'scale(1.02)' : 'scale(1)'};
  box-shadow: ${props => props.selected
    ? '0 8px 24px rgba(108, 99, 255, 0.15)'
    : '0 2px 8px rgba(0, 0, 0, 0.05)'
  };
  transition: all 0.2s ease;
  cursor: pointer;
  border-radius: 12px;
  padding: 24px;
`;

function SelectableCard({ id, selected, onSelect, children }) {
  return (
    <Card selected={selected} onClick={() => onSelect(id)}>
      {children}
    </Card>
  );
}
```

## Динамические стили на основе данных

Часто стили определяются данными из API или пользовательского ввода:

```jsx
function TaskPriority({ priority }) {
  // Маппинг данных → стили
  const priorityConfig = {
    critical: { color: '#e53e3e', bg: '#fff5f5', label: 'Критический' },
    high: { color: '#ed8936', bg: '#fffaf0', label: 'Высокий' },
    medium: { color: '#6c63ff', bg: '#f5f3ff', label: 'Средний' },
    low: { color: '#48bb78', bg: '#f0fff4', label: 'Низкий' },
  };
  
  const config = priorityConfig[priority] || priorityConfig.low;
  
  return (
    <span
      style={{
        color: config.color,
        backgroundColor: config.bg,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {config.label}
    </span>
  );
}
```

## Анимации через состояние

### CSS Transitions

Простейший способ анимировать изменение состояния:

```jsx
function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);
  
  return (
    <div className="accordion">
      <button
        className="accordion__header"
        onClick={() => setIsOpen(prev => !prev)}
      >
        {title}
        <span
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>
      
      <div
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
        ref={contentRef}
      >
        <div className="accordion__content">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### Анимация с keyframes в Styled Components

```jsx
import styled, { keyframes, css } from 'styled-components';

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-16px);
  }
`;

const Notification = styled.div`
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  animation: ${props => props.isVisible
    ? css`${slideIn} 0.3s ease forwards`
    : css`${slideOut} 0.3s ease forwards`
  };
`;

function Toast({ message, isVisible }) {
  return (
    <Notification isVisible={isVisible}>
      {message}
    </Notification>
  );
}
```

## Динамические CSS переменные для тем

Самый производительный способ динамической темизации — CSS Custom Properties на корневом элементе:

```jsx
function ThemeProvider({ theme, children }) {
  useEffect(() => {
    const root = document.documentElement;
    
    // Устанавливаем CSS переменные
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
  }, [theme]);
  
  return <div className="theme-root">{children}</div>;
}

// themes/light.js
export const lightTheme = {
  colors: {
    primary: '#6c63ff',
    background: '#ffffff',
    text: '#2d3748',
    border: '#e2e8f0',
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
};

// themes/dark.js
export const darkTheme = {
  colors: {
    primary: '#8b85ff',
    background: '#1a202c',
    text: '#f7fafc',
    border: '#4a5568',
  },
  spacing: lightTheme.spacing,
};
```

```css
/* styles.css — использует переменные */
.card {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: var(--spacing-md);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}
```

Преимущество: смена темы — это одно присваивание CSS переменной, никакого JavaScript перерендера компонентов.

## Динамические стили с useRef для сложных анимаций

Для плавных анимаций, которые нельзя сделать через CSS transition, используйте Web Animations API или requestAnimationFrame:

```jsx
function AnimatedCounter({ value, duration = 1000 }) {
  const countRef = useRef(null);
  const prevValueRef = useRef(0);
  
  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing функция
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      
      if (countRef.current) {
        countRef.current.textContent = current.toLocaleString('ru-RU');
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = value;
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return (
    <span
      ref={countRef}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    />
  );
}
```

## Лучшие практики

**1. Не создавайте объект стилей при каждом рендере:**

```jsx
// ❌ Плохо — новый объект при каждом рендере
function Component({ color }) {
  return <div style={{ color: color, padding: '16px' }}>...</div>;
}

// ✅ Хорошо — вычисляйте только изменяемые свойства
function Component({ color }) {
  return (
    <div className="static-class" style={{ color }}>...</div>
  );
}
```

**2. Предпочитайте CSS классы inline стилям:**

```jsx
// ❌ Избегайте
<button style={{ backgroundColor: 'red', color: 'white', padding: '12px 24px' }}>

// ✅ Лучше
<button className="btn btn-danger">
```

**3. Используйте CSS переменные для анимируемых значений:**

```jsx
// CSS transition работает плавно через переменные
<div style={{ '--opacity': isVisible ? 1 : 0 }} className="fade-element" />
```

**4. Мемоизируйте сложные вычисления стилей:**

```jsx
function ComplexComponent({ data }) {
  const styles = useMemo(() => computeComplexStyles(data), [data]);
  return <div style={styles}>...</div>;
}
```

## Итоги

Выбор подхода к динамическим стилям зависит от задачи:

- **Inline styles** — для значений, вычисляемых в JS (координаты, проценты)
- **CSS переменные** — для тем и анимируемых значений (производительнее всего)
- **Условные классы (clsx)** — для состояний компонента
- **CSS-in-JS** — для сложных зависимостей стилей от пропсов и логики компонента
- **requestAnimationFrame** — для точных JS-анимаций без CSS transition
