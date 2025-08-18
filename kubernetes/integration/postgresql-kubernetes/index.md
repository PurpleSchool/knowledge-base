---
metaTitle: Настройка и деплой PostgreSQL в Kubernetes
metaDescription: Детально рассмотрите настройку и деплой PostgreSQL в Kubernetes - шаги по созданию StatefulSet, конфигурации PVC и Secret, и управлению отказоустойчивостью
author: Олег Марков
title: Настройка и деплой PostgreSQL в Kubernetes
preview: Пошаговое руководство по развертыванию PostgreSQL в Kubernetes - от создания манифестов до настройки безопасности и резервного копирования с примерами и объяснениями
---

## Введение

Давайте разберемся, как развернуть PostgreSQL в Kubernetes, настроить хранилище для данных, обезопасить доступ к базе и обеспечить устойчивость к сбоям. Kubernetes — это мощная платформа для оркестрации контейнеров, и запуск PostgreSQL в таком окружении становится все более популярным для современных разработчиков и администраторов.

В рамках этой статьи вы узнаете:
- Как подготовить манифесты для деплоя PostgreSQL
- Как правильно организовать Persistant Volume и Secret
- На что обратить внимание при работе с конфигурацией и параметрами отказоустойчивости
- Как масштабировать и обслуживать PostgreSQL в production

Я покажу вам пошагово, как реализовать все эти задачи, чтобы вы быстро разобрались и применили новые знания на практике.

## Подготовка окружения

### Требования к кластеру и инструментам

Для выполнения всех шагов вам понадобится:
- Развернутый кластер Kubernetes (например, minikube, kind или любой managed Kubernetes)
- kubectl — инструмент командной строки для управления Kubernetes
- Докер или другой контейнерный runtime
- Доступ к интернету для загрузки образов контейнеров

Проверьте работоспособность кластера:

```bash
kubectl get nodes
# Если вы видите хотя бы один READY нод, всё готово
```

### Создание пространства имен (namespace)

Хорошей практикой будет выделить отдельный namespace для базы:

```bash
kubectl create namespace postgres
```

## Деплой PostgreSQL с использованием StatefulSet

### Почему StatefulSet, а не Deployment?

StatefulSet — это контроллер, который предоставляет уникальные, постоянные идентификаторы для каждого экземпляра пода. Именно это важно для баз данных: каждый инстанс должен быть связан с своим Volume, чтобы сохранить данные даже после пересоздания пода.

### Описание компонентов

Для запуска вам потребуется создать следующие объекты:
- ConfigMap — базовая конфигурация PostgreSQL
- Secret — безопасное хранение паролей
- PersistentVolumeClaim (PVC) — подключение внешнего хранилища
- StatefulSet — сам PostgreSQL сервер
- Service — доступ к базе данных извне или из других подов

Давайте рассмотрим эти этапы подробно.

### Создание Secret для пароля

Хорошим стилем считается не хранить пароли в открытом виде в манифестах. Вот так можно создать секрет:

```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD=SuperSecretPassword \
  -n postgres

# Этот секрет можно затем использовать при деплое базы
```

### PersistentVolume и PersistentVolumeClaim

В production-кластерах Kubernetes обычно использует динамическое выделение PV. Пример PVC:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: postgres
spec:
  accessModes:
    - ReadWriteOnce # Один под на запись
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard # Используйте свою StorageClass
```

### Конфигурация StatefulSet для PostgreSQL

Вот пример конфигурации StatefulSet:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: postgres
spec:
  serviceName: "postgres"
  replicas: 1 # Можно увеличить для кластеризации, с доп. настройками
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
          image: postgres:16-alpine # Рекомендуется использовать актуальную версию
          ports:
            - containerPort: 5432
              name: postgres
          env:
            - name: POSTGRES_DB
              value: my_database
            - name: POSTGRES_USER
              value: my_user
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-pvc
``` 

В этом примере:
- Контейнер получает пароль из секретного хранилища
- Данные монтируются в отдельный том, чтобы сохранялись между рестартами

### Создание Service для PostgreSQL

Чтобы другие приложения могли обращаться к базе, создайте соответствующий сервис:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: postgres
spec:
  ports:
    - port: 5432 # Порт по умолчанию для PostgreSQL
  clusterIP: None # Обязательно для StatefulSet, чтобы обеспечить DNS для каждого пода
  selector:
    app: postgres
```

Если базе нужен внешний доступ (например, для подключения разработчика), используйте NodePort или LoadBalancer, но будьте осторожны с безопасностью:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-external
  namespace: postgres
spec:
  type: NodePort
  ports:
    - port: 5432
      targetPort: 5432
      nodePort: 32432 # Можно указать свой порт
  selector:
    app: postgres
```
**Комментарий:** Не используйте этот сервис без ограничения доступа через firewall.

### Применение манифестов

Объедините ваши манифесты в одну директорию и примените их командой:

```bash
kubectl apply -f .
# или по отдельности:
kubectl apply -f pvc.yaml
kubectl apply -f secrets.yaml
kubectl apply -f statefulset.yaml
kubectl apply -f service.yaml
```

### Проверка работы кластера

