---
metaTitle: useImperativeHandle в React — настройка ref дочернего компонента
metaDescription: Полное руководство по useImperativeHandle в React: как кастомизировать ref, передаваемый родителю через forwardRef, практические примеры, TypeScript и лучшие практики
author: Олег Марков
title: useImperativeHandle в React — настройка ref дочернего компонента
preview: Узнайте, как использовать хук useImperativeHandle в React для управления тем, какие методы и свойства дочернего компонента доступны через ref родителю, и как это помогает создавать удобные компонентные API
---

## Введение

В React основной подход к взаимодействию между компонентами — это передача данных через props и обратные вызовы через callback-функции. Однако иногда родительскому компоненту нужно вызвать конкретное действие в дочернем — например, сфокусировать поле ввода, прокрутить список к определённому элементу или запустить анимацию. Именно для таких случаев существует хук `useImperativeHandle`.

Если вы хотите глубже изучить React и разобраться с хуками, рекомендую курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=useImperativeHandle) — там вы найдёте подробные объяснения и практические задания.

`useImperativeHandle` используется совместно с `forwardRef` и позволяет дочернему компоненту явно определить, какие методы и свойства будут доступны родителю через `ref`. Это своего рода «контракт» между компонентами: дочерний компонент сам решает, что именно открыть наружу, а что скрыть.

## Что такое useImperativeHandle и зачем он нужен

По умолчанию `ref` в React даёт доступ к реальному DOM-элементу. Если вы передадите `ref` на `<input>`, вы получите доступ ко всем его DOM-методам: `focus()`, `blur()`, `select()`, `scrollIntoView()` и многим другим. Однако это не всегда желательно.

Представьте, что вы создаёте компонент `CustomInput`. Вы хотите, чтобы родитель мог вызвать у него `focus()`, но не имел прямого доступа ко всему DOM-элементу. Или вы создаёте составной компонент — например, виртуальный список — и хотите предоставить родителю метод `scrollToIndex(n)`, которого нет в нативном DOM.

Именно здесь и нужен `useImperativeHandle`: он позволяет вам создать пользовательский объект, который будет присвоен `ref.current` родительского компонента.

### Проблема без useImperativeHandle

Без `useImperativeHandle` у вас есть два варианта:

```tsx
// Вариант 1: прямой доступ через forwardRef — родитель получает весь DOM-элемент
const CustomInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// В родителе:
inputRef.current?.focus(); // работает, но родитель имеет доступ ко ВСЕМУ DOM
inputRef.current?.value;   // тоже доступно — возможно, это лишнее
```

```tsx
// Вариант 2: никакого ref — нет возможности вызвать методы снаружи
const CustomInput = (props: Props) => {
  return <input {...props} />;
};
// Родитель не может программно управлять компонентом
```

`useImperativeHandle` предлагает золотую середину: вы решаете, что именно открыть.

## Синтаксис useImperativeHandle

```tsx
useImperativeHandle(ref, createHandle, dependencies?)
```

**Параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `ref` | `ForwardedRef<T>` | Ref, полученный от `forwardRef` |
| `createHandle` | `() => T` | Функция, возвращающая объект с методами и свойствами |
| `dependencies` | `any[]` | Необязательный массив зависимостей (как у `useEffect`) |

**Возвращаемое значение:** `undefined` — хук ничего не возвращает, он только изменяет значение `ref.current`.

## Базовый пример использования

Создадим компонент `CustomInput`, который предоставляет родителю методы `focus()` и `clear()`:

```tsx
import { forwardRef, useImperativeHandle, useRef } from 'react';

// Определяем тип handle — то, что увидит родитель через ref
interface CustomInputHandle {
  focus: () => void;
  clear: () => void;
}

interface CustomInputProps {
  placeholder?: string;
  defaultValue?: string;
}

// Используем forwardRef для получения ref от родителя
const CustomInput = forwardRef<CustomInputHandle, CustomInputProps>(
  ({ placeholder, defaultValue }, ref) => {
    // Внутренний ref на реальный DOM-элемент
    const inputRef = useRef<HTMLInputElement>(null);

    // Определяем, что именно видит родитель через ref
    useImperativeHandle(ref, () => ({
      focus() {
        inputRef.current?.focus(); // делегируем к реальному DOM
      },
      clear() {
        if (inputRef.current) {
          inputRef.current.value = ''; // очищаем поле
        }
      },
    }));

    return (
      <input
        ref={inputRef}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="custom-input"
      />
    );
  }
);

CustomInput.displayName = 'CustomInput';

export default CustomInput;
```

