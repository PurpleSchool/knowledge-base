---
metaTitle: Библиотека aiohttp в Python — асинхронные HTTP-запросы
metaDescription: Разбираем библиотеку aiohttp для асинхронных HTTP-запросов в Python — GET, POST, сессии, обработка ответов и параллельные запросы.
author: Антон Ларичев
title: Библиотека aiohttp в Python — асинхронные HTTP-запросы
preview: Изучаем aiohttp для выполнения асинхронных HTTP-запросов в Python — работа с сессиями, отправка GET и POST запросов, параллельные вызовы.
---

## Введение

Библиотека `aiohttp` — это основной инструмент для выполнения асинхронных HTTP-запросов в Python. В отличие от синхронной `requests`, `aiohttp` работает поверх `asyncio` и позволяет отправлять сотни запросов одновременно, не блокируя событийный цикл. Это критично для приложений, которые обращаются к множеству внешних API, парсят веб-страницы или строят микросервисную архитектуру.

В этой статье мы разберём установку `aiohttp`, работу с клиентскими сессиями, отправку различных типов запросов и организацию параллельных вызовов.

### Установка aiohttp

Для начала работы установите библиотеку через pip:

```bash
pip install aiohttp
```

Для работы с асинхронными потоками данных рекомендуется также установить `aiofiles`:

```bash
pip install aiofiles
```

### Клиентская сессия — основа работы

В `aiohttp` все запросы выполняются через объект `ClientSession`. Сессия управляет пулом соединений, cookies и заголовками. Важно использовать сессию как контекстный менеджер, чтобы соединения корректно закрывались.

```python
import aiohttp
import asyncio

async def main():
    # Создаём сессию как контекстный менеджер
    async with aiohttp.ClientSession() as sessiya:
        async with sessiya.get("https://jsonplaceholder.typicode.com/posts/1") as otvet:
            # Получаем статус ответа
            print(f"Статус: {otvet.status}")
            # Читаем JSON-ответ
            dannye = await otvet.json()
            print(f"Заголовок: {dannye['title']}")

asyncio.run(main())
```

Не создавайте новую сессию для каждого запроса — это неэффективно. Одна сессия может обслуживать множество запросов, переиспользуя TCP-соединения.

### GET-запросы

GET-запрос — самый распространённый тип запроса для получения данных:

```python
import aiohttp
import asyncio

async def poluchit_polzovatelya(sessiya, user_id):
    url = f"https://jsonplaceholder.typicode.com/users/{user_id}"
    async with sessiya.get(url) as otvet:
        if otvet.status == 200:
            dannye = await otvet.json()
            return dannye
        else:
            print(f"Ошибка: {otvet.status}")
            return None

async def main():
    async with aiohttp.ClientSession() as sessiya:
        # Получаем данные пользователя
        polzovatel = await poluchit_polzovatelya(sessiya, 1)
        if polzovatel:
            print(f"Имя: {polzovatel['name']}")
            print(f"Email: {polzovatel['email']}")

asyncio.run(main())
```

Для передачи параметров запроса используйте аргумент `params`:

```python
import aiohttp
import asyncio

async def poisk(sessiya, zapros, limit=10):
    params = {"q": zapros, "limit": limit}
    async with sessiya.get("https://api.example.com/search", params=params) as otvet:
        return await otvet.json()

async def main():
    async with aiohttp.ClientSession() as sessiya:
        rezultat = await poisk(sessiya, "python asyncio", limit=5)
        print(rezultat)

asyncio.run(main())
```

### POST-запросы

Для отправки данных на сервер используются POST-запросы. `aiohttp` поддерживает отправку JSON, форм и файлов:

```python
import aiohttp
import asyncio

async def sozdat_post(sessiya, zagolovok, tekst, avtor_id):
    # Отправка JSON-данных
    dannye = {
        "title": zagolovok,
        "body": tekst,
        "userId": avtor_id,
    }
    async with sessiya.post(
        "https://jsonplaceholder.typicode.com/posts",
        json=dannye,  # Автоматически сериализует в JSON
    ) as otvet:
        rezultat = await otvet.json()
        print(f"Создан пост с ID: {rezultat['id']}")
        return rezultat

async def main():
    async with aiohttp.ClientSession() as sessiya:
        noviy_post = await sozdat_post(
            sessiya,
            "Асинхронный Python",
            "Статья про aiohttp и asyncio",
            1,
        )
        print(noviy_post)

asyncio.run(main())
```

