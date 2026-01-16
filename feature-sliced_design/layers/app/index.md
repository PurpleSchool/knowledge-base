---
metaTitle: Слой app app-layer в архитектуре приложений
metaDescription: Подробное объяснение того как спроектировать и использовать слой app app-layer в многослойной архитектуре приложений - структура ответственность взаимодействие с доменом и инфраструктурой
author: Олег Марков
title: Слой app app-layer - как организовать логику приложения поверх домена
preview: Разбираем что такое слой app app-layer - какие задачи он решает как его проектировать и как он связывает доменную модель с внешним миром
---

## Введение

Слой app, или app‑layer, часто упоминают в контексте многослойной архитектуры, DDD и clean architecture, но формальных определений почти не дают. В итоге у разработчиков возникает путаница: чем он отличается от domain‑слоя, куда складывать бизнес‑логику, где место use‑case и application service.

В этой статье мы разберем, какую роль играет app‑слой, как его спроектировать и как он взаимодействует с остальными частями системы. Я покажу вам примеры структур каталогов, кода application‑сервисов, паттерны обработки запросов и ошибок. Мы будем держать фокус на практическом использовании, но параллельно разберем ключевые теоретические идеи, чтобы вы уверенно ориентировались в терминах.

---

## Что такое слой app и зачем он нужен

### Общее определение

Слой app (application layer) — это уровень приложения, который:

- оркестрирует выполнение use‑case (сценариев использования);
- координирует работу доменной модели и инфраструктуры;
- реализует прикладные правила (application rules), не относящиеся к самой предметной области;
- обеспечивает «границу» между внешним миром (API, UI, очереди) и доменом.

Если попробовать сформулировать коротко, то app‑слой отвечает на вопрос: **что должно сделать приложение в ответ на внешний запрос**, причем так, чтобы:

- доменный слой оставался независимым от технических деталей;
- инфраструктура была легко заменяема;
- бизнес‑правила были выразительными и прозрачно тестируемыми.

### Отличие от других слоев

Давайте разберем на примере типичной архитектуры:

- **Presentation / Interface layer**  
  Контроллеры HTTP, gRPC‑хендлеры, обработчики CLI‑команд, UI. Их задача — принять запрос, провалидировать входные данные и передать их дальше.

- **Application layer (наш app‑слой)**  
  Use‑case, application services, команды и хендлеры команд, фасады. Здесь хранятся сценарии работы приложения: «создать заказ», «подтвердить платеж», «зарегистрировать пользователя».

- **Domain layer**  
  Доменные сущности, value‑объекты, доменные сервисы, доменные события. Здесь вы моделируете предметную область: правила, инварианты, ограничения.

- **Infrastructure layer**  
  Реализации репозиториев, интеграция с БД, брокерами, внешними API, файловой системой, кэшем и так далее.

Смотрите, важный момент: **app‑слой сам по себе не содержит предметных правил**. Он лишь:

- вызывает методы доменных сущностей и доменных сервисов;
- собирает данные из разных источников;
- управляет транзакциями и техническими аспектами вокруг домена.

---

## Роль и ответственность app‑слоя

### Основные функции

Перечислим ключевые обязанности app‑слоя и сразу коротко поясним, что за ними стоит.

1. **Оркестрация use‑case**  
   Один сценарий может включать несколько доменных операций и внешних вызовов. App‑слой определяет порядок действий, ветвление логики, откаты и дополнительную обработку.

2. **Работа с транзакциями**  
   App‑слой часто отвечает за то, чтобы объединить несколько обращений к репозиториям в одну транзакцию.

3. **Маппинг между моделями**  
   Преобразование DTO или команд (из контроллеров, брокеров) в доменные объекты и обратно.

4. **Согласование с кросс‑сервисной логикой**  
   Например, вызов другого микросервиса, публикация интеграционных событий, запуск фоновых задач.

5. **Авторизация и прикладная валидация**  
   Правила вроде «пользователь может редактировать только свои сущности» удобно держать в app‑слое, а не в чистом домене.

6. **Повторное использование сценариев**  
   Один и тот же use‑case может вызываться из разных точек входа: HTTP‑API, CLI, фоновые джобы.

