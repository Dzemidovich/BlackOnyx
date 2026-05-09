# План реализации: Программа лояльности клиентов

## Обзор

Реализация системы накопительных скидок для постоянных клиентов с автоматическим отслеживанием суммы заказов, управлением скидками администраторами и уведомлениями клиентов. Система интегрируется в существующую ASP.NET Core архитектуру с PostgreSQL.

## Задачи

- [x] 1. Создать миграции базы данных
  - [x] 1.1 Создать SQL миграцию для расширения таблицы Users
    - Добавить поля TotalOrdersAmount и CurrentDiscount
    - Добавить constraints для валидации значений
    - Создать индексы для оптимизации запросов
    - _Requirements: 2.1, 3.1, 3.3_
  
  - [x] 1.2 Создать SQL миграцию для расширения таблицы Orders
    - Добавить поля AppliedDiscount и DiscountAmount
    - Добавить constraints для валидации
    - _Requirements: 5.3, 5.4_
  
  - [x] 1.3 Создать SQL миграцию для таблицы DiscountHistory
    - Создать таблицу с полями Id, UserId, OldDiscount, NewDiscount, ChangedBy, ChangedAt, Reason
    - Добавить foreign keys и constraints
    - Создать индексы для UserId и ChangedAt
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Обновить модели данных
  - [x] 2.1 Расширить модель User
    - Добавить свойства TotalOrdersAmount и CurrentDiscount
    - Добавить навигационное свойство для DiscountHistory
    - _Requirements: 2.1, 3.1_
  
  - [x] 2.2 Расширить модель Order
    - Добавить свойства AppliedDiscount и DiscountAmount
    - _Requirements: 5.3, 5.4_
  
  - [x] 2.3 Создать модель DiscountHistory
    - Создать класс с полями Id, UserId, OldDiscount, NewDiscount, ChangedBy, ChangedAt, Reason
    - Добавить навигационные свойства User и ChangedByUser
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 2.4 Обновить DbContext
    - Добавить DbSet для DiscountHistory
    - Настроить связи между моделями в OnModelCreating
    - _Requirements: 6.1_

- [x] 3. Создать DTOs для API
  - [x] 3.1 Создать LoyaltyDataDto
    - Поля: UserId, TotalOrdersAmount, CurrentDiscount, RecommendedDiscount, Progress
    - _Requirements: 9.1_
  
  - [x] 3.2 Создать DiscountProgressDto
    - Поля: CurrentAmount, NextThreshold, NextThresholdDiscount, ProgressPercent, IsMaxLevel
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 3.3 Создать DiscountHistoryDto
    - Поля: Id, OldDiscount, NewDiscount, ChangedByName, ChangedAt, Reason
    - _Requirements: 6.5_
  
  - [x] 3.4 Создать UpdateDiscountDto
    - Поля: NewDiscount, Reason
    - _Requirements: 3.2, 6.4_

