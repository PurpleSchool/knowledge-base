---
metaTitle: "gRPC-сервис на Python: полное руководство"
metaDescription: "Как создать gRPC-сервис на Python: Protocol Buffers, генерация кода, сервер и клиент, стриминг, async-режим. Практические примеры."
author: "Антон Ларичев"
title: "gRPC-сервис на Python"
preview: "Пошаговое руководство по созданию gRPC-сервиса на Python: от описания proto-схемы до реализации сервера, клиента и стриминга."
---

## Что такое gRPC и зачем он нужен

gRPC — это высокопроизводительный фреймворк удалённого вызова процедур (Remote Procedure Call), разработанный Google. В отличие от REST, который передаёт данные в формате JSON через HTTP/1.1, gRPC использует Protocol Buffers (protobuf) для сериализации и HTTP/2 для транспорта. Это даёт ряд практических преимуществ:

- **Скорость**: бинарный формат protobuf компактнее и быстрее JSON в несколько раз.
- **Строгая типизация**: контракт описывается в `.proto`-файле, и клиент с сервером всегда работают по одной схеме.
- **Двунаправленный стриминг**: HTTP/2 позволяет серверу и клиенту отправлять потоки сообщений в обе стороны.
- **Кодогенерация**: из одного `.proto`-файла автоматически генерируются заглушки для Python, Go, Java и других языков.

gRPC хорошо подходит для внутреннего взаимодействия между микросервисами, где важна производительность и строгий API-контракт.

## Установка зависимостей

Для работы с gRPC в Python нужны два пакета: `grpcio` (среда выполнения) и `grpcio-tools` (компилятор proto-файлов).

```bash
pip install grpcio grpcio-tools
```

Для проектов с `pyproject.toml` или `requirements.txt` зафиксируйте версии:

```text
grpcio>=1.60.0
grpcio-tools>=1.60.0
```

## Описание сервиса в .proto-файле

Контракт gRPC-сервиса описывается в файле с расширением `.proto`. Создадим сервис управления задачами `TaskService`.

```text
project/
  proto/
    task.proto
  server.py
  client.py
```

```protobuf
// proto/task.proto
syntax = "proto3";

package task;

// Сообщение для создания задачи
message CreateTaskRequest {
  string title = 1;
  string description = 2;
  int32 priority = 3;
}

// Ответ с созданной задачей
message TaskResponse {
  string id = 1;
  string title = 2;
  string description = 3;
  int32 priority = 4;
  string status = 5;
}

// Запрос на получение задачи по ID
message GetTaskRequest {
  string id = 1;
}

// Запрос на получение списка задач
message ListTasksRequest {
  int32 page = 1;
  int32 page_size = 2;
}

// Определение сервиса
service TaskService {
  // Унарный вызов: создать задачу
  rpc CreateTask(CreateTaskRequest) returns (TaskResponse);

  // Унарный вызов: получить задачу по ID
  rpc GetTask(GetTaskRequest) returns (TaskResponse);

  // Серверный стриминг: получить список задач потоком
  rpc ListTasks(ListTasksRequest) returns (stream TaskResponse);
}
```

Каждое поле в protobuf имеет уникальный числовой тег (`= 1`, `= 2`). Эти теги используются при сериализации и не должны изменяться после публикации схемы — иначе сломается совместимость.

## Генерация Python-кода из proto-файла

Команда `grpc_tools.protoc` генерирует два файла:

- `task_pb2.py` — классы сообщений (protobuf-объекты)
- `task_pb2_grpc.py` — заглушки сервера и клиента

```bash
python -m grpc_tools.protoc \
  -I./proto \
  --python_out=. \
  --grpc_python_out=. \
  ./proto/task.proto
```

После выполнения команды в корне проекта появятся `task_pb2.py` и `task_pb2_grpc.py`. Эти файлы не редактируются вручную — они перегенерируются при каждом изменении `.proto`.

## Реализация сервера

Сервер наследует сгенерированный класс `TaskServiceServicer` и реализует все методы, объявленные в proto-файле.

