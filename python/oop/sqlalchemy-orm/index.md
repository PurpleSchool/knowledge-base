---
metaTitle: "SQLAlchemy ORM в Python: полное руководство"
metaDescription: "Изучите SQLAlchemy ORM: подключение к БД, создание моделей, CRUD-операции, связи между таблицами и сессии на практических примерах."
author: "Антон Ларичев"
title: "SQLAlchemy ORM в Python"
preview: "Полное руководство по SQLAlchemy ORM: от установки и создания моделей до сложных запросов и связей между таблицами."
---

SQLAlchemy — самая популярная библиотека для работы с базами данных в Python. Её ORM-слой (Object-Relational Mapping) позволяет описывать таблицы как Python-классы и работать с записями как с обычными объектами, не пиша SQL вручную. В этой статье разберём SQLAlchemy ORM от подключения к базе данных до сложных запросов и связей.

## Установка и подключение

Установите SQLAlchemy и драйвер для нужной СУБД:

```bash
pip install sqlalchemy
# Для PostgreSQL:
pip install psycopg2-binary
# Для MySQL:
pip install pymysql
# SQLite встроен в Python — дополнительный драйвер не нужен
```

Подключение к базе данных создаётся через `create_engine`. Строка подключения определяет СУБД, учётные данные и имя базы:

```python
from sqlalchemy import create_engine

# SQLite (файл на диске)
engine = create_engine("sqlite:///app.db", echo=True)

# PostgreSQL
engine = create_engine(
    "postgresql+psycopg2://user:password@localhost:5432/mydb"
)

# MySQL
engine = create_engine(
    "mysql+pymysql://user:password@localhost:3306/mydb"
)
```

Параметр `echo=True` выводит генерируемый SQL в консоль — удобно при разработке.

## Декларативный стиль: создание моделей

Современный способ описания моделей в SQLAlchemy 2.x — декларативный стиль с аннотациями типов. Каждый класс модели наследуется от `DeclarativeBase`:

```python
from sqlalchemy import String, Integer, Text, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"
```

Ключевые элементы модели:

- `__tablename__` — имя таблицы в базе данных
- `Mapped[тип]` — аннотация с типом столбца; если тип обёрнут в `Optional` или `тип | None`, столбец допускает NULL
- `mapped_column()` — настройки столбца: первичный ключ, уникальность, дефолтное значение

### Создание таблиц

Метод `create_all` создаёт все таблицы, зарегистрированные в `Base.metadata`:

```python
Base.metadata.create_all(engine)
```

Для удаления всех таблиц используется `drop_all` — в продакшене делайте это только намеренно.

## Сессия: точка входа в ORM

Все операции с базой данных проходят через `Session`. Сессия отслеживает изменения объектов и фиксирует их транзакцией при вызове `commit`.

```python
from sqlalchemy.orm import Session

# Создание сессии вручную
session = Session(engine)

# Либо через фабрику (рекомендуется)
from sqlalchemy.orm import sessionmaker

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
session = SessionLocal()
```

В реальных приложениях сессию открывают как контекстный менеджер, чтобы она автоматически закрывалась:

```python
with Session(engine) as session:
    # все операции внутри блока
    session.commit()
```

## CRUD-операции

### Создание записей (Create)

```python
with Session(engine) as session:
    user = User(
        username="ivan_petrov",
        email="ivan@example.com",
        bio="Backend developer"
    )
    session.add(user)
    session.commit()
    session.refresh(user)  # обновляет объект данными из БД (id, created_at)
    print(user.id)  # 1
```

Для массовой вставки используйте `add_all`:

```python
with Session(engine) as session:
    users = [
        User(username="alice", email="alice@example.com"),
        User(username="bob", email="bob@example.com"),
        User(username="carol", email="carol@example.com"),
    ]
    session.add_all(users)
    session.commit()
```

### Чтение записей (Read)

Для запросов используется метод `session.execute()` с объектами `select`:

```python
from sqlalchemy import select

with Session(engine) as session:
    # Получить по первичному ключу
    user = session.get(User, 1)
    print(user)  # <User id=1 username='ivan_petrov'>

    # Получить одну запись по условию
    stmt = select(User).where(User.username == "alice")
    user = session.execute(stmt).scalar_one_or_none()

    # Получить все записи
    stmt = select(User).order_by(User.created_at.desc())
    users = session.execute(stmt).scalars().all()
    for u in users:
        print(u.username)
```

Методы получения результатов:

- `scalar_one()` — ровно одна запись, иначе исключение
- `scalar_one_or_none()` — одна запись или `None`
- `scalars().all()` — список всех записей
- `scalars().first()` — первая запись или `None`

### Обновление записей (Update)

```python
with Session(engine) as session:
    user = session.get(User, 1)
    if user:
        user.bio = "Senior Backend Developer"
        session.commit()
```

Сессия автоматически отслеживает изменения атрибутов — достаточно изменить поле и вызвать `commit`. Для массового обновления применяйте `update`:

```python
from sqlalchemy import update

with Session(engine) as session:
    stmt = (
        update(User)
        .where(User.email.like("%@example.com"))
        .values(bio="Example company employee")
    )
    session.execute(stmt)
    session.commit()
```

### Удаление записей (Delete)

```python
with Session(engine) as session:
    user = session.get(User, 1)
    if user:
        session.delete(user)
        session.commit()
```

Массовое удаление:

```python
from sqlalchemy import delete

with Session(engine) as session:
    stmt = delete(User).where(User.username == "bob")
    session.execute(stmt)
    session.commit()
```

## Связи между моделями

Одно из главных преимуществ ORM — декларативное описание связей между таблицами.

### Один ко многим (One-to-Many)

