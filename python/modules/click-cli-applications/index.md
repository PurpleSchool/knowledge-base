---
metaTitle: "Python click: создание CLI-приложений с нуля"
metaDescription: "Полное руководство по библиотеке click для Python. Создание команд, опций, аргументов, групп команд и интерактивных CLI-приложений."
author: "Антон Ларичев"
title: "Python click: создание CLI-приложений"
preview: "Как создавать профессиональные командные интерфейсы на Python с помощью библиотеки click: команды, опции, аргументы и группы."
---

## Что такое click и зачем он нужен

click — библиотека для создания интерфейсов командной строки (CLI) на Python. Она позволяет превратить обычную функцию в полноценную консольную команду с аргументами, опциями, подсказками и автодополнением — без написания парсеров вручную.

По сравнению со стандартным модулем `argparse`, click использует декораторы вместо конфигурации объектов, что делает код декларативным и читаемым. Flask, Poetry, AWS CLI и многие другие популярные инструменты построены именно на click.

## Установка

```bash
pip install click
```

Проверить установку:

```bash
python -c "import click; print(click.__version__)"
```

## Первая команда

Минимальный пример CLI-команды:

```python
import click

@click.command()
def hello():
    click.echo("Привет, мир!")

if __name__ == "__main__":
    hello()
```

Запуск:

```bash
python app.py
# Привет, мир!

python app.py --help
# Usage: app.py [OPTIONS]
# Options:
#   --help  Show this message and exit.
```

Декоратор `@click.command()` регистрирует функцию как CLI-команду. `click.echo()` используется вместо `print()` — он корректно обрабатывает кодировки и перенаправление вывода.

## Опции (Options)

Опции — именованные параметры, которые передаются через `--name value`.

```python
import click

@click.command()
@click.option("--name", default="мир", help="Имя для приветствия")
@click.option("--count", default=1, type=int, help="Количество повторений")
def greet(name, count):
    for _ in range(count):
        click.echo(f"Привет, {name}!")

if __name__ == "__main__":
    greet()
```

```bash
python app.py --name Антон --count 3
# Привет, Антон!
# Привет, Антон!
# Привет, Антон!
```

### Обязательные опции

По умолчанию опции необязательны. Чтобы сделать опцию обязательной, используйте `required=True`:

```python
@click.command()
@click.option("--email", required=True, help="Email пользователя")
def register(email):
    click.echo(f"Регистрация: {email}")
```

### Флаги (boolean options)

Флаги — опции без значения, которые включают или выключают режим:

```python
@click.command()
@click.option("--verbose", "-v", is_flag=True, help="Подробный вывод")
@click.option("--dry-run", is_flag=True, help="Симуляция без применения")
def deploy(verbose, dry_run):
    if verbose:
        click.echo("Режим подробного вывода включён")
    if dry_run:
        click.echo("[DRY RUN] Деплой пропущен")
    else:
        click.echo("Деплой выполнен")
```

```bash
python app.py --verbose --dry-run
```

### Короткие псевдонимы

Можно задать несколько имён для одной опции:

```python
@click.option("--output", "-o", help="Путь для сохранения результата")
```

## Аргументы (Arguments)

Аргументы — позиционные параметры без имени, передаются напрямую:

```python
import click

@click.command()
@click.argument("source")
@click.argument("destination")
def copy_file(source, destination):
    click.echo(f"Копирование {source} -> {destination}")

if __name__ == "__main__":
    copy_file()
```

```bash
python app.py file.txt backup/file.txt
# Копирование file.txt -> backup/file.txt
```

Отличие аргументов от опций: аргументы обязательны по умолчанию и не имеют `--` префикса. Используйте аргументы для основных входных данных, опции — для настроек.

### Множественные аргументы

```python
@click.command()
@click.argument("files", nargs=-1)
def process(files):
    for f in files:
        click.echo(f"Обработка: {f}")
```

```bash
python app.py a.txt b.txt c.txt
```

## Типы данных

click автоматически конвертирует и валидирует типы:

```python
import click

@click.command()
@click.option("--port", type=int, default=8080)
@click.option("--ratio", type=float, default=0.5)
@click.option("--mode", type=click.Choice(["dev", "prod", "test"]))
@click.option("--config", type=click.Path(exists=True))
@click.option("--output", type=click.File("w"), default="-")
def server(port, ratio, mode, config, output):
    click.echo(f"Порт: {port}, режим: {mode}", file=output)
```

