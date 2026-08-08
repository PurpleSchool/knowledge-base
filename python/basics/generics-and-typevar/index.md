---
metaTitle: "Python generics и TypeVar: обобщённые типы с примерами"
metaDescription: "Как использовать TypeVar и Generic в Python для создания обобщённых функций и классов. Примеры с bound, constraints, Protocol."
author: "Антон Ларичев"
title: "Python generics и TypeVar — обобщённые типы"
preview: "Разбираем обобщённые типы в Python: TypeVar, Generic-классы, ограничения типов и протоколы с практическими примерами."
---

## Что такое обобщённые типы и зачем они нужны

Представьте функцию, которая возвращает первый элемент списка. Без обобщённых типов её сигнатура выглядит так:

```python
from typing import Any

def first(items: list[Any]) -> Any:
    return items[0]
```

Проблема очевидна: если передать `list[int]`, тип возвращаемого значения всё равно будет `Any`. Статический анализатор теряет информацию о типе, и весь смысл аннотаций пропадает.

Обобщённые типы (generics) решают эту задачу: позволяют писать код, который работает с разными типами данных, сохраняя при этом полную информацию о типах для проверки.

```python
from typing import TypeVar

T = TypeVar('T')

def first(items: list[T]) -> T:
    return items[0]

result = first([1, 2, 3])   # тип: int
name = first(['a', 'b'])    # тип: str
```

Теперь анализатор знает: если передать `list[int]`, функция вернёт `int`.

## TypeVar — переменная типа

`TypeVar` создаёт «переменную», которая при каждом вызове функции подставляется конкретным типом. Главное правило: имя переменной должно совпадать со строкой, переданной в конструктор.

```python
from typing import TypeVar

T = TypeVar('T')        # правильно
K = TypeVar('K')        # правильно
Value = TypeVar('Value') # правильно

# Неправильно — имя не совпадает со строкой:
# X = TypeVar('Y')
```

### Несколько TypeVar в одной функции

Каждый `TypeVar` — независимая переменная типа:

```python
from typing import TypeVar

K = TypeVar('K')
V = TypeVar('V')

def zip_to_dict(keys: list[K], values: list[V]) -> dict[K, V]:
    return dict(zip(keys, values))

result = zip_to_dict(['a', 'b'], [1, 2])
# тип result: dict[str, int]
```

## Ограничения TypeVar

### Параметр constraints — фиксированный набор типов

Иногда нужно разрешить только конкретные типы. Для этого используют constraints:

```python
from typing import TypeVar

AnyStr = TypeVar('AnyStr', str, bytes)

def encode(value: AnyStr) -> AnyStr:
    if isinstance(value, str):
        return value.upper()  # type: ignore[return-value]
    return value.upper()

result_str = encode('hello')   # тип: str
result_bytes = encode(b'hi')   # тип: bytes

# encode(123)  — ошибка типа: int не входит в constraints
```

Важный нюанс: при использовании constraints тип фиксируется как один из указанных, а не как их объединение. То есть внутри функции нельзя использовать `AnyStr` как одновременно `str | bytes`.

### Параметр bound — верхняя граница типа

`bound` означает «этот тип или любой его подтип»:

```python
from typing import TypeVar
from datetime import date, datetime

DateLike = TypeVar('DateLike', bound=date)

def format_date(value: DateLike) -> str:
    return value.strftime('%Y-%m-%d')

format_date(date(2024, 1, 15))      # работает: date
format_date(datetime(2024, 1, 15))  # работает: datetime — подтип date
# format_date('2024-01-15')         # ошибка: str не является подтипом date
```

Разница между `constraints` и `bound`:

```python
from typing import TypeVar

# bound: принимает date и любые его подклассы
DateType = TypeVar('DateType', bound=date)

# constraints: принимает ТОЛЬКО date или ТОЛЬКО datetime, ничего другого
ExactDate = TypeVar('ExactDate', date, datetime)
```

## Generic-классы

Для создания обобщённых классов нужно унаследоваться от `Generic[T]`:

```python
from typing import TypeVar, Generic

T = TypeVar('T')

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def peek(self) -> T:
        return self._items[-1]

    def is_empty(self) -> bool:
        return len(self._items) == 0

# Использование
int_stack: Stack[int] = Stack()
int_stack.push(1)
int_stack.push(2)
value = int_stack.pop()  # тип: int

str_stack: Stack[str] = Stack()
str_stack.push('hello')
text = str_stack.pop()  # тип: str

# int_stack.push('oops')  # ошибка типа
```

