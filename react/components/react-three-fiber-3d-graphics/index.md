---
metaTitle: "React Three Fiber: 3D-графика в React-приложениях"
metaDescription: "Как использовать React Three Fiber для создания 3D-сцен в React. Установка, Canvas, меши, анимации, освещение и взаимодействие с объектами."
author: "Антон Ларичев"
title: "React Three Fiber — 3D-графика в React"
preview: "Разбираем React Three Fiber — рендерер Three.js для React. Настройка сцены, меши, анимации через useFrame и взаимодействие с 3D-объектами."
---

React Three Fiber (R3F) — это React-рендерер для Three.js. Вместо императивного создания объектов через `new THREE.Mesh()` вы описываете 3D-сцену декларативно: каждый объект Three.js становится JSX-компонентом. Состояние сцены управляется через хуки, анимации — через специальный хук `useFrame`, а взаимодействие с объектами — через стандартные React-события.

Главное преимущество — вы остаётесь в привычной экосистеме React: переиспользуемые компоненты, Context, Suspense для загрузки ресурсов, и всё это без необходимости вручную синхронизировать состояние с Three.js.

## Установка

Для работы нужны три пакета: сам Three.js, рендерер и вспомогательная библиотека `@react-three/drei` с готовыми примитивами.

```bash
npm install three @react-three/fiber @react-three/drei
npm install --save-dev @types/three
```

Если используете React 18 и выше — дополнительной настройки не нужно, R3F поддерживает concurrent-режим из коробки.

## Основы: Canvas и первая сцена

`Canvas` — точка входа. Он создаёт WebGL-контекст, рендерер и цикл анимации. Все 3D-компоненты должны находиться внутри `Canvas`.

```tsx
import { Canvas } from '@react-three/fiber'

export function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />
      </Canvas>
    </div>
  )
}
```

Ключевой момент: `Canvas` по умолчанию занимает 100% родительского контейнера. Контейнеру нужно явно задать размеры — иначе высота будет 0 и сцена не отобразится.

### Как R3F преобразует JSX в Three.js

R3F не создаёт собственные компоненты — он проксирует конструкторы Three.js. Любой класс из `THREE.*` становится доступен как тег в нижнем camelCase:

```tsx
// Three.js (императивно)
const geometry = new THREE.SphereGeometry(1, 32, 32)
const material = new THREE.MeshStandardMaterial({ color: 'blue' })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// React Three Fiber (декларативно)
<mesh>
  <sphereGeometry args={[1, 32, 32]} />
  <meshStandardMaterial color="blue" />
</mesh>
```

Проп `args` передаётся в конструктор как массив аргументов. Все остальные пропы устанавливаются как свойства объекта:

```tsx
<mesh position={[0, 1, 0]} rotation={[0, Math.PI / 4, 0]} scale={1.5}>
  <boxGeometry args={[1, 2, 1]} />
  <meshStandardMaterial color="#2196f3" wireframe={false} />
</mesh>
```

## Освещение

Без освещения `meshStandardMaterial` и `meshPhongMaterial` будут полностью чёрными — эти материалы рассчитывают освещение физически. Для отладки можно использовать `meshBasicMaterial`, который не зависит от света.

```tsx
<Canvas>
  {/* Фоновый свет — равномерно освещает все поверхности */}
  <ambientLight intensity={0.4} />

  {/* Направленный свет — имитирует солнце, отбрасывает тени */}
  <directionalLight
    position={[10, 10, 5]}
    intensity={1}
    castShadow
    shadow-mapSize={[2048, 2048]}
  />

  {/* Точечный свет — излучает во все стороны из точки */}
  <pointLight position={[-5, 3, 0]} intensity={0.8} color="#ff6b6b" />

  <mesh receiveShadow castShadow>
    <boxGeometry />
    <meshStandardMaterial color="white" />
  </mesh>
</Canvas>
```

Чтобы включить тени, на `Canvas` нужно передать `shadows`, а на объектах — `castShadow` и `receiveShadow`:

```tsx
<Canvas shadows>
  {/* ... */}
</Canvas>
```

## Анимации: хук useFrame

`useFrame` — главный инструмент для анимаций. Колбэк вызывается каждый кадр синхронно с рендер-циклом Three.js, в обход React-рендеринга. Это важно: мутации объектов внутри `useFrame` не вызывают перерисовку компонента.

```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

function RotatingBox() {
  const meshRef = useRef<Mesh>(null)

  useFrame((state, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += delta
    meshRef.current.rotation.y += delta * 0.5
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}
```

`delta` — время в секундах с предыдущего кадра. Используйте `delta` вместо фиксированных инкрементов, чтобы анимация была независима от частоты кадров.

`state` содержит полезные данные сцены:

```tsx
useFrame((state) => {
  // Время с момента запуска
  const t = state.clock.elapsedTime

  // Синусоидальное покачивание
  meshRef.current.position.y = Math.sin(t) * 0.5

  // Камера
  console.log(state.camera.position)

  // Размеры viewport
  console.log(state.size.width, state.size.height)
})
```

## Взаимодействие с объектами

R3F реализует систему событий поверх raycasting Three.js. События вешаются прямо на JSX-теги:

```tsx
function InteractiveCube() {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

  return (
    <mesh
      onClick={() => setClicked((c) => !c)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={clicked ? 1.5 : 1}
    >
      <boxGeometry />
      <meshStandardMaterial color={hovered ? '#ff6b6b' : '#4ecdc4'} />
    </mesh>
  )
}
```

Доступные события: `onClick`, `onDoubleClick`, `onContextMenu`, `onPointerDown`, `onPointerUp`, `onPointerMove`, `onPointerOver`, `onPointerOut`, `onPointerEnter`, `onPointerLeave`, `onPointerCancel`, `onWheel`.

