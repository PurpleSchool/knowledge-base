---
metaTitle: Установка и настройка ZoneMinder в контейнере Docker
metaDescription: Узнайте, как легко установить и настроить ZoneMinder в контейнере Docker - от базовой конфигурации до адаптации под ваши нужды
author: Алексей Иванов
title: Установка и настройка ZoneMinder в контейнере Docker
preview: Откройте для себя возможность установки ZoneMinder в контейнере Docker - полное руководство с примерами и пояснениями для начинающих и опытных пользователей
---

## Введение

ZoneMinder - это мощное и гибкое программное обеспечение для управления видеонаблюдением, которое позволяет записывать, просматривать и управлять камерами видеонаблюдения. Развертывание ZoneMinder в контейнере Docker упрощает процесс установки и управления им, предоставляя быстрое и безопасное решение для работы с вашими камерами.

Docker - это среда контейнеризации, которая позволяет создавать, разворачивать и запускать приложения в изолированных контейнерах. Использование Docker для развертывания ZoneMinder позволяет избежать проблем с зависимостями и облегчает обновление и масштабирование системы.

## Установка Docker

Прежде всего, вам нужно установить Docker на вашей системе. Для этого выполните следующие шаги, которые подойдут для большинства дистрибутивов на базе Linux:

```sh
# Обновите список пакетов системы
sudo apt-get update

# Установите пакеты, необходимые для добавления нового репозитория
sudo apt-get install apt-transport-https ca-certificates curl software-properties-common

# Добавьте ключ GPG для официального репозитория Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Добавьте репозиторий Docker CE в списки пакетов
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

# Еще раз обновите список пакетов системы
sudo apt-get update

# Установите Docker
sudo apt-get install docker-ce
```

После установки Docker, убедитесь, что он успешно работает, выполнив команду:

```sh
# Проверяем версию Docker
docker --version
```

## Настройка Docker-Compose

Docker-Compose - это инструмент, который позволяет вам определить и управлять многоконтейнерными Docker приложениями. Для установки Docker-Compose выполните следующую команду:

```sh
# Загружаем и устанавливаем Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Изменяем права доступа, чтобы сделать Docker Compose исполняемым
sudo chmod +x /usr/local/bin/docker-compose

# Проверяем версию Docker Compose для убеждения в успешной установке
docker-compose --version
```

## Развертывание ZoneMinder с помощью Docker

Теперь, когда у вас есть Docker и Docker-Compose, вы готовы развернуть ZoneMinder. Для этого создадим `docker-compose.yml` файл, в котором определим необходимую конфигурацию:

```yaml
version: '3.7'
services:
  zoneminder:
    image: zoneminderhq/zoneminder:latest
    container_name: zoneminder
    restart: always
    ports:
      - "80:80" # Пробрасываем порт 80 для доступа к веб-интерфейсу ZoneMinder
    environment:
      - ZM_DB_HOST=db
      - ZM_DB_USER=zmuser
      - ZM_DB_PASS=zmpass
    depends_on:
      - db
  db:
    image: mariadb:latest
    container_name: zm-mariadb
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=rootpass
      - MYSQL_DATABASE=zm
      - MYSQL_USER=zmuser
      - MYSQL_PASSWORD=zmpass
    volumes:
      - db-data:/var/lib/mysql

volumes:
  db-data:
```

### Запуск контейнеров

Теперь, когда `docker-compose.yml` файл готов, выполняем запуск контейнеров:

```sh
# Запускаем контейнеры ZoneMinder и базы данных
docker-compose up -d
```

Команда `up` с флагом `-d` запускает контейнеры в фоновом режиме. После успешного запуска, ZoneMinder будет доступен в вашем браузере по адресу `http://localhost`.

### Настройка ZoneMinder

После установки и запуска контейнеров, вам нужно настроить ZoneMinder для работы с вашими камерами. Откройте веб-интерфейс ZoneMinder и выполните начальную настройку. Интерфейс интуитивно понятен и проведет вас через процесс добавления камер и других необходимых настроек.

Для более тонкой настройки и управления параметрами, воспользуйтесь официальной документацией или сообществом ZoneMinder, где вы найдете подробные инструкции и рекомендации.

## Заключение

Установка и настройка ZoneMinder в контейнере Docker упрощает управление вашим решением для видеонаблюдения, обеспечивая быструю и гибкую среду для работы с камерами. Благодаря Docker вы сможете легко обновлять и масштабировать свою систему, минимизируя возможность возникновения проблем с зависимостями и конфигурацией. Следуя приведенным инструкциям, вы сможете быстро развернуть ZoneMinder и начать управлять вашими камерами в считанные минуты.