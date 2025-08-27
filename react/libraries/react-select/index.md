---
metaTitle: Работа с формами и селектами в React
metaDescription: Узнайте как в React грамотно реализовать обработку форм и элементов select - с примерами кода и объяснениями controlled и uncontrolled компонентов
author: Олег Марков
title: Работа с формами и селектами в React
preview: Разберитесь как создавать формы и селекты в React, управлять вводом, реагировать на изменения и интегрировать валидацию с помощью подробных инструкций и примеров
---

## Введение

Работа с формами — одна из самых частых задач при разработке приложений на React. Почти любая современная веб-страница включает элементы ввода: текстовые поля, кнопки, селекты (выпадающие списки), переключатели и чекбоксы. Умение правильно работать с формами и элементами select помогает создавать интерактивные, отзывчивые, валидируемые и удобные интерфейсы.

В этой статье вы узнаете:
- Чем отличаются контролируемые и неконтролируемые компоненты 
- Как реализовать форму, отслеживать ввод и отправлять данные
- Как работать с элементом select в React, делать множественный выбор
- Как добавить простую валидацию
- На что обратить внимание при работе с формами

## Контролируемые компоненты в React

### Основной подход: контролируемый компонент

В React лучшей практикой считается использование контролируемых компонентов. Это значит, что значение input, textarea или select не хранится напрямую в DOM, а полностью контролируется через React state.

Рассмотрим самый простой пример text input в виде контролируемого компонента.

```jsx
import React, { useState } from 'react';

function NameForm() {
  const [name, setName] = useState(""); // Инициализация состояния

  function handleChange(event) {
    setName(event.target.value); // Обновляем состояние на каждый ввод символа
  }

  function handleSubmit(event) {
    event.preventDefault(); // Предотвращаем стандартную отправку формы
    alert(`Введено имя: ${name}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Имя:
        <input type="text" value={name} onChange={handleChange} />
      </label>
      <button type="submit">Отправить</button>
    </form>
  );
}
```

- Состояние value управляется через useState.
- Каждый ввод приводит к вызову handleChange и обновления состояния.
- Весь ввод находится "под контролем React".

### Преимущества подхода

- Всегда знаете текущее значение поля.
- Легко валидировать ввод.
- Можно динамически изменять значения, сбрасывать форму, централизовано реагировать на ошибки.

### Особенности onChange в React

Обратите внимание: обработчик onChange вызывается каждый раз при изменении поля, даже когда пользователь стирает символы.

## Неконтролируемые компоненты

Неконтролируемый компонент использует ref для обращения к значению DOM-элемента напрямую, а не через state.

```jsx
import React, { useRef } from 'react';

function UncontrolledForm() {
  const inputRef = useRef(null); // Получаем доступ к DOM-элементу через ref

  function handleSubmit(event) {
    event.preventDefault();
    alert('Введено имя: ' + inputRef.current.value); // Сейчас берем значение прямо из DOM
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Имя:
        <input type="text" ref={inputRef} />
      </label>
      <button type="submit">Отправить</button>
    </form>
  );
}
```

Когда использовать неконтролируемые компоненты?
- Форма очень большая и не требуется каждый ввод хранить в state.
- Нужно быстро получить финальное значение поля (например, для передачи в стороннюю библиотеку).

Тем не менее, стандартно предпочтительнее контролировать все значения из самого React-компонента.

## Работа с несколькими полями формы

В реальных формах чаще всего несколько полей. Для этих целей удобно использовать объект состояния.

```jsx
import React, { useState } from 'react';

