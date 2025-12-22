---
metaTitle: Shared конфигурация shared-config в проектах на Go
metaDescription: Shared конфигурация shared-config - как организовать единый источник настроек для микросервисов и утилит на Go без дублирования и с контролем изменений
author: Олег Марков
title: Shared конфигурация shared-config в Go проектах
preview: Shared конфигурация shared-config - как вынести настройки в общий модуль сделать их переиспользуемыми и управляемыми и упростить поддержку микросервисов
---

## Введение

Shared конфигурация (часто называют shared-config) — это подход, при котором выносится общая конфигурация для нескольких сервисов или модулей в одно место. Вместо того чтобы копировать одни и те же настройки в каждый репозиторий, вы выстраиваете единый источник правды, откуда конфигурация «подтягивается» в нужные сервисы.

Смотрите, я покажу вам, чем такой подход полезен на практике:

- вы избегаете копипаста конфигов между сервисами;
- вы быстрее вносите глобальные изменения (например, смена адреса брокера сообщений или конфигурации логгера);
- вы снижаете риск расхождения настроек между окружениями;
- вы можете централизованно контролировать версионирование и совместимость.

Под shared-config мы дальше будем понимать не конкретную библиотеку, а архитектурный паттерн и типовой модуль (репозиторий или пакет), который вы сами реализуете, например, на Go. Я буду опираться на примеры для Go, но сама идея применима и к другим языкам.

Давайте разберем, как устроить shared конфигурацию так, чтобы она была удобной, расширяемой и безопасной.

---

## Задачи, которые решает shared-config

### Когда shared конфигурация действительно нужна

Shared-config имеет смысл, когда у вас:

- несколько микросервисов, использующих одни и те же инфраструктурные компоненты:
  - базы данных;
  - брокеры сообщений;
  - системы логирования и трассировки;
  - сервисы авторизации и аутентификации;
- есть набор повторяющихся правил:
  - единый формат логов;
  - общие ограничения по таймаутам и ретраям;
  - единая схема именования топиков, очередей, таблиц;
- есть желание централизованно управлять настройками для разных окружений:
  - dev, stage, prod;
  - локальная разработка, CI, нагрузочное тестирование.

Если у вас один монолитный сервис, shared-config может быть избыточен. Но как только количество сервисов растет, общая конфигурация помогает удерживать проект под контролем.

### Типы настроек, которые удобно выносить в shared-config

Чаще всего в shared конфигурацию выносят:

- параметры подключения:
  - к базам данных (PostgreSQL, MySQL, Redis);
  - к брокерам сообщений (Kafka, RabbitMQ);
  - к очередям задач;
- настройки инфраструктуры:
  - формат логов, уровни логирования;
  - включение/выключение трассировки и метрик;
  - порты и протоколы для HTTP / gRPC;
- общие доменные параметры:
  - глобальные лимиты;
  - константы бизнес-логики, которые одинаковы для всех сервисов.

При этом чувствительные данные (пароли, токены) чаще выносят в секрет-хранилища (Vault, AWS Secrets Manager, Kubernetes Secrets) и подмешивают уже на уровне конкретного сервиса. Далее я покажу, как это объединить с shared-config без нарушения безопасности.

---

## Структура общего модуля shared-config

### Базовый подход к организации репозитория

Чаще всего shared-config делают отдельным репозиторием или модулем:

- отдельный git-репозиторий:
  - github.com/company/shared-config
- внутри — один или несколько Go-модулей:
  - github.com/company/shared-config/appconfig
  - github.com/company/shared-config/logconfig

Идея простая: каждый сервис импортирует этот модуль и инициализирует конфигурацию одинаковым способом.

Давайте посмотрим пример минимальной структуры:

- shared-config/
  - go.mod
  - config/
    - app.go      // общие параметры приложения
    - db.go       // общие параметры БД
    - http.go     // общие HTTP-настройки
    - log.go      // логирование
  - loader/
    - envloader.go  // загрузка из переменных окружения
    - fileloader.go // загрузка из файла (yaml/json/toml)
  - examples/
    - main.go    // пример использования в сервисе

Такой модуль вы публикуете как версионируемую зависимость, а сервисы подключают его как обычный пакет.

### Пример структуры типов конфигурации

