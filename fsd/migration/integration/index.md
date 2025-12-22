---
metaTitle: Интеграция с существующим проектом integration в Go
metaDescription: Подробное руководство по интеграции нового модуля integration с существующим проектом на Go - варианты встраивания настройка архитектуры примеры кода и типичные ошибки
author: Олег Марков
title: Интеграция с существующим проектом integration в Go
preview: Узнайте как безболезненно встроить модуль integration в существующий Go проект - от анализа архитектуры до пошаговых примеров и стратегий миграции кода
---

## Введение

Когда вы добавляете новый модуль или внешний сервис в уже работающий проект, главная задача — не сломать то, что уже есть, и при этом получить пользу от новой функциональности. Интеграция с существующим проектом (далее будем называть модуль условно integration) почти всегда связана с рисками: совместимость, зависимостями, архитектурой, производительностью.

Здесь я покажу вам, как подойти к интеграции системно: с чего начать, как проанализировать текущий код, где разместить integration, как организовать границы, какие шаблоны и подходы применить и как постепенно включить новый функционал, не останавливая разработку.

Будем ориентироваться на Go-проект, но большинство принципов легко переносится и на другие языки.

---

## Подход к интеграции с уже существующим проектом

### Анализ текущей архитектуры

Прежде чем подключать integration, важно понять, в какой архитектурный слой он логически попадает.

Чаще всего модули можно отнести к одной из зон:

- интеграция с внешним API (payment, CRM, messaging);
- инфраструктурные слои (логирование, мониторинг, кэш, очереди);
- бизнес-расширения (новые кейсы поверх существующего домена).

Чтобы не запутаться, двигайтесь по шагам.

#### Шаг 1. Карта модулей и зависимостей

Сначала разберитесь, как сейчас устроен проект:

1. Какие пакеты есть в `./internal` или `./pkg`.
2. Где лежит доменная логика (обычно `internal/domain`, `internal/service`).
3. Где хранится инфраструктура (`internal/infra`, `internal/adapters`, `internal/platform`).

Схематично это может выглядеть так:

- `cmd/app` — точка входа;
- `internal/domain` — бизнес-сущности и интерфейсы;
- `internal/service` — бизнес-кейсы (use cases);
- `internal/infra` — базы данных, внешние API, брокеры;
- `internal/transport` — HTTP, gRPC, CLI.

Модуль integration обычно попадает в `internal/infra` или `internal/adapters`, а общаться с ним бизнес-логика должна через интерфейсы из domain/service.

#### Шаг 2. Определение цели интеграции

Чётко сформулируйте, зачем вы добавляете integration. Это звучит банально, но сильно влияет на архитектуру.

Пример формулировок:

- отправка событий в внешнюю аналитическую систему;
- добавление альтернативного платежного провайдера;
- подключение нового сервиса нотификаций.

Цель определяет:

- точки в коде, где будет вызываться integration;
- тип контракта (синхронный/асинхронный, критичный/некритичный);
- требования к отказоустойчивости.

---

## Размещение и структура модуля integration в проекте

### Где физически разместить код integration

Один из понятных вариантов структуры:

- `internal/integration` — общий пакет-обёртка над всеми интеграциями;
  - `internal/integration/crm`
  - `internal/integration/payments`
  - `internal/integration/analytics`

Если у вас один крупный модуль integration, логично сделать:

- `internal/integration` — реализация клиента;
- `internal/integration/config.go` — конфигурация;
- `internal/integration/types.go` — DTO и маппинги;
- `internal/integration/client.go` — интерфейс и реализации.

Смотрите, я покажу вам простой пример:

```go
// internal/integration/client.go

package integration

// Client описывает поведение нашего модуля integration.
// Он не знает ничего о доменной модели, только о данных,
// которые ему нужны для работы.
type Client interface {
	// SendEvent отправляет событие во внешний сервис integration.
	// Возвращает ошибку, если передать событие не удалось.
	SendEvent(event Event) error
}
```

