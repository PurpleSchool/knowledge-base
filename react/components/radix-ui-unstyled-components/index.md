---
metaTitle: "Radix UI — headless компоненты для React"
metaDescription: "Radix UI — библиотека доступных headless-компонентов для React. Полный контроль над стилями при готовой логике и ARIA-атрибутах."
author: "Антон Ларичев"
title: "Radix UI: компоненты без стилей"
preview: "Разбираем Radix UI: что такое headless-компоненты, как их стилизовать и почему это лучший выбор для UI-библиотек."
---

## Что такое Radix UI и зачем нужны компоненты без стилей

Radix UI — это библиотека примитивов для React, которая предоставляет полнофункциональные компоненты без каких-либо встроенных стилей. Такой подход называют **headless** (безголовым): компонент содержит всю логику, управление состоянием и ARIA-атрибуты для доступности, но не навязывает никакого визуального оформления.

Классические библиотеки компонентов — Material UI, Ant Design, Chakra UI — идут с готовыми стилями. Это удобно для быстрого старта, но создаёт проблемы, когда нужно кастомизировать внешний вид: приходится бороться со специфичностью CSS, переопределять темы и в итоге поддерживать хрупкий код.

Radix UI решает эту проблему иначе. Он даёт:

- **Логику** — управление открытием/закрытием, фокусом, клавиатурной навигацией
- **Доступность** — правильные роли, ARIA-атрибуты, поведение по спецификации WAI-ARIA
- **Свободу** — ноль собственных стилей, полный контроль у разработчика

## Установка

Каждый примитив Radix UI публикуется как отдельный пакет. Устанавливаем только то, что нужно:

```bash
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tooltip
npm install @radix-ui/react-tabs
```

Либо сразу несколько:

```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip
```

## Принцип работы: составные компоненты

Radix UI использует паттерн составных компонентов (Compound Components). Каждый примитив — это набор взаимосвязанных компонентов, которые работают вместе через контекст.

Рассмотрим `Dialog` как первый пример:

```tsx
import * as Dialog from '@radix-ui/react-dialog'

function App() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button>Открыть диалог</button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>Заголовок</Dialog.Title>
          <Dialog.Description>Описание диалога</Dialog.Description>

          <Dialog.Close asChild>
            <button>Закрыть</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

`Dialog.Root` управляет состоянием. `Dialog.Portal` рендерит содержимое в конец `body`, избегая проблем с `z-index` и `overflow: hidden`. `Dialog.Overlay` и `Dialog.Content` — визуальные части, которые нужно стилизовать самостоятельно.

## Проп asChild

Одна из ключевых возможностей Radix UI — проп `asChild`. Он позволяет передать поведение компонента дочернему элементу вместо рендера собственного DOM-узла.

```tsx
// Без asChild: рендерится <button> внутри <button>
<Dialog.Trigger>
  <button>Открыть</button>
</Dialog.Trigger>

// С asChild: Radix «вливает» свои пропы в дочерний элемент
<Dialog.Trigger asChild>
  <button>Открыть</button>
</Dialog.Trigger>
```

С `asChild` можно использовать собственные компоненты:

```tsx
import { Link } from 'react-router-dom'

<NavigationMenu.Link asChild>
  <Link to="/about">О нас</Link>
</NavigationMenu.Link>
```

Link получит все необходимые атрибуты (роль, `aria-current`, обработчики) без лишней обёртки в DOM.

## Стилизация: три подхода

### CSS-классы

Простейший способ — подключить обычный CSS-файл и присвоить классы:

```tsx
import './dialog.css'

<Dialog.Overlay className="dialog-overlay" />
<Dialog.Content className="dialog-content">
```

```css
.dialog-overlay {
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 60px rgba(0, 0, 0, 0.15);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 480px;
  padding: 24px;
}

