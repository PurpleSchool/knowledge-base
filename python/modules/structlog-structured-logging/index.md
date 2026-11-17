---
metaTitle: "structlog: структурированное логирование в Python"
metaDescription: "Полное руководство по structlog — настройка, процессоры, форматирование JSON-логов и интеграция со стандартным logging в Python."
author: "Антон Ларичев"
title: "structlog: структурированное логирование в Python"
preview: "Узнайте, как с помощью structlog организовать структурированное логирование в Python-приложениях: JSON-вывод, контекст, процессоры и интеграция с logging."
---

## Что такое структурированное логирование

Традиционное логирование выводит строки вида:

```
2026-11-17 12:34:56 ERROR Ошибка подключения к базе данных: timeout after 30s
```

Такой формат удобно читать глазами, но крайне неудобно парсить машинно. Как только логов становится много — их нужно собирать, фильтровать и анализировать в таких системах, как Elasticsearch, Loki или Datadog. Произвольный текст для этого плохо подходит.

Структурированное логирование решает проблему иначе: каждая запись лога — это набор ключ-значение, сериализованный в JSON:

```json
{"event": "db_connection_error", "db_host": "postgres:5432", "timeout": 30, "level": "error", "timestamp": "2026-11-17T12:34:56Z"}
```

Такой лог легко фильтровать по полю, строить по нему метрики и хранить в поисковых системах без дополнительных парсеров.

`structlog` — самая зрелая библиотека для структурированного логирования в Python. Она не заменяет стандартный модуль `logging`, а дополняет его, добавляя удобный API и мощный конвейер обработки.

## Установка

```bash
pip install structlog
```

Для красивого вывода в терминале во время разработки рекомендуется установить дополнительные зависимости:

```bash
pip install structlog[dev]
# или отдельно:
pip install rich colorama
```

## Быстрый старт

Самый простой способ начать работу — использовать `structlog` без дополнительной настройки:

```python
import structlog

log = structlog.get_logger()

log.info("user_login", user_id=42, ip="192.168.1.1")
log.warning("rate_limit_exceeded", user_id=42, endpoint="/api/items", limit=100)
log.error("payment_failed", order_id="ord-123", reason="insufficient_funds")
```

По умолчанию в интерактивном терминале `structlog` выведет красиво отформатированный цветной текст. В не-TTY окружении (например, при перенаправлении в файл) — JSON.

## Архитектура: цепочка процессоров

Главная идея `structlog` — каждое событие проходит через цепочку **процессоров** (processors) перед выводом. Процессор — это функция, которая принимает логгер, имя метода и словарь события, и возвращает изменённый словарь (или строку для финального рендерера).

```
log.info("event", key=val)
       ↓
[TimeStamper] → добавляет timestamp
       ↓
[add_log_level] → добавляет level
       ↓
[CallsiteParameter] → добавляет файл и строку
       ↓
[JSONRenderer] → сериализует в JSON
       ↓
vывод в stdout
```

## Настройка для продакшена

Для реальных приложений нужна явная конфигурация. Вот типичная настройка для сервиса, который пишет JSON-логи:

```python
import logging
import sys
import structlog

def configure_logging(log_level: str = "INFO") -> None:
    # Настраиваем стандартный logging как бэкенд
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )

    structlog.configure(
        processors=[
            # Фильтрует записи ниже заданного уровня
            structlog.stdlib.filter_by_level,
            # Добавляет имя логгера
            structlog.stdlib.add_logger_name,
            # Добавляет уровень логирования
            structlog.stdlib.add_log_level,
            # Добавляет временную метку в ISO 8601
            structlog.processors.TimeStamper(fmt="iso"),
            # Оборачивает исключения в читаемый формат
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            # Финальный рендерер: JSON для продакшена
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
```

Вызывайте `configure_logging()` один раз при старте приложения, до любых вызовов логирования.

## Контекстные переменные: bind и unbind

Одна из сильнейших возможностей `structlog` — привязка контекста к логгеру. Вместо того чтобы передавать `user_id` в каждый вызов `log.info(...)`, можно один раз привязать его к логгеру:

```python
import structlog

log = structlog.get_logger()

def handle_request(user_id: int, request_id: str) -> None:
    # Создаём логгер с привязанным контекстом
    bound_log = log.bind(user_id=user_id, request_id=request_id)

    bound_log.info("request_started", path="/api/orders")

    try:
        process_order(bound_log)
    except Exception as e:
        bound_log.error("request_failed", exc_info=True)

def process_order(log: structlog.BoundLogger) -> None:
    # Добавляем ещё контекст без потери предыдущего
    log = log.bind(step="process_order")
    log.info("processing_payment")
    # ... логика ...
    log.info("payment_complete", amount=1500)
```

