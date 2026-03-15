---
metaTitle: React PDF - работа с PDF файлами в React приложениях
metaDescription: Полное руководство по react-pdf и @react-pdf/renderer: отображение PDF в браузере, генерация PDF-документов из React-компонентов, настройка страниц, аннотации, текстовый слой, TypeScript
author: Олег Марков
title: React PDF - работа с PDF файлами
preview: Узнайте как работать с PDF файлами в React. Отображение PDF через react-pdf с поддержкой PDF.js, генерация документов с помощью @react-pdf/renderer, настройка страниц, текстовый слой, аннотации и TypeScript поддержка
---

## Введение

Работа с PDF-файлами — распространённая задача в современных веб-приложениях. Это могут быть отчёты, счета, договоры, руководства пользователя или любые другие документы. React предоставляет два основных инструмента для работы с PDF:

- **react-pdf** — библиотека для **отображения** PDF-файлов в браузере на основе Mozilla PDF.js
- **@react-pdf/renderer** — библиотека для **генерации** PDF-документов из React-компонентов

В этой статье вы узнаете, как использовать обе библиотеки: научитесь встраивать PDF-просмотрщик в своё приложение с поддержкой навигации, поиска и аннотаций, а также создавать красивые PDF-документы программным способом прямо из React-компонентов.

## Часть 1: react-pdf — отображение PDF в браузере

### Что такое react-pdf

**react-pdf** (пакет `react-pdf` на npm, автор Wojciech Maj) — это React-обёртка над Mozilla PDF.js. Она позволяет встраивать PDF-документы прямо в React-приложения без использования тегов `<iframe>` или `<embed>`, предоставляя полный контроль над отображением через React-компоненты.

Основные возможности библиотеки:

- Отображение любых PDF-документов в браузере
- Навигация по страницам
- Масштабирование и поворот
- Текстовый слой для выделения и копирования текста
- Слой аннотаций (ссылки, заметки)
- Поддержка паролей для защищённых PDF
- TypeScript-типы из коробки

### Установка react-pdf

```bash
# npm
npm install react-pdf

# yarn
yarn add react-pdf

# pnpm
pnpm add react-pdf
```

Начиная с версии 7, react-pdf использует PDF.js из пакета `pdfjs-dist`. Вам нужно настроить worker — специальный файл, который выполняет тяжёлые вычисления в фоновом потоке:

```tsx
// В начале вашего приложения (например, App.tsx или index.tsx)
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
```

Если вы используете Create React App или webpack, этот подход с `new URL()` работает из коробки. Для Next.js нужна дополнительная настройка (рассмотрим ниже).

### Базовое использование

После установки можно сразу начать отображать PDF-документы. Библиотека предоставляет компоненты `Document` и `Page`:

```tsx
import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

function PDFViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div>
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
      >
        <Page pageNumber={pageNumber} />
      </Document>
      <p>
        Страница {pageNumber} из {numPages}
      </p>
    </div>
  );
}
```

Обратите внимание на импорт CSS-файлов — они нужны для корректного отображения текстового слоя и аннотаций.

### Источники файлов

`react-pdf` поддерживает несколько источников для загрузки PDF:

```tsx
// URL (строка)
<Document file="https://example.com/document.pdf" />

// Относительный путь
<Document file="/documents/report.pdf" />

// File объект (например, из input)
<Document file={selectedFile} />

// ArrayBuffer
<Document file={arrayBuffer} />

// Base64 строка с данными
<Document file={`data:application/pdf;base64,${base64String}`} />

// Объект с URL и заголовками (для авторизованных запросов)
<Document
  file={{
    url: 'https://example.com/protected.pdf',
    httpHeaders: {
      Authorization: 'Bearer your-token',
    },
    withCredentials: true,
  }}
/>
```

### Навигация по страницам

Давайте создадим полноценный компонент с навигацией:

```tsx
import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  file: string;
}

export function PDFViewer({ file }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPageNumber(1);
    },
    []
  );

  const goToPrevPage = () =>
    setPageNumber((prev) => Math.max(prev - 1, 1));

  const goToNextPage = () =>
    setPageNumber((prev) => Math.min(prev + 1, numPages));

  return (
    <div className="pdf-viewer">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => console.error('Ошибка загрузки:', error)}
      >
        <Page
          pageNumber={pageNumber}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>

      <div className="pdf-controls">
        <button
          onClick={goToPrevPage}
          disabled={pageNumber <= 1}
        >
          ← Назад
        </button>
        <span>
          {pageNumber} / {numPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={pageNumber >= numPages}
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}
```

### Масштабирование страниц

Компонент `Page` поддерживает несколько способов задать размер:

```tsx
// Через ширину (высота подбирается автоматически)
<Page pageNumber={1} width={600} />

// Через высоту
<Page pageNumber={1} height={800} />

// Через масштаб (1 = 100%)
<Page pageNumber={1} scale={1.5} />
```

Добавим масштабирование в наш компонент:

```tsx
export function PDFViewerWithZoom({ file }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);

  return (
    <div>
      <div className="toolbar">
        <button onClick={zoomOut} disabled={scale <= 0.5}>−</button>
        <button onClick={resetZoom}>{Math.round(scale * 100)}%</button>
        <button onClick={zoomIn} disabled={scale >= 3.0}>+</button>
      </div>

      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>

      <div className="navigation">
        <button
          onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
          disabled={pageNumber <= 1}
        >
          ← Назад
        </button>
        <input
          type="number"
          value={pageNumber}
          min={1}
          max={numPages}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= numPages) {
              setPageNumber(page);
            }
          }}
        />
        <span>из {numPages}</span>
        <button
          onClick={() => setPageNumber((p) => Math.min(p + 1, numPages))}
          disabled={pageNumber >= numPages}
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}
```

### Отображение всех страниц

Иногда нужно показать все страницы документа сразу (например, в режиме предварительного просмотра):

```tsx
import { Document, Page } from 'react-pdf';
import { useState } from 'react';

function AllPagesViewer({ file }: { file: string }) {
  const [numPages, setNumPages] = useState<number>(0);

  return (
    <Document
      file={file}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
    >
      {Array.from({ length: numPages }, (_, index) => (
        <Page
          key={`page-${index + 1}`}
          pageNumber={index + 1}
          width={600}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          className="pdf-page"
        />
      ))}
    </Document>
  );
}
```

### Состояния загрузки и ошибки

Компоненты `Document` и `Page` поддерживают кастомные загрузчики и сообщения об ошибках:

```tsx
function PDFViewerWithStates({ file }: { file: string }) {
  return (
    <Document
      file={file}
      loading={
        <div className="loading-spinner">
          <span>Загрузка документа...</span>
        </div>
      }
      error={
        <div className="error-message">
          <p>Не удалось загрузить PDF</p>
          <p>Проверьте корректность файла</p>
        </div>
      }
      noData={
        <div className="no-data">
          Файл не выбран
        </div>
      }
    >
      <Page
        pageNumber={1}
        loading={
          <div className="page-loading">
            Загрузка страницы...
          </div>
        }
        error={
          <div className="page-error">
            Ошибка загрузки страницы
          </div>
        }
      />
    </Document>
  );
}
```

Также можно использовать callback для обработки ошибок:

```tsx
<Document
  file={file}
  onLoadError={(error) => {
    console.error('Ошибка загрузки PDF:', error);
    // Показать уведомление пользователю
    toast.error(`Ошибка: ${error.message}`);
  }}
  onSourceError={(error) => {
    console.error('Ошибка источника файла:', error);
  }}
>
```

### Текстовый слой и аннотации

Текстовый слой позволяет выделять и копировать текст из PDF. Слой аннотаций отображает ссылки, заметки и другие интерактивные элементы:

