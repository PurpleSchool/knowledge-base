---
metaTitle: "Python functools: partial, lru_cache, reduce, wraps"
metaDescription: "Полное руководство по модулю functools в Python: partial, reduce, lru_cache, wraps, total_ordering с практическими примерами"
author: "Антон Ларичев"
title: "Python functools — встроенные инструменты для функций"
preview: "Разбираем модуль functools: как использовать partial, lru_cache, reduce, wraps и другие инструменты для работы с функциями высшего порядка в Python."
---

Модуль `functools` входит в стандартную библиотеку Python и предоставляет набор инструментов для работы с функциями высшего порядка — то есть функциями, которые принимают или возвращают другие функции. Эти инструменты помогают писать более лаконичный, производительный и выразительный код.

## Подключение модуля

```python
import functools
```

Либо импортировать конкретные объекты:

```python
from functools import partial, reduce, lru_cache, wraps
```

## partial — частичное применение функций

`functools.partial` позволяет зафиксировать часть аргументов функции и получить новую функцию с меньшим числом параметров. Это называется частичным применением (partial application).

```python
from functools import partial

def power(base, exponent):
    return base ** exponent

square = partial(power, exponent=2)
cube = partial(power, exponent=3)

print(square(5))   # 25
print(cube(3))     # 27
```

Практический пример — настройка логгера:

```python
from functools import partial
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

debug = partial(logger.log, logging.DEBUG)
warning = partial(logger.log, logging.WARNING)

debug("Это отладочное сообщение")
warning("Это предупреждение")
```

`partial` также полезен при работе с `map`, `filter` и `sorted`:

```python
from functools import partial

def multiply(x, factor):
    return x * factor

double = partial(multiply, factor=2)

numbers = [1, 2, 3, 4, 5]
result = list(map(double, numbers))
print(result)  # [2, 4, 6, 8, 10]
```

### Атрибуты объекта partial

Объект `partial` хранит исходную функцию и зафиксированные аргументы:

```python
from functools import partial

def greet(greeting, name):
    return f"{greeting}, {name}!"

hello = partial(greet, "Привет")

print(hello.func)    # <function greet at 0x...>
print(hello.args)    # ('Привет',)
print(hello.keywords) # {}

print(hello("Алексей"))  # Привет, Алексей!
```

## reduce — свёртка последовательности

`functools.reduce` применяет функцию к элементам последовательности накопительно, сводя её к единственному значению.

```python
from functools import reduce

numbers = [1, 2, 3, 4, 5]

# Сумма всех элементов
total = reduce(lambda acc, x: acc + x, numbers)
print(total)  # 15

# Произведение всех элементов
product = reduce(lambda acc, x: acc * x, numbers)
print(product)  # 120
```

`reduce` принимает необязательный третий аргумент — начальное значение аккумулятора:

```python
from functools import reduce

numbers = [1, 2, 3, 4, 5]

# Начальное значение 100
result = reduce(lambda acc, x: acc + x, numbers, 100)
print(result)  # 115

# Работа с пустым списком без начального значения вызывает ошибку
try:
    reduce(lambda acc, x: acc + x, [])
except TypeError as e:
    print(e)  # reduce() of empty iterable with no initial value

# С начальным значением — безопасно
result = reduce(lambda acc, x: acc + x, [], 0)
print(result)  # 0
```

Практический пример — построение словаря из списка:

```python
from functools import reduce

users = [
    {"id": 1, "name": "Анна"},
    {"id": 2, "name": "Борис"},
    {"id": 3, "name": "Виктор"},
]

users_by_id = reduce(
    lambda acc, user: {**acc, user["id"]: user},
    users,
    {}
)

print(users_by_id[2])  # {'id': 2, 'name': 'Борис'}
```

## lru_cache — кэширование результатов функции

`functools.lru_cache` — декоратор, добавляющий кэш к функции по принципу LRU (Least Recently Used). Функция вычисляется только при первом вызове с конкретными аргументами, последующие вызовы возвращают кэшированный результат.

```python
from functools import lru_cache
import time

@lru_cache(maxsize=128)
def slow_function(n):
    time.sleep(1)  # имитация тяжёлых вычислений
    return n * n

start = time.time()
print(slow_function(10))  # вычисляет — 1 секунда
print(slow_function(10))  # из кэша — мгновенно
print(slow_function(20))  # вычисляет — 1 секунда
print(f"Время: {time.time() - start:.1f}s")  # ~2.0s
```

