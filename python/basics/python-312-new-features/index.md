---
metaTitle: "Python 3.12: новые возможности и синтаксис"
metaDescription: "Разбираем ключевые нововведения Python 3.12: новый синтаксис обобщённых типов, улучшения f-строк, декоратор @override и многое другое."
author: "Антон Ларичев"
title: "Python 3.12: новые возможности и синтаксис"
preview: "Обзор главных нововведений Python 3.12: PEP 695, улучшения f-строк, @override, новые методы pathlib и улучшенные сообщения об ошибках."
---

## Что нового в Python 3.12

Python 3.12 вышел в октябре 2023 года и принёс ряд значительных улучшений: новый синтаксис для обобщённых типов, расширенные возможности f-строк, улучшенные сообщения об ошибках и новые инструменты для работы с типами. В этой статье разберём каждое нововведение с практическими примерами.

## Новый синтаксис обобщённых типов (PEP 695)

Одно из самых заметных изменений — новый способ объявления обобщённых (generic) функций, классов и псевдонимов типов. До Python 3.12 для этого требовалось импортировать `TypeVar` из модуля `typing` и явно передавать его в `Generic`.

### Как было до Python 3.12

```python
from typing import TypeVar, Generic

T = TypeVar("T")
K = TypeVar("K")
V = TypeVar("V")


class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()


def first(items: list[T]) -> T:
    return items[0]


def zip_dicts(keys: list[K], values: list[V]) -> dict[K, V]:
    return dict(zip(keys, values))
```

### Новый синтаксис в Python 3.12

```python
class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()


def first[T](items: list[T]) -> T:
    return items[0]


def zip_dicts[K, V](keys: list[K], values: list[V]) -> dict[K, V]:
    return dict(zip(keys, values))
```

Теперь переменные типа объявляются прямо в угловых скобках — импортировать `TypeVar` и `Generic` больше не нужно. Код становится компактнее и читается естественнее.

### Оператор type для псевдонимов типов

PEP 695 также вводит новый оператор `type` для создания псевдонимов типов:

```python
# До Python 3.12
from typing import TypeAlias

Vector: TypeAlias = list[float]
Matrix: TypeAlias = list[list[float]]

# Python 3.12
type Vector = list[float]
type Matrix = list[list[float]]

# Обобщённый псевдоним
type Pair[T] = tuple[T, T]
type Callback[T] = callable[[T], None]
```

Псевдонимы через `type` вычисляются лениво (lazy evaluation), что позволяет создавать рекурсивные определения:

```python
type Tree[T] = T | list["Tree[T]"]

def flatten(tree: Tree[int]) -> list[int]:
    if isinstance(tree, list):
        result = []
        for item in tree:
            result.extend(flatten(item))
        return result
    return [tree]

print(flatten([1, [2, [3, 4]], 5]))  # [1, 2, 3, 4, 5]
```

### Ограничения и протоколы для TypeVar

При новом синтаксисе можно задавать ограничения и bound прямо в объявлении:

```python
from typing import Protocol


class Comparable(Protocol):
    def __lt__(self, other: "Comparable") -> bool: ...


# Ограничение: T должен реализовывать Comparable
def max_value[T: Comparable](items: list[T]) -> T:
    return max(items)


# Ограничение набором типов
def to_string[T: (int, float, str)](value: T) -> str:
    return str(value)
```

## Улучшения f-строк (PEP 701)

F-строки существуют с Python 3.6, но в 3.12 их парсер был полностью переписан, что сняло ряд ограничений.

### Вложенные кавычки

Раньше кавычки внутри f-строки не могли совпадать с внешними. Теперь это ограничение снято:

```python
# До Python 3.12 — нужно было менять кавычки или использовать переменную
name = "Alice"
greeting = f"Hello, {name.upper()!r}"

# Теперь можно использовать те же кавычки внутри
users = ["Alice", "Bob", "Charlie"]
message = f"First user: {users[0]}"

# Кавычки в выражениях
report = f"Users: {', '.join([u.upper() for u in users])}"
print(report)  # Users: ALICE, BOB, CHARLIE

# Многострочные f-строки с произвольными кавычками
data = {"key": "value", "count": 42}
summary = f"""
Data summary:
  Key: {data["key"]}
  Count: {data["count"]}
"""
```

