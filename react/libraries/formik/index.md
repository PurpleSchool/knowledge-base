# Formik — управление формами в React

## Введение

**Formik** — одна из самых популярных библиотек для управления формами в React. Она берёт на себя рутинные задачи: отслеживание значений полей, обработку ошибок валидации, управление состоянием отправки формы. Основная цель Formik — сделать работу с формами простой и предсказуемой, не ограничивая разработчика в выборе UI-компонентов.

По данным npm, Formik скачивают более 2 миллионов раз в неделю. Несмотря на то, что библиотека находится в режиме поддержки (активная разработка приостановлена), она по-прежнему широко используется в production-проектах и является важным инструментом в арсенале React-разработчика.

## Установка

```bash
npm install formik
# или
yarn add formik
```

Для валидации с Yup:
```bash
npm install yup
# или
yarn add yup
```

Если вы используете TypeScript (рекомендуется), типы уже включены в пакет `formik` — отдельно устанавливать не нужно. Для Yup:
```bash
npm install --save-dev @types/yup
```

## Ключевые концепции

Прежде чем переходить к коду, важно понять основные концепции Formik:

### `values`
Объект, содержащий текущие значения всех полей формы. Структура совпадает с объектом `initialValues`.

### `errors`
Объект с сообщениями об ошибках. Ключи совпадают с ключами `values`. Если поле прошло валидацию — соответствующего ключа нет.

### `touched`
Объект, отслеживающий, какие поля пользователь уже посетил (потерял фокус). Используется для показа ошибок только после взаимодействия с полем.

### `handleSubmit`
Функция, обёрнутая Formik для обработки отправки формы. Автоматически вызывает валидацию, устанавливает `isSubmitting` и вызывает пользовательский `onSubmit`.

### `handleChange`
Универсальный обработчик изменений полей. Синхронизирует значение с `values`.

### `handleBlur`
Обработчик потери фокуса. Помечает поле как `touched`.

### `isSubmitting`
Булево значение — `true` во время отправки формы. Удобно для блокировки кнопки Submit.

### `isValid`
`true`, если в объекте `errors` нет ошибок.

## Базовое использование: хук `useFormik`

Самый простой способ использовать Formik — хук `useFormik`:

```typescript
import React from 'react';
import { useFormik } from 'formik';

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await loginUser(values.email, values.password);
        resetForm();
      } catch (error) {
        console.error('Ошибка входа:', error);
      } finally {
        setSubmitting(false);
      }
    },
    validate: (values) => {
      const errors: Partial<LoginFormValues> = {};

      if (!values.email) {
        errors.email = 'Email обязателен';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        errors.email = 'Неверный формат email';
      }

      if (!values.password) {
        errors.password = 'Пароль обязателен';
      } else if (values.password.length < 8) {
        errors.password = 'Пароль должен содержать минимум 8 символов';
      }

      return errors;
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.email}
        />
        {formik.touched.email && formik.errors.email && (
          <span className="error">{formik.errors.email}</span>
        )}
      </div>

      <div>
        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          name="password"
          type="password"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.password}
        />
        {formik.touched.password && formik.errors.password && (
          <span className="error">{formik.errors.password}</span>
        )}
      </div>

      <button type="submit" disabled={formik.isSubmitting}>
        {formik.isSubmitting ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
};
```

### Сокращённый синтаксис с `getFieldProps`

Для уменьшения дублирования кода Formik предоставляет метод `getFieldProps`:

```typescript
// Вместо явного указания onChange, onBlur, value:
<input
  id="email"
  type="email"
  {...formik.getFieldProps('email')}
/>
```

## Компонент `<Formik>`

Альтернативный способ использования через render-prop компонент. Удобен для сложных форм, когда нужно передавать состояние форм в дочерние компоненты:

