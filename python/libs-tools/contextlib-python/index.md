---
metaTitle: Модуль contextlib в Python — утилиты для контекстных менеджеров
metaDescription: Разбираем модуль contextlib в Python — декоратор contextmanager, suppress, redirect_stdout, closing, ExitStack и другие утилиты для контекстных менеджеров.
author: Антон Ларичев
title: Модуль contextlib в Python — утилиты для контекстных менеджеров
preview: Изучаем модуль contextlib в Python — как создавать контекстные менеджеры через генераторы, подавлять исключения и управлять стеком ресурсов.
---

## Введение

Модуль `contextlib` из стандартной библиотеки Python предоставляет набор утилит для работы с контекстными менеджерами. Вместо того чтобы каждый раз писать класс с `__enter__` и `__exit__`, ты можешь создать контекстный менеджер буквально в несколько строк с помощью декоратора `@contextmanager`. А ещё в модуле есть готовые инструменты для подавления исключений, перенаправления вывода и управления стеком ресурсов.

В этой статье разберём основные инструменты `contextlib` и покажем, как применять их на практике.

## Декоратор @contextmanager

Декоратор `@contextmanager` позволяет создать контекстный менеджер из обычной генераторной функции. Код до `yield` выполняется при входе в блок `with`, код после `yield` — при выходе:

```python
from contextlib import contextmanager

@contextmanager
def timer():
    import time
    start = time.perf_counter()
    yield  # Здесь выполняется тело блока with
    elapsed = time.perf_counter() - start
    print(f"Время выполнения: {elapsed:.4f} сек")

# Использование
with timer():
    total = sum(range(10_000_000))
    print(f"Результат: {total}")
```

Если нужно передать значение в переменную `as`, используй `yield` с аргументом:

```python
@contextmanager
def open_file(path, mode="r"):
    f = open(path, mode, encoding="utf-8")
    try:
        yield f  # Это значение попадёт в переменную после as
    finally:
        f.close()

with open_file("data.txt", "w") as f:
    f.write("Привет из contextmanager!")
```

### Обработка исключений в @contextmanager

Блок `try/finally` внутри генератора обязателен, если нужно гарантировать выполнение финализации:

```python
@contextmanager
def managed_resource(name):
    print(f"Захватываем ресурс: {name}")
    try:
        yield name
    except Exception as e:
        print(f"Ошибка при работе с {name}: {e}")
        raise  # Пробрасываем исключение дальше
    finally:
        print(f"Освобождаем ресурс: {name}")

with managed_resource("база данных") as res:
    print(f"Работаем с: {res}")
    # Даже при ошибке ресурс будет освобождён
```

## contextlib.suppress — подавление исключений

Функция `suppress()` создаёт контекстный менеджер, который подавляет указанные типы исключений:

```python
from contextlib import suppress

# Без suppress
try:
    os.remove("temp.txt")
except FileNotFoundError:
    pass

# С suppress — то же самое, но короче
with suppress(FileNotFoundError):
    os.remove("temp.txt")
```

Можно подавлять несколько типов исключений:

```python
with suppress(FileNotFoundError, PermissionError):
    os.remove("protected_file.txt")

print("Программа продолжает работу")
```

Если вы хотите детальнее изучить стандартную библиотеку Python и её возможности — приходите на наш большой курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=contextlib-python).
На курсе 209 уроков и 34 упражнения, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## contextlib.closing — оборачивание объектов без поддержки with

Если объект имеет метод `close()`, но не реализует протокол контекстного менеджера, используй `closing()`:

```python
from contextlib import closing
from urllib.request import urlopen

# urlopen возвращает объект с методом close(), но без __enter__/__exit__
with closing(urlopen("https://example.com")) as page:
    content = page.read()
    print(f"Получено {len(content)} байт")
# page.close() вызовется автоматически
```

## contextlib.redirect_stdout и redirect_stderr

Эти менеджеры перенаправляют стандартный вывод или вывод ошибок:

```python
from contextlib import redirect_stdout, redirect_stderr
import io

# Перехватываем stdout в строку
f = io.StringIO()
with redirect_stdout(f):
    print("Это не появится в консоли")
    print("И это тоже")

output = f.getvalue()
print(f"Перехваченный вывод: {output!r}")
```

Полезно для тестирования функций, которые печатают в консоль:

```python
def greet(name):
    print(f"Привет, {name}!")

# Тестируем вывод функции
buffer = io.StringIO()
with redirect_stdout(buffer):
    greet("Алиса")

assert buffer.getvalue() == "Привет, Алиса!\n"
```

Перенаправление stderr:

```python
err_buffer = io.StringIO()
with redirect_stderr(err_buffer):
    import warnings
    warnings.warn("Тестовое предупреждение")

print(f"Перехваченные ошибки: {err_buffer.getvalue()}")
```

