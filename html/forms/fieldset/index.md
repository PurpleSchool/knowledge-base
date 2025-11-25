---
metaTitle: Группа полей HTML fieldset
metaDescription: Подробное руководство по HTML fieldset и legend - как группировать элементы формы улучшать доступность и настраивать внешний вид с учетом современных практик валидации и UX
author: Олег Марков
title: Группа полей HTML fieldset
preview: Разберитесь как работает HTML fieldset - когда его использовать как связать с legend управлять атрибутами disabled и form и настраивать стили для удобных и понятных форм
---

## Введение

Элемент fieldset в HTML используют для логической группировки полей формы. Он помогает:

- структурировать большие формы на смысловые блоки;
- улучшить доступность для скринридеров;
- упростить стилизацию и управление состоянием группы полей (например, отключение целого блока).

Смотрите, я покажу вам, как это работает, на простом примере. Представьте форму регистрации, где есть личные данные и данные аккаунта. Группировка через fieldset делает структуру формы понятной как пользователю, так и браузеру.

В этой статье вы разберетесь:

- как правильно использовать fieldset и legend;
- как работает disabled для группы полей;
- как fieldset взаимодействует с валидацией;
- как fieldset влияет на доступность;
- как стилизовать fieldset и legend так, чтобы форма выглядела аккуратно.

---

## Основы fieldset и legend

### Что такое fieldset

Элемент fieldset — это блочный контейнер для элементов формы:

- объединяет связанные по смыслу поля;
- может иметь заголовок через legend;
- учитывается браузером при навигации и чтении формы вспомогательными технологиями.

Простейшая структура выглядит так:

```html
<form>
  <fieldset>
    <!-- Заголовок группы полей -->
    <legend>Личные данные</legend>

    <!-- Поля внутри группы -->
    <label>
      Имя
      <input type="text" name="first_name">
    </label>

    <label>
      Фамилия
      <input type="text" name="last_name">
    </label>
  </fieldset>
</form>
```

Комментарии:

// fieldset - создает логическую группу полей формы  
// legend - задает название группы для пользователя и скринридеров  
// label + input - обычные элементы формы, вложенные в группу

### Роль legend и почему он важен

Элемент legend — заголовок группы полей. Он:

- отображается визуально как подпись для рамки группы (по умолчанию);
- читается скринридерами как часть контекста поля (полезно для доступности);
- должен быть первым дочерним элементом fieldset (это рекомендуемая практика).

Давайте разберемся на примере:

```html
<fieldset>
  <legend>Данные для доставки</legend>

  <label>
    Город
    <input type="text" name="city" required>
  </label>

  <label>
    Адрес
    <input type="text" name="address" required>
  </label>
</fieldset>
```

Комментарии:

// legend описывает весь блок - скринридер прочитает "Данные для доставки город"  
// это помогает пользователю с озвучкой понять контекст каждого поля

Если legend отсутствует, группа теряет понятный заголовок. С точки зрения доступности это ухудшение UX. Поэтому:

- для каждой содержательной группы полей желательно иметь legend;
- текст legend должен быть коротким и понятным (например "Оплата", "Контактные данные").

---

## Семантика и структура формы с fieldset

### Когда нужно использовать fieldset

Рекомендуется использовать fieldset, когда:

- форма достаточно большая (3–4 и более логических блока);
- есть понятные смысловые разделы (личные данные, адрес, оплата, настройки и т.п.);
- нужно визуально отделить несколько секций;
- важна корректная работа со скринридерами.

Не стоит использовать fieldset:

- просто "для отступов" или оформления без смысловой группировки;
- вокруг каждого отдельного поля (это загромождает разметку и мешает семантике);
- если блок не относится к форме логически (например, просто текстовый блок).

Пример неправильного и правильного использования:

```html
<!-- Плохой пример - поле обернуто в fieldset без смысла -->
<fieldset>
  <legend>Имя</legend>
  <input type="text" name="first_name">
</fieldset>

<!-- Лучше так -->
<label>
  Имя
  <input type="text" name="first_name">
</label>
```

Комментарии:

// fieldset здесь не создает группу - всего одно поле  
// legend дублирует label - нет выигрыша в структуре

