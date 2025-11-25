---
metaTitle: HTML шаблоны template - полное руководство
metaDescription: Подробное руководство по HTML шаблонам template - как работать с ними на чистом JavaScript и в связке с фреймворками примеры использования и лучшие практики
author: Олег Марков
title: HTML шаблоны template - от базовой разметки до динамических интерфейсов
preview: Разберитесь как использовать HTML шаблоны template - чем они полезны как их правильно наполнять и клонировать и как применять для построения динамических интерфейсов
---

## Введение

HTML-шаблон `template` часто недооценивают. Многие разработчики сразу идут в сторону фреймворков и JSX, хотя в самом HTML уже есть мощный встроенный механизм для создания шаблонов разметки без участия сторонних библиотек.

Смотрите, я покажу вам, как с помощью одного тега `template` можно:

- хранить фрагменты разметки невидимыми в DOM;
- многократно клонировать их в нужные места страницы;
- безопасно наполнять шаблоны динамическими данными;
- строить небольшие компоненты без фреймворков.

Давайте разбираться по шагам: от синтаксиса и поведения тега до практических примеров и типичных ошибок.

## Что такое HTML шаблон template

### Основная идея template

Тег `template` — это контейнер для фрагмента HTML, который:

- присутствует в DOM, но:
  - не отображается на странице;
  - не участвует в рендеринге;
  - его содержимое не выполняется (например, скрипты внутри него не запускаются);
- может быть программно клонирован и вставлен в документ.

Браузер воспринимает содержимое `template` как заготовку. Пока вы сами не извлечете его через JavaScript и не вставите в DOM, оно "спит".

### Простейший пример

Давайте разберемся на самом базовом примере.

```html
<!-- Шаблон карточки пользователя -->
<template id="user-card-template">
  <div class="user-card">
    <h3 class="user-name"></h3>
    <p class="user-email"></p>
  </div>
</template>

<div id="users-container"></div>

<script>
// Находим сам template по id
const template = document.getElementById('user-card-template');

// Доступ к содержимому шаблона через свойство content
// Это фрагмент документа, пока еще не в DOM страницы
const templateContent = template.content;

// Создаем клон содержимого
const userCard = templateContent.cloneNode(true); // true - глубокое копирование

// Наполняем данные
userCard.querySelector('.user-name').textContent = 'Иван Иванов';
userCard.querySelector('.user-email').textContent = 'ivan@example.com';

// Вставляем в основной DOM
document.getElementById('users-container').appendChild(userCard);
</script>
```

Как видите, шаблон изначально не виден. Мы вручную берем его содержимое, клонируем, заполняем данными и уже клон добавляем на страницу.

### Поведение содержимого шаблона

Важно понять несколько особенностей:

- Содержимое `template` не рендерится:
  - не занимает место в макете;
  - не влияет на вычисление стилей;
  - не может быть сфокусировано.
- Содержимое парсится браузером как обычный HTML:
  - ошибки разметки будут обработаны так же, как в обычном DOM;
  - CSS-селекторы внутри будут работать, когда вы вставите фрагмент в DOM.
- Внутри `template` можно использовать почти любые теги:
  - даже те, которые обычно имеют ограничения (например, внутри `table`).

Это делает `template` удобным для хранения как простых блоков, так и сложной структурированной разметки.

## Синтаксис и структура template

### Базовое объявление

```html
<template id="my-template">
  <div>Мой шаблон</div>
</template>
```

Рекомендуется:

- всегда задавать `id`, чтобы было удобно находить шаблон в JavaScript;
- внутри использовать валидный HTML, как если бы это был обычный DOM.

### Атрибуты template

Сам `template` как тег поддерживает общие атрибуты (например, `id`, `class`, `data-*`), но чаще всего вам нужен только `id`.

Пример с пользовательскими атрибутами:

```html
<template id="notification-template" data-type="info">
  <div class="notification">
    <span class="notification-title"></span>
    <p class="notification-text"></p>
  </div>
</template>
```

В JavaScript вы можете прочитать `dataset` самого шаблона:

```js
const notificationTemplate = document.getElementById('notification-template');

// Здесь мы читаем data-атрибут типа уведомления
const defaultType = notificationTemplate.dataset.type; // 'info'
```

### template и доступные теги внутри

