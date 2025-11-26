---
metaTitle: Функция append в Go Golang
metaDescription: Узнайте как функция append в Go Golang помогает эффективно работать с срезами изучите синтаксис и особенности расширения функций
author: Олег Марков
title: Функция append в Go Golang
preview: Исследуйте функцию append в Go - как она работает зачем нужна и как позволяет расширять срезы. Примеры и пояснения помогут вам быстро освоить её
---

## Введение

Шапка в контексте веб‑разработки и интерфейсов — это верхняя часть страницы или приложения, которая появляется на всех или большинстве экранов и содержит ключевые элементы навигации и брендинга. Вы её видите везде: логотип, главное меню, кнопка входа, иногда строка поиска, уведомления и т.п. Часто шапка реализуется как фиксированный элемент, который остается при прокрутке, или как адаптивный блок, перестраивающийся под разные размеры экрана.

Смотрите, здесь важно понимать две вещи:

1. Шапка — это не только верстка (HTML и CSS), но и логика поведения (JavaScript).
2. Хорошо спроектированная шапка избавляет вас от множества проблем: от верстки до поддержки и доработок.

В этой статье мы разберем:

- из чего состоит типичная шапка;
- как сверстать базовую шапку на HTML и CSS;
- как сделать адаптивную шапку для мобильных устройств;
- как реализовать липкую (sticky) или фиксированную шапку;
- как добавить динамическое поведение на JavaScript;
- как структурировать код, чтобы шапку было удобно поддерживать и расширять.

Я покажу вам примеры кода и по шагам объясню, что и зачем делается.

## Структура шапки: базовые элементы

### Основные составляющие шапки

Чаще всего шапка содержит:

- логотип или название продукта;
- основную навигацию (меню);
- вспомогательные элементы: кнопка входа/регистрации, иконки профиля, корзины, уведомлений;
- поиск (необязательно);
- переключатели языка/темы/валюты и т.д.

Чтобы шапку было просто поддерживать, её лучше разбивать на логические области:

- левый блок — логотип;
- центральный блок — навигация;
- правый блок — действия пользователя.

Давайте разберемся, как это оформить в HTML.

### Базовая HTML-разметка шапки

Сейчас я покажу вам простой, но удобный каркас шапки.

```html
<header class="site-header">
  <div class="site-header__inner">
    <!-- Логотип / бренд -->
    <a href="/" class="site-header__logo">
      <!-- Обычно здесь логотип в виде изображения или текста -->
      <span class="site-header__logo-text">MyProject</span>
    </a>

    <!-- Главное меню -->
    <nav class="site-header__nav" aria-label="Главная навигация">
      <ul class="site-header__nav-list">
        <!-- Каждый пункт меню — отдельный элемент списка -->
        <li class="site-header__nav-item">
          <a href="/features" class="site-header__nav-link">Функции</a>
        </li>
        <li class="site-header__nav-item">
          <a href="/pricing" class="site-header__nav-link">Цены</a>
        </li>
        <li class="site-header__nav-item">
          <a href="/blog" class="site-header__nav-link">Блог</a>
        </li>
        <li class="site-header__nav-item">
          <a href="/contacts" class="site-header__nav-link">Контакты</a>
        </li>
      </ul>
    </nav>

    <!-- Блок действий пользователя -->
    <div class="site-header__actions">
      <!-- Например, кнопка входа -->
      <a href="/login" class="btn btn--secondary">Войти</a>
      <!-- И кнопка регистрации -->
      <a href="/signup" class="btn btn--primary">Регистрация</a>
    </div>
  </div>
</header>
```

Обратите внимание на несколько моментов:

- Мы используем семантический тег header — это помогает доступности и SEO.
- Внутри есть nav с атрибутом aria-label — это полезно для экранных читалок.
- Меню оформлено через список ul/li — это структурирует навигацию и удобно стилизуется.
- Используем модульные классы site-header__... — вам будет проще масштабировать стиль.

Теперь давайте посмотрим, как оформить это в CSS.

## Базовая стилизация шапки

### Верстка шапки с помощью flexbox

Наша задача: разместить логотип слева, меню по центру, действия справа. С flexbox это делается довольно просто.

