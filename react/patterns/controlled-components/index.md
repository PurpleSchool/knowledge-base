# Controlled Components — паттерн контролируемых компонентов

## Введение

**Контролируемые компоненты** (Controlled Components) — это паттерн в React, при котором форма или элемент ввода управляются состоянием React, а не DOM. Значение поля хранится в `state`, и любое изменение значения проходит через обработчик события, который обновляет состояние.

Ключевой принцип: **React является единственным источником истины (single source of truth)** для значения поля ввода.

```jsx
// Контролируемый компонент — значение всегда из state
function LoginForm() {
  const [email, setEmail] = useState('');

  return (
    <input
      value={email}                              // Значение из state
      onChange={(e) => setEmail(e.target.value)} // Обновляем state при изменении
    />
  );
}
```

Этот подход дает React полный контроль над тем, что отображается в поле ввода в любой момент времени.

## Неконтролируемые компоненты (для понимания контраста)

Чтобы лучше понять контролируемые компоненты, рассмотрим **неконтролируемые** (Uncontrolled Components). В них значение управляется самим DOM, а React обращается к нему через `ref` только тогда, когда оно нужно.

```jsx
// Неконтролируемый компонент — DOM управляет значением
function UncontrolledForm() {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Читаем значение из DOM только в момент отправки
    console.log('Введено:', inputRef.current.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}        // Доступ к DOM-узлу через ref
        defaultValue="Иван"  // Начальное значение, но DOM управляет им сам
        type="text"
      />
      <button type="submit">Отправить</button>
    </form>
  );
}
```

### Сравнение подходов

| Характеристика | Контролируемый | Неконтролируемый |
|---|---|---|
| Источник истины | React state | DOM |
| Доступ к значению | В любой момент | Только через ref |
| Валидация в реальном времени | Легко | Затруднено |
| Форматирование ввода | Просто | Сложно |
| Количество кода | Больше | Меньше |
| Интеграция с React экосистемой | Отличная | Ограниченная |
| Использование с `defaultValue` | Нет | Да |

**Неконтролируемые компоненты** удобны для простых форм, файловых инпутов или при интеграции с не-React библиотеками. **Контролируемые** — стандарт для большинства форм в React-приложениях.

## Синтаксис и принцип работы

Контролируемый компонент состоит из трёх обязательных элементов:

1. **State** — хранит текущее значение поля
2. **Атрибут `value`** — привязывает значение поля к state
3. **Обработчик `onChange`** — обновляет state при вводе пользователя

```jsx
function ControlledInput() {
  // 1. State — источник истины
  const [value, setValue] = useState('');

  // 3. Обработчик — обновляет state
  const handleChange = (event) => {
    setValue(event.target.value);
  };

  return (
    <input
      value={value}          // 2. Привязка к state
      onChange={handleChange} // 3. Обработчик изменений
    />
  );
}
```

### Цикл обновления

Каждое нажатие клавиши запускает следующий цикл:

```
Пользователь вводит символ
    → Срабатывает onChange
    → Вызывается setValue(новое значение)
    → React перерисовывает компонент
    → input отображает новое значение из state
```

```jsx
function ControlledDemo() {
  const [text, setText] = useState('');

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Начните вводить..."
      />
      {/* State немедленно отражает введённое значение */}
      <p>Вы ввели: <strong>{text}</strong></p>
      <p>Символов: {text.length}</p>
    </div>
  );
}
```

### Важно: атрибут value vs defaultValue

```jsx
// ✅ Контролируемый — value привязан к state
<input value={stateValue} onChange={handleChange} />

// ✅ Неконтролируемый — начальное значение, DOM управляет дальше
<input defaultValue="начальное значение" />

// ❌ Предупреждение React: если value задан без onChange,
//    поле станет только для чтения (readOnly)
<input value="фиксированное значение" />

// ❌ Ошибка: нельзя переключать между контролируемым и неконтролируемым
// (value не должен быть undefined или null после инициализации)
<input value={maybeUndefined} onChange={handleChange} />
```

## Работа с разными типами полей

### Текстовое поле (text, email, password, number, tel, url)

```jsx
function TextFields() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    phone: '',
  });

  // Универсальный обработчик для текстовых полей
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form>
      {/* Текстовое поле */}
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Имя"
      />

      {/* Email */}
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
      />

      {/* Пароль */}
      <input
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Пароль"
      />

      {/* Число — value остаётся строкой, парсим при необходимости */}
      <input
        type="number"
        name="age"
        value={form.age}
        onChange={handleChange}
        placeholder="Возраст"
        min={0}
        max={120}
      />
    </form>
  );
}
```

