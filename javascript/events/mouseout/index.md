---
metaTitle: Событие mouseout в JavaScript
metaDescription: Разбираемся как работает событие mouseout в JavaScript
author: Дмитрий Нечаев
title: Событие mouseout в JavaScript
preview: Учимся пользоваться событием mouseout в JavaScript. Разбираем примеры использования
---

Событие `mouseout` в JavaScript возникает, когда курсор мыши пользователя покидает границы элемента. Это событие полезно для создания интерактивных пользовательских интерфейсов, так как позволяет отслеживать движение курсора и реагировать на него. В этой статье мы рассмотрим, как работает событие `mouseout`, когда его следует использовать и приведем примеры его применения.

### Как работает событие "mouseout"?

Событие `mouseout` срабатывает, когда курсор мыши пользователя выходит за пределы элемента. Это может произойти, если пользователь перемещает курсор на другой элемент или за пределы окна браузера. Событие `mouseout` всплывает от дочернего элемента к родительскому.

### Примеры использования события "mouseout"

### Изменение стилей элемента при выходе курсора мыши

```jsx
const element = document.getElementById('myElement');

element.addEventListener('mouseout', function(event) {
    // Изменяем цвет фона элемента при уходе курсора
    event.target.style.backgroundColor = 'red';
});

```

В этом примере при уходе курсора мыши с элемента с идентификатором `myElement` цвет его фона изменяется на красный.

### Показать подсказку при уходе курсора с ссылки

```html
<a href="#" id="myLink" title="Это ссылка">Наведите курсор для подсказки</a>

```

```jsx
const link = document.getElementById('myLink');

link.addEventListener('mouseout', function(event) {
    // Получаем текст подсказки из атрибута title и выводим его
    alert(event.target.getAttribute('title'));
});

```

В этом примере при уходе курсора мыши с ссылки с идентификатором `myLink` будет показана подсказка с текстом из атрибута `title`.

### Скрыть подменю при уходе курсора с основного меню

```html
<nav id="mainMenu">
    <ul>
        <li><a href="#">Главная</a></li>
        <li>
            <a href="#">Категории</a>
            <ul id="subMenu">
                <li><a href="#">Категория 1</a></li>
                <li><a href="#">Категория 2</a></li>
                <li><a href="#">Категория 3</a></li>
            </ul>
        </li>
        <li><a href="#">Контакты</a></li>
    </ul>
</nav>

```

```jsx
const mainMenu = document.getElementById('mainMenu');
const subMenu = document.getElementById('subMenu');

mainMenu.addEventListener('mouseout', function(event) {
    // Скрываем подменю при уходе курсора с основного меню
    subMenu.style.display = 'none';
});

```

В этом примере при уходе курсора мыши с основного меню (`mainMenu`) подменю (`subMenu`) скрывается.

### Особенности и рекомендации по использованию

- **Всплытие события**: Событие `mouseout` всплывает от дочернего элемента к родительскому, поэтому в обработчике события следует использовать свойство `event.target` для получения элемента, с которого курсор ушел.
- **Полезно для интерактивности**: Событие `mouseout` часто используется для создания интерактивных пользовательских интерфейсов, таких как показ подсказок, изменение стилей элементов и управление видимостью подменю.
- **Учитывайте конкретные требования**: При использовании события `mouseout` важно учитывать требования вашего проекта и адаптировать его под конкретные задачи и потребности пользователей.

### Заключение

Событие `mouseout` в JavaScript предоставляет возможность отслеживать момент, когда курсор мыши пользователя покидает границы элемента. Это позволяет создавать интерактивные пользовательские интерфейсы с учетом действий пользователя. Правильное использование события `mouseout` поможет улучшить пользовательский опыт и функциональность веб-приложений.