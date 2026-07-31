---
metaTitle: "asyncpg: асинхронный PostgreSQL в Python — полное руководство"
metaDescription: "Как работать с PostgreSQL асинхронно в Python через asyncpg: подключение, пул соединений, транзакции, prepared statements и обработка ошибок."
author: "Антон Ларичев"
title: "Асинхронная работа с PostgreSQL в Python через asyncpg"
preview: "Подробное руководство по asyncpg — быстрейшему асинхронному драйверу PostgreSQL для Python. Пул соединений, транзакции, prepared statements и практические примеры."
---

## Что такое asyncpg и зачем он нужен

asyncpg — это высокопроизводительный асинхронный драйвер для работы с PostgreSQL в Python, построенный поверх `asyncio`. В отличие от синхронных драйверов вроде `psycopg2`, asyncpg не блокирует поток выполнения во время ожидания ответа от базы данных, что критически важно для высоконагруженных веб-приложений и сервисов.

Ключевые преимущества asyncpg:

- Работает напрямую с бинарным протоколом PostgreSQL, минуя лишние слои абстракции
- Скорость выполнения запросов в 3–5 раз выше, чем у `psycopg2` в асинхронном режиме
- Нативная поддержка Python-типов: автоматическое преобразование UUID, JSON, массивов, перечислений
- Встроенный пул соединений без дополнительных зависимостей
- Полная поддержка prepared statements

asyncpg отлично подходит для работы с FastAPI, aiohttp и любым другим async-фреймворком.

## Установка

```bash
pip install asyncpg
```

Для разработки удобно использовать виртуальное окружение:

```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
pip install asyncpg
```

## Базовое подключение к базе данных

Самый простой способ подключиться — создать единственное соединение через `asyncpg.connect()`. Этот подход подходит для скриптов и утилит, но не для серверных приложений.

```python
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="secret",
        database="mydb",
    )

    try:
        version = await conn.fetchval("SELECT version()")
        print(f"PostgreSQL: {version}")
    finally:
        await conn.close()

asyncio.run(main())
```

Alternative DSN-формат:

```python
conn = await asyncpg.connect("postgresql://postgres:secret@localhost:5432/mydb")
```

## Пул соединений

Для production-приложений всегда используйте пул соединений. Создание нового TCP-соединения к PostgreSQL занимает десятки миллисекунд — пул позволяет переиспользовать уже установленные соединения.

```python
import asyncio
import asyncpg

async def main():
    pool = await asyncpg.create_pool(
        dsn="postgresql://postgres:secret@localhost:5432/mydb",
        min_size=5,   # минимальное число соединений в пуле
        max_size=20,  # максимальное число соединений
    )

    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id, name FROM users LIMIT 10")
        for row in rows:
            print(row["id"], row["name"])

    await pool.close()

asyncio.run(main())
```

`pool.acquire()` возвращает соединение из пула; по выходу из контекстного менеджера соединение автоматически возвращается обратно.

### Пул в FastAPI-приложении

Пул удобно хранить как атрибут приложения и инициализировать при старте:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
import asyncpg

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await asyncpg.create_pool(
        dsn="postgresql://postgres:secret@localhost:5432/mydb",
        min_size=5,
        max_size=20,
    )
    yield
    await app.state.pool.close()

app = FastAPI(lifespan=lifespan)

@app.get("/users")
async def get_users(request: Request):
    async with request.app.state.pool.acquire() as conn:
        rows = await conn.fetch("SELECT id, name, email FROM users")
        return [dict(row) for row in rows]
```

## Основные методы выполнения запросов

asyncpg предоставляет несколько методов в зависимости от того, что нужно вернуть.

### fetch — список строк

```python
rows = await conn.fetch(
    "SELECT id, name, email FROM users WHERE active = $1",
    True,
)
# rows — список объектов Record
for row in rows:
    print(row["id"], row["name"])
```

### fetchrow — одна строка

```python
user = await conn.fetchrow(
    "SELECT id, name, email FROM users WHERE id = $1",
    42,
)
if user:
    print(user["name"])  # доступ по имени колонки
    print(user[0])       # доступ по индексу
```

### fetchval — скалярное значение

```python
count = await conn.fetchval("SELECT COUNT(*) FROM users WHERE active = $1", True)
print(f"Активных пользователей: {count}")
```

### execute — INSERT, UPDATE, DELETE

```python
status = await conn.execute(
    "UPDATE users SET last_login = NOW() WHERE id = $1",
    42,
)
# status содержит строку вроде "UPDATE 1"
print(status)
```

### executemany — пакетная вставка

```python
users_data = [
    ("Alice", "alice@example.com"),
    ("Bob", "bob@example.com"),
    ("Charlie", "charlie@example.com"),
]

