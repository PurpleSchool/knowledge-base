---
metaTitle: Настройка Ingress с Nginx в Kubernetes
metaDescription: Подробная инструкция по настройке Ingress с Nginx в Kubernetes - настройте маршрутизацию HTTP и HTTPS трафика, ознакомьтесь с примерами манифестов и полезными советами
author: Олег Марков
title: Настройка Ingress с Nginx в Kubernetes
preview: Эффективно управляйте сетевым трафиком в Kubernetes с помощью Nginx Ingress - изучите практические примеры и получите понятные инструкции по настройке маршрутизации
---

## Введение

В Kubernetes управление сетевым трафиком, поступающим во внутренние сервисы приложения, является одной из ключевых задач. И здесь на сцену выходит Ingress — ресурс, позволяющий маршрутизировать HTTP(S) трафик, поступающий в кластер, по нужным сервисам на основании доменов, путей и других правил.

Одним из самых популярных контроллеров Ingress выступает Nginx. Он хорошо знаком разработчикам, прост в настройке и широко поддерживается сообществом. Nginx Ingress Controller помогает легко организовать балансировку нагрузки, SSL-терминацию и настройку маршрутов в Kubernetes.

Давайте вместе разберёмся, какую роль выполняет Ingress, зачем нужен Nginx Ingress Controller, как его разворачивать, настраивать и использовать для решения реальных задач. Я покажу вам примеры манифестов, объясню ключевые концепции и поделюсь лучшими практиками настройки.

---

## Что такое Ingress и зачем нужен Ingress Controller

### Базовые понятия

Kubernetes (K8s) самостоятельно управляет внутренними сетями между подами, но не предоставляет способов напрямую маршрутизировать внешний трафик на нужные сервисы по HTTP/HTTPS, особенно если речь идет об объединении множества сервисов под одним публичным IP.

**Ingress** — это объект K8s, описывающий правила маршрутизации веб-трафика (обычно HTTP и HTTPS) к сервисам внутри кластера. Однако, сам по себе Ingress только объявляет правила — для их работы необходим специальный контроллер.

**Ingress Controller** — это компонент, который следит за объектами типа Ingress и реализует сам сервер входящих соединений (например, создает конфиг для установленного Nginx или другого прокси).

### Чем отличается Ingress от сервисов типа LoadBalancer и NodePort

- **NodePort**: Открывает определенный порт на каждой ноде кластера, пробрасывая трафик внутрь. Не удобно, когда нужно разные сервисы опубликовать на одном IP.
- **LoadBalancer**: Создаёт внешний балансировщик, например, в облаке (AWS ELB, Google Cloud LB), и пробрасывает трафик внутрь. Удобно, но часто требует отдельного балансировщика (и IP) для каждого сервиса.
- **Ingress**: Позволяет по одному IP/порту (обычно 80/443) отдавать трафик на разные сервисы на основе host-имён (example.com, api.example.com) и путей (/api, /static). Гибкая маршрутизация в стиле reverse proxy.

### Почему выбирают Nginx Ingress Controller

Nginx — это надежный web-сервер и балансировщик, который отлично масштабируется, поддерживает тонкую настройку и множество дополнительных возможностей (лимиты, авторизация, редиректы и пр.). Официальный Nginx Ingress Controller — проект с открытым исходным кодом, поддерживаемый Kubernetes-сообществом.

---

## Развёртывание Nginx Ingress Controller в Kubernetes

### Способы установки

Самый распространенный способ — использовать официальный Helm chart или манифесты YAML. Я расскажу о каждом способе.

#### Установка через Helm

Helm — популярный менеджер пакетов для Kubernetes. Используя Helm, вы легко развернете Nginx Ingress Controller с нужной конфигурацией.

Добавьте репозиторий Helm:

```shell
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
```

Установите контроллер в namespace `ingress-nginx`:

```shell
kubectl create namespace ingress-nginx
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx
```

Комментарии к командам:

- `helm repo add` — подключает официальный репозиторий.
- `kubectl create namespace` — создаёт отдельное пространство имён.
- `helm install` — устанавливает релиз контроллера.

#### Установка через YAML-манифест

