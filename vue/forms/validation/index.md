---
metaTitle: Валидация форм в веб разработке
metaDescription: Разбор подходов к валидации форм в веб разработке - клиентская и серверная проверка данных паттерны реализации примеры кода и советы по архитектуре
author: Олег Марков
title: Валидация форм - полное руководство для разработчика
preview: Узнайте как правильно организовать валидацию форм - от простых HTML атрибутов до кастомной логики на JavaScript и серверной проверки
---

## Введение

Валидация форм (form-validation) — это проверка данных, которые пользователь вводит в форму, до того как они будут обработаны или сохранены. Основная цель — не дать в системе появиться некорректным, опасным или просто бессмысленным данным.

Смотрите, я покажу вам, как к этому подходить системно, а не через набор разрозненных проверок "на коленке". Мы разберем:

- какие типы валидации бывают;
- когда достаточно HTML5, а когда нужен JavaScript;
- зачем валидация на сервере, если уже есть клиентская;
- как проектировать правила так, чтобы их легко поддерживать и расширять;
- как показывать пользователю ошибки так, чтобы ими реально пользовались.

## Типы валидации форм

### Клиентская и серверная валидация

Разделим валидацию на две большие группы:

- Клиентская — выполняется в браузере до отправки формы.
- Серверная — выполняется на сервере после отправки данных.

Важно сразу зафиксировать: клиентская валидация — это удобство для пользователя, серверная — безопасность и целостность данных. Одна не заменяет другую.

#### Клиентская валидация

Клиентская валидация бывает:

- встроенная (HTML5 атрибуты);
- пользовательская на JavaScript.

Ее задачи:

- быстро подсказать пользователю, что введено что‑то не так;
- уменьшить количество лишних запросов на сервер;
- улучшить UX (мгновенная обратная связь).

Но полагаться на нее полностью нельзя: браузер можно обойти, запрос можно отправить вручную.

#### Серверная валидация

Сервер доверять данным из формы не должен никогда. На сервере вы:

- проверяете все обязательные поля;
- гарантируете корректные типы (email, число, дата);
- проверяете бизнес‑ограничения (логин уникален, лимиты, права доступа);
- защищаетесь от попыток взлома.

Даже если форма прошла все проверки в браузере, сервер обязан все перепроверить независимо.

### Синхронная и асинхронная валидация

- Синхронная — проверка выполняется сразу по текущему значению (например, длина строки, формат email).
- Асинхронная — чтобы проверить поле, нужно обратиться к серверу или другой внешней системе (проверка уникальности логина, проверка промокода).

Теперь давайте перейдем к тому, что можно сделать силами одного только HTML.

## Валидация средствами HTML5

HTML5 уже содержит довольно мощный набор инструментов для базовой валидации.

### Базовый пример формы с HTML5 валидацией

Здесь я размещаю пример, чтобы вам было проще понять, как работают встроенные атрибуты:

```html
<form>
  <!-- Обязательное текстовое поле -->
  <label>
    Имя
    <input type="text" name="name" required minlength="2" maxlength="50">
  </label>

  <!-- Проверка формата email -->
  <label>
    Email
    <input type="email" name="email" required>
  </label>

  <!-- Минимальное и максимальное значение числа -->
  <label>
    Возраст
    <input type="number" name="age" min="18" max="120">
  </label>

  <!-- Поле с шаблоном -->
  <label>
    Логин (только латинские буквы и цифры)
    <input type="text" name="login" required pattern="[A-Za-z0-9]{3,20}">
  </label>

  <button type="submit">Отправить</button>
</form>
```

Браузер сам отобразит базовые сообщения об ошибках при попытке отправки формы.

### Основные HTML5 атрибуты валидации

#### required

Поле не может быть пустым.

```html
<input type="text" name="name" required>
```

Браузер не даст отправить форму, если значение пустое.

#### type

Некоторые типы автоматически включают в себя валидацию формата:

- email — проверка, что введен email‑подобный текст;
- url — проверка формата URL;
- number — проверка, что введено число;
- date, datetime-local, time и т. д.

```html
<input type="email" name="email" required>
```

Обратите внимание: эти проверки базовые. Например, email будет считаться валидным, если содержит символ `@` и еще несколько признаков. Это не гарантирует, что адрес реальный, но защищает от совсем некорректного ввода.

#### minlength, maxlength

Проверяют длину текста.

