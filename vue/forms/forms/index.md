---
metaTitle: Работа с формами в веб разработке - полное практическое руководство
metaDescription: Разбираем как работать с формами в веб разработке - от базовой разметки до валидации обработчиков на сервере и защиты от ошибок
author: Олег Марков
title: Работа с формами - forms в веб приложениях
preview: Подробно рассматриваем работу с HTML формами - структуру элементы отправку данных валидацию и обработку на сервере с примерами кода
---

## Введение

Формы (forms) в веб-разработке — это основной способ взаимодействия пользователя с приложением. Через форму вы получаете логин и пароль, данные для заказа, поиск по сайту, загрузку файлов и многое другое. Если форма сделана неаккуратно, пользователю сложно ввести данные, а вам — их корректно обработать.

Здесь вы увидите, как устроены формы на уровне HTML, как они отправляют данные, как правильно настраивать элементы ввода, как организовать валидацию и что важно учесть на стороне сервера. Я буду опираться на классический стек HTML плюс немного JavaScript, чтобы показать вам полный жизненный цикл формы.

---

## Что такое HTML форма и как она работает

### Базовая структура формы

Форма в HTML — это контейнер, который группирует поля ввода и описывает, куда и как отправлять данные. Базовый пример:

```html
<form action="/submit" method="POST">
  <!-- Поле для ввода имени -->
  <label for="name">Имя</label>
  <input id="name" name="name" type="text">

  <!-- Кнопка отправки формы -->
  <button type="submit">Отправить</button>
</form>
```

Комментарии к примеру:

// form — контейнер формы  
// action — URL, на который будут отправлены данные  
// method — HTTP-метод отправки (GET или POST)  
// label с атрибутом for связывается с input по id  
// name у input — ключ, по которому значение придет на сервер  
// button type="submit" — инициирует отправку формы  

Если кратко, жизненный цикл формы таков:

1. Пользователь вводит данные в поля.
2. Нажимает кнопку отправки (или Enter в поле).
3. Браузер сериализует значения в формат `key=value&key2=value2`.
4. Отправляет данные на указанный в action URL, используя method.
5. Сервер принимает данные и возвращает ответ (страницу, JSON и т.д.).

### Атрибуты формы: action, method, enctype и другие

#### Атрибут action

`action` — адрес, по которому данные формы будут отправлены.

```html
<form action="/api/register" method="POST">
  <!-- поля регистрации -->
</form>
```

Если не указать action, форма отправится на тот же URL, на котором вы находитесь. Иногда это удобно, но лучше явно задавать маршрут, чтобы код был предсказуем.

#### Атрибут method

Поддерживаются в основном два метода: GET и POST.

```html
<form action="/search" method="GET">
  <input name="q" type="search">
  <button type="submit">Искать</button>
</form>
```

// Данные запроса окажутся в адресной строке  
// Пример итогового URL — /search?q=поиск  

Когда использовать GET:

- Поисковые запросы, фильтры.
- Действия без изменения данных на сервере.
- Когда важно, чтобы ссылкой можно было поделиться.

Когда использовать POST:

- Авторизация и регистрация.
- Отправка личных данных.
- Изменение данных на сервере (создание, обновление, удаление).

```html
<form action="/login" method="POST">
  <input name="email" type="email">
  <input name="password" type="password">
  <button type="submit">Войти</button>
</form>
```

#### Атрибут enctype

`enctype` задает формат, в котором браузер кодирует данные.

Основные варианты:

- `application/x-www-form-urlencoded` — значение по умолчанию.  
- `multipart/form-data` — нужен для загрузки файлов.  
- `text/plain` — почти не используется.

Пример с загрузкой файла:

```html
<form action="/upload" method="POST" enctype="multipart/form-data">
  <!-- Поле выбора файла -->
  <input type="file" name="avatar">
  <button type="submit">Загрузить</button>
</form>
```

// enctype multipart/form-data необходим  
// Без него файл не будет корректно отправлен на сервер  

#### Другие полезные атрибуты формы

```html
<form
  action="/subscribe"
  method="POST"
  autocomplete="on"
  novalidate
  target="_self"
>
  <!-- поля подписки -->
</form>
```

Комментарии:

// autocomplete — подсказывает браузеру можно ли подставлять ранее введенные значения  
// novalidate — отключает встроенную HTML-валидацию браузера  
// target — куда загружать результат (например _blank для новой вкладки)  

---

## Основные элементы формы и их особенности

Теперь давайте подробно посмотрим на элементы, с которыми вы будете работать чаще всего.

### Текстовые поля: input type="text" и его варианты

#### Обычное текстовое поле

```html
<label for="username">Имя пользователя</label>
<input
  id="username"
  name="username"
  type="text"
  placeholder="Введите имя"
  required
  minlength="3"
  maxlength="20"
/>
```

Комментарии:

// placeholder — подсказка внутри поля  
// required — значение обязательно для заполнения  
// minlength и maxlength — ограничения по длине строки  

Браузер сам проверит требуемые поля и длину, если вы не отключили валидацию через novalidate.

#### Email и URL

Специализированные типы дают базовую валидацию и оптимизируют клавиатуру на мобильных устройствах.

```html
<input name="email" type="email" required>
<input name="website" type="url" placeholder="https://example.com">
```

// type="email" проверяет формат email  
// type="url" проверяет наличие валидного URL  

#### Числовые поля

```html
<label for="age">Возраст</label>
<input
  id="age"
  name="age"
  type="number"
  min="1"
  max="120"
  step="1"
/>
```

// min и max — допустимый диапазон  
// step — шаг изменения при нажатии стрелок  

Обратите внимание, что на стороне сервера все равно нужно перепроверить диапазон, даже если браузер уже проверил.

### Пароль и скрытые поля

#### Пароль

```html
<label for="password">Пароль</label>
<input
  id="password"
  name="password"
  type="password"
  minlength="8"
  required
>
```

// type="password" визуально скрывает вводимые символы  
// Но значение все равно отправляется на сервер как обычный текст  

Для защиты пароля нужно:

- Использовать HTTPS.
- Хранить хэш, а не сам пароль.
- Добавлять серверную валидацию сложности.

#### Скрытые поля

```html
<input type="hidden" name="csrf_token" value="random-token-123">
```

// Поле не видно пользователю  
// Но его значение отправляется вместе с формой  
// Обычно используется для скрытых параметров и CSRF-токенов  

Не стоит помещать в скрытые поля чувствительные данные в чистом виде — их можно увидеть в HTML.

### Флажки и переключатели: checkbox и radio

#### Флажок (checkbox)

```html
<label>
  <input type="checkbox" name="agree_terms" value="yes" required>
  Я принимаю условия
</label>
```

Комментарии:

// checkbox можно включать и выключать  
// Если флажок снят — значение на сервер не отправляется  
// Если установлен — придет пара agree_terms=yes  

Если у checkbox не указать value, по умолчанию будет "on".

#### Набор флажков

```html
<label>
  <input type="checkbox" name="interests" value="music">
  Музыка
</label>
<label>
  <input type="checkbox" name="interests" value="sport">
  Спорт
</label>
<label>
  <input type="checkbox" name="interests" value="books">
  Книги
</label>
```

// Все чекбоксы имеют одно имя interests  
// Если выбраны музыка и книги  
// На сервер придут значения interests=music и interests=books  

На стороне сервера их нужно обрабатывать как список.

#### Переключатели (radio)

Переключатели позволяют выбрать один вариант из группы.

```html
<p>Способ доставки</p>

<label>
  <input type="radio" name="delivery" value="courier" checked>
  Курьер
</label>
<label>
  <input type="radio" name="delivery" value="pickup">
  Самовывоз
</label>
<label>
  <input type="radio" name="delivery" value="post">
  Почта
</label>
```

Комментарии:

// Радиокнопки объединяются по имени name  
// В группе может быть выбран только один вариант  
// Атрибут checked задает значение по умолчанию  

### Выпадающие списки: select и option

```html
<label for="country">Страна</label>
<select id="country" name="country" required>
  <option value="">Выберите страну</option>
  <option value="ru">Россия</option>
  <option value="by">Беларусь</option>
  <option value="kz">Казахстан</option>
</select>
```

// select — сам список  
// option — отдельный вариант  
// value — значение, которое уйдет на сервер  
// Если value не указано — отправляется текст между тегами option  

Множественный выбор:

```html
<label for="colors">Любимые цвета</label>
<select id="colors" name="colors" multiple size="3">
  <option value="red">Красный</option>
  <option value="green">Зеленый</option>
  <option value="blue">Синий</option>
</select>
```

// multiple — позволяет выбрать несколько вариантов  
// size — количество видимых строк списка  
// На сервер придет несколько значений colors  

### Многострочное поле: textarea

```html
<label for="message">Сообщение</label>
<textarea
  id="message"
  name="message"
  rows="4"
  cols="40"
  placeholder="Опишите вашу ситуацию"
/></textarea>
```

// textarea используется для длинного текста  
// rows и cols задают минимальный видимый размер  
// Внутренний текст между тегами — значение по умолчанию  

---

## Управление поведением формы кнопками

### Типы кнопок

Кнопка в форме может иметь разные типы:

```html
<form action="/feedback" method="POST">
  <!-- Поля формы -->

  <button type="submit">Отправить</button>
  <button type="reset">Сбросить</button>
  <button type="button" id="help-btn">Помощь</button>
</form>
```

Комментарии:

// submit — отправляет форму  
// reset — сбрасывает значения к исходным  
// button — просто кнопка для своих обработчиков (обычно через JS)  

Если не указать type у button, по умолчанию в форме это будет submit. Это часто приводит к неожиданной отправке формы, поэтому явное указание типа — хорошая практика.

### Несколько кнопок отправки в одной форме

Иногда нужно иметь несколько сценариев отправки: например, "Сохранить черновик" и "Отправить". Смотрите, как это сделать.

```html
<form action="/post" method="POST">
  <input type="text" name="title" placeholder="Заголовок">

  <button type="submit" name="action" value="draft">
    Сохранить черновик
  </button>

  <button type="submit" name="action" value="publish">
    Опубликовать
  </button>
</form>
```

// Обе кнопки отправляют форму на один и тот же URL  
// Но на сервер придет разное значение action  
// По нему можно отличить сценарии обработки  

На сервере вы проверяете параметр action и выбираете соответствующую логику.

---

## Валидация форм на стороне клиента

### Базовая HTML-валидация

HTML уже содержит простую встроенную валидацию. Она работает без JavaScript и помогает отловить очевидные ошибки еще в браузере пользователя.

Основные атрибуты:

- required — поле обязательно.
- minlength и maxlength — длина строки.
- min и max — числовые пределы.
- pattern — регулярное выражение.
- type — базовая проверка формата (email, url, number и т.д.).

Пример комбинированной валидации:

```html
<form action="/register" method="POST">
  <label for="email">Email</label>
  <input
    id="email"
    name="email"
    type="email"
    required
  >

  <label for="password">Пароль</label>
  <input
    id="password"
    name="password"
    type="password"
    required
    minlength="8"
  >

  <label for="phone">Телефон</label>
  <input
    id="phone"
    name="phone"
    type="tel"
    pattern="^\+?[0-9]{10,15}$"
    placeholder="+79991234567"
  />

  <button type="submit">Зарегистрироваться</button>
</form>
```

// pattern задает регулярное выражение для телефона  
// Если данные не проходят проверку — браузер не отправляет форму  
// Пользователь увидит встроенное сообщение об ошибке  

### Кастомные сообщения об ошибках

Бывало, вы видели непонятные сообщения от браузера. Их можно переопределить с помощью JavaScript.

```html
<form id="login-form" action="/login" method="POST" novalidate>
  <input id="email" name="email" type="email" required>
  <button type="submit">Войти</button>
</form>

<script>
// Находим поле email
const emailInput = document.getElementById('email');

emailInput.addEventListener('invalid', function () {
  // Устанавливаем свое сообщение об ошибке
  if (emailInput.validity.valueMissing) {
    emailInput.setCustomValidity('Введите email');
  } else if (emailInput.validity.typeMismatch) {
    emailInput.setCustomValidity('Укажите корректный email');
  } else {
    emailInput.setCustomValidity('');
  }
});

emailInput.addEventListener('input', function () {
  // Сбрасываем сообщение при вводе
  emailInput.setCustomValidity('');
});
</script>
```

Комментарии:

// novalidate отключает стандартные сообщения браузера  
// Событие invalid срабатывает при неуспешной проверке поля  
// validity содержит информацию о типе ошибки  
// setCustomValidity задает текст ошибки или очищает его  