Теперь давайте разберемся на примере, как могут выглядеть сами структуры конфигурации.

```go
package config

// AppConfig содержит общие настройки приложения.
type AppConfig struct {
    Name    string // Имя сервиса для логов и метрик
    Env     string // Окружение: dev, stage, prod
    Version string // Версия приложения
}

// HTTPConfig хранит настройки HTTP сервера.
type HTTPConfig struct {
    Host         string        // Адрес, на котором слушает HTTP сервер
    Port         int           // Порт HTTP сервера
    ReadTimeout  time.Duration // Таймаут чтения запроса
    WriteTimeout time.Duration // Таймаут записи ответа
}

// DBConfig задает общие параметры подключения к базе данных.
// Обратите внимание: здесь можно не хранить пароль, если вы подмешиваете его из секрета.
type DBConfig struct {
    Host     string // Хост БД
    Port     int    // Порт БД
    Database string // Имя базы данных
    User     string // Пользователь
    // Password здесь можно не хранить, а получать отдельно.
}

// Config — корневая структура общей конфигурации.
type Config struct {
    App  AppConfig  // Общие данные о приложении
    HTTP HTTPConfig // HTTP настройки
    DB   DBConfig   // Настройки базы данных
}
```

Комментарии над полями помогают другим разработчикам быстрее понять назначение каждого параметра. Смотрите, я специально оставил `Password` вне общей структуры, чтобы показать типичный подход: секреты часто подмешивают позже.

---

## Способы хранения shared конфигурации

### Вариант 1. Конфигурационные файлы (yaml, json, toml)

Один из наиболее популярных подходов — хранить конфиг в текстовых файлах и читать их при старте приложения.

Например, вы создаете файл config.yaml в репозитории shared-config:

```yaml
app:
  name: "payment-service"
  env: "prod"
  version: "1.0.0"

http:
  host: "0.0.0.0"
  port: 8080
  readTimeout: "5s"
  writeTimeout: "10s"

db:
  host: "db.prod.local"
  port: 5432
  database: "payments"
  user: "payment_user"
```

Далее в модуле shared-config вы добавляете функции загрузки этого файла. Сейчас покажу, как это может быть реализовано.

```go
package loader

import (
    "os"

    "gopkg.in/yaml.v3"

    "github.com/company/shared-config/config"
)

// LoadFromFile читает конфигурацию из yaml файла.
// filePath — путь до файла, например "./config/config.yaml".
func LoadFromFile(filePath string) (*config.Config, error) {
    // Читаем файл целиком
    data, err := os.ReadFile(filePath)
    if err != nil {
        // Если файл не найден или ошибка чтения — возвращаем ошибку
        return nil, err
    }

    var cfg config.Config
    // Распаковываем yaml в структуру конфигурации
    if err := yaml.Unmarshal(data, &cfg); err != nil {
        return nil, err
    }

    // Возвращаем заполненную структуру
    return &cfg, nil
}
```

Теперь любой сервис может сделать так:

```go
// Здесь мы показываем пример использования модуля shared-config в сервисе.

package main

import (
    "log"

    "github.com/company/shared-config/loader"
)

func main() {
    // Загружаем конфиг из файла
    cfg, err := loader.LoadFromFile("./config/config.yaml")
    if err != nil {
        log.Fatalf("failed to load config from file: %v", err)
    }

    // Теперь можно использовать cfg во всем приложении
    log.Printf("starting service %s in env %s", cfg.App.Name, cfg.App.Env)
}
```

Плюс такого подхода — явность и простота. Минус — вам нужно следить за тем, чтобы файлы были на месте в окружении, где запускается сервис (docker-образы, Kubernetes ConfigMap и т.д.).

### Вариант 2. Переменные окружения

Другой популярный вариант — хранить настройки в переменных окружения и маппить их в структуры конфигурации. Сервисам часто проще задавать ENV-переменные через Docker, Kubernetes, CI/CD.

В модуле shared-config вы можете сделать загрузчик из окружения:

```go
package loader

import (
    "os"
    "strconv"
    "time"

    "github.com/company/shared-config/config"
)

// getEnvOrDefault возвращает значение переменной окружения или дефолтное значение,
// если переменная не установлена.
func getEnvOrDefault(key, def string) string {
    val := os.Getenv(key)
    if val == "" {
        return def
    }
    return val
}

// LoadFromEnv заполняет конфигурацию на основе переменных окружения.
func LoadFromEnv() (*config.Config, error) {
    // Читаем строковые значения c дефолтами
    appName := getEnvOrDefault("APP_NAME", "unknown-service")
    appEnv := getEnvOrDefault("APP_ENV", "dev")
    appVersion := getEnvOrDefault("APP_VERSION", "0.0.1")

    httpHost := getEnvOrDefault("HTTP_HOST", "0.0.0.0")
    httpPortStr := getEnvOrDefault("HTTP_PORT", "8080")

    // Преобразуем HTTP_PORT в число
    httpPort, err := strconv.Atoi(httpPortStr)
    if err != nil {
        return nil, err
    }

    readTimeoutStr := getEnvOrDefault("HTTP_READ_TIMEOUT", "5s")
    writeTimeoutStr := getEnvOrDefault("HTTP_WRITE_TIMEOUT", "10s")

    // Парсим таймауты в time.Duration
    readTimeout, err := time.ParseDuration(readTimeoutStr)
    if err != nil {
        return nil, err
    }

    writeTimeout, err := time.ParseDuration(writeTimeoutStr)
    if err != nil {
        return nil, err
    }

    dbHost := getEnvOrDefault("DB_HOST", "localhost")
    dbPortStr := getEnvOrDefault("DB_PORT", "5432")
    dbPort, err := strconv.Atoi(dbPortStr)
    if err != nil {
        return nil, err
    }

    dbName := getEnvOrDefault("DB_NAME", "app")
    dbUser := getEnvOrDefault("DB_USER", "app")

    // Формируем итоговую конфигурацию
    cfg := &config.Config{
        App: config.AppConfig{
            Name:    appName,
            Env:     appEnv,
            Version: appVersion,
        },
        HTTP: config.HTTPConfig{
            Host:         httpHost,
            Port:         httpPort,
            ReadTimeout:  readTimeout,
            WriteTimeout: writeTimeout,
        },
        DB: config.DBConfig{
            Host:     dbHost,
            Port:     dbPort,
            Database: dbName,
            User:     dbUser,
        },
    }

    return cfg, nil
}
```

Дальше сервис просто вызывает этот загрузчик:

```go
package main

import (
    "log"

    "github.com/company/shared-config/loader"
)

func main() {
    // Загружаем конфиг из переменных окружения
    cfg, err := loader.LoadFromEnv()
    if err != nil {
        log.Fatalf("failed to load config from env: %v", err)
    }

    log.Printf("HTTP server will start on %s:%d", cfg.HTTP.Host, cfg.HTTP.Port)
}
```

Такой подход особенно удобен в «облачных» окружениях, где переменные окружения задаются декларативно.

### Вариант 3. Комбинированная схема: файл + окружение + секреты

На практике чаще всего используется комбинированный вариант:

- общие, не секретные и не меняющиеся настройки хранятся в файле в shared-config;
- конкретные значения, зависящие от окружения, переопределяются переменными окружения;
- секреты подмешиваются из специального хранилища.

Давайте посмотрим, как можно реализовать последовательную загрузку с возможностью override:

```go
package loader

import (
    "github.com/company/shared-config/config"
)

// LoadCombined демонстрирует комбинированный подход:
// 1. Загружаем базовые настройки из файла.
// 2. При наличии — переопределяем их значениями из окружения.
func LoadCombined(filePath string) (*config.Config, error) {
    // Сначала загружаем базовый конфиг из файла
    baseCfg, err := LoadFromFile(filePath)
    if err != nil {
        return nil, err
    }

    // Далее пытаемся получить значения из окружения
    envCfg, err := LoadFromEnv()
    if err != nil {
        return nil, err
    }

    // Объединяем конфигурации:
    // если значение в envCfg непустое или ненулевое — используем его.
    merged := mergeConfigs(baseCfg, envCfg)

    return merged, nil
}

// mergeConfigs объединяет конфигурации base и override.
func mergeConfigs(base, override *config.Config) *config.Config {
    // В этом примере мы реализуем простое перекрытие.
    result := *base // Копируем базовую конфигурацию

    // Если override.App.Name задан — используем его.
    if override.App.Name != "" {
        result.App.Name = override.App.Name
    }
    if override.App.Env != "" {
        result.App.Env = override.App.Env
    }
    if override.App.Version != "" {
        result.App.Version = override.App.Version
    }

    // HTTP: проверяем значения порта и хоста
    if override.HTTP.Host != "" {
        result.HTTP.Host = override.HTTP.Host
    }
    if override.HTTP.Port != 0 {
        result.HTTP.Port = override.HTTP.Port
    }

    // Аналогично можно проверять и задавать другие поля.
    // Для краткости часть проверок опущена.

    return &result
}
```

