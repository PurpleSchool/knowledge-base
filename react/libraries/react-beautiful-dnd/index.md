---
metaTitle: React Beautiful DnD - перетаскивание элементов в React
metaDescription: Полное руководство по react-beautiful-dnd: установка, настройка drag and drop, вертикальные и горизонтальные списки, перетаскивание между контейнерами, кастомизация и TypeScript
author: Олег Марков
title: React Beautiful DnD - перетаскивание элементов
preview: Узнайте как реализовать красивое и доступное перетаскивание элементов в React с помощью react-beautiful-dnd. Вертикальные и горизонтальные списки, перетаскивание между контейнерами, кастомные стили и TypeScript примеры
---

## Введение

Drag and drop — один из самых интуитивных паттернов взаимодействия пользователя с интерфейсом. Канбан-доски, сортируемые списки задач, конструкторы интерфейсов — всё это невозможно представить без возможности перетаскивания.

**react-beautiful-dnd** — библиотека от Atlassian (создателей Jira и Trello), разработанная специально для создания красивых и доступных drag and drop интерфейсов в React. Библиотека фокусируется на производительности, доступности (accessibility) и естественной физике движения элементов.

Ключевые особенности react-beautiful-dnd:
- Естественная анимация при перетаскивании
- Полная поддержка клавиатурной навигации и screen reader
- Поддержка вертикальных и горизонтальных списков
- Перетаскивание между разными контейнерами
- Хорошая производительность без лишних ре-рендеров

> **Важное замечание**: react-beautiful-dnd находится в режиме поддержки (maintenance mode). Команда Atlassian перешла на новую библиотеку **@atlaskit/pragmatic-drag-and-drop**. Тем не менее, react-beautiful-dnd по-прежнему широко используется в production-проектах и является отличным выбором для большинства задач.

## Установка

```bash
npm install react-beautiful-dnd
# или
yarn add react-beautiful-dnd
```

Для TypeScript добавьте типы:

```bash
npm install --save-dev @types/react-beautiful-dnd
```

## Основные концепции

Перед тем как писать код, разберём три ключевых компонента библиотеки:

### DragDropContext

Корневой компонент, который оборачивает всю область, где будет происходить drag and drop. Он принимает коллбэки для обработки событий перетаскивания.

```jsx
<DragDropContext onDragEnd={handleDragEnd}>
  {/* дочерние компоненты */}
</DragDropContext>
```

### Droppable

Контейнер, в который можно бросить перетаскиваемый элемент. Каждый `Droppable` имеет уникальный `droppableId`.

```jsx
<Droppable droppableId="my-list">
  {(provided) => (
    <div ref={provided.innerRef} {...provided.droppableProps}>
      {/* элементы списка */}
      {provided.placeholder}
    </div>
  )}
</Droppable>
```

### Draggable

Отдельный перетаскиваемый элемент. Должен находиться внутри `Droppable`. Каждый `Draggable` имеет уникальный `draggableId` и `index`.

```jsx
<Draggable draggableId="item-1" index={0}>
  {(provided) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      Элемент списка
    </div>
  )}
</Draggable>
```

## Базовый пример: сортируемый список

Давайте создадим простой пример сортируемого списка задач:

```jsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const initialItems = [
  { id: 'item-1', content: 'Написать документацию' },
  { id: 'item-2', content: 'Сделать код-ревью' },
  { id: 'item-3', content: 'Исправить баги' },
  { id: 'item-4', content: 'Обновить зависимости' },
  { id: 'item-5', content: 'Написать тесты' },
];

// Вспомогательная функция для перестановки элементов в массиве
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

function TodoList() {
  const [items, setItems] = useState(initialItems);

  const handleDragEnd = (result) => {
    // result.destination может быть null, если элемент брошен вне зоны
    if (!result.destination) return;

    // Если позиция не изменилась, ничего не делаем
    if (result.destination.index === result.source.index) return;

    const reorderedItems = reorder(
      items,
      result.source.index,
      result.destination.index
    );

    setItems(reorderedItems);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="todo-list">
        {(provided) => (
          <ul
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ listStyle: 'none', padding: 0 }}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      padding: '12px 16px',
                      margin: '0 0 8px 0',
                      background: snapshot.isDragging ? '#e3f2fd' : '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxShadow: snapshot.isDragging
                        ? '0 4px 8px rgba(0,0,0,0.2)'
                        : '0 1px 3px rgba(0,0,0,0.1)',
                      cursor: 'grab',
                      ...provided.draggableProps.style,
                    }}
                  >
                    {item.content}
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default TodoList;
```

