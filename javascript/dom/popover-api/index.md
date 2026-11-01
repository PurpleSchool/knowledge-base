---
metaTitle: "Popover API в JavaScript: нативные поповеры без JS"
metaDescription: "Подробный разбор Popover API: HTML-атрибуты, типы auto и manual, JS-методы, события и стилизация нативных поповеров."
author: "Антон Ларичев"
title: "Popover API — нативные поповеры без JavaScript"
preview: "Как создавать тултипы, дропдауны и поповеры без библиотек — с помощью нативного Popover API браузера."
---

## Что такое Popover API

Popover API — это встроенный браузерный механизм для отображения всплывающих элементов: тултипов, дропдаун-меню, уведомлений, диалогов-подтверждений. До его появления разработчики подключали отдельные библиотеки (Tippy.js, Floating UI, Popper.js) или писали сложную логику вручную: управление фокусом, закрытие по Escape, блокировка прокрутки, z-index.

Начиная с 2023 года Popover API поддерживается во всех современных браузерах. Он решает типовые задачи декларативно — через HTML-атрибуты — и не требует ни строчки JavaScript для базового поведения.

## Минимальный пример

Достаточно двух атрибутов: `popover` на целевом элементе и `popovertarget` на кнопке-триггере.

```html
<button popovertarget="my-popover">Открыть</button>

<div id="my-popover" popover>
  Содержимое поповера
</div>
```

Браузер сам обеспечивает:

- Открытие и закрытие по клику на кнопку
- Закрытие по клику вне поповера
- Закрытие по нажатию `Escape`
- Размещение элемента в [top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer) — поверх любых `z-index` и `overflow: hidden`
- Базовую доступность через ARIA

## Атрибут popover и его типы

Атрибут `popover` принимает три значения:

### auto (по умолчанию)

```html
<div id="tooltip" popover="auto">Текст</div>
<!-- или сокращённо -->
<div id="tooltip" popover>Текст</div>
```

Поведение:
- Закрывается по клику вне и по `Escape`
- При открытии нового `auto`-поповера предыдущий автоматически закрывается
- Подходит для большинства дропдаунов и тултипов

### manual

```html
<div id="notification" popover="manual">Уведомление</div>
```

Поведение:
- Не закрывается автоматически — только программно или через явный триггер
- Несколько `manual`-поповеров могут быть открыты одновременно
- Подходит для toast-уведомлений и постоянных подсказок

### hint

```html
<div id="hint" popover="hint">Подсказка</div>
```

Поведение схоже с `auto`, но `hint`-поповер не закрывает другие `auto`-поповеры при открытии. Тип предназначен именно для тултипов, отображаемых при наведении. На момент написания статьи поддерживается в Chrome 135+ и Safari 18.2+.

## Управление действием триггера

Атрибут `popovertargetaction` задаёт, что делает кнопка при клике:

```html
<!-- Всегда открывает (show) -->
<button popovertarget="menu" popovertargetaction="show">Открыть меню</button>

<!-- Всегда закрывает (hide) -->
<button popovertarget="menu" popovertargetaction="hide">Закрыть меню</button>

<!-- Переключает состояние (по умолчанию) -->
<button popovertarget="menu" popovertargetaction="toggle">Меню</button>

<nav id="menu" popover>
  <a href="/">Главная</a>
  <a href="/about">О нас</a>
</nav>
```

## Стилизация

### Базовые стили

По умолчанию поповер абсолютно позиционируется в центре вьюпорта. Переопределить внешний вид просто:

```css
[popover] {
  margin: 0;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  background: #fff;
  color: #1a202c;
  max-width: 320px;
}
```

### Псевдокласс :popover-open

Для стилей открытого состояния используется псевдокласс `:popover-open`:

```css
[popover] {
  opacity: 0;
  transform: translateY(-8px);
}

[popover]:popover-open {
  opacity: 1;
  transform: translateY(0);
}
```

### Анимация появления и скрытия

С поддержкой `@starting-style` и `transition` можно анимировать как открытие, так и закрытие поповера — без JavaScript:

```css
[popover] {
  transition:
    opacity 200ms ease,
    transform 200ms ease,
    display 200ms allow-discrete,
    overlay 200ms allow-discrete;

  opacity: 0;
  transform: scale(0.95);
}

[popover]:popover-open {
  opacity: 1;
  transform: scale(1);
}

@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

`@starting-style` задаёт начальное состояние при появлении элемента в DOM-дереве рендера. `allow-discrete` в `transition` позволяет анимировать свойства `display` и `overlay`, которые обычно переключаются мгновенно.

### Затемнение фона — ::backdrop

Псевдоэлемент `::backdrop` отрисовывается под поповером в top layer:

```css
[popover]::backdrop {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}
```

Для `popover="auto"` backdrop по умолчанию прозрачен. Для `popover="manual"` его нет совсем, если не задать явно.

## JavaScript API

Popover API предоставляет три метода у DOM-элемента:

```javascript
const popover = document.getElementById('my-popover');

// Показать
popover.showPopover();

// Скрыть
popover.hidePopover();

// Переключить (возвращает true, если стал открытым)
const isOpen = popover.togglePopover();
```

Проверить текущее состояние можно через свойство или атрибут:

```javascript
// Через свойство
if (popover.matches(':popover-open')) {
  console.log('открыт');
}
```

### Программное управление: toast-уведомления

Пример реализации автоматически исчезающих уведомлений на `popover="manual"`:

```html
<div id="toast" popover="manual" role="status">
  <span id="toast-message"></span>
</div>
```

```javascript
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toast-message');

  msg.textContent = message;
  toast.showPopover();

  setTimeout(() => toast.hidePopover(), duration);
}

