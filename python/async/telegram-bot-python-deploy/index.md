---
metaTitle: "Телеграм-бот на Python с aiogram 3: полное руководство"
metaDescription: "Создайте Telegram-бота на Python с aiogram 3: команды, FSM, инлайн-клавиатуры, деплой через Docker и systemd. Пошаговое руководство."
author: "Антон Ларичев"
title: "Телеграм-бот на Python: от команды до деплоя"
preview: "Пишем Telegram-бота на Python с aiogram 3 — от регистрации у BotFather до запуска на сервере через Docker и systemd."
---

## Что мы будем строить

В этой статье пройдём весь путь создания Telegram-бота на Python — от регистрации бота у BotFather до запуска в продакшене. Используем библиотеку **aiogram 3**, которая поддерживает асинхронное программирование через `asyncio` и предоставляет удобный интерфейс для работы с Telegram Bot API.

Бот будет уметь:
- Обрабатывать команды (`/start`, `/help`, `/profile`)
- Работать с инлайн-клавиатурами и callback-запросами
- Вести многошаговые диалоги через FSM (Finite State Machine)
- Запускаться как системный сервис через systemd или Docker

## Подготовка окружения

Создайте виртуальное окружение и установите зависимости:

```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

pip install aiogram==3.7.0 python-dotenv
```

Создайте файл `.env` для хранения токена:

```bash
BOT_TOKEN=ваш_токен_бота
```

Структура проекта:

```
telegram-bot/
├── .env
├── bot.py
├── handlers/
│   ├── __init__.py
│   ├── commands.py
│   └── messages.py
├── keyboards/
│   ├── __init__.py
│   └── inline.py
├── states/
│   └── user_states.py
└── requirements.txt
```

## Получение токена у BotFather

Перед написанием кода нужно зарегистрировать бота:

1. Откройте Telegram и найдите `@BotFather`
2. Отправьте команду `/newbot`
3. Укажите имя бота, например `My Test Bot`
4. Укажите username, который должен заканчиваться на `bot`, например `my_test_bot`
5. Скопируйте полученный токен вида `1234567890:ABCdefGHIjklMNOpqrSTUvwxyz`

Вставьте токен в файл `.env`.

## Точка входа и инициализация бота

Создайте файл `bot.py`:

```python
import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from dotenv import load_dotenv
import os

from handlers.commands import router as commands_router
from handlers.messages import router as messages_router

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    bot = Bot(token=os.getenv("BOT_TOKEN"))
    dp = Dispatcher(storage=MemoryStorage())

    dp.include_router(commands_router)
    dp.include_router(messages_router)

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
```

`Dispatcher` — центральный объект aiogram, который маршрутизирует входящие обновления к нужным обработчикам. `MemoryStorage` хранит состояния FSM в памяти процесса — для продакшена стоит заменить на Redis.

## Обработка команд

Создайте файл `handlers/commands.py`:

```python
from aiogram import Router
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command, CommandStart
from keyboards.inline import main_menu_keyboard, back_keyboard

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message):
    await message.answer(
        f"Привет, {message.from_user.first_name}!\n"
        "Я учебный бот. Используй /help для списка команд."
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    help_text = (
        "Доступные команды:\n"
        "/start — приветствие\n"
        "/help — список команд\n"
        "/profile — ваш профиль\n"
        "/menu — главное меню\n"
        "/register — регистрация"
    )
    await message.answer(help_text)


@router.message(Command("profile"))
async def cmd_profile(message: Message):
    user = message.from_user
    profile_text = (
        f"Ваш профиль:\n"
        f"ID: {user.id}\n"
        f"Имя: {user.full_name}\n"
        f"Username: @{user.username or 'не указан'}"
    )
    await message.answer(profile_text)


@router.message(Command("menu"))
async def cmd_menu(message: Message):
    await message.answer("Главное меню:", reply_markup=main_menu_keyboard())


@router.callback_query(lambda c: c.data.startswith("menu:"))
async def process_menu_callback(callback: CallbackQuery):
    action = callback.data.split(":")[1]

    if action == "main":
        await callback.message.edit_text(
            "Главное меню:", reply_markup=main_menu_keyboard()
        )
    elif action == "news":
        await callback.message.edit_text(
            "Раздел новостей (в разработке)",
            reply_markup=back_keyboard()
        )
    elif action == "settings":
        await callback.message.edit_text(
            "Настройки (в разработке)",
            reply_markup=back_keyboard()
        )
    elif action == "about":
        await callback.message.edit_text(
            "Учебный бот, созданный на aiogram 3",
            reply_markup=back_keyboard()
        )

    await callback.answer()
```

