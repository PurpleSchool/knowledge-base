---
metaTitle: "Python pathlib: работа с файловыми путями | PurpleSchool"
metaDescription: "Изучите модуль pathlib в Python: создание путей, чтение и запись файлов, glob-поиск, работа с директориями и сравнение с os.path."
author: "Антон Ларичев"
title: "Python pathlib — современная работа с файловыми путями"
preview: "Объектно-ориентированный подход к файловым путям в Python — модуль pathlib вместо os.path."
---

## Что такое pathlib

Модуль `pathlib` появился в Python 3.4 и стал стандартным способом работы с файловыми путями. В отличие от набора функций `os.path`, работающих со строками, `pathlib` предоставляет объектно-ориентированный интерфейс: путь — это объект со свойствами и методами. Код становится читаемее, кроссплатформенные нюансы скрываются под капотом, а IDE лучше подсказывает доступные операции.

## Импорт и создание объектов Path

Для большинства задач достаточно импортировать один класс:

```python
from pathlib import Path

# Текущая директория
current = Path('.')

# Абсолютный путь
home = Path('/home/user')

# Относительный путь
config = Path('config/settings.json')

# Из нескольких частей
log_file = Path('var', 'log', 'app', 'error.log')
```

### Кроссплатформенные пути

`pathlib` автоматически выбирает нужный класс в зависимости от операционной системы: на Windows создаётся `WindowsPath`, на Unix — `PosixPath`. Для работы с путями без обращения к файловой системе (например, для разбора путей в конфигурации) есть «чистые» классы:

```python
from pathlib import PurePosixPath, PureWindowsPath

unix_path = PurePosixPath('/etc/nginx/nginx.conf')
win_path = PureWindowsPath(r'C:\Users\user\Documents\file.txt')

print(win_path.stem)    # file
print(win_path.suffix)  # .txt
print(win_path.parent)  # C:\Users\user\Documents
```

`PurePath` не обращается к файловой системе и не выбрасывает ошибок при несуществующих путях.

## Основные операции с путями

### Конкатенация через оператор /

Одно из главных удобств `pathlib` — оператор `/` для объединения частей пути:

```python
from pathlib import Path

base = Path('/home/user')
project = base / 'projects' / 'myapp'
config_file = project / 'config' / 'settings.json'

print(config_file)
# /home/user/projects/myapp/config/settings.json
```

Это значительно читаемее, чем `os.path.join('/home/user', 'projects', 'myapp', 'config', 'settings.json')`.

### Свойства пути

Объект `Path` даёт прямой доступ ко всем компонентам пути через атрибуты:

```python
from pathlib import Path

p = Path('/home/user/documents/report.final.pdf')

print(p.name)       # report.final.pdf   — имя файла с расширением
print(p.stem)       # report.final       — имя без последнего расширения
print(p.suffix)     # .pdf               — последнее расширение
print(p.suffixes)   # ['.final', '.pdf'] — все расширения
print(p.parent)     # /home/user/documents
print(p.parents[0]) # /home/user/documents
print(p.parents[1]) # /home/user
print(p.parents[2]) # /home
print(p.parts)      # ('/', 'home', 'user', 'documents', 'report.final.pdf')
print(p.root)       # /
```

### Абсолютный путь и разрешение символических ссылок

```python
from pathlib import Path

relative = Path('documents/report.pdf')

# resolve() возвращает абсолютный путь и раскрывает symlink
absolute = relative.resolve()
print(absolute)  # /home/user/documents/report.pdf

# absolute() делает путь абсолютным без обращения к ФС
print(relative.absolute())

# Проверка
print(relative.is_absolute())  # False
print(absolute.is_absolute())  # True
```

## Проверка существования и типа объекта

```python
from pathlib import Path

p = Path('/home/user/documents')

print(p.exists())     # True/False — существует ли путь
print(p.is_file())    # True если это обычный файл
print(p.is_dir())     # True если это директория
print(p.is_symlink()) # True если это символическая ссылка
print(p.is_mount())   # True если это точка монтирования
```

## Чтение и запись файлов

`pathlib` предоставляет удобные методы для чтения и записи без явного управления файловым дескриптором:

### Чтение файлов

