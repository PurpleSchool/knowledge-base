---
metaTitle: Создание таблиц в React гайд по react-table
metaDescription: Подробная статья о создании таблиц в React с помощью react table - обзор возможностей, примеры реализации, настройка сортировки и фильтрации, ответы на...
author: Олег Марков
title: Создание таблиц в React гайд по react-table
preview: Освойте создание и настройку интерактивных таблиц в React с react table - инструкция по использованию, примеры, лучшие практики и расширенные возможности компонента
---

## Введение

Таблицы — один из ключевых инструментов для отображения больших объемов информации в веб-приложениях. В экосистеме React есть множество средств для работы с табличными данными, но одним из самых популярных и гибких решений остается библиотека react-table. Она позволяет создавать интерактивные, настраиваемые, производительные таблицы буквально в несколько шагов. В этой статье я покажу вам, как эффективно использовать react-table: как настроить основные функции, управлять сортировкой, фильтрацией, пагинацией и даже кастомизировать ячейки и поведение таблицы под собственные задачи.

## Установка и базовая настройка

Чтобы начать использовать react-table, сначала установите ее через npm:

```bash
npm install react-table
```

Затем библиотеку можно подключить в нужном вам компоненте. Я покажу, как это сделать на простом примере.

### Пример базовой таблицы

Вот код, который создает минимальную таблицу на ваших данных:

```jsx
import React from "react";
import { useTable } from "react-table";

// Пример данных для таблицы
const data = [
  { firstName: "Иван", lastName: "Иванов", age: 28 },
  { firstName: "Мария", lastName: "Петрова", age: 34 },
  { firstName: "Павел", lastName: "Сидоров", age: 22 }
];

// Конфигурация колонок таблицы
const columns = [
  {
    Header: "Имя",
    accessor: "firstName" // поле из объекта data
  },
  {
    Header: "Фамилия",
    accessor: "lastName"
  },
  {
    Header: "Возраст",
    accessor: "age"
  }
];

function MyTable() {
  // Используем хук useTable для инициализации таблицы
  const tableInstance = useTable({ columns, data });

  // Деструктурируем нужные методы и данные для отрисовки
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = tableInstance;

  // Рендерим таблицу
  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => (
                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

Здесь `useTable` — основной хук библиотеки. Он принимает объект с колонками и данными, а возвращает набор вспомогательных функций и данных для дальнейшего рендера. Смотрите: я подробно разнес структуру для наглядности — заголовки, строки, подготовка строк.

`react-table` - это библиотека для создания гибких и интерактивных таблиц в React-приложениях. Она предоставляет множество возможностей для сортировки, фильтрации, пагинации и других операций с табличными данными. Если вы хотите научиться создавать таблицы в React с помощью `react-table` — приходите на наш большой курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-tablic-v-react-gaid-po-react-table). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Гибкая настройка колонок

В `react-table` вы можете не только задать название и ключ колонки, но и кастомизировать их внешний вид, порядок, поведение.

### Кастомизация отображения

Если вы хотите изменить способ отображения данных в ячейке, в описании колонки используйте свойство `Cell`, которое получает текущую строку.

```jsx
const columns = [
  {
    Header: "Имя",
    accessor: "firstName"
  },
  {
    Header: "Возраст",
    accessor: "age",
    Cell: ({ value }) => (
      <span style={{ color: value > 30 ? 'red' : 'green' }}>
        {value} лет
      </span>
    )
  }
];
```

Обратите внимание, как легко менять стили и логику вывода через настройку колонки.

### Работа с вложенными данными (accessor)

В `accessor` можно передавать не только строку, но и функцию для получения/преобразования значения.

```jsx
{
  Header: "Полное имя",
  accessor: row => `${row.firstName} ${row.lastName}`
}
```

Такой способ помогает объединять или форматировать данные прямо на лету.

## Сортировка данных

Добавить сортировку просто — библиотека поставляется с отдельным хуком useSortBy. Посмотрите, как работает включение сортировки.

```jsx
import { useTable, useSortBy } from "react-table";
// ...

const tableInstance = useTable({ columns, data }, useSortBy);
// Теперь на th можно навесить getSortByToggleProps

<thead>
  {headerGroups.map(headerGroup => (
    <tr {...headerGroup.getHeaderGroupProps()}>
      {headerGroup.headers.map(column => (
        <th {...column.getHeaderProps(column.getSortByToggleProps())}>
          {column.render("Header")}
          {/* Отмечаем направление сортировки */}
          <span>
            {column.isSorted
              ? column.isSortedDesc
                ? " 🔽"
                : " 🔼"
              : ""}
          </span>
        </th>
      ))}
    </tr>
  ))}
