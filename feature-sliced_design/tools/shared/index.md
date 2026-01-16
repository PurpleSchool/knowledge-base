---
metaTitle: Shared конфигурация shared-config в микросервисной архитектуре на примерах
metaDescription: Подробное руководство по shared конфигурации shared-config - как проектировать общие настройки для микросервисов избегать дублирования и централизовать управление параметрами
author: Олег Марков
title: Shared конфигурация shared-config - подходы паттерны и примеры использования
preview: Разбираем shared конфигурацию shared-config - как организовать общие настройки для нескольких сервисов сделать их переиспользуемыми и управляемыми на практике
---

## Введение

Shared конфигурация (часто называют shared-config) — это подход, при котором общие настройки для нескольких сервисов или приложений выносится в единый источник. Смотрите, идея простая: вместо того чтобы копировать одни и те же параметры в каждый сервис, вы храните их в одном месте и подключаете там, где они нужны.

В микросервисной архитектуре это особенно важно: у вас десятки или сотни сервисов, и каждый должен знать, куда ходить в базу данных, какие использовать адреса очередей, какие таймауты применять и так далее. Если каждый сервис хранит свою копию этих настроек, вы почти гарантированно получите:

- рассинхронизацию значений;
- сложное обновление конфигурации;
- ошибки при деплое и настройке окружений.

Shared-config решает эту проблему за счет централизованного хранения и управления общими параметрами, при этом оставляя сервисам возможность иметь собственные специфичные настройки.

Давайте разберемся, как спроектировать shared конфигурацию так, чтобы она была удобной, безопасной, расширяемой и не превращалась в монолитный "комбайн", от которого зависят все.


## Что такое shared-config и когда он нужен

### Основная идея shared конфигурации

Shared-config — это:

- Набор общих конфигурационных сущностей (структуры, файлы, схемы, типы), которые используются несколькими сервисами.
- Общий механизм загрузки и валидации этих настроек.
- Единые соглашения по тому, как сервисы получают значения параметров (переменные окружения, файлы, удаленный конфиг-сервис и т.д.).

При этом shared-config обычно оформляется как:

- отдельный репозиторий;
- или отдельный модуль/пакет, подключаемый как зависимость;
- или централизованный конфигурационный сервис.

Практически всегда shared-config включает:

- общие структуры настроек (например, блок настроек для PostgreSQL, Redis, Kafka);
- общие значения по умолчанию;
- единые ключи (имена переменных окружения, имена полей, имена секций);
- общие функции получения и проверки конфигурации.

### Когда shared-config действительно нужен

Shared-config полезен, когда:

- У вас есть не один, а несколько сервисов, и они используют:
  - одну и ту же базу данных;
  - общие брокеры сообщений;
  - общие внешние API;
  - единый подход к логированию, трейсингу, метрикам.
- Вы хотите, чтобы:
  - добавление нового сервиса не требовало "изобретать" конфигурацию с нуля;
  - все сервисы работали по единым стандартам (формат логов, уровни логирования, таймауты запросов и т.д.);
  - обновление конфигурации происходило централизованно.

Если же у вас один монолит или один сервис, shared-config как отдельная сущность обычно избыточен: достаточно локальных конфиг-файлов и переменных окружения.


## Варианты архитектуры shared-config

### Подход 1. Общий код как библиотека (shared-config репозиторий)

Самый распространенный вариант — вынести shared-конфиг в отдельную библиотеку и подключать ее во все сервисы.

Структура может выглядеть так:

- репозиторий `shared-config`
- в нем:
  - определения структур настроек (например, на Go, Java, Node.js и т.д.);
  - функции загрузки этих структур из разных источников;
  - общие значения по умолчанию;
  - общие проверки (валидация).

Давайте разберемся на условном примере на Go, чтобы было конкретнее.

### Пример структуры репозитория shared-config

Представим простой репозиторий:

- `config/`
  - `database.go`
  - `http.go`
  - `logging.go`
  - `config.go`
- `env/`
  - `loader.go`
- `defaults/`
  - `defaults.go`

Инициализация может выглядеть так:

```go
// Файл config/config.go

package config

// AppConfig - корневая структура конфигурации приложения
type AppConfig struct {
    Database DatabaseConfig // Настройки базы данных
    HTTP     HTTPConfig     // Настройки HTTP-сервера
    Logging  LoggingConfig  // Настройки логирования
}
```

```go
// Файл config/database.go

package config

// DatabaseConfig - общие настройки подключения к БД
type DatabaseConfig struct {
    Host     string // Хост базы данных
    Port     int    // Порт базы данных
    User     string // Имя пользователя
    Password string // Пароль
    Name     string // Имя базы данных
    SSLMode  string // Режим SSL подключения
}
```

```go
// Файл config/http.go

package config

// HTTPConfig - настройки HTTP сервера
type HTTPConfig struct {
    Host         string // На каком адресе слушать запросы
    Port         int    // На каком порту слушать запросы
    ReadTimeout  int    // Таймаут чтения запроса в секундах
    WriteTimeout int    // Таймаут записи ответа в секундах
}
```

```go
// Файл config/logging.go

package config

// LoggingConfig - общие настройки логирования
type LoggingConfig struct {
    Level string // Уровень логирования - debug info warn error
    JSON  bool   // Логировать в JSON формате или нет
}
```

```go
// Файл defaults/defaults.go

package defaults

import "github.com/your-org/shared-config/config"

// NewDefaultConfig - возвращает конфигурацию с заполненными значениями по умолчанию
func NewDefaultConfig() config.AppConfig {
    return config.AppConfig{
        Database: config.DatabaseConfig{
            Host:    "localhost", // Значение по умолчанию
            Port:    5432,
            SSLMode: "disable",
        },
        HTTP: config.HTTPConfig{
            Host:         "0.0.0.0",
            Port:         8080,
            ReadTimeout:  10,
            WriteTimeout: 10,
        },
        Logging: config.LoggingConfig{
            Level: "info",
            JSON:  true,
        },
    }
}
```

```go
// Файл env/loader.go

package env

import (
    "os"
    "strconv"

    "github.com/your-org/shared-config/config"
    "github.com/your-org/shared-config/defaults"
)

// LoadConfigFromEnv - загружает конфигурацию из переменных окружения
func LoadConfigFromEnv() (config.AppConfig, error) {
    // Смотрите, сначала берем значения по умолчанию
    cfg := defaults.NewDefaultConfig()

    // Здесь я показываю пример переопределения значений из env
    if v := os.Getenv("DB_HOST"); v != "" {
        cfg.Database.Host = v
    }

    if v := os.Getenv("DB_PORT"); v != "" {
        port, err := strconv.Atoi(v)
        if err != nil {
            return cfg, err // Возвращаем ошибку, если порт некорректный
        }
        cfg.Database.Port = port
    }

    if v := os.Getenv("DB_USER"); v != "" {
        cfg.Database.User = v
    }

    if v := os.Getenv("DB_PASSWORD"); v != "" {
        cfg.Database.Password = v
    }

    if v := os.Getenv("DB_NAME"); v != "" {
        cfg.Database.Name = v
    }

    if v := os.Getenv("HTTP_PORT"); v != "" {
        port, err := strconv.Atoi(v)
        if err != nil {
            return cfg, err
        }
        cfg.HTTP.Port = port
    }

    if v := os.Getenv("LOG_LEVEL"); v != "" {
        cfg.Logging.Level = v
    }

    if v := os.Getenv("LOG_JSON"); v != "" {
        // Любое ненулевое значение будем трактовать как true
        cfg.Logging.JSON = v == "1" || v == "true"
    }

    return cfg, nil
}
```

Такой подход позволяет:

- централизованно объявить структуру конфигурации;
- использовать одни и те же имена переменных окружения во всех сервисах;
- переиспользовать один и тот же код загрузки и валидации.

В каждом сервисе вы просто подключаете библиотеку и пишете:

```go
// main.go в микросервисе

package main

import (
    "log"

    "github.com/your-org/shared-config/env"
)

func main() {
    // Давайте загрузим конфигурацию через shared-config
    cfg, err := env.LoadConfigFromEnv()
    if err != nil {
        log.Fatalf("failed to load config: %v", err) // Завершаем, если конфиг не удалось загрузить
    }

    // Теперь вы можете использовать cfg.Database, cfg.HTTP, cfg.Logging
    // для инициализации подключения к БД, поднятия HTTP сервера и настройки логгера
}
```

### Подход 2. Централизованный конфигурационный сервис

Другой распространенный вариант — выделить отдельный конфигурационный сервис (конфиг-сервер), в котором хранится и откуда раздается конфигурация.

Это может быть:

- Consul;
- etcd;
- Spring Cloud Config;
- свой самописный сервис.

Shared-config в этом случае:

- определяет схему конфигурации (какие ключи, какие типы);
- реализует клиент к конфиг-серверу;
- обеспечивает кеширование, обновление и валидацию значений.

Смотрите, пример клиентской библиотеки:

```go
// Файл client/client.go

package client

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "github.com/your-org/shared-config/config"
)

// Client - клиент для запроса конфигурации с конфиг-сервера
type Client struct {
    baseURL string        // Базовый URL конфиг-сервера
    client  *http.Client  // HTTP клиент с таймаутами
}

// NewClient - конструктор клиента
func NewClient(baseURL string) *Client {
    return &Client{
        baseURL: baseURL,
        client: &http.Client{
            Timeout: 5 * time.Second, // Таймаут на запрос конфигурации
        },
    }
}

// FetchConfig - запрашивает конфигурацию по имени сервиса и окружению
func (c *Client) FetchConfig(serviceName, env string) (config.AppConfig, error) {
    var cfg config.AppConfig

    // Формируем URL запроса, например /config?service=payments&env=prod
    url := fmt.Sprintf("%s/config?service=%s&env=%s", c.baseURL, serviceName, env)

    resp, err := c.client.Get(url)
    if err != nil {
        return cfg, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return cfg, fmt.Errorf("unexpected status code %d", resp.StatusCode)
    }

    // Давайте распарсим JSON в общую структуру конфигурации
    if err := json.NewDecoder(resp.Body).Decode(&cfg); err != nil {
        return cfg, err
    }

    return cfg, nil
}
```

В сервисе:

```go
// main.go

package main

import (
    "log"
    "os"

    "github.com/your-org/shared-config/client"
)

func main() {
    // Читаем базовый URL конфиг-сервера из переменной окружения
    configURL := os.Getenv("CONFIG_SERVER_URL")

    // Создаем клиент shared-конфигурации
    c := client.NewClient(configURL)

    // Запрашиваем конфигурацию для текущего сервиса и окружения
    cfg, err := c.FetchConfig("payments-service", "prod")
    if err != nil {
        log.Fatalf("failed to fetch config: %v", err)
    }

    // Теперь используем cfg как обычную конфигурацию
}
```

Здесь shared-config формализует:

- формат и структуру данных;
- способ получения;
- возможные поля и значения по умолчанию.

### Подход 3. Общие файлы конфигурации и include

Еще один вариант — использовать общие конфиг-файлы, которые потом "подключаются" в конфиги каждого сервиса. Например:

- общий `base.yaml` с блоками `database`, `logging`, `metrics`;
- сервисный `service-a.yaml`, который делает include `base.yaml` и переопределяет нужные значения.

Пример:

```yaml
# base.yaml
database:
  host: db.internal
  port: 5432
  sslmode: require

logging:
  level: info
  json: true
```

```yaml
# service-a.yaml
include: base.yaml

http:
  port: 8081

logging:
  level: debug
```

В таком подходе shared-config — это:

- формат и структура базового файла;
- соглашения по именам секций;
- общий парсер/лоадер, умеющий обрабатывать include.

Смотрите, это подходит, если у вас уже сложилась сильная практика конфигов в виде файлов и есть инструменты деплоя, умеющие с ними работать (Ansible, Helm, Kustomize и т.д.).


## Что включать в shared-config, а что — нет

### Хорошие кандидаты для shared-config

