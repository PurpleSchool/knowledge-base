---
metaTitle: "Python rich: красивый вывод в терминале"
metaDescription: "Библиотека rich для Python — таблицы, прогресс-бары, подсветка синтаксиса и панели в терминале. Практические примеры с кодом."
author: "Антон Ларичев"
title: "Python rich: красивый вывод в терминале"
preview: "Разбираем библиотеку rich: как создавать таблицы, прогресс-бары, панели и подсветку синтаксиса в терминале Python."
---

## Что такое rich

`rich` — библиотека для Python, которая позволяет создавать красивый, структурированный вывод в терминале с поддержкой цветов, таблиц, прогресс-баров, панелей, подсветки синтаксиса и многого другого. Библиотека работает с большинством современных терминалов и является одним из самых популярных инструментов для улучшения CLI-приложений.

## Установка

Установка выполняется через pip:

```bash
pip install rich
```

После установки можно проверить работу библиотеки прямо из командной строки:

```bash
python -m rich
```

Вы увидите демонстрацию всех возможностей библиотеки.

## Базовый вывод с разметкой

Самый простой способ начать работу — импортировать `print` из `rich`:

```python
from rich import print

print("[bold red]Ошибка![/bold red] Что-то пошло не так.")
print("[green]Успешно[/green] выполнено.")
print("[blue underline]https://example.com[/blue underline]")
```

Rich поддерживает разметку в стиле BBCode: теги окружают текст и задают его стиль. Можно комбинировать несколько стилей одновременно.

### Стили текста

Доступные стили:
- `bold` — жирный
- `italic` — курсив
- `underline` — подчёркнутый
- `strike` — зачёркнутый
- `reverse` — инвертированные цвета

### Цвета

Rich поддерживает стандартные цвета, 256-цветный режим и true color:

```python
from rich import print

# Стандартные цвета
print("[red]Красный[/red]")
print("[green]Зелёный[/green]")
print("[yellow]Жёлтый[/yellow]")

# 256-цветный режим
print("[color(208)]Оранжевый[/color]")

# True color (hex)
print("[#ff6347]Tomato color[/]")

# Цвет фона
print("[on blue]Синий фон[/on blue]")
print("[white on red]Белый текст на красном фоне[/white on red]")
```

## Console — основной объект

Для более гибкого управления выводом используется объект `Console`:

```python
from rich.console import Console

console = Console()

console.print("Обычный текст")
console.print("[bold]Жирный текст[/bold]")
console.print("Текст", style="bold red underline")
```

`Console` позволяет настраивать параметры вывода:

```python
from rich.console import Console
import io

# Вывод в stderr
error_console = Console(stderr=True, style="bold red")

# Ограничение ширины
narrow_console = Console(width=60)

# Отключение разметки
plain_console = Console(markup=False)

# Вывод в файл
file_console = Console(file=io.StringIO())
```

### Логирование через Console

```python
from rich.console import Console

console = Console()

console.log("Запрос обработан", style="green")
console.log("Предупреждение: медленный запрос", style="yellow")
```

Метод `log` автоматически добавляет временную метку и имя файла с номером строки.

## Таблицы

Таблицы — одна из самых полезных возможностей rich:

```python
from rich.console import Console
from rich.table import Table

console = Console()

table = Table(title="Список пользователей")

table.add_column("ID", style="dim", width=6)
table.add_column("Имя", style="cyan", no_wrap=True)
table.add_column("Email", style="magenta")
table.add_column("Роль", justify="right", style="green")

table.add_row("1", "Алексей Иванов", "alexey@example.com", "admin")
table.add_row("2", "Мария Смирнова", "maria@example.com", "user")
table.add_row("3", "Дмитрий Козлов", "dmitry@example.com", "moderator")

console.print(table)
```

### Настройка внешнего вида таблицы

```python
from rich.table import Table
from rich.console import Console

console = Console()

table = Table(
    title="Статистика",
    box=None,
    show_header=True,
    header_style="bold blue",
    show_lines=True,
    padding=(0, 1),
)

table.add_column("Метрика", style="bold")
table.add_column("Значение", justify="right")
table.add_column("Изменение", justify="right")

table.add_row("Запросов/сек", "1,234", "[green]+12%[/green]")
table.add_row("Время ответа", "45ms", "[red]+5ms[/red]")
table.add_row("Ошибок", "0", "[green]0%[/green]")

console.print(table)
```

Rich предоставляет несколько встроенных стилей рамок через модуль `rich.box`:

```python
from rich import box
from rich.table import Table
from rich.console import Console

console = Console()

for box_style in [box.SIMPLE, box.MINIMAL, box.ROUNDED, box.DOUBLE]:
    table = Table(box=box_style, title=str(box_style))
    table.add_column("Колонка 1")
    table.add_column("Колонка 2")
    table.add_row("Данные 1", "Данные 2")
    console.print(table)
    console.print()
```

