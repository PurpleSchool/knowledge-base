---
metaTitle: sessionStorage – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает sessionStorage в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: sessionStorage в JavaScript
preview: sessionStorage - это встроенный в браузер API, который позволяет хранить данные на стороне клиента, но только до момента закрытия текущей вкладки браузера...
---

sessionStorage - это встроенный в браузер API, который позволяет хранить данные на стороне клиента, но только до момента закрытия текущей вкладки браузера. Данные хранятся в виде пар ключ-значение и доступны для использования только в текущей вкладке браузера.

Пример:

```javascript
// Запись значения в sessionStorage
sessionStorage.setItem('username', 'John');

// Чтение значения из sessionStorage
const username = sessionStorage.getItem('username');

// Удаление значения из sessionStorage
sessionStorage.removeItem('username');

// Очистка всего хранилища
sessionStorage.clear();
```

## Форма записи

### Запись

Для записи значения в sessionStorage используйте метод `setItem(key, value)`, где `key` - это ключ, а `value` - это значение, которое нужно сохранить.

Пример:

```javascript
sessionStorage.setItem('username', 'John');
```

`sessionStorage` предоставляет способ хранения данных, которые сохраняются только в течение текущей сессии браузера. Это полезно для хранения временных данных, таких как состояние формы или информация о пользователе.  Чтобы эффективно использовать `sessionStorage` и другие API браузера, необходимо хорошо понимать основы JavaScript и уметь работать с данными. Если вы хотите детальнее погрузиться в мир JavaScript, освоить его синтаксис и принципы работы, приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=sessionstorage-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Чтение

Для чтения значения из sessionStorage используйте метод `getItem(key)`, где `key` - это ключ, по которому нужно найти значение.

Пример:

```javascript
const username = sessionStorage.getItem('username');
```

### Удаление

Для удаления значения из sessionStorage используйте метод `removeItem(key)`, где `key` - это ключ, который нужно удалить.

Пример:

```javascript
sessionStorage.removeItem('username');
```

### Очистка хранилища

Для очистки всего хранилища sessionStorage используйте метод `clear()`.

Пример:

```javascript
sessionStorage.clear();
```

### Количество полей в хранилище

Для получения количества полей в хранилище sessionStorage используйте свойство `length`.

Пример:

```javascript
const fieldsCount = sessionStorage.length;
```

### Получение ключа по индексу

Для получения ключа по индексу используйте метод `key(index)`, где `index` - это индекс ключа, который нужно получить.

Пример:

```javascript
const firstKey = sessionStorage.key(0);
```

## Заключение

sessionStorage - это удобный способ хранения данных на стороне клиента до момента закрытия текущей вкладки браузера. Он предоставляет простой интерфейс для записи, чтения и удаления данных, а также для очистки хранилища и получения информации о его состоянии. При использовании sessionStorage необходимо учитывать, что данные будут доступны только в текущей вкладке браузера, и при закрытии вкладки они будут удалены.

Для более глубокого понимания работы с данными, асинхронности и продвинутых техник JavaScript, рассмотрите курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=sessionstorage-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир продвинутого JavaScript прямо сегодня.
