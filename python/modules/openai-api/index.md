---
metaTitle: "Python и OpenAI API: полное руководство с примерами"
metaDescription: "Как использовать OpenAI API в Python: установка, аутентификация, chat completions, streaming, обработка ошибок. Практические примеры кода."
author: "Антон Ларичев"
title: "Python с OpenAI API: от установки до потоковых ответов"
preview: "Подробное руководство по работе с OpenAI API на Python: настройка, отправка запросов, потоковые ответы и работа с функциями."
---

## Введение

OpenAI API предоставляет доступ к языковым моделям GPT-4o, GPT-4 и другим прямо из вашего Python-кода. Вы можете строить чат-ботов, генераторы текста, системы вопросов-ответов и агентов, обрабатывающих данные.

В этой статье разберём весь цикл: от установки библиотеки до потоковой передачи ответов и вызова функций.

## Установка и настройка

Установите официальный SDK через pip:

```bash
pip install openai
```

Для управления переменными окружения удобно использовать `python-dotenv`:

```bash
pip install python-dotenv
```

Создайте файл `.env` в корне проекта и добавьте туда API-ключ:

```bash
OPENAI_API_KEY=sk-proj-...
```

Обязательно добавьте `.env` в `.gitignore`, чтобы случайно не опубликовать ключ.

## Инициализация клиента

С версии `openai>=1.0.0` библиотека использует объектно-ориентированный клиент вместо глобальных функций:

```python
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
```

Если переменная `OPENAI_API_KEY` установлена в окружении, можно создать клиент вообще без аргументов — SDK подберёт ключ автоматически:

```python
client = OpenAI()
```

## Первый запрос: Chat Completions

Основная точка входа — метод `client.chat.completions.create`. Он принимает список сообщений в формате `role` / `content`:

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Ты опытный Python-разработчик."},
        {"role": "user", "content": "Объясни разницу между list и tuple."},
    ],
)

print(response.choices[0].message.content)
```

Поля ответа:

- `response.choices` — список вариантов (обычно один при `n=1`).
- `response.choices[0].message.content` — текст ответа модели.
- `response.usage` — статистика токенов: `prompt_tokens`, `completion_tokens`, `total_tokens`.

```python
usage = response.usage
print(f"Токены: {usage.prompt_tokens} + {usage.completion_tokens} = {usage.total_tokens}")
```

## Роли сообщений

API поддерживает три роли:

| Роль | Назначение |
|------|------------|
| `system` | Задаёт контекст и поведение модели |
| `user` | Сообщения от пользователя |
| `assistant` | Ответы модели (для контекста диалога) |

Чтобы поддерживать многоходовой диалог, передавайте всю историю сообщений целиком:

```python
history = [
    {"role": "system", "content": "Ты лаконичный ассистент."},
]

def chat(user_message: str) -> str:
    history.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=history,
    )

    assistant_message = response.choices[0].message.content
    history.append({"role": "assistant", "content": assistant_message})
    return assistant_message

print(chat("Как называется главный файл в Python-проекте?"))
print(chat("А в чём разница с __init__.py?"))
```

Mодель видит всю переписку и может ссылаться на предыдущие ответы.

## Параметры запроса

### temperature

Контролирует случайность ответов. Значение `0` делает ответы детерминированными, `2` — максимально случайными. Для кода и фактов используйте `0–0.3`, для творческих задач — `0.7–1.2`:

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Напиши хайку про Python."}],
    temperature=1.0,
)
```

### max_tokens

