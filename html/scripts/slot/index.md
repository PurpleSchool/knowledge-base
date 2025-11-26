---
metaTitle: Слоты компонентов в HTML slot
metaDescription: Подробное руководство по использованию слотов в HTML Web Components - именованные и неименованные слоты, fallback содержимое, распределение узлов и практические примеры
author: Олег Марков
title: Слоты компонентов в HTML slot - полное руководство
preview: Узнайте как работает элемент slot в HTML Web Components - создавайте гибкие компоненты с настраиваемыми областями контента и управляйте разметкой через слоты
---

## Введение

Слоты в HTML — это механизм, который позволяет передавать и выводить пользовательский контент внутри веб-компонентов. Если вы уже сталкивались с компонентными фреймворками (например, Vue, React, Svelte), то концепция слотов покажется знакомой: это «места» в шаблоне компонента, куда родитель может вставлять свой HTML.

В нативных Web Components за это отвечает элемент `<slot>`. Он работает вместе с Shadow DOM и шаблоном компонента, позволяя:

- настраивать внешний вид компонента без изменения его внутренней логики;
- разделять ответственность — компонент контролирует структуру и стили, а родитель — конкретный контент;
- переиспользовать один и тот же компонент в разных контекстах.

Сейчас я покажу вам, как это устроено «под капотом», как правильно использовать слоты, какие есть типы слотов и с какими подводными камнями вы можете столкнуться.

## Что такое слот в контексте Web Components

### Кратко о Web Components и Shadow DOM

Чтобы слоты стали понятнее, важно немного коснуться общей картины Web Components.

Web Components обычно состоят из трех частей:

1. **Кастомный элемент** — создается через `customElements.define`.
2. **Shadow DOM** — изолированное дерево DOM, в котором хранится разметка и стили компонента.
3. **Шаблон компонента** — HTML и CSS, которые определяют, как выглядит компонент.

Смотрите, как выглядит минимальный пример:

```html
<!-- Шаблон в HTML -->
<template id="user-card-template">
  <style>
    /* Стили применяются только внутри Shadow DOM */
    .card {
      border: 1px solid #ccc;  /* Простая рамка */
      padding: 8px;            /* Внутренние отступы */
      border-radius: 4px;      /* Скругление углов */
    }
  </style>
  <div class="card">
    <!-- Здесь дальше могут быть слоты -->
  </div>
</template>

<script>
// Определяем класс компонента
class UserCard extends HTMLElement {
  constructor() {
    super();

    // Создаем Shadow Root
    const shadow = this.attachShadow({ mode: 'open' });

    // Берем шаблон из документа
    const template = document.getElementById('user-card-template');
    const content = template.content.cloneNode(true); // Клонируем содержимое шаблона

    // Вставляем в Shadow DOM
    shadow.appendChild(content);
  }
}

// Регистрируем компонент
customElements.define('user-card', UserCard);
</script>
```

Пока это просто базовый компонент без слотов. Но именно внутрь этой разметки (`.card`) мы будем добавлять `<slot>`, чтобы дать возможность родителю подставлять свой контент.

### Задача слота

Элемент `<slot>` внутри Shadow DOM — это специальное место, куда попадает содержимое, которое вы пишете между тегами компонента.

Например:

```html
<user-card>
  <p>Это содержимое передал родитель</p>
</user-card>
```

Если внутри шаблона `user-card` есть слот:

```html
<div class="card">
  <slot></slot> <!-- Слот для внешнего содержимого -->
</div>
```

То `<p>Это содержимое передал родитель</p>` будет «вмонтировано» в этот `<slot>` визуально, хотя физически останется в light DOM (внешнем DOM, вне Shadow DOM). Важно понимать это разделение:

- **Light DOM** — содержимое, которое вы пишете в HTML между тегами компонента.
- **Shadow DOM** — внутренний шаблон компонента.
- **Слот (`<slot>`)** — мост между ними, «окно» в Shadow DOM, куда выводятся узлы из light DOM.

Теперь давайте посмотрим, какие бывают типы слотов.

## Типы слотов: неименованные и именованные

### Неименованный слот (дефолтный)

Самый простой вариант:

```html
<template id="user-card-template">
  <style>
    .card {
      border: 1px solid #ccc;
      padding: 8px;
    }
  </style>
  <div class="card">
    <slot></slot> <!-- Неименованный слот -->
  </div>
</template>
```

Использование:

```html
<user-card>
  <!-- Все содержимое попадает в неименованный слот -->
  <h2>Иван Петров</h2>
  <p>Frontend-разработчик</p>
</user-card>
```

