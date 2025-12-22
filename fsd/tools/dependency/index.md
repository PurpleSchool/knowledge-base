---
metaTitle: Визуализатор зависимостей в JavaScript проектах dependency-graph
metaDescription: Разбор того как использовать dependency-graph для построения графа зависимостей - визуализации модулей и поиска проблем в структуре кода
author: Олег Марков
title: Визуализатор зависимостей dependency-graph для JavaScript и TypeScript проектов
preview: Узнайте как анализировать и визуализировать зависимости в проекте с помощью dependency-graph - строить графы модулей находить циклические связи и оптимизировать архитектуру
---

## Введение

Визуализатор зависимостей dependency-graph помогает увидеть структуру проекта как граф: модули становятся вершинами, а зависимости между ними — ребрами. Когда вы начинаете работать с большим кодом, быстро становится сложно держать в голове, что от чего зависит, где есть циклы и какие модули тянут за собой слишком много кода.

Смотрите, я покажу вам, как подойти к этой задаче системно. Мы разберем, как:

- представить зависимости в виде графа;
- построить этот граф в коде;
- экспортировать его во внешний формат для визуализации;
- искать циклические зависимости;
- находить критичные модули, которые «держат» на себе половину проекта;
- встроить анализ в ваш сборочный процесс.

Будем опираться на типичный инструментальный стек JavaScript и TypeScript, но сами идеи применимы и в других языках.

## Что такое граф зависимостей

### Базовые понятия

Граф зависимостей в контексте кода — это ориентированный граф, в котором:

- вершины — модули, файлы, пакеты, функции или компоненты;
- ребра — направленные связи вида «модуль A импортирует модуль B».

Если говорить проще: если файл `A.js` импортирует `B.js`, то в графе есть ребро от A к B.

Зачем это нужно:

- понять архитектуру проекта без чтения всех файлов;
- увидеть «узкие места» — модули, от которых зависит слишком много других;
- отловить циклические зависимости;
- оценить влияние изменения в конкретном модуле;
- планировать рефакторинг.

### Где применяется dependency-graph

Dependency-graph (или любые подобные инструменты) вы можете использовать:

- в Node.js приложениях для анализа связей между модулями;
- во фронтенд-проектах (React, Vue, Angular) для карт компонентов и их импортов;
- в монорепозиториях для анализа взаимосвязей пакетов;
- в микросервисной архитектуре — для визуализации зависимостей сервисов, если есть соответствующие метаданные.

Дальше мы будем рассматривать примерный API модуля dependency-graph, который часто используется в node-проектах для построения и анализа графа.

## Установка и базовая настройка

### Установка библиотеки

Чаще всего dependency-graph используют как npm-пакет. Обычно он называется `dependency-graph` и устанавливается так:

```bash
npm install dependency-graph --save-dev
# или
yarn add dependency-graph --dev
```

`--save-dev` логичен, если вы используете граф зависимостей только для анализа, а не в runtime коде.

### Простейшее создание графа

Давайте разберемся на минимальном примере. Создадим файл `graph-demo.js` и опишем зависимости вручную.

```js
// Подключаем библиотеку dependency-graph
const { DepGraph } = require('dependency-graph');

// Создаем новый граф зависимостей
const graph = new DepGraph();

// Добавляем вершины - наши модули
graph.addNode('app');         // Главный модуль приложения
graph.addNode('router');      // Маршрутизатор
graph.addNode('userService'); // Сервис пользователей
graph.addNode('db');          // Модуль работы с базой данных

// Описываем зависимости
// app -> router и app -> userService
graph.addDependency('app', 'router');      
graph.addDependency('app', 'userService'); 

// router -> userService
graph.addDependency('router', 'userService');

// userService -> db
graph.addDependency('userService', 'db');

// Теперь можно получить упорядоченный список модулей
const order = graph.overallOrder(); 
// order будет чем-то вроде ['db', 'userService', 'router', 'app']

console.log(order);
```

Комментарии в коде помогают зафиксировать главное: мы явно добавляем узлы, а затем описываем направления зависимостей.

Обратите внимание, как библиотека автоматически выдает порядок, в котором можно безопасно инициализировать модули без нарушения зависимостей.

