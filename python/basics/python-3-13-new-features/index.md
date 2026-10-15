---
metaTitle: "Python 3.13: новые возможности и изменения"
metaDescription: "Полный обзор Python 3.13: новый REPL, free-threaded режим без GIL, улучшения типизации, copy.replace(), warnings.deprecated и другие изменения."
author: "Антон Ларичев"
title: "Python 3.13: новые возможности"
preview: "Разбираем ключевые нововведения Python 3.13: улучшенный REPL, экспериментальный режим без GIL, новые инструменты типизации и полезные функции стандартной библиотеки."
---

## Что нового в Python 3.13

Python 3.13 вышел в октябре 2024 года и принёс несколько значимых изменений: переработанный интерактивный интерпретатор, экспериментальный режим без GIL, новые возможности системы типов и ряд улучшений стандартной библиотеки. В этой статье разберём каждое нововведение с практическими примерами.

## Новый интерактивный REPL

Старый интерактивный интерпретатор (`>>>`) работал без изменений много лет. В Python 3.13 он переписан с нуля.

### Что изменилось

- Многострочное редактирование — теперь можно перемещаться по ранее введённым блокам кода стрелками и редактировать их
- Подсветка синтаксиса прямо в терминале
- Улучшенные подсказки об ошибках с указанием строки
- Команда `exit` без скобок работает корректно
- Новая команда `help` с цветным выводом

```bash
$ python3.13
Python 3.13.0 (main, Oct  7 2024, 05:02:14)
Type "help", "copyright", "credits" or "license" for more information.
>>> def greet(name):
...     return f"Hello, {name}"
...
>>> greet("World")
'Hello, World'
```

Если нужно вернуться к старому поведению, используйте флаг `PYTHON_BASIC_REPL=1`:

```bash
PYTHON_BASIC_REPL=1 python3.13
```

## Free-threaded CPython — работа без GIL (PEP 703)

GIL (Global Interpreter Lock) — глобальная блокировка интерпретатора — долгое время не давала Python-коду выполняться по-настоящему параллельно в нескольких потоках. Python 3.13 поставляется с **экспериментальной** сборкой без GIL.

### Как запустить

При установке через `pyenv` или официальный инсталлятор нужно собрать специальную версию:

```bash
# Через pyenv
PYTHON_CONFIGURE_OPTS="--disable-gil" pyenv install 3.13.0t
pyenv global 3.13.0t
```

Проверить, работает ли интерпретатор без GIL:

```python
import sys
print(sys._is_gil_enabled())  # False — GIL отключён
```

### Практический пример

С включённым GIL потоки не ускоряют CPU-bound задачи. Без GIL картина меняется:

```python
import threading
import time

def cpu_task(n):
    total = 0
    for i in range(n):
        total += i * i
    return total

# Запуск в нескольких потоках
start = time.perf_counter()
threads = [threading.Thread(target=cpu_task, args=(10_000_000,)) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
elapsed = time.perf_counter() - start
print(f"Elapsed: {elapsed:.2f}s")
```

В обычном CPython 4 потока не дадут выигрыша по времени для CPU-задач. В free-threaded сборке они выполнятся параллельно на разных ядрах.

**Важно:** функциональность помечена как экспериментальная. Некоторые C-расширения могут работать нестабильно. Для продакшена пока рекомендуется стандартная сборка.

## Новые возможности системы типов

### TypeVar с значением по умолчанию (PEP 696)

Раньше при объявлении обобщённых классов или функций нельзя было задать значение по умолчанию для `TypeVar`. Теперь можно:

```python
from typing import TypeVar, Generic

# До Python 3.13 — приходилось использовать Union или отдельные перегрузки
T = TypeVar("T", default=int)  # Новый синтаксис

class Container(Generic[T]):
    def __init__(self, value: T) -> None:
        self.value = value

# При использовании без явного указания типа — подразумевается int
c1: Container = Container(42)       # Container[int]
c2: Container[str] = Container("hi")  # Container[str]
```

Это особенно полезно при построении параметризованных callback-типов:

```python
from typing import ParamSpec, Callable, TypeVar

P = ParamSpec("P", default=...)
R = TypeVar("R", default=None)

type Handler[**P, R] = Callable[P, R]
```

### ReadOnly для TypedDict (PEP 705)

Новый специальный тип `typing.ReadOnly` позволяет пометить отдельные поля `TypedDict` как доступные только для чтения:

```python
from typing import TypedDict, ReadOnly

class Config(TypedDict):
    host: ReadOnly[str]      # только чтение
    port: ReadOnly[int]      # только чтение
    debug: bool              # можно изменять

def update_config(cfg: Config) -> None:
    cfg["debug"] = True      # OK
    cfg["host"] = "localhost" # Ошибка типизатора: ReadOnly field
```

Это не создаёт runtime-ограничений — проверка происходит только статически через mypy или pyright.

### TypeIs — уточнение типов (PEP 742)

`TypeGuard` существовал с Python 3.10, но имел ограничение: после проверки тип сужался только в ветке `True`. `TypeIs` — более строгий вариант, который корректно работает в обеих ветках:

```python
from typing import TypeIs

def is_str_list(val: list[object]) -> TypeIs[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[object]) -> None:
    if is_str_list(items):
        # Здесь items: list[str]
        print(items[0].upper())
    else:
        # Здесь items: list[object] (TypeGuard оставлял object в обеих ветках)
        print(len(items))
```

Отличие от `TypeGuard`: `TypeIs` требует, чтобы тип после сужения был подтипом исходного. Это даёт более предсказуемое поведение статических анализаторов.

## Декоратор warnings.deprecated (PEP 702)

