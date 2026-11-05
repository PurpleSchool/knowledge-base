---
metaTitle: "Python __init_subclass__: хук контроля наследования"
metaDescription: "Как использовать __init_subclass__ в Python для регистрации подклассов, валидации структуры и управления наследованием без метаклассов."
author: "Антон Ларичев"
title: "Python __init_subclass__ — хук контроля наследования"
preview: "Разбираем __init_subclass__ — хук Python 3.6+, который перехватывает создание подклассов и позволяет контролировать наследование без метаклассов."
---

## Что такое __init_subclass__

`__init_subclass__` — специальный метод, который Python вызывает автоматически каждый раз, когда создаётся подкласс класса, определившего этот метод. Он появился в Python 3.6 (PEP 487) и предоставляет удобный способ контролировать процесс наследования без использования метаклассов.

До появления `__init_subclass__` для перехвата создания подклассов нужно было определять метаклассы — мощный, но громоздкий механизм. Хук упрощает большинство типичных задач.

```python
class Base:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        print(f"Создан подкласс: {cls.__name__}")

class Child(Base):
    pass
# Вывод: Создан подкласс: Child

class GrandChild(Child):
    pass
# Вывод: Создан подкласс: GrandChild
```

Метод вызывается не при создании экземпляра, а при определении самого класса. Это принципиальное отличие от `__init__`.

## Сигнатура метода

```python
class Base:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
```

- `cls` — создаваемый подкласс (не `self` и не базовый класс)
- `**kwargs` — именованные аргументы, переданные через синтаксис `class Child(Base, param=value)`
- Вызов `super().__init_subclass__(**kwargs)` обязателен для корректной работы в цепочках наследования

Важный момент: метод является classmethod по умолчанию, явно декорировать `@classmethod` не нужно.

## Передача параметров при наследовании

Одна из мощных возможностей — передача аргументов непосредственно в объявлении класса:

```python
class Animal:
    def __init_subclass__(cls, sound: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        cls.sound = sound

class Dog(Animal, sound="Woof"):
    pass

class Cat(Animal, sound="Meow"):
    pass

class Fish(Animal):
    pass

print(Dog.sound)   # Woof
print(Cat.sound)   # Meow
print(Fish.sound)  # ""
```

Аргументы `sound="Woof"` не попадают в `__init__` — они перехватываются именно в `__init_subclass__`. Это позволяет настраивать поведение класса декларативно, прямо в строке определения.

## Практические применения

### Регистрация подклассов

Классический случай — автоматический реестр всех подклассов. Это полезно в плагинных системах, обработчиках команд, сериализаторах.

```python
class Handler:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, command: str, **kwargs):
        super().__init_subclass__(**kwargs)
        Handler._registry[command] = cls

    @classmethod
    def get(cls, command: str) -> type:
        return cls._registry[command]

class CreateHandler(Handler, command="create"):
    def handle(self):
        return "Создание ресурса"

class DeleteHandler(Handler, command="delete"):
    def handle(self):
        return "Удаление ресурса"

class UpdateHandler(Handler, command="update"):
    def handle(self):
        return "Обновление ресурса"

# Использование
handler_cls = Handler.get("create")
handler = handler_cls()
print(handler.handle())  # Создание ресурса

print(Handler._registry)
# {'create': <class 'CreateHandler'>, 'delete': <class 'DeleteHandler'>, ...}
```

### Валидация структуры подклассов

Можно проверять, что подкласс реализует обязательные атрибуты или методы:

```python
class Plugin:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)

        required_attrs = ["name", "version", "execute"]
        for attr in required_attrs:
            if not hasattr(cls, attr):
                raise TypeError(
                    f"Класс {cls.__name__} должен определить атрибут '{attr}'"
                )

class ValidPlugin(Plugin):
    name = "my-plugin"
    version = "1.0.0"

    def execute(self):
        return "Выполнение плагина"

# Это вызовет TypeError при определении класса:
# class BrokenPlugin(Plugin):
#     name = "broken"
#     # Нет version и execute
```

Ошибка возникает на этапе определения класса, а не при попытке использования — это позволяет поймать проблему раньше.

### Автоматическое добавление методов и атрибутов

```python
import functools

class Logged:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)

        for attr_name, attr_value in cls.__dict__.items():
            if callable(attr_value) and not attr_name.startswith("_"):
                setattr(cls, attr_name, Logged._wrap_with_log(attr_value))

    @staticmethod
    def _wrap_with_log(method):
        @functools.wraps(method)
        def wrapper(*args, **kwargs):
            print(f"Вызов метода: {method.__name__}")
            result = method(*args, **kwargs)
            print(f"Метод {method.__name__} завершён")
            return result
        return wrapper

class Service(Logged):
    def process(self, data):
        return f"Обработано: {data}"

    def validate(self, data):
        return len(data) > 0

svc = Service()
svc.process("test")
# Вызов метода: process
# Метод process завершён
```

## Порядок вызова в цепочках наследования

При множественном наследовании важно понимать порядок вызовов:

```python
class A:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        print(f"A.__init_subclass__ для {cls.__name__}")

class B(A):
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        print(f"B.__init_subclass__ для {cls.__name__}")

class C(A):
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        print(f"C.__init_subclass__ для {cls.__name__}")

class D(B, C):
    pass
# Вывод:
# A.__init_subclass__ для B
# A.__init_subclass__ для C
# B.__init_subclass__ для D
# C.__init_subclass__ для D
# A.__init_subclass__ для D
```

