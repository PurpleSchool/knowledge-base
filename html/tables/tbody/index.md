---
metaTitle: Тело таблицы HTML tbody - полное руководство для разработчиков
metaDescription: Разбор роли и использования тела таблицы HTML tbody - структура разметки доступность стилизация и динамическая работа с таблицами в JavaScript
author: Олег Марков
title: Тело таблицы HTML tbody - как правильно использовать и управлять табличными данными
preview: Исследуйте HTML элемент tbody - разберитесь как он формирует тело таблицы влияет на отображение и помогает работать с табличными данными через CSS и JavaScript
---

## Введение

Элемент `<tbody>` в HTML часто воспринимают как что-то второстепенное, особенно если вы только начинаете работать с таблицами. Многие разработчики просто пишут `<table><tr><td>…` и не задумываются о разделении таблицы на логические части. Но как только вы начинаете:

- динамически добавлять строки таблицы из JavaScript  
- настраивать сложную стилизацию таблиц  
- работать с доступностью (accessibility)  
- строить большие таблицы с заголовком, подвалом и группировкой строк  

элемент `<tbody>` становится обязательным к пониманию.

Здесь я покажу вам, как работает `<tbody>`, зачем он нужен, как он ведет себя в разных браузерах, как с ним правильно работать в JavaScript и как он влияет на стилизацию и доступность таблиц.

---

## Что такое `<tbody>` и зачем он нужен

### Логическая структура HTML‑таблицы

Начнем с общей структуры таблицы. Типичная таблица может включать:

- `<caption>` — заголовок таблицы  
- `<colgroup>` / `<col>` — описание колонок  
- `<thead>` — заголовок таблицы (строки с заголовками столбцов)  
- `<tbody>` — тело таблицы (основные данные)  
- `<tfoot>` — подвал таблицы (итоги, примечания)

Упрощенно структура выглядит так:

```html
<table>
  <caption>Статистика продаж</caption>

  <thead>
    <tr>
      <th>Товар</th>
      <th>Количество</th>
      <th>Цена</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>Ноутбук</td>
      <td>5</td>
      <td>75 000 ₽</td>
    </tr>
    <tr>
      <td>Монитор</td>
      <td>10</td>
      <td>15 000 ₽</td>
    </tr>
  </tbody>

  <tfoot>
    <tr>
      <td>Итого</td>
      <td>15</td>
      <td>... ₽</td>
    </tr>
  </tfoot>
</table>
```

Элемент `<tbody>` здесь отвечает только за одну часть — **основное содержимое таблицы**, то есть те строки, которые представляют данные, а не заголовки и не итоги.

### Почему `<tbody>` важен, даже если его можно опустить

Браузеры допускают написание таблицы без явного `<tbody>`:

```html
<table>
  <tr>
    <td>Ячейка 1</td>
  </tr>
  <tr>
    <td>Ячейка 2</td>
  </tr>
</table>
```

Смотрите, что происходит на самом деле: браузер **автоматически добавляет** `<tbody>` в дерево DOM, даже если в исходном HTML его нет. То есть DOM-структура будет выглядеть так:

```html
<table>
  <tbody>
    <tr>
      <td>Ячейка 1</td>
    </tr>
    <tr>
      <td>Ячейка 2</td>
    </tr>
  </tbody>
</table>
```

Это поведение важно по двум причинам:

1. В JavaScript вы будете работать с `<tbody>`, даже если не писали его руками.  
2. В CSS селекторы типа `table > tbody > tr` будут работать, и иногда вы можете удивиться, почему ваши стили применяются именно так.

Практический вывод: **лучше всегда явно указывать `<tbody>`** — так разметка становится предсказуемее и проще в поддержке.

---

## Синтаксис и правила вложенности `<tbody>`

### Где можно использовать `<tbody>`

По спецификации HTML `<tbody>` может находиться только внутри `<table>`. Корректный порядок элементов:

1. `<caption>` (опционально)  
2. `<colgroup>` (опционально, один или несколько)  
3. `<thead>` (опционально)  
4. `<tbody>` (обязателен логически, может быть несколько)  
5. `<tfoot>` (опционально)

Пример с несколькими блоками тела таблицы:

```html
<table>
  <thead>
    <tr>
      <th>Месяц</th>
      <th>Продажи</th>
    </tr>
  </thead>

  <!-- Первое тело таблицы -->
  <tbody>
    <tr>
      <td>Январь</td>
      <td>100</td>
    </tr>
    <tr>
      <td>Февраль</td>
      <td>120</td>
    </tr>
  </tbody>

  <!-- Второе тело таблицы -->
  <tbody>
    <tr>
      <td>Март</td>
      <td>150</td>
    </tr>
    <tr>
      <td>Апрель</td>
      <td>130</td>
    </tr>
  </tbody>
</table>
```

Здесь я показываю пример с двумя `<tbody>`. Так можно группировать строки логически, например, по кварталам или категориям.

### Что может находиться внутри `<tbody>`

Внутри `<tbody>` допускаются:

- `<tr>` — строки таблицы  
- Внутри `<tr>` — `<td>` и `<th>`

То есть `<tbody>` — это контейнер **только для строк**. Нельзя класть в него произвольные элементы дивов, параграфов и так далее **вне строк**. Они допустимы только внутри ячеек.

Пример правильной структуры:

```html
<tbody>
  <tr>
    <th>Категория</th>
    <td>
      <!-- Внутри ячейки уже можно использовать любой блочный HTML -->
      <p>Электроника</p>
      <p>Компьютеры и ноутбуки</p>
    </td>
  </tr>
</tbody>
```

---

## Основные задачи, которые решает `<tbody>`

### 1. Логическое разделение данных

`<tbody>` отделяет основные данные от заголовка (`<thead>`) и подвала (`<tfoot>`). Это позволяет:

- проще понимать структуру таблицы  
- группировать строки (несколько `<tbody>`)  
- отдельно стилизовать разные части таблицы  

Например, вы можете сделать заголовок серым, тело белым, подвал жирным:

```css
table thead {
  background-color: #f2f2f2; /* Цвет фона шапки */
}

table tbody {
  background-color: #ffffff; /* Цвет фона тела таблицы */
}

table tfoot {
  font-weight: bold;         /* Выделение подвала */
}
```

### 2. Влияние на доступность и чтение экранными читалками

Читалки экрана и другие assistive‑технологии ориентируются на семантику HTML. Когда вы используете:

- `<thead>` — для заголовка таблицы  
- `<tbody>` — для основного содержания  
- `<tfoot>` — для итогов  

пользователи, которые работают с такими инструментами, получают более понятную структуру:

- где заголовок столбца  
- какие строки относятся к данным  
- где итоговые строки или примечания

Особенно это важно в больших таблицах с десятками строк.

### 3. Удобство работы в JavaScript

При работе с таблицами через DOM чаще всего вам нужно:

- добавлять новые строки  
- удалять строки  
- перебирать все строки тела таблицы

Именно `<tbody>` становится основной точкой работы. Вы ищете `<tbody>`, а уже внутри добавляете `<tr>`.

---

## Работа с `<tbody>` в JavaScript

Теперь давайте перейдем к практике и посмотрим, как обычно работают с телом таблицы через JavaScript.

### Поиск `<tbody>` в DOM

Есть несколько распространенных способов получить `<tbody>`.

#### Через `querySelector`

```html
<table id="users">
  <thead>
    <tr>
      <th>Имя</th>
      <th>Возраст</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Иван</td>
      <td>30</td>
    </tr>
  </tbody>
</table>

<script>
  // Находим таблицу по id
  const table = document.getElementById('users');

  // Находим первый tbody внутри таблицы
  const tbody = table.querySelector('tbody');

  // Выводим количество строк в теле таблицы
  console.log(tbody.rows.length); // Здесь вы увидите число строк
</script>
```

Комментарии:

- `table.querySelector('tbody')` — находит первый `<tbody>`  
- `tbody.rows` — коллекция строк `<tr>` внутри `<tbody>`

#### Через свойство `tBodies` у `HTMLTableElement`

```html
<script>
  const table = document.getElementById('users');

  // Коллекция всех tbody в таблице
  const bodies = table.tBodies;

  // Получаем первый (и чаще всего единственный) tbody
  const tbody = bodies[0];

  console.log(bodies.length); // Здесь вы увидите количество tbody в таблице
</script>
```

Это удобно, если в таблице несколько `<tbody>` и вы хотите работать с ними по индексу.

### Добавление строк в `<tbody>`

Самая частая задача — динамически добавить строку.

#### Вариант 1. Через `insertRow` и `insertCell`