А вот пример оправданного использования:

```html
<form>
  <fieldset>
    <legend>Личные данные</legend>
    <!-- Несколько связанных полей -->
    <label>
      Имя
      <input type="text" name="first_name" required>
    </label>
    <label>
      Фамилия
      <input type="text" name="last_name" required>
    </label>
    <label>
      Дата рождения
      <input type="date" name="birth_date">
    </label>
  </fieldset>

  <fieldset>
    <legend>Контакты</legend>
    <label>
      Email
      <input type="email" name="email" required>
    </label>
    <label>
      Телефон
      <input type="tel" name="phone">
    </label>
  </fieldset>
</form>
```

Комментарии:

// каждый fieldset отвечает за отдельный блок формы  
// legend делает структуру понятной и пользователю и скринридеру

### Вложенные fieldset

Иногда вам нужно сделать вложенную структуру, например, варианты оплаты внутри секции "Оплата". HTML допускает вложенные fieldset:

```html
<fieldset>
  <legend>Оплата</legend>

  <fieldset>
    <legend>Банковская карта</legend>
    <label>
      Номер карты
      <input type="text" name="card_number">
    </label>
    <label>
      Срок действия
      <input type="text" name="card_exp">
    </label>
  </fieldset>

  <fieldset>
    <legend>Электронный кошелек</legend>
    <label>
      Сервис
      <select name="wallet_service">
        <option>YooMoney</option>
        <option>PayPal</option>
      </select>
    </label>
  </fieldset>
</fieldset>
```

Комментарии:

// внешний fieldset - общая секция "Оплата"  
// внутренние fieldset - разные способы оплаты  
// такая вложенность приемлема, если она отражает реальную структуру данных

Важно не увлекаться слишком глубокой вложенностью, чтобы не усложнить восприятие и визуально, и для скринридеров.

---

## Атрибуты fieldset и их поведение

### Атрибут disabled

Атрибут disabled у fieldset блокирует все элементы управления внутри группы:

```html
<fieldset disabled>
  <legend>Настройки профиля</legend>

  <label>
    Имя пользователя
    <input type="text" name="username">
  </label>

  <label>
    Подписка на новости
    <input type="checkbox" name="newsletter">
  </label>
</fieldset>
```

Комментарии:

// disabled у fieldset делает все вложенные элементы формы недоступными  
// браузер отключит фокусировку и отправку значений этих полей

Особенности:

- все интерактивные элементы внутри fieldset становятся недоступными;
- значения отключенных полей не отправляются при сабмите формы;
- есть одно важное исключение: если legend содержит элементы формы, они могут оставаться активными (по спецификации).

Давайте посмотрим на это исключение:

```html
<fieldset disabled>
  <legend>
    Настройки недоступны
    <button type="button">Почему</button>
  </legend>

  <label>
    Параметр 1
    <input type="text" name="param1">
  </label>
</fieldset>
```

Комментарии:

// поля внутри fieldset будут отключены  
// элемент button внутри legend в некоторых браузерах останется активным  
// это поведение описано в спецификации - legend может содержать "живые" элементы

На практике лучше не полагаться на это исключение без необходимости. Если вам нужен активный элемент рядом с заголовком, иногда проще вынести его наружу и стилизовать визуально.

### Атрибут form

Атрибут form у fieldset позволяет ассоциировать группу полей с формой по id, даже если fieldset расположен вне тега form. Смотрите, как это работает:

```html
<form id="main-form">
  <button type="submit">Отправить</button>
</form>

<!-- fieldset вне формы, но привязан к ней через form="main-form" -->
<fieldset form="main-form">
  <legend>Дополнительные данные</legend>

  <label>
    Компания
    <input type="text" name="company">
  </label>
</fieldset>
```

Комментарии:

// form="main-form" у fieldset привязывает все вложенные элементы к форме с id="main-form"  
// при отправке формы значения полей внутри fieldset будут включены  
// это удобно, когда верстка сложная и form не может обернуть весь блок

Важно понимать:

- сам fieldset не отправляется, отправляются только его дочерние элементы формы;
- если у дочерних элементов есть собственный атрибут form, он имеет приоритет над form у fieldset.

