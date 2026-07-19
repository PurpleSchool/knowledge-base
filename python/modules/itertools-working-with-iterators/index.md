---
metaTitle: "Python itertools: полное руководство по работе с итераторами"
metaDescription: "Разбираем модуль itertools в Python: бесконечные, комбинаторные и завершающие итераторы с практическими примерами кода."
author: "Антон Ларичев"
title: "Python itertools — работа с итераторами"
preview: "Как использовать встроенный модуль itertools для эффективной работы с итерируемыми объектами в Python."
---

## Что такое itertools и зачем он нужен

Модуль `itertools` входит в стандартную библиотеку Python и предоставляет набор быстрых, эффективных по памяти инструментов для работы с итераторами. Все функции модуля возвращают итераторы — объекты, которые генерируют значения по требованию, а не создают их все сразу в памяти.

Это принципиальное отличие от, например, генерации списка через list comprehension: итератор вычисляет следующий элемент только в момент обращения к нему. Для больших объёмов данных это критически важно.

```python
import itertools
```

Функции `itertools` можно разделить на три группы:
- **Бесконечные итераторы** — генерируют значения неограниченно.
- **Комбинаторные итераторы** — перебирают комбинации и перестановки.
- **Завершающие итераторы** — работают с конечными последовательностями.

## Бесконечные итераторы

### count

`count(start=0, step=1)` генерирует числа, начиная с `start`, с шагом `step`. Работает как `range`, но без конца.

```python
import itertools

counter = itertools.count(start=10, step=2)
for _ in range(5):
    print(next(counter))
# 10 12 14 16 18
```

Практический пример — нумерация строк при чтении файла:

```python
import itertools

lines = ["первая строка", "вторая строка", "третья строка"]
numbered = zip(itertools.count(1), lines)
for num, line in numbered:
    print(f"{num}: {line}")
# 1: первая строка
# 2: вторая строка
# 3: третья строка
```

### cycle

`cycle(iterable)` циклически повторяет элементы переданной последовательности.

```python
import itertools

status_cycle = itertools.cycle(["активен", "неактивен", "ожидание"])
for _ in range(7):
    print(next(status_cycle))
# активен, неактивен, ожидание, активен, неактивен, ожидание, активен
```

Пример использования — чередование цветов в таблице:

```python
import itertools

colors = itertools.cycle(["#ffffff", "#f0f0f0"])
rows = ["Иван", "Мария", "Алексей", "Ольга"]
for row, color in zip(rows, colors):
    print(f'<tr style="background:{color}">{row}</tr>')
```

### repeat

`repeat(object, times=None)` повторяет объект заданное количество раз (или бесконечно).

```python
import itertools

for val in itertools.repeat("Python", 3):
    print(val)
# Python Python Python
```

`repeat` часто передают вторым аргументом в `map` или `starmap`, когда нужно применить одно значение ко всем элементам:

```python
import itertools

result = list(map(pow, range(1, 6), itertools.repeat(2)))
print(result)
# [1, 4, 9, 16, 25]
```

## Комбинаторные итераторы

### product

`product(*iterables, repeat=1)` возвращает декартово произведение — все возможные комбинации элементов из нескольких последовательностей.

```python
import itertools

colors = ["красный", "синий"]
sizes = ["S", "M", "L"]

for color, size in itertools.product(colors, sizes):
    print(f"{color} - {size}")
# красный - S
# красный - M
# красный - L
# синий - S
# синий - M
# синий - L
```

Параметр `repeat` задаёт количество повторений одной последовательности:

```python
import itertools

# Все пары из цифр 0 и 1 (двоичные числа длиной 2)
for bits in itertools.product([0, 1], repeat=2):
    print(bits)
# (0, 0) (0, 1) (1, 0) (1, 1)
```

### permutations

`permutations(iterable, r=None)` возвращает все перестановки длиной `r`. Порядок важен — `(A, B)` и `(B, A)` считаются разными.

```python
import itertools

team = ["Алиса", "Боб", "Виктор"]
for perm in itertools.permutations(team, 2):
    print(perm)
# ('Алиса', 'Боб')
# ('Алиса', 'Виктор')
# ('Боб', 'Алиса')
# ('Боб', 'Виктор')
# ('Виктор', 'Алиса')
# ('Виктор', 'Боб')
```

### combinations

`combinations(iterable, r)` возвращает все комбинации длиной `r` без повторений. В отличие от `permutations`, порядок не важен.

```python
import itertools

players = ["Алиса", "Боб", "Виктор", "Галина"]
for combo in itertools.combinations(players, 2):
    print(combo)
# ('Алиса', 'Боб')
# ('Алиса', 'Виктор')
# ('Алиса', 'Галина')
# ('Боб', 'Виктор')
# ('Боб', 'Галина')
# ('Виктор', 'Галина')
```

