---
metaTitle: "Python mypy: статическая проверка типов — руководство"
metaDescription: "Как использовать mypy для статической проверки типов в Python: установка, настройка, аннотации, конфигурация и интеграция в CI."
author: "Антон Ларичев"
title: "Python mypy — статическая проверка типов"
preview: "Разбираем mypy — инструмент статической проверки типов для Python. Установка, базовые и продвинутые аннотации, конфигурация, типичные ошибки."
---

## Что такое mypy и зачем он нужен

Python — динамически типизированный язык: типы переменных определяются во время выполнения программы. Это даёт гибкость, но может приводить к ошибкам, которые обнаруживаются только в продакшне. Начиная с Python 3.5 в язык добавили систему аннотаций типов (PEP 484), а mypy — это инструмент, который анализирует эти аннотации статически, не запуская код.

Ключевые преимущества mypy:

- Находит ошибки типов до запуска программы
- Делает код самодокументируемым — аннотации служат живой документацией
- Упрощает рефакторинг — mypy сообщит обо всех местах, где тип изменился
- Улучшает автодополнение в IDE

## Установка mypy

Mypy устанавливается через pip:

```bash
pip install mypy
```

Для проектов с зависимостями, которые не имеют встроенных аннотаций, понадобятся stub-пакеты. Они распространяются через пакеты с префиксом `types-`:

```bash
pip install types-requests types-PyYAML
```

Проверить установку:

```bash
mypy --version
```

## Первый запуск

Создадим файл `example.py` с намеренной ошибкой:

```python
def greet(name: str) -> str:
    return "Hello, " + name

result = greet(42)  # передаём int вместо str
print(result)
```

Запускаем mypy:

```bash
mypy example.py
```

Вывод:

```
example.py:4: error: Argument 1 to "greet" has incompatible type "int"; expected "str"  [arg-type]
Found 1 error in 1 file (checked 1 source file)
```

Mypy нашёл ошибку до запуска кода. Если ошибок нет, mypy выводит `Success: no issues found`.

## Базовые аннотации типов

### Простые типы

```python
# Аннотации переменных
name: str = "Alice"
age: int = 30
price: float = 9.99
is_active: bool = True

# Аннотации функций
def add(a: int, b: int) -> int:
    return a + b

def say_hello(name: str) -> None:
    print(f"Hello, {name}")
```

### Коллекции

С Python 3.9+ можно использовать встроенные типы напрямую:

```python
def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

def get_coords() -> tuple[float, float]:
    return (55.75, 37.62)

def unique_tags(tags: list[str]) -> set[str]:
    return set(tags)
```

Для Python 3.8 и ниже импортируйте типы из `typing`:

```python
from typing import List, Dict, Tuple, Set

def process_items(items: List[str]) -> Dict[str, int]:
    return {item: len(item) for item in items}
```

### Optional и Union

`Optional[T]` — значение может быть типа T или None:

```python
from typing import Optional

def find_user(user_id: int) -> Optional[str]:
    users = {1: "Alice", 2: "Bob"}
    return users.get(user_id)  # возвращает str или None

# Эквивалентная запись с Python 3.10+
def find_user_v2(user_id: int) -> str | None:
    users = {1: "Alice", 2: "Bob"}
    return users.get(user_id)
```

`Union[A, B]` — значение может быть одного из нескольких типов:

```python
from typing import Union

def stringify(value: Union[int, float, str]) -> str:
    return str(value)

# Python 3.10+
def stringify_v2(value: int | float | str) -> str:
    return str(value)
```

## Конфигурация mypy

Поведение mypy настраивается через файл конфигурации. Поддерживаются три формата.

### mypy.ini

```ini
[mypy]
python_version = 3.11
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
check_untyped_defs = True
no_implicit_optional = True
strict_optional = True

# Игнорировать конкретную библиотеку без стабов
[mypy-some_untyped_library.*]
ignore_missing_imports = True
```

### pyproject.toml

```toml
[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
check_untyped_defs = true
no_implicit_optional = true
strict_optional = true

[[tool.mypy.overrides]]
module = "some_untyped_library.*"
ignore_missing_imports = true
```

### Строгий режим

Флаг `--strict` включает все строгие проверки сразу:

```bash
mypy --strict mymodule.py
```

Это эквивалентно включению сразу нескольких опций: `disallow_untyped_defs`, `disallow_any_generics`, `warn_return_any` и других. Для новых проектов рекомендуется начинать именно с `--strict`.

## Продвинутые возможности

### TypeVar и Generic

`TypeVar` позволяет писать обобщённые функции:

```python
from typing import TypeVar

T = TypeVar("T")

def first(items: list[T]) -> T:
    return items[0]

# mypy выведет правильный тип:
result = first([1, 2, 3])   # result: int
name = first(["a", "b"])    # name: str
```

Обобщённые классы:

```python
from typing import Generic, TypeVar

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

stack: Stack[int] = Stack()
stack.push(1)
value = stack.pop()  # value: int
```

### Callable

