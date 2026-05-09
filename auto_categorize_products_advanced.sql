-- =============================================
-- АВТОМАТИЧЕСКАЯ КАТЕГОРИЗАЦИЯ ТОВАРОВ
-- Улучшенная версия с приоритетами и точностью
-- =============================================

USE ToolShopDB;
GO

-- =============================================
-- 1. СОЗДАНИЕ ТАБЛИЦЫ ПРАВИЛ КАТЕГОРИЗАЦИИ
-- =============================================

IF OBJECT_ID('CategoryRules', 'U') IS NOT NULL DROP TABLE CategoryRules;
GO

CREATE TABLE CategoryRules (
    Id INT IDENTITY PRIMARY KEY,
    CategoryId INT NOT NULL,
    Keyword NVARCHAR(100) NOT NULL,
    Priority INT NOT NULL DEFAULT 1, -- Чем выше, тем важнее (1-10)
    MatchType NVARCHAR(20) NOT NULL DEFAULT 'contains', -- contains, starts_with, ends_with, exact
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_CategoryRules_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
);

CREATE INDEX IX_CategoryRules_Keyword ON CategoryRules(Keyword) WHERE IsActive = 1;
CREATE INDEX IX_CategoryRules_Priority ON CategoryRules(Priority DESC) WHERE IsActive = 1;

-- =============================================
-- 2. ПРАВИЛА КАТЕГОРИЗАЦИИ (ПРИМЕРЫ)
-- =============================================

-- Электроинструменты
INSERT INTO CategoryRules (CategoryId, Keyword, Priority, MatchType) VALUES
-- Дрели
(1, 'дрель', 10, 'contains'),
(1, 'drill', 10, 'contains'),
(1, 'сверл', 9, 'contains'),
(1, 'перфоратор', 10, 'contains'),
(1, 'шуруповерт', 10, 'contains'),

-- Пилы
(2, 'пила', 10, 'contains'),
(2, 'saw', 10, 'contains'),
(2, 'циркулярн', 9, 'contains'),
(2, 'лобзик', 10, 'contains'),
(2, 'цепн', 9, 'contains'),

-- Шлифовальные
(3, 'шлифовальн', 10, 'contains'),
(3, 'болгарк', 10, 'contains'),
(3, 'УШМ', 10, 'exact'),
(3, 'grinder', 10, 'contains'),
(3, 'полировальн', 9, 'contains'),

-- Сварочное оборудование
(4, 'сварочн', 10, 'contains'),
(4, 'сварк', 9, 'contains'),
(4, 'welding', 10, 'contains'),
(4, 'инвертор', 8, 'contains'),
(4, 'электрод', 7, 'contains'),

-- Измерительные инструменты
(5, 'рулетк', 10, 'contains'),
(5, 'уровень', 10, 'contains'),
(5, 'лазерн', 9, 'contains'),
(5, 'дальномер', 10, 'contains'),
(5, 'штангенциркуль', 10, 'contains'),
(5, 'угломер', 10, 'contains'),

-- Ручной инструмент
(6, 'молоток', 10, 'contains'),
(6, 'отвертк', 10, 'contains'),
(6, 'ключ', 8, 'contains'),
(6, 'плоскогубц', 10, 'contains'),
(6, 'кусачк', 10, 'contains'),
(6, 'пассатиж', 10, 'contains'),

-- Крепеж
(7, 'винт', 9, 'contains'),
(7, 'болт', 9, 'contains'),
(7, 'гайк', 9, 'contains'),
(7, 'шуруп', 9, 'contains'),
(7, 'саморез', 10, 'contains'),
(7, 'дюбель', 10, 'contains'),
(7, 'анкер', 10, 'contains'),

-- Расходные материалы
(8, 'диск', 8, 'contains'),
(8, 'круг', 8, 'contains'),
(8, 'сверло', 9, 'contains'),
(8, 'бур', 8, 'contains'),
(8, 'пилк', 9, 'contains'),
(8, 'щетк', 8, 'contains'),
(8, 'наждачн', 9, 'contains'),

-- Садовый инструмент
(9, 'газонокосилк', 10, 'contains'),
(9, 'триммер', 10, 'contains'),
(9, 'мотокос', 10, 'contains'),
(9, 'культиватор', 10, 'contains'),
(9, 'секатор', 10, 'contains'),
(9, 'грабли', 10, 'contains'),
(9, 'лопат', 9, 'contains'),

-- Компрессоры и пневмоинструмент
(10, 'компрессор', 10, 'contains'),
(10, 'пневм', 9, 'contains'),
(10, 'краскопульт', 10, 'contains'),
(10, 'пистолет', 8, 'contains');

