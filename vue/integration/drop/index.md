---
metaTitle: 3 примера реализации drag-and-drop во Vue
metaDescription: В статье вы найдете три наглядных примера drag-and-drop во Vue - от базового перетаскивания до сложных кейсов с сортировкой и использованием сторонних библиотек
author: Олег Марков
title: 3 примера реализации drag-and-drop во Vue
preview: Научитесь реализовывать drag-and-drop во Vue на понятных примерах - сортировка списков, перенос данных между контейнерами и интеграция drag-and-drop библиотек
---

## Введение

Drag-and-drop, или перетаскивание элементов, — важная часть многих современных веб-приложений. Возможность перетаскивать задачи между списками, сортировать товарные карточки или собирать корзину покупок делает пользовательский интерфейс интуитивно понятным и удобным. В этой статье я покажу вам три разных способа реализовать drag-and-drop во Vue: начнем с базового перетаскивания с помощью стандартных HTML5 API, затем рассмотрим сортировку сложного списка, а в третьем примере используем одну из популярных drag-and-drop библиотек для Vue.

Каждый пример мы разберем подробно, чтобы вы могли сразу повторить его у себя – с разбором ключевых моментов, особенностей и потенциальных проблем. Также я подготовил комментарии прямо в коде, чтобы вы не запутались, даже если только начинаете знакомиться с Vue.

---

## Пример 1. Базовый drag-and-drop на чистом Vue без сторонних библиотек

Часто для drag-and-drop достаточно базовых возможностей браузера — это быстро и подходит для большинства задач, где не нужна сложная логика сортировки списка. Давайте разберем рабочий пример, где вы сможете перетаскивать элементы списка из одного контейнера в другой.

### Исходные данные

Допустим, у нас есть два списка: "доступные элементы" и "выбранные элементы". Задача — перемещать элементы между этими списками с помощью drag-and-drop.

Вот шаблон компонента:

```vue
<template>
  <div class="dnd-container">
    <div class="list" 
         @dragover.prevent
         @drop="onDropList('available')">
      <h4>Доступные</h4>
      <div v-for="item in availableItems"
           :key="item.id"
           class="list-item"
           draggable="true"
           @dragstart="onDragStart(item, 'available')">
        {{ item.name }}
      </div>
    </div>
    <div class="list"
         @dragover.prevent
         @drop="onDropList('selected')">
      <h4>Выбранные</h4>
      <div v-for="item in selectedItems"
           :key="item.id"
           class="list-item"
           draggable="true"
           @dragstart="onDragStart(item, 'selected')">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>
```

#### JavaScript часть компонента:

```js
<script>
export default {
  data() {
    return {
      availableItems: [
        { id: 1, name: 'Элемент 1' },
        { id: 2, name: 'Элемент 2' },
        { id: 3, name: 'Элемент 3' }
      ],
      selectedItems: [],
      dragItem: null, // Здесь храним перетаскиваемый элемент и его место
      dragList: ''
    }
  },
  methods: {
    onDragStart(item, listType) {
      // Запоминаем, что именно перетаскиваем
      this.dragItem = item
      this.dragList = listType
    },
    onDropList(targetList) {
      if (!this.dragItem) return
      // Определяем исходный и целевой списки
      let fromList, toList
      if (this.dragList === 'available' && targetList === 'selected') {
        fromList = this.availableItems
        toList   = this.selectedItems
      } else if (this.dragList === 'selected' && targetList === 'available') {
        fromList = this.selectedItems
        toList   = this.availableItems
      } else { 
        return // Нельзя перенести сам в себя
      }
      // Удаляем из исходного списка
      const index = fromList.findIndex(item => item.id === this.dragItem.id)
      if (index !== -1) {
        const [movedItem] = fromList.splice(index, 1)
        // Добавляем в целевой список
        toList.push(movedItem)
      }
      // Очищаем dragItem
      this.dragItem = null
    }
  }
}
</script>
```

#### CSS (для наглядности):

```css
.dnd-container {
  display: flex;
  gap: 32px;
}
.list {
  width: 150px;
  border: 1px solid #ccc;
  min-height: 120px;
  padding: 10px;
  border-radius: 4px;
}
.list-item {
  padding: 8px;
  margin-bottom: 6px;
  background: #f1f1f1;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: grab;
}
```

### Ключевые детали реализации

