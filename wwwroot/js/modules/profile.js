// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Profile module - renderProfile, updateProfileInfo, changePassword
// Must be loaded after app.js and core/api.js
Object.assign(app, {

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
                        
                        ${this.orders && this.orders.length > 0 ? `
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

        document.querySelectorAll('.profile-nav-item').forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');

        document.querySelectorAll('.profile-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`section-${section}`).classList.add('active');

        // Load loyalty data when switching to loyalty section
        if (section === 'loyalty') {
            this.loadLoyaltyData();
        }
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
            body: JSON.stringify({ currentPassword, newPassword })
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

    // Loyalty Program
    async loadLoyaltyData() {
        try {
            const userId = this.currentUser?.id;
            if (!userId) {
                console.error('User ID not found');
                return;
            }

            const response = await this.api(`/api/loyalty/user/${userId}`, 'GET');
            
            if (response && response.userId) {
                this.displayLoyaltyData(response);
            }
        } catch (error) {
            console.error('Error loading loyalty data:', error);
            this.showNotification('Ошибка загрузки данных лояльности', 'error');
        }
    },

    displayLoyaltyData(data) {
        // Update discount and total
        const discountEl = document.getElementById('loyalty-discount');
        const totalEl = document.getElementById('loyalty-total');
        
        if (discountEl) discountEl.textContent = `${data.currentDiscount}%`;
        if (totalEl) totalEl.textContent = `${data.totalOrdersAmount.toFixed(2)} BYN`;

        // Update progress bar
        const progress = data.progress;
        if (progress.isMaxLevel) {
            // Show max level message
            const progressSection = document.getElementById('loyalty-progress-section');
            const maxLevelSection = document.getElementById('loyalty-max-level');
            if (progressSection) progressSection.style.display = 'none';
            if (maxLevelSection) maxLevelSection.style.display = 'flex';
        } else {
            // Show progress to next level
            const progressSection = document.getElementById('loyalty-progress-section');
            const maxLevelSection = document.getElementById('loyalty-max-level');
            if (progressSection) progressSection.style.display = 'block';
            if (maxLevelSection) maxLevelSection.style.display = 'none';

            const progressText = document.getElementById('loyalty-progress-text');
            const progressAmount = document.getElementById('loyalty-progress-amount');
            const progressFill = document.getElementById('loyalty-progress-fill');
            const nextDiscount = document.getElementById('loyalty-next-discount');

            const remaining = progress.nextThreshold - progress.currentAmount;
            
            if (progressText) progressText.textContent = 'До следующего уровня';
            if (progressAmount) progressAmount.textContent = `${remaining.toFixed(2)} BYN`;
            if (progressFill) progressFill.style.width = `${progress.progressPercent}%`;
            if (nextDiscount) nextDiscount.textContent = `Следующая скидка: ${progress.nextThresholdDiscount}%`;
        }
    }
});
