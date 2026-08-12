---
metaTitle: "React 19: ref как проп без forwardRef"
metaDescription: "Как в React 19 передавать ref как обычный проп без forwardRef. Примеры, миграция с forwardRef, отличия от предыдущих версий."
author: "Антон Ларичев"
title: "React 19: ref как проп без forwardRef"
preview: "React 19 упрощает работу с рефами: теперь ref можно передавать как обычный проп без обёртки forwardRef."
---

В React 19 появилось одно из самых ожидаемых упрощений API: функциональные компоненты теперь принимают `ref` как обычный проп, без необходимости оборачивать компонент в `forwardRef`. Это делает код чище, уменьшает вложенность и устраняет один из главных источников путаницы у разработчиков.

## Проблема с ref до React 19

До React 19 передать реф во вложенный компонент было нетривиальной задачей. `ref` не попадал в `props` — React обрабатывал его особым образом и не передавал дальше. Чтобы дочерний компонент мог получить реф от родителя, нужно было использовать `forwardRef`.

### Как работал forwardRef

```tsx
import { forwardRef, useRef } from 'react';

const Input = forwardRef<HTMLInputElement, { placeholder?: string }>(
  ({ placeholder }, ref) => {
    return <input ref={ref} placeholder={placeholder} />;
  }
);

function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <Input ref={inputRef} placeholder="Введите текст" />
      <button onClick={handleFocus}>Сфокусировать</button>
    </div>
  );
}
```

Проблемы подхода с `forwardRef`:

- **Дополнительная обёртка** — каждый компонент, принимающий реф, нужно оборачивать в `forwardRef`, даже если это простой компонент
- **Сложность типизации** — в TypeScript нужно указывать два дженерика: тип рефа и тип пропсов
- **Изменение сигнатуры** — функция принимает `(props, ref)` вместо привычного `(props)`, что сбивает с толку
- **Читаемость** — структура кода усложняется без реальной необходимости
- **Отображение в DevTools** — компоненты с `forwardRef` отображались как `ForwardRef(ComponentName)`, что затрудняло отладку

## Ref как проп в React 19

Starting with React 19, `ref` becomes a regular prop for function components. You can destructure it directly from the props object just like any other prop.

```tsx
import { useRef } from 'react';

function Input({ placeholder, ref }: {
  placeholder?: string;
  ref?: React.Ref<HTMLInputElement>;
}) {
  return <input ref={ref} placeholder={placeholder} />;
}

function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <Input ref={inputRef} placeholder="Введите текст" />
      <button onClick={handleFocus}>Сфокусировать</button>
    </div>
  );
}
```

Никаких обёрток, никаких специальных сигнатур. Компонент остаётся обычной функцией, принимающей объект пропсов.

## Детальное сравнение подходов

Рассмотрим реальный пример: кастомный компонент кнопки, которую нужно программно фокусировать.

### React 18 и ниже — с forwardRef

```tsx
import { forwardRef, useRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant}`}
        disabled={loading}
        {...rest}
      >
        {loading ? 'Загрузка...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Использование
function Page() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <form onSubmit={() => buttonRef.current?.focus()}>
      <Button ref={buttonRef} variant="primary">
        Отправить
      </Button>
    </form>
  );
}
```

### React 19 — ref как обычный проп

```tsx
import { useRef, ButtonHTMLAttributes, Ref } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

function Button({ variant = 'primary', loading = false, children, ref, ...rest }: ButtonProps) {
  return (
    <button
      ref={ref}
      className={`btn btn-${variant}`}
      disabled={loading}
      {...rest}
    >
      {loading ? 'Загрузка...' : children}
    </button>
  );
}

// Использование идентично
function Page() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <form onSubmit={() => buttonRef.current?.focus()}>
      <Button ref={buttonRef} variant="primary">
        Отправить
      </Button>
    </form>
  );
}
```

Код стал короче и понятнее. Больше не нужны `Button.displayName` — имя компонента подставляется автоматически из имени функции.

## Типизация ref в TypeScript

Для корректной типизации используйте `React.Ref<T>` из пакета React. Тип `Ref<T>` является объединением `RefObject<T>`, `RefCallback<T>` и `null`.

```tsx
import { Ref } from 'react';

// Для DOM-элементов
interface InputProps {
  ref?: Ref<HTMLInputElement>;
  value?: string;
  onChange?: (value: string) => void;
}

function Input({ ref, value, onChange }: InputProps) {
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
```

Если вы хотите принять только `RefObject` (без колбэков), используйте `React.RefObject<T>`:

```tsx
import { RefObject } from 'react';

interface CanvasProps {
  ref?: RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
}
```

Для компонентов, где реф опционален, просто добавьте `?` к типу — React корректно обработает `undefined`.

## Передача ref через несколько уровней

Один из реальных сценариев — когда нужно передать реф через несколько компонентов. С новым подходом это решается естественно:

```tsx
import { useRef, Ref } from 'react';

interface TextFieldProps {
  label: string;
  ref?: Ref<HTMLInputElement>;
}

function TextField({ label, ref }: TextFieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      <input ref={ref} type="text" />
    </div>
  );
}

interface FormFieldProps {
  fieldRef?: Ref<HTMLInputElement>;
  label: string;
}

function FormField({ fieldRef, label }: FormFieldProps) {
  return (
    <div className="form-field">
      <TextField label={label} ref={fieldRef} />
    </div>
  );
}

