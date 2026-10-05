---
metaTitle: "Protocol vs ABC в Python: как типизировать интерфейсы"
metaDescription: "Разбираем отличия Protocol и ABC в Python, когда применять структурную и номинальную типизацию, примеры кода и рекомендации."
author: "Антон Ларичев"
title: "Protocol vs ABC: выбор подхода к типизации интерфейсов"
preview: "Сравниваем два подхода к описанию интерфейсов в Python — ABC с явным наследованием и Protocol со структурной типизацией. Когда что использовать."
---

## Зачем вообще описывать интерфейсы в Python

Python — динамически типизированный язык. Интерпретатор не запрещает передать объект без нужного метода — ошибка всплывёт лишь в рантайме. Чтобы сделать контракты явными и поймать нарушения на этапе статического анализа (`mypy`, `pyright`), в Python используют два механизма: **абстрактные базовые классы** (`ABC`) и **протоколы** (`Protocol`).

Оба инструмента решают одну задачу — сказать «аргумент должен поддерживать такие-то операции» — но делают это принципиально по-разному.

---

## ABC — номинальная типизация

`ABC` (Abstract Base Class) живёт в модуле `abc`. Контракт выражается через **явное наследование**: чтобы тип удовлетворял интерфейсу, он обязан унаследоваться от базового класса и реализовать все абстрактные методы.

```python
from abc import ABC, abstractmethod


class Serializable(ABC):
    @abstractmethod
    def serialize(self) -> str:
        ...

    @abstractmethod
    def deserialize(self, data: str) -> None:
        ...


class User(Serializable):
    def __init__(self, name: str) -> None:
        self.name = name

    def serialize(self) -> str:
        return f'{{"name": "{self.name}"}}'

    def deserialize(self, data: str) -> None:
        import json
        self.name = json.loads(data)["name"]
```

Если не реализовать хотя бы один абстрактный метод, Python выбросит `TypeError` прямо при создании экземпляра:

```python
class Broken(Serializable):
    def serialize(self) -> str:
        return ""
    # deserialize не реализован

obj = Broken()  # TypeError: Can't instantiate abstract class Broken
                # with abstract method deserialize
```

Это **номинальная типизация** (nominal typing): проверка идёт по имени класса в иерархии наследования, а не по структуре.

### Регистрация виртуальных подклассов

ABC позволяет зарегистрировать сторонний класс как «совместимый» без изменения его исходного кода:

```python
from abc import ABC, abstractmethod


class Drawable(ABC):
    @abstractmethod
    def draw(self) -> None:
        ...


# Сторонняя библиотека, которую мы не контролируем
class ThirdPartyWidget:
    def draw(self) -> None:
        print("drawing widget")


Drawable.register(ThirdPartyWidget)

print(isinstance(ThirdPartyWidget(), Drawable))  # True
```

Однако статический анализатор об этом не знает — `mypy` всё равно выведет ошибку, если функция ожидает `Drawable`, а ей передают `ThirdPartyWidget`. Регистрация работает только в рантайме.

---

## Protocol — структурная типизация

`Protocol` появился в Python 3.8 (PEP 544) и описывает интерфейс **структурно**: достаточно, чтобы у объекта были нужные атрибуты и методы с нужными сигнатурами. Явное наследование не требуется.

```python
from typing import Protocol


class Serializable(Protocol):
    def serialize(self) -> str:
        ...

    def deserialize(self, data: str) -> None:
        ...


class User:
    def __init__(self, name: str) -> None:
        self.name = name

    def serialize(self) -> str:
        return f'{{"name": "{self.name}"}}'

    def deserialize(self, data: str) -> None:
        import json
        self.name = json.loads(data)["name"]


def save(obj: Serializable) -> None:
    print(obj.serialize())


save(User("Alice"))  # mypy доволен, хотя User не наследует Serializable
```