- `click.Choice` — значение должно быть из списка
- `click.Path` — путь к файлу или директории с валидацией
- `click.File` — открывает файл автоматически (`"-"` означает stdin/stdout)
- `click.IntRange`, `click.FloatRange` — числа в диапазоне

```python
@click.option("--workers", type=click.IntRange(1, 32), default=4)
```

## Группы команд

Группы позволяют создавать CLI с подкомандами, как у `git` или `docker`:

```python
import click

@click.group()
def cli():
    pass

@cli.command()
@click.argument("name")
def create(name):
    click.echo(f"Создание проекта: {name}")

@cli.command()
@click.argument("name")
def delete(name):
    click.secho(f"Удаление проекта: {name}", fg="red")

@cli.command(name="list")
def list_projects():
    click.echo("Список проектов:")
    for p in ["alpha", "beta", "gamma"]:
        click.echo(f"  - {p}")

if __name__ == "__main__":
    cli()
```

```bash
python app.py --help
# Usage: app.py [OPTIONS] COMMAND [ARGS]...
# Commands:
#   create
#   delete
#   list

python app.py create my-project
python app.py list
```

### Вложенные группы

```python
@click.group()
def db():
    pass

@db.command()
def migrate():
    click.echo("Миграция БД")

@db.command()
def rollback():
    click.echo("Откат БД")

cli.add_command(db)
```

```bash
python app.py db migrate
python app.py db rollback
```

## Контекст и передача данных между командами

Для передачи общего состояния между группой и подкомандами используется контекст:

```python
import click

@click.group()
@click.option("--debug", is_flag=True)
@click.pass_context
def cli(ctx, debug):
    ctx.ensure_object(dict)
    ctx.obj["debug"] = debug

@cli.command()
@click.pass_context
def run(ctx):
    if ctx.obj["debug"]:
        click.echo("[DEBUG] Запуск в режиме отладки")
    click.echo("Приложение запущено")

if __name__ == "__main__":
    cli()
```

```bash
python app.py --debug run
# [DEBUG] Запуск в режиме отладки
# Приложение запущено
```

`@click.pass_context` передаёт объект контекста первым аргументом. `ctx.obj` — словарь для произвольных данных.

## Интерактивный ввод

### Промпты

```python
@click.command()
@click.option("--name", prompt="Введите имя", help="Ваше имя")
@click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
def signup(name, password):
    click.echo(f"Пользователь {name} зарегистрирован")
```

Если опция не передана через CLI, click запросит её интерактивно. `hide_input=True` скрывает ввод для паролей. `confirmation_prompt=True` просит ввести значение дважды.

### Подтверждение действий

```python
@click.command()
@click.argument("name")
def remove(name):
    click.confirm(f'Удалить "{name}"?', abort=True)
    click.echo(f"{name} удалён")
```

```bash
python app.py remove project-alpha
# Удалить "project-alpha"? [y/N]: n
# Aborted!
```

`abort=True` прерывает выполнение при отказе.

### Функция click.prompt()

```python
@click.command()
def setup():
    host = click.prompt("Хост БД", default="localhost")
    port = click.prompt("Порт", default=5432, type=int)
    click.echo(f"Подключение к {host}:{port}")
```

## Цветной вывод и стилизация

```python
@click.command()
def status():
    click.secho("OK", fg="green", bold=True)
    click.secho("ПРЕДУПРЕЖДЕНИЕ", fg="yellow")
    click.secho("ОШИБКА", fg="red", err=True)

    # Стилизация части строки
    click.echo("Статус: " + click.style("активен", fg="green"))
```

Параметры `click.secho` и `click.style`:
- `fg` — цвет текста: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`
- `bg` — цвет фона
- `bold`, `dim`, `underline`, `blink`, `reverse` — форматирование
- `err=True` — вывод в stderr

## Прогресс-бар

```python
import click
import time

@click.command()
@click.argument("count", type=int, default=10)
def process(count):
    items = range(count)
    with click.progressbar(items, label="Обработка") as bar:
        for item in bar:
            time.sleep(0.1)
    click.secho("Готово!", fg="green")
```

```bash
python app.py 20
# Обработка  [####################################]  100%
# Готово!
```

## Пагинация длинного вывода

```python
@click.command()
def show_logs():
    logs = "\n".join([f"Строка {i}" for i in range(1, 201)])
    click.echo_via_pager(logs)
