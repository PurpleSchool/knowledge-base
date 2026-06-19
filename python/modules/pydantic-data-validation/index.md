---
metaTitle: "Pydantic: валидация данных в Python — полное руководство"
metaDescription: "Pydantic — библиотека для валидации данных в Python. Узнайте как использовать BaseModel, Field, валидаторы и вложенные модели с примерами кода."
author: "Антон Ларичев"
title: "Pydantic: валидация данных в Python"
preview: "Разбираем Pydantic — самую популярную библиотеку для валидации данных в Python: от базовых моделей до кастомных валидаторов и настройки конфигурации."
---

## Что такое Pydantic

Pydantic — это библиотека для валидации данных и управления настройками в Python, основанная на аннотациях типов. Она позволяет описывать структуры данных в виде классов и автоматически проверяет корректность входящих данных при создании объектов.

Pydantic широко используется в:
- веб-фреймворке FastAPI для валидации запросов и ответов;
- конфигурации приложений через переменные окружения;
- десериализации JSON из внешних API;
- ETL-пайплайнах и обработке данных.

В этой статье рассматривается Pydantic v2, который вышел в 2023 году и принёс значительные изменения в API по сравнению с v1.

## Установка

```bash
pip install pydantic
```

Для работы с переменными окружения дополнительно установите:

```bash
pip install pydantic-settings
```

## Базовые модели (BaseModel)

Основной строительный блок Pydantic — класс `BaseModel`. Вы описываете поля модели через аннотации типов, а Pydantic автоматически проверяет типы при создании экземпляра.

```python
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    email: str
    age: int
    is_active: bool = True

user = User(id=1, name="Иван Петров", email="ivan@example.com", age=30)
print(user)
# id=1 name='Иван Петров' email='ivan@example.com' age=30 is_active=True
```

Если передать данные неправильного типа, Pydantic попытается их преобразовать. Если преобразование невозможно — выбросит `ValidationError`:

```python
from pydantic import ValidationError

try:
    user = User(id="не_число", name="Иван", email="ivan@example.com", age=30)
except ValidationError as e:
    print(e)
# 1 validation error for User
# id
#   Input should be a valid integer, unable to parse string as an integer
```

### Сериализация и десериализация

Pydantic умеет создавать модели из словарей и JSON-строк, а также конвертировать их обратно:

```python
data = {"id": 1, "name": "Мария", "email": "maria@example.com", "age": 25}
user = User.model_validate(data)

print(user.model_dump())
# {'id': 1, 'name': 'Мария', 'email': 'maria@example.com', 'age': 25, 'is_active': True}

print(user.model_dump_json())
# {"id":1,"name":"Мария","email":"maria@example.com","age":25,"is_active":true}

json_str = '{"id": 2, "name": "Алексей", "email": "alex@example.com", "age": 35}'
user2 = User.model_validate_json(json_str)
```

## Поле Field

Класс `Field` позволяет задать дополнительные ограничения и метаданные для поля модели.

```python
from pydantic import BaseModel, Field

class Product(BaseModel):
    name: str = Field(min_length=3, max_length=100, description="Название продукта")
    price: float = Field(gt=0, description="Цена в рублях, должна быть положительной")
    quantity: int = Field(ge=0, le=10000, default=0)
    sku: str = Field(pattern=r'^[A-Z]{3}-\d{4}$', description="Артикул формата ABC-1234")

product = Product(name="Ноутбук", price=75000.0, quantity=5, sku="LPT-0042")
print(product)
```

Основные параметры `Field`:

| Параметр | Описание |
|---|---|
| `default` | Значение по умолчанию |
| `default_factory` | Функция для генерации дефолтного значения |
| `min_length` / `max_length` | Ограничения длины строки |
| `gt` / `ge` / `lt` / `le` | Числовые ограничения (больше/не менее/меньше/не более) |
| `pattern` | Regex-паттерн для строк |
| `description` | Описание поля (используется в JSON Schema) |
| `alias` | Альтернативное имя поля при парсинге |

### Псевдонимы полей (alias)

Когда имена полей во внешнем API отличаются от принятого стиля в Python:

```python
from pydantic import BaseModel, Field

class ApiResponse(BaseModel):
    user_id: int = Field(alias="userId")
    full_name: str = Field(alias="fullName")
    created_at: str = Field(alias="createdAt")

    model_config = {"populate_by_name": True}

data = {"userId": 42, "fullName": "Ольга Смирнова", "createdAt": "2024-01-15"}
response = ApiResponse.model_validate(data)
print(response.user_id)  # 42
print(response.full_name)  # Ольга Смирнова
```

## Встроенные типы данных

Pydantic поддерживает широкий набор типов из стандартной библиотеки и предоставляет свои специализированные типы.

