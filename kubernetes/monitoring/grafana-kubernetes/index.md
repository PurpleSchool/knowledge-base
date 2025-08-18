---
metaTitle: Мониторинг Kubernetes с Grafana
metaDescription: Как мониторить кластеры Kubernetes с помощью Grafana - развертывание, настройка, дашборды и метрики. Примеры и инструкции для DevOps и разработчиков
author: Олег Марков
title: Мониторинг Kubernetes с Grafana
preview: Научитесь быстро настроить мониторинг кластера Kubernetes с Grafana. Получите пошаговые инструкции, настройте метрики, оповещения и визуализации для DevOps-эффективности
---

## Введение

Мониторинг – ключевая задача для любой инфраструктуры, а в динамичных оркестраторах вроде Kubernetes она становится еще важнее. Вам нужно быстро реагировать на сбои, видеть нагрузку на узлы, понимать, насколько ресурсы используются эффективно, и устранять проблемы до того, как они скажутся на пользователях. Чтобы держать руку на пульсе, обычно используют системы, которые собирают метрики, визуализируют их и помогают следить за состоянием кластера в реальном времени.

Grafana – популярная платформа для визуализации и анализа данных, которая прекрасно сочетается с инструментами мониторинга в Kubernetes, особенно с Prometheus. В этой статье вы разберетесь, как развернуть мониторинг Kubernetes кластера через Grafana, собрать метрики, подключить готовые дашборды, настроить алерты и получить удобную инфраструктуру для контроля за состоянием всего кластера.

## Что такое Grafana и почему ее выбирают

Давайте кратко обсудим, что такое Grafana и почему она часто используется вместе с Kubernetes:

- **Гибкость подключения источников данных** – Grafana поддерживает множество бэкендов (Prometheus, InfluxDB, Elasticsearch и др.)
- **Визуализация** – вы быстро получаете наглядные панели с графиками и таблицами.
- **Многообразие дашбордов** – масса готовых шаблонов для мониторинга Kubernetes.
- **Открытое ПО и активное сообщество**.

## Как устроен мониторинг в Kubernetes

Чтобы мониторить Kubernetes с помощью Grafana, нужен минимум три ключевых компонента:

1. **Экспортеры** (например, kube-state-metrics) — собирают различные метрики из компонетов Kubernetes.
2. **Система сбора и хранения метрик** (чаще всего — Prometheus).
3. **Визуализация** — Grafana.

Вот схема того, как данные движутся от кластера к вашему графику в Grafana:

```
Kubernetes -> Экспортеры -> Prometheus -> Grafana
```

Теперь давайте пошагово разберём, как это реализовать на практике.

## Шаг 1. Установка Prometheus и Grafana в Kubernetes

### Используем Helm для удобства

Helm — это менеджер пакетов для Kubernetes, который упрощает установку сложных приложений.

Пример команды для установки Helm (если у вас его еще нет):

```sh
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Добавляем Helm-репозиторий Prometheus Community

```sh
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### Устанавливаем Prometheus и Grafana

Самый простой способ – использовать корректно настроенный chart `kube-prometheus-stack`, который содержит и Prometheus, и Grafana, и все необходимые экспортеры:

```sh
kubectl create namespace monitoring
helm install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring
```

Helm скачает, настроит и запустит все нужные компоненты за вас. Вы получите:

- Prometheus (для сбора и хранения метрик)
- Alertmanager (для оповещений)
- kube-state-metrics (для состояния ресурсов внутри кластера)
- Grafana

### Проверяем работу компонентов

**Список активных подов:**

```sh
kubectl get pods -n monitoring
```

Вы должны увидеть поды с именами, содержащими `prometheus`, `grafana`, `kube-state-metrics`, `alertmanager` и т.д.

## Шаг 2. Доступ к Grafana

Grafana — веб-приложение, по умолчанию доступное только внутри кластера Kubernetes. Чтобы получить к ней доступ с локального компьютера, используйте port-forward:

```sh
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
```

Теперь Grafana станет доступна по адресу http://localhost:3000

### Получение пароля администратора Grafana

Пароль обычно хранится в секрете. Давайте вытащим его командой:

```sh
kubectl get secret --namespace monitoring monitoring-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

Логин по умолчанию — `admin`.

## Шаг 3. Добавление источника данных Prometheus в Grafana

Этот шаг часто уже сделан чартом `kube-prometheus-stack`, но если вы ставили все вручную, придется добавить источник данных руками.

Для этого:

1. Откройте веб-интерфейс Grafana.
2. Перейдите в **Configuration → Data Sources**.
3. Нажмите **Add data source**, выберите **Prometheus**.
4. В поле URL обычно впишите `http://prometheus-operated.monitoring.svc:9090` (или адрес, соответствующий вашей установке).
5. Сохраните настройки.

Теперь Grafana знает, откуда брать метрики.

## Шаг 4. Импорт готовых дашбордов Kubernetes

Grafana Dashboards — настоящая кладезь шаблонов. Чтобы получить полную картину по кластеру — не нужно рисовать всё вручную.

1. В Grafana откройте раздел **Dashboards → Import**.
2. Введите ID готового дашборда — например, один из самых популярных: `315` (Kubernetes cluster monitoring (via Prometheus)).
3. Следуйте инструкциям для выбора источника данных (выберите Prometheus).
4. Сохраните дашборд.

Дашборд появится у вас в списке, все графики сразу будут заполняться реальными данными.

## Какие метрики доступны и что они показывают

При использовании kube-prometheus-stack по умолчанию собираются метрики на разных уровнях:

- **Cluster** – загрузка CPU/памяти, общее число подов, узлов.
- **Node** – нагрузка на каждую ноду, занятость ресурсов, состояния дисков, сети.
- **Pod/Container** – статус, использование ресурсов, рестарты.
- **Kubernetes Events** – изменения состояния ресурсов, ошибки.
- **Custom metrics** – если вы добавляете свои экспортеры или application metrics.

Например, метрика:

```
container_cpu_usage_seconds_total{namespace="default", pod="example-pod"}
```
— показывает, сколько процессорного времени съел под.

Ещё один пример для количества running-подов:
```
kube_pod_status_phase{phase="Running"}
```

Можно комбинировать фильтры по namespace, node, pod — сразу видно, где узкое место.

## Настройка алертов в Grafana

От визуализации к автоматическому реагированию.

### Через Prometheus Alertmanager

Обычно алерты базово настраиваются через Prometheus Rule и Alertmanager. Пример файла PrometheusRule:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: high-cpu-alert
  namespace: monitoring
spec:
  groups:
  - name: NodeAlerts
    rules:
    - alert: HighCPULoad
      expr: sum(rate(container_cpu_usage_seconds_total{image!=""}[5m])) by (instance) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: Высокое использование CPU на узле {{ $labels.instance }}
```

Давайте разберём, как этот пример работает:

- `expr` — выражение, вычисляющее метрику для алерта.
- `for` — как долго условие должно оставаться истинным, чтобы сработал алерт.
- `annotations` — можно добавить детали, которые уйдут в оповещение.

### Через Grafana Alerts

Grafana 8+ поддерживает собственную систему алертов. Пример настройки:

1. Откройте нужный дашборд, выберите график, щелкните "Edit".
2. Перейдите на вкладку "Alert".
3. Укажите выражение, при выполнении которого алерт должен срабатывать.
4. Настройте канал доставки: почта, Slack, Telegram и т.д.

## Кастомные метрики: мониторинг своих приложений

Для мониторинга кастомных метрик (например, количества обращений, медленных запросов или бизнес-метрик) внутри контейнеров в Kubernetes чаще всего используют exporter библиотеки Prometheus для разных языков.

Пример для Go приложения (пакет promhttp):

```go
// Импортируем библиотеку для экспорта метрик
import "github.com/prometheus/client_golang/prometheus/promhttp"
// Запускаем http-сервер с endpoint /metrics
http.Handle("/metrics", promhttp.Handler())
http.ListenAndServe(":2112", nil)
```

Далее регистрируем этот порт как endpoint ServiceMonitor, чтобы Prometheus начал собирать ваши метрики.

### Пример ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app-monitor
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
    - port: metrics
      path: /metrics
```

