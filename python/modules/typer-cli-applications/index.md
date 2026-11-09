---
metaTitle: "Python Typer: создание CLI приложений"
metaDescription: "Полное руководство по созданию CLI приложений на Python с помощью библиотеки Typer — аргументы, опции, подкоманды, валидация."
author: "Антон Ларичев"
title: "Typer: создание CLI приложений на Python"
preview: "Как создавать профессиональные консольные приложения на Python с помощью Typer: от простых команд до сложных CLI с подкомандами и валидацией."
---

## Что такое Typer

Typer — это библиотека для создания CLI (Command Line Interface) приложений на Python, построенная поверх Click. Её главное отличие — использование Python-аннотаций типов для автоматического определения аргументов, опций и их валидации. Написана Себастьяном Рамиресом, автором FastAPI, и следует тем же принципам: минимум кода, максимум возможностей.

Если вы писали CLI на `argparse` или `Click`, вы оцените, насколько меньше кода нужно с Typer при том же результате.

## Установка

```bash
pip install typer
```

Для поддержки автодополнения в терминале и цветного вывода установите с extras:

```bash
pip install "typer[all]"
```

Это добавит `rich` для форматирования и `shellingham` для определения типа оболочки.

## Первое CLI приложение

Самый простой пример — функция с декоратором:

```python
import typer

app = typer.Typer()

@app.command()
def greet(name: str):
    print(f"Привет, {name}!")

if __name__ == "__main__":
    app()
```

Запуск:

```bash
python main.py Anton
# Привет, Anton!

python main.py --help
# Usage: main.py [OPTIONS] NAME
# ...
```

Typer автоматически создал аргумент `name` из параметра функции и сгенерировал справку. Никакой ручной настройки парсера.

## Аргументы и опции

Typer различает два типа входных данных:

- **Аргументы** — позиционные значения, обязательные по умолчанию
- **Опции** — именованные флаги вида `--name value`, необязательные по умолчанию

```python
import typer
from typing import Optional

app = typer.Typer()

@app.command()
def create_user(
    username: str,                          # аргумент — обязателен
    email: str,                             # аргумент — обязателен
    admin: bool = False,                    # опция --admin / --no-admin
    role: Optional[str] = None,             # опция --role TEXT
):
    print(f"Пользователь: {username}")
    print(f"Email: {email}")
    print(f"Роль: {role or 'user'}")
    print(f"Администратор: {admin}")

if __name__ == "__main__":
    app()
```

Пример вызова:

```bash
python main.py john john@example.com --admin --role manager
# Пользователь: john
# Email: john@example.com
# Роль: manager
# Администратор: True
```

### Явное объявление через Argument и Option

Для тонкой настройки используйте `typer.Argument` и `typer.Option`:

```python
import typer

app = typer.Typer()

@app.command()
def deploy(
    service: str = typer.Argument(..., help="Имя сервиса для деплоя"),
    env: str = typer.Option("staging", "--env", "-e", help="Целевое окружение"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Показать план без выполнения"),
    replicas: int = typer.Option(1, min=1, max=10, help="Количество реплик"),
):
    if dry_run:
        print(f"[DRY RUN] Деплой {service} в {env} ({replicas} реплик)")
    else:
        print(f"Деплой {service} в {env} ({replicas} реплик)")

if __name__ == "__main__":
    app()
```

`...` как значение по умолчанию означает, что параметр обязателен. Параметры `min` и `max` добавляют валидацию прямо в определении.

## Типы и автоматическая валидация

Typer использует аннотации типов Python для валидации входных данных. Если передать значение неверного типа — CLI выдаст понятную ошибку.

```python
import typer
from pathlib import Path
from datetime import datetime

app = typer.Typer()

@app.command()
def process(
    input_file: Path = typer.Argument(..., exists=True, readable=True),
    output_dir: Path = typer.Option(Path("./output"), writable=True),
    count: int = typer.Option(10, help="Количество записей"),
    since: datetime = typer.Option(None, help="Дата начала (YYYY-MM-DD)"),
):
    print(f"Файл: {input_file}")
    print(f"Выходная директория: {output_dir}")
    print(f"Количество: {count}")
    if since:
        print(f"С даты: {since.date()}")

if __name__ == "__main__":
    app()
```

Для `Path` доступны параметры: `exists`, `readable`, `writable`, `dir_okay`, `file_okay`. Если файл не существует, Typer вернёт ошибку до вызова функции.

### Enum как тип опции

```python
import typer
from enum import Enum

class LogLevel(str, Enum):
    debug = "debug"
    info = "info"
    warning = "warning"
    error = "error"

app = typer.Typer()

@app.command()
def run(
    level: LogLevel = typer.Option(LogLevel.info, help="Уровень логирования"),
):
    print(f"Запуск с уровнем: {level.value}")

if __name__ == "__main__":
    app()
```

