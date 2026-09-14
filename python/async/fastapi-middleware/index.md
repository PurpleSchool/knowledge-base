---
metaTitle: "FastAPI Middleware: обработка запросов и ответов"
metaDescription: "Как работает middleware в FastAPI: создание кастомного middleware, обработка запросов и ответов, логирование, аутентификация и CORS."
author: "Антон Ларичев"
title: "FastAPI middleware и обработка запросов"
preview: "Разбираем механизм middleware в FastAPI: жизненный цикл запроса, встроенные и кастомные middleware, практические примеры логирования и аутентификации."
---

## Что такое middleware в FastAPI

Middleware — это компонент, который перехватывает каждый входящий HTTP-запрос до того, как он достигнет обработчика маршрута, и каждый исходящий ответ до того, как он будет отправлен клиенту. Это классический паттерн «цепочки обязанностей» (Chain of Responsibility).

FastAPI строится поверх Starlette, поэтому middleware работает на уровне ASGI-приложения. Каждый middleware получает объект запроса и функцию `call_next`, которая передаёт управление следующему звену в цепочке.

Типичные задачи middleware:

- логирование запросов и времени их выполнения
- аутентификация и авторизация
- добавление заголовков к ответам
- обработка CORS
- сжатие ответов
- ограничение частоты запросов (rate limiting)

## Жизненный цикл запроса

Прежде чем писать middleware, важно понять порядок его выполнения. Middleware выполняются в порядке, обратном порядку их добавления — первый добавленный middleware выполняется последним при входе и первым при выходе.

```
Клиент → Middleware N → ... → Middleware 2 → Middleware 1 → Router → Handler
Клиент ← Middleware N ← ... ← Middleware 2 ← Middleware 1 ← Router ← Handler
```

```python
from fastapi import FastAPI
from starlette.requests import Request
from starlette.responses import Response

app = FastAPI()

@app.middleware("http")
async def middleware_one(request: Request, call_next):
    print("Middleware 1: до обработки")
    response = await call_next(request)
    print("Middleware 1: после обработки")
    return response

@app.middleware("http")
async def middleware_two(request: Request, call_next):
    print("Middleware 2: до обработки")
    response = await call_next(request)
    print("Middleware 2: после обработки")
    return response
```

При запросе вывод будет следующим:

```
Middleware 2: до обработки
Middleware 1: до обработки
Middleware 1: после обработки
Middleware 2: после обработки
```

## Встроенные middleware Starlette и FastAPI

FastAPI предоставляет ряд готовых middleware через метод `add_middleware`.

### CORS Middleware

Cross-Origin Resource Sharing необходим при работе с браузерными клиентами на другом домене:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com", "https://app.example.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

Для разработки можно разрешить все источники, но в продакшне всегда указывайте конкретный список.

### GZip Middleware

Автоматически сжимает ответы, превышающие минимальный размер:

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### TrustedHost Middleware

Защищает от атак через заголовок Host:

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["example.com", "*.example.com"],
)
```

### HTTPSRedirect Middleware

Перенаправляет HTTP-запросы на HTTPS:

```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(HTTPSRedirectMiddleware)
```

## Создание кастомного middleware через декоратор

Простейший способ добавить middleware — декоратор `@app.middleware("http")`.

### Middleware для логирования

```python
import time
import logging
from fastapi import FastAPI, Request

app = FastAPI()
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    
    logger.info(
        "Входящий запрос",
        extra={
            "method": request.method,
            "url": str(request.url),
            "client": request.client.host if request.client else "unknown",
        },
    )
    
    response = await call_next(request)
    
    duration = time.perf_counter() - start_time
    logger.info(
        "Исходящий ответ",
        extra={
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
        },
    )
    
    response.headers["X-Process-Time"] = str(round(duration * 1000, 2))
    return response
```

### Middleware для добавления заголовков безопасности

```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

## Создание middleware через класс BaseHTTPMiddleware

