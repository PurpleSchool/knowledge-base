---
metaTitle: "SQLAlchemy 2.0 async: асинхронные запросы к БД на Python"
metaDescription: "Как использовать SQLAlchemy 2.0 в async-режиме: async engine, AsyncSession, CRUD-операции, транзакции и связи между таблицами."
author: "Антон Ларичев"
title: "Асинхронная работа с базой данных через SQLAlchemy 2.0"
preview: "Полное руководство по асинхронной работе с SQLAlchemy 2.0 — от создания движка до сложных запросов с JOIN."
---

## Что такое асинхронный SQLAlchemy

SQLAlchemy 2.0 принесла полноценную поддержку асинхронного программирования через модуль `asyncio`. Теперь операции с базой данных не блокируют event loop, что критически важно в высоконагруженных приложениях на FastAPI, aiohttp и других async-фреймворках.

До версии 2.0 асинхронный режим существовал как экспериментальный. В 2.0 он стал стабильным и рекомендованным подходом для production-приложений. Ключевое отличие от синхронного подхода — все операции с БД выполняются через `await`, а engine и сессия создаются через специальные async-обёртки.

## Установка зависимостей

Для работы с PostgreSQL через асинхронный драйвер:

```bash
pip install sqlalchemy[asyncio] asyncpg
```

Для SQLite (удобно при разработке и тестировании):

```bash
pip install sqlalchemy[asyncio] aiosqlite
```

Для MySQL:

```bash
pip install sqlalchemy[asyncio] aiomysql
```

## Создание асинхронного движка

Асинхронный движок создаётся через `create_async_engine`. Строка подключения отличается от синхронной — используется префикс с `+asyncpg` или `+aiosqlite`:

```python
from sqlalchemy.ext.asyncio import create_async_engine

# PostgreSQL
engine = create_async_engine(
    "postgresql+asyncpg://user:password@localhost/mydb",
    echo=True,
    pool_size=10,
    max_overflow=20,
)

# SQLite для тестов
engine = create_async_engine(
    "sqlite+aiosqlite:///./test.db",
    echo=True,
)
```

Параметр `echo=True` выводит все SQL-запросы в консоль — полезно при отладке, но отключайте в production.

`pool_size` и `max_overflow` управляют пулом соединений. Для SQLite эти параметры не применяются, так как SQLite не поддерживает параллельные соединения.

## Определение моделей

Модели в SQLAlchemy 2.0 определяются через декларативный стиль с аннотациями типов. Это значительно чище, чем в версии 1.x:

```python
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    posts: Mapped[list["Post"]] = relationship(back_populates="author")


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    author: Mapped["User"] = relationship(back_populates="posts")
```

`Mapped[T]` — это аннотация типа, которая заменяет старый `Column()`. SQLAlchemy автоматически определяет `nullable` из типа: `Mapped[str]` — не nullable, `Mapped[Optional[str]]` — nullable.

## Создание таблиц

Миграции в production рекомендуется делать через Alembic, но для разработки можно создать таблицы напрямую:

```python
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine("sqlite+aiosqlite:///./dev.db", echo=True)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


asyncio.run(create_tables())
```

`run_sync` оборачивает синхронные вызовы метаданных в async-контекст. Это единственный способ работать с синхронными методами внутри async engine.

## Создание async-сессии

Сессия — основной объект для работы с данными. В async-режиме используется `AsyncSession` и фабрика `async_sessionmaker`:

```python
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
```

`expire_on_commit=False` — важная настройка. Без неё атрибуты объектов становятся недоступны после `commit()`, что в async-контексте вызывает ошибки при попытке обратиться к ним вне сессии.

Типичный паттерн использования сессии через контекстный менеджер:

```python
async def get_session():
    async with AsyncSessionLocal() as session:
        yield session
```

В FastAPI это оформляется как зависимость:

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


@app.get("/users/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    return user
```

## CRUD-операции

### Создание записи

```python
async def create_user(name: str, email: str) -> User:
    async with AsyncSessionLocal() as session:
        user = User(name=name, email=email)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user
```

`session.refresh(user)` обновляет объект из БД после commit — это нужно для получения автоматически сгенерированных значений (id, created_at).

### Чтение записи по ID

```python
async def get_user_by_id(user_id: int) -> User | None:
    async with AsyncSessionLocal() as session:
        return await session.get(User, user_id)
```

`session.get()` — самый эффективный способ получить запись по первичному ключу. Если запись не найдена, возвращает `None`.

### Запросы через select

Для сложных запросов используется `select()` из `sqlalchemy`:

```python
from sqlalchemy import select


async def get_users(skip: int = 0, limit: int = 100) -> list[User]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).offset(skip).limit(limit)
        )
        return list(result.scalars().all())


async def get_user_by_email(email: str) -> User | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
```

`scalars()` извлекает первую колонку результата. `scalar_one_or_none()` возвращает один объект или `None`, но выбрасывает исключение при нескольких результатах — используйте его когда уверены в уникальности.

### Обновление записи

```python
from sqlalchemy import update


async def update_user_name(user_id: int, new_name: str) -> User | None:
    async with AsyncSessionLocal() as session:
        user = await session.get(User, user_id)
        if user is None:
            return None
        user.name = new_name
        await session.commit()
        await session.refresh(user)
        return user
```

Можно также использовать bulk-update через ORM:

```python
async def deactivate_users(user_ids: list[int]) -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(
            update(User)
            .where(User.id.in_(user_ids))
            .values(is_active=False)
        )
        await session.commit()
