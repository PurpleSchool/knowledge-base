---
metaTitle: "Python subprocess: запуск внешних команд и процессов"
metaDescription: "Как использовать модуль subprocess в Python для запуска внешних команд, захвата вывода, работы с каналами и управления процессами."
author: "Антон Ларичев"
title: "Python subprocess: запуск внешних команд и процессов"
preview: "Модуль subprocess позволяет запускать внешние программы из Python, управлять их вводом-выводом и обрабатывать результаты выполнения."
---

## Что такое subprocess и зачем он нужен

Модуль `subprocess` входит в стандартную библиотеку Python и предназначен для запуска внешних программ и системных команд из Python-кода. С его помощью можно вызывать утилиты командной строки, запускать скрипты на других языках, выполнять системные команды и управлять потоками ввода-вывода дочерних процессов.

До появления `subprocess` разработчики использовали `os.system()`, `os.popen()` и модуль `commands`. Эти инструменты имели серьёзные ограничения: плохой контроль над потоками ввода-вывода, сложности с обработкой ошибок и проблемы безопасности. Модуль `subprocess` заменяет все эти устаревшие подходы и предоставляет единый, мощный интерфейс.

## subprocess.run() — основной способ запуска команд

Функция `subprocess.run()` появилась в Python 3.5 и является рекомендуемым способом запуска внешних команд в большинстве случаев.

### Простой запуск команды

```python
import subprocess

result = subprocess.run(['ls', '-la'])
print(result.returncode)  # 0 означает успех
```

Первый аргумент — список, где первый элемент это исполняемый файл, а остальные — аргументы. Такой способ передачи аргументов безопаснее, чем передача строки целиком.

```python
import subprocess

# Запуск с аргументами
result = subprocess.run(['echo', 'Hello, World!'])
# Выведет: Hello, World!
```

### Захват вывода команды

По умолчанию вывод команды идёт прямо в терминал. Чтобы захватить его в переменную, используется параметр `capture_output=True` или явное указание `stdout=subprocess.PIPE`.

```python
import subprocess

result = subprocess.run(
    ['ls', '-la'],
    capture_output=True,
    text=True  # декодировать вывод как строку, а не bytes
)

print(result.stdout)   # стандартный вывод
print(result.stderr)   # стандартный поток ошибок
print(result.returncode)  # код возврата
```

Параметр `text=True` (или его алиас `encoding='utf-8'`) автоматически декодирует байты в строку. Без него `result.stdout` будет объектом типа `bytes`.

```python
import subprocess

# Без text=True
result = subprocess.run(['echo', 'test'], capture_output=True)
print(type(result.stdout))  # <class 'bytes'>
print(result.stdout)        # b'test\n'

# С text=True
result = subprocess.run(['echo', 'test'], capture_output=True, text=True)
print(type(result.stdout))  # <class 'str'>
print(result.stdout)        # test
```

### Коды возврата и обработка ошибок

Каждый процесс завершается с кодом возврата: `0` означает успех, любое другое значение — ошибку. Параметр `check=True` заставляет `subprocess.run()` выбрасывать исключение `subprocess.CalledProcessError` при ненулевом коде возврата.

```python
import subprocess

try:
    result = subprocess.run(
        ['cat', 'nonexistent_file.txt'],
        capture_output=True,
        text=True,
        check=True
    )
except subprocess.CalledProcessError as e:
    print(f'Команда завершилась с ошибкой: {e.returncode}')
    print(f'Stderr: {e.stderr}')
```

Без `check=True` нужно проверять `returncode` вручную:

```python
import subprocess

result = subprocess.run(['cat', 'nonexistent_file.txt'], capture_output=True, text=True)

if result.returncode != 0:
    print(f'Ошибка: {result.stderr}')
else:
    print(result.stdout)
```

### Таймаут выполнения

Параметр `timeout` ограничивает время выполнения команды. При превышении лимита выбрасывается `subprocess.TimeoutExpired`.

```python
import subprocess

try:
    result = subprocess.run(
        ['sleep', '10'],
        timeout=3  # секунды
    )
except subprocess.TimeoutExpired:
    print('Команда превысила лимит времени')
```

### Передача данных на stdin

Можно передать данные в стандартный ввод процесса через параметр `input`.

```python
import subprocess

result = subprocess.run(
    ['grep', 'error'],
    input='INFO: starting\nERROR: something failed\nINFO: done\n',
    capture_output=True,
    text=True
)

print(result.stdout)  # ERROR: something failed
```

## subprocess.Popen — расширенный контроль над процессом

Класс `subprocess.Popen` предоставляет более низкоуровневый интерфейс и используется там, где `subprocess.run()` недостаточно гибок: асинхронное взаимодействие с процессом, потоковое чтение вывода, работа с несколькими процессами одновременно.

### Базовое использование Popen

```python
import subprocess

# Запускаем процесс
process = subprocess.Popen(
    ['ping', '-c', '3', 'google.com'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Ждём завершения и получаем вывод
stdout, stderr = process.communicate()
print(stdout)
print('Код возврата:', process.returncode)
```

