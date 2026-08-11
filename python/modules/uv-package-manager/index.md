---
metaTitle: "uv — современный менеджер пакетов Python"
metaDescription: "Полное руководство по uv: установка, управление зависимостями, виртуальные окружения, lockfile и сравнение с pip и Poetry."
author: "Антон Ларичев"
title: "uv — современный менеджер пакетов Python"
preview: "uv — сверхбыстрый менеджер пакетов для Python, написанный на Rust. Заменяет pip, pip-tools, virtualenv и Poetry в одном инструменте."
---

uv — это инструмент для управления пакетами и проектами на Python, написанный на Rust командой Astral (авторы Ruff). Он в десятки раз быстрее pip, заменяет сразу несколько утилит и предлагает единый интерфейс для всего цикла работы с проектом.

## Зачем нужен uv

До uv типичный Python-проект требовал нескольких инструментов:

- `virtualenv` или `venv` — создание виртуальных окружений
- `pip` — установка пакетов
- `pip-tools` — компиляция lockfile из требований
- `pyenv` — управление версиями Python
- `Poetry` или `PDM` — управление зависимостями проекта

uv объединяет всё это в один бинарный файл. При этом он совместим со стандартом `pyproject.toml` и форматом `requirements.txt`, поэтому его можно внедрять постепенно.

## Установка

На macOS и Linux:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

