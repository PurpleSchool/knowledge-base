---
metaTitle: Пользовательские исключения в Python — создание и использование
metaDescription: Узнайте, как создавать пользовательские исключения в Python, строить иерархии классов ошибок и использовать их в реальных проектах.
author: Антон Ларичев
title: Пользовательские исключения в Python
preview: Разбираем, как создавать собственные классы исключений в Python, наследовать их от Exception, добавлять атрибуты и применять в реальных сценариях.
---

## Введение

Встроенные исключения Python — `ValueError`, `TypeError`, `KeyError` — покрывают большой круг стандартных ошибок. Однако в реальных приложениях часто возникают ситуации, которые стандартными исключениями точно не описать: ошибка валидации формы, нарушение бизнес-правила, недопустимое состояние объекта. Именно для таких случаев в Python предусмотрен механизм пользовательских исключений.

В этой статье вы узнаете, зачем нужны собственные классы исключений, как их правильно создавать, как строить иерархии ошибок и как применять их в блоках `try/except` на практических примерах.

### Зачем создавать пользовательские исключения

Пользовательские исключения решают несколько важных задач:

* **Семантическая точность** — вместо безликого `ValueError` код выбрасывает `InvalidEmailError`, и сразу понятно, что именно пошло не так.
* **Разделение ответственности** — модуль сам определяет контракт своих ошибок, а вызывающий код может их ловить по типу.
* **Дополнительный контекст** — к исключению можно прикрепить поле, код ошибки, исходное значение — всё, что нужно для диагностики и обработки.
* **Иерархия ошибок** — можно поймать как конкретную ошибку, так и целый класс связанных ошибок одним `except`.

### Наследование от класса Exception

Все пользовательские исключения должны наследоваться от `Exception` (или от одного из его подклассов). Наследование от базового `BaseException` не рекомендуется: он является корнем дерева всех исключений Python, включая системные (`SystemExit`, `KeyboardInterrupt`), которые прерывать не следует.

Минимальный пример — пустой класс с говорящим именем:

```python
# Минимальное пользовательское исключение
class AppError(Exception):
    pass
```

Этого уже достаточно, чтобы выбросить и поймать исключение:

```python
raise AppError("Что-то пошло не так")
```

### Добавление атрибутов и сообщений через __init__

Чтобы исключение несло больше информации, переопределите метод `__init__`. Это позволяет передавать произвольные данные вместе с ошибкой.

```python
class ValidationError(Exception):
    """Ошибка валидации входных данных."""

    def __init__(self, field: str, message: str):
        # Сохраняем поле, в котором возникла ошибка
        self.field = field
        # Сохраняем сообщение об ошибке
        self.message = message
        # Передаём удобочитаемое сообщение в базовый класс
        super().__init__(f"Поле '{field}': {message}")
```

Использование:

```python
try:
    raise ValidationError(field="email", message="некорректный формат")
except ValidationError as e:
    print(e.field)    # email
    print(e.message)  # некорректный формат
    print(e)          # Поле 'email': некорректный формат
```

### Метод __str__ для читаемого вывода

Если нужно полностью контролировать строковое представление исключения, переопределите `__str__`:

```python
class BusinessRuleError(Exception):
    """Нарушение бизнес-правила."""

    def __init__(self, rule: str, details: str = ""):
        self.rule = rule
        self.details = details

    def __str__(self):
        # Формируем сообщение вручную
        base = f"Нарушено правило: {self.rule}"
        if self.details:
            return f"{base} — {self.details}"
        return base
```

```python
err = BusinessRuleError(
    rule="минимальный баланс",
    details="на счету должно быть не менее 100 рублей"
)
print(err)
# Нарушено правило: минимальный баланс — на счету должно быть не менее 100 рублей
```

### Создание иерархий исключений

В крупных приложениях удобно выстраивать дерево исключений: общий базовый класс для всего модуля, а конкретные ошибки наследуют от него. Это даёт гибкость при обработке — можно ловить и точечно, и широко.

