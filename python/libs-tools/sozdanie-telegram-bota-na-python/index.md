---
metaTitle: Создание бота на Python
metaDescription: Пошаговое руководство по созданию ботов на Python — установка, обработка команд, взаимодействие с пользователями и управление данными.
author: Олег Марков
title: Создание бота на Python
preview: Научитесь создавать ботов на Python — от установки до обработки команд и работы с пользовательскими данными.
---

## Введение

Боты на Python позволяют автоматизировать рутинные задачи, обрабатывать сообщения пользователей и взаимодействовать с внешними сервисами. В этой статье мы разберём процесс создания бота, подключение к API, обработку команд и хранение данных.

Если вы хотите детальнее погрузиться в Python и изучить практическое создание ботов с живым кодом и примерами, приходите на курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-bota-na-python). На курсе 209 уроков и 34 упражнения, AI-тренажёры для безлимитной практики с кодом, решение задач с ревью наставника и еженедельные встречи с менторами.

## Установка и настройка бота

Для работы с ботом понадобится библиотека `python-telegram-bot`:

```bash
pip install python-telegram-bot
```

Создайте бота через BotFather и получите токен. Подключение к Python-скрипту:

```python
from telegram import Update
from telegram.ext import Updater, CommandHandler, CallbackContext

def start(update: Update, context: CallbackContext):
    update.message.reply_text('Привет! Я ваш бот.')

updater = Updater('ВАШ_ТОКЕН', use_context=True)
updater.dispatcher.add_handler(CommandHandler('start', start))

updater.start_polling()
updater.idle()
```

## Обработка команд и сообщений

Для команд используем `CommandHandler`, для текста — `MessageHandler`:

```python
from telegram.ext import MessageHandler, Filters

def echo(update: Update, context: CallbackContext):
    update.message.reply_text(update.message.text)

updater.dispatcher.add_handler(MessageHandler(Filters.text & ~Filters.command, echo))
```

## Работа с клавиатурами

Интерактивные кнопки делают бота удобным:

```python
from telegram import ReplyKeyboardMarkup

keyboard = [['Привет', 'Помощь']]
markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
update.message.reply_text('Выберите вариант:', reply_markup=markup)
```

## Хранение данных пользователей

Для сохранения состояния можно использовать словари или базы данных:

```python
user_data = {}

def save_name(update: Update, context: CallbackContext):
    user_id = update.message.from_user.id
    user_data[user_id] = update.message.text
```

## Интеграция с внешними сервисами

Бот может обращаться к API, получать данные и отвечать пользователю:

```python
import requests

def get_data(update: Update, context: CallbackContext):
    response = requests.get('https://api.example.com/data').json()
    update.message.reply_text(f"Данные: {response['value']}")
```

## Заключение

Создание ботов на Python позволяет автоматизировать общение с пользователями, интегрироваться с внешними сервисами и хранить данные. Настройка API, команды, клавиатуры и обработка сообщений — основные шаги для полноценного бота.

Для системного изучения Python и практического создания ботов, работы с API, клавиатурами и хранением данных рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-bota-na-python). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Python и разработку ботов прямо сегодня.

## Частые ошибки

* Неправильный токен от BotFather.
* Отсутствие фильтров при обработке команд и сообщений.
* Забыт `updater.idle()`, что может завершить работу бота преждевременно.

## Часто задаваемые вопросы

1. **Можно ли запускать бота круглосуточно?**
   Да, через VPS или облачные сервисы.

2. **Как хранить пользовательские данные?**
   Используйте словари для простого случая или базы данных для сложного.

3. **Поддерживаются ли файлы и медиа?**
   Да, можно отправлять и получать фотографии, видео и документы через API.
