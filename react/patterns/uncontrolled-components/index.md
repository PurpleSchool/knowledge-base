---
metaTitle: "Неконтролируемые компоненты в React — паттерн Uncontrolled Components"
metaDescription: "Разбираем паттерн неконтролируемых компонентов: использование useRef, FormData API, defaultValue и сценарии, когда DOM как источник истины эффективнее состояния React."
author: "Олег Марков"
title: "Uncontrolled Components: когда DOM управляет данными"
preview: "Иногда state — это лишнее. Узнайте, как использовать неконтролируемые компоненты для оптимизации производительности форм, работы с файлами и бесшовной интеграции сторонних DOM-библиотек."
---

# Uncontrolled Components — паттерн неконтролируемых компонентов

## Введение

**Неконтролируемые компоненты** (Uncontrolled Components) — это паттерн в React, при котором форма или элемент ввода управляются непосредственно DOM, а не состоянием React. Вместо того чтобы подписываться на каждое изменение через `onChange` и `state`, компонент обращается к значению напрямую через `ref` — только тогда, когда оно действительно нужно.

Ключевой принцип: **DOM является источником истины (source of truth)** для значения поля ввода.

```jsx
// Неконтролируемый компонент — DOM управляет значением
function LoginForm() {
  const emailRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Читаем значение из DOM только в момент отправки
    console.log('Email:', emailRef.current.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={emailRef}           // Доступ к DOM-узлу через ref
        defaultValue=""          // Начальное значение задаётся один раз
        type="email"
      />
      <button type="submit">Войти</button>
    </form>
  );
}
```

Этот подход позволяет обойтись без постоянного отслеживания каждого нажатия клавиши — React «заглядывает» в DOM только по необходимости.

## Controlled vs Uncontrolled — ключевые отличия

Понять неконтролируемые компоненты легче в сравнении с контролируемыми:

| Аспект | Controlled | Uncontrolled |
|--------|-----------|--------------|
| Источник истины | `state` React | DOM |
| Доступ к значению | `value` / `state` | `ref.current.value` |
| Обновление | `onChange` → `setState` | DOM обновляет себя сам |
| Начальное значение | `value` (или `defaultValue`) | `defaultValue` |
| Рендер при вводе | При каждом символе | Только по необходимости |
| Интеграция с React | Полная | Минимальная |

```jsx
// Controlled: каждый символ → ре-рендер
function Controlled() {
  const [value, setValue] = useState('');
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

// Uncontrolled: ре-рендер не происходит при вводе
function Uncontrolled() {
  const inputRef = useRef(null);
  return (
    <input
      ref={inputRef}
      defaultValue=""
    />
  );
}
```

## Основные элементы паттерна

### useRef для доступа к DOM

Центральный инструмент неконтролируемых компонентов — `useRef`. Он создаёт изменяемый объект `{ current: ... }`, который не вызывает ре-рендер при изменении и сохраняет своё значение между рендерами.

```jsx
function SearchForm() {
  const searchRef = useRef(null); // { current: null } изначально

  const handleSearch = () => {
    // После монтирования: { current: <input element> }
    const query = searchRef.current.value;
    console.log('Поиск:', query);
  };

  return (
    <div>
      <input
        ref={searchRef}        // React привяжет DOM-узел к searchRef.current
        type="text"
        placeholder="Введите запрос..."
      />
      <button onClick={handleSearch}>Найти</button>
    </div>
  );
}
```

### defaultValue вместо value

Для неконтролируемых компонентов используют `defaultValue` (и `defaultChecked` для чекбоксов), а не `value`. Это позволяет задать начальное значение, не «захватывая» управление над полем.

```jsx
function EditProfileForm({ user }) {
  const nameRef = useRef(null);
  const bioRef = useRef(null);
  const newsletterRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      name: nameRef.current.value,
      bio: bioRef.current.value,
      newsletter: newsletterRef.current.checked,
    };
    console.log('Данные формы:', data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* defaultValue — начальное значение, DOM управляет дальше */}
      <input ref={nameRef} defaultValue={user.name} type="text" />
      <textarea ref={bioRef} defaultValue={user.bio} />
      {/* defaultChecked для чекбоксов */}
      <input ref={newsletterRef} defaultChecked={user.newsletter} type="checkbox" />
      <button type="submit">Сохранить</button>
    </form>
  );
}
```

> **Важно:** Если передать `value` без `onChange` в неконтролируемый компонент, React заблокирует поле. Используйте `defaultValue` для неконтролируемых компонентов.

### Чтение значений при отправке формы

Классический сценарий применения — чтение нескольких полей формы только в момент отправки:

```jsx
function RegistrationForm() {
  const refs = {
    name: useRef(null),
    email: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      name: refs.name.current.value.trim(),
      email: refs.email.current.value.trim(),
      password: refs.password.current.value,
      confirmPassword: refs.confirmPassword.current.value,
    };

    // Простая валидация при отправке
    if (formData.password !== formData.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    console.log('Регистрация:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={refs.name} defaultValue="" placeholder="Имя" />
      <input ref={refs.email} defaultValue="" type="email" placeholder="Email" />
      <input ref={refs.password} defaultValue="" type="password" placeholder="Пароль" />
      <input ref={refs.confirmPassword} defaultValue="" type="password" placeholder="Повторите пароль" />
      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

## Типичные сценарии использования

### 1. Загрузка файлов

`<input type="file">` по природе своей неконтролируемый — его нельзя управлять через `value`:

```jsx
function FileUploader() {
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    const files = fileInputRef.current.files;
    if (!files.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    await fetch('/api/upload', { method: 'POST', body: formData });
    console.log('Загружено файлов:', files.length);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
      />
      <button onClick={handleUpload}>Загрузить</button>
    </div>
  );
}
```

### 2. Фокусировка и управление DOM напрямую

Один из самых распространённых случаев — программный фокус:

```jsx
function SearchBar() {
  const inputRef = useRef(null);

  // Фокус при монтировании (автофокус)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Сброс и фокус при очистке
  const handleClear = () => {
    inputRef.current.value = '';
    inputRef.current.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Запрос:', inputRef.current.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} type="search" placeholder="Поиск..." />
      <button type="button" onClick={handleClear}>✕</button>
      <button type="submit">🔍</button>
    </form>
  );
}
```

### 3. Интеграция со сторонними библиотеками

Когда нужно передать DOM-узел в библиотеку, которая управляет им сама (например, rich text редактор, слайдер, маска ввода):

```jsx
import IMask from 'imask';

function PhoneInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!inputRef.current) return;

    // IMask управляет DOM-узлом напрямую
    const mask = IMask(inputRef.current, {
      mask: '+{7} (000) 000-00-00',
    });

    return () => mask.destroy(); // Очистка при размонтировании
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Телефон:', inputRef.current.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} type="tel" placeholder="+7 (___) ___-__-__" />
      <button type="submit">Подтвердить</button>
    </form>
  );
}
```

### 4. Большие формы с редкими изменениями

Когда форма содержит десятки полей, которые пользователь редко меняет, неконтролируемый подход позволяет избежать лишних ре-рендеров:

```jsx
function LargeSettingsForm({ initialSettings }) {
  // Создаём refs для всех полей
  const fieldRefs = Object.keys(initialSettings).reduce((acc, key) => {
    acc[key] = useRef(null);
    return acc;
  }, {});

  const handleSave = (e) => {
    e.preventDefault();
    const saved = Object.entries(fieldRefs).reduce((acc, [key, ref]) => {
      acc[key] = ref.current.value;
      return acc;
    }, {});
    console.log('Настройки сохранены:', saved);
  };

  return (
    <form onSubmit={handleSave}>
      {Object.entries(initialSettings).map(([key, value]) => (
        <div key={key}>
          <label>{key}</label>
          <input
            ref={fieldRefs[key]}
            defaultValue={value}
            type="text"
          />
        </div>
      ))}
      <button type="submit">Сохранить</button>
    </form>
  );
}
```

## Продвинутые техники

### Паттерн с useImperativeHandle

Для создания собственных неконтролируемых компонентов с внешним API используют `forwardRef` + `useImperativeHandle`:

```jsx
import { forwardRef, useImperativeHandle, useRef } from 'react';

// Компонент принимает ref снаружи и открывает только нужные методы
const CustomInput = forwardRef(function CustomInput({ label, defaultValue }, ref) {
  const inputRef = useRef(null);

  // Определяем, что будет доступно через ref снаружи
  useImperativeHandle(ref, () => ({
    getValue: () => inputRef.current.value,
    setValue: (val) => { inputRef.current.value = val; },
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; },
  }));

  return (
    <div>
      <label>{label}</label>
      <input ref={inputRef} defaultValue={defaultValue} />
    </div>
  );
});

// Использование снаружи
function ParentForm() {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    console.log('Значение:', inputRef.current.getValue());
    inputRef.current.clear();
  };

  return (
    <div>
      <CustomInput ref={inputRef} label="Имя" defaultValue="Иван" />
      <button onClick={handleSubmit}>Отправить и очистить</button>
    </div>
  );
}
```

### Сброс формы через key

Элегантный способ полностью сбросить неконтролируемую форму — изменить её `key`. React пересоздаст компонент с нуля:

```jsx
function OrderForm() {
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(formRef.current);
    console.log('Заказ:', Object.fromEntries(data));
    // Сбрасываем форму — меняем key, React пересоздаёт компонент
    setFormKey((k) => k + 1);
  };

  return (
    <form key={formKey} ref={formRef} onSubmit={handleSubmit}>
      <input name="product" defaultValue="" placeholder="Товар" />
      <input name="quantity" defaultValue="1" type="number" />
      <input name="address" defaultValue="" placeholder="Адрес доставки" />
      <button type="submit">Оформить заказ</button>
    </form>
  );
}
```

### FormData API

Нативный `FormData` отлично работает с неконтролируемыми формами — не нужны refs для каждого поля:

```jsx
function ContactForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // FormData автоматически собирает все поля по атрибуту name
    const data = new FormData(e.target);
    const values = Object.fromEntries(data);
    console.log('Форма:', values);
    // { name: 'Иван', email: 'ivan@example.com', message: 'Привет!' }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" defaultValue="" placeholder="Ваше имя" />
      <input name="email" defaultValue="" type="email" placeholder="Email" />
      <textarea name="message" defaultValue="" placeholder="Сообщение" />
      <button type="submit">Отправить</button>
    </form>
  );
}
```

## Ограничения и подводные камни

### 1. Сложная валидация в реальном времени

Неконтролируемые компоненты не предназначены для мгновенной реакции на каждый символ:

```jsx
// ❌ Неудобно с неконтролируемым подходом
function PasswordField() {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  // Нужен дополнительный onChange, теряется суть подхода
  const handleChange = () => {
    const value = inputRef.current.value;
    if (value.length < 8) {
      setError('Минимум 8 символов');
    } else {
      setError('');
    }
  };

  return (
    <div>
      <input ref={inputRef} type="password" onChange={handleChange} />
      {error && <span>{error}</span>}
    </div>
  );
}

