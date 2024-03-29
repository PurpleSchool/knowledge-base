---
metaTitle: delete() – JavaScript Set – Множества в JS
metaDescription: Как работает delete() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: delete() в JavaScript
preview: Метод delete() в языке программирования JavaScript используется для удаления элемента из коллекции Set...
---

Метод `delete()` в языке программирования JavaScript используется для удаления элемента из коллекции Set. Этот метод возвращает значение `true`, если элемент был успешно удален, и `false`, если элемент не найден в коллекции.

## Форма записи

```javascript
set.delete(value);
```

где `set` - коллекция Set, а `value` - значение, которое нужно удалить из коллекции.

## Описание работы

Метод delete() используется для удаления элемента из коллекции Set. Этот метод принимает один аргумент - значение, которое нужно удалить из коллекции. Если значение присутствует в коллекции, то оно будет удалено, а метод вернет значение true. Если же значение не найдено в коллекции, то метод вернет значение false.

### Примеры

Удаление элемента из коллекции Set:

```javascript
const set = new Set([1, 2, 3]);
set.delete(2);
console.log(set); // Set(2) {1, 3}
```

Удаление несуществующего элемента из коллекции Set:

```javascript
const set = new Set([1, 2, 3]);
const result = set.delete(4);
console.log(result); // false
console.log(set); // Set(3) {1, 2, 3}
```

Удаление элемента из коллекции Set с объектами:

```javascript
const set = new Set([{ name: 'John' }, { name: 'Jane' }]);
set.delete({ name: 'John' });
console.log(set); // Set(2) {{ name: 'John' }, { name: 'Jane' }}
```

Как видно из примеров, метод `delete()` удаляет элемент из коллекции Set, если он присутствует в ней. Если же элемент не найден, то метод возвращает значение `false`. Важно понимать, что в случае с объектами, метод `delete()` не сравнивает их содержимое, а удаляет только тот объект, который был передан в качестве аргумента.

Метод `delete()` является удобным способом удаления элемента из коллекции Set. Он позволяет проверить наличие элемента в коллекции и удалить его, если он найден. Это делает работу с коллекциями Set более удобной и эффективной в JavaScript.