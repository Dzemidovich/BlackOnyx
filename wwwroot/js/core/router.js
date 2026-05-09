// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Router/Navigation module - adds navigation methods to app object
// Must be loaded after app.js
Object.assign(app, {
           logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
},

            // Scroll to top function
            scrollToTop() {
                const contentArea = document.getElementById('content-mount');
                if (contentArea) {
                    contentArea.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            },

            // Handle scroll events for scroll-to-top button
            handleScroll() {
                const contentArea = document.getElementById('content-mount');
                const scrollBtn = document.getElementById('scroll-to-top');
                
                if (contentArea && scrollBtn) {
                    if (contentArea.scrollTop > 300) {
                        scrollBtn.classList.add('visible');
                    } else {
                        scrollBtn.classList.remove('visible');
                    }
                }
            },

            // Render navigation menu
            renderMenu() {
                const nav = document.getElementById('nav-menu');
                nav.innerHTML = '';

                this.navConfig.forEach(item => {
                    // Skip admin items if user is not admin
                    if (item.adminOnly && this.currentUser?.role !== 'Admin') {
                        return;
                    }

                    // Skip manager items if user is not manager
                    if (item.managerOnly && this.currentUser?.role !== 'Manager') {
                        return;
                    }

                    // Skip customer items if user is not customer
                    if (item.customerOnly && this.currentUser?.role !== 'Customer') {
                        return;
                    }

                    const div = document.createElement('div');
                    div.className = `nav-item ${item.id === this.currentPage ? 'active' : ''}`;
                    div.dataset.id = item.id;
                    div.dataset.page = item.id;  // Добавляем data-page для поиска
                    div.onclick = () => this.nav(item.id);

                    div.innerHTML = `
                        <div class="nav-item-icon">
                            <i class="fas fa-${item.icon}"></i>
                        </div>
                        <div class="nav-item-text">${item.title}</div>
                        ${item.badge !== null && item.badge > 0 ? `<div class="nav-badge">${item.badge}</div>` : ''}
                    `;

                    nav.appendChild(div);
                });
            },

            // Navigation function
            async nav(pageId) {
                console.log('=== NAV CALLED ===');
                console.log('pageId:', pageId);
                console.log('currentPage before:', this.currentPage);
                
                // Save previous page for back button
                if (this.currentPage && this.currentPage !== pageId) {
                    this.previousPage = this.currentPage;
                }
                
                this.currentPage = pageId;
                console.log('nav called:', pageId);

                // Update active state in sidebar
                this.renderMenu();

                const content = document.getElementById('content-mount');
                const header = document.getElementById('page-header');
                const breadcrumb = document.getElementById('breadcrumb');
                const headerElement = document.getElementById('main-header');

                if (!content) {
                    console.error('Критическая ошибка: элемент content-mount не найден!');
                    return;
                }

                console.log('content element found:', !!content);

                // Always show header on all pages
                if (headerElement) headerElement.style.display = 'flex';

                // Update breadcrumb
                let breadcrumbHtml = '<span class="breadcrumb-item" onclick="app.nav(\'dashboard\')" style="cursor: pointer;">Главная</span>';
                
                // Add back button if not on dashboard
                if (pageId !== 'dashboard' && this.previousPage) {
                    breadcrumbHtml = `<button class="btn-back" onclick="app.nav('${this.previousPage}')" title="Назад"><i class="fas fa-arrow-left"></i> Назад</button>` + breadcrumbHtml;
                }

                // Handle different pages
                if (pageId === 'dashboard') {
                    if (header) header.innerText = 'Главная панель';
                    content.innerHTML = this.renderDashboard();
                    breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Главная</span>';
                }
                else if (pageId === 'products') {
                    header.innerText = 'Каталог товаров';
                    content.innerHTML = this.renderProducts();
                    breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Каталог</span>';
                }
                else if (pageId === 'cart') {
                    header.innerText = 'Моя корзина';
                    try {
                        await this.renderCart();
                        console.log('cart rendered successfully');
                    } catch(e) {
                        console.error('renderCart error:', e);
                        content.innerHTML = '<div class="empty-state"><div class="empty-state-title">Ошибка загрузки корзины: ' + e.message + '</div></div>';
                    }
                    breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Корзина</span>';
                }
                else if (pageId === 'favorites') {
                    header.innerText = 'Избранное';
                    try {
                        await this.renderFavorites();
                        console.log('favorites rendered successfully');
                    } catch(e) {
                        console.error('renderFavorites error:', e);
                        content.innerHTML = '<div class="empty-state"><div class="empty-state-title">Ошибка загрузки избранного: ' + e.message + '</div></div>';
                    }
                    breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Избранное</span>';
                }
                else if (pageId === 'notifications') {
                    console.log('=== RENDERING NOTIFICATIONS ===');
                    header.innerText = 'Мои уведомления';
                    try { 
                        if (typeof this.renderNotifications !== 'function') {
                            throw new Error('Функция renderNotifications не найдена');
                        }
                        content.innerHTML = await this.renderNotifications(); 
                        console.log('notifications rendered successfully');
                    } catch(e) { 
                        console.error('renderNotifications error:', e); 
                        content.innerHTML = '<div class="empty-state"><div class="empty-state-title">Ошибка загрузки страницы: ' + e.message + '</div></div>'; 
                    }
                    breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Уведомления</span>';
                }
                else if (pageId === 'orders') {
                    console.log('=== RENDERING ORDERS ===');
                    header.innerText = 'Мои заказы';
                    try { 
                        if (typeof this.renderOrders !== 'function') {
                            throw new Error('Функция renderOrders не найдена');
                        }
                        content.innerHTML = this.renderOrders(); 
                        console.log('orders rendered successfully');
                    } catch(e) { 
                        console.error('renderOrders error:', e); 
                        content.innerHTML = '<div class="empty-state"><div class="empty-state-title">Ошибка загрузки страницы: ' + e.message + '</div></div>'; 
                    }
                    breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Заказы</span>';
                }
                else if (pageId === 'profile') {
                    console.log('=== RENDERING PROFILE ===');
                    header.innerText = 'Личный кабинет';
                    try { 
                        if (typeof this.renderProfile !== 'function') {
                            throw new Error('Функция renderProfile не найдена');
                        }
                        content.innerHTML = await this.renderProfile(); 
                        console.log('profile rendered successfully');
                    } catch(e) { 
                        console.error('renderProfile error:', e); 
                        content.innerHTML = '<div class="empty-state"><div class="empty-state-title">Ошибка загрузки страницы: ' + e.message + '</div></div>'; 
                    }
                    breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Профиль</span>';
                }
                else if (pageId === 'manager-products') {
                    if (this.currentUser?.role === 'Manager') {
                        header.innerText = 'Управление товарами';
                        content.innerHTML = await this.renderManagerProducts();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Управление товарами</span>';
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'manager-orders') {
                    if (this.currentUser?.role === 'Manager') {
                        header.innerText = 'Управление заказами';
                        content.innerHTML = await this.renderManagerOrders();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Управление заказами</span>';
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'manager-low-stock') {
                    if (this.currentUser?.role === 'Manager') {
                        header.innerText = 'Заканчивающиеся товары';
                        content.innerHTML = await this.renderManagerLowStock();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Заканчивающиеся товары</span>';
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'manager-analytics') {
                    if (this.currentUser?.role === 'Manager') {
                        header.innerText = 'Аналитика';
                        content.innerHTML = await this.renderManagerAnalytics();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Аналитика</span>';

                        // После отрисовки аналитики инициализируем графики
                        try {
                            if (typeof this.updateSalesChart === 'function') {
                                this.updateSalesChart();
                            }
                            if (typeof this.updatePopularProducts === 'function') {
                                this.updatePopularProducts();
                            }
                            if (typeof this.updateCategoryStats === 'function') {
                                this.updateCategoryStats();
                            }
                        } catch (err) {
                            console.error('Manager analytics init error:', err);
                        }
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'admin-products') {
                    if (this.currentUser?.role === 'Admin') {
                        header.innerText = 'Управление товарами';
                        content.innerHTML = await this.renderAdminProducts();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Товары</span>';
                        
                        // Populate filters and render table after rendering
                        setTimeout(() => {
                            this.populateAdminProductsFilters();
                            this.renderProductsTable();
                        }, 100);
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'admin-categories') {
                    if (this.currentUser?.role === 'Admin') {
                        header.innerText = 'Управление категориями';
                        content.innerHTML = await this.renderAdminCategories();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Категории</span>';
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'admin-users') {
                    if (this.currentUser?.role === 'Admin') {
                        header.innerText = 'Управление пользователями';
                        content.innerHTML = await this.renderAdminUsers();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Пользователи</span>';
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'admin-registrations') {
                    if (this.currentUser?.role === 'Admin') {
                        header.innerText = 'Модерация регистраций';
                        content.innerHTML = await window.registrationsModule.renderPendingRegistrations();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Модерация регистраций</span>';
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'admin-orders') {
                    if (this.currentUser?.role === 'Admin') {
                        header.innerText = 'Управление заказами';
                        content.innerHTML = await this.renderAdminOrders();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Заказы</span>';
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'admin-analytics') {
                    if (this.currentUser?.role === 'Admin') {
                        header.innerText = 'Аналитика';
                        content.innerHTML = await this.renderManagerAnalytics();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Аналитика</span>';

                        // После отрисовки аналитики инициализируем графики
                        try {
                            if (typeof this.updateSalesChart === 'function') {
                                this.updateSalesChart();
                            }
                            if (typeof this.updatePopularProducts === 'function') {
                                this.updatePopularProducts();
                            }
                            if (typeof this.updateCategoryStats === 'function') {
                                this.updateCategoryStats();
                            }
                        } catch (err) {
                            console.error('Admin analytics init error:', err);
                        }
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'admin-import') {
                    if (this.currentUser?.role === 'Admin') {
                        header.innerText = 'Импорт/Экспорт товаров';
                        content.innerHTML = await this.renderAdminImport();
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Импорт/Экспорт</span>';
                    } else {
                        this.showAccessDenied();
                    }
                }
                else if (pageId === 'admin') {
                    // Redirect old admin page to admin-products
                    this.nav('admin-products');
                    return;
                }
                else if (pageId === 'comparison') {
                    header.innerText = 'Сравнение товаров';
                    await this.showComparisonView();
                    breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Сравнение</span>';
                }
                else if (pageId.startsWith('product-')) {
                    // Handle product detail page: product-{id}
                    const productId = parseInt(pageId.split('-')[1]);
                    if (!isNaN(productId)) {
                        header.innerText = 'Детали товара';
                        await this.showProductDetail(productId);
                        breadcrumbHtml += '<span class="breadcrumb-separator">/</span><span class="breadcrumb-item">Товар</span>';
                    } else {
                        header.innerText = 'Страница не найдена';
                        content.innerHTML = this.renderProductNotFound();
                    }
                }
                else {
                    header.innerText = 'Страница не найдена';
                    content.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="empty-state-title">Страница не найдена</div>
                            <button class="btn btn-primary mt-4" onclick="app.nav('dashboard')">
                                <i class="fas fa-arrow-left"></i> Вернуться на главную
                            </button>
                        </div>
                    `;
                }

                breadcrumb.innerHTML = breadcrumbHtml;
                
                // Show/hide mobile search bar based on page
                const mobileSearchBar = document.getElementById('mobile-search-bar');
                if (mobileSearchBar) {
                    if (pageId === 'products') {
                        mobileSearchBar.style.display = 'block';
                        // Sync search values
                        const desktopSearch = document.getElementById('filter-search');
                        const mobileSearch = document.getElementById('mobile-filter-search');
                        if (desktopSearch && mobileSearch && desktopSearch.value) {
                            mobileSearch.value = desktopSearch.value;
                        }
                    } else {
                        mobileSearchBar.style.display = 'none';
                    }
                }
                
                // Update body class for page-specific styling
                document.body.className = document.body.className.replace(/page-\w+/g, '');
                document.body.classList.add(`page-${pageId}`);
                
                // Update bottom navigation active state
                if (this.updateBottomNavActive) {
                    this.updateBottomNavActive(pageId);
                }
                
                // Update mobile sidebar active state
                if (this.updateMobileSidebarActive) {
                    this.updateMobileSidebarActive(pageId);
                }
            },

            // Update bottom navigation active state
            updateBottomNav(pageId) {
                const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
                bottomNavItems.forEach(item => {
                    const itemPage = item.getAttribute('data-page');
                    if (itemPage === pageId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            },

            // Update cart badge in bottom navigation
            updateCartBadge() {
                const cartCount = this.cart?.items?.length || 0;
                const totalItems = this.cart?.totalItems || cartCount;
                
                // Update nav config
                const cartItem = this.navConfig.find(item => item.id === 'cart');
                if (cartItem) {
                    cartItem.badge = totalItems > 0 ? totalItems : null;
                }
                
                // Update header cart badge
                const badge = document.getElementById('cart-badge');
                if (badge) {
                    if (totalItems > 0) {
                        badge.innerText = totalItems;
                        badge.style.display = 'flex';
                    } else {
                        badge.style.display = 'none';
                    }
                }
                
                // Update bottom nav cart badge
                const bottomBadge = document.getElementById('bottom-nav-cart-badge');
                if (bottomBadge) {
                    if (totalItems > 0) {
                        bottomBadge.innerText = totalItems;
                        bottomBadge.style.display = 'flex';
                    } else {
                        bottomBadge.style.display = 'none';
                    }
                }
                
                // Update header favorites badge
            },
            
            // Update comparison badge
            updateComparisonBadge() {
                const comparisonCount = ComparisonManager.getCount();
                
                // Update header comparison badge
                const badge = document.getElementById('comparison-badge');
                if (badge) {
                    if (comparisonCount > 0) {
                        badge.innerText = comparisonCount;
                        badge.style.display = 'flex';
                    } else {
                        badge.style.display = 'none';
                    }
                }
                
                // Update dashboard comparison badge
                const dashboardBadge = document.getElementById('dashboard-comparison-badge');
                if (dashboardBadge) {
                    if (comparisonCount > 0) {
                        dashboardBadge.innerText = comparisonCount;
                        dashboardBadge.style.display = 'flex';
                    } else {
                        dashboardBadge.style.display = 'none';
                    }
                }
            },
            
            // Update notifications badge
            async updateNotificationsBadge() {
                try {
                    // Skip if guest mode OR admin/manager (notifications only for customers)
                    if (this.isGuestMode || this.currentUser?.role === 'Admin' || this.currentUser?.role === 'Manager') {
                        this.unreadNotifications = 0;
                        return;
                    }
                    
                    // Fetch notifications
                    const notifications = await this.fetchApi('notifications');
                    
                    // Count unread notifications
                    const unreadCount = notifications ? notifications.filter(n => !n.isRead).length : 0;
                    this.unreadNotifications = unreadCount;
                    
                    // Update nav config
                    const notificationsItem = this.navConfig.find(item => item.id === 'notifications');
                    if (notificationsItem) {
                        notificationsItem.badge = unreadCount > 0 ? unreadCount : 0;
                    }
                    
                    // Update mobile menu if it exists
                    if (this.renderMobileSidebar && typeof this.renderMobileSidebar === 'function') {
                        this.renderMobileSidebar();
                    }
                    
                    console.log(`Непрочитанных уведомлений: ${unreadCount}`);
                } catch (error) {
                    console.warn('Ошибка загрузки уведомлений:', error);
                    this.unreadNotifications = 0;
                }
            },
            
            // Update header favorites badge
            updateFavoritesBadge() {
                const headerFavoritesBadge = document.getElementById('favorites-badge');
                if (headerFavoritesBadge && this.favorites) {
                    if (this.favorites.length > 0) {
                        headerFavoritesBadge.textContent = this.favorites.length;
                        headerFavoritesBadge.style.display = 'block';
                    } else {
                        headerFavoritesBadge.style.display = 'none';
                    }
                }
                
                // Re-render menu
                this.renderMenu();
            },

});