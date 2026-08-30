---
metaTitle: "Python argparse: разбор аргументов командной строки"
metaDescription: "Как использовать модуль argparse в Python для разбора аргументов командной строки: позиционные аргументы, флаги, типы, подкоманды и группы."
author: "Антон Ларичев"
title: "Python argparse: разбор аргументов командной строки"
preview: "Разбираем модуль argparse: как добавлять аргументы, задавать типы, значения по умолчанию, подкоманды и группы для CLI-инструментов на Python."
---

## Введение

Модуль `argparse` входит в стандартную библиотеку Python и предназначен для разбора аргументов командной строки. Он автоматически генерирует справочные сообщения, проверяет типы переданных значений и выдаёт понятные ошибки при неверном вводе. Это делает его предпочтительным инструментом для написания CLI-утилит.

Альтернативы вроде `sys.argv` требуют ручного разбора строки и обработки ошибок. Сторонние библиотеки (`click`, `typer`) добавляют удобства, но `argparse` не требует установки и покрывает большинство реальных задач.

## Базовая структура

Любой скрипт с `argparse` строится по одной схеме:

```python
import argparse

parser = argparse.ArgumentParser(description="Описание утилиты")
# добавляем аргументы
args = parser.parse_args()
# используем args
```

Метод `parse_args()` читает `sys.argv[1:]` по умолчанию. При вызове с `--help` или `-h` парсер выводит справку и завершает программу с кодом 0.

## Позиционные аргументы

Позиционные аргументы обязательны и указываются без префикса:

```python
import argparse

parser = argparse.ArgumentParser(description="Конвертер файлов")
parser.add_argument("input", help="Путь к исходному файлу")
parser.add_argument("output", help="Путь к результирующему файлу")

args = parser.parse_args()
print(f"Конвертирую {args.input} -> {args.output}")
```

Запуск:

```bash
python convert.py input.csv output.json
# Конвертирую input.csv -> output.json

python convert.py
# error: the following arguments are required: input, output
```

Имя аргумента становится атрибутом объекта `args`. Дефисы в имени автоматически заменяются на подчёркивания: `input-file` → `args.input_file`.

## Опциональные аргументы (флаги)

Опциональные аргументы начинаются с одного или двух дефисов:

```python
import argparse

parser = argparse.ArgumentParser(description="Утилита резервного копирования")
parser.add_argument("source", help="Исходная директория")
parser.add_argument("-d", "--destination", help="Директория назначения", default="./backup")
parser.add_argument("-v", "--verbose", help="Подробный вывод", action="store_true")
parser.add_argument("-n", "--dry-run", help="Не копировать, только показать", action="store_true")

args = parser.parse_args()

if args.verbose:
    print(f"Источник: {args.source}")
    print(f"Назначение: {args.destination}")

if not args.dry_run:
    print("Копирование...")
```

Параметр `action="store_true"` означает, что флаг не принимает значение — при наличии флага атрибут равен `True`, при отсутствии — `False`.

Запуск:

```bash
python backup.py /home/user/docs -v --dry-run
python backup.py /home/user/docs -d /mnt/nas --verbose
```

## Типы и валидация

По умолчанию все значения приходят как строки. Параметр `type` задаёт функцию преобразования:

```python
import argparse

parser = argparse.ArgumentParser(description="Анализатор логов")
parser.add_argument("--lines", type=int, default=100, help="Количество строк")
parser.add_argument("--threshold", type=float, default=0.95, help="Порог фильтрации")
parser.add_argument("--log-file", type=argparse.FileType("r"), help="Файл лога")

args = parser.parse_args()
print(type(args.lines))      # <class 'int'>
print(type(args.threshold))  # <class 'float'>
```

При передаче некорректного значения `argparse` автоматически выдаёт ошибку:

```bash
python analyzer.py --lines abc
# error: argument --lines: invalid int value: 'abc'
```

`argparse.FileType` открывает файл и возвращает файловый объект. Если файл не существует, парсер выдаст ошибку до входа в основной код.

### Ограничение допустимых значений

Параметр `choices` ограничивает допустимые значения:

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument(
    "--format",
    choices=["json", "csv", "xml"],
    default="json",
    help="Формат вывода"
)
parser.add_argument(
    "--log-level",
    choices=["DEBUG", "INFO", "WARNING", "ERROR"],
    default="INFO"
)

args = parser.parse_args()
```

```bash
python script.py --format yaml
# error: argument --format: invalid choice: 'yaml' (choose from 'json', 'csv', 'xml')
```

### Пользовательская валидация

Для сложной валидации передают собственную функцию в `type`:

```python
import argparse

def positive_int(value):
    ivalue = int(value)
    if ivalue <= 0:
        raise argparse.ArgumentTypeError(f"{value} должно быть положительным числом")
    return ivalue

