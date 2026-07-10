---
metaTitle: "@classmethod и @staticmethod в Python — различия и применение"
metaDescription: "Подробное руководство по декораторам @classmethod и @staticmethod в Python с примерами, отличиями от обычных методов и советами по применению."
author: "Антон Ларичев"
title: "@classmethod и @staticmethod в Python"
preview: "Разбираем декораторы @classmethod и @staticmethod: чем они отличаются, когда применять каждый из них и как это работает на практике."
---

## Введение

В Python методы класса делятся на три типа: обычные методы экземпляра, методы класса (`@classmethod`) и статические методы (`@staticmethod`). Декораторы `@classmethod` и `@staticmethod` изменяют поведение методов, убирая привязку к конкретному экземпляру и предоставляя разные уровни доступа к данным класса.

Понимание разницы между ними позволяет писать более чистый и структурированный код, правильно группировать логику и избегать передачи лишних зависимостей.

## Обычные методы экземпляра

Прежде чем разбирать `@classmethod` и `@staticmethod`, стоит вспомнить, как работают обычные методы.

```python
class User:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

    def greet(self) -> str:
        return f"Привет, меня зовут {self.name}, мне {self.age} лет"


user = User("Антон", 30)
print(user.greet())  # Привет, меня зовут Антон, мне 30 лет
```

Обычный метод всегда получает первым аргументом `self` — ссылку на конкретный экземпляр класса. Через `self` метод может читать и изменять данные этого экземпляра.

## @staticmethod — статический метод

Статический метод — это обычная функция, которая логически относится к классу, но не имеет доступа ни к экземпляру (`self`), ни к самому классу (`cls`). Он не получает никаких неявных аргументов.

### Когда использовать @staticmethod

Статические методы подходят для вспомогательных операций, которые связаны с классом тематически, но не зависят от его состояния. Это utility-функции, сгруппированные внутри класса для удобства.

```python
class MathUtils:
    @staticmethod
    def add(a: float, b: float) -> float:
        return a + b

    @staticmethod
    def is_even(n: int) -> bool:
        return n % 2 == 0


print(MathUtils.add(3, 5))    # 8
print(MathUtils.is_even(4))   # True
print(MathUtils.is_even(7))   # False
```

Статический метод можно вызвать как через класс (`MathUtils.add()`), так и через экземпляр (`obj.add()`), но оба варианта работают одинаково — без привязки к чему-либо.

### Пример: валидация данных

```python
class Email:
    def __init__(self, address: str):
        if not Email.is_valid(address):
            raise ValueError(f"Некорректный email: {address}")
        self.address = address

    @staticmethod
    def is_valid(address: str) -> bool:
        return "@" in address and "." in address.split("@")[-1]


email = Email("user@example.com")
print(email.address)  # user@example.com

# Проверка без создания экземпляра
print(Email.is_valid("not-an-email"))  # False
```

Логика валидации не зависит от данных экземпляра и не нуждается в доступе к классу — поэтому `@staticmethod` здесь идеальный выбор.

### Пример: форматирование

```python
class DateFormatter:
    @staticmethod
    def format_date(day: int, month: int, year: int) -> str:
        return f"{day:02d}.{month:02d}.{year}"

    @staticmethod
    def format_iso(day: int, month: int, year: int) -> str:
        return f"{year}-{month:02d}-{day:02d}"


print(DateFormatter.format_date(5, 3, 2024))  # 05.03.2024
print(DateFormatter.format_iso(5, 3, 2024))   # 2024-03-05
```

## @classmethod — метод класса

Метод класса получает первым аргументом не экземпляр (`self`), а сам класс (`cls`). Через `cls` можно обращаться к атрибутам класса, другим методам класса и — что особенно важно — создавать экземпляры этого класса.

### Синтаксис и базовый пример

```python
class Counter:
    count = 0

    def __init__(self):
        Counter.count += 1

    @classmethod
    def get_count(cls) -> int:
        return cls.count

    @classmethod
    def reset(cls) -> None:
        cls.count = 0


c1 = Counter()
c2 = Counter()
c3 = Counter()

print(Counter.get_count())  # 3
Counter.reset()
print(Counter.get_count())  # 0
```

`cls` здесь — это сам класс `Counter`, а не его экземпляр. Это позволяет работать с общим состоянием класса.

### Альтернативные конструкторы (фабричные методы)

Главное применение `@classmethod` — создание альтернативных конструкторов. Это паттерн, когда объект можно создать из разных источников данных.

