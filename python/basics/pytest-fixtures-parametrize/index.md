---
metaTitle: "pytest фикстуры и параметризация тестов в Python"
metaDescription: "Полное руководство по фикстурам pytest и параметризации тестов в Python — scope, autouse, @pytest.mark.parametrize с примерами."
author: "Антон Ларичев"
title: "pytest: фикстуры и параметризация тестов"
preview: "Как использовать фикстуры для управления состоянием тестов и параметризацию для проверки множества сценариев в pytest."
---

## Что такое фикстуры в pytest

Фикстура — это функция, которая подготавливает окружение для теста и при необходимости очищает его после завершения. Вместо того чтобы дублировать код инициализации в каждом тесте, вы определяете фикстуру один раз, а pytest передаёт её результат в нужные тесты через аргументы.

До появления фикстур разработчики использовали методы `setUp` и `tearDown` из `unittest`. pytest предлагает более гибкий и читаемый подход.

```python
import pytest

@pytest.fixture
def user():
    return {"id": 1, "name": "Alice", "email": "alice@example.com"}

def test_user_has_name(user):
    assert user["name"] == "Alice"

def test_user_has_email(user):
    assert "@" in user["email"]
```

Pytest автоматически находит функцию `user` и передаёт её возвращаемое значение в каждый тест, который объявил параметр с таким именем.

## Фикстуры с очисткой через yield

Если тест создаёт ресурс, который нужно освободить — соединение с базой данных, временный файл, запущенный сервер — используйте `yield` вместо `return`. Код после `yield` выполняется как teardown.

```python
import pytest
import tempfile
import os

@pytest.fixture
def temp_file():
    fd, path = tempfile.mkstemp()
    os.close(fd)
    yield path
    os.unlink(path)  # выполняется после теста

def test_write_to_file(temp_file):
    with open(temp_file, "w") as f:
        f.write("hello")
    with open(temp_file) as f:
        assert f.read() == "hello"
```

Даже если тест завершился с ошибкой, teardown-часть будет выполнена — это гарантирует корректную очистку ресурсов.

## Область видимости фикстур (scope)

По умолчанию фикстура создаётся заново для каждого теста. Это безопасно, но иногда дорого — например, поднимать базу данных перед каждым тестом нецелесообразно. Параметр `scope` управляет временем жизни фикстуры.

| scope | Фикстура создаётся |
|---|---|
| `function` (по умолчанию) | Один раз для каждого теста |
| `class` | Один раз для каждого тестового класса |
| `module` | Один раз для каждого файла |
| `package` | Один раз для каждого пакета |
| `session` | Один раз за весь прогон тестов |

```python
import pytest

@pytest.fixture(scope="session")
def db_connection():
    print("\nОткрываем соединение с БД")
    connection = {"host": "localhost", "port": 5432, "connected": True}
    yield connection
    print("\nЗакрываем соединение с БД")
    connection["connected"] = False

@pytest.fixture(scope="module")
def db_cursor(db_connection):
    cursor = {"connection": db_connection, "queries": []}
    yield cursor
    cursor["queries"].clear()

def test_insert(db_cursor):
    db_cursor["queries"].append("INSERT INTO users...")
    assert len(db_cursor["queries"]) == 1

def test_select(db_cursor):
    db_cursor["queries"].append("SELECT * FROM users")
    assert len(db_cursor["queries"]) > 0
```

Правило: фикстура не может запрашивать другую фикстуру с более узкой областью видимости. Фикстура `session` не может зависеть от фикстуры `function`.

## Автоматические фикстуры (autouse)

Если нужно применить фикстуру ко всем тестам в модуле или сессии без явного указания в параметрах, используйте `autouse=True`.

```python
import pytest
import time

@pytest.fixture(autouse=True)
def log_test_name(request):
    print(f"\nЗапуск: {request.node.name}")
    start = time.time()
    yield
    elapsed = time.time() - start
    print(f"Завершён за {elapsed:.3f}с")

def test_addition():
    assert 2 + 2 == 4

def test_multiplication():
    assert 3 * 4 == 12
```

`request` — встроенная фикстура pytest, которая предоставляет информацию о текущем тесте: его имя, путь к файлу, параметры и многое другое.

## conftest.py — общие фикстуры

Фикстуры, нужные в нескольких файлах, размещают в `conftest.py`. Pytest автоматически находит и загружает этот файл — импортировать его не нужно.

```
project/
├── conftest.py          # фикстуры для всего проекта
├── tests/
│   ├── conftest.py      # фикстуры для всех тестов
│   ├── test_users.py
│   └── api/
│       ├── conftest.py  # фикстуры только для api-тестов
│       └── test_endpoints.py
```

```python
# tests/conftest.py
import pytest

@pytest.fixture
def base_url():
    return "http://localhost:8000"

@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test-token-123"}
```

```python
# tests/test_users.py
def test_get_users(base_url, auth_headers):
    url = f"{base_url}/users"
    assert url == "http://localhost:8000/users"
    assert "Authorization" in auth_headers
```