### Чего в app‑слое не должно быть

Важно понимать, что app‑слой — не «помойка для всей логики». Часть идей удобнее пояснить через запреты.

В app‑слое не должно быть:

- SQL‑запросов (кроме явных случаев, когда используете application‑level репозитории, но даже тогда лучше выносить в инфраструктуру);
- кода, завязанного на конкретный фреймворк веб‑сервера;
- логики рендера шаблонов или сериализации JSON (это уровень presentation);
- «тонких оберток» вокруг доменного слоя, которые ничего не делают.

Если вы замечаете, что app‑слой стал просто проксировать вызовы к доменным сервисам без добавочной логики, значит, возможно, избыточно его ввели или не выделили реальные use‑case.

---

## Структура проекта и расположение app‑слоя

### Базовый пример структуры

Давайте посмотрим на условный пример структуры в монолитном Go‑проекте:

```text
/internal
    /app           // app-layer
        /user
            service.go
            commands.go
            query.go
        /order
            service.go
            commands.go
    /domain        // доменная модель
        /user
            entity.go
            service.go
        /order
            entity.go
            service.go
    /infrastructure
        /db
            user_repo_pg.go
            order_repo_pg.go
        /broker
            events_kafka.go
    /interface
        /http
            user_handler.go
            order_handler.go
```

Эта структура показывает:

- каждый bounded context или крупный модуль (user, order) представлен и в domain, и в app;
- app‑слой изолирован в своем пакете, так легче контролировать зависимости;
- interface‑слой (например, HTTP‑хендлеры) «смотрит» в app‑слой, но не в domain и не в infrastructure напрямую.

### Зависимости между слоями

Обратите внимание на направление зависимостей:

- Interface → App → Domain  
- App → абстракции infrastructure (через интерфейсы репозиториев, шины событий и т. п.).

Через такую схему вы добиваетесь:

- тестируемости use‑case за счет моков репозиториев и внешних сервисов;
- устойчивости доменного слоя к изменениям фреймворков и баз данных.

---

## Application service и use‑case

### Что такое application service

Application service — основной строительный блок app‑слоя. Это объект или функция, которая реализует конкретный use‑case. Например:

- RegisterUserService
- PlaceOrderService
- ConfirmPaymentService

В простых случаях это может быть один метод у структуры. В более сложных — отдельные команды и их хендлеры.

Сейчас я покажу вам пример простого application service на Go.

```go
// В пакете app/user

// RegisterUserCommand описывает данные, которые приходят из внешнего мира
type RegisterUserCommand struct {
    Email    string
    Password string
}

// RegisterUserService отвечает за сценарий "зарегистрировать пользователя"
type RegisterUserService struct {
    userRepo UserRepository  // интерфейс репозитория
    hasher   PasswordHasher  // интерфейс для хеширования пароля
}

// UserRepository — интерфейс в app-слое, реализация будет в infrastructure
type UserRepository interface {
    // FindByEmail нужен, чтобы проверить, что пользователь не существует
    FindByEmail(email string) (*User, error)
    // Save сохраняет нового пользователя
    Save(user *User) error
}

// PasswordHasher — об abstraction вокруг конкретного алгоритма
type PasswordHasher interface {
    Hash(password string) (string, error)
}

// Execute выполняет use-case регистрации пользователя
func (s *RegisterUserService) Execute(ctx context.Context, cmd RegisterUserCommand) error {
    // 1. Проверяем, что пользователя с таким email еще нет
    existing, err := s.userRepo.FindByEmail(cmd.Email)
    if err != nil {
        // Обратите внимание: мы не знаем, какая БД за этим стоит
        return fmt.Errorf("check existing user: %w", err)
    }
    if existing != nil {
        return ErrEmailAlreadyRegistered
    }

    // 2. Хешируем пароль
    hashed, err := s.hasher.Hash(cmd.Password)
    if err != nil {
        return fmt.Errorf("hash password: %w", err)
    }

    // 3. Создаем доменную сущность пользователя
    user, err := domain.NewUser(cmd.Email, hashed)
    if err != nil {
        // Внутри домена могут быть дополнительные проверки
        return fmt.Errorf("create user: %w", err)
    }

    // 4. Сохраняем пользователя
    if err := s.userRepo.Save(user); err != nil {
        return fmt.Errorf("save user: %w", err)
    }

    return nil
}
```