- [x] 4. Реализовать DiscountCalculationService
  - [x] 4.1 Создать интерфейс IDiscountCalculationService
    - Методы: ApplyDiscount, CalculateDiscountAmount, CalculateProgress
    - _Requirements: 5.1, 4.1_
  
  - [x] 4.2 Реализовать метод ApplyDiscount
    - Применение скидки к цене: price × (1 - discount/100)
    - Валидация входных данных
    - _Requirements: 5.1_
  
  - [ ]* 4.3 Написать property test для ApplyDiscount
    - **Property 9: Применение скидки к цене товара**
    - **Validates: Requirements 5.1**
  
  - [x] 4.4 Реализовать метод CalculateDiscountAmount
    - Расчет суммы скидки: totalAmount × (discount/100)
    - _Requirements: 5.1_
  
  - [x] 4.5 Реализовать метод CalculateProgress
    - Определение следующего порога на основе текущей суммы
    - Расчет процента прогресса до следующего уровня
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 4.6 Написать unit тесты для CalculateProgress
    - Тестирование всех порогов (1000, 5000, 10000 BYN)
    - Тестирование граничных случаев
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Реализовать LoyaltyService
  - [x] 5.1 Создать интерфейс ILoyaltyService
    - Методы: GetUserLoyaltyDataAsync, UpdateUserDiscountAsync, UpdateTotalOrdersAmountAsync, GetRecommendedDiscount, GetDiscountHistoryAsync
    - _Requirements: 2.2, 3.2, 4.1, 6.5, 9.1_
  
  - [x] 5.2 Реализовать метод GetUserLoyaltyDataAsync
    - Получение данных пользователя из БД
    - Расчет рекомендуемой скидки
    - Расчет прогресса до следующего уровня
    - _Requirements: 9.1_
  
  - [ ]* 5.3 Написать property test для GetUserLoyaltyDataAsync
    - **Property 14: API возвращает данные лояльности**
    - **Validates: Requirements 9.1**
  
  - [x] 5.4 Реализовать метод UpdateUserDiscountAsync
    - Валидация нового значения скидки (0-100)
    - Обновление CurrentDiscount в транзакции
    - Создание записи в DiscountHistory
    - Отправка уведомления пользователю
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 7.1_
  
  - [ ]* 5.5 Написать property test для UpdateUserDiscountAsync
    - **Property 5: Валидация процента скидки**
    - **Property 6: Персистентность скидки**
    - **Property 7: Уведомление при изменении скидки**
    - **Property 11: Логирование изменений скидки**
    - **Validates: Requirements 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 7.1**
  
  - [x] 5.6 Реализовать метод UpdateTotalOrdersAmountAsync
    - Обновление TotalOrdersAmount (добавление или вычитание)
    - Проверка на отрицательные значения (минимум 0)
    - Использование транзакций для атомарности
    - _Requirements: 2.2, 2.3, 2.4, 8.1_
  
  - [ ]* 5.7 Написать property test для UpdateTotalOrdersAmountAsync
    - **Property 2: Накопление суммы при завершении заказа**
    - **Property 3: Уменьшение суммы при отмене заказа**
    - **Property 4: Персистентность TotalOrdersAmount**
    - **Validates: Requirements 2.2, 2.3, 2.4, 8.1**
  
  - [x] 5.8 Реализовать метод GetRecommendedDiscount
    - Логика определения рекомендуемой скидки по порогам
    - 0% для < 1000 BYN, 3% для 1000-4999, 5% для 5000-9999, 10% для ≥ 10000
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 5.9 Написать property test для GetRecommendedDiscount
    - **Property 8: Рекомендации скидок по порогам**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  
  - [x] 5.10 Реализовать метод GetDiscountHistoryAsync
    - Получение истории изменений скидок для пользователя
    - Сортировка по ChangedAt DESC
    - Ограничение количества записей (limit)
    - _Requirements: 6.5_
  
  - [ ]* 5.11 Написать property test для GetDiscountHistoryAsync
    - **Property 12: Получение истории изменений**
    - **Validates: Requirements 6.5**

- [ ] 6. Checkpoint - Убедиться что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Создать LoyaltyController
  - [x] 7.1 Создать контроллер с базовой структурой
    - Инжектировать ILoyaltyService
    - Настроить маршрутизацию /api/loyalty
    - Добавить авторизацию
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 7.2 Реализовать GET /api/loyalty/user/{userId}
    - Получение данных лояльности пользователя
    - Проверка прав доступа (пользователь может видеть только свои данные, админ - все)
    - Обработка ошибок (пользователь не найден)
    - _Requirements: 9.1, 9.5_
  
  - [ ]* 7.3 Написать unit тесты для GET /api/loyalty/user/{userId}
    - Тестирование успешного получения данных
    - Тестирование прав доступа
    - Тестирование ошибки 404
    - _Requirements: 9.1, 9.5_
  
  - [x] 7.4 Реализовать PUT /api/loyalty/user/{userId}/discount
    - Обновление скидки пользователя (только для админов)
    - Валидация входных данных
    - Обработка ошибок
    - _Requirements: 9.2, 9.5_
  
  - [ ]* 7.5 Написать property test для PUT /api/loyalty/user/{userId}/discount
    - **Property 15: API обновляет скидку с валидацией**
    - **Validates: Requirements 9.2**
  
  - [x] 7.6 Реализовать GET /api/loyalty/user/{userId}/history
    - Получение истории изменений скидок
    - Проверка прав доступа
    - _Requirements: 9.3_
  
  - [ ]* 7.7 Написать property test для GET /api/loyalty/user/{userId}/history
    - **Property 16: API возвращает историю изменений**
    - **Validates: Requirements 9.3**
  
  - [x] 7.8 Реализовать GET /api/loyalty/thresholds
    - Возврат списка порогов скидок
    - Публичный endpoint (без авторизации)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 7.9 Написать unit тесты для обработки ошибок
    - **Property 18: API возвращает корректные ошибки**
    - **Validates: Requirements 9.5**

