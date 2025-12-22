---
metaTitle: Сегмент services в сервисной архитектуре
metaDescription: Разбор сегмента services в сервисной архитектуре - ключевые принципы проектирования services-segment структура кода и практики интеграции
author: Олег Марков
title: Сегмент services - services-segment в микросервисной архитектуре
preview: Разбираем как проектировать и использовать сегмент services - services-segment - какие задачи он решает как организовать код и как связать его с другими слоями системы
---

## Введение

Сегмент services (часто его называют services-segment) – это логический слой в приложении, где сосредоточена прикладная бизнес-логика. Вы можете встретить его в монолитах, микросервисах, модулях доменной архитектуры. Обычно именно здесь описывается то, **что** система делает, без лишней привязки к тому, **как** это хранится в базе данных или **как** это отдается наружу по HTTP или gRPC.

Давайте разберем, как организовать services-segment так, чтобы:

- код был читаемым и расширяемым;
- бизнес-правила были сконцентрированы в одном месте;
- сервисы было легко покрывать тестами;
- слой API и слой хранения данных можно было менять с минимальными изменениями.

Ниже я покажу вам типичную структуру services-segment, основные паттерны, примеры интерфейсов и реализаций, а также подходы к валидации, транзакциям и интеграции с внешними системами.

## Концепция services-segment

### Задачи слоя services

Сегмент services отвечает за:

- реализацию бизнес-операций;
- координацию нескольких хранилищ или внешних сервисов;
- применение доменных правил и инвариантов;
- обработку ошибок бизнес-уровня;
- подготовку данных для верхнего слоя (API, UI, очереди).

При этом services-segment **не должен**:

- знать детали хранения (SQL-запросы, схемы таблиц);
- зависеть от конкретного HTTP-фреймворка;
- оперировать сырой структурой входного запроса.

Смотрите, я покажу вам на схеме, как это обычно выглядит логически (упрощенно, текстом):

- transport layer (HTTP/gRPC/CLI)
  - парсит запросы;
  - вызывает методы services.
- services-segment
  - инкапсулирует бизнес-логику;
  - использует репозитории/гейты.
- data access / integration
  - реализует доступ к БД, очередям, внешним API.

### Типичные сущности внутри services-segment

Чаще всего вы увидите следующие типы объектов:

- интерфейсы сервисов (UserService, OrderService, BillingService);
- структуры с зависимостями (userServiceImpl со ссылками на репозитории);
- DTO для входных и выходных данных сервисов;
- ошибки бизнес-уровня (например, ErrUserAlreadyExists);
- вспомогательные компоненты (валидаторы, конвертеры).

Давайте разберемся, как это выглядит в коде на примере условного языка Go. Принципы остаются такими же и для других языков.

## Структура services-segment в проекте

### Организация каталогов

Часто сегмент services организуют примерно так:

- internal/
  - services/
    - user/
      - service.go
      - dto.go
      - errors.go
    - order/
      - service.go
      - dto.go
      - errors.go
    - common/
      - validation.go
      - types.go

Такой подход помогает:

- держать сервисы по доменам (user, order, billing);
- изолировать общие части (common);
- отделить интерфейсы и DTO от остальных слоев, сохраняя минимум зависимостей.

### Пример интерфейса сервиса

Давайте посмотрим, как может выглядеть сервис пользователей.

```go
// UserService описывает операции бизнес-логики над пользователями.
type UserService interface {
    // Register создает нового пользователя с базовой валидацией и бизнес-правилами.
    Register(ctx context.Context, input RegisterUserInput) (*UserDTO, error)

    // Activate активирует пользователя по коду активации.
    Activate(ctx context.Context, activationCode string) error

    // GetByID возвращает информацию о пользователе.
    GetByID(ctx context.Context, id string) (*UserDTO, error)
}
```

Комментарии прямо в коде помогают быстро понять назначение каждого метода. Важно, что интерфейс не знает:

- как именно хранится пользователь (SQL, NoSQL);
- каким был исходный HTTP-запрос.

Он работает через абстрактные типы `RegisterUserInput` и `UserDTO`.

### DTO и входные модели

Теперь вы увидите, как это выглядит в моделях входа и выхода.

