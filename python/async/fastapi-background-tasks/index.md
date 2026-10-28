---
metaTitle: "BackgroundTasks в FastAPI — фоновые задачи"
metaDescription: "Как использовать BackgroundTasks в FastAPI для выполнения задач после ответа: отправка писем, логирование, обработка данных."
author: "Антон Ларичев"
title: "Фоновые задачи FastAPI — BackgroundTasks"
preview: "Разбираем BackgroundTasks в FastAPI — как запускать задачи после отправки ответа клиенту без блокировки запроса."
---

## Что такое фоновые задачи

При разработке веб-приложений часто возникают ситуации, когда нужно выполнить какую-то работу после того, как ответ уже отправлен клиенту. Например, отправить приветственное письмо после регистрации, записать событие в аналитику, обработать загруженный файл или обновить кэш.

Если выполнять такие операции прямо внутри обработчика запроса, клиент будет ждать их завершения. Для длительных операций это неприемлемо — пользователь получит ответ только через несколько секунд.

FastAPI предоставляет встроенный механизм для решения этой задачи — класс `BackgroundTasks`. Он позволяет зарегистрировать функции, которые выполнятся **после** отправки ответа клиенту, не блокируя его.

## Как работает BackgroundTasks

`BackgroundTasks` — это класс из стандартной библиотеки Starlette, на которой построен FastAPI. Принцип работы прост:

1. Обработчик запроса регистрирует одну или несколько фоновых задач через метод `add_task`
2. FastAPI формирует и отправляет HTTP-ответ клиенту
3. После отправки ответа фоновые задачи выполняются последовательно в том же потоке/корутине

Важно понять: задачи выполняются **в том же процессе**, что и основное приложение. Это не отдельный воркер и не очередь задач. Если приложение упадёт или будет перезапущено — незавершённые фоновые задачи будут потеряны.

## Базовый пример

Подключить `BackgroundTasks` очень просто — достаточно добавить параметр с типом `BackgroundTasks` в сигнатуру обработчика.

```python
from fastapi import BackgroundTasks, FastAPI

app = FastAPI()


def send_welcome_email(email: str) -> None:
    # Имитируем отправку письма
    print(f"Отправляем письмо на {email}")


@app.post("/register")
async def register_user(
    email: str,
    background_tasks: BackgroundTasks,
):
    # Регистрируем фоновую задачу
    background_tasks.add_task(send_welcome_email, email)

    # Этот ответ вернётся клиенту сразу
    return {"message": "Пользователь зарегистрирован"}
```

FastAPI автоматически внедряет экземпляр `BackgroundTasks` через систему зависимостей — объявлять его вручную не нужно.

Метод `add_task` принимает:
- функцию для выполнения (первый аргумент)
- позиционные аргументы для этой функции
- именованные аргументы для этой функции

## Передача аргументов в задачу

```python
from fastapi import BackgroundTasks, FastAPI
from pydantic import BaseModel

app = FastAPI()


class UserRegistration(BaseModel):
    email: str
    username: str


def send_welcome_email(email: str, username: str) -> None:
    print(f"Отправляем письмо пользователю {username} на адрес {email}")


def log_registration(email: str, source: str = "web") -> None:
    print(f"Новая регистрация: {email}, источник: {source}")


@app.post("/register")
async def register_user(
    user: UserRegistration,
    background_tasks: BackgroundTasks,
):
    # Передаём позиционные аргументы
    background_tasks.add_task(send_welcome_email, user.email, user.username)

    # Передаём именованный аргумент
    background_tasks.add_task(log_registration, user.email, source="mobile-app")

    return {"message": "Регистрация прошла успешно"}
```

Задачи будут выполнены в порядке добавления — сначала `send_welcome_email`, затем `log_registration`.

## Асинхронные фоновые задачи

`BackgroundTasks` поддерживает как обычные, так и асинхронные функции. Если задача выполняет I/O операции (запросы к базе данных, HTTP-запросы), лучше использовать `async def`.

