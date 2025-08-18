---
metaTitle: Развёртывание и конфигурация сервера в Kubernetes
metaDescription: Узнайте, как развернуть и настроить сервер в Kubernetes - пошаговое руководство, примеры файлов, лучшие практики и разбор основных возможностей
author: Олег Марков
title: Развёртывание и конфигурация сервера в Kubernetes
preview: Погрузитесь в процесс развертывания и конфигурации серверов в Kubernetes - от манифестов до продвинутой настройки, секретов, политики и автоматизации деплоймента
---

## Введение

Kubernetes — это современная платформа оркестрации контейнеров, которая помогает управлять развертыванием, масштабированием и эксплуатацией приложений в контейнерах. С его помощью вы сможете автоматизировать многие задачи по конфигурации и запуску серверов, что особенно важно как для разработки, так и для поддержки продуктивной среды. В этой статье мы подробно рассмотрим процесс развёртывания сервера в Kubernetes, разберём различные способы конфигурации, приведём примеры YAML-манифестов и обсудим типичные задачи, с которыми сталкиваются разработчики при работе с этой системой.

## Базовые понятия Kubernetes, важные для развертывания

### Кратко о Pod, Deployment, Service и Namespace

Перед тем как перейти к практике, напомню ключевые термины:

- **Pod** — минимальная единица запуска в Kubernetes, обычно содержит один контейнер (чаще всего), но может и несколько.
- **Deployment** — более высокий уровень абстракции. Контроллер, который следит за тем, чтобы необходимое количество pod-ов с нужной конфигурацией было постоянно в кластере.
- **Service** — объект, который обеспечивает стабильную точку доступа к одному или нескольким pod-ам, скрывая возможные изменения их IP-адресов. 
- **Namespace** — разграничение областей в кластере, удобно для разделения ресурсов между командами и окружениями.

Подобные абстракции обеспечивают гибкость, масштабируемость и удобство эксплуатации серверов в Kubernetes.

## Развёртывание сервера: шаг за шагом

### Подготовка Docker-образа для вашего сервера

До того как вы начнёте работу с Kubernetes, необходимо упаковать ваше серверное приложение в Docker-образ. Это позволит Kubernetes управлять экземплярами вашего сервера как с контейнерами. Пример Dockerfile для простого HTTP-сервера на Node.js:

```dockerfile
# Используем официальный образ Node.js
FROM node:18-alpine

# Создаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# Копируем исходные файлы приложения
COPY . .

# Запуск приложения
CMD [ "node", "server.js" ]
```

Соберите образ и загрузите его в Docker Registry:

```sh
docker build -t myregistry/myserver:1.0 .
docker push myregistry/myserver:1.0
```

### Составление Deployment-манифеста

Для развертывания вашего сервера используется объект Deployment. Вот как может выглядеть минимальный манифест:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myserver-deployment
spec:
  replicas: 2 # Сколько экземпляров сервера будет работать одновременно
  selector:
    matchLabels:
      app: myserver
  template:
    metadata:
      labels:
        app: myserver
    spec:
      containers:
      - name: myserver
        image: myregistry/myserver:1.0 # Ваш образ сервера
        ports:
        - containerPort: 8080 # Порт, на котором работает сервер внутри контейнера
```

Применить его можно так:

```sh
kubectl apply -f deployment.yaml
```

### Открытие доступа через Service

По умолчанию pod-ы не доступны извне кластера. Для публикации сервера необходимо создать Service. Вот пример простейшего Service для HTTP-приложения:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myserver-service
spec:
  selector:
    app: myserver # Соотносим Service с pod-ами по label
  ports:
    - protocol: TCP
      port: 80 # Внешний порт, по которому обращаются клиенты
      targetPort: 8080 # Порт в контейнере
  type: ClusterIP # Варианты: ClusterIP, NodePort, LoadBalancer, ExternalName
```

Для тестирования внутри кластера используйте тип `ClusterIP`. Если сервис должен быть доступен снаружи, укажите `NodePort` или (в облаке) `LoadBalancer`.

### Пример запуска и проверки

Смотрите, я показываю прямую последовательность действий:

1. Примените deployment:

    ```sh
    kubectl apply -f deployment.yaml
    ```

2. Примените service:

    ```sh
    kubectl apply -f service.yaml
    ```

3. Убедитесь, что pod-ы запущены:

    ```sh
    kubectl get pods
    ```

4. Посмотрите, как работает service:

    ```sh
    kubectl get service
    ```
    
    При использовании `NodePort` доступ к серверу можно получить по адресу: 

    ```
    http://<NODE_IP>:<NODE_PORT>
    ```

    Выведите значение порта командой:

    ```sh
    kubectl describe service myserver-service
    ```

## Расширенная конфигурация сервера в Kubernetes

### Использование ConfigMap и Secret для конфигурации приложения

Хранить параметры конфигурации лучше всего в объектах `ConfigMap` (для не секретных данных) и `Secret` (для паролей, токенов и приватных ключей).

#### Пример ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myserver-config
data:
  APP_ENV: production
  LOG_LEVEL: info
```

#### Пример Secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: myserver-secret
type: Opaque
data:
  DB_PASSWORD: cGFzc3dvcmQ= # base64 для "password"
```

Подключить их к Pod-у можно через переменные окружения:

```yaml
env:
  - name: APP_ENV
    valueFrom:
      configMapKeyRef:
        name: myserver-config
        key: APP_ENV
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: myserver-secret
        key: DB_PASSWORD
```

