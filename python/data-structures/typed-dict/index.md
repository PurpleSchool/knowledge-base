---
metaTitle: "Python TypedDict: типизированные словари с примерами"
metaDescription: "TypedDict в Python — как объявлять, наследовать и использовать типизированные словари. Практические примеры с mypy и аннотациями типов."
author: "Антон Ларичев"
title: "TypedDict в Python: типизированные словари"
preview: "TypedDict позволяет объявить структуру словаря со строго типизированными ключами, не теряя совместимость с обычным dict."
---

## Что такое TypedDict

Python-словари (`dict`) по умолчанию не несут никакой информации о том, какие ключи в них хранятся и какого типа их значения. Статические анализаторы вроде mypy или pyright не могут проверить корректность обращения к таким словарям, а IDE не подскажет автодополнение.

`TypedDict` — механизм из модуля `typing` (и `typing_extensions` для старых версий Python), который позволяет описать схему словаря: какие ключи обязательны, какие необязательны, и какого типа каждое значение. На уровне интерпретатора такой словарь остаётся обычным `dict` — никакой дополнительной памяти или overhead-а. Вся проверка происходит только статически.

```python
from typing import TypedDict

class User(TypedDict):
    id: int
    name: str
    email: str
```

Теперь mypy знает, что `user["id"]` — это `int`, а попытка обратиться к `user["phone"]` будет помечена как ошибка.

## Синтаксис объявления

Есть два равнозначных способа создать `TypedDict`.

### Класс-наследник TypedDict

```python
from typing import TypedDict

class Product(TypedDict):
    sku: str
    price: float
    in_stock: bool
```

Этот стиль предпочтителен: он хорошо читается, поддерживает наследование и работает с большинством инструментов.

### Функциональный синтаксис

```python
from typing import TypedDict

Product = TypedDict("Product", {"sku": str, "price": float, "in_stock": bool})
# или через keyword-аргументы
Product = TypedDict("Product", sku=str, price=float, in_stock=bool)
```

Функциональный синтаксис нужен, когда имя ключа совпадает с зарезервированным словом Python (например, `class` или `return`). В остальных случаях класс-наследник чище.

## Использование TypedDict

```python
from typing import TypedDict

class Point(TypedDict):
    x: float
    y: float

def distance(p: Point) -> float:
    return (p["x"] ** 2 + p["y"] ** 2) ** 0.5

origin: Point = {"x": 0.0, "y": 0.0}
print(distance(origin))  # 0.0

point: Point = {"x": 3.0, "y": 4.0}
print(distance(point))  # 5.0
```

Можно передавать `TypedDict` туда, где ожидается `dict[str, Any]` — обратная совместимость полная. Но `dict[str, Any]` нельзя передать туда, где ожидается конкретный `TypedDict` без явного приведения типа.

## Обязательные и необязательные поля

По умолчанию все поля `TypedDict` считаются обязательными. Если при создании словаря пропустить хотя бы одно — mypy выдаст ошибку.

### total=False: все поля необязательные

```python
from typing import TypedDict

class UserPatch(TypedDict, total=False):
    name: str
    email: str
    age: int

patch: UserPatch = {"email": "new@example.com"}  # OK
```

Параметр `total=False` делает все поля необязательными сразу. Это удобно для PATCH-запросов, настроек с дефолтами и любых частичных обновлений.

### Смешивание обязательных и необязательных полей

Чтобы иметь и обязательные, и необязательные поля в одном `TypedDict`, используют наследование:

```python
from typing import TypedDict

class UserBase(TypedDict):
    id: int
    name: str

class UserOptional(TypedDict, total=False):
    age: int
    bio: str

class User(UserBase, UserOptional):
    pass

user: User = {"id": 1, "name": "Alice"}                  # OK
user_full: User = {"id": 2, "name": "Bob", "age": 30}    # OK
```

Начиная с Python 3.11 появился аннотатор `Required` / `NotRequired`, который позволяет указывать обязательность прямо на уровне поля:

```python
from typing import TypedDict, NotRequired, Required

class Config(TypedDict, total=False):
    host: Required[str]   # обязательно, несмотря на total=False
    port: int             # необязательно
    debug: NotRequired[bool]  # явно необязательно
```

Это самый выразительный способ — не нужно разбивать описание на несколько классов.

## Наследование TypedDict

`TypedDict` поддерживает одиночное и множественное наследование от других `TypedDict`:

```python
from typing import TypedDict

class Address(TypedDict):
    street: str
    city: str
    country: str

class Company(TypedDict):
    name: str
    inn: str

class CompanyWithAddress(Company, Address):
    pass

contractor: CompanyWithAddress = {
    "name": "Рога и копыта",
    "inn": "1234567890",
    "street": "ул. Пушкина",
    "city": "Москва",
    "country": "Россия",
}
```

При наследовании дочерний тип содержит все поля родительских. Нельзя переопределить поле с несовместимым типом — mypy это запрещает.

## Вложенные TypedDict

Python не ограничивает глубину вложенности:

```python
from typing import TypedDict

class Coordinates(TypedDict):
    lat: float
    lon: float

class City(TypedDict):
    name: str
    population: int
    center: Coordinates

city: City = {
    "name": "Москва",
    "population": 12_500_000,
    "center": {"lat": 55.7558, "lon": 37.6173},
}

print(city["center"]["lat"])  # 55.7558
```

Mypy знает типы на каждом уровне вложенности и проверит их все.

## Работа с TypedDict в функциях

### Передача и возврат

```python
from typing import TypedDict

class Order(TypedDict):
    order_id: str
    amount: float
    currency: str

def format_order(order: Order) -> str:
    return f"#{order['order_id']}: {order['amount']} {order['currency']}"

def make_order(order_id: str, amount: float) -> Order:
    return {"order_id": order_id, "amount": amount, "currency": "RUB"}

order = make_order("ORD-001", 1500.0)
print(format_order(order))  # #ORD-001: 1500.0 RUB
```

### Работа с get() и pop()

Обращение через `get()` возвращает `Optional` от типа поля. Mypy отслеживает это корректно:

```python
from typing import TypedDict

class Config(TypedDict, total=False):
    timeout: int
    retries: int

def apply_config(cfg: Config) -> None:
    timeout = cfg.get("timeout", 30)  # тип: int
    retries = cfg.get("retries", 3)   # тип: int
    print(f"timeout={timeout}, retries={retries}")
```

### isinstance-проверки не работают

Поскольку `TypedDict` — это только аннотация, `isinstance(data, User)` вызовет `TypeError` в runtime. Для runtime-валидации используют библиотеки вроде `pydantic` или пишут явную валидацию вручную.

```python
# Это вызовет ошибку:
# isinstance(data, User)  # TypeError: Subscripted generics cannot be used with class and instance checks

# Правильно — проверять наличие ключей вручную:
def is_valid_user(data: dict) -> bool:
    return (
        isinstance(data.get("id"), int)
        and isinstance(data.get("name"), str)
    )
```

## TypedDict и JSON

Один из самых частых сценариев — описание структуры JSON-ответов API:

```python
import json
from typing import TypedDict

class GithubRepo(TypedDict):
    id: int
    name: str
    full_name: str
    private: bool
    html_url: str
    description: str | None
    stargazers_count: int
    forks_count: int

def parse_repo(raw: str) -> GithubRepo:
    data: GithubRepo = json.loads(raw)
    return data

raw_json = '{"id": 1, "name": "my-repo", "full_name": "user/my-repo", "private": false, "html_url": "https://github.com/user/my-repo", "description": null, "stargazers_count": 42, "forks_count": 5}'
repo = parse_repo(raw_json)
print(repo["stargazers_count"])  # 42
```

Mypy проверит все обращения к полям, но не проверит реальное содержимое JSON — это зона ответственности разработчика или runtime-валидатора.

## TypedDict и списки

