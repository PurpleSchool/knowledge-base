---
metaTitle: Развертывание n8n в Docker
metaDescription: Узнайте, как развернуть n8n в Docker - настройте автоматизацию задач с помощью контейнеризации и создайте оптимальные условия для работы
author: Олег Марков
title: Развертывание n8n в Docker
preview: Развертывание n8n в Docker - как автоматизировать процессы и управлять задачами с помощью контейнеров. Узнайте все шаги для успешного запуска и настройки
---

## Введение

n8n — это мощный инструмент автоматизации рабочих процессов, который позволяет соединять всевозможные API и приложения для создания интеграций и автоматизации задач. Docker, в свою очередь, предлагает простой и эффективный способ развертывания приложений в контейнерах, что позволяет обеспечить оптимальные условия для работы n8n. В этой статье мы рассмотрим, как развернуть n8n в Docker, чтобы вы могли легко начать автоматизировать свои процессы.

### Почему стоит использовать Docker для развертывания n8n?

Docker значительно упрощает управление окружением для вашего приложения, изолируя его от системы и минимизируя зависимость от конкретных настроек операционной системы. Этот подход позволяет значительно снизить риск возникновения проблем с совместимостью и облегчить масштабирование.

Развертывание n8n в Docker упрощает процесс настройки автоматизации, но для масштабирования и управления требуется оркестрация и автоматизация конфигурации. Если вы хотите детальнее погрузиться в Docker и научиться автоматизировать настройку n8n с помощью Ansible, а также создавать кластеры n8n в Docker Swarm, приходите на наш большой курс [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Razvertyvanie_n8n_v_Docker). На курсе 159 уроков и 7 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Преимущества использования n8n

- **Гибкость и расширяемость**: n8n предлагает широкий выбор готовых подключений и возможность создания собственных интеграций.
- **Автоматизация**: Позволяет легко автоматизировать повседневные задачи и процессы.
- **Интуитивный интерфейс**: Интерфейс n8n прост в использовании и помогает легко создавать сложные рабочие потоки.

## Подготовка к развертыванию n8n в Docker

Перед тем как начать, убедитесь, что у вас установлены Docker и Docker Compose. Эти инструменты необходимы для работы с контейнерами и управления ними.

### Установка Docker

Docker можно установить на большинстве операционных систем, следуя инструкциям на [официальном сайте Docker](https://docs.docker.com/get-docker/).

### Установка Docker Compose

Docker Compose используется для управления многоконтейнерными приложениями и может быть установлен с помощью менеджера пакетов вашей операционной системы или следуя инструкциям на [официальной странице установки Docker Compose](https://docs.docker.com/compose/install/).

## Развертывание n8n с использованием Docker

Теперь, когда у нас есть все необходимые инструменты, давайте развернем n8n в Docker.

### Создание Docker Compose файла

Для начала создадим файл `docker-compose.yml`, который будет описывать нашу конфигурацию контейнеров:

```yaml
version: '3'

services:
  n8n:
    image: n8nio/n8n
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgresdb
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=user
      - DB_POSTGRESDB_PASSWORD=pass
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=<your_username>
      - N8N_BASIC_AUTH_PASSWORD=<your_password>
    ports:
      - "5678:5678"
    volumes:
      - ~/.n8n:/home/node/.n8n

  postgresdb:
    image: postgres:11
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: n8n
    ports:
      - '5432:5432'
```

### Пояснения к Docker Compose файлу

- **services**: Здесь мы определяем сервисы для n8n и базы данных PostgreSQL.
- **image**: Используем образом `n8nio/n8n` для n8n и `postgres:11` для PostgreSQL.
- **environment**: Переменные среды, такие как тип базы данных (`DB_TYPE`), используемое имя пользователя и пароль. Обратите внимание, для n8n требуется прямой доступ к базе данных.
- **ports**: Определяем, какие порты будут доступны извне.
- **volumes**: Указываем, где будут храниться данные.

Теперь вы можете запустить команду `docker-compose up` в той же директории, где находится ваш `docker-compose.yml`. Это создаст и запустит контейнеры n8n и базы данных.

### Настройка окружения

После запуска контейнеров, веб-интерфейс n8n будет доступен по адресу `http://localhost:5678`.

#### Авторизация

n8n поддерживает базовую авторизацию, которая может быть включена с помощью переменных среды `N8N_BASIC_AUTH_ACTIVE`, `N8N_BASIC_AUTH_USER` и `N8N_BASIC_AUTH_PASSWORD`. Это предоставляет дополнительный уровень безопасности для вашего интерфейса.

### Завершение настройки

После успешного подключения к интерфейсу, вы можете настроить свои первые рабочие процессы. Например, вы можете использовать уже существующие интеграции с популярными сервисами, такими как Slack, Google Sheets, или создать свои собственные.

## Заключение

Развертывание n8n с помощью Docker значительно упрощает задачу создания сред автоматизации с минимальными усилиями и максимальной гибкостью. Docker обеспечивает замкнутость и изоляцию окружения выполнения, что идеально подходит для стабильной работы n8n. Теперь у вас есть все необходимые знания для того, чтобы развернуть и настроить n8n в Docker и начать автоматизировать свои рабочие процессы, экономя время и увеличивая продуктивность.

Развертывание n8n в Docker – это удобно, но для production-окружения требуется автоматизация. На нашем курсе [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Razvertyvanie_n8n_v_Docker) вы научитесь использовать Ansible для автоматической настройки n8n и Docker Swarm для создания отказоустойчивого кластера. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Docker прямо сегодня и узнайте, как автоматизировать развертывание и управление контейнерами.
