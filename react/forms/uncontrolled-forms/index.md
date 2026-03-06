---
metaTitle: Неконтролируемые формы в React - работа с DOM через useRef
metaDescription: Полное руководство по неконтролируемым формам в React. Использование useRef, defaultValue, FormData API, работа с файлами и интеграция сторонних библиотек
author: Олег Марков
title: Неконтролируемые формы
preview: Узнайте, когда и как использовать неконтролируемые формы в React — подход, при котором DOM сам управляет значениями, что упрощает код и улучшает производительность в ряде сценариев
---

# Неконтролируемые формы в React

## Введение

Существуют два подхода к работе с формами в React: контролируемые компоненты, где React-состояние является источником истины, и **неконтролируемые компоненты**, где DOM сам управляет данными.

В неконтролируемых формах вы не привязываете `value` к состоянию и не слушаете каждое нажатие клавиши. Вместо этого значения полей читаются напрямую из DOM — обычно только при отправке формы. Это делает код проще и может улучшить производительность для больших форм.

Несмотря на то, что React-документация рекомендует контролируемые компоненты, неконтролируемые формы имеют свои законные области применения: загрузка файлов, интеграция со сторонними DOM-библиотеками, простые формы с минимальной валидацией.

## Основной принцип: useRef

Главный инструмент для работы с неконтролируемыми формами — хук `useRef`. Он создаёт объект `ref`, который можно привязать к DOM-элементу и затем читать его текущее значение.

```jsx
import React, { useRef } from 'react';

function SimpleUncontrolledForm() {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Читаем значение напрямую из DOM
    console.log('Значение:', inputRef.current.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        ref={inputRef}
        // Нет атрибута value — DOM управляет значением
      />
      <button type="submit">Отправить</button>
    </form>
  );
}
```

## defaultValue vs value

В неконтролируемых компонентах используйте `defaultValue` вместо `value` для задания начального значения:

```jsx
function UncontrolledInput() {
  const inputRef = useRef(null);

  return (
    <div>
      {/* value — контролируемый (React управляет) */}
      <input value="Иван" onChange={() => {}} />

      {/* defaultValue — неконтролируемый (DOM управляет, начальное значение задано) */}
      <input defaultValue="Иван" ref={inputRef} />

      {/* Без defaultValue — начальное значение пустое */}
      <input ref={inputRef} />
    </div>
  );
}
```

Аналогично для других элементов:
- `<textarea defaultValue="...">` вместо `value`
- `<select defaultValue="...">` вместо `value`
- `<input type="checkbox" defaultChecked={true}>` вместо `checked`

## Простая форма входа

```jsx
function LoginForm() {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    // Простая валидация при отправке
    if (!email || !password) {
      alert('Заполните все поля');
      return;
    }

    console.log('Вход:', { email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          ref={emailRef}
          defaultValue=""
        />
      </div>

      <div>
        <label htmlFor="password">Пароль:</label>
        <input
          id="password"
          type="password"
          ref={passwordRef}
        />
      </div>

      <button type="submit">Войти</button>
    </form>
  );
}
```

## FormData API

Мощный способ работы с неконтролируемыми формами — использование нативного `FormData`. Это особенно удобно для форм с большим количеством полей:

```jsx
function RegistrationForm() {
  const handleSubmit = (e) => {
    e.preventDefault();

    // FormData автоматически собирает все поля с атрибутом name
    const formData = new FormData(e.target);

    // Получить отдельное поле
    const name = formData.get('name');
    const email = formData.get('email');

    // Преобразовать в обычный объект
    const data = Object.fromEntries(formData.entries());
    console.log(data);
    // { name: 'Иван', email: 'ivan@example.com', role: 'user' }

    // Получить все значения одного поля (для чекбоксов/множественного выбора)
    const skills = formData.getAll('skills');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" type="text" defaultValue="" placeholder="Имя" />
      <input name="email" type="email" defaultValue="" placeholder="Email" />

      <select name="role" defaultValue="user">
        <option value="user">Пользователь</option>
        <option value="admin">Администратор</option>
      </select>

      <fieldset>
        <legend>Навыки</legend>
        <label><input type="checkbox" name="skills" value="react" /> React</label>
        <label><input type="checkbox" name="skills" value="typescript" /> TypeScript</label>
        <label><input type="checkbox" name="skills" value="nodejs" /> Node.js</label>
      </fieldset>

      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

## Работа с файлами

Загрузка файлов — область, где неконтролируемые компоненты практически незаменимы, потому что значение `<input type="file">` нельзя контролировать программно по соображениям безопасности:

```jsx
function FileUpload() {
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const files = fileInputRef.current.files;
    if (!files.length) {
      alert('Выберите файл');
      return;
    }

    const file = files[0];
    console.log('Файл:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Отправка на сервер
    const formData = new FormData();
    formData.append('file', file);
    fetch('/api/upload', { method: 'POST', body: formData });
  };

  const handleClear = () => {
    // Сбросить выбранный файл
    fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,.pdf"
        multiple
      />
      <button type="submit">Загрузить</button>
      <button type="button" onClick={handleClear}>Очистить</button>
    </form>
  );
}
```

### Превью изображения перед загрузкой

```jsx
function ImageUpload() {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
      />
      {preview && (
        <img src={preview} alt="Превью" style={{ maxWidth: '200px' }} />
      )}
    </div>
  );
}
```

## Программный сброс формы

Сброс неконтролируемой формы:

```jsx
function ResetableForm() {
  const formRef = useRef(null);
  const nameRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = nameRef.current.value;
    console.log('Submit:', name);

    // Способ 1: Нативный сброс через form.reset()
    formRef.current.reset();

    // Способ 2: Сбросить конкретное поле
    // nameRef.current.value = '';
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input ref={nameRef} name="name" defaultValue="" placeholder="Имя" />
      <button type="submit">Отправить</button>
      <button type="reset">Сбросить</button>
    </form>
  );
}
```

## Фокус и управление DOM

Одно из главных преимуществ `useRef` — программное управление DOM-элементами:

```jsx
function AutoFocusForm() {
  const firstInputRef = useRef(null);

  // Автофокус при монтировании компонента
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleError = () => {
    // Переместить фокус на проблемное поле
    firstInputRef.current?.focus();
    firstInputRef.current?.select(); // Выделить весь текст
  };

  return (
    <form>
      <input
        ref={firstInputRef}
        type="text"
        placeholder="Введите имя"
      />
    </form>
  );
}
```

## Интеграция со сторонними библиотеками

Неконтролируемые компоненты необходимы при интеграции с DOM-библиотеками (jQuery-плагины, редакторы типа Quill, карты):

```jsx
import { useRef, useEffect } from 'react';

