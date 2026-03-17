---
metaTitle: Доступность (a11y) в React — WCAG, ARIA и инклюзивные интерфейсы
metaDescription: Практическое руководство по доступности React-приложений: семантическая разметка, ARIA-атрибуты, навигация с клавиатуры, поддержка скринридеров, тестирование доступности
author: Олег Марков
title: Доступность (a11y) в React — WCAG, ARIA и инклюзивные интерфейсы
preview: Доступные приложения используют больше людей и лучше индексируются поисковиками. Узнайте, как сделать React-интерфейс доступным для пользователей с ограниченными возможностями — от семантической разметки до тестирования с помощью screen readers
---

## Введение

Доступность (accessibility, a11y) — свойство интерфейса, позволяющее использовать его людям с различными ограниченными возможностями: нарушениями зрения, слуха, двигательными ограничениями, когнитивными особенностями.

По статистике ВОЗ, около 15% населения имеют ту или иную форму ограниченных возможностей. Доступный интерфейс не только расширяет аудиторию, но и улучшает SEO, повышает удобство для всех пользователей и, во многих странах, является юридическим требованием.

WCAG (Web Content Accessibility Guidelines) — международный стандарт доступности. Ориентируйтесь на уровень **AA** — он требуется в большинстве правовых контекстов.

## Семантическая HTML-разметка

Основа доступности — правильные HTML-элементы. Скринридеры интерпретируют семантику тегов и сообщают пользователю о роли элемента.

```tsx
// ❌ Несемантично — div для всего
function Navigation({ links }: { links: NavLink[] }) {
  return (
    <div className="nav">
      {links.map(link => (
        <div className="nav-item" onClick={() => navigate(link.href)} key={link.id}>
          {link.label}
        </div>
      ))}
    </div>
  );
}

// ✅ Семантично — правильные теги несут смысл
function Navigation({ links }: { links: NavLink[] }) {
  return (
    <nav aria-label="Главное меню">
      <ul>
        {links.map(link => (
          <li key={link.id}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### Правильные теги для распространённых случаев

```tsx
// Разметка страницы
function AppLayout() {
  return (
    <>
      <header role="banner">
        <nav aria-label="Основная навигация">...</nav>
      </header>

      <main id="main-content"> {/* id для "Перейти к основному контенту" */}
        <h1>Заголовок страницы</h1>
        <article>
          <h2>Статья</h2>
          <p>Содержимое...</p>
        </article>

        <aside aria-label="Дополнительные материалы">
          <h2>Связанные статьи</h2>
        </aside>
      </main>

      <footer role="contentinfo">
        <nav aria-label="Навигация в подвале">...</nav>
      </footer>
    </>
  );
}

// Кнопки vs ссылки
function Actions() {
  return (
    <>
      {/* <a> — для навигации (меняет URL) */}
      <a href="/profile">Перейти в профиль</a>

      {/* <button> — для действий (не меняет URL) */}
      <button onClick={handleDelete}>Удалить</button>
      <button onClick={() => setIsOpen(true)}>Открыть диалог</button>

      {/* ❌ Нельзя использовать div/span как кнопку без aria-role */}
      <div onClick={handleClick}>Нажми меня</div> {/* скринридер не знает, что это кнопка */}
    </>
  );
}
```

## Клавиатурная навигация

Пользователи без мыши (и люди с моторными ограничениями) используют только клавиатуру. Все интерактивные элементы должны быть доступны с Tab.

### tabIndex

```tsx
// ✅ Интерактивные HTML-элементы получают фокус автоматически
<button>Нажми</button>      // tabIndex = 0 по умолчанию
<a href="/page">Ссылка</a>  // tabIndex = 0 по умолчанию
<input type="text" />       // tabIndex = 0 по умолчанию

// Если нужно сделать нестандартный элемент фокусируемым:
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    // Поддержка Enter и Space — стандартное поведение кнопки
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Кастомная кнопка
</div>

// ❌ tabIndex > 0 нарушает естественный порядок фокуса
<button tabIndex={3}>Кнопка 3</button> // Не делайте так
<button tabIndex={1}>Кнопка 1</button>
<button tabIndex={2}>Кнопка 2</button>
```

### Управление фокусом в модальных окнах

При открытии модала фокус должен перемещаться внутрь, при закрытии — возвращаться на элемент-триггер:

```tsx
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null); // хранится в родителе

  // Фокус на кнопку закрытия при открытии
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Оверлей перехватывает клик
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal"
        onClick={e => e.stopPropagation()} // Не закрывать при клике на контент
      >
        <h2 id="modal-title">{title}</h2>

        {children}

        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Закрыть диалог"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

### Ловушка фокуса (Focus Trap)

Фокус не должен выходить за пределы открытого модала:

```tsx
import { useEffect, useRef } from 'react';

function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Находим все фокусируемые элементы
    const focusableSelectors = [
      'a[href]', 'button:not([disabled])',
      'input:not([disabled])', 'select:not([disabled])',
      'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusable = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab: если на первом — переходим на последний
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab: если на последнем — переходим на первый
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

// Использование в модале
function AccessibleModal({ isOpen, onClose, children }: ModalProps) {
  const containerRef = useFocusTrap(isOpen);

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {children}
      <button onClick={onClose}>Закрыть</button>
    </div>
  );
}
```

## ARIA-атрибуты

ARIA (Accessible Rich Internet Applications) — атрибуты для улучшения доступности динамических интерфейсов.

### Ключевые ARIA-атрибуты

```tsx
// aria-label — текстовый ярлык для элементов без видимого текста
<button aria-label="Удалить пользователя Иван Иванов">
  <TrashIcon />
</button>

// aria-labelledby — ссылка на другой элемент как ярлык
<section aria-labelledby="section-title">
  <h2 id="section-title">Статистика продаж</h2>
  <p>Содержимое секции...</p>
</section>

// aria-describedby — дополнительное описание
<input
  type="password"
  aria-describedby="password-hint"
  placeholder="Введите пароль"
/>
<p id="password-hint" className="hint">
  Минимум 8 символов, включая цифру и заглавную букву
</p>

// aria-required — обязательное поле
<input type="email" aria-required="true" />

// aria-invalid — невалидное поле
<input
  type="email"
  aria-invalid={hasError ? 'true' : 'false'}
  aria-describedby={hasError ? 'email-error' : undefined}
/>
{hasError && (
  <span id="email-error" role="alert">
    Введите корректный email
  </span>
)}

// aria-live — объявления для скринридеров (динамические изменения)
function StatusMessage({ message, type }: { message: string; type: 'status' | 'error' }) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
```

### aria-expanded для раскрываемых элементов

```tsx
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();

  return (
    <div className="accordion">
      <button
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={() => setIsExpanded(prev => !prev)}
        className="accordion-trigger"
      >
        {title}
        <span aria-hidden="true">{isExpanded ? '▲' : '▼'}</span>
      </button>

      <div
        id={contentId}
        role="region"
        aria-labelledby={`trigger-${contentId}`}
        hidden={!isExpanded}
        className="accordion-content"
      >
        {children}
      </div>
    </div>
  );
}
```

### Роли для кастомных компонентов

