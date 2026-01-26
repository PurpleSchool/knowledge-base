---
metaTitle: Управляемые формы controlled-forms в веб разработке
metaDescription: Подробное руководство по управляемым формам controlled-forms в React и веб разработке - принципы работа с состоянием примеры реализации и лучшие практики
author: Олег Марков
title: Управляемые формы controlled-forms в React и JavaScript
preview: Разберите на практике управляемые формы controlled-forms - как связать инпуты с состоянием валидировать данные и строить предсказуемые формы в React
---

## Введение

Управляемые формы (controlled-forms) — это подход, при котором состояние полей формы полностью контролируется кодом приложения, а не самим браузером. Вы как разработчик явно храните значения полей в состоянии (обычно в памяти приложения) и обновляете их при каждом вводе пользователя.

В современном фронтенде, особенно в React, Vue и других SPA-фреймворках, управляемые формы стали стандартом де-факто. Такой подход делает поведение формы предсказуемым, упрощает валидацию, логирование, интеграцию с API и повторное использование логики.

Смотрите, я покажу вам, как это устроено на примере React, но многие идеи легко переносятся и на другие библиотеки и даже на "чистый" JavaScript.

---

## Что такое управляемая форма

### Основная идея

Управляемая форма — это форма, в которой:

- значение поля берется из состояния приложения
- каждое изменение поля вызывает обработчик, который:
  - получает новое значение
  - обновляет состояние
  - передает это новое значение обратно в поле

В итоге:

- "истина" о том, что ввел пользователь, хранится не в DOM, а в состоянии (state)
- вы всегда знаете актуальные данные формы
- вы можете в любой момент изменить значения формы программно

Давайте посмотрим, как это выглядит в React на простом примере текстового поля.

```jsx
import { useState } from "react"

function ControlledInputExample() {
  // Здесь мы создаем состояние для значения поля ввода
  const [name, setName] = useState("")

  // Обработчик будет вызываться при каждом вводе символа
  const handleChange = (event) => {
    // Берем новое значение из event.target.value
    setName(event.target.value)
  }

  const handleSubmit = (event) => {
    // Отменяем стандартную отправку формы браузером
    event.preventDefault()
    // Здесь мы можем использовать текущее значение name
    console.log("Отправляем имя", name)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Поле ввода получает значение из состояния */}
      <input
        type="text"
        value={name}           // Управляемое значение
        onChange={handleChange} // Обработчик изменения
      />

      <button type="submit">
        Отправить
      </button>
    </form>
  )
}
```

Как видите, этот код делает следующее:

- значение поля `input` всегда равно `name`
- единственный источник правды — состояние `name`
- пользователь вводит текст, срабатывает `onChange`, обновляется `name`, компонент перерисовывается, `input` получает новое значение

---

## Управляемые vs неуправляемые формы

### В чем разница

Неуправляемая форма — это та, где вы полагаетесь на DOM и поведение браузера:

- значение хранится внутри самого элемента `input`
- вы читаете значение через `document.getElementById` или через `ref`
- валидация может быть только встроенными атрибутами (`required`, `pattern` и так далее) или проверкой в момент отправки

Управляемая форма:

- значение хранится в состоянии
- DOM-элемент только отображает это значение и сообщает об изменениях
- любая логика (маски, валидация, автоформатирование) реализуется через код

Чтобы разницу было проще увидеть, давайте сравним.

#### Неуправляемое поле в React

```jsx
import { useRef } from "react"

function UncontrolledExample() {
  // Здесь мы создаем ref для доступа к DOM элементу
  const inputRef = useRef(null)

  const handleSubmit = (event) => {
    event.preventDefault()

    // Читаем текущее значение прямо из DOM
    const value = inputRef.current.value
    console.log("Значение формы", value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        // Поле не связано со state - оно неуправляемое
        ref={inputRef} 
      />
      <button type="submit">
        Отправить
      </button>
    </form>
  )
}
```

#### Управляемое поле в React

```jsx
import { useState } from "react"

function ControlledExample() {
  const [value, setValue] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()
    // Здесь мы уже храним значение в состоянии
    console.log("Значение формы", value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}               // Связанное состояние
        onChange={(e) => setValue(e.target.value)} // Обновление
      />
      <button type="submit">
        Отправить
      </button>
    </form>
  )
}
```

