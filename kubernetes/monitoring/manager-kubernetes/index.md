---
metaTitle: Работа с Manager в Kubernetes
metaDescription: Разберитесь с ролью Manager в Kubernetes - основные концепции, примеры настройки и расширения, жизненный цикл и интеграция с контроллерами
author: Олег Марков
title: Работа с Manager в Kubernetes
preview: Узнайте, как использовать Manager в Kubernetes - создание, настройка, управление контроллерами и расширение возможностей вашего кластера на практике
---

## Введение

В Kubernetes одним из ключевых понятий при разработке контроллеров и операторов является объект Manager. Он служит центральной точкой для управления контроллерами, согласованием их работы и унификации процессов работы с ресурсами кластера. Понимание структуры и возможностей Manager важно не только для разработчиков собственных CRD-контроллеров и операторов, но и для тех, кто хочет глубже разобраться, как устроена автоматизация в Kubernetes.

В этой статье я покажу, как использовать Manager для управления жизненным циклом контроллеров, расскажу о типичных сценариях настройки и расширения Manager, а также о его взаимодействии с другими компонентами в экосистеме Kubernetes.

## Что такое Manager и зачем он нужен

Manager — это часть библиотеки [controller-runtime](https://github.com/kubernetes-sigs/controller-runtime) и ядро большинства современных Kubernetes-операторов. Его задача — упростить создание, интеграцию и управление различными контроллерами и вебхуками как единой системой.

### Основные задачи Manager

- Инициализация зависимостей (например, клиентов к API-серверу, логгирования, схемы типов).
- Управление жизненным циклом контроллеров и вебхуков.
- Реализация паттернов graceful shutdown и leader election.
- Централизация наблюдения и ограничения прав доступа (RBAC).
- Работа с кэшами для увеличения производительности.

Manager позволяет регистрировать несколько контроллеров, которые зачастую взаимодействуют с разными объектами Kubernetes и реализуют разную бизнес-логику, но их запуском и синхронизацией заведует один общий объект.

### Где используется Manager

- В большинстве операторов, созданных с помощью Kubebuilder, Operator SDK и controller-runtime
- При разработке пользовательских контроллеров для поддержки новых CRD или расширения поведения стандартных ресурсов

## Создание и настройка Manager

Давайте посмотрим, как создать объект Manager и настроить его основные параметры на примере простого контроллера.

### Установка controller-runtime

Начнем с установки необходимых зависимостей:

```bash
go get sigs.k8s.io/controller-runtime@v0.14.1
```

Эту библиотеку вы будете использовать для создания Manager.

### Пример создания Manager

Вот пример кода, который показывает, как инициализируется Manager. Я дополню его комментариями, чтобы вам было легче ориентироваться.

```go
package main

import (
    "os"
    "time"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/manager"
)

func main() {
    // Настройка опций Manager
    options := manager.Options{
        MetricsBindAddress: ":8080", // Метрика для Prometheus
        Port:               9443,    // Порт для webhook-сервера
        SyncPeriod:         pointerToDuration(10 * time.Minute), // Синхронизация контроллеров
        LeaderElection:     true,    // Активация leader election (важно для HA)
        LeaderElectionID:   "example-operator-leader",
    }

    // Создаем Manager
    mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), options)
    if err != nil {
        // Важная проверка на ошибку создания Manager
        os.Exit(1)
    }

    // Запускаем Manager (он инициализирует все контроллеры, webhook'и, health checks)
    if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
        os.Exit(1)
    }
}

func pointerToDuration(d time.Duration) *time.Duration {
    return &d
}
```

Обратите внимание, что все опции Manager задаются через структуру `manager.Options`. Вы можете кастомизировать практически любой аспект поведения.

### Ключевые опции менеджера

Рассмотрим основные поля `manager.Options`, которые чаще всего встречаются:

- **MetricsBindAddress** — на каком порту будут слушаться метрики Prometheus
- **Port** — порт для webhook-сервера
- **SyncPeriod** — периодичность синхронизации состояния ресурсов в absence событий
- **LeaderElection** — нужен ли leader election для устранения конфликтов в высокодоступных раскатах
- **Namespace** — ограничение области наблюдения (можно следить за одним namespace’ом, а не всем кластером)
- **Scheme** — обязательная схема, через которую Manager узнает о поддерживаемых типах ресурсов

Теперь рассмотрим, как регистрировать контроллеры и работать с зависимостями.

## Регистрация контроллеров через Manager

Один из мощнейших аспектов Manager — централизованная регистрация контроллеров и гарантированная обработка их жизненного цикла.

### Пример контроллера и добавление его в Manager

Допустим, у вас есть кастомный контроллер, реализующий логику для работы с ресурсом `App`.

```go
package controllers

import (
    "context"
    "sigs.k8s.io/controller-runtime/pkg/client"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/reconcile"
)

type AppReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

// Метод Reconcile — основная точка синхронизации объекта
func (r *AppReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // Здесь пользовательская логика — синхронизация состояния
    return ctrl.Result{}, nil
}
```

Теперь нужно зарегистрировать этот контроллер через Manager.

```go
func main() {
    mgr, _ := ctrl.NewManager(ctrl.GetConfigOrDie(), manager.Options{})
    
    // Регистрация контроллера
    err := (&controllers.AppReconciler{
        Client: mgr.GetClient(),
        Scheme: mgr.GetScheme(),
    }).SetupWithManager(mgr)
    if err != nil {
        os.Exit(1)
    }

    // Запуск Manager (он запустит контроллеры)
    if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
        os.Exit(1)
    }
}
```

Вызов `SetupWithManager(mgr)` интегрирует ваш контроллер с общим лупом:

- Менеджер будет следить за events, поступающими для наблюдаемых ресурсов
- Reconcile-метод вашего контроллера будет асинхронно вызываться при каждом изменении объектов

### Преимущества такого способа регистрации

- Единая точка управления ресурсами
- Удобное внедрение зависимостей через manager (client, scheme, event recorder и так далее)
- Стандартизированный процесс graceful shutdown: Manager корректно завершает работу всех контроллеров

## Работа с зависимостями через Manager

Когда вы создаете контроллеры через Manager, у вас автоматически появляется доступ к полезным зависимостям:

- Синглтон-клиент (ctrl-runtime/pkg/client), работающий через shared кэш
- Scheme для поддержки различных ресурсов
- Канал сигналов для корректного shutdown
- Возможность настройки event recorder для удобного логирования

Пример внедрения зависимостей показан в объявлении структуры контроллера выше.

```go
type AppReconciler struct {
    client.Client         // Клиент для загрузки и сохранения объектов
    Scheme *runtime.Scheme // Схема для декодирования ресурсов
}
```

Manager инкапсулирует работу с кэшем (Informer-кэш), а каждый контроллер через него получает "живую" копию объекта и минимизирует количество запросов к API-серверу.

## Расширение Manager (работа с health checks, webhook'ами, задачами)

Manager — не только точка запуска контроллеров. Он может расширяться за счет дополнительных возможностей:

- Health checks (жизнестойкость вашего оператора)
- Webhook-серверы (валидация изменений CRD)
- Добавление кастомных runnable процессов

### Пример добавления health и ready check

```go
err := mgr.AddHealthzCheck("healthz", healthz.Ping)
if err != nil {
    // Добавление health-probe не удалось
    os.Exit(1)
}
err = mgr.AddReadyzCheck("readyz", healthz.Ping)
if err != nil {
    os.Exit(1)
}
```
Теперь liveness и readiness probe можно пробрасывать через контейнер в deployment спецификации.

### Пример добавления webhook

```go
webhookServer := mgr.GetWebhookServer()
webhookServer.Register("/validate-v1-app", &webhook.Admission{
    Handler: &MyValidator{}, // Здесь ваша логика валидации
})
```

### Добавление кастомных процессов (Runnables)

Если вашему оператору требуется фоновые задачи, их можно добавить как runnables.

```go
mgr.Add(manager.RunnableFunc(func(ctx context.Context) error {
    // Здесь ваша фоновая задача
    <-ctx.Done()  // Ждем сигнала на shutdown
    return nil
}))
```

Здесь я показал, как легко расширять Manager дополнительной логикой.

## Лидер-элект: как Manager организует отказоустойчивость

Если вы деплоите оператор в несколько экземпляров (replica > 1), по умолчанию все экземпляры будут пытаться работать одновременно. Это создаст конкуренцию и потенциальные сбои. Защита — leader election.

Manager поддерживает leader election "из коробки":

```go
options := manager.Options{
    LeaderElection:   true,
    LeaderElectionID: "my-operator",
}
```

- Только один экземпляр оператора будет выполнять reconcile
- Остальные становятся "standby", захватывая лидерство при падении ведущего

Manager использует built-in механизмы Kubernetes (ConfigMap или Lease на выбранном объекте).

## Namespace scope: ограничение области видимости

Еще один частый сценарий — ограничить область контроля одной областью:

```go
mgr, _ := ctrl.NewManager(ctrl.GetConfigOrDie(), manager.Options{
    Namespace: "my-namespace",
})
```

Теперь все контроллеры и вебхуки, которые регистрируются через этот Manager, будут работать только в рамках my-namespace.

## Как Manager реализует graceful shutdown

Manager заботится о подготовленном завершении работы:

- При получении SIGTERM или SIGINT вызывает stop-колбеки у каждого контроллера и webhook'а
- Документированная реакция на канал ctx.Done() в Add-функциях
- Автоматическая остановка HTTP-серверов, задаваемых в health/webhook

Это разгружает вас от ручной обработки сигналов.

## Как устроен жизненный цикл Manager

Менеджер запускается, выполняет инициализацию зависимостей (client, кэшей, схемы, HTTP/probes, leader election), регистрирует контроллеры, запускает их reconcile-потоки, следит за сигналами завершения и завершает работу элегантно.

В часто используемых фреймворках типа Kubebuilder, весь код main.go строится вокруг manager.

## Практические паттерны для работы с Manager

### Конфигурируемость через параметры командной строки

Флаги удобно замапить в параметры Manager через os.Args и pflag:

```go
var metricsAddr string
flag.StringVar(&metricsAddr, "metrics-addr", ":8080", "Address for metrics.")

mgr, _ := ctrl.NewManager(restConfig, manager.Options{
    MetricsBindAddress: metricsAddr,
})
```

### Разделение логики по пакетам

- В main.go только Manager и загрузка флагов
- Контроллеры, scheme-registration, webhook-регистрация в отдельных пакетах
- Каждая сущность (controller, webhook) самостоятельна и внедряется через `SetupWithManager`

Это облегчает тестирование и поддержку.

## Заключение

Manager из controller-runtime — это универсальный инструмент построения контроллеров и операторов в Kubernetes. Он берет на себя самую рутинную и рискованную работу по инициализации зависимостей, управлению жизненным циклом, отказоустойчивостью и graceful shutdown. Использование Manager позволяет писать структурированные кластере-приложения и сокращает вероятность ошибок в продакшене. Именно поэтому современные Kubernetes-операторы почти всегда строятся вокруг него.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### 1. Как добавить стандартный логгер ко всем контроллерам Manager?

```go
import "sigs.k8s.io/controller-runtime/pkg/log/zap"

ctrl.SetLogger(zap.New(zap.UseDevMode(true)))
```
Добавьте это в начало main.go для инициализации логгера, до создания Manager.

### 2. Можно ли динамически регистрировать контроллеры после старта Manager?

Нет, все контроллеры должны быть зарегистрированы до запуска mgr.Start(). Manager фиксирует конфигурацию при старте для безопасности и целостности процессов.

### 3. Как получить REST-конфиг для собственных клиентов из Manager?

```go
restConfig := mgr.GetConfig()
// Теперь restConfig можно использовать для создания собственных клиентов
```

### 4. Что делать, если нужно смотреть за несколькими namespaces?

Используйте MultiNamespacedCacheBuilder:
```go
mgr, _ := ctrl.NewManager(restConfig, manager.Options{
    NewCache: cache.MultiNamespacedCacheBuilder([]string{"ns1", "ns2"}),
})
```
Позволяет работать с несколькими неймспейсами.

### 5. Как убрать сервер healthz или webhook из Manager?

Параметры manager.Options:
- `HealthProbeBindAddress: "0"` — отключит HTTP-сервер healthz/readyz;
- `WebhookServer: nil` — отключит webhook-сервер (только если вы не планируете их использовать).