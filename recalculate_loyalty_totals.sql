-- Скрипт для пересчета TotalOrdersAmount для существующих пользователей
-- Выполните этот скрипт ПОСЛЕ применения add_loyalty_program.sql

-- Пересчитать сумму завершенных заказов для каждого пользователя
UPDATE "Users" u
SET "TotalOrdersAmount" = COALESCE(
    (
        SELECT SUM(o."TotalAmount")
        FROM "Orders" o
        WHERE o."UserId" = u."Id"
        AND o."Status" IN ('Завершен', 'Completed', 'Доставлен')
    ),
    0
);

-- Проверка результатов
SELECT 
    u."Id",
    u."Email",
    u."FullName",
    u."TotalOrdersAmount",
    u."CurrentDiscount",
    COUNT(o."Id") as "CompletedOrdersCount"
FROM "Users" u
LEFT JOIN "Orders" o ON o."UserId" = u."Id" AND o."Status" IN ('Завершен', 'Completed', 'Доставлен')
GROUP BY u."Id", u."Email", u."FullName", u."TotalOrdersAmount", u."CurrentDiscount"
ORDER BY u."TotalOrdersAmount" DESC;
