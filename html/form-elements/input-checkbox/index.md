---
metaTitle: Чекбокс в HTML - полное руководство по input-checkbox
metaDescription: Подробное объяснение элемента input type checkbox в HTML - синтаксис атрибуты состояние и работа с JavaScript
author: Олег Марков
title: Чекбокс в HTML - input-checkbox для начинающих и не только
preview: Разберитесь как работает HTML чекбокс - input type checkbox - от базового синтаксиса до продвинутых приемов управления состоянием и стилизации
---

## Введение

Чекбокс в HTML — это один из самых часто используемых элементов формы. С его помощью вы даете пользователю возможность включать или выключать опцию, выбирать несколько вариантов из списка, подтверждать согласие с правилами и многое другое.

В основе чекбокса лежит элемент формы `input` с атрибутом `type="checkbox"`. Несмотря на простоту на первый взгляд, у чекбоксов есть множество тонкостей: работа с атрибутами, группировка, обработка на сервере, управление через JavaScript, стилизация по макету, состояние `indeterminate` и поведение в доступности.

Давайте разберем чекбокс системно — от базовой разметки до продвинутых приемов.

## Базовый синтаксис чекбокса

### Минимальный пример чекбокса

Сначала посмотрим на самый простой чекбокс.

```html
<input type="checkbox">
```

Этот код создаст чекбокс без подписи. Пользователь увидит только маленький квадрат, который можно отметить или снять отметку.

На практике почти всегда чекбокс сопровождается текстовой меткой, чтобы было понятно, за что он отвечает. Для этого используется элемент `label`.

```html
<label>
  <input type="checkbox">
  Согласен с условиями
</label>
```

Комментарии и пояснения:

- Здесь `label` оборачивает `input` и текст.
- Когда пользователь кликнет по тексту "Согласен с условиями", сработает тот же эффект, что и при клике по самому чекбоксу.
- Это сильно улучшает удобство и доступность.

### Использование атрибута name

Чтобы значение чекбокса ушло на сервер при отправке формы, ему нужен атрибут `name`:

```html
<form action="/subscribe" method="post">
  <label>
    <input type="checkbox" name="accept_terms">
    Я принимаю условия использования
  </label>
  <button type="submit">Отправить</button>
</form>
```

Что здесь важно:

- Атрибут `name="accept_terms"` — это имя параметра, которое сервер получит при отправке формы.
- Если чекбокс не отмечен, параметр с таким именем в запрос вообще не будет отправлен (это важно помнить при обработке на сервере).
- Если чекбокс отмечен, сервер получит что-то вроде `accept_terms=on` (если вы не указали свой атрибут `value`).

### Атрибут value

По умолчанию, если вы не задали `value`, браузер отправляет значение `on`. Обычно так делать не очень удобно, поэтому лучше явно указывать то, что вы хотите получить на сервере.

```html
<label>
  <input type="checkbox" name="newsletter" value="weekly">
  Получать еженедельную рассылку
</label>
```

Комментарии:

// name - имя параметра на сервере  
// value - конкретное значение если чекбокс отмечен

При отправке формы, если чекбокс отмечен, сервер получит `newsletter=weekly`. Если не отмечен — параметра `newsletter` не будет.

## Основные атрибуты чекбокса

### checked — состояние по умолчанию

Атрибут `checked` задает начальное состояние чекбокса. Если он присутствует в разметке, чекбокс будет отмечен при загрузке страницы.

```html
<label>
  <input type="checkbox" name="subscribe" value="yes" checked>
  Подписаться на новости
</label>
```

Обратите внимание:

- Достаточно просто прописать `checked` без значения.
- С точки зрения DOM у чекбокса есть два разных понятия: "изначальное" состояние (`defaultChecked`) и "текущее" (`checked`). При взаимодействии через JavaScript это важно, чуть позже мы это разберем.

### disabled — отключенный чекбокс

