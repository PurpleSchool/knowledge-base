---
metaTitle: Работа с cookie в Golang
metaDescription: Узнайте как работа с cookie в Golang упрощается благодаря стандартной библиотеке - примеры использования и основные функции для эффективного манипулирования cookie
author: Олег Марков
title: Работа с cookie в Golang
preview: Управление cookie в языках программирования всегда было актуальной задачей- узнайте как Golang делает это легко и эффективно
---

## Введение

Управление cookie в веб-приложениях всегда было важным аспектом, и Golang делает этот процесс достаточно простым благодаря своей стандартной библиотеке. Cookie помогают сохранять состояние между HTTP-запросами, что позволяет, например, отслеживать сессии пользователей, сохранять настройки сайта и многое другое. В этой статье мы погрузимся в детали работы с cookie в Golang, чтобы вы могли максимально эффективно использовать их в ваших приложениях.

## Работа с cookie в Golang

Golang предоставляет все необходимое для работы с cookie в своем базовом пакете `net/http`. Давайте разберем основные аспекты и методы, которые помогут вам в создании и управлении cookie.

### Создание cookie

Создание cookie в Go осуществляется достаточно просто. Для этого используется структура `http.Cookie`, которая содержит всю необходимую информацию о cookie, такую как имя, значение, домен, путь и другие свойства.

```go
// Здесь мы создаем новое cookie с именем "session_token"
cookie := &http.Cookie{
    Name:     "session_token",     // Название cookie
    Value:    "xyz123",            // Значение cookie
    Path:     "/",                 // Путь, для которого cookie применяется
    HttpOnly: true,                // Cookie доступно только через HTTP(S), а не JavaScript
}
```

### Установка cookie в браузер

После создания cookie, следующим шагом является его отправка клиенту, чтобы браузер мог сохранить его. Это делается посредством метода `SetCookie` объекта `http.ResponseWriter`.

```go
http.HandleFunc("/set", func(w http.ResponseWriter, r *http.Request) {
    // Устанавливаем cookie в браузер
    http.SetCookie(w, cookie)
    w.Write([]byte("Cookie установлено!"))
})
```

### Чтение cookie

Чтение cookie из запроса — это также просто, как и его создание. В Golang для этого используется метод `Cookie` объекта `http.Request`, который возвращает cookie по указанному имени.

```go
http.HandleFunc("/get", func(w http.ResponseWriter, r *http.Request) {
    // Извлекаем cookie с именем "session_token"
    cookie, err := r.Cookie("session_token")
    if err != nil {
        w.Write([]byte("Не удалось найти cookie"))
        return
    }
    w.Write([]byte("Cookie значение: " + cookie.Value))
})
```

### Удаление cookie

Удаление cookie заключается в установке его срока действия в прошлое. Это гарантирует, что браузер удалит cookie.

```go
http.HandleFunc("/delete", func(w http.ResponseWriter, r *http.Request) {
    // Устанавливаем срок действия cookie в прошлое для его удаления
    expiredCookie := &http.Cookie{
        Name:    "session_token",
        Value:   "",
        Path:    "/",
        Expires: time.Unix(0, 0), // Устанавливаем дату истечения в прошлое
        MaxAge:  -1,
    }
    http.SetCookie(w, expiredCookie)
    w.Write([]byte("Cookie удалено!"))
})
```

### Дополнительные свойства cookie

Cookie в Golang могут содержать множество дополнительных свойств, которые существенно влияют на их поведение, таких как `Secure`, `SameSite`, `MaxAge`. Давайте кратко рассмотрим, что они делают:

- `Secure`: если установлено в `true`, cookie будут передаваться только по HTTPS.
- `SameSite`: политика защиты от csrf-атак, может быть значением `Lax`, `Strict` или `None`.
- `MaxAge`: время жизненного цикла cookie в секундах.

#### Пример:

```go
cookie := &http.Cookie{
    Name:     "example",
    Value:    "12345",
    Path:     "/",
    Domain:   "example.com",
    Expires:  time.Now().Add(48 * time.Hour), // Срок действия cookie 48 часов
    Secure:   true,                           // Cookie передается только через HTTPS
    HttpOnly: true,                           // Доступно только через HTTP(S)
    SameSite: http.SameSiteStrictMode,        // Строгий режим для защиты от CSRF атак
}
```

Как видите, Golang предоставляет множество возможностей для управления cookie, что упрощает разработку безопасных и эффективных веб-приложений.

В заключение, работа с cookie в Golang интуитивно понятна благодаря пакету `net/http`. Управление состоянием и безопасностью веб-приложений становится проще, если вы умеете правильно и эффективно работать с cookie. Надеюсь, эта статья помогла вам разобраться в основных методах и функциях, необходимых для управления cookie в ваших проектах.