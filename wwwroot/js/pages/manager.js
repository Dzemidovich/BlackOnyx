// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Manager page module - adds manager functionality to app object
// Must be loaded after app.js and core/api.js
Object.assign(app, {
            // --- MANAGER FUNCTIONALITY ---

            async renderManagerProducts() {
                try {
                    await Promise.all([this.loadProducts(), this.loadCategories()]);
                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Управление товарами</h1>
                                <p class="page-subtitle">Всего товаров в базе: ${this.products.length}</p>
                            </div>
                            <div class="flex gap-2">
                                <div class="dropdown" style="position: relative;">
                                    <button class="btn btn-primary" onclick="app.toggleAddProductDropdown()">
                                        <i class="fas fa-plus"></i> Добавить товар <i class="fas fa-chevron-down ml-1"></i>
                                    </button>
                                    <div id="add-product-dropdown" class="dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px 0; min-width: 200px; box-shadow: var(--shadow-lg); z-index: 100;">
                                        <div onclick="app.showAddProductModal(); app.closeAddProductDropdown();" 
                                             style="padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; hover: { background: 'var(--bg-page)' }">
                                            <i class="fas fa-plus-circle text-primary"></i>
                                            <span>Добавить один товар</span>
                                        </div>
                                        <div onclick="app.showImportProductsModal(); app.closeAddProductDropdown();" 
                                             style="padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                            <i class="fas fa-file-csv text-success"></i>
                                            <span>Импорт из CSV</span>
                                        </div>
                                    </div>
                                </div>
                                <button class="btn btn-outline" onclick="app.nav('manager-products')">
                                    <i class="fas fa-sync"></i> Обновить
                                </button>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Список инструментов</div>
                                <div class="flex gap-2">
                                    <input type="text" id="manager-product-search" placeholder="Поиск по названию или артикулу..." 
                                           class="form-input" style="width: 300px;" onkeyup="app.filterManagerProducts()">
                                </div>
                            </div>
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Артикул</th>
                                            <th>Название</th>
                                            <th>Категория</th>
                                            <th>Цена</th>
                                            <th>Склад</th>
                                            <th>Статус</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody id="manager-products-table">
                                        ${this.products.map(p => this.renderManagerProductRow(p)).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Manager Import Section -->
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">
                                    <i class="fas fa-upload"></i> Импорт товаров из CSV
                                </div>
                            </div>
                            <div class="p-4">
                                <div class="import-form">
                                    <div class="form-group">
                                        <label class="form-label">Выберите CSV файл для импорта товаров</label>
                                        <div class="import-file-input">
                                            <input type="file" id="manager-import-file" accept=".csv" onchange="app.handleManagerImportFileSelect()">
                                            <label for="manager-import-file" class="import-file-label">
                                                <i class="fas fa-cloud-upload-alt"></i>
                                                <span>Выберите файл или перетащите сюда</span>
                                            </label>
                                        </div>
                                        <div id="manager-selected-file" class="text-sm text-tertiary mt-2"></div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="form-group">
                                            <label class="form-label">Режим импорта</label>
                                            <select id="manager-import-mode" class="form-select">
                                                <option value="create_only">Только создание новых товаров</option>
                                                <option value="update_only">Только обновление существующих товаров</option>
                                                <option value="upsert">Создание и обновление (рекомендуется)</option>
                                            </select>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-check">
                                                <input type="checkbox" id="manager-import-dry-run">
                                                <span class="ml-2">Тестовый запуск (без сохранения в базу)</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div class="flex gap-3">
                                        <button class="btn btn-primary" id="manager-import-btn" onclick="app.importManagerProducts()" disabled>
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
                } catch (e) {
                    console.error('Render Manager Products Error:', e);
                    return '<div class="alert alert-danger">Ошибка загрузки списка товаров</div>';
                }
            },

            renderManagerProductRow(p) {
                const statusClass = p.isActive ? 'status-completed' : 'status-cancelled';
                const stockStatus = p.stock > 0 ? 'status-processing' : 'status-cancelled';
                return `
                    <tr>
                        <td style="font-family: monospace; font-weight: 600; color: var(--text-secondary);">${p.article}</td>
                        <td><div class="font-bold">${p.name}</div></td>
                        <td><span class="badge" style="background: var(--bg-page);">${p.categoryName || '—'}</span></td>
                        <td class="font-bold text-primary">${p.price.toFixed(2)} BYN</td>
                        <td><span class="status-badge ${stockStatus}">${p.stock} шт.</span></td>
                        <td><span class="status-badge ${statusClass}">${p.isActive ? 'Активен' : 'Неактивен'}</span></td>
                        <td>
                            <div class="flex gap-1">
                                <button class="btn btn-outline btn-sm btn-icon" onclick='app.editProduct(${p.id})' title="Редактировать">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline btn-sm btn-icon" onclick='app.toggleProductStatus(${p.id})' title="${p.isActive ? 'Деактивировать' : 'Активировать'}">
                                    <i class="fas fa-${p.isActive ? 'ban' : 'check'}"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            },

            filterManagerProducts() {
                const query = document.getElementById('manager-product-search').value.toLowerCase();
                const rows = document.querySelectorAll('#manager-products-table tr');
                rows.forEach(row => {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(query) ? '' : 'none';
                });
            },

            async renderManagerOrders() {
                try {
                    const orders = await this.fetchApi('orders/admin/all');
                    this.managerOrders = orders || [];
                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Управление заказами</h1>
                                <p class="page-subtitle">Всего заказов: ${this.managerOrders.length}</p>
                            </div>
                            <button class="btn btn-outline" onclick="app.nav('manager-orders')">
                                <i class="fas fa-sync"></i> Обновить
                            </button>
                        </div>
                        <div class="card">
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Дата</th>
                                            <th>Клиент</th>
                                            <th>Сумма</th>
                                            <th>Статус</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.managerOrders.map(o => `
                                            <tr>
                                                <td class="font-bold">#${o.id}</td>
                                                <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div class="font-semibold">${o.userFullName || 'Клиент'}</div>
                                                    <div class="text-xs text-secondary">${o.userEmail || ''}</div>
                                                </td>
                                                <td class="font-bold text-primary">${o.totalAmount.toFixed(2)} BYN</td>
                                                <td>${this.renderOrderStatusBadge(o.status)}</td>
                                                <td>
                                                    <div class="flex gap-2">
                                                        <select class="form-select" style="font-size: 0.8rem; padding: 4px;" onchange="app.updateOrderStatus(${o.id}, this.value)">
                                                            <option value="New" ${o.status === 'New' || o.status === 'Новый' ? 'selected' : ''}>Новый</option>
                                                            <option value="Processing" ${o.status === 'Processing' || o.status === 'В обработке' ? 'selected' : ''}>В обработке</option>
                                                            <option value="Shipped" ${o.status === 'Shipped' || o.status === 'Отгружен' ? 'selected' : ''}>Отгружен</option>
                                                            <option value="Completed" ${o.status === 'Completed' || o.status === 'Завершен' ? 'selected' : ''}>Завершен</option>
                                                            <option value="Cancelled" ${o.status === 'Cancelled' || o.status === 'Отменен' ? 'selected' : ''}>Отменен</option>
                                                        </select>
                                                        <button class="btn btn-outline btn-sm btn-icon" onclick='app.viewOrderDetails(${o.id})' title="Просмотр">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                } catch (e) {
                    console.error('Render Manager Orders Error:', e);
                    return '<div class="alert alert-danger">Ошибка загрузки списка заказов</div>';
                }
            },

            async renderManagerAnalytics() {
                try {
                    const stats = await this.fetchApi('analytics/dashboard');
                    if (!stats) return '<div class="alert alert-warning">Нет данных аналитики</div>';

                    return `
                        <div class="admin-page-header">
                            <div class="admin-page-header-left">
                                <h1>Аналитика</h1>
                                <p>Статистика продаж и производительности</p>
                            </div>
                        </div>

                        <!-- Compact Metrics -->
                        <div class="compact-metrics">
                            <div class="compact-metric">
                                <div class="compact-metric-label">Заказов</div>
                                <div class="compact-metric-value">${stats.totalOrders || 0}</div>
                            </div>
                            <div class="compact-metric">
                                <div class="compact-metric-label">Выручка</div>
                                <div class="compact-metric-value">${(stats.totalRevenue || 0).toFixed(0)} BYN</div>
                            </div>
                            <div class="compact-metric">
                                <div class="compact-metric-label">Клиентов</div>
                                <div class="compact-metric-value">${stats.newUsersThisMonth || 0}</div>
                            </div>
                            <div class="compact-metric">
                                <div class="compact-metric-label">Товаров</div>
                                <div class="compact-metric-value">${stats.totalProducts || 0}</div>
                            </div>
                        </div>
                        
                        <!-- Sales Chart -->
                        <div class="modern-card">
                            <div class="modern-card-header">
                                <div class="modern-card-title">
                                    <i class="fas fa-chart-line"></i>
                                    Продажи
                                </div>
                                <select id="sales-period-filter" class="form-select" style="width: 150px;" onchange="app.updateSalesChart()">
                                    <option value="week">За неделю</option>
                                    <option value="month" selected>За месяц</option>
                                    <option value="year">За год</option>
                                </select>
                            </div>
                            <div style="padding: 24px;">
                                <canvas id="sales-chart"></canvas>
                            </div>
                        </div>

                        <!-- Two Column Layout -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
                            <!-- Popular Products Chart -->
                            <div class="modern-card">
                                <div class="modern-card-header">
                                    <div class="modern-card-title">
                                        <i class="fas fa-star"></i>
                                        Топ товары
                                    </div>
                                    <select id="popular-products-type" class="form-select" style="width: 150px;" onchange="app.updatePopularProducts()">
                                        <option value="revenue">По выручке</option>
                                        <option value="quantity">По продажам</option>
                                    </select>
                                </div>
                                <div style="padding: 24px; height: 300px;">
                                    <canvas id="popular-products-chart"></canvas>
                                </div>
                            </div>

                            <!-- Category Stats Chart -->
                            <div class="modern-card">
                                <div class="modern-card-header">
                                    <div class="modern-card-title">
                                        <i class="fas fa-folder"></i>
                                        По категориям
                                    </div>
                                </div>
                                <div style="padding: 24px; height: 300px;">
                                    <canvas id="category-stats-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    `;
                } catch (e) {
                    console.error('Render Manager Analytics Error:', e);
                    return '<div class="alert alert-danger">Ошибка загрузки аналитических данных</div>';
                }
            },

            renderOrderStatusBadge(status) {
                const badges = {
                    'New': { label: 'Новый', class: 'status-new' },
                    'Новый': { label: 'Новый', class: 'status-new' },
                    'Processing': { label: 'В обработке', class: 'status-processing' },
                    'В обработке': { label: 'В обработке', class: 'status-processing' },
                    'Shipped': { label: 'Отгружен', class: 'status-pending' },
                    'Отгружен': { label: 'Отгружен', class: 'status-pending' },
                    'Completed': { label: 'Завершен', class: 'status-completed' },
                    'Завершен': { label: 'Завершен', class: 'status-completed' },
                    'Cancelled': { label: 'Отменен', class: 'status-cancelled' },
                    'Отменен': { label: 'Отменен', class: 'status-cancelled' }
                };
                const config = badges[status] || { label: status, class: '' };
                return `<span class="status-badge ${config.class}">${config.label}</span>`;
            },

            async updateOrderStatus(orderId, newStatus) {
                if (!confirm(`Вы действительно хотите изменить статус заказа #${orderId}?`)) return;
                try {
                    const response = await fetch(`${this.apiBaseUrl}/orders/${orderId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ Status: newStatus })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        this.showToast(result.message || 'Статус заказа успешно обновлен', 'success');
                        this.nav('manager-orders');
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        this.showToast(errorData.message || 'Не удалось обновить статус заказа', 'error');
                    }
                } catch (e) {
                    console.error('Update order status error:', e);
                    this.showToast('Ошибка сети при обновлении статуса', 'error');
                }
            },

            async toggleProductStatus(productId) {
                const product = this.products.find(p => p.id === productId);
                if (!product) return;

                if (product.isActive) {
                    if (!confirm(`Вы уверены, что хотите деактивировать товар "${product.name}"?`)) return;
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/products/${productId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        });
                        if (response.ok) {
                            this.showToast('Товар успешно деактивирован', 'success');
                            await this.loadProducts(false);
                            if (this.currentPage === 'manager-products') this.nav('manager-products');
                        }
                    } catch (e) { this.showToast('Ошибка сети', 'error'); }
                } else {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/products/${productId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({ ...product, isActive: true })
                        });
                        if (response.ok) {
                            this.showToast('Товар успешно активирован', 'success');
                            await this.loadProducts(false);
                            if (this.currentPage === 'manager-products') this.nav('manager-products');
                        }
                } catch (e) { this.showToast('Ошибка сети', 'error'); }
            }
        },

            // Функция для отображения товаров с низким остатком
            async renderManagerLowStock() {
                try {
                    // Initialize pagination state if not exists
                    if (!this.lowStockPagination) {
                        this.lowStockPagination = {
                            currentPage: 1,
                            pageSize: 35,
                            search: ''
                        };
                    }

                    // Загружаем товары с низким остатком с пагинацией
                    const params = new URLSearchParams({
                        page: this.lowStockPagination.currentPage.toString(),
                        pageSize: this.lowStockPagination.pageSize.toString()
                    });
                    
                    if (this.lowStockPagination.search) {
                        params.append('search', this.lowStockPagination.search);
                    }

                    const response = await this.fetchApi(`products/low-stock?${params.toString()}`);
                    console.log('Low stock response:', response);
                    
                    // Handle null or undefined response
                    if (!response || typeof response !== 'object') {
                        console.error('Invalid response from low-stock API:', response);
                        return `
                            <div class="alert alert-danger">
                                <i class="fas fa-exclamation-triangle"></i>
                                Ошибка загрузки данных. Проверьте подключение к серверу.
                            </div>
                        `;
                    }
                    
                    const products = Array.isArray(response.products) ? response.products : [];
                    const pagination = response.pagination || {
                        currentPage: 1,
                        totalCount: 0,
                        totalPages: 1,
                        hasNextPage: false,
                        hasPreviousPage: false
                    };
                    
                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Товары с низким остатком</h1>
                                <p class="page-subtitle">Товары, требующие пополнения (остаток менее 10 шт.)</p>
                            </div>
                            <div class="flex gap-2">
                                <button class="btn btn-outline" onclick="app.refreshLowStock()">
                                    <i class="fas fa-sync"></i> Обновить
                                </button>
                                <button class="btn btn-primary" onclick="app.createRestockOrder()">
                                    <i class="fas fa-shopping-cart"></i> Создать заказ на пополнение
                                </button>
                            </div>
                        </div>

                        <!-- Статистика -->
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">Всего товаров</div>
                                    <div class="stat-card-icon" style="background: var(--warning-light); color: var(--warning);">
                                        <i class="fas fa-exclamation-triangle"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${pagination.totalCount}</div>
                                <div class="stat-card-change change-negative">
                                    <span>Требуют внимания</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">Критически мало</div>
                                    <div class="stat-card-icon" style="background: var(--danger-light); color: var(--danger);">
                                        <i class="fas fa-times-circle"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${products.filter(p => p.stock <= 5).length}</div>
                                <div class="stat-card-change">
                                    <span>Менее 5 шт.</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <div class="stat-card-title">Закончились</div>
                                    <div class="stat-card-icon" style="background: var(--danger-light); color: var(--danger);">
                                        <i class="fas fa-boxes"></i>
                                    </div>
                                </div>
                                <div class="stat-card-value">${products.filter(p => p.stock === 0).length}</div>
                                <div class="stat-card-change">
                                    <span>Нет в наличии</span>
                                </div>
                            </div>
                        </div>

                        <!-- Таблица товаров с низким остатком -->
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Список товаров для пополнения</div>
                                <div class="flex gap-2">
                                    <input type="text" id="low-stock-search" placeholder="Поиск по названию или артикулу..." 
                                           class="form-input" style="width: 300px;" 
                                           value="${this.lowStockPagination.search}"
                                           onkeyup="app.searchLowStockProducts(event)">
                                    <button class="btn btn-outline btn-sm" onclick="app.clearLowStockSearch()">
                                        <i class="fas fa-times"></i> Очистить
                                    </button>
                                </div>
                            </div>
                            
                            ${pagination.totalCount > 0 ? `
                                <div style="padding: 12px 24px; background: var(--bg-page); border-bottom: 1px solid var(--border);">
                                    <span style="color: var(--text-secondary); font-size: 0.875rem;">
                                        Показано ${((pagination.currentPage - 1) * pagination.pageSize) + 1}-${Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} из ${pagination.totalCount} товаров
                                    </span>
                                </div>
                            ` : ''}
                            
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Артикул</th>
                                            <th>Название</th>
                                            <th>Категория</th>
                                            <th>Текущий остаток</th>
                                            <th>Минимум</th>
                                            <th>Дата обновления</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody id="low-stock-table">
                                        ${products.length > 0 ? products.map(p => this.renderLowStockRow(p)).join('') : `
                                            <tr>
                                                <td colspan="7" class="text-center py-8">
                                                    <div class="empty-state">
                                                        <div class="empty-state-icon">
                                                            <i class="fas fa-${this.lowStockPagination.search ? 'search' : 'check-circle'}"></i>
                                                        </div>
                                                        <div class="empty-state-title">${this.lowStockPagination.search ? 'Ничего не найдено' : 'Все в порядке!'}</div>
                                                        <div class="empty-state-description">${this.lowStockPagination.search ? 'Попробуйте изменить поисковый запрос' : 'Нет товаров с низким остатком'}</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        `}
                                    </tbody>
                                </table>
                            </div>
                            
                            ${pagination.totalPages > 1 ? `
                                <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-top: 1px solid var(--border);">
                                    <button class="btn btn-outline btn-sm" 
                                            onclick="app.changeLowStockPage(${pagination.currentPage - 1})"
                                            ${!pagination.hasPreviousPage ? 'disabled' : ''}>
                                        <i class="fas fa-chevron-left"></i> Предыдущая
                                    </button>
                                    
                                    <div style="display: flex; gap: 8px; align-items: center;">
                                        ${this.renderPaginationButtons(pagination)}
                                    </div>
                                    
                                    <button class="btn btn-outline btn-sm" 
                                            onclick="app.changeLowStockPage(${pagination.currentPage + 1})"
                                            ${!pagination.hasNextPage ? 'disabled' : ''}>
                                        Следующая <i class="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                } catch (e) {
                    console.error('Render Manager LowStock Error:', e);
                    return '<div class="alert alert-danger">Ошибка загрузки списка товаров с низким остатком</div>';
                }
            },

            renderPaginationButtons(pagination) {
                const buttons = [];
                const maxButtons = 5;
                let startPage = Math.max(1, pagination.currentPage - Math.floor(maxButtons / 2));
                let endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1);
                
                if (endPage - startPage < maxButtons - 1) {
                    startPage = Math.max(1, endPage - maxButtons + 1);
                }
                
                if (startPage > 1) {
                    buttons.push(`<button class="btn btn-outline btn-sm" onclick="app.changeLowStockPage(1)">1</button>`);
                    if (startPage > 2) {
                        buttons.push(`<span style="padding: 0 8px;">...</span>`);
                    }
                }
                
                for (let i = startPage; i <= endPage; i++) {
                    const isActive = i === pagination.currentPage;
                    buttons.push(`
                        <button class="btn ${isActive ? 'btn-primary' : 'btn-outline'} btn-sm" 
                                onclick="app.changeLowStockPage(${i})"
                                ${isActive ? 'disabled' : ''}>
                            ${i}
                        </button>
                    `);
                }
                
                if (endPage < pagination.totalPages) {
                    if (endPage < pagination.totalPages - 1) {
                        buttons.push(`<span style="padding: 0 8px;">...</span>`);
                    }
                    buttons.push(`<button class="btn btn-outline btn-sm" onclick="app.changeLowStockPage(${pagination.totalPages})">${pagination.totalPages}</button>`);
                }
                
                return buttons.join('');
            },

            async changeLowStockPage(page) {
                this.lowStockPagination.currentPage = page;
                await this.nav('manager-low-stock');
            },

            async searchLowStockProducts(event) {
                // Debounce search
                clearTimeout(this.lowStockSearchTimeout);
                this.lowStockSearchTimeout = setTimeout(async () => {
                    this.lowStockPagination.search = event.target.value.trim();
                    this.lowStockPagination.currentPage = 1; // Reset to first page
                    await this.nav('manager-low-stock');
                }, 500);
            },

            async clearLowStockSearch() {
                this.lowStockPagination.search = '';
                this.lowStockPagination.currentPage = 1;
                await this.nav('manager-low-stock');
            },

            async refreshLowStock() {
                this.lowStockPagination.currentPage = 1;
                await this.nav('manager-low-stock');
            },

            renderLowStockRow(p) {
                const stockClass = p.stock === 0 ? 'status-cancelled' : 
                    p.stock <= 5 ? 'status-new' : 'status-processing';
                
                const stockText = p.stock === 0 ? 'Нет в наличии' :
                    p.stock <= 5 ? 'Критически мало' : 'Мало';
                
                return `
                    <tr data-product-id="${p.id}">
                        <td style="font-family: monospace; font-weight: 600; color: var(--text-secondary);">${p.article}</td>
                        <td><div class="font-bold">${p.name}</div></td>
                        <td><span class="badge" style="background: var(--bg-page);">${p.categoryName || '—'}</span></td>
                        <td><span class="status-badge ${stockClass}">${stockText}: ${p.stock} шт.</span></td>
                        <td><span class="text-secondary">10 шт.</span></td>
                        <td>${p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('ru-RU') : '—'}</td>
                        <td>
                            <div class="flex gap-2">
                                <button class="btn btn-outline btn-sm" onclick='app.restockProduct(${p.id})' title="Пополнить">
                                    <i class="fas fa-plus"></i> Пополнить
                                </button>
                                <button class="btn btn-primary btn-sm" onclick='app.quickRestock(${p.id}, 10)' title="Быстро пополнить на 10 шт.">
                                    <i class="fas fa-cart-plus"></i> +10 шт.
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            },

            async restockProduct(productId) {
                const quantity = prompt('Введите количество для пополнения:', '10');
                if (quantity === null || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
                    return;
                }
                
                const result = await this.fetchApi(`products/${productId}/restock`, {
                    method: 'POST',
                    body: JSON.stringify({ quantity: parseInt(quantity) })
                });
                
                if (result) {
                    this.showToast(`Товар пополнен на ${quantity} шт.`, 'success');
                    this.nav('manager-low-stock');
                } else {
                    this.showToast('Ошибка пополнения товара', 'error');
                }
            },

            async quickRestock(productId, quantity) {
                if (!confirm(`Пополнить товар на ${quantity} шт.?`)) {
                    return;
                }
                
                const result = await this.fetchApi(`products/${productId}/restock`, {
                    method: 'POST',
                    body: JSON.stringify({ quantity: quantity })
                });
                
                if (result) {
                    this.showToast(`Товар пополнен на ${quantity} шт.`, 'success');
                    this.nav('manager-low-stock');
                } else {
                    this.showToast('Ошибка пополнения товара', 'error');
                }
            },

            async createRestockOrder() {
                this.showToast('Функция создания заказа на пополнение в разработке', 'info');
            },

            toggleAddProductDropdown() {
                const dropdown = document.getElementById('add-product-dropdown');
                if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                }
            },

            closeAddProductDropdown() {
                const dropdown = document.getElementById('add-product-dropdown');
                if (dropdown) {
                    dropdown.style.display = 'none';
                }
            },

            showImportProductsModal() {
                // Show the import modal
                const modal = document.getElementById('import-modal');
                if (modal) {
                    modal.classList.add('active');
                } else {
                    // Create modal if it doesn't exist
                    this.createImportModal();
                    this.showImportProductsModal();
                }
            },

            createImportModal() {
                // Check if modal already exists
                if (document.getElementById('import-modal')) return;

                const modalHtml = `
                    <div class="modal-overlay" id="import-modal">
                        <div class="modal">
                            <div class="modal-header">
                                <h3 class="modal-title">Импорт товаров из CSV</h3>
                                <button class="modal-close" onclick="app.closeModal('import-modal')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="modal-body">
                                <div class="form-group">
                                    <label class="form-label">Выберите CSV файл для импорта</label>
                                    <div class="import-file-input">
                                        <input type="file" id="import-modal-file" accept=".csv" onchange="app.handleModalFileSelect()">
                                        <label for="import-modal-file" class="import-file-label">
                                            <i class="fas fa-cloud-upload-alt"></i>
                                            <span>Выберите файл или перетащите сюда</span>
                                        </label>
                                    </div>
                                    <div id="modal-selected-file" class="text-sm text-tertiary mt-2"></div>
                                </div>
                                <div class="text-sm text-tertiary mt-3">
                                    <i class="fas fa-info-circle"></i> Поддерживаемые колонки: Артикул, Название, Описание, Цена, Количество, Категория
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-outline" onclick="app.closeModal('import-modal')">Отмена</button>
                                <button class="btn btn-primary" id="modal-import-btn" onclick="app.importProductsFromModal()" disabled>
                                    <i class="fas fa-upload"></i> Импортировать
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                const div = document.createElement('div');
                div.innerHTML = modalHtml;
                document.body.appendChild(div);
            },

            async showAddProductModal() {
                document.getElementById('product-admin-form').reset();
                document.getElementById('product-id').value = '';
                document.getElementById('product-admin-modal-title').innerText = 'Добавление нового товара';

                const categorySelect = document.getElementById('product-category');
                categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
                this.categories.filter(c => !c.parentId).forEach(c => {
                    categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
                });

                this.showModal('product-admin-modal');
            },

            async editProduct(id) {
                const product = this.products.find(p => p.id === id);
                if (!product) return;

                document.getElementById('product-id').value = product.id;
                document.getElementById('product-article').value = product.article;
                document.getElementById('product-name').value = product.name;
                document.getElementById('product-description').value = product.description || '';
                document.getElementById('product-price').value = product.price;
                document.getElementById('product-stock').value = product.stock;
                document.getElementById('product-image').value = product.imageUrl || '';
                document.getElementById('product-active').checked = product.isActive;

                const categorySelect = document.getElementById('product-category');
                categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
                this.categories.filter(c => !c.parentId).forEach(c => {
                    categorySelect.innerHTML += `<option value="${c.id}" ${product.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`;
                });

                document.getElementById('product-admin-modal-title').innerText = 'Редактирование товара';
                this.showModal('product-admin-modal');
            },

            async saveProduct() {
                const id = document.getElementById('product-id').value;
                const data = {
                    article: document.getElementById('product-article').value.trim(),
                    name: document.getElementById('product-name').value.trim(),
                    description: document.getElementById('product-description').value.trim(),
                    price: parseFloat(document.getElementById('product-price').value),
                    costPrice: parseFloat(document.getElementById('product-cost').value) || 0,
                    stock: parseInt(document.getElementById('product-stock').value),
                    categoryId: parseInt(document.getElementById('product-category').value) || null,
                    imageUrl: document.getElementById('product-image').value.trim(),
                    isActive: document.getElementById('product-active').checked
                };

                if (!data.article || !data.name || isNaN(data.price)) {
                    this.showToast('Пожалуйста, заполните обязательные поля: Артикул, Название, Цена', 'error');
                    return;
                }

                const endpoint = id ? `products/${id}` : 'products';
                const method = id ? 'PUT' : 'POST';

                try {
                    const result = await this.fetchApi(endpoint, {
                        method: method,
                        body: JSON.stringify(data)
                    });

                    if (result) {
                        this.showToast(id ? 'Данные товара успешно обновлены' : 'Новый товар успешно создан', 'success');
                        this.closeModal('product-admin-modal');
                        await this.loadProducts(false);

                        // Fix for redirect: stay on the relevant dashboard page
                        if (this.currentPage === 'manager-products') {
                            this.nav('manager-products');
                        } else if (this.currentPage === 'admin') {
                            this.nav('admin');
                        } else {
                            // Default to products view if saved from generic view
                            await this.loadProducts(true);
                        }
                    }
                } catch (error) {
                    console.error('Save Product Error:', error);
                    this.showToast('Произошла ошибка при сохранении товара', 'error');
                }
            },



            // API Methods
});