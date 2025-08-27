---
metaTitle: Работа с файлами в React
metaDescription: Узнайте - как загружать, читать и обрабатывать файлы в React на практике, как реализовать drag and drop, предпросмотр и ограничения
author: Олег Марков
title: Работа с файлами в React
preview: Подробная инструкция по работе с файлами в React - организация загрузки, чтения, предпросмотра и правильной обработки файлов в современных приложениях
---

## Введение

Работа с файлами в React встречается очень часто — от загрузки картинок в профиле до экспорта и импорта данных, генерации отчетов, предпросмотра изображений и обработки файлов большого объема. Важно понимать, что React работает в браузере, а значит, не имеет прямого доступа к файловой системе пользователя по причинам безопасности. Все взаимодействия с файлами происходят только через встроенные веб-API браузера.

В этой статье вы узнаете, как реализовать загрузку файлов через input, обработать выбранные пользователем файлы, создать предпросмотр изображений, читать содержимое текстовых файлов, сохранять файлы из приложения, реализовать drag and drop, а также какие есть ограничения и best practices. Для всех примеров приведены отрывки кода и пояснения, чтобы вы могли сразу применять знания на практике.

## Загрузка файлов в React

### Как работает `<input type="file">` в React

Загрузка файлов начинается с обычного HTML-элемента input. Не забудьте указать атрибут `type="file"`, чтобы разрешить выбор файлов:

```jsx
<input type="file" onChange={handleFileChange} />
```

Обратите внимание, как в этом примере задается обработчик события `onChange`. Когда пользователь выбирает файл, браузер вызывает вашу функцию и передает объект события.

#### Обработка выбранных файлов

В событии `onChange` доступен объект `event.target.files`. Это не массив, а `FileList`, который можно итерировать — использовать индексацию или преобразовать в массив.

Давайте посмотрим, как это реализовать:

```jsx
function handleFileChange(event) {
  const files = event.target.files; // Получаем FileList
  if (files.length > 0) {
    // Берем первый файл
    const file = files[0];
    console.log("Выбран файл:", file.name, file.size, file.type);
  }
}
```

Хорошая практика — добавлять атрибут `multiple` к input, если вам нужна загрузка нескольких файлов сразу:

```jsx
<input type="file" multiple onChange={handleFileChange} />
```

Теперь вы можете работать с несколькими файлами:

```jsx
function handleFileChange(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    console.log(`Файл: ${file.name}, Размер: ${file.size}Б, Тип: ${file.type}`);
  });
}
```

### Ограничение типов загружаемых файлов

Можно ограничить выбор форматов файлов с помощью атрибута `accept`:

```jsx
<input
  type="file"
  accept=".png,.jpg,.jpeg"
  onChange={handleFileChange}
/>
```

Это позволяет скрыть ненужные файлы из диалога выбора. Например:

- `accept="image/*"` — только изображения
- `accept=".csv, .txt"` — только csv и текстовые файлы

Однако это ограничение работает только на клиенте — всегда проверяйте тип и размер файлов после выбора!

## Как получить доступ к данным файлов

### Работа с объектом File

Файл представлен как объект JavaScript `File`. Вот его основные свойства:

- `name` — имя файла
- `size` — размер файла в байтах
- `type` — MIME-тип, например, `image/jpeg`
- `lastModified` — время последнего изменения (timestamp)

Вы можете прочитать содержимое файла только через специальные браузерные API. React никакой "магии" здесь не добавляет.

Работа с файлами является неотъемлемой частью многих React-приложений. Это может включать в себя загрузку изображений, чтение данных из текстовых файлов или создание и скачивание файлов. Если вы хотите научиться работать с файлами в React и узнать о различных способах обработки файлов на стороне клиента — приходите на наш большой курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=rabota-s-failami-v-react). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Чтение файла через FileReader

Самый популярный способ читать содержимое файла — использовать встроенный в браузер объект FileReader. Он поддерживает несколько методов:

- `readAsText(file)` — читает файл как текст
- `readAsDataURL(file)` — читает файл как data URL (base64), подойдет для изображений
- `readAsArrayBuffer(file)` — как бинарные данные

Вот пример для чтения текста из файла:

```jsx
function handleFileChange(event) {
  const file = event.target.files[0];

  const reader = new FileReader();
  reader.onload = function(e) {
    // e.target.result содержит содержимое файла
    console.log("Содержимое файла:", e.target.result);
  };
  reader.readAsText(file); // Читаем как текст
}
```

А вот как получить base64 строку, например, для предпросмотра картинок:

```jsx
function handleFileChange(event) {
  const file = event.target.files[0];

  const reader = new FileReader();
  reader.onload = function(e) {
    // e.target.result теперь содержит data URL картинки
    setImageUrl(e.target.result); // Показываем предпросмотр
  };
  reader.readAsDataURL(file);
}
```

