# Hierarchical Brand Filters Bugfix Design

## Overview

Иерархические фильтры брендов с подгруппами не отображаются в каталоге товаров, несмотря на полную реализацию backend (HierarchicalFilterService.cs, FilterCacheService.cs) и frontend (catalog.js, hierarchical-filters.css). Проблема заключается в том, что API endpoint `/api/products/filters` не возвращает поле `subgroups` в ответе, либо frontend некорректно обрабатывает эти данные при рендеринге.

Стратегия исправления: проверить цепочку данных от базы данных через API до DOM, выявить точку разрыва и восстановить передачу данных о подгруппах.

## Glossary

- **Bug_Condition (C)**: Условие, при котором баг проявляется - когда пользователь открывает фильтры брендов, но подгруппы не отображаются или не раскрываются
- **Property (P)**: Желаемое поведение - подгруппы брендов должны отображаться с кнопками переключения (▼) и раскрываться при клике
- **Preservation**: Существующая функциональность фильтров (категории, цена, другие атрибуты) должна остаться неизменной
- **HierarchicalFilterService**: Сервис в `Services/HierarchicalFilterService.cs`, который группирует бренды по подкатегориям товаров
- **FilterCacheService**: Сервис в `Services/FilterCacheService.cs`, который кэширует фильтры и применяет иерархическую группировку для брендов
- **toggleSubgroups()**: Метод в `wwwroot/js/pages/catalog.js`, который переключает видимость подгрупп при клике на кнопку
- **AttributeValueDto**: DTO-класс, содержащий поле `Subgroups` типа `List<AttributeSubgroupDto>`
- **Subgroups**: Массив подгрупп внутри бренда (например, "Дрели и шуруповерты", "Болгарки (УШМ)")

## Bug Details

### Bug Condition

Баг проявляется когда пользователь открывает каталог товаров и нажимает кнопку "Фильтры". В секции "Бренд" не отображаются кнопки переключения (▼) для брендов с подгруппами, либо кнопки есть, но подгруппы не раскрываются при клике.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserInteraction
  OUTPUT: boolean
  
  RETURN input.action == "open_filters" 
         AND input.section == "Бренд"
         AND (NOT hasToggleButtons(input.brandElements) 
              OR NOT subgroupsExpandOnClick(input.brandElements))
