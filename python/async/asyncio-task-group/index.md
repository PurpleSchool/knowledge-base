---
metaTitle: "Python asyncio.TaskGroup — управление группами задач"
metaDescription: "Как использовать asyncio.TaskGroup в Python 3.11+ для надёжного управления группами асинхронных задач с корректной обработкой ошибок."
author: "Антон Ларичев"
title: "Python asyncio.TaskGroup"
preview: "asyncio.TaskGroup — современный способ запускать и контролировать группы асинхронных задач с автоматической отменой при ошибке."
---

## Что такое asyncio.TaskGroup

`asyncio.TaskGroup` — это контекстный менеджер, появившийся в Python 3.11, который позволяет запускать несколько асинхронных задач и ждать их завершения как единой группы. Если одна из задач завершается с исключением, все остальные задачи группы автоматически отменяются.

До появления `TaskGroup` разработчики использовали `asyncio.gather()` или вручную управляли задачами через `asyncio.create_task()`. Оба подхода имеют серьёзные недостатки при обработке ошибок. `TaskGroup` решает эти проблемы на уровне языка, предоставляя структурированный параллелизм.

## Проблемы, которые решает TaskGroup

Рассмотрим классический подход с `asyncio.gather()`:

```python
import asyncio

async def fetch_data(url: str) -> str:
    await asyncio.sleep(1)
    if url == "bad-url":
        raise ValueError(f"Неверный URL: {url}")
    return f"Данные из {url}"

async def main():
    results = await asyncio.gather(
        fetch_data("url-1"),
        fetch_data("bad-url"),
        fetch_data("url-3"),
    )
    print(results)

asyncio.run(main())
```

При возникновении ошибки в одной из корутин `asyncio.gather()` по умолчанию немедленно выбрасывает исключение, но **остальные задачи продолжают выполняться в фоне**. Это приводит к утечке ресурсов и непредсказуемому поведению.

Параметр `return_exceptions=True` позволяет собрать все результаты, включая исключения, но тогда вы обязаны сами проверять каждый результат на наличие ошибок:

```python
async def main():
    results = await asyncio.gather(
        fetch_data("url-1"),
        fetch_data("bad-url"),
        fetch_data("url-3"),
        return_exceptions=True,
    )
    for result in results:
        if isinstance(result, Exception):
            print(f"Ошибка: {result}")
        else:
            print(f"Результат: {result}")
```

Этот код многословен и легко приводит к тому, что исключения случайно игнорируются.

## Базовый синтаксис TaskGroup

```python
import asyncio

async def fetch_data(url: str) -> str:
    await asyncio.sleep(1)
    return f"Данные из {url}"

async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch_data("url-1"))
        task2 = tg.create_task(fetch_data("url-2"))
        task3 = tg.create_task(fetch_data("url-3"))

    print(task1.result())
    print(task2.result())
    print(task3.result())

asyncio.run(main())
```

Ключевые моменты:

- `async with asyncio.TaskGroup() as tg:` открывает группу задач
- `tg.create_task()` регистрирует задачу в группе и сразу запускает её
- При выходе из блока `async with` программа **ждёт завершения всех задач**
- После выхода из блока можно получить результаты через `.result()` на объектах задач

## Обработка ошибок

Главное отличие `TaskGroup` от `gather()` — поведение при ошибках. Если одна или несколько задач завершаются с исключением, `TaskGroup` автоматически отменяет все оставшиеся задачи и выбрасывает `ExceptionGroup`.

```python
import asyncio

async def task_ok(name: str) -> str:
    await asyncio.sleep(0.5)
    print(f"{name}: завершена успешно")
    return f"результат {name}"

async def task_fail(name: str) -> None:
    await asyncio.sleep(0.2)
    raise RuntimeError(f"{name}: что-то пошло не так")

async def main():
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(task_ok("задача-1"))
            tg.create_task(task_fail("задача-2"))
            tg.create_task(task_ok("задача-3"))
    except* RuntimeError as eg:
        for exc in eg.exceptions:
            print(f"Перехвачена ошибка: {exc}")

asyncio.run(main())
```

