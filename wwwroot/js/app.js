// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// ===== SECURITY UTILITIES =====
// XSS Protection - экранирование HTML
window.escapeHtml = function(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Безопасная вставка текста (без HTML)
window.setTextContent = function(element, text) {
    if (element) {
        element.textContent = text || '';
    }
};

// Безопасная вставка HTML (только для доверенного контента)
window.setInnerHTML = function(element, html) {
    if (element) {
        element.innerHTML = window.escapeHtml(html);
    }
};

// ===== MAIN APP OBJECT =====
// Core app definition with state, configuration, and initialization
// This file must be loaded FIRST among app files
        window.app = {
            // API Configuration - Автоматическое определение (работает на любом порту и в локальной сети)
            apiBaseUrl: `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api`,
            currentUserId: 3, // Используем пользователя с ID 3 как в вашей базе
            isGuestMode: false, // Guest mode - show catalog without prices

            // Helper to check if user can see prices
            canSeePrices() {
                // Админ и Менеджер тоже могут видеть цены
                return !this.isGuestMode && this.currentUser && 
                       (this.currentUser.role === 'Customer' || this.currentUser.role === 'Admin' || this.currentUser.role === 'Manager');
            },

            // Helper to check if user can add to cart
            canAddToCart() {
                // Только клиенты могут добавлять в корзину
                return !this.isGuestMode && this.currentUser && this.currentUser.role === 'Customer';
            },

            // Helper to check if user can use favorites
            canUseFavorites() {
                // Только клиенты могут использовать избранное
                return !this.isGuestMode && this.currentUser && this.currentUser.role === 'Customer';
            },

            // Render mobile sidebar menu
            renderMobileSidebar() {
                const content = document.getElementById('mobile-sidebar-content');
                if (!content) {
                    console.log('mobile-sidebar-content не найден');
                    return;
                }
                if (!this.navConfig) {
                    console.log('navConfig не найден');
                    return;
                }

                console.log('🔄 Генерация мобильного меню');
                console.log('Текущий пользователь:', this.currentUser);
                console.log('Роль пользователя:', this.currentUser?.role);

                let html = '';

                this.navConfig.forEach(item => {
                    // Пропускаем элементы по ролям
                    if (item.adminOnly && this.currentUser?.role !== 'Admin') {
                        console.log(`Пропускаем ${item.title} (adminOnly, роль: ${this.currentUser?.role})`);
                        return;
                    }
                    // Для админа НЕ показываем менеджерские пункты (у админа свои)
                    if (item.managerOnly && this.currentUser?.role === 'Admin') {
                        console.log(`Пропускаем ${item.title} (managerOnly, но роль Admin)`);
                        return;
                    }
                    if (item.managerOnly && this.currentUser?.role !== 'Manager' && this.currentUser?.role !== 'Admin') {
                        console.log(`Пропускаем ${item.title} (managerOnly, роль: ${this.currentUser?.role})`);
                        return;
                    }
                    if (item.customerOnly && (this.currentUser?.role === 'Manager' || this.currentUser?.role === 'Admin')) {
                        console.log(`Пропускаем ${item.title} (customerOnly, роль: ${this.currentUser?.role})`);
                        return;
                    }
                    
                    console.log(`✅ Добавляем в меню: ${item.title}`);

                    const isActive = item.id === this.currentPage;
                    const badge = item.badge && item.badge > 0 ? `<span class="mobile-menu-badge">${item.badge}</span>` : '';

                    html += `
                        <div class="mobile-sidebar-item ${isActive ? 'active' : ''}" data-page-id="${item.id}">
                            <i class="fas fa-${item.icon}"></i>
                            <span>${item.title}</span>
                            ${badge}
                        </div>
                    `;
                });

                // Добавляем кнопку выхода
                html += `
                    <div class="mobile-sidebar-divider"></div>
                    <div class="mobile-sidebar-item" data-action="logout">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Выход</span>
                    </div>
                `;

                content.innerHTML = html;
                
                // Добавляем обработчики событий после создания HTML
                const items = content.querySelectorAll('.mobile-sidebar-item[data-page-id]');
                items.forEach(item => {
                    item.addEventListener('click', () => {
                        const pageId = item.getAttribute('data-page-id');
                        console.log('Клик по пункту меню:', pageId);
                        this.closeMobileSidebar();
                        setTimeout(() => {
                            if (typeof this.nav === 'function') {
                                console.log('Вызов app.nav:', pageId);
                                this.nav(pageId);
                            } else {
                                console.error('app.nav не является функцией!');
                            }
                        }, 100);
                    });
                });
                
                // Обработчик для кнопки выхода
                const logoutBtn = content.querySelector('.mobile-sidebar-item[data-action="logout"]');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        console.log('Клик по кнопке выхода');
                        this.closeMobileSidebar();
                        setTimeout(() => {
                            // Используем this.logout() - стрелочная функция сохраняет контекст
                            this.logout();
                        }, 100);
                    });
                }
            },

            // Open mobile sidebar
            openMobileSidebar() {
                const menu = document.getElementById('mobile-sidebar-menu');
                if (menu) {
                    menu.classList.add('active');
                    menu.style.visibility = 'visible';
                    menu.style.opacity = '1';
                    menu.style.pointerEvents = 'all';
                    const panel = document.getElementById('mobile-sidebar-panel');
                    if (panel) {
                        panel.style.transform = 'translateX(0)';
                    }
                    document.body.style.overflow = 'hidden';
                }
            },

            // Close mobile sidebar
            closeMobileSidebar() {
                const menu = document.getElementById('mobile-sidebar-menu');
                if (menu) {
                    menu.classList.remove('active');
                    menu.style.visibility = 'hidden';
                    menu.style.opacity = '0';
                    menu.style.pointerEvents = 'none';
                    const panel = document.getElementById('mobile-sidebar-panel');
                    if (panel) {
                        panel.style.transform = 'translateX(-100%)';
                    }
                    document.body.style.overflow = '';
                }
            },

            // Update header buttons based on guest mode
            updateHeaderForGuestMode() {
                const profileBtnContainer = document.getElementById('header-profile-btn');
                const bottomNavLogin = document.getElementById('bottom-nav-login');
                const bottomNavProfile = document.getElementById('bottom-nav-profile');
                
                if (this.isGuestMode) {
                    // Show login/register button for guests
                    if (profileBtnContainer) {
                        profileBtnContainer.innerHTML = `
                            <button class="header-icon-btn guest-only" onclick="window.location.href='login.html'" title="Вход / Регистрация" style="display: inline-flex !important;">
                                <i class="fas fa-user-plus"></i>
                            </button>
                        `;
                    }
                    // Update bottom nav
                    if (bottomNavLogin) bottomNavLogin.style.display = 'flex';
                    if (bottomNavProfile) bottomNavProfile.style.display = 'none';
                } else {
                    // Show profile button for logged in users
                    if (profileBtnContainer) {
                        profileBtnContainer.innerHTML = `
                            <button class="header-icon-btn" onclick="app.nav('profile')" title="Личный кабинет">
                                <i class="fas fa-user"></i>
                            </button>
                        `;
                    }
                    // Update bottom nav
                    if (bottomNavLogin) bottomNavLogin.style.display = 'none';
                    if (bottomNavProfile) bottomNavProfile.style.display = 'flex';
                }
            },

            // Viewport State
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                breakpoint: 'desktop',
                isMobile: false,
                isTouch: false,
                
                update() {
                    this.width = window.innerWidth;
                    this.height = window.innerHeight;
                    this.breakpoint = this.getBreakpoint();
                    this.isMobile = this.width < 768;
                    this.isTouch = 'ontouchstart' in window;
                    
                    // Update body class
                    document.body.className = document.body.className.replace(/breakpoint-\w+/g, '');
                    document.body.classList.add(`breakpoint-${this.breakpoint}`);
                    
                    // Update role class
                    if (app.currentUser) {
                        document.body.classList.add(`role-${app.currentUser.role.toLowerCase()}`);
                    }
                },
                
                getBreakpoint() {
                    if (this.width < 480) return 'small-mobile';
                    if (this.width < 768) return 'mobile';
                    if (this.width < 1025) return 'tablet';
                    return 'desktop';
                },
                
                isSmallMobile() {
                    return this.breakpoint === 'small-mobile';
                },
                
                isMobileDevice() {
                    return this.breakpoint === 'small-mobile' || this.breakpoint === 'mobile';
                },
                
                isTablet() {
                    return this.breakpoint === 'tablet';
                },
                
                isDesktop() {
                    return this.breakpoint === 'desktop';
                }
            },

            // State
            currentPage: 'dashboard',
            previousPage: null,
            products: [],
            categories: [],
            cart: null,
            orders: [],
            categorySearchTimeout: null,
            currentProduct: null,
            filterTimeout: null,
            sortDirection: 'asc',
            
            // Pagination state
            currentProductPage: 1,
            productsPerPage: 40,
            totalProducts: 0,
            totalPages: 0,

            // Navigation configuration
            navConfig: [
                { id: 'dashboard', icon: 'home', title: 'Главная', badge: null },
                { id: 'products', icon: 'tools', title: 'Каталог', badge: null },
                { id: 'favorites', icon: 'heart', title: 'Избранное', badge: 0, customerOnly: true },
                { id: 'notifications', icon: 'bell', title: 'Уведомления', badge: 0, customerOnly: true },
                { id: 'orders', icon: 'list', title: 'Мои заказы', badge: null, customerOnly: true },
                { id: 'manager-products', icon: 'tools', title: 'Управление товарами', badge: null, managerOnly: true },
                { id: 'manager-orders', icon: 'list', title: 'Управление заказами', badge: null, managerOnly: true },
                { id: 'manager-low-stock', icon: 'exclamation-triangle', title: 'Заканчивающиеся товары', badge: null, managerOnly: true },
                { id: 'manager-analytics', icon: 'chart-bar', title: 'Аналитика', badge: null, managerOnly: true },
                { id: 'admin-products', icon: 'boxes', title: 'Товары', badge: null, adminOnly: true },
                { id: 'admin-categories', icon: 'folder', title: 'Категории', badge: null, adminOnly: true },
                { id: 'admin-users', icon: 'users', title: 'Пользователи', badge: null, adminOnly: true },
                { id: 'admin-registrations', icon: 'user-check', title: 'Модерация регистраций', badge: null, adminOnly: true },
                { id: 'admin-orders', icon: 'shopping-cart', title: 'Заказы', badge: null, adminOnly: true },
                { id: 'admin-analytics', icon: 'chart-bar', title: 'Аналитика', badge: null, adminOnly: true },
                { id: 'admin-import', icon: 'upload', title: 'Импорт/Экспорт', badge: null, adminOnly: true }
            ],

            // Initialize application
            async init() {
                console.log('Инициализация приложения...');

                // Initialize viewport detection
                this.viewport.update();
                
                // Add resize listener with debounce
                let resizeTimeout;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => {
                        this.viewport.update();
                        console.log(`Viewport changed: ${this.viewport.breakpoint} (${this.viewport.width}px)`);
                    }, 250);
                });

                // Check authentication
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || 'null');

                if (!token || !user) {
                    // Guest mode - app works without auth, just hide prices
                    this.isGuestMode = true;
                    document.body.classList.add('guest-mode');
                    console.log('Гостевой режим - цены скрыты');
                } else {
                    this.isGuestMode = false;
                }

                // Continue with user info only if logged in
                if (!this.isGuestMode && user) {
                    // Set user info from stored data
                    this.currentUser = user;
                    this.currentUserId = user.id;
                    
                    console.log('✅ Установлен текущий пользователь:', this.currentUser);
                    console.log('✅ Роль пользователя:', this.currentUser.role);

                    document.getElementById('user-name').innerText = user.fullName;
                    document.getElementById('user-role-label').innerText = user.role === 'Admin' ? 'Администратор' : user.role === 'Manager' ? 'Менеджер' : user.fullName;
                    document.getElementById('user-avatar').innerHTML = user.fullName.charAt(0).toUpperCase();

                    // Add role class to body for CSS styling
                    document.body.className = `role-${user.role.toLowerCase()}`;

                    // Update nav based on role
                    this.updateNavForRole(user.role);

                    // Render navigation menu
                    this.renderMenu();
                }

                // Сразу показываем страницу — и для гостей, и для авторизованных
                this.nav('dashboard');
                
                // Render bottom navigation
                if (this.renderBottomNav) {
                    this.renderBottomNav();
                }
                
                // ⚠️ КРИТИЧЕСКИ ВАЖНО: Рендерим мобильное меню ПОСЛЕ установки currentUser
                // И ТОЛЬКО на мобильных устройствах (ширина <= 767px)
                if (this.viewport.isMobileDevice()) {
                    console.log('📱 Мобильное устройство обнаружено');
                    console.log('🔄 Вызов renderMobileSidebar ПОСЛЕ установки currentUser');
                    console.log('Viewport:', this.viewport.breakpoint, 'Width:', this.viewport.width);
                    console.log('CurrentUser:', this.currentUser);
                    console.log('Role:', this.currentUser?.role);
                    
                    // Задержка 300ms для гарантии загрузки всех данных
                    setTimeout(() => {
                        if (this.renderMobileSidebar) {
                            console.log('✅ Вызываем renderMobileSidebar');
                            this.renderMobileSidebar();
                        } else {
                            console.error('❌ renderMobileSidebar не найден!');
                        }
                    }, 300);
                } else {
                    console.log('💻 Десктоп устройство - мобильное меню не требуется');
                }
                
                this.updateCartBadge();
                this.updateComparisonBadge();
                this.updateHeaderForGuestMode();

                // Listen for comparison changes
                window.addEventListener('comparison-changed', () => {
                    this.updateComparisonBadge();
                });

                // Start carousel auto-play
                this.startCarouselAutoPlay();

                // Add scroll listener for scroll-to-top button
                const contentArea = document.getElementById('content-mount');
                if (contentArea) {
                    contentArea.addEventListener('scroll', () => this.handleScroll());
                }

                // Close search dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    const searchBar = document.querySelector('.search-bar-main');
                    const dropdown = document.getElementById('dashboard-search-dropdown');
                    if (dropdown && searchBar && !searchBar.contains(e.target)) {
                        dropdown.style.display = 'none';
                    }
                });

                // Загружаем данные в фоне (не блокируем интерфейс)
                console.log('Загрузка начальных данных в фоне...');
                
                // В гостевом режиме загружаем только базовые данные
                // loadProducts будет вызвана после загрузки products.js
                if (this.loadProducts) {
                    this.loadProducts(false).catch(e => console.warn('loadProducts error:', e));
                }
                if (this.loadCategories) {
                    this.loadCategories().catch(e => console.warn('loadCategories error:', e));
                }
                if (this.loadFilters) {
                    this.loadFilters().catch(e => console.warn('loadFilters error:', e));
                }
                // loadImagesMapping вызывается, если доступен
                if (typeof this.loadImagesMapping === 'function') {
                    this.loadImagesMapping().catch(e => console.warn('loadImagesMapping error:', e));
                }
                
                // Добавляем только для авторизованных пользователей
                if (!this.isGuestMode && user) {
                    if (this.loadCart && typeof this.loadCart === 'function') {
                        Promise.resolve(this.loadCart()).catch(e => console.warn('loadCart error:', e));
                    }
                    if (this.loadOrders && typeof this.loadOrders === 'function') {
                        Promise.resolve(this.loadOrders()).catch(e => console.warn('loadOrders error:', e));
                    }
                    if (this.loadFavorites && typeof this.loadFavorites === 'function') {
                        this.loadFavorites();
                    }
                    
                    // Загружаем количество заявок на модерацию для админа
                    if (user.role === 'Admin' && window.registrationsModule?.updatePendingCount) {
                        Promise.resolve(window.registrationsModule.updatePendingCount()).catch(e => console.warn('updatePendingCount error:', e));
                    }
                    
                    // Загружаем количество непрочитанных уведомлений
                    if (this.updateNotificationsBadge && typeof this.updateNotificationsBadge === 'function') {
                        this.updateNotificationsBadge().catch(e => console.warn('updateNotificationsBadge error:', e));
                    }
                }
                
                // After data loads, render dashboard
                setTimeout(() => {
                    this.updateCartBadge();
                    this.updateComparisonBadge();
                    // Обновляем контент только если пользователь всё ещё на стартовой странице
                    if (this.currentPage === 'dashboard') {
                        const content = document.getElementById('content-mount');
                        if (content) content.innerHTML = this.renderDashboard();
                    }
                }, 500);
            },

            // Update navigation based on role
            updateNavForRole(role) {
                // Currently, navigation is the same for all roles
                // Admin could have additional menu items in the future
                if (role === 'Admin') {
                    // Admin specific navigation updates can be added here
                }
            },

            // Demo login functions
            async demoLogin(role) {
                try {
                    let credentials;
                    if (role === 'admin') {
                        credentials = {
                            email: 'admin@toolshop.by',
                            password: 'admin123'
                        };
                    } else if (role === 'customer') {
                        credentials = {
                            email: 'company@toolshop.by',
                            password: 'company123'
                        };
                    }

                    const result = await this.fetchApi('auth/login', {
                        method: 'POST',
                        body: JSON.stringify(credentials)
                    });

                    if (result && result.token) {
                        // Store auth data
                        localStorage.setItem('token', result.token);
                        localStorage.setItem('user', JSON.stringify(result.user));

                        this.showToast(`Вход выполнен как ${role === 'admin' ? 'администратор' : 'клиент'}`, 'success');

                        // Reload page to initialize with new user
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        this.showToast('Ошибка входа', 'error');
                    }
                } catch (error) {
                    this.showToast('Ошибка подключения', 'error');
                }
            },

            // Admin import functions
            handleAdminFileSelect() {
                const fileInput = document.getElementById('admin-import-file');
                const selectedFileDiv = document.getElementById('admin-selected-file');
                const importBtn = document.getElementById('admin-import-btn');

                if (fileInput.files && fileInput.files[0]) {
                    const file = fileInput.files[0];
                    selectedFileDiv.textContent = `Выбран файл: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                    importBtn.disabled = false;
                } else {
                    selectedFileDiv.textContent = '';
                    importBtn.disabled = true;
                }
            },

            async uploadAndImport() {
                const fileInput = document.getElementById('admin-import-file');
                const mode = document.getElementById('import-mode').value;
                const isDryRun = document.getElementById('import-dry-run').checked;
                const importBtn = document.getElementById('admin-import-btn');

                if (!fileInput.files || !fileInput.files[0]) {
                    this.showToast('Выберите файл для импорта', 'error');
                    return;
                }

                const file = fileInput.files[0];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('mode', mode);
                formData.append('isDryRun', isDryRun);

                importBtn.disabled = true;
                importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Импорт...';

                try {
                    const response = await fetch(`${this.apiBaseUrl}/import/upload?mode=${mode}&isDryRun=${isDryRun}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: formData
                    });

                    const result = await response.json();

                    if (response.ok && result.importJobId) {
                        this.showToast('Файл загружен! Начинаем обработку...', 'success');

                        // Start execution
                        const executeResult = await this.fetchApi(`import/execute/${result.importJobId}`, {
                            method: 'POST'
                        });

                        if (executeResult) {
                            this.showToast(`Импорт завершен! Обработано: ${executeResult.processedRows}, ошибок: ${executeResult.errorsCount}`, 'success');

                            // Clear file input
                            fileInput.value = '';
                            document.getElementById('admin-selected-file').textContent = '';
                            importBtn.disabled = true;

                            // Refresh products data
                            await this.loadProducts();
                        } else {
                            this.showToast('Ошибка при выполнении импорта', 'error');
                        }
                    } else {
                        const errors = result.errors ? result.errors.join('\n') : 'Неизвестная ошибка';
                        this.showToast(`Ошибка загрузки: ${errors}`, 'error');
                    }
                } catch (error) {
                    this.showToast('Ошибка при импорте товаров', 'error');
                } finally {
                    importBtn.disabled = false;
                    importBtn.innerHTML = '<i class="fas fa-upload"></i> Загрузить и импортировать';
                }
            },

            downloadSampleCsv() {
                const csvContent = `Артикул,Название,Описание,Цена,Количество,Категория,Attr_Бренд,Attr_Мощность
BOSCH-GSB-18,Дрель Bosch GSB 18,Ударная дрель 18V Li-Ion с быстрозажимным патроном,189.99,15,Электроинструмент,Bosch,600 Вт
MAKITA-DF330,Перфоратор Makita DF330,Профессиональный перфоратор 800Вт с функцией долбления,279.50,8,Электроинструмент,Makita,800 Вт
DEWALT-DWE4050,УШМ DeWalt DWE4050,Угловая шлифмашина 125мм 850Вт с плавным пуском,159.90,20,Электроинструмент,DeWalt,850 Вт
STANLEY-SET-65,Набор инструментов Stanley,65 предметов в пластиковом кейсе,149.99,12,Ручной инструмент,Stanley,
KNIPEX-8603,Кусачки Knipex 8603,Бокорезы хром-ванадий 180мм,42.50,30,Ручной инструмент,Knipex,180мм
BAHCO-1-110-10,Отвертки Bahco 1-110-10,Набор 10 изолированных отверток,89.90,25,Ручной инструмент,Bahco,
RESANTA-SAI-190,Сварочный аппарат Resanta,Инверторный сварочник MMA/TIG 190А,329.99,6,Сварочное оборудование,Resanta,190А
BLUEWELD-PRO-250,Сварочник BlueWeld Pro-250,Многофункциональный аппарат 250А,499.00,4,Сварочное оборудование,BlueWeld,250А
FUBAG-ECO-24,Компрессор Fubag Eco-24,Поршневой компрессор 24л 1.5кВт,169.50,10,Компрессоры,Fubag,24л
ABAC-B3800,Компрессор Abac B3800,Масляный компрессор 50л 2.2кВт,699.99,3,Компрессоры,Abac,50л`;

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `sample_products_import.csv`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                this.showToast('Образец CSV файла скачан', 'success');
            },

            // Pricing management functions
            async showCustomerGroups() {
                this.showToast('Функция управления группами клиентов в разработке', 'info');
            },

            async showIndividualPrices() {
                this.showToast('Функция управления индивидуальными ценами в разработке', 'info');
            },

            async showPriceRules() {
                this.showToast('Функция управления правилами ценообразования в разработке', 'info');
            },

            // Logout function

    // showConfirmModal - Confirmation dialog utility
            showConfirmModal(options) {
                const {
                    title = 'Подтверждение',
                    message = 'Вы уверены?',
                    confirmText = 'Подтвердить',
                    cancelText = 'Отмена',
                    confirmClass = 'btn-primary',
                    onConfirm = () => {},
                    onCancel = () => {}
                } = options;

                // Remove existing modal if any
                const existingModal = document.getElementById('confirm-modal');
                if (existingModal) {
                    existingModal.remove();
                }

                // Create modal
                const modal = document.createElement('div');
                modal.id = 'confirm-modal';
                modal.className = 'modal-overlay';
                modal.style.cssText = 'display: flex; align-items: center; justify-content: center;';
                
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 450px; animation: modalSlideIn 0.3s ease;">
                        <div class="modal-header">
                            <h3 style="margin: 0;">${title}</h3>
                            <button class="modal-close" onclick="document.getElementById('confirm-modal').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p style="margin: 0; line-height: 1.6;">${message}</p>
                        </div>
                        <div class="modal-footer" style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button class="btn btn-outline" id="confirm-cancel-btn">${cancelText}</button>
                            <button class="btn ${confirmClass}" id="confirm-ok-btn">${confirmText}</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);

                // Add event listeners
                document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
                    modal.remove();
                    onCancel();
                });

                document.getElementById('confirm-ok-btn').addEventListener('click', () => {
                    modal.remove();
                    onConfirm();
                });

                // Close on overlay click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                        onCancel();
                    }
                });

                // Add animation CSS if not present
                if (!document.getElementById('modal-animations')) {
                    const style = document.createElement('style');
                    style.id = 'modal-animations';
                    style.textContent = `
                        @keyframes modalSlideIn {
                            from {
                                transform: translateY(-50px);
                                opacity: 0;
                            }
                            to {
                                transform: translateY(0);
                                opacity: 1;
                            }
                        }
                    `;
                    document.head.appendChild(style);
                }
            },

    // showToast - UI notification utility
            showToast(message, type = 'info') {
                // Create toast element
                const toast = document.createElement('div');
                const bgColor = type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--info)';
                toast.style.cssText = [
                    'position: fixed; bottom: 24px; right: 24px;',
                    'background: ' + bgColor + '; color: white; padding: 16px 24px;',
                    'border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 1000;',
                    'display: flex; align-items: center; gap: 12px; max-width: 400px;',
                    'animation: slideIn 0.3s ease;'
                ].join(' ');

                const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';

                toast.innerHTML = '<i class="fas fa-' + icon + '" style="font-size: 1.2rem;"></i><div>' + (message || '') + '</div>';

                document.body.appendChild(toast);

                // Remove toast after 3 seconds
                setTimeout(() => {
                    toast.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        document.body.removeChild(toast);
                    }, 300);
                }, 3000);

                // Add CSS for animations if not already present
                if (!document.getElementById('toast-animations')) {
                    const style = document.createElement('style');
                    style.id = 'toast-animations';
                    style.textContent = [
                        '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }',
                        '@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }'
                    ].join('\n');
                    document.head.appendChild(style);
                }
            }
        };

