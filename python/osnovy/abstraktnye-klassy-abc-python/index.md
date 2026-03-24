---
metaTitle: Абстрактные классы в Python — ABC и abstractmethod
metaDescription: Разбираем абстрактные классы в Python с помощью модуля abc. Примеры использования ABC, abstractmethod, абстрактных свойств и паттернов проектирования.
author: Антон Ларичев
title: Абстрактные классы в Python — ABC и abstractmethod
preview: Изучаем абстрактные классы в Python через модуль abc — как создавать абстрактные методы, свойства и применять паттерны проектирования.
---

## Введение

Абстрактные классы — это классы, которые нельзя создать напрямую. Они задают общий интерфейс для группы дочерних классов, гарантируя, что каждый наследник реализует определённый набор методов. В Python абстрактные классы реализуются через модуль `abc` (Abstract Base Classes).

В этой статье разберём, зачем нужны абстрактные классы, как их создавать с помощью `ABC` и `abstractmethod`, как работать с абстрактными свойствами и где применять этот подход на практике.

## Зачем нужны абстрактные классы

Без абстрактных классов ничего не мешает создать дочерний класс, не реализовав в нём нужные методы. Ошибка обнаружится только в момент вызова метода, а не при создании объекта:

```python
class Shape:
    def area(self):
        raise NotImplementedError("Метод area() должен быть реализован")

class Circle(Shape):
    pass

# Ошибка возникнет только при вызове area()
c = Circle()  # Объект создастся без проблем
c.area()      # NotImplementedError
```

Абстрактные классы решают эту проблему — Python не позволит создать экземпляр класса, пока все абстрактные методы не будут реализованы.

## Создание абстрактного класса с ABC

Чтобы создать абстрактный класс, нужно наследоваться от `ABC` и пометить нужные методы декоратором `@abstractmethod`:

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        """Вычислить площадь фигуры"""
        pass

    @abstractmethod
    def perimeter(self):
        """Вычислить периметр фигуры"""
        pass
```

Теперь попытка создать экземпляр `Shape` или его наследника без реализации всех абстрактных методов вызовет `TypeError`:

```python
# TypeError: Can't instantiate abstract class Shape
# with abstract methods area, perimeter
s = Shape()
```

## Реализация абстрактных методов в наследниках

Каждый дочерний класс обязан реализовать все абстрактные методы:

```python
from abc import ABC, abstractmethod
import math

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

    @abstractmethod
    def perimeter(self):
        pass

    # Обычный метод — не абстрактный, наследуется как есть
    def description(self):
        return f"{self.__class__.__name__}: площадь={self.area():.2f}, периметр={self.perimeter():.2f}"


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2

    def perimeter(self):
        return 2 * math.pi * self.radius


class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)


# Создаём объекты
circle = Circle(5)
rect = Rectangle(3, 7)

print(circle.description())  # Circle: площадь=78.54, периметр=31.42
print(rect.description())    # Rectangle: площадь=21.00, периметр=20.00
```

Обратите внимание: метод `description()` — обычный (не абстрактный). Он использует абстрактные методы `area()` и `perimeter()`, зная, что они точно будут реализованы в наследниках. Это мощный паттерн — шаблонный метод (Template Method).

Если вы хотите детальнее изучить объектно-ориентированное программирование и Python в целом — приходите на наш большой курс [Python-разработчик с нуля](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=abstraktnye-klassy-abc-python).
На курсе 180 уроков и 80 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Абстрактные свойства

Декоратор `@abstractmethod` можно комбинировать с `@property` для создания абстрактных свойств:

```python
from abc import ABC, abstractmethod

class Vehicle(ABC):
    @property
    @abstractmethod
    def max_speed(self):
        """Максимальная скорость транспорта"""
        pass

    @property
    @abstractmethod
    def fuel_type(self):
        """Тип топлива"""
        pass

    def info(self):
        return f"{self.__class__.__name__}: макс. скорость {self.max_speed} км/ч, топливо: {self.fuel_type}"


class Car(Vehicle):
    @property
    def max_speed(self):
        return 220

    @property
    def fuel_type(self):
        return "бензин"


class ElectricBike(Vehicle):
    @property
    def max_speed(self):
        return 45

    @property
    def fuel_type(self):
        return "электричество"


print(Car().info())          # Car: макс. скорость 220 км/ч, топливо: бензин
print(ElectricBike().info())  # ElectricBike: макс. скорость 45 км/ч, топливо: электричество
```

Порядок декораторов важен: `@property` должен стоять **над** `@abstractmethod`.

## Использование ABCMeta напрямую

Вместо наследования от `ABC` можно использовать метакласс `ABCMeta`. Результат идентичный:

```python
from abc import ABCMeta, abstractmethod

class Animal(metaclass=ABCMeta):
    @abstractmethod
    def speak(self):
        pass

class Dog(Animal):
    def speak(self):
        return "Гав!"