```html
<table id="products">
  <thead>
    <tr>
      <th>Товар</th>
      <th>Цена</th>
    </tr>
  </thead>
  <tbody>
    <!-- Изначально пусто -->
  </tbody>
</table>

<script>
  const table = document.getElementById('products');
  const tbody = table.tBodies[0]; // Здесь мы берем первый tbody

  // Функция для добавления строки
  function addProduct(name, price) {
    // Создаем новую строку в конце tbody
    const row = tbody.insertRow(-1); // -1 означает "в конец"

    // Создаем первую ячейку для названия товара
    const nameCell = row.insertCell(0);
    nameCell.textContent = name; // Здесь мы записываем текст

    // Создаем вторую ячейку для цены
    const priceCell = row.insertCell(1);
    priceCell.textContent = price + ' ₽'; // Добавляем знак валюты
  }

  // Добавляем несколько товаров
  addProduct('Ноутбук', 75000);
  addProduct('Монитор', 15000);
</script>
```

Здесь вы видите пошаговое создание строки и ячеек через DOM‑методы. Такой подход удобен, когда вы хотите контролировать структуру и содержимое ячейки программно.

#### Вариант 2. Через `innerHTML` и шаблонную строку

```html
<script>
  const tbody = document.querySelector('#products tbody');

  function addProductFast(name, price) {
    // Дописываем HTML в конец тела таблицы
    tbody.innerHTML += `
      <tr>
        <td>${name}</td>
        <td>${price} ₽</td>
      </tr>
    `;
  }

  addProductFast('Клавиатура', 2500);
</script>
```

Комментарии:

// Здесь мы дописываем HTML строкой  
// Важно помнить, что innerHTML пересоздает DOM внутри элемента

Этот способ проще по синтаксису, но:

- перезаписывает и пересоздает содержимое  
- может быть менее безопасен, если подставляете данные без экранирования  
- хуже для производительности при большом количестве операций

### Удаление строк из `<tbody>`

Удалять строки можно по-разному, давайте разберем варианты.

#### Удалить все строки тела таблицы

```html
<script>
  const tbody = document.querySelector('#products tbody');

  function clearTable() {
    // Способ 1 - быстрее и проще
    tbody.innerHTML = ''; // Здесь мы полностью очищаем тело таблицы

    // Способ 2 - по одной строке
    // while (tbody.rows.length > 0) {
    //   tbody.deleteRow(0); // Всегда удаляем первую строку
    // }
  }

  clearTable();
</script>
```

Чаще всего для полного очищения достаточно `tbody.innerHTML = ''`.

#### Удалить конкретную строку

```html
<script>
  const tbody = document.querySelector('#products tbody');

  function deleteFirstRow() {
    if (tbody.rows.length > 0) {
      // Удаляем строку по индексу 0
      tbody.deleteRow(0); // Здесь удаляется первая строка тела таблицы
    }
  }

  function deleteRowByElement(row) {
    // Удаляем строку, если известен сам элемент tr
    tbody.removeChild(row); // Здесь мы удаляем конкретный узел tr
  }
</script>
```

---

## Стилизация `<tbody>` с помощью CSS

Смотрите, я покажу вам, как `<tbody>` влияет на стили таблицы.

### Базовая стилизация тела таблицы

```css
table {
  border-collapse: collapse;      /* Объединяем границы ячеек */
  width: 100%;                    /* Таблица занимает всю ширину */
}

thead th {
  background-color: #f8f9fa;      /* Фон шапки */
  text-align: left;               /* Выравнивание текста по левому краю */
}

tbody td {
  padding: 8px 12px;              /* Отступы внутри ячеек тела */
  border-bottom: 1px solid #ddd;  /* Нижняя граница для разделения строк */
}
```

Здесь важно, что вы можете отдельно настраивать стили для `thead` и `tbody`.

### Чередование цветов строк (зебра)

Один из частых приемов — зебра‑окраска строк для удобства чтения.

```css
tbody tr:nth-child(odd) {
  background-color: #ffffff;  /* Нечетные строки */
}

tbody tr:nth-child(even) {
  background-color: #f5f5f5;  /* Четные строки */
}
```

Здесь я явно применяю зебру именно к строкам тела таблицы, а не к шапке. Если бы мы использовали селектор `table tr:nth-child`, он затронул бы и заголовок.

### Стилизация нескольких `<tbody>`

Если у вас несколько блоков `<tbody>`, можно разделить их визуально:

```html
<table class="stats">
  <thead>
    <tr>
      <th>Период</th>
      <th>Значение</th>
    </tr>
  </thead>

  <tbody class="quarter-1">
    <tr>
      <td>Январь</td>
      <td>100</td>
    </tr>
    <tr>
      <td>Февраль</td>
      <td>120</td>
    </tr>
  </tbody>

  <tbody class="quarter-2">
    <tr>
      <td>Март</td>
      <td>150</td>
    </tr>
    <tr>
      <td>Апрель</td>
      <td>130</td>
    </tr>
  </tbody>
</table>
```

```css
.stats tbody.quarter-1 {
  border-bottom: 2px solid #000; /* Разделяем первый квартал жирной линией */
}

.stats tbody.quarter-2 {
  background-color: #fcfcfc;     /* Второму кварталу задаем фон */
}
```

Так вы можете визуально отделять логические группы строк.

---

## `<tbody>` и доступность (ARIA, семантика)

### Семантическая роль без лишних атрибутов

По умолчанию:

- `<table>` интерпретируется как таблица данных  
- `<thead>` — как заголовочная часть  
- `<tbody>` — как основной набор строк данных  
- `<tfoot>` — как подвал

Обычно вам не нужно добавлять атрибуты `role` на `<tbody>`. Стандартной семантики достаточно.

Главное — правильно использовать:

- `<th>` внутри `<thead>` — для заголовков столбцов  
- атрибуты `scope="col"` или `scope="row"` — для явной связи заголовков с ячейками  

Пример:

```html
<table>
  <thead>
    <tr>
      <th scope="col">Товар</th>
      <th scope="col">Количество</th>
      <th scope="col">Цена</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Ноутбук</th> <!-- Заголовок строки -->
      <td>5</td>
      <td>75 000 ₽</td>
    </tr>
  </tbody>
</table>
```

Здесь `<tbody>` организует основное содержимое, а связи заголовков и данных делают таблицу понятной для читалок.

---

## Практические паттерны с `<tbody>`

Теперь давайте разберем несколько типичных задач, где `<tbody>` играет ключевую роль.

### Паттерн 1. Таблица с сортировкой по клику на заголовок

Сценарий: вы хотите сортировать строки таблицы по столбцу, когда пользователь кликает на заголовок.

```html
<table id="users-table">
  <thead>
    <tr>
      <th data-sort="name">Имя</th>
      <th data-sort="age">Возраст</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Иван</td>
      <td>30</td>
    </tr>
    <tr>
      <td>Анна</td>
      <td>25</td>
    </tr>
    <tr>
      <td>Петр</td>
      <td>35</td>
    </tr>
  </tbody>
</table>

<script>
  const table = document.getElementById('users-table');
  const tbody = table.querySelector('tbody');

  // Функция для сортировки по индексу столбца
  function sortByColumn(columnIndex, numeric = false) {
    // Преобразуем HTMLCollection строк в массив
    const rowsArray = Array.from(tbody.rows);

    // Сортируем массив строк
    rowsArray.sort((rowA, rowB) => {
      const cellA = rowA.cells[columnIndex].textContent.trim();
      const cellB = rowB.cells[columnIndex].textContent.trim();

      if (numeric) {
        // Для чисел приводим к числу
        return Number(cellA) - Number(cellB);
      }

      // Для строк сравниваем локализовано
      return cellA.localeCompare(cellB, 'ru');
    });

    // Очищаем tbody
    tbody.innerHTML = '';

    // Добавляем строки в новом порядке
    rowsArray.forEach(row => tbody.appendChild(row));
  }

  // Назначаем обработчики клика на заголовки
  const headers = table.querySelectorAll('thead th');

  headers.forEach((th, index) => {
    th.addEventListener('click', () => {
      const sortType = th.dataset.sort; // Здесь берем значение data-sort

      // Выбираем тип сортировки
      const numeric = sortType === 'age';

      sortByColumn(index, numeric);
    });
  });
</script>
```

Обратите внимание, как здесь используется `<tbody>`:

- мы берем все строки `tbody.rows`  
- сортируем их как массив  
- заново наполняем `<tbody>` в отсортированном порядке  

Шапка (`<thead>`) при этом остается на месте и не затрагивается.

### Паттерн 2. Рендеринг таблицы из массива данных

Представим, что у вас есть массив объектов, и вы хотите отрисовать таблицу.