document.addEventListener('DOMContentLoaded', function () {
    app.init();
});

// ===== SIDEBAR BANNER RENDERING =====
// Render sidebar product banner with random product from specific categories
app.renderSidebarBanner = function() {
    const bannerContainer = document.getElementById('sidebar-banner');
    if (!bannerContainer) {
        console.log('[v1027] sidebar-banner container not found');
        return;
    }
    
    if (!this.products || this.products.length === 0) {
        console.log('[v1027] No products loaded yet');
        return;
    }
    
    // Filter products by categories: "Электроинструмент" or "Компрессоры"
    const eligibleProducts = this.products.filter(p => 
        p.categoryName === 'Электроинструмент' || p.categoryName === 'Компрессоры'
    );
    
    // Fallback: if no products in these categories, use any product
    const productsToUse = eligibleProducts.length > 0 ? eligibleProducts : this.products;
    
    // Select random product
    const randomProduct = productsToUse[Math.floor(Math.random() * productsToUse.length)];
    
    if (!randomProduct) {
        console.log('[v1027] No product selected for banner');
        return;
    }
    
    console.log('[v1027] Selected product for banner:', randomProduct);
    
    // Get product image URL
    const imageUrl = this.getProductImage ? this.getProductImage(randomProduct.id) : null;
    
    // Get product description from database (truncate if too long)
    // Priority: description field > categoryName > default text
    let description = '';
    if (randomProduct.description && randomProduct.description.trim()) {
        description = randomProduct.description.trim();
    } else if (randomProduct.categoryName) {
        description = randomProduct.categoryName;
    } else {
        description = 'Профессиональный инструмент';
    }
    
    const shortDescription = description.length > 50 ? description.substring(0, 50) + '...' : description;
    
    console.log('[v1027] Product description:', description);
    console.log('[v1027] Short description:', shortDescription);
    
    // Format price if available and user can see prices
    let priceHTML = '';
    if (this.canSeePrices() && randomProduct.price) {
        priceHTML = `<div class="sidebar-banner-price">${randomProduct.price.toFixed(2)} BYN</div>`;
    }
    
    // Generate banner HTML
    const bannerHTML = `
        <div class="sidebar-banner-image">
            ${imageUrl ? 
                `<img src="${imageUrl}" alt="${window.escapeHtml(randomProduct.name)}">` : 
                '<i class="fas fa-tools"></i>'
            }
        </div>
        <div class="sidebar-banner-content">
            <div class="sidebar-banner-badge">BLACK ONYX</div>
            <div class="sidebar-banner-title">${window.escapeHtml(randomProduct.name)}</div>
            <div class="sidebar-banner-description">${window.escapeHtml(shortDescription)}</div>
            ${priceHTML}
        </div>
    `;
    
    bannerContainer.innerHTML = bannerHTML;
    bannerContainer.style.display = 'block';
    
    // Add click handler to navigate to product details
    bannerContainer.onclick = () => {
        if (this.nav && typeof this.nav === 'function') {
            this.nav('product-details', randomProduct.id);
        }
    };
    
    console.log('[v1027] Sidebar banner rendered successfully');
};

// Call renderSidebarBanner after products are loaded
const originalLoadProducts = app.loadProducts;
if (originalLoadProducts && typeof originalLoadProducts === 'function') {
    app.loadProducts = async function(...args) {
        const result = await originalLoadProducts.apply(this, args);
        // Render banner after products are loaded
        setTimeout(() => {
            if (this.renderSidebarBanner) {
                this.renderSidebarBanner();
            }
        }, 500);
        return result;
    };
}