parser = argparse.ArgumentParser()
parser.add_argument("--workers", type=positive_int, default=4)

args = parser.parse_args()
```

## Множественные значения

Параметр `nargs` задаёт количество принимаемых значений:

```python
import argparse

parser = argparse.ArgumentParser(description="Обработчик файлов")

# Принять ровно 2 значения
parser.add_argument("--range", nargs=2, type=int, metavar=("START", "END"))

# Принять любое количество значений (список)
parser.add_argument("--tags", nargs="*", default=[])

# Принять одно или больше значений
parser.add_argument("files", nargs="+", help="Файлы для обработки")

# Принять 0 или 1 значение
parser.add_argument("--output", nargs="?", const="stdout", default=None)

args = parser.parse_args()
print(args.range)   # [10, 20]
print(args.tags)    # ['python', 'cli']
print(args.files)   # ['a.txt', 'b.txt']
```

Запуск:

```bash
python processor.py a.txt b.txt --range 10 20 --tags python cli
```

## Подкоманды (subparsers)

Подкоманды позволяют строить CLI с несколькими режимами работы — как `git commit`, `git push`, `git status`:

```python
import argparse

parser = argparse.ArgumentParser(description="Менеджер задач")
subparsers = parser.add_subparsers(dest="command", help="Команды")

# Подкоманда add
add_parser = subparsers.add_parser("add", help="Добавить задачу")
add_parser.add_argument("title", help="Название задачи")
add_parser.add_argument("--priority", choices=["low", "medium", "high"], default="medium")

# Подкоманда list
list_parser = subparsers.add_parser("list", help="Список задач")
list_parser.add_argument("--status", choices=["open", "done", "all"], default="open")

# Подкоманда delete
delete_parser = subparsers.add_parser("delete", help="Удалить задачу")
delete_parser.add_argument("task_id", type=int, help="ID задачи")

args = parser.parse_args()

if args.command == "add":
    print(f"Добавляю задачу: {args.title} [{args.priority}]")
elif args.command == "list":
    print(f"Список задач со статусом: {args.status}")
elif args.command == "delete":
    print(f"Удаляю задачу #{args.task_id}")
else:
    parser.print_help()
```

Запуск:

```bash
python tasks.py add "Написать тесты" --priority high
python tasks.py list --status all
python tasks.py delete 42
python tasks.py --help
```

### Функции-обработчики для подкоманд

Для чистоты кода каждой подкоманде можно назначить функцию через `set_defaults`:

```python
import argparse

def cmd_add(args):
    print(f"Добавляю: {args.title}")

def cmd_list(args):
    print(f"Статус: {args.status}")

parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers()

add_parser = subparsers.add_parser("add")
add_parser.add_argument("title")
add_parser.set_defaults(func=cmd_add)

list_parser = subparsers.add_parser("list")
list_parser.add_argument("--status", default="open")
list_parser.set_defaults(func=cmd_list)

args = parser.parse_args()
if hasattr(args, "func"):
    args.func(args)
else:
    parser.print_help()
```

## Группы аргументов

Группы позволяют организовать аргументы в справке и задать логику взаимного исключения:

```python
import argparse

parser = argparse.ArgumentParser(description="Генератор отчётов")

# Визуальная группировка в справке
connection = parser.add_argument_group("Параметры подключения")
connection.add_argument("--host", default="localhost")
connection.add_argument("--port", type=int, default=5432)
connection.add_argument("--db", required=True, help="Имя базы данных")

output = parser.add_argument_group("Параметры вывода")
output.add_argument("--format", choices=["pdf", "html", "csv"], default="pdf")
output.add_argument("--output-dir", default="./reports")

# Взаимно исключающие аргументы
auth = parser.add_mutually_exclusive_group(required=True)
auth.add_argument("--password", help="Пароль для подключения")
auth.add_argument("--password-file", help="Файл с паролем")
auth.add_argument("--no-auth", action="store_true", help="Без аутентификации")

args = parser.parse_args()
```

При передаче двух взаимоисключающих аргументов парсер выдаст ошибку:

```bash
python report.py --db mydb --password secret --no-auth
# error: argument --no-auth: not allowed with argument --password
```

## Значения из переменных окружения

Стандартный способ совмещения аргументов CLI и переменных окружения:

```python
import argparse
import os

parser = argparse.ArgumentParser()
parser.add_argument(
    "--api-key",
    default=os.environ.get("API_KEY"),
    required=not os.environ.get("API_KEY"),
    help="API ключ (или переменная окружения API_KEY)"
)
parser.add_argument(
    "--timeout",
    type=int,
    default=int(os.environ.get("TIMEOUT", 30))
)

