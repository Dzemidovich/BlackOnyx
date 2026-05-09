-- ============================================
-- Database_SEED_DATA.sql
-- Test data for BlackOnyx Tool Shop
-- Production deployment seed data
-- ============================================

-- ============================================
-- 1. Admin User
-- ============================================
-- Password: Admin123! (BCrypt hashed)
INSERT INTO Users (Email, PasswordHash, FullName, Role, IsActive, RegistrationStatus, IsLegalEntity, CreatedAt) VALUES
('admin@blackonyx.by', '$2a$11$xQZH8J5qZ5qZ5qZ5qZ5qZOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'Администратор Системы', 'Admin', TRUE, 'approved', FALSE, NOW());

-- ============================================
-- 2. Test Customer Accounts (B2C and B2B)
-- ============================================

-- B2C Customer 1 (Approved)
INSERT INTO Users (Email, PasswordHash, FullName, Role, IsActive, RegistrationStatus, IsLegalEntity, CreatedAt) VALUES
('ivan.petrov@mail.by', '$2a$11$xQZH8J5qZ5qZ5qZ5qZ5qZOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'Иван Петров', 'Customer', TRUE, 'approved', FALSE, NOW() - INTERVAL '15 days');

-- B2C Customer 2 (Approved)
INSERT INTO Users (Email, PasswordHash, FullName, Role, IsActive, RegistrationStatus, IsLegalEntity, CreatedAt) VALUES
('maria.sidorova@gmail.com', '$2a$11$xQZH8J5qZ5qZ5qZ5qZ5qZOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'Мария Сидорова', 'Customer', TRUE, 'approved', FALSE, NOW() - INTERVAL '20 days');

-- B2B Customer 1 (Approved)
INSERT INTO Users (Email, PasswordHash, FullName, Role, IsActive, RegistrationStatus, IsLegalEntity, CompanyName, Unp, LegalAddress, ActualAddress, BankName, BankCode, CheckingAccount, DirectorName, ContactPhone, ContactPerson, CreatedAt, ModeratedAt, ModeratedBy) VALUES
('info@stroymasterby.by', '$2a$11$xQZH8J5qZ5qZ5qZ5qZ5qZOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'ООО "СтройМастер"', 'Customer', TRUE, 'approved', TRUE, 'ООО "СтройМастер"', '123456789', 'г. Минск, ул. Промышленная, д. 15', 'г. Минск, ул. Промышленная, д. 15', 'ОАО "Беларусбанк"', '153001749', 'BY86AKBB30120000000000000933', 'Иванов Петр Сергеевич', '+375291234567', 'Сидоров Алексей', NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days', 1);

-- B2B Customer 2 (Pending - awaiting moderation)
INSERT INTO Users (Email, PasswordHash, FullName, Role, IsActive, RegistrationStatus, IsLegalEntity, CompanyName, Unp, LegalAddress, ActualAddress, BankName, BankCode, CheckingAccount, DirectorName, ContactPhone, ContactPerson, CreatedAt) VALUES
('contact@remontpro.by', '$2a$11$xQZH8J5qZ5qZ5qZ5qZ5qZOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'ИП "РемонтПро"', 'Customer', FALSE, 'pending', TRUE, 'ИП "РемонтПро"', '987654321', 'г. Гомель, пр. Ленина, д. 45', 'г. Гомель, пр. Ленина, д. 45', 'ОАО "Приорбанк"', '151501735', 'BY13PJCB30120000000000000840', 'Козлов Дмитрий Владимирович', '+375297654321', 'Козлов Дмитрий', NOW() - INTERVAL '2 days');

-- B2B Customer 3 (Rejected)
INSERT INTO Users (Email, PasswordHash, FullName, Role, IsActive, RegistrationStatus, IsLegalEntity, CompanyName, Unp, RejectionReason, CreatedAt, ModeratedAt, ModeratedBy) VALUES
('fake@company.com', '$2a$11$xQZH8J5qZ5qZ5qZ5qZ5qZOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'Фейковая Компания', 'Customer', FALSE, 'rejected', TRUE, 'Фейковая Компания', '111111111', 'Недостоверные данные. УНП не найден в реестре.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 1);

-- ============================================
-- 3. Product Categories
-- ============================================
INSERT INTO Categories (Id, Name, ParentId) VALUES
(1, 'Электроинструменты', NULL),
(2, 'Ручной инструмент', NULL),
(3, 'Измерительные приборы', NULL),
(4, 'Расходные материалы', NULL),
(5, 'Оборудование', NULL),
(6, 'Дрели и шуруповерты', 1),
(7, 'Пилы', 1),
(8, 'Шлифовальные машины', 1),
(9, 'Компрессоры', 5),
(10, 'Сварочное оборудование', 5);

-- Reset sequence for Categories
SELECT setval('categories_id_seq', (SELECT MAX(Id) FROM Categories));

-- ============================================
-- 4. Products (20-30 items)
-- ============================================

-- Компрессоры
INSERT INTO Products (Article, Name, Description, Price, CostPrice, Stock, CategoryId, ImageUrl, IsActive, CreatedAt) VALUES
('AE-501-1', 'Компрессор ECO AE-501-1', 'Напряжение/частота: 220В/50Гц, Мощность: 1,8 кВт, Производительность: 260 л/мин, Объем масла: 0,3 л, Объём ресивера: 50 л', 332.70, 250.00, 8, 9, '/img/AE-501-1.jpg', TRUE, NOW() - INTERVAL '60 days'),
('AE-251-3', 'Компрессор ECO AE-251-3 коаксиальный', 'Потребляемая мощность: 1.5 кВт, Рабочее давление: 0–8 атм, Производительность: 235 л/мин, Ресивер: 24 л', 314.02, 235.00, 10, 9, '/img/AE-251-3.jpg', TRUE, NOW() - INTERVAL '55 days'),
('AE-501-3', 'Компрессор ECO AE-501-3 коаксиальный', 'Потребляемая мощность: 1.8 кВт, Рабочее давление: 0–8 атм, Производительность: 260 л/мин, Ресивер: 50 л', 385.86, 290.00, 10, 9, '/img/AE-501-3.jpg', TRUE, NOW() - INTERVAL '50 days'),
('AE-502-3', 'Компрессор ECO AE-502-3 коаксиальный', 'Потребляемая мощность: 2.2 кВт, Рабочее давление: 0–8 атм, Производительность: 440 л/мин, Ресивер: 50 л, 2-цилиндровый', 625.36, 470.00, 10, 9, '/img/AE-502-3.jpg', TRUE, NOW() - INTERVAL '45 days'),
('AE-1005-B1', 'Компрессор ECO AE-1005-B1 ременной', 'Потребляемая мощность: 2,2 кВт, Рабочее давление: 0–8 атм, Производительность: 380 л/мин, Ресивер: 100 л, V-образное расположение поршней', 967.68, 725.00, 5, 9, '/img/AE-1005-B1.jpg', TRUE, NOW() - INTERVAL '40 days'),

-- Дрели и шуруповерты
('DRL-500', 'Дрель ударная Makita HP1640', 'Мощность: 680 Вт, Патрон: 13 мм, Скорость: 0-2800 об/мин, Вес: 1.7 кг', 189.50, 145.00, 15, 6, '/img/DRL-500.jpg', TRUE, NOW() - INTERVAL '35 days'),
('DRL-600', 'Дрель-шуруповерт Bosch GSR 12V-15', 'Напряжение: 12 В, Патрон: 10 мм, Крутящий момент: 30 Нм, Вес: 1.0 кг', 245.00, 185.00, 12, 6, '/img/DRL-600.jpg', TRUE, NOW() - INTERVAL '30 days'),
('SHR-100', 'Шуруповерт аккумуляторный DeWalt DCD771C2', 'Напряжение: 18 В, Патрон: 13 мм, Крутящий момент: 42 Нм, 2 аккумулятора', 425.00, 320.00, 8, 6, '/img/SHR-100.jpg', TRUE, NOW() - INTERVAL '28 days'),

-- Пилы
('SAW-200', 'Циркулярная пила Makita 5008MG', 'Мощность: 1800 Вт, Диск: 210 мм, Глубина пропила: 76 мм, Вес: 5.1 кг', 385.00, 290.00, 7, 7, '/img/SAW-200.jpg', TRUE, NOW() - INTERVAL '25 days'),
('SAW-300', 'Электролобзик Bosch PST 900 PEL', 'Мощность: 620 Вт, Глубина пропила дерево: 90 мм, Частота хода: 500-3100 ход/мин', 195.00, 150.00, 10, 7, '/img/SAW-300.jpg', TRUE, NOW() - INTERVAL '22 days'),
('SAW-400', 'Торцовочная пила Metabo KGS 216 M', 'Мощность: 1500 Вт, Диск: 216 мм, Угол наклона: 47°, Лазерная указка', 565.00, 425.00, 5, 7, '/img/SAW-400.jpg', TRUE, NOW() - INTERVAL '20 days'),

-- Шлифовальные машины
('GRN-100', 'УШМ (болгарка) Makita GA9020', 'Мощность: 2200 Вт, Диск: 230 мм, Скорость: 6600 об/мин, Вес: 4.7 кг', 285.00, 215.00, 12, 8, '/img/GRN-100.jpg', TRUE, NOW() - INTERVAL '18 days'),
('GRN-200', 'УШМ (болгарка) Bosch GWS 750-125', 'Мощность: 750 Вт, Диск: 125 мм, Скорость: 11000 об/мин, Вес: 1.9 кг', 145.00, 110.00, 15, 8, '/img/GRN-200.jpg', TRUE, NOW() - INTERVAL '15 days'),
('SND-100', 'Ленточная шлифмашина DeWalt DWP352VS', 'Мощность: 1010 Вт, Лента: 75x533 мм, Скорость: 75-457 м/мин, Пылесборник', 425.00, 320.00, 6, 8, '/img/SND-100.jpg', TRUE, NOW() - INTERVAL '12 days'),

-- Измерительные приборы
('MSR-100', 'Лазерный дальномер Bosch GLM 50 C', 'Дальность: 50 м, Точность: ±1.5 мм, Bluetooth, Цветной дисплей', 185.00, 140.00, 10, 3, '/img/MSR-100.jpg', TRUE, NOW() - INTERVAL '10 days'),
('MSR-200', 'Лазерный уровень Makita SK104Z', 'Дальность: 15 м, Точность: ±0.3 мм/м, Самовыравнивание, Крест', 125.00, 95.00, 12, 3, '/img/MSR-200.jpg', TRUE, NOW() - INTERVAL '8 days'),
('MSR-300', 'Мультиметр цифровой Fluke 117', 'Напряжение: 600 В, Ток: 10 А, Сопротивление: 40 МОм, Автоматический выбор диапазона', 245.00, 185.00, 8, 3, '/img/MSR-300.jpg', TRUE, NOW() - INTERVAL '6 days'),

-- Ручной инструмент
('HND-100', 'Набор ключей комбинированных 8-19 мм (12 шт)', 'Материал: хром-ванадий, Размеры: 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 мм, Чехол', 65.00, 50.00, 20, 2, '/img/HND-100.jpg', TRUE, NOW() - INTERVAL '5 days'),
('HND-200', 'Набор отверток 6 шт (шлиц, крест)', 'Материал: CrV сталь, Рукоятка: двухкомпонентная, Размеры: SL3, SL5, SL6, PH0, PH1, PH2', 35.00, 27.00, 25, 2, '/img/HND-200.jpg', TRUE, NOW() - INTERVAL '4 days'),
('HND-300', 'Молоток слесарный 500г с фибергласовой ручкой', 'Вес: 500 г, Материал: кованая сталь, Ручка: фибергласс, Антивибрационная', 28.00, 21.00, 30, 2, '/img/HND-300.jpg', TRUE, NOW() - INTERVAL '3 days'),

-- Расходные материалы
('CON-100', 'Диски отрезные 125x1.0x22 мм (10 шт)', 'Диаметр: 125 мм, Толщина: 1.0 мм, Посадка: 22 мм, Для металла', 18.50, 14.00, 50, 4, '/img/CON-100.jpg', TRUE, NOW() - INTERVAL '2 days'),
('CON-200', 'Диски шлифовальные 125x6.0x22 мм (10 шт)', 'Диаметр: 125 мм, Толщина: 6.0 мм, Посадка: 22 мм, Для металла', 22.00, 17.00, 45, 4, '/img/CON-200.jpg', TRUE, NOW() - INTERVAL '1 day'),
('CON-300', 'Сверла по металлу HSS 1-10 мм (19 шт)', 'Материал: HSS, Размеры: 1.0-10.0 мм с шагом 0.5 мм, Металлический кейс', 42.00, 32.00, 35, 4, '/img/CON-300.jpg', TRUE, NOW()),

-- Сварочное оборудование
('WLD-100', 'Сварочный инвертор Ресанта САИ-220', 'Ток: 10-220 А, Напряжение: 220 В, Диаметр электрода: 1.6-5.0 мм, Вес: 4.9 кг', 285.00, 215.00, 8, 10, '/img/WLD-100.jpg', TRUE, NOW() - INTERVAL '30 days'),
('WLD-200', 'Сварочная маска хамелеон Forte MC-4100', 'Затемнение: DIN 9-13, Время срабатывания: 1/25000 с, Питание: солнечная батарея + батарейка', 65.00, 50.00, 15, 10, '/img/WLD-200.jpg', TRUE, NOW() - INTERVAL '25 days'),
('WLD-300', 'Электроды сварочные АНО-21 3 мм (5 кг)', 'Диаметр: 3 мм, Вес: 5 кг, Для углеродистых сталей, Постоянный/переменный ток', 38.00, 29.00, 40, 10, '/img/WLD-300.jpg', TRUE, NOW() - INTERVAL '20 days');

-- ============================================
-- 5. Product Attributes
-- ============================================
INSERT INTO ProductAttributes (ProductId, AttrName, AttrValue) VALUES
-- Компрессоры
(1, 'Бренд', 'ECO'),
(1, 'Тип', 'Компрессор'),
(1, 'Напряжение', '220В'),
(2, 'Бренд', 'ECO'),
(2, 'Тип', 'Компрессор'),
(2, 'Напряжение', '220В'),
(3, 'Бренд', 'ECO'),
(3, 'Тип', 'Компрессор'),
(4, 'Бренд', 'ECO'),
(4, 'Тип', 'Компрессор'),
(5, 'Бренд', 'ECO'),
(5, 'Тип', 'Компрессор'),
-- Дрели
(6, 'Бренд', 'Makita'),
(6, 'Тип', 'Дрель'),
(6, 'Мощность', '680 Вт'),
(7, 'Бренд', 'Bosch'),
(7, 'Тип', 'Дрель-шуруповерт'),
(7, 'Напряжение', '12В'),
(8, 'Бренд', 'DeWalt'),
(8, 'Тип', 'Шуруповерт'),
(8, 'Напряжение', '18В'),
-- Пилы
(9, 'Бренд', 'Makita'),
(9, 'Тип', 'Циркулярная пила'),
(10, 'Бренд', 'Bosch'),
(10, 'Тип', 'Электролобзик'),
(11, 'Бренд', 'Metabo'),
(11, 'Тип', 'Торцовочная пила'),
-- Шлифовальные
(12, 'Бренд', 'Makita'),
(12, 'Тип', 'УШМ'),
(13, 'Бренд', 'Bosch'),
(13, 'Тип', 'УШМ'),
(14, 'Бренд', 'DeWalt'),
(14, 'Тип', 'Ленточная шлифмашина'),
-- Измерительные
(15, 'Бренд', 'Bosch'),
(15, 'Тип', 'Лазерный дальномер'),
(16, 'Бренд', 'Makita'),
(16, 'Тип', 'Лазерный уровень'),
(17, 'Бренд', 'Fluke'),
(17, 'Тип', 'Мультиметр'),
-- Ручной инструмент
(18, 'Тип', 'Набор ключей'),
(18, 'Материал', 'Хром-ванадий'),
(19, 'Тип', 'Набор отверток'),
(19, 'Материал', 'CrV сталь'),
(20, 'Тип', 'Молоток'),
(20, 'Вес', '500г'),
-- Расходные материалы
(21, 'Тип', 'Диски отрезные'),
(21, 'Диаметр', '125 мм'),
(22, 'Тип', 'Диски шлифовальные'),
(22, 'Диаметр', '125 мм'),
(23, 'Тип', 'Сверла'),
(23, 'Материал', 'HSS'),
-- Сварочное
(24, 'Бренд', 'Ресанта'),
(24, 'Тип', 'Сварочный инвертор'),
(25, 'Бренд', 'Forte'),
(25, 'Тип', 'Сварочная маска'),
(26, 'Тип', 'Электроды'),
(26, 'Диаметр', '3 мм');

-- ============================================
-- 6. Test Orders (5-10 orders)
-- ============================================

-- Order 1: Ivan Petrov (B2C) - Completed
INSERT INTO Orders (UserId, TotalAmount, Status, CreatedAt, Comment) VALUES
(2, 760.36, 'Завершен', NOW() - INTERVAL '28 days', 'Доставка до подъезда');

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Total) VALUES
(1, 1, 2, 332.70, 665.40),
(1, 13, 1, 145.00, 145.00);

-- Order 2: Maria Sidorova (B2C) - Completed
INSERT INTO Orders (UserId, TotalAmount, Status, CreatedAt, Comment) VALUES
(3, 453.00, 'Завершен', NOW() - INTERVAL '25 days', NULL);

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Total) VALUES
(2, 6, 1, 189.50, 189.50),
(2, 15, 1, 185.00, 185.00),
(2, 18, 1, 65.00, 65.00);

-- Order 3: StroiMaster (B2B) - В обработке
INSERT INTO Orders (UserId, TotalAmount, Status, CreatedAt, Comment) VALUES
(4, 2850.00, 'В обработке', NOW() - INTERVAL '15 days', 'Требуется счет-фактура. Оплата по безналу.');

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Total) VALUES
(3, 5, 2, 967.68, 1935.36),
(3, 24, 3, 285.00, 855.00),
(3, 18, 1, 65.00, 65.00);

-- Order 4: Ivan Petrov (B2C) - Новый
INSERT INTO Orders (UserId, TotalAmount, Status, CreatedAt, Comment) VALUES
(2, 810.00, 'Новый', NOW() - INTERVAL '5 days', 'Позвоните перед доставкой');

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Total) VALUES
(4, 9, 1, 385.00, 385.00),
(4, 8, 1, 425.00, 425.00);