```python
# server.py
import grpc
import uuid
import time
from concurrent import futures

import task_pb2
import task_pb2_grpc

# Имитация базы данных в памяти
tasks_db: dict[str, dict] = {}


class TaskServiceServicer(task_pb2_grpc.TaskServiceServicer):

    def CreateTask(self, request, context):
        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "title": request.title,
            "description": request.description,
            "priority": request.priority,
            "status": "pending",
        }
        tasks_db[task_id] = task

        return task_pb2.TaskResponse(
            id=task["id"],
            title=task["title"],
            description=task["description"],
            priority=task["priority"],
            status=task["status"],
        )

    def GetTask(self, request, context):
        task = tasks_db.get(request.id)
        if task is None:
            # Устанавливаем gRPC-статус ошибки
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"Task with id '{request.id}' not found")
            return task_pb2.TaskResponse()

        return task_pb2.TaskResponse(
            id=task["id"],
            title=task["title"],
            description=task["description"],
            priority=task["priority"],
            status=task["status"],
        )

    def ListTasks(self, request, context):
        # Серверный стриминг: отдаём задачи по одной
        page = max(request.page, 1)
        page_size = request.page_size if request.page_size > 0 else 10

        all_tasks = list(tasks_db.values())
        start = (page - 1) * page_size
        end = start + page_size

        for task in all_tasks[start:end]:
            yield task_pb2.TaskResponse(
                id=task["id"],
                title=task["title"],
                description=task["description"],
                priority=task["priority"],
                status=task["status"],
            )


def serve():
    # Пул потоков для обработки запросов
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    task_pb2_grpc.add_TaskServiceServicer_to_server(TaskServiceServicer(), server)

    server.add_insecure_port("[::]:50051")
    server.start()
    print("Server started on port 50051")

    try:
        while True:
            time.sleep(86400)  # держим сервер живым
    except KeyboardInterrupt:
        server.stop(0)


if __name__ == "__main__":
    serve()
```

### Коды ошибок в gRPC

gRPC имеет собственный набор статус-кодов, отличных от HTTP. Основные из них:

| Код | Значение |
|---|---|
| `OK` | Успешно |
| `NOT_FOUND` | Ресурс не найден |
| `INVALID_ARGUMENT` | Некорректный аргумент |
| `ALREADY_EXISTS` | Ресурс уже существует |
| `INTERNAL` | Внутренняя ошибка сервера |
| `UNAUTHENTICATED` | Не авторизован |
| `PERMISSION_DENIED` | Нет прав |

Всегда устанавливайте осмысленный код через `context.set_code()` — это облегчает отладку на стороне клиента.

## Реализация клиента

```python
# client.py
import grpc

import task_pb2
import task_pb2_grpc


def run():
    # Создаём канал подключения к серверу
    with grpc.insecure_channel("localhost:50051") as channel:
        stub = task_pb2_grpc.TaskServiceStub(channel)

        # Создаём несколько задач
        for i in range(1, 4):
            response = stub.CreateTask(
                task_pb2.CreateTaskRequest(
                    title=f"Task {i}",
                    description=f"Description for task {i}",
                    priority=i,
                )
            )
            print(f"Created: id={response.id}, title={response.title}")

        # Получаем список задач через стриминг
        print("\nListing all tasks:")
        stream = stub.ListTasks(
            task_pb2.ListTasksRequest(page=1, page_size=10)
        )
        for task in stream:
            print(f"  [{task.priority}] {task.title} — {task.status}")


if __name__ == "__main__":
    run()
```

Запустите сначала сервер, затем клиент:

```bash
python server.py &
python client.py
```

Ожидаемый вывод:

```text
Created: id=3f2a..., title=Task 1
Created: id=8b1c..., title=Task 2
Created: id=4e9d..., title=Task 3

Listing all tasks:
  [1] Task 1 — pending
  [2] Task 2 — pending
  [3] Task 3 — pending
```

## Асинхронный gRPC с grpc.aio

Для работы в async-окружении (FastAPI, asyncio-сервисы) используется модуль `grpc.aio`.

```python
# async_server.py
import asyncio
import uuid
import grpc
from grpc import aio

import task_pb2
import task_pb2_grpc

tasks_db: dict[str, dict] = {}


class AsyncTaskServiceServicer(task_pb2_grpc.TaskServiceServicer):

    async def CreateTask(self, request, context):
        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "title": request.title,
            "description": request.description,
            "priority": request.priority,
            "status": "pending",
        }
        tasks_db[task_id] = task

        return task_pb2.TaskResponse(**task)

    async def GetTask(self, request, context):
        task = tasks_db.get(request.id)
        if task is None:
            await context.abort(grpc.StatusCode.NOT_FOUND, f"Task '{request.id}' not found")

        return task_pb2.TaskResponse(**task)

    async def ListTasks(self, request, context):
        page_size = request.page_size or 10
        for task in list(tasks_db.values())[:page_size]:
            yield task_pb2.TaskResponse(**task)
            await asyncio.sleep(0)  # уступаем управление event loop


async def serve():
    server = aio.server()
    task_pb2_grpc.add_TaskServiceServicer_to_server(AsyncTaskServiceServicer(), server)
    server.add_insecure_port("[::]:50051")
    await server.start()
    print("Async server started on port 50051")
    await server.wait_for_termination()


if __name__ == "__main__":
    asyncio.run(serve())
```

