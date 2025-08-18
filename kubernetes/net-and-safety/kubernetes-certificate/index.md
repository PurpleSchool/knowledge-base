---
metaTitle: Гайд по управлению сертификатами в Kubernetes
metaDescription: Пошаговое руководство по работе с сертификатами в Kubernetes - создание, автоматизация и обновление TLS с помощью kubectl и cert-manager
author: Олег Марков
title: Гайд по Certificate Management в Kubernetes
preview: Подробный гайд по управлению сертификатами в Kubernetes - создавайте и обновляйте TLS-сертификаты, автоматизируйте процессы с cert-manager и защищайте кластер
---

## Введение

Защита взаимодействий между компонентами и сервисами кластера Kubernetes невозможна без грамотно организованного управления сертификатами. Сертификаты нужны для чего угодно — шифрования внутренних API, TLS для сервисов, аутентификации клиентов, защиты ingress-трафика, настройки RBAC и выхода во внешний мир. Однако ручное управление сертификатами — непростая и склонная к ошибкам задача, особенно при масштабировании. В этой статье я объясню, как устроено управление сертификатами в Kubernetes, расскажу о возможностях автоматизации (например, с помощью cert-manager) и приведу практические примеры, чтобы вы могли применять эти знания на практике.

---

## Основы Certificate Management в Kubernetes

### Важность сертификатов в Kubernetes

В Kubernetes сертификаты X.509 используются для:
- Защиты взаимодействия между компонентами кластера (apiserver, kubelet, controller-manager и т.д.)
- Обеспечения TLS для сервисов (например, через Ingress)
- Аутентификации пользователей и сервис-аккаунтов
- Шифрования данных, передаваемых через сеть

Без корректно настроенных сертификатов ваш кластер может быть уязвим для атак человек-в-середине (MITM), утечки данных и других угроз безопасности.

### Где хранятся и используются сертификаты

Обычно сертификаты в Kubernetes встречаются в следующих местах:
- **Secrets** — стандартный способ хранения tls-сертификатов (`type: kubernetes.io/tls`)
- **Ключевые файлы на мастер-ноде** — для компонентов control plane
- **Ingress-контроллеры** — сертификаты для публичных приложений через ingress
- **Webhook'и, API-сервисы и расширения** — защищённое взаимодействие с помощью TLS

Всё это создает потребность в прозрачном и безопасном управлении сертификатами, особенно с учётом их ограниченного срока действия.

---

## TLS-сертификаты в Kubernetes вручную

### Создание и хранение сертификата в Secret

Первый способ — сгенерировать сертификат и ключ с помощью OpenSSL и загрузить их в Kubernetes как секрет.

```bash
# Создаем приватный ключ и самоподписанный сертификат
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=myapp.local/O=MyOrg"

# Создаем секрет в Kubernetes
kubectl create secret tls my-tls-secret \
  --cert=tls.crt --key=tls.key \
  -n my-namespace
```

```yaml
# Пример описания secret для сертификата
apiVersion: v1
kind: Secret
metadata:
  name: my-tls-secret
  namespace: my-namespace
type: kubernetes.io/tls
data:
  tls.crt: <баз64 сертификат> # Сертификат, закодированный в base64
  tls.key: <баз64 ключ>       # Ключ, закодированный в base64
```

Теперь такой секрет можно подключить, например, к ingress-контроллеру.

#### Как использовать секрет

Добавьте его в ресурс Ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  tls:
    - hosts:
        - myapp.local
      secretName: my-tls-secret
  rules:
    - host: myapp.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-service
                port:
                  number: 80
