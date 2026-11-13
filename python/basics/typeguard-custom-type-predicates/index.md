---
metaTitle: "Python TypeGuard: пользовательские предикаты типов"
metaDescription: "Как использовать TypeGuard в Python для создания пользовательских предикатов типов, сужения типов и улучшения статической проверки кода."
author: "Антон Ларичев"
title: "TypeGuard: пользовательские предикаты типов в Python"
preview: "TypeGuard позволяет создавать собственные функции-предикаты, которые сообщают статическому анализатору, как сузить тип переменной после проверки."
---

## Что такое TypeGuard

`TypeGuard` — это специальная аннотация из модуля `typing`, появившаяся в Python 3.10 (PEP 647). Она позволяет создавать пользовательские функции-предикаты, которые не просто возвращают `bool`, а сообщают статическому анализатору (mypy, pyright, pylance), что после успешной проверки переменная имеет более конкретный тип.

Без `TypeGuard` анализатор не умеет «заглядывать внутрь» произвольной функции-проверки и не может автоматически сузить тип. `TypeGuard` решает эту проблему явно.

```python
from typing import TypeGuard
```

Для Python 3.9 и ниже используйте `typing_extensions`:

```python
from typing_extensions import TypeGuard
```

## Проблема без TypeGuard

Рассмотрим ситуацию, когда у нас есть список с элементами разных типов и мы хотим отфильтровать только строки:

```python
from typing import Union

def is_string(value: object) -> bool:
    return isinstance(value, str)

values: list[Union[str, int, None]] = ["hello", 42, None, "world"]

for item in values:
    if is_string(item):
        # Ошибка анализатора: item всё ещё имеет тип str | int | None
        print(item.upper())  # mypy: Item "int" of "str | int | None" has no attribute "upper"
```

Анализатор не знает, что `is_string` проверяет именно тип `str`. Он видит обычную функцию, возвращающую `bool`, и не сужает тип.

## Решение с TypeGuard

Добавим `TypeGuard[str]` как возвращаемый тип:

```python
from typing import TypeGuard, Union

def is_string(value: object) -> TypeGuard[str]:
    return isinstance(value, str)

values: list[Union[str, int, None]] = ["hello", 42, None, "world"]

for item in values:
    if is_string(item):
        # Теперь анализатор знает: item имеет тип str
        print(item.upper())  # OK
```

Когда `is_string(item)` возвращает `True`, статический анализатор сужает тип `item` до `str` внутри блока `if`.

## Синтаксис TypeGuard

Функция-предикат с `TypeGuard` должна:

- Возвращать `TypeGuard[T]`, где `T` — тип, до которого нужно сузить
- Принимать хотя бы один аргумент (проверяемое значение)
- Фактически возвращать `bool` во время выполнения

```python
from typing import TypeGuard

# Общий шаблон
def is_some_type(value: object) -> TypeGuard[SomeType]:
    # логика проверки
    return isinstance(value, SomeType)
```

Первый параметр функции — это тот аргумент, тип которого будет сужен. Остальные параметры могут быть любыми.

## Практические примеры

### Проверка пользовательского класса

```python
from typing import TypeGuard, Union
from dataclasses import dataclass

@dataclass
class User:
    name: str
    email: str

@dataclass
class Guest:
    session_id: str

Visitor = Union[User, Guest]

def is_user(visitor: Visitor) -> TypeGuard[User]:
    return isinstance(visitor, User)

def greet(visitor: Visitor) -> str:
    if is_user(visitor):
        return f"Привет, {visitor.name}!"  # visitor: User
    return f"Привет, гость {visitor.session_id}!"  # visitor: Guest
```

### Проверка структуры словаря

Один из самых полезных случаев — валидация данных из внешних источников (JSON, API):

```python
from typing import TypeGuard, Any

class UserDict:
    name: str
    age: int
    email: str

def is_user_dict(data: Any) -> TypeGuard[dict[str, Any]]:
    return (
        isinstance(data, dict)
        and isinstance(data.get("name"), str)
        and isinstance(data.get("age"), int)
        and isinstance(data.get("email"), str)
    )

import json

raw = json.loads('{"name": "Иван", "age": 30, "email": "ivan@example.com"}')

if is_user_dict(raw):
    # raw: dict[str, Any]
    print(raw["name"].upper())  # OK
```

### Фильтрация списка с filter()

`TypeGuard` хорошо работает со встроенной функцией `filter`:

```python
from typing import TypeGuard, Union

def is_not_none(value: Union[str, None]) -> TypeGuard[str]:
    return value is not None

raw_values: list[Union[str, None]] = ["apple", None, "banana", None, "cherry"]

# Тип результата: filter[str], а не filter[str | None]
filtered = filter(is_not_none, raw_values)
result: list[str] = list(filtered)

print(result)  # ['apple', 'banana', 'cherry']
```

