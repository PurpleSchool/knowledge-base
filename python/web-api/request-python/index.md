---
metaTitle: Как отправлять запросы с помощью requests в Python
metaDescription: Разбираем библиотеку requests в Python для отправки HTTP-запросов, обработку ответов и работу с GET, POST и другими методами.
author: Олег Марков
title: Как отправлять запросы с помощью requests в Python
preview: Изучаем библиотеку requests в Python для отправки HTTP-запросов, обработки ответов и взаимодействия с внешними API.
---

## Введение

Библиотека `requests` в Python является стандартом де-факто для работы с HTTP-запросами. Она позволяет отправлять GET, POST, PUT и DELETE запросы, обрабатывать ответы и интегрироваться с внешними API без необходимости вручную работать с низкоуровневыми HTTP-модулями.
В этой статье мы разберём, как правильно использовать `requests`, обрабатывать ответы и передавать данные на сервер.

### Установка и подключение

Для работы с `requests` нужно установить библиотеку, если она ещё не установлена:

```bash
pip install requests
```

Затем подключаем её в коде:

```python
import requests
```

### Отправка GET-запроса

GET-запрос используется для получения данных с сервера:

```python
url = "https://jsonplaceholder.typicode.com/posts/1"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print("Ошибка:", response.status_code)
```

* `response.status_code` — код ответа HTTP.
* `response.json()` — преобразует JSON-ответ в словарь Python.

Для правильного взаимодействия с API важно не только отправлять запросы, но и уметь добавлять параметры, заголовки и обрабатывать ошибки. Чтобы глубже изучить работу с HTTP-запросами и внешними API на практике, рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak_otpravlyat_zaprosy_s_pomoschyu_requests_v_Python).
Курс содержит 209 уроков и 34 упражнения, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника и еженедельные встречи с менторами.

### Передача параметров и заголовков

```python
params = {"userId": 1}
headers = {"Authorization": "Bearer your_token_here"}

response = requests.get("https://jsonplaceholder.typicode.com/posts", params=params, headers=headers)
print(response.json())
```

* **params** — параметры запроса, добавляются к URL.
* **headers** — заголовки HTTP, например для авторизации.

### Отправка POST-запроса

Для создания или отправки данных на сервер используется POST:

```python
payload = {"title": "Новая запись", "body": "Текст поста", "userId": 1}
response = requests.post("https://jsonplaceholder.typicode.com/posts", json=payload)

print(response.status_code)
print(response.json())
```

Использование `json=payload` автоматически преобразует словарь в JSON для отправки на сервер.

### Обработка ошибок и таймауты

```python
try:
    response = requests.get("https://jsonplaceholder.typicode.com/posts", timeout=5)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.HTTPError as errh:
    print("HTTP ошибка:", errh)
except requests.exceptions.ConnectionError as errc:
    print("Ошибка соединения:", errc)
except requests.exceptions.Timeout as errt:
    print("Таймаут:", errt)
except requests.exceptions.RequestException as err:
    print("Другая ошибка:", err)
```

* **timeout** — максимальное время ожидания ответа.
* **raise_for_status()** — выбрасывает исключение при HTTP-ошибке.

### Частые ошибки

* Отправка данных в неправильном формате (например, строка вместо JSON).
* Игнорирование статуса ответа сервера.
* Отсутствие обработки исключений при сетевых ошибках.
* Хранение токенов и ключей в коде вместо переменных окружения.

### Частозадаваемые вопросы

**Нужна ли установка requests в Python 3?**
Да, `requests` не встроена в стандартную библиотеку, её нужно установить через pip.

**Какие методы поддерживаются?**
GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD.

**Можно ли использовать авторизацию?**
Да, через заголовки или встроенный параметр `auth`.

**Что делать при большом объёме данных?**
Использовать потоковую обработку (`stream=True`) или пагинацию.

### Заключение

Библиотека `requests` в Python упрощает работу с HTTP-запросами, позволяет взаимодействовать с API и отправлять данные на сервер. Правильное использование параметров, заголовков, таймаутов и обработка ошибок делает интеграцию с внешними сервисами безопасной и надёжной.
Использование `requests` ускоряет разработку и делает код более читабельным. Для закрепления навыков работы с HTTP-запросами и изучения дополнительных возможностей Python рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak_otpravlyat_zaprosy_s_pomoschyu_requests_v_Python).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет сразу практиковаться с GET и POST-запросами, обработкой JSON и заголовков, а также понять структуру курса до полного изучения.