Все дочерние узлы `<user-card>`, у которых не указан атрибут `slot`, будут отображаться в этот `<slot>`.

Обратите внимание: если в шаблоне только один неименованный слот, все «непривязанные» узлы попадут именно туда. Это поведение по умолчанию.

### Именованный слот

Теперь давайте разберемся с именованными слотами. Они позволяют разделять разные области контента.

Пример шаблона:

```html
<template id="user-card-template">
  <style>
    .card {
      border: 1px solid #ccc;
      padding: 8px;
    }
    .header {
      font-weight: bold;        /* Заголовок делаем жирным */
      margin-bottom: 4px;       /* Отступ снизу */
    }
    .footer {
      margin-top: 4px;          /* Отступ сверху */
      font-size: 12px;          /* Мелкий шрифт для подписи */
      color: #666;
    }
  </style>
  <div class="card">
    <div class="header">
      <slot name="header"></slot> <!-- Слот для заголовка -->
    </div>
    <div class="body">
      <slot></slot>              <!-- Основной (дефолтный) слот -->
    </div>
    <div class="footer">
      <slot name="footer"></slot> <!-- Слот для подвала -->
    </div>
  </div>
</template>
```

Использование:

```html
<user-card>
  <!-- Узел идет в слот с именем "header" -->
  <h2 slot="header">Иван Петров</h2>

  <!-- Узел без атрибута slot -> в неименованный слот -->
  <p>Frontend-разработчик, интересуется Web Components</p>

  <!-- Узел идет в слот с именем "footer" -->
  <span slot="footer">Контакты по запросу</span>
</user-card>
```

Как видите, распределение происходит через атрибут `slot` на узлах **в light DOM**. Не путайте:

- внутри Shadow DOM вы используете `<slot name="header">`;
- в light DOM вы ставите `slot="header"` на конкретные элементы.

Если дочерний узел не попадает ни в один именованный слот (нет соответствующего имени), он будет обработан как неименованный и попытается занять дефолтный слот. Если дефолтного слота нет, такой узел не будет отображен вовсе.

## Fallback содержимое слота (запасной контент)

Слот может содержать «запасной» контент — его еще называют fallback-содержимым. Оно отображается только тогда, когда родитель не передал контент для этого слота.

Пример:

```html
<template id="user-card-template">
  <style>
    .card {
      border: 1px dashed #aaa;
      padding: 8px;
    }
    .placeholder {
      color: #999;               /* Серый текст для подсказки */
      font-style: italic;        /* Курсив для отличия */
    }
  </style>
  <div class="card">
    <slot name="header">
      <!-- Fallback содержимое для header -->
      <span class="placeholder">Имя пользователя не указано</span>
    </slot>
    <slot>
      <!-- Fallback содержимое для основного слота -->
      <p class="placeholder">Описание пользователя не добавлено</p>
    </slot>
  </div>
</template>
```

Использование:

```html
<!-- Первый случай - пользователь ничего не передал -->
<user-card></user-card>
<!-- Оба слота покажут fallback-содержимое -->

<!-- Второй случай - передан только header -->
<user-card>
  <h2 slot="header">Иван Петров</h2>
</user-card>
<!-- Для header отображается переданный заголовок,
     а для основного слота - fallback -->
```

Важно:

- Fallback HTML является частью шаблона компонента.
- Как только для слота появляется хотя бы один подходящий узел из light DOM, весь fallback внутри этого `<slot>` скрывается.
- Fallback содержимое можно стилизовать так же, как обычный HTML в Shadow DOM.

## Как работает распределение узлов по слотам

### Механика распределения

Браузер автоматически решает, какой дочерний элемент компонента попадет в какой слот. Алгоритм распределения можно описать так:

1. Берутся все прямые дети компонента в light DOM.
2. Для каждого смотрится атрибут `slot`:
   - если `slot` есть — ищется слот с таким же именем (`name="..."`) в Shadow DOM;
   - если слот найден — элемент «распределяется» в него;
   - если слот не найден — элемент ведет себя как для неименованного слота.
3. Все элементы без атрибута `slot` считаются кандидатами для неименованного слота.
4. Если подходящего слота нет — эти элементы просто не отображаются внутри компонента.

Давайте посмотрим на конкретный пример:

```html
<template id="example-template">
  <div>
    <slot name="title"></slot>
    <slot></slot>
  </div>
</template>

<custom-example>
  <h1 slot="title">Заголовок</h1>  <!-- -> в слот name="title" -->
  <p>Текст 1</p>                   <!-- -> в неименованный слот -->
  <p>Текст 2</p>                   <!-- -> в неименованный слот -->
</custom-example>
```

Визуально внутри компонента будет:

```html
<div>
  <!-- Содержимое слота title -->
  <h1 slot="title">Заголовок</h1>

  <!-- Содержимое неименованного слота -->
  <p>Текст 1</p>
  <p>Текст 2</p>
</div>
```

Хотя физически `<h1>` и `<p>` остаются в light DOM (дети `<custom-example>`), в Shadow DOM мы видим их «проекции» через `<slot>`.

### Связка с DOM-API

Иногда полезно программно получать список узлов, попавших в слот. Для этого у элемента `<slot>` есть метод `assignedNodes()` и `assignedElements()`.

Давайте разберемся на примере:

```html
<template id="log-slot-template">
  <div>
    <slot id="main-slot"></slot>
  </div>
</template>

<script>
class LogSlot extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const template = document.getElementById('log-slot-template');
    shadow.appendChild(template.content.cloneNode(true));

    // Находим слот в Shadow DOM
    const slot = shadow.getElementById('main-slot');

    // Слушаем событие, когда содержимое слота меняется
    slot.addEventListener('slotchange', event => {
      // Получаем список назначенных узлов
      const nodes = slot.assignedNodes({ flatten: true });
      console.log('Новые узлы слота', nodes); // Логируем новые узлы
    });
  }
}

customElements.define('log-slot', LogSlot);
</script>
```

Методы:

- `slot.assignedNodes(options?)` — возвращает массив узлов (включая текстовые узлы).
  - `options.flatten` — если `true`, учитывает распределение вложенных слотов.
- `slot.assignedElements(options?)` — то же самое, но только для элементов (без текстовых узлов).

Это удобно, если вы хотите реагировать на то, что родитель изменил содержимое компонента.

## Событие slotchange

Каждый раз, когда состав содержимого слота меняется (например, добавился новый элемент, атрибут `slot` был изменен, узел удален и т.д.), браузер генерирует событие `slotchange` на самом элементе `<slot>`.

Покажу вам на примере:

```html
<template id="user-card-template">
  <style>
    .card {
      border: 1px solid #ccc;
      padding: 8px;
    }
  </style>
  <div class="card">
    <slot id="content-slot"></slot>
  </div>
</template>

<script>
class UserCard extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const template = document.getElementById('user-card-template');
    shadow.appendChild(template.content.cloneNode(true));

    const slot = shadow.getElementById('content-slot');

    // Реагируем на изменение слота
    slot.addEventListener('slotchange', () => {
      // Получаем назначенные элементы
      const elements = slot.assignedElements();
      console.log('Содержимое слота изменилось', elements);
    });
  }
}

customElements.define('user-card', UserCard);
</script>
```

Когда вы в коде сделаете что-то вроде:

```javascript
// Здесь мы меняем содержимое light DOM компонента
const card = document.querySelector('user-card');
card.innerHTML = '<p>Новое содержимое</p>'; // Заменяем контент
```

Событие `slotchange` сработает, и вы сможете обновить свое состояние, что-то пересчитать или, например, добавить CSS-класс в зависимости от того, пустой слот или нет.

## Вложенные слоты и композиция компонентов

Слоты хорошо сочетаются с идеей композиции: вы можете вкладывать один компонент в другой и «пробрасывать» контент дальше.

Представим, что у вас есть базовый компонент `panel-layout` с двумя слотами: `header` и `default`.

```html
<template id="panel-layout-template">
  <style>
    .panel {
      border: 1px solid #ddd;
      border-radius: 4px;
      margin: 8px 0;
    }
    .panel-header {
      background: #f5f5f5;        /* Светлый фон шапки */
      padding: 4px 8px;
      font-weight: bold;
    }
    .panel-body {
      padding: 8px;               /* Отступы внутри тела панели */
    }
  </style>
  <div class="panel">
    <div class="panel-header">
      <slot name="header"></slot>
    </div>
    <div class="panel-body">
      <slot></slot>
    </div>
  </div>
</template>
```

Теперь создадим компонент `user-card`, который использует `panel-layout` внутри себя:

```html
<template id="user-card-template">
  <panel-layout>
    <!-- Пробрасываем свой слот "header" во внутренний panel-layout -->
    <slot slot="header" name="header"></slot>
    <!-- Основной контент тоже пробрасываем -->
    <slot></slot>
  </panel-layout>
</template>
```

