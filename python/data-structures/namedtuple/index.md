---
metaTitle: "Python NamedTuple: именованные кортежи с примерами"
metaDescription: "Как использовать NamedTuple в Python: создание, поля, методы, сравнение с dataclass. Практические примеры на collections.namedtuple и typing.NamedTuple."
author: "Антон Ларичев"
title: "NamedTuple в Python"
preview: "Именованные кортежи делают код читаемее без потери производительности. Разбираем collections.namedtuple и typing.NamedTuple с практическими примерами."
---

## Что такое NamedTuple

Обычный кортеж хранит данные по индексу, и со временем это становится проблемой: непонятно, что означает `point[0]` — координата X, ID или что-то ещё. `NamedTuple` решает эту проблему, добавляя имена к каждому полю кортежа.

`NamedTuple` — это подкласс обычного кортежа. Он сохраняет все свойства кортежа (неизменяемость, поддержку индексирования, распаковку), но при этом позволяет обращаться к элементам по имени.

В Python есть два способа создать именованный кортеж:

- `collections.namedtuple` — функциональный способ, доступен с Python 2.6
- `typing.NamedTuple` — классовый синтаксис с поддержкой аннотаций типов, доступен с Python 3.6

## collections.namedtuple

Функция `namedtuple` из модуля `collections` принимает имя класса и список полей.

```python
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])

p = Point(10, 20)
print(p.x)   # 10
print(p.y)   # 20
print(p[0])  # 10 — индексирование по-прежнему работает
print(p)     # Point(x=10, y=20)
```

Поля можно передать строкой через пробел или запятую:

```python
Point = namedtuple('Point', 'x y')
Color = namedtuple('Color', 'red, green, blue')
```

### Значения по умолчанию

С Python 3.6.1 в `namedtuple` появился параметр `defaults`. Значения по умолчанию применяются к последним N полям:

```python
from collections import namedtuple

HTTPResponse = namedtuple(
    'HTTPResponse',
    ['status', 'body', 'headers'],
    defaults=[None, {}]  # применяется к body и headers
)

response = HTTPResponse(status=200)
print(response.body)     # None
print(response.headers)  # {}

response2 = HTTPResponse(status=404, body='Not Found')
print(response2)  # HTTPResponse(status=404, body='Not Found', headers={})
```

## typing.NamedTuple

Классовый синтаксис через `typing.NamedTuple` более читаем и поддерживает аннотации типов, документирование и значения по умолчанию прямо в теле класса.

```python
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float

p = Point(1.5, 2.7)
print(p.x)  # 1.5
print(p)    # Point(x=1.5, y=2.7)
```

### Значения по умолчанию в классовом стиле

```python
from typing import NamedTuple

class HTTPResponse(NamedTuple):
    status: int
    body: str | None = None
    headers: dict = {}

response = HTTPResponse(status=200)
print(response)  # HTTPResponse(status=200, body=None, headers={})
```

### Методы в typing.NamedTuple

Одно из главных преимуществ классового синтаксиса — возможность добавлять методы:

```python
from typing import NamedTuple
import math

class Point(NamedTuple):
    x: float
    y: float

    def distance_to(self, other: 'Point') -> float:
        return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2)

    def __str__(self) -> str:
        return f'Point({self.x}, {self.y})'

a = Point(0, 0)
b = Point(3, 4)
print(a.distance_to(b))  # 5.0
```

## Встроенные методы NamedTuple

Все именованные кортежи, независимо от способа создания, получают набор встроенных методов.

### _fields

Атрибут `_fields` возвращает кортеж с именами всех полей:

```python
from typing import NamedTuple

class User(NamedTuple):
    name: str
    age: int
    email: str

print(User._fields)  # ('name', 'age', 'email')
```

### _asdict

Метод `_asdict` преобразует именованный кортеж в словарь:

```python
user = User(name='Alice', age=30, email='alice@example.com')
d = user._asdict()
print(d)  # {'name': 'Alice', 'age': 30, 'email': 'alice@example.com'}

# Удобно для сериализации
import json
print(json.dumps(user._asdict()))  # {"name": "Alice", "age": 30, "email": "alice@example.com"}
```

### _replace

Поскольку кортежи неизменяемы, `_replace` создаёт новый экземпляр с изменёнными полями:

```python
user = User(name='Alice', age=30, email='alice@example.com')
updated_user = user._replace(age=31)

print(user)          # User(name='Alice', age=30, email='alice@example.com')
print(updated_user)  # User(name='Alice', age=31, email='alice@example.com')
```

### _make

Классметод `_make` создаёт именованный кортеж из любого итерируемого объекта:

```python
data = ['Bob', 25, 'bob@example.com']
user = User._make(data)
print(user)  # User(name='Bob', age=25, email='bob@example.com')

# Очень удобно при чтении данных из CSV или БД
rows = [
    ('Alice', 30, 'alice@example.com'),
    ('Bob', 25, 'bob@example.com'),
]
users = [User._make(row) for row in rows]
```

## Неизменяемость и поведение кортежа

`NamedTuple` — полноценный кортеж. Попытка изменить поле вызовет `AttributeError`:

```python
point = Point(1.0, 2.0)
point.x = 5.0  # AttributeError: can't set attribute
```

При этом все кортежные операции работают:

```python
point = Point(3.0, 4.0)

# Распаковка
x, y = point
print(x, y)  # 3.0 4.0

# Индексирование
print(point[0])   # 3.0

# Итерация
for value in point:
    print(value)

# Использование как ключа словаря
cache = {}
cache[point] = 'origin'

# Сравнение
p1 = Point(1.0, 2.0)
p2 = Point(1.0, 2.0)
print(p1 == p2)  # True
```

## Практические примеры использования

