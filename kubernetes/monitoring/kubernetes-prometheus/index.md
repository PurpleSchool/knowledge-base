---
metaTitle: Мониторинг Kubernetes с Prometheus
metaDescription: Подробное руководство по мониторингу кластера Kubernetes с Prometheus - как развернуть, настроить и собирать метрики, основные практики и примеры использования
author: Олег Марков
title: Мониторинг Kubernetes с Prometheus
preview: Изучите мониторинг кластера Kubernetes с помощью Prometheus - настройка, сбор метрик, лучшие практики, примеры конфигурирования и интеграция с визуализацией
---

## Введение

Мониторинг — это неотъемлемая часть поддержки современных облачных инфраструктур. Kubernetes, как одна из самых популярных платформ для оркестрации контейнеров, создаёт новые вызовы в мониторинге: краткоживущие поды, горизонтальное масштабирование, сложная топология сетей и сервисов. Простой сбор логов уже не даёт полной картины состояния кластера; нужна система, которая умеет агрегировать, обрабатывать и представлять метрики со всех уровней.

Prometheus — это решение, ставшее индустриальным стандартом для мониторинга контейнеризированных сред, в первую очередь за счёт своей архитектуры pull-based сбора данных, мощности языка запросов PromQL и тесной интеграции с Kubernetes. Давайте разберёмся, как использовать Prometheus для мониторинга кластера Kubernetes — от установки до анализа метрик.

## Что такое Prometheus и почему его выбирают для Kubernetes

Prometheus — система мониторинга и оповещений с открытым исходным кодом, разработанная в SoundCloud и ставшая проектом CNCF (Cloud Native Computing Foundation). Её сила в следующем:
- Динамическое обнаружение сервисов (Service Discovery).
- Удобный сбор и хранение временных рядов.
- Гибкий и мощный язык запросов (PromQL).
- Расширяемая архитектура — экспортёры, интеграции, алерты.
- Простое масштабирование и горизонтальная масштабируемость.

В Kubernetes динамика сервисов очень высока — поды могут появляться и исчезать каждую минуту. Prometheus подстроен под такую среду: он может автоматически находить новые объекты, забирать их метрики через эндпоинты, не требуя ручных изменений конфигураций.

## Архитектура мониторинга Kubernetes с Prometheus

Рассмотрим основные компоненты схемы мониторинга:

- **Prometheus Server** — центральный компонент, который собирает и хранит метрики.
- **Экспортёры** — специализированные сервисы, которые превращают внутренние метрики среды (например, kubernetes, node, база данных) в формат, понятный Prometheus.
- **Alertmanager** — компонент для обработки алертов и уведомлений.
- **Grafana (опционально)** — инструмент для визуализации данных из Prometheus.
- **Kube-state-metrics** — сервис, который предоставляет данные о состоянии объектов Kubernetes (например, деплойменты, поды, ноды).
- **Node Exporter** — собирает базовые метрики ОС с каждой ноды.

Все эти компоненты обычно запускаются в самом кластере как поды и взаимодействуют между собой по сети внутри Kubernetes.

## Установка Prometheus в Kubernetes с помощью Helm

Самый простой и рекомендуемый способ развернуть Prometheus в Kubernetes — использовать Helm-чарты. Helm — это менеджер пакетов для Kubernetes. Prometheus, Grafana и смежные сервисы собраны в чарте kube-prometheus-stack. Вот пошаговая инструкция.

### Установка Helm (если не установлен)

```sh
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
# Скрипт скачивает и устанавливает Helm 3.x
```

### Добавление репозитория Prometheus Community

```sh
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
# Добавляем чарты и обновляем список
```

### Установка kube-prometheus-stack

```sh
kubectl create namespace monitoring
helm install prometheus \
  prometheus-community/kube-prometheus-stack \
  --namespace monitoring
# Развёртываем стек мониторинга в отдельном неймспейсе
```