## Прогресс-бары

Rich предоставляет удобный API для отображения прогресса:

```python
import time
from rich.progress import Progress

with Progress() as progress:
    task = progress.add_task("[green]Загрузка...", total=100)

    while not progress.finished:
        time.sleep(0.05)
        progress.update(task, advance=1)
```

### Несколько задач одновременно

```python
import time
from rich.progress import Progress

with Progress() as progress:
    task1 = progress.add_task("[red]Загрузка файлов...", total=100)
    task2 = progress.add_task("[green]Обработка данных...", total=200)
    task3 = progress.add_task("[cyan]Сохранение результатов...", total=50)

    while not progress.finished:
        time.sleep(0.02)
        progress.update(task1, advance=0.9)
        progress.update(task2, advance=1.8)
        progress.update(task3, advance=0.4)
```

### Настройка колонок прогресс-бара

```python
import time
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TaskProgressColumn,
    TimeRemainingColumn,
    TimeElapsedColumn,
    MofNCompleteColumn,
)

with Progress(
    SpinnerColumn(),
    TextColumn("[progress.description]{task.description}"),
    BarColumn(),
    TaskProgressColumn(),
    MofNCompleteColumn(),
    TimeElapsedColumn(),
    TimeRemainingColumn(),
) as progress:
    task = progress.add_task("[cyan]Обработка записей...", total=500)

    for i in range(500):
        time.sleep(0.01)
        progress.update(task, advance=1)
```

### track — упрощённый прогресс для итераций

Для простых случаев, когда нужно отобразить прогресс цикла, используйте `track`:

```python
import time
from rich.progress import track

items = list(range(100))

for item in track(items, description="Обработка..."):
    time.sleep(0.05)
    # обработка элемента
```

## Панели

Панели позволяют выделять блоки информации:

```python
from rich.console import Console
from rich.panel import Panel

console = Console()

console.print(Panel("Добро пожаловать в приложение!", title="Привет"))
console.print(Panel("[green]Операция выполнена успешно[/green]", title="Статус", border_style="green"))
console.print(Panel("[red]Ошибка подключения к базе данных[/red]", title="Ошибка", border_style="red"))
```

### Несколько панелей в ряд

```python
from rich.console import Console
from rich.panel import Panel
from rich.columns import Columns

console = Console()

panels = [
    Panel("CPU: 45%\nRAM: 2.1 GB", title="Ресурсы"),
    Panel("Запросов: 1,234\nОшибок: 0", title="Запросы"),
    Panel("Uptime: 14 дней\nВерсия: 2.1.0", title="Система"),
]

console.print(Columns(panels))
```

## Подсветка синтаксиса

Rich умеет выделять синтаксис кода прямо в терминале:

```python
from rich.console import Console
from rich.syntax import Syntax

console = Console()

code = '''
def fibonacci(n: int) -> list[int]:
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence[:n]

print(fibonacci(10))
'''

syntax = Syntax(code, "python", theme="monokai", line_numbers=True)
console.print(syntax)
```

### Подсветка из файла

```python
from rich.console import Console
from rich.syntax import Syntax

console = Console()

syntax = Syntax.from_path(
    "my_script.py",
    theme="dracula",
    line_numbers=True,
    line_range=(1, 30),
)
console.print(syntax)
```

## Красивые трейсбеки

Rich может заменить стандартный вывод ошибок более читаемым форматом:

```python
from rich.traceback import install

install(show_locals=True)

def process_data(data):
    items = data["items"]
    result = items[100]  # IndexError
    return result

process_data({"items": [1, 2, 3]})
```

Также можно выводить трейсбек вручную в блоке `except`:

```python
from rich.console import Console

console = Console()

try:
    x = 1 / 0
except Exception:
    console.print_exception(show_locals=True)
```

При `show_locals=True` rich показывает значения всех локальных переменных в каждом кадре стека — это значительно ускоряет отладку.

## Markdown

Rich рендерит Markdown прямо в терминале:

```python
from rich.console import Console
from rich.markdown import Markdown

console = Console()

markdown_text = """
# Заголовок первого уровня

## Заголовок второго уровня

Это **жирный** и *курсивный* текст.

- Пункт 1
- Пункт 2
- Пункт 3

> Это цитата

| Колонка 1 | Колонка 2 |
|-----------|-----------|
| Ячейка 1  | Ячейка 2  |
"""

console.print(Markdown(markdown_text))
```

## Spinner — индикатор загрузки

Для операций с неизвестным временем выполнения используйте spinner:

```python
import time
from rich.console import Console

console = Console()

with console.status("[bold green]Подключение к серверу...") as status:
    time.sleep(2)
    status.update("[bold yellow]Загрузка данных...")
    time.sleep(2)
    status.update("[bold blue]Обработка результатов...")
    time.sleep(1)

console.print("[bold green]Готово!")
```

