---
metaTitle: Директива @layer в CSS. Управление каскадными слоями
metaDescription: Директива @layer в CSS. Управление каскадными слоями
author: Дмитрий Нечаев
title: Директива @layer в CSS. Полное руководство с примерами
preview: CSS предоставляет множество возможностей для стилизации веб-страниц, и одним из новых инструментов для управления приоритетами стилей является директива @layer.
---

CSS предоставляет множество возможностей для стилизации веб-страниц, и одним из новых инструментов для управления приоритетами стилей является директива `@layer`. С её помощью можно создавать и управлять каскадными слоями, что позволяет более чётко контролировать порядок применения стилей. В этой статье мы подробно рассмотрим, как использовать директиву `@layer`, и приведём примеры её применения.

## Основы директивы `@layer`

Директива `@layer` позволяет создавать слои стилей, которые имеют определённый приоритет. Стили в верхних слоях имеют больший приоритет, чем стили в нижних слоях. Это даёт возможность более гибко управлять конфликтующими стилями и упрощает структуру CSS-кода.

### Синтаксис директивы `@layer`

```css
@layer имя_слоя {
    /* CSS-правила */
}

```

### Пример базового использования `@layer`

```css
@layer base {
    body {
        margin: 0;
        padding: 0;
    }
}

@layer layout {
    .container {
        max-width: 1200px;
        margin: 0 auto;
    }
}

@layer components {
    .button {
        background-color: blue;
        color: white;
        padding: 10px 20px;
    }
}

```

В этом примере мы создаём три слоя: `base`, `layout` и `components`. Стили в этих слоях будут применяться в порядке их объявления, если они не конфликтуют между собой.

## Управление приоритетом слоёв

Порядок объявления слоёв влияет на приоритет стилей. Слои, объявленные позже, имеют больший приоритет.

### Пример управления приоритетом слоёв

```css
@layer base, layout, components;

@layer base {
    body {
        margin: 0;
        padding: 0;
        background-color: white;
    }
}

@layer layout {
    .container {
        max-width: 1200px;
        margin: 0 auto;
        background-color: lightgray;
    }
}

@layer components {
    .container {
        background-color: darkgray;
    }

    .button {
        background-color: blue;
        color: white;
        padding: 10px 20px;
    }
}

```

В этом примере слой `components` имеет больший приоритет, чем `layout` и `base`, поэтому фон контейнера будет тёмно-серым, несмотря на стили, заданные в `layout`.

## Использование директивы `@layer` с импортированными стилями

Директива `@layer` может использоваться вместе с директивой `@import` для управления приоритетами стилей, импортированных из других файлов.

### Пример использования с `@import`

```css
@import url('base.css') layer(base);
@import url('layout.css') layer(layout);
@import url('components.css') layer(components);

@layer base {
    body {
        font-family: Arial, sans-serif;
    }
}

@layer layout {
    .header {
        background-color: lightblue;
    }
}

@layer components {
    .header {
        background-color: navy;
        color: white;
    }
}

```

В этом примере стили из файлов `base.css`, `layout.css` и `components.css` импортируются в соответствующие слои, что позволяет чётко управлять их приоритетами.

## Применение директивы `@layer` для создания модульных стилей

Директива `@layer` позволяет разделять стили на модули, что упрощает их поддержку и масштабирование.

### Пример создания модульных стилей

```css
@layer reset, typography, utilities;

@layer reset {
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
}

@layer typography {
    body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
    }

    h1 {
        font-size: 2em;
    }
}

@layer utilities {
    .text-center {
        text-align: center;
    }

    .mt-20 {
        margin-top: 20px;
    }
}

```

В этом примере стили разделены на три слоя: `reset` для сброса базовых стилей, `typography` для типографики и `utilities` для утилитарных классов.

## Заключение

Директива `@layer` в CSS предоставляет мощные возможности для управления каскадными слоями стилей, что позволяет более чётко контролировать порядок их применения и предотвращать конфликты. С её помощью можно создавать модульные и легко поддерживаемые стили, улучшая структуру и читаемость CSS-кода. Освоив использование `@layer`, вы сможете создавать более гибкие и управляемые стили для ваших веб-проектов.