```go
// RegisterUserInput - данные, необходимые для регистрации пользователя.
// Эту структуру можно наполнять из HTTP-запроса, gRPC-сообщения и т.п.
type RegisterUserInput struct {
    Email    string // Email пользователя
    Password string // Неформатированный пароль, далее шифруется
    Name     string // Имя отображения
}

// UserDTO - данные, которые возвращает сервис пользователю верхнего уровня.
// Здесь мы не храним приватные детали вроде хеша пароля.
type UserDTO struct {
    ID        string // Уникальный идентификатор пользователя
    Email     string // Email пользователя
    Name      string // Отображаемое имя
    IsActive  bool   // Флаг активности
    CreatedAt time.Time // Дата создания
}
```

Смотрите, я показываю здесь явное разделение:

- `RegisterUserInput` – модель входа, обычно ближе к запросу;
- `UserDTO` – модель выхода, безопасная для отдачи наружу.

Так проще контролировать, какие именно данные проходят через services-segment.

## Реализация сервисов и зависимости

### Инъекция зависимостей через конструктор

Чаще всего реализация сервиса получает свои зависимости (репозитории, клиент почты, логгер) через конструктор.

```go
// UserRepository описывает операции с хранилищем пользователей.
// Это интерфейс, чтобы можно было легко подменять реализацию в тестах.
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByEmail(ctx context.Context, email string) (*User, error)
    GetByID(ctx context.Context, id string) (*User, error)
    ActivateByCode(ctx context.Context, code string) error
}

// EmailSender описывает минимальный интерфейс для отправки писем.
type EmailSender interface {
    SendActivationEmail(ctx context.Context, email, activationCode string) error
}

// userServiceImpl - конкретная реализация UserService.
// Здесь мы храним зависимости в полях структуры.
type userServiceImpl struct {
    repo   UserRepository
    email  EmailSender
    logger Logger
}

// NewUserService конструирует новый сервис пользователей.
// Через параметры мы передаем конкретные реализации зависимостей.
func NewUserService(repo UserRepository, email EmailSender, logger Logger) UserService {
    return &userServiceImpl{
        repo:   repo,
        email:  email,
        logger: logger,
    }
}
```

Такой подход:

- делает сервис самостоятельным и изолированным;
- позволяет легко подменять зависимости в тестах;
- упрощает конфигурацию всего приложения.

### Пример реализации бизнес-метода

Теперь давайте посмотрим, что происходит в реальной реализации метода регистрации.

```go
// Register реализует бизнес-логику регистрации пользователя.
func (s *userServiceImpl) Register(ctx context.Context, input RegisterUserInput) (*UserDTO, error) {
    // 1. Базовая валидация входных данных
    if err := validateRegisterInput(input); err != nil {
        // Возвращаем ошибку верхнему уровню, чтобы он сам решил, что показать пользователю.
        return nil, err
    }

    // 2. Проверка на существование пользователя с таким email
    existing, err := s.repo.GetByEmail(ctx, input.Email)
    if err != nil {
        // Логируем системную ошибку для последующей диагностики.
        s.logger.Errorf("failed to get user by email - %v", err)
        return nil, ErrInternal // Бизнес-уровневая обертка
    }
    if existing != nil {
        // Бизнес-ошибка - пользователь уже существует.
        return nil, ErrUserAlreadyExists
    }

    // 3. Преобразование входных данных в доменную модель
    user := &User{
        ID:       generateID(),          // Генерируем новый идентификатор
        Email:    input.Email,
        Name:     input.Name,
        Password: hashPassword(input.Password), // Храним только хеш
        IsActive: false,
    }

    // 4. Создаем пользователя в хранилище
    if err := s.repo.Create(ctx, user); err != nil {
        s.logger.Errorf("failed to create user - %v", err)
        return nil, ErrInternal
    }

    // 5. Отправляем письмо с активацией (побочный эффект)
    activationCode := generateActivationCode()
    if err := s.email.SendActivationEmail(ctx, user.Email, activationCode); err != nil {
        s.logger.Warnf("failed to send activation email - %v", err)
        // Здесь можно решить не падать, а просто залогировать
    }

    // 6. Возвращаем DTO для верхнего уровня
    dto := &UserDTO{
        ID:       user.ID,
        Email:    user.Email,
        Name:     user.Name,
        IsActive: user.IsActive,
        // CreatedAt обычно выставляется на уровне репозитория или БД
    }

    return dto, nil
}
```

