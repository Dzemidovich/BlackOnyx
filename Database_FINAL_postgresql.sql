-- ============================================================================
-- ФИНАЛЬНАЯ ВЕРСИЯ БД ToolShopDB для PostgreSQL
-- Дата: 2026-05-01
-- Включает: таблицы, индексы, constraints, хранимые процедуры, представления
-- ============================================================================

-- Пересоздание базы (выполнить вручную через pgAdmin или psql):
-- DROP DATABASE IF EXISTS toolshopdb;
-- CREATE DATABASE toolshopdb WITH ENCODING 'UTF8';
-- Затем подключиться к ней и выполнить этот скрипт.

-- ============================================================================
-- 1. УДАЛЕНИЕ СУЩЕСТВУЮЩИХ ОБЪЕКТОВ
-- ============================================================================

-- Удаление представлений
DROP VIEW IF EXISTS v_pending_registrations CASCADE;
DROP VIEW IF EXISTS v_active_products CASCADE;
DROP VIEW IF EXISTS v_order_details CASCADE;
DROP VIEW IF EXISTS v_user_statistics CASCADE;

-- Удаление функций и процедур
DROP FUNCTION IF EXISTS approve_registration CASCADE;
DROP FUNCTION IF EXISTS reject_registration CASCADE;
DROP FUNCTION IF EXISTS get_product_stock CASCADE;
DROP FUNCTION IF EXISTS update_product_stock CASCADE;
DROP FUNCTION IF EXISTS calculate_order_total CASCADE;

-- Удаление таблиц
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

-- ============================================================================
-- 2. СОЗДАНИЕ ТАБЛИЦ
-- ============================================================================

-- Таблица пользователей
CREATE TABLE Users (
    Id SERIAL PRIMARY KEY,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(150),
    Role VARCHAR(20) NOT NULL DEFAULT 'Customer',
    IsActive BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    
    -- Поля для юридических лиц (B2B)
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
    
    -- Поля модерации регистраций
    RegistrationStatus VARCHAR(20) DEFAULT 'pending',
    RejectionReason TEXT,
    ModeratedAt TIMESTAMP,
    ModeratedBy INT,
    
    CONSTRAINT chk_role CHECK (Role IN ('Admin', 'Manager', 'Customer')),
    CONSTRAINT chk_registration_status CHECK (RegistrationStatus IN ('pending', 'approved', 'rejected')),
    CONSTRAINT chk_unp_format CHECK (Unp IS NULL OR Unp ~ '^[0-9]{9}$')
);

-- Таблица категорий
CREATE TABLE Categories (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    ParentId INT NULL,
    CONSTRAINT fk_categories_parent FOREIGN KEY (ParentId) REFERENCES Categories(Id) ON DELETE SET NULL
);

-- Таблица товаров
CREATE TABLE Products (
    Id SERIAL PRIMARY KEY,
    Article VARCHAR(50) UNIQUE NOT NULL,
    Name VARCHAR(200) NOT NULL,
    Description TEXT,
    Price DECIMAL(10,2) NOT NULL,
    CostPrice DECIMAL(10,2) DEFAULT 0,
    Stock INT NOT NULL DEFAULT 0,
    CategoryId INT,
    ImageUrl VARCHAR(255),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_products_category FOREIGN KEY (CategoryId) REFERENCES Categories(Id) ON DELETE SET NULL,
    CONSTRAINT chk_price_positive CHECK (Price >= 0),
    CONSTRAINT chk_cost_price_positive CHECK (CostPrice >= 0),
    CONSTRAINT chk_stock_non_negative CHECK (Stock >= 0)
);

-- Таблица атрибутов товаров
CREATE TABLE ProductAttributes (
    Id SERIAL PRIMARY KEY,
    ProductId INT NOT NULL,
    AttrName VARCHAR(100) NOT NULL,
    AttrValue VARCHAR(100),
    
    CONSTRAINT fk_attr