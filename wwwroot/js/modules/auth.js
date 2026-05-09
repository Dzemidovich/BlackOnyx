// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Auth/Modal utility module - showModal, closeModal, showUserMenu, sendNotification
// Must be loaded after app.js
Object.assign(app, {
            showModal(modalId, dynamicContent = null) {
                let modal = document.getElementById(modalId);
                
                // If dynamic content provided and modal doesn't exist, create it
                if (dynamicContent && !modal) {
                    modal = document.createElement('div');
                    modal.id = modalId;
                    modal.className = 'modal-overlay';
                    modal.innerHTML = `<div class="modal-content">${dynamicContent}</div>`;
                    document.body.appendChild(modal);
                    
                    // Add click outside to close
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            this.closeModal(modalId);
                        }
                    });
                }
                
                // If dynamic content provided and modal exists, update it
                if (dynamicContent && modal) {
                    const modalContent = modal.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.innerHTML = dynamicContent;
                    }
                }
                
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
                    
                    // Remove dynamically created modals
                    if (!modal.hasAttribute('data-static')) {
                        setTimeout(() => {
                            if (modal.parentElement) {
                                modal.remove();
                            }
                        }, 300); // Wait for animation
                    }
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
});