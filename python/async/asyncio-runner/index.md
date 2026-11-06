---
metaTitle: "Python asyncio.Runner: управление event loop вручную"
metaDescription: "Как использовать asyncio.Runner в Python 3.11+ для запуска нескольких корутин в одном цикле событий. Примеры, сравнение с asyncio.run()."
author: "Антон Ларичев"
title: "asyncio.Runner — управление циклом событий вручную"
preview: "asyncio.Runner — контекстный менеджер для точного контроля над жизненным циклом event loop. Разбираем отличия от asyncio.run() и практические сценарии."
---

## Что такое asyncio.Runner

`asyncio.Runner` — это контекстный менеджер, появившийся в Python 3.11, который даёт явный контроль над созданием, использованием и закрытием цикла событий (event loop). До его появления единственным удобным способом запустить асинхронный код в синхронном контексте было `asyncio.run()`, которое каждый раз создаёт новый event loop и уничтожает его после завершения корутины.

`asyncio.Runner` решает задачу, когда нужно:

- запустить несколько корутин последовательно в **одном** цикле событий;
- явно управлять моментом закрытия loop;
- передавать loop внешнему коду или инструментам;
- контролировать политику event loop и обработчик исключений.

## Быстрый старт

Самый простой пример — эквивалент `asyncio.run()`, но через `Runner`:

```python
import asyncio

async def main():
    await asyncio.sleep(1)
    print("Готово")

with asyncio.Runner() as runner:
    runner.run(main())
```

Внутри блока `with` runner держит живой event loop. Как только блок завершается, `runner.close()` вызывается автоматически — loop корректно останавливается и освобождаются ресурсы.

## asyncio.Runner против asyncio.run()

Ключевое отличие — количество созданных event loop.

```python
import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)  # имитация сетевого запроса
    return f"data from {url}"

# Плохо: создаём три event loop
result1 = asyncio.run(fetch("http://example.com/1"))
result2 = asyncio.run(fetch("http://example.com/2"))
result3 = asyncio.run(fetch("http://example.com/3"))

# Хорошо: один event loop на все три вызова
with asyncio.Runner() as runner:
    result1 = runner.run(fetch("http://example.com/1"))
    result2 = runner.run(fetch("http://example.com/2"))
    result3 = runner.run(fetch("http://example.com/3"))
```

В первом варианте каждый `asyncio.run()` создаёт и уничтожает loop. Это дорогостоящая операция: переинициализируется планировщик, теряются кешированные ресурсы (например, пулы соединений), нельзя передать состояние между вызовами.

Во втором варианте loop живёт всё время работы блока `with`, корутины разделяют одно и то же пространство задач.

## Методы asyncio.Runner

### runner.run(coro, *, context=None)

Запускает корутину до завершения и возвращает результат. Принимает необязательный `context` — объект `contextvars.Context`, в котором будет выполняться корутина.

```python
import asyncio
import contextvars

request_id: contextvars.ContextVar[str] = contextvars.ContextVar("request_id")

async def handle():
    rid = request_id.get("unknown")
    print(f"Обрабатываю запрос: {rid}")

ctx = contextvars.copy_context()
ctx.run(request_id.set, "req-42")

with asyncio.Runner() as runner:
    runner.run(handle(), context=ctx)
# Выведет: Обрабатываю запрос: req-42
```

### runner.get_loop()

Возвращает event loop, которым управляет runner. Позволяет передать loop в сторонние библиотеки или планировщики.

```python
import asyncio

with asyncio.Runner() as runner:
    loop = runner.get_loop()
    print(type(loop))  # <class '_UnixSelectorEventLoop'> (на Linux/macOS)

    # Планируем обратный вызов напрямую через loop
    loop.call_soon_threadsafe(print, "Привет из loop!")
    runner.run(asyncio.sleep(0))  # даём loop прокрутиться
```

### runner.close()

Явно закрывает event loop. При использовании контекстного менеджера (`with`) вызывается автоматически. Нужен при ручном управлении:

```python
import asyncio

runner = asyncio.Runner()
try:
    runner.run(asyncio.sleep(0.1))
finally:
    runner.close()
```

## Параметры конструктора

```python
asyncio.Runner(
    *,
    debug: bool | None = None,
    loop_factory: Callable[[], AbstractEventLoop] | None = None,
)
```

### debug

Включает режим отладки event loop — выводит предупреждения о медленных callback-ах, неожиданном закрытии корутин, забытых задачах.

```python
import asyncio

async def slow():
    import time
    time.sleep(0.15)  # блокирующий вызов в async-контексте

with asyncio.Runner(debug=True) as runner:
    runner.run(slow())
# Предупреждение: Executing <Task ...> took 0.150 seconds
```

### loop_factory

Позволяет подставить собственную реализацию event loop. Полезно при использовании высокопроизводительных альтернатив:

```python
import asyncio

try:
    import uvloop
    factory = uvloop.new_event_loop
except ImportError:
    factory = asyncio.new_event_loop

async def main():
    print(asyncio.get_event_loop_policy())
    await asyncio.sleep(0)

with asyncio.Runner(loop_factory=factory) as runner:
    runner.run(main())
```

## Практический пример: CLI-инструмент с несколькими командами

Представим утилиту командной строки, которая выполняет несколько асинхронных операций последовательно — загрузку конфига, проверку соединения, выполнение задачи.

