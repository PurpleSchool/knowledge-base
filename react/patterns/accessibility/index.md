---
metaTitle: "Доступность (a11y) в React — ARIA, семантика и клавиатурная навигация"
metaDescription: "Практическое руководство по доступности React-приложений: семантический HTML, ARIA-атрибуты, управление фокусом, клавиатурная навигация и тестирование доступности."
author: Олег Марков
title: "Доступность (a11y) в React: ARIA, семантика и клавиатурная навигация"
preview: "Разбираем как сделать React-приложение доступным для пользователей с ограниченными возможностями: семантика HTML, ARIA-атрибуты, управление фокусом и инструменты тестирования."
---

# Доступность (a11y) в React

Доступность (accessibility, a11y) — это проектирование приложений таким образом, чтобы ими могли пользоваться люди с различными ограниченными возможностями: пользователи программ чтения экрана (screen readers), люди с моторными нарушениями, использующие только клавиатуру, и другие. В этой статье рассмотрим практические подходы к реализации доступности в React.

## Почему доступность важна

Доступность — это не только про людей с инвалидностью. По данным ВОЗ, около 15% людей живут с той или иной формой инвалидности. Помимо этого, принципы доступности улучшают опыт для всех пользователей: улучшают SEO, помогают при плохом освещении или работе одной рукой.

Во многих странах доступность веб-приложений является юридическим требованием (WCAG 2.1, раздел 508 в США, EU Web Accessibility Directive).

## Семантический HTML как основа

Первый и важнейший принцип доступности — использовать правильные HTML-элементы для правильных целей:

```tsx
// ❌ Семантически неверно — div вместо кнопки
function DeleteButton({ onDelete }) {
  return (
    <div onClick={onDelete} style={{ cursor: 'pointer' }}>
      Удалить
    </div>
  );
}

// ✅ Семантически правильно
function DeleteButton({ onDelete }) {
  return (
    <button type="button" onClick={onDelete}>
      Удалить
    </button>
  );
}
```

Почему это важно: кнопка (`<button>`) автоматически фокусируется с клавиатуры, реагирует на Enter и пробел, корректно анонсируется screen reader'ами. `<div>` не делает ничего из этого.

### Семантические элементы для структуры страницы

```tsx
// ✅ Используйте семантические landmark-элементы
function AppLayout({ children }) {
  return (
    <>
      <header>
        <nav aria-label="Основная навигация">
          <ul>
            <li><a href="/">Главная</a></li>
            <li><a href="/products">Товары</a></li>
          </ul>
        </nav>
      </header>

      <main>
        {children}
      </main>

      <aside aria-label="Сопутствующие материалы">
        <RelatedArticles />
      </aside>

      <footer>
        <p>© 2024 Компания</p>
      </footer>
    </>
  );
}
```

Screen reader'ы позволяют пользователям переходить между landmark-элементами (`header`, `main`, `nav`, `aside`, `footer`). Это критично для навигации по странице.

## ARIA-атрибуты

ARIA (Accessible Rich Internet Applications) расширяет семантику HTML для сложных интерактивных компонентов.

### aria-label и aria-labelledby

Используйте когда визуального текста недостаточно:

```tsx
// ❌ Кнопка непонятна без визуального контекста
function CloseButton({ onClose }) {
  return <button onClick={onClose}>×</button>;
  // Screen reader: "кнопка ×"
}

// ✅ Добавляем текстовое описание
function CloseButton({ onClose }) {
  return (
    <button onClick={onClose} aria-label="Закрыть диалог">
      <span aria-hidden="true">×</span>
    </button>
  );
  // Screen reader: "кнопка Закрыть диалог"
}
```

```tsx
// aria-labelledby — ссылается на ID элемента с описанием
function Modal({ title, children, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">{title}</h2>
      <div id="modal-description">{children}</div>
      <button onClick={onClose} aria-label="Закрыть">×</button>
    </div>
  );
}
```

### aria-hidden

Скрывает элементы от screen reader'ов:

```tsx
// Декоративные иконки не нужны screen reader'ам
function InfoIcon() {
  return <svg aria-hidden="true" focusable="false">...</svg>;
}

// Элементы, дублирующие информацию
function StarRating({ rating }: { rating: number }) {
  return (
    <div>
      <span aria-hidden="true">
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </span>
      <span className="sr-only">{rating} из 5 звёзд</span>
    </div>
  );
}
```

### aria-live: динамические обновления

Для контента, который обновляется динамически:

```tsx
// Объявление об изменении статуса
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

// Использование
function Form() {
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    setStatus('Сохранение...');
    await saveData();
    setStatus('Данные сохранены');
  };

  return (
    <>
      <form onSubmit={handleSubmit}>...</form>
      <StatusMessage message={status} type="status" />
    </>
  );
}
```

- `aria-live="polite"` — объявляет когда пользователь не занят
- `aria-live="assertive"` — прерывает текущее объявление (для ошибок)

## Управление фокусом

### Trap focus в модальных окнах

Когда открыто модальное окно, фокус должен оставаться внутри него:

```tsx
import { useEffect, useRef } from 'react';

function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Запоминаем текущий фокус
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Перемещаем фокус в модальное окно
      modalRef.current?.focus();
    } else {
      // Возвращаем фокус при закрытии
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      // Trap focus
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="modal"
    >
      {children}
    </div>
  );
}
```

На практике используйте готовые библиотеки: `@radix-ui/react-dialog`, `@headlessui/react` — они уже реализуют правильное управление фокусом.

### Управление фокусом при навигации

В SPA при переходе между страницами нужно управлять фокусом вручную:

```tsx
function useRouteChangeAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // При смене роута объявляем пользователю
    const handleRouteChange = (url: string) => {
      const title = document.title || url;
      setAnnouncement(`Перешли на страницу: ${title}`);
    };

    // В Next.js: router.events.on('routeChangeComplete', handleRouteChange)
  }, []);

  return (
    <div aria-live="assertive" className="sr-only">
      {announcement}
    </div>
  );
}
```

## Клавиатурная навигация

Все интерактивные элементы должны быть доступны с клавиатуры:

```tsx
// ❌ Не реагирует на клавиатуру
function DropdownMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Меню</button>
      {isOpen && (
        <ul>
          {items.map(item => (
            <li key={item.id} onClick={() => item.action()}>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ✅ Полная поддержка клавиатуры
function DropdownMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        if (activeIndex >= 0) {
          items[activeIndex].action();
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <button
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        Меню
      </button>
      {isOpen && (
        <ul role="menu">
          {items.map((item, index) => (
            <li
              key={item.id}
              role="menuitem"
              tabIndex={activeIndex === index ? 0 : -1}
              aria-selected={activeIndex === index}
              onClick={() => { item.action(); setIsOpen(false); }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Формы и доступность

```tsx
// ✅ Правильная форма с доступностью
function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form noValidate aria-label="Форма обратной связи">
      <div>
        {/* label обязательно связан с input через htmlFor/id */}
        <label htmlFor="name">
          Имя
          <span aria-hidden="true"> *</span>
          <span className="sr-only"> (обязательное поле)</span>
        </label>
        <input
          id="name"
          type="text"
          required
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          autoComplete="given-name"
        />
        {errors.name && (
          <span id="name-error" role="alert">
            {errors.name}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby="email-hint"
          autoComplete="email"
        />
        <span id="email-hint">Например: user@example.com</span>
      </div>

      <button type="submit">Отправить</button>
    </form>
  );
}
```

## Визуально скрытый, но доступный текст

```tsx
// CSS-класс sr-only — скрыт визуально, но доступен screen reader'ам
// Стандартный класс в Tailwind: className="sr-only"

function PriceDisplay({ original, discounted }) {
  return (
    <div>
      {discounted && (
        <>
          <span aria-hidden="true" className="line-through">{original} ₽</span>
          <span className="sr-only">Цена была {original} рублей,</span>
        </>
      )}
      <span className="text-red-500">
        <span className="sr-only">сейчас </span>
        {discounted ?? original} ₽
      </span>
    </div>
  );
}
```

## Тестирование доступности

### React Testing Library

RTL поощряет доступные запросы:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('форма входа доступна с клавиатуры', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  // Запросы по доступным ролям/именам
  const emailInput = screen.getByRole('textbox', { name: /email/i });
  const passwordInput = screen.getByLabelText(/пароль/i);
  const submitButton = screen.getByRole('button', { name: /войти/i });

  // Навигация с клавиатуры
  await user.tab(); // фокус на email
  await user.type(emailInput, 'test@example.com');
  await user.tab(); // фокус на password
  await user.type(passwordInput, 'password123');
  await user.keyboard('{Enter}'); // отправка формы

  expect(screen.getByText(/вход выполнен/i)).toBeInTheDocument();
});
```

### axe-core: автоматическая проверка

```bash
npm install --save-dev @axe-core/react jest-axe
```

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

test('компонент не имеет нарушений доступности', async () => {
  const { container } = render(<ContactForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Инструменты браузера

- **axe DevTools** (расширение Chrome) — аудит доступности страницы
- **Chrome Lighthouse** — вкладка Accessibility в DevTools
- **NVDA** (Windows) или **VoiceOver** (macOS) — реальные screen reader'ы для тестирования

## Итоги

Ключевые принципы доступности в React:

1. **Семантический HTML** — используйте правильные элементы (`button`, `a`, `header`, `main`)
2. **ARIA только когда HTML недостаточен** — не добавляйте ARIA ради ARIA
3. **Клавиатурная навигация** — все интерактивные элементы доступны с Tab/Enter/Esc
4. **Управление фокусом** — особенно в модальных окнах и SPA-навигации
5. **Текстовые описания** — для иконок, изображений и нетекстовых элементов
6. **Доступные формы** — связанные label и input, сообщения об ошибках
7. **Тестирование** — axe-core, RTL, ручное тестирование со screen reader'ом

Доступность проще реализовывать с самого начала, чем добавлять постфактум. Используйте Radix UI или Headless UI — они предоставляют доступные компоненты из коробки.