Атрибут `disabled` делает чекбокс неактивным — по нему нельзя кликнуть, он не фокусируется и его значение не уйдет в форму.

```html
<label>
  <input type="checkbox" name="beta_access" disabled>
  Участие в бета-тестировании недоступно
</label>
```

Комментарии:

// disabled - пользователь не может изменить состояние  
// значение этого чекбокса не отправится с формой

Если вам нужно просто запретить изменение, но при этом отправить значение на сервер, лучше использовать `readonly` через обходные приемы (например, скрытое поле) или управлять логикой на сервере. У `checkbox` нет нативного `readonly`.

### required — обязательный чекбокс

Атрибут `required` делает чекбокс обязательным для отметки, чтобы отправить форму.

```html
<form>
  <label>
    <input type="checkbox" name="terms" required>
    Я принимаю условия договора
  </label>
  <button type="submit">Продолжить</button>
</form>
```

Поведение:

- Если пользователь не отмечает чекбокс, браузер не отправит форму.
- Появится встроенная подсказка браузера (обычно рядом с чекбоксом).
- Работает только в составе формы и только при нативной отправке.

### Атрибут id и привязка label по for

Иногда удобнее не оборачивать `input` внутри `label`, а связывать их через `id` и `for`. Это особенно полезно, когда вам нужно более гибко разместить элементы в верстке.

```html
<input type="checkbox" id="agree" name="agree">
<label for="agree">Я согласен с политикой конфиденциальности</label>
```

Комментарии:

// id - уникальный идентификатор чекбокса  
// for - атрибут label указывает на id связанного input

Пользователь может нажимать и по квадрату, и по тексту, оба действия будут переключать чекбокс.

## Группы чекбоксов и множественный выбор

### Несколько независимых чекбоксов

Каждый чекбокс может представлять отдельную независимую опцию:

```html
<form>
  <label>
    <input type="checkbox" name="notifications_email" value="1">
    Уведомления по email
  </label>
  <label>
    <input type="checkbox" name="notifications_sms" value="1">
    Уведомления по SMS
  </label>
</form>
```

Здесь:

// каждый чекбокс имеет свое имя  
// сервер получит два разных параметра если оба включены

### Группа чекбоксов с одинаковым name

Часто нужно позволить пользователю выбрать несколько значений из одной категории. Тогда уместно давать чекбоксам одинаковый `name` и разные `value`. На сервере это обычно интерпретируется как массив значений.

```html
<form>
  <fieldset>
    <legend>Выберите любимые языки программирования</legend>

    <label>
      <input type="checkbox" name="languages" value="go">
      Go
    </label>

    <label>
      <input type="checkbox" name="languages" value="python">
      Python
    </label>

    <label>
      <input type="checkbox" name="languages" value="javascript">
      JavaScript
    </label>
  </fieldset>
</form>
```

При отправке формы:

- Если пользователь выбрал Go и Python, сервер получит `languages=go&languages=python`.
- На стороне сервера это обычно превращают в массив: `["go", "python"]`.

`fieldset` и `legend` здесь помогают логически объединить чекбоксы и улучшают доступность.

### Чекбокс "Выделить все"

Один из типичных сценариев — чекбокс, который отмечает или снимает все остальные. Покажу вам, как это сделать на практике.

```html
<form id="emails-form">
  <label>
    <input type="checkbox" id="select-all">
    Выделить все письма
  </label>

  <div>
    <label>
      <input type="checkbox" name="email_ids" value="1" class="email-checkbox">
      Письмо 1
    </label>
    <label>
      <input type="checkbox" name="email_ids" value="2" class="email-checkbox">
      Письмо 2
    </label>
    <label>
      <input type="checkbox" name="email_ids" value="3" class="email-checkbox">
      Письмо 3
    </label>
  </div>
</form>

<script>
// Находим чекбокс "Выделить все"
const selectAll = document.getElementById('select-all')

// Находим все чекбоксы писем
const emailCheckboxes = document.querySelectorAll('.email-checkbox')

// При смене состояния "Выделить все" отмечаем или снимаем остальные
selectAll.addEventListener('change', () => {
  // Берем текущее состояние чекбокса "Выделить все"
  const isChecked = selectAll.checked

  // Пробегаем по всем чекбоксам и выставляем им такое же состояние
  emailCheckboxes.forEach(cb => {
    cb.checked = isChecked
  })
})
</script>
```

