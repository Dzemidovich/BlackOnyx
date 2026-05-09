-- =============================================
-- УМНАЯ АВТОМАТИЧЕСКАЯ КАТЕГОРИЗАЦИЯ
-- Анализ ключевых слов и создание категорий
-- =============================================

USE ToolShopDB;
GO

-- =============================================
-- 1. АНАЛИЗ КЛЮЧЕВЫХ СЛОВ В ТОВАРАХ
-- =============================================

IF OBJECT_ID('sp_AnalyzeKeywords', 'P') IS NOT NULL DROP PROCEDURE sp_AnalyzeKeywords;
GO

CREATE PROCEDURE sp_AnalyzeKeywords
    @MinOccurrences INT = 50 -- Минимум совпадений для создания категории
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Временная таблица для ключевых слов
    CREATE TABLE #KeywordAnalysis (
        Keyword NVARCHAR(100),
        Occurrences INT,
        SampleProducts NVARCHAR(MAX)
    );
    
    -- Список стоп-слов (не создавать категории для них)
    DECLARE @StopWords TABLE (Word NVARCHAR(50));
    INSERT INTO @StopWords VALUES 
    ('для'), ('с'), ('и'), ('в'), ('на'), ('по'), ('из'), ('мм'), ('см'), ('шт'),
    ('набор'), ('комплект'), ('professional'), ('pro'), ('new'), ('original');
    
    -- Анализируем первое слово в названии товара
    INSERT INTO #KeywordAnalysis (Keyword, Occurrences, SampleProducts)
    SELECT 
        FirstWord,
        COUNT(*) as Occurrences,
        LEFT((
            SELECT '; ' + Name
            FROM (
                SELECT TOP 5 Name
                FROM Products
                WHERE IsActive = 1
                    AND LOWER(LTRIM(RTRIM(
                        CASE 
                            WHEN CHARINDEX(' ', Name) > 0 
                            THEN SUBSTRING(Name, 1, CHARINDEX(' ', Name) - 1)
                            ELSE Name
                        END
                    ))) = FirstWord
                ORDER BY Name
            ) sub
            FOR XML PATH('')
        ), 200) as SampleProducts
    FROM (
        SELECT 
            LOWER(LTRIM(RTRIM(
                CASE 
                    WHEN CHARINDEX(' ', Name) > 0 
                    THEN SUBSTRING(Name, 1, CHARINDEX(' ', Name) - 1)
                    ELSE Name
                END
            ))) as FirstWord
        FROM Products
        WHERE IsActive = 1
    ) as Words
    WHERE LEN(FirstWord) > 3 -- Минимум 4 символа
        AND FirstWord NOT IN (SELECT Word FROM @StopWords)
    GROUP BY FirstWord
    HAVING COUNT(*) >= @MinOccurrences
    ORDER BY COUNT(*) DESC;
    
    -- Показываем результаты
    SELECT 
        Keyword,
        Occurrences,
        CASE 
            WHEN EXISTS (SELECT 1 FROM Categories WHERE LOWER(Name) LIKE '%' + Keyword + '%') 
            THEN 'EXISTS' 
            ELSE 'NEW' 
        END as CategoryStatus,
        LEFT(SampleProducts, 200) + '...' as SampleProducts
    FROM #KeywordAnalysis
    ORDER BY Occurrences DESC;
    
    DROP TABLE #KeywordAnalysis;
END;
GO

-- =============================================
-- 2. АВТОМАТИЧЕСКОЕ СОЗДАНИЕ КАТЕГОРИЙ
-- =============================================

IF OBJECT_ID('sp_AutoCreateCategories', 'P') IS NOT NULL DROP PROCEDURE sp_AutoCreateCategories;
GO

