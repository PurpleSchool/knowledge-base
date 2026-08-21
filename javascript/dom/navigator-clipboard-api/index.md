---
metaTitle: "JavaScript Clipboard API: работа с буфером обмена"
metaDescription: "Руководство по navigator.clipboard API: как читать и записывать текст и изображения в буфер обмена JavaScript с примерами кода."
author: "Антон Ларичев"
title: "JavaScript navigator.clipboard API"
preview: "Как использовать navigator.clipboard API для работы с буфером обмена в браузере: методы readText, writeText, read и write с практическими примерами."
---

## Что такое Clipboard API

Clipboard API — это современный браузерный интерфейс, позволяющий программно читать и записывать данные в системный буфер обмена. Он доступен через объект `navigator.clipboard` и предоставляет асинхронные методы для работы с текстом, изображениями и произвольными данными.

В отличие от устаревшего `document.execCommand('copy')`, новый API:
- Работает асинхронно и возвращает промисы
- Поддерживает не только текст, но и изображения и другие форматы
- Требует явного предоставления разрешений пользователем
- Доступен только в защищённых контекстах (HTTPS или localhost)

```javascript
// Проверка поддержки API
if (navigator.clipboard) {
  console.log('Clipboard API поддерживается');
} else {
  console.log('Clipboard API не поддерживается');
}
```

## Запись в буфер обмена

### navigator.clipboard.writeText()

Наиболее часто используемый метод — запись текста в буфер обмена. Принимает строку и возвращает промис, который разрешается после успешной записи.

```javascript
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Текст скопирован в буфер обмена');
  } catch (error) {
    console.error('Ошибка при копировании:', error);
  }
}

copyText('Привет, мир!');
```

Пример кнопки копирования с визуальной обратной связью:

```javascript
const button = document.querySelector('#copy-button');
const textToCopy = 'npm install purpleschool-utils';

button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(textToCopy);
    button.textContent = 'Скопировано!';
    setTimeout(() => {
      button.textContent = 'Копировать';
    }, 2000);
  } catch (error) {
    console.error('Не удалось скопировать текст:', error);
  }
});
```

### navigator.clipboard.write()

Для записи нетекстовых данных — изображений, HTML и других форматов — используется метод `write()`. Он принимает массив объектов `ClipboardItem`.

```javascript
async function copyImage(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const clipboardItem = new ClipboardItem({
      [blob.type]: blob
    });

    await navigator.clipboard.write([clipboardItem]);
    console.log('Изображение скопировано в буфер обмена');
  } catch (error) {
    console.error('Ошибка при копировании изображения:', error);
  }
}
```

Запись HTML вместе с текстовым fallback:

```javascript
async function copyAsHtml(htmlString, plainText) {
  try {
    const htmlBlob = new Blob([htmlString], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });

    const clipboardItem = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob
    });

    await navigator.clipboard.write([clipboardItem]);
    console.log('HTML скопирован в буфер обмена');
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

copyAsHtml(
  '<strong>Жирный текст</strong>',
  'Жирный текст'
);
```

## Чтение из буфера обмена

### navigator.clipboard.readText()

Метод `readText()` возвращает промис со строкой — текущим текстовым содержимым буфера обмена.

```javascript
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText();
    console.log('Содержимое буфера:', text);
    return text;
  } catch (error) {
    console.error('Ошибка при чтении буфера обмена:', error);
  }
}

// Вставить содержимое в поле ввода по кнопке
const input = document.querySelector('#text-input');
const pasteButton = document.querySelector('#paste-button');

pasteButton.addEventListener('click', async () => {
  const text = await pasteText();
  if (text !== undefined) {
    input.value = text;
  }
});
```

### navigator.clipboard.read()

Метод `read()` позволяет читать данные любого типа из буфера обмена. Возвращает массив объектов `ClipboardItem`, каждый из которых содержит данные в одном или нескольких форматах.

```javascript
async function readClipboard() {
  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      console.log('Доступные типы:', item.types);

      for (const type of item.types) {
        const blob = await item.getType(type);

        if (type === 'text/plain') {
          const text = await blob.text();
          console.log('Текст:', text);
        } else if (type.startsWith('image/')) {
          const url = URL.createObjectURL(blob);
          const img = document.createElement('img');
          img.src = url;
          document.body.appendChild(img);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при чтении буфера обмена:', error);
  }
}
```

Практический пример — загрузка вставленного изображения на сервер:

```javascript
async function handleImagePaste() {
  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      const imageType = item.types.find(type => type.startsWith('image/'));
      if (!imageType) continue;

      const blob = await item.getType(imageType);

      const formData = new FormData();
      formData.append('image', blob, 'clipboard-image.png');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('Изображение загружено:', result.url);
    }
  } catch (error) {
    console.error('Ошибка при вставке изображения:', error);
  }
}
```

## Разрешения и безопасность

Clipboard API тесно связан с Permissions API. Браузер автоматически разрешает запись, если действие произошло в ответ на пользовательское взаимодействие (клик, нажатие клавиши). Чтение, как правило, требует явного разрешения.

### Проверка разрешений

```javascript
async function checkClipboardPermissions() {
  try {
    const readPermission = await navigator.permissions.query({
      name: 'clipboard-read'
    });
    console.log('Разрешение на чтение:', readPermission.state);
    // 'granted', 'denied' или 'prompt'

    const writePermission = await navigator.permissions.query({
      name: 'clipboard-write'
    });
    console.log('Разрешение на запись:', writePermission.state);
  } catch (error) {
    console.error('Ошибка проверки разрешений:', error);
  }
}
```

### Отслеживание изменений разрешений

