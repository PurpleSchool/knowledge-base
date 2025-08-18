---
metaTitle: Работа с Kubernetes Volumes
metaDescription: Все о работе с Kubernetes Volumes - виды томов, монтирование, настройка постоянного хранилища, примеры YAML, секреты настройки и масштабирования
author: Олег Марков
title: Работа с Kubernetes Volumes
preview: Изучите работу с томами в Kubernetes - от простых emptyDir до продвинутого Persistent Volume Claims. Примеры кода, объяснения, практические инструкции по хранению данных
---

## Введение

Работа с Volumes (томами) — один из ключевых аспектов при эксплуатации приложений в Kubernetes. Хотя контейнеры по своей природе эфемерны и могут быть перезапущены или удалены в любой момент, зачастую приложения требуют хранения данных между рестартами или даже во время масштабирования. Именно для этого Kubernetes предоставляет широкий набор механизмов хранения — Volumes. Они позволяют сохранять и совместно использовать файлы, обеспечивают безопасность данных и дают гибкость при работе с различными хранилищами.

В этой статье я подробно разберу, что такое Kubernetes Volumes, познакомлю вас с их основными видами, расскажу, как подключать тома к подам, использовать постоянное хранилище (Persistent Volumes, PVC), а также дам реальные примеры YAML манифестов — чтобы вы могли быстро применить полученные знания на практике. Давайте разбираться вместе!

## Общее представление о Kubernetes Volumes

### Зачем нужны тома в Kubernetes

Очень часто приложения, развернутые в Kubernetes, должны:

- Хранить промежуточные или постоянные данные
- Делиться файлами между контейнерами внутри одного пода
- Иметь доступ к «общим» данным, разделяемым между разными подами
- Гарантировать сохранение данных после выхода из строя (рестарта) контейнера или пода

Сам контейнер теряет все файлы после перезапуска — дисковое пространство временно и связано с жизненным циклом контейнера. Тома решают задачу сохранения данных и предоставляют абстракцию, которая доступна для одного или нескольких контейнеров.

### Краткая история и особенности

Kubernetes поддерживает множество разных типов Volumes: от стандартных локальных (`emptyDir`) до интеграций с облачными и сетевыми хранилищами (NFS, Ceph, AWS EBS, Azure Disk и др.). Выбор типа зависит от требований приложения: нужен ли обмен между контейнерами, требуется ли постоянство, определённая производительность или резервирование данных.

## Основные виды Kubernetes Volumes

Я приведу основные типы Volumes, которые чаще всего используют на практике.

### emptyDir

Используется, когда требуется временное хранилище для пода (живёт столько, сколько живёт под, при удалении - данные пропадают).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-emptydir
spec:
  containers:
    - name: busybox
      image: busybox
      command: ["sleep", "3600"]
      volumeMounts:
        - name: cache-volume
          mountPath: /cache # Монтируем volume в /cache
  volumes:
    - name: cache-volume
      emptyDir: {} # Тип тома emptyDir
```
*Комментарий: Это пример использования временного тома — данные в /cache будут удалены, если под уничтожится.*

### hostPath

Том, который «маппится» на конкретный путь на хостовой машине. Такой volume полезно применять для отладки или интеграции с уже существующей файловой системой ноды.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-pod
spec:
  containers:
    - name: test-container
      image: nginx
      volumeMounts:
        - name: host-volume
          mountPath: /data # В контейнере это /data
  volumes:
    - name: host-volume
      hostPath:
        path: /mnt/data # А на хостовой машине папка /mnt/data
        type: Directory
```
*Комментарий: Любые изменения в /data внутри контейнера отразятся на /mnt/data хоста.*

### configMap и secret

Позволяют прокидывать настройки и секреты как файлы в контейнер, обеспечивая гибкие и безопасные способы передачи параметров приложения.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  key: value

---

apiVersion: v1
kind: Pod
metadata:
  name: configmap-pod
spec:
  containers:
    - name: busybox
      image: busybox
      command: ["sleep", "3600"]
      volumeMounts:
        - name: config
          mountPath: /etc/config
  volumes:
    - name: config
      configMap:
        name: app-config # Монтируем ConfigMap как файлы