### Плюсы управляемых форм

- предсказуемость — данные всегда в состоянии, в любом месте компонента вы знаете, что сейчас в форме
- простая валидация — можно валидировать данные "на лету" при каждом `onChange`
- легкая интеграция с API — состояние формы можно сразу отправить на сервер или подставить в запрос
- форматирование ввода — можно добавлять маски, автоформатирование, подсказки
- синхронизация с остальным UI — при изменении в одном месте можно автоматически менять другое

### Когда достаточно неуправляемых

Иногда можно использовать неуправляемые формы:

- простая одинарная форма, где нужен только финальный результат по `onSubmit`
- форма с максимально базовой логикой
- ситуации, где важна производительность и нет потребности реагировать на каждое изменение

Чаще всего в реальных приложениях удобнее управляемые формы, и именно на них мы будем делать акцент дальше.

---

## Базовая структура управляемой формы

### Один инпут и одно состояние

Начнем с самого простого случая, на котором лучше всего видна идея.

```jsx
import { useState } from "react"

function SimpleControlledForm() {
  // Создаем состояние для одного поля
  const [email, setEmail] = useState("")

  // Обработчик изменения поля
  const handleEmailChange = (event) => {
    // Извлекаем текст из поля ввода
    const newEmail = event.target.value
    setEmail(newEmail)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    // Здесь уже есть проверенный email
    console.log("Отправляем email", email)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
        />
      </label>

      <button type="submit">
        Отправить
      </button>
    </form>
  )
}
```

Здесь вы видите минимальный шаблон:

- `value={email}` — связывание значения
- `onChange={handleEmailChange}` — обновление по вводу
- чтение актуального значения в `handleSubmit`

### Несколько полей — несколько состояний

Если полей немного, удобно для каждого хранить отдельный `useState`.

```jsx
import { useState } from "react"

function MultiFieldForm() {
  // Состояние для имени
  const [name, setName] = useState("")
  // Состояние для возраста
  const [age, setAge] = useState("")
  // Состояние для согласия
  const [agree, setAgree] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    // Собираем данные формы в один объект
    const formData = { name, age, agree }
    console.log("Данные формы", formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Имя
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label>
        Возраст
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
      </label>

      <label>
        <input
          type="checkbox"
          checked={agree} // Для checkbox используем checked
          onChange={(e) => setAgree(e.target.checked)}
        />
        Согласен с условиями
      </label>

      <button type="submit">
        Отправить
      </button>
    </form>
  )
}
```

Обратите внимание:

- для `checkbox` мы используем `checked`, а не `value`
- тип значения в состоянии может отличаться от "визуального" (например, возраст у нас хранится строкой, хотя в поле указан тип `number`)

---

## Один объект состояния для всей формы

### Почему это удобно

Когда полей становится больше, держать по одному `useState` на каждое поле становится неудобно:

- много похожих обработчиков
- дублирование кода
- сложнее поддерживать

Частое решение — один объект состояния для всей формы.

```jsx
import { useState } from "react"

function ProfileForm() {
  // Здесь мы храним все поля формы в одном объекте
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    // Обновляем только то поле, которое изменилось
    setForm((prev) => ({
      ...prev,       // Копируем предыдущие значения
      [name]: value, // Перезаписываем одно поле по имени
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log("Данные профиля", form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Имя
        <input
          type="text"
          name="firstName"        // Имя поля в объекте form
          value={form.firstName}  // Привязка к состоянию
          onChange={handleChange} // Универсальный обработчик
        />
      </label>

      <label>
        Фамилия
        <input
          type="text"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
        />
      </label>

      <label>
        Email
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
        />
      </label>

      <label>
        Возраст
        <input
          type="number"
          name="age"
          value={form.age}
          onChange={handleChange}
        />
      </label>

      <button type="submit">
        Сохранить
      </button>
    </form>
  )
}
```

Давайте разберемся на примере `handleChange`:

- мы читаем `name` и `value` из `event.target`
- считаем, что `name` совпадает с ключом в объекте `form`
- обновляем только одно поле, используя вычисляемое имя свойства `[name]`

