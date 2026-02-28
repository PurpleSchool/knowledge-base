---
metaTitle: "useId в React — генерация уникальных идентификаторов"
metaDescription: "Полное руководство по хуку useId в React. Узнайте, как генерировать уникальные идентификаторы для связки элементов формы, обеспечивать совместимость SSR и CSR, типизировать с TypeScript."
author: Олег Марков
title: useId — генерация уникальных идентификаторов
preview: Хук useId генерирует стабильные уникальные идентификаторы, которые не меняются между рендерами и одинаковы на сервере и клиенте. Разберём синтаксис, практические паттерны и типичные ошибки.
---

## Введение

Каждый раз, когда вы создаёте форму с несколькими полями, вы сталкиваетесь с одной и той же задачей: нужно связать `<label>` с `<input>` через атрибуты `htmlFor` и `id`. Казалось бы, просто задать строку — и всё. Но проблема возникает, когда один и тот же компонент формы рендерится несколько раз на странице: все `id` окажутся одинаковыми, и браузер не сможет корректно связать метки с полями. Ещё сложнее ситуация при серверном рендеринге (SSR): счётчики, генерирующие `id` на клиенте, расходятся с теми, что были посчитаны на сервере, — и React выдаёт предупреждение о гидратации.

Хук `useId`, появившийся в React 18, решает эти задачи системно. Он генерирует стабильный идентификатор, который гарантированно совпадает на сервере и клиенте, уникален для каждого экземпляра компонента и не меняется между рендерами.

Если вы хотите глубже разобраться в хуках React и научиться применять их в реальных проектах — приходите на [наш курс по React](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useId). В нём мы разбираем все современные хуки на практических примерах.

## Что такое useId и зачем он нужен

До появления `useId` разработчики обходились самостоятельными решениями: глобальными счётчиками, библиотеками типа `uuid`, или ручным подбором строк. Посмотрите на типичный пример «до»:

```tsx
// ❌ Проблемный подход — id не уникален при множественном рендере
let counter = 0;

function EmailField() {
  const id = `email-${counter++}`; // при каждом рендере счётчик растёт

  return (
    <div>
      <label htmlFor={id}>Email</label>
      <input id={id} type="email" />
    </div>
  );
}

// Если рендерить <EmailField /> дважды — id совпадут при SSR и CSR
```

А вот как выглядит решение с `useId`:

```tsx
// ✅ Правильный подход с useId
import { useId } from 'react';

function EmailField() {
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>Email</label>
      <input id={id} type="email" />
    </div>
  );
}

// Каждый экземпляр получит свой уникальный стабильный id
```

Главные преимущества `useId`:
- **Уникальность** — каждый вызов хука возвращает отличный от других идентификатор.
- **Стабильность** — значение не меняется между рендерами одного экземпляра компонента.
- **SSR-совместимость** — идентификаторы совпадают на сервере и клиенте, что исключает ошибки гидратации.
- **Нет зависимости от порядка** — в отличие от ручных счётчиков, `useId` привязан к позиции компонента в дереве React.

## Синтаксис useId

```tsx
const id = useId();
```

| Параметр | Тип | Описание |
|----------|-----|---------|
| — | — | Хук не принимает аргументов |

| Возвращаемое значение | Тип | Описание |
|----------------------|-----|---------|
| `id` | `string` | Уникальный стабильный идентификатор, начинающийся с `:` и заканчивающийся `:` |

Формат идентификатора: `:r0:`, `:r1:`, `:ra:` и т.д. Двоеточия по краям намеренно добавлены, чтобы исключить случайное совпадение с пользовательскими строками.

> ⚠️ **Важно:** `useId` нельзя использовать для генерации `key` в списках. Для ключей списков используйте данные из вашего источника данных.

## Базовый пример использования

```tsx
import { useId } from 'react';

interface TextFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
}

function TextField({ label, type = 'text', placeholder }: TextFieldProps) {
  const inputId = useId();

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
      />
    </div>
  );
}

// Используем компонент несколько раз — каждый получит уникальный id
function RegistrationForm() {
  return (
    <form>
      <TextField label="Имя" placeholder="Введите имя" />
      <TextField label="Email" type="email" placeholder="mail@example.com" />
      <TextField label="Пароль" type="password" />
    </form>
  );
}
```

Каждый экземпляр `TextField` получит свой `inputId` — например, `:r0:`, `:r1:`, `:r2:`. Эти значения стабильны и совпадают между серверным и клиентским рендерами.

## Как работает useId под капотом

`useId` использует позицию компонента в дереве React (фиберном дереве) для вычисления идентификатора. Именно поэтому значение совпадает при SSR и CSR — React проходит дерево в одном и том же порядке в обоих случаях.