function LoginForm() {
  const [form, setForm] = useState({username: "", password: ""});

  function handleChange(e) {
    // Изменяем только конкретное поле, остальные не трогаем
    setForm({...form, [e.target.name]: e.target.value});
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert(`Пользователь: ${form.username}, Пароль: ${form.password}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" value={form.username} onChange={handleChange} placeholder="Имя пользователя" />
      <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Пароль" />
      <button>Войти</button>
    </form>
  );
}
```
Здесь мы используем имя поля как ключ объекта, чтобы обновлять только изменяемое поле.

Работа с формами и селектами является важной частью разработки интерактивных React-приложений. Это включает в себя обработку пользовательского ввода, валидацию данных и управление состоянием формы. Если вы хотите научиться работать с формами и селектами в React и создавать удобные пользовательские интерфейсы — приходите на наш большой курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=rabota-s-formami-i-selektami-v-react). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Селекты (Select) и выпадающие списки

### Контролируемый select

В React элемент `<select>` также может быть контролируемым. Его выбранное значение управляется через state компонента.

```jsx
import React, { useState } from 'react';

function FlavorForm() {
  const [flavor, setFlavor] = useState("coconut"); // Значение по умолчанию

  function handleChange(e) {
    setFlavor(e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert('Ваш любимый вкус: ' + flavor);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Выберите вкус:
        <select value={flavor} onChange={handleChange}>
          <option value="grapefruit">Грейпфрут</option>
          <option value="lime">Лайм</option>
          <option value="coconut">Кокос</option>
          <option value="mango">Манго</option>
        </select>
      </label>
      <button type="submit">Выбрать</button>
    </form>
  );
}
```
- Проп value определяет выбранный элемент, функция handleChange — обновление состояния.

### Множественный выбор (multiple)

Можно разрешить множественный выбор в select. Для этого надо добавить атрибут multiple и хранить значения в массиве.

```jsx
import React, { useState } from 'react';

function MultiSelectForm() {
  const [selected, setSelected] = useState([]);

  function handleChange(e) {
    // Получаем массив выбранных опций
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setSelected(options);
  }

  return (
    <form>
      <label>
        Выберите фрукты:
        <select multiple={true} value={selected} onChange={handleChange}>
          <option value="apple">Яблоко</option>
          <option value="pear">Груша</option>
          <option value="plum">Слива</option>
        </select>
      </label>
      <div>
        Выбрано: {selected.join(", ")}
      </div>
    </form>
  );
}
```
- Обратите внимание, для получения массива выбранных значений используйте `e.target.selectedOptions`.

## Чекбоксы и радио-кнопки

Для чекбоксов и radio принцип аналогичен — управление идет через state.

### Пример чекбокса

```jsx
const [checked, setChecked] = useState(false);

// ...
<input type="checkbox" checked={checked} onChange={() => setChecked(!checked)} />
```

Если множество чекбоксов, удобно использовать объект:

```jsx
const [fruits, setFruits] = useState({apple: false, pear: false});

function handleChange(e) {
  setFruits({...fruits, [e.target.name]: e.target.checked});
}
```

## Валидация формы

Валидация может быть простой (есть ли значение, правильный ли email) или более глубокой (с помощью сторонних библиотек).

### Простой пример валидации

```jsx
function SimpleValidationForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes('@')) {
      setError("Неверный email");
    } else {
      setError(null);
      alert("Форма отправлена!");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email" 
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Введите email"
      />
      {error && <div style={{color: "red"}}>{error}</div>}
      <button>Отправить</button>
    </form>
  );
}
```
- Здесь мы просто проверяем наличие символа '@' для email.

## Отправка формы и обработка данных

Когда форма отправляется (`onSubmit`), важно предотвращать стандартное поведение браузера с помощью `event.preventDefault()`. Затем вы уже сами решаете, что делать с данными: отправить их на сервер, проверить ошибки, показать результат и т.д.

## Как сбросить значения формы

Чтобы сбросить поля после отправки, просто установите state с начальными значениями.

```jsx
const [form, setForm] = useState({a: '', b: ''});

// После успешной отправки:
setForm({a: '', b: ''});
```

## Советы и лучшие практики

- Старайтесь делать из input/textarea/select контролируемые компоненты, если нужно управлять поведением.
- Для больших форм рассмотрите использование библиотек, например Formik или React Hook Form.
- Не забывайте добавлять label'ы для доступности.
- Выносите повторяющиеся поля в отдельные компоненты для переиспользования.

## Заключение

Работать с формами в React удобно благодаря контролируемому подходу: вы всегда знаете состояние каждого поля, легко реализуете валидацию, управляете отправкой и обработкой данных. Элемент select органично вписывается в эту парадигму и полностью поддерживает динамический рендеринг и множественный выбор. Лучше использовать state и обработчики onChange даже для простых форм — это даст максимум гибкости и контроля над интерфейсом.

Работа с формами - важная часть разработки. Для создания сложных приложений требуется умение управлять состоянием и роутингом. Рассмотрите курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=rabota-s-formami-i-selektami-v-react) для получения необходимых навыков. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в основы React уже сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

#### Как задать placeholder для select в React?

В отличие от обычных input, у select нет атрибута placeholder. Вместо этого добавьте опцию без значения:

```jsx
<select value={value} onChange={...}>
  <option value="" disabled>Выберите вариант</option>
  <option value="one">Один</option>
</select>
```
Задайте value равным пустой строке, чтобы placeholder был виден изначально.

#### Как динамически создать список опций в select?

Сформируйте массив и используйте map:

```jsx
const options = ["apple", "banana", "plum"];
<select>{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
```

#### Как сделать очистку всего, включая select и checkbox?

Для полного сброса используйте начальные значения для всех полей:

```jsx
setForm({name: '', fruit: '', checked: false});
```
Значения select/checkbox ставьте в их дефолтное состояние в state.

#### Как интегрировать React форму с обычным HTML-форматированием?

Вы можете комбинировать обычную разметку (form, label, fieldset) с React-компонентами. Для обработки событий используйте onSubmit и onChange на компонентах.

#### Почему onChange не работает с input type="file"?

Для input type="file" невозможно сделать контролируемый компонент через value, но возможно через ref и onChange:

```jsx
<input type="file" ref={ref} onChange={handleFile} />
```
Файл можно получить в e.target.files.

---