```css
/* Общий контейнер шапки */
.site-header {
  position: relative;           /* Пока шапка обычная, не фиксированная */
  z-index: 100;                 /* Чуть выше основного контента */
  background-color: #ffffff;    /* Белый фон */
  border-bottom: 1px solid #eee;/* Легкая линия снизу */
}

/* Внутренняя обертка для выравнивания содержимого */
.site-header__inner {
  max-width: 1200px;            /* Ограничиваем ширину по центру экрана */
  margin: 0 auto;               /* Центрируем содержимое */
  display: flex;                /* Включаем flexbox */
  align-items: center;          /* Выравниваем элементы по вертикали */
  justify-content: space-between; /* Разносим логотип и действия по краям */
  padding: 12px 16px;           /* Внутренние отступы */
  box-sizing: border-box;       /* Учитываем padding в ширине */
}

/* Логотип */
.site-header__logo {
  display: inline-flex;         /* Чтобы можно было выровнять содержимое */
  align-items: center;          /* Вертикальное выравнивание текста/иконки */
  text-decoration: none;        /* Убираем подчеркивание */
}

.site-header__logo-text {
  font-size: 20px;              /* Крупный текст для бренда */
  font-weight: 700;             /* Жирное начертание */
  color: #222;                  /* Темный текст */
}

/* Навигация */
.site-header__nav {
  margin: 0 24px;               /* Небольшой отступ слева и справа */
}

.site-header__nav-list {
  display: flex;                /* Горизонтальный список */
  gap: 16px;                    /* Расстояние между пунктами меню */
  list-style: none;             /* Убираем маркеры списка */
  margin: 0;                    /* Убираем внешние отступы по умолчанию */
  padding: 0;                   /* Убираем внутренние отступы по умолчанию */
}

.site-header__nav-link {
  text-decoration: none;        /* Убираем подчеркивание */
  color: #555;                  /* Спокойный базовый цвет */
  font-size: 14px;
  padding: 4px 0;               /* Чуть увеличиваем кликабельную область */
}

.site-header__nav-link:hover,
.site-header__nav-link:focus {
  color: #000;                  /* Подсветка при наведении и фокусе */
}

/* Блок действий пользователя */
.site-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;                     /* Расстояние между кнопками */
}

/* Базовые стили кнопок */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  border: 1px solid transparent;
  text-decoration: none;
  cursor: pointer;
}

/* Вторичная кнопка (контурная) */
.btn--secondary {
  color: #333;
  background-color: #ffffff;
  border-color: #ccc;
}

/* Основная кнопка */
.btn--primary {
  color: #ffffff;
  background-color: #007bff;    /* Синий цвет */
  border-color: #007bff;
}

.btn--primary:hover,
.btn--primary:focus {
  background-color: #0069d9;    /* Чуть темнее при наведении */
  border-color: #0062cc;
}
```

Как видите, этот код создает аккуратную и читаемую шапку. Такой базовый вариант можно использовать как стартовую точку практически в любом проекте.

Теперь давайте посмотрим, как сделать эту шапку удобной на мобильных устройствах.

## Адаптивная шапка и мобильное меню

### Зачем нужна адаптивность шапки

На десктопе много горизонтального места, а на телефоне — нет. Если попытаться показать то же меню из 6–8 пунктов на ширине 320–375 пикселей, ссылки будут либо слипаться, либо переноситься в две строки, что выглядит плохо и неудобно.

Типичное решение — «гамбургер»-меню:

- на широкой ширине показываем полное меню;
- на узкой — скрываем пункты меню, показываем иконку кнопки;
- по нажатию открываем выпадающее/выезжающее меню.

Давайте реализуем такой вариант.

### HTML-разметка для мобильного меню

Нам нужно добавить кнопку, которая будет управлять видимостью навигации.

```html
<header class="site-header">
  <div class="site-header__inner">
    <a href="/" class="site-header__logo">
      <span class="site-header__logo-text">MyProject</span>
    </a>

    <!-- Кнопка открытия мобильного меню -->
    <button class="site-header__burger" type="button" aria-label="Открыть меню">
      <!-- Здесь можно использовать SVG или псевдоэлементы -->
      <span class="site-header__burger-line"></span>
      <span class="site-header__burger-line"></span>
      <span class="site-header__burger-line"></span>
    </button>

    <nav class="site-header__nav" aria-label="Главная навигация">
      <ul class="site-header__nav-list">
        <li class="site-header__nav-item">
          <a href="/features" class="site-header__nav-link">Функции</a>
        </li>
        <li class="site-header__nav-item">
          <a href="/pricing" class="site-header__nav-link">Цены</a>
        </li>
        <li class="site-header__nav-item">
          <a href="/blog" class="site-header__nav-link">Блог</a>
        </li>
        <li class="site-header__nav-item">
          <a href="/contacts" class="site-header__nav-link">Контакты</a>
        </li>
      </ul>
    </nav>

    <div class="site-header__actions">
      <a href="/login" class="btn btn--secondary">Войти</a>
      <a href="/signup" class="btn btn--primary">Регистрация</a>
    </div>
  </div>
</header>
```

