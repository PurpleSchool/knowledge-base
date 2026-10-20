---
metaTitle: "asyncio Queue и паттерн Producer-Consumer в Python"
metaDescription: "Разбираем asyncio.Queue в Python: паттерны Producer-Consumer, множественные воркеры, таймауты, приоритеты и backpressure с практическими примерами."
author: "Антон Ларичев"
title: "asyncio Queue: паттерны Producer-Consumer"
preview: "Как использовать asyncio.Queue для реализации паттерна Producer-Consumer: от базового примера до продвинутых техник с воркерами и backpressure."
---

## Зачем нужна asyncio.Queue

В асинхронных приложениях часто возникает задача: одна часть кода производит данные, другая — обрабатывает. Если производитель работает быстрее потребителя или наоборот, нужен буфер. `asyncio.Queue` решает именно эту задачу: это потокобезопасный (в рамках одного event loop) FIFO-буфер, спроектированный специально для корутин.

Паттерн Producer-Consumer позволяет:
- разделить получение данных и их обработку;
- управлять нагрузкой через ограничение размера очереди;
- масштабировать количество воркеров без изменения логики производителя.

## Базовый паттерн Producer-Consumer

Начнём с простейшего примера: один производитель кладёт задачи в очередь, один потребитель их забирает.

```python
import asyncio

async def producer(queue: asyncio.Queue, items: list):
    for item in items:
        await queue.put(item)
        print(f"Produced: {item}")
        await asyncio.sleep(0.1)  # имитация работы
    await queue.put(None)  # сигнал завершения

async def consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        if item is None:
            break
        print(f"Consumed: {item}")
        await asyncio.sleep(0.3)  # обработка медленнее
        queue.task_done()

async def main():
    queue = asyncio.Queue()
    items = list(range(1, 6))

    await asyncio.gather(
        producer(queue, items),
        consumer(queue),
    )

asyncio.run(main())
```

Ключевые методы:
- `queue.put(item)` — добавить элемент (блокирует, если очередь полная);
- `queue.get()` — извлечь элемент (блокирует, если очередь пустая);
- `queue.task_done()` — сообщить, что элемент обработан;
- `queue.join()` — дождаться обработки всех элементов.

## Множественные воркеры

Реальная сила паттерна раскрывается при нескольких потребителях. Производитель не знает, сколько воркеров работает, — он просто кладёт задачи в очередь.

```python
import asyncio
import random

async def producer(queue: asyncio.Queue, n_items: int):
    for i in range(n_items):
        delay = random.uniform(0.05, 0.2)
        await asyncio.sleep(delay)
        await queue.put(i)
        print(f"[Producer] put {i}")

async def worker(worker_id: int, queue: asyncio.Queue):
    while True:
        item = await queue.get()
        try:
            process_time = random.uniform(0.1, 0.5)
            await asyncio.sleep(process_time)
            print(f"[Worker-{worker_id}] processed {item} in {process_time:.2f}s")
        finally:
            queue.task_done()

async def main():
    queue = asyncio.Queue(maxsize=10)
    n_workers = 3
    n_items = 15

    workers = [
        asyncio.create_task(worker(i, queue))
        for i in range(n_workers)
    ]

    await producer(queue, n_items)
    await queue.join()  # ждём обработки всех задач

    for w in workers:
        w.cancel()
    await asyncio.gather(*workers, return_exceptions=True)

asyncio.run(main())
```

Паттерн `queue.join()` + отмена воркеров через `cancel()` — стандартный способ корректного завершения. `task_done()` внутри `finally` гарантирует вызов даже при исключении.

## Sentinel-значение для завершения

Альтернатива `queue.join()` — sentinel (сигнальный объект). Производитель кладёт в очередь специальный маркер после всех данных; воркеры, получив его, завершаются.

```python
import asyncio

STOP = object()  # уникальный объект-сигнал

async def producer(queue: asyncio.Queue, data: list):
    for item in data:
        await queue.put(item)
    # по одному sentinel на каждый воркер
    for _ in range(NUM_WORKERS):
        await queue.put(STOP)

async def worker(worker_id: int, queue: asyncio.Queue):
    while True:
        item = await queue.get()
        if item is STOP:
            print(f"[Worker-{worker_id}] stopping")
            return
        print(f"[Worker-{worker_id}] processing {item}")
        await asyncio.sleep(0.1)

NUM_WORKERS = 3

async def main():
    queue = asyncio.Queue()
    data = list(range(10))

    await asyncio.gather(
        producer(queue, data),
        *[worker(i, queue) for i in range(NUM_WORKERS)],
    )

asyncio.run(main())
```

