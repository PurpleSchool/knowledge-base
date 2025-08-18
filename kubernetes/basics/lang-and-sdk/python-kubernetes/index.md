---
metaTitle: Интеграция Python и Kubernetes практическое руководство
metaDescription: Разберитесь как связать Python и Kubernetes познакомьтесь с подходами для взаимодействия автоматизации и написания операторов на Python
author: Олег Марков
title: Интеграция Python и Kubernetes практическое руководство
preview: Узнайте как Python помогает автоматизировать работу с Kubernetes на примерах реальных скриптов библиотек и интеграционных паттернов
---

## Введение

Современная разработка и эксплуатация приложений часто требуют интеграции между различными языками программирования и инструментами оркестрации. Kubernetes стал стандартной платформой для управления контейнерами, а Python — одним из самых популярных языков для автоматизации, написания скриптов и сервисов. Интеграция Python и Kubernetes открывает огромные возможности для автоматизированного управления кластерами, работы с API, мониторинга, создания операторов и динамического масштабирования приложений.

В этом обзоре вы найдете подробные инструкции, примеры кода и объяснения — как использовать Python для взаимодействия с Kubernetes. Мы рассмотрим основные подходы, ключевые библиотеки, разберем типичные сценарии и практические задачи: от простых скриптов до разработки собственных операторов для автоматизации рутинных процессов.

---

## Почему интеграция Python и Kubernetes востребована

Kubernetes позволяет управлять инфраструктурой с помощью декларативных манифестов и мощного API. Однако во многих задачах удобно взаимодействовать с этим API программно, например, когда нужно:

- Автоматически деплоить приложения.
- Следить за состоянием кластера и обрабатывать события.
- Создавать пользовательские ресурсы и расширять возможности платформы.
- Интегрировать внешние системы (CI/CD, мониторинг, оповещения).

Python предоставляет лаконичный и удобочитаемый синтаксис, обилие библиотек для работы с HTTP, асинхронией, логированием, а также официальную k8s-библиотеку, что делает его отличным выбором для подобных задач.

---

## Библиотеки и инструменты для работы с Kubernetes из Python

### Kubernetes Python Client — официальный клиент

Kubernetes предоставляет официальный Python клиент, который охватывает практически все REST API ресурсы кластера. Эта библиотека позволяет создавать, обновлять, удалять ресурсы, а также слушать события и реализовывать кастомную логику.

#### Установка

Самый простой способ — через pip:

```bash
pip install kubernetes
```

#### Быстрый старт: авторизация и подключение

Смотрите, как получить доступ к кластеру (обычно авторизация происходит по локальному kubeconfig):

```python
from kubernetes import client, config

# Загружаем kubeconfig из ~/.kube/config
config.load_kube_config()

# Получаем API для работы с подами
v1 = client.CoreV1Api()

# Получаем список подов в указанном namespace
for pod in v1.list_namespaced_pod(namespace="default").items:
    print(f"Под: {pod.metadata.name}")
```

Этот код подключается к вашему кластеру и выводит все поды в namespace `default`. Обратите внимание — если ваш Python код работает в кластере (например, как job или operator), используйте:

```python
config.load_incluster_config()
```

Теперь давайте рассмотрим базовые функции библиотеки и типичные задачи.

---

### Основные возможности kubernetes python client

#### Получение информации о ресурсах

Чтение списка ресурсов — одна из самых частых задач. Например, вывести сервисы и их типы:

```python
services = v1.list_namespaced_service(namespace="default")
for svc in services.items:
    print(f"Сервис {svc.metadata.name} типа {svc.spec.type}")
```

Вы можете получить описание деплойментов:

```python
apps_v1 = client.AppsV1Api()
for deployment in apps_v1.list_namespaced_deployment(namespace="default").items:
    print(f"Деплоймент: {deployment.metadata.name}, replicas: {deployment.spec.replicas}")
```

#### Создание, обновление и удаление ресурсов

Здесь я показываю, как создать новый namespace:

```python
ns = client.V1Namespace(
    metadata=client.V1ObjectMeta(name="my-new-namespace")
)
v1.create_namespace(body=ns)
# Новый namespace создан
```

Удаление namespace:

```python
v1.delete_namespace(name="my-new-namespace")
# Namespace будет удалён
```

#### Применение конфигурационных файлов

Полноценная интеграция требует поддержки YAML манифестов. Пример применения Deployment:

```python
import yaml

with open("my-deployment.yaml") as f:
    dep = yaml.safe_load(f)

# Преобразуем yaml непосредственно в объект python dict для отправки через API
apps_v1.create_namespaced_deployment(
    namespace="default", 
    body=dep
)
# Деплоймент создан из yaml-файла
```

#### Следы за событиями (watch)

Отслеживание событий в реальном времени позволяет реагировать на появление или удаление объектов:

```python
from kubernetes import watch

w = watch.Watch()
for event in w.stream(v1.list_namespaced_pod, namespace="default"):
    print(f"Событие: {event['type']} - {event['object'].metadata.name}")
    # Например, реагируем на удаление
    if event['type'] == 'DELETED':
        print("ПОД УДАЛЁН!")
```

#### Работа с exec и логами

Вам может понадобиться автоматически запускать команды внутри подов или собирать их логи.

```python
resp = v1.read_namespaced_pod_log(
    name="my-pod", 
    namespace="default"
)
print(resp)  # Здесь распечатаются логи пода

# Выполнить команду внутри пода
exec_command = [
    '/bin/sh',
    '-c',
    'echo Hello from the pod!'
]
from kubernetes.stream import stream
resp = stream(v1.connect_get_namespaced_pod_exec,
              'my-pod',
              'default',
              command=exec_command,
              stderr=True, stdin=False,
              stdout=True, tty=False)
print(resp)
```

---

### Автоматизация задач: написание утилит и ботов

Благодаря API, вы можете писать утилиты, которые:

- Чистят неиспользуемые namespaces или PVC.
- Делают snapshot cluster state.
- Склеивают логи из разных подов.
- Мигрируют сервисы между namespace-ами.

Вот пример кода, который удаляет все completed jobs старше дня:

```python
import datetime

batch_v1 = client.BatchV1Api()
jobs = batch_v1.list_namespaced_job(namespace="default")
now = datetime.datetime.utcnow()

for job in jobs.items:
    # Проверяем, что job завершена
    if job.status.succeeded and job.status.completion_time:
        age = now - job.status.completion_time.replace(tzinfo=None)
        if age.days > 1:  # Старше суток
            batch_v1.delete_namespaced_job(
                name=job.metadata.name,
                namespace="default",
                body=client.V1DeleteOptions(propagation_policy="Foreground")
            )
            print(f"Удалена job {job.metadata.name}")
```

---

### Интеграция через Helm и kubectl из Python

Иногда, особенно в CI-процессах или при деплое сложных манифестов, удобно запускать внешние команды helm или kubectl из Python, используя `subprocess`:

```python
import subprocess

# Деплой из helm-чарта
subprocess.run([
    "helm", "upgrade", "--install", "my-app", "./helm/my-app",
    "--namespace", "default"
])

# Применить манифест через kubectl
subprocess.run([
    "kubectl", "apply", "-f", "deployment.yaml"
])
```

Здесь можно обработать результат выполнения, проанализировать код возврата и логировать ошибки. Это удобно, если вы уже работаете с существующими helm-чартами или yamls, которые часто меняются вручную.

---

### Создание кастомных ресурсов и операторов (Custom Resource & Operator)

#### Что такое Custom Resource и Operator

Kubernetes поддерживает концепцию CRD (Custom Resource Definitions) для расширения API под ваши задачи (например, запуск бэкапов, генерация сертификатов и пр.)

