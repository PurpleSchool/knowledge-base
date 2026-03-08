---
metaTitle: Типизация ref в React с TypeScript — useRef, forwardRef, useImperativeHandle
metaDescription: Подробное руководство по типизации ref в React с TypeScript. Разбираем useRef для DOM, forwardRef, useImperativeHandle и паттерны работы с ссылками
author: Олег Марков
title: Типизация ref в React с TypeScript
preview: Изучите правильную типизацию ref в React: useRef для DOM-элементов и мутабельных значений, forwardRef для передачи ссылок, useImperativeHandle для контроля API
---

## Введение

Работа с `ref` в React — важная часть разработки, когда нужен прямой доступ к DOM-элементам или хранение значений без вызова перерендера. TypeScript делает использование `ref` значительно безопаснее, предотвращая ошибки с несовместимыми типами элементов. В этой статье мы разберём все аспекты типизации `ref`.

## Три варианта useRef

Хук `useRef` имеет три разные перегрузки в TypeScript, каждая со своим поведением:

### 1. DOM ref (только чтение current)

Когда вы передаёте `null` как начальное значение и указываете тип DOM-элемента, TypeScript создаёт "иммутабельный" ref — вы не можете напрямую присвоить `ref.current`:

```tsx
import { useRef, useEffect } from 'react';

function FocusableInput() {
  // HTMLInputElement — тип DOM-элемента, null — начальное значение
  const inputRef = useRef<HTMLInputElement>(null);
  // Тип: React.RefObject<HTMLInputElement>
  // inputRef.current: HTMLInputElement | null (readonly)
  
  useEffect(() => {
    // Нужна проверка на null перед использованием
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Выделить весь текст
    }
  }, []);
  
  return <input ref={inputRef} type="text" placeholder="Введите текст..." />;
}
```

### 2. Мутабельный ref с типом

Когда начальное значение соответствует типу (не `null`), TypeScript создаёт полностью мутабельный ref:

```tsx
function Counter() {
  // Мутабельный ref — current: number
  const renderCountRef = useRef<number>(0);
  
  // Можно менять current напрямую без предупреждений
  renderCountRef.current += 1;
  
  return <div>Рендер #{renderCountRef.current}</div>;
}
```

### 3. Мутабельный ref с null

Когда вам нужен мутабельный ref, который может быть `null`:

```tsx
function AbortableRequest() {
  // Мутабельный ref — current: AbortController | null
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchData = async () => {
    // Отменяем предыдущий запрос если есть
    abortControllerRef.current?.abort();
    
    const controller = new AbortController();
    abortControllerRef.current = controller; // Мутация разрешена
    
    try {
      const response = await fetch('/api/data', {
        signal: controller.signal,
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Запрос отменён');
      }
    }
  };
  
  const cancelRequest = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };
  
  return (
    <div>
      <button onClick={fetchData}>Загрузить</button>
      <button onClick={cancelRequest}>Отменить</button>
    </div>
  );
}
```

## Типы DOM-элементов

TypeScript имеет полную иерархию типов для всех HTML-элементов. Вот наиболее часто используемые:

```tsx
// Текстовые поля
const inputRef = useRef<HTMLInputElement>(null);
const textareaRef = useRef<HTMLTextAreaElement>(null);

// Контейнеры
const divRef = useRef<HTMLDivElement>(null);
const spanRef = useRef<HTMLSpanElement>(null);
const sectionRef = useRef<HTMLElement>(null); // Общий тип

// Интерактивные элементы
const buttonRef = useRef<HTMLButtonElement>(null);
const selectRef = useRef<HTMLSelectElement>(null);
const formRef = useRef<HTMLFormElement>(null);
const anchorRef = useRef<HTMLAnchorElement>(null);

// Медиа
const videoRef = useRef<HTMLVideoElement>(null);
const audioRef = useRef<HTMLAudioElement>(null);
const imageRef = useRef<HTMLImageElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

// Таблицы
const tableRef = useRef<HTMLTableElement>(null);

// SVG
const svgRef = useRef<SVGSVGElement>(null);
const pathRef = useRef<SVGPathElement>(null);
```

## Практические примеры работы с DOM ref

### Автофокус и управление фокусом

