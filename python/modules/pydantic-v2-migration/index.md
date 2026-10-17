---
metaTitle: "Миграция с Pydantic v1 на Pydantic v2: полное руководство"
metaDescription: "Пошаговое руководство по миграции с Pydantic v1 на v2: breaking changes, валидаторы, конфигурация моделей, сериализация и совместимость."
author: "Антон Ларичев"
title: "Миграция с Pydantic v1 на v2"
preview: "Разбираем все ключевые изменения Pydantic v2 и показываем, как перевести существующий код с v1 на v2 без потери функциональности."
---

Pydantic v2 был переписан на Rust и выпущен в середине 2023 года. Новая версия работает в 5–50 раз быстрее предыдущей, но принесла серьёзные breaking changes. Если у вас есть проект на Pydantic v1, эта статья поможет разобраться, что именно нужно изменить и в каком порядке это лучше делать.

## Установка и режим совместимости

Для начала обновите пакет:

```bash
pip install pydantic --upgrade
# или явно
pip install "pydantic>=2.0"
```

Pydantic v2 поставляется с пакетом совместимости `pydantic.v1`, который позволяет временно сохранить старый код работоспособным:

```python
# Временное решение — импортируем v1-совместимый интерфейс
from pydantic.v1 import BaseModel, validator

class User(BaseModel):
    name: str
    age: int

    @validator('age')
    def age_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('age must be positive')
        return v
```

Это не постоянное решение, но удобно при поэтапной миграции крупного проекта — можно переводить модели по одной, не ломая всё сразу.

## Ключевые изменения в объявлении моделей

### Конфигурация модели

В v1 конфигурация задавалась через внутренний класс `Config`:

```python
# Pydantic v1
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int

    class Config:
        str_strip_whitespace = True
        use_enum_values = True
        extra = 'forbid'
```

В v2 используется декоратор `model_config` и объект `ConfigDict`:

```python
# Pydantic v2
from pydantic import BaseModel, ConfigDict

class User(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        use_enum_values=True,
        extra='forbid',
    )

    name: str
    age: int
```

Внутренний класс `Config` формально ещё работает в v2 с предупреждением об устаревании, но лучше сразу перейти на `ConfigDict`.

### Переименованные параметры конфигурации

Несколько параметров были переименованы:

| Pydantic v1 | Pydantic v2 |
|---|---|
| `orm_mode = True` | `from_attributes = True` |
| `schema_extra` | `json_schema_extra` |
| `validate_all` | `validate_default` |
| `allow_population_by_field_name` | `populate_by_name` |
| `underscore_attrs_are_private` | убрано, используйте `PrivateAttr` |

```python
# v1
class User(BaseModel):
    class Config:
        orm_mode = True
        allow_population_by_field_name = True

# v2
class User(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )
```

## Миграция валидаторов

Это самая объёмная часть миграции. Декоратор `@validator` заменён на `@field_validator`, а `@root_validator` — на `@model_validator`.

### field_validator вместо validator

```python
# Pydantic v1
from pydantic import BaseModel, validator

class Product(BaseModel):
    name: str
    price: float

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('name cannot be empty')
        return v.strip()

    @validator('price')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('price must be positive')
        return v
```

```python
# Pydantic v2
from pydantic import BaseModel, field_validator

class Product(BaseModel):
    name: str
    price: float

    @field_validator('name')
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('name cannot be empty')
        return v.strip()

    @field_validator('price')
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError('price must be positive')
        return v
```

Главные отличия:
- Теперь обязательно явно добавлять `@classmethod`
- Аннотации типов для параметров и возвращаемого значения приветствуются
- Параметр `values` для доступа к другим полям больше не передаётся автоматически

### Доступ к другим полям в валидаторе

В v1 через `values` можно было получить уже провалидированные поля:

```python
# Pydantic v1
class Order(BaseModel):
    quantity: int
    unit_price: float
    total: float

    @validator('total')
    def check_total(cls, v, values):
        expected = values.get('quantity', 0) * values.get('unit_price', 0)
        if abs(v - expected) > 0.01:
            raise ValueError(f'total must be {expected}')
        return v
```

В v2 для этого используется `model_validator` или `info` в `field_validator`:

```python
# Pydantic v2 — через model_validator
from pydantic import BaseModel, model_validator

class Order(BaseModel):
    quantity: int
    unit_price: float
    total: float

    @model_validator(mode='after')
    def check_total(self) -> 'Order':
        expected = self.quantity * self.unit_price
        if abs(self.total - expected) > 0.01:
            raise ValueError(f'total must be {expected}')
        return self
```

### model_validator вместо root_validator

```python
# Pydantic v1
from pydantic import BaseModel, root_validator

class LoginForm(BaseModel):
    username: str
    password: str
    confirm_password: str

    @root_validator
    def passwords_match(cls, values):
        pw = values.get('password')
        cpw = values.get('confirm_password')
        if pw != cpw:
            raise ValueError('passwords do not match')
        return values
```

```python
# Pydantic v2
from pydantic import BaseModel, model_validator

class LoginForm(BaseModel):
    username: str
    password: str
    confirm_password: str

    @model_validator(mode='after')
    def passwords_match(self) -> 'LoginForm':
        if self.password != self.confirm_password:
            raise ValueError('passwords do not match')
        return self
```

Параметр `mode` принимает два значения:
- `'before'` — запускается до валидации полей, получает сырые данные как словарь
- `'after'` — запускается после валидации всех полей, получает экземпляр модели

## Изменения в Field

### Устаревшие параметры

```python
# Pydantic v1
from pydantic import BaseModel, Field

class Item(BaseModel)
    name: str = Field(..., min_length=1, max_length=100)
    tags: list = Field(default_factory=list, const=False)
    price: float = Field(..., gt=0, description='Price in USD')
```

