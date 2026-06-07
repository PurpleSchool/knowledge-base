---
metaTitle: "Python Protocol: структурная типизация | PurpleSchool"
metaDescription: "Protocol в Python — как использовать структурную типизацию, отличие от ABC, runtime_checkable и практические примеры."
author: "Антон Ларичев"
title: "Protocol в Python: структурная типизация и утиная типизация"
preview: "Protocol позволяет описывать интерфейсы через структурную типизацию без явного наследования — чистый и гибкий способ типизировать утиную типизацию в Python."
---

## Что такое Protocol и зачем он нужен

Python изначально строился на принципе утиной типизации: если объект ведёт себя как утка — крякает и ходит вразвалку — значит, это утка. Тип объекта не важен, важно наличие нужных методов и атрибутов.

Долгое время это делало статическую проверку типов крайне затруднительной. `isinstance()` требует явного наследования, а `mypy` не понимал, что объект «подходит» под интерфейс просто потому, что у него есть нужные методы.

`Protocol` — это решение, появившееся в Python 3.8 (PEP 544). Он позволяет описать интерфейс структурно: объект считается совместимым с протоколом, если у него есть все необходимые методы и атрибуты — без явного наследования от протокола.

```python
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None:
        ...

class Circle:
    def draw(self) -> None:
        print("Drawing circle")

class Square:
    def draw(self) -> None:
        print("Drawing square")

def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())  # OK
render(Square())  # OK
```

Ни `Circle`, ни `Square` не наследуются от `Drawable` — но оба совместимы с ним структурно. `mypy` это понимает и не выдаёт ошибок.

## Protocol vs ABC: в чём разница

До появления `Protocol` для описания интерфейсов использовались абстрактные базовые классы из модуля `abc`.

```python
from abc import ABC, abstractmethod

class DrawableABC(ABC):
    @abstractmethod
    def draw(self) -> None:
        ...

class Triangle(DrawableABC):
    def draw(self) -> None:
        print("Drawing triangle")

# Этот класс НЕ совместим с DrawableABC без явного наследования
class Pentagon:
    def draw(self) -> None:
        print("Drawing pentagon")
```

Если передать `Pentagon` туда, где ожидается `DrawableABC`, `mypy` выдаст ошибку — несмотря на наличие метода `draw`. С `Protocol` такой проблемы нет.

Сравнение двух подходов:

| Критерий | ABC | Protocol |
|---|---|---|
| Требует наследования | Да | Нет |
| Структурная совместимость | Нет | Да |
| Проверка через isinstance | Да | Только с `@runtime_checkable` |
| Подходит для сторонних классов | Нет | Да |

ABC хорошо подходит, когда вы контролируете все реализации и хотите принудить к явному наследованию. Protocol лучше подходит для описания интерфейсов, которым должны соответствовать классы из внешних библиотек или классы, которые уже существуют.

## Базовый синтаксис Protocol

Протокол определяется как класс, наследующий от `Protocol`. Тело протокола содержит сигнатуры методов и объявления атрибутов.

```python
from typing import Protocol

class Serializable(Protocol):
    def to_json(self) -> str:
        ...
    
    def to_dict(self) -> dict:
        ...

class User:
    def __init__(self, name: str, age: int) -> None:
        self.name = name
        self.age = age
    
    def to_json(self) -> str:
        import json
        return json.dumps(self.to_dict())
    
    def to_dict(self) -> dict:
        return {"name": self.name, "age": self.age}

def save(obj: Serializable) -> None:
    data = obj.to_json()
    print(f"Saving: {data}")

save(User("Alice", 30))  # OK — mypy не выдаст ошибку
```

Обратите внимание на `...` в теле методов протокола. Это не абстрактные методы — в протоколе можно даже предоставить реализацию по умолчанию, хотя чаще тело методов остаётся пустым.

## Атрибуты в Protocol

Протокол может описывать не только методы, но и атрибуты:

```python
from typing import Protocol

class HasName(Protocol):
    name: str

class HasNameAndAge(Protocol):
    name: str
    age: int

class Employee:
    def __init__(self, name: str, age: int, department: str) -> None:
        self.name = name
        self.age = age
        self.department = department

def greet(entity: HasName) -> str:
    return f"Hello, {entity.name}!"

greet(Employee("Bob", 25, "Engineering"))  # OK
```