Как видите, этот код:

- не знает ни про HTTP, ни про JSON;
- не использует конкретный драйвер БД;
- выстраивает сценарий «зарегистрировать пользователя» шаг за шагом.

### Связь use‑case с контроллером

Теперь вы увидите, как это выглядит в коде контроллера HTTP‑слоя.

```go
// В пакете interface/http/user_handler.go

// UserHandler обрабатывает HTTP-запросы о пользователях
type UserHandler struct {
    registerSvc *app.RegisterUserService
}

// Register обрабатывает POST /users
func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    var req registerUserRequest
    // Здесь мы декодируем JSON из тела запроса
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid body", http.StatusBadRequest)
        return
    }

    // Формируем команду для app-слоя
    cmd := app.RegisterUserCommand{
        Email:    req.Email,
        Password: req.Password,
    }

    // Вызываем use-case
    if err := h.registerSvc.Execute(ctx, cmd); err != nil {
        // Маппим ошибки app-слоя в HTTP-ответы
        if errors.Is(err, app.ErrEmailAlreadyRegistered) {
            http.Error(w, "email already registered", http.StatusConflict)
            return
        }
        http.Error(w, "internal error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
}
```

Смотрите, я разместил этот пример, чтобы было понятно:

- интерфейсный слой отвечает за протокол (HTTP, JSON);
- app‑слой отвечает за сценарий регистрации;
- domain‑слой отвечает за инварианты пользователя (валидный email, пароль и прочее).

---

## Работа app‑слоя с доменом

### Вызов доменных сущностей и сервисов

App‑слой, как мы уже говорили, не должен содержать доменные правила, но он активно вызывает доменные объекты. Обычно это выглядит так:

- получить доменную сущность из репозитория;
- вызвать на ней метод, реализующий доменное правило;
- сохранить изменения.

Давайте разберемся на примере заказа.

```go
// В пакете app/order

// ConfirmOrderCommand описывает входные данные use-case
type ConfirmOrderCommand struct {
    OrderID string
    UserID  string
}

// OrderRepository интерфейс репозитория для заказов
type OrderRepository interface {
    GetByID(id string) (*domain.Order, error)
    Save(order *domain.Order) error
}

// ConfirmOrderService реализует сценарий "подтвердить заказ"
type ConfirmOrderService struct {
    orders OrderRepository
}

// Execute подтверждает заказ
func (s *ConfirmOrderService) Execute(ctx context.Context, cmd ConfirmOrderCommand) error {
    // 1. Загружаем заказ
    order, err := s.orders.GetByID(cmd.OrderID)
    if err != nil {
        return fmt.Errorf("load order: %w", err)
    }
    if order == nil {
        return app.ErrOrderNotFound
    }

    // 2. Вызываем доменный метод подтверждения
    if err := order.Confirm(cmd.UserID); err != nil {
        // Внутри order.Confirm может проверяться владелец заказа,
        // статус и другие доменные ограничения.
        return fmt.Errorf("confirm order: %w", err)
    }

    // 3. Сохраняем изменения
    if err := s.orders.Save(order); err != nil {
        return fmt.Errorf("save order: %w", err)
    }

    return nil
}
```

Обратите внимание, как этот фрагмент кода решает задачу разграничения ответственности:

- все доменные проверки находятся в методе Order.Confirm;
- app‑слой заботится о загрузке и сохранении, а также об общем потоке операции.

### Работа с доменными событиями

Если вы используете доменные события, app‑слой может:

- получать от доменной модели список событий;
- публиковать их во внешний брокер или передавать дальше по системе.

Покажу вам, как это реализовано на практике.

```go
// В доменном слое, упрощенный пример
type Order struct {
    // ...
    events []domainEvent  // локальный буфер доменных событий
}

func (o *Order) Confirm(userID string) error {
    // ... доменные проверки

    o.events = append(o.events, OrderConfirmedEvent{
        OrderID: o.ID,
        UserID:  userID,
    })
    return nil
}

// PullEvents возвращает и очищает накопленные события
func (o *Order) PullEvents() []domainEvent {
    events := o.events
    o.events = nil
    return events
}
```