Так формируется универсальный обработчик, который работает сразу для всех полей ввода.

### Работа с чекбоксами и переключателями

Для `checkbox` и `radio` немного отличается логика, там нужно брать не `value`, а `checked`.

```jsx
function PreferencesForm() {
  const [form, setForm] = useState({
    emailNotifications: false,
    theme: "light",
  })

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target

    setForm((prev) => ({
      ...prev,
      // Для checkbox берем checked, для остальных — value
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  return (
    <form>
      <label>
        <input
          type="checkbox"
          name="emailNotifications"
          checked={form.emailNotifications}
          onChange={handleChange}
        />
        Получать уведомления по email
      </label>

      <div>
        Тема оформления
        <label>
          <input
            type="radio"
            name="theme"
            value="light"
            checked={form.theme === "light"}
            onChange={handleChange}
          />
          Светлая
        </label>
        <label>
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={form.theme === "dark"}
            onChange={handleChange}
          />
          Темная
        </label>
      </div>
    </form>
  )
}
```

Здесь я размещаю пример, чтобы вам было проще увидеть, как один обработчик обслуживает разные типы полей.

---

## Валидация в управляемых формах

### Когда валидировать

В управляемых формах вы можете валидировать:

- при каждом вводе (onChange)
- при потере фокуса (onBlur)
- при отправке формы (onSubmit)

Часто комбинируют подходы: базовая валидация при вводе, более строгая — при отправке.

### Пример валидации "на лету"

Давайте посмотрим, что происходит в следующем примере.

```jsx
import { useState } from "react"

function LoginForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })

  const validateField = (name, value) => {
    // Здесь мы возвращаем текст ошибки или пустую строку
    if (name === "email") {
      if (!value) return "Email обязателен"
      if (!value.includes("@")) return "Некорректный email"
      return ""
    }

    if (name === "password") {
      if (!value) return "Пароль обязателен"
      if (value.length < 6) return "Минимум 6 символов"
      return ""
    }

    return ""
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Сразу валидируем измененное поле
    const error = validateField(name, value)
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    // Полная проверка всех полей при отправке
    const newErrors = {
      email: validateField("email", form.email),
      password: validateField("password", form.password),
    }

    setErrors(newErrors)

    // Проверяем, есть ли ошибки
    const hasErrors = Object.values(newErrors).some(Boolean)
    if (hasErrors) {
      console.log("Форма содержит ошибки")
      return
    }

    console.log("Отправка формы", form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
        />
      </label>
      {/* Показываем ошибку если она есть */}
      {errors.email && (
        <div style={{ color: "red" }}>
          {errors.email}
        </div>
      )}

      <label>
        Пароль
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
        />
      </label>
      {errors.password && (
        <div style={{ color: "red" }}>
          {errors.password}
        </div>
      )}

      <button type="submit">
        Войти
      </button>
    </form>
  )
}
```

Покажу вам, как здесь работает связка:

- при каждом `onChange`:
  - обновляем значение поля
  - валидируем только его
- при `onSubmit`:
  - валидируем все поля еще раз
  - если есть ошибки, не отправляем форму

Это пример "ручной" валидации. В реальных проектах часто используют библиотеки вроде Yup или Zod, но сам принцип в управляемых формах всегда один: вы проверяете значения из состояния, а не из DOM.

---

## Инициализация и сброс управляемой формы

### Предзаполнение данными

Очень часто форма должна быть не пустой, а уже содержать данные пользователя, пришедшие с сервера. Смотрите, как это делается.

```jsx
function EditProfileForm({ initialData }) {
  // initialData может прийти как пропс извне
  const [form, setForm] = useState(() => ({
    name: initialData.name || "",
    city: initialData.city || "",
    bio: initialData.bio || "",
  }))

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log("Сохраняем профиль", form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
      />
      <input
        name="city"
        value={form.city}
        onChange={handleChange}
      />
      <textarea
        name="bio"
        value={form.bio}
        onChange={handleChange}
      />
      <button type="submit">
        Сохранить
      </button>
    </form>
  )
}
```

Здесь важно:

- использовать функцию в `useState`, чтобы инициализация прошла один раз
- при обновлении `initialData` снаружи вам, возможно, придется отдельно синхронизировать состояние (через `useEffect`)