На Windows (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Через pip (если уже есть Python):

```bash
pip install uv
```

Проверка установки:

```bash
uv --version
# uv 0.5.x (..)
```

uv — это единственный бинарный файл без зависимостей. Обновление выполняется командой `uv self update`.

## Управление версиями Python

uv умеет скачивать и переключать версии Python без pyenv:

```bash
# Посмотреть доступные версии
uv python list

# Установить конкретную версию
uv python install 3.12
uv python install 3.11 3.13

# Использовать конкретную версию в текущем проекте
uv python pin 3.12
```

Команда `uv python pin` создаёт файл `.python-version` в корне проекта. uv автоматически использует версию из этого файла.

## Инициализация проекта

Создание нового проекта:

```bash
uv init my-project
cd my-project
```

Это создаст структуру:

```
my-project/
├── pyproject.toml
├── README.md
├── .python-version
└── src/
    └── my_project/
        └── __init__.py
```

Файл `pyproject.toml` будет выглядеть так:

```toml
[project]
name = "my-project"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.12"
dependencies = []
```

Для скриптов без пакетной структуры удобен флаг `--script`:

```bash
uv init --script script.py
```

## Виртуальные окружения

Создание окружения вручную:

```bash
# Создать окружение в .venv
uv venv

# С конкретной версией Python
uv venv --python 3.11

# С пользовательским именем
uv venv my-env
```

Активация стандартная:

```bash
# Linux / macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

Однако при использовании проектных команд `uv run` активировать окружение вручную не нужно — uv управляет им автоматически.

## Управление зависимостями

### Добавление пакетов

```bash
# Добавить зависимость в pyproject.toml и установить
uv add requests
uv add "fastapi>=0.100"
uv add "pydantic[email]"

# Добавить зависимость только для разработки
uv add --dev pytest ruff mypy

# Добавить зависимость для конкретной группы
uv add --group lint ruff
```

После выполнения `uv add` в `pyproject.toml` появится запись:

```toml
[project]
dependencies = [
    "requests>=2.32",
    "fastapi>=0.100",
    "pydantic[email]>=2.0",
]

[dependency-groups]
dev = [
    "pytest>=8.0",
    "ruff>=0.8",
    "mypy>=1.0",
]
```

### Удаление пакетов

```bash
uv remove requests
uv remove --dev pytest
```

### Установка зависимостей

```bash
# Установить все зависимости из pyproject.toml
uv sync

# Без dev-зависимостей (для продакшена)
uv sync --no-dev

# Только конкретные группы
uv sync --group lint
```

## Lockfile

uv автоматически создаёт и обновляет файл `uv.lock` при каждом `uv add`, `uv remove` и `uv sync`. Этот файл фиксирует точные версии всех пакетов и их транзитивных зависимостей.

Фрагмент `uv.lock`:

```toml
version = 1
requires-python = ">=3.12"

[[package]]
name = "requests"
version = "2.32.3"
source = { registry = "https://pypi.org/simple" }
dependencies = [
    { name = "certifi" },
    { name = "charset-normalizer" },
    { name = "idna" },
    { name = "urllib3" },
]
```

Файл `uv.lock` нужно коммитить в репозиторий — это гарантирует воспроизводимые сборки в CI и на машинах других разработчиков.

Обновление зависимостей:

```bash
# Обновить все пакеты
uv lock --upgrade

# Обновить конкретный пакет
uv lock --upgrade-package requests
```

## Запуск команд с uv run

`uv run` запускает команды внутри виртуального окружения проекта, не требуя его активации:

```bash
# Запустить скрипт
uv run python main.py

# Запустить тесты
uv run pytest

# Запустить любую установленную утилиту
uv run ruff check .
uv run mypy src/
```

Это особенно удобно в `Makefile` или CI-скриптах, где управлять активацией окружения неудобно.

## Работа с pip-совместимым интерфейсом

Если нужно использовать uv как замену pip без pyproject.toml:

```bash
# Установить пакет
uv pip install requests

# Установить из requirements.txt
uv pip install -r requirements.txt

# Заморозить текущие зависимости
uv pip freeze > requirements.txt

# Показать установленные пакеты
uv pip list

# Удалить пакет
uv pip uninstall requests
```

Такой режим удобен для постепенного перехода с pip без перестройки проекта.

## Компиляция requirements

uv умеет компилировать `requirements.txt` с зафиксированными версиями из `requirements.in` (замена pip-tools):

```bash
# requirements.in
requests
fastapi>=0.100
```

```bash
# Скомпилировать с разрешёнными версиями
uv pip compile requirements.in -o requirements.txt
```

Результат:

```
# This file was autogenerated by uv
anyio==4.7.0
    # via starlette
certifi==2024.12.14
    # via requests
fastapi==0.115.6
requests==2.32.3
...
```

## Скрипты с встроенными зависимостями

uv поддерживает стандарт PEP 723 — зависимости прямо в скрипте:

```python
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "requests",
#   "rich",
# ]
# ///

import requests
from rich.console import Console

console = Console()
response = requests.get("https://api.github.com/repos/astral-sh/uv")
data = response.json()
console.print(f"Stars: [bold]{data['stargazers_count']}[/bold]")
```

Запуск скрипта — uv сам создаст изолированное окружение с нужными пакетами:

```bash
uv run script.py
```

Это удобно для одноразовых утилит, которые не стоит включать в проект.

## Установка глобальных утилит

uv заменяет pipx для установки CLI-инструментов:

```bash
# Установить инструмент глобально
uv tool install ruff
uv tool install httpie
uv tool install black

# Запустить инструмент без установки
uv tool run ruff check .

# Короткий псевдоним для uvx
uvx ruff check .

# Обновить все инструменты
uv tool upgrade --all

# Список установленных инструментов
uv tool list
```

Каждый инструмент устанавливается в изолированное окружение, поэтому конфликты зависимостей исключены.

## Практический пример: FastAPI-проект

Создадим API-проект с нуля:

```bash
uv init fastapi-demo
cd fastapi-demo
uv python pin 3.12

# Добавить основные зависимости
uv add fastapi uvicorn[standard]

# Добавить dev-зависимости
uv add --dev pytest httpx ruff mypy
```

Файл `src/fastapi_demo/main.py`:

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello from uv-managed project"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None) -> dict:
    return {"item_id": item_id, "q": q}
```

Файл `tests/test_main.py`:

```python
from fastapi.testclient import TestClient
from fastapi_demo.main import app

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from uv-managed project"}


def test_read_item():
    response = client.get("/items/42?q=test")
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == 42
    assert data["q"] == "test"
```

Запуск сервера и тестов:

```bash
# Запуск сервера разработки
uv run uvicorn fastapi_demo.main:app --reload

# Запуск тестов
uv run pytest

# Линтинг
uv run ruff check .

# Проверка типов
uv run mypy src/
```

## Конфигурация в pyproject.toml

uv читает настройки из секции `[tool.uv]`:

```toml
[tool.uv]
# Зеркало PyPI для корпоративных сред
index-url = "https://pypi.company.com/simple"

# Дополнительные индексы
extra-index-url = ["https://pypi.org/simple"]

# Ограничения для всего дерева зависимостей
constraint-dependencies = [
    "urllib3<2",
]

# Пакеты, которые не нужно обновлять
override-dependencies = [
    "numpy==1.26.4",
]
```

## Сравнение с другими инструментами

| Задача | pip | Poetry | uv |
|---|---|---|---|
| Установка пакетов | `pip install` | `poetry add` | `uv add` |
| Виртуальные окружения | `python -m venv` | встроено | `uv venv` |
| Lockfile | pip-tools | `poetry.lock` | `uv.lock` |
| Версии Python | pyenv | встроено | `uv python` |
| Глобальные утилиты | pipx | нет | `uv tool` |
| Скорость | базовая | медленная | в 10-100 раз быстрее |

uv при первой установке пакета скачивает его, а при повторной — берёт из глобального кеша. Для больших проектов с CI это экономит минуты.

## Использование в CI/CD

Пример для GitHub Actions:

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4
        with:
          enable-cache: true

      - name: Set up Python
        run: uv python install

      - name: Install dependencies
        run: uv sync --frozen

      - name: Run tests
        run: uv run pytest

      - name: Run linter
        run: uv run ruff check .
```

Флаг `--frozen` запрещает изменение lockfile во время синхронизации — если `uv.lock` не соответствует `pyproject.toml`, команда завершится с ошибкой. Это защищает CI от неожиданных обновлений.

## Dockerfile с uv

```dockerfile
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./

# Установить только продакшен-зависимости
RUN uv sync --frozen --no-dev

COPY src/ src/

CMD ["uv", "run", "uvicorn", "my_app.main:app", "--host", "0.0.0.0"]
```

Кеширование слоёв работает правильно: зависимости переустанавливаются только при изменении `pyproject.toml` или `uv.lock`.

## Итог

uv охватывает весь цикл работы с Python-проектом: установку интерпретатора, создание окружений, управление зависимостями, компиляцию lockfile и запуск инструментов. Скорость работы значительно выше pip и Poetry за счёт реализации на Rust и агрессивного кеширования. Совместимость с `pyproject.toml` и `requirements.txt` позволяет внедрять uv в существующие проекты без полного переписывания инфраструктуры.

Освоить Python с нуля и научиться правильно организовывать проекты можно на курсе [Python для разработчиков](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=uv-package-manager) на PurpleSchool.