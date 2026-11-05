---
metaTitle: "CSS Custom Highlight API в JavaScript — подсветка текста"
metaDescription: "Как использовать CSS Custom Highlight API для подсветки произвольных текстовых диапазонов через JavaScript и псевдоэлемент ::highlight()."
author: "Антон Ларичев"
title: "CSS Custom Highlight API — кастомная подсветка текста"
preview: "Разбираем CSS Custom Highlight API: создаём диапазоны Range, регистрируем Highlight и стилизуем текст через ::highlight() без изменения DOM."
---

## Что такое CSS Custom Highlight API

CSS Custom Highlight API — браузерный интерфейс, позволяющий подсвечивать произвольные текстовые диапазоны на странице без изменения структуры DOM. Вместо оборачивания текста в `<span>` или других манипуляций с разметкой вы создаёте объекты `Range`, регистрируете их как именованную подсветку через `CSS.highlights` и стилизуете псевдоэлементом `::highlight()` в CSS.

Это особенно полезно для:

- поиска и подсветки совпадений в большом тексте;
- редакторов кода с синтаксической подсветкой;
- аннотаций и выделений в читалках;
- образовательных инструментов, где нужно акцентировать части текста.

## Поддержка браузерами

API поддерживается в Chromium-браузерах начиная с версии 105 и в Safari 17.2+. Firefox реализовал поддержку в версии 117. Перед использованием в продакшне проверяйте актуальную таблицу совместимости и предусматривайте фолбэк.

Проверка доступности API:

```javascript
if (CSS.highlights) {
  console.log('Custom Highlight API поддерживается');
} else {
  console.warn('Custom Highlight API не поддерживается в этом браузере');
}
```

## Ключевые объекты API

Прежде чем писать код, нужно понять три сущности:

**Range** — стандартный браузерный объект, описывающий диапазон документа: от какого узла и смещения до какого. Это не новый класс — он существует давно и используется в Selection API.

**Highlight** — новый класс, представляющий именованную подсветку. Принимает один или несколько объектов `Range` и хранит их как коллекцию.

**CSS.highlights** — глобальный реестр типа `HighlightRegistry`. Работает как `Map`: ключ — строковое имя подсветки, значение — экземпляр `Highlight`. Именно это имя используется в CSS-псевдоэлементе `::highlight(name)`.

## Базовый пример

Предположим, есть абзац текста и нужно подсветить слово «JavaScript»:

```html
<p id="text">
  JavaScript — язык программирования для веба. JavaScript выполняется
  в браузере и позволяет делать страницы интерактивными.
</p>
```

Сначала находим все вхождения слова и создаём для каждого диапазон `Range`:

```javascript
const textNode = document.getElementById('text').firstChild;
const text = textNode.textContent;
const keyword = 'JavaScript';
const ranges = [];

let startIndex = 0;
while (true) {
  const index = text.indexOf(keyword, startIndex);
  if (index === -1) break;

  const range = new Range();
  range.setStart(textNode, index);
  range.setEnd(textNode, index + keyword.length);
  ranges.push(range);

  startIndex = index + keyword.length;
}
```

Затем создаём подсветку и регистрируем её:

```javascript
const highlight = new Highlight(...ranges);
CSS.highlights.set('keyword', highlight);
```

И стилизуем в CSS:

```css
::highlight(keyword) {
  background-color: #ffe066;
  color: #333;
}
```

Вот и всё — текст подсвечен, DOM не тронут.

## Поиск по всему документу

Если текст разбит по нескольким узлам (например, есть вложенные теги), нужно обойти все текстовые узлы. Вспомогательная функция с `TreeWalker`:

```javascript
function getAllTextNodes(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  return nodes;
}

function highlightText(root, keyword, highlightName) {
  CSS.highlights.delete(highlightName);

  if (!keyword) return;

  const textNodes = getAllTextNodes(root);
  const ranges = [];

  for (const node of textNodes) {
    const text = node.textContent;
    let startIndex = 0;

    while (true) {
      const index = text.toLowerCase().indexOf(keyword.toLowerCase(), startIndex);
      if (index === -1) break;

      const range = new Range();
      range.setStart(node, index);
      range.setEnd(node, index + keyword.length);
      ranges.push(range);

      startIndex = index + keyword.length;
    }
  }

  if (ranges.length > 0) {
    CSS.highlights.set(highlightName, new Highlight(...ranges));
  }
}
```

Использование:

```javascript
const container = document.getElementById('content');

document.getElementById('search').addEventListener('input', (e) => {
  highlightText(container, e.target.value, 'search-result');
});
```

```css
::highlight(search-result) {
  background-color: #4fc3f7;
  color: #000;
}
```

## Несколько именованных подсветок

API поддерживает произвольное количество именованных подсветок одновременно. Это позволяет, например, одновременно показывать результаты поиска и пользовательские аннотации:

```javascript
// Подсветка результатов поиска
CSS.highlights.set('search', new Highlight(...searchRanges));

// Подсветка ошибок грамматики
CSS.highlights.set('grammar-error', new Highlight(...errorRanges));

// Подсветка выбранных пользователем фрагментов
CSS.highlights.set('user-annotation', new Highlight(...annotationRanges));
```

```css
::highlight(search) {
  background-color: #fff59d;
}

::highlight(grammar-error) {
  text-decoration: underline wavy red;
  background-color: transparent;
}

::highlight(user-annotation) {
  background-color: #c8e6c9;
  color: #1b5e20;
}
```

Когда диапазоны разных подсветок перекрываются, браузер применяет стили всех подходящих подсветок. Порядок приоритетов определяется свойством `priority` у экземпляра `Highlight`.

## Приоритеты подсветок

Если два диапазона пересекаются и оба задают, например, цвет фона, побеждает подсветка с бо́льшим значением `priority`:

```javascript
const searchHighlight = new Highlight(...searchRanges);
searchHighlight.priority = 1;

const annotationHighlight = new Highlight(...annotationRanges);
annotationHighlight.priority = 0;

CSS.highlights.set('search', searchHighlight);
CSS.highlights.set('annotation', annotationHighlight);
```

По умолчанию `priority` равен `0`. Чем выше число, тем выше приоритет при конфликте стилей.

## Динамическое обновление

Объект `Highlight` реализует интерфейс `Set`. Это значит, что диапазоны можно добавлять, удалять и перебирать:

```javascript
const highlight = new Highlight();
CSS.highlights.set('dynamic', highlight);

// Добавить диапазон позже
const newRange = new Range();
newRange.setStart(node, 0);
newRange.setEnd(node, 10);
highlight.add(newRange);

// Удалить конкретный диапазон
highlight.delete(existingRange);

// Очистить все диапазоны
highlight.clear();
```

Обновление происходит реактивно: как только вы изменяете `Highlight`, браузер немедленно перерисовывает подсветку. Нет необходимости повторно вызывать `CSS.highlights.set()`.

## Удаление подсветок

```javascript
// Удалить конкретную подсветку по имени
CSS.highlights.delete('search');

// Удалить все зарегистрированные подсветки
CSS.highlights.clear();
```

Вызывать `delete` перед повторной регистрацией той же подсветки — хорошая практика, иначе диапазоны накапливаются:

```javascript
function updateSearchHighlight(keyword) {
  CSS.highlights.delete('search');
  if (!keyword.trim()) return;
  // ... создать новые ranges и зарегистрировать
}
```

## Ограничения CSS-свойств

Внутри `::highlight()` доступен не весь набор CSS-свойств — только те, что имеют смысл для текстовых диапазонов. Поддерживаются:

- `color`
- `background-color`
- `text-decoration` и связанные (`text-decoration-color`, `text-decoration-style`, `text-decoration-line`)
- `text-shadow`
- `caret-color`