Аннотация для функций как аргументов:

```python
from typing import Callable

def apply(func: Callable[[int, int], int], a: int, b: int) -> int:
    return func(a, b)

result = apply(lambda x, y: x + y, 3, 4)  # result: int
```

### TypedDict

Для словарей с фиксированной структурой:

```python
from typing import TypedDict

class UserData(TypedDict):
    name: str
    age: int
    email: str

def create_user(data: UserData) -> str:
    return f"{data['name']} ({data['email']})"

user: UserData = {"name": "Alice", "age": 30, "email": "alice@example.com"}
print(create_user(user))
```

### Literal

Ограничение значений конкретным набором:

```python
from typing import Literal

Direction = Literal["north", "south", "east", "west"]

def move(direction: Direction, steps: int) -> None:
    print(f"Moving {direction} by {steps} steps")

move("north", 5)   # OK
move("up", 3)      # error: Argument 1 has incompatible type
```

### Protocol

Structural subtyping — проверка по наличию методов, а не по наследованию:

```python
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...

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

`Circle` и `Square` не наследуются от `Drawable`, но mypy принимает их, потому что они реализуют нужный метод.

## Практические паттерны

### Сужение типов (Type Narrowing)

Mypy умеет отслеживать сужение типов через условия:

```python
from typing import Optional

def process(value: Optional[str]) -> int:
    if value is None:
        return 0
    # здесь mypy знает, что value: str
    return len(value)
```

Проверка через `isinstance`:

```python
def format_value(value: int | str | list[int]) -> str:
    if isinstance(value, int):
        return str(value)         # value: int
    elif isinstance(value, str):
        return value.upper()      # value: str
    else:
        return ", ".join(str(v) for v in value)  # value: list[int]
```

### cast

Когда mypy не может вывести тип самостоятельно, можно явно указать его через `cast`:

```python
from typing import cast
import json

def load_config(path: str) -> dict[str, str]:
    with open(path) as f:
        data = json.load(f)  # тип: Any
    return cast(dict[str, str], data)
```

Используйте `cast` с осторожностью — он отключает проверку для конкретного выражения.

### TYPE_CHECKING

Для импортов только ради аннотаций используйте `TYPE_CHECKING`, чтобы не замедлять импорт модуля:

```python
from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from mymodule import HeavyClass

def process(obj: HeavyClass) -> None:
    ...
```

## Типичные ошибки и как их исправить

### error: Function is missing a return type annotation

Mypy требует аннотировать возвращаемые типы при `disallow_untyped_defs = True`:

```python
# Плохо
def calculate(x, y):
    return x + y

# Хорошо
def calculate(x: float, y: float) -> float:
    return x + y
```

### error: Item "None" of "Optional[X]" has no attribute "..."

```python
from typing import Optional

def get_length(text: Optional[str]) -> int:
    # Ошибка: text может быть None
    return len(text)

# Исправление:
def get_length_fixed(text: Optional[str]) -> int:
    if text is None:
        return 0
    return len(text)
```

### error: Incompatible return value type

```python
def get_user_id() -> int:
    return "user_123"  # ошибка: возвращаем str, ожидается int

# Исправление:
def get_user_id_fixed() -> str:
    return "user_123"
```

## Интеграция в процесс разработки

### Pre-commit hook

Добавьте mypy в `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies: [types-requests]
```

### GitHub Actions

```yaml
name: Type Check

on: [push, pull_request]

jobs:
  mypy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install mypy types-requests
      - run: mypy --strict src/
```

### Makefile

```makefile
type-check:
	mypy --strict src/

lint: type-check
	...
```

## Стратегия внедрения в существующий проект

Добавить mypy в уже работающий проект бывает непросто из-за большого количества ошибок. Рекомендуемый подход:

**Шаг 1.** Запустите mypy без строгих флагов и посмотрите масштаб:

```bash
mypy src/ --ignore-missing-imports 2>&1 | tail -5
```

**Шаг 2.** Добавьте конфигурацию с минимальными ограничениями и постепенно ужесточайте:

```ini
[mypy]
python_version = 3.11
ignore_missing_imports = True
# включайте по одному:
# check_untyped_defs = True
# disallow_untyped_defs = True
```

**Шаг 3.** Используйте `# type: ignore` для временного отключения проверки в проблемных местах:

```python
result = legacy_function()  # type: ignore[no-untyped-call]
```

**Шаг 4.** Заведите правило: весь новый код пишется с аннотациями. Постепенно аннотируйте старый.

## Итог

Mypy — это стандарт де-факто для статической проверки типов в Python. Он не заменяет тесты, но ловит целый класс ошибок — несоответствие типов, вызов методов на None, неверные аргументы — до запуска программы.

Оптимальный путь: начните с базовых аннотаций в новом коде, настройте mypy в CI, и постепенно добавляйте строгость по мере роста покрытия аннотациями.

Чтобы глубоко разобраться в Python и начать писать надёжный, хорошо типизированный код, приходите на курс [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=mypy-static-type-checking).