Для атрибутов только для чтения используется `ClassVar` или дескрипторы. Если атрибут должен быть только читаемым (не записываемым), используйте `@property` в протоколе:

```python
from typing import Protocol

class ReadOnlyName(Protocol):
    @property
    def name(self) -> str:
        ...

class ImmutableUser:
    def __init__(self, name: str) -> None:
        self._name = name
    
    @property
    def name(self) -> str:
        return self._name
```

## runtime_checkable: проверка во время выполнения

По умолчанию `Protocol` работает только на уровне статической проверки типов. Вызов `isinstance(obj, MyProtocol)` вызовет `TypeError`. Чтобы разрешить проверку в рантайме, используйте декоратор `@runtime_checkable`:

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None:
        ...

class Circle:
    def draw(self) -> None:
        print("Circle")

class Point:
    pass

print(isinstance(Circle(), Drawable))  # True
print(isinstance(Point(), Drawable))   # False
print(isinstance("hello", Drawable))   # False
```

Важно понимать ограничение: `isinstance` с `runtime_checkable` проверяет только наличие методов и атрибутов, но не их сигнатуры. Если у класса есть метод `draw`, но с другой сигнатурой — проверка всё равно пройдёт успешно.

```python
class FakeDrawable:
    def draw(self, x: int, y: int) -> str:  # Другая сигнатура
        return "wrong"

print(isinstance(FakeDrawable(), Drawable))  # True — только проверяет наличие метода
```

Поэтому `@runtime_checkable` подходит для базовых проверок, но полную гарантию совместимости даёт только статический анализатор.

## Наследование протоколов

Протоколы можно комбинировать через наследование, создавая составные интерфейсы:

```python
from typing import Protocol

class Readable(Protocol):
    def read(self) -> str:
        ...

class Writable(Protocol):
    def write(self, data: str) -> None:
        ...

class ReadWritable(Readable, Writable, Protocol):
    pass

class FileBuffer:
    def __init__(self) -> None:
        self._data = ""
    
    def read(self) -> str:
        return self._data
    
    def write(self, data: str) -> None:
        self._data += data

def process(stream: ReadWritable) -> None:
    stream.write("hello")
    print(stream.read())

process(FileBuffer())  # OK
```

Обратите внимание: при создании составного протокола через наследование нужно явно указать `Protocol` в списке базовых классов, иначе `mypy` не распознает его как протокол.

## Generic Protocol: параметрический протокол

Протоколы поддерживают обобщённые типы через `Generic`:

```python
from typing import Protocol, TypeVar

T = TypeVar("T")

class Repository(Protocol[T]):
    def get(self, id: int) -> T:
        ...
    
    def save(self, entity: T) -> None:
        ...
    
    def delete(self, id: int) -> None:
        ...

class User:
    def __init__(self, id: int, name: str) -> None:
        self.id = id
        self.name = name

class UserRepository:
    def __init__(self) -> None:
        self._storage: dict[int, User] = {}
    
    def get(self, id: int) -> User:
        return self._storage[id]
    
    def save(self, entity: User) -> None:
        self._storage[entity.id] = entity
    
    def delete(self, id: int) -> None:
        del self._storage[id]

def find_and_print(repo: Repository[User], user_id: int) -> None:
    user = repo.get(user_id)
    print(user.name)

repo = UserRepository()
repo.save(User(1, "Alice"))
find_and_print(repo, 1)  # Выведет: Alice
```

## Практический пример: плагинная система

Protocol отлично подходит для реализации плагинных архитектур, где основной код не должен зависеть от конкретных реализаций:

```python
from typing import Protocol

class NotificationSender(Protocol):
    def send(self, recipient: str, message: str) -> bool:
        ...
    
    def supports_bulk(self) -> bool:
        ...

class EmailSender:
    def send(self, recipient: str, message: str) -> bool:
        print(f"Email to {recipient}: {message}")
        return True
    
    def supports_bulk(self) -> bool:
        return True

class SmsSender:
    def send(self, recipient: str, message: str) -> bool:
        if len(message) > 160:
            return False
        print(f"SMS to {recipient}: {message}")
        return True
    
    def supports_bulk(self) -> bool:
        return False

class TelegramSender:
    def send(self, recipient: str, message: str) -> bool:
        print(f"Telegram to @{recipient}: {message}")
        return True
    
    def supports_bulk(self) -> bool:
        return True

