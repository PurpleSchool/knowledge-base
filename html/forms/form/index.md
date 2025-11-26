---
metaTitle: Тег формы form в HTML
metaDescription: Подробное руководство по тегу формы form в HTML - структура формы отправка данных методы атрибуты примеры и лучшие практики
author: Олег Марков
title: Тег формы form в HTML
preview: Разберитесь как работает тег формы form в HTML - как создавать формы выбирать метод отправки настраивать обработку данных и избегать типичных ошибок
---

## Введение

Тег формы `form` в HTML — основа любого взаимодействия пользователя с сайтом. Через формы вы получаете данные: регистрации, авторизации, поиска, заказов, загрузок файлов и многого другого. Без `form` браузер не знает, куда и как отправлять введенную пользователем информацию.

Смотрите, я покажу вам, как устроен тег `form`, какие атрибуты он поддерживает, как правильно выбирать метод отправки, что происходит при сабмите и как связать форму с сервером или JavaScript. По ходу статьи мы будем опираться на практические примеры с пояснениями в комментариях.

## Что такое тег form и зачем он нужен

Тег `form` определяет область документа HTML, в которой находятся интерактивные элементы для ввода данных: поля ввода, переключатели, чекбоксы, списки, кнопки и т.д. Именно `form` задает:

- куда отправлять данные (атрибут `action`);
- каким способом отправлять (атрибут `method`);
- как кодировать данные (атрибут `enctype`);
- когда и как инициировать отправку (кнопки `submit`, JS-обработчики).

Простейший пример:

```html
<form action="/login" method="post">
  <!-- Поле ввода логина -->
  <input type="text" name="username" />

  <!-- Поле ввода пароля -->
  <input type="password" name="password" />

  <!-- Кнопка отправки формы -->
  <button type="submit">Войти</button>
</form>
```

В этом примере:

- пользователь вводит логин и пароль;
- при нажатии на кнопку браузер формирует запрос `POST` на `/login`;
- в теле запроса отправляются пары `username=value` и `password=value`.

Без тега `form` элементы ввода сами по себе ничего никуда не отправляют.

## Базовый синтаксис и структура формы

### Минимальная форма

Покажу вам минимально рабочий пример формы:

```html
<form>
  <!-- Одно текстовое поле -->
  <input type="text" name="query" />
  <!-- Кнопка отправки -->
  <button type="submit">Искать</button>
</form>
```

Если вы не указали `action` и `method`, браузер применит значения по умолчанию:

- `action` — текущий URL страницы;
- `method` — `GET`.

То есть запрос будет отправлен на тот же адрес, где открыта страница, с добавлением параметров в строку запроса (например, `?query=что-то`).

### Основные составляющие формы

Внутри `form` обычно находятся:

- поля ввода: `input`, `textarea`, `select`;
- кнопки: `button` или `input type="submit"` / `reset`;
- вспомогательные элементы: `label`, `fieldset`, `legend`, текст, подсказки.

Давайте разберемся на примере формы регистрации:

```html
<form action="/register" method="post">
  <!-- Объединяем связанные поля в группу -->
  <fieldset>
    <!-- Заголовок группы -->
    <legend>Регистрация</legend>

    <!-- Подпись для поля имени -->
    <label>
      Имя
      <!-- Поле имени пользователя -->
      <input type="text" name="name" required />
    </label>

    <!-- Подпись для поля email -->
    <label>
      Email
      <!-- Поле email с базовой валидацией -->
      <input type="email" name="email" required />
    </label>

    <!-- Подпись для пароля -->
    <label>
      Пароль
      <!-- Поле пароля -->
      <input type="password" name="password" required minlength="6" />
    </label>

    <!-- Кнопка отправки формы -->
    <button type="submit">Зарегистрироваться</button>
  </fieldset>
</form>
```

Здесь вы видите, как `form` задает общий контекст, а вложенные элементы описывают структуру данных, которые вы хотите получить.

## Ключевые атрибуты формы

### Атрибут action — куда отправлять данные

`action` определяет URL, на который браузер отправит данные формы при сабмите.

```html
<form action="/api/auth/login" method="post">
  <!-- Поля логина и пароля -->
</form>
```

