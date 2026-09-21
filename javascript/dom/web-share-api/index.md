---
metaTitle: "Web Share API — мобильный шеринг в JavaScript"
metaDescription: "Как использовать Web Share API для нативного шеринга контента на мобильных устройствах. Примеры кода, обработка ошибок, файлы."
author: "Антон Ларичев"
title: "Web Share API: нативный шеринг на мобильных устройствах"
preview: "Разбираем Web Share API: как подключить нативный шеринг в браузере, передавать текст, URL и файлы, обрабатывать ошибки и проверять поддержку."
---

## Что такое Web Share API

Web Share API — это браузерный интерфейс, который позволяет веб-приложениям вызывать нативный диалог шеринга операционной системы. Вместо того чтобы показывать собственные кнопки «Поделиться в Twitter», «Поделиться в Telegram» и так далее, вы отдаёте управление самой ОС — она сама предложит пользователю доступные приложения.

Это особенно ценно на мобильных устройствах, где у каждого пользователя установлен разный набор приложений. Вместо того чтобы угадывать, что именно нужно, нативный диалог показывает всё, что поддерживает получение контента данного типа.

## Поддержка браузерами

Web Share API поддерживается в:

- Chrome для Android (версия 61+)
- Safari на iOS (версия 12.2+) и macOS (Big Sur+)
- Edge (версия 79+)
- Samsung Internet (версия 8.2+)

Desktop-браузеры поддерживают API значительно хуже — Chrome на Windows и macOS добавил поддержку только в версии 89. Firefox пока не поддерживает API.

Прежде чем использовать API, всегда нужно проверять его доступность.

## Базовый пример: поделиться текстом и ссылкой

Метод `navigator.share()` принимает объект с данными для шеринга и возвращает промис.

```javascript
async function shareContent() {
  if (!navigator.share) {
    console.log('Web Share API не поддерживается');
    return;
  }

  try {
    await navigator.share({
      title: 'Курсы по программированию',
      text: 'Отличный ресурс для изучения TypeScript и JavaScript',
      url: 'https://purpleschool.ru',
    });
    console.log('Контент успешно передан');
  } catch (error) {
    console.error('Ошибка шеринга:', error);
  }
}

document.querySelector('#share-btn').addEventListener('click', shareContent);
```

Все три поля (`title`, `text`, `url`) необязательны, но хотя бы одно должно присутствовать. На практике всегда передавайте `url` — это самое надёжно обрабатываемое поле.

## Требование пользовательского жеста

Важное ограничение: `navigator.share()` можно вызвать только в ответ на пользовательское действие — клик, нажатие клавиши, touch-событие. Вызов метода вне обработчика событий приведёт к ошибке.

```javascript
// Так работает
document.querySelector('#btn').addEventListener('click', () => {
  navigator.share({ url: window.location.href });
});

// Так НЕ работает — нет пользовательского жеста
setTimeout(() => {
  navigator.share({ url: window.location.href }); // DOMException
}, 1000);
```

Это ограничение сделано намеренно, чтобы сайты не могли открывать диалог шеринга без ведома пользователя.

## Обработка ошибок

Промис, возвращаемый `navigator.share()`, может отклониться по нескольким причинам:

```javascript
async function share(data) {
  try {
    await navigator.share(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      // Пользователь закрыл диалог шеринга
      console.log('Пользователь отменил шеринг');
    } else if (error.name === 'NotAllowedError') {
      // Нет разрешения или не было пользовательского жеста
      console.log('Шеринг не разрешён');
    } else if (error.name === 'TypeError') {
      // Переданы некорректные данные
      console.log('Некорректные данные:', error.message);
    } else {
      console.error('Неизвестная ошибка:', error);
    }
  }
}
```

`AbortError` — самый частый случай: пользователь просто закрыл диалог. Это не ошибка с точки зрения UX, и показывать сообщение об ошибке не нужно.

## Шеринг файлов

Web Share API поддерживает передачу файлов. Перед вызовом метода нужно проверить, что конкретный набор файлов можно расшарить, с помощью `navigator.canShare()`.

```javascript
async function shareImage(imageUrl) {
  // Загружаем изображение и конвертируем в File
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

  const shareData = {
    files: [file],
    title: 'Моё фото',
    text: 'Посмотри на это изображение',
  };

  if (!navigator.canShare || !navigator.canShare(shareData)) {
    console.log('Шеринг файлов не поддерживается');
    return;
  }

  try {
    await navigator.share(shareData);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Ошибка при шеринге файла:', error);
    }
  }
}
```

Метод `navigator.canShare()` принимает те же данные, что и `navigator.share()`, и возвращает булево значение — можно ли расшарить этот контент. Используйте его как guard перед фактическим вызовом шеринга.

## Шеринг нескольких файлов