Python использует MRO (Method Resolution Order) — порядок разрешения методов. Вызов `super().__init_subclass__(**kwargs)` гарантирует, что все хуки в цепочке отработают корректно. Если пропустить `super()`, хуки родительских классов не выполнятся.

## __init_subclass__ против метаклассов

До Python 3.6 такое же поведение достигалось через метаклассы. Вот сравнение:

```python
# Через метакласс (сложнее)
class RegistryMeta(type):
    registry = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:  # Не регистрируем сам базовый класс
            mcs.registry[name] = cls
        return cls

class BaseWithMeta(metaclass=RegistryMeta):
    pass

class ChildA(BaseWithMeta):
    pass

# Через __init_subclass__ (проще)
class Base:
    _registry = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Base._registry[cls.__name__] = cls

class ChildB(Base):
    pass
```

Оба подхода решают одну задачу, но `__init_subclass__` проще в написании и понимании. Метаклассы остаются необходимыми только для более глубокого контроля над созданием класса: изменения `__new__`, переопределения операторов на уровне класса и т.д.

## Комбинирование с __set_name__

PEP 487 также добавил `__set_name__` — хук для дескрипторов. Вместе они позволяют строить выразительные декларативные API:

```python
class Field:
    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f"_{name}"

    def __get__(self, obj, type=None):
        if obj is None:
            return self
        return getattr(obj, self.private_name, None)

    def __set__(self, obj, value):
        setattr(obj, self.private_name, value)

class ModelBase:
    _fields: list[str] = []

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls._fields = [
            name for name, value in cls.__dict__.items()
            if isinstance(value, Field)
        ]

    def to_dict(self):
        return {field: getattr(self, field) for field in self._fields}

class User(ModelBase):
    name = Field()
    email = Field()
    age = Field()

user = User()
user.name = "Иван"
user.email = "ivan@example.com"
user.age = 30

print(user.to_dict())
# {'name': 'Иван', 'email': 'ivan@example.com', 'age': 30}
print(User._fields)
# ['name', 'email', 'age']
```

## Реальный пример: система сериализации

Объединим всё вместе в практическом примере — мини-фреймворк сериализации:

```python
from abc import ABC, abstractmethod
import json

class Serializer(ABC):
    _formats: dict[str, type] = {}

    def __init_subclass__(cls, format: str = "", **kwargs):
        super().__init_subclass__(**kwargs)

        if format:
            Serializer._formats[format] = cls

    @abstractmethod
    def serialize(self, data: dict) -> str:
        pass

    @abstractmethod
    def deserialize(self, raw: str) -> dict:
        pass

    @classmethod
    def for_format(cls, format: str) -> "Serializer":
        if format not in cls._formats:
            raise ValueError(f"Неизвестный формат: {format}")
        return cls._formats[format]()

class JsonSerializer(Serializer, format="json"):
    def serialize(self, data: dict) -> str:
        return json.dumps(data, ensure_ascii=False, indent=2)

    def deserialize(self, raw: str) -> dict:
        return json.loads(raw)

class CsvSerializer(Serializer, format="csv"):
    def serialize(self, data: dict) -> str:
        keys = ",".join(data.keys())
        values = ",".join(str(v) for v in data.values())
        return f"{keys}\n{values}"

    def deserialize(self, raw: str) -> dict:
        lines = raw.strip().split("\n")
        keys = lines[0].split(",")
        values = lines[1].split(",")
        return dict(zip(keys, values))

# Использование
data = {"name": "Иван", "age": 30, "city": "Москва"}

json_s = Serializer.for_format("json")
print(json_s.serialize(data))
# {
#   "name": "Иван",
#   "age": 30,
#   "city": "Москва"
# }

csv_s = Serializer.for_format("csv")
print(csv_s.serialize(data))
# name,age,city
# Иван,30,Москва
```

## Частые ошибки

### Забыть вызвать super()

```python
# Неправильно
class Base:
    def __init_subclass__(cls, **kwargs):
        # Нет super() — хуки родителей не отработают
        cls.registered = True

# Правильно
class Base:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.registered = True
```

### Не передавать **kwargs в super()

```python
# Неправильно — параметры для других хуков в цепочке потеряются
class Base:
    def __init_subclass__(cls, my_param=None, **kwargs):
        super().__init_subclass__()  # kwargs не передаётся!
        cls.my_param = my_param

# Правильно
class Base:
    def __init_subclass__(cls, my_param=None, **kwargs):
        super().__init_subclass__(**kwargs)  # передаём остаток
        cls.my_param = my_param
```

### Мутировать атрибуты базового класса вместо подкласса

```python
# Ошибка: все подклассы делят один список из базового класса
class Base:
    items = []

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.items.append("init")  # модифицирует Base.items!

# Правильно: создаём новый список для каждого подкласса
class Base:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.items = []  # теперь у каждого подкласса свой список
```

## Итог

`__init_subclass__` — элегантный инструмент для контроля над наследованием. Он решает большинство задач, которые раньше требовали метаклассов, но делает это проще и читаемее. Основные применения:

- автоматическая регистрация подклассов в реестре
- валидация обязательных атрибутов и методов при определении класса
- декларативная настройка поведения через параметры в строке `class`
- добавление общего поведения (логирование, кэширование) ко всем наследникам

Всегда вызывайте `super().__init_subclass__(**kwargs)` — это обеспечивает корректную работу в сложных иерархиях с множественным наследованием.

Чтобы глубже разобраться в объектно-ориентированном программировании на Python и научиться применять продвинутые техники в реальных проектах, пройдите курс на PurpleSchool: [Курс по Python](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-init-subclass-hook)
