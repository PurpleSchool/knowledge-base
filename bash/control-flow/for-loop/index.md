---
metaTitle: Цикл for в Bash — обход списков, файлов и аргументов
metaDescription: Подробно о цикле for в Bash: перебор массивов, glob-шаблонов, аргументов и безопасная работа с пробелами.
author: Олег Марков
title: Цикл for в Bash — полный практический разбор
preview: Разберём основные формы for в Bash и научимся безопасно обходить данные без типичных ошибок с word splitting.
---

## Базовый for

```bash
for item in one two three; do
  echo "$item"
done
```

## Перебор аргументов

```bash
for arg in "$@"; do
  echo "$arg"
done
```

## Перебор массива

```bash
for f in "${files[@]}"; do
  echo "$f"
done
```

## Итоги

В циклах `for` критичны корректные кавычки и понимание структуры входных данных.
