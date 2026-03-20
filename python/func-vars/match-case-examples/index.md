---
metaTitle: Практические примеры match/case в Python — реальные сценарии применения
metaDescription: Разбираем практические примеры использования match/case в Python 3.10+ — парсинг команд, обработка API-ответов, конечные автоматы и валидация данных.
author: Антон Ларичев
title: Практические примеры match/case в Python — реальные сценарии применения
preview: Изучаем практические примеры match/case в Python 3.10+ — парсинг команд, обработка API-ответов, конечные автоматы, валидация данных и рефакторинг кода.
---

## Введение

Оператор `match/case` в Python 3.10+ особенно полезен в реальных проектах, где приходится разбирать сложные структуры данных, обрабатывать разнородные сообщения и управлять состояниями. В этой статье мы разберём практические сценарии, в которых `match/case` делает код значительно чище и понятнее по сравнению с цепочками `if/elif`.

## Парсинг команд CLI

Один из классических сценариев — разбор пользовательских команд в интерфейсе командной строки.

```python
# Парсер команд для файлового менеджера
def execute_command(input_str):
    # Разбиваем строку на токены
    tokens = input_str.strip().split()

    match tokens:
        case ["ls"]:
            return list_files(".")
        case ["ls", path]:
            return list_files(path)
        case ["cd", path]:
            return change_directory(path)
        case ["mkdir", name]:
            return create_directory(name)
        case ["cp", source, dest]:
            return copy_file(source, dest)
        case ["mv", source, dest]:
            return move_file(source, dest)
        case ["rm", "-r", path]:
            return remove_recursive(path)
        case ["rm", path]:
            return remove_file(path)
        case ["help" | "?"]:
            return show_help()
        case []:
            return None
        case [cmd, *_]:
            return f"Неизвестная команда: {cmd}"

# Примеры использования
print(execute_command("cp report.txt backup/"))
print(execute_command("rm -r temp/"))
```

Здесь `match/case` естественно описывает грамматику команд: каждый `case` — это шаблон допустимой команды с определённым числом аргументов.

## Обработка ответов API

При работе с внешними API ответы приходят в разных форматах. `match/case` помогает обрабатывать их единообразно.

```python
import json

# Обработка ответов платёжного API
def handle_payment_response(response):
    match response:
        case {"status": "success", "transaction_id": tid, "amount": amount}:
            print(f"Платёж прошёл: транзакция {tid}, сумма {amount} руб.")
            save_transaction(tid, amount)

        case {"status": "pending", "transaction_id": tid, "eta": eta}:
            print(f"Платёж в обработке: {tid}, ожидание ~{eta} сек.")
            schedule_check(tid, eta)

        case {"status": "error", "code": code, "message": msg}:
            print(f"Ошибка платежа [{code}]: {msg}")
            handle_payment_error(code, msg)

        case {"status": "error", "code": code}:
            # Ошибка без описания
            print(f"Ошибка платежа [{code}]")
            handle_payment_error(code, "Описание отсутствует")

        case _:
            print(f"Неизвестный формат ответа: {response}")
            log_unknown_response(response)

# Пример вызова
handle_payment_response({
    "status": "success",
    "transaction_id": "TXN-12345",
    "amount": 1500,
    "currency": "RUB"
})
# Платёж прошёл: транзакция TXN-12345, сумма 1500 руб.
```

## Обработка событий и сообщений

В событийно-ориентированных системах `match/case` отлично подходит для маршрутизации различных типов событий.

```python
from dataclasses import dataclass
from datetime import datetime

@dataclass
class UserRegistered:
    user_id: int
    email: str

@dataclass
class OrderPlaced:
    order_id: int
    user_id: int
    total: float

@dataclass
class PaymentReceived:
    order_id: int
    amount: float
    method: str

@dataclass
class OrderCancelled:
    order_id: int
    reason: str

# Обработчик событий
def handle_event(event):
    match event:
        case UserRegistered(user_id=uid, email=email):
            print(f"Новый пользователь {uid}: {email}")
            send_welcome_email(email)

        case OrderPlaced(order_id=oid, total=total) if total > 10000:
            print(f"Крупный заказ #{oid} на {total} руб.")
            notify_manager(oid)

        case OrderPlaced(order_id=oid, user_id=uid, total=total):
            print(f"Заказ #{oid} от пользователя {uid}")
            process_order(oid)

        case PaymentReceived(order_id=oid, amount=amount, method=method):
            print(f"Оплата заказа #{oid}: {amount} руб. ({method})")
            confirm_payment(oid)

        case OrderCancelled(order_id=oid, reason=reason):
            print(f"Отмена заказа #{oid}: {reason}")
            refund_order(oid)

        case _:
            print(f"Неизвестное событие: {type(event).__name__}")

# Примеры
handle_event(UserRegistered(1, "user@example.com"))
handle_event(OrderPlaced(101, 1, 15000))
handle_event(PaymentReceived(101, 15000, "карта"))
```

Если вы хотите детальнее изучить Python и создание реальных проектов — приходите на наш большой курс [Python-разработчик с нуля](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=match-case-examples).
На курсе 210 уроков и 150 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Конечный автомат (State Machine)

`match/case` идеально подходит для реализации конечных автоматов, где переходы зависят от текущего состояния и входного события.

