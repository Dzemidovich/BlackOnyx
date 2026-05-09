# Диагностика проблемы поиска - Пошаговая инструкция

## Проблема
Поиск находит товары только на текущей странице (~50 товаров), а не по всем 200+ страницам (~10,000 товаров).

## Шаг 1: Проверьте порт сервера

1. Откройте файл `Properties/launchSettings.json`
2. Найдите строку с `applicationUrl` - там указан порт вашего сервера
3. Обычно это `http://localhost:5000` или `http://localhost:5001` или другой порт

**Запомните этот порт!** Он понадобится для следующих шагов.

---

## Шаг 2: Перезапустите сервер

**ВАЖНО:** После изменений в C# коде (Controllers/ProductsController.cs) ОБЯЗАТЕЛЬНО нужно перезапустить сервер!

1. Остановите сервер (Ctrl+C в терминале или Stop в Visual Studio)
2. Запустите снова: `dotnet run` или F5 в Visual Studio
3. Дождитесь сообщения "Now listening on: http://localhost:XXXX"

---

## Шаг 3: Очистите кэш браузера

**ВАЖНО:** После изменений в JavaScript (wwwroot/js/modules/products.js) ОБЯЗАТЕЛЬНО нужно очистить кэш!

### Способ 1: Жесткая перезагрузка (рекомендуется)
1. Откройте ваше приложение в браузере
2. Нажмите **Ctrl + Shift + R** (или Ctrl + F5)
3. Это перезагрузит страницу БЕЗ кэша

### Способ 2: Очистка через DevTools
1. Откройте DevTools (F12)
2. Кликните правой кнопкой на кнопку обновления (⟳)
3. Выберите "Очистить кэш и жесткая перезагрузка"

---

## Шаг 4: Проверьте, что изменения применились

### 4.1 Откройте DevTools (F12)
### 4.2 Перейдите на вкладку **Network** (Сеть)
### 4.3 Введите что-то в строку поиска (например, "дрель")
### 4.4 Посмотрите на запрос к API

В списке запросов найдите запрос типа:
```
GET /api/products?search=дрель&page=1&pageSize=XXXXX
```

**Проверьте значение pageSize:**

✅ **ПРАВИЛЬНО:** `pageSize=999999` - изменения применились
❌ **НЕПРАВИЛЬНО:** `pageSize=40` или `pageSize=50` - изменения НЕ применились

---

## Шаг 5: Если pageSize=999999, но товары все равно не находятся

Это значит проблема в контроллере. Проверьте:

### 5.1 Откройте вкладку **Response** для этого запроса
### 5.2 Посмотрите сколько товаров вернулось

Если вернулось мало товаров (например, 50), проверьте:

1. **Заголовки ответа** (Response Headers):
   - `X-Total-Count` - общее количество найденных товаров
   - `X-Page-Size` - размер страницы
   - `X-Total-Pages` - общее количество страниц

2. Если `X-Total-Count` большое (например, 500), но товаров вернулось мало - проблема в пагинации контроллера

---

## Шаг 6: Тест API напрямую

Создайте файл `test_search.html` в папке `wwwroot`:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Search</title>
</head>
<body>
    <h1>Test Search API</h1>
    <input type="text" id="search" placeholder="Enter search term" />
    <button onclick="testSearch()">Search</button>
    <div id="results"></div>
    
    <script>
        async function testSearch() {
            const query = document.getElementById('search').value;
            const resultsDiv = document.getElementById('results');
            
            // ЗАМЕНИТЕ 5000 НА ВАШ ПОРТ!
            const url = `http://localhost:5000/api/products?search=${query}&page=1&pageSize=999999`;
            
            resultsDiv.innerHTML = '<p>Loading...</p>';
            
            try {
                const response = await fetch(url);
                const products = await response.json();
                
                const totalCount = response.headers.get('X-Total-Count');
                
                resultsDiv.innerHTML = `
                    <h2>Results:</h2>
                    <p><strong>Products returned:</strong> ${products.length}</p>
                    <p><strong>Total count (X-Total-Count):</strong> ${totalCount || 'not set'}</p>
                    <hr>
                    <h3>First 10 products:</h3>
                    ${products.slice(0, 10).map(p => `
                        <div style="border: 1px solid #ccc; padding: 10px; margin: 5px;">
                            <strong>${p.name}</strong><br>
                            Article: ${p.article}<br>
                            Price: ${p.price} BYN
                        </div>
                    `).join('')}
                `;
            } catch (error) {
                resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        }
    </script>
</body>
</html>
```

**Откройте:** `http://localhost:ВАШІ_ПОРТ/test_search.html`

---

## Шаг 7: Возможные проблемы и решения

### Проблема 1: pageSize остается 40/50
**Причина:** Кэш браузера не очищен
**Решение:** Повторите Шаг 3 (Ctrl + Shift + R)

### Проблема 2: Сервер не видит изменения в контроллере
**Причина:** Сервер не перезапущен
**Решение:** Повторите Шаг 2 (перезапустите сервер)

### Проблема 3: Товары не находятся даже с pageSize=999999
**Причина:** Регистр букв или кодировка
**Решение:** Проверьте, что в контроллере используется `.ToLower()` для поиска

### Проблема 4: Тестовая страница не открывается
**Причина:** Неправильный порт или CSP блокирует
**Решение:** 
1. Проверьте порт в URL
2. Откройте DevTools → Console и посмотрите ошибки

---

## Шаг 8: Проверка кода

### Проверьте Controllers/ProductsController.cs (строки 167-171):

```csharp
// Должно быть так:
var lowerSearchTerm = searchTerm.ToLower();
query = query.Where(p =>
    p.Name.ToLower().Contains(lowerSearchTerm) ||
    p.Article.ToLower().Contains(lowerSearchTerm) ||
    (p.Description != null && p.Description.ToLower().Contains(lowerSearchTerm)));
```

### Проверьте wwwroot/js/modules/products.js (строки 183-192):

```javascript
// Должно быть так:
if (search) {
    // При поиске показываем ВСЕ результаты без ограничений
    params.append('page', 1);
    params.append('pageSize', 999999); // Очень большое число для показа всех результатов
} else {
    // Обычная пагинация без поиска
    params.append('page', this.currentProductPage);
    params.append('pageSize', this.productsPerPage);
}
```

---

## Что делать дальше?

1. **Выполните все шаги по порядку**
2. **На каком шаге возникла проблема?** - напишите мне номер шага
3. **Что показывает Network tab?** - скопируйте URL запроса и значение pageSize
4. **Сколько товаров вернулось?** - посмотрите в Response

Это поможет точно определить, где проблема!