Теперь в app‑слое вы можете делать так:

```go
type EventBus interface {
    Publish(ctx context.Context, events []domainEvent) error
}

// ConfirmOrderService теперь публикует события
type ConfirmOrderService struct {
    orders   OrderRepository
    eventBus EventBus
}

func (s *ConfirmOrderService) Execute(ctx context.Context, cmd ConfirmOrderCommand) error {
    order, err := s.orders.GetByID(cmd.OrderID)
    if err != nil {
        return fmt.Errorf("load order: %w", err)
    }
    if order == nil {
        return app.ErrOrderNotFound
    }

    if err := order.Confirm(cmd.UserID); err != nil {
        return fmt.Errorf("confirm order: %w", err)
    }

    if err := s.orders.Save(order); err != nil {
        return fmt.Errorf("save order: %w", err)
    }

    // Забираем доменные события после успешного сохранения
    events := order.PullEvents()

    // Публикуем их через шину событий
    if err := s.eventBus.Publish(ctx, events); err != nil {
        // Тут можно заложить стратегию повторов или отложенную доставку
        return fmt.Errorf("publish events: %w", err)
    }

    return nil
}
```

Здесь вы видите, что:

- домен не знает про брокер сообщений;
- app‑слой решает, как именно доставлять события наружу.

---

## App‑слой и инфраструктура

### Интерфейсы против конкретных реализаций

Смотрите, ключевая идея — app‑слой опирается на **абстракции** инфраструктуры, а не на ее конкретные реализации. Для этого удобно:

- объявлять интерфейсы репозиториев и сервисов в app‑слое;
- реализовывать их в infrastructure‑слое;
- передавать реализации через DI (конструкторы или контейнер).

Пример интерфейса в app‑слое вы уже видели, теперь взглянем на реализацию.

```go
// В пакете infrastructure/db/order_repo_pg.go

type OrderRepoPg struct {
    db *sql.DB
}

// NewOrderRepoPg создает репозиторий заказов для PostgreSQL
func NewOrderRepoPg(db *sql.DB) *OrderRepoPg {
    return &OrderRepoPg{db: db}
}

// GetByID загружает заказ по ID
func (r *OrderRepoPg) GetByID(id string) (*domain.Order, error) {
    // Здесь мы пишем SQL, это инфраструктура
    row := r.db.QueryRow(`SELECT ... FROM orders WHERE id = $1`, id)
    var o domain.Order
    // ... собираем доменную сущность из строки
    return &o, nil
}

// Save сохраняет заказ
func (r *OrderRepoPg) Save(order *domain.Order) error {
    // Здесь тоже идет SQL и маппинг domain.Order -> строки таблиц
    // ...
    return nil
}
```

Теперь в месте сборки приложения (composition root) вы «склеиваете» слои:

```go
func BuildApp(db *sql.DB, bus EventBus) *Server {
    orderRepo := infrastructure.NewOrderRepoPg(db)

    confirmOrderSvc := &app.ConfirmOrderService{
        orders:   orderRepo, // реализация интерфейса OrderRepository
        eventBus: bus,
    }

    httpHandler := http.NewOrderHandler(confirmOrderSvc)

    return http.NewServer(httpHandler)
}
```

Таким образом:

- app‑слой объявляет, что ему нужно (интерфейс);
- infrastructure‑слой говорит, как именно это сделать (конкретная реализация);
- точка сборки соединяет эти две части.

### Транзакции на уровне app‑слоя

Хотя сами транзакции реализуются в инфраструктуре (например, через sql.Tx), именно app‑слой лучше всего понимает, какие действия должны быть в одной транзакции.

Распространенный паттерн — ввести интерфейс UnitOfWork в app‑слое.

```go
// UnitOfWork описывает единицу работы с транзакцией
type UnitOfWork interface {
    Do(ctx context.Context, fn func(ctx context.Context) error) error
}
```

Реализация может быть такой:

```go
// В пакете infrastructure/db

type PgUnitOfWork struct {
    db *sql.DB
}

// NewPgUnitOfWork конструктор UoW для PostgreSQL
func NewPgUnitOfWork(db *sql.DB) *PgUnitOfWork {
    return &PgUnitOfWork{db: db}
}

// Do выполняет fn в рамках транзакции
func (u *PgUnitOfWork) Do(ctx context.Context, fn func(ctx context.Context) error) error {
    tx, err := u.db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("begin tx: %w", err)
    }

    txCtx := context.WithValue(ctx, txKey{}, tx) // передаем tx через контекст

    // Выполняем переданную функцию
    if err := fn(txCtx); err != nil {
        // Если ошибка, откатываем транзакцию
        if rbErr := tx.Rollback(); rbErr != nil {
            return fmt.Errorf("rollback tx: %v; original err: %w", rbErr, err)
        }
        return err
    }

    // Коммитим транзакцию
    if err := tx.Commit(); err != nil {
        return fmt.Errorf("commit tx: %w", err)
    }

    return nil
}
```

Теперь вы можете использовать UnitOfWork в app‑слое, не привязываясь к конкретной БД.

```go
// В app-слое

type TransferMoneyService struct {
    accounts AccountRepository
    uow      UnitOfWork
}

// TransferMoneyCommand — входные данные use-case
type TransferMoneyCommand struct {
    FromAccountID string
    ToAccountID   string
    Amount        int64
}

// Execute выполняет перевод денег между счетами
func (s *TransferMoneyService) Execute(ctx context.Context, cmd TransferMoneyCommand) error {
    // Оборачиваем сценарий в UnitOfWork
    return s.uow.Do(ctx, func(txCtx context.Context) error {
        from, err := s.accounts.GetByID(txCtx, cmd.FromAccountID)
        if err != nil {
            return err
        }
        to, err := s.accounts.GetByID(txCtx, cmd.ToAccountID)
        if err != nil {
            return err
        }

        // Доменные операции списания и зачисления
        if err := from.Withdraw(cmd.Amount); err != nil {
            return err
        }
        if err := to.Deposit(cmd.Amount); err != nil {
            return err
        }

        // Сохраняем оба счета в рамках одной транзакции
        if err := s.accounts.Save(txCtx, from); err != nil {
            return err
        }
        if err := s.accounts.Save(txCtx, to); err != nil {
            return err
        }

        return nil
    })
}
```

Здесь вы видите, как app‑слой описывает границы транзакции, а инфраструктура реализует детали.

---

## Организация DTO, команд и запросов в app‑слое

### Команды и запросы (Command/Query)

В app‑слое удобно отделять:

- команды (Command) — изменяют состояние системы;
- запросы (Query) — только читают данные.

Команды обычно представлены как структуры с полями. Они передаются в application service, который реализует use‑case. Давайте разберемся на небольшом примере.

```go
// Команда на создание заказа
type CreateOrderCommand struct {
    UserID string
    Items  []CreateOrderItem
}

// CreateOrderItem описывает одну позицию в заказе
type CreateOrderItem struct {
    ProductID string
    Quantity  int
}

// Запрос на получение заказа
type GetOrderQuery struct {
    OrderID string
}
```

Такое разделение помогает:

- сделать операции более явными;
- различать сценарии изменения и чтения;
- в более сложных системах применять разные модели для команд и запросов (CQRS).

### DTO для выдачи наружу

App‑слой часто отвечает за формирование DTO, которые затем сериализуются в HTTP‑ответ, публикуются в очередь и т. п. Можете держать DTO:

- либо в app‑слое (если они общие для нескольких интерфейсов);
- либо в interface‑слое (если они специфичны для протокола).

Пример DTO внутри app‑слоя:

```go
// OrderDTO описывает данные заказа для чтения
type OrderDTO struct {
    ID        string
    UserID    string
    Status    string
    Total     int64
    CreatedAt time.Time
}

// OrderQueryService отвечает за сценарии чтения заказов
type OrderQueryService struct {
    // Здесь может быть отдельный "read" репозиторий
    repo OrderReadRepository
}

type OrderReadRepository interface {
    FindByID(ctx context.Context, id string) (*OrderDTO, error)
}
```

