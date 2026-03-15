---
metaTitle: React Icons - библиотека иконок для React приложений
metaDescription: Полное руководство по react-icons: установка, использование FontAwesome, Material Design, Bootstrap Icons, настройка размера и цвета, IconContext, TypeScript и tree-shaking
author: Олег Марков
title: React Icons - библиотека иконок для React
preview: Узнайте, как использовать react-icons для добавления иконок в React-приложения. FontAwesome, Material Design, Bootstrap Icons, настройка через props и IconContext, tree-shaking для оптимальной производительности
---

## Введение

Иконки — неотъемлемая часть любого современного веб-интерфейса. Они помогают пользователям быстро ориентироваться в приложении, делают UI более выразительным и интуитивно понятным. Но подключение иконочных шрифтов или SVG-библиотек традиционно требует немало усилий: загрузка шрифтов, настройка CSS, ручная конвертация SVG в компоненты.

**react-icons** решает эту проблему элегантно — она предоставляет единый интерфейс для работы с десятками популярных наборов иконок прямо в React-компонентах. Вместо того чтобы подключать несколько разных библиотек, вы получаете доступ к тысячам иконок через один пакет с поддержкой tree-shaking.

В этой статье вы узнаете, как установить и настроить react-icons, научитесь использовать иконки из разных наборов, настраивать их внешний вид через props и контекст, а также познакомитесь с лучшими практиками использования библиотеки в TypeScript-проектах.

## Что такое react-icons и зачем использовать

**react-icons** — это npm-пакет, который объединяет более 30 популярных наборов иконок и предоставляет их в виде React-компонентов. Каждая иконка — это отдельный SVG-компонент, что даёт несколько ключевых преимуществ:

- **Единый API** — все иконки работают одинаково, независимо от источника
- **Tree-shaking** — в финальный бандл попадают только те иконки, которые вы реально используете
- **Гибкая стилизация** — размер и цвет настраиваются через props или CSS
- **TypeScript-поддержка** — все типы включены в пакет
- **Нет зависимости от шрифтов** — SVG работает везде без дополнительной загрузки