```typescript
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';

interface RegistrationValues {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const RegistrationForm: React.FC = () => {
  const handleSubmit = async (
    values: RegistrationValues,
    { setSubmitting, setErrors }: FormikHelpers<RegistrationValues>
  ) => {
    try {
      await registerUser(values);
    } catch (error) {
      // Установка серверных ошибок
      setErrors({ email: 'Пользователь с таким email уже существует' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik<RegistrationValues>
      initialValues={{
        firstName: '',
        lastName: '',
        email: '',
        role: 'user',
      }}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, values }) => (
        <Form>
          <div>
            <label htmlFor="firstName">Имя</label>
            <Field id="firstName" name="firstName" type="text" />
            <ErrorMessage name="firstName" component="span" />
          </div>

          <div>
            <label htmlFor="lastName">Фамилия</label>
            <Field id="lastName" name="lastName" type="text" />
            <ErrorMessage name="lastName" component="span" />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <Field id="email" name="email" type="email" />
            <ErrorMessage name="email" component="span" />
          </div>

          <div>
            <label htmlFor="role">Роль</label>
            <Field id="role" name="role" as="select">
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
              <option value="moderator">Модератор</option>
            </Field>
          </div>

          <p>Выбранная роль: {values.role}</p>

          <button type="submit" disabled={isSubmitting}>
            Зарегистрироваться
          </button>
        </Form>
      )}
    </Formik>
  );
};
```

## Компоненты `<Form>`, `<Field>`, `<ErrorMessage>`

Formik предоставляет набор готовых компонентов, которые автоматически подключаются к контексту формы.

### `<Form>`
Обёртка над `<form>`, автоматически привязывает `onSubmit` к Formik:

```typescript
// Эти две записи эквивалентны:
<form onSubmit={formik.handleSubmit}>...</form>
<Form>...</Form>
```

### `<Field>`
Обёртка над `<input>`, автоматически привязывает `onChange`, `onBlur`, `value`:

```typescript
// Стандартный input:
<Field name="email" type="email" />

// Textarea:
<Field name="bio" as="textarea" rows={5} />

// Select:
<Field name="country" as="select">
  <option value="ru">Россия</option>
  <option value="us">США</option>
</Field>
```

### `<ErrorMessage>`
Показывает сообщение об ошибке для поля только если оно `touched`:

```typescript
// Рендер строки:
<ErrorMessage name="email" />

// Рендер кастомного компонента:
<ErrorMessage name="email" component="div" className="error-message" />

// Кастомный рендер через функцию:
<ErrorMessage name="email">
  {(msg) => <div className="alert alert-error">{msg}</div>}
</ErrorMessage>
```

## Интеграция с Yup

Yup — самый популярный выбор для валидации схем данных вместе с Formik. Передайте схему в проп `validationSchema`:

```typescript
import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';

interface ProfileValues {
  username: string;
  email: string;
  age: number;
  website: string;
  bio: string;
}

const profileSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Минимум 3 символа')
    .max(20, 'Максимум 20 символов')
    .matches(/^[a-zA-Z0-9_]+$/, 'Только латинские буквы, цифры и _')
    .required('Имя пользователя обязательно'),

  email: Yup.string()
    .email('Неверный формат email')
    .required('Email обязателен'),

  age: Yup.number()
    .min(18, 'Минимальный возраст 18 лет')
    .max(100, 'Введите корректный возраст')
    .required('Возраст обязателен'),

  website: Yup.string()
    .url('Введите корректный URL')
    .nullable(),

  bio: Yup.string()
    .max(500, 'Максимум 500 символов'),
});

const ProfileForm: React.FC = () => (
  <Formik<ProfileValues>
    initialValues={{
      username: '',
      email: '',
      age: 18,
      website: '',
      bio: '',
    }}
    validationSchema={profileSchema}
    onSubmit={(values) => {
      console.log('Данные профиля:', values);
    }}
  >
    {({ errors, touched }) => (
      <Form>
        <div>
          <Field name="username" placeholder="Имя пользователя" />
          {touched.username && errors.username && (
            <div>{errors.username}</div>
          )}
        </div>

        <div>
          <Field name="email" type="email" placeholder="Email" />
          <ErrorMessage name="email" component="div" />
        </div>

        <div>
          <Field name="age" type="number" min={18} />
          <ErrorMessage name="age" component="div" />
        </div>

        <div>
          <Field name="website" type="url" placeholder="https://example.com" />
          <ErrorMessage name="website" component="div" />
        </div>

        <div>
          <Field name="bio" as="textarea" rows={4} placeholder="О себе" />
          <ErrorMessage name="bio" component="div" />
        </div>

        <button type="submit">Сохранить</button>
      </Form>
    )}
  </Formik>
);
```