Без `TypeGuard` тип `result` был бы `list[str | None]`, и обращение к строковым методам потребовало бы дополнительных проверок.

### Обобщённые предикаты с Generic

Можно создавать типобезопасные обобщённые предикаты:

```python
from typing import TypeGuard, TypeVar, Type

T = TypeVar("T")

def is_instance_of(value: object, type_: Type[T]) -> TypeGuard[T]:
    return isinstance(value, type_)

values: list[object] = [1, "hello", 3.14, "world", True]

for v in values:
    if is_instance_of(v, str):
        print(v.upper())  # v: str, OK
```

## TypeGuard и метод класса

`TypeGuard` можно использовать в методах класса, включая `classmethod` и `staticmethod`:

```python
from typing import TypeGuard
from dataclasses import dataclass

@dataclass
class Response:
    status: int
    data: dict | None
    error: str | None

    @staticmethod
    def is_success(response: "Response") -> TypeGuard["SuccessResponse"]:
        return response.status == 200 and response.data is not None

@dataclass
class SuccessResponse:
    status: int
    data: dict
    error: None = None

def handle(response: Response) -> None:
    if Response.is_success(response):
        print(response.data)  # response: SuccessResponse
```

## Ограничения TypeGuard

### Односторонность проверки

`TypeGuard` влияет только на ветку `True`. В ветке `else` тип **не** сужается автоматически:

```python
from typing import TypeGuard, Union

def is_str(v: Union[str, int]) -> TypeGuard[str]:
    return isinstance(v, str)

value: Union[str, int] = get_value()

if is_str(value):
    reveal_type(value)  # str
else:
    reveal_type(value)  # str | int  (НЕ int!)
```

Это принципиальное отличие от встроенного `isinstance`, который сужает тип в обеих ветках. Начиная с Python 3.13, для двусторонних предикатов введён `TypeIs` (PEP 742).

### TypeGuard не гарантирует корректность

Анализатор доверяет вашей реализации. Если предикат написан неправильно, ошибки типов будут скрыты:

```python
from typing import TypeGuard

# Некорректная реализация — анализатор не заметит
def is_str(v: object) -> TypeGuard[str]:
    return True  # Всегда True — опасно!

value: int = 42
if is_str(value):
    value.upper()  # Анализатор не протестует, но RuntimeError в рантайме
```

### Первый аргумент — всегда проверяемый

Сузить можно только тип **первого позиционного аргумента**. Остальные параметры на сужение не влияют:

```python
from typing import TypeGuard, Union

# Сужается тип первого аргумента `value`
def check(value: Union[str, int], strict: bool = False) -> TypeGuard[str]:
    if strict:
        return isinstance(value, str) and len(value) > 0
    return isinstance(value, str)
```

## TypeIs в Python 3.13

Python 3.13 добавил `TypeIs` (PEP 742) — улучшенную версию `TypeGuard`. Главное отличие: `TypeIs` сужает тип в **обеих** ветках ветвления, а не только в `True`:

```python
from typing import TypeIs  # Python 3.13+

def is_str(v: str | int) -> TypeIs[str]:
    return isinstance(v, str)

value: str | int = get_value()

if is_str(value):
    reveal_type(value)  # str
else:
    reveal_type(value)  # int  (автоматически!)
```

Для Python < 3.13 `TypeIs` доступен через `typing_extensions`.

## Когда использовать TypeGuard

`TypeGuard` нужен, когда:

- Встроенного `isinstance` недостаточно (проверка структуры, нескольких условий)
- Нужно проверить `TypedDict` или сложную вложенную структуру
- Вы парсите данные из JSON, конфигурации или API и хотите типобезопасный результат
- Нужно использовать предикат в `filter()`, `any()`, `all()` с сохранением типов

Используйте обычный `isinstance`, когда это возможно — он понятнее и работает двусторонне. `TypeGuard` — для случаев, которые `isinstance` не покрывает.

## Итог

`TypeGuard[T]` — это контракт между вашим кодом и статическим анализатором: «если эта функция вернула `True`, значит переменная имеет тип `T`». Это позволяет вынести сложную логику проверки типов в отдельные переиспользуемые функции без потери типобезопасности.

Ключевые моменты:
- `TypeGuard` доступен с Python 3.10, для старых версий — `typing_extensions`
- Сужает тип только в ветке `True`
- Анализатор доверяет реализации, корректность на вашей ответственности
- В Python 3.13 появился `TypeIs` для двустороннего сужения

Чтобы глубже разобраться с системой типов Python и писать надёжный, хорошо аннотированный код, приходите на курс [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-typeguard).