Одно из ключевых преимуществ `template` — он может находиться в местах, где обычная разметка была бы ограничена.

Например, внутри таблицы:

```html
<table>
  <thead>
    <tr>
      <th>Имя</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody id="users-body">
    <!-- Здесь размещаем шаблон строки таблицы -->
    <template id="user-row-template">
      <tr>
        <td class="user-name"></td>
        <td class="user-email"></td>
      </tr>
    </template>
  </tbody>
</table>
```

Браузер корректно воспримет этот шаблон, хотя обычно внутрь `tbody` должны попадать только `tr`. Благодаря специальной обработке `template` это не ломает структуру таблицы.

## Свойство content и работа с DocumentFragment

### Что такое template.content

Браузер при парсинге шаблона создаёт внутри него специальный контейнер `DocumentFragment`. Доступ к нему вы получаете через свойство `content`.

```js
const template = document.getElementById('user-card-template');

// content - это DocumentFragment, временный контейнер нод
const fragment = template.content;
```

Особенности `DocumentFragment`:

- ведет себя как "мини-DOM" в памяти;
- не привязан к основному DOM-дереву;
- при добавлении во внешний DOM его содержимое "распаковывается":
  - сам фрагмент исчезает;
  - его дочерние элементы добавляются напрямую.

### Пример с DocumentFragment

Давайте посмотрим, что происходит в следующем примере:

```html
<template id="item-template">
  <li class="item"></li>
</template>

<ul id="list"></ul>

<script>
const template = document.getElementById('item-template');
const list = document.getElementById('list');

// Создаем DocumentFragment для массовой вставки
const bulkFragment = document.createDocumentFragment();

const items = ['Первый', 'Второй', 'Третий'];

items.forEach(text => {
  // Клонируем содержимое шаблона
  const itemNode = template.content.cloneNode(true);

  // Наполняем текстом
  itemNode.querySelector('.item').textContent = text;

  // Складываем все в общий фрагмент
  bulkFragment.appendChild(itemNode);
});

// Одной операцией добавляем все элементы в DOM
list.appendChild(bulkFragment);
</script>
```

Здесь мы используем сразу два вида `DocumentFragment`:

- `template.content` — фрагмент, заданный шаблоном;
- `bulkFragment` — фрагмент, который мы создали вручную для оптимизации массовой вставки в DOM.

Такой подход уменьшает количество перерисовок и ускоряет работу страницы.

## Клонирование шаблона и вставка в DOM

### cloneNode и его особенности

Чтобы использовать шаблон, нужно его клонировать. Для этого чаще всего применяют метод `cloneNode`.

```js
// cloneNode(true) - глубокое копирование всего дерева внутри шаблона
const clone = template.content.cloneNode(true);
```

Режимы работы `cloneNode`:

- `cloneNode(true)` — глубокое копирование (копируются все дочерние элементы, атрибуты и текст);
- `cloneNode(false)` — поверхностное копирование (скопируется только сам фрагмент, без содержимого, что для шаблона почти не имеет смысла).

Практически всегда с `template` вам нужен режим `true`.

### Вставка в DOM

После клонирования шаблона вы получаете `DocumentFragment`. Его можно вставить в DOM любым привычным способом:

```js
const container = document.getElementById('container');

// Вставка в конец
container.appendChild(clone);

// Вставка перед конкретным элементом
container.insertBefore(clone, someElement);

// Вставка внутрь с помощью append
container.append(clone);
```

Обратите внимание: при вставке фрагмента в DOM сам объект `DocumentFragment` "растворяется". Если вы попытаетесь вставить его второй раз, там уже не будет содержимого.

### Пример: генерация списка задач

Покажу вам, как это реализовано на практике.

