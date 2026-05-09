-- Удаление строгих constraint для банковских полей
-- Это позволит сохранять пустые строки и значения любой длины

ALTER TABLE Users DROP CONSTRAINT IF EXISTS chk_bank_code_format;
ALTER TABLE Users DROP CONSTRAINT IF EXISTS chk_checking_account_format;

SELECT 'Constraints удалены успешно!' AS result;
