---
metaTitle: Использование Vault в Kubernetes
metaDescription: Освойте интеграцию Vault с Kubernetes - пошаговые инструкции по безопасному хранению секретов, автоматической выдаче токенов и практические примеры для защиты ваших приложений
author: Олег Марков
title: Использование Vault в Kubernetes
preview: Погрузитесь в практику использования HashiCorp Vault в Kubernetes и узнайте, как обеспечить безопасность ваших секретов с автоматической аутентификацией и инъекцией в поды
---

## Введение

Когда вы разрабатываете и запускаете приложения в Kubernetes, вопрос безопасного хранения и управления секретами (к примеру, паролями, токенами, ключами API) становится одним из самых важных. Несмотря на встроенные возможности Kubernetes по работе с секретами, они не всегда соответствуют высоким требованиям к безопасности, динамичности и удобству, особенно в крупных и распределённых системах.

Здесь на помощь приходит HashiCorp Vault — инструмент, который позволяет централизованно управлять секретами, ротацией ключей, а также детально настраивать доступ к ним. В этой статье я познакомлю вас с тем, как эффективно интегрировать Vault в инфраструктуру Kubernetes, настроить автоматическую выдачу секретов для ваших приложений и использовать все основные возможности системы.

## Почему Vault и почему Kubernetes

### Проблемы стандартных секретов Kubernetes

Kubernetes поддерживает тип ресурса Secret, но он обладает существенными ограничениями:
- Секреты хранятся в etcd в base64, что не защищает их от чтения.
- Нет встроенной ротации секретов.
- Ограниченные возможности по аудиту доступа к секретам.

Такие ограничения могут привести к утечке данных, если кто-то получит доступ к etcd или API Kubernetes.

### Главные преимущества Vault

С помощью Vault вы получаете:
- Централизованное и шифрованное хранилище для всех секретов.
- Механизмы динамической ротации секретов (например, базы данных).
- Гранулярный RBAC и аудит доступа.
- Возможность безопасно выдавать временные токены приложениям, которые работают в Kubernetes.

Интеграция Vault с Kubernetes становится стандартом де-факто в вопросах безопасного управления секретами в Cloud Native инфраструктуре.

## Основные архитектурные схемы использования Vault в Kubernetes

Перед тем, как приступить к практической части, кратко опишу основные варианты применения Vault:

1. **Аутентификация через Kubernetes ServiceAccount**  
   Контейнер внутри пода получает временный токен, основываясь на своем ServiceAccount, затем использует этот токен для аутентификации в Vault.
   
2. **Инъекция секретов в поды через Vault Agent Sidecar**  
   Vault Agent запускается вместе с приложением (sidecar). Он получает секреты из Vault и монтирует их, например, как файлы в файловую систему пода.

3. **Интеграция через CSI драйвер (Vault CSI Provider)**  
   Используется нативная поддержка секретов через CSI, что позволяет монтировать секреты как тома в контейнеры.

Давайте перейдем к практической реализации интеграции Vault с Kubernetes.

## Установка и базовая настройка Vault в Kubernetes

### Разворачивание Vault в кластере

Вы можете развернуть Vault двумя основными способами:

- **Внешний Vault** — запускается вне кластера, например, как отдельный сервис VM или managed сервис.
- **Внутренняя инсталляция** — Vault разворачивается внутри самого Kubernetes в виде набора подов и сервисов.

Здесь мы рассмотрим пример деплоя Vault в сам Kubernetes с помощью Helm. Helm — популярный инструмент управления пакетами для Kubernetes.

#### Шаг 1: Установка Helm-чарта Vault

```sh
# Добавьте репозиторий Helm-чартов HashiCorp
helm repo add hashicorp https://helm.releases.hashicorp.com

# Обновите репозитории
helm repo update

# Установите Vault в namespace vault
kubectl create namespace vault
helm install vault hashicorp/vault --namespace vault
```

#### Шаг 2: Инициализация и разблокировка Vault

После установки нужно инициализировать Vault и разблокировать его ключами:

```sh
# Получите имя пода Vault
export VAULT_POD=$(kubectl get pods -n vault -l "app.kubernetes.io/name=vault" -o jsonpath="{.items[0].metadata.name}")

# Инициализация Vault
kubectl exec -n vault $VAULT_POD -- vault operator init

# Сохраните ключи и root token, выведенные в результате, в безопасном месте.
```