```
App
├── RegistrationForm
│   ├── TextField ("Имя")       → useId() → ":r0:"
│   ├── TextField ("Email")     → useId() → ":r1:"
│   └── TextField ("Пароль")    → useId() → ":r2:"
└── ContactForm
    ├── TextField ("Телефон")   → useId() → ":r3:"
    └── TextField ("Сообщение") → useId() → ":r4:"
```

Идентификаторы не меняются при ре-рендере, если структура дерева остаётся прежней. Если компонент монтируется или демонтируется, позиции могут сместиться.

## Генерация нескольких связанных id

Иногда одному компоненту нужно несколько уникальных идентификаторов — например, для связки поля ввода с описанием или сообщением об ошибке. Достаточно одного вызова `useId` и добавления суффиксов:

```tsx
import { useId } from 'react';

interface PasswordFieldProps {
  label: string;
  hint?: string;
  error?: string;
}

function PasswordField({ label, hint, error }: PasswordFieldProps) {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="password"
        aria-describedby={[hint && hintId, error && errorId]
          .filter(Boolean)
          .join(' ')}
      />
      {hint && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

Здесь из одного базового `id` мы получаем три связанных: для `<input>`, для подсказки и для ошибки. При этом выполняется всего один вызов `useId`.

## Использование с aria-атрибутами

`useId` особенно полезен для связывания aria-атрибутов — это делает компоненты доступными для пользователей с экранными читалками:

```tsx
import { useId } from 'react';

interface SelectProps {
  label: string;
  options: string[];
  onChange: (value: string) => void;
}

function AccessibleSelect({ label, options, onChange }: SelectProps) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div>
      <span id={labelId} className="select-label">
        {label}
      </span>
      <p id={descriptionId} className="select-description">
        Выберите один из вариантов
      </p>
      <select
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
```

Обратите внимание: здесь два отдельных вызова `useId` — для `labelId` и `descriptionId`. Это допустимо, каждый вызов генерирует свой уникальный идентификатор.

## Типизация с TypeScript

`useId` возвращает `string`, поэтому типизация минимальна:

```tsx
import { useId } from 'react';

function FormField(): JSX.Element {
  const id: string = useId(); // явная аннотация не нужна, TypeScript выводит тип сам

  return (
    <div>
      <label htmlFor={id}>Поле</label>
      <input id={id} />
    </div>
  );
}
```

Если вы создаёте компонент-обёртку, который принимает необязательный внешний `id`, можно комбинировать с `useId`:

```tsx
import { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  externalId?: string; // позволяет переопределить id снаружи
}

function Input({ label, externalId, ...rest }: InputProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId; // предпочитаем внешний id, если он задан

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
    </div>
  );
}
```

## Продвинутые паттерны

### Паттерн 1: Компонент с множеством связанных элементов

```tsx
import { useId } from 'react';

interface SliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

function AccessibleSlider({ label, min, max, value, onChange }: SliderProps) {
  const baseId = useId();

  return (
    <div>
      <label htmlFor={`${baseId}-input`}>{label}</label>
      <input
        id={`${baseId}-input`}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-labelledby={`${baseId}-label`}
      />
      <output id={`${baseId}-output`} htmlFor={`${baseId}-input`}>
        {value}
      </output>
    </div>
  );
}
```

### Паттерн 2: Переиспользуемый хук для генерации id

```tsx
import { useId } from 'react';

// Утилитный хук для компонентов формы
function useFormIds(fields: string[]) {
  const baseId = useId();

  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field] = `${baseId}-${field}`;
    return acc;
  }, {});
}

function ComplexForm() {
  const ids = useFormIds(['name', 'email', 'phone', 'message']);

  return (
    <form>
      <div>
        <label htmlFor={ids.name}>Имя</label>
        <input id={ids.name} type="text" />
      </div>
      <div>
        <label htmlFor={ids.email}>Email</label>
        <input id={ids.email} type="email" />
      </div>
      <div>
        <label htmlFor={ids.phone}>Телефон</label>
        <input id={ids.phone} type="tel" />
      </div>
      <div>
        <label htmlFor={ids.message}>Сообщение</label>
        <textarea id={ids.message} />
      </div>
    </form>
  );
}
```

### Паттерн 3: useId в компонентах библиотеки

```tsx
import { useId, forwardRef } from 'react';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// forwardRef сохраняет совместимость с внешними ref,
// а useId обеспечивает уникальный id для label
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked, onChange }, ref) => {
    const id = useId();

    return (
      <div className="checkbox-wrapper">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label htmlFor={id}>{label}</label>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
```

## useId vs альтернативы: ключевые отличия

| Подход | SSR-совместимость | Стабильность | Зависимости |
|--------|-----------------|--------------|-------------|
| `useId` | ✅ Да | ✅ Не меняется | Нет |
| Глобальный счётчик | ❌ Нет | ✅ Не меняется | Нет |
| `uuid()` в `useState` | ❌ Нет (разные на SSR/CSR) | ✅ Не меняется | `uuid` |
| `Math.random()` | ❌ Нет | ❌ Меняется | Нет |
| `nanoid()` в `useState` | ❌ Нет | ✅ Не меняется | `nanoid` |

`useId` — единственный встроенный способ гарантировать совпадение идентификаторов между серверным и клиентским рендерами без сторонних библиотек.

## Ограничения и когда не стоит использовать

```tsx
// ❌ Нельзя использовать useId для ключей в списках
function BadList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => {
        const id = useId(); // Нарушение правил хуков — нельзя в цикле!
        return <li key={id}>{item}</li>;
      })}
    </ul>
  );
}

