---
metaTitle: "SQLModel ORM для FastAPI — модели, CRUD и связи"
metaDescription: "Полное руководство по SQLModel: создание моделей, CRUD-операции, связи между таблицами и интеграция с FastAPI на практических примерах."
author: "Антон Ларичев"
title: "SQLModel ORM для FastAPI"
preview: "Разбираем SQLModel — библиотеку, объединяющую SQLAlchemy и Pydantic для работы с базой данных в FastAPI-приложениях."
---

## Что такое SQLModel

SQLModel — библиотека для работы с реляционными базами данных в Python, созданная автором FastAPI Себастьяном Рамиресом. Под капотом SQLModel использует SQLAlchemy как ORM-движок и Pydantic для валидации данных. Ключевое преимущество: одна модель описывает одновременно таблицу в базе данных и схему для сериализации/десериализации в API.

Без SQLModel разработчик обычно пишет два отдельных класса — SQLAlchemy-модель для базы и Pydantic-схему для API. SQLModel устраняет это дублирование, позволяя переиспользовать одно определение в обоих контекстах.

## Установка и настройка

Установите SQLModel и драйвер базы данных:

```bash
pip install sqlmodel
# Для PostgreSQL
pip install psycopg2-binary
# Для SQLite (входит в стандартную библиотеку Python, доп. пакет не нужен)
```

Для работы с FastAPI установите его отдельно:

```bash
pip install fastapi uvicorn
```

## Создание первой модели

Модель SQLModel наследуется от `SQLModel` и декорируется параметром `table=True`, чтобы указать, что это таблица в базе данных:

```python
from typing import Optional
from sqlmodel import Field, SQLModel


class Hero(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    secret_name: str
    age: Optional[int] = None
```

Поле `id` объявлено как `Optional[int]` с `default=None`, потому что при создании объекта идентификатор ещё не присвоен — его назначает база данных.

### Создание таблиц

Для создания таблиц вызовите `SQLModel.metadata.create_all`:

```python
from sqlmodel import create_engine

DATABASE_URL = "sqlite:///./database.db"
engine = create_engine(DATABASE_URL)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
```

## Работа с сессиями

Сессия — основной интерфейс для взаимодействия с базой данных. В SQLModel используется `Session` из пакета `sqlmodel`:

```python
from sqlmodel import Session


def create_hero():
    hero = Hero(name="Deadpond", secret_name="Dive Wilson")
    with Session(engine) as session:
        session.add(hero)
        session.commit()
        session.refresh(hero)
        print(hero.id)  # ID назначен после commit и refresh
```

Конструкция `with Session(engine) as session` автоматически закрывает соединение после выхода из блока. Метод `session.refresh(hero)` перечитывает объект из базы — без этого поля, заполняемые на стороне БД (например, `id`), останутся `None`.

## CRUD-операции

### Создание записи

```python
def add_hero(hero_data: dict) -> Hero:
    hero = Hero(**hero_data)
    with Session(engine) as session:
        session.add(hero)
        session.commit()
        session.refresh(hero)
        return hero
```

### Чтение записей

Для выборки используется метод `session.exec` с объектами `select`:

```python
from sqlmodel import select


def get_heroes() -> list[Hero]:
    with Session(engine) as session:
        statement = select(Hero)
        heroes = session.exec(statement).all()
        return heroes


def get_hero_by_id(hero_id: int) -> Hero | None:
    with Session(engine) as session:
        hero = session.get(Hero, hero_id)
        return hero
```

Метод `session.get(Model, pk)` — быстрый способ получить запись по первичному ключу. Для сложных запросов используйте `select` с цепочкой фильтров:

```python
def get_heroes_by_age(min_age: int) -> list[Hero]:
    with Session(engine) as session:
        statement = select(Hero).where(Hero.age >= min_age).order_by(Hero.name)
        return session.exec(statement).all()
```

### Обновление записи

```python
def update_hero(hero_id: int, age: int) -> Hero | None:
    with Session(engine) as session:
        hero = session.get(Hero, hero_id)
        if not hero:
            return None
        hero.age = age
        session.add(hero)
        session.commit()
        session.refresh(hero)
        return hero
```

### Удаление записи

```python
def delete_hero(hero_id: int) -> bool:
    with Session(engine) as session:
        hero = session.get(Hero, hero_id)
        if not hero:
            return False
        session.delete(hero)
        session.commit()
        return True
```

## Интеграция с FastAPI

### Dependency Injection для сессии

В FastAPI сессию базы данных принято передавать через систему зависимостей (Depends). Это обеспечивает автоматическое закрытие соединения после каждого запроса:

```python
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select

app = FastAPI()


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Depends(get_session)
```

### Разделение моделей на схемы

Одна модель на все случаи — удобно для простых приложений, но на практике нужны разные схемы для создания, обновления и ответа. SQLModel поддерживает наследование моделей:

```python
class HeroBase(SQLModel):
    name: str
    secret_name: str
    age: Optional[int] = None


class Hero(HeroBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class HeroCreate(HeroBase):
    pass


class HeroPublic(HeroBase):
    id: int


class HeroUpdate(SQLModel):
    name: Optional[str] = None
    secret_name: Optional[str] = None
    age: Optional[int] = None
```

`HeroCreate` — схема входящих данных без `id`. `HeroPublic` — схема ответа с `id`. `HeroUpdate` — схема частичного обновления, где все поля опциональны.

### Роуты CRUD

