---
metaTitle: URLSearchParams – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает URLSearchParams в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: URLSearchParams в JavaScript
preview: URLSearchParams - это встроенный в браузер API, который позволяет получить или отформатировать поисковые параметры из URL...
---

URLSearchParams - это встроенный в браузер API, который позволяет получить или отформатировать поисковые параметры из URL. Это удобный инструмент для работы с URL-адресами, который может быть использован для получения, добавления, удаления и изменения параметров поиска в URL.

URLSearchParams может быть использован для получения параметров поиска из текущего URL-адреса, используя свойство `window.location.search`.

Пример:

```javascript
const searchParams = new URLSearchParams(window.location.search);
console.log(searchParams.get('query')); // выводит значение параметра "query" из текущего URL
```

Работа с URL-параметрами часто становится необходимостью при разработке веб-приложений. URLSearchParams предоставляет удобный интерфейс для манипулирования этими параметрами. Но чтобы эффективно использовать этот и другие API браузера, важно хорошо понимать основы JavaScript. Если вы хотите детальнее погрузиться в мир JavaScript, освоить его синтаксис и принципы работы, приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=urlsearchparams-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Форма записи

### Создание экземпляра класса

Для создания экземпляра класса URLSearchParams необходимо вызвать конструктор класса с параметром, содержащим строку запроса.

Пример:

```javascript
const searchParams = new URLSearchParams('param1=value1&param2=value2');
```

### Добавление параметров

Добавление параметров поиска в URL осуществляется с помощью метода `append(name, value)`. Он добавляет параметр с указанным именем и значением в конец строки запроса.

Пример:

```javascript
searchParams.append('param3', 'value3');
```

### Запись параметров

Запись параметров поиска в URL осуществляется с помощью метода `set(name, value)`. Он устанавливает значение для параметра с указанным именем.

Пример:

```javascript
searchParams.set('param1', 'newvalue');
```

### Получение значения параметра

Получение значения параметра поиска из URL осуществляется с помощью метода `get(name)`. Он возвращает значение параметра с указанным именем.

Пример:

```javascript
console.log(searchParams.get('param1')); // выводит "newvalue"
```

### Проверка наличия параметра

Проверка наличия параметра поиска в URL осуществляется с помощью метода `has(name)`. Он возвращает true, если параметр с указанным именем присутствует в URL, и false в противном случае.

Пример:

```javascript
console.log(searchParams.has('param1')); // выводит true
console.log(searchParams.has('param4')); // выводит false
```

### Получение имён всех параметров

Получение списка имен всех параметров поиска в URL осуществляется с помощью метода `keys()`. Он возвращает итератор, который перебирает имена всех параметров.

Пример:

```javascript
for (const paramName of searchParams.keys()) {
  console.log(paramName);
}
```

### Получение всех значений параметров

Получение списка всех значений параметров поиска в URL осуществляется с помощью метода `values()`. Он возвращает итератор, который перебирает все значения параметров.

Пример:

```javascript
for (const paramValue of searchParams.values()) {
  console.log(paramValue);
}
```

### Получение всех параметров

Получение списка всех параметров поиска в URL осуществляется с помощью метода `entries()`. Он возвращает итератор, который перебирает все параметры и их значения в формате `[name, value]`.

Пример:

```javascript
for (const [paramName, paramValue] of searchParams.entries()) {
  console.log(paramName + ': ' + paramValue);
}
```

### Удаление параметра

Удаление параметра поиска из URL осуществляется с помощью метода `delete(name)`. Он удаляет параметр с указанным именем из строки запроса.

Пример:

```javascript
searchParams.delete('param1');
```

### Сортировка параметров

Сортировка параметров поиска в URL осуществляется с помощью метода`sort()`. Он упорядочивает параметры по их именам в алфавитном порядке.

Пример:

```javascript
searchParams.sort();
```

### Перебор параметров

Перебор параметров поиска в URL осуществляется с помощью итератора, который возвращает метод `Symbol.iterator`. 

Пример:

```javascript
for (const param of searchParams) {
  console.log(param);
}
```

### Приведение параметров к строке

Приведение параметров поиска в URL к строке осуществляется с помощью метода `toString()`. Он возвращает строку, содержащую параметры поиска в URL.

Пример:

```javascript
const searchParamsString = searchParams.toString();
console.log(searchParamsString);
```

## Заключение

URLSearchParams - это удобный инструмент для работы с параметрами поиска в URL. Он предоставляет множество методов для получения, добавления, удаления и изменения параметров поиска в URL. При использовании URLSearchParams необходимо учитывать, что он доступен только в браузере и не поддерживается в Node.js.

URLSearchParams упрощает работу с URL, но для создания сложных веб-приложений часто требуются более продвинутые навыки JavaScript. Рассмотрите возможность углубленного изучения языка с помощью курса [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=urlsearchparams-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир продвинутого JavaScript прямо сегодня.