END FUNCTION
```

### Examples

- **Пример 1**: Пользователь открывает фильтры → видит бренд "BOSCH (45)" → нет кнопки (▼) рядом с брендом → ожидалось: кнопка (▼) присутствует
- **Пример 2**: Пользователь открывает фильтры → видит бренд "Makita (38)" с кнопкой (▼) → нажимает на кнопку → подгруппы не раскрываются → ожидалось: подгруппы "Дрели и шуруповерты (12)", "Болгарки (УШМ) (8)" и т.д. становятся видимыми
- **Пример 3**: API возвращает `{ "value": "BOSCH", "count": 45, "subgroups": null }` → frontend не рендерит кнопку переключения → ожидалось: `subgroups` содержит массив подгрупп
- **Edge case**: Бренд с менее чем 5 товарами не должен отображаться в фильтрах (согласно `minProductsForBrand: 5` в FilterCacheService)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Фильтрация по категориям должна продолжать работать точно так же
- Фильтрация по цене (min/max) должна продолжать работать точно так же
- Фильтрация по наличию (в наличии/нет) должна продолжать работать точно так же
- Фильтрация по другим атрибутам (не "Бренд") должна продолжать работать точно так же
- Кнопка "Сбросить фильтры" должна очищать все фильтры включая подгруппы
- Кэширование фильтров (5 минут) должно продолжать работать

**Scope:**
Все взаимодействия, которые НЕ связаны с фильтром "Бренд" и его подгруппами, должны быть полностью не затронуты этим исправлением. Это включает:
- Выбор категории из выпадающего списка
- Ввод минимальной/максимальной цены
- Переключение чекбокса "В наличии"
- Выбор других атрибутов (если они есть)
- Сортировка товаров
- Пагинация товаров

## Hypothesized Root Cause

На основе анализа кода, наиболее вероятные причины:

1. **FilterCacheService не вызывает HierarchicalFilterService**: Метод `ApplyHierarchicalBrandGrouping()` в FilterCacheService.cs может не вызываться или вызываться с неправильными параметрами, из-за чего поле `Subgroups` остается пустым.

2. **API не сериализует поле Subgroups**: DTO-класс `AttributeValueDto` содержит поле `Subgroups`, но при сериализации в JSON это поле может быть пропущено из-за настроек JsonSerializer или из-за того, что оно равно `null`.

3. **Frontend не проверяет наличие subgroups**: В методе `loadFilters()` в catalog.js проверка `valueObj.subgroups && valueObj.subgroups.length > 0` может не срабатывать, если API возвращает `subgroups: null` вместо пустого массива.

4. **CSS не применяется**: Файл `hierarchical-filters.css` подключен в index.html, но стили могут не применяться из-за специфичности селекторов или конфликта с другими стилями.

5. **Метод toggleSubgroups() не привязан к событию**: Атрибут `onclick="app.toggleSubgroups(event, '${val}')"` может не работать из-за экранирования кавычек или из-за того, что метод вызывается до полной инициализации DOM.

## Correctness Properties

Property 1: Bug Condition - Hierarchical Brand Filters Display

_For any_ API response from `/api/products/filters` where the "Бренд" attribute contains brands with at least 5 products, the fixed system SHALL return `subgroups` array for each brand, and the frontend SHALL render toggle buttons (▼) next to brands with subgroups, allowing users to expand and collapse subgroup lists.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Non-Brand Filter Behavior

_For any_ filter interaction that does NOT involve the "Бренд" attribute (category selection, price range, stock availability, other attributes), the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing filtering functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `Services/FilterCacheService.cs`

**Function**: `ApplyHierarchicalBrandGrouping`

**Specific Changes**:
1. **Verify HierarchicalFilterService is called**: Убедиться, что метод `_hierarchicalService.GetAllBrandsWithSubgroups()` вызывается и возвращает данные с подгруппами.
   - Добавить логирование: `_logger.LogInformation($"[CACHE] Brands with subgroups: {hierarchicalBrands.Count}")`
   - Проверить, что `minProductsForBrand: 5` и `minProductsForSubgroup: 3` передаются корректно

2. **Ensure Subgroups are not null**: Убедиться, что поле `Subgroups` в `AttributeValueDto` инициализируется как пустой список, а не `null`.
   - В методе `ConvertToAttributeFilter()` в HierarchicalFilterService.cs проверить, что `Subgroups` всегда инициализируется

3. **Add fallback for empty subgroups**: Если у бренда нет подгрупп (менее 3 товаров в каждой подкатегории), не добавлять поле `Subgroups` или установить его в пустой массив.

**File**: `Controllers/ProductsController.cs`

**Function**: `GetProductFilters`

**Specific Changes**:
1. **Verify JSON serialization**: Убедиться, что поле `Subgroups` сериализуется в JSON ответе.
   - Проверить настройки `JsonSerializerOptions` в Program.cs: `ReferenceHandler = ReferenceHandler.IgnoreCycles`
   - Добавить логирование перед возвратом: `Console.WriteLine($"[API] Returning filters with {filters.Attributes.Count} attributes")`

2. **Add explicit null handling**: Если `Subgroups` равно `null`, установить его в пустой массив перед сериализацией.

**File**: `wwwroot/js/pages/catalog.js`

**Function**: `loadFilters`

**Specific Changes**:
1. **Fix subgroups check**: Изменить проверку `valueObj.subgroups && valueObj.subgroups.length > 0` на более надежную.
   - Добавить проверку типа: `Array.isArray(valueObj.subgroups) && valueObj.subgroups.length > 0`
   - Добавить логирование: `console.log('[FILTERS] Subgroups for', val, ':', valueObj.subgroups)`

2. **Fix event handler binding**: Убедиться, что `onclick="app.toggleSubgroups(event, '${val}')"` корректно экранирует кавычки в названии бренда.
   - Использовать `data-brand="${val}"` вместо передачи параметра в onclick
   - Привязать обработчик через `addEventListener` после рендеринга

3. **Fix ID generation**: Убедиться, что ID `subgroups-${val.replace(/\s+/g, '-')}` генерируется корректно для брендов с пробелами и специальными символами.
   - Использовать более надежное экранирование: `val.replace(/[^a-zA-Z0-9]/g, '-')`

4. **Add CSS class for visibility**: Вместо inline стиля `style="display: none;"` использовать CSS класс для управления видимостью.
   - Добавить класс `hidden` в CSS: `.hidden { display: none; }`
   - Использовать `classList.toggle('hidden')` в методе `toggleSubgroups()`

**File**: `wwwroot/css/components/hierarchical-filters.css`

**Function**: N/A (CSS file)

**Specific Changes**:
1. **Verify styles are applied**: Проверить, что селекторы `.attribute-checkbox.has-subgroups` и `.subgroup-toggle` применяются к элементам.
   - Добавить более специфичные селекторы если нужно: `#attributes-filters .attribute-checkbox.has-subgroups`

2. **Add transition for smooth expand/collapse**: Улучшить анимацию раскрытия подгрупп.
   - Использовать `max-height` transition вместо `display: none/block`

## Testing Strategy

### Validation Approach

Стратегия тестирования следует двухфазному подходу: сначала выявить контрпримеры, демонстрирующие баг на неисправленном коде, затем проверить, что исправление работает корректно и сохраняет существующее поведение.

### Exploratory Bug Condition Checking

