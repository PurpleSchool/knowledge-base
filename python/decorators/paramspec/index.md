---
metaTitle: "Python ParamSpec: типизация декораторов с сохранением сигнатуры"
metaDescription: "Разбираем ParamSpec в Python: как сохранять типы параметров в декораторах, использовать Concatenate и писать строго типизированные обёртки."
author: "Антон Ларичев"
title: "ParamSpec в Python: сохранение сигнатур в декораторах"
preview: "Как с помощью ParamSpec сохранять полную сигнатуру функций при создании декораторов и не терять информацию о типах."
---

## Проблема типизации декораторов

Декораторы — один из самых мощных инструментов Python. Но как только вы начинаете добавлять аннотации типов, сразу обнаруживается неприятная особенность: при оборачивании функции типовая информация о её параметрах теряется.

Рассмотрим простой декоратор логирования:

```python
from functools import wraps
from typing import Callable, Any

def log_call(func: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        print(f"Вызов {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_call
def add(x: int, y: int) -> int:
    return x + y

add(1, "не число")  # mypy не выдаст ошибку!
```

Проблема в том, что `Callable[..., Any]` — это «заглушка». После применения декоратора `mypy` перестаёт понимать, что `add` принимает два `int`. Вы теряете всю информацию о параметрах.

До Python 3.10 обойти это было практически невозможно без громоздких перегрузок. `ParamSpec` решил эту проблему.

## Что такое ParamSpec

`ParamSpec` (PEP 612) появился в Python 3.10 и доступен через `typing`. Для более ранних версий (3.8, 3.9) он есть в пакете `typing_extensions`.

`ParamSpec` — это специальная переменная типа, которая захватывает **весь набор параметров** функции: их имена, порядок, типы, дефолтные значения, `*args` и `**kwargs`. Это позволяет передавать информацию о параметрах через декоратор без потерь.

```python
from typing import ParamSpec, TypeVar, Callable

P = ParamSpec("P")  # захватывает параметры
T = TypeVar("T")   # захватывает возвращаемый тип
```

`P` хранит два атрибута:
- `P.args` — позиционные аргументы (`*args`)
- `P.kwargs` — именованные аргументы (`**kwargs`)

## Базовый пример: декоратор с сохранением сигнатуры

Перепишем декоратор логирования с использованием `ParamSpec`:

```python
from functools import wraps
from typing import Callable, ParamSpec, TypeVar

P = ParamSpec("P")
T = TypeVar("T")

def log_call(func: Callable[P, T]) -> Callable[P, T]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        print(f"Вызов {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_call
def add(x: int, y: int) -> int:
    return x + y

add(1, 2)         # OK
add(1, "текст")   # mypy выдаст ошибку: expected int, got str
```

Теперь `mypy` знает, что `add` после декорирования всё ещё принимает `(x: int, y: int) -> int`. Тип сохранён полностью.

Ключевые детали:
- `Callable[P, T]` — принимает функцию с параметрами `P` и возвращаемым типом `T`
- `*args: P.args, **kwargs: P.kwargs` — именно так нужно аннотировать параметры `wrapper`, а не `*args: Any`
- Возвращаем `Callable[P, T]` — декоратор гарантирует ту же сигнатуру

## Декоратор с дополнительными параметрами

Часто декораторы сами принимают параметры. Например, декоратор повторных попыток:

```python
from functools import wraps
from typing import Callable, ParamSpec, TypeVar
import time

P = ParamSpec("P")
T = TypeVar("T")

def retry(times: int = 3, delay: float = 1.0) -> Callable[[Callable[P, T]], Callable[P, T]]:
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            last_error: Exception | None = None
            for attempt in range(times):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < times - 1:
                        time.sleep(delay)
            raise last_error  # type: ignore[misc]
        return wrapper
    return decorator

@retry(times=5, delay=0.5)
def fetch_data(url: str, timeout: int = 30) -> dict:
    # симуляция HTTP-запроса
    return {"status": "ok"}

fetch_data("https://api.example.com", timeout=10)  # типы сохранены
fetch_data(42)  # mypy: ошибка, ожидается str
```

## Concatenate: добавление параметров к сигнатуре

`Concatenate` позволяет добавить **новые параметры** перед захваченными параметрами `P`. Это полезно, когда ваш декоратор добавляет к функции дополнительный аргумент.

Классический пример — внедрение зависимостей через декоратор. Представим декоратор, который добавляет в функцию объект подключения к базе данных:

```python
from functools import wraps
from typing import Callable, Concatenate, ParamSpec, TypeVar

P = ParamSpec("P")
T = TypeVar("T")

class Database:
    def query(self, sql: str) -> list:
        return []

def with_db(
    func: Callable[Concatenate[Database, P], T]
) -> Callable[P, T]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        db = Database()
        return func(db, *args, **kwargs)
    return wrapper

@with_db
def get_users(db: Database, limit: int = 100) -> list:
    return db.query(f"SELECT * FROM users LIMIT {limit}")

# После декорирования: get_users(limit: int = 100) -> list
# Параметр db убран из внешней сигнатуры
result = get_users(limit=50)  # OK, db не нужно передавать
```

`Concatenate[Database, P]` означает: функция принимает `Database` первым аргументом, а затем — всё, что описывается в `P`. После декорирования `Database` «поглощается» оберткой и исчезает из внешнего интерфейса.

## Практический пример: кэширование с инвалидацией

Напишем более реалистичный пример — декоратор кэширования с поддержкой TTL и тегов:

```python
from functools import wraps
from typing import Callable, ParamSpec, TypeVar
from datetime import datetime, timedelta

P = ParamSpec("P")
T = TypeVar("T")

class CacheEntry:
    def __init__(self, value: object, ttl_seconds: float) -> None:
        self.value = value
        self.expires_at = datetime.now() + timedelta(seconds=ttl_seconds)

    def is_valid(self) -> bool:
        return datetime.now() < self.expires_at

_cache: dict[str, CacheEntry] = {}

def cached(
    ttl_seconds: float = 60.0,
    key_prefix: str = "",
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            cache_key = f"{key_prefix}:{func.__name__}:{args}:{sorted(kwargs.items())}"

            if cache_key in _cache and _cache[cache_key].is_valid():
                print(f"Кэш-попадание: {cache_key}")
                return _cache[cache_key].value  # type: ignore[return-value]

            result = func(*args, **kwargs)
            _cache[cache_key] = CacheEntry(result, ttl_seconds)
            return result

        return wrapper
    return decorator

@cached(ttl_seconds=300.0, key_prefix="users")
def get_user_by_id(user_id: int, include_deleted: bool = False) -> dict:
    return {"id": user_id, "name": "Иван"}

# Типы полностью сохранены
user = get_user_by_id(42, include_deleted=True)
get_user_by_id("строка")  # mypy: ошибка типа
```

## Совместная работа с Protocol

`ParamSpec` хорошо сочетается с `Protocol`, позволяя описывать типизированные интерфейсы для callable-объектов:

```python
from typing import Callable, ParamSpec, Protocol, TypeVar

P = ParamSpec("P")
T = TypeVar("T")

class Middleware(Protocol[P, T]):
    def __call__(self, *args: P.args, **kwargs: P.kwargs) -> T: ...

def apply_middleware(
    func: Callable[P, T],
    middlewares: list[Callable[[Callable[P, T]], Callable[P, T]]],
) -> Callable[P, T]:
    result = func
    for middleware in reversed(middlewares):
        result = middleware(result)
    return result

def timer_middleware(func: Callable[P, T]) -> Callable[P, T]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        import time
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} выполнился за {elapsed:.4f}с")
        return result
    return wrapper

def auth_middleware(func: Callable[P, T]) -> Callable[P, T]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        print("Проверка авторизации...")
        return func(*args, **kwargs)
    return wrapper

def process_order(order_id: int, user_id: int) -> str:
    return f"Заказ {order_id} обработан для пользователя {user_id}"

protected_process = apply_middleware(
    process_order,
    [timer_middleware, auth_middleware],
)

# Тип сохранён: (order_id: int, user_id: int) -> str
result = protected_process(101, 42)
```

## Версионная совместимость

`ParamSpec` доступен:
- **Python 3.10+** — встроен в `typing`
- **Python 3.8–3.9** — через `typing_extensions`

Для поддержки обеих версий используйте условный импорт:

```python
import sys

if sys.version_info >= (3, 10):
    from typing import ParamSpec, Concatenate
else:
    from typing_extensions import ParamSpec, Concatenate
```

Или более идиоматично:

```python
try:
    from typing import ParamSpec, Concatenate
except ImportError:
    from typing_extensions import ParamSpec, Concatenate  # type: ignore[no-redef]
```

При использовании `typing_extensions` добавьте её в зависимости:

```bash
pip install typing-extensions
```

## Частые ошибки

### Неправильная аннотация wrapper

```python
# НЕПРАВИЛЬНО — теряет информацию о типах
def decorator(func: Callable[P, T]) -> Callable[P, T]:
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        return func(*args, **kwargs)
    return wrapper

# ПРАВИЛЬНО
def decorator(func: Callable[P, T]) -> Callable[P, T]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        return func(*args, **kwargs)
    return wrapper
```

### Попытка использовать P.args и P.kwargs по отдельности

`P.args` и `P.kwargs` **всегда используются вместе** в `*args: P.args, **kwargs: P.kwargs`. Их нельзя разделить или использовать независимо — это ограничение текущей реализации.

```python
# НЕПРАВИЛЬНО
def wrapper(*args: P.args) -> T: ...  # ошибка типизатора

# ПРАВИЛЬНО
def wrapper(*args: P.args, **kwargs: P.kwargs) -> T: ...
```

### Использование ParamSpec не для первого позиционного захвата

`Concatenate` поддерживает только позиционные аргументы перед `P`, и добавляемые параметры должны быть позиционными:

```python
# ПРАВИЛЬНО
Callable[Concatenate[int, str, P], T]

# НЕПРАВИЛЬНО — именованные аргументы не поддерживаются в Concatenate
Callable[Concatenate[int, P], T]  # добавляем только позиционные
```

## Итог

`ParamSpec` закрывает давний пробел в системе типов Python: теперь декораторы могут быть **полностью типизированы** без потери информации о параметрах оборачиваемых функций.

Когда использовать `ParamSpec`:
- При написании универсальных декораторов, которые оборачивают произвольные функции
- Когда декоратор добавляет аргументы к функции (с `Concatenate`)
- При создании middleware-цепочек и пайплайнов с сохранением типов
- В библиотеках, где важна совместимость с `mypy` и `pyright`

Совместно с `TypeVar` и `Callable` `ParamSpec` формирует полноценный инструментарий для строгой типизации функций высшего порядка в Python.

---

Чтобы глубоко разобраться в системе типов Python, декораторах и современных возможностях языка, смотрите курс на PurpleSchool:
[Python-разработчик — курс на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-paramspec)
