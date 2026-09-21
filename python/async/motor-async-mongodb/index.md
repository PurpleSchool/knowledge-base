---
metaTitle: "Motor: асинхронная работа с MongoDB в Python"
metaDescription: "Как использовать Motor — асинхронный драйвер MongoDB для Python. CRUD-операции, фильтрация, индексы, агрегация с asyncio и примерами кода."
author: "Антон Ларичев"
title: "Motor: асинхронная работа с MongoDB в Python"
preview: "Подробный разбор Motor — асинхронного MongoDB-драйвера для Python. CRUD, фильтры, индексы, агрегация и лучшие практики."
---

## Что такое Motor и зачем он нужен

Motor — официальный асинхронный драйвер MongoDB для Python, построенный поверх синхронного драйвера PyMongo. Он полностью совместим с `asyncio` и позволяет выполнять запросы к базе данных без блокировки цикла событий.

Если вы пишете асинхронные приложения на FastAPI, aiohttp или используете `asyncio` напрямую, синхронный PyMongo заблокирует весь event loop на время каждого запроса к базе. Motor решает эту проблему: все операции с базой выполняются через неблокирующие корутины.

```bash
# PyMongo блокирует event loop
result = collection.find_one({"name": "Alice"})  # блокировка

# Motor — не блокирует
result = await collection.find_one({"name": "Alice"})  # корутина
```

## Установка

Установите Motor через pip:

```bash
pip install motor
```

Motor автоматически подтянет PyMongo как зависимость. Для работы также потребуется запущенный экземпляр MongoDB — локально или в облаке (например, MongoDB Atlas).

Проверьте версию после установки:

```bash
python -c "import motor; print(motor.version)"
```

## Подключение к MongoDB

Для создания соединения используется класс `AsyncIOMotorClient`. Соединение создаётся один раз при старте приложения и переиспользуется для всех запросов.

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    # Подключение к локальному MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")

    # Получаем базу данных
    db = client["myapp"]

    # Получаем коллекцию
    collection = db["users"]

    # Проверяем соединение
    await client.admin.command("ping")
    print("Подключение успешно")

    client.close()

asyncio.run(main())
```

### Подключение к MongoDB Atlas

```python
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = "mongodb+srv://user:password@cluster.mongodb.net/myapp?retryWrites=true&w=majority"

client = AsyncIOMotorClient(MONGODB_URI)
db = client["myapp"]
```

### Настройка пула соединений

Motor управляет пулом соединений автоматически. Основные параметры:

```python
client = AsyncIOMotorClient(
    "mongodb://localhost:27017",
    maxPoolSize=10,      # максимум соединений в пуле
    minPoolSize=1,       # минимум соединений
    serverSelectionTimeoutMS=5000,  # таймаут выбора сервера
)
```

## Вставка документов

### Вставка одного документа

```python
async def insert_one_example(collection):
    user = {
        "name": "Alice",
        "email": "alice@example.com",
        "age": 30,
        "active": True,
    }

    result = await collection.insert_one(user)
    print(f"Вставлен документ с id: {result.inserted_id}")
    return result.inserted_id
```

После вставки MongoDB добавляет в документ поле `_id` типа `ObjectId`. Значение доступно через `result.inserted_id`.

### Вставка нескольких документов

```python
async def insert_many_example(collection):
    users = [
        {"name": "Bob", "email": "bob@example.com", "age": 25},
        {"name": "Carol", "email": "carol@example.com", "age": 28},
        {"name": "Dave", "email": "dave@example.com", "age": 35},
    ]

    result = await collection.insert_many(users)
    print(f"Вставлено {len(result.inserted_ids)} документов")
    print(f"ID: {result.inserted_ids}")
```

## Чтение документов

### Поиск одного документа

`find_one` возвращает первый документ, соответствующий фильтру, или `None` если ничего не найдено.

```python
async def find_one_example(collection):
    # Поиск по полю
    user = await collection.find_one({"email": "alice@example.com"})

    if user:
        print(f"Найден: {user['name']}, id: {user['_id']}")
    else:
        print("Пользователь не найден")
```

### Поиск нескольких документов

`find` возвращает объект курсора. Для получения всех результатов используйте `to_list` или асинхронный цикл.

```python
async def find_many_example(collection):
    # Получить все документы сразу
    users = await collection.find({"active": True}).to_list(length=100)

    for user in users:
        print(user["name"])

async def find_with_async_for(collection):
    # Потоковая обработка через async for
    cursor = collection.find({"age": {"$gte": 25}})

    async for user in cursor:
        print(f"{user['name']}: {user['age']}")
```

`to_list(length=None)` вернёт все документы без ограничения. Для больших коллекций лучше использовать `async for` — это экономит память, так как документы не загружаются все сразу.

### Проекция: выбор полей

Второй аргумент `find` управляет тем, какие поля возвращать:

```python
async def projection_example(collection):
    # Возвращаем только name и email, исключаем _id
    cursor = collection.find(
        {"active": True},
        {"name": 1, "email": 1, "_id": 0}
    )

    async for user in cursor:
        print(user)  # {"name": "Alice", "email": "alice@example.com"}
