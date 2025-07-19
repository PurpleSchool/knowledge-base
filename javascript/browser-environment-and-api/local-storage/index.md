---
metaTitle: localStorage – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает localStorage в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: localStorage в JavaScript
preview: localStorage - это встроенный в браузер API, который позволяет хранить данные на стороне клиента...
---

localStorage - это встроенный в браузер API, который позволяет хранить данные на стороне клиента. Данные хранятся в виде пар ключ-значение и доступны для использования в любом месте вашего приложения.

Пример:

```javascript
// Запись значения в localStorage
localStorage.setItem('username', 'John');

// Чтение значения из localStorage
const username = localStorage.getItem('username');

// Удаление значения из localStorage
localStorage.removeItem('username');

// Очистка всего хранилища
localStorage.clear();
```

`localStorage` предоставляет возможность хранить данные в браузере пользователя между сессиями. Это полезно для сохранения настроек, состояния приложения и других данных, которые необходимо сохранить после закрытия браузера. Но для эффективного использования `localStorage` важно понимать, как он работает, какие у него ограничения и как безопасно хранить данные. Если вы хотите детально изучить работу с данными в JavaScript и узнать, как использовать `localStorage` для создания удобных и функциональных веб-приложений, приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=localstorage-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Форма записи

### Запись

Для записи значения в localStorage используйте метод `setItem(key, value)`, где `key` - это ключ, а `value` - это значение, которое нужно сохранить.

Пример:

```javascript
localStorage.setItem('username', 'John');
```

### Чтение

Для чтения значения из localStorage используйте метод `getItem(key)`, где `key` - это ключ, по которому нужно найти значение.

Пример:

```javascript
const username = localStorage.getItem('username');
```

### Удаление

Для удаления значения из localStorage используйте метод `removeItem(key)`, где `key` - это ключ, который нужно удалить.

Пример:

```javascript
localStorage.removeItem('username');
```

### Очистка хранилища

Для очистки всего хранилища localStorage используйте метод `clear()`.

Пример:

```javascript
localStorage.clear();
```

### Количество полей в хранилище

Для получения количества полей в хранилище localStorage используйте свойство `length`.

Пример:

```javascript
const fieldsCount = localStorage.length;
```

### Получение ключа по индексу

Для получения ключа по индексу используйте метод `key(index)`, где `index` - это индекс ключа, который нужно получить.

Пример:

```javascript
const firstKey = localStorage.key(0);
```

### События

localStorage генерирует события, когда данные изменяются или когда хранилище очищается. Вы можете использовать `addEventListener()` для регистрации обработчиков событий.

Пример:

```javascript
window.addEventListener('storage', (event) => {
  console.log(`Key ${event.key} was modified from ${event.oldValue} to ${event.newValue}`);
});
```

## Заключение

localStorage - это удобный способ хранения данных на стороне клиента. Он предоставляет простой интерфейс для записи, чтения и удаления данных, а также для очистки хранилища и получения информации о его состоянии. Для более продвинутого понимания работы с данными, асинхронности и шаблонов проектирования в JavaScript, обратите внимание на курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=localstorage-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир продвинутого JavaScript прямо сегодня.
