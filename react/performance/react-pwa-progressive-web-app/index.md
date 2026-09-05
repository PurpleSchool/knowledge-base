---
metaTitle: "React PWA: создание Progressive Web App с React"
metaDescription: "Полное руководство по созданию Progressive Web App с React: Service Worker, Web App Manifest, офлайн-режим, кэширование и установка на устройство."
author: "Антон Ларичев"
title: "React PWA: Progressive Web App с React"
preview: "Как превратить React-приложение в полноценный PWA: Service Worker, манифест, офлайн-режим и установка на устройство."
---

## Что такое Progressive Web App

Progressive Web App (PWA) — это веб-приложение, которое использует современные браузерные API для обеспечения возможностей, ранее доступных только нативным приложениям: работа офлайн, push-уведомления, установка на устройство, быстрая загрузка.

PWA не требует магазина приложений. Пользователь открывает сайт в браузере, и если приложение соответствует критериям PWA, браузер предложит установить его на домашний экран.

Ключевые характеристики PWA:

- **Надёжность** — работает офлайн или при нестабильном соединении
- **Скорость** — быстрый запуск благодаря кэшированию
- **Нативность** — выглядит и ведёт себя как нативное приложение

## Технические основы PWA

PWA строится на трёх столпах:

1. **Service Worker** — скрипт, работающий в фоновом потоке, отдельно от основного потока браузера. Перехватывает сетевые запросы, управляет кэшем, обрабатывает push-уведомления.

2. **Web App Manifest** — JSON-файл, описывающий приложение: название, иконки, цвета, режим отображения.

3. **HTTPS** — PWA работают только по защищённому соединению (исключение — localhost для разработки).

## Создание React PWA с Vite

Самый простой способ начать — использовать плагин `vite-plugin-pwa`.

```bash
npm create vite@latest my-pwa -- --template react-ts
cd my-pwa
npm install
npm install -D vite-plugin-pwa
```

Настройка `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My React PWA',
        short_name: 'ReactPWA',
        description: 'Моё Progressive Web приложение на React',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ]
})
```

## Web App Manifest

Если вы настраиваете манифест вручную, создайте файл `public/manifest.json`:

```json
{
  "name": "My React PWA",
  "short_name": "ReactPWA",
  "description": "Моё Progressive Web приложение",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "categories": ["productivity"],
  "lang": "ru"
}
```

Подключите манифест в `index.html`:

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#3b82f6" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

### Параметры display

| Значение | Описание |
|---|---|
| `standalone` | Похоже на нативное приложение, без адресной строки |
| `fullscreen` | Полный экран, без UI браузера |
| `minimal-ui` | Минимальный UI браузера (кнопки навигации) |
| `browser` | Обычная вкладка браузера |

## Service Worker

Service Worker — это прокси между браузером и сетью. Он регистрируется отдельно и работает даже когда страница закрыта.

### Жизненный цикл Service Worker

```
Install → Activate → Fetch/Sync/Push
```

- **Install** — скачивание и кэширование ресурсов
- **Activate** — очистка старого кэша, Service Worker готов к работе
- **Fetch** — перехват сетевых запросов

### Ручное создание Service Worker

Создайте файл `public/sw.js`:

```javascript
const CACHE_NAME = 'app-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/css/main.chunk.css',
  '/icons/icon-192.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response
        }
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })
        return response
      })
    })
  )
})
```

### Стратегии кэширования

**Cache First** — сначала кэш, при промахе — сеть. Подходит для статических ресурсов (иконки, шрифты).

**Network First** — сначала сеть, при ошибке — кэш. Подходит для API-запросов.

**Stale While Revalidate** — возвращает кэш немедленно, параллельно обновляет его из сети. Баланс скорости и актуальности.

```javascript
// Network First с fallback на кэш
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open('api-cache').then((cache) => {
            cache.put(event.request, clone)
          })
          return response
        })
        .catch(() => caches.match(event.request))
    )
  }
})
```

## Регистрация Service Worker в React

Создайте хук для управления Service Worker:

```typescript
import { useEffect, useState } from 'react'

interface ServiceWorkerState {
  isInstalled: boolean
  isUpdating: boolean
  updateAvailable: boolean
  update: () => void
}

export function useServiceWorker(): ServiceWorkerState {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        setIsInstalled(true)

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true)
              setWaitingWorker(newWorker)
            }
          })
        })
      })
      .catch(console.error)
  }, [])

  const update = () => {
    if (!waitingWorker) return
    setIsUpdating(true)
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }

  return { isInstalled, isUpdating, updateAvailable, update }
}
```

Использование хука для показа уведомления об обновлении:

```typescript
import { useServiceWorker } from './hooks/useServiceWorker'

export function UpdateNotification() {
  const { updateAvailable, update } = useServiceWorker()

  if (!updateAvailable) return null

  return (
    <div className="update-banner">
      <p>Доступна новая версия приложения</p>
      <button onClick={update}>Обновить</button>
    </div>
  )
}
```

## Кнопка установки PWA

Браузер генерирует событие `beforeinstallprompt`, когда приложение соответствует критериям установки:

```typescript
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPWA() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    })

    // Проверка: уже установлено как standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  return { canInstall: !!installPrompt, isInstalled, install }
}
```

Компонент кнопки:

```typescript
import { useInstallPWA } from './hooks/useInstallPWA'

export function InstallButton() {
  const { canInstall, isInstalled, install } = useInstallPWA()

  if (isInstalled) {
    return <span>Приложение установлено</span>
  }

  if (!canInstall) return null

  return (
    <button onClick={install} className="install-btn">
      Установить приложение
    </button>
  )
}
```

## Определение статуса соединения

```typescript
import { useEffect, useState } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

```typescript
import { useNetworkStatus } from './hooks/useNetworkStatus'

export function OfflineBanner() {
  const isOnline = useNetworkStatus()

  if (isOnline) return null

  return (
    <div className="offline-banner">
      Нет подключения к интернету. Показаны кэшированные данные.
    </div>
  )
}
```

## Проверка PWA-критериев

Chrome DevTools предоставляет вкладку Lighthouse для аудита PWA. Минимальные требования для установки:

- Наличие Web App Manifest с обязательными полями
- Service Worker зарегистрирован и контролирует страницу
- Иконки не менее 192x192 и 512x512
- Страница доступна по HTTPS
- Страница работает офлайн (возвращает хотя бы 200 при отключённой сети)

Проверить статус Service Worker можно в DevTools:

```
Application > Service Workers
```

Для отладки кэша:

```
Application > Cache Storage
```

## Workbox: промышленный подход

Workbox — библиотека от Google для работы с Service Worker. `vite-plugin-pwa` использует Workbox под капотом.

Ручная настройка стратегий с Workbox:

```javascript
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Precache — кэшировать все статические ресурсы при установке
precacheAndRoute(self.__WB_MANIFEST)

// API запросы: Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60
      })
    ]
  })
)

// Изображения: Cache First
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
)

// Шрифты Google: Stale While Revalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts' })
)
```

## Распространённые ошибки

**Service Worker не обновляется** — браузер использует старый SW, если не вызван `skipWaiting()`. Убедитесь, что ваш SW при получении сообщения `SKIP_WAITING` вызывает `self.skipWaiting()`.

```javascript
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
```

**Кэш не инвалидируется** — при изменении файлов меняйте имя кэша (`CACHE_NAME = 'app-v2'`). Workbox делает это автоматически через хэши файлов.

**CORS при кэшировании** — нельзя кэшировать opaque-ответы (cross-origin без CORS) стратегией Cache First: при ошибке сервера в кэш попадёт ответ со статусом 0.

**iOS Safari** — не поддерживает push-уведомления для PWA (до Safari 16.4). Учитывайте это при планировании функциональности.

## Итог

PWA на React — это прагматичный способ улучшить пользовательский опыт без разработки нативных приложений. Service Worker даёт офлайн-работу и кэширование, Web App Manifest — установку на устройство, а Workbox упрощает управление стратегиями кэширования.

Для большинства проектов оптимальный старт — `vite-plugin-pwa` с конфигурацией `generateSW`: он автоматически создаёт Service Worker на основе Workbox, прекэширует статику и позволяет гибко настраивать стратегии для динамических данных.

Чтобы углубить знания React и научиться строить production-ready приложения, пройдите курс по React на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-pwa