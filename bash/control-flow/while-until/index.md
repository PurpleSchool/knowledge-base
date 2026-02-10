---
metaTitle: Циклы while и until в Bash — повторение до условия
metaDescription: Полный разбор while/until в Bash: синтаксис, чтение ввода, бесконечные циклы и безопасный выход.
author: Олег Марков
title: Циклы while/until в Bash — практический разбор
preview: Разберём, когда использовать while и until в Bash, как избежать зависаний и корректно завершать цикл.
---

## while

```bash
count=0
while (( count < 3 )); do
  echo "$count"
  ((count++))
done
```

## until

`until` выполняет тело, пока условие ложно.

```bash
until ping -c 1 example.com >/dev/null 2>&1; do
  echo "Ждём сеть..."
  sleep 2
done
```

## Чтение файла в цикле

```bash
while IFS= read -r line; do
  echo "line=$line"
done < input.txt
```

## Итоги

`while` и `until` удобны для ожиданий, опроса состояния и построчной обработки данных.
