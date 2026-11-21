---
metaTitle: "FastAPI + PostgreSQL + SQLAlchemy: полная интеграция"
metaDescription: "Полное руководство по интеграции FastAPI с PostgreSQL через SQLAlchemy: async-сессии, модели, CRUD, миграции Alembic и структура проекта."
author: "Антон Ларичев"
title: "Python FastAPI и PostgreSQL: полная интеграция с SQLAlchemy"
preview: "Пошаговое построение FastAPI-приложения с PostgreSQL: асинхронный SQLAlchemy, Alembic-миграции, Pydantic-схемы и готовые CRUD-маршруты."
---

## Введение

FastAPI стал одним из самых популярных фреймворков Python для создания REST API благодаря встроенной поддержке асинхронности, автоматической генерации документации и строгой типизации. В паре с PostgreSQL и SQLAlchemy он образует стек, который покрывает большинство production-задач.

В этой статье мы построим полноценное приложение с нуля: настроим асинхронное подключение к PostgreSQL через SQLAlchemy 2.x, опишем модели, реализуем CRUD-операции и подключим миграции через Alembic.

## Установка зависимостей

Создайте виртуальное окружение и установите нужные пакеты:

```bash
python -m venv venv
source venv/bin/activate

pip install fastapi uvicorn sqlalchemy asyncpg alembic pydantic-settings python-dotenv
```

- `asyncpg` — асинхронный драйвер PostgreSQL
- `sqlalchemy` — ORM версии 2.x с поддержкой async
- `alembic` — инструмент миграций
- `pydantic-settings` — управление конфигурацией через переменные окружения

## Структура проекта

```
app/
├── __init__.py
├── main.py
├── database.py
├── models.py
├── schemas.py
├── crud.py
└── routers/
    └── users.py
alembic/
    └── env.py
.env
alembic.ini
```

## Конфигурация через переменные окружения

Создайте файл `.env`:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/mydb
```

Файл `app/config.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str

    class Config:
        env_file = ".env"

settings = Settings()
```

## Настройка SQLAlchemy с асинхронным движком

Файл `app/database.py`:

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

Ключевые моменты:
- `create_async_engine` принимает URL с префиксом `postgresql+asyncpg`
- `async_sessionmaker` создаёт фабрику сессий, совместимую с `async with`
- `expire_on_commit=False` предотвращает обращение к БД после закрытия сессии
- `get_db` — dependency-функция для FastAPI Depends

## Описание моделей

Файл `app/models.py`:

```python
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    posts: Mapped[list["Post"]] = relationship(back_populates="author", lazy="selectin")

class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(nullable=False)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    author: Mapped[User] = relationship(back_populates="posts")
```

SQLAlchemy 2.x использует синтаксис `Mapped[тип]` с `mapped_column` — он строго типизирован и позволяет mypy проверять корректность запросов. `lazy="selectin"` для relationship обеспечивает автоматическую подгрузку связей одним дополнительным SELECT вместо N+1 запросов.

## Pydantic-схемы

Файл `app/schemas.py`:

```python
from datetime import datetime
from pydantic import BaseModel, EmailStr

class PostBase(BaseModel):
    title: str
    content: str
    published: bool = False

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: int
    author_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    posts: list[PostResponse] = []

    model_config = {"from_attributes": True}
```

Разделение на `Base`, `Create` и `Response` — стандартный паттерн FastAPI. `model_config = {"from_attributes": True}` заменяет устаревший `orm_mode = True` из Pydantic v1 и позволяет сериализовать SQLAlchemy-объекты напрямую.

## CRUD-операции

Файл `app/crud.py`:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Post
from app.schemas import UserCreate, PostCreate

async def get_user(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[User]:
    result = await db.execute(select(User).offset(skip).limit(limit))
    return list(result.scalars().all())

async def create_user(db: AsyncSession, user: UserCreate) -> User:
    db_user = User(email=user.email, username=user.username)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def create_user_post(db: AsyncSession, post: PostCreate, user_id: int) -> Post:
    db_post = Post(**post.model_dump(), author_id=user_id)
    db.add(db_post)
    await db.commit()
    await db.refresh(db_post)
    return db_post

async def delete_user(db: AsyncSession, user_id: int) -> bool:
    user = await get_user(db, user_id)
    if not user:
        return False
    await db.delete(user)
    await db.commit()
    return True
```

Важный нюанс: `db.execute()` в асинхронном SQLAlchemy всегда возвращает `CursorResult`. Для получения одного объекта используйте `.scalar_one_or_none()`, для списка — `.scalars().all()`.

## Маршруты FastAPI

Файл `app/routers/users.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.database import get_db
from app.schemas import UserCreate, UserResponse, PostCreate, PostResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    return await crud.get_users(db, skip=skip, limit=limit)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await crud.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return await crud.create_user(db, user)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    user = await crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/{user_id}/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post_for_user(
    user_id: int,
    post: PostCreate,
    db: AsyncSession = Depends(get_db),
):
    user = await crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return await crud.create_user_post(db, post, user_id)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await crud.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
```

## Точка входа приложения

Файл `app/main.py`:

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import users

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(title="MyApp", lifespan=lifespan)

app.include_router(users.router)
```

`lifespan` — современная замена `on_event("startup")`, которая создаёт таблицы при старте и корректно закрывает пул соединений при остановке.

## Миграции с Alembic

Инициализация:

```bash
alembic init alembic
```

Отредактируйте `alembic/env.py`:

```python
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from app.database import Base
from app.models import User, Post  # импорт необходим для автообнаружения
from app.config import settings

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    import asyncio
    asyncio.run(run_migrations_online())
```

Создание и применение миграции:

```bash
alembic revision --autogenerate -m "create users and posts tables"
alembic upgrade head
```

## Запуск и проверка

```bash
uvicorn app.main:app --reload
```

Откройте `http://localhost:8000/docs` — Swagger UI сгенерирован автоматически на основе схем Pydantic.

Проверка через curl:

```bash
# Создать пользователя
curl -X POST http://localhost:8000/users/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "username": "johndoe"}'

# Получить список пользователей
curl http://localhost:8000/users/

# Создать пост
curl -X POST http://localhost:8000/users/1/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Первый пост", "content": "Контент поста", "published": true}'
```

## Частые ошибки и как их избежать

### Ленивая загрузка в асинхронном режиме

По умолчанию SQLAlchemy использует `lazy="select"` для relationship, что вызывает `MissingGreenlet` в async-контексте. Используйте `lazy="selectin"` или явный `selectinload` в запросе:

```python
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(User).options(selectinload(User.posts)).where(User.id == user_id)
)
```

### Забытый await при flush/commit

```python
# Неверно — не вызовет ошибку, но ничего не сохранит
db.commit()

# Верно
await db.commit()
```

### Использование объектов после закрытия сессии

`expire_on_commit=False` в `async_sessionmaker` решает эту проблему: атрибуты объекта остаются доступны после коммита без повторного обращения к БД.

## Итог

Мы построили полноценный стек FastAPI + PostgreSQL + SQLAlchemy с асинхронными сессиями, Pydantic-схемами, раздельными слоями CRUD и маршрутов, а также настроили Alembic для управления схемой базы данных. Такая архитектура хорошо масштабируется: каждый слой можно тестировать и развивать независимо.

Чтобы углубиться в Python и научиться строить production-ready приложения, изучите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=fastapi-postgresql-sqlalchemy