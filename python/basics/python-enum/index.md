---
metaTitle: "Python Enum: перечисления в Python — полное руководство"
metaDescription: "Как использовать Enum в Python: создание перечислений, методы, флаги, сравнение и практические примеры. Подробное руководство для разработчиков."
author: "Антон Ларичев"
title: "Python Enum — перечисления в Python"
preview: "Разбираемся с модулем enum в Python: как создавать перечисления, работать с их значениями и применять в реальных проектах."
---

## Что такое Enum в Python

Enum (перечисление) — это специальный тип данных, позволяющий задать набор именованных констант. Модуль `enum` появился в стандартной библиотеке Python начиная с версии 3.4 и решает одну из частых задач: хранить фиксированный набор значений с понятными именами.

Без перечислений разработчики нередко прибегают к «магическим числам» или строкам:

```python
# Плохой подход — «магические» константы
STATUS_ACTIVE = 1
STATUS_INACTIVE = 2
STATUS_BANNED = 3

def get_user_status(status):
    if status == 1:
        return "Активен"
    elif status == 2:
        return "Неактивен"
```

Такой код трудно читать, легко сделать опечатку и сложно рефакторить. Enum решает эти проблемы.

## Создание простого перечисления

Для создания перечисления нужно импортировать `Enum` из модуля `enum` и унаследоваться от него:

```python
from enum import Enum

class UserStatus(Enum):
    ACTIVE = 1
    INACTIVE = 2
    BANNED = 3
```

Теперь можно обращаться к членам перечисления через имя класса:

```python
status = UserStatus.ACTIVE
print(status)        # UserStatus.ACTIVE
print(status.name)   # ACTIVE
print(status.value)  # 1
print(type(status))  # <enum 'UserStatus'>
```

Каждый член перечисления — это экземпляр класса `UserStatus`, а не просто число или строка.

## Перебор членов перечисления

Enum поддерживает итерацию — можно перебрать все значения в цикле:

```python
for status in UserStatus:
    print(f"{status.name}: {status.value}")

# ACTIVE: 1
# INACTIVE: 2
# BANNED: 3
```

Чтобы получить список всех членов:

```python
all_statuses = list(UserStatus)
print(all_statuses)
# [<UserStatus.ACTIVE: 1>, <UserStatus.INACTIVE: 2>, <UserStatus.BANNED: 3>]
```

## Доступ к членам перечисления

Sуществует несколько способов получить конкретный член:

```python
# По имени
status = UserStatus['ACTIVE']
print(status)  # UserStatus.ACTIVE

# По значению
status = UserStatus(2)
print(status)  # UserStatus.INACTIVE

# По атрибуту
status = UserStatus.BANNED
print(status)  # UserStatus.BANNED
```

Если передать несуществующее значение, Python выбросит исключение:

```python
try:
    status = UserStatus(99)
except ValueError as e:
    print(e)  # 99 is not a valid UserStatus
```

## Сравнение членов перечисления

Члены одного перечисления можно сравнивать на равенство и идентичность:

```python
status = UserStatus.ACTIVE

print(status == UserStatus.ACTIVE)    # True
print(status == UserStatus.INACTIVE)  # False
print(status is UserStatus.ACTIVE)    # True
```

Важный момент: члены Enum **не сравниваются** с обычными числами по умолчанию:

```python
print(UserStatus.ACTIVE == 1)  # False
```

Это намеренное поведение, защищающее от случайных сравнений с «магическими» числами.

## Строковые перечисления

Значениями членов могут быть строки — это удобно для хранения состояний в базе данных или передачи через API:

```python
from enum import Enum

class Direction(Enum):
    NORTH = "north"
    SOUTH = "south"
    EAST = "east"
    WEST = "west"

current = Direction.NORTH
print(current.value)  # north
```

### StrEnum — автоматическое сравнение со строками

Начиная с Python 3.11 доступен `StrEnum`. Его члены ведут себя как строки:

```python
from enum import StrEnum

class Color(StrEnum):
    RED = "red"
    GREEN = "green"
    BLUE = "blue"

print(Color.RED == "red")  # True
print(f"Цвет: {Color.GREEN}")  # Цвет: green
```

## IntEnum — сравнение с числами

`IntEnum` позволяет сравнивать члены перечисления с обычными целыми числами:

```python
from enum import IntEnum

class Priority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

print(Priority.HIGH > Priority.LOW)  # True
print(Priority.MEDIUM == 2)          # True
print(sorted([Priority.HIGH, Priority.LOW, Priority.CRITICAL]))
# [<Priority.LOW: 1>, <Priority.HIGH: 3>, <Priority.CRITICAL: 4>]
```

