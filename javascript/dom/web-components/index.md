---
metaTitle: "Web Components в JavaScript — Custom Elements, Shadow DOM"
metaDescription: "Web Components в JavaScript: Custom Elements, Shadow DOM, HTML Templates. Создайте переиспользуемые компоненты без фреймворков с примерами кода."
author: "Антон Ларичев"
title: "Web Components в JavaScript"
preview: "Создание переиспользуемых нативных компонентов браузера с помощью Custom Elements, Shadow DOM и HTML Templates без сторонних фреймворков."
---

## Что такое Web Components

Web Components — это набор стандартных браузерных API, позволяющих создавать собственные переиспользуемые HTML-элементы с инкапсулированной логикой и стилями. Технология не требует сторонних библиотек и работает нативно во всех современных браузерах.

Веб-компоненты строятся на трёх независимых спецификациях:

- **Custom Elements** — определение новых HTML-тегов
- **Shadow DOM** — инкапсуляция DOM и стилей внутри компонента
- **HTML Templates** — шаблоны, не отображаемые при загрузке страницы

Каждую из них можно использовать отдельно, но вместе они дают полноценную компонентную модель без зависимостей.

## Custom Elements

### Определение кастомного элемента

Для создания собственного элемента нужно расширить класс `HTMLElement` и зарегистрировать его через `customElements.define`.

```javascript
class UserCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="card">
        <h2>${this.getAttribute('name')}</h2>
        <p>${this.getAttribute('role')}</p>
      </div>
    `;
  }
}

customElements.define('user-card', UserCard);
```

Теперь тег `<user-card>` можно использовать в HTML:

```html
<user-card name="Антон Ларичев" role="Senior Developer"></user-card>
```

Имя кастомного элемента **обязательно должно содержать дефис** — это отличает его от встроенных HTML-тегов и предотвращает конфликты имён.

### Жизненный цикл Custom Elements

Browser вызывает специальные методы-коллбэки в разные моменты жизни компонента:

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    // Вызывается при создании элемента.
    // Здесь нельзя работать с атрибутами и дочерними узлами — DOM ещё не готов
  }

  connectedCallback() {
    // Вызывается при добавлении элемента в документ
    console.log('Компонент добавлен в DOM');
    this.render();
  }

  disconnectedCallback() {
    // Вызывается при удалении элемента из документа
    console.log('Компонент удалён из DOM');
    this.cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Вызывается при изменении отслеживаемых атрибутов
    console.log(`Атрибут ${name}: ${oldValue} → ${newValue}`);
    this.render();
  }

  static get observedAttributes() {
    // Список атрибутов для отслеживания в attributeChangedCallback
    return ['name', 'role', 'avatar'];
  }

  render() {}
  cleanup() {}
}
```

### Реактивные атрибуты

Отслеживание атрибутов позволяет перерисовывать компонент при их изменении:

```javascript
class CounterButton extends HTMLElement {
  static get observedAttributes() {
    return ['count'];
  }

  connectedCallback() {
    this.render();
    this.addEventListener('click', () => {
      const current = parseInt(this.getAttribute('count') || '0');
      this.setAttribute('count', current + 1);
    });
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const count = this.getAttribute('count') || '0';
    this.textContent = `Нажато: ${count}`;
  }
}

customElements.define('counter-button', CounterButton);
```

## Shadow DOM

### Инкапсуляция стилей и структуры

Shadow DOM создаёт изолированное DOM-дерево внутри элемента. Стили снаружи не проникают внутрь, и наоборот — стили компонента не влияют на страницу.

```javascript
class TooltipComponent extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
        }

        .tooltip {
          display: none;
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 100;
        }

        :host(:hover) .tooltip {
          display: block;
        }
      </style>

      <slot></slot>
      <div class="tooltip">${this.getAttribute('text')}</div>
    `;
  }
}

customElements.define('my-tooltip', TooltipComponent);
```

Использование:

```html
<my-tooltip text="Это подсказка">
  <button>Наведи на меня</button>
</my-tooltip>
```

### Режимы Shadow DOM

Параметр `mode` определяет доступность shadow root снаружи:

```javascript
// open — shadow root доступен через element.shadowRoot
const openShadow = this.attachShadow({ mode: 'open' });
console.log(element.shadowRoot); // ShadowRoot {...}

