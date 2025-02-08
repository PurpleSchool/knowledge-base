---
metaTitle: HTTP-запросы в Golang
metaDescription: Разбираемся с HTTP-запросами в языке программирования Go (Golang).
author: Александр Гольцман
title: HTTP-запросы в Golang
preview: В этой статье я покажу, как отправлять GET и POST-запросы, работать с заголовками, обрабатывать ошибки, устанавливать тайм-ауты и запускать собственный HTTP-сервер.
---

# **HTTP-запросы в Golang**

Работа с HTTP-запросами — важная часть взаимодействия с веб-сервисами и API. В языке программирования Go для этого используется встроенный пакет `net/http`, который предоставляет удобные инструменты для отправки запросов, обработки ответов и управления подключениями.

В этой статье я покажу, как отправлять GET и POST-запросы, работать с заголовками, обрабатывать ошибки, устанавливать тайм-ауты и запускать собственный HTTP-сервер.

## **Основы работы с HTTP в Go**

Протокол HTTP (HyperText Transfer Protocol) используется для передачи данных в вебе. Он работает по принципу "клиент-сервер": клиент (например, браузер или программа) отправляет запрос, а сервер отвечает.

Основные методы HTTP-запросов:

- **GET** — используется для получения данных с сервера.
- **POST** — отправляет данные на сервер.
- **PUT** — обновляет данные на сервере.
- **DELETE** — удаляет данные.

Go предлагает мощный стандартный пакет `net/http`, который поддерживает все эти методы и позволяет работать как с клиентской, так и с серверной стороной HTTP.

## **Отправка GET-запросов**

GET-запросы используются, когда нам нужно получить данные с удаленного сервера.

```go
package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    resp, err := http.Get("https://api.example.com/data")
    if err != nil {
        fmt.Println("Ошибка запроса:", err)
        return
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Println("Ошибка чтения ответа:", err)
        return
    }

    fmt.Println("Ответ сервера:", string(body))
}
```

Здесь `http.Get()` выполняет HTTP-запрос, а затем мы читаем ответ. Важно закрывать `resp.Body`, чтобы избежать утечек ресурсов.

## **Отправка POST-запросов**

POST-запросы нужны, когда необходимо передать данные на сервер, например, заполнить форму или создать новую запись в базе.

```go
package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    data := []byte(`{"name": "John", "age": 30}`)
    resp, err := http.Post("https://api.example.com/users", "application/json", bytes.NewBuffer(data))
    if err != nil {
        fmt.Println("Ошибка запроса:", err)
        return
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Println("Ошибка чтения ответа:", err)
        return
    }

    fmt.Println("Ответ сервера:", string(body))
}
```

Здесь данные передаются в формате JSON, а заголовок `Content-Type` сообщает серверу, что это JSON.

## **Использование `http.NewRequest` для гибкости**

Если вам нужно добавить заголовки, авторизацию или использовать другие методы, лучше воспользоваться `http.NewRequest()`.

```go
package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    client := &http.Client{}
    data := []byte(`{"status": "active"}`)

    req, err := http.NewRequest("PUT", "https://api.example.com/update", bytes.NewBuffer(data))
    if err != nil {
        fmt.Println("Ошибка создания запроса:", err)
        return
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer YOUR_TOKEN")

    resp, err := client.Do(req)
    if err != nil {
        fmt.Println("Ошибка отправки запроса:", err)
        return
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Println("Ошибка чтения ответа:", err)
        return
    }

    fmt.Println("Ответ сервера:", string(body))
}
```

Здесь `http.NewRequest()` позволяет нам задать метод, URL, тело запроса и заголовки, а затем выполнить запрос с помощью `client.Do(req)`.

## **Обработка статуса ответа**

После выполнения запроса важно проверить, как сервер его обработал.

HTTP-ответ содержит код состояния, который показывает, как сервер обработал запрос.

Примеры HTTP-статусов:

- **200 OK** — запрос успешно выполнен.
- **201 Created** — ресурс успешно создан.
- **400 Bad Request** — ошибка в запросе.
- **401 Unauthorized** — нужна авторизация.
- **404 Not Found** — ресурс не найден.
- **500 Internal Server Error** — внутренняя ошибка сервера.

Перед тем как обрабатывать тело ответа, проверьте статус:

```go
if resp.StatusCode != http.StatusOK {
    fmt.Println("Ошибка:", resp.Status)
    return
}
```

Это поможет избежать работы с некорректными данными.

## **Установка тайм-аутов**

По умолчанию Go не ограничивает время выполнения HTTP-запросов, поэтому лучше задавать тайм-ауты:

```go
package main

import (
    "fmt"
    "net/http"
    "time"
)

func main() {
    client := &http.Client{
        Timeout: 5 * time.Second,
    }

    resp, err := client.Get("https://api.example.com/data")
    if err != nil {
        fmt.Println("Ошибка запроса:", err)
        return
    }
    defer resp.Body.Close()

    fmt.Println("Запрос выполнен успешно!")
}
```

Тут мы задаём тайм-аут в 5 секунд, чтобы избежать зависания программы.

## **Запуск HTTP-сервера в Go**

Go позволяет не только отправлять запросы, но и создавать собственные HTTP-серверы.

```go
package main

import (
    "fmt"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "Привет, это Go-сервер!")
}

func main() {
    http.HandleFunc("/", handler)
    fmt.Println("Сервер запущен на порту 8080...")
    http.ListenAndServe(":8080", nil)
}
```

Этот сервер отвечает `"Привет, это Go-сервер!"` на все запросы.

## **Заключение**

Работа с HTTP-запросами в Go — это мощный инструмент для взаимодействия с веб-приложениями и API.

### **Ключевые моменты:**

- **Пакет `net/http` предоставляет все необходимое для работы с HTTP.**
- **GET-запросы используются для получения данных, POST — для отправки.**
- **Для более гибкого управления запросами используйте `http.NewRequest()`.**
- **Проверяйте `resp.StatusCode`, чтобы корректно обрабатывать ответы сервера.**
- **Настраивайте `http.Client{Timeout: ...}`, чтобы избежать зависания запросов.**
- **Go позволяет легко запускать HTTP-серверы для обработки входящих запросов.**

В этой статье я показал вам основные техники работы с HTTP в Go. Но возможностей у `net/http` гораздо больше. Например, можно управлять сессиями, работать с куками, кешированием и аутентификацией.
