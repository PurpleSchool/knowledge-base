---
metaTitle: "LangChain в Python: основы и первые шаги"
metaDescription: "Изучите основы LangChain в Python: установка, цепочки, промпты, память и агенты. Практические примеры с пояснениями."
author: "Антон Ларичев"
title: "LangChain: основы работы с библиотекой"
preview: "Разбираем ключевые концепции LangChain: LLM, цепочки, промпты, память и агенты — с практическими примерами на Python."
---

## Что такое LangChain

LangChain — это фреймворк для создания приложений на базе больших языковых моделей (LLM). Библиотека предоставляет набор абстракций, которые позволяют соединять языковые модели с внешними источниками данных, инструментами и памятью.

Основная идея: вместо того чтобы делать разрозненные вызовы к API модели, вы строите **цепочки** (chains) — последовательности шагов, каждый из которых принимает входные данные, обрабатывает их и передаёт результат следующему шагу.

LangChain используют для:
- Чат-ботов с памятью о предыдущих сообщениях
- Систем вопрос-ответ по документам (RAG)
- Автономных агентов, которые используют инструменты
- Пайплайнов обработки и анализа текстов

## Установка

Установка основного пакета и пакета интеграции с OpenAI:

```bash
pip install langchain langchain-openai langchain-core
```

Для работы с переменными окружения используйте `python-dotenv`:

```bash
pip install python-dotenv
```

Создайте файл `.env` в корне проекта:

```bash
OPENAI_API_KEY=sk-...
```

## Основные концепции

Прежде чем писать код, важно понять четыре ключевых строительных блока LangChain.

### LLM и ChatModel

LLM — это обёртка вокруг языковой модели. В современных версиях LangChain принято использовать `ChatModel`, который работает с сообщениями (человек / ассистент / система).

```python
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
)

response = llm.invoke("Объясни, что такое рекурсия, одним предложением.")
print(response.content)
# Рекурсия — это техника программирования, при которой функция вызывает саму себя.
```

### PromptTemplate

Шаблон промпта позволяет переиспользовать структуру запроса, подставляя в него переменные.

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "Ты опытный Python-разработчик. Отвечай чётко и по делу."),
    ("human", "Объясни концепцию {concept} с примером кода на Python."),
])

# Посмотрим на сформированные сообщения
formatted = prompt.format_messages(concept="декораторы")
for msg in formatted:
    print(f"{msg.type}: {msg.content}")
```

### Chain (цепочка через LCEL)

LangChain Expression Language (LCEL) — декларативный способ соединять компоненты через оператор `|`.

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini")

prompt = ChatPromptTemplate.from_messages([
    ("system", "Ты Python-ментор. Давай практичные, краткие объяснения."),
    ("human", "{question}"),
])

# Создаём цепочку: промпт -> модель -> парсер вывода
chain = prompt | llm | StrOutputParser()

result = chain.invoke({"question": "Чем list comprehension лучше цикла for?"})
print(result)
```

Оператор `|` делает код читаемым: каждый элемент получает данные от предыдущего и передаёт результат следующему.

## Практические примеры

### Генератор кода с объяснением

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

code_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """Ты генератор Python-кода. 
Отвечай в формате:
1. Краткое описание решения
2. Код в блоке ```python
3. Пояснение ключевых моментов"""
    ),
    ("human", "Напиши функцию для {task}"),
])

chain = code_prompt | llm | StrOutputParser()

tasks = [
    "подсчёта частоты слов в тексте",
    "валидации email-адреса через regex",
]

for task in tasks:
    print(f"=== Задача: {task} ===")
    print(chain.invoke({"task": task}))
    print()
```

### Параллельные цепочки с RunnableParallel

Иногда нужно запустить несколько цепочек одновременно и объединить результаты:

```python
from langchain_core.runnables import RunnableParallel
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini")

pros_prompt = ChatPromptTemplate.from_template(
    "Перечисли 3 преимущества {technology} в Python-разработке."
)
cons_prompt = ChatPromptTemplate.from_template(
    "Перечисли 3 недостатка {technology} в Python-разработке."
)

pros_chain = pros_prompt | llm | StrOutputParser()
cons_chain = cons_prompt | llm | StrOutputParser()

# Запускаем обе цепочки параллельно
analysis = RunnableParallel(
    pros=pros_chain,
    cons=cons_chain,
)

result = analysis.invoke({"technology": "asyncio"})
print("Плюсы:")
print(result["pros"])
print("\nМинусы:")
print(result["cons"])
```

## Работа с памятью

Стандартная проблема при работе с LLM — каждый запрос отправляется без контекста предыдущих. LangChain решает это через историю сообщений.

### Простой чат с историей

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini")

prompt = ChatPromptTemplate.from_messages([
    ("system", "Ты помощник Python-разработчика."),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}"),
])

chain = prompt | llm | StrOutputParser()

# Храним историю вручную
history = []

def chat(user_input: str) -> str:
    response = chain.invoke({
        "input": user_input,
        "history": history,
    })
    # Добавляем в историю сообщения пользователя и ассистента
    history.append(HumanMessage(content=user_input))
    history.append(AIMessage(content=response))
    return response

print(chat("Как работает декоратор @property?"))
print(chat("Можешь показать пример из предыдущего ответа, но с setter?"))
# Второй вопрос отсылает к первому — модель понимает контекст
```

