---
metaTitle: "MutationObserver в JavaScript — наблюдение за DOM"
metaDescription: "MutationObserver в JavaScript: как отслеживать изменения DOM, настраивать наблюдателя, обрабатывать MutationRecord и отключать наблюдение."
author: "Антон Ларичев"
title: "MutationObserver — наблюдение за изменениями DOM"
preview: "Разбираем MutationObserver — современный API для наблюдения за изменениями в дереве DOM без polling и сторонних библиотек."
---

## Что такое MutationObserver

`MutationObserver` — это встроенный браузерный API, позволяющий асинхронно отслеживать изменения в дереве DOM: добавление и удаление узлов, изменение атрибутов, модификацию текстового содержимого. Он пришёл на смену устаревшим `MutationEvents` (`DOMNodeInserted`, `DOMAttrModified` и другим), которые работали синхронно и сильно нагружали браузер.

Механизм работает следующим образом: наблюдатель ставится в очередь микрозадач и срабатывает после завершения текущей задачи, но до следующей макрозадачи. Это делает его эффективным инструментом без риска бесконечных циклов при изменении DOM внутри коллбека.

## Создание наблюдателя

Конструктор принимает один аргумент — функцию обратного вызова, которая будет вызвана при каждой порции изменений:

```javascript
const observer = new MutationObserver((mutations, observerRef) => {
  mutations.forEach((mutation) => {
    console.log(mutation);
  });
});
```

Коллбек получает два параметра:
- `mutations` — массив объектов `MutationRecord`, каждый описывает одно изменение;
- `observerRef` — ссылка на сам экземпляр `MutationObserver`, удобна для отключения изнутри коллбека.

## Запуск наблюдения: метод observe

Чтобы начать наблюдение, нужно вызвать `observe` и передать целевой узел и объект с настройками:

```javascript
const target = document.getElementById('app');

observer.observe(target, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'data-state'],
  characterData: true,
});
```

### Параметры конфигурации

| Параметр | Тип | Описание |
|---|---|---|
| `childList` | boolean | Отслеживать добавление и удаление дочерних узлов |
| `subtree` | boolean | Распространить наблюдение на всё поддерево |
| `attributes` | boolean | Отслеживать изменения атрибутов |
| `attributeFilter` | string[] | Список атрибутов для наблюдения (если не указан — все атрибуты) |
| `attributeOldValue` | boolean | Сохранять старое значение атрибута в `MutationRecord` |
| `characterData` | boolean | Отслеживать изменения текстовых узлов |
| `characterDataOldValue` | boolean | Сохранять старое текстовое содержимое |

Важно: хотя бы один из параметров `childList`, `attributes` или `characterData` должен быть `true`, иначе браузер выбросит ошибку.

## Объект MutationRecord

Каждая запись в массиве `mutations` является экземпляром `MutationRecord` и содержит следующие свойства:

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach((record) => {
    console.log('Тип изменения:', record.type);           // 'childList' | 'attributes' | 'characterData'
    console.log('Целевой узел:', record.target);          // узел, на котором произошло изменение
    console.log('Добавленные узлы:', record.addedNodes);  // NodeList добавленных узлов
    console.log('Удалённые узлы:', record.removedNodes);  // NodeList удалённых узлов
    console.log('Имя атрибута:', record.attributeName);   // имя изменённого атрибута или null
    console.log('Старое значение:', record.oldValue);     // старое значение (если запрошено)
    console.log('Предыдущий сосед:', record.previousSibling); // предшествующий узел
    console.log('Следующий сосед:', record.nextSibling);      // следующий узел
  });
});
```

## Практические примеры

### Отслеживание добавления элементов

Часто используется для реакции на динамически вставляемый контент — например, из стороннего виджета или lazy-loaded модуля:

```javascript
function waitForElement(selector) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

// Использование
waitForElement('.dynamic-widget').then((el) => {
  console.log('Элемент появился:', el);
  el.addEventListener('click', handleClick);
});
```

### Наблюдение за изменением атрибутов

Полезно для синхронизации состояния компонента с его атрибутами, особенно при работе с Web Components:

```javascript
const button = document.querySelector('#submit-btn');

const observer = new MutationObserver((mutations) => {
  mutations.forEach((record) => {
    if (record.type === 'attributes' && record.attributeName === 'disabled') {
      const isDisabled = button.hasAttribute('disabled');
      console.log(`Кнопка ${isDisabled ? 'заблокирована' : 'активна'}`);
      updateButtonStyles(button, isDisabled);
    }
  });
});

observer.observe(button, {
  attributes: true,
  attributeFilter: ['disabled'],
  attributeOldValue: true,
});
```

### Отслеживание изменений текста

```javascript
const liveRegion = document.querySelector('[aria-live]');

const observer = new MutationObserver((mutations) => {
  mutations.forEach((record) => {
    if (record.type === 'characterData') {
      console.log('Старый текст:', record.oldValue);
      console.log('Новый текст:', record.target.textContent);
    }
  });
});

observer.observe(liveRegion, {
  characterData: true,
  subtree: true,
  characterDataOldValue: true,
});
```

### Автоматическое добавление класса к новым элементам

```javascript
const container = document.querySelector('.card-grid');

const observer = new MutationObserver((mutations) => {
  mutations.forEach((record) => {
    record.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.matches('.card')) {
        node.classList.add('card--animated');
        node.addEventListener('animationend', () => {
          node.classList.remove('card--animated');
        }, { once: true });
      }
    });
  });
});