Все события от `bound_log` автоматически содержат `user_id` и `request_id`. Метод `bind()` создаёт новый объект логгера — исходный не изменяется, что делает код безопасным для конкурентного использования.

## Глобальный контекст через contextvars

В веб-приложениях удобно использовать `structlog` совместно с `contextvars` Python, чтобы контекст (например, `request_id`) автоматически присутствовал во всех логах в рамках одного запроса:

```python
import uuid
import structlog
from structlog.contextvars import bind_contextvars, clear_contextvars, merge_contextvars

# В конфигурации добавляем процессор merge_contextvars
structlog.configure(
    processors=[
        merge_contextvars,  # <-- добавляет контекст из contextvars
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    # ... остальные настройки
)

# Middleware для FastAPI / Starlette
async def logging_middleware(request, call_next):
    clear_contextvars()  # Очищаем контекст перед каждым запросом
    bind_contextvars(
        request_id=str(uuid.uuid4()),
        method=request.method,
        path=request.url.path,
    )

    log = structlog.get_logger()
    log.info("request_received")

    response = await call_next(request)

    log.info("request_completed", status_code=response.status_code)
    return response
```

Теперь любой `structlog.get_logger()` в любом месте кода, вызванный в рамках этого запроса, автоматически будет содержать `request_id`, `method` и `path`.

## Написание собственных процессоров

Процессор — это callable с сигнатурой `(logger, method_name, event_dict) -> event_dict`:

```python
import structlog
from typing import Any

def add_service_info(
    logger: Any,
    method: str,
    event_dict: dict,
) -> dict:
    """Добавляет информацию о сервисе в каждый лог."""
    event_dict["service"] = "payment-service"
    event_dict["version"] = "2.4.1"
    event_dict["env"] = "production"
    return event_dict

def mask_sensitive_data(
    logger: Any,
    method: str,
    event_dict: dict,
) -> dict:
    """Маскирует чувствительные поля."""
    if "card_number" in event_dict:
        card = event_dict["card_number"]
        event_dict["card_number"] = f"****{card[-4:]}"
    if "password" in event_dict:
        event_dict["password"] = "[REDACTED]"
    return event_dict

structlog.configure(
    processors=[
        add_service_info,
        mask_sensitive_data,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
)

log = structlog.get_logger()
log.info("payment_attempt", card_number="4111111111111234", amount=5000)
# → {"event": "payment_attempt", "card_number": "****1234", "amount": 5000, ...}
```

## Интеграция со стандартным logging

Во многих проектах уже используется стандартный `logging`, и библиотеки третьих сторон пишут логи через него. `structlog` умеет перехватывать эти логи и приводить их к единому формату.

```python
import logging
import structlog

# Настраиваем стандартный logging так, чтобы он использовал structlog-рендерер
logging.basicConfig(
    format="%(message)s",
    level=logging.INFO,
)

# Перехватчик для stdlib-логов
class StructlogHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        # Получаем structlog-логгер с именем из stdlib
        log = structlog.get_logger(record.name)
        level = record.levelname.lower()
        getattr(log, level)(
            record.getMessage(),
            exc_info=record.exc_info,
        )

# Добавляем обработчик к корневому логгеру
root_logger = logging.getLogger()
root_logger.handlers = [StructlogHandler()]

# Теперь логи из sqlalchemy, httpx и других библиотек
# будут проходить через structlog-процессоры
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
```

Альтернативный, более простой подход — использовать встроенный `ProcessorFormatter`:

```python
import logging
import sys
import structlog

shared_processors = [
    structlog.stdlib.add_log_level,
    structlog.processors.TimeStamper(fmt="iso"),
]

structlog.configure(
    processors=shared_processors + [
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

formatter = structlog.stdlib.ProcessorFormatter(
    processor=structlog.processors.JSONRenderer(),
    foreign_pre_chain=shared_processors,
)

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(formatter)

root_logger = logging.getLogger()
root_logger.addHandler(handler)
root_logger.setLevel(logging.INFO)
```

## Настройка для разработки: красивый вывод

Для локальной разработки JSON-формат неудобен — его тяжело читать. `structlog` умеет автоматически выбирать формат:

```python
import sys
import structlog

def configure_logging(debug: bool = False) -> None:
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="%H:%M:%S"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if debug or sys.stderr.isatty():
        # Красивый вывод для терминала
        processors.append(
            structlog.dev.ConsoleRenderer(
                colors=True,
                exception_formatter=structlog.dev.better_traceback,
            )
        )
    else:
        # JSON для продакшена
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
```

## Практический пример: FastAPI-приложение

Полная интеграция `structlog` в FastAPI-приложение:

```python
import uuid
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
import structlog
from structlog.contextvars import bind_contextvars, clear_contextvars

log = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(debug=False)
    log.info("app_started", host="0.0.0.0", port=8000)
    yield
    log.info("app_stopped")

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    clear_contextvars()
    bind_contextvars(
        request_id=str(uuid.uuid4()),
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host,
    )

    start_time = time.perf_counter()
    log.info("request_started")

    try:
        response: Response = await call_next(request)
    except Exception:
        log.exception("request_unhandled_error")
        raise
    finally:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        log.info(
            "request_finished",
            status_code=response.status_code,
            duration_ms=duration_ms,
        )

    return response

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    log.info("fetching_user", user_id=user_id)
    # ... логика ...
    return {"user_id": user_id, "name": "Alice"}
```

Каждый запрос будет генерировать логи вида:

```json
{"event": "request_started", "request_id": "a3f2...", "method": "GET", "path": "/users/42", "client_ip": "10.0.0.1", "level": "info", "timestamp": "2026-11-17T12:34:56Z"}
{"event": "fetching_user", "request_id": "a3f2...", "user_id": 42, "level": "info", "timestamp": "2026-11-17T12:34:56Z"}
{"event": "request_finished", "request_id": "a3f2...", "status_code": 200, "duration_ms": 12.5, "level": "info", "timestamp": "2026-11-17T12:34:56Z"}
```

## Логирование исключений

`structlog` корректно обрабатывает исключения через стандартный параметр `exc_info`:

```python
import structlog

log = structlog.get_logger()

def fetch_data(url: str) -> dict:
    try:
        # ... запрос к внешнему API ...
        raise ConnectionError("Connection refused")
    except ConnectionError:
        # exc_info=True добавляет полный traceback в лог
        log.error(
            "external_api_error",
            url=url,
            exc_info=True,
        )
        raise

# Или можно использовать метод exception(), который устанавливает exc_info=True автоматически
try:
    fetch_data("https://api.example.com/data")
except ConnectionError:
    log.exception("data_fetch_failed", retry_count=3)
```

## Советы по именованию событий

Качество структурированных логов во многом определяется именованием. Несколько практических правил:

- Используйте `snake_case` для имён событий: `user_created`, `payment_failed`
- Имя события (`event`) должно быть константой, а не форматированной строкой. Плохо: `f"User {user_id} logged in"`. Хорошо: `"user_logged_in"` с полем `user_id=user_id`
- Имена полей должны быть консистентными во всём приложении: всегда `user_id`, а не где-то `userId`, где-то `uid`
- Добавляйте единицы измерения в имя поля: `duration_ms`, `size_bytes`, `retry_count`

```python
# Плохо
log.info(f"User {user_id} purchased item {item_id} for {price} RUB")

# Хорошо
log.info(
    "purchase_completed",
    user_id=user_id,
    item_id=item_id,
    price_rub=price,
)
```

## Производительность

`structlog` достаточно быстр для большинства приложений, но есть несколько нюансов:

- Параметр `cache_logger_on_first_use=True` в `structlog.configure()` значительно ускоряет повторные вызовы, кешируя цепочку процессоров.
- Используйте уровни логирования осознанно — не пишите `DEBUG`-логи с тяжёлыми вычислениями без проверки уровня:

```python
# Плохо: serialize_to_debug_string() вызывается всегда, даже если DEBUG отключён
log.debug("state_dump", state=serialize_to_debug_string(huge_object))

# Хорошо: вычисление происходит только если DEBUG включён
if log.isEnabledFor(logging.DEBUG):
    log.debug("state_dump", state=serialize_to_debug_string(huge_object))
```

## Итоги

`structlog` превращает логирование из набора строк в структурированные данные, которые легко собирать, фильтровать и анализировать. Ключевые возможности:

- Конвейер процессоров для гибкой трансформации событий
- Привязка контекста через `bind()` и `contextvars`
- Автоматический выбор формата: красивый вывод в терминале, JSON в продакшене
- Бесшовная интеграция со стандартным `logging`

Хотите глубже разобраться с Python и научиться писать production-ready приложения? Смотрите курс по Python на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-structlog-logging