### Чекбокс (checkbox)

Для чекбоксов используется атрибут `checked` вместо `value`:

```jsx
function CheckboxExample() {
  const [isAgreed, setIsAgreed] = useState(false);
  const [preferences, setPreferences] = useState({
    newsletter: false,
    sms: false,
    push: true,
  });

  // Одиночный чекбокс
  const handleAgree = (e) => {
    setIsAgreed(e.target.checked); // checked, не value!
  };

  // Группа чекбоксов
  const handlePreference = (e) => {
    const { name, checked } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: checked }));
  };

  return (
    <div>
      {/* Одиночный чекбокс */}
      <label>
        <input
          type="checkbox"
          checked={isAgreed}      // Используем checked, не value
          onChange={handleAgree}
        />
        Я принимаю условия соглашения
      </label>

      {/* Группа чекбоксов */}
      <fieldset>
        <legend>Уведомления</legend>
        {Object.entries(preferences).map(([key, value]) => (
          <label key={key}>
            <input
              type="checkbox"
              name={key}
              checked={value}
              onChange={handlePreference}
            />
            {key === 'newsletter' ? 'Email-рассылка' : key === 'sms' ? 'SMS' : 'Push'}
          </label>
        ))}
      </fieldset>

      <p>Согласие: {isAgreed ? 'Да' : 'Нет'}</p>
      <p>Активные уведомления: {Object.entries(preferences)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ')}
      </p>
    </div>
  );
}
```

### Выпадающий список (select)

```jsx
function SelectExample() {
  const [city, setCity] = useState('');
  const [skills, setSkills] = useState([]); // Множественный выбор

  const cities = [
    { value: '', label: 'Выберите город' },
    { value: 'moscow', label: 'Москва' },
    { value: 'spb', label: 'Санкт-Петербург' },
    { value: 'kazan', label: 'Казань' },
    { value: 'nsk', label: 'Новосибирск' },
  ];

  const allSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'Docker'];

  // Одиночный select
  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  // Множественный select — selected options возвращает HTMLOptionsCollection
  const handleSkillsChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setSkills(selected);
  };

  return (
    <div>
      {/* Одиночный select */}
      <select value={city} onChange={handleCityChange}>
        {cities.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <p>Выбранный город: {city || 'не выбран'}</p>

      {/* Множественный select */}
      <select
        multiple                    // Атрибут для множественного выбора
        value={skills}             // Массив выбранных значений
        onChange={handleSkillsChange}
        size={5}
      >
        {allSkills.map((skill) => (
          <option key={skill} value={skill}>
            {skill}
          </option>
        ))}
      </select>
      <p>Навыки: {skills.join(', ') || 'не выбраны'}</p>
    </div>
  );
}
```

### Текстовая область (textarea)

В отличие от HTML, React-версия `<textarea>` принимает `value` как атрибут:

```jsx
function TextareaExample() {
  const [bio, setBio] = useState('');
  const maxLength = 500;

  return (
    <div>
      <textarea
        value={bio}                              // value, как у обычного input
        onChange={(e) => setBio(e.target.value)}
        placeholder="Расскажите о себе..."
        rows={5}
        maxLength={maxLength}
      />
      {/* Счётчик символов в реальном времени */}
      <p style={{ color: bio.length > maxLength * 0.9 ? 'red' : 'gray' }}>
        {bio.length} / {maxLength}
      </p>
    </div>
  );
}
```

### Радиокнопки (radio)

```jsx
function RadioExample() {
  const [gender, setGender] = useState('');
  const [plan, setPlan] = useState('free');

  const genderOptions = [
    { value: 'male', label: 'Мужской' },
    { value: 'female', label: 'Женский' },
    { value: 'other', label: 'Другой' },
  ];

  const planOptions = [
    { value: 'free', label: 'Бесплатный', price: '0 ₽/мес' },
    { value: 'pro', label: 'Про', price: '990 ₽/мес' },
    { value: 'enterprise', label: 'Корпоративный', price: 'По запросу' },
  ];

  return (
    <div>
      {/* Группа радиокнопок для пола */}
      <fieldset>
        <legend>Пол</legend>
        {genderOptions.map((opt) => (
          <label key={opt.value}>
            <input
              type="radio"
              name="gender"              // Все радиокнопки группы должны иметь одно имя
              value={opt.value}
              checked={gender === opt.value}  // Сравниваем с текущим state
              onChange={(e) => setGender(e.target.value)}
            />
            {opt.label}
          </label>
        ))}
      </fieldset>

      {/* Группа радиокнопок для тарифа */}
      <fieldset>
        <legend>Тарифный план</legend>
        {planOptions.map((opt) => (
          <label key={opt.value} style={{ display: 'block' }}>
            <input
              type="radio"
              name="plan"
              value={opt.value}
              checked={plan === opt.value}
              onChange={(e) => setPlan(e.target.value)}
            />
            {opt.label} — {opt.price}
          </label>
        ))}
      </fieldset>

      <p>Выбранный пол: {gender || 'не указан'}</p>
      <p>Тарифный план: {plan}</p>
    </div>
  );
}
```

