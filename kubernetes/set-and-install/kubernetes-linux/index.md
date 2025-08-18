---
metaTitle: Гайд по Kubernetes на разных дистрибутивах Linux
metaDescription: Подробное руководство по установке и настройке Kubernetes на популярных дистрибутивах Linux - Ubuntu CentOS Debian Fedora RHEL и SUSE
author: Олег Марков
title: Гайд по Kubernetes на разных дистрибутивах Linux
preview: Разберитесь как развернуть и настроить Kubernetes на различных дистрибутивах Linux – инструкции для Ubuntu CentOS Debian Fedora RHEL и SUSE
---

## Введение

Kubernetes — это популярная система для автоматизации развертывания, масштабирования и управления контейнеризированными приложениями. Одна из причин, почему Kubernetes стал таким востребованным инструментом, — его кроссплатформенность: вы можете запускать его на различных дистрибутивах Linux в любых инфраструктурах, от облака до bare metal-серверов.

В этой статье вы найдете практический гайд по установке и базовой настройке Kubernetes на ряде популярных дистрибутивов Linux: Ubuntu, CentOS, Debian, Fedora, RHEL и openSUSE/SUSE. Я покажу, какие различия и особенности встречаются на разных системах, как быстро подготовить серверы к запуску кластера и с какими нюансами чаще всего сталкиваются разработчики и администраторы.

Примеры и инструкции будут максимально простыми, чтобы вы смогли сразу применить полученные знания на практике или быстро починить типовые проблемы.

---

## Обзор: как работает установка Kubernetes

Kubernetes — это система, которая обычно разворачивается минимум на двух машинах (узлах): управляющий узел (control plane) и рабочий узел (worker node). Для установки и управления Kubernetes используются несколько ключевых компонентов:

- kubeadm — инструмент для инициализации и управления кластером.
- kubelet — агент, который запускается на каждом узле и управляет контейнерами.
- kubectl — утилита командной строки для управления кластером.

Наиболее распространённый способ установки Kubernetes — с помощью официальных пакетов, через репозитории дистрибутива или Docker-контейнеры. Но важно помнить: разные дистрибутивы Linux могут иметь свои нюансы — поддержка версий, различия в системах управления пакетами, правила работы с firewall и SELinux/AppArmor.

---

## Установка Kubernetes на Ubuntu

Ubuntu — один из самых популярных дистрибутивов для серверов, в том числе для Kubernetes. Давайте разберём пошаговую установку самого последнего стабильного релиза Kubernetes (на момент написания статьи — 1.29).

### Подготовка окружения

Для начала стоит убедиться, что у вас как минимум две машины с Ubuntu 20.04 LTS или новее, и каждая имеет уникальный hostname и статический IP.

```bash
# Проверяем версию ОС
lsb_release -a

# Меняем hostname (например, для управляющего узла)
sudo hostnamectl set-hostname master-node
```

### Установка Docker

Kubernetes для работы с контейнерами использует container runtime. Самый популярный — Docker, хотя можно использовать и containerd.

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce
```

Не забудьте добавить пользователя в группу docker, чтобы избегать проблем с правами:

```bash
sudo usermod -aG docker $USER
```

### Добавление репозитория Kubernetes и установка компонентов

```bash
sudo curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

Используйте `apt-mark hold`, чтобы избежать автоматического обновления этих пакетов.

### Отключение swap

Kubernetes не работает с включённым swap. Отключите его:

```bash
sudo swapoff -a
# Чтобы отключить swap навсегда, закомментируйте или удалите строку swap в /etc/fstab
sudo sed -i '/ swap / s/^/#/' /etc/fstab
```

### Открытие портов firewall (если используется UFW)

```bash
sudo ufw allow 6443/tcp   # API server
sudo ufw allow 2379:2380/tcp # etcd server client API
sudo ufw allow 10250/tcp  # Kubelet API
sudo ufw allow 10251/tcp  # kube-scheduler
sudo ufw allow 10252/tcp  # kube-controller-manager
```

### Инициализация кластера

На управляющем узле запускается команда инициализации:

```bash
sudo kubeadm init --pod-network-cidr=10.244.0.0/16
# --pod-network-cidr указывает диапазон IP для Pod-сети, для Flannel обычно используется 10.244.0.0/16
```