```python
from datetime import datetime, date
from typing import Optional, List, Dict, Tuple
from uuid import UUID
from pydantic import BaseModel, EmailStr, HttpUrl

# pip install pydantic[email] для EmailStr

class Order(BaseModel):
    order_id: UUID
    user_email: EmailStr
    website: HttpUrl
    items: List[str]
    metadata: Dict[str, int]
    coordinates: Tuple[float, float]
    delivery_date: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.now)

import uuid

order = Order(
    order_id=uuid.uuid4(),
    user_email="customer@example.com",
    website="https://purpleschool.ru",
    items=["Ноутбук", "Мышь"],
    metadata={"weight": 2, "fragile": 1},
    coordinates=(55.7558, 37.6173),
)
```

## Кастомные валидаторы

Для сложной бизнес-логики валидации используются декораторы `@field_validator` и `@model_validator`.

### Валидатор поля

```python
from pydantic import BaseModel, field_validator, ValidationInfo

class UserRegistration(BaseModel):
    username: str
    password: str
    password_confirm: str
    age: int

    @field_validator("username")
    @classmethod
    def username_must_be_alphanumeric(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError("Имя пользователя должно содержать только буквы и цифры")
        return v.lower()

    @field_validator("age")
    @classmethod
    def age_must_be_adult(cls, v: int) -> int:
        if v < 18:
            raise ValueError("Регистрация доступна только с 18 лет")
        return v

try:
    user = UserRegistration(
        username="ivan123",
        password="secret",
        password_confirm="secret",
        age=15,
    )
except ValidationError as e:
    print(e)
# 1 validation error for UserRegistration
# age
#   Value error, Регистрация доступна только с 18 лет
```

### Валидатор модели

`@model_validator` позволяет проверять несколько полей вместе — например, сверить пароль и его подтверждение:

```python
from pydantic import BaseModel, model_validator
from typing import Self

class UserRegistration(BaseModel):
    username: str
    password: str
    password_confirm: str

    @model_validator(mode="after")
    def passwords_match(self) -> Self:
        if self.password != self.password_confirm:
            raise ValueError("Пароли не совпадают")
        return self

try:
    user = UserRegistration(
        username="ivan",
        password="qwerty123",
        password_confirm="qwerty456",
    )
except ValidationError as e:
    print(e)
# 1 validation error for UserRegistration
# Value error, Пароли не совпадают
```

## Вложенные модели

Pydantic поддерживает вложенность моделей любой глубины:

```python
from pydantic import BaseModel
from typing import List, Optional

class Address(BaseModel):
    street: str
    city: str
    zip_code: str
    country: str = "Россия"

class ContactInfo(BaseModel):
    phone: str
    email: str
    address: Optional[Address] = None

class Company(BaseModel):
    name: str
    inn: str
    contact: ContactInfo
    branches: List[Address] = []

company = Company(
    name="ООО Технологии",
    inn="7712345678",
    contact={
        "phone": "+7-999-123-45-67",
        "email": "info@tech.ru",
        "address": {
            "street": "ул. Тверская, 1",
            "city": "Москва",
            "zip_code": "125009",
        },
    },
)

print(company.contact.address.city)  # Москва
print(company.model_dump())
```

Обратите внимание: вложенные словари Pydantic автоматически конвертирует в соответствующие модели.

## Конфигурация модели

`model_config` позволяет тонко настроить поведение модели:

```python
from pydantic import BaseModel, ConfigDict

class StrictUser(BaseModel):
    model_config = ConfigDict(
        strict=True,               # Запрещает неявное приведение типов
        frozen=True,               # Делает объект иммутабельным
        extra="forbid",            # Запрещает лишние поля
        str_strip_whitespace=True, # Автоматически обрезает пробелы в строках
        validate_default=True,     # Валидирует значения по умолчанию
    )

    name: str
    age: int

try:
    user = StrictUser(name="  Иван  ", age=30, role="admin")
except ValidationError as e:
    print(e)
# 1 validation error for StrictUser
# role
#   Extra inputs are not permitted

user = StrictUser(name="  Мария  ", age=25)
print(user.name)  # "Мария" — пробелы обрезаны

try:
    user.name = "Ольга"  # frozen=True — изменение запрещено
except Exception as e:
    print(e)  # Instance is frozen
```

## Работа с переменными окружения

`pydantic-settings` позволяет загружать конфигурацию приложения из переменных окружения и `.env`-файлов:

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "MyApp"
    debug: bool = False
    database_url: str
    secret_key: str
    max_connections: int = Field(default=10, ge=1, le=100)

settings = AppSettings()
print(settings.database_url)
```

Пример `.env`-файла:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
SECRET_KEY=super-secret-key-here
DEBUG=true
MAX_CONNECTIONS=20
```