Теперь вы увидите, как это выглядит в стилях.

### CSS: скрытие меню и показ «бургер»-кнопки

Подход такой:

- на десктопе кнопка burger скрыта, меню видно;
- на мобильном наоборот — меню скрыто, кнопка видно;
- при открытии меню с помощью класса модификатора показываем навигацию.

```css
/* Кнопка "бургер" по умолчанию скрыта (для больших экранов) */
.site-header__burger {
  display: none;                /* На десктопе не показываем */
  flex-direction: column;       /* Линии одна под другой */
  justify-content: center;
  gap: 4px;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

/* Линии в "бургер"-кнопке */
.site-header__burger-line {
  width: 20px;
  height: 2px;
  background-color: #333;
  border-radius: 1px;
}

/* Медиа-запрос для мобильных устройств */
@media (max-width: 768px) {
  .site-header__inner {
    /* На мобильных можем чуть по‑другому распределить элементы */
    justify-content: space-between;
  }

  /* Показываем "бургер" на мобильных */
  .site-header__burger {
    display: flex;
  }

  /* Прячем меню и действия по умолчанию */
  .site-header__nav,
  .site-header__actions {
    display: none;
  }

  /* Оформляем раскрытое мобильное меню */
  .site-header--menu-open .site-header__nav {
    display: block;             /* Показываем меню под шапкой */
    position: absolute;
    top: 100%;                  /* Сразу под шапкой */
    left: 0;
    right: 0;
    background-color: #ffffff;
    border-bottom: 1px solid #eee;
  }

  .site-header--menu-open .site-header__nav-list {
    display: flex;
    flex-direction: column;     /* Вертикальное меню */
    padding: 8px 0;
  }

  .site-header--menu-open .site-header__nav-link {
    padding: 10px 16px;         /* Увеличиваем область нажатия */
    display: block;
  }

  /* Можно также показывать блок действий в меню */
  .site-header--menu-open .site-header__actions {
    display: flex;              /* Показываем кнопки входа/регистрации */
    flex-direction: column;
    padding: 8px 16px 12px;
    gap: 8px;
  }
}
```

Здесь я использую класс-модификатор site-header--menu-open. Он будет добавляться к корневому элементу шапки при открытии меню. Давайте теперь посмотрим на JavaScript.

### JavaScript: логика открытия и закрытия меню

Задача:

- при клике по burger добавлять/убирать класс site-header--menu-open на header;
- по возможности закрывать меню при переходе по пункту навигации.

```html
<script>
// Ждем, пока DOM будет готов
document.addEventListener('DOMContentLoaded', function () {
  // Находим DOM-элементы
  var header = document.querySelector('.site-header');
  var burger = document.querySelector('.site-header__burger');
  var navLinks = document.querySelectorAll('.site-header__nav-link');

  // Обработчик клика по "бургер"-кнопке
  burger.addEventListener('click', function () {
    // Переключаем класс, который открывает/закрывает меню
    header.classList.toggle('site-header--menu-open');
  });

  // Закрываем меню при клике по пункту навигации (на мобильном)
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      // Убираем класс, если меню было открыто
      header.classList.remove('site-header--menu-open');
    });
  });
});
</script>
```

Обратите внимание, как этот фрагмент кода решает задачу: он не привязывается к ширине экрана напрямую, а просто управляет классом. Все остальное делает CSS.

## Фиксированная и липкая шапка

Иногда нужно, чтобы шапка всегда оставалась видимой при прокрутке. Есть две основных модели:

- фиксированная шапка (fixed) — всегда прижата к верхнему краю окна;
- липкая шапка (sticky) — ведет себя как обычная, но когда доходит до верха при прокрутке, «прилипает» к нему.

Давайте разберем обе.

### Фиксированная шапка

Сделать шапку фиксированной довольно просто — нужно изменить пару свойств CSS.

