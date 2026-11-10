---
metaTitle: "Pydantic Settings: конфигурация приложений на Python"
metaDescription: "Как использовать pydantic-settings для управления конфигурацией Python-приложений: переменные окружения, .env файлы, валидация и типизация."
author: "Антон Ларичев"
title: "Pydantic Settings — конфигурация приложений на Python"
preview: "Управляем конфигурацией Python-приложений с помощью pydantic-settings: типизация, валидация, .env файлы и работа с несколькими окружениями."
---

## Что такое Pydantic Settings

Pydantic Settings — это библиотека для управления конфигурацией приложений на Python. Она построена поверх Pydantic и позволяет описывать настройки приложения как типизированные модели с автоматической валидацией значений.

Основные возможности:

- загрузка настроек из переменных окружения;
- поддержка `.env` файлов;
- приоритизация источников конфигурации;
- строгая типизация и валидация;
- поддержка вложенных настроек.

С версии Pydantic v2 библиотека выделена в отдельный пакет `pydantic-settings` и устанавливается отдельно.

## Установка

```bash
pip install pydantic-settings
```

Если нужна поддержка `.env` файлов, дополнительных зависимостей не требуется — она встроена.

## Базовая конфигурация

Основа любой конфигурации — класс, унаследованный от `BaseSettings`:

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "My App"
    debug: bool = False
    port: int = 8000
    secret_key: str


settings = Settings()
print(settings.app_name)  # My App
print(settings.port)       # 8000
```

Если переменная окружения `SECRET_KEY` не задана и значение по умолчанию отсутствует, Pydantic выбросит ошибку валидации при создании экземпляра. Это защищает от запуска приложения с неполной конфигурацией.

Pydantic Settings автоматически ищет переменные окружения по имени поля в верхнем регистре. Поле `secret_key` соответствует переменной `SECRET_KEY`.

```bash
export SECRET_KEY="my-super-secret"
export PORT=9000
```

```python
settings = Settings()
print(settings.secret_key)  # my-super-secret
print(settings.port)         # 9000
```

## Работа с .env файлами

Для локальной разработки удобно хранить настройки в `.env` файле:

```env
APP_NAME=PurpleSchool API
DEBUG=true
PORT=8080
SECRET_KEY=dev-secret-key
DATABASE_URL=postgresql://user:pass@localhost/mydb
```

Чтобы `BaseSettings` читал этот файл, нужно указать его в `model_config`:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "My App"
    debug: bool = False
    port: int = 8000
    secret_key: str
    database_url: str


settings = Settings()
```

Можно указать несколько файлов — они будут применяться по очереди, более поздние перекрывают ранние:

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
    )
```

Это удобно: `.env` хранится в репозитории с базовыми значениями, а `.env.local` добавляется в `.gitignore` и содержит секреты разработчика.

## Типизация и валидация

Pydantic Settings поддерживает все типы Pydantic, включая `HttpUrl`, `EmailStr`, `SecretStr` и пользовательские типы.

```python
from pydantic import HttpUrl, SecretStr, EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    api_url: HttpUrl
    admin_email: EmailStr
    database_password: SecretStr
    max_connections: int = 10
    allowed_hosts: list[str] = ["localhost"]
```

`SecretStr` скрывает значение при выводе в логах и `repr`:

```python
settings = Settings(
    api_url="https://api.example.com",
    admin_email="admin@example.com",
    database_password="super-secret",
)

print(settings.database_password)             # **********
print(settings.database_password.get_secret_value())  # super-secret
```

Списки и другие составные типы тоже работают. В переменной окружения значения передаются через запятую:

```bash
ALLOWED_HOSTS=["api.example.com","admin.example.com"]
# или
ALLOWED_HOSTS=api.example.com,admin.example.com
```

## Вложенные настройки

Конфигурацию можно структурировать с помощью вложенных моделей:

```python
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseSettings(BaseModel):
    host: str = "localhost"
    port: int = 5432
    name: str
    user: str
    password: str


class RedisSettings(BaseModel):
    host: str = "localhost"
    port: int = 6379
    db: int = 0


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_nested_delimiter="__",
    )

    app_name: str = "My App"
    database: DatabaseSettings
    redis: RedisSettings