### Монтирование томов: хранение данных

Если серверу нужно хранить данные (например, база данных, кэш, файлы), используется Volume. Пример с использованием `PersistentVolumeClaim`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: myserver-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

В Pod-е:

```yaml
volumes:
  - name: server-storage
    persistentVolumeClaim:
      claimName: myserver-pvc
containers:
  - name: myserver
    image: myregistry/myserver:1.0
    volumeMounts:
      - mountPath: /data
        name: server-storage
```

Теперь контейнер будет сохранять (и получать) файлы из директории `/data` на постоянное хранилище.

### Настройка ресурсов и лимитов

Ресурсы (`resources.requests` и `resources.limits`) помогают Kubernetes корректно планировать ваши серверы и предотвращать выделение им лишних или недостаточных ресурсов.

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

- `requests` — минимально гарантированные ресурсы.
- `limits` — максимальные допустимые ресурсы для контейнера.

### Прописывание readiness и liveness probes

Readiness probe сообщает Kubernetes, когда контейнер готов принимать трафик. Liveness probe позволяет перезапускать "зависший" контейнер. Вот как они настраиваются:

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
```

Этот пример полезен для HTTP-сервера, отдающего `/health`-эндпоинт.

### Масштабирование сервера (об авто- и ручном скейлинге)

Поменять количество реплик можно вручную:

```sh
kubectl scale deployment myserver-deployment --replicas=5
```

Для автоматического масштабирования (например, по нагрузке по CPU) используется Horizontal Pod Autoscaler (HPA):

```sh
kubectl autoscale deployment myserver-deployment --cpu-percent=80 --min=2 --max=10
```

Проверьте HPA:

```sh
kubectl get hpa
```

### Нюансы работы в разных окружениях

#### Namespaces

Создайте отдельные namespaces для разных сред (dev, staging, prod):

```sh
kubectl create namespace prod
kubectl apply -f deployment.yaml --namespace=prod
```

#### Переменные окружения для разных конфигураций

Для отличающихся конфигураций удобно использовать разные ConfigMap/Secret для каждого namespace или окружения.

#### Интеграция с CI/CD

Большинство современных CI/CD-систем (например, GitHub Actions, GitLab CI, Jenkins) поддерживают автоматическое применение изменений манифестов в кластер. YAML-файлы удобно хранить в системе контроля версий.

### Отправка логов и мониторинг

Kubernetes интегрируется с системами мониторинга (Prometheus, Grafana) и сбора логов (ELK, Loki). Для этого в кластере часто развертываются sidecar-контейнеры или DaemonSet-ы для агрегации логов.

### Настройка Rolling Update и Rollback

По умолчанию Deployment использует стратегию rolling update, обновляя поды по очереди. Если вы опубликовали нерабочую версию — легко откатиться:

```sh
kubectl rollout undo deployment myserver-deployment
```

### Защита и безопасность (RBAC, ограничение доступа)

Ограничьте доступ к кластеру и объектам через роли и сервис-аккаунты (RBAC):

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

Назначаете роль конкретному сервис-аккаунту или пользователю через RoleBinding.

### Секреты и чувствительные данные

Не храните секретные данные в открытых yaml-файлах. Используйте kubectl для генерации секретов:

```sh
kubectl create secret generic myserver-secret --from-literal=DB_PASSWORD=mypassword
```

Это обеспечит безопасное хранение чувствительных данных.

## Заключение

Развёртывание и конфигурация серверов в Kubernetes устроены так, чтобы упростить управление контейнеризированными приложениями, гарантировать масштабируемость, отказоустойчивость и быстрый отклик на изменяющиеся требования. Используя возможности Deployment, Service, ConfigMap, Secret, Volumes и другие компоненты Kubernetes, вы легко адаптируете свои приложения под разные среды и сценарии эксплуатации. Пример пошаговой настройки сервера выше закладывает фундамент — дальше вы сможете соединить этот опыт с другими возможностями платформы для решения собственных задач.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как быстро посмотреть логи всех pod-ов моего deployment-а в Kubernetes?**  
Выведите список pod-ов с помощью `kubectl get pods -l app=myserver`, затем используйте цикл:  
```sh
for pod in $(kubectl get pods -l app=myserver -o name); do kubectl logs $pod; done
```

**2. Как передать секреты (пароли) без записи их напрямую в YAML-файл?**  
Создайте секрет из командной строки:  
```sh
kubectl create secret generic db-secret --from-literal=DB_PASS=superpassword
```
и подключайте через `env.valueFrom.secretKeyRef` в манифестах.

**3. Как узнать внутренний IP-адрес pod-а или service?**  
Используйте:  
```sh
kubectl get pod <имя-pod> -o wide
kubectl get svc <имя-service>
```
для вывода IP-адресов.

**4. Как быстро перезапустить все pod-ы deployment-а без изменения образа?**  
Используйте аннотацию, чтобы форсировать rollout:  
```sh
kubectl rollout restart deployment myserver-deployment
```

**5. Как ограничить доступ к серверу только с определённых IP или сетей?**  
Примените NetworkPolicy. Пример YAML:  
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-specific-ip
spec:
  podSelector: {}
  ingress:
    - from:
       - ipBlock:
           cidr: 192.168.1.0/24
```
Этот policy позволит доступ только с подсети 192.168.1.0/24.