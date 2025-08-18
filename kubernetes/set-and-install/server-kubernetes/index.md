---
metaTitle: Установка и настройка Kubernetes на сервере
metaDescription: Руководство по установке и базовой настройке Kubernetes на сервере - пошаговые инструкции, примеры команд и объяснения ключевых этапов
author: Олег Марков
title: Установка и настройка Kubernetes на сервере
preview: Изучите, как выполнить установку и настройку Kubernetes на сервере - пошаговые инструкции, разъяснения, примеры команд и советы для запуска вашего собственного кластера
---

## Введение

Kubernetes — это открытая система оркестрации контейнеров, которая автоматизирует развёртывание, масштабирование и управление приложениями. Если у вас есть задача обеспечить отказоустойчивую и масштабируемую инфраструктуру для ваших сервисов, Kubernetes является проверенным стандартом в индустрии. В этой статье рассмотрим, как развернуть и настроить Kubernetes на отдельном сервере: вы получите готовый набор команд, увидите, что и зачем делаете на каждом этапе, и сможете самостоятельно поднять кластер для разработки или продакшн.

## Предварительные требования

Для успешной установки Kubernetes на сервере потребуется:

- Сервер (или несколько серверов) с Linux (лучше всего Ubuntu 20.04/22.04, CentOS 7/8 или Debian 10/11)
- root-доступ или привилегии sudo
- Минимум 2 ГБ RAM и 2 CPU на каждый сервер (этого достаточно для мастера и тестовых рабочих узлов)
- Настроенная сеть между всеми участниками кластера (если разворачиваете на нескольких машинах)
- Установленный SSH-доступ

Давайте разберём по шагам необходимые подготовительные действия.

### Настройка среды

Перед установкой убедитесь, что ваш сервер обновлён:

```bash
sudo apt update && sudo apt upgrade -y
# Для CentOS
# sudo yum update -y
```

Отключите swap. Kubernetes требует, чтобы swap был выключен:

```bash
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab   # Комментарий swap в конфиге для отключения после перезагрузки
```

Убедитесь, что включена поддержка br_netfilter и net.bridge:

```bash
sudo modprobe br_netfilter
echo '1' | sudo tee /proc/sys/net/bridge/bridge-nf-call-iptables # Включаем проброс iptables для bridge
```

## Установка Docker (или containerd)

Kubernetes использует контейнерный runtime. По умолчанию это containerd, но допустим и Docker.

### Установка Docker

```bash
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable docker
sudo systemctl start docker
```

Теперь Docker настроен и выполняется в качестве системы контейнеризации.

### Установка containerd (рекомендуется для Kubernetes v1.24+)

```bash
sudo apt install -y containerd
sudo mkdir -p /etc/containerd
sudo containerd config default | sudo tee /etc/containerd/config.toml
sudo systemctl restart containerd
```

## Установка Kubernetes компонентов

Перейдем к установке основных компонентов Kubernetes: kubeadm (инструмент инициализации), kubelet (агент-исполнитель на каждой ноде) и kubectl (CLI для пользователя).

### Добавление репозитория Kubernetes

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
```

### Установка kubeadm, kubelet, kubectl

```bash
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl    # Предотвращает автоматические обновления
```

Проверьте версию, чтобы убедиться, что все установлено:

```bash
kubectl version --client && kubeadm version
# Ожидайте вывод с актуальными версиями
```

## Инициализация кластера Kubernetes

Далее происходит инициализация мастера (control-plane). Используйте команду:

```bash
sudo kubeadm init --pod-network-cidr=10.244.0.0/16
# --pod-network-cidr - задаёт диапазон для сети подов (для Flannel/Calico рекомендуется 10.244.0.0/16)
```

После успешного завершения команда для подключения kubectl к кластеру:

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

Теперь kubectl "знает", как подключаться к вашему кластеру.

## Настройка сети подов (Pod Network)

Без сети подов ваш кластер не сможет запускать приложения — поды не будут видеть друг друга между нодами. Давайте установим сеть Flannel (простой вариант для старта):

```bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

Если вы хотите использовать Calico (альтернатива, частый выбор для production):

```bash
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml
```

Проверьте статус подов:

```bash
kubectl get pods --all-namespaces
# Ждём STATUS=Running без ошибок
```

## Присоединение рабочих нод к кластеру

Если у вас несколько серверов, каждый дополнительный рабочий узел должен быть добавлен в кластер. После запуска `kubeadm init` мастер выдаёт строку вида:

```
kubeadm join <API_SERVER>:<PORT> --token <TOKEN> --discovery-token-ca-cert-hash sha256:<HASH>
```

Эту команду надо выполнить на каждом рабочем узле, предварительно установив туда те же пакеты (kubeadm, kubelet, docker/containerd, kubectl).

Вот ещё раз пример команд для подключения:

```bash
sudo kubeadm join 192.168.0.100:6443 --token abcd12.3456789abcdef0 --discovery-token-ca-cert-hash sha256:0123456789abcdef...
```

После команды рабочий узел включится в кластер. Проверить успешность можно через:

```bash
kubectl get nodes
# Вы должны увидеть мастер и все воркер-ноды в READY состоянии
```

## Основные компоненты Kubernetes-кластера

Разберёмся, какие сервисы и процессы запускаются после установки.

### kube-apiserver

