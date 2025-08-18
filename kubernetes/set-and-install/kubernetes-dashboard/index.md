---
metaTitle: Установка и настройка Kubernetes Dashboard
metaDescription: Подробная инструкция по установке и настройке Kubernetes Dashboard - развертывание, авторизация и основные функции в рабочем кластере Kubernetes
author: Олег Марков
title: Установка и настройка Kubernetes Dashboard
preview: Научитесь быстро развернуть и настроить Kubernetes Dashboard в своем кластере - пошаговые инструкции, примеры команд и решение основных проблем
---

## Введение

Работа с Kubernetes часто требует анализа состояния кластера, управления объектами, отслеживания событий и мониторинга ресурсов. Хотя большинство задач решаемо через командную строку (kubectl), на практике более удобно использовать визуальные инструменты. Kubernetes Dashboard — это веб-интерфейс для управления кластерами Kubernetes, который позволяет вам быстро получать информацию о состоянии кластера, создавать и изменять ресурсы, отслеживать логи и получать статистику по компонентам.

В этой статье вы найдете подробную инструкцию по установке и настройке Kubernetes Dashboard, а также разбор ключевых возможностей, типичных проблем и решений.

## Что такое Kubernetes Dashboard

Kubernetes Dashboard — это официальный веб-интерфейс, который позволяет управлять кластерами Kubernetes. Вот основные задачи, для которых чаще всего используют Dashboard:

- Просмотр информации о кластере, namespace, workload'ах и сервисах.
- Создание и удаление объектов (Pod, Deployment, Service и т.д.).
- Мониторинг ресурсов: статус подов, событий, использование ресурсов.
- Управление доступом и быстрый запуск задач.
- Работа с секретами, configmap-ами и журналами логов.

Kubernetes Dashboard поддерживает большинство базовых операций, но не полностью заменяет консольные инструменты — его назначение больше в визуализации и ускорении рутинных операций.

## Установка Kubernetes Dashboard

### Требования

Перед установкой убедитесь, что у вас уже развернут кластер Kubernetes 1.19 или выше и настроены kubectl с доступом к кластеру. Для локального тестирования идеально подходит minikube или kind, для продакшн — любой совместимый кластер (например, AWS EKS, GKE, DigitalOcean, российские Яндекс Managed Kubernetes и др.).

**Примеры проверки доступа к кластеру:**

```sh
kubectl cluster-info # Получение информации о кластере
kubectl get nodes    # Список нод в вашем кластере
```

### Установка Dashboard через манифесты

Установить Dashboard проще всего стандартным способом — применив официальный YAML-манифест от разработчиков. 

```sh
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v3.0.0-alpha1/aio/deploy/recommended.yaml
```

- Здесь применяется полный список ресурсов: `Deployment`, `Service`, роли, права, необходимые для работы Dashboard.
- Все объекты будут созданы в namespace `kubernetes-dashboard`.

**Пояснение:** Вы всегда можете скачать YAML-файл, изучить или изменить его под свои задачи.

### Проверка запуска Dashboard

После применения манифеста проверьте, что Dashboard успешно запущен:

```sh
kubectl get pods -n kubernetes-dashboard
# Выводит список pod'ов, ищите STATUS=Running
kubectl get svc -n kubernetes-dashboard
# Показывает созданный сервис, обычно тип ClusterIP
```

Пример вывода pod'а:
```
NAME                                         READY   STATUS    RESTARTS   AGE
kubernetes-dashboard-5f7b9997c6-c89ks         1/1     Running   0          3m
```

Если pod не запускается, посмотрите логи для диагностики:
```sh
kubectl logs -n kubernetes-dashboard <имя-pod>
```

## Доступ к Dashboard

### Локальный доступ через kubectl proxy

По умолчанию сервис Dashboard запускается как ClusterIP, то есть доступен только внутри кластера. Для локального тестирования используйте проксирование через kubectl:

```sh
kubectl proxy
# Стартует прокси на http://localhost:8001/
```

Теперь Dashboard будет доступен по адресу:
`http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/`

### Внешний доступ (продакшн)

Чтобы получить доступ к Dashboard из внешней сети (например, по HTTP/HTTPS), потребуется изменить тип сервиса на NodePort или создать Ingress. Это не рекомендуется в открытых кластерах без защиты, так как Dashboard должен быть закрыт для публичного доступа.

