---
metaTitle: Типизация пропсов React-компонентов с TypeScript
metaDescription: Подробное руководство по типизации пропсов React-компонентов: interface vs type, ReactNode, FC, PropsWithChildren и лучшие практики
author: Олег Марков
title: Типизация пропсов компонентов в React с TypeScript
preview: Узнайте, как правильно типизировать пропсы React-компонентов с TypeScript — выбор между interface и type, использование ReactNode, FC и PropsWithChildren
---

## Введение

Типизация пропсов — это фундамент TypeScript в React. Когда вы правильно описываете типы входящих данных компонента, IDE предупреждает об ошибках до запуска приложения, автодополнение работает точно, а рефакторинг становится безопасным. В этой статье мы разберём все способы типизации пропсов и выясним, когда использовать каждый из них.

## interface vs type для пропсов

Один из первых вопросов, которые возникают при работе с TypeScript в React — что использовать для описания пропсов: `interface` или `type`? Оба варианта работают, но у каждого есть свои особенности.

### Когда использовать interface

`interface` — предпочтительный выбор для описания пропсов компонентов в большинстве случаев. Он декларативен, поддерживает расширение через `extends` и хорошо читается:

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}
```

Интерфейсы легко расширять. Если у вас есть базовый интерфейс для всех кнопок, вы можете создать специализированные версии:

```tsx
interface BaseButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

interface PrimaryButtonProps extends BaseButtonProps {
  label: string;
  icon?: React.ReactNode;
}

interface IconButtonProps extends BaseButtonProps {
  icon: React.ReactNode;
  ariaLabel: string;
}
```

### Когда использовать type

`type` удобен, когда вам нужны более сложные конструкции: объединения типов, пересечения, условные типы или когда пропсы берутся из нескольких источников:

```tsx
// Объединение типов — только interface не позволит это сделать
type AlertProps = {
  message: string;
} & (
  | { type: 'success'; duration?: number }
  | { type: 'error'; retryable?: boolean }
  | { type: 'warning'; confirmRequired?: boolean }
);

function Alert(props: AlertProps) {
  const { message, type } = props;
  
  // TypeScript знает, что при type === 'error' есть поле retryable
  if (type === 'error' && props.retryable) {
    return <div className="alert alert-error"><button>Повторить</button>{message}</div>;
  }
  
  return <div className={`alert alert-${type}`}>{message}</div>;
}
```

### Практическое правило

Используйте `interface` для простых объектов пропсов и `type` для сложных составных типов. В крупных командах полезно договориться об одном стандарте — это упрощает код-ревью.

## ReactNode и типизация дочерних элементов

`ReactNode` — наиболее широкий тип для описания содержимого, которое React может отрендерить. Он включает: `string`, `number`, `boolean`, `null`, `undefined`, `ReactElement`, массивы и фрагменты.

```tsx
import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

function Card({ title, children, footer }: CardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

// Использование — children может быть чем угодно
<Card 
  title="Заголовок"
  footer={<button>Подробнее</button>}
>
  <p>Текст карточки</p>
  <img src="/image.jpg" alt="Изображение" />
</Card>
```

### Другие типы для children

Помимо `ReactNode` существуют более узкие типы:

```tsx
import { ReactElement, ReactNode, JSX } from 'react';

// ReactElement — только React-элементы, без строк и чисел
interface WrapperProps {
  children: ReactElement;
}

// JSX.Element — устаревший синоним ReactElement, лучше не использовать
// string — только строка
interface LabelProps {
  children: string;
}

// Для render props паттерна
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}
```

## FC и функциональные компоненты

`FC` (Function Component) — это тип из React для функциональных компонентов. Долгое время он был стандартом, но в современном React рекомендуется избегать его по ряду причин.

### Почему FC не рекомендуется в современном React

До React 18 тип `FC` автоматически добавлял `children: ReactNode` к пропсам. Начиная с версии 18 это было исправлено, но сам тип всё равно добавляет дополнительные накладные расходы:

```tsx
import { FC, ReactNode } from 'react';

// Старый подход с FC — не рекомендуется
const OldButton: FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};

// Современный подход — просто функция с типизированными параметрами
interface NewButtonProps {
  label: string;
  onClick: () => void;
}

