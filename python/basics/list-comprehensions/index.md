---
metaTitle: "List comprehensions в Python — списочные включения"
metaDescription: "Полное руководство по списочным включениям в Python: синтаксис, фильтрация, вложенные включения и сравнение с циклами."
author: "Антон Ларичев"
title: "Python list comprehensions — списочные включения"
preview: "Разбираем списочные включения Python: от базового синтаксиса до вложенных конструкций и сравнения с генераторными выражениями."
---

## Что такое списочные включения

Списочные включения (list comprehensions) — лаконичный способ создавать новые списки на основе существующих итерируемых объектов. Они позволяют заменить многострочные циклы `for` одной выразительной строкой кода.

Базовый синтаксис:

```python
[выражение for элемент in итерируемый_объект]
```

Сравним два подхода: традиционный цикл и списочное включение.

```python
# Традиционный подход
squares = []
for x in range(10):
    squares.append(x ** 2)

# Списочное включение
squares = [x ** 2 for x in range(10)]

print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

Оба варианта дают одинаковый результат, но списочное включение компактнее и читается как математическое выражение.

## Синтаксис с условием

Списочные включения поддерживают фильтрацию элементов с помощью условия `if`.

```python
[выражение for элемент in итерируемый_объект if условие]
```

Отбор чётных чисел:

```python
numbers = range(20)
evens = [n for n in numbers if n % 2 == 0]
print(evens)  # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
```

Фильтрация строк по длине:

```python
words = ["cat", "elephant", "dog", "rhinoceros", "ant"]
long_words = [word for word in words if len(word) > 4]
print(long_words)  # ['elephant', 'rhinoceros']
```

Отбор только положительных чисел из смешанного списка:

```python
mixed = [-5, -1, 0, 3, 7, -2, 10]
positives = [n for n in mixed if n > 0]
print(positives)  # [3, 7, 10]
```

## Тернарное выражение в списочных включениях

Иногда нужно не отфильтровать элементы, а преобразовать их по условию. Для этого используют тернарный оператор в части `выражение`.

```python
[значение_если_истина if условие else значение_если_ложь for элемент in итерируемый_объект]
```

```python
numbers = range(10)
labels = ["чётное" if n % 2 == 0 else "нечётное" for n in numbers]
print(labels)
# ['чётное', 'нечётное', 'чётное', 'нечётное', 'чётное', 'нечётное', 'чётное', 'нечётное', 'чётное', 'нечётное']
```

Замена отрицательных значений нулём:

```python
data = [-3, 5, -1, 8, -7, 2]
clamped = [n if n >= 0 else 0 for n in data]
print(clamped)  # [0, 5, 0, 8, 0, 2]
```

Важно понимать разницу: `if` после `for` — это фильтр (элемент может не попасть в результат), а тернарное `if...else` в начале — это трансформация (все элементы остаются, но могут быть изменены).

## Вложенные списочные включения

Можно использовать несколько циклов `for` внутри одного включения. Это полезно при работе с многомерными структурами данных.

### Транспонирование матрицы

```python
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

transposed = [[row[i] for row in matrix] for i in range(3)]
print(transposed)
# [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
```

### Выравнивание вложенного списка

```python
nested = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]
flat = [item for sublist in nested for item in sublist]
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

Порядок циклов в записи совпадает с порядком при развёрнутой записи:

```python
# Эквивалентный код с вложенными циклами
flat = []
for sublist in nested:
    for item in sublist:
        flat.append(item)
```

### Декартово произведение

```python
colors = ["red", "green", "blue"]
sizes = ["S", "M", "L"]
combinations = [(color, size) for color in colors for size in sizes]
print(combinations)
# [('red', 'S'), ('red', 'M'), ('red', 'L'), ('green', 'S'), ...]
```

## Практические примеры

### Обработка данных

Преобразование списка строк: удаление пробелов и перевод в нижний регистр.

```python
raw_data = ["  Alice ", "BOB  ", "  Charlie"]
cleaned = [name.strip().lower() for name in raw_data]
print(cleaned)  # ['alice', 'bob', 'charlie']
```

Извлечение конкретных полей из списка словарей:

```python
users = [
    {"name": "Alice", "age": 30, "active": True},
    {"name": "Bob", "age": 25, "active": False},
    {"name": "Charlie", "age": 35, "active": True},
]

active_names = [user["name"] for user in users if user["active"]]
print(active_names)  # ['Alice', 'Charlie']
```

### Работа с файлами

Чтение строк из файла с фильтрацией пустых строк и комментариев:

```python
with open("config.txt") as f:
    lines = [line.strip() for line in f if line.strip() and not line.startswith("#")]
```

### Преобразование типов

Конвертация строк в числа:

```python
str_numbers = ["1", "2", "3", "4", "5"]
numbers = [int(n) for n in str_numbers]
print(numbers)  # [1, 2, 3, 4, 5]
```

Получение ASCII-кодов символов:

```python
text = "hello"
codes = [ord(c) for c in text]
print(codes)  # [104, 101, 108, 108, 111]
```

### Вызов функций внутри включения

```python
import math

angles = [0, 30, 45, 60, 90]
radians = [math.radians(a) for a in angles]
sines = [round(math.sin(r), 4) for r in radians]
print(sines)  # [0.0, 0.5, 0.7071, 0.866, 1.0]
```

## Сравнение производительности

Списочные включения, как правило, быстрее эквивалентных циклов `for` с `append`, потому что интерпретатор Python оптимизирует их выполнение на уровне байт-кода.

```python
import timeit

def using_loop():
    result = []
    for i in range(1000):
        result.append(i ** 2)
    return result

def using_comprehension():
    return [i ** 2 for i in range(1000)]

loop_time = timeit.timeit(using_loop, number=10000)
comp_time = timeit.timeit(using_comprehension, number=10000)

print(f"Цикл: {loop_time:.3f}s")
print(f"Включение: {comp_time:.3f}s")
# Включение обычно быстрее на 15–30%
```

## Генераторные выражения vs списочные включения

Если результат нужен только для итерации — передать в `sum()`, `max()`, `any()` — стоит использовать генераторное выражение. Оно не создаёт список в памяти, а вычисляет значения по одному.

```python
# Списочное включение — создаёт весь список в памяти
total = sum([x ** 2 for x in range(1_000_000)])

# Генераторное выражение — вычисляет по одному значению
total = sum(x ** 2 for x in range(1_000_000))
```

Разница в памяти ощутима:

```python
import sys

list_comp = [x ** 2 for x in range(10000)]
gen_expr = (x ** 2 for x in range(10000))

print(sys.getsizeof(list_comp))  # ~87616 байт
print(sys.getsizeof(gen_expr))   # ~208 байт
```

Генераторное выражение отличается только отсутствием квадратных скобок. Когда нужен конкретный список для дальнейшего обращения по индексу или многократного перебора — используйте списочное включение. Когда нужен лишь однократный проход — генераторное.

## Словарные и множественные включения

Аналогичный синтаксис работает для словарей и множеств.

### Словарные включения (dict comprehensions)

```python
# Создание словаря из списка
words = ["apple", "banana", "cherry"]
word_lengths = {word: len(word) for word in words}
print(word_lengths)  # {'apple': 5, 'banana': 6, 'cherry': 6}

# Инвертирование словаря
original = {"a": 1, "b": 2, "c": 3}
inverted = {v: k for k, v in original.items()}
print(inverted)  # {1: 'a', 2: 'b', 3: 'c'}

# Фильтрация записей
prices = {"apple": 50, "banana": 30, "mango": 120, "grape": 90}
cheap = {name: price for name, price in prices.items() if price < 100}
print(cheap)  # {'apple': 50, 'banana': 30, 'grape': 90}
```

### Множественные включения (set comprehensions)

```python
words = ["cat", "dog", "ant", "elephant", "bee"]
unique_lengths = {len(word) for word in words}
print(unique_lengths)  # {3, 8} (порядок не гарантирован)

# Уникальные первые буквы
first_letters = {word[0] for word in words}
print(first_letters)  # {'c', 'd', 'a', 'e', 'b'}
```

## Ограничения и рекомендации

### Когда не стоит использовать

Списочные включения теряют читаемость при усложнении. Если включение занимает больше двух строк или содержит три и более вложенных цикла — лучше переписать его обычным циклом.

```python
# Сложно читать — лучше заменить на цикл
result = [transform(x) for x in range(100) if check_a(x) if check_b(x)]

# Понятнее
result = []
for x in range(100):
    if check_a(x) and check_b(x):
        result.append(transform(x))
```

### Не используйте для побочных эффектов

Если цель — выполнить действие для каждого элемента, а не собрать новый список, используйте обычный цикл.

```python
# Плохо — создаётся ненужный список None
[print(item) for item in items]

# Хорошо
for item in items:
    print(item)
```

### Вложенность не более двух уровней

Один вложенный `for` — приемлемо. Два и более — сигнал о том, что код нужно разбить на функции или переписать явными циклами.

```python
# Приемлемо
flat = [item for sublist in nested for item in sublist]

# Избегать — три уровня вложенности
result = [z for x in a for y in x for z in y]

# Лучше через функцию
def flatten_deep(data):
    result = []
    for x in data:
        for y in x:
            for z in y:
                result.append(z)
    return result
```

## Итог

Списочные включения — один из наиболее характерных инструментов Python. Они делают код компактным и выразительным при соблюдении простого правила: одно включение — одна понятная мысль. Для простых преобразований и фильтрации они предпочтительнее цикла. Для сложной логики с побочными эффектами — используйте явные циклы. Для обработки больших данных без хранения в памяти — генераторные выражения.

Изучить Python глубже и научиться применять все его возможности на реальных проектах можно на курсе [Python-разработчик](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-list-comprehensions).