Ограничивает длину ответа. Полезно для управления стоимостью и предотвращения слишком длинных ответов:

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Коротко: что такое декоратор?"}],
    max_tokens=150,
)
```

### top_p и presence_penalty

- `top_p` — альтернатива `temperature`, ограничивает выборку по вероятностной массе.
- `presence_penalty` (от `-2` до `2`) — штрафует за повторение уже упомянутых тем.
- `frequency_penalty` — штрафует за дословное повторение токенов.

## Потоковая передача ответов (Streaming)

По умолчанию API ждёт, пока модель сформирует весь ответ, и только потом возвращает его целиком. Для длинных ответов это означает долгое ожидание без обратной связи.

Параметр `stream=True` включает потоковый режим: текст приходит кусками по мере генерации:

```python
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Напиши функцию быстрой сортировки на Python с комментариями."}],
    stream=True,
)

for chunk in stream:
    delta = chunk.choices[0].delta
    if delta.content is not None:
        print(delta.content, end="", flush=True)

print()  # перевод строки после завершения
```

Каждый `chunk` содержит `delta` — фрагмент нового текста. Последний чанк придёт с `finish_reason="stop"` и пустым `delta.content`.

### Асинхронный стриминг

Для веб-приложений на `asyncio` или `FastAPI` используйте асинхронный клиент:

```python
import asyncio
from openai import AsyncOpenAI

async_client = AsyncOpenAI()

async def stream_response(prompt: str) -> None:
    stream = await async_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            print(delta.content, end="", flush=True)

    print()

asyncio.run(stream_response("Объясни GIL в Python простыми словами."))
```

## Вызов функций (Tool Calls)

Function calling позволяет модели вернуть структурированный вызов вашей функции вместо свободного текста. Это основа для создания агентов.

Опишите инструмент в формате JSON Schema:

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Получить текущую погоду в городе",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "Название города, например: Москва",
                    },
                    "units": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Единица измерения температуры",
                    },
                },
                "required": ["city"],
            },
        },
    }
]
```

Передайте инструменты в запрос:

```python
import json

messages = [{"role": "user", "content": "Какая погода в Москве?"}]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
)

assistant_message = response.choices[0].message

if assistant_message.tool_calls:
    tool_call = assistant_message.tool_calls[0]
    function_name = tool_call.function.name
    arguments = json.loads(tool_call.function.arguments)

    print(f"Модель вызывает: {function_name}({arguments})")
    # -> Модель вызывает: get_weather({'city': 'Москва', 'units': 'celsius'})
```

После выполнения реальной функции верните результат в историю и получите финальный ответ:

```python
# Имитация реального вызова
weather_result = {"temperature": 12, "condition": "облачно", "humidity": 75}

messages.append(assistant_message)  # ответ модели с tool_call
messages.append({
    "role": "tool",
    "tool_call_id": tool_call.id,
    "content": json.dumps(weather_result, ensure_ascii=False),
})

final_response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
)

print(final_response.choices[0].message.content)
# -> В Москве сейчас 12°C, облачно, влажность 75%.
```

## Обработка ошибок

SDK выбрасывает типизированные исключения из пространства `openai`:

```python
from openai import (
    OpenAI,
    AuthenticationError,
    RateLimitError,
    APIConnectionError,
    BadRequestError,
)
import time

client = OpenAI()

def safe_completion(messages: list, retries: int = 3) -> str | None:
    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
            )
            return response.choices[0].message.content

        except AuthenticationError:
            print("Неверный API-ключ. Проверьте OPENAI_API_KEY.")
            return None

        except RateLimitError:
            wait = 2 ** attempt  # экспоненциальный откат
            print(f"Превышен лимит запросов. Повтор через {wait}с...")
            time.sleep(wait)

        except APIConnectionError as e:
            print(f"Ошибка соединения: {e}")
            return None

        except BadRequestError as e:
            print(f"Неверный запрос: {e}")
            return None

    return None
```

Основные исключения:

| Исключение | Причина |
|------------|--------|
| `AuthenticationError` | Неверный или отозванный API-ключ |
| `RateLimitError` | Превышен лимит запросов или токенов |
| `APIConnectionError` | Проблема с сетью |
| `BadRequestError` | Неверные параметры запроса |
| `NotFoundError` | Несуществующая модель или ресурс |