```

### Удаление записи

```python
from sqlalchemy import delete


async def delete_user(user_id: int) -> bool:
    async with AsyncSessionLocal() as session:
        user = await session.get(User, user_id)
        if user is None:
            return False
        await session.delete(user)
        await session.commit()
        return True
```

## Работа со связями и загрузка данных

Асинхронный режим не поддерживает lazy loading — это ключевое ограничение. Попытка обратиться к relationship без предварительной загрузки вызовет `MissingGreenlet` или `DetachedInstanceError`.

Используйте `selectinload` или `joinedload` для явной загрузки связей:

```python
from sqlalchemy.orm import selectinload, joinedload


async def get_user_with_posts(user_id: int) -> User | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User)
            .options(selectinload(User.posts))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()


async def get_posts_with_authors() -> list[Post]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Post).options(joinedload(Post.author))
        )
        return list(result.unique().scalars().all())
```

`selectinload` выполняет отдельный SELECT для связанных данных — хорошо работает для one-to-many. `joinedload` выполняет JOIN в одном запросе — эффективнее для many-to-one.

При использовании `joinedload` с коллекциями вызывайте `.unique()` перед `scalars()` — JOIN дублирует строки при нескольких связанных записях.

## Транзакции

SQLAlchemy автоматически управляет транзакциями в рамках сессии, но иногда нужен явный контроль:

```python
async def transfer_data(source_id: int, target_id: int, amount: int) -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            source = await session.get(User, source_id)
            target = await session.get(User, target_id)

            if source is None or target is None:
                raise ValueError("User not found")

            # Логика переноса данных
            source.balance -= amount
            target.balance += amount
        # commit вызывается автоматически при выходе из session.begin()
```

Если внутри блока `session.begin()` возникает исключение, транзакция автоматически откатывается через `rollback()`.

## Работа с несколькими запросами параллельно

AsyncIO позволяет выполнять независимые запросы параллельно через `asyncio.gather`:

```python
import asyncio


async def get_dashboard_data(user_id: int) -> dict:
    async with AsyncSessionLocal() as session:
        user_query = session.execute(
            select(User).where(User.id == user_id)
        )
        posts_query = session.execute(
            select(Post)
            .where(Post.author_id == user_id)
            .limit(10)
        )

        user_result, posts_result = await asyncio.gather(
            user_query, posts_query
        )

        user = user_result.scalar_one_or_none()
        posts = list(posts_result.scalars().all())

        return {"user": user, "posts": posts}
```

Оба запроса отправляются одновременно и ждут результата параллельно — это сокращает общее время ожидания.

## Правильное закрытие движка

При завершении работы приложения движок нужно явно закрыть:

```python
async def shutdown():
    await engine.dispose()
```

В FastAPI это делается через lifespan-контекст:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
```

## Типичные ошибки и как их избежать

**MissingGreenlet** — возникает при попытке выполнить I/O операцию вне async-контекста. Убедитесь, что все обращения к БД внутри `async with` сессии.

**DetachedInstanceError** — объект используется после закрытия сессии. Решение: `expire_on_commit=False` или загрузите все нужные данные внутри сессии.

**SAWarning: SELECT statement has a cartesian product** — при `joinedload` с несколькими коллекциями. Используйте `selectinload` для множественных связей.

**Deadlock при параллельных транзакциях** — при параллельном обновлении одних и тех же записей. Используйте `SELECT FOR UPDATE` или пересмотрите логику:

```python
from sqlalchemy import select

result = await session.execute(
    select(User).where(User.id == user_id).with_for_update()
)
user = result.scalar_one()
```

## Полный пример: репозиторий пользователей

Практический паттерн — вынести всю логику работы с БД в отдельный класс-репозиторий:

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, name: str, email: str) -> User:
        user = User(name=name, email=email)
        self.session.add(user)
        await self.session.flush()  # получаем id без commit
        await self.session.refresh(user)
        return user

    async def get_by_id(self, user_id: int) -> User | None:
        return await self.session.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def list_with_posts(self, limit: int = 20) -> list[User]:
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.posts))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_name(self, user_id: int, new_name: str) -> User | None:
        user = await self.get_by_id(user_id)
        if user is None:
            return None
        user.name = new_name
        return user

    async def delete(self, user_id: int) -> bool:
        user = await self.get_by_id(user_id)
        if user is None:
            return False
        await self.session.delete(user)
        return True


# Использование
async def example():
    async with AsyncSessionLocal() as session:
        async with session.begin():
            repo = UserRepository(session)
            user = await repo.create("Иван", "ivan@example.com")
            print(f"Создан пользователь: {user.id}")
```

`flush()` отправляет SQL в БД в рамках текущей транзакции без фиксации — это позволяет получить сгенерированный id и использовать его в других операциях до commit.

## Итог

SQLAlchemy 2.0 async предоставляет мощный инструментарий для неблокирующей работы с базами данных. Ключевые моменты:

- Используйте `create_async_engine` с async-драйвером (`asyncpg`, `aiosqlite`)
- Всегда явно загружайте связи через `selectinload` или `joinedload` — lazy loading не работает в async
- Устанавливайте `expire_on_commit=False` для `AsyncSession`
- Паттерн репозитория помогает организовать код и упрощает тестирование
- Закрывайте движок через `engine.dispose()` при остановке приложения

Полноценно освоить асинхронный Python и работу с базами данных в реальных проектах можно на курсе PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=sqlalchemy-async