```
*Комментарий: Файл с именем key и содержимым value будет доступен внутри контейнера в `/etc/config/key`.*

### persistentVolumeClaim (PVC)

Стандарт для постоянного хранения данных, независимый от жизненного цикла пода. Через PVC приложение получает абстракцию хранения, не заботясь о том, где физически находятся данные.

Я покажу, как это работает — шаг за шагом.

#### 1. PersistentVolume (PV) — объявляем хранилище

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-example
spec:
  capacity:
    storage: 1Gi # Объем PV
  accessModes:
    - ReadWriteOnce # Только один под может писать и читать
  hostPath:
    path: /mnt/pvdata # Физическое хранилище на ноде
```

#### 2. PersistentVolumeClaim (PVC) — подаем заявку на хранилище

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-example
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 500Mi # Нам нужно 500Мб
```

#### 3. Используем PVC в поде

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-pvc
spec:
  containers:
    - name: app
      image: busybox
      command: ["sleep", "3600"]
      volumeMounts:
        - name: storage
          mountPath: /data # Примонтировали volume в /data
  volumes:
    - name: storage
      persistentVolumeClaim:
        claimName: pvc-example # Связываем с PVC
```
*Комментарий: Теперь контейнер может сохранять файлы в /data, они никуда не денутся после удаления или рестарта пода, пока не уничтожена PVC.*

### Другие типы Volumes

Некоторые варианты используются реже, но знать их полезно:

- **emptyDir** — временное хранилище на время жизни пода
- **awsElasticBlockStore, gcePersistentDisk, azureDisk** — интеграция с облачными провайдерами
- **nfs** — подключение к сетевым файловым системам
- **cephfs, glusterfs, csi** — работа с распределенным хранилищем через драйверы Container Storage Interface

Каждый из них требует конкретных настроек хранилища вне Kubernetes-кластера. В большинстве случаев работа с Persistent Volume и PVC подходит для 90% задач — и этот подход максимально переносим между окружениями.

## Работа с Volumes на практике

Давайте рассмотрим более сложный пример: несколько контейнеров в одном поде используют общий `emptyDir`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: shared-volume-pod
spec:
  containers:
    - name: writer
      image: busybox
      command: ["/bin/sh", "-c", "echo hello > /shared/hello.txt && sleep 3600"]
      volumeMounts:
        - name: shared-data
          mountPath: /shared
    - name: reader
      image: busybox
      command: ["/bin/sh", "-c", "cat /shared/hello.txt; sleep 3600"]
      volumeMounts:
        - name: shared-data
          mountPath: /shared
  volumes:
    - name: shared-data
      emptyDir: {}
```

*Комментарий: Оба контейнера видят один и тот же volume — Writer пишет файл, Reader его читает.*

### Использование Volumes с Deployment

C Deployment использование Volumes ничем не отличается. Монтируется всё так же, как в Pod, только в соответствующем разделе `template.spec.containers`. Давайте рассмотрим:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: test-app
  template:
    metadata:
      labels:
        app: test-app
    spec:
      containers:
        - name: app
          image: my-app:latest
          volumeMounts:
            - name: app-storage
              mountPath: /usr/share/app/data
      volumes:
        - name: app-storage
          persistentVolumeClaim:
            claimName: app-pvc
```
*Комментарий: Каждый под развертывается со своим примонтированным Persistent Volume.*

### AccessModes

Очень важно различать режимы доступа:

- **ReadWriteOnce (RWO)** – том может быть смонтирован для чтения и записи только одним подом
- **ReadOnlyMany (ROX)** – том может быть смонтирован несколькими подами ТОЛЬКО для чтения
- **ReadWriteMany (RWX)** – несколько подов могут одновременно читать и писать

Не все хранилища дают RWX-возможности — network storage типа NFS/GlusterFS даст, EBS/AzureDisk — нет.

## Жизненный цикл Volumes

- **emptyDir, hostPath** – живут только пока существует под
- **PersistentVolume (PV), PVC** – существуют независимо от подов. Пока PVC «занят» — ваш PV не занят другим подом.

PVC и связанные с ним volumes — лучший способ, если необходимо хранить данные после удаления контейнеров.

Удаляя PVC (и PV, если политика — reclaim policy «Delete»), вы удаляете и данные.

## Расширение и изменение Volumes