- Атрибут `draggable="true"` позволяет делать любой элемент "перетаскиваемым".
- Обработчик `@dragstart` нужен, чтобы Vue запомнил, что именно перетаскивается.
- Событие `@dragover.prevent` на контейнере не даёт браузеру отклонять дроп.
- Событие `@drop` переносит элемент из одного массива во второй.

Такой подход подойдет для простых интерфейсов без сортировки внутри списка.

---

## Пример 2. Drag-and-drop сортировка элементов в списке

Теперь давайте усложним задачу: реализуем сортировку списка с помощью drag-and-drop. Пользователь должен иметь возможность менять порядок элементов прямо в списке.

### Шаблон компонента

```vue
<template>
  <div class="sortable-list">
    <div v-for="(item, idx) in items"
         :key="item.id"
         class="sortable-item"
         draggable="true"
         @dragstart="onDragStart(idx)"
         @dragover.prevent="onDragOver(idx)"
         @drop="onDrop(idx)"
         :class="{ 'drag-over': idx === dragOverIndex }">
      {{ item.name }}
    </div>
  </div>
</template>
```

### JavaScript

```js
<script>
export default {
  data() {
    return {
      items: [
        { id: 101, name: 'Карточка A' },
        { id: 102, name: 'Карточка B' },
        { id: 103, name: 'Карточка C' }
      ],
      dragStartIndex: null, // Индекс элемента, который перетаскиваем
      dragOverIndex: null  // Индекс элемента, над которым находимся
    }
  },
  methods: {
    onDragStart(idx) {
      // Запоминаем, с какого индекса начали перетаскивание
      this.dragStartIndex = idx
    },
    onDragOver(idx) {
      // При наведении устанавливаем индекс поверх которого перетаскиваем
      this.dragOverIndex = idx
    },
    onDrop(idx) {
      if (this.dragStartIndex === null) return
      // Получаем копию массива
      const movedItem = this.items[this.dragStartIndex]
      this.items.splice(this.dragStartIndex, 1) // Удаляем элемент, который двигаем
      this.items.splice(idx, 0, movedItem) // Вставляем на новое место
      // Сбрасываем индексы
      this.dragStartIndex = null
      this.dragOverIndex = null
    }
  }
}
</script>
```

### Немного стилей для видимости

```css
.sortable-list {
  width: 280px;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 7px;
  background: #fafafa;
}
.sortable-item {
  padding: 10px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: move;
  transition: background .24s;
}
.sortable-item.drag-over {
  background: #e0fcff;
}
```

### В чём суть реализации

- Для каждого элемента списка добавляем обработчики `@dragstart`, `@dragover.prevent` и `@drop`.
- Перетаскиваемый элемент определяется по его индексу.
- На событии drop удаляем перетаскиваемый элемент из текущей позиции и вставляем в новую.
- Для визуализации наведения используем динамический класс drag-over.

Обратите внимание: у такого подхода есть ограничения по производительности на больших списках и по универсальности. Для сложных кейсов лучше использовать сторонние библиотеки.

---

## Пример 3. Drag-and-drop через библиотеку vue-draggable-next

Когда необходимо реализовать drag-and-drop с расширенными возможностями (например, поддержка каскадной сортировки, drag handle, ограничение по областям и т.д.), стоит воспользоваться библиотекой.