await conn.executemany(
    "INSERT INTO users (name, email) VALUES ($1, $2)",
    users_data,
)
```

Параметры всегда передаются позиционно через `$1`, `$2`, ... — это защищает от SQL-инъекций.

## Работа с транзакциями

### Базовая транзакция

```python
async with conn.transaction():
    await conn.execute(
        "INSERT INTO accounts (user_id, balance) VALUES ($1, $2)",
        1, 1000.0
    )
    await conn.execute(
        "INSERT INTO accounts (user_id, balance) VALUES ($1, $2)",
        2, 500.0
    )
# При выходе из блока без исключения — COMMIT
# При исключении — автоматический ROLLBACK
```

### Перевод средств между счетами

Практический пример с атомарной операцией:

```python
async def transfer_funds(
    conn: asyncpg.Connection,
    from_account: int,
    to_account: int,
    amount: float,
) -> None:
    async with conn.transaction():
        sender_balance = await conn.fetchval(
            "SELECT balance FROM accounts WHERE id = $1 FOR UPDATE",
            from_account,
        )

        if sender_balance is None:
            raise ValueError(f"Счёт {from_account} не найден")
        if sender_balance < amount:
            raise ValueError("Недостаточно средств")

        await conn.execute(
            "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
            amount, from_account,
        )
        await conn.execute(
            "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
            amount, to_account,
        )
```

### Точки сохранения (Savepoints)

```python
async with conn.transaction():
    await conn.execute("INSERT INTO logs (event) VALUES ($1)", "start")

    async with conn.transaction():  # создаёт savepoint
        try:
            await conn.execute(
                "INSERT INTO orders (user_id, total) VALUES ($1, $2)",
                user_id, total
            )
        except asyncpg.UniqueViolationError:
            pass  # откатывается только до savepoint, внешняя транзакция продолжается

    await conn.execute("INSERT INTO logs (event) VALUES ($1)", "end")
```

## Prepared Statements

Prepared statements позволяют PostgreSQL разобрать и спланировать запрос один раз, а затем выполнять его многократно без повторного парсинга. Это даёт прирост производительности при частых одинаковых запросах.

```python
async def batch_insert_users(conn: asyncpg.Connection, users: list[dict]) -> None:
    stmt = await conn.prepare(
        "INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW())"
    )

    for user in users:
        await stmt.execute(user["name"], user["email"])
```

Для массовых выборок:

```python
async def get_user_by_email(conn: asyncpg.Connection, email: str):
    stmt = await conn.prepare(
        "SELECT id, name, email, created_at FROM users WHERE email = $1"
    )
    return await stmt.fetchrow(email)
```

## Работа со специальными типами PostgreSQL

asyncpg автоматически конвертирует многие PostgreSQL-типы в Python-объекты.

### UUID

```python
import uuid

user_id = uuid.uuid4()
await conn.execute(
    "INSERT INTO users (id, name) VALUES ($1, $2)",
    user_id, "Alice"  # uuid.UUID передаётся напрямую
)

row = await conn.fetchrow("SELECT id FROM users WHERE name = $1", "Alice")
print(type(row["id"]))  # <class 'uuid.UUID'>
```

### JSONB

```python
import json

metadata = {"role": "admin", "permissions": ["read", "write"]}

await conn.execute(
    "INSERT INTO users (name, metadata) VALUES ($1, $2)",
    "Alice", json.dumps(metadata)  # передаём как строку для JSONB
)

row = await conn.fetchrow("SELECT metadata FROM users WHERE name = $1", "Alice")
data = json.loads(row["metadata"])
print(data["role"])  # admin
```

### Массивы

```python
tags = ["python", "asyncio", "postgresql"]
await conn.execute(
    "INSERT INTO articles (title, tags) VALUES ($1, $2)",
    "asyncpg guide", tags  # список Python — в массив PostgreSQL
)

row = await conn.fetchrow(
    "SELECT tags FROM articles WHERE title = $1",
    "asyncpg guide"
)
print(row["tags"])  # ['python', 'asyncio', 'postgresql']
```

## Обработка ошибок

asyncpg предоставляет иерархию исключений, соответствующую кодам ошибок PostgreSQL.

```python
import asyncpg

async def create_user(conn: asyncpg.Connection, name: str, email: str) -> int | None:
    try:
        user_id = await conn.fetchval(
            "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
            name, email,
        )
        return user_id
    except asyncpg.UniqueViolationError:
        # нарушение уникального ограничения (например, email уже существует)
        print(f"Пользователь с email {email} уже существует")
        return None
    except asyncpg.ForeignKeyViolationError as e:
        print(f"Нарушение внешнего ключа: {e}")
        return None
    except asyncpg.NotNullViolationError as e:
        print(f"Нарушение NOT NULL: {e}")
        return None
    except asyncpg.PostgresError as e:
        # базовый класс для всех PostgreSQL-ошибок
        print(f"Ошибка PostgreSQL [{e.sqlstate}]: {e}")
        return None