</thead>
```

Тут для каждой колонки добавляется специальный метод `getSortByToggleProps`, который позволяет кликать по заголовку колонки и менять направление сортировки.

## Фильтрация

Фильтрация возможна и на уровне всей таблицы, и для отдельных колонок. Реализуется с помощью хуков useFilters и useGlobalFilter.

### Фильтрация по колонке

Добавьте фильтры для отдельных колонок следующим образом:

```jsx
import { useTable, useFilters } from "react-table";

// В описание колонки добавьте свойство Filter (отвечает за UI ввода фильтра)
const columns = [
  {
    Header: "Имя",
    accessor: "firstName",
    Filter: ({ column }) => (
      <input
        value={column.filterValue || ''}
        onChange={e => column.setFilter(e.target.value)}
        placeholder="Фильтр по имени"
      />
    )
  },
  // другие колонки
];

// Передайте useFilters в useTable
const tableInstance = useTable({ columns, data }, useFilters);
```

Теперь пользователь сможет фильтровать записи в каждой колонке прямо по вашему шаблону.

### Глобальный фильтр

Глобальный фильтр — это поиск сразу по всем данным таблицы.

```jsx
import { useTable, useGlobalFilter } from "react-table";

function GlobalFilter({ globalFilter, setGlobalFilter }) {
  return (
    <span>
      Поиск:{" "}
      <input
        value={globalFilter || ""}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Введите для поиска"
      />
    </span>
  );
}

// При инициализации:
const tableInstance = useTable(
  { columns, data },
  useGlobalFilter // хук глобального фильтра
);

// Используйте все необходимые свойства:
const { state, setGlobalFilter } = tableInstance;

// И добавьте компонент поиска перед таблицей
<GlobalFilter
  globalFilter={state.globalFilter}
  setGlobalFilter={setGlobalFilter}
/>
```

## Пагинация

Обработка страниц легко подключается через хук usePagination.

```jsx
import { useTable, usePagination } from "react-table";
const tableInstance = useTable({ columns, data }, usePagination);

const {
  page, // текущие данные для текущей страницы
  canPreviousPage,
  canNextPage,
  nextPage,
  previousPage,
  gotoPage,
  pageCount,
  state: { pageIndex }
} = tableInstance;

// Для отрисовки таблицы используйте page вместо rows
<tbody {...getTableBodyProps()}>
  {page.map(row => {
    prepareRow(row);
    return (/* ... */);
  })}
</tbody>

// Кнопки управления пагинацией
<div>
  <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
    {"<<"}
  </button>
  <button onClick={() => previousPage()} disabled={!canPreviousPage}>
    {"<"}
  </button>
  <button onClick={() => nextPage()} disabled={!canNextPage}>
    {">"}
  </button>
  <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
    {">>"}
  </button>
  <span>
    Страница {pageIndex + 1} из {pageCount}
  </span>
</div>
```

Теперь ваша таблица автоматически делит данные на страницы. Количество записей на странице задается опцией initialState:

```jsx
const tableInstance = useTable({
  columns,
  data,
  initialState: { pageSize: 5 }
}, usePagination);
```

## Выделение строк (selection)

Иногда нужно выбирать отдельные строки таблицы. Для этого используйте хук useRowSelect.

```jsx
import { useTable, useRowSelect } from "react-table";

const tableInstance = useTable(
  { columns, data },
  useRowSelect,
  hooks => {
    // Добавляем колонку с чекбоксами
    hooks.visibleColumns.push(columns => [
      {
        id: 'selection',
        Header: ({ getToggleAllRowsSelectedProps }) => (
          <input type="checkbox" {...getToggleAllRowsSelectedProps()} />
        ),
        Cell: ({ row }) => (
          <input type="checkbox" {...row.getToggleRowSelectedProps()} />
        )
      },
      ...columns
    ]);
  }
);

const { selectedFlatRows } = tableInstance;

// Выводим выбранные строки
<div>
  Выбраны строки:
  <pre>
    {JSON.stringify(
      selectedFlatRows.map(row => row.original),
      null,
      2
    )}
  </pre>
</div>
```

Теперь пользователь сможет отмечать строки, как отдельно, так и все сразу.

## Кастомизация и расширение

Библиотека react-table — "headless", это значит, что вы определяете внешний вид ваших таблиц сами: как будут выглядеть ячейки, стиль заголовков, обработка событий. Ее возможности можно расширить библиотеками визуализации (например, styled-components) или UI-фреймворками.

### Поддержка TypeScript

Для работы с TypeScript react-table предоставляет типы для столбцов и данных.

```tsx
import { useTable, Column } from "react-table";

type Person = {
  firstName: string;
  age: number;
};

const columns: Column<Person>[] = [ /* ... */ ];
const data: Person[] = [ /* ... */ ];

