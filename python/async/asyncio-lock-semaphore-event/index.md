---
metaTitle: "asyncio Lock, Semaphore, Event — синхронизация корутин"
metaDescription: "Как использовать примитивы синхронизации asyncio в Python: Lock, Semaphore и Event с практическими примерами."
author: "Антон Ларичев"
title: "Синхронизация в asyncio: Lock, Semaphore, Event"
preview: "Разбираем примитивы синхронизации asyncio — Lock, Semaphore и Event — и учимся безопасно управлять общими ресурсами в асинхронном коде."
---

## Зачем нужна синхронизация в asyncio

Асинхронный код в Python выполняется в одном потоке — событийная петля (`event loop`) переключает корутины в момент, когда те ожидают завершения I/O. Казалось бы, если поток один, гонок данных быть не может. Это правда лишь отчасти.

Проблема возникает при наличии **shared state** — общего изменяемого состояния, к которому обращаются несколько корутин. Переключение происходит в точках `await`, и между двумя `await` нет никакой атомарности на уровне бизнес-логики. Классический пример — счётчик:

```python
import asyncio

counter = 0

async def increment():
    global counter
    value = counter          # читаем
    await asyncio.sleep(0)   # здесь может переключиться другая корутина
    counter = value + 1      # пишем уже устаревшее значение

async def main():
    await asyncio.gather(*[increment() for _ in range(1000)])
    print(counter)  # ожидаем 1000, получаем куда меньше

asyncio.run(main())
```

Ожидаемый результат — `1000`, реальный — непредсказуемое число. Именно для таких ситуаций asyncio предоставляет примитивы синхронизации: `Lock`, `Semaphore` и `Event`.

---

## Lock — исключительный доступ

`asyncio.Lock` — это мьютекс: в любой момент только одна корутина может владеть блокировкой. Остальные ждут, пока владелец не освободит замок.

### Базовое использование

```python
import asyncio

counter = 0
lock = asyncio.Lock()

async def safe_increment():
    global counter
    async with lock:
        value = counter
        await asyncio.sleep(0)  # имитируем переключение
        counter = value + 1

async def main():
    await asyncio.gather(*[safe_increment() for _ in range(1000)])
    print(counter)  # теперь всегда 1000

asyncio.run(main())
```

Конструкция `async with lock:` вызывает `await lock.acquire()` при входе и гарантированно вызывает `lock.release()` при выходе — даже при исключении.

### Ручное управление

Если контекстный менеджер не подходит, можно управлять замком вручную:

```python
async def manual_lock_example():
    await lock.acquire()
    try:
        # критическая секция
        await some_work()
    finally:
        lock.release()  # не await — release() синхронный
```

Важно: `lock.release()` — синхронный метод, `await` перед ним не нужен.

### Проверка состояния

```python
if lock.locked():
    print("Замок занят, пропускаем")
else:
    async with lock:
        await critical_section()
```

### Практический пример — защита файла

Несколько корутин пишут в один файл. Без блокировки строки перемешаются:

```python
import asyncio

file_lock = asyncio.Lock()

async def write_to_file(filename: str, data: str, task_id: int) -> None:
    async with file_lock:
        # Имитация задержки при записи
        await asyncio.sleep(0.01)
        with open(filename, "a") as f:
            f.write(f"Task {task_id}: {data}\n")
        print(f"Task {task_id} записала данные")

async def main():
    tasks = [
        write_to_file("output.txt", f"payload_{i}", i)
        for i in range(5)
    ]
    await asyncio.gather(*tasks)

asyncio.run(main())
```

---

## Semaphore — ограничение параллелизма

`asyncio.Semaphore` — обобщение Lock. Он хранит внутренний счётчик и позволяет одновременно работать не более чем `n` корутинам. При `n=1` Semaphore эквивалентен Lock.

Семафор особенно полезен, когда нужно ограничить нагрузку на внешний ресурс: API с rate-limit, пул соединений к БД, количество одновременных HTTP-запросов.

### Базовое использование

```python
import asyncio

semaphore = asyncio.Semaphore(3)  # не более 3 одновременно

async def fetch_data(url: str, task_id: int) -> str:
    async with semaphore:
        print(f"Task {task_id} начала запрос")
        await asyncio.sleep(1)  # имитация HTTP-запроса
        print(f"Task {task_id} завершила запрос")
        return f"data_{task_id}"

async def main():
    urls = [f"https://api.example.com/item/{i}" for i in range(10)]
    results = await asyncio.gather(
        *[fetch_data(url, i) for i, url in enumerate(urls)]
    )
    print(f"Получено {len(results)} результатов")

asyncio.run(main())
```

