---
metaTitle: Горизонтальные слайсы horizontal-slices в архитектуре приложений
metaDescription: Подробное объяснение подхода горизонтальные слайсы horizontal-slices - как организовать структуру проекта по фичам вместо слоев и избежать типичных проблем слоями
author: Олег Марков
title: Горизонтальные слайсы horizontal-slices - практическое руководство для разработчиков
preview: Разберем подход горизонтальные слайсы horizontal-slices - когда код группируется по фичам а не по слоям - с примерами структуры проекта и практическими советами
---

## Введение

Горизонтальные слайсы (horizontal-slices) — это подход к организации кода, при котором вы группируете файлы и модули по функциональным возможностям (фичам), а не по техническим слоям вроде контроллеров, сервисов и репозиториев.  

Говоря проще, вы складываете вместе все, что относится к одной конкретной задаче для пользователя, вместо того чтобы раскладывать код по «техническим полкам».

Если вы когда‑то открывали проект и видели дерево вида:

- controllers  
- services  
- repositories  
- models  

и при этом вам постоянно приходилось прыгать по разным папкам, чтобы понять, как реализована одна конкретная фича — вы уже почувствовали, зачем нужны горизонтальные слайсы.

Ниже я покажу вам:

- чем horizontal-slices отличаются от классической слоеной архитектуры  
- как выглядит реальная структура проекта по слайсам  
- как организовать зависимости и границы между слайсами  
- как применять этот подход в бэкенде, фронтенде и микросервисах  
- какие типичные ошибки возникают и как их избежать  

Давайте разберемся на практических примерах.

---

## Что такое горизонтальные слайсы по сути

### Вертикальное и горизонтальное разбиение

Прежде чем углубляться, важно договориться о терминах.

Горизонтальные слайсы — это когда каждый слайс представляет собой «вертикальный» срез функциональности через все технические слои, но внутри проекта эти срезы лежат «горизонтально» рядом друг с другом.  

Смотрите, я покажу вам на контрасте.

Классическая слоеная архитектура:

- controllers  
- services  
- repositories  
- models  

Горизонтальные слайсы:

- users  
- orders  
- products  

Внутри `users` уже лежат свои контроллеры, сервисы, репозитории и другие части, но они сгруппированы вокруг одной доменной области.

### Главное отличие от слоеной архитектуры

В слоеной архитектуре код делится по технической роли:

- контроллеры для всех фич вместе  
- сервисы для всех фич вместе  
- репозитории для всех фич вместе  

В horizontal-slices код делится по фичам:

- фича «Профиль пользователя» — все слои внутри нее  
- фича «Оформление заказа» — все слои внутри нее  
- фича «Каталог товаров» — все слои внутри нее  

Таким образом, ваш модуль или папка — это не «слой», а «функциональный блок».

---

## Структура проекта с горизонтальными слайсами

### Базовая структура на примере backend (Go)

Давайте посмотрим, как может выглядеть структура проекта на Go с использованием horizontal-slices:

```go
// Структура проекта (условная, как комментарий)

project/
  cmd/
    api/
      main.go              // Точка входа
  internal/
    app/
      http/
        router.go          // Регистрация всех HTTP-роутов
    users/                 // Слайс "пользователи"
      dto.go               // DTO-объекты для запросов/ответов
      handler.go           // HTTP-обработчики, связанные с пользователями
      service.go           // Бизнес-логика users
      repository.go        // Работа с БД для users
      model.go             // Доменные сущности users
    orders/                // Слайс "заказы"
      dto.go
      handler.go
      service.go
      repository.go
      model.go
    products/              // Слайс "товары"
      dto.go
      handler.go
      service.go
      repository.go
      model.go
  pkg/
    common/
      errors.go            // Общие типы ошибок
      logger.go            // Логгер
```

Обратите внимание:

- в `internal/users` у вас все, что нужно для работы с пользователями  
- в `internal/orders` — все, что нужно для заказов  
- общее вынесено в `pkg/common`, но его не должно становиться слишком много  

Когда вы добавляете новую фичу, вы создаете новый слайс, а не распыляете логику по трем-четырем общим папкам.

### Пример структуры на frontend (React)

Теперь давайте посмотрим аналогичный подход на фронтенде:

```tsx
// Папки проекта (как комментарий)

src/
  app/
    router.tsx              // Маршрутизация
    store.ts                // Общий store (если нужен)
  features/
    auth/                   // Слайс "аутентификация"
      ui/
        LoginForm.tsx
        RegisterForm.tsx
      model/
        authSlice.ts        // Redux slice или Zustand store
        types.ts
      api/
        authApi.ts          // Вызовы API для auth
    profile/                // Слайс "профиль"
      ui/
        ProfilePage.tsx
        AvatarUploader.tsx
      model/
        profileSlice.ts
        types.ts
      api/
        profileApi.ts
    cart/                   // Слайс "корзина"
      ui/
        CartPage.tsx
      model/
        cartSlice.ts
        types.ts
  shared/
    ui/
      Button.tsx
      Input.tsx
    lib/
      fetcher.ts
```

Здесь каждая фича — это отдельный слайс внутри `features`. Вы видите все, что относится к фиче, в одном месте.

---

## Пример реализации слайса на backend

### Определяем доменную модель

Начнем с простой доменной сущности пользователя в слайсе `users`.

```go
// internal/users/model.go

package users

// User - доменная сущность пользователя
type User struct {
    ID       int64  // Уникальный идентификатор
    Email    string // Почта пользователя
    Password string // Хэш пароля
    Name     string // Имя
}
```

Здесь важно, что модель лежит внутри слайса `users`. Она не находится в общем `models`, потому что ее используют только в контексте пользователей.

### Репозиторий внутри слайса

Покажу вам, как может выглядеть репозиторий для пользователей:

```go
// internal/users/repository.go

package users

import (
    "context"
    "database/sql"
)

// Repository - интерфейс для работы с хранилищем пользователей
type Repository interface {
    Create(ctx context.Context, u *User) error
    GetByEmail(ctx context.Context, email string) (*User, error)
}

// pgRepository - реализация репозитория для PostgreSQL
type pgRepository struct {
    db *sql.DB
}

// NewRepository - конструктор репозитория пользователей
func NewRepository(db *sql.DB) Repository {
    return &pgRepository{db: db}
}

// Create - сохраняет нового пользователя в базу
func (r *pgRepository) Create(ctx context.Context, u *User) error {
    // Здесь мы выполняем INSERT запрос
    _, err := r.db.ExecContext(
        ctx,
        "INSERT INTO users (email, password, name) VALUES ($1, $2, $3)",
        u.Email, u.Password, u.Name,
    )
    return err
}

// GetByEmail - находит пользователя по email
func (r *pgRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
    var u User

    // Здесь мы выполняем SELECT запрос по email
    err := r.db.QueryRowContext(
        ctx,
        "SELECT id, email, password, name FROM users WHERE email = $1",
        email,
    ).Scan(&u.ID, &u.Email, &u.Password, &u.Name)

    if err != nil {
        return nil, err
    }

    return &u, nil
}
```

Репозиторий реализован и используется только внутри `users`. Другим слайсам не нужно знать о деталях реализации.

### Сервис как слой бизнес-логики внутри слайса

Давайте добавим сервис для работы с пользователями:

```go
// internal/users/service.go

package users

import (
    "context"
    "errors"
)

// Service - бизнес-логика для работы с пользователями
type Service interface {
    Register(ctx context.Context, email, password, name string) (*User, error)
    Login(ctx context.Context, email, password string) (*User, error)
}

type service struct {
    repo Repository
    hasher PasswordHasher
}

// PasswordHasher - абстракция для хэширования паролей
type PasswordHasher interface {
    Hash(password string) (string, error)
    Compare(hash, password string) bool
}

// NewService - конструктор сервиса пользователей
func NewService(repo Repository, hasher PasswordHasher) Service {
    return &service{
        repo:   repo,
        hasher: hasher,
    }
}

// Register - регистрирует нового пользователя
func (s *service) Register(ctx context.Context, email, password, name string) (*User, error) {
    // Сначала проверяем, что пользователя с таким email еще нет
    existing, err := s.repo.GetByEmail(ctx, email)
    if err == nil && existing != nil {
        // Пользователь найден - возвращаем ошибку
        return nil, errors.New("user already exists")
    }

    // Хэшируем пароль перед сохранением
    hash, err := s.hasher.Hash(password)
    if err != nil {
        return nil, err
    }

    user := &User{
        Email:    email,
        Password: hash,
        Name:     name,
    }

    // Сохраняем пользователя в репозитории
    if err := s.repo.Create(ctx, user); err != nil {
        return nil, err
    }

    return user, nil
}

// Login - проверяет email и пароль, возвращает пользователя
func (s *service) Login(ctx context.Context, email, password string) (*User, error) {
    // Получаем пользователя по email
    user, err := s.repo.GetByEmail(ctx, email)
    if err != nil {
        return nil, errors.New("invalid credentials")
    }

    // Сравниваем пароль с хэшем
    if !s.hasher.Compare(user.Password, password) {
        return nil, errors.New("invalid credentials")
    }

    return user, nil
}
```

