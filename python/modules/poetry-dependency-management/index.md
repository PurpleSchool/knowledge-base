---
metaTitle: "Poetry — управление зависимостями в Python"
metaDescription: "Как использовать Poetry для управления зависимостями, виртуальными окружениями и публикацией пакетов в Python-проектах."
author: "Антон Ларичев"
title: "Poetry: управление зависимостями в Python"
preview: "Полное руководство по Poetry: установка, создание проектов, управление зависимостями и виртуальными окружениями."
---

## Что такое Poetry и зачем он нужен

Poetry — современный инструмент для управления зависимостями и пакетами в Python. Он решает сразу несколько задач: управляет виртуальными окружениями, отслеживает зависимости, разрешает конфликты версий и позволяет публиковать пакеты в PyPI.

До Poetry разработчики использовали связку из нескольких инструментов: `pip` для установки пакетов, `virtualenv` или `venv` для изоляции окружений, `pip freeze > requirements.txt` для фиксации версий. Эта схема имеет существенный недостаток — `requirements.txt` не разделяет прямые и транзитивные зависимости, что затрудняет обновление пакетов и понимание того, что именно вы добавили в проект намеренно.

Poetry хранит зависимости в файле `pyproject.toml`, а точные версии всего дерева зависимостей фиксирует в `poetry.lock`. Это делает сборку воспроизводимой на любой машине.

## Установка Poetry

Рекомендуемый способ установки — официальный скрипт-установщик. Он изолирует Poetry от проектов и системного Python:

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

После установки добавьте Poetry в `PATH`. На Linux/macOS добавьте в `~/.bashrc` или `~/.zshrc`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Проверьте установку:

```bash
poetry --version
# Poetry (version 1.8.x)
```

На Windows Poetry устанавливается аналогично через PowerShell:

```powershell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
```

## Создание нового проекта

### Инициализация с нуля

Для создания нового проекта используется команда `new`:

```bash
poetry new my-project
```

Poetry создаст следующую структуру:

```
my-project/
├── pyproject.toml
├── README.md
├── my_project/
│   └── __init__.py
└── tests/
    └── __init__.py
```

### Добавление Poetry в существующий проект

Если проект уже существует, перейдите в его директорию и выполните:

```bash
cd existing-project
poetry init
```

Команда запустит интерактивный мастер, который поможет заполнить метаданные проекта и добавить начальные зависимости.

## Файл pyproject.toml

Весь конфигурации проекта хранится в `pyproject.toml`. Вот типичный пример:

```toml
[tool.poetry]
name = "my-project"
version = "0.1.0"
description = "Описание проекта"
authors = ["Anton Larichev <antonlarichev@gmail.com>"]
readme = "README.md"
packages = [{include = "my_project"}]

[tool.poetry.dependencies]
python = "^3.11"
requests = "^2.31.0"
pydantic = "^2.5.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
black = "^23.0.0"
mypy = "^1.7.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
```

Секция `[tool.poetry.dependencies]` содержит зависимости времени выполнения, а `[tool.poetry.group.dev.dependencies]` — зависимости для разработки, которые не попадут в production-сборку.

### Синтаксис версионных ограничений

Poetry использует расширенный синтаксис для указания версий:

```toml
[tool.poetry.dependencies]
# Совместимые версии (^): обновления в пределах мажорной версии
requests = "^2.31.0"     # >= 2.31.0, < 3.0.0

# Приблизительно совместимые (~): обновления в пределах минорной версии
flask = "~2.3.0"          # >= 2.3.0, < 2.4.0

# Точная версия
numpy = "1.26.0"

# Диапазон
sqlalchemy = ">=1.4,<3.0"

# Любая версия
python-dotenv = "*"
```

## Управление зависимостями

### Добавление пакетов

Добавить зависимость в проект:

```bash
poetry add requests
poetry add "pydantic>=2.0"
poetry add fastapi uvicorn
```

Для добавления зависимости только в группу разработки:

```bash
poetry add --group dev pytest black mypy
```

Можно добавлять пакеты из разных источников:

```bash
# Из git-репозитория
poetry add git+https://github.com/user/repo.git

# Из локальной директории
poetry add ../my-local-package

# Конкретный тег или ветка
poetry add git+https://github.com/user/repo.git#v2.0.0
```

### Удаление пакетов

```bash
poetry remove requests
poetry remove --group dev black
```

### Обновление зависимостей

```bash
# Обновить все зависимости в пределах ограничений из pyproject.toml
poetry update

# Обновить конкретный пакет
poetry update requests

# Показать, что можно обновить, без применения изменений
poetry show --outdated
```

### Просмотр установленных пакетов

```bash
# Список всех зависимостей
poetry show

# Дерево зависимостей
poetry show --tree

# Информация о конкретном пакете
poetry show requests
```

## Виртуальные окружения

Poetry автоматически создаёт и управляет виртуальным окружением для каждого проекта. По умолчанию окружения хранятся в директории кэша Poetry (`~/.cache/pypoetry/virtualenvs/`).

### Настройка расположения окружения

Многие разработчики предпочитают держать окружение внутри проекта для удобства работы с IDE:

```bash
poetry config virtualenvs.in-project true
```

После этого окружение будет создаваться в `.venv` внутри директории проекта.

### Работа с окружением

```bash
# Установить все зависимости из pyproject.toml
poetry install

# Установить только production-зависимости (без групп разработки)
poetry install --only main

# Запустить команду внутри окружения
poetry run python main.py
poetry run pytest
poetry run python -m mypy .

# Активировать окружение в текущей оболочке
poetry shell

# Показать путь к окружению
poetry env info
poetry env info --path
```

### Управление несколькими версиями Python

Poetry умеет работать с разными версиями Python, установленными в системе:

```bash
# Показать доступные окружения
poetry env list

# Использовать конкретную версию Python для проекта
poetry env use 3.11
poetry env use /usr/bin/python3.12

# Удалить окружение
poetry env remove 3.11
```

## Файл poetry.lock

Файл `poetry.lock` содержит точные версии всех зависимостей (включая транзитивные) с хешами для проверки целостности. Это гарантирует, что все участники команды и CI/CD-системы используют идентичные пакеты.

```bash
# Установка с использованием lock-файла (воспроизводимая установка)
poetry install

# Обновить lock-файл без изменения pyproject.toml
poetry lock

# Обновить lock-файл без установки пакетов
poetry lock --no-update
```

`poetry.lock` необходимо коммитить в репозиторий для приложений. Для библиотек, которые публикуются в PyPI, lock-файл в репозиторий не включают, поскольку пользователи будут разрешать версии самостоятельно в контексте своих проектов.

## Группы зависимостей

Poetry поддерживает группировку зависимостей для разных контекстов использования:

```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
black = "^23.0.0"

[tool.poetry.group.docs.dependencies]
sphinx = "^7.2.0"
mkdocs = "^1.5.0"

[tool.poetry.group.test.dependencies]
pytest-cov = "^4.1.0"
httpx = "^0.25.0"
```

Установка с выбором групп:

```bash
# Установить только основные зависимости
poetry install --only main

# Исключить группу docs
poetry install --without docs

# Установить только конкретные группы
poetry install --only main,test
```

## Публикация пакетов

### Сборка дистрибутива

```bash
poetry build
```

Команда создаст директорию `dist/` с двумя файлами:
- `my_project-0.1.0.tar.gz` — source distribution
- `my_project-0.1.0-py3-none-any.whl` — wheel-пакет

### Публикация в PyPI

```bash
# Настройте токен PyPI
poetry config pypi-token.pypi your-token-here

# Опубликуйте пакет
poetry publish

# Сборка и публикация одной командой
poetry publish --build
```

### Использование приватного репозитория

