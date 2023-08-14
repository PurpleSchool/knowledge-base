---
metaTitle: Итератор – JavaScript Iterators – Итератор в JS
metaDescription: Что такое итератор и итерируемый объект в JS | База знаний PurpleSchool
author: Сергей Краснолобов
title: Итератор в JavaScript
preview: Итератор в JavaScript - это объект, содержащий метод next(), который возвращает следующий элемент последовательности...
---

## Что это такое

Итераторы в JavaScript - это объекты, содержащие метод `next()`, который возвращает следующий элемент последовательности - специальный объект с двумя свойствами:

```javascript
{
    done, // указывает есть ли еще элементы для перебора (true/false)
    value; // значение текущего перебираемого элемента
}
```

Посмотрим как это выглядит изнутри.
Создадим функцию конструктор для нашего объекта-итератора:

```javascript

const buildIterator = () => {
  return {
    count: 0,
    next: function () {
        return {
        done: this.count === 3,
        value: this.count < 3 ? this.count++ : undefined,
        };
    }
  },
};
```

Создадим наш объект-итератор:

```javascript
const iterator = buildIterator();
```

И начнем последовательно вызывать метод `next()`:

```javascript
iterator.next(); //  {done: false, value: 0}

iterator.next(); //  {done: false, value: 1}

iterator.next(); //  {done: false, value: 2}

iterator.next(); //  {done: true, value: undefined} - перебор закончен
```

Когда метод `next()` возвращает `{ done: true }`, то обход элементов прекращается. В этом случае, каждый последующий вызов метода, будет возвращать один и тот же результат - `{ done: true }`

## Для чего это нужно

Польза итераторов состоит в том, что они позволяют работать с большим объемом данных без необходимости загружать их целиком в память. По сути мы получаем ленивые вычисления `(lazy evaluation)`. Помимо этого, итераторы предоставляют единый и понятный интерфейс (метод `next()`) для работы с любыми **_итерируемыми_** объектами.

Для автоматзации явного создания объекта-итератора и вызова метода `next()`, язык предоставляет концепцию **_итерируемых_** (Iterable) объектов, которые можно обойти в цикле `for..of`.

В JavaScript есть несколько структур данных, которые поддерживают итерируемость:

- Массивы,
- Строки,
- Map и Set,
- NodeList.

Например:

```javascript
for (const value of ["1", "2", "3"]) {
  console.log(value);
  // '1'
  // '2'
  // '3'
}
```

> **Примечание:** Для того чтобы объект стал **_итерируемым_**, он должен иметь свойство `Symbol.iterator`, которое является функцией и возвращает **_объек-итератор_**.

В примере выше, наш объект `iterator` не возможно перебрать в цикле, так как у него нет свойства `Symbol.iterator`

В этом легко убедиться, если попытатся обойти его с помощью `for..of`:

```javascript
for (const el of iterator) {
  console.log(el);
}

//Получили ошибку - Uncaught TypeError: iterator is not iterable
```

Добавим ему нужное свойство:

```javascript
const buildIterableIterator = () => {
  return {
    [Symbol.iterator]: function () {
      return {
        count: 0,
        next: function () {
          return {
            done: this.count === 3,
            value: this.count < 3 ? this.count++ : undefined,
          };
        },
      };
    },
  };
};
```

Создадим наш итерируемый объект:

```javascript
const iterableIterator = buildIterableIterator();
```

И попробуем обойти его в цикле:

```javascript
for (const el of iterableIterator) {
  console.log(el);
}
// 0
// 1
// 2
```

Теперь наш объект легко можно обходить в цикле без явного создания объекта-итератора и вызова `next()`.

А еще наш объект начал поддерживать оператор `spread`:

```javascript
console.log([...iterableIterator]); // [0,1,2]
```

Преобразование в массив с помощью `Array.from()`:

```javascript
console.log(Array.from(iterableIterator)); // [0,1,2]
```

И деструктуризацию:

```javascript
const [zero, one] = iterableIterator;

console.log(zero); // 0

console.log(one); // 1
```

## Подведем итог

- Итераторы предоставляют **_универсальный_** способ обхода любой коллекции;
- По умолчанию **_ленивы_** - работа происходит только при вызове метода `next()`;
- Имеют хорошую нативную поддержку языка начиная со стандарта **ES6**
