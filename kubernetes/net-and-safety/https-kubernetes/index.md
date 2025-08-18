---
metaTitle: Настройка и примеры использования HTTPS в Kubernetes
metaDescription: Научитесь настраивать HTTPS в Kubernetes - от генерации сертификатов до примеров применения Ingress и секретов для безопасного обмена данными
author: Олег Марков
title: Настройка и примеры использования HTTPS в Kubernetes
preview: Настройте HTTPS в кластере Kubernetes без лишних сложностей - используйте пошаговые инструкции, примеры манифестов и подробные пояснения для безопасного разворачивания сервисов
---

## Введение

Безопасность приложений и сервисов, работающих в Kubernetes, невозможна без правильной настройки HTTPS. Использование HTTPS гарантирует шифрование данных между клиентом и сервером, а значит - защищает ваш трафик от перехвата и атак "человек посередине". В современных инфраструктурах настройка HTTPS в Kubernetes стала стандартом, а не опцией. Эта статья поможет вам разобраться с основами, проведет через процесс генерации сертификатов, настройку секретов, создание Ingress с поддержкой TLS и раскроет популярные практики и подводные камни использования HTTPS в Kubernetes.

## Зачем нужен HTTPS в Kubernetes

Если вы развертываете сервисы в Kubernetes и хотите, чтобы ваши пользователи или интеграции получали доступ к ним безопасно, шифрованно, с подтверждением подлинности – потребуется настроить HTTPS. Он защищает данные в пути, подтверждает подлинность сервиса, уменьшает риск MITM-атак, а также часто требуется для соответствия законодательству или внутренним политикам безопасности компании. Kubernetes предоставляет гибкие инструменты для внедрения HTTPS, начиная с работы с секретами и заканчивая автоматизацией получения сертификатов через Cert-Manager или Let's Encrypt.

## Основные способы организации HTTPS в кластере Kubernetes

В Kubernetes можно настроить HTTPS для приложений несколькими основными способами, и чаще всего этим занимаются через:

- Использование Kubernetes Secret для хранения TLS-сертификатов
- Настройку Ingress-контроллеров с поддержкой TLS
- Использование автоматизированных решений для получения и ротации сертификатов (например, Cert-Manager)
- Прямую настройку TLS на уровне приложения (подходит в определённых случаях)

Рассмотрим эти методы подробнее, с инструкциями и примерами.

---

## Генерация TLS-сертификата и загрузка в Kubernetes