Далее выводится команда, которую надо выполнить на рабочих узлах, чтобы подключить их к кластеру. Скопируйте её.

### Настройка kubectl

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### Установка сетевого плагина

Для работы Pod'ов необходим сетевой плагин. Например, Flannel:

```bash
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
```

---

## Установка Kubernetes на CentOS и RHEL

CentOS и Red Hat Enterprise Linux часто используются в корпоративных инфраструктурах. Смотрите, как здесь отличается процесс установки.

### Подготовка системы

Убедитесь, что у вас CentOS 7 или новее.

### Отключение SELinux

Kubernetes и многие сетевые плагины не работают с включённым SELinux в режиме Enforcing:

```bash
sudo setenforce 0    # Временно
# Чтобы отключить навсегда:
sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config
```

### Отключение swap и настройка sysctl

```bash
sudo swapoff -a
sudo sed -i '/swap/d' /etc/fstab
```

Для включения необходимых параметров ядра:

```bash
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sudo sysctl --system
```

### Установка Docker (или containerd)

```bash
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce
sudo systemctl enable --now docker
```

### Добавление репозитория Kubernetes

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF
```

### Установка компонентов

```bash
sudo yum install -y kubelet kubeadm kubectl
sudo systemctl enable --now kubelet
```

### Открытие портов firewall (Firewalld)

```bash
sudo firewall-cmd --permanent --add-port=6443/tcp
sudo firewall-cmd --permanent --add-port=2379-2380/tcp
sudo firewall-cmd --permanent --add-port=10250/tcp
sudo firewall-cmd --permanent --add-port=10251/tcp
sudo firewall-cmd --permanent --add-port=10252/tcp
sudo firewall-cmd --reload
```

### Инициализация и настройка аналогична Ubuntu

Используйте аналогичные команды инициализации и настройки kubectl, как описано выше.

---

## Установка Kubernetes на Debian

Debian стабилен и прогнозируем, а процесс развёртывания близок к Ubuntu с парой отличий.

### Установка Docker

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
```

### Добавление Kubernetes repository

```bash
sudo curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

### Остальные шаги идентичны Ubuntu

---

## Установка Kubernetes на Fedora

Fedora актуальна на workstation и может использоваться для тестовых стендов или CI/CD.

### Установка containerd

```bash
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y containerd.io
sudo systemctl enable --now containerd
```

### Установка Kubernetes

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF

sudo dnf install -y kubelet kubeadm kubectl
sudo systemctl enable --now kubelet
```

### Отключение SELinux

```bash
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config
```

### Swap, sysctl и firewall — как на CentOS

---

## Установка Kubernetes на openSUSE и SUSE Linux Enterprise

SUSE славится своей стабильностью и продуманной документацией, но установка Kubernetes здесь чуть менее “канонична”.

### Установка Docker

```bash
sudo zypper refresh
sudo zypper install -y docker
sudo systemctl enable --now docker
```

### Добавление Kubernetes репозитория

```bash
sudo zypper ar -f https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64 kubernetes
sudo rpm --import https://packages.cloud.google.com/yum/doc/yum-key.gpg
sudo zypper ref
sudo zypper in kubelet kubeadm kubectl
```

### Настройка параметров ядра и swap

```bash
sudo swapoff -a
sudo sed -i '/swap/d' /etc/fstab

sudo tee /etc/sysctl.d/99-kubernetes.conf <<EOF
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF
sudo sysctl --system
```

### SELinux и firewall

SUSE также требует перевести SELinux в permissive (или отключить) и открыть необходимые порты в firewall (firewalld или iptables).

### Остальные шаги, включая инициализацию и настройку kubectl, аналогичны другим дистрибутивам

---

## Сравнение подходов и нюансы разных дистрибутивов

### Bootstrapping: В чем разница?

- **Ubuntu/Debian:** Быстрее всего стартует благодаря широкому использованию на DevOps-рынке; обновления часто выходят в первую очередь.
- **CentOS/RHEL/SUSE:** Придется вручную настраивать SELinux, firewall и sysctl, что добавляет шаги, но зато повышает безопасность.
- **Fedora:** Отличается свежими пакетами, подходит скорее для экспериментов, чем для production.
- **SUSE:** Иногда требуется пересобирать некоторые пакеты либо использовать неофициальные репозитории.

