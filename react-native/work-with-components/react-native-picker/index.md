---
metaTitle: Использование выпадающих списков в React Native
metaDescription: Узнайте как реализовать выпадающие списки в React Native - основные подходы, библиотеки, кастомные решения и лучшие практики для мобильных приложений
author: Олег Марков
title: Использование выпадающих списков в React Native
preview: Практические приёмы создания и настройки выпадающих списков в React Native на примерах, включая кастомные компоненты и интеграцию с популярными библиотеками
---

## Введение

В мобильной разработке для пользовательских интерфейсов часто требуется организовать удобный выбор одного или нескольких значений из списка. В вебе такие задачи решаются через элемент `select`, но в React Native этот элемент не поддерживается из коробки, и приходится искать другие подходы. Здесь мы рассмотрим, как реализовать выпадающие списки (dropdowns) в React Native, какие готовые решения можно использовать, как создать собственный компонент dropdown, а также разберём типичные особенности интеграции и настройки.

## Основные подходы к реализации выпадающих списков

React Native развивался как кросс-платформенный инструмент для iOS и Android, и подход к созданию выпадающих списков (dropdown) здесь отличается от подхода в веб-разработке. В этой части статьи мы осветим:

- Использование стандартного компонента Picker
- Популярные сторонние библиотеки (react-native-picker-select, react-native-dropdown-picker, react-native-modal-dropdown)
- Реализация кастомного dropdown с модальным окном и FlatList

Давайте рассмотрим каждый способ подробнее.

### Использование стандартного компонента Picker

До версии 0.64 в React Native существовал компонент Picker, который позволял показать обычный выпадающий список. Вот пример того, как это работает:

```jsx
import React, { useState } from 'react';
import { View, Picker, Text } from 'react-native';

const BasicPicker = () => {
  const [selectedValue, setSelectedValue] = useState('java');

  return (
    <View>
      <Text>Вы выбрали: {selectedValue}</Text>
      <Picker
        selectedValue={selectedValue}
        style={{ height: 50, width: 200 }}
        onValueChange={(itemValue) => setSelectedValue(itemValue)}
      >
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />
        <Picker.Item label="Python" value="python" />
      </Picker>
    </View>
  );
};
```

// Picker отображает список значений для выбора. Выбранное значение хранится в состоянии.

