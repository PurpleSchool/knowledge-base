---
metaTitle: "Python dataclasses — классы данных без лишнего кода"
metaDescription: "Подробное руководство по dataclasses в Python: декоратор @dataclass, поля, значения по умолчанию, сравнение, заморозка и практические примеры."
author: "Антон Ларичев"
title: "Python dataclasses: создание классов данных"
preview: "Как использовать dataclasses в Python для создания классов данных с минимальным количеством шаблонного кода."
---

## Что такое dataclasses

Модуль `dataclasses`, появившийся в Python 3.7, решает одну из самых распространённых задач — создание классов, которые в первую очередь хранят данные. Вместо того чтобы вручную писать `__init__`, `__repr__` и `__eq__`, достаточно описать поля класса, и Python сгенерирует все эти методы автоматически.

Сравните обычный класс:

```python
class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point(x={self.x}, y={self.y})"

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y
```

И аналогичный dataclass:

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float
```

Оба варианта дают одинаковый результат, но dataclass в четыре раза короче.

## Базовый синтаксис

Декоратор `@dataclass` применяется к классу с аннотированными полями. Аннотации типов обязательны — без них Python не распознает поле как атрибут dataclass.

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: int
    username: str
    email: str
    is_active: bool = True
    bio: Optional[str] = None
```

Что Python генерирует автоматически:

- `__init__` — конструктор со всеми полями в качестве параметров
- `__repr__` — строковое представление объекта
- `__eq__` — сравнение по значениям всех полей

```python
user1 = User(id=1, username="alice", email="alice@example.com")
user2 = User(id=1, username="alice", email="alice@example.com")

print(user1)          # User(id=1, username='alice', email='alice@example.com', is_active=True, bio=None)
print(user1 == user2) # True
```

## Значения по умолчанию

Поля без значений по умолчанию должны идти перед полями с дефолтами — так же, как аргументы функции.

```python
@dataclass
class Product:
    name: str          # обязательное поле
    price: float       # обязательное поле
    in_stock: bool = True
    quantity: int = 0
```

Для изменяемых значений по умолчанию (список, словарь) нельзя указывать их напрямую. Вместо этого используется `field` с параметром `default_factory`:

```python
from dataclasses import dataclass, field

@dataclass
class Order:
    order_id: int
    items: list = field(default_factory=list)
    metadata: dict = field(default_factory=dict)

order = Order(order_id=42)
order.items.append("book")
print(order)  # Order(order_id=42, items=['book'], metadata={})
```

Если написать `items: list = []`, Python выбросит `ValueError` — это защита от классической ошибки с разделяемыми изменяемыми объектами.

## Функция field и её параметры

Функция `field()` даёт тонкий контроль над поведением отдельных полей.

```python
from dataclasses import dataclass, field

@dataclass
class Article:
    title: str
    content: str
    tags: list = field(default_factory=list)
    _word_count: int = field(init=False, repr=False)

    def __post_init__(self):
        self._word_count = len(self.content.split())
```

Основные параметры `field()`:

- `default` — значение по умолчанию
- `default_factory` — функция без аргументов, возвращающая значение по умолчанию
- `init` — включать ли поле в `__init__` (по умолчанию `True`)
- `repr` — включать ли поле в `__repr__` (по умолчанию `True`)
- `compare` — использовать ли поле при сравнении (по умолчанию `True`)
- `hash` — включать ли поле в `__hash__`

```python
@dataclass
class Employee:
    name: str
    salary: float = field(repr=False, compare=False)
    department: str = "Engineering"
    _internal_id: str = field(init=False, repr=False, default="")

    def __post_init__(self):
        self._internal_id = f"{self.department}-{self.name.lower()}"
```

## Метод __post_init__

Когда нужно выполнить дополнительную инициализацию после того, как `__init__` заполнил поля, используется `__post_init__`:

```python
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Event:
    name: str
    start: datetime
    end: datetime
    duration_hours: float = field(init=False)

    def __post_init__(self):
        if self.end <= self.start:
            raise ValueError("Дата окончания должна быть позже даты начала")
        delta = self.end - self.start
        self.duration_hours = delta.total_seconds() / 3600

event = Event(
    name="Конференция",
    start=datetime(2024, 6, 1, 9, 0),
    end=datetime(2024, 6, 1, 18, 0)
)
print(event.duration_hours)  # 9.0
```