Для более сложной логики удобнее использовать класс, наследующий от `BaseHTTPMiddleware` из Starlette. Это позволяет инкапсулировать конфигурацию и состояние.

### Middleware аутентификации по API-ключу

```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import FastAPI

API_KEY_HEADER = "X-API-Key"
VALID_API_KEYS = {"secret-key-1", "secret-key-2"}
PUBLIC_PATHS = {"/docs", "/openapi.json", "/redoc", "/health"}

class APIKeyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, api_keys: set[str], public_paths: set[str]):
        super().__init__(app)
        self.api_keys = api_keys
        self.public_paths = public_paths
    
    async def dispatch(self, request, call_next):
        if request.url.path in self.public_paths:
            return await call_next(request)
        
        api_key = request.headers.get(API_KEY_HEADER)
        
        if not api_key or api_key not in self.api_keys:
            return JSONResponse(
                status_code=401,
                content={"detail": "Недействительный или отсутствующий API-ключ"},
            )
        
        return await call_next(request)

app = FastAPI()
app.add_middleware(
    APIKeyMiddleware,
    api_keys=VALID_API_KEYS,
    public_paths=PUBLIC_PATHS,
)
```

### Middleware ограничения частоты запросов

```python
import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)
    
    def _get_client_key(self, request) -> str:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    async def dispatch(self, request, call_next):
        client_key = self._get_client_key(request)
        now = time.monotonic()
        window_start = now - self.window_seconds
        
        self._requests[client_key] = [
            ts for ts in self._requests[client_key] if ts > window_start
        ]
        
        if len(self._requests[client_key]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Превышен лимит запросов"},
                headers={"Retry-After": str(self.window_seconds)},
            )
        
        self._requests[client_key].append(now)
        return await call_next(request)
```

> Для продакшна вместо хранения в памяти используйте Redis — это обеспечит корректную работу при нескольких инстансах приложения.

## Доступ к телу запроса в middleware

Чтение тела запроса в middleware требует осторожности: тело запроса — это поток, который можно прочитать только один раз. После чтения в middleware обработчик маршрута получит пустое тело.

Чтобы этого избежать, нужно сохранить тело и восстановить поток:

```python
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import Headers
from starlette.types import Message

class RequestBodyLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        body_bytes = await request.body()
        
        async def receive() -> Message:
            return {"type": "http.request", "body": body_bytes, "more_body": False}
        
        request._receive = receive
        
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type and body_bytes:
            try:
                body_data = json.loads(body_bytes)
                print(f"Тело запроса: {body_data}")
            except json.JSONDecodeError:
                pass
        
        return await call_next(request)
```

## Передача данных между middleware и обработчиком

Для передачи данных, вычисленных в middleware, в обработчики маршрутов используется объект `request.state`:

```python
import uuid
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def inject_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

@app.get("/items/{item_id}")
async def get_item(item_id: int, request: Request):
    request_id = request.state.request_id
    return {"item_id": item_id, "request_id": request_id}
```

`request.state` — это простой объект-хранилище, в который можно записывать произвольные атрибуты. Это стандартный способ передать данные из middleware в обработчик без изменения сигнатур функций.

## Обработка исключений в middleware

Middleware позволяет перехватывать исключения на глобальном уровне и формировать единообразные ответы об ошибках:

```python
import traceback
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            return await call_next(request)
        except ValueError as exc:
            return JSONResponse(
                status_code=400,
                content={"detail": f"Неверные данные: {str(exc)}"},
            )
        except PermissionError as exc:
            return JSONResponse(
                status_code=403,
                content={"detail": f"Доступ запрещён: {str(exc)}"},
            )
        except Exception as exc:
            traceback.print_exc()
            return JSONResponse(
                status_code=500,
                content={"detail": "Внутренняя ошибка сервера"},
            )
```

> Для большинства задач обработки исключений в FastAPI предпочтительнее использовать `app.exception_handler` — он интегрируется с системой валидации Pydantic и обработчиками HTTPException. Middleware для исключений имеет смысл, когда нужно перехватывать низкоуровневые ошибки, не дошедшие до FastAPI.