Теперь сервис может вызывать:

```go
cfg, err := loader.LoadCombined("./config/config.yaml")
```

и быть уверенным, что базовые значения подгружены из файла, а конкретные переопределены окружением.

---

## Версионирование и совместимость shared-config

### Почему версионирование критично

Shared-config — это общая зависимость. Как только вы изменяете структуру конфигурации или формат файлов, вы потенциально ломаете все сервисы, которые на нее опираются. Поэтому важно:

- явно версионировать модуль;
- избегать breaking changes без увеличения мажорной версии;
- документировать изменения.

В Go это особенно удобно делать с модульными версиями (v2, v3 и т.д.) в go.mod.

### Пример стратегии версионирования

Представим, что у вас есть модуль:

- github.com/company/shared-config v1.2.3

Если вы:

- добавляете новые поля в структуру конфигурации — это минорное изменение:
  - v1.2.3 → v1.3.0
- изменяете тип поля или удаляете поле — это breaking change:
  - v1.3.0 → v2.0.0 (и в Go модуле появится путь /v2)

Смотрите, как это обычно отражается в go.mod сервиса:

```go
module github.com/company/payment-service

go 1.22

require (
    github.com/company/shared-config/v2 v2.0.1 // Используем вторую мажорную версию
)
```

Так вы даете сервисам выбор — оставаться на старой версии, пока они не будут готовы к миграции.

---

## Инициализация конфигурации в сервисе

### Типовой шаблон start-up кода

Давайте соберем все вместе и посмотрим на типовой main.go, который использует shared-config.

```go
package main

import (
    "log"
    "net/http"
    "time"

    "github.com/company/shared-config/config"
    "github.com/company/shared-config/loader"
)

// App — пример структуры приложения, в которой мы храним конфиг и зависимости.
type App struct {
    Config *config.Config // Общая конфигурация
    // Здесь же можно разместить логгер, коннекторы к БД и другие зависимости.
}

// NewApp создает приложение на основе конфигурации.
func NewApp(cfg *config.Config) *App {
    return &App{
        Config: cfg,
    }
}

// StartHTTPServer запускает простой HTTP сервер на основе конфигурации.
func (a *App) StartHTTPServer() error {
    mux := http.NewServeMux()
    // Регистрируем простой обработчик
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        // Здесь мы просто возвращаем статус 200 для проверки здоровья
        w.WriteHeader(http.StatusOK)
        _, _ = w.Write([]byte("OK"))
    })

    srv := &http.Server{
        Addr:         a.httpAddr(),
        Handler:      mux,
        ReadTimeout:  a.Config.HTTP.ReadTimeout,
        WriteTimeout: a.Config.HTTP.WriteTimeout,
    }

    log.Printf("starting HTTP server on %s", srv.Addr)
    return srv.ListenAndServe()
}

// httpAddr формирует строку адреса из host и port.
func (a *App) httpAddr() string {
    return a.Config.HTTP.Host + ":" + strconv.Itoa(a.Config.HTTP.Port)
}

func main() {
    // На старте сервиса загружаем конфигурацию.
    // Можно выбрать любой из реализованных подходов.
    cfg, err := loader.LoadCombined("./config/config.yaml")
    if err != nil {
        log.Fatalf("failed to load config: %v", err)
    }

    // Дополнительно можно вывести часть конфига в лог для контроля.
    log.Printf("service %s starting in env %s", cfg.App.Name, cfg.App.Env)

    app := NewApp(cfg)

    if err := app.StartHTTPServer(); err != nil {
        log.Fatalf("HTTP server stopped with error: %v", err)
    }
}
```