Обычно в shared конфигурацию выносится:

- Инфраструктурные настройки:
  - параметры подключения к БД;
  - настройки брокера сообщений;
  - пути к общим внешним API;
  - настройки кешей.
- Нефункциональные параметры:
  - логирование (формат, уровень по умолчанию, пути файлов логов);
  - метрики и трейсинг (endpoints, включение/выключение);
  - общие таймауты и ретраи.
- Единые идентификаторы:
  - префиксы для очередей;
  - префиксы для ключей в Redis;
  - имена топиков в Kafka.

Хороший ориентир — все, что:

- совпадает минимум у двух сервисов;
- может меняться централизованно;
- критично для согласованности работы сервисов.

### Что не стоит класть в shared-config

Не стоит выносить в общий конфиг:

- чисто бизнес-логику конкретного сервиса:
  - специфичные флаги включения/выключения фич;
  - частные лимиты и ограничения, которые не используются другими.
- Сверхдетализированные настройки, сильно отличающиеся по смыслам в разных командах.
- Конфигурацию, которая часто меняется только у одного сервиса.

Если добавить туда все подряд, shared-config превратится в "конфигурационный монолит", который будут бояться изменять, потому что любое изменение касается сразу всех.


## Организация версионирования shared-config

### Версионирование библиотеки shared-config

Когда shared-config оформлен как библиотека, ключевая задача — не ломать потребителей.

Здесь у вас два основных правила:

1. Любое несовместимое изменение — новая major-версия.
2. При добавлении новых полей нужно сохранять обратную совместимость.

Пример эволюции:

```go
// v1.0.0
type DatabaseConfig struct {
    Host string
    Port int
    User string
    Password string
    Name string
}
```

```go
// v1.1.0
type DatabaseConfig struct {
    Host    string
    Port    int
    User    string
    Password string
    Name     string
    SSLMode  string // Добавили новое поле - это безопасно, если задать дефолт
}
```

Здесь можно:

- добавить поле;
- задать для него значение по умолчанию в лоадере;
- не ломать существующие сервисы.

Если же вы, например, переименуете поле или измените его тип, то вам нужно:

- выпустить новую major-версию (например, v2);
- дать время сервисам мигрировать.

### Версионирование при конфиг-сервисе

Если вы используете конфиг-сервер, нужно:

- держать в shared-config версию схемы (schema version);
- на стороне сервиса указывать, с какой схемой он работает.

Базовый вариант:

- в структуре `AppConfig` есть поле `Version`;
- сервис запрашивает конфиг с нужной версией;
- если версия не совпадает, он может либо падать, либо включать режим деградации.

Идея простая: вы не обновляете схему мгновенно для всех, а даете каждому сервису перейти самостоятельно, сохраняя совместимость.


## Общие паттерны использования shared-config

### Паттерн 1. Layered config — слои конфигурации

Обычно вы комбинируете несколько источников:

1. Значения по умолчанию в shared-config.
2. Общий для всех сервисов конфиг (например, от конфиг-сервера или файла).
3. Переменные окружения/локальные файлы конкретного сервиса.
4. Параметры запуска (flags).

Давайте посмотрим на пример:

```go
// loader/loader.go

package loader

import (
    "flag"

    "github.com/your-org/shared-config/config"
    "github.com/your-org/shared-config/defaults"
    "github.com/your-org/shared-config/env"
    "github.com/your-org/shared-config/client"
)

// LoadAppConfig - комбинирует несколько источников конфигурации
func LoadAppConfig() (config.AppConfig, error) {
    // 1. Базовые значения по умолчанию
    cfg := defaults.NewDefaultConfig()

    // 2. Общий конфиг с конфиг-сервера (если задан)
    configServerURL := env.GetEnvOrDefault("CONFIG_SERVER_URL", "")
    serviceName := env.GetEnvOrDefault("SERVICE_NAME", "unknown")
    envName := env.GetEnvOrDefault("ENV_NAME", "local")

    if configServerURL != "" {
        c := client.NewClient(configServerURL)
        remoteCfg, err := c.FetchConfig(serviceName, envName)
        if err != nil {
            // Здесь можно залогировать ошибку и продолжить с локальными значениями
        } else {
            // Обновляем cfg значениями из remoteCfg
            // Например, можно реализовать функцию merge
            cfg = mergeConfigs(cfg, remoteCfg)
        }
    }

    // 3. Переопределения из переменных окружения
    cfg, err := env.OverrideFromEnv(cfg)
    if err != nil {
        return cfg, err
    }

    // 4. Переопределения из флагов командной строки
    httpPort := flag.Int("http-port", 0, "override HTTP port")
    flag.Parse()

    if *httpPort != 0 {
        cfg.HTTP.Port = *httpPort
    }

    return cfg, nil
}
```

