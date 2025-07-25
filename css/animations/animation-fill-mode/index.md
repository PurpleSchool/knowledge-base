---
metaTitle: Использование CSS animation-fill-mode для управления состоянием элементов после анимации
metaDescription: Узнайте, как с помощью свойства CSS animation-fill-mode задавать поведение элементов после окончания анимации. Подробное руководство с примерами.
author: Дмитрий Нечаев
title: CSS animation-fill-mode; Полное руководство по управлению состоянием элементов после анимации
preview: Узнайте, как использовать CSS animation-fill-mode для управления состоянием элементов после окончания анимации. Подробное руководство с примерами.
---

Свойство `animation-fill-mode` в CSS позволяет контролировать состояние анимируемого элемента до и после выполнения анимации. Это полезно для сохранения стиля элемента после завершения анимации или для задания начального состояния до ее начала. В этой статье мы подробно рассмотрим, как использовать `animation-fill-mode`, и приведем примеры для лучшего понимания.

## Основы animation-fill-mode

Свойство `animation-fill-mode` определяет, каким образом будут применяться стили, определенные в ключевых кадрах анимации, к элементу до начала и после завершения анимации.

### Варианты значения animation-fill-mode

- `none` - Анимация не изменяет стили элемента до начала и после окончания (по умолчанию).
- `forwards` - После окончания анимации элемент сохраняет стили последнего ключевого кадра.
- `backwards` - Перед началом анимации элемент принимает стили начального ключевого кадра.
- `both` - Элемент сохраняет стили начального ключевого кадра до начала анимации и стили последнего ключевого кадра после окончания.

### Синтаксис animation-fill-mode

Синтаксис использования свойства `animation-fill-mode` простой:

```css
.element {
  animation-fill-mode: none | forwards | backwards | both;
}
```

### Пример использования

Рассмотрим простой пример, где анимация изменяет прозрачность элемента:

```css
@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-element {
  animation-name: fade;
  animation-duration: 2s;
  animation-fill-mode: forwards; /* Элемент сохраняет прозрачность после окончания анимации */
}
```

В этом примере элемент `.fade-element` будет плавно изменять прозрачность от 0 до 1 в течение 2 секунд и останется видимым после завершения анимации.

`animation-fill-mode` определяет, как элемент должен выглядеть после завершения анимации. Можно задать, чтобы элемент оставался в последнем кадре анимации, возвращался в исходное состояние или применял стили, заданные вне анимации. Правильный выбор `animation-fill-mode` может значительно улучшить визуальный эффект анимации. Если вы хотите детальнее погрузиться в мир веб-анимации и научиться управлять состоянием элементов после завершения анимации с помощью CSS — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=css-animation-fill-mode-polnoe-rukovodstvo-po-upravleniyu-sostoyaniem-elementov-posle-animatsii). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Подробное рассмотрение каждого значения

### none

Значение `none` означает, что анимация не влияет на стили элемента до и после ее выполнения. Элемент возвращается к своим исходным стилям.

```css
.none-animation {
  animation-name: fade;
  animation-duration: 2s;
  animation-fill-mode: none; /* Элемент возвращается к исходной прозрачности */
}
```

### forwards

Значение `forwards` сохраняет стили последнего ключевого кадра после окончания анимации.

```css
.forwards-animation {
  animation-name: fade;
  animation-duration: 2s;
  animation-fill-mode: forwards; /* Элемент сохраняет конечную прозрачность */
}
```

### backwards

Значение `backwards` применяет стили начального ключевого кадра до начала анимации.

```css
.backwards-animation {
  animation-name: fade;
  animation-duration: 2s;
  animation-delay: 1s;
  animation-fill-mode: backwards; /* Элемент принимает начальную прозрачность до начала анимации */
}
```

### both

Значение `both` объединяет эффекты `forwards` и `backwards`, применяя стили начального ключевого кадра до начала анимации и стили последнего ключевого кадра после ее окончания.

```css
.both-animation {
  animation-name: fade;
  animation-duration: 2s;
  animation-delay: 1s;
  animation-fill-mode: both; /* Элемент принимает начальную прозрачность до начала и конечную после окончания анимации */
}
```

## Практические примеры использования animation-fill-mode

### Пример с движущейся анимацией

Рассмотрим пример, где анимация перемещает элемент по экрану:

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
  animation-duration: 3s;
  animation-fill-mode: forwards; /* Элемент остается на месте после окончания анимации */
}
```

### Пример с вращающейся анимацией

Создадим анимацию, которая будет вращать элемент и сохранять его конечное состояние:

```css
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotate-element {
  animation-name: rotate;
  animation-duration: 4s;
  animation-fill-mode: forwards; /* Элемент сохраняет конечное вращение после окончания анимации */
}
```

## Советы и рекомендации

1. **Использование в комбинации с другими свойствами**. Свойство `animation-fill-mode` часто используется вместе с `animation-delay` и `animation-iteration-count` для создания более комплексных анимаций.

2. **Тестирование в разных браузерах**. Убедитесь, что ваши анимации корректно работают в различных браузерах, так как поддержка CSS-анимаций может отличаться.

3. **Подбор подходящего значения**. Выбирайте значение `animation-fill-mode` в зависимости от эффекта, которого хотите достичь: сохранение начальных или конечных стилей, или их комбинацию.

## Заключение

Свойство `animation-fill-mode` в CSS является важным инструментом для управления состоянием анимируемого элемента до начала и после окончания анимации. Используя это свойство, вы можете контролировать, каким образом применяются стили, определенные в ключевых кадрах анимации, и создавать более динамичные и привлекательные веб-страницы. Следуя приведенным рекомендациям и примерам, вы сможете эффективно использовать `animation-fill-mode` в своих проектах, улучшая взаимодействие с пользователями и делая ваши веб-страницы более интересными и интерактивными. На нашем курсе [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=css-animation-fill-mode-polnoe-rukovodstvo-po-upravleniyu-sostoyaniem-elementov-posle-animatsii) вы научитесь создавать профессиональные веб-сайты с анимациями, которые выглядят завершенными и логичными. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