Смотрите, что происходит:

- Во внешнем API `user-card` по-прежнему имеет слоты `header` и дефолтный.
- Внутри `user-card` мы используем `<panel-layout>`, и в него передаем:
  - `<slot name="header" slot="header">` — это значит, что внешний `slot name="header"` становится содержимым слота `header` внутреннего `panel-layout`;
  - `<slot></slot>` — дефолтный слот `user-card` становится дефолтным содержимым для `panel-layout`.

Использование:

```html
<user-card>
  <span slot="header">Карточка пользователя</span>
  <p>Основное описание пользователя...</p>
</user-card>
```

В итоге вы получаете переиспользуемую разметку и стили `panel-layout`, но API для потребителей идет только через `user-card`. Это как раз то, ради чего слоты и придумывались — гибкая композиция без копирования кода.

## Стилизация содержимого слота

### Важный момент: стили shadow и light DOM

Когда вы работаете со слотами, нужно помнить:

- Стили внутри Shadow DOM **не видят** содержимое light DOM напрямую, если вы не используете специальные селекторы.
- Стили в документе (light DOM) **могут стилизовать** свои элементы, даже если они отображаются внутри слота.

То есть:

```html
<user-card>
  <p class="red">Текст</p>
</user-card>

<style>
  /* Этот стиль работает, потому что элемент в light DOM */
  .red {
    color: red;
  }
</style>
```

Внутренние стили компонента по умолчанию не могут написать что-то вроде `.red { color: blue; }` и применить это к содержимому слота — потому что `.red` находится вне Shadow DOM.

### ::slotted селектор

Чтобы все-таки влиять на стили содержимого, которое пришло в слот, в Shadow DOM доступен специальный псевдоселектор `::slotted()`.

Он применяется только на прямых дочерних элементах слота. Вот пример:

```html
<template id="user-card-template">
  <style>
    /* Стилизуем все элементы, которые попали в неименованный слот */
    ::slotted(*) {
      margin: 0;                  /* Убираем внешние отступы */
    }

    /* Стилизуем только элементы заголовка, пришедшие в слот header */
    ::slotted([slot="header"]) {
      text-transform: uppercase;  /* Преобразуем текст в верхний регистр */
    }

    /* Вариант для конкретного типа элемента в слоте с именем header */
    ::slotted(h2[slot="header"]) {
      color: #0070f3;             /* Синий цвет заголовка */
    }
  </style>
  <div class="card">
    <slot name="header"></slot>
    <slot></slot>
  </div>
</template>
```

Важно:

- `::slotted(selector)` может выбирать только верхний уровень элементов, вставленных в слот.
- Нельзя сделать `::slotted(div p)` — вложенные элементы не будут так выбраны; нужно стилизовать их уже со стороны light DOM.

Поэтому хорошей практикой будет:

- давать внешнему контенту классы, если требуется специфическая стилизация;
- по возможности использовать `::slotted` для простых, общих правил (отступы, шрифт и т.п.);
- оставлять полную свободу деталям оформления на стороне родителя, если это не критично для логики компонента.

## Ограничения и подводные камни слотов

### Порядок элементов и перерисовка

Порядок отображения содержимого слота определяется:

- порядком элементов в light DOM;
- положением `<slot>` в шаблоне.

Если вы позднее изменяете порядок дочерних элементов компонента, содержимое в слоте обновится, но имейте в виду, что это может привести к перерисовке и перерасчету стилей.

### Нельзя «перемешать» куски одного узла по разным слотам

Иногда разработчики хотят сделать что-то вроде:

```html
<user-card>
  <p slot="title-and-body">
    <strong>Заголовок</strong>
    Описание...
  </p>
</user-card>
```

И внутри компонента разделить это `<p>` на две части — заголовок в один слот, текст в другой. Нативные слоты так не работают: один узел может быть назначен только в один слот. Если нужно более сложное разбиение, делайте это:

- либо через две отдельные части в light DOM,
- либо парсите контент внутри компонента и программно создавайте разметку.

### Слоты не меняют фактическое местоположение узлов

Это частая причина путаницы. При работе с DOM-API:

- `userCard.firstChild` вернет элемент в light DOM, а не элемент, который вы видите внутри слота в Shadow DOM.
- Узлы не «переезжают» в Shadow DOM, они только отображаются там.

Если вам нужно управлять содержимым слота, работайте с:

- DOM light DOM (например, `this.children` внутри компонента, если `this` — кастомный элемент);
- методами `slot.assignedNodes()` / `slot.assignedElements()`.

### Вложенные Shadow DOM и flattening

Если слоты вложены (слот внутри компонента, который сам стоит в слоте другого компонента), то при вызове `assignedNodes({ flatten: true })` браузер может «распрямить» это дерево, показывая уже конечное содержимое. Это упрощает жизнь, но иногда создает путаницу при отладке, потому что вы видите не то, что физически является прямым потомком `<slot>`.

## Практический пример полного компонента со слотами

Давайте соберем все сказанное и создадим компонент `modal-dialog` с гибким API через слоты.

### Шаблон и класс компонента

```html
<template id="modal-dialog-template">
  <style>
    :host {
      display: none;                 /* По умолчанию модалка скрыта */
      position: fixed;               /* Фиксированное позиционирование */
      inset: 0;                      /* Растягиваем на все окно */
      align-items: center;           /* Центрируем по вертикали */
      justify-content: center;       /* Центрируем по горизонтали */
      background: rgba(0, 0, 0, 0.3);/* Полупрозрачный фон */
    }

    :host([open]) {
      display: flex;                 /* Показываем, когда есть атрибут open */
    }

    .dialog {
      background: #fff;
      min-width: 300px;
      max-width: 600px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .header {
      padding: 8px 12px;
      border-bottom: 1px solid #eee;
      font-weight: bold;
    }

    .body {
      padding: 12px;
    }

    .footer {
      padding: 8px 12px;
      border-top: 1px solid #eee;
      text-align: right;
    }

    /* Стилизуем кнопки, пришедшие во footer */
    ::slotted(button[slot="footer"]) {
      margin-left: 8px;              /* Отступ между кнопками */
    }
  </style>

  <div class="dialog" role="dialog" aria-modal="true">
    <div class="header">
      <!-- Заголовок модалки -->
      <slot name="title">
        <!-- Fallback, если заголовок не передан -->
        <span>Диалог</span>
      </slot>
    </div>
    <div class="body">
      <!-- Основное содержимое -->
      <slot></slot>
    </div>
    <div class="footer">
      <!-- Кнопки управления -->
      <slot name="footer">
        <!-- Fallback кнопка закрытия -->
        <button type="button" id="default-close">Закрыть</button>
      </slot>
    </div>
  </div>
</template>

<script>
class ModalDialog extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const template = document.getElementById('modal-dialog-template');
    shadow.appendChild(template.content.cloneNode(true));

    // Находим fallback-кнопку закрытия
    const fallbackClose = shadow.getElementById('default-close');
    if (fallbackClose) {
      fallbackClose.addEventListener('click', () => {
        // Закрываем модалку, убирая атрибут open
        this.removeAttribute('open');
      });
    }

    // Находим слот footer, чтобы при необходимости подключить обработчики к пользовательским кнопкам
    const footerSlot = shadow.querySelector('slot[name="footer"]');
    footerSlot.addEventListener('slotchange', () => {
      const elements = footerSlot.assignedElements();
      // Если есть пользовательские кнопки, можно повесить обработчики
      elements.forEach(el => {
        if (el.matches('[data-close]')) {
          el.addEventListener('click', () => {
            this.removeAttribute('open'); // Закрываем модалку
          });
        }
      });
    });
  }

  // Небольшой удобный API
  open() {
    this.setAttribute('open', '');   // Открываем модалку
  }

  close() {
    this.removeAttribute('open');    // Закрываем модалку
  }
}

customElements.define('modal-dialog', ModalDialog);
</script>
```

### Использование компонента

Теперь вы увидите, как это выглядит в коде:

```html
<modal-dialog id="dialog-example">
  <!-- Заголовок модалки -->
  <span slot="title">Подтверждение действия</span>

  <!-- Основной текст -->
  <p>Вы действительно хотите удалить этот файл</p>

  <!-- Кнопки в футере -->
  <button slot="footer" type="button" data-close>Отмена</button>
  <button slot="footer" type="button" id="confirm-btn">Удалить</button>
</modal-dialog>

<button id="open-dialog">Открыть диалог</button>

<script>
// Находим элементы на странице
const dialog = document.getElementById('dialog-example');
const openButton = document.getElementById('open-dialog');
const confirmButton = document.getElementById('confirm-btn');

openButton.addEventListener('click', () => {
  // Открываем модалку по клику
  dialog.open();
});

confirmButton.addEventListener('click', () => {
  // Выполняем действие и закрываем модалку
  console.log('Файл удален');  // Здесь размещаем бизнес-логику
  dialog.close();
});
</script>
```

