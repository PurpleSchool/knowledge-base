---
metaTitle: Синтаксис async/await в Python — как писать асинхронный код
metaDescription: Подробный разбор синтаксиса async/await в Python — создание корутин, ожидание результатов, обработка ошибок и паттерны асинхронного кода.
author: Антон Ларичев
title: Синтаксис async/await в Python — как писать асинхронный код
preview: Разбираем синтаксис async и await в Python — как объявлять корутины, ожидать результаты и строить асинхронные цепочки вызовов.
---

## Введение

Ключевые слова `async` и `await` появились в Python 3.5 и стали основным способом написания асинхронного кода. Они делают асинхронный код понятным и читаемым, напоминающим по структуре обычный синхронный код, но позволяющим эффективно работать с операциями ввода-вывода.

В этой статье мы подробно разберём, как использовать `async def` для объявления корутин, `await` для ожидания результатов и как строить цепочки асинхронных вызовов на практике.

### Объявление корутин с async def

Ключевое слово `async` перед `def` превращает обычную функцию в корутину. Корутина — это функция, которая может приостанавливать своё выполнение в определённых точках, уступая управление событийному циклу.

```python
import asyncio

# Обычная функция
def obychnaya_funkciya():
    return "Я синхронная"

# Корутина
async def korutina():
    return "Я асинхронная"

# Вызов обычной функции — сразу возвращает результат
rezultat = obychnaya_funkciya()
print(rezultat)  # Я синхронная

# Вызов корутины — возвращает объект корутины, а не результат
korutina_obj = korutina()
print(korutina_obj)  # <coroutine object korutina at 0x...>

# Для получения результата нужно запустить через событийный цикл
async def main():
    rezultat = await korutina()
    print(rezultat)  # Я асинхронная

asyncio.run(main())
```

### Оператор await и его правила

Оператор `await` используется для ожидания завершения асинхронной операции. Он может применяться только внутри функции, объявленной как `async def`.

```python
import asyncio

async def poluchit_dannye():
    print("Запрос данных...")
    # await приостанавливает корутину на 2 секунды
    await asyncio.sleep(2)
    print("Данные получены!")
    return {"id": 1, "imya": "Python"}

async def obrabotat_dannye(dannye):
    print(f"Обработка: {dannye}")
    await asyncio.sleep(1)
    return f"Обработано: {dannye['imya']}"

async def main():
    # Последовательное выполнение с await
    dannye = await poluchit_dannye()
    rezultat = await obrabotat_dannye(dannye)
    print(rezultat)

asyncio.run(main())
```

Применять `await` можно только к объектам, которые поддерживают протокол ожидания (awaitable). К ним относятся:

* Корутины (объекты, возвращённые `async def` функциями)
* Задачи (`asyncio.Task`)
* Объекты `asyncio.Future`
* Любые объекты с методом `__await__`

### Цепочки асинхронных вызовов

В реальных приложениях асинхронные операции часто образуют цепочки — результат одной операции передаётся в следующую.

```python
import asyncio

async def zaprosit_token():
    # Имитируем получение токена авторизации
    await asyncio.sleep(0.5)
    return "token_abc123"

async def zaprosit_profil(token):
    # Имитируем запрос профиля с токеном
    await asyncio.sleep(1)
    return {"token": token, "imya": "Алексей", "rol": "разработчик"}

async def zaprosit_dostup(profil):
    # Имитируем проверку прав доступа
    await asyncio.sleep(0.5)
    return f"Доступ разрешён для {profil['imya']} (роль: {profil['rol']})"

async def main():
    # Цепочка последовательных асинхронных вызовов
    token = await zaprosit_token()
    profil = await zaprosit_profil(token)
    dostup = await zaprosit_dostup(profil)
    print(dostup)

asyncio.run(main())
```

