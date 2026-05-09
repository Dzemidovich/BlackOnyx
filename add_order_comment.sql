-- Добавление поля комментария к заказам

ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "Comment" TEXT;

-- Проверка
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Orders' AND column_name = 'Comment';

SELECT '✓ Поле Comment добавлено к Orders' AS result;
