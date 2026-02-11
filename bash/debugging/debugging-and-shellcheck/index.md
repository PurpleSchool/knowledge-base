---
metaTitle: Отладка Bash — bash -x, strict mode и ShellCheck
metaDescription: "Полный разбор отладки Bash-скриптов: трассировка, set -euo pipefail, shellcheck и диагностика сложных багов."
author: Олег Марков
title: Отладка Bash-скриптов — практический разбор
preview: Научимся быстро находить ошибки в Bash с помощью bash -x, логирования и линтера ShellCheck.
---

## Быстрая диагностика

Проверка синтаксиса:

```bash
bash -n script.sh
```

Трассировка выполнения:

```bash
bash -x script.sh arg1 arg2
```

## Strict mode

```bash
set -euo pipefail
```

Этот режим отлавливает множество классов ошибок на ранней стадии.

## ShellCheck

```bash
shellcheck script.sh
```

Линтер подсказывает проблемы с quoting, массивами, подстановками и переносимостью.

## Практики

- Логируй ключевые шаги.
- Добавляй понятные сообщения об ошибках в `stderr`.
- Минимизируй «магические» глобальные переменные.

## Итоги

Комбинация `bash -n`, `bash -x`, strict mode и ShellCheck покрывает почти все повседневные проблемы в Bash-скриптах.