```

### Особенности ручного управления

- Вам придется отслеживать сроки истечения сертификатов самостоятельно.
- Процесс обновления требует ручного пересоздания secret и перезапуска затрагиваемых компонентов.
- Необходимо защищать приватные ключи за пределами кластера.

---

## Автоматизация Certificate Management с cert-manager

Чтобы решить проблемы ручного управления и расширить возможности автоматизации, в Kubernetes активно используют [cert-manager](https://cert-manager.io/).

### Что такое cert-manager

cert-manager — это контроллер Kubernetes, который автоматически выдаёт, обновляет и управляет сертификатами от различных источников (PKI, ACME/Let's Encrypt, HashiCorp Vault, внутренние CA).

Преимущества:
- Автоматическая выдача и обновление TLS-сертификатов
- Удобное описание сертификатов как ресурсов Kubernetes (`Certificate`, `Issuer`)
- Интеграция с Let's Encrypt и собственными CA
- Полностью реализовано в виде CRD и контроллеров

### Установка cert-manager

Я предлагаю использовать установку через Helm (это наиболее популярный путь):

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

Компоненты cert-manager при такой установке размещаются в неймспейсе cert-manager. CRD устанавливаются автоматически.

### Основные CRD cert-manager

cert-manager добавляет в кластер свои абстракции:
- `Issuer` и `ClusterIssuer` — сущности, которые описывают, кем и как будут выдаваться сертификаты
- `Certificate` — описывает, какой сертификат нужно получить или обновлять

#### Пример: локальный self-signed CA

Сначала создайте self-signed Issuer:

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: selfsigned-issuer
  namespace: my-namespace
spec:
  selfSigned: {}
```

Теперь создайте Certificate:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: example-com-cert
  namespace: my-namespace
spec:
  secretName: example-com-tls
  duration: 2160h       # срок действия сертификата — 90 дней (в часах)
  renewBefore: 360h     # за сколько до истечения попытаться продлить
  subject:
    organizations:
      - My Example Co
  commonName: example.com
  dnsNames:
    - example.com
  issuerRef:
    name: selfsigned-issuer
    kind: Issuer
```

Когда вы примените этот манифест, cert-manager автоматически:
- создаст секрет `example-com-tls` с действующим сертификатом и ключом
- продлит его, когда потребуется

#### Пример: выпуск сертификата от Let's Encrypt

Для Let's Encrypt «подпишитесь» на SSL через `ClusterIssuer`.

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: you@example.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

Теперь ресурс Certificate можно связать с этим ClusterIssuer:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ingress-cert
  namespace: my-namespace
spec:
  secretName: ingress-tls-prod
  dnsNames:
    - my-domain.example.com
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
```

cert-manager выполнит валидацию домена через Ingress (решение ACME HTTP-01) и создаст tls-секрет с продвинутым сертификатом Let's Encrypt.

---

## Дополнительные сценарии и трюки

### Использование внешнего CA (например, Microsoft CA или HashiCorp Vault)

cert-manager поддерживает интеграцию с внешними центрами сертификации через разные виды `Issuer` (kube-ca, ca, vault, venafi и др.), что позволяет вам эффективно управлять сертификатами корпоративного уровня.

Пример `Issuer` для Vault:

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: vault-issuer
  namespace: my-namespace
spec:
  vault:
    server: https://vault.example.com
    path: pki/sign/my-role
    auth:
      tokenSecretRef:
        name: vault-token
        key: token
```

Создайте Secret с токеном Vault заранее:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: vault-token
  namespace: my-namespace
type: Opaque
data:
  token: <ваш base64-токен>
```

Теперь вы сможете забирать сертификаты напрямую из Vault.

### Как посмотреть сроки действия или детали сертификата

Смотрите, это можно сделать через kubectl и openssl:

```bash
# Получаем секрет в PEM-формате
kubectl get secret example-com-tls -n my-namespace -o jsonpath='{.data.tls\.crt}' | base64 --decode > cert.pem

# Смотрим информацию о сертификате
openssl x509 -in cert.pem -text -noout
```

Здесь мы сначала извлекли сертификат из секрета, затем посмотрели его структуру и срок действия.

### Как обновить секрет с новым сертификатом вручную

Если вы не пользуетесь cert-manager, процесс обновления выглядит так:

1. Сгенерируйте новый ключ и сертификат так же, как ранее (через openssl).
2. Обновите secret командой `kubectl create secret ... --dry-run=client -o yaml | kubectl apply -f -`.
3. Перезапустите поды, чтобы они увидели новый секрет.

---

## Практические советы по безопасности сертификатов

- Не храните приватные ключи открытыми строками вне кластера.
- Используйте ограниченный RBAC-доступ к секретам с типом `kubernetes.io/tls`.
- Не допускайте истечения сертификатов — автоматизация поможет этого избежать.
- Для production всегда старайтесь использовать well-trusted CA или известные сервисы выдачи.
- Внешние секретные менеджеры (HashiCorp Vault, AWS Secrets Manager) — хороший вариант для хранения и ротации ключей.
- Контролируйте доступ к ClusterIssuer и Issuer — через них можно выпустить сертификаты для любых доменов.

---

## Интеграция с CI/CD

Можно включить процесс выпуска сертификатов в пайплайны CI/CD:
- Применяйте манифесты Certificate и Issuer вместе с новым релизом приложения.
- Используйте [kubectl plugins](https://github.com/ahmetb/kubectl-plugins) или подходящие GitOps-инструменты (ArgoCD, Flux), чтобы автоматизировать наблюдение за сертификатами.
- Настраивайте auto-deploy новых TLS секретов для production/preview окружений.

Например, в GitLab CI:

```yaml
deploy-prod:
  stage: deploy
  script:
    - kubectl apply -f issuer.yaml
    - kubectl apply -f certificate.yaml
    - kubectl rollout restart deployment/myapp
```

---

## Заключение

Управление сертификатами — ключевая часть обеспечения безопасности Kubernetes. Можно обойтись руками и openssl для редких случаев, но для промышленного кластера явно лучше использовать cert-manager с автоматизацией всех жизненных циклов TLS. Благодаря интеграции с Let's Encrypt, Vault и другими решениями cert-manager закрывает почти все сценарии, встречающиеся в реальных внедрениях. Правильная схема ротации, хранения и мониторинга сертификатов существенно сокращает инфраструктурные риски, помогает избежать лишних отказов и обеспечивает надежную передачу данных внутри и вне кластера.

---

## Частозадаваемые технические вопросы по управлению сертификатами в Kubernetes

**Вопрос 1. Как обновить сертификат control plane-компонентов (например, apiserver) без простоя?**  
В Kubernetes можно использовать скрипты kubeadm (`kubeadm certs renew all`), чтобы продлить сертификаты компонентов master-нод. После ручной ротации обновите kubeconfig-файлы и перезапустите нужные pod'ы или сервисы, чтобы загрузить новые сертификаты.

**Вопрос 2. Как отследить, когда истекают все сертификаты в кластере?**  
Используйте скрипты, собирающие все tls-секреты или файлы из папки `/etc/kubernetes/pki`, преобразуйте в PEM и проверяйте через openssl. Для автоматизации можно настроить Job в кластере или воспользоваться алертингом Prometheus с экспортером cert-manager.

**Вопрос 3. Как проконтролировать, что cert-manager обновил tls-секрет?**  
Проверьте аннотацию `cert-manager.io/last-issued` у соответствующего секрета либо используйте команду `kubectl describe certificate <имя> -n <namespace>` для просмотра статуса выдачи.

**Вопрос 4. Можно ли использовать один секрет с сертификатом сразу в нескольких ingress?**  
Да, вы можете использовать один tls-secret в разных ingress-ресурсах с тем же доменом или поддоменами. Просто укажите `secretName` в каждом ingress, которому нужен этот сертификат, и убедитесь, что он доступен в нужном namespace.

**Вопрос 5. Как интегрировать cert-manager с кастомным ingress-контроллером?**  
Для этого ваш ingress-контроллер должен поддерживать размещение tls-секретов типа `kubernetes.io/tls`. cert-manager создает такие секреты — их просто понадобится правильно указать в спеке ingress вашего контроллера. Если требуется специфичная интеграция (например, custom annotations), добавьте нужные поля в разметку Certificate или в правила ingress.