// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Orders module - renderOrders, filterOrders, reorderItems
// Must be loaded after app.js and core/api.js
Object.assign(app, {

    renderOrders() {
        if (!this.orders || this.orders.length === 0) {
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
                    <div class="empty-state-icon"><i class="fas fa-list"></i></div>
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
                    <button class="btn btn-outline btn-sm" onclick="app.loadOrders().then(() => app.nav('orders'))">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="app.nav('products')">
                        <i class="fas fa-plus"></i> Новый заказ
                    </button>
                </div>
            </div>

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
        const now = new Date();
        const diffDays = Math.floor(Math.abs(now - orderDate) / (1000 * 60 * 60 * 24));

        let dateDisplay;
        if (diffDays === 0) dateDisplay = 'Сегодня';
        else if (diffDays === 1) dateDisplay = 'Вчера';
        else if (diffDays < 7) dateDisplay = `${diffDays} дн. назад`;
        else dateDisplay = orderDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

        const timeDisplay = orderDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const items = order.items || [];
        const itemsText = items.length === 0 ? 'Нет товаров' :
                          items.length === 1 ? '1 товар' :
                          items.length < 5 ? `${items.length} товара` : `${items.length} товаров`;

        // Mobile-first card design
        const isMobile = window.innerWidth <= 767;
        
        if (isMobile) {
            return `
                <div class="order-row" data-status="${order.status}">
                    <div class="order-mobile-header">
                        <div>
                            <div class="order-mobile-id">#${order.id}</div>
                            <div class="order-mobile-date">${dateDisplay}</div>
                        </div>
                        <div class="order-mobile-amount">Сумма: ${(order.totalAmount || 0).toFixed(2)} BYN</div>
                    </div>
                    
                    <div class="order-mobile-info">
                        <div class="order-mobile-user">Пользователь: ${order.userFullName || 'Вы'}</div>
                        <div class="order-mobile-email">Email: ${order.userEmail || '-'}</div>
                        <div class="order-mobile-items">Товаров: ${items.length}</div>
                    </div>
                    
                    <div class="order-mobile-actions">
                        <span class="order-mobile-status ${status.class}">
                            <i class="fas fa-${status.icon}"></i> ${status.label}
                        </span>
                        <div class="order-mobile-buttons">
                            <button class="order-mobile-btn" onclick="app.viewOrderDetails(${order.id})" title="Просмотр">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="order-mobile-btn" onclick="app.viewOrderDetails(${order.id})" title="Детали">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>`;
        }

        // Desktop version (original)
        const itemsPreview = items.slice(0, 3).map(item => {
            const imageUrl = this.getProductImage({ article: item.productArticle, imageUrl: item.imageUrl });
            console.log(`[ORDER PREVIEW] Article: ${item.productArticle}, ImageUrl from item: ${item.imageUrl}, Final imageUrl: ${imageUrl}`);
            return imageUrl 
                ? `<div style="width:52px;height:52px;min-width:52px;background:#fff;border-radius:6px;border:1px solid #e0e0e0;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:4px;flex-shrink:0;"><img src="${imageUrl}" alt="${item.productName}" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-tools\\' style=\\'font-size:1rem;color:#aaa;\\'></i>'"></div>`
                : `<div style="width:52px;height:52px;min-width:52px;background:#f5f5f5;border-radius:6px;border:1px solid #e0e0e0;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-tools" style="font-size:1rem;color:#aaa;"></i></div>`;
        }).join('');

        const moreItems = items.length > 3 
            ? `<div style="width:52px;height:52px;min-width:52px;background:#f5f5f5;border-radius:6px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:#666;flex-shrink:0;">+${items.length - 3}</div>` 
            : '';

        const previewHtml = items.length > 0 
            ? `${itemsPreview}${moreItems}`
            : `<div style="width:52px;height:52px;min-width:52px;background:#f5f5f5;border-radius:6px;border:1px solid #e0e0e0;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-tools" style="font-size:1rem;color:#aaa;"></i></div>`;

        return `
            <div class="order-row" data-status="${order.status}">
                <div class="order-col order-id">
                    <span class="order-num">#${order.id}</span>
                    <span class="order-date-small">${dateDisplay}</span>
                    <span class="order-time-small">${timeDisplay}</span>
                </div>
                <div class="order-col order-items-preview-col">
                    <div style="display:flex;flex-direction:row;gap:8px;align-items:center;flex-wrap:nowrap;">
                        ${previewHtml}
                    </div>
                </div>
                <div class="order-col order-amount-col">${(order.totalAmount || 0).toFixed(2)} BYN</div>
                <div class="order-col order-status-col">
                    <span class="order-status ${status.class}">
                        <i class="fas fa-${status.icon}"></i> ${status.label}
                    </span>
                </div>
                <div class="order-col" style="min-width:60px;display:flex;align-items:center;justify-content:center;">
                    <button onclick="app.viewOrderDetails(${order.id})" title="Детали заказа"
                        style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 14px;border-radius:6px;border:1.5px solid #ccc;background:#fff;color:#555;font-size:0.9rem;cursor:pointer;transition:all 0.2s;white-space:nowrap;">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>`;
    },

    filterOrders(filter) {
        document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
        event.target.closest('.filter-chip').classList.add('active');

        document.querySelectorAll('.order-row').forEach(row => {
            const status = row.dataset.status;
            if (filter === 'all') row.style.display = 'flex';
            else if (filter === 'active') row.style.display = (status === 'Новый' || status === 'В обработке') ? 'flex' : 'none';
            else if (filter === 'completed') row.style.display = status === 'Завершен' ? 'flex' : 'none';
        });
    },

    async reorderItems(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order || !order.items) {
            this.showToast('Не удалось загрузить товары из заказа', 'error');
            return;
        }

        // Создаём красивое модальное окно
        const itemsHtml = order.items.map(item => {
            const imageUrl = this.getProductImage({ article: item.productArticle, imageUrl: item.imageUrl });
            const imgHtml = imageUrl
                ? `<img src="${imageUrl}" alt="${window.escapeHtml(item.productName)}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-tools\\' style=\\'font-size:1.2rem;color:var(--text-light);\\'></i>'">`
                : `<i class="fas fa-tools" style="font-size:1.2rem;color:var(--text-light);"></i>`;
            
            return `
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border);">
                    <div style="width: 48px; height: 48px; min-width: 48px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px;">
                        ${imgHtml}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-main); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${window.escapeHtml(item.productName)}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary);">
                            Арт: ${window.escapeHtml(item.productArticle)}
                        </div>
                    </div>
                    <div style="text-align: right; flex-shrink: 0;">
                        <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">
                            ${item.quantity} шт
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">
                            ${item.total.toFixed(2)} BYN
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const modalContent = `
            <div class="modal-header">
                <h2 class="modal-title">
                    <i class="fas fa-redo" style="color: var(--primary);"></i>
                    Повторить заказ #${orderId}
                </h2>
                <button class="modal-close" onclick="app.closeModal('reorder-modal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%); 
                            border-left: 4px solid var(--success); 
                            padding: 16px; 
                            border-radius: 8px; 
                            margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <i class="fas fa-info-circle" style="color: var(--success); font-size: 1.2rem;"></i>
                        <div style="font-weight: 700; font-size: 1rem; color: var(--text-main);">
                            Добавить товары в корзину?
                        </div>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
                        Все товары из заказа будут добавлены в вашу корзину. Вы сможете изменить количество или удалить ненужные товары перед оформлением.
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-box" style="color: var(--primary);"></i>
                        Товары (${order.items.length} шт.)
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto;">
                        ${itemsHtml}
                    </div>
                </div>

                <div style="background: var(--bg-page); 
                            padding: 16px; 
                            border-radius: 8px; 
                            border: 2px solid var(--primary-light);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;">
                    <div style="font-weight: 600; font-size: 1rem; color: var(--text-main);">
                        Итого:
                    </div>
                    <div style="font-weight: 700; font-size: 1.3rem; color: var(--primary);">
                        ${order.totalAmount.toFixed(2)} BYN
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="app.closeModal('reorder-modal')">
                    <i class="fas fa-times"></i> Отмена
                </button>
                <button class="btn btn-primary" onclick="app.confirmReorder(${orderId})">
                    <i class="fas fa-shopping-cart"></i> Добавить в корзину
                </button>
            </div>
        `;

        this.showModal('reorder-modal', modalContent);
    },

    async confirmReorder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order || !order.items) {
            this.showToast('Не удалось загрузить товары из заказа', 'error');
            this.closeModal('reorder-modal');
            return;
        }

        // Показываем индикатор загрузки
        const modalBody = document.querySelector('#reorder-modal .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px;">
                    <div style="width: 48px; height: 48px; border: 4px solid var(--primary-light); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div style="margin-top: 20px; font-weight: 600; color: var(--text-main);">
                        Добавляем товары в корзину...
                    </div>
                </div>
            `;
        }

        let addedCount = 0;
        let failedCount = 0;

        for (const item of order.items) {
            try {
                const result = await this.fetchApi('cart/add', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        productId: item.productId, 
                        quantity: item.quantity 
                    })
                });
                if (result && result.success) {
                    addedCount++;
                } else {
                    failedCount++;
                }
            } catch (error) {
                console.error('Error adding item to cart:', error);
                failedCount++;
            }
        }

        this.closeModal('reorder-modal');

        if (addedCount > 0) {
            await this.loadCart();
            if (failedCount > 0) {
                this.showToast(`Добавлено ${addedCount} из ${order.items.length} товаров`, 'warning');
            } else {
                this.showToast(`Добавлено ${addedCount} товаров в корзину`, 'success');
            }
            this.nav('cart');
        } else {
            this.showToast('Не удалось добавить товары в корзину', 'error');
        }
    },

    async viewOrderDetails(orderId) {
        const details = await this.fetchApi(`orders/${orderId}/details`);
        if (!details) {
            this.showToast('Не удалось загрузить детали заказа', 'error');
            return;
        }

        console.log('[ORDER DETAILS]', details);
        console.log('[ORDER DETAILS] Comment:', details.comment);
        console.log('[ORDER DETAILS] isLegalEntity:', details.isLegalEntity);
        console.log('[ORDER DETAILS] UNP:', details.unp);
        console.log('[ORDER DETAILS] BankCode:', details.bankCode);
        console.log('[ORDER DETAILS] CheckingAccount:', details.checkingAccount);

        const statusConfig = {
            'Новый': { icon: 'clock', class: 'status-new', label: 'Новый' },
            'В обработке': { icon: 'cog', class: 'status-processing', label: 'В работе' },
            'Завершен': { icon: 'check', class: 'status-completed', label: 'Завершен' },
            'Отменен': { icon: 'times', class: 'status-cancelled', label: 'Отменен' }
        };

        const status = statusConfig[details.status] || statusConfig['Новый'];
        const orderDate = new Date(details.createdAt);
        const isAdmin = this.currentUser && (this.currentUser.role === 'Admin' || this.currentUser.role === 'Manager');

        // Формируем информацию о клиенте для админа
        let clientInfo = '';
        if (isAdmin) {
            if (details.isLegalEntity) {
                clientInfo = `
                    <div class="client-info-section">
                        <h3 style="margin-top: 24px; margin-bottom: 16px; color: var(--primary);">
                            <i class="fas fa-building"></i> Информация о клиенте (Юр. лицо)
                        </h3>
                        <div class="order-info-grid">
                            <div class="info-item">
                                <span class="info-label">Организация:</span>
                                <span class="info-value">${window.escapeHtml(details.companyName || '-')}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">УНП:</span>
                                <span class="info-value">${window.escapeHtml(details.unp || '-')}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Контактное лицо:</span>
                                <span class="info-value">${window.escapeHtml(details.contactPerson || details.userFullName || '-')}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Телефон:</span>
                                <span class="info-value">${window.escapeHtml(details.contactPhone || '-')}</span>
                            </div>
                            <div class="info-item" style="grid-column: 1 / -1;">
                                <span class="info-label">Юридический адрес:</span>
                                <span class="info-value">${window.escapeHtml(details.legalAddress || '-')}</span>
                            </div>
                            <div class="info-item" style="grid-column: 1 / -1;">
                                <span class="info-label">Фактический адрес:</span>
                                <span class="info-value">${window.escapeHtml(details.actualAddress || '-')}</span>
                            </div>
                            ${details.directorName ? `
                            <div class="info-item">
                                <span class="info-label">Директор:</span>
                                <span class="info-value">${window.escapeHtml(details.directorName)}</span>
                            </div>
                            ` : ''}
                            ${details.bankName ? `
                            <div class="info-item">
                                <span class="info-label">Банк:</span>
                                <span class="info-value">${window.escapeHtml(details.bankName)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">БИК:</span>
                                <span class="info-value">${window.escapeHtml(details.bankCode || '-')}</span>
                            </div>
                            <div class="info-item" style="grid-column: 1 / -1;">
                                <span class="info-label">Расчётный счёт:</span>
                                <span class="info-value">${window.escapeHtml(details.checkingAccount || '-')}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            } else {
                clientInfo = `
                    <div class="client-info-section">
                        <h3 style="margin-top: 24px; margin-bottom: 16px; color: var(--primary);">
                            <i class="fas fa-user"></i> Информация о клиенте (Физ. лицо)
                        </h3>
                        <div class="order-info-grid">
                            <div class="info-item">
                                <span class="info-label">ФИО:</span>
                                <span class="info-value">${window.escapeHtml(details.userFullName || '-')}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Email:</span>
                                <span class="info-value">${window.escapeHtml(details.userEmail)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            // Покупатель видит свои реквизиты если они заполнены
            const hasCompanyInfo = details.unp || details.bankCode || details.checkingAccount || details.companyName;
            if (hasCompanyInfo) {
                clientInfo = `
                    <div class="client-info-section">
                        <h3 style="margin-top: 24px; margin-bottom: 16px; color: var(--primary);">
                            <i class="fas fa-building"></i> Реквизиты покупателя
                        </h3>
                        <div class="order-info-grid">
                            ${details.companyName ? `
                            <div class="info-item">
                                <span class="info-label">Организация:</span>
                                <span class="info-value">${window.escapeHtml(details.companyName)}</span>
                            </div>
                            ` : ''}
                            ${details.unp ? `
                            <div class="info-item">
                                <span class="info-label">УНП:</span>
                                <span class="info-value">${window.escapeHtml(details.unp)}</span>
                            </div>
                            ` : ''}
                            ${details.contactPerson ? `
                            <div class="info-item">
                                <span class="info-label">Контактное лицо:</span>
                                <span class="info-value">${window.escapeHtml(details.contactPerson)}</span>
                            </div>
                            ` : ''}
                            ${details.contactPhone ? `
                            <div class="info-item">
                                <span class="info-label">Телефон:</span>
                                <span class="info-value">${window.escapeHtml(details.contactPhone)}</span>
                            </div>
                            ` : ''}
                            ${details.legalAddress ? `
                            <div class="info-item" style="grid-column: 1 / -1;">
                                <span class="info-label">Юридический адрес:</span>
                                <span class="info-value">${window.escapeHtml(details.legalAddress)}</span>
                            </div>
                            ` : ''}
                            ${details.bankName ? `
                            <div class="info-item">
                                <span class="info-label">Банк:</span>
                                <span class="info-value">${window.escapeHtml(details.bankName)}</span>
                            </div>
                            ` : ''}
                            ${details.bankCode ? `
                            <div class="info-item">
                                <span class="info-label">БИК:</span>
                                <span class="info-value">${window.escapeHtml(details.bankCode)}</span>
                            </div>
                            ` : ''}
                            ${details.checkingAccount ? `
                            <div class="info-item" style="grid-column: 1 / -1;">
                                <span class="info-label">Расчётный счёт:</span>
                                <span class="info-value">${window.escapeHtml(details.checkingAccount)}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        }

        const itemsHtml = details.items.length === 0
            ? `<div class="no-items">Товары в заказе не найдены</div>`
            : details.items.map(item => {
                const imageUrl = this.getProductImage({ article: item.productArticle, imageUrl: item.imageUrl });
                const imgHtml = imageUrl
                    ? `<img src="${imageUrl}" alt="${window.escapeHtml(item.productName)}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-tools\\' style=\\'font-size:1.5rem;color:var(--text-light);\\'></i>'">`
                    : `<i class="fas fa-tools" style="font-size:1.5rem;color:var(--text-light);"></i>`;
                return `
                <div class="order-item-row">
                    <div class="order-item-image">${imgHtml}</div>
                    <div class="order-item-info">
                        <div class="order-item-name">${window.escapeHtml(item.productName)}</div>
                        <div class="order-item-article">Арт: ${window.escapeHtml(item.productArticle)}</div>
                    </div>
                    <div class="order-item-quantity">${item.quantity} шт</div>
                    <div class="order-item-total">${item.total.toFixed(2)} BYN</div>
                </div>`;
            }).join('');

        const modalContent = `
            <div class="modal-header">
                <h2 class="modal-title">Заказ #${details.id}</h2>
                <button class="modal-close" onclick="app.closeModal('order-details-modal')"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">

                <!-- Номер + статус -->
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border);">
                    <div>
                        <div style="font-size:2rem;font-weight:800;color:var(--primary);line-height:1;">#${details.id}</div>
                        <div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:4px;display:flex;align-items:center;gap:4px;">
                            <i class="fas fa-calendar-alt"></i>
                            ${orderDate.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <span class="order-status ${status.class}" style="flex-shrink:0;">
                        <i class="fas fa-${status.icon}"></i> ${status.label}
                    </span>
                </div>

                <!-- Покупатель -->
                <div class="modal-section">
                    <div class="modal-section-title"><i class="fas fa-user"></i> Покупатель</div>
                    <div style="font-weight:600;font-size:0.95rem;color:var(--text-main);margin-bottom:4px;">${window.escapeHtml(details.userFullName || details.userEmail)}</div>
                    <div style="font-size:0.85rem;color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
                        <i class="fas fa-envelope" style="font-size:0.75rem;"></i> ${window.escapeHtml(details.userEmail)}
                    </div>
                </div>

                ${details.comment ? `
                <div class="modal-section" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%); 
                                                  border-left: 4px solid var(--primary); 
                                                  padding: 16px; 
                                                  border-radius: 8px;">
                    <div class="modal-section-title" style="margin-bottom: 8px;">
                        <i class="fas fa-comment"></i> Комментарий к заказу
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-main); line-height: 1.6; white-space: pre-wrap;">
                        ${window.escapeHtml(details.comment)}
                    </div>
                </div>
                ` : ''}

                ${clientInfo}

                <!-- Товары -->
                <div class="modal-section">
                    <div class="modal-section-title"><i class="fas fa-box"></i> Товары в заказе (${details.items.length})</div>
                    <div class="order-items-list">${itemsHtml}</div>
                </div>

                <!-- Итого -->
                <div class="order-summary-block">
                    <div class="order-summary-total">
                        <span>Итого:</span>
                        <span>${details.totalAmount.toFixed(2)} BYN</span>
                    </div>
                    <div class="order-summary-row" style="margin-top:4px;">
                        <span>Товаров: ${details.items.reduce((s, i) => s + i.quantity, 0)} шт</span>
                    </div>
                </div>

            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="app.closeModal('order-details-modal')">
                    <i class="fas fa-times"></i> Закрыть
                </button>
                ${details.status === 'Завершен' && !isAdmin ? `
                    <button class="btn btn-primary" onclick="app.closeModal('order-details-modal'); app.reorderItems(${details.id})">
                        <i class="fas fa-redo"></i> Повторить заказ
                    </button>
                ` : ''}
            </div>
        `;

        this.showModal('order-details-modal', modalContent);
    },

});
