---
metaTitle: "Pydantic AI: создание AI-агентов на Python"
metaDescription: "Как создавать AI-агентов на Python с помощью Pydantic AI: инструменты, структурированный вывод, зависимости и асинхронная работа."
author: "Антон Ларичев"
title: "Pydantic AI: создание AI-агентов на Python"
preview: "Практическое руководство по созданию AI-агентов с Pydantic AI: инструменты, структурированный вывод, dependency injection и async."
---

## Что такое Pydantic AI

Pydantic AI — это Python-фреймворк от авторов Pydantic, предназначенный для создания production-ready AI-агентов. В отличие от LangChain или LlamaIndex, Pydantic AI делает ставку на строгую типизацию, нативный async и минимализм API.

Ключевые принципы фреймворка:

- **Type-safety** — все входные и выходные данные описываются через Pydantic-модели
- **Async-first** — агенты работают через `asyncio` по умолчанию
- **Dependency injection** — зависимости (БД, HTTP-клиенты, конфигурация) передаются через типизированный контекст
- **Multi-model** — поддержка OpenAI, Anthropic, Gemini, Ollama и других провайдеров через единый API

## Установка

```bash
pip install pydantic-ai
```

Для работы с конкретным провайдером нужно установить соответствующий пакет и задать API-ключ:

```bash
# OpenAI
pip install pydantic-ai[openai]
export OPENAI_API_KEY=sk-...

# Anthropic
pip install pydantic-ai[anthropic]
export ANTHROPIC_API_KEY=sk-ant-...
```

## Первый агент

Минимальный агент создаётся в несколько строк:

```python
from pydantic_ai import Agent

agent = Agent(
    model='openai:gpt-4o-mini',
    system_prompt='Ты — помощник разработчика. Отвечай кратко и по делу.',
)

async def main():
    result = await agent.run('Что такое декоратор в Python?')
    print(result.data)

import asyncio
asyncio.run(main())
```

Метод `agent.run()` возвращает объект `RunResult`, у которого есть поле `data` с ответом модели. Для синхронного кода доступен `agent.run_sync()`:

```python
result = agent.run_sync('Что такое декоратор в Python?')
print(result.data)
```

## Структурированный вывод

Одна из главных особенностей Pydantic AI — возможность получать структурированный ответ, описанный Pydantic-моделью. Модель гарантированно вернёт данные в нужном формате.

```python
from pydantic import BaseModel
from pydantic_ai import Agent

class CodeReview(BaseModel):
    summary: str
    issues: list[str]
    score: int  # от 1 до 10
    recommendation: str

agent = Agent(
    model='openai:gpt-4o-mini',
    result_type=CodeReview,
    system_prompt=(
        'Ты — эксперт по code review. '
        'Анализируй код и возвращай структурированный отчёт.'
    ),
)

async def main():
    code = '''
def get_users(db):
    return db.execute("SELECT * FROM users WHERE id=" + user_id)
'''
    result = await agent.run(f'Проведи code review:\n{code}')
    review: CodeReview = result.data
    print(f'Оценка: {review.score}/10')
    print(f'Проблемы: {review.issues}')
    print(f'Рекомендация: {review.recommendation}')

import asyncio
asyncio.run(main())
```

Fреймворк автоматически добавляет инструкции модели о требуемой схеме JSON и валидирует ответ через Pydantic. При ошибке валидации делается повторный запрос с описанием проблемы.

## Инструменты (Tools)

Инструменты позволяют агенту вызывать Python-функции для получения актуальных данных или выполнения действий. Объявляются через декоратор `@agent.tool`:

```python
from datetime import datetime
from pydantic_ai import Agent, RunContext

agent = Agent(
    model='openai:gpt-4o-mini',
    system_prompt='Ты — ассистент по расписанию. Используй инструменты для работы с датами.',
)

@agent.tool_plain
def get_current_datetime() -> str:
    """Возвращает текущую дату и время."""
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

@agent.tool_plain
def days_until(target_date: str) -> int:
    """Считает количество дней до указанной даты (формат YYYY-MM-DD)."""
    target = datetime.strptime(target_date, '%Y-%m-%d')
    delta = target - datetime.now()
    return max(0, delta.days)

async def main():
    result = await agent.run('Сколько дней осталось до нового года?')
    print(result.data)

import asyncio
asyncio.run(main())
```

