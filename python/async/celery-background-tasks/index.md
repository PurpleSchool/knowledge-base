---
metaTitle: "Celery в Python: фоновые задачи и очереди сообщений"
metaDescription: "Как использовать Celery в Python для выполнения фоновых задач: установка, настройка с Redis и RabbitMQ, декораторы задач, цепочки и мониторинг."
author: "Антон Ларичев"
title: "Фоновые задачи с Celery в Python"
preview: "Разбираем Celery — самую популярную библиотеку для фоновых задач в Python: от установки до продвинутых паттернов."
---

## Что такое Celery и зачем он нужен

Celery — это распределённая очередь задач для Python. Она позволяет выполнять тяжёлые или длительные операции вне основного потока обработки запроса: отправку email, генерацию отчётов, обработку изображений, обращения к внешним API.

Без фоновых задач пользователь вынужден ждать завершения каждой операции прямо в браузере. С Celery запрос возвращается мгновенно, а работа выполняется отдельным процессом-воркером.

Архитектура Celery строится на трёх компонентах:

- **Producer** — приложение, которое ставит задачи в очередь.
- **Broker** — брокер сообщений, хранящий задачи (Redis, RabbitMQ).
- **Worker** — процесс, который забирает задачи из очереди и выполняет их.

## Установка и настройка

Установите Celery и Redis-клиент:

```bash
pip install celery redis
```

Для работы нужен запущенный Redis (или RabbitMQ). Быстрый способ через Docker:

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

Создайте файл `celery_app.py`:

```python
from celery import Celery

app = Celery(
    'myproject',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1',
)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Moscow',
    enable_utc=True,
)
```

`broker` — адрес брокера сообщений, куда Celery будет отправлять задачи.
`backend` — хранилище результатов. Без него `.get()` на задаче упадёт с ошибкой.

## Создание первой задачи

Задача — это обычная Python-функция, помеченная декоратором `@app.task`:

```python
from celery_app import app
import time

@app.task
def send_email(recipient: str, subject: str, body: str) -> dict:
    time.sleep(2)  # имитация отправки
    print(f'Email отправлен на {recipient}')
    return {'status': 'sent', 'recipient': recipient}
```

Чтобы поставить задачу в очередь, используйте `.delay()` или `.apply_async()`:

```python
# Простой вызов
result = send_email.delay('user@example.com', 'Привет', 'Текст письма')
print(result.id)  # UUID задачи, например: 'd4f7a2b1-...'

# Проверить результат (блокирующий вызов)
data = result.get(timeout=10)
print(data)  # {'status': 'sent', 'recipient': 'user@example.com'}
```

`.delay()` — это сокращение для `.apply_async(args=[...])`. Оба метода немедленно возвращают объект `AsyncResult`.

## Запуск воркера

Воркер запускается из командной строки:

```bash
celery -A celery_app worker --loglevel=info
```

Флаг `-A` указывает модуль, где находится объект `Celery`. После запуска воркер подключается к брокеру и ждёт задач. Как только задача появляется в очереди, воркер забирает её и выполняет.

Для разработки удобен флаг `--concurrency=1` — воркер будет однопоточным и проще для отладки:

```bash
celery -A celery_app worker --loglevel=info --concurrency=1
```

## apply_async и параметры выполнения

Метод `.apply_async()` даёт полный контроль над постановкой задачи:

```python
from datetime import datetime, timedelta

# Отложенный запуск через 30 секунд
send_email.apply_async(
    args=['user@example.com', 'Напоминание', 'Текст'],
    countdown=30,
)

# Запуск в конкретное время
eta = datetime.utcnow() + timedelta(hours=1)
send_email.apply_async(
    args=['user@example.com', 'Отложенное письмо', 'Текст'],
    eta=eta,
)

# Установить таймаут выполнения
send_email.apply_async(
    args=['user@example.com', 'Срочное', 'Текст'],
    time_limit=60,   # секунды
    soft_time_limit=50,
)
```

`soft_time_limit` вызывает исключение `SoftTimeLimitExceeded`, которое можно поймать. `time_limit` убивает задачу жёстко.

## Статусы и результаты задач

Объект `AsyncResult` позволяет отслеживать выполнение:

```python
result = send_email.delay('user@example.com', 'Тема', 'Текст')

print(result.id)       # UUID задачи
print(result.status)   # PENDING, STARTED, SUCCESS, FAILURE, RETRY, REVOKED
print(result.ready())  # True если задача завершена
print(result.successful())  # True если завершена без ошибок

if result.ready():
    if result.successful():
        print(result.get())
    else:
        print(result.traceback)  # текст ошибки
```

Важно: вызов `.get()` без `timeout` заблокирует поток навсегда, если задача зависнет. Всегда указывайте таймаут в продакшне.

## Обработка ошибок и повторные попытки

Celery умеет автоматически перезапускать упавшие задачи:

```python
import requests
from celery_app import app
from celery.exceptions import SoftTimeLimitExceeded

@app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,  # секунды между попытками
)
def fetch_external_data(self, url: str) -> dict:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    except SoftTimeLimitExceeded:
        return {'error': 'timeout'}
```

`bind=True` передаёт экземпляр задачи первым аргументом (`self`). Это нужно для доступа к `self.retry()` и `self.request`.

`self.request.retries` — счётчик текущей попытки, начиная с 0. Формула `2 ** self.request.retries` даёт экспоненциальную задержку: 1, 2, 4, 8 секунд.

## Цепочки, группы и аккорды

Celery позволяет строить сложные пайплайны из задач.

### Цепочка (chain)

Задачи выполняются последовательно, результат каждой передаётся в следующую:

```python
from celery import chain
from tasks import download_file, process_file, send_report

pipeline = chain(
    download_file.s('https://example.com/data.csv'),
    process_file.s(),
    send_report.s('admin@example.com'),
)

result = pipeline.apply_async()
```

`.s()` — это сокращение от `.signature()`, создаёт ленивую подпись задачи без её немедленного запуска.

### Группа (group)

Задачи выполняются параллельно:

```python
from celery import group

job = group(
    send_email.s('user1@example.com', 'Тема', 'Текст'),
    send_email.s('user2@example.com', 'Тема', 'Текст'),
    send_email.s('user3@example.com', 'Тема', 'Текст'),
)

result = job.apply_async()
results = result.get()  # список результатов всех задач
```

### Аккорд (chord)

Группа задач с коллбэком, который вызывается после завершения всех:

```python
from celery import chord

callback = send_report.s('admin@example.com')
header = group(
    process_chunk.s(chunk) for chunk in data_chunks
)

workflow = chord(header, callback)
workflow.apply_async()
```

## Периодические задачи с Celery Beat

Celery Beat — планировщик, который запускает задачи по расписанию, как cron.

Настройка расписания:

```python
from celery_app import app
from celery.schedules import crontab

app.conf.beat_schedule = {
    'cleanup-every-night': {
        'task': 'tasks.cleanup_old_records',
        'schedule': crontab(hour=2, minute=0),  # каждый день в 02:00
    },
    'send-digest-every-hour': {
        'task': 'tasks.send_digest',
        'schedule': 3600.0,  # каждые 3600 секунд
        'args': ('all_users',),
    },
}
```

Запустите Beat отдельным процессом:

```bash
celery -A celery_app beat --loglevel=info
```

В продакшне Beat и Worker запускаются независимо. Beat только ставит задачи в очередь, Worker их выполняет.

## Мониторинг с Flower

Flower — веб-интерфейс для мониторинга Celery в реальном времени.

```bash
pip install flower
celery -A celery_app flower --port=5555
```

Откройте `http://localhost:5555`. Там видны активные воркеры, очереди, история выполненных задач, статистика.

## Интеграция с Django

Для Django есть специальный пакет `django-celery-results` для хранения результатов в базе данных:

```bash
pip install django-celery-results django-celery-beat
```

Создайте файл `myproject/celery.py`:

```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

app = Celery('myproject')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

В `myproject/__init__.py`:

```python
from .celery import app as celery_app

__all__ = ('celery_app',)
```

В `settings.py`:

```python
INSTALLED_APPS = [
    ...
    'django_celery_results',
    'django_celery_beat',
]

CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'django-db'
CELERY_CACHE_BACKEND = 'django-cache'
```

Задачи в приложениях Django пишутся в файлах `tasks.py`, и `autodiscover_tasks()` находит их автоматически:

```python
# orders/tasks.py
from celery import shared_task
from .models import Order
from .email import send_confirmation

@shared_task
def process_order(order_id: int) -> str:
    order = Order.objects.get(id=order_id)
    order.status = 'processing'
    order.save()
    send_confirmation(order)
    return f'Order {order_id} processed'
```

`@shared_task` не привязывает задачу к конкретному экземпляру `Celery` — это правильный подход для переиспользуемых приложений.

## Конфигурация для продакшна

Несколько важных настроек, которые стоит включить перед деплоем:

```python
app.conf.update(
    # Подтверждение только после выполнения задачи
    task_acks_late=True,

    # Воркер не берёт задачи "про запас"
    worker_prefetch_multiplier=1,

    # Ограничение результатов в backend
    result_expires=3600,  # 1 час

    # Максимальное число задач на воркер до перезапуска (защита от утечек памяти)
    worker_max_tasks_per_child=1000,

    # Логирование в формате JSON для систем мониторинга
    worker_log_format='[%(asctime)s] %(message)s',
)
```

`task_acks_late=True` в связке с `worker_prefetch_multiplier=1` гарантирует, что задача не потеряется, если воркер упадёт в процессе выполнения — брокер вернёт её в очередь.

## Распространённые ошибки

**Передача объектов Django-моделей в задачу.** Модели нельзя сериализовать через JSON. Передавайте только ID:

```python
# Неправильно
process_order.delay(order)  # Order instance не сериализуется

# Правильно
process_order.delay(order.id)
```

**Вызов .get() внутри задачи.** Это deadlock — задача ждёт результат другой задачи, которая не может начаться, пока не освободится воркер. Используйте `chain` вместо вложенных `.get()`.

**Отсутствие идемпотентности.** Если задача упадёт на середине и запустится снова, она не должна создавать дублирующие записи или отправлять письма дважды. Проверяйте состояние перед выполнением.

```python
@app.task(bind=True)
def send_welcome_email(self, user_id: int) -> str:
    from myapp.models import User, EmailLog

    if EmailLog.objects.filter(user_id=user_id, type='welcome').exists():
        return 'already_sent'

    user = User.objects.get(id=user_id)
    # отправить письмо...
    EmailLog.objects.create(user_id=user_id, type='welcome')
    return 'sent'
```

## Итог

Celery решает одну из самых частых проблем backend-разработки — выполнение тяжёлых операций без блокировки пользовательского запроса. Ключевые концепции:

- Брокер (Redis / RabbitMQ) хранит очередь задач.
- Воркер выполняет задачи асинхронно.
- `@app.task` и `@shared_task` превращают функции в задачи.
- `.delay()` и `.apply_async()` ставят задачи в очередь.
- `chain`, `group`, `chord` позволяют строить пайплайны.
- Celery Beat запускает задачи по расписанию.
- `task_acks_late` и идемпотентность — обязательны в продакшне.

Чтобы глубже разобраться в Python и его экосистеме, посмотрите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=celery-background-tasks