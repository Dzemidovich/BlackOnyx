// Модерация регистраций
window.registrationsModule = {
    currentFilter: 'pending', // pending, approved, rejected, all

    async updatePendingCount() {
        try {
            const registrations = await app.fetchApi('users/pending-registrations');
            const count = registrations?.length || 0;
            
            // Обновляем бейдж в конфигурации меню
            const menuItem = app.navConfig.find(item => item.id === 'admin-registrations');
            if (menuItem) {
                menuItem.badge = count > 0 ? count : null;
            }
            
            // Обновляем бейдж в DOM
            const navItems = document.querySelectorAll('[data-page="admin-registrations"]');
            navItems.forEach(item => {
                let badge = item.querySelector('.nav-badge');
                if (count > 0) {
                    if (!badge) {
                        badge = document.createElement('div');
                        badge.className = 'nav-badge';
                        item.appendChild(badge);
                    }
                    badge.textContent = count;
                    badge.style.display = 'flex';
                } else if (badge) {
                    badge.remove();
                }
            });
            
            return count;
        } catch (error) {
            console.error('Error updating pending registrations count:', error);
            return 0;
        }
    },

    setFilter(filter) {
        this.currentFilter = filter;
        app.nav('admin-registrations');
    },

    async renderPendingRegistrations() {
        try {
            // Получаем регистрации по текущему фильтру
            const endpoint = this.currentFilter === 'pending' 
                ? 'users/pending-registrations' 
                : `users/registrations?status=${this.currentFilter}`;
            
            const registrations = await app.fetchApi(endpoint);

            const filterLabels = {
                'pending': 'На рассмотрении',
                'approved': 'Одобренные',
                'rejected': 'Отклоненные',
                'all': 'Все'
            };

            if (!registrations || registrations.length === 0) {
                return `
                    <div class="admin-page">
                        <div class="admin-page-header">
                            <div class="admin-page-header-left">
                                <h2 class="admin-page-title">
                                    <i class="fas fa-user-check"></i> Модерация регистраций
                                </h2>
                            </div>
                        </div>
                        
                        <div class="filter-chips">
                            <button class="filter-chip ${this.currentFilter === 'pending' ? 'active' : ''}" 
                                onclick="registrationsModule.setFilter('pending')">
                                <i class="fas fa-clock"></i> На рассмотрении
                            </button>
                            <button class="filter-chip ${this.currentFilter === 'approved' ? 'active' : ''}" 
                                onclick="registrationsModule.setFilter('approved')">
                                <i class="fas fa-check"></i> Одобренные
                            </button>
                            <button class="filter-chip ${this.currentFilter === 'rejected' ? 'active' : ''}" 
                                onclick="registrationsModule.setFilter('rejected')">
                                <i class="fas fa-times"></i> Отклоненные
                            </button>
                            <button class="filter-chip ${this.currentFilter === 'all' ? 'active' : ''}" 
                                onclick="registrationsModule.setFilter('all')">
                                <i class="fas fa-list"></i> Все
                            </button>
                        </div>

                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <h3>Нет регистраций</h3>
                            <p>${filterLabels[this.currentFilter]}: список пуст</p>
                        </div>
                    </div>
                `;
            }

            let html = `
                <div class="admin-page">
                    <div class="admin-page-header">
                        <div class="admin-page-header-left">
                            <h2 class="admin-page-title">
                                <i class="fas fa-user-check"></i> Модерация регистраций
                            </h2>
                            <p class="admin-page-subtitle">${filterLabels[this.currentFilter]}: ${registrations.length}</p>
                        </div>
                        <div class="admin-page-header-right">
                            <button class="btn btn-outline btn-sm" onclick="app.nav('admin-registrations')">
                                <i class="fas fa-sync"></i> Обновить
                            </button>
                        </div>
                    </div>

                    <div class="filter-chips">
                        <button class="filter-chip ${this.currentFilter === 'pending' ? 'active' : ''}" 
                            onclick="registrationsModule.setFilter('pending')">
                            <i class="fas fa-clock"></i> На рассмотрении
                        </button>
                        <button class="filter-chip ${this.currentFilter === 'approved' ? 'active' : ''}" 
                            onclick="registrationsModule.setFilter('approved')">
                            <i class="fas fa-check"></i> Одобренные
                        </button>
                        <button class="filter-chip ${this.currentFilter === 'rejected' ? 'active' : ''}" 
                            onclick="registrationsModule.setFilter('rejected')">
                            <i class="fas fa-times"></i> Отклоненные
                        </button>
                        <button class="filter-chip ${this.currentFilter === 'all' ? 'active' : ''}" 
                            onclick="registrationsModule.setFilter('all')">
                            <i class="fas fa-list"></i> Все
                        </button>
                    </div>

                    <div class="registrations-grid">
            `;

            registrations.forEach(reg => {
                const createdDate = reg.createdAt ? new Date(reg.createdAt).toLocaleString('ru-RU') : 'Неизвестно';
                const moderatedDate = reg.moderatedAt ? new Date(reg.moderatedAt).toLocaleString('ru-RU') : null;
                
                // Логируем для отладки
                console.log('Registration:', {
                    id: reg.id,
                    email: reg.email,
                    status: reg.registrationStatus,
                    isLegalEntity: reg.isLegalEntity
                });
                
                // Определяем статус для отображения
                let statusBadge = '';
                if (reg.registrationStatus === 'approved') {
                    statusBadge = '<div class="status-badge status-approved"><i class="fas fa-check-circle"></i> Одобрено</div>';
                } else if (reg.registrationStatus === 'rejected') {
                    statusBadge = '<div class="status-badge status-rejected"><i class="fas fa-times-circle"></i> Отклонено</div>';
                } else {
                    statusBadge = '<div class="status-badge status-pending"><i class="fas fa-clock"></i> На рассмотрении</div>';
                }
                
                html += `
                    <div class="registration-card" id="registration-${reg.id}">
                        <div class="registration-card-header">
                            <div class="registration-type-badge ${reg.isLegalEntity ? 'legal' : 'individual'}">
                                <i class="fas fa-${reg.isLegalEntity ? 'building' : 'user'}"></i>
                                ${reg.isLegalEntity ? 'Юридическое лицо' : 'Физическое лицо'}
                            </div>
                            ${statusBadge}
                            <div class="registration-date">
                                <i class="fas fa-calendar"></i> ${createdDate}
                            </div>
                        </div>

                        <div class="registration-card-body">
                            <h3 class="registration-name">${reg.fullName || 'Не указано'}</h3>
                            <div class="registration-info">
                                <div class="info-row">
                                    <i class="fas fa-envelope"></i>
                                    <span>${reg.email}</span>
                                </div>
                                ${reg.contactPhone ? `
                                    <div class="info-row">
                                        <i class="fas fa-phone"></i>
                                        <span>${reg.contactPhone}</span>
                                    </div>
                                ` : ''}
                            </div>

                            ${reg.isLegalEntity ? `
                                <div class="company-details">
                                    <h4><i class="fas fa-building"></i> Данные организации</h4>
                                    <div class="details-grid">
                                        <div class="detail-item">
                                            <span class="detail-label">Название:</span>
                                            <span class="detail-value">${reg.companyName || 'Не указано'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">УНП:</span>
                                            <span class="detail-value">${reg.unp || 'Не указан'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Юр. адрес:</span>
                                            <span class="detail-value">${reg.legalAddress || 'Не указан'}</span>
                                        </div>
                                        ${reg.actualAddress && reg.actualAddress !== reg.legalAddress ? `
                                            <div class="detail-item">
                                                <span class="detail-label">Факт. адрес:</span>
                                                <span class="detail-value">${reg.actualAddress}</span>
                                            </div>
                                        ` : ''}
                                        ${reg.directorName ? `
                                            <div class="detail-item">
                                                <span class="detail-label">Директор:</span>
                                                <span class="detail-value">${reg.directorName}</span>
                                            </div>
                                        ` : ''}
                                        ${reg.contactPerson ? `
                                            <div class="detail-item">
                                                <span class="detail-label">Контактное лицо:</span>
                                                <span class="detail-value">${reg.contactPerson}</span>
                                            </div>
                                        ` : ''}
                                    </div>

                                    ${reg.bankName || reg.bankCode || reg.checkingAccount ? `
                                        <h4><i class="fas fa-university"></i> Банковские реквизиты</h4>
                                        <div class="details-grid">
                                            ${reg.bankName ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">Банк:</span>
                                                    <span class="detail-value">${reg.bankName}</span>
                                                </div>
                                            ` : ''}
                                            ${reg.bankCode ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">БИК:</span>
                                                    <span class="detail-value">${reg.bankCode}</span>
                                                </div>
                                            ` : ''}
                                            ${reg.checkingAccount ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">Расчетный счет:</span>
                                                    <span class="detail-value">${reg.checkingAccount}</span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>

                        ${moderatedDate ? `
                            <div class="moderation-info">
                                <i class="fas fa-info-circle"></i>
                                <span>Модерировано: ${moderatedDate}</span>
                                ${reg.rejectionReason ? `<span class="rejection-reason">Причина: ${reg.rejectionReason}</span>` : ''}
                            </div>
                        ` : ''}

                        <div class="registration-card-footer">
                            ${reg.registrationStatus === 'pending' ? `
                                <button class="btn btn-success" onclick="registrationsModule.approveRegistration(${reg.id})">
                                    <i class="fas fa-check"></i> Одобрить
                                </button>
                                <button class="btn btn-danger" onclick="registrationsModule.showRejectModal(${reg.id})">
                                    <i class="fas fa-times"></i> Отклонить
                                </button>
                            ` : reg.registrationStatus === 'approved' ? `
                                <div class="status-info">
                                    <i class="fas fa-check-circle"></i> Регистрация одобрена
                                </div>
                            ` : `
                                <div class="status-info rejected">
                                    <i class="fas fa-times-circle"></i> Регистрация отклонена
                                </div>
                            `}
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;

            return html;
        } catch (error) {
            console.error('Error loading pending registrations:', error);
            return `
                <div class="admin-page">
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Ошибка загрузки заявок: ${error.message}
                    </div>
                </div>
            `;
        }
    },

    async approveRegistration(userId) {
        if (!confirm('Вы уверены, что хотите одобрить эту регистрацию?')) {
            return;
        }

        try {
            const result = await app.fetchApi(`users/${userId}/approve`, {
                method: 'POST'
            });

            app.showToast('Регистрация одобрена', 'success');
            
            // Обновляем счётчик заявок
            this.updatePendingCount();
            
            // Удаляем карточку из списка
            const card = document.getElementById(`registration-${userId}`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    card.remove();
                    
                    // Если больше нет заявок, перезагружаем страницу
                    const remainingCards = document.querySelectorAll('.registration-card');
                    if (remainingCards.length === 0) {
                        app.nav('admin-registrations');
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error approving registration:', error);
            app.showToast('Ошибка при одобрении регистрации', 'error');
        }
    },

    showRejectModal(userId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal active">
                <div class="modal-header">
                    <h3 class="modal-title">Отклонить регистрацию</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Причина отклонения *</label>
                        <textarea id="reject-reason" class="form-input" rows="4" 
                            placeholder="Укажите причину отклонения заявки..." required></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                        Отмена
                    </button>
                    <button class="btn btn-danger" onclick="registrationsModule.rejectRegistration(${userId})">
                        <i class="fas fa-times"></i> Отклонить
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async rejectRegistration(userId) {
        const reason = document.getElementById('reject-reason')?.value?.trim();
        
        if (!reason) {
            app.showToast('Укажите причину отклонения', 'error');
            return;
        }

        try {
            const result = await app.fetchApi(`users/${userId}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });

            app.showToast('Регистрация отклонена', 'success');
            
            // Обновляем счётчик заявок
            this.updatePendingCount();
            
            // Закрываем модальное окно
            document.querySelector('.modal-overlay')?.remove();
            
            // Удаляем карточку из списка
            const card = document.getElementById(`registration-${userId}`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    card.remove();
                    
                    // Если больше нет заявок, перезагружаем страницу
                    const remainingCards = document.querySelectorAll('.registration-card');
                    if (remainingCards.length === 0) {
                        app.nav('admin-registrations');
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error rejecting registration:', error);
            app.showToast('Ошибка при отклонении регистрации', 'error');
        }
    }
};
