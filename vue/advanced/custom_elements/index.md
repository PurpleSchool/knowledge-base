---
metaTitle: Кастомные элементы в вебе - Custom Elements
metaDescription: Узнайте как создавать собственные HTML теги с помощью технологии Custom Elements и интегрировать их с Shadow DOM и JavaScript
author: Олег Марков
title: Кастомные элементы - Custom Elements в современном JavaScript
preview: Разберите на практике как работают Custom Elements - какие есть типы кастомных элементов как их регистрировать и связывать с логикой интерфейса
---

## Введение

Кастомные элементы (Custom Elements) — это часть стандарта Web Components, которая позволяет вам определять собственные HTML‑теги с предсказуемым поведением и повторно использовать их в разных проектах.

Идея простая: вы описываете новый элемент один раз, а потом можете использовать его как обычный тег в любом месте страницы или даже в других приложениях. Например, вместо очередного набора `div` с классами вы пишете:

```html
<user-card name="Alice" status="online"></user-card>
```

и получаете готовый компонент с разметкой, стилями и логикой внутри.

Здесь мы разберём, как это работает:

- какие есть виды кастомных элементов;
- как их регистрировать через `customElements.define`;
- какие есть жизненные циклы (колбэки) и когда они вызываются;
- как связать кастомный элемент с Shadow DOM;
- как передавать данные через атрибуты и свойства;
- как проектировать компоненты так, чтобы ими было удобно пользоваться и поддерживать.

Давайте начнём с базовых понятий и постепенно перейдём к более практичным примерам.

---

## Что такое кастомные элементы и как они вписываются в Web Components

### Связь с Web Components

Кастомные элементы — это один из трёх основных блоков Web Components:

1. Custom Elements — определение собственных тегов и их поведения на JavaScript.
2. Shadow DOM — инкапсуляция разметки и стилей внутри компонента.
3. HTML Templates — шаблоны разметки, которые можно копировать и наполнять данными.

Смотрите, важный момент: для использования кастомных элементов не обязательно подключать Shadow DOM или шаблоны, но чаще всего они используются вместе. Это помогает сделать компонент независимым и менее конфликтным с остальной страницей.

### Требования к имени кастомного элемента

По стандарту любой кастомный элемент:

- должен иметь дефис в имени, например `user-card`, `app-button`, `x-modal`;
- не может использовать уже зарезервированные браузером теги;
- регистрируется только один раз в пределах документа (попытка повторной регистрации вызовет ошибку).

Дефис — это способ браузера отличить кастомный элемент от встроенного, даже если их список будет расширяться в будущем.

---

## Базовая регистрация кастомного элемента

### Класс элемента и `customElements.define`

Любой кастомный элемент — это класс, который наследуется от `HTMLElement` (или от другого HTML‑класса при использовании встроенных элементов).

Давайте разберём минимальный пример:

```js
// Определяем класс кастомного элемента
class HelloWorld extends HTMLElement {
  constructor() {
    super(); // Вызываем конструктор родительского класса HTMLElement

    // Здесь пока просто добавим текстовый узел
    this.textContent = 'Привет из кастомного элемента';
  }
}

// Регистрируем новый тег <hello-world> в глобальном реестре
customElements.define('hello-world', HelloWorld);
```

Теперь этот элемент можно использовать в HTML:

```html
<hello-world></hello-world>
```

Как видите, базовый сценарий довольно простой: класс + `customElements.define`.

### Устройство `customElements`

Объект `customElements` — это реестр всех зарегистрированных в документе кастомных элементов. Он предоставляет несколько методов:

- `define(name, constructor, options?)` — регистрация элемента;
- `get(name)` — получить конструктор по имени;
- `whenDefined(name)` — вернуть промис, который зарезолвится, когда элемент будет определён.

Эти методы часто используются не только для регистрации, но и для динамических сценариев, например ленивой загрузки компонентов.

---

## Жизненный цикл кастомного элемента

### Основные колбэки

У кастомных элементов есть несколько специальных методов, которые браузер вызывает в определённые моменты жизни элемента:

- `constructor` — когда элемент создаётся (но ещё не обязательно вставлен в DOM);
- `connectedCallback` — когда элемент добавлен в документ (вставлен в DOM);
- `disconnectedCallback` — когда элемент удалён из документа;
- `attributeChangedCallback(name, oldValue, newValue)` — когда меняется наблюдаемый атрибут;
- `adoptedCallback` — когда элемент перенесён в другой документ (редко используемый кейс, например в `iframe`).

Давайте посмотрим пример, где используются основные из них.

```js
class LoggerElement extends HTMLElement {
  constructor() {
    super();
    // Здесь можно подготовить внутреннее состояние
    console.log('constructor: элемент создан');
  }

  connectedCallback() {
    // Вызывается, когда элемент добавлен в DOM
    console.log('connectedCallback: элемент добавлен в документ');
    this.textContent = 'Элемент сейчас в DOM';
  }

  disconnectedCallback() {
    // Вызывается, когда элемент удалён из DOM
    console.log('disconnectedCallback: элемент удален из документа');
  }

  static get observedAttributes() {
    // Здесь перечисляем имена атрибутов, за которыми хотим следить
    return ['status'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Вызывается каждый раз, когда меняется один из observedAttributes
    console.log(
      `attributeChangedCallback: атрибут ${name} изменился с ${oldValue} на ${newValue}`
    );

    if (name === 'status') {
      // Здесь можно обновить текст или стили на основе нового значения
      this.textContent = `Текущий статус - ${newValue}`;
    }
  }
}

customElements.define('logger-element', LoggerElement);
```

Теперь вы увидите, как это выглядит в HTML:

```html
<logger-element status="active"></logger-element>

<script>
  // Меняем атрибут через 2 секунды
  setTimeout(() => {
    const el = document.querySelector('logger-element');
    // Здесь обновляем атрибут, что вызовет attributeChangedCallback
    el.setAttribute('status', 'offline');
  }, 2000);
</script>
```

Обратите внимание: чтобы `attributeChangedCallback` работал, нужно объявить `static get observedAttributes()`. Без этого колбэк не будет вызываться.

---

## Атрибуты, свойства и связь с DOM

### Разница между атрибутами и свойствами

У любого DOM‑элемента есть:

- атрибуты — то, что вы видите в HTML (`<user-card name="Alice">`);
- свойства объекта — то, что вы видите в JavaScript (`element.name`).

Встроенные элементы обычно синхронизируют некоторые атрибуты и свойства между собой. Например:

```js
// Для <input>
input.value = 'Привет';     // Обновит атрибут value в DOM
input.setAttribute('value', 'Пока'); // Влияет на свойство при следующих рендерах
```

С кастомными элементами вы сами решаете, как связать атрибуты и свойства.

### Передача данных через атрибуты

Давайте создадим компонент, который принимает имя пользователя через атрибут `name` и показывает его:

```js
class UserCard extends HTMLElement {
  constructor() {
    super();
    // Создаем корневой элемент для контента
    const container = document.createElement('div');
    container.textContent = 'Загрузка...';
    // Добавляем в сам элемент
    this.appendChild(container);
    // Сохраняем ссылку для дальнейших обновлений
    this._container = container;
  }

  static get observedAttributes() {
    // Следим за атрибутом name
    return ['name'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Если изменился атрибут name - обновляем отображение
    if (name === 'name') {
      this._render();
    }
  }

  connectedCallback() {
    // Вызываем рендер при первом добавлении в DOM
    this._render();
  }

  _render() {
    // Берем значение атрибута name
    const name = this.getAttribute('name') || 'Гость';
    this._container.textContent = `Пользователь - ${name}`;
  }
}

customElements.define('user-card', UserCard);
```

Использование в HTML:

```html
<user-card name="Alice"></user-card>
<user-card></user-card> <!-- Выведет "Гость" -->
```

Теперь давайте посмотрим, как можно связать это с JavaScript‑свойством.

### Синхронизация атрибутов и свойств

Часто удобно иметь свойство `name`, которое под капотом обновляет атрибут:

```js
class UserCard2 extends HTMLElement {
  constructor() {
    super();
    this._container = document.createElement('div');
    this.appendChild(this._container);
  }

  static get observedAttributes() {
    return ['name'];
  }

  // Геттер свойства name
  get name() {
    // Возвращаем значение атрибута
    return this.getAttribute('name');
  }

  // Сеттер свойства name
  set name(value) {
    // Обновляем атрибут - это вызовет attributeChangedCallback
    if (value === null || value === undefined) {
      this.removeAttribute('name');
    } else {
      this.setAttribute('name', String(value));
    }
  }

  attributeChangedCallback(name) {
    if (name === 'name') {
      this._render();
    }
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    const name = this.name || 'Гость'; // Берем значение свойства
    this._container.textContent = `Пользователь - ${name}`;
  }
}

customElements.define('user-card2', UserCard2);
```

Теперь можно работать с компонентом и так, и так:

```js
const card = document.querySelector('user-card2');

// Меняем через атрибут
card.setAttribute('name', 'Alice');

// Меняем через свойство
card.name = 'Bob';
```

Такой подход делает компонент предсказуемым и удобным для других разработчиков.

---

## Инкапсуляция через Shadow DOM

### Зачем нужен Shadow DOM

Shadow DOM позволяет создать "теневой" корень внутри элемента, где:

- находятся его собственные узлы DOM;
- действуют свои стили;
- внешний CSS не ломает внутреннюю верстку;
- структуру тени не видно в обычном дереве DOM (в инспекторе DevTools есть отдельный блок).

Это особенно полезно для компонентов, которые должны вести себя одинаково в любом окружении.

### Создание Shadow DOM

Теперь вы увидите, как это выглядит в коде:

```js
class FancyButton extends HTMLElement {
  constructor() {
    super();

    // Создаем shadow root в "закрытом" режиме
    const shadow = this.attachShadow({ mode: 'open' });
    // Если используете 'closed' - к shadow нельзя будет обратиться извне через element.shadowRoot

    // Создаем стили
    const style = document.createElement('style');
    style.textContent = `
      button {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        background-color: #1976d2;
        color: white;
        font-size: 14px;
      }

      button:hover {
        background-color: #1565c0;
      }
    `;

    // Создаем кнопку
    const button = document.createElement('button');
    button.textContent = this.getAttribute('label') || 'Кнопка';

    // Обрабатываем клик
    button.addEventListener('click', () => {
      // Генерируем собственное событие для внешнего мира
      this.dispatchEvent(new CustomEvent('fancy-click', {
        detail: { timestamp: Date.now() },
        bubbles: true,  // Событие поднимается вверх по DOM
        composed: true  // Событие выходит за пределы shadow root
      }));
    });

    // Добавляем стили и кнопку в shadow root
    shadow.appendChild(style);
    shadow.appendChild(button);

    // Сохраняем ссылку, чтобы обновлять текст позже
    this._button = button;
  }

  static get observedAttributes() {
    return ['label'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'label' && this._button) {
      // Обновляем текст кнопки при изменении атрибута label
      this._button.textContent = newValue;
    }
  }
}

customElements.define('fancy-button', FancyButton);
```

Использование в HTML:

```html
<fancy-button label="Отправить"></fancy-button>

<script>
  const btn = document.querySelector('fancy-button');

  // Слушаем кастомное событие fancy-click
  btn.addEventListener('fancy-click', (event) => {
    // Здесь обрабатываем клик по кастомной кнопке
    console.log('Клик по fancy-button', event.detail);
  });
</script>
```

Обратите внимание, как этот фрагмент кода решает задачу:

- стили и разметка спрятаны внутри Shadow DOM;
- внешний CSS не должен повлиять на кнопку;
- внешний код работает через события и атрибуты, не зная о деталях реализации.

---

## Слоты и передача контента в компонент

### Основная идея слотов

Иногда вам нужно, чтобы компонент отображал не только свою разметку, но и контент, который передаётся из HTML. Для этого используются слоты (`<slot>`).

Смотрите, я покажу вам, как это работает.