Фикстуры ищутся в порядке: текущий файл → ближайший `conftest.py` → `conftest.py` выше по дереву.

## Параметризация тестов через @pytest.mark.parametrize

Параметризация позволяет запустить один и тот же тест с разными входными данными. Без неё пришлось бы либо писать отдельный тест для каждого случая, либо использовать цикл, теряя детализацию при падении.

```python
import pytest

def is_palindrome(s: str) -> bool:
    s = s.lower().replace(" ", "")
    return s == s[::-1]

@pytest.mark.parametrize("word,expected", [
    ("racecar", True),
    ("hello", False),
    ("A man a plan a canal Panama", True),
    ("level", True),
    ("world", False),
])
def test_is_palindrome(word, expected):
    assert is_palindrome(word) == expected
```

При запуске pytest создаст пять отдельных тестов с понятными идентификаторами:

```
test_palindrome.py::test_is_palindrome[racecar-True] PASSED
test_palindrome.py::test_is_palindrome[hello-False] PASSED
test_palindrome.py::test_is_palindrome[A man a plan a canal Panama-True] PASSED
```

## Именованные параметры с pytest.param

Чтобы дать параметрам читаемые идентификаторы или пометить отдельные случаи как ожидаемо падающие, используйте `pytest.param`.

```python
import pytest

def divide(a, b):
    if b == 0:
        raise ValueError("Деление на ноль")
    return a / b

@pytest.mark.parametrize("a,b,expected", [
    pytest.param(10, 2, 5.0, id="простое деление"),
    pytest.param(7, 2, 3.5, id="деление с остатком"),
    pytest.param(0, 5, 0.0, id="ноль делим на число"),
    pytest.param(
        10, 0, None,
        marks=pytest.mark.xfail(raises=ValueError),
        id="деление на ноль"
    ),
])
def test_divide(a, b, expected):
    assert divide(a, b) == expected
```

`xfail` помечает тест как «ожидаемо упавший». Если он всё-таки прошёл, pytest сообщит об `XPASS` — неожиданном успехе.

## Параметризация на уровне класса

Декоратор `parametrize` можно применить к классу целиком — тогда все тесты внутри получат все комбинации параметров.

```python
import pytest

class Calculator:
    def add(self, a, b): return a + b
    def subtract(self, a, b): return a - b

@pytest.mark.parametrize("a,b", [(1, 2), (10, 20), (-5, 5)])
class TestCalculator:
    def test_add_commutative(self, a, b):
        calc = Calculator()
        assert calc.add(a, b) == calc.add(b, a)

    def test_subtract_not_commutative(self, a, b):
        calc = Calculator()
        assert calc.subtract(a, b) != calc.subtract(b, a) or a == b
```

## Комбинирование нескольких parametrize

Если на функцию навесить несколько декораторов `parametrize`, pytest создаст декартово произведение всех наборов параметров.

```python
import pytest

def format_greeting(greeting, name, punctuation):
    return f"{greeting}, {name}{punctuation}"

@pytest.mark.parametrize("punctuation", ["!", ".", "?"])
@pytest.mark.parametrize("name", ["Alice", "Bob"])
def test_format_greeting(name, punctuation):
    result = format_greeting("Hello", name, punctuation)
    assert result.startswith("Hello, ")
    assert result.endswith(punctuation)
```

Это создаст 6 тестов: все комбинации имён и знаков препинания.

## Параметризованные фикстуры

Фикстуры тоже можно параметризовать через `params`. Это полезно, когда нужно прогнать одни и те же тесты с разными реализациями или конфигурациями.

```python
import pytest

class SqliteStorage:
    def __init__(self): self.data = {}
    def set(self, key, value): self.data[key] = value
    def get(self, key): return self.data.get(key)

class RedisStorage:
    def __init__(self): self.data = {}
    def set(self, key, value): self.data[key] = value
    def get(self, key): return self.data.get(key)

@pytest.fixture(params=[SqliteStorage, RedisStorage], ids=["sqlite", "redis"])
def storage(request):
    return request.param()

def test_storage_set_get(storage):
    storage.set("key", "value")
    assert storage.get("key") == "value"

def test_storage_missing_key(storage):
    assert storage.get("nonexistent") is None
```

Kaждый тест запустится дважды — по одному разу для каждой реализации хранилища. Это обеспечивает покрытие одной кодовой базой тестов сразу для нескольких бэкендов.

## Использование фикстур внутри parametrize

Иногда нужно передать фикстуру как один из параметров в `parametrize`. Для этого используется специальный синтаксис с `request.getfixturevalue`.

```python
import pytest

@pytest.fixture
def admin_user():
    return {"role": "admin", "permissions": ["read", "write", "delete"]}

@pytest.fixture
def regular_user():
    return {"role": "user", "permissions": ["read"]}

@pytest.mark.parametrize("user_fixture,can_delete", [
    ("admin_user", True),
    ("regular_user", False),
])
def test_delete_permission(request, user_fixture, can_delete):
    user = request.getfixturevalue(user_fixture)
    assert ("delete" in user["permissions"]) == can_delete
```