## Подсчёт токенов заранее

Чтобы оценить стоимость до отправки запроса, используйте библиотеку `tiktoken`:

```bash
pip install tiktoken
```

```python
import tiktoken

def count_tokens(messages: list, model: str = "gpt-4o") -> int:
    encoding = tiktoken.encoding_for_model(model)
    total = 0
    for message in messages:
        total += 4  # служебные токены на сообщение
        for value in message.values():
            total += len(encoding.encode(value))
    total += 2  # токены завершения
    return total

messages = [
    {"role": "system", "content": "Ты помощник."},
    {"role": "user", "content": "Что такое замыкание в Python?"},
]

print(f"Токенов в запросе: {count_tokens(messages)}")
```

## Генерация изображений

OpenAI предоставляет доступ к DALL-E через тот же SDK:

```python
image_response = client.images.generate(
    model="dall-e-3",
    prompt="Пиксельный питон кодирует на ноутбуке, ретро-стиль",
    size="1024x1024",
    quality="standard",
    n=1,
)

image_url = image_response.data[0].url
print(image_url)
```

## Встраивания (Embeddings)

Embeddings превращают текст в векторное представление. Используются для семантического поиска и кластеризации:

```python
texts = [
    "Python — интерпретируемый язык",
    "JavaScript работает в браузере",
    "Питон используется в data science",
]

embedding_response = client.embeddings.create(
    model="text-embedding-3-small",
    input=texts,
)

vectors = [item.embedding for item in embedding_response.data]
print(f"Размерность вектора: {len(vectors[0])}")  # 1536
```

## Лучшие практики

**Никогда не хардкодьте ключ** — используйте переменные окружения или секрет-менеджеры (AWS Secrets Manager, HashiCorp Vault).

**Ограничивайте контекст** — хранить всю историю диалога дорого. Обрезайте историю до последних N сообщений или суммаризируйте старые.

**Кэшируйте одинаковые запросы** — если промпт не меняется (например, классификатор категорий), кэшируйте результаты в Redis или in-memory словаре.

**Логируйте токены** — `response.usage` показывает реальный расход. Собирайте эту метрику, чтобы контролировать затраты.

**Используйте `seed`** — для воспроизводимых результатов при тестировании передайте фиксированный `seed`:

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Случайное число от 1 до 10"}],
    seed=42,
)
```

## Полный пример: консольный чат-бот

```python
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI()

SYSTEM_PROMPT = "Ты опытный Python-разработчик. Отвечай кратко и по делу."

def main():
    history = [{"role": "system", "content": SYSTEM_PROMPT}]
    print("Чат-бот Python-ассистент. Введите 'выход' для завершения.\n")

    while True:
        user_input = input("Вы: ").strip()
        if user_input.lower() in ("выход", "exit", "quit"):
            break
        if not user_input:
            continue

        history.append({"role": "user", "content": user_input})

        print("Ассистент: ", end="", flush=True)
        full_response = ""

        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=history,
            stream=True,
            temperature=0.3,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                print(delta.content, end="", flush=True)
                full_response += delta.content

        print("\n")
        history.append({"role": "assistant", "content": full_response})

if __name__ == "__main__":
    main()
```

Запустите скрипт и получите полноценный интерактивный ассистент с памятью диалога и потоковым выводом.

## Итоги

OpenAI API в связке с Python открывает широкий спектр задач: от простых генераторов текста до сложных агентов с инструментами. Ключевые точки:

- `client.chat.completions.create` — основной метод для работы с GPT-моделями.
- `stream=True` делает UX отзывчивым при длинных ответах.
- Tool calls позволяют модели вызывать ваши функции и работать с внешними данными.
- Правильная обработка ошибок и кэширование критичны для продакшн-систем.

Чтобы углубить знания Python и научиться строить современные AI-приложения, посмотрите курс на PurpleSchool:

[Курс по Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-openai-api)