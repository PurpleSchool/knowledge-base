---
metaTitle: Создание игр с Pygame
metaDescription: Руководство по созданию 2D-игр на Python с использованием Pygame — установка, основная структура, спрайты, обработка событий и игровой цикл.
author: Олег Марков
title: Создание игр с Pygame
preview: Изучаем разработку 2D-игр на Python с Pygame — создание игрового окна, спрайтов, управление событиями и организация игрового цикла.
---

## Введение

Pygame — это библиотека на Python для создания 2D-игр и мультимедийных приложений. Она предоставляет инструменты для работы с графикой, звуком, обработкой событий и управлением игровым циклом.

В этой статье мы разберём, как создать базовую структуру игры на Pygame: окно игры, спрайты, обработку клавиш и событий, а также организацию игрового цикла.

Если вы хотите детально освоить Python и применять знания на практике в создании игр, приходите на курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-igr-s-pygame). На курсе 209 уроков и 34 упражнения, AI-тренажёры для практики с кодом, решение задач с ревью наставника и еженедельные встречи с менторами.

## Установка Pygame

Для установки используйте pip:

```bash
pip install pygame
```

Проверка установки:

```python
import pygame
print(pygame.ver)
```

## Создание игрового окна

Базовое окно игры создаётся так:

```python
import pygame
pygame.init()

screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Моя игра")

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

pygame.quit()
```

* `pygame.init()` инициализирует все модули Pygame.
* `set_mode` создаёт окно с заданными размерами.
* Цикл `while running` обрабатывает события.

## Добавление спрайтов

Спрайты — это объекты игры (персонажи, враги, предметы):

```python
player = pygame.image.load("player.png")
player_rect = player.get_rect()
player_rect.topleft = (100, 100)

screen.blit(player, player_rect)
pygame.display.update()
```

* `get_rect()` создаёт прямоугольник для управления позицией.
* `blit()` рисует спрайт на экране.
* `pygame.display.update()` обновляет окно.

## Обработка клавиш

Чтобы управлять спрайтом, используем клавиатуру:

```python
keys = pygame.key.get_pressed()
if keys[pygame.K_LEFT]:
    player_rect.x -= 5
if keys[pygame.K_RIGHT]:
    player_rect.x += 5
```

`key.get_pressed()` возвращает состояние всех клавиш.

## Игровой цикл

Игровой цикл объединяет обработку событий, обновление состояния и рендеринг:

```python
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]:
        player_rect.x -= 5

    screen.fill((0, 0, 0))  # очистка экрана
    screen.blit(player, player_rect)
    pygame.display.update()
```

## Заключение

Pygame позволяет создавать простые 2D-игры на Python с обработкой спрайтов, событий и игрового цикла. Освоив Pygame, вы сможете создавать интерактивные приложения, обучающие программы и небольшие игры.

Для системного изучения Python и практического создания игр рекомендуем курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-igr-s-pygame). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Python и игровых приложений прямо сегодня.

## Частые ошибки

* Забывают обновлять экран через `pygame.display.update()`.
* Прямое перемещение спрайтов без контроля границ окна.
* Не обрабатывают события выхода (`QUIT`), из-за чего окно зависает.

## Часто задаваемые вопросы

1. **Можно ли добавлять звук и музыку?**
   Да, с помощью `pygame.mixer.Sound` и `pygame.mixer.music`.

2. **Можно ли использовать Pygame для 3D-игр?**
   Pygame предназначен для 2D. Для 3D лучше использовать библиотеки вроде Panda3D или Unity с Python-обёрткой.

3. **Как организовать несколько спрайтов и слои?**
   Используйте `pygame.sprite.Group` и методы `update()` и `draw()` для групп объектов.