Важно: sentinel-объектов должно быть ровно столько, сколько воркеров. Если воркер получает sentinel, он выходит и не возвращает его обратно.

## Ограниченная очередь и backpressure

`asyncio.Queue(maxsize=N)` ограничивает размер буфера. Когда очередь заполнена, `put()` будет ждать, пока воркеры не освободят место. Это создаёт обратное давление (backpressure) — производитель автоматически замедляется, если потребители не справляются.

```python
import asyncio
import time

async def fast_producer(queue: asyncio.Queue):
    for i in range(20):
        t = time.monotonic()
        await queue.put(i)  # заблокируется при полной очереди
        waited = time.monotonic() - t
        if waited > 0.01:
            print(f"[Producer] backpressure: waited {waited:.2f}s before putting {i}")

async def slow_consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        await asyncio.sleep(0.2)  # медленная обработка
        print(f"[Consumer] done with {item}")
        queue.task_done()

async def main():
    queue = asyncio.Queue(maxsize=3)  # буфер всего 3 элемента

    consumer_task = asyncio.create_task(slow_consumer(queue))
    await fast_producer(queue)
    await queue.join()
    consumer_task.cancel()

asyncio.run(main())
```

Bounded queue — правильный выбор для продакшена. Неограниченная очередь при медленных потребителях приведёт к утечке памяти.

## Таймауты при чтении из очереди

Иногда воркер должен периодически выполнять служебные задачи, даже если очередь пуста. `asyncio.wait_for` с таймаутом решает эту проблему.

```python
import asyncio

async def worker_with_heartbeat(worker_id: int, queue: asyncio.Queue):
    while True:
        try:
            item = await asyncio.wait_for(queue.get(), timeout=1.0)
            print(f"[Worker-{worker_id}] processing {item}")
            await asyncio.sleep(0.1)
            queue.task_done()
        except asyncio.TimeoutError:
            print(f"[Worker-{worker_id}] heartbeat — queue empty, still alive")

async def main():
    queue = asyncio.Queue()

    worker_task = asyncio.create_task(
        worker_with_heartbeat(1, queue)
    )

    # кладём задачи с паузами
    for i in range(5):
        await asyncio.sleep(1.5)
        await queue.put(i)

    await queue.join()
    worker_task.cancel()

asyncio.run(main())
```

Альтернатива — `queue.get_nowait()`, которая выбрасывает `asyncio.QueueEmpty` немедленно, не ожидая.

## PriorityQueue и LifoQueue

asyncio предоставляет три варианта очереди:

- `asyncio.Queue` — обычная FIFO;
- `asyncio.PriorityQueue` — элементы извлекаются по приоритету (наименьший первым);
- `asyncio.LifoQueue` — стек, последний вошёл — первый вышел.

```python
import asyncio
from dataclasses import dataclass, field
from typing import Any

@dataclass(order=True)
class PrioritizedTask:
    priority: int
    data: Any = field(compare=False)

async def priority_producer(queue: asyncio.PriorityQueue):
    tasks = [
        PrioritizedTask(priority=3, data="low priority task"),
        PrioritizedTask(priority=1, data="urgent task"),
        PrioritizedTask(priority=2, data="normal task"),
        PrioritizedTask(priority=1, data="another urgent task"),
    ]
    for task in tasks:
        await queue.put(task)
        print(f"[Producer] queued: {task}")

async def priority_worker(queue: asyncio.PriorityQueue):
    while not queue.empty():
        task = await queue.get()
        print(f"[Worker] processing priority={task.priority}: {task.data}")
        await asyncio.sleep(0.05)
        queue.task_done()

async def main():
    queue = asyncio.PriorityQueue()
    await priority_producer(queue)
    await priority_worker(queue)

asyncio.run(main())
```

Вывод покажет задачи в порядке возрастания приоритета: сначала обе `urgent`, потом `normal`, потом `low`.

## Паттерн Pipeline

Несколько очередей можно выстроить в цепочку, создав конвейер обработки. Каждый этап читает из одной очереди и пишет в следующую.