### Валидация с помощью JavaScript перед отправкой

Иногда встроенной валидации мало. Тогда вы можете полностью контролировать отправку.

```html
<form id="reg-form" action="/register" method="POST" novalidate>
  <input id="pass" name="password" type="password" required>
  <input id="pass2" name="password_confirm" type="password" required>
  <button type="submit">Зарегистрироваться</button>
</form>

<script>
const form = document.getElementById('reg-form');
const pass = document.getElementById('pass');
const pass2 = document.getElementById('pass2');

form.addEventListener('submit', function (event) {
  // Сбрасываем пользовательские ошибки
  pass.setCustomValidity('');
  pass2.setCustomValidity('');

  // Проверяем совпадение паролей
  if (pass.value !== pass2.value) {
    // Устанавливаем ошибку и предотвращаем отправку
    pass2.setCustomValidity('Пароли не совпадают');
    event.preventDefault();
  }
});
</script>
```

// Событие submit позволяет вам проверить данные перед отправкой  
// event.preventDefault() останавливает отправку формы  
// Вы можете добавить подсветку ошибок и сообщения пользователю  

Важно помнить: все проверки на клиенте нужно дублировать на сервере. Пользователь может отключить JavaScript или изменить данные вручную.

---

## Работа с формой через JavaScript

### Отправка формы без перезагрузки страницы (AJAX)

Формы часто отправляют через JavaScript, чтобы не перезагружать страницу и обрабатывать ответы в динамике.

Давайте разберемся на примере:

```html
<form id="contact-form">
  <input name="name" placeholder="Имя" required>
  <input name="email" type="email" placeholder="Email" required>
  <textarea name="message" placeholder="Сообщение" required></textarea>
  <button type="submit">Отправить</button>
</form>

<div id="status"></div>

<script>
const form = document.getElementById('contact-form');
const statusDiv = document.getElementById('status');

form.addEventListener('submit', async function (event) {
  // Не даем форме отправиться стандартным способом
  event.preventDefault();

  // Собираем данные формы
  const formData = new FormData(form);

  try {
    // Отправляем запрос через fetch
    const response = await fetch('/api/contact', {
      method: 'POST',
      body: formData, // FormData сам выставит нужный enctype
    });

    if (!response.ok) {
      throw new Error('Ошибка сети');
    }

    // Предполагаем что сервер возвращает JSON
    const result = await response.json();

    // Показываем сообщение пользователю
    statusDiv.textContent = result.message || 'Сообщение отправлено';
  } catch (error) {
    // Обрабатываем ошибку
    statusDiv.textContent = 'Не удалось отправить форму';
  }
});
</script>
```

Комментарии:

// event.preventDefault — отменяет обычную отправку формы  
// FormData автоматически собирает все поля формы  
// fetch отправляет запрос к серверу без перезагрузки страницы  
// Вы можете показывать прогресс, ошибки, очищать форму и т.д.  

С помощью такого подхода вы можете строить более "живые" формы: подсвечивать ошибки по мере ввода, сохранять черновики и многое другое.

### Сериализация формы в JSON

Некоторые API принимают JSON, а не FormData. Тогда вам нужно преобразовать форму в объект.

```html
<form id="profile-form">
  <input name="firstName" placeholder="Имя">
  <input name="lastName" placeholder="Фамилия">
  <input name="age" type="number">
  <button type="submit">Сохранить</button>
</form>

<script>
const form = document.getElementById('profile-form');

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  // Создаем объект FormData для удобного доступа
  const formData = new FormData(form);

  // Преобразуем в обычный объект
  const data = {};
  formData.forEach((value, key) => {
    // Здесь можно конвертировать типы например age в число
    if (key === 'age') {
      data[key] = Number(value);
    } else {
      data[key] = value;
    }
  });

  // Отправляем JSON
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  // Далее обрабатываем ответ как нужно
});
</script>
```

// Такой подход удобен при разработке SPA или взаимодействии с REST API  
// Важно синхронизировать имена полей формы и формат JSON на сервере  

---

## Обработка форм на сервере — общие принципы

Серверный код зависит от языка и фреймворка, но общая схема везде похожа. Здесь я покажу базовые идеи на условном примере с псевдокодом.

