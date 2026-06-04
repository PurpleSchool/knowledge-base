---
metaTitle: "ResizeObserver в JavaScript — отслеживание размеров элементов"
metaDescription: "Как использовать ResizeObserver в JavaScript для отслеживания изменений размеров DOM-элементов. Методы observe, unobserve, disconnect, практические примеры."
author: "Антон Ларичев"
title: "JavaScript ResizeObserver"
preview: "ResizeObserver — браузерный API для отслеживания изменений размеров DOM-элементов. Узнайте, как использовать его вместо события resize на window."
---

## Что такое ResizeObserver

ResizeObserver — это браузерный API, позволяющий отслеживать изменения размеров DOM-элементов. В отличие от события `resize` на объекте `window`, ResizeObserver реагирует на изменения конкретных элементов, а не только окна браузера целиком.

Это особенно полезно в современных приложениях, где компоненты могут менять размер из-за изменения контента, CSS-анимаций, flex/grid-контейнеров или программных изменений стилей.

## Создание наблюдателя

Для создания ResizeObserver нужно передать в конструктор функцию-коллбэк, которая будет вызываться при каждом изменении размеров наблюдаемого элемента.

```javascript
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    console.log('Элемент изменил размер:', entry.target);
    console.log('Ширина:', entry.contentRect.width);
    console.log('Высота:', entry.contentRect.height);
  }
});
```

Коллбэк принимает массив объектов `ResizeObserverEntry` — по одному на каждый наблюдаемый элемент, который изменил размер.

## Методы ResizeObserver

### observe

Метод `observe` подписывает наблюдатель на изменения размеров конкретного элемента:

```javascript
const element = document.getElementById('my-element');
observer.observe(element);
```

Можно передать необязательный объект опций с параметром `box`, чтобы указать, какую модель блока использовать при наблюдении:

```javascript
// content-box — по умолчанию, без padding и border
observer.observe(element, { box: 'content-box' });

// border-box — включает padding и border
observer.observe(element, { box: 'border-box' });

// device-pixel-content-box — в физических пикселях экрана
observer.observe(element, { box: 'device-pixel-content-box' });
```

### unobserve

Метод `unobserve` прекращает наблюдение за конкретным элементом, но сам наблюдатель остаётся активным:

```javascript
observer.unobserve(element);
```

### disconnect

Метод `disconnect` прекращает наблюдение за всеми элементами и полностью отключает наблюдатель:

```javascript
observer.disconnect();
```

## Объект ResizeObserverEntry

Каждый элемент массива в коллбэке — это объект `ResizeObserverEntry` со следующими свойствами.

### target

Ссылка на наблюдаемый DOM-элемент:

```javascript
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    console.log(entry.target); // HTMLElement
    entry.target.classList.toggle('is-wide', entry.contentRect.width > 500);
  }
});
```

### contentRect

Объект `DOMRectReadOnly` с размерами и позицией содержимого элемента (без padding и border):

```javascript
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height, top, left } = entry.contentRect;
    console.log(`Размер: ${width}x${height}`);
    console.log(`Позиция: top=${top}, left=${left}`);
  }
});
```

### contentBoxSize и borderBoxSize

Более современные свойства, возвращающие массив объектов с размерами, которые корректно работают с разными режимами письма (`writing-mode`):

```javascript
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentBoxSize && entry.contentBoxSize.length > 0) {
      const size = entry.contentBoxSize[0];
      // inlineSize — ширина для горизонтальных режимов письма
      console.log('inlineSize:', size.inlineSize);
      // blockSize — высота для горизонтальных режимов письма
      console.log('blockSize:', size.blockSize);
    }
  }
});
```

Для максимальной совместимости используйте `contentRect`, а `contentBoxSize` и `borderBoxSize` — в новых проектах, где поддержка старых браузеров не требуется.

## Практические примеры

### Адаптивный компонент

Один из главных сценариев — создание компонентов, реагирующих на собственный размер, а не на размер окна браузера:

```javascript
const card = document.querySelector('.card');

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const width = entry.contentRect.width;

    entry.target.classList.toggle('card--small', width < 300);
    entry.target.classList.toggle('card--medium', width >= 300 && width < 600);
    entry.target.classList.toggle('card--large', width >= 600);
  }
});

observer.observe(card);
```

Такой подход называют «container queries на JavaScript» — компонент адаптируется под свой контейнер, а не под размер всей страницы. Сегодня существует и нативный CSS-аналог — `@container`, однако ResizeObserver даёт больше гибкости для сложной логики.

### Динамическое масштабирование canvas

ResizeObserver идеально подходит для масштабирования `<canvas>` при изменении размеров родительского контейнера:

```javascript
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `${canvas.width} x ${canvas.height}`,
    canvas.width / 2,
    canvas.height / 2
  );
}

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    draw();
  }
});

// Наблюдаем за родителем, а не за самим canvas
observer.observe(canvas.parentElement);
```

### Ленивая загрузка при появлении элемента

Можно отслеживать момент, когда элемент получает ненулевые размеры — например, при переключении вкладок или раскрытии аккордеона:

```javascript
const chartContainer = document.getElementById('chart');

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;

    if (width > 0 && height > 0) {
      // Элемент стал видимым — загружаем данные
      fetch('/api/chart-data')
        .then(res => res.json())
        .then(data => renderChart(chartContainer, data));

      // Больше не нужно наблюдать
      observer.unobserve(entry.target);
    }
  }
});

observer.observe(chartContainer);
```

### Выравнивание высот колонок

ResizeObserver позволяет динамически выравнивать высоты колонок при изменении содержимого:

```javascript
const columns = document.querySelectorAll('.grid-column');
const container = document.querySelector('.grid');

const observer = new ResizeObserver(() => {
  // Сбрасываем высоты для корректного измерения
  columns.forEach(col => { col.style.height = 'auto'; });

  const maxHeight = Math.max(
    ...Array.from(columns).map(col => col.scrollHeight)
  );

  columns.forEach(col => { col.style.height = `${maxHeight}px`; });
});

observer.observe(container);
```

## Корректная очистка

Всегда отключайте наблюдателей, когда они больше не нужны — иначе элементы не смогут быть собраны сборщиком мусора:

```javascript
class ResizableWidget {
  constructor(element) {
    this.element = element;
    this.observer = new ResizeObserver(this.handleResize.bind(this));
    this.observer.observe(this.element);
  }

  handleResize(entries) {
    for (const entry of entries) {
      this.updateLayout(entry.contentRect);
    }
  }

  updateLayout({ width, height }) {
    this.element.dataset.size = width < 400 ? 'small' : 'large';
  }

  destroy() {
    this.observer.disconnect();
  }
}

const widget = new ResizableWidget(document.getElementById('widget'));

// При уничтожении компонента
widget.destroy();
```

## Использование в React

ResizeObserver хорошо вписывается в паттерн кастомного хука:

```javascript
import { useEffect, useRef, useState } from 'react';

function useResizeObserver(ref) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref]);

  return dimensions;
}

// Использование в компоненте
function ResponsiveCard() {
  const containerRef = useRef(null);
  const { width } = useResizeObserver(containerRef);

  return (
    <div
      ref={containerRef}
      className={`card ${width < 400 ? 'card--compact' : 'card--full'}`}
    >
      <p>Ширина контейнера: {Math.round(width)}px</p>
    </div>
  );
}
```

## Защита от бесконечных циклов

ResizeObserver автоматически защищает от бесконечных циклов: если коллбэк изменяет размер наблюдаемого элемента, повторного вызова в том же цикле рендеринга не произойдёт. Тем не менее нужно избегать паттернов, которые вызывают каскадные изменения:

```javascript
// Осторожно: изменение размеров других наблюдаемых элементов внутри коллбэка
// может приводить к дополнительным вызовам на следующем кадре
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const otherEl = document.querySelector('.other');
    // Это может вызвать срабатывание наблюдателя, если .other тоже наблюдается
    otherEl.style.width = entry.contentRect.width + 'px';
  }
});
```

Правило: не меняйте размеры элементов внутри коллбэка, особенно тех, за которыми ведётся наблюдение.

## ResizeObserver против события resize на window

| Критерий | `window resize` | `ResizeObserver` |
|---|---|---|
| Область применения | Только окно браузера | Любой DOM-элемент |
| Реакция на изменение контента | Нет | Да |
| Реакция на flex/grid | Нет | Да |
| Производительность | Требует throttle/debounce | Встроенная оптимизация |
| Поддержка браузеров | Все браузеры | Все современные браузеры |

Событие `resize` на `window` срабатывает только при изменении размеров самого окна. ResizeObserver реагирует на любые причины изменения размеров элемента: изменение контента, CSS-анимации, динамические стили, изменение соседних элементов в flex/grid-контейнере.

## Производительность

ResizeObserver встроен в цикл рендеринга браузера и работает асинхронно. Уведомления приходят после вычисления макета, но до отрисовки кадра — это позволяет вносить изменения без лишних перерисовок.

Если обработка в коллбэке занимает значительное время, применяйте дебаунс:

```javascript
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const observer = new ResizeObserver(
  debounce((entries) => {
    for (const entry of entries) {
      expensiveRecalculation(entry.contentRect);
    }
  }, 100)
);

observer.observe(document.getElementById('complex-layout'));
```

## Поддержка браузеров и полифил

ResizeObserver поддерживается во всех современных браузерах:

- Chrome 64+
- Firefox 69+
- Safari 13.1+
- Edge 79+

Для поддержки старых окружений существует полифил `resize-observer-polyfill`:

```bash
npm install resize-observer-polyfill
```

```javascript
import ResizeObserver from 'resize-observer-polyfill';

const observer = new ResizeObserver((entries) => {
  // работает в старых браузерах через полифил
});
```

Полифил реализует API через `MutationObserver` и периодические проверки, поэтому он менее точен и производителен, чем нативная реализация. Используйте его только при реальной необходимости поддержки устаревших браузеров.

Для более глубокого изучения JavaScript и работы с DOM, включая современные браузерные API, рекомендуем курс [JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=resize-observer).