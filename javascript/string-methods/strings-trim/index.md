---
metaTitle: trim() – JavaScript String – Методы строк в JS
metaDescription: Как работает метод trim() в JavaScript. Всё о методах работы со строками в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод trim() - JavaScript
preview: Метод trim() удаляет пробелы с обоих концов строки...
---

Метод `trim()` удаляет пробелы с обоих концов строки.

```javascript
const message = "   JAVASCRIPT IS FUN    ";

// удаление начальных и конечных пробелов
const newMessage = message.trim();
console.log(newMessage);

// Вывод в консоль: JAVASCRIPT IS FUN
```

## Синтаксис trim()

Синтаксис метода `trim()` следующий:

```javascript
str.trim();
```

Где `str` - это строка.

## Параметры trim()

Метод `trim()` не принимает никаких параметров.

## Возвращаемое значение trim()

Возвращает новую строку, представляющую строку `str`, очищенную от пробелов с обоих концов.

> **Примечания:**
>
> - Пробел - это все пробельные символы (пробел, табуляция, пробел без разрыва и т.д.) и все символы терминатора строки (LF, CR и т.д.).
> - Метод `trim()` не изменяет исходную строку.

## Примеры

### Пример 1: Использование метода trim()

```javascript
let str = "   foo  ";
console.log(str.trim()); // 'foo'

// trim() удаляет пробелы только с краев
let str1 = "  A B C D  ";
console.log(str1.trim()); // 'A B C D'
```

Вывод в консоль:

```
foo
A B C D
```
