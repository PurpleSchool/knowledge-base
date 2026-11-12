---
metaTitle: "JavaScript Drag and Drop API — руководство с примерами"
metaDescription: "Как использовать Drag and Drop API в JavaScript: события dragstart, dragover, drop, объект DataTransfer, практические примеры сортировки и загрузки файлов."
author: "Антон Ларичев"
title: "JavaScript Drag and Drop API"
preview: "Полное руководство по Drag and Drop API: события перетаскивания, передача данных через DataTransfer, создание сортируемых списков и зон загрузки файлов."
---

## Что такое Drag and Drop API

Drag and Drop API — встроенный браузерный механизм, позволяющий пользователю перетаскивать элементы страницы и файлы из операционной системы. API реализован через набор DOM-событий и объект `DataTransfer`, который передаёт данные между источником и целевой зоной.

Важно понимать, что API разделяет ответственность на две части:

- **Источник** — элемент, который перетаскивают. Он генерирует события `dragstart`, `drag`, `dragend`.
- **Цель** — область, куда элемент бросают. Она получает события `dragenter`, `dragover`, `dragleave`, `drop`.

## Включение перетаскивания

По умолчанию перетаскивать можно только ссылки (`<a>`), изображения (`<img>`) и выделенный текст. Для любого другого элемента нужно явно добавить атрибут `draggable="true"`:

```html
<div class="card" draggable="true">Перетащи меня</div>
```

Через JavaScript:

```javascript
const card = document.querySelector('.card');
card.draggable = true;
```

Атрибут `draggable="false"` отключает перетаскивание даже для ссылок и изображений.

## События на источнике

### dragstart

Срабатывает в момент начала перетаскивания. Здесь нужно записать в `DataTransfer` те данные, которые хотите передать в зону сброса.

```javascript
const item = document.getElementById('item');

item.addEventListener('dragstart', (event) => {
  event.dataTransfer.setData('text/plain', item.id);
  event.dataTransfer.effectAllowed = 'move';
});
```

`effectAllowed` ограничивает допустимые операции: `'copy'`, `'move'`, `'link'`, `'copyMove'`, `'all'` и другие. Это значение браузер использует для выбора курсора.

### drag

Вызывается непрерывно в процессе перетаскивания (каждые несколько миллисекунд). Используется редко — обычно только для обновления позиции вспомогательного элемента.

```javascript
item.addEventListener('drag', (event) => {
  console.log(`Позиция: ${event.clientX}, ${event.clientY}`);
});
```

### dragend

Срабатывает после завершения перетаскивания — независимо от того, был ли выполнен сброс или нет. Удобно для очистки состояния.

```javascript
item.addEventListener('dragend', (event) => {
  item.classList.remove('dragging');

  if (event.dataTransfer.dropEffect === 'none') {
    console.log('Сброс не состоялся');
  }
});
```

`dropEffect` показывает, какая операция была применена: `'move'`, `'copy'`, `'link'` или `'none'`.

## События на цели

### dragenter и dragleave

`dragenter` срабатывает, когда перетаскиваемый элемент входит в зону сброса. `dragleave` — когда покидает её.

```javascript
const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragenter', (event) => {
  event.preventDefault();
  dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', (event) => {
  dropZone.classList.remove('active');
});
```

Обратите внимание: `dragleave` срабатывает и при перемещении курсора на дочерний элемент внутри зоны. Это частая причина мигания подсветки. Решение — проверять `relatedTarget`:

```javascript
dropZone.addEventListener('dragleave', (event) => {
  if (!dropZone.contains(event.relatedTarget)) {
    dropZone.classList.remove('active');
  }
});
```

### dragover

Вызывается непрерывно, пока элемент находится над зоной сброса. Это событие нужно перехватить и вызвать `preventDefault()` — иначе `drop` не сработает. По умолчанию браузер запрещает сброс.

```javascript
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
});
```

`dropEffect` на цели должен быть совместим с `effectAllowed` на источнике. Несовместимая комбинация делает сброс невозможным.

### drop

Срабатывает при отпускании кнопки мыши над зоной. Здесь происходит основная логика.

```javascript
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();

  const id = event.dataTransfer.getData('text/plain');
  const draggedElement = document.getElementById(id);

  dropZone.appendChild(draggedElement);
});
```

`event.preventDefault()` нужен, чтобы браузер не обрабатывал данные по умолчанию (например, не открывал файл).

## Объект DataTransfer

`DataTransfer` — ключевая часть API. Он доступен через `event.dataTransfer` во всех событиях перетаскивания.

### Запись и чтение данных

```javascript
// В dragstart
event.dataTransfer.setData('text/plain', 'текстовые данные');
event.dataTransfer.setData('application/json', JSON.stringify({ id: 1, name: 'Item' }));

// В drop
const text = event.dataTransfer.getData('text/plain');
const json = JSON.parse(event.dataTransfer.getData('application/json'));
```

Можно хранить несколько форматов одновременно. MIME-тип `text/plain` поддерживается везде; `application/json` или собственные типы вроде `application/my-app-item` можно использовать для передачи структурированных данных.

### Список форматов

```javascript
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();

  const types = event.dataTransfer.types;
  // ['text/plain', 'application/json']
  console.log(types);
});
```

### Кастомное изображение при перетаскивании

По умолчанию браузер отображает полупрозрачную копию элемента. Это можно изменить:

```javascript
item.addEventListener('dragstart', (event) => {
  const ghost = document.createElement('div');
  ghost.textContent = 'Перемещаю...';
  ghost.style.cssText = 'position:absolute; top:-9999px; padding:8px; background:#333; color:#fff;';
  document.body.appendChild(ghost);

  event.dataTransfer.setDragImage(ghost, 0, 0);
  event.dataTransfer.setData('text/plain', item.id);
});
```