Если не хочется использовать Helm, воспользуйтесь готовыми манифестами:

```shell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.6/deploy/static/provider/cloud/deploy.yaml
```

(Здесь указывается актуальная версия. Проверьте [официальные инструкции](https://kubernetes.github.io/ingress-nginx/deploy/) для своего окружения.)

После установки вы получите несколько ресурсов (Deployment, Service, ConfigMap и др.) в namespace `ingress-nginx`.

### Проверка установки

Проверьте наличие подов Ingress Controller:

```shell
kubectl get pods -n ingress-nginx
```

Также убедитесь в наличии сервиса типа **LoadBalancer** (или NodePort, в зависимости от способа установки):

```shell
kubectl get svc -n ingress-nginx
```

Как только создан LoadBalancer, внешний IP появляется в колонке `EXTERNAL-IP`. Его можно использовать для настройки DNS на свои Ingress-правила.

---

## Создание простого Ingress-ресурса

### Развёртывание тестовых сервисов

Чтобы иметь что маршрутизировать, создаём два простых Deployment и Service:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hello-world
  template:
    metadata:
      labels:
        app: hello-world
    spec:
      containers:
      - name: hello-world
        image: hashicorp/http-echo
        args:
        - "-text=Hello World"
        ports:
        - containerPort: 5678
---
apiVersion: v1
kind: Service
metadata:
  name: hello-world
spec:
  selector:
    app: hello-world
  ports:
  - port: 80
    targetPort: 5678
```

Комментарий:
- Deployment запускает контейнер с HTTP-сервером на 5678 порту, который просто отвечает "Hello World".
- Service открывает сервис на 80 порту.

### Пример простого Ingress

Теперь создаём объект Ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hello-world-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: hello.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: hello-world
            port:
              number: 80
```

Пояснения:
- В `metadata.annotations` указан параметр для подмены пути — иногда это важно для корректной маршрутизации.
- Поле `spec.ingressClassName: nginx` говорит, что этим ресурсом должен заниматься Nginx Ingress Controller.
- В разделе `rules` логика такая: если запрошен host `hello.example.com` и путь соответствует `/`, трафик отдается сервису `hello-world:80`.

### Проверка маршрутизации

Обновите DNS, чтобы ваш домен `hello.example.com` указывал на внешний IP Ingress Controller:

```
hello.example.com    <EXTERNAL-IP>
```

Проверьте работу снаружи кластера:

```shell
curl http://hello.example.com/
# Ожидается ответ: Hello World
```

---

## Организация HTTPS с автоматическим получением сертификатов

### Подключение cert-manager

Для автоматического управления TLS сертификатами очень удобно использовать [cert-manager](https://cert-manager.io/). Он позволяет интегрироваться с Let's Encrypt и не только.

#### Установка cert-manager

```shell
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
```

Проверьте, что появились поды и CRD ресурсы:

```shell
kubectl get pods --namespace cert-manager
kubectl get crd | grep cert-manager
```

#### Настройка ClusterIssuer для Let's Encrypt

Создайте объект ClusterIssuer:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

Комментарий:
- `server` — URL Let's Encrypt.
- `email` — важен для уведомлений об истечении срока действия сертификата.
- Solver http01 говорит cert-manager использовать HTTP-challenge через Nginx Ingress.

#### Подключение TLS-сертификата к Ingress

Теперь добавим TLS в Ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hello-world-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - hello.example.com
    secretName: hello-world-tls  # cert-manager создаст secret с сертификатом
  rules:
  - host: hello.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: hello-world
            port:
              number: 80
```

После применения такого манифеста cert-manager автоматически получит сертификат и создаст `Secret`, который будет использоваться для TLS. Теперь трафик доступен и по HTTPS.

---

## Управление маршрутизацией и расширенные возможности

### Правила на основе путей и доменов

С помощью Ingress можно легко делать маршрутизацию по путям или хостам. Демонстрирую на примерах:

#### Маршрутизация по хостам

```yaml
rules:
- host: hello.example.com
  http:
    paths:
    - path: /
      pathType: Prefix
      backend:
        service:
          name: hello-world
          port:
            number: 80
- host: api.example.com
  http:
    paths:
    - path: /
      pathType: Prefix
      backend:
        service:
          name: api-service
          port:
            number: 80
```

#### Маршрутизация по путям

```yaml
rules:
- host: app.example.com
  http:
    paths:
    - path: /web
      pathType: Prefix
      backend:
        service:
          name: frontend
          port:
            number: 80
    - path: /api
      pathType: Prefix
      backend:
        service:
          name: backend
          port:
            number: 80
```

Здесь все запросы на `app.example.com/web/*` отправляются на сервис `frontend`, а `app.example.com/api/*` — на `backend`.

### Перенаправление, редиректы и перезапись пути

Nginx Ingress Controller поддерживает мощные аннотации. Смотрите, как делать rewrite и redirect:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$1
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /service/(.*)
        pathType: Prefix
        backend:
          service:
            name: custom-service
            port:
              number: 80
```

Комментарии:
- `rewrite-target` — задаёт правило для изменённого пути на backend, здесь — любая строка после /service/ будет перенаправлена просто в корень (`/$1`).
- `use-regex: "true"` — активирует регулярные выражения для поля path.

Другие полезные аннотации:
- `nginx.ingress.kubernetes.io/permanent-redirect: https://newsite.example.com$request_uri` — сделать 301-редирект.

### Ограничение доступа по IP

Чтобы ограничить доступ к маршруту, используйте аннотацию:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/whitelist-source-range: "192.168.1.0/24,127.0.0.1/32"
```

Теперь доступ разрешён только этим IP-адресам или подсетям.

### Настройка лимитов и ошибок

Можно задать кастомные страницы ошибок и лимиты на соединения:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/custom-http-errors: "404,503"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```

- `custom-http-errors` — список кодов ошибок, которые надо проксировать через nginx (можно обрабатывать).
- `proxy-body-size` — лимит размера тела запроса.

---

## Настройка внешнего доступа и взаимодействие с DNS

### Использование EXTERNAL-IP

Ingress Controller обычно создаёт сервис типа LoadBalancer и получает выделенный IP от вашего облака. Чтобы доступ извне заработал, нужно прописать записи в DNS:

Например, внешний IP вашего LoadBalancer — 1.2.3.4.

В DNS провайдере:

```
hello.example.com    A    1.2.3.4
app.example.com      A    1.2.3.4
```

Если IP пока не появился (стоит `<pending>`), дождитесь, когда балансировщик будет готов.

Для локального тестирования можно добавить запись в `/etc/hosts`:

```
1.2.3.4 hello.example.com
```

### Использование NodePort

Если у вас не облачный кластер (minikube, kind и др.), возможно, наружу открыт NodePort (например, 30080). Тогда обращайтесь к любому рабочему node по `http://<NODE-IP>:30080/`.

---

## Обеспечение отказоустойчивости и масштабирование

### Реплики контроллера

Для production системы важно держать несколько копий Nginx Ingress Controller. Это делается настройкой раздела `controller.replicaCount` для Helm chart или в Deployment YAML.

```yaml
spec:
  replicas: 3  # Три копии контроллера
```

Nginx Ingress Controller масштабируется горизонтально, но клиентские сессии могут "прыгать" между копиями. Для sticky сессий (например, websockets) рекомендую использовать соответствующие аннотации nginx.

### Проблемы с производительностью и тонкая настройка

Nginx Ingress Controller поддерживает множество параметров через ConfigMap (`ingress-nginx-controller`), где можно настроить размеры пула подключений, таймауты, лимиты ресурсов и др.

Вот пример изменения лимитов тел:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
data:
  proxy-body-size: "20m"
  proxy-read-timeout: "60"
  proxy-send-timeout: "60"
```

После изменения ConfigMap контроллер сам перечитает новые значения.

---

## Обновление и отладка Ingress Controller

### Просмотр состояния Ingress

Проверьте статус своих Ingress ресурсов:

```shell
kubectl describe ingress hello-world-ingress
```

В Events будут подробности, почему путь не работает (если есть ошибки).

### Логи Ingress Controller

Для диагностики смотрите логи pod'ов Ingress Controller:

```shell
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

### Проверка конфигурации Nginx

Можно получить текущий сгенерированный nginx.conf прямо с pod:

```shell
kubectl exec -it <nginx-ingress-pod> -n ingress-nginx -- cat /etc/nginx/nginx.conf
```

---

## Безопасность Ingress

### Ограничение доступа по IP и CORS

Уже упомянуто выше: с помощью аннотаций можно легко ограничить подсети или IP, с которых разрешён доступ.

Для поддержки CORS добавьте аннотации вида:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://client.example.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST"
```

### Авторизация через BasicAuth

Nginx Ingress поддерживает basic-auth с помощью Secret:

```shell
# Создаем аккаунт 'user' с паролем 'password'
htpasswd -c auth user
# Создаём секрет в Kubernetes
kubectl create secret generic basic-auth --from-file=auth
```

Добавляем аннотацию в Ingress:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth
    nginx.ingress.kubernetes.io/auth-realm: "Protected Area"
```

### Защита от DoS

В аннотациях указываются лимиты на соединения:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/limit-connections: "5"
    nginx.ingress.kubernetes.io/limit-rpm: "60"
```

---

## Использование кастомных конфигов и шаблонов

В некоторых случаях стандартных возможностей мало. Вы можете прокидывать кастомные конфиги в Nginx через ConfigMap и аннотацию `nginx.ingress.kubernetes.io/server-snippet` или `configuration-snippet`:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/server-snippet: |
      add_header X-Frame-Options "DENY";
      add_header X-Content-Type-Options "nosniff";
```

Это мощно, но требует осторожности — ломать общий конфиг Nginx не стоит.

---

## Обновление и удаление Ingress Controller

Для обновления версии Nginx Ingress Controller следуйте документации по миграции — рекомендации меняются от релиза к релизу. Обычно достаточно поменять версию Helm chart или загрузить новый манифест.

Для удаления контроллера если установлен Helm:

```shell
helm uninstall nginx-ingress -n ingress-nginx
```

Или удалить соответствующий namespace и все ресурсы:

```shell
kubectl delete namespace ingress-nginx
```

---

## Заключение

Как видите, использование Ingress с Nginx в Kubernetes значительно упрощает централизованное управление и маршрутизацию одиночного входного трафика в разные сервисы, ускоряет интеграцию с TLS/HTTPS, помогает реализовать балансировку, ограничения и безопасность. Вы получили представление, как развернуть контроллер, описывать правила маршрутизации, подключать безопасный HTTPS и использовать типовые аннотации для решения общих задач.

Nginx Ingress Controller поддерживает по-настоящему широкий спектр сценариев, поэтому изучайте официальную документацию и не бойтесь экспериментировать с настройками для вашего кластера.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как сделать так, чтобы Ingress обслуживал сразу несколько доменов (wildcard домены)?

Для этого можно использовать правило с шаблоном:

```yaml
rules:
- host: "*.example.com"
  http:
    paths:
    - path: /
      pathType: Prefix
      backend:
        service:
          name: wildcard-service
          port:
            number: 80
```
Но официальная поддержка wildcard доменов в Ingress бывает ограничена — для Let's Encrypt также потребуется отдельная настройка DNS challenge.

### Как настроить sticky сессии (session affinity) через Nginx Ingress?

Добавьте аннотацию к Ingress:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "route"
```

Это добавит cookie, по которому nginx будет направлять запросы одного клиента одной pod.

### В чём разница между старым стилем Ingress (beta) и networking.k8s.io/v1?

Главное отличие — улучшенные типы, поддержка постоянных именованных портов, новые pathType (`Prefix`, `Exact`). Используйте только apiVersion: networking.k8s.io/v1 (устаревшие версии deprecated).

### Как деплоить несколько Ingress Controller внутри одного кластера?

Для этого создаются IngressClass с разными именами (например, nginx-public, nginx-internal), а в манифестах прописывается нужный `ingressClassName`. Каждый контроллер следит только за своими Ingress.

### Как разрешить большие файлы (например, upload до 100 МБ)?

Добавьте в ConfigMap или как аннотацию:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
```
Или в ConfigMap глобально: `proxy-body-size: "100m"`.

Проверьте, что resource limits в вашей системе поддержки это разрешают (параметры памяти, таймаутов backend сервиса).