```python
import asyncio
import httpx
from fastapi import BackgroundTasks, FastAPI

app = FastAPI()


async def notify_analytics(user_id: int, event: str) -> None:
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://analytics.example.com/events",
            json={"user_id": user_id, "event": event},
        )


def write_to_log(message: str) -> None:
    # Обычная синхронная функция тоже работает
    with open("app.log", "a") as f:
        f.write(f"{message}\n")


@app.post("/users/{user_id}/login")
async def user_login(
    user_id: int,
    background_tasks: BackgroundTasks,
):
    background_tasks.add_task(notify_analytics, user_id, "login")
    background_tasks.add_task(write_to_log, f"User {user_id} logged in")

    return {"status": "ok"}
```

## Использование через зависимости

Одно из главных преимуществ `BackgroundTasks` — интеграция с системой зависимостей FastAPI. Можно передавать `BackgroundTasks` в зависимости и регистрировать задачи там.

```python
from fastapi import BackgroundTasks, Depends, FastAPI

app = FastAPI()


class EmailService:
    def __init__(self, background_tasks: BackgroundTasks):
        self.background_tasks = background_tasks

    def send_email(self, email: str, subject: str, body: str) -> None:
        self.background_tasks.add_task(
            self._do_send,
            email=email,
            subject=subject,
            body=body,
        )

    def _do_send(self, email: str, subject: str, body: str) -> None:
        # Логика отправки
        print(f"Письмо на {email}: {subject}")


def get_email_service(background_tasks: BackgroundTasks) -> EmailService:
    return EmailService(background_tasks)


@app.post("/orders/{order_id}/confirm")
async def confirm_order(
    order_id: int,
    email_service: EmailService = Depends(get_email_service),
):
    # Бизнес-логика подтверждения заказа
    # ...

    email_service.send_email(
        email="customer@example.com",
        subject=f"Заказ #{order_id} подтверждён",
        body="Ваш заказ принят в работу",
    )

    return {"order_id": order_id, "status": "confirmed"}
```

FastAPI автоматически передаёт один и тот же экземпляр `BackgroundTasks` во все зависимости в рамках одного запроса. Это означает, что задачи, добавленные в зависимости, будут выполнены вместе с задачами из основного обработчика.

## Обработка ошибок в фоновых задачах

Если фоновая задача выбросит исключение, это **не повлияет на ответ клиенту** — он уже получил его. Однако ошибка будет залогирована. Важно предусмотреть обработку исключений внутри самих задач.

```python
import logging
from fastapi import BackgroundTasks, FastAPI

app = FastAPI()
logger = logging.getLogger(__name__)


async def send_notification(user_id: int) -> None:
    try:
        # Потенциально падающий код
        await external_service.notify(user_id)
    except Exception as e:
        logger.error(
            f"Ошибка при отправке уведомления пользователю {user_id}: {e}"
        )
        # Можно добавить логику retry или запись в очередь для повторной обработки


@app.post("/notify/{user_id}")
async def notify_user(
    user_id: int,
    background_tasks: BackgroundTasks,
):
    background_tasks.add_task(send_notification, user_id)
    return {"message": "Уведомление поставлено в очередь"}
```

## Практический пример: обработка загруженного файла

Рассмотрим реальный сценарий — загрузка изображения с последующей обработкой (изменение размера, создание превью).

```python
import shutil
from pathlib import Path
from fastapi import BackgroundTasks, FastAPI, UploadFile
from PIL import Image

app = FastAPI()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def create_thumbnail(original_path: Path, size: tuple[int, int] = (200, 200)) -> None:
    thumbnail_path = original_path.parent / f"thumb_{original_path.name}"
    with Image.open(original_path) as img:
        img.thumbnail(size)
        img.save(thumbnail_path)
    print(f"Превью создано: {thumbnail_path}")


def optimize_image(file_path: Path) -> None:
    with Image.open(file_path) as img:
        # Сжимаем без потери качества
        img.save(file_path, optimize=True, quality=85)
    print(f"Изображение оптимизировано: {file_path}")


@app.post("/upload")
async def upload_image(
    file: UploadFile,
    background_tasks: BackgroundTasks,
):
    file_path = UPLOAD_DIR / file.filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Регистрируем обе задачи — выполнятся после ответа
    background_tasks.add_task(optimize_image, file_path)
    background_tasks.add_task(create_thumbnail, file_path)

    return {
        "filename": file.filename,
        "message": "Файл загружен, обработка начата",
    }
```

Клиент получает ответ мгновенно после сохранения файла, а оптимизация и создание превью происходят в фоне.