```html
<input type="text" name="username" minlength="3" maxlength="20">
```

#### min, max, step

Работают с числовыми и некоторыми другими типами (`number`, `date`, `range`).

```html
<input type="number" name="age" min="18" max="99" step="1">
```

#### pattern

Позволяет задать регулярное выражение (атрибут `pattern` использует синтаксис RegExp без флагов, но без разделителей `/`).

```html
<!-- От 8 до 20 символов, хотя бы одна буква и одна цифра -->
<input
  type="password"
  name="password"
  required
  pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$">
```

Чтобы пользователю было понятно, почему поле не прошло проверку по pattern, имеет смысл добавлять атрибут `title` с подсказкой.

```html
<input
  type="password"
  name="password"
  required
  pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$"
  title="Пароль от 8 до 20 символов, минимум одна буква и одна цифра">
```

### Ограничения HTML5 валидации

HTML5‑валидации часто достаточно для простых форм, но:

- сообщения об ошибках зависят от браузера и тяжело полноценно кастомизируются без JavaScript;
- бизнес‑правила (например, "дата окончания должна быть позже даты начала") одной только разметкой не описать;
- нет простой поддержки асинхронных проверок.

Давайте посмотрим, как расширить эти возможности с помощью JavaScript.

## Кастомная клиентская валидация на JavaScript

Когда встроенных атрибутов недостаточно, вам нужна логика на JavaScript.

### Обработка отправки формы

Самый простой способ — перехватывать событие `submit` и проверять значения полей.

```html
<form id="signup-form">
  <label>
    Email
    <input type="email" name="email" id="email" required>
  </label>

  <label>
    Пароль
    <input type="password" name="password" id="password" required>
  </label>

  <label>
    Повторите пароль
    <input type="password" name="password_confirm" id="password_confirm" required>
  </label>

  <div id="form-error" style="color: red;"></div>

  <button type="submit">Зарегистрироваться</button>
</form>

<script>
  const form = document.getElementById('signup-form');
  const password = document.getElementById('password');
  const passwordConfirm = document.getElementById('password_confirm');
  const formError = document.getElementById('form-error');

  form.addEventListener('submit', function (event) {
    // Здесь мы очищаем сообщение об ошибке перед новой проверкой
    formError.textContent = '';

    // Проверяем, совпадают ли пароли
    if (password.value !== passwordConfirm.value) {
      // Отменяем отправку формы
      event.preventDefault();
      // Показываем сообщение пользователю
      formError.textContent = 'Пароли не совпадают';
    }
  });
</script>
```

Как видите, этот код выполняет простую, но важную проверку, которой нет "из коробки" в HTML5.

### Использование Constraint Validation API

Браузер предоставляет интерфейс для работы с валидацией, который можно использовать вместо полного переписывания логики.

У любого `input`, `textarea`, `select` есть свойства:

- `validity` — объект с флагами типа `valueMissing`, `typeMismatch`, `patternMismatch` и др.;
- `validationMessage` — стандартное сообщение об ошибке;
- `checkValidity()` — запускает проверку и возвращает `true`/`false`;
- `setCustomValidity(message)` — позволяет задать собственный текст ошибки.

Давайте разберемся на примере, как с этим работать:

```html
<form id="login-form">
  <label>
    Логин
    <input type="text" id="login" name="login" required minlength="3">
  </label>

  <span id="login-error" style="color: red;"></span>

  <button type="submit">Войти</button>
</form>

<script>
  const loginInput = document.getElementById('login');
  const loginError = document.getElementById('login-error');
  const loginForm = document.getElementById('login-form');

  function validateLogin() {
    // Здесь мы сбрасываем кастомное сообщение
    loginInput.setCustomValidity('');
    loginError.textContent = '';

    // Запрашиваем у браузера результат встроенной проверки
    if (!loginInput.checkValidity()) {
      // Если значение пустое, срабатывает required
      if (loginInput.validity.valueMissing) {
        loginInput.setCustomValidity('Введите логин');
      }

      // Если длина меньше минимальной
      if (loginInput.validity.tooShort) {
        loginInput.setCustomValidity(
          `Логин слишком короткий. Минимум ${loginInput.minLength} символа`
        );
      }

      // Показываем сообщение рядом с полем
      loginError.textContent = loginInput.validationMessage;
    }
  }

  // Здесь мы запускаем проверку при потере фокуса
  loginInput.addEventListener('blur', validateLogin);

  // Здесь мы запускаем проверку перед отправкой формы
  loginForm.addEventListener('submit', function (event) {
    validateLogin();

    // Если поле не валидно, отменяем отправку
    if (!loginInput.checkValidity()) {
      event.preventDefault();
    }
  });
</script>
```