const tableInstance = useTable<Person>({ columns, data });
```

Это позволяет использовать автодополнение и ловить ошибки типов уже на этапе написания кода.

## Продвинутые возможности

### Группировка строк (Grouping)

Можно объединять строки по какому-то признаку (например, по отделу):

```jsx
import { useTable, useGroupBy } from "react-table";

// В колонке укажите свойство "aggregate" для объединения данных
const columns = [
  {
    Header: "Отдел",
    accessor: "department",
    aggregate: 'count',
    Aggregated: ({ value }) => `${value} сотрудников`
  },
  // ...
];

const tableInstance = useTable({ columns, data }, useGroupBy);
```

### Виртуализация (отображение больших таблиц)

Когда количество данных велико, помогает виртуализация, сокращающая количество DOM-элементов на странице. Библиотека react-table легко комбинируется с react-window или react-virtualized.

```jsx
import { FixedSizeList } from "react-window";

<FixedSizeList
  height={400}
  itemCount={rows.length}
  itemSize={35}
>
  {({ index, style }) => {
    const row = rows[index];
    prepareRow(row);
    return (
      <div style={style} {...row.getRowProps()}>
        {row.cells.map(cell => (
          <div {...cell.getCellProps()}>{cell.render('Cell')}</div>
        ))}
      </div>
    );
  }}
</FixedSizeList>
```

Такой подход экономит ресурсы браузера и дает плавную прокрутку даже при тысяче и более строк.

### Работа с асинхронными и серверными данными

Таблицы часто работают не только с локальным массивом, но и с внешне подгружаемыми данными (например, с API). Вы полностью управляете загрузкой и фильтрацией данных, передавая нужное состояние фильтрации/сортировки и данные на сервер, а уже оттуда получая свежий набор строк.

Пример того, как реагировать на изменение фильтров и сортировки:

```jsx
// В useTable можно отслеживать изменения и подгружать свежие данные
const tableInstance = useTable({
  columns,
  data,
  manualSortBy: true, // сортировка на сервере
  manualFilters: true, // фильтрация на сервере
  manualPagination: true, // пагинация на сервере
  pageCount
}, useSortBy, useFilters, usePagination);

useEffect(() => {
  // Когда изменяются параметры - делайте запрос за новыми данными
  fetchData({ pageIndex, pageSize, sortBy, filters });
}, [pageIndex, pageSize, sortBy, filters]);
```

## Заключение

React-table — это мощный инструмент для создания гибких и производительных таблиц в React-приложениях. Благодаря использованию хуков и headless-архитектуре, вы получаете полный контроль над внешним видом и поведением, добавляя только те функции, что нужны именно вам. В статье вы увидели, как легко начать работу, подключить сортировку, фильтрацию, пагинацию, выделение строк и даже виртуализацию для огромных объемов данных. Используйте react-table, если вам важно сочетание производительности и гибкости в вашем проекте.

`react-table` упрощает работу с таблицами. Для создания сложных приложений требуется умение управлять состоянием и роутингом. На курсе [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-tablic-v-react-gaid-po-react-table) вы освоите все необходимые инструменты. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в основы React уже сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как изменить стиль таблицы, чтобы она была похожа на таблицу из Bootstrap или Material UI?

Вы сами контролируете разметку и стили столов react-table. Просто добавьте нужные классы к элементам таблицы (`className="table table-striped"`) или примените компоненты вашего UI-фреймворка вместо стандартных тегов `<table>`, `<tr>`, `<td>`. Для Material UI, например, оборачивайте таблицу компонентами `Table`, `TableRow`, `TableCell` и пробрасывайте необходимые props.

### Как обновлять данные таблицы при изменении данных во внешнем хранилище (например, Redux)?

Передавайте новые значения массива `data` в useTable через props. React-table автоматически обновит рендер таблицы при изменении данных. Следите за тем, чтобы массив `columns` оставался неизменяемым, иначе может произойти лишний ререндер.

### Можно ли реализовать редактирование ячеек прямо в таблице?

Да, для этого в описании колонки реализуйте кастомный рендерер в поле `Cell`, который будет рисовать не просто текст, а, например, `<input>` — с обработкой onChange и дальнейшим обновлением данных через state или другой механизм управления состоянием.

### Что делать, если таблица сжата и появляются горизонтальные полосы прокрутки?

Оберните таблицу в контейнер с `overflow-x: auto;` для горизонтального скролла. Для адаптивности и правильного рендера при большом числе колонок используйте CSS-свойства `table-layout: fixed;` и указывайте фиксированные ширины колонок.

### Как реализовать экспорт данных таблицы в Excel или CSV?

Для экспорта используйте сторонние библиотеки, такие как `xlsx`, `file-saver` или `papaparse`. Массив данных `data` можно легко передать в нужный формат, а затем скачать файл на клиенте. Например, для CSV с papaparse: `Papa.unparse(data)` и сохраните результат через Blob и file-saver.

