---
metaTitle: React Dropzone — загрузка файлов через drag & drop в React
metaDescription: Полное руководство по react-dropzone: установка, useDropzone хук, настройка параметров, валидация файлов, загрузка на сервер с прогрессом и стилизация
author: Олег Марков
title: React Dropzone — загрузка файлов
preview: Узнайте как реализовать загрузку файлов через drag & drop в React с помощью react-dropzone. Хук useDropzone, валидация, прогресс загрузки и стилизация с TypeScript
---

## Введение

Загрузка файлов — одна из самых распространённых задач в веб-приложениях: аватары пользователей, документы, изображения для галереи. Пользователи ожидают современного опыта взаимодействия: перетащил файл в область — и он загружается. Именно это обеспечивает библиотека **react-dropzone**.

**react-dropzone** — это легковесная React-библиотека для создания зон перетаскивания (drag & drop) файлов. Она предоставляет хук `useDropzone`, который инкапсулирует всю логику работы с событиями браузера: `dragenter`, `dragover`, `dragleave`, `drop`, а также обычный выбор файлов через `<input type="file">`.

### Почему react-dropzone?

- Поддерживает drag & drop и обычный выбор файлов через клик
- Встроенная валидация типов файлов и размера
- Полная поддержка TypeScript
- Небольшой размер (~12 KB gzip)
- Хорошо документирована и активно поддерживается
- Совместима с React 16.8+ (хуки)

В этой статье вы узнаете, как установить и настроить react-dropzone, использовать хук `useDropzone`, добавить визуальную обратную связь, обработать ошибки валидации, загрузить файлы на сервер и отслеживать прогресс загрузки.

## Установка

Установите библиотеку через npm или yarn:

```bash
npm install react-dropzone
```

```bash
yarn add react-dropzone
```

Библиотека поставляется с встроенными TypeScript-типами, дополнительные `@types/react-dropzone` не нужны.

## Базовое использование с хуком useDropzone

Хук `useDropzone` — сердце библиотеки. Он возвращает пропсы для области перетаскивания и входного элемента, а также состояние дропзоны.

```tsx
import { useDropzone } from 'react-dropzone';

function BasicDropzone() {
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone();

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Перетащите файлы сюда или нажмите для выбора</p>
      <ul>
        {acceptedFiles.map((file) => (
          <li key={file.name}>
            {file.name} — {file.size} байт
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Разберём ключевые части:

- `getRootProps()` — возвращает пропсы для контейнера дропзоны (обработчики событий drag & drop, onClick для открытия диалога)
- `getInputProps()` — возвращает пропсы для скрытого `<input type="file">`
- `acceptedFiles` — массив принятых файлов (объекты `File`)

### Обработка файлов через onDrop

Чаще всего вы хотите обрабатывать файлы сразу при их добавлении. Используйте колбэк `onDrop`:

```tsx
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function DropzoneWithCallback() {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // acceptedFiles — массив принятых файлов
    acceptedFiles.forEach((file) => {
      console.log('Принят файл:', file.name, file.size, file.type);
    });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Перетащите файлы или нажмите для выбора</p>
    </div>
  );
}
```

## Настройка параметров

### accept — ограничение типов файлов

Параметр `accept` принимает объект, где ключи — MIME-типы, а значения — массивы расширений:

```tsx
import { useDropzone } from 'react-dropzone';

function ImageDropzone() {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Только изображения (JPG, PNG, WEBP, GIF)</p>
    </div>
  );
}
```

Другие примеры типов файлов:

```tsx
// PDF документы
accept: { 'application/pdf': ['.pdf'] }

// Excel таблицы
accept: {
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
}

// Видео файлы
accept: {
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
}

// Любые файлы (по умолчанию)
accept: undefined
```

### maxSize и minSize — ограничения размера

```tsx
function SizedDropzone() {
  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    maxSize: 5 * 1024 * 1024, // 5 MB в байтах
    minSize: 1024,             // минимум 1 KB
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Файлы от 1 KB до 5 MB</p>
      {fileRejections.length > 0 && (
        <p style={{ color: 'red' }}>Некоторые файлы не прошли проверку</p>
      )}
    </div>
  );
}
```

### multiple — разрешить несколько файлов

```tsx
// Разрешить несколько файлов (по умолчанию: true)
const { getRootProps, getInputProps } = useDropzone({ multiple: true });