```

### Сортировка, пропуск и лимит

```python
from pymongo import ASCENDING, DESCENDING

async def pagination_example(collection, page: int = 1, page_size: int = 10):
    skip = (page - 1) * page_size

    users = await (
        collection.find({})
        .sort("age", ASCENDING)
        .skip(skip)
        .limit(page_size)
        .to_list(length=page_size)
    )

    return users
```

### Подсчёт документов

```python
async def count_example(collection):
    # Общее количество
    total = await collection.count_documents({})

    # С фильтром
    active_count = await collection.count_documents({"active": True})

    print(f"Всего: {total}, активных: {active_count}")
```

## Операторы фильтрации

MongoDB поддерживает богатый набор операторов сравнения и логики:

```python
async def filter_examples(collection):
    # Сравнение
    await collection.find({"age": {"$gt": 25}}).to_list(None)   # >25
    await collection.find({"age": {"$gte": 25}}).to_list(None)  # >=25
    await collection.find({"age": {"$lt": 30}}).to_list(None)   # <30
    await collection.find({"age": {"$ne": 25}}).to_list(None)   # !=25

    # Вхождение в список
    await collection.find({"name": {"$in": ["Alice", "Bob"]}}).to_list(None)

    # Логические операторы
    await collection.find({
        "$and": [
            {"age": {"$gte": 25}},
            {"active": True}
        ]
    }).to_list(None)

    # Существование поля
    await collection.find({"phone": {"$exists": True}}).to_list(None)

    # Регулярное выражение
    import re
    await collection.find({"email": {"$regex": re.compile(r"@example\.com$")}}).to_list(None)
```

## Обновление документов

### Обновление одного документа

```python
async def update_one_example(collection):
    # $set — обновить или добавить поля
    result = await collection.update_one(
        {"email": "alice@example.com"},
        {"$set": {"age": 31, "updated": True}}
    )

    print(f"Найдено: {result.matched_count}, изменено: {result.modified_count}")

async def increment_example(collection):
    # $inc — увеличить числовое значение
    await collection.update_one(
        {"name": "Alice"},
        {"$inc": {"login_count": 1}}
    )

async def upsert_example(collection):
    # upsert=True — создать документ если не найден
    result = await collection.update_one(
        {"email": "new@example.com"},
        {"$set": {"name": "New User", "active": True}},
        upsert=True
    )

    if result.upserted_id:
        print(f"Создан новый документ: {result.upserted_id}")
    else:
        print("Обновлён существующий документ")
```

### Обновление нескольких документов

```python
async def update_many_example(collection):
    result = await collection.update_many(
        {"active": False},
        {"$set": {"archived": True}}
    )

    print(f"Обновлено {result.modified_count} документов")
```

### Атомарный поиск и обновление

`find_one_and_update` возвращает документ — либо до, либо после обновления:

```python
from pymongo import ReturnDocument

async def find_and_update_example(collection):
    # Вернуть документ ПОСЛЕ обновления
    updated_user = await collection.find_one_and_update(
        {"email": "alice@example.com"},
        {"$inc": {"login_count": 1}},
        return_document=ReturnDocument.AFTER
    )

    return updated_user
```

## Удаление документов

```python
async def delete_examples(collection):
    # Удалить один документ
    result = await collection.delete_one({"email": "bob@example.com"})
    print(f"Удалено: {result.deleted_count}")

    # Удалить несколько
    result = await collection.delete_many({"active": False})
    print(f"Удалено неактивных: {result.deleted_count}")
```

## Индексы

Индексы критически важны для производительности. Без индексов MongoDB сканирует всю коллекцию при каждом запросе.

```python
from pymongo import ASCENDING, DESCENDING, TEXT

async def create_indexes(collection):
    # Простой индекс
    await collection.create_index("email")

    # Уникальный индекс
    await collection.create_index("email", unique=True)

    # Составной индекс
    await collection.create_index([
        ("last_name", ASCENDING),
        ("first_name", ASCENDING)
    ])

    # Текстовый индекс для полнотекстового поиска
    await collection.create_index([("name", TEXT), ("bio", TEXT)])

    # TTL-индекс: автоудаление документов через заданное время
    await collection.create_index(
        "created_at",
        expireAfterSeconds=3600  # документ живёт 1 час
    )

async def list_indexes(collection):
    async for index in collection.list_indexes():
        print(index)
```

## Агрегационный конвейер

Агрегация позволяет выполнять сложные аналитические запросы прямо на стороне MongoDB:

```python
async def aggregation_example(collection):
    pipeline = [
        # Фильтрация
        {"$match": {"active": True}},

        # Группировка с вычислением
        {"$group": {
            "_id": "$city",
            "count": {"$sum": 1},
            "avg_age": {"$avg": "$age"},
            "names": {"$push": "$name"}
        }},

        # Сортировка результатов
        {"$sort": {"count": -1}},

        # Ограничение
        {"$limit": 5},

        # Переименование полей
        {"$project": {
            "city": "$_id",
            "count": 1,
            "avg_age": {"$round": ["$avg_age", 1]},
            "_id": 0
        }}
    ]

    result = await collection.aggregate(pipeline).to_list(length=None)
    return result