Однако теперь Picker не входит в основной пакет React Native и вынесен в отдельный модуль [@react-native-picker/picker](https://github.com/react-native-picker/picker). Вы можете установить его так:

```
npm install @react-native-picker/picker
```

Импортируйте компонент Picker из пакета после установки:

```jsx
import { Picker } from '@react-native-picker/picker';
```

#### Особенности стандартного Picker

- Хорошо смотрится в стиле платформы: показывает штатный dropdown для Android и wheel-pick для iOS.
- Поддерживает только простые списки, нельзя кастомизировать сильно интерфейс.
- Не позволяет делать многоуровневые выпадающие списки.

### Популярные сторонние решения

Стандартных возможностей Picker зачастую недостаточно для кастомизации, поэтому на практике чаще используют сторонние библиотеки. Давайте разберем три самых популярных варианта.

Выпадающие списки (dropdowns) являются важным элементом UI для выбора одного значения из множества вариантов в React Native приложениях. Их правильная настройка и использование критичны для обеспечения удобного пользовательского опыта. Важно уметь динамически генерировать элементы списка, стилизовать их и обрабатывать выбор пользователя. Если вы хотите детальнее погрузиться в настройку и использование выпадающих списков и других UI-компонентов в React Native, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Ispolzovanie-vypadayuschih-spiskov-v-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

#### react-native-picker-select

Эта библиотека обеспечивает простой и настраиваемый dropdown, который работает как на Android, так и на iOS.

Установка:

```
npm install react-native-picker-select
```

Применение:

```jsx
import React, { useState } from 'react';
import RNPickerSelect from 'react-native-picker-select';

const items = [
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'js' },
  { label: 'Python', value: 'python' },
];

const DropdownExample = () => {
  const [value, setValue] = useState(null);

  return (
    <RNPickerSelect
      onValueChange={setValue}
      items={items}
      placeholder={{ label: 'Выберите язык', value: null }}
      value={value}
    />
  );
};
```

// RNPickerSelect предоставляет доступ к свойствам кастомизации, стилям и placeholder.

Плюсы:

- Много настроек, можно стилизовать поля, placeholder.
- Простой интерфейс.
- Поддерживает кастомные и нативные реализации.

Минусы:

- Сложнее добавить выпадающие списки с чекбоксами или множественным выбором.

#### react-native-dropdown-picker

Очень популярная библиотека с широкой кастомизацией и поддержкой множественного выбора.

Установка:

```
npm install react-native-dropdown-picker
```

Простой пример:

```jsx
import React, { useState } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';

const DropdownPickerExample = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: 'Java', value: 'java' },
    { label: 'JavaScript', value: 'js' },
    { label: 'Python', value: 'python' },
  ]);

  return (
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      setItems={setItems}
      placeholder="Выберите язык"
      style={{ width: 200 }}
    />
  );
};
```

// Обратите внимание, библиотека требует передачи функций setOpen, setValue, setItems для управления состояниями.

Плюсы:

- Можно выбирать сразу несколько значений.
- Удобная стилизация, возможность добавить иконки.
- Широкие возможности для кастомизации интерфейса.

Минусы:

- Размер библиотеки, необходимость контролировать состояния (open, value, items).
- Иногда возникают трудности с интеграцией в сложные формы.

#### react-native-modal-dropdown

Вызывает список с вариантами выбора через модальное окно. Легко внедряется в интерфейс, позволяет делать выпадающие списки в любом стиле.

Установка:

```
npm install react-native-modal-dropdown
```

Использование:

```jsx
import React from 'react';
import ModalDropdown from 'react-native-modal-dropdown';
import { View } from 'react-native';

const options = ['Java', 'JavaScript', 'Python'];

const ModalDropdownExample = () => (
  <View style={{ marginTop: 40 }}>
    <ModalDropdown options={options} />
  </View>
);

// По событию onSelect вызывается callback, выбранное значение можно получить по индексу.
```

Плюсы:

- Можно выводить любой JSX внутри выпадающего списка.
- Гибкая стилизация.

Минусы:

- Не поддерживает wheel-picker для iOS вне коробки.
- Для особых случаев потребуется дополнительное кодирование.

### Самостоятельная реализация кастомного выпадающего списка

Если сторонние решения вам не подходят (например, от вас требуется уникальный дизайн или сложная бизнес-логика), выпадающий список можно сделать вручную, используя модальные окна и FlatList.

##### Основной подход

- Скрытый до взаимодействия модальный компонент, который раскрывает FlatList со всеми вариантами.
- Кнопка отображения текущего значения.
- Управление видимостью через состояние.

Вот пример:

```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';

const DATA = [
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'js' },
  { label: 'Python', value: 'python' },
];

const CustomDropdown = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState(null);

  // Обработчик клика по элементу списка
  const handleSelect = (item) => {
    setSelected(item);
    setModalVisible(false); // Скрываем модальное окно после выбора
  };

  return (
    <View style={{ margin: 20 }}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text>{selected ? selected.label : 'Выберите язык'}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.dropdown}>
            <FlatList
              data={DATA}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(item)}
                >
                  <Text>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    padding: 10,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fafafa'
  },
  overlay: {
    flex: 1,
    justifyContent: 'center'
  },
  dropdown: {
    marginHorizontal: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 4
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  }
});

// Кнопка открывает модальное окно, список рендерится с помощью FlatList.
```

Плюсы такого подхода:

- Полный контроль над стилями, анимациями, логикой.
- Можно добавить иконки, выделение текущего значения, фильтрацию по поиску и любые другие фичи.

Минусы:

- Придётся ручками реализовывать обработку ошибок, accessibility, анимации.
- Нет готовой поддержки wheel-picker для iOS.

### Множественный выбор и кастомные элементы

Описанные выше способы можно модернизировать для поддержки множественного выбора (multi-select). Обычно для этого достаточно:

- Хранить массив выбранных значений, а не одно.
- На FlatList для каждого элемента отображать чекбокс.
- В методе handleSelect управлять добавлением и удалением из массива.

Пример фрагмента такого поведения:

```jsx
const [selected, setSelected] = useState([]);
// Для множественного выбора используем массив

const handleSelect = (item) => {
  if (selected.includes(item.value)) {
    setSelected(selected.filter(val => val !== item.value)); // Убираем значение
  } else {
    setSelected([...selected, item.value]); // Добавляем значение
  }
};

// Список рендерим так:
<TouchableOpacity
  style={styles.item}
  onPress={() => handleSelect(item)}
>
  <Text>{selected.includes(item.value) ? '[x] ' : '[ ] '}{item.label}</Text>
</TouchableOpacity>
```

Здесь мы добавляем чекбокс, основанный на факте присутствия значения в массиве selected.

## Особенности взаимодействия dropdown со стилями и формами

Есть несколько нюансов, которые стоит учитывать при интеграции dropdown в форму или сложные интерфейсы:

- **Размеры**: выпадающие списки не умеют автоматически ограничивать свою длину — рассмотрите вариант с ограничением высоты FlatList и скроллом.
- **Адаптивность**: используйте проценты или Dimensions для корректного отображения на разных устройствах.
- **Accessibility**: не забудьте о доступности — указывайте параметры accessibilityLabel, удобно организуйте фокус.
- **Формы**: при работе с библиотеками форм, например, Formik или react-hook-form, связывайте выбранные значения с внутренним состоянием вашей формы вручную, через обработчики onValueChange.

## Локализация и динамическая подгрузка данных

Для dropdown часто необходимо подгружать данные динамически или учитывать язык интерфейса:

- Для загрузки вариантов из API используйте useEffect и храните список вариантов в состоянии.
- Для поддержки нескольких языков используйте библиотеку i18n и храните переводы в массиве label.

```jsx
const [items, setItems] = useState([]);
useEffect(() => {
  fetch('https://api.exaple.com/languages')
    .then(res => res.json())
    .then(data => setItems(data));
}, []);
// Получаем список вариантов с сервера, помещаем его в dropdown
```

## Советы по производительности

- Используйте FlatList вместо ScrollView для больших списков (FlatList подгружает элементы по мере прокрутки).
- Не храните тяжёлые объекты внутри элементов state, используйте value и label как ключевые поля.
- Старайтесь не делать dropdown слишком глубоким во вложениях, чтобы не усложнять навигацию для пользователя.

## Заключение

В React Native выпадающие списки могут быть реализованы разными способами — от использования стандартного Picker до сложных кастомных модальных окон с FlatList. Выбор решения зависит от ваших требований к пользовательскому опыту, ожидаемой кастомизации и специфики проекта. Готовые библиотеки покрывают 90% стандартных сценариев, но для сложных UI или специфики интеграций пригодится ручная реализация dropdown-компонента. Помните о нюансах управления состояниями, адаптивности, поддержке accessibility и интеграции во внешние формы.

Использование выпадающих списков — важный аспект разработки UI, но для создания полноценного React Native приложения необходимо также уметь управлять состоянием, обеспечивать навигацию, работать с API и создавать переиспользуемые компоненты. На нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Ispolzovanie-vypadayuschih-spiskov-v-React-Native) вы найдете все необходимые знания и навыки для создания профессиональных React Native приложений. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы

#### Как добавить в dropdown разделители между группами элементов?

Добавьте в массив данных элементы специального типа (например, `{ type: 'separator' }`), и в renderItem FlatList используйте условие для отрисовки разделителя (например, горизонтальной линии или заголовка группы). Можно добавить заголовки через методы SectionList.

#### Как реализовать поиск по выпадающему списку?

Добавьте в компонент поиска TextInput, и по его событию onChangeText фильтруйте массив данных списка (например, с помощью функции filter). Обновляйте состояние FlatList с учётом введённого текста.

#### Выпадающий список не отображается поверх других элементов интерфейса. Почему?

Часто причиной бывает уровень zIndex или особенности работы Modal/Portal. Используйте модальный компонент (Modal или Portal из react-native-paper), чтобы dropdown был поверх всех элементов, и убедитесь, что overlay не перекрывает элементы с dropdown.

#### Как закрыть выпадающий список по клику вне его области?

Для этого оборачивайте основное содержимое модального окна в TouchableOpacity с прозрачным фоном, и на обработчик onPress в этом элементе помещайте функцию закрытия dropdown.

#### Как синхронизировать значение dropdown с глобальным состоянием (например, Redux или Context API)?

Вместо локального useState передавайте значение и функцию установки из Redux или Context. Например, обрабатывайте onValueChange через dispatch в Redux или через setValue из useContext. Так ваше значение всегда будет актуальным во всём приложении, даже если выбранное значение меняют из других компонентов.
