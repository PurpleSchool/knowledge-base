---
metaTitle: Функция super() в Python — как вызвать метод родителя
metaDescription: Разбираем функцию super() в Python — как вызывать методы родительского класса, работать с конструкторами и использовать super() при множественном наследовании.
author: Антон Ларичев
title: Функция super() в Python — как вызвать метод родителя
preview: Изучаем функцию super() в Python — вызов методов и конструкторов родительского класса, работа с цепочками наследования и практические примеры.
---

## Введение

Функция `super()` в Python — это встроенный инструмент для вызова методов родительского класса из дочернего. Она играет ключевую роль в наследовании, позволяя расширять поведение родителя, а не заменять его полностью. В этой статье мы разберём, как работает `super()`, как использовать её в конструкторах и методах, а также какие нюансы возникают при множественном наследовании.

## Базовое использование super()

Самый частый случай — вызов конструктора родительского класса:

```python
class Animal:
    def __init__(self, name):
        self.name = name
        print(f"Animal создан: {self.name}")


class Dog(Animal):
    def __init__(self, name, breed):
        # Вызываем конструктор родителя
        super().__init__(name)
        self.breed = breed
        print(f"Dog создан: {self.breed}")


dog = Dog("Бобик", "Лабрадор")
# Animal создан: Бобик
# Dog создан: Лабрадор
print(dog.name)   # Бобик
print(dog.breed)  # Лабрадор
```

Без вызова `super().__init__(name)` атрибут `self.name` не был бы создан, потому что конструктор `Animal` не выполнится автоматически, если `Dog` определяет свой `__init__`.

## super() в обычных методах

Функция `super()` работает не только в `__init__`, но и в любых методах:

```python
class Logger:
    def log(self, message):
        print(f"[BASE] {message}")


class TimedLogger(Logger):
    def log(self, message):
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        # Вызываем log() родителя с изменённым сообщением
        super().log(f"{timestamp} — {message}")


class PrefixLogger(TimedLogger):
    def __init__(self, prefix):
        self.prefix = prefix

    def log(self, message):
        # Вызываем log() родителя (TimedLogger), добавляя префикс
        super().log(f"[{self.prefix}] {message}")


logger = PrefixLogger("APP")
logger.log("Сервер запущен")
# [BASE] 12:30:45 — [APP] Сервер запущен
```

Каждый уровень иерархии добавляет свою логику через `super()`, формируя цепочку вызовов.

## Разница между super() и прямым вызовом

Можно вызвать метод родителя напрямую, указав имя класса. Но `super()` предпочтительнее:

```python
class Parent:
    def greet(self):
        return "Привет от Parent"


class Child(Parent):
    def greet_with_super(self):
        # Рекомендуемый способ
        return super().greet()

    def greet_direct(self):
        # Работает, но не рекомендуется
        return Parent.greet(self)


child = Child()
print(child.greet_with_super())  # Привет от Parent
print(child.greet_direct())      # Привет от Parent
```

Преимущества `super()` перед прямым вызовом:

* **Гибкость** — при изменении иерархии наследования не нужно менять вызовы
* **Корректная работа с MRO** — при множественном наследовании `super()` следует правильному порядку разрешения методов
* **Меньше дублирования** — имя родительского класса указывается только в определении класса

Объектно-ориентированное программирование станет интуитивно понятным, если разобраться в его основах на реальных задачах. Если вы хотите детальнее изучить ООП и наследование — приходите на наш большой курс [Основы Python](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=super-v-python).
На курсе 210 уроков и 180 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## super() при множественном наследовании

При множественном наследовании `super()` следует MRO (Method Resolution Order):

```python
class A:
    def __init__(self):
        print("A.__init__")
        super().__init__()


class B(A):
    def __init__(self):
        print("B.__init__")
        super().__init__()


class C(A):
    def __init__(self):
        print("C.__init__")
        super().__init__()


class D(B, C):
    def __init__(self):
        print("D.__init__")
        super().__init__()


# Смотрим MRO
print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

d = D()
# D.__init__
# B.__init__
# C.__init__
# A.__init__
```

