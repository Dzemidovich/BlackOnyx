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

-- Import System Tables
CREATE TABLE ImportJobs(
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    Status NVARCHAR(50) NOT NULL, -- pending, processing, completed, failed
    CreatedAt DATETIME DEFAULT GETDATE(),
    CompletedAt DATETIME NULL,
    TotalRows INT NOT NULL,
    ProcessedRows INT NOT NULL,
    ErrorsCount INT NOT NULL,
    ImportVersion NVARCHAR(50),
    ImportMode NVARCHAR(50), -- upsert, update_only, create_only
    IsDryRun BIT DEFAULT 0
);

CREATE TABLE ImportRows(
    Id INT IDENTITY PRIMARY KEY,
    ImportJobId INT NOT NULL,
    RowNumber INT NOT NULL,
    RawData NVARCHAR(MAX) NOT NULL, -- JSON of parsed CSV row
    Status NVARCHAR(50) NOT NULL, -- pending, processed, error
    ErrorMessage NVARCHAR(500),
    ProductId INT NULL -- After processing
);

CREATE TABLE ImportLogs(
    Id INT IDENTITY PRIMARY KEY,
    ImportJobId INT NOT NULL,
    RowNumber INT NOT NULL,
    MessageType NVARCHAR(50) NOT NULL, -- info, warning, error
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

-- Import System Foreign Keys
ALTER TABLE ImportJobs ADD FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE ImportRows ADD FOREIGN KEY (ImportJobId) REFERENCES ImportJobs(Id);
ALTER TABLE ImportLogs ADD FOREIGN KEY (ImportJobId) REFERENCES ImportJobs(Id);

-- Add unique index for ProductAttributes
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

INSERT INTO Products (Article,Name,Description,Price,Stock,CategoryId,ImageUrl) VALUES
-- Электроинструмент (20 товаров)
('BOSCH-GSB-13','Дрель Bosch GSB 13','Ударная дрель 600 Вт',189.90,10,1,'/img/gsb13.jpg'),
('MAKITA-9558','УШМ Makita 9558','Болгарка 840 Вт',159.50,7,1,'/img/9558.jpg'),
('DEWALT-DWE4051','УШМ DeWalt DWE4051','Болгарка 800 Вт',179.00,5,1,'/img/dwe4051.jpg'),
('BOSCH-GSR-1200','Шуруповерт Bosch GSR 1200','Аккумульный шуруповерт 12V',129.50,15,1,'/img/gsr1200.jpg'),
('MAKITA-DF331','Перфоратор Makita DF331','Перфоратор 800 Вт',299.00,8,1,'/img/df331.jpg'),
('HITACHI-DV16VSS','Перфоратор Hitachi DV16VSS','Перфоратор с функцией долбления',349.90,4,1,'/img/dv16vss.jpg'),
('METABO-BE701','Шлифмашина Metabo BE701','Эксцентриковая шлифмашина 250 Вт',199.00,12,1,'/img/be701.jpg'),
('BOSCH-GWS-750','УШМ Bosch GWS 750','Угловая шлифмашина 750 Вт',89.90,20,1,'/img/gws750.jpg'),
('MAKITA-HR2450','Перфоратор Makita HR2450','Роторный перфоратор 780 Вт',459.00,3,1,'/img/hr2450.jpg'),
('DEWALT-DCD791','Дрель-шуруповерт DeWalt DCD791','Бесщеточный шуруповерт 20V',399.00,6,1,'/img/dcd791.jpg'),
('INTERTOOL-DT-0310','Дрель Intertool DT-0310','Сетевая дрель 500 Вт',79.90,25,1,'/img/dt0310.jpg'),
('SPARKY-MAB-1000','УШМ Sparky MAB 1000','Болгарка 1000 Вт',119.00,9,1,'/img/mab1000.jpg'),
('BOSCH-GST-85PBE','Пила Bosch GST 85PBE','Сабельная пила 850 Вт',269.00,5,1,'/img/gst85pbe.jpg'),
('MAKITA-JR3070CT','Пила Makita JR3070CT','Сабельная пила с лазером',329.90,4,1,'/img/jr3070ct.jpg'),
('EINHELL-TE-SM-36','Шлифмашина Einhell TE-SM 36','Многофункциональная шлифмашина',149.50,11,1,'/img/te-sm36.jpg'),
('BLACKDECKER-BDCJS20','Шуруповерт Black+Decker BDCJS20','Литий-ионный шуруповерт 3.6V',59.90,30,1,'/img/bdcjs20.jpg'),
('BOSCH-GHO-26-82D','Пила Bosch GHO 26-82D','Погружная пила 710 Вт',599.00,2,1,'/img/gho2682d.jpg'),
('MAKITA-5007MG','УШМ Makita 5007MG','Болгарка 125мм 720 Вт',99.00,18,1,'/img/5007mg.jpg'),
('DEWALT-DCS391','Пила DeWalt DCS391','Аккумульная сабельная пила 20V',499.00,3,1,'/img/dcs391.jpg'),
('METABO-KGS305M','Пила Metabo KGS305M','Дисковая пила 1600 Вт',399.00,7,1,'/img/kgs305m.jpg'),

-- Ручной инструмент (15 товаров)
('STANLEY-SET-1','Набор инструментов Stanley','Набор 120 предметов',249.00,3,2,'/img/stanley.jpg'),
('BAHCO-8220','Набор ключей Bahco 8220','Комбинированные ключи 8-22мм',89.90,15,2,'/img/8220.jpg'),
('GEDORE-SET-30','Набор инструментов Gedore','Набор 30 предметов профессиональный',179.50,8,2,'/img/gedore.jpg'),
('KNIPEX-8603180','Кусачки Knipex 8603180','Бокорезы 180мм хром-ванадий',45.00,22,2,'/img/8603180.jpg'),
('STANLEY-84-102','Молоток Stanley 84-102','Молоток 500г фибергласс',19.90,40,2,'/img/84102.jpg'),
('BAHCO-1-110-08','Отвертка Bahco 1-110-08','Набор отверток 8шт',29.90,35,2,'/img/111008.jpg'),
('GEDORE-2357270','Ключ Gedore 2357270','Разводной ключ 270мм',39.90,28,2,'/img/2357270.jpg'),
('KNIPEX-8701180','Плоскогубцы Knipex 8701180','Универсальные 180мм',32.50,30,2,'/img/8701180.jpg'),
('STANLEY-43-511','Ножовка Stanley 43-511','По дереву 350мм',12.90,50,2,'/img/43511.jpg'),
('BAHCO-250','Напильник Bahco 250','Плоский напильник 250мм',15.50,45,2,'/img/250.jpg'),
('GEDORE-SET-25','Набор ключей Gedore','Метрические ключи 6-22мм',69.90,12,2,'/img/set25.jpg'),
('KNIPEX-0201200','Ключ Knipex 0201200','Трубный ключ 200мм',49.00,18,2,'/img/0201200.jpg'),
('STANLEY-55-509','Уровень Stanley 55-509','Пузырьковый уровень 600мм',24.90,25,2,'/img/55509.jpg'),
('BAHCO-3834','Клещи Bahco 3834','Комбинированные клещи 200мм',35.00,20,2,'/img/3834.jpg'),
('GEDORE-600','Молоток Gedore 600','Слесарный молоток 300г',22.50,32,2,'/img/600.jpg'),

-- Сварочное оборудование (10 товаров)
('RESANTA-SAI-160','Сварочный аппарат Resanta SAI-160','Инверторный сварочник 160А',299.00,6,3,'/img/sai160.jpg'),
('BLUEWELD-PRO-200','Сварочник BlueWeld Pro-200','MMA сварочник 200А',449.00,4,3,'/img/pro200.jpg'),
('RESANTA-SAI-220','Инвертор Resanta SAI-220','Сварочный инвертор 220А',399.00,5,3,'/img/sai220.jpg'),
('FOXWELD-MASTER-250','Сварочник FoxWeld Master-250','Многофункциональный 250А',599.00,3,3,'/img/master250.jpg'),
('RESANTA-TIG-200P','TIG сварочник Resanta TIG-200P','Импульсный TIG 200А',899.00,2,3,'/img/tig200p.jpg'),
('BLUEWELD-INVERTER-180','Инвертор BlueWeld Inverter-180','Компактный сварочник 180А',349.00,7,3,'/img/inverter180.jpg'),
('FOXWELD-MIG-200','MIG/MAG FoxWeld MIG-200','Полуавтоматический сварочник',1299.00,1,3,'/img/mig200.jpg'),
('RESANTA-MIG-160','MIG аппарат Resanta MIG-160','Сварочник с проволокой',799.00,3,3,'/img/mig160.jpg'),
('BLUEWELD-PLASMA-40','Плазморез BlueWeld Plasma-40','Плазменный резак 40А',699.00,4,3,'/img/plasma40.jpg'),
('FOXWELD-CUT-50','Плазморез FoxWeld Cut-50','Инверторный плазморез 50А',899.00,2,3,'/img/cut50.jpg'),

-- Компрессоры (5 товаров)
('FUBAG-ECO-25','Компрессор Fubag Eco-25','Поршневой компрессор 25л',189.00,8,4,'/img/eco25.jpg'),
('ABAC-B5900','Компрессор Abac B5900','Масляный компрессор 90л',899.00,3,4,'/img/b5900.jpg'),
('FUBAG-PRO-50','Компрессор Fubag Pro-50','Профессиональный 50л',349.00,5,4,'/img/pro50.jpg'),
('REMESA-ECO-24','Компрессор Remesa Eco-24','Бюджетный компрессор 24л',159.00,10,4,'/img/eco24.jpg'),
('FUBAG-BASIS-6','Компрессор Fubag Basis-6','Компактный 6л',79.90,15,4,'/img/basis6.jpg');

INSERT INTO ProductAttributes (ProductId,AttrName,AttrValue)
-- Электроинструмент атрибуты
SELECT Id,'Бренд','Bosch' FROM Products WHERE Article='BOSCH-GSB-13'
UNION ALL SELECT Id,'Мощность','600 Вт' FROM Products WHERE Article='BOSCH-GSB-13'
UNION ALL SELECT Id,'Тип','Дрель' FROM Products WHERE Article='BOSCH-GSB-13'
UNION ALL SELECT Id,'Бренд','Makita' FROM Products WHERE Article='MAKITA-9558'
UNION ALL SELECT Id,'Мощность','840 Вт' FROM Products WHERE Article='MAKITA-9558'
UNION ALL SELECT Id,'Тип','УШМ' FROM Products WHERE Article='MAKITA-9558'
UNION ALL SELECT Id,'Бренд','DeWalt' FROM Products WHERE Article='DEWALT-DWE4051'
UNION ALL SELECT Id,'Мощность','800 Вт' FROM Products WHERE Article='DEWALT-DWE4051'
UNION ALL SELECT Id,'Тип','УШМ' FROM Products WHERE Article='DEWALT-DWE4051'
UNION ALL SELECT Id,'Бренд','Bosch' FROM Products WHERE Article='BOSCH-GSR-1200'
UNION ALL SELECT Id,'Мощность','Аккумулятор' FROM Products WHERE Article='BOSCH-GSR-1200'
UNION ALL SELECT Id,'Тип','Шуруповерт' FROM Products WHERE Article='BOSCH-GSR-1200'
UNION ALL SELECT Id,'Бренд','Makita' FROM Products WHERE Article='MAKITA-DF331'
UNION ALL SELECT Id,'Мощность','800 Вт' FROM Products WHERE Article='MAKITA-DF331'
UNION ALL SELECT Id,'Тип','Перфоратор' FROM Products WHERE Article='MAKITA-DF331'
UNION ALL SELECT Id,'Бренд','Hitachi' FROM Products WHERE Article='HITACHI-DV16VSS'
UNION ALL SELECT Id,'Мощность','650 Вт' FROM Products WHERE Article='HITACHI-DV16VSS'
UNION ALL SELECT Id,'Тип','Перфоратор' FROM Products WHERE Article='HITACHI-DV16VSS'
UNION ALL SELECT Id,'Бренд','Metabo' FROM Products WHERE Article='METABO-BE701'
UNION ALL SELECT Id,'Мощность','250 Вт' FROM Products WHERE Article='METABO-BE701'
UNION ALL SELECT Id,'Тип','Шлифмашина' FROM Products WHERE Article='METABO-BE701'
UNION ALL SELECT Id,'Бренд','Bosch' FROM Products WHERE Article='BOSCH-GWS-750'
UNION ALL SELECT Id,'Мощность','750 Вт' FROM Products WHERE Article='BOSCH-GWS-750'
UNION ALL SELECT Id,'Тип','УШМ' FROM Products WHERE Article='BOSCH-GWS-750'
UNION ALL SELECT Id,'Бренд','Makita' FROM Products WHERE Article='MAKITA-HR2450'
UNION ALL SELECT Id,'Мощность','780 Вт' FROM Products WHERE Article='MAKITA-HR2450'
UNION ALL SELECT Id,'Тип','Перфоратор' FROM Products WHERE Article='MAKITA-HR2450'
UNION ALL SELECT Id,'Бренд','DeWalt' FROM Products WHERE Article='DEWALT-DCD791'
UNION ALL SELECT Id,'Мощность','Аккумулятор' FROM Products WHERE Article='DEWALT-DCD791'
UNION ALL SELECT Id,'Тип','Шуруповерт' FROM Products WHERE Article='DEWALT-DCD791'
UNION ALL SELECT Id,'Бренд','Intertool' FROM Products WHERE Article='INTERTOOL-DT-0310'
UNION ALL SELECT Id,'Мощность','500 Вт' FROM Products WHERE Article='INTERTOOL-DT-0310'
UNION ALL SELECT Id,'Тип','Дрель' FROM Products WHERE Article='INTERTOOL-DT-0310'
UNION ALL SELECT Id,'Бренд','Sparky' FROM Products WHERE Article='SPARKY-MAB-1000'
UNION ALL SELECT Id,'Мощность','1000 Вт' FROM Products WHERE Article='SPARKY-MAB-1000'
UNION ALL SELECT Id,'Тип','УШМ' FROM Products WHERE Article='SPARKY-MAB-1000'
UNION ALL SELECT Id,'Бренд','Bosch' FROM Products WHERE Article='BOSCH-GST-85PBE'
UNION ALL SELECT Id,'Мощность','850 Вт' FROM Products WHERE Article='BOSCH-GST-85PBE'
UNION ALL SELECT Id,'Тип','Пила' FROM Products WHERE Article='BOSCH-GST-85PBE'
UNION ALL SELECT Id,'Бренд','Makita' FROM Products WHERE Article='MAKITA-JR3070CT'
UNION ALL SELECT Id,'Мощность','1010 Вт' FROM Products WHERE Article='MAKITA-JR3070CT'
UNION ALL SELECT Id,'Тип','Пила' FROM Products WHERE Article='MAKITA-JR3070CT'
UNION ALL SELECT Id,'Бренд','Einhell' FROM Products WHERE Article='EINHELL-TE-SM-36'
UNION ALL SELECT Id,'Мощность','350 Вт' FROM Products WHERE Article='EINHELL-TE-SM-36'
UNION ALL SELECT Id,'Тип','Шлифмашина' FROM Products WHERE Article='EINHELL-TE-SM-36'
UNION ALL SELECT Id,'Бренд','Black+Decker' FROM Products WHERE Article='BLACKDECKER-BDCJS20'
UNION ALL SELECT Id,'Мощность','Аккумулятор' FROM Products WHERE Article='BLACKDECKER-BDCJS20'
UNION ALL SELECT Id,'Тип','Шуруповерт' FROM Products WHERE Article='BLACKDECKER-BDCJS20'
UNION ALL SELECT Id,'Бренд','Bosch' FROM Products WHERE Article='BOSCH-GHO-26-82D'
UNION ALL SELECT Id,'Мощность','710 Вт' FROM Products WHERE Article='BOSCH-GHO-26-82D'
UNION ALL SELECT Id,'Тип','Пила' FROM Products WHERE Article='BOSCH-GHO-26-82D'
UNION ALL SELECT Id,'Бренд','Makita' FROM Products WHERE Article='MAKITA-5007MG'
UNION ALL SELECT Id,'Мощность','720 Вт' FROM Products WHERE Article='MAKITA-5007MG'
UNION ALL SELECT Id,'Тип','УШМ' FROM Products WHERE Article='MAKITA-5007MG'
UNION ALL SELECT Id,'Бренд','DeWalt' FROM Products WHERE Article='DEWALT-DCS391'
UNION ALL SELECT Id,'Мощность','Аккумулятор' FROM Products WHERE Article='DEWALT-DCS391'
UNION ALL SELECT Id,'Тип','Пила' FROM Products WHERE Article='DEWALT-DCS391'
UNION ALL SELECT Id,'Бренд','Metabo' FROM Products WHERE Article='METABO-KGS305M'
UNION ALL SELECT Id,'Мощность','1600 Вт' FROM Products WHERE Article='METABO-KGS305M'
UNION ALL SELECT Id,'Тип','Пила' FROM Products WHERE Article='METABO-KGS305M'

-- Ручной инструмент атрибуты
UNION ALL SELECT Id,'Бренд','Stanley' FROM Products WHERE Article='STANLEY-SET-1'
UNION ALL SELECT Id,'Тип','Набор' FROM Products WHERE Article='STANLEY-SET-1'
UNION ALL SELECT Id,'Количество','120 предметов' FROM Products WHERE Article='STANLEY-SET-1'
UNION ALL SELECT Id,'Бренд','Bahco' FROM Products WHERE Article='BAHCO-8220'
UNION ALL SELECT Id,'Тип','Ключи' FROM Products WHERE Article='BAHCO-8220'
UNION ALL SELECT Id,'Размер','8-22мм' FROM Products WHERE Article='BAHCO-8220'
UNION ALL SELECT Id,'Бренд','Gedore' FROM Products WHERE Article='GEDORE-SET-30'
UNION ALL SELECT Id,'Тип','Набор' FROM Products WHERE Article='GEDORE-SET-30'
UNION ALL SELECT Id,'Количество','30 предметов' FROM Products WHERE Article='GEDORE-SET-30'
UNION ALL SELECT Id,'Бренд','Knipex' FROM Products WHERE Article='KNIPEX-8603180'
UNION ALL SELECT Id,'Тип','Кусачки' FROM Products WHERE Article='KNIPEX-8603180'
UNION ALL SELECT Id,'Размер','180мм' FROM Products WHERE Article='KNIPEX-8603180'
UNION ALL SELECT Id,'Бренд','Stanley' FROM Products WHERE Article='STANLEY-84-102'
UNION ALL SELECT Id,'Тип','Молоток' FROM Products WHERE Article='STANLEY-84-102'
UNION ALL SELECT Id,'Вес','500г' FROM Products WHERE Article='STANLEY-84-102'
UNION ALL SELECT Id,'Бренд','Bahco' FROM Products WHERE Article='BAHCO-1-110-08'
UNION ALL SELECT Id,'Тип','Отвертки' FROM Products WHERE Article='BAHCO-1-110-08'
UNION ALL SELECT Id,'Количество','8шт' FROM Products WHERE Article='BAHCO-1-110-08'
UNION ALL SELECT Id,'Бренд','Gedore' FROM Products WHERE Article='GEDORE-2357270'
UNION ALL SELECT Id,'Тип','Разводной ключ' FROM Products WHERE Article='GEDORE-2357270'
UNION ALL SELECT Id,'Размер','270мм' FROM Products WHERE Article='GEDORE-2357270'
UNION ALL SELECT Id,'Бренд','Knipex' FROM Products WHERE Article='KNIPEX-8701180'
UNION ALL SELECT Id,'Тип','Плоскогубцы' FROM Products WHERE Article='KNIPEX-8701180'
UNION ALL SELECT Id,'Размер','180мм' FROM Products WHERE Article='KNIPEX-8701180'
UNION ALL SELECT Id,'Бренд','Stanley' FROM Products WHERE Article='STANLEY-43-511'
UNION ALL SELECT Id,'Тип','Ножовка' FROM Products WHERE Article='STANLEY-43-511'
UNION ALL SELECT Id,'Размер','350мм' FROM Products WHERE Article='STANLEY-43-511'
UNION ALL SELECT Id,'Бренд','Bahco' FROM Products WHERE Article='BAHCO-250'
UNION ALL SELECT Id,'Тип','Напильник' FROM Products WHERE Article='BAHCO-250'
UNION ALL SELECT Id,'Размер','250мм' FROM Products WHERE Article='BAHCO-250'
UNION ALL SELECT Id,'Бренд','Gedore' FROM Products WHERE Article='GEDORE-SET-25'
UNION ALL SELECT Id,'Тип','Ключи' FROM Products WHERE Article='GEDORE-SET-25'
UNION ALL SELECT Id,'Размер','6-22мм' FROM Products WHERE Article='GEDORE-SET-25'
UNION ALL SELECT Id,'Бренд','Knipex' FROM Products WHERE Article='KNIPEX-0201200'
UNION ALL SELECT Id,'Тип','Трубный ключ' FROM Products WHERE Article='KNIPEX-0201200'
UNION ALL SELECT Id,'Размер','200мм' FROM Products WHERE Article='KNIPEX-0201200'
UNION ALL SELECT Id,'Бренд','Stanley' FROM Products WHERE Article='STANLEY-55-509'
UNION ALL SELECT Id,'Тип','Уровень' FROM Products WHERE Article='STANLEY-55-509'
UNION ALL SELECT Id,'Размер','600мм' FROM Products WHERE Article='STANLEY-55-509'
UNION ALL SELECT Id,'Бренд','Bahco' FROM Products WHERE Article='BAHCO-3834'
UNION ALL SELECT Id,'Тип','Клещи' FROM Products WHERE Article='BAHCO-3834'
UNION ALL SELECT Id,'Размер','200мм' FROM Products WHERE Article='BAHCO-3834'
UNION ALL SELECT Id,'Бренд','Gedore' FROM Products WHERE Article='GEDORE-600'
UNION ALL SELECT Id,'Тип','Молоток' FROM Products WHERE Article='GEDORE-600'
UNION ALL SELECT Id,'Вес','300г' FROM Products WHERE Article='GEDORE-600'

-- Сварочное оборудование атрибуты
UNION ALL SELECT Id,'Бренд','Resanta' FROM Products WHERE Article='RESANTA-SAI-160'
UNION ALL SELECT Id,'Тип','Сварочник' FROM Products WHERE Article='RESANTA-SAI-160'
UNION ALL SELECT Id,'Мощность','160А' FROM Products WHERE Article='RESANTA-SAI-160'
UNION ALL SELECT Id,'Бренд','BlueWeld' FROM Products WHERE Article='BLUEWELD-PRO-200'
UNION ALL SELECT Id,'Тип','Сварочник' FROM Products WHERE Article='BLUEWELD-PRO-200'
UNION ALL SELECT Id,'Мощность','200А' FROM Products WHERE Article='BLUEWELD-PRO-200'
UNION ALL SELECT Id,'Бренд','Resanta' FROM Products WHERE Article='RESANTA-SAI-220'
UNION ALL SELECT Id,'Тип','Инвертор' FROM Products WHERE Article='RESANTA-SAI-220'
UNION ALL SELECT Id,'Мощность','220А' FROM Products WHERE Article='RESANTA-SAI-220'
UNION ALL SELECT Id,'Бренд','FoxWeld' FROM Products WHERE Article='FOXWELD-MASTER-250'
UNION ALL SELECT Id,'Тип','Сварочник' FROM Products WHERE Article='FOXWELD-MASTER-250'
UNION ALL SELECT Id,'Мощность','250А' FROM Products WHERE Article='FOXWELD-MASTER-250'
UNION ALL SELECT Id,'Бренд','Resanta' FROM Products WHERE Article='RESANTA-TIG-200P'
UNION ALL SELECT Id,'Тип','TIG сварочник' FROM Products WHERE Article='RESANTA-TIG-200P'
UNION ALL SELECT Id,'Мощность','200А' FROM Products WHERE Article='RESANTA-TIG-200P'
UNION ALL SELECT Id,'Бренд','BlueWeld' FROM Products WHERE Article='BLUEWELD-INVERTER-180'
UNION ALL SELECT Id,'Тип','Инвертор' FROM Products WHERE Article='BLUEWELD-INVERTER-180'
UNION ALL SELECT Id,'Мощность','180А' FROM Products WHERE Article='BLUEWELD-INVERTER-180'
UNION ALL SELECT Id,'Бренд','FoxWeld' FROM Products WHERE Article='FOXWELD-MIG-200'
UNION ALL SELECT Id,'Тип','MIG/MAG' FROM Products WHERE Article='FOXWELD-MIG-200'
UNION ALL SELECT Id,'Мощность','200А' FROM Products WHERE Article='FOXWELD-MIG-200'
UNION ALL SELECT Id,'Бренд','Resanta' FROM Products WHERE Article='RESANTA-MIG-160'
UNION ALL SELECT Id,'Тип','MIG аппарат' FROM Products WHERE Article='RESANTA-MIG-160'
UNION ALL SELECT Id,'Мощность','160А' FROM Products WHERE Article='RESANTA-MIG-160'
UNION ALL SELECT Id,'Бренд','BlueWeld' FROM Products WHERE Article='BLUEWELD-PLASMA-40'
UNION ALL SELECT Id,'Тип','Плазморез' FROM Products WHERE Article='BLUEWELD-PLASMA-40'
UNION ALL SELECT Id,'Мощность','40А' FROM Products WHERE Article='BLUEWELD-PLASMA-40'
UNION ALL SELECT Id,'Бренд','FoxWeld' FROM Products WHERE Article='FOXWELD-CUT-50'
UNION ALL SELECT Id,'Тип','Плазморез' FROM Products WHERE Article='FOXWELD-CUT-50'
UNION ALL SELECT Id,'Мощность','50А' FROM Products WHERE Article='FOXWELD-CUT-50'

-- Компрессоры атрибуты
UNION ALL SELECT Id,'Бренд','Fubag' FROM Products WHERE Article='FUBAG-ECO-25'
UNION ALL SELECT Id,'Тип','Компрессор' FROM Products WHERE Article='FUBAG-ECO-25'
UNION ALL SELECT Id,'Объём','25л' FROM Products WHERE Article='FUBAG-ECO-25'
UNION ALL SELECT Id,'Бренд','Abac' FROM Products WHERE Article='ABAC-B5900'
UNION ALL SELECT Id,'Тип','Компрессор' FROM Products WHERE Article='ABAC-B5900'
UNION ALL SELECT Id,'Объём','90л' FROM Products WHERE Article='ABAC-B5900'
UNION ALL SELECT Id,'Бренд','Fubag' FROM Products WHERE Article='FUBAG-PRO-50'
UNION ALL SELECT Id,'Тип','Компрессор' FROM Products WHERE Article='FUBAG-PRO-50'
UNION ALL SELECT Id,'Объём','50л' FROM Products WHERE Article='FUBAG-PRO-50'
UNION ALL SELECT Id,'Бренд','Remesa' FROM Products WHERE Article='REMESA-ECO-24'
UNION ALL SELECT Id,'Тип','Компрессор' FROM Products WHERE Article='REMESA-ECO-24'
UNION ALL SELECT Id,'Объём','24л' FROM Products WHERE Article='REMESA-ECO-24'
UNION ALL SELECT Id,'Бренд','Fubag' FROM Products WHERE Article='FUBAG-BASIS-6'
UNION ALL SELECT Id,'Тип','Компрессор' FROM Products WHERE Article='FUBAG-BASIS-6'
UNION ALL SELECT Id,'Объём','6л' FROM Products WHERE Article='FUBAG-BASIS-6';