```python
# Pydantic v2
from pydantic import BaseModel, Field

class Item(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    tags: list = Field(default_factory=list)  # const убран
    price: float = Field(..., gt=0, description='Price in USD')
```

Параметр `const` удалён. Если нужны константные значения, используйте `Literal`:

```python
from typing import Literal
from pydantic import BaseModel

class Event(BaseModel):
    event_type: Literal['click', 'hover', 'focus']
    timestamp: float
```

### Приватные атрибуты

```python
# Pydantic v1
from pydantic import BaseModel

class Service(BaseModel):
    name: str
    _connection: object = None  # приватный атрибут через underscore
```

```python
# Pydantic v2
from pydantic import BaseModel, PrivateAttr

class Service(BaseModel):
    name: str
    _connection: object = PrivateAttr(default=None)
```

## Сериализация и методы модели

### Переименованные методы

Методы экземпляра модели изменили имена:

| Pydantic v1 | Pydantic v2 |
|---|---|
| `.dict()` | `.model_dump()` |
| `.json()` | `.model_dump_json()` |
| `.schema()` | `.model_json_schema()` |
| `.parse_obj()` | `.model_validate()` |
| `.parse_raw()` | `.model_validate_json()` |
| `.copy()` | `.model_copy()` |
| `__fields__` | `model_fields` |

```python
# Pydantic v1
user = User(name='Alice', age=30)
data = user.dict()
json_str = user.json()
user_copy = user.copy(update={'age': 31})
new_user = User.parse_obj({'name': 'Bob', 'age': 25})
```

```python
# Pydantic v2
user = User(name='Alice', age=30)
data = user.model_dump()
json_str = user.model_dump_json()
user_copy = user.model_copy(update={'age': 31})
new_user = User.model_validate({'name': 'Bob', 'age': 25})
```

Старые имена методов `.dict()` и `.json()` в v2 ещё работают, но выдают `DeprecationWarning`.

### field_serializer для кастомной сериализации

В v1 для управления сериализацией использовали `json_encoders` в `Config`. В v2 есть декоратор `@field_serializer`:

```python
# Pydantic v1
from datetime import datetime
from pydantic import BaseModel

class Event(BaseModel):
    name: str
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
```

```python
# Pydantic v2
from datetime import datetime
from pydantic import BaseModel, field_serializer

class Event(BaseModel):
    name: str
    created_at: datetime

    @field_serializer('created_at')
    def serialize_created_at(self, value: datetime) -> str:
        return value.isoformat()
```

## Изменения в аннотациях типов

### Обязательные поля без default

В v1 обязательность поля можно было указать через `...` (Ellipsis) или просто не давать default:

```python
# Pydantic v1 — оба варианта обязательные поля
class User(BaseModel):
    name: str
    email: str = ...
```

В v2 поведение сохранено, но появился тип `Required` для явного обозначения:

```python
# Pydantic v2
from pydantic import BaseModel
from pydantic.fields import PydanticUndefined

class User(BaseModel):
    name: str           # обязательное
    email: str = ...    # тоже обязательное, но лучше просто без default
    age: int = 0        # опциональное с default
```

### Annotated для метаданных полей

В v2 рекомендуется использовать `Annotated` для вынесения ограничений:

```python
from typing import Annotated
from pydantic import BaseModel, Field

# Переиспользуемые типы с ограничениями
PositiveFloat = Annotated[float, Field(gt=0)]
ShortString = Annotated[str, Field(min_length=1, max_length=50)]

class Product(BaseModel):
    name: ShortString
    price: PositiveFloat
    discount: PositiveFloat
```

## Стратегия поэтапной миграции

Для больших проектов рекомендуется следующий порядок:

### Шаг 1 — установите bumped-версию и проверьте предупреждения

```bash
pip install "pydantic>=2.0"
python -W error::DeprecationWarning your_app.py
```

Запустите тесты и соберите все `DeprecationWarning` — это ваш список задач.

### Шаг 2 — переведите конфигурации

Автоматически замените `class Config` на `model_config = ConfigDict(...)`. Это механическая замена, которую можно сделать через `sed` или IDE-рефакторинг.

### Шаг 3 — переведите валидаторы

Замените `@validator` на `@field_validator`, `@root_validator` на `@model_validator`. Добавьте `@classmethod` везде, где его не хватает.

### Шаг 4 — обновите вызовы методов

Замените `.dict()` на `.model_dump()`, `.json()` на `.model_dump_json()` и т.д. Это тоже механическая замена.

### Шаг 5 — используйте официальный инструмент

Pydantic предоставляет `bump-pydantic` — утилиту для автоматической миграции кода:

```bash
pip install bump-pydantic
bump-pydantic .
```

Инструмент обрабатывает большинство механических замен автоматически и выдаёт отчёт о том, что потребует ручного внимания.

## Совместимость с FastAPI

FastAPI начиная с версии 0.100.0 поддерживает Pydantic v2. Большинство изменений прозрачны на уровне маршрутов, но если вы используете `orm_mode` для интеграции с SQLAlchemy, не забудьте обновить конфиг:

```python
# v1
class UserResponse(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

# v2
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
```

## Производительность

Миграция на v2 даёт ощутимый прирост без изменений в логике. Ядро валидации переписано на Rust (pydantic-core), что даёт:

- Валидация простых моделей: **5–10x быстрее**
- Сериализация в JSON: **10–20x быстрее**
- Потребление памяти: заметно меньше при большом числе экземпляров

Прирост особенно заметен в высоконагруженных API и обработке большого числа объектов.

---

Если вы хотите глубже разобраться с Python, структурами данных, работой с внешними библиотеками и построением надёжных приложений, записывайтесь на курс по Python на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=pydantic-v2-migration