Этот подход дает вам возможность оптимизировать чтение отдельно от доменных сущностей, не нарушая их целостности.

---

## Типичные паттерны в app‑слое

### Фасады (Application Facade)

Иногда удобно объединить несколько use‑case в один фасад. Например, для взаимодействия с внешней системой.

```go
// BillingFacade объединяет ряд сценариев работы с биллингом
type BillingFacade struct {
    chargeSvc     *ChargeService
    refundSvc     *RefundService
    balanceQuery  *BalanceQueryService
}

// ChargeUser списывает деньги по сценарию Charge
func (f *BillingFacade) ChargeUser(ctx context.Context, cmd ChargeCommand) error {
    return f.chargeSvc.Execute(ctx, cmd)
}

// RefundUser возвращает деньги по сценарию Refund
func (f *BillingFacade) RefundUser(ctx context.Context, cmd RefundCommand) error {
    return f.refundSvc.Execute(ctx, cmd)
}
```

Такой фасад можно отдавать в другие модули или микросервисы как высокоуровневый API приложения.

### Обработчики событий (Application Event Handlers)

App‑слой может реагировать на события, поступающие:

- из других сервисов через брокер;
- из планировщика задач;
- из самого приложения (через event bus).

Пример обработки внешнего события.

```go
// UserRegisteredEvent описывает внешнее событие
type UserRegisteredEvent struct {
    UserID string
    Email  string
}

// WelcomeEmailHandler отправляет приветственное письмо
type WelcomeEmailHandler struct {
    emailService EmailService
}

// Handle обрабатывает событие регистрации пользователя
func (h *WelcomeEmailHandler) Handle(ctx context.Context, event UserRegisteredEvent) error {
    // Здесь реализуем прикладную логику:
    // 1) подготовить шаблон письма,
    // 2) вызвать доменную модель, если нужно,
    // 3) отправить письмо через инфраструктурный сервис.
    return h.emailService.SendWelcomeEmail(ctx, event.Email)
}
```

Этот код живет в app‑слое, потому что:

- работает с внешними событиями;
- использует инфраструктурные абстракции (EmailService);
- реализует сценарий на уровне приложения, а не чистого домена.

---

## Тестирование app‑слоя

### Модульные тесты use‑case

Тесты app‑слоя обычно пишут с моками:

- репозиториев;
- внешних сервисов (email, платежи, очереди);
- event bus и unit of work.

Так вы проверяете только сценарий, не завися от реальной среды.

```go
// Пример теста для RegisterUserService

func TestRegisterUserService_Execute_Success(t *testing.T) {
    ctx := context.Background()

    // Здесь создаем моки для репозитория и хешера
    userRepo := &mockUserRepo{}
    hasher := &mockHasher{}

    // Пользователя с таким email еще нет
    userRepo.findByEmailFunc = func(email string) (*domain.User, error) {
        return nil, nil
    }

    // Хешер возвращает фиксированный хеш
    hasher.hashFunc = func(pwd string) (string, error) {
        return "hashed-" + pwd, nil
    }

    svc := &app.RegisterUserService{
        userRepo: userRepo,
        hasher:   hasher,
    }

    cmd := app.RegisterUserCommand{
        Email:    "test@example.com",
        Password: "secret",
    }

    // Выполняем use-case
    err := svc.Execute(ctx, cmd)
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }

    // Проверяем, что пользователь был сохранен
    if len(userRepo.savedUsers) != 1 {
        t.Fatalf("expected 1 user saved, got %d", len(userRepo.savedUsers))
    }
}
```

Комментарии в коде помогают лучше понять идею:

- вы изолируете app‑слой от инфраструктуры;
- проверяете только поведение use‑case.

### Интеграционные тесты app‑слоя

Часто полезно писать интеграционные тесты, которые:

- поднимают реальную БД (локально или в контейнере);
- используют конкретные реализации репозиториев;
- вызывают use‑case как черный ящик.

Такие тесты проверяют:

- корректность транзакций;
- маппинг между доменной моделью и БД;
- взаимодействие с внешними системами через заглушки.

