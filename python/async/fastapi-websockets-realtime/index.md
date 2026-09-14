---
metaTitle: "FastAPI WebSockets: двусторонняя связь в реальном времени"
metaDescription: "Как использовать WebSockets в FastAPI для real-time приложений: чат, уведомления, трансляция событий. Примеры с asyncio и управлением соединениями."
author: "Антон Ларичев"
title: "FastAPI WebSockets в реальном времени"
preview: "Разбираем WebSockets в FastAPI: от базового соединения до многопользовательского чата с управлением подключениями и аутентификацией."
---

## Что такое WebSockets и зачем они нужны

HTTP работает по модели запрос-ответ: клиент отправляет запрос, сервер отвечает, соединение закрывается. Для приложений реального времени — чатов, дашбордов с живыми данными, уведомлений — такая модель неэффективна. Приходится либо делать частые опросы (polling), либо держать длинные соединения (long polling).

WebSocket — протокол, который устанавливает постоянное двустороннее соединение между клиентом и сервером. После рукопожатия (handshake) обе стороны могут отправлять сообщения в любой момент без повторного установления соединения.

FastAPI поддерживает WebSockets нативно, опираясь на Starlette под капотом. Поскольку FastAPI строится на asyncio, WebSocket-обработчики пишутся в привычном async/await стиле.

## Установка и базовая настройка

Для работы с FastAPI WebSockets достаточно стандартной установки:

```bash
pip install fastapi uvicorn
```

Для продакшн-деплоя с поддержкой WebSockets используйте `uvicorn` с флагом `--ws`:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Первый WebSocket-эндпоинт

Создадим простейшее эхо-соединение:

```python
from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Получено: {data}")
```

Что здесь происходит:
- `websocket.accept()` — завершает WebSocket-рукопожатие, соединение установлено
- `receive_text()` — ждёт текстовое сообщение от клиента (корутина блокируется до получения)
- `send_text()` — отправляет ответ

Проверить работу можно прямо в браузере через JavaScript:

```javascript
const ws = new WebSocket("ws://localhost:8000/ws");
ws.onmessage = (event) => console.log(event.data);
ws.send("Привет, FastAPI!");
// В консоли: "Получено: Привет, FastAPI!"
```

## Обработка разрывов соединения

В реальном приложении соединения рвутся. Нужно обрабатывать исключение `WebSocketDisconnect`:

```python
from fastapi import FastAPI, WebSocket
from fastapi.websockets import WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    print(f"Клиент {client_id} подключился")
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"[{client_id}]: {data}")
    except WebSocketDisconnect:
        print(f"Клиент {client_id} отключился")
```

Параметры пути (`client_id`) работают так же, как в обычных HTTP-маршрутах.

## Менеджер соединений для многопользовательского чата

Ключевая задача в real-time приложениях — управление множеством одновременных соединений и трансляция сообщений. Создадим менеджер:

```python
from fastapi import FastAPI, WebSocket
from fastapi.websockets import WebSocketDisconnect
from typing import list

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


app = FastAPI()
manager = ConnectionManager()

@app.websocket("/chat/{username}")
async def chat_endpoint(websocket: WebSocket, username: str):
    await manager.connect(websocket)
    await manager.broadcast(f"{username} вошёл в чат")
    try:
        while True:
            message = await websocket.receive_text()
            await manager.broadcast(f"{username}: {message}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"{username} покинул чат")
```

Теперь каждое сообщение от любого клиента рассылается всем подключённым участникам.

## Отправка структурированных данных через JSON

Текстовые сообщения удобны для чата, но для реальных приложений нужна структура. FastAPI позволяет работать с JSON напрямую:

```python
import json
from datetime import datetime
from fastapi import FastAPI, WebSocket
from fastapi.websockets import WebSocketDisconnect
from pydantic import BaseModel

class ChatMessage(BaseModel):
    username: str
    text: str
    timestamp: str

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_json(self, data: dict):
        for connection in self.active_connections:
            await connection.send_json(data)


manager = ConnectionManager()

@app.websocket("/ws/chat/{username}")
async def chat_endpoint(websocket: WebSocket, username: str):
    await manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            payload = json.loads(raw)
            message = ChatMessage(
                username=username,
                text=payload.get("text", ""),
                timestamp=datetime.now().isoformat(),
            )
            await manager.broadcast_json(message.model_dump())
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

Метод `send_json()` автоматически сериализует словарь и отправляет его как текстовый фрейм с JSON-содержимым.

## Аутентификация WebSocket-соединений

WebSocket-запрос — это обычный HTTP-запрос при установке соединения. Можно передавать токен через query-параметр или заголовок:

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from typing import Optional

app = FastAPI()

def verify_token(token: str) -> Optional[str]:
    # В реальном приложении здесь декодирование JWT
    valid_tokens = {"secret-token-1": "alice", "secret-token-2": "bob"}
    return valid_tokens.get(token)

@app.websocket("/ws/secure")
async def secure_websocket(
    websocket: WebSocket,
    token: str = Query(...),
):
    username = verify_token(token)
    if not username:
        await websocket.close(code=1008)  # Policy Violation
        return

    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"[{username}]: {data}")
    except WebSocketDisconnect:
        pass
```

