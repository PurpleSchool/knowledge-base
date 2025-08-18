---
metaTitle: Руководство по работе с Kubernetes API
metaDescription: Объемное практическое руководство по работе с Kubernetes API - изучите клиентские библиотеки, принципы API, авторизацию, выполнение CRUD операций и настройку RBAC
author: Олег Марков
title: Руководство по работе с Kubernetes API
preview: Пошаговая инструкция по использованию Kubernetes API - от теории до практических примеров работы с объектами, аутентификацией и автоматизацией через код и утилиты
---

## Введение

Kubernetes стал стандартом для управления контейнеризированными приложениями. Его сила во многом строится на мощном API, через который вы управляете всеми ресурсами и процессами внутри кластера. Если вы хотите автоматизировать развертывания, писать собственные контроллеры или интегрироваться с внешними сервисами, создание запросов к Kubernetes API — ключевой навык.

В этой статье я покажу, как устроен Kubernetes API, какие методы работы с ним доступны, как правильно аутентифицироваться и авторизоваться, а также как выполнять основные действия с объектами Kubernetes. Примеры будут с пояснениями — так вы сможете быстро начать работать с API на практике и построить уверенное понимание фундаментальных моментов.

## Как устроен Kubernetes API

### Основы API серверов Kubernetes

Вся коммуникация и управление объектами кластера идет через компонент kube-apiserver. Этот сервер принимает HTTP/HTTPS-запросы, аутентифицирует, авторизует, валидирует и изменяет состояние кластера. Это касается всех объектов — подов, сервисов, deployments и т.д.

API организовано по REST-принципам — это значит, что вы обращаетесь к ресурсам (например, Pods, Deployments, Services) через стандартные HTTP методы: GET, POST, PUT, PATCH, DELETE.

**Структура URL-адресов Kubernetes API:**

- `/api/v1/` — базовый API, сюда входят core-объекты
- `/apis/<group>/<version>/` — расширенные ресурсы (например, CRD, ресурсы высокого уровня)

**Пример:**  
`GET /api/v1/namespaces/default/pods` — получить все Pods в неймспейсе default.

### Версионирование API

Kubernetes поддерживает одновременное существование нескольких версий API одного объекта. Версии бывают:

- `v1alpha1` — экспериментальные
- `v1beta1` — тестовые, возможны изменения
- `v1` — стабильные

Рекомендуется использовать stable-версии для production-решений.

### OpenAPI спецификация

Все ресурсы и методы описаны в OpenAPI спецификации. Описания API и доступных объектов можно получить через `GET /openapi/v2` или сформировать с помощью встроенного Swagger UI через dashboard.

## Как обращаться к Kubernetes API

### Прямая работа с API через curl

Вы можете посылать HTTP-запросы напрямую:

```
curl --header "Authorization: Bearer $TOKEN" \
     --cacert /path/to/ca.crt \
     https://<api-server>:6443/api/v1/namespaces/default/pods
```

- `--header` — указывает токен для аутентификации
- `--cacert` — путь к CA сертификату кластера (он нужен если API сервер использует самоподписанный сертификат)

**Получить токен можно из ~/.kube/config файла или через сервисные аккаунты.**

### Использование kubectl для работы с API

`kubectl` — основной CLI-инструмент, он формирует и отправляет запросы к API серверу под капотом.

**Пример получения ресурсов:**
```
kubectl get pods -n default -o json
```

**Пример прямого вызова API:**
```
kubectl get --raw /api/v1/namespaces/default/pods
```

**kubectl proxy**  
Вы можете запустить локальный прокси-сервер, который берет на себя заботу об авторизации:

```
kubectl proxy
```

Теперь запросы можно отправлять на `http://localhost:8001`.

### Клиентские библиотеки для различных языков

Для большинства популярных языков есть официальные или поддерживаемые клиентские библиотеки Kubernetes.

#### Go-клиент

Go-biblioteka — стандарт де-факто для написания операторов/контроллеров:

```go
// Импортируем необходимые пакеты
import (
    "context"
    "fmt"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/client-go/kubernetes"
    "k8s.io/client-go/tools/clientcmd"
)

func main() {
    // Загружаем kubeconfig
    config, _ := clientcmd.BuildConfigFromFlags("", "/path/to/kubeconfig")
    // Создаем клиента
    clientset, _ := kubernetes.NewForConfig(config)
    // Получаем список подов
    pods, _ := clientset.CoreV1().Pods("default").List(context.TODO(), metav1.ListOptions{})
    fmt.Printf("Поды: %v\n", pods.Items) // Выводим список
}
```

#### Python-клиент

Смотрите, как можно получить список подов на Python:

```python
from kubernetes import client, config

# Загружаем конфиг из стандартного расположения
config.load_kube_config()
v1 = client.CoreV1Api()
# Получаем список подов в default namespace
ret = v1.list_namespaced_pod(namespace="default")
for pod in ret.items:
    print(pod.metadata.name)  # Выводим имена подов
```

#### Другие языки

Есть также поддержка для Java, JavaScript/TypeScript, Ruby, .NET и др. Все ссылки на библиотеки размещены в [официальной документации](https://kubernetes.io/docs/reference/using-api/client-libraries/).

## Аутентификация и авторизация

### Способы аутентификации

Kubernetes поддерживает:

- Сертификаты клиента (X.509)
- Токены сервисных аккаунтов
- OpenID Connect (OIDC)
- Webhook-аутентификацию

На практике чаще всего используют kubeconfig с токеном или сертификатом. Для подов в кластере — сервисные аккаунты.

**Как получить токен сервисного аккаунта:**

1. Создайте сервисный аккаунт  
   ```
   kubectl create serviceaccount my-sa
   ```
2. Привяжите роль (пример: admin в текущем неймспейсе):  
   ```
   kubectl create rolebinding my-sa-binding --clusterrole=admin --serviceaccount=default:my-sa
   ```
3. Извлеките токен:  
   ```
   kubectl -n default get secret $(kubectl -n default get sa/my-sa -o jsonpath="{.secrets[0].name}") -o jsonpath="{.data.token}" | base64 --decode
   ```

Теперь этот токен можно использовать в заголовке Authorization.

### Авторизация через RBAC

RBAC (Role-Based Access Control) — механизм, который определяет, к каким ресурсам и в каких namespaces может обращаться пользователь или сервисный аккаунт.

**Пример Manifest'а Role:**
```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: read-pods
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
```

**Пример RoleBinding:**
```yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: read-pods-binding
  namespace: default
subjects:
- kind: User
  name: сервисный_аккаунт
roleRef:
  kind: Role
  name: read-pods
  apiGroup: rbac.authorization.k8s.io
```

## CRUD-операции с объектами через API

### Получение объектов (GET)

**Получить список подов:**
```
GET /api/v1/namespaces/default/pods
```
или через curl:
```
curl --header "Authorization: Bearer $TOKEN" \
     --cacert /path/to/ca.crt \
     https://<api-server>:6443/api/v1/namespaces/default/pods
```

### Создание объектов (POST)

**Создать под c помощью curl:**

```bash
curl --header "Content-Type: application/json" \
     --header "Authorization: Bearer $TOKEN" \
     --cacert /path/to/ca.crt \
     --data-binary @pod.yaml \
     -X POST https://<api-server>:6443/api/v1/namespaces/default/pods
```

*Пример pod.yaml:*
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-demo
spec:
  containers:
  - name: nginx
    image: nginx:latest
```

### Обновление объекта (PUT/PATCH)

- `PUT` заменяет весь объект (полный манифест)
- `PATCH` — частичное изменение

**Пример PATCH (JSONPatch):**

```
curl --header "Content-Type: application/json-patch+json" \
     --header "Authorization: Bearer $TOKEN" \
     --cacert /path/to/ca.crt \
     --request PATCH \
     --data '[{"op": "replace", "path": "/spec/containers/0/image", "value": "nginx:1.21"}]' \
     https://<api-server>:6443/api/v1/namespaces/default/pods/nginx-demo
```

### Удаление объектов (DELETE)

**Удалить pod:**
```
curl --header "Authorization: Bearer $TOKEN" \
     --cacert /path/to/ca.crt \
     -X DELETE https://<api-server>:6443/api/v1/namespaces/default/pods/nginx-demo
```

## Использование Watch для отслеживания изменений

Kubernetes API поддерживает параметр `watch`, который позволяет отслеживать изменения в реальном времени.

**Пример (curl):**
```
curl --header "Authorization: Bearer $TOKEN" \
     --cacert /path/to/ca.crt \
     'https://<api-server>:6443/api/v1/namespaces/default/pods?watch=true'
```
Вы будете получать события (`ADDED`, `MODIFIED`, `DELETED`) для объектов.

В большинстве случаев для production-задач используют клиентские библиотеки, потому что вручную парсить stream-ответы неудобно.

## Практические советы и best practices

### Используйте client libraries

Если вы строите автоматизацию или пишете свои контроллеры — клиентские библиотеки гораздо удобнее, чем ручной curl. Они обрабатывают аутентификацию и автоматически повторяют запросы при ошибках.

### Старайтесь минимизировать права

Выдавайте только необходимые permissions сервисным аккаунтам — используйте минимальные роли и отдельные namespaces.

### Всегда валидируйте сертификаты

Не отключайте проверку сертификатов даже в тестах — это снижает уровень безопасности.

### Используйте запросы c ограничениями по полям

Добавляйте фильтры (`labelSelector`, `fieldSelector`), если в namespace много объектов, чтобы избежать скачивания лишних данных.

**Пример:**
```
kubectl get pods --selector=app=nginx
// или через API:
GET /api/v1/namespaces/default/pods?labelSelector=app=nginx
```

### Применяйте versioning (resourceVersion)

Чтобы избежать race condition при обновлении, используйте поле `metadata.resourceVersion` при PATCH/PUT запросах.

## Общие ошибки при работе с Kubernetes API

- Неверные права (RBAC) — проверяйте, что ваш токен или сервисный аккаунт имеет нужные permissions
- Ошибки при обновлении — используйте правильный тип запроса (PUT vs PATCH)
- Получение устаревших данных — если используете watch, корректно обрабатывайте field `resourceVersion`

## Полезные утилиты и инструменты

- [kubectl-tree](https://github.com/ahmetb/kubectl-tree) — просмотр зависимостей объектов
- [k9s](https://k9scli.io/) — терминальное UI для кластеров
- [Kubernetes Dashboard](https://github.com/kubernetes/dashboard) — web-интерфейс

## Заключение

Работа с Kubernetes API дает большую гибкость для автоматизации и расширения возможностей кластеров. Вы теперь знаете основы организации API Kubernetes, умеете аутентифицироваться, выполнять CRUD-операции с объектами и использовать клиентские библиотеки для Go и Python. Используя этот опыт, вы сможете строить интеграции, автоматизировать задачи и создавать собственные инструменты управления кластером под свои задачи.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как ограничить скорость запросов к Kubernetes API, чтобы не получить ошибку Too Many Requests?**  
Для ограничения запросов используйте параметры rate limiting в клиентских библиотеках. Например, в Go при создании `rest.Config` можно установить поля `QPS` (запросов в секунду) и `Burst`. Для kubectl используйте флаг `--request-timeout`.

**2. Как получить список CRD (Custom Resource Definitions) через API?**  
Можно сделать запрос:  
`GET /apis/apiextensions.k8s.io/v1/customresourcedefinitions`  
или:
```
kubectl get crd
```
Это вернет все определенные CRD в вашем кластере.

**3. Как смотреть логи контейнера через API?**  
Логи контейнера можно получить через запрос:  
`GET /api/v1/namespaces/{namespace}/pods/{pod}/log`
Вы также можете указать контейнер и лимитировать количество строк с помощью query-параметров, например:
```
/api/v1/namespaces/default/pods/my-pod/log?container=my-container&tailLines=50
```

**4. Как тестировать работу с API локально, не имея доступа к production кластеру?**  
Разверните [kind](https://kind.sigs.k8s.io/) или [minikube](https://minikube.sigs.k8s.io/docs/) — это легкие локальные кластеры Kubernetes. После этого работайте с API по стандартным методам, используя локальный kubeconfig.

**5. Как разрешить доступ к API только определенным приложениям?**  
Создайте сервисные аккаунты с минимально необходимыми правами (через Role и RoleBinding), а их токены используйте только в нужных приложениях. Отключите анонимный доступ и следите за политиками network policies, чтобы ограничить доступ к API server на уровне сети.