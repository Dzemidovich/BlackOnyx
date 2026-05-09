-- PostgreSQL скрипт для ToolShopDB
-- Конвертировано из T-SQL

-- Пересоздать базу нужно вручную через pgAdmin или psql:
-- DROP DATABASE IF EXISTS toolshopdb;
-- CREATE DATABASE toolshopdb WITH ENCODING 'UTF8';
-- Затем подключиться к ней и выполнить этот скрипт.

-- Удаление таблиц если существуют (для повторного запуска)
DROP TABLE IF EXISTS ImportLogs CASCADE;
DROP TABLE IF EXISTS ImportRows CASCADE;
DROP TABLE IF EXISTS ImportJobs CASCADE;
DROP TABLE IF EXISTS Notifications CASCADE;
DROP TABLE IF EXISTS OrderItems CASCADE;
DROP TABLE IF EXISTS Orders CASCADE;
DROP TABLE IF EXISTS CartItems CASCADE;
DROP TABLE IF EXISTS Carts CASCADE;
DROP TABLE IF EXISTS ProductAttributes CASCADE;
DROP TABLE IF EXISTS Products CASCADE;
DROP TABLE IF EXISTS Categories CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- Таблицы
CREATE TABLE Users (
    Id SERIAL PRIMARY KEY,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(150),
    Role VARCHAR(20) NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE Categories (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    ParentId INT NULL
);

CREATE TABLE Products (
    Id SERIAL PRIMARY KEY,
    Article VARCHAR(50) UNIQUE NOT NULL,
    Name VARCHAR(200) NOT NULL,
    Description TEXT,
    Price DECIMAL(10,2) NOT NULL,
    CostPrice DECIMAL(10,2) DEFAULT 0,
    Stock INT NOT NULL,
    CategoryId INT,
    ImageUrl VARCHAR(255),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ProductAttributes (
    Id SERIAL PRIMARY KEY,
    ProductId INT NOT NULL,
    AttrName VARCHAR(100),
    AttrValue VARCHAR(100)
);

CREATE TABLE Carts (
    Id SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE CartItems (
    Id SERIAL PRIMARY KEY,
    CartId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(10,2)
);

CREATE TABLE Orders (
    Id SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    TotalAmount DECIMAL(10,2),
    Status VARCHAR(30),
    CreatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE OrderItems (
    Id SERIAL PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Total DECIMAL(10,2) NOT NULL
);

CREATE TABLE Notifications (
    Id SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    Title VARCHAR(200),
    Message VARCHAR(500),
    Type VARCHAR(50),
    IsRead BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ImportJobs (
    Id SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    FileName VARCHAR(255) NOT NULL,
    Status VARCHAR(50) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    CompletedAt TIMESTAMP NULL,
    TotalRows INT NOT NULL,
    ProcessedRows INT NOT NULL,
    ErrorsCount INT NOT NULL,
    ImportVersion VARCHAR(50),
    ImportMode VARCHAR(50),
    IsDryRun BOOLEAN DEFAULT FALSE
);

CREATE TABLE ImportRows (
    Id SERIAL PRIMARY KEY,
    ImportJobId INT NOT NULL,
    RowNumber INT NOT NULL,
    RawData TEXT NOT NULL,
    Status VARCHAR(50) NOT NULL,
    ErrorMessage VARCHAR(500),
    ProductId INT NULL
);

CREATE TABLE ImportLogs (
    Id SERIAL PRIMARY KEY,
    ImportJobId INT NOT NULL,
    RowNumber INT NOT NULL,
    MessageType VARCHAR(50) NOT NULL,
    Message VARCHAR(1000) NOT NULL,
    OldValue VARCHAR(500),
    NewValue VARCHAR(500),
    ImportVersion VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT NOW()
);

-- Внешние ключи
ALTER TABLE Products ADD CONSTRAINT fk_products_category FOREIGN KEY (CategoryId) REFERENCES Categories(Id);
ALTER TABLE ProductAttributes ADD CONSTRAINT fk_attrs_product FOREIGN KEY (ProductId) REFERENCES Products(Id);
ALTER TABLE Carts ADD CONSTRAINT fk_carts_user FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE CartItems ADD CONSTRAINT fk_cartitems_cart FOREIGN KEY (CartId) REFERENCES Carts(Id);
ALTER TABLE CartItems ADD CONSTRAINT fk_cartitems_product FOREIGN KEY (ProductId) REFERENCES Products(Id);
ALTER TABLE Orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE OrderItems ADD CONSTRAINT fk_orderitems_order FOREIGN KEY (OrderId) REFERENCES Orders(Id);
ALTER TABLE OrderItems ADD CONSTRAINT fk_orderitems_product FOREIGN KEY (ProductId) REFERENCES Products(Id);
ALTER TABLE Notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE ImportJobs ADD CONSTRAINT fk_importjobs_user FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE ImportRows ADD CONSTRAINT fk_importrows_job FOREIGN KEY (ImportJobId) REFERENCES ImportJobs(Id);
ALTER TABLE ImportLogs ADD CONSTRAINT fk_importlogs_job FOREIGN KEY (ImportJobId) REFERENCES ImportJobs(Id);

-- Уникальный индекс
CREATE UNIQUE INDEX UQ_ProductAttributes_ProductId_AttrName ON ProductAttributes(ProductId, AttrName);

-- Начальные данные
INSERT INTO Users (Email, PasswordHash, FullName, Role) VALUES
('admin@toolshop.by', 'admin123', 'Администратор', 'Admin'),
('manager@toolshop.by', 'manager123', 'Менеджер', 'Manager'),
('company@toolshop.by', 'company123', 'ООО "СтройМастер"', 'Customer'),
('user@toolshop.by', 'user123', 'Иван Петров', 'Customer');

INSERT INTO Categories (Name) VALUES
('Электроинструмент'),
('Ручной инструмент'),
('Сварочное оборудование'),
('Компрессоры');

INSERT INTO Products (Article, Name, Description, Price, CostPrice, Stock, CategoryId, ImageUrl) VALUES
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

-- Атрибуты продуктов
INSERT INTO ProductAttributes (ProductId, AttrName, AttrValue)
SELECT Id, 'Бренд', 'AC' FROM Products WHERE Article LIKE 'AC-%'
UNION ALL SELECT Id, 'Тип', 'Компрессор' FROM Products WHERE Article LIKE 'AC-%'
UNION ALL SELECT Id, 'Бренд', 'AE' FROM Products WHERE Article LIKE 'AE-%'
UNION ALL SELECT Id, 'Бренд', 'AEF' FROM Products WHERE Article LIKE 'AEF-%'
UNION ALL SELECT Id, 'Тип', 'Фрезер' FROM Products WHERE Article LIKE 'AEF-%'
UNION ALL SELECT Id, 'Бренд', 'AEP' FROM Products WHERE Article LIKE 'AEP-%'
UNION ALL SELECT Id, 'Тип', 'Пила' FROM Products WHERE Article LIKE 'AEP-%'
UNION ALL SELECT Id, 'Бренд', 'AES' FROM Products WHERE Article LIKE 'AES-%'
UNION ALL SELECT Id, 'Тип', 'Лобзик' FROM Products WHERE Article LIKE 'AES-%'
UNION ALL SELECT Id, 'Бренд', 'AS' FROM Products WHERE Article LIKE 'AS%'
UNION ALL SELECT Id, 'Тип', 'Шуруповерт' FROM Products WHERE Article LIKE 'AS%'
UNION ALL SELECT Id, 'Бренд', 'DG' FROM Products WHERE Article LIKE 'DG%'
UNION ALL SELECT Id, 'Тип', 'Гайковерт' FROM Products WHERE Article LIKE 'DG%'
UNION ALL SELECT Id, 'Бренд', 'EC' FROM Products WHERE Article LIKE 'EC%'
UNION ALL SELECT Id, 'Тип', 'Компрессор' FROM Products WHERE Article LIKE 'EC%'
UNION ALL SELECT Id, 'Бренд', 'HD' FROM Products WHERE Article LIKE 'HD-%'
UNION ALL SELECT Id, 'Тип', 'Набор инструментов' FROM Products WHERE Article LIKE 'HD-%';
