// Reports Page Module
const ReportsPage = {
    currentData: {
        summary: null,
        details: [],
        topProducts: []
    },
    currentPage: 1,
    itemsPerPage: 20,
    filteredData: [],

    async init() {
        console.log('Initializing Reports Page...');
        
        // Set default date range (last 30 days)
        this.setDefaultDateRange();
        
        // Attach event listeners
        this.attachEventListeners();
        
        // Load initial data
        await this.loadReportsData();
    },

    setDefaultDateRange() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        document.getElementById('start-date').valueAsDate = startDate;
        document.getElementById('end-date').valueAsDate = endDate;
    },

    attachEventListeners() {
        // Date range controls
        document.getElementById('apply-date-range')?.addEventListener('click', () => {
            this.loadReportsData();
        });
        
        document.getElementById('reset-date-range')?.addEventListener('click', () => {
            this.setDefaultDateRange();
            this.loadReportsData();
        });
        
        // Export CSV
        document.getElementById('export-csv-btn')?.addEventListener('click', () => {
            this.exportCSV();
        });
        
        // Search
        document.getElementById('search-orders')?.addEventListener('input', (e) => {
            this.filterOrders(e.target.value);
        });
        
        // Sort
        document.getElementById('sort-by')?.addEventListener('change', (e) => {
            this.sortOrders(e.target.value);
        });
    },

    async loadReportsData() {
        try {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            if (!startDate || !endDate) {
                app.showNotification('Пожалуйста, выберите даты', 'warning');
                return;
            }
            
            // Show loading state
            this.showLoading();
            
            // Fetch all data in parallel
            const [summary, details, topProducts] = await Promise.all([
                this.fetchSalesSummary(startDate, endDate),
                this.fetchSalesDetails(startDate, endDate),
                this.fetchTopProducts(startDate, endDate)
            ]);
            
            this.currentData.summary = summary;
            this.currentData.details = details;
            this.currentData.topProducts = topProducts;
            this.filteredData = [...details];
            
            // Render all sections
            this.renderSummary(summary);
            this.renderOrdersTable(details);
            this.renderTopProducts(topProducts);
            
        } catch (error) {
            console.error('Error loading reports data:', error);
            app.showNotification('Ошибка загрузки данных отчета', 'error');
        }
    },

    async fetchSalesSummary(startDate, endDate) {
        const response = await fetch(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch sales summary');
        return await response.json();
    },

    async fetchSalesDetails(startDate, endDate) {
        const response = await fetch(`/api/reports/sales/details?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch sales details');
        return await response.json();
    },

    async fetchTopProducts(startDate, endDate, limit = 10) {
        const response = await fetch(`/api/reports/products/top?startDate=${startDate}&endDate=${endDate}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch top products');
        return await response.json();
    },

    showLoading() {
        document.getElementById('total-revenue').textContent = 'Загрузка...';
        document.getElementById('order-count').textContent = 'Загрузка...';
        document.getElementById('average-order').textContent = 'Загрузка...';
        document.getElementById('top-product').textContent = 'Загрузка...';
        
        const tbody = document.getElementById('orders-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Загрузка данных...</td></tr>';
        }
    },

    renderSummary(summary) {
        document.getElementById('total-revenue').textContent = 
            `${summary.totalRevenue.toFixed(2)} BYN`;
        
        document.getElementById('order-count').textContent = summary.orderCount;
        document.getElementById('completed-count').textContent = 
            `Завершено: ${summary.completedOrderCount}`;
        
        document.getElementById('average-order').textContent = 
            `${summary.averageOrderValue.toFixed(2)} BYN`;
        
        document.getElementById('top-product').textContent = 
            summary.topProductName || 'Нет данных';
        document.getElementById('top-product-stats').textContent = 
            summary.topProductQuantity > 0 
                ? `${summary.topProductQuantity} шт. / ${summary.topProductRevenue.toFixed(2)} BYN`
                : '-';
    },

    renderOrdersTable(orders) {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Нет данных за выбранный период</td></tr>';
            return;
        }
        
        // Pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedOrders = orders.slice(startIndex, endIndex);
        
        tbody.innerHTML = paginatedOrders.map(order => {
            const date = new Date(order.orderDate);
            const formattedDate = date.toLocaleDateString('ru-RU');
            const customerType = order.isLegalEntity ? 'B2B' : 'B2C';
            const customerDisplay = order.isLegalEntity && order.companyName 
                ? order.companyName 
                : order.customerName;
            
            const statusClass = this.getStatusClass(order.status);
            
            return `
                <tr>
                    <td>#${order.orderId}</td>
                    <td>${formattedDate}</td>
                    <td>
                        <div class="customer-info">
                            <div class="customer-name">${customerDisplay}</div>
                            <div class="customer-email">${order.customerEmail}</div>
                        </div>
                    </td>
                    <td><span class="badge badge-${customerType.toLowerCase()}">${customerType}</span></td>
                    <td>${order.itemsCount}</td>
                    <td class="amount">${order.totalAmount.toFixed(2)} BYN</td>
                    <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                </tr>
            `;
        }).join('');
        
        this.renderPagination(orders.length);
    },

    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationEl = document.getElementById('pagination');
        
        if (!paginationEl || totalPages <= 1) {
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }
        
        let html = '<div class="pagination-controls">';
        
        // Previous button
        html += `<button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="ReportsPage.goToPage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>`;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="ReportsPage.goToPage(${i})">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }
        
        // Next button
        html += `<button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="ReportsPage.goToPage(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>`;
        
        html += '</div>';
        paginationEl.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.renderOrdersTable(this.filteredData);
    },

    renderTopProducts(products) {
        const container = document.getElementById('top-products-list');
        if (!container) return;
        
        if (products.length === 0) {
            container.innerHTML = '<div class="no-data-message">Нет данных за выбранный период</div>';
            return;
        }
        
        container.innerHTML = products.map((product, index) => `
            <div class="top-product-card">
                <div class="product-rank">#${index + 1}</div>
                <div class="product-image">
                    <img src="${product.imageUrl || '/img/placeholder.jpg'}" 
                         alt="${product.productName}"
                         onerror="this.src='/img/placeholder.jpg'">
                </div>
                <div class="product-info">
                    <div class="product-name">${product.productName}</div>
                    <div class="product-article">${product.article}</div>
                </div>
                <div class="product-stats">
                    <div class="stat">
                        <span class="stat-label">Продано:</span>
                        <span class="stat-value">${product.totalQuantitySold} шт.</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Выручка:</span>
                        <span class="stat-value">${product.totalRevenue.toFixed(2)} BYN</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Заказов:</span>
                        <span class="stat-value">${product.orderCount}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    filterOrders(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.filteredData = [...this.currentData.details];
        } else {
            this.filteredData = this.currentData.details.filter(order => 
                order.customerName.toLowerCase().includes(term) ||
                order.customerEmail.toLowerCase().includes(term) ||
                (order.companyName && order.companyName.toLowerCase().includes(term))
            );
        }
        
        this.currentPage = 1;
        this.renderOrdersTable(this.filteredData);
    },

    sortOrders(sortBy) {
        const sortFunctions = {
            'date-desc': (a, b) => new Date(b.orderDate) - new Date(a.orderDate),
            'date-asc': (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
            'amount-desc': (a, b) => b.totalAmount - a.totalAmount,
            'amount-asc': (a, b) => a.totalAmount - b.totalAmount
        };
        
        const sortFn = sortFunctions[sortBy];
        if (sortFn) {
            this.filteredData.sort(sortFn);
            this.currentPage = 1;
            this.renderOrdersTable(this.filteredData);
        }
    },

    getStatusClass(status) {
        const statusMap = {
            'Новый': 'status-new',
            'В обработке': 'status-processing',
            'Завершен': 'status-completed',
            'Отменен': 'status-cancelled'
        };
        return statusMap[status] || 'status-default';
    },

    async exportCSV() {
        try {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            if (!startDate || !endDate) {
                app.showNotification('Пожалуйста, выберите даты', 'warning');
                return;
            }
            
            const response = await fetch(
                `/api/reports/sales/export?startDate=${startDate}&endDate=${endDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (!response.ok) throw new Error('Failed to export CSV');
            
            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales_report_${startDate}_to_${endDate}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            app.showNotification('Отчет успешно экспортирован', 'success');
            
        } catch (error) {
            console.error('Error exporting CSV:', error);
            app.showNotification('Ошибка экспорта отчета', 'error');
        }
    }
};

// Initialize when page loads
if (typeof app !== 'undefined') {
    app.on('page:reports', () => {
        ReportsPage.init();
    });
}