```go
// env/helpers.go

package env

import "os"

// GetEnvOrDefault - хелпер для чтения переменной окружения с дефолтом
func GetEnvOrDefault(key, def string) string {
    v := os.Getenv(key)
    if v == "" {
        return def
    }
    return v
}
```

```go
// merge.go

package loader

import "github.com/your-org/shared-config/config"

// mergeConfigs - пример простой слияния конфигураций
func mergeConfigs(base, override config.AppConfig) config.AppConfig {
    // Здесь мы вручную прописываем логику - какое значение брать, если оно задано
    if override.Database.Host != "" {
        base.Database.Host = override.Database.Host
    }
    if override.Database.Port != 0 {
        base.Database.Port = override.Database.Port
    }

    // Аналогично для других полей...

    return base
}
```

Смотрите, слоистый подход дает гибкость: вы можете иметь общие значения, но при этом локально переопределять их для конкретного сервиса или окружения.


### Паттерн 2. Central validation — общая валидация конфигурации

Shared-config — удобное место для централизованной проверки корректности параметров:

- проверка обязательных полей;
- проверка диапазонов (таймауты, порты, размеры пулов);
- проверка форматов (URL, e-mail, уровни логов).

Пример:

```go
// validator/validator.go

package validator

import (
    "errors"
    "fmt"

    "github.com/your-org/shared-config/config"
)

// ValidateConfig - проверяет конфигурацию на корректность
func ValidateConfig(cfg config.AppConfig) error {
    // Проверяем, что порт базы данных в разумном диапазоне
    if cfg.Database.Port <= 0 || cfg.Database.Port > 65535 {
        return fmt.Errorf("invalid database port %d", cfg.Database.Port)
    }

    // Проверяем уровень логирования
    switch cfg.Logging.Level {
    case "debug", "info", "warn", "error":
        // Все хорошо
    default:
        return fmt.Errorf("invalid log level %s", cfg.Logging.Level)
    }

    // Проверяем базовые обязательные поля
    if cfg.Database.Host == "" {
        return errors.New("database host is required")
    }

    if cfg.Database.User == "" {
        return errors.New("database user is required")
    }

    // Здесь можно добавить дополнительные проверки

    return nil
}
```

В сервисе:

```go
// main.go

package main

import (
    "log"

    "github.com/your-org/shared-config/loader"
    "github.com/your-org/shared-config/validator"
)

func main() {
    cfg, err := loader.LoadAppConfig()
    if err != nil {
        log.Fatalf("failed to load config: %v", err)
    }

    // Обратите внимание, мы валидируем конфиг до запуска приложения
    if err := validator.ValidateConfig(cfg); err != nil {
        log.Fatalf("invalid config: %v", err)
    }

    // Дальше запускаем приложение с гарантией, что конфиг корректен
}
```

Преимущество: все сервисы используют одну и ту же логику проверки, и вы не дублируете код в каждом из них.


### Паттерн 3. Typed access — типобезопасный доступ к настройкам

Shared-config позволяет задать типы для конфигурационных параметров и тем самым избежать ошибок, связанных с:

- преобразованием типов (строка -> число, строка -> bool и т.д.);
- опечатками в ключах.

Вы уже видели это в примерах структур `DatabaseConfig`, `HTTPConfig`, `LoggingConfig`. Вместо того чтобы каждый раз читать `os.Getenv("DB_PORT")` и вручную преобразовывать, вы:

- один раз описываете, что `Port` — это `int`;
- один раз пишете функцию преобразования;
- дальше используете уже типизированные поля.


## Практический пример: от нуля до рабочего shared-config

Давайте соберем все вместе и посмотрим на практический сценарий. Представим, что у вас есть три сервиса:

- `auth-service`;
- `payments-service`;
- `orders-service`.

Все они:

- ходят в одну PostgreSQL базу (но с разными схемами);
- логируют в одинаковом формате;
- отдают HTTP API.

### Шаг 1. Проектируем общую структуру конфигурации

```go
// config/app.go

package config

// AppConfig - общая конфигурация любого сервиса
type AppConfig struct {
    Service ServiceConfig  // Общие сервисные параметры
    HTTP    HTTPConfig     // HTTP сервер
    Database DatabaseConfig // База данных
    Logging LoggingConfig  // Логи
}

// ServiceConfig - общие настройки сервиса
type ServiceConfig struct {
    Name string // Имя сервиса например auth-service
    Env  string // Окружение - dev stage prod
}
```

### Шаг 2. Значения по умолчанию

```go
// defaults/defaults.go

package defaults

import "github.com/your-org/shared-config/config"

func NewDefaultConfig(serviceName, env string) config.AppConfig {
    return config.AppConfig{
        Service: config.ServiceConfig{
            Name: serviceName,
            Env:  env,
        },
        HTTP: config.HTTPConfig{
            Host:         "0.0.0.0",
            Port:         8080,
            ReadTimeout:  10,
            WriteTimeout: 10,
        },
        Database: config.DatabaseConfig{
            Host:    "postgres",
            Port:    5432,
            SSLMode: "disable",
        },
        Logging: config.LoggingConfig{
            Level: "info",
            JSON:  true,
        },
    }
}
```

### Шаг 3. Лоадер из env для всех сервисов

```go
// env/loader.go

package env

import (
    "os"
    "strconv"

    "github.com/your-org/shared-config/config"
)

// LoadFromEnv - переопределяет значения в конфиге из env
func LoadFromEnv(cfg config.AppConfig) (config.AppConfig, error) {
    // Давайте проходим по каждому полю и смотрим есть ли переменная окружения

    if v := os.Getenv("HTTP_PORT"); v != "" {
        port, err := strconv.Atoi(v)
        if err != nil {
            return cfg, err
        }
        cfg.HTTP.Port = port
    }

    if v := os.Getenv("DB_HOST"); v != "" {
        cfg.Database.Host = v
    }

    if v := os.Getenv("DB_PORT"); v != "" {
        port, err := strconv.Atoi(v)
        if err != nil {
            return cfg, err
        }
        cfg.Database.Port = port
    }

    if v := os.Getenv("DB_USER"); v != "" {
        cfg.Database.User = v
    }

    if v := os.Getenv("DB_PASSWORD"); v != "" {
        cfg.Database.Password = v
    }

    if v := os.Getenv("DB_NAME"); v != "" {
        cfg.Database.Name = v
    }

    if v := os.Getenv("LOG_LEVEL"); v != "" {
        cfg.Logging.Level = v
    }

    if v := os.Getenv("LOG_JSON"); v != "" {
        cfg.Logging.JSON = v == "1" || v == "true"
    }

    if v := os.Getenv("SERVICE_ENV"); v != "" {
        cfg.Service.Env = v
    }

    return cfg, nil
}
```

### Шаг 4. Общая функция инициализации конфигурации в сервисе

В каждом сервисе вы пишете минимальный код:

```go
// internal/config/config.go в каждом сервисе

package config

import (
    "github.com/your-org/shared-config/defaults"
    sharedEnv "github.com/your-org/shared-config/env"
    "github.com/your-org/shared-config/validator"
)

// InitConfig - инициализация конфигурации для конкретного сервиса
func InitConfig(serviceName, env string) (config.AppConfig, error) {
    // 1. Базовые значения по умолчанию
    cfg := defaults.NewDefaultConfig(serviceName, env)

    // 2. Переопределяем из env
    var err error
    cfg, err = sharedEnv.LoadFromEnv(cfg)
    if err != nil {
        return cfg, err
    }

    // 3. Валидируем конфигурацию
    if err := validator.ValidateConfig(cfg); err != nil {
        return cfg, err
    }

    return cfg, nil
}
```