Как видите, весь код инициализации конфигурации сосредоточен в одном месте. Сервису не нужно знать детали того, как конкретно загружается shared-config, он лишь использует готовую структуру.

---

## Расширение shared конфигурации для разных сервисов

### Общая база + сервис-специфичные настройки

Не все настройки могут быть полностью общими. Часто возникает ситуация, когда:

- есть «ядро» общих параметров (логирование, HTTP, база);
- у каждого сервиса есть свой небольшой набор специфичных параметров.

Практичный подход — сделать общую структуру конфигурации расширяемой, а в сервисе добавлять свой слой поверх нее.

Например, вы определяете в shared-config:

```go
// В модуле shared-config

package config

// BaseConfig — базовый общий конфиг.
type BaseConfig struct {
    App  AppConfig
    HTTP HTTPConfig
    DB   DBConfig
}
```

А в сервисе — свою итоговую структуру:

```go
// В сервисе payment-service

package config

import shared "github.com/company/shared-config/config"

// ServiceConfig — итоговая конфигурация сервиса.
// Она включает общую базу и добавляет поля, специфичные для этого сервиса.
type ServiceConfig struct {
    Shared shared.BaseConfig // Вложенный общий конфиг

    // Специфичные настройки сервиса
    PaymentTimeout time.Duration // Таймаут операции оплаты
    Currency       string        // Базовая валюта
}
```

Далее вы можете:

- загрузить shared часть через модуль shared-config;
- подмешать сервисные параметры из своего файла или окружения.

### Объединение общего и сервисного конфигов

Покажу вам, как это реализовано на практике:

```go
package loader

import (
    "os"
    "time"

    sharedloader "github.com/company/shared-config/loader"
    sharedconfig "github.com/company/shared-config/config"

    "github.com/company/payment-service/config"
)

// LoadServiceConfig загружает общую конфигурацию и дополняет ее сервисными настройками.
func LoadServiceConfig(sharedFilePath string) (*config.ServiceConfig, error) {
    // Загружаем общую часть (shared)
    baseCfg, err := sharedloader.LoadCombined(sharedFilePath)
    if err != nil {
        return nil, err
    }

    // Читаем сервис-специфичные параметры из окружения (как пример)
    paymentTimeoutStr := os.Getenv("PAYMENT_TIMEOUT")
    if paymentTimeoutStr == "" {
        paymentTimeoutStr = "30s"
    }
    paymentTimeout, err := time.ParseDuration(paymentTimeoutStr)
    if err != nil {
        return nil, err
    }

    currency := os.Getenv("PAYMENT_CURRENCY")
    if currency == "" {
        currency = "USD"
    }

    // Формируем итоговую конфигурацию сервиса
    svcCfg := &config.ServiceConfig{
        Shared: sharedconfig.BaseConfig{
            App:  baseCfg.App,
            HTTP: baseCfg.HTTP,
            DB:   baseCfg.DB,
        },
        PaymentTimeout: paymentTimeout,
        Currency:       currency,
    }

    return svcCfg, nil
}
```

Теперь вы можете переиспользовать всю общую инфраструктурную часть и не зашивать в shared-config детали конкретных доменов.

---

## Работа с секретами в контексте shared-config

### Почему лучше не хранить секреты в shared-config

Shared-config часто используется многими сервисами и окружениями, поэтому включать в него пароли, ключи и токены небезопасно:

- репозиторий могут читать люди, которым не нужен доступ к продакшен-секретам;
- конфигурационные файлы легко случайно залогировать;
- при утечке shared-config вы рискуете всеми сервисами сразу.

Поэтому рекомендуется:

- хранить секреты отдельно (Vault, AWS Secrets Manager, Kubernetes Secrets);
- в shared-config держать только «скелет» параметров;
- в коде сервиса подмешивать секреты в момент инициализации.

### Пример объединения shared-config и секретов

Давайте посмотрим, как можно объединить общие настройки и секреты в коде сервиса.