-- Order 5: Maria Sidorova (B2C) - Завершен
INSERT INTO Orders (UserId, TotalAmount, Status, CreatedAt, Comment) VALUES
(3, 125.00, 'Завершен', NOW() - INTERVAL '12 days', NULL);

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Total) VALUES
(5, 16, 1, 125.00, 125.00);

-- Order 6: StroiMaster (B2B) - Завершен
INSERT INTO Orders (UserId, TotalAmount, Status, CreatedAt, Comment) VALUES
(4, 1540.00, 'Завершен', NOW() - INTERVAL '22 days', 'Оплачено. Спасибо за быструю доставку!');

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Total) VALUES
(6, 3, 4, 385.86, 1543.44);

-- Order 7: Ivan Petrov (B2C) - Завершен
INSERT INTO Orders (UserId, TotalAmount, Status, CreatedAt, Comment) VALUES
(2, 195.00, 'Завершен', NOW() - INTERVAL '18 days', NULL);

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Total) VALUES
(7, 10, 1, 195.00, 195.00);

-- Order 8: Maria Sidorova (B2C) - Отменен
INSERT INTO Orders (UserId, TotalAmount, Status, CreatedAt, Comment) VALUES
(3, 565.00, 'Отменен', NOW() - INTERVAL '8 days', 'Передумала, извините');

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Total) VALUES
(8, 11, 1, 565.00, 565.00);

