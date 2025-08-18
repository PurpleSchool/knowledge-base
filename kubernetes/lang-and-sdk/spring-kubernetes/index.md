---
metaTitle: Руководство по использованию Spring в Kubernetes
metaDescription: Полное практическое руководство по развертыванию и запуску приложений Spring в Kubernetes - от базовой интеграции до настройки мониторинга, секретов и CI
author: Олег Марков
title: Руководство по использованию Spring в Kubernetes
preview: Научитесь разворачивать и настраивать приложения Spring в кластере Kubernetes, грамотно использовать инфраструктуру, управлять конфигурациями, секретами и автоматизировать процесс деплоя
---

## Введение

Kubernetes стал стандартом для развертывания современных приложений, предоставляя гибкость, отказоустойчивость и масштабируемость. В свою очередь, Spring — одна из самых популярных платформ для разработки на языке Java. Обычно разработчики ожидают, что Spring-приложения хорошо "живут" в облачной инфраструктуре, а значит интеграция Spring и Kubernetes стала актуальным опытом для многих инженерных команд.

Как вам грамотно развернуть Spring Boot-приложение в Kubernetes, учесть особенности конфигурации, обеспечить безопасность, масштабирование, обновляемость и мониторинг? Я подготовил подробное руководство, где шаг за шагом покажу типовой стек технологий, инструменты, примеры кода и нюансы адаптации привычного Spring-стека под инфраструктуру Kubernetes.

## Контейнеризация Spring-приложения

Прежде чем переходить к Kubernetes, необходимо упаковать ваше Spring Boot-приложение в контейнер. Обычно для этого используется Docker.

### Шаг 1. Сборка jar-файла

Сначала соберите проект. Обычно вы получаете один fat jar:

```bash
./mvnw clean package
# Или если вы используете Gradle:
./gradlew build
```

Проверьте, что в каталоге `target/` (или `build/libs/` — для Gradle) появился jar-файл.

### Шаг 2. Пример Dockerfile

Теперь требуется создать Dockerfile:

```dockerfile
FROM eclipse-temurin:17-jre-alpine
# Копируем собранный jar внутрь контейнера
COPY target/demo-0.0.1-SNAPSHOT.jar /app/app.jar
WORKDIR /app
# Запускаем приложение
ENTRYPOINT ["java","-jar","app.jar"]
```

Добавьте этот Dockerfile в корень проекта. Теперь соберите и проверьте локальный образ:

```bash
docker build -t my-spring-app:latest .
docker run -p 8080:8080 my-spring-app:latest
```

### О чем важно помнить?

- Minimal base image — используйте минимальные образы, например, Alpine.
- Не храните секреты прямо в Dockerfile или jar'нике.
- Проверьте работу приложения без root (например, добавьте `USER 1000:1000`).

## Деплой в Kubernetes: базовый пример

Теперь, когда ваше приложение обернуто в контейнер, приступайте к разворачиванию в кластере Kubernetes.

### Манифест Deployment и Service

Создайте файл, например, `spring-app-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-app
spec:
  replicas: 2 # Запускаем два pod'а для отказоустойчивости
  selector:
    matchLabels:
      app: spring-app
  template:
    metadata:
      labels:
        app: spring-app
    spec:
      containers:
      - name: spring-app
        image: my-spring-app:latest # Здесь укажите имя вашего образа
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: spring-app-service
spec:
  selector:
    app: spring-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: ClusterIP
```

Примените ресурс:

```bash
kubectl apply -f spring-app-deployment.yaml
```

### Как получить доступ к приложению?

Если вы используете локальный кластер (например, minikube), можно пробросить порт:

```bash
kubectl port-forward service/spring-app-service 8080:80
```

Для публичного доступа создайте сервис `LoadBalancer` или пробросите Ingress (об этом ниже).

## Использование ConfigMap и Secret для Spring

В Kubernetes рекомендуется хранить переменные окружения, настройки, секреты отдельно от контейнера.

### ConfigMap для приложения Spring

Создайте `spring-config.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: spring-config
data:
  SPRING_PROFILES_ACTIVE: "prod"
  CUSTOM_SETTING: "value123"
```

#### Внедрение ConfigMap через environment variables

Добавьте в ваш Deployment:

```yaml
      containers:
      - name: spring-app
        ...
        envFrom:
        - configMapRef:
            name: spring-config
```

