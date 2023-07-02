---
metaTitle: DOM – JavaScript Document Object Model – Объектная модель документа
metaDescription: Как работает DOM в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: DOM в JavaScript
preview: DOM (Document Object Model) - это программный интерфейс для работы с документами HTML и XML...
---

DOM (Document Object Model) - это программный интерфейс для работы с документами HTML и XML. Он представляет документ в виде дерева объектов, где каждый элемент является узлом дерева, а его атрибуты и текст - это свойства узла.

DOM позволяет изменять содержимое страницы, добавлять и удалять узлы, изменять стили и атрибуты элементов и многое другое. DOM также позволяет взаимодействовать с пользовательскими действиями на странице, такими как клики, нажатия клавиш, перемещения мыши и т.д.

## Форма записи

### Свойства

DOM-элементы имеют множество свойств, которые можно использовать для доступа и изменения их содержимого. 

- title - свойство, которое позволяет получить или изменить заголовок документа.

```javascript
document.title = "Новый заголовок";
```

- forms - свойство, которое возвращает коллекцию всех форм в документе.

```javascript
const forms = document.forms;
```

- body - свойство, которое возвращает тело документа.

```javascript
const body = document.body;
```

- head - свойство, которое возвращает головную часть документа.

```javascript
const head = document.head;
```

### Методы

DOM также предоставляет множество методов для работы с элементами. 

- getElementById - метод, который возвращает элемент с указанным атрибутом id.

```javascript
const element = document.getElementById("myId");
```

- getElementsByClassName - метод, который возвращает коллекцию элементов, у которых есть указанный класс.

```javascript
const elements = document.getElementsByClassName("myClass");
```

- getElementsByTagName - метод, который возвращает коллекцию элементов с указанным тегом.

```javascript
const elements = document.getElementsByTagName("p");
```

- querySelector - метод, который возвращает первый элемент, соответствующий заданному CSS-селектору.

```javascript
const element = document.querySelector("#myId .myClass");
```

- querySelectorAll - метод, который возвращает коллекцию элементов, соответствующих заданному CSS-селектору.

```javascript
const elements = document.querySelectorAll("#myId .myClass");
```

## Описание работы

DOM состоит из узлов, которые могут быть элементами, текстом, атрибутами, комментариями, и т.д. Каждый элемент является узлом дерева, у которого есть родительские и дочерние узлы.

```html
<div id="container">
  <h1>Заголовок страницы</h1>
  <p>Первый абзац страницы</p>
  <p>Второй абзац страницы</p>
</div>
```

Чтобы получить доступ к элементам на странице, можно использовать методы getElementById, getElementByClassName, getElementsByTagName, querySelector и querySelectorAll.

```javascript
const container = document.getElementById('container');
const header = container.querySelector('h1');
const paragraphs = container.querySelectorAll('p');
```

## Заключение

DOM является важным инструментом для работы с веб-страницами в JavaScript. Он позволяет программисту манипулировать HTML-содержимым, стилями и структурой страницы для создания более интерактивного пользовательского опыта. Знание DOM-методов и свойств является обязательным для разработки современных веб-приложений.