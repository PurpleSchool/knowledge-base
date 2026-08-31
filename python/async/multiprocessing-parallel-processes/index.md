---
metaTitle: "Python multiprocessing: параллельные процессы"
metaDescription: "Подробное руководство по модулю multiprocessing в Python: Pool, Process, Queue, Lock, разделяемая память и практические примеры параллельных вычислений."
author: "Антон Ларичев"
title: "Python multiprocessing: параллельные процессы"
preview: "Как обойти GIL и запустить код по-настоящему параллельно с помощью модуля multiprocessing в Python."
---

Модуль `multiprocessing` позволяет создавать несколько процессов, каждый из которых получает собственный интерпретатор и адресное пространство. Это ключевое отличие от `threading`: поскольку каждый процесс обходит GIL (Global Interpreter Lock), вы получаете настоящий параллелизм на многоядерных процессорах — идеальный инструмент для CPU-bound задач.

## Почему multiprocessing, а не threading

GIL позволяет одновременно выполняться только одному потоку Python в рамках одного процесса. Для IO-bound задач (сетевые запросы, работа с файлами) это некритично — поток всё равно ждёт. Но для задач, загружающих процессор (математические вычисления, обработка изображений, парсинг данных), потоки не дают ускорения.

Процессы этой проблемы лишены: каждый запускает свой интерпретатор и выполняется на отдельном ядре.

```python
import multiprocessing
import threading
import time

def cpu_task(n):
    total = 0
    for i in range(n):
        total += i * i
    return total

# Замер с потоками
start = time.perf_counter()
threads = [threading.Thread(target=cpu_task, args=(10_000_000,)) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(f"Потоки: {time.perf_counter() - start:.2f}с")

# Замер с процессами
start = time.perf_counter()
processes = [multiprocessing.Process(target=cpu_task, args=(10_000_000,)) for _ in range(4)]
for p in processes:
    p.start()
for p in processes:
    p.join()
print(f"Процессы: {time.perf_counter() - start:.2f}с")
```

На 4-ядерной машине версия с процессами окажется примерно в 3–4 раза быстрее.

## Создание процессов с помощью Process

Класс `Process` — базовый строительный блок модуля. API намеренно повторяет `threading.Thread`.

```python
import multiprocessing
import os

def worker(name, value):
    pid = os.getpid()
    print(f"[{pid}] Воркер '{name}' получил значение: {value}")

if __name__ == "__main__":
    p1 = multiprocessing.Process(target=worker, args=("alpha", 42))
    p2 = multiprocessing.Process(target=worker, args=("beta", 99))

    p1.start()
    p2.start()

    p1.join()  # ждём завершения p1
    p2.join()  # ждём завершения p2

    print("Оба процесса завершены")
```

Обратите внимание на блок `if __name__ == "__main__"`. Он обязателен на Windows и macOS, где для создания процессов используется метод `spawn`: без этой проверки дочерние процессы рекурсивно запустят весь модуль.

### Получение результата из процесса

Процессы не разделяют память, поэтому вернуть значение через `return` нельзя. Стандартный способ — передать объект `Value` или `Queue` из разделяемой памяти:

```python
from multiprocessing import Process, Queue

def square(numbers, queue):
    for n in numbers:
        queue.put(n * n)

if __name__ == "__main__":
    q = Queue()
    numbers = [1, 2, 3, 4, 5]

    p = Process(target=square, args=(numbers, q))
    p.start()
    p.join()

    results = []
    while not q.empty():
        results.append(q.get())

    print(results)  # [1, 4, 9, 16, 25]
```

## Pool: пул процессов для массовых задач

`Pool` управляет пулом воркеров и автоматически распределяет задания между ними. Это наиболее удобный API для обработки коллекций данных.

### map и starmap

`pool.map` работает как встроенный `map`, но выполняет функцию параллельно:

```python
from multiprocessing import Pool
import math

def compute(x):
    return math.sqrt(x ** 2 + math.log(x + 1))

if __name__ == "__main__":
    data = list(range(1, 1_000_001))

    with Pool(processes=4) as pool:
        results = pool.map(compute, data)

    print(f"Первые пять результатов: {results[:5]}")
```

Для функций с несколькими аргументами используйте `starmap`:

```python
from multiprocessing import Pool

def power(base, exp):
    return base ** exp

if __name__ == "__main__":
    tasks = [(2, 10), (3, 5), (5, 3), (10, 2)]

    with Pool() as pool:  # без аргумента — число ядер из os.cpu_count()
        results = pool.starmap(power, tasks)

    print(results)  # [1024, 243, 125, 100]
```

### apply_async: асинхронные задачи с колбэками

`apply_async` не блокирует главный процесс и принимает колбэки:

```python
from multiprocessing import Pool
import time

def slow_task(n):
    time.sleep(1)
    return n * n

def on_done(result):
    print(f"Готово: {result}")

def on_error(exc):
    print(f"Ошибка: {exc}")

if __name__ == "__main__":
    with Pool(4) as pool:
        futures = [
            pool.apply_async(slow_task, args=(i,), callback=on_done, error_callback=on_error)
            for i in range(8)
        ]
        # Ждём все задачи
        for f in futures:
            f.wait()
```

### imap и imap_unordered

Для потоковой обработки больших наборов данных, когда не нужно держать весь результат в памяти:

```python
from multiprocessing import Pool

def process_line(line):
    return line.strip().upper()

if __name__ == "__main__":
    lines = [f"строка {i}\n" for i in range(100)]

    with Pool(4) as pool:
        # imap_unordered возвращает результаты по мере готовности
        for result in pool.imap_unordered(process_line, lines, chunksize=10):
            print(result)
```

`chunksize` позволяет передавать воркерам сразу несколько задач, снижая накладные расходы на межпроцессное взаимодействие.

## Взаимодействие между процессами

### Queue: очередь сообщений

`multiprocessing.Queue` — потокобезопасная и процессобезопасная очередь, построенная на пайпах и блокировках:

```python
from multiprocessing import Process, Queue
import time

def producer(queue, items):
    for item in items:
        queue.put(item)
        print(f"Добавлено: {item}")
        time.sleep(0.1)
    queue.put(None)  # сигнал завершения

def consumer(queue):
    while True:
        item = queue.get()
        if item is None:
            break
        print(f"Обработано: {item * 2}")

if __name__ == "__main__":
    q = Queue()
    data = [1, 2, 3, 4, 5]

    p_prod = Process(target=producer, args=(q, data))
    p_cons = Process(target=consumer, args=(q,))

    p_prod.start()
    p_cons.start()

    p_prod.join()
    p_cons.join()
```

### Pipe: двунаправленный канал

`Pipe` создаёт пару объектов соединения и чуть быстрее `Queue` при связи двух процессов:

```python
from multiprocessing import Process, Pipe

def child(conn):
    message = conn.recv()
    conn.send(f"Ответ на '{message}': привет от дочернего процесса")
    conn.close()

if __name__ == "__main__":
    parent_conn, child_conn = Pipe()

    p = Process(target=child, args=(child_conn,))
    p.start()

    parent_conn.send("запрос")
    print(parent_conn.recv())

    p.join()
```

## Синхронизация: Lock и Semaphore

Даже в разных процессах возможны гонки при доступе к разделяемым ресурсам (файлам, базам данных). `Lock` гарантирует взаимное исключение:

```python
from multiprocessing import Process, Lock
import time

def write_to_file(lock, filename, text):
    with lock:
        with open(filename, "a") as f:
            f.write(text + "\n")
        time.sleep(0.01)

if __name__ == "__main__":
    lock = Lock()
    filename = "output.txt"

    processes = [
        Process(target=write_to_file, args=(lock, filename, f"Запись от процесса {i}"))
        for i in range(10)
    ]

    for p in processes:
        p.start()
    for p in processes:
        p.join()
```

## Разделяемая память: Value и Array

Для обмена простыми данными без очереди используйте `Value` и `Array` — объекты в разделяемой памяти:

```python
from multiprocessing import Process, Value, Array
import ctypes

def accumulate(shared_sum, lock, numbers):
    for n in numbers:
        with lock:
            shared_sum.value += n

if __name__ == "__main__":
    from multiprocessing import Lock

    total = Value(ctypes.c_double, 0.0)
    lock = Lock()

    chunks = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    processes = [
        Process(target=accumulate, args=(total, lock, chunk))
        for chunk in chunks
    ]

    for p in processes:
        p.start()
    for p in processes:
        p.join()

    print(f"Сумма: {total.value}")  # 45.0
```

`Array` работает аналогично, но хранит последовательность значений одного типа.

