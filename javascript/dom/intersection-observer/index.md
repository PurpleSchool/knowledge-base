---
metaTitle: "JavaScript IntersectionObserver — полное руководство"
metaDescription: "Как использовать IntersectionObserver в JavaScript: lazy loading, анимации при скролле, infinite scroll и отслеживание видимости элементов."
author: "Антон Ларичев"
title: "IntersectionObserver в JavaScript"
preview: "Асинхронное отслеживание видимости DOM-элементов без scroll-событий и getBoundingClientRect."
---

## Что такое IntersectionObserver

IntersectionObserver — встроенный браузерный API, который асинхронно отслеживает пересечение элемента с его предком или с областью видимости браузера (viewport). Он сообщает, когда элемент появляется или исчезает из поля зрения пользователя.

До появления этого API разработчики использовали обработчики события `scroll` вместе с `getBoundingClientRect()`. Проблема в том, что каждый вызов `getBoundingClientRect()` вызывает принудительный перерасчёт макета (layout reflow), а частые вызовы внутри обработчика `scroll` легко блокируют основной поток.

IntersectionObserver решает эту проблему: он работает асинхронно, не блокирует основной поток и вызывает callback только при реальном изменении видимости элемента.

## Создание IntersectionObserver

Базовый синтаксис:

```javascript
const observer = new IntersectionObserver(callback, options);
```

Где:
- `callback` — функция, вызываемая при изменении видимости наблюдаемых элементов
- `options` — необязательный объект с настройками

Чтобы начать наблюдение за элементом, используйте метод `observe()`:

```javascript
const target = document.querySelector('.target');
observer.observe(target);
```

Простейший пример:

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      console.log('Элемент виден на экране');
    } else {
      console.log('Элемент вышел из поля зрения');
    }
  });
});

const element = document.querySelector('#my-element');
observer.observe(element);
```

## Параметры настройки (options)

Объект `options` принимает три необязательных поля.

### root

Определяет корневой элемент, относительно которого проверяется пересечение. По умолчанию — `null`, что означает viewport браузера.

```javascript
const observer = new IntersectionObserver(callback, {
  root: document.querySelector('.scroll-container')
});
```

Если передать `null` или не указывать `root`, наблюдение ведётся относительно видимой области браузера. Указанный элемент должен быть предком наблюдаемого элемента в DOM-дереве.

### rootMargin

Работает аналогично CSS-свойству `margin` — задаёт отступы вокруг корневого элемента, расширяя или сужая зону срабатывания. Значения указываются в пикселях или процентах.

```javascript
const observer = new IntersectionObserver(callback, {
  rootMargin: '50px 0px 50px 0px'
});
```

Положительные значения расширяют зону срабатывания (элемент засчитывается видимым до того, как попадёт в viewport), отрицательные — сужают её.

Пример: загрузить изображение за 200px до попадания в видимую зону:

```javascript
const observer = new IntersectionObserver(callback, {
  rootMargin: '200px 0px'
});
```

### threshold

Число или массив чисел от 0 до 1 — при каком проценте видимости элемента должен срабатывать callback.

- `0` — срабатывает, как только хотя бы один пиксель стал видим (или перестал быть видим). Значение по умолчанию.
- `1` — срабатывает только когда элемент полностью виден.
- `[0, 0.5, 1]` — срабатывает при 0%, 50% и 100% видимости.

```javascript
const observer = new IntersectionObserver(callback, {
  threshold: [0, 0.25, 0.5, 0.75, 1]
});
```

## Объект IntersectionObserverEntry

Callback получает массив объектов `IntersectionObserverEntry`. Каждый описывает состояние конкретного элемента в момент изменения видимости.

Основные свойства:

| Свойство | Тип | Описание |
|---|---|---|
| `isIntersecting` | `boolean` | `true`, если элемент пересекается с корневым |
| `intersectionRatio` | `number` | Доля видимой части (0–1) |
| `target` | `Element` | Наблюдаемый элемент |
| `boundingClientRect` | `DOMRectReadOnly` | Размеры и позиция элемента |
| `intersectionRect` | `DOMRectReadOnly` | Видимая часть элемента |
| `rootBounds` | `DOMRectReadOnly` | Размеры корневого элемента |
| `time` | `DOMHighResTimeStamp` | Время события |

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    console.log('Элемент:', entry.target);
    console.log('Видим:', entry.isIntersecting);
    console.log('Видимость:', Math.round(entry.intersectionRatio * 100) + '%');
  });
});
```

## Методы IntersectionObserver

### observe(target)

Начинает наблюдение за элементом. Один наблюдатель может следить за несколькими элементами одновременно.

```javascript
const observer = new IntersectionObserver(callback);

document.querySelectorAll('.item').forEach((el) => {
  observer.observe(el);
});
```

### unobserve(target)

