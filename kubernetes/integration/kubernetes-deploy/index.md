---
metaTitle: Развёртывание приложений в Kubernetes - пошаговое руководство
metaDescription: Подробное руководство по развертыванию приложений в Kubernetes - от теории до практики, манифесты, команды и реальный опыт деплоя
author: Олег Марков
title: Deploy приложений в Kubernetes - пошаговое руководство для начинающих и не только
preview: Практическая инструкция по развертыванию приложений в Kubernetes - манифесты, контейнеры, деплойменты, expose и секреты управления
---

## Введение

Kubernetes уже стал одним из самых популярных инструментов для оркестрации контейнеров. Если вам нужно автоматизировать развёртывание, масштабирование и управление приложениями в контейнерах, этот инструмент — ваш лучший выбор. Многие современные сервисы используют Kubernetes, чтобы упростить работу с инфраструктурой и сконцентрироваться на разработке.

В этой статье я разберу, как происходит развёртывание приложений (Deploy) в Kubernetes. Шаг за шагом вы узнаете, как организовать доставку вашего контейнеризованного приложения в кластер, как обеспечить его доступность и управлять релизами. Покажу вам реальные примеры манифестов и команд, объясню каждый шаг и дам рекомендации для типичных кейсов.

## Основные понятия: как устроен Deploy в Kubernetes

### Что такое Deployment

Deployment — это объект Kubernetes, который отвечает за создание и обновление множества реплик вашего приложения (Pods). Именно он позволяет автоматизировать выкатывание новых версий и откаты изменений при неудачных релизах.

Когда вы создаёте Deployment, Kubernetes сам следит за тем, чтобы всегда было заданное вами количество экземпляров приложения, и самостоятельно поднимает новые Pod'ы взамен упавших.

#### Пример простого Deployment

Здесь я показываю базовый пример Deployment для nginx-сервера:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3 # Количество копий приложения
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
        image: nginx:1.25 # Используем образ nginx
        ports:
        - containerPort: 80 # Пробрасываем порт
```

**Объяснение:**
- `replicas` — здесь указывается, сколько подов должно быть в любой момент времени.
- Внутри `template.spec.containers` указываются контейнеры, которые будут запускаться в каждом Pod.

### Основные объекты для деплоя в Kubernetes

Чтобы развернуть приложение, обычно используют такие объекты:
- **Deployment** — управляет версиями и масштабированием приложения.
- **Service** — предоставляет сетевой доступ к подам приложения.
- **ConfigMap** и **Secret** — нужны для передачи настроек и секретных данных.
- **Ingress** — управляет внешним доступом через HTTP/HTTPS.
- **PersistentVolumeClaim** — определяет постоянное хранилище данных для приложения.

Теперь давайте разберём процесс развёртывания приложения пошагово.

## Этапы деплоя приложения в Kubernetes

### Контейнеризация приложения

Первый шаг — контейнеризация. Чаще всего приложение упаковывают в Docker-образ.

#### Пример Dockerfile для Go-приложения

```dockerfile
FROM golang:1.21 AS builder

WORKDIR /app
COPY . .
RUN go build -o main .

FROM alpine:3.18
WORKDIR /app
COPY --from=builder /app/main .
CMD ["./main"]
```

**Что здесь происходит:**
- На этапе builder собирается бинарник приложения.
- Далее он копируется в минимальный образ alpine — это снижает размер итогового контейнера.

Соберите и залейте образ в реестр командой:

```bash
docker build -t yourrepo/yourapp:latest .
docker push yourrepo/yourapp:latest
```

### Подготовка манифестов (yaml)

Следующий шаг — подготовить Kubernetes-манифесты.

#### Пример полного набора для простого приложения

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: demo
  template:
    metadata:
      labels:
        app: demo
    spec:
      containers:
      - name: demo
        image: yourrepo/yourapp:latest
        ports:
        - containerPort: 8080
```

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-service
spec:
  type: ClusterIP
  selector:
    app: demo
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
```

В данном примере:
- `deployment.yaml` отвечает за создание и управление подами.
- `service.yaml` создаёт сервис, через который можно обращаться к вашему приложению внутри кластера.

### Применение манифестов

Теперь запускаем приложение с помощью командной строки kubectl:

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

Проверьте, что всё работет:

```bash
kubectl get pods
kubectl get service
```

**Обратите внимание:** подам может потребоваться несколько секунд для полного старта. Статус должен быть `Running`.

### Обеспечение доступа к приложению

#### Использование сервисов

Сервис позволяет связать множество подов под единым именем и IP. Например, если ваше приложение общается с БД или требуется сетевой доступ из ClusterIP — сервис нужен всегда.

Чтобы получить внешний доступ, сервис можно объявить типа `NodePort`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-nodeport
spec:
  type: NodePort
  selector:
    app: demo
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080
```