---

## fieldset и валидация формы

### Как fieldset влияет на валидацию

Сам по себе fieldset не участвует в валидации (у него нет атрибутов required, pattern и т.п.), но:

- влияет на доступность и восприятие ошибок пользователем;
- может быть полезен при групповой подсветке ошибок.

Браузерная валидация работает на уровне отдельных полей, но вы можете использовать fieldset, чтобы визуально выделять блоки с ошибками.

Пример:

```html
<style>
  /* Подсветка ошибки для группы полей */
  fieldset.error {
    border-color: red;           /* подчеркиваем, что блок содержит ошибки */
  }

  fieldset.error legend {
    color: red;                  /* делаем заголовок красным */
  }
</style>

<form id="checkout">
  <fieldset id="address-group">
    <legend>Адрес доставки</legend>

    <label>
      Город
      <input id="city" type="text" name="city" required>
    </label>

    <label>
      Улица
      <input id="street" type="text" name="street" required>
    </label>
  </fieldset>

  <button type="submit">Оформить заказ</button>
</form>

<script>
  // Здесь мы показываем пример простой проверки при отправке формы
  const form = document.getElementById('checkout');
  const addressGroup = document.getElementById('address-group');

  form.addEventListener('submit', function (event) {
    // Сбрасываем предыдущее состояние
    addressGroup.classList.remove('error');

    // Проверяем валидность встроенными средствами
    // Если поле невалидно - form.checkValidity вернет false
    if (!form.checkValidity()) {
      event.preventDefault(); // Отменяем отправку

      // Если есть ошибка в полях адреса - подсвечиваем fieldset
      if (!document.getElementById('city').checkValidity() ||
          !document.getElementById('street').checkValidity()) {
        addressGroup.classList.add('error');
      }
    }
  });
</script>
```

Комментарии:

// form.checkValidity() - проверяет все поля формы  
// .checkValidity() у конкретного input показывает, валидно ли поле  
// класс error на fieldset используется для групповой подсветки

### Отключенные группы и валидация

Если на fieldset установлен disabled, все вложенные поля:

- не участвуют в валидации;
- не блокируют отправку формы.

Это может быть полезно, если, например, часть формы становится необязательной при определенном выборе.

Пример:

```html
<form id="order">
  <fieldset>
    <legend>Способ получения</legend>

    <label>
      <input type="radio" name="delivery_type" value="pickup" checked>
      Самовывоз
    </label>

    <label>
      <input type="radio" name="delivery_type" value="courier">
      Курьером
    </label>
  </fieldset>

  <fieldset id="courier-address" disabled>
    <legend>Адрес для доставки курьером</legend>

    <label>
      Город
      <input type="text" name="city" required>
    </label>

    <label>
      Улица
      <input type="text" name="street" required>
    </label>
  </fieldset>

  <button type="submit">Продолжить</button>
</form>

<script>
  // Покажу вам, как управлять disabled для fieldset на JS
  const deliveryRadios = document.querySelectorAll('input[name="delivery_type"]');
  const courierFieldset = document.getElementById('courier-address');

  deliveryRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      // Включаем или отключаем группу адреса в зависимости от выбора
      if (this.value === 'courier') {
        courierFieldset.disabled = false; // теперь поля обязательны
      } else {
        courierFieldset.disabled = true;  // поля игнорируются при валидации
      }
    });
  });
</script>
```

Комментарии:

// пока выбран "Самовывоз" - fieldset с адресом отключен  
// required у полей адреса не срабатывает, форма отправляется без ошибок  
// при выборе "Курьером" fieldset включается и валидация начинает учитывать эти поля

---

## Доступность (a11y) и fieldset

### Как fieldset помогает доступности

Для пользователей скринридеров fieldset и legend дают важный контекст. Скринридеры обычно:

- объявляют legend перед чтением поля;
- формируют "группу" вопросов, связанную по смыслу.

Например, для чекбоксов "Согласие на рассылки" удобнее сделать одну legend и несколько вариантов.