Однако злоупотреблять `IntEnum` не стоит: потеря строгости типов может привести к трудноуловимым ошибкам.

## auto() — автоматическая нумерация

Функция `auto()` позволяет не задавать значения вручную — Python присвоит их автоматически:

```python
from enum import Enum, auto

class Season(Enum):
    SPRING = auto()
    SUMMER = auto()
    AUTUMN = auto()
    WINTER = auto()

for season in Season:
    print(f"{season.name}: {season.value}")

# SPRING: 1
# SUMMER: 2
# AUTUMN: 3
# WINTER: 4
```

По умолчанию `auto()` начинает с 1 и увеличивает на 1. Поведение можно переопределить через метод `_generate_next_value_`:

```python
from enum import Enum, auto

class LowercaseEnum(Enum):
    @staticmethod
    def _generate_next_value_(name, start, count, last_values):
        return name.lower()

class HttpMethod(LowercaseEnum):
    GET = auto()
    POST = auto()
    PUT = auto()
    DELETE = auto()

print(HttpMethod.GET.value)     # get
print(HttpMethod.DELETE.value)  # delete
```

## Flag — битовые флаги

`Flag` предназначен для создания флагов, которые можно комбинировать с помощью побитовых операций:

```python
from enum import Flag, auto

class Permission(Flag):
    READ = auto()
    WRITE = auto()
    EXECUTE = auto()
    ADMIN = READ | WRITE | EXECUTE

# Комбинирование флагов
user_permissions = Permission.READ | Permission.WRITE
print(user_permissions)  # Permission.READ|WRITE

# Проверка флага
print(Permission.READ in user_permissions)   # True
print(Permission.EXECUTE in user_permissions) # False

# Права администратора
admin = Permission.ADMIN
print(Permission.WRITE in admin)  # True
```

`IntFlag` работает аналогично, но совместим с обычными целыми числами:

```python
from enum import IntFlag

class FileMode(IntFlag):
    NONE = 0
    READ = 4
    WRITE = 2
    EXECUTE = 1

mode = FileMode.READ | FileMode.WRITE
print(mode)        # FileMode.READ|WRITE
print(int(mode))   # 6
print(mode & 4)    # FileMode.READ (битовое AND)
```

## Методы и свойства в Enum

В перечисления можно добавлять методы, что делает их полноценными объектами с поведением:

```python
from enum import Enum

class Planet(Enum):
    MERCURY = (3.303e+23, 2.4397e6)
    VENUS   = (4.869e+24, 6.0518e6)
    EARTH   = (5.976e+24, 6.37814e6)
    MARS    = (6.421e+23, 3.3972e6)

    def __init__(self, mass, radius):
        self.mass = mass      # кг
        self.radius = radius  # метры

    @property
    def surface_gravity(self):
        G = 6.67430e-11
        return G * self.mass / (self.radius ** 2)

    def weight(self, mass_on_earth):
        return mass_on_earth * self.surface_gravity / Planet.EARTH.surface_gravity

print(f"Ускорение на Марсе: {Planet.MARS.surface_gravity:.2f} м/с²")
# Ускорение на Марсе: 3.71 м/с²

print(f"Вес 75 кг на Марсе: {Planet.MARS.weight(75):.1f} кг")
# Вес 75 кг на Марсе: 28.5 кг
```

## Псевдонимы в перечислениях

Если два члена имеют одинаковое значение, второй становится псевдонимом первого:

```python
from enum import Enum

class Color(Enum):
    RED = 1
    CRIMSON = 1   # псевдоним для RED
    GREEN = 2
    BLUE = 3

print(Color.CRIMSON)          # Color.RED
print(Color.CRIMSON is Color.RED)  # True

# Псевдонимы не попадают в итерацию
for color in Color:
    print(color)
# Color.RED
# Color.GREEN
# Color.BLUE
```

Чтобы запретить псевдонимы, используйте декоратор `@unique`:

```python
from enum import Enum, unique

@unique
class Color(Enum):
    RED = 1
    CRIMSON = 1  # ValueError: duplicate values found
```

## Практический пример: состояния заказа

Рассмотрим реальный сценарий — управление состояниями заказа в интернет-магазине:

```python
from enum import Enum, auto
from datetime import datetime

class OrderStatus(Enum):
    PENDING = auto()
    CONFIRMED = auto()
    SHIPPED = auto()
    DELIVERED = auto()
    CANCELLED = auto()

    def can_cancel(self) -> bool:
        return self in (OrderStatus.PENDING, OrderStatus.CONFIRMED)

    def next_status(self):
        transitions = {
            OrderStatus.PENDING: OrderStatus.CONFIRMED,
            OrderStatus.CONFIRMED: OrderStatus.SHIPPED,
            OrderStatus.SHIPPED: OrderStatus.DELIVERED,
        }
        return transitions.get(self)

class Order:
    def __init__(self, order_id: int):
        self.order_id = order_id
        self.status = OrderStatus.PENDING
        self.history = [(self.status, datetime.now())]

    def advance(self):
        next_s = self.status.next_status()
        if next_s is None:
            raise ValueError(f"Нельзя перевести из статуса {self.status.name}")
        self.status = next_s
        self.history.append((self.status, datetime.now()))

    def cancel(self):
        if not self.status.can_cancel():
            raise ValueError(f"Нельзя отменить заказ со статусом {self.status.name}")
        self.status = OrderStatus.CANCELLED
        self.history.append((self.status, datetime.now()))

# Использование
order = Order(order_id=42)
print(order.status)  # OrderStatus.PENDING

order.advance()
print(order.status)  # OrderStatus.CONFIRMED

order.advance()
print(order.status)  # OrderStatus.SHIPPED

try:
    order.cancel()  # Нельзя отменить — заказ уже отправлен
except ValueError as e:
    print(e)  # Нельзя отменить заказ со статусом SHIPPED
```

## Сериализация и десериализация

При работе с API или базами данных часто нужно преобразовывать Enum в примитивы и обратно:

```python
import json
from enum import Enum

class Role(Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

# Сериализация
data = {
    "username": "ivan",
    "role": Role.ADMIN.value  # "admin"
}
print(json.dumps(data))  # {"username": "ivan", "role": "admin"}

# Десериализация
raw = '{"username": "ivan", "role": "admin"}'
parsed = json.loads(raw)
role = Role(parsed["role"])
print(role)         # Role.ADMIN
print(role.name)    # ADMIN
```

## Enum и аннотации типов

Enum хорошо интегрируется с системой типов Python:

```python
from enum import Enum
from typing import Optional

class LogLevel(Enum):
    DEBUG = 10
    INFO = 20
    WARNING = 30
    ERROR = 40
    CRITICAL = 50

def log_message(message: str, level: LogLevel = LogLevel.INFO) -> None:
    print(f"[{level.name}] {message}")

def find_level(value: int) -> Optional[LogLevel]:
    try:
        return LogLevel(value)
    except ValueError:
        return None

log_message("Сервер запущен")                  # [INFO] Сервер запущен
log_message("Ошибка подключения", LogLevel.ERROR)  # [ERROR] Ошибка подключения

result = find_level(30)
print(result)  # LogLevel.WARNING
```

## Частые ошибки при работе с Enum

**Ошибка 1**: попытка изменить значение члена перечисления.

```python
class Status(Enum):
    ACTIVE = 1

# AttributeError — члены Enum неизменяемы
Status.ACTIVE = 2
```

**Ошибка 2**: сравнение с int без IntEnum.

```python
class Status(Enum):
    ACTIVE = 1

print(Status.ACTIVE == 1)  # False, не True!
# Используйте Status.ACTIVE.value == 1 или IntEnum
```

**Ошибка 3**: создание экземпляра перечисления через несуществующее значение без обработки ошибки.

```python
class Status(Enum):
    ACTIVE = 1

# Всегда оборачивайте в try/except при работе с внешними данными
try:
    s = Status(99)
except ValueError:
    s = Status.ACTIVE  # fallback
```

## Итог

Модуль `enum` — мощный инструмент Python для работы с фиксированными наборами значений. Основные возможности:

- `Enum` — базовый класс для перечислений с любыми значениями
- `IntEnum` и `StrEnum` — совместимы с числами и строками соответственно
- `Flag` и `IntFlag` — для комбинирования через побитовые операции
- `auto()` — автоматическая генерация значений
- `@unique` — защита от дублирующихся значений
- Возможность добавлять методы и свойства прямо в перечисление

Использование Enum делает код более читаемым, самодокументируемым и защищённым от ошибок по сравнению с «магическими» числами и строками.

Чтобы глубже освоить Python и научиться писать чистый, профессиональный код, приходите на курс [Python для разработчиков](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-enum) на PurpleSchool.