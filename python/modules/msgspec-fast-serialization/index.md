---
metaTitle: "Python msgspec: быстрая сериализация и валидация"
metaDescription: "Разбираем msgspec — библиотеку для сверхбыстрой сериализации JSON и MessagePack в Python с поддержкой типизации и валидации."
author: "Антон Ларичев"
title: "Python msgspec: быстрая сериализация данных"
preview: "Как использовать msgspec для сериализации и валидации данных в Python: Struct, JSON, MessagePack и сравнение с Pydantic."
---

## Что такое msgspec

`msgspec` — это библиотека для Python, написанная на C, которая обеспечивает высокопроизводительную сериализацию/десериализацию JSON и MessagePack, а также встроенную валидацию данных на основе Python-аннотаций типов. Она позиционируется как более быстрая и лёгкая альтернатива Pydantic и `dataclasses` для сценариев, где критична производительность.

Главная особенность msgspec — скорость. Библиотека реализована в виде C-расширения, что позволяет ей на порядок обгонять чистый Python-код и значительно превосходить такие решения, как Pydantic v1 и даже стандартный `json` модуль в ряде сценариев.

## Установка

```bash
pip install msgspec
```

Библиотека не имеет обязательных зависимостей — устанавливается один C-пакет.

## Основная абстракция: Struct

Центральным элементом msgspec является класс `Struct` — аналог `dataclass` или Pydantic `BaseModel`, но значительно быстрее. Он создаётся через наследование:

```python
import msgspec

class User(msgspec.Struct):
    id: int
    name: str
    email: str
    is_active: bool = True
```

Объект `Struct` создаётся так же, как обычный класс:

```python
user = User(id=1, name="Alice", email="alice@example.com")
print(user)  # User(id=1, name='Alice', email='alice@example.com', is_active=True)
print(user.id)  # 1
```

По умолчанию `Struct`-объекты иммутабельны. Если нужна мутабельность, передайте `frozen=False`:

```python
class MutableUser(msgspec.Struct, frozen=False):
    id: int
    name: str

user = MutableUser(id=1, name="Bob")
user.name = "Robert"  # OK
```

## Сериализация в JSON

Для работы с JSON используется `msgspec.json.encode` и `msgspec.json.decode`:

```python
import msgspec
import msgspec.json

class Product(msgspec.Struct):
    id: int
    title: str
    price: float
    in_stock: bool = True

# Сериализация объекта в байты
product = Product(id=42, title="Клавиатура", price=3999.99)
data = msgspec.json.encode(product)
print(data)  # b'{"id":42,"title":"\u041a\u043b\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0430","price":3999.99,"in_stock":true}'

# Десериализация байтов обратно в объект
restored = msgspec.json.decode(data, type=Product)
print(restored)  # Product(id=42, title='Клавиатура', price=3999.99, in_stock=True)
```

Обратите внимание: `encode` возвращает `bytes`, а не `str`. Если нужна строка:

```python
json_str = msgspec.json.encode(product).decode()
```

### Работа с примитивными типами и коллекциями

msgspec умеет кодировать не только `Struct`, но и стандартные Python-типы:

```python
import msgspec.json

# Простые типы
print(msgspec.json.encode({"key": "value", "count": 10}))  # b'{"key":"value","count":10}'
print(msgspec.json.encode([1, 2, 3]))  # b'[1,2,3]'
print(msgspec.json.encode(None))  # b'null'

# Декодирование без явного типа — возвращает dict/list/str/int/...
result = msgspec.json.decode(b'{"x": 1}')
print(result)  # {'x': 1}
print(type(result))  # <class 'dict'>
```

## Валидация при десериализации

Одна из ключевых возможностей msgspec — валидация данных «на лету» во время декодирования. Если входные данные не соответствуют объявленным типам, выбрасывается исключение `msgspec.ValidationError`:

```python
import msgspec
import msgspec.json

class Order(msgspec.Struct):
    order_id: int
    amount: float
    status: str

# Корректные данные
good_json = b'{"order_id": 1, "amount": 150.0, "status": "pending"}'
order = msgspec.json.decode(good_json, type=Order)
print(order)  # Order(order_id=1, amount=150.0, status='pending')

# Неверный тип поля
bad_json = b'{"order_id": "not_a_number", "amount": 150.0, "status": "pending"}'
try:
    msgspec.json.decode(bad_json, type=Order)
except msgspec.ValidationError as e:
    print(e)  # Expected `int`, got `str` - at `$.order_id`

# Отсутствующее обязательное поле
missing_json = b'{"order_id": 1, "amount": 150.0}'
try:
    msgspec.json.decode(missing_json, type=Order)
except msgspec.ValidationError as e:
    print(e)  # Object missing required field `status` - at `$`
```