// closed — element.shadowRoot возвращает null
const closedShadow = this.attachShadow({ mode: 'closed' });
console.log(element.shadowRoot); // null
```

Режим `open` используется чаще — он позволяет тестировать компоненты и взаимодействовать с ними из внешнего кода.

### Слоты (Slots)

Слоты — это точки вставки внешнего контента внутрь Shadow DOM:

```javascript
class CardComponent extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        .card {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          max-width: 320px;
        }
        .card-header {
          background: #f5f5f5;
          padding: 12px 16px;
          font-weight: bold;
        }
        .card-body {
          padding: 16px;
        }
        .card-footer {
          padding: 12px 16px;
          border-top: 1px solid #ddd;
        }
      </style>

      <div class="card">
        <div class="card-header">
          <slot name="header">Заголовок по умолчанию</slot>
        </div>
        <div class="card-body">
          <slot></slot>
        </div>
        <div class="card-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('my-card', CardComponent);
```

Использование именованных слотов:

```html
<my-card>
  <span slot="header">Профиль пользователя</span>

  <p>Основное содержимое карточки идёт в дефолтный слот.</p>

  <div slot="footer">
    <button>Редактировать</button>
    <button>Удалить</button>
  </div>
</my-card>
```

## HTML Templates

### Тег template

Элемент `<template>` содержит разметку, которая не отображается и не выполняется при загрузке страницы. Его содержимое активируется только при клонировании через JavaScript.

```html
<template id="product-card-template">
  <style>
    .product {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      gap: 12px;
    }
    .product-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
    }
    .product-info h3 {
      margin: 0 0 4px;
    }
    .product-price {
      color: #2e7d32;
      font-weight: bold;
    }
  </style>

  <div class="product">
    <img class="product-image" src="" alt="">
    <div class="product-info">
      <h3 class="product-name"></h3>
      <p class="product-description"></p>
      <span class="product-price"></span>
    </div>
  </div>
</template>
```

```javascript
class ProductCard extends HTMLElement {
  connectedCallback() {
    const template = document.getElementById('product-card-template');
    const clone = template.content.cloneNode(true);

    clone.querySelector('.product-image').src = this.getAttribute('image');
    clone.querySelector('.product-image').alt = this.getAttribute('name');
    clone.querySelector('.product-name').textContent = this.getAttribute('name');
    clone.querySelector('.product-description').textContent = this.getAttribute('description');
    clone.querySelector('.product-price').textContent = this.getAttribute('price') + ' ₽';

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(clone);
  }
}

customElements.define('product-card', ProductCard);
```

## Практический пример: компонент Modal

Соберём полноценный компонент модального окна, объединяющий все три технологии:

```javascript
class ModalDialog extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'title'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this._bindEvents();
  }

  disconnectedCallback() {
    this._unbindEvents();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this.render();
      this._bindEvents();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
        }

        :host([open]) {
          display: block;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: #fff;
          border-radius: 8px;
          padding: 24px;
          min-width: 400px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          line-height: 1;
          padding: 0;
        }

        .close-btn:hover {
          color: #333;
        }
      </style>

      <div class="overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">${this.getAttribute('title') || ''}</h2>
            <button class="close-btn" aria-label="Закрыть">&times;</button>
          </div>
          <slot></slot>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    const overlay = this.shadowRoot.querySelector('.overlay');

    this._handleClose = () => this.close();
    this._handleOverlayClick = (e) => {
      if (e.target === overlay) this.close();
    };

    closeBtn?.addEventListener('click', this._handleClose);
    overlay?.addEventListener('click', this._handleOverlayClick);
  }

  _unbindEvents() {
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    const overlay = this.shadowRoot.querySelector('.overlay');
    closeBtn?.removeEventListener('click', this._handleClose);
    overlay?.removeEventListener('click', this._handleOverlayClick);
  }

  open() {
    this.setAttribute('open', '');
    this.dispatchEvent(new CustomEvent('modal-open', { bubbles: true }));
  }

  close() {
    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true }));
  }
}

customElements.define('modal-dialog', ModalDialog);
```

Применение компонента:

```html
<button id="open-btn">Открыть модальное окно</button>

<modal-dialog title="Подтверждение">
  <p>Вы уверены, что хотите удалить элемент?</p>
  <button id="confirm-btn">Удалить</button>
