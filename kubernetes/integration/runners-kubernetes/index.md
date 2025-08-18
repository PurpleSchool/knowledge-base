---
metaTitle: Настройка и использование Runners в Kubernetes
metaDescription: Пошаговое руководство по настройке и использованию runners в Kubernetes - от принципов работы до примеров интеграций и управления реализацией
author: Олег Марков
title: Настройка и использование Runners в Kubernetes
preview: Разбираемся с runners в Kubernetes - зачем нужны, как установить, масштабировать и интегрировать в CI/CD. Детальные примеры и советы помогут вам быстро освоить тему
---

## Введение

Сегодня многие компании применяют Kubernetes, чтобы автоматизировать развертывание, масштабирование и управление своими приложениями. На фоне роста DevOps-культуры всё актуальнее становится непрерывная интеграция и доставка (CI/CD). Runners — это агенты, которые выполняют пайплайны (например, в GitLab CI или GitHub Actions) и автоматически запускают сборки, тесты и деплой ваших приложений. Когда вы объединяете технологию runners и возможности Kubernetes, получаете очень гибкую, масштабируемую и отказоустойчивую систему автоматизации.

В статье я расскажу, как устроены runners в контексте Kubernetes, зачем их там использовать, как развернуть, интегрировать с популярными сервисами вроде GitLab и GitHub, и как следить за их работой. Вас ждут пояснения сложных моментов, живые примеры и советы по типичным проблемам.

## Что такое Runners и зачем они нужны в Kubernetes

### Принцип работы runners

Runners — это исполняемые агенты, которые запускают джобы ваших CI/CD пайплайнов. Например, в GitLab runner забирает задачу из очереди, загружает ваш код и скрипты сборки, готовит изолированное окружение (например, создаёт контейнер Docker), выполняет инструкции и отправляет результаты обратно в систему.

Раннеры бывают общими (shared, один на весь проект/группу) или специфичными (specific, закреплены за отдельным проектом). Их можно запускать на отдельных серверах, но всё чаще — прямо в Kubernetes.

### Почему использовать runners в Kubernetes

Kubernetes идеален для запуска runners по ряду причин:

- **Масштабируемость** — runners автоматически разворачиваются и исчезают в зависимости от нагрузки, не занимая ресурсы без дела.
- **Изоляция** — каждая сборка запускается в отдельном pod, используя namespace, что увеличивает безопасность.
- **Удобное управление ресурсами** — легко ограничить, сколько процессоров, памяти или диска может потреблять runner.
- **Автоматизация** — можно непрерывно обновлять runner до свежих версий через систему развёртывания Kubernetes.

Давайте теперь разберём, как шаг за шагом установить и начать использовать runners в кластере Kubernetes.

## Раннеры для CI/CD: ключевые платформы и их особенности

### GitLab Runners

Самый популярный сценарий — использование GitLab Runner в Kubernetes. GitLab официально поддерживает Kubernetes Executor — это означает, что runner будет автоматически создавать поды для выполнения ваших заданий.

**Особенности:**

- Runner можно развернуть через официальный Helm chart, что упрощает настройку.
- Легко привязать ресурсы, настроить concurrency, автоматическое обновление runner.
- Поддержка Docker, shell, Kubernetes executors.

### GitHub Actions self-hosted runners

GitHub Actions позволяет запускать workflows не только на облачных серверах GitHub, но и на собственных runner, которые вы можете разместить в Kubernetes.

**Особенности:**

- Можно использовать официальный образ контейнера GitHub Actions Runner.
- Для повышения отказоустойчивости часто применяют кастомные контроллеры (например, actions-runner-controller).
- Можно гибко настраивать пул runners: инфраструктура будет масштабироваться под ваши нужды.

### Jenkins Agents (Kubernetes plugin)

Jenkins также работает с Kubernetes — специальный плагин позволяет использовать поды в кластере, чтобы запускать ваши build- и deploy-“агентов”.

**Особенности:**

- Работает через кубернетесный плагин Jenkins.
- Позволяет создавать и уничтожать поды-агенты автоматически под конкретную задачу.
- Позволяет использовать кастомные образы агента.

## Установка и настройка runners в Kubernetes

### Общие шаги по развертыванию runners в Kubernetes

Я покажу пример для GitLab Runner, так как это наглядно и схоже с другими системами.

#### 1. Подготовка кластера

Убедитесь, что у вас есть рабочий кластер Kubernetes, доступ в него (`kubectl` работает), и задан namespace для runner (например, `ci`).