```tsx
<Page
  pageNumber={1}
  // Текстовый слой — включён по умолчанию
  renderTextLayer={true}
  // Слой аннотаций — включён по умолчанию
  renderAnnotationLayer={true}
  // Callback при успешной загрузке аннотаций
  onGetAnnotationsSuccess={(annotations) => {
    console.log('Аннотации:', annotations);
  }}
/>
```

Обязательно подключите CSS для корректного отображения:

```tsx
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
```

### Поддержка паролей

Для защищённых паролем PDF-файлов:

```tsx
import { useState } from 'react';
import { Document, Page } from 'react-pdf';

function ProtectedPDFViewer({ file }: { file: string }) {
  const [inputPassword, setInputPassword] = useState('');
  const [passwordCallback, setPasswordCallback] = useState<
    ((password: string) => void) | null
  >(null);

  return (
    <div>
      {passwordCallback && (
        <div className="password-prompt">
          <p>Этот документ защищён паролем</p>
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            placeholder="Введите пароль"
          />
          <button
            onClick={() => {
              passwordCallback(inputPassword);
              setPasswordCallback(null);
            }}
          >
            Открыть
          </button>
        </div>
      )}

      <Document
        file={file}
        onPassword={(callback, reason) => {
          // reason: 1 = первый запрос, 2 = неверный пароль
          if (reason === 2) {
            alert('Неверный пароль, попробуйте снова');
          }
          // Сохраняем callback для вызова после ввода пользователем
          setPasswordCallback(() => callback);
        }}
      >
        <Page pageNumber={1} />
      </Document>
    </div>
  );
}
```

### Вращение страниц

```tsx
import { useState } from 'react';
import { Document, Page } from 'react-pdf';

function RotatablePDFPage() {
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);

  const rotate = () => {
    setRotation((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
  };

  return (
    <div>
      <button onClick={rotate}>Повернуть на 90°</button>
      <Document file="/document.pdf">
        <Page
          pageNumber={1}
          rotate={rotation}
        />
      </Document>
    </div>
  );
}
```

### Настройка в Next.js

В Next.js нужна дополнительная конфигурация для корректной работы с PDF.js worker:

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Исключаем canvas из серверного рендеринга
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
```

```tsx
// components/PDFViewer.tsx — клиентский компонент
'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PDFViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <div>
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        <Page pageNumber={pageNumber} />
      </Document>
      <p>{pageNumber} / {numPages}</p>
    </div>
  );
}
```

```tsx
// app/document/page.tsx — серверный компонент Next.js
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(
  () => import('@/components/PDFViewer').then((mod) => mod.PDFViewer),
  { ssr: false }
);

export default function DocumentPage() {
  return (
    <main>
      <PDFViewer url="/documents/report.pdf" />
    </main>
  );
}
```

### Миниатюры страниц

Создадим компонент с панелью миниатюр для удобной навигации:

```tsx
import { useState } from 'react';
import { Document, Page } from 'react-pdf';

function PDFViewerWithThumbnails({ file }: { file: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  return (
    <div className="pdf-layout" style={{ display: 'flex', gap: 16 }}>
      {/* Панель миниатюр */}
      <div className="thumbnails-panel" style={{ width: 120, overflowY: 'auto' }}>
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={{
                cursor: 'pointer',
                border: currentPage === i + 1 ? '2px solid blue' : '2px solid transparent',
                marginBottom: 8,
              }}
            >
              <Page
                pageNumber={i + 1}
                width={100}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              <p style={{ textAlign: 'center', margin: 0, fontSize: 11 }}>{i + 1}</p>
            </div>
          ))}
        </Document>
      </div>

      {/* Основная область просмотра */}
      <div className="main-viewer">
        <Document file={file}>
          <Page
            pageNumber={currentPage}
            width={700}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