Обратите внимание:

- все шаги — это именно бизнес-операции (проверки, создание, отправка письма);
- нет SQL-запросов, нет деталей HTTP;
- зависимости (`repo`, `email`, `logger`) передаются извне.

Так services-segment концентрирует доменную логику и остается универсальным.

## Ошибки и бизнес-правила в services-segment

### Классификация ошибок

В services-segment полезно разделять ошибки:

- системные (проблемы с БД, сетью, таймауты);
- бизнес-ошибки (нельзя удалить активного пользователя, пользователь уже существует и т.п.);
- ошибки валидации входа.

Это помогает верхнему слою (API) корректно формировать коды ответов (400, 404, 409, 500 и др.).

Давайте посмотрим простой пример.

```go
// ErrUserAlreadyExists - бизнес-ошибка при создании пользователя.
var ErrUserAlreadyExists = errors.New("user already exists")

// ErrInvalidActivationCode - бизнес-ошибка при активации.
var ErrInvalidActivationCode = errors.New("invalid activation code")

// ValidationError - обертка над ошибками валидации с деталями.
type ValidationError struct {
    Fields map[string]string // ключ - поле, значение - описание ошибки
}

// Error реализует интерфейс error.
func (e *ValidationError) Error() string {
    return "validation failed"
}
```

Смотрите, я ввожу отдельный тип `ValidationError`. Верхний слой может распознать его по типу и вернуть, например, статус 400 с подробностями по полям.

### Пример валидации во вспомогательной функции

Теперь давайте посмотрим, как реализовать `validateRegisterInput`.

```go
// validateRegisterInput выполняет базовую валидацию данных для регистрации.
func validateRegisterInput(input RegisterUserInput) error {
    fields := make(map[string]string)

    // Примитивная проверка email
    if !strings.Contains(input.Email, "@") {
        fields["email"] = "invalid email format"
    }

    // Проверяем длину пароля
    if len(input.Password) < 8 {
        fields["password"] = "password must be at least 8 characters"
    }

    // Имя не должно быть пустым
    if strings.TrimSpace(input.Name) == "" {
        fields["name"] = "name must not be empty"
    }

    // Если есть ошибки, возвращаем ValidationError
    if len(fields) > 0 {
        return &ValidationError{Fields: fields}
    }

    return nil
}
```

Такую валидацию удобно держать в services-segment, потому что:

- часть правил может быть доменной (например, длина пароля);
- при смене транспорта (HTTP → gRPC) продолжит работать тот же код.

## Транзакции и согласованность в services-segment

### Оркестрация нескольких репозиториев

Часто сервису нужно модифицировать сразу несколько агрегатов или таблиц. Здесь возникают вопросы транзакций. Давайте разберем типичный подход.

Вместо того чтобы тянуть зависимость от SQL в сервис, вы можете передать абстракцию транзакционного контекста.

```go
// TxManager описывает абстракцию для выполнения операций в транзакции.
type TxManager interface {
    // WithinTx запускает функцию fn в транзакции.
    WithinTx(ctx context.Context, fn func(ctx context.Context) error) error
}

// OrderService работает с заказами и платежами.
type OrderService interface {
    CreateOrderAndCharge(ctx context.Context, input CreateOrderInput) (*OrderDTO, error)
}
```

Теперь давайте посмотрим, как это реализовать в самом сервисе.

```go
type orderServiceImpl struct {
    tx        TxManager
    orders    OrderRepository
    payments  PaymentProvider
    inventory InventoryService
}

// CreateOrderAndCharge создает заказ и списывает деньги в одной логической операции.
func (s *orderServiceImpl) CreateOrderAndCharge(ctx context.Context, input CreateOrderInput) (*OrderDTO, error) {
    var result *OrderDTO

    // Выполняем бизнес-операцию внутри транзакции.
    err := s.tx.WithinTx(ctx, func(txCtx context.Context) error {
        // 1. Резервируем товары на складе
        if err := s.inventory.Reserve(txCtx, input.Items); err != nil {
            return err // Бизнес-ошибка, например, "нет на складе"
        }

        // 2. Создаем заказ в хранилище
        order, err := s.orders.Create(txCtx, input.toOrderModel())
        if err != nil {
            return err // Ошибка уровня репозитория
        }

        // 3. Списываем деньги
        if err := s.payments.Charge(txCtx, input.PaymentInfo, order.TotalAmount); err != nil {
            return err // Ошибка списания
        }

        // 4. Готовим DTO
        result = toOrderDTO(order)
        return nil
    })

    if err != nil {
        return nil, err
    }

    return result, nil
}
```

