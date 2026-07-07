---
metaTitle: "Декоратор @property в Python — геттеры и сеттеры"
metaDescription: "Как использовать декоратор @property в Python: геттеры, сеттеры, делитеры, валидация данных и вычисляемые свойства с примерами кода."
author: "Антон Ларичев"
title: "Декоратор @property в Python"
preview: "Разбираем декоратор @property: как создавать управляемые атрибуты, добавлять валидацию и вычисляемые свойства без изменения интерфейса класса."
---

## Что такое @property

Декоратор `@property` — это встроенный инструмент Python, который позволяет определять методы класса, работающие как обычные атрибуты. Благодаря ему можно добавить логику при чтении, записи или удалении атрибута, не меняя внешний интерфейс класса.

Представьте, что вы выпустили библиотеку с классом, у которого есть публичный атрибут `age`. Пользователи обращаются к нему напрямую: `person.age = 25`. Через время вам потребовалось добавить валидацию — проверять, что возраст не отрицательный. Если переименовать атрибут в метод `set_age()`, весь код пользователей сломается. `@property` решает эту проблему: снаружи всё выглядит как обычный атрибут, а внутри работает метод.

## Проблема без @property

Сначала посмотрим, как выглядит код без использования `@property`:

```python
class Person:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

person = Person("Иван", 30)
person.age = -5  # никакой валидации — ошибка пройдёт незамеченной
print(person.age)  # -5
```

Добавить проверку можно через явные методы:

```python
class Person:
    def __init__(self, name: str, age: int):
        self.name = name
        self._age = age

    def get_age(self) -> int:
        return self._age

    def set_age(self, value: int) -> None:
        if value < 0:
            raise ValueError("Возраст не может быть отрицательным")
        self._age = value

person = Person("Иван", 30)
person.set_age(25)       # неудобно
print(person.get_age())  # неудобно
```

Это работает, но пользователям приходится запоминать названия методов. `@property` даёт элегантную альтернативу.

## Базовый синтаксис геттера

Минимальное использование `@property` — это создание геттера, метода для чтения значения:

```python
class Person:
    def __init__(self, name: str, age: int):
        self.name = name
        self._age = age  # приватный атрибут по соглашению

    @property
    def age(self) -> int:
        return self._age

person = Person("Иван", 30)
print(person.age)  # 30 — обращение как к атрибуту, а не методу
print(person.age())  # TypeError: 'int' object is not callable
```

Обратите внимание: `person.age` — без скобок. Python автоматически вызывает метод при обращении к атрибуту.

Атрибут `_age` с одним подчёркиванием — соглашение об именовании в Python. Он говорит: «это внутренняя деталь реализации, не обращайся к нему напрямую». Двойное подчёркивание `__age` включает механизм name mangling и используется реже.

## Добавление сеттера

Чтобы разрешить запись значения, нужно определить сеттер с декоратором `@имя_свойства.setter`:

```python
class Person:
    def __init__(self, name: str, age: int):
        self.name = name
        self._age = age

    @property
    def age(self) -> int:
        return self._age

    @age.setter
    def age(self, value: int) -> None:
        if not isinstance(value, int):
            raise TypeError("Возраст должен быть целым числом")
        if value < 0:
            raise ValueError("Возраст не может быть отрицательным")
        if value > 150:
            raise ValueError("Возраст не может превышать 150 лет")
        self._age = value

person = Person("Иван", 30)
print(person.age)   # 30

person.age = 25     # вызывает сеттер
print(person.age)   # 25

person.age = -1     # ValueError: Возраст не может быть отрицательным
person.age = "30"   # TypeError: Возраст должен быть целым числом
```

Теперь запись через `person.age = значение` выглядит как обычное присваивание, но внутри работает метод с валидацией.

## Добавление делитера

Делитер вызывается при операторе `del`. Используется редко, но бывает полезен для сброса состояния или освобождения ресурсов:

```python
class DatabaseConnection:
    def __init__(self):
        self._connection = None

    @property
    def connection(self):
        if self._connection is None:
            raise RuntimeError("Соединение не установлено")
        return self._connection

    @connection.setter
    def connection(self, conn):
        self._connection = conn
        print("Соединение установлено")

    @connection.deleter
    def connection(self):
        if self._connection is not None:
            self._connection.close()
            self._connection = None
            print("Соединение закрыто")

db = DatabaseConnection()
db.connection = connect_to_db()  # устанавливаем соединение
del db.connection                 # закрываем соединение
```

## Свойства только для чтения

Если определить только геттер без сеттера, свойство станет доступным только для чтения:

```python
class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def radius(self) -> float:
        return self._radius

    @property
    def area(self) -> float:
        import math
        return math.pi * self._radius ** 2

    @property
    def circumference(self) -> float:
        import math
        return 2 * math.pi * self._radius

circle = Circle(5)
print(circle.radius)         # 5
print(circle.area)           # 78.53981633974483
print(circle.circumference)  # 31.41592653589793

circle.area = 100  # AttributeError: can't set attribute
```

Свойства `area` и `circumference` вычисляются динамически и не хранятся в памяти — они пересчитываются каждый раз при обращении.

## Вычисляемые свойства

`@property` удобен для свойств, которые зависят от других атрибутов:

```python
class Rectangle:
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    @property
    def area(self) -> float:
        return self.width * self.height

    @property
    def perimeter(self) -> float:
        return 2 * (self.width + self.height)

    @property
    def is_square(self) -> bool:
        return self.width == self.height

rect = Rectangle(4, 6)
print(rect.area)       # 24
print(rect.perimeter)  # 20
print(rect.is_square)  # False

rect.width = 6
print(rect.is_square)  # True — пересчитывается автоматически
```

## Валидация в конструкторе через сеттер

Часто применяют одну хитрость: вызывать сеттер прямо из `__init__`, чтобы валидация работала и при создании объекта:

```python
class Product:
    def __init__(self, name: str, price: float, quantity: int):
        self.name = name
        self.price = price      # вызывает сеттер
        self.quantity = quantity  # вызывает сеттер

    @property
    def price(self) -> float:
        return self._price

    @price.setter
    def price(self, value: float) -> None:
        if value < 0:
            raise ValueError("Цена не может быть отрицательной")
        self._price = float(value)

    @property
    def quantity(self) -> int:
        return self._quantity

    @quantity.setter
    def quantity(self, value: int) -> None:
        if not isinstance(value, int) or value < 0:
            raise ValueError("Количество должно быть неотрицательным целым числом")
        self._quantity = value

    @property
    def total_value(self) -> float:
        return self._price * self._quantity

# Валидация срабатывает уже при создании
try:
    product = Product("Ноутбук", -1000, 5)  # ValueError здесь
except ValueError as e:
    print(e)  # Цена не может быть отрицательной

product = Product("Ноутбук", 50000, 3)
print(product.total_value)  # 150000.0
```

Заметьте: в `__init__` используется `self.price = price`, а не `self._price = price`. Первый вариант вызывает сеттер, второй — обходит его.

## Наследование и переопределение свойств

При наследовании нужно быть внимательным с переопределением свойств. Если переопределяется только сеттер, геттер тоже нужно явно указать:

```python
class Animal:
    def __init__(self, name: str):
        self._name = name

    @property
    def name(self) -> str:
        return self._name

    @name.setter
    def name(self, value: str) -> None:
        self._name = value


class Pet(Animal):
    @property
    def name(self) -> str:
        return f"Питомец: {self._name}"

    @name.setter  # нельзя использовать Animal.name.setter здесь
    def name(self, value: str) -> None:
        if not value.strip():
            raise ValueError("Имя не может быть пустым")
        self._name = value.strip()


pet = Pet("Барсик")
print(pet.name)   # Питомец: Барсик
pet.name = "Мурзик"
print(pet.name)   # Питомец: Мурзик
```

