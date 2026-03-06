---
metaTitle: Контролируемые формы в React - управление состоянием форм
metaDescription: Полное руководство по контролируемым формам в React. Управление input, select, checkbox, textarea через состояние React, валидация, обработка событий
author: Олег Марков
title: Контролируемые формы
preview: Узнайте, как строить контролируемые формы в React — когда React полностью управляет состоянием ввода, обеспечивая предсказуемое поведение и простую валидацию в реальном времени
---

# Контролируемые формы в React

## Введение

Формы — неотъемлемая часть большинства веб-приложений. Регистрация, вход, поиск, оформление заказа — всё это требует получения данных от пользователя. React предлагает два подхода к работе с формами: контролируемые и неконтролируемые компоненты.

**Контролируемые формы** — это подход, при котором React-состояние (`state`) является единственным источником истины для значений полей ввода. Каждое изменение поля немедленно отражается в состоянии, и каждая перерисовка компонента восстанавливает значения полей из состояния.

Этот подход даёт полный контроль над данными формы: вы можете валидировать ввод на лету, применять маски, ограничивать символы, синхронизировать поля между собой и многое другое.

## Принцип работы

В контролируемой форме цикл обновления данных выглядит так:

1. Пользователь вводит символ в поле
2. Срабатывает событие `onChange`
3. Обработчик вызывает `setState` с новым значением
4. React перерисовывает компонент
5. Поле получает значение из `state`

```jsx
import React, { useState } from 'react';

function SimpleInput() {
  const [value, setValue] = useState('');

  return (
    <input
      type="text"
      value={value}           // Значение всегда из state
      onChange={(e) => setValue(e.target.value)} // Обновляем state при изменении
    />
  );
}
```

Атрибут `value` жёстко связывает поле с состоянием React. Без обработчика `onChange` поле станет read-only.

## Базовые элементы форм

### Текстовые поля `<input type="text">`

```jsx
function TextForm() {
  const [name, setName] = useState('');

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Введите имя"
      />
      <p>Вы ввели: {name}</p>
    </div>
  );
}
```

### Email и Password

```jsx
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
      />
      <button type="submit">Войти</button>
    </form>
  );
}
```

### Многострочный текст `<textarea>`

```jsx
function CommentForm() {
  const [comment, setComment] = useState('');
  const maxLength = 500;

  return (
    <div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={maxLength}
        placeholder="Напишите комментарий..."
        rows={5}
      />
      <p>{comment.length}/{maxLength} символов</p>
    </div>
  );
}
```

### Выпадающий список `<select>`

```jsx
function CategorySelect() {
  const [category, setCategory] = useState('');

  const categories = [
    { value: '', label: 'Выберите категорию' },
    { value: 'electronics', label: 'Электроника' },
    { value: 'clothing', label: 'Одежда' },
    { value: 'food', label: 'Продукты питания' },
  ];

  return (
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
    >
      {categories.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
```

### Множественный выбор `<select multiple>`

```jsx
function MultiSelect() {
  const [selected, setSelected] = useState([]);

  const options = ['React', 'Vue', 'Angular', 'Svelte'];

  const handleChange = (e) => {
    const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setSelected(values);
  };

  return (
    <select multiple value={selected} onChange={handleChange}>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
```

### Чекбоксы `<input type="checkbox">`

```jsx
function CheckboxForm() {
  const [agreed, setAgreed] = useState(false);

  return (
    <label>
      <input
        type="checkbox"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
      />
      Принимаю условия использования
    </label>
  );
}
```

Группа чекбоксов:

```jsx
function HobbiesForm() {
  const [hobbies, setHobbies] = useState({
    reading: false,
    sports: false,
    gaming: false,
  });

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setHobbies((prev) => ({ ...prev, [name]: checked }));
  };

  const hobbyLabels = {
    reading: 'Чтение',
    sports: 'Спорт',
    gaming: 'Игры',
  };

  return (
    <fieldset>
      <legend>Увлечения</legend>
      {Object.entries(hobbies).map(([key, value]) => (
        <label key={key}>
          <input
            type="checkbox"
            name={key}
            checked={value}
            onChange={handleChange}
          />
          {hobbyLabels[key]}
        </label>
      ))}
    </fieldset>
  );
}
```

### Радиокнопки `<input type="radio">`

```jsx
function GenderSelect() {
  const [gender, setGender] = useState('');

  const options = [
    { value: 'male', label: 'Мужской' },
    { value: 'female', label: 'Женский' },
    { value: 'other', label: 'Другой' },
  ];

  return (
    <fieldset>
      <legend>Пол</legend>
      {options.map(({ value, label }) => (
        <label key={value}>
          <input
            type="radio"
            name="gender"
            value={value}
            checked={gender === value}
            onChange={(e) => setGender(e.target.value)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
```

## Управление сложными формами

### Единый объект состояния

Для форм с множеством полей удобно хранить все значения в одном объекте:

```jsx
function RegistrationForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    newsletter: false,
  });

  // Универсальный обработчик для текстовых полей и чекбоксов
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Данные формы:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        placeholder="Имя"
      />
      <input
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        placeholder="Фамилия"
      />
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      <input
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Телефон"
      />
      <input
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Пароль"
      />
      <input
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Подтвердите пароль"
      />
      <label>
        <input
          name="newsletter"
          type="checkbox"
          checked={formData.newsletter}
          onChange={handleChange}
        />
        Подписаться на рассылку
      </label>
      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

## Валидация в реальном времени

Контролируемые формы позволяют легко добавить валидацию на лету:

```jsx
function EmailInput() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (value) => {
    if (!value) return 'Email обязателен';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Некорректный email';
    return '';
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setEmail(newValue);
    if (touched) {
      setError(validateEmail(newValue));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{ borderColor: error && touched ? 'red' : '' }}
      />
      {touched && error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  );
}
```

### Полная форма с валидацией

```jsx
function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (data) => {
    const errs = {};
    if (!data.name.trim()) errs.name = 'Имя обязательно';
    else if (data.name.trim().length < 2) errs.name = 'Минимум 2 символа';

    if (!data.email) errs.email = 'Email обязателен';
    else if (!/\S+@\S+\.\S+/.test(data.email)) errs.email = 'Некорректный email';

    if (!data.message.trim()) errs.message = 'Сообщение обязательно';
    else if (data.message.trim().length < 10) errs.message = 'Минимум 10 символов';

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValues = { ...values, [name]: value };
    setValues(newValues);

    // Валидируем только посещённые поля
    if (touched[name]) {
      setErrors(validate(newValues));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Помечаем все поля как посещённые
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    const errs = validate(values);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      console.log('Отправка:', values);
    }
  };

  const isValid = Object.keys(validate(values)).length === 0;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <input
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Ваше имя"
        />
        {touched.name && errors.name && <span>{errors.name}</span>}
      </div>

      <div>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Email"
        />
        {touched.email && errors.email && <span>{errors.email}</span>}
      </div>

      <div>
        <textarea
          name="message"
          value={values.message}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Ваше сообщение"
        />
        {touched.message && errors.message && <span>{errors.message}</span>}
      </div>

      <button type="submit" disabled={!isValid}>
        Отправить
      </button>
    </form>
  );
}
```

## Кастомный хук для форм

Чтобы не дублировать логику в каждом компоненте, вынесите её в хук:

```jsx
function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValues = {
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    };
    setValues(newValues);

    if (touched[name]) {
      setErrors(validate(newValues));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = (onSubmit) => (e) => {
    e.preventDefault();
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSubmit(values);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return { values, errors, touched, handleChange, handleBlur, handleSubmit, reset };
}

// Использование
function SignupForm() {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useForm(
    { username: '', email: '', password: '' },
    (vals) => {
      const errs = {};
      if (!vals.username) errs.username = 'Обязательное поле';
      if (!vals.email) errs.email = 'Обязательное поле';
      if (!vals.password || vals.password.length < 6) errs.password = 'Минимум 6 символов';
      return errs;
    }
  );

  return (
    <form onSubmit={handleSubmit((data) => console.log('Submit:', data))}>
      <input name="username" value={values.username} onChange={handleChange} onBlur={handleBlur} />
      {touched.username && errors.username && <span>{errors.username}</span>}

      <input name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} />
      {touched.email && errors.email && <span>{errors.email}</span>}

      <input name="password" type="password" value={values.password} onChange={handleChange} onBlur={handleBlur} />
      {touched.password && errors.password && <span>{errors.password}</span>}

      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

## Контролируемые формы с useReducer

Для сложных форм `useReducer` даёт более предсказуемое управление состоянием:

```jsx
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: action.error } };
    case 'TOUCH_FIELD':
      return { ...state, touched: { ...state.touched, [action.field]: true } };
    case 'RESET':
      return action.initialState;
    default:
      return state;
  }
};

function ComplexForm() {
  const initialState = {
    values: { name: '', email: '' },
    errors: {},
    touched: {},
  };

  const [state, dispatch] = useReducer(formReducer, initialState);

  const handleChange = (e) => {
    dispatch({ type: 'SET_FIELD', field: e.target.name, value: e.target.value });
  };

  return (
    <form>
      <input name="name" value={state.values.name} onChange={handleChange} />
      <input name="email" value={state.values.email} onChange={handleChange} />
    </form>
  );
}
```

## Преимущества и недостатки

### Преимущества

- **Полный контроль** — каждое изменение проходит через React
- **Мгновенная валидация** — ошибки показываются в реальном времени
- **Форматирование** — легко применять маски и ограничения
- **Синхронизация полей** — одно поле может влиять на другое
- **Тестируемость** — состояние явное и предсказуемое

### Недостатки

- **Избыточные ре-рендеры** — при каждом нажатии клавиши компонент перерисовывается
- **Больше кода** — нужны обработчики и состояние для каждого поля
- **Производительность** — в очень больших формах может быть медленнее

## Когда использовать контролируемые формы

Контролируемые формы — правильный выбор когда:
- Нужна валидация в реальном времени
- Значение одного поля влияет на другое
- Нужно применять форматирование или маски
- Хотите программно изменять значения полей
- Нужен полный контроль над данными формы

Для простых форм без сложной логики рассмотрите неконтролируемые формы с `useRef`.

## Заключение

Контролируемые формы — основной и рекомендуемый подход в React. Они обеспечивают предсказуемое поведение, полный контроль над данными и простую интеграцию с валидацией. Начните с базового паттерна `value + onChange`, а затем расширяйте функциональность по мере необходимости: добавляйте валидацию, кастомные хуки и интеграцию с библиотеками типа React Hook Form или Formik.