### Асинхронная валидация с Yup

```typescript
const asyncSchema = Yup.object().shape({
  username: Yup.string()
    .required('Обязательное поле')
    .test('unique-username', 'Такое имя уже занято', async (value) => {
      if (!value) return true;
      const isAvailable = await checkUsernameAvailability(value);
      return isAvailable;
    }),
});
```

## Кастомные поля с `<Field>`

### Render-prop вариант

```typescript
import { Field, FieldProps } from 'formik';

interface CustomInputProps {
  label: string;
  name: string;
  type?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({ label, name, type = 'text' }) => (
  <Field name={name}>
    {({ field, meta }: FieldProps) => (
      <div className={`form-group ${meta.touched && meta.error ? 'has-error' : ''}`}>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          type={type}
          className="form-control"
          {...field}
        />
        {meta.touched && meta.error && (
          <div className="error-message">{meta.error}</div>
        )}
      </div>
    )}
  </Field>
);

// Использование:
<CustomInput name="email" label="Email" type="email" />
<CustomInput name="username" label="Имя пользователя" />
```

### Хук `useField`

Для создания полностью кастомных компонентов вне компонента `<Field>`:

```typescript
import { useField, FieldHookConfig } from 'formik';

interface TextInputProps extends FieldHookConfig<string> {
  label: string;
  placeholder?: string;
}

const TextInput: React.FC<TextInputProps> = ({ label, ...props }) => {
  const [field, meta] = useField(props);

  return (
    <div className="form-field">
      <label htmlFor={props.id || props.name}>{label}</label>
      <input
        className={`input ${meta.touched && meta.error ? 'input-error' : ''}`}
        {...field}
        {...props}
      />
      {meta.touched && meta.error && (
        <p className="error-text">{meta.error}</p>
      )}
    </div>
  );
};

// Компонент для чекбокса:
const Checkbox: React.FC<FieldHookConfig<boolean> & { label: string }> = ({ label, ...props }) => {
  const [field, meta] = useField({ ...props, type: 'checkbox' });

  return (
    <div className="checkbox-group">
      <label>
        <input type="checkbox" {...field} />
        {label}
      </label>
      {meta.touched && meta.error && (
        <p className="error-text">{meta.error}</p>
      )}
    </div>
  );
};

// Использование:
<TextInput name="firstName" label="Имя" placeholder="Введите имя" />
<Checkbox name="acceptTerms" label="Принимаю условия" type="checkbox" />
```

## Работа с массивами: `<FieldArray>`

`FieldArray` позволяет работать с динамическими списками полей:

```typescript
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface TodoItem {
  task: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
}

interface TodoFormValues {
  todos: TodoItem[];
}

const todoSchema = Yup.object().shape({
  todos: Yup.array()
    .of(
      Yup.object().shape({
        task: Yup.string()
          .min(3, 'Минимум 3 символа')
          .required('Задача обязательна'),
        deadline: Yup.string().required('Укажите дедлайн'),
        priority: Yup.string()
          .oneOf(['low', 'medium', 'high'])
          .required('Укажите приоритет'),
      })
    )
    .min(1, 'Добавьте хотя бы одну задачу'),
});

const TodoForm: React.FC = () => (
  <Formik<TodoFormValues>
    initialValues={{
      todos: [{ task: '', deadline: '', priority: 'medium' }],
    }}
    validationSchema={todoSchema}
    onSubmit={(values) => {
      console.log('Задачи:', values.todos);
    }}
  >
    {({ values, errors, touched }) => (
      <Form>
        <FieldArray name="todos">
          {({ push, remove }) => (
            <div>
              {values.todos.map((todo, index) => (
                <div key={index} className="todo-item">
                  <h4>Задача {index + 1}</h4>

                  <div>
                    <Field
                      name={`todos.${index}.task`}
                      placeholder="Описание задачи"
                    />
                    <ErrorMessage
                      name={`todos.${index}.task`}
                      component="div"
                    />
                  </div>

                  <div>
                    <Field name={`todos.${index}.deadline`} type="date" />
                    <ErrorMessage
                      name={`todos.${index}.deadline`}
                      component="div"
                    />
                  </div>

                  <div>
                    <Field name={`todos.${index}.priority`} as="select">
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </Field>
                  </div>

                  {values.todos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                    >
                      Удалить задачу
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => push({ task: '', deadline: '', priority: 'medium' })}
              >
                + Добавить задачу
              </button>

              {typeof errors.todos === 'string' && (
                <div className="error">{errors.todos}</div>
              )}
            </div>
          )}
        </FieldArray>

        <button type="submit">Сохранить</button>
      </Form>
    )}
  </Formik>
);
```

