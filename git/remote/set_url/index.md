---
metaTitle: Изменение URL удаленного репозитория в Git - git remote set-url
metaDescription: Подробное руководство по изменению URL удаленного репозитория в Git - разбор команды git remote set-url типичные сценарии и примеры
author: Олег Марков
title: Изменение URL удаленного репозитория в Git - git remote set-url
preview: Узнайте как с помощью git remote set-url правильно изменить адрес удаленного репозитория рассмотрим переход с HTTPS на SSH смену хостинга и работу с несколькими remotes
---

## Введение

Изменение URL удаленного репозитория в Git — одна из тех операций, с которыми почти каждый разработчик сталкивается рано или поздно. Например, вы перенесли репозиторий с GitHub на GitLab, включили доступ по SSH вместо HTTPS или просто переименовали проект на сервере. Во всех этих случаях локальный репозиторий продолжит ссылаться на старый адрес и начнет выдавать ошибки при `git push` и `git pull`.

Смотрите, я покажу вам, как с помощью команды `git remote set-url` аккуратно изменить URL, не создавая новый репозиторий и не ломая существующую историю. Мы разберем типичные сценарии, покажем примеры и обсудим, какие ошибки чаще всего возникают и как их избежать.

---

## Что такое удаленный репозиторий и remote в Git

Прежде чем менять URL, важно понимать, что именно вы меняете.

### Понятие удаленного репозитория

Удаленный репозиторий (remote repository) — это версия вашего репозитория, которая находится где-то в сети:

- на GitHub, GitLab, Bitbucket;
- на корпоративном Git-сервере;
- на другом сервере с доступом по SSH или HTTP(S).

Локальный репозиторий хранится у вас на машине (в скрытой папке `.git`), а удаленный — на сервере. Команды `git push` и `git pull` работают именно с удаленным репозиторием.

### Что такое remote в терминах Git

В Git remote — это просто именованная ссылка на URL удаленного репозитория. Обычно:

- `origin` — основной удаленный репозиторий, созданный по умолчанию при клонировании;
- могут быть и другие remote, например:
  - `upstream` — оригинальный репозиторий, если вы сделали fork;
  - `backup` — дополнительный репозиторий для резервного копирования.

Посмотреть список remote можно так:

```bash
git remote -v
# origin  git@github.com:user/project.git (fetch)   // URL для получения изменений
# origin  git@github.com:user/project.git (push)    // URL для отправки изменений
```

Каждый remote имеет свой URL. Именно его вы будете менять с помощью `git remote set-url`.

---

## Команда git remote set-url — базовый синтаксис

Команда `git remote set-url` позволяет изменить URL, привязанный к конкретному remote.

Базовый синтаксис:

```bash
git remote set-url <имя-remote> <новый-URL>
```

Где:

- `<имя-remote>` — обычно `origin`, но может быть любое другое имя;
- `<новый-URL>` — новый путь до удаленного репозитория (SSH или HTTPS).

Пример:

```bash
git remote set-url origin git@github.com:user/new-project.git
// Меняем URL для remote origin на новый SSH-адрес
```

После этого команда `git push origin main` будет отправлять данные уже по новому адресу.

---

## Просмотр текущих URL удаленных репозиториев

Прежде чем что-то менять, лучше убедиться, какие remote уже настроены.

### Список всех remote с URL

```bash
git remote -v
// Показывает все удаленные репозитории и их URL
```

Пример вывода:

```bash
origin  https://github.com/user/old-project.git (fetch)
origin  https://github.com/user/old-project.git (push)
upstream  git@github.com:org/main-repo.git (fetch)
upstream  git@github.com:org/main-repo.git (push)
```

Здесь вы видите:

- два remote: `origin` и `upstream`;
- для каждого указаны URL для `fetch` и `push`.

### Получение URL только одного remote

Если вам нужно посмотреть URL конкретного remote:

```bash
git remote get-url origin
// Показывает URL, привязанный к remote origin (обычно для fetch)
```

Можно вывести URL сразу для всех:

```bash
git remote get-url --all origin
// Покажет URL для fetch и push, если они отличаются
```

---

## Типичные сценарии использования git remote set-url

Давайте разберем самые частые ситуации, когда вам нужно изменить URL удаленного репозитория.

### 1. Переезд репозитория на другой хостинг

Например, вы перенесли проект с GitHub на GitLab.

Старый URL:

```bash
https://github.com/user/project.git
```

Новый URL:

```bash
git@gitlab.com:user/project.git
```

Пошагово:

```bash
git remote -v
// Проверяем текущий URL

git remote set-url origin git@gitlab.com:user/project.git
// Меняем URL для origin на адрес GitLab

git remote -v
// Убеждаемся, что URL обновился
```

Теперь все `git push` и `git pull` будут работать с GitLab.

### 2. Переход с HTTPS на SSH (или наоборот)

Многие начинают работать с Git по HTTPS, а позже переходят на SSH для удобства (чтобы не вводить пароль каждый раз).

#### Переход HTTPS → SSH

Старый URL:

```bash
https://github.com/user/project.git
```

Новый URL:

```bash
git@github.com:user/project.git
```

Команда:

```bash
git remote set-url origin git@github.com:user/project.git
// Переключаем origin на SSH-URL
```

#### Переход SSH → HTTPS

Старый URL:

```bash
git@github.com:user/project.git
```

Новый URL:

```bash
https://github.com/user/project.git
```

Команда:

```bash
git remote set-url origin https://github.com/user/project.git
// Переключаем origin на HTTPS-URL
```

> Обратите внимание  
> Формат SSH и HTTPS URL отличается, но Git одинаково хорошо понимает оба варианта, если вы корректно настроили доступ.

### 3. Переименование или перенос репозитория на том же сервере

Бывает, что репозиторий просто переименовали, не меняя хостинг:

- было: `https://git.company.com/team/old-name.git`
- стало: `https://git.company.com/team/new-name.git`

В этом случае:

```bash
git remote set-url origin https://git.company.com/team/new-name.git
// Меняем только путь, хост остается прежним
```

---

## Изменение URL только для fetch или только для push

Иногда вам нужно, чтобы Git получал изменения (`fetch`) из одного места, а отправлял (`push`) — в другое. Это менее распространенный, но вполне рабочий сценарий.

Например:

- вы читаете изменения из центрального репозитория компании;
- пушите их в свой форк.

### Разные URL для fetch и push

Смотрите, я покажу вам схему:

- `fetch`: `git@github.com:company/project.git`
- `push`: `git@github.com:your-account/project.git`

Настроить это можно так:

```bash
git remote set-url --fetch origin git@github.com:company/project.git
// Устанавливаем URL для получения изменений

git remote set-url --push origin git@github.com:your-account/project.git
// Устанавливаем URL для отправки изменений
```

Проверяем:

```bash
git remote -v
// origin  git@github.com:company/project.git (fetch)
// origin  git@github.com:your-account/project.git (push)
```

Теперь вы:

- получаете обновления из репозитория компании;
- отправляете свои изменения в собственный форк.

### Восстановление одного URL и для fetch, и для push

Если вы хотите вернуть одинаковый URL для обоих направлений:

```bash
git remote set-url origin git@github.com:your-account/project.git
// Этот URL будет использоваться и для fetch и для push
```

После этого `git remote -v` покажет одинаковые строки для обеих операций.

---

## Добавление и переименование remote против изменения URL

Иногда вместо `git remote set-url` лучше использовать другие команды. Давайте разберем, когда что применять.

### Когда использовать git remote set-url

Используйте `git remote set-url`, если:

- только URL изменился, а логика работы с remote осталась прежней;
- вы просто переехали на другой сервер;
- поменялся протокол (SSH ↔ HTTPS), но сам репозиторий тот же.