### Асинхронное чтение через промисы

FileReader работает с колбэками events. Если удобнее использовать промисы/async-await, можно обернуть FileReader в промис:

```jsx
function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // результат
    reader.onerror = reject;
    reader.readAsText(file); // или readAsDataURL/file — по назначению
  });
}
```

Вот так можно использовать:

```jsx
async function handleFileChange(event) {
  const file = event.target.files[0];
  try {
    const content = await readFileAsync(file); // ждем результат
    console.log("Файл:", content);
  } catch (error) {
    console.error("Ошибка чтения файла:", error);
  }
}
```

## Предпросмотр файлов — примеры на изображениях и видео

### Быстрый предпросмотр изображений

Предпросмотр особенно полезен для загрузки изображений, чтобы показать пользователю, какие файлы он выбрал. Самый простой способ — использовать `readAsDataURL`:

```jsx
// Состояние для хранения preview
const [previewUrl, setPreviewUrl] = useState(null);

function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    setPreviewUrl(e.target.result); // сохраняем data url
  };
  reader.readAsDataURL(file);
}

// В компоненте возвращаем
{previewUrl && <img src={previewUrl} alt="Предпросмотр" style={{ maxWidth: '200px' }} />}
```

### Использование URL.createObjectURL

Иногда, особенно для видео- и больших файлов, эффективнее работать с временным url, не загружая файл в память как base64. Технология Blob URL идеально подходит:

```jsx
const [previewUrl, setPreviewUrl] = useState(null);

function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  const blobUrl = URL.createObjectURL(file);
  setPreviewUrl(blobUrl);

  // Обязательно освобождайте URL после использования!
  return () => URL.revokeObjectURL(blobUrl);
}

// Для видео — используем <video src={previewUrl} controls />
```

## Как сохранять файлы из React-приложения

React не может напрямую сохранять файлы на диск пользователя без согласия. Но вы можете предложить пользователю скачать файл, сгенерированный вашим приложением.

### Генерация и скачивание текстовых файлов

Пример — экспорт данных в CSV или скачивание отчета:

```jsx
function downloadFile(filename, content) {
  // Создаем blob объекта
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  // Создаем временную ссылку
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url); // Чистим blob url
}
```

Теперь вызовите `downloadFile('report.txt', 'Содержимое отчета')`, и пользователь получит сгенерированный файл.

### Скачивание файлов с сервера

Если хотите дать ссылку на скачивание файла с сервера:

```jsx
<a href="https://example.com/file.pdf" download="guide.pdf">Скачать PDF</a>
```

Атрибут `download` подскажет браузеру не просто открыть, а именно загрузить файл.

## Drag and Drop загрузка файлов

Многие пользователи ожидают удобную загрузку файлов путем перетаскивания. Реализовать это в React несложно:

```jsx
function DropZone({ onFiles }) {
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(Array.from(e.dataTransfer.files)); // Массив файлов
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = e => {
    e.preventDefault(); // Нужно для работы drop
    e.stopPropagation();
  };

  return (
    <div
      style={{
        border: "2px dashed #888", borderRadius: 6, padding: 24, textAlign: "center"
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      Перетащите файлы сюда или выберите через диалог
    </div>
  );
}
```

Используйте как:

```jsx
<DropZone onFiles={files => console.log(files)} />
```

## Отправка файлов на сервер (загрузка на backend)

### Отправка через FormData с fetch/axios

Чтобы отправить загруженный файл на сервер, обычно используют API `FormData`. Он имитирует форму с полем типа file.

```jsx
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('attachment', file); // имя поля на backend

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData // тело именно FormData, не JSON!
    });

    if (!response.ok) throw new Error("Ошибка загрузки");
    const result = await response.json();
    console.log("Ответ сервера:", result);
  } catch (error) {
    console.error(error);
  }
}
```

Для нескольких файлов используйте цикл:

```jsx
files.forEach(file => {
  formData.append('attachments[]', file);
});
```

При использовании axios:

```jsx
import axios from 'axios';

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('doc', file);
  await axios.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}
```

## Проверка размера и типа файлов на клиенте

Валидация файлов — важная часть UX и безопасности. Проверять надо и на клиенте, и на сервере.

```jsx
function handleFileChange(event) {
  const MAX_SIZE = 2 * 1024 * 1024; // 2МБ
  const file = event.target.files[0];

  if (file.size > MAX_SIZE) {
    alert("Файл слишком большой!");
    return;
  }
  if (!file.type.startsWith('image/')) {
    alert("Разрешены только изображения!");
    return;
  }
  // можно загружать или читать файл
}
```

