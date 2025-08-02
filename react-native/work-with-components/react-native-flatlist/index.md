---
metaTitle: Отображение списков данных в React Native
metaDescription: Узнайте как отображать списки данных в React Native - основные компоненты списоков, оптимизация производительности и примеры кода для мобильной разработки
author: Олег Марков
title: Отображение списков данных в React Native
preview: Изучите методы отображения списков данных в React Native - разбор FlatList SectionList и ScrollView с примерами кода и советами по оптимизации производительности
---

## Введение

В мобильных приложениях почти всегда возникает задача вывода списков — будь то товары в интернет-магазине, контакты в адресной книге или посты в ленте новостей. React Native предлагает разработчикам набор инструментов для отображения и работы с такого рода списками. Вы узнаете, как правильно и эффективно использовать компоненты для вывода списков, на какие моменты нужно обращать внимание при работе с большими массивами данных и какие настройки позволяют оптимизировать производительность.

В этой статье я подробно расскажу о компонентах, которые часто используются для отображения списков: `ScrollView`, `FlatList`, и `SectionList`. Кроме того, вы познакомитесь с тем, как добавлять пользовательские элементы, реализовывать разделители, заголовки, а также управлять обновлением данных. После прочтения статьи у вас будет четкое понимание, какой компонент когда выбирать, и как сделать работу со списками в React Native удобной и эффективной.

## ScrollView: для небольших списков

### Что такое ScrollView

`ScrollView` — это контейнер, позволяющий прокручивать вложенные элементы по вертикали или горизонтали. Его особенностью является то, что все дочерние элементы отрисовываются сразу. Такой подход подходит только для небольших списков, где элементов немного, иначе производительность резко снижается.

### Пример использования ScrollView

Смотрите, я покажу вам, как работает `ScrollView`:

```jsx
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const SmallList = () => (
  <ScrollView>
    {/* Здесь мы отображаем статичные данные — подойдёт для коротких списков */}
    <Text>Элемент 1</Text>
    <Text>Элемент 2</Text>
    <Text>Элемент 3</Text>
    <Text>Элемент 4</Text>
    <Text>Элемент 5</Text>
  </ScrollView>
);

export default SmallList;
```
В данном примере все элементы списка показываются пользователю, и, если их число становится большим, прокрутка начинает работать медленно, так как память забивается отрисованными компонентами.

### Когда использовать ScrollView

ScrollView оправдан:
- если вам нужно отобразить 5–20 элементов;
- если список не изменяемый (например, шаги инструкции);
- когда требуется поддержка вложенного горизонтального и вертикального скроллов.

В остальных случаях лучше выбрать специальные компоненты — `FlatList` или `SectionList`.

## FlatList: базовый и самый популярный компонент списка

### Знакомство с FlatList

`FlatList` — основной инструмент для вывода массивов данных в React Native. В отличие от `ScrollView`, он отрисовывает только те элементы списка, которые сейчас видны на экране, а остальные генерируются по мере прокрутки.

Это не только ускоряет работу приложения с большими объемами данных, но и экономит память устройства.

### Структура и основные props FlatList

Чтобы использовать `FlatList`, нужны два обязательных props:
- `data` — массив данных, элементы которого нужно отобразить;
- `renderItem` — функция, возвращающая компонент для каждого элемента.

Давайте рассмотрим простой пример:

```jsx
import React from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';

const DATA = [
  { id: '1', title: 'Элемент списка 1' },
  { id: '2', title: 'Элемент списка 2' },
  { id: '3', title: 'Элемент списка 3' },
];

// renderItem получает объект с item (элемент данных)
const renderItem = ({ item }) => (
  <View style={styles.item}>
    <Text>{item.title}</Text>
  </View>
);

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ccc'
  }
});

const MyFlatList = () => (
  <FlatList
    data={DATA}              // Передаём массив данных
    renderItem={renderItem}  // Определяем, как рендерить элемент
    keyExtractor={item => item.id} // Ключ для каждого элемента
  />
);

export default MyFlatList;
```

Обратите внимание, что каждый элемент должен иметь уникальный `key`. Обычно для этого используется поле id. Это очень важно для производительности и правильной работы React Native.

### Более продвинутые возможности FlatList

#### Список с изображениями, кнопками, событиями

FlatList позволяет делать элементы интерактивными. Смотрите пример:

```jsx
import React from 'react';
import { FlatList, Text, TouchableOpacity, Image } from 'react-native';

const data = [
  { id: '1', title: 'Фото 1', image: require('./photo1.png') },
  { id: '2', title: 'Фото 2', image: require('./photo2.png') },
];

const renderItem = ({ item }) => (
  <TouchableOpacity onPress={() => alert(item.title)}>
    <Image source={item.image} style={{ width: 50, height: 50 }} />
    <Text>{item.title}</Text>
  </TouchableOpacity>
);

const ImageFlatList = () => (
  <FlatList
    data={data}
    renderItem={renderItem}
    keyExtractor={item => item.id}
  />
);

export default ImageFlatList;
```

