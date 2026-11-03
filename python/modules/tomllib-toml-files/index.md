---
metaTitle: "Python tomllib: чтение TOML файлов без зависимостей"
metaDescription: "Как использовать встроенный модуль tomllib в Python 3.11+ для чтения TOML файлов конфигурации с примерами кода."
author: "Антон Ларичев"
title: "Python tomllib — встроенная работа с TOML файлами"
preview: "Разбираем встроенный модуль tomllib из стандартной библиотеки Python 3.11: чтение TOML-конфигов, поддерживаемые типы данных и обработка ошибок."
---

## Что такое TOML и зачем он нужен

TOML (Tom's Obvious, Minimal Language) — формат файлов конфигурации, разработанный для того, чтобы быть одновременно удобочитаемым для человека и однозначно разбираемым машиной. Синтаксис напоминает `.ini`-файлы, но значительно богаче: поддерживаются вложенные структуры, массивы, даты, и строгая типизация значений.

TOML широко используется в экосистеме Python — например, файл `pyproject.toml` является стандартом для описания зависимостей и настроек инструментов сборки (pip, Poetry, Hatch, Ruff и т.д.).

Пример TOML-файла:

```toml
[project]
name = "my-app"
version = "1.0.0"
description = "Пример приложения"

[database]
host = "localhost"
port = 5432
name = "mydb"
ssl = true

[database.pool]
min_connections = 2
max_connections = 10

[servers]
hosts = ["web1.example.com", "web2.example.com"]
```

## Модуль tomllib в стандартной библиотеке

До Python 3.11 для работы с TOML требовались сторонние библиотеки: `toml`, `tomli`, `tomlkit`. Начиная с версии 3.11 модуль `tomllib` включён в стандартную библиотеку (PEP 680). Это значит, что читать TOML-файлы теперь можно без установки дополнительных зависимостей.

`tomllib` реализует спецификацию TOML v1.0.0 и работает только на чтение — записать данные обратно в TOML через него нельзя.

### Требования к версии Python

```python
import sys
print(sys.version)  # должно быть 3.11+

import tomllib  # ImportError в Python < 3.11
```

Если нужна поддержка Python 3.10 и ниже, используйте библиотеку `tomli` — она имеет идентичный API и является прямым предшественником `tomllib`.

## Чтение TOML файлов

АPI модуля намеренно минималистичен и следует той же модели, что и `json` из стандартной библиотеки.

### Чтение из файла

Основной способ — открыть файл в бинарном режиме (`"rb"`) и передать объект в `tomllib.load()`:

```python
import tomllib

with open("config.toml", "rb") as f:
    config = tomllib.load(f)

print(config)
# {'project': {'name': 'my-app', 'version': '1.0.0', ...}, 'database': {...}}
```

Важно: файл открывается именно в бинарном режиме `"rb"`, а не в текстовом `"r"`. Это требование спецификации — парсер сам обрабатывает кодировку UTF-8.

### Чтение из строки

Если TOML-содержимое уже находится в памяти в виде строки, используйте `tomllib.loads()`:

```python
import tomllib

toml_string = """
[server]
host = "0.0.0.0"
port = 8080
debug = false
"""

config = tomllib.loads(toml_string)
print(config["server"]["host"])  # 0.0.0.0
print(config["server"]["port"])  # 8080
```

## Маппинг типов TOML на типы Python

ТОML строго типизирован, и каждый тип TOML получает соответствующий тип Python:

| Тип TOML | Тип Python |
|---|---|
| String | `str` |
| Integer | `int` |
| Float | `float` |
| Boolean | `bool` |
| Offset Date-Time | `datetime.datetime` (aware) |
| Local Date-Time | `datetime.datetime` (naive) |
| Local Date | `datetime.date` |
| Local Time | `datetime.time` |
| Array | `list` |
| Table | `dict` |
| Inline Table | `dict` |

Практический пример с разными типами:

```toml
# types_example.toml

title = "Демонстрация типов"
count = 42
price = 19.99
enabled = true
tags = ["python", "toml", "config"]

[dates]
created = 2024-01-15
updated = 2024-06-01T12:30:00
scheduled = 09:00:00
```

```python
import tomllib
import datetime

with open("types_example.toml", "rb") as f:
    data = tomllib.load(f)

print(type(data["title"]))          # <class 'str'>
print(type(data["count"]))          # <class 'int'>
print(type(data["price"]))          # <class 'float'>
print(type(data["enabled"]))        # <class 'bool'>
print(type(data["tags"]))           # <class 'list'>
print(type(data["dates"]["created"]))  # <class 'datetime.date'>
print(type(data["dates"]["updated"]))  # <class 'datetime.datetime'>
```

## Работа с вложенными структурами

TOML-таблицы (секции в квадратных скобках) превращаются во вложенные словари Python:

```toml
# app_config.toml

[app]
name = "MyService"
version = "2.1.0"

[app.logging]
level = "INFO"
format = "json"
file = "/var/log/myservice.log"

[app.logging.rotation]
max_size_mb = 100
backup_count = 5

[database]
url = "postgresql://localhost:5432/mydb"

[[database.replicas]]
host = "replica1.internal"
port = 5432

[[database.replicas]]
host = "replica2.internal"
port = 5432
```

```python
import tomllib

with open("app_config.toml", "rb") as f:
    config = tomllib.load(f)

# Навигация по вложенным ключам
log_level = config["app"]["logging"]["level"]
max_size = config["app"]["logging"]["rotation"]["max_size_mb"]

# Массив таблиц (array of tables) — список словарей
replicas = config["database"]["replicas"]
for replica in replicas:
    print(f"{replica['host']}:{replica['port']}")
# replica1.internal:5432
# replica2.internal:5432
```

### Безопасный доступ к ключам

Поскольку результат — обычный словарь Python, все стандартные методы работают:

```python
import tomllib

with open("app_config.toml", "rb") as f:
    config = tomllib.load(f)

# Метод get() с дефолтным значением
debug_mode = config["app"].get("debug", False)
timeout = config.get("timeouts", {}).get("request", 30)

# Деструктуризация через распаковку
db_config = config["database"]
db_url = db_config["url"]
```

## Обработка ошибок

Модуль выбрасывает `tomllib.TOMLDecodeError` при синтаксических ошибках в TOML-файле:

```python
import tomllib

invalid_toml = """
[section]
key = value without quotes  # ошибка: строки требуют кавычек
"""

try:
    data = tomllib.loads(invalid_toml)
except tomllib.TOMLDecodeError as e:
    print(f"Ошибка разбора TOML: {e}")
    # Ошибка разбора TOML: Invalid value (at line 2, column 7)
```

При работе с файлами также следует обрабатывать `FileNotFoundError`:

```python
import tomllib
from pathlib import Path

def load_config(path: str | Path) -> dict:
    config_path = Path(path)
    
    if not config_path.exists():
        raise FileNotFoundError(f"Файл конфигурации не найден: {config_path}")
    
    try:
        with open(config_path, "rb") as f:
            return tomllib.load(f)
    except tomllib.TOMLDecodeError as e:
        raise ValueError(f"Некорректный TOML в {config_path}: {e}") from e
```

## Практический пример: конфигурация приложения

Рассмотрим реальный сценарий — загрузка конфигурации веб-сервиса с валидацией:

```toml
# settings.toml

[server]
host = "0.0.0.0"
port = 8000
workers = 4

[database]
host = "localhost"
port = 5432
name = "production_db"
user = "app_user"
password = "secret"
pool_size = 20

[cache]
backend = "redis"
host = "localhost"
port = 6379
ttl_seconds = 3600

[features]
enable_registration = true
enable_api_v2 = false
max_upload_size_mb = 50
```

```python
import tomllib
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ServerConfig:
    host: str
    port: int
    workers: int


@dataclass
class DatabaseConfig:
    host: str
    port: int
    name: str
    user: str
    password: str
    pool_size: int

    @property
    def url(self) -> str:
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"


@dataclass
class AppConfig:
    server: ServerConfig
    database: DatabaseConfig

    @classmethod
    def from_file(cls, path: str | Path) -> "AppConfig":
        with open(path, "rb") as f:
            raw = tomllib.load(f)

        return cls(
            server=ServerConfig(**raw["server"]),
            database=DatabaseConfig(**raw["database"]),
        )


config = AppConfig.from_file("settings.toml")
print(config.server.port)           # 8000
print(config.database.url)          # postgresql://app_user:secret@localhost:5432/production_db
```

## Чтение pyproject.toml

Один из самых распространённых сценариев — чтение метаданных проекта из `pyproject.toml`:

```python
import tomllib
from pathlib import Path


def get_project_version() -> str:
    pyproject_path = Path("pyproject.toml")
    
    with open(pyproject_path, "rb") as f:
        data = tomllib.load(f)
    
    return data["project"]["version"]


def get_dependencies() -> list[str]:
    with open("pyproject.toml", "rb") as f:
        data = tomllib.load(f)
    
    return data.get("project", {}).get("dependencies", [])


print(get_project_version())   # например: 1.2.3
print(get_dependencies())      # ['requests>=2.28', 'pydantic>=2.0']
```

## tomllib vs tomli vs tomlkit

При выборе инструмента для работы с TOML в Python стоит понимать различия:

**`tomllib`** (стандартная библиотека, Python 3.11+)
- Только чтение
- Нет зависимостей
- Высокая скорость работы
- Подходит для большинства задач

**`tomli`** (сторонняя библиотека)
- Только чтение, идентичный API с `tomllib`
- Поддержка Python 3.6+
- Рекомендуется как зависимость для библиотек, поддерживающих старые версии Python:

```python
try:
    import tomllib
except ImportError:
    import tomli as tomllib  # pip install tomli
```

**`tomlkit`** (сторонняя библиотека)
- Чтение и запись
- Сохраняет комментарии и форматирование
- Подходит, когда нужно модифицировать TOML-файлы программно

```python
import tomlkit  # pip install tomlkit

with open("config.toml", "r") as f:
    doc = tomlkit.load(f)

doc["version"] = "2.0.0"  # изменение значения

with open("config.toml", "w") as f:
    tomlkit.dump(doc, f)  # запись обратно с сохранением комментариев
```

## Ограничения tomllib

**Только чтение.** `tomllib` не умеет записывать данные в TOML-формат. Для этого нужны `tomlkit` или другие библиотеки.

**Только Python 3.11+.** Если проект поддерживает более ранние версии — используйте `tomli` с условным импортом.

**Бинарный режим открытия файла.** Нельзя передать файл, открытый в текстовом режиме:

```python
# Неправильно — выбросит TypeError
with open("config.toml", "r") as f:
    data = tomllib.load(f)

# Правильно
with open("config.toml", "rb") as f:
    data = tomllib.load(f)
```

## Итог

Модуль `tomllib` — это простой и надёжный способ читать TOML-конфигурации в Python 3.11+ без внешних зависимостей. API следует той же модели, что `json.load` / `json.loads`, поэтому освоение занимает считанные минуты. Для большинства задач — загрузки конфигов, чтения `pyproject.toml`, разбора настроек — его возможностей полностью достаточно. Если нужна запись или поддержка старых версий Python, рассмотрите `tomlkit` и `tomli` соответственно.

Чтобы углубиться в работу с модулями стандартной библиотеки Python и научиться строить production-ready приложения, приходите на курс [Python для разработчиков на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-tomllib).