</modal-dialog>

<script>
  const modal = document.querySelector('modal-dialog');
  const openBtn = document.getElementById('open-btn');
  const confirmBtn = document.getElementById('confirm-btn');

  openBtn.addEventListener('click', () => modal.open());
  confirmBtn.addEventListener('click', () => {
    console.log('Удаление подтверждено');
    modal.close();
  });

  modal.addEventListener('modal-close', () => {
    console.log('Модальное окно закрыто');
  });
</script>
```

## Кастомные события

Компоненты общаются с внешним кодом через кастомные события. Флаг `composed: true` позволяет событию проникать через границу Shadow DOM:

```javascript
class SearchInput extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <input type="text" placeholder="Поиск...">
    `;

    const input = shadow.querySelector('input');
    let debounceTimer;

    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.dispatchEvent(new CustomEvent('search', {
          detail: { query: e.target.value },
          bubbles: true,
          composed: true
        }));
      }, 300);
    });
  }
}

customElements.define('search-input', SearchInput);
```

```javascript
document.querySelector('search-input').addEventListener('search', (e) => {
  console.log('Поисковый запрос:', e.detail.query);
});
```

## Стилизация компонентов снаружи

### CSS-переменные

CSS-переменные проникают сквозь Shadow DOM — это стандартный способ темизации:

```javascript
class ThemedButton extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        button {
          background: var(--btn-bg, #007bff);
          color: var(--btn-color, #fff);
          border: var(--btn-border, none);
          padding: var(--btn-padding, 8px 16px);
          border-radius: var(--btn-radius, 4px);
          cursor: pointer;
          font-size: 14px;
        }

        button:hover {
          opacity: 0.85;
        }
      </style>
      <button><slot></slot></button>
    `;
  }
}

customElements.define('themed-button', ThemedButton);
```

Темизация через CSS:

```css
.danger-zone themed-button {
  --btn-bg: #dc3545;
  --btn-radius: 0;
}

.success-zone themed-button {
  --btn-bg: #28a745;
  --btn-padding: 12px 24px;
}
```

### Псевдокласс :part()

Атрибут `part` делает элементы внутри Shadow DOM доступными для внешней стилизации:

```javascript
class DataTable extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <table>
        <thead part="header"><slot name="header"></slot></thead>
        <tbody part="body"><slot></slot></tbody>
      </table>
    `;
  }
}

customElements.define('data-table', DataTable);
```

```css
data-table::part(header) {
  background: #f8f9fa;
  font-weight: bold;
}

data-table::part(body) {
  background: #fff;
}
```

## Расширение встроенных элементов

Custom Elements поддерживают расширение встроенных HTML-элементов через `is` атрибут:

```javascript
class FancyButton extends HTMLButtonElement {
  connectedCallback() {
    this.classList.add('fancy');
    this.addEventListener('click', () => {
      this.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.95)' },
        { transform: 'scale(1)' }
      ], { duration: 150 });
    });
  }
}

customElements.define('fancy-button', FancyButton, { extends: 'button' });
```

```html
<button is="fancy-button">Нажми меня</button>
```

Обратите внимание: Safari не поддерживает расширение встроенных элементов без полифила.

## Поддержка браузеров и полифилы

Custom Elements v1 и Shadow DOM v1 поддерживаются во всех современных браузерах. Для старых браузеров используют полифил [@webcomponents/webcomponentsjs](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs).

Проверка поддержки перед регистрацией:

```javascript
if ('customElements' in window) {
  customElements.define('my-component', MyComponent);
} else {
  console.warn('Custom Elements не поддерживаются в этом браузере');
}
```

Ожидание готовности всех компонентов:

```javascript
customElements.whenDefined('my-component').then(() => {
  console.log('Компонент my-component зарегистрирован');
});
```

## Итог

Web Components решают задачу создания переиспользуемых элементов интерфейса без привязки к конкретному фреймворку. Custom Elements задают поведение, Shadow DOM обеспечивает изоляцию, HTML Templates ускоряют создание экземпляров. Компоненты, написанные по этому стандарту, работают в любом окружении: в чистом HTML, в React, Vue или Angular.

Для углублённого изучения JavaScript и DOM-API, включая работу с браузерными стандартами, смотрите курс на PurpleSchool:
[JavaScript с нуля до уровня Middle](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=web-components)