```

### Загрузка файла через input

Обработка выбора файла пользователем:

```tsx
import { useState } from 'react';
import { Document, Page } from 'react-pdf';

function PDFFileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setNumPages(0);
    } else {
      alert('Пожалуйста, выберите PDF файл');
    }
  };

  return (
    <div>
      <div className="upload-section">
        <label htmlFor="pdf-upload" className="upload-button">
          Выбрать PDF файл
        </label>
        <input
          id="pdf-upload"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {file && <span>{file.name}</span>}
      </div>

      {file && (
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          ))}
        </Document>
      )}
    </div>
  );
}
```

---

## Часть 2: @react-pdf/renderer — генерация PDF

### Что такое @react-pdf/renderer

**@react-pdf/renderer** — это библиотека для создания PDF-документов из React-компонентов. Она позволяет описывать структуру и стиль PDF-документа с помощью знакомых React-компонентов, похожих на обычные HTML-элементы.

Основные возможности:

- Генерация PDF на стороне клиента (браузер) и сервера (Node.js)
- Flexbox-вёрстка для позиционирования элементов
- Поддержка кастомных шрифтов
- Изображения (JPEG, PNG, BMP, TIFF, GIF)
- SVG-элементы
- Гиперссылки и заметки

### Установка @react-pdf/renderer

```bash
npm install @react-pdf/renderer

# или
yarn add @react-pdf/renderer

# или
pnpm add @react-pdf/renderer
```

### Базовая структура документа

Каждый PDF-документ строится из нескольких ключевых компонентов:

```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// Стили — похожи на CSS, но с ограничениями
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  section: {
    marginBottom: 16,
  },
  text: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#555555',
  },
});

// Компонент документа
const MyDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Мой первый PDF документ</Text>
        <Text style={styles.text}>
          Этот документ создан с помощью @react-pdf/renderer.
          Вы можете использовать знакомый синтаксис React для описания
          структуры PDF-файла.
        </Text>
      </View>
    </Page>
  </Document>
);
```

### Доступные компоненты

| Компонент | Описание |
|-----------|----------|
| `Document` | Корневой контейнер документа |
| `Page` | Страница документа |
| `View` | Блочный контейнер (аналог `div`) |
| `Text` | Текстовый элемент |
| `Image` | Изображение (JPEG, PNG) |
| `Link` | Гиперссылка |
| `Note` | Комментарий/заметка |
| `Canvas` | Пользовательская отрисовка |
| `Svg` | SVG-контейнер |
| `Line`, `Rect`, `Circle`, `Path` | SVG-элементы |

### Стилизация

Стили в @react-pdf/renderer похожи на CSS, но имеют ряд ограничений и особенностей:

```tsx
import { StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  // Flexbox — основной способ вёрстки
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  // Текст
  heading: {
    fontSize: 18,
    fontWeight: 'bold',        // 'normal', 'bold', 100-900
    fontStyle: 'italic',       // 'normal', 'italic'
    textAlign: 'center',       // 'left', 'right', 'center', 'justify'
    textDecoration: 'underline',
    color: '#1a1a2e',
    letterSpacing: 1,
    lineHeight: 1.5,
  },

  // Отступы и границы
  box: {
    margin: 10,
    padding: '10 20',          // вертикальные горизонтальные
    border: '1 solid #cccccc',
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
});
```

### Создание счёта (Invoice)

Рассмотрим практический пример — генерация счёта:

```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceProps {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
}

const styles = StyleSheet.create({
  page: {
    padding: '40 50',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2 solid #4a90d9',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a90d9',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a90d9',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#4a90d9',
    textTransform: 'uppercase',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4a90d9',
    padding: '6 10',
    color: 'white',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #ddd',
    padding: '6 10',
  },
  tableRowEven: {
    backgroundColor: '#f8f9fa',
  },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    padding: '8 10',
    borderTop: '2 solid #4a90d9',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    color: '#aaa',
    borderTop: '0.5 solid #ddd',
    paddingTop: 10,
  },
});

