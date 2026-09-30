---
metaTitle: "Деплой Next.js на VPS с Nginx и PM2"
metaDescription: "Пошаговое руководство по деплою Next.js-приложения на VPS: настройка PM2, Nginx как reverse proxy, SSL и автоматический перезапуск."
author: "Антон Ларичев"
title: "Деплой Next.js на VPS с Nginx и PM2"
preview: "Полное руководство по деплою Next.js-приложения на собственный VPS-сервер с использованием PM2 для управления процессами и Nginx в качестве reverse proxy."
---

## Введение

Деплой Next.js-приложения на собственный VPS даёт полный контроль над инфраструктурой: вы сами управляете ресурсами, настраиваете окружение и не зависите от платформ вроде Vercel или Netlify. В этой статье разберём полный цикл — от подготовки сервера до настройки HTTPS и автоматического перезапуска процессов.

Мы будем использовать:
- **PM2** — менеджер процессов для Node.js, обеспечивает перезапуск при сбоях и запуск при старте сервера
- **Nginx** — веб-сервер и reverse proxy, принимает входящие запросы и проксирует их к Next.js

## Подготовка сервера

Предполагается Ubuntu 22.04 LTS. Подключитесь по SSH и обновите пакеты:

```bash
sudo apt update && sudo apt upgrade -y
```

### Установка Node.js

Рекомендуется устанавливать Node.js через NVM — это позволяет легко переключаться между версиями:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

Проверьте установку:

```bash
node -v
npm -v
```

### Установка PM2

```bash
npm install -g pm2
```

### Установка Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Подготовка приложения

### Сборка на локальной машине

Перед отправкой на сервер убедитесь, что приложение собирается без ошибок:

```bash
npm run build
```

Next.js создаст директорию `.next` с оптимизированными файлами. Для деплоя на VPS нужны:
- `.next/` — результат сборки
- `public/` — статические файлы
- `package.json` и `package-lock.json`
- `next.config.js` (или `.ts`)
- `.env.production` — переменные окружения

### Передача файлов на сервер

Самый простой способ — клонировать репозиторий прямо на сервере. Сначала установите Git:

```bash
sudo apt install git -y
```

Затем клонируйте репозиторий:

```bash
cd /var/www
git clone https://github.com/your-username/your-project.git myapp
cd myapp
```

Альтернативно можно использовать `rsync` для синхронизации файлов без репозитория:

```bash
rsync -avz --exclude node_modules --exclude .git \
  ./ user@your-server-ip:/var/www/myapp/
```

## Настройка приложения на сервере

### Установка зависимостей и сборка

На сервере установите зависимости и соберите проект:

```bash
cd /var/www/myapp
npm ci --omit=dev
npm run build
```

Флаг `--omit=dev` пропускает devDependencies — на production-сервере они не нужны. `npm ci` в отличие от `npm install` строго следует `package-lock.json`, что обеспечивает воспроизводимость сборки.

### Переменные окружения

Создайте файл `.env.production` на сервере:

```bash
nano /var/www/myapp/.env.production
```

Пример содержимого:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

Переменные с префиксом `NEXT_PUBLIC_` встраиваются в бандл при сборке, поэтому они должны быть доступны во время `npm run build`. Серверные переменные (без префикса) читаются в runtime.

## Настройка PM2

### Запуск приложения

PM2 запускает Next.js как фоновый процесс:

```bash
cd /var/www/myapp
pm2 start npm --name "myapp" -- start
```

Проверьте статус:

```bash
pm2 status
pm2 logs myapp
```

### Конфигурационный файл ecosystem

Для более гибкой настройки создайте файл `ecosystem.config.js` в корне проекта:

```javascript
module.exports = {
  apps: [
    {
      name: 'myapp',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/myapp',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/myapp-error.log',
      out_file: '/var/log/pm2/myapp-out.log',
      merge_logs: true,
    },
  ],
};
```

Ключевые параметры:
- `instances: 'max'` — запускает по одному процессу на каждое ядро CPU
- `exec_mode: 'cluster'` — включает кластерный режим Node.js для распределения нагрузки
- `max_memory_restart` — автоматически перезапускает процесс при превышении лимита памяти

Запустите с использованием конфига:

```bash
pm2 start ecosystem.config.js
```