Свойства вроде `font-size`, `margin`, `padding`, `border` не применяются — диапазоны не создают новых блоков в потоке документа.

## Пример: живой поиск на странице

Практичный компонент поиска с подсветкой и навигацией по совпадениям:

```javascript
class TextSearchHighlighter {
  constructor(container) {
    this.container = container;
    this.ranges = [];
    this.currentIndex = -1;
  }

  search(keyword) {
    this.ranges = [];
    this.currentIndex = -1;
    CSS.highlights.delete('search-match');
    CSS.highlights.delete('search-current');

    if (!keyword.trim()) return 0;

    const walker = document.createTreeWalker(
      this.container,
      NodeFilter.SHOW_TEXT
    );

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent;
      const lowerText = text.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();
      let start = 0;

      while (true) {
        const idx = lowerText.indexOf(lowerKeyword, start);
        if (idx === -1) break;

        const range = new Range();
        range.setStart(node, idx);
        range.setEnd(node, idx + keyword.length);
        this.ranges.push(range);
        start = idx + keyword.length;
      }
    }

    if (this.ranges.length > 0) {
      CSS.highlights.set('search-match', new Highlight(...this.ranges));
      this.goTo(0);
    }

    return this.ranges.length;
  }

  goTo(index) {
    if (this.ranges.length === 0) return;

    CSS.highlights.delete('search-current');
    this.currentIndex = (index + this.ranges.length) % this.ranges.length;

    const currentRange = this.ranges[this.currentIndex];
    CSS.highlights.set('search-current', new Highlight(currentRange));
    currentRange.startContainer.parentElement?.scrollIntoView({
      block: 'center',
      behavior: 'smooth'
    });
  }

  next() { this.goTo(this.currentIndex + 1); }
  prev() { this.goTo(this.currentIndex - 1); }
  clear() {
    CSS.highlights.delete('search-match');
    CSS.highlights.delete('search-current');
    this.ranges = [];
  }
}
```

```css
::highlight(search-match) {
  background-color: #fff59d;
  color: #000;
}

::highlight(search-current) {
  background-color: #ff9800;
  color: #fff;
}
```

```javascript
const highlighter = new TextSearchHighlighter(
  document.getElementById('article')
);

document.getElementById('search-input').addEventListener('input', (e) => {
  const count = highlighter.search(e.target.value);
  document.getElementById('count').textContent = `${count} совпадений`;
});

document.getElementById('prev-btn').addEventListener('click', () => highlighter.prev());
document.getElementById('next-btn').addEventListener('click', () => highlighter.next());
```

## Сравнение с альтернативами

**`<mark>` и `<span>` через innerHTML** — самый распространённый фолбэк. Работает везде, но изменяет DOM, что ломает обработчики событий, нарушает доступность и создаёт проблемы с границами тегов (слово может быть разбито на несколько узлов).

**Selection API** — позволяет выделять текст программно, но работает с единственным выделением, которое конкурирует с пользовательским выделением мышью.

**Canvas overlay** — рисовать прямоугольники поверх текста через `getBoundingClientRect`. Хрупко, не следит за ресайзом и прокруткой, не работает с многострочными диапазонами без дополнительной логики.

**Custom Highlight API** лишён этих недостатков: не трогает DOM, не конкурирует с пользователем, работает с любыми диапазонами через псевдоэлементы.

## Итог

CSS Custom Highlight API — современный и производительный способ подсвечивать текст в браузере. Он не изменяет DOM, поддерживает несколько именованных слоёв подсветки с настраиваемыми приоритетами и стилизуется стандартным CSS через псевдоэлемент `::highlight()`. Для браузеров без поддержки достаточно предусмотреть фолбэк на основе `<mark>` или `<span>`.

Для углублённого изучения JavaScript и работы с браузерными API смотрите курс на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=css-custom-highlight-api