Декоратор `@agent.tool_plain` используется для инструментов без доступа к контексту. Декоратор `@agent.tool` даёт доступ к `RunContext` — первым аргументом функции.

### Инструменты с доступом к контексту

```python
from dataclasses import dataclass
from pydantic_ai import Agent, RunContext

@dataclass
class AppContext:
    user_id: int
    database_url: str

agent = Agent(
    model='openai:gpt-4o-mini',
    deps_type=AppContext,
    system_prompt='Ты — персональный ассистент пользователя.',
)

@agent.tool
async def get_user_orders(ctx: RunContext[AppContext]) -> list[dict]:
    """Получает список заказов текущего пользователя."""
    # ctx.deps содержит AppContext
    user_id = ctx.deps.user_id
    # В реальном коде здесь был бы запрос к БД
    return [
        {'id': 1, 'product': 'Курс Python', 'status': 'completed'},
        {'id': 2, 'product': 'Курс TypeScript', 'status': 'pending'},
    ]

async def main():
    context = AppContext(user_id=42, database_url='postgresql://...')
    result = await agent.run(
        'Покажи мои заказы',
        deps=context,
    )
    print(result.data)

import asyncio
asyncio.run(main())
```

## Dependency Injection

Pydantic AI реализует паттерн dependency injection через `deps_type`. Зависимости передаются при каждом вызове агента и доступны как в инструментах, так и в динамических системных промптах.

```python
from dataclasses import dataclass
from httpx import AsyncClient
from pydantic_ai import Agent, RunContext

@dataclass
class SearchContext:
    http_client: AsyncClient
    api_key: str
    language: str = 'ru'

agent = Agent(
    model='anthropic:claude-3-5-haiku-latest',
    deps_type=SearchContext,
)

@agent.system_prompt
def build_system_prompt(ctx: RunContext[SearchContext]) -> str:
    return (
        f'Ты — поисковый ассистент. '
        f'Отвечай на языке: {ctx.deps.language}. '
        f'Используй инструменты для получения актуальной информации.'
    )

@agent.tool
async def search_web(ctx: RunContext[SearchContext], query: str) -> str:
    """Выполняет поиск в интернете по запросу."""
    response = await ctx.deps.http_client.get(
        'https://api.search.example.com/search',
        params={'q': query, 'lang': ctx.deps.language},
        headers={'Authorization': f'Bearer {ctx.deps.api_key}'},
    )
    data = response.json()
    return '\n'.join(r['snippet'] for r in data.get('results', [])[:3])

async def main():
    async with AsyncClient() as client:
        ctx = SearchContext(
            http_client=client,
            api_key='my-search-key',
            language='ru',
        )
        result = await agent.run('Какие новости в Python 3.13?', deps=ctx)
        print(result.data)

import asyncio
asyncio.run(main())
```

## Потоковая передача ответов

Для длинных ответов можно использовать стриминг — данные появляются по мере генерации:

```python
from pydantic_ai import Agent

agent = Agent(
    model='openai:gpt-4o-mini',
    system_prompt='Ты — технический писатель. Пиши подробные объяснения.',
)

async def main():
    async with agent.run_stream('Объясни принцип работы asyncio в Python') as response:
        async for chunk in response.stream_text(delta=True):
            print(chunk, end='', flush=True)
    print()  # перевод строки в конце

import asyncio
asyncio.run(main())
```

Для структурированного стриминга с Pydantic-моделью:

```python
from pydantic import BaseModel
from pydantic_ai import Agent

class ArticleOutline(BaseModel):
    title: str
    sections: list[str]
    estimated_words: int

agent = Agent(
    model='openai:gpt-4o',
    result_type=ArticleOutline,
)

async def main():
    async with agent.run_stream('Создай план статьи о FastAPI') as response:
        # Частичные результаты по мере валидации
        async for partial in response.stream():
            print(partial)  # ArticleOutline с заполненными полями

import asyncio
asyncio.run(main())
```

## История разговора

Для создания чат-бота с памятью передаются предыдущие сообщения через `message_history`:

```python
from pydantic_ai import Agent
from pydantic_ai.messages import ModelMessagesTypeAdapter

agent = Agent(
    model='openai:gpt-4o-mini',
    system_prompt='Ты — ментор по Python. Запоминай контекст разговора.',
)

async def chat():
    history = []

    while True:
        user_input = input('Вы: ')
        if user_input.lower() == 'выход':
            break

        result = await agent.run(
            user_input,
            message_history=history,
        )

        # Добавляем все сообщения этого хода в историю
        history.extend(result.new_messages())

        print(f'Ассистент: {result.data}')

import asyncio
asyncio.run(chat())
```

## Обработка ошибок и повторные попытки

Pydantic AI автоматически обрабатывает ошибки валидации, делая повторные запросы к модели. Для инструментов можно явно сигнализировать об ошибке:

```python
from pydantic_ai import Agent, RunContext
from pydantic_ai.exceptions import ModelRetry

agent = Agent(
    model='openai:gpt-4o-mini',
    system_prompt='Ищи информацию о пакетах Python.',
    retries=3,  # максимум повторных попыток
)

@agent.tool(retries=2)
async def get_package_info(ctx: RunContext, package_name: str) -> dict:
    """Получает информацию о пакете с PyPI."""
    if not package_name.replace('-', '').replace('_', '').isalnum():
        # Просим модель исправить входные данные
        raise ModelRetry(
            f'Некорректное имя пакета: {package_name!r}. '
            f'Используй только буквы, цифры, дефисы и подчёркивания.'
        )

    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.get(f'https://pypi.org/pypi/{package_name}/json')
        if response.status_code == 404:
            raise ModelRetry(f'Пакет {package_name!r} не найден на PyPI.')
        return response.json()['info']
```

## Тестирование агентов

Pydantic AI предоставляет `TestModel` для детерминированного тестирования без реальных API-вызовов:

```python
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel

agent = Agent(
    model='openai:gpt-4o-mini',
    system_prompt='Классифицируй отзывы.',
)

async def test_agent():
    with agent.override(model=TestModel()):
        result = await agent.run('Это отличный продукт!')
        # TestModel возвращает предсказуемый ответ
        assert isinstance(result.data, str)
        # Проверяем, что системный промпт применился
        assert result.usage().request_tokens > 0

import asyncio
asyncio.run(test_agent())
```

Для pytest используется `pytest-asyncio`:

```python
import pytest
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel

class Sentiment(BaseModel):
    label: str
    confidence: float

agent = Agent(model='openai:gpt-4o-mini', result_type=Sentiment)

@pytest.mark.asyncio
async def test_sentiment_structure():
    with agent.override(model=TestModel()):
        result = await agent.run('Текст для анализа')
        # Проверяем структуру без реального вызова API
        assert hasattr(result.data, 'label')
        assert hasattr(result.data, 'confidence')
```

## Выбор модели

Pydantic AI поддерживает единый синтаксис для разных провайдеров:

```python
from pydantic_ai import Agent

# OpenAI
agent_openai = Agent(model='openai:gpt-4o')

# Anthropic
agent_anthropic = Agent(model='anthropic:claude-sonnet-4-5')

# Google Gemini
agent_gemini = Agent(model='google-gla:gemini-2.0-flash')

# Локальная модель через Ollama
agent_ollama = Agent(model='ollama:llama3.2')

# Groq
agent_groq = Agent(model='groq:llama-3.1-70b-versatile')
```

Модель можно переопределить при вызове:

```python
result = await agent.run(
    'Вопрос',
    model='anthropic:claude-opus-5',  # переопределяет модель по умолчанию
)
```

## Итог

Pydantic AI предлагает прагматичный подход к созданию AI-агентов: строгая типизация через Pydantic, нативный async, чистый DI-паттерн и поддержка всех популярных LLM-провайдеров. Фреймворк хорошо подходит для production-окружений, где важны предсказуемость, тестируемость и читаемость кода.

Основные сценарии применения:
- Извлечение структурированных данных из текста
- Автоматизация задач с вызовом внешних API
- Чат-боты с памятью и контекстом
- Пайплайны обработки данных с LLM-шагами

Чтобы углубить знания Python и научиться строить современные приложения, изучите курс на PurpleSchool: [Курс по Python](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=pydantic-ai).