const Invoice = ({
  invoiceNumber,
  date,
  clientName,
  clientEmail,
  items,
}: InvoiceProps) => {
  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Шапка */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>ООО «МояКомпания»</Text>
            <Text>ИНН: 1234567890</Text>
            <Text>Тел: +7 (495) 123-45-67</Text>
            <Text>info@mycompany.ru</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>СЧЁТ</Text>
            <Text style={styles.invoiceNumber}>№ {invoiceNumber}</Text>
            <Text style={styles.invoiceNumber}>от {date}</Text>
          </View>
        </View>

        {/* Данные клиента */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Счёт выставлен:</Text>
          <Text>{clientName}</Text>
          <Text>{clientEmail}</Text>
        </View>

        {/* Таблица товаров */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Наименование</Text>
            <Text style={styles.col2}>Кол-во</Text>
            <Text style={styles.col3}>Цена</Text>
            <Text style={styles.col4}>Итого</Text>
          </View>

          {items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : {},
              ]}
            >
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>
                {item.price.toLocaleString('ru-RU')} ₽
              </Text>
              <Text style={styles.col4}>
                {(item.quantity * item.price).toLocaleString('ru-RU')} ₽
              </Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={[styles.col1, { flex: 5 }]}>ИТОГО К ОПЛАТЕ:</Text>
            <Text style={styles.col4}>
              {total.toLocaleString('ru-RU')} ₽
            </Text>
          </View>
        </View>

        {/* Подвал */}
        <Text style={styles.footer}>
          Оплатите счёт в течение 5 рабочих дней. Спасибо за сотрудничество!
        </Text>
      </Page>
    </Document>
  );
};

export default Invoice;
```

### Добавление изображений

```tsx
import { Document, Page, View, Image, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40 },
  image: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    marginBottom: 10,
  },
  caption: {
    fontSize: 9,
    color: '#888',
    textAlign: 'center',
  },
});

const ImageDocument = () => (
  <Document>
    <Page style={styles.page}>
      {/* Загрузка по URL */}
      <Image
        style={styles.image}
        src="https://example.com/photo.jpg"
      />
      <Text style={styles.caption}>Рисунок 1: Пример изображения</Text>

      {/* Base64 изображение */}
      <Image
        style={styles.image}
        src={`data:image/png;base64,${base64ImageData}`}
      />
    </Page>
  </Document>
);
```

### Кастомные шрифты

По умолчанию @react-pdf/renderer поддерживает Helvetica, Times и Courier. Для кириллицы и кастомного брендинга нужно подключить TTF/OTF шрифты:

```tsx
import { Font } from '@react-pdf/renderer';

// Регистрация шрифта из URL
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc9.ttf',
      fontWeight: 'bold',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu51xIIzI.ttf',
      fontStyle: 'italic',
    },
  ],
});

// Используем шрифт в стилях
const styles = StyleSheet.create({
  text: {
    fontFamily: 'Roboto',
    fontSize: 12,
  },
  boldText: {
    fontFamily: 'Roboto',
    fontWeight: 'bold',
  },
});
```

### Скачивание PDF в браузере

Для рендеринга и скачивания PDF в браузере используется компонент `PDFDownloadLink`:

```tsx
import { PDFDownloadLink } from '@react-pdf/renderer';

function DownloadButton() {
  return (
    <PDFDownloadLink
      document={
        <Invoice
          invoiceNumber="2026-001"
          date="15.03.2026"
          clientName="ООО Клиент"
          clientEmail="client@example.com"
          items={[
            { description: 'Разработка сайта', quantity: 1, price: 50000 },
            { description: 'Поддержка (мес)', quantity: 3, price: 10000 },
          ]}
        />
      }
      fileName="invoice-2026-001.pdf"
    >
      {({ loading, error }) =>
        loading
          ? 'Подготовка документа...'
          : error
          ? 'Ошибка генерации'
          : 'Скачать счёт PDF'
      }
    </PDFDownloadLink>
  );
}
```

### Просмотр PDF прямо в браузере

Компонент `PDFViewer` встраивает PDF прямо в страницу:

```tsx
import { PDFViewer } from '@react-pdf/renderer';

