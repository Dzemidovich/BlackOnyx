// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Comparison view module
// Must be loaded after app.js, core/api.js, and modules/comparison.js
Object.assign(app, {
            async showComparisonView() {
                const contentArea = document.getElementById('content-mount');
                const productIds = ComparisonManager.getList();
                
                if (productIds.length === 0) {
                    contentArea.innerHTML = this.renderEmptyComparison();
                    return;
                }
                
                contentArea.innerHTML = '<div class="loading-spinner" style="display: flex; justify-content: center; align-items: center; height: 400px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary);"></i></div>';
                
                try {
                    // Fetch all products in parallel
                    const products = await Promise.all(
                        productIds.map(id => 
                            fetch(`${this.apiBaseUrl}/products/${id}`, {
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                            }).then(r => r.json())
                        )
                    );
                    
                    contentArea.innerHTML = this.renderComparisonView(products);
                    this.attachComparisonHandlers();
                } catch (error) {
                    contentArea.innerHTML = this.renderError('Не удалось загрузить товары для сравнения');
                }
            },
            
            renderComparisonView(products) {
                // Collect all unique attribute names
                const allAttributes = new Map();
                products.forEach(product => {
                    product.attributes?.forEach(attr => {
                        if (!allAttributes.has(attr.attrName)) {
                            allAttributes.set(attr.attrName, new Set());
                        }
                        allAttributes.get(attr.attrName).add(attr.attrValue);
                    });
                });
                
                // Check if prices are different
                const prices = products.map(p => p.price);
                const pricesDifferent = new Set(prices).size > 1;
                
                return `
                    <div class="comparison-container" style="max-width: 1400px; margin: 0 auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                            <h1 style="font-size: 2rem; font-weight: 700;">Сравнение товаров</h1>
                            <button class="btn btn-outline" onclick="ComparisonManager.clear(); app.nav('products');">
                                <i class="fas fa-times"></i> Очистить все
                            </button>
                        </div>
                        
                        <div style="overflow-x: auto;">
                            <table class="comparison-table" style="width: 100%; border-collapse: separate; border-spacing: 0;">
                                <!-- Product Headers -->
                                <thead>
                                    <tr>
                                        <th style="min-width: 200px; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md) 0 0 0; position: sticky; left: 0; z-index: 10;">
                                            <strong>Характеристика</strong>
                                        </th>
                                        ${products.map((product, index) => `
                                            <th style="min-width: 280px; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); ${index === products.length - 1 ? 'border-radius: 0 var(--radius-md) 0 0;' : ''}">
                                                <div style="text-align: center;">
                                                    <div style="width: 200px; height: 200px; margin: 0 auto 16px; background: var(--bg-page); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; padding: 16px;">
                                                        <img src="${product.imageUrl || '/img/placeholder.jpg'}" 
                                                             alt="${product.name}"
                                                             onerror="this.src='/img/placeholder.jpg'"
                                                             style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                                    </div>
                                                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 8px; cursor: pointer;" onclick="app.nav('product-${product.id}')">${product.name}</h3>
                                                    <p style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 12px;">${product.article}</p>
                                                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary); margin-bottom: 16px;">${product.price.toFixed(2)} BYN</div>
                                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                                        <button class="btn btn-primary btn-sm customer-only" 
                                                                data-action="add-to-cart" 
                                                                data-product-id="${product.id}"
                                                                ${product.stock <= 0 ? 'disabled' : ''}>
                                                            <i class="fas fa-shopping-cart"></i> В корзину
                                                        </button>
                                                        <button class="btn btn-outline btn-sm" 
                                                                data-action="remove" 
                                                                data-product-id="${product.id}">
                                                            <i class="fas fa-times"></i> Удалить
                                                        </button>
                                                    </div>
                                                </div>
                                            </th>
                                        `).join('')}
                                    </tr>
                                </thead>
                                
                                <!-- Basic Info -->
                                <tbody>
                                    <!-- Price Row -->
                                    <tr style="${pricesDifferent ? 'background: var(--warning-light);' : ''}">
                                        <td style="padding: 16px 24px; background: var(--bg-card); border: 1px solid var(--border); font-weight: ${pricesDifferent ? '600' : '500'}; position: sticky; left: 0; z-index: 10;">Цена</td>
                                        ${products.map(product => `
                                            <td style="padding: 16px 24px; background: var(--bg-card); border: 1px solid var(--border); text-align: center; font-weight: ${pricesDifferent ? '700' : '600'}; color: var(--primary); font-size: 1.1rem;">
                                                ${product.price.toFixed(2)} BYN
                                            </td>
                                        `).join('')}
                                    </tr>
                                    
                                    <!-- Stock Row -->
                                    <tr>
                                        <td style="padding: 16px 24px; background: var(--bg-card); border: 1px solid var(--border); font-weight: 600; position: sticky; left: 0; z-index: 10;">Наличие</td>
                                        ${products.map(product => `
                                            <td style="padding: 16px 24px; background: var(--bg-card); border: 1px solid var(--border); text-align: center; color: ${product.stock > 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                                                ${product.stock > 0 ? `В наличии (${product.stock} шт.)` : 'Нет в наличии'}
                                            </td>
                                        `).join('')}
                                    </tr>
                                    
                                    <!-- Attributes -->
                                    ${Array.from(allAttributes.entries()).map(([attrName, values]) => {
                                        const isDifferent = values.size > 1;
                                        return `
                                            <tr style="${isDifferent ? 'background: var(--warning-light);' : ''}">
                                                <td style="padding: 16px 24px; background: var(--bg-card); border: 1px solid var(--border); font-weight: ${isDifferent ? '600' : '500'}; position: sticky; left: 0; z-index: 10;">${attrName}</td>
                                                ${products.map(product => {
                                                    const attr = product.attributes?.find(a => a.attrName === attrName);
                                                    return `<td style="padding: 16px 24px; background: var(--bg-card); border: 1px solid var(--border); text-align: center; font-weight: ${isDifferent ? '600' : 'normal'};">${attr ? attr.attrValue : '—'}</td>`;
                                                }).join('')}
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            },
            
            renderEmptyComparison() {
                return `
                    <div class="empty-state" style="padding: 80px 20px; text-align: center;">
                        <i class="fas fa-balance-scale" style="font-size: 4rem; color: var(--text-light); margin-bottom: 24px;"></i>
                        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 12px;">Список сравнения пуст</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 24px;">Добавьте товары для сравнения, чтобы увидеть их характеристики рядом</p>
                        <button class="btn btn-primary" onclick="app.nav('products')">
                            <i class="fas fa-arrow-left"></i> Перейти в каталог
                        </button>
                    </div>
                `;
            },
            
            attachComparisonHandlers() {
                // Add to cart handlers
                const addToCartButtons = document.querySelectorAll('[data-action="add-to-cart"]');
                console.log('Found add-to-cart buttons:', addToCartButtons.length);
                
                addToCartButtons.forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const productId = parseInt(btn.dataset.productId);
                        console.log('Adding to cart:', productId);
                        await this.addToCart(productId);
                    });
                });
                
                // Remove from comparison handlers
                const removeButtons = document.querySelectorAll('[data-action="remove"]');
                console.log('Found remove buttons:', removeButtons.length);
                
                removeButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const productId = parseInt(btn.dataset.productId);
                        console.log('Removing from comparison:', productId);
                        ComparisonManager.remove(productId);
                        this.showComparisonView(); // Re-render
                    });
                });
            },
            
            // Toggle product in comparison
            toggleComparison(productId) {
                if (ComparisonManager.has(productId)) {
                    ComparisonManager.remove(productId);
                    this.showToast('Товар удален из сравнения', 'info');
                } else {
                    const result = ComparisonManager.add(productId);
                    if (result.success) {
                        this.showToast('Товар добавлен к сравнению', 'success');
                    } else if (result.reason === 'max_reached') {
                        this.showToast('Максимум 4 товара для сравнения', 'warning');
                    }
                }
                // Re-render current view to update button states
                if (this.currentPage === 'products' || this.currentPage === 'dashboard') {
                    this.nav(this.currentPage);
                }
            },
            
            // Update category margin
            async updateCategoryMargin() {
                const container = document.getElementById('category-margin-container');
                if (container) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="empty-state-title">Маржинальность по категориям</div>
                            <div class="empty-state-description">Данные о маржинальности скоро будут доступны</div>
                        </div>
                    `;
                }
            },
            // Update product margin
            async updateProductMargin() {
                const container = document.getElementById('product-margin-container');
                if (container) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-box"></i>
                            </div>
                            <div class="empty-state-title">Маржинальность товаров</div>
                            <div class="empty-state-description">Данные о маржинальности товаров скоро будут доступны</div>
                        </div>
                    `;
                }
            },

            // Show toast notification
});