Классический пример — числа Фибоначчи:

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(50))   # 12586269025 — мгновенно
print(fibonacci(100))  # 354224848179261915075 — мгновенно
```

Без `lru_cache` вычисление `fibonacci(50)` потребовало бы триллионы рекурсивных вызовов.

### Управление кэшем

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def compute(x, y):
    return x ** y

compute(2, 10)
compute(3, 5)

# Статистика кэша
info = compute.cache_info()
print(info)  # CacheInfo(hits=0, misses=2, maxsize=128, currsize=2)

# Очистить кэш
compute.cache_clear()
print(compute.cache_info())  # CacheInfo(hits=0, misses=0, maxsize=128, currsize=0)
```

### functools.cache — упрощённый вариант (Python 3.9+)

Эквивалентен `lru_cache(maxsize=None)`, но проще в написании:

```python
from functools import cache

@cache
def factorial(n):
    return n * factorial(n - 1) if n else 1

print(factorial(10))  # 3628800
```

### Ограничение: только хэшируемые аргументы

Аргументы функции с `lru_cache` должны быть хэшируемыми (числа, строки, кортежи). Списки и словари не подходят:

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def process(data):
    return sum(data)

# Правильно — кортеж хэшируемый
process((1, 2, 3))

# Неправильно — список вызовет TypeError
# process([1, 2, 3])  # TypeError: unhashable type: 'list'
```

## wraps — сохранение метаданных декорируемой функции

При написании декораторов обёрточная функция подменяет исходную, теряя её `__name__`, `__doc__` и другие атрибуты. `functools.wraps` устраняет эту проблему.

```python
from functools import wraps

def my_decorator(func):
    def wrapper(*args, **kwargs):
        print("До вызова")
        result = func(*args, **kwargs)
        print("После вызова")
        return result
    return wrapper

@my_decorator
def greet(name):
    """Приветствует пользователя."""
    return f"Привет, {name}!"

print(greet.__name__)  # wrapper — неправильно!
print(greet.__doc__)   # None — документация потеряна!
```

С `functools.wraps`:

```python
from functools import wraps

def my_decorator(func):
    @wraps(func)  # сохраняет метаданные исходной функции
    def wrapper(*args, **kwargs):
        print("До вызова")
        result = func(*args, **kwargs)
        print("После вызова")
        return result
    return wrapper

@my_decorator
def greet(name):
    """Приветствует пользователя."""
    return f"Привет, {name}!"

print(greet.__name__)  # greet — правильно!
print(greet.__doc__)   # Приветствует пользователя.
print(greet.__wrapped__)  # <function greet at 0x...> — исходная функция
```

`@wraps` особенно важен для совместимости с инструментами интроспекции, документации (Sphinx, pdoc) и тестирования.

## total_ordering — автодополнение операторов сравнения

Декоратор `functools.total_ordering` позволяет определить только `__eq__` и один из методов `__lt__`, `__le__`, `__gt__`, `__ge__` — остальные методы сравнения будут сгенерированы автоматически.

```python
from functools import total_ordering

@total_ordering
class Student:
    def __init__(self, name, grade):
        self.name = name
        self.grade = grade

    def __eq__(self, other):
        if not isinstance(other, Student):
            return NotImplemented
        return self.grade == other.grade

    def __lt__(self, other):
        if not isinstance(other, Student):
            return NotImplemented
        return self.grade < other.grade

    def __repr__(self):
        return f"Student({self.name!r}, {self.grade})"

alice = Student("Алиса", 90)
bob = Student("Борис", 75)
charlie = Student("Виктор", 90)

print(alice > bob)       # True  — сгенерировано автоматически
print(alice >= charlie)  # True  — сгенерировано автоматически
print(bob <= alice)      # True  — сгенерировано автоматически

students = [alice, bob, charlie]
print(sorted(students))  # [Student('Борис', 75), Student('Алиса', 90), Student('Виктор', 90)]
```

## cached_property — кэшируемое свойство

`functools.cached_property` (Python 3.8+) вычисляет значение свойства только один раз и сохраняет его в словаре экземпляра. При повторных обращениях возвращается сохранённое значение.

```python
from functools import cached_property
import math