```python
@app.post("/heroes/", response_model=HeroPublic)
def create_hero(hero: HeroCreate, session: Session = SessionDep):
    db_hero = Hero.model_validate(hero)
    session.add(db_hero)
    session.commit()
    session.refresh(db_hero)
    return db_hero


@app.get("/heroes/", response_model=list[HeroPublic])
def read_heroes(
    offset: int = 0,
    limit: int = 100,
    session: Session = SessionDep,
):
    heroes = session.exec(select(Hero).offset(offset).limit(limit)).all()
    return heroes


@app.get("/heroes/{hero_id}", response_model=HeroPublic)
def read_hero(hero_id: int, session: Session = SessionDep):
    hero = session.get(Hero, hero_id)
    if not hero:
        raise HTTPException(status_code=404, detail="Hero not found")
    return hero


@app.patch("/heroes/{hero_id}", response_model=HeroPublic)
def update_hero(hero_id: int, hero: HeroUpdate, session: Session = SessionDep):
    db_hero = session.get(Hero, hero_id)
    if not db_hero:
        raise HTTPException(status_code=404, detail="Hero not found")
    hero_data = hero.model_dump(exclude_unset=True)
    db_hero.sqlmodel_update(hero_data)
    session.add(db_hero)
    session.commit()
    session.refresh(db_hero)
    return db_hero


@app.delete("/heroes/{hero_id}")
def delete_hero(hero_id: int, session: Session = SessionDep):
    hero = session.get(Hero, hero_id)
    if not hero:
        raise HTTPException(status_code=404, detail="Hero not found")
    session.delete(hero)
    session.commit()
    return {"ok": True}
```

Метод `model_dump(exclude_unset=True)` возвращает только те поля, которые пользователь явно передал в запросе — это ключевой момент для частичного обновления (PATCH).

## Связи между таблицами

### Один-ко-многим

Рассмотрим связь команды и героев: у одной команды может быть много героев.

```python
from typing import Optional
from sqlmodel import Field, Relationship, SQLModel


class Team(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    headquarters: str
    heroes: list["Hero"] = Relationship(back_populates="team")


class Hero(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    secret_name: str
    age: Optional[int] = None
    team_id: Optional[int] = Field(default=None, foreign_key="team.id")
    team: Optional[Team] = Relationship(back_populates="heroes")
```

Поле `team_id` — внешний ключ, ссылающийся на `team.id`. `Relationship` настраивает ORM-связь, `back_populates` указывает имя обратного атрибута.

### Загрузка связанных объектов

По умолчанию SQLModel использует ленивую загрузку (lazy loading). При работе с FastAPI это вызывает проблему — сессия закрывается до момента сериализации ответа. Используйте `selectin` загрузку:

```python
from sqlalchemy.orm import selectinload


@app.get("/teams/{team_id}/heroes", response_model=list[HeroPublic])
def read_team_heroes(team_id: int, session: Session = SessionDep):
    statement = (
        select(Team)
        .where(Team.id == team_id)
        .options(selectinload(Team.heroes))
    )
    team = session.exec(statement).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team.heroes
```

### Многие-ко-многим

Для связи многие-ко-многим нужна промежуточная таблица:

```python
class HeroProjectLink(SQLModel, table=True):
    hero_id: Optional[int] = Field(
        default=None, foreign_key="hero.id", primary_key=True
    )
    project_id: Optional[int] = Field(
        default=None, foreign_key="project.id", primary_key=True
    )


class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    heroes: list[Hero] = Relationship(
        back_populates="projects", link_model=HeroProjectLink
    )


# В модели Hero добавляем:
# projects: list[Project] = Relationship(
#     back_populates="heroes", link_model=HeroProjectLink
# )
```

## Инициализация базы данных при старте приложения

```python
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)
```

SQLModel поддерживает как синхронный, так и асинхронный режим. Для асинхронной работы используется `AsyncSession` из `sqlalchemy.ext.asyncio` — базовый синтаксис остаётся таким же, но все вызовы к сессии требуют `await`.

## Миграции с Alembic

Для production-приложений `create_all` не подходит — при изменении схемы таблицы данные не мигрируются. Используйте Alembic:

```bash
pip install alembic
alembic init alembic
```

В `alembic/env.py` укажите метаданные SQLModel:

```python
from sqlmodel import SQLModel
from app.models import Hero, Team  # импорт всех моделей

target_metadata = SQLModel.metadata
```

Создание и применение миграции:

```bash
alembic revision --autogenerate -m "add hero table"
alembic upgrade head
```

## Советы по производительности

Избегайте загрузки лишних данных — выбирайте конкретные поля через `select` с указанием колонок:

```python
from sqlmodel import col

statement = select(col(Hero.id), col(Hero.name))
results = session.exec(statement).all()
```

Для операций массового обновления или удаления используйте `update` и `delete` из SQLAlchemy напрямую — это эффективнее, чем загружать объекты в память:

```python
from sqlalchemy import update

statement = update(Hero).where(Hero.age < 18).values(age=18)
session.exec(statement)
session.commit()
```

Используйте пул соединений через параметры `create_engine`:

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)
```

`pool_pre_ping=True` проверяет соединение перед использованием — защищает от ошибок при разрыве соединения с базой.

## Итоги

SQLModel устраняет дублирование между ORM-моделями и Pydantic-схемами, делая код FastAPI-приложений компактнее. Иерархия наследования моделей (`Base -> DBModel, CreateSchema, PublicSchema, UpdateSchema`) — стандартный паттерн для разграничения входных и выходных данных. Для production всегда используйте Alembic вместо `create_all`, настраивайте пул соединений и явно управляйте загрузкой связанных объектов.

Чтобы глубоко освоить FastAPI и построение production-ready API на Python, смотрите курс на PurpleSchool: https://purpleschool.ru/course/fastapi?utm_source=knowledgebase&utm_medium=text&utm_campaign=sqlmodel-orm-for-fastapi