## Валидация в реальном времени

Контролируемые компоненты позволяют легко реализовать валидацию, поскольку каждое изменение проходит через React-state.

### Простая валидация при изменении

```jsx
function ValidationExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  // Функции валидации
  const validateEmail = (value) => {
    if (!value) return 'Email обязателен';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Некорректный email';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Пароль обязателен';
    if (value.length < 8) return 'Пароль должен содержать минимум 8 символов';
    if (!/[A-Z]/.test(value)) return 'Нужна хотя бы одна заглавная буква';
    if (!/[0-9]/.test(value)) return 'Нужна хотя бы одна цифра';
    return '';
  };

  // Вычисляем ошибки из текущего state
  const errors = {
    email: touched.email ? validateEmail(email) : '',
    password: touched.password ? validatePassword(password) : '',
  };

  const isValid = !validateEmail(email) && !validatePassword(password);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Помечаем все поля как "тронутые" для показа ошибок
    setTouched({ email: true, password: true });
    if (isValid) {
      console.log('Форма валидна, отправляем...');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur('email')}  // Помечаем как тронутое при потере фокуса
          placeholder="Email"
          style={{ borderColor: errors.email ? 'red' : '' }}
        />
        {errors.email && (
          <span style={{ color: 'red', fontSize: '12px' }}>{errors.email}</span>
        )}
      </div>

      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => handleBlur('password')}
          placeholder="Пароль"
          style={{ borderColor: errors.password ? 'red' : '' }}
        />
        {errors.password && (
          <span style={{ color: 'red', fontSize: '12px' }}>{errors.password}</span>
        )}
        {/* Визуальный индикатор силы пароля */}
        {password && (
          <div>
            Сила пароля:{' '}
            <strong>
              {password.length < 6 ? 'Слабый' :
               password.length < 10 ? 'Средний' : 'Сильный'}
            </strong>
          </div>
        )}
      </div>

      <button type="submit" disabled={!isValid}>
        Войти
      </button>
    </form>
  );
}
```

### Валидация с форматированием ввода