## Структура графа и ключевые методы

### Создание и настройка DepGraph

Основной класс в библиотеке — `DepGraph`. В конструктор обычно можно передать настройки, например:

```js
const { DepGraph } = require('dependency-graph');

// Включаем возможность циклических зависимостей, если это нужно
const graph = new DepGraph({ circular: true });
```

Параметр:

- `circular: boolean` — если `false`, то граф будет «строгим»: при попытке создать цикл будет выброшено исключение. Если `true`, циклы допустимы, но вам придется обрабатывать их вручную.

В большинстве случаев для анализа удобно начинать с `circular: false`, чтобы библиотека сразу подсветила возможные проблемы.

### Добавление и удаление узлов

Сначала вы объявляете узлы графа:

```js
graph.addNode('auth');                // Узел без данных
graph.addNode('config', { env: 'dev' }); // Узел с произвольными данными
```

Каждому узлу можно добавить payload:

```js
// Получаем данные узла
const configData = graph.getNodeData('config'); // { env: 'dev' }

// Изменяем данные
graph.setNodeData('config', { env: 'prod' });
```

Такая возможность удобна, если вы строите граф не только для структуры, но и хотите хранить рядом метаданные: путь к файлу, размер бандла, тип модуля и так далее.

Удаление узла:

```js
// Удаляем узел auth и все входящие и исходящие ребра
graph.removeNode('auth');
```

### Добавление зависимостей

Теперь вы связываете узлы:

```js
// auth зависит от config
graph.addDependency('auth', 'config');

// auth зависит от db
graph.addDependency('auth', 'db');
```

Формат:

- первый аргумент — узел, который зависит;
- второй аргумент — узел, от которого зависит.

Говоря проще: `from` -> `to`.

Можно добавлять несколько зависимостей сразу, если реализовать обертку:

```js
function addDependencies(graph, from, deps) {
  deps.forEach(dep => graph.addDependency(from, dep));
}

// Здесь я размещаю пример, чтобы вам было проще понять:
addDependencies(graph, 'auth', ['config', 'db', 'logger']);
```

Удаление связи:

```js
graph.removeDependency('auth', 'db');
```

### Получение зависимостей и зависимых узлов

У библиотеки обычно есть методы:

```js
// Получить список модулей, от которых зависит auth
const deps = graph.dependenciesOf('auth');
// Например ['config', 'db', 'logger']

// Получить список модулей, которые зависят от auth
const dependants = graph.dependantsOf('auth');
// Например ['router', 'app']
```

Часто есть еще методы `directDependenciesOf` и `directDependantsOf`, которые возвращают только прямые связи без рекурсивного обхода.

```js
const directDeps = graph.directDependenciesOf('auth');
```

Теперь давайте посмотрим, как это применяется к реальному проекту.

## Построение графа зависимостей по файловой системе

### Общая идея

Вместо того чтобы вручную создавать узлы, вы обычно:

1. обходите все файлы проекта;
2. для каждого файла парсите импорты и require;
3. добавляете каждый файл как узел;
4. добавляете зависимости на основании найденных импортов.

Смотрите, я покажу вам пример простого скрипта для Node.js, который анализирует JavaScript файлы.

### Пример: простой анализатор для JS модулей

Установим дополнительные пакеты:

```bash
npm install glob acorn acorn-walk dependency-graph --save-dev
```

- `glob` — для поиска файлов;
- `acorn` — парсер JavaScript;
- `acorn-walk` — обход AST.

Создадим файл `build-graph.js`.

