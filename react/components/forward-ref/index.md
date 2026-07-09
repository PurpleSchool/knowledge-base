---
metaTitle: "React forwardRef: передача рефов дочерним компонентам"
metaDescription: "Как использовать forwardRef в React для передачи рефов дочерним компонентам. Примеры с TypeScript, useImperativeHandle и реальные сценарии применения."
author: "Антон Ларичев"
title: "React forwardRef — передача рефов дочерним компонентам"
preview: "Разбираем forwardRef: зачем он нужен, как работает и как правильно типизировать рефы в TypeScript."
---

## Зачем нужен forwardRef

В React рефы (`ref`) — это способ получить прямой доступ к DOM-элементу или к экземпляру компонента. Когда вы создаёте реф через `useRef` и передаёте его в JSX-атрибут `ref`, React сам подключает его к нужному узлу.

Проблема возникает, когда вы хотите передать реф в **пользовательский компонент**, а не напрямую в DOM-элемент. По умолчанию React не проксирует `ref` внутрь компонента — он зарезервирован и недоступен через `props`.

```javascript
function Input(props) {
  // props.ref здесь undefined — реф не пробрасывается
  return <input {...props} />;
}

function Form() {
  const inputRef = useRef(null);

  return <Input ref={inputRef} />; // ref до Input не дойдёт
}
```

Для решения этой проблемы React предоставляет `forwardRef` — обёртку, которая явно указывает, что компонент умеет принимать и пробрасывать `ref`.

## Базовый синтаксис

`forwardRef` принимает функцию рендера с двумя аргументами: `props` и `ref`. Внутри функции вы можете прикрепить полученный `ref` к любому DOM-элементу или другому компоненту.

```javascript
import { forwardRef, useRef } from 'react';

const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} {...props} />;
});

function Form() {
  const inputRef = useRef(null);

  function handleFocus() {
    inputRef.current.focus();
  }

  return (
    <>
      <Input ref={inputRef} placeholder="Введите текст" />
      <button onClick={handleFocus}>Сфокусировать</button>
    </>
  );
}
```

Теперь `inputRef.current` указывает на DOM-элемент `<input>` внутри компонента `Input`. Родитель получает прямой доступ к нему.

## Как это работает под капотом

`forwardRef` возвращает React-компонент с особым типом (`$$typeof: REACT_FORWARD_REF_TYPE`). При монтировании React видит этот тип и передаёт `ref` вторым аргументом в функцию рендера, а не помещает его в `props`.

Важно понимать: `ref` из `forwardRef` — это не обычный prop. Он не попадает в объект `props` и не виден снаружи через деструктуризацию. Это намеренное разделение ответственности.

## Использование с TypeScript

При работе с TypeScript `forwardRef` требует явной типизации через два дженерик-параметра: тип элемента (куда прикрепляется реф) и тип props.

```typescript
import { forwardRef, useRef } from 'react';

interface InputProps {
  placeholder?: string;
  disabled?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { placeholder, disabled, onChange },
  ref
) {
  return (
    <input
      ref={ref}
      placeholder={placeholder}
      disabled={disabled}
      onChange={onChange}
    />
  );
});

function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    if (inputRef.current) {
      console.log('Значение:', inputRef.current.value);
    }
  }

  return (
    <>
      <Input ref={inputRef} placeholder="Имя пользователя" />
      <button onClick={handleSubmit}>Отправить</button>
    </>
  );
}
```

Первый дженерик `HTMLInputElement` определяет тип, к которому будет привязан реф. Второй дженерик `InputProps` — интерфейс props компонента. TypeScript проверит совместимость при использовании `inputRef.current`.

## Стрелочные функции с forwardRef

Альтернативный стиль — стрелочная функция. Компонент при этом получает имя через `displayName`, что важно для удобочитаемости в React DevTools.

```typescript
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

Input.displayName = 'Input';
```

Без `displayName` в DevTools компонент отображается как `ForwardRef`, что затрудняет отладку. Всегда устанавливайте `displayName` при использовании анонимных стрелочных функций.

## useImperativeHandle — управление тем, что видит родитель

По умолчанию `forwardRef` раскрывает весь DOM-узел. Иногда нужно ограничить API: предоставить только определённые методы, скрыв детали реализации. Для этого используют `useImperativeHandle`.

```typescript
import { forwardRef, useRef, useImperativeHandle } from 'react';

interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
}

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer({ src }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
      play() {
        videoRef.current?.play();
      },
      pause() {
        videoRef.current?.pause();
      },
      seek(seconds: number) {
        if (videoRef.current) {
          videoRef.current.currentTime = seconds;
        }
      },
    }));

    return <video ref={videoRef} src={src} />;
  }
);

function App() {
  const playerRef = useRef<VideoPlayerHandle>(null);

  return (
    <>
      <VideoPlayer ref={playerRef} src="/video.mp4" />
      <button onClick={() => playerRef.current?.play()}>Воспроизвести</button>
      <button onClick={() => playerRef.current?.pause()}>Пауза</button>
      <button onClick={() => playerRef.current?.seek(30)}>+30 сек</button>
    </>
  );
}
```

Теперь родитель видит только три метода (`play`, `pause`, `seek`). Весь DOM-узел `<video>` скрыт — инкапсуляция соблюдена. Обратите внимание: тип рефа в родителе — `VideoPlayerHandle`, а не `HTMLVideoElement`.

### Третий аргумент useImperativeHandle — зависимости

