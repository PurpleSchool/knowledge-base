---
metaTitle: "Python httpx: современный HTTP-клиент с поддержкой async"
metaDescription: "Разбираем библиотеку Python httpx — синхронные и асинхронные запросы, сессии, таймауты, обработка ошибок и HTTP/2 с примерами кода."
author: "Антон Ларичев"
title: "Python httpx: современный HTTP-клиент"
preview: "Полный разбор библиотеки httpx: установка, sync и async запросы, сессии, аутентификация, таймауты и обработка ошибок."
---

## Что такое httpx

`httpx` — это полнофункциональный HTTP-клиент для Python, поддерживающий как синхронный, так и асинхронный режимы работы. Библиотека создана как современная замена `requests` с нативной поддержкой `async/await`, HTTP/2 и стриминга ответов.

Главные преимущества перед `requests`:

- встроенная поддержка `asyncio` без дополнительных адаптеров;
- поддержка HTTP/2;
- единый API для sync и async кода;
- строгие таймауты по умолчанию;
- поддержка стриминга запросов и ответов.

## Установка

Установка базовой версии:

```bash
pip install httpx
```

Для поддержки HTTP/2 нужен дополнительный пакет:

```bash
pip install httpx[http2]
```

Для асинхронной работы дополнительных зависимостей не требуется — поддержка `asyncio` включена по умолчанию.

## Синхронные запросы

Синхронный API `httpx` практически идентичен `requests`, что упрощает миграцию.

### GET-запрос

```python
import httpx

response = httpx.get("https://httpbin.org/get")

print(response.status_code)   # 200
print(response.headers["content-type"])  # application/json
print(response.json())        # словарь с данными ответа
```

### Передача параметров запроса

```python
import httpx

params = {"page": 1, "limit": 10, "search": "python"}
response = httpx.get("https://api.example.com/articles", params=params)

# URL будет: https://api.example.com/articles?page=1&limit=10&search=python
print(response.url)
```

### POST-запрос с JSON

```python
import httpx

data = {"username": "ivan", "email": "ivan@example.com"}
response = httpx.post("https://api.example.com/users", json=data)

print(response.status_code)  # 201
print(response.json())
```

### Отправка form-данных

```python
import httpx

form_data = {"username": "ivan", "password": "secret"}
response = httpx.post("https://api.example.com/login", data=form_data)
```

### Загрузка файлов

```python
import httpx

with open("photo.jpg", "rb") as f:
    files = {"file": ("photo.jpg", f, "image/jpeg")}
    response = httpx.post("https://api.example.com/upload", files=files)

print(response.json())
```

## Асинхронные запросы

Для асинхронной работы используется `httpx.AsyncClient`. Это ключевое отличие от `requests`, где для async нужны сторонние библиотеки вроде `aiohttp`.

### Простой асинхронный запрос

```python
import asyncio
import httpx

async def fetch_data():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://httpbin.org/get")
        return response.json()

result = asyncio.run(fetch_data())
print(result)
```

### Параллельные запросы

Главное преимущество async — возможность выполнять несколько запросов одновременно:

```python
import asyncio
import httpx

async def fetch_all(urls: list[str]) -> list[dict]:
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
        return [r.json() for r in responses]

urls = [
    "https://httpbin.org/get",
    "https://httpbin.org/ip",
    "https://httpbin.org/uuid",
]

results = asyncio.run(fetch_all(urls))
for result in results:
    print(result)
```

При последовательных запросах к трём URL каждый ждёт завершения предыдущего. При параллельном выполнении через `asyncio.gather` все три запроса отправляются одновременно, что значительно ускоряет работу.

## Клиентские сессии

Для нескольких запросов к одному серверу лучше использовать сессию (`Client` или `AsyncClient`). Сессия переиспользует TCP-соединения и хранит общие настройки.

### Синхронная сессия

```python
import httpx

with httpx.Client(base_url="https://api.example.com") as client:
    users = client.get("/users").json()
    posts = client.get("/posts").json()
    comments = client.get("/comments").json()
```

Параметр `base_url` позволяет указывать только пути в последующих запросах.

### Асинхронная сессия

```python
import asyncio
import httpx

async def fetch_resources():
    async with httpx.AsyncClient(base_url="https://api.example.com") as client:
        users = (await client.get("/users")).json()
        posts = (await client.get("/posts")).json()
        return {"users": users, "posts": posts}

result = asyncio.run(fetch_resources())
```

### Общие заголовки для сессии

```python
import httpx

headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "Accept": "application/json",
    "X-App-Version": "2.1.0",
}

with httpx.Client(base_url="https://api.example.com", headers=headers) as client:
    # Authorization будет в каждом запросе автоматически
    profile = client.get("/me").json()
    orders = client.get("/orders").json()
```

## Аутентификация

`httpx` поддерживает несколько встроенных схем аутентификации.

### Basic Auth

```python
import httpx

response = httpx.get(
    "https://api.example.com/protected",
    auth=("username", "password")
)
```

### Bearer Token

```python
import httpx

class BearerAuth(httpx.Auth):
    def __init__(self, token: str):
        self.token = token

    def auth_flow(self, request):
        request.headers["Authorization"] = f"Bearer {self.token}"
        yield request

auth = BearerAuth("my-secret-token")

with httpx.Client(auth=auth, base_url="https://api.example.com") as client:
    response = client.get("/protected")
```

## Таймауты

В отличие от `requests`, где таймаут по умолчанию отсутствует, `httpx` устанавливает таймаут 5 секунд из коробки. Это защищает от зависших соединений.

