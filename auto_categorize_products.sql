-- Автоматическая категоризация товаров по ключевым словам
-- Этот скрипт анализирует названия товаров и распределяет их по категориям

USE ToolShopDB;
GO

-- Шаг 1: Создаем категории на основе ключевых слов
PRINT 'Создание категорий...';

-- Электроинструменты
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Электроинструменты')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Электроинструменты');
    PRINT 'Создана категория: Электроинструменты';
END

-- Ручной инструмент
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Ручной инструмент')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Ручной инструмент');
    PRINT 'Создана категория: Ручной инструмент';
END

-- Крепеж
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Крепеж')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Крепеж');
    PRINT 'Создана категория: Крепеж';
END

-- Сверла и буры
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Сверла и буры')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Сверла и буры');
    PRINT 'Создана категория: Сверла и буры';
END

-- Диски и насадки
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Диски и насадки')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Диски и насадки');
    PRINT 'Создана категория: Диски и насадки';
END

-- Измерительный инструмент
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Измерительный инструмент')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Измерительный инструмент');
    PRINT 'Создана категория: Измерительный инструмент';
END

-- Компрессоры и пневмоинструмент
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Компрессоры и пневмоинструмент')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Компрессоры и пневмоинструмент');
    PRINT 'Создана категория: Компрессоры и пневмоинструмент';
END

-- Сварочное оборудование
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Сварочное оборудование')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Сварочное оборудование');
    PRINT 'Создана категория: Сварочное оборудование';
END

-- Садовый инструмент
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Садовый инструмент')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Садовый инструмент');
    PRINT 'Создана категория: Садовый инструмент';
END

-- Расходные материалы
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Расходные материалы')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Расходные материалы');
    PRINT 'Создана категория: Расходные материалы';
END

-- Хранение и организация
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Хранение и организация')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Хранение и организация');
    PRINT 'Создана категория: Хранение и организация';
END

-- Наборы инструментов
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Наборы инструментов')
BEGIN
    INSERT INTO Categories (Name) 
    VALUES ('Наборы инструментов');
    PRINT 'Создана категория: Наборы инструментов';
END

PRINT '';
PRINT 'Категории созданы. Начинаем распределение товаров...';
PRINT '';

-- Шаг 2: Распределяем товары по категориям на основе ключевых слов

DECLARE @CategoryId INT;
DECLARE @UpdatedCount INT = 0;