function PreviewPage() {
  return (
    <PDFViewer width="100%" height={600} style={{ border: 'none' }}>
      <Invoice
        invoiceNumber="2026-001"
        date="15.03.2026"
        clientName="ООО Клиент"
        clientEmail="client@example.com"
        items={[
          { description: 'Разработка', quantity: 1, price: 50000 },
        ]}
      />
    </PDFViewer>
  );
}
```

### Генерация PDF в Node.js (SSR)

На сервере используется `renderToBuffer` или `renderToStream`:

```tsx
import { renderToBuffer } from '@react-pdf/renderer';

// Генерация Buffer (для отправки через HTTP или сохранения)
async function generateInvoicePDF(invoiceData: InvoiceProps): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <Invoice {...invoiceData} />
  );
  return buffer as Buffer;
}

// Express.js маршрут
app.get('/invoice/:id', async (req, res) => {
  const invoice = await getInvoiceById(req.params.id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoice-${invoice.number}.pdf"`
  );

  const buffer = await generateInvoicePDF(invoice);
  res.send(buffer);
});
```

Для Next.js App Router:

```tsx
// app/api/invoice/[id]/route.ts
import { renderToBuffer } from '@react-pdf/renderer';
import { Invoice } from '@/components/Invoice';
import { getInvoiceById } from '@/lib/invoices';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const invoice = await getInvoiceById(params.id);

  const buffer = await renderToBuffer(
    <Invoice {...invoice} />
  );

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.number}.pdf"`,
    },
  });
}
```

### SVG-элементы в документе

@react-pdf/renderer поддерживает SVG для создания диаграмм и декоративных элементов:

```tsx
import {
  Document,
  Page,
  Svg,
  Line,
  Rect,
  Circle,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
});

const ChartDocument = () => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.chartTitle}>Статистика продаж</Text>

      {/* Горизонтальная линия разделителя */}
      <Svg height={2} width={500}>
        <Line
          x1={0} y1={1}
          x2={500} y2={1}
          strokeWidth={2}
          stroke="#4a90d9"
        />
      </Svg>

      {/* Простая столбчатая диаграмма */}
      <Svg height={160} width={320}>
        {[
          { value: 60, label: 'Янв' },
          { value: 90, label: 'Фев' },
          { value: 45, label: 'Мар' },
          { value: 120, label: 'Апр' },
          { value: 80, label: 'Май' },
        ].map((item, i) => (
          <React.Fragment key={i}>
            <Rect
              x={i * 60 + 10}
              y={140 - item.value}
              width={40}
              height={item.value}
              fill="#4a90d9"
              rx={3}
            />
            {/* Подпись */}
            <Text
              style={{ fontSize: 8 }}
              // x, y позиционируются как SVG-атрибуты
            >
              {item.label}
            </Text>
          </React.Fragment>
        ))}
      </Svg>

      {/* Круговой индикатор */}
      <Svg height={30} width={30}>
        <Circle cx={15} cy={15} r={12} fill="#27ae60" />
      </Svg>
    </Page>
  </Document>
);
```

### Гиперссылки в PDF

```tsx
import { Document, Page, Text, Link, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12 },
  link: {
    color: '#0066cc',
    textDecoration: 'underline',
  },
  section: { marginBottom: 12 },
});