Такой подход удобен тем, что вы не дублируете логику встроенных проверок, а только можете переопределять сообщения.

### Пошаговая (live) валидация по вводу

Хорошая практика — подсвечивать ошибки не только при отправке формы, но и при вводе данных.

Вот пример с обработчиком `input`:

```html
<form id="profile-form">
  <label>
    Имя
    <input type="text" id="name" name="name" required minlength="2">
  </label>
  <span id="name-error" style="color: red;"></span>

  <button type="submit">Сохранить</button>
</form>

<script>
  const nameInput = document.getElementById('name');
  const nameError = document.getElementById('name-error');

  function showNameError() {
    // Очищаем кастомную ошибку
    nameInput.setCustomValidity('');
    nameError.textContent = '';

    if (nameInput.validity.valueMissing) {
      nameInput.setCustomValidity('Введите имя');
    } else if (nameInput.validity.tooShort) {
      nameInput.setCustomValidity(
        `Имя слишком короткое. Минимум ${nameInput.minLength} символа`
      );
    }

    // Если поле не валидно, показываем ошибку
    if (!nameInput.checkValidity()) {
      nameError.textContent = nameInput.validationMessage;
    }
  }

  // Здесь мы валидируем поле при каждом изменении
  nameInput.addEventListener('input', showNameError);
</script>
```

Теперь вы увидите, как это выглядит в коде, когда пользователь исправляет ошибку — сообщение автоматически исчезает, как только значение стало валидным.

## Архитектура клиентской валидации

Когда форма большая, а проверок много, без структуры код быстро превращается в хаос. Давайте посмотрим, как можно организовать логику.

### Разделение правил и отображения ошибок

Хороший подход — разделить:

- "чистую" логику проверки (что считается правильным значением);
- отображение ошибок (как именно вы показываете пользователю проблему).

Покажу вам, как это реализовано на практике в упрощенном виде:

```html
<form id="register-form">
  <label>
    Email
    <input type="email" name="email" id="reg-email">
  </label>
  <span class="error" data-for="reg-email"></span>

  <label>
    Пароль
    <input type="password" name="password" id="reg-password">
  </label>
  <span class="error" data-for="reg-password"></span>

  <button type="submit">Создать аккаунт</button>
</form>

<script>
  const form = document.getElementById('register-form');

  // Здесь мы описываем правила валидации отдельно от DOM
  const validators = {
    'reg-email': function (value) {
      // Простая проверка, в реальном коде можно использовать более сложный regex
      if (!value) {
        return 'Email обязателен';
      }
      if (!value.includes('@')) {
        return 'Некорректный формат email';
      }
      return null; // null означает, что ошибок нет
    },
    'reg-password': function (value) {
      if (!value) {
        return 'Пароль обязателен';
      }
      if (value.length < 8) {
        return 'Пароль должен быть не короче 8 символов';
      }
      return null;
    }
  };

  function validateField(input) {
    const validator = validators[input.id];
    if (!validator) return true;

    // Здесь мы вызываем соответствующее поле правило проверки
    const errorMessage = validator(input.value);
    const errorSpan = form.querySelector(`.error[data-for="${input.id}"]`);

    if (errorMessage) {
      errorSpan.textContent = errorMessage;
      return false;
    } else {
      errorSpan.textContent = '';
      return true;
    }
  }

  // Здесь мы валидируем всю форму целиком
  function validateForm() {
    let isValid = true;
    Object.keys(validators).forEach((id) => {
      const input = document.getElementById(id);
      if (!validateField(input)) {
        isValid = false;
      }
    });
    return isValid;
  }

  // Живая валидация по вводу
  form.addEventListener('input', (event) => {
    if (event.target.tagName === 'INPUT') {
      validateField(event.target);
    }
  });

  // Проверка перед отправкой
  form.addEventListener('submit', (event) => {
    if (!validateForm()) {
      // Отменяем отправку, если есть ошибки
      event.preventDefault();
    }
  });
</script>
```

Обратите внимание, как этот фрагмент кода решает задачу масштабируемости: вы можете добавить новые поля, просто дописав функции в `validators`.