```go
// internal/integration/http_client.go

package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"time"
)

// HTTPClient реализует Client через HTTP API внешнего сервиса.
type HTTPClient struct {
	baseURL    string
	httpClient *http.Client
	apiKey     string
}

// NewHTTPClient создаёт новый HTTP-клиент для интеграции.
func NewHTTPClient(baseURL, apiKey string, timeout time.Duration) *HTTPClient {
	return &HTTPClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: timeout, // Здесь мы задаём таймаут для всех запросов
		},
	}
}

// SendEvent реализует отправку события через HTTP.
func (c *HTTPClient) SendEvent(ctx context.Context, event Event) error {
	// Сериализуем событие в JSON
	body, err := json.Marshal(event)
	if err != nil {
		return err
	}

	// Формируем HTTP-запрос
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/events", bytes.NewReader(body))
	if err != nil {
		return err
	}

	// Добавляем заголовок авторизации
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	// Выполняем запрос
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Проверяем код ответа
	if resp.StatusCode >= 400 {
		// Здесь можно добавить чтение тела и логирование
		return ErrUnexpectedStatusCode
	}

	return nil
}
```

```go
// internal/integration/types.go

package integration

import "errors"

// Event представляет то, что мы отправляем в сервис integration.
// Обычно это DTO, адаптированное под внешний контракт.
type Event struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Timestamp int64  `json:"timestamp"`
	UserID    string `json:"user_id"`
	Payload   any    `json:"payload"`
}

// ErrUnexpectedStatusCode показывает, что внешний сервис вернул неожиданный статус.
var ErrUnexpectedStatusCode = errors.New("integration service returned unexpected status code")
```

Обратите внимание: мы использовали контекст в методе `SendEvent` и отдельно вывели DTO `Event`. Так проще тестировать и подменять реализацию.

---

## Связывание integration с бизнес-логикой

### Принцип зависимостей

Лучше, если доменная логика зависит от абстракций, а не от конкретной реализации integration. Это уменьшает связанность.

Подход:

1. В пакете `domain` или `service` объявляете интерфейс, описывающий то, что нужно бизнес-логике.
2. Пакет integration реализует этот интерфейс.
3. В main или слое композиции вы "связываете" реализацию и интерфейс.

Давайте разберёмся на примере.

```go
// internal/domain/integration_port.go

package domain

import "context"

// IntegrationPort описывает то, что домен ожидает от внешней интеграции.
type IntegrationPort interface {
	// PublishUserCreatedEvent публикует событие о создании пользователя.
	PublishUserCreatedEvent(ctx context.Context, user User) error
}
```

```go
// internal/service/user_service.go

package service

import (
	"context"

	"myapp/internal/domain"
)

// UserService содержит бизнес-логику работы с пользователями.
type UserService struct {
	repo        domain.UserRepository
	integration domain.IntegrationPort
}

// NewUserService создает новый сервис пользователей.
func NewUserService(repo domain.UserRepository, integration domain.IntegrationPort) *UserService {
	return &UserService{
		repo:        repo,
		integration: integration,
	}
}

// CreateUser создаёт пользователя и отправляет событие в integration.
func (s *UserService) CreateUser(ctx context.Context, req CreateUserRequest) (*domain.User, error) {
	// Сначала создаём пользователя в репозитории (например, в БД)
	user, err := s.repo.Create(ctx, req.ToUser())
	if err != nil {
		return nil, err
	}

	// Затем публикуем событие во внешний сервис
	// Обратите внимание - бизнес-логика не знает о деталях внешнего API.
	if err := s.integration.PublishUserCreatedEvent(ctx, *user); err != nil {
		// Здесь можно решить - критическая ли это ошибка
		// В некоторых случаях она логируется, но не прерывает основную операцию.
		return nil, err
	}

	return user, nil
}
```

```go
// internal/integration/user_adapter.go

package integration

import (
	"context"

	"myapp/internal/domain"
)

// UserAdapter адаптирует доменный порт IntegrationPort к конкретному клиенту.
type UserAdapter struct {
	client Client // наш конкретный integration-клиент
}

// NewUserAdapter создаёт адаптер вокруг клиента.
func NewUserAdapter(client Client) *UserAdapter {
	return &UserAdapter{
		client: client,
	}
}

// PublishUserCreatedEvent реализует порт domain.IntegrationPort.
func (a *UserAdapter) PublishUserCreatedEvent(ctx context.Context, user domain.User) error {
	// Преобразуем доменную сущность к DTO, который понимает внешний сервис.
	event := Event{
		ID:        user.ID,
		Type:      "user_created",
		Timestamp: user.CreatedAt.Unix(),
		UserID:    user.ID,
		Payload: map[string]any{
			"email": user.Email,
			"name":  user.Name,
		},
	}

	// Отправляем событие через клиента.
	return a.client.SendEvent(ctx, event)
}
```