Теперь используем этот компонент в родителе:

```tsx
import { useRef } from 'react';
import CustomInput from './CustomInput';

// Импортируем тип handle для типизации ref
import type { CustomInputHandle } from './CustomInput'; // если вы экспортируете его

function ParentComponent() {
  const inputRef = useRef<CustomInputHandle>(null);

  const handleFocus = () => {
    inputRef.current?.focus(); // вызываем только то, что мы разрешили
  };

  const handleClear = () => {
    inputRef.current?.clear(); // вызываем только то, что мы разрешили
  };

  // inputRef.current?.value — это будет ошибка TypeScript! Мы не открыли value
  // inputRef.current?.select — это тоже ошибка! Нативный DOM скрыт

  return (
    <div>
      <CustomInput ref={inputRef} placeholder="Введите текст..." />
      <button onClick={handleFocus}>Сфокусировать</button>
      <button onClick={handleClear}>Очистить</button>
    </div>
  );
}
```

Обратите внимание: родитель может вызвать только `focus()` и `clear()`. Доступа к полному DOM-элементу у него нет — TypeScript это гарантирует.

## Использование с зависимостями

Третий аргумент `useImperativeHandle` — массив зависимостей — работает аналогично `useEffect`. Если передать его, функция `createHandle` будет вызвана заново только при изменении зависимостей.

```tsx
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

interface ListHandle {
  scrollToIndex: (index: number) => void;
  getSelectedIndices: () => number[];
}

interface VirtualListProps {
  items: string[];
}

const VirtualList = forwardRef<ListHandle, VirtualListProps>(
  ({ items }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<HTMLDivElement[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex(index: number) {
          // Прокручиваем к конкретному элементу списка
          itemRefs.current[index]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        },
        getSelectedIndices() {
          // Возвращаем текущие выбранные индексы
          return selectedIndices;
        },
      }),
      [selectedIndices] // пересоздаём handle при изменении selectedIndices
    );

    return (
      <div ref={containerRef} style={{ height: 300, overflowY: 'auto' }}>
        {items.map((item, index) => (
          <div
            key={index}
            ref={(el) => {
              if (el) itemRefs.current[index] = el;
            }}
            onClick={() =>
              setSelectedIndices((prev) =>
                prev.includes(index)
                  ? prev.filter((i) => i !== index)
                  : [...prev, index]
              )
            }
            style={{
              padding: '8px',
              background: selectedIndices.includes(index) ? '#e0f0ff' : 'transparent',
              cursor: 'pointer',
            }}
          >
            {item}
          </div>
        ))}
      </div>
    );
  }
);

VirtualList.displayName = 'VirtualList';
```

Использование:

```tsx
function App() {
  const listRef = useRef<ListHandle>(null);

  const handleScrollToLast = () => {
    listRef.current?.scrollToIndex(items.length - 1);
  };

  const handleShowSelected = () => {
    const indices = listRef.current?.getSelectedIndices() ?? [];
    alert(`Выбраны элементы: ${indices.join(', ')}`);
  };

  const items = Array.from({ length: 100 }, (_, i) => `Элемент ${i + 1}`);

  return (
    <div>
      <VirtualList ref={listRef} items={items} />
      <button onClick={handleScrollToLast}>Перейти к последнему</button>
      <button onClick={handleShowSelected}>Показать выбранные</button>
    </div>
  );
}
```

## Практический пример: форма с управляемой валидацией

Рассмотрим реальный сценарий — компонент формы, который родитель может принудительно валидировать и сбрасывать:

```tsx
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

interface FormHandle {
  validate: () => boolean;
  reset: () => void;
  getValues: () => { name: string; email: string };
}

const ContactForm = forwardRef<FormHandle, {}>((_, ref) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  // Логика валидации внутри компонента
  const validateForm = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Имя обязательно для заполнения';
    }

    if (!email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Введите корректный email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true если нет ошибок
  };

  // Открываем только нужные методы родителю
  useImperativeHandle(ref, () => ({
    validate() {
      return validateForm(); // родитель может запустить валидацию
    },
    reset() {
      setName('');         // сбрасываем все поля
      setEmail('');
      setErrors({});
    },
    getValues() {
      return { name, email }; // возвращаем текущие значения
    },
  }));

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div>
        <label>Имя:</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ borderColor: errors.name ? 'red' : undefined }}
        />
        {errors.name && <span style={{ color: 'red' }}>{errors.name}</span>}
      </div>

      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ borderColor: errors.email ? 'red' : undefined }}
        />
        {errors.email && <span style={{ color: 'red' }}>{errors.email}</span>}
      </div>
    </form>
  );
});

ContactForm.displayName = 'ContactForm';
```

```tsx
// Родительский компонент — управляет несколькими шагами
function MultiStepForm() {
  const formRef = useRef<FormHandle>(null);

  const handleNextStep = () => {
    const isValid = formRef.current?.validate();

    if (isValid) {
      const values = formRef.current?.getValues();
      console.log('Данные формы:', values);
      // Переходим к следующему шагу
    }
  };

  const handleReset = () => {
    formRef.current?.reset(); // сбрасываем форму при необходимости
  };

  return (
    <div>
      <h2>Шаг 1: Контактные данные</h2>
      <ContactForm ref={formRef} />
      <div style={{ marginTop: 16 }}>
        <button onClick={handleReset}>Сбросить</button>
        <button onClick={handleNextStep}>Далее</button>
      </div>
    </div>
  );
}
```

## Использование с TypeScript

TypeScript позволяет строго типизировать handle, что делает `useImperativeHandle` ещё более мощным инструментом. Лучшая практика — экспортировать тип handle отдельно, чтобы родитель мог его использовать:

```tsx
// CustomModal.tsx

// Экспортируем тип — родитель импортирует его для типизации ref
export interface CustomModalHandle {
  open: () => void;
  close: () => void;
  setTitle: (title: string) => void;
}

interface CustomModalProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export const CustomModal = forwardRef<CustomModalHandle, CustomModalProps>(
  ({ children, onClose }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitleState] = useState('');

    useImperativeHandle(ref, () => ({
      open() {
        setIsOpen(true);
      },
      close() {
        setIsOpen(false);
        onClose?.(); // вызываем callback если он передан
      },
      setTitle(newTitle: string) {
        setTitleState(newTitle);
      },
    }));

    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal">
          {title && <h2>{title}</h2>}
          <div className="modal-content">{children}</div>
          <button onClick={() => {
            setIsOpen(false);
            onClose?.();
          }}>
            Закрыть
          </button>
        </div>
      </div>
    );
  }
);

CustomModal.displayName = 'CustomModal';
```

```tsx
// ParentComponent.tsx
import { CustomModal, CustomModalHandle } from './CustomModal';

function ParentComponent() {
  // TypeScript знает точный тип ref
  const modalRef = useRef<CustomModalHandle>(null);

  const handleShowConfirmation = () => {
    modalRef.current?.setTitle('Подтверждение действия');
    modalRef.current?.open();
    // Автодополнение работает — IDE подсказывает только open, close, setTitle
  };

  return (
    <div>
      <button onClick={handleShowConfirmation}>Показать модалку</button>
      <CustomModal ref={modalRef} onClose={() => console.log('Modal closed')}>
        <p>Вы уверены, что хотите продолжить?</p>
      </CustomModal>
    </div>
  );
}
```

## Распространённые ошибки

### Ошибка 1: Забыть forwardRef

`useImperativeHandle` без `forwardRef` не имеет смысла — у вас не будет ref для передачи в хук:

```tsx
// ПЛОХО: нет forwardRef, ref не будет работать
const BadComponent = (props: Props) => {
  useImperativeHandle(???, () => ({ // куда передать ref?
    focus() {}
  }));
  return <div />;
};

// ПРАВИЛЬНО: всегда используйте forwardRef вместе с useImperativeHandle
const GoodComponent = forwardRef<Handle, Props>((props, ref) => {
  useImperativeHandle(ref, () => ({
    focus() {}
  }));
  return <div />;
});
```

### Ошибка 2: Передавать весь DOM-элемент, теряя смысл хука

```tsx
// ПЛОХО: открываем всё — теряем контроль над инкапсуляцией
useImperativeHandle(ref, () => inputRef.current!);

// ПРАВИЛЬНО: открываем только нужные методы
useImperativeHandle(ref, () => ({
  focus: () => inputRef.current?.focus(),
  blur: () => inputRef.current?.blur(),
}));
```