```python
from dataclasses import dataclass, field

@dataclass
class TrafficLight:
    state: str = "red"
    timer: int = 0

    def tick(self):
        match self.state:
            case "red" if self.timer >= 30:
                self.state = "green"
                self.timer = 0
                print("Переключение: красный -> зелёный")
            case "green" if self.timer >= 25:
                self.state = "yellow"
                self.timer = 0
                print("Переключение: зелёный -> жёлтый")
            case "yellow" if self.timer >= 5:
                self.state = "red"
                self.timer = 0
                print("Переключение: жёлтый -> красный")
            case _:
                self.timer += 1

# Симуляция работы светофора
light = TrafficLight()
for _ in range(70):
    light.tick()
```

## Валидация данных

`match/case` помогает валидировать входные данные, проверяя их структуру и содержимое одновременно.

```python
# Валидация конфигурации базы данных
def validate_db_config(config):
    match config:
        case {
            "host": str() as host,
            "port": int() as port,
            "database": str() as db
        } if 1 <= port <= 65535:
            return {"valid": True, "host": host, "port": port, "database": db}

        case {"host": str(), "port": port, **_} if not isinstance(port, int):
            return {"valid": False, "error": f"Порт должен быть числом, получено: {type(port).__name__}"}

        case {"host": str(), "port": int() as port, **_} if port < 1 or port > 65535:
            return {"valid": False, "error": f"Порт вне диапазона: {port}"}

        case {"host": _, "database": _}:
            return {"valid": False, "error": "Отсутствует порт"}

        case _:
            return {"valid": False, "error": "Неверный формат конфигурации"}

# Примеры
print(validate_db_config({"host": "localhost", "port": 5432, "database": "mydb"}))
# {'valid': True, 'host': 'localhost', 'port': 5432, 'database': 'mydb'}

print(validate_db_config({"host": "localhost", "port": "abc", "database": "mydb"}))
# {'valid': False, 'error': "Порт должен быть числом, получено: str"}
```

## Рефакторинг if/elif в match/case

Рассмотрим типичный пример рефакторинга — обработка различных типов уведомлений.

```python
# До рефакторинга: цепочка if/elif
def format_notification_old(notification):
    if notification.get("type") == "email":
        to = notification.get("to", "")
        subject = notification.get("subject", "")
        if to and subject:
            return f"Email для {to}: {subject}"
        else:
            return "Ошибка: неполные данные email"
    elif notification.get("type") == "sms":
        phone = notification.get("phone", "")
        if phone and phone.startswith("+"):
            return f"SMS на {phone}"
        else:
            return "Ошибка: неверный номер телефона"
    elif notification.get("type") == "push":
        title = notification.get("title", "")
        return f"Push: {title}" if title else "Ошибка: нет заголовка"
    else:
        return "Неизвестный тип уведомления"

# После рефакторинга: match/case
def format_notification(notification):
    match notification:
        case {"type": "email", "to": str() as to, "subject": str() as subject}:
            return f"Email для {to}: {subject}"
        case {"type": "email"}:
            return "Ошибка: неполные данные email"

        case {"type": "sms", "phone": str() as phone} if phone.startswith("+"):
            return f"SMS на {phone}"
        case {"type": "sms"}:
            return "Ошибка: неверный номер телефона"

        case {"type": "push", "title": str() as title}:
            return f"Push: {title}"
        case {"type": "push"}:
            return "Ошибка: нет заголовка"

        case _:
            return "Неизвестный тип уведомления"

# Примеры
print(format_notification({"type": "email", "to": "user@mail.ru", "subject": "Привет"}))
# Email для user@mail.ru: Привет

print(format_notification({"type": "sms", "phone": "+79001234567"}))
# SMS на +79001234567

print(format_notification({"type": "push", "title": "Новый заказ"}))
# Push: Новый заказ
```

Версия с `match/case` лучше читается, потому что каждый шаблон одновременно проверяет тип, наличие ключей и типы значений.

## Частые ошибки

* **Слишком сложные вложенные шаблоны** — если шаблон занимает больше 3-4 строк, лучше вынести проверки в отдельную функцию или использовать guard-условие
* **Забыта обработка `case _`** — в продакшн-коде всегда добавляйте шаблон по умолчанию для логирования неожиданных данных
* **Использование match/case для простого сравнения** — если нужно проверить одно значение на равенство, `if/elif` проще и привычнее

## Частозадаваемые вопросы

**Когда стоит использовать match/case вместо if/elif?**
Используйте `match/case`, когда нужно: разбирать структуру данных (кортежи, словари, объекты), проверять несколько условий одновременно (тип + значение + структура), обрабатывать разнородные сообщения или события. Для простых проверок на равенство `if/elif` остаётся предпочтительным.

**Можно ли использовать match/case в асинхронных функциях?**
Да, `match/case` работает в `async def` функциях точно так же, как и в обычных. Это обычный оператор управления потоком, не зависящий от async/await.

**Как обработать вложенный JSON с неизвестной глубиной?**
Для JSON с неизвестной глубиной вложенности лучше комбинировать `match/case` с рекурсией. Используйте `match/case` для разбора верхнего уровня, а для глубокой обработки вызывайте функцию рекурсивно.

## Заключение

Оператор `match/case` в Python 3.10+ — это не просто синтаксический сахар. В реальных проектах он упрощает парсинг команд, обработку API-ответов, маршрутизацию событий, реализацию конечных автоматов и валидацию данных. Главное — использовать его там, где он действительно даёт выигрыш в читаемости: при работе со сложными структурами и разнородными данными.

Для закрепления навыков практического программирования на Python рекомендуем курс [Python-разработчик с нуля](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=article&utm_campaign=match-case-examples).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет попробовать язык на практике и понять структуру курса до покупки полного доступа.
