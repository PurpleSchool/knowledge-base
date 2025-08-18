---
metaTitle: Примеры интеграции GitHub Actions и Kubernetes
metaDescription: Изучите лучшие примеры интеграции GitHub Actions и Kubernetes для автоматизации CI CD процессов с пошаговыми инструкциями и примерами кода
author: Олег Марков
title: Примеры интеграции GitHub Actions и Kubernetes
preview: Пошаговые инструкции и реальные примеры настройки GitHub Actions для автоматического деплоя в Kubernetes кластеры помогут вам быстрее достичь DevOps целей
---

## Введение

Инфраструктура и процессы доставки приложений сегодня стремительно развиваются, и автоматизация становится ключевым элементом эффективной разработки. GitHub Actions — это мощный инструмент CI/CD, который позволяет автоматизировать сборку, тестирование и деплой приложений практически для любой платформы. Kubernetes, в свою очередь, стал фактическим стандартом для запуска контейнеризированных приложений в облаке и on-premises. Интеграция GitHub Actions и Kubernetes позволяет выстроить полный конвейер: от коммита кода до автоматического развертывания на кластере, обеспечивая быстрые релизы и надежную доставку изменений.

В этой статье вы найдете подробные примеры, сценарии и рекомендации по тому, как связать эти технологии для максимального эффекта. Я расскажу, как настроить автоматический деплой в Kubernetes из GitHub Actions, управлять креденшелами и секторами безопасности, а также покажу практические фрагменты кода, которые вы сможете адаптировать под свои задачи.

## Общие принципы интеграции GitHub Actions и Kubernetes

Перед тем как приступить к примерам, важно понять, как выстраивается взаимодействие между GitHub Actions и Kubernetes. Вкратце процесс выглядит так:

1. Разработчик пушит изменения в репозиторий.
2. GitHub Actions запускает workflow, который собирает и публикует Docker-образ в реестр (например, Docker Hub или GitHub Container Registry).
3. Workflow обновляет манифесты Kubernetes и применяет их с помощью kubectl или специализированных action.
4. Кластер Kubernetes подхватывает новые образы и разворачивает обновления.

Этот процесс можно настроить различными способами — автоматизировать сборку и деплой, добавлять этапы тестирования, статического анализа, настройки уведомлений и откатов при неудачных развертываниях.

## Пример 1 — Автоматическая сборка Docker-образа и деплой в Kubernetes через kubectl

Этот сценарий охватывает один из самых популярных вариантов — как построить полный pipeline, когда каждое изменение автоматически деплоится в ваш кластер.

### Настройка секрета для доступа к кластеру

Для доступа к Kubernetes из workflow, потребуется kubeconfig (файл настроек для kubectl). Обычно он берется из вашей среды или создается администратором. Покажу как добавить этот файл в Repository Secrets:

1. Получите файл kubeconfig для нужного кластера.
2. Откройте настройки репозитория в GitHub (Settings → Secrets and variables → Actions).
3. Создайте новый secret, например с именем KUBE_CONFIG и вставьте туда содержимое файла kubeconfig.

### Пример workflow файла

Теперь давайте посмотрим на сам workflow:

```yaml
name: Build and Deploy to Kubernetes

on:
  push:
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Проверяем исходный код
      - name: Checkout code
        uses: actions/checkout@v4

      # Устанавливаем Docker Buildx для продвинутой сборки образов
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # Входим в Docker Hub (или другой реестр)
      - name: Log in to DockerHub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      # Сборка и публикация образа
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/myapp:${{ github.sha }}

      # Сохраняем kubeconfig в файл для kubectl
      - name: Set up Kubeconfig
        run: |
          echo "${{ secrets.KUBE_CONFIG }}" > $HOME/.kube/config
        # Секрет должен содержать отформатированный kubeconfig

      # Устанавливаем kubectl
      - name: Install kubectl
        run: |
          curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
          chmod +x ./kubectl
          sudo mv ./kubectl /usr/local/bin/kubectl

      # Обновляем образ в манифесте и деплоим
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/myapp-deployment myapp=${{ secrets.DOCKERHUB_USERNAME }}/myapp:${{ github.sha }} --record
          # Манифест должен называться deployment/myapp-deployment, а контейнер - "myapp"
          kubectl rollout status deployment/myapp-deployment
```

#### Краткие пояснения