`useImperativeHandle` принимает необязательный третий аргумент — массив зависимостей, аналогично `useEffect`. Если объект дескриптора зависит от props или state, укажите их.

```typescript
useImperativeHandle(
  ref,
  () => ({
    focus() {
      inputRef.current?.focus();
    },
  }),
  [] // пересоздавать объект не нужно — методы не зависят от переменных
);
```

## Практические сценарии применения

### Управление фокусом в составных компонентах

Когда форма содержит кастомный компонент поля ввода, родителю часто нужно управлять фокусом — например, после ошибки валидации.

```typescript
const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, ...inputProps }, ref) {
    return (
      <div className="field">
        <label>{label}</label>
        <input ref={ref} className={error ? 'error' : ''} {...inputProps} />
        {error && <span className="error-text">{error}</span>}
      </div>
    );
  }
);

function RegistrationForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = useState('');

  function validate() {
    if (!emailRef.current?.value.includes('@')) {
      setEmailError('Введите корректный email');
      emailRef.current?.focus(); // фокус на поле с ошибкой
    }
  }

  return (
    <form>
      <TextField
        ref={emailRef}
        label="Email"
        type="email"
        error={emailError}
      />
      <button type="button" onClick={validate}>
        Проверить
      </button>
    </form>
  );
}
```

### Интеграция с анимационными библиотеками

Библиотеки вроде GSAP или Framer Motion требуют прямого доступа к DOM-узлам для управления анимациями.

```typescript
import { forwardRef, useRef, useEffect } from 'react';
import gsap from 'gsap';

const AnimatedCard = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  function AnimatedCard({ children }, ref) {
    return (
      <div ref={ref} className="card">
        {children}
      </div>
    );
  }
);

function Gallery() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 50,
        duration: 0.6,
      });
    }
  }, []);

  return (
    <AnimatedCard ref={cardRef}>
      <p>Контент карточки</p>
    </AnimatedCard>
  );
}
```

### Цепочка рефов через несколько уровней

Если нужно передать реф через несколько уровней компонентов, каждый промежуточный компонент должен использовать `forwardRef`.

```typescript
const BaseInput = forwardRef<HTMLInputElement, InputProps>(
  function BaseInput(props, ref) {
    return <input ref={ref} className="base-input" {...props} />;
  }
);

const StyledInput = forwardRef<HTMLInputElement, InputProps>(
  function StyledInput(props, ref) {
    // передаём ref дальше в BaseInput
    return <BaseInput ref={ref} className="styled-input" {...props} />;
  }
);

function Page() {
  const ref = useRef<HTMLInputElement>(null);
  // ref.current укажет на <input> внутри BaseInput
  return <StyledInput ref={ref} />;
}
```

## Распространённые ошибки

### Забыть forwardRef при передаче ref

Если передать `ref` в компонент без `forwardRef`, React выдаст предупреждение в режиме разработки, а `ref.current` останется `null`.

```javascript
// Неправильно — ref не дойдёт до input
function Input(props) {
  return <input {...props} />;
}

// Правильно
const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} {...props} />;
});
```

### Не использовать ref из forwardRef

Получить `ref` вторым аргументом — лишь половина дела. Его нужно передать в JSX.

```javascript
// Неправильно — ref принят, но не использован
const Input = forwardRef(function Input(props, ref) {
  return <input {...props} />; // ref потерян
});

// Правильно
const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} {...props} />;
});
```

### Мутировать ref напрямую без useImperativeHandle

Если вы хотите предоставить кастомный API через реф, делайте это через `useImperativeHandle`, а не присваивая `ref.current` вручную. Прямая мутация нарушает контракт React.

```javascript
// Неправильно
const Modal = forwardRef(function Modal(props, ref) {
  const [isOpen, setIsOpen] = useState(false);
  // Не делайте так — присвоение ref.current напрямую
  if (ref) ref.current = { open: () => setIsOpen(true) };
  return isOpen ? <div>...</div> : null;
});

// Правильно
const Modal = forwardRef(function Modal(props, ref) {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open() { setIsOpen(true); },
    close() { setIsOpen(false); },
  }));

  return isOpen ? <div>...</div> : null;
});
```

## forwardRef и React 19

В React 19 `forwardRef` объявлен устаревшим. Начиная с этой версии, `ref` передаётся как обычный prop и доступен в `props.ref`. Это упрощает код.

```javascript
// React 19 — ref как обычный prop
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

// Использование — без изменений
function Form() {
  const inputRef = useRef(null);
  return <Input ref={inputRef} />;
}
```

Если вы работаете с React 18 и ниже, `forwardRef` остаётся единственным способом пробросить `ref`. При обновлении на React 19 можно постепенно убирать `forwardRef` — обратная совместимость сохраняется, но появятся предупреждения о депрекации.

## Итого

`forwardRef` решает конкретную задачу: позволяет родительскому компоненту получить прямой доступ к DOM-узлу или кастомному API внутри дочернего компонента. Используйте его, когда:

- Вам нужно управлять фокусом, скроллом или воспроизведением из родителя.
- Вы интегрируете сторонние библиотеки, требующие прямого доступа к DOM.
- Вы строите переиспользуемую библиотеку компонентов, где пользователи рассчитывают работать с рефами.

Сочетайте `forwardRef` с `useImperativeHandle`, когда хотите скрыть детали реализации и предоставить чистый публичный API вместо голого DOM-узла.

Чтобы глубоко разобраться в React, его хуках и паттернах работы с компонентами, пройдите курс на PurpleSchool: [React — полный курс](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=forwardref).