CREATE PROCEDURE sp_AutoCreateCategories
    @MinOccurrences INT = 50,
    @DryRun BIT = 1,
    @ParentCategoryId INT = NULL -- Родительская категория (NULL = корневая)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Временная таблица для новых категорий
    CREATE TABLE #NewCategories (
        Keyword NVARCHAR(100),
        Occurrences INT,
        CategoryName NVARCHAR(100),
        AlreadyExists BIT
    );
    
    -- Список стоп-слов
    DECLARE @StopWords TABLE (Word NVARCHAR(50));
    INSERT INTO @StopWords VALUES 
    ('для'), ('с'), ('и'), ('в'), ('на'), ('по'), ('из'), ('мм'), ('см'), ('шт'),
    ('набор'), ('комплект'), ('professional'), ('pro'), ('new'), ('original'),
    ('black'), ('white'), ('red'), ('blue'), ('green');
    
    -- Анализируем ключевые слова
    INSERT INTO #NewCategories (Keyword, Occurrences, CategoryName, AlreadyExists)
    SELECT 
        FirstWord,
        COUNT(*) as Occurrences,
        -- Формируем красивое название категории
        UPPER(LEFT(FirstWord, 1)) + LOWER(SUBSTRING(FirstWord, 2, LEN(FirstWord))) as CategoryName,
        CASE 
            WHEN EXISTS (SELECT 1 FROM Categories WHERE LOWER(Name) LIKE '%' + FirstWord + '%') 
            THEN 1 
            ELSE 0 
        END as AlreadyExists
    FROM (
        SELECT 
            LOWER(LTRIM(RTRIM(
                CASE 
                    WHEN CHARINDEX(' ', Name) > 0 
                    THEN SUBSTRING(Name, 1, CHARINDEX(' ', Name) - 1)
                    ELSE Name
                END
            ))) as FirstWord
        FROM Products
        WHERE IsActive = 1
            AND (CategoryId IS NULL OR CategoryId = @ParentCategoryId)
    ) as Words
    WHERE LEN(FirstWord) > 3
        AND FirstWord NOT IN (SELECT Word FROM @StopWords)
    GROUP BY FirstWord
    HAVING COUNT(*) >= @MinOccurrences
    ORDER BY COUNT(*) DESC;
    
    -- Показываем что будет создано
    SELECT 
        CategoryName,
        Occurrences,
        CASE WHEN AlreadyExists = 1 THEN 'Уже существует' ELSE 'Будет создана' END as Status
    FROM #NewCategories
    ORDER BY Occurrences DESC;
    
    -- Создаем категории если не DryRun
    IF @DryRun = 0
    BEGIN
        DECLARE @Keyword NVARCHAR(100);
        DECLARE @CategoryName NVARCHAR(100);
        DECLARE @AlreadyExists BIT;
        DECLARE @NewCategoryId INT;
        DECLARE @ProductsUpdated INT = 0;
        
        DECLARE category_cursor CURSOR FOR
        SELECT Keyword, CategoryName, AlreadyExists
        FROM #NewCategories
        WHERE AlreadyExists = 0;
        
        OPEN category_cursor;
        FETCH NEXT FROM category_cursor INTO @Keyword, @CategoryName, @AlreadyExists;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Создаем категорию
            INSERT INTO Categories (Name, ParentId)
            VALUES (@CategoryName, @ParentCategoryId);
            
            SET @NewCategoryId = SCOPE_IDENTITY();
            
            -- Назначаем товары в эту категорию
            UPDATE Products
            SET CategoryId = @NewCategoryId
            WHERE IsActive = 1
                AND (CategoryId IS NULL OR CategoryId = @ParentCategoryId)
                AND LOWER(Name) LIKE LOWER(@Keyword) + '%';
            
            SET @ProductsUpdated = @ProductsUpdated + @@ROWCOUNT;
            
            PRINT 'Создана категория: ' + @CategoryName + ' (ID: ' + CAST(@NewCategoryId AS NVARCHAR(10)) + ')';
            PRINT 'Назначено товаров: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
            
            FETCH NEXT FROM category_cursor INTO @Keyword, @CategoryName, @AlreadyExists;
        END;
        
        CLOSE category_cursor;
        DEALLOCATE category_cursor;
        
        PRINT '';
        PRINT 'Всего создано категорий: ' + CAST((SELECT COUNT(*) FROM #NewCategories WHERE AlreadyExists = 0) AS NVARCHAR(10));
        PRINT 'Всего назначено товаров: ' + CAST(@ProductsUpdated AS NVARCHAR(10));
    END
    ELSE
    BEGIN
        PRINT '';
        PRINT 'DryRun режим - изменения не применены';
        PRINT 'Для применения запустите: EXEC sp_AutoCreateCategories @MinOccurrences = ' + CAST(@MinOccurrences AS NVARCHAR(10)) + ', @DryRun = 0';
    END;
    
    DROP TABLE #NewCategories;
END;
GO

-- =============================================
-- 3. АНАЛИЗ ПО АТРИБУТАМ (более точный)
-- =============================================

IF OBJECT_ID('sp_AnalyzeByAttributes', 'P') IS NOT NULL DROP PROCEDURE sp_AnalyzeByAttributes;
GO

CREATE PROCEDURE sp_AnalyzeByAttributes
    @AttributeName NVARCHAR(100) = 'Тип', -- Какой атрибут анализировать
    @MinOccurrences INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        pa.AttrValue as PotentialCategory,
        COUNT(DISTINCT p.Id) as ProductCount,
        CASE 
            WHEN EXISTS (SELECT 1 FROM Categories WHERE LOWER(Name) LIKE '%' + LOWER(pa.AttrValue) + '%') 
            THEN 'EXISTS' 
            ELSE 'NEW' 
        END as CategoryStatus,
        LEFT((
            SELECT TOP 5 '; ' + p2.Name
            FROM Products p2
            INNER JOIN ProductAttributes pa2 ON p2.Id = pa2.ProductId
            WHERE pa2.AttrName = @AttributeName
                AND pa2.AttrValue = pa.AttrValue
                AND p2.IsActive = 1
            ORDER BY p2.Name
            FOR XML PATH('')
        ), 200) as SampleProducts
    FROM ProductAttributes pa
    INNER JOIN Products p ON pa.ProductId = p.Id
    WHERE pa.AttrName = @AttributeName
        AND p.IsActive = 1
        AND LEN(pa.AttrValue) > 3
    GROUP BY pa.AttrValue
    HAVING COUNT(DISTINCT p.Id) >= @MinOccurrences
    ORDER BY COUNT(DISTINCT p.Id) DESC;
END;
GO

-- =============================================
-- 4. СОЗДАНИЕ КАТЕГОРИЙ ПО АТРИБУТАМ
-- =============================================

IF OBJECT_ID('sp_CreateCategoriesByAttribute', 'P') IS NOT NULL DROP PROCEDURE sp_CreateCategoriesByAttribute;
GO

CREATE PROCEDURE sp_CreateCategoriesByAttribute
    @AttributeName NVARCHAR(100) = 'Тип',
    @MinOccurrences INT = 50,
    @DryRun BIT = 1,
    @ParentCategoryId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Временная таблица
    CREATE TABLE #AttributeCategories (
        AttrValue NVARCHAR(100),
        ProductCount INT,
        AlreadyExists BIT
    );
    
    INSERT INTO #AttributeCategories
    SELECT 
        pa.AttrValue,
        COUNT(DISTINCT p.Id) as ProductCount,
        CASE 
            WHEN EXISTS (SELECT 1 FROM Categories WHERE LOWER(Name) LIKE '%' + LOWER(pa.AttrValue) + '%') 
            THEN 1 
            ELSE 0 
        END as AlreadyExists
    FROM ProductAttributes pa
    INNER JOIN Products p ON pa.ProductId = p.Id
    WHERE pa.AttrName = @AttributeName
        AND p.IsActive = 1
        AND (p.CategoryId IS NULL OR p.CategoryId = @ParentCategoryId)
        AND LEN(pa.AttrValue) > 3
    GROUP BY pa.AttrValue
    HAVING COUNT(DISTINCT p.Id) >= @MinOccurrences;
    
    -- Показываем результаты
    SELECT 
        AttrValue as CategoryName,
        ProductCount,
        CASE WHEN AlreadyExists = 1 THEN 'Уже существует' ELSE 'Будет создана' END as Status
    FROM #AttributeCategories
    ORDER BY ProductCount DESC;
    
    -- Создаем категории
    IF @DryRun = 0
    BEGIN
        DECLARE @AttrValue NVARCHAR(100);
        DECLARE @ProductCount INT;
        DECLARE @AlreadyExists BIT;
        DECLARE @NewCategoryId INT;
        
        DECLARE attr_cursor CURSOR FOR
        SELECT AttrValue, ProductCount, AlreadyExists
        FROM #AttributeCategories
        WHERE AlreadyExists = 0;
        
        OPEN attr_cursor;
        FETCH NEXT FROM attr_cursor INTO @AttrValue, @ProductCount, @AlreadyExists;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Создаем категорию
            INSERT INTO Categories (Name, ParentId)
            VALUES (@AttrValue, @ParentCategoryId);
            
            SET @NewCategoryId = SCOPE_IDENTITY();
            
            -- Назначаем товары
            UPDATE p
            SET p.CategoryId = @NewCategoryId
            FROM Products p
            INNER JOIN ProductAttributes pa ON p.Id = pa.ProductId
            WHERE pa.AttrName = @AttributeName
                AND pa.AttrValue = @AttrValue
                AND p.IsActive = 1
                AND (p.CategoryId IS NULL OR p.CategoryId = @ParentCategoryId);
            
            PRINT 'Создана категория: ' + @AttrValue + ' (' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + ' товаров)';
            
            FETCH NEXT FROM attr_cursor INTO @AttrValue, @ProductCount, @AlreadyExists;
        END;
        
        CLOSE attr_cursor;
        DEALLOCATE attr_cursor;
    END;
    
    DROP TABLE #AttributeCategories;
END;
GO

-- =============================================
-- 5. ОПТИМИЗАЦИЯ ИНДЕКСОВ
-- =============================================

PRINT 'Создание индексов для оптимизации...';

-- Индексы для Products
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_CategoryId_IsActive_Includes')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Products_CategoryId_IsActive_Includes
    ON Products(CategoryId, IsActive)
    INCLUDE (Id, Article, Name, Price, Stock, ImageUrl, CreatedAt);
    PRINT '✓ Создан индекс IX_Products_CategoryId_IsActive_Includes';
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_IsActive_Name')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Products_IsActive_Name
    ON Products(IsActive, Name)
    INCLUDE (Id, CategoryId);
    PRINT '✓ Создан индекс IX_Products_IsActive_Name';
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_Name_Search')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Products_Name_Search
    ON Products(Name)
    INCLUDE (Id, Article, CategoryId, Price, Stock, IsActive);
    PRINT '✓ Создан индекс IX_Products_Name_Search';
END;

-- Индексы для ProductAttributes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProductAttributes_ProductId_AttrName')
BEGIN
    CREATE NONCLUSTERED INDEX IX_ProductAttributes_ProductId_AttrName
    ON ProductAttributes(ProductId, AttrName)
    INCLUDE (AttrValue);
    PRINT '✓ Создан индекс IX_ProductAttributes_ProductId_AttrName';
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProductAttributes_AttrName_AttrValue')
BEGIN
    CREATE NONCLUSTERED INDEX IX_ProductAttributes_AttrName_AttrValue
    ON ProductAttributes(AttrName, AttrValue)
    INCLUDE (ProductId);
    PRINT '✓ Создан индекс IX_ProductAttributes_AttrName_AttrValue';
END;

-- Индексы для Categories
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Categories_ParentId')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Categories_ParentId
    ON Categories(ParentId)
    INCLUDE (Id, Name);
    PRINT '✓ Создан индекс IX_Categories_ParentId';
END;

-- Индексы для CartItems
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CartItems_CartId_ProductId')
BEGIN
    CREATE NONCLUSTERED INDEX IX_CartItems_CartId_ProductId
    ON CartItems(CartId, ProductId)
    INCLUDE (Quantity, Price);
    PRINT '✓ Создан индекс IX_CartItems_CartId_ProductId';
END;

-- Индексы для Orders
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_UserId_CreatedAt')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Orders_UserId_CreatedAt
    ON Orders(UserId, CreatedAt DESC)
    INCLUDE (Id, TotalAmount, Status);
    PRINT '✓ Создан индекс IX_Orders_UserId_CreatedAt';
END;

PRINT '';
PRINT '✅ Все индексы созданы успешно!';
PRINT '';

-- =============================================
-- ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
-- =============================================

PRINT '==============================================';
PRINT 'ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:';
PRINT '==============================================';
PRINT '';
PRINT '1. Анализ ключевых слов (минимум 50 совпадений):';
PRINT '   EXEC sp_AnalyzeKeywords @MinOccurrences = 50;';
PRINT '';
PRINT '2. Создание категорий по ключевым словам (тест):';
PRINT '   EXEC sp_AutoCreateCategories @MinOccurrences = 50, @DryRun = 1;';
PRINT '';
PRINT '3. Применить создание категорий:';
PRINT '   EXEC sp_AutoCreateCategories @MinOccurrences = 50, @DryRun = 0;';
PRINT '';
PRINT '4. Анализ по атрибуту "Тип":';
PRINT '   EXEC sp_AnalyzeByAttributes @AttributeName = ''Тип'', @MinOccurrences = 50;';
PRINT '';
PRINT '5. Создание категорий по атрибуту:';
PRINT '   EXEC sp_CreateCategoriesByAttribute @AttributeName = ''Тип'', @MinOccurrences = 50, @DryRun = 0;';
PRINT '';
PRINT '==============================================';

GO