Таким образом, домен зависит только от `IntegrationPort`, а конкретная реализация и детали HTTP, ключей и форматов JSON живут в пакете integration.

---

## Пошаговое подключение integration в существующий код

### 1. Добавление интерфейсов и адаптеров

Если проект уже живёт, максимально безопасный сценарий:

1. Добавить порт (интерфейс) в доменный или сервисный слой.
2. Реализовать интеграцию через адаптер (как выше).
3. На первом шаге внедрить заглушку (mock / no-op), чтобы ничего не сломать.

Пример заглушки:

```go
// internal/integration/noop_adapter.go

package integration

import (
	"context"

	"myapp/internal/domain"
)

// NoopAdapter ничего не делает, но реализует порт.
// Можно использовать на этапе миграции или в тестах.
type NoopAdapter struct{}

// NewNoopAdapter возвращает "пустой" адаптер integration.
func NewNoopAdapter() *NoopAdapter {
	return &NoopAdapter{}
}

// PublishUserCreatedEvent просто возвращает nil, не делая работы.
func (a *NoopAdapter) PublishUserCreatedEvent(ctx context.Context, user domain.User) error {
	return nil
}
```

Сначала вы поднимаете систему с NoopAdapter, убеждаетесь, что всё работает, а затем заменяете на реальный `UserAdapter`.

### 2. Подключение в точке входа (Composition Root)

Теперь вы увидите, как это выглядит в коде точки входа.

```go
// cmd/app/main.go

package main

import (
	"context"
	"log"
	"os"
	"time"

	"myapp/internal/domain"
	"myapp/internal/integration"
	"myapp/internal/service"
)

func main() {
	ctx := context.Background()

	// Загружаем конфигурацию (упрощённо).
	baseURL := os.Getenv("INTEGRATION_URL")
	apiKey := os.Getenv("INTEGRATION_API_KEY")

	// Создаём реализацию клиента integration.
	httpClient := integration.NewHTTPClient(baseURL, apiKey, 5*time.Second)

	// Оборачиваем клиента в доменный адаптер.
	var integrationPort domain.IntegrationPort

	if baseURL == "" || apiKey == "" {
		// Если конфигурации нет - используем Noop для безопасного запуска.
		integrationPort = integration.NewNoopAdapter()
		log.Println("integration disabled - using NoopAdapter")
	} else {
		integrationPort = integration.NewUserAdapter(httpClient)
	}

	// Создаём репозиторий пользователей (опустим реализацию).
	userRepo := newUserRepository()

	// Инициализируем сервис пользователей.
	userService := service.NewUserService(userRepo, integrationPort)

	// Дальше поднимаем HTTP-сервер и передаём туда userService.
	if err := runHTTPServer(ctx, userService); err != nil {
		log.Fatal(err)
	}
}
```

Здесь вы видите, как через переменную `integrationPort` можно прозрачно переключаться между разными реализациями.

---

## Управление конфигурацией и средами

### Конфигурация integration по окружениям

Чаще всего integration ведёт себя по-разному в dev/stage/prod:

- разные URL;
- разные ключи;
- включена/отключена интеграция;
- другие лимиты по тайм-аутам.

Разумно вынести конфигурацию в отдельную структуру.

```go
// internal/integration/config.go

package integration

import "time"

// Config хранит настройки подключения к внешнему сервису.
type Config struct {
	BaseURL   string        // адрес API внешнего сервиса
	APIKey    string        // ключ авторизации
	Timeout   time.Duration // тайм-аут запросов
	Enabled   bool          // флаг включения интеграции
	Env       string        // имя окружения (dev, stage, prod)
	LogErrors bool          // нужно ли логировать ошибки
}
```

Инициализация конфигурации:

```go
// internal/config/config.go

package config

import (
	"os"
	"strconv"
	"time"

	"myapp/internal/integration"
)

// LoadIntegrationConfig загружает конфигурацию модуля integration из переменных окружения.
func LoadIntegrationConfig() integration.Config {
	timeoutStr := os.Getenv("INTEGRATION_TIMEOUT")
	timeout, err := time.ParseDuration(timeoutStr)
	if err != nil || timeout == 0 {
		// Если не удалось распарсить тайм-аут - задаём значение по умолчанию.
		timeout = 5 * time.Second
	}

	enabledStr := os.Getenv("INTEGRATION_ENABLED")
	enabled, err := strconv.ParseBool(enabledStr)
	if err != nil {
		enabled = false
	}

	return integration.Config{
		BaseURL:   os.Getenv("INTEGRATION_URL"),
		APIKey:    os.Getenv("INTEGRATION_API_KEY"),
		Timeout:   timeout,
		Enabled:   enabled,
		Env:       os.Getenv("APP_ENV"),
		LogErrors: true, // можно привязать к отдельной переменной окружения
	}
}
```

В точке входа вы подгружаете эту конфигурацию и решаете, какую реализацию использовать.

---

## Обработка ошибок и устойчивость integration

### Что делать, если внешний сервис недоступен

Интеграция с внешними системами всегда ненадёжна. Важно изначально решить:

- является ли запрос к integration критичной частью бизнес-процесса;
- нужно ли повторять запросы;
- логировать ли каждый сбой.

Смотрите, я покажу вам шаблон, как можно сделать retry и fallback.

```go
// internal/integration/reliable_client.go

package integration

import (
	"context"
	"log"
	"time"
)

// ReliableClient добавляет retry-логику поверх базового клиента.
type ReliableClient struct {
	base      Client
	maxRetries int
	delay      time.Duration
	logErrors  bool
}

// NewReliableClient создаёт клиент с повторными попытками.
func NewReliableClient(base Client, maxRetries int, delay time.Duration, logErrors bool) *ReliableClient {
	return &ReliableClient{
		base:       base,
		maxRetries: maxRetries,
		delay:      delay,
		logErrors:  logErrors,
	}
}

// SendEvent выполняет несколько попыток отправки события.
func (c *ReliableClient) SendEvent(ctx context.Context, event Event) error {
	var lastErr error

	for i := 0; i <= c.maxRetries; i++ {
		// Пытаемся отправить событие
		err := c.base.SendEvent(ctx, event)
		if err == nil {
			// Успех - выходим из функции
			return nil
		}

		lastErr = err

		if c.logErrors {
			log.Printf("integration send failed attempt=%d error=%v\n", i+1, err)
		}

		// Если это последняя попытка - выходим
		if i == c.maxRetries {
			break
		}

		// Ждём перед следующей попыткой
		select {
		case <-ctx.Done():
			// Если контекст отменён - возвращаем ошибку контекста
			return ctx.Err()
		case <-time.After(c.delay):
			// Переходим к следующей попытке
		}
	}

	return lastErr
}
```

Теперь можно комбинировать:

- `HTTPClient` — базовая реализация;
- `ReliableClient` — надстройка с retry;
- `UserAdapter` — адаптер для домена.

---

## Пошаговая безопасная миграция на integration

### Стратегия "feature toggle"

Чтобы интеграция не мешала основной функциональности, сделайте флаг включения:

1. В конфигурации есть `Enabled`.
2. В коде на уровне сервиса или адаптера вы проверяете этот флаг.

Пример на уровне адаптера:

```go
// internal/integration/toggle_adapter.go

package integration

import (
	"context"

	"myapp/internal/domain"
)

// ToggleAdapter включает или отключает реальную интеграцию.
type ToggleAdapter struct {
	enabled bool
	real    domain.IntegrationPort
}

// NewToggleAdapter создаёт адаптер с возможностью отключения.
func NewToggleAdapter(enabled bool, real domain.IntegrationPort) *ToggleAdapter {
	return &ToggleAdapter{
		enabled: enabled,
		real:    real,
	}
}

// PublishUserCreatedEvent либо вызывает реальную интеграцию, либо ничего не делает.
func (a *ToggleAdapter) PublishUserCreatedEvent(ctx context.Context, user domain.User) error {
	if !a.enabled {
		// Интеграция отключена - просто выходим без ошибок.
		return nil
	}

	// Если включена - делегируем вызов реальной реализации.
	return a.real.PublishUserCreatedEvent(ctx, user)
}
```