Главная точка входа для всех запросов к кластеру (kubectl, пользователи, внутренние компоненты). Сервирует REST API.

### kube-controller-manager

Следит за согласованностью состояния объектов: например, если указано три реплики пода, то будет пытаться всегда держать три.

### kube-scheduler

Назначает поды на подходящие ноды, основываясь на ресурсах, ограничениях и политике.

### etcd

Распределённое хранилище всех данных кластера (ключ-значение).

### kubelet

Демон на каждой ноде, который запускает контейнеры, проверяет "живость" подов, обновляет статус.

### kube-proxy

Работает на каждой ноде, обеспечивает сетевую маршрутизацию и публикацию сервисов.

## Основные возможности и примеры управления

Давайте посмотрим на базовые команды kubectl для первичного управления кластером.

### Проверка состояния кластера

```bash
kubectl get nodes       # Список всех нод
kubectl get pods -A     # Все поды во всех пространствах имён
kubectl get services    # Список сервисов
```

### Деплой тестового приложения

Запустите простое приложение Nginx:

```bash
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=NodePort
kubectl get services
```

Теперь сервис будет опубликован на случайном порту (например, 30007). Вы сможете обратиться к нему по адресу: http://<IP_NODE>:<NODE_PORT>

### Масштабирование деплоймента

```bash
kubectl scale deployment nginx --replicas=3  # Теперь будет 3 пода nginx
kubectl get pods
```

### Удаление приложения

```bash
kubectl delete deployment nginx
kubectl delete service nginx
```

### Получить логи пода

```bash
kubectl logs <pod-name>
# Поможет при отладке
```

### Открыть shell в контейнере пода

```bash
kubectl exec -it <pod-name> -- /bin/bash
# /bin/sh если bash недоступен
```

## Расширенные настройки безопасности и отказоустойчивости

### Настройка RBAC (контроль доступа)

Kubernetes поддерживает гибкую модель прав на основе ролей и политик:

```yaml
# Пример манифеста ROLE, который даёт доступ только к подам
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""] # "" обозначает core API group
  resources: ["pods"]
  verbs: ["get", "list"]
```

### Высокая доступность (HA)

Для продуктивного кластера стоит запускать несколько master-нод, использовать внешний etcd и балансировщик нагрузки. Этот процесс сложнее, требует отдельной настройки load balancer (например, с помощью внешнего HAProxy или IPVS), но позволяет переживать сбои отдельных ключевых узлов без простоя.

### Мониторинг и логирование

Рекомендуется интегрировать инструменты мониторинга и логирования:

- Prometheus+Grafana для сбора метрик и красивых дашбордов
- EFK/ELK-стек (Elasticsearch, Fluentd/Logstash, Kibana) для сбора и анализа логов

Добавляйте эти решения по мере роста инфраструктуры.

### Актуальная версия Kubernetes: почему важно?

Часто устаревшие версии содержат баги и уязвимости и не поддерживают новые функции. Следите за changelog и обновляйте версии согласно оф. [документации](https://kubernetes.io/docs/setup/release/notes/).

## Полезные советы

- Всегда проверяйте, что время синхронизировано на всех нодах (`ntpd`, `chrony` — подходят)
- Храните бэкапы etcd (это сердце кластера)
- Используйте Namespaces для логической сегментации окружений
- Изучите базовые абстракции Kubernetes: Pod, Deployment, Service, ConfigMap, Secret

## Заключение

Вы ознакомились с основными шагами по установке и настройке Kubernetes на сервере. Теперь у вас есть понимание, какие компоненты требуются для запуска кластера, как подключать рабочие узлы и настраивать сеть подов. Освоив эти шаги, вы сможете не только развернуть кластер для себя или команды, но и постепенно расширять его, добавлять безопасность, мониторинг и другие инструменты, которые необходимы для эффективной работы с контейнеризированными приложениями.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

1. **Как перезапустить kubelet, если после изменений конфигурации он не применяет новые настройки?**

   Перезапустите сервис командой:
   ```
   sudo systemctl daemon-reload
   sudo systemctl restart kubelet
   ```
   Если конфигурация всё ещё не применяется, проверьте логи с помощью:
   ```
   journalctl -u kubelet -xe
   ```

2. **Что делать, если после установки все узлы находятся в статусе NotReady?**

   Проверьте состояние сети (firewall, iptables, установка плагина сети, например Flannel или Calico), синхронизацию времени (timedatectl status), и убедитесь, что выключен swap (`swapoff -a`).

3. **Можно ли безопасно обновить версию Kubernetes на работающем кластере?**

   Да, но обновляйте компоненты поэтапно: сначала control plane (`kubeadm upgrade`), потом worker-ноды (`kubectl drain <node>`, обновление пакетов, `kubectl uncordon <node>`). Используйте инструкции с официального [гайда по апдейту](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/).

4. **Как включить автоматический запуск Docker или containerd при загрузке сервера?**

   Выполните команду:
   ```
   sudo systemctl enable docker
   sudo systemctl enable containerd
   ```

5. **Где найти подробные логи kubectl и api-server?**

   - Для логов kubelet: `journalctl -u kubelet -f`
   - Для api-server: `journalctl -u kube-apiserver -f` (или через docker/containerd логи, если control plane запускается в контейнере)
   - Для kubectl ошибки выводятся прямо в терминале