### Generic с несколькими параметрами

```python
from typing import TypeVar, Generic

K = TypeVar('K')
V = TypeVar('V')

class Pair(Generic[K, V]):
    def __init__(self, key: K, value: V) -> None:
        self.key = key
        self.value = value

    def swap(self) -> 'Pair[V, K]':
        return Pair(self.value, self.key)

    def __repr__(self) -> str:
        return f'Pair({self.key!r}, {self.value!r})'

pair = Pair('name', 42)
swapped = pair.swap()  # тип: Pair[int, str]
print(swapped)         # Pair(42, 'name')
```

## Обобщённые типы в Python 3.12+

С версии Python 3.12 появился новый синтаксис через квадратные скобки, без импорта `TypeVar` и `Generic`:

```python
# Python 3.12+
def first[T](items: list[T]) -> T:
    return items[0]

class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()
```

Этот синтаксис чище, но если нужна поддержка Python 3.9–3.11, используйте классический подход с `TypeVar`.

## Protocol и обобщённые интерфейсы

`Protocol` позволяет описывать структурные типы (duck typing). В сочетании с Generic это мощный инструмент:

```python
from typing import TypeVar, Protocol, runtime_checkable

T = TypeVar('T')

@runtime_checkable
class Comparable(Protocol):
    def __lt__(self, other: 'Comparable') -> bool: ...
    def __le__(self, other: 'Comparable') -> bool: ...

C = TypeVar('C', bound=Comparable)

def maximum(items: list[C]) -> C:
    if not items:
        raise ValueError('Список не может быть пустым')
    result = items[0]
    for item in items[1:]:
        if result < item:
            result = item
    return result

print(maximum([3, 1, 4, 1, 5, 9]))      # 9, тип: int
print(maximum(['banana', 'apple', 'cherry']))  # cherry, тип: str
```

### Generic Protocol

```python
from typing import TypeVar, Generic, Protocol

T_co = TypeVar('T_co', covariant=True)

class Container(Protocol[T_co]):
    def get(self) -> T_co: ...
    def __len__(self) -> int: ...

class Box(Generic[T_co]):
    def __init__(self, value: T_co) -> None:
        self._value = value

    def get(self) -> T_co:
        return self._value

    def __len__(self) -> int:
        return 1

def process(container: Container[int]) -> int:
    return container.get() * len(container)

box: Box[int] = Box(42)
print(process(box))  # 42
```

## Вариантность: covariant и contravariant

Вариантность описывает, как Generic-тип ведёт себя при подтипизации.

```python
from typing import TypeVar

# Инвариантный (по умолчанию) — точное совпадение типа
T = TypeVar('T')

# Ковариантный — принимает тип и его подтипы
T_co = TypeVar('T_co', covariant=True)

# Контравариантный — принимает тип и его супертипы
T_contra = TypeVar('T_contra', contravariant=True)
```

Практический пример с ковариантностью:

```python
from typing import TypeVar, Generic

T_co = TypeVar('T_co', covariant=True)

class ReadOnlyList(Generic[T_co]):
    def __init__(self, items: list[T_co]) -> None:
        self._items = list(items)

    def get(self, index: int) -> T_co:
        return self._items[index]

    def __len__(self) -> int:
        return len(self._items)

class Animal:
    name: str
    def __init__(self, name: str) -> None:
        self.name = name

class Dog(Animal):
    def bark(self) -> str:
        return 'Woof!'

def show_animals(animals: ReadOnlyList[Animal]) -> None:
    for i in range(len(animals)):
        print(animals.get(i).name)

dogs: ReadOnlyList[Dog] = ReadOnlyList([Dog('Rex'), Dog('Buddy')])
show_animals(dogs)  # работает благодаря ковариантности
```

## ParamSpec — обобщение по сигнатуре функции

`ParamSpec` позволяет сохранять типы параметров при декорировании функций:

```python
from typing import TypeVar, Callable
from typing import ParamSpec
import functools
import time

P = ParamSpec('P')
R = TypeVar('R')

def timer(func: Callable[P, R]) -> Callable[P, R]:
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f'{func.__name__} выполнилась за {elapsed:.4f}с')
        return result
    return wrapper

@timer
def compute(x: int, y: int) -> int:
    return x + y

result = compute(1, 2)  # тип result: int — тип не теряется
```

Без `ParamSpec` декоратор терял бы информацию о типах параметров.

## Практический пример: обобщённый репозиторий

Классический паттерн в проектах — Generic-репозиторий:

```python
from typing import TypeVar, Generic, Optional
from dataclasses import dataclass, field

@dataclass
class User:
    id: int
    name: str
    email: str

@dataclass
class Product:
    id: int
    title: str
    price: float

T = TypeVar('T')

class InMemoryRepository(Generic[T]):
    def __init__(self) -> None:
        self._storage: dict[int, T] = {}
        self._next_id: int = 1

    def save(self, item: T) -> int:
        item_id = self._next_id
        self._storage[item_id] = item
        self._next_id += 1
        return item_id

    def find_by_id(self, item_id: int) -> Optional[T]:
        return self._storage.get(item_id)

    def find_all(self) -> list[T]:
        return list(self._storage.values())

    def delete(self, item_id: int) -> bool:
        if item_id in self._storage:
            del self._storage[item_id]
            return True
        return False

# Использование — анализатор знает точные типы
user_repo: InMemoryRepository[User] = InMemoryRepository()
product_repo: InMemoryRepository[Product] = InMemoryRepository()

user_id = user_repo.save(User(0, 'Антон', 'anton@example.com'))
user = user_repo.find_by_id(user_id)  # тип: Optional[User]

if user:
    print(user.email)  # автодополнение работает корректно

prod_id = product_repo.save(Product(0, 'Курс Python', 4990.0))
product = product_repo.find_by_id(prod_id)  # тип: Optional[Product]

if product:
    print(product.price)  # тип: float
```

## TypeVarTuple — обобщение по кортежу типов

Добавлен в Python 3.11, позволяет параметризовать переменное число типов:

```python
from typing import TypeVarTuple, Unpack

Ts = TypeVarTuple('Ts')

def broadcast(
    func: 'Callable[[Unpack[Ts]], None]',
    *args: Unpack[Ts]
) -> None:
    func(*args)
```

Чаще встречается при работе с библиотеками вроде NumPy для типизации форм тензоров.

## Распространённые ошибки

### Использование одного TypeVar для несвязанных параметров

```python
from typing import TypeVar

T = TypeVar('T')

# Неправильно: T должен быть одним типом и для входа, и для выхода
# Это означает: если передать int, вернётся int, а не произвольный тип
def bad_convert(value: T, target_type: type[T]) -> T:
    return target_type(value)  # type: ignore

# Правильно: два разных TypeVar
Source = TypeVar('Source')
Target = TypeVar('Target')

def convert(value: Source, converter: 'Callable[[Source], Target]') -> Target:
    return converter(value)

result = convert('42', int)  # тип result: int
```

### Избыточный Generic при наследовании

```python
from typing import TypeVar, Generic

T = TypeVar('T')

class Base(Generic[T]):
    def get(self) -> T: ...

# Неправильно — дублирование Generic[T]
class Child(Base[T], Generic[T]):
    pass

# Правильно — Generic[T] наследуется через Base[T]
class Child(Base[T]):
    pass
```

## Итог

Обобщённые типы в Python позволяют писать переиспользуемый код без потери информации о типах:

- `TypeVar` создаёт переменную типа для функций и классов
- `bound` ограничивает тип снизу — принимает указанный тип и его подтипы
- `constraints` фиксирует конкретный набор допустимых типов
- `Generic[T]` превращает класс в обобщённый контейнер
- `Protocol` + `Generic` описывает структурные обобщённые интерфейсы
- `ParamSpec` сохраняет сигнатуру функций при декорировании
- Python 3.12+ предлагает более лаконичный синтаксис через `[T]`

Правильное использование generics делает API библиотек и модулей самодокументируемым: пользователь сразу видит, что возвращает функция, без необходимости смотреть в исходники.

Чтобы глубже освоить систему типов Python и научиться писать профессиональный Python-код, записывайтесь на курс — [Python-разработчик на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-generics-typevar).
