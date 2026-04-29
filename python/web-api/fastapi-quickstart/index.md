---
metaTitle: FastAPI Python — быстрый старт и основы фреймворка
metaDescription: FastAPI на Python — установка, создание API, маршруты, Pydantic-модели, валидация данных, документация Swagger. Пошаговое руководство для начинающих.
author: Антон Ларичев
title: "FastAPI Python — быстрый старт: создание REST API с нуля"
preview: Пошаговое руководство по FastAPI на Python — установка, создание маршрутов, Pydantic-модели, автоматическая документация Swagger. Пример рабочего API за 30 минут.
---

## Введение

FastAPI — современный асинхронный веб-фреймворк для Python, созданный Себастьяном Рамиресом в 2018 году. Он сочетает высокую производительность (сравнимую с Node.js и Go), удобный синтаксис и автоматическую генерацию документации.

По данным репозитория на GitHub, FastAPI — один из самых быстрорастущих Python-фреймворков последних лет. Его используют Microsoft, Uber, Netflix и многие другие компании.

**Ключевые преимущества:**
* Автоматическая валидация данных через Pydantic
* Автогенерация Swagger UI и ReDoc документации
* Поддержка async/await из коробки
* Строгая типизация, которая помогает IDE и снижает количество ошибок
* Высокая производительность на базе Starlette и Uvicorn

## Установка

```bash
# Создаём виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Устанавливаем FastAPI и сервер Uvicorn
pip install fastapi uvicorn
```

Для полной установки с дополнительными зависимостями:

```bash
pip install "fastapi[all]"
# Включает uvicorn, python-multipart, Jinja2 и другие пакеты
```

## Первое приложение

Создайте файл `main.py`:

```python
from fastapi import FastAPI

# Создаём экземпляр приложения
app = FastAPI(title="Мой первый API", version="1.0.0")


@app.get("/")
def read_root():
    return {"message": "Привет, FastAPI!"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
```

Запуск:

```bash
uvicorn main:app --reload
```

Флаг `--reload` перезапускает сервер при изменении файлов — удобно при разработке.

Перейдите на `http://127.0.0.1:8000` и увидите `{"message": "Привет, FastAPI!"}`.

Автоматическая документация доступна по адресам:
* `http://127.0.0.1:8000/docs` — Swagger UI (интерактивный)
* `http://127.0.0.1:8000/redoc` — ReDoc

Если вы хотите глубоко изучить создание REST API на Python с FastAPI — приходите на наш курс [Python с нуля](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=fastapi-quickstart). На курсе 200+ уроков, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Маршруты и HTTP-методы

FastAPI поддерживает все HTTP-методы через декораторы:

```python
from fastapi import FastAPI

app = FastAPI()

# GET — получение данных
@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"id": user_id, "name": "Иван"}

# POST — создание
@app.post("/users")
def create_user(name: str, email: str):
    return {"id": 1, "name": name, "email": email}

# PUT — полное обновление
@app.put("/users/{user_id}")
def update_user(user_id: int, name: str):
    return {"id": user_id, "name": name}

# DELETE — удаление
@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    return {"message": f"Пользователь {user_id} удалён"}

# PATCH — частичное обновление
@app.patch("/users/{user_id}")
def partial_update(user_id: int, email: str | None = None):
    return {"id": user_id, "email": email}
```

### Параметры пути и запроса

```python
@app.get("/items/{item_id}")
def read_item(
    item_id: int,          # параметр пути (обязательный)
    skip: int = 0,         # параметр запроса со значением по умолчанию
    limit: int = 10,       # ?skip=0&limit=10
    q: str | None = None   # необязательный параметр запроса
):
    return {
        "item_id": item_id,
        "skip": skip,
        "limit": limit,
        "q": q
    }
```

## Pydantic-модели для тела запроса

Для передачи данных в теле запроса используются Pydantic-модели:

```python
from fastapi import FastAPI
from pydantic import BaseModel, EmailStr, Field

app = FastAPI()


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50, description="Имя пользователя")
    email: str
    age: int = Field(ge=0, le=150, description="Возраст")
    role: str = "user"  # значение по умолчанию


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str


@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate):
    # FastAPI автоматически:
    # 1. Парсит JSON из тела запроса
    # 2. Валидирует данные согласно модели
    # 3. Возвращает 422 Unprocessable Entity при ошибке валидации
    
    new_user = {
        "id": 1,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }
    return new_user
```

`response_model=UserResponse` гарантирует, что в ответ вернутся только поля из `UserResponse` — это важно для безопасности (например, чтобы не вернуть пароль).

## Валидация данных

FastAPI использует Pydantic для валидации. При ошибке автоматически возвращается 422 с деталями:

```python
from pydantic import BaseModel, Field, validator

class Product(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0, description="Цена должна быть больше нуля")
    quantity: int = Field(ge=0, description="Количество не может быть отрицательным")
    category: str
    
    @validator('category')
    def category_must_be_valid(cls, v):
        valid = ['electronics', 'clothing', 'food']
        if v not in valid:
            raise ValueError(f'Категория должна быть одной из: {valid}')
        return v
```

При отправке невалидных данных FastAPI вернёт подробный ответ с указанием, какое поле не прошло валидацию.

## Зависимости (Dependency Injection)

Система зависимостей FastAPI позволяет переиспользовать логику — например, проверку авторизации:

```python
from fastapi import FastAPI, Depends, HTTPException, Header

app = FastAPI()


def verify_token(authorization: str = Header(...)):
    """Проверяем токен в заголовке Authorization"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Неверный формат токена")
    token = authorization.replace("Bearer ", "")
    if token != "secret-token":
        raise HTTPException(status_code=401, detail="Неверный токен")
    return token


@app.get("/protected")
def protected_route(token: str = Depends(verify_token)):
    return {"message": "Доступ разрешён", "token": token}
```

## Асинхронные обработчики

FastAPI отлично работает с `async/await` — это особенно важно для операций с базой данных и внешними API:

```python
import asyncio
import httpx
from fastapi import FastAPI

app = FastAPI()


@app.get("/async-example")
async def async_example():
    # Асинхронный HTTP-запрос (не блокирует сервер)
    async with httpx.AsyncClient() as client:
        response = await client.get("https://jsonplaceholder.typicode.com/posts/1")
        return response.json()


@app.get("/concurrent")
async def concurrent_requests():
    # Параллельные запросы
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            client.get("https://jsonplaceholder.typicode.com/posts/1"),
            client.get("https://jsonplaceholder.typicode.com/posts/2"),
        )
    return [r.json() for r in results]
```

## Обработка ошибок

```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

# Простая база данных в памяти
fake_db = {1: "Иван", 2: "Мария"}


@app.get("/users/{user_id}")
def get_user(user_id: int):
    if user_id not in fake_db:
        raise HTTPException(
            status_code=404,
            detail=f"Пользователь с id={user_id} не найден"
        )
    return {"id": user_id, "name": fake_db[user_id]}
```

## Структура проекта

Для реальных проектов рекомендуется следующая структура:

```
my_api/
├── main.py           # точка входа
├── routers/
│   ├── users.py      # маршруты пользователей
│   └── products.py   # маршруты продуктов
├── models/
│   └── schemas.py    # Pydantic-модели
└── dependencies.py   # общие зависимости
```

Пример роутера:

```python
# routers/users.py
from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}")
def get_user(user_id: int):
    return {"id": user_id}
```

```python
# main.py
from fastapi import FastAPI
from routers import users

app = FastAPI()
app.include_router(users.router)
```

## Частые ошибки

* **Смешение sync и async.** Если используете `async def`, все блокирующие операции (синхронная работа с БД, `time.sleep`) нужно заменить асинхронными аналогами. Иначе теряется весь смысл асинхронности.

* **Отсутствие `response_model`.** Без `response_model` FastAPI возвращает все поля объекта, включая пароли и внутренние данные.

* **Запуск с `python main.py` вместо uvicorn.** FastAPI не запускается напрямую — нужен ASGI-сервер (`uvicorn`, `hypercorn`, `gunicorn` с uvicorn workers).

* **Использование глобального состояния.** Не храните данные в глобальных переменных — это проблема при масштабировании. Используйте базу данных.

## Часто задаваемые вопросы

**FastAPI vs Flask — что выбрать?**

Flask — простой синхронный фреймворк, подходит для простых приложений и прототипов. FastAPI — асинхронный, с валидацией и документацией из коробки. Для новых проектов, особенно с API, выбирайте FastAPI.

**Как подключить базу данных?**

FastAPI работает с любой ORM. Для SQLAlchemy используют `async_sessionmaker`, для PostgreSQL популярна связка FastAPI + SQLAlchemy 2.0 + asyncpg. Для MongoDB — Beanie (async ODM на базе Pydantic).

**Как задеплоить FastAPI?**

Стандартный способ: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`. В Docker: образ `tiangolo/uvicorn-gunicorn-fastapi` содержит готовую конфигурацию.

## Заключение

FastAPI — отличный выбор для создания REST API на Python: минимум boilerplate-кода, встроенная валидация, автоматическая документация и отличная производительность. За 30 минут можно создать рабочий API с документацией.

Для углублённого изучения Python и веб-разработки рекомендуем курс [Python с нуля](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=fastapi-quickstart). В первых модулях доступно бесплатное содержание — познакомьтесь с форматом обучения до покупки.