Здесь вы видите базовый, но часто используемый паттерн, с которым вы будете сталкиваться в реальных проектах.

## Состояния чекбокса и JavaScript

### checked и defaultChecked

У чекбокса есть несколько важных свойств в DOM:

- `checked` — текущее состояние (отмечен или нет).
- `defaultChecked` — то состояние, которое было задано в HTML через атрибут `checked`.

Давайте посмотрим, как это работает.

```html
<input type="checkbox" id="notify" checked>

<script>
// Находим чекбокс
const cb = document.getElementById('notify')

// Выводим в консоль текущее и исходное состояние
console.log(cb.checked)        // true - текущая отметка
console.log(cb.defaultChecked) // true - задано в HTML

// Меняем состояние скриптом
cb.checked = false

console.log(cb.checked)        // false
console.log(cb.defaultChecked) // все еще true - HTML не менялся
</script>
```

Комментарии:

// checked - изменяется при взаимодействии пользователя и скриптов  
// defaultChecked - отражает первоначальную разметку

Если вам нужно сбросить форму к исходному состоянию (как при нажатии кнопки reset), браузер использует именно `defaultChecked`.

### Получение и установка состояния в JS

Для работы с чекбоксом через JavaScript используются в основном свойства `checked` и `value`.

```html
<label>
  <input type="checkbox" id="dark-mode" name="dark_mode" value="on">
  Темная тема
</label>

<script>
// Находим чекбокс
const darkModeCheckbox = document.getElementById('dark-mode')

// Проверяем отмечен ли чекбокс
if (darkModeCheckbox.checked) {
  // Здесь вы можете включить темную тему
  console.log('Темная тема включена')
}

// Принудительно отмечаем чекбокс
darkModeCheckbox.checked = true

// Снимаем отметку
darkModeCheckbox.checked = false
</script>
```

### Обработка события change

Для чекбокса логично реагировать на событие `change` — оно срабатывает, когда пользователь меняет состояние.

```html
<label>
  <input type="checkbox" id="receive-updates">
  Получать обновления продукта
</label>

<script>
// Находим чекбокс
const receiveUpdates = document.getElementById('receive-updates')

// Подписываемся на событие изменения
receiveUpdates.addEventListener('change', (event) => {
  // Через event.target обращаемся к самому чекбоксу
  const isChecked = event.target.checked

  if (isChecked) {
    console.log('Пользователь включил обновления')
    // Здесь можно, например, показать дополнительные настройки
  } else {
    console.log('Пользователь отключил обновления')
  }
})
</script>
```

Комментарии:

// change - срабатывает при изменении состояния после потери фокуса или сразу в зависимости от браузера  
// event.target.checked - актуальное состояние в момент события

### indeterminate — промежуточное состояние

У чекбокса есть особое состояние — `indeterminate` (неопределенное, "частично отмечено"). Оно не задается через HTML-атрибут, только через JavaScript.

Это состояние часто используется для чекбокса "Выделить все", когда часть элементов выбрана, а часть нет.