## Пример: тестирование HTTP-клиента с фикстурами и параметризацией

Поставим задачу: нужно протестировать функцию, которая делает запросы к API. Используем `pytest-httpserver` для мока или просто смоделируем ситуацию через фикстуры.

```python
import pytest
from unittest.mock import MagicMock, patch

def fetch_user(user_id: int, base_url: str) -> dict:
    import urllib.request
    import json
    url = f"{base_url}/users/{user_id}"
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read())

@pytest.fixture
def mock_urlopen():
    with patch("urllib.request.urlopen") as mock:
        yield mock

@pytest.mark.parametrize("user_id,expected_name", [
    (1, "Alice"),
    (2, "Bob"),
    (3, "Charlie"),
])
def test_fetch_user(mock_urlopen, user_id, expected_name):
    mock_response = MagicMock()
    mock_response.read.return_value = f'{{"id": {user_id}, "name": "{expected_name}"}}'.encode()
    mock_response.__enter__ = lambda s: s
    mock_response.__exit__ = MagicMock(return_value=False)
    mock_urlopen.return_value = mock_response

    result = fetch_user(user_id, "http://api.example.com")

    assert result["id"] == user_id
    assert result["name"] == expected_name
```

Здесь фикстура `mock_urlopen` управляет патчингом, а `parametrize` покрывает разные значения без дублирования кода.

## Проверка исключений с параметризацией

```python
import pytest

def parse_age(value: str) -> int:
    age = int(value)
    if age < 0 or age > 150:
        raise ValueError(f"Недопустимый возраст: {age}")
    return age

@pytest.mark.parametrize("value,expected", [
    ("25", 25),
    ("0", 0),
    ("150", 150),
])
def test_parse_age_valid(value, expected):
    assert parse_age(value) == expected

@pytest.mark.parametrize("value,exc_type", [
    ("-1", ValueError),
    ("151", ValueError),
    ("abc", ValueError),
    ("1.5", ValueError),
])
def test_parse_age_invalid(value, exc_type):
    with pytest.raises(exc_type):
        parse_age(value)
```

## Полезные встроенные фикстуры pytest

Pytest поставляется с набором готовых фикстур:

- `tmp_path` — объект `pathlib.Path`, указывающий на временную директорию, уникальную для каждого теста
- `capsys` — перехват stdout/stderr
- `monkeypatch` — временная замена атрибутов, переменных окружения, функций
- `caplog` — перехват логов
- `request` — метаданные о текущем тесте

```python
def greet(name: str) -> str:
    print(f"Hello, {name}!")
    return f"Hello, {name}!"

def test_greet_output(capsys):
    greet("World")
    captured = capsys.readouterr()
    assert captured.out == "Hello, World!\n"

def test_env_variable(monkeypatch):
    monkeypatch.setenv("APP_ENV", "testing")
    import os
    assert os.environ["APP_ENV"] == "testing"

def test_tmp_file(tmp_path):
    file = tmp_path / "data.txt"
    file.write_text("content")
    assert file.read_text() == "content"
```

## Советы по организации тестов

Несколько практик, которые делают тестовую кодовую базу удобной:

**Группируйте фикстуры по слоям.** Низкоуровневые фикстуры (соединение с БД) помещайте в `conftest.py` корневого уровня, доменные (объекты пользователей, заказов) — в `conftest.py` рядом с соответствующими тестами.

**Называйте параметры говорящими именами.** Вместо `(1, True)` пишите `pytest.param(1, True, id="single item returns True")`.

**Не злоупотребляйте `autouse`.** Это скрытая зависимость — о ней сложно узнать, не читая `conftest.py`. Используйте только для сквозной логики: логирование, таймеры, глобальные моки.

**Разделяйте setup и assert.** Фикстура отвечает за подготовку состояния, тест — только за проверку. Если фикстура содержит `assert`, она выполняет слишком много работы.

```python
# Хорошо — фикстура готовит данные, тест проверяет поведение
@pytest.fixture
def populated_cart():
    return {"items": [{"id": 1, "qty": 2}, {"id": 2, "qty": 1}], "discount": 0}

def test_cart_total(populated_cart):
    total = sum(item["qty"] for item in populated_cart["items"])
    assert total == 3
```

## Итог

Фикстуры и параметризация — два фундаментальных инструмента pytest, которые устраняют дублирование в тестах и делают покрытие полным без лишних усилий. Фикстуры управляют жизненным циклом зависимостей: создают ресурсы перед тестом и освобождают их после. Параметризация превращает один тест в набор независимых сценариев с понятными идентификаторами при падении.

Освоив область видимости фикстур и комбинирование `parametrize`, вы сможете строить быстрые и надёжные тестовые наборы даже для сложных систем с множеством конфигураций.

Чтобы изучить тестирование в контексте полного Python-проекта и получить практику на реальных задачах, смотрите курс [Python-разработчик на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=pytest-fixtures-parametrize).