Вывод:
```
задача-2: что-то пошло не так
Перехвачена ошибка: задача-2: что-то пошло не так
```

Задачи 1 и 3 были отменены, потому что задача 2 упала раньше.

### Синтаксис except*

Обратите внимание на `except*` — это новый синтаксис Python 3.11 для обработки `ExceptionGroup`. Обычный `except` не перехватывает `ExceptionGroup` корректно.

`ExceptionGroup` содержит одно или несколько исключений. Атрибут `.exceptions` — это список всех исключений из группы:

```python
try:
    async with asyncio.TaskGroup() as tg:
        tg.create_task(fail_with(ValueError("неверное значение")))
        tg.create_task(fail_with(TypeError("неверный тип")))
except* ValueError as eg:
    print(f"ValueError: {eg.exceptions}")
except* TypeError as eg:
    print(f"TypeError: {eg.exceptions}")
```

Можно перехватывать разные типы исключений в отдельных блоках `except*`.

## Получение результатов задач

Так как `tg.create_task()` возвращает стандартный объект `asyncio.Task`, результаты получают через `.result()` после завершения группы:

```python
import asyncio

async def compute(value: int) -> int:
    await asyncio.sleep(0.1)
    return value * 2

async def main():
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(compute(i)) for i in range(5)]

    results = [task.result() for task in tasks]
    print(results)  # [0, 2, 4, 6, 8]

asyncio.run(main())
```

Если задача была отменена или завершилась с ошибкой, вызов `.result()` поднимет соответствующее исключение. Поэтому `.result()` вызывают только после успешного выхода из блока `async with`.

## Вложенные TaskGroup

`TaskGroup` можно вкладывать друг в друга для создания иерархических структур параллельных задач:

```python
import asyncio

async def fetch_user(user_id: int) -> dict:
    await asyncio.sleep(0.3)
    return {"id": user_id, "name": f"Пользователь {user_id}"}

async def fetch_posts(user_id: int) -> list:
    await asyncio.sleep(0.2)
    return [f"Пост {i} пользователя {user_id}" for i in range(3)]

async def load_user_data(user_id: int) -> dict:
    async with asyncio.TaskGroup() as tg:
        user_task = tg.create_task(fetch_user(user_id))
        posts_task = tg.create_task(fetch_posts(user_id))

    return {
        "user": user_task.result(),
        "posts": posts_task.result(),
    }

async def main():
    async with asyncio.TaskGroup() as tg:
        tasks = [
            tg.create_task(load_user_data(user_id))
            for user_id in [1, 2, 3]
        ]

    for task in tasks:
        data = task.result()
        print(f"{data['user']['name']}: {len(data['posts'])} постов")

asyncio.run(main())
```

Во вложенных группах ошибка во внутренней группе поднимается как `ExceptionGroup` и отменяет задачи внешней группы.

## Передача имён задачам

`tg.create_task()` поддерживает параметр `name` — это удобно для отладки и логирования:

```python
async def main():
    async with asyncio.TaskGroup() as tg:
        tg.create_task(fetch_data("url-1"), name="fetch-url-1")
        tg.create_task(fetch_data("url-2"), name="fetch-url-2")
```

Параметр `context` позволяет передать контекст `contextvars.Context`:

```python
import contextvars

request_id: contextvars.ContextVar[str] = contextvars.ContextVar("request_id")

async def process():
    print(f"Запрос: {request_id.get()}")

async def main():
    ctx = contextvars.copy_context()
    request_id.set("req-123")

    async with asyncio.TaskGroup() as tg:
        tg.create_task(process(), context=ctx)
```

## Практический пример: параллельный HTTP-клиент

Рассмотрим реальный сценарий — параллельная загрузка данных из нескольких API:

```python
import asyncio
import aiohttp
from dataclasses import dataclass

@dataclass
class ApiResult:
    url: str
    status: int
    data: dict

async def fetch_json(session: aiohttp.ClientSession, url: str) -> ApiResult:
    async with session.get(url) as response:
        data = await response.json()
        return ApiResult(url=url, status=response.status, data=data)

async def fetch_all(urls: list[str]) -> list[ApiResult]:
    async with aiohttp.ClientSession() as session:
        async with asyncio.TaskGroup() as tg:
            tasks = [
                tg.create_task(
                    fetch_json(session, url),
                    name=f"fetch-{i}"
                )
                for i, url in enumerate(urls)
            ]

    return [task.result() for task in tasks]

async def main():
    urls = [
        "https://jsonplaceholder.typicode.com/posts/1",
        "https://jsonplaceholder.typicode.com/posts/2",
        "https://jsonplaceholder.typicode.com/posts/3",
    ]

    try:
        results = await fetch_all(urls)
        for result in results:
            print(f"[{result.status}] {result.url}: {result.data.get('title', '')[:50]}")
    except* aiohttp.ClientError as eg:
        for exc in eg.exceptions:
            print(f"Сетевая ошибка: {exc}")

asyncio.run(main())
```

## Сравнение TaskGroup и asyncio.gather

| Критерий | TaskGroup | asyncio.gather |
|---|---|---|
| Версия Python | 3.11+ | 3.4+ |
| Отмена при ошибке | Автоматически | Нет |
| Тип исключения | ExceptionGroup | Первое исключение |
| Добавление задач | Только внутри блока | До вызова gather |
| Результаты | Через .result() | Возвращаемое значение |
| Читаемость кода | Высокая | Средняя |

`asyncio.gather()` остаётся полезным в случаях, когда нужно собрать результаты включая ошибки (`return_exceptions=True`) или когда требуется совместимость с Python < 3.11.

## Таймауты в TaskGroup

Для ограничения времени выполнения группы используйте `asyncio.timeout()` совместно с `TaskGroup`:

```python
import asyncio

async def slow_task(n: int) -> int:
    await asyncio.sleep(n)
    return n

async def main():
    try:
        async with asyncio.timeout(2.0):
            async with asyncio.TaskGroup() as tg:
                tg.create_task(slow_task(1))
                tg.create_task(slow_task(5))  # Не успеет
    except TimeoutError:
        print("Превышен таймаут — все задачи отменены")

asyncio.run(main())
```

`asyncio.timeout()` также появился в Python 3.11 и прекрасно сочетается с `TaskGroup`.

## Ограничения TaskGroup

Есть несколько важных ограничений, которые нужно учитывать:

**Задачи создаются только внутри блока.** Нельзя вызывать `tg.create_task()` после того, как блок `async with` уже начал выход:

```python
async def main():
    async with asyncio.TaskGroup() as tg:
        task = tg.create_task(some_coro())
        # Корректно: создаём задачи здесь

    # tg.create_task() здесь вызовет RuntimeError
```

**Нет метода для отмены конкретной задачи через группу.** Отмена отдельной задачи через `task.cancel()` работает, но если задача завершится с `CancelledError`, это не отменит остальные задачи в группе автоматически.

**ExceptionGroup требует синтаксис except*.** Привычный `except Exception` не перехватит `ExceptionGroup`. Нужно либо использовать `except* ТипОшибки`, либо перехватывать `ExceptionGroup` явно:

```python
try:
    async with asyncio.TaskGroup() as tg:
        ...
except BaseException as exc:
    if isinstance(exc, ExceptionGroup):
        for e in exc.exceptions:
            print(e)
    else:
        raise
```

## Итоги

`asyncio.TaskGroup` — это правильный инструмент для параллельного запуска задач в современном Python. Он решает три ключевые проблемы:

- **Автоматическая отмена**: при ошибке в одной задаче остальные гарантированно отменяются
- **Явная обработка ошибок**: `ExceptionGroup` не позволяет случайно проигнорировать исключение
- **Структурированный параллелизм**: время жизни задач ограничено блоком `async with`, что делает код понятным и предсказуемым

Если вы пишете новый код под Python 3.11+, используйте `TaskGroup` вместо `asyncio.gather()` для параллельного запуска задач.

Чтобы глубже освоить асинхронное программирование на Python и научиться строить production-ready приложения, смотрите курс на PurpleSchool:
https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=asyncio-task-group