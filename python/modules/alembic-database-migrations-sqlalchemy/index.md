---
metaTitle: "Alembic и SQLAlchemy: миграции базы данных в Python"
metaDescription: "Как использовать Alembic для управления миграциями базы данных с SQLAlchemy в Python. Установка, настройка, создание и применение миграций."
author: "Антон Ларичев"
title: "Alembic для миграций базы данных с SQLAlchemy"
preview: "Разбираем Alembic — инструмент для версионирования и миграций схемы базы данных совместно с SQLAlchemy."
---

## Что такое Alembic и зачем он нужен

При разработке реальных приложений схема базы данных постоянно меняется: добавляются новые таблицы, столбцы, индексы, меняются типы данных. Управлять этими изменениями вручную через SQL-скрипты неудобно и опасно — легко ошибиться, потерять историю изменений или рассинхронизировать окружения разработки и продакшена.

Alembic решает эту проблему: это инструмент миграций для SQLAlchemy, разработанный тем же автором (Michael Bayer). Он позволяет:

- описывать изменения схемы как последовательность версионированных миграций
- применять и откатывать миграции одной командой
- автоматически генерировать миграции на основе изменений в моделях SQLAlchemy
- отслеживать текущее состояние схемы в любом окружении

## Установка и первоначальная настройка

Установите Alembic вместе с SQLAlchemy и драйвером базы данных:

```bash
pip install alembic sqlalchemy psycopg2-binary
```

Для SQLite драйвер не нужен — он встроен в Python. Для MySQL используйте `pymysql` или `mysqlclient`.

Инициализируйте Alembic в корне вашего проекта:

```bash
alembic init alembic
```

Эта команда создаёт следующую структуру:

```
project/
├── alembic/
│   ├── versions/       # папка с файлами миграций
│   ├── env.py          # конфигурационный файл окружения
│   ├── README
│   └── script.py.mako  # шаблон для новых миграций
└── alembic.ini         # основной конфигурационный файл
```

## Настройка подключения к базе данных

Откройте `alembic.ini` и укажите строку подключения:

```ini
# alembic.ini
sqlalchemy.url = postgresql://user:password@localhost/mydb
```

Однако хранить credentials в файле конфигурации — плохая практика. Лучше читать их из переменных окружения. Для этого отредактируйте `alembic/env.py`:

```python
# alembic/env.py
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Переопределяем URL из переменной окружения
database_url = os.getenv("DATABASE_URL", "sqlite:///./app.db")
config.set_main_option("sqlalchemy.url", database_url)

target_metadata = None

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

## Создание первой миграции вручную

Создайте новую миграцию командой:

```bash
alembic revision -m "create_users_table"
```

Alembic создаст файл в папке `versions/` с уникальным идентификатором:

```python
# alembic/versions/a1b2c3d4e5f6_create_users_table.py
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

def downgrade() -> None:
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
```

Каждая миграция содержит две функции:
- `upgrade()` — применяет изменения
- `downgrade()` — откатывает их

## Автогенерация миграций из моделей SQLAlchemy

Главное преимущество Alembic — умение сравнивать текущее состояние базы данных с описанными моделями и автоматически генерировать миграции.

Сначала опишите модели с использованием декларативного стиля SQLAlchemy:

```python
# app/models.py
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    posts: Mapped[list["Post"]] = relationship("Post", back_populates="author")

class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    author: Mapped["User"] = relationship("User", back_populates="posts")
```

Теперь подключите метаданные моделей в `env.py`:

```python
# alembic/env.py
from app.models import Base

target_metadata = Base.metadata
```

Запустите автогенерацию:

```bash
alembic revision --autogenerate -m "add_posts_table"
```

Alembic сравнит модели с текущей схемой базы данных и сгенерирует необходимые команды в `upgrade()` и `downgrade()`.

**Важно:** всегда просматривайте сгенерированные миграции перед применением. Autogenerate не распознаёт ряд изменений: переименование столбцов (воспринимает как удаление + добавление), изменения на уровне хранимых процедур и триггеров.

## Применение и откат миграций

Посмотрите текущее состояние:

```bash
alembic current
```

Посмотрите историю миграций:

```bash
alembic history --verbose
```

Примените все ожидающие миграции:

```bash
alembic upgrade head
```

Примените конкретную миграцию по идентификатору:

```bash
alembic upgrade a1b2c3d4e5f6
```

Примените следующую миграцию (на один шаг вперёд):

```bash
alembic upgrade +1
```

Откатите последнюю миграцию:

```bash
alembic downgrade -1
```

Откатите до конкретной версии:

```bash
alembic downgrade a1b2c3d4e5f6
```

Откатите все миграции (до начального состояния):

```bash
alembic downgrade base
```

## Продвинутые операции с op

Модуль `op` предоставляет широкий набор операций для изменения схемы:

```python
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # Добавить столбец
    op.add_column('users',
        sa.Column('bio', sa.Text(), nullable=True)
    )

    # Изменить тип столбца
    op.alter_column('users', 'username',
        existing_type=sa.String(100),
        type_=sa.String(150),
        nullable=False
    )

    # Переименовать столбец
    op.alter_column('users', 'hashed_password',
        new_column_name='password_hash'
    )

    # Создать индекс
    op.create_index('ix_posts_author_id', 'posts', ['author_id'])

    # Создать уникальное ограничение
    op.create_unique_constraint('uq_posts_title_author', 'posts', ['title', 'author_id'])

    # Удалить ограничение
    op.drop_constraint('uq_posts_title_author', 'posts', type_='unique')

