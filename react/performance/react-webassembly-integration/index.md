---
metaTitle: "React и WebAssembly: интеграция Wasm-модулей в приложение"
metaDescription: "Пошаговое руководство по интеграции WebAssembly в React-приложение: загрузка модулей, хуки, Rust и C, практические примеры."
author: "Антон Ларичев"
title: "React с WebAssembly: интеграция Wasm-модулей"
preview: "Как подключить WebAssembly к React, загрузить .wasm-модуль, вызвать функции из Rust или C и ускорить вычисления в браузере."
---

WebAssembly (Wasm) — бинарный формат инструкций, который выполняется в браузере почти с нативной скоростью. Когда JavaScript не справляется с тяжёлыми вычислениями — обработкой изображений, криптографией, физическими симуляциями, разбором форматов — WebAssembly становится естественным дополнением. В этой статье разберём, как интегрировать Wasm-модули в React-приложение: от компиляции до удобных хуков.

## Когда стоит использовать WebAssembly в React

WebAssembly не заменяет JavaScript — он дополняет его там, где скорость критична:

- Математические вычисления (FFT, матричные операции, статистика)
- Обработка медиа в браузере (кодеки, фильтры изображений)
- Криптография и хэширование
- Разбор бинарных форматов (PDF, DICOM, геоданные)
- Портирование нативных библиотек на C/C++/Rust

Для обычной бизнес-логики, работы с DOM и сетевых запросов JavaScript подходит лучше: меньше накладных расходов на маршаллинг данных.

## Компиляция Wasm-модуля

### Вариант 1: Rust через wasm-pack

Rust — наиболее удобный путь к WebAssembly благодаря инструментарию `wasm-pack`.

Установите инструменты:

```bash
curl https://sh.rustup.rs -sSf | sh
cargo install wasm-pack
```

Создайте библиотеку:

```bash
cargo new --lib wasm-math
cd wasm-math
```

Отредактируйте `Cargo.toml`:

```toml
[package]
name = "wasm-math"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

Напишите функции в `src/lib.rs`:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u64 {
    if n <= 1 {
        return n as u64;
    }
    let mut a: u64 = 0;
    let mut b: u64 = 1;
    for _ in 2..=n {
        let tmp = a + b;
        a = b;
        b = tmp;
    }
    b
}

#[wasm_bindgen]
pub fn sum_array(data: &[f64]) -> f64 {
    data.iter().sum()
}
```

Скомпилируйте:

```bash
wasm-pack build --target web --out-dir pkg
```

В директории `pkg` появятся `.wasm`-файл и JS-обёртка с TypeScript-типами.

### Вариант 2: C/C++ через Emscripten

Для существующих C-библиотек используется Emscripten.

```c
// math_lib.c
#include <emscripten/emscripten.h>

EMSCRIPTEN_KEEPALIVE
int fast_multiply(int a, int b) {
    return a * b;
}
```

```bash
emcc math_lib.c -o math_lib.js \
  -s EXPORTED_FUNCTIONS='["_fast_multiply"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -s MODULARIZE=1 \
  -s EXPORT_NAME=MathLib
```

## Структура React-проекта с Wasm

Поместите скомпилированные файлы в проект:

```
src/
  wasm/
    wasm_math.wasm
    wasm_math.js       # JS-обёртка от wasm-pack
    wasm_math.d.ts     # TypeScript-типы
  hooks/
    useWasm.ts
    useMath.ts
  components/
    FibCalculator.tsx
public/
  wasm/
    wasm_math_bg.wasm  # бинарный файл должен быть доступен по HTTP
```

При работе с Create React App или Vite скопируйте `.wasm`-файл в `public/`, чтобы браузер мог загрузить его напрямую.

## Загрузка Wasm-модуля: базовый подход

Brower API для работы с Wasm — `WebAssembly.instantiateStreaming`. Он загружает и компилирует модуль за один шаг.

```typescript
// src/wasm/loader.ts
export async function loadWasmModule(url: string) {
  const response = await fetch(url);
  const { instance } = await WebAssembly.instantiateStreaming(response);
  return instance.exports;
}
```

Для модулей, собранных через `wasm-pack`, используйте сгенерированную JS-обёртку:

```typescript
import init, { fibonacci, sum_array } from './wasm/wasm_math';

async function bootstrap() {
  // init загружает .wasm и инициализирует память
  await init('/wasm/wasm_math_bg.wasm');
  
  const result = fibonacci(40);
  console.log(result); // 102334155
}
```

## Универсальный хук useWasm

Создадим хук, который инкапсулирует жизненный цикл загрузки модуля:

```typescript
// src/hooks/useWasm.ts
import { useState, useEffect, useRef } from 'react';

type WasmStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseWasmResult<T> {
  module: T | null;
  status: WasmStatus;
  error: Error | null;
}

export function useWasm<T>(
  initializer: () => Promise<T>
): UseWasmResult<T> {
  const [module, setModule] = useState<T | null>(null);
  const [status, setStatus] = useState<WasmStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setStatus('loading');
    initializer()
      .then((mod) => {
        setModule(mod);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      });
  }, []);

  return { module, status, error };
}
```

Специализированный хук для конкретного модуля:

```typescript
// src/hooks/useMath.ts
import { useWasm } from './useWasm';
import init, { fibonacci, sum_array } from '../wasm/wasm_math';

interface MathModule {
  fibonacci: (n: number) => bigint;
  sumArray: (data: Float64Array) => number;
}

export function useMathWasm() {
  return useWasm<MathModule>(async () => {
    await init('/wasm/wasm_math_bg.wasm');
    return {
      fibonacci,
      sumArray: (data: Float64Array) => sum_array(data),
    };
  });
}
```

## Компоненты, использующие Wasm

### Простой калькулятор Фибоначчи

```tsx
// src/components/FibCalculator.tsx
import { useState } from 'react';
import { useMathWasm } from '../hooks/useMathWasm';

export function FibCalculator() {
  const { module, status } = useMathWasm();
  const [input, setInput] = useState(10);
  const [result, setResult] = useState<bigint | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const calculate = () => {
    if (!module) return;
    const start = performance.now();
    const fib = module.fibonacci(input);
    const end = performance.now();
    setResult(fib);
    setElapsed(end - start);
  };

  if (status === 'loading') return <p>Загрузка WebAssembly...</p>;
  if (status === 'error') return <p>Ошибка загрузки модуля</p>;

  return (
    <div>
      <h2>Вычисление числа Фибоначчи</h2>
      <input
        type="number"
        value={input}
        min={0}
        max={80}
        onChange={(e) => setInput(Number(e.target.value))}
      />
      <button onClick={calculate} disabled={status !== 'ready'}>
        Вычислить
      </button>
      {result !== null && (
        <p>
          F({input}) = {result.toString()}
          {elapsed !== null && ` (${elapsed.toFixed(3)} мс)`}
        </p>
      )}
    </div>
  );
}
```

### Обработка больших массивов

Передача массивов в Wasm требует использования типизированных массивов. wasm-bindgen автоматически создаёт нужные обёртки:

```tsx
// src/components/ArrayProcessor.tsx
import { useState, useCallback } from 'react';
import { useMathWasm } from '../hooks/useMathWasm';

export function ArrayProcessor() {
  const { module, status } = useMathWasm();
  const [result, setResult] = useState<number | null>(null);

  const processLargeArray = useCallback(() => {
    if (!module) return;

    // Создаём типизированный массив — Wasm работает только с ними
    const data = new Float64Array(1_000_000);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random();
    }

    const sum = module.sumArray(data);
    setResult(sum);
  }, [module]);

  return (
    <div>
      <h2>Суммирование 1 млн элементов</h2>
      <button onClick={processLargeArray} disabled={status !== 'ready'}>
        Обработать
      </button>
      {result !== null && <p>Сумма: {result.toFixed(4)}</p>}
    </div>
  );
}
```

## Паттерн: Wasm в Web Worker

Для очень тяжёлых вычислений имеет смысл вынести Wasm в Web Worker, чтобы не блокировать главный поток:

```typescript
// src/workers/math.worker.ts
import init, { fibonacci } from '../wasm/wasm_math';

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await init('/wasm/wasm_math_bg.wasm');
    initialized = true;
  }
}

self.onmessage = async (event: MessageEvent) => {
  const { type, payload, id } = event.data;

  await ensureInit();

  if (type === 'fibonacci') {
    const result = fibonacci(payload.n);
    self.postMessage({ id, result: result.toString() });
  }
};
```