Тогда достаточно одной команды:

```bash
git remote set-url origin <новый-URL>
```

### Когда лучше добавить новый remote

Если вы хотите работать с двумя разными удаленными репозиториями одновременно, правильнее не менять URL, а добавить новый remote:

```bash
git remote add backup git@gitlab.com:user/project-backup.git
// Добавляем дополнительный удаленный репозиторий backup
```

Теперь:

- `origin` — основной;
- `backup` — дополнительный, например, для резервного копирования.

Отправка в конкретный remote:

```bash
git push origin main
// Отправляем изменения в origin

git push backup main
// Отправляем те же изменения в резервный репозиторий backup
```

### Когда переименовать remote (git remote rename)

Если вам нужно просто поменять имя remote (например, из `origin` в `github`), используйте:

```bash
git remote rename origin github
// Меняем имя remote origin на github, URL при этом не меняется
```

А затем при необходимости меняйте его URL:

```bash
git remote set-url github git@github.com:user/project.git
// Обновляем адрес для нового имени remote
```

---

## Пошаговые примеры и разбор команд

Теперь давайте разберем несколько практических сценариев от начала до конца.

### Сценарий 1. Репозиторий склонирован по HTTPS, вы хотите перейти на SSH

1. Проверяем текущий URL:

   ```bash
   git remote -v
   // origin  https://github.com/user/project.git (fetch)
   // origin  https://github.com/user/project.git (push)
   ```

2. Получаем SSH-URL с GitHub (на странице репозитория выбираете вариант `SSH`):

   ```bash
   git@github.com:user/project.git
   ```

3. Меняем URL:

   ```bash
   git remote set-url origin git@github.com:user/project.git
   // Теперь origin будет использовать SSH
   ```

4. Проверяем:

   ```bash
   git remote -v
   // origin  git@github.com:user/project.git (fetch)
   // origin  git@github.com:user/project.git (push)
   ```

5. Тестируем push:

   ```bash
   git push origin main
   // Если SSH-ключ настроен правильно, push пройдет без запроса логина и пароля
   ```

### Сценарий 2. Клонирование форка и настройка upstream

Представьте, что вы сделали форк репозитория на GitHub и склонировали его:

```bash
git clone git@github.com:your-name/project.git
// origin указывает на ваш форк
```

Дальше вы хотите:

- получать изменения из оригинального репозитория;
- отправлять свои изменения только в форк.

1. Добавляем `upstream`:

   ```bash
   git remote add upstream git@github.com:original-owner/project.git
   // Добавляем новый remote upstream с URL оригинального репозитория
   ```

2. Проверяем:

   ```bash
   git remote -v
   // origin   git@github.com:your-name/project.git (fetch)
   // origin   git@github.com:your-name/project.git (push)
   // upstream git@github.com:original-owner/project.git (fetch)
   // upstream git@github.com:original-owner/project.git (push)
   ```

3. Теперь можно:

   ```bash
   git fetch upstream
   // Получаем изменения из оригинального репозитория

   git merge upstream/main
   // Вливаем их в свою ветку main
   ```

В этом сценарии `git remote set-url` вам пригодится, если позже адрес форка или оригинального репозитория изменится.

### Сценарий 3. Переезд с одного корпоративного Git-сервера на другой

Предположим:

- раньше репозиторий жил на `git.old-company.com`;
- теперь его перенесли на `git.new-company.com`.

1. Было:

   ```bash
   git remote -v
   // origin  ssh://git@git.old-company.com/team/project.git (fetch)
   // origin  ssh://git@git.old-company.com/team/project.git (push)
   ```

2. Станет:

   ```bash
   git remote set-url origin ssh://git@git.new-company.com/team/project.git
   // Обновляем URL на новый сервер
   ```

3. Проверяем:

   ```bash
   git remote -v
   // origin  ssh://git@git.new-company.com/team/project.git (fetch)
   // origin  ssh://git@git.new-company.com/team/project.git (push)
   ```