---

## Типичные ошибки при проектировании app‑слоя

### Смешивание доменной и прикладной логики

Самая распространенная проблема — часть доменных правил «просачивается» в app‑слой. Примеры:

- проверка инвариантов сущности в application‑сервисе, а не в доменном методе;
- бизнес‑условия типа «нельзя подтверждать отмененный заказ» в app‑слое.

Чтобы избежать этого:

- вся логика, связанная с состоянием предметных сущностей, должна находиться в domain‑слое;
- app‑слой только управляет потоком выполнения и оркестрацией.

### Слишком «тонкий» app‑слой

Обратная проблема — app‑слой превращается в тонкий фасад над доменом:

- методы, которые просто прокидывают аргументы дальше;
- отсутствие явных use‑case;
- сильная связность интерфейсного слоя с доменом.

В таком случае стоит:

- явно выписать use‑case и команды;
- вынести авторизацию, кросс‑модульные сценарии, публикацию событий в app‑слой.

### Зависимость от фреймворков

App‑слой не должен:

- использовать типы конкретного веб‑фреймворка;
- читать переменные окружения напрямую;
- логировать, завязываясь на конкретный логгер.

Лучше ввести:

- абстрактный интерфейс Logger;
- конфигурацию, прокидываемую извне;
- простые структуры команд и DTO без привязки к HTTP‑запросам.

---

## Заключение

App‑слой (application layer) — это связующее звено между внешним миром и доменной моделью. Он отвечает за:

- реализацию конкретных сценариев использования системы;
- координацию доменных операций и инфраструктурных вызовов;
- управление транзакциями, событиями и кросс‑модульными взаимодействиями.

При правильном проектировании app‑слой помогает:

- сделать доменную модель чище и независимее;
- упростить тестирование бизнес‑сценариев;
- облегчить замену инфраструктуры и интерфейсов.

При этом важно четко разграничивать:

- доменные правила — в domain‑слое;
- прикладные сценарии, авторизацию, оркестрацию — в app‑слое;
- детали протоколов, сериализацию и рендеринг — в interface‑слое;
- технические реализации — в infrastructure‑слое.

Если держать в голове эти границы и следовать им на практике, app‑слой станет удобным местом для описания поведения вашего приложения на уровне use‑case, а не источником путаницы.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как организовать версионирование use-case в app-слое

Если вы поддерживаете несколько версий API, удобнее не плодить версии внутри app‑слоя. Оставьте версии на уровне интерфейсного слоя, а в app‑слой передавайте уже приведенные к «внутренней» модели команды. Для кардинально разных сценариев создавайте отдельные application‑сервисы и явно называйте их, например CreateOrderV2Service.

### Можно ли в app-слое использовать ORM напрямую

Да, но только через абстракцию репозиториев или отдельного data access слоя. App‑слой не должен знать про конкретные сущности ORM и детали маппинга. Лучше объявить интерфейс, который возвращает доменные сущности или DTO, а реализацию с ORM вынести в infrastructure.

### Как поступать с кэшированием в app-слое

Кэш чаще всего относится к инфраструктуре. В app‑слое опишите интерфейс, который предоставляет нужные операции чтения и записи. Реализацию с Redis или in‑memory хранилищем поместите в infrastructure, а в app‑слое только решайте, какие сценарии использовать с кэшем и с какими ключами.

### Как правильно внедрять логирование в app-слой

В app‑слое используйте интерфейс Logger с методами Info, Error и т. п. Реализацию поверх конкретного логгера (zap, logrus) поместите в infrastructure и прокиньте в application‑сервисы через конструктор. Старайтесь логировать события на уровне use‑case, а не на уровне отдельных доменных методов.

### Как обрабатывать ретраи внешних вызовов в app-слое

Если сценарий use‑case зависит от ненадежного внешнего сервиса, реализуйте стратегию повторов в app‑слое через обертку над интерфейсом внешнего клиента. В обертке можно реализовать политику повторных попыток, таймауты и circuit breaker. В самом use‑case вызывайте уже устойчивый к ошибкам интерфейс, не размазывая логику повторов по всему коду.