const LinksDocument = () => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.section}>
        <Text>
          Посетите наш сайт:{' '}
          <Link src="https://example.com" style={styles.link}>
            example.com
          </Link>
        </Text>
      </View>

      <View>
        <Text>Полезные ресурсы:</Text>
        {[
          { text: 'React документация', url: 'https://react.dev' },
          { text: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
          { text: 'GitHub', url: 'https://github.com' },
        ].map((link) => (
          <Link key={link.url} src={link.url} style={styles.link}>
            • {link.text}
          </Link>
        ))}
      </View>
    </Page>
  </Document>
);
```

### Многостраничные документы

```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  coverPage: {
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a237e',
  },
  coverTitle: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 16,
    color: '#90caf9',
    marginTop: 16,
    textAlign: 'center',
  },
  contentPage: {
    padding: 40,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 10,
    color: '#aaa',
  },
});

const ReportDocument = ({ sections }: { sections: string[] }) => (
  <Document>
    {/* Обложка */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>Годовой отчёт 2026</Text>
      <Text style={styles.coverSubtitle}>ООО «МояКомпания»</Text>
    </Page>

    {/* Содержательные страницы */}
    {sections.map((content, index) => (
      <Page key={index} size="A4" style={styles.contentPage}>
        <View>
          <Text>{content}</Text>
        </View>
        {/* Номер страницы */}
        <Text style={styles.pageNumber}>
          Страница {index + 2}
        </Text>
      </Page>
    ))}
  </Document>
);
```

---

## Сравнение библиотек

| Критерий | react-pdf | @react-pdf/renderer |
|----------|-----------|---------------------|
| **Назначение** | Отображение PDF | Создание PDF |
| **Основа** | Mozilla PDF.js | Собственный рендерер |
| **Размер бандла** | ~900 KB (с worker) | ~500 KB |
| **SSR** | Только клиент | Клиент + сервер |
| **Кастомизация** | Отображение документа | Полная структура |
| **Сложность настройки** | Низкая | Средняя |
| **Кириллица** | Поддерживается | Требует TTF шрифт |

---

## Частые ошибки и решения

### Worker не найден (react-pdf)

**Проблема:** `Error: Setting up fake worker failed`

```tsx
// Неправильно — путь к worker неверный
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

// Правильно — использовать URL из node_modules
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
```

### Кириллица не отображается (@react-pdf/renderer)

**Проблема:** Кириллические символы показываются квадратиками или вопросительными знаками.

```tsx
// Решение: подключить TTF шрифт с поддержкой кириллицы
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
});

// Применить ко всем текстовым элементам
const styles = StyleSheet.create({
  text: { fontFamily: 'Roboto' },
});
```

### PDFViewer не работает в Next.js

**Проблема:** `Error: document is not defined` (SSR-окружение)

```tsx
// Решение: динамический импорт с ssr: false
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
);
```

### CORS при загрузке PDF по URL

**Проблема:** `Failed to fetch` при загрузке PDF с другого домена.

```tsx
// Решение 1: настроить CORS заголовки на сервере
// Access-Control-Allow-Origin: https://your-app.com

// Решение 2: проксировать через API Next.js
// app/api/pdf/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url');
  const response = await fetch(url!);
  const pdf = await response.arrayBuffer();

  return new Response(pdf, {
    headers: { 'Content-Type': 'application/pdf' },
  });
}

// В компоненте
<Document file="/api/pdf?url=https://external.com/doc.pdf" />

// Решение 3: использовать httpHeaders для авторизованных запросов
<Document
  file={{
    url: 'https://example.com/protected.pdf',
    httpHeaders: { Authorization: `Bearer ${token}` },
  }}
/>
```

### Медленная загрузка больших PDF (react-pdf)

```tsx
// Решение: виртуализация страниц с react-window
import { FixedSizeList } from 'react-window';
import { Document, Page } from 'react-pdf';
import { useState, useRef } from 'react';