Далее нужно выполнить разблокировку (unseal):

```sh
# Введите нужное количество unseal ключей (обычно 3)
kubectl exec -n vault $VAULT_POD -- vault operator unseal <ключ-1>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <ключ-2>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <ключ-3>
```

#### Шаг 3: Проверка статуса

```sh
kubectl exec -n vault $VAULT_POD -- vault status
```
Vault должен быть "Sealed: false".

### Разрешение Pod'ам Kubernetes обращаться к Vault

#### Включение Kubernetes Auth методa во Vault

Давайте разрешим подам получать токены через свой ServiceAccount.

```sh
# Эту команду выполняйте внутри пода Vault или через port-forward и vault CLI

# Включение kubernetes auth backend
vault auth enable kubernetes

# Получение service account token, CA cert и endpoint API Kubernetes
export SA_NAME=vault
export NAMESPACE=vault

SECRET_NAME=$(kubectl get sa $SA_NAME -n $NAMESPACE -o jsonpath="{.secrets[0].name}")
TOKEN_REVIEW_JWT=$(kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath="{.data.token}" | base64 --decode)
KUBE_CA_CERT=$(kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath="{.data['ca\.crt']}" | base64 --decode)
KUBE_HOST=https://$(kubectl get svc kubernetes -n default -o jsonpath='{.spec.clusterIP}')

# Конфигурируем Vault для работы с Kubernetes API
vault write auth/kubernetes/config \
  token_reviewer_jwt="$TOKEN_REVIEW_JWT" \
  kubernetes_host="$KUBE_HOST" \
  kubernetes_ca_cert="$KUBE_CA_CERT"
```

#### Настройка роли для доступа

Теперь создайте роль в Vault, которая будет разрешать определенным ServiceAccount получать определенные секреты:

```sh
vault write auth/kubernetes/role/example-role \
    bound_service_account_names=app-sa \
    bound_service_account_namespaces=default \
    policies=example-policy \
    ttl=1h
```

- `app-sa` — имя Service Account, от которого будут обращаться к Vault.
- `default` — namespace, где используется этот SA.
- `policies` — список политик Vault, определяющих доступ.

#### Пример политики

```hcl
# Политика, разрешающая читать секреты по пути secret/data/app
path "secret/data/app/*" {
  capabilities = ["read"]
}
```

## Пример внедрения секретов с помощью Vault Agent Sidecar

Один из самых удобных способов инъекции секретов — это использование sidecar контейнера Vault Agent.

### Пример манифеста пода

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-vault
  namespace: default
spec:
  serviceAccountName: app-sa
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: secret-vol
      mountPath: /mnt/secrets
    # ... другие опции
  volumes:
  - name: secret-vol
    emptyDir: {}
  # Sidecar контейнер Vault Agent
  initContainers:
  - name: vault-agent
    image: hashicorp/vault:1.11.0
    env:
      - name: VAULT_ADDR
        value: "http://vault.vault.svc:8200" # Адрес сервиса vault
    command:
      - vault
    args:
      - agent
      - -config=/etc/vault/vault-agent-config.hcl
    volumeMounts:
      - name: secret-vol
        mountPath: /mnt/secrets
      - name: vault-agent-config
        mountPath: /etc/vault/
  volumes:
    - name: vault-agent-config
      configMap:
        name: vault-agent-config
```

Здесь Vault Agent получает секреты и сохраняет их в volume, который монтируется в основной контейнер.

### Пример vault-agent-config.hcl

```hcl
# Конфигурация Vault Agent для Kubernetes аутентификации и инъекции секрета
auto_auth {
  method "kubernetes" {
    mount_path = "auth/kubernetes"
    config = {
      role = "example-role" # Это роль, созданная на предыдущем этапе
    }
  }
  sink "file" {
    config = {
      path = "/mnt/secrets/.vault-token"
    }
  }
}