Kubernetes позволяет увеличивать размер PVC (если storage backend поддерживает). Например:

```yaml
kubectl patch pvc myclaim -p '{"spec": {"resources": {"requests": {"storage": "2Gi"}}}}'
```

*Комментарий: Так вы увеличите запрошенное место до 2ГБ — но проверьте, поддерживает ли это ваш StorageClass!*

Перемонтировать volume уже существующему поду нельзя — изменение объёма требует пересоздания пода.

## StorageClass

StorageClass — это способ автоматизировать выделение PersistentVolumes с нужными параметрами:

- автоматическое выделение пространства
- выбор производительности, типа диска
- настройка reclaim policy (поведение при удалении PVC)

Пример StorageClass для динамического выделения PV:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-storage
provisioner: kubernetes.io/aws-ebs # Провайдер хранилища (зависит от облака)
parameters:
  type: gp2
reclaimPolicy: Delete
```

Использование при создании PVC:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-fast-claim
spec:
  storageClassName: fast-storage
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```
*Комментарий: Когда PVC создан — Kubernetes автоматически создаст PV с характеристиками, заданными в StorageClass.*

## Частые сценарии использования

- **Логирование**: Общий том для сбора логов
- **Хранение медиа, временных файлов**: emptyDir для обработки, PV/PVC — для долговременного хранения
- **Передача больших файлов между сервисами**: NFS/GlusterFS/cephfs/PVC RWX
- **Передача конфигурации**: configMap или secret, чтобы хранить настройки или чувствительные данные

## Советы по безопасности Volumes

- Доступ к hostPath ограничивайте: иначе контейнер сможет редактировать всё на хост-машине
- Секреты используйте только с нужными правами (fsGroup, userID), не размещайте секретные значения в обычных configMap
- Не давайте всем подам доступ к одному и тому же тома, если это не необходимо

## Мониторинг и отладка

- Используйте `kubectl describe pod <имя>` и `kubectl describe pvc <имя>` для просмотра статусов, ошибок подключения, информации о storage
- В логах kubelet можно отследить проблемы с монтированием томов
- Следите за уровнем заполнения хранилища на стороне back-end и корректно настраивайте alert-ы

## Заключение

Kubernetes Volumes предоставляют гибкую и мощную систему организации хранения данных для контейнеров. Благодаря поддержке разных типов хранилищ вы можете настраивать как временное, так и постоянное хранение информации, делиться файлами между контейнерами и подами, обеспечивать высокую доступность, а также безопасно хранить секреты и настройки. Использование Volumes — один из базовых навыков для любого инженера, работающего с Kubernetes, и чем больше практических примеров вы попробуете, тем проще будет строить сложные и надежные инфраструктуры.

## Частозадаваемые технические вопросы по теме и ответы

#### Как удалить PVC и PV так, чтобы физически были удалены данные?

Проверьте `reclaimPolicy` у PV. Если стоит `Retain` — просто удаление PVC не удалит данные — потребуется вручную чистить хранилище или менять политику на `Delete` перед удалением PV. Для полного удаления:

1. Удалите PVC:
   ```
   kubectl delete pvc my-claim
   ```
2. Если PV всё еще существует, удалите его:
   ```
   kubectl delete pv my-pv
   ```
3. Для cloud storage — проверьте, что диск удалился из облака.

#### Можно ли использовать один и тот же PVC в нескольких подах одновременно?

Только если underlying storage поддерживает RWX (ReadWriteMany). Например, NFS или cephfs — можно. AWS EBS, GCE PersistentDisk — нельзя (только RWO). Проверьте возможности storage backend перед использованием.

#### Как узнать, сколько места осталось на томе?

Можно получить информацию только по стороне контейнера — используйте команды типа `df -h /путь/к/volume`. Kubernetes сам не мониторит доступное пространство внутри volume, только на уровне PV.

#### Можно ли переместить данные с одного PV на другой?

Да, создайте новый PVC/PV, разверните временный Job или под, который скопирует данные (`rsync`, `cp`) из одного volume в другой (mount оба тома в разные папки).

#### Как ограничить права доступа к volume внутри пода?

Используйте параметры securityContext (fsGroup, runAsUser), также проверьте, какой user внутри контейнера, чтобы избежать утечек секретов при монтировании, например, секретов или configMap.