### combinations_with_replacement

`combinations_with_replacement(iterable, r)` — то же, что `combinations`, но элемент может повторяться.

```python
import itertools

for combo in itertools.combinations_with_replacement([1, 2, 3], 2):
    print(combo)
# (1, 1) (1, 2) (1, 3) (2, 2) (2, 3) (3, 3)
```

## Завершающие итераторы

### chain

`chain(*iterables)` соединяет несколько итерируемых объектов в один последовательный поток.

```python
import itertools

list1 = [1, 2, 3]
list2 = [4, 5]
list3 = [6, 7, 8, 9]

result = list(itertools.chain(list1, list2, list3))
print(result)
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

`chain.from_iterable` принимает одну вложенную последовательность — удобно для «расплющивания» списков:

```python
import itertools

nested = [[1, 2], [3, 4], [5, 6]]
flat = list(itertools.chain.from_iterable(nested))
print(flat)
# [1, 2, 3, 4, 5, 6]
```

### islice

`islice(iterable, stop)` или `islice(iterable, start, stop, step)` — аналог срезов для итераторов. Позволяет ограничить вывод бесконечного итератора.

```python
import itertools

# Первые 5 чётных чисел начиная с 0
even = itertools.islice(itertools.count(0, 2), 5)
print(list(even))
# [0, 2, 4, 6, 8]

# Элементы с 3 по 7
data = range(10)
sliced = list(itertools.islice(data, 3, 7))
print(sliced)
# [3, 4, 5, 6]
```

### takewhile и dropwhile

`takewhile(predicate, iterable)` берёт элементы, пока предикат возвращает `True`, и останавливается при первом `False`.

`dropwhile(predicate, iterable)` пропускает элементы, пока предикат `True`, и начинает отдавать с первого `False`.

```python
import itertools

data = [1, 3, 5, 2, 4, 6, 7]

taken = list(itertools.takewhile(lambda x: x < 4, data))
print(taken)
# [1, 3] — остановились на 5, потому что 5 >= 4

dropped = list(itertools.dropwhile(lambda x: x < 4, data))
print(dropped)
# [5, 2, 4, 6, 7] — пропустили 1 и 3, начали с 5
```

### filterfalse

`filterfalse(predicate, iterable)` — обратный фильтр: пропускает только те элементы, для которых предикат возвращает `False`.

```python
import itertools

numbers = range(10)
odd = list(itertools.filterfalse(lambda x: x % 2 == 0, numbers))
print(odd)
# [1, 3, 5, 7, 9]
```

### compress

`compress(data, selectors)` фильтрует `data`, оставляя только элементы, для которых соответствующий элемент в `selectors` истинен.

```python
import itertools

items = ["яблоко", "банан", "вишня", "дыня"]
mask = [1, 0, 1, 0]

result = list(itertools.compress(items, mask))
print(result)
# ['яблоко', 'вишня']
```

### groupby

`groupby(iterable, key=None)` группирует последовательные элементы с одинаковым ключом. Важно: данные должны быть отсортированы по тому же ключу.

```python
import itertools

employees = [
    {"name": "Иван", "dept": "backend"},
    {"name": "Мария", "dept": "backend"},
    {"name": "Алексей", "dept": "frontend"},
    {"name": "Ольга", "dept": "frontend"},
    {"name": "Дмитрий", "dept": "devops"},
]

sorted_employees = sorted(employees, key=lambda e: e["dept"])

for dept, group in itertools.groupby(sorted_employees, key=lambda e: e["dept"]):
    names = [e["name"] for e in group]
    print(f"{dept}: {', '.join(names)}")
# backend: Иван, Мария
# devops: Дмитрий
# frontend: Алексей, Ольга
```

### accumulate

`accumulate(iterable, func=operator.add, initial=None)` возвращает накопленные результаты функции.

```python
import itertools
import operator

# Нарастающая сумма
sales = [100, 250, 80, 320, 150]
running_total = list(itertools.accumulate(sales))
print(running_total)
# [100, 350, 430, 750, 900]

# Нарастающее произведение
factorials = list(itertools.accumulate(range(1, 6), operator.mul))
print(factorials)
# [1, 2, 6, 24, 120]

# Нарастающий максимум
prices = [5, 3, 8, 2, 9, 4]
peak = list(itertools.accumulate(prices, max))
print(peak)
# [5, 5, 8, 8, 9, 9]
```

### starmap

`starmap(func, iterable)` применяет функцию к каждому элементу, распаковывая кортеж как аргументы.

```python
import itertools