Helm автоматически создаст необходимые объекты: деплойменты Prometheus и Alertmanager, сервисы, сервис-аккаунты, RBAC, Node Exporter, Kube-state-metrics и шаблоны Dashboard Grafana.

### Проверка установки

```sh
kubectl get pods -n monitoring
# Убедитесь, что все поды в состоянии Running
```

### Получение доступа к Prometheus и Grafana

#### Prometheus

```sh
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring
# Теперь Prometheus доступен по адресу http://localhost:9090
```

#### Grafana

```sh
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
# Откройте http://localhost:3000
```
Данные для входа по-умолчанию:  
login — admin  
password — prom-operator (или смотрите в Secret, если изменено)

## Как Prometheus собирает метрики в Kubernetes

Prometheus использует механизм service discovery для поиска энтити (поды, сервисы, endpoints), с которых можно собрать метрики:
- Kubernetes API служит источником информации о состоянии кластера.
- Каждый под или сервис, предоставляющий метрики в формате Prometheus (обычно на /metrics), автоматически обнаруживается (если настроен сервис мониторинга).

Настройка правил сбора метрик в Helm-чарте производится с помощью объектов ServiceMonitor или PodMonitor. Давайте разберем простой пример.

### Пример ServiceMonitor

ServiceMonitor — ресурсы CRD (Custom Resource Definition), через которые вы объясняете Prometheus, как и где искать сервисы с метриками:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-service-monitor
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: myapp   # Привязываем к сервису с этим label
  endpoints:
  - port: http-metrics
    interval: 30s   # Частота сбора метрик
```

Смотрите, что здесь происходит:
- selector (matchLabels) выбирает сервисы по лейблу
- endpoints.port указывает, с какого порта собирать метрики (порт сервис-эндоинта)
- interval настраивает частоту запросов

Prometheus через встроенный operator будет автоматически добавлять новые сервисы, подходящие по фильтру, в конфигурацию targets.

## Экспортёры и дополнительные метрики

В Kubernetes метрики можно разделить на:
- **Метрики приложений** (вы описываете в коде и предоставляете на /metrics).
- **Метрики кластера** (resource usage, состояние нод, подов) — собираются через Node Exporter, Kube-state-metrics и CAdvisor.

### Установка Node Exporter

Он обычно ставится как DaemonSet — по одному поду на каждую ноду. Helm-чарт уже делает это автоматически. Если вы добавляете вручную:

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  # ... подробнее документы Prometheus
```

Node Exporter собирает:
- загрузку процессора
- использование памяти
- состояние файловых систем
- сетевую активность

### Добавление метрик к пользовательскому приложению

Смотрите, на примере Python с использованием библиотеки prometheus_client:

```python
from prometheus_client import start_http_server, Counter

REQUEST_COUNT = Counter("myapp_requests_total", "Total number of received requests")

def process_request(request):
    REQUEST_COUNT.inc()   # Инкрементируем счетчик при каждом запросе
    # ... здесь логика приложения

if __name__ == "__main__":
    start_http_server(8000)  # Запускаем сервер метрик на :8000
    while True:
        # Ваш код
```

Далее всё, что требуется — добавить Service и настроить соответствующий ServiceMonitor.

### Настройка Service для вашего приложения

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  ports:
  - name: http-metrics
    port: 8000
    targetPort: 8000
  selector:
    app: myapp
