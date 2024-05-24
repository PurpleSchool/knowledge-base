---
metaTitle: Основы и примеры использования CSS-анимаций
metaDescription: Узнайте, как создавать живые и динамичные анимации с помощью CSS. Подробное руководство с примерами для начинающих и опытных разработчиков.
author: Дмитрий Нечаев
title: CSS-анимации; Полное руководство с примерами
preview: Погрузитесь в мир CSS-анимаций и научитесь создавать впечатляющие эффекты с помощью простого и понятного кода.
---

CSS-анимации позволяют веб-разработчикам добавлять интерактивные и живые эффекты на веб-страницы без использования JavaScript или других сложных технологий. Это мощный инструмент, который может существенно улучшить пользовательский интерфейс и повысить привлекательность сайта.

## Основы CSS-анимаций

### Свойство `transition`

Свойство `transition` является основой для создания простых анимаций. Оно позволяет плавно изменять значение CSS-свойства в течение определенного времени.

#### Синтаксис:

```css
.element {
  transition: property duration timing-function delay;
}
```

- `property` - CSS-свойство, которое будет анимироваться (например, `width`, `height`, `background-color`).
- `duration` - время, в течение которого будет происходить анимация (например, `2s` для двух секунд).
- `timing-function` - функция, определяющая скорость изменения анимации (например, `ease`, `linear`, `ease-in`, `ease-out`).
- `delay` - задержка перед началом анимации (например, `1s` для одной секунды).

#### Пример использования:

```css
.box {
  width: 100px;
  height: 100px;
  background-color: blue;
  transition: width 2s, height 2s, background-color 2s;
}

.box:hover {
  width: 200px;
  height: 200px;
  background-color: red;
}
```

### Свойство `@keyframes`

Для создания более сложных анимаций используется правило `@keyframes`. Оно позволяет задавать промежуточные состояния анимации.

#### Синтаксис:

```css
@keyframes animation-name {
  from {
    /* начальное состояние */
  }
  to {
    /* конечное состояние */
  }
}
```

Или можно использовать проценты для более детальной настройки:

```css
@keyframes animation-name {
  0% {
    /* начальное состояние */
  }
  50% {
    /* промежуточное состояние */
  }
  100% {
    /* конечное состояние */
  }
}
```

#### Пример использования:

```css
@keyframes move {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100px);
  }
}

.moving-box {
  width: 100px;
  height: 100px;
  background-color: green;
  animation: move 2s infinite;
}
```

### Свойства анимации

Для использования анимации, описанной с помощью `@keyframes`, нужно задать несколько свойств:

- `animation-name` - имя анимации (как задано в `@keyframes`).
- `animation-duration` - длительность анимации.
- `animation-timing-function` - функция времени.
- `animation-delay` - задержка перед началом.
- `animation-iteration-count` - количество повторений (например, `infinite` для бесконечного повторения).
- `animation-direction` - направление анимации (`normal`, `reverse`, `alternate`, `alternate-reverse`).

#### Пример использования:

```css
.moving-box {
  width: 100px;
  height: 100px;
  background-color: green;
  animation: move 2s ease-in-out infinite alternate;
}
```

## Примеры сложных анимаций

### Пульсирующий эффект

Создание эффекта пульсации для элемента:

```css
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.pulse-box {
  width: 100px;
  height: 100px;
  background-color: orange;
  animation: pulse 1s infinite;
}
```

### Анимация вращения

Создание эффекта вращения:

```css
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.rotate-box {
  width: 100px;
  height: 100px;
  background-color: purple;
  animation: rotate 3s linear infinite;
}
```

### Комбинированные анимации

Можно комбинировать несколько анимаций для создания более сложных эффектов:

```css
@keyframes move-and-rotate {
  0% {
    transform: translateX(0) rotate(0deg);
  }
  50% {
    transform: translateX(100px) rotate(180deg);
  }
  100% {
    transform: translateX(0) rotate(360deg);
  }
}

.combined-box {
  width: 100px;
  height: 100px;
  background-color: teal;
  animation: move-and-rotate 4s ease-in-out infinite;
}
```

## Советы и рекомендации

1. **Используйте `will-change` для улучшения производительности**. Свойство `will-change` подсказывает браузеру, какие свойства элемента будут меняться, что позволяет оптимизировать рендеринг.

   ```css
   .animated-element {
     will-change: transform, opacity;
   }
   ```

2. **Не злоупотребляйте анимациями**. Избыточные анимации могут замедлить работу сайта и раздражать пользователей.

3. **Проверяйте совместимость с браузерами**. Не все анимационные эффекты одинаково поддерживаются всеми браузерами, поэтому всегда проверяйте, как ваша анимация выглядит в различных браузерах.

## Заключение

CSS-анимации — мощный инструмент, который позволяет создавать живые и динамичные эффекты на веб-страницах. Они просты в использовании и могут значительно улучшить пользовательский опыт. Надеемся, что это руководство поможет вам лучше понять, как использовать CSS-анимации, и вдохновит на создание собственных эффектов.