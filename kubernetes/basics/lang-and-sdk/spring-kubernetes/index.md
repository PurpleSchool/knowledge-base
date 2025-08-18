---
metaTitle: Руководство по использованию Spring в Kubernetes
metaDescription: Подробное руководство по развертыванию Spring и Spring Boot приложений в Kubernetes - описание конфигурирования, деплоя, взаимодействия с сервисами и секьюрности
author: Олег Марков
title: Руководство по использованию Spring в Kubernetes
preview: Лучшие практики по настройке и запуску Spring и Spring Boot приложений в Kubernetes - развертывания, конфигурации, интеграции с облачными сервисами и рекомендации по секьюрности
---

## Введение

Spring — это широко используемый Java-фреймворк для создания бизнес-приложений, а Kubernetes — современная платформа для автоматизации развертывания, масштабирования и управления контейнеризированными приложениями. Благодаря Spring Boot разработка микросервисной архитектуры упростилась, и всё больше команд задумываются, как эффективно запускать Spring-приложения в Kubernetes.

Давайте разберём, как подготовить и развернуть Spring и Spring Boot приложения в Kubernetes, на что обратить внимание при настройке, какие есть особенности управления конфигурациями, секретами, состояниями и сервисами, и какие лучшие практики помогут вам избежать проблем в будущем.

## Как подготовить Spring-приложение для работы в Kubernetes

### Контейнеризация Spring Boot приложения

Первый шаг — упаковать ваше приложение в контейнер. Обычно для этого используют Docker.

Посмотрите на пример Dockerfile для Spring Boot приложения:

```dockerfile
# Используйте официальный образ OpenJDK для запуска Java-приложений
FROM openjdk:17-jdk-slim

# Копируем jar-файл, собранный заранее с помощью Maven или Gradle
COPY target/my-spring-boot-app.jar /app/app.jar

# Запускаем приложение
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Обратите внимание:
- Здесь используется официальный компактный образ Java (OpenJDK).
- Ваш скомпилированный jar-файл копируется в контейнер.
- Приложение запускается стандартной командой `java -jar`.

После этого соберите образ:

```bash
docker build -t my-spring-boot-app:latest .
```

Теперь приложение готово к запуску в Kubernetes.

### Использование Spring Profiles и переменных среды

При работе в Kubernetes переходите от использования статических конфигов к параметризации через переменные окружения или ConfigMap/Secret.

В `application.properties` или `application.yml` используйте конструкции вида:

```properties
# application.properties
spring.datasource.url=${DB_URL}      # Будет заменено на переменную окружения DB_URL
spring.profiles.active=${SPRING_PROFILE:default}
```

Это позволит вам не жёстко прописывать значения внутри jar-файла, а задавать их через окружение на уровне Kubernetes.

## Базовое развёртывание подов в Kubernetes

### Написание манифеста Deployment

Создайте описание Deployment — объект, который отвечает за поддержание нужного количества реплик вашего приложения и rollout новых версий.

Пример:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-spring-boot-app
spec:
  replicas: 2   # Будет 2 реплики приложения
  selector:
    matchLabels:
      app: my-spring-boot-app
  template:
    metadata:
      labels:
        app: my-spring-boot-app
    spec:
      containers:
      - name: spring-boot
        image: my-spring-boot-app:latest   # Обновите на название собственного образа
        ports:
        - containerPort: 8080   # Порт, на котором слушает приложение
        env:
        - name: DB_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: database-url
```

Здесь:
- Создаётся Deployment с двумя экземплярами вашего Spring Boot приложения.
- Переменная среды `DB_URL` подтягивается из объекта Secret.

### Открываем приложение наружу: Service и Ingress

Чтобы получить доступ к приложению, создайте Kubernetes Service:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-spring-boot-service
spec:
  type: ClusterIP
  selector:
    app: my-spring-boot-app
  ports:
    - port: 80
      targetPort: 8080
```

Самый частый способ публикации наружу — использовать Ingress-контроллер:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-spring-boot-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-spring-boot-service
            port:
              number: 80
```

Теперь приложение будет доступно по адресу `myapp.example.com`.

## Работа с конфигурациями и секретами

### ConfigMap: управление настройками

Kubernetes ConfigMap позволяет хранить параметры приложения вне контейнера. Например:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-spring-config
data:
  SPRING_PROFILES_ACTIVE: production
  CUSTOM_SETTING: anything
```

Использование в Deployment:

```yaml
        env:
        - name: SPRING_PROFILES_ACTIVE
          valueFrom:
            configMapKeyRef:
              name: my-spring-config
              key: SPRING_PROFILES_ACTIVE
```

Такой способ даёт вам гибкость — менять параметры без пересборки образа.

### Secret: управление чувствительными данными

Для хранения паролей, токенов, ключей используйте Secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  database-url: bXlfZGF0YWJhc2VfdXJs  # Значение должно быть закодировано в base64
```

В Spring Boot вы можете использовать их таким же образом, подставляя их как переменные среды или монтируя как файл.

## Расширенные возможности — стабильность, безопасность и масштабирование

### Liveness и Readiness Probes

Kubernetes может автоматически следить за состоянием ваших приложений. Вам нужно сообщить платформе, как понять что Spring-приложение работает.

Для Spring Boot, по умолчанию Actuator endpoints полезны:

```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
```

Добавьте в `pom.xml` зависимость:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

И включите профили:

```properties
management.endpoint.health.probes.enabled=true
```

Теперь Kubernetes сможет перезапустить (liveness) или временно убрать из балансировки (readiness) контейнер, если что-то пошло не так.

### Масштабирование: Horizontal Pod Autoscaler

Масштабируйте свое приложение автоматически:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-spring-boot-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-spring-boot-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