```

Наиболее часто используемые исключения:

| Исключение | Описание |
|---|---|
| `UniqueViolationError` | Нарушение уникального индекса |
| `ForeignKeyViolationError` | Нарушение внешнего ключа |
| `NotNullViolationError` | NULL в NOT NULL поле |
| `CheckViolationError` | Нарушение CHECK-ограничения |
| `UndefinedTableError` | Таблица не существует |
| `TooManyConnectionsError` | Превышен лимит соединений |
| `ConnectionDoesNotExistError` | Соединение разорвано |

## Полный практический пример

Реализуем простой репозиторий пользователей с полным набором CRUD-операций.

```python
import asyncio
import asyncpg
from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    id: int
    name: str
    email: str
    active: bool
    created_at: datetime


class UserRepository:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def create_table(self) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id        SERIAL PRIMARY KEY,
                    name      TEXT NOT NULL,
                    email     TEXT NOT NULL UNIQUE,
                    active    BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)

    async def create(self, name: str, email: str) -> User:
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO users (name, email)
                VALUES ($1, $2)
                RETURNING id, name, email, active, created_at
                """,
                name, email,
            )
        return User(**row)

    async def get_by_id(self, user_id: int) -> User | None:
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, name, email, active, created_at FROM users WHERE id = $1",
                user_id,
            )
        return User(**row) if row else None

    async def get_active_users(self, limit: int = 100) -> list[User]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, name, email, active, created_at
                FROM users
                WHERE active = TRUE
                ORDER BY created_at DESC
                LIMIT $1
                """,
                limit,
            )
        return [User(**row) for row in rows]

    async def deactivate(self, user_id: int) -> bool:
        async with self._pool.acquire() as conn:
            status = await conn.execute(
                "UPDATE users SET active = FALSE WHERE id = $1 AND active = TRUE",
                user_id,
            )
        return status == "UPDATE 1"

    async def delete(self, user_id: int) -> bool:
        async with self._pool.acquire() as conn:
            status = await conn.execute(
                "DELETE FROM users WHERE id = $1",
                user_id,
            )
        return status == "DELETE 1"


async def main():
    pool = await asyncpg.create_pool(
        dsn="postgresql://postgres:secret@localhost:5432/mydb",
        min_size=2,
        max_size=10,
    )

    repo = UserRepository(pool)
    await repo.create_table()

    # Создаём пользователей параллельно
    alice, bob = await asyncio.gather(
        repo.create("Alice", "alice@example.com"),
        repo.create("Bob", "bob@example.com"),
    )
    print(f"Созданы: {alice.name} (id={alice.id}), {bob.name} (id={bob.id})")

    # Получаем список активных
    users = await repo.get_active_users()
    print(f"Активных пользователей: {len(users)}")

    # Деактивируем Bob
    deactivated = await repo.deactivate(bob.id)
    print(f"Bob деактивирован: {deactivated}")

    await pool.close()


asyncio.run(main())
```

## Настройка соединения и таймауты

Для production-окружения важно настроить таймауты и параметры соединения:

```python
pool = await asyncpg.create_pool(
    dsn="postgresql://postgres:secret@localhost:5432/mydb",
    min_size=5,
    max_size=20,
    max_inactive_connection_lifetime=300.0,  # закрывать idle-соединения через 5 минут
    command_timeout=30.0,  # таймаут на выполнение запроса — 30 секунд
    server_settings={
        "application_name": "myapp",
        "statement_timeout": "30000",  # ms, через SET
    },
)
```

Таймаут на уровне отдельного запроса:

```python
try:
    row = await conn.fetchrow(
        "SELECT * FROM heavy_query()",
        timeout=5.0,  # максимум 5 секунд на этот запрос
    )
except asyncio.TimeoutError:
    print("Запрос выполнялся слишком долго")
```

## Итоги

asyncpg — зрелый и производительный инструмент для работы с PostgreSQL в async Python-приложениях. Ключевые принципы при работе с ним:

- Используйте пул соединений (`create_pool`) в серверных приложениях — не создавайте отдельное соединение на каждый запрос
- Всегда передавайте параметры запроса через `$1`, `$2` — никогда не форматируйте SQL вручную
- Оборачивайте связанные изменения в `conn.transaction()` для атомарности
- Обрабатывайте специфические исключения asyncpg, а не общий `Exception`
- Используйте `asyncio.gather()` для параллельного выполнения независимых запросов

Для работы с более высокоуровневым ORM поверх asyncpg рассмотрите SQLAlchemy async (использует asyncpg как backend) или SQLModel.

---

Хотите освоить Python для backend-разработки с нуля до профессионального уровня? Изучите полный курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=asyncpg-postgresql