### Настройка таймаутов

```python
import httpx

# Единый таймаут для всех фаз
response = httpx.get("https://api.example.com/data", timeout=10.0)

# Отдельные таймауты для каждой фазы
timeout = httpx.Timeout(
    connect=5.0,   # установка соединения
    read=30.0,     # чтение ответа
    write=10.0,    # отправка тела запроса
    pool=5.0,      # ожидание свободного соединения из пула
)

with httpx.Client(timeout=timeout) as client:
    response = client.get("https://api.example.com/large-file")
```

### Отключение таймаута

```python
import httpx

# Только если вы уверены, что сервер ответит
response = httpx.get("https://api.example.com/export", timeout=None)
```

## Обработка ошибок

В `httpx` HTTP-статусы 4xx и 5xx не вызывают исключение автоматически. Нужно явно вызвать `raise_for_status()` или проверять код вручную.

### Проверка статуса

```python
import httpx

try:
    response = httpx.get("https://api.example.com/resource/999")
    response.raise_for_status()  # вызовет исключение при 4xx/5xx
    data = response.json()
except httpx.HTTPStatusError as e:
    print(f"HTTP ошибка: {e.response.status_code}")
    print(f"URL: {e.request.url}")
except httpx.RequestError as e:
    print(f"Ошибка сети: {e}")
```

### Иерархия исключений

```python
import httpx

try:
    response = httpx.get("https://api.example.com/data", timeout=5.0)
    response.raise_for_status()
except httpx.TimeoutException:
    print("Превышено время ожидания")
except httpx.ConnectError:
    print("Не удалось подключиться к серверу")
except httpx.HTTPStatusError as e:
    if e.response.status_code == 401:
        print("Требуется аутентификация")
    elif e.response.status_code == 404:
        print("Ресурс не найден")
    elif e.response.status_code >= 500:
        print("Ошибка сервера")
except httpx.RequestError as e:
    print(f"Ошибка запроса: {type(e).__name__}: {e}")
```

## Стриминг ответов

При загрузке больших файлов или работе с Server-Sent Events удобно использовать стриминг.

### Стриминг тела ответа

```python
import httpx

with httpx.stream("GET", "https://example.com/large-file.zip") as response:
    response.raise_for_status()
    with open("large-file.zip", "wb") as f:
        for chunk in response.iter_bytes(chunk_size=8192):
            f.write(chunk)
```

### Стриминг текстовых данных

```python
import httpx

with httpx.stream("GET", "https://api.example.com/stream") as response:
    for line in response.iter_lines():
        print(line)
```

### Асинхронный стриминг

```python
import asyncio
import httpx

async def download_file(url: str, path: str):
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            with open(path, "wb") as f:
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    f.write(chunk)

asyncio.run(download_file("https://example.com/file.zip", "file.zip"))
```

## Работа с ответом

```python
import httpx

response = httpx.get("https://httpbin.org/get")

# Статус
print(response.status_code)    # 200
print(response.is_success)     # True (2xx)
print(response.is_error)       # False
print(response.is_redirect)    # False

# Заголовки
print(response.headers["content-type"])
print(dict(response.headers))

# Тело ответа
print(response.text)           # строка
print(response.content)        # bytes
print(response.json())         # dict/list (если JSON)

# Метаданные запроса
print(response.url)            # итоговый URL (после редиректов)
print(response.elapsed)        # время выполнения запроса
print(response.http_version)   # "HTTP/1.1" или "HTTP/2"
```

## Использование в FastAPI

Один из распространённых сценариев — использование `httpx.AsyncClient` внутри FastAPI-приложения для обращения к сторонним API:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(
        base_url="https://api.example.com",
        timeout=10.0,
    )
    yield
    await app.state.http_client.aclose()

app = FastAPI(lifespan=lifespan)

@app.get("/users/{user_id}")
async def get_user(user_id: int, request):
    client: httpx.AsyncClient = request.app.state.http_client
    response = await client.get(f"/users/{user_id}")
    response.raise_for_status()
    return response.json()
```

Создание клиента через `lifespan` гарантирует, что одно соединение переиспользуется для всех запросов приложения.

## Тестирование с MockTransport

`httpx` предоставляет встроенные инструменты для мокирования запросов в тестах без реальных HTTP-соединений:

```python
import httpx

def mock_handler(request: httpx.Request) -> httpx.Response:
    if request.url.path == "/users/1":
        return httpx.Response(
            200,
            json={"id": 1, "name": "Иван", "email": "ivan@example.com"}
        )
    return httpx.Response(404, json={"error": "not found"})

transport = httpx.MockTransport(handler=mock_handler)

with httpx.Client(transport=transport) as client:
    response = client.get("https://api.example.com/users/1")
    print(response.json())  # {"id": 1, "name": "Иван", ...}

    response = client.get("https://api.example.com/users/999")
    print(response.status_code)  # 404
```

Это особенно удобно при unit-тестировании сервисов, которые делают HTTP-запросы.

## Итоги

`httpx` — зрелая библиотека, которая решает главные ограничения `requests`:

- поддержка `async/await` без смены API;
- строгие таймауты по умолчанию;
- HTTP/2 из коробки;
- встроенные инструменты для тестирования.

Для новых проектов на Python, особенно использующих FastAPI или другие async-фреймворки, `httpx` является предпочтительным HTTP-клиентом.

Чтобы глубже разобраться с асинхронным программированием в Python и научиться строить production-ready приложения, посмотрите курс по Python на PurpleSchool: [Python-разработчик](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-httpx).