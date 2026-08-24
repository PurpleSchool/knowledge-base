---
metaTitle: "Python attrs: создание классов с атрибутами"
metaDescription: "Библиотека attrs в Python: декораторы @define и @attrs, валидаторы, конвертеры, сравнение с dataclasses. Практические примеры."
author: "Антон Ларичев"
title: "attrs: современные классы в Python без лишнего кода"
preview: "attrs — библиотека Python для создания классов с автоматической генерацией __init__, __repr__, __eq__ и встроенной валидацией атрибутов."
---

## Что такое attrs

`attrs` — сторонняя библиотека Python, которая позволяет описывать классы декларативно: вы перечисляете атрибуты и их свойства, а библиотека сама генерирует `__init__`, `__repr__`, `__eq__`, `__hash__` и другие методы. Это экономит сотни строк шаблонного кода и уменьшает вероятность ошибок.

Библиотека появилась в 2015 году и послужила вдохновением для стандартных `dataclasses`, добавленных в Python 3.7. Однако `attrs` предлагает значительно больше возможностей: встроенную валидацию, конвертеры, слоты, заморозку объектов и тонкую настройку поведения.

## Установка

```bash
pip install attrs
```

Библиотека поставляется в двух интерфейсах:

- `attrs` — современный, рекомендуемый (модуль `attrs`)
- `attr` — устаревший, обратно совместимый (модуль `attr`)

В новом коде используйте `attrs`.

## Базовый пример

### Класс без attrs

Посмотрим на типичный класс данных без библиотек:

```python
class User:
    def __init__(self, name: str, age: int, email: str):
        self.name = name
        self.age = age
        self.email = email

    def __repr__(self):
        return f"User(name={self.name!r}, age={self.age!r}, email={self.email!r})"

    def __eq__(self, other):
        if not isinstance(other, User):
            return NotImplemented
        return (self.name, self.age, self.email) == (other.name, other.age, other.email)
```

Это 15 строк и ни строчки логики — только шаблон.

### Тот же класс с attrs

```python
import attrs

@attrs.define
class User:
    name: str
    age: int
    email: str
```

Три строки тела класса заменяют весь шаблон. `@attrs.define` автоматически генерирует `__init__`, `__repr__`, `__eq__` и настраивает слоты (`__slots__`).

```python
user = User(name="Alice", age=30, email="alice@example.com")
print(user)  # User(name='Alice', age=30, email='alice@example.com')

user2 = User(name="Alice", age=30, email="alice@example.com")
print(user == user2)  # True
```

## Декораторы: @attrs.define vs @attr.s

Существует два поколения декораторов:

| Декоратор | Поколение | Рекомендуется |
|---|---|---|
| `@attrs.define` | Новое (attrs 20.1+) | Да |
| `@attrs.mutable` | Псевдоним для `@attrs.define` | Да |
| `@attrs.frozen` | Неизменяемый класс | Да |
| `@attr.s` | Старое | Нет |
| `@attr.attrs` | Псевдоним `@attr.s` | Нет |

В новом коде всегда используйте `@attrs.define` или `@attrs.frozen`.

## Описание полей с attrs.field

Чтобы задать дополнительные параметры для атрибута, используйте `attrs.field()`:

```python
import attrs

@attrs.define
class Product:
    name: str
    price: float
    quantity: int = attrs.field(default=0)
    tags: list[str] = attrs.field(factory=list)
    _internal_id: int = attrs.field(init=False, default=0)
```

### Основные параметры field()

```python
import attrs

@attrs.define
class Config:
    host: str = attrs.field(default="localhost")
    port: int = attrs.field(default=8080)
    timeout: float = attrs.field(default=30.0)
    tags: list = attrs.field(factory=list)       # изменяемый default
    options: dict = attrs.field(factory=dict)    # изменяемый default
    debug: bool = attrs.field(default=False, repr=False)  # скрыть из repr
    _secret: str = attrs.field(default="", alias="secret")  # alias для __init__
```

Важно: для изменяемых значений по умолчанию (списки, словари) всегда используйте `factory`, а не `default`. Это предотвращает классическую ошибку с общим изменяемым объектом.

## Валидаторы

Валидаторы проверяют значения при создании объекта и при изменении (если класс изменяемый).

### Встроенные валидаторы

```python
import attrs

@attrs.define
class User:
    name: str = attrs.field(
        validator=attrs.validators.instance_of(str)
    )
    age: int = attrs.field(
        validator=[
            attrs.validators.instance_of(int),
            attrs.validators.ge(0),    # greater or equal
            attrs.validators.le(150),  # less or equal
        ]
    )
    email: str = attrs.field(
        validator=attrs.validators.matches_re(
            r"^[\w.-]+@[\w.-]+\.\w+$"
        )
    )
```

Перечень встроенных валидаторов:

- `instance_of(type)` — проверка типа
- `in_(collection)` — значение входит в набор
- `not_(validator)` — инверсия
- `and_(*validators)` — все условия
- `or_(*validators)` — хотя бы одно условие
- `ge(val)`, `gt(val)`, `le(val)`, `lt(val)` — числовые сравнения
- `max_len(n)`, `min_len(n)` — длина последовательности
- `matches_re(pattern)` — регулярное выражение
- `deep_iterable(...)` — рекурсивная проверка элементов
- `deep_mapping(...)` — рекурсивная проверка словаря
- `is_callable()` — значение вызываемо
- `optional(validator)` — разрешает None

### Пользовательский валидатор

```python
import attrs

def positive_price(instance, attribute, value):
    if value <= 0:
        raise ValueError(
            f"Цена должна быть положительной, получено: {value}"
        )

@attrs.define
class Product:
    name: str
    price: float = attrs.field(validator=positive_price)

try:
    p = Product(name="Widget", price=-10.0)
except ValueError as e:
    print(e)  # Цена должна быть положительной, получено: -10.0
```

Валидатор получает три аргумента: экземпляр класса (`instance`), объект атрибута (`attribute`) и проверяемое значение (`value`).

Можно также использовать декоратор:

```python
import attrs

@attrs.define
class BankAccount:
    balance: float = attrs.field(default=0.0)

    @balance.validator
    def check_balance(self, attribute, value):
        if value < 0:
            raise ValueError("Баланс не может быть отрицательным")
```

## Конвертеры

Конвертеры автоматически преобразуют входные значения перед сохранением:

```python
import attrs

@attrs.define
class Person:
    name: str = attrs.field(converter=str.strip)
    age: int = attrs.field(converter=int)
    tags: list[str] = attrs.field(
        converter=lambda v: [t.lower() for t in v]
    )

p = Person(name="  Alice  ", age="25", tags=["Python", "DJANGO"])
print(p.name)   # 'Alice'
print(p.age)    # 25 (int, не строка)
print(p.tags)   # ['python', 'django']
```

Конвертеры выполняются до валидаторов, поэтому тип будет уже нужным к моменту проверки.

## Заморозка объектов: @attrs.frozen

Для создания неизменяемых объектов используйте `@attrs.frozen`. Попытка изменить атрибут вызовет `FrozenInstanceError`:

```python
import attrs

@attrs.frozen
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
try:
    p.x = 3.0
except attrs.exceptions.FrozenInstanceError:
    print("Нельзя изменить замороженный объект")
```

Для создания модифицированной копии используйте `attrs.evolve`:

```python
p2 = attrs.evolve(p, x=5.0)
print(p2)  # Point(x=5.0, y=2.0)
print(p)   # Point(x=1.0, y=2.0)  — оригинал не изменён
```

## Слоты и производительность

`@attrs.define` по умолчанию использует `__slots__`, что даёт:

- Меньший расход памяти (нет словаря `__dict__`)
- Более быстрый доступ к атрибутам
- Защиту от опечаток: нельзя присвоить несуществующий атрибут

```python
import attrs

@attrs.define
class Vector:
    x: float
    y: float

v = Vector(1.0, 2.0)
try:
    v.z = 3.0  # AttributeError: 'Vector' object has no attribute 'z'
except AttributeError as e:
    print(e)
```

Если слоты мешают (например, при использовании `__dict__` или динамических атрибутов), отключите их:

```python
@attrs.define(slots=False)
class FlexibleClass:
    value: int
```

## Хук __attrs_post_init__

Для пост-инициализационной логики определите метод `__attrs_post_init__`:

```python
import attrs
import math

@attrs.define
class Circle:
    radius: float
    area: float = attrs.field(init=False)
    circumference: float = attrs.field(init=False)

    def __attrs_post_init__(self):
        self.area = math.pi * self.radius ** 2
        self.circumference = 2 * math.pi * self.radius

c = Circle(radius=5.0)
print(f"Площадь: {c.area:.2f}")        # Площадь: 78.54
print(f"Длина окружности: {c.circumference:.2f}")  # Длина окружности: 31.42
```

## Сериализация: asdict и astuple

```python
import attrs

@attrs.define
class Address:
    street: str
    city: str
    country: str

@attrs.define
class User:
    name: str
    age: int
    address: Address

user = User(
    name="Alice",
    age=30,
    address=Address("Ленина 1", "Москва", "Россия")
)

# Конвертация в словарь (рекурсивная)
data = attrs.asdict(user)
print(data)
# {
#   'name': 'Alice',
#   'age': 30,
#   'address': {'street': 'Ленина 1', 'city': 'Москва', 'country': 'Россия'}
# }

# Конвертация в кортеж (рекурсивная)
tuple_data = attrs.astuple(user)
print(tuple_data)  # ('Alice', 30, ('Ленина 1', 'Москва', 'Россия'))
```

`asdict` удобно использовать для сериализации в JSON:

```python
import json

json_str = json.dumps(attrs.asdict(user), ensure_ascii=False)
print(json_str)
```

## Интроспекция классов

```python
import attrs

@attrs.define
class Config:
    host: str = "localhost"
    port: int = 8080
    debug: bool = False

# Получить список полей
fields = attrs.fields(Config)
for field in fields:
    print(f"{field.name}: {field.type} = {field.default}")

# Проверить, является ли класс attrs-классом
print(attrs.has(Config))   # True
print(attrs.has(dict))     # False
```

## Наследование

```python
import attrs

@attrs.define
class Animal:
    name: str
    sound: str

@attrs.define
class Dog(Animal):
    breed: str
    sound: str = "Woof"  # переопределение default

d = Dog(name="Rex", breed="Labrador")
print(d)  # Dog(name='Rex', sound='Woof', breed='Labrador')
```

При наследовании поля родительского класса идут первыми. Если родительское поле имеет `default`, а дочернее нет, возникнет `TypeError`. Чтобы избежать этого, либо задайте `default` для всех дочерних полей, либо используйте `kw_only=True`:

```python
@attrs.define
class ExtendedDog(Dog):
    age: int = attrs.field(kw_only=True)

d = ExtendedDog(name="Rex", breed="Labrador", age=3)
```

## Сравнение с dataclasses

| Возможность | attrs | dataclasses |
|---|---|---|
| Генерация `__init__`, `__repr__`, `__eq__` | Да | Да |
| Встроенные валидаторы | Да | Нет |
| Конвертеры | Да | Нет |
| `__slots__` по умолчанию | Да | Нет |
| `attrs.evolve` | Да | `dataclasses.replace` |
| `attrs.asdict` | Да | `dataclasses.asdict` |
| Поддержка Python 2 | Нет (с 21.3) | Нет (Python 3.7+) |
| Зависимость | Сторонняя | Стандартная библиотека |
| Производительность | Выше | Ниже |

Выбирайте `dataclasses` если хотите нулевых зависимостей. Выбирайте `attrs` если нужны валидация, конвертеры или максимальная производительность.

## Практический пример: модель заказа

```python
import attrs
from datetime import datetime
from enum import Enum

class OrderStatus(Enum):
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

@attrs.define
class OrderItem:
    product_id: str
    quantity: int = attrs.field(
        validator=attrs.validators.and_(
            attrs.validators.instance_of(int),
            attrs.validators.gt(0)
        )
    )
    unit_price: float = attrs.field(
        validator=attrs.validators.gt(0)
    )
    total: float = attrs.field(init=False)

    def __attrs_post_init__(self):
        self.total = self.quantity * self.unit_price

@attrs.define
class Order:
    order_id: str
    customer_email: str = attrs.field(
        validator=attrs.validators.matches_re(
            r"^[\w.-]+@[\w.-]+\.\w+$"
        )
    )
    items: list[OrderItem] = attrs.field(factory=list)
    status: OrderStatus = attrs.field(default=OrderStatus.PENDING)
    created_at: datetime = attrs.field(factory=datetime.utcnow)
    total: float = attrs.field(init=False, default=0.0)

    def __attrs_post_init__(self):
        self.total = sum(item.total for item in self.items)

    def add_item(self, item: OrderItem) -> "Order":
        new_items = self.items + [item]
        new_total = sum(i.total for i in new_items)
        return attrs.evolve(self, items=new_items, total=new_total)

# Использование
order = Order(
    order_id="ORD-001",
    customer_email="alice@example.com",
    items=[
        OrderItem(product_id="P1", quantity=2, unit_price=499.99),
        OrderItem(product_id="P2", quantity=1, unit_price=1299.00),
    ]
)

print(f"Заказ {order.order_id}: {order.total:.2f} руб.")
# Заказ ORD-001: 2298.98 руб.

# Добавить товар без мутации
updated_order = order.add_item(
    OrderItem(product_id="P3", quantity=3, unit_price=99.50)
)
print(f"Обновлённый заказ: {updated_order.total:.2f} руб.")
# Обновлённый заказ: 2597.48 руб.

# Сериализация
import json
order_dict = attrs.asdict(order)
order_dict["status"] = order.status.value
order_dict["created_at"] = order.created_at.isoformat()
```

## Итог

`attrs` решает одну задачу исключительно хорошо — описание классов данных без шаблонного кода. Ключевые преимущества:

- Декларативный стиль уменьшает ошибки и улучшает читаемость
- Встроенные валидаторы защищают от некорректных данных прямо при создании объектов
- Конвертеры автоматизируют нормализацию входных данных
- `__slots__` по умолчанию снижает потребление памяти
- `attrs.evolve` позволяет безопасно создавать изменённые копии

Библиотека хорошо подходит для доменных моделей, конфигурационных объектов, DTO и Value Objects в архитектурах DDD.

Подробнее о проектировании классов и ООП в Python вы можете узнать на курсе PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-attrs