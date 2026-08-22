---
metaTitle: "typing.Annotated в Python — метаданные для аннотаций типов"
metaDescription: "Что такое typing.Annotated в Python, как добавлять метаданные к аннотациям типов и использовать их в Pydantic, FastAPI и собственном коде."
author: "Антон Ларичев"
title: "typing.Annotated в Python"
preview: "Разбираемся с typing.Annotated — инструментом для добавления произвольных метаданных к аннотациям типов в Python."
---

## Что такое typing.Annotated

`typing.Annotated` — это специальная форма из модуля `typing`, появившаяся в Python 3.9 (PEP 593). Она позволяет прикрепить к аннотации типа произвольные метаданные, не изменяя семантику самого типа с точки зрения статических анализаторов.

До появления `Annotated` единственным способом передать дополнительную информацию вместе с типом были комментарии или отдельные словари конфигурации. Теперь метаданные живут прямо рядом с аннотацией и доступны во время исполнения через `typing.get_type_hints`.

## Синтаксис

Базовая форма выглядит так:

```python
from typing import Annotated

Annotated[тип, метаданные_1, метаданные_2, ...]
```

Первый аргумент — это сам тип. Все последующие аргументы — произвольные объекты, которые несут дополнительный смысл для инструментов, библиотек или вашего собственного кода.

Простой пример:

```python
from typing import Annotated

def process_age(age: Annotated[int, "must be positive"]) -> None:
    print(age)
```

Статический анализатор (mypy, pyright) видит здесь просто `int`. Строка `"must be positive"` полностью игнорируется с точки зрения проверки типов, но доступна во время выполнения.

## Доступ к метаданным во время выполнения

Метаданные хранятся в атрибуте `__metadata__` объекта `Annotated`, а сам тип — в `__origin__` и `__args__`.

```python
from typing import Annotated, get_type_hints, get_args, get_origin

def greet(name: Annotated[str, "non-empty", "max 50 chars"]) -> str:
    return f"Hello, {name}"

hints = get_type_hints(greet, include_extras=True)
print(hints["name"])
# Annotated[str, 'non-empty', 'max 50 chars']

annotated_type = hints["name"]
print(get_args(annotated_type))
# (str, 'non-empty', 'max 50 chars')

print(annotated_type.__metadata__)
# ('non-empty', 'max 50 chars')
```

Важная деталь: `get_type_hints` без флага `include_extras=True` удаляет `Annotated`-обёртку и возвращает голый тип. Передавайте этот флаг, когда метаданные нужны во время выполнения.

## Создание собственных валидаторов

Рассмотрим практический пример — написание простого декоратора, который читает метаданные из аннотаций и проверяет аргументы функции.

```python
from typing import Annotated, get_type_hints, get_args
from dataclasses import dataclass
import functools

@dataclass
class Gt:
    value: float

@dataclass
class Lt:
    value: float

@dataclass
class MaxLen:
    value: int

def validate(func):
    hints = get_type_hints(func, include_extras=True)

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        sig_params = list(func.__code__.co_varnames[:func.__code__.co_argcount])
        bound = dict(zip(sig_params, args))
        bound.update(kwargs)

        for param_name, annotated in hints.items():
            if param_name == "return":
                continue
            if not hasattr(annotated, "__metadata__"):
                continue
            value = bound.get(param_name)
            for meta in annotated.__metadata__:
                if isinstance(meta, Gt) and value <= meta.value:
                    raise ValueError(f"{param_name} must be > {meta.value}, got {value}")
                if isinstance(meta, Lt) and value >= meta.value:
                    raise ValueError(f"{param_name} must be < {meta.value}, got {value}")
                if isinstance(meta, MaxLen) and len(value) > meta.value:
                    raise ValueError(f"{param_name} length must be <= {meta.value}")

        return func(*args, **kwargs)

    return wrapper

@validate
def create_user(
    name: Annotated[str, MaxLen(50)],
    age: Annotated[int, Gt(0), Lt(150)],
) -> dict:
    return {"name": name, "age": age}

print(create_user("Alice", 30))
# {'name': 'Alice', 'age': 30}

create_user("Bob", -5)
# ValueError: age must be > 0, got -5
```

Этот паттерн — основа того, как работают Pydantic и FastAPI.

## Использование в Pydantic

Pydantic v2 активно использует `Annotated` для описания ограничений полей модели. Вместо `Field(...)` внутри аннотации поля можно использовать специальные аннотаторы.

```python
from typing import Annotated
from pydantic import BaseModel, Field
from pydantic.functional_validators import AfterValidator

def check_positive(v: int) -> int:
    if v <= 0:
        raise ValueError("must be positive")
    return v

PositiveInt = Annotated[int, AfterValidator(check_positive)]

class Product(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=100)]
    price: Annotated[float, Field(gt=0)]
    quantity: PositiveInt

p = Product(name="Widget", price=9.99, quantity=5)
print(p)
# name='Widget' price=9.99 quantity=5

Product(name="", price=9.99, quantity=5)
# ValidationError: name must have at least 1 character
```

Обратите внимание на `PositiveInt` — это псевдоним типа, созданный через `Annotated`. Его можно переиспользовать в нескольких моделях, избегая дублирования правил валидации.

## Использование в FastAPI

FastAPI использует `Annotated` для описания источников параметров запроса прямо в сигнатуре функции-обработчика.

