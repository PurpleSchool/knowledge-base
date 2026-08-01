---
metaTitle: "Redis в Python с asyncio — aioredis и redis-py"
metaDescription: "Как работать с Redis в асинхронном Python: подключение, базовые операции, pipeline, pub/sub, пул соединений и кэширование в FastAPI."
author: "Антон Ларичев"
title: "Redis в Python с asyncio"
preview: "Полное руководство по асинхронной работе с Redis в Python через redis.asyncio: от подключения до rate limiting и Pub/Sub."
---

## Что такое Redis и зачем использовать его с asyncio

Redis — это высокопроизводительное хранилище данных в памяти, которое применяется для кэширования, очередей сообщений, управления сессиями и многих других задач. В современных Python-приложениях, построенных на FastAPI, aiohttp или других асинхронных фреймворках, крайне важно взаимодействовать с Redis тоже асинхронно — иначе блокирующие вызовы остановят весь event loop и сведут на нет все преимущества asyncio.

Библиотека `redis-py` начиная с версии 4.2 включает встроенную поддержку asyncio через модуль `redis.asyncio`. Она полностью заменяет отдельную библиотеку `aioredis`, которая была поглощена и интегрирована в основной пакет.

## Установка

Для работы с Redis через asyncio достаточно одного пакета:

```bash
pip install redis
```

Для локального запуска Redis удобно использовать Docker:

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

## Подключение к Redis

Самый простой способ создать асинхронного клиента:

```python
import asyncio
import redis.asyncio as aioredis

async def main():
    client = aioredis.Redis(
        host="localhost",
        port=6379,
        db=0,
        decode_responses=True
    )

    await client.ping()
    print("Подключено к Redis")

    await client.aclose()

asyncio.run(main())
```

Параметр `decode_responses=True` автоматически декодирует байтовые ответы Redis в строки Python — без него вы будете получать `bytes` вместо `str`.

### Подключение через URL

```python
client = aioredis.from_url("redis://localhost:6379/0", decode_responses=True)
```

Такой формат удобен при работе с переменными окружения — пароль, хост и номер базы данных можно передать одной строкой:

```python
import os

client = aioredis.from_url(
    os.environ["REDIS_URL"],
    decode_responses=True
)
```

## Базовые операции

### SET и GET

```python
async def basic_operations():
    client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

    await client.set("user:1:name", "Антон")

    name = await client.get("user:1:name")
    print(name)  # Антон

    missing = await client.get("nonexistent")
    print(missing)  # None

    await client.aclose()

asyncio.run(basic_operations())
```

### Установка TTL

Одна из самых частых задач при кэшировании — автоматическое истечение ключей:

```python
async def ttl_example():
    client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

    # Установить ключ с TTL 30 секунд
    await client.set("session:abc123", "user_id=42", ex=30)

    # Проверить оставшееся время жизни
    ttl = await client.ttl("session:abc123")
    print(f"TTL: {ttl} секунд")

    # Установить TTL для уже существующего ключа
    await client.set("cache:data", "some_value")
    await client.expire("cache:data", 60)

    # Получить оставшееся время в миллисекундах
    pttl = await client.pttl("cache:data")
    print(f"PTTL: {pttl} мс")

    await client.aclose()
```

### Удаление ключей

```python
async def delete_keys():
    client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

    await client.set("temp", "value")

    deleted = await client.delete("temp")
    print(deleted)  # 1 (количество удалённых ключей)

    await client.mset({"key1": "v1", "key2": "v2", "key3": "v3"})
    deleted_count = await client.delete("key1", "key2", "key3")
    print(deleted_count)  # 3

    await client.aclose()
```

## Работа со структурами данных

### Хэши (Hash)

Хэши отлично подходят для хранения объектов с несколькими полями:

```python
async def hash_operations():
    client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

    await client.hset("user:42", mapping={
        "name": "Антон",
        "email": "anton@example.com",
        "role": "admin"
    })

    name = await client.hget("user:42", "name")
    print(name)  # Антон

    user = await client.hgetall("user:42")
    print(user)  # {'name': 'Антон', 'email': 'anton@example.com', 'role': 'admin'}

    exists = await client.hexists("user:42", "email")
    print(exists)  # True

    await client.hdel("user:42", "role")

    await client.aclose()
```

### Списки (List)

Списки Redis идеальны для очередей и стеков задач:

```python
async def list_operations():
    client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

    await client.rpush("tasks", "task:1", "task:2", "task:3")
    await client.lpush("tasks", "task:0")

    tasks = await client.lrange("tasks", 0, -1)
    print(tasks)  # ['task:0', 'task:1', 'task:2', 'task:3']

    length = await client.llen("tasks")
    print(length)  # 4

    task = await client.lpop("tasks")
    print(task)  # task:0

    # Блокирующий pop: ждёт до 5 секунд появления элемента
    result = await client.blpop("tasks", timeout=5)
    if result:
        key, value = result
        print(f"Получено из '{key}': {value}")

    await client.aclose()
```

### Множества (Set)

```python
async def set_operations():
    client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

    await client.sadd("online_users", "user:1", "user:2", "user:3")

    is_online = await client.sismember("online_users", "user:1")
    print(is_online)  # True

    count = await client.scard("online_users")
    print(count)  # 3

    await client.srem("online_users", "user:2")

    members = await client.smembers("online_users")
    print(members)  # {'user:1', 'user:3'}

    await client.aclose()
```

## Пул соединений

В продакшн-приложениях не стоит создавать новое соединение на каждый запрос. Правильный подход — использовать пул соединений, который переиспользует уже установленные:

```python
from redis.asyncio import ConnectionPool
import redis.asyncio as aioredis

pool = ConnectionPool.from_url(
    "redis://localhost:6379",
    decode_responses=True,
    max_connections=20
)

async def get_redis() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=pool)
```

Пример интеграции с FastAPI через Depends:

```python
from fastapi import FastAPI, Depends

app = FastAPI()

@app.get("/user/{user_id}")
async def get_user(
    user_id: int,
    redis: aioredis.Redis = Depends(get_redis)
):
    return await redis.hgetall(f"user:{user_id}")

@app.on_event("shutdown")
async def shutdown():
    await pool.aclose()
```

## Pipeline — пакетная отправка команд

Pipeline позволяет отправить несколько команд одним TCP-пакетом и значительно сократить задержки:

```python
async def pipeline_example():
    client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

    async with client.pipeline(transaction=False) as pipe:
        pipe.set("key1", "value1")
        pipe.set("key2", "value2")
        pipe.get("key1")
        pipe.get("key2")
        results = await pipe.execute()

    print(results)  # [True, True, 'value1', 'value2']

    await client.aclose()
```

### Транзакции (MULTI/EXEC)

Для атомарного выполнения нескольких команд с оптимистичной блокировкой:

```python
async def transaction_example():
    client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

    async with client.pipeline(transaction=True) as pipe:
        while True:
            try:
                await pipe.watch("account:balance")
                balance = int(await pipe.get("account:balance") or 0)

                new_balance = balance - 100
                if new_balance < 0:
                    raise ValueError("Недостаточно средств")

                pipe.multi()
                pipe.set("account:balance", new_balance)
                await pipe.execute()
                break
            except aioredis.WatchError:
                # Ключ изменился между WATCH и EXEC — повторяем
                continue

    await client.aclose()
```

## Pub/Sub — публикация и подписка

Redis Pub/Sub реализует паттерн публикатор/подписчик для обмена сообщениями в реальном времени:

```python
import asyncio
import redis.asyncio as aioredis

async def subscriber():
    client = aioredis.from_url("redis://localhost:6379", decode_responses=True)
    pubsub = client.pubsub()

    await pubsub.subscribe("notifications", "events")
    print("Подписчик запущен...")

    async for message in pubsub.listen():
        if message["type"] == "message":
            print(f"Из '{message['channel']}': {message['data']}")

    await client.aclose()

async def publisher():
    client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

    await asyncio.sleep(1)  # Дать подписчику время подключиться
    await client.publish("notifications", "Новый пользователь зарегистрирован")
    await client.publish("events", "user.created:42")

    await client.aclose()

async def main():
    await asyncio.gather(subscriber(), publisher())

asyncio.run(main())
```