### Ошибка 3: Забыть зависимости при использовании замыканий

```tsx
const [count, setCount] = useState(0);

// ПЛОХО: getCount всегда вернёт начальное значение 0 из-за устаревшего замыкания
useImperativeHandle(ref, () => ({
  getCount: () => count,
})); // нет массива зависимостей — handle создаётся один раз

// ПРАВИЛЬНО: указываем count в зависимостях
useImperativeHandle(ref, () => ({
  getCount: () => count,
}), [count]); // handle пересоздаётся при изменении count
```

## Когда использовать useImperativeHandle

`useImperativeHandle` — это инструмент выхода за рамки декларативной парадигмы React. Используйте его только тогда, когда другие подходы не подходят:

| Сценарий | Рекомендация |
|----------|-------------|
| Управление фокусом поля ввода из родителя | ✅ useImperativeHandle |
| Прокрутка списка к элементу по индексу | ✅ useImperativeHandle |
| Запуск анимации в дочернем компоненте | ✅ useImperativeHandle |
| Запуск медиаплеера (play/pause/seek) | ✅ useImperativeHandle |
| Передача данных от родителя к потомку | ❌ Используйте props |
| Передача событий от потомка к родителю | ❌ Используйте callback props |
| Общее состояние нескольких компонентов | ❌ Используйте useState / Context / store |
| Простое чтение значения поля | ❌ Используйте controlled component |

## Заключение

`useImperativeHandle` — мощный, но специализированный хук. Он даёт вам возможность создать чёткий публичный API для дочернего компонента, скрыв детали реализации. Совместно с `forwardRef` и TypeScript это позволяет строить компоненты с предсказуемым поведением и надёжными контрактами.

Ключевые моменты для запоминания:
- Всегда используйте `useImperativeHandle` вместе с `forwardRef`
- Открывайте только то, что действительно нужно родителю
- Используйте зависимости, если handle зависит от состояния или props
- Предпочитайте декларативный подход — `useImperativeHandle` нужен лишь для специфических сценариев

Чтобы освоить все аспекты работы с хуками в React и научиться применять их в реальных проектах, рекомендую курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=useImperativeHandle).

## Частозадаваемые технические вопросы по теме useImperativeHandle

### Можно ли использовать useImperativeHandle без forwardRef?

Нет. `useImperativeHandle` принимает первым аргументом `ref`, полученный от `forwardRef`. Без `forwardRef` у вас не будет этого `ref`, и хук не будет иметь смысла. В React 19 появились изменения в работе с ref, но для `useImperativeHandle` `forwardRef` по-прежнему требуется в большинстве версий.

### Как обновить handle при изменении состояния?

Передайте значения состояния в массив зависимостей третьим аргументом:

```tsx
const [value, setValue] = useState('');

useImperativeHandle(ref, () => ({
  getValue: () => value, // замыкание над value
}), [value]); // handle пересоздаётся при изменении value
```

### Можно ли использовать useImperativeHandle с несколькими ref?

В одном вызове `useImperativeHandle` — нет. Но можно вызвать хук несколько раз с разными ref (например, если компонент принимает несколько forwarded refs через разные props):

```tsx
const Component = forwardRef<Handle, Props>((props, ref) => {
  const internalRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToTop: () => internalRef.current?.scrollTo(0, 0),
  }));

  return <div ref={internalRef} />;
});
```

### Как протестировать компонент с useImperativeHandle?

В тестах используйте `React Testing Library` с `createRef` или `useRef`:

```tsx
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { CustomInput, CustomInputHandle } from './CustomInput';

test('focus метод фокусирует поле', () => {
  const ref = createRef<CustomInputHandle>();
  render(<CustomInput ref={ref} />);

  // Вызываем метод через ref
  ref.current?.focus();

  // Проверяем результат
  expect(document.activeElement).toBe(
    document.querySelector('input')
  );
});
```

### Влияет ли useImperativeHandle на производительность?

Сам хук очень лёгкий — он просто присваивает объект `ref.current`. Без массива зависимостей handle пересоздаётся при каждом рендере. Чтобы избежать лишних пересозданий, передавайте пустой массив `[]`, если handle не зависит от состояния, или перечисляйте зависимости явно.
