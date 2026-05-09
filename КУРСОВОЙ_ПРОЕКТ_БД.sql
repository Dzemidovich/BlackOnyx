-- =====================================================
-- КУРСОВОЙ ПРОЕКТ: КАТАЛОГ СТРОИТЕЛЬНЫХ МАТЕРИАЛОВ
-- База данных в 3НФ
-- =====================================================

USE master;
GO

IF DB_ID('BuildingMaterialsDB') IS NOT NULL
BEGIN
    ALTER DATABASE BuildingMaterialsDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE BuildingMaterialsDB;
END
GO

CREATE DATABASE BuildingMaterialsDB COLLATE Cyrillic_General_CI_AS;
GO

USE BuildingMaterialsDB;
GO

PRINT '========================================';
PRINT 'СОЗДАНИЕ БАЗЫ ДАННЫХ';
PRINT 'Каталог строительных материалов';
PRINT '========================================';

-- =====================================================
-- 1. ПОЛЬЗОВАТЕЛИ
-- =====================================================
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(150) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'User', -- 'Admin' или 'User'
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);
PRINT '✓ Таблица Users создана';

-- =====================================================
-- 2. КАТЕГОРИИ МАТЕРИАЛОВ
-- =====================================================
CREATE TABLE Categories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    ParentId INT NULL,
    CONSTRAINT FK_Categories_Parent FOREIGN KEY (ParentId) REFERENCES Categories(Id)
);
PRINT '✓ Таблица Categories создана';

-- =====================================================
-- 3. СТРОИТЕЛЬНЫЕ МАТЕРИАЛЫ
-- Без полей Image1/Image2/Image3 — фото в отдельной таблице
-- =====================================================
CREATE TABLE Materials (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Article NVARCHAR(50) NOT NULL UNIQUE,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    CategoryId INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    Unit NVARCHAR(20) NOT NULL DEFAULT 'шт',
    Stock INT NOT NULL DEFAULT 0,
    Manufacturer NVARCHAR(100),
    Weight DECIMAL(10,2),
    Length DECIMAL(10,2),
    Width DECIMAL(10,2),
    Height DECIMAL(10,2),
    Color NVARCHAR(50),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,
    CONSTRAINT FK_Materials_Category FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
);
PRINT '✓ Таблица Materials создана';

-- =====================================================
-- 4. ФОТОГРАФИИ ТОВАРОВ (не менее 3 на материал)
-- Отдельная таблица вместо полей Image1/Image2/Image3
-- =====================================================
CREATE TABLE MaterialPhotos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MaterialId INT NOT NULL,
    PhotoUrl NVARCHAR(500) NOT NULL,
    IsMain BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_MaterialPhotos_Material FOREIGN KEY (MaterialId)
        REFERENCES Materials(Id) ON DELETE CASCADE
);
PRINT '✓ Таблица MaterialPhotos создана';

-- =====================================================
-- 5. ХАРАКТЕРИСТИКИ МАТЕРИАЛОВ
-- Привязаны и к товару, и к категории (для индивидуальных фильтров)
-- =====================================================
CREATE TABLE MaterialAttributes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MaterialId INT NOT NULL,
    CategoryId INT NOT NULL,
    AttrName NVARCHAR(100) NOT NULL,
    AttrValue NVARCHAR(500) NOT NULL,
    CONSTRAINT FK_MaterialAttributes_Material FOREIGN KEY (MaterialId)
        REFERENCES Materials(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MaterialAttributes_Category FOREIGN KEY (CategoryId)
        REFERENCES Categories(Id)
);
PRINT '✓ Таблица MaterialAttributes создана';

-- =====================================================
-- 6. СРАВНЕНИЯ МАТЕРИАЛОВ
-- =====================================================
CREATE TABLE Comparisons (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NULL,
    Name NVARCHAR(200) NOT NULL,
    FilterCriteria NVARCHAR(MAX),
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Comparisons_User FOREIGN KEY (UserId) REFERENCES Users(Id)
);
PRINT '✓ Таблица Comparisons создана';

