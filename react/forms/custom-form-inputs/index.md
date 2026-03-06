---
metaTitle: Кастомные компоненты формы в React - создание переиспользуемых inputs
metaDescription: Руководство по созданию кастомных компонентов форм в React. Переиспользуемые inputs, select, checkbox, интеграция с React Hook Form через Controller, forwardRef
author: Олег Марков
title: Кастомные компоненты формы
preview: Научитесь создавать переиспользуемые компоненты форм в React — от простых обёрток над input до сложных кастомных элементов, совместимых с React Hook Form и Formik
---

# Кастомные компоненты формы в React

## Введение

По мере роста приложения вы начинаете замечать дублирование кода форм: одни и те же стили, логика отображения ошибок, лейблы и подсказки повторяются в каждом компоненте. Решение — создать библиотеку переиспользуемых компонентов форм.

Кастомные компоненты форм позволяют:
- Обеспечить единообразный внешний вид по всему приложению
- Централизовать логику отображения ошибок и состояний
- Упростить использование форм в других компонентах
- Легко интегрироваться с библиотеками управления формами

В этой статье мы создадим полноценную систему переиспользуемых компонентов форм с поддержкой React Hook Form.

## Базовый компонент TextInput

Начнём с простой обёртки над `<input>`:

```tsx
import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function TextInput({
  label,
  error,
  hint,
  required,
  id,
  className,
  ...rest
}: TextInputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`form-field ${className || ''}`}>
      <label htmlFor={inputId} className="form-label">
        {label}
        {required && <span aria-hidden="true" className="required-mark"> *</span>}
      </label>

      <input
        id={inputId}
        className={`form-input ${error ? 'form-input--error' : ''}`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={
          [hint && `${inputId}-hint`, error && `${inputId}-error`]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...rest}
      />

      {hint && !error && (
        <p id={`${inputId}-hint`} className="form-hint">
          {hint}
        </p>
      )}

      {error && (
        <p id={`${inputId}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Использование
function SignupForm() {
  return (
    <form>
      <TextInput
        label="Имя"
        name="name"
        placeholder="Иван"
        required
        error="Имя обязательно"
        hint="Введите своё настоящее имя"
      />
      <TextInput
        label="Email"
        name="email"
        type="email"
        required
      />
    </form>
  );
}
```

## forwardRef для интеграции с библиотеками

Чтобы компонент работал с React Hook Form, Formik и другими библиотеками, нужен `forwardRef` — он позволяет внешнему коду получить прямой доступ к DOM-элементу:

```tsx
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, ...rest }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="form-field">
        <label htmlFor={inputId}>{label}</label>
        <input
          id={inputId}
          ref={ref}     // Передаём ref в DOM-элемент
          aria-invalid={!!error}
          {...rest}
        />
        {hint && <p className="hint">{hint}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

## Компонент Select

```tsx
import { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, id, ...rest }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="form-field">
        <label htmlFor={selectId}>{label}</label>
        <select
          id={selectId}
          ref={ref}
          aria-invalid={!!error}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Использование
<Select
  label="Страна"
  options={[
    { value: 'ru', label: 'Россия' },
    { value: 'by', label: 'Беларусь' },
    { value: 'kz', label: 'Казахстан' },
  ]}
  placeholder="Выберите страну"
  error="Выберите страну"
/>
```

## Компонент Checkbox

```tsx
import { forwardRef } from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, description, id, ...rest }, ref) => {
    const checkboxId = id || `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="form-checkbox">
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            aria-invalid={!!error}
            {...rest}
          />
          <label htmlFor={checkboxId}>{label}</label>
        </div>
        {description && <p className="checkbox-description">{description}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
```

## Группа радиокнопок

```tsx
import { forwardRef } from 'react';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
}: RadioGroupProps) {
  return (
    <fieldset className="form-radio-group">
      <legend className="radio-group-label">{label}</legend>
      {options.map((option) => (
        <label key={option.value} className="radio-option">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange?.(option.value)}
          />
          <span className="radio-label">{option.label}</span>
          {option.description && (
            <span className="radio-description">{option.description}</span>
          )}
        </label>
      ))}
      {error && <p className="error">{error}</p>}
    </fieldset>
  );
}