// Только один файл
const { getRootProps, getInputProps } = useDropzone({ multiple: false });
```

### maxFiles — ограничение количества файлов

```tsx
const { getRootProps, getInputProps } = useDropzone({
  maxFiles: 5, // не более 5 файлов за раз
});
```

### disabled — отключить дропзону

```tsx
function ConditionalDropzone({ isLoading }: { isLoading: boolean }) {
  const { getRootProps, getInputProps } = useDropzone({
    disabled: isLoading, // дропзона неактивна во время загрузки
  });

  return (
    <div
      {...getRootProps()}
      style={{ opacity: isLoading ? 0.5 : 1 }}
    >
      <input {...getInputProps()} />
      <p>{isLoading ? 'Загрузка...' : 'Перетащите файлы'}</p>
    </div>
  );
}
```

## Drag & drop зона с визуальной обратной связью

Хорошая UX требует визуальной обратной связи при перетаскивании. Хук `useDropzone` предоставляет несколько флагов состояния:

```tsx
import { useDropzone } from 'react-dropzone';

function StyledDropzone() {
  const {
    getRootProps,
    getInputProps,
    isDragActive,     // файл перетаскивается над дропзоной
    isDragAccept,     // перетаскиваемый файл подходит по типу/размеру
    isDragReject,     // перетаскиваемый файл не подходит
    isFocused,        // дропзона в фокусе (навигация клавиатурой)
  } = useDropzone({
    accept: { 'image/*': [] },
    maxSize: 10 * 1024 * 1024,
  });

  const getBorderColor = () => {
    if (isDragReject) return '#ff4444';
    if (isDragAccept) return '#00e676';
    if (isDragActive) return '#2196f3';
    if (isFocused) return '#2196f3';
    return '#eeeeee';
  };

  const dropzoneStyle: React.CSSProperties = {
    padding: '40px',
    border: `2px dashed ${getBorderColor()}`,
    borderRadius: '8px',
    backgroundColor: isDragActive ? '#f5f5f5' : '#fafafa',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'border-color 0.3s ease, background-color 0.3s ease',
  };

  return (
    <div {...getRootProps({ style: dropzoneStyle })}>
      <input {...getInputProps()} />
      {isDragReject ? (
        <p style={{ color: '#ff4444' }}>Этот тип файлов не поддерживается</p>
      ) : isDragAccept ? (
        <p style={{ color: '#00e676' }}>Отпустите файлы для загрузки</p>
      ) : isDragActive ? (
        <p>Перетащите файлы сюда...</p>
      ) : (
        <p>Перетащите изображения сюда или нажмите для выбора</p>
      )}
    </div>
  );
}
```

## Обработка ошибок валидации

Хук возвращает `fileRejections` — массив объектов с информацией об отклонённых файлах:

```tsx
import { useDropzone, FileRejection } from 'react-dropzone';