Здесь каждый элемент становится кликабельным, к нему привязано изображение.

#### Добавление разделителей и заголовков

FlatList поддерживает специальные props:
- `ItemSeparatorComponent` — компонент-разделитель между элементами;
- `ListHeaderComponent` и `ListFooterComponent` — компоненты заголовка и подвала списка.

Вот пример с разделителем:

```jsx
const Separator = () => <View style={{ height: 1, backgroundColor: '#eee' }} />;

<FlatList
  data={DATA}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  ItemSeparatorComponent={Separator}
  ListHeaderComponent={<Text style={{ fontWeight: 'bold', fontSize: 18 }}>Заголовок</Text>}
  ListFooterComponent={<Text style={{ color: '#888' }}>Конец списка</Text>}
/>
```
Как видите, теперь список выглядит более структурированным.

#### Обновление списка: pull-to-refresh и infinite scroll

FlatList позволяет реагировать на жест "потянуть для обновления" (`onRefresh` и `refreshing`), а также загружать больше данных при прокрутке до конца (`onEndReached`).

Пример pull-to-refresh (обновления):

```jsx
const [refreshing, setRefreshing] = React.useState(false);

const onRefresh = React.useCallback(() => {
  setRefreshing(true);
  // Здесь вы можете загрузить новые данные
  setTimeout(() => {
    setRefreshing(false);
  }, 2000); // эмуляция запроса
}, []);

// FlatList с поддержкой обновления по свайпу
<FlatList
  data={DATA}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  refreshing={refreshing}
  onRefresh={onRefresh}
/>
```

А вот пример подгрузки данных при достижении низа списка:

```jsx
const [items, setItems] = React.useState(DATA);

const loadMore = () => {
  // Тут вы могли бы запросить еще данных с сервера
  const newItems = [
    { id: '4', title: 'Элемент списка 4' },
    { id: '5', title: 'Элемент списка 5' },
  ];
  setItems([...items, ...newItems]);
};

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```
Значение `onEndReachedThreshold=0.5` означает, что событие сработает, когда пользователь прокрутит до половины от конца списка.

#### Оптимизация FlatList: props для производительности

- `initialNumToRender` — сколько элементов нарисовать при первом показе списка.
- `maxToRenderPerBatch` — сколько элементов обновлять одновременно.
- `windowSize` — количество экранов, которые отображают элементы вперед и назад от текущего окна просмотра.

Эти настройки позволяют управлять потреблением памяти и скоростью отклика при работе со списком.

```jsx
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  initialNumToRender={10} // Сразу рендерим 10 элементов
  maxToRenderPerBatch={5} // далее рендерим партиями по 5
  windowSize={7}          // охватываем 7 экранов вперед-назад
/>
```

## SectionList: работа с группированными данными

### Когда нужен SectionList

Если ваши данные сгруппированы по категориям или разделам (например, товары по категориям, сообщения по датам), используйте `SectionList`. Он отображает список с разделами и подзаголовками.

### Пример структуры данных для SectionList

```jsx
const SECTIONS = [
  {
    title: 'Фрукты',
    data: ['Яблоко', 'Банан', 'Апельсин'],
  },
  {
    title: 'Овощи',
    data: ['Огурец', 'Помидор', 'Морковь'],
  },
];
```

### Как реализовать SectionList

Смотрите, вот пример на практике:

```jsx
import React from 'react';
import { SectionList, Text, View, StyleSheet } from 'react-native';

const SECTIONS = [
  {
    title: 'Фрукты',
    data: ['Яблоко', 'Банан', 'Апельсин'],
  },
  {
    title: 'Овощи',
    data: ['Огурец', 'Помидор', 'Морковь'],
  },
];

const MySectionList = () => (
  <SectionList
    sections={SECTIONS} // Передаем массив секций
    keyExtractor={(item, index) => item + index}
    renderItem={({ item }) => (
      <View style={styles.item}>
        <Text>{item}</Text>
      </View>
    )}
    renderSectionHeader={({ section: { title } }) => (
      <Text style={styles.header}>{title}</Text>
    )}
    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#ccc' }} />}
  />
);

const styles = StyleSheet.create({
  item: { padding: 16, backgroundColor: '#fff' },
  header: { padding: 16, backgroundColor: '#eee', fontWeight: 'bold' },
});

export default MySectionList;
```
Как видите, с помощью SectionList легко выводить данные с подзаголовками.

### Дополнительные возможности SectionList

- **ListHeaderComponent, ListFooterComponent** — заголовок и подвал всего списка.
- **SectionSeparatorComponent** — компонент-разделитель между секциями.
- **stickySectionHeadersEnabled** — закреплять заголовки секций сверху (по умолчанию true для iOS).