```css
/* Вариант фиксированной шапки */
.site-header--fixed {
  position: fixed;   /* Фиксируем относительно окна браузера */
  top: 0;            /* Прижимаем к верху */
  left: 0;
  right: 0;
}
```

Но здесь есть важный момент: когда вы делаете шапку position: fixed, она «выпрыгивает» из потока документа, и основной контент поднимается вверх, оказываясь под ней. Чтобы этого не произошло, добавьте сверху отступ для основного контейнера.

```css
/* Например, для основного содержимого страницы */
.page-content {
  padding-top: 64px;  /* Высота шапки (примерно) */
}
```

Смотрите, высоту лучше не угадывать, а привязать к реальному значению. Для этого можно использовать CSS‑переменную.

```css
:root {
  --site-header-height: 64px; /* Здесь задаем высоту шапки один раз */
}

.site-header__inner {
  min-height: var(--site-header-height);
}

.site-header--fixed + .page-content {
  /* Добавляем отступ сразу после фиксированной шапки */
  padding-top: var(--site-header-height);
}
```

Теперь, когда вы добавите класс site-header--fixed к header, страница не «прыгнет», а контент аккуратно начнется под шапкой.

### Липкая шапка (sticky)

Липкую шапку еще проще сделать только средствами CSS.

```css
.site-header--sticky {
  position: sticky;     /* Липкое позиционирование */
  top: 0;               /* Начинает «липнуть» при достижении верха */
  z-index: 100;         /* Чтобы быть поверх контента */
}
```

При этом header остается в потоке документа, поэтому дополнительный отступ к контенту обычно не нужен. Но важно помнить:

- позиционирование sticky работает, только если над элементом нет ограничивающих overflow: hidden / auto контейнеров (они создают новый контекст прокрутки);
- поддержка в современных браузерах хорошая, но если у вас есть очень старые браузеры, может понадобиться запасной вариант.

Если вы хотите включать/выключать липкость динамически, можете добавить условный класс через JavaScript, но в большинстве случаев достаточно статического варианта.

## Дополнительные элементы шапки

### Строка поиска в шапке

Часто в шапке нужен простой поиск по сайту. Давайте посмотрим, как его аккуратно встроить.

```html
<div class="site-header__search">
  <!-- Форма отправляет запрос на страницу поиска -->
  <form action="/search" method="get" class="search-form">
    <!-- Поле ввода запроса -->
    <input
      type="search"
      name="q"
      class="search-form__input"
      placeholder="Поиск по сайту"
      aria-label="Поиск по сайту"
    >
    <!-- Кнопка отправки -->
    <button type="submit" class="search-form__button">
      <!-- Здесь может быть иконка лупы -->
      Найти
    </button>
  </form>
</div>
```

И минимальная стилизация:

```css
.site-header__search {
  margin: 0 16px;
  flex: 1;                       /* Можно дать блоку поиска возможность растягиваться */
  max-width: 300px;              /* Но ограничить максимальную ширину */
}

.search-form {
  display: flex;
  align-items: center;
}

.search-form__input {
  flex: 1;
  padding: 6px 8px;
  border-radius: 4px 0 0 4px;
  border: 1px solid #ccc;
  border-right: none;
  font-size: 14px;
}

.search-form__button {
  padding: 6px 10px;
  border-radius: 0 4px 4px 0;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  cursor: pointer;
}
```

На мобильном поиск часто убирают в отдельную иконку, открывающую строку поиска. Либо отображают поиск на отдельной странице — это упрощает интерфейс.

### Иконки профиля, корзины, уведомлений

Эти элементы часто реализуются как кнопки с иконками. Хорошая практика — добавлять подписи для доступности:

```html
<div class="site-header__icons">
  <!-- Иконка уведомлений -->
  <button class="icon-button" type="button" aria-label="Уведомления">
    <!-- Здесь может быть SVG-иконка колокольчика -->
    <span class="icon icon--bell"></span>
  </button>

  <!-- Иконка корзины -->
  <a href="/cart" class="icon-button" aria-label="Корзина">
    <span class="icon icon--cart"></span>
    <!-- Бейдж с количеством товаров -->
    <span class="icon-button__badge">3</span>
  </a>

  <!-- Иконка профиля -->
  <a href="/profile" class="icon-button" aria-label="Профиль">
    <span class="icon icon--user"></span>
  </a>
</div>
```

И пример стилизации:

```css
.site-header__icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-button {
  position: relative;
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: none;
  background-color: transparent;
  cursor: pointer;
}

.icon-button__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background-color: #ff4757;
  color: #ffffff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

Такой подход позволяет легко добавлять новые иконки и управлять их поведением отдельно от основной навигации.

## Организация кода шапки в проекте

### Разделение на компоненты

Когда шапка становится сложной, важно не превращать её в «монолитный» кусок HTML и CSS. Удобно разбить шапку на компоненты:

- header-layout — общий каркас шапки;
- logo — компонент логотипа;
- main-nav — компонент основного меню;
- user-actions — блок кнопок и иконок;
- search-bar — строка поиска;
- mobile-menu — логика раскрытия меню на мобильном.

В шаблонизаторе или фронтенд-фреймворке (React, Vue, Angular) это обычно оформляется в виде отдельных файлов. На «чистом» HTML можно сделать include‑шаблоны на уровне бэкенда (например, в Go templates, PHP, Django и т.д.).

Простой пример разбиения (условно, через комментарии):

```html
<header class="site-header site-header--fixed">
  <div class="site-header__inner">
    <!-- component: logo -->
    <a href="/" class="site-header__logo">
      <span class="site-header__logo-text">MyProject</span>
    </a>

    <!-- component: burger -->
    <button class="site-header__burger" type="button" aria-label="Открыть меню">
      <span class="site-header__burger-line"></span>
      <span class="site-header__burger-line"></span>
      <span class="site-header__burger-line"></span>
    </button>

    <!-- component: main-nav -->
    <nav class="site-header__nav" aria-label="Главная навигация">
      <!-- ... -->
    </nav>

    <!-- component: user-actions -->
    <div class="site-header__actions">
      <!-- ... -->
    </div>
  </div>
</header>
```

Так вы четко видите, что шапка — это набор переиспользуемых частей.

### Модификаторы для разных страниц

Иногда на разных страницах нужна разная шапка:

- на главной — прозрачная поверх баннера;
- внутри кабинета — с другим цветом и дополнительным меню;
- на лендинге — без некоторых пунктов.

Вместо того чтобы плодить несколько версий разметки, используйте модификаторы на корневом элементе:

```html
<header class="site-header site-header--transparent">
  <!-- Шапка для главной страницы -->
</header>

<header class="site-header site-header--dashboard">
  <!-- Шапка для личного кабинета -->
</header>
```

И настройте различия в CSS:

```css
.site-header--transparent {
  background-color: transparent;
  border-bottom: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.site-header--dashboard {
  background-color: #111827; /* Темная шапка */
  color: #ffffff;
}

.site-header--dashboard .site-header__nav-link {
  color: #e5e7eb;
}
```

Такой подход легко поддерживать, если вы заранее продумали архитектуру классов.

## Доступность и UX шапки

### Фокус и клавиатурная навигация

Шапка — один из первых элементов, с которым взаимодействуют пользователи, в том числе с клавиатурой. Давайте убедимся, что:

- все интерактивные элементы доступны через Tab;
- есть заметные стили фокуса;
- aria‑атрибуты проставлены корректно.

Пример стилей фокуса:

```css
.site-header a:focus,
.site-header button:focus {
  outline: 2px solid #2563eb;  /* Синяя рамка */
  outline-offset: 2px;         /* Небольшой отступ от элемента */
}
```

Для меню «бургер» удобно использовать aria-expanded:

```html
<button
  class="site-header__burger"
  type="button"
  aria-label="Открыть меню"
  aria-expanded="false"
>
  <span class="site-header__burger-line"></span>
  <span class="site-header__burger-line"></span>
  <span class="site-header__burger-line"></span>
</button>
```

И обновлять значение при клике:

```javascript
document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');
  var burger = document.querySelector('.site-header__burger');

  burger.addEventListener('click', function () {
    var isOpen = header.classList.toggle('site-header--menu-open');
    // Обновляем aria-expanded в зависимости от состояния
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
});
```

Так пользователи с экранными читалками будут понимать, открыто меню или нет.

### Поведение шапки при прокрутке

Иногда шапку делают динамической: она уменьшается при скролле вниз или скрывается, а потом появляется при прокрутке вверх. Покажу вам базовый пример поведения «скрывать при скролле вниз, показывать при скролле вверх».

```css
/* Состояние, когда шапка скрыта вверх */
.site-header--hidden {
  transform: translateY(-100%); /* Уводим шапку за пределы экрана */
  transition: transform 0.2s ease-in-out;
}

/* По умолчанию шапка видна */
.site-header {
  transition: transform 0.2s ease-in-out;
}
```

```javascript
document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');
  var lastScrollY = window.scrollY;

  window.addEventListener('scroll', function () {
    var currentScrollY = window.scrollY;

    // Если прокручиваем вниз и уже не в самом верху
    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      // Добавляем класс, скрывающий шапку
      header.classList.add('site-header--hidden');
    } else {
      // При прокрутке вверх показываем шапку
      header.classList.remove('site-header--hidden');
    }

    lastScrollY = currentScrollY;
  });
});
```

Этот паттерн улучшает UX на мобильных, где вертикальное пространство особенно ценно.

## Заключение

Шапка — это ключевой элемент интерфейса, который одновременно решает задачи навигации, брендинга и взаимодействия с пользователем. От того, насколько аккуратно вы её спроектируете и реализуете, зависит удобство использования сайта и дальнейшая поддержка кода.

Мы разобрали:

- базовую структуру шапки на HTML;
- стилизацию с помощью flexbox;
- адаптивное мобильное меню с «бургер»-кнопкой;
- реализацию фиксированной и липкой шапки;
- добавление поисковой строки и иконок действий;
- организацию кода и модификации шапки под разные сценарии;
- практики по доступности и динамическому поведению при прокрутке.

Используя эти подходы, вы можете создать гибкую, удобную и легко расширяемую шапку, которая подойдет как для небольших лендингов, так и для крупных веб‑приложений.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как сделать, чтобы шапка перекрывала контент только при открытом мобильном меню

Сделайте шапку position: relative, а при открытии меню добавляйте overlay под шапкой:

```css
.site-header__overlay {
  position: fixed;  /* Фиксируем поверх контента */
  inset: 0;         /* Растягиваем на весь экран */
  background: rgba(0, 0, 0, 0.4);
  display: none;
}