```jsx
function FormattedInput() {
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  // Форматируем номер телефона: +7 (999) 999-99-99
  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, ''); // Оставляем только цифры
    let formatted = '';

    if (digits.length > 0) formatted = '+7';
    if (digits.length > 1) formatted += ` (${digits.slice(1, 4)}`;
    if (digits.length > 4) formatted += `) ${digits.slice(4, 7)}`;
    if (digits.length > 7) formatted += `-${digits.slice(7, 9)}`;
    if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`;

    // Ограничиваем длину
    if (digits.length <= 11) {
      setPhone(formatted);
    }
  };

  // Форматируем номер карты: 4444 4444 4444 4444
  const handleCardChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    const formatted = digits
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();
    setCardNumber(formatted);
  };

  return (
    <div>
      <div>
        <label>Телефон</label>
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="+7 (___) ___-__-__"
        />
      </div>

      <div>
        <label>Номер карты</label>
        <input
          type="text"
          value={cardNumber}
          onChange={handleCardChange}
          placeholder="0000 0000 0000 0000"
          maxLength={19} // 16 цифр + 3 пробела
        />
      </div>
    </div>
  );
}
```

## Управление формой с несколькими полями

### Подход с единым объектом состояния

```jsx
function RegistrationForm() {
  // Все поля в одном объекте state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Универсальный обработчик: работает с text, select, textarea
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Для чекбоксов берём checked, для остальных — value
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Сбрасываем ошибку поля при редактировании
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Полная валидация перед отправкой
  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Введите имя';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Введите фамилию';
    }
    if (!formData.email) {
      newErrors.email = 'Введите email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Минимум 8 символов';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Необходимо принять условия';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser(formData);
      console.log('Регистрация успешна!');
    } catch (error) {
      setErrors({ submit: 'Ошибка регистрации. Попробуйте ещё раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Вспомогательный компонент для поля с ошибкой
  const Field = ({ name, label, type = 'text', ...props }) => (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        {...props}
      />
      {errors[name] && <span style={{ color: 'red' }}>{errors[name]}</span>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <Field name="firstName" label="Имя" placeholder="Иван" />
      <Field name="lastName" label="Фамилия" placeholder="Иванов" />
      <Field name="email" label="Email" type="email" placeholder="ivan@example.com" />
      <Field name="password" label="Пароль" type="password" />
      <Field name="confirmPassword" label="Подтвердите пароль" type="password" />

      <div>
        <label>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="user">Пользователь</option>
            <option value="moderator">Модератор</option>
            <option value="admin">Администратор</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
          />
          Принимаю условия использования
        </label>
        {errors.agreeToTerms && (
          <span style={{ color: 'red' }}>{errors.agreeToTerms}</span>
        )}
      </div>

      {errors.submit && <p style={{ color: 'red' }}>{errors.submit}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
```

### Кастомный хук useForm для переиспользования

```jsx
// Выносим логику формы в переиспользуемый хук
function useForm(initialValues, validationRules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Универсальный обработчик изменений
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Отмечаем поле как "тронутое" при потере фокуса
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Валидируем это поле
    if (validationRules[name]) {
      const error = validationRules[name](values[name], values);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // Валидируем все поля
  const validateAll = () => {
    const newErrors = {};
    Object.keys(validationRules).forEach((field) => {
      const error = validationRules[field](values[field], values);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик отправки формы
  const handleSubmit = (onSubmit) => async (e) => {
    e.preventDefault();

    // Помечаем все поля как тронутые
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    if (!validateAll()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Сброс формы к начальным значениям
  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}

// Пример использования хука
function ContactForm() {
  const rules = {
    name: (value) => (!value?.trim() ? 'Имя обязательно' : ''),
    email: (value) => {
      if (!value) return 'Email обязателен';
      if (!/\S+@\S+\.\S+/.test(value)) return 'Некорректный email';
      return '';
    },
    message: (value) =>
      !value || value.length < 10 ? 'Минимум 10 символов' : '',
  };

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } =
    useForm({ name: '', email: '', message: '' }, rules);

  const onSubmit = handleSubmit(async (data) => {
    await sendContactForm(data);
    alert('Сообщение отправлено!');
  });

  return (
    <form onSubmit={onSubmit}>
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
          placeholder="Ваше сообщение..."
          rows={5}
        />
        {touched.message && errors.message && <span>{errors.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Отправка...' : 'Отправить'}
      </button>
    </form>
  );
}
```

## TypeScript типизация

TypeScript значительно улучшает работу с контролируемыми компонентами, добавляя безопасность типов.

```tsx
// Типы для полей формы
interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  bio: string;
}

// Тип для ошибок — все ключи необязательны и являются строками
type FormErrors<T> = Partial<Record<keyof T, string>>;

// Компонент с типизацией
function TypedUserForm() {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    age: 0,
    role: 'user',
    isActive: true,
    bio: '',
  });

  const [errors, setErrors] = useState<FormErrors<UserFormData>>({});

  // Обработчик с правильной типизацией события
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Для чекбоксов отдельная обработка
    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: e.target.checked,
      }));
    } else if (name === 'age') {
      // Преобразуем строку в число для числовых полей
      setFormData((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <form>
      <input
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        placeholder="Имя"
      />

      <input
        name="age"
        type="number"
        value={formData.age}
        onChange={handleChange}
        min={0}
        max={120}
      />

      <select
        name="role"
        value={formData.role}
        onChange={handleChange}
      >
        <option value="user">Пользователь</option>
        <option value="moderator">Модератор</option>
        <option value="admin">Администратор</option>
      </select>

      <input
        name="isActive"
        type="checkbox"
        checked={formData.isActive}
        onChange={handleChange}
      />

      <textarea
        name="bio"
        value={formData.bio}
        onChange={handleChange}
      />
    </form>
  );
}

// Типизированный кастомный хук useForm
function useTypedForm<T extends Record<string, unknown>>(
  initialValues: T,
  validators?: Partial<Record<keyof T, (value: T[keyof T], allValues: T) => string>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setValues((prev) => ({ ...prev, [name]: newValue }));
  };

  const validate = (): boolean => {
    if (!validators) return true;

    const newErrors: FormErrors<T> = {};
    (Object.keys(validators) as Array<keyof T>).forEach((field) => {
      const validator = validators[field];
      if (validator) {
        const error = validator(values[field], values);
        if (error) newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { values, errors, handleChange, validate };
}
```

## Когда использовать контролируемые компоненты

### Используйте контролируемые компоненты когда:

**1. Нужна мгновенная реакция на ввод:**
```jsx
// Живой поиск с фильтрацией
function LiveSearch({ items }) {
  const [query, setQuery] = useState('');
  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск..."
      />
      <ul>
        {filtered.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </>
  );
}
```

**2. Поля зависят друг от друга:**
```jsx
// Зависимые поля: цена меняется при смене валюты
function PriceCalculator() {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('RUB');
  const rates = { RUB: 1, USD: 0.011, EUR: 0.010 };

  // Автоматически вычисляем конвертированную сумму
  const converted = amount
    ? (parseFloat(amount) * rates[currency]).toFixed(2)
    : '';

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Сумма в рублях"
      />
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="RUB">RUB</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>
      {converted && <p>Результат: {converted} {currency}</p>}
    </div>
  );
}
```

**3. Нужно форматировать или ограничивать ввод:**
```jsx
// Только цифры, максимум 6 символов (OTP)
function OtpInput() {
  const [otp, setOtp] = useState('');

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Только цифры
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <input
      type="text"
      value={otp}
      onChange={handleChange}
      placeholder="______"
      maxLength={6}
    />
  );
}
```

**4. Нужно программно изменять значение поля:**
```jsx
// Кнопка "Заполнить случайными данными"
function AutofillForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const autofill = () => {
    // Программное заполнение формы
    setName('Иван Иванов');
    setEmail('ivan@example.com');
  };

  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="button" onClick={autofill}>Заполнить</button>
      <button type="button" onClick={() => { setName(''); setEmail(''); }}>
        Очистить
      </button>
    </form>
  );
}
```

**5. Нужна валидация в реальном времени:**
Когда ошибки должны появляться немедленно при изменении значения.

### Предпочтите неконтролируемые когда:

- Форма простая и не требует валидации в реальном времени
- Интегрируете с не-React библиотеками (jQuery-плагины, mask-библиотеки)
- Работаете с полем `<input type="file">` (оно всегда неконтролируемое!)
- Производительность критична и каждый лишний рендер ощутим

```jsx
// file input — ВСЕГДА неконтролируемый
function FileUpload() {
  const fileRef = useRef(null);

  const handleUpload = () => {
    const file = fileRef.current?.files[0];
    if (file) {
      console.log('Выбран файл:', file.name);
    }
  };

  return (
    <>
      {/* value для file input нельзя устанавливать программно */}
      <input type="file" ref={fileRef} accept="image/*" />
      <button onClick={handleUpload}>Загрузить</button>
    </>
  );
}
```

## Антипаттерны

### 1. Мутация state напрямую

```jsx
// ❌ Нельзя мутировать state напрямую
function BadForm() {
  const [user, setUser] = useState({ name: '', email: '' });

  const handleChange = (e) => {
    user.name = e.target.value; // Мутация! React не увидит изменения
    setUser(user);              // Передаём ту же ссылку — ре-рендер не гарантирован
  };

  return <input value={user.name} onChange={handleChange} />;
}

// ✅ Создаём новый объект
function GoodForm() {
  const [user, setUser] = useState({ name: '', email: '' });

  const handleChange = (e) => {
    setUser((prev) => ({
      ...prev,             // Копируем предыдущее состояние
      name: e.target.value // Обновляем нужное поле
    }));
  };

  return <input value={user.name} onChange={handleChange} />;
}
```

### 2. Забытый обработчик onChange (поле только для чтения)

```jsx
// ❌ Поле невозможно редактировать — React выдаст предупреждение
function ReadOnlyAccidentally() {
  const [value] = useState('Фиксированное значение');
  // onChange не указан! Поле станет readonly и React предупредит об этом
  return <input value={value} />;
}

// ✅ Добавляем onChange или используем readOnly явно
function Correct() {
  const [value, setValue] = useState('');
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}

// ✅ Явный readOnly если поле действительно не должно редактироваться
function ReadOnlyField({ displayValue }) {
  return <input value={displayValue} readOnly />;
}
```

### 3. Инициализация state из пропсов с last-resort обновлением

```jsx
// ❌ Антипаттерн: копирование пропсов в state без синхронизации
function BadEditForm({ user }) {
  // При изменении user (например, выбор другого пользователя)
  // state не обновится!
  const [name, setName] = useState(user.name);

  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}

// ✅ Решение 1: используем key для сброса компонента
function ParentComponent({ selectedUserId }) {
  const user = useUser(selectedUserId);
  return (
    // При смене key React размонтирует и пересоздаст компонент
    <EditForm key={selectedUserId} user={user} />
  );
}

// ✅ Решение 2: useEffect для синхронизации (когда key неприменим)
function EditForm({ user }) {
  const [name, setName] = useState(user.name);

  // Синхронизируем state при изменении пропсов
  useEffect(() => {
    setName(user.name);
  }, [user.id]); // Следим за изменением ID, не самого объекта

  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

### 4. Излишняя вложенность state

```jsx
// ❌ Глубоко вложенный state сложно обновлять
function OverlyNested() {
  const [data, setData] = useState({
    user: {
      profile: {
        address: {
          city: '',
        }
      }
    }
  });

  // Обновление глубокого поля — много spread операторов
  const handleCityChange = (e) => {
    setData((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        profile: {
          ...prev.user.profile,
          address: {
            ...prev.user.profile.address,
            city: e.target.value,
          }
        }
      }
    }));
  };

  return (
    <input
      value={data.user.profile.address.city}
      onChange={handleCityChange}
    />
  );
}

// ✅ Плоская структура state или разбивка на несколько useState
function Flat() {
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');

  return (
    <>
      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Город" />
      <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Улица" />
      <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Индекс" />
    </>
  );
}
```

### 5. Лишние ре-рендеры из-за объектов в state

```jsx
// ❌ Создание нового объекта при каждом нажатии клавиши
function SlowForm() {
  const [config, setConfig] = useState({ theme: 'light', lang: 'ru' });
  const [name, setName] = useState('');

  const handleNameChange = (e) => {
    setName(e.target.value);
    // Создаём новый объект config при каждом вводе символа — лишний рендер дочерних компонентов
    setConfig({ ...config, lastUpdated: Date.now() });
  };

  return (
    <>
      <input value={name} onChange={handleNameChange} />
      {/* Этот компонент будет перерисовываться при каждом вводе */}
      <ExpensiveConfigDisplay config={config} />
    </>
  );
}

// ✅ Разделяем независимые части state и используем useCallback
function FastForm() {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('light'); // Отдельный state для конфига

  // useCallback предотвращает пересоздание обработчика при каждом рендере
  const handleNameChange = useCallback((e) => {
    setName(e.target.value);
  }, []);

  return (
    <>
      <input value={name} onChange={handleNameChange} />
      {/* theme не меняется при вводе имени — ExpensiveConfigDisplay не ре-рендерится */}
      <ExpensiveConfigDisplay theme={theme} />
    </>
  );
}
```

## Итоги

**Контролируемые компоненты** — фундаментальный паттерн React для работы с формами и пользовательским вводом. Они делают React единственным источником истины, что даёт мощные возможности: мгновенную валидацию, форматирование ввода, программное управление значениями и предсказуемое поведение.

### Ключевые преимущества:
- Предсказуемость: значение поля всегда отражает state
- Мощная валидация и форматирование в реальном времени
- Программное управление значениями
- Зависимые поля (одно поле влияет на другое)
- Отличная TypeScript-совместимость
- Полная интеграция с React-экосистемой

### Основные правила:
- `<input>`, `<textarea>`, `<select>` — используют `value` + `onChange`
- `<input type="checkbox">` и `<input type="radio">` — используют `checked` + `onChange`
- `<input type="file">` — всегда неконтролируемый, только `ref`
- Никогда не мутируйте state напрямую
- Инициализируйте `value` с непустым значением (не `undefined`, не `null`)

### Инструменты для сложных форм:
Для крупных форм с комплексной логикой рассмотрите библиотеки, построенные на контролируемых компонентах:
- [React Hook Form](https://react-hook-form.com/) — производительность + TypeScript
- [Formik](https://formik.org/) — всё в одном, подходит для сложных форм
- [Zod](https://zod.dev/) + React Hook Form — схема-валидация + TypeScript

## Ссылки

- [React документация: Controlled Components](https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable)
- [React документация: Forms](https://legacy.reactjs.org/docs/forms.html)
- [React Hook Form](https://react-hook-form.com/)
- [Formik](https://formik.org/)