`CommandStart()` — специальный фильтр aiogram для команды `/start`. Всегда вызывайте `await callback.answer()` при обработке inline-кнопок — без этого пользователь видит бесконечный индикатор загрузки на кнопке.

## Инлайн-клавиатуры

Инлайн-клавиатуры — кнопки, прикреплённые непосредственно к сообщению. Создайте `keyboards/inline.py`:

```python
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder


def main_menu_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="Новости", callback_data="menu:news")
    builder.button(text="Настройки", callback_data="menu:settings")
    builder.button(text="О боте", callback_data="menu:about")
    builder.adjust(2)  # по 2 кнопки в ряду
    return builder.as_markup()


def back_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="Назад", callback_data="menu:main")
    return builder.as_markup()
```

`InlineKeyboardBuilder` — удобный построитель клавиатур из aiogram. Метод `adjust(2)` равномерно раскладывает кнопки по 2 в ряд.

## Машина состояний (FSM)

FSM позволяет вести многошаговые диалоги с пользователем. Каждый шаг — отдельное состояние. Создайте `states/user_states.py`:

```python
from aiogram.fsm.state import State, StatesGroup


class RegistrationState(StatesGroup):
    waiting_for_name = State()
    waiting_for_age = State()
    waiting_for_city = State()
```

Создайте `handlers/messages.py`:

```python
from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from states.user_states import RegistrationState

router = Router()


@router.message(Command("register"))
async def cmd_register(message: Message, state: FSMContext):
    await state.set_state(RegistrationState.waiting_for_name)
    await message.answer("Введите ваше имя:")


@router.message(RegistrationState.waiting_for_name)
async def process_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text)
    await state.set_state(RegistrationState.waiting_for_age)
    await message.answer("Введите ваш возраст:")


@router.message(RegistrationState.waiting_for_age)
async def process_age(message: Message, state: FSMContext):
    if not message.text.isdigit():
        await message.answer("Пожалуйста, введите число:")
        return

    await state.update_data(age=int(message.text))
    await state.set_state(RegistrationState.waiting_for_city)
    await message.answer("Введите ваш город:")


@router.message(RegistrationState.waiting_for_city)
async def process_city(message: Message, state: FSMContext):
    await state.update_data(city=message.text)
    data = await state.get_data()

    summary = (
        f"Регистрация завершена!\n"
        f"Имя: {data['name']}\n"
        f"Возраст: {data['age']}\n"
        f"Город: {data['city']}"
    )
    await message.answer(summary)
    await state.clear()


@router.message(F.text)
async def handle_text(message: Message, state: FSMContext):
    current_state = await state.get_state()
    if current_state is None:
        await message.answer(
            "Не понимаю эту команду. Используй /help для списка команд."
        )
```

Фильтр `F.text` срабатывает на любое текстовое сообщение. Важно разместить этот обработчик последним: aiogram проверяет роутеры в порядке подключения, и более специфичные фильтры должны идти первыми.

## Middleware

Middleware выполняется до или после каждого обработчика. Используйте его для логирования, проверки прав доступа или ограничения частоты запросов:

```python
# middleware.py
from typing import Callable, Dict, Any, Awaitable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject
import logging

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        user = data.get("event_from_user")
        logger.info(f"Обновление от пользователя {user.id if user else 'unknown'}")
        result = await handler(event, data)
        return result
```

Регистрация middleware в `bot.py`:

```python
from middleware import LoggingMiddleware

dp.message.middleware(LoggingMiddleware())
dp.callback_query.middleware(LoggingMiddleware())
```

