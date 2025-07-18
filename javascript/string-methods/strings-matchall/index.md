---
metaTitle: matchAll() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод matchAll() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод matchAll() - JavaScript
preview: Метод matchAll() возвращает итератор результатов после сопоставления строки с регулярным выражением...
---

Метод `matchAll()` возвращает итератор результатов после сопоставления строки с регулярным выражением.

```javascript
// объявление строки
const sentence = "JavaScript1JavaScript2";

// шаблон с «JavaScript», за которым следует цифра
const regex = /JavaScript\d/g;

// поиск совпадений в строке для заданного регулярного выражения
let results = sentence.matchAll(regex);

// цикл через итератор
for (result of results) {
  console.log(result);
}

// Вывод в консоль:
// ["JavaScript1", index: 0, input: "JavaScript1JavaScript2", groups: undefined]
// ["JavaScript2", index: 11, input: "JavaScript1JavaScript2", groups: undefined]
```

## Синтаксис matchAll()

Синтаксис метода `matchAll()` следующий:

```javascript
str.matchAll(regexp);
```

Где `str` - это строка.

`matchAll()` возвращает итератор со всеми соответствиями регулярного выражения в строке. Это мощный инструмент для извлечения данных из текста с использованием сложных шаблонов. Для эффективного использования `matchAll()` необходимо понимать основы регулярных выражений и работы со строками в JavaScript. Если вы хотите детальнее погрузиться в мир регулярных выражений и их использования в JavaScript — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-matchall-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры matchAll()

Метод matchAll() принимает один параметр:

- `regex` - объект регулярного выражения (Аргумент неявно преобразуется в `regex`, если он не является объектом `regex`)

> **Примечание:**
>
> - Если объект `regex` не имеет флага `/g`, будет выдана ошибка `TypeError`.
> - Флаг `g` означает глобальный поиск, то есть этот флаг указывает на то, что мы проверяем регулярное выражение на все совпадения в строке.

## Возвращаемое значение matchAll()

Возвращает итератор, содержащий совпадения, включая группы захвата.

> **Примечание:** каждый элемент возвращаемого итератора будет иметь следующие дополнительные свойства:
>
> - `groups` - объект именованных групп захвата, ключами которых являются имена, а значениями - захваченные совпадения.
> - `index` - индекс поиска, в котором был найден результат.
> - `input` - копия строки поиска.

## Примеры

### Пример 1: Использование метода matchAll()

```javascript
// объявление строки
const sentence = "I am learning JavaScript not Java.";

// шаблон, содержащий 'Java' с любым количеством символов от a до z
const regex = /Java[a-z]*/gi;

// поиск совпадений в строке для заданного регулярного выражения
let result = sentence.matchAll(regex);

// преобразование результата в массив
console.log(Array.from(result));
```

Вывод в консоль:

```
[
  'JavaScript',
  index: 14,
  input: 'I am learning JavaScript not Java.',
  groups: undefined
]
[
  'Java',
  index: 29,
  input: 'I am learning JavaScript not Java.',
  groups: undefined
]
```

В приведенном выше примере мы определили регулярное выражение `regex` с флагом `/g`. Затем мы вызвали метод `matchAll()` в `sentence`.

`sentence.matchAll(regex)` сопоставляет строку `sentence` с шаблоном, который содержит `'Java'` вместе с любым количеством символов от **a до z**.

Метод нашел два соответствия - `'JavaScript'` и `'Java'` для заданного `regex`.

> **Примечание:** результат метода `matchAll()` имеет вид объекта, поэтому мы использовали `Array.from(result)` для преобразования его в массив.

### Пример 2: Регулярное выражение с учетом регистра в matchAll()

Регулярное выражение (`regex`) чувствительно к регистру. Мы можем использовать флаг `i`, чтобы сделать его нечувствительным к регистру в методе `matchAll()`. Например:

```javascript
// объявление строки
const bio = "His name is  Albert and albert likes to code.";

// шаблон с надписью 'albert' или 'Albert'
const regex = /albert/gi;

// поиск 'albert' или 'Albert' в строке
const result = bio.matchAll(regex);

console.log(Array.from(result));
```

Вывод в консоль:

```
[
  [
    'Albert',
    index: 13,
    input: 'His name is  Albert and albert likes to code.',
    groups: undefined
  ],
  [
    'albert',
    index: 24,
    input: 'His name is  Albert and albert likes to code.',
    groups: undefined
  ]
]
```

Здесь мы использовали `i` в regex вместе с `g` (`/albert/g`), что делает его нечувствительным к регистру. Таким образом, метод возвращает массив с двумя итераторами с найденными соответствиями - `'Albert'` и `'albert'`.

Понимание `matchAll()` открывает новые возможности для работы с текстом. Но это лишь один из множества инструментов, доступных в JavaScript. Чтобы стать уверенным веб-разработчиком, вам необходимо освоить и другие концепции, такие как DOM, асинхронность и работа с сервером. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-matchall-v-javascript) вы получите комплексные знания. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