Важный нюанс: стандарт WebSocket не позволяет браузеру отправлять произвольные заголовки при установке соединения. Поэтому токен чаще передаётся через query-параметр или в первом сообщении после подключения.

Подключение с клиента:

```javascript
const ws = new WebSocket("ws://localhost:8000/ws/secure?token=secret-token-1");
```

## Трансляция данных от сервера к клиентам (Push)

WebSockets полезны не только для чата, но и для серверных уведомлений — например, обновление метрик дашборда. Здесь сервер сам инициирует отправку:

```python
import asyncio
import random
from fastapi import FastAPI, WebSocket
from fastapi.websockets import WebSocketDisconnect

app = FastAPI()

active_clients: list[WebSocket] = []

async def metrics_generator():
    """Фоновая задача: генерирует метрики и рассылает всем клиентам"""
    while True:
        await asyncio.sleep(1)
        if not active_clients:
            continue
        data = {
            "cpu": round(random.uniform(10, 90), 1),
            "memory": round(random.uniform(30, 80), 1),
            "requests_per_sec": random.randint(100, 5000),
        }
        dead = []
        for client in active_clients:
            try:
                await client.send_json(data)
            except Exception:
                dead.append(client)
        for d in dead:
            active_clients.remove(d)

@app.on_event("startup")
async def startup():
    asyncio.create_task(metrics_generator())

@app.websocket("/ws/metrics")
async def metrics_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_clients.append(websocket)
    try:
        # Держим соединение живым, ожидая сообщений от клиента
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_clients.remove(websocket)
```

Фоновая задача `metrics_generator` работает независимо от соединений и рассылает данные всем подключённым клиентам каждую секунду.

## Комнаты и группы соединений

Для сложных приложений (чаты с комнатами, игры) нужна группировка соединений:

```python
from collections import defaultdict
from fastapi import FastAPI, WebSocket
from fastapi.websockets import WebSocketDisconnect

app = FastAPI()

class RoomManager:
    def __init__(self):
        # room_id -> список WebSocket
        self.rooms: dict[str, list[WebSocket]] = defaultdict(list)

    async def join(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        self.rooms[room_id].append(websocket)

    def leave(self, room_id: str, websocket: WebSocket):
        self.rooms[room_id].remove(websocket)
        if not self.rooms[room_id]:
            del self.rooms[room_id]

    async def broadcast_to_room(self, room_id: str, message: str, sender: WebSocket):
        for ws in self.rooms.get(room_id, []):
            if ws != sender:
                await ws.send_text(message)


room_manager = RoomManager()

@app.websocket("/ws/room/{room_id}/{username}")
async def room_endpoint(websocket: WebSocket, room_id: str, username: str):
    await room_manager.join(room_id, websocket)
    try:
        while True:
            message = await websocket.receive_text()
            await room_manager.broadcast_to_room(
                room_id,
                f"{username}: {message}",
                sender=websocket,
            )
    except WebSocketDisconnect:
        room_manager.leave(room_id, websocket)
```

## Ping/Pong и keepalive

WebSocket-соединения могут разрываться из-за таймаутов прокси или сетевых проблем. Для поддержания соединения живым используют ping/pong:

```python
import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.websockets import WebSocketDisconnect

app = FastAPI()

PING_INTERVAL = 30  # секунд

@app.websocket("/ws/keepalive")
async def keepalive_endpoint(websocket: WebSocket):
    await websocket.accept()

    async def send_pings():
        while True:
            await asyncio.sleep(PING_INTERVAL)
            try:
                await websocket.send_text("ping")
            except Exception:
                break

    ping_task = asyncio.create_task(send_pings())
    try:
        while True:
            data = await websocket.receive_text()
            if data == "pong":
                continue  # клиент жив
            await websocket.send_text(f"Эхо: {data}")
    except WebSocketDisconnect:
        pass
    finally:
        ping_task.cancel()
```