- [x] 8. Интегрировать с OrdersController
  - [x] 8.1 Обновить метод создания заказа
    - Получение CurrentDiscount пользователя
    - Применение скидки к TotalAmount
    - Сохранение AppliedDiscount и DiscountAmount в заказе
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ]* 8.2 Написать property test для применения скидки при создании заказа
    - **Property 10: Применение скидки к заказу**
    - **Validates: Requirements 5.2, 5.3, 5.4**
  
  - [x] 8.3 Обновить метод завершения заказа (Complete)
    - Вызов UpdateTotalOrdersAmountAsync для увеличения суммы
    - Обработка ошибок
    - _Requirements: 2.2, 9.4_
  
  - [ ]* 8.4 Написать property test для обновления TotalOrdersAmount при завершении
    - **Property 17: API обновляет TotalOrdersAmount при завершении заказа**
    - **Validates: Requirements 2.2, 9.4**
  
  - [x] 8.5 Обновить метод отмены заказа (Cancel)
    - Вызов UpdateTotalOrdersAmountAsync для уменьшения суммы
    - Проверка что скидка не изменяется
    - _Requirements: 2.3, 8.1, 8.4_
  
  - [ ]* 8.6 Написать property test для отмены заказа
    - **Property 3: Уменьшение суммы при отмене заказа**
    - **Property 13: Сохранение скидки при отмене заказа**
    - **Validates: Requirements 2.3, 8.1, 8.4**

- [ ] 9. Интегрировать с CartController
  - [x] 9.1 Обновить метод расчета корзины
    - Получение CurrentDiscount пользователя
    - Применение скидки к каждому товару в корзине
    - Обновление итоговой суммы с учетом скидки
    - _Requirements: 5.1_
  
  - [ ]* 9.2 Написать unit тесты для расчета корзины со скидкой
    - Тестирование применения скидки к товарам
    - Тестирование корректности итоговой суммы
    - _Requirements: 5.1_

- [ ] 10. Расширить UsersController
  - [x] 10.1 Обновить метод GET /api/users
    - Добавить поля TotalOrdersAmount и CurrentDiscount в ответ
    - Добавить фильтрацию по диапазону TotalOrdersAmount
    - Добавить фильтрацию по диапазону CurrentDiscount
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 10.2 Написать property test для фильтрации пользователей
    - **Property 19: Фильтрация пользователей**
    - **Validates: Requirements 10.3**
  
  - [x] 10.3 Добавить сортировку по TotalOrdersAmount и CurrentDiscount
    - Поддержка ascending и descending сортировки
    - _Requirements: 10.4, 10.5_
  
  - [ ]* 10.4 Написать property test для сортировки пользователей
    - **Property 20: Сортировка пользователей**
    - **Validates: Requirements 10.4, 10.5**

- [ ] 11. Checkpoint - Убедиться что все backend тесты проходят
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Создать frontend компоненты для клиента
  - [x] 12.1 Создать секцию лояльности в профиле клиента
    - Создать HTML разметку в wwwroot/templates/profile.html
    - Отображение текущей скидки и общей суммы заказов
    - Прогресс-бар до следующего уровня
    - Информация о следующем пороге
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 12.2 Создать JavaScript модуль для загрузки данных лояльности
    - Создать функцию loadLoyaltyData() в wwwroot/js/modules/profile.js
    - Вызов API GET /api/loyalty/user/{userId}
    - Отображение данных в UI
    - Обработка ошибок
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 12.3 Создать CSS стили для секции лояльности
    - Стили для прогресс-бара
    - Адаптивная верстка для мобильных устройств
    - _Requirements: 1.1, 1.2, 1.3_

