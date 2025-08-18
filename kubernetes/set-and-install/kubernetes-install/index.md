---
metaTitle: Установка и настройка Kubernetes с нуля
metaDescription: Полная инструкция по установке и настройке Kubernetes с нуля - развертывание кластера на Linux, настройка kubectl, запуск первых подов и базовые проверки
author: Олег Марков
title: Установка и настройка Kubernetes с нуля
preview: Освойте установку и настройку Kubernetes с нуля - простая и понятная пошаговая инструкция для успешного развертывания кластера и запуска первых приложений
---

## Введение

Kubernetes — это современная система оркестрации контейнеров, созданная для автоматизации развертывания, масштабирования и управления приложениями в контейнерах. Всё чаще разработчики, тестировщики и DevOps-инженеры сталкиваются с необходимостью установки и настройки собственного кластера Kubernetes. Причем это может быть как локальная среда разработки, так и полноценный кластер для продакшн-среды.

В этой статье я детально расскажу, как с нуля развернуть и настроить Kubernetes-кластер на Linux-серверах с помощью утилиты kubeadm — инструмента, который широко используется для простой и быстрой инициализации и настройки кластеров Kubernetes. Вы узнаете, какие предварительные действия требуются, как провести установку, выполнить начальные настройки, добавить рабочие ноды и удостовериться, что все сервисы функционируют корректно. Для вашего удобства я добавлю скрипты, примеры команд, а также пояснения ко всем ключевым шагам.

## Минимальные требования к серверам

Прежде чем приступить к установке Kubernetes, внесу ясность о минимальных требованиях к вашей инфраструктуре.

### Аппаратные требования

- Операционная система: рекомендуется одна из последних версий Ubuntu, CentOS, Debian или их производных (в примерах будет использоваться Ubuntu 22.04 LTS).
- Процессор: минимум 2 виртуальных ядра на каждую ноду.
- Оперативная память: от 2 ГБ (рекомендовано — от 4 ГБ на каждую ноду).
- Место на диске: не менее 20 ГБ.
- Сетевое соединение между всеми серверами.

### Дополнительные условия

- Доступ с правами root или sudo.
- Уникальные хостнеймы, статические или зарезервированные по DHCP адреса.
- Открытые порты для внутреннего взаимодействия Kubernetes (обычно 6443, 2379-2380, 10250-10252 и другие; полный список легко найти в официальной документации).

## Подготовка окружения для установки Kubernetes

Перед тем как приступать к развёртыванию, следует провести несколько подготовительных шагов, чтобы избежать типичных проблем на этапе установки.

### 1. Включите обязательные параметры ядра Linux

Обязательно нужно активировать модули и параметры для корректной работы Kubernetes. Вот пример команд для Ubuntu:

```bash
sudo modprobe overlay    # Включаем overlay файловую систему
sudo modprobe br_netfilter    # Включаем фильтрацию сетевых пакетов
```

Создайте файл `/etc/sysctl.d/k8s.conf` со следующим содержанием:

```conf
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
```

Примените параметры:

```bash
sudo sysctl --system    # Применяем все настройки из /etc/sysctl.d
```

### 2. Отключите swap

Kubernetes не поддерживает работу при активном swap, поэтому отключите его:

```bash
sudo swapoff -a    # Отключение swap временно
sudo sed -i '/ swap / s/^/#/' /etc/fstab    # Отключение swap на постоянной основе
```

### 3. Установите Docker или другой контейнерный runtime

До версии 1.24 Kubernetes поддерживал Docker как container runtime по умолчанию, но сейчас основным стандартом стал CRI-O или containerd. Я покажу установку containerd, так как это рекомендуемый и по-прежнему широко используемый вариант.

```bash
sudo apt update
sudo apt install -y containerd
```

Для запуска containerd в качестве демона и автозапуска:

```bash
sudo systemctl restart containerd
sudo systemctl enable containerd
```

## Установка необходимых компонентов Kubernetes

### 1. Добавьте репозиторий Kubernetes и обновите индексы

Для Ubuntu используйте такие команды:

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl
sudo curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
```

### 2. Установите kubeadm, kubelet и kubectl

```bash
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl    # Блокируем автоматическое обновление этих пакетов
```

Теперь ваши сервера готовы к непосредственной инициализации Kubernetes.

## Инициализация кластера Kubernetes

### 1. Инициализируйте кластер на мастере (Control Plane)

Выполните на сервере мастер-ноды:

```bash
sudo kubeadm init --pod-network-cidr=10.244.0.0/16    # Указание CIDR для Flannel, подойдет и для многих других сетевых плагинов
```

В выходных данных вы увидите блок с командами для дальнейшей настройки, например:

```bash
mkdir -p $HOME/.kube              # Создаем каталог для kubectl-конфига
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config   # Копируем конфиг
sudo chown $(id -u):$(id -g) $HOME/.kube/config           # Меняем владельца
```

И еще строку вида:

```bash
kubeadm join <IP>:<PORT> --token <TOKEN> --discovery-token-ca-cert-hash sha256:<HASH>
```

Сохраните ее для добавления нод в кластер.

### 2. Настройте окружение для kubectl

kubectl — это утилита командной строки управления Kubernetes-кластером. Проверьте ее работу:

```bash
kubectl get nodes     # Список нод в кластере
```

Вы увидите вашу мастер-ноду со статусом NotReady (пока не установлен сетевой плагин).

## Установка сетевого плагина (CNI)

Без правильно настроенной сетевой подсистемы компоненты Kubernetes не смогут разворачивать поды, и весь кластер будет оставаться в статусе NotReady.

Для простоты возьмем популярный сетевой плагин Flannel:

```bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

Можно использовать и другие CNI (Calico, Weave, Cilium), но рекомендую на старте попробовать Flannel — он прост в установке.

