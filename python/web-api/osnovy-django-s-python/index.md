---
metaTitle: Основы Django с Python
metaDescription: Руководство по основам Django — установка, структура проекта, создание моделей, представлений и шаблонов, работа с базой данных и маршрутизацией.
author: Олег Марков
title: Основы Django с Python
preview: Изучаем основы Django — установка, структуры проекта, модели, представления, шаблоны, маршрутизация и работа с базой данных.
---

## Введение

Django — это популярный фреймворк Python для разработки веб-приложений. Он обеспечивает структурированный подход, включает ORM для работы с базой данных, систему маршрутизации, шаблоны и встроенные административные инструменты.

В этой статье мы разберём ключевые моменты работы с Django, от создания проекта до базовых моделей и представлений.

Если вы хотите детальнее погрузиться в Python и веб-разработку, приходите на курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=osnovy-django-s-python). На курсе 209 уроков и 34 упражнения, AI-тренажёры для практики с кодом, решение задач с ревью наставника и еженедельные встречи с менторами.

## Установка и создание проекта

Установите Django через pip:

```bash
pip install django
```

Создаём новый проект:

```bash
django-admin startproject myproject
cd myproject
python manage.py runserver
```

После запуска сервера на `http://127.0.0.1:8000/` будет доступна стартовая страница Django.

## Структура проекта

Основные директории:

* `manage.py` — скрипт для управления проектом.
* `myproject/` — конфигурация проекта, настройки, urls.py.
* `app/` — отдельные приложения, создаваемые через `python manage.py startapp appname`.

Каждое приложение содержит:

* `models.py` — модели данных.
* `views.py` — обработка запросов и формирование ответа.
* `urls.py` — маршруты внутри приложения.
* `templates/` — HTML-шаблоны для рендеринга страниц.

## Модели и база данных

Создаём модель пользователя:

```python
from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

Применяем миграции:

```bash
python manage.py makemigrations
python manage.py migrate
```

Django автоматически создаст таблицы в базе данных.

## Представления и маршруты

Простейшее представление:

```python
from django.http import HttpResponse

def home(request):
    return HttpResponse("Привет, Django!")
```

Маршрут для него:

```python
from django.urls import path
from .views import home

urlpatterns = [
    path('', home, name='home'),
]
```

## Шаблоны

Для отображения динамического контента используем HTML-шаблоны:

```html
<!-- templates/home.html -->
<h1>Привет, {{ user.name }}</h1>
```

В `views.py`:

```python
from django.shortcuts import render
from .models import User

def home(request):
    user = User.objects.first()
    return render(request, 'home.html', {'user': user})
```

## Практические советы

* Используйте виртуальное окружение для каждого проекта.
* Разделяйте логику на приложения.
* Настройте административную панель для удобного управления данными.
* Обязательно используйте `urls.py` для управления маршрутами.

## Заключение

Django упрощает разработку веб-приложений на Python, предоставляя встроенные инструменты для работы с данными, шаблонами и маршрутизацией. Изучение основ фреймворка позволяет быстро создавать структурированные и масштабируемые проекты.

Для комплексного освоения Python и веб-разработки рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=osnovy-django-s-python). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в Python и Django прямо сегодня.

## Частые ошибки

* Попытка хранить бизнес-логику в представлениях вместо моделей.
* Игнорирование миграций базы данных.
* Неправильное подключение шаблонов и статических файлов.

## Часто задаваемые вопросы

1. **Можно ли использовать Django для API?**
   Да, через Django REST Framework.

2. **Как добавить новое приложение в проект?**
   `python manage.py startapp appname` и подключить в `INSTALLED_APPS`.

3. **Как управлять пользователями?**
   Через модель `User` и встроенную административную панель.