@keyframes overlayShow {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Tailwind CSS

Tailwind — наиболее популярный выбор в связке с Radix UI:

```tsx
<Dialog.Overlay className="fixed inset-0 bg-black/50 animate-in fade-in" />
<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-lg shadow-xl p-6 animate-in zoom-in-95">
  <Dialog.Title className="text-xl font-semibold text-gray-900 mb-2">
    Заголовок
  </Dialog.Title>
  <Dialog.Description className="text-sm text-gray-500 mb-6">
    Описание
  </Dialog.Description>
</Dialog.Content>
```

### CSS Modules

Для проектов без Tailwind CSS Modules дают нужную изоляцию:

```tsx
import styles from './Dialog.module.css'

<Dialog.Overlay className={styles.overlay} />
<Dialog.Content className={styles.content}>
```

## Пример: Dropdown Menu

Выпадающее меню — один из сложнейших компонентов с точки зрения доступности. Radix UI обрабатывает всё автоматически: фокус-трап, закрытие по Escape, навигацию стрелками.

```tsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import styles from './DropdownMenu.module.css'

function UserMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className={styles.trigger}>
          Аккаунт
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.content} sideOffset={5}>
          <DropdownMenu.Item className={styles.item} onSelect={() => console.log('Профиль')}>
            Профиль
          </DropdownMenu.Item>
          <DropdownMenu.Item className={styles.item} onSelect={() => console.log('Настройки')}>
            Настройки
          </DropdownMenu.Item>

          <DropdownMenu.Separator className={styles.separator} />

          <DropdownMenu.Item className={styles.item} onSelect={() => console.log('Выйти')}>
            Выйти
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
```

```css
.content {
  min-width: 180px;
  background: white;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  animation: slideDown 150ms ease;
}

.item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
}

.item:hover,
.item[data-highlighted] {
  background: #f4f4f5;
}

.separator {
  height: 1px;
  background: #e4e4e7;
  margin: 4px 0;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## Data-атрибуты для стилизации состояний

Radix UI добавляет `data-`атрибуты, отражающие текущее состояние компонента. Это позволяет стилизовать разные состояния без JavaScript:

```css
/* Открытый/закрытый триггер */
.trigger[data-state='open'] {
  background: #f4f4f5;
}

.trigger[data-state='closed'] {
  background: transparent;
}

/* Активный пункт меню */
.item[data-highlighted] {
  background: #6d28d9;
  color: white;
}

/* Отключённый элемент */
.item[data-disabled] {
  opacity: 0.4;
  pointer-events: none;
}
```

Пример с Tabs:

```tsx
import * as Tabs from '@radix-ui/react-tabs'

function ProductTabs() {
  return (
    <Tabs.Root defaultValue="description">
      <Tabs.List className="tabs-list">
        <Tabs.Trigger className="tabs-trigger" value="description">
          Описание
        </Tabs.Trigger>
        <Tabs.Trigger className="tabs-trigger" value="reviews">
          Отзывы
        </Tabs.Trigger>
        <Tabs.Trigger className="tabs-trigger" value="specs">
          Характеристики
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="description">
        <p>Полное описание товара...</p>
      </Tabs.Content>
      <Tabs.Content value="reviews">
        <p>Отзывы покупателей...</p>
      </Tabs.Content>
      <Tabs.Content value="specs">
        <p>Технические характеристики...</p>
      </Tabs.Content>
    </Tabs.Root>
  )
}
```

```css
.tabs-trigger[data-state='active'] {
  border-bottom: 2px solid #6d28d9;
  color: #6d28d9;
  font-weight: 600;
}

.tabs-trigger[data-state='inactive'] {
  color: #71717a;
}
```

## Tooltip: практический пример с анимацией

```tsx
import * as Tooltip from '@radix-ui/react-tooltip'

function IconButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className="icon-btn" aria-label={label}>
            {icon}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip" sideOffset={6}>
            {label}
            <Tooltip.Arrow className="tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
```

```css
.tooltip {
  background: #18181b;
  color: white;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 13px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  user-select: none;
  animation-duration: 200ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

.tooltip[data-side='top'] {
  animation-name: slideUp;
}

.tooltip[data-side='bottom'] {
  animation-name: slideDown;
}

.tooltip-arrow {
  fill: #18181b;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## Контролируемое и неконтролируемое состояние

Bольшинство примитивов Radix UI поддерживают оба режима работы.

**Неконтролируемый** (состояние внутри компонента):

```tsx
<Dialog.Root defaultOpen={false}>
  ...
</Dialog.Root>
```

**Контролируемый** (состояние снаружи):

```tsx
const [open, setOpen] = useState(false)

<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger asChild>
    <button onClick={() => setOpen(true)}>Открыть</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Content>
      <button onClick={() => setOpen(false)}>Закрыть</button>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

Контролируемый режим нужен, когда открытие диалога зависит от внешних условий: результата запроса, другого состояния, программной навигации.

## Создание собственной библиотеки компонентов

Радикальное преимущество Radix UI — возможность создать собственную библиотеку поверх примитивов. Пример обёртки:

```tsx
// components/ui/dialog.tsx
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger

const DialogOverlay = ({ className, ...props }: DialogPrimitive.DialogOverlayProps) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
)

const DialogContent = ({ className, children, ...props }: DialogPrimitive.DialogContentProps) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'bg-white rounded-xl shadow-2xl p-6 w-[90vw] max-w-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
)

export { Dialog, DialogTrigger, DialogContent }
```

Использование такой обёртки:

```tsx
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

function Page() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button>Открыть</button>
      </DialogTrigger>
      <DialogContent>
        <h2>Заголовок</h2>
        <p>Содержимое диалога</p>
      </DialogContent>
    </Dialog>
  )
}
```

По этому принципу устроена популярная библиотека **shadcn/ui** — набор копируемых компонентов на базе Radix UI и Tailwind.

## Доступность из коробки

Radix UI полностью соответствует спецификации WAI-ARIA. При открытии Dialog:

- фокус автоматически перемещается внутрь
- фокус-трап не позволяет уйти за пределы диалога
- при закрытии фокус возвращается на триггер
- Escape закрывает диалог
- добавляются `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`

Всё это работает без единой строки дополнительного кода.

## Сравнение с альтернативами

| Библиотека | Стили | Доступность | Кастомизация |
|---|---|---|---|
| Radix UI | Нет | Полная | Максимальная |
| Headless UI | Нет | Хорошая | Максимальная |
| Floating UI | Нет | Частичная | Максимальная |
| shadcn/ui | Tailwind | Полная (через Radix) | Высокая |
| MUI | Есть | Полная | Средняя |

Radix UI выигрывает там, где важен полный контроль над дизайном при строгом соблюдении стандартов доступности.

## Итог

Radix UI меняет подход к компонентам: вместо борьбы с чужими стилями разработчик получает чистый фундамент с готовой логикой и доступностью. Это особенно ценно при создании дизайн-систем, корпоративных интерфейсов и любых проектов с нетипичным дизайном.

Ключевые принципы работы с Radix UI:

- устанавливать только нужные примитивы
- использовать `asChild` для интеграции с собственными компонентами
- стилизовать через `data-`атрибуты для обработки состояний
- создавать обёртки для многократного использования в проекте

Для углублённого изучения React и современных паттернов разработки компонентов — курс на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=radix-ui-unstyled-components