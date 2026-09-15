---
metaTitle: "Python concurrent.futures — параллельные задачи"
metaDescription: "Разбираем модуль concurrent.futures в Python: ThreadPoolExecutor, ProcessPoolExecutor, Future, map и практические примеры параллельного выполнения задач."
author: "Антон Ларичев"
title: "concurrent.futures: параллельные задачи в Python"
preview: "Как запускать задачи параллельно в Python с помощью concurrent.futures: ThreadPoolExecutor, ProcessPoolExecutor и работа с результатами через Future."
---

## Что такое concurrent.futures

Модуль `concurrent.futures` — стандартная библиотека Python для запуска задач в параллельных потоках или процессах. Он появился в Python 3.2 и предлагает единый высокоуровневый интерфейс поверх `threading` и `multiprocessing`, скрывая рутинное управление пулами и синхронизацию.

Главная идея модуля: вы отправляете задачу на выполнение и получаете объект `Future` — обещание результата, который появится позже. Пока задача выполняется, основной поток может делать что угодно.

## Два исполнителя: потоки и процессы

Модуль предоставляет два класса-исполнителя:

- **`ThreadPoolExecutor`** — запускает задачи в отдельных потоках. Подходит для I/O-bound операций: сетевые запросы, работа с файлами, запросы к БД. Из-за GIL потоки не дают прироста на CPU-bound задачах.
- **`ProcessPoolExecutor`** — запускает задачи в отдельных процессах. Обходит GIL, поэтому подходит для CPU-bound вычислений: обработка изображений, парсинг данных, математические операции.

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
```

## ThreadPoolExecutor

### Базовый пример

```python
import time
from concurrent.futures import ThreadPoolExecutor

def fetch_data(url: str) -> str:
    time.sleep(1)  # имитация сетевого запроса
    return f"Данные с {url}"

urls = [
    "https://api.example.com/users",
    "https://api.example.com/products",
    "https://api.example.com/orders",
]

start = time.perf_counter()

with ThreadPoolExecutor(max_workers=3) as executor:
    futures = [executor.submit(fetch_data, url) for url in urls]
    results = [f.result() for f in futures]

elapsed = time.perf_counter() - start
print(f"Выполнено за {elapsed:.2f}с")  # ~1.00с вместо 3.00с
print(results)
```

Конструкция `with` гарантирует, что все задачи завершатся до выхода из блока — `__exit__` вызывает `shutdown(wait=True)` автоматически.

### Метод submit и объект Future

`executor.submit(fn, *args, **kwargs)` немедленно возвращает объект `Future`, не дожидаясь результата.

```python
from concurrent.futures import ThreadPoolExecutor

def square(n: int) -> int:
    return n * n

with ThreadPoolExecutor(max_workers=4) as executor:
    future = executor.submit(square, 10)

    # Future ещё может выполняться
    print(future.done())     # False или True
    print(future.running())  # True или False

    result = future.result()  # блокируется до готовности
    print(result)             # 100
```

Полезные методы `Future`:

| Метод | Описание |
|---|---|
| `result(timeout=None)` | Возвращает результат, блокирует поток до готовности |
| `exception(timeout=None)` | Возвращает исключение, если задача упала |
| `done()` | `True`, если задача завершена (успешно или с ошибкой) |
| `running()` | `True`, если задача сейчас выполняется |
| `cancel()` | Пытается отменить задачу (только если ещё не запущена) |
| `add_done_callback(fn)` | Регистрирует коллбэк, вызываемый при завершении |

### Обработка исключений

Если задача выбросила исключение, оно "заморожено" в `Future` и пробрасывается при вызове `.result()`:

```python
from concurrent.futures import ThreadPoolExecutor

def risky(x: int) -> int:
    if x == 0:
        raise ValueError("Деление на ноль")
    return 100 // x

with ThreadPoolExecutor() as executor:
    futures = {executor.submit(risky, n): n for n in [5, 0, 2]}

    for future, n in futures.items():
        try:
            print(f"risky({n}) = {future.result()}")
        except ValueError as e:
            print(f"risky({n}) упал: {e}")
```

Вывод:
```
risky(5) = 20
risky(0) упал: Деление на ноль
risky(2) = 50
```

## Метод map — удобная итерация

`executor.map(fn, iterable)` — аналог встроенного `map`, но выполняет функцию параллельно. Возвращает итератор результатов в том же порядке, что и входные данные.

```python
import time
from concurrent.futures import ThreadPoolExecutor

def process(item: int) -> int:
    time.sleep(0.5)
    return item ** 2

