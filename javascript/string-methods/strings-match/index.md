---
metaTitle: match() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод match() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод match() - JavaScript
preview: Метод match() возвращает результат сопоставления строки с регулярным выражением...
---

Метод `match()` возвращает результат сопоставления строки с регулярным выражением.

```javascript
const message = "JavaScript is a fun programming language.";

// регулярное выражение, которое проверяет, содержит ли сообщение «programming»
const exp = /programming/;

// проверка, присутствует ли exp в message
let result = message.match(exp);
console.log(result);

/*
Вывод в консоль: [
  'programming',
  index: 20,
  input: 'JavaScript is a fun programming language.',
  groups: undefined
  ]
*/
```

## Синтаксис match()

Синтаксис метода `match()` следующий:

```javascript
str.match(regexp);
```

Где `str` - это строка.

## Параметры match()

Метод `match()` принимает:

- `regexp` - объект регулярного выражения (Аргумент неявно преобразуется в `RegExp`, если он не является объектом `RegExp`)

> **Примечание:** если вы не указываете никаких параметров, `match()` возвращает `[""]`.

## Возвращаемое значение match()

- Возвращает `Array`, содержащий совпадения, по одному элементу для каждого совпадения.
- Возвращает `null`, если совпадение не найдено.

## Примеры

### Пример 1: Использование match()

```javascript
const string = "I am learning JavaScript not Java.";
const re = /Java/;

let result = string.match(re);
console.log("Результат сопоставления /Java/ :");
console.log(result);

const re1 = /Java/g;
let result1 = string.match(re1);

console.log("Результат сопоставления /Java/ с флагом g:");
console.log(result1);
```

Вывод в консоль:

```
Результат сопоставления /Java/ :
[
  'Java',
  index: 14,
  input: 'I am learning JavaScript not Java.',
  groups: undefined
]
Результат сопоставления /Java/ с флагом g:
[ 'Java', 'Java' ]
```

Здесь мы видим, что без использования флага `g` мы получаем в качестве результата только первое совпадение, но с подробной информацией, такой как индекс, вход и группы.

> **Примечание:** если регулярное выражение не включает флаг `g`, `str.match()` вернет только первое совпадение, аналогично `RegExp.exec()`. Возвращаемый элемент также будет иметь следующие дополнительные свойства:

- `groups` - объект именованных групп захвата, ключами которых являются имена, а значениями - полученные совпадения.
- `index` - индекс поиска, в котором был найден результат.
- `input` - копия строки поиска.

### Пример 2: Совпадающие разделы в строке

```javascript
const string = "My name is Albert. YOUR NAME is Soyuj.";

// выражение соответствует регистронезависимому "name is"+ любые буквы до точки (.)
const re = /name\sis\s[a-zA-Z]+\./gi;

let result = string.match(re);
console.log(result); // [ 'name is Albert.', 'NAME is Soyuj.' ]

// использование именованных групп захвата
const re1 = /name\sis\s(?<name>[a-zA-Z]+)\./i;
let found = string.match(re1);

console.log(found.groups); // {name: "Albert"}
```

Вывод в консоль:

```
[ 'name is Albert.', 'NAME is Soyuj.' ]
{name: "Albert"}
```

Здесь мы использовали регулярное выражение для сопоставления определенной части строки. Мы также можем перехватить определенные группы в `match`, используя синтаксис, как показано выше.