```typescript
// src/hooks/useWasmWorker.ts
import { useRef, useCallback, useEffect } from 'react';

export function useWasmWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, (result: unknown) => void>>(new Map());

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/math.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event) => {
      const { id, result } = event.data;
      const resolve = pendingRef.current.get(id);
      if (resolve) {
        resolve(result);
        pendingRef.current.delete(id);
      }
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const calculate = useCallback(
    (type: string, payload: unknown): Promise<unknown> => {
      return new Promise((resolve) => {
        const id = crypto.randomUUID();
        pendingRef.current.set(id, resolve);
        workerRef.current?.postMessage({ type, payload, id });
      });
    },
    []
  );

  return { calculate };
}
```

## Настройка Vite для работы с Wasm

Vite требует отдельного плагина для корректной работы с `.wasm`-файлами:

```bash
npm install -D vite-plugin-wasm vite-plugin-top-level-await
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
  ],
  optimizeDeps: {
    exclude: ['wasm-math'],
  },
});
```

Плагин `wasm` позволяет импортировать `.wasm`-файлы напрямую через `import`, а `topLevelAwait` — использовать `await` на верхнем уровне модуля.

## Типичные ошибки и их решение

### MIME-тип для .wasm

Сервер должен отдавать `.wasm`-файлы с типом `application/wasm`. В dev-режиме Vite делает это автоматически, но на продакшн-сервере (nginx, Apache) может потребоваться явная настройка:

```nginx
types {
  application/wasm wasm;
}
```

### Маршаллинг данных

Wasm работает только с числовыми типами и памятью. Передача строк и объектов требует сериализации. wasm-bindgen скрывает это за обёртками, но при прямой работе с инстансом нужно вручную записывать данные в линейную память:

```typescript
// Запись строки в память Wasm-инстанса вручную
function writeString(instance: WebAssembly.Instance, str: string): number {
  const memory = instance.exports.memory as WebAssembly.Memory;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const ptr = (instance.exports.alloc as Function)(bytes.length);
  const view = new Uint8Array(memory.buffer, ptr, bytes.length);
  view.set(bytes);
  return ptr;
}
```

### Повторная инициализация

Wasm-модуль должен инициализироваться один раз. Защита через `useRef` в хуке выше (`initialized.current`) предотвращает двойной вызов в StrictMode React.

## Производительность: замеры

Перед оптимизацией стоит убедиться, что выгода реальна. Сравните реализации через `performance.now()`:

```typescript
function benchmarkFibonacci(n: number, iterations = 100) {
  // JavaScript
  const jsStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    fibJS(n);
  }
  const jsTime = performance.now() - jsStart;

  // WebAssembly
  const wasmStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    fibonacci(n);
  }
  const wasmTime = performance.now() - wasmStart;

  return { jsTime, wasmTime, speedup: jsTime / wasmTime };
}
```

Для простых функций Wasm может не давать выигрыша из-за накладных расходов на вызов. Реальная разница заметна на задачах от нескольких миллисекунд.

## Загрузка только при необходимости

Если Wasm нужен не при старте приложения, используйте динамический импорт:

```tsx
import { lazy, Suspense } from 'react';

const HeavyProcessor = lazy(() => import('./components/HeavyProcessor'));

export function App() {
  const [showProcessor, setShowProcessor] = useState(false);

  return (
    <div>
      <button onClick={() => setShowProcessor(true)}>
        Открыть процессор
      </button>
      {showProcessor && (
        <Suspense fallback={<p>Загрузка...</p>}>
          <HeavyProcessor />
        </Suspense>
      )}
    </div>
  );
}
```

Внутри `HeavyProcessor` инициализация Wasm произойдёт только когда компонент реально понадобится.

## Итог

Интеграция WebAssembly в React-приложение сводится к нескольким шагам: скомпилировать модуль (через wasm-pack для Rust или Emscripten для C/C++), корректно настроить сборщик, написать хук для управления жизненным циклом загрузки и использовать типизированные массивы при передаче данных. Для задач, которые действительно требуют скорости нативного кода, этот путь оправдан и даёт измеримый результат.

Для более глубокого погружения в React и современные паттерны разработки смотрите курс на [PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-webassembly-integration).