Особенности:

- может быть относительным (`/login`), абсолютным (`https://example.com/login`) или пустым (`action=""`);
- если атрибут не задан, используется текущий URL страницы;
- для SPA-приложений иногда `action` не используют, а перехватывают отправку формы через JavaScript.

Пример с текущим URL по умолчанию:

```html
<form method="get">
  <!-- Без action данные уйдут на тот же URL страницы -->
  <input type="search" name="q" />
  <button type="submit">Поиск</button>
</form>
```

### Атрибут method — как отправлять данные

`method` определяет HTTP-метод:

- `get` (по умолчанию) — данные добавляются в URL в виде query-параметров;
- `post` — данные отправляются в теле HTTP-запроса.

```html
<!-- Отправка через GET -->
<form action="/search" method="get">
  <input type="text" name="q" />
  <button type="submit">Искать</button>
</form>

<!-- Отправка через POST -->
<form action="/feedback" method="post">
  <textarea name="message"></textarea>
  <button type="submit">Отправить</button>
</form>
```

Рекомендации:

- `GET` — для безопасных запросов, не изменяющих данные (поиск, фильтрация);
- `POST` — для операций, которые что-то создают / изменяют (регистрация, заказ, комментарий);
- чувствительность к регистру не важна, но принято писать строчными: `get`, `post`.

### Атрибут enctype — как кодировать данные

`enctype` задает тип кодирования тела запроса. Он важен в основном для метода `POST`.

Основные значения:

- `application/x-www-form-urlencoded` (по умолчанию) — данные кодируются как пары `key=value`, символы экранируются;
- `multipart/form-data` — используется при загрузке файлов;
- `text/plain` — почти не используют в реальных проектах.

Пример с загрузкой файла:

```html
<form action="/upload" method="post" enctype="multipart/form-data">
  <!-- Поле выбора файла -->
  <input type="file" name="avatar" />
  <!-- Кнопка отправки -->
  <button type="submit">Загрузить</button>
</form>
```

Обратите внимание: без `multipart/form-data` файл корректно не отправится.

### Атрибут name у формы

`name` задает имя формы. Сейчас его используют редко, но иногда он нужен для JavaScript (особенно в старом коде) или в тестах.

```html
<form name="loginForm" action="/login" method="post">
  <!-- Поля формы -->
</form>

<script>
// Доступ к форме по имени через document.forms
const form = document.forms.loginForm; // получаем ссылку на форму
</script>
```

В современных проектах чаще используют `id` и селекторы.

### Атрибут id — связь с JavaScript и CSS

`id` уникально идентифицирует форму в документе, его удобно использовать:

- для стилизации конкретной формы;
- для поиска в JS;
- для якорных ссылок.

```html
<form id="contact-form" action="/contact" method="post">
  <!-- Поля формы -->
</form>

<script>
// Получаем форму по id
const form = document.getElementById('contact-form');

// Подписываемся на событие отправки
form.addEventListener('submit', function (event) {
  // Отменяем стандартную отправку на сервер
  event.preventDefault();

  // Здесь вы можете обработать данные через JS или отправить их через fetch
});
</script>
```

### Атрибут target — где открыть результат

`target` определяет, где открыть ответ сервера после отправки формы:

- `_self` — в текущем окне (значение по умолчанию);
- `_blank` — в новой вкладке;
- `_parent`, `_top` — для фреймов;
- имя окна/фрейма — если вы используете `iframe`.

Пример с отправкой в новое окно:

```html
<form action="/report" method="get" target="_blank">
  <input type="date" name="from" />
  <input type="date" name="to" />
  <button type="submit">Сформировать отчет</button>
</form>
```

### Атрибут autocomplete — автозаполнение

`autocomplete` управляет тем, может ли браузер подставлять сохраненные значения (логины, адреса, телефоны и т.д.):

- `on` — разрешить автозаполнение;
- `off` — запретить автозаполнение.

```html
<form action="/login" method="post" autocomplete="on">
  <input type="email" name="email" autocomplete="email" />
  <input type="password" name="password" autocomplete="current-password" />
  <button type="submit">Войти</button>
</form>
```