class Circle:
    def __init__(self, radius):
        self.radius = radius

    @cached_property
    def area(self):
        print("Вычисляю площадь...")
        return math.pi * self.radius ** 2

    @cached_property
    def circumference(self):
        print("Вычисляю длину окружности...")
        return 2 * math.pi * self.radius

c = Circle(5)
print(c.area)           # Вычисляю площадь... → 78.53...
print(c.area)           # (из кэша, без вычисления) → 78.53...
print(c.circumference)  # Вычисляю длину окружности... → 31.41...
```

В отличие от `@property`, `cached_property` не вызывается при каждом обращении. В отличие от `lru_cache`, работает с нехэшируемыми аргументами и привязан к экземпляру объекта.

## singledispatch — обобщённые функции

`functools.singledispatch` позволяет создавать функции, поведение которых зависит от типа первого аргумента — аналог перегрузки методов.

```python
from functools import singledispatch

@singledispatch
def process(value):
    raise TypeError(f"Неподдерживаемый тип: {type(value).__name__}")

@process.register(int)
def _(value):
    return f"Целое число: {value * 2}"

@process.register(str)
def _(value):
    return f"Строка: {value.upper()}"

@process.register(list)
def _(value):
    return f"Список из {len(value)} элементов"

print(process(42))              # Целое число: 84
print(process("hello"))         # Строка: HELLO
print(process([1, 2, 3]))       # Список из 3 элементов
print(process(3.14))            # TypeError: Неподдерживаемый тип: float
```

Можно регистрировать несколько типов для одной реализации:

```python
from functools import singledispatch

@singledispatch
def to_string(value):
    return str(value)

@to_string.register(list)
@to_string.register(tuple)
def _(value):
    return ", ".join(str(item) for item in value)

print(to_string([1, 2, 3]))   # 1, 2, 3
print(to_string((4, 5, 6)))   # 4, 5, 6
print(to_string(42))          # 42
```

## reduce vs встроенные функции

Во многих случаях `reduce` можно заменить встроенными функциями Python, которые работают быстрее:

```python
from functools import reduce
from operator import add, mul

numbers = [1, 2, 3, 4, 5]

# Вместо reduce для суммы:
print(sum(numbers))                         # 15 — предпочтительно
print(reduce(add, numbers))                 # 15

# Вместо reduce для максимума:
print(max(numbers))                         # 5 — предпочтительно
print(reduce(lambda a, b: a if a > b else b, numbers))  # 5

# reduce незаменим для нестандартных операций:
print(reduce(lambda acc, x: acc * (x + 1), numbers, 1))  # 720
```

## Комбинирование инструментов functools

Наиболее мощные решения получаются при совместном использовании инструментов модуля:

```python
from functools import lru_cache, wraps
import time

def timed_cache(maxsize=128):
    """Декоратор кэша с измерением времени первого вычисления."""
    def decorator(func):
        @lru_cache(maxsize=maxsize)
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            result = func(*args, **kwargs)
            elapsed = time.perf_counter() - start
            print(f"{func.__name__}({args}) вычислено за {elapsed:.4f}s")
            return result
        return wrapper
    return decorator

@timed_cache(maxsize=64)
def heavy_computation(n):
    """Тяжёлое вычисление."""
    return sum(i ** 2 for i in range(n))

heavy_computation(10000)  # вычислено за 0.0012s
heavy_computation(10000)  # из кэша, без вывода
```

## Итоги

Модуль `functools` предоставляет несколько ключевых инструментов:

- `partial` — фиксирует часть аргументов функции, создавая новую специализированную функцию
- `reduce` — сворачивает последовательность к одному значению через накопительное применение функции
- `lru_cache` / `cache` — кэширует результаты функции, ускоряя повторные вычисления
- `wraps` — сохраняет метаданные оригинальной функции при написании декораторов
- `total_ordering` — автоматически дополняет операторы сравнения в классах
- `cached_property` — вычисляет свойство один раз и кэширует результат в экземпляре
- `singledispatch` — реализует перегрузку функций по типу первого аргумента

Эти инструменты особенно ценны при работе с функциональными паттернами, оптимизации производительности и построении гибких API.

Для углублённого изучения Python и функционального программирования смотрите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=functools-builtin-tools