```

Теперь Prometheus автоматически найдёт и начнет собирать метрики с ваших подов.

## Использование PromQL для анализа метрик

Язык запросов PromQL позволяет создавать запросы для анализа и агрегации метрик. Вот несколько часто используемых примеров:

### Примеры запросов PromQL

- Количество активных подов по namespace:
  ```
  count(kube_pod_info{namespace="default"})
  ```

- Загрузка CPU на каждой ноде:
  ```
  sum(rate(node_cpu_seconds_total{mode="user"}[5m])) by (instance)
  ```

- Количество HTTP-ошибок за 5 минут:
  ```
  sum(rate(http_requests_total{status=~"5.."}[5m]))
  ```

- Процентная загруженность памяти:
  ```
  100 - (avg(node_memory_MemAvailable_bytes) / avg(node_memory_MemTotal_bytes) * 100)
  ```

Если вы используете Grafana, эти запросы можно строить прямо в дашбордах.

## Настройка алертов и оповещений через Alertmanager

Prometheus умеет не только собирать метрики, но и запускать оповещения (алерты) по событиям. Для передачи алертов в почту, Slack и другие сервисы используется Alertmanager.

### Пример alerta на переполнение памяти

```yaml
groups:
- name: example
  rules:
  - alert: HighMemoryUsage
    expr: node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Свободной памяти меньше 20%"
      description: "На инстансе {{ $labels.instance }} почти не осталось памяти."
```

- `expr` — условие на срабатывание алерта.
- `for` — длительность, чтобы не цеплять кратковременное превышение.

Для отправки уведомлений настройте Alertmanager через Helm-чарт или вручную через ConfigMap.

## Лучшая практика: экспортировать логи в Grafana Loki

Prometheus отвечает только за числовые метрики. Для работы с логами часто используют Grafana Loki, также интегрируемый через Helm. В связке Prometheus + Grafana + Loki вы получаете мониторинг всего жизненного цикла приложения: метрики, логи, алерты и дашборды, удобные в анализе.

## Масштабирование Prometheus

Prometheus — масштабируемое решение, но он хранит все метрики локально. Если вам нужно "бесконечное" хранение или данные со всего флота кластеров, рассмотрите Thanos или Cortex (хранилища с облачной синхронизацией), которые добавляют федерацию и долговременное хранение метрик к возможностям Prometheus.

## Основные сложности и советы по эксплуатации

- Контролируйте ретеншн хранения метрик (`--storage.tsdb.retention.time`).
- Следите за числом targets — слишком большое число эндпоинтов потребляет ресурсы.
- Используйте фильтры labels, чтобы не собирать ненужные метрики.
- Не забывайте обновлять чарты для устранения уязвимостей.

## Заключение

Prometheus — мощный инструмент для мониторинга Kubernetes-кластера, который легко развернуть, масштабировать и интегрировать с системой алертов. Он позволяет видеть в реальном времени то, что происходит в ваших приложениях, сервисах и инфраструктуре, дает гибкие возможности для анализа и автоматизации оповещений при возникновении проблем. Благодаря широкой поддержке комьюнити Prometheus часто становится стандартом мониторинга для cloud-native архитектур.

## Частозадаваемые технические вопросы по теме и ответы

### Как добавить мониторинг сторонних приложений, работающих вне Kubernetes?

Вам нужно развернуть экспортёр (например, node_exporter) на машине вне Kubernetes, открыть порт для метрик, и в конфиге Prometheus (или через ServiceMonitor, если Prometheus Operator используется с host discovery) добавить соответствующий target.

### Что делать, если Prometheus не видит новые поды в кластере?

Проверьте, корректно ли настроены ServiceMonitor/PodMonitor и есть ли на подах нужные лейблы. Также убедитесь в наличии RBAC на доступ к Kubernetes API для Prometheus.

### Как увеличить сохранность метрик (retention) в Prometheus?

Измените параметр запуска Prometheus:  
`--storage.tsdb.retention.time=30d`  
или настройте это через values.yaml в Helm-чарте.

### Как ограничить сбор слишком большого объёма метрик?

Используйте label selectors в ServiceMonitor или уменьшайте частоту pulls (интервал). Без нужды не мониторьте все namespace — фильтруйте targets.

### Как мониторить доступность самого Prometheus и Alertmanager?

Prometheus по умолчанию экспортирует свои метрики (/metrics). Добавьте правила алерта на отсутствие метрик “up” своих инстансов, и тогда вы узнаете о недоступности или сбое этих сервисов.