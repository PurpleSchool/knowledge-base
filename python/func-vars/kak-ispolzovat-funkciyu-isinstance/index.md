---
metaTitle: Использование функции isinstance в Python
metaDescription: Узнайте, как проверять типы объектов в Python с помощью функции isinstance, синтаксис, примеры проверки типов, наследование классов и практические сценарии.
author: Олег Марков
title: Как использовать функцию isinstance в Python
preview: Разберём функцию isinstance в Python — проверка типов объектов, синтаксис, примеры для встроенных типов и пользовательских классов.
---

## Введение

Функция `isinstance` — встроенный инструмент Python для проверки, принадлежит ли объект определённому типу или классу. Это важно для валидации данных, обработки ошибок и обеспечения корректной работы функций с разными типами объектов.

В этой статье мы подробно разберём синтаксис `isinstance`, примеры работы с встроенными и пользовательскими классами, а также типичные сценарии использования.

Если вы хотите детальнее изучить работу с типами данных и объектно-ориентированное программирование в Python — приходите на наш курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak_ispolzovat_funkciyu_isinstance_v_Python). На курсе 209 уроков и 34 упражнения, AI-тренажеры для практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Синтаксис функции isinstance

```python
isinstance(object, classinfo)
```

* `object` — объект, тип которого нужно проверить.
* `classinfo` — тип или кортеж типов, с которыми сравнивается объект.

Возвращает `True`, если объект является экземпляром указанного класса или его подкласса, иначе `False`.

## Примеры использования с встроенными типами

```python
print(isinstance(10, int))       # True
print(isinstance(10.5, float))   # True
print(isinstance("hello", str))  # True
print(isinstance(10, float))     # False
```

Проверка с несколькими типами через кортеж:

```python
value = 5
print(isinstance(value, (int, float)))  # True, value — int
```

## Применение с пользовательскими классами

```python
class Animal:
    pass

class Dog(Animal):
    pass

dog = Dog()
print(isinstance(dog, Dog))      # True
print(isinstance(dog, Animal))   # True, Dog наследует Animal
print(isinstance(dog, object))   # True, все объекты наследуют object
```

## Практическое использование

`isinstance` часто применяется для валидации аргументов функций:

```python
def process(value):
    if not isinstance(value, int):
        raise TypeError("Ожидалось целое число")
    return value * 2

print(process(5))    # 10
# process("5")       # TypeError
```

Также удобно при обработке сложных коллекций:

```python
data = [1, "two", 3.0, [4]]
numbers = [x for x in data if isinstance(x, (int, float))]
print(numbers)  # [1, 3.0]
```

## Частые ошибки

* Использование `type(obj) == SomeType` вместо `isinstance`, что не учитывает наследование.
* Передача некорректного второго аргумента (не типа или кортежа типов).
* Путаница с проверкой mutable/immutable объектов.

## Часто задаваемые вопросы

1. **Можно ли использовать isinstance для проверки нескольких типов сразу?**
   Да, передайте кортеж типов: `isinstance(obj, (int, float, complex))`.

2. **Проверяет ли isinstance наследование?**
   Да, функция вернёт True для экземпляров подклассов.

3. **В чём отличие от type()?**
   `type()` возвращает точный тип объекта, не учитывая наследование; `isinstance` проверяет принадлежность к классу и его подклассам.

## Заключение

Функция `isinstance` — ключевой инструмент для проверки типов объектов, валидации аргументов и безопасной работы с данными. Она полезна как при работе с встроенными типами, так и с пользовательскими классами, особенно в контексте объектно-ориентированного программирования.

Для системного изучения проверки типов, объектно-ориентированного программирования и функциональных возможностей Python рекомендую пройти курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak_ispolzovat_funkciyu_isinstance_v_Python). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Python прямо сегодня.