#### 2. Добавление Helm и репозитория деплоя

Helm — это пакетный менеджер для Kubernetes. Так проще всего устанавливать инфраструктурные компоненты. Сначала добавьте официальный Helm-репозиторий GitLab:

```sh
helm repo add gitlab https://charts.gitlab.io
helm repo update
```

#### 3. Создаём namespace

```sh
kubectl create namespace ci
```

#### 4. Установка Runner

Смотрите — теперь мы устанавливаем runner как Helm-релиз. Вот базовый пример:

```sh
helm install gitlab-runner gitlab/gitlab-runner \
  --namespace ci \
  --set runnerRegistrationToken=<YOUR_TOKEN> \
  --set gitlabUrl=https://gitlab.com/ \
  --set rbac.create=true
```

`<YOUR_TOKEN>` — это токен регистрации runner, который вы берёте из интерфейса GitLab (Settings > CI/CD > Runners).

#### 5. Проверка работы

Выполните команду и убедитесь, что поды запущены:

```sh
kubectl get pods -n ci
```

Если runner активен, в GitLab в разделе Runners появится новый агент (Online).

### Пример values.yaml для Helm Chart

Обычно для сложных инсталляций используют файл `values.yaml` с настройками runner. Например:

```yaml
gitlabUrl: https://gitlab.com/
runnerRegistrationToken: "your-token-here"
rbac:
  create: true
runners:
  tags: "kubernetes,ci"
  privileged: true # Нужно если внутри job используется Docker
  resources:
    limits:
      cpu: 200m
      memory: 512Mi
```

Здесь вы можете видеть важные параметры: `tags` (метки runner), `privileged` (даёт доступ к запуску Docker-in-Docker), лимиты ресурсов.

### Использование Persistent Storage

Если ваши задачи требуют файловой системы или кеша между job, вам может понадобиться подключить persistent volume:

```yaml
runners:
  cache:
    persistentVolumeClaim:
      claimName: gitlab-runner-cache
```

Создайте PVC заранее:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: gitlab-runner-cache
  namespace: ci
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

### Масштабирование runners

Kubernetes позволяет запускать нужное количество runner автоматически, в зависимости от нагрузки. По умолчанию каждый job в CI/CD — это отдельный под. Для масштабирования укажите параметры concurrency и autoscaling:

```yaml
runners:
  concurrent: 10 # Максимальное количество job
```

Для GitHub Actions используют аналогичные настройки через actions-runner-controller и Horizontal Pod Autoscaler.

## Интеграция runners с пайплайнами и примеры использования

### Как связать runner и пайплайн

После установки runner он становится доступен для выбранного проекта или группы. Теперь, когда вы пушите код, ваш описанный pipeline (`.gitlab-ci.yml` или `.github/workflows/`) использует этот runner для запуска job. Пример простого `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test

build-job:
  stage: build
  script:
    - echo "Building..."
  tags: ["kubernetes", "ci"] # Соответствует tags runner

test-job:
  stage: test
  script:
    - echo "Testing..."
  tags: ["kubernetes", "ci"]
```

#### Использование кастомного Docker образа

В GitLab или GitHub вы можете указать свой Docker-образ:

```yaml
job:
  image: python:3.11
  script:
    - python --version
```

Runner скачает указанный образ, развернёт под, выполнит шаги job, а затем удалит ресурсы.

### Расширенные возможности runners в Kubernetes

#### Использование секретов

Если для сборки нужны секреты (например, ключи, токены), рекомендуется хранить их в Kubernetes Secrets:

```sh
kubectl create secret generic docker-auth \
    --from-file=.dockerconfigjson=/path/to/.docker/config.json \
    --type=kubernetes.io/dockerconfigjson \
    -n ci
```

В `values.yaml` runner можно указать доступ к secret:

```yaml
runners:
  env:
    DOCKER_AUTH_CONFIG: /secrets/.dockerconfigjson
  volumeMounts:
    - name: docker-creds
      mountPath: /secrets
  volumes:
    - name: docker-creds
      secret:
        secretName: docker-auth
```

#### Настройка прав (RBAC)

