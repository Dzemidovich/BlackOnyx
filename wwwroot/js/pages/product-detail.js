// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Product detail page module
// Must be loaded after app.js and core/api.js
Object.assign(app, {
            async showProductDetail(productId) {
                const contentArea = document.getElementById('content-mount');
                contentArea.innerHTML = '<div class="loading-spinner" style="display: flex; justify-content: center; align-items: center; height: 400px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary);"></i></div>';
                
                try {
                    const response = await fetch(`${this.apiBaseUrl}/products/${productId}/details`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    
                    if (!response.ok) {
                        if (response.status === 404) {
                            contentArea.innerHTML = this.renderProductNotFound();
                            return;
                        }
                        throw new Error('Failed to load product');
                    }
                    
                    const data = await response.json();
                    
                    // Add to recently viewed
                    this.addToRecentlyViewed(data.product);
                    
                    contentArea.innerHTML = this.renderProductDetail(data);
                    this.attachProductDetailHandlers(data.product);
                } catch (error) {
                    console.error('Error in showProductDetail:', error);
                    contentArea.innerHTML = this.renderError('Не удалось загрузить товар');
                }
            },
            
            renderProductDetail(data) {
                const { product, relatedProducts, breadcrumb } = data;
                console.log('=== PRODUCT DETAIL RENDER ===');
                console.log('Product:', product);
                console.log('Related Products:', relatedProducts);
                console.log('Related Products Count:', relatedProducts?.length);
                console.log('Breadcrumb:', breadcrumb);
                
                const isInComparison = ComparisonManager.has(product.id);
                const isAvailable = product.stock > 0;
                const isInFavorites = this.favorites.includes(product.id);
                
                return `
                    <div class="product-detail-container" style="max-width: 1200px; margin: 0 auto;">
                        <!-- Breadcrumb -->
                        <nav class="breadcrumb-nav" style="margin-bottom: 16px; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-tertiary);">
                            <a href="#" onclick="app.nav('products'); return false;" style="color: var(--text-tertiary); text-decoration: none;">Каталог</a>
                            ${breadcrumb.map(item => `
                                <span style="color: var(--text-light);">›</span>
                                <a href="#" onclick="app.showCategoryProducts(${item.id}); return false;" style="color: var(--text-tertiary); text-decoration: none;">${item.name}</a>
                            `).join('')}
                            <span style="color: var(--text-light);">›</span>
                            <span style="color: var(--text-main); font-weight: 500;">${product.name}</span>
                        </nav>
                        
                        <!-- Main Product Section -->
                        <div class="product-detail-main" style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
                            <!-- Product Image -->
                            <div class="product-detail-image" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; display: flex; align-items: center; justify-content: center;">
                                <img src="${product.imageUrl || '/img/placeholder.jpg'}" 
                                     alt="${product.name}"
                                     onerror="this.src='/img/placeholder.jpg'"
                                     style="max-width: 100%; max-height: 350px; object-fit: contain;">
                            </div>
                            
                            <!-- Product Info -->
                            <div class="product-detail-info">
                                <div class="product-detail-header" style="margin-bottom: 16px;">
                                    <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">${product.name}</h1>
                                    <p style="font-size: 0.8rem; color: var(--text-tertiary);">Артикул: ${product.article}</p>
                                </div>
                                
                                <!-- Price -->
                                <div style="font-size: 2rem; font-weight: 800; color: var(--primary); margin-bottom: 16px;">
                                    ${app.getPriceDisplay ? app.getPriceDisplay(product.price) : product.price.toFixed(2) + ' BYN'}
                                </div>
                                
                                <!-- Availability -->
                                <div style="margin-bottom: 16px;">
                                    ${isAvailable 
                                        ? `<span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--success-light); color: var(--success); border-radius: var(--radius-md); font-weight: 600; font-size: 0.875rem;">
                                            <i class="fas fa-check-circle"></i> В наличии (${product.stock} шт.)
                                           </span>`
                                        : `<span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--danger-light); color: var(--danger); border-radius: var(--radius-md); font-weight: 600; font-size: 0.875rem;">
                                            <i class="fas fa-times-circle"></i> Нет в наличии
                                           </span>`
                                    }
                                </div>
                                
                                <!-- Description -->
                                ${product.description ? `
                                    <div style="margin-bottom: 24px;">
                                        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 8px;">Описание</h3>
                                        <p style="color: var(--text-secondary); line-height: 1.5; font-size: 0.9rem;">${product.description}</p>
                                    </div>
                                ` : ''}
                                
                                <!-- Actions -->
                                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                    <button class="btn btn-primary" 
                                            data-action="add-to-cart"
                                            ${!isAvailable ? 'disabled' : ''}
                                            style="flex: 1; min-width: 180px;">
                                        <i class="fas fa-shopping-cart"></i>
                                        ${isAvailable ? 'Добавить в корзину' : 'Нет в наличии'}
                                    </button>
                                    <button class="btn btn-outline customer-only" 
                                            data-action="toggle-favorite"
                                            style="min-width: 48px;">
                                        <i class="fas fa-heart ${isInFavorites ? 'text-danger' : ''}"></i>
                                    </button>
                                    <button class="btn btn-outline" 
                                            data-action="toggle-comparison"
                                            style="min-width: 48px;">
                                        <i class="fas fa-balance-scale ${isInComparison ? 'text-primary' : ''}"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Specifications -->
                        ${product.attributes && product.attributes.length > 0 ? `
                            <div class="product-specifications card" style="margin-bottom: 32px;">
                                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px;">Технические характеристики</h2>
                                <div class="specifications-table">
                                    ${product.attributes.map((attr, index) => `
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 12px; background: ${index % 2 === 0 ? 'var(--bg-page)' : 'transparent'}; border-radius: var(--radius-md);">
                                            <div style="font-weight: 500; color: var(--text-secondary); font-size: 0.9rem;">${attr.attrName}</div>
                                            <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">${attr.attrValue}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Related Products ВНИЗУ -->
                        ${relatedProducts && relatedProducts.length > 0 ? `
                            <div class="related-products-section" style="margin-top: 48px;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                                    <i class="fas fa-shopping-basket" style="font-size: 1.5rem; color: var(--primary);"></i>
                                    <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0;">С этим товаром часто покупают</h2>
                                </div>
                                <div class="related-products-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;">
                                    ${relatedProducts.map(p => this.renderRelatedProductCard(p)).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            },
            
            renderSidebarProductCard(product) {
                const isAvailable = product.stock > 0;
                return `
                    <div class="sidebar-product-card" style="display: flex; gap: 12px; padding: 12px; background: var(--bg-page); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s; border: 1px solid transparent;" onclick="app.showProductDetail(${product.id})" onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateX(4px)'" onmouseout="this.style.borderColor='transparent'; this.style.transform='translateX(0)'">
                        <div style="width: 80px; height: 80px; flex-shrink: 0; background: white; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; padding: 8px;">
                            <img src="${product.imageUrl || '/img/placeholder.jpg'}" 
                                 alt="${product.name}"
                                 onerror="this.src='/img/placeholder.jpg'"
                                 style="max-width: 100%; max-height: 100%; object-fit: contain;">
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
                            <h4 style="font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: var(--text-main); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${product.name}</h4>
                            <p style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 6px;">Арт: ${product.article}</p>
                            <div style="margin-top: auto;">
                                <div style="font-size: 1rem; font-weight: 700; color: var(--primary); margin-bottom: 6px;">${app.getPriceDisplay ? app.getPriceDisplay(product.price) : product.price.toFixed(2) + ' BYN'}</div>
                                ${isAvailable && this.currentUser?.role === 'Customer' ? `
                                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.addToCart(${product.id})" style="width: 100%; padding: 4px; font-size: 0.75rem;">
                                        <i class="fas fa-cart-plus"></i> В корзину
                                    </button>
                                ` : !isAvailable ? `
                                    <span style="font-size: 0.7rem; color: var(--danger); font-weight: 600;">Нет в наличии</span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            },
            
            renderRelatedProductCard(product) {
                const isInFavorites = this.favorites.includes(product.id);
                const isAvailable = product.stock > 0;
                return `
                    <div class="product-card card" style="cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; height: 100%; position: relative;" onclick="app.showProductDetail(${product.id})">
                        ${!isAvailable ? '<div style="position: absolute; top: 8px; left: 8px; background: var(--danger); color: white; padding: 4px 8px; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 600; z-index: 1;">Нет в наличии</div>' : ''}
                        <div style="position: relative; padding-bottom: 100%; overflow: hidden; border-radius: var(--radius-md); background: var(--bg-page);">
                            <img src="${product.imageUrl || '/img/placeholder.jpg'}" 
                                 alt="${product.name}"
                                 onerror="this.src='/img/placeholder.jpg'"
                                 style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; padding: 12px;">
                        </div>
                        <div style="padding: 12px; flex: 1; display: flex; flex-direction: column;">
                            <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main); line-height: 1.3; min-height: 2.6em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${product.name}</h4>
                            <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">Арт: ${product.article}</p>
                            <div style="margin-top: auto;">
                                <div style="font-size: 1.1rem; font-weight: 700; color: var(--primary); margin-bottom: 8px;">${app.getPriceDisplay ? app.getPriceDisplay(product.price) : product.price.toFixed(2) + ' BYN'}</div>
                                ${isAvailable && this.currentUser?.role === 'Customer' ? `
                                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.addToCart(${product.id})" style="width: 100%; padding: 6px; font-size: 0.8rem;">
                                        <i class="fas fa-cart-plus"></i> В корзину
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            },
            
            renderProductNotFound() {
                return `
                    <div class="empty-state" style="padding: 80px 20px; text-align: center;">
                        <i class="fas fa-box-open" style="font-size: 4rem; color: var(--text-light); margin-bottom: 24px;"></i>
                        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 12px;">Товар не найден</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 24px;">Запрошенный товар не существует или был удален</p>
                        <button class="btn btn-primary" onclick="app.nav('products')">
                            <i class="fas fa-arrow-left"></i> Вернуться в каталог
                        </button>
                    </div>
                `;
            },
            
            renderError(message) {
                return `
                    <div class="empty-state" style="padding: 80px 20px; text-align: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--danger); margin-bottom: 24px;"></i>
                        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 12px;">Ошибка</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 24px;">${message}</p>
                        <button class="btn btn-primary" onclick="app.nav('products')">
                            <i class="fas fa-arrow-left"></i> Вернуться в каталог
                        </button>
                    </div>
                `;
            },

            renderCategoriesList() {
                if (!this.categories || this.categories.length === 0) {
                    return '<div style="padding: 16px; color: var(--text-secondary); text-align: center;">Категории не загружены</div>';
                }

                const selectedCategoryId = document.getElementById('filter-category')?.value || '';
                
                // Build category tree
                const rootCategories = this.categories.filter(c => !c.parentId);
                
                const renderCategory = (category, level = 0) => {
                    const isSelected = selectedCategoryId == category.id;
                    const hasChildren = this.categories.some(c => c.parentId === category.id);
                    const productCount = this.products.filter(p => p.categoryId === category.id).length;
                    
                    let html = `
                        <div class="category-item" style="
                            padding: 10px 16px 10px ${16 + level * 20}px;
                            cursor: pointer;
                            border-bottom: 1px solid var(--border-color);
                            background: ${isSelected ? 'var(--primary-light)' : 'transparent'};
                            transition: background 0.2s;
                        " 
                        onclick="app.selectCategory(${category.id})"
                        onmouseover="this.style.background='var(--hover-bg)'"
                        onmouseout="this.style.background='${isSelected ? 'var(--primary-light)' : 'transparent'}'">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                                    ${hasChildren ? '<i class="fas fa-folder" style="font-size: 0.85rem; color: var(--primary);"></i>' : '<i class="fas fa-tag" style="font-size: 0.75rem; color: var(--text-light);"></i>'}
                                    <span style="font-size: 0.9rem; font-weight: ${isSelected ? '600' : '400'}; color: ${isSelected ? 'var(--primary)' : 'var(--text-primary)'};">
                                        ${category.name}
                                    </span>
                                </div>
                                ${productCount > 0 ? `<span style="font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-secondary); padding: 2px 8px; border-radius: 12px;">${productCount}</span>` : ''}
                            </div>
                        </div>
                    `;
                    
                    // Render children
                    if (hasChildren) {
                        const children = this.categories.filter(c => c.parentId === category.id);
                        children.forEach(child => {
                            html += renderCategory(child, level + 1);
                        });
                    }
                    
                    return html;
                };
                
                let html = `
                    <div class="category-item" style="
                        padding: 10px 16px;
                        cursor: pointer;
                        border-bottom: 1px solid var(--border-color);
                        background: ${!selectedCategoryId ? 'var(--primary-light)' : 'transparent'};
                        transition: background 0.2s;
                    " 
                    onclick="app.selectCategory(null)"
                    onmouseover="this.style.background='var(--hover-bg)'"
                    onmouseout="this.style.background='${!selectedCategoryId ? 'var(--primary-light)' : 'transparent'}'">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-th" style="font-size: 0.85rem; color: var(--primary);"></i>
                            <span style="font-size: 0.9rem; font-weight: ${!selectedCategoryId ? '600' : '400'}; color: ${!selectedCategoryId ? 'var(--primary)' : 'var(--text-primary)'};">
                                Все категории
                            </span>
                        </div>
                    </div>
                `;
                
                rootCategories.forEach(category => {
                    html += renderCategory(category, 0);
                });
                
                return html;
            },

            selectCategory(categoryId) {
                const categorySelect = document.getElementById('filter-category');
                if (categorySelect) {
                    categorySelect.value = categoryId || '';
                    this.applyFilters();
                }
            },
            
            attachProductDetailHandlers(product) {
                // Add to cart handler
                const addToCartBtn = document.querySelector('[data-action="add-to-cart"]');
                if (addToCartBtn) {
                    addToCartBtn.addEventListener('click', async () => {
                        await this.addToCart(product.id);
                    });
                }
                
                // Toggle favorite handler
                const toggleFavoriteBtn = document.querySelector('[data-action="toggle-favorite"]');
                if (toggleFavoriteBtn) {
                    toggleFavoriteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        await this.toggleFavorite(product.id);
                        this.showProductDetail(product.id); // Re-render
                    });
                }
                
                // Toggle comparison handler
                const toggleComparisonBtn = document.querySelector('[data-action="toggle-comparison"]');
                if (toggleComparisonBtn) {
                    toggleComparisonBtn.addEventListener('click', () => {
                        if (ComparisonManager.has(product.id)) {
                            ComparisonManager.remove(product.id);
                            this.showToast('Товар удален из сравнения', 'info');
                        } else {
                            const result = ComparisonManager.add(product.id);
                            if (result.success) {
                                this.showToast('Товар добавлен к сравнению', 'success');
                            } else if (result.reason === 'max_reached') {
                                this.showToast('Максимум 4 товара для сравнения', 'warning');
                            }
                        }
                        this.showProductDetail(product.id); // Re-render
                    });
                }
            },
            
            // ===== COMPARISON VIEW =====
});