Обратите внимание: вы можете управлять автозаполнением и на уровне отдельных полей.

### Атрибут novalidate — отключение встроенной валидации

По умолчанию браузер проверяет поля с атрибутами `required`, `type="email"`, `pattern` и т.п. перед отправкой формы. `novalidate` отключает эту проверку.

```html
<form action="/signup" method="post" novalidate>
  <!-- required не будет проверяться браузером -->
  <input type="email" name="email" required />
  <button type="submit">Отправить</button>
</form>
```

Используют, когда:

- валидацию полностью берут на себя скрипты;
- нужна особая логика, отличная от стандартной.

### Атрибут accept-charset — кодировка данных

`accept-charset` определяет, в какой кодировке будут отправлены данные формы. В современных проектах почти всегда используется `UTF-8`.

```html
<form action="/submit" method="post" accept-charset="UTF-8">
  <!-- Поля формы -->
</form>
```

Обычно этот атрибут не задают явно, так как кодировка страницы уже определяет поведение.

## Взаимодействие формы с полями ввода

### Как формируются пары имя-значение

При отправке формы браузер проходит по элементам, связанным с формой, и собирает пары:

- ключ — значение атрибута `name`;
- значение — текущее значение элемента.

Пример:

```html
<form action="/order" method="post">
  <!-- Поле имени с name="customer" -->
  <input type="text" name="customer" value="Иван" />

  <!-- Селект с name="size" -->
  <select name="size">
    <option value="s">S</option>
    <option value="m" selected>М</option>
  </select>

  <!-- Галочка согласия с name="agreement" -->
  <input type="checkbox" name="agreement" checked />

  <button type="submit">Заказать</button>
</form>
```

При отправке, в зависимости от метода, данные будут примерно такими:

- `GET`: `?customer=Иван&size=m&agreement=on`
- `POST` (`application/x-www-form-urlencoded`): в теле запроса `customer=Иван&size=m&agreement=on`

Особенности:

- элементы без `name` в отправку не попадают;
- отключенные элементы (`disabled`) не учитываются;
- для чекбоксов и радиокнопок отправляются только отмеченные элементы.

### Элементы, находящиеся вне формы — атрибут form

Иногда вам нужно визуально разместить элементы в разных местах страницы, но логически отправлять их одной формой. Для этого есть атрибут `form` на самих элементах.

```html
<!-- Форма в одном месте -->
<form id="profile-form" action="/profile" method="post">
  <input type="text" name="name" />
</form>

<!-- Кнопка отправки в другом месте страницы -->
<button type="submit" form="profile-form">
  Сохранить профиль
</button>

<!-- Поле, которое тоже относится к форме, но находится вне ее -->
<input type="email" name="email" form="profile-form" />
```

Здесь:

- кнопка `submit` и поле `email` находятся вне `form`;
- благодаря `form="profile-form"` они логически относятся к форме с `id="profile-form"`.

Браузер при сабмите соберет данные со всех элементов, связанных с формой через этот атрибут.

## Кнопки и отправка формы

### Виды кнопок в форме

Чаще всего используют две разновидности:

- `button type="submit"` — отправить форму;
- `button type="button"` — обычная кнопка, которая сама по себе ничего не отправляет.

Пример:

```html
<form action="/comment" method="post">
  <textarea name="text"></textarea>

  <!-- Это кнопка отправки -->
  <button type="submit">Отправить</button>

  <!-- Это обычная кнопка для какой-то JS-логики -->
  <button type="button" id="preview">
    Предпросмотр
  </button>
</form>
```

Поведение по умолчанию:

- если тип явно не указан, `<button>` в форме считается `type="submit"`;
- `<input type="submit">` тоже отправляет форму.

### Несколько кнопок submit в одной форме

Вы можете сделать несколько кнопок отправки с разным назначением. Например, "Сохранить черновик" и "Опубликовать".

```html
<form action="/article" method="post">
  <input type="text" name="title" />
  <textarea name="content"></textarea>

  <!-- Кнопка "Сохранить черновик" -->
  <button type="submit" name="action" value="draft">
    Сохранить черновик
  </button>

  <!-- Кнопка "Опубликовать" -->
  <button type="submit" name="action" value="publish">
    Опубликовать
  </button>
</form>
```