Теперь доступно, например:
```java
@Value("${CUSTOM_SETTING}")
private String customSetting;
```

#### Использование Secret для чувствительных данных

Создайте секрет:

```bash
kubectl create secret generic spring-secret \
  --from-literal=DB_PASSWORD=supersecret123
```

Добавьте в Deployment:

```yaml
        envFrom:
        - secretRef:
            name: spring-secret
```

Теперь переменная окружения `DB_PASSWORD` доступна приложению.

#### Лучшие практики

- Сохраняйте секреты только в Secret'ах.
- Ограничивайте права для pod'ов, которым не нужны секреты.
- Никогда не храните пароли и API-ключи в открытых yaml-файлах.

## Настройка liveness и readiness probes

Kubernetes использует liveness и readiness probes для самостоятельного мониторинга контейнеров.

### Пример с Spring Boot actuator

Добавьте зависимость actuator:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Активируйте эндпоинты в подтягиваемом `application.yaml`:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
```

В манифесте опишите probes:

```yaml
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 5
```

Если у вас Spring Boot 2.3+, используйте отдельные health-группы `liveness/readiness`.

### Зачем это нужно

- Readiness определяет, может ли приложение принимать трафик.
- Liveness перезапускает pod'ы при зависаниях.

## Интеграция Spring Cloud Kubernetes

Если вы хотите использовать нативные фишки Kubernetes в Spring-приложении — смотрите в сторону Spring Cloud Kubernetes.

### Что это дает?

- Автоматическое обнаружение сервисов (service discovery)
- Чтение ConfigMap и Secrets без рестарта приложения
- Использование Kubernetes API из Java

### Подключение зависимостей

В pom.xml добавьте:

```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-kubernetes-client-config</artifactId>
  <version>2.1.1</version>
</dependency>
```

### Автоматическое обновление конфигов

Сделайте так, чтобы Spring подхватывал новые значения из ConfigMap на лету:

```yaml
spring:
  cloud:
    kubernetes:
      config:
        sources:
        - name: spring-config
      reload:
        enabled: true
        strategy: refresh # Используйте refresh или restart
```

Теперь при изменении ConfigMap значения в приложении автоматически обновляются.

### Service Discovery

Вам не нужно прописывать вручную адреса других сервисов. Spring Cloud Kubernetes позволяет внедрить сервисы из Kubernetes прямо в ваше приложение.

Пример (ServiceName используется как имя сервиса Kubernetes):

```java
@Autowired
private DiscoveryClient discoveryClient;

// Получение всех экземпляров микросервиса "orders-service"
List<ServiceInstance> instances = discoveryClient.getInstances("orders-service");
```

## Работа с базами данных и StatefulSet

Обычно приложения Spring используют базы данных. Если БД также живет в Kubernetes, посмотрите на StatefulSet.

### Почему StatefulSet?

- Гарантирует стабильные идентификаторы pod'ов.
- Позволяет сохранять volume'ы.
- Хорошо подходит для PostgreSQL, MySQL и т.д.

### Пример описания базы:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-statefulset
spec:
  serviceName: "postgres"
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:13
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: spring-secret
              key: DB_PASSWORD
        volumeMounts:
        - name: pgdata
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: pgdata
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 5Gi
```

В Spring Boot используйте сервисное имя в JDBC строке:

```properties
spring.datasource.url=jdbc:postgresql://postgres:5432/mydb
```

## Масштабирование и autohealing

Kubernetes позволяет динамически масштабировать ваши Spring-приложения.

### Масштабирование вручную

```bash
kubectl scale deployment spring-app --replicas=5
```

### Horizontal Pod Autoscaler (HPA)

HPA масштабирует pod'ы по метрикам CPU или памяти.

#### Пример:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: spring-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: spring-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
```

HPA сам увеличит число pod'ов, если загрузка превышает 80%.

### Autohealing

Kubernetes перезапускает pod'ы при ошибках запуска, сбоях prob или падениях контейнера.

## Настройка журнала и мониторинга

Сбор логов из pod'ов — стандартная задача.

### Логи

```bash
kubectl logs deployment/spring-app
```

Для централизованного сбора смотрите в сторону EFK, Promtail+Grafana Loki.

### Мониторинг с Prometheus

Spring Boot Actuator замечательно интегрируется с Prometheus.

#### Добавьте зависимость:

```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