pairs = [(2, 3), (4, 2), (5, 3)]
result = list(itertools.starmap(pow, pairs))
print(result)
# [8, 16, 125]
```

Это эквивалентно `[pow(2, 3), pow(4, 2), pow(5, 3)]`, но более выразительно при работе с готовыми парами аргументов.

### zip_longest

`zip_longest(*iterables, fillvalue=None)` — аналог встроенного `zip`, но не останавливается на короткой последовательности, а заполняет недостающие значения.

```python
import itertools

names = ["Иван", "Мария", "Алексей"]
scores = [95, 87]

for name, score in itertools.zip_longest(names, scores, fillvalue=0):
    print(f"{name}: {score}")
# Иван: 95
# Мария: 87
# Алексей: 0
```

### tee

`tee(iterable, n=2)` создаёт `n` независимых копий итератора. Полезно, когда нужно пройти по одной последовательности несколько раз.

```python
import itertools

def expensive_generator():
    for i in range(5):
        print(f"вычисляю {i}")
        yield i

it1, it2 = itertools.tee(expensive_generator())

print("Сумма:", sum(it1))
print("Максимум:", max(it2))
# Каждый элемент генератора вычисляется ровно один раз
```

Важно: после передачи итератора в `tee` нельзя использовать оригинал напрямую.

## Практический пример: анализ логов

Объединим несколько инструментов для обработки лог-файла:

```python
import itertools

logs = [
    {"level": "INFO", "message": "Сервер запущен"},
    {"level": "INFO", "message": "Запрос от 192.168.1.1"},
    {"level": "ERROR", "message": "Подключение к БД прервано"},
    {"level": "ERROR", "message": "Таймаут запроса"},
    {"level": "WARNING", "message": "Высокая нагрузка"},
    {"level": "INFO", "message": "Запрос от 10.0.0.2"},
    {"level": "ERROR", "message": "Недостаточно памяти"},
]

# Группируем по уровню
sorted_logs = sorted(logs, key=lambda x: x["level"])
for level, group in itertools.groupby(sorted_logs, key=lambda x: x["level"]):
    messages = list(group)
    print(f"[{level}] ({len(messages)} записей):")
    for log in messages:
        print(f"  - {log['message']}")

# Только ошибки: compress по маске
errors_mask = [log["level"] == "ERROR" for log in logs]
errors = list(itertools.compress(logs, errors_mask))
print(f"\nВсего ошибок: {len(errors)}")
```

## Советы по использованию

### Итераторы одноразовые

Итераторы из `itertools` можно пройти только один раз. Чтобы использовать результат несколько раз, оберните в `list()`:

```python
import itertools

it = itertools.chain([1, 2], [3, 4])
print(list(it))  # [1, 2, 3, 4]
print(list(it))  # [] — итератор исчерпан

# Правильно:
result = list(itertools.chain([1, 2], [3, 4]))
print(result)    # [1, 2, 3, 4]
print(result)    # [1, 2, 3, 4]
```

### Цепочки функций

Настоящая мощь `itertools` раскрывается в комбинировании функций:

```python
import itertools

# Нечётные числа, которые меньше 20, из двух разных источников
set1 = range(1, 15)
set2 = range(10, 25)

result = list(
    itertools.takewhile(
        lambda x: x < 20,
        itertools.filterfalse(
            lambda x: x % 2 == 0,
            itertools.chain(set1, set2)
        )
    )
)
print(result)
# [1, 3, 5, 7, 9, 11, 13, 11, 13, 15, 17, 19]
```

### Экономия памяти

Сравним потребление памяти при работе с большим объёмом данных:

```python
import itertools
import sys

# Список: создаёт все элементы сразу
big_list = list(range(1_000_000))
print(sys.getsizeof(big_list))  # ~8 МБ

# Итератор: хранит только текущее состояние
big_iter = itertools.islice(itertools.count(), 1_000_000)
print(sys.getsizeof(big_iter))  # несколько десятков байт
```

## Итого

Модуль `itertools` — обязательный инструмент в арсенале Python-разработчика. Он позволяет:

- Работать с потенциально бесконечными последовательностями через `count`, `cycle`, `repeat`.
- Перебирать все комбинации и перестановки через `product`, `permutations`, `combinations`.
- Эффективно фильтровать, группировать и трансформировать данные через `chain`, `groupby`, `accumulate`, `compress` и другие функции.
- Экономить память, работая в потоковом режиме без создания промежуточных списков.

Знание `itertools` отличает разработчика, который пишет выразительный и производительный Python-код, от тех, кто решает те же задачи вручную через циклы.

Чтобы глубже освоить Python и научиться писать профессиональный код — пройдите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-itertools