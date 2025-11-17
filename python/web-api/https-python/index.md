---
metaTitle: Как выполнять HTTPS-запросы в Python
metaDescription: Руководство по выполнению HTTPS-запросов в Python, работа с библиотекой requests, обработка ответов и защита соединения через SSL/TLS.
author: Олег Марков
title: Как выполнять HTTPS-запросы в Python
preview: Изучаем выполнение HTTPS-запросов в Python с помощью библиотеки requests, обработку ответов и работу с защищёнными соединениями.
---

## Введение

HTTPS — это защищённая версия HTTP, которая использует протокол SSL/TLS для шифрования данных между клиентом и сервером. В Python выполнение HTTPS-запросов обычно осуществляется с помощью библиотеки `requests`, которая автоматически обрабатывает шифрование и сертификаты.
В этой статье мы разберём, как отправлять HTTPS-запросы, работать с сертификатами и обеспечивать безопасность соединений при интеграции с внешними API.

### Отправка базового HTTPS-запроса

Библиотека `requests` делает выполнение HTTPS-запросов простым:

```python
import requests

url = "https://jsonplaceholder.typicode.com/posts/1"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print("Ошибка:", response.status_code)
```

`requests` автоматически использует SSL/TLS для шифрования соединения, проверяет сертификаты и обеспечивает безопасное взаимодействие с сервером.

Для более глубокой работы с HTTPS-запросами, проверкой сертификатов и безопасной обработкой данных рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak_vypolnyat_HTTPS-zaprosy_v_Python).
Курс содержит 209 уроков и 34 упражнения, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника и еженедельные встречи с менторами.

### Работа с сертификатами

По умолчанию `requests` проверяет SSL-сертификаты сервера. Если сервер использует самоподписанный сертификат, нужно указать путь к нему:

```python
response = requests.get("https://example.com", verify="/path/to/cert.pem")
```

Для отключения проверки (не рекомендуется для продакшн):

```python
response = requests.get("https://example.com", verify=False)
```

### Отправка данных через POST

HTTPS-запросы могут включать отправку данных на сервер:

```python
payload = {"title": "Тест", "body": "Пример данных", "userId": 1}
response = requests.post("https://jsonplaceholder.typicode.com/posts", json=payload)

print(response.status_code)
print(response.json())
```

Использование `json=payload` гарантирует правильное преобразование словаря Python в JSON и безопасную отправку через HTTPS.

### Обработка ошибок и таймауты

При работе с HTTPS важно обрабатывать исключения и устанавливать таймаут:

```python
try:
    response = requests.get("https://jsonplaceholder.typicode.com/posts", timeout=5)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.SSLError as ssl_err:
    print("Ошибка SSL:", ssl_err)
except requests.exceptions.RequestException as err:
    print("Ошибка запроса:", err)
```

* **timeout** — максимальное время ожидания ответа.
* **raise_for_status()** — выбрасывает исключение при ошибке HTTP.
* **SSLError** — обработка проблем с сертификатами.

### Частые ошибки

* Игнорирование проверки сертификатов.
* Использование `verify=False` в продакшн-коде.
* Отправка данных в неправильном формате.
* Несоблюдение обработки исключений для HTTPS.

### Частозадаваемые вопросы

**Можно ли использовать HTTPS без дополнительных библиотек?**
Да, стандартная библиотека `requests` поддерживает HTTPS.

**Что делать при самоподписанном сертификате?**
Указать путь к файлу сертификата через параметр `verify`.

**Нужно ли устанавливать SSL/TLS отдельно?**
Нет, `requests` использует встроенные возможности Python для HTTPS.

**Как повысить безопасность при работе с API?**
Использовать переменные окружения для токенов, проверять сертификаты и обрабатывать исключения.

### Заключение

HTTPS-запросы позволяют безопасно обмениваться данными с внешними сервисами. Использование библиотеки `requests` упрощает шифрование, проверку сертификатов и обработку ответов.
Для закрепления навыков работы с HTTPS, параметрами запросов и безопасной интеграцией с API рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak_vypolnyat_HTTPS-zaprosy_v_Python).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет сразу практиковаться с отправкой HTTPS-запросов, обработкой JSON и сертификатов, а также понять структуру курса до полного изучения.