observer.observe(container, { childList: true });
```

## Остановка наблюдения: метод disconnect

Метод `disconnect` останавливает наблюдение и освобождает ресурсы. Его необходимо вызывать, когда наблюдатель больше не нужен, чтобы избежать утечек памяти:

```javascript
const observer = new MutationObserver(handleMutations);
observer.observe(target, { childList: true, subtree: true });

// Остановить наблюдение через 10 секунд
setTimeout(() => {
  observer.disconnect();
  console.log('Наблюдение остановлено');
}, 10000);
```

Внутри коллбека можно использовать второй параметр — ссылку на сам наблюдатель:

```javascript
const observer = new MutationObserver((mutations, obs) => {
  const found = [...mutations].some((m) =>
    [...m.addedNodes].some((n) => n.matches?.('.target'))
  );

  if (found) {
    obs.disconnect(); // наблюдатель отключает сам себя
    doSomething();
  }
});
```

## Метод takeRecords

`takeRecords` позволяет получить накопленные, но ещё не переданные в коллбек записи и очистить внутреннюю очередь. Используется перед вызовом `disconnect`, если нужно обработать все оставшиеся изменения:

```javascript
const pending = observer.takeRecords();
if (pending.length > 0) {
  handleMutations(pending);
}
observer.disconnect();
```

## Наблюдение за несколькими узлами

Один экземпляр `MutationObserver` может наблюдать за несколькими элементами. Каждый вызов `observe` добавляет новую цель:

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach((record) => {
    console.log('Изменение в:', record.target.id);
  });
});

const config = { attributes: true, childList: true };

document.querySelectorAll('.widget').forEach((el) => {
  observer.observe(el, config);
});

// Один вызов disconnect остановит наблюдение за всеми целями
observer.disconnect();
```

## Типичные ловушки

### Бесконечный цикл

Если коллбек сам изменяет DOM, это может породить бесконечный цикл. Решения: использовать флаг, фильтровать тип изменений или временно отключать наблюдатель:

```javascript
let ignoreNextMutation = false;

const observer = new MutationObserver((mutations) => {
  if (ignoreNextMutation) {
    ignoreNextMutation = false;
    return;
  }

  mutations.forEach((record) => {
    ignoreNextMutation = true;
    record.target.setAttribute('data-updated', Date.now());
  });
});

observer.observe(target, { attributes: true, attributeFilter: ['class'] });
```

### Утечка памяти

Если наблюдаемый элемент удаляется из DOM, а наблюдатель не отключён, браузер продолжит удерживать ссылки. Всегда вызывайте `disconnect` при размонтировании компонента:

```javascript
class Widget {
  constructor(el) {
    this.el = el;
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(el, { childList: true, subtree: true });
  }

  handleMutations(mutations) {
    // обработка
  }

  destroy() {
    this.observer.disconnect();
    this.el = null;
  }
}
```

### Задержка коллбека

`MutationObserver` работает асинхронно. Изменения DOM не будут видны в коллбеке немедленно после их применения — они придут в следующей микрозадаче. Если нужно синхронное поведение, `MutationObserver` не подходит.

## Сравнение с устаревшими MutationEvents

| Критерий | MutationEvents | MutationObserver |
|---|---|---|
| Синхронность | Синхронные | Асинхронные (микрозадачи) |
| Производительность | Низкая (каждое событие по отдельности) | Высокая (пакетная обработка) |
| Риск рекурсии | Высокий | Минимальный |
| Поддержка браузеров | Устарело, удалено из спецификации | Все современные браузеры |
| API | `addEventListener` | `observe` / `disconnect` |

`MutationEvents` официально удалены из веб-стандартов и не должны использоваться в новом коде.

## Интеграция с современными фреймворками

В React `MutationObserver` удобно использовать внутри `useEffect` с правильной очисткой:

```javascript
import { useEffect, useRef } from 'react';

function useAttributeWatcher(ref, attributeName, callback) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((record) => {
        if (record.attributeName === attributeName) {
          callback(el.getAttribute(attributeName), record.oldValue);
        }
      });
    });

    observer.observe(el, {
      attributes: true,
      attributeFilter: [attributeName],
      attributeOldValue: true,
    });

    return () => observer.disconnect();
  }, [ref, attributeName, callback]);
}

// Использование
function MyComponent() {
  const divRef = useRef(null);

  useAttributeWatcher(divRef, 'aria-expanded', (newVal, oldVal) => {
    console.log(`aria-expanded: ${oldVal} -> ${newVal}`);
  });

  return <div ref={divRef} aria-expanded="false">Контент</div>;
}
```

## Поддержка браузеров

`MutationObserver` поддерживается во всех современных браузерах: Chrome 26+, Firefox 14+, Safari 7+, Edge 12+. В Node.js API недоступен нативно, но существуют полифиллы для серверного тестирования (например, `mutationobserver-shim`).

## Хорошие практики

- Всегда вызывайте `disconnect` при уничтожении компонента или завершении работы наблюдателя.
- Используйте `attributeFilter`, чтобы ограничить список отслеживаемых атрибутов — это снижает нагрузку.
- Не устанавливайте `subtree: true` без необходимости на крупных поддеревьях.
- Пакетируйте обработку изменений: массив `mutations` может содержать десятки записей за один вызов коллбека.
- Избегайте тяжёлых вычислений прямо в коллбеке — лучше использовать `requestAnimationFrame` или `requestIdleCallback` для откладывания работы.

Подробнее о работе с DOM, событиями и браузерными API вы найдёте на курсе по JavaScript: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=mutationobserver