В этом примере несмотря на то что задач 10, одновременно выполняется не более 3.

### BoundedSemaphore

`asyncio.BoundedSemaphore` — строгий вариант Semaphore. Он выбрасывает `ValueError`, если вызвать `release()` больше раз, чем `acquire()`. Это защищает от программной ошибки, когда счётчик случайно уходит выше начального значения:

```python
bounded = asyncio.BoundedSemaphore(2)

async def risky():
    await bounded.acquire()
    bounded.release()
    bounded.release()  # ValueError: BoundedSemaphore released too many times
```

### Практический пример — rate limiter для API

```python
import asyncio
import time

class RateLimiter:
    def __init__(self, max_calls: int, period: float):
        self._semaphore = asyncio.Semaphore(max_calls)
        self._period = period

    async def __aenter__(self):
        await self._semaphore.acquire()
        return self

    async def __aexit__(self, *args):
        # Освобождаем место через period секунд
        asyncio.get_event_loop().call_later(
            self._period, self._semaphore.release
        )

rate_limiter = RateLimiter(max_calls=5, period=1.0)

async def api_call(item_id: int) -> dict:
    async with rate_limiter:
        await asyncio.sleep(0.1)  # имитация запроса
        return {"id": item_id, "status": "ok"}

async def main():
    start = time.monotonic()
    results = await asyncio.gather(*[api_call(i) for i in range(15)])
    elapsed = time.monotonic() - start
    print(f"Обработано {len(results)} запросов за {elapsed:.1f}с")
    # При 5 запросов/сек и 15 запросах ожидаем ~3 секунды

asyncio.run(main())
```

---

## Event — уведомление между корутинами

`asyncio.Event` — это флаг, который корутины могут устанавливать (`set()`) и ждать (`await event.wait()`). Когда флаг установлен, все ожидающие корутины разблокируются одновременно.

Event используется для координации: «дождись, пока произойдёт X, а потом продолжи».

### Базовое использование

```python
import asyncio

event = asyncio.Event()

async def waiter(name: str) -> None:
    print(f"{name} ждёт сигнала...")
    await event.wait()
    print(f"{name} получил сигнал и продолжает работу")

async def trigger() -> None:
    await asyncio.sleep(2)
    print("Устанавливаем событие")
    event.set()

async def main():
    await asyncio.gather(
        waiter("Worker-1"),
        waiter("Worker-2"),
        waiter("Worker-3"),
        trigger(),
    )

asyncio.run(main())
```

Все три воркера разблокируются одновременно после вызова `event.set()`.

### Методы Event

| Метод | Описание |
|---|---|
| `event.set()` | Устанавливает флаг, будит всех ожидающих |
| `event.clear()` | Сбрасывает флаг (повторное ожидание возможно) |
| `event.is_set()` | Возвращает `True`, если флаг установлен |
| `await event.wait()` | Ждёт, пока флаг не будет установлен |

### Повторное использование через clear()

```python
import asyncio

data_ready = asyncio.Event()
shared_data = None

async def producer() -> None:
    global shared_data
    for i in range(3):
        await asyncio.sleep(1)
        shared_data = {"batch": i, "items": list(range(i * 10, (i + 1) * 10))}
        print(f"Продюсер: данные батча {i} готовы")
        data_ready.set()          # уведомляем потребителей
        await asyncio.sleep(0)    # даём потребителям запуститься
        data_ready.clear()        # сбрасываем для следующего батча

async def consumer(name: str) -> None:
    for _ in range(3):
        await data_ready.wait()   # ждём новых данных
        print(f"{name}: обрабатываю батч {shared_data['batch']}")

async def main():
    await asyncio.gather(
        producer(),
        consumer("Consumer-A"),
        consumer("Consumer-B"),
    )

asyncio.run(main())
```

### Практический пример — готовность сервиса

Типичный паттерн: воркеры ждут инициализации зависимости (подключения к БД, загрузки конфига) прежде чем начать работу.