Теперь включить integration в production можно просто установив переменную окружения.

### Стратегия "dual write" (двойная запись)

Иногда вам нужно временно писать в старую систему и в новую integration одновременно. В этом случае можно сделать композицию:

```go
// internal/integration/multi_adapter.go

package integration

import (
	"context"

	"myapp/internal/domain"
)

// MultiAdapter вызывает несколько реализаций порта сразу.
type MultiAdapter struct {
	ports []domain.IntegrationPort
}

// NewMultiAdapter создаёт адаптер, который вызывает все переданные порты.
func NewMultiAdapter(ports ...domain.IntegrationPort) *MultiAdapter {
	return &MultiAdapter{
		ports: ports,
	}
}

// PublishUserCreatedEvent по очереди вызывает каждый порт.
func (a *MultiAdapter) PublishUserCreatedEvent(ctx context.Context, user domain.User) error {
	var lastErr error

	for _, p := range a.ports {
		if err := p.PublishUserCreatedEvent(ctx, user); err != nil {
			// Сохраняем последнюю ошибку, но продолжаем вызывать остальные порты.
			lastErr = err
		}
	}

	return lastErr
}
```

Так можно, например, параллельно писать события в старую очередь и новый сервис integration до окончания миграции.

---

## Тестирование интеграции в существующем проекте

### Юнит-тесты с подменой integration

Самое важное — не тянуть реальный внешний сервис в юнит-тесты.

Смотрите, я покажу вам, как подменить порт mock-реализацией.

```go
// internal/service/user_service_test.go

package service

import (
	"context"
	"testing"

	"myapp/internal/domain"
)

// fakeIntegrationPort - простая фейковая реализация интеграции для тестов.
type fakeIntegrationPort struct {
	called bool
	user   domain.User
	err    error
}

func (f *fakeIntegrationPort) PublishUserCreatedEvent(ctx context.Context, user domain.User) error {
	// Запоминаем, что метод был вызван и с каким пользователем.
	f.called = true
	f.user = user
	return f.err
}

func TestUserService_CreateUser_PublishesEvent(t *testing.T) {
	ctx := context.Background()

	// Подготавливаем фейковый репозиторий и интеграцию.
	userRepo := newFakeUserRepo()               // здесь может быть in-memory реализация
	integrationPort := &fakeIntegrationPort{}   // наша фейковая интеграция

	// Создаём сервис.
	svc := NewUserService(userRepo, integrationPort)

	// Запускаем тестовый сценарий.
	req := CreateUserRequest{
		Email: "user@example.com",
		Name:  "Test",
	}
	user, err := svc.CreateUser(ctx, req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Проверяем, что интеграция была вызвана.
	if !integrationPort.called {
		t.Fatal("expected integration to be called")
	}

	// Проверяем, что в интеграцию переданы корректные данные.
	if integrationPort.user.ID != user.ID {
		t.Fatalf("expected user ID %s, got %s", user.ID, integrationPort.user.ID)
	}
}
```

Так вы можете прогонять бизнес-логику независимо от реального сервиса integration.

### Контрактные и интеграционные тесты

Для проверки совместимости с внешним API полезны:

- контрактные тесты (проверка формата запросов/ответов);
- интеграционные тесты с поднятым тестовым стендом сервиса integration.

Подход:

- использовать docker-compose для локального поднятия тестовой версии external API;
- хранить тестовые фикстуры JSON;
- в тестах вызывать `HTTPClient` и проверять реальные запросы.

---

## Работа с версиями и обновлениями integration

### Версионирование API integration

Бывает, что внешний сервис меняет API. Чтобы плавно перейти:

1. Внедрите слой абстракции (порт и адаптеры) — вы это уже сделали.
2. Реализуйте новую версию клиента рядом со старой.

Пример:

- `http_client_v1.go`
- `http_client_v2.go`

И обёртка:

```go
// internal/integration/versioned_client.go

package integration

import "context"

// VersionedClient выбирает реализацию по версии API.
type VersionedClient struct {
	v1 Client
	v2 Client
}

// NewVersionedClient создаёт версионированный клиент.
func NewVersionedClient(v1, v2 Client) *VersionedClient {
	return &VersionedClient{
		v1: v1,
		v2: v2,
	}
}

// SendEvent пока делегирует всё во вторую версию.
// При необходимости вы можете выбирать версию динамически.
func (c *VersionedClient) SendEvent(ctx context.Context, event Event) error {
	return c.v2.SendEvent(ctx, event)
}
```

Такая структура позволит вам безопасно переключаться между версиями, не меняя код домена.

---

## Типичные ошибки при интеграции и как их избежать

### Жёсткая связанность домена и integration

Ошибка: доменная логика напрямую использует конкретный клиент integration, импортирует его типы DTO и зависит от HTTP-деталей.

Чем это плохо:

- сложнее тестировать;
- сложнее менять реализацию;
- при изменении внешнего контракта приходится трогать домен.

Как исправить:

- в домене объявить порт-интерфейс;
- в integration сделать адаптер, который реализует этот порт;
- использовать DTO только в пакете integration.

### Логика ретраев разбросана по коду

Иногда разработчики добавляют retry прямо в бизнес-методы. Это делает код сложным и дублирующимся.

Как лучше:

- вынести retry в отдельную обёртку (`ReliableClient`);
- использовать один и тот же механизм для всех интеграций.

### Отсутствие feature toggle

Если вы "жёстко" включаете integration в коде без возможности отключить, каждая проблема внешнего сервиса может привести к аварии.

Решение:

- добавить флаг `Enabled`;
- использовать `ToggleAdapter` или `NoopAdapter` для отключения.

### Отсутствие тайм-аутов и ограничений по ресурсам

Иногда запросы к внешнему сервису выполняются без тайм-аутов или с неочевидными значениями по умолчанию.

Решение:

- всегда задавать явный тайм-аут в HTTP-клиенте;
- передавать `context.Context` в методы integration;
- использовать отдельный `http.Client` для внешних вызовов.

---

Интеграция с существующим проектом требует аккуратности и внимания к границам между доменом и инфраструктурой. Если вы заранее продумываете порты, адаптеры, конфигурацию и стратегию включения, модуль integration становится управляемой и относительно безопасной частью системы, а не "чёрным ящиком", который может сломать всё приложение.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как интегрировать integration в монолит, который не разбит на слои?

1. Выделите хотя бы минимальный "сервисный" слой — функции, которые отвечают за бизнес-операции.
2. Опишите интерфейс порта рядом с этими функциями.
3. Реализацию integration разместите в отдельном пакете (например, `internal/integration`).
4. В точке входа создавайте реализацию и передавайте в функции как параметр.

### Как сделать так, чтобы старый код продолжал работать без изменений?

1. Сначала подключите integration через `NoopAdapter`, который ничего не делает.
2. Протяните его по слоям, не меняя старую логику поведения.
3. Добавляйте вызовы integration в местах, где это безопасно.
4. Включите реальную интеграцию только после того, как убедитесь, что всё стабильно.

### Как интегрировать несколько разных внешних сервисов, не запутавшись?

1. Создайте для каждого сервиса отдельный подкаталог в `internal/integration` (например, `payments`, `crm`).
2. Для каждого сервиса опишите свой порт в домене и адаптер.
3. Для общих механизмов (retry, логирование, метрики) сделайте отдельные вспомогательные пакеты.

### Как избежать дублирования моделей между доменом и integration?

1. Храните доменные сущности в `internal/domain`.
2. В integration создавайте DTO конкретно под внешний контракт.
3. Делайте явные функции-мэпперы, которые преобразуют доменную модель в DTO и обратно.
4. Не импортируйте DTO в домен, используйте их только в адаптерах.

### Как организовать логирование внутри integration, чтобы не засорять логи?

1. В конфигурации заведите уровень детализации логов и флаг `LogErrors`.
2. Логируйте только ошибки и важные события, избегая логирования всего трафика.
3. Для отладки используйте отдельный debug-режим, который можно включить через переменную окружения.
4. Логи протягивайте через интерфейс логгера, а не через глобальный `log`, чтобы можно было менять реализацию.