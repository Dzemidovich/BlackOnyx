-- =====================================================
-- БАЗА ДАННЫХ ДЛЯ КУРСОВОГО ПРОЕКТА
-- Каталог строительных материалов
-- Соответствует 3НФ, минимальное количество таблиц
-- =====================================================

USE master;
GO

-- Удаляем БД если существует
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'BuildingMaterialsDB')
BEGIN
    ALTER DATABASE BuildingMaterialsDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE BuildingMaterialsDB;
END
GO

-- Создаем БД
CREATE DATABASE BuildingMaterialsDB;
GO

USE BuildingMaterialsDB;
GO

PRINT '========================================';
PRINT 'Создание таблиц';
PRINT '========================================';

-- =====================================================
-- 1. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ (Users)
-- Для входа администратора и обычных пользователей
-- =====================================================
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'User', -- 'Admin' или 'User'
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

PRINT '✓ Таблица Users создана';

-- =====================================================
-- 2. ТАБЛИЦА КАТЕГОРИЙ (Categories)
-- Группы строительных материалов
-- =====================================================
CREATE TABLE Categories (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    ParentId INT NULL, -- Для иерархии категорий
    FOREIGN KEY (ParentId) REFERENCES Categories(Id)
);

PRINT '✓ Таблица Categories создана';

-- =====================================================
-- 3. ТАБЛИЦА МАТЕРИАЛОВ (Materials)
-- Основная таблица со всеми материалами
-- Включает все основные характеристики
-- =====================================================
CREATE TABLE Materials (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Article NVARCHAR(50) NOT NULL UNIQUE, -- Артикул
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(2000), -- Краткая справка
    CategoryId INT NOT NULL,
    
    -- Основные характеристики (общие для всех)
    Price DECIMAL(18,2) NOT NULL,
    Unit NVARCHAR(20) NOT NULL DEFAULT 'шт', -- Единица измерения
    Stock INT NOT NULL DEFAULT 0, -- Остаток
    Manufacturer NVARCHAR(100), -- Производитель
    
    -- Физические характеристики
    Weight DECIMAL(10,2), -- Вес (кг)
    Length DECIMAL(10,2), -- Длина (мм)
    Width DECIMAL(10,2), -- Ширина (мм)
    Height DECIMAL(10,2), -- Высота (мм)
    Color NVARCHAR(50), -- Цвет
    
    -- Изображения (до 3 фотографий)
    Image1 NVARCHAR(500),
    Image2 NVARCHAR(500),
    Image3 NVARCHAR(500),
    
    -- Служебные поля
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,
    
    FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
);

PRINT '✓ Таблица Materials создана';

-- =====================================================
-- 4. ТАБЛИЦА ХАРАКТЕРИСТИК (MaterialAttributes)
-- Дополнительные характеристики для индивидуальных фильтров
-- Гибкая структура: одна таблица для всех атрибутов
-- =====================================================
CREATE TABLE MaterialAttributes (
    Id INT PRIMARY KEY IDENTITY(1,1),
    MaterialId INT NOT NULL,
    AttrName NVARCHAR(100) NOT NULL, -- Название характеристики
    AttrValue NVARCHAR(500) NOT NULL, -- Значение
    FOREIGN KEY (MaterialId) REFERENCES Materials(Id) ON DELETE CASCADE
);

PRINT '✓ Таблица MaterialAttributes создана';