function DropzoneWithErrors() {
  const { getRootProps, getInputProps, acceptedFiles, fileRejections } =
    useDropzone({
      accept: { 'image/*': [] },
      maxSize: 2 * 1024 * 1024, // 2 MB
      maxFiles: 3,
    });

  const renderErrors = (rejections: FileRejection[]) => {
    return rejections.map(({ file, errors }) => (
      <li key={file.name}>
        <strong>{file.name}</strong>:
        <ul>
          {errors.map((error) => (
            <li key={error.code} style={{ color: 'red' }}>
              {getErrorMessage(error.code)}
            </li>
          ))}
        </ul>
      </li>
    ));
  };

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'file-too-large':
        return 'Файл слишком большой (максимум 2 MB)';
      case 'file-too-small':
        return 'Файл слишком маленький';
      case 'file-invalid-type':
        return 'Неподдерживаемый тип файла';
      case 'too-many-files':
        return 'Слишком много файлов (максимум 3)';
      default:
        return `Ошибка: ${code}`;
    }
  };

  return (
    <div>
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <p>Только изображения до 2 MB, максимум 3 файла</p>
      </div>

      {acceptedFiles.length > 0 && (
        <section>
          <h4>Принятые файлы:</h4>
          <ul>
            {acceptedFiles.map((file) => (
              <li key={file.name}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </section>
      )}

      {fileRejections.length > 0 && (
        <section>
          <h4>Отклонённые файлы:</h4>
          <ul>{renderErrors(fileRejections)}</ul>
        </section>
      )}
    </div>
  );
}
```

### Коды ошибок

React Dropzone предоставляет стандартные коды ошибок через константы:

```tsx
import { ErrorCode } from 'react-dropzone';

// ErrorCode.FileTooLarge     = 'file-too-large'
// ErrorCode.FileTooSmall     = 'file-too-small'
// ErrorCode.FileInvalidType  = 'file-invalid-type'
// ErrorCode.TooManyFiles     = 'too-many-files'
```

## Загрузка на сервер (fetch/axios)

После получения файлов нужно отправить их на сервер. Вот как это делается с `fetch`:

```tsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadState {
  uploading: boolean;
  error: string | null;
  uploadedUrls: string[];
}

function UploadDropzone() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    error: null,
    uploadedUrls: [],
  });

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url; // URL загруженного файла
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setState({ uploading: true, error: null, uploadedUrls: [] });

    try {
      const urls = await Promise.all(acceptedFiles.map(uploadFile));
      setState({ uploading: false, error: null, uploadedUrls: urls });
    } catch (error) {
      setState({
        uploading: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки',
        uploadedUrls: [],
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Отпустите файлы...</p>
        ) : (
          <p>Перетащите файлы или нажмите для выбора</p>
        )}
      </div>

      {state.uploading && <p>Загрузка...</p>}
      {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state.uploadedUrls.map((url) => (
        <p key={url}>Загружено: {url}</p>
      ))}
    </div>
  );
}
```

### Загрузка через Axios

С `axios` код немного чище, особенно для отслеживания прогресса:

```tsx
import axios from 'axios';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function AxiosUploadDropzone() {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Файл загружен:', response.data.url);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      }
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Перетащите файлы или нажмите для выбора</p>
    </div>
  );
}
```

## Прогресс загрузки

Для отображения прогресса используйте `onUploadProgress` в `axios` или событие `progress` в `XMLHttpRequest`:

```tsx
import axios from 'axios';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProgress {
  file: File;
  progress: number; // 0-100
  status: 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

function ProgressDropzone() {
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);

  const updateUpload = (
    fileName: string,
    update: Partial<FileUploadProgress>
  ) => {
    setUploads((prev) =>
      prev.map((u) => (u.file.name === fileName ? { ...u, ...update } : u))
    );
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Инициализируем состояние для каждого файла
    setUploads(
      acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'uploading',
      }))
    );

    // Загружаем каждый файл параллельно
    await Promise.allSettled(
      acceptedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await axios.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const total = progressEvent.total ?? 1;
              const progress = Math.round(
                (progressEvent.loaded * 100) / total
              );
              updateUpload(file.name, { progress });
            },
          });

          updateUpload(file.name, {
            status: 'done',
            progress: 100,
            url: response.data.url,
          });
        } catch (error) {
          updateUpload(file.name, {
            status: 'error',
            error: 'Ошибка загрузки',
          });
        }
      })
    );
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          padding: '20px',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          backgroundColor: isDragActive ? '#f0f7ff' : '#fafafa',
        }}
      >
        <input {...getInputProps()} />
        <p>Перетащите файлы или нажмите для выбора</p>
      </div>

      {uploads.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          {uploads.map(({ file, progress, status, url, error }) => (
            <div key={file.name} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{file.name}</span>
                <span>{status === 'done' ? '✓' : `${progress}%`}</span>
              </div>
              <div
                style={{
                  height: '4px',
                  backgroundColor: '#eee',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor:
                      status === 'error'
                        ? '#ff4444'
                        : status === 'done'
                        ? '#00c853'
                        : '#2196f3',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
              {error && (
                <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>
              )}
              {url && (
                <a href={url} target="_blank" rel="noreferrer">
                  Открыть файл
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Стилизация компонента

### С помощью CSS-классов

Используйте `className` для стилизации через обычный CSS:

```tsx
import { useDropzone } from 'react-dropzone';
import styles from './Dropzone.module.css';

function CSSDropzone() {
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({ accept: { 'image/*': [] } });

  const getClassName = () => {
    if (isDragReject) return `${styles.dropzone} ${styles.reject}`;
    if (isDragActive) return `${styles.dropzone} ${styles.active}`;
    return styles.dropzone;
  };

  return (
    <div {...getRootProps({ className: getClassName() })}>
      <input {...getInputProps()} />
      <p>Перетащите изображения сюда</p>
    </div>
  );
}
```

```css
/* Dropzone.module.css */
.dropzone {
  padding: 40px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  outline: none;
}

.dropzone:hover {
  border-color: #2196f3;
  background-color: #f0f7ff;
}

.dropzone.active {
  border-color: #2196f3;
  background-color: #e3f2fd;
}

.dropzone.reject {
  border-color: #f44336;
  background-color: #ffebee;
}
```

### С помощью Tailwind CSS

```tsx
import { useDropzone } from 'react-dropzone';

function TailwindDropzone() {
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({ accept: { 'image/*': [] } });

  const baseClass =
    'flex flex-col items-center justify-center p-10 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-300';

  const stateClass = isDragReject
    ? 'border-red-500 bg-red-50'
    : isDragActive
    ? 'border-blue-500 bg-blue-50'
    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50';

  return (
    <div {...getRootProps({ className: `${baseClass} ${stateClass}` })}>
      <input {...getInputProps()} />
      <svg
        className="w-12 h-12 text-gray-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      {isDragReject ? (
        <p className="text-red-500">Неподдерживаемый тип файла</p>
      ) : isDragActive ? (
        <p className="text-blue-500">Отпустите файлы для загрузки</p>
      ) : (
        <>
          <p className="text-gray-600 font-medium">
            Перетащите файлы сюда
          </p>
          <p className="text-gray-400 text-sm mt-1">
            или нажмите для выбора
          </p>
        </>
      )}
    </div>
  );
}
```

## Предпросмотр изображений

Часто нужно показывать превью загружаемых изображений. Используйте `URL.createObjectURL`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface PreviewFile extends File {
  preview: string;
}

function ImagePreviewDropzone() {
  const [files, setFiles] = useState<PreviewFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )
    );
  }, []);

  // Освобождаем URL при размонтировании компонента
  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop,
  });

  return (
    <div>
      <div {...getRootProps({ style: { border: '2px dashed #ccc', padding: '20px' } })}>
        <input {...getInputProps()} />
        <p>Перетащите изображения</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
        {files.map((file) => (
          <div
            key={file.name}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <img
              src={file.preview}
              alt={file.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onLoad={() => URL.revokeObjectURL(file.preview)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Полный пример компонента загрузки

Вот законченный компонент с TypeScript, валидацией, превью и загрузкой:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import axios from 'axios';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

interface FileUploaderProps {
  maxFiles?: number;
  maxSize?: number; // байты
  accept?: Record<string, string[]>;
  onUploadComplete?: (urls: string[]) => void;
}

export function FileUploader({
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10 MB
  accept = { 'image/*': [] },
  onUploadComplete,
}: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [rejectionErrors, setRejectionErrors] = useState<string[]>([]);

  // Освобождаем object URLs
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [uploadedFiles]);

  const updateFile = (id: string, update: Partial<UploadedFile>) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...update } : f))
    );
  };

  const uploadSingleFile = async (file: UploadedFile, rawFile: File) => {
    updateFile(file.id, { status: 'uploading' });

    const formData = new FormData();
    formData.append('file', rawFile);

    try {
      const response = await axios.post<{ url: string }>('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const progress = Math.round(((e.loaded || 0) * 100) / (e.total || 1));
          updateFile(file.id, { progress });
        },
      });

      updateFile(file.id, {
        status: 'done',
        progress: 100,
        url: response.data.url,
      });

      return response.data.url;
    } catch {
      updateFile(file.id, { status: 'error', error: 'Ошибка загрузки' });
      return null;
    }
  };

  const onDrop = useCallback(
    async (accepted: File[], rejected: FileRejection[]) => {
      // Обрабатываем ошибки валидации
      const errors = rejected.flatMap(({ file, errors }) =>
        errors.map((e) => `${file.name}: ${e.message}`)
      );
      setRejectionErrors(errors);

      if (accepted.length === 0) return;

      // Создаём записи для принятых файлов
      const newFiles: UploadedFile[] = accepted.map((file) => ({
        id: Math.random().toString(36).slice(2),
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending',
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Загружаем все файлы параллельно
      const results = await Promise.all(
        newFiles.map((f, i) => uploadSingleFile(f, accepted[i]))
      );

      const successUrls = results.filter(Boolean) as string[];
      onUploadComplete?.(successUrls);
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({ onDrop, accept, maxSize, maxFiles });

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  return (
    <div className="file-uploader">
      {/* Зона перетаскивания */}
      <div
        {...getRootProps({
          className: [
            'dropzone',
            isDragReject && 'dropzone--reject',
            isDragActive && !isDragReject && 'dropzone--active',
          ]
            .filter(Boolean)
            .join(' '),
        })}
      >
        <input {...getInputProps()} />
        <p>
          {isDragReject
            ? 'Неподдерживаемый тип файла'
            : isDragActive
            ? 'Отпустите файлы для загрузки'
            : 'Перетащите файлы или нажмите для выбора'}
        </p>
        <small>
          Максимум {maxFiles} файлов, до {Math.round(maxSize / 1024 / 1024)} MB
          каждый
        </small>
      </div>

      {/* Ошибки валидации */}
      {rejectionErrors.length > 0 && (
        <div className="errors">
          {rejectionErrors.map((err, i) => (
            <p key={i} className="error">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Список загружаемых файлов */}
      {uploadedFiles.length > 0 && (
        <ul className="file-list">
          {uploadedFiles.map((file) => (
            <li key={file.id} className="file-item">
              <img
                src={file.preview}
                alt={file.name}
                width={48}
                height={48}
                style={{ objectFit: 'cover', borderRadius: '4px' }}
              />
              <div className="file-info">
                <span>{file.name}</span>
                <span>{(file.size / 1024).toFixed(1)} KB</span>
                {file.status === 'uploading' && (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {file.status === 'done' && <span>✓ Загружено</span>}
                {file.status === 'error' && (
                  <span className="error">{file.error}</span>
                )}
              </div>
              <button onClick={() => removeFile(file.id)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Пользовательская валидация

Если встроенных правил недостаточно, используйте параметр `validator`:

```tsx
import { useDropzone, FileError } from 'react-dropzone';

const fileNameValidator = (file: File): FileError | FileError[] | null => {
  // Запрещаем файлы с пробелами в имени
  if (file.name.includes(' ')) {
    return {
      code: 'name-has-spaces',
      message: 'Имя файла не должно содержать пробелы',
    };
  }

  // Запрещаем файлы старше определённой длины имени
  if (file.name.length > 50) {
    return {
      code: 'name-too-long',
      message: 'Имя файла не должно превышать 50 символов',
    };
  }

  return null; // валидация пройдена
};

function ValidatedDropzone() {
  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    validator: fileNameValidator,
  });

  return (
    <div>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <p>Файлы без пробелов в имени, максимум 50 символов</p>
      </div>
      {fileRejections.map(({ file, errors }) => (
        <div key={file.name}>
          {errors.map((e) => (
            <p key={e.code} style={{ color: 'red' }}>
              {file.name}: {e.message}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Заключение

**react-dropzone** — зрелая и гибкая библиотека для реализации загрузки файлов в React-приложениях. Её хук `useDropzone` даёт полный контроль над зоной перетаскивания без навязывания какой-либо стилизации.

Ключевые возможности, которые вы теперь знаете:

- **Хук `useDropzone`** — основа библиотеки, предоставляет пропсы для drag & drop зоны и входного элемента
- **Параметры `accept`, `maxSize`, `multiple`, `maxFiles`** — встроенная валидация файлов
- **Флаги состояния** (`isDragActive`, `isDragAccept`, `isDragReject`, `isFocused`) — для визуальной обратной связи
- **`fileRejections`** — детальная информация об ошибках валидации
- **Загрузка через `fetch` или `axios`** — `FormData` для multipart/form-data запросов
- **Прогресс загрузки** — через `onUploadProgress` в axios
- **`URL.createObjectURL`** — для предпросмотра изображений (не забывайте освобождать через `revokeObjectURL`)
- **Пользовательская валидация** через параметр `validator`

При работе с предпросмотром изображений важно своевременно вызывать `URL.revokeObjectURL`, чтобы избежать утечек памяти. Лучшее место для этого — обработчик `onLoad` изображения или эффект очистки в `useEffect`.

React Dropzone отлично сочетается с библиотеками для управления состоянием формы (Formik, React Hook Form) и UI-фреймворками (Material UI, Tailwind CSS), что делает её универсальным выбором для большинства React-проектов.