```javascript
async function shareMultipleFiles(files) {
  const shareData = { files, title: 'Мои файлы' };

  if (!navigator.canShare?.(shareData)) {
    alert('Ваш браузер не поддерживает шеринг файлов');
    return;
  }

  try {
    await navigator.share(shareData);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(error);
    }
  }
}

// Пример использования с input[type=file]
document.querySelector('#file-input').addEventListener('change', (event) => {
  const files = Array.from(event.target.files);
  shareMultipleFiles(files);
});
```

## Практический компонент кнопки шеринга

Напишем универсальную функцию, которая при отсутствии поддержки API деградирует до копирования URL в буфер обмена:

```javascript
function createShareButton(container, shareData) {
  const button = document.createElement('button');

  const supportsShare = typeof navigator.share === 'function';

  button.textContent = supportsShare ? 'Поделиться' : 'Скопировать ссылку';
  button.className = 'share-button';

  button.addEventListener('click', async () => {
    if (supportsShare) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(error);
        }
      }
    } else {
      // Фолбэк: копируем URL в буфер обмена
      try {
        await navigator.clipboard.writeText(shareData.url ?? window.location.href);
        button.textContent = 'Скопировано!';
        setTimeout(() => {
          button.textContent = 'Скопировать ссылку';
        }, 2000);
      } catch {
        console.error('Clipboard API недоступен');
      }
    }
  });

  container.appendChild(button);
}

// Использование
const container = document.querySelector('#share-container');
createShareButton(container, {
  title: document.title,
  url: window.location.href,
});
```

## Интеграция с React

```javascript
import { useCallback } from 'react';

function useWebShare() {
  const isSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const share = useCallback(async (data) => {
    if (!isSupported) {
      return { success: false, reason: 'not-supported' };
    }

    try {
      await navigator.share(data);
      return { success: true };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, reason: 'aborted' };
      }
      return { success: false, reason: 'error', error };
    }
  }, [isSupported]);

  return { share, isSupported };
}

// Компонент
function ArticleShareButton({ title, url }) {
  const { share, isSupported } = useWebShare();

  const handleClick = async () => {
    const result = await share({ title, url });
    if (!result.success && result.reason === 'not-supported') {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <button onClick={handleClick}>
      {isSupported ? 'Поделиться' : 'Скопировать ссылку'}
    </button>
  );
}
```

## Шеринг текущей страницы

Самый распространённый сценарий — поделиться текущей страницей:

```javascript
document.querySelector('#share-page-btn').addEventListener('click', async () => {
  const data = {
    title: document.title,
    url: window.location.href,
  };

  if (!navigator.share) {
    await navigator.clipboard.writeText(data.url);
    return;
  }

  try {
    await navigator.share(data);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(error);
    }
  }
});
```

## Метод canShare для проверки данных

`navigator.canShare()` без аргументов возвращает `true`, если API вообще доступен. С аргументом — проверяет конкретный объект данных:

```javascript
// Проверяем только доступность API
const apiAvailable = navigator.canShare?.() ?? false;

// Проверяем конкретные данные
const pdfFile = new File(['...'], 'doc.pdf', { type: 'application/pdf' });
const canSharePdf = navigator.canShare?.({ files: [pdfFile] }) ?? false;

if (canSharePdf) {
  await navigator.share({ files: [pdfFile] });
} else {
  // Предложить скачать или отправить по почте
}
```

Обратите внимание на использование опциональной цепочки (`?.`) — если `canShare` не определён, выражение вернёт `undefined`, а не упадёт с ошибкой.

## Ограничения и подводные камни

**Только HTTPS.** Web Share API работает только на страницах, загруженных по HTTPS (или на localhost). На HTTP-страницах `navigator.share` будет `undefined`.

**Ограничения на типы файлов.** Браузеры ограничивают, какие типы файлов можно шарить. Обычно поддерживаются изображения, аудио, видео и текстовые файлы. PDF и другие форматы могут не поддерживаться — всегда проверяйте через `canShare`.

**Нет гарантии доставки.** Промис резолвится сразу после того, как пользователь выбрал приложение, но это не означает, что контент был успешно передан в это приложение.

**Desktop-поддержка нестабильна.** На десктопах диалог шеринга зависит от ОС. На Windows это Share Sheet, на macOS — стандартный системный диалог. Ряд браузеров на десктопе вовсе не поддерживает API.

## Итог

Web Share API — это простой и мощный инструмент для добавления нативного шеринга в веб-приложение. Ключевые моменты:

- Всегда проверяйте поддержку через `navigator.share` перед вызовом
- Вызывайте метод только в обработчике пользовательского события
- Для файлов используйте `navigator.canShare()` как предварительную проверку
- Обрабатывайте `AbortError` отдельно — это не ошибка, а нормальное закрытие диалога
- Делайте фолбэк на Clipboard API для браузеров без поддержки

Для углублённого изучения JavaScript и браузерных API — [курс по JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=web-share-api).