```go
// main.go auth-service

package main

import (
    "log"
    "os"

    sharedConfig "github.com/your-org/shared-config/config"
    "github.com/your-org/auth-service/internal/config"
)

func main() {
    env := os.Getenv("SERVICE_ENV")
    if env == "" {
        env = "dev" // Значение по умолчанию, если не задано окружение
    }

    // Покажу вам, как мы инициализируем конфигурацию для auth-service
    cfg, err := config.InitConfig("auth-service", env)
    if err != nil {
        log.Fatalf("failed to init config: %v", err)
    }

    // Теперь cfg - это тип sharedConfig.AppConfig
    // Здесь вы поднимаете HTTP сервер, подключаетесь к БД и т.д.
    _ = cfg // Используйте cfg для инициализации компонентов
}
```

Преимущество такого подхода: вы один раз описали структуру и поведение конфигурации, и все сервисы живут по этим правилам. Добавление нового сервиса — это в основном подключение shared-config и определение специфичных для него частей (например, дополнительных блоков).



## Типичные ошибки при внедрении shared-config

### Слишком большой и "знающий все" shared-config

Частая ситуация: в shared-config начинают добавлять все настройки подряд, включая очень специфичные и временные. В итоге:

- любое изменение требует консультации со всеми командами;
- библиотека превращается в точку "общей боли";
- люди боятся обновлять версию зависимости.

Чтобы этого избежать:

- Держите shared-config фокусно: только действительно общие настройки.
- Вводите правило "минимально необходимого набора" — сначала докажите, что параметр нужен хотя бы двум сервисам.
- Разделяйте модули внутри shared-config (например, ядро и расширения).

### Жесткая связь между shared-config и сервисами

Еще одна проблема — когда shared-config начинает влиять на жизненный цикл сервисов слишком сильно:

- сервисы не могут стартовать без конфиг-сервера;
- любое изменение схемы ломает половину продакшена.

Чтобы смягчить это:

- делайте конфиг-сервер опциональным (фоллбек к локальным значениям);
- поддерживайте backward compatibility;
- тестируйте новые версии shared-config в отдельных окружениях и с отдельными сервисами.

### Отсутствие прозрачности в том, откуда пришло значение

Иногда разработчик не понимает, почему параметр имеет именно такое значение: оно могло прийти из дефолта, из env, из удаленного конфига или быть переопределено флагом. Это затрудняет отладку.

Здесь помогает:

- логирование источника значений при старте сервиса;
- возможность вывести полный "эффективный" конфиг (effective config) в лог;
- четкая документация по приоритетам (что переопределяет что).


## Краткие рекомендации по дизайну shared-config

### Делайте конфиг читаемым и предсказуемым

- Имена полей и переменных окружения должны быть понятными и стабильными.
- Структуры должны быть логично сгруппированы (HTTP, DB, Logging, Metrics).

### Не храните в shared-config чувствительные данные в открытом виде

- Пароли, токены и ключи шифрования лучше хранить в отдельном секрете (secret store).
- В shared-config описывайте только:
  - имена секретов;
  - способы их получения;
  - схему (что именно ожидается).

### Разделяйте окружения, но не дублируйте логику

- Конфиги для dev/stage/prod могут отличаться по значениям, но схема должна быть одной.
- Shared-config как раз отвечает за схему и общие правила, а не за конкретные значения для каждого окружения.


Теперь давайте завершим логическую часть статьи и перейдем к вопросам, с которыми часто сталкиваются разработчики.


Shared-config — это не просто "общий файл с настройками", а полноценный архитектурный элемент, который:

- упрощает поддержку множества сервисов;
- задает единые стандарты и практики;
- позволяет централизованно управлять инфраструктурными параметрами.