```tsx
// Кастомный переключатель (toggle)
function Toggle({ isOn, onToggle, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={isOn}
      onClick={onToggle}
      className={`toggle ${isOn ? 'toggle--on' : ''}`}
    >
      <span className="visually-hidden">{label}</span>
      <span aria-hidden="true" className="toggle-thumb" />
    </button>
  );
}

// Кастомный список с выбором
function SelectableList({ items, selectedId, onSelect }: SelectableListProps) {
  return (
    <ul role="listbox" aria-label="Выберите элемент">
      {items.map(item => (
        <li
          key={item.id}
          role="option"
          aria-selected={item.id === selectedId}
          tabIndex={0}
          onClick={() => onSelect(item.id)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(item.id);
            }
          }}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

## Доступность форм

Правильная разметка форм критически важна — формы используются для ввода данных, и ошибки здесь особенно болезненны для пользователей скринридеров.

```tsx
function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

  return (
    <form aria-labelledby="form-title" noValidate onSubmit={handleSubmit}>
      <h2 id="form-title">Обратная связь</h2>

      {/* Группировка связанных полей */}
      <fieldset>
        <legend>Ваши данные</legend>

        <div className="field">
          <label htmlFor={nameId}>
            Имя
            <span aria-hidden="true"> *</span> {/* Звёздочка только визуальная */}
          </label>
          <input
            id={nameId}
            type="text"
            name="name"
            required
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            autoComplete="given-name"
          />
          {errors.name && (
            <span id={`${nameId}-error`} role="alert" className="field-error">
              {errors.name}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor={emailId}>Email <span aria-hidden="true">*</span></label>
          <input
            id={emailId}
            type="email"
            name="email"
            required
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={`${emailId}-hint ${errors.email ? `${emailId}-error` : ''}`}
            autoComplete="email"
          />
          <span id={`${emailId}-hint`} className="field-hint">
            Например: ivan@example.com
          </span>
          {errors.email && (
            <span id={`${emailId}-error`} role="alert" className="field-error">
              {errors.email}
            </span>
          )}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={messageId}>Сообщение <span aria-hidden="true">*</span></label>
        <textarea
          id={messageId}
          name="message"
          required
          aria-required="true"
          rows={5}
        />
      </div>

      <button type="submit">Отправить</button>
    </form>
  );
}
```

## Изображения и медиаконтент

```tsx
// Информативные изображения — обязательный alt
<img src={productImage} alt="Ноутбук Apple MacBook Pro 14 дюймов в серебристом цвете" />

// Декоративные изображения — пустой alt (скринридер пропустит)
<img src={decorativeBanner} alt="" role="presentation" />

// Иконки рядом с текстом — скрыть от скринридера
function IconButton({ icon: Icon, label, onClick }: IconButtonProps) {
  return (
    <button onClick={onClick}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

// Иконки без текста — aria-label обязателен
function IconOnlyButton({ icon: Icon, label, onClick }: IconButtonProps) {
  return (
    <button onClick={onClick} aria-label={label}>
      <Icon aria-hidden="true" />
    </button>
  );
}

// Фоновые изображения через CSS — недоступны для скринридеров по умолчанию,
// что правильно для декоративных изображений
```

## Цвет и контраст

```tsx
// Минимальный коэффициент контраста по WCAG 2.1:
// Уровень AA: 4.5:1 для обычного текста, 3:1 для крупного (18px+)
// Уровень AAA: 7:1 для обычного текста

// ❌ Информация только через цвет (не доступно для дальтоников)
function StatusBadge({ status }: { status: 'success' | 'error' | 'warning' }) {
  const colors = { success: 'green', error: 'red', warning: 'yellow' };
  return (
    <span style={{ color: colors[status] }}>●</span>
  );
}

// ✅ Цвет + форма/текст/иконка
function StatusBadge({ status }: { status: 'success' | 'error' | 'warning' }) {
  const config = {
    success: { label: 'Успешно', icon: '✓', className: 'badge--success' },
    error: { label: 'Ошибка', icon: '✕', className: 'badge--error' },
    warning: { label: 'Предупреждение', icon: '!', className: 'badge--warning' },
  };

  const { label, icon, className } = config[status];

  return (
    <span className={`badge ${className}`} aria-label={label}>
      <span aria-hidden="true">{icon}</span>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
```

## Visually Hidden — скрытый текст для скринридеров

```css
/* globals.css — утилитный класс */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

```tsx
// Использование: текст видит только скринридер
function CartButton({ count }: { count: number }) {
  return (
    <button>
      <CartIcon aria-hidden="true" />
      <span className="visually-hidden">
        Корзина, {count} {pluralize(count, 'товар', 'товара', 'товаров')}
      </span>
      <span aria-hidden="true" className="cart-badge">{count}</span>
    </button>
  );
}
```

## Тестирование доступности

### Автоматическое тестирование с jest-axe

```tsx
// Установка
// npm install --save-dev jest-axe @types/jest-axe

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('не должен иметь нарушений доступности', async () => {
    const { container } = render(
      <Button label="Отправить" onClick={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('кнопка-иконка должна иметь aria-label', async () => {
    const { container } = render(
      <IconButton icon={TrashIcon} label="Удалить" onClick={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Тестирование с Testing Library

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ContactForm', () => {
  it('показывает ошибку и устанавливает фокус при пустой отправке', async () => {
    render(<ContactForm />);

    const submitButton = screen.getByRole('button', { name: 'Отправить' });
    await userEvent.click(submitButton);

    // Проверяем наличие сообщения об ошибке
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();

    // Проверяем aria-invalid на поле
    const nameInput = screen.getByLabelText(/имя/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('форма заполняется с клавиатуры', async () => {
    render(<ContactForm />);
    const user = userEvent.setup();

    // Tab к первому полю
    await user.tab();
    expect(screen.getByLabelText(/имя/i)).toHaveFocus();

    // Ввод значения
    await user.type(screen.getByLabelText(/имя/i), 'Иван');

    // Tab к следующему полю
    await user.tab();
    expect(screen.getByLabelText(/email/i)).toHaveFocus();
  });
});
```

## ESLint для доступности

```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

```json
// .eslintrc.json
{
  "plugins": ["jsx-a11y"],
  "extends": ["plugin:jsx-a11y/recommended"],
  "rules": {
    // Обязательный alt для изображений
    "jsx-a11y/alt-text": "error",
    // Запрет кликабельных div без роли
    "jsx-a11y/no-static-element-interactions": "error",
    // Интерактивные элементы должны быть фокусируемы
    "jsx-a11y/interactive-supports-focus": "error",
    // label должен быть связан с input
    "jsx-a11y/label-has-associated-control": "error"
  }
}
```

## Связанные темы

- [Безопасность в React](../security/index.md) — защита приложения
- [Именование компонентов](../naming-conventions/index.md) — семантические имена
- [Документирование компонентов](../component-documentation/index.md) — документирование доступности