-- Электроинструменты
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Электроинструменты';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%дрель%' OR Name LIKE '%шуруповерт%' OR Name LIKE '%перфоратор%' 
    OR Name LIKE '%болгарка%' OR Name LIKE '%УШМ%' OR Name LIKE '%лобзик%'
    OR Name LIKE '%рубанок%' OR Name LIKE '%фрезер%' OR Name LIKE '%гайковерт%'
    OR Name LIKE '%миксер%' OR Name LIKE '%штроборез%' OR Name LIKE '%пила%'
    OR Name LIKE '%электро%' OR Name LIKE '%аккумулятор%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Электроинструменты: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Ручной инструмент
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Ручной инструмент';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%отвертка%' OR Name LIKE '%ключ%' OR Name LIKE '%молоток%'
    OR Name LIKE '%пассатижи%' OR Name LIKE '%плоскогубцы%' OR Name LIKE '%кусачки%'
    OR Name LIKE '%зубило%' OR Name LIKE '%стамеска%' OR Name LIKE '%напильник%'
    OR Name LIKE '%ножовка%' OR Name LIKE '%топор%' OR Name LIKE '%клещи%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Ручной инструмент: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Крепеж
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Крепеж';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%шуруп%' OR Name LIKE '%саморез%' OR Name LIKE '%болт%'
    OR Name LIKE '%гайка%' OR Name LIKE '%винт%' OR Name LIKE '%дюбель%'
    OR Name LIKE '%анкер%' OR Name LIKE '%заклепк%' OR Name LIKE '%шайба%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Крепеж: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Сверла и буры
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Сверла и буры';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%сверло%' OR Name LIKE '%бур%' OR Name LIKE '%коронка%'
    OR Name LIKE '%зенкер%' OR Name LIKE '%метчик%' OR Name LIKE '%развертка%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Сверла и буры: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Диски и насадки
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Диски и насадки';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%диск%' OR Name LIKE '%круг%' OR Name LIKE '%бита%'
    OR Name LIKE '%насадка%' OR Name LIKE '%фреза%' OR Name LIKE '%пильный%'
    OR Name LIKE '%отрезной%' OR Name LIKE '%шлифовальный%' OR Name LIKE '%абразив%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Диски и насадки: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Измерительный инструмент
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Измерительный инструмент';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%рулетка%' OR Name LIKE '%уровень%' OR Name LIKE '%штангенциркуль%'
    OR Name LIKE '%угольник%' OR Name LIKE '%линейка%' OR Name LIKE '%лазер%'
    OR Name LIKE '%дальномер%' OR Name LIKE '%нивелир%' OR Name LIKE '%измерител%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Измерительный инструмент: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Компрессоры и пневмоинструмент
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Компрессоры и пневмоинструмент';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%компрессор%' OR Name LIKE '%пневмо%' OR Name LIKE '%краскопульт%'
    OR Name LIKE '%пистолет%' OR Name LIKE '%шланг%' OR Name LIKE '%воздушн%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Компрессоры и пневмоинструмент: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Сварочное оборудование
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Сварочное оборудование';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%сварочн%' OR Name LIKE '%сварка%' OR Name LIKE '%электрод%'
    OR Name LIKE '%инвертор%' OR Name LIKE '%маска%' OR Name LIKE '%горелка%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Сварочное оборудование: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Садовый инструмент
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Садовый инструмент';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%газонокосилка%' OR Name LIKE '%триммер%' OR Name LIKE '%секатор%'
    OR Name LIKE '%лопата%' OR Name LIKE '%грабли%' OR Name LIKE '%садов%'
    OR Name LIKE '%мотокоса%' OR Name LIKE '%культиватор%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Садовый инструмент: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Хранение и организация
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Хранение и организация';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%ящик%' OR Name LIKE '%кейс%' OR Name LIKE '%органайзер%'
    OR Name LIKE '%чемодан%' OR Name LIKE '%бокс%' OR Name LIKE '%контейнер%'
    OR Name LIKE '%сумка%' OR Name LIKE '%стеллаж%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Хранение и организация: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Наборы инструментов
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Наборы инструментов';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL 
AND (
    Name LIKE '%набор%' OR Name LIKE '%комплект%' OR Name LIKE '%предмет%'
);
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Наборы инструментов: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

-- Расходные материалы (все остальное)
SELECT @CategoryId = Id FROM Categories WHERE Name = 'Расходные материалы';
UPDATE Products 
SET CategoryId = @CategoryId 
WHERE CategoryId IS NULL;
SET @UpdatedCount = @@ROWCOUNT;
PRINT 'Расходные материалы: ' + CAST(@UpdatedCount AS VARCHAR) + ' товаров';

PRINT '';
PRINT '=== ИТОГИ ===';

-- Показываем статистику
SELECT 
    c.Name AS 'Категория',
    COUNT(p.Id) AS 'Количество товаров'
FROM Categories c
LEFT JOIN Products p ON c.Id = p.CategoryId
GROUP BY c.Name
ORDER BY COUNT(p.Id) DESC;

PRINT '';
PRINT 'Автоматическая категоризация завершена!';
PRINT '';
PRINT 'Создание индексов для оптимизации...';

-- Индекс для быстрой фильтрации по категориям
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_CategoryId_Stock' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Products_CategoryId_Stock
    ON Products(CategoryId, Stock)
    INCLUDE (Id, Article, Name, Price, ImageUrl);
    PRINT 'Создан индекс: IX_Products_CategoryId_Stock';
END
ELSE
BEGIN
    PRINT 'Индекс IX_Products_CategoryId_Stock уже существует';
END

-- Индекс для поиска по названию и артикулу
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_Name_Article' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Products_Name_Article
    ON Products(Name, Article)
    INCLUDE (CategoryId, Price, Stock);
    PRINT 'Создан индекс: IX_Products_Name_Article';
END
ELSE
BEGIN
    PRINT 'Индекс IX_Products_Name_Article уже существует';
END

-- Индекс для сортировки по цене
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_CategoryId_Price' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Products_CategoryId_Price
    ON Products(CategoryId, Price)
    INCLUDE (Id, Article, Name, Stock);
    PRINT 'Создан индекс: IX_Products_CategoryId_Price';
END
ELSE
BEGIN
    PRINT 'Индекс IX_Products_CategoryId_Price уже существует';
END

PRINT '';
PRINT '=== ОПТИМИЗАЦИЯ ЗАВЕРШЕНА ===';
PRINT 'Индексы созданы для быстрой загрузки товаров по категориям';
PRINT 'Рекомендуется перезапустить приложение для применения изменений';