Теперь давайте посмотрим, что происходит при запуске:

```bash
kubectl get pods -n postgres
kubectl get pvc -n postgres
```
- Убедитесь, что под запустился и PVC в статусе Bound.

### Подключение к базе изнутри кластера

Давайте проверим, что база доступна:

```bash
kubectl run -i --tty --rm psql-client --image=postgres:16-alpine -n postgres --env="PGPASSWORD=SuperSecretPassword" --command -- psql -h postgres -U my_user -d my_database
# Вы попадете в консоль psql внутри кластера
```

## Дополнительная настройка и эксплуатация

### Масштабирование PostgreSQL

Масштабировать StatefulSet без настройки кластера репликации бессмысленно, так как по умолчанию будет работать только основной сервер. Для высокой доступности применяют операторы, например, [Zalando Postgres Operator](https://postgres-operator.readthedocs.io/en/latest/) или [CrunchyData Operator](https://access.crunchydata.com/documentation/postgres-operator/latest/).

### Настройка резервного копирования

Варианты:
- Использовать инструменты, такие как `pg_dump` или [`wal-g`](https://github.com/wal-g/wal-g), для архивирования данных и WAL-файлов
- Монтировать дополнительный volume и хранить регулярные дампы

Пример CronJob для резервного копирования:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pg-dump-backup
  namespace: postgres
spec:
  schedule: "0 3 * * *" # ежедневно в 3:00 ночи
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: pg-dump
            image: postgres:16-alpine
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD
            command: ["sh", "-c", "pg_dump -h postgres -U my_user my_database > /backup/mydb_$(date +%F).sql"]
            volumeMounts:
              - name: backup-volume
                mountPath: /backup
          restartPolicy: OnFailure
          volumes:
            - name: backup-volume
              persistentVolumeClaim:
                claimName: postgres-backup-pvc
```
Такой подход позволяет регулярно сохранять дампы вашей базы в отдельное место.

### Использование Helm Charts или Операторов

Если вы хотите еще больше автоматизации, обратите внимание на Helm Charts:
- [bitnami/postgresql](https://artifacthub.io/packages/helm/bitnami/postgresql) — позволяет легко управлять параметрами с помощью values.yaml

Для кластеризации и сложной настройки лучше использовать операторы.

Пример установки через Helm:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install my-postgres bitnami/postgresql --namespace postgres \
  --set global.postgresql.postgresqlPassword=SuperSecretPassword
```
Почти все те же шаги внутри, только намного удобнее для массового использования и автоматизации CI/CD.

### Безопасность и защита данных

- Используйте Secret для хранения всех паролей и ключей
- Ограниците сетевой доступ к базе с помощью NetworkPolicy
- Используйте RBAC-политики для ограничения доступа к namespace
- Включайте SSL/TLS в вашем контейнере при работе вне внутренних Cloud-сетей

## Функции и возможности, которые становятся доступны в Kubernetes

- Легкое переключение между версиями PostgreSQL (с помощью миграций StatefulSet)
- Автоматическое самовосстановление подов
- Гибкая масштабируемость при использовании операторов
- Интеграция с любыми облачными системами хранения — ваши данные будут защищены и доступны
- Простое внедрение процессов CI/CD для инфраструктуры

## Заключение

Смотрите, вы видите, что развернуть PostgreSQL в Kubernetes — задача вполне выполнимая даже для новичка, если придерживаться базовых рекомендаций и использовать стандартные ресурсы платформы. Я описал, как настроить хранилище, использовать секреты, обеспечить безопасность и сделать резервное копирование — все это прямо в Kubernetes, что позволяет не только автоматизировать инфраструктуру, но и повысить надежность вашей базы данных.

## Частозадаваемые технические вопросы и ответы

**Вопрос:** Как обновить версию PostgreSQL без потери данных?  
**Ответ:**  
1. Сделайте дамп старой базы через `pg_dump`.
2. Создайте новый StatefulSet с новым образом.
3. Восстановите дамп на новой версии.
4. Для безостановочного обновления используйте инструмент pg_upgrade или оператор с поддержкой миграций.

**Вопрос:** Как ограничить доступ к базе только определёнными подами в Kubernetes?  
**Ответ:**  
Создайте NetworkPolicy, разрешающую доступ к Service PostgreSQL только с определённых подов по лейблам.

**Вопрос:** Как организовать автоматическое восстановление из бэкапа?  
**Ответ:**  
Добавьте InitContainer в StatefulSet, который при старте проверяет наличие дампа и восстанавливает базу из него, если база пуста.

**Вопрос:** Почему PVC остается после удаления StatefulSet, и как его удалить?  
**Ответ:**  
PVC не удаляется автоматически для предотвращения потери данных. Если вы уверены, что данные больше не нужны, удалите PVC вручную через  
`kubectl delete pvc postgres-pvc -n postgres`.

**Вопрос:** Как мониторить состояние PostgreSQL в Kubernetes?  
**Ответ:**  
Используйте инструменты мониторинга, такие как Prometheus с оператором Postgres Exporter — добавьте соответствующий sidecar-контейнер или установите отдельный Deployment.