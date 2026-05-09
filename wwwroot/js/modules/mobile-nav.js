// ============================================================
// MOBILE NAVIGATION — Боковое меню (Hamburger)
// ============================================================

(function() {
    'use strict';

    console.log('=== MOBILE-NAV.JS ЗАГРУЖЕН ===');
    console.log('Версия: v=1010');
    console.log('Время загрузки:', new Date().toISOString());

    // Открыть боковое меню
    window.app = window.app || {};
    
    app.openMobileSidebar = function() {
        const menu = document.getElementById('mobile-sidebar-menu');
        if (menu) {
            menu.classList.add('active');
            document.body.style.overflow = 'hidden'; // Блокируем скролл
        }
    };

    // Закрыть боковое меню
    app.closeMobileSidebar = function() {
        const menu = document.getElementById('mobile-sidebar-menu');
        if (menu) {
            menu.classList.remove('active');
            document.body.style.overflow = ''; // Разблокируем скролл
        }
    };

    // Генерация меню при загрузке
    app.renderMobileSidebar = function() {
        const content = document.getElementById('mobile-sidebar-content');
        if (!content) {
            console.log('mobile-sidebar-content не найден');
            return;
        }
        if (!app.navConfig) {
            console.log('app.navConfig не найден');
            return;
        }

        console.log('Генерация мобильного меню');
        console.log('Текущий пользователь:', app.currentUser);
        console.log('Роль пользователя:', app.currentUser?.role);

        let html = '';

        app.navConfig.forEach(item => {
            // Пропускаем элементы по ролям
            if (item.adminOnly && app.currentUser?.role !== 'Admin') {
                console.log(`Пропускаем ${item.title} (adminOnly, роль: ${app.currentUser?.role})`);
                return;
            }
            if (item.managerOnly && app.currentUser?.role !== 'Manager' && app.currentUser?.role !== 'Admin') {
                console.log(`Пропускаем ${item.title} (managerOnly, роль: ${app.currentUser?.role})`);
                return;
            }
            if (item.customerOnly && (app.currentUser?.role === 'Manager' || app.currentUser?.role === 'Admin')) {
                console.log(`Пропускаем ${item.title} (customerOnly, роль: ${app.currentUser?.role})`);
                return;
            }
            
            console.log(`Добавляем в меню: ${item.title}`);

            const isActive = item.id === app.currentPage;
            const badge = item.badge && item.badge > 0 ? `<span class="badge">${item.badge}</span>` : '';

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
            item.addEventListener('click', function() {
                const pageId = this.getAttribute('data-page-id');
                console.log('Клик по пункту меню:', pageId);
                app.closeMobileSidebar();
                setTimeout(function() {
                    if (typeof app.nav === 'function') {
                        console.log('Вызов app.nav:', pageId);
                        app.nav(pageId);
                    } else {
                        console.error('app.nav не является функцией!');
                    }
                }, 100);
            });
        });
        
        // Обработчик для кнопки выхода
        const logoutBtn = content.querySelector('.mobile-sidebar-item[data-action="logout"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                console.log('Клик по кнопке выхода');
                if (typeof app.logout === 'function') {
                    app.logout();
                } else {
                    console.error('app.logout не является функцией!');
                }
            });
        }
    };

    // Обновление активного пункта меню
    app.updateMobileSidebarActive = function(pageId) {
        const items = document.querySelectorAll('.mobile-sidebar-item');
        items.forEach(item => {
            const onclick = item.getAttribute('onclick');
            if (onclick && onclick.includes(`'${pageId}'`)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };

})();
