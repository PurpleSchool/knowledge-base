---
metaTitle: "FastAPI lifespan — управление ресурсами при запуске и остановке"
metaDescription: "Как использовать lifespan в FastAPI для инициализации и освобождения ресурсов: БД, пулы соединений, ML-модели. Примеры на Python."
author: "Антон Ларичев"
title: "FastAPI lifespan: управление ресурсами приложения"
preview: "Разбираем механизм lifespan в FastAPI — современный способ управлять ресурсами при старте и остановке приложения."
---

## Что такое lifespan и зачем он нужен

При запуске реального веб-приложения почти всегда нужно выполнить подготовительную работу: открыть соединение с базой данных, загрузить ML-модель в память, создать пул HTTP-клиентов. При остановке — корректно закрыть все эти ресурсы, чтобы не было утечек и незавершённых транзакций.

FastAPI решает эту задачу через механизм **lifespan** — специальный асинхронный контекстный менеджер, который оборачивает весь жизненный цикл приложения. Всё, что находится до `yield`, выполняется при запуске. Всё после `yield` — при остановке.

До версии FastAPI 0.93 для этого использовались декораторы `@app.on_event("startup")` и `@app.on_event("shutdown")`. Они до сих пор работают, но официально объявлены устаревшими. Lifespan — рекомендуемый современный подход.

## Базовый пример lifespan

Для создания lifespan-функции используется `asynccontextmanager` из стандартной библиотеки:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Выполняется при старте
    print("Приложение запускается")
    
    yield  # Здесь приложение работает и обрабатывает запросы
    
    # Выполняется при остановке
    print("Приложение останавливается")


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root():
    return {"status": "ok"}
```

FastAPI принимает lifespan-функцию как аргумент при создании приложения. Это принципиальное отличие от старого подхода с декораторами — зависимость явная и хорошо видна в коде.

## Управление подключением к базе данных

Самый частый сценарий — открытие и закрытие соединения с базой данных. Рассмотрим пример с `asyncpg` (асинхронный драйвер PostgreSQL):

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import asyncpg

db_pool = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_pool = await asyncpg.create_pool(
        dsn="postgresql://user:password@localhost/mydb",
        min_size=5,
        max_size=20,
    )
    print(f"Пул соединений создан: {db_pool}")
    
    yield
    
    await db_pool.close()
    print("Пул соединений закрыт")


app = FastAPI(lifespan=lifespan)


@app.get("/users/{user_id}")
async def get_user(user_id: int):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, email FROM users WHERE id = $1",
            user_id
        )
    if row is None:
        return {"error": "not found"}
    return dict(row)
```

Использование глобальной переменной — простой, но не самый изящный способ. Более чистая альтернатива — хранить ресурсы в `app.state`:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_pool = await asyncpg.create_pool(
        dsn="postgresql://user:password@localhost/mydb",
        min_size=5,
        max_size=20,
    )
    
    yield
    
    await app.state.db_pool.close()


app = FastAPI(lifespan=lifespan)


@app.get("/users/{user_id}")
async def get_user(user_id: int, request: Request):
    pool = request.app.state.db_pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, email FROM users WHERE id = $1",
            user_id
        )
    return dict(row) if row else {"error": "not found"}
```

`app.state` — специальный объект FastAPI для хранения произвольных данных на уровне приложения. Доступ к нему из обработчиков происходит через `request.app.state`.

## Загрузка ML-модели

Загрузка тяжёлых ML-моделей при каждом запросе — распространённая ошибка начинающих. Модель нужно загрузить один раз при старте и держать в памяти:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
import asyncio


def load_model():
    # Имитация загрузки тяжёлой модели
    import time
    time.sleep(2)
    return {"type": "classifier", "ready": True}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Загружаем модель в отдельном потоке, чтобы не блокировать event loop
    loop = asyncio.get_event_loop()
    model = await loop.run_in_executor(None, load_model)
    app.state.model = model
    print("Модель загружена")
    
    yield
    
    # Освобождаем ресурсы модели при необходимости
    del app.state.model
    print("Модель выгружена")


app = FastAPI(lifespan=lifespan)


@app.post("/predict")
async def predict(request: Request, data: dict):
    model = request.app.state.model
    # Используем модель для предсказания
    return {"prediction": "result", "model_ready": model["ready"]}
```

Обратите внимание на `run_in_executor` — CPU-интенсивные операции (загрузка модели, чтение файлов) нужно выносить в поток, чтобы не блокировать асинхронный event loop FastAPI.

## Несколько ресурсов в одном lifespan

Реальные приложения работают с несколькими ресурсами одновременно. Lifespan позволяет инициализировать их все в одном месте:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import asyncpg
import aioredis
import httpx


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Инициализируем все ресурсы
    app.state.db = await asyncpg.create_pool(
        dsn="postgresql://user:pass@localhost/mydb"
    )
    app.state.redis = await aioredis.from_url(
        "redis://localhost:6379",
        decode_responses=True
    )
    app.state.http_client = httpx.AsyncClient(
        timeout=30.0,
        limits=httpx.Limits(max_connections=100)
    )
    
    print("Все ресурсы инициализированы")
    yield
    
    # Закрываем в обратном порядке
    await app.state.http_client.aclose()
    await app.state.redis.close()
    await app.state.db.close()
    
    print("Все ресурсы освобождены")