```html
<input type="checkbox" id="select-all-tasks">
<label for="select-all-tasks">Выделить все задачи</label>

<ul>
  <li>
    <label>
      <input type="checkbox" class="task">
      Задача 1
    </label>
  </li>
  <li>
    <label>
      <input type="checkbox" class="task">
      Задача 2
    </label>
  </li>
</ul>

<script>
const selectAllTasks = document.getElementById('select-all-tasks')
const tasks = document.querySelectorAll('.task')

// Функция обновляет состояние чекбокса "Выделить все"
function updateSelectAllState() {
  const checkedTasks = Array.from(tasks).filter(task => task.checked)

  if (checkedTasks.length === 0) {
    // Ни одна задача не выбрана
    selectAllTasks.checked = false
    selectAllTasks.indeterminate = false
  } else if (checkedTasks.length === tasks.length) {
    // Все задачи выбраны
    selectAllTasks.checked = true
    selectAllTasks.indeterminate = false
  } else {
    // Выбрана только часть задач
    selectAllTasks.checked = false
    selectAllTasks.indeterminate = true
  }
}

// При изменении отдельной задачи обновляем состояние "Выделить все"
tasks.forEach(task => {
  task.addEventListener('change', updateSelectAllState)
})

// При клике по "Выделить все" просто отмечаем или снимаем все задачи
selectAllTasks.addEventListener('change', () => {
  const isChecked = selectAllTasks.checked
  tasks.forEach(task => {
    task.checked = isChecked
  })
  // После массового изменения промежуточного состояния быть не должно
  selectAllTasks.indeterminate = false
})
</script>
```

Комментарии:

// indeterminate влияет только на отображение чекбокса  
// при этом свойство checked остается либо true либо false  
// значение indeterminate не отправляется на сервер

## Отправка данных формы с чекбоксами

### Поведение при отправке формы

Важно понимать основное правило:

- Если чекбокс не отмечен — поле с его именем вообще не попадает в запрос.
- Если отмечен — отправляется пара `name=value`.

Например:

```html
<form action="/save" method="get">
  <label>
    <input type="checkbox" name="notify" value="yes">
    Уведомлять меня о событиях
  </label>
  <button type="submit">Сохранить</button>
</form>
```

Если отметка включена, адрес может выглядеть так:

// /save?notify=yes

Если выключена — просто `/save` без параметра `notify`.

### Как отправить "false" явным образом

Иногда серверу нужно явно знать, что пользователь снял отметку, а не просто "ничего не прислал". Один из распространенных приемов — добавить скрытое поле с тем же именем перед чекбоксом.

```html
<form action="/settings" method="post">
  <!-- Скрытое поле с значением "0" -->
  <input type="hidden" name="notify" value="0">
  
  <label>
    <!-- Чекбокс перезаписывает значение на "1" если отмечен -->
    <input type="checkbox" name="notify" value="1">
    Получать уведомления
  </label>

  <button type="submit">Сохранить</button>
</form>
```

Как это работает:

// если чекбокс не отмечен - на сервер идет только notify=0  
// если отмечен - браузер отправит notify=0 и notify=1  
// сервер обычно берет последнее значение - notify=1

Такой подход хорошо управляет логикой "да/нет" без дополнительных проверок.

## Стилизация чекбоксов

### Базовая стилизация через label

Нативный чекбокс по стандартам сильно ограничен в стилизации, но вы можете оформить его окружение — текст, отступы и т.п.

```html
<style>
.checkbox-wrapper {
  display: flex;              /* Располагаем чекбокс и текст в одну строку */
  align-items: center;        /* Выравниваем по вертикали */
  gap: 8px;                   /* Расстояние между квадратиком и текстом */
  cursor: pointer;            /* Курсор-рука при наведении */
}
</style>

<label class="checkbox-wrapper">
  <input type="checkbox" name="accept">
  Принять условия
</label>
```

Комментарии:

// мы не меняем внешний вид самого input  
// но улучшаем взаимодействие и выравнивание

### Кастомный чекбокс с помощью скрытого input

Часто дизайн требует "свою" галочку. Один распространенный подход — спрятать нативный `input`, а визуально отрисовать чекбокс через псевдоэлементы.