На клиенте нужно отвечать на ping:

```javascript
ws.onmessage = (event) => {
    if (event.data === "ping") {
        ws.send("pong");
        return;
    }
    console.log(event.data);
};
```

## Тестирование WebSocket-эндпоинтов

FastAPI предоставляет `TestClient` с поддержкой WebSockets через контекстный менеджер:

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_websocket_echo():
    with client.websocket_connect("/ws") as ws:
        ws.send_text("тест")
        response = ws.receive_text()
        assert response == "Получено: тест"

def test_websocket_json():
    with client.websocket_connect("/ws") as ws:
        ws.send_json({"action": "ping"})
        data = ws.receive_json()
        assert "timestamp" in data
```

`TestClient` основан на `requests` и `websockets`, поэтому работает в синхронном контексте — тесты не нужно помечать как `async`.

## Типичные ошибки и как их избежать

**Не вызван `accept()` до отправки сообщений.** FastAPI не вызывает его автоматически. Если попытаться отправить данные до `accept()`, получите ошибку соединения.

**Нет обработки `WebSocketDisconnect`.** Без try/except при отключении клиента в цикле возникнет необработанное исключение, и соединение останется в менеджере «мёртвым».

**Блокирующий код в обработчике.** WebSocket-обработчик выполняется в event loop. Любой синхронный блокирующий вызов (запрос к БД без asyncio, тяжёлые вычисления) заморозит все соединения. Используйте `asyncio.to_thread()` или `run_in_executor()` для CPU-bound задач.

```python
import asyncio

@app.websocket("/ws/heavy")
async def heavy_endpoint(websocket: WebSocket):
    await websocket.accept()
    data = await websocket.receive_text()
    # Выносим блокирующую операцию в поток
    result = await asyncio.to_thread(expensive_cpu_operation, data)
    await websocket.send_text(result)
```

**Утечка памяти при хранении соединений.** Список `active_connections` нужно чистить не только при `WebSocketDisconnect`, но и при любых других исключениях — используйте блок `finally`:

```python
try:
    await manager.connect(websocket)
    while True:
        ...
except WebSocketDisconnect:
    pass
finally:
    manager.disconnect(websocket)  # выполнится всегда
```

## Масштабирование с Redis Pub/Sub

При горизонтальном масштабировании (несколько инстансов FastAPI) in-memory список соединений не работает — клиент одного инстанса не получит сообщение, отправленное через другой. Решение — Redis Pub/Sub:

```python
import asyncio
import aioredis
from fastapi import FastAPI, WebSocket
from fastapi.websockets import WebSocketDisconnect

app = FastAPI()
local_connections: list[WebSocket] = []

@app.on_event("startup")
async def startup():
    redis = await aioredis.from_url("redis://localhost")
    pubsub = redis.pubsub()
    await pubsub.subscribe("chat")
    asyncio.create_task(redis_listener(pubsub))

async def redis_listener(pubsub):
    async for message in pubsub.listen():
        if message["type"] != "message":
            continue
        text = message["data"].decode()
        for ws in local_connections[:]:
            try:
                await ws.send_text(text)
            except Exception:
                local_connections.remove(ws)

@app.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    local_connections.append(websocket)
    redis = await aioredis.from_url("redis://localhost")
    try:
        while True:
            message = await websocket.receive_text()
            await redis.publish("chat", message)
    except WebSocketDisconnect:
        local_connections.remove(websocket)
```

Теперь каждый инстанс подписывается на Redis-канал и пересылает сообщения своим локальным клиентам.

## Итог

FastAPI предоставляет удобный и идиоматичный способ работы с WebSockets через async/await. Для большинства задач достаточно `ConnectionManager` с broadcast-методом. При росте нагрузки добавляется Redis Pub/Sub для синхронизации между инстансами.

Основные принципы:
- Всегда вызывайте `accept()` перед работой с соединением
- Оборачивайте цикл в `try/except WebSocketDisconnect` и очищайте соединения в `finally`
- Выносите блокирующий код в потоки через `asyncio.to_thread()`
- Для масштабирования используйте Redis Pub/Sub или аналогичный брокер

Чтобы глубже разобраться с asyncio, FastAPI и построением production-ready API на Python, смотрите курс на PurpleSchool:

[Курс по Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=fastapi-websockets-realtime)