## Tree — древовидные структуры

```python
from rich.console import Console
from rich.tree import Tree

console = Console()

tree = Tree("[bold]project/[/bold]")
src = tree.add("[cyan]src/[/cyan]")
src.add("[green]main.py[/green]")
src.add("[green]utils.py[/green]")
models = src.add("[cyan]models/[/cyan]")
models.add("[green]user.py[/green]")
models.add("[green]product.py[/green]")

tests = tree.add("[cyan]tests/[/cyan]")
tests.add("[green]test_main.py[/green]")
tests.add("[green]test_utils.py[/green]")

tree.add("[yellow]requirements.txt[/yellow]")
tree.add("[yellow]README.md[/yellow]")

console.print(tree)
```

## Inspect — исследование объектов

Rich предоставляет функцию `inspect` для красивого вывода информации об объектах Python:

```python
from rich import inspect

my_list = [1, 2, 3, "hello", {"key": "value"}]
inspect(my_list)

# Показать методы объекта
inspect(my_list, methods=True)

# Показать всё, включая приватные атрибуты
inspect(my_list, all=True)
```

## Практический пример: живой дашборд в терминале

Соберём несколько возможностей вместе — консольная утилита с живым обновлением метрик через `Live`:

```python
import time
import random
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import track
from rich.live import Live

console = Console()

def generate_metrics():
    return {
        "cpu": random.randint(10, 90),
        "memory": random.randint(30, 80),
        "requests": random.randint(100, 2000),
        "errors": random.randint(0, 10),
        "latency": random.randint(10, 500),
    }

def build_metrics_table(metrics):
    table = Table(show_header=True, header_style="bold blue", box=None)
    table.add_column("Метрика", style="bold")
    table.add_column("Значение", justify="right")
    table.add_column("Статус", justify="center")

    cpu = metrics["cpu"]
    cpu_status = "[green]OK[/green]" if cpu < 70 else "[red]HIGH[/red]"
    table.add_row("CPU", f"{cpu}%", cpu_status)

    mem = metrics["memory"]
    mem_status = "[green]OK[/green]" if mem < 75 else "[yellow]WARN[/yellow]"
    table.add_row("Memory", f"{mem}%", mem_status)

    table.add_row("Requests/s", str(metrics["requests"]), "[green]OK[/green]")

    errors = metrics["errors"]
    err_status = "[green]0[/green]" if errors == 0 else f"[red]{errors}[/red]"
    table.add_row("Errors", str(errors), err_status)

    latency = metrics["latency"]
    lat_status = "[green]OK[/green]" if latency < 200 else "[yellow]SLOW[/yellow]"
    table.add_row("Latency", f"{latency}ms", lat_status)

    return table

console.print(Panel(
    "[bold]Система мониторинга v1.0[/bold]\n[dim]Запуск...[/dim]",
    border_style="blue"
))

for _ in track(range(20), description="[cyan]Инициализация..."):
    time.sleep(0.05)

with Live(console=console, refresh_per_second=2) as live:
    for _ in range(10):
        metrics = generate_metrics()
        table = build_metrics_table(metrics)
        live.update(Panel(table, title="[bold]Метрики системы[/bold]", border_style="green"))
        time.sleep(0.5)

console.print("\n[bold green]Мониторинг завершён.[/bold green]")
```

Объект `Live` перерисовывает содержимое на месте, не прокручивая терминал — именно так работают большинство TUI-инструментов.

## Экспорт в файл и HTML

Rich может сохранять форматированный вывод:

```python
from rich.console import Console

# Запись в текстовый файл без ANSI-кодов
with open("output.txt", "w") as f:
    file_console = Console(file=f, no_color=True)
    file_console.print("Отчёт сгенерирован")

# Экспорт в HTML с сохранением стилей
console = Console(record=True)
console.print("[bold red]Заголовок отчёта[/bold red]")
console.print("Содержимое отчёта")

html = console.export_html()
with open("report.html", "w") as f:
    f.write(html)
```

Режим `record=True` буферизирует весь вывод в памяти, после чего его можно экспортировать как текст или HTML — удобно для генерации отчётов.

## Итог

Библиотека `rich` закрывает большинство потребностей при разработке CLI-утилит на Python: форматированный текст, таблицы, прогресс-бары, панели, подсветка синтаксиса, красивые трейсбеки и живые дашборды. Все компоненты хорошо интегрируются друг с другом и работают без сложной настройки. Достаточно знать несколько ключевых классов — `Console`, `Table`, `Progress`, `Panel`, `Live` — чтобы существенно улучшить опыт работы с вашими инструментами.

Если вы хотите глубже изучить Python и научиться создавать профессиональные приложения — приходите на курс по Python на PurpleSchool.

[Курс по Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-rich-terminal-output)