```html
<fieldset>
  <legend>Выберите рассылки</legend>

  <label>
    <input type="checkbox" name="newsletter_promos">
    Акции и спецпредложения
  </label>

  <label>
    <input type="checkbox" name="newsletter_news">
    Новости компании
  </label>

  <label>
    <input type="checkbox" name="newsletter_surveys">
    Опросы и исследования
  </label>
</fieldset>
```

Комментарии:

// legend "Выберите рассылки" будет прочитан перед каждым вариантом  
// пользователь с озвучкой понимает, что все эти чекбоксы относятся к одной группе

Без fieldset и legend скринридер может прочитать только текст label, и пользователю будет сложнее понять общую тему блока.

### Рекомендации по доступности

Несколько практических советов:

- размещайте legend первым дочерним элементом fieldset;
- делайте текст legend кратким и описательным (2–5 слов);
- не используйте legend для длинных инструкций — лучше поместить их в параграф после legend;
- избегайте пустых fieldset без legend, если контент подразумевает смысловую группу.

Пример хорошей структуры:

```html
<fieldset>
  <legend>Настройки уведомлений</legend>

  <p>
    Выберите, какие уведомления вы хотите получать по электронной почте.
    Вы всегда можете изменить этот выбор позже в профиле.
  </p>

  <label>
    <input type="checkbox" name="notify_comments">
    Комментарии к моим записям
  </label>

  <label>
    <input type="checkbox" name="notify_mentions">
    Упоминания меня в обсуждениях
  </label>
</fieldset>
```

Комментарии:

// legend задает общий контекст  
// параграф p дает дополнительное описание, не нагружая legend  
// скринридер будет последовательно читать legend, текст p и затем чекбоксы

---

## Стилизация fieldset и legend

### Базовая стилизация

По умолчанию браузеры:

- рисуют рамку вокруг fieldset;
- помещают legend в разрыв рамки;
- задают свои отступы.

Часто дизайнеры хотят другой внешний вид. Давайте посмотрим, как его настроить.

```html
<style>
  fieldset {
    border: 1px solid #ccc;      /* делаем тонкую серую рамку */
    padding: 1rem 1.5rem;        /* внутренние отступы */
    margin-bottom: 1.5rem;       /* отступ снизу между блоками */
    border-radius: 4px;          /* чуть скругляем углы */
  }

  legend {
    padding: 0 0.5rem;           /* небольшой отступ вокруг текста */
    font-weight: 600;            /* делаем легенду полужирной */
    color: #333;
  }
</style>
```

Комментарии:

// эти стили создают аккуратные блоки формы  
// legend визуально отделена, но не чрезмерно выделена  
// margin-bottom у fieldset задает расстояние между секциями формы

Теперь вы увидите, как это выглядит в коде вместе с разметкой:

```html
<form>
  <fieldset>
    <legend>Личные данные</legend>
    <!-- поля... -->
  </fieldset>

  <fieldset>
    <legend>Адрес</legend>
    <!-- поля... -->
  </fieldset>
</form>
```

### Удаление рамки и создание кастомного оформления

Иногда рамка fieldset не нужна, а роль этого элемента — только семантическая. В этом случае можно скрыть рамку и оформить legend как обычный заголовок.

```html
<style>
  .form-section {
    border: none;                /* убираем стандартную рамку */
    padding: 0;                  /* сбрасываем отступы, чтобы контролировать их сами */
    margin: 0 0 2rem 0;          /* задаем отступ только снизу */
  }

  .form-section legend {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    padding: 0;
  }

  .form-section .field {
    margin-bottom: 0.75rem;
  }
</style>

<form>
  <fieldset class="form-section">
    <legend>Личные данные</legend>

    <div class="field">
      <label>
        Имя
        <input type="text" name="first_name">
      </label>
    </div>

    <div class="field">
      <label>
        Фамилия
        <input type="text" name="last_name">
      </label>
    </div>
  </fieldset>
</form>
```

Комментарии:

// border: none и padding: 0 превращают fieldset почти в обычный контейнер  
// legend оформляется как заголовок секции  
// семантика сохраняется, внешний вид контролируется полностью

### Кроссбраузерные особенности стилизации

Некоторые моменты, с которыми вы можете столкнуться:

- у разных браузеров по-разному реализована позиция legend внутри рамки;
- в старых браузерах legend плохо поддавался flex- или grid-выравниванию;
- свойства типа display: flex у fieldset могут вести себя нестандартно в некоторых старых версиях.

Современные браузеры работают заметно лучше, но если вы видите "ломающийся" дизайн:

1. Проверьте, не используете ли устаревшие хаки для fieldset;
2. Сбросьте базовые стили (border, padding, margin) и стройте оформление заново;
3. При сложной вёрстке внутри используйте дополнительные обертки:

```html
<fieldset class="form-section">
  <legend>Адрес</legend>

  <div class="form-section__content">
    <!-- здесь уже можно использовать flex или grid -->
  </div>
</fieldset>
```

Комментарии:

// fieldset остается простым контейнером  
// основная сложная вёрстка переносится в div внутри  
// это снижает риск кроссбраузерных артефактов

---

## Примеры использования fieldset в реальных формах

### Анкета с несколькими разделами

Давайте разберемся на примере длинной анкеты. Здесь fieldset помогает пользователю не "потеряться" в множестве полей.

```html
<form>
  <fieldset>
    <legend>Основные данные</legend>

    <label>
      Имя
      <input type="text" name="first_name" required>
    </label>

    <label>
      Фамилия
      <input type="text" name="last_name" required>
    </label>

    <label>
      Email
      <input type="email" name="email" required>
    </label>
  </fieldset>

  <fieldset>
    <legend>Профессиональная информация</legend>

    <label>
      Должность
      <input type="text" name="position">
    </label>

    <label>
      Компания
      <input type="text" name="company">
    </label>

    <label>
      Опыт работы в годах
      <input type="number" name="experience" min="0" max="50">
    </label>
  </fieldset>

  <fieldset>
    <legend>Интересующие темы</legend>

    <label>
      <input type="checkbox" name="topics" value="frontend">
      Frontend разработка
    </label>

    <label>
      <input type="checkbox" name="topics" value="backend">
      Backend разработка
    </label>

    <label>
      <input type="checkbox" name="topics" value="devops">
      DevOps и инфраструктура
    </label>
  </fieldset>

  <button type="submit">Отправить анкету</button>
</form>
```

Комментарии:

// каждый fieldset - логический блок анкеты  
// legend делает структуру формы понятной при беглом просмотре  
// группировка чекбоксов через fieldset улучшает доступность

### Группа радиокнопок с общей легендой

Особенно важен fieldset для групп радиокнопок, отвечающих на один вопрос:

```html
<fieldset>
  <legend>Как вы узнали о нас</legend>

  <label>
    <input type="radio" name="source" value="friends" required>
    От друзей или коллег
  </label>

  <label>
    <input type="radio" name="source" value="search">
    Поисковая система
  </label>

  <label>
    <input type="radio" name="source" value="ads">
    Реклама
  </label>

  <label>
    <input type="radio" name="source" value="other">
    Другое
  </label>
</fieldset>
```

Комментарии:

// legend формулирует вопрос  
// каждый label описывает вариант ответа  
// для пользователя с озвучкой это звучит как один вопрос с несколькими вариантами

Без legend вопрос пришлось бы повторять в каждом label или выносить в отдельный текст, который не всегда корректно ассоциируется скринридером с конкретной группой радиокнопок.

---

## fieldset во взаимодействии с JavaScript

### Получение и управление группой полей

Через JavaScript с fieldset можно работать так же, как с любым другим элементом:

```html
<form id="profile-form">
  <fieldset id="security">
    <legend>Безопасность</legend>

    <label>
      Новый пароль
      <input type="password" name="password">
    </label>

    <label>
      Повторите пароль
      <input type="password" name="password_repeat">
    </label>
  </fieldset>

  <button type="submit">Сохранить</button>
</form>

<script>
  // Покажу вам, как включать и отключать группу полей по условию
  const securityFieldset = document.getElementById('security');

  function lockSecuritySection() {
    // Отключаем поле безопасности, если, например, пользователь вошел через SSO
    securityFieldset.disabled = true;  // все поля внутри становятся disabled
  }

  function unlockSecuritySection() {
    // Разрешаем изменение пароля
    securityFieldset.disabled = false;
  }

  // Здесь вы могли бы вызывать эти функции по определенному условию
</script>
```