Обратите внимание:

- сервис живет внутри слайса  
- интерфейсы `Repository` и `PasswordHasher` также определены внутри слайса  
- слайс сам определяет свои зависимости и контракт взаимодействия с ними  

### HTTP-обработчики в слайсе

Теперь вы увидите, как это выглядит в коде HTTP-слоя:

```go
// internal/users/handler.go

package users

import (
    "encoding/json"
    "net/http"
)

// Handler - HTTP-обработчики для пользователей
type Handler struct {
    service Service
}

// NewHandler - конструктор HTTP-обработчика
func NewHandler(service Service) *Handler {
    return &Handler{service: service}
}

// RegisterRequest - структура запроса регистрации пользователя
type RegisterRequest struct {
    Email    string `json:"email"`    // Почта пользователя
    Password string `json:"password"` // Пароль в открытом виде
    Name     string `json:"name"`     // Имя
}

// Register - обрабатывает запрос на регистрацию пользователя
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
    var req RegisterRequest

    // Декодируем JSON-тело запроса в структуру
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid request", http.StatusBadRequest)
        return
    }

    // Вызываем бизнес-логику регистрации
    user, err := h.service.Register(r.Context(), req.Email, req.Password, req.Name)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Формируем ответ с ID и email (без пароля)
    resp := map[string]interface{}{
        "id":    user.ID,
        "email": user.Email,
        "name":  user.Name,
    }

    // Кодируем ответ в JSON
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(resp)
}
```

Все, что относится к пользователям, — здесь, в одном слайсе. Вам не нужно прыгать из `handlers/users_handler.go` в `services/user_service.go` и затем в `repositories/user_repo.go` — все рядом.

---

## Настройка маршрутизации и композиции слайсов

### Регистрация роутов

Теперь, когда слайсы готовы, их нужно «собрать» в приложении. Обычно это делается в одном месте — в слое приложения.

```go
// internal/app/http/router.go

package http

import (
    "database/sql"
    "net/http"

    "github.com/gorilla/mux"

    "project/internal/users"
    "project/pkg/common"
)

// NewRouter - создает и настраивает HTTP-роутер приложения
func NewRouter(db *sql.DB, hasher users.PasswordHasher) http.Handler {
    r := mux.NewRouter()

    // Собираем слайс users
    usersRepo := users.NewRepository(db)        // Репозиторий пользователей
    usersService := users.NewService(usersRepo, hasher) // Сервис пользователей
    usersHandler := users.NewHandler(usersService)      // HTTP-обработчик users

    // Регистрируем роуты users
    r.HandleFunc("/api/register", usersHandler.Register).Methods(http.MethodPost)

    // Можно добавить промежуточные слои здесь
    r.Use(common.LoggingMiddleware)

    return r
}
```

Смотрите, я показываю вам важный момент:

- каждый слайс собирается в один «кусок» в точке композиции  
- зависимости (БД, хэшеры, логгеры) передаются в слайс  
- слайс ничего не знает о глобальном контексте приложения  

Таким образом, слайс можно относительно легко вынести в отдельный сервис или модуль при необходимости.

---

## Применение horizontal-slices на frontend

### Фича как слайс

Возьмем фичу «логин» и посмотрим, как ее можно оформить в React-проекте:

```tsx
// src/features/auth/ui/LoginForm.tsx

import React, { useState } from "react"
import { useAuth } from "../model/useAuth"

// LoginForm - форма авторизации пользователя
export const LoginForm = () => {
  const { login, loading, error } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Вызываем метод login из слайса auth
    login(email, password)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Поле email */}
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
      />

      {/* Поле пароль */}
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Пароль"
      />

      {/* Кнопка входа */}
      <button type="submit" disabled={loading}>
        Войти
      </button>

      {/* Показываем ошибку, если она есть */}
      {error && <div>{error}</div>}
    </form>
  )
}
```

Теперь давайте посмотрим модель, которая тоже лежит внутри фичи:

```ts
// src/features/auth/model/useAuth.ts

import { useState } from "react"
import { authApi } from "../api/authApi"

// useAuth - хук для работы с авторизацией
export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // login - выполняет запрос на авторизацию
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      // Отправляем запрос к API авторизации
      await authApi.login({ email, password })
    } catch (e) {
      // В случае ошибки сохраняем сообщение
      setError("Ошибка входа")
    } finally {
      // В любом случае сбрасываем состояние загрузки
      setLoading(false)
    }
  }

  return { login, loading, error }
}
```