**Пример смены ClusterIP на NodePort:**
```sh
kubectl -n kubernetes-dashboard edit service kubernetes-dashboard
# Вручную замените type: ClusterIP на type: NodePort и сохраните
```
Теперь сервис будет доступен по внешнему IP вашей ноды на определённом порте.

**Пример получения порта:**
```sh
kubectl get svc -n kubernetes-dashboard
# Смотрите поле PORT(S) для NodePort
```

### Базовая авторизация

После запуска Dashboard вы увидите страницу входа. Авторизация возможна двумя способами:

- **Через токен** (рекомендуется, безопаснее)
- **Через kubeconfig** (если доступен полный файл)

## Получение токена доступа администратора

Dashboard по умолчанию не выдает никаких прав, поэтому вам нужно создать или временно использовать сервисный аккаунт с нужными привилегиями.

**Пример создания сервисного аккаунта и привязки роли:**

```sh
# Создаем сервисный аккаунт
kubectl create serviceaccount dashboard-admin-sa -n kubernetes-dashboard

# Привязываем роль cluster-admin
kubectl create clusterrolebinding dashboard-admin-sa \
  --clusterrole=cluster-admin \
  --serviceaccount=kubernetes-dashboard:dashboard-admin-sa
```

**Получение токена:**

```sh
kubectl -n kubernetes-dashboard create token dashboard-admin-sa
# Новый способ для Kubernetes >1.24

# Для старых версий Kubernetes (<1.24):
kubectl -n kubernetes-dashboard get secret $(kubectl -n kubernetes-dashboard get sa/dashboard-admin-sa -o jsonpath="{.secrets[0].name}") -o go-template="{{.data.token | base64decode}}"
```

Теперь используйте этот токен для входа в Dashboard.

**Примечание:** Выдача роли `cluster-admin` максимальна по правам, используйте с осторожностью. Для ограниченных задач лучше создавать специфические роли.

## Основные возможности и функции Dashboard

### Обзор кластера

На главной странице Dashboard вы увидите сводные сведения:

- Общее состояние кластера
- Список namespaces
- Использование CPU и памяти
- Общее количество объектов (Pods, Deployments и т.д.)

### Управление workload'ами

Вы можете создавать, изменять и удалять ключевые объекты Kubernetes:

- **Deployments, ReplicaSets, StatefulSets, DaemonSets**
- **Pods и CronJobs**
- **Сервисы и Endpoints**

**Пример: создание нового deployment через веб-интерфейс**
1. Нажмите "CREATE" или используйте кнопку " + " в верхнем меню.
2. Введите манифест ресурса вручную или воспользуйтесь готовым шаблоном.