## Практический пример: кэширование в FastAPI

Реальный сценарий — кэширование результатов дорогостоящих запросов к базе данных:

```python
import json
import asyncio
from redis.asyncio import ConnectionPool
import redis.asyncio as aioredis
from fastapi import FastAPI, Depends

app = FastAPI()
redis_pool = ConnectionPool.from_url(
    "redis://localhost:6379",
    decode_responses=True,
    max_connections=10
)

async def get_redis():
    return aioredis.Redis(connection_pool=redis_pool)

async def get_product_from_db(product_id: int) -> dict:
    await asyncio.sleep(0.5)  # имитация медленного запроса
    return {"id": product_id, "name": f"Товар {product_id}", "price": 999}

@app.get("/products/{product_id}")
async def get_product(
    product_id: int,
    redis: aioredis.Redis = Depends(get_redis)
):
    cache_key = f"product:{product_id}"

    cached = await redis.get(cache_key)
    if cached:
        return {"source": "cache", "data": json.loads(cached)}

    product = await get_product_from_db(product_id)
    await redis.set(cache_key, json.dumps(product), ex=300)

    return {"source": "database", "data": product}

@app.delete("/products/{product_id}/cache")
async def invalidate_cache(
    product_id: int,
    redis: aioredis.Redis = Depends(get_redis)
):
    deleted = await redis.delete(f"product:{product_id}")
    return {"invalidated": bool(deleted)}

@app.on_event("shutdown")
async def shutdown():
    await redis_pool.aclose()
```

## Rate limiting с атомарными счётчиками

Redis идеально подходит для реализации ограничения частоты запросов — атомарность операции `INCR` гарантирует корректность счётчика даже при параллельных обращениях:

```python
async def check_rate_limit(
    redis: aioredis.Redis,
    user_id: int,
    limit: int = 100,
    window: int = 60
) -> bool:
    key = f"rate_limit:{user_id}"

    async with redis.pipeline(transaction=True) as pipe:
        pipe.incr(key)
        pipe.expire(key, window)
        results = await pipe.execute()

    current_count = results[0]
    return current_count <= limit

async def api_handler(user_id: int, redis: aioredis.Redis):
    if not await check_rate_limit(redis, user_id):
        raise Exception("Превышен лимит запросов")
    # ... обработка запроса
```

Первый вызов `INCR` создаёт ключ со значением `1` и одновременно устанавливает TTL через `EXPIRE` — всё в рамках одного pipeline, без гонки состояний.

## Контекстный менеджер

Для скриптов и разовых задач удобно использовать клиент как асинхронный контекстный менеджер — соединение закроется автоматически:

```python
async def with_context_manager():
    async with aioredis.from_url("redis://localhost:6379", decode_responses=True) as client:
        await client.set("key", "value")
        value = await client.get("key")
        print(value)  # value
    # Соединение закрыто автоматически
```

## Итоги

Асинхронная работа с Redis через `redis.asyncio` — это стандартный подход для Python-приложений на asyncio. Ключевые практики:

- Используйте `ConnectionPool` в долгоживущих приложениях — это критично для производительности.
- Применяйте `pipeline` для пакетной отправки нескольких команд и снижения latency.
- Параметр `decode_responses=True` избавляет от ручного декодирования байтов.
- Для атомарных операций со счётчиками используйте `INCR`/`EXPIRE` в pipeline.
- Pub/Sub хорошо подходит для уведомлений в реальном времени, но для надёжных очередей лучше использовать Redis Streams.

Освоение асинхронной работы с Redis открывает возможность создавать высоконагруженные, масштабируемые приложения без потери производительности. Углубить знания по Python и асинхронному программированию можно на курсе PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=redis-asyncio-python