function VirtualizedPDF({ file }: { file: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const PAGE_HEIGHT = 800;

  return (
    <Document
      file={file}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
    >
      <FixedSizeList
        height={600}
        itemCount={numPages}
        itemSize={PAGE_HEIGHT + 16}
        width="100%"
      >
        {({ index, style }) => (
          <div style={style}>
            <Page
              pageNumber={index + 1}
              height={PAGE_HEIGHT}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        )}
      </FixedSizeList>
    </Document>
  );
}
```

---

## Лучшие практики

### 1. Ленивая загрузка

Не загружайте PDF-библиотеки при первоначальной загрузке страницы — они достаточно тяжёлые:

```tsx
// Загружаем только когда нужно
const LazyPDFViewer = dynamic(
  () => import('./PDFViewer'),
  {
    ssr: false,
    loading: () => <div>Загрузка просмотрщика...</div>,
  }
);
```

### 2. Мемоизация документа (@react-pdf/renderer)

Компонент документа пересоздаётся при каждом рендере родителя, что вызывает повторную генерацию PDF:

```tsx
import { useMemo } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';

function InvoicePage({ invoiceData }: { invoiceData: InvoiceProps }) {
  // Мемоизируем, чтобы не пересоздавать при не связанных перерендерах
  const documentElement = useMemo(
    () => <Invoice {...invoiceData} />,
    [invoiceData]
  );

  return (
    <div>
      {/* Один экземпляр переиспользуем в разных компонентах */}
      <PDFViewer width="100%" height={500}>
        {documentElement}
      </PDFViewer>
      <PDFDownloadLink document={documentElement} fileName="invoice.pdf">
        {({ loading }) => loading ? 'Подготовка...' : 'Скачать PDF'}
      </PDFDownloadLink>
    </div>
  );
}
```

### 3. Обработка ошибок

```tsx
function SafePDFViewer({ url }: { url: string }) {
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  if (error) {
    return (
      <div className="pdf-error">
        <p>Не удалось загрузить документ: {error}</p>
        <button onClick={() => { setError(null); setRetryKey(k => k + 1); }}>
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <Document
      key={retryKey}
      file={url}
      onLoadError={(e) => setError(e.message)}
      onSourceError={(e) => setError(e.message)}
    >
      <Page pageNumber={1} />
    </Document>
  );
}
```

### 4. Оптимизация рендеринга страниц

```tsx
// Отключайте ненужные слои для ускорения
<Page
  pageNumber={pageNumber}
  // Текстовый слой — включать только если нужно выделение/копирование
  renderTextLayer={isTextSelectionEnabled}
  // Слой аннотаций — включать если есть ссылки в PDF
  renderAnnotationLayer={hasAnnotations}
  // Собственный лоадер вместо пустой области
  loading={<Skeleton width={600} height={800} />}
/>
```

### 5. Адаптивная ширина страницы

```tsx
import { useRef, useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';

function ResponsivePDF({ file }: { file: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(600);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Document file={file}>
        <Page
          pageNumber={1}
          width={pageWidth}
        />
      </Document>
    </div>
  );
}
```

---

## Итоги

В этой статье вы познакомились с двумя мощными библиотеками для работы с PDF в React:

**react-pdf** позволяет отображать любые PDF-документы прямо в браузере без сторонних просмотрщиков. Библиотека поддерживает навигацию, масштабирование, аннотации и текстовый слой, предоставляя полный контроль над отображением через React-компоненты. Настройка сводится к конфигурации PDF.js worker и импорту нескольких CSS-файлов.

**@react-pdf/renderer** открывает возможности для генерации PDF-документов — счетов, отчётов, сертификатов — прямо из React. Знакомый синтаксис компонентов, поддержка Flexbox и кастомных шрифтов делают создание сложных документов интуитивным. Библиотека работает как в браузере, так и на сервере (Node.js, Next.js API Routes).

Выбор между ними зависит от задачи: если нужно показывать готовые PDF — используйте react-pdf, если нужно их создавать — @react-pdf/renderer. В реальных приложениях оба инструмента часто используются совместно: @react-pdf/renderer генерирует документ, а react-pdf показывает его предварительный просмотр до скачивания.