```python
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    author: Mapped["User"] = relationship(back_populates="posts")

# Добавляем обратную связь в User
class User(Base):
    __tablename__ = "users"
    # ... остальные поля ...
    posts: Mapped[list["Post"]] = relationship(back_populates="author", cascade="all, delete-orphan")
```

Параметр `cascade="all, delete-orphan"` означает, что при удалении пользователя все его посты тоже удаляются.

Пример использования:

```python
with Session(engine) as session:
    user = session.get(User, 2)
    post = Post(title="Первый пост", body="Содержимое поста", author=user)
    session.add(post)
    session.commit()

    # Обращение к связанным объектам
    for post in user.posts:
        print(post.title)
```

### Многие ко многим (Many-to-Many)

Для связи «многие ко многим» нужна промежуточная таблица:

```python
from sqlalchemy import Table, Column

# Ассоциативная таблица
post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)

class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    posts: Mapped[list["Post"]] = relationship(
        secondary=post_tags, back_populates="tags"
    )

# В модели Post добавляем:
# tags: Mapped[list[Tag]] = relationship(secondary=post_tags, back_populates="posts")
```

## Фильтрация и сложные запросы

### Фильтры и операторы

```python
from sqlalchemy import select, or_, and_, func

with Session(engine) as session:
    # Несколько условий AND
    stmt = select(User).where(
        and_(User.username.startswith("a"), User.bio.isnot(None))
    )

    # Условие OR
    stmt = select(User).where(
        or_(User.email.like("%@gmail.com"), User.email.like("%@yandex.ru"))
    )

    # Сортировка и лимит
    stmt = (
        select(User)
        .order_by(User.created_at.desc())
        .limit(10)
        .offset(20)
    )

    # Подсчёт записей
    stmt = select(func.count()).select_from(User)
    count = session.execute(stmt).scalar()
    print(f"Всего пользователей: {count}")
```

### JOIN-запросы

```python
with Session(engine) as session:
    # Получить посты с информацией об авторе
    stmt = (
        select(Post, User)
        .join(User, Post.user_id == User.id)
        .where(User.username == "alice")
    )
    results = session.execute(stmt).all()
    for post, user in results:
        print(f"{user.username}: {post.title}")
```

### Жадная загрузка связанных объектов

По умолчанию SQLAlchemy загружает связанные объекты «лениво» — отдельным запросом при первом обращении. Это приводит к проблеме N+1 запросов. Решение — жадная загрузка через `selectinload` или `joinedload`:

```python
from sqlalchemy.orm import selectinload, joinedload

with Session(engine) as session:
    # selectinload — отдельный SELECT для связанных объектов (рекомендуется для коллекций)
    stmt = select(User).options(selectinload(User.posts))
    users = session.execute(stmt).scalars().all()
    for user in users:
        print(f"{user.username}: {len(user.posts)} постов")

    # joinedload — JOIN в одном запросе (рекомендуется для единичных связей)
    stmt = select(Post).options(joinedload(Post.author))
    posts = session.execute(stmt).scalars().all()
    for post in posts:
        print(f"{post.title} by {post.author.username}")
```

## Валидация и события

SQLAlchemy поддерживает хуки через декоратор `@event.listens_for` и валидаторы через `@validates`:

```python
from sqlalchemy.orm import validates
from sqlalchemy import event

class User(Base):
    __tablename__ = "users"
    # ... поля ...

    @validates("email")
    def validate_email(self, key, email):
        if "@" not in email:
            raise ValueError(f"Некорректный email: {email}")
        return email.lower()

@event.listens_for(User, "before_insert")
def set_default_bio(mapper, connection, target):
    if target.bio is None:
        target.bio = "Описание не указано"
```

## Управление схемой: Alembic

Для управления миграциями базы данных вместе с SQLAlchemy используется Alembic:

```bash
pip install alembic
alembic init migrations
```

Alembic отслеживает изменения моделей и генерирует миграции автоматически:

```bash
# Создать миграцию на основе изменений в моделях
alembic revision --autogenerate -m "add posts table"

# Применить миграции
alembic upgrade head

# Откатить последнюю миграцию
alembic downgrade -1
```

Миграции позволяют безопасно изменять схему базы данных в продакшене, не теряя данные.

## Паттерн Repository

В приложениях с бизнес-логикой принято инкапсулировать запросы в репозиториях:

```python
class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, user_id: int) -> User | None:
        return self.session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.session.execute(stmt).scalar_one_or_none()

    def create(self, username: str, email: str) -> User:
        user = User(username=username, email=email)
        self.session.add(user)
        self.session.flush()  # Сохраняет в БД без commit, получает id
        return user

    def list_active(self, limit: int = 100) -> list[User]:
        stmt = select(User).order_by(User.created_at.desc()).limit(limit)
        return self.session.execute(stmt).scalars().all()


# Использование
with Session(engine) as session:
    repo = UserRepository(session)
    user = repo.create("diana", "diana@example.com")
    session.commit()
    print(user.id)
```

Паттерн Repository делает код тестируемым: в тестах можно подменить реальную сессию на мок или использовать SQLite in-memory.

## Итог

SQLAlchemy ORM предоставляет мощный инструментарий для работы с реляционными базами данных в Python:

- **Модели** описывают таблицы как Python-классы с типизированными полями
- **Сессия** управляет транзакциями и отслеживает изменения объектов
- **Связи** (`relationship`) позволяют работать со связанными данными как с атрибутами объектов
- **`select`** с фильтрами, JOIN и жадной загрузкой закрывает большинство сценариев выборки
- **Alembic** берёт на себя управление миграциями схемы

Изучить Python и SQLAlchemy на практике с разбором реальных проектов можно на курсе [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=sqlalchemy-orm).