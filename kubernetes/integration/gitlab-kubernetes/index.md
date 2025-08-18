---
metaTitle: Интеграция Kubernetes с GitLab - Полное руководство
metaDescription: Пошаговая инструкция по интеграции Kubernetes с GitLab - автоматизация CI CD, деплой, настройка кластера и запуск приложений из репозитория
author: Олег Марков
title: Интеграция Kubernetes с GitLab - Автоматизация CI CD в облачной инфраструктуре
preview: Узнайте, как интегрировать Kubernetes с GitLab для автоматизации CI CD, развертывания приложений и централизованного управления кластерами - практические примеры и нюансы настройки
---

## Введение

Интеграция GitLab и Kubernetes — это мощное решение для автоматизации процессов сборки, тестирования и деплоя приложений в современных облачных инфраструктурах. Благодаря такой интеграции, вы можете существенно упростить доставку приложений, автоматизировать масштабирование, повысить стабильность и гибкость работы ваших сервисов. GitLab выступает одновременно как система контроля версий и как платформа для CI/CD, а Kubernetes берет на себя оркестрацию контейнеров, управление масштабированием и размещением ресурсов. В этой статье разберемся, как связать эти две системы шаг за шагом, рассмотрим основные возможности совместной работы, приведём живые примеры настройки и развертывания, а также разберём типичные проблемы, которые могут возникнуть в процессе.

## Почему интеграция GitLab и Kubernetes важна

Прежде чем переходить к действиям, хочу немного остановиться на теории:

- Благодаря интеграции, разработчики могут безопасно и быстро выкатывать новые версии приложений прямо из репозитория.
- Автоматизация CI/CD на связке GitLab + Kubernetes позволяет организовать полноценный DevOps-процесс без долгих ручных операций.
- GitLab может выступать как единая точка управления множеством кластеров — удобно масштабироваться и поддерживать разные окружения (staging/production).

## Что вам понадобится для начала

Перед интеграцией убедитесь, что у вас:

- Аккаунт в GitLab (можно использовать как SaaS-версию, так и self-hosted)
- Доступ к работающему кластеру Kubernetes (он может быть локальным, облачным или частным)
- kubectl и helm (или kubectl + manifest-файлы) установлены на машине, где вы будете выполнять настройку
- Права администратора в кластере Kubernetes

Давайте перейдем к пошаговой инструкции.

## Настройка кластера Kubernetes для интеграции с GitLab

Первый этап — подготовить кластер. Здесь я покажу вам основные шаги, которые потребуются для бесшовного соединения GitLab и Kubernetes.

### 1. Проверка работоспособности кластера

Запустите команду проверки:

```bash
kubectl get nodes
# Эта команда покажет список узлов в вашем кластере.
```

Убедитесь, что все узлы находятся в статусе `Ready`.

### 2. Создание service account для GitLab

GitLab Runner и GitLab могут работать через сервисный аккаунт кластера. Давайте создадим нужные ресурсы:

```yaml
# gitlab-sa.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gitlab
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: gitlab-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: gitlab
  namespace: default
```

Для применения:

```bash
kubectl apply -f gitlab-sa.yaml
# Это создаст сервисный аккаунт с правами администратора
```

### 3. Получение токена для сервиса

Вам нужен токен для подключения через API:

```bash
kubectl -n default get secret $(kubectl -n default get sa/gitlab -o jsonpath="{.secrets[0].name}") -o jsonpath="{.data.token}" | base64 --decode
# Эта команда выведет ваш токен
```

Сохраните токен — он понадобится при добавлении кластера в GitLab.

### 4. Получение адреса API Kubernetes

Адрес API можно запросить так:

```bash
kubectl cluster-info
# Обратите внимание на строку с Kubernetes control plane — копируйте этот адрес
```

На этом кластер готов!

## Настройка GitLab для работы с Kubernetes

Теперь пора переходить к связке.

### 1. Добавление кластера в GitLab

В существующем проекте GitLab перейдите по адресу:

**Settings → CI/CD → Kubernetes clusters**  
или  
**Infrastructure → Kubernetes clusters** (интерфейс может чуть отличаться, если вы используете self-hosted)

Далее жмите "Connect an existing cluster".

#### Данные для подключения:

- **Kubernetes API URL** — здесь вставьте адрес API из предыдущего шага
- **CA Certificate** — для самоподписанных кластеров вставьте CA, если есть
- **Token** — сюда вставьте токен, который получили ранее
- **Project namespace** — оставьте "default" или выберите другой namespace

Сохраните настройки.

### 2. Проверка подключения

GitLab проверит соединение с кластером. Если все прошло успешно — появится секция с деталями и возможностью управления кластерами.

### 3. Установка GitLab Runner'а в кластер

Чтобы ваши пайплайны GitLab могли запускаться в Kubernetes, нужно установить runner:

В разделе кластера найдите Install GitLab Runner и нажмите кнопку установки.  
GitLab автоматически установит Runner (обычно через Helm-чарты).

Если хотите сделать это вручную, пример команды:

```bash
helm repo add gitlab https://charts.gitlab.io/
helm install --namespace gitlab-managed-apps gitlab-runner -f values.yaml gitlab/gitlab-runner
# Здесь values.yaml должен содержать токен регистрации runner и другие опции
```

Runner должен появиться как pod в вашем кластере.

## Пример: Автоматизация деплоя приложения через GitLab и Kubernetes

Теперь я покажу вам, как сделать полноценный CI/CD. Возьмем простой пример приложения на любом языке (например, на Node.js), который будет автоматически собираться, тестироваться и выкатываться в Kubernetes.

### 1. Структура репозитория

Ваш проект должен содержать:

- исходный код приложения
- Dockerfile (чтобы контейнер собрался автоматически)
- файл `.gitlab-ci.yml` (определяет пайплайн GitLab)

### 2. Пример Dockerfile

```dockerfile
# Используем официальный Node.js-образ
FROM node:current-alpine

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json .
RUN npm install

# Копируем исходный код приложения
COPY . .

# Запуск по умолчанию
CMD ["npm", "start"]
```

### 3. Пример .gitlab-ci.yml

В файле определяем этапы и используем интеграцию с Kubernetes для деплоя:

```yaml
stages:
  - build
  - test
  - deploy

variables:
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

build:
  stage: build
  script:
    - docker build -t $IMAGE_TAG .
    - docker push $IMAGE_TAG
  only:
    - main

test:
  stage: test
  script:
    - npm install
    - npm test
  only:
    - main

deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/my-app my-app=$IMAGE_TAG --record
  environment:
    name: production
    url: http://your-app.example.com
  only:
    - main
```

Обратите внимание:

- Используется переменная `$CI_REGISTRY_IMAGE` — GitLab сам предложит её, если настроен Container Registry.
- Для деплоя применяется отдельное изображение битнами с kubectl, чтобы выполнять kubectl-команды прямо в пайплайне.

### 4. Kubernetes manifest (пример деплоймента)

Вам потребуется подготовленный deployment.yaml для размещения приложения:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: registry.gitlab.com/your-group/your-app:${CI_COMMIT_SHA} # Переменная заменяется раннером
        ports:
        - containerPort: 3000
```

Примените его через kubectl для первого деплоя, а затем дальше контейнер будет обновляться автоматически командами из вашего пайплайна.

## Расширенные возможности интеграции GitLab и Kubernetes

Здесь давайте рассмотрим, что еще вы можете автоматизировать и как сделать процесс более гибким.

### Управление секретами (Kubernetes Secrets)

GitLab может хранить переменные окружения прямо в настройках проекта (Settings → CI/CD → Variables), но иногда проще (и безопаснее) использовать Kubernetes Secrets для хранения ключей, токенов и других чувствительных данных.

Пример создания секрета:

```bash
kubectl create secret generic my-secret --from-literal=API_KEY=supersecretkey
# Этот секрет будет доступен в контейнерах приложения через переменные окружения.
```

В deployment.yaml можно добавить:

```yaml
envFrom:
  - secretRef:
      name: my-secret
```

Теперь переменная API_KEY автоматически попадет в ваше приложение.

### Использование Helm в пайплайне GitLab

Для более сложных инфраструктур часто предпочтительнее использовать Helm-чарты вместо "чистого" kubectl.

Добавьте в pipeline (в job deploy):

```yaml
deploy:
  stage: deploy
  image: alpine/helm:3.6.3
  script:
    - helm upgrade --install my-app ./charts/my-app \
        --set image.tag=$CI_COMMIT_SHA
