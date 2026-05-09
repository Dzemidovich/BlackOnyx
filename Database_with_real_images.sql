USE master;
GO

IF DB_ID('ToolShopDB') IS NOT NULL
BEGIN
    ALTER DATABASE ToolShopDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ToolShopDB;
END
GO

CREATE DATABASE ToolShopDB COLLATE Cyrillic_General_CI_AS;
GO
USE ToolShopDB;
GO

CREATE TABLE Users(
    Id INT IDENTITY PRIMARY KEY,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(150),
    Role NVARCHAR(20) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Categories(
    Id INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    ParentId INT NULL
);

CREATE TABLE Products(
    Id INT IDENTITY PRIMARY KEY,
    Article NVARCHAR(50) UNIQUE NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10,2) NOT NULL,
    Stock INT NOT NULL,
    CategoryId INT,
    ImageUrl NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE ProductAttributes(
    Id INT IDENTITY PRIMARY KEY,
    ProductId INT NOT NULL,
    AttrName NVARCHAR(100),
    AttrValue NVARCHAR(100)
);

CREATE TABLE Carts(
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE CartItems(
    Id INT IDENTITY PRIMARY KEY,
    CartId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(10,2)
);

CREATE TABLE Orders(
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    TotalAmount DECIMAL(10,2),
    Status NVARCHAR(30),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE OrderItems(
    Id INT IDENTITY PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Total DECIMAL(10,2) NOT NULL
);

CREATE TABLE Notifications(
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(200),
    Message NVARCHAR(500),
    Type NVARCHAR(50),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE ImportJobs(
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CompletedAt DATETIME NULL,
    TotalRows INT NOT NULL,
    ProcessedRows INT NOT NULL,
    ErrorsCount INT NOT NULL,
    ImportVersion NVARCHAR(50),
    ImportMode NVARCHAR(50),
    IsDryRun BIT DEFAULT 0
);

CREATE TABLE ImportRows(
    Id INT IDENTITY PRIMARY KEY,
    ImportJobId INT NOT NULL,
    RowNumber INT NOT NULL,
    RawData NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    ErrorMessage NVARCHAR(500),
    ProductId INT NULL
);

CREATE TABLE ImportLogs(
    Id INT IDENTITY PRIMARY KEY,
    ImportJobId INT NOT NULL,
    RowNumber INT NOT NULL,
    MessageType NVARCHAR(50) NOT NULL,
    Message NVARCHAR(1000) NOT NULL,
    OldValue NVARCHAR(500),
    NewValue NVARCHAR(500),
    ImportVersion NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE()
);

ALTER TABLE Products ADD CostPrice DECIMAL(10,2) DEFAULT 0;
ALTER TABLE Products ADD FOREIGN KEY (CategoryId) REFERENCES Categories(Id);
ALTER TABLE ProductAttributes ADD FOREIGN KEY (ProductId) REFERENCES Products(Id);
ALTER TABLE Carts ADD FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE CartItems ADD FOREIGN KEY (CartId) REFERENCES Carts(Id);
ALTER TABLE CartItems ADD FOREIGN KEY (ProductId) REFERENCES Products(Id);
ALTER TABLE Orders ADD FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE OrderItems ADD FOREIGN KEY (OrderId) REFERENCES Orders(Id);
ALTER TABLE OrderItems ADD FOREIGN KEY (ProductId) REFERENCES Products(Id);
ALTER TABLE Notifications ADD FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE ImportJobs ADD FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE ImportRows ADD FOREIGN KEY (ImportJobId) REFERENCES ImportJobs(Id);
ALTER TABLE ImportLogs ADD FOREIGN KEY (ImportJobId) REFERENCES ImportJobs(Id);

CREATE UNIQUE INDEX UQ_ProductAttributes_ProductId_AttrName ON ProductAttributes(ProductId, AttrName);

INSERT INTO Users (Email,PasswordHash,FullName,Role) VALUES
('admin@toolshop.by','admin123','Администратор','Admin'),
('manager@toolshop.by','manager123','Менеджер','Manager'),
('company@toolshop.by','company123','ООО "СтройМастер"','Customer'),
('user@toolshop.by','user123','Иван Петров','Customer');

INSERT INTO Categories (Name) VALUES
('Электроинструмент'),
('Ручной инструмент'),
('Сварочное оборудование'),
('Компрессоры');

-- Вставляем продукты с реальными изображениями из папки img
INSERT INTO Products (Article,Name,Description,Price,CostPrice,Stock,CategoryId,ImageUrl) VALUES
-- Продукты с изображениями из папки img (названия из export_universal_2026.csv)
('AE-501-1','Компрессор ECO AE-501-1','Напряжение/частота: 220В/50Гц, Мощность: 1,8 кВт, Производительность: 260 л/мин, Объем масла: 0,3 л, Объём ресивера: 50 л',332.70,250.00,8,4,'/img/AE-501-1.jpg'),
('AE-251-3','Компрессор ECO AE-251-3 коаксиальный','Потребляемая мощность: 1.5 кВт, Рабочее давление: 0–8 атм, Производительность: 235 л/мин, Ресивер:24 л',314.02,235.00,10,4,'/img/AE-251-3.jpg'),
('AE-501-3','Компрессор ECO AE-501-3 коаксиальный','Потребляемая мощность: 1.8 кВт, Рабочее давление: 0–8 атм, Производительность: 260 л/мин, Ресивер: 50 л',385.86,290.00,10,4,'/img/AE-501-3.jpg'),
('AE-502-3','Компрессор ECO AE-502-3 коаксиальный','Потребляемая мощность: 2.2 кВт, Рабочее давление: 0–8 атм, Производительность: 440 л/мин, Ресивер: 50 л, 2-цилиндровый',625.36,470.00,10,4,'/img/AE-502-3.jpg'),
('AE-1005-B1','Компрессор ECO AE-1005-B1 ременной','Потребляемая мощность: 2,2 кВт, Рабочее давление: 0–8 атм, Производительность: 380 л/мин, Ресивер: 100 л, V-образное расположение поршней',967.68,725.00,10,4,'/img/AE-1005-B1.jpg'),
('AE-251-4','Компрессор ECO AE-251-4 коаксиальный','Потребляемая мощность: 1.8 кВт, Рабочее давление: 0–8 атм, Производительность: 260 л/мин, Ресивер: 24 л',332.64,250.00,10,4,'/img/AE-251-4.jpg'),
('AE-705-3','Компрессор ECO AE-705-3 коаксиальный','Потребляемая мощность: 2.2 кВт, Рабочее давление: 0–8 атм, Производительность: 440 л/мин, Ресивер: 70 л, 2-цилиндровый',678.59,510.00,10,4,'/img/AE-705-3.jpg'),
('AE-705-B1','Компрессор ECO AE-705-B1 ременной','Потребляемая мощность: 2,2 кВт, Рабочее давление: 0–8 атм, Производительность: 380 л/мин, Ресивер: 70 л, V-образное расположение поршней',858.47,645.00,10,4,'/img/AE-705-B1.jpg'),
('AE-1005-B2','Компрессор ECO AE-1005-B2 ременной','Потребляемая мощность: 2,2 кВт, Рабочее давление: 0–8 атм, Производительность: 380 л/мин, Ресивер: 100 л (вертик.)',1101.77,825.00,10,4,'/img/AE-1005-B2.jpg'),
('AE-1005-3','Компрессор ECO AE-1005-3 коаксиальный','Потребляемая мощность: 2.2 кВт, Рабочее давление: 0–8 атм, Производительность: 440 л/мин, Ресивер: 100 л, 2-цилиндровый',766.07,575.00,2,4,'/img/AE-1005-3.jpg'),
('AE-501-4','Компрессор ECO AE-501-4 коаксиальный','Потребляемая мощность: 1.8 кВт, Рабочее давление: 0–8 атм, Производительность: 260 л/мин, Ресивер: 50 л',359.25,270.00,10,4,'/img/AE-501-4.jpg'),
('AE-1005-2','Компрессор ECO AE-1005-2 ременной','Параметры электрической сети: 380 В~, 50 Гц, 3ф, Потребляемая мощность: 3,0 кВт, Производительность: 580 л/мин, Ресивер: 100 л',1182.87,890.00,10,4,'/img/AE-1005-2.jpg'),
('AE-2005-2','Компрессор ECO AE-2005-2 ременной','Параметры электрической сети: 380 В~, 50 Гц, 3ф, Потребляемая мощность: 3,0 кВт, Производительность: 580 л/мин, Ресивер: 200 л',1591.35,1195.00,10,4,'/img/AE-2005-2.jpg'),
('AE-25-OF1','Компрессор ECO AE-25-OF1 безмасляный','Тип: поршневой, безмасляный, Ресивер: 24 л, Потребляемая мощность: 0,8 кВт, Производительность: 140 л/мин, 2-цилиндровый',384.13,290.00,10,4,'/img/AE-25-OF1.jpg'),
('AES-18GM','Манометр для компрессора ECO','Присоединительная резьба - 1/8", Диаметр циферблата - 4см',9.44,7.00,50,2,'/img/AES-18GM.jpg'),
('AEF-12P','Фильтр воздушный для компрессора ECO','Присоединительная резьба: 1/2", Фильтроэлемент: бумажный, Материал корпуса: полимер',6.77,5.00,50,2,'/img/AEF-12P.jpg'),
('AEF-12PC','Фильтроэлемент бумажный для фильтра воздушного AEF-12P','Диаметр - 64 мм, Высота - 35 мм, Для замены в фильтрах AEF-12P',3.67,2.75,50,2,'/img/AEF-12PC.jpg'),
('AEP-22-380','Компрессорная голова ECO AEP-22-380','Производительность: 380 л/мин, Максимальное давление: 8 бар, Тип: поршневой, масляный, Количество цилиндров: 2',278.66,210.00,10,2,'/img/AEP-22-380.jpg'),
('AEP-40-600','Компрессорная голова ECO AEP-40-600','Производительность: 600 л/мин, Максимальное давление: 10 бар, Тип: поршневой, масляный, Количество цилиндров: 2',484.23,365.00,10,2,'/img/AEP-40-600.jpg'),
('AEP-75-900','Компрессорная голова ECO AEP-75-900','Производительность: 900 л/мин, Максимальное давление: 10 бар, Тип: поршневой, масляный, Количество цилиндров: 3',664.45,500.00,5,2,'/img/AEP-75-900.jpg'),
('AES-18PG','Манометр для компрессора ЕСО, резьба 1/8"','Присоединительная резьба: 1/8", Диаметр циферблата: 4 см, Материал корпуса: металл, Давление: 0–12 бар',9.46,7.00,50,2,'/img/AES-18PG.jpg');

-- Добавляем атрибуты для продуктов
INSERT INTO ProductAttributes (ProductId,AttrName,AttrValue)
SELECT Id,'Бренд','AC' FROM Products WHERE Article LIKE 'AC-%'
UNION ALL SELECT Id,'Тип','Компрессор' FROM Products WHERE Article LIKE 'AC-%'
UNION ALL SELECT Id,'Бренд','AE' FROM Products WHERE Article LIKE 'AE-%'
UNION ALL SELECT Id,'Бренд','AEF' FROM Products WHERE Article LIKE 'AEF-%'
UNION ALL SELECT Id,'Тип','Фрезер' FROM Products WHERE Article LIKE 'AEF-%'
UNION ALL SELECT Id,'Бренд','AEP' FROM Products WHERE Article LIKE 'AEP-%'
UNION ALL SELECT Id,'Тип','Пила' FROM Products WHERE Article LIKE 'AEP-%'
UNION ALL SELECT Id,'Бренд','AES' FROM Products WHERE Article LIKE 'AES-%'
UNION ALL SELECT Id,'Тип','Лобзик' FROM Products WHERE Article LIKE 'AES-%'
UNION ALL SELECT Id,'Бренд','AS' FROM Products WHERE Article LIKE 'AS%'
UNION ALL SELECT Id,'Тип','Шуруповерт' FROM Products WHERE Article LIKE 'AS%'
UNION ALL SELECT Id,'Бренд','DG' FROM Products WHERE Article LIKE 'DG%'
UNION ALL SELECT Id,'Тип','Гайковерт' FROM Products WHERE Article LIKE 'DG%'
UNION ALL SELECT Id,'Бренд','EC' FROM Products WHERE Article LIKE 'EC%'
UNION ALL SELECT Id,'Тип','Компрессор' FROM Products WHERE Article LIKE 'EC%'
UNION ALL SELECT Id,'Бренд','HD' FROM Products WHERE Article LIKE 'HD-%'
UNION ALL SELECT Id,'Тип','Набор инструментов' FROM Products WHERE Article LIKE 'HD-%';

GO