```tsx
function LoginForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Фокус на первом поле при монтировании
    emailRef.current?.focus();
  }, []);
  
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };
  
  return (
    <form>
      <input
        ref={emailRef}
        type="email"
        placeholder="Email"
        onKeyDown={handleEmailKeyDown}
      />
      <input
        ref={passwordRef}
        type="password"
        placeholder="Пароль"
      />
      <button type="submit">Войти</button>
    </form>
  );
}
```

### Измерение размеров элемента

```tsx
import { useRef, useState, useEffect, useCallback } from 'react';

interface Dimensions {
  width: number;
  height: number;
  top: number;
  left: number;
}

function MeasuredBox() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  
  const measureBox = useCallback(() => {
    if (boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
      });
    }
  }, []);
  
  useEffect(() => {
    measureBox();
    
    const observer = new ResizeObserver(measureBox);
    if (boxRef.current) {
      observer.observe(boxRef.current);
    }
    
    return () => observer.disconnect();
  }, [measureBox]);
  
  return (
    <div>
      <div ref={boxRef} style={{ resize: 'both', overflow: 'auto', padding: '20px' }}>
        Измеряемый блок (перетащите угол для изменения размера)
      </div>
      {dimensions && (
        <p>
          Размер: {Math.round(dimensions.width)} × {Math.round(dimensions.height)} пикселей
        </p>
      )}
    </div>
  );
}
```

### Прокрутка к элементу

```tsx
function Chat({ messages }: { messages: { id: number; text: string; author: string }[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Прокрутка вниз при добавлении нового сообщения
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);
  
  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div ref={containerRef} style={{ height: '400px', overflow: 'auto' }}>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.author}:</strong> {msg.text}
        </div>
      ))}
      <div ref={bottomRef} />
      <button onClick={scrollToTop} style={{ position: 'sticky', bottom: 0 }}>
        Наверх
      </button>
    </div>
  );
}
```

## forwardRef — передача ref дочерним компонентам

`forwardRef` позволяет компоненту принимать `ref` от родителя и прикреплять его к DOM-элементу внутри.

### Базовое использование

```tsx
import { forwardRef, useRef } from 'react';

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

// forwardRef<ТипЭлемента, ТипПропсов>
const FormInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, placeholder, type = 'text', error, disabled, onChange }, ref) => {
    return (
      <div className="field">
        {label && <label className="field-label">{label}</label>}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`field-input ${error ? 'field-input--error' : ''}`}
          onChange={e => onChange?.(e.target.value)}
        />
        {error && <span className="field-error">{error}</span>}
      </div>
    );
  }
);

// displayName обязателен для DevTools
FormInput.displayName = 'FormInput';

// Использование
function RegistrationForm() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = () => {
    // Доступ к DOM через ref
    console.log(nameRef.current?.value, emailRef.current?.value);
  };
  
  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
      <FormInput ref={nameRef} label="Имя" placeholder="Введите имя" />
      <FormInput ref={emailRef} label="Email" type="email" placeholder="email@example.com" />
      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

### forwardRef с расширением HTML-атрибутов

```tsx
import { forwardRef, ComponentPropsWithRef } from 'react';

// Расширяем все нативные атрибуты input
interface EnhancedInputProps extends ComponentPropsWithRef<'input'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const EnhancedInput = forwardRef<HTMLInputElement, Omit<EnhancedInputProps, 'ref'>>(
  ({ label, error, leftIcon, rightIcon, className = '', ...nativeProps }, ref) => {
    return (
      <div className="enhanced-input">
        {label && <label>{label}</label>}
        <div className="enhanced-input__wrapper">
          {leftIcon && <span className="enhanced-input__icon enhanced-input__icon--left">{leftIcon}</span>}
          <input
            ref={ref}
            className={`enhanced-input__field ${error ? 'enhanced-input__field--error' : ''} ${className}`}
            {...nativeProps}
          />
          {rightIcon && <span className="enhanced-input__icon enhanced-input__icon--right">{rightIcon}</span>}
        </div>
        {error && <span className="enhanced-input__error">{error}</span>}
      </div>
    );
  }
);
EnhancedInput.displayName = 'EnhancedInput';
```

## useImperativeHandle — кастомный API через ref

`useImperativeHandle` позволяет определить, что именно будет доступно через `ref` снаружи компонента:

```tsx
import { forwardRef, useRef, useImperativeHandle } from 'react';