```

Опция `env_nested_delimiter="__"` позволяет задавать вложенные поля через двойное подчёркивание в именах переменных окружения:

```bash
DATABASE__HOST=db.production.com
DATABASE__PORT=5432
DATABASE__NAME=myapp
DATABASE__USER=myuser
DATABASE__PASSWORD=secret

REDIS__HOST=redis.production.com
REDIS__PORT=6380
```

```python
settings = Settings()
print(settings.database.host)  # db.production.com
print(settings.redis.port)     # 6380
```

## Несколько окружений

Распространённая практика — иметь разные файлы конфигурации для окружений `development`, `staging` и `production`.

```python
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


def get_env_file() -> str:
    env = os.getenv("ENVIRONMENT", "development")
    return f".env.{env}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", get_env_file()),
        env_file_encoding="utf-8",
    )

    environment: str = "development"
    debug: bool = False
    database_url: str
    secret_key: str
```

Структура файлов:

```
.env              # базовые значения, в репозитории
.env.development  # настройки для разработки
.env.staging      # настройки для staging
.env.production   # настройки для production
```

Запуск с нужным окружением:

```bash
ENVIRONMENT=production python app.py
```

## Приоритет источников

Pydantic Settings применяет источники конфигурации в определённом порядке (от высшего приоритета к низшему):

1. аргументы, переданные при создании экземпляра (`Settings(debug=True)`);
2. переменные окружения;
3. `.env` файлы;
4. значения по умолчанию в модели.

Это означает, что переменная окружения `DEBUG=false` перекроет значение `debug=True` из `.env` файла, но не перекроет явную передачу `Settings(debug=True)`.

## Кастомизация чтения переменных

Иногда нужно нестандартное поведение при чтении значений. Pydantic Settings позволяет настроить кастомный валидатор:

```python
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    allowed_origins: list[str] = []

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v.startswith(("postgresql", "sqlite", "mysql")):
            raise ValueError("Unsupported database scheme")
        return v

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: str | list) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
```

## Синглтон через lru_cache

Чтобы не создавать объект настроек при каждом обращении, используют кеширование через `lru_cache`:

```python
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    app_name: str = "My App"
    database_url: str
    secret_key: str


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

Теперь вызов `get_settings()` всегда возвращает один и тот же объект. Это особенно важно для приложений с высокой нагрузкой.

## Интеграция с FastAPI

Pydantic Settings идеально сочетается с FastAPI через механизм зависимостей:

```python
from functools import lru_cache
from fastapi import Depends, FastAPI
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    app_name: str = "PurpleSchool API"
    admin_email: str
    items_per_page: int = 20


@lru_cache
def get_settings() -> Settings:
    return Settings()


app = FastAPI()


@app.get("/info")
def app_info(settings: Settings = Depends(get_settings)):
    return {
        "app_name": settings.app_name,
        "admin_email": settings.admin_email,
    }
```

Для тестирования легко подменить зависимость:

```python
from fastapi.testclient import TestClient


def get_test_settings() -> Settings:
    return Settings(app_name="Test App", admin_email="test@test.com")


app.dependency_overrides[get_settings] = get_test_settings

client = TestClient(app)
response = client.get("/info")
assert response.json()["app_name"] == "Test App"
```

## Переменные окружения с префиксом

Если приложение использует несколько сервисов, удобно добавлять префиксы к переменным окружения:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="MYAPP_",
        env_file=".env",
    )

    name: str = "Default"
    debug: bool = False
    port: int = 8000
```

Теперь поля читаются из переменных `MYAPP_NAME`, `MYAPP_DEBUG`, `MYAPP_PORT`. Это исключает конфликты имён при использовании нескольких приложений в одном окружении.

## Итог

Pydantic Settings решает типичные проблемы управления конфигурацией:

- защищает от запуска с неполными настройками благодаря обязательным полям;
- исключает ошибки типов, автоматически приводя строковые переменные окружения к нужным типам;
- скрывает секреты в логах через `SecretStr`;
- упрощает переключение между окружениями;
- легко интегрируется с FastAPI и другими фреймворками.

Использование `BaseSettings` вместо ручного чтения `os.environ` — это стандарт для Python-проектов, где важна надёжность и предсказуемость конфигурации.

Чтобы глубже освоить Python и научиться писать production-ready приложения, посмотрите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-pydantic-settings