### Сброс формы к начальному состоянию

Раз форма управляемая, сброс — это просто установка состояния в нужные значения.

```jsx
function ResettableForm() {
  const initialState = { name: "", email: "" }

  const [form, setForm] = useState(initialState)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleReset = () => {
    // Сбрасываем состояние формы к начальному
    setForm(initialState)
  }

  return (
    <form>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
      />
      <input
        name="email"
        value={form.email}
        onChange={handleChange}
      />

      <button type="button" onClick={handleReset}>
        Сбросить
      </button>
    </form>
  )
}
```

Как видите, нам не нужно обращаться к DOM и вызывать `form.reset()`. Достаточно изменить состояние, и UI сам подстроится.

---

## Управление сложными структурами данных

### Массивы полей (динамические списки)

Иногда форма содержит переменное количество однотипных полей: телефоны, адреса, пункты заказа. Управляемый подход позволяет просто оперировать массивами в состоянии.

```jsx
import { useState } from "react"

function PhonesForm() {
  const [phones, setPhones] = useState([""])

  const handlePhoneChange = (index, value) => {
    // Копируем массив и заменяем одно значение
    const updated = [...phones]
    updated[index] = value
    setPhones(updated)
  }

  const addPhone = () => {
    setPhones((prev) => [...prev, ""])
  }

  const removePhone = (index) => {
    setPhones((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log("Телефоны", phones)
  }

  return (
    <form onSubmit={handleSubmit}>
      {phones.map((phone, index) => (
        <div key={index}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(index, e.target.value)}
          />
          <button
            type="button"
            onClick={() => removePhone(index)}
          >
            Удалить
          </button>
        </div>
      ))}

      <button type="button" onClick={addPhone}>
        Добавить телефон
      </button>

      <button type="submit">
        Сохранить
      </button>
    </form>
  )
}
```

Теперь вы увидите, как это выглядит в коде:

- состояние `phones` — массив строк
- каждая строка — значение отдельного поля
- при изменении поля мы создаем новый массив и меняем только нужный элемент

### Вложенные объекты

Для вложенных структур можно использовать похожий подход, но аккуратно обновлять вложенные уровни.

```jsx
function AddressForm() {
  const [form, setForm] = useState({
    name: "",
    address: {
      city: "",
      street: "",
      zip: "",
    },
  })

  const handleNameChange = (event) => {
    setForm((prev) => ({
      ...prev,
      name: event.target.value,
    }))
  }

  const handleAddressChange = (event) => {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,   // Копируем старый адрес
        [name]: value,     // Обновляем одно поле адреса
      },
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log("Форма с адресом", form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Имя
        <input
          value={form.name}
          onChange={handleNameChange}
        />
      </label>

      <label>
        Город
        <input
          name="city"
          value={form.address.city}
          onChange={handleAddressChange}
        />
      </label>

      <label>
        Улица
        <input
          name="street"
          value={form.address.street}
          onChange={handleAddressChange}
        />
      </label>

      <label>
        Индекс
        <input
          name="zip"
          value={form.address.zip}
          onChange={handleAddressChange}
        />
      </label>

      <button type="submit">
        Сохранить
      </button>
    </form>
  )
}
```

Обратите внимание, как этот фрагмент кода решает задачу:

- мы всегда создаем новый объект `address`
- избегаем прямого изменения вложенных свойств в `prev.address`

---

## Частые ошибки и "подводные камни"

### Ошибка "A component is changing an uncontrolled input to be controlled"

В React она появляется, когда:

- сначала `value` или `checked` у `input` отсутствует (поле неуправляемое)
- а потом вы начинаете передавать `value` или `checked` (поле становится управляемым)

Чаще всего это происходит, когда начальное значение `undefined` или `null`.

Пример проблемы:

```jsx
function BadInput({ initial }) {
  const [value, setValue] = useState(initial)
  // Если initial не передали, значение будет undefined

  return (
    <input
      value={value}         // Иногда undefined
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
```

Как это исправить:

- задайте безопасное начальное значение (например, пустую строку)
- при чтении данных убедитесь, что подставляете строку

```jsx
function SafeInput({ initial }) {
  const [value, setValue] = useState(initial || "")

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
```