Библиотека включает такие популярные наборы как Font Awesome, Material Design Icons, Bootstrap Icons, Feather Icons, Heroicons и многие другие. Актуальный список доступен на официальном сайте [react-icons.github.io/react-icons](https://react-icons.github.io/react-icons/).

## Установка

Установка react-icons стандартная через npm или yarn:

```bash
# npm
npm install react-icons

# yarn
yarn add react-icons

# pnpm
pnpm add react-icons
```

Пакет не требует дополнительных зависимостей и настроек — после установки можно сразу начинать использовать иконки.

## Базовое использование

Импорт иконок осуществляется напрямую из соответствующего подпакета. Каждый набор иконок имеет свой префикс в названии подпакета:

```tsx
import { FaReact } from 'react-icons/fa';       // Font Awesome
import { MdEmail } from 'react-icons/md';         // Material Design
import { BsGithub } from 'react-icons/bs';        // Bootstrap Icons
import { FiSearch } from 'react-icons/fi';        // Feather Icons
import { HiOutlineHome } from 'react-icons/hi';   // Heroicons
```

Использование иконки в компоненте ничем не отличается от обычного JSX-элемента:

```tsx
import React from 'react';
import { FaReact } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

export function Header() {
  return (
    <header>
      <FaReact />
      <span>Моё React-приложение</span>
      <MdEmail />
    </header>
  );
}
```

По умолчанию иконка наследует размер шрифта родительского элемента и текущий цвет (`currentColor`). Это означает, что иконки автоматически вписываются в типографику вашего приложения без дополнительных стилей.

## Доступные наборы иконок

react-icons предоставляет доступ к огромному количеству наборов. Вот наиболее популярные из них:

### Font Awesome (fa, fa6)

Один из самых известных наборов иконок. Содержит тысячи иконок для самых разных задач:

```tsx
import { FaHome, FaUser, FaShoppingCart, FaHeart, FaStar } from 'react-icons/fa';
// Версия 6
import { Fa6Circle, Fa6CircleCheck } from 'react-icons/fa6';
```

### Material Design Icons (md)

Официальный набор иконок от Google, используется в Material UI:

```tsx
import { MdSearch, MdMenu, MdClose, MdArrowBack, MdSettings } from 'react-icons/md';
```

### Bootstrap Icons (bs)

Иконки из экосистемы Bootstrap — лаконичные и универсальные:

```tsx
import { BsGithub, BsTwitter, BsLinkedin, BsEnvelope, BsTelephone } from 'react-icons/bs';
```

### Feather Icons (fi)

Минималистичный набор иконок с открытым исходным кодом:

```tsx
import { FiEdit, FiTrash2, FiPlus, FiDownload, FiUpload } from 'react-icons/fi';
```

### Heroicons (hi, hi2)

Набор иконок от создателей Tailwind CSS:

```tsx
import { HiOutlineBell, HiOutlineUser, HiChevronDown } from 'react-icons/hi';
// Heroicons v2
import { HiMiniXMark, HiOutlineSquares2X2 } from 'react-icons/hi2';
```

### Lucide (lu)

Современный форк Feather Icons с расширенным набором:

```tsx
import { LuClock, LuCalendar, LuGlobe, LuZap } from 'react-icons/lu';
```

### Другие популярные наборы

| Префикс | Набор |
|---------|-------|
| `ai` | Ant Design Icons |
| `bi` | BoxIcons |
| `cg` | CSS.gg |
| `gi` | Game Icons |
| `go` | GitHub Octicons |
| `gr` | Grommet Icons |
| `im` | IcoMoon Free |
| `io` / `io5` | Ionicons 4 / 5 |
| `pi` | Phosphor Icons |
| `ri` | Remix Icon |
| `rx` | Radix Icons |
| `si` | Simple Icons (бренды) |
| `sl` | Simple Line Icons |
| `tb` | Tabler Icons |
| `ti` | Typicons |
| `vsc` | VS Code Icons |
| `wi` | Weather Icons |

Полный актуальный список наборов с предварительным просмотром иконок доступен на [react-icons.github.io/react-icons](https://react-icons.github.io/react-icons/).

## Настройка размера и цвета через props

Все иконки react-icons принимают стандартные props для управления внешним видом:

### Размер (size)

```tsx
import { FaReact } from 'react-icons/fa';

// По умолчанию иконка наследует размер шрифта
<FaReact />

// Явное указание размера в пикселях
<FaReact size={24} />
<FaReact size="2rem" />
<FaReact size="48px" />
```

### Цвет (color)

```tsx
import { FaHeart } from 'react-icons/fa';

// Явный цвет
<FaHeart color="red" />
<FaHeart color="#e74c3c" />
<FaHeart color="rgb(231, 76, 60)" />

// Наследование через CSS (используется по умолчанию)
<span style={{ color: 'blue' }}>
  <FaHeart /> {/* Иконка будет синей */}
</span>
```

### Стилизация через className и style

Иконки полностью поддерживают стандартные React-атрибуты `className` и `style`:

```tsx
import { MdEmail } from 'react-icons/md';

// Через className (Tailwind CSS)
<MdEmail className="text-blue-500 hover:text-blue-700 transition-colors" />

// Через inline style
<MdEmail style={{
  fontSize: '2rem',
  color: '#3498db',
  cursor: 'pointer'
}} />
```

### Доступность (aria-label, title)

Для повышения доступности добавляйте атрибут `aria-label`:

```tsx
import { FiSearch } from 'react-icons/fi';

// Декоративная иконка (скрывается от screen readers)
<FiSearch aria-hidden="true" />

// Значимая иконка с подписью
<button aria-label="Поиск">
  <FiSearch aria-hidden="true" />
</button>

// Иконка с видимым текстом
<FiSearch title="Найти" />
```

## Использование IconContext для глобальных настроек

Если вам нужно применить одинаковые настройки к группе иконок, используйте `IconContext.Provider`. Это позволяет избежать повторения props для каждой иконки:

```tsx
import { IconContext } from 'react-icons';
import { FaHome, FaUser, FaCog } from 'react-icons/fa';

// Все иконки внутри Provider получат эти настройки
function Navigation() {
  return (
    <IconContext.Provider value={{ size: '1.5rem', color: '#2c3e50' }}>
      <nav>
        <FaHome />
        <FaUser />
        <FaCog />
      </nav>
    </IconContext.Provider>
  );
}
```

### Доступные значения контекста

```tsx
interface IconContext {
  color?: string;      // Цвет иконки
  size?: string;       // Размер (строка: '1rem', '24px')
  className?: string;  // CSS-класс
  style?: React.CSSProperties;  // Inline стили
  attr?: React.SVGAttributes<SVGElement>;  // SVG атрибуты
}
```

### Пример с Tailwind CSS

```tsx
import { IconContext } from 'react-icons';
import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';

function ActionButtons() {
  return (
    <IconContext.Provider value={{ className: 'text-gray-600 hover:text-gray-900' }}>
      <div className="flex gap-2">
        <button>
          <FiEdit />
        </button>
        <button>
          <FiEye />
        </button>
        <button>
          <FiTrash2 />
        </button>
      </div>
    </IconContext.Provider>
  );
}
```

### Вложенные контексты

Контексты можно вкладывать — внутренний переопределяет значения внешнего:

```tsx
import { IconContext } from 'react-icons';
import { FaHeart, FaStar } from 'react-icons/fa';

function App() {
  return (
    <IconContext.Provider value={{ size: '1.5rem', color: 'gray' }}>
      <div>
        <FaStar /> {/* Серая, 1.5rem */}

        <IconContext.Provider value={{ color: 'gold' }}>
          <FaStar /> {/* Золотая, наследует 1.5rem из внешнего контекста */}
          <FaHeart /> {/* Золотая, 1.5rem */}
        </IconContext.Provider>
      </div>
    </IconContext.Provider>
  );
}
```

## Работа с TypeScript

react-icons имеет встроенную TypeScript-поддержку — все типы уже включены в пакет, дополнительно устанавливать `@types/react-icons` не нужно.

### Тип IconType

Для работы с иконками как с пропами компонентов используйте тип `IconType`:

```tsx
import { IconType } from 'react-icons';
import { FaHome, FaUser } from 'react-icons/fa';

// Компонент, принимающий любую иконку
interface MenuItemProps {
  icon: IconType;
  label: string;
  onClick: () => void;
}

function MenuItem({ icon: Icon, label, onClick }: MenuItemProps) {
  return (
    <button onClick={onClick} className="flex items-center gap-2">
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

// Использование
function Sidebar() {
  return (
    <nav>
      <MenuItem icon={FaHome} label="Главная" onClick={() => {}} />
      <MenuItem icon={FaUser} label="Профиль" onClick={() => {}} />
    </nav>
  );
}
```

### Типизация props иконок

Иконки принимают стандартные SVG-атрибуты плюс специфические для react-icons:

```tsx
import { IconBaseProps } from 'react-icons';
import { FiSearch } from 'react-icons/fi';

// Расширение props иконки
interface SearchIconProps extends IconBaseProps {
  isActive?: boolean;
}

function SearchIcon({ isActive, ...props }: SearchIconProps) {
  return (
    <FiSearch
      {...props}
      color={isActive ? '#3498db' : '#95a5a6'}
    />
  );
}
```

### Динамический импорт иконок

```tsx
import { lazy, Suspense } from 'react';
import { IconType } from 'react-icons';

// Словарь иконок для динамической загрузки
const iconMap: Record<string, () => Promise<{ default: IconType }>> = {
  home: () => import('react-icons/fa').then(m => ({ default: m.FaHome })),
  user: () => import('react-icons/fa').then(m => ({ default: m.FaUser })),
  settings: () => import('react-icons/md').then(m => ({ default: m.MdSettings })),
};
```

## Советы по производительности и tree-shaking

### Правильный импорт для tree-shaking

react-icons поддерживает tree-shaking из коробки — в бандл попадут только импортированные иконки. Важно импортировать из конкретного подпакета, а не из корня:

```tsx
// Правильно — tree-shaking работает
import { FaHome } from 'react-icons/fa';
import { MdSearch } from 'react-icons/md';

// Неправильно — может включить весь набор
// import { FaHome } from 'react-icons'; // Так не делайте
```

### Группировка импортов

Группируйте импорты из одного набора в одну строку — это улучшает читаемость и помогает бандлеру:

```tsx
// Хорошо: все из fa в одной строке
import { FaHome, FaUser, FaCog, FaHeart, FaStar } from 'react-icons/fa';

// Менее удобно: каждая иконка отдельно
import { FaHome } from 'react-icons/fa';
import { FaUser } from 'react-icons/fa';
import { FaCog } from 'react-icons/fa';
```

### Создание централизованного файла иконок

Для крупных проектов удобно создать один файл с экспортами всех используемых иконок:

```tsx
// src/components/icons/index.ts
export { FaHome as HomeIcon } from 'react-icons/fa';
export { FaUser as UserIcon } from 'react-icons/fa';
export { FaCog as SettingsIcon } from 'react-icons/fa';
export { MdSearch as SearchIcon } from 'react-icons/md';
export { MdEmail as EmailIcon } from 'react-icons/md';
export { BsGithub as GithubIcon } from 'react-icons/bs';
export { FiEdit as EditIcon } from 'react-icons/fi';
export { FiTrash2 as DeleteIcon } from 'react-icons/fi';

// В компонентах импортируем из централизованного файла
// import { HomeIcon, UserIcon } from '@/components/icons';
```

Такой подход упрощает смену набора иконок в будущем — достаточно поменять импорт в одном файле.

### Мемоизация при динамической стилизации

Если вы вычисляете props иконки динамически, используйте `useMemo` для предотвращения лишних ре-рендеров:

```tsx
import { useMemo } from 'react';
import { FaStar } from 'react-icons/fa';

function RatingIcon({ score }: { score: number }) {
  const iconStyle = useMemo(() => ({
    color: score >= 4 ? '#f39c12' : score >= 2 ? '#95a5a6' : '#e74c3c',
    size: score === 5 ? 32 : 24,
  }), [score]);

  return <FaStar {...iconStyle} />;
}
```

## Практические примеры

### Кнопки с иконками

```tsx
import { FiSave, FiX, FiEdit, FiTrash2 } from 'react-icons/fi';

// Кнопка с иконкой и текстом
function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
    >
      <FiSave aria-hidden="true" />
      <span>Сохранить</span>
    </button>
  );
}

// Кнопка только с иконкой (icon button)
function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Удалить"
      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
    >
      <FiTrash2 aria-hidden="true" size={20} />
    </button>
  );
}

// Группа кнопок редактирования
function EditActions({ onEdit, onDelete, onCancel }: {
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button onClick={onEdit} aria-label="Редактировать">
        <FiEdit size={18} className="text-blue-500" />
      </button>
      <button onClick={onDelete} aria-label="Удалить">
        <FiTrash2 size={18} className="text-red-500" />
      </button>
      <button onClick={onCancel} aria-label="Отмена">
        <FiX size={18} className="text-gray-500" />
      </button>
    </div>
  );
}
```

### Навигационное меню с иконками

```tsx
import { NavLink } from 'react-router-dom'; // или любой роутер
import { FaHome, FaUser, FaCog, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { IconContext } from 'react-icons';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Главная', icon: FaHome },
  { path: '/profile', label: 'Профиль', icon: FaUser },
  { path: '/notifications', label: 'Уведомления', icon: FaBell },
  { path: '/settings', label: 'Настройки', icon: FaCog },
];

function Sidebar() {
  return (
    <IconContext.Provider value={{ size: '1.25rem' }}>
      <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col">
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button className="flex items-center gap-3 text-gray-400 hover:text-white px-4 py-3 w-full">
            <FaSignOutAlt aria-hidden="true" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>
    </IconContext.Provider>
  );
}
```

### Карточки с иконками

```tsx
import { FiUsers, FiTrendingUp, FiShoppingCart, FiDollarSign } from 'react-icons/fi';
import { IconType } from 'react-icons';

interface StatCardProps {
  icon: IconType;
  title: string;
  value: string | number;
  change?: number;
  color: string;
}

function StatCard({ icon: Icon, title, value, change, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change !== undefined && (
          <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% за месяц
          </p>
        )}
      </div>
    </div>
  );
}

// Использование
function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon={FiUsers}
        title="Пользователи"
        value="12,345"
        change={8.2}
        color="bg-blue-500"
      />
      <StatCard
        icon={FiTrendingUp}
        title="Посещаемость"
        value="89,210"
        change={3.1}
        color="bg-green-500"
      />
      <StatCard
        icon={FiShoppingCart}
        title="Заказы"
        value="1,429"
        change={-2.4}
        color="bg-orange-500"
      />
      <StatCard
        icon={FiDollarSign}
        title="Выручка"
        value="₽ 2,840,000"
        change={12.7}
        color="bg-purple-500"
      />
    </div>
  );
}
```

### Поле поиска с иконкой

```tsx
import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

function SearchInput() {
  const [value, setValue] = useState('');

  return (
    <div className="relative flex items-center">
      <FiSearch
        className="absolute left-3 text-gray-400"
        size={18}
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Поиск..."
        className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 text-gray-400 hover:text-gray-600"
          aria-label="Очистить поиск"
        >
          <FiX size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
```

### Уведомления с иконками статусов

```tsx
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';

type AlertType = 'success' | 'error' | 'warning' | 'info';

const alertConfig: Record<AlertType, {
  icon: React.ComponentType<{ size?: number; aria-hidden?: string }>;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  success: {
    icon: FiCheckCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
  },
  error: {
    icon: FiAlertCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
  },
  warning: {
    icon: FiAlertTriangle,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
  },
  info: {
    icon: FiInfo,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
  },
};

interface AlertProps {
  type: AlertType;
  message: string;
}

function Alert({ type, message }: AlertProps) {
  const { icon: Icon, bgColor, textColor, borderColor } = alertConfig[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor} ${textColor} ${borderColor}`}>
      <Icon size={20} aria-hidden="true" className="flex-shrink-0 mt-0.5" />
      <p>{message}</p>
    </div>
  );
}
```

## Заключение

react-icons — это удобный и эффективный способ работы с иконками в React-приложениях. Библиотека объединяет десятки популярных наборов под единым API, поддерживает tree-shaking для минимального размера бандла и полностью интегрируется с TypeScript.

Ключевые моменты, которые стоит запомнить:

- Импортируйте иконки из конкретных подпакетов (`react-icons/fa`, `react-icons/md` и т.д.) — это обеспечивает корректный tree-shaking
- Используйте `IconContext.Provider` для применения общих настроек к группе иконок
- Тип `IconType` позволяет передавать иконки как пропы компонентов
- Добавляйте `aria-label` или `aria-hidden` для обеспечения доступности
- Создавайте централизованный файл экспортов иконок для упрощения поддержки кода

Библиотека активно развивается — новые наборы иконок регулярно добавляются. Следите за обновлениями на [официальном сайте](https://react-icons.github.io/react-icons/) и [GitHub-репозитории](https://github.com/react-icons/react-icons).
