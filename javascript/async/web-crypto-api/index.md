---
metaTitle: "Web Crypto API в JavaScript — шифрование в браузере"
metaDescription: "Подробный разбор Web Crypto API: генерация ключей, шифрование AES-GCM, хеширование SHA-256, подписи ECDSA и работа с ArrayBuffer в браузере."
author: "Антон Ларичев"
title: "JavaScript Web Crypto API — криптография в браузере"
preview: "Как использовать встроенный Web Crypto API для шифрования данных, генерации ключей и цифровых подписей прямо в браузере без сторонних библиотек."
---

Web Crypto API — это встроенный браузерный интерфейс для выполнения криптографических операций. Он доступен через объект `window.crypto` и позволяет шифровать данные, генерировать ключи, вычислять хеши и создавать цифровые подписи без подключения сторонних библиотек. Все операции выполняются асинхронно через промисы.

## Что такое Web Crypto API

Web Crypto API стандартизирован консорциумом W3C и поддерживается во всех современных браузерах. Основная точка входа — `window.crypto.subtle`, объект типа `SubtleCrypto`. Название «subtle» (тонкий) указывает на то, что API предоставляет низкоуровневые примитивы, неправильное использование которых может привести к уязвимостям.

API поддерживает следующие алгоритмы:

- **Хеширование**: SHA-1, SHA-256, SHA-384, SHA-512
- **Симметричное шифрование**: AES-CBC, AES-CTR, AES-GCM, AES-KW
- **Асимметричное шифрование**: RSA-OAEP
- **Цифровые подписи**: RSASSA-PKCS1-v1_5, RSA-PSS, ECDSA
- **Генерация ключей**: ECDH, HKDF, PBKDF2

```javascript
// Проверка поддержки
if (!window.crypto || !window.crypto.subtle) {
  console.error('Web Crypto API не поддерживается');
}

console.log(window.crypto.subtle); // SubtleCrypto {}
```

## Работа с ArrayBuffer

Все криптографические операции работают с бинарными данными в формате `ArrayBuffer`. Для конвертации строк в байты и обратно используется `TextEncoder` / `TextDecoder`.

```javascript
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Строка → Uint8Array (ArrayBuffer)
const message = 'Привет, мир!';
const messageBytes = encoder.encode(message);
console.log(messageBytes); // Uint8Array [208, 159, 209, 128, ...]

// Uint8Array → строка
const restored = decoder.decode(messageBytes);
console.log(restored); // 'Привет, мир!'
```

Для передачи бинарных данных через JSON или URL используют кодировку Base64:

```javascript
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
```

## Хеширование данных

Хеширование — самая простая операция. Метод `crypto.subtle.digest()` принимает название алгоритма и данные, возвращает `ArrayBuffer` с хешем.

```javascript
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return hashBuffer;
}

async function sha256Hex(message) {
  const hashBuffer = await sha256(message);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Использование
const hash = await sha256Hex('password123');
console.log(hash);
// ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
```

Хеши применяют для проверки целостности данных, но **не для хранения паролей** — для этого нужен PBKDF2 или аналоги.

## Симметричное шифрование AES-GCM

AES-GCM (Galois/Counter Mode) — рекомендуемый алгоритм симметричного шифрования. Он обеспечивает как конфиденциальность, так и аутентификацию данных (проверяет, что данные не были изменены).

### Генерация ключа

```javascript
async function generateAESKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256, // длина ключа в битах: 128, 192 или 256
    },
    true,  // extractable: можно ли экспортировать ключ
    ['encrypt', 'decrypt'] // разрешённые операции
  );
  return key;
}
```

### Шифрование

```javascript
async function encrypt(key, plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // IV (Initialization Vector) — случайный вектор инициализации
  // Должен быть уникальным для каждой операции шифрования
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 бит для GCM

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // IV нужно хранить вместе с зашифрованными данными
  return { ciphertext, iv };
}
```

### Расшифровка

```javascript
async function decrypt(key, ciphertext, iv) {
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
```

### Полный пример шифрования и расшифровки

```javascript
async function demo() {
  const key = await generateAESKey();
  const message = 'Секретное сообщение';

  console.log('Исходное:', message);

  const { ciphertext, iv } = await encrypt(key, message);
  console.log('Зашифровано (байт):', ciphertext.byteLength);

  const decrypted = await decrypt(key, ciphertext, iv);
  console.log('Расшифровано:', decrypted);
}

demo();
```

## Экспорт и импорт ключей

Ключи Web Crypto API хранятся в виде непрозрачных объектов `CryptoKey`. Для сохранения или передачи ключ нужно экспортировать.

```javascript
async function exportKey(key) {
  // Форматы: 'raw', 'pkcs8', 'spki', 'jwk'
  const exported = await crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(exported);
}

async function importKey(jsonString) {
  const jwk = JSON.parse(jsonString);
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  return key;
}

// Сохранить ключ в localStorage
const key = await generateAESKey();
const exported = await exportKey(key);
localStorage.setItem('encryptionKey', exported);

// Восстановить ключ
const stored = localStorage.getItem('encryptionKey');
const restoredKey = await importKey(stored);
```

## Ключи из паролей — PBKDF2

Часто нужно получить криптографический ключ из пользовательского пароля. Для этого используют PBKDF2 (Password-Based Key Derivation Function 2).

```javascript
async function deriveKeyFromPassword(password, salt) {
  const encoder = new TextEncoder();

  // Импортируем пароль как «сырой» ключевой материал
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Выводим ключ AES-GCM из пароля
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000, // число итераций: чем больше, тем безопаснее
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // не экспортируемый
    ['encrypt', 'decrypt']
  );

  return key;
}

// Использование
const salt = 'unique-user-salt-12345'; // должен быть уникальным для каждого пользователя
const key = await deriveKeyFromPassword('myPassword123', salt);
const { ciphertext, iv } = await encrypt(key, 'Секретные данные');
```