// ✅ Для real-time валидации лучше подходит контролируемый подход
function PasswordFieldControlled() {
  const [password, setPassword] = useState('');
  const error = password.length > 0 && password.length < 8 ? 'Минимум 8 символов' : '';

  return (
    <div>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
      />
      {error && <span>{error}</span>}
    </div>
  );
}
```

### 2. Синхронизация с внешними данными

Если значение поля должно меняться программно (например, при загрузке данных), неконтролируемый подход требует дополнительных усилий:

```jsx
// ❌ defaultValue обновляется только при первом рендере
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  // Проблема: defaultValue не обновится при смене userId!
  return <input ref={nameRef} defaultValue={user?.name} />;
}

// ✅ Решение 1: key для пересоздания компонента при смене данных
function UserProfileFixed({ userId }) {
  const [user, setUser] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  if (!user) return <div>Загрузка...</div>;

  // key гарантирует пересоздание input с новым defaultValue
  return <input key={userId} ref={nameRef} defaultValue={user.name} />;
}

// ✅ Решение 2: Управлять значением через ref вручную
function UserProfileManual({ userId }) {
  const [user, setUser] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    fetchUser(userId).then((data) => {
      setUser(data);
      // Обновляем DOM напрямую
      if (nameRef.current) {
        nameRef.current.value = data.name;
      }
    });
  }, [userId]);

  return <input ref={nameRef} defaultValue="" />;
}
```

### 3. Отсутствие декларативности

Неконтролируемые компоненты труднее тестировать и отлаживать, поскольку состояние скрыто в DOM:

```jsx
// С контролируемым компонентом состояние в React DevTools видно сразу
// С неконтролируемым — нужно смотреть в DOM или добавлять логирование вручную

function DebugForm() {
  const inputRef = useRef(null);

  // Добавляем ручное логирование для отладки
  const logCurrentValue = () => {
    console.log('Текущее значение:', inputRef.current?.value);
  };

  return (
    <div>
      <input ref={inputRef} defaultValue="" />
      <button onClick={logCurrentValue}>Показать значение</button>
    </div>
  );
}
```

## Когда использовать Uncontrolled Components

**Выбирайте неконтролируемые компоненты, когда:**

- Простые формы с редкими изменениями (форма входа, форма контакта)
- Загрузка файлов (`<input type="file">`)
- Интеграция со сторонними DOM-библиотеками (редакторы, маски, слайдеры)
- Производительность критична, и ре-рендеры при каждом вводе нежелательны
- Нужен быстрый прототип без сложной логики форм
- Используете нативный `FormData` для сбора данных

**Выбирайте контролируемые компоненты, когда:**

- Нужна мгновенная валидация при вводе
- Значение поля зависит от других данных (вычисляемые поля)
- Нужно программно изменять значение поля
- Требуется полный контроль над тем, что отображается в поле
- Используете библиотеки для форм (React Hook Form, Formik)

> **Замечание:** React Hook Form по умолчанию использует неконтролируемые компоненты под капотом для максимальной производительности, предоставляя при этом удобный API для работы с формами.

## Итог

**Uncontrolled Components** — это паттерн, при котором DOM управляет значением ввода, а React обращается к нему через `ref` только по необходимости. Это более простой и производительный подход для случаев, когда не нужна реактивность на каждое изменение поля.

Ключевые принципы паттерна:

- **`ref`** — главный инструмент доступа к DOM-узлу
- **`defaultValue`** / **`defaultChecked`** — для задания начальных значений
- **Чтение по требованию** — значение читается только тогда, когда оно нужно (например, при отправке формы)
- **DOM как источник истины** — React не отслеживает каждое изменение

Неконтролируемые компоненты не являются «плохой практикой» — это инструмент для правильных задач. Они идеально подходят для простых форм, загрузки файлов и интеграции с DOM-библиотеками, где контролируемый подход добавил бы лишнюю сложность без реальной пользы.