```js
class CardBox extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .card {
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        background: #fff;
        font-family: sans-serif;
        max-width: 300px;
      }

      .title {
        font-weight: 600;
        margin-bottom: 8px;
      }

      .content {
        font-size: 14px;
        color: #444;
      }
    `;

    const wrapper = document.createElement('div');
    wrapper.className = 'card';

    // Заголовок с именованным слотом title
    const title = document.createElement('div');
    title.className = 'title';
    title.innerHTML = '<slot name="title">Заголовок по умолчанию</slot>';

    // Основной контент со слотом по умолчанию
    const content = document.createElement('div');
    content.className = 'content';
    content.innerHTML = '<slot>Содержимое по умолчанию</slot>';

    wrapper.appendChild(title);
    wrapper.appendChild(content);

    shadow.appendChild(style);
    shadow.appendChild(wrapper);
  }
}

customElements.define('card-box', CardBox);
```

Теперь давайте разберемся на примере использования:

```html
<card-box>
  <!-- Передаем текст в слот по умолчанию -->
  Здесь основной текст карточки

  <!-- Передаем заголовок в именованный слот title -->
  <span slot="title">Заголовок карточки</span>
</card-box>
```

Браузер поместит узел `span` в слот с именем `title`, а текст "Здесь основной текст…" — в слот по умолчанию.

Если вы ничего не передадите, отобразятся значения по умолчанию, заданные внутри `<slot>`.

---

## Встроенные (автоматически расширяемые) элементы

### Что такое customized built-in elements

Иногда полезно не создавать полностью новый тег, а расширить уже существующий, например `<button>` или `<a>`.

Такие элементы называются "customized built-in elements". Они:

- наследуются от конкретного HTML‑класса, например `HTMLButtonElement`;
- регистрируются с опцией `extends`;
- используются через атрибут `is` в HTML.

Покажу вам, как это реализовано на практике.

```js
class DangerButton extends HTMLButtonElement {
  constructor() {
    super();
    // Здесь настраиваем внешний вид и поведение
    this.style.backgroundColor = '#d32f2f';
    this.style.color = '#fff';
    this.style.border = 'none';
    this.style.padding = '6px 12px';

    this.addEventListener('click', () => {
      // При клике выводим подтверждение
      const ok = window.confirm('Вы уверены что хотите выполнить опасное действие');
      if (!ok) {
        // Если отменили, предотвращаем действие
        console.log('Действие отменено пользователем');
      }
    });
  }
}

// Регистрируем кастомизированный встроенный элемент
customElements.define('danger-button', DangerButton, { extends: 'button' });
```

Использование в HTML:

```html
<button is="danger-button">Удалить все</button>
```

Важно: поддержка customized built-in elements в некоторых браузерах до сих пор ограничена, особенно без флагов. Часто разработчики избегают этого механизма ради кроссбраузерности и используют автономные элементы (`<my-button>`) с внутренней разметкой.

---

## Стилизация кастомных элементов

### Внешние стили и кастомные элементы без Shadow DOM

Если вы не используете Shadow DOM, кастомный элемент ведёт себя как обычный тег:

```html
<user-card name="Alice"></user-card>

<style>
  user-card {
    display: block;
    border: 1px solid #ddd;
    padding: 8px;
  }