Для настройки HTTPS нам понадобится TLS-сертификат — вы можете получить его от публичного CA (например, Let's Encrypt), использовать внутренний CA, или сгенерировать self-signed сертификат для учебных, тестовых и непубличных сервисов.

### Как создать self-signed сертификат

Сначала сформируем приватный ключ и сертификат с помощью OpenSSL на вашей рабочей машине:

```sh
# Сгенерировать приватный ключ
openssl genrsa -out tls.key 2048

# Сгенерировать сертификат (от вас потребуется ввести Common Name - это должен быть домен вашего сервиса)
openssl req -new -x509 -key tls.key -out tls.crt -days 365 -subj "/CN=myapp.example.com"
```

В результате у вас появятся два файла — `tls.key` и `tls.crt`.

### Создание Kubernetes Secret с TLS

Теперь давайте загрузим сертификат и ключ в Kubernetes как секрет:

```sh
kubectl create secret tls my-tls-secret \
  --cert=tls.crt \
  --key=tls.key \
  -n my-namespace
```

- `my-tls-secret` — имя секрета, его будете указывать в Ingress или манифесте сервиса
- `my-namespace` — указывайте namespace, где разворачиваете сервис и Ingress

---

## Использование TLS-секретов в Ingress

Ingress — это объект Kubernetes, позволяющий задавать правила маршрутизации внешнего трафика к вашим сервисам. Чтобы проксировать HTTPS, Ingress использует TLS-секреты для сертификации.

### Пример манифеста Ingress для HTTPS

Вот пример Ingress с HTTPS, который будет маршрутизировать запросы к вашему приложению через защищенное соединение:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  namespace: my-namespace
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true" # Принудительно редиректить http на https
spec:
  tls:
    - hosts:
        - myapp.example.com # Домен, прописанный в сертификате
      secretName: my-tls-secret # Название созданного секрета с TLS-сертификатом
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-service # Название вашего сервиса
                port:
                  number: 80
```

В таком манифесте:

- В секции `tls` указываем домен и секрет, где хранятся ваши ключи.
- В секции `rules` задаем, какой сервис обслуживает запросы на этот домен.
- Аннотация `ssl-redirect` заставляет NGINX Ingress автоматически перенаправлять всех пользователей с HTTP на HTTPS.

---

## Разворачивание Ingress-контроллера

Чтобы Ingress работал, в кластере должен быть развернут Ingress-контроллер. Наиболее распространённый — NGINX Ingress Controller.

### Разворачивание NGINX Ingress Controller

В официальной документации Kubernetes есть подробные инструкции, но вот самое простое разворачивание через Helm:

```sh
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
```

После этого все ingress объекты, которые вы создаете, начнут обрабатываться этим контроллером.

---

## Автоматизация работы с сертификатами: Cert-Manager

Если вы не хотите вручную генерировать и загружать сертификаты, можно использовать Cert-Manager. Он умеет получать, обновлять и автоматически подключать TLS-сертификаты в ваши Ingress.

### Установка Cert-Manager с помощью Helm

```sh
kubectl create namespace cert-manager
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager --namespace cert-manager --version v1.12.3 \
  --set installCRDs=true
```

### Пример настройки самоподписанного Issuer

Issuer — объект, который указывает Cert-Manager, откуда получать сертификаты (self-signed, CA, Let's Encrypt и др.). Для начала разберём self-signed.

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: selfsigned-issuer
  namespace: my-namespace
spec:
  selfSigned: {}
```

Создаём Certificate, который будет автоматически размещён в виде секрета:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: myapp-tls
  namespace: my-namespace
spec:
  secretName: my-tls-secret # этот секрет будет создан автоматически
  duration: 2160h # 90 дней
  renewBefore: 360h # Обновлять за 15 дней до истечения
  dnsNames:
    - myapp.example.com
  issuerRef:
    name: selfsigned-issuer
    kind: Issuer
```

Теперь Cert-Manager сам сгенерирует сертификат и разместит его в Kubernetes Secret под именем `my-tls-secret`.

### Настройка Let's Encrypt с Cert-Manager

Более практичный и востребованный вариант — автоматическое получение бесплатных сертификатов от Let's Encrypt.

Пример ClusterIssuer для Let's Encrypt (проверка через HTTP):

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-http
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: youremail@example.com # Укажите ваш email для аварийных оповещений
    privateKeySecretRef:
      name: letsencrypt-http-account-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

Не забудьте заменить email на ваш собственный!

---

## Применение автоматических сертификатов в Ingress

После установки Cert-Manager и выпуска сертификата (через Certificate), схема использования секрета в Ingress не меняется:

```yaml
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: my-tls-secret
```
Здесь `my-tls-secret` подхватит актуальный сертификат благодаря cert-manager.

---

## Настройка HTTPS на уровне приложения

В некоторых случаях имеет смысл настраивать HTTPS не через Ingress, а прямо в приложении (например, когда приложение само слушает на 443 порту и обслуживает TLS).

### Пример: Подключение секретов к Pod для передачи сертификатов

Добавьте volume c типом secret в ваш деплоймент, чтобы передать файлы сертификатов в контейнер:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
spec:
  template:
    spec:
      containers:
        - name: myapp
          image: myapp-image
          ports:
            - containerPort: 443
          volumeMounts:
            - name: tls-certs
              mountPath: "/etc/tls"
              readOnly: true
      volumes:
        - name: tls-certs
          secret:
            secretName: my-tls-secret
```

Теперь в каталоге `/etc/tls` внутри контейнера будут лежать ваши сертификаты, и приложение может их использовать при запуске.

---

## Распространённые ошибки и диагностика проблем с HTTPS

### 1. Не совпадает CN/SAN у сертификата и домена

Если DNS-имя, к которому обращается клиент, не совпадает с CN (Common Name) или SAN (Subject Alternative Name) сертификата, появится ошибка "certificate is not valid for this domain". Проверьте, что все dnsNames в сертификате совпадают с именами в Ingress.

### 2. Ingress не перехватывает HTTPS-трафик

Убедитесь, что:

- Контроллер Ingress развернут и работает (проверьте pods в namespace, где установлен контроллер).
- В вручную объявленном Ingress-объекте указан нужный class контроллера (например, nginx).
- Секрет с сертификатом существует и доступен в том же namespace, что и Ingress.

### 3. Ошибка при проверке Let's Encrypt / Cert-Manager

Проверьте, корректно ли настроены DNS-записи, чтобы ваш поддомен указывал на публичный IP Ingress-контроллера. Удостоверьтесь, что нет конфликтующих правил firewall, которые могут мешать проверке.

---

## Практические советы по безопасности HTTPS в Kubernetes

- **Используйте современные алгоритмы** — по возможности используйте сертификаты не короче 2048 бит.
- **Автоматизируйте ротацию сертификатов** — Cert-Manager или сторонние механизмы помогут избежать просрочки.
- **Ограничивайте доступ к секретам** — используйте RBAC и разделяйте namespaces, чтобы снизить риск компрометации приватных ключей.
- **Включайте HTTP-to-HTTPS редиректы** — заставьте пользователей всегда использовать защищённое соединение.
- **Мониторьте срок действия сертификатов** — используйте алерты Prometheus или другие monitoring solutions.

---

## Заключение

Настройка HTTPS в Kubernetes — стандартная, но требующая внимания операция. Она комбинирует работу с tls-секретами, Ingress-контроллерами, возможными инструментами автоматизации сертификатов и нюансами маршрутизации. Для каждой задачи — тестирование, боевые сервисы, публичные или внутренние API — вы найдете свой подход: от self-signed сертификатов до автоматизации с Cert-Manager и Let's Encrypt. Регулярно проверяйте безопасность ваших ключей и конфигураций — и HTTPS будет вашим надежным помощником в Kubernetes.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как удалить TLS-секрет из namespace Kubernetes?

Выполните команду:
```sh
kubectl delete secret my-tls-secret -n my-namespace
```
Это удалит секрет только из указанного namespace.

---

### Как проверить, что сертификат действительно используется Ingress-контроллером?

Можно подключиться к сервису с помощью openssl:
```sh
openssl s_client -connect myapp.example.com:443
```
Проверьте параметры сертификата и CN/SAN в выводе.

---

### Как обновить TLS-секрет без простоя сервиса?

Обновите секрет:
```sh
kubectl create secret tls my-tls-secret --cert=new.crt --key=new.key --dry-run=client -o yaml | kubectl apply -f -
```
Ingress NGINX автоматически подхватит обновленный сертификат без рестарта.

---

### Как использовать wildcard сертификаты (например, *.example.com) в Kubernetes Ingress?

Генерируйте или приобретайте wildcard-сертификат, создайте с ним secret, далее используйте его в Ingress так же, как обычный сертификат. Убедитесь, что в секции tls > hosts указывается нужный wildcard-домен.

---

### Как настроить HTTPS только на определённых путях?

В стандартном Ingress нельзя разделить HTTP/HTTPS на разные пути без дополнительных аннотаций или custom templates. Используйте только tls в Ingress для домена — тогда все пути будут обслуживаться по HTTPS.

---