Здесь важный момент: сервис работает с абстракцией `TxManager`, а не с конкретной реализацией транзакции в БД. Это позволяет:

- выносить транзакционную логику в инфраструктурный слой;
- легче писать юнит-тесты, подменяя `TxManager` на фейковый.

## Интеграция services-segment с транспортом (API)

### Слой адаптеров

Чтобы связать HTTP/gRPC с services-segment, часто используют адаптеры. Они:

- принимают запрос;
- парсят и валидируют данные на уровне транспорта (например, структура JSON, типы);
- вызывают нужный метод сервиса;
- мапят результат на формат ответа (JSON, protobuf, HTML).

Давайте посмотрим упрощенный пример HTTP-обработчика, который использует `UserService`.

```go
// httpRegisterHandler - HTTP-обработчик регистрации пользователя.
func httpRegisterHandler(svc UserService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()

        // 1. Декодируем входные данные из JSON
        var req registerRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            // Возвращаем 400 при ошибке парсинга
            http.Error(w, "invalid json", http.StatusBadRequest)
            return
        }

        // 2. Мапим HTTP-модель на модель сервиса
        input := RegisterUserInput{
            Email:    req.Email,
            Password: req.Password,
            Name:     req.Name,
        }

        // 3. Вызываем сервис
        user, err := svc.Register(ctx, input)
        if err != nil {
            // Обработка ошибок сервиса
            switch e := err.(type) {
            case *ValidationError:
                // Возвращаем 400 и детали валидации
                w.WriteHeader(http.StatusBadRequest)
                json.NewEncoder(w).Encode(e.Fields)
                return
            default:
                if errors.Is(err, ErrUserAlreadyExists) {
                    http.Error(w, "user already exists", http.StatusConflict)
                    return
                }
                http.Error(w, "internal error", http.StatusInternalServerError)
                return
            }
        }

        // 4. Формируем успешный ответ
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(user)
    }
}
```

Здесь я специально показываю, что:

- обработчик знает о деталях HTTP (коды статусов, JSON);
- сервис ничего об этом не знает и не должен знать;
- адаптер занимается маппингом моделей и ошибок.

Такой подход делает services-segment переносимым и независимым от конкретного транспорта.

## Тестирование services-segment

### Юнит-тесты на уровне сервисов

Поскольку services-segment отделен от инфраструктуры, вы можете легко писать юнит-тесты, подменяя зависимости моками или фейками.

```go
// fakeUserRepo - простая фейковая реализация репозитория для теста.
type fakeUserRepo struct {
    usersByEmail map[string]*User
}

func (f *fakeUserRepo) Create(ctx context.Context, user *User) error {
    if f.usersByEmail == nil {
        f.usersByEmail = make(map[string]*User)
    }
    f.usersByEmail[user.Email] = user
    return nil
}

func (f *fakeUserRepo) GetByEmail(ctx context.Context, email string) (*User, error) {
    if user, ok := f.usersByEmail[email]; ok {
        return user, nil
    }
    return nil, nil
}

func (f *fakeUserRepo) GetByID(ctx context.Context, id string) (*User, error) {
    // В данном тесте метод можно оставить простым
    return nil, nil
}

func (f *fakeUserRepo) ActivateByCode(ctx context.Context, code string) error {
    return nil
}
```

Теперь давайте напишем сам тест.

```go
func TestUserService_Register_UserAlreadyExists(t *testing.T) {
    ctx := context.Background()

    // 1. Готовим фейковый репозиторий с уже существующим пользователем
    repo := &fakeUserRepo{
        usersByEmail: map[string]*User{
            "test@example.com": {Email: "test@example.com"},
        },
    }

    // 2. Фейковый отправитель писем - в тесте он не делает ничего
    emailSender := &fakeEmailSender{}

    // 3. Сервис с фейковыми зависимостями
    logger := &noopLogger{} // Логгер, который игнорирует сообщения
    svc := NewUserService(repo, emailSender, logger)

    // 4. Вызываем метод регистрации
    _, err := svc.Register(ctx, RegisterUserInput{
        Email:    "test@example.com",
        Password: "12345678",
        Name:     "Test",
    })

    // 5. Проверяем, что вернулась правильная ошибка
    if !errors.Is(err, ErrUserAlreadyExists) {
        t.Fatalf("expected ErrUserAlreadyExists, got %v", err)
    }
}
```

