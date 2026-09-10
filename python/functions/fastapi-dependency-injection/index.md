---
metaTitle: "FastAPI Dependency Injection: Depends и провайдеры"
metaDescription: "Как использовать dependency injection в FastAPI: Depends(), классы-провайдеры, цепочки зависимостей, кэширование и тестирование."
author: "Антон Ларичев"
title: "FastAPI dependency injection и провайдеры"
preview: "Разбираем механизм Depends() в FastAPI: функции и классы как провайдеры, цепочки зависимостей, управление сессиями БД и переопределение в тестах."
---

## Что такое dependency injection в FastAPI

Dependency Injection (внедрение зависимостей) — паттерн проектирования, при котором компонент получает свои зависимости извне, а не создаёт их самостоятельно. FastAPI реализует этот паттерн через механизм `Depends()`.

Вместо того чтобы каждый обработчик маршрута самостоятельно создавал подключение к базе данных, проверял токен или читал конфигурацию, всё это выносится в отдельные функции-провайдеры. FastAPI автоматически вызывает их перед обработчиком и передаёт результат в нужный параметр.

Преимущества подхода:

- Повторное использование логики без дублирования кода
- Простота тестирования через замену зависимостей
- Автоматическое управление жизненным циклом ресурсов (соединения с БД, HTTP-клиенты)
- Явное объявление того, что нужно маршруту для работы

## Базовый синтаксис Depends()

Простейшая зависимость — функция, возвращающая значение, которое FastAPI передаёт в маршрут:

```python
from fastapi import FastAPI, Depends

app = FastAPI()

def get_query_limit() -> int:
    return 100

@app.get("/items")
async def get_items(limit: int = Depends(get_query_limit)):
    return {"limit": limit, "items": []}
```

`Depends(get_query_limit)` говорит FastAPI: перед вызовом `get_items` вызови `get_query_limit()` и передай результат в параметр `limit`.

## Зависимости с параметрами из запроса

Зависимости могут принимать параметры из запроса так же, как и сами маршруты. FastAPI анализирует сигнатуру функции-провайдера и автоматически извлекает нужные значения:

```python
from fastapi import FastAPI, Depends, Query

app = FastAPI()

async def pagination_params(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
) -> dict:
    return {"skip": skip, "limit": limit}

@app.get("/users")
async def get_users(pagination: dict = Depends(pagination_params)):
    return {
        "skip": pagination["skip"],
        "limit": pagination["limit"],
        "users": []
    }

@app.get("/products")
async def get_products(pagination: dict = Depends(pagination_params)):
    return {
        "skip": pagination["skip"],
        "limit": pagination["limit"],
        "products": []
    }
```

Функция `pagination_params` переиспользуется в двух маршрутах. Если один и тот же провайдер указан несколько раз в рамках одного запроса, FastAPI вызывает его только один раз и кэширует результат.

## Классы как провайдеры зависимостей

FastAPI поддерживает классы в роли зависимостей. При вызове `Depends(SomeClass)` FastAPI создаёт экземпляр, передавая параметры запроса в `__init__`:

```python
from fastapi import FastAPI, Depends

app = FastAPI()

class FilterParams:
    def __init__(
        self,
        search: str | None = None,
        category: str | None = None,
        min_price: float = 0.0,
        max_price: float = 9999.0
    ):
        self.search = search
        self.category = category
        self.min_price = min_price
        self.max_price = max_price

@app.get("/products")
async def get_products(filters: FilterParams = Depends(FilterParams)):
    return {
        "search": filters.search,
        "category": filters.category,
        "price_range": [filters.min_price, filters.max_price]
    }
```

Современный способ — использовать `Annotated`, чтобы не повторять тип класса дважды:

```python
from typing import Annotated
from fastapi import FastAPI, Depends

app = FastAPI()

FiltersDep = Annotated[FilterParams, Depends()]

@app.get("/products")
async def get_products(filters: FiltersDep):
    return {"search": filters.search}
```

Когда `Depends()` вызывается без аргумента внутри `Annotated`, FastAPI использует сам тип аннотации (`FilterParams`) как провайдер.

## Цепочки зависимостей

Зависимости могут иметь собственные зависимости — FastAPI строит граф и разрешает их в правильном порядке:

```python
from fastapi import FastAPI, Depends, HTTPException, Header

app = FastAPI()

async def get_token(x_token: str = Header(...)) -> str:
    if x_token != "secret-token":
        raise HTTPException(status_code=403, detail="Invalid token")
    return x_token

async def get_current_user(token: str = Depends(get_token)) -> dict:
    return {"id": 1, "name": "Alice", "token": token}

@app.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return user
```

Цепочка выглядит так: FastAPI вызывает `get_token` → получает токен → передаёт в `get_current_user` → получает пользователя → вызывает `get_profile`. Ошибка на любом шаге прерывает выполнение и возвращает соответствующий HTTP-ответ.

## Управление сессиями базы данных

Стандартный паттерн для работы с ORM-сессиями — генератор с `yield`. FastAPI гарантирует выполнение кода после `yield` даже при возникновении исключения:

```python
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

DATABASE_URL = "postgresql://user:password@localhost/dbname"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

Код до `yield` выполняется перед обработчиком (открытие сессии), код после — после завершения запроса (закрытие сессии). Блок `finally` гарантирует закрытие сессии при любом исходе.

## Зависимости на уровне роутера и приложения

Зависимости можно применять не только к отдельным маршрутам, но и ко всему роутеру или приложению целиком:

```python
from fastapi import FastAPI, APIRouter, Depends, Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != "valid-api-key":
        raise HTTPException(status_code=401, detail="Invalid API key")

router = APIRouter(
    prefix="/admin",
    dependencies=[Depends(verify_api_key)]
)

@router.get("/stats")
async def get_stats():
    return {"total_users": 1000}

@router.delete("/cache")
async def clear_cache():
    return {"message": "Cache cleared"}

app = FastAPI()
app.include_router(router)
```

Оба маршрута `/admin/stats` и `/admin/cache` автоматически требуют валидный API-ключ. Для защиты всего приложения:

```python
app = FastAPI(dependencies=[Depends(verify_api_key)])
```

## Кэширование зависимостей

По умолчанию FastAPI кэширует результат зависимости в рамках одного запроса. Если одна зависимость используется в нескольких местах, функция-провайдер вызывается только один раз:

```python
from fastapi import FastAPI, Depends
import uuid

app = FastAPI()

def get_request_id() -> str:
    return str(uuid.uuid4())

def get_logger(request_id: str = Depends(get_request_id)) -> dict:
    return {"logger": f"logger-{request_id}"}

@app.get("/test")
async def test_endpoint(
    request_id: str = Depends(get_request_id),
    logger: dict = Depends(get_logger)
):
    # request_id и logger["logger"] содержат один и тот же UUID
    return {"request_id": request_id, "logger": logger}
```

Если нужно отключить кэширование — передайте `use_cache=False`:

```python
@app.get("/test")
async def test_endpoint(
    id1: str = Depends(get_request_id, use_cache=False),
    id2: str = Depends(get_request_id, use_cache=False)
):
    # id1 и id2 будут разными UUID
    return {"id1": id1, "id2": id2}
```

## Async-зависимости

Зависимости могут быть синхронными и асинхронными. FastAPI обрабатывает оба варианта корректно:

```python
import httpx
from fastapi import FastAPI, Depends

app = FastAPI()

async def get_remote_config() -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get("https://config-service/api/config")
        return response.json()

@app.get("/settings")
async def get_settings(config: dict = Depends(get_remote_config)):
    return config
```

Синхронные зависимости FastAPI выполняет в thread pool, не блокируя event loop. Асинхронные зависимости с `yield` тоже поддерживаются — механизм тот же, что и в примере с базой данных.

## Тестирование с переопределением зависимостей

Одно из главных преимуществ DI — простота тестирования. FastAPI предоставляет `app.dependency_overrides` для замены реальных зависимостей на тестовые заглушки:

```python
from fastapi.testclient import TestClient
from myapp.main import app
from myapp.database import get_db
from myapp.auth import get_current_user

TestingSessionLocal = sessionmaker(bind=test_engine)

def get_db_override():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user_override():
    return {"id": 1, "name": "Test User", "role": "user"}

app.dependency_overrides[get_db] = get_db_override
app.dependency_overrides[get_current_user] = get_current_user_override

client = TestClient(app)

def test_get_profile():
    response = client.get("/profile")
    assert response.status_code == 200
    assert response.json()["name"] == "Test User"
```

Переопределения применяются глобально для данного экземпляра приложения. После тестов их стоит очищать:

```python
def teardown_module():
    app.dependency_overrides.clear()
```

## Практический пример: многоуровневая авторизация

Собираем типичную систему авторизации с разделением ролей:

```python
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

async def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        return {"id": int(user_id), "role": payload.get("role", "user")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def require_admin(
    user: Annotated[dict, Depends(get_current_user)]
) -> dict:
    if user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

CurrentUser = Annotated[dict, Depends(get_current_user)]
AdminUser = Annotated[dict, Depends(require_admin)]

@app.get("/profile")
async def get_profile(user: CurrentUser):
    return user

@app.delete("/users/{user_id}")
async def delete_user(user_id: int, admin: AdminUser):
    return {"message": f"User {user_id} deleted by admin {admin['id']}"}

@app.get("/admin/stats")
async def get_admin_stats(admin: AdminUser):
    return {"total_users": 1000, "requested_by": admin["id"]}
```

Здесь `require_admin` зависит от `get_current_user`, а маршруты используют готовые типы `CurrentUser` и `AdminUser`. Добавить новый защищённый маршрут — одна строка.

## Когда использовать DI, а когда нет

Dependency injection в FastAPI уместен для:

- Подключения к базе данных или внешнему сервису (одно соединение на запрос)
- Извлечения и валидации JWT-токена
- Общих параметров пагинации, фильтрации, сортировки
- Проверки прав доступа
- Получения конфигурации из переменных окружения

Не стоит оборачивать в `Depends()` простую бизнес-логику, которая используется только в одном месте, или синхронные вычисления без побочных эффектов — это усложняет код без реальной пользы.

Изучить FastAPI и Python глубже, включая работу с базами данных, аутентификацию и развёртывание, можно на курсе [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=fastapi-dependency-injection).