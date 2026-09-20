---
metaTitle: "File System Access API — работа с файлами в браузере"
metaDescription: "Полное руководство по File System Access API: чтение, запись и управление файлами и директориями прямо из браузера без серверной части."
author: "Антон Ларичев"
title: "File System Access API в браузере"
preview: "Как использовать File System Access API для чтения и записи файлов на диске пользователя прямо из браузера — с практическими примерами."
---

File System Access API — это современный браузерный интерфейс, который позволяет веб-приложениям читать и записывать файлы на диске пользователя, а также работать с директориями. В отличие от классического `<input type="file">`, этот API даёт возможность не просто получить содержимое файла, но и сохранить изменения обратно на диск, открывать целые папки и работать с файловой системой итеративно.

## Зачем нужен File System Access API

До появления этого API возможности браузера по работе с файлами были сильно ограничены:

- `<input type="file">` позволял только читать выбранные файлы.
- Скачивание файлов делалось через создание ссылки с атрибутом `download`.
- Не было способа сохранить изменённый файл обратно в то же место на диске.

File System Access API решает эти проблемы. Теперь в браузере можно строить полноценные редакторы кода, графические редакторы, IDE и другие инструменты, которые работают с локальными файлами так же, как нативные приложения.

## Основные методы API

API предоставляет три глобальных метода:

- `window.showOpenFilePicker()` — открывает диалог выбора файла для чтения.
- `window.showSaveFilePicker()` — открывает диалог сохранения файла.
- `window.showDirectoryPicker()` — открывает диалог выбора директории.

Каждый из них возвращает Promise и требует явного действия пользователя (клик по кнопке). Вызов без пользовательского жеста приведёт к ошибке.

## Чтение файла

### showOpenFilePicker

Метод `showOpenFilePicker` возвращает массив объектов `FileSystemFileHandle`. Через него можно получить содержимое файла.

```javascript
async function openFile() {
  let fileHandle;

  try {
    [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Текстовые файлы',
          accept: { 'text/plain': ['.txt', '.md'] },
        },
      ],
      multiple: false,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      // Пользователь закрыл диалог
      return;
    }
    throw err;
  }

  const file = await fileHandle.getFile();
  const contents = await file.text();

  console.log(contents);
}
```

Объект `File`, который возвращает `fileHandle.getFile()`, — это стандартный веб-объект `File`, у которого есть методы `.text()`, `.arrayBuffer()` и `.stream()`.

### Параметры showOpenFilePicker

```javascript
const options = {
  // Фильтры по типам файлов
  types: [
    {
      description: 'Изображения',
      accept: {
        'image/*': ['.png', '.gif', '.jpeg', '.jpg', '.webp'],
      },
    },
  ],
  // Разрешить выбор нескольких файлов
  multiple: true,
  // Исключить фильтр "Все файлы"
  excludeAcceptAllOption: false,
};

const handles = await window.showOpenFilePicker(options);
```

## Запись файла

### showSaveFilePicker

Для сохранения файла используется `showSaveFilePicker`. Метод возвращает `FileSystemFileHandle`, через который можно записать данные.

```javascript
async function saveFile(content) {
  let fileHandle;

  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: 'document.txt',
      types: [
        {
          description: 'Текстовый файл',
          accept: { 'text/plain': ['.txt'] },
        },
      ],
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return;
    }
    throw err;
  }

  // Создаём поток записи
  const writable = await fileHandle.createWritable();

  // Записываем данные
  await writable.write(content);

  // Закрываем поток — без этого файл не сохранится
  await writable.close();
}
```

### FileSystemWritableFileStream

Объект, который возвращает `createWritable()`, — это `FileSystemWritableFileStream`. Он поддерживает несколько методов:

```javascript
const writable = await fileHandle.createWritable();

// Запись строки, Blob или ArrayBuffer
await writable.write('Hello, World!');

// Запись с указанием позиции и типа операции
await writable.write({
  type: 'write',
  position: 0,
  data: 'Начало файла',
});

// Перемещение курсора
await writable.seek(5);

// Обрезка файла до указанного размера
await writable.truncate(100);

await writable.close();
```

До вызова `.close()` изменения записываются во временный файл и не затрагивают оригинал. Это защищает от потери данных при сбоях.

## Сохранение изменений в уже открытый файл

Одно из ключевых преимуществ API — возможность сохранять изменения обратно в тот же файл без повторного диалога:

```javascript
let currentFileHandle = null;

async function openAndEdit() {
  [currentFileHandle] = await window.showOpenFilePicker();
  const file = await currentFileHandle.getFile();
  const text = await file.text();

  document.getElementById('editor').value = text;
}

async function saveChanges() {
  if (!currentFileHandle) {
    return;
  }

  const content = document.getElementById('editor').value;
  const writable = await currentFileHandle.createWritable();
  await writable.write(content);
  await writable.close();

  console.log('Файл сохранён');
}
```

## Работа с директориями

### showDirectoryPicker

Метод `showDirectoryPicker` открывает диалог выбора папки и возвращает `FileSystemDirectoryHandle`.

```javascript
async function openDirectory() {
  const dirHandle = await window.showDirectoryPicker();

  // Итерируемся по содержимому директории
  for await (const [name, handle] of dirHandle) {
    if (handle.kind === 'file') {
      console.log('Файл:', name);
    } else if (handle.kind === 'directory') {
      console.log('Директория:', name);
    }
  }
}
```

### Получение файла из директории

```javascript
async function getFileFromDir(dirHandle, fileName) {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (err) {
    if (err.name === 'NotFoundError') {
      console.log(`Файл ${fileName} не найден`);
    }
    throw err;
  }
}
```

