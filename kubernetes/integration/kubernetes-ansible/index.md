---
metaTitle: Интеграция Ansible в Kubernetes - автоматизация развертывания и управления
metaDescription: Обзор методов интеграции Ansible и Kubernetes - как автоматизировать развертывание, управление и поддерживать инфраструктуру с помощью современных подходов
author: Олег Марков
title: Интеграция Ansible в Kubernetes
preview: Узнайте, как с помощью Ansible управлять кластерами и ресурсами Kubernetes, автоматизировать развертывание приложений, настраивать инфраструктуру и CI/CD процессы. Простые примеры с практическими советами
---

## Введение

Сегодня Kubernetes стал стандартом для развертывания, масштабирования и управления контейнеризированными приложениями. Но поддерживать инфраструктуру и конфигурировать приложения вручную даже в среде с высокой автоматизацией непросто. Практика DevOps опирается на инструменты автоматизации, такие как Ansible. Хотите легко управлять конфигами, диплоить приложения и обновлять кластеры Kubernetes? Ansible поможет сделать это из одного центра, без дополнительных агентов — с помощью сценариев (playbooks).

В этой статье я расскажу, как интегрировать Ansible и Kubernetes с нуля: как строится эта интеграция, какие для этого существуют модули, для чего это вообще нужно, как вы можете писать простые сценарии для управления ресурсами Kubernetes — деплойментами, сервисами, секретами и многим другим. Мы рассмотрим наиболее удобные подходы, рабочие примеры кода, возможные проблемы, лучшие практики и варианты развития автоматизации инфраструктуры на вашем проекте.

## Подходы и сценарии интеграции Ansible и Kubernetes

Смотрите, для интеграции Ansible и Kubernetes есть несколько рабочих сценариев:

- **Управление ресурсами Kubernetes (кластером, подами, сервисами и др.) через Ansible playbook'и**
- **Автоматизация процесса деплоймента и CI/CD**
- **Управление инфраструктурой кластера (bootstrap, scaling, обновления)**
- **Комбинирование описания инфраструктуры (Infrastructure as Code, IaC) и конфигураций приложений**

Давайте разберемся, как реализовать каждый из них и какие инструменты понадобятся.

### Использование Ansible для управления ресурсами Kubernetes

Ansible предоставляет специальные модули (k8s, k8s_raw, k8s_info, kubectl), позволяющие напрямую управлять объектами Kubernetes из playbook-файлов. Давайте начнем с самого частого сценария — автоматизация создания и модификации ресурсов (Deployment, Service, ConfigMap, Secret и проч.).

#### Установка необходимых зависимостей

Для работы с Kubernetes из Ansible потребуется дополнительная библиотека python `openshift`. Установите ее командой:

```bash
pip install openshift
```

Обратите внимание: Ansible сам по себе не работает с Kubernetes из коробки — библиотека `openshift` нужна для работы модулей `k8s`.

#### Обзор основных модулей

- **k8s** — основной модуль для работы с объектами из манифестов (yaml/json) или прямо из playbook.
- **k8s_raw** — отправляет сырой манифест (yaml) в API Kubernetes почти без обработки.
- **k8s_info** — позволяет получать (читать) любые объекты Kubernetes.
- **kubectl** — обертка для командной строки kubectl (редко применяется, чаще используют k8s).

Вот так выглядит базовая структура задачи в Playbook:

```yaml
- name: Создать deployment nginx app
  k8s:
    state: present
    definition:
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: nginx-deployment
        namespace: default
      spec:
        replicas: 2
        selector:
          matchLabels:
            app: nginx
        template:
          metadata:
            labels:
              app: nginx
          spec:
            containers:
            - name: nginx
              image: nginx:latest
```

В этом примере через Ansible создается deployment того же формата, что и yaml манифест Kubernetes. Все работает через API — Ansible берёт ваш манифест и применяет его в кластере.

#### Использование модуля k8s для различных ресурсов

Приведу еще примеры для создания Secret и Service из playbook. Например, вам нужно добавить секрет с паролями и сервис для доступа к приложению.

```yaml
- name: Создать secret для приложения
  k8s:
    state: present
    definition:
      apiVersion: v1
      kind: Secret
      metadata:
        name: app-secret
        namespace: default
      type: Opaque
      data:
        username: YWRtaW4=  # base64(admin)
        password: cGFzc3dvcmQ=  # base64(password)

- name: Создать сервис для приложения
  k8s:
    state: present
    definition:
      apiVersion: v1
      kind: Service
      metadata:
        name: nginx-service
        namespace: default
      spec:
        selector:
          app: nginx
        ports:
        - protocol: TCP
          port: 80
          targetPort: 80
```

Ansible принимает все, что вы обычно пишете в yaml-файлах — только вся логика теперь доступна в общем пайплайне, с возможностью параметризации и автоматизации взаимодействия с cluster API.

