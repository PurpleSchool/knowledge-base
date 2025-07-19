---
metaTitle: Управление анимацией с помощью CSS animation-play-state
metaDescription: Узнайте, как с помощью свойства CSS animation-play-state ставить анимации на паузу и запускать их снова. Полное руководство с примерами.
author: Дмитрий Нечаев
title: CSS animation-play-state; Полное руководство по управлению анимациями
preview: Узнайте, как использовать CSS animation-play-state для управления анимациями. Полное руководство с примерами.
---

Свойство `animation-play-state` в CSS позволяет управлять воспроизведением анимаций, ставить их на паузу и запускать снова. Это полезно для создания интерактивных веб-страниц, где пользователи могут управлять анимациями. В этой статье мы подробно рассмотрим, как использовать `animation-play-state`, и приведем примеры для лучшего понимания.

## Основы animation-play-state

Свойство `animation-play-state` управляет состоянием воспроизведения анимации. Оно может быть установлено в одно из двух значений:

- `running` - Анимация воспроизводится (по умолчанию).
- `paused` - Анимация приостановлена.

### Синтаксис animation-play-state

Синтаксис использования свойства `animation-play-state` простой:

```css
.element {
  animation-play-state: running | paused;
}
```

### Пример использования

Рассмотрим простой пример, где анимация перемещения элемента может быть приостановлена:

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
  animation-duration: 4s;
  animation-play-state: running; /* Анимация воспроизводится */
}

.move-element.paused {
  animation-play-state: paused; /* Анимация приостановлена */
}
```

В этом примере элемент `.move-element` будет перемещаться слева направо, но если к нему будет применен класс `.paused`, анимация приостановится.

`animation-play-state` позволяет управлять состоянием анимации, ставить ее на паузу или запускать снова. Это может быть полезно для создания интерактивных анимаций, которые реагируют на действия пользователя. Чтобы эффективно использовать `animation-play-state`, необходимо понимать, как работает анимация и как управлять ее состоянием. Если вы хотите детальнее погрузиться в мир веб-анимации и научиться создавать интерактивные и управляемые анимации с помощью CSS — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=css-animation-play-state-polnoe-rukovodstvo-po-upravleniyu-animatsiyami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Управление анимацией с помощью JavaScript

Свойство `animation-play-state` часто используется вместе с JavaScript для динамического управления анимациями на веб-странице.

### Пример использования JavaScript для управления анимацией

Рассмотрим пример, где анимация может быть приостановлена и возобновлена с помощью кнопок:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Управление анимацией</title>
  <style>
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .spin-element {
      width: 100px;
      height: 100px;
      background-color: red;
      animation-name: spin;
      animation-duration: 4s;
      animation-iteration-count: infinite;
      animation-play-state: running;
    }

    .spin-element.paused {
      animation-play-state: paused;
    }
  </style>
</head>
<body>
  <div class="spin-element" id="spinElement"></div>
  <button onclick="pauseAnimation()">Пауза</button>
  <button onclick="resumeAnimation()">Запуск</button>

  <script>
    function pauseAnimation() {
      document.getElementById('spinElement').classList.add('paused');
    }

    function resumeAnimation() {
      document.getElementById('spinElement').classList.remove('paused');
    }
  </script>
</body>
</html>
```

В этом примере анимация элемента с ID `spinElement` может быть приостановлена и возобновлена нажатием кнопок.

## Применение в реальных проектах

Свойство `animation-play-state` полезно для создания интерактивных элементов на веб-страницах, таких как игровые элементы, обучающие материалы или интерактивные презентации.

### Пример с интерактивной кнопкой

Рассмотрим пример, где анимация кнопки приостанавливается при наведении курсора:

```css
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.bounce-button {
  display: inline-block;
  padding: 10px 20px;
  background-color: blue;
  color: white;
  animation-name: bounce;
  animation-duration: 2s;
  animation-iteration-count: infinite;
  animation-play-state: running;
}

.bounce-button:hover {
  animation-play-state: paused; /* Приостанавливаем анимацию при наведении */
}
```

## Советы и рекомендации

1. **Использование в комбинации с JavaScript**. Свойство `animation-play-state` особенно полезно в сочетании с JavaScript для создания интерактивных веб-страниц.

2. **Тестирование в разных браузерах**. Убедитесь, что ваши анимации корректно работают в различных браузерах, так как поддержка CSS-анимаций может отличаться.

3. **Подбор подходящего состояния**. Определяйте логические моменты для приостановки и запуска анимаций, чтобы улучшить взаимодействие с пользователями.

## Заключение

Свойство `animation-play-state` в CSS является мощным инструментом для управления состоянием воспроизведения анимаций. Используя это свойство, вы можете ставить анимации на паузу и запускать их снова, создавая более интерактивные и динамичные веб-страницы. Следуя приведенным рекомендациям и примерам, вы сможете эффективно использовать `animation-play-state` в своих проектах, улучшая взаимодействие с пользователями и делая ваши веб-страницы более интересными и интерактивными.

`animation-play-state` – это полезный инструмент для создания интерактивных веб-сайтов. Но для создания действительно интересных и полезных анимаций необходимо не только знать, как работает `animation-play-state`, но и понимать принципы анимации и взаимодействия с пользователем. На нашем курсе [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=css-animation-play-state-polnoe-rukovodstvo-po-upravleniyu-animatsiyami) вы научитесь создавать профессиональные веб-сайты с интерактивной и управляемой анимацией. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
