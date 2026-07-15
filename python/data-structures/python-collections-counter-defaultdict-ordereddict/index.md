---
metaTitle: "Python collections: Counter, defaultdict, OrderedDict"
metaDescription: "Подробный разбор модуля collections в Python: Counter для подсчёта элементов, defaultdict для группировки, OrderedDict для упорядоченных словарей."
author: "Антон Ларичев"
title: "Python collections — Counter, defaultdict, OrderedDict"
preview: "Разбираем три ключевых класса модуля collections: Counter, defaultdict и OrderedDict — с практическими примерами и типичными задачами."
---

## Модуль collections в Python

Python поставляется с мощным стандартным модулем `collections`, который расширяет возможности встроенных типов данных. Три наиболее часто используемых класса из этого модуля — `Counter`, `defaultdict` и `OrderedDict` — решают конкретные задачи, с которыми регулярно сталкиваются разработчики.

## Counter — подсчёт элементов

`Counter` — это подкласс `dict`, предназначенный для подсчёта частоты элементов в итерируемом объекте. Он позволяет избежать ручного написания цикла с условной проверкой.

### Создание Counter

```python
from collections import Counter

# Из строки
char_count = Counter("hello world")
print(char_count)
# Counter({'l': 3, 'o': 2, 'h': 1, 'e': 1, ' ': 1, 'w': 1, 'r': 1, 'd': 1})

# Из списка
fruits = Counter(["apple", "banana", "apple", "cherry", "banana", "apple"])
print(fruits)
# Counter({'apple': 3, 'banana': 2, 'cherry': 1})

# Из словаря
scores = Counter({"alice": 5, "bob": 3, "charlie": 5})
print(scores)
# Counter({'alice': 5, 'charlie': 5, 'bob': 3})

# С именованными аргументами
votes = Counter(python=10, javascript=8, typescript=6)
print(votes)
# Counter({'python': 10, 'javascript': 8, 'typescript': 6})
```

### Основные методы Counter

```python
from collections import Counter

words = Counter(["python", "java", "python", "go", "python", "java", "rust"])

# most_common(n) — n наиболее частых элементов
print(words.most_common(2))
# [('python', 3), ('java', 2)]

# most_common() без аргумента — все элементы, отсортированные по частоте
print(words.most_common())
# [('python', 3), ('java', 2), ('go', 1), ('rust', 1)]

# elements() — итерация с повторением согласно счётчику
print(list(words.elements()))
# ['python', 'python', 'python', 'java', 'java', 'go', 'rust']

# subtract() — вычитание счётчиков
other = Counter(["python", "java"])
words.subtract(other)
print(words)
# Counter({'python': 2, 'go': 1, 'rust': 1, 'java': 1})

# update() — добавление к счётчику
words.update(["go", "go"])
print(words)
# Counter({'go': 3, 'python': 2, 'java': 1, 'rust': 1})
```

### Арифметика с Counter

`Counter` поддерживает математические операции между счётчиками:

```python
from collections import Counter

a = Counter(python=4, java=2, go=1)
b = Counter(python=1, java=3, rust=2)

# Сложение — объединение с суммированием
print(a + b)
# Counter({'python': 5, 'java': 5, 'rust': 2, 'go': 1})

# Вычитание — только положительные результаты
print(a - b)
# Counter({'python': 3, 'go': 1})

# Пересечение — минимальные значения
print(a & b)
# Counter({'java': 2, 'python': 1})

# Объединение — максимальные значения
print(a | b)
# Counter({'python': 4, 'java': 3, 'rust': 2, 'go': 1})
```

### Практические примеры с Counter

Анализ частоты слов в тексте:

```python
from collections import Counter
import re

text = """
Python — высокоуровневый язык программирования общего назначения.
Python широко используется в анализе данных, веб-разработке
и машинном обучении. Python прост в изучении.
"""

words = re.findall(r'\b[а-яёА-ЯЁa-zA-Z]+\b', text.lower())
word_count = Counter(words)

print("Топ-5 слов:")
for word, count in word_count.most_common(5):
    print(f"  {word}: {count}")
```

Проверка анаграмм:

```python
from collections import Counter

def are_anagrams(word1: str, word2: str) -> bool:
    return Counter(word1.lower()) == Counter(word2.lower())

print(are_anagrams("listen", "silent"))  # True
print(are_anagrams("hello", "world"))    # False

# Версия без учёта пробелов
def are_anagrams_clean(word1: str, word2: str) -> bool:
    clean = lambda s: Counter(s.lower().replace(" ", ""))
    return clean(word1) == clean(word2)

print(are_anagrams_clean("Astronomer", "Moon starer"))  # True
```

## defaultdict — словарь с дефолтным значением

`defaultdict` — подкласс `dict`, который не выбрасывает `KeyError` при обращении к несуществующему ключу, а автоматически создаёт его с дефолтным значением через переданную фабричную функцию.

### Проблема, которую решает defaultdict

Без `defaultdict` группировка элементов выглядит громоздко:

```python
# Без defaultdict
students = [("alice", "math"), ("bob", "physics"), ("alice", "physics"), ("charlie", "math")]

groups = {}
for student, subject in students:
    if student not in groups:
        groups[student] = []
    groups[student].append(subject)

print(groups)
# {'alice': ['math', 'physics'], 'bob': ['physics'], 'charlie': ['math']}
```

С `defaultdict` код становится чище:

```python
from collections import defaultdict

students = [("alice", "math"), ("bob", "physics"), ("alice", "physics"), ("charlie", "math")]

groups = defaultdict(list)
for student, subject in students:
    groups[student].append(subject)

print(dict(groups))
# {'alice': ['math', 'physics'], 'bob': ['physics'], 'charlie': ['math']}
```

### Типы фабричных функций

```python
from collections import defaultdict

# int — для счётчиков (дефолт 0)
word_count = defaultdict(int)
for word in ["python", "java", "python", "go"]:
    word_count[word] += 1
print(dict(word_count))
# {'python': 2, 'java': 1, 'go': 1}

# list — для группировки
grouped = defaultdict(list)
for key, value in [("a", 1), ("b", 2), ("a", 3)]:
    grouped[key].append(value)
print(dict(grouped))
# {'a': [1, 3], 'b': [2]}

# set — для уникальных значений
unique_values = defaultdict(set)
for key, value in [("a", 1), ("b", 2), ("a", 1), ("a", 3)]:
    unique_values[key].add(value)
print(dict(unique_values))
# {'a': {1, 3}, 'b': {2}}

# lambda — произвольное дефолтное значение
config = defaultdict(lambda: "N/A")
config["host"] = "localhost"
print(config["host"])   # localhost
print(config["port"])   # N/A
```

### Вложенные defaultdict

```python
from collections import defaultdict

# Двухуровневый defaultdict — матрица смежности графа
graph = defaultdict(lambda: defaultdict(int))

graph["A"]["B"] += 1
graph["A"]["C"] += 2
graph["B"]["C"] += 1

for node, edges in graph.items():
    for neighbor, weight in edges.items():
        print(f"{node} -> {neighbor}: {weight}")
# A -> B: 1
# A -> C: 2
# B -> C: 1
```

### Практический пример — инвертированный индекс

```python
from collections import defaultdict

documents = {
    1: "python programming language",
    2: "java programming tutorial",
    3: "python tutorial for beginners",
    4: "advanced python programming",
}

inverted_index = defaultdict(list)

for doc_id, text in documents.items():
    for word in text.split():
        inverted_index[word].append(doc_id)

def search(query: str) -> list:
    results = set()
    for word in query.split():
        results.update(inverted_index.get(word, []))
    return sorted(results)

print(search("python"))          # [1, 3, 4]
print(search("programming"))     # [1, 2, 4]
print(search("python tutorial")) # [1, 2, 3, 4]
```

## OrderedDict — словарь с сохранением порядка

`OrderedDict` — подкласс `dict`, который гарантирует порядок вставки ключей и предоставляет дополнительные методы для управления им. Начиная с Python 3.7 обычные словари тоже сохраняют порядок вставки, однако `OrderedDict` остаётся полезным благодаря уникальным возможностям.

### Создание и базовое использование

```python
from collections import OrderedDict

od = OrderedDict()
od["first"] = 1
od["second"] = 2
od["third"] = 3

for key, value in od.items():
    print(f"{key}: {value}")
# first: 1
# second: 2
# third: 3

# Создание из списка пар
od2 = OrderedDict([("x", 10), ("y", 20), ("z", 30)])
print(od2)
# OrderedDict([('x', 10), ('y', 20), ('z', 30)])
```