Grafana автоматически увидит ваши новые метрики через интерфейс Prometheus.

## Защита и доступ к Grafana

Чтобы ограничить доступ к дашборду:

- Используйте аутентификацию Grafana (можно подключить LDAP, OAuth).
- Не открывайте port-forward на весь интернет.
- Размещайте Grafana за Ingress с авторизацией.

## Лучшие практики и тонкости

- **Отдельный namespace.** Все мониторинговые компоненты держите отдельно, чтобы было проще управлять их обновлениями и доступом.
- **Обновление чарта.** kube-prometheus-stack активно развивается, не забывайте обновлять Helm chart.
- **Хранение данных.** Прометей по умолчанию хранит метрики в локальном PVC, для долгосрочного хранения настройте remote write (например в Cortex, Thanos).
- **Резервные копии**. Регулярно делайте backup PVC для Prometheus, особенно если у вас важные исторические метрики.

## Миграция и масштабирование

Если ваш кластер становится больше, Prometheus может не справляться с сохранением всех метрик.

В этом случае рекомендую обратить внимание на:
- Thanos, Cortex — системы, которые позволяют распределить нагрузку хранения и обработку запросов.
- Разделение Prometheus по namespace.
- Оптимизация retention политики.

## Интеграция с другими системами

Grafana позволяет объединять метрики не только от Kubernetes. Вы можете, например:

- Добавить логгирование из Loki.
- Вытянуть системные метрики с Node Exporter.
- Подключить сторонние источники — базы данных, облачные сервисы и т.д.

Это повышает видимость всей инфраструктуры на одной панели.

---

Вооружившись этими знаниями, теперь вы сможете развернуть, настроить и расширить мониторинг Kubernetes кластера с помощью Grafana, учитывая все тонкости и лучшие практики эксплуатации.

## Частозадаваемые технические вопросы

### Как сделать так, чтобы Grafana была доступна извне через DNS-имя?

Вам нужно создать объект Ingress в Kubernetes. Убедитесь, что установлен ingress-контроллер (например, nginx-ingress). Пример Ingress для Grafana:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  namespace: monitoring
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: grafana.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: monitoring-grafana
            port:
              number: 80
```
Теперь, если ваш DNS указывает на ingress-контроллер, Grafana будет доступна по адресу http://grafana.example.com

### Как ограничить сбор метрик только определенными namespace?

Отредактируйте Prometheus custom resource или values Helm-чарта. Добавьте фильтр в разделе `scrapeNamespaceSelector`:
```yaml
scrapeNamespaceSelector:
  matchNames:
    - default
    - production
```
Такая настройка позволит собирать метрики только из нужных пространств имён.

### Почему метрики в Grafana обновляются с задержкой?

Обычно это из-за частоты scrape-интервала Prometheus. Проверьте в настройках Prometheus параметр `scrape_interval`. Стандарт — 30с, для более быстрой реакции можно снизить до 15с, но это увеличит нагрузку.

### Как добавить метрики от сторонних экспортеров, например, nginx-prometheus-exporter?

Разверните экспортер в кластере, создайте Service и ServiceMonitor для него. Проверьте, что ServiceMonitor настроен правильно на порт и path экспорта метрик. После этого метрики появятся в Prometheus и, соответственно, в Grafana.

### Как экспортировать дашборды Grafana в формате JSON для переноса в другой кластер?

В интерфейсе Grafana откройте нужный дашборд, выберите "Share" → "Export" → "Save to file". Импортировать такой дашборд можно через "Import" в другом экземпляре Grafana.