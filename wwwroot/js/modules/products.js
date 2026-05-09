// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Products module - categories, products loading, favorites, dashboard, search, rendering
// Must be loaded after app.js and core/api.js
Object.assign(app, {
            async loadCategories() {
                console.log('Загрузка категорий...');
                const data = await this.fetchApi('categories');
                if (data) {
                    this.categories = data;
                    console.log(`Загружено ${this.categories.length} категорий`);
                }
            },

            // Show products in specific category
            async showCategoryProducts(categoryId) {
                // Navigate to products page
                this.nav('products');

                // Set category filter
                const categorySelect = document.getElementById('filter-category');
                if (categorySelect) {
                    // Ensure filters are loaded
                    if (categorySelect.options.length <= 1) {
                        await this.loadFilters();
                    }
                    categorySelect.value = categoryId;
                }

                // Apply filters to load products in this category
                await this.applyFilters();

                // Show toast message
                const category = this.categories.find(c => c.id === categoryId);
                if (category) {
                    this.showToast(`Показаны товары категории: ${category.name}`, 'info');
                }
            },

            // Search categories by name
            searchCategories(query) {
                if (!query) {
                    return this.categories.filter(category => !category.parentId);
                }

                const searchQuery = query.toLowerCase();
                return this.categories.filter(category => {
                    return !category.parentId && category.name.toLowerCase().includes(searchQuery);
                });
            },

            // Get category by ID
            getCategoryById(categoryId) {
                return this.categories.find(category => category.id === categoryId);
            },

            // Get all products in a category (including subcategories)
            getProductsInCategory(categoryId) {
                const categoryIds = this.getAllSubcategoryIds(categoryId);
                return this.products.filter(product =>
                    product.categoryId && categoryIds.includes(product.categoryId)
                );
            },

            // Helper to get all subcategory IDs recursively
            getAllSubcategoryIds(parentId) {
                let ids = [parentId];
                const children = this.categories.filter(c => c.parentId === parentId);
                children.forEach(child => {
                    ids = [...ids, ...this.getAllSubcategoryIds(child.id)];
                });
                return ids;
            },

            // Get category tree structure
            getCategoryTree() {
                const rootCategories = this.categories.filter(category => !category.parentId);
                return rootCategories.map(category => {
                    return {
                        ...category,
                        children: this.categories.filter(c => c.parentId === category.id)
                    };
                });
            },

            // Debounced category search
            debouncedSearchCategories() {
                clearTimeout(this.categorySearchTimeout);
                this.categorySearchTimeout = setTimeout(() => {
                    const searchQuery = document.getElementById('category-search').value.trim();
                    this.searchCategoriesAndUpdateUI(searchQuery);
                }, 300);
            },

            // Search categories and update UI
            searchCategoriesAndUpdateUI(query) {
                const categoriesGrid = document.getElementById('categories-grid');
                const noCategoriesFound = document.getElementById('no-categories-found');

                const filteredCategories = this.searchCategories(query);

                if (filteredCategories.length === 0) {
                    categoriesGrid.style.display = 'none';
                    noCategoriesFound.style.display = 'block';
                    return;
                }

                categoriesGrid.style.display = 'grid';
                noCategoriesFound.style.display = 'none';

                // Render filtered categories
                categoriesGrid.innerHTML = filteredCategories.map(category => {
                    const categoryProducts = this.getProductsInCategory(category.id);

                    let icon = 'fa-cubes';
                    const categoryName = category.name.toLowerCase();
                    if (categoryName.includes('электро')) {
                        icon = 'fa-bolt';
                    } else if (categoryName.includes('ручной')) {
                        icon = 'fa-hammer';
                    } else if (categoryName.includes('свароч')) {
                        icon = 'fa-wrench';
                    } else if (categoryName.includes('компрессор')) {
                        icon = 'fa-wind';
                    } else if (categoryName.includes('инструмент')) {
                        icon = 'fa-tools';
                    } else if (categoryName.includes('бытов')) {
                        icon = 'fa-home';
                    } else if (categoryName.includes('профессион')) {
                        icon = 'fa-industry';
                    } else if (categoryName.includes('аксессуар')) {
                        icon = 'fa-cogs';
                    }

                    return `
                        <div class="category-card" onclick='app.showCategoryProducts(${category.id})'>
                            <div class="category-icon">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="category-info">
                                <div class="category-name">${category.name}</div>
                                <div class="category-product-count">${categoryProducts.length} товаров</div>
                            </div>
                            <div class="category-action">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                        </div>
                    `;
                }).join('');
            },

            async loadProducts(updateUI = true) {
                console.log('Загрузка товаров...');
                
                // Если уже загружали и товаров нет — не загружаем снова
                if (this._productsLoaded && this.products.length === 0) {
                    console.log('Товары уже загружались, но их нет — пропускаем');
                    return;
                }

                // Build query parameters from current filters
                const params = new URLSearchParams();

                const search = document.getElementById('filter-search')?.value?.trim();
                if (search) params.append('search', search);

                const categoryId = document.getElementById('filter-category')?.value;
                if (categoryId) params.append('categoryId', categoryId);

                const minPrice = document.getElementById('filter-min-price')?.value;
                if (minPrice) params.append('minPrice', minPrice);

                const maxPrice = document.getElementById('filter-max-price')?.value;
                if (maxPrice) params.append('maxPrice', maxPrice);

                const inStock = document.getElementById('filter-in-stock')?.checked;
                if (inStock) params.append('inStock', 'true');

                // Sorting parameters
                const sortSelect = document.getElementById('sort-select');
                const sortDirection = this.sortDirection || 'asc';
                if (sortSelect && sortSelect.value) {
                    params.append('sortBy', sortSelect.value);
                    params.append('sortDirection', sortDirection);
                }
                
                // Pagination parameters
                // When searching, use larger page size to show all results
                if (search) {
                    params.append('page', 1);
                    params.append('pageSize', 10000); // Large number to get all search results
                } else {
                    params.append('page', this.currentProductPage);
                    params.append('pageSize', this.productsPerPage);
                }

                // Collect selected attributes
                const attributeCheckboxes = document.querySelectorAll('#attributes-filters input[type="checkbox"]:checked');
                const selectedAttributes = [];
                attributeCheckboxes.forEach(cb => {
                    const attrName = cb.dataset.attrName;
                    const attrValue = cb.dataset.attrValue;
                    selectedAttributes.push(`${attrName}:${attrValue}`);
                });
                if (selectedAttributes.length > 0) {
                    params.append('attributes', selectedAttributes.join(','));
                }

                const queryString = params.toString();
                const endpoint = queryString ? `products?${queryString}` : 'products';

                const response = await fetch(`${this.apiBaseUrl}/${endpoint}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (!response.ok) {
                    console.error('Ошибка загрузки товаров:', response.status, response.statusText);
                    this._productsLoading = false;
                    this._productsLoaded = true; // Помечаем как "загружено" даже с ошибкой
                    return;
                }
                
                const data = await response.json();
                this.products = data;
                
                // Get pagination info from headers
                this.totalProducts = parseInt(response.headers.get('X-Total-Count') || '0');
                this.totalPages = parseInt(response.headers.get('X-Total-Pages') || '1');
                
                console.log(`Загружено ${this.products.length} товаров (страница ${this.currentProductPage} из ${this.totalPages})`);

                // Update results count
                const resultsCount = document.getElementById('results-count');
                if (resultsCount) {
                    resultsCount.textContent = `${this.totalProducts} товаров`;
                }

                // Update UI if requested
                if (updateUI && this.currentPage === 'products') {
                    const content = document.getElementById('content-mount');
                    const productsHTML = this.renderProducts();
                    content.innerHTML = productsHTML;
                }
                
                // Mark loading as complete
                this._productsLoading = false;
                this._productsLoaded = true;
            },
            
            // Pagination methods
            goToPage(page) {
                if (page < 1 || page > this.totalPages) return;
                
                // Показываем индикатор загрузки
                const catalogContent = document.getElementById('catalog-content');
                if (catalogContent) {
                    catalogContent.style.opacity = '0.5';
                    catalogContent.style.pointerEvents = 'none';
                }
                
                this.currentProductPage = page;
                this.loadProducts(true).finally(() => {
                    // Убираем индикатор загрузки
                    if (catalogContent) {
                        catalogContent.style.opacity = '1';
                        catalogContent.style.pointerEvents = 'auto';
                    }
                    // Прокручиваем наверх
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            },
            
            nextPage() {
                if (this.currentProductPage < this.totalPages) {
                    this.currentProductPage++;
                    this.goToPage(this.currentProductPage);
                }
            },
            
            prevPage() {
                if (this.currentProductPage > 1) {
                    this.currentProductPage--;
                    this.goToPage(this.currentProductPage);
                }
            },

            loadFavorites() {
                try {
                    const stored = localStorage.getItem('favorites');
                    this.favorites = stored ? JSON.parse(stored) : [];
                    this.updateFavoritesBadge();
                } catch (e) {
                    console.error('Error loading favorites:', e);
                    this.favorites = [];
                }
            },

            saveFavorites() {
                try {
                    localStorage.setItem('favorites', JSON.stringify(this.favorites));
                    this.updateFavoritesBadge();
                } catch (e) {
                    console.error('Error saving favorites:', e);
                }
            },

            toggleFavorite(productId) {
                const index = this.favorites.indexOf(productId);
                if (index > -1) {
                    this.favorites.splice(index, 1);
                    this.showToast('Товар удален из избранного', 'info');
                } else {
                    this.favorites.push(productId);
                    this.showToast('Товар добавлен в избранное', 'success');
                }
                this.saveFavorites();
                
                // Update badges
                this.updateCartBadge();
                
                // Update current page if needed
                if (this.currentPage === 'favorites') {
                    this.nav('favorites');
                } else if (this.currentPage === 'products' || this.currentPage === 'dashboard') {
                    // Re-render to update heart icons
                    this.nav(this.currentPage);
                }
            },

            isFavorite(productId) {
                return this.favorites.includes(productId);
            },

            updateFavoritesBadge() {
                const favItem = this.navConfig.find(item => item.id === 'favorites');
                if (favItem) {
                    favItem.badge = this.favorites.length;
                    this.renderMenu();
                }
                
                // Update header badge
                const headerBadge = document.querySelector('.header-icon-btn[onclick*="favorites"] .icon-badge');
                if (headerBadge) {
                    if (this.favorites.length > 0) {
                        headerBadge.textContent = this.favorites.length;
                        headerBadge.style.display = '';
                    } else {
                        headerBadge.style.display = 'none';
                    }
                }
            },

            async renderFavorites() {
                const favoriteProducts = this.products.filter(p => this.favorites.includes(p.id));

                if (favoriteProducts.length === 0) {
                    document.getElementById('content-mount').innerHTML = `
                        <div class="empty-state" style="padding: 80px 20px;">
                            <i class="fas fa-heart" style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;"></i>
                            <h3 style="font-size: 1.5rem; margin-bottom: 12px;">Избранное пусто</h3>
                            <p style="color: var(--text-secondary); margin-bottom: 24px;">Добавьте товары в избранное, чтобы не потерять их</p>
                            <button class="btn btn-primary" onclick="app.nav('products')">Перейти в каталог</button>
                        </div>`;
                    return '';
                }

                const html = await fetch('/templates/favorites.html').then(r => r.text());
                document.getElementById('content-mount').innerHTML = html;

                const count = favoriteProducts.length;
                document.getElementById('favorites-title').textContent = 'Избранное';
                document.getElementById('favorites-subtitle').textContent = `${count} ${count === 1 ? 'товар' : count < 5 ? 'товара' : 'товаров'}`;
                document.getElementById('favorites-checkout-label').textContent = 'Оформить заказ';

                document.getElementById('favorites-grid').innerHTML = favoriteProducts.map(product => {
                    const imageUrl = this.getProductImage(product);
                    const isAvailable = product.stock > 0;
                    const isInComparison = ComparisonManager.has(product.id);
                    return `
                        <div class="product-card">
                            ${!isAvailable ? '<div class="product-badge">Нет в наличии</div>' : ''}
                            <div class="product-image" onclick='app.nav("product-${product.id}")' style="cursor:pointer;">
                                ${imageUrl
                                    ? `<img src="${imageUrl}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-tools\\' style=\\'font-size:2rem;color:var(--text-light)\\'></i>'">`
                                    : `<i class="fas fa-tools" style="font-size:2rem;color:var(--text-light);"></i>`}
                            </div>
                            <div class="product-body" style="padding:10px;">
                                <div class="product-category" style="font-size:0.75rem;margin-bottom:4px;color:var(--text-secondary);font-weight:500;">${product.categoryName || 'Без категории'}</div>
                                <div class="product-title" style="font-size:0.9rem;margin-bottom:6px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-weight:500;">${product.name}</div>
                                <div class="product-sku" style="font-size:0.8rem;margin-bottom:6px;color:var(--text-tertiary);font-weight:600;">Артикул: ${product.article}</div>
                                <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;">
                                    <div class="product-price" style="font-size:0.9rem;font-weight:700;color:var(--primary);">${this.getPriceDisplay(product.price)}</div>
                                    <div class="product-actions" style="display:flex;gap:4px;">
                                        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();app.toggleFavorite(${product.id})" title="Удалить из избранного" style="padding:4px 8px;"><i class="fas fa-trash"></i></button>
                                        <button class="btn btn-sm ${isInComparison ? 'btn-primary' : 'btn-outline'}" onclick="event.stopPropagation();app.toggleComparison(${product.id})" style="padding:4px 8px;"><i class="fas fa-balance-scale"></i></button>
                                        ${isAvailable ? `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation();app.addToCart(${product.id})" style="padding:4px 8px;"><i class="fas fa-cart-plus"></i></button>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>`;
                }).join('');

                return '';
            },

            async checkoutFavorites() {
                const favoriteProducts = this.products.filter(p => this.favorites.includes(p.id) && p.stock > 0);
                
                if (favoriteProducts.length === 0) {
                    this.showToast('Нет доступных товаров для заказа', 'error');
                    return;
                }

                // Add all favorites to cart
                for (const product of favoriteProducts) {
                    await this.addToCart(product.id, 1);
                }

                // Navigate to cart
                this.nav('cart');
                this.showToast('Товары добавлены в корзину', 'success');
            },

            // View product details
            viewProduct(productId) {
                const product = this.products.find(p => p.id === productId);
                if (product) {
                    this.currentProduct = product;
                    
                    // Add to recently viewed
                    this.addToRecentlyViewed(product);

                    document.getElementById('product-modal-title').innerText = product.name;

                    const attributesHtml = product.attributes && product.attributes.length > 0
                        ? product.attributes.map(attr => `
                            <div class="flex justify-between py-2 border-b">
                                <span class="text-secondary">${attr.attrName}:</span>
                                <span class="font-medium">${attr.attrValue}</span>
                            </div>
                        `).join('')
                        : '<div class="text-center py-4 text-secondary">Характеристики отсутствуют</div>';

                    document.getElementById('product-modal-content').innerHTML = `
                        <div class="mb-4">
                            <div class="text-secondary mb-2">Артикул: ${product.article}</div>
                            ${product.description ? `<p class="mb-4">${product.description}</p>` : ''}
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <div class="text-sm text-secondary mb-1">Цена</div>
                                <div class="text-2xl font-bold text-primary">${this.getPriceDisplay(product.price)}</div>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <div class="text-sm text-secondary mb-1">Наличие</div>
                                <div class="text-xl font-bold ${product.stock > 0 ? 'text-success' : 'text-danger'}">
                                    ${product.stock > 0 ? `${product.stock} шт.` : 'Нет в наличии'}
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-semibold mb-2">Характеристики:</h4>
                            <div class="bg-gray-50 rounded-lg p-3">
                                ${attributesHtml}
                            </div>
                        </div>
                    `;

                    const addButton = document.getElementById('product-modal-add-btn');
                    if (this.currentUser?.role === 'Manager' || this.currentUser?.role === 'Admin') {
                        addButton.style.display = 'none';
                    } else {
                        addButton.style.display = 'block';
                        if (product.stock > 0) {
                            addButton.disabled = false;
                            addButton.innerHTML = '<i class="fas fa-cart-plus"></i> Добавить в корзину';
                            addButton.className = 'btn btn-primary';
                        } else {
                            addButton.disabled = true;
                            addButton.innerHTML = '<i class="fas fa-times"></i> Нет в наличии';
                            addButton.className = 'btn btn-outline';
                        }
                    }

                    this.showModal('product-modal');
                }
            },

            // Alias for viewProduct
            showProductModal(productId) {
                this.viewProduct(productId);
            },

            // View order details
            viewOrder(orderId) {
                const order = this.orders.find(o => o.id === orderId);
                if (order) {
                    document.getElementById('order-modal-title').innerText = `Заказ #${order.id}`;

                    const statusClass = order.status === 'Новый' ? 'status-new' :
                        order.status === 'В обработке' ? 'status-processing' :
                            order.status === 'Завершен' ? 'status-completed' : 'status-pending';

                    document.getElementById('order-modal-content').innerHTML = `
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <div class="text-sm text-secondary">Номер заказа</div>
                                    <div class="text-xl font-bold">#${order.id}</div>
                                </div>
                                <div class="status-badge ${statusClass}">
                                    ${order.status}
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <div class="text-sm text-secondary">Дата создания</div>
                                    <div class="font-medium">${new Date(order.createdAt).toLocaleDateString('ru-RU')}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-secondary">Сумма заказа</div>
                                    <div class="text-xl font-bold text-primary">${order.totalAmount?.toFixed(2) || '0.00'} BYN</div>
                                </div>
                            </div>
                            
                            <div class="border-t pt-4">
                                <div class="text-sm text-secondary mb-2">Детали заказа:</div>
                                <div class="bg-gray-50 rounded-lg p-3">
                                    <div class="text-center py-4 text-secondary">
                                        Детали заказа будут отображаться здесь
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    this.showModal('order-modal');
                }
            },

            // Render pages
            renderDashboard() {
                // Get popular products (hits)
                const hitProducts = this.products && this.products.length > 0
                    ? this.products.filter(p => p.stock > 0).slice(0, 12)
                    : [];

                // Get recently viewed
                const recentlyViewed = this.getRecentlyViewed().slice(0, 12);

                // Get best offers (products with highest stock or random)
                const bestOffers = this.products && this.products.length > 0
                    ? this.products.filter(p => p.stock > 0).sort(() => 0.5 - Math.random()).slice(0, 12)
                    : [];

                const cartCount = this.cart ? this.cart.totalItems : 0;
                const currentFilter = this.dashboardFilter || 'popular';

                // Determine which products to show
                let displayProducts = hitProducts;
                if (currentFilter === 'recent') displayProducts = recentlyViewed;
                else if (currentFilter === 'offers') displayProducts = bestOffers;

                // Show carousel only on 'popular' filter
                const showCarousel = currentFilter === 'popular';

                // Carousel products with real images - best looking products
                const carouselProducts = [
                    { 
                        article: 'AEP-75-900', 
                        imageUrl: '/img/AEP-75-900.jpg',
                        title: 'Настольная пила 7500 Вт',
                        subtitle: 'Профессиональное оборудование',
                        description: 'Мощная настольная пила для профессионального использования с диском 900мм'
                    },
                    { 
                        article: 'DG2720-5', 
                        imageUrl: '/img/DG2720-5.jpg',
                        title: 'Ударный гайковерт 2700 Вт Pro',
                        subtitle: 'Максимальная мощность',
                        description: 'Профессиональный ударный гайковерт для самых сложных задач'
                    },
                    { 
                        article: 'HD-A203', 
                        imageUrl: '/img/HD-A203.jpg',
                        title: 'Набор инструментов 203 предмета',
                        subtitle: 'Полный комплект для мастера',
                        description: 'Профессиональный набор ручного инструмента для любых работ'
                    }
                ];

                return `
                    <!-- Top Header Bar -->
                    <div class="top-header-bar">
                        <div class="top-header-content">
                            <div class="top-header-left">
                                <div class="header-logo-main">
                                    <span>BLACK ONYX</span>
                                </div>
                            </div>
                            <div class="top-header-center">
                                <div class="search-bar-main" style="position: relative;">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="dashboard-search" placeholder="Поиск товаров по названию или артикулу..." oninput="app.liveSearchDashboard(event)" onkeyup="app.searchFromDashboard(event)">
                                    <button class="search-btn-main" onclick="app.performDashboardSearch()">Найти</button>
                                    <div id="dashboard-search-dropdown" class="search-dropdown" style="display: none;"></div>
                                </div>
                            </div>
                            <div class="top-header-right">
                                <div class="header-contact">
                                    <i class="fas fa-phone"></i>
                                    <span>+375 (29) 123-45-67</span>
                                </div>
                                ${this.currentUser?.role === 'Customer' ? `
                                <button class="header-icon-btn" onclick="app.nav('favorites')" title="Избранное">
                                    <i class="fas fa-heart"></i>
                                    ${this.favorites && this.favorites.length > 0 ? `<span class="icon-badge">${this.favorites.length}</span>` : ''}
                                </button>
                                ` : ''}
                                <button class="header-icon-btn" onclick="app.nav('comparison')" title="Сравнение товаров">
                                    <i class="fas fa-balance-scale"></i>
                                    <span class="icon-badge" id="dashboard-comparison-badge" style="display: none;"></span>
                                </button>
                                ${this.currentUser?.role === 'Customer' ? `
                                <button class="header-icon-btn" onclick="app.nav('cart')" title="Корзина">
                                    <i class="fas fa-shopping-cart"></i>
                                    ${cartCount > 0 ? `<span class="icon-badge">${cartCount}</span>` : ''}
                                </button>
                                ` : ''}
                                <button class="header-icon-btn" onclick="app.nav('profile')" title="Личный кабинет">
                                    <i class="fas fa-user"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Main Dashboard Content -->
                    <div class="dashboard-main-content">
                        <!-- Hero Carousel (only show on popular filter) -->
                        ${showCarousel ? `
                        <div class="hero-carousel">
                            <div class="carousel-track" id="carousel-track">
                                ${carouselProducts.map((prod, index) => {
                                    return `
                                        <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                                            <div class="carousel-content-product">
                                                <div class="carousel-product-image">
                                                    ${prod.imageUrl ? 
                                                        `<img src="${prod.imageUrl}" alt="${prod.title}" onerror="this.parentElement.innerHTML='<div class=\\'carousel-placeholder\\'><i class=\\'fas fa-tools\\'></i></div>'">` :
                                                        `<div class="carousel-placeholder"><i class="fas fa-tools"></i></div>`
                                                    }
                                                </div>
                                                <div class="carousel-product-info">
                                                    <div class="carousel-badge">BLACK ONYX</div>
                                                    <h2>${prod.title}</h2>
                                                    <h3>${prod.subtitle}</h3>
                                                    <p>${prod.description}</p>
                                                    <button class="btn btn-primary" onclick="app.nav('products')">
                                                        Смотреть в каталоге
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            <button class="carousel-btn prev" onclick="app.prevSlide()">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="carousel-btn next" onclick="app.nextSlide()">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                            <div class="carousel-dots" id="carousel-dots">
                                ${carouselProducts.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" onclick="app.goToSlide(${i})"></span>`).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Filter Chips -->
                        <div class="dashboard-controls">
                            <div class="filter-chips">
                                <button class="filter-chip ${currentFilter === 'popular' ? 'active' : ''}" onclick="app.setDashboardFilter('popular')">
                                    <i class="fas fa-fire"></i>
                                    Популярные товары
                                </button>
                                <button class="filter-chip ${currentFilter === 'recent' ? 'active' : ''}" onclick="app.setDashboardFilter('recent')">
                                    <i class="fas fa-history"></i>
                                    Недавно смотрели
                                </button>
                                <button class="filter-chip ${currentFilter === 'offers' ? 'active' : ''}" onclick="app.setDashboardFilter('offers')">
                                    <i class="fas fa-tag"></i>
                                    Лучшие предложения
                                </button>
                            </div>
                        </div>

                        <!-- Products Grid -->
                        <div class="products-section-compact">
                            ${displayProducts.length > 0 ? `
                                <div class="products-grid-compact">
                                    ${displayProducts.map(product => this.renderProductCardCompact(product)).join('')}
                                </div>
                            ` : `
                                <div class="empty-state">
                                    <i class="fas fa-box-open"></i>
                                    <p>Нет товаров для отображения</p>
                                </div>
                            `}
                        </div>
                    </div>
                `;
            },

            // Compact product card
            renderProductCardCompact(product) {
                const imageUrl = this.getProductImage(product);
                const imageHtml = imageUrl 
                    ? `<img src="${imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-tools\\'></i>'">`
                    : `<i class="fas fa-tools"></i>`;
                
                const isInComparison = ComparisonManager.has(product.id);
                const isInFavorites = this.favorites.includes(product.id);
                
                return `
                    <div class="product-card-compact" onclick="app.nav('product-${product.id}')">
                        <div class="product-img-compact">
                            ${imageHtml}
                        </div>
                        <div class="product-info-compact">
                            <div class="product-title-compact">${product.name}</div>
                            <div class="product-code-compact">${product.article}</div>
                            <div class="product-footer-compact">
                                <div class="product-price-compact">${this.getPriceDisplay(product.price)}</div>
                                <div style="display: flex; gap: 4px;">
                                    ${this.currentUser?.role === 'Customer' && product.stock > 0 ? `
                                        <button class="add-cart-btn-compact" onclick="event.stopPropagation(); app.addToCart(${product.id})" title="В корзину">
                                            <i class="fas fa-cart-plus"></i>
                                        </button>
                                    ` : ''}
                                    ${this.currentUser?.role === 'Customer' ? `
                                        <button class="add-cart-btn-compact ${isInFavorites ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleFavorite(${product.id})" title="Избранное">
                                            <i class="fas fa-heart" style="color: ${isInFavorites ? 'var(--danger)' : 'inherit'};"></i>
                                        </button>
                                    ` : ''}
                                    <button class="add-cart-btn-compact ${isInComparison ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleComparison(${product.id})" title="Сравнение">
                                        <i class="fas fa-balance-scale" style="color: ${isInComparison ? 'var(--primary)' : 'inherit'};"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },

            // Dashboard filter
            setDashboardFilter(filter) {
                this.dashboardFilter = filter;
                this.nav('dashboard');
            },

            // Toggle categories panel
            toggleCategoriesPanel() {
                const panel = document.getElementById('categories-panel');
                if (panel) {
                    panel.classList.toggle('hidden');
                }
            },

            // Carousel controls
            currentSlide: 0,
            
            nextSlide() {
                const slides = document.querySelectorAll('.carousel-slide');
                const dots = document.querySelectorAll('.dot');
                if (slides.length === 0) return;
                
                slides[this.currentSlide].classList.remove('active');
                dots[this.currentSlide].classList.remove('active');
                
                this.currentSlide = (this.currentSlide + 1) % slides.length;
                
                slides[this.currentSlide].classList.add('active');
                dots[this.currentSlide].classList.add('active');
            },

            prevSlide() {
                const slides = document.querySelectorAll('.carousel-slide');
                const dots = document.querySelectorAll('.dot');
                if (slides.length === 0) return;
                
                slides[this.currentSlide].classList.remove('active');
                dots[this.currentSlide].classList.remove('active');
                
                this.currentSlide = (this.currentSlide - 1 + slides.length) % slides.length;
                
                slides[this.currentSlide].classList.add('active');
                dots[this.currentSlide].classList.add('active');
            },

            goToSlide(index) {
                const slides = document.querySelectorAll('.carousel-slide');
                const dots = document.querySelectorAll('.dot');
                if (slides.length === 0) return;
                
                slides[this.currentSlide].classList.remove('active');
                dots[this.currentSlide].classList.remove('active');
                
                this.currentSlide = index;
                
                slides[this.currentSlide].classList.add('active');
                dots[this.currentSlide].classList.add('active');
            },

            // Auto-play carousel
            carouselInterval: null,

            startCarouselAutoPlay() {
                // Clear any existing interval
                if (this.carouselInterval) {
                    clearInterval(this.carouselInterval);
                }
                // Auto-advance every 5 seconds
                this.carouselInterval = setInterval(() => {
                    if (this.currentPage === 'dashboard') {
                        this.nextSlide();
                    }
                }, 5000);
            },

            stopCarouselAutoPlay() {
                if (this.carouselInterval) {
                    clearInterval(this.carouselInterval);
                    this.carouselInterval = null;
                }
            },

            // Search from dashboard
            searchFromDashboard(event) {
                if (event.key === 'Enter') {
                    this.performDashboardSearch();
                }
            },

            performDashboardSearch() {
                const searchInput = document.getElementById('dashboard-search');
                if (searchInput && searchInput.value.trim()) {
                    const query = searchInput.value.trim();
                    // Hide dropdown
                    const dropdown = document.getElementById('dashboard-search-dropdown');
                    if (dropdown) dropdown.style.display = 'none';
                    
                    this.nav('products');
                    // Wait for products page to render, then apply search
                    setTimeout(() => {
                        const productsSearchInput = document.getElementById('filter-search');
                        if (productsSearchInput) {
                            productsSearchInput.value = query;
                            this.applyFilters();
                        }
                    }, 100);
                }
            },
            
            // Live search with autocomplete for dashboard
            async liveSearchDashboard(event) {
                const query = event.target.value.trim();
                const dropdown = document.getElementById('dashboard-search-dropdown');
                
                if (!dropdown) return;
                
                if (query.length < 2) {
                    dropdown.style.display = 'none';
                    return;
                }
                
                // Search in all products via API
                try {
                    const response = await fetch(`${this.apiBaseUrl}/products?search=${encodeURIComponent(query)}&pageSize=10`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    
                    if (response.ok) {
                        const results = await response.json();
                        
                        if (results.length === 0) {
                            dropdown.innerHTML = '<div class="search-dropdown-item" style="color: var(--text-tertiary); cursor: default;">Ничего не найдено</div>';
                            dropdown.style.display = 'block';
                            return;
                        }
                        
                        dropdown.innerHTML = results.map(product => `
                            <div class="search-dropdown-item" onclick="app.nav('product-${product.id}'); document.getElementById('dashboard-search-dropdown').style.display='none';">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <img src="${product.imageUrl || '/img/placeholder.jpg'}" 
                                         alt="${product.name}"
                                         onerror="this.src='/img/placeholder.jpg'"
                                         style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px; background: var(--bg-page);">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 500; color: var(--text-main);">${product.name}</div>
                                        <div style="font-size: 0.8rem; color: var(--text-tertiary);">${product.article}</div>
                                    </div>
                                    <div style="font-weight: 600; color: var(--primary);">${this.getPriceDisplay(product.price)}</div>
                                </div>
                            </div>
                        `).join('');
                        
                        dropdown.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Search error:', error);
                }
            },

            // Search from header
            searchFromHeader(event) {
                if (event.key === 'Enter') {
                    this.performHeaderSearch();
                }
            },

            // Live search with dropdown
            liveSearch(event) {
                const query = event.target.value.trim();
                const dropdown = document.getElementById('search-results-dropdown');
                
                if (!dropdown) return;
                
                if (query.length < 2) {
                    dropdown.style.display = 'none';
                    return;
                }

                // Debounce
                clearTimeout(this._liveSearchTimeout);
                this._liveSearchTimeout = setTimeout(async () => {
                    try {
                        const params = new URLSearchParams({ search: query, page: 1, pageSize: 8 });
                        const response = await fetch(`${this.apiBaseUrl}/products?${params}`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        });
                        if (!response.ok) throw new Error('fetch failed');
                        const results = await response.json();

                        if (!results || results.length === 0) {
                            dropdown.innerHTML = '<div class="search-no-results">Ничего не найдено</div>';
                            dropdown.style.display = 'block';
                            return;
                        }

                        dropdown.innerHTML = results.map(product => {
                            const imageUrl = this.getProductImage(product);
                            return `
                                <div class="search-result-item" onclick="app.openProductFromSearch(${product.id})">
                                    ${imageUrl ? 
                                        `<img src="${imageUrl}" class="search-result-image" alt="${product.name}">` :
                                        `<div class="search-result-image" style="display: flex; align-items: center; justify-content: center;"><i class="fas fa-tools"></i></div>`
                                    }
                                    <div class="search-result-info">
                                        <div class="search-result-name">${product.name}</div>
                                        <div class="search-result-article">Арт: ${product.article}</div>
                                    </div>
                                    <div class="search-result-price">${this.getPriceDisplay(product.price)}</div>
                                </div>
                            `;
                        }).join('');

                        dropdown.style.display = 'block';
                    } catch (e) {
                        // Fallback to local filter if API fails
                        const q = query.toLowerCase();
                        const results = (this.products || []).filter(p => 
                            p.name.toLowerCase().includes(q) || 
                            p.article.toLowerCase().startsWith(q)
                        ).slice(0, 8);

                        if (results.length === 0) {
                            dropdown.innerHTML = '<div class="search-no-results">Ничего не найдено</div>';
                        } else {
                            dropdown.innerHTML = results.map(product => {
                                const imageUrl = this.getProductImage(product);
                                return `
                                    <div class="search-result-item" onclick="app.openProductFromSearch(${product.id})">
                                        ${imageUrl ? 
                                            `<img src="${imageUrl}" class="search-result-image" alt="${product.name}">` :
                                            `<div class="search-result-image" style="display: flex; align-items: center; justify-content: center;"><i class="fas fa-tools"></i></div>`
                                        }
                                        <div class="search-result-info">
                                            <div class="search-result-name">${product.name}</div>
                                            <div class="search-result-article">Арт: ${product.article}</div>
                                        </div>
                                        <div class="search-result-price">${this.getPriceDisplay(product.price)}</div>
                                    </div>
                                `;
                            }).join('');
                        }
                        dropdown.style.display = 'block';
                    }
                }, 300);
            },

            openProductFromSearch(productId) {
                // Close dropdown
                const dropdown = document.getElementById('search-results-dropdown');
                if (dropdown) dropdown.style.display = 'none';
                
                // Close dashboard dropdown if exists
                const dashboardDropdown = document.getElementById('dashboard-search-dropdown');
                if (dashboardDropdown) dashboardDropdown.style.display = 'none';
                
                // Clear search input
                const searchInput = document.getElementById('header-search');
                if (searchInput) searchInput.value = '';
                
                // Navigate to product detail page
                this.nav(`product-${productId}`);
            },

            performHeaderSearch() {
                const searchInput = document.getElementById('header-search');
                if (searchInput && searchInput.value.trim()) {
                    const query = searchInput.value.trim();
                    // Close dropdown
                    const dropdown = document.getElementById('search-results-dropdown');
                    if (dropdown) dropdown.style.display = 'none';
                    // Store search query to apply after navigation
                    this._pendingSearch = query;
                    this.nav('products');
                    // Wait for products page to render, then apply search
                    setTimeout(() => {
                        const filterSearchInput = document.getElementById('filter-search');
                        if (filterSearchInput) {
                            filterSearchInput.value = query;
                            this._pendingSearch = null;
                            this.applyFilters();
                        }
                    }, 150);
                }
            },

            clearSearch() {
                const filterSearchInput = document.getElementById('filter-search');
                if (filterSearchInput) filterSearchInput.value = '';
                this.applyFilters();
            },

            // Helper to get price display (shows price or "Только для авторизованных")
            getPriceDisplay(price) {
                if (app.canSeePrices()) {
                    return `${price.toFixed(2)} BYN`;
                }
                return '<span style="color: var(--text-tertiary); font-style: italic; font-size: 0.85rem;">Только для авторизованных</span>';
            },

            // Helper to check if add to cart should be shown
            shouldShowAddToCart(product) {
                return app.canAddToCart() && product.stock > 0;
            },

            // Helper to check if favorites should be shown
            shouldShowFavorites() {
                return app.canUseFavorites();
            },

            // Render product card for dashboard
            renderProductCard(product) {
                const imageUrl = this.getProductImage(product);
                const imageHtml = imageUrl 
                    ? `<img src="${imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-tools\\'></i>'">`
                    : `<i class="fas fa-tools"></i>`;
                
                const isInComparison = ComparisonManager.has(product.id);
                const isInFavorites = this.favorites.includes(product.id);
                const canSeePrices = app.canSeePrices();
                const canAddToCart = this.shouldShowAddToCart(product);
                const canShowFavorites = this.shouldShowFavorites();
                
                return `
                    <div class="product-card-main" onclick="app.nav('product-${product.id}')">
                        <div class="product-card-img">
                            ${imageHtml}
                        </div>
                        <div class="product-card-content">
                            <div class="product-card-title">${product.name}</div>
                            <div class="product-card-code">${product.article}</div>
                            <div class="product-card-bottom">
                                <div class="product-card-price-main">${this.getPriceDisplay(product.price)}</div>
                                <div style="display: flex; gap: 4px;">
                                    ${canAddToCart ? `
                                        <button class="product-card-cart-btn" onclick="event.stopPropagation(); app.addToCart(${product.id})" title="В корзину">
                                            <i class="fas fa-shopping-cart"></i>
                                        </button>
                                    ` : ''}
                                    ${canShowFavorites ? `
                                        <button class="product-card-cart-btn ${isInFavorites ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleFavorite(${product.id})" title="Избранное">
                                            <i class="fas fa-heart" style="color: ${isInFavorites ? 'var(--danger)' : 'inherit'};"></i>
                                        </button>
                                    ` : ''}
                                    <button class="product-card-cart-btn ${isInComparison ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleComparison(${product.id})" title="Сравнение">
                                        <i class="fas fa-balance-scale" style="color: ${isInComparison ? 'var(--primary)' : 'inherit'};"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },

            // Recently viewed products
            getRecentlyViewed() {
                try {
                    // Просто возвращаем то, что лежит в localStorage
                    return JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                } catch {
                    return [];
                }
            },

            addToRecentlyViewed(product) {
                try {
                    let viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                    
                    // Удаляем дубликат, если он есть (сравниваем по id)
                    viewed = viewed.filter(p => p.id !== product.id);
                    
                    // Добавляем новый товар в начало
                    viewed.unshift(product);
                    
                    // Ограничиваем список (12 товаров)
                    viewed = viewed.slice(0, 12);
                    
                    localStorage.setItem('recentlyViewed', JSON.stringify(viewed));
                } catch (e) {
                    console.error('Error saving recently viewed:', e);
                }
            },

            clearRecentlyViewed() {
                localStorage.removeItem('recentlyViewed');
                this.nav('dashboard');
                this.showToast('История просмотров очищена', 'success');
            },

            // Load images mapping from images.json
            async loadImagesMapping() {
                try {
                    const response = await fetch('images.json');
                    if (response.ok) {
                        this.imagesMapping = await response.json();
                    }
                } catch (e) {
                    console.warn('Could not load images.json:', e);
                    this.imagesMapping = {};
                }
            },

            // Get product image URL from API response
            getProductImage(product) {
                // Используем imageUrl из API
                return product.imageUrl || null;
            },

            renderProducts() {
                const searchQuery = document.getElementById('filter-search')?.value?.trim() || this._pendingSearch || '';
                
                if (this.products.length === 0) {
                    // Если уже загружаем — не запускаем снова
                    if (this._productsLoading) {
                        return `
                            <div class="page-header">
                                <div>
                                    <h1 class="page-title">Каталог товаров</h1>
                                    <p class="page-subtitle">Загрузка...</p>
                                </div>
                            </div>
                            <div class="loading">
                                <div class="loading-spinner"></div>
                            </div>
                        `;
                    }
                    
                    // Запускаем загрузку товаров
                    this._productsLoading = true;
                    this.loadProducts(true).catch(e => {
                        console.error('Ошибка загрузки товаров:', e);
                        this._productsLoading = false;
                    });
                    
                    return `
                        <div class="page-header">
                            <div>
                                <h1 class="page-title">Каталог товаров</h1>
                                <p class="page-subtitle">Загрузка товаров...</p>
                            </div>
                        </div>
                        <div class="loading">
                            <div class="loading-spinner"></div>
                        </div>
                    `;
                }

                // Load images mapping if not loaded
                if (!this.imagesMapping) {
                    this.loadImagesMapping();
                }

                const isSearchMode = !!searchQuery;

                return `
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">${isSearchMode ? 'Результаты поиска' : 'Каталог товаров'}</h1>
                            <p class="page-subtitle">${isSearchMode ? `По запросу «${searchQuery}» найдено ${this.totalProducts} товаров` : `${this.totalProducts} товаров • Страница ${this.currentProductPage} из ${this.totalPages} • Обновлено: ${new Date().toLocaleDateString()}`}</p>
                        </div>
                        <div class="flex gap-3">
                            ${isSearchMode ? `
                            <button class="btn btn-primary" onclick="app.clearSearch()">
                                <i class="fas fa-arrow-left"></i> Вернуться в каталог
                            </button>
                            ` : `
                            <button class="btn btn-outline" onclick="app.toggleFilters()">
                                <i class="fas fa-filter"></i> Фильтры
                                <span id="active-filters-count" class="filter-badge" style="display: none;"></span>
                            </button>
                            `}

                            <div class="sort-controls">
                                <select id="sort-select" class="form-select" onchange="app.applySorting()">
                                    <option value="name">По названию</option>
                                    <option value="price">По цене</option>
                                    <option value="created">По дате добавления</option>
                                </select>
                                <button class="btn btn-outline btn-icon" id="sort-direction-btn" onclick="app.toggleSortDirection()">
                                    <i class="fas fa-sort-amount-down"></i>
                                </button>
                            </div>

                            ${this.currentUser?.role === 'Customer' ? `
                            <button class="btn btn-outline" onclick="app.nav('cart')">
                                <i class="fas fa-shopping-cart"></i> Корзина (${this.cart ? this.cart.totalItems : 0})
                            </button>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Catalog Layout with Sidebar -->
                    <div style="display: flex; gap: 24px; margin-top: 24px;">
                        <!-- Main Content - Products Grid -->
                        <div style="flex: 1; min-width: 0;">
                            <div class="products-grid">
                                ${this.products.map(product => {
                    const isAvailable = product.stock > 0;
                    const imageUrl = this.getProductImage(product);
                    const stockClass = product.stock > 10 ? 'stock-available' : product.stock > 0 ? 'stock-low' : 'stock-out';
                    const isInComparison = ComparisonManager.has(product.id);
                    
                    return `
                                        <div class="product-card" onclick='app.nav("product-${product.id}")' style="cursor: pointer;">
                                            ${!isAvailable ? '<div class="product-badge">Нет в наличии</div>' : ''}

                                            <div class="product-image">
                                                ${imageUrl ? 
                                                    `<img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<i class=\'fas fa-tools\' style=\'font-size: 2rem; color: var(--text-light);'></i>'" />` :
                                                    `<i class="fas fa-tools" style="font-size: 2rem; color: var(--text-light);"></i>`
                                                }
                                            </div>

                                            <div class="product-body" style="padding: 8px;">
                                                <div class="product-category" style="font-size: 0.65rem; margin-bottom: 2px;">${product.categoryName || 'Без кат.'}</div>
                                                <div class="product-title" style="font-size: 0.75rem; margin-bottom: 4px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.name}</div>
                                                <div class="product-sku" style="font-size: 0.65rem; margin-bottom: 4px; color: var(--text-tertiary);">Арт: ${product.article}</div>

                                                <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
                                                    <div class="product-price" style="font-size: 1.1rem; font-weight: 700; color: var(--primary);">${this.getPriceDisplay(product.price)}</div>
                                                    <div class="product-actions" style="display: flex; gap: 6px;">
                                                        <button class="btn btn-outline btn-sm btn-icon" onclick='event.stopPropagation(); app.nav("product-${product.id}")' title="Просмотр" style="width: 32px; height: 32px; padding: 0;">
                                                            <i class="fas fa-eye" style="font-size: 0.85rem;"></i>
                                                        </button>
                                                        ${this.currentUser?.role === 'Customer' ? `
                                                            <button class="btn ${this.isFavorite(product.id) ? 'btn-danger' : 'btn-outline'} btn-sm btn-icon" onclick='event.stopPropagation(); app.toggleFavorite(${product.id})' title="${this.isFavorite(product.id) ? 'Удалить из избранного' : 'Добавить в избранное'}" style="width: 32px; height: 32px; padding: 0;">
                                                                <i class="fas fa-heart" style="font-size: 0.85rem;"></i>
                                                            </button>
                                                        ` : ''}
                                                        <button class="btn ${isInComparison ? 'btn-primary' : 'btn-outline'} btn-sm btn-icon" onclick='event.stopPropagation(); app.toggleComparison(${product.id})' title="${isInComparison ? 'Убрать из сравнения' : 'Добавить к сравнению'}" style="width: 32px; height: 32px; padding: 0;">
                                                            <i class="fas fa-balance-scale" style="font-size: 0.85rem;"></i>
                                                        </button>
                                                        ${this.currentUser?.role === 'Customer' && isAvailable ? `
                                                            <button class="btn btn-primary btn-sm btn-icon" onclick='event.stopPropagation(); app.addToCart(${product.id})' title="В корзину" style="width: 32px; height: 32px; padding: 0;">
                                                                <i class="fas fa-cart-plus" style="font-size: 0.85rem;"></i>
                                                            </button>
                                                        ` : ''}
                                                    </div>
                                                </div>
                                                <div class="product-stock ${stockClass}" style="font-size: 0.75rem; margin-top: 6px; font-weight: 600;">
                                                    ${isAvailable ? `${product.stock > 10 ? '✓ В наличии' : product.stock > 0 ? '⚠ Мало' : '✗ Нет'} (${product.stock} шт.)` : '✗ Нет в наличии'}
                                                </div>
                                            </div>
                                        </div>
                                `;
                    }).join('')}
                            </div>
                            
                            ${this.totalPages > 1 ? `
                            <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem; padding: 1rem;">
                                <button class="btn btn-outline" onclick="app.prevPage()" ${this.currentProductPage === 1 ? 'disabled' : ''}>
                                    <i class="fas fa-chevron-left"></i> Назад
                                </button>
                                
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    ${this.currentProductPage > 3 ? `
                                        <button class="btn btn-outline" onclick="app.goToPage(1)">1</button>
                                        ${this.currentProductPage > 4 ? '<span>...</span>' : ''}
                                    ` : ''}
                                    
                                    ${Array.from({length: this.totalPages}, (_, i) => i + 1)
                                        .filter(page => Math.abs(page - this.currentProductPage) <= 2)
                                        .map(page => `
                                    <button class="btn ${page === this.currentProductPage ? 'btn-primary' : 'btn-outline'}" 
                                            onclick="app.goToPage(${page})"
                                            ${page === this.currentProductPage ? 'disabled' : ''}>
                                        ${page}
                                    </button>
                                `).join('')}
                            
                            ${this.currentProductPage < this.totalPages - 2 ? `
                                ${this.currentProductPage < this.totalPages - 3 ? '<span>...</span>' : ''}
                                <button class="btn btn-outline" onclick="app.goToPage(${this.totalPages})">${this.totalPages}</button>
                            ` : ''}
                        </div>
                        
                        <button class="btn btn-outline" onclick="app.nextPage()" ${this.currentProductPage === this.totalPages ? 'disabled' : ''}>
                            Вперед <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    ` : ''}
                `;
            },

});