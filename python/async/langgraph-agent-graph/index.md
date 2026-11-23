---
metaTitle: "LangGraph: граф агентов на Python — полное руководство"
metaDescription: "Как построить граф агентов с LangGraph на Python: узлы, рёбра, состояние, условная маршрутизация и многоагентные системы с примерами кода."
author: "Антон Ларичев"
title: "LangGraph: граф агентов на Python"
preview: "Строим многоагентные системы на Python с помощью LangGraph: граф состояний, условные переходы и оркестрация LLM-агентов."
---

LangGraph — это библиотека поверх LangChain, которая позволяет описывать логику агентов в виде направленного графа. В отличие от линейных цепочек, граф поддерживает циклы, ветвления и явное управление состоянием — то, что нужно для надёжных многоагентных систем.

## Зачем LangGraph вместо обычных цепочек

Классический подход с LangChain-цепочками (`Chain`) работает хорошо для прямолинейных задач: пришёл запрос — прошёл через трансформации — получили ответ. Как только появляется логика «если агент не уверен — переспросить», «если инструмент вернул ошибку — попробовать другой», цепочки становятся неудобными.

LangGraph решает это явным образом: каждый шаг — это узел (node), переходы между шагами — рёбра (edges), а общий контекст хранится в объекте состояния (state).

Ключевые возможности:
- Циклы в графе (ReAct-паттерн, итеративное уточнение)
- Условная маршрутизация по результату узла
- Персистентное состояние с чекпоинтами
- Встроенная поддержка параллельного исполнения
- Потоковый вывод (streaming) по узлам

## Установка

```bash
pip install langgraph langchain-openai
```

Для работы с OpenAI установите ключ:

```bash
export OPENAI_API_KEY="sk-..."
```

## Основные концепции

### Состояние (State)

Состояние — это TypedDict, который передаётся через все узлы графа. Каждый узел получает текущее состояние и возвращает обновление.

```python
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    attempts: int
    final_answer: str
```

Аннотация `add_messages` — встроенный редьюсер: новые сообщения добавляются к списку, а не заменяют его. Для других полей можно писать собственные редьюсеры или использовать значение по умолчанию (замена).

### Узлы (Nodes)

Узел — обычная Python-функция, которая принимает состояние и возвращает словарь с обновлениями:

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage

llm = ChatOpenAI(model="claude-sonnet-4-6", temperature=0)

def analyst_node(state: AgentState) -> dict:
    response = llm.invoke([
        SystemMessage(content="Ты аналитик данных. Отвечай кратко."),
        *state["messages"]
    ])
    return {"messages": [response]}
```

### Граф и компиляция

```python
from langgraph.graph import StateGraph, END

builder = StateGraph(AgentState)
builder.add_node("analyst", analyst_node)
builder.set_entry_point("analyst")
builder.add_edge("analyst", END)

graph = builder.compile()
```

После компиляции граф — исполняемый объект с методами `invoke`, `stream`, `astream`.

## Простой пример: агент с инструментами

Реализуем классический ReAct-цикл: агент думает, вызывает инструмент, смотрит на результат, думает снова.

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage

@tool
def search_web(query: str) -> str:
    """Поиск информации в интернете."""
    # Заглушка для примера
    return f"Результаты поиска по запросу '{query}': найдено 42 статьи."

@tool
def calculate(expression: str) -> str:
    """Вычисляет математическое выражение."""
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception as e:
        return f"Ошибка: {e}"

tools = [search_web, calculate]
llm = ChatOpenAI(model="gpt-4o").bind_tools(tools)

class State(TypedDict):
    messages: Annotated[list, add_messages]

def agent_node(state: State) -> dict:
    response = llm.invoke([
        SystemMessage(content="Ты помощник. Используй инструменты при необходимости."),
        *state["messages"]
    ])
    return {"messages": [response]}

def should_continue(state: State) -> str:
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

builder = StateGraph(State)
builder.add_node("agent", agent_node)
builder.add_node("tools", ToolNode(tools))

builder.set_entry_point("agent")
builder.add_conditional_edges("agent", should_continue)
builder.add_edge("tools", "agent")  # после инструментов — назад к агенту

graph = builder.compile()
```