Сообщения об ошибках содержат путь до проблемного поля в формате `$.<field>`, что удобно при отладке вложенных структур.

## Вложенные структуры и типы

msgspec поддерживает произвольную вложенность `Struct`-объектов, а также стандартные контейнерные типы из `typing`:

```python
from typing import Optional, List
import msgspec
import msgspec.json

class Address(msgspec.Struct):
    city: str
    street: str
    zip_code: Optional[str] = None

class Customer(msgspec.Struct):
    id: int
    name: str
    address: Address
    tags: List[str] = []

customer = Customer(
    id=10,
    name="Иван Петров",
    address=Address(city="Москва", street="Ленина, 1"),
    tags=["vip", "regular"]
)

encoded = msgspec.json.encode(customer)
print(encoded)
# b'{"id":10,"name":"..." "address":{"city":"...","street":"...","zip_code":null},"tags":["vip","regular"]}'

decoded = msgspec.json.decode(encoded, type=Customer)
print(decoded.address.city)  # Москва
```

### Поддерживаемые типы аннотаций

msgspec поддерживает широкий набор типов:

- Примитивы: `int`, `float`, `str`, `bool`, `None`
- Коллекции: `list`, `tuple`, `set`, `frozenset`, `dict`
- Параметризованные: `List[T]`, `Dict[K, V]`, `Tuple[T, ...]`
- Опциональные: `Optional[T]` (эквивалент `T | None`)
- Перечисления: `enum.Enum`, `enum.IntEnum`
- Дата и время: `datetime.datetime`, `datetime.date`, `datetime.time`
- `UUID`, `decimal.Decimal`
- `Literal[...]` для ограниченных значений
- `Union[A, B]` для полиморфных полей

```python
from typing import Literal, Union
import enum
import datetime
import msgspec

class Status(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class Event(msgspec.Struct):
    event_type: Literal["click", "view", "purchase"]
    status: Status
    created_at: datetime.datetime
    metadata: Union[str, int, None] = None

import msgspec.json
json_data = b'{"event_type": "click", "status": "active", "created_at": "2024-01-15T10:30:00"}'
event = msgspec.json.decode(json_data, type=Event)
print(event.status)     # Status.ACTIVE
print(event.created_at) # 2024-01-15 10:30:00
```

## Настройка полей с помощью field()

Для более тонкой настройки отдельных полей используется `msgspec.field()`:

```python
import msgspec

class Config(msgspec.Struct):
    host: str = msgspec.field(default="localhost")
    port: int = msgspec.field(default=8080)
    # rename задаёт имя ключа при сериализации
    api_key: str = msgspec.field(default="", name="apiKey")

import msgspec.json
cfg = Config()
print(msgspec.json.encode(cfg))
# b'{"host":"localhost","port":8080,"apiKey":""}'
```

Параметр `name` позволяет использовать camelCase-ключи в JSON при сохранении snake_case-имён полей в Python-коде.

## Encoder и Decoder: переиспользуемые объекты

Для высоконагруженных сценариев рекомендуется создавать объекты `Encoder` и `Decoder` один раз и переиспользовать их. Это позволяет избежать накладных расходов на инициализацию:

```python
import msgspec
import msgspec.json

class LogEntry(msgspec.Struct):
    level: str
    message: str
    timestamp: float

# Создаём один раз при старте приложения
encoder = msgspec.json.Encoder()
decoder = msgspec.json.Decoder(LogEntry)

# Переиспользуем многократно
entry = LogEntry(level="INFO", message="Сервер запущен", timestamp=1700000000.0)
data = encoder.encode(entry)
restored = decoder.decode(data)
```

При обработке тысяч сообщений в секунду это даёт заметный прирост производительности.

## Сериализация в MessagePack

msgspec поддерживает MessagePack — бинарный формат сериализации, который компактнее и быстрее JSON:

```python
import msgspec
import msgspec.msgpack

class Metric(msgspec.Struct):
    name: str
    value: float
    labels: dict

metric = Metric(
    name="cpu_usage",
    value=78.5,
    labels={"host": "server-01", "env": "prod"}
)

# Кодирование в бинарный формат
binary = msgspec.msgpack.encode(metric)
print(len(binary))  # меньше, чем JSON

# Декодирование
restored = msgspec.msgpack.decode(binary, type=Metric)
print(restored.name)   # cpu_usage
print(restored.value)  # 78.5
```