### Кросс‑полевая валидация

Иногда нужно проверять не отдельное поле, а сочетание нескольких. Например, дата начала должна быть раньше даты окончания.

Давайте посмотрим, что происходит в следующем примере:

```html
<form id="period-form">
  <label>
    Дата начала
    <input type="date" id="start-date" name="start">
  </label>

  <label>
    Дата окончания
    <input type="date" id="end-date" name="end">
  </label>

  <div id="period-error" style="color: red;"></div>

  <button type="submit">Сохранить</button>
</form>

<script>
  const periodForm = document.getElementById('period-form');
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  const periodError = document.getElementById('period-error');

  function validatePeriod() {
    periodError.textContent = '';

    // Если одно из полей пустое, не показываем ошибку,
    // а даем сработать стандартным правилам обязательности если они есть
    if (!startDateInput.value || !endDateInput.value) {
      return true;
    }

    const start = new Date(startDateInput.value);
    const end = new Date(endDateInput.value);

    if (start > end) {
      periodError.textContent = 'Дата начала не может быть позже даты окончания';
      return false;
    }

    return true;
  }

  // Проверка при изменении любого из полей
  startDateInput.addEventListener('change', validatePeriod);
  endDateInput.addEventListener('change', validatePeriod);

  periodForm.addEventListener('submit', (event) => {
    if (!validatePeriod()) {
      event.preventDefault();
    }
  });
</script>
```

Здесь вся логика валидации сосредоточена в одной функции `validatePeriod`, которая работает сразу с двумя полями.

## Асинхронная валидация

Иногда нужно проверить поле по данным с сервера: например, существует ли уже такой логин или email.

### Пример проверки уникальности логина

Покажу вам упрощенный пример с асинхронным запросом:

```html
<form id="user-form">
  <label>
    Логин
    <input type="text" id="user-login" name="login">
  </label>
  <span id="user-login-error" style="color: red;"></span>

  <button type="submit">Создать</button>
</form>

<script>
  const userForm = document.getElementById('user-form');
  const userLoginInput = document.getElementById('user-login');
  const userLoginError = document.getElementById('user-login-error');

  let lastCheckedLogin = '';
  let lastCheckResult = null;

  async function checkLoginUnique(login) {
    // Здесь мы запоминаем логин, который проверяем
    lastCheckedLogin = login;

    try {
      // Здесь мы отправляем запрос на сервер для проверки уникальности
      const response = await fetch(`/api/check-login?login=${encodeURIComponent(login)}`);

      // Если сервер вернул ошибку, считаем проверку неуспешной
      if (!response.ok) {
        throw new Error('Server error');
      }

      const data = await response.json();
      // Ожидаем что сервер вернет объект вида { unique: true/false }
      return data.unique;
    } catch (e) {
      // В случае ошибки запроса считаем что логин не прошел проверку
      return false;
    }
  }

  async function validateLoginAsync() {
    const login = userLoginInput.value.trim();
    userLoginError.textContent = '';

    if (!login) {
      return true;
    }

    // Здесь мы не выполняем лишние запросы если значение не изменилось
    if (login === lastCheckedLogin && lastCheckResult !== null) {
      if (!lastCheckResult) {
        userLoginError.textContent = 'Логин уже занят';
      }
      return lastCheckResult;
    }

    // Запрос на сервер
    const isUnique = await checkLoginUnique(login);
    lastCheckResult = isUnique;

    if (!isUnique) {
      userLoginError.textContent = 'Логин уже занят';
      return false;
    }

    return true;
  }

  // Запуск асинхронной проверки с небольшим debounce
  let loginCheckTimeout = null;
  userLoginInput.addEventListener('input', () => {
    clearTimeout(loginCheckTimeout);

    loginCheckTimeout = setTimeout(() => {
      validateLoginAsync();
    }, 500); // Ждем пока пользователь закончит ввод
  });

  userForm.addEventListener('submit', async (event) => {
    const result = await validateLoginAsync();
    if (!result) {
      event.preventDefault();
    }
  });
</script>
```

Здесь реализован простой `debounce`: мы не шлем запрос на каждый символ, а ждем полсекунды после последнего ввода.

## Серверная валидация

Теперь перейдем к серверу. Здесь уже не так важно, на каком языке вы пишете — подходы схожи.

### Основные принципы серверной проверки

