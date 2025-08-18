---
metaTitle: Настройка и эксплуатация Cluster в Kubernetes
metaDescription: Практическое руководство по настройке и эксплуатации Cluster в Kubernetes - советы по инициализации, конфигурированию, масштабированию и обеспечению безопасности кластера
author: Олег Марков
title: Настройка и эксплуатация Cluster в Kubernetes
preview: Пошаговое руководство по разворачиванию и поддержке Kubernetes-кластера для стабильной эксплуатации и эффективного управления инфраструктурой контейнеров
---

## Введение

Сегодня Kubernetes — это современный стандарт для управления контейнеризированными приложениями: он дает мощные средства для развертывания, масштабирования и автоматизации приложений. Кластер Kubernetes — это сердце всей экосистемы, именно на нем строится вся работа. Корректная настройка, эксплуатация и поддержка кластера — одно из необходимых условий для производительной, отказоустойчивой и безопасной работы систем.

В этой статье вы узнаете, что из себя представляет кластер в Kubernetes, как правильно его развернуть и настроить, а также какие действия нужны для повседневной эксплуатации — от мониторинга до обновления и обеспечения безопасности. Я добавляю практические примеры и пояснения, чтобы вы могли сразу применять полученные знания в своей инфраструктуре.

---

## Что такое кластер Kubernetes

### Компоненты кластера

Прежде чем переходить к установке и настройке, давайте разберемся, из чего состоит кластер Kubernetes. Его базовая архитектура включает два основных типа узлов: **мастер-узлы** (control plane) и **рабочие узлы** (worker nodes).

- **Control Plane (мастер-узлы)**  
  Управляют состоянием всего кластера, принимают решения о размещении подов, управляют автоскейлингом, поддерживают работу API.

- **Worker Nodes (рабочие узлы)**  
  На этих машинах запускаются контейнеры с вашими приложениями, здесь происходят основные вычисления.

#### Ключевые компоненты Control Plane:
- kube-apiserver — принимает все команды и изменения состояния кластера.
- etcd — надежное распределенное хранилище всех данных кластера.
- kube-scheduler — решает, на какой node отправлять pod.
- kube-controller-manager — следит за текущим состоянием и изменяет его при необходимости.
- cloud-controller-manager — работает с облачными провайдерами, если кластер разворачивается в облаке.

#### Кратко о компонентах worker node:
- kubelet — отвечает за запуск и управление контейнерами на ноде.
- kube-proxy — обеспечивает сетевую связанность сервисов.
- container runtime (например, containerd, Docker) — непосредственно запускает контейнеры.

Теперь, когда у вас есть понимание, из чего состоит кластер, давайте перейдем к практике.

---

## Подготовка к установке кластера

### Выбор среды запуска

Kubernetes можно развернуть на bare-metal (физических и виртуальных серверах), в облаке (например, AWS, GCP, Yandex Cloud или Azure) или с помощью разных инструментов автоматизации (например, kubeadm, kops, Kubespray, k3s и др.).

**Для обучения** и тестирования удобно использовать Minikube или Kind (Kubernetes IN Docker), но для продакшена чаще выбирают kubeadm или решения от облачных провайдеров (Managed Kubernetes).

### Минимальные требования к системе

#### Минимальные ресурсы на 1 узел:
- CPU: 2 ядра
- Память: не менее 2 ГБ (для продакшена желательно ≥4 ГБ)
- ОС: Linux (наиболее протестированы Ubuntu, CentOS, Debian)
- Обязателен доступ к сети между всеми узлами
- Совместимая версия Docker/containerd/runc

### Настройка узлов перед установкой

- Включите модули ядра для iptables (`br_netfilter`)
- Отключите swap (обязательно для стабильной работы kubelet)
- Синхронизируйте время (например, через NTP)
- Проверьте имя хоста и настройте корректные записи /etc/hosts

Пример отключения swap и загрузки нужных модулей:

```bash
# Отключаем swap
sudo swapoff -a
sudo sed -i '/swap/d' /etc/fstab

# Грузим необходимые модули ядра
sudo modprobe br_netfilter
echo '1' | sudo tee /proc/sys/net/bridge/bridge-nf-call-iptables
```

