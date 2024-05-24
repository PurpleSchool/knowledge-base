---
metaTitle: Управление количеством повторений анимации с помощью CSS animation-iteration-count
metaDescription: Узнайте, как с помощью свойства CSS animation-iteration-count задавать количество повторений анимации, включая бесконечные циклы. Подробное руководство с примерами.
author: Дмитрий Нечаев
title: CSS animation-iteration-count; Полное руководство по управлению количеством повторений анимации
preview: Узнайте, как использовать CSS animation-iteration-count для задания количества повторений анимации. Подробное руководство с примерами.
---

Свойство `animation-iteration-count` в CSS позволяет контролировать, сколько раз будет воспроизводиться анимация. Это может быть заданное количество раз или бесконечное повторение. В этой статье мы подробно рассмотрим, как использовать `animation-iteration-count`, и приведем примеры для лучшего понимания.

## Основы animation-iteration-count

Свойство `animation-iteration-count` задает количество повторений анимации. Значение этого свойства может быть числом или ключевым словом `infinite`, что означает бесконечное повторение.

### Синтаксис animation-iteration-count

Синтаксис использования свойства `animation-iteration-count` простой:

```css
.element {
  animation-iteration-count: количество;
}
```

### Пример использования

Рассмотрим простой пример, где анимация выполняется 3 раза:

```css
@keyframes example {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100px);
  }
}

.iteration-element {
  animation-name: example;
  animation-duration: 2s;
  animation-iteration-count: 3; /* Анимация повторяется 3 раза */
}
```

В этом примере элемент `.iteration-element` будет перемещаться слева направо и обратно 3 раза.

## Бесконечная анимация

Чтобы задать бесконечное повторение анимации, используется ключевое слово `infinite`.

### Пример бесконечной анимации

Рассмотрим пример бесконечной анимации, где элемент будет постоянно вращаться:

```css
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.infinite-rotation {
  animation-name: rotate;
  animation-duration: 4s;
  animation-iteration-count: infinite; /* Анимация повторяется бесконечно */
}
```

В этом примере элемент `.infinite-rotation` будет вращаться бесконечно.

## Комбинирование с другими свойствами анимации

Свойство `animation-iteration-count` часто используется вместе с другими анимационными свойствами, такими как `animation-duration`, `animation-timing-function`, `animation-delay`, и `animation-direction`.

### Пример с комплексной анимацией

Рассмотрим более сложный пример, где используется несколько анимационных свойств:

```css
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-100px);
  }
  100% {
    transform: translateY(0);
  }
}

.bounce-element {
  animation-name: bounce;
  animation-duration: 1s;
  animation-timing-function: ease-in-out;
  animation-delay: 0.5s;
  animation-iteration-count: infinite; /* Анимация повторяется бесконечно */
  animation-direction: alternate;
}
```

Здесь элемент `.bounce-element` будет двигаться вверх и вниз бесконечно, чередуя направление анимации.

## Практические примеры использования animation-iteration-count

### Пример с мигающей анимацией

Создадим анимацию, которая будет заставлять элемент мигать 5 раз:

```css
@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.blink-element {
  animation-name: blink;
  animation-duration: 1s;
  animation-iteration-count: 5; /* Анимация повторяется 5 раз */
}
```

### Пример с движущейся анимацией

Создадим анимацию, которая будет перемещать элемент из стороны в сторону 10 раз:

```css
@keyframes move {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100px);
  }
}

.move-element {
  animation-name: move;
  animation-duration: 2s;
  animation-iteration-count: 10; /* Анимация повторяется 10 раз */
}
```

## Советы и рекомендации

1. **Подбор количества повторений**. Подбирайте количество повторений в зависимости от контекста и необходимости. Бесконечные анимации могут быть утомительными для пользователя, если их неправильно использовать.

2. **Комбинирование с другими свойствами**. Используйте `animation-iteration-count` вместе с `animation-delay` и `animation-timing-function` для создания более плавных и естественных анимаций.

3. **Тестирование в разных браузерах**. Убедитесь, что ваши анимации корректно работают в различных браузерах, так как поддержка CSS-анимаций может отличаться.

## Заключение

Свойство `animation-iteration-count` в CSS является важным инструментом для управления количеством повторений анимаций. Используя это свойство, вы можете задавать точное количество повторений или бесконечное выполнение анимации в зависимости от ваших потребностей и контекста. Следуя приведенным рекомендациям и примерам, вы сможете эффективно использовать `animation-iteration-count` в своих проектах, улучшая взаимодействие с пользователями и делая ваши веб-страницы более динамичными и привлекательными.