Если переопределить только геттер в дочернем классе, сеттер из родителя перестанет работать — Python видит новый дескриптор без сеттера.

## Практический пример: класс Temperature

Собирём всё вместе в реальном примере — класс для работы с температурой, поддерживающий разные единицы измерения:

```python
class Temperature:
    ABSOLUTE_ZERO_CELSIUS = -273.15

    def __init__(self, celsius: float = 0):
        self.celsius = celsius  # через сеттер

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < self.ABSOLUTE_ZERO_CELSIUS:
            raise ValueError(
                f"Температура не может быть ниже абсолютного нуля ({self.ABSOLUTE_ZERO_CELSIUS}°C)"
            )
        self._celsius = float(value)

    @property
    def fahrenheit(self) -> float:
        return self._celsius * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value: float) -> None:
        self.celsius = (value - 32) * 5 / 9  # делегируем валидацию сеттеру celsius

    @property
    def kelvin(self) -> float:
        return self._celsius - self.ABSOLUTE_ZERO_CELSIUS

    @kelvin.setter
    def kelvin(self, value: float) -> None:
        if value < 0:
            raise ValueError("Температура в Кельвинах не может быть отрицательной")
        self.celsius = value + self.ABSOLUTE_ZERO_CELSIUS

    def __repr__(self) -> str:
        return f"Temperature({self._celsius:.2f}°C)"


temp = Temperature(100)
print(temp.celsius)     # 100.0
print(temp.fahrenheit)  # 212.0
print(temp.kelvin)      # 373.15

# Меняем через фаренгейты — остальные пересчитываются автоматически
temp.fahrenheit = 32
print(temp.celsius)  # 0.0
print(temp.kelvin)   # 273.15

# Попытка установить невозможную температуру
try:
    temp.celsius = -300
except ValueError as e:
    print(e)  # Температура не может быть ниже абсолютного нуля (-273.15°C)
```

## Когда использовать @property

`@property` подходит в следующих случаях:

- **Валидация при записи** — проверка типов, диапазонов, бизнес-правил
- **Вычисляемые атрибуты** — значения, которые зависят от других атрибутов
- **Ленивая инициализация** — дорогостоящие вычисления только при первом обращении
- **Логирование и отладка** — запись фактов обращения к атрибуту
- **Обратная совместимость** — добавление логики к существующему публичному атрибуту без изменения API

Не стоит использовать `@property` там, где достаточно обычного атрибута. Если нет валидации, вычисления или побочных эффектов — прямой атрибут проще и понятнее.

## Сравнение с __slots__

При использовании `__slots__` важно помнить, что `@property` остаётся на уровне класса, а `__slots__` управляет хранилищем экземпляра. Они совместимы:

```python
class Point:
    __slots__ = ("_x", "_y")

    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    @property
    def x(self) -> float:
        return self._x

    @x.setter
    def x(self, value: float) -> None:
        self._x = float(value)

    @property
    def y(self) -> float:
        return self._y

    @y.setter
    def y(self, value: float) -> None:
        self._y = float(value)


p = Point(1.0, 2.0)
print(p.x, p.y)  # 1.0 2.0
```

Здесь `_x` и `_y` указаны в `__slots__` — они хранятся без словаря `__dict__`, что экономит память.

## Итог

Декоратор `@property` — ключевой инструмент для написания идиоматичного Python-кода. Он позволяет:

- скрыть детали реализации за чистым интерфейсом
- добавить валидацию без изменения публичного API
- создавать вычисляемые свойства, обновляющиеся автоматически
- контролировать доступ к атрибутам класса

Правило хорошего тона: если атрибут публичный и не требует никакой логики — оставьте его обычным атрибутом. Добавляйте `@property` только тогда, когда нужна реальная причина: валидация, вычисление или побочный эффект.

Для глубокого погружения в Python и объектно-ориентированное программирование смотрите курс на PurpleSchool: [Python-разработчик](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-property-decorator).