-- =====================================================
-- 7. ЭЛЕМЕНТЫ СРАВНЕНИЯ (с цветовой индикацией)
-- =====================================================
CREATE TABLE ComparisonItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ComparisonId INT NOT NULL,
    MaterialId INT NOT NULL,
    Score INT,
    CONSTRAINT FK_ComparisonItems_Comparison FOREIGN KEY (ComparisonId)
        REFERENCES Comparisons(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ComparisonItems_Material FOREIGN KEY (MaterialId)
        REFERENCES Materials(Id)
);
PRINT '✓ Таблица ComparisonItems создана';

-- =====================================================
-- ИНДЕКСЫ
-- =====================================================
CREATE INDEX IX_Materials_CategoryId   ON Materials(CategoryId);
CREATE INDEX IX_Materials_Price        ON Materials(Price);
CREATE INDEX IX_Materials_Manufacturer ON Materials(Manufacturer);
CREATE INDEX IX_Materials_IsActive     ON Materials(IsActive);
CREATE INDEX IX_Materials_Name         ON Materials(Name);

CREATE INDEX IX_MaterialPhotos_MaterialId ON MaterialPhotos(MaterialId);
CREATE INDEX IX_MaterialPhotos_IsMain     ON MaterialPhotos(IsMain);

CREATE INDEX IX_MaterialAttributes_MaterialId ON MaterialAttributes(MaterialId);
CREATE INDEX IX_MaterialAttributes_CategoryId ON MaterialAttributes(CategoryId);
CREATE INDEX IX_MaterialAttributes_AttrName   ON MaterialAttributes(AttrName);

CREATE INDEX IX_Categories_ParentId ON Categories(ParentId);

PRINT '✓ Индексы созданы';
GO

-- =====================================================
-- ПРЕДСТАВЛЕНИЯ ДЛЯ ОТЧЕТОВ
-- =====================================================

-- ОТЧЕТ 1: Прайс-лист
CREATE VIEW V_PriceList AS
SELECT
    m.Article        AS [Артикул],
    m.Name           AS [Наименование],
    c.Name           AS [Категория],
    m.Manufacturer   AS [Производитель],
    m.Price          AS [Цена, BYN],
    m.Unit           AS [Единица измерения],
    m.Stock          AS [Остаток на складе],
    m.Weight         AS [Вес, кг],
    CONCAT(ISNULL(CAST(m.Length AS NVARCHAR),'—'), 'x',
           ISNULL(CAST(m.Width  AS NVARCHAR),'—'), 'x',
           ISNULL(CAST(m.Height AS NVARCHAR),'—')) AS [Размеры, мм],
    m.Color          AS [Цвет]
FROM Materials m
INNER JOIN Categories c ON m.CategoryId = c.Id
WHERE m.IsActive = 1;
GO
PRINT '✓ Представление V_PriceList создано';

-- ОТЧЕТ 2: Количество материалов по категориям
CREATE VIEW V_MaterialsByCategory AS
SELECT
    c.Name           AS [Категория],
    COUNT(m.Id)      AS [Количество наименований],
    SUM(m.Stock)     AS [Общий остаток],
    AVG(m.Price)     AS [Средняя цена],
    MIN(m.Price)     AS [Минимальная цена],
    MAX(m.Price)     AS [Максимальная цена]
FROM Categories c
LEFT JOIN Materials m ON c.Id = m.CategoryId AND m.IsActive = 1
GROUP BY c.Name;
GO
PRINT '✓ Представление V_MaterialsByCategory создано';

-- ОТЧЕТ 3: Характеристики материалов
CREATE VIEW V_MaterialCharacteristics AS
SELECT
    m.Article        AS [Артикул],
    m.Name           AS [Наименование],
    c.Name           AS [Категория],
    m.Manufacturer   AS [Производитель],
    ma.AttrName      AS [Характеристика],
    ma.AttrValue     AS [Значение]
FROM Materials m
INNER JOIN Categories c ON m.CategoryId = c.Id
LEFT JOIN MaterialAttributes ma ON m.Id = ma.MaterialId
WHERE m.IsActive = 1;
GO
PRINT '✓ Представление V_MaterialCharacteristics создано';

