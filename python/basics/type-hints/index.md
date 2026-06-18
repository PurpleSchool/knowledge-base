---
metaTitle: "Аннотации типов в Python — полное руководство"
metaDescription: "Что такое Type Hints в Python, как использовать модуль typing, TypeVar, Protocol, TypedDict и проверять типы с помощью mypy."
author: "Антон Ларичев"
title: "Аннотации типов (Type Hints) в Python"
preview: "Разбираем аннотации типов в Python: синтаксис, модуль typing, generics, Protocol и статический анализ с mypy."
---

## Что такое аннотации типов

Python — язык с динамической типизацией: переменные не требуют объявления типа, а их тип определяется во время выполнения. Аннотации типов (Type Hints) — это необязательный механизм, добавленный в Python 3.5 (PEP 484), который позволяет явно указывать типы переменных, параметров функций и возвращаемых значений.

Аннотации не влияют на выполнение программы — интерпретатор Python их игнорирует. Их цель — улучшить читаемость кода, помочь IDE при автодополнении и дать статическим анализаторам (mypy, pyright, pylance) возможность находить ошибки ещё до запуска.

```python
# Без аннотаций
def add(a, b):
    return a + b

# С аннотациями
def add(a: int, b: int) -> int:
    return a + b
```

Второй вариант сразу сообщает читателю: функция принимает два целых числа и возвращает целое число.

## Базовый синтаксис

### Аннотации переменных

```python
name: str = "Alice"
age: int = 30
price: float = 9.99
is_active: bool = True
```

Аннотацию можно поставить даже без присвоения значения — это используется в классах:

```python
class User:
    id: int
    name: str
    email: str
```

### Аннотации параметров функций

Тип параметра указывается через двоеточие после имени:

```python
def greet(name: str, age: int) -> str:
    return f"Hello, {name}! You are {age} years old."
```

### Возвращаемый тип

Тип возвращаемого значения указывается через `->` перед двоеточием тела функции:

```python
def get_square(n: int) -> int:
    return n * n

def say_hello() -> None:
    print("Hello!")
```

`None` используется, когда функция ничего не возвращает (аналог `void` в других языках).

## Модуль typing

Для сложных типов используется стандартный модуль `typing`. Начиная с Python 3.9 и 3.10 многие конструкции доступны напрямую без импорта из `typing`, но для совместимости с Python 3.8 импорт всё ещё актуален.

### List, Dict, Tuple, Set

```python
from typing import List, Dict, Tuple, Set

def process_names(names: List[str]) -> None:
    for name in names:
        print(name)

def get_user_map() -> Dict[str, int]:
    return {"alice": 1, "bob": 2}

def get_coords() -> Tuple[float, float]:
    return (55.75, 37.61)

def unique_tags(tags: Set[str]) -> Set[str]:
    return tags
```

Начиная с Python 3.9 можно использовать встроенные типы напрямую:

```python
# Python 3.9+
def process_names(names: list[str]) -> None:
    for name in names:
        print(name)

def get_user_map() -> dict[str, int]:
    return {"alice": 1, "bob": 2}
```

### Optional

`Optional[X]` означает, что значение может быть либо `X`, либо `None`:

```python
from typing import Optional

def find_user(user_id: int) -> Optional[str]:
    users = {1: "Alice", 2: "Bob"}
    return users.get(user_id)
```

С Python 3.10 можно использовать оператор `|`:

```python
# Python 3.10+
def find_user(user_id: int) -> str | None:
    users = {1: "Alice", 2: "Bob"}
    return users.get(user_id)
```

### Union

`Union[X, Y]` означает, что значение может быть одного из нескольких типов:

```python
from typing import Union

def process_input(value: Union[int, str]) -> str:
    return str(value)

# Python 3.10+
def process_input(value: int | str) -> str:
    return str(value)
```

### Any

`Any` отключает проверку типов для конкретного значения — полезно при интеграции с нетипизированным кодом:

```python
from typing import Any

def log(data: Any) -> None:
    print(data)
```

Используйте `Any` осторожно: злоупотребление им нивелирует пользу от аннотаций.

## Callable

Для аннотирования функций как аргументов используется `Callable`:

```python
from typing import Callable

def apply(func: Callable[[int, int], int], a: int, b: int) -> int:
    return func(a, b)

def multiply(x: int, y: int) -> int:
    return x * y

result = apply(multiply, 3, 4)  # 12
```

`Callable[[int, int], int]` означает: функция принимает два `int` и возвращает `int`.

## TypeVar и обобщённые функции

`TypeVar` позволяет писать обобщённые (generic) функции, которые работают с любым типом, сохраняя при этом связь между входным и выходным типами:

```python
from typing import TypeVar, List

T = TypeVar("T")

def first(items: List[T]) -> T:
    return items[0]

name = first(["Alice", "Bob"])   # str
number = first([1, 2, 3])        # int
```

Статический анализатор понимает, что если передать `List[str]`, то вернётся `str`, а не `Any`.

## Аннотации в классах

### Обычные атрибуты

```python
class Product:
    name: str
    price: float
    in_stock: bool

    def __init__(self, name: str, price: float, in_stock: bool = True) -> None:
        self.name = name
        self.price = price
        self.in_stock = in_stock

    def apply_discount(self, percent: float) -> float:
        return self.price * (1 - percent / 100)
```

### ClassVar

`ClassVar` обозначает атрибут класса, а не экземпляра:

```python
from typing import ClassVar

class Config:
    MAX_RETRIES: ClassVar[int] = 3
    timeout: int

    def __init__(self, timeout: int) -> None:
        self.timeout = timeout
```

### dataclasses

Аннотации типов особенно удобны с `dataclasses` — они заменяют ручное написание `__init__`:

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: int
    name: str
    email: str
    age: Optional[int] = None

user = User(id=1, name="Alice", email="alice@example.com")
```

## TypedDict

`TypedDict` позволяет описать структуру словаря с конкретными ключами и типами значений:

```python
from typing import TypedDict

class Movie(TypedDict):
    title: str
    year: int
    rating: float

def print_movie(movie: Movie) -> None:
    print(f"{movie['title']} ({movie['year']}) — {movie['rating']}")

film: Movie = {"title": "Inception", "year": 2010, "rating": 8.8}
print_movie(film)
```

Это удобнее, чем `Dict[str, Any]`, потому что анализатор проверяет конкретные ключи и их типы.

## Protocol — структурная типизация

`Protocol` позволяет описывать интерфейсы без наследования (утиная типизация с проверкой типов):

```python
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None:
        ...

class Circle:
    def draw(self) -> None:
        print("Drawing circle")

class Square:
    def draw(self) -> None:
        print("Drawing square")

def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())  # OK
render(Square())  # OK
```

`Circle` и `Square` не наследуют `Drawable`, но удовлетворяют протоколу, потому что реализуют метод `draw`. Это ключевое отличие от абстрактных базовых классов.

## Literal и Final

### Literal

`Literal` ограничивает значения конкретным набором:

```python
from typing import Literal

def set_direction(direction: Literal["left", "right", "up", "down"]) -> None:
    print(f"Moving {direction}")

set_direction("left")      # OK
set_direction("diagonal")  # Ошибка при статическом анализе
```

### Final

`Final` указывает, что значение не должно переопределяться:

```python
from typing import Final

MAX_SIZE: Final = 100
API_VERSION: Final[str] = "v2"
```

## Проверка типов с mypy

Аннотации сами по себе не защищают от ошибок — для этого нужен статический анализатор. Самый популярный — `mypy`.

Установка:

```bash
pip install mypy
```

Проверка файла:

```bash
mypy main.py
```

Пример обнаружения ошибки:

```python
# main.py
def greet(name: str) -> str:
    return "Hello, " + name

greet(123)  # mypy сообщит об ошибке
```

```
main.py:4: error: Argument 1 to "greet" has incompatible type "int"; expected "str"
```

Настройка через `mypy.ini`:

```ini
[mypy]
python_version = 3.11
strict = True
ignore_missing_imports = True
```

Флаг `strict` включает наиболее строгие проверки, в том числе запрет на неявный `Any` и требование аннотаций для всех публичных функций.

## Отложенные аннотации

Иногда тип ссылается на класс, который ещё не объявлен. Это решается строковой аннотацией или директивой `from __future__ import annotations`:

```python
from __future__ import annotations

class Node:
    def __init__(self, value: int, next: Node | None = None) -> None:
        self.value = value
        self.next = next
```

Без этого импорта Python выдал бы `NameError`, потому что `Node` ещё не определён в момент разбора аннотации. Директива переводит все аннотации в строковый режим и откладывает их вычисление.

## Практический пример: сервис обработки заказов

```python
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional, Callable, TypedDict

class OrderItem(TypedDict):
    product_id: int
    quantity: int
    unit_price: float

@dataclass
class Order:
    order_id: int
    customer_name: str
    items: list[OrderItem] = field(default_factory=list)
    discount: float = 0.0

    def total(self) -> float:
        subtotal = sum(item["quantity"] * item["unit_price"] for item in self.items)
        return subtotal * (1 - self.discount)

    def add_item(self, item: OrderItem) -> None:
        self.items.append(item)

ApplyDiscount = Callable[[Order, float], None]

def apply_promo(order: Order, percent: float) -> None:
    order.discount = percent / 100

def process_orders(
    orders: list[Order],
    discount_fn: Optional[ApplyDiscount] = None,
) -> dict[int, float]:
    result: dict[int, float] = {}
    for order in orders:
        if discount_fn:
            discount_fn(order, 10.0)
        result[order.order_id] = order.total()
    return result
```

Здесь аннотации документируют контракт каждого компонента: что принимает `process_orders`, что возвращает `total`, каков формат `OrderItem`. Разработчик, открывший этот файл впервые, мгновенно понимает структуру данных без чтения реализации.

## Итого

Аннотации типов в Python — это инструмент, который делает код самодокументируемым, помогает IDE предлагать корректное автодополнение и позволяет находить ошибки до запуска программы. Ключевые конструкции:

- Базовые типы (`int`, `str`, `float`, `bool`, `None`) — для простых случаев
- `list`, `dict`, `tuple`, `set` — для коллекций (Python 3.9+)
- `Optional` / `X | None` — для значений, которые могут отсутствовать
- `Union` / `X | Y` — для значений нескольких типов
- `TypeVar` — для обобщённых функций
- `Protocol` — для структурной типизации без наследования
- `TypedDict` — для типизированных словарей
- `Literal` и `Final` — для ограничения значений и констант
- `mypy` — для статической проверки

Начните с аннотирования публичных функций и методов — это даст максимальную пользу при минимальных усилиях. Постепенно добавляйте `strict = True` в конфигурацию mypy и следите за отчётами анализатора.

Подробнее про Python и написание production-кода на нём — на курсе [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-type-hints).