class NotificationService:
    def __init__(self, sender: NotificationSender) -> None:
        self._sender = sender
    
    def notify(self, recipient: str, message: str) -> None:
        success = self._sender.send(recipient, message)
        if not success:
            print(f"Failed to send notification to {recipient}")

# Все три класса совместимы с NotificationSender без наследования
service = NotificationService(EmailSender())
service.notify("user@example.com", "Welcome!")

service = NotificationService(SmsSender())
service.notify("+79001234567", "Code: 1234")
```

Это позволяет легко добавлять новые реализации без изменения `NotificationService`.

## Практический пример: стратегия сортировки

```python
from typing import Protocol, TypeVar

T = TypeVar("T")

class Comparable(Protocol):
    def __lt__(self, other: object) -> bool:
        ...
    
    def __le__(self, other: object) -> bool:
        ...

class SortStrategy(Protocol[T]):
    def sort(self, data: list[T]) -> list[T]:
        ...

class BubbleSort:
    def sort(self, data: list[int]) -> list[int]:
        result = data.copy()
        n = len(result)
        for i in range(n):
            for j in range(n - i - 1):
                if result[j] > result[j + 1]:
                    result[j], result[j + 1] = result[j + 1], result[j]
        return result

class QuickSort:
    def sort(self, data: list[int]) -> list[int]:
        if len(data) <= 1:
            return data
        pivot = data[len(data) // 2]
        left = [x for x in data if x < pivot]
        middle = [x for x in data if x == pivot]
        right = [x for x in data if x > pivot]
        return self.sort(left) + middle + self.sort(right)

class Sorter:
    def __init__(self, strategy: SortStrategy[int]) -> None:
        self._strategy = strategy
    
    def sort(self, data: list[int]) -> list[int]:
        return self._strategy.sort(data)

data = [5, 2, 8, 1, 9, 3]

sorter = Sorter(BubbleSort())
print(sorter.sort(data))  # [1, 2, 3, 5, 8, 9]

sorter = Sorter(QuickSort())
print(sorter.sort(data))  # [1, 2, 3, 5, 8, 9]
```

## Совместимость с Protocol из typing_extensions

Если вы поддерживаете Python ниже 3.8, используйте `typing_extensions`:

```python
try:
    from typing import Protocol, runtime_checkable
except ImportError:
    from typing_extensions import Protocol, runtime_checkable  # type: ignore
```

Начиная с Python 3.12, `Protocol` также поддерживает синтаксис `type` для определения обобщённых типов:

```python
# Python 3.12+
from typing import Protocol

class Container[T](Protocol):
    def get(self) -> T:
        ...
    
    def set(self, value: T) -> None:
        ...
```

## Типичные ошибки при работе с Protocol

**Ошибка 1: Забыть указать `Protocol` при составном протоколе**

```python
# Неправильно — mypy не распознает как Protocol
class ReadWritable(Readable, Writable):
    pass

# Правильно
class ReadWritable(Readable, Writable, Protocol):
    pass
```

**Ошибка 2: Рассчитывать на полную проверку сигнатур в рантайме**

```python
@runtime_checkable
class Processable(Protocol):
    def process(self, data: str) -> int:
        ...

class Wrong:
    def process(self) -> None:  # Неверная сигнатура
        pass

# isinstance вернёт True — проверяется только наличие метода!
print(isinstance(Wrong(), Processable))  # True
```

**Ошибка 3: Использовать Protocol как базовый класс для реализации**

```python
class MyProtocol(Protocol):
    def do_something(self) -> None:
        ...

# Это технически работает, но нарушает смысл Protocol
# Лучше использовать ABC, если нужно наследование
class MyClass(MyProtocol):  # Не рекомендуется
    def do_something(self) -> None:
        print("Done")
```

## Когда использовать Protocol, а когда ABC

Используйте `Protocol`, когда:
- Нужно типизировать существующие классы из внешних библиотек
- Реализации не должны знать об интерфейсе (слабая связность)
- Хотите описать «утиный» интерфейс для статического анализа
- Работаете с несколькими несвязанными классами, которые случайно реализуют одни и те же методы

Используйте `ABC`, когда:
- Нужно принудить к явному наследованию
- Хотите предоставить общую базовую реализацию
- Реализация должна явно объявлять себя частью иерархии типов
- Нужна надёжная проверка через `isinstance` в рантайме

---

Для углублённого изучения Python, включая систему типов, ООП и современные практики разработки, смотрите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-protocol