app = FastAPI(lifespan=lifespan)
```

Порядок инициализации и закрытия имеет значение. Закрывать ресурсы лучше в обратном порядке инициализации — это стандартная практика управления зависимостями.

## Обработка ошибок в lifespan

Что произойдёт, если при инициализации возникнет ошибка? FastAPI прервёт запуск, а код после `yield` (для освобождения ресурсов) выполнен не будет. Это нужно учитывать:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    db_pool = None
    redis = None
    
    try:
        db_pool = await asyncpg.create_pool(
            dsn="postgresql://user:pass@localhost/mydb"
        )
        redis = await aioredis.from_url("redis://localhost:6379")
        
        app.state.db = db_pool
        app.state.redis = redis
        
        yield
        
    finally:
        # finally гарантирует выполнение кода при любом исходе
        if redis is not None:
            await redis.close()
        if db_pool is not None:
            await db_pool.close()
```

Блок `try/finally` гарантирует, что ресурсы будут освобождены даже если:
- При инициализации следующего ресурса произошла ошибка
- Приложение получило сигнал завершения во время работы
- В обработчике запроса возникло необработанное исключение

## Разбивка lifespan на компоненты

При росте приложения lifespan-функция может разрастись. Хороший способ структурировать код — вынести инициализацию каждого ресурса в отдельные функции:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import asyncpg
import aioredis


async def init_database(app: FastAPI):
    app.state.db = await asyncpg.create_pool(
        dsn="postgresql://user:pass@localhost/mydb",
        min_size=2,
        max_size=10,
    )


async def close_database(app: FastAPI):
    await app.state.db.close()


async def init_cache(app: FastAPI):
    app.state.cache = await aioredis.from_url(
        "redis://localhost:6379",
        decode_responses=True
    )


async def close_cache(app: FastAPI):
    await app.state.cache.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_database(app)
    await init_cache(app)
    
    yield
    
    await close_cache(app)
    await close_database(app)


app = FastAPI(lifespan=lifespan)
```

Такая структура легко читается, каждый модуль отвечает за свой ресурс, и добавить новый ресурс можно без изменения основной логики.

## Lifespan в подприложениях (sub-applications)

FastAPI поддерживает монтирование подприложений. У каждого из них может быть свой lifespan:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def main_lifespan(app: FastAPI):
    print("Главное приложение: старт")
    app.state.config = {"debug": True}
    yield
    print("Главное приложение: стоп")


@asynccontextmanager
async def api_lifespan(app: FastAPI):
    print("API подприложение: старт")
    yield
    print("API подприложение: стоп")


main_app = FastAPI(lifespan=main_lifespan)
api_app = FastAPI(lifespan=api_lifespan)


@api_app.get("/items")
async def get_items():
    return [{"id": 1, "name": "item"}]


main_app.mount("/api/v1", api_app)
```

Lifespan каждого подприложения выполняется независимо при монтировании. Это позволяет создавать изолированные модули с собственными ресурсами.

## Тестирование с lifespan

При написании тестов важно, чтобы lifespan тоже выполнялся — иначе ресурсы не будут инициализированы. `TestClient` из `httpx` и встроенный тестовый клиент FastAPI поддерживают это через контекстный менеджер:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.items = []
    yield
    app.state.items.clear()


app = FastAPI(lifespan=lifespan)


@app.get("/items")
async def get_items(request):
    return request.app.state.items


@app.post("/items")
async def add_item(request, item: dict):
    request.app.state.items.append(item)
    return item


def test_items_empty_on_start():
    # Используем TestClient как контекстный менеджер
    # — это запускает lifespan
    with TestClient(app) as client:
        response = client.get("/items")
        assert response.status_code == 200
        assert response.json() == []


def test_add_and_get_item():
    with TestClient(app) as client:
        client.post("/items", json={"name": "test"})
        response = client.get("/items")
        assert len(response.json()) == 1
```

Ключевой момент — использование `TestClient` именно как контекстный менеджер (`with TestClient(app) as client`). При входе в блок `with` выполняется startup-часть lifespan, при выходе — shutdown-часть.

Если создать `TestClient(app)` без `with`, lifespan не выполнится и `app.state` будет пустым.

## Сравнение с устаревшим подходом on_event

Старый способ через декораторы выглядел так:

```python
# Устаревший подход — не используйте в новом коде
app = FastAPI()

@app.on_event("startup")
async def startup():
    app.state.db = await asyncpg.create_pool(dsn="...")

@app.on_event("shutdown")
async def shutdown():
    await app.state.db.close()
```

Главный недостаток старого подхода — startup и shutdown логически связаны (один ресурс открывается и закрывается), но физически разделены в коде. При добавлении новых ресурсов легко забыть написать соответствующий shutdown или перепутать порядок закрытия.

Lifespan решает это: весь жизненный цикл одного ресурса описан в одном месте, до и после `yield`.

```python
# Современный подход
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Открыть
    app.state.db = await asyncpg.create_pool(dsn="...")
    yield
    # Закрыть — рядом с открытием, невозможно забыть
    await app.state.db.close()

app = FastAPI(lifespan=lifespan)
```

## Практические рекомендации

**Используйте `app.state` для хранения ресурсов.** Это официально поддерживаемый способ передачи данных на уровне приложения. Глобальные переменные работают, но усложняют тестирование.

**Используйте `try/finally` для критичных ресурсов.** Если нужно гарантировать освобождение ресурса даже при ошибках инициализации — заворачивайте в `try/finally`.

**Запускайте тяжёлые синхронные операции через `run_in_executor`.** Загрузка файлов, инициализация C-библиотек и любой блокирующий код должны выполняться в пуле потоков, иначе вы заблокируете event loop на время старта.

**Закрывайте ресурсы в обратном порядке.** Если ресурс B зависит от ресурса A — закрывайте сначала B, потом A.

**Проверяйте lifespan в тестах через `with TestClient(app)`.** Иначе тесты будут проходить в условиях, отличных от production.

---

Чтобы глубже освоить асинхронное программирование в Python и разработку production-ready приложений на FastAPI, записывайтесь на курс по Python на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=fastapi-lifespan