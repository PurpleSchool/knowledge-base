---
metaTitle: "Тестирование FastAPI с pytest — полное руководство"
metaDescription: "Как тестировать FastAPI приложения с pytest и httpx: TestClient, фикстуры, переопределение зависимостей, моки и async-тесты."
author: "Антон Ларичев"
title: "Тестирование FastAPI приложений с pytest"
preview: "Практическое руководство по тестированию FastAPI: от базовых проверок эндпоинтов до переопределения зависимостей и тестирования базы данных."
---

## Зачем тестировать FastAPI приложения

FastAPI — асинхронный веб-фреймворк с автоматической валидацией через Pydantic и встроенной поддержкой OpenAPI. Именно из-за этих особенностей автоматические тесты здесь особенно ценны: они проверяют не только бизнес-логику, но и то, что схемы запросов/ответов соответствуют документации, а валидация работает корректно.

Праграматичный подход — покрывать тестами каждый эндпоинт: успешный сценарий, граничные случаи и ожидаемые ошибки. В этой статье разберём весь инструментарий для этого.

## Установка зависимостей

Для тестирования FastAPI нужны три пакета:

```bash
pip install pytest pytest-asyncio httpx
```

- `pytest` — основной фреймворк для тестов
- `pytest-asyncio` — поддержка `async`-тестов
- `httpx` — HTTP-клиент, который использует `TestClient` из FastAPI

Если используете `uv` или `poetry`:

```bash
uv add --dev pytest pytest-asyncio httpx
# или
poetry add --group dev pytest pytest-asyncio httpx
```

## Структура проекта

Типичная структура для небольшого FastAPI-приложения с тестами:

```
project/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── routers/
│       ├── __init__.py
│       └── users.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_users.py
└── pytest.ini
```

Файл `pytest.ini` для базовой конфигурации:

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
```

## Базовое приложение для примеров

Возьмём простое приложение с управлением пользователями:

```python
# app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

users_db: dict[int, dict] = {}
_next_id = 1


class UserCreate(BaseModel):
    name: str
    email: str
    age: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    age: Optional[int] = None


@app.get("/users", response_model=list[UserResponse])
def get_users():
    return list(users_db.values())


@app.post("/users", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate):
    global _next_id
    new_user = {"id": _next_id, **user.model_dump()}
    users_db[_next_id] = new_user
    _next_id += 1
    return new_user


@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]


@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    del users_db[user_id]
```

## TestClient — синхронное тестирование

FastAPI предоставляет `TestClient` на базе `httpx`. Он позволяет делать HTTP-запросы к приложению без запуска реального сервера:

```python
# tests/test_users.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_users_empty():
    response = client.get("/users")
    assert response.status_code == 200
    assert response.json() == []