### Потоковое чтение вывода

Когда процесс долго работает и нужно обрабатывать вывод по мере поступления, используют итерацию по `stdout`.

```python
import subprocess

process = subprocess.Popen(
    ['tail', '-f', '/var/log/syslog'],
    stdout=subprocess.PIPE,
    text=True
)

try:
    for line in process.stdout:
        print(f'Получено: {line}', end='')
except KeyboardInterrupt:
    process.terminate()
    process.wait()
```

### Неблокирующий запуск

`Popen` не блокирует выполнение скрипта — процесс работает параллельно.

```python
import subprocess
import time

# Запускаем процесс в фоне
process = subprocess.Popen(['sleep', '5'])

print('Процесс запущен, продолжаем работу...')
time.sleep(2)

# Проверяем, завершился ли процесс
if process.poll() is None:
    print('Процесс ещё работает')
else:
    print(f'Процесс завершился с кодом: {process.returncode}')

# Ждём завершения
process.wait()
print('Готово')
```

`process.poll()` возвращает `None`, если процесс ещё выполняется, или код возврата, если завершился.

## Работа с каналами (pipes)

Каналы позволяют передавать вывод одной команды на вход другой — аналог оператора `|` в командной строке.

### Цепочка команд

```python
import subprocess

# Эквивалент: ps aux | grep python
ps = subprocess.Popen(
    ['ps', 'aux'],
    stdout=subprocess.PIPE
)

grep = subprocess.Popen(
    ['grep', 'python'],
    stdin=ps.stdout,
    stdout=subprocess.PIPE,
    text=True
)

# Закрываем stdout ps, чтобы grep получил EOF при завершении ps
ps.stdout.close()

output, _ = grep.communicate()
print(output)
```

### Использование subprocess.DEVNULL

Для подавления вывода без его захвата используется `subprocess.DEVNULL`.

```python
import subprocess

# Запускаем команду, игнорируя весь вывод
result = subprocess.run(
    ['make', 'build'],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)
```

## Параметр shell=True и безопасность

Параметр `shell=True` позволяет передавать команду строкой и использовать возможности оболочки: перенаправление, переменные окружения, wildcards.

```python
import subprocess

# С shell=True можно передавать строку и использовать возможности shell
result = subprocess.run(
    'ls -la | grep .py',
    shell=True,
    capture_output=True,
    text=True
)
print(result.stdout)
```

### Почему shell=True опасен

Если в команду подставляются данные от пользователя, `shell=True` открывает возможность для инъекции команд.

```python
import subprocess

# ОПАСНО: никогда не делайте так с пользовательскими данными
user_input = 'file.txt; rm -rf /'
result = subprocess.run(
    f'cat {user_input}',
    shell=True  # выполнит и cat, и rm -rf /
)

# БЕЗОПАСНО: передавайте аргументы списком
user_input = 'file.txt; rm -rf /'
result = subprocess.run(
    ['cat', user_input],  # rm -rf / будет именем файла, а не командой
    capture_output=True
)
```

Правило простое: используйте `shell=True` только с полностью контролируемыми строками. Если аргументы поступают извне — всегда передавайте их списком.

## Переменные окружения

Дочерний процесс наследует окружение родителя. Изменить или дополнить его можно через параметр `env`.

```python
import subprocess
import os

# Дополняем текущее окружение
env = os.environ.copy()
env['MY_VAR'] = 'hello'
env['PATH'] = '/custom/bin:' + env['PATH']

result = subprocess.run(
    ['printenv', 'MY_VAR'],
    capture_output=True,
    text=True,
    env=env
)
print(result.stdout)  # hello
```

Если передать в `env` словарь без копирования текущего окружения, дочерний процесс получит только то, что вы указали явно.

## Рабочая директория

Параметр `cwd` задаёт рабочую директорию для запускаемого процесса.

```python
import subprocess

result = subprocess.run(
    ['ls'],
    cwd='/tmp',
    capture_output=True,
    text=True
)
print(result.stdout)  # содержимое /tmp
```

## Практические примеры

### Запуск Git-команд

```python
import subprocess

def git_status(repo_path):
    result = subprocess.run(
        ['git', 'status', '--short'],
        cwd=repo_path,
        capture_output=True,
        text=True,
        check=True
    )
    return result.stdout.strip()

def git_log(repo_path, count=10):
    result = subprocess.run(
        ['git', 'log', '--oneline', f'-{count}'],
        cwd=repo_path,
        capture_output=True,
        text=True,
        check=True
    )
    return result.stdout.strip().splitlines()

status = git_status('/path/to/repo')
print('Изменённые файлы:')
print(status)

commits = git_log('/path/to/repo', count=5)
print('Последние коммиты:')
for commit in commits:
    print(commit)
```

### Конвертация файлов с помощью ffmpeg

