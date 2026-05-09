-- ============================================
-- Database_PRODUCTION.sql
-- Complete PostgreSQL database schema for BlackOnyx Tool Shop
-- Production deployment script
-- ============================================

-- Drop existing tables (for clean installation)
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

-- ============================================
-- Table: Users
-- ============================================
CREATE TABLE Users (
    Id SERIAL PRIMARY KEY,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(150),
    Role VARCHAR(20) NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    
    -- B2B Legal Entity Fields
    CompanyName VARCHAR(255),
    Unp VARCHAR(9),
    LegalAddress TEXT,
    ActualAddress TEXT,
    BankName VARCHAR(255),
    BankCode VARCHAR(9),
    CheckingAccount VARCHAR(28),
    DirectorName VARCHAR(255),
    ContactPhone VARCHAR(20),
    ContactPerson VARCHAR(255),
    IsLegalEntity BOOLEAN DEFAULT FALSE,
    
    -- Registration Moderation Fields
    RegistrationStatus VARCHAR(20) DEFAULT 'pending',
    RejectionReason TEXT,
    ModeratedAt TIMESTAMP,
    ModeratedBy INT,
    
    CONSTRAINT chk_role CHECK (Role IN ('Admin', 'Manager', 'Customer')),
    CONSTRAINT chk_registration_status CHECK (RegistrationStatus IN ('pending', 'approved', 'rejected')),
    CONSTRAINT chk_unp_format CHECK (Unp IS NULL OR Unp ~ '^[0-9]{9}$')
);

-- ============================================
-- Table: Categories
-- ============================================
CREATE TABLE Categories (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    ParentId INT NULL,
    CONSTRAINT fk_categories_parent FOREIGN KEY (ParentId) REFERENCES Categories(Id) ON DELETE SET NULL
);

-- ============================================
-- Table: Products
-- ============================================
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
    CreatedAt TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_products_category FOREIGN KEY (CategoryId) REFERENCES Categories(Id) ON DELETE SET NULL
);

-- ============================================
-- Table: ProductAttributes
-- ============================================
CREATE TABLE ProductAttributes (
    Id SERIAL PRIMARY KEY,
    ProductId INT NOT NULL,
    AttrName VARCHAR(100),
    AttrValue VARCHAR(100),
    CONSTRAINT fk_attrs_product FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);