```python
# Базовое исключение всего приложения
class AppError(Exception):
    """Базовое исключение приложения."""
    pass


# Группа ошибок валидации
class ValidationError(AppError):
    """Ошибка валидации входных данных."""

    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(f"Поле '{field}': {message}")


class RequiredFieldError(ValidationError):
    """Обязательное поле не заполнено."""

    def __init__(self, field: str):
        super().__init__(field=field, message="обязательное поле")


class InvalidFormatError(ValidationError):
    """Поле заполнено в неверном формате."""

    def __init__(self, field: str, expected_format: str):
        self.expected_format = expected_format
        super().__init__(field=field, message=f"ожидается формат: {expected_format}")


# Группа бизнес-ошибок
class BusinessError(AppError):
    """Нарушение бизнес-правила."""
    pass


class InsufficientFundsError(BusinessError):
    """Недостаточно средств на счёте."""

    def __init__(self, balance: float, required: float):
        self.balance = balance
        self.required = required
        super().__init__(
            f"Недостаточно средств: есть {balance:.2f} ₽, нужно {required:.2f} ₽"
        )


class OrderLimitExceededError(BusinessError):
    """Превышен лимит заказов."""

    def __init__(self, limit: int):
        self.limit = limit
        super().__init__(f"Превышен лимит заказов: максимум {limit} в день")
```

Если хотите детально освоить объектно-ориентированное программирование в Python и научиться правильно проектировать иерархии классов — приходите на наш большой курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=polzovatelskie-isklyucheniya-python).
На курсе 209 уроков и 34 упражнения, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Ключевое слово raise — как выбрасывать исключения

Исключение выбрасывается оператором `raise`. Можно передать экземпляр класса или сам класс (тогда Python создаст экземпляр без аргументов).

```python
# Выброс с явным созданием экземпляра (предпочтительный вариант)
raise ValidationError(field="username", message="не может быть пустым")

# Перевыброс пойманного исключения
try:
    do_something()
except ValueError as e:
    # Оборачиваем стандартное исключение в пользовательское
    raise ValidationError(field="age", message="должно быть числом") from e
```

Конструкция `raise ... from e` сохраняет цепочку исключений, что упрощает отладку: в трейсбеке будет видно и исходное исключение.

### Использование пользовательских исключений в try/except

Пользовательские исключения ловятся точно так же, как встроенные:

```python
def register_user(username: str, email: str, age: int) -> dict:
    """Регистрирует нового пользователя после валидации."""
    if not username:
        raise RequiredFieldError(field="username")
    if "@" not in email:
        raise InvalidFormatError(field="email", expected_format="user@example.com")
    if age < 18:
        raise ValidationError(field="age", message="должно быть не менее 18 лет")

    return {"username": username, "email": email, "age": age}


# Точечная обработка конкретных ошибок
try:
    user = register_user(username="", email="test@test.com", age=20)
except RequiredFieldError as e:
    print(f"Не заполнено обязательное поле: {e.field}")
except InvalidFormatError as e:
    print(f"Неверный формат поля {e.field}, ожидается: {e.expected_format}")
except ValidationError as e:
    # Поймает любую ValidationError, которую не поймали выше
    print(f"Ошибка валидации: {e}")
```

Благодаря иерархии можно также ловить весь класс ошибок:

```python
try:
    process_payment(user_id=1, amount=500.0)
except BusinessError as e:
    # Поймает InsufficientFundsError, OrderLimitExceededError и любой другой BusinessError
    print(f"Бизнес-ошибка: {e}")
except AppError as e:
    # Поймает всё остальное из нашего приложения
    print(f"Ошибка приложения: {e}")
```

### Реальный пример: валидация и бизнес-логика

Рассмотрим небольшой модуль оформления заказа, где пользовательские исключения используются на всех уровнях:

```python
class OrderService:
    """Сервис для оформления заказов."""

    MAX_DAILY_ORDERS = 5

    def __init__(self, user_balance: float, orders_today: int):
        self.user_balance = user_balance
        self.orders_today = orders_today

    def _validate_order(self, product_name: str, quantity: int, price: float) -> None:
        """Проверяет корректность данных заказа."""
        if not product_name:
            raise RequiredFieldError(field="product_name")
        if quantity <= 0:
            raise ValidationError(
                field="quantity",
                message="количество должно быть положительным числом"
            )
        if price <= 0:
            raise ValidationError(
                field="price",
                message="цена должна быть больше нуля"
            )

    def _check_business_rules(self, total: float) -> None:
        """Проверяет бизнес-правила перед оформлением заказа."""
        if self.user_balance < total:
            raise InsufficientFundsError(
                balance=self.user_balance,
                required=total
            )
        if self.orders_today >= self.MAX_DAILY_ORDERS:
            raise OrderLimitExceededError(limit=self.MAX_DAILY_ORDERS)

    def place_order(self, product_name: str, quantity: int, price: float) -> dict:
        """Оформляет заказ. Выбрасывает исключения при нарушении правил."""
        # Шаг 1: проверяем входные данные
        self._validate_order(product_name, quantity, price)

        total = quantity * price

        # Шаг 2: проверяем бизнес-правила
        self._check_business_rules(total)

        # Шаг 3: оформляем заказ
        self.user_balance -= total
        self.orders_today += 1
        return {
            "product": product_name,
            "quantity": quantity,
            "total": total,
            "remaining_balance": self.user_balance,
        }


# Использование сервиса
service = OrderService(user_balance=300.0, orders_today=2)

try:
    order = service.place_order(product_name="Ноутбук", quantity=1, price=250.0)
    print(f"Заказ оформлен: {order}")
except ValidationError as e:
    print(f"Некорректные данные — {e}")
except InsufficientFundsError as e:
    print(f"Оплата невозможна: баланс {e.balance:.2f} ₽, нужно {e.required:.2f} ₽")
except OrderLimitExceededError as e:
    print(f"Лимит заказов исчерпан: максимум {e.limit} в день")
except AppError as e:
    print(f"Непредвиденная ошибка приложения: {e}")
```