## Когда BackgroundTasks недостаточно

`BackgroundTasks` отлично подходит для простых задач, но имеет ограничения:

**Задачи выполняются в том же процессе.** При перезапуске приложения (деплой, краш) все незавершённые задачи теряются без возможности восстановления.

**Нет персистентности.** Если сервер упал до завершения задачи — она не будет выполнена повторно.

**Нет мониторинга.** Нельзя узнать статус задачи, отменить её или посмотреть результат.

**Блокирующие задачи тормозят воркер.** Если фоновая задача — это CPU-интенсивные вычисления, они будут блокировать event loop.

Для серьёзных сценариев используют специализированные инструменты:

| Сценарий | Инструмент |
|---|---|
| Длительные задачи с восстановлением | Celery + Redis/RabbitMQ |
| Периодические задачи | Celery Beat, APScheduler |
| Распределённая обработка | Celery, ARQ |
| Простые фоновые задачи | BackgroundTasks |

## Сравнение с запуском через asyncio

Можно подумать: а почему бы не использовать `asyncio.create_task` напрямую?

```python
import asyncio
from fastapi import FastAPI

app = FastAPI()


@app.post("/example")
async def example():
    # Так тоже работает, но менее предпочтительно
    asyncio.create_task(some_coroutine())
    return {"ok": True}
```

Разница в том, что `BackgroundTasks`:
- Интегрирован с жизненным циклом запроса FastAPI
- Поддерживает и синхронные, и асинхронные функции
- Работает через зависимости
- Задачи гарантированно стартуют после отправки ответа

При использовании `asyncio.create_task` задача может начать выполняться ещё до отправки ответа, и её нужно отдельно обрабатывать для синхронных функций.

## Тестирование обработчиков с BackgroundTasks

При тестировании через `TestClient` фоновые задачи выполняются **синхронно** до завершения запроса. Это упрощает тесты — не нужно ждать или мокировать асинхронность.

```python
from fastapi.testclient import TestClient
from unittest.mock import patch
import pytest


def test_register_sends_email():
    with patch("app.main.send_welcome_email") as mock_send:
        client = TestClient(app)
        response = client.post("/register", params={"email": "test@example.com"})

        assert response.status_code == 200
        # При использовании TestClient задача уже выполнена
        mock_send.assert_called_once_with("test@example.com")
```

Это поведение отличается от продакшна, где задачи выполняются после ответа, но для тестирования логики это удобно.

## Лучшие практики

**Держите задачи лёгкими.** BackgroundTasks предназначены для быстрых операций — отправка письма, запись в лог, обновление счётчика. Для тяжёлых задач используйте Celery или ARQ.

**Обрабатывайте исключения внутри задачи.** Клиент уже получил ответ — исключение в фоне не сможет ничего исправить, но должно быть залогировано.

**Не передавайте объекты с состоянием.** Объекты вроде соединений с БД, открытых файловых дескрипторов или HTTP-клиентов могут вести себя непредсказуемо, если их жизненный цикл завязан на запрос. Передавайте примитивы (id, строки) и открывайте ресурсы внутри задачи.

```python
# Плохо — соединение с БД может быть закрыто к моменту выполнения задачи
background_tasks.add_task(process_user, db_session, user_id)

# Хорошо — передаём только id, сессию открываем внутри задачи
background_tasks.add_task(process_user, user_id)
```

**Документируйте асинхронность.** В API-документации укажите, что операция выполняется асинхронно, чтобы клиент понимал: результат недоступен мгновенно.

## Итог

`BackgroundTasks` в FastAPI — простой и эффективный способ выполнять задачи после отправки ответа клиенту. Он встроен в фреймворк, не требует дополнительной инфраструктуры и прекрасно работает с системой зависимостей FastAPI.

Используйте его для отправки уведомлений, записи логов, обновления некритичных данных и других лёгких операций. Для задач, требующих гарантии выполнения, персистентности или мониторинга, переходите к полноценным системам очередей.

Чтобы глубже освоить FastAPI и асинхронное программирование на Python, изучите курс на PurpleSchool: [FastAPI — разработка backend на Python](https://purpleschool.ru/course/fastapi?utm_source=knowledgebase&utm_medium=text&utm_campaign=fastapi-background-tasks)