```python
from pathlib import Path

p = Path('data/config.json')

# Чтение всего текста
text = p.read_text(encoding='utf-8')

# Чтение в байтах
data = p.read_bytes()

# Классический open через Path
with p.open('r', encoding='utf-8') as f:
    for line in f:
        print(line.strip())
```

### Запись файлов

```python
from pathlib import Path

p = Path('output/result.txt')

# Запись текста (перезаписывает файл целиком)
p.write_text('Hello, World!\n', encoding='utf-8')

# Запись байтов
p.write_bytes(b'\x89PNG\r\n\x1a\n')

# Дополнение файла через open
with p.open('a', encoding='utf-8') as f:
    f.write('Ещё одна строка\n')
```

## Работа с директориями

### Создание директорий

```python
from pathlib import Path

# Создание одной директории
Path('logs').mkdir()

# Создание вложенных директорий без ошибки если уже существуют
Path('data/2024/january').mkdir(parents=True, exist_ok=True)
```

Параметр `parents=True` создаёт все промежуточные директории, `exist_ok=True` подавляет `FileExistsError`.

### Перебор содержимого директории

```python
from pathlib import Path

p = Path('/home/user/project')

# Все элементы директории (не рекурсивно)
for item in p.iterdir():
    kind = 'dir' if item.is_dir() else 'file'
    print(f'[{kind}] {item.name}')

# Только Python-файлы в текущей директории
for py_file in p.glob('*.py'):
    print(py_file.name)

# Python-файлы во всём поддереве (рекурсивно)
for py_file in p.rglob('*.py'):
    print(py_file.relative_to(p))
```

### Удаление файлов и директорий

```python
from pathlib import Path
import shutil

# Удаление файла
Path('temp.txt').unlink()

# Без ошибки если файл не существует (Python 3.8+)
Path('temp.txt').unlink(missing_ok=True)

# Удаление пустой директории
Path('empty_dir').rmdir()

# Удаление непустой директории
shutil.rmtree(Path('full_dir'))
```

## Glob-паттерны

`pathlib` поддерживает glob-паттерны для поиска файлов по маске:

```python
from pathlib import Path

base = Path('/home/user/project')

# Все JSON-файлы в директории
list(base.glob('*.json'))

# JSON-файлы во всём поддереве
list(base.rglob('*.json'))

# Файлы в поддиректориях ровно одного уровня
list(base.glob('*/*.py'))

# Файлы с именем, начинающимся на test_
list(base.rglob('test_*.py'))

# Все файлы с любым расширением рекурсивно
list(base.rglob('*.*'))
```

### Практический пример: поиск конфигурационных файлов

```python
from pathlib import Path

def find_configs(root: Path, patterns: list[str]) -> list[Path]:
    result = []
    for pattern in patterns:
        result.extend(root.rglob(pattern))
    return sorted(result)

project = Path('/home/user/project')
configs = find_configs(project, ['*.json', '*.yaml', '*.toml', '*.ini'])

for cfg in configs:
    print(cfg.relative_to(project))
```

## Переименование и перемещение файлов

```python
from pathlib import Path

source = Path('draft.txt')

# Переименование в той же директории
new_path = source.rename('final.txt')

# replace перезаписывает целевой файл если он существует
new_path = source.replace('final.txt')

# Перемещение файла в другую директорию
archive = Path('archive')
archive.mkdir(exist_ok=True)
new_path = source.rename(archive / source.name)
```

## Изменение компонентов пути

Методы `with_*` возвращают новый объект `Path` с изменённым компонентом, не изменяя оригинал:

```python
from pathlib import Path

p = Path('/home/user/report.txt')

# Изменить расширение
print(p.with_suffix('.pdf'))    # /home/user/report.pdf

# Изменить полное имя файла
print(p.with_name('summary.md'))  # /home/user/summary.md

# Изменить только stem (Python 3.9+)
print(p.with_stem('final_report'))  # /home/user/final_report.txt
```

## Информация о файле

```python
from pathlib import Path
from datetime import datetime

p = Path('/home/user/document.pdf')
stat = p.stat()

# Размер
print(f'Размер: {stat.st_size} байт')
print(f'Размер: {stat.st_size / 1024:.1f} КБ')

# Время последнего изменения
mtime = datetime.fromtimestamp(stat.st_mtime)
print(f'Изменён: {mtime:%Y-%m-%d %H:%M:%S}')
```