```js
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const acorn = require('acorn');
const walk = require('acorn-walk');
const { DepGraph } = require('dependency-graph');

// Базовая папка проекта
const SRC_DIR = path.resolve(__dirname, 'src');

// Создаем граф
const graph = new DepGraph();

// Функция для чтения всех JS-файлов
function getAllFiles() {
  // Ищем все файлы с расширением .js в папке src
  return glob.sync('**/*.js', { cwd: SRC_DIR, absolute: true });
}

// Нормализуем путь чтобы использовать его как ID узла
function normalizeId(filePath) {
  // Превращаем абсолютный путь в путь относительно src
  return path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
}

// Парсим один файл и добавляем узел с зависимостями
function processFile(filePath) {
  const id = normalizeId(filePath);

  // Добавляем узел если его еще нет
  if (!graph.hasNode(id)) {
    graph.addNode(id, { filePath }); 
  }

  const code = fs.readFileSync(filePath, 'utf8');

  // Строим AST
  const ast = acorn.parse(code, {
    sourceType: 'module', // Поддерживаем import/export
    ecmaVersion: 'latest'
  });

  const imports = [];

  // Обходим AST и собираем строки import
  walk.simple(ast, {
    ImportDeclaration(node) {
      // node.source.value - это строка из import '...'
      imports.push(node.source.value);
    },
    CallExpression(node) {
      // Ищем require('...')
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments.length === 1 &&
        node.arguments[0].type === 'Literal'
      ) {
        imports.push(node.arguments[0].value);
      }
    }
  });

  // Преобразуем импорты в реальные пути
  imports.forEach(specifier => {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      // Локальный модуль
      const resolved = resolveLocalModule(filePath, specifier);
      if (!resolved) return;

      const depId = normalizeId(resolved);
      if (!graph.hasNode(depId)) {
        graph.addNode(depId, { filePath: resolved });
      }

      // Добавляем зависимость: текущий файл зависит от депендента
      graph.addDependency(id, depId);
    } else {
      // Внешний пакет из node_modules - можно сохранять отдельным узлом
      const pkgId = `npm:${specifier}`;
      if (!graph.hasNode(pkgId)) {
        graph.addNode(pkgId, { package: specifier });
      }
      graph.addDependency(id, pkgId);
    }
  });
}

// Разрешаем относительный импорт до реального файла
function resolveLocalModule(fromFile, specifier) {
  // Путь относительно файла
  const basePath = path.resolve(path.dirname(fromFile), specifier);

  // Пробуем несколько вариантов расширений
  const candidates = [
    basePath,
    `${basePath}.js`,
    path.join(basePath, 'index.js')
  ];

  // Возвращаем первый существующий файл
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  // Если ничего не нашли - пропускаем
  return null;
}

// Основная функция
function buildGraph() {
  const files = getAllFiles();

  // Обрабатываем каждый файл
  files.forEach(processFile);

  return graph;
}

// Запускаем и выводим статистику
const g = buildGraph();

console.log('Всего узлов:', g.size());
console.log('Порядок загрузки:', g.overallOrder());
```

Комментарии показывают, что здесь происходит:

- мы проходим по всем файлам;
- строим AST и вытаскиваем импорты и require;
- разрешаем их в реальные пути;
- добавляем как зависимости в графе.

Как видите, этот код выполняет базовую задачу построения графа по файловой системе.

## Поиск циклических зависимостей

### Почему циклы — это проблема

Циклические зависимости — это когда модуль A зависит от B, а B зависит от A (напрямую или через цепочку). В JavaScript это часто приводит к:

- частично инициализированным модулям;
- неожиданным значениям и `undefined`;
- сложностям с тестированием и переиспользованием кода.

Поэтому удобно использовать dependency-graph для их поиска.

### Использование строгого режима (circular false)

Если вы создали граф с `circular: false`, любое добавление зависимости, создающее цикл, вызовет ошибку.

```js
const graph = new DepGraph({ circular: false });

graph.addNode('a');
graph.addNode('b');

graph.addDependency('a', 'b');

// Попытка добавить b -> a приведет к ошибке
try {
  graph.addDependency('b', 'a');
} catch (e) {
  console.error('Обнаружен цикл:', e.message);
}
```

Здесь я размещаю пример, чтобы вам было проще понять, как библиотека сама не дает создать цикл.

### Поиск циклов в уже существующем графе

Если вы разрешаете циклы (`circular: true`), вам нужно самим проверять граф.

Один из подходов — реализовать обход в глубину и искать путь от узла к самому себе. Общий алгоритм:

```js
// Пример простой проверки циклов
function detectCycles(graph) {
  const nodes = graph.overallOrder(); 
  // overallOrder в режиме с циклами может выбрасывать ошибку
  // поэтому иногда используют свой обход

  const visited = new Set();
  const stack = new Set();
  const cycles = [];

  // Рекурсивный поиск циклов
  function visit(node) {
    if (stack.has(node)) {
      // Нашли цикл - запоминаем
      cycles.push(node);
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);

    const deps = graph.directDependenciesOf(node);
    deps.forEach(visit);

    stack.delete(node);
  }

  nodes.forEach(visit);

  return cycles;
}
```