function QuillEditor({ onChange }) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    // Инициализируем Quill на DOM-элементе
    quillRef.current = new Quill(editorRef.current, {
      theme: 'snow',
      modules: { toolbar: true },
    });

    // Передаём изменения наружу
    quillRef.current.on('text-change', () => {
      onChange(quillRef.current.root.innerHTML);
    });

    return () => {
      // Очистка при размонтировании
      quillRef.current = null;
    };
  }, []);

  return <div ref={editorRef} style={{ height: '200px' }} />;
}
```

## Частичная неконтролируемость

Иногда удобно смешивать подходы — управлять одними полями через state, а другими через refs:

```jsx
function HybridForm() {
  // Контролируемое поле для реактивной валидации
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Неконтролируемые поля — не нуждаются в реактивности
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const fileRef = useRef(null);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(!/\S+@\S+\.\S+/.test(value) ? 'Некорректный email' : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      name: nameRef.current.value,
      email,
      phone: phoneRef.current.value,
      file: fileRef.current.files[0],
    };
    console.log('Submit:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Неконтролируемые поля */}
      <input ref={nameRef} name="name" placeholder="Имя" />
      <input ref={phoneRef} name="phone" type="tel" placeholder="Телефон" />
      <input ref={fileRef} type="file" />

      {/* Контролируемое поле с валидацией */}
      <input
        type="email"
        value={email}
        onChange={handleEmailChange}
        placeholder="Email"
      />
      {emailError && <span>{emailError}</span>}

      <button type="submit">Отправить</button>
    </form>
  );
}
```

## Когда использовать неконтролируемые формы

**Подходящие случаи:**
- Загрузка файлов (`<input type="file">`)
- Интеграция со сторонними DOM-библиотеками
- Простые формы поиска или подписки без сложной валидации
- Миграция legacy-кода с jQuery
- Большие формы с сотнями полей, где каждый ре-рендер критичен

**Когда лучше контролируемые формы:**
- Нужна валидация в реальном времени
- Поля зависят друг от друга
- Нужно программно менять значения полей
- Используете библиотеки типа Formik или React Hook Form

## Производительность

Неконтролируемые формы не вызывают ре-рендер при каждом нажатии клавиши, что может быть важно для очень больших форм:

```jsx
// Контролируемая — ре-рендер при каждом нажатии
function ControlledInput() {
  const [value, setValue] = useState(''); // Каждое изменение = ре-рендер
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}

// Неконтролируемая — ре-рендер только при submit
function UncontrolledInput() {
  const ref = useRef(null); // Нет ре-рендера при изменении
  return <input ref={ref} />;
}
```

Однако в большинстве реальных приложений эта разница не ощутима. React достаточно эффективно обрабатывает частые ре-рендеры одного поля ввода.

## Заключение

Неконтролируемые формы — важный инструмент в арсенале React-разработчика. Они особенно полезны для работы с файлами, интеграции со сторонними библиотеками и простых сценариев, где не нужна реактивная валидация.

Ключевые выводы:
- Используйте `useRef` для прямого доступа к DOM-элементам
- Применяйте `defaultValue`/`defaultChecked` вместо `value`/`checked`
- `FormData` API позволяет удобно собирать данные большой формы
- `form.reset()` сбрасывает все поля формы к начальным значениям
- `<input type="file">` — неконтролируемый по природе

Выбирайте подход в зависимости от требований: для сложных форм с валидацией — контролируемые компоненты (или React Hook Form), для простых случаев и файлов — неконтролируемые.