```python
import asyncio
import sys

async def load_config(path: str) -> dict:
    await asyncio.sleep(0.05)  # чтение с диска
    print(f"Конфиг загружен из {path}")
    return {"host": "localhost", "port": 5432}

async def check_connection(config: dict) -> bool:
    await asyncio.sleep(0.1)  # ping к базе данных
    host = config["host"]
    port = config["port"]
    print(f"Соединение с {host}:{port} успешно")
    return True

async def run_migration(config: dict) -> int:
    await asyncio.sleep(0.2)  # выполнение SQL
    print("Миграция применена")
    return 0

def cli_main(config_path: str) -> int:
    with asyncio.Runner() as runner:
        config = runner.run(load_config(config_path))

        connected = runner.run(check_connection(config))
        if not connected:
            print("Не удалось подключиться", file=sys.stderr)
            return 1

        exit_code = runner.run(run_migration(config))
        return exit_code

if __name__ == "__main__":
    sys.exit(cli_main("config.yaml"))
```

Все три шага работают в одном event loop. Если бы вместо этого использовался `asyncio.run()`, каждый вызов был бы изолирован — потерялось бы любое состояние, хранящееся в контексте задач.

## Пример: запуск тестов с общим состоянием

`asyncio.Runner` удобен в тестовых фреймворках, когда нужно создать одно дорогостоящее подключение и переиспользовать его в нескольких тестах.

```python
import asyncio

class AsyncTestSuite:
    def __init__(self):
        self._runner = asyncio.Runner()
        self._connection = None

    def setup(self):
        self._runner.__enter__()
        self._connection = self._runner.run(self._create_connection())

    def teardown(self):
        self._runner.run(self._close_connection(self._connection))
        self._runner.__exit__(None, None, None)

    def run_test(self, coro):
        return self._runner.run(coro)

    async def _create_connection(self):
        await asyncio.sleep(0.1)  # дорогостоящее подключение
        print("Подключение установлено")
        return object()  # заглушка для conn

    async def _close_connection(self, conn):
        await asyncio.sleep(0.01)
        print("Подключение закрыто")

async def test_query(conn):
    await asyncio.sleep(0.01)
    return "result"

async def test_insert(conn):
    await asyncio.sleep(0.01)
    return True

suite = AsyncTestSuite()
suite.setup()

result = suite.run_test(test_query(suite._connection))
print(f"test_query: {result}")

result = suite.run_test(test_insert(suite._connection))
print(f"test_insert: {result}")

suite.teardown()
```

## Обработка исключений

Если корутина внутри `runner.run()` бросает исключение, оно пробрасывается дальше в синхронный код как обычно. Loop при этом остаётся рабочим — его можно использовать для следующих вызовов.

```python
import asyncio

async def might_fail(should_fail: bool):
    await asyncio.sleep(0.01)
    if should_fail:
        raise ValueError("Что-то пошло не так")
    return "успех"

with asyncio.Runner() as runner:
    try:
        runner.run(might_fail(True))
    except ValueError as e:
        print(f"Поймали ошибку: {e}")

    # Loop всё ещё жив — продолжаем работу
    result = runner.run(might_fail(False))
    print(f"Результат: {result}")
```

Это принципиальное отличие от `asyncio.run()` — там при любом исходе loop закрывается и второй вызов создал бы новый.

## Совместимость с asyncio.TaskGroup

`asyncio.Runner` прекрасно сочетается с `asyncio.TaskGroup` (тоже появился в Python 3.11) для параллельного запуска задач внутри одного runner-а:

```python
import asyncio

async def download(url: str) -> str:
    await asyncio.sleep(0.1)
    return f"контент {url}"

async def download_all(urls: list[str]) -> list[str]:
    results = []
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(download(url)) for url in urls]
    return [t.result() for t in tasks]

urls = [
    "http://example.com/a",
    "http://example.com/b",
    "http://example.com/c",
]

with asyncio.Runner() as runner:
    # Параллельная загрузка в рамках одного event loop
    contents = runner.run(download_all(urls))
    print(f"Загружено {len(contents)} ресурсов")

    # Дополнительная работа в том же loop
    extra = runner.run(download("http://example.com/extra"))
    print(extra)
```

## Когда использовать asyncio.Runner

**Используйте `asyncio.Runner`, когда:**

- Нужно запустить несколько корутин последовательно в одном event loop и важна эффективность (нет накладных расходов на пересоздание loop).
- Корутины должны разделять общее состояние через `contextvars` или открытые соединения.
- Вы пишете CLI, скрипты или тестовые фреймворки, где несколько этапов обращаются к async-коду.
- Требуется явный контроль над `loop_factory` или режимом отладки.

**Используйте `asyncio.run()`, когда:**

- Нужно запустить одну «входную» корутину — стандартный паттерн `if __name__ == "__main__": asyncio.run(main())`.
- Изоляция важнее производительности — каждый запуск должен получать чистый loop.

## Требования к версии Python

`asyncio.Runner` добавлен в **Python 3.11**. На более ранних версиях используйте `asyncio.run()` или ручное управление через `asyncio.new_event_loop()` / `loop.run_until_complete()`.

```python
import sys

if sys.version_info >= (3, 11):
    with asyncio.Runner() as runner:
        runner.run(main())
else:
    # Запасной вариант для Python 3.10 и ниже
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(main())
    finally:
        loop.close()
```

## Итог

`asyncio.Runner` закрывает пробел между высокоуровневым `asyncio.run()` и низкоуровневым ручным управлением event loop. Он даёт прозрачный контроль без лишнего бойлерплейта: один контекстный менеджер — один event loop — несколько запусков. Это особенно ценно в утилитах, тестах и фреймворках, где несколько асинхронных шагов должны работать в одном окружении.

Для углублённого изучения асинхронного программирования на Python, работы с `asyncio`, `aiohttp`, очередями и паттернами конкурентности — смотрите курс на PurpleSchool:

[Курс по Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=asyncio-runner)