4. Тестируем связь:

   ```bash
   git ls-remote origin
   // Команда должна вывести список ссылок на ветки и теги на удаленном сервере
   ```

---

## Типичные ошибки и как их избежать

Здесь я размещаю несколько распространенных ситуаций, с которыми часто сталкиваются разработчики при изменении URL.

### Ошибка 1. Неправильное имя remote

Команда:

```bash
git remote set-url orgin git@github.com:user/project.git
// Ошибка в имени remote: orgin вместо origin
```

Git выдаст ошибку:

```text
error: No such remote 'orgin'
```

Решение:

1. Посмотрите список remote:

   ```bash
   git remote -v
   // Убедитесь, как именно называется remote
   ```

2. Введите команду с корректным именем:

   ```bash
   git remote set-url origin git@github.com:user/project.git
   ```

### Ошибка 2. Отсутствие прав доступа к новому URL

Команда:

```bash
git remote set-url origin git@github.com:user/private-project.git
git push origin main
```

А в ответ вы получаете ошибку доступа:

```text
Permission denied (publickey).
fatal: Could not read from remote repository.
```

Чаще всего это значит:

- SSH-ключ не добавлен на сервер;
- или у вашего пользователя нет прав к этому репозиторию.

Мини-инструкция:

1. Проверьте SSH-ключи:

   ```bash
   ssh -T git@github.com
   // Должно быть сообщение о успешной аутентификации
   ```

2. Если ключ не настроен — сгенерируйте новый и добавьте в аккаунт Git-сервиса.
3. Убедитесь, что ваш пользователь действительно имеет доступ к репозиторию.

### Ошибка 3. Смена протокола, заблокированного в сети

Иногда в корпоративной сети:

- HTTPS разрешен, SSH заблокирован;
- или наоборот.

Если вы меняете URL с HTTPS на SSH и после этого команды `git fetch` или `git push` зависают или выдают сетевые ошибки, возможно, протокол заблокирован.

Решение:

- вернуться на разрешенный протокол:

  ```bash
  git remote set-url origin https://git.company.com/team/project.git
  // Меняем URL обратно на HTTPS
  ```

- или настроить прокси/SSH-туннель, если это допускается политикой компании.

### Ошибка 4. Несовпадение ожидаемого репозитория

Бывает, что URL вы указали корректный по синтаксису, но репозиторий на сервере другой. В результате:

- ветки и история не совпадают с тем, что вы ожидали;
- появляются конфликты и неожиданные изменения.

Проверка:

```bash
git remote show origin
// Можно увидеть список веток и детализацию по удаленному репозиторию
```

Если это «не тот» репозиторий — просто укажите правильный URL:

```bash
git remote set-url origin <правильный-URL>
```

---

## Рекомендации по безопасной смене URL

Чтобы изменение URL прошло без лишних сюрпризов, удобно придерживаться простой последовательности действий.

### Шаг 1. Всегда сначала смотрите, что у вас уже настроено

```bash
git remote -v
// Понимание текущего состояния — первый шаг к безопасным изменениям
```

### Шаг 2. Сохраняйте старый URL отдельно (на случай отката)

Перед тем как менять URL, можно скопировать старый адрес в заметки или хотя бы сохранить вывод:

```bash
git remote get-url origin
// Скопируйте URL, чтобы при необходимости быстро вернуть все назад
```

Если что-то пошло не так, вы легко восстановите предыдущее состояние:

```bash
git remote set-url origin <старый-URL>
```

### Шаг 3. После изменения — обязательно проверяйте

Сразу после `git remote set-url`:

```bash
git remote -v
// Убедитесь, что URL действительно обновился
```

А затем:

```bash
git ls-remote origin
// Быстрая проверка связи с сервером без изменения истории
```

### Шаг 4. Отдельно проверяйте доступ (SSH / HTTPS)