### Вложенные f-строки

```python
width = 10
numbers = [1, 2, 3, 4, 5]

# Теперь вложенные f-строки работают без ограничений
formatted = f"{f"{', '.join(str(n) for n in numbers)}".center(width * 3)}"
print(formatted)

# Форматирование с динамически вычисленными параметрами
precision = 4
value = 3.14159265
result = f"{value:{f'.{precision}f'}}"
print(result)  # 3.1416
```

### Многострочные выражения и комментарии

```python
products = [
    {"name": "Laptop", "price": 999.99},
    {"name": "Mouse", "price": 29.99},
]

# Многострочное выражение внутри f-строки
total = f"""Total: {
    sum(
        p["price"]  # цена каждого товара
        for p in products
    ):.2f
}"""
print(total)  # Total: 1029.98
```

## Декоратор @override (PEP 698)

Python 3.12 добавляет декоратор `@override` в модуль `typing`. Он сигнализирует статическим анализаторам (mypy, pyright), что метод переопределяет метод из родительского класса.

```python
from typing import override


class Animal:
    def speak(self) -> str:
        return "..."

    def move(self) -> str:
        return "moving"


class Dog(Animal):
    @override
    def speak(self) -> str:  # OK — метод существует в Animal
        return "Woof!"

    @override
    def eat(self) -> str:  # Ошибка! Метода eat нет в Animal
        return "nom nom"
```

Без `@override` переопределение метода с опечаткой в имени не даст ошибки, и новый метод просто добавится к классу, а не переопределит родительский:

```python
class Cat(Animal):
    # Опечатка: speek вместо speak — без @override ошибка не будет обнаружена
    def speek(self) -> str:
        return "Meow!"


cat = Cat()
print(cat.speak())  # "..." — родительский метод, а не переопределённый!
```

С `@override` статический анализатор сразу укажет на проблему.

## Улучшенные сообщения об ошибках

Python 3.12 продолжает линию на читаемые сообщения об ошибках, начатую в 3.10.

### Ошибки в `import`

```python
# Python 3.12 предлагает подсказки при ImportError
import colections  # Вы имели в виду: collections?

# ModuleNotFoundError: No module named 'colections'.
# Did you mean: 'collections'?
```

### Более точные указатели в traceback

```python
def get_user_city(data):
    return data["user"]["address"]["city"]

user_data = {"user": {"address": None}}
get_user_city(user_data)

# Python 3.12 traceback:
# TypeError: 'NoneType' object is not subscriptable
#     return data["user"]["address"]["city"]
#            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^
```

Стрелки теперь точно указывают на проблемное выражение внутри цепочки вызовов.

### Ошибки при работе с атрибутами

```python
class Config:
    debug = False
    database_url = "postgresql://localhost/mydb"
    max_connections = 10


config = Config()
print(config.databse_url)  # Опечатка

# AttributeError: 'Config' object has no attribute 'databse_url'.
# Did you mean: 'database_url'?
```

## Новые методы pathlib.Path

Модуль `pathlib` получил два новых метода в Python 3.12.

### Path.relative_to с walk_up

```python
from pathlib import Path

path = Path("/home/user/projects/app/src/main.py")
base = Path("/home/user/projects")

# До Python 3.12 — только для подпутей
relative = path.relative_to(base)
print(relative)  # app/src/main.py

# Python 3.12 — walk_up позволяет подниматься выше
base2 = Path("/home/user/projects/other")
relative2 = path.relative_to(base2, walk_up=True)
print(relative2)  # ../app/src/main.py
```

### Path.is_relative_to

