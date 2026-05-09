-- Восстановление старых паролей для возможности входа
USE ToolShopDB;
GO

UPDATE Users SET PasswordHash = 'admin123' WHERE Email = 'admin@toolshop.by';
UPDATE Users SET PasswordHash = 'manager123' WHERE Email = 'manager@toolshop.by';
UPDATE Users SET PasswordHash = 'company123' WHERE Email = 'company@toolshop.by';
UPDATE Users SET PasswordHash = 'user123' WHERE Email = 'user@toolshop.by';
UPDATE Users SET PasswordHash = 'Dima2005' WHERE Email = 'StefanenkovDimas@gmail.com';
UPDATE Users SET IsActive = 1 WHERE Email = 'StefanenkovDimas@gmail.com';

PRINT 'Пароли восстановлены!';
SELECT Email, Role, PasswordHash FROM Users;
GO