### RunnableWithMessageHistory

Для production-сценариев используйте `RunnableWithMessageHistory`, который управляет историей автоматически:

```python
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini")

prompt = ChatPromptTemplate.from_messages([
    ("system", "Ты ментор по Python."),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}"),
])

chain = prompt | llm | StrOutputParser()

# Хранилище сессий: session_id -> история
sessions = {}

def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in sessions:
        sessions[session_id] = InMemoryChatMessageHistory()
    return sessions[session_id]

chain_with_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)

# Разные session_id — разные независимые диалоги
config_alice = {"configurable": {"session_id": "alice"}}
config_bob = {"configurable": {"session_id": "bob"}}

print(chain_with_history.invoke({"input": "Привет! Я изучаю генераторы."}, config=config_alice))
print(chain_with_history.invoke({"input": "Объясни yield."}, config=config_alice))
print(chain_with_history.invoke({"input": "Что мы обсуждали?"}, config=config_alice))
# Алиса получит ответ с учётом двух предыдущих сообщений
```

## Потоковый вывод

Для длинных ответов важно выводить текст по мере генерации, а не ждать полного ответа:

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini", streaming=True)

prompt = ChatPromptTemplate.from_template(
    "Напиши подробное объяснение принципов SOLID в Python с примерами кода."
)

chain = prompt | llm | StrOutputParser()

# stream() возвращает генератор, токены приходят постепенно
for chunk in chain.stream({}):
    print(chunk, end="", flush=True)
print()  # перевод строки после завершения
```

## Структурированный вывод

Часто нужно получить от модели не свободный текст, а данные определённой структуры. LangChain поддерживает это через Pydantic:

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List

class CodeReview(BaseModel):
    score: int = Field(description="Оценка качества кода от 1 до 10")
    issues: List[str] = Field(description="Список найденных проблем")
    suggestions: List[str] = Field(description="Предложения по улучшению")
    summary: str = Field(description="Краткий итог ревью")

llm = ChatOpenAI(model="gpt-4o-mini")

# with_structured_output заставляет модель вернуть валидный объект
structured_llm = llm.with_structured_output(CodeReview)

prompt = ChatPromptTemplate.from_messages([
    ("system", "Ты senior Python-разработчик. Проведи ревью кода."),
    ("human", "Проведи ревью следующего кода:\n\n{code}"),
])

chain = prompt | structured_llm

code_to_review = """
def get_users(db):
    result = []
    data = db.execute('SELECT * FROM users')
    for row in data:
        result.append(row)
    return result
"""

review: CodeReview = chain.invoke({"code": code_to_review})
print(f"Оценка: {review.score}/10")
print(f"Проблемы: {review.issues}")
print(f"Советы: {review.suggestions}")
print(f"Итог: {review.summary}")
```

## Советы по работе с LangChain

**Используйте LCEL вместо устаревших классов.** Старый API (`LLMChain`, `ConversationChain`) существует, но помечен как deprecated. Строите цепочки через `|`.

**Настраивайте `temperature` осознанно.** Значение `0` даёт детерминированные ответы — подходит для генерации кода. Значение `0.7–1.0` добавляет креативность — подходит для текстов и идей.

**Используйте `.batch()` для массовой обработки.** Вместо цикла с `invoke()` вызывайте `chain.batch(list_of_inputs)` — LangChain запустит запросы параллельно:

```python
texts = [
    {"text": "Python — интерпретируемый язык."},
    {"text": "Django — веб-фреймворк для Python."},
    {"text": "asyncio позволяет писать асинхронный код."},
]

summaries = chain.batch(texts)  # параллельные запросы
```

**Логируйте вызовы через callbacks.** LangChain поддерживает систему обратных вызовов для отладки и мониторинга — подключайте `LangSmith` для трейсинга в production.

## Итог

LangChain предоставляет удобные абстракции для работы с языковыми моделями в Python. Ключевые концепции для старта:

- **ChatModel** — обёртка над языковой моделью
- **PromptTemplate** — переиспользуемые шаблоны запросов
- **LCEL и оператор `|`** — декларативная сборка цепочек
- **MessageHistory** — управление контекстом диалога
- **Structured output** — получение типизированных данных от модели

Этих инструментов достаточно, чтобы построить полноценного чат-бота, систему ответов на вопросы или автоматизированный ревьюер кода.

Чтобы углубиться в Python и научиться эффективно работать с современными библиотеками, смотрите курс по Python на PurpleSchool: [https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-langchain-basics](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=python-langchain-basics)