### Создание файлов и директорий

`FileSystemDirectoryHandle` позволяет создавать новые файлы и папки:

```javascript
async function createStructure(dirHandle) {
  // Создаём файл (create: true — создать, если не существует)
  const newFileHandle = await dirHandle.getFileHandle('notes.txt', {
    create: true,
  });

  // Создаём поддиректорию
  const subDirHandle = await dirHandle.getDirectoryHandle('assets', {
    create: true,
  });

  // Создаём файл внутри поддиректории
  const imageHandle = await subDirHandle.getFileHandle('logo.png', {
    create: true,
  });

  console.log('Структура создана');
}
```

### Рекурсивный обход директории

```javascript
async function listAllFiles(dirHandle, path = '') {
  const results = [];

  for await (const [name, handle] of dirHandle) {
    const fullPath = path ? `${path}/${name}` : name;

    if (handle.kind === 'file') {
      results.push({ path: fullPath, handle });
    } else {
      const nested = await listAllFiles(handle, fullPath);
      results.push(...nested);
    }
  }

  return results;
}
```

### Удаление файлов

```javascript
async function removeFile(dirHandle, fileName) {
  await dirHandle.removeEntry(fileName);
}

// Удаление директории со всем содержимым
async function removeDirectory(dirHandle, subDirName) {
  await dirHandle.removeEntry(subDirName, { recursive: true });
}
```

## Разрешения и безопасность

File System Access API построен с учётом принципа наименьших привилегий.

### Проверка разрешений

```javascript
async function checkPermission(fileHandle, mode = 'read') {
  const options = { mode };

  // Проверяем текущее состояние разрешения
  const permission = await fileHandle.queryPermission(options);

  if (permission === 'granted') {
    return true;
  }

  // Запрашиваем разрешение у пользователя
  const requested = await fileHandle.requestPermission(options);
  return requested === 'granted';
}

async function writeWithPermissionCheck(fileHandle, content) {
  const hasPermission = await checkPermission(fileHandle, 'readwrite');

  if (!hasPermission) {
    throw new Error('Нет разрешения на запись');
  }

  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
```

### Origin Private File System

Помимо работы с реальной файловой системой пользователя, API предоставляет изолированное хранилище Origin Private File System (OPFS) — виртуальную файловую систему, доступную только текущему источнику:

```javascript
async function usePrivateFileSystem() {
  // Получаем корень приватной файловой системы
  const root = await navigator.storage.getDirectory();

  // Создаём файл в изолированном хранилище
  const fileHandle = await root.getFileHandle('cache.json', { create: true });

  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify({ timestamp: Date.now() }));
  await writable.close();

  // Читаем обратно
  const file = await fileHandle.getFile();
  const data = JSON.parse(await file.text());
  console.log(data);
}
```

OPFS работает быстрее и не требует явного подтверждения пользователя, так как данные хранятся только внутри браузера.

## Практический пример: текстовый редактор

```javascript
class SimpleEditor {
  constructor(textareaElement) {
    this.textarea = textareaElement;
    this.fileHandle = null;
  }

  async open() {
    try {
      [this.fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Текстовые файлы',
            accept: { 'text/plain': ['.txt', '.md', '.js', '.ts'] },
          },
        ],
      });

      const file = await this.fileHandle.getFile();
      this.textarea.value = await file.text();
      document.title = file.name;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Ошибка открытия файла:', err);
      }
    }
  }

  async save() {
    if (this.fileHandle) {
      await this.#writeToHandle(this.fileHandle);
    } else {
      await this.saveAs();
    }
  }

  async saveAs() {
    try {
      this.fileHandle = await window.showSaveFilePicker({
        suggestedName: 'untitled.txt',
        types: [
          {
            description: 'Текстовый файл',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      });

      await this.#writeToHandle(this.fileHandle);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Ошибка сохранения:', err);
      }
    }
  }

  async #writeToHandle(handle) {
    const writable = await handle.createWritable();
    await writable.write(this.textarea.value);
    await writable.close();
    console.log('Файл сохранён');
  }
}

// Использование
const editor = new SimpleEditor(document.getElementById('editor'));

document.getElementById('btn-open').addEventListener('click', () =>
  editor.open()
);
document.getElementById('btn-save').addEventListener('click', () =>
  editor.save()
);
document.getElementById('btn-save-as').addEventListener('click', () =>
  editor.saveAs()
);
```

## Поддержка браузерами

File System Access API поддерживается в актуальных версиях Chrome, Edge и Opera (на движке Blink). Firefox и Safari поддерживают его частично или не поддерживают совсем.

Перед использованием проверяйте наличие API:

```javascript
if ('showOpenFilePicker' in window) {
  // API доступен
  document.getElementById('open-btn').removeAttribute('disabled');
} else {
  // Fallback: стандартный input type="file"
  document.getElementById('open-btn').style.display = 'none';
  document.getElementById('file-input').style.display = 'block';
}
```

Для полифилла или деградации до `<input type="file">` можно использовать библиотеку `browser-fs-access`.

## Важные ограничения

- Все методы с диалогом требуют пользовательского жеста — их нельзя вызвать автоматически при загрузке страницы.
- Разрешения не сохраняются между сессиями браузера — пользователю придётся подтверждать доступ при каждом открытии страницы.
- API недоступен в iframes без атрибута `allow="file-system-access"`.
- API работает только на HTTPS (или `localhost`).

Для курса по JavaScript на PurpleSchool вы найдёте подробные объяснения асинхронной работы с Promise, паттернов обработки ошибок и современных браузерных API:
[Курс по JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=file-system-access-api)