```javascript
async function watchClipboardPermission() {
  const permission = await navigator.permissions.query({
    name: 'clipboard-read'
  });

  permission.addEventListener('change', () => {
    if (permission.state === 'granted') {
      console.log('Теперь можно читать из буфера обмена');
    } else if (permission.state === 'denied') {
      console.log('Доступ к буферу обмена запрещён');
    }
  });
}
```

### Ключевые ограничения безопасности

- API доступен только в **защищённых контекстах** (HTTPS или localhost)
- Чтение из буфера обмена требует разрешения пользователя или фокуса на странице (зависит от браузера)
- В ряде браузеров запись разрешена только при активном взаимодействии пользователя
- Web Workers и расширения не имеют доступа к этому API

```javascript
if (!window.isSecureContext) {
  console.warn('Clipboard API доступен только в защищённых контекстах (HTTPS)');
}
```

## Обработка ошибок

При работе с Clipboard API необходимо обрабатывать несколько типов ошибок и реализовывать fallback для старых браузеров.

```javascript
async function safeCopyText(text) {
  if (!navigator.clipboard) {
    return fallbackCopyText(text);
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      console.error('Доступ к буферу обмена запрещён пользователем');
    } else if (error.name === 'SecurityError') {
      console.error('Ошибка безопасности: требуется HTTPS');
    } else {
      console.error('Неизвестная ошибка:', error.message);
    }
    return fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    return document.execCommand('copy');
  } catch (error) {
    console.error('Fallback не сработал:', error);
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}
```

## Практические примеры

### Менеджер буфера обмена с fallback

```javascript
class ClipboardManager {
  constructor(feedbackElement) {
    this.feedbackEl = feedbackElement;
  }

  async copy(text) {
    const success = await this.#writeToClipboard(text);
    this.#showFeedback(success ? 'Скопировано!' : 'Ошибка копирования');
    return success;
  }

  async paste() {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return null;
    }
  }

  async #writeToClipboard(text) {
    if (!navigator.clipboard) return this.#fallbackCopy(text);
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return this.#fallbackCopy(text);
    }
  }

  #fallbackCopy(text) {
    const textarea = Object.assign(document.createElement('textarea'), {
      value: text,
      style: 'position:fixed;opacity:0'
    });
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  }

  #showFeedback(message) {
    if (!this.feedbackEl) return;
    this.feedbackEl.textContent = message;
    setTimeout(() => { this.feedbackEl.textContent = ''; }, 2000);
  }
}

// Инициализация и навешивание обработчиков
const clipboard = new ClipboardManager(document.querySelector('#feedback'));

document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', () => clipboard.copy(button.dataset.copy));
});
```

### Кнопки копирования для блоков кода

```javascript
function initCodeCopyButtons() {
  document.querySelectorAll('pre code').forEach(codeBlock => {
    const pre = codeBlock.parentElement;
    const button = document.createElement('button');
    button.className = 'copy-code-btn';
    button.textContent = 'Копировать';
    pre.style.position = 'relative';
    pre.appendChild(button);

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeBlock.textContent);
        button.textContent = 'Скопировано!';
        button.classList.add('success');
      } catch {
        button.textContent = 'Ошибка';
        button.classList.add('error');
      } finally {
        setTimeout(() => {
          button.textContent = 'Копировать';
          button.classList.remove('success', 'error');
        }, 2000);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initCodeCopyButtons);
```

### Перехват системных событий копирования и вставки

Помимо программного доступа, браузер генерирует события `copy`, `cut` и `paste`, которые можно перехватывать.

```javascript
// Добавить атрибуцию к тексту при копировании
document.addEventListener('copy', (event) => {
  const selection = window.getSelection().toString();
  if (!selection) return;

  const attribution = '\n\nИсточник: purpleschool.ru';
  event.clipboardData.setData('text/plain', selection + attribution);
  event.preventDefault();
});

// Обработать вставку изображения или текста
document.addEventListener('paste', (event) => {
  event.preventDefault();
  const pasteArea = document.querySelector('#paste-area');

  for (const item of event.clipboardData.items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      const url = URL.createObjectURL(blob);
      const img = document.createElement('img');
      img.src = url;
      pasteArea.appendChild(img);
    } else if (item.type === 'text/plain') {
      item.getAsString(text => {
        pasteArea.textContent = text;
      });
    }
  }
});
```

## Совместимость с браузерами

Clipboard API поддерживается во всех современных браузерах:

- **Chrome / Edge**: полная поддержка с версии 76+
- **Firefox**: `readText()` и `writeText()` — с версии 63+; `read()` и `write()` — с ограничениями по типам
- **Safari**: текст — с версии 13.1+; изображения — с версии 15.4+

Для проверки доступных возможностей в конкретном окружении:

```javascript
function getClipboardCapabilities() {
  return {
    hasClipboardAPI: 'clipboard' in navigator,
    hasWriteText: 'clipboard' in navigator && 'writeText' in navigator.clipboard,
    hasReadText: 'clipboard' in navigator && 'readText' in navigator.clipboard,
    hasWrite: 'clipboard' in navigator && 'write' in navigator.clipboard,
    hasRead: 'clipboard' in navigator && 'read' in navigator.clipboard,
    isSecureContext: window.isSecureContext,
  };
}

console.table(getClipboardCapabilities());
```

Clipboard API является предпочтительным способом работы с буфером обмена в современных приложениях. При этом для максимальной совместимости стоит всегда держать наготове fallback через `document.execCommand` — он поддерживается даже там, где новый API недоступен.

Чтобы углубиться в работу с браузерными API и современным JavaScript, рекомендуем курс PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=javascript-clipboard-api