Эти проверки не гарантируют, что никто не загрузит вредоносный файл через запрос напрямую, поэтому всегда делайте повторную валидацию на сервере.

## Особенности обработки больших файлов (Chunk Upload)

Загрузка больших файлов (например, видео) требует деления их на части (chunks) и последовательной отправки. Это уже тема более сложных решений, для которой могут потребоваться сторонние библиотеки, например, [uppy.io](https://uppy.io) или ваши собственные алгоритмы chunk upload с использованием slice API у File.

Пример получения чанка:

```jsx
const file = ...;
const chunk = file.slice(0, 1024 * 1024); // первый 1МБ
```

## Безопасность работы с файлами

- Не доверяйте ни типу, ни расширению файла — любые проверки на клиенте легко обходятся.
- Никогда не показывайте результат работы файла напрямую: всегда используйте sandboxed окружения (iframe с ограничениями или blob url).
- Следите за утечками памяти: очищайте blob url через `URL.revokeObjectURL`.

## Интеграция сторонних библиотек для работы с файлами

Порой стандартных инструментов недостаточно, особенно если нужен drag-n-drop с предпросмотром, прогресс бар, обработка ошибок загрузки, отмена загрузки и т.д.

Популярные решения:

- [react-dropzone](https://react-dropzone.js.org/) — удобный drag-and-drop, обработка файлов и множество опций кастомизации
- [uppy.io](https://uppy.io/) — мощная загрузка файлов с chunk upload, retry и поддержкой облачных сервисов
- [filepond](https://pqina.nl/filepond/) — визуально красивый загрузчик с прогрессом и фильтрацией

Смотрите, пример подключения react-dropzone:

```jsx
import { useDropzone } from 'react-dropzone';

function MyDropzone() {
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone();

  return (
    <div {...getRootProps()} style={{ border: "1px solid #ddd", padding: 16 }}>
      <input {...getInputProps()} />
      <p>Перетащите файл или нажмите для выбора</p>
      <ul>
        {acceptedFiles.map(file => (
          <li key={file.path}>{file.path} ({file.size} bytes)</li>
        ))}
      </ul>
    </div>
  );
}
```

## Общие best practices

- Для изображений сначала делайте предпросмотр и только потом отправляйте на сервер.
- Ограничивайте не только размер, но и количество файлов, если функционал это требует.
- Не забывайте обрабатывать ошибки загрузки и чтения файлов.
- Обеспечьте пользователю информативные сообщения об ошибках: неправильный тип, слишком большой размер — все должно быть в интерфейсе.
- Для drag-and-drop всегда добавляйте fallback через обычный input.
- Очищайте blob url заранее, особенно если generate preview для больших файлов — это экономит память.
- Не забывайте о доступности: делайте label для input, поддерживайте работу с клавиатурой.

Работа с файлами расширяет возможности React. Для создания полноценных приложений необходимы навыки управления состоянием и роутингом. На курсе [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=rabota-s-failami-v-react) вы освоите все необходимые инструменты. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в основы React уже сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как сбросить выбранный пользователем файл в input и разрешить загрузку заново того же файла?

В React input с type="file" неуправляемый (uncontrolled). Чтобы сбросить выбранный файл (например, после отправки формы или чтобы пользователь мог снова выбрать тот же файл), обнулите value у input через ref:

```jsx
const inputRef = useRef();

function handleClear() {
  inputRef.current.value = '';
}

// В разметке
<input type="file" ref={inputRef} onChange={handleFileChange} />
<button onClick={handleClear}>Сбросить выбор</button>
```

### Как загрузить файл не через input, а программно открыть диалог выбора файла?

Создайте input type="file", но не отображайте его на экране (например, через display none), а открывайте клик на input программно:

```jsx
const inputRef = useRef();

function openFileDialog() {
  inputRef.current.click();
}

<input type="file" style={{ display: 'none' }} ref={inputRef} onChange={handleFileChange} />
<button onClick={openFileDialog}>Выбрать файл</button>
```

### Как получить mime-type и расширение файла?

Mime-type есть в свойстве file.type. Расширение файла можно получить через:

```js
const extension = file.name.split('.').pop();
```

### Как отменить загрузку файла, если пользователь передумал?

Если вы отправляете файлы через fetch или axios, используйте AbortController (для fetch):

```js
const controller = new AbortController();
fetch(url, { signal: controller.signal, ... });
// Позже
controller.abort();
```

Для axios используйте CancelToken.

### Почему обработчик onChange не срабатывает, если выбрать один и тот же файл?

Событие onChange срабатывает только при изменении value. Если вы не сбросили input, повторный выбор того же файла не вызовет onChange. Используйте ref для сброса value после обработки файла.