Такие тесты:

- работают быстро;
- не требуют реальной БД;
- проверяют чистую бизнес-логику.

### Интеграционные тесты с реальной инфраструктурой

Для сложных кейсов можно писать интеграционные тесты, где:

- поднимается тестовая БД;
- используются реальные репозитории;
- вызываются методы сервисов через публичный интерфейс.

При этом структура services-segment не меняется, добавляется только инфраструктурный уровень.

## Расширяемость и версионирование services-segment

### Добавление новых методов и сценариев

Когда вы расширяете систему, часто проще:

- сначала добавить метод на уровне сервиса;
- затем подключить его в транспортном слое (HTTP/gRPC).

Например, если вам нужно добавить поиск пользователей по имени, вы:

1. Добавляете метод в `UserService`.

```go
type UserService interface {
    // ...
    Search(ctx context.Context, filter UserSearchFilter) ([]*UserDTO, error)
}
```

2. Реализуете его в `userServiceImpl`, используя репозиторий.
3. Добавляете HTTP- или gRPC-эндпоинт, который вызывает этот метод.

Такой порядок помогает не смешивать транспортные детали с бизнес-логикой.

### Версионирование контрактов

Иногда вы меняете поведение или контракт сервисов. Тогда полезно:

- не ломать существующие методы, а добавлять новые (например, `RegisterV2`);
- четко фиксировать DTO и структуру ошибок;
- версионировать только уровень транспорта (например, `/api/v1` и `/api/v2`), оставляя services-segment максимально стабильным.

## Пример комплексного services-segment для домена заказов

Чтобы связать все части, давайте соберем упрощенный пример сегмента services для домена заказов.

### Интерфейсы

```go
// OrderService - основной сервис для работы с заказами.
type OrderService interface {
    Create(ctx context.Context, input CreateOrderInput) (*OrderDTO, error)
    GetByID(ctx context.Context, id string) (*OrderDTO, error)
    Cancel(ctx context.Context, id string) error
}
```

### DTO и входные модели

```go
// CreateOrderInput - входные данные для создания заказа.
type CreateOrderInput struct {
    UserID string        // Идентификатор пользователя
    Items  []OrderItemIn // Список позиций заказа
}

// OrderItemIn - одна позиция заказа.
type OrderItemIn struct {
    ProductID string // Идентификатор товара
    Quantity  int    // Количество
}

// OrderDTO - данные о заказе для внешнего использования.
type OrderDTO struct {
    ID        string          // Идентификатор заказа
    UserID    string          // Идентификатор пользователя
    Items     []OrderItemDTO  // Позиции заказа
    Total     float64         // Итоговая сумма
    Status    string          // Текущий статус
    CreatedAt time.Time       // Дата создания
}

// OrderItemDTO - DTO позиции заказа.
type OrderItemDTO struct {
    ProductID string  // Идентификатор товара
    Quantity  int     // Количество
    Price     float64 // Цена за единицу
}
```

### Реализация сервиса с учетом бизнес-правил