showToast('Данные сохранены');
```

### Несколько тостов одновременно

Поскольку `manual`-поповеры не закрывают друг друга, можно показывать стек уведомлений:

```javascript
function createToast(message, duration = 4000) {
  const toast = document.createElement('div');
  toast.setAttribute('popover', 'manual');
  toast.setAttribute('role', 'status');
  toast.className = 'toast';
  toast.textContent = message;

  document.body.appendChild(toast);
  toast.showPopover();

  setTimeout(() => {
    toast.hidePopover();
    toast.remove();
  }, duration);
}
```

```css
.toast {
  position: fixed;
  bottom: 16px;
  right: 16px;
  padding: 12px 20px;
  background: #1a202c;
  color: #fff;
  border-radius: 6px;
  /* Сдвиг для стекирования управляется через JS или anchor positioning */
}
```

## События

Popover API генерирует два события на целевом элементе:

### beforetoggle

Срабатывает перед сменой состояния. Позволяет отменить действие:

```javascript
const menu = document.getElementById('menu');

menu.addEventListener('beforetoggle', (event) => {
  console.log('Было:', event.oldState); // 'closed' или 'open'
  console.log('Станет:', event.newState); // 'open' или 'closed'

  // Отменить открытие при определённом условии
  if (event.newState === 'open' && !userIsAuthenticated()) {
    event.preventDefault();
  }
});
```

### toggle

Срабатывает после смены состояния:

```javascript
menu.addEventListener('toggle', (event) => {
  if (event.newState === 'open') {
    loadMenuItems(); // Ленивая загрузка содержимого
  }
});
```

## Позиционирование рядом с триггером

По умолчанию поповер размещается в центре экрана. Для позиционирования рядом с кнопкой используется CSS Anchor Positioning API (Chrome 125+):

```html
<button id="anchor-btn" popovertarget="anchored-menu">Меню</button>

<ul id="anchored-menu" popover anchor="anchor-btn">
  <li><a href="#">Профиль</a></li>
  <li><a href="#">Настройки</a></li>
  <li><a href="#">Выйти</a></li>
</ul>
```

```css
#anchored-menu {
  position: absolute;
  position-anchor: --anchor-btn;
  top: anchor(bottom);
  left: anchor(left);
  margin-top: 4px;
}

#anchor-btn {
  anchor-name: --anchor-btn;
}
```

Для более широкой поддержки браузеров позиционирование пока удобнее реализовывать через Floating UI или вычислять координаты вручную:

```javascript
const btn = document.getElementById('anchor-btn');
const menu = document.getElementById('anchored-menu');

btn.addEventListener('click', () => {
  const rect = btn.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.left = `${rect.left}px`;
});
```

## Вложенные поповеры

Поповер, находящийся внутри другого `auto`-поповера, не закрывает родителя при открытии:

```html
<button popovertarget="main-menu">Меню</button>

<div id="main-menu" popover>
  <button popovertarget="submenu">Настройки</button>

  <div id="submenu" popover>
    <a href="/settings/profile">Профиль</a>
    <a href="/settings/security">Безопасность</a>
  </div>
</div>
```

Важно: вложенность в HTML-структуре здесь необязательна — достаточно указать `anchor` или разместить дочерний поповер внутри родительского. Браузер отслеживает цепочку «invoker → popover» и не закрывает родителя при открытии дочернего.

## Доступность

Popover API проектировался с учётом доступности:

- Кнопка-триггер автоматически получает `aria-expanded` при использовании `popovertarget`
- Поповер размещается в top layer, что исключает проблемы со срезанием через `overflow: hidden`
- Фокус-менеджмент: при закрытии фокус возвращается на триггер
- `Escape` всегда закрывает `auto`-поповер

Дополнительные рекомендации:

```html
<!-- Добавьте role и aria-label для семантики -->
<div id="user-menu" popover role="menu" aria-label="Меню пользователя">
  <a href="/profile" role="menuitem">Профиль</a>
  <a href="/logout" role="menuitem">Выйти</a>
</div>

<!-- Для тултипов используйте role="tooltip" -->
<button aria-describedby="hint">Сохранить</button>
<div id="hint" popover="hint" role="tooltip">
  Ctrl+S
</div>
```

## Поддержка браузеров

Базовый Popover API (`popover`, `popovertarget`):
- Chrome 114+
- Firefox 125+
- Safari 17+

Animate to/from display none (`@starting-style`, `transition: display allow-discrete`):
- Chrome 117+
- Firefox 129+
- Safari 17.5+

CSS Anchor Positioning:
- Chrome 125+
- Firefox и Safari — в разработке

Для проверки поддержки:

```javascript
if (HTMLElement.prototype.showPopover) {
  // Popover API поддерживается
} else {
  // Полифил или альтернативная реализация
}
```

Полифил: [oddbird/popover-polyfill](https://github.com/oddbird/popover-polyfill) покрывает браузеры без нативной поддержки.

## Когда использовать Popover API

Popover API подходит для:

- Дропдаун-меню навигации
- Контекстных меню
- Toast-уведомлений
- Тултипов с дополнительной информацией
- Пикеров (дата, цвет, эмодзи)
- Панелей фильтров и настроек

Не подходит для:

- Полноэкранных модальных окон с блокировкой фона (используйте `<dialog>`)
- Слайдеров и боковых панелей с анимацией въезда

## Итог

Popover API устраняет целый класс задач, которые раньше требовали либо сторонних библиотек, либо самодельного кода на несколько сотен строк. Браузер берёт на себя top layer, закрытие по Escape и клику вне, управление фокусом и базовую семантику.

Для освоения современного JavaScript и DOM API — от базовых концепций до продвинутых паттернов — смотрите курс на PurpleSchool:

[Курс по JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=javascript-popover-api)