### Как приходят данные формы

При отправке GET-запроса:

- Данные попадают в строку запроса после символа `?`.
- Сервер читает параметры из query-параметров.

При POST:

- Если enctype по умолчанию — данные в теле запроса как `application/x-www-form-urlencoded`.
- Если multipart/form-data — тело запроса разбито на части, включая файлы.

На стороне сервера обычно есть три шага:

1. Прочитать данные формы.
2. Провалидировать их.
3. Выполнить действие (сохранить в базу, отправить письмо и т.д.) и вернуть ответ.

### Минимальный разбор данных (на абстрактном примере)

Покажу вам псевдокод, не привязанный к конкретному языку:

```pseudo
// Обработчик POST /login
function handleLogin(request, response) {
  // 1. Получаем данные формы
  email = request.form["email"]
  password = request.form["password"]

  // 2. Проверяем что данные есть
  if email is empty or password is empty {
    response.status = 400
    response.body = "Email и пароль обязательны"
    return
  }

  // 3. Ищем пользователя и сверяем пароль
  user = findUserByEmail(email)
  if user is null or not checkPassword(password, user.passwordHash) {
    response.status = 401
    response.body = "Неверный email или пароль"
    return
  }

  // 4. Успешный вход
  createSessionForUser(user)
  response.status = 200
  response.body = "OK"
}
```

Комментарии:

// request.form — абстрактный объект с данными формы  
// Всегда делайте проверку наличия и формата данных  
// Никогда не доверяйте тому что пришло из браузера  

---

## Удобство и доступность форм

Хорошая форма — это не только правильные атрибуты, но и удобство для пользователей, включая тех, кто пользуется клавиатурой или скринридерами.

### Связка label и input

Правильная связка label и input:

```html
<label for="email">Email</label>
<input id="email" name="email" type="email">
```

Или вариант с вложенностью:

```html
<label>
  Email
  <input name="email" type="email">
</label>
```

Комментарии:

// Связка label и input помогает скринридерам  
// Клик по label фокусирует соответствующее поле  
// Это делает форму удобнее для всех пользователей  

### Группировка полей: fieldset и legend

```html
<fieldset>
  <legend>Контактные данные</legend>

  <label for="name">Имя</label>
  <input id="name" name="name" type="text">

  <label for="phone">Телефон</label>
  <input id="phone" name="phone" type="tel">
</fieldset>
```

// fieldset группирует логически связанные поля  
// legend описывает группу  
// Это помогает и визуально и с точки зрения доступности  

### Подсказки и сообщения об ошибках

Смотрите, как можно аккуратно показать подсказки и ошибки:

```html
<form id="email-form" novalidate>
  <div>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" aria-describedby="email-help email-error">
    <div id="email-help">Мы отправим ответ на этот адрес</div>
    <div id="email-error" style="color: red; display: none;"></div>
  </div>
  <button type="submit">Отправить</button>
</form>

<script>
const form = document.getElementById('email-form');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');

form.addEventListener('submit', function (event) {
  event.preventDefault();
  emailError.style.display = 'none';
  emailError.textContent = '';

  if (!emailInput.value) {
    emailError.textContent = 'Введите email';
    emailError.style.display = 'block';
    return;
  }

  if (!emailInput.checkValidity()) {
    emailError.textContent = 'Некорректный email';
    emailError.style.display = 'block';
    return;
  }

  // Здесь можно отправить форму через fetch
});
</script>
```

Комментарии:

// aria-describedby связывает поле с подсказками и ошибками  
// Вы отдельно показываете текст ошибки при необходимости  
// Такой подход понятен и пользователю и вспомогательным технологиям  

---

## Типичные ошибки при работе с формами и как их избежать

### Отсутствие name у полей

Очень частая проблема: разработчик указывает id, но забывает name. В итоге поле красиво отображается, но его значение не попадает в отправленные данные.

```html
<!-- Ошибочный вариант -->
<input id="email" type="email">

<!-- Правильный вариант -->
<input id="email" name="email" type="email">
```

// name — это ключ в паре "ключ-значение" при отправке формы  
// id нужен для связки с label и JavaScript но не для сервера  

### Неверный выбор метода (GET вместо POST)

