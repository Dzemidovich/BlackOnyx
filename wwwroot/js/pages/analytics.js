// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Analytics module - charts, analytics, user markups
// Must be loaded after app.js and core/api.js
Object.assign(app, {
            async showCreateUserMarkupModal() {
                // Load users for selection
                const users = await this.fetchApi('users');
                const userSelect = document.getElementById('user-markup-user');
                userSelect.innerHTML = '<option value="">Выберите пользователя</option>';

                if (users) {
                    users.forEach(user => {
                        if (user.role === 'Customer') {
                            const option = document.createElement('option');
                            option.value = user.id;
                            option.textContent = `${user.fullName || 'Без имени'} (${user.email})`;
                            userSelect.appendChild(option);
                        }
                    });
                }

                // Reset form
                document.getElementById('user-markup-modal-title').innerText = 'Добавить наценку';
                document.getElementById('user-markup-id').value = '';
                document.getElementById('user-markup-user').value = '';
                document.getElementById('user-markup-percent').value = '13';
                document.getElementById('user-markup-active').checked = true;
                document.getElementById('user-markup-reason').value = 'VIP клиент';

                this.showModal('user-markup-modal');
            },

            async editUserMarkup(markupId) {
                try {
                    const markup = await this.fetchApi(`usermarkups/${markupId}`);
                    if (markup) {
                        // Load users for selection
                        const users = await this.fetchApi('users');
                        const userSelect = document.getElementById('user-markup-user');
                        userSelect.innerHTML = '<option value="">Выберите пользователя</option>';

                        if (users) {
                            users.forEach(user => {
                                if (user.role === 'Customer') {
                                    const option = document.createElement('option');
                                    option.value = user.id;
                                    option.textContent = `${user.fullName || 'Без имени'} (${user.email})`;
                                    if (user.id === markup.userId) option.selected = true;
                                    userSelect.appendChild(option);
                                }
                            });
                        }

                        // Fill form
                        document.getElementById('user-markup-modal-title').innerText = 'Редактировать наценку';
                        document.getElementById('user-markup-id').value = markup.id;
                        document.getElementById('user-markup-user').value = markup.userId;
                        document.getElementById('user-markup-percent').value = markup.markupPercent;
                        document.getElementById('user-markup-active').checked = markup.isActive;
                        document.getElementById('user-markup-reason').value = '';

                        this.showModal('user-markup-modal');
                    }
                } catch (error) {
                    this.showToast('Ошибка загрузки наценки', 'error');
                }
            },

            async saveUserMarkup() {
                const markupId = document.getElementById('user-markup-id').value;
                const userId = parseInt(document.getElementById('user-markup-user').value);
                const markupPercent = parseFloat(document.getElementById('user-markup-percent').value);
                const isActive = document.getElementById('user-markup-active').checked;
                const changeReason = document.getElementById('user-markup-reason').value.trim();

                if (!userId || !markupPercent || markupPercent < 0) {
                    this.showToast('Заполните все обязательные поля корректно', 'error');
                    return;
                }

                try {
                    let result;
                    if (markupId) {
                        // Update existing markup
                        const updateData = {
                            markupPercent: markupPercent,
                            changeReason: changeReason
                        };
                        result = await this.fetchApi(`usermarkups/${markupId}`, {
                            method: 'PUT',
                            body: JSON.stringify(updateData)
                        });
                    } else {
                        // Create new markup
                        const createData = {
                            userId: userId,
                            markupPercent: markupPercent,
                            changeReason: changeReason
                        };
                        result = await this.fetchApi('usermarkups', {
                            method: 'POST',
                            body: JSON.stringify(createData)
                        });
                    }

                    if (result) {
                        this.showToast(markupId ? 'Наценка обновлена' : 'Наценка создана', 'success');
                        this.closeModal('user-markup-modal');
                        this.nav('admin-markups');
                    }
                } catch (error) {
                    this.showToast('Ошибка сохранения наценки', 'error');
                }
            },

            async toggleUserMarkupStatus(markupId, currentStatus) {
                const newStatus = !currentStatus;
                const action = newStatus ? 'включена' : 'отключена';

                try {
                    const result = await this.fetchApi(`usermarkups/${markupId}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            isActive: newStatus,
                            changeReason: `Наценка ${action} администратором`
                        })
                    });

                    if (result) {
                        this.showToast(`Наценка ${action}`, 'success');
                        this.nav('admin-markups');
                    }
                } catch (error) {
                    this.showToast('Ошибка изменения статуса наценки', 'error');
                }
            },

            async deleteUserMarkup(markupId) {
                if (!confirm('Вы уверены, что хотите удалить эту наценку?')) {
                    return;
                }

                try {
                    const result = await this.fetchApi(`usermarkups/${markupId}`, {
                        method: 'DELETE'
                    });

                    if (result) {
                        this.showToast('Наценка удалена', 'success');
                        this.nav('admin-markups');
                    }
                } catch (error) {
                    this.showToast('Ошибка удаления наценки', 'error');
                }
            },

            async viewUserMarkupHistory(userId) {
                try {
                    const history = await this.fetchApi(`usermarkups/${userId}/history`);

                    document.getElementById('user-markup-history-modal-title').innerText = 'История изменений наценки';

                    let historyHtml = '';

                    if (history && history.length > 0) {
                        historyHtml = `
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Дата</th>
                                            <th>Старое значение</th>
                                            <th>Новое значение</th>
                                            <th>Изменение</th>
                                            <th>Кто изменил</th>
                                            <th>Причина</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${history.map(item => {
                            const change = item.newMarkupPercent - item.oldMarkupPercent;
                            const changeText = change > 0 ? `+${change}%` : `${change}%`;
                            const changeClass = change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-secondary';

                            return `
                                                <tr>
                                                    <td style="font-size: 0.8rem;">${new Date(item.changedAt).toLocaleDateString('ru-RU')} ${new Date(item.changedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td><span class="font-semibold">${item.oldMarkupPercent}%</span></td>
                                                    <td><span class="font-semibold text-primary">${item.newMarkupPercent}%</span></td>
                                                    <td><span class="${changeClass} font-semibold">${changeText}</span></td>
                                                    <td>${item.changedByUser?.fullName || 'Система'}</td>
                                                    <td style="max-width: 200px;">${item.changeReason || '-'}</td>
                                                </tr>
                                            `;
                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    } else {
                        historyHtml = `
                            <div class="empty-state">
                                <div class="empty-state-icon">
                                    <i class="fas fa-history"></i>
                                </div>
                                <div class="empty-state-title">История пуста</div>
                                <div class="empty-state-description">Для этого пользователя нет истории изменений наценки</div>
                            </div>
                        `;
                    }

                    document.getElementById('user-markup-history-content').innerHTML = historyHtml;
                    this.showModal('user-markup-history-modal');
                } catch (error) {
                    this.showToast('Ошибка загрузки истории', 'error');
                }
            },

            debouncedFilterUserMarkups() {
                clearTimeout(this.userMarkupFilterTimeout);
                this.userMarkupFilterTimeout = setTimeout(() => this.filterUserMarkups(), 500);
            },

            async filterUserMarkups() {
                const searchTerm = document.getElementById('user-markup-search').value.toLowerCase().trim();
                const statusFilter = document.getElementById('user-markup-status-filter').value;

                // Reload markups with filters
                try {
                    let url = 'usermarkups?';
                    if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
                    if (statusFilter) url += `status=${statusFilter}&`;

                    const markups = await this.fetchApi(url.slice(0, -1));

                    // Update table body
                    const tableBody = document.getElementById('user-markups-table-body');
                    if (tableBody && markups) {
                        tableBody.innerHTML = markups.map(markup => `
                            <tr>
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
                                        <button class="btn btn-outline btn-sm" onclick='app.editUserMarkup(${markup.id})'>
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-info btn-sm" onclick='app.viewUserMarkupHistory(${markup.userId})'>
                                            <i class="fas fa-history"></i>
                                        </button>
                                        <button class="btn ${markup.isActive ? 'btn-warning' : 'btn-success'} btn-sm"
                                                onclick='app.toggleUserMarkupStatus(${markup.id}, ${markup.isActive})'>
                                            <i class="fas fa-${markup.isActive ? 'ban' : 'check'}"></i>
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick='app.deleteUserMarkup(${markup.id})'>
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('');
                    }
                } catch (error) {
                    this.showToast('Ошибка фильтрации данных', 'error');
                }
            },

            async sortUserMarkups() {
                const sortBy = document.getElementById('user-markup-sort-filter').value;
                this.filterUserMarkups(); // Re-filter with new sorting
            },

            resetUserMarkupFilters() {
                document.getElementById('user-markup-search').value = '';
                document.getElementById('user-markup-status-filter').value = '';
                document.getElementById('user-markup-sort-filter').value = 'user';
                this.filterUserMarkups();
            },

            // Chart.js instance
            salesChart: null,

            // Update sales chart
            async updateSalesChart() {
                const period = document.getElementById('sales-period-filter')?.value || 'month';

                try {
                    const now = new Date();
                    const params = new URLSearchParams({
                        period: period,
                        year: now.getFullYear(),
                        month: now.getMonth() + 1,
                        week: 1
                    });

                    const chartData = await this.fetchApi(`analytics/sales/chart?${params.toString()}`);

                    console.log('Sales Chart Data:', chartData); // Debug

                    if (chartData) {
                        this.renderSalesChart(chartData);
                    } else {
                        console.warn('No chart data received');
                    }
                } catch (error) {
                    console.error('Error loading sales chart data:', error);
                }
            },

            // Render sales chart with Chart.js
            renderSalesChart(chartData) {
                const ctx = document.getElementById('sales-chart');
                if (!ctx) {
                    console.error('Canvas element not found');
                    return;
                }

                console.log('Rendering chart with data:', chartData);

                if (this.salesChart) {
                    this.salesChart.destroy();
                }

                this.salesChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.labels,
                        datasets: [{
                            label: 'Выручка',
                            data: chartData.data,
                            backgroundColor: 'rgba(0, 118, 86, 0.1)',
                            borderColor: 'rgba(0, 118, 86, 1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: 'rgba(0, 118, 86, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'var(--bg-card)',
                                titleColor: 'var(--text-main)',
                                bodyColor: 'var(--text-secondary)',
                                borderColor: 'var(--border)',
                                borderWidth: 1,
                                padding: 12,
                                callbacks: {
                                    label: (context) => `${context.parsed.y.toFixed(2)} BYN`
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)',
                                    drawBorder: false
                                },
                                ticks: {
                                    font: { family: 'Inter', size: 11 },
                                    color: 'var(--text-tertiary)',
                                    callback: (value) => value.toFixed(0) + ' BYN'
                                }
                            },
                            x: {
                                grid: { display: false },
                                ticks: {
                                    font: { family: 'Inter', size: 11 },
                                    color: 'var(--text-tertiary)'
                                }
                            }
                        }
                    }
                });

                console.log('Chart rendered successfully');
            },

            // Update popular products
            async updatePopularProducts() {
                const typeElement = document.getElementById('popular-products-type');
                if (!typeElement) {
                    console.warn('Popular products type selector not found');
                    return;
                }
                
                const type = typeElement.value;

                try {
                    const products = await this.fetchApi(`analytics/products/popular?type=${type}&limit=10`);

                    if (products && products.length > 0) {
                        this.renderPopularProductsChart(products, type);
                    }
                } catch (error) {
                    console.error('Error loading popular products:', error);
                }
            },

            renderPopularProductsChart(products, type) {
                const ctx = document.getElementById('popular-products-chart');
                if (!ctx) return;

                if (this.popularProductsChart) {
                    this.popularProductsChart.destroy();
                }

                const labels = products.map(p => p.productName.length > 20 ? p.productName.substring(0, 20) + '...' : p.productName);
                const data = type === 'revenue' 
                    ? products.map(p => p.totalRevenue) 
                    : products.map(p => p.totalSold);

                this.popularProductsChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: type === 'revenue' ? 'Выручка (BYN)' : 'Продано (шт)',
                            data: data,
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 2,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'var(--bg-card)',
                                titleColor: 'var(--text-main)',
                                bodyColor: 'var(--text-secondary)',
                                borderColor: 'var(--border)',
                                borderWidth: 1,
                                padding: 12
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: {
                                    font: { family: 'Inter', size: 11 },
                                    color: 'var(--text-tertiary)'
                                }
                            },
                            y: {
                                grid: { display: false },
                                ticks: {
                                    font: { family: 'Inter', size: 11 },
                                    color: 'var(--text-secondary)'
                                }
                            }
                        }
                    }
                });
            },

            // Update category stats
            async updateCategoryStats() {
                try {
                    const categories = await this.fetchApi('analytics/categories/stats');

                    if (categories && categories.length > 0) {
                        this.renderCategoryStatsChart(categories);
                    }
                } catch (error) {
                    console.error('Error loading category stats:', error);
                }
            },

            renderCategoryStatsChart(categories) {
                const ctx = document.getElementById('category-stats-chart');
                if (!ctx) return;

                if (this.categoryStatsChart) {
                    this.categoryStatsChart.destroy();
                }

                const labels = categories.map(c => c.categoryName);
                const data = categories.map(c => c.totalRevenue);

                this.categoryStatsChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: [
                                'rgba(0, 118, 86, 0.8)',
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(139, 92, 246, 0.8)',
                                'rgba(236, 72, 153, 0.8)',
                                'rgba(34, 197, 94, 0.8)'
                            ],
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    font: { family: 'Inter', size: 12 },
                                    color: 'var(--text-main)',
                                    padding: 12,
                                    boxWidth: 12,
                                    boxHeight: 12
                                }
                            },
                            tooltip: {
                                backgroundColor: 'var(--bg-card)',
                                titleColor: 'var(--text-main)',
                                bodyColor: 'var(--text-secondary)',
                                borderColor: 'var(--border)',
                                borderWidth: 1,
                                padding: 12,
                                callbacks: {
                                    label: function(context) {
                                        return `${context.label}: ${context.parsed.toFixed(2)} BYN`;
                                    }
                                }
                            }
                        }
                    }
                });
            },
            
            // ===== PRODUCT DETAIL PAGE =====
});