```bash
# Добавить приватный репозиторий
poetry config repositories.company https://pypi.company.com/simple/

# Настроить учётные данные
poetry config http-basic.company username password

# Публиковать в приватный репозиторий
poetry publish --repository company
```

## Скрипты и точки входа

Poetry позволяет определять CLI-команды, которые будут доступны после установки пакета:

```toml
[tool.poetry.scripts]
my-cli = "my_project.cli:main"
start-server = "my_project.server:run"
```

После установки пакета команда `my-cli` станет доступна в окружении:

```python
# my_project/cli.py
def main():
    print("CLI запущен")
```

```bash
poetry run my-cli
# или после активации окружения:
my-cli
```

## Интеграция с инструментами разработки

### Настройка в pyproject.toml

Можно хранить конфигурацию сторонних инструментов прямо в `pyproject.toml`:

```toml
[tool.black]
line-length = 88
target-version = ["py311"]

[tool.mypy]
python_version = "3.11"
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = "--tb=short"

[tool.ruff]
line-length = 88
select = ["E", "F", "I"]
```

### Makefile для автоматизации задач

Удобно использовать `Makefile` совместно с Poetry:

```makefile
.PHONY: install test lint format

install:
	poetry install

test:
	poetry run pytest tests/ -v

lint:
	poetry run mypy .
	poetry run ruff check .

format:
	poetry run black .
	poetry run ruff check --fix .
```

## Экспорт в requirements.txt

Если нужно совместимость с инструментами, которые используют `requirements.txt` (например, Docker или некоторые CI-системы):

```bash
# Экспортировать без dev-зависимостей
poetry export -f requirements.txt --output requirements.txt --without-hashes

# Экспортировать с хешами для максимальной безопасности
poetry export -f requirements.txt --output requirements.txt

# Экспортировать только dev-зависимости
poetry export -f requirements.txt --output requirements-dev.txt --only dev
```

Пример Dockerfile с использованием экспортированного файла:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"]
```

## Типичные проблемы и их решения

### Конфликты версий

Если Poetry не может разрешить зависимости, он сообщит о конфликте:

```bash
Because package-a requires python ^3.9
 and package-b requires python ^3.11
 version solving failed.
```

Проверьте совместимость версий пакетов и при необходимости зафиксируйте версию одного из них:

```bash
poetry add "package-a@^1.5" "package-b@^2.0"
```

### Медленное разрешение зависимостей

Poe the Poet и другие инструменты могут замедлять работу. Чтобы ускорить установку:

```bash
# Использовать экспериментальный новый установщик
poetry config installer.modern-installation true

# Параллельная установка
poetry config installer.parallel true
```

### Сброс конфигурации

```bash
# Показать текущую конфигурацию
poetry config --list

# Сбросить конкретную настройку
poetry config virtualenvs.in-project --unset
```

## Сравнение с pip и другими инструментами

| Возможность | pip + venv | Poetry | PDM | Hatch |
|---|---|---|---|---|
| Виртуальные окружения | Вручную | Автоматически | Автоматически | Автоматически |
| Lock-файл | Нет | `poetry.lock` | `pdm.lock` | Нет |
| Разделение dev/prod | Нет | Да (группы) | Да | Да |
| Публикация пакетов | Через twine | Встроено | Встроено | Встроено |
| Стандарт pyproject.toml | Частично | Да | Да | Да |

Poetry — один из наиболее зрелых и популярных инструментов, с большим сообществом и хорошей документацией. PDM немного ближе к стандартам PEP, но Poetry подходит большинству проектов.

## Заключение

Poetry значительно упрощает управление Python-проектами: вместо нескольких разрозненных инструментов вы получаете единый интерфейс для управления зависимостями, виртуальными окружениями и публикацией пакетов. Ключевые преимущества — воспроизводимые сборки через `poetry.lock`, чёткое разделение production и dev-зависимостей, а также простой синтаксис для описания версионных ограничений.

Для углублённого изучения Python, включая работу с модулями, пакетами и современными инструментами разработки, рекомендуем курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=poetry-dependency-management