Раньше для пометки устаревшего кода приходилось вручную вызывать `warnings.warn`. Теперь есть стандартный декоратор `@warnings.deprecated`:

```python
import warnings

@warnings.deprecated("Use new_function() instead")
def old_function(x: int) -> int:
    return x * 2

def new_function(x: int) -> int:
    return x * 2

# При вызове old_function выбросит DeprecationWarning
result = old_function(5)  # DeprecationWarning: Use new_function() instead
```

Декоратор работает с функциями, методами и классами:

```python
@warnings.deprecated("Use NewProcessor class")
class OldProcessor:
    def run(self) -> None:
        pass

# Ошибка при попытке инстанцировать
proc = OldProcessor()  # DeprecationWarning: Use NewProcessor class
```

Статические анализаторы (mypy, pyright) понимают этот декоратор и подсвечивают вызовы устаревшего кода прямо в редакторе.

## copy.replace() — PEP 698

Новая функция `copy.replace()` позволяет создавать копию объекта с заменой части атрибутов — аналог `dataclasses.replace()`, но универсальный:

```python
import copy
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float
    z: float = 0.0

p1 = Point(1.0, 2.0, 3.0)
p2 = copy.replace(p1, y=10.0)  # Point(x=1.0, y=10.0, z=3.0)
print(p1)  # Point(x=1.0, y=2.0, z=3.0) — оригинал не изменился
print(p2)  # Point(x=1.0, y=10.0, z=3.0)
```

Функция работает со всеми классами, которые реализуют метод `__replace__`:

```python
class Config:
    def __init__(self, host: str, port: int, debug: bool = False):
        self.host = host
        self.port = port
        self.debug = debug

    def __replace__(self, **changes):
        return Config(
            host=changes.get("host", self.host),
            port=changes.get("port", self.port),
            debug=changes.get("debug", self.debug),
        )

cfg = Config("localhost", 8080)
dev_cfg = copy.replace(cfg, debug=True)
print(dev_cfg.debug)  # True
print(cfg.debug)      # False
```

`namedtuple` и `dataclass` поддерживают `__replace__` автоматически.

## os.process_cpu_count()

Старая функция `os.cpu_count()` возвращает число логических ядер процессора. Проблема в том, что в контейнерах и средах с ограниченными cgroup CPU `os.cpu_count()` всегда показывала полное число ядер хоста.

Python 3.13 добавляет `os.process_cpu_count()`, которая возвращает число CPU, доступных **текущему процессу**:

```python
import os

# Всего ядер на машине
print(os.cpu_count())           # Например, 16

# Ядер, доступных этому процессу (с учётом cgroup/affinity)
print(os.process_cpu_count())   # Например, 4 в Docker-контейнере
```

Это важно для корректного выбора числа воркеров в `ThreadPoolExecutor` и `ProcessPoolExecutor`:

```python
from concurrent.futures import ProcessPoolExecutor
import os

# Раньше os.cpu_count() завышал реальные ресурсы
workers = os.process_cpu_count() or 1
with ProcessPoolExecutor(max_workers=workers) as executor:
    results = list(executor.map(heavy_task, data))
```

## Изменения в locals()

До Python 3.13 поведение встроенной функции `locals()` в оптимизированных областях видимости (внутри функций) было формально не определено: изменения возвращённого словаря могли и не применяться к локальным переменным. Теперь это поведение стандартизировано.

```python
def example():
    x = 1
    local_vars = locals()
    local_vars["x"] = 99   # Изменение словаря НЕ влияет на x
    print(x)               # 1 — поведение теперь гарантировано

example()
```

Каждый вызов `locals()` внутри функции теперь гарантированно возвращает **новый снимок** локальных переменных на момент вызова, а не ссылку на внутреннее хранилище.

## Улучшения трассировки ошибок

Python 3.13 продолжает улучшать читаемость сообщений об ошибках, начатую в 3.11:

```python
# NameError теперь предлагает ближайшее похожее имя
my_variable = 42
print(my_varialbe)
# NameError: name 'my_varialbe' is not defined. Did you mean: 'my_variable'?
```

```python
# ImportError подсказывает правильное имя модуля
import collectins
# ModuleNotFoundError: No module named 'collectins'. Did you mean: 'collections'?
```

## Что удалено в Python 3.13

Версия убрала ряд устаревших вещей:

- Модули `aifc`, `audioop`, `cgi`, `cgitb`, `chunk`, `crypt`, `imghdr`, `mailcap`, `msilib`, `nis`, `nntplib`, `ossaudiodev`, `pipes`, `sndhdr`, `spwd`, `sunau`, `telnetlib`, `uu`, `xdrlib` — объявлены устаревшими ещё в 3.11, теперь удалены
- `locale.resetlocale()` — удалена
- Ряд давно устаревших методов в `unittest`

Перед обновлением рекомендуется проверить зависимости через:

```bash
python3.13 -W error::DeprecationWarning -m pytest
```

## Итог

Python 3.13 — эволюционный релиз с несколькими важными точками:

- **Новый REPL** сделает работу в терминале удобнее
- **Free-threaded режим** открывает путь к настоящему параллелизму, но пока для экспериментов
- **Типизация** стала точнее: `TypeVar` с дефолтами, `ReadOnly`, `TypeIs`
- **`copy.replace()`** унифицирует создание изменённых копий объектов
- **`os.process_cpu_count()`** решает давнюю проблему контейнерных сред

Для большинства проектов миграция с 3.11/3.12 на 3.13 пройдёт безболезненно — нужно только убедиться, что вы не используете удалённые модули.

Если вы хотите глубоко разобраться в Python — от основ до продвинутых концепций — записывайтесь на курс: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-3-13-new-features