class Cat(Animal):
    def speak(self):
        return "Мяу!"

print(Dog().speak())  # Гав!
print(Cat().speak())  # Мяу!
```

Класс `ABC` — это просто удобная обёртка: `class ABC(metaclass=ABCMeta): pass`. Используйте `ABCMeta` напрямую, когда ваш класс уже наследуется от другого класса с собственным метаклассом.

## Абстрактные классы и isinstance

Абстрактные классы отлично работают с проверкой типов через `isinstance()`:

```python
from abc import ABC, abstractmethod

class Exporter(ABC):
    @abstractmethod
    def export(self, data):
        pass

class JSONExporter(Exporter):
    def export(self, data):
        import json
        return json.dumps(data, ensure_ascii=False)

class CSVExporter(Exporter):
    def export(self, data):
        return "\n".join(",".join(str(v) for v in row) for row in data)


def process_export(exporter, data):
    # Проверяем, что передан правильный тип
    if not isinstance(exporter, Exporter):
        raise TypeError("Ожидается экземпляр Exporter")
    return exporter.export(data)


result = process_export(JSONExporter(), {"name": "Python"})
print(result)  # {"name": "Python"}
```

## Практический пример: система уведомлений

Рассмотрим реальный пример — система отправки уведомлений по разным каналам:

```python
from abc import ABC, abstractmethod
from datetime import datetime

class Notifier(ABC):
    @abstractmethod
    def send(self, recipient, message):
        """Отправить уведомление"""
        pass

    @abstractmethod
    def validate_recipient(self, recipient):
        """Проверить корректность получателя"""
        pass

    def notify(self, recipient, message):
        """Шаблонный метод: валидация + отправка + логирование"""
        if not self.validate_recipient(recipient):
            raise ValueError(f"Некорректный получатель: {recipient}")
        self.send(recipient, message)
        print(f"[{datetime.now():%H:%M:%S}] Уведомление отправлено через {self.__class__.__name__}")


class EmailNotifier(Notifier):
    def send(self, recipient, message):
        print(f"Отправка email на {recipient}: {message}")

    def validate_recipient(self, recipient):
        return "@" in recipient and "." in recipient


class TelegramNotifier(Notifier):
    def send(self, recipient, message):
        print(f"Отправка в Telegram чат {recipient}: {message}")

    def validate_recipient(self, recipient):
        return recipient.startswith("@") or recipient.lstrip("-").isdigit()


# Полиморфное использование
notifiers = [EmailNotifier(), TelegramNotifier()]
for n in notifiers:
    n.notify("user@example.com" if isinstance(n, EmailNotifier) else "@user", "Привет!")
```

## Частые ошибки

* **Забыть реализовать абстрактный метод** — Python выбросит `TypeError` при попытке создать экземпляр. Сообщение об ошибке содержит список нереализованных методов — читайте его внимательно.

* **Неправильный порядок декораторов** — при создании абстрактного свойства `@property` должен идти перед `@abstractmethod`. Если поставить наоборот, свойство не будет работать корректно.

* **Вызов абстрактного метода через super()** — абстрактный метод может содержать реализацию по умолчанию, и её можно вызвать через `super().method()`. Это не ошибка, а полезная возможность, но многие разработчики о ней не знают.

* **Создание абстрактного класса без abstractmethod** — класс, наследующий `ABC` без единого абстрактного метода, можно инстанцировать. Он не будет по-настоящему абстрактным.

## Частозадаваемые вопросы

**Можно ли создать экземпляр абстрактного класса?**
Нет. При попытке создать экземпляр класса, у которого есть хотя бы один нереализованный абстрактный метод, Python выбросит `TypeError`.

**Чем ABC отличается от обычного класса с NotImplementedError?**
`ABC` с `@abstractmethod` ловит ошибку на этапе создания объекта, а `NotImplementedError` — только при вызове метода. Первый подход надёжнее, потому что проблема обнаруживается раньше.

**Может ли абстрактный метод содержать реализацию?**
Да. Абстрактный метод может иметь тело. Наследники обязаны его переопределить, но могут вызвать базовую реализацию через `super()`.

**Когда использовать ABCMeta вместо ABC?**
Когда ваш класс уже наследуется от класса с другим метаклассом. В остальных случаях наследование от `ABC` проще и предпочтительнее.

## Заключение

Абстрактные классы — важный инструмент для построения чистой архитектуры в Python. Модуль `abc` с классом `ABC` и декоратором `@abstractmethod` позволяет явно определять контракты между базовыми и дочерними классами, предотвращая ошибки на ранних этапах. Используйте их, когда нужно гарантировать единый интерфейс для группы связанных классов.

Для закрепления навыков ООП в Python рекомендуем курс [Python-разработчик с нуля](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=abstraktnye-klassy-abc-python).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет изучить базовый синтаксис и основы ООП и понять структуру курса до покупки полного доступа.