.site-header--menu-open .site-header__overlay {
  display: block;   /* Показываем затемнение только при открытом меню */
}
```

```html
<header class="site-header">
  <div class="site-header__overlay"></div>
  <!-- остальная разметка шапки -->
</header>
```

Так контент не сдвигается, но клики по нему блокируются при открытом меню.

### Как предотвратить «прыжок» контента при появлении фиксированной шапки только после скролла

Измерьте высоту шапки в JavaScript и задайте padding-top динамически:

```javascript
document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');
  var content = document.querySelector('.page-content');
  var headerHeight = header.offsetHeight;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 100) {
      header.classList.add('site-header--fixed');
      content.style.paddingTop = headerHeight + 'px';
    } else {
      header.classList.remove('site-header--fixed');
      content.style.paddingTop = '';
    }
  });
});
```

Так отступ добавляется ровно в момент фиксации и равен реальной высоте шапки.

### Как оптимально подсвечивать активный пункт меню в шапке

Если бэкенд знает текущий путь, добавляйте класс active в разметку сервера. В чистом фронтенде можно сравнивать location.pathname:

```javascript
document.addEventListener('DOMContentLoaded', function () {
  var path = window.location.pathname;
  var links = document.querySelectorAll('.site-header__nav-link');

  links.forEach(function (link) {
    if (link.getAttribute('href') === path) {
      link.classList.add('site-header__nav-link--active');
    }
  });
});
```

И в CSS:

```css
.site-header__nav-link--active {
  color: #000;
  border-bottom: 2px solid #2563eb; /* Подчеркиваем активный пункт */
}
```

### Как сделать, чтобы шапка не мерцала при переходах в SPA

В SPA оставляйте шапку частью корневого layout, а контент меняйте внутри. В React, например, делайте Header вне Router, а внутри только маршруты страницы. Тогда шапка монтируется один раз и не перерисовывается при каждом переходе.

### Как разделить стили шапки на модули в большом проекте

Используйте методологию БЭМ и разбейте стили на несколько файлов:

- header.base.css — базовая сетка и структура;
- header.theme.css — цвета, шрифты, темы;
- header.responsive.css — медиа‑запросы;
- header.states.css — состояния, анимации.

Подключайте эти файлы в сборщик (Webpack, Vite, Gulp) и объединяйте в один итоговый CSS. Так изменения в одном аспекте (например, адаптивность) не затрагивают остальной код.