-- Order 9: StroiMaster (B2B) - Новый
INSERT INTO Orders (UserId, TotalAmount, Status, CreatedAt, Comment) VALUES
(4, 2145.00, 'Новый', NOW() - INTERVAL '2 days', 'Срочный заказ. Нужно до конца недели.');

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Total) VALUES
(9, 12, 3, 285.00, 855.00),
(9, 14, 2, 425.00, 850.00),
(9, 21, 20, 18.50, 370.00),
(9, 22, 10, 22.00, 220.00);

-- Order 10: Ivan Petrov (B2C) - В обработке
INSERT INTO Orders (UserId, TotalAmount, Status, CreatedAt, Comment) VALUES
(2, 350.00, 'В обработке', NOW() - INTERVAL '3 days', NULL);

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Total) VALUES
(10, 17, 1, 245.00, 245.00),
(10, 23, 2, 42.00, 84.00),
(10, 20, 1, 28.00, 28.00);

-- ============================================
-- 7. Notifications (sample)
-- ============================================
INSERT INTO Notifications (UserId, Title, Message, Type, IsRead, CreatedAt) VALUES
(2, 'Заказ оформлен', 'Ваш заказ #4 успешно оформлен и принят в обработку', 'order', FALSE, NOW() - INTERVAL '5 days'),
(3, 'Заказ доставлен', 'Ваш заказ #5 доставлен. Спасибо за покупку!', 'order', TRUE, NOW() - INTERVAL '12 days'),
(4, 'Заказ в обработке', 'Ваш заказ #3 находится в обработке. Счет-фактура будет выслана на email.', 'order', TRUE, NOW() - INTERVAL '15 days'),
(2, 'Новое поступление', 'Поступили новые модели сварочных инверторов!', 'promo', FALSE, NOW() - INTERVAL '7 days'),
(4, 'Специальное предложение', 'Скидка 10% для корпоративных клиентов на компрессоры!', 'promo', FALSE, NOW() - INTERVAL '10 days');

-- ============================================
-- Seed Data Complete
-- ============================================

-- Verify data
SELECT 'Users created: ' || COUNT(*) FROM Users;
SELECT 'Categories created: ' || COUNT(*) FROM Categories;
SELECT 'Products created: ' || COUNT(*) FROM Products;
SELECT 'Orders created: ' || COUNT(*) FROM Orders;
SELECT 'OrderItems created: ' || COUNT(*) FROM OrderItems;