### Автозапуск при перезагрузке сервера

```bash
pm2 startup
```

PM2 выведет команду, которую нужно выполнить с правами sudo. Выполните её, затем сохраните текущее состояние процессов:

```bash
pm2 save
```

Теперь PM2 будет автоматически запускать все сохранённые процессы при перезагрузке сервера.

## Настройка Nginx

### Конфигурация виртуального хоста

Создайте конфигурационный файл для вашего сайта:

```bash
sudo nano /etc/nginx/sites-available/myapp
```

Базовая конфигурация без HTTPS:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы Next.js
    location /_next/static/ {
        alias /var/www/myapp/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Публичные файлы
    location /public/ {
        alias /var/www/myapp/public/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

Активируйте конфигурацию и перезагрузите Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Команда `nginx -t` проверит конфигурацию на ошибки перед применением.

## Настройка HTTPS с Let's Encrypt

### Установка Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Получение SSL-сертификата

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot автоматически обновит конфигурацию Nginx для работы с HTTPS. После выполнения команды конфиг будет выглядеть примерно так:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static/ {
        alias /var/www/myapp/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Автообновление сертификатов

Certbot автоматически создаёт задачу в cron. Проверьте, что автообновление работает:

```bash
sudo certbot renew --dry-run
```

## Процесс обновления приложения

При каждом деплое новой версии выполните следующие шаги:

```bash
cd /var/www/myapp

# Получить последние изменения
git pull origin main

# Обновить зависимости
npm ci --omit=dev

# Пересобрать приложение
npm run build

# Перезапустить PM2 без downtime
pm2 reload myapp
```

Команда `pm2 reload` выполняет перезапуск с нулевым временем простоя — новые процессы запускаются до остановки старых.

### Скрипт деплоя

Удобно вынести процесс деплоя в отдельный скрипт `deploy.sh`:

```bash
#!/bin/bash
set -e

APP_DIR="/var/www/myapp"

echo "Starting deployment..."

cd $APP_DIR

git pull origin main

npm ci --omit=dev

npm run build

pm2 reload ecosystem.config.js --update-env

echo "Deployment complete!"
```

Сделайте скрипт исполняемым:

```bash
chmod +x deploy.sh
```

## Настройка файрвола

Откройте только необходимые порты:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

`Nginx Full` открывает порты 80 и 443. Порт 3000 (Next.js) закрыт снаружи — к нему обращается только Nginx изнутри сервера.

## Мониторинг и отладка

### Полезные команды PM2

```bash
# Просмотр статуса всех процессов
pm2 status

# Логи в реальном времени
pm2 logs myapp --lines 100

# Метрики процессора и памяти
pm2 monit

# Информация о конкретном процессе
pm2 show myapp

# Перезапуск с обновлением env-переменных
pm2 restart myapp --update-env
```

### Просмотр логов Nginx

```bash
# Логи доступа
sudo tail -f /var/log/nginx/access.log

# Логи ошибок
sudo tail -f /var/log/nginx/error.log
```

## Типичные проблемы

### Приложение не запускается

Проверьте логи PM2:

```bash
pm2 logs myapp --err
```

Чаще всего причина — отсутствие переменных окружения или ошибка в сборке.

### 502 Bad Gateway в Nginx

Означает, что Nginx не может достучаться до Next.js. Проверьте:

```bash
# Запущен ли Next.js
pm2 status

# Слушает ли он нужный порт
ss -tlnp | grep 3000
```

### Проблемы с правами доступа

На сервере файлы в `/var/www` должны принадлежать пользователю, от которого запускается PM2. Исправьте права:

```bash
sudo chown -R $USER:$USER /var/www/myapp
```

## Заключение

В результате у вас получится надёжный production-стек:
- **Next.js** обрабатывает запросы на порту 3000
- **PM2** управляет процессами, перезапускает их при сбоях и использует все ядра CPU
- **Nginx** принимает входящие запросы на 80/443 и проксирует их к Next.js, а также обслуживает статику с кешированием
- **Let's Encrypt** обеспечивает HTTPS с автообновлением сертификатов

Для углублённого изучения Next.js, включая продвинутые паттерны App Router, серверные компоненты и оптимизацию производительности, ознакомьтесь с курсом на PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-deploy-vps