Если вы поменяли протокол:

- для HTTPS — проверьте логин/пароль или токен;
- для SSH — проверьте ключи.

Это позволяет избежать ситуации, когда вы замечаете проблему только в момент критического `git push`.

---

## Краткая «шпаргалка» по git remote set-url

Давайте соберем все основные варианты использования в одном месте.

### Основные команды

Изменить URL для origin:

```bash
git remote set-url origin <новый-URL>
// Изменить URL для указанного remote
```

Установить разные URL для fetch и push:

```bash
git remote set-url --fetch origin <URL-для-fetch>
// URL для получения обновлений

git remote set-url --push origin <URL-для-push>
// URL для отправки изменений
```

Посмотреть текущий URL:

```bash
git remote get-url origin
// Один URL (обычно для fetch)

git remote get-url --all origin
// Все URL (fetch и push)
```

Добавить новый remote:

```bash
git remote add backup <URL>
// Создать новый remote с именем backup
```

Переименовать remote:

```bash
git remote rename origin github
// Переименовать существующий remote
```

Удалить remote (если он больше не нужен):

```bash
git remote remove backup
// Удалить remote backup из конфигурации
```

---

Изменение URL удаленного репозитория с помощью `git remote set-url` — это аккуратный и безопасный способ обновить конфигурацию без пересоздания репозитория и без потери истории. Если вы заранее проверяете текущие настройки, сохраняете старый URL и тестируете соединение после изменений, эта операция становится простой и предсказуемой даже в сложных проектах с несколькими удаленными репозиториями.

---

## Частозадаваемые технические вопросы по теме

### Вопрос 1. Как вернуть старый URL, если я случайно его изменил и не запомнил

Если терминал еще не закрыт, можно пролистать историю команд и найти предыдущий вывод `git remote -v`. Если история недоступна, но у коллег остался тот же репозиторий, можно попросить их выполнить:

```bash
git remote get-url origin
// На их машине будет старый URL
```

После этого на своей машине выполните:

```bash
git remote set-url origin <этот-URL>
// Восстанавливаем прежний адрес
```

---

### Вопрос 2. Можно ли использовать разные URL для нескольких push-адресов одновременно

Да, Git поддерживает несколько push-URL для одного remote. Например:

```bash
git remote set-url --add --push origin git@github.com:user/project.git
git remote set-url --add --push origin git@gitlab.com:user/project.git
// Добавляем два адреса для push
```

Проверить:

```bash
git remote -v
// origin ... (fetch)
// origin git@github.com:user/project.git (push)
// origin git@gitlab.com:user/project.git (push)
```

Теперь `git push origin main` отправит изменения на оба URL.

---

### Вопрос 3. Как полностью удалить URL и оставить remote без адреса

Обычно это не нужно, но технически можно удалить remote целиком:

```bash
git remote remove origin
// Удаляем remote вместе с его URL
```

Если вам нужно временно отключить доступ, лучше просто поменять URL на заведомо нерабочий или ограничить доступ на сервере.

---

### Вопрос 4. Как изменить URL только для одной локальной копии, не затрагивая других разработчиков

URL хранится локально в вашей папке `.git/config`. Изменение через `git remote set-url` влияет только на ваш локальный репозиторий и не меняет настройки у других. Ничего дополнительно делать не нужно — просто выполните команду у себя:

```bash
git remote set-url origin <ваш-URL>
```

Коллеги продолжат работать со своими URL.

---

### Вопрос 5. Можно ли изменить URL напрямую в файле .git/config

Да, можно, но это менее безопасно. В файле `.git/config` есть блок:

```ini
[remote "origin"]
    url = git@github.com:user/project.git
    fetch = +refs/heads/*:refs/remotes/origin/*
```

Вы можете вручную заменить значение `url`, но рекомендуемый путь — использовать:

```bash
git remote set-url origin <новый-URL>
// Git сам корректно обновит конфигурацию
```