Operator — это компонент, который следит за определёнными кастомными ресурсами и реагирует на их изменения. Большую популярность приобрели python-операторы, которые пишутся с помощью фреймворков, например, [Kopf](https://kopf.readthedocs.io/en/stable/).

#### Установка Kopf

```bash
pip install kopf
```

#### Пример простейшего оператора

Я покажу вам пример, как сделать оператора, который реагирует на создание кастомного ресурса:

```python
import kopf

# Обработчик для создания ресурса
@kopf.on.create('acme.com', 'v1', 'myresources')
def create_fn(spec, **kwargs):
    message = spec.get('message', 'Hello World')
    print(f"Создан новый myresource с message: {message}")
```

Чтобы это работало, предварительно нужно создать CRD. Пример:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: myresources.acme.com
spec:
  group: acme.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                message:
                  type: string
  scope: Namespaced
  names:
    plural: myresources
    singular: myresource
    kind: MyResource
```

Запустите kopf-оператор — и он будет реагировать на события CRD, выполнять вызовы других сервисов, деплоить любые ресурсы, запускать пайплайны и т.д.

---

### Взаимодействие Python-приложений внутри Kubernetes-кластера

Python-сервис может быть обычным деплойментом, который использует Kubernetes API изнутри кластера. Учтите, что для доступа к Kubernetes API из пода должны быть назначены правильные permissions через ServiceAccount и RBAC.

#### Минимальный пример ServiceAccount и Role

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-python-sa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
subjects:
- kind: ServiceAccount
  name: my-python-sa
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

Теперь ваш Python-под может использовать API для чтения подов внутри namespace. Не забудьте явно указать serviceAccountName в деплойменте.

---

### Типичные паттерны интеграции и практические советы

- **Сервисные утилиты** — быстрое создание автоматизированных задач (чистка старых job-ов, рестарт подов).
- **CI/CD** — автоматическая раскатка helm-чартов и kubectl apply при обновлении кода.
- **Миграции** — реализация скриптов, которые поднимают и конфигурируют нужные ресурсы на лету.
- **Мониторинг событий** — отслеживание состояния и автоматизация реакции на event-ы кластера.
- **Операторы** — кастомизация жизненного цикла приложений под узкие задачи.

---

## Заключение

Интеграция Python и Kubernetes позволяет автоматизировать не только типовые процессы, но и решать очень специфичные задачи в инфраструктуре. Через официальный Python клиент и сторонние библиотеки вы без труда получаете доступ ко всем мощностям k8s API — запускаете, удаляете, мониторите ресурсы и настраиваете кастомные реакции на события. Фреймворки для написания операторов, такие как Kopf, позволяют создавать свои контроллеры, интегрированные в платформу на уровне «первых граждан».

На практике Python отлично сочетается с Kubernetes как для инфраструктурных задач, так и для более сложных сценариев автоматизации и DevOps. Примеры и паттерны, которые вы увидели выше, помогут понять суть и начать строить свои интеграции на практике.

---

## Частозадаваемые технические вопросы по теме и решения

#### Как выполнять аутентификацию в кластере, развернутом в облаке (GKE/EKS/AKS)?

В облачных кластерах обычно требуется использовать специфичные плагины для аутентификации (например, Google Application Default Credentials или aws-iam-authenticator). Обычно вы инициируете авторизацию через продвинутую команду gcloud/aws/az или настраиваете переменные среды. Проверьте, что kubectl работает локально — тогда и python-клиент сможет загрузить нужный контекст через `config.load_kube_config()`.

#### Почему мои exec/log-команды через Python обрываются или не работают?

Из-за сетевых политик, возможностей ServiceAccount или network policy ваши поды могут быть недоступны. Проверьте доступ к API, настройте RBAC и добавьте нужные permissions для исполняемой команды — иногда причина в отсутствии TTY или недостающих volumes.

#### Как работать с batch-ресурсами: CronJob, Job через Python?

Официальный клиент kubernetes поддерживает batch ресурсы через `BatchV1Api`. Для работы с CronJob используйте методы `create_namespaced_cron_job`, для Job — аналогично. Смотрите документацию по batch api или воспользуйтесь автокомплитом IDE.

#### Как деплоить Python-оператор в Kubernetes и обновлять его код?

Создайте Dockerfile, в котором находится ваш оператор и все зависимости (например, с Kopf), соберите образ, загрузите в ваш реестр. Далее опишите Deployment с нужным образом и service account. Для обновления кода — пересоберите образ, обновите tag, выполните rolling update.

#### Как аккуратно удалять ресурсы, созданные из kubernetes python client, чтобы избежать орфанов?

Перед удалением сложных ресурсов (например, namespace) используйте параметры delete с propagationPolicy: "Foreground" — это гарантирует каскадное удаление дочерних объектов. Следите за статусами удаления через watch или периодически проверяйте API из вашего python скрипта.