### Доступные методы `FieldArray`

| Метод | Описание |
|-------|----------|
| `push(value)` | Добавить элемент в конец массива |
| `pop()` | Удалить последний элемент |
| `unshift(value)` | Добавить элемент в начало массива |
| `insert(index, value)` | Вставить элемент по индексу |
| `remove(index)` | Удалить элемент по индексу |
| `swap(indexA, indexB)` | Поменять элементы местами |
| `move(from, to)` | Переместить элемент |
| `replace(index, value)` | Заменить элемент по индексу |

## Управление состоянием формы вручную

Иногда требуется программно изменить значения формы:

```typescript
import { useFormik } from 'formik';

const AdvancedForm: React.FC = () => {
  const formik = useFormik({
    initialValues: {
      country: '',
      city: '',
    },
    onSubmit: (values) => console.log(values),
  });

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    // Сбрасываем город при смене страны
    formik.setFieldValue('country', country);
    formik.setFieldValue('city', '');
  };

  const fillTestData = () => {
    // Установка нескольких значений одновременно
    formik.setValues({
      country: 'ru',
      city: 'Москва',
    });
  };

  const resetCityError = () => {
    // Сброс ошибки конкретного поля
    formik.setFieldError('city', undefined);
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <select
        name="country"
        value={formik.values.country}
        onChange={handleCountryChange}
        onBlur={formik.handleBlur}
      >
        <option value="">Выберите страну</option>
        <option value="ru">Россия</option>
        <option value="us">США</option>
      </select>

      <input
        name="city"
        value={formik.values.city}
        {...formik.getFieldProps('city')}
        disabled={!formik.values.country}
      />

      <button type="button" onClick={fillTestData}>
        Заполнить тестовыми данными
      </button>

      <button type="submit">Отправить</button>
    </form>
  );
};
```

## Обработка серверных ошибок

```typescript
import { Formik, Form, Field, FormikHelpers } from 'formik';

interface ApiError {
  field: string;
  message: string;
}

const FormWithServerErrors: React.FC = () => {
  const handleSubmit = async (
    values: { email: string; username: string },
    { setFieldError, setStatus, setSubmitting }: FormikHelpers<{ email: string; username: string }>
  ) => {
    try {
      await submitForm(values);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        // Ошибки для конкретных полей
        error.errors.forEach((err: ApiError) => {
          setFieldError(err.field, err.message);
        });
      } else {
        // Общая ошибка формы
        setStatus({ error: 'Произошла ошибка сервера. Попробуйте позже.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{ email: '', username: '' }}
      onSubmit={handleSubmit}
    >
      {({ status }) => (
        <Form>
          {status?.error && (
            <div className="alert-error">{status.error}</div>
          )}

          <Field name="email" type="email" />
          <Field name="username" />

          <button type="submit">Отправить</button>
        </Form>
      )}
    </Formik>
  );
};
```

## Полный пример: форма создания продукта

Объединим все концепции в реальном примере:

```typescript
import React from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';

interface ProductAttribute {
  name: string;
  value: string;
}

interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  images: string[];
  attributes: ProductAttribute[];
  tags: string;
}

const productSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Название слишком короткое')
    .max(100, 'Название слишком длинное')
    .required('Название обязательно'),
  description: Yup.string()
    .max(1000, 'Максимум 1000 символов'),
  price: Yup.number()
    .min(0, 'Цена не может быть отрицательной')
    .required('Укажите цену'),
  category: Yup.string()
    .required('Выберите категорию'),
  attributes: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Укажите название атрибута'),
      value: Yup.string().required('Укажите значение'),
    })
  ),
});

const initialValues: ProductFormValues = {
  name: '',
  description: '',
  price: 0,
  category: '',
  inStock: true,
  images: [''],
  attributes: [],
  tags: '',
};

const ProductForm: React.FC = () => {
  const handleSubmit = async (
    values: ProductFormValues,
    { setSubmitting, resetForm }: FormikHelpers<ProductFormValues>
  ) => {
    const tags = values.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const product = { ...values, tags };

    try {
      await createProduct(product);
      resetForm();
      alert('Продукт создан!');
    } catch (error) {
      alert('Ошибка создания продукта');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik<ProductFormValues>
      initialValues={initialValues}
      validationSchema={productSchema}
      onSubmit={handleSubmit}
    >
      {({ values, isSubmitting, isValid, dirty }) => (
        <Form className="product-form">
          <h2>Создание продукта</h2>

          {/* Основная информация */}
          <section>
            <div className="form-group">
              <label htmlFor="name">Название *</label>
              <Field id="name" name="name" className="input" />
              <ErrorMessage name="name" component="p" className="error" />
            </div>

            <div className="form-group">
              <label htmlFor="description">Описание</label>
              <Field id="description" name="description" as="textarea" rows={4} />
              <ErrorMessage name="description" component="p" className="error" />
            </div>

            <div className="form-group">
              <label htmlFor="price">Цена *</label>
              <Field id="price" name="price" type="number" min="0" step="0.01" />
              <ErrorMessage name="price" component="p" className="error" />
            </div>

            <div className="form-group">
              <label htmlFor="category">Категория *</label>
              <Field id="category" name="category" as="select">
                <option value="">Выберите категорию</option>
                <option value="electronics">Электроника</option>
                <option value="clothing">Одежда</option>
                <option value="food">Продукты</option>
              </Field>
              <ErrorMessage name="category" component="p" className="error" />
            </div>

            <div className="form-group">
              <label>
                <Field name="inStock" type="checkbox" />
                В наличии
              </label>
            </div>
          </section>

          {/* Атрибуты */}
          <section>
            <h3>Атрибуты</h3>
            <FieldArray name="attributes">
              {({ push, remove }) => (
                <>
                  {values.attributes.map((_, index) => (
                    <div key={index} className="attribute-row">
                      <Field
                        name={`attributes.${index}.name`}
                        placeholder="Атрибут (напр. Цвет)"
                      />
                      <ErrorMessage
                        name={`attributes.${index}.name`}
                        component="span"
                      />

                      <Field
                        name={`attributes.${index}.value`}
                        placeholder="Значение (напр. Красный)"
                      />
                      <ErrorMessage
                        name={`attributes.${index}.value`}
                        component="span"
                      />

                      <button type="button" onClick={() => remove(index)}>
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => push({ name: '', value: '' })}
                  >
                    + Добавить атрибут
                  </button>
                </>
              )}
            </FieldArray>
          </section>

          {/* Теги */}
          <div className="form-group">
            <label htmlFor="tags">Теги (через запятую)</label>
            <Field
              id="tags"
              name="tags"
              placeholder="электроника, смартфоны, новинки"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isValid || !dirty}
          >
            {isSubmitting ? 'Создание...' : 'Создать продукт'}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default ProductForm;
```

## Formik vs React Hook Form: детальное сравнение

Это два главных конкурента в мире форм для React. Выбор между ними часто зависит от конкретных требований проекта.

### Архитектурные различия

**Formik** использует подход с управляемыми компонентами (controlled components). Все значения хранятся в React-состоянии, каждое изменение вызывает ре-рендер.

**React Hook Form** использует неуправляемые компоненты (uncontrolled components) и refs. Значения хранятся в нативных DOM-элементах, React-состояние обновляется только при необходимости.

### Сравнительная таблица