**Пример YAML для простого nginx-deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
```
- Вы можете быстро скопировать и вставить подобный манифест непосредственно в форму Dashboard.

### Управление конфигами и секретами

Работа с ConfigMap и Secret через Dashboard интуитивно понятна: они прямо отображаются внутри namespace, их можно создавать, редактировать и удалять через интерфейс.

- Возможность просматривать содержимое объектов (при наличии прав)
- Быстрое создание новых переменных, ключей и значений

### Просмотр и фильтрация логов

Для диагностики проблем вы можете:

1. Перейти к поду, который вас интересует
2. Выбрать контейнер (если их несколько)
3. Нажать на кнопку "Logs"

Логи отображаются в реальном времени (stream), есть поиск по ключевым словам.

### Работа с RBAC и аккаунтами

В Dashboard отображаются сервисные аккаунты, роли, clusterrolebinding'и и прочие объекты RBAC. Здесь вы можете быстро оценить права доступа, которым наделен тот или иной сервисный аккаунт.

### Мониторинг ресурсов

Если у вас настроен metrics-server, Dashboard отображает детальную статистику по потреблению CPU и памяти для каждого пода и ноды.

**Проверьте, запущен ли metrics-server:**

```sh
kubectl get deployment metrics-server -n kube-system
```

Интеграция metrics-server не обязательна для работы Dashboard, но сильно расширяет возможности по мониторингу нагрузки.

## Безопасность Dashboard

Dashboard — удобный, но требует повышенного внимания к безопасности.

- **Минимизируйте права:** Не используйте cluster-admin, если это не требуется. Кастомизируйте роли.
- **Не размещайте Dashboard в открытой сети:** Используйте kubectl proxy, VPN или защищённый Ingress.
- **Включите RBAC и audit:** Контролируйте, кто и что делает через Dashboard.
- **Отключайте неиспользуемые Dashboard:** В продуктиве размещайте только временно или давайте доступ по требованию.

## Распространённые проблемы и их решение

### Dashboard недоступен

- Убедитесь, что pod работает и сервис доступен (`kubectl get pod,svc -n kubernetes-dashboard`)
- Если используете прокси, не забывайте запускать `kubectl proxy` или корректно настроить NodePort/Ingress

### Токен не подходит / ошибка доступа

- Проверьте, что созданный сервис-аккаунт имеет нужные роли (ClusterRoleBinding)
- Убедитесь, что сте используете свежий или активный токен

### Не отображается статистика (кубметрики)

- Проверьте установлен ли metrics-server (`kubectl get deployment metrics-server -n kube-system`)
- Убедитесь, что предоставлены права на просмотр метрик

### Под долго не стартует / перезапускается

- Проверьте логи (`kubectl logs -n kubernetes-dashboard <pod>`)
- Проверьте наличие необходимых ресурсов у нод (CPU, RAM)
- Проверьте состояние зависимостей (network policy, service account и т.д.)

### Автоматическое удаление/сброс сессии Dashboard

- Dashboard работает на основе токенов, которые имеют срок жизни
- Используйте свежие токены, не давайте бессрочные права

## Заключение

Kubernetes Dashboard — универсальный и надежный инструмент для визуального управления Kubernetes-кластерами. Его несложно развернуть, а визуальный интерфейс отлично подходит как для новичков, так и опытных инженеров. В Dashboard вы сможете мониторить состояние кластера, управлять объектами, отслеживать логи и выполнять многие рутинные задачи быстрее, чем через kubectl. Правильное администрирование, ограничение прав доступа и использование дополнительных инструментов безопасности обеспечат вам надежную работу с Dashboard.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как полностью удалить Kubernetes Dashboard из кластера?

```sh
# Для удаления Dashboard и всех ресурсов, созданных официальным манифестом:
kubectl delete -f https://raw.githubusercontent.com/kubernetes/dashboard/v3.0.0-alpha1/aio/deploy/recommended.yaml
# Дополнительно можно удалить сервисные аккаунты, роли и биндинги:
kubectl delete serviceaccount dashboard-admin-sa -n kubernetes-dashboard
kubectl delete clusterrolebinding dashboard-admin-sa
```
Это полностью очистит все связанные объекты Dashboard.

### Как настроить HTTPS для Dashboard через Ingress Controller?

Необходимо создать объект Ingress с соответствующими аннотациями и подключенным TLS сертификатом (например, от Let's Encrypt или самоподписанным). Пример для nginx-ingress:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dashboard-ingress
  namespace: kubernetes-dashboard
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  tls:
  - hosts:
      - dashboard.example.com
    secretName: dashboard-tls
  rules:
  - host: dashboard.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kubernetes-dashboard
            port:
              number: 443
```
Создайте секрет `dashboard-tls` с TLS-сертификатом для вашего домена.

### Как предоставить доступ к Dashboard только определенной группе пользователей?

Создайте отдельные сервисные аккаунты с минимальными правами в нужных namespaces и выдавайте токены только целевым пользователям. Используйте RBAC для делегирования доступа на уровне namespace или отдельных объектов.

### Как сменить язык интерфейса Dashboard?

Kubernetes Dashboard поддерживает несколько языков. Язык выбирается автоматически исходя из настроек браузера, но можно сменить его вручную в настройках интерфейса в правом верхнем углу, если такая опция доступна в вашей версии Dashboard.

### Какие ограничения у Dashboard при работе с большими кластерами?

При большом количестве объектов (десятки тысяч pods, сервисов и т.д.) Dashboard может работать медленнее. Рекомендуется фильтровать просматриваемые namespaces, использовать ограничения по ролям и следить за производительностью UI — иногда помогает увеличение ресурсов для пода Dashboard.