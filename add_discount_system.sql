-- =============================================
-- СИСТЕМА ПЕРСОНАЛЬНЫХ СКИДОК
-- Дата: 2026-02-17
-- =============================================

USE ToolShopDB;
GO

-- =============================================
-- 1. ПЕРСОНАЛЬНЫЕ СКИДКИ КЛИЕНТОВ
-- =============================================

-- Общая скидка клиента (применяется ко всем товарам)
CREATE TABLE UserDiscounts (
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    DiscountPercent DECIMAL(5,2) NOT NULL DEFAULT 0, -- Процент скидки (0-100)
    IsActive BIT NOT NULL DEFAULT 1,
    ValidFrom DATETIME NULL,
    ValidUntil DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT NULL, -- Кто создал скидку (Admin/Manager)
    Notes NVARCHAR(500) NULL, -- Причина/комментарий
    CONSTRAINT FK_UserDiscounts_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT CK_UserDiscounts_Percent CHECK (DiscountPercent >= 0 AND DiscountPercent <= 100)
);

-- =============================================
-- 2. СКИДКИ ПО КАТЕГОРИЯМ
-- =============================================

CREATE TABLE CategoryDiscounts (
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    CategoryId INT NOT NULL,
    DiscountPercent DECIMAL(5,2) NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    ValidFrom DATETIME NULL,
    ValidUntil DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT NULL,
    Notes NVARCHAR(500) NULL,
    CONSTRAINT FK_CategoryDiscounts_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT FK_CategoryDiscounts_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
    CONSTRAINT CK_CategoryDiscounts_Percent CHECK (DiscountPercent >= 0 AND DiscountPercent <= 100),
    CONSTRAINT UQ_CategoryDiscounts_UserCategory UNIQUE (UserId, CategoryId)
);

-- =============================================
-- 3. СКИДКИ НА КОНКРЕТНЫЕ ТОВАРЫ
-- =============================================

CREATE TABLE ProductDiscounts (
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    ProductId INT NOT NULL,
    DiscountPercent DECIMAL(5,2) NULL, -- Процент скидки
    FixedPrice DECIMAL(10,2) NULL, -- Или фиксированная цена
    IsActive BIT NOT NULL DEFAULT 1,
    ValidFrom DATETIME NULL,
    ValidUntil DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT NULL,
    Notes NVARCHAR(500) NULL,
    CONSTRAINT FK_ProductDiscounts_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT FK_ProductDiscounts_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT CK_ProductDiscounts_Percent CHECK (DiscountPercent IS NULL OR (DiscountPercent >= 0 AND DiscountPercent <= 100)),
    CONSTRAINT CK_ProductDiscounts_OneType CHECK ((DiscountPercent IS NOT NULL AND FixedPrice IS NULL) OR (DiscountPercent IS NULL AND FixedPrice IS NOT NULL)),
    CONSTRAINT UQ_ProductDiscounts_UserProduct UNIQUE (UserId, ProductId)
);

-- =============================================
-- 4. ОБЪЕМНЫЕ СКИДКИ (для всех клиентов)
-- =============================================

CREATE TABLE VolumeDiscounts (
    Id INT IDENTITY PRIMARY KEY,
    ProductId INT NULL, -- NULL = для всех товаров
    CategoryId INT NULL, -- NULL = для всех категорий
    MinQuantity INT NOT NULL,
    MaxQuantity INT NULL, -- NULL = без ограничения
    DiscountPercent DECIMAL(5,2) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_VolumeDiscounts_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT FK_VolumeDiscounts_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
    CONSTRAINT CK_VolumeDiscounts_Percent CHECK (DiscountPercent >= 0 AND DiscountPercent <= 100),
    CONSTRAINT CK_VolumeDiscounts_Quantity CHECK (MinQuantity > 0 AND (MaxQuantity IS NULL OR MaxQuantity >= MinQuantity))
);

-- =============================================
-- 5. ПРОМОКОДЫ
-- =============================================

CREATE TABLE PromoCodes (
    Id INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(50) UNIQUE NOT NULL,
    DiscountPercent DECIMAL(5,2) NULL,
    DiscountAmount DECIMAL(10,2) NULL,
    MinOrderAmount DECIMAL(10,2) NULL, -- Минимальная сумма заказа
    MaxUsageCount INT NULL, -- Максимальное количество использований
    CurrentUsageCount INT NOT NULL DEFAULT 0,
    ValidFrom DATETIME NOT NULL,
    ValidUntil DATETIME NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    ApplicableToUserId INT NULL, -- NULL = для всех, иначе только для конкретного пользователя
    ApplicableToCategoryId INT NULL, -- NULL = для всех категорий
    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT NULL,
    Description NVARCHAR(500) NULL,
    CONSTRAINT FK_PromoCodes_Users FOREIGN KEY (ApplicableToUserId) REFERENCES Users(Id),
    CONSTRAINT FK_PromoCodes_Categories FOREIGN KEY (ApplicableToCategoryId) REFERENCES Categories(Id),
    CONSTRAINT CK_PromoCodes_Discount CHECK ((DiscountPercent IS NOT NULL AND DiscountAmount IS NULL) OR (DiscountPercent IS NULL AND DiscountAmount IS NOT NULL)),
    CONSTRAINT CK_PromoCodes_Percent CHECK (DiscountPercent IS NULL OR (DiscountPercent >= 0 AND DiscountPercent <= 100))
);