Комментарии:

// доступ к fieldset по id такой же, как к любому DOM-элементу  
// свойство disabled управляет состоянием группы  
// это удобно, когда включение блока зависит от других параметров формы

### Навигация по полям внутри fieldset

Иногда нужно быстро получить все элементы внутри группы. Для этого можно использовать стандартные селекторы:

```html
<script>
  const securityFieldset = document.getElementById('security');

  // Получаем все поля ввода внутри fieldset
  const inputs = securityFieldset.querySelectorAll('input');

  inputs.forEach(function (input) {
    // Здесь мы просто выводим имя поля
    console.log('Поле внутри безопасности:', input.name);
  });
</script>
```

Комментарии:

// querySelectorAll('input') найдет все input внутри заданного fieldset  
// так можно, например, сбросить значения группы или применить собственную валидацию

---

## Заключение

Элемент fieldset — это не просто визуальная рамка вокруг группы полей, а важный семантический инструмент для организации форм. Он:

- группирует связанные поля и делает структуру формы понятной;
- улучшает доступность за счет взаимодействия с legend;
- позволяет единообразно управлять состоянием большой части формы через disabled;
- помогает создавать более логичный интерфейс для сложных и длинных форм.

Правильное использование fieldset и legend делает формы удобнее для всех: и для пользователей с полной визуальной доступностью, и для тех, кто полагается на скринридеры, и для вас как разработчика, который поддерживает и расширяет код.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как убрать стандартную рамку fieldset и сделать свою

Сбросьте базовые стили и нарисуйте свой контейнер:

```css
fieldset.custom {
  border: none;          /* убираем рамку */
  padding: 0;
  margin: 0 0 1.5rem 0;
}

fieldset.custom legend {
  padding: 0;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

fieldset.custom .box {
  border: 1px solid #ddd;   /* своя рамка */
  padding: 1rem;
  border-radius: 4px;
}
```

Комментарии:

// legend служит заголовком  
// .box внутри fieldset выполняет роль визуальной рамки

### Можно ли сделать legend кликабельным и не ломает ли это доступность

Да, legend может содержать интерактивные элементы, но важно не превращать весь legend в кнопку, если он выполняет роль заголовка. Лучше:

```html
<fieldset>
  <legend>
    Настройки профиля
    <button type="button">Сбросить</button>
  </legend>
  <!-- поля -->
</fieldset>
```

Комментарии:

// заголовок остается текстовым  
// кнопка рядом выполняет действие  
// скринридеры корректно озвучат и легенду и кнопку

### Как скрыть legend визуально но оставить для скринридера

Используйте технику visually hidden:

```css
.legend-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
```

```html
<fieldset>
  <legend class="legend-visually-hidden">Данные карты</legend>
  <!-- визуальный заголовок можно сделать, например, через h3 -->
  <h3>Оплата картой</h3>
  <!-- поля -->
</fieldset>
```

Комментарии:

// legend доступен для скринридеров  
// визуально пользователи видят стилизованный заголовок h3

### Почему disabled у fieldset иногда не отключает кнопку в legend

По спецификации элементы внутри legend могут оставаться активными даже при disabled на fieldset. Это сделано, чтобы дать возможность объяснить, почему блок недоступен, или предложить действие. Если вам нужно, чтобы кнопка тоже была отключена, задайте disabled и ей:

```html
<legend>
  Раздел недоступен
  <button type="button" disabled>Подробнее</button>
</legend>
```

Комментарии:

// не полагайтесь только на наследование disabled от fieldset для элементов legend

### Можно ли использовать fieldset вне формы и имеет ли это смысл

Технически да, fieldset может находиться вне form, но:

- он не будет участвовать в отправке данных;
- часть смысла (связанного с формой) теряется.

Использовать fieldset вне формы стоит только если вы сознательно хотите сохранить семантику группировки полей, которые потом будут программно собраны в запрос. В большинстве случаев для нефомальных блоков лучше использовать div с ролями ARIA при необходимости.