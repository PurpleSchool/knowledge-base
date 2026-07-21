---
metaTitle: "Python __slots__: оптимизация памяти в классах"
metaDescription: "Разбираем __slots__ в Python: как уменьшить потребление памяти объектами, в чём ограничения и когда применять в реальных проектах."
author: "Антон Ларичев"
title: "Python __slots__ — оптимизация памяти в классах"
preview: "Как работает __slots__, зачем он нужен и когда его применение даёт ощутимый выигрыш по памяти и скорости."
---

## Как Python хранит атрибуты объекта

Каждый экземпляр обычного класса в Python несёт в себе словарь `__dict__`, в котором хранятся все его атрибуты. Это гибкое решение: можно добавлять и удалять атрибуты динамически в любой момент.

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
print(p.__dict__)  # {'x': 1, 'y': 2}

# Можно добавить новый атрибут прямо так
p.z = 3
print(p.__dict__)  # {'x': 1, 'y': 2, 'z': 3}
```

Словарь — удобная структура, но не бесплатная. Каждый объект тратит память не только на сами значения атрибутов, но и на словарь как таковой: хеш-таблица, ссылки на ключи, служебные поля CPython. Для одного объекта это незаметно, но когда таких объектов миллионы — накладные расходы становятся критичными.

## Что такое __slots__

`__slots__` — атрибут класса, который сообщает Python: «у экземпляров этого класса будет фиксированный набор атрибутов». Вместо словаря `__dict__` интерпретатор создаёт компактные дескрипторы — по одному на каждый слот. Данные хранятся непосредственно в памяти объекта, как поля структуры в C.

```python
class Point:
    __slots__ = ('x', 'y')

    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
print(p.x)  # 1
print(p.y)  # 2
```

Объявляется `__slots__` как последовательность строк — обычно кортеж или список. Каждая строка — имя разрешённого атрибута.

## Сравнение потребления памяти

Измеримость — главный аргумент при обсуждении оптимизации. Воспользуемся модулем `sys` и сторонней библиотекой `pympler` для точных замеров.

```python
import sys
from pympler import asizeof

class RegularPoint:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class SlottedPoint:
    __slots__ = ('x', 'y')

    def __init__(self, x, y):
        self.x = x
        self.y = y

reg = RegularPoint(1.0, 2.0)
slotted = SlottedPoint(1.0, 2.0)

print(sys.getsizeof(reg))      # ~48 байт (только оболочка объекта)
print(sys.getsizeof(slotted))  # ~56 байт

# Полный размер с учётом __dict__ и его содержимого
print(asizeof.asizeof(reg))      # ~344 байт
print(asizeof.asizeof(slotted))  # ~152 байт
```

`sys.getsizeof` возвращает размер только самого объекта без вложенных структур, поэтому для обычного класса показывает неожиданно малое число — словарь учитывается отдельно. `asizeof` обходит объект рекурсивно и даёт реальную картину.

Посмотрим эффект на большом количестве объектов:

```python
import tracemalloc

tracemalloc.start()

points_regular = [RegularPoint(i, i) for i in range(1_000_000)]
snapshot = tracemalloc.take_snapshot()
stats = snapshot.statistics('lineno')
print(f'Regular: {sum(s.size for s in stats) / 1024 / 1024:.1f} МБ')

tracemalloc.clear_traces()

points_slotted = [SlottedPoint(i, i) for i in range(1_000_000)]
snapshot = tracemalloc.take_snapshot()
stats = snapshot.statistics('lineno')
print(f'Slotted: {sum(s.size for s in stats) / 1024 / 1024:.1f} МБ')

tracemalloc.stop()
# Regular: ~170 МБ
# Slotted: ~56 МБ
```

Выигрыш в памяти — около трёх раз. Для долгоживущих объектов, которые создаются миллионами (строки таблицы, точки геометрии, записи событий), это принципиально.

## Прирост скорости доступа к атрибутам

Доступ через слот быстрее, чем поиск в словаре: не нужно вычислять хеш строки и искать по хеш-таблице. Разница невелика для единичных обращений, но заметна в горячих циклах.

```python
import timeit

reg = RegularPoint(1.0, 2.0)
slotted = SlottedPoint(1.0, 2.0)