// Определяем тип публичного API компонента
interface ModalHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
}

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}

const Modal = forwardRef<ModalHandle, ModalProps>(({ title, children, onClose }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Определяем, что доступно через ref снаружи
  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => {
      setIsOpen(false);
      onClose?.();
    },
    toggle: () => setIsOpen(prev => !prev),
    isOpen,
  }), [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={() => { setIsOpen(false); onClose?.(); }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={() => { setIsOpen(false); onClose?.(); }}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
});
Modal.displayName = 'Modal';

// Использование — родитель управляет модальным окном через ref
function App() {
  const modalRef = useRef<ModalHandle>(null);
  
  return (
    <div>
      <button onClick={() => modalRef.current?.open()}>Открыть модальное окно</button>
      <button onClick={() => modalRef.current?.close()}>Закрыть</button>
      
      <Modal ref={modalRef} title="Пример модального окна">
        <p>Содержимое модального окна</p>
        <button onClick={() => modalRef.current?.close()}>ОК</button>
      </Modal>
    </div>
  );
}
```

### Пример с видеоплеером

```tsx
interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ src, poster, onPlay, onPause, onEnded }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      seekTo: (seconds: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = seconds;
        }
      },
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
      getDuration: () => videoRef.current?.duration ?? 0,
    }));
    
    return (
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        controls
      />
    );
  }
);
VideoPlayer.displayName = 'VideoPlayer';

// Использование
function VideoPage() {
  const playerRef = useRef<VideoPlayerHandle>(null);
  
  return (
    <div>
      <VideoPlayer ref={playerRef} src="/video.mp4" />
      <div>
        <button onClick={() => playerRef.current?.play()}>Воспроизвести</button>
        <button onClick={() => playerRef.current?.pause()}>Пауза</button>
        <button onClick={() => playerRef.current?.seekTo(30)}>+30 сек</button>
      </div>
    </div>
  );
}
```

## Хранение предыдущих значений

Классический паттерн с `useRef` для хранения предыдущего значения:

```tsx
function usePrevious<T>(value: T): T | undefined {
  const prevRef = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    prevRef.current = value;
  });
  
  return prevRef.current;
}

// Использование
function PriceDisplay({ price }: { price: number }) {
  const prevPrice = usePrevious(price);
  
  return (
    <div>
      <span>Цена: {price} ₽</span>
      {prevPrice !== undefined && (
        <span className={price > prevPrice ? 'price-up' : 'price-down'}>
          {price > prevPrice ? '↑' : '↓'} {Math.abs(price - prevPrice)} ₽
        </span>
      )}
    </div>
  );
}
```

## Лучшие практики

**1. Всегда проверяйте ref.current на null:**

```tsx
// Плохо — может быть ошибка runtime
inputRef.current.focus();

// Хорошо — безопасно
inputRef.current?.focus();

// Или с проверкой
if (inputRef.current) {
  inputRef.current.focus();
}
```

**2. Устанавливайте displayName для компонентов с forwardRef:**

```tsx
const MyInput = forwardRef<HTMLInputElement, InputProps>(...);
MyInput.displayName = 'MyInput'; // Обязательно!
```

**3. Используйте useImperativeHandle для ограничения публичного API:**

Не открывайте весь DOM-элемент через ref — определите минимальный необходимый API.

**4. Для хранения значений без перерендера используйте мутабельный ref:**

```tsx
// Для хранения предыдущего значения, флагов, таймеров — ref
const prevValueRef = useRef(initialValue);

// Для значений, влияющих на отображение — state
const [displayValue, setDisplayValue] = useState(initialValue);
```

## Заключение

Правильная типизация `ref` в React с TypeScript:

- Используйте `useRef<HTMLElement>(null)` для DOM-ссылок
- Используйте `useRef<Type>(initialValue)` для мутабельных значений
- `forwardRef<HTMLElement, Props>` для передачи ref в дочерние компоненты
- `useImperativeHandle` для создания минимального публичного API компонента
- Всегда проверяйте `ref.current` на null перед использованием
- Устанавливайте `displayName` для компонентов с `forwardRef`