1. Не доверять клиенту. Никакие проверки на фронтенде не отменяют обязательность валидации на бэкенде.
2. Разделять:
   - синтаксические проверки (поля не пустые, формат корректный);
   - бизнес‑правила (логин уникален, пользователь имеет право выполнить действие).
3. Возвращать фронтенду четкую структуру ошибок, а не просто "что‑то пошло не так".

### Пример серверной валидации на Node.js (Express)

Здесь я размещаю пример, чтобы вам было проще понять общий подход:

```js
// Здесь мы создаем маршрут обработки формы регистрации
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  const errors = {};

  // Простая проверка обязательности
  if (!email) {
    errors.email = 'Email обязателен';
  }

  // Пример проверки формата
  if (email && !email.includes('@')) {
    errors.email = 'Некорректный email';
  }

  if (!password) {
    errors.password = 'Пароль обязателен';
  }

  if (password && password.length < 8) {
    errors.password = 'Пароль должен быть не короче 8 символов';
  }

  // Если есть ошибки, возвращаем их клиенту
  if (Object.keys(errors).length > 0) {
    // Здесь мы отправляем код 400 и объект ошибок по полям
    return res.status(400).json({ errors });
  }

  // Здесь можно добавить бизнес-проверки например уникальность email
  const isTaken = await checkEmailExists(email); // Предполагаемая функция
  if (isTaken) {
    return res.status(400).json({
      errors: {
        email: 'Этот email уже зарегистрирован'
      }
    });
  }

  // Если все хорошо, продолжаем обработку
  const user = await createUser({ email, password }); // Сохранение в базе
  res.status(201).json({ id: user.id });
});
```

Клиентская часть может получить объект `errors` и отобразить сообщения у соответствующих полей.

### Повторное использование правил фронтом и бэком

Идеально — держать правила валидации в одном месте и переиспользовать их и на клиенте, и на сервере (например, через общий модуль в монорепозитории на JavaScript/TypeScript). Но даже если язык разный, полезно:

- формализовать список правил;
- согласовать коды ошибок (например, `required`, `too_short`, `invalid_email`);
- на фронте только раскрашивать поля и выводить тексты по этим кодам.

## UX и удобство валидации

Технически можно сделать любую проверку, но важно, как она будет выглядеть для пользователя.

### Где и как показывать ошибки

Лучшие практики:

- показывать сообщение рядом с полем, а не только сверху формы;
- подсвечивать само поле (красной рамкой, фоном);
- не перегружать пользователя множеством подсказок до того, как он вообще начал ввод.

Плохой UX:

- форма выдает одну ошибку за раз, и после исправления появляется следующая;
- сообщения слишком общие ("Неверные данные");
- ошибки исчезают сразу после клика мышью, даже если ввод не изменился.

Хороший UX:

- все ошибки полей видны одновременно;
- текст ошибки говорит, что именно нужно исправить ("Минимум 8 символов", "Только латиница и цифры");
- нет противоречивых сообщений (одно и то же поле не выдает одновременно две разные ошибки).

### Баланс между "строго" и "помогаю"

Иногда полезно немного "расширить" форматы во имя удобства:

- принимать email с пробелами по краям, но обрезать их на бэкенде;
- не требовать строго формализованного имени пользователя;
- допускать разные форматы телефона, а сохранить его в нормализованном виде.

Главное правило — система должна быть строгой к данным внутри себя, но максимально помогающей пользователю при вводе.

## Стратегии проектирования валидации

Чтобы валидация не расползалась по проекту, полезно сразу продумать стратегию.

### Описание схемы данных

Один из подходов — описать форму в виде схемы, в которой записаны:

- поля;
- их типы;
- обязательность;
- дополнительные правила.

Пример очень простой "схемы" на JavaScript:

```js
// Здесь мы описываем правила валидации в одном объекте
const schema = {
  email: {
    required: true,
    validators: [
      (value) => value.includes('@') || 'Некорректный email'
    ]
  },
  password: {
    required: true,
    validators: [
      (value) => value.length >= 8 || 'Минимум 8 символов'
    ]
  }
};

function validateBySchema(values, schema) {
  const errors = {};

  // Проходим по всем полям схемы
  Object.keys(schema).forEach((field) => {
    const rules = schema[field];
    const value = values[field];

    // Проверка обязательности
    if (rules.required && !value) {
      errors[field] = 'Обязательное поле';
      return;
    }

    // Если значение есть, применяем остальные проверки
    if (value && rules.validators) {
      for (const validator of rules.validators) {
        // Запускаем функцию проверки
        const result = validator(value);
        if (result !== true) {
          // Если вернулась строка, считаем ее текстом ошибки
          errors[field] = result;
          break;
        }
      }
    }
  });

  return errors;
}

// Пример использования
const formValues = {
  email: 'userexample.com', // Нет @
  password: '123' // Меньше 8 символов
};

const formErrors = validateBySchema(formValues, schema);
// formErrors будет содержать тексты ошибок по полям
```