Главное при его проектировании:

- не превращать shared-config в свалку всех возможных настроек;
- заботиться об обратной совместимости;
- четко разделять общие и сервис-специфичные параметры;
- использовать слоистый подход к источникам конфигурации.

Когда вы строите shared-config как библиотеку или как конфиг-сервис, смотрите не только на удобство текущего использования, но и на эволюцию. Конфигурация будет меняться, и важно заложить механизмы, которые позволят этим изменениям происходить безопасно и предсказуемо.



## Частозадаваемые технические вопросы

### Как обрабатывать динамические изменения конфигурации без рестарта сервиса

Если вам нужно менять конфиг "на лету", добавьте в shared-config:

- абстракцию "наблюдаемой конфигурации" (watcher);
- механизм подписки на обновления.

Пример шагов:

1. В конфиг-клиенте (который ходит в конфиг-сервис) реализуйте долгоживущий запрос (long polling, SSE или gRPC stream), который уведомляет о новых версиях.
2. Внутри сервиса храните текущий конфиг в потокобезопасной структуре (например, `atomic.Value` в Go).
3. При обновлении:
   - валидируйте новый конфиг;
   - если он корректен, атомарно подменяйте текущий.
4. Компоненты (HTTP сервер, клиенты БД и т.д.) должны уметь читать актуальный конфиг из этой структуры или иметь перезапуск/реинициализацию при смене параметров.

### Как добавить новый параметр в shared-config так, чтобы не сломать старые сервисы

Рекомендуемая последовательность:

1. Добавьте поле в общую структуру конфигурации.
2. Задайте для него значение по умолчанию в модуле `defaults`.
3. Добавьте поддержку чтения этого поля в лоадеры (env, конфиг-сервис), но сделайте его опциональным.
4. Валидацию делайте мягкой: если поле не задано, используйте дефолт.
5. Постепенно обновите сервисы, начав использовать новый параметр.

Так вы сохраните обратную совместимость и избежите массовых падений.

### Как разделить общую и сервис-специфичную конфигурацию в коде

Схема может быть такой:

- В shared-config определяете `BaseConfig` или `AppConfig` c общими полями.
- В сервисе определяете свою структуру:

  ```go
  type ServiceConfig struct {
      Shared sharedconfig.AppConfig // Общая часть
      FeatureFlags FeatureFlagsConfig // Специфичная часть
  }
  ```

- Для загрузки:
  - сначала инициализируете `sharedconfig.AppConfig` через общие функции;
  - затем загружаете сервисные настройки локально (из env/файла).
- Таким образом, общий код не "знает" про бизнес-логику сервиса, а сервис может использовать все преимущества shared-config.

### Как тестировать изменения в shared-config перед раскаткой на все сервисы

Практичный подход:

1. В shared-config добавьте возможность задавать "профиль" или "target service".
2. Напишите интеграционные тесты в отдельных сервисах, которые:
   - поднимают тестовую конфигурацию (локальный конфиг-сервер или фиктивные env);
   - проверяют старт сервиса и базовые сценарии.
3. Перед релизом новой версии shared-config:
   - прогоняйте эти тесты для критичных сервисов;
   - публикуйте версию сначала в отдельное тестовое окружение;
   - обновляйте зависимости поэтапно (канареечный подход: 1–2 сервиса, затем остальные).

### Как безопасно работать с секретами через shared-config

Безопасный вариант:

1. В shared-config храните только:
   - имена секретов (например, `DB_PASSWORD_SECRET_NAME`);
   - тип хранилища (Vault, KMS, Secret Manager).
2. Реализуйте в shared-config абстракцию `SecretProvider`:
   - интерфейс с методами `GetSecret(name string) (string, error)`;
   - реализации под конкретные хранилища.
3. В конфиг-лоадере:
   - после загрузки основных параметров разрешайте секреты через `SecretProvider`;
   - не логируйте значения секретов;
   - строго валидируйте наличие и формат ключевых секретов.
4. Так вы разделите:
   - схему и место секрета (shared-config);
   - реальное хранение и доступ к нему (секрет-хранилище).