t_reg = timeit.timeit(lambda: reg.x, number=10_000_000)
t_slotted = timeit.timeit(lambda: slotted.x, number=10_000_000)

print(f'Regular:  {t_reg:.3f} с')
print(f'Slotted:  {t_slotted:.3f} с')
# Regular:  0.412 с
# Slotted:  0.305 с  (~25% быстрее)
```

## Ограничения __slots__

Гибкость приходится обменивать на экономию памяти.

**Нельзя добавлять произвольные атрибуты.** Если атрибут не объявлен в `__slots__`, присваивание вызовет `AttributeError`:

```python
class Config:
    __slots__ = ('host', 'port')

    def __init__(self, host, port):
        self.host = host
        self.port = port

cfg = Config('localhost', 8080)
cfg.timeout = 30  # AttributeError: 'Config' object has no attribute 'timeout'
```

**Нет `__dict__` по умолчанию.** Инструменты, которые рассчитывают на его существование (некоторые библиотеки сериализации, декораторы, работающие с `__dict__`), могут сломаться. Если нужен и слот, и словарь — добавьте `'__dict__'` в `__slots__` явно, но тогда теряется основная часть экономии.

```python
class Flexible:
    __slots__ = ('x', 'y', '__dict__')  # разрешает оба варианта

f = Flexible()
f.x = 1       # через слот
f.extra = 99  # через __dict__
```

**Нет `__weakref__` по умолчанию.** Если объект должен поддерживать слабые ссылки, добавьте `'__weakref__'` в `__slots__`:

```python
import weakref

class Node:
    __slots__ = ('value', '__weakref__')

    def __init__(self, value):
        self.value = value

node = Node(42)
ref = weakref.ref(node)  # работает
```

**`__slots__` не наследуется автоматически.** Подкласс без собственного `__slots__` получит `__dict__`, даже если родитель его объявил.

## Наследование и __slots__

При наследовании каждый класс иерархии должен объявлять свои слоты. Итоговый набор атрибутов складывается из слотов всех предков.

```python
class Animal:
    __slots__ = ('name', 'age')

    def __init__(self, name, age):
        self.name = name
        self.age = age

class Dog(Animal):
    __slots__ = ('breed',)  # добавляет только новые атрибуты

    def __init__(self, name, age, breed):
        super().__init__(name, age)
        self.breed = breed

dog = Dog('Rex', 3, 'Labrador')
print(dog.name)   # Rex
print(dog.breed)  # Labrador
```

Если подкласс забудет объявить `__slots__`, у него появится `__dict__`, и экономия памяти будет потеряна:

```python
class Cat(Animal):
    # __slots__ не объявлен — Cat получит __dict__
    def __init__(self, name, age, color):
        super().__init__(name, age)
        self.color = color

cat = Cat('Whiskers', 2, 'grey')
cat.extra = 'surprise'  # работает, потому что есть __dict__
print(cat.__dict__)  # {'color': 'grey', 'extra': 'surprise'}
```

Подсказка: при наследовании от встроенных типов (`list`, `dict`, `tuple`) слоты работают с оговорками — у встроенных типов нет `__dict__`, поэтому `__slots__` в подклассе снизит расход памяти, но только для добавленных атрибутов.

## __slots__ и dataclasses

Начиная с Python 3.10 модуль `dataclasses` поддерживает слоты прямо через декоратор:

```python
from dataclasses import dataclass

@dataclass(slots=True)
class Vector:
    x: float
    y: float
    z: float

v = Vector(1.0, 2.0, 3.0)
print(v.x)  # 1.0
print(hasattr(v, '__dict__'))  # False
```

До Python 3.10 приходилось объявлять `__slots__` вручную, дублируя список полей.

## __slots__ и NamedTuple

`typing.NamedTuple` изначально строится на кортеже — `__dict__` у него нет и без `__slots__`, поэтому дополнительной оптимизации не требуется:

```python
from typing import NamedTuple

class Color(NamedTuple):
    r: int
    g: int
    b: int

c = Color(255, 128, 0)
print(c.r)           # 255
print(c[0])          # 255 — кортежный доступ тоже работает
print(hasattr(c, '__dict__'))  # False
```

Если структура данных неизменяемая, `NamedTuple` — более идиоматичный выбор.

## Практический пример: хранение событий аналитики

Предположим, приложение собирает события пользовательского поведения. Каждое событие — небольшой объект с тремя полями, но их в памяти могут находиться сотни тысяч одновременно.

```python
import time
import random