Запуск:

```python
from langchain_core.messages import HumanMessage

result = graph.invoke({
    "messages": [HumanMessage(content="Сколько будет 2 в степени 10?")]
})

print(result["messages"][-1].content)
# 1024
```

## Условные рёбра

`add_conditional_edges` — основной инструмент ветвления. Функция-маршрутизатор возвращает строку, которая указывает следующий узел.

```python
def route_by_complexity(state: State) -> str:
    last_message = state["messages"][-1]
    content = last_message.content.lower()
    
    if any(word in content for word in ["код", "программ", "функци"]):
        return "code_expert"
    elif any(word in content for word in ["данны", "статистик", "аналит"]):
        return "data_analyst"
    else:
        return "general_agent"

builder.add_conditional_edges(
    "router",
    route_by_complexity,
    {
        "code_expert": "code_expert",
        "data_analyst": "data_analyst",
        "general_agent": "general_agent",
    }
)
```

Словарь в третьем аргументе — маппинг возвращаемых значений на имена узлов. Если имена совпадают, словарь можно не передавать.

## Многоагентная система

Покажем систему из трёх агентов: планировщика, исполнителя и критика.

```python
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

class WorkflowState(TypedDict):
    messages: Annotated[list, add_messages]
    plan: str
    result: str
    critique: str
    iteration: int

llm = ChatOpenAI(model="gpt-4o", temperature=0.2)

def planner(state: WorkflowState) -> dict:
    response = llm.invoke([
        SystemMessage(content="""Ты планировщик. Получи задачу и составь
        чёткий пошаговый план её решения. Верни только план."""),
        *state["messages"]
    ])
    return {
        "messages": [response],
        "plan": response.content
    }

def executor(state: WorkflowState) -> dict:
    response = llm.invoke([
        SystemMessage(content=f"""Ты исполнитель. Выполни следующий план:
        {state['plan']}
        
        Дай подробный результат."""),
        *state["messages"]
    ])
    return {
        "messages": [response],
        "result": response.content
    }

def critic(state: WorkflowState) -> dict:
    response = llm.invoke([
        SystemMessage(content="""Ты критик. Оцени результат по шкале 1-10.
        Если оценка ниже 7 — укажи конкретные недостатки для улучшения.
        Формат ответа: 'Оценка: X/10. [комментарий]'"""),
        HumanMessage(content=f"Результат для оценки: {state['result']}"),
    ])
    return {
        "messages": [response],
        "critique": response.content,
        "iteration": state.get("iteration", 0) + 1
    }

def should_revise(state: WorkflowState) -> Literal["executor", "__end__"]:
    critique = state.get("critique", "")
    iteration = state.get("iteration", 0)
    
    # Парсим оценку из текста критика
    import re
    match = re.search(r"Оценка:\s*(\d+)/10", critique)
    score = int(match.group(1)) if match else 5
    
    if score < 7 and iteration < 3:
        return "executor"  # отправляем на доработку
    return END

builder = StateGraph(WorkflowState)
builder.add_node("planner", planner)
builder.add_node("executor", executor)
builder.add_node("critic", critic)

builder.set_entry_point("planner")
builder.add_edge("planner", "executor")
builder.add_edge("executor", "critic")
builder.add_conditional_edges("critic", should_revise)

graph = builder.compile()
```

Запуск и вывод результата:

```python
state = graph.invoke({
    "messages": [HumanMessage(content="Напиши функцию на Python для поиска простых чисел")],
    "plan": "",
    "result": "",
    "critique": "",
    "iteration": 0
})

print("План:", state["plan"][:200])
print("Результат:", state["result"][:300])
print("Оценка:", state["critique"])
```

## Персистентность и чекпоинты

LangGraph поддерживает сохранение состояния между запусками через чекпоинтеры. Это нужно для диалоговых агентов, которые помнят контекст.

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()
graph = builder.compile(checkpointer=checkpointer)