## contextlib.ExitStack — динамический стек ресурсов

`ExitStack` позволяет управлять произвольным количеством контекстных менеджеров, которые определяются во время выполнения:

```python
from contextlib import ExitStack

# Открываем произвольное количество файлов
filenames = ["file1.txt", "file2.txt", "file3.txt"]

with ExitStack() as stack:
    files = [
        stack.enter_context(open(fname, "w", encoding="utf-8"))
        for fname in filenames
    ]
    # Все файлы открыты
    for i, f in enumerate(files):
        f.write(f"Содержимое файла {i + 1}\n")
# Все файлы автоматически закрыты
```

### Регистрация callback-функций

`ExitStack` умеет регистрировать произвольные функции для вызова при выходе:

```python
from contextlib import ExitStack

def cleanup(name):
    print(f"Очистка: {name}")

with ExitStack() as stack:
    stack.callback(cleanup, "временные файлы")
    stack.callback(cleanup, "кэш")
    stack.callback(cleanup, "соединения")
    print("Выполняем основную работу...")

# Вывод (в обратном порядке — как стек):
# Выполняем основную работу...
# Очистка: соединения
# Очистка: кэш
# Очистка: временные файлы
```

### Передача владения ресурсами

Метод `pop_all()` позволяет «забрать» ресурсы из стека, чтобы они не закрылись автоматически:

```python
from contextlib import ExitStack

def open_files_safely(filenames):
    with ExitStack() as stack:
        files = []
        for fname in filenames:
            f = stack.enter_context(open(fname, "r", encoding="utf-8"))
            files.append(f)
        # Если всё успешно — забираем ответственность за закрытие
        return stack.pop_all(), files
    # Если произошла ошибка — все ранее открытые файлы закроются

# Вызывающий код сам закрывает файлы
closer, files = open_files_safely(["data1.txt", "data2.txt"])
try:
    for f in files:
        print(f.read())
finally:
    closer.close()
```

## contextlib.nullcontext — заглушка

`nullcontext` — контекстный менеджер, который ничего не делает. Полезен для условных конструкций:

```python
from contextlib import nullcontext

def process_data(data, logfile=None):
    # Если указан лог-файл — открываем, иначе используем заглушку
    cm = open(logfile, "w", encoding="utf-8") if logfile else nullcontext()

    with cm as f:
        for item in data:
            result = item * 2
            if f is not None:
                f.write(f"{item} -> {result}\n")

process_data([1, 2, 3], logfile="log.txt")  # С логированием
process_data([4, 5, 6])  # Без логирования
```

## Асинхронные контекстные менеджеры

Модуль `contextlib` поддерживает и асинхронные варианты:

```python
from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def async_timer():
    import time
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"Async время: {elapsed:.4f} сек")

async def main():
    async with async_timer():
        await asyncio.sleep(1)
        print("Работа завершена")

asyncio.run(main())
```

## Частые ошибки

* **Забыть try/finally в @contextmanager.** Без `try/finally` код после `yield` не выполнится при исключении:

```python
# Плохо — cleanup не вызовется при ошибке
@contextmanager
def bad_manager():
    print("setup")
    yield
    print("cleanup")  # Не выполнится при исключении!

# Правильно
@contextmanager
def good_manager():
    print("setup")
    try:
        yield
    finally:
        print("cleanup")  # Выполнится всегда
```

* **Делать yield больше одного раза.** В `@contextmanager` допускается ровно один `yield`. Второй вызовет `RuntimeError`.

* **Использовать suppress для слишком широких исключений.** `suppress(Exception)` подавит практически все ошибки, что затруднит отладку.

## Частозадаваемые вопросы

**Когда использовать @contextmanager, а когда класс?**

Если логика простая (настроить — сделать — убрать) — используй `@contextmanager`. Если нужна сложная обработка исключений, хранение состояния между вызовами или наследование — используй класс.

**Можно ли комбинировать suppress и ExitStack?**

Да. `ExitStack` принимает любые контекстные менеджеры, включая `suppress`:

```python
with ExitStack() as stack:
    stack.enter_context(suppress(FileNotFoundError))
    os.remove("maybe_missing.txt")
```

**Чем nullcontext отличается от suppress?**

`nullcontext` — это «пустой» менеджер, который вообще ничего не делает. `suppress` активно перехватывает и подавляет указанные исключения. Это разные инструменты для разных задач.

## Заключение

Модуль `contextlib` значительно упрощает работу с контекстными менеджерами в Python. Декоратор `@contextmanager` позволяет создать менеджер в пару строк, `suppress` заменяет шаблонные `try/except/pass`, а `ExitStack` решает задачу управления динамическим набором ресурсов. Эти инструменты делают код чище и надёжнее.

Для закрепления навыков работы со стандартной библиотекой Python рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=contextlib-python).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет изучить основы языка и понять структуру курса до покупки полного доступа.