#### Как аутентифицироваться в Kubernetes через Ansible

По умолчанию Ansible ищет kubeconfig по стандартному пути (`~/.kube/config`). Если ваша конфигурация расположена в другом месте либо необходим доступ в другой namespace — можно и нужно указать параметры модуля `k8s`:

```yaml
- name: Применить манифест в staging-кластере
  k8s:
    kubeconfig: "/etc/k8s/staging-kubeconfig"
    context: "staging"
    namespace: "app-stage"
    state: present
    src: "/playbooks/manifests/deploy.yaml"
```

Здесь параметр `src` — путь до уже существующего yaml файла.

### Автоматизация CI/CD с помощью Ansible и Kubernetes

Здесь я покажу, как вы можете интегрировать применение playbook'ов в конвейеры CI/CD (Jenkins, GitLab CI, GitHub Actions). Представьте ситуацию — на каждом пуше ветки "main" Ansible автоматически деплоит новую версию приложения в Kubernetes. Для такого сценария нужно:

1. Хранить ваши манифесты и playbooks в репозитории.
2. Описать пайплайн CI (задачу в GitLab или Jenkins), который:
    - собирает образ;
    - пушит его в реестр;
    - применяет playbook Ansible (например, для обновления deployment).
3. Настроить переменные окружения и разрешения для подключения к Kubernetes кластеру.

Пример части playbook’а, где обновляется deployment с новой версией образа:

```yaml
- name: Обновить deployment приложения на новую версию
  k8s:
    state: present
    definition:
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: myapp-deployment
      spec:
        template:
          spec:
            containers:
            - name: myapp
              image: myrepo/myapp:{{ new_version }}  # {{ new_version }} задается как переменная из CI
```

Внутри CI вы можете передавать переменные окружения в шаблоны playbook, чтобы пайплайн был максимально гибким.

### Использование loops, conditionals и фильтров Ansible в Kubernetes задачах

Сценарии Ansible позволяют не просто применять манифесты, а делать это с логикой. Например, если у вас несколько окружений или множество сервисов — вы можете прокрутить действия в цикле:

```yaml
- name: Деплой множества сервисов через цикл
  k8s:
    state: present
    definition: "{{ lookup('file', item) }}"
  loop:
    - "manifests/app1-deployment.yaml"
    - "manifests/app2-deployment.yaml"
    - "manifests/app3-service.yaml"
```

Или же применить условия в зависимости от переменных:

```yaml
- name: Создать secret только если это production
  k8s:
    state: present
    definition: "{{ lookup('file', 'secrets/prod-secret.yaml') }}"
  when: env == "production"
```

Таким образом, вы можете управлять любой логикой вашего пайплайна - Ansible полноценно поддерживает условные выражения, фильтры, циклы.

### Получение информации из кластера Kubernetes

Частая задача — прочитать значение из кластера Kubernetes и, например, использовать его в следующих шагах.

Пример задачи, где мы вытаскиваем все deployment'ы из нужного namespace:

```yaml
- name: Получить список deployment'ов в namespace app
  k8s_info:
    api_version: apps/v1
    kind: Deployment
    namespace: app
  register: deployments

- name: Показать имена найденных deployment'ов
  debug:
    msg: "{{ item.metadata.name }}"
  loop: "{{ deployments.resources }}"
```

После выполнения первого шага у вас в переменной `deployments.resources` оказывается актуальная информация обо всех deployment'ах. Можно делать динамические действия на основе этих данных.

### Примеры реальных сценариев и Best Practices

В этой части приведу варианты более комплексных решений с пояснениями.

#### 1. Применение сетов манифестов для большого микросервисного проекта

Часто окружение состоит из десятков сервисов, каждый из которых содержит deployment, service, configmap. Вы можете организовать playbook для всего окружения:

```yaml
- name: Применить манифесты всех микросервисов
  hosts: localhost
  gather_facts: false

  vars_files:
    - group_vars/all.yaml

  tasks:
    - name: Применить все манифесты из каталога
      k8s:
        kubeconfig: "{{ kubeconfig_path }}"
        namespace: "{{ project_namespace }}"
        state: present
        src: "{{ item }}"
      with_fileglob:
        - "manifests/*.yaml"
```

`with_fileglob` позволяет пробежать по всем yaml-файлам в папке `manifests/` и применить каждый. Так ваш деплой превращается в repeatable процесс, вне зависимости от изменений в количестве сервисов.

#### 2. Использование шаблонов Jinja2 для манифестов Kubernetes

Шаблоны Jinja2 позволяют вам подгонять параметры под окружение — динамически вставлять версии, имена, переменные:

```yaml
- name: Применить templated deployment
  k8s:
    state: present
    definition: "{{ lookup('template', 'templates/deployment.yaml.j2') }}"
  vars:
    image_tag: "1.4.5"
    replicas: 3
```