### Производительность при больших формах

Так как управляемая форма вызывает перерисовку компонента при каждом `onChange`, при очень больших формах это может становиться ощутимым.

Что можно сделать:

- разбить форму на более мелкие компоненты
- мемоизировать части с помощью `React.memo`
- при необходимости использовать библиотеки, которые оптимизируют перерисовки (например, `react-hook-form` с контроллерами)

Но даже в таких случаях базовый принцип "управляемости" сохраняется — состояние формы хранится в коде, а не в DOM.

---

## Управляемые формы и сторонние библиотеки

### Зачем нужны form-библиотеки

Когда форм становится много и они становятся сложнее, ручное управление всеми полями, ошибками, touched-состояниями и валидацией начинает отнимать время. Библиотеки (Formik, React Hook Form, Final Form и другие) автоматизируют:

- хранение значений полей
- отслеживание "грязных" полей (dirty)
- валидацию по схеме
- отображение ошибок
- отправку формы

При этом внутри они все равно реализуют управляемый подход: значения берутся из состояния, а не из DOM.

### Пример на React Hook Form как "управляемая форма через библиотеку"

С точки зрения концепции вы делаете то же самое, просто используете готовый хук.

```jsx
import { useForm } from "react-hook-form"

function RHFExample() {
  // useForm управляет состоянием полей за вас
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = (data) => {
    // data - объект со значениями всех полей
    console.log("Данные формы", data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>
        Имя
        <input
          // register связывает поле с внутренним state
          {...register("name", { required: "Имя обязательно" })}
        />
      </label>
      {errors.name && (
        <div style={{ color: "red" }}>
          {errors.name.message}
        </div>
      )}

      <label>
        Email
        <input
          {...register("email", {
            required: "Email обязателен",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Некорректный email",
            },
          })}
        />
      </label>
      {errors.email && (
        <div style={{ color: "red" }}>
          {errors.email.message}
        </div>
      )}

      <button type="submit">
        Отправить
      </button>
    </form>
  )
}
```

Здесь библиотека берет на себя рутину, но концепция "управляемости" остается: теперь уже сама библиотека контролирует значения.

---

## Практический пример полной управляемой формы

Давайте разберемся на примере формы регистрации с несколькими типами полей, валидацией и блокировкой кнопки отправки, если есть ошибки.

```jsx
import { useState } from "react"

function RegistrationForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  })

  const [errors, setErrors] = useState({})

  const validate = (values) => {
    const newErrors = {}

    if (!values.name.trim()) {
      newErrors.name = "Имя обязательно"
    }

    if (!values.email) {
      newErrors.email = "Email обязателен"
    } else if (!values.email.includes("@")) {
      newErrors.email = "Некорректный email"
    }

    if (!values.password) {
      newErrors.password = "Пароль обязателен"
    } else if (values.password.length < 6) {
      newErrors.password = "Пароль должен быть не менее 6 символов"
    }

    if (!values.confirmPassword) {
      newErrors.confirmPassword = "Повторите пароль"
    } else if (values.confirmPassword !== values.password) {
      newErrors.confirmPassword = "Пароли не совпадают"
    }

    if (!values.agree) {
      newErrors.agree = "Необходимо согласие с условиями"
    }

    return newErrors
  }

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target

    const newValue = type === "checkbox" ? checked : value

    // Обновляем значения формы
    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: newValue,
      }

      // Параллельно обновляем ошибки для конкретного поля
      const newErrors = validate(updated)
      setErrors(newErrors)

      return updated
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const finalErrors = validate(form)
    setErrors(finalErrors)

    if (Object.keys(finalErrors).length > 0) {
      console.log("Есть ошибки, отправка отменена")
      return
    }

    console.log("Регистрация с данными", form)
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Имя
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
        </label>
        {errors.name && (
          <div style={{ color: "red" }}>
            {errors.name}
          </div>
        )}
      </div>

      <div>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />
        </label>
        {errors.email && (
          <div style={{ color: "red" }}>
            {errors.email}
          </div>
        )}
      </div>

      <div>
        <label>
          Пароль
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />
        </label>
        {errors.password && (
          <div style={{ color: "red" }}>
            {errors.password}
          </div>
        )}
      </div>

      <div>
        <label>
          Повторите пароль
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </label>
        {errors.confirmPassword && (
          <div style={{ color: "red" }}>
            {errors.confirmPassword}
          </div>
        )}
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="agree"
            checked={form.agree}
            onChange={handleChange}
          />
          Я согласен с условиями
        </label>
        {errors.agree && (
          <div style={{ color: "red" }}>
            {errors.agree}
          </div>
        )}
      </div>

      <button type="submit" disabled={hasErrors}>
        Зарегистрироваться
      </button>
    </form>
  )
}
```