```python
from datetime import date


class Person:
    def __init__(self, name: str, birth_year: int):
        self.name = name
        self.birth_year = birth_year

    @classmethod
    def from_birth_date(cls, name: str, birth_date: str) -> "Person":
        year = int(birth_date.split("-")[0])
        return cls(name, year)

    @classmethod
    def from_dict(cls, data: dict) -> "Person":
        return cls(data["name"], data["birth_year"])

    def get_age(self) -> int:
        return date.today().year - self.birth_year

    def __repr__(self) -> str:
        return f"Person(name={self.name!r}, birth_year={self.birth_year})"


# Три способа создать объект
p1 = Person("Антон", 1994)
p2 = Person.from_birth_date("Мария", "1990-05-15")
p3 = Person.from_dict({"name": "Иван", "birth_year": 1985})

print(p1)  # Person(name='Антон', birth_year=1994)
print(p2)  # Person(name='Мария', birth_year=1990)
print(p3)  # Person(name='Иван', birth_year=1985)
```

Ключевое преимущество использования `cls(...)` вместо прямого вызова `Person(...)` — корректная работа при наследовании.

### @classmethod и наследование

Это одно из главных отличий `@classmethod` от `@staticmethod`. При наследовании `cls` указывает на дочерний класс, а не на тот, где определён метод.

```python
class Animal:
    name = "Animal"

    def __init__(self, sound: str):
        self.sound = sound

    @classmethod
    def create_default(cls) -> "Animal":
        return cls("...")

    def speak(self) -> str:
        return f"{self.__class__.name} говорит: {self.sound}"


class Dog(Animal):
    name = "Собака"

    @classmethod
    def create_default(cls) -> "Dog":
        return cls("Гав")


class Cat(Animal):
    name = "Кошка"

    @classmethod
    def create_default(cls) -> "Cat":
        return cls("Мяу")


dog = Dog.create_default()
cat = Cat.create_default()

print(dog.speak())  # Собака говорит: Гав
print(cat.speak())  # Кошка говорит: Мяу
```

Если бы в фабричном методе использовался `Animal(...)` напрямую, дочерние классы не смогли бы корректно переопределить поведение. `cls` решает эту проблему.

## Сравнение: self, cls и отсутствие аргумента

Основные различия между тремя типами методов:

| Тип метода | Первый аргумент | Доступ к экземпляру | Доступ к классу |
|---|---|---|---|
| Обычный метод | `self` | Да | Через `self.__class__` |
| `@classmethod` | `cls` | Нет | Да (напрямую) |
| `@staticmethod` | — | Нет | Нет |

### Пример с тремя типами в одном классе

```python
class Temperature:
    unit = "Celsius"

    def __init__(self, value: float):
        self.value = value

    def to_fahrenheit(self) -> float:
        return self.value * 9 / 5 + 32

    @classmethod
    def set_unit(cls, unit: str) -> None:
        cls.unit = unit

    @staticmethod
    def celsius_to_kelvin(celsius: float) -> float:
        return celsius + 273.15


temp = Temperature(100)
print(temp.to_fahrenheit())                # 212.0
print(Temperature.celsius_to_kelvin(100))  # 373.15

Temperature.set_unit("Fahrenheit")
print(Temperature.unit)                    # Fahrenheit
```

## Практический пример: класс конфигурации

Рассмотрим реальный сценарий — класс для работы с конфигурацией приложения.

```python
import json
import os
from typing import Any


class Config:
    _defaults = {
        "debug": False,
        "host": "localhost",
        "port": 8000,
        "db_url": "sqlite:///app.db",
    }

    def __init__(self, settings: dict):
        self._settings = {**self._defaults, **settings}

    def get(self, key: str, default: Any = None) -> Any:
        return self._settings.get(key, default)

    @classmethod
    def from_json(cls, filepath: str) -> "Config":
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls(data)

    @classmethod
    def from_env(cls) -> "Config":
        settings = {
            "debug": os.getenv("DEBUG", "false").lower() == "true",
            "host": os.getenv("HOST", cls._defaults["host"]),
            "port": int(os.getenv("PORT", cls._defaults["port"])),
            "db_url": os.getenv("DATABASE_URL", cls._defaults["db_url"]),
        }
        return cls(settings)

    @staticmethod
    def is_valid_port(port: int) -> bool:
        return 1 <= port <= 65535

    @staticmethod
    def mask_url(url: str) -> str:
        if "@" in url:
            schema, rest = url.split("://", 1)
            credentials, host = rest.rsplit("@", 1)
            return f"{schema}://***@{host}"
        return url


config = Config.from_env()
print(config.get("host"))         # localhost

print(Config.is_valid_port(8080)) # True
print(Config.is_valid_port(99999)) # False
print(Config.mask_url("postgresql://admin:secret@db.example.com/mydb"))
# postgresql://***@db.example.com/mydb
```

