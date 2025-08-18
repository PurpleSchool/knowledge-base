---
metaTitle: Примеры деплоя Java-проектов на Kubernetes
metaDescription: Полное руководство по деплою Java-проектов на Kubernetes - настройка, примеры манифестов, упаковка в Docker и лайфхаки для стабильной работы
author: Олег Марков
title: Примеры деплоя Java-проектов на Kubernetes
preview: Рассмотрите пошаговые примеры деплоя Java-приложений на Kubernetes - от Dockerfile до продвинутых паттернов и конфигурирования деплойментов
---

## Введение

Kubernetes становится стандартом для развертывания современных приложений, включая Java-проекты. Автоматизация масштабирования, отказоустойчивость и гибкая организация инфраструктуры делают Kubernetes отличным выбором для продвинутого хостинга микросервисов и монолитов на Java. Однако организация деплоя Java-приложения в Kubernetes включает ряд специфических шагов — от контейнеризации до тонкой настройки ресурсов и сетевых политик.

В этой статье вы найдете практические инструкции и примеры, которые позволят вам без лишних сложностей задеплоить Java-проект стандартного типа (например, Spring Boot) на Kubernetes. Мы пошагово рассмотрим процесс упаковки приложения в Docker, напишем манифесты Pod, Deployment и Service, а также затронем вопросы конфигурирования, секретов, health checks и rolling updates.

## Упаковка Java-приложения в Docker-контейнер

Прежде чем размещать ваше приложение в Kubernetes, его необходимо запаковать в контейнер.

### Пример Dockerfile для Spring Boot

Смотрите, я покажу вам, как выглядит типовой Dockerfile для Java-приложения:

```dockerfile
# Используем официальный образ OpenJDK в качестве базового
FROM openjdk:17-jdk-slim

# Указываем рабочий каталог внутри контейнера
WORKDIR /app

# Копируем скомпилированный jar-файл внутрь контейнера
COPY target/myapp-0.1.0.jar app.jar

# Открываем порт 8080 для приложения
EXPOSE 8080

# Команда запуска приложения
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- Тут мы используем официальный минималистичный JDK-образ.
- Копируем jar-файл сервиса. 
- Вы можете изменить `target/myapp-0.1.0.jar` под ваше имя файла.

### Сборка и загрузка контейнера

Чтобы собрать образ и поместить его в Docker Hub (или другой реестр), используйте команды:

```bash
# Сборка образа
docker build -t myuser/myapp:latest .

# Загрузка в Docker Hub
docker push myuser/myapp:latest
```

Теперь контейнер доступен для деплоя в Kubernetes.

## Описание ресурсов Kubernetes для деплоя Java

Переходим к основной части — написанию манифестов.

### Deployment — основной способ запуска приложения

Deployment отвечает за желаемое количество pod-ов и обеспечивает rolling update. Вот пример:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
spec:
  replicas: 2                           # Укажем 2 экземпляра приложения
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp-container
          image: myuser/myapp:latest     # Имя вашего контейнера из Docker Hub
          ports:
            - containerPort: 8080        # Открытый порт приложения
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: prod                # Передаем переменные окружения
          livenessProbe:
            httpGet:
              path: /actuator/health     # Kubernetes будет следить за здоровьем контейнера
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /actuator/health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
```

Здесь настроены два типа проб — liveness и readiness, чтобы Kubernetes умел перезапустить, если приложение подвиснет, и не слал трафик на экземпляры, которые еще стартуют или недоступны.

### Service — публикация приложения

Чтобы подать трафик на ваши pods, используйте Service:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  type: ClusterIP       # Можно заменить на NodePort или LoadBalancer, если нужно
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
```

- `ClusterIP` используется для внутреннего доступа.
- Для доступа извне используйте `type: NodePort` или установите ingress-контроллер (об этом ниже).

## Конфигурирование окружения и секреты

Рассмотрим, как передавать переменные окружения и конфиденциальные данные.

### ConfigMap — для конфигураций

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/mydb
  SPRING_DATASOURCE_USERNAME: user
```

В Deployment:

```yaml
envFrom:
  - configMapRef:
      name: myapp-config
```

### Secret — для паролей

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secret
type: Opaque
data:
  SPRING_DATASOURCE_PASSWORD: cGFzc3dvcmQ=    # "password" кодировано в base64
```

В контейнере:

```yaml
envFrom:
  - secretRef:
      name: myapp-secret
```

Это избавляет от необходимости хранить пароли в открытых исходниках.

## Health checks и корректная остановка Java приложения

### Зачем нужны probes

Применительно к Java-приложениям на Spring Boot чаще всего используют `/actuator/health` для проверок.

- `livenessProbe` — удалит и пересоздаст зависший pod.
- `readinessProbe` — не направляет запросы на pod, пока тот еще не готов к работе.

Минимальные настройки:

```yaml
livenessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  initialDelaySeconds: 60

readinessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  initialDelaySeconds: 30
```

### Корректное завершение

Kubernetes посылает SIGTERM при завершении pod, давая время для graceful shutdown. Для Spring Boot убедитесь, что включена поддержка graceful shutdown:

```yaml
spring.lifecycle.timeout-per-shutdown-phase=30s
```

## Работа с volumes: примеры для Java-приложений

### Когда нужны volume

Volumes используются для файлов, настроек или данных, которые должны быть сохранены вне контейнера.

```yaml
spec:
  containers:
    - name: myapp
      image: myuser/myapp:latest
      volumeMounts:
        - name: config-volume
          mountPath: /config
  volumes:
    - name: config-volume
      configMap:
        name: myapp-config
```

Так вы подмонтируете значения из ConfigMap прямо как файлы или каталоги.

### Stateful приложения

Если у вас есть приложение, которому нужна постоянная запись данных (например, очередь или база), используйте PersistentVolumeClaim (PVC). Для stateless-приложений обычно volumes не требуются, кроме конфигураций.

## Расширенные возможности: масштабирование, rolling updates, autodeploy

### Масштабирование вручную

Масштабировать реплики можно командой:

```bash
kubectl scale deployment myapp-deployment --replicas=4
```

### Rolling Update

Kubernetes автоматически применяет rolling updates при изменении spec. Можно настраивать параметры:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 1
```

### Автоматическое масштабирование

Horizontal Pod Autoscaler (HPA):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
```

Это позволит Kubernetes самому увеличивать/уменьшать количество подов в зависимости от загрузки.

### Интеграция с CI/CD

Для профессиональных команд релиз проходит автоматически: после коммита запускается pipeline (например, Jenkins, GitLab CI), который собирает новый контейнер, пушит его и обновляет deployment через kubectl или kubectl rollout.

## Использование ingress для доступа извне

Чтобы обеспечить внешний доступ к приложению с помощью домена и tls, настройте ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-service
                port:
                  number: 80
```

Ingress-контроллер требует установки отдельного компонента внутри кластера, например, nginx-ingress.

## Общие советы по деплою Java-приложений в Kubernetes

- Используйте минимальные базовые образы (например, “-slim”, “-alpine”), чтобы уменьшить размер контейнера.
- Не кладите секреты в Dockerfile. Используйте Secrets Kubernetes.
- Оценивайте ресурсы через requests/limits, чтобы Java-процесс не съел все CPU/RAM:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1024Mi"
    cpu: "1"
```
- Для тяжелых приложений (например, с большим heap) указывайте параметры JVM через переменные окружения или параметры запуска (`-Xms`, `-Xmx`).
- Включайте логирование в stdout/stderr, чтобы логи автоматически подхватывались средствами k8s (kubectl logs, ELK и др.).

## Заключение

Деплой Java-приложений на Kubernetes дает широкий спектр возможностей для масштабирования, надежности и автоматизации. Вы узнали, как упаковать Java-сервис в Docker-образ, создать манифесты для Deployment и Service, подключить конфигурацию и секреты, обеспечить проверку состояния приложения и использовать ingress для доступа извне. Благодаря поддержке probes, volumes и auto-scaling вы можете строить отказоустойчивую и легко масштабируемую инфраструктуру. Большинство подходов, показанных здесь, применимы как для Spring Boot, так и для большинства других Java-фреймворков.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как передать аргументы JVM (например, -Xmx) в POD?

В Deployment добавьте переменные окружения или отредактируйте команду запуска:

```yaml
env:
  - name: JAVA_OPTS
    value: "-Xmx1024m"
command: ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```
Теперь вы легко управляете настройками Java без пересборки контейнера.

### Как обновлять зависимые сервисы при пересборке Java-образа?

Обычно это делается через pipeline CI/CD, где после деплоя основного приложения с помощью скриптов или kubectl производится пересборка и деплой зависимых сервисов, либо через GitOps-платформы (ArgoCD, Flux).

### Почему pod уходит в CrashLoopBackOff сразу после старта?

Наиболее частые причины:
- Ошибка в команде запуска (опечатка, неверный путь к jar).
- Нет доступа к переменным окружения/секретам.
- Не хватает объемов памяти/CPU (`OOMKilled`).
Проверьте логи контейнера — `kubectl logs <pod>` поможет понять причину.

### Как задать ограничение по времени graceful shutdown для Java-приложения?

Для Spring Boot — укажите `spring.lifecycle.timeout-per-shutdown-phase`, для остальных приложений контролируйте через переменные окружения и настройки командного файла SIGTERM. В spec pod можно задать параметр terminationGracePeriodSeconds.

### Как подключить JMX или профилировщик к Java-приложению в Kubernetes?

В контейнере откройте нужный порт (например, 9010), разрешите доступ только с доверенного адреса, используйте Service для проброса порта, и задайте JVM-опции через env. Например:  
`JAVA_TOOL_OPTIONS: "-Dcom.sun.management.jmxremote ..."`

Это обеспечит безопасное и штатное подключение внешних инструментов профилирования.