### Работа с сетевыми плагинами

Плагины сети (например, Flannel, Calico, Weave Net, Cilium) требуют дополнительных настроек на системном уровне. На дистрибутивах с SELinux часто приходится включать permissive-режим (или внимательно настраивать политики).

### Интеграция с контейнерными рантаймами

- Docker совместим почти со всеми, но с 1.20 Kubernetes рекомендуется использовать containerd.
- Не все дистрибутивы быстро обновляют containerd, иногда требуется ручная установка актуальной версии.

### Автоматизация и поддержка

- На всех дистрибутивах можно использовать Ansible, Terraform или kubespray, чтобы автоматизировать установку.
- Для корпоративных сетей стоит использовать только репозитории дистрибутива или официальные образы.

---

## Развёртывание рабочих узлов

Подключение рабочих узлов производится на любом дистрибутиве одинаково:

```bash
# Выполните выводимую на управляющем узле команду
sudo kubeadm join <master_ip>:<port> --token <token> --discovery-token-ca-cert-hash sha256:<hash>
# После подключения можно проверить узлы:
kubectl get nodes
```

Если возникает ошибка, убедитесь, что firewall открыт, hostname уникален, swap отключен, clock синхронизирован (ntpd/chrony) и DNS-разрешение работает.

---

## Советы по обновлению и резервному копированию

- Для обновления используйте только документацию вашей “ветки” Kubernetes.
- Держите резервные копии /etc/kubernetes, etcd (если управляете им напрямую) и резервируйте yaml-манифесты.
- Не обновляйте kubelet, kubeadm, kubectl “вслепую” — используйте test cluster.

---

## Заключение

Теперь у вас есть пошаговое представление, как развернуть Kubernetes на самых распространённых дистрибутивах Linux — Ubuntu, Debian, CentOS, Fedora, RHEL и SUSE. Каждый из них требует некоторых уникальных настроек, особенно в части SELinux, управления пакетами, работы с firewall и настройкой контейнерного рантайма. Но основной принцип развертывания — неизменен, если вы понимаете архитектуру и следуете рекомендациям официальной документации. Примеры команд и решений из этого гайда позволят вам быстро подготовить любую платформу для продуктивной работы с Kubernetes.

---

## Частозадаваемые технические вопросы по теме

### Как безопасно обновлять кластер Kubernetes на разных дистрибутивах?

Перед обновлением убедитесь, что есть резервные копии etcd и всех манифестов. Используйте команду `kubeadm upgrade plan` на управляющем узле, чтобы узнать доступные версии. Сначала обновляйте control-plane, потом worker nodes. На каждом узле обновляйте kubeadm, затем запускайте `kubeadm upgrade node`. Только после этого обновляйте kubelet и kubectl.

### Как сменить IP-адрес master-узла, если сеть изменилась?

Вам потребуется обновить значение `advertise-address` и все связанные записи (например, сертификаты, настройки kubelet, файлы `/etc/kubernetes/*`). Затем перезапустите службы или пересоздайте кластер, если это тестовая среда. В production-средах обычно такие операции проводят через HA или миграцию на новый кластер.

### Что делать, если после установки network plugin не работает связь между Pod'ами?

Проверьте, отключен ли swap, настроены ли параметры sysctl (`net.bridge.bridge-nf-call-iptables = 1`). Если используете SELinux, попробуйте режим permissive. Проверьте логи плагина (`kubectl -n kube-system logs <podname>`).

### Как устранить ошибку "Failed to create pod sandbox: rpc error: code = Unknown desc = failed to set up sandbox container"?

Судя по ошибке, проблема в interaction с контейнерным рантаймом (docker/containerd). Проверьте, что ваша версия runtime поддерживается текущей версией Kubernetes. Перезапустите службу контейнерного рантайма (`sudo systemctl restart docker` или `containerd`). Также убедитесь, что cgroups у runtime и kubelet совпадают.

### Как добавить дополнительный disk и использовать его для хранения данных etcd?

Смонтируйте новый диск (например, `/mnt/etcd-data`). Обновите файл `/etc/kubernetes/manifests/etcd.yaml`, заменив путь в volumeMounts на свежесмонтированный диск. Перезапустите pod etcd (или node), проверьте его статус через `kubectl -n kube-system get pods`.

---