## Практический пример: реестр плагинов

Ещё один популярный паттерн — реестр объектов, реализованный через `@classmethod`.

```python
from typing import Dict, Type


class BasePlugin:
    _registry: Dict[str, Type["BasePlugin"]] = {}

    def __init_subclass__(cls, plugin_name: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        if plugin_name:
            BasePlugin._registry[plugin_name] = cls

    @classmethod
    def get_plugin(cls, name: str) -> Type["BasePlugin"]:
        if name not in cls._registry:
            raise KeyError(
                f"Плагин '{name}' не найден. Доступные: {list(cls._registry)}"
            )
        return cls._registry[name]

    @classmethod
    def list_plugins(cls) -> list:
        return list(cls._registry.keys())

    def run(self) -> str:
        raise NotImplementedError


class JsonPlugin(BasePlugin, plugin_name="json"):
    def run(self) -> str:
        return "Обработка JSON"


class CsvPlugin(BasePlugin, plugin_name="csv"):
    def run(self) -> str:
        return "Обработка CSV"


print(BasePlugin.list_plugins())  # ['json', 'csv']

PluginClass = BasePlugin.get_plugin("json")
plugin = PluginClass()
print(plugin.run())  # Обработка JSON
```

## Частые ошибки

### Ошибка 1: использование @staticmethod там, где нужен @classmethod

```python
class Animal:
    sound = "..."

    # Неправильно: при наследовании всегда вернёт Animal()
    @staticmethod
    def create_bad():
        return Animal()

    # Правильно: при наследовании вернёт экземпляр дочернего класса
    @classmethod
    def create(cls):
        return cls()


class Dog(Animal):
    sound = "Гав"


dog_bad = Dog.create_bad()
dog_good = Dog.create()

print(type(dog_bad))   # <class '__main__.Animal'>  — неожиданное поведение!
print(type(dog_good))  # <class '__main__.Dog'>     — корректно
```

### Ошибка 2: жёсткая привязка к имени класса внутри метода

```python
class Counter:
    count = 0

    # Проблемный вариант: жёсткая привязка к Counter ломает наследование
    @staticmethod
    def increment_bad():
        Counter.count += 1

    # Правильный вариант: cls всегда указывает на актуальный класс
    @classmethod
    def increment(cls):
        cls.count += 1


class SpecialCounter(Counter):
    count = 0


sc = SpecialCounter()
SpecialCounter.increment_bad()  # меняет Counter.count, а не SpecialCounter.count!
SpecialCounter.increment()      # меняет SpecialCounter.count — корректно
```

### Ошибка 3: попытка обратиться к атрибутам экземпляра в @classmethod

```python
class MyClass:
    class_value = 10

    def __init__(self):
        self.instance_value = 42

    @classmethod
    def show(cls):
        print(cls.class_value)    # OK — атрибут класса
        # print(cls.instance_value)  # AttributeError — это атрибут экземпляра
```

`cls` — это сам класс, а не экземпляр, поэтому атрибуты, заданные в `__init__`, через него недоступны.

## Краткий чеклист выбора

При выборе типа метода используйте следующую логику:

- Нужен доступ к данным конкретного объекта — обычный метод с `self`
- Нужен альтернативный конструктор или работа с атрибутами класса, важна совместимость с наследованием — `@classmethod`
- Метод логически относится к классу, но не зависит ни от экземпляра, ни от самого класса — `@staticmethod`

## Заключение

Декораторы `@classmethod` и `@staticmethod` — инструменты для правильной организации методов внутри класса. `@staticmethod` группирует вспомогательные функции, не привязывая их к состоянию. `@classmethod` открывает доступ к самому классу, что незаменимо для фабричных методов и работы с атрибутами класса при наследовании.

Грамотное использование этих декораторов делает код более читаемым, явным и удобным для расширения.

Подробнее о Python и объектно-ориентированном программировании вы можете узнать на курсе [Python для разработчиков](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=classmethod-staticmethod).