```html
<template id="todo-item-template">
  <li class="todo-item">
    <label>
      <input type="checkbox" class="todo-checkbox">
      <span class="todo-text"></span>
    </label>
  </li>
</template>

<ul id="todo-list"></ul>

<script>
// Список задач, который мы могли получить от сервера
const todos = [
  { text: 'Купить молоко', done: false },
  { text: 'Сделать зарядку', done: true },
  { text: 'Позвонить клиенту', done: false }
];

const template = document.getElementById('todo-item-template');
const list = document.getElementById('todo-list');

const fragment = document.createDocumentFragment();

todos.forEach(todo => {
  const clone = template.content.cloneNode(true);

  const checkbox = clone.querySelector('.todo-checkbox');
  const textSpan = clone.querySelector('.todo-text');

  // Заполняем данными
  textSpan.textContent = todo.text;
  checkbox.checked = todo.done;

  // Добавляем слушатель событий на чекбокс
  // Здесь мы показываем, как клон может иметь собственное поведение
  checkbox.addEventListener('change', () => {
    // Здесь могли бы обновить состояние в приложении
    console.log('Изменился статус задачи:', todo.text, checkbox.checked);
  });

  fragment.appendChild(clone);
});

// Вставляем все задачи за один раз
list.appendChild(fragment);
</script>
```

Как видите, каждая задача становится отдельной "инстанцией" шаблона с собственным состоянием (чекбоксом и обработчиком события).

## Вставка данных в шаблон

### Поиск элементов внутри клона

Один из самых частых вопросов — как правильно подставлять данные в шаблон.

После клонирования вы работаете с `DocumentFragment`. Вы можете использовать `querySelector` прямо на фрагменте:

```js
const clone = template.content.cloneNode(true);

// Ищем элементы внутри клона, как будто это мини-DOM
const title = clone.querySelector('.card-title');
const description = clone.querySelector('.card-description');
```

Такой подход удобен, потому что:

- вы не ищете по всему документу;
- нет риска случайно выбрать элемент из другого места страницы;
- фрагмент пока не вставлен в DOM, значит, вы не вызываете лишних перерисовок.

### Подстановка текста и HTML

Основной выбор — использовать `textContent` или `innerHTML`.

Рекомендуется:

- для пользовательских данных — использовать `textContent`;
- для заранее подготовленной HTML-разметки — осторожно использовать `innerHTML`.

```js
// Безопасная подстановка текста
title.textContent = user.name; // Здесь мы защищены от XSS

// Потенциально опасная подстановка HTML
description.innerHTML = user.bioHtml; // Здесь важно доверять содержимому
```

Всегда помните, что `innerHTML` может привести к XSS, если вы вставляете данные, не прошедшие очистку.

### Пример: карточка товара

Давайте посмотрим практический пример.

```html
<template id="product-card-template">
  <article class="product-card">
    <h2 class="product-title"></h2>
    <p class="product-price"></p>
    <button class="product-buy">Купить</button>
  </article>
</template>

<div id="products"></div>

<script>
const products = [
  { title: 'Ноутбук', price: 75000 },
  { title: 'Монитор', price: 15000 },
  { title: 'Клавиатура', price: 3000 }
];

const template = document.getElementById('product-card-template');
const container = document.getElementById('products');
const fragment = document.createDocumentFragment();

products.forEach(product => {
  const clone = template.content.cloneNode(true);

  const titleEl = clone.querySelector('.product-title');
  const priceEl = clone.querySelector('.product-price');
  const buyBtn = clone.querySelector('.product-buy');

  titleEl.textContent = product.title;

  // Здесь мы форматируем цену, прежде чем вывести
  priceEl.textContent = product.price.toLocaleString('ru-RU') + ' ₽';

  buyBtn.addEventListener('click', () => {
    // Обработчик покупки
    console.log('Покупка товара:', product.title);
  });

  fragment.appendChild(clone);
});

container.appendChild(fragment);
</script>
```

Здесь мы не только подставляем данные, но и "наделяем" каждый клон своим обработчиком.

## Условные блоки и циклы на основе template

Сам `template` не содержит встроенного языка шаблонов (логики if, foreach и т.п.). Все это вы реализуете на JavaScript.

Тем не менее, `template` отлично подходит как строительный блок для:

- повторяющихся элементов (циклы на массиве данных);
- условных секций (вставляем или не вставляем).

### Условная вставка

Представим, что вам нужно отображать блок "скидка", только если она есть.