В вашем файле `templates/deployment.yaml.j2` вы описываете стандартный k8s-манифест, только с переменными типа `{{ image_tag }}` или `{{ replicas }}`. Теперь любые параметры — легко меняются из inventory или переменных playbook, либо прямо из CI.

### Возможности и ограничения подхода с Ansible

#### Преимущества интеграции Ansible и Kubernetes

- Возможность организовать весь CI/CD пайплайн без дополнительных инструментов (kubectl-patch, kustomize и др.)
- Централизация управления инфраструктурой, приложениям, секьюритизацией
- Среда без установки агента в кластере (SSH/agentless)
- Поддержка параметризации, шаблонов, loops и условий, повторное использование кода
- Прекрасная интеграция с другими задачами автоматизации (серверы, базы, сеть — целый стек)

#### Минусы и проблемы, с которыми стоит быть осторожным

- Не всегда идеален для операции реально сложных/динамических инфраструктур (для них подойдут Helm и специфичные k8s-операторы)
- Работа через API подразумевает строгую структуру yaml и валидность схем
- Иногда неудобно отлаживать ошибку — сообщения из k8s API не всегда "человечные"
- Нет полностью declarative подхода (Helm/Kustomize — declarative, Ansible — procedural)

### Комбинированный подход: Ansible + Helm

Helm — основной менеджер пакетов для Kubernetes. Ansible можно связать c Helm, чтобы комбинировать шаблоны/чарты и инфраструктурную логику. Для этого есть модуль community.kubernetes.helm (pip install 'ansible[community.kubernetes]'):

```yaml
- name: Установить/обновить helm-чарт с помощью Ansible
  community.kubernetes.helm:
    name: myapp
    chart_ref: stable/myapp
    release_namespace: production
    values:
      image:
        tag: "v2.15"
    state: present
```

Такой подход позволяет развивать инфраструктуру в стиле GitOps и IaC — все управляется кодом.

## В заключении

Интеграция Ansible и Kubernetes — простой и мощный путь к автоматизации практически всего жизненного цикла ваших облачных приложений. Управлять инфраструктурой, деплоить микросервисы, настраивать секьюрити, пользоваться loops и шаблонами, собирать информацию с кластеров и многое другое становится куда проще. Ansible отлично вписывается в CI/CD пайплайны, дружелюбен к инженерам, легко расширяется и хорошо масштабируется для большинства кейсов, особенно если вы уже используете его в других частях вашей инфраструктуры.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как можно управлять Custom Resource Definitions (CRD) Kubernetes через Ansible?

Ansible-модули (например, k8s) поддерживают работу с любыми объектами Kubernetes, включая CRD. Для этого:
- Включите нужный apiVersion и kind в yaml, точно как для стандартных ресурсов.
- Убедитесь, что кубер-кластер уже содержит CRD (сами виды ресурсов).
- Применяйте их через модуль k8s, как обычно:

```yaml
- name: Создать объект CustomResource
  k8s:
    state: present
    definition: "{{ lookup('file', 'my-crd-resource.yaml') }}"
```

Главное — полная совместимость модуля с API Kubernetes.

### Как сделать dry-run применения Ansible playbook к Kubernetes?

Dry-run можно сделать с помощью опции `server_side_apply` и параметра `validate` в Ansible 2.11+:

```yaml
- name: Dry-run применения Deployment
  k8s:
    state: present
    definition: "{{ lookup('file', 'deploy.yaml') }}"
    validate: true
```
Это позволит проверить манифест без фактического изменения состояния в кластере.

### Как обработать удаление ресурсов в Ansible при использовании k8s?

Для удаления объектов используйте `state: absent`:

```yaml
- name: Удалить deployment приложения
  k8s:
    state: absent
    api_version: apps/v1
    kind: Deployment
    name: myapp
    namespace: default
```
Также можно массово удалять ресурсы через цикл по списку.

### Как настроить RBAC для выполнения задач Ansible из CI/CD в Kubernetes?

- Создайте ServiceAccount с нужными ролями.
- Выдайте ему RoleBinding/ClusterRoleBinding (например, на namespace).
- Экспортируйте kubeconfig для этого пользователя и используйте его в вашем playbook (через параметр `kubeconfig`).

### Можно ли через Ansible изменять только некоторые поля ресурсов Kubernetes (patch)?

Да, модуль `k8s` поддерживает режим patch. Используйте параметр `merge_type: strategic-merge` и укажите частичный definition или src.
```yaml
- name: Применить patch к Deployment
  k8s:
    state: present
    definition:
      metadata:
        name: myapp
      spec:
        template:
          spec:
            containers:
            - name: myapp
              image: myrepo/myapp:newtag
    merge_type: strategic-merge
```
Это удобно для изменений только необходимых параметров без переписывания всего объекта.