---

## Установка и инициализация кластера

### Использование kubeadm

`kubeadm` — один из наиболее удобных инструментов для быстрой и понятной инициализации кластера Kubernetes.

#### 1. Установка необходимых пакетов

```bash
# Добавляем репозиторий Kubernetes и устанавливаем пакеты
sudo apt-get update && sudo apt-get install -y apt-transport-https curl
curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update

# Устанавливаем kubelet, kubeadm и kubectl
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl  # блокируем обновления для стабильности кластера
```

#### 2. Инициализация мастер-узла

```bash
# На сервере, который станет мастером, запускаем:
sudo kubeadm init --pod-network-cidr=10.244.0.0/16  # например, Flannel требует этот диапазон

# После успешной инициализации init, копируем конфиг для работы с kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

В результате вы получите вывод с командой для присоединения worker-узлов. Скопируйте ее — она потребуется далее.

#### 3. Установка сетевого плагина для подов

Kubernetes не работает без CNI-плагина.   Пример для Flannel:

```bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

#### 4. Присоединение worker-нод

Выполните команду kubeadm join, которую вы получили при инициализации кластерa, на каждом worker-узле:

```bash
sudo kubeadm join <master-ip>:<port> --token <token> --discovery-token-ca-cert-hash sha256:<hash>
```

---

## Настройка сети в кластере

Сетевая связность — ключевой элемент кластера Kubernetes. Выберите подходящий сетевой плагин: Flannel, Calico, Weave, Cilium и другие.

Вот как выглядит установка Calico:

```bash
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml
```

Функции CNI-плагинов:
- Внутрикластерная маршрутизация между контейнерами
- Внедрение политики безопасности (Network Policy)
- Интеграция с балансировщиками, ingress и сервисами Service LoadBalancer

---

## Базовые операции по эксплуатации кластера

### Масштабирование кластера

#### Добавление новых worker-нод

Добавить дополнительный сервер просто — используйте команду `kubeadm join`, сохраняя сетевые настройки и предварительную подготовку системы.

#### Удаление worker-нод

Для корректного удаления ноды:

```bash
kubectl drain <node-name> --delete-local-data --force --ignore-daemonsets  # выведет node из эксплуатации
kubectl delete node <node-name>  # удалит node из кластера
```
Это предотвратит потерю сервисов и обеспечит корректное перераспределение подов.

### Обновление компонентов кластера

Обновления критичны для безопасности и поддержки новых функций. Главная последовательность — обновлять control plane, затем worker-узлы.

```bash
# Обновляем kubeadm, kubelet, kubectl на мастер-узле
sudo apt-get update
sudo apt-get install -y kubeadm=1.24.0-00 kubelet=1.24.0-00 kubectl=1.24.0-00

# Проверяем план обновления
sudo kubeadm upgrade plan

# Выполняем upgrade
sudo kubeadm upgrade apply v1.24.0

# На каждой ноде обновляем kubelet и перезапускаем службу
sudo apt-get install -y kubelet=1.24.0-00
sudo systemctl restart kubelet
```

### Управление ролями и доступом (RBAC)

RBAC (Role-Based Access Control) позволяет выдавать granular-права на ресурсы кластера:

```yaml
# Пример роли и привязки
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: "dev-user"
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### Настройка резервного копирования etcd

etcd — ключевая часть стабильности и отказоустойчивости. Бэкап и restore делайте регулярно.

#### Пример бэкапа:

```bash
ETCDCTL_API=3 etcdctl snapshot save /tmp/etcd-snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

#### Восстановление из бэкапа:

```bash
ETCDCTL_API=3 etcdctl snapshot restore /tmp/etcd-snapshot.db --data-dir /var/lib/etcd-new
```
После восстановления следует корректно переуказать путь до данных etcd в настройках kube-apiserver.

---

## Мониторинг и журналирование кластера

### Инструменты мониторинга

- **Prometheus + Grafana**  
  Простейшая и популярная связка. Prometheus собирает метрики, Grafana визуализирует их.
  
- **Kube-state-metrics**  
  Отдельный сервис, собирающий "живую" статистику о состоянии объектов Kubernetes.