-- ============================================
-- Table: Carts
-- ============================================
CREATE TABLE Carts (
    Id SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_carts_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- ============================================
-- Table: CartItems
-- ============================================
CREATE TABLE CartItems (
    Id SERIAL PRIMARY KEY,
    CartId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(10,2),
    CONSTRAINT fk_cartitems_cart FOREIGN KEY (CartId) REFERENCES Carts(Id) ON DELETE CASCADE,
    CONSTRAINT fk_cartitems_product FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);

-- ============================================
-- Table: Orders
-- ============================================
CREATE TABLE Orders (
    Id SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    TotalAmount DECIMAL(10,2),
    Status VARCHAR(30),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    Comment TEXT,
    CONSTRAINT fk_orders_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT chk_order_status CHECK (Status IN ('Новый', 'В обработке', 'Завершен', 'Отменен'))
);

-- ============================================
-- Table: OrderItems
-- ============================================
CREATE TABLE OrderItems (
    Id SERIAL PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Total DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_orderitems_order FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitems_product FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);

-- ============================================
-- Table: Notifications
-- ============================================
CREATE TABLE Notifications (
    Id SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    Title VARCHAR(200),
    Message VARCHAR(500),
    Type VARCHAR(50),
    IsRead BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_notifications_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- ============================================
-- Table: ImportJobs
-- ============================================
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
    IsDryRun BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_importjobs_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- ============================================
-- Table: ImportRows
-- ============================================
CREATE TABLE ImportRows (
    Id SERIAL PRIMARY KEY,
    ImportJobId INT NOT NULL,
    RowNumber INT NOT NULL,
    RawData TEXT NOT NULL,
    Status VARCHAR(50) NOT NULL,
    ErrorMessage VARCHAR(500),
    ProductId INT NULL,
    CONSTRAINT fk_importrows_job FOREIGN KEY (ImportJobId) REFERENCES ImportJobs(Id) ON DELETE CASCADE
);

-- ============================================
-- Table: ImportLogs
-- ============================================
CREATE TABLE ImportLogs (
    Id SERIAL PRIMARY KEY,
    ImportJobId INT NOT NULL,
    RowNumber INT NOT NULL,
    MessageType VARCHAR(50) NOT NULL,
    Message VARCHAR(1000) NOT NULL,
    OldValue VARCHAR(500),
    NewValue VARCHAR(500),
    ImportVersion VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_importlogs_job FOREIGN KEY (ImportJobId) REFERENCES ImportJobs(Id) ON DELETE CASCADE
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Users indexes
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(Role);
CREATE INDEX IX_Users_RegistrationStatus ON Users(RegistrationStatus);
CREATE INDEX IX_Users_IsLegalEntity ON Users(IsLegalEntity);
CREATE INDEX IX_Users_Unp ON Users(Unp);

-- Products indexes
CREATE UNIQUE INDEX IX_Products_Article ON Products(Article);
CREATE INDEX IX_Products_Name ON Products(Name);
CREATE INDEX IX_Products_CategoryId ON Products(CategoryId);
CREATE INDEX IX_Products_IsActive ON Products(IsActive);

-- ProductAttributes indexes
CREATE INDEX IX_Attributes_Name ON ProductAttributes(AttrName);
CREATE UNIQUE INDEX UQ_ProductAttributes_ProductId_AttrName ON ProductAttributes(ProductId, AttrName);

-- Orders indexes
CREATE INDEX IX_Orders_UserId ON Orders(UserId);
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Orders_CreatedAt ON Orders(CreatedAt);

-- OrderItems indexes
CREATE INDEX IX_OrderItems_OrderId ON OrderItems(OrderId);
CREATE INDEX IX_OrderItems_ProductId ON OrderItems(ProductId);

-- Carts indexes
CREATE INDEX IX_Carts_UserId ON Carts(UserId);

-- CartItems indexes
CREATE INDEX IX_CartItems_CartId ON CartItems(CartId);
CREATE INDEX IX_CartItems_ProductId ON CartItems(ProductId);

-- Notifications indexes
CREATE INDEX IX_Notifications_UserId ON Notifications(UserId);
CREATE INDEX IX_Notifications_IsRead ON Notifications(IsRead);

-- ImportJobs indexes
CREATE INDEX IX_ImportJobs_UserId ON ImportJobs(UserId);
CREATE INDEX IX_ImportJobs_Status ON ImportJobs(Status);

-- ImportRows indexes
CREATE INDEX IX_ImportRows_ImportJobId ON ImportRows(ImportJobId);

-- ImportLogs indexes
CREATE INDEX IX_ImportLogs_ImportJobId ON ImportLogs(ImportJobId);

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE Users IS 'User accounts with B2B support and registration moderation';
COMMENT ON COLUMN Users.RegistrationStatus IS 'Registration status: pending, approved, rejected';
COMMENT ON COLUMN Users.IsLegalEntity IS 'TRUE for B2B customers, FALSE for B2C';
COMMENT ON COLUMN Users.Unp IS 'Tax ID (УНП) - 9 digits for legal entities';

COMMENT ON TABLE Products IS 'Product catalog with pricing and inventory';
COMMENT ON COLUMN Products.Article IS 'Unique product SKU/article number';
COMMENT ON COLUMN Products.CostPrice IS 'Purchase cost for margin calculation';

COMMENT ON TABLE Orders IS 'Customer orders with status tracking';
COMMENT ON COLUMN Orders.Status IS 'Order status: Новый, В обработке, Завершен, Отменен';
COMMENT ON COLUMN Orders.Comment IS 'Customer comment for the order';

COMMENT ON TABLE ImportJobs IS 'Product import job tracking';
COMMENT ON TABLE ImportRows IS 'Individual rows from import files';
COMMENT ON TABLE ImportLogs IS 'Detailed import operation logs';

-- ============================================
-- Database Setup Complete
-- ============================================
