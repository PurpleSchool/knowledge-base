---
metaTitle: Псевдокласс indeterminate в CSS. Стилизация неопределённого состояния элементов формы
metaDescription: Псевдокласс indeterminate в CSS. Стилизация неопределённого состояния элементов формы
author: Дмитрий Нечаев
title: Псевдокласс indeterminate в CSS. Полное руководство с примерами
preview: Псевдокласс indeterminate в CSS используется для стилизации элементов формы, находящихся в неопределённом состоянии.
---

Псевдокласс `:indeterminate` в CSS используется для стилизации элементов формы, находящихся в неопределённом состоянии. Это касается чекбоксов, радиокнопок и прогресс-баров. Такое состояние означает, что элемент не находится ни в состоянии "выбран", ни в состоянии "не выбран". В этой статье мы подробно рассмотрим псевдокласс `:indeterminate`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:indeterminate`?

Псевдокласс `:indeterminate` применяется к элементам формы, находящимся в неопределённом состоянии. Это состояние может быть полезно для отображения промежуточного статуса, например, при частично выбранных элементах или прогрессе, который не может быть точно измерен.

При работе с элементами форм в неопределенном состоянии, важно не только уметь их стилизовать, но и понимать, как они работают с точки зрения HTML. Это требует понимания не только CSS, но и структуры HTML-форм. Если вы хотите детальнее изучить HTML и CSS и создавать качественные интерфейсы — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass-indeterminate-v-CSS-Polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример базового использования `:indeterminate`

```css
input:indeterminate {
  /* Стили для элементов в неопределённом состоянии */
}

```

Пример использования псевдокласса `:indeterminate` для изменения стилей чекбоксов в неопределённом состоянии:

```css
input:indeterminate {
  background-color: yellow; /* Желтый фон для чекбоксов в неопределённом состоянии */
}

```

В этом примере чекбоксы в неопределённом состоянии будут иметь желтый фон.

## Примеры использования псевдокласса `:indeterminate`

### Основные примеры

### Стилизация чекбоксов в неопределённом состоянии

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="checkbox"]:indeterminate {
      background-color: yellow; /* Желтый фон для чекбоксов в неопределённом состоянии */
      border: 2px solid orange; /* Оранжевая граница */
    }
  </style>
  <title>Стилизация чекбоксов в неопределённом состоянии</title>
</head>
<body>
  <form>
    <label>
      <input type="checkbox" id="parent-checkbox" /> Родительский чекбокс
    </label>
    <br>
    <label>
      <input type="checkbox" class="child-checkbox" /> Дочерний чекбокс 1
    </label>
    <br>
    <label>
      <input type="checkbox" class="child-checkbox" /> Дочерний чекбокс 2
    </label>
  </form>

  <script>
    const parentCheckbox = document.getElementById('parent-checkbox');
    const childCheckboxes = document.querySelectorAll('.child-checkbox');

    parentCheckbox.addEventListener('change', () => {
      childCheckboxes.forEach(checkbox => {
        checkbox.checked = parentCheckbox.checked;
      });
    });

    childCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const allChecked = Array.from(childCheckboxes).every(cb => cb.checked);
        const noneChecked = Array.from(childCheckboxes).every(cb => !cb.checked);

        if (allChecked) {
          parentCheckbox.checked = true;
          parentCheckbox.indeterminate = false;
        } else if (noneChecked) {
          parentCheckbox.checked = false;
          parentCheckbox.indeterminate = false;
        } else {
          parentCheckbox.indeterminate = true;
        }
      });
    });
  </script>
</body>
</html>

```

В этом примере родительский чекбокс переходит в неопределённое состояние, если некоторые дочерние чекбоксы выбраны, а некоторые — нет.

### Стилизация радиокнопок в неопределённом состоянии

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="radio"]:indeterminate {
      background-color: lightgray; /* Светло-серый фон для радиокнопок в неопределённом состоянии */
      border: 2px solid darkgray; /* Темно-серая граница */
    }
  </style>
  <title>Стилизация радиокнопок в неопределённом состоянии</title>
</head>
<body>
  <form>
    <label>
      <input type="radio" name="option" value="1" /> Вариант 1
    </label>
    <br>
    <label>
      <input type="radio" name="option" value="2" /> Вариант 2
    </label>
  </form>
</body>
</html>

```

В этом примере радиокнопки могут быть стилизованы в неопределённом состоянии, хотя их реализация обычно не поддерживает это состояние.

### Сложные примеры

### Стилизация прогресс-бара в неопределённом состоянии

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    progress:indeterminate {
      background-color: lightblue; /* Светло-голубой фон для прогресс-бара в неопределённом состоянии */
    }
  </style>
  <title>Стилизация прогресс-бара в неопределённом состоянии</title>
</head>
<body>
  <progress id="progress-bar" max="100"></progress>

  <script>
    const progressBar = document.getElementById('progress-bar');
    progressBar.indeterminate = true; /* Установка прогресс-бара в неопределённое состояние */
  </script>
</body>
</html>

```

