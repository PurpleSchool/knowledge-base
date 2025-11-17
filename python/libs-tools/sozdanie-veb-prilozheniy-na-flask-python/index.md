---
metaTitle: Создание веб-приложений на Flask Python
metaDescription: Полный гайд по созданию веб-приложений на Flask — установка, маршруты, шаблоны, работа с формами и базами данных. Практические примеры на Python.
author: Олег Марков
title: Создание веб-приложений на Flask Python
preview: Изучаем создание веб-приложений на Flask — маршруты, шаблоны, формы, базы данных и развертывание приложений на Python.
---

## Введение

Flask — лёгкий и гибкий фреймворк для создания веб-приложений на Python. Он предоставляет минимальный набор инструментов для работы с HTTP-запросами, шаблонами и маршрутизацией, позволяя разработчику строить приложения без излишней нагрузки.

В этой статье мы разберём основы работы с Flask: установку, создание маршрутов, работу с шаблонами и формами, интеграцию с базами данных.

Если вы хотите детальнее погрузиться в Python и создавать полноценные веб-приложения с практическими проектами, приходите на курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-veb-prilozheniy-na-flask-python). На курсе 209 уроков и 34 упражнения, AI-тренажёры для безлимитной практики с кодом, решение задач с ревью наставника и еженедельные встречи с менторами.

## Установка Flask

Для начала установим Flask через pip:

```bash
pip install flask
```

Создаём минимальное приложение:

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return 'Привет, Flask!'

if __name__ == '__main__':
    app.run(debug=True)
```

* `@app.route('/')` задаёт маршрут для главной страницы.
* `app.run(debug=True)` запускает сервер в режиме отладки.

## Работа с маршрутами

Flask позволяет создавать несколько маршрутов:

```python
@app.route('/about')
def about():
    return 'О приложении'

@app.route('/user/<username>')
def user_profile(username):
    return f'Профиль пользователя: {username}'
```

Переменные в маршрутах (`<username>`) позволяют динамически формировать страницы.

## Шаблоны и Jinja2

Flask использует Jinja2 для работы с HTML-шаблонами. Создаём папку `templates` и файл `index.html`:

```html
<!doctype html>
<html>
  <head><title>{{ title }}</title></head>
  <body>
    <h1>{{ message }}</h1>
  </body>
</html>
```

В коде приложения:

```python
from flask import render_template

@app.route('/')
def home():
    return render_template('index.html', title='Главная', message='Привет, Flask!')
```

## Работа с формами

Flask позволяет обрабатывать формы через POST-запросы:

```python
from flask import request

@app.route('/form', methods=['GET', 'POST'])
def form_example():
    if request.method == 'POST':
        name = request.form['name']
        return f'Привет, {name}!'
    return '''
        <form method="post">
            <input name="name">
            <input type="submit">
        </form>
    '''
```

## Интеграция с базами данных

Для работы с базой данных можно использовать SQLAlchemy:

```bash
pip install flask_sqlalchemy
```

Пример простой модели:

```python
from flask_sqlalchemy import SQLAlchemy

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
```

Создаём базу данных:

```python
with app.app_context():
    db.create_all()
```

## Развертывание приложения

Flask-приложение можно запускать на сервере с помощью WSGI-сервера, например, Gunicorn:

```bash
pip install gunicorn
gunicorn app:app
```

Это позволит обслуживать приложение в продакшн-режиме.

## Заключение

Flask предоставляет удобные инструменты для быстрого создания веб-приложений, работы с маршрутами, шаблонами, формами и базами данных. Освоив основы, можно строить масштабируемые сервисы, интегрировать API и разворачивать приложения на сервере.

Для полноценного изучения Python и практического создания веб-приложений с Flask, работы с формами, шаблонами и базами данных рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-veb-prilozheniy-na-flask-python). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Python и веб-разработки прямо сегодня.

## Частые ошибки

* Не создание папки `templates` для HTML-шаблонов.
* Неправильная настройка маршрутов с переменными.
* Использование SQLite в многопользовательских приложениях без правильной конфигурации.

## Часто задаваемые вопросы

1. **Можно ли подключать внешние API к Flask?**
   Да, Flask легко интегрируется с внешними сервисами через `requests` или другие библиотеки.

2. **Как обрабатывать формы безопасно?**
   Используйте POST-запросы и проверку данных через `request.form`.

3. **Можно ли разворачивать Flask на VPS или облаке?**
   Да, рекомендуется использовать WSGI-серверы, такие как Gunicorn, вместе с Nginx.