class EventRegular:
    def __init__(self, user_id, event_type, timestamp):
        self.user_id = user_id
        self.event_type = event_type
        self.timestamp = timestamp

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'event_type': self.event_type,
            'timestamp': self.timestamp,
        }

class EventSlotted:
    __slots__ = ('user_id', 'event_type', 'timestamp')

    def __init__(self, user_id, event_type, timestamp):
        self.user_id = user_id
        self.event_type = event_type
        self.timestamp = timestamp

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'event_type': self.event_type,
            'timestamp': self.timestamp,
        }

event_types = ['click', 'view', 'purchase', 'scroll']

# Генерируем 500 000 событий каждого типа
regular_events = [
    EventRegular(random.randint(1, 10000), random.choice(event_types), time.time())
    for _ in range(500_000)
]

slotted_events = [
    EventSlotted(random.randint(1, 10000), random.choice(event_types), time.time())
    for _ in range(500_000)
]
```

Применение `__slots__` в подобном сценарии даёт экономию 50–70 МБ при тех же 500 тысячах объектов и не требует изменения логики метода `to_dict()`.

## Когда применять __slots__

Применяйте `__slots__`, когда одновременно выполняются несколько условий:

- Класс создаётся в большом количестве экземпляров (от десятков тысяч и выше).
- Набор атрибутов фиксирован и известен заранее.
- Потребление памяти является узким местом.

Не стоит добавлять `__slots__` повсеместно из соображений «а вдруг поможет». Это усложняет код и ломает динамические паттерны: миксины, monkey patching, некоторые декораторы.

**Хорошие кандидаты:**

- Модели строк из базы данных при bulk-загрузке.
- Узлы деревьев и графов в алгоритмических задачах.
- Объекты геометрии в игровых движках и симуляторах.
- Структуры событий в системах сбора аналитики.

**Плохие кандидаты:**

- Singleton-объекты (экономия незначительна).
- Классы, которые активно расширяются через миксины или декораторы.
- Объекты, которые нужно сериализовать через `pickle` без дополнительной настройки.

## Pickle и __slots__

Стандартный `pickle` сохраняет объект через `__dict__`. Если его нет, сериализация упадёт. Чтобы это исправить, добавьте методы `__getstate__` и `__setstate__`:

```python
import pickle

class Point:
    __slots__ = ('x', 'y')

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __getstate__(self):
        return {'x': self.x, 'y': self.y}

    def __setstate__(self, state):
        self.x = state['x']
        self.y = state['y']

p = Point(3, 4)
data = pickle.dumps(p)
p2 = pickle.loads(data)
print(p2.x, p2.y)  # 3 4
```

## Проверка слотов через интроспекцию

Полезно знать, как убедиться, что слоты определены корректно:

```python
class Rectangle:
    __slots__ = ('width', 'height')

    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

print(Rectangle.__slots__)          # ('width', 'height')
print(hasattr(Rectangle, '__dict__'))  # True — это словарь КЛАССА, не экземпляра

rect = Rectangle(5, 10)
print(hasattr(rect, '__dict__'))    # False — у экземпляра словаря нет

# Дескрипторы слотов видны в классе
print(type(Rectangle.width))       # <class 'member_descriptor'>
```

Обратите внимание: `__dict__` есть у самого объекта класса `Rectangle` — там хранятся методы и дескрипторы. Но у *экземпляра* `rect` словаря нет.

## Итог

`__slots__` — точечная оптимизация, которая устраняет накладные расходы словаря `__dict__` у экземпляров класса. Используйте его, когда профилирование показало реальную проблему с памятью и объектов в системе действительно много. В остальных случаях предпочтительнее оставить стандартное поведение Python: оно проще в поддержке и совместимо с широким экосистемным инструментарием.

Если вам нужны только неизменяемые записи — рассмотрите `NamedTuple`. Для изменяемых структур данных с аннотациями типов — `@dataclass(slots=True)` начиная с Python 3.10 даёт удобный синтаксис без ручного объявления слотов.

Освоить Python с нуля и разобраться в тонкостях языка, включая управление памятью и ООП, можно на курсе [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-slots-memory-optimization).