Такую же идею легко перенести в другие языки и фреймворки.

### Многошаговые формы

Для wizard‑форм (по шагам) полезно:

- валидировать только текущий шаг при переходе к следующему;
- перед финальной отправкой проверить весь набор данных;
- сохранять промежуточные результаты (чтобы пользователь не потерял введенное при возврате назад).

## Заключение

Валидация форм — это не только набор проверок, но и часть архитектуры системы и пользовательского интерфейса. Вы можете опираться на несколько уровней:

- HTML5‑атрибуты для базовой проверки и простого UX;
- JavaScript для кастомных правил, кросс‑полевая и асинхронная валидация;
- серверная валидация для гарантии безопасности и целостности данных.

Хорошо спроектированная валидация:

- централизована (правила не размазаны по коду);
- понятна пользователю (ошибки объясняют, что делать);
- дублируется на сервере;
- учитывает как синтаксические, так и бизнес‑ограничения.

Если отнестись к form‑validation как к полноценной подсистеме, а не к "дополнительным проверкам", поддерживать и развивать ее будет значительно проще.

## Частозадаваемые технические вопросы

### 1. Как отключить стандартные HTML5 сообщения и полностью контролировать вывод ошибок?

Вы можете добавить атрибут `novalidate` к форме и использовать только свою логику на JavaScript.

```html
<form id="my-form" novalidate>
  <!-- поля -->
</form>
```

Дальше в JS:

- перехватывайте событие `submit`;
- для каждого поля вызывайте `input.checkValidity()` или собственные функции;
- при необходимости используйте `event.preventDefault()` чтобы остановить отправку;
- все сообщения показывайте сами, в нужных местах интерфейса.

### 2. Как валидировать динамически добавляемые поля (например, строки в таблице)?

Основной подход:

1. Вешайте обработчики событий не на конкретные `input`, а на контейнер (event delegation).
2. В обработчике проверяйте `event.target` и запускайте соответствующую проверку.
3. При добавлении нового поля вам не придется заново навешивать обработчики — контейнер уже слушает события.

Пример:

```js
container.addEventListener('input', (event) => {
  if (event.target.matches('.row-input')) {
    validateRowInput(event.target);
  }
});
```

### 3. Как синхронизировать ошибки между сервером и клиентом (например, при SPA)?

Рекомендуется:

1. На сервере формировать объект ошибок по полям, например:
   `{ errors: { email: 'Уже занят', password: 'Слишком короткий' } }`.
2. На клиенте иметь маппинг `fieldName -> element`, чтобы по этому объекту:
   - подсветить нужные поля;
   - вывести текст рядом с каждым полем.
3. Общие "ошибки формы" (например, "Неверный логин или пароль") складывать в отдельное поле, например `errors._form`.

### 4. Как валидировать файлы (типы, размер) до отправки?

Используйте свойства `File` и `FileList` в JS:

- `input.files` — список файлов;
- `file.type` — MIME‑тип;
- `file.size` — размер в байтах.

Алгоритм:

1. Перехватить `change` на `input[type="file"]`.
2. Пройтись по `input.files`, проверяя тип и размер.
3. Если что‑то не подходит, показать ошибку и при необходимости очистить поле (`input.value = ''`).

При этом на сервере обязательно повторить проверки, не полагаясь на клиент.

### 5. Как сделать разные правила валидации для одного и того же поля в зависимости от режима (создание/редактирование)?

Подход:

1. Хранить флаг режима (например, `mode = 'create' | 'edit'`).
2. В схеме валидации описывать условия:
   - `required` может быть функцией, которая смотрит на `mode`;
   - в массив `validators` можно добавлять/не добавлять правила в зависимости от режима.
3. При вызове функции валидации передавать контекст (`values`, `mode`), и внутри правил использовать этот контекст для принятия решений.