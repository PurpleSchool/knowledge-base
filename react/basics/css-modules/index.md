---
metaTitle: CSS Modules в React - локальные стили без конфликтов
metaDescription: Полное руководство по CSS Modules в React. Локальная область видимости стилей, композиция классов, динамические стили, TypeScript и интеграция с Create React App и Vite
author: Олег Марков
title: CSS Modules в React
preview: Узнайте, как использовать CSS Modules в React для создания изолированных стилей компонентов без конфликтов имён — с примерами, динамическими классами, TypeScript и лучшими практиками
---

# CSS Modules в React

## Введение

Одна из главных проблем CSS — глобальная область видимости. В большом проекте класс `.button` в одном файле может случайно переопределить `.button` в другом. Для решения этой проблемы существует несколько подходов: BEM, CSS-in-JS, Styled Components. Один из самых простых и эффективных — **CSS Modules**.

CSS Modules — это технология, которая автоматически генерирует уникальные имена классов, обеспечивая локальную область видимости стилей. Вы пишете обычный CSS, но используете его как JavaScript-объект — и ни один класс никогда не пересечётся с другим компонентом.

CSS Modules поддерживаются из коробки в Create React App, Vite, Next.js и большинстве современных инструментов сборки.

## Как это работает

Когда вы импортируете CSS-файл как модуль, система сборки:

1. Парсит CSS-файл
2. Генерирует уникальные имена классов (обычно в формате `ComponentName_className__hash`)
3. Возвращает JavaScript-объект, где ключи — ваши классы, значения — уникальные имена

```
// Ваш файл Button.module.css
.button { color: white; }

// После обработки в DOM
<button class="Button_button__3xK9m">...</button>
```

## Настройка

### Create React App

Поддержка CSS Modules встроена. Просто назовите файл `*.module.css`:

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.module.css  // ← .module.css
```

### Vite

Также поддерживается из коробки для файлов `*.module.css`:

```typescript
// vite.config.ts — никаких дополнительных настроек не нужно
```

### Next.js

Поддерживается для всех компонентов. Глобальные стили импортируются в `_app.tsx`, модульные — прямо в компонентах.

## Базовое использование

Создадим компонент Button с CSS Modules:

```css
/* Button.module.css */

.button {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary {
  background-color: #3b82f6;
  color: white;
}

.primary:hover {
  background-color: #2563eb;
}

.secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.secondary:hover {
  background-color: #e5e7eb;
}

.large {
  padding: 12px 24px;
  font-size: 16px;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

```tsx
/* Button.tsx */

import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      className={`
        ${styles.button}
        ${styles[variant]}
        ${size === 'large' ? styles.large : ''}
        ${disabled ? styles.disabled : ''}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// Использование
<Button variant="primary" size="large">Сохранить</Button>
<Button variant="secondary" disabled>Отмена</Button>
```

## Динамические классы

### Шаблонные строки

```tsx
import styles from './Card.module.css';

function Card({ active, highlighted, size }) {
  const className = `
    ${styles.card}
    ${active ? styles.active : ''}
    ${highlighted ? styles.highlighted : ''}
    ${styles[`size-${size}`]}
  `.trim().replace(/\s+/g, ' ');

  return <div className={className}>...</div>;
}
```

### Библиотека classnames/clsx

Для удобной работы с условными классами используйте `clsx` (или `classnames`):

```bash
npm install clsx
```

```tsx
import clsx from 'clsx';
import styles from './Button.module.css';

function Button({ variant, size, disabled, loading, children }) {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],           // Динамический класс из объекта
        size === 'large' && styles.large,     // Условный класс
        {
          [styles.disabled]: disabled,         // Объект условий
          [styles.loading]: loading,
        }
      )}
      disabled={disabled || loading}
    >
      {loading ? 'Загрузка...' : children}
    </button>
  );
}
```

## Состояния компонента

```css
/* Input.module.css */

.input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.inputError {
  border-color: #ef4444;
}

.inputError:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.inputSuccess {
  border-color: #22c55e;
}

.label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.errorMessage {
  margin-top: 4px;
  font-size: 12px;
  color: #ef4444;
}

.wrapper {
  margin-bottom: 16px;
}
```

```tsx
/* Input.tsx */

import clsx from 'clsx';
import styles from './Input.module.css';

interface InputProps {
  label?: string;
  error?: string;
  success?: boolean;
  value: string;
  onChange: (value: string) => void;
}

function Input({ label, error, success, value, onChange }: InputProps) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        className={clsx(styles.input, {
          [styles.inputError]: !!error,
          [styles.inputSuccess]: success && !error,
        })}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}
```

## Композиция стилей через `composes`

CSS Modules поддерживают `composes` — мощный механизм наследования стилей:

```css
/* shared.module.css */
.flex {
  display: flex;
}

.flexCenter {
  composes: flex;
  align-items: center;
  justify-content: center;
}