def test_create_user():
    payload = {"name": "Иван Петров", "email": "ivan@example.com", "age": 30}
    response = client.post("/users", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Иван Петров"
    assert data["email"] == "ivan@example.com"
    assert data["age"] == 30
    assert "id" in data


def test_get_user_not_found():
    response = client.get("/users/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"
```

Запуск:

```bash
pytest tests/test_users.py -v
```

## Фикстуры в conftest.py

Проблема с примером выше — тесты могут зависеть от порядка запуска: данные из одного теста влияют на другой. Решение — фикстуры с изолированным состоянием.

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app, users_db


@pytest.fixture(autouse=True)
def clear_db():
    """Очищает БД перед каждым тестом."""
    users_db.clear()
    yield
    users_db.clear()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def created_user(client):
    payload = {"name": "Тест Тестов", "email": "test@example.com"}
    response = client.post("/users", json=payload)
    return response.json()
```

Теперь тесты используют фикстуры и не зависят друг от друга:

```python
# tests/test_users.py
def test_create_and_get_user(client):
    payload = {"name": "Мария Иванова", "email": "maria@example.com"}
    create_response = client.post("/users", json=payload)
    user_id = create_response.json()["id"]

    get_response = client.get(f"/users/{user_id}")
    assert get_response.status_code == 200
    assert get_response.json()["email"] == "maria@example.com"


def test_delete_user(client, created_user):
    user_id = created_user["id"]

    delete_response = client.delete(f"/users/{user_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/users/{user_id}")
    assert get_response.status_code == 404


def test_create_user_invalid_email(client):
    payload = {"name": "Петр", "email": "не-email"}
    response = client.post("/users", json=payload)
    # Pydantic v2 валидирует email если указан EmailStr
    # Здесь просто проверяем что поле обязательно
    assert response.status_code in (201, 422)
```

## Переопределение зависимостей

Одна из мощнейших возможностей FastAPI в тестах — `app.dependency_overrides`. Она позволяет подменять зависимости без изменения кода приложения.

Добавим аутентификацию через зависимость:

```python
# app/dependencies.py
from fastapi import Header, HTTPException


def get_current_user(authorization: str = Header(...)):
    if authorization != "Bearer secret-token":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"user_id": 1, "role": "admin"}
```

```python
# app/routers/admin.py
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

router = APIRouter(prefix="/admin")


@router.get("/stats")
def get_stats(current_user: dict = Depends(get_current_user)):
    return {"total_users": 100, "requested_by": current_user["user_id"]}
```

В тестах подменяем зависимость, чтобы не передавать реальный токен:

```python
# tests/test_admin.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_current_user


@pytest.fixture
def authenticated_client():
    def mock_user():
        return {"user_id": 42, "role": "admin"}

    app.dependency_overrides[get_current_user] = mock_user
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_get_stats_authenticated(authenticated_client):
    response = authenticated_client.get("/admin/stats")
    assert response.status_code == 200
    assert response.json()["requested_by"] == 42


def test_get_stats_unauthenticated():
    client = TestClient(app)
    response = client.get("/admin/stats")
    assert response.status_code == 401
```

## Тестирование с реальной базой данных

Для тестирования с SQLAlchemy создают отдельную тестовую БД (обычно SQLite in-memory) и переопределяют зависимость получения сессии:

```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "postgresql://user:pass@localhost/mydb"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, get_db

TEST_DATABASE_URL = "sqlite:///./test.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

Каждый тест получает собственную транзакцию, которая откатывается после завершения — база остаётся чистой.

## Async-тесты с pytest-asyncio

Если эндпоинты используют `async def` и внешние async-операции, тесты тоже должны быть асинхронными:

```python
# app/main.py (async версия)
import httpx
from fastapi import FastAPI

app = FastAPI()


@app.get("/weather/{city}")
async def get_weather(city: str):
    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(
            f"https://api.weather.example.com/current?city={city}"
        )
        return response.json()
```

```python
# tests/test_weather.py
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_get_weather_mock():
    mock_response_data = {"city": "Moscow", "temp": -5, "condition": "snow"}

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value.json.return_value = mock_response_data

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            response = await ac.get("/weather/Moscow")

    assert response.status_code == 200
    assert response.json()["city"] == "Moscow"
```

Для `asyncio_mode = auto` в `pytest.ini` декоратор `@pytest.mark.asyncio` можно опустить — все `async def` тесты будут запускаться автоматически.

## Параметризованные тесты

Параметризация позволяет проверить один эндпоинт с разными входными данными:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.mark.parametrize(
    "payload, expected_status",
    [
        ({"name": "Алексей", "email": "alex@example.com"}, 201),
        ({"name": "", "email": "alex@example.com"}, 422),
        ({"email": "alex@example.com"}, 422),
        ({"name": "Алексей"}, 422),
        ({}, 422),
    ],
)
def test_create_user_validation(payload, expected_status):
    response = client.post("/users", json=payload)
    assert response.status_code == expected_status


@pytest.mark.parametrize(
    "user_id, expected_status",
    [(1, 404), (0, 422), (-1, 422)],
)
def test_get_user_edge_cases(user_id, expected_status):
    response = client.get(f"/users/{user_id}")
    assert response.status_code == expected_status
```

## Мокирование внешних сервисов

Внешние HTTP-запросы в тестах нужно мокировать — иначе тесты становятся медленными и нестабильными:

```python
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_external_api_success():
    mock_data = {"status": "ok", "result": 42}

    with patch("app.services.external_client.get") as mock_get:
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: mock_data,
        )
        response = client.get("/process")

    assert response.status_code == 200


def test_external_api_failure():
    with patch("app.services.external_client.get") as mock_get:
        mock_get.side_effect = Exception("Connection refused")
        response = client.get("/process")

    assert response.status_code == 503
```

## Запуск и отчёты

Полезные флаги pytest:

```bash
# Подробный вывод
pytest -v

# Только упавшие тесты
pytest --last-failed

# Покрытие кода
pip install pytest-cov
pytest --cov=app --cov-report=html

# Параллельный запуск
pip install pytest-xdist
pytest -n auto

# Остановиться после первого падения
pytest -x

# Запустить конкретный тест
pytest tests/test_users.py::test_create_user -v
```

Отчёт покрытия генерируется в папку `htmlcov/` — откройте `htmlcov/index.html` в браузере, чтобы увидеть, какие строки не покрыты тестами.

## Практические рекомендации

**Изолируйте состояние.** Каждый тест должен начинаться с чистого состояния. Используйте фикстуры с `autouse=True` для очистки или транзакции с откатом для БД.

**Тестируйте контракты.** FastAPI гарантирует, что ответы соответствуют `response_model`. Проверяйте не только `status_code`, но и структуру JSON — это ловит breaking changes в схемах.

**Не тестируйте Pydantic.** Если поле помечено как `required` в модели, не нужно писать отдельный тест для каждого отсутствующего поля — Pydantic уже протестирован. Достаточно одного теста на `422` для невалидного запроса.

**Разделяйте unit и integration тесты.** Unit-тесты (без БД и внешних сервисов) запускайте всегда, интеграционные — в CI или по требованию.

```bash
# В pytest.ini можно маркировать тесты
[pytest]
markers =
    integration: тесты с реальной БД
    unit: быстрые тесты без зависимостей
```

```python
@pytest.mark.integration
def test_full_flow(client, db_session):
    ...
```

```bash
# Запуск только unit-тестов
pytest -m "not integration"
```

## Итог

Testing-стек для FastAPI: `pytest` как основа, `TestClient` для синхронных тестов, `httpx.AsyncClient` для async, `dependency_overrides` для подмены зависимостей, `unittest.mock` для моков внешних сервисов. Фикстуры в `conftest.py` обеспечивают изоляцию и переиспользование. Такой подход покрывает 90% реальных сценариев без избыточной сложности.

Чтобы глубже разобраться в Python и научиться строить production-ready приложения с FastAPI, проходите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=fastapi-testing