```html
<template id="discount-template">
  <p class="discount">Скидка <span class="discount-value"></span>%</p>
</template>

<div id="product"></div>

<script>
const product = {
  name: 'Наушники',
  price: 5000,
  discountPercent: 10 // Если будет 0 или null, блок не показываем
};

const productContainer = document.getElementById('product');

// Создаем основной контейнер товара
const productDiv = document.createElement('div');
productDiv.textContent = product.name;

// Проверяем условие скидки
if (product.discountPercent > 0) {
  const discountTemplate = document.getElementById('discount-template');
  const discountClone = discountTemplate.content.cloneNode(true);
  const valueSpan = discountClone.querySelector('.discount-value');

  valueSpan.textContent = product.discountPercent;

  // Вставляем блок скидки внутрь товара
  productDiv.appendChild(discountClone);
}

// Добавляем товар в DOM
productContainer.appendChild(productDiv);
</script>
```

Здесь логика "есть ли скидка" выражена в JavaScript, а шаблон отвечает только за разметку.

### Реализация простого повторения

Вы уже видели примеры циклов. Обратите внимание на общую схему:

1. есть массив данных;
2. внутри цикла:
   - клонируем шаблон;
   - наполняем его из одного объекта массива;
   - добавляем клон в общий фрагмент;
3. после цикла — вставляем фрагмент в DOM.

Этот паттерн можно использовать много раз для разных задач.

## Вложенные шаблоны и композиция

### Шаблоны внутри шаблонов

Иногда вам нужно разложить интерфейс на несколько слоев. Например:

- есть шаблон "карточка заказа";
- внутри него — список товаров;
- для элемента списка отдельный шаблон.

Можно реализовать это как вложенные `template`.

```html
<template id="order-template">
  <section class="order">
    <h2 class="order-title"></h2>
    <ul class="order-items"></ul>
  </section>
</template>

<template id="order-item-template">
  <li class="order-item">
    <span class="order-item-name"></span>
    <span class="order-item-qty"></span>
  </li>
</template>

<div id="orders"></div>
```

Теперь давайте посмотрим, как это выглядит в коде.

```js
const orders = [
  {
    id: 1,
    title: 'Заказ 1',
    items: [
      { name: 'Товар A', qty: 2 },
      { name: 'Товар B', qty: 1 }
    ]
  },
  {
    id: 2,
    title: 'Заказ 2',
    items: [
      { name: 'Товар C', qty: 3 }
    ]
  }
];

const orderTemplate = document.getElementById('order-template');
const itemTemplate = document.getElementById('order-item-template');
const ordersContainer = document.getElementById('orders');
const fragment = document.createDocumentFragment();

orders.forEach(order => {
  const orderClone = orderTemplate.content.cloneNode(true);

  const titleEl = orderClone.querySelector('.order-title');
  const itemsContainer = orderClone.querySelector('.order-items');

  titleEl.textContent = order.title;

  // Для каждого товара создаем свой клон item-шаблона
  order.items.forEach(item => {
    const itemClone = itemTemplate.content.cloneNode(true);

    itemClone.querySelector('.order-item-name').textContent = item.name;
    itemClone.querySelector('.order-item-qty').textContent = 'x' + item.qty;

    itemsContainer.appendChild(itemClone);
  });

  fragment.appendChild(orderClone);
});

ordersContainer.appendChild(fragment);
```

Так вы можете выстраивать композицию из нескольких независимых шаблонов, каждый из которых отвечает за свой кусок интерфейса.

## Стили и скрипты внутри template

### CSS внутри шаблона

CSS, описанный внутри `template`, не влияет на страницу до тех пор, пока вы не вставите этот CSS в DOM. Это важный момент.

```html
<template id="styled-template">
  <style>
    .highlight {
      color: red;
    }
  </style>
  <p class="highlight">Пример выделенного текста</p>
</template>
```

Пока вы не вставили содержимое этого шаблона (включая `style`) в DOM, стили не применяются.

На практике чаще:

- стили пишут отдельно в CSS-файлах;
- внутри шаблона используют только классы.

### Скрипты внутри template

Код в `script`, находящемся внутри `template`, **не выполняется** при загрузке страницы. И даже при вставке шаблона в DOM стандартным способом он не будет выполнен автоматически.

```html
<template id="template-with-script">
  <div>Текст</div>
  <script>
    // Этот код не выполнится сам по себе
    console.log('Скрипт внутри template');
  </script>
</template>
```

Если вам нужно выполнить скрипт, описанный внутри шаблона, придется:

- либо вынести его в общий код;
- либо вручную создать новый `<script>` в DOM, скопировав содержимое, и добавить его.

На практике почти всегда удобнее заранее объявить нужные функции снаружи и вызывать их из обработчиков событий, которые вы добавляете к клонам.