/* Card.module.css */
.card {
  composes: flexCenter from './shared.module.css';
  padding: 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Или внутри одного файла */
.baseButton {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.primaryButton {
  composes: baseButton;
  background: #3b82f6;
  color: white;
}

.dangerButton {
  composes: baseButton;
  background: #ef4444;
  color: white;
}
```

## Глобальные классы в CSS Modules

Иногда нужно применить глобальный класс (например, из сторонней библиотеки) вместе с локальными:

```css
/* Объявляем глобальный класс */
:global(.external-library-class) {
  color: red;
}

/* Используем глобальный класс внутри локального */
.wrapper :global(.tooltip) {
  background: black;
  color: white;
}

/* Переключиться обратно на локальный контекст */
:global(.global-class) :local(.localClass) {
  font-weight: bold;
}
```

```tsx
import styles from './Wrapper.module.css';
import 'external-library/styles.css'; // Глобальные стили библиотеки

function Wrapper({ children }) {
  return (
    <div className={styles.wrapper}>
      {/* external-library-class будет стилизован через :global */}
      <div className="external-library-class">{children}</div>
    </div>
  );
}
```

## TypeScript и CSS Modules

### Автоматическая типизация с css-modules-typescript-loader

```bash
npm install --save-dev typescript-plugin-css-modules
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [{ "name": "typescript-plugin-css-modules" }]
  }
}
```

### Ручное объявление типов

Если хотите простую типизацию без плагина:

```typescript
// src/types/css-modules.d.ts
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}
```

### Генерация точных типов с typed-css-modules

```bash
npm install --save-dev typed-css-modules
```

```bash
# Генерация .d.ts файлов для всех CSS модулей
npx tcm src --watch
```

Это создаст файлы `Button.module.css.d.ts` с точными типами:

```typescript
// Button.module.css.d.ts (сгенерировано автоматически)
declare const styles: {
  readonly button: string;
  readonly primary: string;
  readonly secondary: string;
  readonly large: string;
  readonly disabled: string;
};
export = styles;
```

## SCSS Modules

CSS Modules работают и с SCSS:

```scss
/* Card.module.scss */

$border-radius: 8px;
$shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

.card {
  border-radius: $border-radius;
  box-shadow: $shadow;
  overflow: hidden;

  &__header {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;

    h2 {
      margin: 0;
      font-size: 18px;
    }
  }

  &__body {
    padding: 20px;
  }

  &--highlighted {
    border: 2px solid #3b82f6;
  }
}
```

```tsx
import styles from './Card.module.scss';

function Card({ title, children, highlighted }) {
  return (
    <div className={clsx(styles.card, highlighted && styles['card--highlighted'])}>
      <div className={styles['card__header']}>
        <h2>{title}</h2>
      </div>
      <div className={styles['card__body']}>
        {children}
      </div>
    </div>
  );
}
```

## Реальный пример: компонент Modal

```css
/* Modal.module.css */

.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  animation: slideIn 0.2s ease;
}

.small { width: 400px; }
.medium { width: 560px; }
.large { width: 800px; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.closeButton {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  border-radius: 4px;
}

.closeButton:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.body {
  padding: 24px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: scale(0.95) translateY(-10px); }
  to { transform: scale(1) translateY(0); }
}
```

```tsx
/* Modal.tsx */

import { useEffect } from 'react';
import clsx from 'clsx';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function Modal({ isOpen, onClose, title, size = 'medium', children, footer }: ModalProps) {
  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={clsx(styles.modal, styles[size])}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>{title}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
```

## Сравнение подходов к стилизации в React

| Подход | Изоляция | Динамика | DX | Производительность |
|--------|----------|----------|----|--------------------|
| Обычный CSS | ❌ Нет | ❌ Сложно | ✅ Просто | ✅ Отличная |
| CSS Modules | ✅ Есть | ⚠️ Ограничена | ✅ Просто | ✅ Отличная |
| Styled Components | ✅ Есть | ✅ Легко | ✅ Хорошо | ⚠️ Runtime |
| Tailwind CSS | ⚠️ Частично | ✅ Легко | ✅ Хорошо | ✅ Отличная |
| CSS-in-JS (Emotion) | ✅ Есть | ✅ Легко | ✅ Хорошо | ⚠️ Runtime |

**CSS Modules — лучший выбор когда:**
- Хотите изоляцию без runtime-накладных расходов
- Команда привыкла к обычному CSS
- Нужна поддержка SCSS/LESS
- Важна производительность

## Заключение

CSS Modules — отличное решение для изоляции стилей в React без сложных инструментов. Главные преимущества:

- **Нет конфликтов имён** — уникальные классы генерируются автоматически
- **Обычный CSS** — не нужно учить новый синтаксис
- **Поддержка из коробки** — работает в CRA, Vite, Next.js без настройки
- **Нет runtime-накладных расходов** — всё происходит на этапе сборки
- **SCSS/LESS** — полная поддержка препроцессоров

Используйте CSS Modules для большинства компонентов, добавляйте `clsx` для динамических классов, и при необходимости комбинируйте с глобальными стилями для общих элементов.