```

### Lookup: объединение коллекций

```python
async def lookup_example(orders_collection):
    pipeline = [
        {"$match": {"status": "completed"}},
        {
            "$lookup": {
                "from": "users",           # коллекция для join
                "localField": "user_id",   # поле в orders
                "foreignField": "_id",     # поле в users
                "as": "user_info"          # имя результирующего массива
            }
        },
        {"$unwind": "$user_info"},          # развернуть массив в объект
        {"$project": {
            "order_id": 1,
            "amount": 1,
            "user_name": "$user_info.name"
        }}
    ]

    return await orders_collection.aggregate(pipeline).to_list(None)
```

## Транзакции

MongoDB поддерживает многодокументные транзакции начиная с версии 4.0 (только для replica set или sharded cluster):

```python
async def transfer_funds(client, from_id, to_id, amount):
    db = client["bank"]
    accounts = db["accounts"]

    async with await client.start_session() as session:
        async with session.start_transaction():
            # Снять с одного счёта
            result = await accounts.update_one(
                {"_id": from_id, "balance": {"$gte": amount}},
                {"$inc": {"balance": -amount}},
                session=session
            )

            if result.modified_count == 0:
                # Недостаточно средств — транзакция откатится автоматически
                raise ValueError("Недостаточно средств")

            # Добавить на другой счёт
            await accounts.update_one(
                {"_id": to_id},
                {"$inc": {"balance": amount}},
                session=session
            )
            # Транзакция зафиксируется при выходе из контекстного менеджера
```

## Интеграция с FastAPI

Motor отлично сочетается с FastAPI. Рекомендуемый подход — создавать клиент при старте приложения и закрывать при остановке:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from bson import ObjectId

class UserCreate(BaseModel):
    name: str
    email: str
    age: int

class Database:
    client: AsyncIOMotorClient = None
    collection = None

db = Database()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Старт
    db.client = AsyncIOMotorClient("mongodb://localhost:27017")
    db.collection = db.client["myapp"]["users"]
    yield
    # Остановка
    db.client.close()

app = FastAPI(lifespan=lifespan)

@app.post("/users")
async def create_user(user: UserCreate):
    doc = user.model_dump()
    result = await db.collection.insert_one(doc)
    return {"id": str(result.inserted_id)}

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Не найден")
    user["_id"] = str(user["_id"])  # ObjectId не сериализуется в JSON напрямую
    return user
```

## Работа с ObjectId

Идентификаторы MongoDB имеют тип `ObjectId` из пакета `bson`. При передаче через API их нужно преобразовывать:

```python
from bson import ObjectId
from bson.errors import InvalidId

async def get_by_id(collection, id_str: str):
    try:
        object_id = ObjectId(id_str)
    except InvalidId:
        raise ValueError(f"Некорректный id: {id_str}")

    return await collection.find_one({"_id": object_id})

def serialize_doc(doc: dict) -> dict:
    """Конвертирует ObjectId в строку для JSON-ответа."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc
```

## Параллельные запросы с asyncio.gather

Одно из главных преимуществ асинхронного подхода — возможность выполнять несколько запросов параллельно:

```python
import asyncio

async def get_dashboard_data(db):
    # Все три запроса выполняются параллельно
    users_count, orders_count, revenue = await asyncio.gather(
        db["users"].count_documents({"active": True}),
        db["orders"].count_documents({"status": "completed"}),
        db["orders"].aggregate([
            {"$match": {"status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
    )

    return {
        "active_users": users_count,
        "completed_orders": orders_count,
        "total_revenue": revenue[0]["total"] if revenue else 0
    }
```

Вместо последовательного выполнения трёх запросов общее время ожидания сократится до времени самого медленного из них.

## Обработка ошибок

```python
from pymongo.errors import (
    ConnectionFailure,
    DuplicateKeyError,
    OperationFailure,
)

async def safe_insert(collection, document):
    try:
        result = await collection.insert_one(document)
        return result.inserted_id
    except DuplicateKeyError as e:
        print(f"Дублирующий ключ: {e.details}")
        raise
    except ConnectionFailure:
        print("Потеряно соединение с MongoDB")
        raise
    except OperationFailure as e:
        print(f"Ошибка операции: {e.code} — {e.details}")
        raise
```

## Итог

Motor предоставляет полноценный асинхронный API для работы с MongoDB, не жертвуя ни одной возможностью синхронного PyMongo. Ключевые моменты:

- Создавайте `AsyncIOMotorClient` один раз при старте приложения
- Используйте `async for` вместо `to_list` при обработке больших выборок
- Применяйте `asyncio.gather` для параллельного выполнения независимых запросов
- Создавайте индексы заранее — они критичны для производительности
- При работе с JSON-API конвертируйте `ObjectId` в строку

Для углублённого изучения Python, асинхронного программирования и работы с базами данных — [курс по Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-motor-async-mongodb).