```html
<style>
.custom-checkbox {
  display: inline-flex;          /* Чекбокс и текст в одну строку */
  align-items: center;
  cursor: pointer;
}

/* Скрываем нативный чекбокс, но оставляем его доступным для фокуса и скринридеров */
.custom-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;                    /* Прозрачный но остается кликабельным */
  width: 0;
  height: 0;
}

/* Визуальный квадратик */
.custom-checkbox span.box {
  width: 16px;
  height: 16px;
  border: 2px solid #555;
  border-radius: 3px;
  display: inline-block;
  margin-right: 8px;
  box-sizing: border-box;
  position: relative;
}

/* Галочка в отмеченном состоянии */
.custom-checkbox input[type="checkbox"]:checked + span.box::after {
  content: "";
  position: absolute;
  left: 3px;
  top: 0px;
  width: 6px;
  height: 10px;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg);
}

/* Заливка при отмеченном состоянии */
.custom-checkbox input[type="checkbox"]:checked + span.box {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

/* Обводка при фокусе для доступности */
.custom-checkbox input[type="checkbox"]:focus + span.box {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}
</style>

<label class="custom-checkbox">
  <input type="checkbox" name="custom_agree">
  <span class="box"></span>
  С этим согласен
</label>
```

Комментарии:

// input спрятан визуально но остался в DOM и доступен для клавиатуры  
// span.box - элемент который мы стилизуем как чекбокс  
// селектор :checked + span.box - меняет вид "квадратика" когда чекбокс отмечен

Этот прием хорошо работает, если нужно строго соответствовать дизайну и при этом сохранить нативное поведение и доступность.

### Использование accent-color (современный способ)

В современных браузерах есть свойство `accent-color`, которое позволяет менять цвет стандартного чекбокса без полного переопределения стилей.

```html
<style>
input[type="checkbox"].accent-blue {
  accent-color: #0d6efd;   /* Синий цвет акцента */
}

input[type="checkbox"].accent-green {
  accent-color: #28a745;   /* Зеленый цвет акцента */
}
</style>

<label>
  <input type="checkbox" class="accent-blue">
  Синий чекбокс
</label>

<label>
  <input type="checkbox" class="accent-green">
  Зеленый чекбокс
</label>
```

Комментарии:

// accent-color поддерживается в современных браузерах  
// это безопасный и простой способ задать брендовый цвет чекбокса без кастомной разметки

## Доступность чекбоксов (a11y)

### Связь чекбокса и подписи

Самое важное для доступности — чтобы у чекбокса была корректная подпись. Для этого:

- Используйте `label` (обертка или через `for`).
- Не отделяйте визуальный текст от логической подписи.

Хороший вариант:

```html
<label for="marketing">
  Получать маркетинговые предложения
</label>
<input type="checkbox" id="marketing" name="marketing">
```

Или:

```html
<label>
  <input type="checkbox" name="marketing">
  Получать маркетинговые предложения
</label>
```

Оба способа считаются корректными. Экранный диктор прочитает текст "Получать маркетинговые предложения" как имя чекбокса.

### Группы чекбоксов и fieldset/legend

Когда у вас есть группа связанных чекбоксов (например, выбор интересов), полезно использовать `fieldset` и `legend`.

```html
<fieldset>
  <legend>Выберите интересующие вас темы</legend>

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
    DevOps
  </label>
</fieldset>
```

Комментарии:

// legend - описывает общую тему группы  
// для скринридера это звучит как заголовок перед перечнем опций

### Управление с клавиатуры

По умолчанию чекбоксы:

- Попадают в таб-цикл с помощью клавиши Tab.
- Переключаются пробелом (Space).

Если вы делаете кастомный чекбокс, важно:

- Не убирать `input` из таб-цикла (не задавать `tabindex="-1"` без необходимости).
- Не блокировать стандартное поведение с помощью `pointer-events: none` или чрезмерных `z-index`, если не понимаете последствий.
- Если вы делаете полностью кастомный элемент без `input`, нужно вручную добавить поддержку клавиатуры и доступности (через `role="checkbox"` и `aria-checked`), но такой путь сложнее и требует аккуратности.

## Типичные сценарии использования чекбоксов

### Подтверждение согласия с условиями

