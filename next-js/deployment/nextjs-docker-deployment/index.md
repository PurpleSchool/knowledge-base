---
metaTitle: "Деплой Next.js с Docker: пошаговое руководство"
metaDescription: "Как развернуть Next.js приложение в Docker контейнере: многоэтапная сборка, Docker Compose, переменные окружения и оптимизация образа."
author: "Антон Ларичев"
title: "Деплой Next.js приложения с Docker"
preview: "Пошаговое руководство по упаковке Next.js приложения в Docker: многоэтапная сборка, standalone режим и Docker Compose."
---

## Зачем Docker для Next.js

Docker позволяет упаковать Next.js приложение вместе со всеми зависимостями в изолированный контейнер. Это решает классическую проблему «у меня работает, а на сервере нет» и упрощает деплой на любую инфраструктуру — VPS, Kubernetes, облачные платформы.

Основные преимущества:

- Одинаковое окружение на локальной машине и продакшне
- Простое масштабирование и обновление сервиса
- Изоляция приложения от хост-системы
- Воспроизводимые сборки

## Подготовка Next.js проекта

### Standalone режим

Next.js поддерживает специальный `output: 'standalone'` режим, который копирует только необходимые файлы для запуска сервера — без лишних `node_modules`. Это существенно уменьшает итоговый размер Docker образа.

Добавьте настройку в `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

После сборки в папке `.next/standalone` появится минимальный сервер Node.js, который можно запустить без установки зависимостей.

## Файл .dockerignore

Перед написанием Dockerfile создайте `.dockerignore`, чтобы исключить лишние файлы из контекста сборки:

```
node_modules
.next
.git
.gitignore
*.md
Dockerfile
docker-compose*.yml
.env*
!.env.example
.DS_Store
coverage
.nyc_output
```

Это ускорит передачу контекста и предотвратит попадание секретов в образ.

## Многоэтапный Dockerfile

Многоэтапная сборка (multi-stage build) — стандартный подход для Next.js. Она разделяет процесс на несколько этапов, чтобы в финальный образ попали только артефакты, нужные для запуска.

```dockerfile
# Этап 1: установка зависимостей
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Этап 2: сборка приложения
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Переменные окружения, нужные во время сборки
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Этап 3: финальный образ для запуска
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем статические файлы
COPY --from=builder /app/public ./public

# Копируем артефакты standalone сборки
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

### Разбор этапов

**deps** — устанавливает зависимости через `npm ci` для детерминированной установки. Alpine-образ выбран за минимальный размер.

**builder** — выполняет `npm run build`. Переменные с префиксом `NEXT_PUBLIC_` встраиваются в бандл во время сборки, поэтому их нужно передавать именно здесь через `ARG`.

**runner** — финальный образ. В него копируются только:
- `public/` — статические ассеты
- `.next/standalone/` — минимальный сервер + нужные `node_modules`
- `.next/static/` — скомпилированные CSS и JS

Использование непривилегированного пользователя `nextjs` — важная практика безопасности: контейнер не запускается от root.

## Локальная проверка образа

Соберите и запустите образ вручную, чтобы убедиться, что всё работает:

```bash
# Сборка образа
docker build -t my-nextjs-app .

# Запуск контейнера
docker run -p 3000:3000 my-nextjs-app
```

Откройте `http://localhost:3000` и проверьте приложение.

Посмотреть размер образа:

```bash
docker images my-nextjs-app
```

Типичный standalone образ весит 100–200 МБ вместо 1+ ГБ без оптимизации.

## Docker Compose для локальной разработки

Для локальной разработки удобно использовать `docker-compose.yml`. Он описывает все сервисы приложения в одном файле.

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:3000/api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Запуск:

```bash
# Запустить все сервисы
docker compose up -d

# Посмотреть логи приложения
docker compose logs -f app

# Остановить
docker compose down
```

## Управление переменными окружения

Next.js разделяет переменные на две группы:

- **Серверные** (`DATABASE_URL`, `JWT_SECRET`) — доступны только на сервере, передаются в `environment` секции Compose или через системное окружение на сервере.
- **Публичные** (`NEXT_PUBLIC_API_URL`) — встраиваются в JavaScript бандл во время сборки, нужно передавать через `ARG` в Dockerfile.

Для продакшена никогда не кладите секреты в Dockerfile или в образ. Используйте:

```bash
# Передача через флаг при запуске
docker run -e JWT_SECRET=supersecret my-nextjs-app

# Через env-файл (не коммитить в git!)
docker run --env-file .env.production my-nextjs-app
```

В Docker Compose используйте отдельный файл:

```yaml
services:
  app:
    env_file:
      - .env.production
```

## Docker Compose для продакшена

Для продакшена стоит добавить nginx как reverse proxy и настроить ресурсные лимиты:

```yaml
services:
  app:
    build: .
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
    restart: unless-stopped
```

Простой конфиг nginx для проксирования:

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Healthcheck эндпоинт

Для корректной работы healthcheck добавьте простой API-роут в приложение:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: Date.now() });
}
```

Docker будет периодически проверять этот эндпоинт и перезапускать контейнер, если он перестанет отвечать.

## Деплой на сервер

Типовой процесс деплоя на VPS:

```bash
# На CI/CD или локально — собрать и запушить образ
docker build -t registry.example.com/my-app:latest .
docker push registry.example.com/my-app:latest

# На сервере — обновить и перезапустить
ssh user@server 'cd /app && docker compose pull && docker compose up -d'
```

Если реестра нет, можно сохранить образ в файл и скопировать на сервер:

```bash
# Экспорт образа
docker save my-nextjs-app | gzip > my-nextjs-app.tar.gz

# Копирование и загрузка на сервере
scp my-nextjs-app.tar.gz user@server:/tmp/
ssh user@server 'docker load < /tmp/my-nextjs-app.tar.gz'
```

## Частые проблемы

### Приложение не стартует в контейнере

Проверьте, что в `next.config.ts` включён `output: 'standalone'`. Без него в `.next/standalone` не будет файла `server.js`.

### Большой размер образа

Убедитесь, что `.dockerignore` исключает `node_modules` и `.next`, иначе они попадут в контекст сборки. Проверьте, что финальный этап копирует файлы именно из `.next/standalone`, а не из всего `.next`.

### Переменные NEXT_PUBLIC не работают

Публичные переменные должны быть известны на этапе `builder`, а не `runner`. Передавайте их через `ARG` и `ENV` в этапе сборки. Изменение этих переменных требует пересборки образа.

### Права доступа к файлам

Если приложение падает с ошибкой `EACCES`, проверьте флаг `--chown=nextjs:nodejs` при копировании файлов в этапе `runner`.

## Итог

Деплой Next.js с Docker включает три ключевых шага:

1. Включить `output: 'standalone'` в конфигурации Next.js
2. Написать многоэтапный Dockerfile с разделением на установку зависимостей, сборку и финальный образ
3. Использовать Docker Compose для управления сервисами и переменными окружения

Такой подход даёт компактный образ (100–200 МБ), изолированную среду и простой процесс обновления приложения на сервере.

Чтобы глубже разобраться с Next.js и научиться строить production-ready приложения, пройдите курс на PurpleSchool: [Next.js — полный курс](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-docker-deployment).