#### Экспортируйте метрики:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
```

Prometheus-оператор обнаруживает `/actuator/prometheus`.

## Security. ServiceAccount и ограничения

Изолируйте разрешения pod'ов через serviceAccount.

### Пример:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: spring-app-sa
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-app
spec:
  template:
    spec:
      serviceAccountName: spring-app-sa
```

Теперь вы можете ограничить доступ к API, монтируемым секретам и другим ресурсам через Role и RoleBinding.

## CI/CD для Spring + Kubernetes

Интеграция pipeline:

1. Код попадает в репозиторий (Git)
2. CI (например, GitHub Actions, Jenkins) собирает jar'ник
3. Docker образ собирается и пушится в регистр (DockerHub, GitLab registry, Harbor, ECR и др)
4. Деплой в кластер (kubectl apply или helm upgrade)

### GitHub Actions: пример workflow

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build jar
      run: ./mvnw package
    - name: Build Docker image
      run: docker build -t myrepo/my-spring-app:${{ github.sha }} .
    - name: Push image
      run: docker push myrepo/my-spring-app:${{ github.sha }}
    - name: Set up kubectl
      uses: azure/setup-kubectl@v3
    - name: Deploy to k8s
      run: |
        kubectl set image deployment/spring-app spring-app=myrepo/my-spring-app:${{ github.sha }}
```

Вам может понадобиться настроить секреты для Docker и kubeconfig.

## Использование Helm

Helm — это менеджер пакетов для Kubernetes. Вместо обычных манифестов используйте шаблоны.

### Как это выглядит

```bash
helm create my-spring-app
# Шаблоны для Deployment, Service, ConfigMap
helm install my-spring-app ./my-spring-app --set image.tag=1.0.0
```

Helm отлично подходит для управления сложными релизами и переменными конфигурации.

## Заключение

Интеграция Spring-приложений в Kubernetes становится все проще благодаря современным средствам конфигурирования, контейнеризации и надстройкам Spring Cloud. При грамотной организации вы получаете систему, в которой масштабирование под нагрузкой и автоматическое восстановление из сбоев работает "из коробки". Используйте Kubernetes-native подходы: ConfigMap для настроек, Probe для проверки живости, Helm для релизов, и подключайте автоматизацию через CI/CD. Не забывайте обеспечивать безопасность хранения и передачи данных, а также вовремя мониторить состояние приложения.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как подключить Spring Boot-приложение к внешней базе данных, развернутой вне Kubernetes?

Укажите в переменных окружения или ConfigMap параметры подключения (host, port, user, password) к вашей внешней БД, например:
```yaml
env:
  - name: SPRING_DATASOURCE_URL
    value: jdbc:postgresql://external-db-host:5432/dbname
  - name: SPRING_DATASOURCE_USERNAME
    value: myuser
  - name: SPRING_DATASOURCE_PASSWORD
    valueFrom:
        secretKeyRef:
            name: db-secret
            key: password
```
Убедитесь, что у pod'ов есть сетевой доступ до нужного хоста и порта.

### Как ограничить ресурсы (CPU и память) для Spring-приложения?

В section pod spec манифеста containers используйте ресурсы:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```
Это ограничит "гарантируемое" и "максимальное" потребление.

### Как безопасно передавать application.properties или YAML-конфиги в pod?

Лучший подход — использовать ConfigMap, где ключ — это имя файла, а значение — его содержимое. Затем монтируйте ConfigMap как файл:
```yaml
volumes:
- name: config-volume
  configMap:
    name: spring-app-config
containers:
- name: spring-app
  volumeMounts:
  - name: config-volume
    mountPath: /config
```
Spring Boot автоматически подхватывает `/config/application.properties`.

### Как обновлять приложение без прерывания работы пользователей?

Kubernetes обновляет deployment-ы пошагово (RollingUpdate). Контролируйте maxSurge и maxUnavailable:
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 1
```
Это обеспечит плавное обновление без даунтайма.

### Как запускать миграции базы данных при старте приложения?

Используйте инструменты Flyway или Liquibase как часть Spring Boot-приложения или подключайте отдельный initContainer:
```yaml
initContainers:
- name: db-migration
  image: my-registry/db-migrator:latest
  envFrom: ...
  command: ["flyway", "migrate"]
```
Это гарантирует выполненность миграций до запуска основного контейнера.