Обработчик получает объект события с расширенными данными:

```tsx
<mesh
  onClick={(event) => {
    event.stopPropagation() // Остановить обработку вложенных объектов
    console.log(event.point) // THREE.Vector3 — точка пересечения
    console.log(event.face)  // Грань меша
    console.log(event.distance) // Расстояние от камеры
  }}
>
```

## Библиотека @react-three/drei

`drei` — набор готовых хуков и компонентов для частых задач. Без неё пришлось бы писать намного больше кода.

### OrbitControls — управление камерой

```tsx
import { OrbitControls } from '@react-three/drei'

<Canvas>
  <OrbitControls
    enableZoom={true}
    enablePan={true}
    minDistance={2}
    maxDistance={20}
    maxPolarAngle={Math.PI / 2}
  />
  {/* сцена */}
</Canvas>
```

### Загрузка моделей

```tsx
import { useGLTF } from '@react-three/drei'

function Model() {
  const { scene } = useGLTF('/models/robot.glb')
  return <primitive object={scene} />
}

// Предзагрузка до монтирования компонента
useGLTF.preload('/models/robot.glb')
```

### Текст в 3D

```tsx
import { Text } from '@react-three/drei'

<Text
  position={[0, 2, 0]}
  fontSize={0.5}
  color="white"
  anchorX="center"
  anchorY="middle"
>
  Привет, мир!
</Text>
```

### Environment и освещение на основе HDRI

```tsx
import { Environment } from '@react-three/drei'

<Canvas>
  <Environment preset="city" background />
  <mesh>
    <sphereGeometry args={[1, 64, 64]} />
    {/* envMapIntensity добавляет отражения из Environment */}
    <meshStandardMaterial metalness={1} roughness={0} />
  </mesh>
</Canvas>
```

## Практический пример: анимированная галерея объектов

Соберём сцену с несколькими вращающимися объектами, которые реагируют на наведение мыши и меняют скорость при клике:

```tsx
import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Mesh } from 'three'

type ShapeProps = {
  position: [number, number, number]
  color: string
  speed?: number
}

function AnimatedShape({ position, color, speed = 1 }: ShapeProps) {
  const ref = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [fast, setFast] = useState(false)

  useFrame((state, delta) => {
    if (!ref.current) return
    const multiplier = fast ? 4 : hovered ? 2 : 1
    ref.current.rotation.x += delta * speed * multiplier
    ref.current.rotation.y += delta * speed * 0.7 * multiplier
  })

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={() => setFast((f) => !f)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.2 : 1}
    >
      <icosahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.4}
        emissive={color}
        emissiveIntensity={hovered ? 0.3 : 0}
      />
    </mesh>
  )
}

const SHAPES = [
  { position: [-3, 0, 0] as [number, number, number], color: '#ff6b6b', speed: 0.8 },
  { position: [0, 0, 0] as [number, number, number], color: '#4ecdc4', speed: 1.2 },
  { position: [3, 0, 0] as [number, number, number], color: '#ffe66d', speed: 1.0 },
]

export function Gallery() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <ambientLight intensity={0.2} />
        <Environment preset="night" />

        {SHAPES.map((props, i) => (
          <AnimatedShape key={i} {...props} />
        ))}

        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )
}
```

## Производительность

### useMemo для геометрий и материалов

Если геометрия или материал не зависят от пропов — вынесите их за пределы компонента или используйте `useMemo`. Каждый рендер иначе будет создавать новые объекты Three.js:

```tsx
import { useMemo } from 'react'
import { SphereGeometry, MeshStandardMaterial } from 'three'

function OptimizedSphere() {
  const geometry = useMemo(() => new SphereGeometry(1, 64, 64), [])
  const material = useMemo(
    () => new MeshStandardMaterial({ color: 'blue', wireframe: true }),
    []
  )

  return <mesh geometry={geometry} material={material} />
}
```

### instancedMesh для повторяющихся объектов

Для тысяч одинаковых объектов используйте `instancedMesh` — он отправляет все трансформации в один draw call:

```tsx
import { useRef, useEffect } from 'react'
import { InstancedMesh, Matrix4, Color } from 'three'

function Particles({ count = 1000 }) {
  const ref = useRef<InstancedMesh>(null)

  useEffect(() => {
    if (!ref.current) return
    const matrix = new Matrix4()
    const color = new Color()

    for (let i = 0; i < count; i++) {
      matrix.setPosition(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      )
      ref.current.setMatrixAt(i, matrix)
      ref.current.setColorAt(i, color.setHSL(i / count, 1, 0.5))
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [count])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial />
    </instancedMesh>
  )
}
```

## Загрузка ресурсов с Suspense

R3F поддерживает React Suspense для асинхронной загрузки текстур и моделей. Оберните компоненты с ресурсами в `Suspense`:

```tsx
import { Suspense } from 'react'
import { useTexture } from '@react-three/drei'

function Earth() {
  const texture = useTexture('/textures/earth.jpg')

  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

export function Scene() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
    </Canvas>
  )
}
```

`fallback={null}` означает, что пока модель грузится — ничего не показывается. Можно передать другой компонент-заглушку.

## Когда использовать React Three Fiber

R3F хорошо подходит для:
- Интерактивных 3D-конфигураторов продуктов
- Визуализации данных в трёхмерном пространстве
- Игровых интерфейсов и казуальных браузерных игр
- Анимированных лендингов с 3D-элементами
- Образовательных симуляций

Если нужна максимальная производительность для AAA-игр или сложных физических симуляций — Three.js напрямую даст больше контроля. Но для большинства задач накладные расходы R3F минимальны и не ощущаются.

Подробнее о работе с компонентами и хуками в React можно узнать на курсе [React — Полный курс](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-three-fiber).