И API-слой:

```ts
// src/features/auth/api/authApi.ts

import { httpClient } from "../../../shared/lib/fetcher"

// LoginRequest - тип запроса на логин
type LoginRequest = {
  email: string
  password: string
}

// authApi - функции для работы с API авторизации
export const authApi = {
  // login - отправляет POST-запрос на /api/login
  login: (data: LoginRequest) => {
    return httpClient.post("/api/login", data)
  },
}
```

Все три части — UI, модель и API — находятся внутри одного слайса `auth`. Вам не нужно искать `LoginForm` в одной папке, `authSlice` в другой, а `authApi` в третьей.

---

## Преимущества горизонтальных слайсов

### Локализация изменений

Когда вы меняете какую‑то фичу, вы почти всегда работаете внутри одного слайса:

- изменили доменную модель — тут же обновили DTO и хендлеры  
- добавили правило бизнес-логики — проверили, как это влияет на API этого слайса  

Это уменьшает:

- время навигации по проекту  
- риск затронуть чужую логику  
- количество конфликтов при работе в команде  

### Улучшенная когнитивная нагрузка

Разработчику проще держать в голове одну фичу целиком, чем постоянно переключаться между слоями.  

Смотрите, когда вы открываете папку `users`, вы видите:

- какие кейсы реализованы  
- какие зависимости нужны  
- где находится точка входа (handler, UI, endpoint)  

Это особенно полезно для новичков в проекте.

### Подготовка к масштабированию и микросервисам

Если проект вырастает, вы можете:

- выделить слайс `orders` в отдельный микросервис  
- вынести слайс `billing` в отдельное приложение  

Поскольку зависимости слайса уже относительно локализованы, перенос сделать проще, чем из «монолитной кучи слоев».

---

## Потенциальные минусы и как с ними работать

### Риск дублирования кода

Одна из распространенных претензий — «код дублируется между слайсами».  

Например, вы можете увидеть похожие структуры ошибок, похожие функции валидации и т. д.

Что с этим делать:

1. Не выносите общий код преждевременно.  
   Если вы видите дублирование в двух местах, это еще не всегда сигнал для выделения «общего» модуля.  

2. Выносите только стабилизировавшийся код.  
   Когда одна и та же логика используется в 3+ слайсах и не меняется по смыслу, можно аккуратно вынести ее в `pkg/common` или `shared/lib`.  

3. Оставляйте вариации, если контекст разный.  
   Иногда полезно иметь две похожие, но независимые реализации внутри разных слайсов, чтобы изменения в одной фиче не ломали другую.

### Сложность организации зависимостей между слайсами

Другой типичный вопрос: как один слайс может использовать логику другого?

Например, слайсу `orders` может понадобиться информация о `users`.  

Есть несколько подходов:

- взаимодействие через сервисы (интерфейсы)  
- публикация доменных событий (events)  
- обращение через слой приложения, а не напрямую  

Я покажу вам простой пример с интерфейсом.

```go
// internal/orders/user_provider.go

package orders

import "context"

// UserInfo - минимальная информация о пользователе, нужная для orders
type UserInfo struct {
    ID    int64  // ID пользователя
    Email string // Email пользователя
}

// UserProvider - интерфейс, через который orders получает данные о пользователе
type UserProvider interface {
    GetUserByID(ctx context.Context, id int64) (*UserInfo, error)
}
```

Реализация этого интерфейса может находиться в слайсе `users`, но сам интерфейс определяется в `orders`.  

Таким образом:

- `orders` не зависит конкретно от `users`, только от `UserProvider`  
- `users` может предоставить адаптер `UsersAsUserProvider`  

Это уменьшает связанность и делает архитектуру устойчивее.

---

## Организация слоев внутри слайса

### Внутри слайса все равно есть слои

Важно понимать, что horizontal-slices не отменяют слои как концепцию.  

Вы все равно можете (и часто должны) делить код на:

- слой представления (UI, HTTP, CLI)  
- слой приложения / use-cases  
- слой домена  
- слой инфраструктуры  

Разница в том, что теперь слои сгруппированы по фичам, а не по всему проекту.

Пример структуры одного слайса:

```text
internal/users/
  transport/
    http/
      handler.go        // HTTP-обработчики
  application/
    service.go          // use-cases и сценарии
  domain/
    model.go            // доменные сущности и логика
  infrastructure/
    repository_pg.go    // реализация работы с БД
    cache_redis.go      // реализация кэша
```

Такой подход помогает:

- сохранить четкость разделения ответственности  
- но при этом держать все части конкретной фичи рядом  

### Когда достаточно «плоского» слайса

Не всегда нужна такая детализация. Для маленьких фич вполне достаточно:

- model.go  
- service.go  
- handler.go  
- repository.go  

Если вы видите, что файл растет и становится перегруженным, можно добавить поддиректории внутри слайса и разнести код по слоям.

---

## Переход от слоеной архитектуры к horizontal-slices

### Пошаговая стратегия

Если у вас уже есть проект с классическими слоями, переходить можно постепенно.

1. Выберите одну новую фичу.  
   Реализуйте ее сразу в виде отдельного слайса, не используя старые папки `controllers`, `services`, `repositories`.  

2. Ограничьте зависимости.  
   Новый слайс может временно использовать существующие общие модули, но не должен становиться новой свалкой.  

3. Мигрируйте старые фичи по одной.  
   Когда вы вносите значительные изменения в старую фичу, переносите ее в новый слайс.  

4. Удаляйте «общие» слои по мере опустошения.  
   Когда в `controllers` останется один-два старых контроллера, их можно перенести и удалить папку.  

Так вы избежите большого «рефакторинга ради рефакторинга» и сможете постепенно привести структуру к удобной схеме.

### На что обратить внимание

- Привыкание команды.  
  Для некоторых разработчиков будет необычно, что «все лежит в одной папке». Важно показать им преимущества на конкретных задачах.  

- Обновление документации.  
  При переходе меняется навигация по проекту. Стоит обновить README и внутренние документы по структуре.  

- Линтеры и генераторы.  
  Если у вас много автогенерируемого кода, возможно, нужно будет перенастроить пути генерации под новую структуру.

---

## Практические рекомендации по проектированию слайсов

### Как выделять границы слайсов

Давайте разберемся, по каким критериям вы можете разбивать систему на слайсы:

- по бизнес-домену  
  - пользователи  
  - платежи  
  - заказы  
  - каталог товаров  

- по пользовательским сценариям  
  - регистрация  
  - авторизация  
  - восстановление пароля  

- по bounded context, если вы используете DDD  

Главное — не делать слайсы слишком крупными и слишком мелкими.

Примеры удачных слайсов:

- `billing`  
- `inventory`  
- `notifications`  

Примеры неудачных:

- `utils` (слишком абстрактный)  
- `components` (все подряд)  
- `core` (обычно превращается в свалку всего, что непонятно куда положить)  

### Как именовать слайсы

Рекомендуется:

- использовать термины, понятные бизнесу  
- избегать технических названий вроде `helpers`  
- не смешивать области (`auth_and_payments` — плохая идея)  

Хорошее имя слайса:

- `auth`  
- `profile`  
- `shipment`  

---

## Тестирование в архитектуре horizontal-slices

### Тесты рядом с кодом

Один из удобных подходов — хранить тесты рядом с кодом слайса.  

Пример:

```text
internal/users/
  model.go
  model_test.go          // Тесты доменной логики
  service.go
  service_test.go        // Тесты бизнес-логики
  handler.go
  handler_test.go        // Тесты HTTP-обработчиков
```

Это позволяет:

- сразу видеть, что тестируется в слайсе  
- быстро находить тесты конкретной фичи  

### Моки и заглушки внутри слайса

Для юнит-тестов вы можете создавать моки прямо внутри слайса.

```go
// internal/users/service_test.go

package users

import (
    "context"
    "testing"
)

// mockRepository - простая заглушка репозитория для тестов
type mockRepository struct {
    users map[string]*User
}

func (m *mockRepository) Create(ctx context.Context, u *User) error {
    // Сохраняем пользователя в карте по email
    m.users[u.Email] = u
    return nil
}

func (m *mockRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
    // Возвращаем пользователя из карты
    return m.users[email], nil
}

// mockPasswordHasher - заглушка хэшера для тестов
type mockPasswordHasher struct{}

func (m mockPasswordHasher) Hash(password string) (string, error) {
    // В тестах просто добавляем префикс к паролю
    return "hashed_" + password, nil
}

func (m mockPasswordHasher) Compare(hash, password string) bool {
    // Сравниваем с "захэшированным" значением
    return hash == "hashed_"+password
}

func TestService_Register(t *testing.T) {
    repo := &mockRepository{users: make(map[string]*User)}
    hasher := mockPasswordHasher{}
    svc := NewService(repo, hasher)

    // Пытаемся зарегистрировать нового пользователя
    u, err := svc.Register(context.Background(), "test@example.com", "secret", "John")

    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }

    if u.Email != "test@example.com" {
        t.Errorf("expected email test@example.com, got %s", u.Email)
    }
}
```