function NewButton({ label, onClick }: NewButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// Или через стрелочную функцию без FC
const ArrowButton = ({ label, onClick }: NewButtonProps) => (
  <button onClick={onClick}>{label}</button>
);
```

### Когда FC всё же полезен

`FC` остаётся полезным при работе с `displayName` и в некоторых паттернах с HOC:

```tsx
const DebugComponent: FC<{ data: unknown }> = ({ data }) => {
  if (process.env.NODE_ENV !== 'development') return null;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

// FC.displayName корректно устанавливается
DebugComponent.displayName = 'DebugComponent';
```

## PropsWithChildren

`PropsWithChildren` — утилитный тип React, который добавляет `children?: ReactNode` к вашим пропсам. Это удобный сокращённый способ описать компонент-обёртку:

```tsx
import { PropsWithChildren } from 'react';

// Без PropsWithChildren
interface PanelProps {
  title: string;
  children: ReactNode;
}

// С PropsWithChildren — эквивалентно, но короче
type PanelProps = PropsWithChildren<{
  title: string;
}>;

function Panel({ title, children }: PanelProps) {
  return (
    <div className="panel">
      <div className="panel-title">{title}</div>
      <div className="panel-content">{children}</div>
    </div>
  );
}
```

`PropsWithChildren` делает `children` необязательным (`children?: ReactNode`). Если вам нужен обязательный `children`, задайте его явно:

```tsx
interface RequiredChildrenProps {
  children: ReactNode; // Обязательный children
  className?: string;
}

function Container({ children, className }: RequiredChildrenProps) {
  return <div className={className}>{children}</div>;
}
```

## Опциональные и обязательные пропсы

Знак `?` после имени поля делает проп необязательным. Всегда думайте о разумных значениях по умолчанию:

```tsx
interface TooltipProps {
  // Обязательные пропсы
  content: string;
  children: ReactNode;
  
  // Необязательные с дефолтными значениями
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
}

function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = 200,
}: TooltipProps) {
  return (
    <div className="tooltip-wrapper">
      {children}
      <div 
        className={`tooltip tooltip-${position}`}
        style={{ maxWidth }}
      >
        {content}
      </div>
    </div>
  );
}
```

## Пропсы-колбэки и обработчики событий

Правильная типизация колбэков делает API компонента предсказуемым:

```tsx
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  
  // Колбэки с конкретными типами
  onRowClick?: (row: T, index: number) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Partial<Record<keyof T, string>>) => void;
  
  // Рендер-пропсы
  renderEmptyState?: () => ReactNode;
  renderLoadingState?: () => ReactNode;
}

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  sortable?: boolean;
  width?: string | number;
}
```

## Расширение HTML-атрибутов

Когда компонент оборачивает HTML-элемент, полезно расширить его нативные атрибуты:

```tsx
import { ComponentPropsWithoutRef, ComponentPropsWithRef, forwardRef } from 'react';

// Расширяем атрибуты button
interface CustomButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

function CustomButton({ variant = 'primary', isLoading, children, ...rest }: CustomButtonProps) {
  return (
    <button
      {...rest}
      disabled={isLoading || rest.disabled}
      className={`btn btn-${variant} ${isLoading ? 'btn-loading' : ''} ${rest.className || ''}`}
    >
      {isLoading ? <span className="spinner" /> : children}
    </button>
  );
}

// С forwardRef для доступа к DOM
const Input = forwardRef<HTMLInputElement, ComponentPropsWithRef<'input'> & { label?: string }>(
  ({ label, ...inputProps }, ref) => (
    <label>
      {label && <span>{label}</span>}
      <input ref={ref} {...inputProps} />
    </label>
  )
);
Input.displayName = 'Input';
```

## Дискриминантные union типы для сложных пропсов

Когда компонент ведёт себя по-разному в зависимости от набора пропсов, используйте дискриминантные union:

```tsx
// Компонент Media, который может быть изображением или видео
type MediaProps =
  | {
      type: 'image';
      src: string;
      alt: string;
      width?: number;
      height?: number;
    }
  | {
      type: 'video';
      src: string;
      poster?: string;
      autoPlay?: boolean;
      controls?: boolean;
    };

function Media(props: MediaProps) {
  if (props.type === 'image') {
    // TypeScript знает: здесь доступны alt, width, height
    return <img src={props.src} alt={props.alt} width={props.width} height={props.height} />;
  }
  
  // TypeScript знает: здесь доступны poster, autoPlay, controls
  return (
    <video
      src={props.src}
      poster={props.poster}
      autoPlay={props.autoPlay}
      controls={props.controls}
    />
  );
}
```

## Лучшие практики

**1. Называйте интерфейсы пропсов по имени компонента + Props:**

```tsx
// Хорошо
interface UserCardProps { ... }
function UserCard(props: UserCardProps) { ... }

// Плохо
interface Props { ... } // Слишком общее название
```

**2. Экспортируйте типы пропсов, если компонент переиспользуется:**

```tsx
// Потребители могут расширить или переиспользовать тип
export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export function Button(props: ButtonProps) { ... }
```

**3. Используйте `readonly` для пропсов, которые не должны изменяться:**

```tsx
interface ListProps {
  readonly items: readonly string[]; // Неизменяемый массив
  onSelect: (item: string) => void;
}
```

**4. Документируйте пропсы с JSDoc:**

```tsx
interface SliderProps {
  /** Текущее значение слайдера */
  value: number;
  /** Минимальное значение (по умолчанию 0) */
  min?: number;
  /** Максимальное значение (по умолчанию 100) */
  max?: number;
  /** Шаг изменения значения */
  step?: number;
  /** Коллбэк при изменении значения */
  onChange: (value: number) => void;
}
```

## Заключение

Правильная типизация пропсов — это инвестиция в качество кода. Ключевые моменты:

- Используйте `interface` для простых пропсов и `type` для сложных составных типов
- Предпочитайте явную типизацию функции вместо `FC<Props>`
- `PropsWithChildren` — удобный способ добавить необязательный `children`
- `ReactNode` — наиболее широкий тип для `children`, подходящий в большинстве случаев
- Расширяйте HTML-атрибуты через `ComponentPropsWithoutRef` для компонентов-обёрток
- Используйте дискриминантные union для компонентов с несколькими режимами работы
- Документируйте пропсы с JSDoc — это часть API вашего компонента