### Инициализация полей-переменных с init=False

Если поле исключено из `__init__`, его нужно вычислить в `__post_init__`. Для этого не нужно передавать значение в `field(default=...)` — достаточно присвоить в методе.

## Параметры декоратора @dataclass

Декоратор принимает несколько именованных аргументов, которые управляют генерацией методов.

```python
@dataclass(order=True, frozen=True)
class Version:
    major: int
    minor: int
    patch: int
```

Важные параметры:

- `eq=True` — генерировать `__eq__` (по умолчанию `True`)
- `order=False` — генерировать методы сравнения `__lt__`, `__le__`, `__gt__`, `__ge__`
- `frozen=False` — запретить изменение атрибутов после создания
- `slots=False` — использовать `__slots__` (Python 3.10+)
- `kw_only=False` — все поля принимаются только как keyword-аргументы (Python 3.10+)

### Параметр order

```python
@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int

v1 = Version(1, 9, 0)
v2 = Version(2, 0, 0)

print(v1 < v2)   # True
print(sorted([Version(1, 2, 3), Version(1, 0, 0), Version(2, 0, 0)]))
# [Version(major=1, minor=0, patch=0), Version(major=1, minor=2, patch=3), Version(major=2, minor=0, patch=0)]
```

Сравнение происходит по кортежу из значений полей в том порядке, в котором они объявлены.

### Параметр frozen

Замороженный dataclass делает объект неизменяемым — попытка присвоить значение атрибуту выбросит `FrozenInstanceError`.

```python
@dataclass(frozen=True)
class Coordinate:
    latitude: float
    longitude: float

coord = Coordinate(55.75, 37.62)
# coord.latitude = 0  # FrozenInstanceError

# Замороженные объекты можно хешировать и использовать как ключи словаря
location_cache = {coord: "Москва"}
print(location_cache[Coordinate(55.75, 37.62)])  # Москва
```

## Наследование dataclasses

Dataclass может наследовать другой dataclass. Поля родителя добавляются перед полями дочернего класса.

```python
from dataclasses import dataclass

@dataclass
class Animal:
    name: str
    age: int

@dataclass
class Dog(Animal):
    breed: str
    is_trained: bool = False

dog = Dog(name="Рекс", age=3, breed="Лабрадор")
print(dog)  # Dog(name='Рекс', age=3, breed='Лабрадор', is_trained=False)
```

Важный момент: если у родительского класса есть поля со значениями по умолчанию, все поля дочернего класса тоже должны иметь значения по умолчанию. Иначе Python выбросит `TypeError` — поля без дефолта не могут идти после полей с дефолтом.

```python
@dataclass
class Base:
    x: int = 0  # есть дефолт

# Ошибка: поле без дефолта после поля с дефолтом
# @dataclass
# class Child(Base):
#     y: int  # TypeError!

@dataclass
class Child(Base):
    y: int = 0  # OK
```

## Вспомогательные функции модуля

### asdict и astuple

```python
from dataclasses import dataclass, asdict, astuple

@dataclass
class RGB:
    red: int
    green: int
    blue: int

color = RGB(255, 128, 0)

print(asdict(color))   # {'red': 255, 'green': 128, 'blue': 0}
print(astuple(color))  # (255, 128, 0)
```

`asdict` рекурсивно обходит вложенные dataclasses и преобразует их в словари — удобно для сериализации в JSON.

```python
import json
from dataclasses import dataclass, asdict
from typing import List

@dataclass
class Address:
    city: str
    street: str

@dataclass
class Person:
    name: str
    address: Address
    phones: List[str]

person = Person(
    name="Иван",
    address=Address(city="Москва", street="Арбат"),
    phones=["+7-999-000-00-00"]
)

print(json.dumps(asdict(person), ensure_ascii=False))
# {"name": "Иван", "address": {"city": "Москва", "street": "Арбат"}, "phones": ["+7-999-000-00-00"]}
```

### replace

Функция `replace` создаёт копию объекта с изменёнными полями — незаменима при работе с замороженными dataclasses.

