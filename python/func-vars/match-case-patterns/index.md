---
metaTitle: Паттерны match/case в Python — деструктуризация, guard и вложенные шаблоны
metaDescription: Разбираем продвинутые паттерны match/case в Python 3.10+, деструктуризацию кортежей, списков и словарей, guard-условия, шаблоны классов и вложенные паттерны.
author: Антон Ларичев
title: Паттерны match/case в Python — деструктуризация, guard и вложенные шаблоны
preview: Изучаем продвинутые паттерны match/case в Python 3.10+ — деструктуризацию структур данных, guard-условия, шаблоны классов и вложенные паттерны.
---

## Введение

Базовый `match/case` с литералами — это лишь вершина айсберга. Настоящая мощь структурного сопоставления в Python 3.10+ раскрывается при работе с паттернами: деструктуризацией кортежей и списков, guard-условиями, шаблонами классов и вложенными паттернами. Именно эти возможности отличают `match/case` от обычного `switch` в других языках.

В этой статье мы подробно разберём каждый тип паттерна и покажем, как их комбинировать для обработки сложных структур данных.

## Деструктуризация кортежей

Один из самых полезных сценариев — разбор кортежей на составные части прямо в шаблоне `case`.

```python
# Деструктуризация кортежа с координатами
def describe_point(point):
    match point:
        case (0, 0):
            return "Начало координат"
        case (x, 0):
            return f"На оси X, x={x}"
        case (0, y):
            return f"На оси Y, y={y}"
        case (x, y):
            return f"Точка ({x}, {y})"

print(describe_point((0, 0)))    # Начало координат
print(describe_point((5, 0)))    # На оси X, x=5
print(describe_point((0, 3)))    # На оси Y, y=3
print(describe_point((2, 7)))    # Точка (2, 7)
```

Python автоматически распаковывает кортеж и привязывает каждый элемент к указанной переменной. Шаблон совпадает только если количество элементов и фиксированные значения (0 в данном случае) совпадают.

```python
# Деструктуризация кортежа с тремя элементами
def handle_rgb(color):
    match color:
        case (0, 0, 0):
            return "Чёрный"
        case (255, 255, 255):
            return "Белый"
        case (r, 0, 0):
            return f"Оттенок красного (r={r})"
        case (0, g, 0):
            return f"Оттенок зелёного (g={g})"
        case (0, 0, b):
            return f"Оттенок синего (b={b})"
        case (r, g, b):
            return f"RGB({r}, {g}, {b})"

print(handle_rgb((255, 255, 255)))  # Белый
print(handle_rgb((128, 0, 0)))      # Оттенок красного (r=128)
print(handle_rgb((10, 20, 30)))     # RGB(10, 20, 30)
```

## Деструктуризация списков и последовательностей

Аналогично кортежам можно деструктурировать списки. Также поддерживается оператор `*` для захвата оставшихся элементов.

```python
# Деструктуризация списка с оператором *
def process_args(args):
    match args:
        case []:
            return "Нет аргументов"
        case [single]:
            return f"Один аргумент: {single}"
        case [first, second]:
            return f"Два аргумента: {first} и {second}"
        case [first, *rest]:
            return f"Первый: {first}, остальные: {rest}"

print(process_args([]))              # Нет аргументов
print(process_args(["hello"]))       # Один аргумент: hello
print(process_args(["a", "b"]))      # Два аргумента: a и b
print(process_args([1, 2, 3, 4]))    # Первый: 1, остальные: [2, 3, 4]
```

```python
# Разбор команды с аргументами
def parse_command(tokens):
    match tokens:
        case ["quit"]:
            return "Выход из программы"
        case ["go", direction]:
            return f"Движение: {direction}"
        case ["drop", *items] if items:
            return f"Бросить предметы: {', '.join(items)}"
        case ["drop", *items]:
            return "Ошибка: укажите что бросить"
        case _:
            return "Неизвестная команда"

print(parse_command(["go", "north"]))           # Движение: north
print(parse_command(["drop", "sword", "shield"]))  # Бросить предметы: sword, shield
print(parse_command(["drop"]))                  # Ошибка: укажите что бросить
```

## Guard-условия (if в case)

Guard-условие — это дополнительная проверка после шаблона, которая позволяет уточнить критерии совпадения. Блок `case` выполняется только если и шаблон совпал, и guard-условие вернуло `True`.

```python
# Guard-условия для проверки диапазонов
def classify_temperature(temp):
    match temp:
        case t if t < -30:
            return "Экстремальный мороз"
        case t if t < 0:
            return "Мороз"
        case t if t < 10:
            return "Холодно"
        case t if t < 20:
            return "Прохладно"
        case t if t < 30:
            return "Тепло"
        case t:
            return "Жарко"

print(classify_temperature(-35))  # Экстремальный мороз
print(classify_temperature(15))   # Прохладно
print(classify_temperature(35))   # Жарко
```

```python
# Комбинация деструктуризации и guard-условий
def process_order(order):
    match order:
        case (item, quantity) if quantity <= 0:
            return f"Ошибка: неверное количество для {item}"
        case (item, quantity) if quantity > 100:
            return f"Оптовый заказ: {item} x {quantity}"
        case (item, quantity):
            return f"Заказ: {item} x {quantity}"

print(process_order(("Книга", -1)))   # Ошибка: неверное количество для Книга
print(process_order(("Ручка", 500)))   # Оптовый заказ: Ручка x 500
print(process_order(("Тетрадь", 5)))   # Заказ: Тетрадь x 5
```