-- ОТЧЕТ 4: Результаты подбора (сравнительная таблица)
CREATE VIEW V_ComparisonResults AS
SELECT
    comp.Name        AS [Название подбора],
    comp.CreatedAt   AS [Дата создания],
    m.Article        AS [Артикул],
    m.Name           AS [Наименование],
    c.Name           AS [Категория],
    m.Price          AS [Цена],
    m.Manufacturer   AS [Производитель],
    ci.Score         AS [Оценка соответствия],
    CASE
        WHEN ci.Score >= 80 THEN 'Отлично (зеленый)'
        WHEN ci.Score >= 60 THEN 'Хорошо (желтый)'
        WHEN ci.Score >= 40 THEN 'Удовлетворительно (оранжевый)'
        ELSE 'Не рекомендуется (красный)'
    END AS [Цветовая индикация]
FROM Comparisons comp
INNER JOIN ComparisonItems ci ON comp.Id = ci.ComparisonId
INNER JOIN Materials m ON ci.MaterialId = m.Id
INNER JOIN Categories c ON m.CategoryId = c.Id;
GO
PRINT '✓ Представление V_ComparisonResults создано';

-- =====================================================
-- ХРАНИМЫЕ ПРОЦЕДУРЫ
-- =====================================================

-- Автоматизированный подбор материалов
CREATE PROCEDURE SP_FindOptimalMaterials
    @CategoryId  INT            = NULL,
    @MinPrice    DECIMAL(18,2)  = NULL,
    @MaxPrice    DECIMAL(18,2)  = NULL,
    @Manufacturer NVARCHAR(100) = NULL,
    @Color       NVARCHAR(50)   = NULL,
    @MinWeight   DECIMAL(10,2)  = NULL,
    @MaxWeight   DECIMAL(10,2)  = NULL,
    @MinLength   DECIMAL(10,2)  = NULL,
    @MaxLength   DECIMAL(10,2)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        m.Id, m.Article, m.Name, m.Description,
        c.Name AS Category,
        m.Price, m.Unit, m.Stock, m.Manufacturer,
        m.Weight, m.Length, m.Width, m.Height, m.Color,
        -- Главное фото
        (SELECT TOP 1 PhotoUrl FROM MaterialPhotos
         WHERE MaterialId = m.Id AND IsMain = 1) AS MainPhoto,
        -- Оценка соответствия для цветовой индикации
        CASE
            WHEN m.Price <= ISNULL(@MaxPrice, 999999) * 0.70 THEN 100
            WHEN m.Price <= ISNULL(@MaxPrice, 999999) * 0.85 THEN 75
            WHEN m.Price <= ISNULL(@MaxPrice, 999999)        THEN 50
            ELSE 25
        END AS Score
    FROM Materials m
    INNER JOIN Categories c ON m.CategoryId = c.Id
    WHERE m.IsActive = 1
        AND (@CategoryId   IS NULL OR m.CategoryId  = @CategoryId)
        AND (@MinPrice     IS NULL OR m.Price       >= @MinPrice)
        AND (@MaxPrice     IS NULL OR m.Price       <= @MaxPrice)
        AND (@Manufacturer IS NULL OR m.Manufacturer LIKE '%' + @Manufacturer + '%')
        AND (@Color        IS NULL OR m.Color        LIKE '%' + @Color + '%')
        AND (@MinWeight    IS NULL OR m.Weight       >= @MinWeight)
        AND (@MaxWeight    IS NULL OR m.Weight       <= @MaxWeight)
        AND (@MinLength    IS NULL OR m.Length       >= @MinLength)
        AND (@MaxLength    IS NULL OR m.Length       <= @MaxLength)
    ORDER BY Score DESC, m.Price ASC;
END;
GO
PRINT '✓ Процедура SP_FindOptimalMaterials создана';

-- Экспорт прайс-листа
CREATE PROCEDURE SP_ExportPriceList AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM V_PriceList ORDER BY [Категория], [Наименование];
END;
GO
PRINT '✓ Процедура SP_ExportPriceList создана';

-- Экспорт отчета по категориям
CREATE PROCEDURE SP_ExportCategoryReport AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM V_MaterialsByCategory ORDER BY [Категория];
END;
GO
PRINT '✓ Процедура SP_ExportCategoryReport создана';

-- =====================================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- =====================================================

-- Пользователи
INSERT INTO Users (Email, PasswordHash, FullName, Role) VALUES
('admin@buildmat.by', 'admin123', 'Администратор системы', 'Admin'),
('user@buildmat.by',  'user123',  'Обычный пользователь',  'User');
PRINT '✓ Пользователи добавлены';