## Manager: разделяемые сложные объекты

Когда нужны словари, списки или пользовательские объекты в разделяемой памяти, используйте `Manager`:

```python
from multiprocessing import Process, Manager

def update_stats(stats, key, value):
    stats[key] = value

if __name__ == "__main__":
    with Manager() as manager:
        shared_dict = manager.dict()

        processes = [
            Process(target=update_stats, args=(shared_dict, f"worker_{i}", i * 10))
            for i in range(5)
        ]

        for p in processes:
            p.start()
        for p in processes:
            p.join()

        print(dict(shared_dict))
        # {'worker_0': 0, 'worker_1': 10, 'worker_2': 20, ...}
```

Объекты `Manager` передаются через прокси-объекты и медленнее `Value`/`Array`, зато поддерживают произвольные структуры данных.

## Практический пример: параллельная обработка изображений

Сведём всё вместе в реалистичной задаче — пакетное изменение размера изображений:

```python
from multiprocessing import Pool, cpu_count
from pathlib import Path

def resize_image(args):
    """Принимает кортеж (src_path, dst_path, size) для совместимости с starmap."""
    try:
        from PIL import Image
        src, dst, size = args
        img = Image.open(src)
        img.thumbnail(size)
        img.save(dst)
        return str(dst), True
    except Exception as e:
        return str(src), False

def batch_resize(input_dir, output_dir, size=(800, 600)):
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    tasks = [
        (str(img), str(output_path / img.name), size)
        for img in input_path.glob("*.jpg")
    ]

    workers = min(cpu_count(), len(tasks))
    with Pool(workers) as pool:
        results = pool.map(resize_image, tasks)

    success = sum(1 for _, ok in results if ok)
    print(f"Обработано {success}/{len(tasks)} изображений")
    return results

if __name__ == "__main__":
    batch_resize("./images/input", "./images/output")
```

## Рекомендации и подводные камни

### Когда использовать multiprocessing

- CPU-bound задачи: числодробилки, парсинг, компрессия, ML-инференс
- Изоляция: нужно, чтобы сбой одного воркера не убил весь процесс
- Обход GIL без перехода на C-расширения

### Когда лучше выбрать другой инструмент

- IO-bound задачи (сетевые запросы, файлы) — используйте `asyncio` или `threading`
- Очень короткие задачи — накладные расходы на создание процесса (50–200 мс) перевесят выгоду
- Нужна тонкая синхронизация между параллельными задачами — `asyncio` проще в отладке

### Типичные ошибки

```python
# НЕВЕРНО: глобальное состояние не передаётся в дочерние процессы
counter = 0

def bad_worker():
    global counter
    counter += 1  # изменение не будет видно в родительском процессе

# ВЕРНО: передавайте данные явно через аргументы, Queue или Value
from multiprocessing import Value

shared_counter = Value('i', 0)

def good_worker(counter):
    with counter.get_lock():
        counter.value += 1
```

```python
# НЕВЕРНО на Windows/macOS: код верхнего уровня выполнится в каждом дочернем процессе
pool = Pool(4)  # без if __name__ == "__main__"

# ВЕРНО:
if __name__ == "__main__":
    pool = Pool(4)
```

### Выбор количества процессов

```python
import os

# Для CPU-bound задач
workers = os.cpu_count()  # или cpu_count() - 1, чтобы оставить ядро ОС

# Для IO-bound задач внутри процессов (редкий сценарий)
workers = os.cpu_count() * 2
```

## Краткая сводка методов Pool

| Метод | Блокирует | Возвращает | Когда использовать |
|---|---|---|---|
| `map` | да | список | обработка всей коллекции |
| `starmap` | да | список | функция с несколькими аргументами |
| `imap` | нет | итератор (по порядку) | большие данные, потоковая обработка |
| `imap_unordered` | нет | итератор (произвольный порядок) | когда важна скорость, не порядок |
| `apply_async` | нет | `AsyncResult` | единичная задача с колбэком |

Модуль `multiprocessing` — мощный и при этом доступный инструмент. Разобравшись с ним, вы сможете эффективно загружать все ядра процессора и значительно ускорять тяжёлые вычисления без переписывания кода на C или переключения на другой язык.

Чтобы освоить параллельное и асинхронное программирование на Python в связке с реальными проектами, приходите на курс — [Python-разработчик на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-multiprocessing).