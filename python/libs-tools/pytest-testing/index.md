---
metaTitle: Pytest — тестирование на Python для начинающих
metaDescription: Pytest в Python — установка, написание тестов, фикстуры, параметризация, моки. Полное руководство по тестированию Python-кода с примерами.
author: Антон Ларичев
title: "Pytest — тестирование на Python: полное руководство"
preview: Полное руководство по pytest — установка, базовые тесты, фикстуры, параметризация, моки с unittest.mock. Начните тестировать Python-код правильно.
---

## Введение

Pytest — самый популярный фреймворк для тестирования на Python. По данным опроса JetBrains, его используют более 60% Python-разработчиков. Pytest проще в написании, чем встроенный `unittest`, поддерживает богатый вывод ошибок и имеет огромную экосистему плагинов.

Тестирование — это не дополнительная нагрузка, а инструмент, который экономит время: тесты находят ошибки до деплоя, дают уверенность при рефакторинге и служат документацией к коду.

## Установка

```bash
pip install pytest

# Проверяем установку
pytest --version
```

Для тестирования FastAPI-приложений дополнительно:

```bash
pip install pytest httpx
```

## Первый тест

Pytest автоматически ищет файлы с именами `test_*.py` или `*_test.py` и функции, начинающиеся с `test_`.

Создайте файл `calculator.py`:

```python
def add(a: float, b: float) -> float:
    return a + b

def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Нельзя делить на ноль")
    return a / b
```

И файл `test_calculator.py`:

```python
from calculator import add, divide
import pytest


def test_add_positive_numbers():
    result = add(2, 3)
    assert result == 5


def test_add_negative_numbers():
    assert add(-1, -2) == -3


def test_add_zero():
    assert add(5, 0) == 5


def test_divide_normal():
    assert divide(10, 2) == 5.0


def test_divide_by_zero():
    # Проверяем, что функция бросает исключение
    with pytest.raises(ValueError, match="Нельзя делить на ноль"):
        divide(10, 0)
```

Запуск:

```bash
pytest test_calculator.py

# Подробный вывод
pytest -v test_calculator.py

# Запуск всех тестов в директории
pytest
```

Если вы хотите изучить тестирование Python и другие инструменты разработки — приходите на наш курс [Python с нуля](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=pytest-testing). На курсе 200+ уроков, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Assert — проверки в pytest

Pytest перехватывает стандартный `assert` и выводит подробную информацию при провале:

```python
def test_list_content():
    result = [1, 2, 3]
    expected = [1, 2, 4]
    assert result == expected
    # Вывод при ошибке:
    # AssertionError: assert [1, 2, 3] == [1, 2, 4]
    #   At index 2 diff: 3 != 4


def test_string_content():
    name = "иван"
    assert "и" in name          # проверка вхождения
    assert name.startswith("и") # проверка начала
    assert len(name) == 4       # проверка длины


def test_approximate_float():
    # Для чисел с плавающей точкой — approx
    assert 0.1 + 0.2 == pytest.approx(0.3)
```

## Фикстуры (Fixtures)

Фикстуры — основной способ переиспользовать код инициализации между тестами:

```python
import pytest


@pytest.fixture
def sample_user():
    """Возвращает тестового пользователя"""
    return {
        "id": 1,
        "name": "Иван",
        "email": "ivan@example.com",
        "role": "user"
    }


@pytest.fixture
def admin_user():
    return {
        "id": 2,
        "name": "Администратор",
        "email": "admin@example.com",
        "role": "admin"
    }


def test_user_name(sample_user):
    # sample_user автоматически передаётся pytest
    assert sample_user["name"] == "Иван"


def test_user_email(sample_user):
    assert "@" in sample_user["email"]


def test_admin_has_admin_role(admin_user):
    assert admin_user["role"] == "admin"
```

### Область видимости фикстур (scope)

```python
@pytest.fixture(scope="session")
def database():
    """Создаётся один раз на всю сессию тестов"""
    db = create_test_database()
    yield db  # yield вместо return позволяет добавить teardown
    db.close()  # выполнится после всех тестов


@pytest.fixture(scope="module")
def api_client():
    """Один экземпляр на файл тестов"""
    return create_client()


@pytest.fixture(scope="function")  # по умолчанию
def fresh_data():
    """Создаётся заново для каждого теста"""
    return {"count": 0}
```

### Фикстура с setup и teardown

```python
@pytest.fixture
def temp_file(tmp_path):
    """Создаёт временный файл и удаляет его после теста"""
    file = tmp_path / "test.txt"
    file.write_text("тестовые данные")
    
    yield file  # тест получает путь к файлу
    
    # Код после yield — это teardown (выполнится всегда)
    if file.exists():
        file.unlink()
```

## Параметризация

Запуск одного теста с разными входными данными:

```python
@pytest.mark.parametrize("a, b, expected", [
    (2, 3, 5),
    (-1, 1, 0),
    (0, 0, 0),
    (100, -50, 50),
])
def test_add(a, b, expected):
    assert add(a, b) == expected


@pytest.mark.parametrize("value, is_valid", [
    ("ivan@example.com", True),
    ("not-an-email", False),
    ("test@", False),
    ("", False),
])
def test_email_validation(value, is_valid):
    assert validate_email(value) == is_valid
```

Параметризация генерирует отдельный тест для каждого набора параметров — в выводе `pytest -v` они отображаются отдельными строками.

## Моки с unittest.mock

Мок (Mock) — объект-заменитель, который имитирует поведение реального объекта:

```python
from unittest.mock import Mock, patch, MagicMock


# Мокирование функции
def test_send_email():
    with patch('myapp.email.send_smtp') as mock_send:
        mock_send.return_value = True
        
        result = send_welcome_email("ivan@example.com")
        
        # Проверяем, что функция была вызвана
        mock_send.assert_called_once()
        # Проверяем аргументы вызова
        mock_send.assert_called_with(
            to="ivan@example.com",
            subject="Добро пожаловать!"
        )
        assert result is True


# Мокирование HTTP-запроса
def test_fetch_user():
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"id": 1, "name": "Иван"}
    
    with patch('requests.get', return_value=mock_response):
        user = fetch_user_from_api(1)
        assert user["name"] == "Иван"
```

### pytest-mock (удобная обёртка)

```bash
pip install pytest-mock
```

```python
def test_with_mocker(mocker):
    # mocker.patch — аналог patch, но с автоматической очисткой
    mock_get = mocker.patch('requests.get')
    mock_get.return_value.json.return_value = {"result": "ok"}
    
    result = my_function()
    assert result == "ok"
```

## Организация тестов

### conftest.py

Файл `conftest.py` содержит фикстуры и настройки, доступные всем тестам в директории:

```
my_project/
├── src/
│   └── ...
└── tests/
    ├── conftest.py       # общие фикстуры
    ├── test_users.py
    └── test_products.py
```

```python
# tests/conftest.py
import pytest


@pytest.fixture(scope="session")
def app():
    """Создаём тестовое приложение один раз"""
    from myapp import create_app
    app = create_app(testing=True)
    return app


@pytest.fixture
def client(app):
    """Тестовый клиент для запросов"""
    return app.test_client()
```

### Маркеры (marks)

```python
@pytest.mark.slow
def test_heavy_operation():
    # Долгий тест
    pass

@pytest.mark.skip(reason="Известный баг, будет исправлен в v2")
def test_known_bug():
    pass

@pytest.mark.skipif(sys.platform == "win32", reason="Не работает на Windows")
def test_linux_only():
    pass
```

Запуск с фильтрацией:

```bash
pytest -m "not slow"     # пропустить медленные
pytest -m slow           # только медленные
pytest -k "user"         # тесты, содержащие 'user' в названии
```

## Тестирование FastAPI

```python
# test_api.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Привет, FastAPI!"}


def test_create_user():
    user_data = {
        "name": "Иван",
        "email": "ivan@example.com",
        "age": 25
    }
    response = client.post("/users", json=user_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Иван"
    assert "id" in data


def test_user_not_found():
    response = client.get("/users/99999")
    assert response.status_code == 404
```

## Частые ошибки

* **Тесты зависят друг от друга.** Каждый тест должен быть независимым. Общее состояние — через фикстуры с правильным scope.

* **Мокирование в неправильном месте.** Мокировать нужно там, где имя используется, а не там, где оно определено: `patch('mymodule.requests.get')`, если `mymodule` импортирует `requests`.

* **Тесты без assert.** Тест, который не упал — ещё не значит, что он что-то проверил. Убедитесь, что в каждом тесте есть хотя бы один `assert`.

* **Слишком большие тесты.** Один тест — одна проверка. Если тест падает, должно быть понятно что именно сломалось.

## Часто задаваемые вопросы

**Pytest или unittest — что использовать?**

Pytest в большинстве случаев предпочтительнее: синтаксис проще, вывод информативнее, фикстуры мощнее callbacks. `unittest` удобен, если нужно поддерживать Python 2 или есть ограничения на зависимости.

**Как запустить только упавшие тесты?**

`pytest --lf` (last failed) — повторяет только тесты, упавшие в прошлый раз. `pytest --ff` (first failed) — сначала упавшие, потом остальные.

**Как измерить покрытие кода тестами?**

```bash
pip install pytest-cov
pytest --cov=myapp --cov-report=html
```

Отчёт о покрытии сохранится в папку `htmlcov/`.

## Заключение

Pytest — стандартный инструмент тестирования в Python-экосистеме. Начните с простых `assert`-тестов, добавьте фикстуры для переиспользования кода, параметризацию для проверки граничных случаев и моки для изоляции внешних зависимостей.

Для углублённого изучения Python рекомендуем курс [Python с нуля](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=pytest-testing). В первых модулях доступно бесплатное содержание — познакомьтесь с форматом обучения до покупки полного доступа.