**Goal**: Выявить контрпримеры, демонстрирующие баг ДО внесения исправлений. Подтвердить или опровергнуть анализ первопричины. Если опровергнем, потребуется пересмотреть гипотезу.

**Test Plan**: Написать тесты, которые проверяют API endpoint `/api/products/filters` и рендеринг frontend. Запустить эти тесты на НЕИСПРАВЛЕННОМ коде, чтобы наблюдать сбои и понять первопричину.

**Test Cases**:
1. **API Response Test**: Вызвать `/api/products/filters` и проверить, что поле `subgroups` присутствует в ответе для брендов с ≥5 товарами (будет сбой на неисправленном коде)
2. **Frontend Rendering Test**: Проверить, что элементы с классом `.has-subgroups` и `.subgroup-toggle` присутствуют в DOM после загрузки фильтров (будет сбой на неисправленном коде)
3. **Toggle Functionality Test**: Симулировать клик на кнопку переключения и проверить, что подгруппы становятся видимыми (будет сбой на неисправленном коде)
4. **Edge Case Test**: Проверить, что бренды с <5 товарами не отображаются в фильтрах (может сбой на неисправленном коде)

**Expected Counterexamples**:
- API возвращает `subgroups: null` или поле отсутствует
- DOM не содержит элементы `.subgroup-toggle`
- Клик на кнопку переключения не изменяет `display` стиль подгрупп
- Возможные причины: FilterCacheService не вызывает HierarchicalFilterService, JSON сериализация пропускает поле, frontend не рендерит элементы

### Fix Checking

**Goal**: Проверить, что для всех входных данных, где выполняется условие бага, исправленная функция производит ожидаемое поведение.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := getProductFilters_fixed()
  ASSERT result.attributes["Бренд"].values.some(v => v.subgroups != null && v.subgroups.length > 0)
  
  dom := renderFilters_fixed(result)
  ASSERT dom.querySelectorAll('.has-subgroups').length > 0
  ASSERT dom.querySelectorAll('.subgroup-toggle').length > 0
  
  toggleButton := dom.querySelector('.subgroup-toggle')
  toggleButton.click()
  ASSERT subgroupsDiv.style.display == 'block'
END FOR
```

### Preservation Checking

**Goal**: Проверить, что для всех входных данных, где условие бага НЕ выполняется, исправленная функция производит тот же результат, что и оригинальная функция.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT getProductFilters_original(input) == getProductFilters_fixed(input)
  ASSERT renderFilters_original(input) == renderFilters_fixed(input)
  ASSERT applyFilters_original(input) == applyFilters_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing рекомендуется для проверки сохранения поведения, потому что:
- Автоматически генерирует множество тестовых случаев по всему входному домену
- Выявляет граничные случаи, которые могут быть пропущены в ручных unit-тестах
- Предоставляет строгие гарантии, что поведение не изменилось для всех не-багованных входных данных

**Test Plan**: Наблюдать поведение на НЕИСПРАВЛЕННОМ коде сначала для фильтров категорий, цены, других атрибутов, затем написать property-based тесты, фиксирующие это поведение.

**Test Cases**:
1. **Category Filter Preservation**: Наблюдать, что фильтрация по категориям работает корректно на неисправленном коде, затем написать тест для проверки, что это продолжает работать после исправления
2. **Price Filter Preservation**: Наблюдать, что фильтрация по цене работает корректно на неисправленном коде, затем написать тест для проверки, что это продолжает работать после исправления
3. **Other Attributes Preservation**: Наблюдать, что фильтрация по другим атрибутам (не "Бренд") работает корректно на неисправленном коде, затем написать тест для проверки, что это продолжает работать после исправления
4. **Reset Filters Preservation**: Наблюдать, что кнопка "Сбросить" очищает все фильтры на неисправленном коде, затем написать тест для проверки, что это продолжает работать после исправления

### Unit Tests

- Тест API endpoint `/api/products/filters` для проверки наличия поля `subgroups` в ответе
- Тест метода `ApplyHierarchicalBrandGrouping()` для проверки, что он возвращает бренды с подгруппами
- Тест метода `toggleSubgroups()` для проверки переключения видимости подгрупп
- Тест граничных случаев (бренды с <5 товарами, подгруппы с <3 товарами)

### Property-Based Tests

- Генерировать случайные наборы товаров с разными брендами и проверять, что фильтры корректно группируют их в подгруппы
- Генерировать случайные комбинации фильтров (категория + цена + бренд) и проверять, что результаты фильтрации корректны
- Тестировать, что все не-брендовые фильтры продолжают работать одинаково до и после исправления

### Integration Tests

- Тест полного потока: загрузка каталога → открытие фильтров → раскрытие подгрупп бренда → выбор подгруппы → проверка фильтрации товаров
- Тест переключения между категориями и проверка, что фильтры брендов обновляются корректно
- Тест кэширования: проверить, что фильтры кэшируются на 5 минут и перезагружаются после истечения срока