```python
import asyncio

async def stage_fetch(out_queue: asyncio.Queue, urls: list):
    for url in urls:
        # имитация HTTP-запроса
        await asyncio.sleep(0.1)
        raw = f"raw_data_from_{url}"
        await out_queue.put(raw)
    await out_queue.put(None)

async def stage_parse(in_queue: asyncio.Queue, out_queue: asyncio.Queue):
    while True:
        raw = await in_queue.get()
        in_queue.task_done()
        if raw is None:
            await out_queue.put(None)
            return
        parsed = raw.upper()
        await out_queue.put(parsed)

async def stage_save(in_queue: asyncio.Queue, results: list):
    while True:
        parsed = await in_queue.get()
        in_queue.task_done()
        if parsed is None:
            return
        # имитация записи в БД
        await asyncio.sleep(0.05)
        results.append(parsed)
        print(f"Saved: {parsed}")

async def main():
    urls = ["example.com/1", "example.com/2", "example.com/3"]
    results = []

    q1 = asyncio.Queue(maxsize=5)
    q2 = asyncio.Queue(maxsize=5)

    await asyncio.gather(
        stage_fetch(q1, urls),
        stage_parse(q1, q2),
        stage_save(q2, results),
    )

    print(f"Total saved: {len(results)}")

asyncio.run(main())
```

Каждый этап конвейера независим и может быть масштабирован отдельно. При необходимости `stage_parse` можно запустить в несколько воркеров.

## Обработка ошибок в воркерах

Воркер не должен падать при ошибке в одной задаче — он должен залогировать её, пометить задачу выполненной и продолжить работу.

```python
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def reliable_worker(worker_id: int, queue: asyncio.Queue):
    while True:
        item = await queue.get()
        try:
            if item % 3 == 0:
                raise ValueError(f"Cannot process {item}: divisible by 3")
            await asyncio.sleep(0.1)
            logger.info(f"[Worker-{worker_id}] OK: {item}")
        except Exception as exc:
            logger.error(f"[Worker-{worker_id}] FAILED {item}: {exc}")
        finally:
            queue.task_done()  # всегда, даже при ошибке

async def main():
    queue = asyncio.Queue()
    for i in range(1, 10):
        await queue.put(i)

    workers = [
        asyncio.create_task(reliable_worker(i, queue))
        for i in range(2)
    ]

    await queue.join()
    for w in workers:
        w.cancel()
    await asyncio.gather(*workers, return_exceptions=True)

asyncio.run(main())
```

`task_done()` в `finally` — обязательное правило. Без него `queue.join()` зависнет навсегда, если в задаче возникнет исключение.

## Мониторинг состояния очереди

Для диагностики и метрик полезны вспомогательные методы:

```python
import asyncio

async def monitor(queue: asyncio.Queue, interval: float = 0.5):
    while True:
        print(
            f"Queue size: {queue.qsize()}/{queue.maxsize} | "
            f"empty={queue.empty()} | full={queue.full()}"
        )
        await asyncio.sleep(interval)

async def main():
    queue = asyncio.Queue(maxsize=5)

    monitor_task = asyncio.create_task(monitor(queue))

    # заполняем очередь
    for i in range(5):
        await queue.put(i)
        await asyncio.sleep(0.3)

    monitor_task.cancel()

asyncio.run(main())
```

`qsize()` возвращает текущее количество элементов, `empty()` и `full()` — логические флаги. Эти значения мгновенно устаревают в многозадачной среде, поэтому используйте их только для логирования, не для управления потоком.

## Типичные ошибки

### Забыть вызвать task_done()

Если `task_done()` не вызван, `queue.join()` зависнет. Всегда оборачивайте обработку в `try/finally`.

### Использовать Queue между потоками

`asyncio.Queue` не является потокобезопасной в смысле threading. Для взаимодействия с синхронными потоками используйте `asyncio.run_coroutine_threadsafe` или `loop.call_soon_threadsafe`.

### Неограниченная очередь при медленных потребителях

Без `maxsize` производитель может заполнить всю память. Всегда задавайте разумный `maxsize` в продакшен-коде.

### Отправить sentinel только для части воркеров

Если sentinel один, а воркеров несколько, только один воркер завершится корректно. Остальные зависнут на `get()`. Отправляйте ровно столько sentinel-значений, сколько воркеров.

## Итог

`asyncio.Queue` — строительный блок асинхронных систем в Python. Основные сценарии применения:

- разделение скорости производства и потребления через буферизацию;
- горизонтальное масштабирование обработки через пул воркеров;
- построение конвейеров из последовательных этапов;
- управление нагрузкой через backpressure с `maxsize`.

Правильное завершение воркеров (через `queue.join()` + `cancel()` или через sentinel) и вызов `task_done()` в `finally` — два ключевых правила, без которых программа зависнет или потеряет задачи.

Чтобы глубже разобраться с асинхронным программированием в Python, изучите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-asyncio-queue