| Критерий | Formik | React Hook Form |
|----------|--------|-----------------|
| **Производительность** | Каждый keystroke = ре-рендер | Минимальные ре-рендеры |
| **Bundle size** | ~13 KB gzip | ~8 KB gzip |
| **Кривая обучения** | Пологая, интуитивная | Немного круче (refs, Controller) |
| **TypeScript** | Хорошая поддержка | Отличная поддержка |
| **Валидация** | Yup / кастомная | Встроенная / Yup / Zod |
| **FieldArray** | Встроенный | useFieldArray |
| **Девинструменты** | Нет | React Hook Form DevTools |
| **Активность разработки** | Maintenance mode | Активная |
| **Кастомные компоненты** | useField | Controller |
| **Сброс формы** | resetForm() | reset() |

### Пример одной формы на обеих библиотеках

**Formik:**
```typescript
const FormikExample = () => {
  const formik = useFormik({
    initialValues: { email: '' },
    onSubmit: (values) => console.log(values),
    validate: (values) => {
      const errors: { email?: string } = {};
      if (!values.email) errors.email = 'Обязательное поле';
      return errors;
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <input
        name="email"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      {formik.touched.email && formik.errors.email && (
        <span>{formik.errors.email}</span>
      )}
      <button type="submit">Отправить</button>
    </form>
  );
};
```

**React Hook Form:**
```typescript
const RHFExample = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input
        {...register('email', { required: 'Обязательное поле' })}
      />
      {errors.email && <span>{errors.email.message}</span>}
      <button type="submit">Отправить</button>
    </form>
  );
};
```

### Производительность: наглядный пример

```typescript
// Formik — ре-рендер на каждое нажатие клавиши
const FormikCounter: React.FC = () => {
  const [renderCount, setRenderCount] = React.useState(0);

  React.useEffect(() => {
    setRenderCount((c) => c + 1);
  });

  const formik = useFormik({
    initialValues: { text: '' },
    onSubmit: () => {},
  });

  return (
    <div>
      <p>Ре-рендеры: {renderCount}</p> {/* Растёт с каждым вводом */}
      <input {...formik.getFieldProps('text')} />
    </div>
  );
};

// React Hook Form — ре-рендер только при изменении состояния ошибок
const RHFCounter: React.FC = () => {
  const [renderCount, setRenderCount] = React.useState(0);

  React.useEffect(() => {
    setRenderCount((c) => c + 1);
  });

  const { register } = useForm();

  return (
    <div>
      <p>Ре-рендеры: {renderCount}</p> {/* Практически не растёт */}
      <input {...register('text')} />
    </div>
  );
};
```

## Когда использовать Formik

### Используйте Formik если:

1. **Вы переносите код с Redux Form** — Formik имеет схожий API и будет легко освоен командой.

2. **Команда предпочитает декларативный стиль** — компоненты `<Form>`, `<Field>`, `<ErrorMessage>` делают код читаемым и структурированным.

3. **Нужна глубокая интеграция с Yup** — пара Formik + Yup является классическим и хорошо документированным сочетанием.

4. **Проект не критичен к производительности** — например, формы в административных панелях с небольшим числом полей.

5. **Важна простота обучения** — Formik проще для джунов и людей, не знакомых с концепцией uncontrolled components.

6. **Вы работаете с легаси-кодом** — Formik отлично работает с React 16+ и не требует обновления зависимостей.

### Рассмотрите React Hook Form если:

1. **Производительность критична** — большие формы (50+ полей), мобильные устройства, слабые компьютеры пользователей.

2. **Важен размер бандла** — RHF в среднем на 40% легче.

3. **Активная поддержка важна** — Formik в maintenance mode, RHF активно развивается.

4. **Нужна интеграция с Zod** — RHF + Zod даёт лучший DX для TypeScript-проектов.

5. **Вы строите новый проект с нуля** — стоит выбрать более современное решение.

### Используйте нативные React-механизмы если:

1. **Форма содержит 1-3 поля** — useState + простая валидация будет проще.
2. **Нет сложной валидации** — библиотека добавит лишний вес.
3. **Вы используете Server Actions в Next.js** — FormData API часто проще для серверных форм.