```html
<table id="orders">
  <thead>
    <tr>
      <th>ID заказа</th>
      <th>Клиент</th>
      <th>Сумма</th>
    </tr>
  </thead>
  <tbody>
    <!-- Сюда мы будем рендерить строки -->
  </tbody>
</table>

<script>
  const orders = [
    { id: 1, customer: 'Иван', total: 1500 },
    { id: 2, customer: 'Анна', total: 3200 },
    { id: 3, customer: 'Петр', total: 2800 }
  ];

  const tbody = document.querySelector('#orders tbody');

  function renderOrders(data) {
    // Очищаем текущее содержимое тела таблицы
    tbody.innerHTML = '';

    // Создаем фрагмент для оптимизации
    const fragment = document.createDocumentFragment();

    data.forEach(order => {
      // Создаем строку
      const tr = document.createElement('tr');

      // Создаем первую ячейку с ID заказа
      const idCell = document.createElement('td');
      idCell.textContent = order.id;

      // Создаем вторую ячейку с именем клиента
      const customerCell = document.createElement('td');
      customerCell.textContent = order.customer;

      // Создаем третью ячейку с суммой
      const totalCell = document.createElement('td');
      totalCell.textContent = order.total + ' ₽';

      // Добавляем ячейки в строку
      tr.appendChild(idCell);
      tr.appendChild(customerCell);
      tr.appendChild(totalCell);

      // Добавляем строку во фрагмент
      fragment.appendChild(tr);
    });

    // За одну операцию добавляем все строки в tbody
    tbody.appendChild(fragment);
  }

  renderOrders(orders);
</script>
```

Здесь `<tbody>` выступает как целевой контейнер для рендеринга данных. Такой подход вы будете часто использовать при интеграции с API.

### Паттерн 3. Подсчет итогов по данным в `<tbody>`

Задача: есть таблица с числами, нужно посчитать сумму по столбцу и вывести ее в подвал (`<tfoot>`).

```html
<table id="sales">
  <thead>
    <tr>
      <th>Товар</th>
      <th>Количество</th>
      <th>Цена</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ноутбук</td>
      <td>2</td>
      <td>75 000</td>
    </tr>
    <tr>
      <td>Монитор</td>
      <td>3</td>
      <td>15 000</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td>Итого</td>
      <td id="total-qty"></td>
      <td id="total-sum"></td>
    </tr>
  </tfoot>
</table>

<script>
  const table = document.getElementById('sales');
  const tbody = table.querySelector('tbody');

  function calculateTotals() {
    let totalQty = 0;
    let totalSum = 0;

    // Перебираем все строки тела таблицы
    Array.from(tbody.rows).forEach(row => {
      // Здесь берем ячейки по индексу: 1 - количество, 2 - цена
      const qty = Number(row.cells[1].textContent.trim());
      const price = Number(row.cells[2].textContent.trim());

      // Увеличиваем количество
      totalQty += qty;
      // Увеличиваем сумму
      totalSum += qty * price;
    });

    // Записываем итоги в подвал
    document.getElementById('total-qty').textContent = totalQty;
    document.getElementById('total-sum').textContent = totalSum.toLocaleString('ru-RU') + ' ₽';
  }

  calculateTotals();
</script>
```

Как видите, `<tbody>` — это именно та часть, из которой мы берем данные для вычислений.

---

## Типичные ошибки и подводные камни при работе с `<tbody>`

### Ошибка 1. Попытка добавить `<tr>` напрямую в `<table>`

Некоторые разработчики в JavaScript делают так:

```js
const table = document.getElementById('my-table');
const tr = document.createElement('tr');
table.appendChild(tr); // Ошибка: строка окажется вне tbody
```

Браузер может попытаться скорректировать структуру, но поведение может отличаться в разных реализациях. Правильно — добавлять строки именно в `<tbody>`:

```js
const tbody = table.querySelector('tbody');
tbody.appendChild(tr); // Здесь строка добавится в тело таблицы
```

### Ошибка 2. Отсутствие `<tbody>` в разметке и работа с DOM

Вы можете написать:

```html
<table id="simple">
  <tr>
    <td>1</td>
  </tr>
</table>
```

А в коде JavaScript попытаться сделать:

```js
const table = document.getElementById('simple');
// Здесь разработчик ожидает, что table.rows вернет все строки
console.log(table.rows.length); // Это вернет количество всех строк, включая thead и tfoot, если они есть
```