### Возврат нескольких значений из функции

Вместо словаря или обычного кортежа именованный кортеж делает намерение явным:

```python
from typing import NamedTuple

class ParseResult(NamedTuple):
    host: str
    port: int
    path: str

def parse_url(url: str) -> ParseResult:
    # упрощённый парсер для примера
    parts = url.split('/')
    host_port = parts[2].split(':')
    host = host_port[0]
    port = int(host_port[1]) if len(host_port) > 1 else 80
    path = '/' + '/'.join(parts[3:])
    return ParseResult(host=host, port=port, path=path)

result = parse_url('http://example.com:8080/api/users')
print(result.host)  # example.com
print(result.port)  # 8080
print(result.path)  # /api/users
```

### Работа с CSV и табличными данными

```python
import csv
from typing import NamedTuple

class Product(NamedTuple):
    name: str
    price: float
    quantity: int

def load_products(filename: str) -> list[Product]:
    products = []
    with open(filename) as f:
        reader = csv.reader(f)
        next(reader)  # пропускаем заголовок
        for row in reader:
            products.append(Product(
                name=row[0],
                price=float(row[1]),
                quantity=int(row[2])
            ))
    return products

# Работа с данными
products = [
    Product('Laptop', 999.99, 5),
    Product('Mouse', 29.99, 50),
    Product('Keyboard', 79.99, 30),
]

total_value = sum(p.price * p.quantity for p in products)
expensive = [p for p in products if p.price > 50]

print(f'Общая стоимость: {total_value:.2f}')
print(f'Дорогие товары: {[p.name for p in expensive]}')
```

### Конфигурация приложения

```python
from typing import NamedTuple

class DatabaseConfig(NamedTuple):
    host: str
    port: int
    name: str
    user: str
    password: str
    pool_size: int = 5
    timeout: int = 30

DEV_CONFIG = DatabaseConfig(
    host='localhost',
    port=5432,
    name='myapp_dev',
    user='dev',
    password='devpass'
)

PROD_CONFIG = DEV_CONFIG._replace(
    host='prod-db.example.com',
    name='myapp_prod',
    user='prod_user',
    password='secure_password',
    pool_size=20
)

def connect(config: DatabaseConfig):
    print(f'Connecting to {config.host}:{config.port}/{config.name}')
```

## NamedTuple vs dataclass vs dict

Выбор между этими структурами зависит от задачи.

```python
from typing import NamedTuple
from dataclasses import dataclass

# Словарь — нет типизации, мутируемый
point_dict = {'x': 1.0, 'y': 2.0}

# NamedTuple — иммутируемый, лёгкий, типизированный
class PointNT(NamedTuple):
    x: float
    y: float

# dataclass — мутируемый по умолчанию, гибкий
@dataclass
class PointDC:
    x: float
    y: float
```

| Критерий | dict | NamedTuple | dataclass |
|---|---|---|---|
| Иммутируемость | Нет | Да | Опционально (`frozen=True`) |
| Аннотации типов | Нет | Да | Да |
| Использование как ключ словаря | Нет | Да | Только с `frozen=True` |
| Методы | Нет | Да | Да |
| Потребление памяти | Высокое | Низкое | Среднее |
| Совместимость с tuple | Нет | Да | Нет |
| Наследование | Нет | Ограниченное | Да |

### Производительность

`NamedTuple` потребляет меньше памяти, чем `dict` или `dataclass`, потому что хранит данные в кортеже без дополнительного `__dict__`:

```python
import sys
from typing import NamedTuple
from dataclasses import dataclass

class PointNT(NamedTuple):
    x: float
    y: float

@dataclass
class PointDC:
    x: float
    y: float

nt = PointNT(1.0, 2.0)
dc = PointDC(1.0, 2.0)
d = {'x': 1.0, 'y': 2.0}

print(sys.getsizeof(nt))  # ~56 байт
print(sys.getsizeof(dc))  # ~48 байт (но dc.__dict__ добавляет ~200+ байт)
print(sys.getsizeof(d))   # ~200+ байт
```

## Ограничения NamedTuple

Перед использованием `NamedTuple` важно понимать его ограничения.

**Нельзя изменять поля после создания.** Это особенность, а не баг, но если данные должны меняться — лучше использовать `dataclass`.

**Ограниченное наследование.** Нельзя добавить новые поля в подклассе:

```python
from typing import NamedTuple

class Base(NamedTuple):
    x: int
    y: int

# Это не добавит поле z — поведение непредсказуемо
class Extended(Base):
    z: int  # это не поле NamedTuple, а просто аннотация класса

e = Extended(1, 2)  # TypeError: __new__() takes 3 positional arguments but 4 were given
```

**Сравнение происходит по значениям, а не по типу:**

```python
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float

class Vector(NamedTuple):
    x: float
    y: float

p = Point(1.0, 2.0)
v = Vector(1.0, 2.0)

print(p == v)  # True — сравниваются как кортежи (1.0, 2.0) == (1.0, 2.0)
```

Если нужно различать типы при сравнении, используйте `dataclass`.

## Когда использовать NamedTuple

`NamedTuple` — правильный выбор, когда:

- данные не должны изменяться после создания
- нужна совместимость с кортежем (распаковка, использование как ключ словаря, передача в функции, ожидающие tuple)
- важна минимальная нагрузка на память при большом количестве объектов
- нужно вернуть несколько значений из функции с явными именами
- данные представляют собой простую запись без сложной бизнес-логики

Для мутируемых структур с наследованием и валидацией лучше подойдёт `dataclass`. Для данных с валидацией и сериализацией рассмотрите Pydantic.

---

Чтобы глубже разобраться в Python и структурах данных, записывайтесь на курс по Python на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-namedtuple