`setDragImage(element, offsetX, offsetY)` принимает любой DOM-элемент и смещение курсора относительно него.

## Практический пример: сортируемый список

Одна из самых распространённых задач — список, элементы которого можно менять местами.

```html
<ul id="sortable">
  <li draggable="true" data-id="1">Пункт 1</li>
  <li draggable="true" data-id="2">Пункт 2</li>
  <li draggable="true" data-id="3">Пункт 3</li>
  <li draggable="true" data-id="4">Пункт 4</li>
</ul>
```

```javascript
const list = document.getElementById('sortable');
let draggedItem = null;

list.addEventListener('dragstart', (event) => {
  draggedItem = event.target;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', draggedItem.dataset.id);

  requestAnimationFrame(() => {
    draggedItem.classList.add('dragging');
  });
});

list.addEventListener('dragend', () => {
  draggedItem.classList.remove('dragging');
  draggedItem = null;

  document.querySelectorAll('#sortable li').forEach((li) => {
    li.classList.remove('over');
  });
});

list.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';

  const target = event.target.closest('li');
  if (!target || target === draggedItem) return;

  const rect = target.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;

  if (event.clientY < midY) {
    list.insertBefore(draggedItem, target);
  } else {
    list.insertBefore(draggedItem, target.nextSibling);
  }
});
```

Трюк с `requestAnimationFrame` нужен, потому что браузер снимает «снимок» элемента для превью в момент `dragstart`. Если немедленно добавить класс (например, скрывающий элемент), превью тоже будет пустым. Через `requestAnimationFrame` класс добавляется уже после снятия снимка.

## Перетаскивание файлов из операционной системы

Drag and Drop API работает не только с DOM-элементами. Пользователь может перетащить файлы прямо из файлового менеджера.

```html
<div id="file-drop" class="drop-zone">
  Перетащите файлы сюда
</div>
```

```javascript
const fileDropZone = document.getElementById('file-drop');

fileDropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  fileDropZone.classList.add('active');
});

fileDropZone.addEventListener('dragleave', (event) => {
  if (!fileDropZone.contains(event.relatedTarget)) {
    fileDropZone.classList.remove('active');
  }
});

fileDropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  fileDropZone.classList.remove('active');

  const files = event.dataTransfer.files;

  Array.from(files).forEach((file) => {
    console.log(`Файл: ${file.name}, размер: ${file.size} байт, тип: ${file.type}`);
    processFile(file);
  });
});

function processFile(file) {
  if (!file.type.startsWith('image/')) {
    console.warn('Принимаются только изображения');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = document.createElement('img');
    img.src = event.target.result;
    img.style.maxWidth = '200px';
    document.body.appendChild(img);
  };
  reader.readAsDataURL(file);
}
```

`event.dataTransfer.files` — объект типа `FileList`. Для работы с несколькими файлами его нужно преобразовать в массив через `Array.from()`.

Проверить наличие файлов ещё до сброса можно через `types`:

```javascript
fileDropZone.addEventListener('dragover', (event) => {
  if (!event.dataTransfer.types.includes('Files')) return;
  event.preventDefault();
});
```

## Визуальная обратная связь

Пользователь должен понимать, что происходит. Минимальный CSS для демонстрации состояний:

```css
.card {
  cursor: grab;
  transition: opacity 0.2s;
}

.card.dragging {
  opacity: 0.4;
  cursor: grabbing;
}

.drop-zone {
  border: 2px dashed #ccc;
  padding: 20px;
  transition: background-color 0.15s, border-color 0.15s;
}

.drop-zone.active {
  background-color: #f0f7ff;
  border-color: #3b82f6;
}
```

## Частые ошибки

**Забытый `preventDefault()` в `dragover`** — самая распространённая проблема. Без него событие `drop` не сработает никогда.

**Мигание `dragenter`/`dragleave` при дочерних элементах** — решается проверкой `relatedTarget` или счётчиком входов/выходов:

```javascript
let enterCount = 0;

zone.addEventListener('dragenter', () => {
  enterCount++;
  zone.classList.add('active');
});

zone.addEventListener('dragleave', () => {
  enterCount--;
  if (enterCount === 0) {
    zone.classList.remove('active');
  }
});

zone.addEventListener('drop', () => {
  enterCount = 0;
  zone.classList.remove('active');
});
```

**Утечка `dragend` при выходе за пределы окна** — если пользователь уронит элемент за пределы вкладки, `dragend` всё равно сработает. Не полагайтесь на `drop` для очистки, используйте `dragend`.

**Данные в `DataTransfer` доступны только в `dragstart` и `drop`** — в `dragover`, `dragenter` и `dragleave` прочитать данные нельзя, доступен только список `types`. Это ограничение безопасности браузера.

## Поддержка браузеров

Drag and Drop API поддерживается во всех современных браузерах. На мобильных устройствах поддержка ограничена — iOS и Android не реализуют нативный Drag and Drop для DOM-элементов. Для мобильных платформ используют альтернативы на основе событий `touchstart`, `touchmove`, `touchend` или библиотеки типа SortableJS.

Проверить поддержку:

```javascript
const isDnDSupported = 'draggable' in document.createElement('div');

if (!isDnDSupported) {
  console.warn('Drag and Drop не поддерживается в этом браузере');
}
```

---

Полное руководство по JavaScript, включая работу с DOM и событиями, доступно на курсе PurpleSchool: [JavaScript — полный курс](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=drag-and-drop-api)
