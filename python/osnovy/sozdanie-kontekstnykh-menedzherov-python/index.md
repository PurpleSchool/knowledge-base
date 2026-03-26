---
metaTitle: Создание собственных контекстных менеджеров в Python
metaDescription: Учимся создавать свои контекстные менеджеры в Python через классы с __enter__ и __exit__, обработку исключений и практические примеры.
author: Антон Ларичев
title: Создание собственных контекстных менеджеров в Python
preview: Разбираемся, как написать свой контекстный менеджер в Python с помощью методов __enter__ и __exit__, и рассматриваем практические примеры.
---

## Введение

В предыдущей статье мы разобрали, как работает оператор `with` и зачем он нужен. Но Python позволяет не только пользоваться встроенными контекстными менеджерами — ты можешь создавать свои собственные. Это полезно, когда нужно автоматизировать управление ресурсами, замерять время выполнения, управлять транзакциями или временно менять состояние программы.

В этой статье разберём, как создать контекстный менеджер через класс с методами `__enter__` и `__exit__`, и рассмотрим практические примеры.

## Протокол контекстного менеджера

Чтобы объект можно было использовать в операторе `with`, у него должны быть два метода:

```python
class MyManager:
    def __enter__(self):
        # Вызывается при входе в блок with
        # Возвращаемое значение присваивается переменной после as
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Вызывается при выходе из блока with
        # Параметры содержат информацию об исключении (если оно было)
        # Возвращает True для подавления исключения, False — для его проброса
        return False
```

Параметры метода `__exit__`:

* `exc_type` — тип исключения (например, `ValueError`) или `None`, если исключения не было
* `exc_val` — само исключение (экземпляр) или `None`
* `exc_tb` — traceback (объект отслеживания стека) или `None`

## Простой пример: замер времени выполнения

Создадим контекстный менеджер, который измеряет время выполнения кода:

```python
import time

class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed = time.perf_counter() - self.start
        print(f"Время выполнения: {self.elapsed:.4f} сек")
        return False

# Использование
with Timer() as t:
    # Какая-то тяжёлая операция
    total = sum(range(10_000_000))

print(f"Результат: {total}")
print(f"Замеренное время: {t.elapsed:.4f} сек")
```

Обрати внимание: `__enter__` возвращает `self`, поэтому после блока `with` можно обратиться к `t.elapsed`.

## Управление файловым логом

Контекстный менеджер для автоматической записи логов:

```python
from datetime import datetime

class FileLogger:
    def __init__(self, filename):
        self.filename = filename
        self.file = None

    def __enter__(self):
        self.file = open(self.filename, "a", encoding="utf-8")
        self.log(f"--- Сессия начата ---")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.log(f"ОШИБКА: {exc_type.__name__}: {exc_val}")
        self.log(f"--- Сессия завершена ---\n")
        self.file.close()
        return False  # Не подавляем исключения

    def log(self, message):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.file.write(f"[{timestamp}] {message}\n")

# Использование
with FileLogger("app.log") as logger:
    logger.log("Приложение запущено")
    logger.log("Обработка данных...")
    # Если здесь произойдёт ошибка — она запишется в лог
    logger.log("Данные обработаны успешно")
```

Если вы хотите детальнее изучить ООП и продвинутые возможности Python — приходите на наш большой курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-kontekstnykh-menedzherov-python).
На курсе 209 уроков и 34 упражнения, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Подавление исключений

Метод `__exit__` может подавить исключение, вернув `True`:

```python
class SuppressErrors:
    def __init__(self, *exceptions):
        self.exceptions = exceptions

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None and issubclass(exc_type, self.exceptions):
            print(f"Подавлено исключение: {exc_type.__name__}: {exc_val}")
            return True  # Исключение подавлено
        return False  # Остальные исключения пробрасываем

# Использование
with SuppressErrors(ValueError, ZeroDivisionError):
    result = int("не число")  # ValueError подавлена
    print("Эта строка не выполнится")

print("Программа продолжает работу")
```

## Временное изменение состояния

Контекстный менеджер для временной смены рабочей директории:

```python
import os

class ChangeDir:
    def __init__(self, new_path):
        self.new_path = new_path
        self.old_path = None

    def __enter__(self):
        self.old_path = os.getcwd()
        os.chdir(self.new_path)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        os.chdir(self.old_path)
        return False

# Использование
print(f"До: {os.getcwd()}")

with ChangeDir("/tmp"):
    print(f"Внутри: {os.getcwd()}")

print(f"После: {os.getcwd()}")  # Вернулись в исходную директорию
```

## Контекстный менеджер для транзакций

Пример паттерна «всё или ничего»:

```python
class Transaction:
    def __init__(self, data):
        self.data = data
        self.backup = None

    def __enter__(self):
        # Сохраняем копию данных
        self.backup = self.data.copy()
        return self.data

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # Откатываем изменения при ошибке
            self.data.clear()
            self.data.update(self.backup)
            print("Транзакция откачена — данные восстановлены")
        else:
            print("Транзакция зафиксирована")
        return False

# Использование
user = {"name": "Алиса", "balance": 1000}

# Успешная транзакция
with Transaction(user) as data:
    data["balance"] -= 200
    data["last_purchase"] = "Курс Python"
print(user)  # {'name': 'Алиса', 'balance': 800, 'last_purchase': 'Курс Python'}

# Неуспешная транзакция
try:
    with Transaction(user) as data:
        data["balance"] -= 5000
        if data["balance"] < 0:
            raise ValueError("Недостаточно средств")
except ValueError:
    pass
print(user)  # {'name': 'Алиса', 'balance': 800, 'last_purchase': 'Курс Python'}
```

## Реентерабельные контекстные менеджеры

Некоторые менеджеры можно использовать повторно, другие — нет. Вот пример реентерабельного:

```python
class Indenter:
    def __init__(self):
        self.level = 0

    def __enter__(self):
        self.level += 1
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.level -= 1
        return False

    def print(self, text):
        print("  " * self.level + text)

# Использование — вложенные блоки with
indent = Indenter()

with indent:
    indent.print("Уровень 1")
    with indent:
        indent.print("Уровень 2")
        with indent:
            indent.print("Уровень 3")
        indent.print("Снова уровень 2")
    indent.print("Снова уровень 1")
```

Вывод:

```
  Уровень 1
    Уровень 2
      Уровень 3
    Снова уровень 2
  Снова уровень 1
```

## Частые ошибки

* **Забыть вернуть значение из `__enter__`.** Если `__enter__` ничего не возвращает, переменная после `as` будет `None`:

```python
class Bad:
    def __enter__(self):
        pass  # Забыли return self
    def __exit__(self, *args):
        return False

with Bad() as b:
    print(b)  # None — скорее всего, это не то, что ожидалось
```

* **Не обрабатывать исключения в `__exit__`.** Если `__exit__` сам бросает исключение, оригинальное исключение из блока `with` будет потеряно.

* **Подавлять все исключения без разбора.** Возвращать `True` из `__exit__` нужно осознанно и только для конкретных типов исключений.

## Частозадаваемые вопросы

**Чем отличается контекстный менеджер через класс от декоратора @contextmanager?**

Класс с `__enter__`/`__exit__` — это «полноценный» способ. Декоратор `@contextmanager` из модуля `contextlib` — сокращённый вариант через генератор. Класс даёт больше контроля, особенно при сложной логике обработки исключений.

**Можно ли наследовать контекстные менеджеры?**

Да. Ты можешь создать базовый класс с `__enter__`/`__exit__` и наследоваться от него, переопределяя нужные методы.

**Когда стоит создавать свой контекстный менеджер?**

Когда у тебя есть парная операция «настроить — убрать за собой»: открыть — закрыть, заблокировать — разблокировать, изменить — вернуть обратно. Если ресурс требует обязательной финализации — контекстный менеджер поможет не забыть об этом.

## Заключение

Создание собственных контекстных менеджеров — мощный инструмент для написания надёжного и чистого кода на Python. Протокол `__enter__`/`__exit__` прост, но открывает широкие возможности: от замера производительности до управления транзакциями и временного изменения конфигурации.

Для закрепления навыков работы с ООП и продвинутыми возможностями Python рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-kontekstnykh-menedzherov-python).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет попробовать практические задания и понять структуру курса до покупки полного доступа.