SectionList также поддерживает оптимизации, похожие на FlatList (initialNumToRender, onEndReached и другие).

## Кастомизация элементов списка

Элементы списка могут быть любыми: с изображениями, кнопками, вложенными компонентами, swipe-экшенами и т. д.

### Пример: Как вывести список с кастомным элементом и кнопкой

```jsx
const renderItem = ({ item }) => (
  <View style={styles.itemRow}>
    <Text style={styles.itemText}>{item.title}</Text>
    <TouchableOpacity
      style={styles.button}
      onPress={() => alert(`Удалить ${item.title}`)}
    >
      <Text style={styles.buttonText}>Удалить</Text>
    </TouchableOpacity>
  </View>
);

// Добавьте соответствующие стили
const styles = StyleSheet.create({
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  itemText: { fontSize: 16 },
  button: { backgroundColor: 'red', padding: 8, borderRadius: 4 },
  buttonText: { color: '#fff' },
});
```

Такой компонент можно передавать в renderItem для FlatList или SectionList.

## Получение доступа к данным: работа с API и асинхронная загрузка

Обычно данные для списков приходят из API. В React Native данные загружают асинхронно с помощью useEffect и fetch/Axios.

Вот пример того, как это делается:

```jsx
import React, { useEffect, useState } from 'react';
import { FlatList, Text } from 'react-native';

const APISample = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/posts')
      .then(response => response.json())
      .then(json => setData(json))
      .finally(() => setLoading(false));
  }, []);

  // loading используется для отображения лоадера, например ActivityIndicator

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <Text>{item.title}</Text>}
      keyExtractor={item => item.id.toString()}
      refreshing={loading}
    />
  );
};

export default APISample;
```

Здесь вы видите, что FlatList обновляется при смене состояния данных, что удобно для обработки асинхронных загрузок.

## Особенности рендеринга и оптимизации больших списков

Когда вы работаете с большими списками (сотни и тысячи элементов), не забывайте о правильном управлении памятью и оптимизации скорости:

- Используйте правильные ключи (`keyExtractor`) для каждого элемента;
- Не храните сложные объекты (например, функции или компоненты) в data;
- Старайтесь избегать анонимных функций внутри renderItem (кэшируйте их с помощью useCallback);
- Используйте пропы оптимизации (initialNumToRender, maxToRenderPerBatch, windowSize);
- Используйте чистые компоненты (React.memo) для элементов списка, если элементы сложные.

Эти советы помогут избежать лишних перерисовок и сделать прокрутку максимально плавной.

## Заключение

React Native предоставляет несколько мощных инструментов для вывода списков данных: ScrollView, FlatList, SectionList. Для небольших статичных списков подойдет ScrollView, для большинства задач рекомендуется FlatList, а для сложных группированных данных — SectionList. Разобравшись с настройками производительности, кастомизацией элементов и поддержкой асинхронной загрузки, вы сможете строить любые списки без потери отзывчивости и скорости.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как реализовать swipe для удаления элемента в FlatList?

Используйте стороннюю библиотеку, например `react-native-gesture-handler` и компонент `Swipeable`. Импортируйте Swipeable и оберните им ваш renderItem:

```jsx
import { Swipeable } from 'react-native-gesture-handler';

// Внутри renderItem:
<Swipeable renderRightActions={renderDeleteButton}>
  {/* Ваш элемент списка */}
</Swipeable>
```
В renderDeleteButton возвращайте компонент кнопки для удаления. Не забудьте установить и связать gesture-handler.

### Почему FlatList не обновляет список при изменении данных?

FlatList по умолчанию сравнивает старый и новый массив по ссылке. Если вы обновляете массив, создайте новый массив (например, с помощью spread-оператора `[...oldArray, newItem]`). Только так FlatList обнаружит изменения и перерендерит элементы.

### Как прокрутить FlatList к определенному элементу?

Используйте ref и метод `scrollToIndex`:

```jsx
const flatListRef = useRef();
<FlatList ref={flatListRef} ... />
// Позже:
flatListRef.current.scrollToIndex({ index: нужныйИндекс });
```
Не забудьте обработать ошибку если индекс выходит за границы массива.

### Можно ли сделать горизонтальный список с FlatList?

Да, используйте проп `horizontal={true}`:

```jsx
<FlatList
  data={data}
  renderItem={renderItem}
  horizontal={true}
/>
```
Есть все те же props, что и для вертикального списка.

### Как повысить производительность FlatList при работе с изображениями?

Используйте библиотеку `react-native-fast-image` для более эффективной загрузки и кеширования изображений. Также старайтесь ограничить размеры изображений до реально используемого размера, чтобы ускорить рендеринг и уменьшить трафик.

---