## Сравнение с другими подходами (innerHTML, шаблонизаторы, фреймворки)

### Почему не просто innerHTML

До появления `template` многие разработчики делали так:

```js
const container = document.getElementById('container');

// Здесь мы просто склеиваем строку с HTML
container.innerHTML += '<div class="user">' + user.name + '</div>';
```

Проблемы такого подхода:

- нужно вручную экранировать значения (опасность XSS);
- сложнее поддерживать сложную разметку;
- легко допустить ошибку в строке (отсутствующая кавычка, незакрытый тег);
- при частом обновлении часть DOM может пересоздаваться заново, что бьет по производительности.

`template` решает многие из этих проблем:

- вы храните "настоящий" HTML, а не строку;
- браузер заранее парсит разметку;
- вы подставляете только данные, а не собираете весь HTML вручную.

### Шаблонизаторы (Handlebars, Mustache и т.п.)

Шаблонизаторы дают дополнительный синтаксис:

- условия;
- циклы;
- фильтры и т.п.

`template` — это более низкоуровневый механизм. Он:

- не знает о логике;
- лишь предоставляет "форму" разметки.

Если вам нужна более декларативная логика (например, `{{#each items}}`), можно:

- использовать `template` вместе с легким шаблонизатором;
- или полностью переключиться на шаблонизатор.

Но для небольших интерфейсов `template` + JavaScript вполне достаточно.

### Фреймворки (React, Vue и др.)

Фреймворки дают:

- реактивность (автообновление при изменении состояния);
- роутинг;
- экосистему.

`template` — это, по сути, один маленький кирпичик. Его можно использовать:

- в проектах без фреймворков;
- в "островках" функциональности на обычных страницах;
- в виджетах и микрофронтендах.

Когда интерфейс становится сложным, вы можете:

- продолжать использовать `template` локально (например, внутри Web Components);
- или перейти на фреймворк, а знание `template` все равно останется полезным.

## Использование template с Web Components

### Связка template и custom elements

Тег `template` часто используют вместе с кастомными элементами (Web Components). Идея простая:

- внутри компонента вы определяете `template`;
- при создании экземпляра компонента вы клонируете этот шаблон в shadow DOM.

Пример: создадим простой компонент `user-card`.

```html
<template id="user-card-component-template">
  <style>
    .user-card {
      border: 1px solid #ccc;
      padding: 8px;
      margin: 4px 0;
    }

    .user-name {
      font-weight: bold;
    }
  </style>
  <div class="user-card">
    <div class="user-name"></div>
    <div class="user-email"></div>
  </div>
</template>

<script>
class UserCard extends HTMLElement {
  constructor() {
    super();

    // Создаем shadow DOM для компонента
    const shadow = this.attachShadow({ mode: 'open' });

    const template = document.getElementById('user-card-component-template');
    const clone = template.content.cloneNode(true);

    // Наполняем из атрибутов
    clone.querySelector('.user-name').textContent = this.getAttribute('name') || '';
    clone.querySelector('.user-email').textContent = this.getAttribute('email') || '';

    shadow.appendChild(clone);
  }
}

// Регистрируем новый HTML тег
customElements.define('user-card', UserCard);
</script>

<user-card name="Иван" email="ivan@example.com"></user-card>
<user-card name="Мария" email="maria@example.com"></user-card>
```

Здесь `template` служит "шаблоном разметки" компонента, а `UserCard` — оболочкой, которая управляет его жизненным циклом.

## Лучшие практики и типичные ошибки

### Рекомендуемые практики

1. Используйте `id` для всех шаблонов.

   Это делает код понятнее и упрощает поиск шаблона.

2. Отделяйте логику от разметки.

   Пусть `template` описывает HTML-структуру, а JavaScript — что и как заполнять.

3. Используйте `textContent` для пользовательских данных.

   Это простой способ избежать XSS.

4. Оборачивайте массовые операции через `DocumentFragment`.

   Это ускоряет работу и уменьшает количество перерисовок.

5. Структурируйте шаблоны.

   Не перегружайте один шаблон слишком сложной структурой, лучше разбейте на несколько и комбинируйте их.

### Частые ошибки

#### Ошибка 1: ожидание, что template отрендерится сам

