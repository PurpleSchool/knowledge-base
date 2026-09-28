---
metaTitle: "FastAPI JWT аутентификация в Python — руководство"
metaDescription: "Реализация JWT аутентификации в FastAPI: регистрация, выдача токенов, защищённые маршруты, refresh-токены. Практические примеры кода."
author: "Антон Ларичев"
title: "FastAPI с JWT аутентификацией"
preview: "Пошаговое руководство по настройке JWT аутентификации в FastAPI: от установки зависимостей до защищённых маршрутов и refresh-токенов."
---

## Что такое JWT и зачем он нужен

JWT (JSON Web Token) — стандарт для создания токенов доступа, основанный на JSON. Токен состоит из трёх частей: заголовок (header), полезная нагрузка (payload) и подпись (signature), разделённых точками.

При аутентификации через JWT сервер не хранит состояние сессии. Клиент получает токен при входе и передаёт его в каждом запросе. Сервер проверяет подпись и извлекает данные пользователя из payload — без обращения к хранилищу сессий.

FastAPI предоставляет встроенные инструменты для работы с OAuth2 и безопасностью, что делает реализацию JWT-аутентификации компактной и идиоматичной.

## Установка зависимостей

Создайте виртуальное окружение и установите необходимые пакеты:

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn[standard] python-jose[cryptography] passlib[bcrypt] python-multipart
```

Описание пакетов:
- `fastapi` — веб-фреймворк
- `uvicorn` — ASGI-сервер
- `python-jose` — работа с JWT
- `passlib` — хеширование паролей
- `python-multipart` — обработка форм (требуется для `OAuth2PasswordRequestForm`)

## Структура проекта

```
project/
├── main.py
├── auth.py
├── models.py
└── database.py
```

## Настройка конфигурации

Создайте файл `auth.py` с базовыми настройками и вспомогательными функциями:

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
```

В продакшене `SECRET_KEY` должен генерироваться случайным образом и храниться в переменных окружения:

```bash
openssl rand -hex 32
```

## Модели данных

Создайте файл `models.py` с Pydantic-схемами:

```python
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserInDB(UserBase):
    hashed_password: str


class User(UserBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
```

## Хранилище пользователей

Для примера используем словарь в памяти. В реальном приложении замените на работу с базой данных через SQLAlchemy или другой ORM.

Создайте файл `database.py`:

```python
from models import UserInDB

fake_users_db: dict[str, UserInDB] = {}
user_counter: int = 0


def get_user(username: str) -> UserInDB | None:
    return fake_users_db.get(username)


def create_user(username: str, email: str, hashed_password: str) -> UserInDB:
    global user_counter
    user_counter += 1
    user = UserInDB(
        username=username,
        email=email,
        hashed_password=hashed_password,
    )
    fake_users_db[username] = user
    return user
```

## Зависимости FastAPI для аутентификации

В FastAPI зависимости (dependencies) позволяют переиспользовать логику проверки токена в любом эндпоинте. Добавьте в `auth.py`:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from models import TokenData, UserInDB
from database import get_user

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учётные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = get_user(token_data.username)
    if user is None:
        raise credentials_exception
    return user
```

`OAuth2PasswordBearer` автоматически извлекает токен из заголовка `Authorization: Bearer <token>` и добавляет кнопку авторизации в Swagger UI.

## Основное приложение

Создайте файл `main.py`:

```python
from datetime import timedelta
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from database import create_user, get_user
from models import Token, User, UserCreate, UserInDB

app = FastAPI(title="FastAPI JWT Auth")


@app.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    if get_user(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует",
        )
    hashed_password = get_password_hash(user_data.password)
    user = create_user(user_data.username, user_data.email, hashed_password)
    return user


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")


@app.get("/users/me", response_model=User)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user


@app.get("/protected")
async def protected_route(current_user: UserInDB = Depends(get_current_user)):
    return {"message": f"Привет, {current_user.username}! Это защищённый маршрут."}
```

## Запуск и тестирование

Запустите сервер:

```bash
uvicorn main:app --reload
```

Откройте документацию по адресу `http://localhost:8000/docs`. Swagger UI автоматически добавит кнопку «Authorize», где можно ввести логин и пароль для получения токена.

### Тестирование через curl

Регистрация нового пользователя:

```bash
curl -X POST "http://localhost:8000/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "email": "alice@example.com", "password": "secret123"}'
```

Получение токена:

```bash
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=alice&password=secret123"
```

Запрос к защищённому эндпоинту:

```bash
curl "http://localhost:8000/protected" \
  -H "Authorization: Bearer <ваш_токен>"
```

## Добавление Refresh Token

Access-токены намеренно делают короткоживущими. Refresh-токен позволяет получить новый access-токен без повторного ввода пароля.

Добавьте в `auth.py`:

```python
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

Обновите модель токена в `models.py`:

```python
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
```

Обновите эндпоинт `/token` и добавьте эндпоинт обновления в `main.py`:

```python
from auth import create_refresh_token, decode_token


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh = create_refresh_token(data={"sub": user.username})
    return Token(
        access_token=access_token,
        refresh_token=refresh,
        token_type="bearer",
    )


@app.post("/token/refresh", response_model=Token)
async def refresh_access_token(refresh_token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недействительный refresh-токен",
    )
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise credentials_exception
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user(username)
    if user is None:
        raise credentials_exception

    new_access_token = create_access_token(data={"sub": username})
    new_refresh_token = create_refresh_token(data={"sub": username})
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )
```

## Использование переменных окружения

Выносите секретные данные в `.env`-файл:

```bash
pip install python-dotenv
```

Создайте `.env`:

```
SECRET_KEY=super-secret-key-generated-with-openssl
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Обновите начало `auth.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
```

Добавьте `.env` в `.gitignore`, чтобы не передавать секреты в репозиторий.

## Типичные ошибки

### Токен не принимается

Убедитесь, что клиент отправляет заголовок в формате `Authorization: Bearer <token>`, а не `Authorization: Token <token>` или без префикса.

### JWTError: Signature verification failed

Происходит, если `SECRET_KEY` изменился после выдачи токена — например, при перезапуске без переменных окружения. Все ранее выданные токены становятся недействительными.

### 422 Unprocessable Entity на /token

Эндпоинт `/token` принимает данные в формате `application/x-www-form-urlencoded`, а не JSON. Передавайте данные как форму, используя `OAuth2PasswordRequestForm`, а не JSON-тело.

### Истёкший токен возвращает 401

Это ожидаемое поведение. Клиент должен обработать статус 401, автоматически вызвать `/token/refresh` и повторить исходный запрос с новым access-токеном.

---

Чтобы глубже освоить Python и научиться создавать production-ready приложения, пройдите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=fastapi-jwt-authentication