Когда пользователь нажмет одну из кнопок, браузер добавит в данные формы ее `name` и `value`. На сервере вы по этому полю поймете, какая из кнопок была нажата.

### Отправка формы из JavaScript

Иногда нужно отправить форму программно. Например, после дополнительной проверки.

```html
<form id="login" action="/login" method="post">
  <input type="email" name="email" required />
  <input type="password" name="password" required />
</form>

<script>
// Получаем ссылку на форму
const form = document.getElementById('login');

// Выполняем какие-то проверки и затем отправляем форму
function submitLogin() {
  // Дополнительная логика валидации может быть здесь

  // Отправляем форму программно
  form.submit(); // стандартное поведение формы
}
</script>
```

Важно: вызов `form.submit()` не инициирует событие `submit` на форме, поэтому обработчики, повешенные через `addEventListener('submit', ...)`, не сработают. Если вам нужно, чтобы обработчики сработали, вызывайте `form.requestSubmit()` (поддерживается в современных браузерах) или симулируйте клик по кнопке отправки.

## Валидация данных в форме

### Встроенная HTML-валидация

HTML5 предоставляет базовый набор инструментов, чтобы проверять данные до отправки на сервер:

- `required` — поле обязательно к заполнению;
- `type` — проверка формата (`email`, `url`, `number`);
- `pattern` — проверка по регулярному выражению;
- атрибуты диапазона (`min`, `max`, `minlength`, `maxlength`, `step`).

```html
<form action="/signup" method="post">
  <!-- Обязательное поле email -->
  <input type="email" name="email" required />

  <!-- Пароль минимум 6 символов -->
  <input type="password" name="password" minlength="6" required />

  <!-- Число от 18 до 99 -->
  <input type="number" name="age" min="18" max="99" />

  <button type="submit">Зарегистрироваться</button>
</form>
```

Если какое-то поле не проходит проверку, браузер:

- не отправит форму;
- покажет пользователю подсказку, какое именно поле заполнено некорректно.

### Отключение валидации и ручная проверка

Если вы хотите полностью контролировать валидацию через JS:

1. отключите встроенную проверку через `novalidate` на форме;
2. перехватите событие `submit` и выполните свою логику.

```html
<form id="signup" action="/signup" method="post" novalidate>
  <input type="email" name="email" />
  <input type="password" name="password" />
  <button type="submit">Зарегистрироваться</button>
</form>

<script>
const form = document.getElementById('signup');

form.addEventListener('submit', function (event) {
  // Отменяем стандартное поведение (отправку)
  event.preventDefault();

  // Получаем данные формы
  const formData = new FormData(form);

  // Проводим собственную проверку
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !email.includes('@')) {
    // Здесь вы можете показать сообщение об ошибке
    return;
  }

  if (!password || password.length < 6) {
    // И здесь тоже
    return;
  }

  // Если все хорошо, отправляем данные через fetch или form.submit()
  form.submit(); // отправка после ручной валидации
});
</script>
```

Теперь вы сами решаете, когда и как отправлять данные.

## Формы и JavaScript — управление и отправка данных

### Получение данных формы через FormData

Обратите внимание, как удобно собрать данные с формы в JS, не доставая каждое поле отдельно.

```html
<form id="feedback" action="/feedback" method="post">
  <input type="text" name="name" />
  <textarea name="message"></textarea>
  <button type="submit">Отправить</button>
</form>

<script>
const form = document.getElementById('feedback');

form.addEventListener('submit', function (event) {
  // Не даем форме выполнить обычную отправку
  event.preventDefault();

  // Создаем объект FormData на основе формы
  const data = new FormData(form);

  // Пример получения значения одного поля
  const name = data.get('name');

  // Выводим все пары ключ-значение
  for (const [key, value] of data.entries()) {
    console.log(key, value); // здесь вы видите каждое поле формы
  }

  // Здесь можно отправить данные через fetch
});
</script>
```

Так вы можете легко интегрировать HTML-форму с любым API.