## Специальные директории

```python
from pathlib import Path

# Домашняя директория текущего пользователя
home = Path.home()
print(home)  # /home/username или C:\Users\username

# Текущая рабочая директория
cwd = Path.cwd()
print(cwd)

# Директория, в которой находится сам скрипт
script_dir = Path(__file__).parent
config_path = script_dir / 'config.json'
print(config_path)
```

Паттерн `Path(__file__).parent` особенно полезен, когда нужно обращаться к файлам рядом со скриптом независимо от того, из какой директории он запускается.

## pathlib против os.path

Оба подхода решают одни задачи, но читаемость и удобство `pathlib` выше:

```python
import os
from pathlib import Path

# Объединение путей
os.path.join('/home/user', 'projects', 'app', 'main.py')
Path('/home/user') / 'projects' / 'app' / 'main.py'

# Получение имени файла
os.path.basename('/home/user/file.txt')    # file.txt
Path('/home/user/file.txt').name           # file.txt

# Проверка существования
os.path.exists('/home/user/file.txt')
Path('/home/user/file.txt').exists()

# Расширение файла
os.path.splitext('file.tar.gz')[1]  # .gz
Path('file.tar.gz').suffix          # .gz
Path('file.tar.gz').suffixes        # ['.tar', '.gz']

# Чтение файла
with open('/home/user/file.txt') as f:
    text = f.read()
text = Path('/home/user/file.txt').read_text()
```

## Практические примеры

### Архивирование старых логов

```python
from pathlib import Path
from datetime import datetime

def archive_old_logs(log_dir: Path, archive_dir: Path, days: int = 30) -> int:
    archive_dir.mkdir(parents=True, exist_ok=True)
    archived = 0
    threshold = days * 86400
    now = datetime.now().timestamp()

    for log_file in log_dir.glob('*.log'):
        if now - log_file.stat().st_mtime > threshold:
            log_file.rename(archive_dir / log_file.name)
            archived += 1

    return archived

count = archive_old_logs(
    Path('/var/log/myapp'),
    Path('/var/log/myapp/archive'),
    days=30
)
print(f'Архивировано: {count} файлов')
```

### Поиск дублирующихся файлов

```python
from pathlib import Path
import hashlib
from collections import defaultdict

def find_duplicates(directory: Path) -> dict[str, list[Path]]:
    hashes: dict[str, list[Path]] = defaultdict(list)

    for file_path in directory.rglob('*'):
        if file_path.is_file():
            digest = hashlib.md5(file_path.read_bytes()).hexdigest()
            hashes[digest].append(file_path)

    return {h: paths for h, paths in hashes.items() if len(paths) > 1}

duplicates = find_duplicates(Path('/home/user/downloads'))
for digest, paths in duplicates.items():
    print(f'\nДубликаты (md5: {digest[:8]}...):')
    for p in paths:
        print(f'  {p}')
```

### Реорганизация файлов по дате

```python
from pathlib import Path
from datetime import datetime

def organize_by_date(source: Path, target: Path) -> None:
    for file_path in source.iterdir():
        if not file_path.is_file():
            continue

        mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
        dest_dir = target / str(mtime.year) / f'{mtime.month:02d}'
        dest_dir.mkdir(parents=True, exist_ok=True)

        destination = dest_dir / file_path.name
        if destination.exists():
            destination = dest_dir / f'{file_path.stem}_{mtime:%H%M%S}{file_path.suffix}'

        file_path.rename(destination)
        print(f'{file_path.name} -> {destination.relative_to(target)}')

organize_by_date(
    source=Path('/home/user/downloads'),
    target=Path('/home/user/organized')
)
```

## Итог

Модуль `pathlib` — стандартный инструмент для работы с файловыми путями в современном Python. Объектно-ориентированный интерфейс делает код понятнее: вместо цепочек функций из `os.path` используются читаемые атрибуты и методы объекта. Оператор `/` для конкатенации, встроенное чтение и запись через `read_text` / `write_text`, мощные glob-паттерны — всё это упрощает типичные задачи по работе с файлами.

Для изучения Python с нуля и до уровня уверенного разработчика — записывайтесь на курс [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=pathlib).