MessagePack особенно полезен для межсервисного взаимодействия, кэширования в Redis или передачи данных по брокерам сообщений.

## Конвертация в dict и обратно

Для интеграции с кодом, ожидающим обычные словари, используйте `msgspec.structs.asdict` и `msgspec.convert`:

```python
import msgspec
import msgspec.structs

class Point(msgspec.Struct):
    x: float
    y: float

p = Point(x=1.0, y=2.5)

# Struct -> dict
d = msgspec.structs.asdict(p)
print(d)  # {'x': 1.0, 'y': 2.5}

# dict -> Struct (с валидацией)
restored = msgspec.convert({"x": 3.0, "y": 4.0}, Point)
print(restored)  # Point(x=3.0, y=4.0)

# Неверный тип — ValidationError
try:
    msgspec.convert({"x": "not_a_float", "y": 4.0}, Point)
except msgspec.ValidationError as e:
    print(e)  # Expected `float`, got `str` - at `$.x`
```

## Сравнение с Pydantic

msgspec и Pydantic решают схожие задачи, но с разными приоритетами:

| Критерий | msgspec | Pydantic v2 |
|---|---|---|
| Скорость JSON | Быстрее | Чуть медленнее |
| Потребление памяти | Минимальное | Выше |
| Валидация | Базовая | Расширенная |
| Кастомные валидаторы | Ограничены | Полная поддержка |
| Зависимости | Нет | Есть (pydantic-core) |
| Интеграция с FastAPI | Не нативная | Нативная |
| MessagePack | Есть | Нет |

msgspec выигрывает там, где важна скорость и минимализм: парсинг большого числа событий, обработка потоков данных, высокочастотные API. Pydantic предпочтительнее, когда нужна сложная бизнес-валидация, интеграция с FastAPI/Django или богатая экосистема плагинов.

Пример использования msgspec в FastAPI-подобном контексте:

```python
from typing import List
import msgspec
import msgspec.json

class CreateUserRequest(msgspec.Struct):
    username: str
    email: str
    age: int

class UserResponse(msgspec.Struct):
    id: int
    username: str
    email: str

decoder = msgspec.json.Decoder(CreateUserRequest)
encoder = msgspec.json.Encoder()

def handle_create_user(body: bytes) -> bytes:
    try:
        req = decoder.decode(body)
    except msgspec.ValidationError as e:
        return msgspec.json.encode({"error": str(e)})

    # Бизнес-логика...
    user = UserResponse(id=100, username=req.username, email=req.email)
    return encoder.encode(user)
```

## Практический пример: парсинг потока событий

Рассмотрим сценарий обработки потока JSON-событий:

```python
from typing import List, Optional, Literal, Union
import msgspec
import msgspec.json

class ClickEvent(msgspec.Struct, tag="click"):
    user_id: int
    element_id: str
    timestamp: float

class PageViewEvent(msgspec.Struct, tag="page_view"):
    user_id: int
    url: str
    timestamp: float
    referrer: Optional[str] = None

# Union с тегированием — msgspec сам определит нужный тип по полю "type"
Event = Union[ClickEvent, PageViewEvent]

decoder = msgspec.json.Decoder(List[Event])

events_json = b'''
[
    {"type": "click", "user_id": 1, "element_id": "btn-buy", "timestamp": 1700000001.0},
    {"type": "page_view", "user_id": 2, "url": "/products", "timestamp": 1700000002.0}
]
'''

events = decoder.decode(events_json)
for event in events:
    if isinstance(event, ClickEvent):
        print(f"Клик по {event.element_id} от пользователя {event.user_id}")
    elif isinstance(event, PageViewEvent):
        print(f"Просмотр {event.url} пользователем {event.user_id}")
```

Параметр `tag` в декларации `Struct` указывает, что поле `type` в JSON используется для определения конкретного типа при декодировании `Union`.

## Итоги

msgspec — отличный выбор для Python-разработчиков, которым нужна быстрая и предсказуемая работа с данными:

- Высокая скорость за счёт C-реализации без тяжёлых зависимостей
- Встроенная валидация на основе аннотаций типов с понятными сообщениями об ошибках
- Поддержка JSON и MessagePack из одного API
- Минимальное потребление памяти благодаря компактным `Struct`-объектам
- Удобная работа со сложными вложенными структурами и Union-типами

Библиотека отлично подходит для высоконагруженных сервисов, потоковой обработки данных и любых задач, где производительность сериализации критична.

---

Чтобы освоить Python на профессиональном уровне и научиться строить высокопроизводительные приложения, приходите на курс [Python-разработчик](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-msgspec-fast-serialization) на PurpleSchool.