// ✅ Для ключей используйте данные из источника
function GoodList({ items }: { items: { id: string; name: string }[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

```tsx
// ❌ Не используйте useId как видимый контент
function BadBadge() {
  const id = useId();
  return <span>Ваш код: {id}</span>; // :r0: — не для пользователей
}

// ✅ useId только для DOM-атрибутов
function GoodField() {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>Поле</label>
      <input id={id} />
    </>
  );
}
```

Не стоит применять `useId`:
- В качестве `key` для списков — используйте данные.
- Как видимый текст для пользователей — формат `:r0:` не предназначен для отображения.
- Как уникальный идентификатор записи в базе данных — это не его назначение.

## Практический пример: форма обратной связи

```tsx
import { useId, useState } from 'react';

interface FormData {
  name: string;
  email: string;
  message: string;
  subscribe: boolean;
}

function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
    subscribe: false,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Один вызов useId на каждое поле
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const subscribeId = useId();

  // Дополнительные id для описаний ошибок
  const nameErrorId = `${nameId}-error`;
  const emailErrorId = `${emailId}-error`;
  const messageErrorId = `${messageId}-error`;

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) newErrors.name = 'Введите имя';
    if (!formData.email.includes('@')) newErrors.email = 'Некорректный email';
    if (formData.message.length < 10) newErrors.message = 'Минимум 10 символов';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log('Отправка:', formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Поле имени */}
      <div>
        <label htmlFor={nameId}>Имя *</label>
        <input
          id={nameId}
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          aria-describedby={errors.name ? nameErrorId : undefined}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <span id={nameErrorId} role="alert">
            {errors.name}
          </span>
        )}
      </div>

      {/* Поле email */}
      <div>
        <label htmlFor={emailId}>Email *</label>
        <input
          id={emailId}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          aria-describedby={errors.email ? emailErrorId : undefined}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <span id={emailErrorId} role="alert">
            {errors.email}
          </span>
        )}
      </div>

      {/* Текстовое поле */}
      <div>
        <label htmlFor={messageId}>Сообщение *</label>
        <textarea
          id={messageId}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={4}
          aria-describedby={errors.message ? messageErrorId : undefined}
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <span id={messageErrorId} role="alert">
            {errors.message}
          </span>
        )}
      </div>

      {/* Чекбокс */}
      <div>
        <input
          id={subscribeId}
          type="checkbox"
          checked={formData.subscribe}
          onChange={(e) =>
            setFormData({ ...formData, subscribe: e.target.checked })
          }
        />
        <label htmlFor={subscribeId}>
          Подписаться на рассылку
        </label>
      </div>

      <button type="submit">Отправить</button>
    </form>
  );
}
```

В этом примере каждое поле получает уникальный `id` через `useId`. Используя суффикс `-error`, мы получаем связанный `id` для сообщения об ошибке без дополнительных вызовов хука. `aria-describedby` и `aria-invalid` делают форму доступной для вспомогательных технологий.

## Итоги

Хук `useId` — простой, но мощный инструмент для решения конкретной задачи: генерации стабильных уникальных идентификаторов. Вот ключевые моменты:

- **Используйте для DOM-атрибутов** — `id`, `htmlFor`, `aria-labelledby`, `aria-describedby` и других.
- **Один базовый id + суффиксы** — когда компоненту нужно несколько связанных идентификаторов.
- **Не используйте для ключей списков** — для этого есть данные из источника.
- **SSR из коробки** — идентификаторы совпадают на сервере и клиенте.
- **Без зависимостей** — встроенный хук React 18, ничего устанавливать не нужно.

Хотите освоить весь инструментарий React и научиться создавать production-ready приложения? Записывайтесь на [наш курс по React](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useId) и практикуйтесь на реальных проектах.
