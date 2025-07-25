---
metaTitle: Ubuntu в Docker
metaDescription: Узнайте, как установить и настроить Ubuntu в Docker - изучите процедуры создания и управления контейнерами на базе Ubuntu
author: Олег Марков
title: Ubuntu в Docker
preview: Изучите основные шаги и примеры по установке Ubuntu в Docker - от базовой настройки до создания и управления контейнерами
---

## Введение

В последние годы контейнеризация стала важной частью разработки и развертывания современных приложений. Одним из ведущих инструментов в этой области является Docker. Благодаря Docker можно запускать приложения в изолированных средах, которые называются контейнерами. Ubuntu, один из самых популярных дистрибутивов Linux, часто используется в качестве образа для этих контейнеров. Давайте рассмотрим, как вы можете работать с Ubuntu в Docker и какие возможности это открывает.

### Почему Ubuntu?

Ubuntu славится своей стабильностью, большим сообществом и множеством доступных пакетов. Использовать Ubuntu в Docker - это возможность объединить удобство и надежность этой операционной системы с гибкостью и изоляцией, которую предоставляет Docker.

Работа с Ubuntu в Docker подразумевает не только базовые команды, но и понимание принципов работы с образами, сетями и томами. Для эффективной работы важно знать, как правильно настраивать окружение и масштабировать приложения. Если вы хотите детальнее погрузиться в нюансы работы с Docker и Ubuntu, а также научиться автоматизировать развертывание приложений, приходите на наш большой курс [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Ubuntu_v_Docker). На курсе 159 уроков и 7 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Установка и настройка Docker

### Установка Docker

Прежде чем начать работу с Ubuntu в Docker, необходимо установить Docker. Docker можно установить на различных платформах, таких как Linux, Windows и MacOS.

#### Установка на Ubuntu

1. Обновите базу пакетов:

   ```bash
   sudo apt-get update
   ```

2. Установите пакеты, которые позволят настроить репозиторий:

   ```bash
   sudo apt-get install \
   apt-transport-https \
   ca-certificates \
   curl \
   gnupg \
   lsb-release
   ```

3. Добавьте официальный GPG-ключ Docker:

   ```bash
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
   ```

4. Добавьте репозиторий Docker:

   ```bash
   echo \
   "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   ```

5. Установите Docker Engine:

   ```bash
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io
   ```

6. Проверьте, что Docker установлен корректно, с помощью команды:

   ```bash
   sudo docker --version
   ```

### Установка Ubuntu в Docker

Теперь, когда Docker установлен, пришло время создать контейнер с Ubuntu.

#### Запуск контейнера с Ubuntu

1. Сначала скачайте образ Ubuntu из Docker Hub. Это делается с помощью команды `docker pull`. Например, для загрузки последней версии:

   ```bash
   sudo docker pull ubuntu
   ```

2. Далее, чтобы запустить контейнер, используйте команду `docker run`:

   ```bash
   sudo docker run -it ubuntu
   ```

   Здесь `-it` указывает Docker, что нужно запустить контейнер в интерактивном режиме и подключить терминал.

#### Управление контейнерами

Docker предоставляет различные команды для управления контейнерами:

- **Запуск контейнера**: Для запуска существующего контейнера используйте:

  ```bash
  sudo docker start <CONTAINER_ID>
  ```

- **Остановка контейнера**: Чтобы остановить контейнер, выполните:

  ```bash
  sudo docker stop <CONTAINER_ID>
  ```

- **Получение списка контейнеров**: Для отображения всех контейнеров используйте:

  ```bash
  sudo docker ps -a
  ```

- **Удаление контейнера**: Чтобы удалить контейнер, выполните:

  ```bash
  sudo docker rm <CONTAINER_ID>
  ```

### Использование Ubuntu в Docker

Когда вы работаете с контейнером Ubuntu, он ведет себя как полноценная операционная система. Вы можете устанавливать пакеты, настраивать конфигурации и запускать приложения внутри контейнера.

#### Установка пакетов

Для установки пакетов внутри контейнера используется менеджер пакетов `apt`. Например, для установки пакета `vim` выполните:

```bash
apt update
apt install vim
```

#### Перенос изменений в образ

Важной концепцией Docker является возможность фиксировать изменения контейнера в новый образ. Это делается через процесс, который называется "commit". Если вы установили и настроили все необходимое в контейнере и хотите сохранить эти изменения в виде нового образа, выполните:

```bash
sudo docker commit <CONTAINER_ID> my-ubuntu
```

Теперь вы создали новый образ `my-ubuntu`, который можно использовать для создания новых контейнеров.

## Заключение

Использование Ubuntu в Docker представляет собой мощный инструмент для разработчиков и системных администраторов, позволяя создавать изолированные, легко переносимые окружения для развертывания приложений. В этой статье мы рассмотрели основные шаги по установке и начальной работе с Ubuntu в Docker. Надеюсь, эти знания помогут вам эффективно использовать контейнеры в вашей работе.

Создание контейнеров на базе Ubuntu — это только начало пути. Чтобы полностью раскрыть потенциал Docker и научиться оркестрировать контейнеры, создавать сложные сети и безопасно развертывать приложения, вам потребуется комплексный подход. На нашем курсе [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Ubuntu_v_Docker) вы научитесь всему необходимому для работы с Docker, включая Docker Swarm, Docker Compose и интеграцию с Ansible для автоматизации развертывания. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Docker прямо сегодня и станьте экспертом.