Один из наиболее распространенных кейсов — чекбокс, без отметки которого форма не отправляется.

```html
<form>
  <p>
    Перед продолжением вы должны принять условия.
  </p>

  <label>
    <input type="checkbox" name="terms" required>
    Я прочитал и принимаю условия использования
  </label>

  <button type="submit">Далее</button>
</form>
```

Комментарии:

// required - не позволит отправить форму без отметки  
// сервер все равно должен проверять наличие согласия независимо от валидации браузера

### Настройки профиля и переключатели

Чекбоксы хорошо подходят для включения/отключения определенных функций.

```html
<form>
  <h3>Настройки уведомлений</h3>

  <label>
    <input type="checkbox" name="notify_email" value="1" checked>
    Уведомлять по email
  </label>

  <label>
    <input type="checkbox" name="notify_push" value="1">
    Уведомлять через push-уведомления
  </label>

  <button type="submit">Сохранить изменения</button>
</form>
```

### Чекбокс как триггер показа дополнительного блока

Часто разработчики используют чекбокс, чтобы по нему отображать или скрывать дополнительные поля. Это можно сделать даже без JavaScript с помощью CSS.

```html
<style>
.extra-settings {
  display: none;          /* Скрываем блок по умолчанию */
}

/* Если чекбокс отмечен - показываем блок */
#enable-advanced:checked ~ .extra-settings {
  display: block;
}
</style>

<label>
  <input type="checkbox" id="enable-advanced">
  Показать расширенные настройки
</label>

<div class="extra-settings">
  <!-- Этот блок появится после отметки чекбокса -->
  <label>
    Максимальное количество попыток:
    <input type="number" name="max_attempts" value="3">
  </label>
</div>
```

Комментарии:

// используем селектор :checked и соседний селектор ~  
// такой подход работает только если блок следует после чекбокса в DOM  
// это поведение без JS - удобно для простых интерфейсов

## Распространенные ошибки и подводные камни

### Ожидание что неотмеченный чекбокс отправит "false"

Многие начинающие разработчики предполагают, что если чекбокс не отмечен, сервер получит значение `"false"` или `"0"`. Но браузер просто не отправляет это поле.

Если вы хотите всегда иметь четкое логическое значение на сервере, используйте прием со скрытым полем, который мы разбирали выше, или обрабатывайте отсутствие параметра как `false`.

### Отсутствие label и проблемы с кликабельной областью

Частая ошибка — выводить чекбокс и текст отдельно, без `label`:

```html
<!-- Неудачный вариант -->
<input type="checkbox" name="agree">
Согласен
```

Проблемы:

// текст не кликабелен  
// пользователь попадает только в маленький квадрат чекбокса  
// для скринридеров подпись не связана с чекбоксом

Лучше:

```html
<label>
  <input type="checkbox" name="agree">
  Согласен
</label>
```

Или через `for` и `id`.

### Сложные кастомные чекбоксы без учета доступности

Иногда разработчики вообще убирают нативный `input`, заменяя его `div` и прописывая туда фон-галочку. Без дополнительных атрибутов доступности такой элемент:

- Не фокусируется с клавиатуры.
- Не имеет роли "чекбокс" для скринридера.
- Не переключается клавишей `Space`.

Если вы действительно вынуждены делать чекбокс на `div`, как минимум:

```html
<div
  role="checkbox"
  aria-checked="false"
  tabindex="0"
  id="custom-checkbox"
>
  Получать новости
</div>

<script>
const customCheckbox = document.getElementById('custom-checkbox')

// Функция переключает состояние чекбокса
function toggleCheckbox() {
  const current = customCheckbox.getAttribute('aria-checked') === 'true'
  const next = !current
  customCheckbox.setAttribute('aria-checked', String(next))
}

// Клик мышью
customCheckbox.addEventListener('click', toggleCheckbox)

// Нажатие пробела или Enter с клавиатуры
customCheckbox.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault() // Не прокручиваем страницу
    toggleCheckbox()
  }
})
</script>
```