-- Категории
INSERT INTO Categories (Name, Description, ParentId) VALUES
('Кирпич и блоки',       'Кирпич керамический, силикатный, блоки', NULL),
('Цемент и смеси',       'Цемент, сухие строительные смеси',        NULL),
('Утеплители',           'Теплоизоляционные материалы',             NULL),
('Кровельные материалы', 'Материалы для устройства кровли',         NULL),
('Отделочные материалы', 'Материалы для внутренней и внешней отделки', NULL),
('Пиломатериалы',        'Доски, брус, фанера',                     NULL);
PRINT '✓ Категории добавлены';

-- Материалы (без полей Image)
INSERT INTO Materials (Article, Name, Description, CategoryId, Price, Unit, Stock, Manufacturer, Weight, Length, Width, Height, Color) VALUES
('KRP-001', 'Кирпич керамический рядовой',    'Кирпич полнотелый для кладки стен и фундаментов', 1, 0.45, 'шт',          50000, 'Керамин',                3.5, 250,  120,  65,   'Красный'),
('KRP-002', 'Кирпич облицовочный пустотелый', 'Кирпич лицевой для облицовки фасадов',            1, 0.85, 'шт',          30000, 'Керамин',                2.2, 250,  120,  65,   'Желтый'),
('BLK-001', 'Блок газосиликатный',            'Блок для возведения стен',                        1, 3.20, 'шт',          15000, 'Забудова',               18,  600,  200,  300,  'Белый'),
('CEM-001', 'Цемент М500',                    'Портландцемент марки 500',                        2, 8.50, 'мешок 50кг',  1000,  'Кричевцементношифер',    50,  NULL, NULL, NULL, 'Серый'),
('CEM-002', 'Цемент М400',                    'Портландцемент марки 400',                        2, 7.20, 'мешок 50кг',  1500,  'Кричевцементношифер',    50,  NULL, NULL, NULL, 'Серый'),
('SME-001', 'Смесь штукатурная',              'Сухая смесь для штукатурки стен',                 2, 6.80, 'мешок 25кг',  800,   'Ceresit',                25,  NULL, NULL, NULL, 'Серый'),
('UTL-001', 'Минеральная вата ТЕХНО',         'Утеплитель базальтовый плитный',                  3, 45.00,'упаковка',    500,   'Технониколь',            15,  1000, 600,  50,   'Желтый'),
('UTL-002', 'Пенополистирол ПСБ-С-25',        'Утеплитель пенопласт',                            3, 25.00,'лист',        800,   'Полимер',                2,   1000, 1000, 50,   'Белый'),
('UTL-003', 'Пеноплекс Комфорт',              'Экструдированный пенополистирол',                 3, 65.00,'лист',        600,   'Пеноплекс',              3.5, 1185, 585,  50,   'Оранжевый'),
('KRV-001', 'Металлочерепица Монтеррей',      'Кровельное покрытие из оцинкованной стали',       4, 12.50,'м²',          2000,  'Металл Профиль',         5,   1180, 1100, NULL, 'Красный'),
('KRV-002', 'Профнастил С-21',                'Профилированный лист для кровли',                 4, 8.90, 'м²',          3000,  'Металл Профиль',         4.5, 1150, 1000, NULL, 'Зеленый');
PRINT '✓ Материалы добавлены (11)';

-- Фотографии материалов (3 фото на каждый, первое — главное)
INSERT INTO MaterialPhotos (MaterialId, PhotoUrl, IsMain) VALUES
(1, '/images/kirpich1_1.jpg', 1), (1, '/images/kirpich1_2.jpg', 0), (1, '/images/kirpich1_3.jpg', 0),
(2, '/images/kirpich2_1.jpg', 1), (2, '/images/kirpich2_2.jpg', 0), (2, '/images/kirpich2_3.jpg', 0),
(3, '/images/block1_1.jpg',   1), (3, '/images/block1_2.jpg',   0), (3, '/images/block1_3.jpg',   0),
(4, '/images/cement1_1.jpg',  1), (4, '/images/cement1_2.jpg',  0), (4, '/images/cement1_3.jpg',  0),
(5, '/images/cement2_1.jpg',  1), (5, '/images/cement2_2.jpg',  0), (5, '/images/cement2_3.jpg',  0),
(6, '/images/smesi1_1.jpg',   1), (6, '/images/smesi1_2.jpg',   0), (6, '/images/smesi1_3.jpg',   0),
(7, '/images/vata1_1.jpg',    1), (7, '/images/vata1_2.jpg',    0), (7, '/images/vata1_3.jpg',    0),
(8, '/images/penoplast1_1.jpg',1),(8, '/images/penoplast1_2.jpg',0),(8, '/images/penoplast1_3.jpg',0),
(9, '/images/penoplex1_1.jpg', 1),(9, '/images/penoplex1_2.jpg', 0),(9, '/images/penoplex1_3.jpg', 0),
(10,'/images/cherepica1_1.jpg',1),(10,'/images/cherepica1_2.jpg',0),(10,'/images/cherepica1_3.jpg',0),
(11,'/images/profnastil1_1.jpg',1),(11,'/images/profnastil1_2.jpg',0),(11,'/images/profnastil1_3.jpg',0);
PRINT '✓ Фотографии добавлены (33 записи, 3 на каждый материал)';