- Смотрите, в этом workflow мы используем секреты для безопасной передачи токенов и kubeconfig.
- Docker-образ строится каждый раз при push и отправляется в реестр.
- kubectl использует kubeconfig для аутентификации к кластеру.
- Команда `kubectl set image` обновляет образ контейнера в deployment. Можно обновлять и другие ресурсы куба (statefulsets, daemonsets) аналогично.

### На что обратить внимание

- Убедитесь, что секреты не устарели и актуальны.
- Ваш экшн может работать с public и private кластерами — при работе с облачными кластерами (например, EKS, GKE, AKS) есть специальные action для автоматического получения kubeconfig на лету.
- Этот способ идеально подходит для тестовых или dev-окружений, для продакшена рекомендуются более строгие политики доступа.

## Пример 2 — Использование специализированных GitHub Actions для Kubernetes

Многие задачи можно автоматизировать не только через shell, но и используя community-actions, например, popular [azure/k8s-deploy](https://github.com/Azure/k8s-deploy).

### Использование azure/k8s-deploy

Этот action позволяет не только применять манифесты, но и автоматически управлять rollout, делать доклады о статусе и интегрировать информацию с другими Azure DevOps инструментами.

Пример workflow:

```yaml
name: Deploy using Azure k8s-deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # Шаги билдера и пуша аналогичны предыдущему примеру

      # Установка Azure CLI (если нужно)
      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      # Деплой в Kubernetes
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          namespace: 'default'
          manifests: |
            manifests/deployment.yaml
            manifests/service.yaml
          images: ${{ secrets.DOCKERHUB_USERNAME }}/myapp:${{ github.sha }}
```

Здесь action берет все манифесты из указанной папки и применяет их в Kubernetes-кластер, обновляет образы и следит за успешным выкатыванием. Вам нужно только подготовить корректный deployment.yaml.

### Плюсы такого подхода

- Не нужно вручную устанавливать kubectl.
- Простота синтаксиса и меньше кода в workflow.
- Удобно интегрируется с облачными решениями (Azure Kubernetes Service и другие).

### Минусы

- Не всегда поддерживаются уникальные/нестандартные сценарии.
- Меньше контроля над низкоуровневыми параметрами.

## Пример 3 — Динамическое обновление Kubernetes manifests через шаблоны

В реальных workflow зачастую требуется обновлять манифесты Kubernetes — например, автоматически подставлять правильный tag Docker-образа перед деплоем. Часто для этого используют шаблоны в YAML или инструменты вроде yq/kustomize.

### Использование переменных окружения и yq

Покажу простой способ заменить тег образа на лету:

```yaml
- name: Update image in deployment manifest
  run: |
    yq e '.spec.template.spec.containers[0].image = "${{ secrets.DOCKERHUB_USERNAME }}/myapp:${{ github.sha }}"' -i ./manifests/deployment.yaml
```

// Здесь yq редактирует deployment.yaml прямо перед деплоем, чтобы образ был нужной версии.

Вы можете так же использовать sed или специализированные экшны для работы с yaml.

### Интеграция с kustomize

Если вы используете kustomize, сценарий чуть проще:

```yaml
- name: Update image in kustomization.yaml
  run: |
    kustomize edit set image myapp=${{ secrets.DOCKERHUB_USERNAME }}/myapp:${{ github.sha }}
- name: Apply manifests
  run: |
    kubectl apply -k ./manifests
```

// kustomize автоматически обновит версию образа в нужном месте.

## Пример 4 — Роллбэки и автоматический мониторинг деплоя

Часто после деплоя может возникнуть необходимость отменить изменения, если релиз не удался. Для этого можно добавить один шаг в ваш workflow для проверки статуса rollout:

```yaml
- name: Проверяем rollout deployment
  run: |
    kubectl rollout status deployment/myapp-deployment --timeout=120s

- name: Откат при ошибке
  if: failure()
  run: |
    kubectl rollout undo deployment/myapp-deployment
```

// Если предыдущий шаг завершился с ошибкой — происходит откат на предыдущую версию.

## Пример 5 — Использование GitHub OIDC для безопасного доступа к облачному кластеру

В последнее время популярна аутентификация через OpenID Connect (OIDC), позволяющая GitHub Actions получать временные креденшелы и не хранить чувствительные данные в секретах.

### Интеграция с Google Kubernetes Engine

Пример ниже показывает, как шаги workflow запрашивают временный доступ к GKE:

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: 'projects/12345678/locations/global/workloadIdentityPools/pool/providers/github'
    service_account: 'github-deployer@your-project.iam.gserviceaccount.com'

- name: Set up GKE credentials
  uses: google-github-actions/get-gke-credentials@v2
  with:
    cluster_name: ${{ secrets.GKE_CLUSTER }}
    location: ${{ secrets.GKE_LOCATION }}
```

// Теперь kubectl команды могут выполняться без локальных секретов kubeconfig — токены получаются автоматически и живут ограниченное время.

### Преимущества

- Меньше риск утечки секретов.
- Легко управлять правами через сервисные аккаунты и IAM.

## Советы по безопасности при связке GitHub Actions и Kubernetes

- Никогда не публикуйте kubeconfig и токены доступа в открытых workflow и логах.
- Используйте secrets для чувствительных данных.
- Минимизируйте права сервисных аккаунтов (least privilege).
- Регулярно проверяйте доступ workflow к кластерам и реестрам.
- Для production-окружений рассматривайте OIDC или временные аккаунты.

## Расширенные возможности: Helm, ArgoCD, GitOps-подход

Если вам нужно что-то сложнее классического kubectl или mимедийного деплоя, посмотрите на Helm или GitOps-инструменты.

### Деплой через Helm

Helm — пакетный менеджер для Kubernetes, позволяющий деплоить сложные приложения по шаблонам из Helm-чартов.

```yaml
- name: Install Helm
  uses: azure/setup-helm@v4

- name: Deploy Helm chart
  run: |
    helm upgrade --install my-release ./charts/myapp --set image.tag=${{ github.sha }}
```

// Так вы можете параметры образа, переменные, секции values задавать прямо на этапе выкатки.

### Интеграция с GitOps (ArgoCD, Flux)

Для сложных инфраструктур часто весь конфиг хранят в отдельном репозитории Git — весь деплой управляет ArgoCD (или FluxCD). Тогда GitHub Actions обычно обновляет только значения в yaml или создает commit с изменениями в infrastructure repo, а выкатка запускается автоматически GitOps-системой.

## Рекомендации по отладке и мониторингу

- Проверяйте логи workflow — часто проблемы ясны уже из сообщений об ошибках kubectl или helm.
- Получайте статус pod/deployment командой `kubectl describe` и `kubectl logs`.
- Для сложных случаев используйте annotations/labels для отслеживания версий и истории выката.

## Заключение

Интеграция GitHub Actions и Kubernetes — это не только автоматизация стандартных процессов деплоя, но и шаг к надежной, предсказуемой и легкой поддержке ваших сервисов. Вы можете комбинировать различные action, использовать kubectl, Helm и внешние инструменты для создания гибких конвейеров. Такие подходы легко масштабируются и хорошо подходят не только для стартапов и pet-проектов, но и для крупных production-систем с десятками сервисов и сред.

Ваша задача — не только выстроить рабочий pipeline, но и сделать его максимально безопасным и управляемым, чтобы команда могла быстро доставлять ценные изменения пользователям или бизнесу.

---

## Частозадаваемые технические вопросы по теме статьи

### Как ограничить права доступа action к Kubernetes-кластеру?

Ограничьте права сервисного аккаунта, используемого для деплоя из workflow, только нужными namespace и ресурсами. В kubeconfig укажите только соответствующий context. В облаке настройте IAM политику для сервис-аккаунта с минимально достаточными правами.

### Можно ли деплоить сразу в несколько кластеров разом?

Да, создайте несколько шагов deploy в одном или разных jobs. В каждом из них используйте отдельный секрет kubeconfig/контекст, применяйте нужные манифесты через kubectl или отдельные action.

### Как secrets из GitHub Actions попадут в кластер Kubernetes?

Вы можете передавать переменные окружения из GitHub Actions прямо в манифесты или создать secrets в Kubernetes с помощью kubectl, например:

```yaml
kubectl create secret generic my-secret --from-literal=VAR1=${{ secrets.MY_SECRET_VAR }} --dry-run=client -o yaml | kubectl apply -f -
```

### Как убедиться, что контейнер запущен с правильной версией образа?

Добавьте в шаги workflow команду:

```yaml
kubectl describe deployment myapp-deployment | grep Image
```

Это покажет, какой тег используется прямо сейчас.

### Что делать, если workflow падает из-за rate limit DockerHub при push/pull?

Используйте GitHub Container Registry (ghcr), настройку кеширования или используйте приватные реестры Docker с аутентификацией. Настройте Docker login-action на использование альтернативных реестров, если лимит часто превышается.