// Использование
<RadioGroup
  name="plan"
  label="Тарифный план"
  options={[
    { value: 'free', label: 'Бесплатный', description: 'До 5 проектов' },
    { value: 'pro', label: 'Pro', description: 'Неограниченно' },
    { value: 'enterprise', label: 'Enterprise', description: 'Корпоративное решение' },
  ]}
  value={plan}
  onChange={setPlan}
/>
```

## Компонент Textarea

```tsx
import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  showCharCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, showCharCount, maxLength, value, id, ...rest }, ref) => {
    const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className="form-field">
        <div className="field-header">
          <label htmlFor={textareaId}>{label}</label>
          {showCharCount && maxLength && (
            <span className={`char-count ${charCount > maxLength * 0.9 ? 'char-count--warning' : ''}`}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          maxLength={maxLength}
          value={value}
          aria-invalid={!!error}
          {...rest}
        />
        {hint && <p className="hint">{hint}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
```

## Кастомный DatePicker

Создание кастомного выбора даты:

```tsx
import { useState } from 'react';

interface DatePickerProps {
  label: string;
  value?: string; // YYYY-MM-DD
  onChange?: (date: string) => void;
  error?: string;
  min?: string;
  max?: string;
}

export function DatePicker({ label, value, onChange, error, min, max }: DatePickerProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`date-picker ${focused ? 'date-picker--focused' : ''}`}>
      <label>{label}</label>
      <div className="date-picker-wrapper">
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          min={min}
          max={max}
          aria-invalid={!!error}
        />
        <span className="calendar-icon" aria-hidden="true">📅</span>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

## Интеграция с React Hook Form через Controller

Для кастомных компонентов, которые нельзя просто «прокинуть» через `ref`, используем `Controller`:

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  country: z.string().min(1, 'Выберите страну'),
  plan: z.enum(['free', 'pro', 'enterprise']),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'Необходимо принять условия' }),
  }),
  bio: z.string().max(500, 'Максимум 500 символов').optional(),
});

type FormData = z.infer<typeof schema>;

function RegistrationForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log('Данные:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Компоненты с forwardRef — используем register напрямую */}
      <Input
        label="Имя"
        error={errors.name?.message}
        required
        {...register('name')}
      />

      <Input
        label="Email"
        type="email"
        error={errors.email?.message}
        required
        {...register('email')}
      />

      {/* Select с forwardRef */}
      <Select
        label="Страна"
        options={[
          { value: 'ru', label: 'Россия' },
          { value: 'by', label: 'Беларусь' },
        ]}
        placeholder="Выберите страну"
        error={errors.country?.message}
        {...register('country')}
      />

      {/* RadioGroup через Controller (нет forwardRef) */}
      <Controller
        name="plan"
        control={control}
        render={({ field }) => (
          <RadioGroup
            name="plan"
            label="Тарифный план"
            options={[
              { value: 'free', label: 'Бесплатный' },
              { value: 'pro', label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            value={field.value}
            onChange={field.onChange}
            error={errors.plan?.message}
          />
        )}
      />

      {/* Textarea с forwardRef */}
      <Textarea
        label="О себе"
        maxLength={500}
        showCharCount
        error={errors.bio?.message}
        {...register('bio')}
      />

      {/* Checkbox с forwardRef */}
      <Checkbox
        label="Принимаю условия использования"
        error={errors.agreeToTerms?.message}
        {...register('agreeToTerms')}
      />

      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

## Составной компонент FormField

Паттерн Compound Components позволяет создать гибкий FormField:

```tsx
import React, { createContext, useContext } from 'react';

interface FormFieldContextValue {
  id: string;
  error?: string;
}

const FormFieldContext = createContext<FormFieldContextValue>({ id: '' });

interface FormFieldProps {
  children: React.ReactNode;
  id?: string;
  error?: string;
}

// Корневой компонент
function FormField({ children, id = `field-${Math.random().toString(36).slice(2)}`, error }: FormFieldProps) {
  return (
    <FormFieldContext.Provider value={{ id, error }}>
      <div className={`form-field ${error ? 'form-field--error' : ''}`}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
}

// Подкомпоненты
FormField.Label = function FormFieldLabel({ children }: { children: React.ReactNode }) {
  const { id } = useContext(FormFieldContext);
  return <label htmlFor={id} className="form-label">{children}</label>;
};

FormField.Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => {
    const { id, error } = useContext(FormFieldContext);
    return (
      <input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        className={`form-input ${error ? 'form-input--error' : ''}`}
        {...props}
      />
    );
  }
);
FormField.Input.displayName = 'FormField.Input';

FormField.Error = function FormFieldError() {
  const { id, error } = useContext(FormFieldContext);
  if (!error) return null;
  return <p id={`${id}-error`} className="form-error" role="alert">{error}</p>;
};

FormField.Hint = function FormFieldHint({ children }: { children: React.ReactNode }) {
  const { id } = useContext(FormFieldContext);
  return <p id={`${id}-hint`} className="form-hint">{children}</p>;
};

// Использование составного компонента
function FlexibleForm() {
  return (
    <form>
      <FormField error="Email обязателен">
        <FormField.Label>Email *</FormField.Label>
        <FormField.Hint>Мы никогда не передаём ваш email третьим лицам</FormField.Hint>
        <FormField.Input type="email" placeholder="user@example.com" />
        <FormField.Error />
      </FormField>
    </form>
  );
}
```

## Компонент PasswordInput со скрытием/показом пароля

```tsx
import { useState, forwardRef } from 'react';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, id, ...rest }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || 'password-input';

    return (
      <div className="form-field password-field">
        <label htmlFor={inputId}>{label}</label>
        <div className="password-wrapper">
          <input
            id={inputId}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            aria-invalid={!!error}
            {...rest}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
```

## Индикатор надёжности пароля

```tsx
function PasswordStrengthIndicator({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);

  const levels = [
    { label: '', color: 'transparent' },
    { label: 'Очень слабый', color: '#ef4444' },
    { label: 'Слабый', color: '#f97316' },
    { label: 'Средний', color: '#eab308' },
    { label: 'Сильный', color: '#22c55e' },
    { label: 'Очень сильный', color: '#16a34a' },
  ];

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="strength-bars">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="strength-bar"
            style={{
              backgroundColor: level <= strength ? levels[strength].color : '#e5e7eb',
            }}
          />
        ))}
      </div>
      <span style={{ color: levels[strength].color }}>
        {levels[strength].label}
      </span>
    </div>
  );
}

// Используем совместно с PasswordInput
function SecurePasswordForm() {
  const { register, watch } = useForm();
  const password = watch('password', '');

  return (
    <form>
      <PasswordInput
        label="Пароль"
        {...register('password')}
      />
      <PasswordStrengthIndicator password={password} />
    </form>
  );
}
```

## Заключение

Создание переиспользуемых компонентов форм — это инвестиция, которая окупается по мере роста приложения. Ключевые принципы:

- **`forwardRef`** — обязателен для компонентов, которые должны работать с `ref` (React Hook Form, Formik)
- **Проброс пропсов** через `...rest` — делает компоненты гибкими и не ограничивает их использование
- **Доступность** — всегда добавляйте `htmlFor`/`id`, `aria-invalid`, `aria-describedby`
- **Единый контракт ошибок** — стандартный проп `error?: string` для отображения ошибок
- **`Controller` для кастомных компонентов** — когда `forwardRef` недостаточно или компонент имеет нестандартный интерфейс

Начните с простых компонентов (Input, Select, Checkbox) и постепенно добавляйте специализированные (DatePicker, PasswordInput, RadioGroup) по мере необходимости.