function SearchForm() {
  const searchRef = useRef<HTMLInputElement>(null);

  const focusSearch = () => {
    searchRef.current?.focus();
    searchRef.current?.select();
  };

  return (
    <div>
      <FormField label="Поиск" fieldRef={searchRef} />
      <button onClick={focusSearch}>Очистить и сфокусировать</button>
    </div>
  );
}
```

Обратите внимание: когда реф передаётся как обычный проп (не под именем `ref`), ограничений нет — это работало и до React 19. Новинка в том, что теперь `ref` можно использовать именно под именем `ref` без `forwardRef`.

## Использование useImperativeHandle

`useImperativeHandle` позволяет контролировать, что именно будет доступно через реф. В React 19 он тоже упрощается:

```tsx
import { useRef, useImperativeHandle, Ref } from 'react';

interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
}

interface VideoPlayerProps {
  src: string;
  ref?: Ref<VideoPlayerHandle>;
}

function VideoPlayer({ src, ref }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seek: (seconds: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = seconds;
      }
    },
  }));

  return <video ref={videoRef} src={src} />;
}

function App() {
  const playerRef = useRef<VideoPlayerHandle>(null);

  return (
    <div>
      <VideoPlayer ref={playerRef} src="/video.mp4" />
      <button onClick={() => playerRef.current?.play()}>Играть</button>
      <button onClick={() => playerRef.current?.pause()}>Пауза</button>
      <button onClick={() => playerRef.current?.seek(30)}>+30 сек</button>
    </div>
  );
}
```

Логика та же, что и с `forwardRef`, но без лишней обёртки.

## Миграция с forwardRef на новый синтаксис

React 19 сохраняет обратную совместимость — код с `forwardRef` продолжает работать, но в консоли появится предупреждение об устаревании. Миграция прямолинейна:

**Шаг 1.** Разверните обёртку `forwardRef` и превратите компонент обратно в обычную функцию.

**Шаг 2.** Переместите `ref` из второго аргумента в объект пропсов.

**Шаг 3.** Добавьте `ref` в интерфейс пропсов с типом `Ref<T>`.

**Шаг 4.** Удалите `Component.displayName = 'Component'` — теперь имя берётся из имени функции автоматически.

```tsx
// До: React 18
const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ text, children }, ref) => (
    <div ref={ref} title={text}>{children}</div>
  )
);
Tooltip.displayName = 'Tooltip';

// После: React 19
function Tooltip({ text, children, ref }: TooltipProps & { ref?: Ref<HTMLDivElement> }) {
  return <div ref={ref} title={text}>{children}</div>;
}
```

## Ограничения и важные детали

Несколько моментов, о которых стоит знать:

**Только функциональные компоненты.** Классовые компоненты по-прежнему не принимают `ref` как проп — для них механизм не изменился. Но поскольку классовые компоненты уже давно не рекомендуются к использованию, это не является практическим ограничением.

**Ref не сериализуется.** Как и раньше, `ref` нельзя передать через контекст как обычные данные или сериализовать в JSON. Это системный объект React.

**Callback refs работают без изменений.** Вы можете передавать как `useRef`-объект, так и колбэк-функцию:

```tsx
function Parent() {
  const handleRef = (node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
    }
  };

  return <Input ref={handleRef} />;
}
```

**Устаревание forwardRef.** Начиная с React 19, `forwardRef` помечен как deprecated. React-команда планирует удалить его в следующих мажорных версиях. Не начинайте новые проекты с использованием `forwardRef`, если уже используете React 19.

## Практический пример: библиотека UI-компонентов

Посмотрим, как новый подход упрощает создание набора базовых компонентов:

```tsx
import { InputHTMLAttributes, Ref } from 'react';

interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
  label?: string;
  error?: string;
}

function BaseInput({ label, error, ref, id, ...props }: BaseInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="input-wrapper">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        ref={ref}
        className={error ? 'input input--error' : 'input'}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="input__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

// Использование в форме
import { useRef, useState } from 'react';

function RegistrationForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validate = () => {
    const email = emailRef.current?.value ?? '';
    const password = passwordRef.current?.value ?? '';
    const newErrors = { email: '', password: '' };

    if (!email.includes('@')) {
      newErrors.email = 'Введите корректный email';
      emailRef.current?.focus();
    } else if (password.length < 8) {
      newErrors.password = 'Пароль должен быть не менее 8 символов';
      passwordRef.current?.focus();
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); validate(); }}>
      <BaseInput
        ref={emailRef}
        label="Email"
        type="email"
        error={errors.email}
      />
      <BaseInput
        ref={passwordRef}
        label="Пароль"
        type="password"
        error={errors.password}
      />
      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

Код компонента `BaseInput` стал компактнее и читается как обычный React-компонент — никаких специальных паттернов, которые нужно объяснять новым членам команды.

## Итог

Изменение в React 19 небольшое по объёму, но значительное по влиянию на повседневный код. Убирается один из «особых случаев» React, который всегда вызывал вопросы у новичков и лишний шаблонный код у опытных разработчиков.

Ключевые выводы:
- `ref` теперь — обычный проп функциональных компонентов
- `forwardRef` устарел и будет удалён в будущих версиях
- Типизация упрощается: добавьте `ref?: Ref<T>` в интерфейс пропсов
- `useImperativeHandle` продолжает работать без изменений
- Миграция существующего кода прямолинейна и безопасна

Чтобы освоить React 19 и современные паттерны разработки на практике, приходите на курс по React на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=ref-as-prop-react-19