Это **структурная типизация** (structural typing, duck typing): если объект «крякает как утка», он и есть утка.

### Runtime-проверка с @runtime_checkable

По умолчанию `isinstance(obj, SomeProtocol)` выбросит `TypeError`. Чтобы включить проверку в рантайме, добавьте декоратор:

```python
from typing import Protocol, runtime_checkable


@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None:
        ...


class Circle:
    def draw(self) -> None:
        print("drawing circle")


print(isinstance(Circle(), Drawable))  # True
```

Важное ограничение: `isinstance` проверяет только **наличие** методов, но не их сигнатуры. Если сигнатура `draw` у объекта другая, `isinstance` всё равно вернёт `True` — ошибку поймает только статический анализатор.

---

## Ключевые отличия

| Характеристика | ABC | Protocol |
|---|---|---||
| Вид типизации | Номинальная | Структурная |
| Требует наследования | Да | Нет |
| Защита в рантайме | `TypeError` при создании | Только через `@runtime_checkable` |
| Совместимость со сторонним кодом | `register()`, но не для mypy | Полная, без изменений |
| Поддержка дефолтных реализаций | Да | Да (но редко нужно) |
| Появился в | Python 3.4 | Python 3.8 |

---

## Когда использовать ABC

### 1. Иерархия с общим поведением

Когда базовый класс содержит реальную логику, которую наследники переиспользуют или переопределяют:

```python
from abc import ABC, abstractmethod


class BaseRepository(ABC):
    def __init__(self, connection_string: str) -> None:
        self._conn = self._connect(connection_string)

    @abstractmethod
    def _connect(self, connection_string: str):
        ...

    @abstractmethod
    def find_by_id(self, id: int):
        ...

    def find_all(self) -> list:
        # общая логика — одинакова для всех репозиториев
        return [self.find_by_id(i) for i in self._get_all_ids()]

    @abstractmethod
    def _get_all_ids(self) -> list[int]:
        ...


class PostgresRepository(BaseRepository):
    def _connect(self, connection_string: str):
        return f"pg_connection({connection_string})"

    def find_by_id(self, id: int):
        return f"pg_row_{id}"

    def _get_all_ids(self) -> list[int]:
        return [1, 2, 3]
```

### 2. Когда нарушение контракта в рантайме недопустимо

ABC бросает `TypeError` ещё до того, как объект попадёт в систему. Это полезно на инициализации приложения, когда лучше упасть сразу, чем в середине бизнес-операции:

```python
class PaymentGateway(ABC):
    @abstractmethod
    def charge(self, amount: float, currency: str) -> str:
        ...

    @abstractmethod
    def refund(self, transaction_id: str) -> bool:
        ...

# Если разработчик забыл реализовать refund,
# приложение упадёт при старте, а не при первом возврате платежа
```

### 3. Явная принадлежность к семейству классов

Когда `isinstance`-проверки в коде несут смысловую нагрузку и команда должна видеть явную иерархию:

```python
if isinstance(handler, BaseEventHandler):
    metrics.record("event_handler_called")
```

---

## Когда использовать Protocol

### 1. Интеграция со сторонним кодом

Главное преимущество Protocol — описать требования к объекту, не трогая сам объект:

```python
from typing import Protocol


class Closeable(Protocol):
    def close(self) -> None:
        ...


def shutdown_all(resources: list[Closeable]) -> None:
    for resource in resources:
        resource.close()


# Стандартные объекты Python уже «реализуют» протокол
import socket
import io

shutdown_all([socket.socket(), io.StringIO()])
# mypy проверит сигнатуры, не требуя изменений в stdlib
```

### 2. Функциональные утилиты и обобщённые алгоритмы

Когда пишете универсальную функцию, которая работает с любым объектом, поддерживающим нужную операцию:

```python
from typing import Protocol, TypeVar


class Comparable(Protocol):
    def __lt__(self, other: "Comparable") -> bool:
        ...


T = TypeVar("T", bound=Comparable)


def find_min(items: list[T]) -> T:
    result = items[0]
    for item in items[1:]:
        if item < result:
            result = item
    return result


print(find_min([3, 1, 4, 1, 5]))   # 1
print(find_min(["banana", "apple", "cherry"]))  # apple
```

### 3. Тестирование и моки

Protocol делает зависимости легко подставляемыми без наследования от конкретных классов:

```python
from typing import Protocol


class EmailSender(Protocol):
    def send(self, to: str, subject: str, body: str) -> None:
        ...


class OrderService:
    def __init__(self, mailer: EmailSender) -> None:
        self._mailer = mailer

    def confirm_order(self, order_id: int, customer_email: str) -> None:
        self._mailer.send(
            to=customer_email,
            subject=f"Order #{order_id} confirmed",
            body="Your order is on its way!",
        )


# В тестах
class FakeMailer:
    def __init__(self) -> None:
        self.sent: list[dict] = []

    def send(self, to: str, subject: str, body: str) -> None:
        self.sent.append({"to": to, "subject": subject, "body": body})


fake = FakeMailer()
service = OrderService(mailer=fake)  # mypy счастлив, наследования нет
service.confirm_order(42, "user@example.com")
assert fake.sent[0]["to"] == "user@example.com"
```

---

## Комбинирование подходов

ABC и Protocol не исключают друг друга. Типичный паттерн — Protocol описывает публичный API библиотеки (для внешних пользователей), а ABC задаёт внутреннюю иерархию реализаций:

```python
from abc import ABC, abstractmethod
from typing import Protocol


# Публичный контракт — пользователи библиотеки работают с этим
class CacheBackend(Protocol):
    def get(self, key: str) -> bytes | None:
        ...

    def set(self, key: str, value: bytes, ttl: int = 0) -> None:
        ...

    def delete(self, key: str) -> None:
        ...


# Внутренняя иерархия — разработчики бэкендов наследуют это
class BaseCacheBackend(ABC):
    def _serialize(self, value: object) -> bytes:
        import pickle
        return pickle.dumps(value)

    @abstractmethod
    def get(self, key: str) -> bytes | None:
        ...

    @abstractmethod
    def set(self, key: str, value: bytes, ttl: int = 0) -> None:
        ...

    @abstractmethod
    def delete(self, key: str) -> None:
        ...


class RedisCacheBackend(BaseCacheBackend):
    def get(self, key: str) -> bytes | None:
        return None  # реальная реализация через redis-py

    def set(self, key: str, value: bytes, ttl: int = 0) -> None:
        pass

    def delete(self, key: str) -> None:
        pass


# Функция принимает Protocol — совместима и с RedisCacheBackend,
# и с любым сторонним классом, имеющим нужные методы
def warm_up(cache: CacheBackend, keys: list[str]) -> None:
    for key in keys:
        if cache.get(key) is None:
            cache.set(key, b"default")
```

---

## Итоговые рекомендации

**Выбирайте ABC, если:**
- базовый класс содержит общую логику, которую наследники переиспользуют;
- важна защита в рантайме — `TypeError` при создании неполного объекта;
- команда явно работает с иерархией классов и `isinstance` несёт смысловую нагрузку;
- вы строите фреймворк, где пользователи должны явно «подписаться» на контракт.

**Выбирайте Protocol, если:**
- нужно описать требования к стороннему коду, который вы не контролируете;
- пишете обобщённые алгоритмы или утилиты;
- хотите упростить тестирование через подстановку без наследования;
- предпочитаете слабую связанность — код не знает о существовании протокола.

**Общее правило**: Protocol — умолчание для новых API. ABC — когда нужна реальная иерархия с общим поведением или защита в рантайме.

---

Чтобы углубиться в типизацию Python и научиться писать профессиональный, надёжный код, пройдите курс [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=protocol-vs-abc).