```go
type orderServiceImpl struct {
    tx        TxManager
    orders    OrderRepository
    products  ProductRepository
    inventory InventoryService
}

func NewOrderService(tx TxManager, orders OrderRepository, products ProductRepository, inventory InventoryService) OrderService {
    return &orderServiceImpl{
        tx:        tx,
        orders:    orders,
        products:  products,
        inventory: inventory,
    }
}

// Create реализует создание заказа с учетом проверки наличия товара и расчета суммы.
func (s *orderServiceImpl) Create(ctx context.Context, input CreateOrderInput) (*OrderDTO, error) {
    // Валидация входных данных
    if err := validateCreateOrderInput(input); err != nil {
        return nil, err
    }

    var result *OrderDTO

    err := s.tx.WithinTx(ctx, func(txCtx context.Context) error {
        // 1. Получаем информацию о товарах
        productIDs := make([]string, 0, len(input.Items))
        for _, item := range input.Items {
            productIDs = append(productIDs, item.ProductID)
        }

        products, err := s.products.GetByIDs(txCtx, productIDs)
        if err != nil {
            return ErrInternal
        }

        // 2. Проверяем, что все товары существуют
        if len(products) != len(productIDs) {
            return ErrSomeProductsNotFound
        }

        // 3. Проверяем наличие и считаем сумму
        var total float64
        for _, item := range input.Items {
            product := findProduct(products, item.ProductID)
            if product == nil {
                return ErrSomeProductsNotFound
            }
            if product.Stock < item.Quantity {
                return ErrInsufficientStock
            }
            total += float64(item.Quantity) * product.Price
        }

        // 4. Резервируем товары на складе
        if err := s.inventory.Reserve(txCtx, input.toReserveRequest()); err != nil {
            return err
        }

        // 5. Создаем заказ
        order := &Order{
            ID:     generateID(),
            UserID: input.UserID,
            Status: StatusNew,
            Total:  total,
        }

        if err := s.orders.Create(txCtx, order, input.ItemsToOrderItems()); err != nil {
            return ErrInternal
        }

        // 6. Готовим DTO
        result = toOrderDTO(order, products, input.Items)
        return nil
    })

    if err != nil {
        return nil, err
    }

    return result, nil
}
```

Комментарии в этом примере можно расширить в реальном коде, но даже сейчас вы видите:

- валидация и бизнес-проверки живут в сервисе;
- доступ к БД скрыт за репозиториями;
- транзакции инкапсулированы в `TxManager`.

## Заключение

Сегмент services (services-segment) – это слой, который позволяет вам сосредоточить бизнес-логику в одном месте, убрать из нее детали HTTP, SQL и прочей инфраструктуры и тем самым сделать код:

- более предсказуемым;
- проще тестируемым;
- устойчивым к изменениям транспорта и хранилища.

Вы видели:

- как определять интерфейсы сервисов;
- как организовывать DTO и входные модели;
- как инъецировать зависимости и работать с транзакциями;
- как обрабатывать ошибки бизнес-уровня;
- как связывать services-segment с транспортным слоем через адаптеры.

Если вы будете придерживаться этих принципов, services-segment станет опорным слоем вашей архитектуры, а изменение БД, фреймворка или протокола перестанет быть критической задачей.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как избежать циклических зависимостей между services и репозиториями

Разделяйте интерфейсы и реализации. Интерфейсы сервисов и репозиториев кладите в один общий пакеt (например, internal/core или internal/contracts), а конкретные реализации — в отдельные слои (internal/services, internal/repository). Внедряйте зависимости на уровне сборки приложения, а не внутри модулей.

### Как обрабатывать кэш внутри services-segment

Сервис не должен знать о конкретной технологии кэширования. Вынесите кэш в отдельный интерфейс (Cache или UserCache) и внедряйте его, как любую другую зависимость. Бизнес-логика опирается на абстрактные методы Get/Set, а детали (Redis, in-memory) остаются в инфраструктурном слое.

### Где лучше реализовать сложные маппинги между доменными моделями и DTO

Если маппинг специфичен для конкретного сервиса, держите функции-конвертеры в этом же пакете services. Если маппинг общий (например, между несколькими сервисами), выносите его в отдельный пакет mapper или converters. Главное — не допускать, чтобы транспортный слой напрямую лез в доменные модели БД.

### Как реализовать ретраи и таймауты при вызове внешних систем из сервиса

Оборачивайте клиентов внешних систем в отдельные интерфейсы (например, PaymentProvider). Политики ретраев и таймаутов инкапсулируйте внутри реализаций этих интерфейсов. Сервис видит только метод Charge или Send, а вся логика повторов и ограничений по времени спрятана внутри клиента.

### Как поступать с кросс-доменной логикой которая затрагивает несколько сервисов

Используйте фасады или доменные оркестраторы. Создайте отдельный сервис-компоновщик (например, CheckoutService), который агрегирует вызовы нескольких доменных сервисов (UserService, OrderService, BillingService). Каждый доменный сервис остается изолированным, а общая логика собирается в одном месте без нарушения границ.