def downgrade() -> None:
    op.drop_column('users', 'bio')
    op.alter_column('users', 'username',
        existing_type=sa.String(150),
        type_=sa.String(100),
        nullable=False
    )
```

## Миграции с переносом данных

Иногда вместе с изменением схемы нужно перенести существующие данные. Alembic позволяет выполнять SQL прямо в миграции:

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

def upgrade() -> None:
    # Добавляем новый столбец
    op.add_column('users',
        sa.Column('display_name', sa.String(200), nullable=True)
    )

    # Переносим данные: заполняем display_name из username
    users = table('users',
        column('id', sa.Integer),
        column('username', sa.String),
        column('display_name', sa.String),
    )
    op.execute(
        users.update().values(display_name=users.c.username)
    )

    # Делаем столбец обязательным после заполнения
    op.alter_column('users', 'display_name', nullable=False)

def downgrade() -> None:
    op.drop_column('users', 'display_name')
```

Для сложных операций с данными удобнее использовать прямой SQL:

```python
def upgrade() -> None:
    op.execute("""
        INSERT INTO user_roles (user_id, role)
        SELECT id, 'user' FROM users
        WHERE id NOT IN (SELECT user_id FROM user_roles)
    """)
```

## Интеграция с приложением

В реальных проектах миграции часто запускают программно при старте приложения. Вот пример для FastAPI:

```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from alembic.config import Config
from alembic import command
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_migrations() -> None:
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", DATABASE_URL)
    command.upgrade(alembic_cfg, "head")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import run_migrations

@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    yield

app = FastAPI(lifespan=lifespan)
```

## Типичные проблемы и решения

**Конфликты веток в версиях миграций.** При командной разработке могут возникнуть миграции с одинаковым `down_revision`. Alembic это обнаружит и сообщит об ошибке. Решение — создать миграцию-слияние:

```bash
alembic merge -m "merge_branches" a1b2c3 d4e5f6
```

**Таблица `alembic_version` уже существует.** Если база данных уже содержит таблицы, но Alembic запускается впервые, пометьте текущее состояние как базовую версию без применения изменений:

```bash
alembic stamp head
```

**Autogenerate не видит изменений.** Убедитесь, что `target_metadata` в `env.py` указывает на правильный объект `Base.metadata`, и что все модели импортированы до его использования:

```python
# env.py — импортируем все модули с моделями явно
from app.models import Base  # noqa: F401 — этот импорт нужен для регистрации всех моделей
from app import users, posts, comments  # noqa: F401

target_metadata = Base.metadata
```

**Проверка миграции без применения.** Чтобы увидеть SQL без выполнения, используйте флаг `--sql`:

```bash
alembic upgrade head --sql
```

## Организация миграций в большом проекте

Для крупных проектов рекомендуется держать модели и конфигурацию Alembic вместе с приложением:

```
project/
├── app/
│   ├── models/
│   │   ├── __init__.py   # экспортирует Base и все модели
│   │   ├── user.py
│   │   └── post.py
│   └── database.py
├── migrations/           # можно переименовать из alembic/
│   ├── versions/
│   └── env.py
└── alembic.ini
```

В `alembic.ini` измените путь к папке с миграциями:

```ini
script_location = migrations
```

Такой подход упрощает навигацию и делает структуру проекта более явной.

## Заключение

Alembic — стандартный инструмент для управления миграциями в экосистеме SQLAlchemy. Он решает задачу версионирования схемы базы данных надёжно и гибко: от простых изменений структуры таблиц до сложных миграций данных. Начните с ручного написания миграций, чтобы понять их структуру, затем подключите автогенерацию для ускорения работы — и всегда проверяйте сгенерированный код перед применением.

Чтобы глубже изучить Python, работу с базами данных и построение полноценных бэкенд-приложений, рекомендуем курс на PurpleSchool:

[Python-разработчик — курс на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=alembic-database-migrations-sqlalchemy)