-- Характеристики (MaterialId + CategoryId)
INSERT INTO MaterialAttributes (MaterialId, CategoryId, AttrName, AttrValue) VALUES
(1, 1, 'Морозостойкость', 'F50'),   (1, 1, 'Прочность', 'М150'),  (1, 1, 'Водопоглощение', '8%'),
(2, 1, 'Морозостойкость', 'F75'),   (2, 1, 'Прочность', 'М175'),  (2, 1, 'Пустотность', '30%'),
(3, 1, 'Морозостойкость', 'F35'),   (3, 1, 'Прочность', 'D500'),  (3, 1, 'Теплопроводность', '0.12 Вт/(м·К)'),
(4, 2, 'Время схватывания', '45 мин'), (4, 2, 'Прочность на сжатие', '50 МПа'),
(5, 2, 'Время схватывания', '60 мин'), (5, 2, 'Прочность на сжатие', '40 МПа'),
(6, 2, 'Расход', '1.5 кг/м²'),     (6, 2, 'Толщина слоя', '5-30 мм'),
(7, 3, 'Теплопроводность', '0.035 Вт/(м·К)'), (7, 3, 'Плотность', '50 кг/м³'), (7, 3, 'Горючесть', 'НГ'),
(8, 3, 'Теплопроводность', '0.038 Вт/(м·К)'), (8, 3, 'Плотность', '25 кг/м³'), (8, 3, 'Горючесть', 'Г3'),
(9, 3, 'Теплопроводность', '0.030 Вт/(м·К)'), (9, 3, 'Плотность', '35 кг/м³'), (9, 3, 'Горючесть', 'Г4'),
(10,4, 'Толщина металла', '0.5 мм'), (10,4, 'Покрытие', 'Полиэстер'), (10,4, 'Гарантия', '10 лет'),
(11,4, 'Толщина металла', '0.45 мм'),(11,4, 'Высота профиля', '21 мм'), (11,4, 'Покрытие', 'Полиэстер');
PRINT '✓ Характеристики добавлены';

-- =====================================================
-- ИТОГ
-- =====================================================
PRINT '';
PRINT '========================================';
PRINT 'БАЗА ДАННЫХ СОЗДАНА УСПЕШНО!';
PRINT '========================================';
PRINT 'Таблицы: Users, Categories, Materials,';
PRINT '         MaterialPhotos, MaterialAttributes,';
PRINT '         Comparisons, ComparisonItems';
PRINT '';
PRINT 'Представления: V_PriceList, V_MaterialsByCategory,';
PRINT '               V_MaterialCharacteristics, V_ComparisonResults';
PRINT '';
PRINT 'Процедуры: SP_FindOptimalMaterials,';
PRINT '           SP_ExportPriceList, SP_ExportCategoryReport';
PRINT '';
PRINT 'Вход: admin@buildmat.by / admin123';
PRINT '      user@buildmat.by  / user123';
PRINT '========================================';

SELECT 'Пользователей'   AS [Тип], COUNT(*) AS [Кол-во] FROM Users
UNION ALL
SELECT 'Категорий',       COUNT(*) FROM Categories
UNION ALL
SELECT 'Материалов',      COUNT(*) FROM Materials
UNION ALL
SELECT 'Фотографий',      COUNT(*) FROM MaterialPhotos
UNION ALL
SELECT 'Характеристик',   COUNT(*) FROM MaterialAttributes;
GO