-- =============================================
-- 3. ФУНКЦИЯ АВТОМАТИЧЕСКОЙ КАТЕГОРИЗАЦИИ
-- =============================================

IF OBJECT_ID('fn_GetBestCategory', 'FN') IS NOT NULL DROP FUNCTION fn_GetBestCategory;
GO

CREATE FUNCTION fn_GetBestCategory(@ProductName NVARCHAR(200), @ProductDescription NVARCHAR(MAX))
RETURNS INT
AS
BEGIN
    DECLARE @BestCategoryId INT = NULL;
    DECLARE @MaxScore INT = 0;
    
    -- Объединяем название и описание для поиска
    DECLARE @SearchText NVARCHAR(MAX) = LOWER(@ProductName + ' ' + ISNULL(@ProductDescription, ''));
    
    -- Ищем лучшее совпадение
    SELECT TOP 1 
        @BestCategoryId = CategoryId,
        @MaxScore = SUM(Priority)
    FROM CategoryRules
    WHERE IsActive = 1
        AND (
            (MatchType = 'contains' AND @SearchText LIKE '%' + LOWER(Keyword) + '%')
            OR (MatchType = 'starts_with' AND @SearchText LIKE LOWER(Keyword) + '%')
            OR (MatchType = 'ends_with' AND @SearchText LIKE '%' + LOWER(Keyword))
            OR (MatchType = 'exact' AND @SearchText = LOWER(Keyword))
        )
    GROUP BY CategoryId
    ORDER BY SUM(Priority) DESC;
    
    RETURN @BestCategoryId;
END;
GO

-- =============================================
-- 4. ПРОЦЕДУРА МАССОВОЙ КАТЕГОРИЗАЦИИ
-- =============================================

IF OBJECT_ID('sp_AutoCategorizeProducts', 'P') IS NOT NULL DROP PROCEDURE sp_AutoCategorizeProducts;
GO

CREATE PROCEDURE sp_AutoCategorizeProducts
    @DryRun BIT = 1, -- 1 = только показать, 0 = применить изменения
    @MinScore INT = 5 -- Минимальный score для автоматической категоризации
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Временная таблица для результатов
    CREATE TABLE #CategorizationResults (
        ProductId INT,
        ProductName NVARCHAR(200),
        CurrentCategoryId INT,
        CurrentCategoryName NVARCHAR(100),
        SuggestedCategoryId INT,
        SuggestedCategoryName NVARCHAR(100),
        Score INT,
        MatchedKeywords NVARCHAR(500)
    );
    
    -- Анализируем каждый товар
    INSERT INTO #CategorizationResults
    SELECT 
        p.Id,
        p.Name,
        p.CategoryId,
        c1.Name as CurrentCategoryName,
        BestMatch.CategoryId as SuggestedCategoryId,
        c2.Name as SuggestedCategoryName,
        BestMatch.Score,
        BestMatch.Keywords
    FROM Products p
    LEFT JOIN Categories c1 ON p.CategoryId = c1.Id
    CROSS APPLY (
        SELECT TOP 1
            cr.CategoryId,
            SUM(cr.Priority) as Score,
            STRING_AGG(cr.Keyword, ', ') as Keywords
        FROM CategoryRules cr
        WHERE cr.IsActive = 1
            AND (
                LOWER(p.Name + ' ' + ISNULL(p.Description, '')) LIKE '%' + LOWER(cr.Keyword) + '%'
            )
        GROUP BY cr.CategoryId
        HAVING SUM(cr.Priority) >= @MinScore
        ORDER BY SUM(cr.Priority) DESC
    ) BestMatch
    LEFT JOIN Categories c2 ON BestMatch.CategoryId = c2.Id
    WHERE p.CategoryId IS NULL OR p.CategoryId != BestMatch.CategoryId;
    
    -- Показываем результаты
    SELECT 
        ProductId,
        ProductName,
        CurrentCategoryName,
        SuggestedCategoryName,
        Score,
        MatchedKeywords,
        CASE 
            WHEN CurrentCategoryId IS NULL THEN 'NEW'
            ELSE 'CHANGE'
        END as Action
    FROM #CategorizationResults
    ORDER BY Score DESC, ProductName;
    
    -- Применяем изменения если не DryRun
    IF @DryRun = 0
    BEGIN
        UPDATE p
        SET p.CategoryId = r.SuggestedCategoryId
        FROM Products p
        INNER JOIN #CategorizationResults r ON p.Id = r.ProductId;
        
        PRINT 'Обновлено товаров: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
    END
    ELSE
    BEGIN
        PRINT 'DryRun режим - изменения не применены';
        PRINT 'Для применения запустите: EXEC sp_AutoCategorizeProducts @DryRun = 0';
    END
    
    DROP TABLE #CategorizationResults;