Очень популярна для Vue 3 библиотека [vue-draggable-next](https://github.com/SortableJS/vue.draggable.next) — это адаптация SortableJS под Vue.

### Установка библиотеки

Сначала устанавливаем пакет:

```bash
npm install vuedraggable@next
```

### Использование

Разберем кейс сортировки списка задач с drag-and-drop:

```vue
<template>
  <div>
    <Draggable 
      v-model="tasks"
      group="tasks"
      item-key="id"
      @end="onChangeOrder"
      ghost-class="dragged-placeholder"
    >
      <template #item="{element}">
        <div class="task-item">
          {{ element.title }}
        </div>
      </template>
    </Draggable>
  </div>
</template>
```

### JS-часть

```js
<script>
import Draggable from "vuedraggable"

export default {
  components: { Draggable },
  data() {
    return {
      tasks: [
        { id: 1, title: 'Написать документацию' },
        { id: 2, title: 'Встретиться с командой' },
        { id: 3, title: 'Запустить тесты' }
      ]
    }
  },
  methods: {
    onChangeOrder(evt) {
      // evt - объект события библиотеки, можно использовать для логирования
      // после изменения порядка tasks уже обновится
      console.log('Новый порядок:', this.tasks)
    }
  }
}
</script>
```

### CSS-пример

```css
.task-item {
  padding: 12px 16px;
  margin-bottom: 10px;
  background: #f7fdff;
  border: 1px solid #b2e4fa;
  border-radius: 4px;
  transition: box-shadow .2s;
}
.dragged-placeholder {
  background: #e2edfa !important;
  border-style: dashed !important;
}
```

### Ключевые достоинства подхода

- Простота — достаточно использовать компонент Draggable и v-model.
- В библиотеке реализована обработка событий, например, onStart, onEnd, onAdd и т.д.
- Работа со вложенными списками, drag handle, блокировка элементов, кастомизация поведения.
- Можно использовать между несколькими контейнерами (drag между списками).

### Расширенные возможности

Пример работы с переносом задач между двумя списками:

```vue
<template>
  <div class="kanban-columns">
    <Draggable v-model="todo"
               group="shared"
               item-key="id"
               class="kanban-col"
               :clone="cloneTask">
      <template #item="{element}">
        <div class="task">{{element.title}}</div>
      </template>
      <div slot="header">TODO</div>
    </Draggable>
    <Draggable v-model="done"
               group="shared"
               item-key="id"
               class="kanban-col"
               :clone="cloneTask">
      <template #item="{element}">
        <div class="task">{{element.title}}</div>
      </template>
      <div slot="header">DONE</div>
    </Draggable>
  </div>
</template>

<script>
import Draggable from 'vuedraggable'
export default {
  data() {
    return {
      todo: [
        {id: 1, title: 'Выучить Vue'},
        {id: 2, title: 'Поработать с draggable'}
      ],
      done: [
        {id: 3, title: 'Позавтракать'}
      ]
    }
  },
  components: {Draggable},
  methods: {
    cloneTask(task) {
      // Создает копию объекта задачи при переносе между колонками. 
      // В некоторых кейсах нужно, чтобы не мутировать исходник.
      return {...task}
    }
  }
}
</script>
```

### Когда стоит использовать библиотеку?

- Когда необходимы сложные сценарии drag-and-drop (например, вложенность, много колонок, высокий уровень детализации поведения).
- Если нужны расширения вроде кастомизации placeholder, drag handle, предотвращения перемещений.
- Для больших проектов с широкой аудиторией.

---

## Заключение

Мы рассмотрели три подхода к реализации drag-and-drop во Vue: от простейшего способа на стандартных событиях HTML5, до сортировки со сменой порядка элементов и, наконец, использование специализированной библиотеки vue-draggable-next. Каждый из способов подходит для своих задач — выбор зависит от ваших требований к функциональности, объему кода и необходимости поддержки сложных кейсов.

Для минимальных интерфейсов подходит первый способ, второй — для сортировки внутри одного списка, а третий — когда нужен масштабируемый и расширяемый drag-and-drop функционал.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как реализовать drag-and-drop между двумя разными компонентами во Vue?

Чтобы реализовать drag-and-drop между независимыми компонентами, нужно хранить состояние (например, перетаскиваемый элемент) на уровне родителя или глобального состояния (Vuex, Pinia), и триггерить изменения списков через props/events или store. В dragstart сообщайте родителю о начале перетаскивания, в drop — какой элемент и куда переместить.

---

### Как предотвратить перенос одних и тех же элементов несколько раз?

Проверьте, нет ли повторного добавления элемента в массив при drop. В обработчике drop ищите элемент по id в целевом массиве — если найден, не добавляйте второй раз, либо, для уникальных коллекций, используйте Set.

---

### Как добавить визуальную подсветку места вставки при сортировке drag-and-drop?

Добавьте динамический класс (например, drag-over) к элементу списка, над которым сейчас находится курсор (dragOverIndex в примере выше). Через CSS измените фон или бордер у этого элемента для наглядной подсветки.

---

### Почему в некоторых браузерах drag-and-drop не работает на мобильных устройствах?

HTML5 drag-and-drop API работает только на десктопах. Для мобильных устройств используйте библиотеки, поддерживающие touch-события (например, vue-draggable-next, сортировка на основе SortableJS). Альтернативно реализуйте touchmove/touchend обработчики для мобильных drag-and-drop.

---

### Как реализовать drag handle (зона для перетаскивания) во Vue?

В компонентах вроде draggable можно задать параметр handle у текущего элемента, указывая селектор — только эта часть элемента будет реагировать на захват. Если пишете drag-and-drop сами — навесьте draggable и dragstart только на нужный вложенный элемент (кнопку/иконку).

---