- Теперь приложение будет доступно на каждом Node по адресу: `http://<node_ip>:30080`.

#### Expose с помощью Ingress

Ingress позволяет публиковать сервис на один внешний адрес, делая роутинг на разные сервисы.

Пример ресурса Ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-ingress
spec:
  rules:
    - host: demo.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: demo-service
                port:
                  number: 80
```

**Как это работает:**
- Доступ к приложению будет по адресу http://demo.example.com/.
- Ingress-контроллер требуется установить отдельно (например, nginx-ingress-controller).

### Работа с конфигами и секретами

Если приложению нужны переменные окружения, пароли или конфиги — лучше использовать `ConfigMap` и `Secret`.

#### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: demo-config
data:
  APP_MODE: "production"
```

Добавьте это в манифест Deployment:

```yaml
containers:
- name: demo
  image: yourrepo/yourapp:latest
  env:
    - name: APP_MODE
      valueFrom:
        configMapKeyRef:
          name: demo-config
          key: APP_MODE
```

#### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: demo-secret
type: Opaque
data:
  PASSWORD: cGFzc3dvcmQxMjM= # "password123" в base64
```

Использование:

```yaml
env:
  - name: PASSWORD
    valueFrom:
      secretKeyRef:
        name: demo-secret
        key: PASSWORD
```

### Настройка постоянного хранилища

Многим приложениям требуется хранение данных. Для этого используется связка PersistentVolume и PersistentVolumeClaim.

#### Пример создания PVC:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: demo-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 500Mi
```

Включите PVC в Deployment:

```yaml
containers:
- name: demo
  image: yourrepo/yourapp:latest
  volumeMounts:
    - mountPath: "/data"
      name: storage
volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: demo-pvc
```

Теперь ваши данные не потеряются при перезапуске подов.

### Обновление и откаты приложений

Kubernetes позволяет выкатывать новые версии приложения без даунтайма:

Для обновления:
```bash
kubectl set image deployment/demo-app demo=yourrepo/yourapp:newtag
```

Если нужно откатиться на предыдущую версию:

```bash
kubectl rollout undo deployment/demo-app
```

Kubernetes сам развернёт новую версию, а если обнаружит, что поды не запустились, вернёт всё обратно.

### Проверка состояния и отладка

Используйте команды:

```bash
kubectl get pods # Список подов
kubectl describe pod <имя_пода> # Подробная информация о поде и его статусе
kubectl logs <имя_пода> # Логи приложения
```

Чтобы войти внутрь пода:

```bash
kubectl exec -it <имя_пода> -- /bin/sh
```

Это помогает найти ошибки или убедиться, что приложение работает правильно.

## Заключение

Kubernetes предоставляет сложный, но очень гибкий механизм деплоя приложений. Используя такие объекты как Deployment, Service, Ingress, ConfigMap и Secret, вы можете с минимальными усилиями запускать и масштабировать как простейшие микросервисы, так и крупные, распределённые системы. При этом платформа берёт на себя автоматическое управление состоянием, выкаткой, отказоустойчивостью, ротацией секретов и многие другие вопросы, которые раньше отнимали уйму времени.

Если вы освоите базовые шаги — создание Docker-образа, подготовку yaml-манифестов и работу с kubectl — у вас уже будет полный набор для продуктивной работы с современными облачными инфраструктурами.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как использовать переменные среды, заданные на этапе запуска, в Kubernetes?

Чтобы использовать внешние переменные окружения, укажите их в секции `env` в вашем манифесте Deployment:

```yaml
env:
  - name: EXTERNAL_URL
    value: "https://api.example.com"
```
Если переменная критична для секьюрности — оформляйте её через Secret.

### Как настроить автоматический рестарт приложения при сбое?

По умолчанию Kubernetes следит за здоровьем подов и пересоздаёт их при ошибке. Чтобы управлять этим поведением, используйте параметры:

- `restartPolicy: Always` (по умолчанию)
- Можно добавить liveness/readiness-пробы для отслеживания состояния.

### Как задать лимиты ресурсов для контейнера?

Используйте секцию `resources`:

```yaml
resources:
  requests:
    cpu: "250m"
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```
Это помогает избежать “перегрева” кластера и не допустить “падения” соседних сервисов.

### Что делать, если новый под не стартует?

Проверьте его состояние командой `kubectl describe pod <имя_пода>`. Часто ошибка бывает в неправильной ссылке на образ, отсутствии переменных среды или проблемах с сетью. Просмотрите логи командой `kubectl logs <имя_пода>`.

### Как очистить ресурсы после тестового деплоя?

Удалите созданные ресурсы командой:

```bash
kubectl delete -f deployment.yaml
kubectl delete -f service.yaml
# или удалить по имени:
kubectl delete deployment demo-app
kubectl delete service demo-service
```
Так вы освободите ресурсы и не нарушите чистоту кластера.