-- =============================================
-- 6. ИСТОРИЯ ИСПОЛЬЗОВАНИЯ ПРОМОКОДОВ
-- =============================================

CREATE TABLE PromoCodeUsage (
    Id INT IDENTITY PRIMARY KEY,
    PromoCodeId INT NOT NULL,
    UserId INT NOT NULL,
    OrderId INT NULL,
    DiscountAmount DECIMAL(10,2) NOT NULL,
    UsedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_PromoCodeUsage_PromoCodes FOREIGN KEY (PromoCodeId) REFERENCES PromoCodes(Id),
    CONSTRAINT FK_PromoCodeUsage_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT FK_PromoCodeUsage_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id)
);

-- =============================================
-- 7. НАКОПИТЕЛЬНАЯ СИСТЕМА (УРОВНИ КЛИЕНТОВ)
-- =============================================

CREATE TABLE LoyaltyTiers (
    Id INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL, -- Бронза, Серебро, Золото, Платина
    MinTotalSpent DECIMAL(10,2) NOT NULL, -- Минимальная сумма покупок
    DiscountPercent DECIMAL(5,2) NOT NULL,
    Color NVARCHAR(20) NULL, -- Цвет для UI
    Icon NVARCHAR(50) NULL, -- Иконка для UI
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_LoyaltyTiers_Percent CHECK (DiscountPercent >= 0 AND DiscountPercent <= 100)
);

-- Текущий уровень клиента
CREATE TABLE UserLoyaltyStatus (
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL UNIQUE,
    CurrentTierId INT NULL,
    TotalSpent DECIMAL(10,2) NOT NULL DEFAULT 0,
    LastOrderDate DATETIME NULL,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_UserLoyaltyStatus_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT FK_UserLoyaltyStatus_Tiers FOREIGN KEY (CurrentTierId) REFERENCES LoyaltyTiers(Id)
);

-- =============================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =============================================

CREATE INDEX IX_UserDiscounts_UserId ON UserDiscounts(UserId) WHERE IsActive = 1;
CREATE INDEX IX_CategoryDiscounts_UserId ON CategoryDiscounts(UserId) WHERE IsActive = 1;
CREATE INDEX IX_ProductDiscounts_UserId ON ProductDiscounts(UserId) WHERE IsActive = 1;
CREATE INDEX IX_ProductDiscounts_ProductId ON ProductDiscounts(ProductId) WHERE IsActive = 1;
CREATE INDEX IX_VolumeDiscounts_ProductId ON VolumeDiscounts(ProductId) WHERE IsActive = 1;
CREATE INDEX IX_PromoCodes_Code ON PromoCodes(Code) WHERE IsActive = 1;
CREATE INDEX IX_UserLoyaltyStatus_UserId ON UserLoyaltyStatus(UserId);

-- =============================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- =============================================

-- Уровни лояльности
INSERT INTO LoyaltyTiers (Name, MinTotalSpent, DiscountPercent, Color, Icon) VALUES
('Бронза', 0, 0, '#CD7F32', 'fa-medal'),
('Серебро', 1000, 5, '#C0C0C0', 'fa-medal'),
('Золото', 5000, 10, '#FFD700', 'fa-crown'),
('Платина', 10000, 15, '#E5E4E2', 'fa-gem');

-- Пример: VIP клиент с общей скидкой 10%
-- INSERT INTO UserDiscounts (UserId, DiscountPercent, Notes) VALUES (3, 10, 'VIP клиент');

-- Пример: Скидка 15% на категорию "Электроинструменты" для клиента
-- INSERT INTO CategoryDiscounts (UserId, CategoryId, DiscountPercent, Notes) VALUES (3, 1, 15, 'Постоянный покупатель электроинструментов');

-- Пример: Фиксированная цена на товар
-- INSERT INTO ProductDiscounts (UserId, ProductId, FixedPrice, Notes) VALUES (3, 100, 85.00, 'Специальная цена для постоянного клиента');

-- Пример: Объемная скидка - от 10 шт = 5%, от 50 шт = 10%
-- INSERT INTO VolumeDiscounts (ProductId, MinQuantity, MaxQuantity, DiscountPercent) VALUES (NULL, 10, 49, 5);
-- INSERT INTO VolumeDiscounts (ProductId, MinQuantity, MaxQuantity, DiscountPercent) VALUES (NULL, 50, NULL, 10);

-- Пример: Промокод на 20% скидку
-- INSERT INTO PromoCodes (Code, DiscountPercent, ValidFrom, ValidUntil, Description) VALUES ('WELCOME20', 20, GETDATE(), DATEADD(MONTH, 1, GETDATE()), 'Приветственная скидка 20%');

PRINT 'Система персональных скидок успешно создана!';
GO
