---
metaTitle: "Python ExceptionGroup и except* — PEP 654 | PurpleSchool"
metaDescription: "Подробный разбор ExceptionGroup и синтаксиса except* из PEP 654. Как обрабатывать несколько исключений одновременно в Python 3.11+."
author: "Антон Ларичев"
title: "ExceptionGroup и except* — группы исключений в Python"
preview: "Разбираем ExceptionGroup и except* из PEP 654: зачем нужны группы исключений, как их создавать и обрабатывать в синхронном и асинхронном коде."
---

## Что такое ExceptionGroup и зачем он нужен

До Python 3.11 исключение можно было выбросить только одно — любой блок `try/except` обрабатывал единственную ошибку в каждый момент времени. Это работало нормально в синхронном коде, но создавало серьёзную проблему в асинхронном: когда несколько задач выполняются параллельно, каждая из них может завершиться с ошибкой, и теряется информация обо всех провалах, кроме первого.

PEP 654, реализованный в Python 3.11, вводит два новых инструмента:

- `ExceptionGroup` — специальный тип исключения, содержащий список дочерних исключений
- `except*` — новый синтаксис для выборочной обработки исключений из группы

Оба механизма изменяют то, как Python работает с ошибками на фундаментальном уровне.

## Создание ExceptionGroup

`ExceptionGroup` создаётся как обычный объект исключения — через конструктор, которому передаётся описание и список дочерних исключений.

```python
eg = ExceptionGroup(
    "несколько ошибок валидации",
    [
        ValueError("поле 'email' не валидно"),
        TypeError("поле 'age' должно быть числом"),
        KeyError("поле 'name' обязательно"),
    ]
)
raise eg
```

При выводе трейсбека Python показывает всю группу целиком:

```
  + Exception Group Traceback (most recent call last):
  |   ...
  | ExceptionGroup: несколько ошибок валидации (3 sub-exceptions)
  +-+---------------- 1 ----------------
    | ValueError: поле 'email' не валидно
    +---------------- 2 ----------------
    | TypeError: поле 'age' должно быть числом
    +---------------- 3 ----------------
    | KeyError: 'name'
    +------------------------------------
```

Дочерние исключения хранятся в атрибуте `.exceptions`:

```python
try:
    raise ExceptionGroup("ошибки", [ValueError("a"), TypeError("b")])
except* Exception as eg:
    print(eg.exceptions)  # (ValueError('a'), TypeError('b'))
    print(eg.message)     # 'ошибки'
```

## Синтаксис except*

`except*` — это не опечатка. Звёздочка показывает, что этот блок перехватывает исключения из группы, а не одно исключение. Правила работы:

- Каждый `except*` получает **подгруппу** — новый `ExceptionGroup`, содержащий только те исключения, тип которых совпал
- Один блок `try` может содержать несколько `except*`, и они могут срабатывать **одновременно** — в отличие от обычных `except`, где срабатывает только первый совпавший
- Если часть исключений не была обработана, Python автоматически пробрасывает оставшуюся группу

```python
try:
    raise ExceptionGroup(
        "набор ошибок",
        [
            ValueError("неверное значение"),
            TypeError("неверный тип"),
            ValueError("ещё одно неверное значение"),
            KeyError("ключ не найден"),
        ]
    )
except* ValueError as eg:
    print(f"ValueError-ы: {eg.exceptions}")
except* TypeError as eg:
    print(f"TypeError: {eg.exceptions}")
# KeyError не обработан — будет проброшен выше
```

Вывод:

```
ValueError-ы: (ValueError('неверное значение'), ValueError('ещё одно неверное значение'))
TypeError: (TypeError('неверный тип'),)
```

Затем Python пробросит новый `ExceptionGroup` с единственным `KeyError` — потому что мы его не обработали.

### Нельзя смешивать except и except*

Внутри одного блока `try` нельзя использовать одновременно `except` и `except*` — это синтаксическая ошибка:

```python
# SyntaxError!
try:
    ...
except ValueError:
    ...
except* TypeError:
    ...
```

## Обработка конкретных исключений внутри группы

Часто нужно не просто поймать все `ValueError` из группы, а обработать каждое по отдельности. Для этого итерируемся по `.exceptions`:

```python
def validate_user(data: dict) -> None:
    errors = []
    if not isinstance(data.get("email"), str):
        errors.append(TypeError("email должен быть строкой"))
    if not data.get("email", "").endswith("@example.com"):
        errors.append(ValueError("email должен заканчиваться на @example.com"))
    if not isinstance(data.get("age"), int):
        errors.append(TypeError("age должен быть числом"))
    if errors:
        raise ExceptionGroup("ошибки валидации", errors)

try:
    validate_user({"email": "bad", "age": "old"})
except* TypeError as eg:
    for exc in eg.exceptions:
        print(f"Ошибка типа: {exc}")
except* ValueError as eg:
    for exc in eg.exceptions:
        print(f"Ошибка значения: {exc}")
```

## Вложенные ExceptionGroup

Группы исключений могут быть вложенными — `ExceptionGroup` может содержать другие `ExceptionGroup` в качестве дочерних элементов:

```python
inner = ExceptionGroup("внутренние ошибки", [ValueError("1"), ValueError("2")])
outer = ExceptionGroup(
    "внешние ошибки",
    [TypeError("внешняя"), inner]
)
raise outer
```

При обработке через `except*` Python рекурсивно обходит вложенные группы и собирает все совпадения по типу:

```python
try:
    inner = ExceptionGroup("вложенные", [ValueError("a"), ValueError("b")])
    outer = ExceptionGroup("основные", [TypeError("c"), inner])
    raise outer
except* ValueError as eg:
    # Поймает ValueError('a') и ValueError('b') из вложенной группы
    print(f"Все ValueError: {eg.exceptions}")
except* TypeError as eg:
    print(f"TypeError: {eg.exceptions}")
```

## BaseExceptionGroup vs ExceptionGroup

В Python есть два варианта:

| Класс | Базовый класс | Когда использовать |
|---|---|---|
| `ExceptionGroup` | `Exception` | Обычные исключения (стандартный случай) |
| `BaseExceptionGroup` | `BaseException` | Когда нужно включить `KeyboardInterrupt`, `SystemExit` и другие `BaseException` |

Правило Python простое: если все дочерние исключения — подклассы `Exception`, используй `ExceptionGroup`. Если хотя бы одно является `BaseException` (но не `Exception`), нужен `BaseExceptionGroup`. При нарушении этого правила Python выбросит `TypeError`:

```python
# TypeError: all child exceptions must be non-BaseException subclasses
ExceptionGroup("смешанная", [ValueError("ok"), KeyboardInterrupt()])

# Правильно:
BaseExceptionGroup("смешанная", [ValueError("ok"), KeyboardInterrupt()])
```

Примечательно, что `ExceptionGroup` является подклассом и `Exception`, и `BaseException`, тогда как `BaseExceptionGroup` — только `BaseException`. Это важно при перехвате:

```python
try:
    raise BaseExceptionGroup("beg", [KeyboardInterrupt()])
except Exception:
    print("не сработает — BaseExceptionGroup не является Exception")
except BaseException:
    print("сработает")
```

## ExceptionGroup в asyncio с TaskGroup

Основная мотивация PEP 654 — поддержка `asyncio.TaskGroup`, появившегося в Python 3.11. `TaskGroup` запускает несколько корутин параллельно и, если несколько из них упали с ошибками, собирает все исключения в одну группу.

```python
import asyncio

async def fetch_data(url: str) -> str:
    await asyncio.sleep(0.1)
    if "bad" in url:
        raise ValueError(f"Плохой URL: {url}")
    return f"данные из {url}"

async def main() -> None:
    urls = [
        "https://api.example.com/users",
        "https://bad.example.com/data",
        "https://api.example.com/orders",
        "https://bad.example.com/items",
    ]

    try:
        async with asyncio.TaskGroup() as tg:
            tasks = [tg.create_task(fetch_data(url)) for url in urls]
    except* ValueError as eg:
        print(f"Упало {len(eg.exceptions)} задач(и):")
        for exc in eg.exceptions:
            print(f"  - {exc}")

asyncio.run(main())
```

Вывод:

```
Упало 2 задач(и):
  - Плохой URL: https://bad.example.com/data
  - Плохой URL: https://bad.example.com/items
```

Без `ExceptionGroup` и `except*` пришлось бы либо терять информацию о втором упавшем таске, либо реализовывать громоздкие обходные решения с ручным сбором ошибок.

## Практический пример: валидатор формы

Рассмотрим реалистичный сценарий — серверная валидация данных формы, где нужно вернуть пользователю все ошибки сразу, а не только первую:

```python
from dataclasses import dataclass

@dataclass
class ValidationError(Exception):
    field: str
    message: str

    def __str__(self) -> str:
        return f"{self.field}: {self.message}"

def validate_registration(data: dict) -> None:
    errors: list[Exception] = []

    email = data.get("email", "")
    if not email:
        errors.append(ValidationError("email", "обязательное поле"))
    elif "@" not in email:
        errors.append(ValidationError("email", "неверный формат"))

    password = data.get("password", "")
    if len(password) < 8:
        errors.append(ValidationError("password", "минимум 8 символов"))
    if not any(c.isupper() for c in password):
        errors.append(ValidationError("password", "нужна хотя бы одна заглавная буква"))

    age = data.get("age")
    if age is None:
        errors.append(ValidationError("age", "обязательное поле"))
    elif not isinstance(age, int):
        errors.append(TypeError("age должен быть числом"))
    elif age < 18:
        errors.append(ValidationError("age", "необходимо быть старше 18 лет"))

    if errors:
        raise ExceptionGroup("ошибки валидации регистрации", errors)


def handle_registration(data: dict) -> dict:
    field_errors: dict[str, list[str]] = {}
    type_errors: list[str] = []

    try:
        validate_registration(data)
    except* ValidationError as eg:
        for exc in eg.exceptions:
            field_errors.setdefault(exc.field, []).append(exc.message)
    except* TypeError as eg:
        for exc in eg.exceptions:
            type_errors.append(str(exc))

    if field_errors or type_errors:
        return {
            "success": False,
            "errors": field_errors,
            "type_errors": type_errors,
        }
    return {"success": True}


result = handle_registration({
    "email": "notanemail",
    "password": "short",
    "age": "не число",
})
print(result)
```

Вывод:

```python
{
  'success': False,
  'errors': {
    'email': ['неверный формат'],
    'password': ['минимум 8 символов', 'нужна хотя бы одна заглавная буква']
  },
  'type_errors': ['age должен быть числом']
}
```

## Повторный выброс и модификация группы

Внутри блока `except*` можно выбросить новые исключения или вернуть модифицированную группу. Для создания подгруппы с другим сообщением используется метод `.subgroup()`:

```python
try:
    raise ExceptionGroup("исходные", [ValueError("a"), TypeError("b"), KeyError("c")])
except* (ValueError, TypeError) as eg:
    # Обрабатываем только ValueError и TypeError
    print(f"Обработано: {eg.exceptions}")
    # KeyError будет проброшен автоматически
```

Метод `.subgroup()` позволяет фильтровать дочерние исключения вручную:

```python
eg = ExceptionGroup("все", [ValueError(1), ValueError(2), TypeError(3)])

# Только ValueError с чётными аргументами
filtered = eg.subgroup(lambda e: isinstance(e, ValueError) and e.args[0] % 2 == 0)
print(filtered)  # ExceptionGroup('все', [ValueError(2)])
```

Метод `.split()` разбивает группу на две части — совпавшие и несовпавшие:

```python
eg = ExceptionGroup("все", [ValueError("a"), TypeError("b"), ValueError("c")])
match, rest = eg.split(ValueError)
print(match)  # ExceptionGroup('все', [ValueError('a'), ValueError('c')])
print(rest)   # ExceptionGroup('все', [TypeError('b')])
```

## Совместимость и требования

`ExceptionGroup` и `except*` требуют Python 3.11 или новее. Для более старых версий существует сторонняя библиотека `exceptiongroup` (из пакета `exceptiongroup` на PyPI), которая предоставляет полифилл через `import exceptiongroup`.

Проверить версию перед использованием:

```python
import sys

if sys.version_info < (3, 11):
    raise RuntimeError("ExceptionGroup требует Python 3.11+")
```

Или использовать `__future__`-подобный подход через полифилл:

```python
try:
    # Python 3.11+
    ExceptionGroup
except NameError:
    # Полифилл для старых версий
    from exceptiongroup import ExceptionGroup, BaseExceptionGroup
```

## Итог

`ExceptionGroup` и `except*` решают реальную проблему, которая особенно остро проявляется в асинхронном и параллельном коде: невозможность передать несколько исключений одновременно. Ключевые моменты:

- `ExceptionGroup` содержит список дочерних исключений с произвольным уровнем вложенности
- `except*` перехватывает подмножество исключений из группы, не мешая обработке остальных
- Несколько блоков `except*` могут сработать одновременно — в отличие от обычных `except`
- `asyncio.TaskGroup` использует `ExceptionGroup` внутри и является главным мотиватором PEP 654
- Методы `.subgroup()` и `.split()` позволяют программно фильтровать группы

Чтобы глубже разобраться с асинхронным программированием в Python, включая `asyncio.TaskGroup` и современные паттерны обработки ошибок, смотрите курс на PurpleSchool: [Python Async — asyncio, aiohttp, aiofiles](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-exception-group)