## Дискриминированные объединения (Discriminated Unions)

Когда модель может быть одного из нескольких типов, используют дискриминаторы:

```python
from typing import Annotated, Literal, Union
from pydantic import BaseModel, Field

class Cat(BaseModel):
    pet_type: Literal["cat"]
    name: str
    indoor: bool = True

class Dog(BaseModel):
    pet_type: Literal["dog"]
    name: str
    breed: str

class Parrot(BaseModel):
    pet_type: Literal["parrot"]
    name: str
    can_talk: bool

Pet = Annotated[
    Union[Cat, Dog, Parrot],
    Field(discriminator="pet_type")
]

class Owner(BaseModel):
    owner_name: str
    pet: Pet

owner1 = Owner(owner_name="Андрей", pet={"pet_type": "dog", "name": "Шарик", "breed": "Лабрадор"})
owner2 = Owner(owner_name="Елена", pet={"pet_type": "cat", "name": "Мурка"})

print(type(owner1.pet))  # <class '__main__.Dog'>
print(owner1.pet.breed)  # Лабрадор
```

## JSON Schema

Pydantic автоматически генерирует JSON Schema для ваших моделей — это используется в FastAPI для документации Swagger:

```python
import json
from pydantic import BaseModel, Field

class BlogPost(BaseModel):
    """Статья в блоге"""
    title: str = Field(min_length=5, max_length=200, description="Заголовок статьи")
    content: str = Field(min_length=100, description="Текст статьи")
    tags: list[str] = Field(default=[], max_length=10)
    published: bool = False

schema = BlogPost.model_json_schema()
print(json.dumps(schema, ensure_ascii=False, indent=2))
```

Вывод:

```json
{
  "title": "BlogPost",
  "description": "Статья в блоге",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 5,
      "maxLength": 200,
      "description": "Заголовок статьи"
    },
    ...
  },
  "required": ["title", "content"]
}
```

## Практический пример: парсинг ответа внешнего API

Рассмотрим реальный сценарий — получение и валидация данных от стороннего API:

```python
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
import json

class GithubUser(BaseModel):
    login: str
    id: int
    avatar_url: str
    name: Optional[str] = None
    company: Optional[str] = None
    public_repos: int = Field(ge=0)
    followers: int = Field(ge=0)
    created_at: datetime

    @field_validator("login")
    @classmethod
    def login_to_lower(cls, v: str) -> str:
        return v.lower()

class GithubRepo(BaseModel):
    id: int
    name: str
    full_name: str
    private: bool
    description: Optional[str] = None
    stargazers_count: int = Field(alias="stargazers_count", ge=0)
    language: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Симуляция ответа от API
api_response = """
{
    "login": "OctoCat",
    "id": 583231,
    "avatar_url": "https://github.com/images/error/octocat.png",
    "name": "monalisa octocat",
    "company": "GitHub",
    "public_repos": 8,
    "followers": 9000,
    "created_at": "2011-01-25T18:44:36Z"
}
"""

user = GithubUser.model_validate_json(api_response)
print(user.login)       # octocat (приведено к нижнему регистру)
print(user.followers)   # 9000
print(user.created_at)  # 2011-01-25 18:44:36+00:00
```

## Сравнение Pydantic v1 и v2

Если вы работаете с кодом, написанным под Pydantic v1, важно знать ключевые отличия:

| Pydantic v1 | Pydantic v2 |
|---|---|
| `@validator` | `@field_validator` |
| `@root_validator` | `@model_validator` |
| `.dict()` | `.model_dump()` |
| `.json()` | `.model_dump_json()` |
| `from_orm(obj)` | `model_validate(obj)` |
| `parse_raw(json)` | `model_validate_json(json)` |
| `class Config` | `model_config = ConfigDict(...)` |

Pydantic v2 написан на Rust и работает в 5–50 раз быстрее v1 на реальных сценариях.

## Итог

Pydantic — это мощный инструмент, который превращает хрупкую ручную валидацию данных в декларативные, читаемые модели. Ключевые возможности:

- автоматическое приведение типов и валидация через аннотации;
- гибкие ограничения через `Field`;
- кастомные валидаторы на уровне поля и всей модели;
- вложенные модели и дискриминированные объединения;
- сериализация в dict и JSON;
- автоматическая генерация JSON Schema;
- конфигурация приложений через переменные окружения.

Освоив Pydantic, вы получаете надёжную основу для работы с FastAPI, внешними API и любыми данными, которые приходят из ненадёжных источников.

Чтобы углубиться в Python и научиться профессионально разрабатывать веб-приложения с FastAPI и Pydantic, приходите на курс PurpleSchool: https://purpleschool.ru/course/fastapi?utm_source=knowledgebase&utm_medium=text&utm_campaign=pydantic-data-validation