---
metaTitle: Использование CSS animation-direction для управления направлением анимации
metaDescription: Узнайте, как с помощью свойства CSS animation-direction задавать направление анимации. Подробное руководство с примерами.
author: Дмитрий Нечаев
title: CSS animation-direction; Полное руководство по управлению направлением анимации
preview: Узнайте, как использовать CSS animation-direction для управления направлением анимации. Подробное руководство с примерами.
---

Свойство `animation-direction` в CSS позволяет контролировать, в каком направлении будет проигрываться анимация. Это полезно для создания более сложных и реалистичных анимационных эффектов. В этой статье мы подробно рассмотрим, как использовать `animation-direction`, и приведем примеры для лучшего понимания.

## Основы animation-direction

Свойство `animation-direction` определяет, будет ли анимация воспроизводиться в прямом, обратном направлении или чередоваться между ними.

### Варианты значения animation-direction

- `normal` - Анимация воспроизводится в обычном направлении (по умолчанию).
- `reverse` - Анимация воспроизводится в обратном направлении.
- `alternate` - Анимация чередуется между обычным и обратным направлениями.
- `alternate-reverse` - Анимация чередуется, начиная с обратного направления.

### Синтаксис animation-direction

Синтаксис использования свойства `animation-direction` простой:

```css
.element {
  animation-direction: normal | reverse | alternate | alternate-reverse;
}
```

### Пример использования

Рассмотрим простой пример, где анимация воспроизводится в различных направлениях:

```css
@keyframes example {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100px);
  }
}

.normal-direction {
  animation-name: example;
  animation-duration: 2s;
  animation-direction: normal; /* Анимация в обычном направлении */
}

.reverse-direction {
  animation-name: example;
  animation-duration: 2s;
  animation-direction: reverse; /* Анимация в обратном направлении */
}

.alternate-direction {
  animation-name: example;
  animation-duration: 2s;
  animation-direction: alternate; /* Анимация чередуется между обычным и обратным направлениями */
}

.alternate-reverse-direction {
  animation-name: example;
  animation-duration: 2s;
  animation-direction: alternate-reverse; /* Анимация чередуется, начиная с обратного направления */
}
```

## Подробное рассмотрение каждого значения

### normal

Когда `animation-direction` установлено в `normal`, анимация выполняется от начального состояния к конечному и повторяется, если указано свойство `animation-iteration-count`.

```css
@keyframes slide {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100px);
  }
}

.normal-animation {
  animation-name: slide;
  animation-duration: 3s;
  animation-direction: normal;
  animation-iteration-count: infinite;
}
```

### reverse

Значение `reverse` заставляет анимацию начинаться с конечного состояния и двигаться к начальному.

```css
.reverse-animation {
  animation-name: slide;
  animation-duration: 3s;
  animation-direction: reverse;
  animation-iteration-count: infinite;
}
```

### alternate

При использовании `alternate` анимация чередуется между обычным и обратным направлениями. Это означает, что после завершения анимации в обычном направлении, она начнется сначала, но в обратном направлении.

```css
.alternate-animation {
  animation-name: slide;
  animation-duration: 3s;
  animation-direction: alternate;
  animation-iteration-count: infinite;
}
```

### alternate-reverse

Значение `alternate-reverse` похоже на `alternate`, но анимация начинается с обратного направления.

```css
.alternate-reverse-animation {
  animation-name: slide;
  animation-duration: 3s;
  animation-direction: alternate-reverse;
  animation-iteration-count: infinite;
}
```

## Практические примеры использования animation-direction

### Пример с пульсирующей анимацией

Рассмотрим пример, где используется `alternate` для создания пульсирующего эффекта:

```css
@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.2);
  }
}

.pulse-alternate {
  animation-name: pulse;
  animation-duration: 1s;
  animation-direction: alternate;
  animation-iteration-count: infinite;
}
```

### Пример с вращающейся анимацией

Создадим вращающуюся анимацию, которая будет чередоваться между обычным и обратным направлениями:

```css
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotate-alternate-reverse {
  animation-name: rotate;
  animation-duration: 4s;
  animation-direction: alternate-reverse;
  animation-iteration-count: infinite;
}
```

## Советы и рекомендации

1. **Использование в комбинации с другими свойствами**. Свойство `animation-direction` часто используется вместе с `animation-iteration-count` для создания сложных анимаций.

2. **Тестирование в разных браузерах**. Убедитесь, что ваши анимации корректно работают в различных браузерах, поскольку поддержка CSS-анимаций может отличаться.

3. **Умеренность**. Избегайте чрезмерного использования анимаций, чтобы не перегружать пользователей и не снижать производительность сайта.

## Заключение

Свойство `animation-direction` в CSS является мощным инструментом, позволяющим разработчикам контролировать направление воспроизведения анимаций. Используя различные значения этого свойства, можно создавать более сложные и реалистичные анимационные эффекты. Надеемся, что это руководство помогло вам лучше понять, как использовать `animation-direction` в ваших проектах.