```python
import subprocess
from pathlib import Path

def convert_video(input_path, output_path, codec='libx264'):
    cmd = [
        'ffmpeg',
        '-i', str(input_path),
        '-c:v', codec,
        '-y',  # перезаписать без вопроса
        str(output_path)
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        raise RuntimeError(f'ffmpeg завершился с ошибкой:\n{result.stderr}')

    return output_path

convert_video('input.avi', 'output.mp4')
```

### Проверка доступности хоста

```python
import subprocess

def is_host_reachable(host, count=1, timeout=2):
    result = subprocess.run(
        ['ping', '-c', str(count), '-W', str(timeout), host],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    return result.returncode == 0

hosts = ['google.com', '192.168.1.1', 'nonexistent.local']
for host in hosts:
    status = 'доступен' if is_host_reachable(host) else 'недоступен'
    print(f'{host}: {status}')
```

### Параллельный запуск нескольких процессов

```python
import subprocess

urls = [
    'https://example.com',
    'https://httpbin.org/get',
    'https://api.github.com',
]

# Запускаем все процессы одновременно
processes = [
    subprocess.Popen(
        ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', url],
        stdout=subprocess.PIPE,
        text=True
    )
    for url in urls
]

# Ждём завершения каждого и выводим результат
for url, process in zip(urls, processes):
    stdout, _ = process.communicate()
    print(f'{url}: HTTP {stdout.strip()}')
```

## Управление жизненным циклом процесса

Класс `Popen` предоставляет методы для управления запущенным процессом.

```python
import subprocess
import signal

process = subprocess.Popen(['long_running_script.py'])

# Отправить сигнал SIGTERM (мягкое завершение)
process.terminate()

# Дождаться завершения с таймаутом
try:
    process.wait(timeout=5)
except subprocess.TimeoutExpired:
    # Если процесс не завершился — принудительное завершение
    process.kill()
    process.wait()

print('Код возврата:', process.returncode)
```

Разница между `terminate()` и `kill()`:
- `terminate()` отправляет `SIGTERM` — процесс может обработать сигнал и завершиться корректно
- `kill()` отправляет `SIGKILL` — немедленное принудительное завершение без возможности обработки

## Контекстный менеджер для Popen

Объект `Popen` поддерживает протокол контекстного менеджера, что гарантирует корректное закрытие дескрипторов.

```python
import subprocess

with subprocess.Popen(
    ['python3', '-c', 'import sys; sys.stdout.write("hello\\n"); sys.stdout.flush()'],
    stdout=subprocess.PIPE,
    text=True
) as process:
    stdout, _ = process.communicate()
    print(stdout)
# После блока with файловые дескрипторы закрыты
```

## Типичные ошибки

### FileNotFoundError

Выбрасывается, если исполняемый файл не найден.

```python
import subprocess

try:
    subprocess.run(['nonexistent_program'])
except FileNotFoundError:
    print('Программа не найдена. Проверьте PATH или установите её.')
```

### Взаимная блокировка (deadlock)

При использовании `Popen` напрямую с `PIPE` можно получить дедлок: родительский процесс ждёт данных от дочернего, а дочерний не может записать данные, потому что буфер заполнен.

```python
import subprocess

# ОПАСНО: может привести к дедлоку при большом выводе
process = subprocess.Popen(
    ['command_with_lots_of_output'],
    stdout=subprocess.PIPE
)
process.wait()  # дедлок, если буфер stdout переполнится

# ПРАВИЛЬНО: используйте communicate()
process = subprocess.Popen(
    ['command_with_lots_of_output'],
    stdout=subprocess.PIPE
)
stdout, _ = process.communicate()  # буферизует весь вывод безопасно
```

Метод `communicate()` читает весь вывод в память и только потом возвращает управление — он защищает от дедлока, но при очень больших объёмах данных может занять много памяти.

## Сравнение subprocess.run() и subprocess.Popen()

| Задача | subprocess.run() | subprocess.Popen() |
|---|---|---|
| Запуск и ожидание завершения | Да | Через `.wait()` или `.communicate()` |
| Захват вывода | `capture_output=True` | `stdout=PIPE` |
| Неблокирующий запуск | Нет | Да |
| Потоковое чтение вывода | Нет | Да |
| Проверка кода возврата | `check=True` | `.returncode` после завершения |
| Простота использования | Высокая | Средняя |

Выбирайте `subprocess.run()` для большинства задач и `Popen` только тогда, когда нужен тонкий контроль над жизненным циклом процесса или потоковая обработка вывода.

## Заключение

Модуль `subprocess` — это мощный инструмент для интеграции Python-кода с внешними программами и системными утилитами. Ключевые принципы работы с ним: использовать `subprocess.run()` для типовых задач, передавать аргументы списком для безопасности, всегда обрабатывать возможные ошибки и использовать `Popen` только когда требуется более тонкое управление процессом.

Освоить Python с нуля и разобраться в работе стандартной библиотеки можно на курсе [Python для разработчиков](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-subprocess) от PurpleSchool.