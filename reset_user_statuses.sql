-- Скрипт для сброса статусов существующих пользователей
-- Все пользователи (кроме админов) будут переведены в статус ожидания модерации

-- Обновляем всех пользователей кроме администраторов
UPDATE users 
SET 
    registrationstatus = 'pending',
    isactive = false,
    rejectionreason = NULL,
    moderatedat = NULL,
    moderatedby = NULL
WHERE role != 'Admin';

-- Проверяем результат
SELECT 
    id, 
    email, 
    fullname, 
    role,
    registrationstatus, 
    isactive, 
    createdat 
FROM users 
ORDER BY createdat DESC;