-- =====================================================
-- 5. ТАБЛИЦА СРАВНЕНИЙ (Comparisons)
-- Для сохранения результатов подбора материалов
-- =====================================================
CREATE TABLE Comparisons (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NULL, -- NULL для анонимных пользователей
    Name NVARCHAR(200) NOT NULL, -- Название сравнения
    FilterCriteria NVARCHAR(MAX), -- JSON с критериями подбора
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

PRINT '✓ Таблица Comparisons создана';

-- =====================================================
-- 6. ТАБЛИЦА ЭЛЕМЕНТОВ СРАВНЕНИЯ (ComparisonItems)
-- Материалы в сравнении
-- =====================================================
CREATE TABLE ComparisonItems (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ComparisonId INT NOT NULL,
    MaterialId INT NOT NULL,
    Score INT, -- Оценка соответствия критериям (для цветовой индикации)
    FOREIGN KEY (ComparisonId) REFERENCES Comparisons(Id) ON DELETE CASCADE,
    FOREIGN KEY (MaterialId) REFERENCES Materials(Id)
);

PRINT '✓ Таблица ComparisonItems создана';

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================
PRINT '';
PRINT 'Создание индексов...';

-- Индексы для Materials
CREATE INDEX IX_Materials_CategoryId ON Materials(CategoryId);
CREATE INDEX IX_Materials_Price ON Materials(Price);
CREATE INDEX IX_Materials_Manufacturer ON Materials(Manufacturer);
CREATE INDEX IX_Materials_IsActive ON Materials(IsActive);
CREATE INDEX IX_Materials_Name ON Materials(Name);

-- Индексы для MaterialAttributes
CREATE INDEX IX_MaterialAttributes_MaterialId ON MaterialAttributes(MaterialId);
CREATE INDEX IX_MaterialAttributes_AttrName ON MaterialAttributes(AttrName);

-- Индексы для Categories
CREATE INDEX IX_Categories_ParentId ON Categories(ParentId);

PRINT '✓ Индексы созданы';

-- =====================================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- =====================================================
PRINT '';
PRINT 'Добавление тестовых данных...';

-- Пользователи
INSERT INTO Users (Email, PasswordHash, FullName, Role) VALUES
('admin@buildmat.by', 'admin123', 'Администратор', 'Admin'),
('user@buildmat.by', 'user123', 'Пользователь', 'User');

PRINT '✓ Пользователи добавлены';

-- Категории
INSERT INTO Categories (Name, Description, ParentId) VALUES
('Кирпич', 'Кирпич различных видов', NULL),
('Цемент', 'Цемент и сухие смеси', NULL),
('Утеплители', 'Теплоизоляционные материалы', NULL),
('Кровельные материалы', 'Материалы для кровли', NULL),
('Отделочные материалы', 'Материалы для отделки', NULL);

PRINT '✓ Категории добавлены';

-- Материалы (примеры)
INSERT INTO Materials (Article, Name, Description, CategoryId, Price, Unit, Stock, Manufacturer, Weight, Length, Width, Height, Color, Image1) VALUES
('KRP-001', 'Кирпич керамический рядовой', 'Кирпич полнотелый для кладки стен', 1, 0.45, 'шт', 50000, 'Керамин', 3.5, 250, 120, 65, 'Красный', '/images/kirpich1.jpg'),
('KRP-002', 'Кирпич облицовочный', 'Кирпич лицевой пустотелый', 1, 0.85, 'шт', 30000, 'Керамин', 2.2, 250, 120, 65, 'Желтый', '/images/kirpich2.jpg'),
('CEM-001', 'Цемент М500', 'Портландцемент марки 500', 2, 8.50, 'мешок 50кг', 1000, 'Кричевцементношифер', 50, NULL, NULL, NULL, 'Серый', '/images/cement1.jpg'),
('CEM-002', 'Цемент М400', 'Портландцемент марки 400', 2, 7.20, 'мешок 50кг', 1500, 'Кричевцементношифер', 50, NULL, NULL, NULL, 'Серый', '/images/cement2.jpg'),
('UTL-001', 'Минеральная вата', 'Утеплитель базальтовый', 3, 45.00, 'упаковка', 500, 'Технониколь', 15, 1000, 600, 50, 'Желтый', '/images/vata1.jpg'),
('UTL-002', 'Пенополистирол', 'Утеплитель пенопласт', 3, 25.00, 'лист', 800, 'Полимер', 2, 1000, 1000, 50, 'Белый', '/images/penoplast1.jpg');

PRINT '✓ Материалы добавлены';

-- Дополнительные характеристики
INSERT INTO MaterialAttributes (MaterialId, AttrName, AttrValue) VALUES
-- Для кирпича
(1, 'Морозостойкость', 'F50'),
(1, 'Прочность', 'М150'),
(1, 'Водопоглощение', '8%'),
(2, 'Морозостойкость', 'F75'),
(2, 'Прочность', 'М175'),
(2, 'Пустотность', '30%'),
-- Для цемента
(3, 'Время схватывания', '45 минут'),
(3, 'Прочность на сжатие', '50 МПа'),
(4, 'Время схватывания', '60 минут'),
(4, 'Прочность на сжатие', '40 МПа'),
-- Для утеплителей
(5, 'Теплопроводность', '0.035 Вт/(м·К)'),
(5, 'Плотность', '50 кг/м³'),
(5, 'Группа горючести', 'НГ'),
(6, 'Теплопроводность', '0.038 Вт/(м·К)'),
(6, 'Плотность', '25 кг/м³'),
(6, 'Группа горючести', 'Г3');

PRINT '✓ Характеристики добавлены';

-- =====================================================
-- ПРЕДСТАВЛЕНИЯ ДЛЯ ОТЧЕТОВ
-- =====================================================
PRINT '';
PRINT 'Создание представлений для отчетов...';

-- Прайс-лист
GO
CREATE VIEW V_PriceList AS
SELECT 
    m.Article AS [Артикул],
    m.Name AS [Наименование],
    c.Name AS [Категория],
    m.Manufacturer AS [Производитель],
    m.Price AS [Цена],
    m.Unit AS [Единица],
    m.Stock AS [Остаток]
FROM Materials m
INNER JOIN Categories c ON m.CategoryId = c.Id
WHERE m.IsActive = 1;
GO

PRINT '✓ Представление V_PriceList создано';

-- Отчет по количеству материалов в категориях
GO
CREATE VIEW V_MaterialsByCategory AS
SELECT 
    c.Name AS [Категория],
    COUNT(m.Id) AS [Количество материалов],
    SUM(m.Stock) AS [Общий остаток],
    AVG(m.Price) AS [Средняя цена],
    MIN(m.Price) AS [Мин. цена],
    MAX(m.Price) AS [Макс. цена]
FROM Categories c
LEFT JOIN Materials m ON c.Id = m.CategoryId AND m.IsActive = 1
GROUP BY c.Name;
GO

PRINT '✓ Представление V_MaterialsByCategory создано';

-- Отчет по характеристикам материалов
GO
CREATE VIEW V_MaterialCharacteristics AS
SELECT 
    m.Article AS [Артикул],
    m.Name AS [Наименование],
    c.Name AS [Категория],
    ma.AttrName AS [Характеристика],
    ma.AttrValue AS [Значение]
FROM Materials m
INNER JOIN Categories c ON m.CategoryId = c.Id
LEFT JOIN MaterialAttributes ma ON m.Id = ma.MaterialId
WHERE m.IsActive = 1;
GO

PRINT '✓ Представление V_MaterialCharacteristics создано';

-- =====================================================
-- ХРАНИМЫЕ ПРОЦЕДУРЫ
-- =====================================================
PRINT '';
PRINT 'Создание хранимых процедур...';

-- Процедура для подбора материалов
GO
CREATE PROCEDURE SP_FindMaterials
    @CategoryId INT = NULL,
    @MinPrice DECIMAL(18,2) = NULL,
    @MaxPrice DECIMAL(18,2) = NULL,
    @Manufacturer NVARCHAR(100) = NULL,
    @Color NVARCHAR(50) = NULL,
    @MinWeight DECIMAL(10,2) = NULL,
    @MaxWeight DECIMAL(10,2) = NULL
AS
BEGIN
    SELECT 
        m.Id,
        m.Article,
        m.Name,
        m.Description,
        c.Name AS Category,
        m.Price,
        m.Unit,
        m.Stock,
        m.Manufacturer,
        m.Weight,
        m.Color,
        m.Image1,
        -- Оценка соответствия критериям (для цветовой индикации)
        CASE 
            WHEN m.Price <= ISNULL(@MaxPrice, 999999) * 0.7 THEN 100 -- Отлично
            WHEN m.Price <= ISNULL(@MaxPrice, 999999) * 0.85 THEN 75 -- Хорошо
            WHEN m.Price <= ISNULL(@MaxPrice, 999999) THEN 50 -- Удовлетворительно
            ELSE 25 -- Дорого
        END AS Score
    FROM Materials m
    INNER JOIN Categories c ON m.CategoryId = c.Id
    WHERE m.IsActive = 1
        AND (@CategoryId IS NULL OR m.CategoryId = @CategoryId)
        AND (@MinPrice IS NULL OR m.Price >= @MinPrice)
        AND (@MaxPrice IS NULL OR m.Price <= @MaxPrice)
        AND (@Manufacturer IS NULL OR m.Manufacturer LIKE '%' + @Manufacturer + '%')
        AND (@Color IS NULL OR m.Color LIKE '%' + @Color + '%')
        AND (@MinWeight IS NULL OR m.Weight >= @MinWeight)
        AND (@MaxWeight IS NULL OR m.Weight <= @MaxWeight)
    ORDER BY Score DESC, m.Price ASC;
END;
GO

PRINT '✓ Процедура SP_FindMaterials создана';

-- =====================================================
-- ИТОГОВАЯ СТАТИСТИКА
-- =====================================================
PRINT '';
PRINT '========================================';
PRINT 'БАЗА ДАННЫХ СОЗДАНА УСПЕШНО!';
PRINT '========================================';
PRINT '';
PRINT 'СТРУКТУРА БД:';
PRINT '- Таблиц: 6';
PRINT '  1. Users (пользователи)';
PRINT '  2. Categories (категории)';
PRINT '  3. Materials (материалы)';
PRINT '  4. MaterialAttributes (характеристики)';
PRINT '  5. Comparisons (сравнения)';
PRINT '  6. ComparisonItems (элементы сравнения)';
PRINT '';
PRINT '- Представлений: 3';
PRINT '  1. V_PriceList (прайс-лист)';
PRINT '  2. V_MaterialsByCategory (по категориям)';
PRINT '  3. V_MaterialCharacteristics (характеристики)';
PRINT '';
PRINT '- Процедур: 1';
PRINT '  1. SP_FindMaterials (подбор материалов)';
PRINT '';
PRINT 'ТЕСТОВЫЕ ДАННЫЕ:';
SELECT 'Пользователей' AS [Тип], COUNT(*) AS [Количество] FROM Users
UNION ALL
SELECT 'Категорий', COUNT(*) FROM Categories
UNION ALL
SELECT 'Материалов', COUNT(*) FROM Materials
UNION ALL
SELECT 'Характеристик', COUNT(*) FROM MaterialAttributes;
PRINT '';
PRINT 'УЧЕТНЫЕ ДАННЫЕ:';
PRINT 'Администратор: admin@buildmat.by / admin123';
PRINT 'Пользователь: user@buildmat.by / user123';
PRINT '';
PRINT '========================================';
PRINT 'Готово к использованию!';
PRINT '========================================';

GO