Или:

```js
const tbody = table.querySelector('tbody'); // Здесь вы найдете автоматически добавленный tbody
```

Важно помнить: даже если в HTML нет `<tbody>`, в DOM он **появится автоматически**, и при некоторых операциях лучше работать именно с ним, а не с `table.rows`.

### Ошибка 3. Неверные селекторы CSS

Например, вы пишете:

```css
table > tr {
  background-color: #f0f0f0;
}
```

И ожидаете, что это применится к строкам. Но `tr` не является **прямым** потомком `table` — он находится внутри `<tbody>`. Поэтому селектор не сработает.

Правильный вариант:

```css
table > tbody > tr {
  background-color: #f0f0f0;
}
```

Или более общий:

```css
table tr {
  background-color: #f0f0f0;
}
```

---

## Заключение

Элемент `<tbody>` — это не просто дополнительный тег, а ключевая часть структуры HTML‑таблицы. Он:

- отделяет основной набор данных от заголовка и подвала  
- используется браузером даже тогда, когда вы его не пишете явно  
- служит основной точкой для манипуляций с табличными данными в JavaScript  
- облегчает стилизацию таблицы через CSS  
- делает таблицу более понятной для assistive‑технологий

Если вы:

- строите динамические таблицы  
- добавляете сортировку, фильтрацию, пагинацию  
- рендерите большие объемы данных с сервера  

имеет смысл всегда явно использовать `<tbody>`, аккуратно работать с его строками и грамотно комбинировать его с `<thead>` и `<tfoot>`.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как добавить несколько `<tbody>` динамически и управлять ими отдельно

Вы можете создавать несколько элементов `<tbody>` и добавлять их в таблицу:

```js
const table = document.getElementById('my-table');

// Создаем новое тело таблицы
const tbody2 = document.createElement('tbody');
tbody2.className = 'group-2'; // Здесь задаем класс для стилизации

// Добавляем строку в новый tbody
const tr = document.createElement('tr');
const td = document.createElement('td');
td.textContent = 'Новая группа';
tr.appendChild(td);
tbody2.appendChild(tr);

// Добавляем tbody в конец таблицы
table.appendChild(tbody2);
```

Чтобы позже управлять конкретным блоком, используйте класс или `table.tBodies[index]`.

### Как перенести строку из одного `<tbody>` в другой

Берете строку как DOM‑элемент и просто перемещаете:

```js
const table = document.getElementById('my-table');
const body1 = table.tBodies[0];
const body2 = table.tBodies[1];

// Здесь берем первую строку из первого тела
const row = body1.rows[0];

// Перемещение автоматически удалит ее из старого tbody
body2.appendChild(row);
```

DOM сам убирает элемент из старого родителя при добавлении к новому.

### Почему `tbody.innerHTML += ...` иногда "ломает" обработчики событий

Когда вы используете `innerHTML +=`, браузер:

- берет текущее содержимое  
- формирует новую строку  
- полностью пересоздает DOM‑узлы внутри элемента  

В результате обработчики событий, навешанные на старые строки, теряются. Решение:

- использовать `appendChild`, `insertRow`, `insertCell`  
- или использовать делегирование событий через `tbody.addEventListener('click', ...)`.

### Как сделать, чтобы `<thead>` оставался фиксированным, а `<tbody>` прокручивался

Один из простых вариантов:

```css
.table-wrapper {
  max-height: 200px;  /* Высота области прокрутки */
  overflow-y: auto;   /* Вертикальная прокрутка */
}

.table-wrapper table {
  border-collapse: collapse;
  width: 100%;
}

.table-wrapper thead th {
  position: sticky;   /* Фиксируем шапку */
  top: 0;
  background: #fff;
}
```

```html
<div class="table-wrapper">
  <table>
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

Тело таблицы будет прокручиваться внутри обертки, заголовок останется на месте.

### Как корректно получить индекс строки внутри `<tbody>`

Если у вас есть ссылка на элемент `tr`, можно сделать так:

```js
function getRowIndexInBody(row) {
  // Здесь берем родительский tbody
  const tbody = row.parentElement;

  // Преобразуем коллекцию строк в массив и ищем индекс
  return Array.from(tbody.rows).indexOf(row);
}
```

Этот индекс относится только к строкам в данном `<tbody>`, без учета заголовка и других блоков.