```

Здесь GitLab Runner будет использовать Helm для автодеплоя вашего чарта.

### Управление несколькими окружениями (staging, production...)

Очень удобно, что с GitLab+Kubernetes вы можете держать отдельные namespace или даже отдельные кластеры для разных окружений. В .gitlab-ci.yml можно настраивать разные environment, а также переменные для доступа к ним.

Пример:

```yaml
environment:
  name: review/$CI_COMMIT_REF_NAME
  url: http://$CI_ENVIRONMENT_SLUG.example.com
  kubernetes:
    namespace: review-$CI_COMMIT_REF_NAME
```

Это позволяет создавать pull request review environments прямо из пайплайна.

### Разграничение доступа и RBAC

GitLab может управлять разными правами доступа к вашему приложению через Kubernetes RBAC. Для разных стадий деплоя или для разных пользователей можно создавать разные сервисные аккаунты и namespace.

Хорошая практика — не давать Runner'у прав cluster-admin по умолчанию, если не требуется, а ограничивать их необходимым набором для минимизации рисков.

## Общие лучшие практики и советы

- **Не храните чувствительные данные в явном виде ни в .gitlab-ci.yml, ни в манифестах**
- Для production-окружения используйте отдельные namespace и сервисные аккаунты
- Всегда используйте tag образа (например, $CI_COMMIT_SHA), а не "latest" — это упрощает откат и отладку
- Делайте Helm release name динамическим для review environments
- Включайте автоматические health checks и readiness probes в Kubernetes Deployment
- Разносите конфигурации разных окружений по значениям Helm-чартов или с помощью разных файлов манифестов
- Мониторьте логи Runner'а и событий в кластере (kubectl logs, kubectl describe pod …) — это ускоряет диагностику багов

## Заключение

Интеграция GitLab с Kubernetes позволяет вам строить полностью автоматизированные, масштабируемые и гибкие процессы CI/CD вне зависимости от масштаба вашего проекта. Предлагаемые практики и примеры охватывают базовую интеграцию и расширенные возможности, с помощью которых вы сможете выстроить цепочку доставки кода, тестирования и выката — по-настоящему современно и удобно. Используйте состояние пайплайнов, храните артефакты и секреты должным образом, автоматизируйте деплой на разные окружения и не забывайте про безопасность. Инфраструктура, сервисные аккаунты, настройки runner'а и pipeline поддаются полной автоматизации, что существенно экономит ресурсы и время вашей команды.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как настроить деплой на несколько Kubernetes-кластеров (например, staging и production) из одного GitLab-проектa?

Чтобы деплой шел на разные кластеры:
1. Подключите оба кластера в настройках проекта (Settings → CI/CD → Kubernetes clusters).
2. Используйте разные context и namespace в job-ах .gitlab-ci.yml, оперируя переменными окружения или отдельными секциями deploy для staging/production.
3. В job-ах указывайте нужные credentials и переменные для каждого окружения.

### Как автоматически создавать namespace для каждый merge request?

В разделе "Dynamic environments" задайте динамический namespace, например:

```yaml
environment:
  name: review/$CI_COMMIT_REF_NAME
  kubernetes:
    namespace: review-$CI_COMMIT_REF_NAME
```
И добавьте шаг создания namespace:
```bash
kubectl create namespace review-$CI_COMMIT_REF_NAME --dry-run=client -o yaml | kubectl apply -f -
```

### Почему GitLab Runner не запускает job-ы на Kubernetes (Jobs remain pending)?

Основные причины:
- Runner не авторизован — проверьте настройки service account и токена
- Недостаточно прав у runner'а — добавьте нужные Role/RoleBinding
- Нет свободных ресурсов в кластере — проверьте kubectl get nodes/pods

### Как передавать Kubernetes manifests в runner без складирования в репозитории?

Можно хранить yaml-файлы как "CI/CD Variables" (file type) и на шаге деплоя писать их во временный файл, либо скачивать их из артефакта предыдущей job-ы.

### Как деплоить сразу несколько микросервисов за одну pipeline?

1. Разделите deploy job на несколько параллельных job-ов с разными deployment.yaml (или разными release в Helm)
2. Используйте anchors или extends в .gitlab-ci.yml для переиспользования кода пайплайна
3. Можно добавить stage deploy и несколько job-ов deploy-service1, deploy-service2... для разных сервисов.