args = parser.parse_args()
```

## Разбор из произвольной строки

В тестах или при встраивании в другой код аргументы передают явно:

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--count", type=int)
parser.add_argument("--name")

# Вместо sys.argv передаём список строк
args = parser.parse_args(["--count", "5", "--name", "test"])
print(args.count)  # 5
print(args.name)   # test

# parse_known_args игнорирует неизвестные аргументы
args, unknown = parser.parse_known_args(["--count", "3", "--extra", "value"])
print(unknown)  # ['--extra', 'value']
```

## Полный пример: утилита для работы с CSV

```python
import argparse
import csv
import sys

def cmd_info(args):
    with open(args.file) as f:
        reader = csv.reader(f)
        rows = list(reader)
    print(f"Строк: {len(rows)}")
    print(f"Столбцов: {len(rows[0]) if rows else 0}")
    if args.headers and rows:
        print(f"Заголовки: {', '.join(rows[0])}")

def cmd_filter(args):
    with open(args.file) as f:
        reader = csv.DictReader(f)
        rows = [r for r in reader if r.get(args.column) == args.value]
    writer = csv.DictWriter(sys.stdout, fieldnames=rows[0].keys() if rows else [])
    writer.writeheader()
    writer.writerows(rows)

def build_parser():
    parser = argparse.ArgumentParser(
        description="Утилита для работы с CSV-файлами",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Примеры:\n  csv-tool info data.csv\n  csv-tool filter data.csv --column name --value Alice"
    )
    subparsers = parser.add_subparsers(dest="command", metavar="КОМАНДА")

    # info
    info = subparsers.add_parser("info", help="Информация о файле")
    info.add_argument("file", help="CSV файл")
    info.add_argument("--headers", action="store_true", help="Показать заголовки")
    info.set_defaults(func=cmd_info)

    # filter
    flt = subparsers.add_parser("filter", help="Фильтрация строк")
    flt.add_argument("file", help="CSV файл")
    flt.add_argument("--column", required=True, help="Столбец для фильтрации")
    flt.add_argument("--value", required=True, help="Значение для поиска")
    flt.set_defaults(func=cmd_filter)

    return parser

def main():
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)
    args.func(args)

if __name__ == "__main__":
    main()
```

Запуск:

```bash
python csv_tool.py info employees.csv --headers
python csv_tool.py filter employees.csv --column department --value Engineering
```

## Форматирование справки

`argparse` поддерживает несколько классов для форматирования текста в `--help`:

```python
import argparse

# Сохраняет переносы строк в description и epilog
parser = argparse.ArgumentParser(
    formatter_class=argparse.RawDescriptionHelpFormatter,
    description="Строка первая\nСтрока вторая"
)

# Добавляет значения по умолчанию к описанию каждого аргумента
parser = argparse.ArgumentParser(
    formatter_class=argparse.ArgumentDefaultsHelpFormatter
)

# Комбинирование
class Formatter(argparse.ArgumentDefaultsHelpFormatter, argparse.RawDescriptionHelpFormatter):
    pass

parser = argparse.ArgumentParser(formatter_class=Formatter)
```

Параметр `metavar` задаёт имя аргумента в справке без влияния на имя атрибута:

```python
parser.add_argument("--output", metavar="PATH", help="Файл для записи результатов")
# --output PATH   Файл для записи результатов
```

## Типичные паттерны и советы

**Выносите создание парсера в отдельную функцию** — это упрощает тестирование и позволяет переиспользовать парсер без запуска всего скрипта.

**Проверяйте обязательные зависимости вручную**, если `argparse` не может их выразить:

```python
args = parser.parse_args()
if args.output_format == "pdf" and not args.template:
    parser.error("--template обязателен при --output-format pdf")
```

Метод `parser.error()` выводит сообщение об ошибке в стандартный поток ошибок и завершает программу с кодом 2 — так же, как это делает сам `argparse`.

**Используйте `vars(args)`** для преобразования пространства имён в словарь:

```python
args = parser.parse_args()
config = vars(args)  # {'host': 'localhost', 'port': 5432, ...}
```

**Тестируйте парсер** передавая аргументы явно через `parse_args([...])` — не нужно запускать отдельный процесс.

## Итог

Модуль `argparse` решает три задачи одновременно: разбор аргументов, валидацию и генерацию документации. Для большинства CLI-утилит его возможностей достаточно: позиционные аргументы, флаги, типы, подкоманды и взаимно исключающие группы покрывают стандартные сценарии.

Для более сложных случаев — вложенные подкоманды, автодополнение в shell, декларативное описание команд — стоит смотреть в сторону библиотек `click` или `typer`, которые строятся поверх аналогичных принципов.

Чтобы освоить Python системно — от базового синтаксиса до работы с файлами, сетью и CLI — записывайтесь на курс [Python-разработчик на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-argparse).