Обратите внимание: `super()` в классе `B` вызывает `C.__init__()`, а не `A.__init__()`, потому что в MRO после `B` идёт `C`. Каждый конструктор вызывается ровно один раз.

## super() с аргументами в Python 2 и Python 3

В Python 3 синтаксис `super()` был упрощён:

```python
# Python 2 — нужно указывать класс и self
class Child(Parent):
    def __init__(self):
        super(Child, self).__init__()

# Python 3 — достаточно вызвать без аргументов
class Child(Parent):
    def __init__(self):
        super().__init__()
```

Оба варианта работают в Python 3, но предпочтительнее использовать `super()` без аргументов — это короче и не требует повторного указания имени класса.

## Практический пример: система валидации

Рассмотрим реальный сценарий, где `super()` помогает строить цепочку валидаторов:

```python
class BaseValidator:
    def validate(self, value):
        # Базовая проверка — значение не None
        if value is None:
            raise ValueError("Значение не может быть None")
        return True


class TypeValidator(BaseValidator):
    def __init__(self, expected_type):
        self.expected_type = expected_type

    def validate(self, value):
        # Сначала выполняем проверку родителя
        super().validate(value)
        if not isinstance(value, self.expected_type):
            raise TypeError(f"Ожидался тип {self.expected_type.__name__}, "
                          f"получен {type(value).__name__}")
        return True


class RangeValidator(TypeValidator):
    def __init__(self, min_val, max_val):
        super().__init__(int)
        self.min_val = min_val
        self.max_val = max_val

    def validate(self, value):
        # Вызываем цепочку: RangeValidator -> TypeValidator -> BaseValidator
        super().validate(value)
        if not (self.min_val <= value <= self.max_val):
            raise ValueError(f"Значение {value} вне диапазона "
                           f"[{self.min_val}, {self.max_val}]")
        return True


# Используем валидатор
validator = RangeValidator(1, 100)

validator.validate(50)   # OK
validator.validate(None)  # ValueError: Значение не может быть None
validator.validate("abc") # TypeError: Ожидался тип int, получен str
validator.validate(200)   # ValueError: Значение 200 вне диапазона [1, 100]
```

Каждый уровень валидации добавляет свою проверку через `super()`, формируя надёжную цепочку.

## Частые ошибки

* **Забытый `super().__init__()`** — если дочерний класс определяет `__init__` без вызова `super().__init__()`, атрибуты родителя не инициализируются, что приводит к `AttributeError` при обращении к ним.
* **Несовместимые сигнатуры `__init__`** — при множественном наследовании все классы в цепочке должны корректно принимать и передавать аргументы. Используйте `**kwargs` для гибкости.
* **Вызов `super()` вне метода класса** — `super()` без аргументов работает только внутри методов класса. В других контекстах нужно указывать аргументы явно.

## Частозадаваемые вопросы

**Что произойдёт, если не вызвать super().__init__() в дочернем классе?**
Конструктор родителя не будет выполнен. Атрибуты, которые инициализируются в родительском `__init__`, не будут созданы. При обращении к ним вы получите `AttributeError`.

**Можно ли вызвать super() несколько раз в одном методе?**
Технически можно, но это плохая практика. Каждый вызов `super()` возвращает прокси-объект для следующего класса в MRO, и повторный вызов приведёт к повторному выполнению метода родителя.

**Как передавать аргументы через super() при множественном наследовании?**
Лучший подход — использовать `**kwargs` для передачи именованных аргументов по цепочке, чтобы каждый класс брал нужные ему параметры и передавал остальные дальше.

## Заключение

Функция `super()` — незаменимый инструмент при работе с наследованием в Python. Она обеспечивает корректный вызов методов по цепочке MRO, делает код более гибким и устойчивым к изменениям в иерархии классов. Всегда используйте `super()` вместо прямого вызова методов родителя.

Для закрепления навыков работы с наследованием и `super()` рекомендуем курс [Основы Python](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=super-v-python).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет попрактиковаться с ООП на реальных задачах и понять структуру курса до покупки полного доступа.
