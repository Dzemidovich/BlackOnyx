// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Admin pages module - all admin functionality
// Must be loaded after app.js and core/api.js
Object.assign(app, {
            async renderAdmin() {
                // Load categories for admin panel
                const categories = await this.fetchApi('categories');
                const allProducts = await this.fetchApi('products?includeInactive=true'); // Assuming we modify the API to include inactive products

                return `
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">Панель администратора</h1>
                            <p class="page-subtitle">Управление каталогом товаров и категориями</p>
                        </div>
                        <div class="flex gap-3">
                            <button class="btn btn-primary" onclick="app.showCreateProductModal()">
                                <i class="fas fa-plus"></i> Добавить товар
                            </button>
                            <button class="btn btn-outline" onclick="app.showCreateCategoryModal()">
                                <i class="fas fa-folder-plus"></i> Добавить категорию
                            </button>
                        </div>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-card-header">
                                <div class="stat-card-title">Всего товаров</div>
                                <div class="stat-card-icon" style="background: var(--info-light); color: var(--info);">
                                    <i class="fas fa-boxes"></i>
                                </div>
                            </div>
                            <div class="stat-card-value">${this.products.length}</div>
                            <div class="stat-card-change change-positive">
                                <i class="fas fa-check"></i>
                                <span>Активных товаров</span>
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-card-header">
                                <div class="stat-card-title">Категорий</div>
                                <div class="stat-card-icon" style="background: var(--warning-light); color: var(--warning);">
                                    <i class="fas fa-folder"></i>
                                </div>
                            </div>
                            <div class="stat-card-value">${categories ? categories.length : 0}</div>
                            <div class="stat-card-change">
                                <span>Организованы</span>
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-card-header">
                                <div class="stat-card-title">Заказов</div>
                                <div class="stat-card-icon" style="background: var(--success-light); color: var(--success);">
                                    <i class="fas fa-shopping-cart"></i>
                                </div>
                            </div>
                            <div class="stat-card-value">${this.orders.length}</div>
                            <div class="stat-card-change change-positive">
                                <i class="fas fa-arrow-up"></i>
                                <span>Всего заказов</span>
                            </div>
                        </div>

                        <div class="stat-card cursor-pointer" onclick="app.nav('admin-users')">
                            <div class="stat-card-header">
                                <div class="stat-card-title">Пользователей</div>
                                <div class="stat-card-icon" style="background: var(--primary-light); color: var(--primary);">
                                    <i class="fas fa-users"></i>
                                </div>
                            </div>
                            <div class="stat-card-value">3</div>
                            <div class="stat-card-change">
                                <span>Управление пользователями</span>
                            </div>
                        </div>

                        <div class="stat-card cursor-pointer" onclick="app.nav('admin-orders')">
                            <div class="stat-card-header">
                                <div class="stat-card-title">Заказов</div>
                                <div class="stat-card-icon" style="background: var(--success-light); color: var(--success);">
                                    <i class="fas fa-shopping-cart"></i>
                                </div>
                            </div>
                            <div class="stat-card-value">1</div>
                            <div class="stat-card-change">
                                <span>Управление заказами</span>
                            </div>
                        </div>

                        <div class="stat-card cursor-pointer" onclick="app.showSendNotificationModal()">
                            <div class="stat-card-header">
                                <div class="stat-card-title">Отправить уведомление</div>
                                <div class="stat-card-icon" style="background: var(--warning-light); color: var(--warning);">
                                    <i class="fas fa-bell"></i>
                                </div>
                            </div>
                            <div class="stat-card-value"><i class="fas fa-paper-plane"></i></div>
                            <div class="stat-card-change">
                                <span>Связь с пользователями</span>
                            </div>
                        </div>

                        <div class="stat-card cursor-pointer" onclick="app.nav('admin-tools')">
                            <div class="stat-card-header">
                                <div class="stat-card-title">Системные инструменты</div>
                                <div class="stat-card-icon" style="background: var(--info-light); color: var(--info);">
                                    <i class="fas fa-tools"></i>
                                </div>
                            </div>
                            <div class="stat-card-value"><i class="fas fa-cogs"></i></div>
                            <div class="stat-card-change">
                                <span>Экспорт и импорт данных</span>
                            </div>
                        </div>
                    </div>




                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">Управление товарами</div>
                            <div class="flex gap-2">
                                <button class="btn btn-outline btn-sm" onclick="app.refreshAdminData()">
                                    <i class="fas fa-sync"></i> Обновить
                                </button>
                            </div>
                        </div>

                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Артикул</th>
                                        <th>Название</th>
                                        <th>Категория</th>
                                        <th>Цена</th>
                                        <th>Наличие</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.products.map(product => `
                                        <tr>
                                            <td style="font-family: monospace;">#${product.id}</td>
                                            <td style="font-family: monospace;">${product.article}</td>
                                            <td class="font-semibold">${product.name}</td>
                                            <td>${product.categoryName || 'Без категории'}</td>
                                            <td class="font-bold text-primary">${product.price.toFixed(2)} BYN</td>
                                            <td>${product.stock} шт.</td>
                                            <td>
                                                <span class="status-badge ${product.isActive ? 'status-completed' : 'status-cancelled'}">
                                                    ${product.isActive ? 'Активен' : 'Скрыт'}
                                                </span>
                                            </td>
                                            <td>
                                                <div class="flex gap-1">
                                                    <button class="btn btn-outline btn-sm" onclick="app.editProduct(${product.id})">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-danger btn-sm" onclick='app.deleteProduct(${product.id})'>
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">Управление категориями</div>
                        </div>

                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Название</th>
                                        <th>Родитель</th>
                                        <th>Товаров</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${categories ? categories.map(category => `
                                        <tr>
                                            <td style="font-family: monospace;">#${category.id}</td>
                                            <td class="font-semibold">${category.name}</td>
                                            <td>${category.parentId ? `Категория #${category.parentId}` : 'Корневая'}</td>
                                            <td>${category.productCount} товаров</td>
                                            <td>
                                                <div class="flex gap-1">
                                                    <button class="btn btn-outline btn-sm" onclick='app.editCategory(${category.id})'>
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-danger btn-sm" onclick='app.deleteCategory(${category.id})' ${category.productCount > 0 ? 'disabled' : ''}>
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('') : '<tr><td colspan="5" class="text-center py-4">Загрузка категорий...</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">
                                <i class="fas fa-upload"></i> Импорт товаров
                            </div>
                        </div>
                        <div class="p-4">
                            <div class="import-form">
                                <div class="form-group">
                                    <label class="form-label">Выберите CSV файл для импорта</label>
                                    <div class="import-file-input">
                                        <input type="file" id="admin-import-file" accept=".csv" onchange="app.handleAdminFileSelect()">
                                        <label for="admin-import-file" class="import-file-label">
                                            <i class="fas fa-cloud-upload-alt"></i>
                                            <span>Выберите файл или перетащите сюда</span>
                                        </label>
                                    </div>
                                    <div id="admin-selected-file" class="text-sm text-tertiary mt-2"></div>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div class="form-group">
                                        <label class="form-label">Режим импорта</label>
                                        <select id="import-mode" class="form-select">
                                            <option value="create_only">Только создание новых товаров</option>
                                            <option value="update_only">Только обновление существующих товаров</option>
                                            <option value="upsert">Создание и обновление (рекомендуется)</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-check">
                                            <input type="checkbox" id="import-dry-run">
                                            <span class="ml-2">Тестовый запуск (без сохранения в базу)</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="flex gap-3">
                                    <button class="btn btn-primary" id="admin-import-btn" onclick="app.uploadAndImport()" disabled>
                                        <i class="fas fa-upload"></i> Загрузить и импортировать
                                    </button>
                                    <button class="btn btn-outline" onclick="app.downloadSampleCsv()">
                                        <i class="fas fa-download"></i> Скачать образец CSV
                                    </button>
                                </div>

                                <div class="text-sm text-tertiary mt-3">
                                    <i class="fas fa-info-circle"></i> Поддерживаемые колонки: Артикул, Название, Описание, Цена, Количество, Категория, Атрибуты (Бренд, Мощность и т.д.)
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },

            // Show access denied page
            showAccessDenied() {
                const content = document.getElementById('content-mount');
                const header = document.getElementById('page-header');
                
                if (header) header.innerText = 'Доступ запрещен';
                if (content) {
                    content.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-lock"></i>
                            </div>
                            <div class="empty-state-title">Доступ запрещен</div>
                            <div class="empty-state-description">У вас нет прав для доступа к этой странице</div>
                            <button class="btn btn-primary mt-4" onclick="app.nav('dashboard')">
                                <i class="fas fa-arrow-left"></i> Вернуться на главную
                            </button>
                        </div>
                    `;
                }
            },

            // Render admin products page
            async renderAdminProducts() {
                const allProducts = await this.fetchApi('products?includeInactive=true');
                this.adminProductsData = allProducts || [];
                this.adminProductsPage = 1;
                this.adminProductsPerPage = 25;
                this.adminProductsSortBy = 'id';
                this.adminProductsSortDir = 'asc';

                return `
                    <div class="admin-page-header">
                        <div class="admin-page-header-left">
                            <h1>Управление товарами</h1>
                            <p>Просмотр и редактирование товаров</p>
                        </div>
                        <div class="admin-page-header-right">
                            <button class="btn btn-outline btn-sm" onclick="app.refreshAdminData()">
                                <i class="fas fa-sync"></i> Обновить
                            </button>
                            <button class="btn btn-primary" onclick="app.showCreateProductModal()">
                                <i class="fas fa-plus"></i> Добавить товар
                            </button>
                        </div>
                    </div>

                    <!-- Bulk Actions Bar -->
                    <div id="bulk-actions-bar" class="bulk-actions-bar" style="display: none;">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span style="font-weight: 600; font-size: 1rem;"><span id="selected-count">0</span> выбрано</span>
                                <button class="btn btn-sm" onclick="app.bulkChangeCategory()">
                                    <i class="fas fa-folder"></i> Изменить категорию
                                </button>
                                <button class="btn btn-sm" onclick="app.bulkChangeStatus()">
                                    <i class="fas fa-toggle-on"></i> Изменить статус
                                </button>
                                <button class="btn btn-sm" onclick="app.bulkChangePrice()">
                                    <i class="fas fa-tag"></i> Изменить цену
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="app.bulkDeleteProducts()">
                                    <i class="fas fa-trash"></i> Удалить
                                </button>
                            </div>
                            <button class="btn btn-sm" onclick="app.clearProductSelection()">
                                Отменить выбор
                            </button>
                        </div>
                    </div>

                    <div class="modern-card">
                        <div class="modern-card-header">
                            <div class="modern-card-title">
                                <i class="fas fa-boxes"></i>
                                Список товаров
                            </div>
                            <div style="font-size: 0.875rem; color: var(--text-tertiary);">
                                Всего: <span id="admin-products-total" style="font-weight: 600; color: var(--primary);">${allProducts ? allProducts.length : 0}</span>
                            </div>
                        </div>

                        <!-- Search and Filter -->
                        <div class="modern-search-bar" style="padding:10px 12px;display:flex;flex-direction:column;gap:6px;">
                            <div class="modern-search-input" style="display:flex;align-items:center;background:var(--bg-page);border:1px solid var(--border);border-radius:8px;padding:6px 10px;gap:6px;">
                                <input type="text" id="admin-products-search" placeholder="Поиск по артикулу, названию..." onkeyup="app.searchAdminProducts()" style="flex:1;border:none;background:transparent;font-size:14px;outline:none;min-height:auto;padding:0;color:var(--text-main);">
                                <i class="fas fa-search" style="color:var(--text-tertiary);font-size:0.85rem;flex-shrink:0;"></i>
                            </div>
                            <div style="display:flex;gap:6px;">
                                <select id="admin-products-category-filter" class="form-select" style="flex:1;min-width:0;font-size:0.85rem;padding:6px 8px;height:34px;border-radius:8px;font-weight:600;" onchange="app.filterAdminProducts()">
                                    <option value="">📁 Категория</option>
                                </select>
                                <select id="admin-products-status-filter" class="form-select" style="flex:1;min-width:0;font-size:0.85rem;padding:6px 8px;height:34px;border-radius:8px;font-weight:600;" onchange="app.filterAdminProducts()">
                                    <option value="">🔘 Статус</option>
                                    <option value="active">✓ Активные</option>
                                    <option value="inactive">✗ Скрытые</option>
                                </select>
                                <select id="admin-products-per-page" class="form-select" style="width:60px;flex-shrink:0;font-size:0.8rem;padding:6px 4px;height:34px;border-radius:8px;" onchange="app.changeProductsPerPage()">
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                        </div>

                        <div style="overflow-x: auto;">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th style="width: 40px;">
                                            <input type="checkbox" id="select-all-products" onchange="app.toggleSelectAllProducts()">
                                        </th>
                                        <th class="sortable" onclick="app.sortProducts('id')">
                                            ID <i class="fas fa-sort"></i>
                                        </th>
                                        <th class="sortable" onclick="app.sortProducts('article')">
                                            Артикул <i class="fas fa-sort"></i>
                                        </th>
                                        <th class="sortable" onclick="app.sortProducts('name')">
                                            Название <i class="fas fa-sort"></i>
                                        </th>
                                        <th>Категория</th>
                                        <th class="sortable" onclick="app.sortProducts('price')">
                                            Цена <i class="fas fa-sort"></i>
                                        </th>
                                        <th class="sortable" onclick="app.sortProducts('stock')">
                                            Наличие <i class="fas fa-sort"></i>
                                        </th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-products-table-body">
                                    <!-- Will be filled by renderProductsTable() -->
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div class="modern-pagination">
                            <div id="products-pagination" class="flex items-center justify-between w-full">
                                <!-- Will be filled by renderProductsPagination() -->
                            </div>
                        </div>
                    </div>
                `;
            },

            // Render admin categories page
            async renderAdminCategories() {
                const categories = await this.fetchApi('categories');

                return `
                    <div class="admin-page-header">
                        <div class="admin-page-header-left">
                            <h1>Управление категориями</h1>
                            <p>Организация товаров по категориям</p>
                        </div>
                        <div class="admin-page-header-right">
                            <button class="btn btn-primary" onclick="app.showCreateCategoryModal()">
                                <i class="fas fa-folder-plus"></i> Добавить категорию
                            </button>
                        </div>
                    </div>

                    <div class="modern-card">
                        <div class="modern-card-header">
                            <div class="modern-card-title">
                                <i class="fas fa-folder"></i>
                                Список категорий
                            </div>
                            <div style="font-size: 0.875rem; color: var(--text-tertiary);">
                                Всего: <span style="font-weight: 600; color: var(--primary);">${categories ? categories.length : 0}</span>
                            </div>
                        </div>

                        <!-- Десктоп: таблица -->
                        <div class="categories-desktop-table" style="overflow-x: auto;">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Название</th>
                                        <th>Родитель</th>
                                        <th>Товаров</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${categories ? categories.map(category => `
                                        <tr>
                                            <td style="font-family: monospace;">#${category.id}</td>
                                            <td style="font-weight: 600;">${category.name}</td>
                                            <td>${category.parentId ? `Категория #${category.parentId}` : 'Корневая'}</td>
                                            <td>${category.productCount || 0} товаров</td>
                                            <td>
                                                <div class="flex gap-1">
                                                    <button class="action-btn" onclick='app.editCategory(${category.id})' title="Редактировать">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="action-btn" style="color: var(--danger);" onclick='app.deleteCategory(${category.id})' ${(category.productCount || 0) > 0 ? 'disabled' : ''} title="Удалить">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('') : '<tr><td colspan="5" class="text-center py-4">Загрузка категорий...</td></tr>'}
                                </tbody>
                            </table>
                        </div>

                        <!-- Мобильный: карточки -->
                        <div class="categories-mobile-cards" style="display:none; padding:12px; display:flex; flex-direction:column; gap:8px;">
                            ${categories ? categories.map(category => `
                                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;position:relative;">
                                    <div style="flex:1;min-width:0;">
                                        <div style="font-size:0.75rem;color:var(--text-tertiary);font-family:monospace;margin-bottom:2px;">#${category.id}</div>
                                        <div style="font-size:1rem;font-weight:700;color:var(--text-main);margin-bottom:4px;">${category.name}</div>
                                        <div style="font-size:0.8rem;color:var(--text-secondary);display:flex;gap:12px;">
                                            <span>Родитель: ${category.parentId ? `Категория #${category.parentId}` : 'Корневая'}</span>
                                            <span>Товаров: ${category.productCount || 0}</span>
                                        </div>
                                    </div>
                                    <div style="display:flex;gap:6px;flex-shrink:0;">
                                        <button onclick='app.editCategory(${category.id})' style="width:36px;height:36px;border-radius:8px;border:1px solid var(--border);background:var(--bg-page);color:var(--primary);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.85rem;padding:0;">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick='app.deleteCategory(${category.id})' ${(category.productCount || 0) > 0 ? 'disabled' : ''} style="width:36px;height:36px;border-radius:8px;border:1px solid rgba(220,53,69,0.2);background:var(--bg-page);color:var(--danger);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.85rem;padding:0;${(category.productCount || 0) > 0 ? 'opacity:0.4;' : ''}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('') : '<div style="text-align:center;padding:24px;color:var(--text-tertiary);">Загрузка...</div>'}
                        </div>
                    </div>
                    <script>
                        (function() {
                            var isMobile = window.innerWidth <= 767;
                            var desktop = document.querySelector('.categories-desktop-table');
                            var mobile = document.querySelector('.categories-mobile-cards');
                            if (desktop) desktop.style.display = isMobile ? 'none' : 'block';
                            if (mobile) mobile.style.display = isMobile ? 'flex' : 'none';
                        })();
                    </script>
                `;
            },

            // Render admin import page
            async renderAdminImport() {
                // Load import history
                const importJobs = await this.fetchApi('import/jobs').catch(() => []);

                return `
                    <div class="admin-page-header">
                        <div class="admin-page-header-left">
                            <h1>Импорт/Экспорт товаров</h1>
                            <p>Массовая загрузка и выгрузка данных</p>
                        </div>
                    </div>

                    <!-- Export Section -->
                    <div class="modern-card" style="margin-bottom: 24px;">
                        <div class="modern-card-header">
                            <div class="modern-card-title">
                                <i class="fas fa-download"></i>
                                Экспорт данных
                            </div>
                        </div>
                        <div class="modern-card-body">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <!-- Export Products -->
                                <div class="export-card" onclick="app.exportProducts()">
                                    <div class="export-card-icon">
                                        <i class="fas fa-boxes"></i>
                                    </div>
                                    <div class="export-card-title">Экспорт товаров</div>
                                    <div class="export-card-description">CSV файл со всеми товарами</div>
                                    <button class="btn btn-primary btn-sm">
                                        <i class="fas fa-download"></i> Экспортировать
                                    </button>
                                </div>

                                <!-- Export Orders -->
                                <div class="export-card" onclick="app.exportOrders()">
                                    <div class="export-card-icon">
                                        <i class="fas fa-shopping-cart"></i>
                                    </div>
                                    <div class="export-card-title">Экспорт заказов</div>
                                    <div class="export-card-description">CSV файл со всеми заказами</div>
                                    <button class="btn btn-primary btn-sm">
                                        <i class="fas fa-download"></i> Экспортировать
                                    </button>
                                </div>

                                <!-- Export Users -->
                                <div class="export-card" onclick="app.exportUsers()">
                                    <div class="export-card-icon">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <div class="export-card-title">Экспорт пользователей</div>
                                    <div class="export-card-description">CSV файл со всеми пользователями</div>
                                    <button class="btn btn-primary btn-sm">
                                        <i class="fas fa-download"></i> Экспортировать
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Import Section -->
                    <div class="modern-card" style="margin-bottom: 24px;">
                        <div class="modern-card-header">
                            <div class="modern-card-title">
                                <i class="fas fa-upload"></i>
                                Импорт товаров из CSV
                            </div>
                        </div>
                        <div class="modern-card-body">
                            <div class="import-form">
                                <div class="form-group">
                                    <label class="form-label">Выберите CSV файл для импорта</label>
                                    <div class="import-file-input">
                                        <input type="file" id="admin-import-file" accept=".csv" onchange="app.handleAdminFileSelect()">
                                        <label for="admin-import-file" class="import-file-label">
                                            <i class="fas fa-cloud-upload-alt"></i>
                                            <span>Выберите файл или перетащите сюда</span>
                                        </label>
                                    </div>
                                    <div id="admin-selected-file" class="text-sm text-tertiary mt-2"></div>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div class="form-group">
                                        <label class="form-label">Режим импорта</label>
                                        <select id="import-mode" class="form-select">
                                            <option value="create_only">Только создание новых товаров</option>
                                            <option value="update_only">Только обновление существующих товаров</option>
                                            <option value="upsert">Создание и обновление (рекомендуется)</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-check">
                                            <input type="checkbox" id="import-dry-run">
                                            <span class="ml-2">Тестовый запуск (без сохранения в базу)</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="flex gap-3">
                                    <button class="btn btn-primary" id="admin-import-btn" onclick="app.uploadAndImport()" disabled>
                                        <i class="fas fa-upload"></i> Загрузить и импортировать
                                    </button>
                                    <button class="btn btn-outline" onclick="app.downloadSampleCsv()">
                                        <i class="fas fa-download"></i> Скачать образец CSV
                                    </button>
                                </div>

                                <div class="text-sm text-tertiary mt-3">
                                    <i class="fas fa-info-circle"></i> Поддерживаемые колонки: Артикул, Название, Описание, Цена, Количество, Категория, Атрибуты (Бренд, Мощность и т.д.)
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Import History -->
                    <div class="modern-card">
                        <div class="modern-card-header">
                            <div class="modern-card-title">
                                <i class="fas fa-history"></i>
                                История импорта
                            </div>
                            <button class="btn btn-outline btn-sm" onclick="app.nav('admin-import')">
                                <i class="fas fa-sync"></i> Обновить
                            </button>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Файл</th>
                                        <th>Пользователь</th>
                                        <th>Режим</th>
                                        <th>Статус</th>
                                        <th>Обработано</th>
                                        <th>Успешно</th>
                                        <th>Ошибок</th>
                                        <th>Дата</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${importJobs && importJobs.length > 0 ? importJobs.slice(0, 10).map(job => `
                                        <tr>
                                            <td style="font-family: monospace; font-weight: 600; color: var(--text-tertiary);">#${job.id}</td>
                                            <td style="font-weight: 600;">${job.fileName}</td>
                                            <td>${job.userName || 'N/A'}</td>
                                            <td><span style="padding: 4px 8px; background: var(--bg-page); border-radius: 6px; font-size: 0.75rem; font-weight: 600;">${job.importMode}</span></td>
                                            <td>
                                                <span class="status-badge ${
                                                    job.status === 'Завершен' ? 'status-completed' : 
                                                    job.status === 'В процессе' ? 'status-processing' : 
                                                    job.status === 'Ошибка' ? 'status-cancelled' : 'status-new'
                                                }">
                                                    ${job.status}
                                                </span>
                                            </td>
                                            <td class="text-center" style="font-weight: 600;">${job.totalRows || 0}</td>
                                            <td class="text-center" style="color: var(--success); font-weight: 600;">${job.successCount || 0}</td>
                                            <td class="text-center" style="color: var(--danger); font-weight: 600;">${job.errorCount || 0}</td>
                                            <td style="font-size: 0.875rem; color: var(--text-tertiary);">${job.createdAt ? new Date(job.createdAt).toLocaleString('ru-RU') : '-'}</td>
                                        </tr>
                                    `).join('') : `
                                        <tr>
                                            <td colspan="9" class="text-center py-4" style="color: var(--text-tertiary);">
                                                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
                                                История импорта пуста
                                            </td>
                                        </tr>
                                    `}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            },

            async renderAdminUsers() {
                // Load users
                const users = await this.fetchApi('users');

                return `
                    <div class="admin-page-header">
                        <div class="admin-page-header-left">
                            <h1>Управление пользователями</h1>
                            <p>Просмотр и управление учетными записями</p>
                        </div>
                        <div class="admin-page-header-right">
                            <button class="btn btn-outline btn-sm" onclick="app.refreshAdminUsers()">
                                <i class="fas fa-sync"></i> Обновить
                            </button>
                            <button class="btn btn-primary" onclick="app.showSendNotificationModal()">
                                <i class="fas fa-bell"></i> Отправить уведомление
                            </button>
                        </div>
                    </div>

                    <div class="modern-card">
                        <div class="modern-card-header">
                            <div class="modern-card-title">
                                <i class="fas fa-users"></i>
                                Пользователи системы
                            </div>
                            <div style="font-size: 0.875rem; color: var(--text-tertiary);">
                                Всего: <span style="font-weight: 600; color: var(--primary);">${users ? users.length : 0}</span>
                            </div>
                        </div>

                        <div style="overflow-x: auto;">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Email</th>
                                        <th>Имя</th>
                                        <th>Роль</th>
                                        <th>Статус</th>
                                        <th>Сумма заказов</th>
                                        <th>Скидка</th>
                                        <th>Заказов</th>
                                        <th>В корзине</th>
                                        <th>Регистрация</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${users ? users.map(user => {
                                        const initials = user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : user.email[0].toUpperCase();
                                        const totalOrders = user.totalOrdersAmount || 0;
                                        const discount = user.currentDiscount || 0;
                                        return `
                                        <tr>
                                            <td style="font-family: monospace;">#${user.id}</td>
                                            <td>
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <div class="user-avatar">${initials}</div>
                                                    <span style="font-weight: 600;">${user.email}</span>
                                                </div>
                                            </td>
                                            <td>${user.fullName || '-'}</td>
                                            <td>
                                                <select class="form-select" style="width: auto; font-size: 0.875rem;" onchange="app.changeUserRole(${user.id}, this.value)">
                                                    <option value="Customer" ${user.role === 'Customer' ? 'selected' : ''}>Customer</option>
                                                    <option value="Manager" ${user.role === 'Manager' ? 'selected' : ''}>Manager</option>
                                                    <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                                                </select>
                                            </td>
                                            <td>
                                                <span class="role-badge ${user.isActive ? 'role-badge-success' : 'role-badge-danger'}">
                                                    ${user.isActive ? 'Активен' : 'Заблокирован'}
                                                </span>
                                            </td>
                                            <td style="font-weight: 600; color: var(--success);">${totalOrders.toFixed(2)} BYN</td>
                                            <td>
                                                <span class="role-badge ${discount > 0 ? 'role-badge-success' : 'role-badge-warning'}">
                                                    ${discount}%
                                                </span>
                                            </td>
                                            <td class="text-center">${user.ordersCount}</td>
                                            <td class="text-center">${user.cartItemsCount}</td>
                                            <td style="font-size: 0.875rem;">${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '-'}</td>
                                            <td>
                                                <div style="display: flex; gap: 4px;">
                                                    <button class="action-btn" style="color: var(--primary);"
                                                            onclick='app.openDiscountModal(${user.id})' 
                                                            title="Установить скидку">
                                                        <i class="fas fa-percent"></i>
                                                    </button>
                                                    <button class="action-btn" style="color: var(--info);"
                                                            onclick='app.openDiscountHistoryModal(${user.id})' 
                                                            title="История скидок">
                                                        <i class="fas fa-history"></i>
                                                    </button>
                                                    <button class="action-btn" style="color: ${user.isActive ? 'var(--danger)' : 'var(--success)'};"
                                                            onclick='app.toggleUserStatus("${user.id}", ${user.isActive})' 
                                                            title="${user.isActive ? 'Заблокировать' : 'Разблокировать'}">
                                                        <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `}).join('') : '<tr><td colspan="11" class="text-center py-4">Загрузка пользователей...</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            },

            async renderAdminOrders() {
                // Load orders and order stats
                const orders = await this.fetchApi('orders/admin/all');
                const stats = await this.fetchApi('orders/admin/stats');

                // Mobile card renderer
                const renderMobileOrderCard = (order) => {
                    const statusConfig = {
                        'Новый': { icon: 'clock', class: 'status-new', label: 'Новый' },
                        'В обработке': { icon: 'cog', class: 'status-processing', label: 'В работе' },
                        'Завершен': { icon: 'check', class: 'status-completed', label: 'Завершен' },
                        'Отменен': { icon: 'times', class: 'status-cancelled', label: 'Отменен' }
                    };
                    const status = statusConfig[order.status] || statusConfig['Новый'];
                    const orderDate = new Date(order.createdAt);
                    const dateDisplay = orderDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

                    return `
                        <div class="order-row" data-status="${order.status}">
                            <div class="order-mobile-header">
                                <div>
                                    <div class="order-mobile-id">#${order.id}</div>
                                    <div class="order-mobile-date">${dateDisplay}</div>
                                </div>
                                <div class="order-mobile-amount">Сумма: ${order.totalAmount.toFixed(2)} BYN</div>
                            </div>
                            
                            <div class="order-mobile-info">
                                <div class="order-mobile-user">Пользователь: ${order.userFullName || 'Не указан'}</div>
                                <div class="order-mobile-email">Email: ${order.userEmail}</div>
                                <div class="order-mobile-items">Товаров: ${order.itemsCount}</div>
                            </div>
                            
                            <div class="order-mobile-actions">
                                <span class="order-mobile-status ${status.class}">
                                    <i class="fas fa-${status.icon}"></i> ${status.label}
                                </span>
                                <div class="order-mobile-buttons">
                                    <button class="order-mobile-btn" onclick="app.viewOrderDetails(${order.id})" title="Просмотр">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="order-mobile-btn" onclick="app.viewCustomerDetails(${order.userId})" title="Клиент">
                                        <i class="fas fa-address-card"></i>
                                    </button>
                                </div>
                            </div>
                        </div>`;
                };

                return `
                    <div class="admin-page-header">
                        <div class="admin-page-header-left">
                            <h1>Управление заказами</h1>
                            <p>Просмотр и управление заказами пользователей</p>
                        </div>
                        <div class="admin-page-header-right">
                            <button class="btn btn-outline btn-sm" onclick="app.refreshAdminOrders()">
                                <i class="fas fa-sync"></i> Обновить
                            </button>
                        </div>
                    </div>

                    <!-- Compact Metrics -->
                    <div class="compact-metrics">
                        <div class="compact-metric">
                            <div class="compact-metric-label">Всего заказов</div>
                            <div class="compact-metric-value">${stats?.totalOrders || 0}</div>
                            <div class="compact-metric-subtitle">${(stats?.totalRevenue || 0).toFixed(2)} BYN</div>
                        </div>
                        <div class="compact-metric">
                            <div class="compact-metric-label">Новые</div>
                            <div class="compact-metric-value" style="color: var(--warning);">${stats?.newOrders || 0}</div>
                            <div class="compact-metric-subtitle">Требуют обработки</div>
                        </div>
                        <div class="compact-metric">
                            <div class="compact-metric-label">В обработке</div>
                            <div class="compact-metric-value" style="color: var(--primary);">${stats?.processingOrders || 0}</div>
                            <div class="compact-metric-subtitle">Активные</div>
                        </div>
                        <div class="compact-metric">
                            <div class="compact-metric-label">Завершенные</div>
                            <div class="compact-metric-value" style="color: var(--success);">${stats?.completedOrders || 0}</div>
                            <div class="compact-metric-subtitle">Успешно</div>
                        </div>
                    </div>

                    <div class="modern-card">
                        <div class="modern-card-header">
                            <div class="modern-card-title">
                                <i class="fas fa-shopping-cart"></i>
                                Заказы
                            </div>
                            <div style="display: flex; gap: 12px;" class="desktop-only">
                                <select id="order-status-filter" class="form-select" style="width: 150px;" onchange="app.filterAdminOrdersByStatus()">
                                    <option value="">Все статусы</option>
                                    <option value="Новый">Новый</option>
                                    <option value="В обработке">В обработке</option>
                                    <option value="Завершен">Завершен</option>
                                    <option value="Отменен">Отменен</option>
                                </select>
                                <select id="order-sort-filter" class="form-select" style="width: 180px;" onchange="app.sortOrders()">
                                    <option value="created">По дате</option>
                                    <option value="totalprice">По сумме</option>
                                    <option value="status">По статусу</option>
                                </select>
                            </div>
                        </div>

                        <!-- Mobile Filters -->
                        <div class="mobile-only" style="padding: 12px; display: none;">
                            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                                <select id="order-status-filter-mobile" class="form-select" style="flex: 1;" onchange="app.filterAdminOrdersByStatus()">
                                    <option value="">Все статусы</option>
                                    <option value="Новый">Новый</option>
                                    <option value="В обработке">В обработке</option>
                                    <option value="Завершен">Завершен</option>
                                    <option value="Отменен">Отменен</option>
                                </select>
                                <select id="order-sort-filter-mobile" class="form-select" style="flex: 1;" onchange="app.sortOrders()">
                                    <option value="created">По дате</option>
                                    <option value="totalprice">По сумме</option>
                                    <option value="status">По статусу</option>
                                </select>
                            </div>
                        </div>

                        <!-- Desktop Table -->
                        <div style="overflow-x: auto;" class="desktop-only">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Пользователь</th>
                                        <th>Email</th>
                                        <th>Сумма</th>
                                        <th>Статус</th>
                                        <th>Товаров</th>
                                        <th>Дата</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody id="orders-table-body">
                                    ${orders ? orders.map(order => {
                    const statusColors = {
                        'Новый': 'var(--warning)',
                        'В обработке': 'var(--primary)',
                        'Завершен': 'var(--success)',
                        'Отменен': 'var(--danger)'
                    };
                    const statusColor = statusColors[order.status] || 'var(--text-tertiary)';

                    return `
                                            <tr>
                                                <td style="font-family: monospace; font-weight: 600;">#${order.id}</td>
                                                <td style="font-weight: 600;">${order.userFullName || 'Не указан'}</td>
                                                <td>${order.userEmail}</td>
                                                <td style="font-weight: 600; color: var(--primary);">${order.totalAmount.toFixed(2)} BYN</td>
                                                <td>
                                                    <select class="form-select" style="width: auto; font-size: 0.875rem; color: ${statusColor}; font-weight: 600;" onchange="app.changeOrderStatus(${order.id}, this.value)">
                                                        <option value="Новый" ${order.status === 'Новый' ? 'selected' : ''}>Новый</option>
                                                        <option value="В обработке" ${order.status === 'В обработке' ? 'selected' : ''}>В обработке</option>
                                                        <option value="Завершен" ${order.status === 'Завершен' ? 'selected' : ''}>Завершен</option>
                                                        <option value="Отменен" ${order.status === 'Отменен' ? 'selected' : ''}>Отменен</option>
                                                    </select>
                                                </td>
                                                <td class="text-center">${order.itemsCount}</td>
                                                <td style="font-size: 0.875rem;">${order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU') : '-'}</td>
                                                <td>
                                                    <div class="flex gap-1">
                                                        <button class="action-btn" onclick='app.viewOrderDetails(${order.id})' title="Детали заказа">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="action-btn" onclick='app.viewCustomerDetails(${order.userId})' title="Реквизиты покупателя">
                                                            <i class="fas fa-address-card"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                }).join('') : '<tr><td colspan="8" class="text-center py-4">Загрузка заказов...</td></tr>'}
                                </tbody>
                            </table>
                        </div>

                        <!-- Mobile Cards -->
                        <div class="mobile-only orders-compact-list" style="display: none; padding: 12px;" id="orders-mobile-list">
                            ${orders ? orders.map(order => renderMobileOrderCard(order)).join('') : '<div style="text-align: center; padding: 20px; color: var(--text-tertiary);">Загрузка заказов...</div>'}
                        </div>
                    </div>
                `;
            },


            // Search orders
            async debouncedSearchOrders(event) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.searchOrders();
                }, 500);
            },

            async searchOrders() {
                const searchTerm = document.getElementById('manager-order-search').value.toLowerCase().trim();
                const statusFilter = document.getElementById('manager-order-status').value;

                const filteredOrders = this.orders.filter(order => {
                    const matchesSearch = !searchTerm ||
                        order.Id.toString().includes(searchTerm) ||
                        order.User?.FullName?.toLowerCase().includes(searchTerm) ||
                        order.User?.Email?.toLowerCase().includes(searchTerm);

                    const matchesStatus = !statusFilter || order.Status === statusFilter;

                    return matchesSearch && matchesStatus;
                });

                const tableBody = document.getElementById('manager-orders-table');
                tableBody.innerHTML = filteredOrders.map(order => `
                    <tr>
                        <td>#${order.id}</td>
                        <td>${order.userFullName || 'Не указано'}</td>
                        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                            <span class="badge ${order.status === 'Новый' ? 'badge-primary' :
                        order.status === 'В обработке' ? 'badge-warning' :
                            order.status === 'Завершен' ? 'badge-success' : 'badge-danger'
                    }">
                                ${order.status}
                            </span>
                        </td>
                        <td>${order.totalAmount.toFixed(2)} BYN</td>
                        <td>${order.itemsCount || 0}</td>
                        <td>
                            <div class="flex gap-1">
                                <button class="btn btn-outline btn-sm" onclick='app.viewOrderDetails(${order.id})'>
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-outline btn-sm" onclick='app.changeOrderStatus(${order.id})'>
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            },

            // Filter orders
            async filterManagerOrdersByStatus() {
                this.searchOrders();
            },

            async refreshManagerOrders() {
                try {
                    await this.loadOrders();
                    this.nav('manager-orders');
                    this.showToast('Данные обновлены', 'success');
                } catch (error) {
                    console.error('Ошибка обновления данных:', error);
                    this.showToast('Не удалось обновить данные', 'error');
                }
            },


            async renderAdminSupport() {
                try {
                    // Load support data
                    const [tickets, stats, admins] = await Promise.all([
                        this.fetchApi('support/admin/tickets'),
                        this.fetchApi('support/stats'),
                        this.fetchApi('support/admins')
                    ]);

                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Управление поддержкой</h1>
                                <p class="page-subtitle">Тикеты, назначения, статистика</p>
                            </div>
                            <div class="flex gap-3">
                                <button class="btn btn-outline" onclick="app.nav('admin')">
                                    <i class="fas fa-arrow-left"></i> Назад в админ-панель
                                </button>
                                <button class="btn btn-primary" onclick="app.refreshAdminSupport()">
                                    <i class="fas fa-sync"></i> Обновить
                                </button>
                            </div>
                        </div>

                        <!-- Support Stats -->
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">Всего тикетов</div>
                                    <div class="stat-card-icon" style="background: var(--info-light); color: var(--info);">
                                        <i class="fas fa-ticket-alt"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${stats?.totalTickets || 0}</div>
                                <div class="stat-card-change">
                                    <span>Открытых: ${stats?.openTickets || 0}</span>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">В работе</div>
                                    <div class="stat-card-icon" style="background: var(--warning-light); color: var(--warning);">
                                        <i class="fas fa-cog"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${stats?.inProgressTickets || 0}</div>
                                <div class="stat-card-change">
                                    <span>Активных</span>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">Не назначены</div>
                                    <div class="stat-card-icon" style="background: var(--danger-light); color: var(--danger);">
                                        <i class="fas fa-user-times"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${stats?.unassignedTickets || 0}</div>
                                <div class="stat-card-change">
                                    <span>Требуют назначения</span>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">Закрыты</div>
                                    <div class="stat-card-icon" style="background: var(--success-light); color: var(--success);">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${stats?.closedTickets || 0}</div>
                                <div class="stat-card-change">
                                    <span>Выполненных</span>
                                </div>
                            </div>
                        </div>

                        <!-- Filters -->
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Фильтры</div>
                            </div>
                            <div class="flex gap-3 p-4">
                                <select id="support-status-filter" class="form-select" onchange="app.filterSupportTickets()">
                                    <option value="">Все статусы</option>
                                    <option value="open">Открытые</option>
                                    <option value="in_progress">В работе</option>
                                    <option value="waiting_for_user">Ожидают ответа</option>
                                    <option value="closed">Закрытые</option>
                                </select>
                                <select id="support-assigned-filter" class="form-select" onchange="app.filterSupportTickets()">
                                    <option value="">Все исполнители</option>
                                    <option value="0">Не назначены</option>
                                    ${admins ? admins.map(admin => `<option value="${admin.id}">${admin.fullName}</option>`).join('') : ''}
                                </select>
                            </div>
                        </div>

                        <!-- Support Tickets Table -->
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Тикеты поддержки</div>
                                <div class="text-sm text-tertiary">
                                    Всего: ${tickets ? tickets.length : 0} тикетов
                                </div>
                            </div>

                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Тема</th>
                                            <th>Пользователь</th>
                                            <th>Статус</th>
                                            <th>Приоритет</th>
                                            <th>Исполнитель</th>
                                            <th>Создан</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody id="support-tickets-body">
                                        ${tickets ? tickets.map(ticket => {
                        const statusConfig = {
                            'open': { class: 'status-new', text: 'Открыт' },
                            'in_progress': { class: 'status-processing', text: 'В работе' },
                            'waiting_for_user': { class: 'status-pending', text: 'Ожидает ответа' },
                            'closed': { class: 'status-completed', text: 'Закрыт' }
                        };
                        const status = statusConfig[ticket.status] || statusConfig.open;

                        const priorityConfig = {
                            'urgent': { class: 'priority-urgent', text: 'Срочно' },
                            'high': { class: 'priority-high', text: 'Высокий' },
                            'normal': { class: 'priority-normal', text: 'Нормальный' },
                            'low': { class: 'priority-low', text: 'Низкий' }
                        };
                        const priority = priorityConfig[ticket.priority] || priorityConfig.normal;

                        return `
                                                <tr>
                                                    <td style="font-family: monospace;">#${ticket.id}</td>
                                                    <td class="font-semibold">${ticket.subject}</td>
                                                    <td>${ticket.user?.fullName || 'Не указан'}</td>
                                                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                                                    <td><span class="${priority.class}">${priority.text}</span></td>
                                                    <td>${ticket.assignedUser?.fullName || 'Не назначен'}</td>
                                                    <td style="font-size: 0.8rem;">${new Date(ticket.createdAt).toLocaleDateString('ru-RU')}</td>
                                                    <td>
                                                        <div class="flex gap-1">
                                                            <button class="btn btn-outline btn-sm" onclick='app.viewTicket(${ticket.id})'>
                                                                <i class="fas fa-eye"></i>
                                                            </button>
                                                            <select class="form-select" style="width: auto; font-size: 0.8rem;" onchange="app.assignTicket(${ticket.id}, this.value)">
                                                                <option value="">Назначить...</option>
                                                                ${admins ? admins.map(admin => `<option value="${admin.id}" ${ticket.assignedTo === admin.id ? 'selected' : ''}>${admin.fullName}</option>`).join('') : ''}
                                                            </select>
                                                            <select class="form-select" style="width: auto; font-size: 0.8rem;" onchange="app.updateTicketStatus(${ticket.id}, this.value)">
                                                                <option value="">Статус...</option>
                                                                <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Открыт</option>
                                                                <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>В работе</option>
                                                                <option value="waiting_for_user" ${ticket.status === 'waiting_for_user' ? 'selected' : ''}>Ожидает ответа</option>
                                                                <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Закрыт</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `;
                    }).join('') : '<tr><td colspan="8" class="text-center py-4">Загрузка тикетов...</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error('Error loading admin support:', error);
                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Управление поддержкой</h1>
                                <p class="page-subtitle">Ошибка загрузки данных</p>
                            </div>
                            <div class="flex gap-3">
                                <button class="btn btn-outline" onclick="app.nav('admin')">
                                    <i class="fas fa-arrow-left"></i> Назад в админ-панель
                                </button>
                            </div>
                        </div>

                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="empty-state-title">Ошибка загрузки</div>
                            <div class="empty-state-description">Не удалось загрузить данные поддержки</div>
                            <button class="btn btn-primary mt-4" onclick="app.nav('admin-support')">
                                <i class="fas fa-sync"></i> Попробовать снова
                            </button>
                        </div>
                    `;
                }
            },

            async renderAdminFaq() {
                try {
                    // Show loading state
                    this.showToast('Загрузка данных FAQ...', 'info');

                    // Load FAQ data
                    const [categories, articles] = await Promise.all([
                        this.fetchApi('faq/categories').catch(() => []),
                        this.fetchApi('faq/articles').catch(() => [])
                    ]);

                    return `
                        <!-- Search and Filters -->
                        <div class="card" style="margin-bottom: 24px;">
                            <div class="card-header">
                                <div class="card-title">Поиск и фильтры</div>
                            </div>
                            <div class="flex gap-4" style="padding: 20px;">
                                <div class="flex-1">
                                    <input type="text" id="faq-search" class="form-input" placeholder="Поиск по названию, содержимому..." onkeyup="app.debouncedFaqSearch()">
                                </div>
                                <select id="faq-category-filter" class="form-select" onchange="app.filterFaqItems()">
                                    <option value="">Все категории</option>
                                    ${categories ? categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('') : ''}
                                </select>
                                <select id="faq-status-filter" class="form-select" onchange="app.filterFaqItems()">
                                    <option value="">Все статусы</option>
                                    <option value="active">Активные</option>
                                    <option value="inactive">Скрытые</option>
                                </select>
                                <button class="btn btn-outline" onclick="app.resetFaqFilters()">
                                    <i class="fas fa-times"></i> Сбросить
                                </button>
                            </div>
                        </div>

                        <div class="flex gap-3 mb-6">
                            <button class="btn btn-primary" onclick="app.showCreateFaqCategoryModal()">
                                <i class="fas fa-folder-plus"></i> Добавить категорию
                            </button>
                            <button class="btn btn-success" onclick="app.showCreateFaqArticleModal()">
                                <i class="fas fa-plus"></i> Добавить статью
                            </button>
                            <button class="btn btn-outline" onclick="app.refreshAdminFaq()">
                                <i class="fas fa-sync"></i> Обновить
                            </button>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Категории FAQ</div>
                                <div class="flex gap-2">
                                    <button class="btn btn-outline btn-sm" onclick="app.exportFaqCategories()">
                                        <i class="fas fa-download"></i> Экспорт
                                    </button>
                                    <button class="btn btn-outline btn-sm" onclick="app.selectAllFaqCategories()">
                                        <i class="fas fa-check-square"></i> Выбрать все
                                    </button>
                                    <button class="btn btn-danger btn-sm" id="bulk-delete-categories-btn" onclick="app.bulkDeleteFaqCategories()" disabled>
                                        <i class="fas fa-trash"></i> Удалить выбранные
                                    </button>
                                </div>
                            </div>

                            <div class="table-container">
                                <table class="data-table" id="admin-faq-categories">
                                    <thead>
                                        <tr>
                                            <th width="40"><input type="checkbox" id="select-all-categories" onchange="app.toggleAllCategories()"></th>
                                            <th>ID</th>
                                            <th>Название</th>
                                            <th>Описание</th>
                                            <th>Сортировка</th>
                                            <th>Статей</th>
                                            <th>Статус</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${categories ? categories.map(category => `
                                            <tr>
                                                <td><input type="checkbox" class="category-checkbox" data-id="${category.id}"></td>
                                                <td style="font-family: monospace;">#${category.id}</td>
                                                <td class="font-semibold">${category.name}</td>
                                                <td>${category.description || '-'}</td>
                                                <td>${category.sortOrder || 0}</td>
                                                <td>${category.articlesCount || 0}</td>
                                                <td>
                                                    <span class="status-badge ${category.isActive ? 'status-completed' : 'status-cancelled'}">
                                                        ${category.isActive ? 'Активна' : 'Скрыта'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div class="flex gap-1">
                                                        <button class="btn btn-outline btn-sm" onclick='app.editFaqCategory(${category.id})'>
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-danger btn-sm" onclick='app.deleteFaqCategory(${category.id})' ${category.articlesCount > 0 ? 'disabled title="Нельзя удалить категорию с статьями"' : ''}>
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('') : '<tr><td colspan="8" class="text-center py-4">Загрузка категорий...</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Статьи FAQ</div>
                            </div>

                            <div class="table-container">
                                <table class="data-table" id="admin-faq-articles">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Заголовок</th>
                                            <th>Категория</th>
                                            <th>Просмотры</th>
                                            <th>Статус</th>
                                            <th>Создано</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${articles ? articles.map(article => `
                                            <tr>
                                                <td style="font-family: monospace;">#${article.id}</td>
                                                <td class="font-semibold">${article.title}</td>
                                                <td>${article.category?.name || 'Без категории'}</td>
                                                <td>${article.viewCount || 0}</td>
                                                <td>
                                                    <span class="status-badge ${article.isActive ? 'status-completed' : 'status-cancelled'}">
                                                        ${article.isActive ? 'Активна' : 'Скрыта'}
                                                    </span>
                                                </td>
                                                <td style="font-size: 0.8rem;">${article.createdAt ? new Date(article.createdAt).toLocaleDateString('ru-RU') : '-'}</td>
                                                <td>
                                                    <div class="flex gap-1">
                                                        <button class="btn btn-outline btn-sm" onclick='app.editFaqArticle(${article.id})'>
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-danger btn-sm" onclick="app.deleteFaqArticle(${article.id})">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('') : '<tr><td colspan="7" class="text-center py-4">Загрузка статей...</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error('Error loading admin FAQ:', error);
                    return `
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="empty-state-title">Ошибка загрузки</div>
                            <div class="empty-state-description">Не удалось загрузить данные FAQ</div>
                            <button class="btn btn-primary mt-4" onclick="app.nav('admin')">
                                <i class="fas fa-arrow-left"></i> Вернуться в админ-панель
                            </button>
                        </div>
                    `;
                }
            },

            async renderUserMarkupsAdmin() {
                try {
                    // Load user markups and users without markup
                    const [markups, usersWithoutMarkup] = await Promise.all([
                        this.fetchApi('usermarkups'),
                        this.fetchApi('usermarkups/users-without-markup')
                    ]);

                    const activeMarkups = markups ? markups.filter(m => m.isActive) : [];
                    const inactiveMarkups = markups ? markups.filter(m => !m.isActive) : [];

                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Управление наценками пользователей</h1>
                                <p class="page-subtitle">Индивидуальные ценовые политики для B2B клиентов</p>
                            </div>
                            <div class="flex gap-3">
                                <button class="btn btn-outline" onclick="app.nav('admin')">
                                    <i class="fas fa-arrow-left"></i> Назад
                                </button>
                                <button class="btn btn-primary" onclick="app.showCreateUserMarkupModal()">
                                    <i class="fas fa-plus"></i> Добавить наценку
                                </button>
                            </div>
                        </div>

                        <!-- Stats Cards -->
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">Всего наценок</div>
                                    <div class="stat-card-icon" style="background: var(--info-light); color: var(--info);">
                                        <i class="fas fa-percentage"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${markups ? markups.length : 0}</div>
                                <div class="stat-card-change change-positive">
                                    <span>Активных: ${activeMarkups.length}</span>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">Клиентов без наценки</div>
                                    <div class="stat-card-icon" style="background: var(--warning-light); color: var(--warning);">
                                        <i class="fas fa-users"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${usersWithoutMarkup ? usersWithoutMarkup.length : 0}</div>
                                <div class="stat-card-change">
                                    <span>Базовые цены</span>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">Средняя наценка</div>
                                    <div class="stat-card-icon" style="background: var(--success-light); color: var(--success);">
                                        <i class="fas fa-chart-line"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${activeMarkups.length > 0 ? (activeMarkups.reduce((sum, m) => sum + m.markupPercent, 0) / activeMarkups.length).toFixed(1) : 0}%</div>
                                <div class="stat-card-change change-positive">
                                    <span>Для активных клиентов</span>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">Максимальная наценка</div>
                                    <div class="stat-card-icon" style="background: var(--primary-light); color: var(--primary);">
                                        <i class="fas fa-arrow-up"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${activeMarkups.length > 0 ? Math.max(...activeMarkups.map(m => m.markupPercent)) : 0}%</div>
                                <div class="stat-card-change">
                                    <span>VIP клиенты</span>
                                </div>
                            </div>
                        </div>

                        <!-- Filters and Search -->
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Фильтры и поиск</div>
                            </div>
                            <div class="flex gap-4 p-4">
                                <div class="flex-1">
                                    <input type="text" id="user-markup-search" class="form-input" placeholder="Поиск по имени или email..." onkeyup="app.debouncedFilterUserMarkups()">
                                </div>
                                <select id="user-markup-status-filter" class="form-select" onchange="app.filterUserMarkups()">
                                    <option value="">Все статусы</option>
                                    <option value="active">Активные</option>
                                    <option value="inactive">Неактивные</option>
                                </select>
                                <select id="user-markup-sort-filter" class="form-select" onchange="app.sortUserMarkups()">
                                    <option value="user">По имени</option>
                                    <option value="markup">По наценке</option>
                                    <option value="created">По дате</option>
                                </select>
                                <button class="btn btn-outline" onclick="app.resetUserMarkupFilters()">
                                    <i class="fas fa-times"></i> Сбросить
                                </button>
                            </div>
                        </div>

                        <!-- Main Table -->
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Наценки пользователей</div>
                                <div class="text-sm text-tertiary">
                                    Всего записей: ${markups ? markups.length : 0}
                                </div>
                            </div>

                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Пользователь</th>
                                            <th>Email</th>
                                            <th>Наценка</th>
                                            <th>Статус</th>
                                            <th>Создано</th>
                                            <th>Обновлено</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody id="user-markups-table-body">
                                        ${markups && markups.length > 0 ? markups.map(markup => `
                                            <tr>
                                                <td style="font-family: monospace;">#${markup.id}</td>
                                                <td>
                                                    <div class="font-semibold">${markup.user?.fullName || 'Неизвестен'}</div>
                                                </td>
                                                <td class="font-medium">${markup.user?.email || '-'}</td>
                                                <td>
                                                    <div class="flex items-center gap-2">
                                                        <span class="font-bold text-primary">${markup.markupPercent}%</span>
                                                        <div class="text-xs text-tertiary">
                                                            (+${(markup.markupPercent * 0.13 / 100).toFixed(2)} BYN на 100 BYN)
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span class="status-badge ${markup.isActive ? 'status-completed' : 'status-cancelled'}">
                                                        ${markup.isActive ? 'Активна' : 'Отключена'}
                                                    </span>
                                                </td>
                                                <td style="font-size: 0.8rem;">${new Date(markup.createdAt).toLocaleDateString('ru-RU')}</td>
                                                <td style="font-size: 0.8rem;">${markup.updatedAt ? new Date(markup.updatedAt).toLocaleDateString('ru-RU') : '-'}</td>
                                                <td>
                                                    <div class="flex gap-1">
                                                        <button class="btn btn-outline btn-sm" onclick='app.editUserMarkup(${markup.id})' title="Редактировать">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-info btn-sm" onclick='app.viewUserMarkupHistory(${markup.userId})' title="История">
                                                            <i class="fas fa-history"></i>
                                                        </button>
                                                        <button class="btn ${markup.isActive ? 'btn-warning' : 'btn-success'} btn-sm"
                                                                onclick='app.toggleUserMarkupStatus(${markup.id}, ${markup.isActive})'
                                                                title="${markup.isActive ? 'Отключить' : 'Включить'}">
                                                            <i class="fas fa-${markup.isActive ? 'ban' : 'check'}"></i>
                                                        </button>
                                                        <button class="btn btn-danger btn-sm" onclick='app.deleteUserMarkup(${markup.id})' title="Удалить">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('') : `
                                            <tr>
                                                <td colspan="8" class="text-center py-8">
                                                    <div class="empty-state">
                                                        <div class="empty-state-icon">
                                                            <i class="fas fa-percentage"></i>
                                                        </div>
                                                        <div class="empty-state-title">Наценки не найдены</div>
                                                        <div class="empty-state-description">Создайте первую наценку для пользователя</div>
                                                        <button class="btn btn-primary mt-4" onclick="app.showCreateUserMarkupModal()">
                                                            <i class="fas fa-plus"></i> Добавить наценку
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Available Users Section -->
                        ${usersWithoutMarkup && usersWithoutMarkup.length > 0 ? `
                            <div class="card">
                                <div class="card-header">
                                    <div class="card-title">Клиенты без наценки</div>
                                    <div class="text-sm text-tertiary">
                                        Пользователи с базовыми ценами: ${usersWithoutMarkup.length}
                                    </div>
                                </div>

                                <div class="table-container">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Пользователь</th>
                                                <th>Email</th>
                                                <th>Заказов</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${usersWithoutMarkup.map(user => `
                                                <tr>
                                                    <td class="font-semibold">${user.fullName || 'Без имени'}</td>
                                                    <td>${user.email}</td>
                                                    <td class="text-center">${user.ordersCount || 0}</td>
                                                    <td>
                                                        <button class="btn btn-primary btn-sm" data-user-id="${user.id}" data-user-name="${user.fullName.replace(/\"/g, '&quot;')}" onclick="app.createMarkupForUser(Number(this.dataset.userId), this.dataset.userName)">
                                                            <i class="fas fa-plus"></i> Назначить наценку
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ` : ''}
                    `;
                } catch (error) {
                    console.error('Error loading user markups:', error);
                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Ошибка загрузки</h1>
                                <p class="page-subtitle">Не удалось загрузить данные о наценках</p>
                            </div>
                            <div class="flex gap-3">
                                <button class="btn btn-outline" onclick="app.nav('admin')">
                                    <i class="fas fa-arrow-left"></i> Назад
                                </button>
                                <button class="btn btn-primary" onclick="app.nav('admin-markups')">
                                    <i class="fas fa-sync"></i> Попробовать снова
                                </button>
                            </div>
                        </div>

                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="empty-state-title">Ошибка загрузки</div>
                            <div class="empty-state-description">Не удалось загрузить данные о наценках</div>
                        </div>
                    `;
                }
            },

            renderOrders() {
                if (this.orders.length === 0) {
                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Мои заказы</h1>
                                <p class="page-subtitle">Ваши заказы появятся здесь</p>
                            </div>
                            <div class="flex gap-3">
                                <button class="btn btn-primary" onclick="app.nav('products')">
                                    <i class="fas fa-plus"></i> Сделать первый заказ
                                </button>
                            </div>
                        </div>

                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-list"></i>
                            </div>
                            <div class="empty-state-title">Заказов нет</div>
                            <div class="empty-state-description">Сделайте свой первый заказ из каталога товаров</div>
                            <button class="btn btn-primary mt-4" onclick="app.nav('products')">
                                <i class="fas fa-tools"></i> Перейти в каталог
                            </button>
                        </div>
                    `;
                }

                const activeOrders = this.orders.filter(o => o.status === 'Новый' || o.status === 'В обработке').length;

                return `
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">Заказы</h1>
                            <p class="page-subtitle">${this.orders.length} заказов • ${activeOrders} активных</p>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-outline btn-sm" onclick="app.loadOrders(); app.nav('orders')">
                                <i class="fas fa-sync"></i>
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="app.nav('products')">
                                <i class="fas fa-plus"></i> Новый заказ
                            </button>
                        </div>
                    </div>

                    <!-- Compact Filter -->
                    <div class="orders-filter-compact">
                        <button class="filter-chip active" onclick="app.filterOrders('all')">
                            Все <span>${this.orders.length}</span>
                        </button>
                        <button class="filter-chip" onclick="app.filterOrders('active')">
                            Активные <span>${activeOrders}</span>
                        </button>
                        <button class="filter-chip" onclick="app.filterOrders('completed')">
                            Завершенные <span>${this.orders.filter(o => o.status === 'Завершен').length}</span>
                        </button>
                    </div>

                    <!-- Compact Orders List -->
                    <div class="orders-compact-list" id="orders-list">
                        ${this.orders.map(order => this.renderCompactOrderCard(order)).join('')}
                    </div>
                `;
            },

            renderCompactOrderCard(order) {
                const statusConfig = {
                    'Новый': { icon: 'clock', class: 'status-new', label: 'Новый' },
                    'В обработке': { icon: 'cog', class: 'status-processing', label: 'В работе' },
                    'Завершен': { icon: 'check', class: 'status-completed', label: 'Завершен' },
                    'Отменен': { icon: 'times', class: 'status-cancelled', label: 'Отменен' }
                };

                const status = statusConfig[order.status] || statusConfig['Новый'];
                const orderDate = new Date(order.createdAt);
                
                // Форматирование даты как на хороших сайтах
                const now = new Date();
                const diffTime = Math.abs(now - orderDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                let dateDisplay;
                if (diffDays === 0) {
                    dateDisplay = 'Сегодня';
                } else if (diffDays === 1) {
                    dateDisplay = 'Вчера';
                } else if (diffDays < 7) {
                    dateDisplay = `${diffDays} дн. назад`;
                } else {
                    dateDisplay = orderDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                }
                
                const timeDisplay = orderDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

                // Get first 3 product images
                const items = order.items || [];
                const itemsPreview = items.slice(0, 3).map(item => {
                    const imageUrl = this.getProductImage({ article: item.productArticle, imageUrl: item.imageUrl });
                    return imageUrl 
                        ? `<div class="order-thumb"><img src="${imageUrl}" alt="" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-box\\'></i>'"></div>`
                        : `<div class="order-thumb"><i class="fas fa-box"></i></div>`;
                }).join('');

                const itemsCount = items.length;
                const moreCount = itemsCount > 3 ? itemsCount - 3 : 0;

                // Если нет items, показываем заглушку
                const previewHtml = itemsCount > 0 
                    ? `${itemsPreview}${moreCount > 0 ? `<div class="order-thumb-more">+${moreCount}</div>` : ''}`
                    : `<div class="order-thumb"><i class="fas fa-box"></i></div><div class="order-no-items">Нет данных</div>`;

                const itemsText = itemsCount === 0 ? 'Нет товаров' :
                                  itemsCount === 1 ? '1 товар' :
                                  itemsCount < 5 ? `${itemsCount} товара` : `${itemsCount} товаров`;

                return `
                    <div class="order-row" data-status="${order.status}">
                        <div class="order-col order-id">
                            <span class="order-num">#${order.id}</span>
                            <span class="order-date-small">${dateDisplay}</span>
                            <span class="order-time-small">${timeDisplay}</span>
                        </div>
                        
                        <div class="order-col order-preview">
                            ${previewHtml}
                        </div>

                        <div class="order-col order-items-count">
                            <i class="fas fa-box"></i> ${itemsText}
                        </div>

                        <div class="order-col order-amount-col">
                            ${(order.totalAmount || 0).toFixed(2)} BYN
                        </div>

                        <div class="order-col order-status-col">
                            <span class="status-badge-compact ${status.class}">
                                <i class="fas fa-${status.icon}"></i>
                                ${status.label}
                            </span>
                        </div>

                        <div class="order-col order-actions-col">
                            <button class="btn-icon-compact" onclick='app.viewOrderDetails(${order.id})' title="Подробнее">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${order.status === 'Завершен' && itemsCount > 0 ? `
                                <button class="btn-icon-compact btn-success" onclick='app.reorderItems(${order.id})' title="Повторить">
                                    <i class="fas fa-redo"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            },

            filterOrders(filter) {
                const chips = document.querySelectorAll('.filter-chip');
                chips.forEach(chip => chip.classList.remove('active'));
                event.target.closest('.filter-chip').classList.add('active');

                const orderRows = document.querySelectorAll('.order-row');
                orderRows.forEach(row => {
                    const status = row.dataset.status;
                    if (filter === 'all') {
                        row.style.display = 'flex';
                    } else if (filter === 'active') {
                        row.style.display = (status === 'Новый' || status === 'В обработке') ? 'flex' : 'none';
                    } else if (filter === 'completed') {
                        row.style.display = status === 'Завершен' ? 'flex' : 'none';
                    }
                });
            },

            async reorderItems(orderId) {
                const order = this.orders.find(o => o.id === orderId);
                if (!order || !order.items) {
                    this.showToast('Не удалось загрузить товары из заказа', 'error');
                    return;
                }

                if (confirm(`Добавить ${order.items.length} товаров из заказа #${orderId} в корзину?`)) {
                    let addedCount = 0;
                    for (const item of order.items) {
                        const result = await this.fetchApi('cart/add', {
                            method: 'POST',
                            body: JSON.stringify({
                                userId: this.currentUserId,
                                productId: item.productId,
                                quantity: item.quantity
                            })
                        });
                        if (result && result.success) addedCount++;
                    }

                    if (addedCount > 0) {
                        await this.loadCart();
                        this.showToast(`Добавлено ${addedCount} товаров в корзину`, 'success');
                        this.nav('cart');
                    }
                }
            },

            async renderProfile() {
                const user = this.currentUser || {};
                const roleLabels = {
                    'Admin': 'Администратор',
                    'Manager': 'Менеджер',
                    'Customer': 'Клиент'
                };

                return `
                    <div class="profile-modern">
                        <div class="profile-sidebar">
                            <div class="profile-user-info">
                                <div class="profile-avatar-circle">
                                    ${(user.fullName || 'U')[0].toUpperCase()}
                                </div>
                                <h2 class="profile-user-name">${user.fullName || 'Пользователь'}</h2>
                                <p class="profile-user-email">${user.email || ''}</p>
                            </div>
                            
                            <nav class="profile-nav">
                                <a href="#" class="profile-nav-item active" data-section="personal" onclick="app.switchProfileSection(event, 'personal')">
                                    Личные данные
                                </a>
                                <a href="#" class="profile-nav-item" data-section="security" onclick="app.switchProfileSection(event, 'security')">
                                    Безопасность
                                </a>
                                <a href="#" class="profile-nav-item" data-section="orders" onclick="app.switchProfileSection(event, 'orders')">
                                    Мои заказы
                                </a>
                            </nav>
                            
                            <button class="profile-logout-btn" onclick="app.logout()">
                                Выйти из аккаунта
                            </button>
                        </div>
                        
                        <div class="profile-content">
                            <!-- Personal Info Section -->
                            <div class="profile-section active" id="section-personal">
                                <h1 class="profile-section-title">Личные данные</h1>
                                <p class="profile-section-subtitle">Управляйте своей личной информацией</p>
                                
                                <div class="profile-form-card">
                                    <div class="profile-form-group">
                                        <label class="profile-label">Полное имя</label>
                                        <input type="text" class="profile-input" id="profile-fullname" value="${user.fullName || ''}" placeholder="Введите ваше имя">
                                    </div>
                                    
                                    <div class="profile-form-group">
                                        <label class="profile-label">Email</label>
                                        <input type="email" class="profile-input" value="${user.email || ''}" readonly>
                                        <span class="profile-input-hint">Email адрес нельзя изменить</span>
                                    </div>
                                    
                                    <div class="profile-form-group">
                                        <label class="profile-label">Роль</label>
                                        <input type="text" class="profile-input" value="${roleLabels[user.role] || user.role}" readonly>
                                    </div>
                                    
                                    <div class="profile-form-actions">
                                        <button class="profile-btn-primary" onclick="app.updateProfileInfo()">
                                            Сохранить изменения
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Security Section -->
                            <div class="profile-section" id="section-security">
                                <h1 class="profile-section-title">Безопасность</h1>
                                <p class="profile-section-subtitle">Измените пароль для защиты аккаунта</p>
                                
                                <div class="profile-form-card">
                                    <div class="profile-form-group">
                                        <label class="profile-label">Текущий пароль</label>
                                        <input type="password" class="profile-input" id="current-password" placeholder="Введите текущий пароль">
                                    </div>
                                    
                                    <div class="profile-form-group">
                                        <label class="profile-label">Новый пароль</label>
                                        <input type="password" class="profile-input" id="new-password" placeholder="Введите новый пароль">
                                        <span class="profile-input-hint">Минимум 6 символов</span>
                                    </div>
                                    
                                    <div class="profile-form-group">
                                        <label class="profile-label">Подтвердите новый пароль</label>
                                        <input type="password" class="profile-input" id="confirm-password" placeholder="Повторите новый пароль">
                                    </div>
                                    
                                    <div class="profile-form-actions">
                                        <button class="profile-btn-primary" onclick="app.changePassword()">
                                            Обновить пароль
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Orders Section -->
                            <div class="profile-section" id="section-orders">
                                <div class="profile-section-header">
                                    <div>
                                        <h1 class="profile-section-title">Мои заказы</h1>
                                        <p class="profile-section-subtitle">История ваших покупок</p>
                                    </div>
                                    <button class="profile-btn-secondary" onclick="app.nav('orders')">
                                        Все заказы
                                    </button>
                                </div>
                                
                                ${this.orders.length > 0 ? `
                                    <div class="profile-orders-modern">
                                        ${this.orders.slice(0, 10).map(order => `
                                            <div class="profile-order-card">
                                                <div class="profile-order-header">
                                                    <div>
                                                        <span class="profile-order-number">Заказ #${order.id}</span>
                                                        <span class="profile-order-date">${new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                    </div>
                                                    <span class="profile-order-status profile-order-status-${(order.status || 'new').toLowerCase().replace(' ', '-')}">${order.status || 'Новый'}</span>
                                                </div>
                                                <div class="profile-order-footer">
                                                    <span class="profile-order-total">${(order.totalAmount || 0).toFixed(2)} BYN</span>
                                                    <button class="profile-order-view" onclick="app.viewOrderDetails(${order.id})">
                                                        Подробнее
                                                    </button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : `
                                    <div class="profile-empty-state">
                                        <div class="profile-empty-icon">📦</div>
                                        <h3 class="profile-empty-title">Заказов пока нет</h3>
                                        <p class="profile-empty-text">Начните делать покупки в нашем каталоге</p>
                                        <button class="profile-btn-primary" onclick="app.nav('products')">
                                            Перейти в каталог
                                        </button>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            },

            switchProfileSection(event, section) {
                event.preventDefault();
                
                // Update nav items
                document.querySelectorAll('.profile-nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                event.currentTarget.classList.add('active');
                
                // Update sections
                document.querySelectorAll('.profile-section').forEach(sec => {
                    sec.classList.remove('active');
                });
                document.getElementById(`section-${section}`).classList.add('active');
            },


            async updateProfileInfo() {
                const fullName = document.getElementById('profile-fullname').value.trim();
                if (!fullName) {
                    this.showToast('Введите полное имя', 'error');
                    return;
                }

                const result = await this.fetchApi('auth/profile', {
                    method: 'PUT',
                    body: JSON.stringify({ fullName })
                });

                if (result && result.success) {
                    this.currentUser.fullName = fullName;
                    this.showToast('Профиль успешно обновлен', 'success');
                    this.nav('profile');
                } else {
                    this.showToast(result?.message || 'Ошибка обновления профиля', 'error');
                }
            },

            async changePassword() {
                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                if (!currentPassword || !newPassword || !confirmPassword) {
                    this.showToast('Заполните все поля', 'error');
                    return;
                }

                if (newPassword !== confirmPassword) {
                    this.showToast('Пароли не совпадают', 'error');
                    return;
                }

                if (newPassword.length < 6) {
                    this.showToast('Пароль должен быть минимум 6 символов', 'error');
                    return;
                }

                const result = await this.fetchApi('auth/password', {
                    method: 'PUT',
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                });

                if (result && result.success) {
                    this.showToast('Пароль успешно изменен', 'success');
                    document.getElementById('current-password').value = '';
                    document.getElementById('new-password').value = '';
                    document.getElementById('confirm-password').value = '';
                } else {
                    this.showToast(result?.message || 'Ошибка изменения пароля', 'error');
                }
            },

            async renderSupport() {
                try {
                    this.showToast('Загрузка страницы поддержки...', 'info');

                    // Load support statistics and data with error handling
                    let faqCategories = null, userTickets = null, activeChatSession = null, supportStats = null;

                    try {
                        faqCategories = await this.fetchApi('faq/categories');
                    } catch (error) {
                        console.warn('Failed to load FAQ categories:', error);
                        faqCategories = [];
                    }

                    try {
                        userTickets = await this.fetchApi('support/tickets');
                    } catch (error) {
                        console.warn('Failed to load user tickets:', error);
                        userTickets = [];
                    }

                    try {
                        activeChatSession = await this.fetchApi('chat/session');
                    } catch (error) {
                        console.warn('Failed to load chat session:', error);
                        activeChatSession = null;
                    }

                    try {
                        supportStats = await this.fetchApi('support/stats');
                    } catch (error) {
                        console.warn('Failed to load support stats:', error);
                        supportStats = null;
                    }

                    const openTickets = Array.isArray(userTickets) ? userTickets.filter(t => t.status === 'open').length : 0;
                    const inProgressTickets = Array.isArray(userTickets) ? userTickets.filter(t => t.status === 'in_progress').length : 0;
                    const totalTickets = Array.isArray(userTickets) ? userTickets.length : 0;

                    // Initialize tab switching after a short delay to ensure DOM is ready
                    setTimeout(() => {
                        const tabButtons = document.querySelectorAll('.support-tab-btn');
                        tabButtons.forEach(button => {
                            button.addEventListener('click', () => {
                                const tabName = button.getAttribute('data-tab');
                                this.switchSupportTab(tabName);
                            });
                        });
                    }, 100);

                    return `
                        <!-- Hero Section -->
                        <div class="support-hero">
                            <div class="support-hero-content">
                                <div class="support-hero-icon">
                                    <i class="fas fa-life-ring"></i>
                                </div>
                                <div class="support-hero-text">
                                    <h1 class="support-hero-title">Центр поддержки</h1>
                                    <p class="support-hero-subtitle">Мы здесь, чтобы помочь вам с любыми вопросами</p>
                                </div>
                            </div>
                            <div class="support-hero-actions">
                                <button class="btn btn-primary btn-lg" onclick="app.showCreateTicketModal()">
                                    <i class="fas fa-plus-circle"></i> Создать обращение
                                </button>
                                <button class="btn btn-outline btn-lg" onclick="app.startNewChat()">
                                    <i class="fas fa-comments"></i> Начать чат
                                </button>
                            </div>
                        </div>

                        <!-- Quick Stats -->
                        <div class="support-stats">
                            <div class="stat-item">
                                <div class="stat-icon">
                                    <i class="fas fa-ticket-alt"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">${totalTickets}</div>
                                    <div class="stat-label">Мои обращения</div>
                                    <div class="stat-details">${openTickets} открыто, ${inProgressTickets} в работе</div>
                                </div>
                            </div>

                            <div class="stat-item">
                                <div class="stat-icon ${activeChatSession ? 'active' : ''}">
                                    <i class="fas fa-comments"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">${activeChatSession ? '1' : '0'}</div>
                                    <div class="stat-label">Активных чатов</div>
                                    <div class="stat-details">${activeChatSession ? 'Поддержка онлайн' : 'Нет активных чатов'}</div>
                                </div>
                            </div>

                            <div class="stat-item">
                                <div class="stat-icon">
                                    <i class="fas fa-book-open"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">${Array.isArray(faqCategories) ? faqCategories.length : 0}</div>
                                    <div class="stat-label">Категорий FAQ</div>
                                    <div class="stat-details">База знаний</div>
                                </div>
                            </div>

                            <div class="stat-item">
                                <div class="stat-icon">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">2ч</div>
                                    <div class="stat-label">Время ответа</div>
                                    <div class="stat-details">Среднее время</div>
                                </div>
                            </div>
                        </div>

                        <!-- Support Tabs -->
                        <div class="support-tabs-container">
                            <div class="support-tabs-nav">
                                <button class="support-tab-btn active" data-tab="faq">
                                    <i class="fas fa-search"></i>
                                    <span>Найти ответ</span>
                                </button>
                                <button class="support-tab-btn" data-tab="tickets">
                                    <i class="fas fa-envelope"></i>
                                    <span>Мои обращения</span>
                                </button>
                                <button class="support-tab-btn" data-tab="chat">
                                    <i class="fas fa-comments"></i>
                                    <span>Онлайн-чат</span>
                                </button>
                                <button class="support-tab-btn" data-tab="contact">
                                    <i class="fas fa-phone"></i>
                                    <span>Контакты</span>
                                </button>
                            </div>

                            <div class="support-tabs-content">
                                <!-- FAQ Tab -->
                                <div id="faq-tab" class="support-tab-panel active">
                                    <div class="faq-search-section">
                                        <div class="faq-search-input">
                                            <i class="fas fa-search"></i>
                                            <input type="text" id="faq-search" placeholder="Что вас интересует? Например: доставка, гарантия, возврат..." onkeyup="app.debouncedSearchFaq()">
                                        </div>
                                        <p class="faq-search-hint">Поиск по ${Array.isArray(faqCategories) ? faqCategories.reduce((total, cat) => total + (cat.articlesCount || 0), 0) : 0} статьям базы знаний</p>
                                    </div>

                                    <div id="faq-content" class="faq-categories">
                                        ${Array.isArray(faqCategories) && faqCategories.length > 0 ? `
                                            <div class="faq-categories-grid">
                                                ${faqCategories.map(category => `
                                                    <div class="faq-category-card" data-category-id="${category.id}" data-category-name="${category.name.replace(/\"/g, '&quot;')}" onclick="app.loadFaqCategory(Number(this.dataset.categoryId), this.dataset.categoryName)">
                                                        <div class="faq-category-icon">
                                                            <i class="fas fa-folder"></i>
                                                        </div>
                                                        <div class="faq-category-content">
                                                            <h3 class="faq-category-title">${category.name}</h3>
                                                            <p class="faq-category-description">${category.description || 'Статьи по данной теме'}</p>
                                                            <div class="faq-category-stats">
                                                                <span class="articles-count">${category.articlesCount || 0} статей</span>
                                                            </div>
                                                        </div>
                                                        <div class="faq-category-arrow">
                                                            <i class="fas fa-chevron-right"></i>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : `
                                            <div class="empty-state">
                                                <div class="empty-state-icon">
                                                    <i class="fas fa-book"></i>
                                                </div>
                                                <div class="empty-state-title">База знаний в разработке</div>
                                                <div class="empty-state-description">Мы активно наполняем базу знаний полезными статьями. Пока что создайте обращение в поддержку.</div>
                                                <button class="btn btn-primary mt-4" onclick="app.showCreateTicketModal()">
                                                    <i class="fas fa-plus"></i> Создать обращение
                                                </button>
                                            </div>
                                        `}
                                    </div>
                                </div>

                                <!-- Tickets Tab -->
                                <div id="tickets-tab" class="support-tab-panel">
                                    <div class="tickets-header">
                                        <div class="tickets-title">
                                            <h2>Мои обращения в поддержку</h2>
                                            <p>История ваших обращений и текущий статус</p>
                                        </div>
                                        <button class="btn btn-primary" onclick="app.showCreateTicketModal()">
                                            <i class="fas fa-plus-circle"></i> Новое обращение
                                        </button>
                                    </div>

                                    <div id="tickets-content" class="tickets-list">
                                        ${Array.isArray(userTickets) && userTickets.length > 0 ? `
                                            <div class="tickets-grid">
                                                ${userTickets.map(ticket => {
                        const statusConfig = {
                            'open': { class: 'status-new', text: 'Открыт', icon: 'fas fa-circle' },
                            'in_progress': { class: 'status-processing', text: 'В работе', icon: 'fas fa-cog' },
                            'waiting_for_user': { class: 'status-pending', text: 'Ожидает ответа', icon: 'fas fa-clock' },
                            'closed': { class: 'status-completed', text: 'Закрыт', icon: 'fas fa-check-circle' }
                        };
                        const status = statusConfig[ticket.status] || statusConfig.open;

                        const priorityConfig = {
                            'urgent': { class: 'priority-urgent', text: 'Срочно', color: 'var(--danger)' },
                            'high': { class: 'priority-high', text: 'Высокий', color: 'var(--warning)' },
                            'normal': { class: 'priority-normal', text: 'Нормальный', color: 'var(--primary)' },
                            'low': { class: 'priority-low', text: 'Низкий', color: 'var(--text-tertiary)' }
                        };
                        const priority = priorityConfig[ticket.priority] || priorityConfig.normal;

                        return `
                                                        <div class="ticket-card">
                                                            <div class="ticket-header">
                                                                <div class="ticket-title-section">
                                                                    <h3 class="ticket-title">${ticket.subject}</h3>
                                                                    <div class="ticket-meta">
                                                                        <span class="ticket-date">
                                                                            <i class="fas fa-calendar"></i>
                                                                            ${new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                                                                        </span>
                                                                        <span class="ticket-category">${ticket.category || 'Общее'}</span>
                                                                    </div>
                                                                </div>
                                                                <div class="ticket-status-section">
                                                                    <div class="ticket-status ${status.class}">
                                                                        <i class="${status.icon}"></i>
                                                                        ${status.text}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div class="ticket-content">
                                                                <p class="ticket-description">${ticket.description?.substring(0, 200)}${ticket.description?.length > 200 ? '...' : ''}</p>
                                                            </div>

                                                            <div class="ticket-footer">
                                                                <div class="ticket-priority ${priority.class}">
                                                                    <i class="fas fa-flag"></i>
                                                                    ${priority.text} приоритет
                                                                </div>
                                                                <div class="ticket-messages">
                                                                    <i class="fas fa-comments"></i>
                                                                    ${ticket.messages?.length || 0} сообщений
                                                                </div>
                                                                <div class="ticket-actions">
                                                                    <button class="btn btn-primary btn-sm" onclick='app.viewTicket(${ticket.id})'>
                                                                        <i class="fas fa-eye"></i> Просмотреть
                                                                    </button>
                                                                    ${ticket.status !== 'closed' ? `
                                                                        <button class="btn btn-outline btn-sm" onclick='app.closeTicket(${ticket.id})'>
                                                                            <i class="fas fa-times"></i> Закрыть
                                                                        </button>
                                                                    ` : ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    `;
                    }).join('')}
                                            </div>
                                        ` : `
                                            <div class="empty-state">
                                                <div class="empty-state-icon">
                                                    <i class="fas fa-ticket-alt"></i>
                                                </div>
                                                <div class="empty-state-title">У вас нет обращений</div>
                                                <div class="empty-state-description">Если у вас возникли вопросы или проблемы, создайте новое обращение в поддержку</div>
                                                <button class="btn btn-primary mt-4" onclick="app.showCreateTicketModal()">
                                                    <i class="fas fa-plus-circle"></i> Создать обращение
                                                </button>
                                            </div>
                                        `}
                                    </div>
                                </div>

                                <!-- Chat Tab -->
                                <div id="chat-tab" class="support-tab-panel">
                                    <div class="chat-section">
                                        ${activeChatSession ? `
                                            <div class="active-chat-card">
                                                <div class="chat-status">
                                                    <div class="chat-status-icon active">
                                                        <i class="fas fa-comments"></i>
                                                    </div>
                                                    <div class="chat-status-content">
                                                        <h3>Чат активен</h3>
                                                        <p>Сессия начата ${new Date(activeChatSession.startedAt).toLocaleString('ru-RU')}</p>
                                                    </div>
                                                </div>
                                                <div class="chat-actions">
                                                    <button class="btn btn-primary" onclick="app.openChatModal()">
                                                        <i class="fas fa-comments"></i> Продолжить чат
                                                    </button>
                                                    <button class="btn btn-outline" onclick="app.endChatSession()">
                                                        <i class="fas fa-times"></i> Завершить чат
                                                    </button>
                                                </div>
                                            </div>
                                        ` : `
                                            <div class="start-chat-section">
                                                <div class="start-chat-icon">
                                                    <i class="fas fa-comments"></i>
                                                </div>
                                                <h2>Нужна срочная помощь?</h2>
                                                <p>Начните чат с нашими специалистами. Мы отвечаем быстро и поможем решить вашу проблему.</p>
                                                <button class="btn btn-primary btn-lg" onclick="app.startNewChat()">
                                                    <i class="fas fa-play-circle"></i> Начать чат
                                                </button>
                                            </div>
                                        `}

                                        <div class="chat-features">
                                            <div class="feature-card">
                                                <div class="feature-icon">
                                                    <i class="fas fa-clock"></i>
                                                </div>
                                                <div class="feature-content">
                                                    <h4>Быстрый ответ</h4>
                                                    <p>В среднем отвечаем в течение 2 часов</p>
                                                </div>
                                            </div>

                                            <div class="feature-card">
                                                <div class="feature-icon">
                                                    <i class="fas fa-shield-alt"></i>
                                                </div>
                                                <div class="feature-content">
                                                    <h4>Безопасно</h4>
                                                    <p>Все сообщения защищены и конфиденциальны</p>
                                                </div>
                                            </div>

                                            <div class="feature-card">
                                                <div class="feature-icon">
                                                    <i class="fas fa-robot"></i>
                                                </div>
                                                <div class="feature-content">
                                                    <h4>Автоответы</h4>
                                                    <p>Мгновенные ответы на частые вопросы</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Contact Tab -->
                                <div id="contact-tab" class="support-tab-panel">
                                    <div class="contact-section">
                                        <div class="contact-header">
                                            <h2>Другие способы связи</h2>
                                            <p>Если чат и обращения не подходят, свяжитесь с нами другими способами</p>
                                        </div>

                                        <div class="contact-methods">
                                            <div class="contact-method">
                                                <div class="contact-method-icon">
                                                    <i class="fas fa-phone"></i>
                                                </div>
                                                <div class="contact-method-content">
                                                    <h3>Телефон горячей линии</h3>
                                                    <p>+375 (29) 123-45-67</p>
                                                    <p class="contact-method-description">Пн-Пт: 9:00-18:00, Сб: 10:00-16:00</p>
                                                    <a href="tel:+375291234567" class="btn btn-outline">
                                                        <i class="fas fa-phone"></i> Позвонить
                                                    </a>
                                                </div>
                                            </div>

                                            <div class="contact-method">
                                                <div class="contact-method-icon">
                                                    <i class="fas fa-envelope"></i>
                                                </div>
                                                <div class="contact-method-content">
                                                    <h3>Email поддержка</h3>
                                                    <p>support@toolshop.by</p>
                                                    <p class="contact-method-description">Ответим в течение 24 часов</p>
                                                    <a href="mailto:support@toolshop.by" class="btn btn-outline">
                                                        <i class="fas fa-envelope"></i> Написать
                                                    </a>
                                                </div>
                                            </div>

                                            <div class="contact-method">
                                                <div class="contact-method-icon">
                                                    <i class="fas fa-map-marker-alt"></i>
                                                </div>
                                                <div class="contact-method-content">
                                                    <h3>Адрес офиса</h3>
                                                    <p>г. Минск, ул. Инструментальная, 15</p>
                                                    <p class="contact-method-description">Прием посетителей по предварительной записи</p>
                                                    <button class="btn btn-outline" onclick="app.showToast('Карта откроется в новой вкладке', 'info')">
                                                        <i class="fas fa-external-link-alt"></i> На карте
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="contact-working-hours">
                                            <h3>Режим работы</h3>
                                            <div class="working-hours-grid">
                                                <div class="working-hours-item">
                                                    <span class="day">Понедельник - Пятница</span>
                                                    <span class="hours">9:00 - 18:00</span>
                                                </div>
                                                <div class="working-hours-item">
                                                    <span class="day">Суббота</span>
                                                    <span class="hours">10:00 - 16:00</span>
                                                </div>
                                                <div class="working-hours-item">
                                                    <span class="day">Воскресенье</span>
                                                    <span class="hours">Выходной</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error('Error rendering support page:', error);
                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Ошибка загрузки</h1>
                                <p class="page-subtitle">Не удалось загрузить страницу поддержки</p>
                            </div>
                            <div class="flex gap-3">
                                <button class="btn btn-outline" onclick="app.nav('dashboard')">
                                    <i class="fas fa-arrow-left"></i> На главную
                                </button>
                                <button class="btn btn-primary" onclick="app.nav('support')">
                                    <i class="fas fa-sync"></i> Попробовать снова
                                </button>
                            </div>
                        </div>

                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="empty-state-title">Ошибка подключения</div>
                            <div class="empty-state-description">Не удалось загрузить данные поддержки. Проверьте подключение к интернету и попробуйте снова.</div>
                            <div class="mt-4">
                                <button class="btn btn-primary" onclick="app.nav('support')">
                                    <i class="fas fa-sync"></i> Попробовать снова
                                </button>
                            </div>
                        </div>
                    `;
                }
            },

            // FAQ Admin Functions
            async showCreateFaqCategoryModal() {
                document.getElementById('faq-category-modal-title').innerText = 'Создать категорию FAQ';
                document.getElementById('faq-category-id').value = '';
                document.getElementById('faq-category-name').value = '';
                document.getElementById('faq-category-description').value = '';
                document.getElementById('faq-category-sort-order').value = '0';
                document.getElementById('faq-category-active').checked = true;

                this.showModal('faq-category-modal');
            },

            async showCreateFaqArticleModal() {
                document.getElementById('faq-article-modal-title').innerText = 'Создать статью FAQ';
                document.getElementById('faq-article-id').value = '';
                document.getElementById('faq-article-category').value = '';
                document.getElementById('faq-article-title').value = '';
                document.getElementById('faq-article-content').value = '';
                document.getElementById('faq-article-tags').value = '';
                document.getElementById('faq-article-active').checked = true;

                await this.loadFaqCategoriesForSelect();
                this.showModal('faq-article-modal');
            },

            async editFaqCategory(categoryId) {
                try {
                    const category = await this.fetchApi(`faq/categories/${categoryId}`);
                    if (category) {
                        document.getElementById('faq-category-modal-title').innerText = 'Редактировать категорию FAQ';
                        document.getElementById('faq-category-id').value = category.id;
                        document.getElementById('faq-category-name').value = category.name;
                        document.getElementById('faq-category-description').value = category.description || '';
                        document.getElementById('faq-category-sort-order').value = category.sortOrder || 0;
                        document.getElementById('faq-category-active').checked = category.isActive;

                        this.showModal('faq-category-modal');
                    }
                } catch (error) {
                    this.showToast('Ошибка загрузки категории', 'error');
                }
            },

            async editFaqArticle(articleId) {
                try {
                    const article = await this.fetchApi(`faq/articles/${articleId}`);
                    if (article) {
                        document.getElementById('faq-article-modal-title').innerText = 'Редактировать статью FAQ';
                        document.getElementById('faq-article-id').value = article.id;
                        document.getElementById('faq-article-category').value = article.categoryId || '';
                        document.getElementById('faq-article-title').value = article.title;
                        document.getElementById('faq-article-content').value = article.content;
                        document.getElementById('faq-article-tags').value = article.tags || '';
                        document.getElementById('faq-article-active').checked = article.isActive;

                        await this.loadFaqCategoriesForSelect();
                        this.showModal('faq-article-modal');
                    }
                } catch (error) {
                    this.showToast('Ошибка загрузки статьи', 'error');
                }
            },

            async saveFaqCategory() {
                const formData = {
                    id: document.getElementById('faq-category-id').value,
                    name: document.getElementById('faq-category-name').value.trim(),
                    description: document.getElementById('faq-category-description').value.trim(),
                    sortOrder: parseInt(document.getElementById('faq-category-sort-order').value) || 0,
                    isActive: document.getElementById('faq-category-active').checked
                };

                if (!formData.name) {
                    this.showToast('Введите название категории', 'error');
                    return;
                }

                try {
                    let result;
                    if (formData.id) {
                        result = await this.fetchApi(`faq/categories/${formData.id}`, {
                            method: 'PUT',
                            body: JSON.stringify(formData)
                        });
                    } else {
                        result = await this.fetchApi('faq/categories', {
                            method: 'POST',
                            body: JSON.stringify(formData)
                        });
                    }

                    if (result) {
                        this.showToast(formData.id ? 'Категория обновлена' : 'Категория создана', 'success');
                        this.closeModal('faq-category-modal');
                        this.refreshAdminFaq();
                    }
                } catch (error) {
                    this.showToast('Ошибка сохранения категории', 'error');
                }
            },

            async saveFaqArticle() {
                const formData = {
                    id: document.getElementById('faq-article-id').value,
                    categoryId: document.getElementById('faq-article-category').value,
                    title: document.getElementById('faq-article-title').value.trim(),
                    content: document.getElementById('faq-article-content').value.trim(),
                    tags: document.getElementById('faq-article-tags').value.trim(),
                    isActive: document.getElementById('faq-article-active').checked
                };

                if (!formData.categoryId || !formData.title || !formData.content) {
                    this.showToast('Заполните обязательные поля', 'error');
                    return;
                }

                try {
                    let result;
                    if (formData.id) {
                        result = await this.fetchApi(`faq/articles/${formData.id}`, {
                            method: 'PUT',
                            body: JSON.stringify(formData)
                        });
                    } else {
                        result = await this.fetchApi('faq/articles', {
                            method: 'POST',
                            body: JSON.stringify(formData)
                        });
                    }

                    if (result) {
                        this.showToast(formData.id ? 'Статья обновлена' : 'Статья создана', 'success');
                        this.closeModal('faq-article-modal');
                        this.refreshAdminFaq();
                    }
                } catch (error) {
                    this.showToast('Ошибка сохранения статьи', 'error');
                }
            },

            async deleteFaqCategory(categoryId) {
                if (!confirm('Вы уверены, что хотите удалить эту категорию? Все статьи в ней будут также удалены.')) {
                    return;
                }

                try {
                    const result = await this.fetchApi(`faq/categories/${categoryId}`, {
                        method: 'DELETE'
                    });

                    if (result) {
                        this.showToast('Категория удалена', 'success');
                        this.refreshAdminFaq();
                    }
                } catch (error) {
                    this.showToast('Ошибка удаления категории', 'error');
                }
            },

            async deleteFaqArticle(articleId) {
                if (!confirm('Вы уверены, что хотите удалить эту статью?')) {
                    return;
                }

                try {
                    const result = await this.fetchApi(`faq/articles/${articleId}`, {
                        method: 'DELETE'
                    });

                    if (result) {
                        this.showToast('Статья удалена', 'success');
                        this.refreshAdminFaq();
                    }
                } catch (error) {
                    this.showToast('Ошибка удаления статьи', 'error');
                }
            },

            async refreshAdminFaq() {
                if (this.currentPage === 'admin-faq') {
                    this.nav('admin-faq');
                    this.showToast('Данные FAQ обновлены', 'success');
                }
            },

            async loadFaqCategoriesForSelect() {
                try {
                    const categories = await this.fetchApi('faq/categories');
                    const select = document.getElementById('faq-article-category');
                    select.innerHTML = '<option value="">Выберите категорию</option>';

                    if (categories) {
                        categories.forEach(category => {
                            const option = document.createElement('option');
                            option.value = category.id;
                            option.textContent = category.name;
                            select.appendChild(option);
                        });
                    }
                } catch (error) {
                    console.error('Error loading FAQ categories:', error);
                }
            },

            // FAQ Admin filtering and search functions
            debouncedFaqSearch() {
                clearTimeout(this.faqSearchTimeout);
                this.faqSearchTimeout = setTimeout(() => this.filterFaqItems(), 500);
            },

            filterFaqItems() {
                const searchTerm = document.getElementById('faq-search').value.toLowerCase().trim();
                const categoryFilter = document.getElementById('faq-category-filter').value;
                const statusFilter = document.getElementById('faq-status-filter').value;

                // Filter categories table
                const categoryRows = document.querySelectorAll('#admin-faq-categories tbody tr');
                categoryRows.forEach(row => {
                    const name = row.cells[2].textContent.toLowerCase();
                    const articlesCount = parseInt(row.cells[5].textContent);
                    const status = row.cells[6].querySelector('.status-badge').textContent.includes('Активна') ? 'active' : 'inactive';

                    let showRow = true;

                    if (searchTerm && !name.includes(searchTerm)) {
                        showRow = false;
                    }

                    if (statusFilter && status !== statusFilter) {
                        showRow = false;
                    }

                    row.style.display = showRow ? '' : 'none';
                });

                // Filter articles table
                const articleRows = document.querySelectorAll('#admin-faq-articles tbody tr');
                articleRows.forEach(row => {
                    const title = row.cells[1].textContent.toLowerCase();
                    const categoryName = row.cells[2].textContent.toLowerCase();
                    const status = row.cells[4].querySelector('.status-badge').textContent.includes('Активна') ? 'active' : 'inactive';

                    let showRow = true;

                    if (searchTerm && !(title.includes(searchTerm) || categoryName.includes(searchTerm))) {
                        showRow = false;
                    }

                    if (categoryFilter && categoryName !== categoryFilter.toLowerCase()) {
                        showRow = false;
                    }

                    if (statusFilter && status !== statusFilter) {
                        showRow = false;
                    }

                    row.style.display = showRow ? '' : 'none';
                });

                this.updateFaqTableCounts();
                this.updateBulkDeleteButton();
            },

            resetFaqFilters() {
                document.getElementById('faq-search').value = '';
                document.getElementById('faq-category-filter').value = '';
                document.getElementById('faq-status-filter').value = '';

                // Show all rows
                const allRows = document.querySelectorAll('#admin-faq-categories tbody tr, #admin-faq-articles tbody tr');
                allRows.forEach(row => row.style.display = '');

                this.updateFaqTableCounts();
                this.updateBulkDeleteButton();
            },

            updateFaqTableCounts() {
                // Update visible row counts in headers
                const categoryRows = document.querySelectorAll('#admin-faq-categories tbody tr[style=""], #admin-faq-categories tbody tr:not([style])');
                const articleRows = document.querySelectorAll('#admin-faq-articles tbody tr[style=""], #admin-faq-articles tbody tr:not([style])');

                const categoryHeader = document.querySelector('#admin-faq-categories .card-title');
                const articleHeader = document.querySelector('#admin-faq-articles .card-title');

                if (categoryHeader) {
                    const baseText = categoryHeader.innerHTML.split(' <span')[0];
                    categoryHeader.innerHTML = `${baseText} <span class="text-tertiary">(${categoryRows.length})</span>`;
                }

                if (articleHeader) {
                    const baseText = articleHeader.innerHTML.split(' <span')[0];
                    articleHeader.innerHTML = `${baseText} <span class="text-tertiary">(${articleRows.length})</span>`;
                }
            },

            // FAQ bulk operations functions
            toggleAllCategories() {
                const selectAllCheckbox = document.getElementById('select-all-categories');
                const categoryCheckboxes = document.querySelectorAll('.category-checkbox');

                const isChecked = selectAllCheckbox.checked;
                categoryCheckboxes.forEach(cb => {
                    cb.checked = isChecked;
                });

                this.updateBulkDeleteButton();
            },

            updateBulkDeleteButton() {
                const selectedCategories = document.querySelectorAll('.category-checkbox:checked');
                const bulkDeleteBtn = document.getElementById('bulk-delete-categories-btn');

                if (bulkDeleteBtn) {
                    bulkDeleteBtn.disabled = selectedCategories.length === 0;
                }
            },

            async bulkDeleteFaqCategories() {
                const selectedCheckboxes = document.querySelectorAll('.category-checkbox:checked');
                const selectedIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.id));

                if (selectedIds.length === 0) {
                    this.showToast('Выберите категории для удаления', 'error');
                    return;
                }

                if (!confirm(`Вы уверены, что хотите удалить ${selectedIds.length} категорию(ий)? Все статьи в них будут также удалены.`)) {
                    return;
                }

                try {
                    const results = await Promise.allSettled(
                        selectedIds.map(id => this.fetchApi(`faq/categories/${id}`, { method: 'DELETE' }))
                    );

                    const successful = results.filter(r => r.status === 'fulfilled').length;
                    const failed = results.filter(r => r.status === 'rejected').length;

                    if (successful > 0) {
                        this.showToast(`Удалено ${successful} категорию(ий)`, 'success');
                        if (failed > 0) {
                            this.showToast(`Не удалось удалить ${failed} категорию(ий)`, 'error');
                        }
                        this.refreshAdminFaq();
                    } else {
                        this.showToast('Ошибка удаления категорий', 'error');
                    }
                } catch (error) {
                    this.showToast('Ошибка при массовом удалении', 'error');
                }
            },

            async exportFaqCategories() {
                try {
                    const categories = await this.fetchApi('faq/categories');
                    if (!categories || categories.length === 0) {
                        this.showToast('Нет данных для экспорта', 'error');
                        return;
                    }

                    // Create CSV content
                    let csvContent = 'ID,Название,Описание,Порядок сортировки,Статей,Активна\n';

                    categories.forEach(cat => {
                        csvContent += `"${cat.id}","${cat.name}","${cat.description || ''}","${cat.sortOrder || 0}","${cat.articlesCount || 0}","${cat.isActive ? 'Да' : 'Нет'}"\n`;
                    });

                    // Create and download file
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `faq_categories_${new Date().toISOString().split('T')[0]}.csv`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    this.showToast('Категории FAQ экспортированы в CSV', 'success');
                } catch (error) {
                    this.showToast('Ошибка при экспорте категорий', 'error');
                }
            },

            async selectAllFaqCategories() {
                const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
                const allChecked = Array.from(categoryCheckboxes).every(cb => cb.checked);

                if (allChecked) {
                    // Uncheck all
                    categoryCheckboxes.forEach(cb => cb.checked = false);
                } else {
                    // Check all
                    categoryCheckboxes.forEach(cb => cb.checked = true);
                }

                // Update select all checkbox
                const selectAllCheckbox = document.getElementById('select-all-categories');
                selectAllCheckbox.checked = !allChecked;

                this.updateBulkDeleteButton();
            },

            // Support Tab Switching
            switchSupportTab(tabName) {
                // Update tab buttons
                document.querySelectorAll('.support-tab-btn').forEach(tab => {
                    tab.classList.remove('active');
                });

                document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

                // Update tab content
                document.querySelectorAll('.support-tab-panel').forEach(content => {
                    content.classList.remove('active');
                });

                document.getElementById(`${tabName}-tab`).classList.add('active');

                // Update URL hash for bookmarking
                window.location.hash = `support-${tabName}`;
            },

            // FAQ Functions
            debouncedSearchFaq() {
                clearTimeout(this.faqSearchTimeout);
                this.faqSearchTimeout = setTimeout(() => this.searchFaq(), 500);
            },

            async searchFaq() {
                const query = document.getElementById('faq-search').value.trim();
                if (!query) {
                    // Reload categories if search is empty
                    this.nav('support');
                    return;
                }

                try {
                    const results = await this.fetchApi(`faq/search?query=${encodeURIComponent(query)}`);
                    const faqContent = document.getElementById('faq-content');

                    if (results && results.length > 0) {
                        faqContent.innerHTML = `
                            <div class="mb-4">
                                <h3 class="font-semibold text-lg">Результаты поиска "${query}"</h3>
                                <p class="text-tertiary">Найдено ${results.length} статей</p>
                            </div>
                            <div class="space-y-4">
                                ${results.map(article => `
                                    <div class="border rounded-lg p-6 hover:shadow-md transition-shadow">
                                        <div class="flex justify-between items-start mb-3">
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-lg mb-2">${article.title}</h4>
                                                <p class="text-tertiary text-sm mb-2">${article.category?.name || 'Без категории'}</p>
                                                <p class="text-secondary">${article.content?.substring(0, 200)}${article.content?.length > 200 ? '...' : ''}</p>
                                            </div>
                                            <div class="text-sm text-tertiary ml-4">
                                                ${article.viewCount} просмотров
                                            </div>
                                        </div>
                                        <button class="btn btn-primary btn-sm" onclick='app.viewFaqArticle(${article.id})'>
                                            <i class="fas fa-eye"></i> Читать полностью
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    } else {
                        faqContent.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon">
                                    <i class="fas fa-search"></i>
                                </div>
                                <div class="empty-state-title">Ничего не найдено</div>
                                <div class="empty-state-description">Попробуйте изменить запрос или создать обращение в поддержку</div>
                                <button class="btn btn-primary mt-4" onclick="app.showCreateTicketModal()">
                                    <i class="fas fa-plus"></i> Создать обращение
                                </button>
                            </div>
                        `;
                    }
                } catch (error) {
                    this.showToast('Ошибка поиска', 'error');
                }
            },

            async loadFaqCategory(categoryId, categoryName) {
                try {
                    const articles = await this.fetchApi(`faq/categories/${categoryId}/articles`);
                    const faqContent = document.getElementById('faq-content');

                    faqContent.innerHTML = `
                        <div class="mb-6">
                            <button class="btn btn-outline mb-4" onclick="app.nav('support')">
                                <i class="fas fa-arrow-left"></i> Назад к категориям
                            </button>
                            <h3 class="font-semibold text-xl mb-2">${categoryName}</h3>
                            <p class="text-tertiary">Найдено статей: ${articles?.length || 0}</p>
                        </div>

                        ${articles && articles.length > 0 ? `
                            <div class="faq-articles-grid">
                                ${articles.map(article => `
                                    <div class="faq-article-card">
                                        <div class="faq-article-header">
                                            <div class="faq-article-icon">
                                                <i class="fas fa-book-open"></i>
                                            </div>
                                            <div class="faq-article-meta">
                                                <div class="faq-article-views">
                                                    <i class="fas fa-eye"></i>
                                                    ${article.viewCount || 0}
                                                </div>
                                                <div class="faq-article-category">
                                                    ${categoryName}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="faq-article-content">
                                            <h4 class="faq-article-title">${article.title}</h4>
                                            <p class="faq-article-preview">${article.content?.substring(0, 250)}${article.content?.length > 250 ? '...' : ''}</p>
                                        </div>

                                        <div class="faq-article-footer">
                                            <div class="faq-article-tags">
                                                ${article.tags ? article.tags.split(',').slice(0, 3).map(tag => `<span class="faq-tag">${tag.trim()}</span>`).join('') : ''}
                                            </div>
                                            <button class="btn btn-primary btn-sm faq-read-btn" onclick='app.viewFaqArticle(${article.id})'>
                                                <i class="fas fa-arrow-right"></i> Читать
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-state-icon">
                                    <i class="fas fa-file-alt"></i>
                                </div>
                                <div class="empty-state-title">Статей в этой категории нет</div>
                                <div class="empty-state-description">Статьи скоро будут добавлены</div>
                            </div>
                        `}
                    `;
                } catch (error) {
                    this.showToast('Ошибка загрузки статей', 'error');
                }
            },

            async viewFaqArticle(articleId) {
                try {
                    const article = await this.fetchApi(`faq/articles/${articleId}`);
                    if (article) {
                        document.getElementById('faq-modal-title').innerText = article.title;
                        document.getElementById('faq-modal-content').innerHTML = `
                            <div class="mb-4">
                                <div class="text-sm text-tertiary mb-2">Категория: ${article.category?.name || 'Без категории'}</div>
                                <div class="text-sm text-tertiary">Просмотров: ${article.viewCount}</div>
                            </div>
                            <div class="prose max-w-none">
                                ${article.content}
                            </div>
                            ${article.tags ? `
                                <div class="mt-6 pt-4 border-t">
                                    <div class="text-sm text-tertiary mb-2">Теги:</div>
                                    <div class="flex flex-wrap gap-2">
                                        ${article.tags.split(',').map(tag => `<span class="bg-gray-100 px-2 py-1 rounded text-sm">${tag.trim()}</span>`).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        `;
                        this.showModal('faq-modal');
                    }
                } catch (error) {
                    this.showToast('Ошибка загрузки статьи', 'error');
                }
            },

            // Ticket Functions
            showCreateTicketModal() {
                // Switch to tickets tab
                this.switchSupportTab('tickets');

                document.getElementById('create-ticket-modal-title').innerText = 'Новое обращение';
                document.getElementById('ticket-subject').value = '';
                document.getElementById('ticket-description').value = '';
                document.getElementById('ticket-category').value = 'technical';
                document.getElementById('ticket-priority').value = 'normal';

                this.showModal('create-ticket-modal');
            },

            async createTicket() {
                const subject = document.getElementById('ticket-subject').value.trim();
                const description = document.getElementById('ticket-description').value.trim();
                const category = document.getElementById('ticket-category').value;
                const priority = document.getElementById('ticket-priority').value;

                if (!subject || !description) {
                    this.showToast('Заполните все обязательные поля', 'error');
                    return;
                }

                try {
                    const result = await this.fetchApi('support/tickets', {
                        method: 'POST',
                        body: JSON.stringify({
                            subject: subject,
                            description: description,
                            category: category,
                            priority: priority
                        })
                    });

                    if (result) {
                        this.showToast('Обращение успешно создано!', 'success');
                        this.closeModal('create-ticket-modal');
                        this.nav('support'); // Refresh support page
                        this.switchSupportTab('tickets'); // Switch to tickets tab
                    }
                } catch (error) {
                    this.showToast('Ошибка создания обращения', 'error');
                }
            },

            async viewTicket(ticketId) {
                try {
                    const ticket = await this.fetchApi(`support/tickets/${ticketId}`);
                    if (ticket) {
                        document.getElementById('ticket-modal-title').innerText = `Обращение #${ticket.id}`;
                        document.getElementById('ticket-modal-content').innerHTML = `
                            <div class="space-y-6">
                                <!-- Ticket Header -->
                                <div class="border-b pb-4">
                                    <div class="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 class="font-bold text-xl mb-2">${ticket.subject}</h3>
                                            <p class="text-tertiary">${ticket.description}</p>
                                        </div>
                                        <div class="text-right">
                                            <div class="status-badge ${ticket.status === 'open' ? 'status-new' :
                                ticket.status === 'in_progress' ? 'status-processing' :
                                    ticket.status === 'closed' ? 'status-completed' : 'status-pending'} mb-2">
                                                ${ticket.status === 'open' ? 'Открыт' :
                                ticket.status === 'in_progress' ? 'В работе' :
                                    ticket.status === 'waiting_for_user' ? 'Ожидает ответа' :
                                        ticket.status === 'closed' ? 'Закрыт' : ticket.status}
                                            </div>
                                            <div class="text-sm text-tertiary">
                                                Создано: ${new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <div class="text-tertiary">Приоритет</div>
                                            <div class="font-medium ${ticket.priority === 'urgent' ? 'text-danger' :
                                ticket.priority === 'high' ? 'text-warning' :
                                    ticket.priority === 'normal' ? 'text-primary' : 'text-tertiary'}">
                                                ${ticket.priority === 'urgent' ? 'Срочно' :
                                ticket.priority === 'high' ? 'Высокий' :
                                    ticket.priority === 'normal' ? 'Нормальный' : ticket.priority}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="text-tertiary">Категория</div>
                                            <div class="font-medium">${ticket.category || 'Не указана'}</div>
                                        </div>
                                        <div>
                                            <div class="text-tertiary">Назначен</div>
                                            <div class="font-medium">${ticket.assignedUser?.fullName || 'Не назначен'}</div>
                                        </div>
                                        <div>
                                            <div class="text-tertiary">Обновлено</div>
                                            <div class="font-medium">${new Date(ticket.updatedAt).toLocaleDateString('ru-RU')}</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Messages -->
                                <div>
                                    <h4 class="font-semibold mb-4">Сообщения (${ticket.messages?.length || 0})</h4>
                                    <div class="space-y-4 max-h-96 overflow-y-auto">
                                        ${ticket.messages && ticket.messages.length > 0 ? ticket.messages.map(message => `
                                            <div class="flex gap-3 ${message.userId === this.currentUserId ? 'justify-end' : ''}">
                                                <div class="flex-1 max-w-md">
                                                    <div class="bg-${message.userId === this.currentUserId ? 'primary' : 'gray-100'} rounded-lg p-3">
                                                        <div class="flex items-center gap-2 mb-2">
                                                            <div class="font-medium text-sm">
                                                                ${message.user?.fullName || 'Пользователь'}
                                                                ${message.isInternal ? ' (внутреннее)' : ''}
                                                            </div>
                                                            <div class="text-xs text-tertiary">
                                                                ${new Date(message.createdAt).toLocaleString('ru-RU')}
                                                            </div>
                                                        </div>
                                                        <div class="text-sm">
                                                            ${message.message}
                                                        </div>
                                                        ${message.fileUrl ? `
                                                            <div class="mt-2">
                                                                <a href="${message.fileUrl}" target="_blank" class="text-primary text-sm">
                                                                    <i class="fas fa-paperclip"></i> ${message.fileName || 'Файл'}
                                                                </a>
                                                            </div>
                                                        ` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('') : `
                                            <div class="text-center py-8 text-tertiary">
                                                <i class="fas fa-comments text-2xl mb-2"></i>
                                                <div>Сообщений пока нет</div>
                                            </div>
                                        `}
                                    </div>
                                </div>

                                <!-- Add Message Form -->
                                ${ticket.status !== 'closed' ? `
                                    <div class="border-t pt-4">
                                        <h4 class="font-semibold mb-3">Добавить сообщение</h4>
                                        <div class="space-y-3">
                                            <textarea id="ticket-message-${ticket.id}" class="form-input" rows="3" placeholder="Введите ваше сообщение..."></textarea>
                                            <div class="flex gap-2">
                                                <button class="btn btn-primary" onclick='app.sendTicketMessage(${ticket.id})'>
                                                    <i class="fas fa-paper-plane"></i> Отправить
                                                </button>
                                                ${ticket.status !== 'closed' ? `
                                                    <button class="btn btn-outline" onclick='app.closeTicket(${ticket.id})'>
                                                        <i class="fas fa-times"></i> Закрыть обращение
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                        this.showModal('ticket-modal');
                    }
                } catch (error) {
                    this.showToast('Ошибка загрузки обращения', 'error');
                }
            },

            async sendTicketMessage(ticketId) {
                const messageText = document.getElementById(`ticket-message-${ticketId}`).value.trim();
                if (!messageText) {
                    this.showToast('Введите сообщение', 'error');
                    return;
                }

                try {
                    const result = await this.fetchApi(`support/tickets/${ticketId}/messages`, {
                        method: 'POST',
                        body: JSON.stringify({
                            message: messageText,
                            messageType: 'text'
                        })
                    });

                    if (result) {
                        this.showToast('Сообщение отправлено', 'success');
                        document.getElementById(`ticket-message-${ticketId}`).value = '';
                        this.closeModal('ticket-modal');
                        this.nav('support'); // Refresh to show updated ticket
                    }
                } catch (error) {
                    this.showToast('Ошибка отправки сообщения', 'error');
                }
            },

            async closeTicket(ticketId) {
                if (!confirm('Вы уверены, что хотите закрыть это обращение?')) {
                    return;
                }

                try {
                    const result = await this.fetchApi(`support/tickets/${ticketId}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            status: 'closed'
                        })
                    });

                    if (result) {
                        this.showToast('Обращение закрыто', 'success');
                        this.closeModal('ticket-modal');
                        this.nav('support'); // Refresh support page
                    }
                } catch (error) {
                    this.showToast('Ошибка закрытия обращения', 'error');
                }
            },

            async addMessageToTicket(ticketId) {
                // This will open the ticket modal where user can add message
                await this.viewTicket(ticketId);
            },

            // Chat Functions
            async startNewChat() {
                try {
                    const result = await this.fetchApi('chat/start', {
                        method: 'POST'
                    });

                    if (result) {
                        this.showToast('Чат начат! Ожидайте ответа специалиста.', 'success');
                        this.nav('support'); // Refresh to show active chat
                        this.switchSupportTab('chat');
                        setTimeout(() => this.openChatModal(), 1000); // Open chat modal after a short delay
                    }
                } catch (error) {
                    this.showToast('Ошибка запуска чата', 'error');
                }
            },

            async openChatModal() {
                try {
                    const session = await this.fetchApi('chat/session');
                    if (!session) {
                        this.showToast('Сессия чата не найдена', 'error');
                        return;
                    }

                    // Load messages
                    const messages = await this.fetchApi(`chat/messages?sessionId=${session.sessionId}&since=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`);

                    document.getElementById('chat-modal-title').innerText = 'Онлайн-чат с поддержкой';
                    document.getElementById('chat-messages').innerHTML = messages && messages.length > 0 ? messages.map(message => `
                        <div class="flex ${message.userId === this.currentUserId ? 'justify-end' : 'justify-start'} mb-3">
                            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.userId === this.currentUserId ? 'bg-primary text-white' : 'bg-gray-100'}">
                                <div class="text-xs opacity-75 mb-1">
                                    ${message.user?.fullName || 'Пользователь'} • ${new Date(message.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div class="text-sm">${message.message}</div>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="text-center py-8 text-tertiary">
                            <i class="fas fa-comments text-2xl mb-2"></i>
                            <div>Начните разговор...</div>
                        </div>
                    `;

                    // Set session ID for sending messages
                    document.getElementById('chat-session-id').value = session.sessionId;

                    // Auto-scroll to bottom
                    setTimeout(() => {
                        const messagesContainer = document.getElementById('chat-messages');
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }, 100);

                    this.showModal('chat-modal');

                    // Start polling for new messages
                    this.startChatPolling(session.sessionId);
                } catch (error) {
                    this.showToast('Ошибка загрузки чата', 'error');
                }
            },

            startChatPolling(sessionId) {
                this.stopChatPolling(); // Stop any existing polling

                this.chatPollingInterval = setInterval(async () => {
                    try {
                        const lastMessageTime = new Date(Date.now() - 30000).toISOString(); // Last 30 seconds
                        const newMessages = await this.fetchApi(`chat/messages?sessionId=${sessionId}&since=${lastMessageTime}`);

                        if (newMessages && newMessages.length > 0) {
                            const messagesContainer = document.getElementById('chat-messages');

                            newMessages.forEach(message => {
                                const messageElement = document.createElement('div');
                                messageElement.className = `flex ${message.userId === this.currentUserId ? 'justify-end' : 'justify-start'} mb-3`;
                                messageElement.innerHTML = `
                                    <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.userId === this.currentUserId ? 'bg-primary text-white' : 'bg-gray-100'}">
                                        <div class="text-xs opacity-75 mb-1">
                                            ${message.user?.fullName || 'Пользователь'} • ${new Date(message.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div class="text-sm">${message.message}</div>
                                    </div>
                                `;
                                messagesContainer.appendChild(messageElement);
                            });

                            // Auto-scroll to bottom
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                    } catch (error) {
                        console.error('Chat polling error:', error);
                    }
                }, 5000); // Poll every 5 seconds
            },

            stopChatPolling() {
                if (this.chatPollingInterval) {
                    clearInterval(this.chatPollingInterval);
                    this.chatPollingInterval = null;
                }
            },

            async sendChatMessage() {
                const sessionId = document.getElementById('chat-session-id').value;
                const message = document.getElementById('chat-message-input').value.trim();

                if (!message) {
                    this.showToast('Введите сообщение', 'error');
                    return;
                }

                try {
                    const result = await this.fetchApi('chat/messages', {
                        method: 'POST',
                        body: JSON.stringify({
                            sessionId: sessionId,
                            message: message,
                            messageType: 'text'
                        })
                    });

                    if (result) {
                        // Add message to UI immediately
                        const messagesContainer = document.getElementById('chat-messages');
                        const messageElement = document.createElement('div');
                        messageElement.className = 'flex justify-end mb-3';
                        messageElement.innerHTML = `
                            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-primary text-white">
                                <div class="text-xs opacity-75 mb-1">
                                    Вы • ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div class="text-sm">${message}</div>
                            </div>
                        `;
                        messagesContainer.appendChild(messageElement);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;

                        // Clear input
                        document.getElementById('chat-message-input').value = '';

                        this.showToast('Сообщение отправлено', 'success');
                    }
                } catch (error) {
                    this.showToast('Ошибка отправки сообщения', 'error');
                }
            },

            async endChatSession() {
                if (!confirm('Вы уверены, что хотите завершить чат?')) {
                    return;
                }

                try {
                    const result = await this.fetchApi('chat/end', {
                        method: 'POST',
                        body: JSON.stringify({
                            rating: 5,
                            feedback: 'Чат завершен пользователем'
                        })
                    });

                    if (result) {
                        this.showToast('Чат завершен', 'success');
                        this.stopChatPolling();
                        this.closeModal('chat-modal');
                        this.nav('support'); // Refresh support page
                    }
                } catch (error) {
                    this.showToast('Ошибка завершения чата', 'error');
                }
            },

            async renderNotifications() {
                try {
                    const notifications = await this.fetchApi('notifications');

                    if (!notifications || notifications.length === 0) {
                        return `
                            <div class="page-header">
                                <div>
                                    <h1 class="page-title">Мои уведомления</h1>
                                    <p class="page-subtitle">Уведомления от администрации магазина</p>
                                </div>
                                <div class="flex gap-3">
                                    <button class="btn btn-outline" onclick="app.nav('dashboard')">
                                        <i class="fas fa-arrow-left"></i> На главную
                                    </button>
                                </div>
                            </div>

                            <div class="empty-state">
                                <div class="empty-state-icon">
                                    <i class="fas fa-bell"></i>
                                </div>
                                <div class="empty-state-title">Уведомлений нет</div>
                                <div class="empty-state-description">Здесь будут отображаться уведомления от администрации</div>
                            </div>
                        `;
                    }

                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Мои уведомления</h1>
                                <p class="page-subtitle">Всего уведомлений: ${notifications.length} • Непрочитанных: ${notifications.filter(n => !n.isRead).length}</p>
                            </div>
                            <div class="flex gap-3">
                                <button class="btn btn-outline" onclick="app.nav('dashboard')">
                                    <i class="fas fa-arrow-left"></i> На главную
                                </button>
                                <button class="btn btn-primary" onclick="app.refreshNotifications()">
                                    <i class="fas fa-sync"></i> Обновить
                                </button>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Уведомления</div>
                                <div class="text-sm text-tertiary">
                                    Новые уведомления появляются сверху
                                </div>
                            </div>

                            <div class="notifications-list">
                                ${notifications.map(notification => `
                                    <div class="notification-item ${!notification.isRead ? 'unread' : ''}">
                                        ${!notification.isRead ? '<div class="notification-unread-dot"></div>' : ''}

                                        <div class="notification-header ${!notification.isRead ? 'unread' : ''}">
                                            <div class="notification-title">
                                                ${notification.title || 'Уведомление'}
                                            </div>
                                            <div class="notification-date">
                                                ${notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('ru-RU') : ''}
                                            </div>
                                        </div>

                                        ${notification.type ? `
                                            <div class="notification-type ${!notification.isRead ? 'unread' : ''}">
                                                Тип: ${notification.type === 'system' ? 'Системное' :
                                notification.type === 'order' ? 'Заказ' :
                                    notification.type === 'marketing' ? 'Маркетинг' :
                                        notification.type}
                                            </div>
                                        ` : ''}

                                        <div class="notification-message ${!notification.isRead ? 'unread' : ''}">
                                            ${notification.message || ''}
                                        </div>

                                        ${!notification.isRead ? `
                                            <div class="notification-actions unread">
                                                <button class="btn btn-outline btn-sm" data-notification-id="${notification.id}" onclick="app.markNotificationAsRead(Number(this.dataset.notificationId))">
                                                    <i class="fas fa-check"></i> Отметить как прочитанное
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                } catch (error) {
                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Мои уведомления</h1>
                                <p class="page-subtitle">Ошибка загрузки уведомлений</p>
                            </div>
                            <div class="flex gap-3">
                                <button class="btn btn-outline" onclick="app.nav('dashboard')">
                                    <i class="fas fa-arrow-left"></i> На главную
                                </button>
                            </div>
                        </div>

                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="empty-state-title">Ошибка загрузки</div>
                            <div class="empty-state-description">Не удалось загрузить уведомления</div>
                        </div>
                    `;
                }
            },

            async refreshNotifications() {
                try {
                    this.nav('notifications');
                    this.showToast('Уведомления обновлены', 'success');
                } catch (error) {
                    this.showToast('Ошибка обновления уведомлений', 'error');
                }
            },

            async markNotificationAsRead(notificationId) {
                try {
                    await this.fetchApi(`notifications/${notificationId}/read`, {
                        method: 'PUT'
                    });

                    // Update the notification in the UI
                    const btn = document.querySelector('.notification-item button[data-notification-id="' + notificationId + '"]');
                    const notificationItem = btn ? btn.closest('.notification-item') : null;
                    if (notificationItem) {
                        notificationItem.classList.remove('unread');
                        notificationItem.style.background = 'var(--bg-card)';

                        // Remove the dot and actions
                        const dot = notificationItem.querySelector('div[style*="position: absolute"]');
                        if (dot) dot.remove();

                        const actions = notificationItem.querySelector('.notification-actions');
                        if (actions) actions.remove();

                        // Adjust margins
                        const elements = notificationItem.querySelectorAll('[style*="margin-left: 24px"]');
                        elements.forEach(el => {
                            el.style.marginLeft = '0';
                        });
                    }

                    // Update nav badge
                    const notificationsItem = this.navConfig.find(item => item.id === 'notifications');
                    if (notificationsItem && notificationsItem.badge > 0) {
                        notificationsItem.badge--;
                        this.renderMenu();
                    }

                    this.showToast('Уведомление отмечено как прочитанное', 'success');
                } catch (error) {
                    this.showToast('Ошибка при отметке уведомления', 'error');
                }
            },







            // Show modal
            showModal(modalId) {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            },

            // Close modal
            closeModal(modalId) {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            },

            // Show user menu
            showUserMenu() {
                alert('Меню пользователя:\n\n1. Мой профиль\n2. Настройки\n3. Сменить пароль\n4. Выход');
            },

            // Show send notification modal
            async showSendNotificationModal() {
                // Load users for recipient selection
                const users = await this.fetchApi('users');
                const userSelect = document.getElementById('notification-user');

                if (users) {
                    userSelect.innerHTML = '<option value="">Все активные пользователи</option>';
                    users.forEach(user => {
                        if (user.isActive) {
                            const option = document.createElement('option');
                            option.value = user.id;
                            option.textContent = `${user.fullName || user.email} (${user.email})`;
                            userSelect.appendChild(option);
                        }
                    });
                }

                // Reset form
                document.getElementById('notification-type').value = 'system';
                document.getElementById('notification-title').value = '';
                document.getElementById('notification-message').value = '';

                this.showModal('send-notification-modal');
            },

            // Send notification
            async sendNotification() {
                const userId = document.getElementById('notification-user').value;
                const type = document.getElementById('notification-type').value;
                const title = document.getElementById('notification-title').value.trim();
                const message = document.getElementById('notification-message').value.trim();

                if (!title || !message) {
                    this.showToast('Заполните заголовок и текст уведомления', 'error');
                    return;
                }

                const notificationData = {
                    userId: userId ? parseInt(userId) : null,
                    type: type,
                    title: title,
                    message: message
                };

                const btn = document.getElementById('send-notification-btn');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';

                try {
                    const result = await this.fetchApi('admin-notifications/send', {
                        method: 'POST',
                        body: JSON.stringify(notificationData)
                    });

                    if (result) {
                        this.showToast(result.message || 'Уведомление отправлено успешно', 'success');
                        this.closeModal('send-notification-modal');
                    } else {
                        this.showToast('Ошибка отправки уведомления', 'error');
                    }
                } catch (error) {
                    this.showToast('Ошибка отправки уведомления', 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            },

            // Admin functions
            async showCreateProductModal() {
                document.getElementById('product-admin-modal-title').innerText = 'Добавить товар';
                document.getElementById('product-id').value = '';
                document.getElementById('product-article').value = '';
                document.getElementById('product-name').value = '';
                document.getElementById('product-description').value = '';
                document.getElementById('product-price').value = '';
                document.getElementById('product-stock').value = '0';
                document.getElementById('product-category').value = '';
                document.getElementById('product-image').value = '';
                document.getElementById('product-active').checked = true;

                await this.loadCategoriesForSelect();
                this.showModal('product-admin-modal');
            },


            // Edit product - show modal with product data
            async editProduct(productId) {
                // Use adminProductsData instead of products
                const product = this.adminProductsData?.find(p => p.id === productId);
                if (!product) {
                    this.showToast('Товар не найден', 'error');
                    return;
                }

                // Fill modal with product data
                document.getElementById('edit-product-id').value = product.id;
                document.getElementById('edit-product-name').value = product.name;
                document.getElementById('edit-product-price').value = product.price;
                document.getElementById('edit-product-stock').value = product.stock;
                document.getElementById('edit-product-article').value = product.article;

                // Show modal
                this.showModal('edit-product-modal');
            },

            // Save edited product
            async saveEditedProduct() {
                const productId = parseInt(document.getElementById('edit-product-id').value);
                const name = document.getElementById('edit-product-name').value.trim();
                const price = parseFloat(document.getElementById('edit-product-price').value);
                const stock = parseInt(document.getElementById('edit-product-stock').value);

                // Validate
                if (!name) {
                    this.showToast('Введите название товара', 'error');
                    return;
                }

                if (isNaN(price) || price < 0) {
                    this.showToast('Неверная цена', 'error');
                    return;
                }

                if (isNaN(stock) || stock < 0) {
                    this.showToast('Неверное количество', 'error');
                    return;
                }

                // Get original product data
                const product = this.adminProductsData?.find(p => p.id === productId);
                if (!product) {
                    this.showToast('Товар не найден', 'error');
                    return;
                }

                // Update product
                try {
                    const result = await this.fetchApi(`products/${productId}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            name: name,
                            price: price,
                            stock: stock,
                            article: product.article,
                            categoryId: product.categoryId,
                            description: product.description,
                            isActive: product.isActive
                        })
                    });

                    if (result) {
                        this.showToast('Товар обновлен', 'success');
                        this.closeModal('edit-product-modal');
                        // Reload products data
                        this.adminProductsData = await this.fetchApi('products?includeInactive=true');
                        this.renderProductsTable();
                    }
                } catch (error) {
                    this.showToast('Ошибка обновления товара', 'error');
                    console.error('Edit product error:', error);
                }
            },

            async deleteProduct(productId) {
                if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
                    return;
                }

                try {
                    const result = await this.fetchApi(`products/${productId}`, {
                        method: 'DELETE'
                    });

                    if (result) {
                        this.showToast('Товар удален', 'success');
                        await this.loadProducts();
                        this.nav('admin');
                    }
                } catch (error) {
                    this.showToast('Ошибка удаления товара', 'error');
                }
            },

            async showCreateCategoryModal() {
                document.getElementById('category-admin-modal-title').innerText = 'Добавить категорию';
                document.getElementById('category-id').value = '';
                document.getElementById('category-name').value = '';
                document.getElementById('category-parent').value = '';

                await this.loadCategoriesForParentSelect();
                this.showModal('category-admin-modal');
            },

            async editCategory(categoryId) {
                const categories = await this.fetchApi('categories');
                const category = categories?.find(c => c.id === categoryId);
                if (!category) {
                    this.showToast('Категория не найдена', 'error');
                    return;
                }

                document.getElementById('category-admin-modal-title').innerText = 'Редактировать категорию';
                document.getElementById('category-id').value = category.id;
                document.getElementById('category-name').value = category.name;
                document.getElementById('category-parent').value = category.parentId || '';

                await this.loadCategoriesForParentSelect();
                this.showModal('category-admin-modal');
            },

            async saveCategory() {
                const formData = {
                    id: document.getElementById('category-id').value,
                    name: document.getElementById('category-name').value,
                    parentId: document.getElementById('category-parent').value || null
                };

                if (!formData.name) {
                    this.showToast('Введите название категории', 'error');
                    return;
                }

                try {
                    let result;
                    if (formData.id) {
                        // Update
                        result = await this.fetchApi(`categories/${formData.id}`, {
                            method: 'PUT',
                            body: JSON.stringify(formData)
                        });
                    } else {
                        // Create
                        result = await this.fetchApi('categories', {
                            method: 'POST',
                            body: JSON.stringify(formData)
                        });
                    }

                    if (result) {
                        this.showToast(formData.id ? 'Категория обновлена' : 'Категория создана', 'success');
                        this.closeModal('category-admin-modal');

                        // Refresh categories in product modal if it's open
                        const productModal = document.getElementById('product-admin-modal');
                        if (productModal && productModal.classList.contains('active')) {
                            await this.loadCategoriesForSelect();
                        }

                        // Refresh the view if on admin/manager pages
                        if (['admin-categories', 'manager-categories'].includes(this.currentPage)) {
                            this.nav(this.currentPage);
                        } else if (this.currentPage === 'admin' || this.currentPage === 'manager-products') {
                            this.nav(this.currentPage);
                        }
                    }
                } catch (error) {
                    this.showToast('Ошибка сохранения категории', 'error');
                }
            },

            async deleteCategory(categoryId) {
                // Get category info
                const categories = await this.fetchApi('categories');
                const category = categories?.find(c => c.id === categoryId);
                
                if (!category) {
                    this.showToast('Категория не найдена', 'error');
                    return;
                }

                let message = `Вы уверены, что хотите удалить категорию "${category.name}"?`;
                
                if (category.productCount > 0) {
                    message += `\n\n⚠️ ВНИМАНИЕ: В этой категории ${category.productCount} товаров!\nОни станут без категории.`;
                }

                if (!confirm(message)) {
                    return;
                }

                try {
                    const result = await this.fetchApi(`categories/${categoryId}`, {
                        method: 'DELETE'
                    });

                    if (result) {
                        this.showToast('Категория удалена', 'success');
                        this.nav('admin-categories');
                    }
                } catch (error) {
                    this.showToast('Ошибка удаления категории', 'error');
                }
            },

            async loadCategoriesForSelect() {
                const categories = await this.fetchApi('categories');
                const select = document.getElementById('product-category');
                select.innerHTML = '<option value="">Без категории</option>';

                if (categories) {
                    categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        select.appendChild(option);
                    });
                }
            },

            async loadCategoriesForParentSelect() {
                const categories = await this.fetchApi('categories');
                const select = document.getElementById('category-parent');
                select.innerHTML = '<option value="">Корневая категория</option>';

                if (categories) {
                    categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        select.appendChild(option);
                    });
                }
            },

            async refreshAdminData() {
                await this.loadProducts();
                const categories = await this.fetchApi('categories');
                this.nav('admin-products');
                this.showToast('Данные обновлены', 'success');
            },

            // Products table rendering and management
            renderProductsTable() {
                if (!this.adminProductsData) return;

                const searchTerm = document.getElementById('admin-products-search')?.value.toLowerCase() || '';
                const categoryFilter = document.getElementById('admin-products-category-filter')?.value || '';
                const statusFilter = document.getElementById('admin-products-status-filter')?.value || '';

                // Filter products
                let filtered = this.adminProductsData.filter(product => {
                    const matchesSearch = !searchTerm || 
                        product.article.toLowerCase().includes(searchTerm) || 
                        product.name.toLowerCase().includes(searchTerm);
                    const matchesCategory = !categoryFilter || (product.categoryName === categoryFilter);
                    const matchesStatus = !statusFilter || 
                        (statusFilter === 'active' && product.isActive) ||
                        (statusFilter === 'inactive' && !product.isActive);
                    
                    return matchesSearch && matchesCategory && matchesStatus;
                });

                // Sort products
                filtered.sort((a, b) => {
                    let aVal = a[this.adminProductsSortBy];
                    let bVal = b[this.adminProductsSortBy];
                    
                    if (typeof aVal === 'string') {
                        aVal = aVal.toLowerCase();
                        bVal = bVal.toLowerCase();
                    }
                    
                    if (this.adminProductsSortDir === 'asc') {
                        return aVal > bVal ? 1 : -1;
                    } else {
                        return aVal < bVal ? 1 : -1;
                    }
                });

                // Pagination
                const totalPages = Math.ceil(filtered.length / this.adminProductsPerPage);
                const startIdx = (this.adminProductsPage - 1) * this.adminProductsPerPage;
                const endIdx = startIdx + this.adminProductsPerPage;
                const pageProducts = filtered.slice(startIdx, endIdx);

                // Render table (desktop)
                const tbody = document.getElementById('admin-products-table-body');
                if (!tbody) return;

                tbody.innerHTML = pageProducts.map(product => `
                    <tr data-product-id="${product.id}">
                        <td>
                            <input type="checkbox" class="product-checkbox" value="${product.id}" onchange="app.updateProductSelection()">
                        </td>
                        <td style="font-family: monospace; font-weight: 600; color: var(--text-tertiary);">#${product.id}</td>
                        <td style="font-family: monospace; color: var(--primary);">${product.article}</td>
                        <td style="font-weight: 600;">${product.name}</td>
                        <td><span style="font-size: 0.875rem; color: var(--text-tertiary);">${product.categoryName || 'Без категории'}</span></td>
                        <td>
                            <input type="number" class="inline-edit-input" style="width: 100px;" 
                                value="${product.price}" step="0.01" min="0"
                                onchange="app.inlineUpdateProduct(${product.id}, 'price', this.value)">
                        </td>
                        <td>
                            <input type="number" class="inline-edit-input" style="width: 80px;" 
                                value="${product.stock}" min="0"
                                onchange="app.inlineUpdateProduct(${product.id}, 'stock', this.value)">
                        </td>
                        <td>
                            <div class="status-toggle">
                                <input type="checkbox" ${product.isActive ? 'checked' : ''} 
                                    onchange="app.inlineUpdateProduct(${product.id}, 'isActive', this.checked)">
                                <span style="font-size: 0.875rem; font-weight: 500;">${product.isActive ? 'Активен' : 'Скрыт'}</span>
                            </div>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn" onclick="app.editProduct(${product.id})" title="Редактировать">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn action-btn-danger" onclick='app.confirmDeleteProduct(${product.id})' title="Удалить">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');

                // На мобильном — скрываем таблицу, показываем карточки
                const isMobile = window.innerWidth <= 767;
                tbody.parentElement.style.display = isMobile ? 'none' : '';

                // Render mobile cards grid (2 columns)
                let mobileGrid = document.getElementById('admin-products-mobile-grid');
                if (!mobileGrid) {
                    mobileGrid = document.createElement('div');
                    mobileGrid.id = 'admin-products-mobile-grid';
                    tbody.parentElement.parentElement.insertBefore(mobileGrid, tbody.parentElement);
                }
                mobileGrid.style.display = isMobile ? 'grid' : 'none';
                if (isMobile) {
                    mobileGrid.style.gridTemplateColumns = '1fr 1fr';
                    mobileGrid.style.gap = '8px';
                    mobileGrid.style.padding = '12px';
                }
                mobileGrid.innerHTML = pageProducts.map(product => `
                    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:6px;">
                        <div style="font-size:0.7rem;color:var(--text-tertiary);font-family:monospace;">#${product.id} ${product.article}</div>
                        <div style="font-size:0.85rem;font-weight:700;color:var(--text-main);line-height:1.3;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${product.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);">Категории: ${product.categoryName ? (product.categoryName.length > 12 ? product.categoryName.substring(0,12)+'..' : product.categoryName) : 'Без статуи'}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);">Цена: ${product.price}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);">Топак: ${product.stock}</div>
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;padding-top:8px;border-top:1px solid var(--border);">
                            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:0.75rem;color:var(--text-secondary);">
                                <span style="position:relative;display:inline-block;width:32px;height:18px;">
                                    <input type="checkbox" ${product.isActive ? 'checked' : ''} 
                                        onchange="app.inlineUpdateProduct(${product.id}, 'isActive', this.checked)"
                                        style="opacity:0;width:0;height:0;position:absolute;">
                                    <span style="position:absolute;top:0;left:0;right:0;bottom:0;background:${product.isActive ? 'var(--primary)' : '#ccc'};border-radius:18px;"></span>
                                    <span style="position:absolute;top:2px;left:${product.isActive ? '16px' : '2px'};width:14px;height:14px;background:white;border-radius:50%;transition:0.2s;"></span>
                                </span>
                                ${product.isActive ? 'Активен' : 'Скрыт'}
                            </label>
                            <div style="display:flex;gap:4px;">
                                <button onclick="app.editProduct(${product.id})" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--bg-page);color:var(--primary);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.6rem;padding:0;">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="app.confirmDeleteProduct(${product.id})" style="width:20px;height:20px;border-radius:4px;border:1px solid rgba(220,53,69,0.2);background:var(--bg-page);color:var(--danger);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.6rem;padding:0;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Update total count
                const totalElement = document.getElementById('admin-products-total');
                if (totalElement) {
                    totalElement.textContent = filtered.length;
                }

                // Render pagination
                this.renderProductsPagination(totalPages, filtered.length);
            },

            renderProductsPagination(totalPages, totalItems) {
                const container = document.getElementById('products-pagination');
                if (!container) return;

                const startItem = (this.adminProductsPage - 1) * this.adminProductsPerPage + 1;
                const endItem = Math.min(this.adminProductsPage * this.adminProductsPerPage, totalItems);

                let paginationHTML = `
                    <div class="modern-pagination-info">
                        Показано <strong>${startItem}-${endItem}</strong> из <strong>${totalItems}</strong>
                    </div>
                    <div class="modern-pagination-buttons">
                `;

                if (totalPages > 1) {
                    // Previous button
                    paginationHTML += `
                        <button class="btn btn-outline btn-sm" ${this.adminProductsPage === 1 ? 'disabled' : ''} 
                            onclick="app.goToProductsPage(${this.adminProductsPage - 1})">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    `;

                    // Page numbers
                    for (let i = 1; i <= totalPages; i++) {
                        if (i === 1 || i === totalPages || (i >= this.adminProductsPage - 2 && i <= this.adminProductsPage + 2)) {
                            paginationHTML += `
                                <button class="btn ${i === this.adminProductsPage ? 'btn-primary' : 'btn-outline'} btn-sm" 
                                    onclick="app.goToProductsPage(${i})">
                                    ${i}
                                </button>
                            `;
                        } else if (i === this.adminProductsPage - 3 || i === this.adminProductsPage + 3) {
                            paginationHTML += `<span style="padding: 0 8px; color: var(--text-tertiary);">...</span>`;
                        }
                    }

                    // Next button
                    paginationHTML += `
                        <button class="btn btn-outline btn-sm" ${this.adminProductsPage === totalPages ? 'disabled' : ''} 
                            onclick="app.goToProductsPage(${this.adminProductsPage + 1})">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    `;
                }

                paginationHTML += `</div>`;
                container.innerHTML = paginationHTML;
            },

            goToProductsPage(page) {
                this.adminProductsPage = page;
                this.renderProductsTable();
            },

            changeProductsPerPage() {
                const perPage = parseInt(document.getElementById('admin-products-per-page')?.value || '25');
                this.adminProductsPerPage = perPage;
                this.adminProductsPage = 1;
                this.renderProductsTable();
            },

            sortProducts(column) {
                if (this.adminProductsSortBy === column) {
                    this.adminProductsSortDir = this.adminProductsSortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this.adminProductsSortBy = column;
                    this.adminProductsSortDir = 'asc';
                }
                this.renderProductsTable();
            },

            // Inline editing
            async inlineUpdateProduct(productId, field, value) {
                try {
                    const product = this.adminProductsData.find(p => p.id === productId);
                    if (!product) return;

                    const updateData = { [field]: field === 'isActive' ? value : parseFloat(value) || value };
                    
                    await this.fetchApi(`products/${productId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ ...product, ...updateData })
                    });

                    // Update local data
                    Object.assign(product, updateData);
                    
                    this.showToast('Товар обновлен', 'success');
                } catch (error) {
                    this.showToast('Ошибка обновления товара', 'error');
                    this.renderProductsTable();
                }
            },

            // Selection management
            toggleSelectAllProducts() {
                const selectAll = document.getElementById('select-all-products');
                const checkboxes = document.querySelectorAll('.product-checkbox');
                checkboxes.forEach(cb => cb.checked = selectAll.checked);
                this.updateProductSelection();
            },

            updateProductSelection() {
                const checkboxes = document.querySelectorAll('.product-checkbox:checked');
                const count = checkboxes.length;
                
                document.getElementById('selected-count').textContent = count;
                document.getElementById('bulk-actions-bar').style.display = count > 0 ? 'block' : 'none';
            },

            clearProductSelection() {
                document.querySelectorAll('.product-checkbox').forEach(cb => cb.checked = false);
                document.getElementById('select-all-products').checked = false;
                this.updateProductSelection();
            },

            getSelectedProductIds() {
                return Array.from(document.querySelectorAll('.product-checkbox:checked')).map(cb => parseInt(cb.value));
            },

            // Bulk operations
            async bulkChangeCategory() {
                const ids = this.getSelectedProductIds();
                if (ids.length === 0) return;

                const categories = await this.fetchApi('categories');
                const categoryOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
                
                const categoryId = prompt(`Выберите категорию для ${ids.length} товаров:\n\n` + categories.map(c => `${c.id}: ${c.name}`).join('\n'));
                if (!categoryId) return;

                try {
                    await Promise.all(ids.map(id => {
                        const product = this.adminProductsData.find(p => p.id === id);
                        return this.fetchApi(`products/${id}`, {
                            method: 'PUT',
                            body: JSON.stringify({ ...product, categoryId: parseInt(categoryId) })
                        });
                    }));

                    this.showToast(`Категория изменена для ${ids.length} товаров`, 'success');
                    await this.loadProducts();
                    this.adminProductsData = await this.fetchApi('products?includeInactive=true');
                    this.renderProductsTable();
                    this.clearProductSelection();
                } catch (error) {
                    this.showToast('Ошибка изменения категории', 'error');
                }
            },

            async bulkChangeStatus() {
                const ids = this.getSelectedProductIds();
                if (ids.length === 0) return;

                const status = confirm(`Активировать выбранные товары (${ids.length} шт.)?`);
                
                try {
                    await Promise.all(ids.map(id => {
                        const product = this.adminProductsData.find(p => p.id === id);
                        return this.fetchApi(`products/${id}`, {
                            method: 'PUT',
                            body: JSON.stringify({ ...product, isActive: status })
                        });
                    }));

                    this.showToast(`Статус изменен для ${ids.length} товаров`, 'success');
                    this.adminProductsData.forEach(p => {
                        if (ids.includes(p.id)) p.isActive = status;
                    });
                    this.renderProductsTable();
                    this.clearProductSelection();
                } catch (error) {
                    this.showToast('Ошибка изменения статуса', 'error');
                }
            },

            async bulkChangePrice() {
                const ids = this.getSelectedProductIds();
                if (ids.length === 0) return;

                const action = prompt(`Выберите действие для ${ids.length} товаров:\n1 - Установить цену\n2 - Увеличить на %\n3 - Уменьшить на %`);
                if (!action) return;

                const value = prompt('Введите значение:');
                if (!value) return;

                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    this.showToast('Неверное значение', 'error');
                    return;
                }

                try {
                    await Promise.all(ids.map(id => {
                        const product = this.adminProductsData.find(p => p.id === id);
                        let newPrice = product.price;
                        
                        if (action === '1') newPrice = numValue;
                        else if (action === '2') newPrice = product.price * (1 + numValue / 100);
                        else if (action === '3') newPrice = product.price * (1 - numValue / 100);
                        
                        return this.fetchApi(`products/${id}`, {
                            method: 'PUT',
                            body: JSON.stringify({ ...product, price: newPrice })
                        });
                    }));

                    this.showToast(`Цена изменена для ${ids.length} товаров`, 'success');
                    this.adminProductsData = await this.fetchApi('products?includeInactive=true');
                    this.renderProductsTable();
                    this.clearProductSelection();
                } catch (error) {
                    this.showToast('Ошибка изменения цены', 'error');
                }
            },

            async bulkDeleteProducts() {
                const ids = this.getSelectedProductIds();
                if (ids.length === 0) return;

                if (!confirm(`Вы уверены, что хотите удалить ${ids.length} товаров? Это действие необратимо!`)) {
                    return;
                }

                try {
                    await Promise.all(ids.map(id => this.fetchApi(`products/${id}`, { method: 'DELETE' })));

                    this.showToast(`Удалено ${ids.length} товаров`, 'success');
                    this.adminProductsData = this.adminProductsData.filter(p => !ids.includes(p.id));
                    this.renderProductsTable();
                    this.clearProductSelection();
                } catch (error) {
                    this.showToast('Ошибка удаления товаров', 'error');
                }
            },

            // Confirm delete with info
            async confirmDeleteProduct(productId) {
                const product = this.adminProductsData.find(p => p.id === productId);
                if (!product) return;

                // Check if product has orders
                const orders = await this.fetchApi(`orders/admin/all`).catch(() => []);
                const productOrders = orders.filter(o => 
                    o.items && o.items.some(item => item.productId === productId)
                );

                let message = `Вы уверены, что хотите удалить товар "${product.name}"?`;
                if (productOrders.length > 0) {
                    message += `\n\n⚠️ ВНИМАНИЕ: У этого товара ${productOrders.length} заказов!`;
                }

                if (confirm(message)) {
                    await this.deleteProduct(productId);
                }
            },

            // Admin products search and filter
            searchAdminProducts() {
                this.renderProductsTable();
            },

            filterAdminProducts() {
                this.adminProductsPage = 1; // Reset to first page
                this.renderProductsTable();
            },

            async populateAdminProductsFilters() {
                // Populate category filter
                const categories = await this.fetchApi('categories');
                const categoryFilter = document.getElementById('admin-products-category-filter');
                
                console.log('populateAdminProductsFilters called', { categories, categoryFilter });
                
                if (categoryFilter && categories) {
                    const currentValue = categoryFilter.value;
                    categoryFilter.innerHTML = '<option value="">📁 Категория</option>';
                    categories.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat.name;
                        option.textContent = `  ${cat.name}`;
                        categoryFilter.appendChild(option);
                    });
                    categoryFilter.value = currentValue;
                    console.log('Categories populated:', categories.length);
                }
            },

            // User management functions
            async changeUserRole(userId, newRole) {
                try {
                    const result = await this.fetchApi(`users/${userId}/role`, {
                        method: 'PUT',
                        body: JSON.stringify({ role: newRole })
                    });

                    if (result) {
                        this.showToast('Роль пользователя изменена', 'success');
                        // Refresh the current page to show updated data
                        if (this.currentPage === 'admin-users') {
                            this.nav('admin-users');
                        }
                    }
                } catch (error) {
                    this.showToast('Ошибка изменения роли', 'error');
                }
            },

            async toggleUserStatus(userId, currentStatus) {
                const newStatus = !currentStatus;
                const action = newStatus ? 'разблокирован' : 'заблокирован';

                // Get user info
                const users = await this.fetchApi('users');
                const user = users?.find(u => u.id === userId);
                
                if (!user) {
                    this.showToast('Пользователь не найден', 'error');
                    return;
                }

                let message = `Вы уверены, что хотите ${newStatus ? 'разблокировать' : 'заблокировать'} пользователя <strong>"${user.fullName || user.email}"</strong>?`;
                
                if (!newStatus && user.ordersCount > 0) {
                    message += `<br><br><div style="color: var(--warning); font-weight: 600;"><i class="fas fa-exclamation-triangle"></i> ВНИМАНИЕ: У пользователя ${user.ordersCount} заказов!</div>`;
                    if (user.cartItemsCount > 0) {
                        message += `<div style="color: var(--warning);">В корзине ${user.cartItemsCount} товаров.</div>`;
                    }
                }

                this.showConfirmModal({
                    title: newStatus ? 'Разблокировать пользователя' : 'Заблокировать пользователя',
                    message: message,
                    confirmText: newStatus ? 'Разблокировать' : 'Заблокировать',
                    cancelText: 'Отмена',
                    confirmClass: newStatus ? 'btn-success' : 'btn-danger',
                    onConfirm: async () => {
                        try {
                            const result = await this.fetchApi(`users/${userId}/status`, {
                                method: 'PUT',
                                body: JSON.stringify({ isActive: newStatus })
                            });

                            if (result) {
                                this.showToast(`Пользователь ${action}`, 'success');
                                // Refresh the current page to show updated data
                                if (this.currentPage === 'admin-users') {
                                    this.nav('admin-users');
                                }
                            }
                        } catch (error) {
                            this.showToast('Ошибка изменения статуса', 'error');
                        }
                    }
                });
            },

            async refreshAdminUsers() {
                if (this.currentPage === 'admin-users') {
                    this.nav('admin-users');
                    this.showToast('Список пользователей обновлен', 'success');
                }
            },

            // Order management functions
            async filterAdminOrdersByStatus() {
                // Reload orders with current filter
                if (this.currentPage === 'admin-orders') {
                    this.nav('admin-orders');
                }
            },

            async sortOrders() {
                // Reload orders with current sorting
                if (this.currentPage === 'admin-orders') {
                    this.nav('admin-orders');
                }
            },

            async changeOrderStatus(orderId, newStatus) {
                console.log('changeOrderStatus called:', { orderId, newStatus });
                
                if (!newStatus) {
                    console.error('newStatus is empty!');
                    this.showToast('Статус не выбран', 'error');
                    return;
                }
                
                const requestBody = { Status: newStatus };
                console.log('Request body:', requestBody);
                
                try {
                    console.log('Sending request to:', `${this.apiBaseUrl}/orders/${orderId}/status`);
                    const response = await fetch(`${this.apiBaseUrl}/orders/${orderId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(requestBody)
                    });

                    console.log('Response status:', response.status);
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('Success result:', result);
                        this.showToast(result.message || `Статус заказа изменен на "${newStatus}"`, 'success');
                        // Refresh the current page to show updated data
                        if (this.currentPage === 'admin-orders') {
                            this.nav('admin-orders');
                        }
                    } else {
                        const errorText = await response.text();
                        console.error('Error response text:', errorText);
                        try {
                            const errorData = JSON.parse(errorText);
                            console.error('Error response JSON:', errorData);
                            this.showToast(errorData.message || 'Ошибка изменения статуса заказа', 'error');
                        } catch (e) {
                            console.error('Could not parse error as JSON');
                            this.showToast('Ошибка изменения статуса заказа', 'error');
                        }
                    }
                } catch (error) {
                    console.error('Change order status error:', error);
                    this.showToast('Ошибка изменения статуса заказа', 'error');
                }
            },

            async viewOrderDetails(orderId) {
                try {
                    const orderDetails = await this.fetchApi(`orders/${orderId}/details`);

                    if (orderDetails) {
                        document.getElementById('order-modal-title').innerText = `Заказ #${orderDetails.id}`;

                        const statusClass = orderDetails.status === 'Новый' ? 'status-new' :
                            orderDetails.status === 'В обработке' ? 'status-processing' :
                                orderDetails.status === 'Завершен' ? 'status-completed' : 'status-cancelled';

                        const statusIcon = orderDetails.status === 'Новый' ? 'clock' :
                            orderDetails.status === 'В обработке' ? 'cog' :
                                orderDetails.status === 'Завершен' ? 'check-circle' : 'times-circle';

                        const orderDate = new Date(orderDetails.createdAt);
                        const formattedDate = orderDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
                        const formattedTime = orderDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

                        document.getElementById('order-modal-content').innerHTML = `
                            <div class="order-details-wide">
                                <!-- Header -->
                                <div class="order-detail-header">
                                    <div class="order-detail-info">
                                        <div class="order-detail-number">#${orderDetails.id}</div>
                                        <div class="order-detail-date">
                                            <i class="fas fa-calendar"></i>
                                            ${formattedDate} в ${formattedTime}
                                        </div>
                                    </div>
                                    <div class="status-badge-large ${statusClass}">
                                        <i class="fas fa-${statusIcon}"></i>
                                        ${orderDetails.status}
                                    </div>
                                </div>

                                <!-- Customer Info -->
                                <div class="order-customer-section">
                                    <div class="section-title">
                                        <i class="fas fa-user"></i>
                                        Покупатель
                                    </div>
                                    <div class="customer-data">
                                        <div class="customer-name">${orderDetails.userFullName || 'Не указан'}</div>
                                        <div class="customer-email">
                                            <i class="fas fa-envelope"></i>
                                            ${orderDetails.userEmail}
                                        </div>
                                    </div>
                                </div>

                                <!-- Order Items -->
                                <div class="order-items-section">
                                    <div class="section-title">
                                        <i class="fas fa-box"></i>
                                        Товары в заказе (${orderDetails.items ? orderDetails.items.length : 0})
                                    </div>
                                    <div class="order-items-grid">
                                        ${orderDetails.items && orderDetails.items.length > 0
                                ? orderDetails.items.map((item, index) => {
                                    const imageUrl = this.getProductImage({ article: item.productArticle, imageUrl: item.imageUrl });
                                    const imageHtml = imageUrl 
                                        ? `<img src="${imageUrl}" alt="${item.productName}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-tools\\'></i>'">`
                                        : `<i class="fas fa-tools"></i>`;
                                    
                                    return `
                                        <div class="order-item-row">
                                            <div class="item-index">${index + 1}</div>
                                            <div class="item-image">
                                                ${imageHtml}
                                            </div>
                                            <div class="item-info">
                                                <div class="item-name">${item.productName}</div>
                                                <div class="item-article">Арт: ${item.productArticle}</div>
                                            </div>
                                            <div class="item-price">${item.price.toFixed(2)} BYN</div>
                                            <div class="item-qty">× ${item.quantity}</div>
                                            <div class="item-total">${item.total.toFixed(2)} BYN</div>
                                        </div>
                                    `;
                                }).join('')
                                : '<div class="no-items">Товары в заказе не найдены</div>'
                            }
                                    </div>
                                </div>

                                <!-- Summary -->
                                <div class="order-detail-summary">
                                    <div class="summary-line">
                                        <span>Товаров:</span>
                                        <span>${orderDetails.items ? orderDetails.items.length : 0} шт</span>
                                    </div>
                                    <div class="summary-line summary-total">
                                        <span>Итого:</span>
                                        <span>${orderDetails.totalAmount.toFixed(2)} BYN</span>
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div class="order-detail-actions">
                                    <button class="btn btn-outline" onclick='app.printOrder(${orderDetails.id})'>
                                        <i class="fas fa-print"></i> Печать
                                    </button>
                                    ${orderDetails.status === 'Завершен' ? `
                                        <button class="btn btn-primary" onclick='app.reorderItems(${orderDetails.id}); app.closeModal("order-modal")'>
                                            <i class="fas fa-redo"></i> Повторить заказ
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;

                        this.showModal('order-modal');
                    }
                } catch (error) {
                    this.showToast('Ошибка загрузки деталей заказа', 'error');
                }
            },

            async refreshAdminOrders() {
                if (this.currentPage === 'admin-orders') {
                    this.nav('admin-orders');
                    this.showToast('Список заказов обновлен', 'success');
                }
            },

            async viewCustomerDetails(userId) {
                try {
                    const customer = await this.fetchApi(`users/${userId}`);

                    if (customer) {
                        document.getElementById('order-modal-title').innerText = 'Реквизиты покупателя';

                        let html = `
                            <div class="customer-details-full">
                                <!-- Основная информация -->
                                <div class="customer-section">
                                    <div class="section-title">
                                        <i class="fas fa-user"></i>
                                        Основная информация
                                    </div>
                                    <div class="details-grid">
                                        <div class="detail-row">
                                            <span class="detail-label">ФИО:</span>
                                            <span class="detail-value">${customer.fullName || 'Не указано'}</span>
                                        </div>
                                        <div class="detail-row">
                                            <span class="detail-label">Email:</span>
                                            <span class="detail-value">${customer.email}</span>
                                        </div>
                                        <div class="detail-row">
                                            <span class="detail-label">Тип клиента:</span>
                                            <span class="detail-value">${customer.isLegalEntity ? 'Юридическое лицо' : 'Физическое лицо'}</span>
                                        </div>
                                    </div>
                                </div>
        `;

                        // Если юридическое лицо - показываем реквизиты
                        if (customer.isLegalEntity) {
                            html += `
                                <!-- Данные организации -->
                                <div class="customer-section">
                                    <div class="section-title">
                                        <i class="fas fa-building"></i>
                                        Данные организации
                                    </div>
                                    <div class="details-grid">
                                        ${customer.companyName ? `
                                            <div class="detail-row">
                                                <span class="detail-label">Название организации:</span>
                                                <span class="detail-value">${customer.companyName}</span>
                                            </div>
                                        ` : ''}
                                        ${customer.unp ? `
                                            <div class="detail-row">
                                                <span class="detail-label">УНП:</span>
                                                <span class="detail-value">${customer.unp}</span>
                                            </div>
                                        ` : ''}
                                        ${customer.legalAddress ? `
                                            <div class="detail-row">
                                                <span class="detail-label">Юридический адрес:</span>
                                                <span class="detail-value">${customer.legalAddress}</span>
                                            </div>
                                        ` : ''}
                                        ${customer.actualAddress ? `
                                            <div class="detail-row">
                                                <span class="detail-label">Фактический адрес:</span>
                                                <span class="detail-value">${customer.actualAddress}</span>
                                            </div>
                                        ` : ''}
                                        ${customer.directorName ? `
                                            <div class="detail-row">
                                                <span class="detail-label">Директор:</span>
                                                <span class="detail-value">${customer.directorName}</span>
                                            </div>
                                        ` : ''}
                                        ${customer.contactPerson ? `
                                            <div class="detail-row">
                                                <span class="detail-label">Контактное лицо:</span>
                                                <span class="detail-value">${customer.contactPerson}</span>
                                            </div>
                                        ` : ''}
                                        ${customer.contactPhone ? `
                                            <div class="detail-row">
                                                <span class="detail-label">Контактный телефон:</span>
                                                <span class="detail-value">${customer.contactPhone}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>

                                <!-- Банковские реквизиты -->
                                <div class="customer-section">
                                    <div class="section-title">
                                        <i class="fas fa-university"></i>
                                        Банковские реквизиты
                                    </div>
                                    <div class="details-grid">
                                        ${customer.bankName ? `
                                            <div class="detail-row">
                                                <span class="detail-label">Банк:</span>
                                                <span class="detail-value">${customer.bankName}</span>
                                            </div>
                                        ` : ''}
                                        ${customer.bankCode ? `
                                            <div class="detail-row">
                                                <span class="detail-label">БИК:</span>
                                                <span class="detail-value">${customer.bankCode}</span>
                                            </div>
                                        ` : ''}
                                        ${customer.checkingAccount ? `
                                            <div class="detail-row">
                                                <span class="detail-label">Расчетный счет:</span>
                                                <span class="detail-value">${customer.checkingAccount}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }

                        html += `
                            </div>
                        `;

                        document.getElementById('order-modal-content').innerHTML = html;
                        this.showModal('order-modal');
                    }
                } catch (error) {
                    console.error('Error loading customer details:', error);
                    this.showToast('Ошибка загрузки данных покупателя', 'error');
                }
            },

            // Order utility functions
            async printOrder(orderId) {
                try {
                    const orderDetails = await this.fetchApi(`orders/${orderId}/details`);
                    if (orderDetails) {
                        // Open print dialog with order details
                        const printWindow = window.open('', '_blank', 'width=800,height=600');
                        printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Заказ #${orderDetails.id}</title>
                                <meta charset="UTF-8">
                                <style>
                                    body { font-family: Arial, sans-serif; margin: 20px; }
                                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007656; padding-bottom: 20px; }
                                    .order-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                                    .customer-info { margin-bottom: 20px; }
                                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                    .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                    .items-table th { background-color: #f2f2f2; }
                                    .total { text-align: right; font-weight: bold; font-size: 1.2em; }
                                    .status { padding: 5px 10px; border-radius: 4px; color: white; }
                                    .status-new { background-color: #fbbf24; }
                                    .status-processing { background-color: #3b82f6; }
                                    .status-completed { background-color: #10b981; }
                                    .status-cancelled { background-color: #ef4444; }
                                </style>
                            </head>
                            <body>
                                <div class="header">
                                    <h1>Заказ #${orderDetails.id}</h1>
                                    <p>BLACK ONYX - B2B Портал инструментов</p>
                                </div>

                                <div class="order-info">
                                    <div>
                                        <strong>Дата заказа:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString('ru-RU')}<br>
                                        <strong>Статус:</strong> <span class="status status-${orderDetails.status.toLowerCase().replace(' ', '-')}">${orderDetails.status}</span>
                                    </div>
                                    <div>
                                        <strong>Итого:</strong> ${orderDetails.totalAmount.toFixed(2)} BYN
                                    </div>
                                </div>

                                <div class="customer-info">
                                    <h3>Информация о покупателе</h3>
                                    <p><strong>Имя:</strong> ${orderDetails.userFullName || 'Не указано'}</p>
                                    <p><strong>Email:</strong> ${orderDetails.userEmail}</p>
                                </div>

                                <h3>Состав заказа</h3>
                                <table class="items-table">
                                    <thead>
                                        <tr>
                                            <th>№</th>
                                            <th>Наименование</th>
                                            <th>Артикул</th>
                                            <th>Цена</th>
                                            <th>Количество</th>
                                            <th>Сумма</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${orderDetails.items.map((item, index) => `
                                            <tr>
                                                <td>${index + 1}</td>
                                                <td>${item.productName}</td>
                                                <td>${item.productArticle}</td>
                                                <td>${item.price.toFixed(2)} BYN</td>
                                                <td>${item.quantity}</td>
                                                <td>${item.total.toFixed(2)} BYN</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>

                                <div class="total">
                                    <p>Итого к оплате: ${orderDetails.totalAmount.toFixed(2)} BYN</p>
                                </div>

                                <div style="margin-top: 40px; text-align: center; font-size: 0.8em; color: #666;">
                                    <p>Спасибо за покупку!</p>
                                    <p>BLACK ONYX - Ваш надежный партнер в мире инструментов</p>
                                </div>
                            </body>
                            </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                    }
                } catch (error) {
                    this.showToast('Ошибка при печати заказа', 'error');
                }
            },

            async exportOrder(orderId) {
                try {
                    const orderDetails = await this.fetchApi(`orders/${orderId}/details`);
                    if (orderDetails) {
                        // Create CSV content
                        let csvContent = 'Заказ №,Дата,Покупатель,Email,Артикул,Наименование,Цена,Количество,Сумма\n';

                        orderDetails.items.forEach(item => {
                            csvContent += `"${orderDetails.id}","${new Date(orderDetails.createdAt).toLocaleDateString('ru-RU')}","${orderDetails.userFullName || ''}","${orderDetails.userEmail}","${item.productArticle}","${item.productName}","${item.price}","${item.quantity}","${item.total}"\n`;
                        });

                        // Add total row
                        csvContent += `"${orderDetails.id}","${new Date(orderDetails.createdAt).toLocaleDateString('ru-RU')}","${orderDetails.userFullName || ''}","${orderDetails.userEmail}","ИТОГО","","","${orderDetails.items.length}","${orderDetails.totalAmount}"\n`;

                        // Create and download file
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `Заказ_${orderDetails.id}_${new Date().toISOString().split('T')[0]}.csv`;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        this.showToast('Заказ экспортирован в CSV', 'success');
                    }
                } catch (error) {
                    this.showToast('Ошибка при экспорте заказа', 'error');
                }
            },

            // System tools functions
            async exportProducts() {
                try {
                    const url = `${this.apiBaseUrl}/systemtools/export/products?includeInactive=true`;
                    const response = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const blob = await response.blob();
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = response.headers.get('content-disposition')?.split('filename=')[1] || 'products_export.csv';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    this.showToast('Товары экспортированы в CSV', 'success');
                } catch (error) {
                    this.showToast('Ошибка при экспорте товаров', 'error');
                }
            },

            async exportOrders() {
                try {
                    const url = `${this.apiBaseUrl}/systemtools/export/orders`;
                    const response = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const blob = await response.blob();
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = response.headers.get('content-disposition')?.split('filename=')[1] || 'orders_export.csv';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    this.showToast('Заказы экспортированы в CSV', 'success');
                } catch (error) {
                    this.showToast('Ошибка при экспорте заказов', 'error');
                }
            },

            async exportUsers() {
                try {
                    const url = `${this.apiBaseUrl}/systemtools/export/users?includeInactive=true`;
                    const response = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const blob = await response.blob();
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = response.headers.get('content-disposition')?.split('filename=')[1] || 'users_export.csv';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    this.showToast('Пользователи экспортированы в CSV', 'success');
                } catch (error) {
                    this.showToast('Ошибка при экспорте пользователей', 'error');
                }
            },

            handleFileSelect() {
                const fileInput = document.getElementById('import-file');
                const selectedFileDiv = document.getElementById('selected-file');
                const importBtn = document.getElementById('import-btn');

                if (fileInput.files && fileInput.files[0]) {
                    const file = fileInput.files[0];
                    selectedFileDiv.textContent = `Выбран файл: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                    importBtn.disabled = false;
                } else {
                    selectedFileDiv.textContent = '';
                    importBtn.disabled = true;
                }
            },

            async importProducts() {
                const fileInput = document.getElementById('import-file');
                const importBtn = document.getElementById('import-btn');

                if (!fileInput.files || !fileInput.files[0]) {
                    this.showToast('Выберите файл для импорта', 'error');
                    return;
                }

                const file = fileInput.files[0];
                const formData = new FormData();
                formData.append('file', file);

                importBtn.disabled = true;
                importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Импорт...';

                try {
                    const response = await fetch(`${this.apiBaseUrl}/systemtools/import/products`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: formData
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        this.showToast(`Импорт завершен! Импортировано: ${result.imported} товаров`, 'success');

                        // Clear file input
                        fileInput.value = '';
                        document.getElementById('selected-file').textContent = '';
                        importBtn.disabled = true;

                        this.loadProducts();
                    } else {
                        this.showToast(result.message || 'Ошибка при импорте', 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при импорте:', error);
                    this.showToast('Не удалось импортировать товары', 'error');
                } finally {
                    importBtn.disabled = false;
                    importBtn.innerHTML = '<i class="fas fa-upload"></i> Импортировать товары';
                }
            },

            handleModalFileSelect() {
                const fileInput = document.getElementById('modal-import-file');
                const selectedFileDiv = document.getElementById('modal-selected-file');
                const importBtn = document.getElementById('modal-import-btn');

                if (fileInput.files && fileInput.files[0]) {
                    const file = fileInput.files[0];
                    selectedFileDiv.textContent = `Выбран: ${file.name}`;
                    importBtn.disabled = false;
                } else {
                    selectedFileDiv.textContent = 'Выберите CSV файл';
                    importBtn.disabled = true;
                }
            },

            async importProductsFromModal() {
                const fileInput = document.getElementById('modal-import-file');
                const importBtn = document.getElementById('modal-import-btn');

                if (!fileInput.files || !fileInput.files[0]) return;

                const file = fileInput.files[0];
                const formData = new FormData();
                formData.append('file', file);

                importBtn.disabled = true;
                importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                try {
                    const response = await fetch(`${this.apiBaseUrl}/systemtools/import/products`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: formData
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        this.showToast(`Импортировано: ${result.imported} товаров`, 'success');
                        fileInput.value = '';
                        document.getElementById('modal-selected-file').textContent = 'Выберите CSV файл';
                        importBtn.disabled = true;

                        await this.loadProducts();
                        // Refresh products list depending on current view
                        if (this.currentPage === 'manager-products') this.nav('manager-products');
                        if (this.currentPage === 'admin-products') this.nav('admin-products');
                    } else {
                        this.showToast(result.message || 'Ошибка импорта', 'error');
                    }
                } catch (error) {
                    this.showToast('Ошибка при импорте', 'error');
                } finally {
                    importBtn.disabled = false;
                    importBtn.innerHTML = '<i class="fas fa-upload"></i> Импорт';
                }
            },

            // Manager Import Functions
            handleManagerImportFileSelect() {
                const fileInput = document.getElementById('manager-import-file');
                const selectedFileDiv = document.getElementById('manager-selected-file');
                const importBtn = document.getElementById('manager-import-btn');

                if (fileInput.files && fileInput.files[0]) {
                    const file = fileInput.files[0];
                    selectedFileDiv.innerHTML = `Выбран файл: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                    importBtn.disabled = false;
                } else {
                    selectedFileDiv.innerHTML = '';
                    importBtn.disabled = true;
                }
            },

            async importManagerProducts() {
                const fileInput = document.getElementById('manager-import-file');
                const importBtn = document.getElementById('manager-import-btn');
                const mode = document.getElementById('manager-import-mode').value;
                const isDryRun = document.getElementById('manager-import-dry-run').checked;

                if (!fileInput.files || !fileInput.files[0]) {
                    this.showToast('Выберите файл для импорта', 'error');
                    return;
                }

                const file = fileInput.files[0];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('mode', mode);
                formData.append('isDryRun', isDryRun);

                importBtn.disabled = true;
                importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Импорт...';

                try {
                    const response = await fetch(`${this.apiBaseUrl}/import/upload?mode=${mode}&isDryRun=${isDryRun}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: formData
                    });

                    const result = await response.json();

                    if (response.ok && result.importJobId) {
                        if (isDryRun) {
                            this.showToast('Тестовый запуск завершен! Проверьте результат.', 'info');
                        } else {
                            this.showToast('Файл загружен! Начинаем обработку...', 'success');
                        }

                        // Start execution
                        const executeResult = await this.fetchApi(`import/execute/${result.importJobId}`, {
                            method: 'POST'
                        });

                        if (executeResult) {
                            const modeText = mode === 'create_only' ? 'создано' : mode === 'update_only' ? 'обновлено' : 'создано/обновлено';
                            this.showToast(`Импорт завершен! ${executeResult.processedRows} строк обработано, ошибок: ${executeResult.errorsCount}`, 'success');

                            // Clear file input
                            fileInput.value = '';
                            document.getElementById('manager-selected-file').textContent = '';
                            importBtn.disabled = true;

                            // Refresh products data
                            await this.loadProducts();

                            // Refresh manager products page
                            if (this.currentPage === 'manager-products') {
                                this.nav('manager-products');
                            }
                        } else {
                            this.showToast('Ошибка при выполнении импорта', 'error');
                        }
                    } else {
                        const errors = result.errors ? result.errors.join('\n') : 'Неизвестная ошибка';
                        this.showToast(`Ошибка загрузки: ${errors}`, 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при импорте:', error);
                    this.showToast('Не удалось импортировать товары', 'error');
                } finally {
                    importBtn.disabled = false;
                    importBtn.innerHTML = '<i class="fas fa-upload"></i> Загрузить и импортировать';
                }
            },

            async cleanupSystem() {
                // Get selected cleanup options
                const cleanNotifications = document.getElementById('clean-notifications').checked;
                const cleanCancelledOrders = document.getElementById('clean-cancelled-orders').checked;
                const cleanInactiveUsers = document.getElementById('clean-inactive-users').checked;

                if (!cleanNotifications && !cleanCancelledOrders && !cleanInactiveUsers) {
                    this.showToast('Выберите хотя бы одну опцию очистки', 'error');
                    return;
                }

                if (!confirm('Вы уверены, что хотите выполнить очистку? Это действие необратимо!')) {
                    return;
                }

                const request = {
                    cleanNotifications: cleanNotifications,
                    notificationsDays: parseInt(document.getElementById('clean-notifications-days').value),
                    cleanCancelledOrders: cleanCancelledOrders,
                    ordersDays: parseInt(document.getElementById('clean-orders-days').value),
                    cleanInactiveUsers: cleanInactiveUsers,
                    usersDays: parseInt(document.getElementById('clean-users-days').value)
                };

                try {
                    const result = await this.fetchApi('systemtools/cleanup', {
                        method: 'POST',
                        body: JSON.stringify(request)
                    });

                    if (result && result.success) {
                        let message = 'Очистка системы выполнена:\n';
                        if (result.deletedNotifications > 0) message += `Уведомлений: ${result.deletedNotifications}\n`;
                        if (result.deletedOrders > 0) message += `Заказов: ${result.deletedOrders}\n`;
                        if (result.deletedUsers > 0) message += `Пользователей: ${result.deletedUsers}\n`;

                        this.showToast(message.trim(), 'success');

                        // Reset checkboxes
                        document.getElementById('clean-notifications').checked = false;
                        document.getElementById('clean-cancelled-orders').checked = false;
                        document.getElementById('clean-inactive-users').checked = false;

                        // Refresh data
                        if (this.currentPage === 'admin-tools') {
                            this.nav('admin-tools');
                        }
                    } else {
                        this.showToast('Ошибка при очистке системы', 'error');
                    }
                } catch (error) {
                    this.showToast('Ошибка при очистке системы', 'error');
                }
            },

            // Loyalty Program - Discount Management
            async openDiscountModal(userId) {
                console.log('Opening discount modal for user:', userId);
                try {
                    const loyaltyData = await this.fetchApi(`loyalty/user/${userId}`);
                    console.log('Loyalty data received:', loyaltyData);
                    
                    if (!loyaltyData) {
                        this.showToast('Не удалось загрузить данные пользователя', 'error');
                        return;
                    }
                    
                    // Remove existing modal if any
                    const existingModal = document.getElementById('discount-modal');
                    if (existingModal) {
                        existingModal.remove();
                    }
                    
                    const modal = document.createElement('div');
                    modal.className = 'modal-overlay active';
                    modal.id = 'discount-modal';
                    modal.innerHTML = `
                        <div class="modal-content" style="max-width: 500px; background: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
                            <div class="modal-header" style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1a1a1a;">Установить скидку</h3>
                                <button class="modal-close" onclick="document.getElementById('discount-modal').remove()" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="modal-body" style="padding: 24px;">
                                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #86efac;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <span style="color: #374151; font-size: 0.95rem;">Текущая скидка:</span>
                                        <strong style="color: #059669; font-size: 1.5rem; font-weight: 700;">${loyaltyData.currentDiscount}%</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-top: 12px; border-top: 1px solid #86efac;">
                                        <span style="color: #374151; font-size: 0.95rem;">Сумма заказов:</span>
                                        <strong style="color: #059669; font-size: 1.1rem; font-weight: 600;">${loyaltyData.totalOrdersAmount.toFixed(2)} BYN</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #86efac;">
                                        <span style="color: #374151; font-size: 0.95rem;">Рекомендуемая скидка:</span>
                                        <strong style="color: #059669; font-size: 1.25rem; font-weight: 700;">${loyaltyData.recommendedDiscount}%</strong>
                                    </div>
                                </div>
                                
                                <div class="form-group" style="margin-bottom: 20px;">
                                    <label class="form-label" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 0.95rem;">Новая скидка (%)</label>
                                    <input type="number" id="new-discount-input" class="form-input" 
                                           value="${loyaltyData.currentDiscount}" min="0" max="100" step="1"
                                           style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 1.1rem; font-weight: 600; color: #1a1a1a; transition: all 0.2s; background: white;">
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 0.95rem;">Причина изменения (опционально)</label>
                                    <textarea id="discount-reason-input" class="form-input" rows="3" 
                                              placeholder="Например: досрочное достижение уровня"
                                              style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 0.95rem; color: #1a1a1a; resize: vertical; transition: all 0.2s; background: white; font-family: inherit;"></textarea>
                                </div>
                            </div>
                            <div class="modal-footer" style="padding: 20px 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end; background: #f9fafb; border-radius: 0 0 16px 16px;">
                                <button class="btn btn-outline" onclick="document.getElementById('discount-modal').remove()" style="padding: 12px 24px; border: 2px solid #e5e7eb; background: white; color: #374151; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.95rem;">Отмена</button>
                                <button class="btn btn-primary" onclick="app.updateUserDiscount(${userId})" style="padding: 12px 24px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.95rem; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);">Сохранить</button>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(modal);
                    console.log('Discount modal added to DOM');
                    
                    // Add hover effects
                    const closeBtn = modal.querySelector('.modal-close');
                    closeBtn.addEventListener('mouseenter', () => {
                        closeBtn.style.background = '#f3f4f6';
                        closeBtn.style.color = '#1a1a1a';
                    });
                    closeBtn.addEventListener('mouseleave', () => {
                        closeBtn.style.background = 'none';
                        closeBtn.style.color = '#6b7280';
                    });
                    
                    // Add focus effects to inputs
                    const inputs = modal.querySelectorAll('input, textarea');
                    inputs.forEach(input => {
                        input.addEventListener('focus', () => {
                            input.style.borderColor = '#059669';
                            input.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)';
                        });
                        input.addEventListener('blur', () => {
                            input.style.borderColor = '#e5e7eb';
                            input.style.boxShadow = 'none';
                        });
                    });
                } catch (error) {
                    console.error('Error opening discount modal:', error);
                    this.showToast('Ошибка загрузки данных пользователя: ' + error.message, 'error');
                }
            },

            async updateUserDiscount(userId) {
                const discount = parseFloat(document.getElementById('new-discount-input').value);
                const reason = document.getElementById('discount-reason-input').value;

                if (isNaN(discount) || discount < 0 || discount > 100) {
                    this.showToast('Скидка должна быть от 0 до 100%', 'error');
                    return;
                }

                try {
                    const result = await this.fetchApi(`loyalty/user/${userId}/discount`, {
                        method: 'PUT',
                        body: JSON.stringify({ newDiscount: discount, reason: reason || null })
                    });

                    if (!result) {
                        this.showToast('Ошибка обновления скидки', 'error');
                        return;
                    }

                    this.showToast('Скидка успешно обновлена', 'success');
                    document.getElementById('discount-modal')?.remove();
                    this.nav('admin-users');
                } catch (error) {
                    console.error('Error updating discount:', error);
                    this.showToast('Ошибка обновления скидки', 'error');
                }
            },

            async openDiscountHistoryModal(userId) {
                try {
                    const history = await this.fetchApi(`loyalty/user/${userId}/history`);
                    
                    if (!history) {
                        this.showToast('Не удалось загрузить историю', 'error');
                        return;
                    }
                    
                    const historyHtml = history && history.length > 0 
                        ? history.map(item => `
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 16px 12px; color: #374151; font-size: 0.9rem;">${new Date(item.changedAt).toLocaleString('ru-RU')}</td>
                                <td style="padding: 16px 12px; color: #6b7280; font-weight: 600; font-size: 0.95rem;">${item.oldDiscount}%</td>
                                <td style="padding: 16px 12px; color: #059669; font-weight: 700; font-size: 1rem;">${item.newDiscount}%</td>
                                <td style="padding: 16px 12px; color: #374151; font-weight: 500; font-size: 0.9rem;">${item.changedByName}</td>
                                <td style="padding: 16px 12px; color: #6b7280; font-size: 0.85rem; font-style: ${item.reason ? 'normal' : 'italic'};">${item.reason || 'Не указана'}</td>
                            </tr>
                        `).join('')
                        : '<tr><td colspan="5" style="padding: 40px; text-align: center; color: #9ca3af; font-size: 0.95rem;">История изменений пуста</td></tr>';

                    const modal = document.createElement('div');
                    modal.className = 'modal-overlay active';
                    modal.id = 'history-modal';
                    modal.innerHTML = `
                        <div class="modal-content" style="max-width: 900px; max-height: 85vh; background: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); display: flex; flex-direction: column;">
                            <div class="modal-header" style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1a1a1a;">История скидок</h3>
                                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="modal-body" style="padding: 0; overflow-y: auto; flex: 1;">
                                <table style="width: 100%; border-collapse: collapse; background: white;">
                                    <thead style="position: sticky; top: 0; background: #f9fafb; z-index: 10; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                                        <tr>
                                            <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Дата</th>
                                            <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Было</th>
                                            <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Стало</th>
                                            <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Изменил</th>
                                            <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Причина</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${historyHtml}
                                    </tbody>
                                </table>
                            </div>
                            <div class="modal-footer" style="padding: 20px 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end; background: #f9fafb; border-radius: 0 0 16px 16px; flex-shrink: 0;">
                                <button class="btn btn-outline" onclick="document.getElementById('history-modal').remove()" style="padding: 12px 24px; border: 2px solid #e5e7eb; background: white; color: #374151; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.95rem;">Закрыть</button>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(modal);
                    
                    // Add hover effects
                    const closeBtn = modal.querySelector('.modal-close');
                    closeBtn.addEventListener('mouseenter', () => {
                        closeBtn.style.background = '#f3f4f6';
                        closeBtn.style.color = '#1a1a1a';
                    });
                    closeBtn.addEventListener('mouseleave', () => {
                        closeBtn.style.background = 'none';
                        closeBtn.style.color = '#6b7280';
                    });
                } catch (error) {
                    this.showToast('Ошибка загрузки истории', 'error');
                }
            }
        });