Runner обычно требует специальных прав. При установке Helm чарта флаг `rbac.create=true` создаст нужные ServiceAccount и RoleBinding автоматически. Если вы включаете advanced режим, настройте их вручную:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: ci
  name: gitlab-runner
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["create", "get", "list", "watch", "delete"]
```

#### Запуск Docker-in-Docker (DinD)

Если вам нужно собирать Docker-образы прямо внутри runner (например, для деплоя), используйте DinD:

```yaml
runners:
  privileged: true
  config: |
    [[runners]]
      [runners.kubernetes]
        privileged = true
      [runners.docker]
        tls_verify = false
```

Обратите внимание, что `privileged: true` может повысить риски безопасности. Оцените, нужны ли такие права вашим пайплайнам.

### Мониторинг и логирование runners в Kubernetes

Вы можете просматривать логи runner через kubectl:

```sh
kubectl logs <runner-pod-name> -n ci
```

Для интеграции логов с внешними системами удобно использовать Prometheus, Grafana или системы логирования вроде ELK/EFK.

#### Пример сбора метрик runner для Prometheus

Если вы хотите мониторить состояние runner, добавьте ServiceMonitor или экспортируйте метрики в Prometheus:

```yaml
metrics:
  enabled: true
  serviceMonitor:
    enabled: true
    additionalLabels:
      release: prometheus
```

## Практические советы и устранение частых проблем

### Типичные ошибки при развертывании runners

- **Runner не регистрируется:** Проверьте токен, URL GitLab/GitHub и наличие доступа из кластера.
- **Jobs подвисают в pending:** Убедитесь в доступности ресурсов в кластере и наличии нужных tags в runner/job.
- **Runner не может создать под:** Посмотрите логи runner и убедитесь, что у него есть нужные права RBAC.
- **Проблемы с DinD:** Для работы Docker внутри Kubernetes убедитесь, что runner запущен с опцией `privileged: true`.

### Рекомендации по безопасности

- Старайтесь отлично разграничивать namespaces и роли пользователей.
- Отключайте `privileged`, если ваши пайплайны не используют DinD.
- Используйте secrets и не храните пары ключ/пароль в явном виде.

### Обновление runner

Обычно новые версии runner выходят довольно часто. Чтобы обновить runner в Kubernetes, выполните:

```sh
helm repo update
helm upgrade gitlab-runner gitlab/gitlab-runner -n ci
```

## Заключение

Использование runners в Kubernetes — гибкое и масштабируемое решение для современных CI/CD-процессов. Оно позволяет организовать надёжную автоматическую сборку, тестирование, доставку и деплой приложений любых размеров. Kubernetes даёт удобные инструменты для управления ресурсами, масштабирования, мониторинга и безопасного хранения секретной информации.

В статье вы познакомились с основами runners в Kubernetes, научились их устанавливать, настраивать, масштабировать и интегрировать с разными CI/CD системами. Такие знания позволяют строить эффективные и надёжные процессы DevOps для ваших проектов.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как ограничить доступ runner к определённому namespace в кластере?

Ограничьте сервисный аккаунт runner правами только на нужный namespace. Отредактируйте роль (Role) и биндинг (RoleBinding), чтобы разрешить работу c pods только в определённом namespace:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: my-project
  name: my-runner-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["create", "delete", "get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: my-runner-binding
  namespace: my-project
subjects:
- kind: ServiceAccount
  name: gitlab-runner
  namespace: my-project
roleRef:
  kind: Role
  name: my-runner-role
  apiGroup: rbac.authorization.k8s.io
```

### Как повысить отказоустойчивость раннеров в Kubernetes?

Разверните несколько runner в разных зонах/нодах кластера. Используйте настройки PodDisruptionBudget и настройте health-probe в деплойменте, чтобы Kubernetes автоматически рестартил неработающие pod.

### Можно ли использовать отдельные образы runner для разных задач пайплайна?

Да, укажите нужный образ в секции image вашей job. Например, для GitLab:

```yaml
job:
  image: golang:1.19
  script:
    - go test ./...
```

Runner сам подтянет подходящий контейнерный образ для каждого job.

### Как автоматически масштабировать количество runners под нагрузку?

Для динамического масштабирования используйте инструменты, такие как GitLab runner autoscaler или HorizontalPodAutoscaler (например, для GitHub Actions с actions-runner-controller).

Пример настройки HPA:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 1
  maxReplicas: 10
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gitlab-runner
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          averageUtilization: 60
```

### Как подключить runner к приватному Docker регистри?

Создайте Kubernetes Secret с вашим dockerconfig.json и передайте его runner через volumeMount в values.yaml. В job для сборки сможете использовать приватные образы из вашего реестра.