data = list(range(10))

with ThreadPoolExecutor(max_workers=5) as executor:
    results = list(executor.map(process, data))

print(results)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

Важное отличие `map` от ручного `submit`: если одна из задач выбросила исключение, оно пробросится в момент итерации по результату именно этой задачи, а не сразу.

```python
from concurrent.futures import ThreadPoolExecutor

def divide(n: int) -> float:
    return 10 / n

with ThreadPoolExecutor() as executor:
    try:
        for result in executor.map(divide, [2, 1, 0, 5]):
            print(result)
    except ZeroDivisionError:
        print("Поймали ошибку")
```

## as_completed — обрабатывать по мере готовности

Функция `as_completed` принимает список `Future` и возвращает их по одному — в порядке завершения, а не в порядке отправки. Это полезно, когда хочется обрабатывать результат сразу, не ждя остальных.

```python
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed

def slow_task(name: str) -> str:
    delay = random.uniform(0.5, 2.0)
    time.sleep(delay)
    return f"{name} завершён за {delay:.2f}с"

tasks = ["задача-A", "задача-B", "задача-C", "задача-D"]

with ThreadPoolExecutor(max_workers=4) as executor:
    future_to_name = {executor.submit(slow_task, t): t for t in tasks}

    for future in as_completed(future_to_name):
        name = future_to_name[future]
        try:
            result = future.result()
            print(f"Готово: {result}")
        except Exception as e:
            print(f"{name} упал: {e}")
```

Здесь используется словарь `future_to_name`, чтобы по объекту `Future` восстановить исходный идентификатор задачи.

## ProcessPoolExecutor — обход GIL

Для CPU-bound задач потоки не дают ускорения из-за GIL. `ProcessPoolExecutor` запускает каждую задачу в отдельном процессе.

```python
import math
from concurrent.futures import ProcessPoolExecutor

def is_prime(n: int) -> bool:
    if n < 2:
        return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            return False
    return True

numbers = [999_999_937, 999_999_929, 999_999_893, 999_999_883]

if __name__ == "__main__":  # обязательно для Windows и spawn-режима
    with ProcessPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(is_prime, numbers))

    for n, prime in zip(numbers, results):
        print(f"{n}: {'простое' if prime else 'составное'}")
```

Важно: при использовании `ProcessPoolExecutor` функции и аргументы должны быть сериализуемы через `pickle`. Лямбды и локальные функции сериализовать нельзя.

```python
# Это не работает с ProcessPoolExecutor:
with ProcessPoolExecutor() as executor:
    executor.submit(lambda x: x * 2, 5)  # PicklingError
```

## Ограничение числа воркеров

По умолчанию:
- `ThreadPoolExecutor` создаёт `min(32, os.cpu_count() + 4)` потоков
- `ProcessPoolExecutor` создаёт `os.cpu_count()` процессов

Для I/O-bound задач можно поднять число потоков, для CPU-bound — оставить по числу ядер или чуть меньше:

```python
import os
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# Много потоков для I/O
with ThreadPoolExecutor(max_workers=50) as executor:
    pass

# Процессы по числу ядер
with ProcessPoolExecutor(max_workers=os.cpu_count()) as executor:
    pass
```

## Таймаут на получение результата

Метод `.result(timeout=...)` бросает `TimeoutError`, если задача не завершилась за указанное время:

```python
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError

def long_task() -> str:
    time.sleep(10)
    return "готово"

with ThreadPoolExecutor() as executor:
    future = executor.submit(long_task)
    try:
        result = future.result(timeout=2)
    except TimeoutError:
        print("Задача не успела за 2 секунды")
        future.cancel()  # попробуем отменить
```

## wait — ждать подмножество Future

Функция `wait` позволяет ждать завершения части задач, а не всех:

```python
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
import time

def task(n: int) -> int:
    time.sleep(n)
    return n

with ThreadPoolExecutor() as executor:
    futures = [executor.submit(task, t) for t in [3, 1, 2]]

    done, not_done = wait(futures, return_when=FIRST_COMPLETED)

    print(f"Завершено: {len(done)}, ещё выполняется: {len(not_done)}")
    for f in done:
        print(f"Результат: {f.result()}")
```

Значения `return_when`:
- `FIRST_COMPLETED` — вернуть, как только завершится первая задача
- `FIRST_EXCEPTION` — вернуть при первом исключении
- `ALL_COMPLETED` — ждать всех (поведение по умолчанию)

## Практический пример: параллельная загрузка файлов