Salt должен быть случайным и уникальным для каждого пользователя. Его хранят открыто рядом с зашифрованными данными.

```javascript
// Правильная генерация salt
const salt = crypto.getRandomValues(new Uint8Array(16));
const saltBase64 = arrayBufferToBase64(salt.buffer);
// Сохраняем saltBase64 вместе с зашифрованными данными
```

## Цифровые подписи ECDSA

Цифровые подписи позволяют проверить, что данные были подписаны владельцем приватного ключа.

```javascript
async function generateECDSAKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256', // кривая: P-256, P-384, P-521
    },
    true,
    ['sign', 'verify']
  );
  return keyPair; // { privateKey, publicKey }
}

async function signData(privateKey, data) {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(data)
  );
  return signature;
}

async function verifySignature(publicKey, signature, data) {
  const encoder = new TextEncoder();
  const isValid = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    signature,
    encoder.encode(data)
  );
  return isValid;
}

// Использование
const { privateKey, publicKey } = await generateECDSAKeyPair();
const message = 'Подтверждаю транзакцию #4291';

const signature = await signData(privateKey, message);
const isValid = await verifySignature(publicKey, signature, message);

console.log('Подпись верна:', isValid); // true

// Попытка верифицировать изменённые данные
const tampered = 'Подтверждаю транзакцию #9999';
const isValidTampered = await verifySignature(publicKey, signature, tampered);
console.log('Изменённые данные верны:', isValidTampered); // false
```

## Практический пример: зашифрованное хранилище

Соберём всё вместе — реализуем простое зашифрованное хранилище в localStorage.

```javascript
const SecureStorage = {
  async setPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = arrayBufferToBase64(salt.buffer);
    localStorage.setItem('_salt', saltBase64);
    this._key = await deriveKeyFromPassword(password, saltBase64);
  },

  async setItem(name, value) {
    if (!this._key) throw new Error('Сначала вызовите setPassword');

    const json = JSON.stringify(value);
    const { ciphertext, iv } = await encrypt(this._key, json);

    const stored = {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv.buffer),
    };
    localStorage.setItem(name, JSON.stringify(stored));
  },

  async getItem(name) {
    if (!this._key) throw new Error('Сначала вызовите setPassword');

    const raw = localStorage.getItem(name);
    if (!raw) return null;

    const { ciphertext, iv } = JSON.parse(raw);
    const decrypted = await decrypt(
      this._key,
      base64ToArrayBuffer(ciphertext),
      new Uint8Array(base64ToArrayBuffer(iv))
    );
    return JSON.parse(decrypted);
  },
};

// Использование
await SecureStorage.setPassword('userPassword');
await SecureStorage.setItem('profile', { name: 'Антон', role: 'admin' });

const profile = await SecureStorage.getItem('profile');
console.log(profile); // { name: 'Антон', role: 'admin' }
```

## Генерация случайных данных

Для криптографически безопасных случайных чисел используйте `crypto.getRandomValues()`, а не `Math.random()`.

```javascript
// Безопасная генерация случайного числа от 0 до max
function secureRandom(max) {
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  return bytes[0] % max;
}

// Генерация случайного токена
function generateToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return arrayBufferToBase64(bytes.buffer);
}

console.log(generateToken()); // случайная Base64-строка длиной ~44 символа

// Генерация UUID v4
function generateUUID() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // версия 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // вариант RFC 4122
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10).join(''),
  ].join('-');
}

console.log(generateUUID()); // '550e8400-e29b-41d4-a716-446655440000'
```

## Типичные ошибки и советы по безопасности

**Не переиспользуйте IV.** Повторное использование одного IV с одним ключом в режиме GCM катастрофично — позволяет восстановить ключ. Генерируйте новый IV для каждой операции шифрования.

```javascript
// НЕПРАВИЛЬНО
const iv = new Uint8Array(12).fill(0); // статичный IV

// ПРАВИЛЬНО
const iv = crypto.getRandomValues(new Uint8Array(12)); // новый каждый раз
```

**Храните IV открыто.** IV не является секретом — его можно передавать и хранить открыто вместе с зашифрованными данными. Секрет — только ключ.

**Не используйте SHA-1 для новых систем.** Алгоритм SHA-1 считается устаревшим и уязвимым. Используйте SHA-256 и выше.

**Обрабатывайте ошибки расшифровки.** Если данные повреждены или ключ неверный, `decrypt()` отклоняет промис. Всегда оборачивайте расшифровку в `try/catch`.

```javascript
try {
  const result = await decrypt(key, ciphertext, iv);
} catch (err) {
  // Неверный ключ, повреждённые данные или изменённый ciphertext
  console.error('Ошибка расшифровки:', err.message);
}
```

**Помните о контексте безопасности.** Web Crypto API доступен только в [Secure Context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) — на `https://` или `localhost`. На обычном `http://` объект `crypto.subtle` будет `undefined`.

## Сравнение с библиотеками

Web Crypto API — нативный инструмент браузера без зависимостей. Популярные библиотеки вроде `crypto-js` или `forge` предоставляют более удобный API и поддержку большего числа алгоритмов, но добавляют вес бандлу. Для большинства задач нативного API достаточно.

Для Node.js эквивалентом является встроенный модуль `node:crypto`, который поддерживает тот же Web Crypto API через `globalThis.crypto.subtle` начиная с версии 19.

```javascript
// Node.js 19+
import { subtle } from 'node:crypto';
// или
const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
```

Глубже изучить асинхронный JavaScript, Promise-цепочки и браузерные API можно на курсе по JavaScript на PurpleSchool.

https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=web-crypto-api