```go
package main

import (
    "log"
    "os"

    "github.com/company/shared-config/loader"
)

// DBConnectionConfig описывает полную конфигурацию подключения к БД,
// включая пароль, который мы берем из секрета.
type DBConnectionConfig struct {
    Host     string
    Port     int
    Database string
    User     string
    Password string
}

func main() {
    // Загружаем общую конфигурацию
    cfg, err := loader.LoadCombined("./config/config.yaml")
    if err != nil {
        log.Fatalf("failed to load shared config: %v", err)
    }

    // Секрет берем из переменной окружения (или из секрет-хранилища)
    dbPassword := os.Getenv("DB_PASSWORD")
    if dbPassword == "" {
        log.Fatal("DB_PASSWORD env variable is not set")
    }

    // Объединяем общую часть и секрет
    dbConnCfg := DBConnectionConfig{
        Host:     cfg.DB.Host,
        Port:     cfg.DB.Port,
        Database: cfg.DB.Database,
        User:     cfg.DB.User,
        Password: dbPassword,
    }

    log.Printf("will connect to DB %s on %s:%d with user %s",
        dbConnCfg.Database, dbConnCfg.Host, dbConnCfg.Port, dbConnCfg.User)

    // Далее можно передать dbConnCfg в функцию, которая устанавливает соединение с БД.
}
```

Такой подход позволяет:

- хранить shared-config в обычном репозитории;
- не раскрывать пароли и ключи;
- явно контролировать, откуда приходят чувствительные данные.

---

## Тестирование shared-config

### Юнит-тесты для загрузки и мерджа конфигураций

Shared-config — это критичная зависимость. Ошибка в конфигурации может привести к падению сразу всех сервисов. Поэтому стоит покрывать его тестами.

Вот пример, как можно протестировать загрузку из файла:

```go
package loader_test

import (
    "os"
    "testing"

    "github.com/company/shared-config/config"
    "github.com/company/shared-config/loader"
)

// TestLoadFromFile проверяет корректность загрузки конфигурации из файла.
func TestLoadFromFile(t *testing.T) {
    // Создаем временный файл с yaml конфигурацией
    tmpFile, err := os.CreateTemp("", "config-*.yaml")
    if err != nil {
        t.Fatalf("failed to create temp file: %v", err)
    }
    defer os.Remove(tmpFile.Name())

    yamlContent := `
app:
  name: "test-service"
  env: "test"
  version: "0.1.0"

http:
  host: "127.0.0.1"
  port: 9000
  readTimeout: "1s"
  writeTimeout: "2s"

db:
  host: "localhost"
  port: 5432
  database: "test_db"
  user: "test_user"
`

    if _, err := tmpFile.Write([]byte(yamlContent)); err != nil {
        t.Fatalf("failed to write temp file: %v", err)
    }
    tmpFile.Close()

    cfg, err := loader.LoadFromFile(tmpFile.Name())
    if err != nil {
        t.Fatalf("LoadFromFile returned error: %v", err)
    }

    // Проверяем отдельные поля конфигурации
    if cfg.App.Name != "test-service" {
        t.Errorf("expected App.Name = test-service, got %s", cfg.App.Name)
    }
    if cfg.HTTP.Port != 9000 {
        t.Errorf("expected HTTP.Port = 9000, got %d", cfg.HTTP.Port)
    }
}
```

Аналогично можно тестировать:

- загрузку из окружения;
- объединение конфигураций (mergeConfigs);
- обработку невалидных значений.

### Контрактные тесты между shared-config и сервисами

Полезная практика — контрактные тесты, которые проверяют, что:

- поля, которые использует сервис, действительно есть в shared-config;
- их типы не изменились.

Простой способ — добавить в сервис тест, который обращается к полям shared-конфига и не делает логики. Если этот тест перестанет компилироваться при обновлении shared-config, вы сразу увидите проблему.

```go
package config_test

import (
    "testing"

    shared "github.com/company/shared-config/config"
)

// TestSharedConfigContract проверяет, что необходимые поля остаются в конфиге.
func TestSharedConfigContract(t *testing.T) {
    var c shared.Config

    // Просто обращаемся к полям, которые нам нужны.
    _ = c.App.Name
    _ = c.App.Env
    _ = c.HTTP.Port
    _ = c.DB.Host

    // Если поле будет удалено или изменен его тип, тест не скомпилируется.
}
```

---

## Организационные моменты использования shared-config

### Кто отвечает за изменение shared-config

Хорошая практика — назначить ответственных за модуль shared-config:

- обычно это платформа или инфраструктурная команда;
- изменения, влияющие на многих потребителей, проходят через review представителей ключевых сервисов;
- breaking changes — только с четким планом миграции.

Так вы избегаете ситуации, когда каждый сервис подтягивает «быстрые» изменения под себя, ломая других.

### Документация и ченджлог

Shared-config нужно документировать не меньше, чем публичные API:

- описывать поля и их возможные значения;
- приводить примеры для разных окружений;
- вести ченджлог с описанием, что и почему изменилось.

Полезно завести:

- отдельный файл docs/README.md в репозитории shared-config;
- раздел «Как мигрировать с v1 на v2» с конкретными инструкциями.

---

Shared конфигурация (shared-config) позволяет вынести общие настройки в единый модуль, уменьшить дублирование и снизить вероятность расхождений между сервисами. Важно четко продумать:

- структуру типов конфигурации;
- способы хранения и загрузки (файлы, окружение, секреты);
- стратегию версионирования и совместимости;
- расширяемость под конкретные сервисы.

Если вы аккуратно подходите к дизайну shared-config и покрываете его тестами, он становится надежным фундаментом для всех ваших микросервисов.

---

## Частозадаваемые технические вопросы по shared-config

### Как сделать горячую перезагрузку shared конфигурации без рестарта сервиса

Обычно добавляют watcher над источником конфигурации:

1. Для файла:
   - использовать fsnotify для отслеживания изменений файла;
   - при событии `Write` перечитывать конфиг и атомарно обновлять в памяти указатель на структуру (через `atomic.Value`).
2. Для конфигурации из key-value хранилищ (Consul, etcd):
   - подписаться на изменения (watch API);
   - при приходе нового значения заново декодировать конфиг и обновить его в приложении.

Важно:
- валидировать новый конфиг перед применением;
- применять только при успешном парсинге, иначе оставлять старый.

### Как обеспечить типобезопасность при доступе к shared конфигурации в разных сервисах

Лучше не раздавать доступ к «сырым» map или интерфейсам. Вместо этого:

1. В shared-config определить строгие структуры (struct) с типизированными полями.
2. Предоставить функции-конструкторы (например, `NewHTTPConfigFromEnv`), которые возвращают полностью инициализированные структуры.
3. В сервисах работать только с этими типами, а не с `map[string]string`.

Это позволяет ловить ошибки на этапе компиляции, а не в рантайме.

### Как поступать, если разные сервисы требуют разные форматы конфигурации (yaml vs json)

Решение — разделить:

1. Внутреннее представление:
   - в shared-config использовать Go-структуры как единую модель.
2. Внешние форматы:
   - добавить несколько загрузчиков: `LoadFromYAML`, `LoadFromJSON`, `LoadFromEnv`;
   - каждый загрузчик декодирует формат в одни и те же структуры.

Сами сервисы выбирают, какой загрузчик использовать, но все работают с единой моделью данных.

### Как мигрировать сервисы на новую версию shared-config поэтапно

Пошаговый подход:

1. В shared-config сделать новую версию в отдельной мажорной ветке (v2).
2. Временно поддерживать обе версии (v1 и v2) в репозитории.
3. В каждом сервисе:
   - сначала обновить зависимости;
   - адаптировать код под новую структуру;
   - добавить совместимый адаптер, если нужно.
4. После миграции всех сервисов — заморозить v1 (но не удалять из истории) и использовать только v2.

Важно: не форсировать одномоментное обновление всех сервисов, а позволять им мигрировать по очереди.

### Как протестировать, что shared-config корректно работает в конкретном окружении (например, в Kubernetes)

Рекомендуемый подход:

1. Локальный smoke-тест:
   - поднять контейнер сервиса с теми же ConfigMap/Secret, что и на окружении;
   - запустить `go test` с интеграционными тестами, которые проверяют загрузку конфигурации.
2. В CI:
   - развернуть временный namespace в Kubernetes;
   - применить манифесты с shared-config;
   - выполнить job, которая:
     - считывает конфиг тем же способом, что и сервис;
     - выводит в лог критичные поля;
     - падает, если не удается загрузить или распарсить конфиг.

Так вы заранее ловите проблемы с путями к файлам, именами переменных окружения и несовместимыми значениями.