Если вы хотите детальнее изучить асинхронное программирование и паттерны проектирования в Python — приходите на наш большой курс [Продвинутый Python](https://purpleschool.ru/course/python-advanced?utm_source=knowledgebase&utm_medium=article&utm_campaign=async-await-python).
На курсе 171 урок и 22 упражнения, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Параллельное выполнение с await

Когда операции не зависят друг от друга, их можно выполнять параллельно. Сравним последовательный и параллельный подходы:

```python
import asyncio
import time

async def operaciya(nazvanie, zaderjka):
    await asyncio.sleep(zaderjka)
    return f"{nazvanie} выполнена"

async def posledovatelnoe():
    # Каждая операция ждёт предыдущую
    nachalo = time.time()
    r1 = await operaciya("A", 1)
    r2 = await operaciya("B", 2)
    r3 = await operaciya("C", 1)
    print(f"Последовательно: {time.time() - nachalo:.1f} сек")  # ~4 сек
    return [r1, r2, r3]

async def parallelnoe():
    # Все операции запускаются одновременно
    nachalo = time.time()
    r1, r2, r3 = await asyncio.gather(
        operaciya("A", 1),
        operaciya("B", 2),
        operaciya("C", 1),
    )
    print(f"Параллельно: {time.time() - nachalo:.1f} сек")  # ~2 сек
    return [r1, r2, r3]

async def main():
    await posledovatelnoe()
    await parallelnoe()

asyncio.run(main())
```

### Async-контекстные менеджеры

Python позволяет создавать асинхронные контекстные менеджеры с помощью `async with`. Это полезно для управления ресурсами, которые требуют асинхронной инициализации или очистки.

```python
import asyncio

class AsinhronnoeSoedinenie:
    def __init__(self, adres):
        self.adres = adres

    async def __aenter__(self):
        # Асинхронная инициализация соединения
        print(f"Подключение к {self.adres}...")
        await asyncio.sleep(1)
        print("Соединение установлено")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Асинхронное закрытие соединения
        print("Закрытие соединения...")
        await asyncio.sleep(0.5)
        print("Соединение закрыто")

    async def zapros(self, sql):
        await asyncio.sleep(0.5)
        return f"Результат запроса: {sql}"

async def main():
    async with AsinhronnoeSoedinenie("db://localhost") as conn:
        rezultat = await conn.zapros("SELECT * FROM users")
        print(rezultat)

asyncio.run(main())
```

### Обработка ошибок в асинхронном коде

Обработка исключений в `async/await` коде работает так же, как в синхронном — через `try/except`:

```python
import asyncio

async def nestabilniy_zapros():
    await asyncio.sleep(1)
    raise ConnectionError("Сервер недоступен")

async def main():
    try:
        rezultat = await nestabilniy_zapros()
    except ConnectionError as e:
        print(f"Ошибка соединения: {e}")

    # Обработка ошибок при параллельном выполнении
    rezultaty = await asyncio.gather(
        asyncio.sleep(1),
        nestabilniy_zapros(),
        return_exceptions=True,  # Исключения возвращаются как результаты
    )

    for r in rezultaty:
        if isinstance(r, Exception):
            print(f"Задача завершилась с ошибкой: {r}")
        else:
            print(f"Задача выполнена: {r}")

asyncio.run(main())
```

### Частые ошибки

* **Использование await вне async-функции** — оператор `await` работает только внутри корутин. Вызов `await` в обычной функции приведёт к `SyntaxError`.
* **Забыть await при вызове корутины** — без `await` вызов `async def` функции вернёт объект корутины, а не результат. Логика внутри корутины не выполнится.
* **Смешивание синхронного и асинхронного кода** — вызов `time.sleep()` внутри корутины заблокирует весь событийный цикл. Всегда используйте `asyncio.sleep()` и другие асинхронные аналоги.
* **Слишком глубокие цепочки await** — длинные последовательности `await` без параллелизма сводят на нет преимущества асинхронности. Ищите возможности для параллельного выполнения через `gather()` или `create_task()`.

### Частозадаваемые вопросы

**Можно ли использовать await в лямбда-выражениях?**
Нет, Python не поддерживает `async lambda`. Если вам нужна короткая асинхронная функция, объявите её как обычную корутину через `async def`.

**Чем async for отличается от обычного for?**
`async for` используется для итерации по асинхронным итераторам — объектам, которые реализуют метод `__aiter__` и `__anext__`. Обычный `for` работает только с синхронными итераторами.

**Работает ли async/await с многопоточностью?**
Да, вы можете комбинировать asyncio с потоками через `asyncio.to_thread()` для запуска блокирующих функций. Однако корутины сами по себе выполняются в одном потоке.

### Заключение

Синтаксис `async/await` делает асинхронный код в Python интуитивным и легко читаемым. Понимание того, как объявлять корутины, ожидать результаты и строить параллельные цепочки вызовов, — фундамент для работы с любыми асинхронными библиотеками и фреймворками. Для закрепления навыков async/await и глубокого понимания асинхронных паттернов рекомендуем курс [Продвинутый Python](https://purpleschool.ru/course/python-advanced?utm_source=knowledgebase&utm_medium=article&utm_campaign=async-await-python).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет освоить базовые концепции и понять структуру курса до покупки полного доступа.