Здесь я размещаю пример, чтобы вам было проще понять, как внутри одного слайса и код, и тесты, и моки остаются логически связаны.

---

## Когда horizontal-slices особенно полезны

### Большие монолиты

В крупных монолитных системах слоеная архитектура со временем начинает:

- разрастаться вширь (огромные папки controllers, services)  
- усложнять навигацию  
- поощрять «общие» сервисы, которые делают слишком много  

Горизонтальные слайсы помогают разбить монолит на логические модули, не превращая его сразу в микросервисы.

### Команды, работающие по фичам

Если команда организована вокруг фич (squad-модель), то:

- каждой команде проще отвечать за свой набор слайсов  
- меньше конфликтов в файлах и merge-конфликтов  
- проще выделять ответственность и зоны владения кодом  

Например:

- команда «Платежи» — отвечает за `billing`, `pricing`  
- команда «Каталог» — за `products`, `inventory`  

---

## Заключение

Горизонтальные слайсы — это не «магическая новая архитектура», а более практичный способ организации уже знакомых концепций: слоев, домена, сервисов и транспортов.  

Основная идея проста: группировать код по фичам и доменам, а не по техническим слоям.  

Если резюмировать ключевые моменты:

- каждый слайс содержит полный стек для своей фичи  
- зависимости между слайсами стоит оформлять через интерфейсы и четкие контракты  
- общий код нужно выносить осторожно, только когда он действительно общий  
- тесты и моки удобнее держать рядом с кодом слайса  

Такой подход упрощает навигацию, уменьшает связанность и делает проект более готовым к росту и возможной миграции к микросервисам.

---

## Частозадаваемые технические вопросы

### Как организовать общие миграции БД при использовании horizontal-slices

Часто возникает вопрос, куда класть SQL-миграции. Один из практичных вариантов — использовать отдельный модуль `migrations` на уровне приложения и в нем уже группировать файлы по доменам в названиях. Например  
- `20240101_users_init.sql`  
- `20240102_orders_add_status.sql`  

Инструмент миграций (golang-migrate, Flyway и т. п.) работает с одной папкой, а логика принадлежности к слайсу отражена в имени файла и содержимом. В самих слайсах можно держать описание схемы в виде моделей или комментариев, но не реальные миграции.

### Как разделить DTO и доменные сущности в пределах одного слайса

Рекомендуется явно разделять модели транспортного уровня и доменные. Внутри слайса можно использовать файл `dto.go` или подпапку `transport`, где будут структуры для запросов и ответов. Доменные сущности остаются в `model.go` или `domain`. В хендлерах вы делаете маппинг DTO в доменную модель и обратно. Это помогает избежать протечки технических деталей (например, JSON-тегов) в домен.

### Как подключать к слайсам кэш или брокер сообщений

Инфраструктурные зависимости лучше вводить через интерфейсы в самом слайсе. Например, в `orders` объявляется интерфейс `EventPublisher` или `Cache`, а реализация для Redis или Kafka находится в отдельном пакете инфраструктуры, который подключается при композиции приложения. Слайс знает только о своем интерфейсе, а не о конкретной технологии.

### Как версионировать API в структуре слайсов

Один из удобных вариантов — добавлять уровень версии над слайсами в транспортном слое. Например  
- `internal/users/transport/http/v1/handler.go`  
- `internal/users/transport/http/v2/handler.go`  

Доменная логика и сервисы при этом могут быть общими, если контракт не меняется. Если меняется сама бизнес-логика, можно добавить подпапку `v2` уже на уровне `application` или `domain` для конкретной версии.

### Как поступать с кросс-слайсовыми транзакциями

Если операция затрагивает несколько слайсов (например заказ и списание баланса пользователя), стоит вынести такой сценарий в уровень приложения вне конкретных слайсов. Там можно использовать единый `UnitOfWork` или транзакционный менеджер, вызывая методы сервисов разных слайсов в рамках одной транзакции. Сами слайсы при этом предоставляют атомарные операции, не зная о том, что они участвуют в общей бизнес-транзакции.