Обратите внимание на несколько важных деталей:
- `provided.innerRef` — ref, который нужно передать DOM-элементу
- `provided.droppableProps` / `provided.draggableProps` — атрибуты для корректной работы библиотеки
- `provided.dragHandleProps` — атрибуты для области, за которую тянут элемент (можно передать отдельному дочернему элементу)
- `provided.placeholder` — невидимый элемент, который сохраняет пространство при перетаскивании
- `snapshot.isDragging` — флаг, который указывает, что элемент сейчас перетаскивается

## Объект result в onDragEnd

Коллбэк `onDragEnd` получает объект `result` следующей структуры:

```javascript
{
  draggableId: 'item-1',     // ID перетаскиваемого элемента
  type: 'DEFAULT',            // тип перетаскиваемого элемента
  source: {
    droppableId: 'todo-list', // ID исходного контейнера
    index: 0,                  // исходный индекс
  },
  destination: {
    droppableId: 'todo-list', // ID целевого контейнера (null если бросили вне)
    index: 2,                  // целевой индекс
  },
  reason: 'DROP',             // причина завершения: 'DROP' или 'CANCEL'
}
```

## Перетаскивание между несколькими списками

Одна из самых популярных задач — канбан-доска с несколькими колонками. Рассмотрим, как реализовать перетаскивание элементов между контейнерами:

```jsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const initialData = {
  tasks: {
    'task-1': { id: 'task-1', content: 'Планирование спринта' },
    'task-2': { id: 'task-2', content: 'Разработка API' },
    'task-3': { id: 'task-3', content: 'Вёрстка интерфейса' },
    'task-4': { id: 'task-4', content: 'Написание тестов' },
    'task-5': { id: 'task-5', content: 'Деплой на production' },
  },
  columns: {
    'column-todo': {
      id: 'column-todo',
      title: 'К выполнению',
      taskIds: ['task-1', 'task-2', 'task-3'],
    },
    'column-inprogress': {
      id: 'column-inprogress',
      title: 'В работе',
      taskIds: ['task-4'],
    },
    'column-done': {
      id: 'column-done',
      title: 'Готово',
      taskIds: ['task-5'],
    },
  },
  columnOrder: ['column-todo', 'column-inprogress', 'column-done'],
};

function KanbanBoard() {
  const [data, setData] = useState(initialData);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // Элемент брошен вне зоны droppable
    if (!destination) return;

    // Элемент вернулся на то же место
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const sourceColumn = data.columns[source.droppableId];
    const destColumn = data.columns[destination.droppableId];

    if (sourceColumn === destColumn) {
      // Перетаскивание внутри одной колонки
      const newTaskIds = Array.from(sourceColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...sourceColumn, taskIds: newTaskIds };

      setData({
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      });
    } else {
      // Перетаскивание между колонками
      const sourceTaskIds = Array.from(sourceColumn.taskIds);
      sourceTaskIds.splice(source.index, 1);
      const newSourceColumn = { ...sourceColumn, taskIds: sourceTaskIds };

      const destTaskIds = Array.from(destColumn.taskIds);
      destTaskIds.splice(destination.index, 0, draggableId);
      const newDestColumn = { ...destColumn, taskIds: destTaskIds };

      setData({
        ...data,
        columns: {
          ...data.columns,
          [newSourceColumn.id]: newSourceColumn,
          [newDestColumn.id]: newDestColumn,
        },
      });
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '16px' }}>
        {data.columnOrder.map((columnId) => {
          const column = data.columns[columnId];
          const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

          return (
            <Column key={column.id} column={column} tasks={tasks} />
          );
        })}
      </div>
    </DragDropContext>
  );
}

function Column({ column, tasks }) {
  return (
    <div
      style={{
        background: '#f4f5f7',
        borderRadius: '4px',
        padding: '8px',
        width: '250px',
      }}
    >
      <h3 style={{ padding: '8px', margin: 0 }}>{column.title}</h3>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              background: snapshot.isDraggingOver ? '#e2e8f0' : 'transparent',
              padding: '4px',
              minHeight: '100px',
              transition: 'background 0.2s ease',
            }}
          >
            {tasks.map((task, index) => (
              <Task key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function Task({ task, index }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            userSelect: 'none',
            padding: '12px',
            margin: '0 0 8px 0',
            background: snapshot.isDragging ? '#ffecb3' : 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: snapshot.isDragging
              ? '0 5px 15px rgba(0,0,0,0.2)'
              : 'none',
            ...provided.draggableProps.style,
          }}
        >
          {task.content}
        </div>
      )}
    </Draggable>
  );
}

export default KanbanBoard;
```