Прекращает наблюдение за конкретным элементом, но наблюдатель продолжает работать для остальных.

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      doSomething(entry.target);
      observer.unobserve(entry.target);
    }
  });
});
```

### disconnect()

Полностью останавливает наблюдатель — прекращает слежение за всеми элементами.

```javascript
observer.disconnect();
```

### takeRecords()

Возвращает массив всех необработанных записей и очищает внутреннюю очередь. Используется редко — как правило, перед вызовом `disconnect()` для синхронной обработки оставшихся событий.

```javascript
const pendingEntries = observer.takeRecords();
observer.disconnect();
```

## Практические примеры

### Ленивая загрузка изображений

Загружать изображения только когда они приближаются к зоне видимости — один из самых популярных кейсов.

```html
<img class="lazy" data-src="photo.jpg" alt="Фото" />
```

```javascript
const imageObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  },
  {
    rootMargin: '200px 0px'
  }
);

document.querySelectorAll('img.lazy').forEach((img) => {
  imageObserver.observe(img);
});
```

### Анимации при появлении элементов

Анимировать элементы при скролле, когда они появляются в поле зрения.

```css
.fade-in {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```javascript
const animationObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        animationObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.1
  }
);

document.querySelectorAll('.fade-in').forEach((el) => {
  animationObserver.observe(el);
});
```

### Бесконечная прокрутка (Infinite Scroll)

Загружаем дополнительный контент, когда пользователь прокрутил страницу до конца списка.

```javascript
let page = 1;
let isLoading = false;

const sentinel = document.querySelector('#sentinel');

const scrollObserver = new IntersectionObserver(async (entries) => {
  const [entry] = entries;

  if (entry.isIntersecting && !isLoading) {
    isLoading = true;
    page++;

    const newItems = await fetchItems(page);
    renderItems(newItems);

    isLoading = false;
  }
});

scrollObserver.observe(sentinel);
```

HTML-структура:

```html
<ul id="items-list">
  <!-- элементы списка -->
</ul>
<div id="sentinel"></div>
```

Элемент `#sentinel` — невидимый маяк в конце списка. Как только он попадает в viewport, подгружается следующая страница данных.

### Отслеживание видимости для аналитики

Измеряем, сколько времени пользователь видел конкретный элемент — например, рекламный баннер или важный блок контента.

```javascript
const visibilityTracker = new Map();

const analyticsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const id = entry.target.dataset.trackId;

      if (entry.isIntersecting) {
        visibilityTracker.set(id, Date.now());
      } else if (visibilityTracker.has(id)) {
        const duration = Date.now() - visibilityTracker.get(id);
        visibilityTracker.delete(id);

        sendAnalyticsEvent({
          elementId: id,
          visibleDuration: duration
        });
      }
    });
  },
  {
    threshold: 0.5
  }
);

document.querySelectorAll('[data-track-id]').forEach((el) => {
  analyticsObserver.observe(el);
});
```

### Активный пункт навигации при скролле

Подсвечиваем активный раздел в навигации в зависимости от положения прокрутки.

```javascript
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a');

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');

        navLinks.forEach((link) => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  },
  {
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0
  }
);

sections.forEach((section) => {
  navObserver.observe(section);
});
```

Трюк с `rootMargin: '-50% 0px -50% 0px'` создаёт горизонтальную полосу посередине viewport — секция считается активной, когда пересекает эту линию.

## Производительность и лучшие практики

### Один наблюдатель для множества элементов

Создавайте один экземпляр `IntersectionObserver` с нужными параметрами и наблюдайте за всеми элементами через него.

```javascript
// Правильно
const observer = new IntersectionObserver(callback, options);
elements.forEach(el => observer.observe(el));

// Неправильно — лишний расход памяти
elements.forEach(el => {
  const observer = new IntersectionObserver(callback, options);
  observer.observe(el);
});
```

### Отписывайтесь после однократного срабатывания

Если элемент нужно отследить только один раз (анимация появления, ленивая загрузка), сразу вызывайте `unobserve()` после первого срабатывания. Это снижает нагрузку и исключает повторные вызовы.

### Очищайте наблюдатели при удалении компонентов

В SPA-приложениях не забывайте вызывать `disconnect()` при размонтировании компонентов.

```javascript
useEffect(() => {
  const observer = new IntersectionObserver(callback, options);
  observer.observe(ref.current);

  return () => {
    observer.disconnect();
  };
}, []);
```

### Не злоупотребляйте threshold

Большое количество значений в `threshold` увеличивает частоту вызовов callback. Используйте только те значения, которые реально нужны для решения задачи.

## Поддержка браузеров

IntersectionObserver поддерживается всеми современными браузерами. Для поддержки устаревших (IE) существует официальный полифил:

```bash
npm install intersection-observer
```

```javascript
import 'intersection-observer';
```

Если полифил не нужен, добавьте защитную проверку:

```javascript
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(callback);
  observer.observe(element);
} else {
  element.classList.add('visible');
}
```

## Сравнение с другими подходами

| Подход | Производительность | Сложность | Поддержка браузеров |
|---|---|---|---|
| `scroll` + `getBoundingClientRect` | Низкая (layout reflow) | Средняя | Все браузеры |
| `scroll` + throttle | Средняя | Высокая | Все браузеры |
| IntersectionObserver | Высокая (асинхронно) | Низкая | Современные |

IntersectionObserver выигрывает по всем параметрам для большинства задач. Единственный случай, когда он не подходит — когда нужна синхронная реакция на позицию прокрутки (например, parallax-эффекты с точным позиционированием).

Для углублённого изучения JavaScript и браузерных API рекомендуем курс [JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=intersection-observer).