</style>
```

Браузер просто применит задание CSS к этому тегу, как к любому другому.

### Стили внутри Shadow DOM

Когда вы используете Shadow DOM, обычные стили снаружи не влияют на внутреннюю разметку. Вся стилизация делается внутри shadow root (как мы уже видели в примерах со `style`).

Но иногда нужно дать возможность пользователю компонента настраивать внешний вид. Для этого есть несколько механизмов:

- CSS Custom Properties (переменные) — проходят через границу Shadow DOM;
- псевдоэлементы и `::part`, `::theme` (там, где поддерживается).

### Использование CSS‑переменных

Смотрите, я размещаю пример, чтобы вам было проще понять:

```js
class ThemeButton extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      button {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        /* Используем CSS‑переменные с дефолтными значениями */
        background-color: var(--theme-button-bg, #6200ee);
        color: var(--theme-button-color, #ffffff);
      }
    `;

    const btn = document.createElement('button');
    btn.textContent = this.getAttribute('label') || 'Кнопка';

    shadow.appendChild(style);
    shadow.appendChild(btn);
  }
}

customElements.define('theme-button', ThemeButton);
```

Теперь вы увидите, как можно влиять на цвета снаружи:

```html
<!-- Используем стили на уровне страницы -->
<style>
  theme-button {
    /* Задаем значения CSS‑переменных для всех theme-button */
    --theme-button-bg: #009688;
    --theme-button-color: #ffffff;
  }

  theme-button.primary {
    --theme-button-bg: #1976d2;
  }

  theme-button.danger {
    --theme-button-bg: #d32f2f;
  }
</style>

<theme-button label="Ок" class="primary"></theme-button>
<theme-button label="Удалить" class="danger"></theme-button>
```

CSS‑переменные — основной способ "пробросить" тему внутрь Shadow DOM без нарушения инкапсуляции.

---

## Работа с событиями

### Отправка собственных событий

Кастомные элементы особенно полезны, когда вам нужно спрятать сложную логику, но при этом "уведомлять" внешний код о важных действиях.

Для этого обычно используют `CustomEvent`.

```js
class CounterElement extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    let value = Number(this.getAttribute('value')) || 0;

    const style = document.createElement('style');
    style.textContent = `
      .counter {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        font-family: sans-serif;
      }
      button {
        padding: 2px 8px;
      }
      span {
        min-width: 20px;
        text-align: center;
      }
    `;

    const wrapper = document.createElement('div');
    wrapper.className = 'counter';

    const decBtn = document.createElement('button');
    decBtn.textContent = '-';

    const span = document.createElement('span');
    span.textContent = String(value);

    const incBtn = document.createElement('button');
    incBtn.textContent = '+';

    // Обработка клика на минус
    decBtn.addEventListener('click', () => {
      value -= 1;
      span.textContent = String(value);
      this._emitChange(value); // Уведомляем внешний код
    });

    // Обработка клика на плюс
    incBtn.addEventListener('click', () => {
      value += 1;
      span.textContent = String(value);
      this._emitChange(value);
    });

    wrapper.appendChild(decBtn);
    wrapper.appendChild(span);
    wrapper.appendChild(incBtn);

    shadow.appendChild(style);
    shadow.appendChild(wrapper);

    this._value = value;
    this._span = span;
  }

  _emitChange(value) {
    // Отправляем событие change с текущим значением
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value },
        bubbles: true,  // Событие поднимается выше
        composed: true, // Проходит через Shadow DOM
      })
    );
  }

  get value() {
    return this._value;
  }

  set value(v) {
    const num = Number(v);
    if (!Number.isNaN(num)) {
      this._value = num;
      if (this._span) {
        this._span.textContent = String(num);
      }
      this._emitChange(num);
    }
  }
}

customElements.define('x-counter', CounterElement);
```

Использование:

```html
<x-counter value="5"></x-counter>

<script>
  const counter = document.querySelector('x-counter');

  // Подписываемся на событие change
  counter.addEventListener('change', (event) => {
    // Выводим новое значение счетчика
    console.log('Новое значение счетчика', event.detail.value);
  });

  // Программно меняем значение
  setTimeout(() => {
    counter.value = 10;
  }, 2000);
</script>
```

Здесь компонент инкапсулирует всю логику счётчика, а внешний код просто подписывается на одно событие и читает `detail`.

---

## Архитектурные советы по проектированию кастомных элементов

### Разделяйте внешний контракт и внутреннюю реализацию

Старайтесь чётко определить, что является "публичным" интерфейсом вашего компонента:

- какие атрибуты он принимает;
- какие свойства и методы доступны снаружи;
- какие события он генерирует.

Дальше можно менять внутреннюю реализацию, не трогая этот контракт.

Например, для модального окна:

- атрибуты: `open` (открыто/закрыто), `title`;
- методы: `open()`, `close()`, `toggle()`;
- события: `open`, `close`.

### Не завязывайтесь жёстко на внешний CSS

Если компонент без Shadow DOM, легко "сломать" его стилями со страницы. Если вам важна надёжная предсказуемость, используйте Shadow DOM и CSS‑переменные.

### Делайте поведение явным

Если элемент генерирует события — задокументируйте их названия и структуру `detail`. Если элемент имеет методы — слегка прокомментируйте их назначение в коде.

---

## Кроссбраузерность и поддержка

### Поддерживаемые браузеры

На момент актуальных стандартов:

- современные версии Chrome, Edge, Safari, Firefox поддерживают Custom Elements v1;
- поддержка customized built-in elements (`extends`) в некоторых браузерах всё ещё ограничена;
- для старых браузеров (например, старые мобильные или IE) нужен полифилл.

### Полифиллы

Вы можете использовать официальные полифиллы от сообщества Web Components (например, пакет `@webcomponents/custom-elements`). Они позволяют запустить кастомные элементы в браузерах, где поддержки нет или она неполная.

Подключение обычно делается в `<head>` условно, если полифилл нужен.

---

## Заключение

Кастомные элементы — это мощный способ создавать свои собственные HTML‑теги, которые:

- инкапсулируют разметку, логику и стили;
- могут быть повторно использованы в разных проектах;
- хорошо сочетаются с Shadow DOM и CSS‑переменными;
- работают без дополнительных фреймворков и зависят только от стандартов браузера.

Вы увидели, как:

- зарегистрировать элемент с помощью `customElements.define`;
- использовать колбэки жизненного цикла для инициализации и очистки;
- связывать атрибуты и свойства;
- передавать контент через слоты;
- генерировать собственные события для внешнего кода.

На практике кастомные элементы позволяют постепенно "выносить" повторяющиеся куски интерфейса в отдельные, самодостаточные компоненты и использовать их как строительные блоки.

---

## Частозадаваемые технические вопросы по теме и ответы

### 1. Как отложить регистрацию кастомного элемента до загрузки определённого модуля

Можно сначала динамически импортировать модуль, а затем вызывать `customElements.define`:

```js
// Загружаем модуль только при необходимости
import('./components/user-card.js').then(({ UserCard }) => {
  // Регистрируем элемент после загрузки кода
  if (!customElements.get('user-card')) {
    customElements.define('user-card', UserCard);
  }
});
```

Здесь важно проверять, не был ли элемент уже зарегистрирован.

---

### 2. Как дождаться готовности элемента, если он регистрируется позже по времени

Используйте `customElements.whenDefined`:

```js
customElements.whenDefined('user-card').then(() => {
  const card = document.querySelector('user-card');
  // Здесь уже можно безопасно вызывать методы компонента
  card.refresh && card.refresh();
});
```

Этот промис зарезолвится, как только элемент будет зарегистрирован.

---

### 3. Как типизировать кастомные элементы в TypeScript

Нужно расширить глобальный интерфейс `HTMLElementTagNameMap`:

```ts
declare global {
  interface HTMLElementTagNameMap {
    'user-card': UserCard; // Ваш класс
  }
}
```

После этого `document.querySelector('user-card')` будет иметь корректный тип `UserCard | null`.

---

### 4. Как правильно тестировать кастомные элементы

Обычно используют тестовый раннер (Jest, Vitest, Karma) в связке с JSDOM или реальным браузером:

1. Импортируете модуль с `customElements.define`.
2. Создаёте элемент через `document.createElement('my-element')`.
3. Добавляете его в `document.body`, чтобы сработал `connectedCallback`.
4. Проверяете DOM, атрибуты и реакции на события.

Важно вызывать `await Promise.resolve()` или `await new Promise(requestAnimationFrame)` между шагами, если логика основана на микрозадачах.

---

### 5. Как передать сложный объект в кастомный элемент без сериализации в атрибут

Лучше использовать JavaScript‑свойства:

```js
const user = { id: 1, name: 'Alice' };
const card = document.createElement('user-card');
card.user = user; // Внутри компонента реализуйте сеттер user
document.body.appendChild(card);
```

А внутри класса:

```js
set user(value) {
  this._user = value;
  this._render();
}
```

Так вы избегаете сериализации в строку и сохраняете типы данных.