### Отправка формы через fetch

Теперь давайте посмотрим, как отправить данные формы через `fetch` вместо стандартного поведения.

```html
<form id="contact" action="/api/contact" method="post">
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Отправить</button>
</form>

<script>
const form = document.getElementById('contact');

form.addEventListener('submit', async function (event) {
  event.preventDefault(); // отменяем стандартную отправку

  const formData = new FormData(form);

  try {
    // Отправляем данные на сервер
    const response = await fetch(form.action, {
      method: form.method, // используем метод из атрибута формы
      body: formData       // FormData сам установит нужный Content-Type
    });

    if (!response.ok) {
      // Обрабатываем ошибку сервера
      console.error('Ошибка при отправке формы');
      return;
    }

    // Обрабатываем успешный ответ
    const result = await response.json();
    console.log('Успешный ответ сервера', result);
  } catch (error) {
    // Обрабатываем сетевую ошибку
    console.error('Сетевая ошибка', error);
  }
});
</script>
```

Смотрите, этот подход особенно удобен в SPA и когда вы хотите обновлять страницу частично, без полной перезагрузки.

## Лучшая структура и доступность форм

### Использование label и связи с полями

Для хорошей доступности и удобства заполнения формы важно правильно использовать `label`. Есть два основных способа связать подпись с полем:

1. Вложить поле внутрь `label`.

```html
<label>
  Email
  <input type="email" name="email" />
</label>
```

2. Связать по атрибутам `for` и `id`.

```html
<label for="email">Email</label>
<input id="email" type="email" name="email" />
```

Эта связь позволяет:

- клик по тексту подписи фокусирует поле;
- технологии экранного доступа корректно читают подпись вместе с полем.

### Группировка полей через fieldset и legend

Если форма большая, удобно логически разделять ее на блоки.

```html
<form action="/checkout" method="post">
  <fieldset>
    <legend>Личные данные</legend>
    <label>
      Имя
      <input type="text" name="name" required />
    </label>
    <label>
      Телефон
      <input type="tel" name="phone" required />
    </label>
  </fieldset>

  <fieldset>
    <legend>Адрес доставки</legend>
    <label>
      Город
      <input type="text" name="city" required />
    </label>
    <label>
      Улица
      <input type="text" name="street" required />
    </label>
  </fieldset>

  <button type="submit">Оформить заказ</button>
</form>
```

Здесь вспомогательные элементы помогают пользователю быстро ориентироваться.

### Обработка ошибок и подсказки

Хорошая форма не только отправляет данные, но и помогает пользователю исправлять ошибки. Для этого часто используют:

- сообщения об ошибках под полями;
- подсказки с форматами ввода;
- визуальное выделение ошибочных полей.

Пример простой схемы:

```html
<form id="simple-form" action="/submit" method="post" novalidate>
  <label>
    Email
    <input type="email" name="email" id="email" />
  </label>
  <!-- Элемент для вывода сообщения об ошибке -->
  <div id="email-error" class="error-message"></div>

  <button type="submit">Отправить</button>
</form>

<script>
const form = document.getElementById('simple-form');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');

form.addEventListener('submit', function (event) {
  event.preventDefault();

  // Очищаем старую ошибку
  emailError.textContent = '';

  if (!emailInput.value.includes('@')) {
    // Показываем сообщение об ошибке
    emailError.textContent = 'Введите корректный email адрес';
    return;
  }

  // Если ошибок нет, можно отправить форму
  form.submit();
});
</script>
```

Обратите внимание, как этот фрагмент кода решает задачу разъяснения ошибок пользователю.

## Особые случаи и современные практики

### Формы в SPA-приложениях

В современных фронтенд-фреймворках (React, Vue, Angular) формы часто отправляются не "как есть", а через JavaScript и API. Но тег `form` все равно полезен:

- он предоставляет семантику (экранные дикторы понимают, что это форма);
- он позволяет отправить данные по Enter;
- его можно использовать как базу, перехватывая событие `submit`.

Пример подхода с перехватом сабмита в SPA (без конкретного фреймворка):