Некоторые разработчики удивляются, что содержимое `template` не отображается.

```html
<template>
  <p>Я не виден</p>
</template>
```

Это ожидаемое поведение. Чтобы увидеть содержимое, его надо явно клонировать и вставить в DOM.

#### Ошибка 2: попытка переиспользовать уже вставленный DocumentFragment

```js
const clone = template.content.cloneNode(true);
container.appendChild(clone);
// Здесь clone уже "опустошен", повторная вставка не сработает
anotherContainer.appendChild(clone);
```

Решение — каждый раз вызывать `cloneNode(true)` заново.

#### Ошибка 3: поиск элементов в документе вместо фрагмента

```js
// Неудачный вариант
const clone = template.content.cloneNode(true);
document.querySelector('.item-title').textContent = 'Текст';
// Здесь вы изменяете первый попавшийся элемент на странице, а не в шаблоне
```

Правильно:

```js
const clone = template.content.cloneNode(true);
clone.querySelector('.item-title').textContent = 'Текст';
```

Так вы работаете только с текущим клоном.

#### Ошибка 4: использование innerHTML для сборки больших кусков HTML

Часто можно встретить код:

```js
list.innerHTML = items.map(item => `<li>${item.name}</li>`).join('');
```

Хотя это и работает, такой подход:

- менее безопасен;
- сложнее для поддержки;
- смешивает данные и разметку в строках.

С `template` вы можете создать структуру один раз и затем подставлять только значения.

## Заключение

Тег `template` — это простой, но очень полезный инструмент в современном HTML. Он позволяет:

- хранить разметку как шаблоны, не загромождая интерфейс;
- многократно использовать один и тот же фрагмент DOM;
- наполнять его данными с помощью обычного JavaScript;
- строить небольшие компоненты без тяжелых фреймворков.

Вы можете применять `template`:

- для списков (товары, пользователи, сообщения);
- для карточек, диалогов, уведомлений;
- внутри Web Components;
- в любых местах, где нужен повторяющийся фрагмент разметки.

Если вы пишете интерфейс на "чистом" JavaScript, `template` зачастую оказывается самым удобным способом аккуратно разделить разметку и логику и избежать хаоса с `innerHTML`.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как правильно тестировать работу template в среде без DOM (например, в Node.js)?

В чистом Node.js тега template и DOM нет. Чтобы тестировать логику работы с шаблонами, используйте библиотеку jsdom. Она эмулирует браузерный DOM. Шаги:

1. Установите jsdom.
2. Создайте виртуальный документ с разметкой, где есть ваш template.
3. Пишите тесты так же, как в браузере, обращаясь к document и элементам.

### Как динамически загружать шаблоны с сервера и использовать их как template?

Можно загружать HTML-фрагмент через fetch, затем создать элемент template и присвоить ему innerHTML. Пример:

1. Загружаете строку с разметкой.
2. Создаете элемент template через document.createElement.
3. Присваиваете ему innerHTML с загруженным HTML.
4. Далее используете его content.cloneNode как обычно.

### Как избежать утечек памяти при большом количестве клонов template?

Важно удалять ненужные элементы из DOM и отписываться от событий. Рекомендации:

1. При удалении клона используйте remove или removeChild.
2. Если навешивали обработчики вручную, по возможности используйте делегирование событий через общий контейнер.
3. В тяжелых сценариях — храните ссылки на важные ноды и очищайте их при уничтожении.

### Как обновлять уже вставленный в DOM клон template при изменении данных?

У template нет встроенной реактивности. Нужно:

1. Хранить ссылку на DOM-элемент, соответствующий данным.
2. При изменении данных находить нужный элемент и вручную обновлять его поля (textContent, атрибуты и т.п.).
3. Для удобства можно сделать небольшую обертку (класс или функцию), которая связывает объект данных и DOM-нодой.

### Можно ли использовать template внутри SVG и как с ним работать в этом случае?

Да, но есть нюанс. Содержимое template парсится как HTML, а не как SVG. Если вам нужен шаблон для SVG-элементов, лучше:

1. Либо использовать обычные SVG-элементы с display none как заготовки.
2. Либо создавать SVG-элементы через document.createElementNS и клонировать их вручную.
3. Если все же используете template, убедитесь, что после вставки вы работаете с корректным пространством имен (namespace) для SVG.