```python
from typing import Annotated
from fastapi import FastAPI, Query, Path, Body
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.get("/items/{item_id}")
async def get_item(
    item_id: Annotated[int, Path(ge=1, description="ID товара")],
    q: Annotated[str | None, Query(max_length=50)] = None,
) -> dict:
    return {"item_id": item_id, "q": q}

@app.post("/items/")
async def create_item(
    item: Annotated[Item, Body(embed=True)],
) -> Item:
    return item
```

Благодаря `Annotated` конфигурация параметра (источник, ограничения, описание) находится рядом с самой аннотацией, а не вынесена в значение по умолчанию. Это делает сигнатуру функции более читаемой и даёт FastAPI полную информацию для автоматической генерации OpenAPI-схемы.

## Создание переиспользуемых типов-псевдонимов

Одно из главных преимуществ `Annotated` — возможность создавать именованные типы с уже встроенными ограничениями.

```python
from typing import Annotated
from pydantic import Field

# Переиспользуемые типы
Username = Annotated[str, Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")]
Email = Annotated[str, Field(pattern=r"^[\w.-]+@[\w.-]+\.\w+$")]
PositiveFloat = Annotated[float, Field(gt=0)]
Percentage = Annotated[float, Field(ge=0.0, le=100.0)]

from pydantic import BaseModel

class User(BaseModel):
    username: Username
    email: Email
    score: Percentage

class Product(BaseModel):
    sku: Username  # тот же тип переиспользуется
    discount: Percentage
    price: PositiveFloat
```

Такой подход централизует правила валидации: изменив `Username` в одном месте, вы автоматически обновляете правила во всех моделях.

## Annotated и TypeVar

`Annotated` корректно работает в сочетании с `TypeVar`, что позволяет создавать обобщённые аннотированные типы.

```python
from typing import Annotated, TypeVar, Generic

T = TypeVar("T")

class Positive:
    """Маркер: значение должно быть положительным."""

PositiveValue = Annotated[T, Positive()]

def double(x: PositiveValue[int]) -> int:
    return x * 2

print(double(5))   # 10
print(double(-1))  # работает без валидации — нужен отдельный декоратор
```

Здесь `PositiveValue[int]` разворачивается в `Annotated[int, Positive()]`. Это полезно при написании библиотечного кода, где конкретный тип заранее неизвестен.

## Вложенность и порядок метаданных

Аннотации `Annotated` можно вкладывать друг в друга — при этом метаданные объединяются слева направо.

```python
from typing import Annotated

Base = Annotated[int, "positive"]
Extended = Annotated[Base, "less than 100"]

print(Extended.__metadata__)
# ('positive', 'less than 100')
```

Вложенность позволяет наследовать базовые ограничения и добавлять к ним более специфичные, не дублируя общий контекст.

## Взаимодействие с dataclasses

`Annotated` отлично работает со стандартными датаклассами Python. Метаданные можно читать через `fields` из `dataclasses`.

```python
from typing import Annotated
from dataclasses import dataclass, fields

class Unit:
    def __init__(self, name: str):
        self.name = name

@dataclass
class Measurement:
    temperature: Annotated[float, Unit("celsius")]
    pressure: Annotated[float, Unit("pascal")]
    label: str

import typing

hints = typing.get_type_hints(Measurement, include_extras=True)
for field_name, hint in hints.items():
    if hasattr(hint, "__metadata__"):
        for meta in hint.__metadata__:
            if isinstance(meta, Unit):
                print(f"{field_name}: единица измерения = {meta.name}")

# temperature: единица измерения = celsius
# pressure: единица измерения = pascal
```

## Отличие от NewType

Часто возникает вопрос: когда использовать `Annotated`, а когда — `NewType`?

`NewType` создаёт отдельный тип в системе типов: статический анализатор не позволит передать `UserId` туда, где ожидается `int`, и наоборот. Это жёсткое разграничение.

```python
from typing import NewType

UserId = NewType("UserId", int)

def get_user(user_id: UserId) -> dict:
    return {}

get_user(42)        # mypy: ошибка — ожидается UserId, не int
get_user(UserId(42))  # корректно
```

`Annotated` не создаёт нового типа — с точки зрения статического анализатора `Annotated[int, ...]` это всё тот же `int`. Метаданные несут смысл только для инструментов, которые умеют их читать.

Выбор прост:
- Нужна изоляция на уровне системы типов — используйте `NewType`.
- Нужны метаданные для валидации, документации или другой обработки во время выполнения — используйте `Annotated`.

## Совместимость с Python 3.8

Если проект поддерживает Python 3.8, импортируйте `Annotated` из `typing_extensions`:

```python
try:
    from typing import Annotated  # Python 3.9+
except ImportError:
    from typing_extensions import Annotated  # Python 3.8
```

Библиотека `typing_extensions` доступна через pip и содержит бэкпорты новых возможностей системы типов Python.

## Итоговые рекомендации

Используйте `typing.Annotated`, когда:

- Хотите добавить правила валидации прямо к аннотации поля в Pydantic или FastAPI.
- Создаёте переиспользуемые типы-псевдонимы с встроенными ограничениями.
- Пишете библиотечный код, которому нужно читать метаданные аннотаций во время выполнения.
- Хотите хранить документирующую информацию (единицы измерения, источник данных, права доступа) рядом с самой аннотацией.

Не используйте `Annotated` как замену нормальной валидации на уровне кода или как способ обойти систему типов — метаданные действуют только тогда, когда вызывающий код явно их проверяет.

Подробнее о системе типов Python и работе с Pydantic и FastAPI вы можете узнать на курсе PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-typing-annotated