Покажу вам, как это реализовано на практике в связке с нашим скриптом:

```js
const cycles = detectCycles(g);
if (cycles.length) {
  console.log('Найдены потенциальные циклы для узлов:', cycles);
}
```

В реальном проекте вы можете доработать функцию так, чтобы выводить не просто узлы, а целые цепочки, образующие цикл.

## Визуализация графа зависимостей

### Экспорт в формат DOT для Graphviz

Один из самых удобных способов визуализации — экспорт графа в формат DOT (Graphviz). Затем вы можете сгенерировать PDF, SVG или PNG.

Давайте разберемся на примере. Добавим функцию экспорта:

```js
function exportToDot(graph) {
  let result = 'digraph G {\n';

  // Перебираем все узлы
  graph.overallOrder().forEach(node => {
    // Добавляем вершину
    result += `  "${node}";\n`;

    // Для каждой зависимости добавляем ребро
    graph.directDependenciesOf(node).forEach(dep => {
      result += `  "${node}" -> "${dep}";\n`;
    });
  });

  result += '}\n';
  return result;
}
```

Обратите внимание, как этот фрагмент кода решает задачу: он описывает все вершины и связи в формате, который понимает Graphviz.

Теперь вы увидите, как это выглядит в коде полного сценария:

```js
// После построения графа
const dot = exportToDot(g);

// Сохраняем файл
fs.writeFileSync(path.resolve(__dirname, 'deps.dot'), dot, 'utf8');
```

Дальше вы можете выполнить:

```bash
dot -Tpng deps.dot -o deps.png
```

И получить картинку с графом.

### Упрощение графа для фронтенда

Иногда вы хотите отобразить граф в браузере (например, с помощью D3.js, Cytoscape.js, Vis.js или других библиотек). Для этого удобен формат JSON.

Вот пример экспорта:

```js
function exportToJson(graph) {
  const nodes = [];
  const edges = [];

  graph.overallOrder().forEach(nodeId => {
    // Узел с данными
    const data = graph.getNodeData(nodeId);
    nodes.push({
      id: nodeId,
      label: nodeId,
      ...data // Добавляем любые дополнительные поля
    });

    // Ребра
    graph.directDependenciesOf(nodeId).forEach(depId => {
      edges.push({
        from: nodeId,
        to: depId
      });
    });
  });

  return { nodes, edges };
}

const json = exportToJson(g);
fs.writeFileSync('deps.json', JSON.stringify(json, null, 2), 'utf8');
```

Теперь вы можете передать `deps.json` в любую клиентскую библиотеку для рисования графов.

### Пример: простая визуализация в браузере

Предположим, у вас есть `deps.json`. Далее вы можете использовать, например, vis-network.

Короткий пример HTML (без лишних деталей):

```html
<!-- Подключаем vis-network -->
<script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>

<div id="network" style="width: 100%; height: 600px;"></div>

<script>
// Загружаем JSON с графом
fetch('deps.json')
  .then(res => res.json())
  .then(data => {
    // Данные узлов и ребер
    const nodes = new vis.DataSet(data.nodes);
    const edges = new vis.DataSet(data.edges);

    const container = document.getElementById('network');
    const options = {
      layout: {
        hierarchical: {
          enabled: true
        }
      },
      physics: false
    };

    // Создаем визуализацию
    new vis.Network(container, { nodes, edges }, options);
  });
</script>
```

Здесь я размещаю пример, чтобы вам было проще представить, как ваш граф переезжает в браузер и превращается в интерактивную схему.

## Анализ графа для архитектурных решений

### Поиск «тяжелых» модулей

Частая задача — найти модули, от которых зависит особенно много других. Это потенциальные:

- точки отказа;
- «божественные» модули (God Objects);
- места, где любое изменение может сломать полпроекта.

Давайте посмотрим, что происходит в следующем примере анализа:

```js
function findHotspots(graph, threshold = 10) {
  const result = [];

  graph.overallOrder().forEach(node => {
    const dependants = graph.dependantsOf(node);
    if (dependants.length >= threshold) {
      result.push({
        node,
        dependantsCount: dependants.length
      });
    }
  });

  return result;
}

// Используем
const hotspots = findHotspots(g, 5);
console.log('Критичные модули:', hotspots);
```

Вы можете использовать этот отчет, чтобы спланировать разбивку модулей, разделение ответственности или вынос общих частей.

### Оценка влияния изменений

Иногда вы хотите ответить на вопрос: «Если я изменю модуль X, какие части приложения могут быть затронуты?».

Покажу вам, как это реализовано на практике:

```js
function impactOf(graph, nodeId) {
  if (!graph.hasNode(nodeId)) {
    throw new Error(`Узел ${nodeId} не найден`);
  }

  const affected = graph.dependantsOf(nodeId);

  return {
    node: nodeId,
    affectedCount: affected.length,
    affected
  };
}

// Пример
const impact = impactOf(g, 'services/userService.js');
console.log(`Изменение userService.js затронет ${impact.affectedCount} модулей`);
```

Такая функция полезна как для код-ревью, так и для анализа рисков перед крупными изменениями.

### Выделение слоев приложения

Граф помогает увидеть реальную (а не документированную) слоистую архитектуру. Например, вы можете условно разделить узлы на слои:

- `ui/*`
- `services/*`
- `data/*`

А затем проверить, что:

- `ui` может зависеть от `services`, но не от `data`;
- `services` может зависеть от `data`, но не от `ui`.

Реализуем простую проверку:

```js
function layerOf(nodeId) {
  if (nodeId.startsWith('ui/')) return 'ui';
  if (nodeId.startsWith('services/')) return 'services';
  if (nodeId.startsWith('data/')) return 'data';
  return 'other';
}

function validateLayers(graph) {
  const errors = [];

  graph.overallOrder().forEach(node => {
    const fromLayer = layerOf(node);

    graph.directDependenciesOf(node).forEach(dep => {
      const toLayer = layerOf(dep);

      // Правило: ui не может зависеть от data
      if (fromLayer === 'ui' && toLayer === 'data') {
        errors.push(`ui слой не должен зависеть от data - найдено ${node} -> ${dep}`);
      }

      // Правило: data не может зависеть от ui
      if (fromLayer === 'data' && toLayer === 'ui') {
        errors.push(`data слой не должен зависеть от ui - найдено ${node} -> ${dep}`);
      }
    });
  });

  return errors;
}

const layerErrors = validateLayers(g);
if (layerErrors.length) {
  console.log('Нарушения слоистой архитектуры:');
  layerErrors.forEach(e => console.log(' -', e));
}
```

Теперь вы можете включить этот скрипт в CI и автоматически проверять архитектурные инварианты.

## Интеграция с процессом разработки

### Встраивание в npm-скрипты

Чтобы регулярно запускать анализ, добавьте его в `package.json`.

```json
{
  "scripts": {
    "deps:build": "node build-graph.js",
    "deps:check": "node check-graph.js"
  }
}
```

Где `build-graph.js` строит граф и, например, экспортирует `deps.json`, а `check-graph.js` проверяет:

- циклы;
- критичные модули;
- нарушения слоев.

Такой подход позволяет запускать:

```bash
npm run deps:check
```

на локальной машине или в CI.

### Автоматический запуск в CI

В CI-конфигурации (например, GitHub Actions, GitLab CI, Jenkins) вы можете:

- установить зависимости;
- запустить скрипт анализа;
- провалить сборку, если найдены критичные проблемы.

Условная проверка в `check-graph.js` может выглядеть так:

```js
const errors = [];

const cycles = detectCycles(g);
if (cycles.length) {
  errors.push(`Найдены циклические зависимости в узлах: ${cycles.join(', ')}`);
}

const hotspots = findHotspots(g, 20);
if (hotspots.length) {
  errors.push('Найдены модули с чрезмерным количеством зависимых модулей');
}

const layerErrors = validateLayers(g);
errors.push(...layerErrors);

if (errors.length) {
  console.error('Проблемы в графе зависимостей:');
  errors.forEach(e => console.error(' -', e));
  process.exit(1); // Завершаем процесс с ошибкой
} else {
  console.log('Граф зависимостей в норме');
}
```

