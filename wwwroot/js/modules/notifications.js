// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Notifications module - renderNotifications, markNotificationAsRead
// Must be loaded after app.js and core/api.js
Object.assign(app, {

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
                        <div class="empty-state-icon"><i class="fas fa-bell"></i></div>
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
                        <div class="text-sm text-tertiary">Новые уведомления появляются сверху. Нажмите на уведомление о заказе, чтобы перейти к нему.</div>
                    </div>

                    <div class="notifications-list">
                        ${notifications.map(n => {
                            // Извлекаем ID заказа из сообщения (например, "Заказ #123 одобрен")
                            const orderIdMatch = n.message?.match(/#(\d+)/);
                            const orderId = orderIdMatch ? orderIdMatch[1] : null;
                            const isOrderNotification = n.type === 'order' || orderId;
                            const clickHandler = isOrderNotification && orderId 
                                ? `onclick="app.viewOrderFromNotification(${orderId}, ${n.id})" style="cursor: pointer;"` 
                                : '';
                            
                            return `
                            <div class="notification-item ${!n.isRead ? 'unread' : ''} ${isOrderNotification ? 'notification-clickable' : ''}" ${clickHandler}>
                                ${!n.isRead ? '<div class="notification-unread-dot"></div>' : ''}
                                <div class="notification-header ${!n.isRead ? 'unread' : ''}">
                                    <div class="notification-title">${n.title || 'Уведомление'}</div>
                                    <div class="notification-date">${n.createdAt ? new Date(n.createdAt).toLocaleDateString('ru-RU') : ''}</div>
                                </div>
                                ${n.type ? `<div class="notification-type ${!n.isRead ? 'unread' : ''}">Тип: ${
                                    n.type === 'system' ? 'Системное' :
                                    n.type === 'order' ? 'Заказ' :
                                    n.type === 'marketing' ? 'Маркетинг' : n.type
                                }</div>` : ''}
                                <div class="notification-message ${!n.isRead ? 'unread' : ''}">${n.message || ''}</div>
                                ${isOrderNotification && orderId ? `
                                    <div class="notification-actions">
                                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); app.viewOrderFromNotification(${orderId}, ${n.id})">
                                            <i class="fas fa-eye"></i> Посмотреть заказ
                                        </button>
                                    </div>
                                ` : ''}
                                ${!n.isRead && !isOrderNotification ? `
                                    <div class="notification-actions unread">
                                        <button class="btn btn-outline btn-sm" data-notification-id="${n.id}" onclick="app.markNotificationAsRead(Number(this.dataset.notificationId))">
                                            <i class="fas fa-check"></i> Отметить как прочитанное
                                        </button>
                                    </div>` : ''}
                            </div>
                        `;
                        }).join('')}
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
                </div>
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="empty-state-title">Ошибка загрузки</div>
                    <div class="empty-state-description">Не удалось загрузить уведомления</div>
                </div>
            `;
        }
    },

    async refreshNotifications() {
        try {
            await this.nav('notifications');
            this.showToast('Уведомления обновлены', 'success');
        } catch (error) {
            this.showToast('Ошибка обновления уведомлений', 'error');
        }
    },

    async markNotificationAsRead(notificationId) {
        try {
            await this.fetchApi(`notifications/${notificationId}/read`, { method: 'PUT' });

            const notificationItem = document.querySelector(`.notification-item button[data-notification-id="${notificationId}"]`)?.closest('.notification-item');
            if (notificationItem) {
                notificationItem.classList.remove('unread');
                notificationItem.querySelector('.notification-unread-dot')?.remove();
                notificationItem.querySelector('.notification-actions')?.remove();
            }

            const notificationsItem = this.navConfig.find(item => item.id === 'notifications');
            if (notificationsItem && notificationsItem.badge > 0) {
                notificationsItem.badge--;
                this.renderMenu();
            }
            
            // Update unreadNotifications count
            if (this.unreadNotifications > 0) {
                this.unreadNotifications--;
            }
            
            // Update mobile menu
            if (this.renderMobileSidebar && typeof this.renderMobileSidebar === 'function') {
                this.renderMobileSidebar();
            }

            this.showToast('Уведомление отмечено как прочитанное', 'success');
        } catch (error) {
            this.showToast('Ошибка при отметке уведомления', 'error');
        }
    },
    
    // Переход к заказу из уведомления
    async viewOrderFromNotification(orderId, notificationId) {
        try {
            // Отмечаем уведомление как прочитанное
            if (notificationId) {
                await this.fetchApi(`notifications/${notificationId}/read`, { method: 'PUT' });
                
                // Update unreadNotifications count
                if (this.unreadNotifications > 0) {
                    this.unreadNotifications--;
                }
                
                // Update nav config
                const notificationsItem = this.navConfig.find(item => item.id === 'notifications');
                if (notificationsItem && notificationsItem.badge > 0) {
                    notificationsItem.badge--;
                }
            }
            
            // Загружаем заказ
            const order = await this.fetchApi(`orders/${orderId}`);
            
            if (order) {
                // Показываем модальное окно с деталями заказа
                this.showOrderModal(order);
            } else {
                this.showToast('Заказ не найден', 'error');
            }
        } catch (error) {
            console.error('Ошибка при открытии заказа:', error);
            this.showToast('Ошибка при загрузке заказа', 'error');
        }
    },

});