Например, форма логина по умолчанию отправляется GET, и пароль оказывается в URL. Такое легко увидеть в логах, истории браузера и т.д.

```html
<!-- Плохой вариант -->
<form action="/login">
  <!-- method по умолчанию GET -->
  <input name="password" type="password">
</form>

<!-- Лучше так -->
<form action="/login" method="POST">
  <input name="password" type="password">
</form>
```

// Всегда явно указывайте method  
// Для действий связанных с авторизацией и изменением данных используйте POST  

### Полная надежда только на клиентскую валидацию

Клиентская валидация полезна, но недостаточна:

- Ее можно отключить.
- Данными можно манипулировать через консоль разработчика.
- Злоумышленник может послать запрос напрямую минуя браузер.

Поэтому правила на сервере должны быть полными и не зависеть от того, что вы проверили в браузере.

---

## Небольшой итог по практической схеме работы с формой

Чтобы закрепить, давайте соберем типичный сценарий:

1. На клиенте вы:
   - Создаете `<form>` с корректными action, method и нужным enctype.
   - Добавляете элементы с name, label, placeholder и атрибутами валидации.
   - При необходимости подключаете JavaScript для кастомной валидации и AJAX.

2. В браузере при отправке:
   - Базовая валидация полей (required, type, pattern).
   - Собираются значения только тех полей, у которых есть name.
   - Данные кодируются в соответствии с enctype и отправляются методом method.

3. На сервере вы:
   - Извлекаете данные формы из тела запроса или query.
   - Применяете строгую валидацию (формат, длина, диапазоны, права доступа).
   - Выполняете бизнес-логику (создание записи, авторизация, отправка почты).
   - Возвращаете понятный ответ (HTML, JSON, редирект).

4. Опционально:
   - Через JS обрабатываете ответ (показываете сообщение, обновляете интерфейс).
   - Готовите пользователя к повторному вводу в случае ошибок.

---

Формы остаются фундаментальным инструментом во всех веб-приложениях. Понимание того, как устроены атрибуты, как происходит отправка и валидация, позволяет вам строить надежные и удобные интерфейсы, а также избежать ошибок, которые часто встречаются в боевых проектах.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как отправить форму с помощью JavaScript без нажатия на кнопку

Можно вызвать метод submit у самой формы:

```html
<form id="auto-form" action="/save" method="POST">
  <input name="data">
</form>

<script>
const form = document.getElementById('auto-form');

// Например вызываем отправку через 3 секунды
setTimeout(() => {
  // Важно сначала при необходимости выполнить валидацию
  if (form.checkValidity()) {
    form.submit(); // Отправка без события submit
  }
}, 3000);
</script>
```

// form.submit отправляет форму сразу  
// Обработчик события submit при таком вызове не срабатывает  

---

### Как запретить отправку формы при нажатии Enter в текстовом поле

```html
<form id="search-form">
  <input id="search-input" name="q">
  <button type="submit">Искать</button>
</form>

<script>
const input = document.getElementById('search-input');

input.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Блокируем стандартное действие
  }
});
</script>
```

// Можно отключать поведение только для конкретных полей  

---

### Как отправить часть полей формы на один URL а часть на другой

Используйте атрибуты formaction и formmethod у кнопок:

```html
<form action="/default" method="POST">
  <input name="name">

  <button type="submit" formaction="/save-draft">
    Сохранить черновик
  </button>

  <button type="submit" formaction="/publish" formmethod="POST">
    Опубликовать
  </button>
</form>
```

// form задает значения по умолчанию  
// Конкретная кнопка может переопределить action и method  

---

### Как отключить поле чтобы оно не отправлялось в форме

```html
<input name="debug" value="test" disabled>
```

// disabled — поле нельзя редактировать и оно не отправится  
// Если нужно только запретить редактирование но отправить значение используйте readonly  

```html
<input name="email" value="user@example.com" readonly>
```

---

### Как отправить файл и дополнительные данные одновременно через fetch

```html
const formData = new FormData();
formData.append('avatar', fileInput.files[0]); // Файл
formData.append('username', 'test-user');      // Дополнительные данные

fetch('/upload', {
  method: 'POST',
  body: formData,
});
```

// FormData позволяет смешивать файлы и простые поля  
// Не задавайте вручную заголовок Content-Type — браузер сделает это сам