В этом примере прогресс-бар будет отображаться со светло-голубым фоном в неопределённом состоянии.

### Комбинирование с другими селекторами и псевдоклассами

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="checkbox"]:indeterminate:focus {
      outline: 2px solid blue; /* Синяя граница при фокусе для чекбоксов в неопределённом состоянии */
    }

    progress:indeterminate::-webkit-progress-bar {
      background-color: lightcoral; /* Светло-коралловый фон для прогресс-бара в неопределённом состоянии в WebKit-браузерах */
    }
  </style>
  <title>Комбинирование с другими селекторами и псевдоклассами</title>
</head>
<body>
  <form>
    <label>
      <input type="checkbox" id="indeterminate-checkbox" /> Чекбокс в неопределённом состоянии
    </label>
    <br>
    <progress id="progress-bar" max="100"></progress>

    <script>
      const checkbox = document.getElementById('indeterminate-checkbox');
      const progressBar = document.getElementById('progress-bar');

      checkbox.indeterminate = true; /* Установка чекбокса в неопределённое состояние */
      progressBar.indeterminate = true; /* Установка прогресс-бара в неопределённое состояние */
    </script>
  </form>
</body>
</html>

```

В этом примере чекбокс и прогресс-бар будут стилизованы в неопределённом состоянии, причём чекбокс будет иметь синюю границу при фокусе.

## Использование в реальных проектах

### Стилизация чекбоксов в списке задач

Пример использования псевдокласса `:indeterminate` для стилизации чекбоксов в списке задач:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="checkbox"]:indeterminate {
      background-color: yellow; /* Желтый фон для чекбоксов в неопределённом состоянии */
      border: 2px solid orange; /* Оранжевая граница */
    }
  </style>
  <title>Стилизация чекбоксов в списке задач</title>
</head>
<body>
  <h1>Список задач</h1>
  <form>
    <label>
      <input type="checkbox" id="all-tasks" /> Все задачи
    </label>
    <br>
    <label>
      <input type="checkbox" class="task" /> Задача 1
    </label>
    <br>
    <label>
      <input type="checkbox" class="task" /> Задача 2
    </label>
  </form>

  <script>
    const allTasksCheckbox = document.getElementById('all-tasks');
    const taskCheckboxes = document.querySelectorAll('.task');

    allTasksCheckbox.addEventListener('change', () => {
      taskCheckboxes.forEach(checkbox => {
        checkbox.checked = allTasksCheckbox.checked;
      });

 });

    taskCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const allChecked = Array.from(taskCheckboxes).every(cb => cb.checked);
        const noneChecked = Array.from(taskCheckboxes).every(cb => !cb.checked);

        if (allChecked) {
          allTasksCheckbox.checked = true;
          allTasksCheckbox.indeterminate = false;
        } else if (noneChecked) {
          allTasksCheckbox.checked = false;
          allTasksCheckbox.indeterminate = false;
        } else {
          allTasksCheckbox.indeterminate = true;
        }
      });
    });
  </script>
</body>
</html>

```

В этом примере родительский чекбокс "Все задачи" переходит в неопределённое состояние, если некоторые задачи выбраны, а некоторые — нет.

### Стилизация прогресс-бара загрузки

Пример использования псевдокласса `:indeterminate` для стилизации прогресс-бара загрузки:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    progress:indeterminate {
      background-color: lightblue; /* Светло-голубой фон для прогресс-бара в неопределённом состоянии */
    }
  </style>
  <title>Стилизация прогресс-бара загрузки</title>
</head>
<body>
  <h1>Загрузка...</h1>
  <progress id="loading-progress" max="100"></progress>

  <script>
    const progressBar = document.getElementById('loading-progress');
    progressBar.indeterminate = true; /* Установка прогресс-бара в неопределённое состояние */
  </script>
</body>
</html>

```

В этом примере прогресс-бар будет отображаться со светло-голубым фоном в неопределённом состоянии, пока продолжается загрузка.

## Заключение

Псевдокласс `:indeterminate` в CSS предоставляет мощный способ для стилизации элементов формы, находящихся в неопределённом состоянии. Это помогает улучшить взаимодействие пользователя с веб-страницей, предоставляя визуальные подсказки о промежуточном статусе элементов. Понимание различных способов использования псевдокласса `:indeterminate`, а также его комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать более гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.

Изучение псевдокласса `indeterminate` позволяет создавать более интерактивные и понятные формы. Для закрепления знаний и приобретения практических навыков, рекомендуем наш курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass-indeterminate-v-CSS-Polnoe-rukovodstvo-s-primerami). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
