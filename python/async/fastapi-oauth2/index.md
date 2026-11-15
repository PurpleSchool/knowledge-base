---
metaTitle: "OAuth2 аутентификация в FastAPI с JWT токенами"
metaDescription: "Полное руководство по реализации OAuth2 аутентификации в FastAPI с использованием JWT токенов, паролей и защиты маршрутов."
author: "Антон Ларичев"
title: "OAuth2 аутентификация в FastAPI"
preview: "Как реализовать OAuth2 аутентификацию в FastAPI с JWT токенами: от настройки до защиты маршрутов."
---

OAuth2 — стандартный протокол авторизации, который используется в большинстве современных веб-приложений. FastAPI предоставляет встроенные инструменты для реализации OAuth2 с минимальным количеством кода. В этой статье разберём реализацию OAuth2 Password Flow с JWT токенами — наиболее распространённый подход для API-приложений.

## Что такое OAuth2 Password Flow

OAuth2 определяет несколько сценариев (flow) получения токенов доступа. Password Flow подходит для случаев, когда приложение полностью доверяет клиенту (например, собственный мобильный или веб-клиент). Схема работы:

1. Клиент отправляет логин и пароль пользователя на эндпоинт `/token`
2. Сервер проверяет учётные данные и возвращает JWT токен
3. Клиент передаёт токен в заголовке `Authorization: Bearer <token>` при каждом запросе
4. Сервер проверяет токен и идентифицирует пользователя

## Установка зависимостей

Для работы с OAuth2 и JWT в FastAPI потребуется несколько пакетов:

```bash
pip install fastapi uvicorn python-jose[cryptography] passlib[bcrypt] python-multipart
```

- `python-jose` — создание и проверка JWT токенов
- `passlib` — хеширование паролей через bcrypt
- `python-multipart` — обработка form data (необходима для OAuth2 форм)

## Настройка хеширования паролей

Хранить пароли в открытом виде нельзя. Настроим хеширование через bcrypt:

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

`CryptContext` автоматически обновляет хеши при смене алгоритма — это значение параметра `deprecated="auto"`.

## Модели данных

Определим Pydantic-схемы для пользователей и токенов:

```python
from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
```

`UserInDB` расширяет `User` полем `hashed_password` — его никогда не возвращаем клиенту, только используем внутри сервера.

## Настройка JWT

JWT (JSON Web Token) — самодостаточный токен, содержащий данные о пользователе и подписанный секретным ключом:

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt

SECRET_KEY = "your-secret-key-change-in-production-use-openssl-rand-hex-32"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

В реальном проекте секретный ключ должен храниться в переменных окружения. Сгенерировать надёжный ключ: `openssl rand -hex 32`.

## Хранилище пользователей

Для примера используем словарь. В реальном приложении замените на работу с базой данных:

```python
fake_users_db = {
    "johndoe": {
        "username": "johndoe",
        "full_name": "John Doe",
        "email": "johndoe@example.com",
        "hashed_password": get_password_hash("secret"),
        "disabled": False,
    },
    "alice": {
        "username": "alice",
        "full_name": "Alice Wonderland",
        "email": "alice@example.com",
        "hashed_password": get_password_hash("secret2"),
        "disabled": True,
    },
}

def get_user(db: dict, username: str) -> Optional[UserInDB]:
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)
    return None

def authenticate_user(db: dict, username: str, password: str) -> Optional[UserInDB]:
    user = get_user(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
```

## Схема OAuth2 в FastAPI

FastAPI предоставляет класс `OAuth2PasswordBearer`, который извлекает токен из заголовка `Authorization`:

```python
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
```

`tokenUrl="token"` указывает, по какому пути клиент должен получать токен. FastAPI использует это для автоматической генерации документации Swagger.

## Зависимость для получения текущего пользователя

Создадим зависимость, которая проверяет токен и возвращает текущего пользователя:

```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учётные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь деактивирован"
        )
    return current_user
```

Цепочка зависимостей работает так: `get_current_active_user` → `get_current_user` → `oauth2_scheme`. FastAPI автоматически разрешает эту цепочку при каждом запросе.

## Эндпоинт выдачи токена

```python
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")
```

`OAuth2PasswordRequestForm` автоматически разбирает form data с полями `username` и `password`. Поле `sub` (subject) в JWT — стандартный идентификатор субъекта токена.

## Защищённые маршруты

Теперь создадим маршруты, доступные только авторизованным пользователям:

```python
@app.get("/users/me", response_model=User)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
) -> User:
    return current_user

@app.get("/users/me/items")
async def read_own_items(
    current_user: User = Depends(get_current_active_user)
) -> list:
    return [
        {"item_id": "Foo", "owner": current_user.username}
    ]
```

Любой маршрут с `Depends(get_current_active_user)` автоматически требует валидный JWT токен.

## Полный файл приложения

Соберём всё вместе в `main.py`:

```python
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
app = FastAPI()

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

fake_users_db = {
    "johndoe": {
        "username": "johndoe",
        "full_name": "John Doe",
        "email": "johndoe@example.com",
        "hashed_password": pwd_context.hash("secret"),
        "disabled": False,
    }
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_user(db: dict, username: str) -> Optional[UserInDB]:
    if username in db:
        return UserInDB(**db[username])
    return None

def authenticate_user(db: dict, username: str, password: str) -> Optional[UserInDB]:
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учётные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Пользователь деактивирован")
    return current_user

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token, token_type="bearer")

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)) -> User:
    return current_user
```

## Тестирование через Swagger UI

Запустите приложение:

```bash
uvicorn main:app --reload
```

Откройте `http://localhost:8000/docs`. FastAPI автоматически добавляет кнопку `Authorize` в Swagger UI, которая позволяет:

1. Ввести `username: johndoe` и `password: secret`
2. Получить токен автоматически
3. Выполнять запросы к защищённым эндпоинтам прямо из документации

Тестирование через curl:

```bash
# Получение токена
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=johndoe&password=secret"

# Запрос к защищённому маршруту
curl -X GET "http://localhost:8000/users/me" \
  -H "Authorization: Bearer <полученный_токен>"
```

## Работа с базой данных

В реальном приложении пользователей хранят в БД. Пример с SQLAlchemy и async-сессией:

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def get_user_from_db(
    db: AsyncSession,
    username: str
) -> Optional[UserInDB]:
    result = await db.execute(
        select(UserModel).where(UserModel.username == username)
    )
    user = result.scalar_one_or_none()
    if user is None:
        return None
    return UserInDB(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        disabled=user.disabled,
        hashed_password=user.hashed_password
    )

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    # ... логика проверки токена ...
    user = await get_user_from_db(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user
```

## Refresh токены

Для длительных сессий используют пару токенов: короткоживущий access token и долгоживущий refresh token:

```python
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_refresh_token(data: dict) -> str:
    return create_access_token(
        data=data,
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

@app.post("/token/refresh", response_model=Token)
async def refresh_access_token(refresh_token: str) -> Token:
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Невалидный токен")
    except JWTError:
        raise HTTPException(status_code=401, detail="Невалидный токен")
    
    new_access_token = create_access_token(
        data={"sub": username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=new_access_token, token_type="bearer")
```

Refresh токены рекомендуется хранить в базе данных и инвалидировать при выходе пользователя из системы.

## Разграничение прав доступа (Scopes)

FastAPI поддерживает OAuth2 scopes для гранулярного управления доступом:

```python
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from fastapi import Security

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="token",
    scopes={"me": "Данные текущего пользователя", "items": "Доступ к элементам"}
)

async def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2_scheme)
) -> User:
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учётные данные",
        headers={"WWW-Authenticate": authenticate_value},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_scopes = payload.get("scopes", [])
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    for scope in security_scopes.scopes:
        if scope not in token_scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав: требуется scope '{scope}'"
            )
    
    return get_user(fake_users_db, username=token_data.username)

@app.get("/users/me", response_model=User)
async def read_users_me(
    current_user: User = Security(get_current_user, scopes=["me"])
) -> User:
    return current_user
```

## Итоги

FastAPI делает реализацию OAuth2 простой и безопасной благодаря встроенным инструментам:

- `OAuth2PasswordBearer` — автоматическое извлечение токена из заголовков
- `OAuth2PasswordRequestForm` — парсинг формы логина
- Система зависимостей (`Depends`) — переиспользуемая логика аутентификации
- Автоматическая Swagger документация с поддержкой авторизации

Ключевые моменты безопасности: никогда не храните пароли в открытом виде, используйте переменные окружения для секретных ключей, устанавливайте разумное время жизни токенов и всегда используйте HTTPS в production.

Для углублённого изучения Python и создания production-ready приложений смотрите курс [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-fastapi-oauth2).