### Сбор логов

- **EFK Stack (Elasticsearch, Fluentd, Kibana)**
- **Loki от Grafana**

Пример деплоя kube-prometheus-stack (Helm)

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack
```

---

## Безопасность кластера

### Основные меры

- Используйте последние стабильные версии компонентов
- Изолируйте control plane от внешних сетей (доступ только по VPN или средствам SIEM)
- Применяйте Pod Security Policies или Pod Security Standards
- Используйте NetworkPolicy для ограничения трафика
- Настройте регулярное сканирование уязвимостей образов

### Пример NetworkPolicy для запрета доступа между подами разных namespaces

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-other-namespaces
  namespace: prod
spec:
  podSelector: {}
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: prod
```

---

## Решение распространенных проблем

### Проверка статуса кластера

```bash
kubectl get nodes  # Проверка работоспособности всех нод

kubectl get pods --all-namespaces  # Поиск подов в неприводимом статусе

kubectl describe pod <имя> -n <namespace>  # Детальная диагностика проблем в конкретном поде
```

### Восстановление доступа при сбое control plane

Если ваша control plane-нода упала, используйте последние резервные копии etcd, чтобы поднять новый узел или полностью переинициализировать кластер на основе snapshot.

---

## Особенности эксплуатации в разных типах инфраструктур

### Managed Kubernetes (например, Yandex Managed Service, Google Kubernetes Engine)

- Установка минимальна: вы указываете только параметры и сеть — все обновления и поддержка на стороне провайдера.
- Важно: часть функций кастомизации и низкоуровневой настройки (например, параметры kubelet или управления etcd) может быть недоступна.

### Bare-metal кластеры

- Полный контроль над средой, но все проблемы и обновления — на вашей стороне.
- Важно продумывать вопросы отказоустойчивости, настройки хранилищ (например, Ceph, NFS) и сетей на уровне L2/L3.

---

## Особенности обновления кластера

- Всегда читайте release notes — иногда меняются API или появляются deprecated-фичи.
- Применяйте blue-green или canary-обновления для production (тестируйте сначала на небоевых нодах).
- Обязательно делайте бэкап etcd перед обновлением.

---

## Заключение

Кластер Kubernetes — это сложная система, где надежность работы приложений зависит от корректной настройки, грамотного обслуживания и своевременного реагирования на сбои. Перед эксплуатацией необходимо четко представлять архитектуру, уметь инициализировать и расширять кластер, следить за его здоровьем, а также регулярно обновлять ключевые компоненты и резервировать данные.

Безопасность, масштабируемость и удобство мониторинга — три ключевых направления, в которые стоит вкладываться параллельно с ростом ваших приложений. Смотрите на развитие кластера не только как на техническую задачу — это фундамент, на котором строится цифровая инфраструктура компании.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как перевести кластер Kubernetes в режим высокой доступности (HA)?**  
Для этого нужно развернуть несколько master-узлов с Keepalived/VIP или использовать внешний LoadBalancer перед kube-apiserver, синхронизировать etcd, настроить совместный доступ к данным и прописать все control plane-адреса в kubeadm.

**2. Как поменять сеть подов в уже работающем кластере?**  
Это не поддерживается штатно. Если необходимо изменить CNI или подсеть, проще создать новый кластер с нужной сетевой конфигурацией, а затем мигрировать службы.

**3. Как добавить или удалить etcd-нод в кластере?**  
Выведите node из etcd вручную через etcdctl member remove <member_id>, затем корректируйте конфиги control-plane. При добавлении используйте etcdctl member add и пропишите новые параметры в kube-apiserver.

**4. Как безопасно интегрировать кластер с внешними CI/CD системами?**  
Создайте специфичную ServiceAccount, настройте через RBAC минимально необходимые права, используйте kubeconfig с короткоживущими токенами, по возможности ограничивайте доступ по IP.

**5. Почему не видно новые worker-узлы после kubeadm join?**  
Возможная причина — несовпадение версий между master и worker, ошибки сетевого слоя, незапущенный kubelet. Проверьте логи `kubelet` и убедитесь, что все сетевые подключения между нодами открыты.