Проверьте статус ноды по команде:

```bash
kubectl get nodes
```

Как только статус изменится на Ready, можно переходить к следующему этапу.

## Присоединение рабочих нод к кластеру

### 1. Используйте команду `kubeadm join`

На каждом рабочем сервере выполните команду, которую вы получили ранее от `kubeadm init` (или скопируйте из вывода):

```bash
sudo kubeadm join <адрес_мастера>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
```

Если вы потеряли эту строку, ее можно сгенерировать снова на мастере командой:

```bash
kubeadm token create --print-join-command
```

Через несколько минут рабочие ноды отобразятся в выводе:

```bash
kubectl get nodes
```

Все ноды должны иметь статус Ready.

## Проверка работоспособности и базовые настройки

### 1. Развертывание тестового пода

Чтобы убедиться, что кластер работает, создайте простой под:

```bash
kubectl run nginx --image=nginx:alpine --restart=Never
kubectl get pods
```

Под должен перейти в статус Running.

### 2. Получение состояния компонентов

Убедитесь, что все системные поды и сервисы работают:

```bash
kubectl get pods --all-namespaces
kubectl get svc
```

Если какие-то поды в статусе Error или CrashLoopBackOff, рассмотрите их логи:

```bash
kubectl logs <имя_pod>    # Просмотр логов конкретного пода
```

### 3. Настройка kubectl для работы других пользователей

Для совместного использования кластера скопируйте файл `admin.conf` из `/etc/kubernetes/` на другой компьютер, где установлен kubectl, и укажите путь до этого конфига:

```bash
export KUBECONFIG=/путь/к/admin.conf
```

### 4. Важно: настройте автоматическую генерацию токенов

Обратите внимание, что join-токены имеют время жизни. Для новых нод их можно регулярно генерировать через:

```bash
kubeadm token create --print-join-command
```

## Установка панели управления Kubernetes Dashboard (по желанию)

Работать через командную строку бывает неудобно. Можно добавить web-интерфейс.

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
```

Создайте сервис-аккаунт с админ-правами для доступа:

```bash
kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard
kubectl create clusterrolebinding dashboard-admin --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:dashboard-admin
```

Получите токен:

```bash
kubectl -n kubernetes-dashboard create token dashboard-admin
```

Доступ осуществляется командой (порт форвардинг):

```bash
kubectl proxy
```

Web-интерфейс на http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

## Дополнительные настройки и полезные советы

### 1. Установка автозапуска Kubernetes-сервисов

Обычно все сервисы настраиваются на автозапуск установкой пакетов, но проверьте их статусы:

```bash
sudo systemctl status kubelet
sudo systemctl enable kubelet
```

### 2. Обновление компонентов кластера

Перед обновлением всегда делайте backup важных данных etcd и компонентов:

```bash
sudo kubeadm upgrade plan    # Просмотр доступных обновлений
sudo kubeadm upgrade apply v1.x.x  # Применение обновления
```

### 3. Сброс конфигурации кластера

Для начисто удалить кластер (на мастер-ноде):

```bash
sudo kubeadm reset
sudo rm -rf ~/.kube
```

На рабочих нодах — только `kubeadm reset`.

## Типовые команды для работы с кластером

### Список нод

```bash
kubectl get nodes
```
Смотрим, какие серверы входят в кластер и их статусы.

### Список всех подов

```bash
kubectl get pods --all-namespaces
```
Полезно для диагностики на любой стадии.

### Перезапуск пода

Kubernetes не поддерживает прямой рестарт пода, но можно удалить его — он пересоздастся автоматически, если работает в Deployment:

```bash
kubectl delete pod <pod_name>
```

### Список сервисов

```bash
kubectl get services
```
Посмотреть, как приложения доступны внутри и снаружи кластера.

## Заключение

В статье вы прошли весь путь: от подготовки серверов и установки контейнерного рантайма до инициализации кластерной среды Kubernetes с помощью kubeadm и присоединения рабочих нод. Вы провели базовую проверку, развернули тестовый под, узнали этапы установки сетевого плагина и даже подключили веб-интерфейс Dashboard для визуального управления ресурсами. Теперь у вас есть рабочая основа для дальнейшего знакомства с экосистемой Kubernetes — можете развернуть приложения, воспользоваться хелм-чартами и начать эксперименты с масштабированием.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как переустановить кластер, если установка прошла с ошибками?

Выполните на каждой ноде:
```bash
sudo kubeadm reset
sudo systemctl restart containerd    # Или docker, если он используется
sudo rm -rf ~/.kube
```
Затем можно повторить шаги инициализации заново.

### Как добавить новую ноду в уже работающий кластер?

Сгенерируйте join-команду на мастере:
```bash
kubeadm token create --print-join-command
```
Запустите ее на новой ноде, заранее выполнив подготовительные действия (отключение swap, настройка параметров ядра, установка containerd и компонентов kubelet/kubeadm).

### Как заменить мастера в случае его выхода из строя?

Придется создать новый контрольный узел. Важно регулярно сохранять snapshot etcd и манифестов:
- Восстановите etcd с бэкапа на новом сервере.
- Запустите kubeadm init с опцией --control-plane.

### Как решить проблему "coredns pod не запускается"?

Проверьте следующие моменты:
- Сетевой плагин установлен (kubectl get pods -n kube-system).
- kube-proxy работает корректно.
- iptables не блокирует поды.

В большинстве случаев помогает переустановка CNI:
```bash
kubectl delete -f <yaml_CNI>
kubectl apply -f <yaml_CNI>
```

### Как посмотреть загрузку ресурсов ноды?

Установите metrics-server:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```
Далее используйте:
```bash
kubectl top node
kubectl top pod
```