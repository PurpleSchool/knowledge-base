---
metaTitle: Настройка портов в Docker
metaDescription: В этой статье мы подробно рассмотрим как настроить порты в Docker - вы узнаете как подключать контейнеры к сети и управлять маршрутизацией трафика между контейнерами и хостом
author: Олег Марков
title: Настройка портов в Docker
preview: Порты играют ключевую роль в работе с Docker - узнайте как правильно настроить маршрутизацию трафика и подключение контейнеров к сети
---

## Введение

Добро пожаловать в мир контейнеризации! Если вы начинающий пользователь Docker, то, вероятно, задавались вопросом, как же связать ваши приложения с внешним миром. Порты играют ключевую роль в этой задаче, позволяя маршрутизировать трафик между контейнерами и системой хоста. Сегодня вы узнаете, как настроить порты в Docker, чтобы ваши приложения могли без проблем обмениваться данными с внешними сервисами и устраивать коммуникацию между контейнерами.

### Что такое порты в Docker

В контексте Docker порты используются для установления связи между контейнером и внешними сервисами. Контейнеры Docker изначально изолированы от сети, и чтобы предоставить к ним доступ извне, необходимо сопоставить (пробросить) порты контейнера с портами системы, на которой он выполняется.

## Настройка портов в Docker

Чтобы начать использование портов в Docker, вам нужно понимать основные концепции и знать, какие команды помогут настроиться все оптимально. Давайте изучим это шаг за шагом.

Настройка портов - важная часть работы с Docker, но для построения сложных сетевых конфигураций необходимо понимать, как работают Docker сети, как использовать bridge networks и overlay networks. Если вы хотите детальнее погрузиться в Docker — приходите на наш большой курс [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Nastroyka_portov_v_Docker). На курсе 159 уроков и 7 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Проброс портов

Проброс портов (или порт-маппинг) — это процесс, посредством которого вы связываете порт контейнера с портом хоста. Это позволяет извне обращаться к контейнеру через заданный порт. Давайте разберемся на примерах.

#### Основной синтаксис

Для проброса порта Docker используется флаг `-p` в команде `docker run`. Смотрите, я покажу вам, как это работает:

```bash
docker run -p 8080:80 my_docker_image
```

// В этом примере порт 80 контейнера сопоставляется с портом 8080 хоста
// Это позволяет внешним пользователям обращаться к вашему приложению через http://yourhost:8080

Как видите, синтаксис довольно прост: первым указывается порт хоста, затем порт контейнера.

#### Проброс нескольких портов

В случае, если вам требуется несколько портов, просто добавляйте дополнительный флаг `-p` для каждого из них:

```bash
docker run -p 8080:80 -p 443:443 my_docker_image
```

// Здесь мы публикуем два порта: 80 и 443 контейнера становятся доступными на портах 8080 и 443 хоста

#### Использование краткого синтаксиса

Также возможен более компактный синтаксис:

```bash
docker run -p 8080:80 my_docker_image
```

// Эта команда автоматически сопоставляет порты, используя свободные порты хоста и выводит их на консоль

### Docker Compose и порты

Если вы работаете с Docker Compose, у вас также есть возможность управлять портами через файл `docker-compose.yml`. Давайте посмотрим, как это реализовано на практике.

#### Пример конфигурации

```yaml
version: '3'
services:
  web:
    image: my_docker_image
    ports:
      - "8080:80"
```

// В этом YAML файле сервис web использует образ my_docker_image
// Порт 80 контейнера публикуется на порту 8080 хоста

#### Публикация динамического порта

Если вы хотите, чтобы Docker сам назначал доступный порт на хосте, можно задать лишь порт контейнера:

```yaml
ports:
  - "80"
```

// Динамически назначает свободный порт хоста и сопоставляет его с портом 80 контейнера

## Заключение

Понимание того, как настроить и использовать порты в Docker, — ключ к успешной контейнеризации ваших приложений. Мы рассмотрели, как пробрасывать порты при помощи командной строки и Docker Compose, что позволит вам с легкостью развернуть и обеспечить доступ к вашим сервисам извне. Используя полученные знания, вы сможете с уверенностью управлять сетевыми настройками ваших контейнеров, создавая гибкие и масштабируемые приложения.

Настройка портов позволяет подключить контейнеры к сети, но для построения масштабируемых систем необходимы знания о Docker Swarm и Ansible. На нашем курсе [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Nastroyka_portov_v_Docker) вы получите все необходимые навыки. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Docker прямо сегодня и узнайте, как автоматизировать развертывание и управление контейнерами.