## Порядок добавления middleware и его влияние

Порядок вызова `add_middleware` критически важен. Рассмотрим практический пример:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

# Добавляем в таком порядке:
app.add_middleware(ErrorHandlingMiddleware)       # выполнится последним при входе
app.add_middleware(APIKeyMiddleware, ...)         # выполнится вторым при входе  
app.add_middleware(CORSMiddleware, ...)           # выполнится первым при входе
```

При входящем запросе порядок будет: `CORSMiddleware → APIKeyMiddleware → ErrorHandlingMiddleware → Handler`.

Это означает, что CORS-заголовки будут добавляться даже к ответам об ошибках аутентификации — что правильно, иначе браузер не сможет прочитать ответ 401.

## Middleware против Dependency Injection

FastAPI предоставляет два механизма для сквозной логики: middleware и зависимости (Depends). Важно понимать, когда применять каждый из них.

Middleware подходит для:
- логики, применяемой ко всем маршрутам без исключения
- операций с сырым HTTP (заголовки, тело запроса на уровне байт)
- операций, выполняемых до маршрутизации

Dependency Injection подходит для:
- логики, применяемой к части маршрутов
- операций, требующих типизированных параметров FastAPI
- логики с доступом к базе данных через сессию запроса

```python
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    if token != "valid-token":
        raise HTTPException(status_code=401, detail="Недействительный токен")
    return token

@app.get("/protected", dependencies=[Depends(verify_token)])
async def protected_route():
    return {"status": "доступ разрешён"}
```

Для аутентификации предпочтительнее использовать зависимости — они интегрируются с документацией OpenAPI и позволяют применять логику только к нужным маршрутам.

## Практический пример: полноценное приложение

Соберём все концепции вместе в реалистичном приложении:

```python
import time
import uuid
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Production API")

class RequestTracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        request.state.start_time = time.perf_counter()
        
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"от {request.client.host if request.client else 'unknown'}"
        )
        
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(f"[{request_id}] Необработанное исключение: {exc}")
            return JSONResponse(status_code=500, content={"detail": "Внутренняя ошибка"})
        
        duration_ms = round((time.perf_counter() - request.state.start_time) * 1000, 2)
        logger.info(f"[{request_id}] Ответ {response.status_code} за {duration_ms}мс")
        
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(duration_ms)
        return response

# Порядок важен: GZip → CORS → Tracing → Handler
app.add_middleware(RequestTracingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend.example.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/users/{user_id}")
async def get_user(user_id: int, request: Request):
    return {
        "user_id": user_id,
        "request_id": request.state.request_id,
    }
```

## Тестирование middleware

Middleware можно тестировать через стандартный `TestClient` из Starlette:

```python
from fastapi.testclient import TestClient

client = TestClient(app)

def test_request_id_header_added():
    response = client.get("/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time" in response.headers

def test_custom_request_id_preserved():
    custom_id = "my-custom-id-123"
    response = client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.headers["X-Request-ID"] == custom_id
```

## Итоги

Middleware в FastAPI — мощный инструмент для реализации сквозной логики, не зависящей от конкретных маршрутов. Ключевые моменты:

- Middleware добавляются в порядке LIFO: первый добавленный обрабатывает запрос последним.
- `@app.middleware("http")` — быстрый способ для простой логики; `BaseHTTPMiddleware` — для конфигурируемых компонентов.
- `request.state` — стандартный способ передачи данных из middleware в обработчики.
- Тело запроса — поток; при чтении в middleware необходимо восстанавливать его для последующих обработчиков.
- Для логики, применяемой к части маршрутов, предпочтительнее использовать Dependency Injection.

Чтобы глубже освоить FastAPI и разработку на Python, пройдите курс на PurpleSchool: https://purpleschool.ru/course/fastapi?utm_source=knowledgebase&utm_medium=text&utm_campaign=fastapi-middleware