Теперь любой merge request с нарушением архитектуры не пройдет проверки.

### Использование в рефакторинге

Визуализатор зависимостей очень полезен во время большого рефакторинга:

- до начала работ — фиксируете текущий граф;
- после серии изменений — сравниваете новый граф с исходным;
- анализируете, уменьшилось ли количество критичных модулей и циклов.

Можно даже сохранять несколько версий `deps.json` и сравнивать их автоматически, но это уже отдельная задача.

## Заключение

Визуализатор зависимостей dependency-graph — это инструмент, который помогает увидеть архитектуру проекта не по документации, а по реальному коду. Вы строите ориентированный граф, где модули — вершины, а импорты — ребра, и дальше можете:

- находить циклические зависимости и устранять их;
- выявлять перегруженные модули и планировать их разбиение;
- формализовать слоистую архитектуру и проверять ее автоматически;
- оценивать влияние изменений в конкретном модуле;
- визуализировать структуру проекта в виде схемы.

Когда вы однажды посмотрите на большой проект через граф зависимостей, вам станет проще принимать архитектурные решения, объяснять их команде и контролировать, чтобы код не превращался в «комок спагетти».

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как объединить несколько графов зависимостей из разных частей монорепозитория

Если у вас несколько графов, вы можете создать один общий и скопировать в него узлы и связи:

```js
function mergeGraphs(target, source) {
  // Копируем узлы
  source.overallOrder().forEach(node => {
    if (!target.hasNode(node)) {
      target.addNode(node, source.getNodeData(node));
    }
  });

  // Копируем зависимости
  source.overallOrder().forEach(node => {
    source.directDependenciesOf(node).forEach(dep => {
      if (!target.hasDependency(node, dep)) {
        target.addDependency(node, dep);
      }
    });
  });
}
```

Так вы можете собрать глобальный граф для всей монорепы.

### Как игнорировать определенные файлы или папки при построении графа

На этапе обхода файлов просто добавьте фильтр. Например, пропускайте тесты и файлы в `node_modules`:

```js
function shouldIgnore(filePath) {
  return filePath.includes('/__tests__/') || filePath.includes('/node_modules/');
}

files
  .filter(file => !shouldIgnore(file))
  .forEach(processFile);
```

Так граф не будет засорен вспомогательными файлами.

### Как добавить веса ребер чтобы учитывать «силу» зависимости

Вместо того чтобы хранить только связь, вы можете добавить веса в данные узла или в отдельную структуру:

```js
// Храним веса в отдельной Map
const edgeWeights = new Map(); // ключ 'from->to', значение число

function addWeightedDep(graph, from, to, weight = 1) {
  graph.addDependency(from, to);
  edgeWeights.set(`${from}->${to}`, weight);
}
```

Дальше вы можете использовать веса при визуализации (толщина линии, цвет) или анализе (поиск «самых сильных» связей).

### Как отслеживать изменения графа между коммитами

Сохраните граф в JSON для каждого интересующего коммита, а затем сравните:

```js
const before = JSON.parse(fs.readFileSync('deps-before.json'));
const after = JSON.parse(fs.readFileSync('deps-after.json'));

// Сравнение узлов
const beforeNodes = new Set(before.nodes.map(n => n.id));
const afterNodes = new Set(after.nodes.map(n => n.id));

const addedNodes = [...afterNodes].filter(n => !beforeNodes.has(n));
const removedNodes = [...beforeNodes].filter(n => !afterNodes.has(n));
```

Аналогично можно сравнить ребра и увидеть, какие зависимости появились или исчезли.

### Как масштабировать визуализацию для очень большого графа

Для больших проектов визуализация всех узлов сразу превращается в «шум». Используйте фильтрацию:

1. Ограничивайте глубину от выбранного узла.
2. Скрывайте внешние зависимости (`npm:*`).
3. Группируйте узлы по директориям и отображайте только верхний уровень.

На практике это делается на уровне экспорта в JSON: перед формированием списка узлов и ребер применяете фильтры и показываете только нужную часть графа.