## Оптимизация производительности в Formik

Несмотря на то, что Formik по умолчанию вызывает ре-рендеры на каждый keystroke, существуют способы оптимизации:

### 1. Разделение формы на компоненты с `React.memo`

```typescript
const EmailField = React.memo(({ error, touched }: {
  error?: string;
  touched?: boolean;
}) => (
  <div>
    <Field name="email" type="email" />
    {touched && error && <span>{error}</span>}
  </div>
));

// Компонент не будет ре-рендериться если пропсы не изменились
```

### 2. `FastField` для независимых полей

`FastField` — оптимизированная версия `Field`, которая ре-рендерится только если изменилось значение именно этого поля:

```typescript
import { FastField } from 'formik';

// FastField подходит если поле не зависит от других полей
<FastField name="firstName" />
<FastField name="lastName" />

// Обычный Field нужен если поле зависит от других значений
<Field name="city">
  {({ field }: FieldProps) => (
    <select {...field} disabled={!values.country}>
      {/* опции зависят от values.country */}
    </select>
  )}
</Field>
```

### 3. Отложенная валидация

```typescript
const formik = useFormik({
  initialValues: { search: '' },
  validate: (values) => {
    // Избегаем валидации на каждый символ
    const errors: { search?: string } = {};
    if (values.search.length < 3 && values.search.length > 0) {
      errors.search = 'Минимум 3 символа для поиска';
    }
    return errors;
  },
  // Отключить валидацию при изменении (только при blur и submit)
  validateOnChange: false,
  validateOnBlur: true,
  onSubmit: () => {},
});
```

## Распространённые паттерны и решения

### Форма с вкладками (multi-step wizard)

```typescript
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

interface WizardFormValues {
  // Шаг 1
  firstName: string;
  lastName: string;
  // Шаг 2
  email: string;
  phone: string;
  // Шаг 3
  plan: string;
  acceptTerms: boolean;
}

const step1Schema = Yup.object().shape({
  firstName: Yup.string().required('Обязательно'),
  lastName: Yup.string().required('Обязательно'),
});

const step2Schema = Yup.object().shape({
  email: Yup.string().email().required('Обязательно'),
  phone: Yup.string().matches(/^\+?[0-9]{10,15}$/, 'Неверный номер'),
});

const step3Schema = Yup.object().shape({
  plan: Yup.string().required('Выберите тариф'),
  acceptTerms: Yup.boolean().isTrue('Необходимо принять условия'),
});

const schemas = [step1Schema, step2Schema, step3Schema];

const MultiStepForm: React.FC = () => {
  const [step, setStep] = useState(0);
  const isLastStep = step === 2;

  return (
    <Formik<WizardFormValues>
      initialValues={{
        firstName: '', lastName: '',
        email: '', phone: '',
        plan: '', acceptTerms: false,
      }}
      validationSchema={schemas[step]}
      onSubmit={(values, actions) => {
        if (!isLastStep) {
          setStep((s) => s + 1);
          actions.setTouched({});
          actions.setSubmitting(false);
        } else {
          console.log('Финальные данные:', values);
          actions.setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form>
          <div className="step-indicator">Шаг {step + 1} из 3</div>

          {step === 0 && (
            <>
              <Field name="firstName" placeholder="Имя" />
              <Field name="lastName" placeholder="Фамилия" />
            </>
          )}

          {step === 1 && (
            <>
              <Field name="email" type="email" placeholder="Email" />
              <Field name="phone" placeholder="Телефон" />
            </>
          )}

          {step === 2 && (
            <>
              <Field name="plan" as="select">
                <option value="">Выберите тариф</option>
                <option value="basic">Базовый</option>
                <option value="pro">Профессиональный</option>
              </Field>
              <label>
                <Field name="acceptTerms" type="checkbox" />
                Принимаю условия использования
              </label>
            </>
          )}

          <div className="wizard-buttons">
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)}>
                Назад
              </button>
            )}
            <button type="submit" disabled={isSubmitting}>
              {isLastStep ? 'Завершить' : 'Далее'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};
```