```python
import asyncio

class Database:
    def __init__(self):
        self._ready = asyncio.Event()
        self._connection = None

    async def connect(self, dsn: str) -> None:
        print("Подключаемся к базе данных...")
        await asyncio.sleep(2)  # имитация подключения
        self._connection = dsn
        print("База данных готова")
        self._ready.set()

    async def wait_ready(self) -> None:
        await self._ready.wait()

    async def query(self, sql: str) -> list:
        await self.wait_ready()
        return [{"result": f"данные по запросу '{sql}'"}]

async def worker(db: Database, worker_id: int) -> None:
    print(f"Worker-{worker_id}: жду готовности БД")
    result = await db.query(f"SELECT * FROM table_{worker_id}")
    print(f"Worker-{worker_id}: получил {result}")

async def main():
    db = Database()
    await asyncio.gather(
        db.connect("postgresql://localhost/mydb"),
        worker(db, 1),
        worker(db, 2),
        worker(db, 3),
    )

asyncio.run(main())
```

---

## Сравнение примитивов

| Примитив | Когда использовать |
|---|---|
| `Lock` | Защита критической секции — один за раз |
| `Semaphore` | Ограничение количества одновременных исполнителей |
| `BoundedSemaphore` | То же, плюс защита от лишних `release()` |
| `Event` | Уведомление: «событие X произошло, продолжайте» |

---

## Частые ошибки

### Создание примитивов до запуска event loop

До Python 3.10 создание примитивов вне корутины могло привести к проблемам с привязкой к event loop. Всегда создавайте примитивы внутри `async`-функции или передавайте через аргументы:

```python
# Плохо (может работать некорректно в некоторых сценариях)
lock = asyncio.Lock()

async def main():
    async with lock:
        ...

# Хорошо
async def main():
    lock = asyncio.Lock()
    async with lock:
        ...
```

### Дедлок при вложенных блокировках

```python
async def deadlock_example():
    lock = asyncio.Lock()

    async with lock:          # первое взятие
        async with lock:      # дедлок — ждём самих себя
            pass
```

`asyncio.Lock` не реентерабельный. Если нужен реентерабельный мьютекс, реализуйте его вручную через счётчик или используйте другую структуру данных.

### Забытый release()

Всегда используйте `async with` вместо ручного `acquire/release`, чтобы блокировка снималась даже при исключении:

```python
# Плохо
async def risky():
    await lock.acquire()
    result = await might_raise()  # если исключение — lock никогда не освободится
    lock.release()

# Хорошо
async def safe():
    async with lock:
        result = await might_raise()  # lock освободится гарантированно
```

### Event без clear() используется повторно

Если вы ждёте Event в цикле и не вызываете `clear()`, второй вызов `await event.wait()` вернётся немедленно — флаг уже установлен:

```python
event = asyncio.Event()
event.set()

async def wrong_loop():
    while True:
        await event.wait()  # немедленно — флаг уже установлен
        process()           # работает вечно без пауз

async def correct_loop():
    while True:
        await event.wait()
        event.clear()       # сбрасываем до обработки
        process()
```

---

## Комбинирование примитивов

Реальные задачи часто требуют нескольких примитивов одновременно. Пример — пул воркеров с ограниченным параллелизмом и сигналом остановки:

```python
import asyncio
from collections import deque

async def worker_pool(
    tasks: list,
    max_workers: int = 3,
) -> list:
    semaphore = asyncio.Semaphore(max_workers)
    results_lock = asyncio.Lock()
    results = []

    async def process(item):
        async with semaphore:
            await asyncio.sleep(0.5)  # работа
            result = {"item": item, "processed": True}
            async with results_lock:
                results.append(result)

    await asyncio.gather(*[process(t) for t in tasks])
    return results

async def main():
    items = list(range(10))
    results = await worker_pool(items, max_workers=3)
    print(f"Обработано: {len(results)} элементов")

asyncio.run(main())
```

---

## Итоги

Примитивы синхронизации asyncio позволяют безопасно управлять общим состоянием в асинхронном коде:

- **Lock** защищает критическую секцию, пропуская только одну корутину за раз.
- **Semaphore** ограничивает количество одновременно работающих корутин — незаменим для rate-limiting и пулов соединений.
- **Event** координирует корутины через сигнал «событие произошло», позволяя нескольким воркерам стартовать одновременно.

Всегда используйте `async with` для автоматического освобождения ресурсов, создавайте примитивы внутри асинхронного контекста и остерегайтесь дедлоков при вложенных блокировках.

Чтобы глубже разобраться в асинхронном программировании на Python и научиться строить надёжные конкурентные приложения, приходите на курс [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=asyncio-lock-semaphore-event).
