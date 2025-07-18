---
metaTitle: Использование томов в Docker
metaDescription: Узнайте, как эффективно использовать тома в Docker для долговременного хранения данных и улучшения управления контейнерами
author: Олег Марков
title: Использование томов в Docker
preview: Исследуйте возможности томов в Docker - от концепции до реализации. Пошаговые примеры и пояснения помогут вам разобраться в их использовании для хранения данных
---

## Введение

Работа с данными — это важная часть любой серьёзной микросервисной архитектуры. Docker предоставляет мощный инструмент для управления данными своих контейнеров — тома. Но зачем они нужны, если данные можно хранить прямо в контейнере? Ответ прост: контейнеры временны, в то время как данные часто требуют долговременного хранения. Тома Docker помогают эффективно и гибко решать эту задачу.

## Что такое тома в Docker

Тома в Docker — это способ постоянного хранения данных, которые могут быть использованы одним или несколькими контейнерами. По сути, тома предоставляют контейнерам доступ к внешнему месту хранения, которое не удаляется, когда контейнер перестает существовать.

Тома – это важная часть работы с Docker, но для полного контроля над окружением необходимо уметь настраивать сети, создавать собственные образы и использовать Docker Compose. Если вы хотите детальнее погрузиться в мир Docker — приходите на наш большой курс [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Ispolzovanie_tomov_v_Docker). На курсе 159 уроков и 7 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Преимущества использования томов

Смотрите, использование томов имеет ряд ключевых преимуществ:

- **Долговременное хранение**: В отличие от данных, хранящихся непосредственно внутри контейнера, тома не удаляются при его остановке или удалении. Это значит, что вы можете сохранять свои данные между запусками контейнера.

- **Универсальный доступ**: Тома могут быть примонтированы к нескольким контейнерам одновременно, что позволяет делиться данными между ними.

- **Простота использования**: Docker автоматически управляет томами, максимально упрощая процесс их создания и использования.

## Типы томов

Существует несколько типов томов, которые можно использовать в Docker. Позвольте мне объяснить различия между ними.

### Docker Volumes

Docker Volumes — это стандартный инструмент управления данными в Docker. Они хранятся в специальной директории Docker на хосте и используют такие же преимущества файловой системы, как и другие приложения на хосте.

#### Как создать и использовать Docker Volume

Давайте разберемся на примере, как создать и использовать Docker Volume:

```bash
# Создаем новый том
docker volume create my_volume
```

Теперь давайте подключим его к контейнеру:

```bash
# Подключаем том my_volume к контейнеру
docker run -d -v my_volume:/app/data my_image
```

- Здесь `my_volume` — это имя тома, а `/app/data` — это путь внутри контейнера, к которому том примонтирован.

### Bind Mounts

Bind Mounts позволяют связывать точку внутри контейнера с любой директорией на вашем хосте. Это весьма мощный инструмент, позволяющий интегрировать абсолютно любые данные, доступные на вашем сервере, внутрь контейнера.

#### Пример использования Bind Mounts

Теперь вы увидите, как это выглядит в коде:

```bash
# Примонтируем локальную директорию /host/data к контейнеру
docker run -d -v /host/data:/app/data my_image
```

- Обратите внимание, как этот фрагмент кода позволяет контейнеру использовать данные из директории `/host/data` на вашем хосте.

### tmpfs Mounts

Этот тип подключения хранит данные только в памяти и сбрасывается при перезапуске контейнера. tmpfs монтирования полезны, когда нужно временно хранить данные, которые должны быть быстрыми в записи и чтении, например, для тестирования.

```bash
# Используем tmpfs для временного хранения данных
docker run -d --tmpfs /app/data my_image
```

- В этом примере данные в `/app/data` чистятся после завершения работы контейнера.

## Управление томами

Теперь давайте поговорим о том, как управлять томами в Docker. Вы можете использовать простые команды для управления ими.

### Список томов

Для просмотра всех доступных томов используйте:

```bash
docker volume ls
```

- Эта команда выводит список всех томов, доступных на вашем Docker-хосте.

### Удаление томов

Когда том больше не нужен, его можно удалить:

```bash
# Удаляем том my_volume
docker volume rm my_volume
```

- Здесь вы удаляете том `my_volume`, и он уже не будет доступен для использования.

### Очистка неиспользуемых томов

Docker позволяет автоматически очищать неиспользуемые тома:

```bash
docker volume prune
```

- Обратите внимание, что эта команда удаляет только те тома, которые больше не используются ни одним из контейнеров.

Заключение

Тома Docker предоставляют отличную возможность для долговременного безопасного хранения данных вне зависимости от цикла жизни контейнеров. Они упрощают сложные сценарии обмена данными между контейнерами и гарантируют, что ваши данные будут сохранены и доступны в любой момент. С практическими примерами, приведёнными в этой статье, вы теперь сможете более уверенно использовать тома в Docker и улучшать управление вашими приложениями и данными.

Использование томов значительно упрощает работу с данными в Docker, но для развертывания сложных приложений в production требуется оркестрация и автоматизация. На нашем курсе [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Ispolzovanie_tomov_v_Docker) вы изучите, как создавать Docker Swarm кластеры, использовать Ansible для автоматизации развертывания и строить системы мониторинга. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Docker и Ansible прямо сегодня.