Если вы хотите глубже разобраться в асинхронных паттернах и научиться строить полноценные приложения на Python — приходите на наш большой курс [Продвинутый Python](https://purpleschool.ru/course/python-advanced?utm_source=knowledgebase&utm_medium=article&utm_campaign=aiohttp-python).
На курсе 171 урок и 22 упражнения, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Заголовки и авторизация

Для работы с API часто требуется передавать токены и пользовательские заголовки:

```python
import aiohttp
import asyncio

async def main():
    # Заголовки для всей сессии
    zagolovki = {
        "Authorization": "Bearer my_token_123",
        "Content-Type": "application/json",
    }

    async with aiohttp.ClientSession(headers=zagolovki) as sessiya:
        # Все запросы в этой сессии будут использовать эти заголовки
        async with sessiya.get("https://api.example.com/profile") as otvet:
            print(await otvet.json())

        # Можно переопределить заголовки для конкретного запроса
        async with sessiya.get(
            "https://api.example.com/data",
            headers={"X-Custom-Header": "значение"},
        ) as otvet:
            print(await otvet.json())

asyncio.run(main())
```

### Параллельные запросы

Главное преимущество `aiohttp` — возможность выполнять множество запросов одновременно:

```python
import aiohttp
import asyncio
import time

async def zagruzit_stranicu(sessiya, url):
    async with sessiya.get(url) as otvet:
        tekst = await otvet.text()
        return f"{url}: {len(tekst)} символов"

async def main():
    urls = [
        "https://jsonplaceholder.typicode.com/posts/1",
        "https://jsonplaceholder.typicode.com/posts/2",
        "https://jsonplaceholder.typicode.com/posts/3",
        "https://jsonplaceholder.typicode.com/users/1",
        "https://jsonplaceholder.typicode.com/users/2",
    ]

    nachalo = time.time()

    async with aiohttp.ClientSession() as sessiya:
        # Запускаем все запросы параллельно
        zadachi = [zagruzit_stranicu(sessiya, url) for url in urls]
        rezultaty = await asyncio.gather(*zadachi)

        for rezultat in rezultaty:
            print(rezultat)

    print(f"Время выполнения: {time.time() - nachalo:.2f} сек")

asyncio.run(main())
```

### Ограничение количества одновременных запросов

При работе с большим количеством URL важно ограничивать число одновременных соединений, чтобы не перегрузить сервер:

```python
import aiohttp
import asyncio

async def zagruzit_s_limitom(sessiya, semafor, url):
    async with semafor:
        # Семафор ограничивает число одновременных запросов
        async with sessiya.get(url) as otvet:
            dannye = await otvet.text()
            print(f"Загружено {url}: {len(dannye)} символов")
            return dannye

async def main():
    urls = [f"https://jsonplaceholder.typicode.com/posts/{i}" for i in range(1, 21)]

    # Ограничиваем до 5 одновременных запросов
    semafor = asyncio.Semaphore(5)

    # Также можно ограничить через TCPConnector
    konektor = aiohttp.TCPConnector(limit=10)

    async with aiohttp.ClientSession(connector=konektor) as sessiya:
        zadachi = [zagruzit_s_limitom(sessiya, semafor, url) for url in urls]
        rezultaty = await asyncio.gather(*zadachi)
        print(f"Загружено {len(rezultaty)} страниц")

asyncio.run(main())
```

### Обработка ошибок и таймауты

В реальных приложениях сетевые запросы могут завершаться ошибками. Важно правильно их обрабатывать:

```python
import aiohttp
import asyncio

async def nadejniy_zapros(sessiya, url, popytki=3):
    # Устанавливаем таймаут для запроса
    timeout = aiohttp.ClientTimeout(total=10)

    for popytka in range(popytki):
        try:
            async with sessiya.get(url, timeout=timeout) as otvet:
                otvet.raise_for_status()  # Выбросит исключение при 4xx/5xx
                return await otvet.json()
        except aiohttp.ClientResponseError as e:
            print(f"Ошибка HTTP {e.status} для {url}")
            if e.status >= 500 and popytka < popytki - 1:
                # Повторяем при серверных ошибках
                await asyncio.sleep(2 ** popytka)
                continue
            raise
        except asyncio.TimeoutError:
            print(f"Таймаут для {url}, попытка {popytka + 1}/{popytki}")
            if popytka < popytki - 1:
                await asyncio.sleep(1)
                continue
            raise
        except aiohttp.ClientError as e:
            print(f"Ошибка соединения: {e}")
            raise

    return None

async def main():
    async with aiohttp.ClientSession() as sessiya:
        try:
            dannye = await nadejniy_zapros(sessiya, "https://jsonplaceholder.typicode.com/posts/1")
            print(f"Получено: {dannye['title']}")
        except Exception as e:
            print(f"Не удалось получить данные: {e}")

asyncio.run(main())
```

### Частые ошибки

* **Создание новой сессии на каждый запрос** — это расточительно и медленно. Создавайте одну `ClientSession` и переиспользуйте её для всех запросов.
* **Забыть закрыть сессию** — незакрытая сессия вызовет предупреждение `Unclosed client session`. Всегда используйте `async with` для автоматического закрытия.
* **Не ограничивать параллельные запросы** — запуск тысяч запросов одновременно может привести к исчерпанию ресурсов или блокировке со стороны сервера. Используйте `Semaphore` или `TCPConnector(limit=N)`.
* **Чтение тела ответа после закрытия контекста** — тело ответа доступно только внутри `async with sessiya.get(...) as otvet`. После выхода из блока данные недоступны.

### Частозадаваемые вопросы

**Чем aiohttp лучше requests?**
`requests` — синхронная библиотека, которая блокирует поток при каждом запросе. `aiohttp` работает асинхронно, что позволяет выполнять сотни запросов параллельно в одном потоке. Для одиночных запросов `requests` проще, для массовых — `aiohttp` значительно быстрее.

**Можно ли использовать aiohttp вместе с requests в одном проекте?**
Да, но не смешивайте их в одном контексте. Используйте `aiohttp` для асинхронных операций и `requests` для синхронных скриптов. Если нужно вызвать синхронную функцию из асинхронного кода, используйте `asyncio.to_thread()`.

**Как отправить файл через aiohttp?**
Используйте `FormData` для отправки multipart-форм с файлами: создайте объект `aiohttp.FormData()`, добавьте файл через метод `add_field()` и передайте в аргумент `data` метода `post()`.

### Заключение

Библиотека `aiohttp` — незаменимый инструмент для асинхронных HTTP-запросов в Python. Клиентские сессии, параллельные запросы через `asyncio.gather()`, контроль через семафоры и обработка ошибок с повторными попытками — всё это позволяет строить надёжные и быстрые сетевые приложения. Для закрепления навыков работы с асинхронными запросами и построения реальных проектов рекомендуем курс [Продвинутый Python](https://purpleschool.ru/course/python-advanced?utm_source=knowledgebase&utm_medium=article&utm_campaign=aiohttp-python).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет познакомиться с асинхронными паттернами и понять структуру курса до покупки полного доступа.