```python
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

def download(url: str, dest: Path) -> str:
    urllib.request.urlretrieve(url, dest)
    return f"Скачан: {dest.name} ({dest.stat().st_size} байт)"

files = [
    ("https://example.com/file1.csv", Path("/tmp/file1.csv")),
    ("https://example.com/file2.csv", Path("/tmp/file2.csv")),
    ("https://example.com/file3.csv", Path("/tmp/file3.csv")),
]

with ThreadPoolExecutor(max_workers=5) as executor:
    future_map = {
        executor.submit(download, url, dest): dest.name
        for url, dest in files
    }

    for future in as_completed(future_map):
        name = future_map[future]
        try:
            print(future.result())
        except Exception as e:
            print(f"Ошибка при скачивании {name}: {e}")
```

## Практический пример: параллельная обработка данных

```python
from concurrent.futures import ProcessPoolExecutor
from typing import List

def analyze_chunk(chunk: List[int]) -> dict:
    return {
        "sum": sum(chunk),
        "min": min(chunk),
        "max": max(chunk),
        "count": len(chunk),
    }

def split_chunks(data: List[int], n: int) -> List[List[int]]:
    size = len(data) // n
    return [data[i * size:(i + 1) * size] for i in range(n)]

if __name__ == "__main__":
    big_data = list(range(1_000_000))
    chunks = split_chunks(big_data, 4)

    with ProcessPoolExecutor(max_workers=4) as executor:
        chunk_stats = list(executor.map(analyze_chunk, chunks))

    total = {
        "sum": sum(s["sum"] for s in chunk_stats),
        "min": min(s["min"] for s in chunk_stats),
        "max": max(s["max"] for s in chunk_stats),
        "count": sum(s["count"] for s in chunk_stats),
    }
    print(total)
```

## Когда что использовать

| Сценарий | Исполнитель |
|---|---|
| HTTP-запросы, REST API | `ThreadPoolExecutor` |
| Работа с файлами и дисками | `ThreadPoolExecutor` |
| Запросы к базам данных | `ThreadPoolExecutor` |
| Математические вычисления | `ProcessPoolExecutor` |
| Обработка изображений/видео | `ProcessPoolExecutor` |
| Парсинг больших файлов | `ProcessPoolExecutor` |
| Смешанные задачи | Комбинируйте оба |

## Совместное использование с asyncio

Если вы работаете в асинхронном коде и хотите запустить блокирующую функцию через `concurrent.futures`, используйте `loop.run_in_executor`:

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time

def blocking_io(n: int) -> int:
    time.sleep(1)
    return n * 10

async def main() -> None:
    loop = asyncio.get_running_loop()

    with ThreadPoolExecutor(max_workers=3) as pool:
        tasks = [
            loop.run_in_executor(pool, blocking_io, i)
            for i in range(5)
        ]
        results = await asyncio.gather(*tasks)

    print(results)

asyncio.run(main())
```

Таким образом блокирующие функции не блокируют event loop и выполняются параллельно в пуле потоков.

## Типичные ошибки

**Не защищать точку входа при использовании ProcessPoolExecutor на Windows:**
```python
# Всегда оборачивайте в if __name__ == "__main__":
if __name__ == "__main__":
    with ProcessPoolExecutor() as executor:
        ...
```

**Передавать несериализуемые объекты в ProcessPoolExecutor:**
```python
# Ошибка — лямбды не сериализуются pickle
executor.submit(lambda x: x * 2, 5)

# Правильно — именованная функция на уровне модуля
def double(x):
    return x * 2

executor.submit(double, 5)
```

**Не обрабатывать исключения из Future:**
```python
# Плохо — исключение молча теряется
executor.submit(risky_fn, data)

# Хорошо — всегда проверяйте .result() или .exception()
future = executor.submit(risky_fn, data)
try:
    result = future.result()
except Exception as e:
    print(f"Задача упала: {e}")
```

## Итог

`concurrent.futures` — лаконичный и мощный инструмент для параллельного выполнения задач в Python. Основные выводы:

- `ThreadPoolExecutor` ускоряет I/O-bound задачи, обходя блокировки ожидания
- `ProcessPoolExecutor` ускоряет CPU-bound задачи, обходя GIL через отдельные процессы
- `submit` даёт тонкий контроль через объекты `Future`, `map` — удобен для однородных задач
- `as_completed` позволяет реагировать на результаты немедленно, по мере готовности
- Контекстный менеджер `with` — правильный способ управлять жизненным циклом пула

Чтобы глубже разобраться в асинхронном программировании и параллельных вычислениях в Python, записывайтесь на курс PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=concurrent-futures