template {
  source      = "/etc/vault/mysecret.ctmpl"
  destination = "/mnt/secrets/mysecret.txt"
}
```

#### Пример шаблона секрета для template stanza

```hcl
{{- with secret "secret/data/app/config" -}}
username: {{ .Data.data.username }}
password: {{ .Data.data.password }}
{{- end }}
```

Шаблон сохранится в файл `/mnt/secrets/mysecret.txt` до запуска основного контейнера.

## Вариант: Инъекция секретов через Vault CSI Provider

Недавно в Kubernetes появился стандартный способ работы с секретами сторонних хранилищ — Container Storage Interface (CSI) SecretProvider. С помощью Vault CSI Provider секреты автоматически монтируются как файлы или environment переменные прямо в под.

Установка и настройка требует установки CSI драйвера:

```sh
kubectl apply -f https://github.com/hashicorp/vault-csi-provider/releases/latest/download/deployment.yaml
```

Далее вы описываете SecretProviderClass, связываете с ServiceAccount и используете его в формате CSI volume.

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: vault-secrets
spec:
  provider: vault
  parameters:
    vaultAddress: "https://vault.vault.svc:8200"
    roleName: "example-role"
    objects: |
      - objectName: "app-config"
        secretPath: "secret/data/app/config"
        secretKey: "username"
```

В Pod вы монтируете том, используя созданный SecretProviderClass.

## Тонкости и лучшие практики

### Ротация и управление доступом

Vault позволяет автоматически обновлять секреты, предотвращая устаревание данных в Kubernetes, если ваши приложения могут «перечитывать» файл либо слушать событие изменения (например, через SIGHUP).

Рекомендуется:
- Минимизировать количество политик и ролей.
- Использовать отдельные роли и политики на каждый микросервис.
- Всегда обновлять конфигурационные файлы или переменные при изменении секрета (re-read или перезапуск).

### Аудит и журналы

Vault хранит подробный аудит всех операций — обязательно настраивайте аудит для обнаружения подозрительных действий.

```sh
vault audit enable file file_path=/vault/logs/audit.log
```

### Как обезопасить доступ к Vault

- Разрешайте соединение с Vault только из trusted networks или с помощью mTLS.
- Используйте минимум разрешений у ролей (principle of least privilege).
- Следите за своевременной ротацией ключей root/unseal.

### Интеграция с другими инструментами

Vault поддерживает не только Kubernetes и собственные AppRole/Kubernetes методы авторизации, но и LDAP, AWS IAM, Azure Managed Identity и др., что удобно для гибридных инфраструктур.

## Заключение

Использование Vault в Kubernetes выводит безопасность секретов на качественно новый уровень, позволяя реализовать централизованное управление, аудит, гибкую авторизацию и динамическую ротацию секретных данных. Независимо от того, используете ли вы Vault Agent Sidecar, CSI provider или иные механизмы инъекции секретов — подходы с Vault легко адаптируются к любому сценарию масштабируемых и production-ready приложений в Kubernetes. Освоив эту интеграцию, вы сможете обеспечить безопасность своих сервисов и снизить риски, связанные с утечкой чувствительных данных.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как ограничить доступ пода к определённым секретам Vault?

Создайте отдельную роль и политику Vault для ServiceAccount только нужного пода. В политике определяйте конкретные пути секретов, к которым разрешён доступ, а также используйте ограничение по namespace и ServiceAccount. Например:

```hcl
path "secret/data/payment/*" {
  capabilities = ["read"]
}
```

### Как выполнить автоматическую ротацию секретов (например, базы данных) в Vault и обновить их в поде?

Используйте dynamic secrets Vault (например, database secrets engine). При изменении секрета Vault автоматически обновит значение. В поде необходимо настроить перезапуск или сигнализацию приложению для перечитывания секрета, либо использовать функции Hot Reload приложения.

### Что делать при ошибке "403 forbidden" при запросе к Vault из пода?

Проверьте роль Vault, сервисный аккаунт пода и namespace — значения должны совпадать с настройками роли в Vault. Убедитесь, что у Vault есть права проверять ServiceAccount в Kubernetes (правильный JWT, cert и endpoint).

### Как безопасно хранить unseal ключи и root token Vault?

Используйте механизмы распределения секретов (например, HashiCorp Vault Shamir's Secret Sharing), храните части ключей в разных защищённых местах. Root token используйте только для административных задач и отключайте (revoke), когда он не нужен.

### Можно ли работать с Vault в нескольких кластерах Kubernetes одновременно?

Да, можно — Vault поддерживает работу с несколькими кластерами. Для этого создайте отдельные роли и настройки kubernetes-auth backend для каждого кластера, чтобы разграничить доступ и повысить безопасность.