Это позволит вам держать оптимальное число экземпляров приложения при изменении нагрузки.

### Логирование и мониторинг

- Логируйте в Stdout (Spring Boot это делает по умолчанию).
- Используйте kubectl logs для просмотра логов.
- Для сбора и анализа — используйте стек ELK, Grafana, Prometheus или что-то подобное.
- Интегрируйте Spring Boot Actuator для метрик приложения.

## Работа с внешними сервисами и сервис-дискавери

Spring Cloud Kubernetes — официальный проект, который расширяет возможности Spring Boot для взаимодействия с экосистемой Kubernetes.

#### Пример: авто-детект сервисов через Service Discovery

Добавьте зависимость:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-kubernetes-fabric8</artifactId>
</dependency>
```

Теперь вы можете автоконфигурировать обращения к другим сервисам по их имени (например, `http://имя-сервиса:порт`).

#### Пример: автоматическая подгрузка секретов и конфигов

Spring Cloud Kubernetes позволяет динамически обновлять конфигурации, если ConfigMap или Secret поменялись.

Включение hot-reload:

```yaml
spring:
  cloud:
    kubernetes:
      config:
        enabled: true
        reload:
          enabled: true
      secrets:
        enabled: true
        reload:
          enabled: true
```

Это очень удобно для процедур "мягкой" смены параметров.

## Работа с состоянием — Stateful приложения

Если ваше Spring-приложение требует диска (например, для хранения файлов или логов), используйте PersistentVolume и PersistentVolumeClaim.

Пример:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-app-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

Вам нужно прописать подключение тома в Pod-спеке:

```yaml
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: my-app-pvc
      containers:
      - name: spring-boot
        ...
        volumeMounts:
        - mountPath: "/app/data"
          name: data
```

Теперь в `/app/data` ваше приложение "видит" хранилище, доступное между перезапусками.

## Безопасность и best practices

- Не храните в образе чувствительные данные.
- Часто обновляйте базовые образы Java.
- Используйте лимиты ресурсов CPU и памяти — иначе приложение может "упасть" от нехватки ресурсов на ноде.
- Используйте RBAC для сервис-аккаунтов, если приложению нужны права в Kubernetes API.
- Автоматизируйте security-сканирование образов (например, Trivy, Dockle).
- Применяйте readiness/liveness-пробы.
- Ограничивайте права контейнера через securityContext.

Пример ограничения прав контейнера:

```yaml
        securityContext:
          runAsNonRoot: true
          readOnlyRootFilesystem: true
```

## Миграция из монолита в Kubernetes

Если у вас Spring-приложение традиционно запускается как монолит, подумайте об использовании:
- **Spring Cloud Config** для вынесения конфигураций.
- **Spring Cloud Gateway** для маршрутизации внешних API.
- Перевода на event-driven архитектуру, чтобы уменьшить связанность.
- Актуализации зависимостей и совместимости с OpenJDK 17+.

## Использование Helm и CI/CD

Для автоматизации деплоймента используйте Helm-чарты:

```bash
helm create my-spring-boot-app
```

Применяйте чарты через:

```bash
helm install myapp ./my-spring-boot-app
```

CI/CD пайплайны (GitHub Actions, Jenkins, GitLab CI) позволят собирать образ, пушить его в реестр и обновлять приложение в Kubernetes без ручных операций.

---

Spring и Kubernetes отлично работают вместе благодаря четкой стандартизации процессов упаковки, развертывания, конфигурирования и масштабирования. Вам доступны инструменты для контроля над состоянием ваших сервисов, управления конфигами и секретами, а также современные возможности по автоматизации и мониторингу. Используйте best practices, чтобы ваши Java-приложения были готовы к работе в облаке и на on-premise инфраструктуре.

## Частозадаваемые технические вопросы по теме и ответы на них

**Вопрос 1:** Как выполнить zero-downtime деплой Spring Boot приложения в Kubernetes?

**Ответ:**  
Реализуйте стратегию RollingUpdate (по умолчанию в Deployment), настройте readiness-пробы так, чтобы старый Pod выводился из балансировки только после готовности нового. Убедитесь, что контейнеры обрабатывают завершение работы корректно (graceful shutdown через spring.lifecycle.timeout-per-shutdown-phase).

---

**Вопрос 2:** Как передавать сложные JSON-конфиги (например, списки, мапы) через ConfigMap?

**Ответ:**  
Используйте файлы. Создайте ConfigMap с ключом, равным имени файла, и монтируйте как том. В приложении укажите путь к файлу через переменную среды. Например:
```yaml
apiVersion: v1
kind: ConfigMap
data:
  myconf.json: |
    {
      "list": [1,2,3]
    }
```
смонтируйте в Pod и считывайте файл из нужной директории.

---

**Вопрос 3:** Почему переменные окружения из Secret не подставляются в Spring Boot Properties?

**Ответ:**  
Убедитесь, что структура окружения и ключей совпадает с вашим названием в properties/yml. Для использования с Spring Boot используйте ключи с нижними подчёркиваниями и прописными буквами или настройте explicit mapping среды и application.properties.

---

**Вопрос 4:** Как автоматически обновлять Spring Configurations без пересоздания пода?

**Ответ:**  
Установите и настройте Spring Cloud Kubernetes, включите функции reload для config и secrets (`spring.cloud.kubernetes.config.reload.enabled=true`). Это позволит выполнять hot-reload параметров.

---

**Вопрос 5:** Как ограничить доступ к actuator endpoint в Kubernetes?

**Ответ:**  
Используйте настройки Spring Security (например, через WebSecurityConfigurerAdapter), ограничьте доступ на уровне Ingress (basic auth, whitelists) и/или спрячьте actuator endpoints за отдельным сервисом, доступным только внутри кластера (тип ClusterIP).