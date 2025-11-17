---
metaTitle: Создание интерфейсов Python QT
metaDescription: Руководство по разработке графических интерфейсов на Python с использованием PyQt — создание окон, виджетов, меню, сигналов и слотов.
author: Олег Марков
title: Создание интерфейсов Python QT
preview: Изучаем создание GUI на Python с PyQt — окна, кнопки, поля ввода, обработка событий и структура приложений для профессиональной разработки.
---

## Введение

PyQt — это мощная библиотека для разработки графических интерфейсов на Python. Она предоставляет инструменты для создания оконных приложений с множеством виджетов, меню, диалогов и сложной логики взаимодействия. PyQt основан на популярном фреймворке Qt, что позволяет создавать профессиональные кроссплатформенные приложения.

В этой статье мы разберём основные возможности PyQt: создание окна, добавление виджетов, сигналов и слотов, обработку событий и построение структуры приложения.

Если вы хотите глубже изучить Python и научиться создавать качественные графические интерфейсы с практическими проектами, приходите на курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-interfeysov-python-qt). На курсе 209 уроков и 34 упражнения, AI-тренажёры для практики с кодом, решение задач с ревью наставника и еженедельные встречи с менторами.

## Установка PyQt

Для установки PyQt используйте pip:

```bash
pip install PyQt5
```

Проверим установку:

```bash
python -c "from PyQt5.QtWidgets import QApplication; print('PyQt5 установлена')"
```

## Создание окна

Минимальное приложение с окном выглядит так:

```python
import sys
from PyQt5.QtWidgets import QApplication, QWidget

app = QApplication(sys.argv)
window = QWidget()
window.setWindowTitle("Пример PyQt")
window.resize(400, 300)
window.show()
sys.exit(app.exec_())
```

* `QApplication` — основной объект приложения.
* `QWidget` — базовое окно.
* `show()` отображает окно.
* `app.exec_()` запускает цикл обработки событий.

## Добавление виджетов

Добавим кнопку и метку:

```python
from PyQt5.QtWidgets import QLabel, QPushButton, QVBoxLayout

label = QLabel("Привет, PyQt!")
button = QPushButton("Нажми меня")

layout = QVBoxLayout()
layout.addWidget(label)
layout.addWidget(button)
window.setLayout(layout)

def on_click():
    label.setText("Кнопка нажата")

button.clicked.connect(on_click)
```

* `QVBoxLayout` размещает элементы вертикально.
* `clicked.connect()` связывает сигнал с функцией-обработчиком.

## Обработка событий

Сигналы и слоты — основа взаимодействия в PyQt. События, такие как нажатие кнопки или ввод текста, вызывают функции-слоты:

```python
def on_text_change(text):
    label.setText(f"Вы ввели: {text}")

text_input = QLineEdit()
text_input.textChanged.connect(on_text_change)
layout.addWidget(text_input)
```

`textChanged` сигнализирует о любом изменении текста в поле `QLineEdit`.

## Комплексные интерфейсы

PyQt позволяет создавать сложные окна с меню, диалогами и вкладками. Пример создания меню:

```python
from PyQt5.QtWidgets import QMenuBar, QAction

menu_bar = QMenuBar(window)
file_menu = menu_bar.addMenu("Файл")
exit_action = QAction("Выход", window)
exit_action.triggered.connect(app.quit)
file_menu.addAction(exit_action)
```

Меню можно комбинировать с другими виджетами и макетами.

## Заключение

PyQt позволяет создавать профессиональные графические интерфейсы на Python: окна, кнопки, поля ввода, меню, вкладки, обработку событий и сложную логику приложения. Освоив PyQt, вы сможете разрабатывать кроссплатформенные десктопные приложения с современным интерфейсом.

Для системного изучения Python и практического создания GUI с PyQt рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-interfeysov-python-qt). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Python и графических интерфейсов прямо сегодня.

## Частые ошибки

* Забыт вызов `show()` у окна.
* Несовместимое использование макетов (например, `QVBoxLayout` с `QHBoxLayout` без контейнера).
* Прямое изменение GUI из другого потока без `QThread` или сигналов.

## Часто задаваемые вопросы

1. **Можно ли комбинировать PyQt и Tkinter?**
   Обычно не рекомендуется — лучше использовать один фреймворк для приложения.

2. **Как работать с изображениями и графикой?**
   Используйте `QLabel` с `QPixmap` или `QGraphicsView`.

3. **Подходит ли PyQt для коммерческих проектов?**
   Да, при соблюдении лицензии (PyQt5 GPL или коммерческая лицензия).