Что здесь показывает силу слотов:

- Вы легко меняете заголовок и содержимое модалки из внешнего кода.
- Вы полностью контролируете набор кнопок и их поведение.
- Компонент при этом отвечает за внешний вид и базовый UX (оверлей, позиционирование, fallback-кнопка, API `open/close`).

## Заключение

Слоты в HTML через элемент `<slot>` — это ключевой инструмент для построения гибких и переиспользуемых Web Components. Они позволяют вам:

- разделять ответственность между компонентом и его потребителем;
- создавать настраиваемые области внутри компонента без знания о том, какой именно контент туда придет;
- управлять содержимым и реагировать на его изменения через события и DOM-API;
- строить сложные композиции компонентов, пробрасывая контент через несколько уровней.

При работе со слотами полезно помнить о нескольких базовых принципах:

- есть неименованный (дефолтный) и именованные слоты;
- распределение происходит по атрибуту `slot` в light DOM и `name` в `<slot>` внутри Shadow DOM;
- fallback-содержимое — это удобный способ задать разумные значения по умолчанию;
- содержимое слота физически остается в light DOM, а в Shadow DOM отображается только проекция;
- для стилизации контента слотов внутри компонента используется `::slotted`.

Если вы уже знакомы с концепцией слотов в фреймворках, переход к нативным Web Components окажется довольно прямолинейным. Отличие лишь в том, что теперь вы работаете непосредственно с браузерным API, а не с абстракцией поверх него.

## Частозадаваемые технические вопросы по теме и ответы

### Как сделать так, чтобы слот отображал только первый элемент, а остальные игнорировались

По умолчанию слот показывает все назначенные узлы. Если вам нужен только первый элемент, вы можете в обработчике `slotchange` скрыть остальные:

```javascript
const slot = shadowRoot.querySelector('slot');

slot.addEventListener('slotchange', () => {
  const elements = slot.assignedElements();
  elements.forEach((el, index) => {
    // Скрываем все элементы, кроме первого
    el.style.display = index === 0 ? '' : 'none';
  });
});
```

Так вы создаете поведение «одиночного» слота.

### Можно ли программно поменять, в какой слот попадает элемент

Да, вы можете изменить атрибут `slot` у элемента в light DOM:

```javascript
const card = document.querySelector('user-card');
const el = card.querySelector('.some-element');

// Меняем слот с header на footer
el.setAttribute('slot', 'footer');
```

После изменения браузер перераспределит узлы, и сработает `slotchange` на соответствующих слотах. Следите за тем, чтобы имя слота существовало в шаблоне, иначе элемент станет кандидатом для дефолтного слота.

### Как узнать, пустой ли конкретный слот (учитывая, что может быть fallback)

Fallback-содержимое не считается назначенными узлами. Проверять нужно через `assignedNodes()`:

```javascript
const slot = shadowRoot.querySelector('slot[name="header"]');
const nodes = slot.assignedNodes({ flatten: true });

const isEmpty = nodes.length === 0; // true, если ничего не передано извне
```

Если `isEmpty === true`, значит, показывается fallback или слот визуально пуст.

### Можно ли переназначить слот одного узла на другой внутри одного компонента без изменения light DOM

Напрямую — нет. Назначение слота определяется только атрибутом `slot` в light DOM. Но вы можете:

1. Клонировать узел.
2. Удалить оригинал.
3. Вставить клон с другим атрибутом `slot`.

```javascript
const original = someElement;
const clone = original.cloneNode(true); // Клонируем элемент
clone.setAttribute('slot', 'new-slot'); // Меняем слот
original.replaceWith(clone);            // Заменяем в DOM
```

Так вы фактически переназначите слот.

### Как совместить слоты с передачей данных через атрибуты/свойства

Слоты отвечают только за структуру и визуальное размещение контента. Для данных используйте:

- атрибуты и отраженные свойства (например, `user-name`, `user-age`);
- методы компонента (`setUser(data)`).

Хорошая практика — использовать слоты для «произвольного» контента (тексты, кнопки, фрагменты разметки), а для строгих данных и логики — явный API через свойства и методы. Например:

```html
<user-card user-name="Иван" user-role="admin">
  <button slot="footer">Подробнее</button>
</user-card>
```

При этом сам компонент читает `this.getAttribute('user-name')` и рендерит внутреннее состояние, а слот отвечает только за кнопку.