Асинхронный клиент:

```python
# async_client.py
import asyncio
from grpc import aio

import task_pb2
import task_pb2_grpc


async def run():
    async with aio.insecure_channel("localhost:50051") as channel:
        stub = task_pb2_grpc.TaskServiceStub(channel)

        response = await stub.CreateTask(
            task_pb2.CreateTaskRequest(
                title="Async Task",
                description="Created via async client",
                priority=1,
            )
        )
        print(f"Created: {response.id}")

        async for task in stub.ListTasks(task_pb2.ListTasksRequest(page=1, page_size=5)):
            print(f"  {task.title}")


if __name__ == "__main__":
    asyncio.run(run())
```

## Перехватчики (Interceptors)

Интерцепторы в gRPC — аналог middleware в HTTP-фреймворках. Они позволяют добавить логирование, аутентификацию или трассировку без изменения бизнес-логики.

```python
import grpc
import time
from grpc import ServerInterceptor


class LoggingInterceptor(grpc.ServerInterceptor):

    def intercept_service(self, continuation, handler_call_details):
        method = handler_call_details.method
        start = time.monotonic()

        handler = continuation(handler_call_details)

        def timed_handler(request, context):
            result = handler.unary_unary(request, context)
            elapsed = (time.monotonic() - start) * 1000
            print(f"{method} completed in {elapsed:.1f}ms")
            return result

        return grpc.unary_unary_rpc_method_handler(timed_handler)


# Подключение интерцептора к серверу
server = grpc.server(
    futures.ThreadPoolExecutor(max_workers=10),
    interceptors=[LoggingInterceptor()],
)
```

## TLS и безопасное соединение

Для production-среды используйте TLS вместо `insecure_channel`:

```python
# Сервер с TLS
with open("server.key", "rb") as f:
    private_key = f.read()
with open("server.crt", "rb") as f:
    certificate_chain = f.read()

credentials = grpc.ssl_server_credentials([(private_key, certificate_chain)])
server.add_secure_port("[::]:50051", credentials)
```

```python
# Клиент с TLS
with open("ca.crt", "rb") as f:
    trusted_certs = f.read()

credentials = grpc.ssl_channel_credentials(root_certificates=trusted_certs)
channel = grpc.secure_channel("localhost:50051", credentials)
```

## Автоматизация генерации кода

Добавьте скрипт генерации в `Makefile` или `pyproject.toml`, чтобы не запоминать длинную команду:

```makefile
# Makefile
proto:
	python -m grpc_tools.protoc \
		-I./proto \
		--python_out=. \
		--grpc_python_out=. \
		./proto/*.proto

.PHONY: proto
```

Теперь для перегенерации достаточно выполнить `make proto`.

## Типичные ошибки и как их избежать

**Изменение числовых тегов в proto**. Если задача с тегом `= 1` была `title`, не переназначайте этот тег другому полю — старые клиенты будут читать данные неверно. Для удалённых полей используйте директиву `reserved`.

```protobuf
message TaskResponse {
  reserved 2;          // поле было удалено, тег зарезервирован
  reserved "old_name"; // имя также зарезервировано
  string id = 1;
  string title = 3;    // новый тег
}
```

**Блокирующий код в async-сервере**. В `grpc.aio` методы сервисра выполняются в event loop. Вызов синхронной блокирующей операции (например, `requests.get`) заблокирует все соединения. Используйте `asyncio.to_thread()` для запуска блокирующего кода:

```python
async def GetTask(self, request, context):
    # Правильно: выносим блокирующий вызов в поток
    task = await asyncio.to_thread(blocking_db_call, request.id)
    return task_pb2.TaskResponse(**task)
```

**Отсутствие таймаутов на клиенте**. По умолчанию gRPC-вызов ждёт ответа бесконечно. Всегда указывайте `timeout`:

```python
response = stub.GetTask(
    task_pb2.GetTaskRequest(id="some-id"),
    timeout=5.0,  # секунды
)
```

## Итог

gRPC на Python — это зрелый и производительный способ организовать взаимодействие между сервисами. Ключевые шаги: описать контракт в `.proto`, сгенерировать код, реализовать сервер и клиент. Для async-приложений используйте `grpc.aio`, для production — TLS и интерцепторы для логирования и аутентификации.

Чтобы углубиться в разработку на Python и научиться строить серьёзные бэкенд-системы, смотрите курс [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=grpc-python).