```python
from typing import TypedDict

class Tag(TypedDict):
    id: int
    label: str

class Article(TypedDict):
    title: str
    body: str
    tags: list[Tag]

article: Article = {
    "title": "TypedDict в Python",
    "body": "...",
    "tags": [
        {"id": 1, "label": "python"},
        {"id": 2, "label": "typing"},
    ],
}

for tag in article["tags"]:
    print(tag["label"])  # mypy знает, что label — str
```

## Сравнение с dataclass и NamedTuple

| Критерий | TypedDict | dataclass | NamedTuple |
|---|---|---|---|
| Runtime-тип | `dict` | кастомный класс | кортеж |
| Совместимость с dict API | полная | нет | нет |
| Атрибутный доступ | нет (`obj["key"]`) | да (`obj.key`) | да (`obj.key`) |
| Runtime-валидация | нет | нет (по умолчанию) | нет |
| Сериализация в JSON | тривиальная | нужен конвертер | нужен конвертер |
| Изменяемость | изменяемый | изменяемый | неизменяемый |
| Наследование | да | да | ограниченное |

`TypedDict` побеждает там, где данные уже приходят в виде словарей — из JSON, из конфигов, из БД. Если данные создаются программно и нужен полноценный ООП-объект — лучше `dataclass`.

## Практический пример: типизация конфига приложения

```python
from typing import TypedDict, NotRequired
import json
import os

class DatabaseConfig(TypedDict):
    host: str
    port: int
    name: str
    user: str
    password: str

class LoggingConfig(TypedDict):
    level: str
    format: NotRequired[str]

class AppConfig(TypedDict):
    debug: bool
    database: DatabaseConfig
    logging: LoggingConfig
    allowed_hosts: list[str]

def load_config(path: str) -> AppConfig:
    with open(path) as f:
        cfg: AppConfig = json.load(f)
    return cfg

def get_db_url(cfg: AppConfig) -> str:
    db = cfg["database"]
    return f"postgresql://{db['user']}:{db['password']}@{db['host']}:{db['port']}/{db['name']}"

# Пример конфига (config.json):
# {
#   "debug": true,
#   "database": {
#     "host": "localhost",
#     "port": 5432,
#     "name": "myapp",
#     "user": "admin",
#     "password": "secret"
#   },
#   "logging": {"level": "INFO"},
#   "allowed_hosts": ["localhost", "127.0.0.1"]
# }
```

## Совместимость версий Python

- Python 3.8+: `TypedDict` доступен из `typing`
- Python 3.9+: можно использовать `list[str]` вместо `List[str]` в аннотациях
- Python 3.10+: поддерживается синтаксис `str | None` вместо `Optional[str]`
- Python 3.11+: добавлены `Required` и `NotRequired`

Для Python 3.7 и ниже используйте `typing_extensions`:

```python
try:
    from typing import TypedDict, NotRequired, Required
except ImportError:
    from typing_extensions import TypedDict, NotRequired, Required
```

## Проверка типов с mypy

Для запуска проверки:

```bash
pip install mypy
mypy your_file.py
```

Пример ошибок, которые поймает mypy:

```python
from typing import TypedDict

class User(TypedDict):
    id: int
    name: str

user: User = {"id": "not_an_int", "name": "Alice"}  # error: str не int
user2: User = {"id": 1}                              # error: пропущен ключ name
print(user["phone"])                                 # error: ключ phone не существует
```

Все три ошибки mypy поймает до запуска программы, что существенно снижает количество дефектов в production.

## Итоги

`TypedDict` — минималистичный инструмент для добавления статической типизации к словарям без изменения их runtime-поведения. Он особенно полезен при работе с JSON API, конфигурационными файлами и любыми данными, которые уже представлены в виде `dict`. Используйте `total=False` и `NotRequired` для необязательных полей, наследование для переиспользования схем, и mypy для автоматической проверки корректности.

Чтобы глубже разобраться с типизацией и другими возможностями Python, приходите на курс [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-typeddict).