```python
from pathlib import Path

path = Path("/home/user/documents/report.pdf")

print(path.is_relative_to("/home/user"))       # True
print(path.is_relative_to("/home/admin"))      # False
print(path.is_relative_to("/home/user/docs"))  # False

# Полезно для проверки, находится ли файл в разрешённой директории
def safe_read(file_path: Path, allowed_base: Path) -> str:
    if not file_path.is_relative_to(allowed_base):
        raise PermissionError(f"Access denied: {file_path}")
    return file_path.read_text()
```

## Новый API мониторинга (PEP 669)

Python 3.12 вводит `sys.monitoring` — низкоуровневый API для отслеживания выполнения программы. Он заменяет устаревший `sys.settrace` и работает значительно быстрее.

```python
import sys

# Регистрируем инструмент мониторинга
MY_TOOL_ID = sys.monitoring.DEBUGGER_ID
sys.monitoring.use_tool_id(MY_TOOL_ID, "my_profiler")

call_counts: dict[str, int] = {}


def handle_call(code, instruction_offset):
    name = code.co_qualname
    call_counts[name] = call_counts.get(name, 0) + 1


# Подписываемся на событие вызова функции
sys.monitoring.set_events(MY_TOOL_ID, sys.monitoring.events.CALL)
sys.monitoring.register_callback(
    MY_TOOL_ID,
    sys.monitoring.events.CALL,
    handle_call,
)


def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


result = fibonacci(10)
sys.monitoring.set_events(MY_TOOL_ID, 0)  # Отключаем мониторинг

print(f"fibonacci(10) = {result}")
print(f"Вызовов fibonacci: {call_counts.get('fibonacci', 0)}")
# fibonacci(10) = 55
# Вызовов fibonacci: 177
```

## Удаление distutils

В Python 3.12 окончательно удалён модуль `distutils`, объявленный устаревшим в 3.10. Если ваш код или зависимости используют `distutils`, их нужно обновить:

```python
# Было (не работает в Python 3.12)
from distutils.version import LooseVersion
from distutils.util import strtobool

# Заменяем на
from packaging.version import Version  # pip install packaging

# strtobool заменяем собственной функцией или используем:
def strtobool(val: str) -> bool:
    val = val.lower()
    if val in ("y", "yes", "t", "true", "on", "1"):
        return True
    if val in ("n", "no", "f", "false", "off", "0"):
        return False
    raise ValueError(f"Invalid truth value: {val!r}")
```

## Улучшения производительности

Python 3.12 продолжает работу проекта Faster CPython. Среди ключевых улучшений:

- Ускорение вызовов функций за счёт оптимизации внутреннего фрейма
- Снижение накладных расходов на работу с comprehensions (они больше не создают вложенный фрейм)
- Оптимизация работы с `dict` и `list`
- Улучшенный механизм специализации байткода (adaptive interpreter)

```python
import timeit

# List comprehension в Python 3.12 быстрее,
# потому что не создаёт отдельный фрейм
time_comp = timeit.timeit(
    "[x * x for x in range(1000)]",
    number=10000,
)
print(f"List comprehension: {time_comp:.3f}s")
```

## Краткий итог нововведений

| Нововведение | PEP | Описание |
|---|---|---|
| Синтаксис обобщённых типов | 695 | `class Box[T]:`, `def first[T](...)`, `type Alias = ...` |
| Улучшения f-строк | 701 | Вложенные кавычки, комментарии, многострочные выражения |
| Декоратор `@override` | 698 | Явная пометка переопределённых методов |
| `sys.monitoring` | 669 | Новый быстрый API для профилировщиков и отладчиков |
| Улучшенные ошибки | — | Подсказки при опечатках, точные указатели в traceback |
| Удаление `distutils` | — | Финальное удаление; используйте `setuptools` или `packaging` |

Python 3.12 делает код с обобщёнными типами значительно чище, расширяет возможности f-строк и укрепляет инструментарий статической типизации. Если вы ещё не перешли на эту версию, самое время это сделать.

Чтобы освоить современный Python с нуля и научиться писать чистый, типизированный код, записывайтесь на курс — [Python-разработчик на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-312-new-features).