Здесь ключевой момент в обработчике `handleDragEnd` — мы различаем два случая: перетаскивание внутри одной колонки и перетаскивание между разными колонками, и обновляем состояние соответственно.

## Горизонтальные списки

По умолчанию `Droppable` работает в вертикальном режиме. Для горизонтального перетаскивания используйте атрибут `direction="horizontal"`:

```jsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const initialCards = [
  { id: 'card-1', color: '#ff6b6b', label: 'Красный' },
  { id: 'card-2', color: '#ffd93d', label: 'Жёлтый' },
  { id: 'card-3', color: '#6bcb77', label: 'Зелёный' },
  { id: 'card-4', color: '#4d96ff', label: 'Синий' },
  { id: 'card-5', color: '#c77dff', label: 'Фиолетовый' },
];

function HorizontalList() {
  const [cards, setCards] = useState(initialCards);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newCards = Array.from(cards);
    const [removed] = newCards.splice(result.source.index, 1);
    newCards.splice(result.destination.index, 0, removed);
    setCards(newCards);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="horizontal-list" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              display: 'flex',
              gap: '8px',
              padding: '16px',
              overflowX: 'auto',
            }}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      width: '80px',
                      height: '80px',
                      background: card.color,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      opacity: snapshot.isDragging ? 0.8 : 1,
                      transform: snapshot.isDragging ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 0.2s',
                      ...provided.draggableProps.style,
                    }}
                  >
                    {card.label}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default HorizontalList;
```

## Разделение области перетаскивания и области захвата

Иногда нужно, чтобы пользователь мог перетаскивать элемент только за определённую часть (например, иконку хэндла), а не за весь элемент. Для этого `dragHandleProps` передаётся отдельному дочернему элементу:

```jsx
function TaskWithHandle({ task, index }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            margin: '0 0 8px 0',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            ...provided.draggableProps.style,
          }}
        >
          {/* Только эта часть является областью захвата */}
          <span
            {...provided.dragHandleProps}
            style={{
              marginRight: '12px',
              cursor: 'grab',
              color: '#aaa',
              fontSize: '20px',
            }}
          >
            ⠿
          </span>
          <span style={{ flex: 1 }}>{task.content}</span>
          <button onClick={() => console.log('delete', task.id)}>✕</button>
        </div>
      )}
    </Draggable>
  );
}
```

## Отключение перетаскивания

Иногда нужно запретить перетаскивание определённых элементов. Используйте атрибут `isDragDisabled`:

```jsx
<Draggable
  draggableId={item.id}
  index={index}
  isDragDisabled={item.isLocked}  // если true — перетаскивание заблокировано
>
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        opacity: item.isLocked ? 0.5 : 1,
        cursor: item.isLocked ? 'not-allowed' : 'grab',
        ...provided.draggableProps.style,
      }}
    >
      {item.isLocked && <span>🔒 </span>}
      {item.content}
    </div>
  )}
</Draggable>
```

Аналогично можно отключить возможность бросить элемент в конкретный контейнер с помощью `isDropDisabled` у `Droppable`:

```jsx
<Droppable
  droppableId="archive"
  isDropDisabled={isArchiveLocked}
>
  {/* ... */}
</Droppable>
```

## TypeScript поддержка

С TypeScript ваш код будет выглядеть так:

```typescript
import React, { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from 'react-beautiful-dnd';

interface Item {
  id: string;
  content: string;
}

const reorder = (list: Item[], startIndex: number, endIndex: number): Item[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

function TypedDraggableList() {
  const [items, setItems] = useState<Item[]>([
    { id: 'item-1', content: 'Задача 1' },
    { id: 'item-2', content: 'Задача 2' },
    { id: 'item-3', content: 'Задача 3' },
  ]);

  const handleDragEnd = (result: DropResult): void => {
    if (!result.destination) return;

    const reorderedItems = reorder(
      items,
      result.source.index,
      result.destination.index
    );

    setItems(reorderedItems);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="typed-list">
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              background: snapshot.isDraggingOver ? '#f0f4ff' : '#f9f9f9',
              padding: '8px',
              borderRadius: '4px',
            }}
          >
            {items.map((item: Item, index: number) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(
                  provided: DraggableProvided,
                  snapshot: DraggableStateSnapshot
                ) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      padding: '12px',
                      margin: '0 0 8px 0',
                      background: snapshot.isDragging ? '#e8f4fd' : 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      ...provided.draggableProps.style,
                    }}
                  >
                    {item.content}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default TypedDraggableList;
```

## Продвинутые техники

### Обработка событий перетаскивания

Помимо `onDragEnd`, `DragDropContext` поддерживает дополнительные коллбэки:

```jsx
<DragDropContext
  onDragStart={(start) => {
    // Вызывается в начале перетаскивания
    console.log('Начало перетаскивания:', start.draggableId);
  }}
  onDragUpdate={(update) => {
    // Вызывается при движении элемента над новой позицией
    console.log('Обновление позиции:', update.destination?.index);
  }}
  onDragEnd={(result) => {
    // Обязательный коллбэк — вызывается при завершении
    handleDragEnd(result);
  }}
>
  {/* ... */}
</DragDropContext>
```

### Типы перетаскиваемых элементов

Когда у вас несколько разных зон droppable, можно ограничить, какие элементы можно бросить в какие контейнеры, используя атрибут `type`:

```jsx
// Только задачи можно перетаскивать в колонки
<Droppable droppableId="column-1" type="TASK">
  {/* ... */}
</Droppable>

// Только колонки можно перетаскивать в доску
<Droppable droppableId="board" type="COLUMN" direction="horizontal">
  {/* ... */}
</Droppable>

// Перетаскиваемые задачи
<Draggable draggableId="task-1" index={0} type="TASK">
  {/* ... */}
</Draggable>

// Перетаскиваемые колонки
<Draggable draggableId="column-1" index={0} type="COLUMN">
  {/* ... */}
</Draggable>
```

### Вложенные списки

Для создания вложенных drag and drop (например, задачи внутри колонок, а колонки тоже можно переставлять) используйте разные типы:

```jsx
function NestedBoard() {
  const [columns, setColumns] = useState(initialColumns);

  const handleDragEnd = (result) => {
    const { type, destination, source } = result;

    if (!destination) return;

    if (type === 'COLUMN') {
      // Переставляем колонки
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);
      setColumns(newColumns);
    } else if (type === 'TASK') {
      // Переставляем задачи
      // ... логика перестановки задач между колонками
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Droppable для колонок */}
      <Droppable droppableId="board" type="COLUMN" direction="horizontal">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}
            style={{ display: 'flex', gap: '16px' }}>
            {columns.map((column, index) => (
              <Draggable key={column.id} draggableId={column.id} index={index}
                type="COLUMN">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps}>
                    {/* Хэндл для колонки */}
                    <div {...provided.dragHandleProps}
                      style={{ padding: '8px', cursor: 'grab', background: '#ddd' }}>
                      {column.title}
                    </div>
                    {/* Droppable для задач внутри колонки */}
                    <Droppable droppableId={column.id} type="TASK">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          style={{ minHeight: '100px', padding: '8px' }}>
                          {column.tasks.map((task, taskIndex) => (
                            <Draggable key={task.id} draggableId={task.id}
                              index={taskIndex} type="TASK">
                              {(provided) => (
                                <div ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    padding: '8px', margin: '4px 0',
                                    background: 'white', borderRadius: '4px',
                                    ...provided.draggableProps.style
                                  }}>
                                  {task.content}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

## Доступность (Accessibility)

Одно из главных преимуществ react-beautiful-dnd — встроенная поддержка доступности. Библиотека автоматически:
- Добавляет `aria` атрибуты к перетаскиваемым элементам
- Поддерживает клавиатурную навигацию (Space для захвата, стрелки для перемещения, Enter для сброса)
- Объявляет действия через screen reader

Вы можете кастомизировать объявления для screen reader:

```jsx
<DragDropContext
  onDragEnd={handleDragEnd}
  // Кастомные сообщения для screen reader
  liftInstruction="Нажмите пробел, чтобы поднять элемент"
>
  {/* ... */}
</DragDropContext>
```

## Частые ошибки и их решение

### Ошибка: "Invariant failed: Cannot find droppable entry with id"

Эта ошибка возникает, если вы динамически меняете список droppable-контейнеров. Убедитесь, что все `Droppable` рендерятся стабильно при перетаскивании.

### Ошибка: "Each child in a list should have a unique key"

Убедитесь, что `key` у компонента `Draggable` совпадает с `draggableId`:

```jsx
// Правильно
<Draggable key={item.id} draggableId={item.id} index={index}>

// Неправильно — разные значения
<Draggable key={index} draggableId={item.id} index={index}>
```

### Проблема с производительностью

Если список большой и ре-рендерится слишком часто, используйте `React.memo` для оптимизации:

```jsx
const TaskItem = React.memo(function TaskItem({ task, index }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
        >
          {task.content}
        </div>
      )}
    </Draggable>
  );
});
```

### Проблема с портала и фиксированным позиционированием

Если ваш список находится внутри элемента с `overflow: hidden` или `transform`, перетаскиваемый элемент может обрезаться. В этом случае используйте `ReactDOM.createPortal`:

```jsx
import { createPortal } from 'react-dom';

function PortalAwareDraggable({ task, index }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => {
        const child = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={provided.draggableProps.style}
          >
            {task.content}
          </div>
        );

        // При перетаскивании — рендерим в portal
        if (snapshot.isDragging) {
          return createPortal(child, document.body);
        }

        return child;
      }}
    </Draggable>
  );
}
```

## Сравнение с альтернативами

| Библиотека | Плюсы | Минусы |
|---|---|---|
| react-beautiful-dnd | Красивые анимации, доступность, простой API | Maintenance mode, ограничена вертикальными/горизонтальными списками |
| dnd-kit | Активно поддерживается, гибкий | Более сложный API |
| react-dnd | Мощный, гибкий | Крутая кривая обучения, много шаблонного кода |
| @atlaskit/pragmatic-drag-and-drop | Новое решение от Atlassian | Меньше документации и примеров |

## Заключение

React Beautiful DnD — отличный выбор для создания интуитивных drag and drop интерфейсов в React. Несмотря на то, что библиотека перешла в режим поддержки, она остаётся зрелым и стабильным решением с богатой документацией и большим сообществом.

Ключевые выводы:
- Три основных компонента: `DragDropContext`, `Droppable`, `Draggable`
- Для перетаскивания между списками обновляйте состояние в `onDragEnd`
- Используйте `snapshot.isDragging` для визуальной обратной связи
- Разделяйте `draggableProps` и `dragHandleProps` для более гибкого UX
- Используйте `type` для разграничения разных видов перетаскиваемых элементов
- `React.memo` помогает избежать лишних ре-рендеров

Для новых проектов рассмотрите **dnd-kit** как более современную альтернативу, но если вы работаете с существующей кодовой базой или хотите быстро получить работающее решение — react-beautiful-dnd отлично справится с задачей.
