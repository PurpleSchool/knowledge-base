---
metaTitle: Ошибка exited (1) в Docker
metaDescription: Узнайте, как решать проблему exited (1) в Docker и успешно управлять контейнерами, избегая сбоев и повышая устойчивость приложений
author: Олег Марков
title: Ошибка exited (1) в Docker
preview: Разберитесь в причинах появления ошибки exited (1) в Docker и научитесь устранять её, чтобы ваши контейнеры работали без сбоев. Примеры и советы помогут минимизировать возникновение ошибки
---

## Введение

Docker — это мощный инструмент контейнеризации, который упрощает доставку, тестирование и развертывание приложений, изолированных друг от друга. Однако при работе с Docker вы можете столкнуться с проблемой, когда ваш контейнер неожиданно завершает свою работу и выдает код возврата 1, что приводит к ошибке "exited (1)". В этой статье мы рассмотрим причины возникновения этой ошибки и пути ее устранения, чтобы ваши контейнеры работали надлежащим образом.

### Что такое ошибка `exited (1)`?

Ошибка `exited (1)` в Docker обычно свидетельствует о том, что ваш контейнер завершился с кодом возврата 1. Код возврата в Unix-системах указывает на успешное или неуспешное завершение работы программы. Код 0 обычно означает успех, в то время как любой ненулевой код указывает на ошибку. В случае с Docker, `exited (1)` означает, что приложение внутри контейнера завершилось с ошибкой.

Ошибка `exited (1)` указывает на то, что процесс внутри контейнера завершился с ошибкой. Для ее решения необходимо понимать, как отлаживать приложения внутри контейнера. Если вы хотите детальнее погрузиться в Docker, узнать про Docker volumes, Docker-compose, Docker registry — приходите на наш большой курс [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Oshibka_exited_(1)_v_Docker). На курсе 159 уроков и 7 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Почему возникает ошибка `exited (1)`?

### Неправильная команда start

Когда вы пытаетесь запустить контейнер с неправильной или отсутствующей командой start, это приводит к его немедленному завершению с ошибкой. Удостоверьтесь, что указанная команда действительно существует и правильно находится в образе Docker.

```dockerfile
# Пример неправильной команды в Dockerfile
CMD ["nonexistent_command"]
```

### Ошибка в приложении

Если ваша программа внутри контейнера имеет ошибку, она может привести к неожиданному завершению. Это может быть сбой инициализации, ошибка в коде или несогласованность конфигурации.

```bash
# Проверка логов контейнера
docker logs <container_id>
```

Логи помогут вам определить, что именно произошло с приложением.

### Проблемы с зависимостями

Ваше приложение может полагаться на определенные зависимости, которые не установлены в контейнере. Это приведет к невозможности запуска программы и, соответственно, к ошибке завершения.

```dockerfile
# Убедитесь, что все зависимости установлены
RUN apt-get update && apt-get install -y dependency1 dependency2
```

### Неправильная конфигурация Dockerfile

Ошибка в вашем Dockerfile также может стать причиной странного поведения контейнера. Проверьте строки, определяющие рабочую директорию, команды копирования и запуск приложения, чтобы избежать ошибок.

```dockerfile
# Приведем Dockerfile в порядок
WORKDIR /app
COPY . /app
CMD ["python", "main.py"]
```

После проверки и исправления вашего Dockerfile, перезапустите сборку и контейнеры.

### Неправильные разрешения

Неправильные разрешения на файлы и каталоги внутри контейнера могут вызвать ошибку запуска. Проверьте, есть ли у приложения достаточные права для доступа к необходимым файлам или папкам.

```dockerfile
# Установка правильных разрешений
RUN chmod +x /path/to/executable
```

## Устранение ошибок `exited (1)`

### Пошаговая отладка

1. **Запустите контейнер в интерактивном режиме**. Это позволит вам получить доступ к окружению Docker и выяснить, что идет не так.

   ```bash
   docker run -it <image> /bin/bash
   ```

2. **Проверьте логи контейнера**. Журналы обычно содержат подсказки о том, что произошло не так.

   ```bash
   docker logs <container_id>
   ```

3. **Проверьте команду стартового процесса**. Убедитесь, что команда, указанная в CMD или ENTRYPOINT, корректна.

4. **Проверьте конфигурацию вашего Dockerfile**. Вы можете обнаружить проблемы в работоспособности оригинального Dockerfile.

5. **Используйте exit code**. Код возврата может подсказать, с какой ошибкой завершилась программа.

   ```bash
   echo $?
   ```

## Заключение

Ошибка `exited (1)` в Docker является распространенной проблемой, но, вооружившись правильными инструментами и знаниями, вы сможете легко с ней справиться. Помните, что причина может скрываться как в вашей программе, так и в конфигурации контейнера. Используя методы отладки и следуя советам из этой статьи, вы будете готовы максимально быстро и эффективно решать возникающие сложности. Контейнеризация — это мощный инструмент, и понимание ошибок и путей их устранения сделает ваш опыт работы с Docker еще более полезным и приятным.

Чтобы избежать ошибки `exited (1)`, важно правильно разрабатывать приложения и обрабатывать ошибки. На нашем курсе [Docker + Ansible - с нуля](https://purpleschool.ru/course/docker?utm_source=knowledgebase&utm_medium=text&utm_campaign=Oshibka_exited_(1)_v_Docker) вы узнаете, как это делать. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в Docker и Ansible прямо сегодня.