```

Вывод откроется в пейджере (less/more), что удобно для длинных отчётов.

## Практический пример: файловый менеджер

Соберём полноценный CLI-инструмент для работы с файлами:

```python
import click
import os
import shutil
from pathlib import Path

@click.group()
@click.version_option(version="1.0.0")
def cli():
    """Файловый менеджер — утилита для работы с файлами."""
    pass

@cli.command()
@click.argument("directory", default=".", type=click.Path(exists=True))
@click.option("--ext", help="Фильтр по расширению (например: .py)")
@click.option("--sort", type=click.Choice(["name", "size", "date"]), default="name")
def ls(directory, ext, sort):
    """Список файлов в директории."""
    path = Path(directory)
    files = list(path.iterdir())

    if ext:
        files = [f for f in files if f.suffix == ext]

    if sort == "size":
        files.sort(key=lambda f: f.stat().st_size if f.is_file() else 0)
    elif sort == "date":
        files.sort(key=lambda f: f.stat().st_mtime)
    else:
        files.sort(key=lambda f: f.name)

    for f in files:
        if f.is_dir():
            click.secho(f"[DIR]  {f.name}", fg="blue")
        else:
            size = f.stat().st_size
            click.echo(f"[FILE] {f.name} ({size} байт)")

@cli.command()
@click.argument("source", type=click.Path(exists=True))
@click.argument("destination")
@click.option("--overwrite", is_flag=True, help="Перезаписать существующий файл")
def cp(source, destination, overwrite):
    """Копирование файла."""
    dest_path = Path(destination)
    if dest_path.exists() and not overwrite:
        click.confirm(f'"{destination}" уже существует. Перезаписать?', abort=True)
    shutil.copy2(source, destination)
    click.secho(f"Скопировано: {source} -> {destination}", fg="green")

@cli.command()
@click.argument("path", type=click.Path(exists=True))
@click.option("--force", "-f", is_flag=True, help="Без подтверждения")
def rm(path, force):
    """Удаление файла или директории."""
    if not force:
        click.confirm(f'Удалить "{path}"?', abort=True)
    p = Path(path)
    if p.is_dir():
        shutil.rmtree(path)
    else:
        p.unlink()
    click.secho(f"Удалено: {path}", fg="red")

@cli.command()
@click.argument("path")
def mkdir(path):
    """Создание директории."""
    Path(path).mkdir(parents=True, exist_ok=True)
    click.secho(f"Директория создана: {path}", fg="green")

if __name__ == "__main__":
    cli()
```

Пример использования:

```bash
python fm.py --help
python fm.py ls --sort size --ext .py
python fm.py cp src.txt dst.txt --overwrite
python fm.py mkdir projects/new-app
python fm.py rm old-file.txt --force
```

## Тестирование CLI-команд

click предоставляет `CliRunner` для юнит-тестов без запуска процессов:

```python
from click.testing import CliRunner
from app import greet

def test_greet_default():
    runner = CliRunner()
    result = runner.invoke(greet)
    assert result.exit_code == 0
    assert "Привет, мир!" in result.output

def test_greet_with_name():
    runner = CliRunner()
    result = runner.invoke(greet, ["--name", "Антон", "--count", "2"])
    assert result.exit_code == 0
    assert result.output.count("Привет, Антон!") == 2

def test_greet_invalid_count():
    runner = CliRunner()
    result = runner.invoke(greet, ["--count", "abc"])
    assert result.exit_code != 0
```

## Установка как пакета

Чтобы команда запускалась глобально без `python app.py`, настройте `pyproject.toml`:

```toml
[project.scripts]
fm = "fm:cli"
```

Или `setup.py`:

```python
setup(
    entry_points={
        "console_scripts": [
            "fm=fm:cli",
        ],
    },
)
```

После `pip install -e .` команда `fm` доступна в системе:

```bash
fm ls --sort size
fm mkdir new-dir
```

## Итоги

click покрывает весь типичный спектр задач CLI-разработки:

- Простые команды через `@click.command()`
- Опции (`@click.option`) и аргументы (`@click.argument`) с типизацией
- Группы подкоманд через `@click.group()`
- Интерактивные промпты и подтверждения
- Цветной вывод, прогресс-бары, пагинация
- Встроенный `--help` и `--version`
- Тестирование через `CliRunner`

Для углублённого изучения Python и написания профессионального кода — курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=click-cli-applications