Если вы хотите детальнее изучить Python и его продвинутые возможности — приходите на наш большой курс [Python-разработчик с нуля](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=match-case-patterns).
На курсе 210 уроков и 150 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Деструктуризация словарей

`match/case` позволяет проверять наличие ключей в словаре и извлекать их значения. При этом словарь может содержать и другие ключи — они просто игнорируются.

```python
# Деструктуризация словаря
def handle_event(event):
    match event:
        case {"type": "click", "x": x, "y": y}:
            return f"Клик в позиции ({x}, {y})"
        case {"type": "keypress", "key": key}:
            return f"Нажата клавиша: {key}"
        case {"type": "scroll", "direction": direction}:
            return f"Прокрутка: {direction}"
        case {"type": event_type}:
            return f"Неизвестное событие: {event_type}"

print(handle_event({"type": "click", "x": 100, "y": 200, "timestamp": 123}))
# Клик в позиции (100, 200)

print(handle_event({"type": "keypress", "key": "Enter"}))
# Нажата клавиша: Enter
```

Обратите внимание: словарь в примере первого вызова содержит ключ `timestamp`, но он не мешает совпадению — шаблон требует только наличие указанных ключей.

## Шаблоны классов

Одна из мощнейших возможностей — сопоставление с экземплярами классов. Python проверяет тип объекта и может деструктурировать его атрибуты.

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

@dataclass
class Circle:
    center: Point
    radius: float

@dataclass
class Rectangle:
    top_left: Point
    width: float
    height: float

# Сопоставление с классами
def describe_shape(shape):
    match shape:
        case Circle(center=Point(x=0, y=0), radius=r):
            return f"Круг в начале координат с радиусом {r}"
        case Circle(center=center, radius=r):
            return f"Круг в ({center.x}, {center.y}) с радиусом {r}"
        case Rectangle(width=w, height=h) if w == h:
            return f"Квадрат со стороной {w}"
        case Rectangle(width=w, height=h):
            return f"Прямоугольник {w}x{h}"

print(describe_shape(Circle(Point(0, 0), 5)))
# Круг в начале координат с радиусом 5

print(describe_shape(Circle(Point(3, 4), 2)))
# Круг в (3, 4) с радиусом 2

print(describe_shape(Rectangle(Point(0, 0), 10, 10)))
# Квадрат со стороной 10
```

## Вложенные паттерны

Паттерны можно комбинировать и вкладывать друг в друга для обработки сложных вложенных структур.

```python
# Вложенные паттерны для обработки JSON-подобных данных
def process_response(data):
    match data:
        case {"status": "ok", "data": {"users": [first, *rest]}}:
            return f"Первый пользователь: {first}, ещё {len(rest)}"
        case {"status": "ok", "data": {"users": []}}:
            return "Пользователи не найдены"
        case {"status": "error", "message": msg}:
            return f"Ошибка: {msg}"
        case _:
            return "Неизвестный формат ответа"

print(process_response({
    "status": "ok",
    "data": {"users": ["Алиса", "Боб", "Чарли"]}
}))
# Первый пользователь: Алиса, ещё 2

print(process_response({
    "status": "error",
    "message": "Доступ запрещён"
}))
# Ошибка: Доступ запрещён
```

## Частые ошибки

* **Забытый guard при пересекающихся шаблонах** — если шаблон с переменной стоит раньше более конкретного, он перехватит все значения. Всегда размещайте более конкретные шаблоны первыми
* **Мутабельные значения в шаблонах словарей** — в шаблоне словаря нельзя использовать вычисляемые ключи, только строковые литералы
* **Неправильное количество элементов** — шаблон `(x, y)` совпадёт только с последовательностью из ровно двух элементов. Для переменного числа используйте `*rest`

## Частозадаваемые вопросы

**Можно ли использовать регулярные выражения в шаблонах?**
Напрямую нет, но можно использовать guard-условие с `re.match()`. Например: `case s if re.match(r'^\d+$', s):`.

**Работают ли шаблоны классов с обычными классами (не dataclass)?**
Да, но для обычных классов нужно явно указывать атрибуты через именованные параметры: `case MyClass(attr=value)`. С `dataclass` это работает автоматически благодаря `__match_args__`.

**Можно ли комбинировать OR-шаблоны с деструктуризацией?**
Да: `case (0, y) | (y, 0):` — совпадёт с точкой на любой из осей. Однако все ветви OR-шаблона должны привязывать одинаковые имена переменных.

## Заключение

Продвинутые паттерны `match/case` в Python — это мощный инструмент для обработки сложных структур данных. Деструктуризация кортежей, списков и словарей, guard-условия, шаблоны классов и вложенные паттерны позволяют писать выразительный и читаемый код для разбора данных, обработки событий и маршрутизации запросов.

Для закрепления навыков работы с продвинутыми возможностями Python рекомендуем курс [Python-разработчик с нуля](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=match-case-patterns).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет освоить основы языка и понять структуру курса до покупки полного доступа.