```python
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Config:
    host: str
    port: int
    debug: bool = False

base_config = Config(host="localhost", port=8000)
dev_config = replace(base_config, debug=True)
prod_config = replace(base_config, host="0.0.0.0", port=80)

print(base_config)  # Config(host='localhost', port=8000, debug=False)
print(dev_config)   # Config(host='localhost', port=8000, debug=True)
print(prod_config)  # Config(host='0.0.0.0', port=80, debug=False)
```

### fields

Функция `fields` возвращает кортеж объектов `Field`, описывающих поля класса:

```python
from dataclasses import dataclass, fields

@dataclass
class Point:
    x: float
    y: float
    label: str = ""

for f in fields(Point):
    print(f.name, f.type, f.default)
# x <class 'float'> MISSING
# y <class 'float'> MISSING
# label <class 'str'> 
```

## Практический пример: система конфигурации

Соберём реальный пример — конфигурацию приложения с вложенными dataclasses:

```python
from dataclasses import dataclass, field, asdict
from typing import List, Optional
import json

@dataclass
class DatabaseConfig:
    host: str
    port: int = 5432
    name: str = "app_db"
    pool_size: int = 10

@dataclass
class CacheConfig:
    backend: str = "redis"
    host: str = "localhost"
    port: int = 6379
    ttl: int = 3600

@dataclass
class AppConfig:
    app_name: str
    environment: str
    database: DatabaseConfig
    cache: CacheConfig = field(default_factory=CacheConfig)
    allowed_hosts: List[str] = field(default_factory=list)
    debug: bool = False
    secret_key: str = field(default="", repr=False)

    def __post_init__(self):
        if self.environment == "production" and self.debug:
            raise ValueError("Debug не может быть включён в production")
        if not self.allowed_hosts:
            self.allowed_hosts = ["localhost"]

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2, ensure_ascii=False)


config = AppConfig(
    app_name="MyService",
    environment="development",
    database=DatabaseConfig(host="db.local", name="myservice_dev"),
    secret_key="super-secret",
)

print(config.to_json())
```

## Dataclasses и протоколы: slots и kw_only (Python 3.10+)

С Python 3.10 появились два полезных параметра.

`slots=True` автоматически добавляет `__slots__`, что снижает потребление памяти и ускоряет доступ к атрибутам:

```python
@dataclass(slots=True)
class Vector:
    x: float
    y: float
    z: float
```

`kw_only=True` требует передавать все поля только по имени, исключая позиционные аргументы:

```python
@dataclass(kw_only=True)
class Request:
    method: str
    path: str
    body: Optional[str] = None

# req = Request("GET", "/api")  # TypeError
req = Request(method="GET", path="/api")  # OK
```

Можно применять `kw_only` к отдельным полям через `field(kw_only=True)`, что решает проблему с наследованием:

```python
@dataclass
class Base:
    x: int

@dataclass
class Child(Base):
    y: int
    z: int = field(default=0, kw_only=True)
```

## Сравнение с альтернативами

Dataclasses — не единственный инструмент для классов данных в Python.

`NamedTuple` из модуля `typing` создаёт неизменяемые объекты с доступом по индексу, но без возможности добавлять методы, изменять поля или наследовать:

```python
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
```

Pydantic предоставляет валидацию данных и сериализацию из коробки, но является сторонней зависимостью. Если нужна строгая валидация входных данных — Pydantic лучше. Для внутренних структур без внешних данных — dataclasses достаточно.

`attrs` — более мощная библиотека для тех же задач, тоже сторонняя. Dataclasses были вдохновлены `attrs` и покрывают большинство повседневных сценариев.

## Итог

Dataclasses — прагматичный инструмент для классов, которые прежде всего хранят данные. Они устраняют шаблонный код, не жертвуя читаемостью: аннотации полей служат документацией, а сгенерированные методы делают именно то, что от них ожидают.

Ключевые сценарии применения:
- передача данных между слоями приложения (DTO)
- конфигурационные объекты
- результаты запросов к базе данных или внешнему API
- неизменяемые value-объекты с `frozen=True`

Для углублённого изучения Python и объектно-ориентированного программирования посмотрите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-dataclasses