Комментарии:

// role="checkbox" - говорит вспомогательным технологиям что это чекбокс  
// aria-checked - отражает текущее состояние  
// tabindex="0" - делает элемент доступным для фокуса

Но если у вас нет жесткого требования отказаться от `input`, безопаснее и проще скрывать нативный чекбокс, а не заменять его.

---

Чекбокс `input type="checkbox"` — фундаментальный элемент веб-форм, за которым скрывается больше нюансов, чем кажется сначала. Правильное использование атрибутов (`name`, `value`, `checked`, `required`, `disabled`), учет поведения при отправке формы, аккуратная работа с состояниями в JavaScript и внимание к доступности позволяют строить надежные и удобные интерфейсы.

Если структурировать подход — сначала продумывать логику данных (какие значения нужны серверу), затем разметку с `label` и `fieldset`, и только после этого переходить к визуальной стилизации — чекбоксы перестают быть источником ошибок и становятся предсказуемым инструментом в вашем интерфейсе.

## Частозадаваемые технические вопросы и ответы

### Как программно вызвать валидацию required чекбокса перед отправкой формы

Если нужен ручной запуск валидации, можно использовать метод `reportValidity` у формы.

```html
<form id="form-terms">
  <label>
    <input type="checkbox" name="terms" required>
    Принимаю условия
  </label>
  <button type="button" id="submit-btn">Отправить</button>
</form>

<script>
const form = document.getElementById('form-terms')
const submitBtn = document.getElementById('submit-btn')

submitBtn.addEventListener('click', () => {
  // Проверяем валидацию и показываем подсказки браузера
  if (form.reportValidity()) {
    form.submit() // Если все ок - отправляем форму
  }
})
</script>
```

### Почему checked через setAttribute не всегда обновляет состояние чекбокса

`setAttribute('checked', 'checked')` меняет только атрибут в HTML, но не всегда корректно обновляет свойство `checked`. Лучше работать через свойство.

```js
const cb = document.getElementById('cb')

// Правильно
cb.checked = true  // или false

// Если нужно удалить атрибут
cb.checked = false // а не только removeAttribute('checked')
```

Так вы гарантированно меняете реальное состояние, а не только текст разметки.

### Как узнать список всех отмеченных чекбоксов с одинаковым name в форме

Можно использовать `querySelectorAll` и отфильтровать по `checked`.

```js
const form = document.querySelector('form')

// Находим все отмеченные чекбоксы с name="topics"
const checkedTopics = form.querySelectorAll('input[name="topics"]:checked')

// Преобразуем NodeList в массив значений
const values = Array.from(checkedTopics).map(cb => cb.value)

console.log(values) // например ["frontend", "backend"]
```

### Как отключить чекбокс но при этом отправить его значение

Так как `disabled` не отправляет значение, можно визуально заблокировать чекбокс и использовать скрытое поле.

```html
<input type="hidden" name="fixed_option" value="1">

<label class="locked">
  <input type="checkbox" checked disabled>
  Эта опция всегда включена
</label>

<style>
.locked {
  opacity: 0.6;          /* Визуально показываем что поле зафиксировано */
  cursor: not-allowed;
}
</style>
```

Скрытое поле уйдет на сервер, а чекбокс останется только визуальным индикатором.

### Как отличить на сервере "чекбокс не был в форме" и "чекбокс есть но не отмечен"

Сам HTML этого не различает — в обоих случаях параметра не будет. Отличить можно только по структуре формы:

- Если вы точно знаете, что чекбокс всегда присутствует в форме, отсутствие параметра интерпретируете как "не отмечен".
- Если чекбокс может динамически добавляться или удаляться, используйте скрытое поле со значением по умолчанию:

```html
<input type="hidden" name="option" value="0">
<input type="checkbox" name="option" value="1">
```

Тогда сервер всегда получит либо `1` (отмечен), либо `0` (не отмечен).