Теперь `--level` принимает только допустимые значения, а автодополнение в терминале предложит варианты.

```bash
python main.py --level debug
python main.py --level invalid
# Error: Invalid value for '--level': 'invalid' is not one of 'debug', 'info', 'warning', 'error'.
```

## Подкоманды

Для сложных CLI с несколькими командами используйте несколько `@app.command()`:

```python
import typer

app = typer.Typer(help="Утилита для управления проектами")

@app.command()
def init(
    name: str = typer.Argument(..., help="Имя проекта"),
    template: str = typer.Option("default", help="Шаблон проекта"),
):
    """Инициализация нового проекта."""
    print(f"Создание проекта '{name}' из шаблона '{template}'")

@app.command()
def build(
    target: str = typer.Option("production", help="Целевое окружение"),
    clean: bool = typer.Option(False, help="Очистить перед сборкой"),
):
    """Сборка проекта."""
    if clean:
        print("Очистка...")
    print(f"Сборка для {target}")

@app.command()
def test(
    path: str = typer.Argument(".", help="Путь к тестам"),
    verbose: bool = typer.Option(False, "-v", "--verbose"),
):
    """Запуск тестов."""
    flags = "-v" if verbose else ""
    print(f"pytest {flags} {path}")

if __name__ == "__main__":
    app()
```

```bash
python main.py --help
python main.py init my-project --template fastapi
python main.py build --target staging --clean
python main.py test tests/ -v
```

### Вложенные группы команд

Для группировки подкоманд создайте отдельные `Typer()` и добавьте их как под-приложения:

```python
import typer

app = typer.Typer()
users_app = typer.Typer()
db_app = typer.Typer()

app.add_typer(users_app, name="users", help="Управление пользователями")
app.add_typer(db_app, name="db", help="Операции с базой данных")

@users_app.command("list")
def users_list():
    """Список всех пользователей."""
    print("Список пользователей...")

@users_app.command("create")
def users_create(username: str):
    """Создать пользователя."""
    print(f"Создание пользователя: {username}")

@db_app.command("migrate")
def db_migrate():
    """Запустить миграции."""
    print("Применение миграций...")

@db_app.command("backup")
def db_backup(output: str = typer.Option("backup.sql")):
    """Создать резервную копию."""
    print(f"Бэкап в {output}")

if __name__ == "__main__":
    app()
```

```bash
python main.py users list
python main.py users create admin
python main.py db migrate
python main.py db backup --output dump.sql
```

## Вывод с форматированием через Rich

Когда установлен `typer[all]`, доступен `typer.echo` и интеграция с `rich`:

```python
import typer
from rich.console import Console
from rich.table import Table
from rich.progress import track
import time

app = typer.Typer()
console = Console()

@app.command()
def status():
    """Показать статус сервисов."""
    table = Table(title="Статус сервисов")
    table.add_column("Сервис", style="cyan")
    table.add_column("Статус", style="bold")
    table.add_column("Версия")

    table.add_row("API", "[green]running[/green]", "2.1.0")
    table.add_row("Database", "[green]running[/green]", "14.5")
    table.add_row("Cache", "[yellow]degraded[/yellow]", "7.0.1")
    table.add_row("Queue", "[red]stopped[/red]", "3.1.2")

    console.print(table)

@app.command()
def sync(items: int = typer.Option(100, help="Количество элементов")):
    """Синхронизация данных с прогресс-баром."""
    for _ in track(range(items), description="Синхронизация..."):
        time.sleep(0.01)
    console.print("[bold green]Синхронизация завершена![/bold green]")

if __name__ == "__main__":
    app()
```

## Обработка ошибок и коды завершения

```python
import typer
import sys

app = typer.Typer()

@app.command()
def connect(
    host: str,
    port: int = typer.Option(5432, min=1, max=65535),
):
    """Подключение к серверу."""
    if host == "localhost" and port == 5432:
        typer.echo("Подключение...")
        typer.echo("Успешно подключено!", err=False)
        raise typer.Exit(code=0)

    typer.echo(f"Ошибка: не удалось подключиться к {host}:{port}", err=True)
    raise typer.Exit(code=1)

@app.command()
def dangerous_operation(
    confirm: bool = typer.Option(False, "--yes", "-y", help="Подтвердить выполнение"),
):
    """Опасная операция, требующая подтверждения."""
    if not confirm:
        confirmed = typer.confirm("Вы уверены? Это действие необратимо")
        if not confirmed:
            typer.echo("Операция отменена.")
            raise typer.Abort()

    typer.echo("Выполняю операцию...")

if __name__ == "__main__":
    app()
```

`typer.Abort()` завершает CLI с кодом 1 и сообщением `Aborted!`. `typer.Exit(code=N)` позволяет задать произвольный код завершения.

## Практический пример: менеджер задач

Соберём реалистичное CLI приложение — менеджер задач с JSON-хранилищем:

```python
import typer
import json
from pathlib import Path
from enum import Enum
from rich.console import Console
from rich.table import Table

app = typer.Typer(help="Менеджер задач")
console = Console()
DB_FILE = Path.home() / ".tasks.json"

class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

def load_tasks() -> list[dict]:
    if not DB_FILE.exists():
        return []
    return json.loads(DB_FILE.read_text())

def save_tasks(tasks: list[dict]):
    DB_FILE.write_text(json.dumps(tasks, ensure_ascii=False, indent=2))

@app.command()
def add(
    title: str = typer.Argument(..., help="Название задачи"),
    priority: Priority = typer.Option(Priority.medium, help="Приоритет"),
    tag: list[str] = typer.Option([], "--tag", "-t", help="Тег (можно несколько)"),
):
    """Добавить новую задачу."""
    tasks = load_tasks()
    task_id = max((t["id"] for t in tasks), default=0) + 1
    tasks.append({
        "id": task_id,
        "title": title,
        "priority": priority.value,
        "tags": tag,
        "done": False,
    })
    save_tasks(tasks)
    console.print(f"[green]Задача #{task_id} добавлена[/green]")

@app.command(name="list")
def list_tasks(
    show_done: bool = typer.Option(False, "--all", "-a", help="Показать завершённые"),
    priority: Priority = typer.Option(None, help="Фильтр по приоритету"),
):
    """Список задач."""
    tasks = load_tasks()
    if not show_done:
        tasks = [t for t in tasks if not t["done"]]
    if priority:
        tasks = [t for t in tasks if t["priority"] == priority.value]

    if not tasks:
        console.print("[yellow]Задач нет[/yellow]")
        return

    table = Table(show_header=True)
    table.add_column("ID", style="dim", width=4)
    table.add_column("Задача")
    table.add_column("Приоритет")
    table.add_column("Теги")
    table.add_column("Статус")

    priority_colors = {"high": "red", "medium": "yellow", "low": "green"}

    for task in tasks:
        color = priority_colors[task["priority"]]
        status = "[green]done[/green]" if task["done"] else "[blue]todo[/blue]"
        table.add_row(
            str(task["id"]),
            task["title"],
            f"[{color}]{task['priority']}[/{color}]",
            ", ".join(task["tags"]),
            status,
        )

    console.print(table)

@app.command()
def done(task_id: int = typer.Argument(..., help="ID задачи")):
    """Отметить задачу как выполненную."""
    tasks = load_tasks()
    for task in tasks:
        if task["id"] == task_id:
            task["done"] = True
            save_tasks(tasks)
            console.print(f"[green]Задача #{task_id} выполнена[/green]")
            return
    typer.echo(f"Задача #{task_id} не найдена", err=True)
    raise typer.Exit(code=1)

if __name__ == "__main__":
    app()
```

Пример использования:

```bash
python tasks.py add "Написать тесты" --priority high --tag backend --tag ci
python tasks.py add "Обновить документацию" --priority low
python tasks.py list
python tasks.py list --priority high
python tasks.py done 1
python tasks.py list --all
```

## Автодополнение в терминале

Typer поддерживает автодополнение для bash, zsh и fish. Для установки:

```bash
python main.py --install-completion
```

Для генерации скрипта без установки:

```bash
python main.py --show-completion
```

После установки `Tab` будет автодополнять команды, опции и даже значения Enum.

## Тестирование CLI

Typer предоставляет `CliRunner` для тестирования без реального терминала:

```python
from typer.testing import CliRunner
from main import app

runner = CliRunner()

def test_greet():
    result = runner.invoke(app, ["Anton"])
    assert result.exit_code == 0
    assert "Привет, Anton!" in result.output

def test_missing_argument():
    result = runner.invoke(app, [])
    assert result.exit_code != 0

def test_invalid_enum():
    result = runner.invoke(app, ["--level", "unknown"])
    assert result.exit_code == 2
    assert "Invalid value" in result.output
```

## Упаковка как консольную команду

Чтобы CLI был доступен как системная команда, добавьте в `pyproject.toml`:

```toml
[project.scripts]
mytool = "mypackage.cli:app"
```

После `pip install -e .` команда `mytool` будет доступна глобально:

```bash
mytool users list
mytool db migrate
```

## Сравнение с альтернативами

Typer не единственный вариант для CLI на Python:

- `argparse` — стандартная библиотека, многословна, нет аннотаций типов
- `Click` — основа Typer, мощный, но требует больше кода
- `Typer` — надстройка над Click, типобезопасный, минимум кода
- `docopt` — CLI из docstring, нестандартный подход

Typer выигрывает там, где важна типобезопасность и скорость разработки. Если проект уже на Click — смысла мигрировать нет, но для нового CLI Typer предпочтительнее.

---

Хотите глубже разобраться с Python и создавать профессиональные инструменты командной строки? Смотрите курс по Python на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-typer-cli