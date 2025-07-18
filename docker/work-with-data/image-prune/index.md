---
metaTitle: Как использовать Image prune в Docker
metaDescription: Изучите возможности команды image prune в Docker - как она работает и помогает очищать ненужные образы
author: Алексей Ковалев
title: Возможности команды image prune в Docker
preview: Узнайте как эффективно использовать команду image prune в Docker чтобы управлять и очищать ненужные образы. Практические примеры и объяснения
---

## Введение

Управление контейнеризацией может стать значительно сложнее, если вы не придерживаетесь порядка в вашем окружении. Docker, будучи одним из ведущих инструментов для контейнеризации, предлагает различные команды для управления образами и контейнерами. Одной из таких полезных команд является `image prune`. Эта команда автоматически удаляет ненужные образы из вашего локального репозитория, освобождая ресурсы вашей системы, что особенно важно в условиях ограниченных возможностей хранения.

## Что такое Docker Image Prune?

Прежде чем приступить к конкретным примерам, давайте разберем, что же в точности делает `docker image prune`. Эта команда используется для удаления неиспользуемых образов Docker. То есть, если у вас имеются образы, которые не связаны ни с какими запущенными контейнерами, `image prune` может помочь очистить их.

Команда `image prune` помогает очищать неиспользуемые образы, но для эффективного управления Docker важно не только удалять неиспользуемые образы, но и автоматизировать их создание и развертывание. На курсе [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Vozmozhnosti_komandy_image_prune_v_Docker) вы узнаете, как использовать Ansible для автоматизации сборки Docker-образов, их хранения в Docker Registry и развертывания на различных окружениях, а также для автоматической очистки устаревших образов. На курсе 159 уроков и 7 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Основные возможности

Команда `docker image prune` предлагает следующие возможности:

1. **Удаление всех неиспользуемых образов** – по умолчанию команда удаляет только те образы, которые не связаны с контейнерами.
   
2. **Фильтрация образов для удаления** – вы можете уточнять, какие именно образы хотите удалить, используя опции фильтра.

3. **Режим принудительного удаления** – позволяет удалять образы без подтверждения пользователя, что удобно для автоматизации процессов.

## Как работает команда Image Prune

Теперь давайте перейдем к подробностям работы и примера использования команды `docker image prune`.

### Простое удаление всех неиспользуемых образов

Начнем с базового примера. Чтобы удалить все неиспользуемые образы, выполните следующую команду:

```bash
docker image prune
```
Когда вы вводите эту команду, Docker попросит вас подтвердить действие. Это нужно для предотвращения случайного удаления образов.

### Принудительное удаление с флагом -f

Если вы хотите автоматизировать процесс и не желаете каждый раз подтверждать удаление, используйте флаг `-f`, который отменяет необходимость подтверждения:

```bash
docker image prune -f
```

### Фильтрация образов

Docker предлагает фильтрацию, которая дает вам больше контроля над тем, какие именно образы должны быть удалены. Например, вы можете удалить только те образы, которые были созданы более недели назад. Для этого используйте флаг `--filter`. Смотрите, как это выглядит:

```bash
docker image prune --filter "until=168h"  # 168 часов – это 7 дней
```

### Поддержка Cron или других планировщиков

Учитывая, что вы можете автоматизировать очистку использованных образов, используя флаг `-f`, давайте подумаем о том, как настроить регулярное выполнение этой команды. Для этого можно воспользоваться планировщиком задач, например, `cron` в UNIX-подобных системах. Вы можете добавлять команду `docker image prune -f` в cron job для автоматического выполнения раз в неделю или месяц.

```bash
# Добавляем правило в cron для еженедельного выполнения
0 0 * * 0 docker image prune -f
```

## Заключение

Команда `docker image prune` — это мощный инструмент для поддержания порядка в вашем Docker окружении. Она помогает избавляться от всего лишнего и освобождать системные ресурсы, что делает её незаменимой в практике DevOps’а. Надеюсь, данная статья помогла вам лучше понять, как использовать эту команду в повседневной работе и интегрировать её в ваши процессы управления контейнерами.

Использование команды `image prune` полезно для очистки Docker, но для автоматизации процесса очистки и управления образами требуется Ansible. На курсе [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Vozmozhnosti_komandy_image_prune_v_Docker) вы научитесь создавать плейбуки Ansible для автоматического анализа Docker-образов, их проверки на предмет устарелости и удаления. Вы также научитесь настраивать автоматическую очистку Docker с помощью cron и Ansible. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Docker и Ansible прямо сегодня.