```html
<form id="login-form">
  <input type="email" name="email" required />
  <input type="password" name="password" required />
  <button type="submit">Войти</button>
</form>

<script>
const form = document.getElementById('login-form');

form.addEventListener('submit', function (event) {
  event.preventDefault(); // не даем странице перезагружаться

  const data = new FormData(form);

  // Здесь можно вызвать вашу функцию API-клиента
  // например login(data.get('email'), data.get('password'))
});
</script>
```

### Безопасность форм

Формы — один из основных источников данных от пользователя, поэтому здесь важно учитывать базовые моменты безопасности:

- всегда валидируйте данные на сервере (клиентская валидация — только удобство, а не защита);
- защищайтесь от CSRF (используйте CSRF-токены и метод `POST` там, где данные изменяются);
- используйте HTTPS для всех форм, особенно с паролями и личными данными;
- не доверяйте данным из формы без проверки.

С точки зрения HTML-тега `form` это напрямую не настраивается, но понимание контекста помогает правильно использовать атрибуты `method`, `action` и другие.

Теперь давайте перейдем к заключительным выводам.

Форма `form` в HTML — это контейнер, который связывает элементы ввода с логикой отправки данных. Вы узнали:

- как задавать адрес и метод отправки через `action` и `method`;
- какие еще атрибуты управляют поведением формы (`enctype`, `target`, `autocomplete`, `novalidate`, `accept-charset`, `name`, `id`);
- как формируются пары имя-значение и почему атрибут `name` критически важен;
- как использовать кнопки `submit` и настраивать несколько сценариев отправки;
- как подключить валидацию — встроенную и кастомную через JavaScript;
- как работать с данными формы через `FormData` и отправлять их с помощью `fetch`;
- как повышать удобство и доступность форм.

Если вы будете осознанно выбирать значения атрибутов и продумывать структуру формы, серверную обработку и UX, тег `form` станет надежной основой вашего взаимодействия с пользователями.

## Частозадаваемые технические вопросы по тегу form

### Как отправить форму на другой домен и что при этом учитывать

Отправьте форму, указав в `action` полный URL другого домена:

```html
<form action="https://external.example.com/endpoint" method="post">
  <!-- Поля формы -->
</form>
```

Учитывайте, что:

- браузер разрешит отправку, но вы не сможете прочитать ответ через JS, если домен не настроил CORS;
- cookies стороннего домена могут блокироваться политикой браузера;
- если нужно обработать ответ в вашем JS, настройте CORS на сервере целевого домена.

### Как сделать так чтобы форма отправлялась по нажатию Enter в нужном поле

По умолчанию нажатие Enter в текстовом поле внутри формы инициирует сабмит. Если в форме несколько полей, но вы хотите, чтобы Enter работал только в одном:

- оставьте форму обычной;
- в ненужных полях перехватите Enter в JS и отмените сабмит:

```js
input.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // блокируем отправку формы
  }
});
```

### Как отправить форму в формате JSON вместо стандартного form-data

Перехватите событие `submit`, соберите данные и отправьте через `fetch`:

```js
form.addEventListener('submit', function (event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  fetch(form.action, {
    method: form.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
});
```

Сервер в этом случае должен читать JSON, а не `application/x-www-form-urlencoded`.

### Как динамически менять action или method формы перед отправкой

В JS получите ссылку на форму и измените атрибуты прямо перед `submit`:

```js
form.addEventListener('submit', function (event) {
  // В зависимости от условий меняем адрес и метод
  if (someCondition) {
    form.action = '/save-draft';
    form.method = 'post';
  } else {
    form.action = '/publish';
    form.method = 'post';
  }
});
```

При этом вам не нужно вызывать `submit()` вручную, если вы не отменяли событие.

### Почему данные некоторых полей не приходят на сервер

Основные причины:

- у поля нет атрибута `name` — без него значение не попадает в запрос;
- поле помечено `disabled` — такие элементы игнорируются при отправке;
- поле находится вне формы и не имеет атрибута `form` с id формы;
- поле сбрасывается скриптом перед сабмитом.

Проверьте, что:

```html
<input name="fieldName" />
```

присутствует, поле не `disabled`, и оно связано с нужной формой.