Здесь вы видите:

- единый объект `form` для всех полей
- единый объект `errors` для сообщений об ошибках
- функцию `validate`, которая работает только с данными, не трогая DOM
- блокировку кнопки `submit`, если есть ошибки

Это и есть типичный сценарий использования управляемой формы в реальном приложении.

---

Управляемые формы дают вам полный контроль над данными и поведением формы. Вы описываете бизнес-логику в коде, а не полагаетесь на "магические" свойства браузера. Это делает пользовательский интерфейс предсказуемым, тестируемым и хорошо расширяемым, особенно в больших приложениях.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как сделать управляемое поле textarea и чем оно отличается от input

Для textarea принцип тот же, что и для input. Разница только в теге.

```jsx
const [text, setText] = useState("")

return (
  <textarea
    value={text}                    // Управляемое значение
    onChange={(e) => setText(e.target.value)} // Обработчик
  />
)
```

Раньше в HTML текст был между тегами textarea, но в управляемом варианте в React всегда используется свойство value. Не нужно использовать children для начального текста, только value и состояние.

---

### Как правильно сделать управляемый select с несколькими значениями

Для множественного выбора в select используйте массив и атрибут multiple.

```jsx
const [selected, setSelected] = useState([])

const handleChange = (event) => {
  const options = Array.from(event.target.selectedOptions)
  const values = options.map((opt) => opt.value)
  setSelected(values)
}

return (
  <select
    multiple
    value={selected}
    onChange={handleChange}
  >
    <option value="a">A</option>
    <option value="b">B</option>
    <option value="c">C</option>
  </select>
)
```

Значение select — это массив строк, вы его храните в state и обновляете при изменении.

---

### Как реализовать маску ввода в управляемом поле (например, телефон)

Маску можно сделать прямо в обработчике onChange, форматируя ввод перед тем, как сохранять его в state.

```jsx
const [phone, setPhone] = useState("")

const handleChange = (event) => {
  const raw = event.target.value.replace(/\D/g, "") // Убираем все нецифры
  // Здесь простой пример форматирования
  const formatted = raw.replace(
    /(\d{1,3})(\d{0,3})(\d{0,2})(\d{0,2})/,
    (m, a, b, c, d) =>
      [a, b && "-" + b, c && "-" + c, d && "-" + d]
        .filter(Boolean)
        .join("")
  )
  setPhone(formatted)
}

return (
  <input
    value={phone}
    onChange={handleChange}
  />
)
```

Важный момент — всегда форматируйте значение перед вызовом setState, а не трогайте DOM напрямую.

---

### Как хранить и валидировать числа, если input всегда отдает строки

Input с типом number все равно возвращает строку, поэтому вы можете:

- хранить строку и валидировать через Number
- или сразу парсить в число

```jsx
const [age, setAge] = useState("")

const handleChange = (e) => {
  const value = e.target.value
  // Можно разрешать только цифры и пустое значение
  if (value === "" || /^\d+$/.test(value)) {
    setAge(value)
  }
}

const ageNumber = age ? Number(age) : null
```

Для валидации используйте Number.isNaN и сравнения, например `ageNumber >= 18`.

---

### Как синхронизировать управляемую форму с асинхронными данными (когда initialData приходит позже)

Если данные для формы приходят с сервера, инициализируйте state пустыми значениями, а затем обновите state через useEffect, когда данные загрузятся.

```jsx
const [form, setForm] = useState({ name: "", email: "" })

useEffect(() => {
  if (initialData) {
    setForm({
      name: initialData.name || "",
      email: initialData.email || "",
    })
  }
}, [initialData])

// Дальше используете form как обычно
```