### Инициализация из API (редактирование)

```typescript
import React, { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';

interface UserProfile {
  id: string;
  name: string;
  bio: string;
}

const EditProfileForm: React.FC<{ userId: string }> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile(userId)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Загрузка...</div>;
  if (!profile) return <div>Профиль не найден</div>;

  return (
    <Formik<{ name: string; bio: string }>
      initialValues={{
        name: profile.name,
        bio: profile.bio,
      }}
      // enableReinitialize важно при асинхронной загрузке данных
      enableReinitialize
      onSubmit={async (values, { setSubmitting }) => {
        await updateUserProfile(userId, values);
        setSubmitting(false);
      }}
    >
      {({ isSubmitting, dirty }) => (
        <Form>
          <Field name="name" placeholder="Имя" />
          <Field name="bio" as="textarea" />
          <button type="submit" disabled={isSubmitting || !dirty}>
            Сохранить изменения
          </button>
        </Form>
      )}
    </Formik>
  );
};
```

## Типичные ошибки и решения

### 1. Предупреждение о неуправляемых компонентах

```typescript
// Ошибка: Warning: A component is changing an uncontrolled input to controlled
const formik = useFormik({
  initialValues: {
    name: undefined, // ❌ undefined вместо пустой строки
  },
  // ...
});

// Исправление: всегда инициализируйте строки пустой строкой
const formik = useFormik({
  initialValues: {
    name: '', // ✅
  },
  // ...
});
```

### 2. Форма не обновляется при изменении `initialValues`

```typescript
// Проблема: initialValues загружаются асинхронно
<Formik
  initialValues={asyncData} // Сначала пустой объект
  // ...
>
  {/* Форма не обновится когда придут данные */}
</Formik>

// Решение: добавьте enableReinitialize
<Formik
  initialValues={asyncData}
  enableReinitialize // ✅ Форма обновится при изменении initialValues
>
  {/* ... */}
</Formik>
```

### 3. Ошибки не показываются при первом рендере

```typescript
// Поведение по умолчанию: ошибки показываются только для touched полей
{formik.touched.email && formik.errors.email && (
  <span>{formik.errors.email}</span>
)}

// Если нужно показать все ошибки сразу после Submit:
// Formik автоматически помечает все поля как touched при onSubmit
// Поэтому после попытки отправки все ошибки появятся
```

### 4. `setFieldValue` не обновляет UI немедленно

```typescript
// Formik использует useState внутри, обновление асинхронно
const handleSelect = (value: string) => {
  formik.setFieldValue('category', value);
  // Не делайте так — значение ещё не обновлено:
  // console.log(formik.values.category); // Старое значение!
};

// Решение: читайте значение из переменной, не из formik.values
const handleSelect = (value: string) => {
  formik.setFieldValue('category', value);
  // Используйте value, а не formik.values.category
  fetchSubcategories(value);
};
```

## Заключение

Formik остаётся мощным и зрелым решением для управления формами в React. Несмотря на то, что активная разработка приостановлена, библиотека стабильна, хорошо протестирована и широко документирована.

**Главные преимущества Formik:**
- Интуитивный декларативный API
- Отличная интеграция с Yup
- Богатая экосистема примеров и туториалов
- Хорошая поддержка TypeScript
- Простота обучения для новых разработчиков

**Основные ограничения:**
- Производительность уступает React Hook Form для больших форм
- Библиотека больше не развивается активно
- Больший размер бандла по сравнению с конкурентами

Для новых проектов стоит серьёзно рассмотреть **React Hook Form** как более современную и производительную альтернативу. Однако если вы работаете с существующим кодом на Formik или команда хорошо знакома с этой библиотекой — нет причин мигрировать. Formik отлично справляется со своей задачей и будет работать в вашем проекте ещё долгие годы.

## Дополнительные ресурсы

- [Официальная документация Formik](https://formik.org/)
- [GitHub репозиторий](https://github.com/jaredpalmer/formik)
- [Документация Yup](https://github.com/jquense/yup)
- [Сравнение библиотек форм для React](https://react-hook-form.com/get-started#ReactWebFormlibraries)