END;
GO

-- =============================================
-- 5. ПРОЦЕДУРА КАТЕГОРИЗАЦИИ ПО АТРИБУТАМ
-- =============================================

IF OBJECT_ID('sp_CategorizeByAttributes', 'P') IS NOT NULL DROP PROCEDURE sp_CategorizeByAttributes;
GO

CREATE PROCEDURE sp_CategorizeByAttributes
    @DryRun BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Категоризация по атрибуту "Тип"
    IF @DryRun = 0
    BEGIN
        -- Дрели
        UPDATE p
        SET CategoryId = (SELECT Id FROM Categories WHERE Name LIKE '%дрел%')
        FROM Products p
        INNER JOIN ProductAttributes pa ON p.Id = pa.ProductId
        WHERE pa.AttrName = 'Тип' 
            AND (pa.AttrValue LIKE '%дрель%' OR pa.AttrValue LIKE '%перфоратор%')
            AND (p.CategoryId IS NULL OR p.CategoryId != (SELECT Id FROM Categories WHERE Name LIKE '%дрел%'));
        
        PRINT 'Категоризировано дрелей: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
        
        -- Пилы
        UPDATE p
        SET CategoryId = (SELECT Id FROM Categories WHERE Name LIKE '%пил%')
        FROM Products p
        INNER JOIN ProductAttributes pa ON p.Id = pa.ProductId
        WHERE pa.AttrName = 'Тип' 
            AND pa.AttrValue LIKE '%пила%'
            AND (p.CategoryId IS NULL OR p.CategoryId != (SELECT Id FROM Categories WHERE Name LIKE '%пил%'));
        
        PRINT 'Категоризировано пил: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
    END
    ELSE
    BEGIN
        -- Показываем что будет изменено
        SELECT 
            p.Id,
            p.Name,
            pa.AttrName,
            pa.AttrValue,
            'Дрели' as SuggestedCategory
        FROM Products p
        INNER JOIN ProductAttributes pa ON p.Id = pa.ProductId
        WHERE pa.AttrName = 'Тип' 
            AND (pa.AttrValue LIKE '%дрель%' OR pa.AttrValue LIKE '%перфоратор%')
        
        UNION ALL
        
        SELECT 
            p.Id,
            p.Name,
            pa.AttrName,
            pa.AttrValue,
            'Пилы' as SuggestedCategory
        FROM Products p
        INNER JOIN ProductAttributes pa ON p.Id = pa.ProductId
        WHERE pa.AttrName = 'Тип' 
            AND pa.AttrValue LIKE '%пила%';
    END
END;
GO

-- =============================================
-- 6. СТАТИСТИКА КАТЕГОРИЗАЦИИ
-- =============================================

IF OBJECT_ID('sp_GetCategorizationStats', 'P') IS NOT NULL DROP PROCEDURE sp_GetCategorizationStats;
GO

CREATE PROCEDURE sp_GetCategorizationStats
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Общая статистика
    SELECT 
        'Всего товаров' as Metric,
        COUNT(*) as Count
    FROM Products
    
    UNION ALL
    
    SELECT 
        'Без категории' as Metric,
        COUNT(*) as Count
    FROM Products
    WHERE CategoryId IS NULL
    
    UNION ALL
    
    SELECT 
        'С категорией' as Metric,
        COUNT(*) as Count
    FROM Products
    WHERE CategoryId IS NOT NULL;
    
    -- По категориям
    SELECT 
        c.Name as CategoryName,
        COUNT(p.Id) as ProductCount,
        CAST(COUNT(p.Id) * 100.0 / (SELECT COUNT(*) FROM Products) AS DECIMAL(5,2)) as Percentage
    FROM Categories c
    LEFT JOIN Products p ON c.Id = p.CategoryId
    GROUP BY c.Id, c.Name
    ORDER BY ProductCount DESC;
END;
GO

-- =============================================
-- ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
-- =============================================

-- 1. Посмотреть статистику
-- EXEC sp_GetCategorizationStats;

-- 2. Тестовый запуск автокатегоризации (без изменений)
-- EXEC sp_AutoCategorizeProducts @DryRun = 1, @MinScore = 5;

-- 3. Применить автокатегоризацию
-- EXEC sp_AutoCategorizeProducts @DryRun = 0, @MinScore = 5;

-- 4. Категоризация по атрибутам (тест)
-- EXEC sp_CategorizeByAttributes @DryRun = 1;

-- 5. Применить категоризацию по атрибутам
-- EXEC sp_CategorizeByAttributes @DryRun = 0;

PRINT 'Система автоматической категоризации готова!';
PRINT 'Запустите: EXEC sp_GetCategorizationStats для просмотра статистики';
GO
