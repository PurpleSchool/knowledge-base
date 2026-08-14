---
metaTitle: "typing.Self и TypeAlias в Python — подробный разбор"
metaDescription: "Разбираем typing.Self и TypeAlias в Python 3.10–3.12: зачем нужны, как использовать в OOP, примеры с method chaining и Builder."
author: "Антон Ларичев"
title: "typing.Self и TypeAlias в Python"
preview: "Как typing.Self упрощает аннотации в классах и чем TypeAlias отличается от обычного присваивания типа."
---

## typing.Self и TypeAlias в Python

Начиная с Python 3.10 стандартная библиотека `typing` получила два важных дополнения — `TypeAlias` и `Self`. Оба они решают конкретные практические проблемы при аннотировании типов в объектно-ориентированном коде, и оба существенно улучшают читаемость и точность проверки типов в больших проектах.

## Проблема псевдонимов типов до TypeAlias

До Python 3.10 создать псевдоним типа можно было простым присваиванием:

```python
Vector = list[float]

def scale(factor: float, vector: Vector) -> Vector:
    return [factor * x for x in vector]
```

Это работало, но создавало неоднозначность: глядя на строку `Vector = list[float]`, невозможно сразу понять — это псевдоним типа или обычная переменная, которая хранит тип как значение. Статические анализаторы (mypy, pyright) справлялись с такими ситуациями по-разному, что приводило к расхождениям в поведении.

Проблема становилась ощутимее в сложных случаях:

```python
# Это псевдоним типа или переменная?
JsonValue = dict[str, int | str | list | None]

# А это что — псевдоним или вызов функции?
Callback = Callable[[int, str], None]
```

## TypeAlias: явное объявление псевдонима

`TypeAlias` появился в Python 3.10 (PEP 613) и делает намерение программиста явным:

```python
from typing import TypeAlias

Vector: TypeAlias = list[float]
JsonValue: TypeAlias = dict[str, int | str | list | None]
Callback: TypeAlias = Callable[[int, str], None]
```

Теперь любой инструмент (и любой читатель кода) однозначно понимает: это именно псевдоним типа, а не хранение типа в переменной.

### Практический пример с TypeAlias

Рассмотрим сервис для работы с конфигурациями:

```python
from typing import TypeAlias

# Без TypeAlias — неясно, что это
RawConfig = dict[str, str | int | bool | None]
ConfigKey = str
ConfigValue = str | int | bool | None

# С TypeAlias — намерение прозрачно
from typing import TypeAlias

RawConfig: TypeAlias = dict[str, str | int | bool | None]
ConfigKey: TypeAlias = str
ConfigValue: TypeAlias = str | int | bool | None


def get_value(config: RawConfig, key: ConfigKey) -> ConfigValue:
    return config.get(key)


def merge_configs(base: RawConfig, override: RawConfig) -> RawConfig:
    return {**base, **override}
```

### TypeAlias в Python 3.12: оператор type

В Python 3.12 появился специальный синтаксис `type`, который делает объявление псевдонимов ещё лаконичнее (PEP 695):

```python
# Python 3.12+
type Vector = list[float]
type JsonValue = dict[str, int | str | list | None]
type Matrix[T] = list[list[T]]  # поддерживает дженерики
```

Оператор `type` создаёт объект `TypeAliasType`, а не просто присваивает значение. Это позволяет использовать ленивое вычисление — тип вычисляется только при обращении к нему, что важно для рекурсивных определений:

```python
# Python 3.12+ — рекурсивный псевдоним без проблем
type JsonTree = dict[str, JsonTree | int | str | None]
```

До Python 3.12 аналогичное определение требовало использования `from __future__ import annotations` или строковых литералов.

### Когда использовать TypeAlias, а когда type

| Ситуация | Рекомендация |
|---|---|
| Python 3.10–3.11 | `TypeAlias` из `typing` |
| Python 3.12+ | оператор `type` |
| Рекурсивные псевдонимы | `type` (3.12+) или `from __future__ import annotations` |
| Дженерик-псевдонимы | `type Matrix[T] = ...` (3.12+) |

## Проблема аннотаций возвращаемых типов в классах

Перед тем как перейти к `Self`, рассмотрим классическую проблему метода, возвращающего `self`:

```python
class Builder:
    def set_name(self, name: str) -> "Builder":
        self._name = name
        return self

    def set_value(self, value: int) -> "Builder":
        self._value = value
        return self


class AdvancedBuilder(Builder):
    def set_extra(self, extra: str) -> "AdvancedBuilder":
        self._extra = extra
        return self
```

Проблема здесь в том, что `set_name` и `set_value` объявлены как возвращающие `Builder`, но при вызове на экземпляре `AdvancedBuilder` они возвращают `AdvancedBuilder`. Статический анализатор этого не знает:

```python
builder = AdvancedBuilder()
# mypy считает, что result имеет тип Builder, а не AdvancedBuilder
result = builder.set_name("test").set_value(42)
# Ошибка: Builder не имеет метода set_extra
result.set_extra("hello")  # type error!
```

Старый способ обойти это — `TypeVar`:

```python
from typing import TypeVar

TBuilder = TypeVar("TBuilder", bound="Builder")


class Builder:
    def set_name(self: TBuilder, name: str) -> TBuilder:
        self._name = name
        return self

    def set_value(self: TBuilder, value: int) -> TBuilder:
        self._value = value
        return self
```

Это работает, но требует дополнительного `TypeVar` и делает подпись метода громоздкой.

## typing.Self: элегантное решение

`Self` появился в Python 3.11 (PEP 673) и решает описанную проблему напрямую:

```python
from typing import Self


class Builder:
    def set_name(self, name: str) -> Self:
        self._name = name
        return self

    def set_value(self, value: int) -> Self:
        self._value = value
        return self


class AdvancedBuilder(Builder):
    def set_extra(self, extra: str) -> Self:
        self._extra = extra
        return self
```

Теперь статический анализатор знает, что `set_name`, вызванный на `AdvancedBuilder`, возвращает `AdvancedBuilder`:

```python
builder = AdvancedBuilder()
# result имеет тип AdvancedBuilder — всё корректно
result = builder.set_name("test").set_value(42).set_extra("hello")
```

Для Python 3.10 и ниже `Self` доступен через пакет `typing_extensions`:

```python
try:
    from typing import Self
except ImportError:
    from typing_extensions import Self
```

### Self в classmethod и staticmethod

`Self` особенно полезен в альтернативных конструкторах через `classmethod`:

```python
from typing import Self
from dataclasses import dataclass


@dataclass
class Point:
    x: float
    y: float

    @classmethod
    def from_tuple(cls, coords: tuple[float, float]) -> Self:
        return cls(*coords)

    @classmethod
    def origin(cls) -> Self:
        return cls(0.0, 0.0)

    def translate(self, dx: float, dy: float) -> Self:
        return type(self)(self.x + dx, self.y + dy)


@dataclass
class Point3D(Point):
    z: float

    @classmethod
    def from_tuple(cls, coords: tuple[float, float, float]) -> Self:  # type: ignore[override]
        return cls(*coords)
```

```python
p2d = Point.from_tuple((1.0, 2.0))   # тип: Point
p3d = Point3D.from_tuple((1.0, 2.0, 3.0))  # тип: Point3D
```

Без `Self` метод `origin` пришлось бы аннотировать как `-> Point`, и `Point3D.origin()` возвращал бы неверный тип по мнению анализатора.

### Self в протоколах и абстрактных классах

`Self` незаменим при описании интерфейсов через `Protocol`:

```python
from typing import Protocol, Self


class Cloneable(Protocol):
    def clone(self) -> Self:
        ...


class Configurable(Protocol):
    def with_timeout(self, seconds: float) -> Self:
        ...

    def with_retries(self, count: int) -> Self:
        ...


class HttpClient:
    def __init__(self) -> None:
        self._timeout = 30.0
        self._retries = 3

    def with_timeout(self, seconds: float) -> Self:
        client = type(self)()
        client._timeout = seconds
        client._retries = self._retries
        return client

    def with_retries(self, count: int) -> Self:
        client = type(self)()
        client._timeout = self._timeout
        client._retries = count
        return client
```

## Полный практический пример: Query Builder

Объединим оба инструмента в реалистичном примере:

```python
from typing import TypeAlias, Self

# Псевдонимы типов для читаемости
TableName: TypeAlias = str
ColumnName: TypeAlias = str
Condition: TypeAlias = str
OrderDirection: TypeAlias = str


class QueryBuilder:
    def __init__(self, table: TableName) -> None:
        self._table = table
        self._columns: list[ColumnName] = ["*"]
        self._conditions: list[Condition] = []
        self._order: list[tuple[ColumnName, OrderDirection]] = []
        self._limit: int | None = None

    def select(self, *columns: ColumnName) -> Self:
        self._columns = list(columns)
        return self

    def where(self, condition: Condition) -> Self:
        self._conditions.append(condition)
        return self

    def order_by(self, column: ColumnName, direction: OrderDirection = "ASC") -> Self:
        self._order.append((column, direction))
        return self

    def limit(self, n: int) -> Self:
        self._limit = n
        return self

    def build(self) -> str:
        query = f"SELECT {', '.join(self._columns)} FROM {self._table}"
        if self._conditions:
            query += " WHERE " + " AND ".join(self._conditions)
        if self._order:
            order_parts = [f"{col} {direction}" for col, direction in self._order]
            query += " ORDER BY " + ", ".join(order_parts)
        if self._limit is not None:
            query += f" LIMIT {self._limit}"
        return query


class JoinQueryBuilder(QueryBuilder):
    def __init__(self, table: TableName) -> None:
        super().__init__(table)
        self._joins: list[str] = []

    def join(self, table: TableName, on: Condition) -> Self:
        self._joins.append(f"JOIN {table} ON {on}")
        return self

    def build(self) -> str:
        query = f"SELECT {', '.join(self._columns)} FROM {self._table}"
        if self._joins:
            query += " " + " ".join(self._joins)
        if self._conditions:
            query += " WHERE " + " AND ".join(self._conditions)
        if self._order:
            order_parts = [f"{col} {direction}" for col, direction in self._order]
            query += " ORDER BY " + ", ".join(order_parts)
        if self._limit is not None:
            query += f" LIMIT {self._limit}"
        return query
```

Использование:

```python
# Простой запрос
query = (
    QueryBuilder("users")
    .select("id", "name", "email")
    .where("age > 18")
    .where("active = true")
    .order_by("name")
    .limit(10)
    .build()
)
# SELECT id, name, email FROM users WHERE age > 18 AND active = true ORDER BY name ASC LIMIT 10

# Запрос с JOIN — возвращает JoinQueryBuilder, а не QueryBuilder
join_query = (
    JoinQueryBuilder("orders")
    .join("users", "orders.user_id = users.id")  # тип: JoinQueryBuilder
    .select("orders.id", "users.name")
    .where("orders.total > 100")
    .order_by("orders.created_at", "DESC")
    .build()
)
```

Благодаря `Self` анализатор знает, что после вызова `.join()` на `JoinQueryBuilder` мы получаем именно `JoinQueryBuilder`, а не `QueryBuilder`, и дальнейшая цепочка вызовов остаётся корректно типизированной.

## Когда использовать Self, а когда TypeVar

`Self` покрывает большинство случаев, но есть ситуации, где `TypeVar` необходим:

```python
from typing import TypeVar

T = TypeVar("T")


class Container:
    # Self здесь НЕ подходит — метод принимает другой контейнер того же типа
    # но Self всегда означает "тот же класс, что и у self",
    # а здесь нам нужен TypeVar для параметризации содержимого
    def merge(self, other: "Container") -> "Container":
        ...
```

Правило простое:
- Используй `Self`, когда метод возвращает `self` или `cls(...)` — тот же экземпляр или новый экземпляр того же класса.
- Используй `TypeVar`, когда нужно связать несколько аргументов одного типа или параметризовать по содержимому.

## Итоги

`TypeAlias` и `Self` — небольшие, но важные улучшения системы типов Python:

- `TypeAlias` делает объявление псевдонимов типов явным и устраняет неоднозначность для анализаторов и читателей кода. В Python 3.12+ его заменяет лаконичный оператор `type`.
- `Self` устраняет необходимость в шаблонном коде с `TypeVar` при аннотировании методов, возвращающих экземпляр текущего класса. Он корректно работает с наследованием, `classmethod`, `Protocol` и абстрактными классами, что делает цепочки вызовов и паттерн Builder полностью типобезопасными.

Оба инструмента хорошо вписываются в современный Python-код и особенно ценны в командных проектах, где строгая типизация снижает количество ошибок и упрощает рефакторинг.

Чтобы глубже разобраться с системой типов и ООП в Python, приходите на курс — [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-typing-self-typealias).