---
metaTitle: Редиректы и пайпы в Bash — управление stdout/stderr
metaDescription: Практический гайд по потокам в Bash: >, >>, 2>, 2>&1, /dev/null и конвейеры через |.
author: Олег Марков
title: Редиректы и пайпы в Bash — полный разбор
preview: Разберём, как направлять вывод команд в файлы, разделять stdout/stderr и строить пайплайны для автоматизации.
---

## Потоки

- `stdout` (1) — обычный вывод
- `stderr` (2) — ошибки

## Редиректы

```bash
echo "ok" > out.log
echo "next" >> out.log
command 2> err.log
command > all.log 2>&1
```

## Подавление вывода

```bash
command >/dev/null 2>&1
```

## Пайпы

```bash
ps aux | grep nginx | awk '{print $2}'
```

## Итоги

Грамотная работа с потоками делает скрипты удобными для логирования и диагностики.