- [-] 13. Создать frontend компоненты для администратора
  - [x] 13.1 Расширить страницу управления пользователями
    - Добавить колонки TotalOrdersAmount и CurrentDiscount в таблицу
    - Добавить фильтры по диапазонам TotalOrdersAmount и CurrentDiscount
    - Добавить сортировку по этим полям
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 13.2 Создать модальное окно для изменения скидки
    - HTML разметка модального окна
    - Отображение текущей скидки и рекомендуемой скидки
    - Поле ввода новой скидки с валидацией (0-100)
    - Поле для причины изменения (опционально)
    - _Requirements: 3.2, 3.3, 4.1, 6.4_
  
  - [x] 13.3 Реализовать JavaScript для модального окна скидки
    - Функция openDiscountModal(userId)
    - Загрузка данных лояльности пользователя
    - Отправка PUT запроса на обновление скидки
    - Обработка успеха и ошибок
    - _Requirements: 3.2, 3.3, 9.2_
  
  - [x] 13.4 Создать модальное окно истории изменений скидок
    - HTML разметка для отображения истории
    - Таблица с колонками: дата, старая скидка, новая скидка, изменил, причина
    - _Requirements: 6.5_
  
  - [x] 13.5 Реализовать JavaScript для истории скидок
    - Функция openDiscountHistoryModal(userId)
    - Загрузка истории через GET /api/loyalty/user/{userId}/history
    - Отображение данных в таблице
    - _Requirements: 6.5_
  
  - [x] 13.6 Создать CSS стили для админских компонентов
    - Стили для модальных окон
    - Стили для таблицы истории
    - Адаптивная верстка
    - _Requirements: 10.1, 10.2_

- [ ] 14. Обновить систему уведомлений
  - [x] 14.1 Создать шаблон уведомления об изменении скидки
    - Текст уведомления с указанием старой и новой скидки
    - Форматирование для отображения в UI
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 14.2 Интегрировать отправку уведомлений в LoyaltyService
    - Вызов NotificationService при изменении скидки
    - Передача данных о старой и новой скидке
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 15. Регистрация сервисов в Dependency Injection
  - [x] 15.1 Зарегистрировать сервисы в Program.cs
    - Добавить builder.Services.AddScoped<ILoyaltyService, LoyaltyService>()
    - Добавить builder.Services.AddScoped<IDiscountCalculationService, DiscountCalculationService>()
    - _Requirements: все_

- [ ] 16. Финальное тестирование и интеграция
  - [ ] 16.1 Выполнить end-to-end тестирование
    - Создание пользователя → создание заказа → завершение → проверка TotalOrdersAmount
    - Назначение скидки администратором → проверка уведомления
    - Создание нового заказа → проверка применения скидки
    - Отмена заказа → проверка уменьшения TotalOrdersAmount
    - _Requirements: все_
  
  - [ ]* 16.2 Выполнить тестирование производительности
    - Измерение времени обновления TotalOrdersAmount (< 100ms)
    - Измерение времени загрузки данных лояльности (< 500ms)
    - Измерение времени API запросов (< 200ms)
    - _Requirements: все_
  
  - [ ] 16.3 Проверить транзакционность операций
    - Тестирование одновременного изменения скидки
    - Тестирование отката при ошибках
    - _Requirements: 2.4, 3.4_

- [ ] 17. Checkpoint - Финальная проверка
  - Ensure all tests pass, ask the user if questions arise.

## Примечания

- Задачи, помеченные `*`, являются опциональными и могут быть пропущены для более быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживаемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property тесты проверяют универсальные свойства корректности
- Unit тесты проверяют конкретные примеры и граничные случаи
- Все операции с базой данных выполняются в транзакциях для обеспечения целостности данных