### Уникальные возможности OrderedDict

```python
from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3), ("d", 4)])

# move_to_end() — перемещение ключа в конец
od.move_to_end("b")
print(list(od.keys()))
# ['a', 'c', 'd', 'b']

# move_to_end(last=False) — перемещение в начало
od.move_to_end("d", last=False)
print(list(od.keys()))
# ['d', 'a', 'c', 'b']

# popitem() — удаление последнего элемента (LIFO)
last = od.popitem()
print(last)  # ('b', 2)

# popitem(last=False) — удаление первого элемента (FIFO)
first = od.popitem(last=False)
print(first)  # ('d', 4)

print(list(od.keys()))
# ['a', 'c']
```

### Сравнение с учётом порядка

Ключевое отличие `OrderedDict` от обычного `dict` — учёт порядка при сравнении:

```python
from collections import OrderedDict

# Обычные dict — порядок не важен
d1 = {"a": 1, "b": 2}
d2 = {"b": 2, "a": 1}
print(d1 == d2)  # True

# OrderedDict — порядок важен
od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])
print(od1 == od2)  # False

# При сравнении OrderedDict с dict порядок не учитывается
d3 = {"a": 1, "b": 2}
od3 = OrderedDict([("b", 2), ("a", 1)])
print(d3 == od3)  # True
```

### Практический пример — LRU Cache

`OrderedDict` идеально подходит для реализации кэша с вытеснением давно неиспользуемых элементов:

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        # Перемещаем в конец — элемент недавно использовался
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            # Удаляем самый давно неиспользуемый элемент (первый)
            self.cache.popitem(last=False)

    def __repr__(self) -> str:
        return f"LRUCache({dict(self.cache)})"


cache = LRUCache(3)
cache.put(1, "one")
cache.put(2, "two")
cache.put(3, "three")
print(cache)  # LRUCache({1: 'one', 2: 'two', 3: 'three'})

cache.get(1)         # ключ 1 перемещается в конец
cache.put(4, "four") # вытесняем самый старый — ключ 2
print(cache)  # LRUCache({3: 'three', 1: 'one', 4: 'four'})
```

## Комбинирование инструментов

Классы из `collections` хорошо работают вместе. Пример — анализ логов с группировкой по пользователю и подсчётом частоты эндпоинтов:

```python
from collections import Counter, defaultdict

logs = [
    ("alice", "/api/users"),
    ("bob", "/api/products"),
    ("alice", "/api/users"),
    ("alice", "/api/orders"),
    ("bob", "/api/users"),
    ("charlie", "/api/products"),
]

# defaultdict(Counter) — группируем по пользователю, считаем эндпоинты
user_stats = defaultdict(Counter)

for user, endpoint in logs:
    user_stats[user][endpoint] += 1

for user, endpoints in user_stats.items():
    print(f"\n{user}:")
    for endpoint, count in endpoints.most_common():
        print(f"  {endpoint}: {count}")

# alice:
#   /api/users: 2
#   /api/orders: 1
# bob:
#   /api/products: 1
#   /api/users: 1
# charlie:
#   /api/products: 1
```

## Выбор нужного инструмента

| Задача | Инструмент |
|--------|------------|
| Подсчёт частоты элементов | `Counter` |
| Поиск топ-N элементов | `Counter.most_common()` |
| Сравнение двух наборов данных | `Counter` (арифметика) |
| Группировка данных по ключу | `defaultdict(list)` |
| Счётчик без проверки KeyError | `defaultdict(int)` |
| Сбор уникальных значений по ключу | `defaultdict(set)` |
| Кэш с гарантированным порядком | `OrderedDict` |
| LRU-кэш | `OrderedDict` |
| Сравнение словарей с учётом порядка | `OrderedDict` |

Модуль `collections` — это часть стандартной библиотеки Python, не требующая дополнительной установки. Знание его инструментов позволяет писать более идиоматичный и эффективный код: `Counter` избавляет от ручных счётчиков, `defaultdict` убирает лишние проверки при группировке, а `OrderedDict` решает задачи, где критичен порядок ключей.

Чтобы уверенно использовать все возможности Python — от стандартной библиотеки до продвинутых паттернов — изучите полный курс по Python на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-collections