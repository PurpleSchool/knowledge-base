---
metaTitle: Работа с Zap, Logrus, Loki и интеграция с Grafana 
metaDescription: Разбираемся c Zap, Logrus, Loki и интеграция с Grafana 
author: Александр Гольцман
title: Логирование в Golang. Zap, Logrus, Loki, Grafana 
preview: В этой статье я покажу, как использовать их для логирования в Go-приложениях, а также как интегрировать логи с Grafana для удобного анализа.
---

Логирование — важный инструмент для мониторинга и отладки приложений, особенно в продакшене. В Go доступны несколько мощных библиотек для работы с логами, таких как Zap и Logrus. В этой статье я покажу, как использовать их для логирования в Go-приложениях, а также как интегрировать логи с Grafana для удобного анализа.

### Почему логирование важно?

Логирование — это не просто вывод сообщений в консоль. Оно помогает:

- Отслеживать ошибки и предупреждения в коде.
- Анализировать поведение приложения.
- Собирать метрики для диагностики.
- Интегрировать логи с системами мониторинга (Grafana, Loki и др.).

В Go стандартная библиотека предоставляет пакет `log`, но для продакшен-приложений он слишком простой. Смотрите, для расширенных возможностей используются сторонние библиотеки, такие как Zap и Logrus.

Настройка продвинутой системы логирования — важный шаг для обеспечения наблюдаемости приложения. Чтобы понимать, как логирование встраивается в общую картину backend-разработки, необходимо освоить работу с HTTP-серверами, базами данных и микросервисной архитектурой. Если вы хотите детальнее погрузиться в backend разработку на Go — приходите на наш большой курс [Продвинутый Golang](https://purpleschool.ru/course/go-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=logirovanie-v-golang-zap-logrus-loki-grafana). На курсе 179 уроков и 22 упражнения, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Библиотека Zap

Zap — это одна из самых быстрых библиотек для логирования в Go. Она оптимизирована для работы в высоконагруженных приложениях.

### Установка Zap

```
go get go.uber.org/zap
```

### Базовое использование

Смотрите, вот простой пример логирования с Zap:

```go
package main

import (
	"go.uber.org/zap"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	logger.Info("Запуск приложения",
		zap.String("версия", "1.0.0"),
		zap.Int("порт", 8080),
	)
}
```

Здесь я создал продакшен-логгер, который форматирует сообщения в JSON, что удобно для обработки в системах мониторинга.

### Настройка уровней логирования

Zap поддерживает разные уровни логов:

- `Debug` — отладочная информация.
- `Info` — общие сообщения.
- `Warn` — предупреждения.
- `Error` — ошибки, требующие внимания.
- `Fatal` — критические ошибки (после которых программа завершает работу).

Пример использования:

```go
logger.Debug("Отладочное сообщение")
logger.Warn("Предупреждение о возможной проблеме")
logger.Error("Ошибка в работе сервиса")
```

### Библиотека Logrus

Logrus — ещё одна популярная библиотека для логирования, поддерживающая кастомные форматтеры и хуки.

### Установка Logrus

```
go get github.com/sirupsen/logrus
```

### Базовое использование

Вот пример простого логирования с Logrus:

```go
package main

import (
	"github.com/sirupsen/logrus"
)

func main() {
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})

	logger.WithFields(logrus.Fields{
		"версия": "1.0.0",
		"порт":   8080,
	}).Info("Запуск приложения")
}
```

Здесь я использую JSON-форматтер, чтобы логировать данные в удобном для парсинга виде.

### Настройка уровней логирования

Logrus также поддерживает уровни логов:

```go
logger.Debug("Отладочная информация")
logger.Info("Общая информация")
logger.Warn("Предупреждение")
logger.Error("Ошибка")
logger.Fatal("Фатальная ошибка")
```

### Интеграция логов с Grafana через Loki

Grafana — мощный инструмент для визуализации данных, а для логирования можно использовать её связку с Loki.

### Установка Loki и Promtail

Для сбора и хранения логов понадобится Loki и Promtail. Установить их можно через Docker:

```
docker run -d --name=loki -p 3100:3100 grafana/loki
docker run -d --name=promtail -v /var/log:/var/log grafana/promtail
```

Promtail собирает логи с сервера и отправляет их в Loki, откуда Grafana может их визуализировать.

### Настройка отправки логов в Loki

Для отправки логов в Loki можно использовать библиотеку [loki-logrus](https://github.com/sirupsen/logrus) или настроить отправку через Promtail.

Пример отправки логов в Loki с Logrus:

```go
hook, err := logrus_loki.NewBatchLokiHook("http://localhost:3100/api/prom/push", nil, logrus.DebugLevel, &logrus.JSONFormatter{})
if err == nil {
    logger.AddHook(hook)
}
```

После этого все логи из Go-приложения можно просматривать в Grafana.

### Заключение

Логирование — важная часть работы с Go-приложениями. В этой статье я показал, как использовать Zap и Logrus, а также как интегрировать логи с Grafana через Loki.

Если вы работаете с высоконагруженными системами, Zap подойдёт лучше. Если важна гибкость и кастомизация, Logrus — хороший выбор. А интеграция с Grafana позволит удобно анализировать логи в реальном времени.

Теперь, когда вы знаете о различных инструментах логирования, самое время задуматься о построении надежной инфраструктуры для хранения и анализа логов. Чтобы систематизировать свои знания Go и научиться писать отказоустойчивые backend решения, обратите внимание на курс [Продвинутый Golang](https://purpleschool.ru/course/go-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=logirovanie-v-golang-zap-logrus-loki-grafana). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в Go прямо сегодня и станьте уверенным разработчиком.