# Первый запрос в сессии
config = {"configurable": {"thread_id": "user-42"}}

result1 = graph.invoke(
    {"messages": [HumanMessage(content="Меня зовут Анна")]},
    config=config
)

# Второй запрос — граф помнит контекст
result2 = graph.invoke(
    {"messages": [HumanMessage(content="Как меня зовут?")]},
    config=config
)

print(result2["messages"][-1].content)
# Тебя зовут Анна.
```

Для продакшена используйте `SqliteSaver` или `PostgresSaver` вместо `MemorySaver`:

```python
from langgraph.checkpoint.sqlite import SqliteSaver

with SqliteSaver.from_conn_string("checkpoints.db") as checkpointer:
    graph = builder.compile(checkpointer=checkpointer)
    result = graph.invoke(..., config={"configurable": {"thread_id": "session-1"}})
```

## Потоковый вывод

Для длинных агентских цепочек удобно получать вывод по мере исполнения:

```python
async def stream_example():
    async for chunk in graph.astream(
        {"messages": [HumanMessage(content="Расскажи о Python")]},
        stream_mode="values"
    ):
        last_message = chunk["messages"][-1]
        if hasattr(last_message, "content"):
            print(last_message.content, end="", flush=True)

import asyncio
asyncio.run(stream_example())
```

Режим `stream_mode="updates"` выводит только изменения состояния по каждому узлу — удобно для отладки:

```python
for update in graph.stream(
    {"messages": [HumanMessage(content="Привет")]},
    stream_mode="updates"
):
    node_name, node_output = next(iter(update.items()))
    print(f"[{node_name}] обновил состояние: {list(node_output.keys())}")
```

## Параллельное исполнение узлов

Если несколько узлов не зависят друг от друга, LangGraph может запустить их параллельно:

```python
builder = StateGraph(State)
builder.add_node("fetch_news", fetch_news_node)
builder.add_node("fetch_prices", fetch_prices_node)
builder.add_node("synthesizer", synthesizer_node)

builder.set_entry_point("fetch_news")
# Оба узла стартуют из точки входа — параллельное исполнение
builder.add_edge("__start__", "fetch_news")
builder.add_edge("__start__", "fetch_prices")
# Синтезатор запускается только после обоих
builder.add_edge("fetch_news", "synthesizer")
builder.add_edge("fetch_prices", "synthesizer")
builder.add_edge("synthesizer", END)
```

При слиянии LangGraph автоматически ждёт завершения всех входящих рёбер перед запуском следующего узла.

## Визуализация графа

```python
from IPython.display import Image

Image(graph.get_graph().draw_mermaid_png())
```

Или вывести текстовое представление:

```python
print(graph.get_graph().draw_mermaid())
```

## Частые ошибки

**Бесконечный цикл.** Если условный маршрутизатор всегда возвращает имя того же узла — граф зациклится. Добавляйте счётчик итераций в состояние и выход по лимиту.

**Неправильные редьюсеры.** Если поле состояния — список и вы не используете `add_messages` или собственный редьюсер, каждый узел будет полностью заменять список. Явно определяйте стратегию слияния для коллекций.

**Гонка при параллельных узлах.** Если два параллельных узла обновляют одно поле без редьюсера — одно обновление будет потеряно. Используйте редьюсеры или разделяйте поля.

**Компиляция до добавления всех рёбер.** `builder.compile()` фиксирует граф. Добавлять узлы и рёбра после компиляции нельзя — создавайте новый граф.

## Итог

LangGraph даёт структуру для агентских систем, которые сложнее линейного пайплайна. Граф состояний, условные рёбра и чекпоинты позволяют строить надёжные многоагентные приложения с циклами обратной связи, ветвлением по контексту и сохранением диалоговой памяти.

Отправная точка для большинства задач — шаблон ReAct: узел-агент, узел-инструменты, условный переход между ними. Всё остальное — надстройка над этим фундаментом.

Чтобы глубже разобраться с Python и асинхронными паттернами, которые лежат в основе LangGraph, пройдите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=langgraph-agent-graph