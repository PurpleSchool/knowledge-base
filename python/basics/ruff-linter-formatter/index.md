---
metaTitle: "Ruff: линтер и форматтер Python-кода"
metaDescription: "Ruff — быстрый линтер и форматтер для Python. Устанавливаем, настраиваем, интегрируем в проект и CI/CD. Замена flake8, black и isort."
author: "Антон Ларичев"
title: "Ruff — линтер и форматтер кода на Python"
preview: "Разбираем ruff — ультрабыстрый линтер и форматтер Python, написанный на Rust. Настройка, правила, интеграция с редактором и CI."
---

## Что такое Ruff

Ruff — линтер и форматтер Python-кода, написанный на Rust. Он появился в 2022 году и быстро занял место главного инструмента статического анализа в Python-проектах благодаря одному ключевому свойству: работает в 10–100 раз быстрее аналогов.

До ruff стандартный стек выглядел так: flake8 для проверки стиля, isort для сортировки импортов, pyupgrade для обновления синтаксиса, black для форматирования. Каждый инструмент — отдельная зависимость, отдельная конфигурация, отдельный запуск. Ruff заменяет всё это одним бинарником.

Главные преимущества:

- Единый инструмент вместо четырёх и более
- Скорость: 10–100 мс на больших кодовых базах вместо нескольких секунд
- Более 800 встроенных правил, совместимых с flake8, pylint, isort и другими
- Автоматическое исправление большинства найденных проблем
- Встроенный форматтер, совместимый с black по стилю

## Установка

Ruff устанавливается через pip или любой другой пакетный менеджер:

```bash
pip install ruff
```

Если вы используете uv (рекомендуемый способ для новых проектов):

```bash
uv add --dev ruff
```

Проверить установку:

```bash
ruff --version
# ruff 0.6.0
```

Ruff также можно установить как отдельный бинарник без Python-окружения — через pipx:

```bash
pipx install ruff
```

## Первый запуск

Проверка текущей директории:

```bash
ruff check .
```

Проверка конкретного файла:

```bash
ruff check src/main.py
```

Автоматическое исправление найденных проблем:

```bash
ruff check --fix .
```

Форматирование кода:

```bash
ruff format .
```

Просмотр того, что изменится при форматировании, без реального изменения файлов:

```bash
ruff format --diff .
```

## Конфигурация

Ruff читает конфигурацию из файлов `ruff.toml`, `pyproject.toml` или `.ruff.toml`. Рекомендуется использовать `pyproject.toml`, чтобы держать всё в одном месте.

Минимальная конфигурация в `pyproject.toml`:

```toml
[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "W", "I"]
```

### Основные параметры

`line-length` — максимальная длина строки. По умолчанию 88 (совпадает с black).

`target-version` — версия Python, для которой пишется код. Влияет на правила, связанные с синтаксисом.

`src` — пути к исходным файлам. Ruff использует это для корректного определения первой и сторонней части в импортах:

```toml
[tool.ruff]
src = ["src", "tests"]
```

`exclude` — директории и файлы, которые нужно игнорировать:

```toml
[tool.ruff]
exclude = [
    ".venv",
    "migrations",
    "__pycache__",
]
```

## Правила линтера

Все правила сгруппированы в наборы (prefix). Каждый набор соответствует оригинальному инструменту или категории:

| Префикс | Источник |
|---------|----------|
| `E`, `W` | pycodestyle (PEP 8) |
| `F` | pyflakes |
| `I` | isort |
| `N` | pep8-naming |
| `UP` | pyupgrade |
| `B` | flake8-bugbear |
| `S` | flake8-bandit (безопасность) |
| `PT` | flake8-pytest-style |
| `SIM` | flake8-simplify |
| `RUF` | собственные правила ruff |

### Выбор правил

В разделе `[tool.ruff.lint]` указываются правила через `select` и `ignore`:

```toml
[tool.ruff.lint]
# Включить группы правил
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "N",    # pep8-naming
    "UP",   # pyupgrade
    "B",    # flake8-bugbear
    "SIM",  # flake8-simplify
    "RUF",  # ruff-specific
]

# Исключить конкретные правила
ignore = [
    "E501",   # line too long (контролируем через line-length)
    "B008",   # do not perform function calls in default arguments
]
```

Чтобы включить все правила сразу:

```toml
[tool.ruff.lint]
select = ["ALL"]
ignore = ["D"]  # исключаем docstring-правила, если они не нужны
```

### Примеры того, что ловит ruff

```python
# F401: импорт не используется
import os
import sys  # используется ниже

# F841: переменная определена, но не используется
def calculate(x, y):
    result = x + y
    unused = x * y  # F841
    return result

# E711: сравнение с None через == вместо is
def check(value):
    if value == None:  # E711
        return False
    return True

# UP006: используй list вместо List из typing (Python 3.9+)
from typing import List

def get_items() -> List[str]:  # UP006
    return []

# SIM102: объединённые if в один
def process(a, b):
    if a > 0:       # SIM102: можно написать `if a > 0 and b > 0:`
        if b > 0:
            return True
    return False
```

### Подавление правил в коде

Иногда нужно отключить конкретное правило для строки или блока:

```python
import os  # noqa: F401

# Отключить несколько правил для строки
result = eval(user_input)  # noqa: S307, B023

# Отключить для всего файла — в начале файла
# ruff: noqa: F401
```

## Форматтер

Ruff format реализует стиль форматирования, совместимый с black. Если вы уже используете black, переход на ruff format практически не изменит код.

Основные принципы форматирования:

- Одинарные или двойные кавычки — выбор делается автоматически в пользу минимизации экранирования
- Trailing comma в многострочных выражениях
- Аргументы функций переносятся на отдельные строки при превышении длины строки

Пример:

```python
# До форматирования
def long_function_name(argument_one,argument_two,argument_three,argument_four):
    return argument_one+argument_two

x={'key1': 'value1','key2': 'value2','key3': 'value3','key4': 'value4'}

# После ruff format
def long_function_name(
    argument_one, argument_two, argument_three, argument_four
):
    return argument_one + argument_two

x = {
    "key1": "value1",
    "key2": "value2",
    "key3": "value3",
    "key4": "value4",
}
```

### Настройка форматтера

```toml
[tool.ruff.format]
# Стиль кавычек: double (по умолчанию) или single
quote-style = "double"

# Стиль отступов: space (по умолчанию) или tab
indent-style = "space"

# Пропускать ли волшебные trailing-запятые
skip-magic-trailing-comma = false

# Стиль переноса строк: lf, crlf, cr или native
line-ending = "lf"
```

## Полная конфигурация для реального проекта

Пример `pyproject.toml` для Django или FastAPI проекта:

```toml
[tool.ruff]
line-length = 88
target-version = "py311"
src = ["src"]
exclude = [
    ".venv",
    "*/migrations/*",
    "__pycache__",
]

[tool.ruff.lint]
select = [
    "E",
    "W",
    "F",
    "I",
    "N",
    "UP",
    "B",
    "SIM",
    "RUF",
]
ignore = [
    "N805",   # first argument of a method should be named 'self'
    "B008",   # do not perform function calls in default arguments (нужно для FastAPI Depends)
]

[tool.ruff.lint.isort]
known-first-party = ["src"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
line-ending = "lf"
```

## Интеграция с VS Code

Установите официальное расширение Ruff из маркетплейса VS Code (publisher: `charliermarsh`).

Настройки в `.vscode/settings.json`:

```json
{
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.codeActionsOnSave": {
        "source.fixAll.ruff": "explicit",
        "source.organizeImports.ruff": "explicit"
    },
    "[python]": {
        "editor.defaultFormatter": "charliermarsh.ruff"
    }
}
```

После этого каждое сохранение файла будет автоматически форматировать код и исправлять проблемы линтера.

## Интеграция с pre-commit

pre-commit запускает проверки перед каждым коммитом. Добавьте ruff в `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

Установка хуков:

```bash
pip install pre-commit
pre-commit install
```

Теперь при попытке закоммитить файлы с проблемами ruff остановит коммит и покажет, что нужно исправить. Флаг `--fix` автоматически исправит то, что можно исправить.

## Интеграция в CI/CD

### GitHub Actions

```yaml
name: Lint and Format

on: [push, pull_request]

jobs:
  ruff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install ruff
        run: pip install ruff

      - name: Check with ruff lint
        run: ruff check .

      - name: Check with ruff format
        run: ruff format --check .
```

Флаг `--check` в `ruff format` не изменяет файлы, а возвращает ненулевой код выхода, если файлы не отформатированы. Это позволяет использовать команду в CI без изменения файлов.

### GitLab CI

```yaml
lint:
  image: python:3.11
  script:
    - pip install ruff
    - ruff check .
    - ruff format --check .
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Миграция с существующих инструментов

Если в проекте уже используются flake8, black и isort, ruff предоставляет команду для анализа совместимости:

```bash
# Посмотреть, какие правила flake8 покрывает ruff
ruff rule --all | grep -i flake8
```

Общая стратегия миграции:

1. Установить ruff и запустить `ruff check .` — посмотреть текущее состояние
2. Добавить существующие игнорируемые правила в `ignore`
3. Убедиться, что количество ошибок совпадает с тем, что выдавал flake8
4. Удалить flake8, isort, pyupgrade из зависимостей
5. Заменить black на `ruff format`

Ruff понимает конфигурацию flake8 из `setup.cfg` и `.flake8`, что упрощает первичную миграцию.

## Полезные команды

Посмотреть все доступные правила:

```bash
ruff rule --all
```

Подробное описание конкретного правила:

```bash
ruff rule E501
```

Проверить конфигурацию:

```bash
ruff check --show-settings .
```

Статистика нарушений по правилам:

```bash
ruff check --statistics .
```

Проверить файл и показать исходный код нарушений:

```bash
ruff check --show-source src/main.py
```

Исправить только безопасные автоматические исправления:

```bash
ruff check --fix .
```

Исправить в том числе «небезопасные» исправления (меняют поведение):

```bash
ruff check --fix --unsafe-fixes .
```

## Ruff vs другие инструменты

Ruff не заменяет инструменты с принципиально другими задачами:

- **mypy / pyright** — статическая проверка типов. Ruff не анализирует типы, только стиль и очевидные ошибки.
- **pytest** — тестирование. Ruff только помогает писать тесты в правильном стиле (правила PT).
- **bandit** — глубокий анализ безопасности. Ruff включает базовый набор правил безопасности (S), но не заменяет специализированный инструмент для аудита.

Для полного стека рекомендуется использовать ruff вместе с mypy или pyright.

## Итог

Ruff решает реальную проблему Python-экосистемы: фрагментацию инструментов линтинга и форматирования. Вместо пяти конфигурационных файлов и пяти команд — один инструмент с единой конфигурацией в `pyproject.toml`.

Практическое правило: если вы начинаете новый Python-проект, ставьте ruff с первого дня. Если переходите с существующего стека — потратьте час на миграцию, и получите более быстрый и простой CI.

Для глубокого погружения в Python и профессиональные инструменты разработки смотрите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=ruff-linter-formatter