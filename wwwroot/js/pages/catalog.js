// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Catalog/Filters module - filter and category sidebar functionality
// Must be loaded after app.js and core/api.js
Object.assign(app, {
            // Search debounce timeout
            filterTimeout: null,

            async toggleFilters() {
                const sidebar = document.getElementById('filters-sidebar');
                const overlay = document.getElementById('filters-overlay');

                if (sidebar.classList.contains('active')) {
                    this.closeFilters();
                } else {
                    // Load filter data
                    await this.loadFilters();

                    // Show sidebar and overlay
                    sidebar.classList.add('active');
                    overlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            },

            closeFilters() {
                const sidebar = document.getElementById('filters-sidebar');
                const overlay = document.getElementById('filters-overlay');

                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            },

            async toggleCategories() {
                const sidebar = document.getElementById('categories-sidebar');
                const overlay = document.getElementById('categories-overlay');

                if (sidebar.classList.contains('active')) {
                    this.closeCategories();
                } else {
                    // Load categories
                    await this.loadCategoriesForSidebar();

                    // Show sidebar and overlay
                    sidebar.classList.add('active');
                    overlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            },

            closeCategories() {
                const sidebar = document.getElementById('categories-sidebar');
                const overlay = document.getElementById('categories-overlay');

                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            },

            async loadCategoriesForSidebar() {
                const container = document.getElementById('categories-list-sidebar');
                if (!container) return;

                if (!this.categories || this.categories.length === 0) {
                    await this.loadCategories();
                }

                // Дождаться загрузки товаров
                if (!this.products || this.products.length === 0) {
                    await this.loadProducts();
                }

                console.log('Products loaded:', this.products.length);
                console.log('Categories loaded:', this.categories.length);

                const selectedCategoryId = document.getElementById('filter-category')?.value || '';

                // Маппинг категорий на иконки, цвета и ключевые слова для поиска фото
                const categoryConfig = {
                    'электроинструмент': { 
                        icon: 'fa-bolt', 
                        color: '#FF6B35',
                        keywords: ['дрель', 'шуруповерт', 'перфоратор', 'болгарка', 'пила', 'лобзик', 'фрезер', 'makita', 'bosch', 'dewalt']
                    },
                    'ручной инструмент': { 
                        icon: 'fa-hammer', 
                        color: '#004E89',
                        keywords: ['молоток', 'отвертка', 'ключ', 'плоскогубцы', 'пассатижи', 'кусачки', 'набор']
                    },
                    'измерительный': { 
                        icon: 'fa-ruler', 
                        color: '#F77F00',
                        keywords: ['рулетка', 'уровень', 'штангенциркуль', 'угольник', 'линейка', 'лазерный']
                    },
                    'крепеж': { 
                        icon: 'fa-bolt', 
                        color: '#06A77D',
                        keywords: ['винт', 'гайка', 'болт', 'саморез', 'шуруп', 'дюбель', 'анкер', 'метиз']
                    },
                    'оснастка': { 
                        icon: 'fa-cog', 
                        color: '#9B59B6',
                        keywords: ['сверло', 'диск', 'насадка', 'коронка', 'фреза', 'бур', 'пильный']
                    },
                    'сварочн': { 
                        icon: 'fa-fire', 
                        color: '#E74C3C',
                        keywords: ['сварочный', 'сварка', 'электрод', 'маска', 'инвертор', 'аппарат']
                    },
                    'компрессор': { 
                        icon: 'fa-wind', 
                        color: '#3498DB',
                        keywords: ['компрессор', 'пневматический', 'воздушный']
                    },
                    'автомобиль': { 
                        icon: 'fa-car', 
                        color: '#2C3E50',
                        keywords: ['автомобильный', 'авто', 'домкрат', 'набор инструментов', 'ключ']
                    },
                    'пневмат': { 
                        icon: 'fa-wind', 
                        color: '#16A085',
                        keywords: ['пневмо', 'пистолет', 'краскопульт', 'гайковерт']
                    },
                    'садов': { 
                        icon: 'fa-leaf', 
                        color: '#27AE60',
                        keywords: ['садовый', 'газонокосилка', 'триммер', 'секатор', 'кусторез']
                    },
                    'очистител': {
                        icon: 'fa-spray-can',
                        color: '#E67E22',
                        keywords: ['мойка', 'очиститель', 'керхер', 'karcher']
                    },
                    'сверл': {
                        icon: 'fa-circle-notch',
                        color: '#8E44AD',
                        keywords: ['сверло', 'бур', 'коронка']
                    },
                    'диск': {
                        icon: 'fa-compact-disc',
                        color: '#95A5A6',
                        keywords: ['диск', 'круг', 'отрезной', 'пильный']
                    }
                };

                const rootCategories = this.categories.filter(c => !c.parentId);

                let html = `
                    <div class="category-item-sidebar ${!selectedCategoryId ? 'active' : ''}" onclick="app.selectCategoryFromSidebar(null)">
                        <div class="category-icon-sidebar" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);">
                            <i class="fas fa-th-large"></i>
                        </div>
                        <div class="category-info-sidebar">
                            <div class="category-name-sidebar">Все товары</div>
                            <div class="category-count-sidebar">${this.totalProducts} товаров</div>
                        </div>
                    </div>
                `;

                rootCategories.forEach(category => {
                    const categoryProducts = this.products.filter(p => p.categoryId === category.id);
                    const productCount = categoryProducts.length;
                    const categoryName = category.name.toLowerCase();
                    const isSelected = selectedCategoryId == category.id;

                    console.log(`Category: ${category.name}, Products: ${productCount}`);

                    // Найти подходящую конфигурацию категории
                    let config = { icon: 'fa-cube', color: '#7F8C8D', keywords: [] };
                    for (const [key, data] of Object.entries(categoryConfig)) {
                        if (categoryName.includes(key)) {
                            config = data;
                            break;
                        }
                    }

                    // Умный поиск фото по ключевым словам
                    let bestProduct = null;
                    
                    // Сначала ищем по ключевым словам
                    if (config.keywords.length > 0) {
                        for (const keyword of config.keywords) {
                            const matches = categoryProducts.filter(p => 
                                p.imageUrl && 
                                p.name.toLowerCase().includes(keyword)
                            );
                            
                            if (matches.length > 0) {
                                // Берем товар с наибольшим остатком из найденных
                                bestProduct = matches.sort((a, b) => b.stock - a.stock)[0];
                                console.log(`Found by keyword "${keyword}":`, bestProduct.name, bestProduct.imageUrl);
                                break;
                            }
                        }
                    }
                    
                    // Если не нашли по ключевым словам, берем любой с фото и наибольшим остатком
                    if (!bestProduct) {
                        const withImages = categoryProducts.filter(p => p.imageUrl);
                        console.log(`Products with images in ${category.name}:`, withImages.length);
                        if (withImages.length > 0) {
                            bestProduct = withImages.sort((a, b) => b.stock - a.stock)[0];
                            console.log(`Best product:`, bestProduct.name, bestProduct.imageUrl);
                        }
                    }
                    
                    const imageUrl = bestProduct ? bestProduct.imageUrl : null;
                    console.log(`Final imageUrl for ${category.name}:`, imageUrl);

                    html += `
                        <div class="category-item-sidebar ${isSelected ? 'active' : ''}" onclick="app.selectCategoryFromSidebar(${category.id})">
                            <div class="category-icon-sidebar" style="background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%);">
                                ${imageUrl ? 
                                    `<img src="${imageUrl}" alt="${category.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas ${config.icon}\\'></i>'">` :
                                    `<i class="fas ${config.icon}"></i>`
                                }
                            </div>
                            <div class="category-info-sidebar">
                                <div class="category-name-sidebar">${category.name}</div>
                                <div class="category-count-sidebar">${productCount} товаров</div>
                            </div>
                        </div>
                    `;
                });

                container.innerHTML = html;
            },

            selectCategoryFromSidebar(categoryId) {
                const categorySelect = document.getElementById('filter-category');
                if (categorySelect) {
                    categorySelect.value = categoryId || '';
                    this.applyFilters();
                }
                this.closeCategories();
            },

            async loadFilters() {
                console.log('Загрузка данных фильтров...');

                // Load categories if not already loaded
                let categories = this.categories;
                if (!categories || categories.length === 0) {
                    categories = await this.fetchApi('categories');
                    if (categories) this.categories = categories;
                }

                if (categories) {
                    const categorySelect = document.getElementById('filter-category');
                    if (categorySelect) {
                        categorySelect.innerHTML = '<option value="">Все категории</option>';
                        categories.forEach(category => {
                            const option = document.createElement('option');
                            option.value = category.id;
                            // Добавляем счетчик товаров к названию категории
                            option.textContent = `${category.name} (${category.productCount || 0})`;
                            categorySelect.appendChild(option);
                        });
                    }
                }

                // Load filter metadata (price range, attributes)
                const filtersData = await this.fetchApi('products/filters');
                console.log('[FILTERS] Full API response:', JSON.stringify(filtersData, null, 2));
                
                if (filtersData) {
                    // Set price range placeholders
                    const minPriceInput = document.getElementById('filter-min-price');
                    const maxPriceInput = document.getElementById('filter-max-price');

                    if (minPriceInput) minPriceInput.placeholder = `От ${filtersData.minPrice.toFixed(2)}`;
                    if (maxPriceInput) maxPriceInput.placeholder = `До ${filtersData.maxPrice.toFixed(2)}`;

                    // Load attributes
                    if (filtersData.attributes && filtersData.attributes.length > 0) {
                        console.log('[FILTERS] Attributes array:', filtersData.attributes);
                        const attributesContainer = document.getElementById('attributes-filters');
                        if (attributesContainer) {
                            attributesContainer.innerHTML = '';
                            filtersData.attributes.forEach(attr => {
                                console.log('[FILTERS] Processing attribute:', attr.name, 'Values:', attr.values);
                                if (attr.values && attr.values.length > 0) {
                                    const attrGroup = document.createElement('div');
                                    attrGroup.className = 'filter-group';
                                    
                                    const valuesHtml = attr.values.map(valueObj => {
                                        console.log('[FILTERS] Value object:', valueObj);
                                        const val = valueObj.value;
                                        const cnt = valueObj.count;
                                        const hasSubgroups = valueObj.subgroups && valueObj.subgroups.length > 0;
                                        
                                        console.log(`[FILTERS] Rendering: "${val}" (${cnt})`, hasSubgroups ? 'with subgroups' : '');
                                        
                                        let html = `
                                            <label class="attribute-checkbox ${hasSubgroups ? 'has-subgroups' : ''}">
                                                <input type="checkbox" data-attr-name="${attr.name}" data-attr-value="${val}" onchange="app.applyFilters()">
                                                <span class="ml-2">${val} <span class="text-tertiary">(${cnt})</span></span>
                                        `;
                                        
                                        // Добавляем подгруппы если есть
                                        if (hasSubgroups) {
                                            html += `
                                                <button class="subgroup-toggle" onclick="app.toggleSubgroups(event, '${val}')" type="button">
                                                    <i class="fas fa-chevron-down"></i>
                                                </button>
                                            </label>
                                            <div class="attribute-subgroups" id="subgroups-${val.replace(/\s+/g, '-')}" style="display: none;">
                                            `;
                                            
                                            valueObj.subgroups.forEach(subgroup => {
                                                html += `
                                                    <label class="attribute-checkbox subgroup-item">
                                                        <input type="checkbox" data-attr-name="${attr.name}" data-attr-value="${val}" data-subgroup="${subgroup.name}" onchange="app.applyFilters()">
                                                        <span class="ml-2">${subgroup.name} <span class="text-tertiary">(${subgroup.count})</span></span>
                                                    </label>
                                                `;
                                            });
                                            
                                            html += `</div>`;
                                        } else {
                                            html += `</label>`;
                                        }
                                        
                                        return html;
                                    }).join('');
                                    
                                    attrGroup.innerHTML = `
                                        <label class="filter-label">${attr.name}</label>
                                        <div class="attribute-options">
                                            ${valuesHtml}
                                        </div>
                                    `;
                                    attributesContainer.appendChild(attrGroup);
                                }
                            });
                        }
                        // Show attributes section
                        const attrFilterGroup = document.getElementById('attributes-filter-group');
                        if (attrFilterGroup) {
                            attrFilterGroup.style.display = 'block';
                        }
                    }
                }
            },

            async applyFilters() {
                // Reset to first page when filters change (especially search)
                const search = document.getElementById('filter-search')?.value?.trim();
                const mobileSearch = document.getElementById('mobile-filter-search')?.value?.trim();
                
                // Sync mobile and desktop search
                if (search && !mobileSearch) {
                    const mobileInput = document.getElementById('mobile-filter-search');
                    if (mobileInput) mobileInput.value = search;
                } else if (mobileSearch && !search) {
                    const desktopInput = document.getElementById('filter-search');
                    if (desktopInput) desktopInput.value = mobileSearch;
                }
                
                if (search || mobileSearch) {
                    this.currentProductPage = 1;
                }
                
                // Reload products with current filters
                await this.loadProducts();

                // Update active filters count
                this.updateActiveFiltersCount();

                // Update page subtitle
                const content = document.getElementById('content-mount');
                if (content) {
                    const header = content.querySelector('.page-header .page-subtitle');
                    if (header) {
                        const categorySelect = document.getElementById('filter-category');
                        const categoryName = categorySelect && categorySelect.options[categorySelect.selectedIndex]?.text || 'Все категории';
                        header.textContent = `${this.products.length} товаров • Категория: ${categoryName} • Обновлено: ${new Date().toLocaleTimeString()}`;
                    }
                }
            },

            debouncedApplyFilters() {
                // Clear previous timeout
                if (this.filterTimeout) {
                    clearTimeout(this.filterTimeout);
                }
                // Apply filters after 400ms delay
                this.filterTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 400);
            },

            resetFilters() {
                // Clear all filter inputs
                document.getElementById('filter-search').value = '';
                document.getElementById('filter-category').value = '';
                document.getElementById('filter-min-price').value = '';
                document.getElementById('filter-max-price').value = '';
                document.getElementById('filter-in-stock').checked = false;

                // Clear attribute checkboxes
                const checkboxes = document.querySelectorAll('#attributes-filters input[type="checkbox"]');
                checkboxes.forEach(cb => cb.checked = false);

                // Reset sorting
                const sortSelect = document.getElementById('sort-select');
                const sortBtn = document.getElementById('sort-direction-btn');
                if (sortSelect) sortSelect.value = 'name';
                if (sortBtn) sortBtn.innerHTML = '<i class="fas fa-sort-amount-down"></i>';
                this.sortDirection = 'asc';

                // Apply empty filters
                this.applyFilters();
            },

            // Sorting functions
            applySorting() {
                // Reset to first page when sorting changes
                this.currentProductPage = 1;
                // Reload products with current sorting
                this.loadProducts(true);

                // Update sort direction button
                this.updateSortButton();
            },

            toggleSortDirection() {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                this.applySorting();
            },

            updateSortButton() {
                const sortBtn = document.getElementById('sort-direction-btn');
                if (sortBtn) {
                    sortBtn.innerHTML = this.sortDirection === 'asc'
                        ? '<i class="fas fa-sort-amount-down"></i>'
                        : '<i class="fas fa-sort-amount-up"></i>';
                }
            },

            // Quick filter functions
            applyQuickFilter(filterType) {
                // Reset all filters first
                this.resetFilters();

                switch (filterType) {
                    case 'in-stock':
                        document.getElementById('filter-in-stock').checked = true;
                        break;
                    case 'bosch':
                        // Select Bosch brand attribute
                        const boschCheckbox = document.querySelector('input[data-attr-name="Бренд"][data-attr-value="Bosch"]');
                        if (boschCheckbox) boschCheckbox.checked = true;
                        break;
                    case 'makita':
                        // Select Makita brand attribute
                        const makitaCheckbox = document.querySelector('input[data-attr-name="Бренд"][data-attr-value="Makita"]');
                        if (makitaCheckbox) makitaCheckbox.checked = true;
                        break;
                    case 'cheap':
                        // Set price range up to 100 BYN
                        document.getElementById('filter-max-price').value = '100';
                        break;
                }

                // Apply the filters
                this.applyFilters();
                this.closeFilters();

                // Show applied quick filter toast
                const filterNames = {
                    'in-stock': 'В наличии',
                    'bosch': 'Bosch',
                    'makita': 'Makita',
                    'cheap': 'До 100 BYN'
                };
                this.showToast(`Применен фильтр: ${filterNames[filterType]}`, 'success');
            },

            // Update active filters count
            updateActiveFiltersCount() {
                let count = 0;

                // Check search
                if (document.getElementById('filter-search').value.trim()) count++;

                // Check category
                if (document.getElementById('filter-category').value) count++;

                // Check price range
                const minPrice = document.getElementById('filter-min-price').value;
                const maxPrice = document.getElementById('filter-max-price').value;
                if (minPrice || maxPrice) count++;

                // Check in stock
                if (document.getElementById('filter-in-stock').checked) count++;

                // Check attributes
                const attributeCheckboxes = document.querySelectorAll('#attributes-filters input[type="checkbox"]:checked');
                if (attributeCheckboxes.length > 0) count++;

                // Update badge
                const badge = document.getElementById('active-filters-count');
                if (badge) {
                    if (count > 0) {
                        badge.textContent = count;
                        badge.style.display = 'inline-block';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            },

            // Order review modal - show products from order for review

            toggleSubgroups(event, brandName) {
                event.preventDefault();
                event.stopPropagation();
                
                const button = event.currentTarget;
                const icon = button.querySelector('i');
                const subgroupsId = 'subgroups-' + brandName.replace(/\s+/g, '-');
                const subgroupsDiv = document.getElementById(subgroupsId);
                
                if (subgroupsDiv) {
                    const isVisible = subgroupsDiv.style.display !== 'none';
                    subgroupsDiv.style.display = isVisible ? 'none' : 'block';
                    icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                }
            },
});