## Деплой через systemd

Для запуска бота на VPS как системного сервиса создайте файл `/etc/systemd/system/telegram-bot.service`:

```ini
[Unit]
Description=Telegram Bot
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/telegram-bot
EnvironmentFile=/opt/telegram-bot/.env
ExecStart=/opt/telegram-bot/venv/bin/python bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Активируйте и запустите сервис:

```bash
sudo systemctl daemon-reload
sudo systemctl enable telegram-bot
sudo systemctl start telegram-bot
sudo systemctl status telegram-bot
```

Просмотр логов в реальном времени:

```bash
sudo journalctl -u telegram-bot -f
```

## Деплой через Docker

Создайте `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "bot.py"]
```

Создайте `docker-compose.yml` с Redis для хранения состояний FSM между перезапусками:

```yaml
services:
  bot:
    build: .
    env_file: .env
    restart: unless-stopped
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://redis:6379/0

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

Чтобы использовать Redis вместо MemoryStorage, установите дополнительный пакет и обновите `bot.py`:

```bash
pip install aiogram[redis]
```

```python
from aiogram.fsm.storage.redis import RedisStorage
import os

storage = RedisStorage.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
dp = Dispatcher(storage=storage)
```

Запуск контейнеров:

```bash
docker compose up -d --build
docker compose logs -f bot
```

## Лимиты Telegram API и типичные ошибки

### Лимиты на отправку сообщений

Telegram ограничивает количество сообщений: не более 30 сообщений в секунду для всего бота и не более 1 сообщения в секунду для одного чата. При массовой рассылке добавляйте задержки:

```python
import asyncio

async def broadcast(bot: Bot, user_ids: list[int], text: str):
    for user_id in user_ids:
        try:
            await bot.send_message(user_id, text)
        except Exception as e:
            logger.error(f"Ошибка отправки {user_id}: {e}")
        await asyncio.sleep(0.05)  # 20 сообщений в секунду — безопасный темп
```

### Порядок роутеров

aiogram проверяет роутеры в порядке их подключения. Более специфичные обработчики должны быть зарегистрированы первыми:

```python
dp.include_router(commands_router)  # сначала команды
dp.include_router(messages_router)  # потом общие сообщения
```

### Обработка исходящих ошибок

Пользователь может заблокировать бота — при этом `send_message` выбросит `TelegramForbiddenError`. Всегда оборачивайте массовые отправки в `try/except`.

## Webhook вместо Polling

Polling — бот постоянно опрашивает серверы Telegram. Webhook — Telegram сам отправляет обновления на ваш URL. Webhook эффективнее для нагруженных ботов, но требует HTTPS-домена.

```python
from aiohttp import web
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application

WEBHOOK_URL = "https://your-domain.com/webhook"


async def on_startup(bot: Bot):
    await bot.set_webhook(WEBHOOK_URL)


async def on_shutdown(bot: Bot):
    await bot.delete_webhook()


async def main():
    bot = Bot(token=os.getenv("BOT_TOKEN"))
    dp = Dispatcher(storage=MemoryStorage())

    dp.include_router(commands_router)
    dp.include_router(messages_router)
    dp.startup.register(on_startup)
    dp.shutdown.register(on_shutdown)

    app = web.Application()
    handler = SimpleRequestHandler(dispatcher=dp, bot=bot)
    handler.register(app, path="/webhook")
    setup_application(app, dp, bot=bot)

    web.run_app(app, host="0.0.0.0", port=8080)
```

## Итог

Мы построили полноценного Telegram-бота на Python с aiogram 3:

- Настроили структуру проекта с разделением обработчиков, клавиатур и состояний
- Реализовали команды, инлайн-клавиатуры с callback-обработчиками
- Добавили многошаговые диалоги через FSM с хранением данных
- Добавили middleware для сквозного логирования
- Задеплоили бота через systemd и Docker с Redis

Чтобы уверенно работать с асинхронным Python и строить сложные приложения — изучите Python с нуля до продвинутого уровня на курсе PurpleSchool.

[Курс по Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=telegram-bot-python)