### Соглашения об именовании

Python-сообщество придерживается нескольких устоявшихся правил именования исключений:

* **Суффикс `Error`** — для классов, обозначающих ошибки: `ValidationError`, `NotFoundError`, `AuthError`.
* **Суффикс `Exception`** — реже, как правило в библиотеках: `RequestException`, `TimeoutException`.
* **PascalCase** — все классы исключений пишутся в стиле PascalCase.
* **Говорящее имя** — название должно однозначно описывать ситуацию: `InsufficientFundsError` лучше, чем `PaymentError`.
* **Базовый класс модуля** — в каждом пакете принято иметь один корневой `<Module>Error`, от которого наследуются все остальные ошибки модуля.

### Частые ошибки

* **Наследование от `BaseException`** — это нарушает стандартное поведение `except Exception` и мешает корректному завершению программы.
* **Слишком общие исключения** — класс `Error` без уточнения не несёт смысла; конкретизируйте имя.
* **Забытый вызов `super().__init__()`** — без него атрибут `args` будет пустым, и сообщение не выведется в трейсбеке.
* **Исключение без сообщения** — `raise AppError()` без аргументов сложно диагностировать; всегда передавайте понятное сообщение.
* **Перехват слишком широко** — `except Exception` скрывает неожиданные ошибки; ловите конкретные классы там, где это возможно.
* **Игнорирование цепочки** — если оборачиваете чужое исключение в своё, используйте `raise MyError(...) from original_error`, чтобы не потерять контекст.

### Частозадаваемые вопросы

**Можно ли наследоваться от встроенных исключений, например от `ValueError`?**
Да, это полезно, когда ваша ошибка концептуально является разновидностью стандартной. Например, `InvalidAgeError(ValueError)` сигнализирует, что значение некорректно, и код, ловящий `ValueError`, тоже его поймает.

**Нужно ли всегда создавать базовый класс для модуля?**
Не обязательно в небольших скриптах, но в библиотеках и пакетах это хорошая практика: пользователи смогут поймать все ошибки вашего модуля одним `except YourLibraryError`.

**Как прикрепить к исключению код ошибки (например, для API)?**
Добавьте атрибут `code` в `__init__`:
```python
class ApiError(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        super().__init__(message)
```

**Можно ли использовать датаклассы для исключений?**
Нет: `@dataclass` не совместим с иерархией исключений в Python — датаклассы не вызывают `super().__init__()` автоматически. Определяйте `__init__` вручную.

**В чём разница между `raise` и `raise ... from`?**
`raise MyError()` выбрасывает новое исключение. `raise MyError() from original` выбрасывает его с явной цепочкой: Python покажет в трейсбеке оба исключения и отметит, что второе вызвано первым. `raise MyError() from None` скрывает исходное исключение.

### Заключение

Пользовательские исключения — это инструмент выразительного и надёжного кода. Они позволяют точно описывать ошибки предметной области, передавать контекст и строить гибкие иерархии для удобной обработки. Ключевые принципы: наследоваться от `Exception`, вызывать `super().__init__()`, давать исключениям говорящие имена с суффиксом `Error` и всегда передавать достаточный контекст.

Для закрепления навыков работы с исключениями и всеми основами Python рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=polzovatelskie-isklyucheniya-python).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет познакомиться с подходом и стилем преподавания, разобрать базовые концепции языка и понять структуру курса до покупки полного доступа.
