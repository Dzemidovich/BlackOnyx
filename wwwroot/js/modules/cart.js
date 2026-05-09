// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Cart module - loadCart, addToCart, removeFromCart, updateCartItem, checkout
// Must be loaded after app.js and core/api.js
Object.assign(app, {
            async loadCart() {
                console.log('Загрузка корзины...');
                const data = await this.fetchApi('cart');
                if (data) {
                    this.cart = data;
                    console.log('Корзина загружена:', this.cart);
                    this.updateCartBadge();
                }
            },

            async loadOrders() {
                console.log('Загрузка заказов...');
                const data = await this.fetchApi('orders/my');
                if (data) {
                    this.orders = data;
                    console.log(`Загружено ${this.orders.length} заказов`);
                }
            },

            // Update cart badge
            // Add to cart
            async addToCart(productId, quantity = 1) {
                // RBAC Check
                if (this.currentUser && this.currentUser.role !== 'Customer') {
                    this.showToast('Только клиенты могут добавлять товары в корзину', 'error');
                    return;
                }

                // Try to find product in loaded products first
                let product = this.products.find(p => p.id === productId);
                
                // If not found, fetch from API
                if (!product) {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/products/${productId}`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        });
                        if (response.ok) {
                            product = await response.json();
                        }
                    } catch (error) {
                        console.error('Error fetching product:', error);
                    }
                }
                
                if (!product) {
                    this.showToast('Товар не найден', 'error');
                    return;
                }

                const result = await this.fetchApi('cart/add', {
                    method: 'POST',
                    body: JSON.stringify({
                        userId: this.currentUserId,
                        productId: productId,
                        quantity: quantity
                    })
                });

                if (result && result.success) {
                    // Показать превью карточку товара
                    this.showCartPreview(product, quantity);
                    await this.loadCart();

                    // Update current page if it's cart
                    if (this.currentPage === 'cart') {
                        this.nav('cart');
                    }
                } else {
                    this.showToast(result?.error || 'Ошибка при добавлении в корзину', 'error');
                }
            },

            // Add to cart from modal
            async addToCartFromModal() {
                if (this.currentProduct) {
                    await this.addToCart(this.currentProduct.id, 1);
                    this.closeModal('product-modal');
                }
            },

            // Show cart preview card when item added
            showCartPreview(product, quantity) {
                // Remove any existing preview
                const existingPreview = document.querySelector('.cart-preview-card');
                if (existingPreview) {
                    existingPreview.remove();
                }

                // Get product image
                const imageUrl = this.getProductImage(product);
                const imageHtml = imageUrl 
                    ? `<img src="${imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-tools\\\' style=\\'font-size: 1.5rem; color: var(--text-light);\'></i>'">`
                    : `<i class="fas fa-tools" style="font-size: 1.5rem; color: var(--text-light);"></i>`;

                // Create preview card
                const previewCard = document.createElement('div');
                previewCard.className = 'cart-preview-card';
                previewCard.innerHTML = `
                    <div class="cart-preview-image">${imageHtml}</div>
                    <div class="cart-preview-info">
                        <div class="cart-preview-name">${product.name}</div>
                        <div class="cart-preview-price">${product.price.toFixed(2)} BYN × ${quantity}</div>
                    </div>
                    <div class="cart-preview-check">
                        <i class="fas fa-check"></i>
                    </div>
                `;

                document.body.appendChild(previewCard);

                // Auto-remove after 3 seconds
                setTimeout(() => {
                    previewCard.style.animation = 'fadeOutPreview 0.4s ease forwards';
                    setTimeout(() => {
                        if (previewCard.parentElement) {
                            previewCard.remove();
                        }
                    }, 400);
                }, 3000);
            },

            // Remove from cart
            async removeFromCart(itemId) {
                const result = await this.fetchApi(`cart/remove/${itemId}`, {
                    method: 'DELETE'
                });

                if (result && result.success) {
                    this.showToast('Товар удален из корзины', 'success');
                    await this.loadCart();
                    this.nav('cart');
                } else {
                    this.showToast(result?.error || 'Ошибка при удалении товара', 'error');
                }
            },

            // Update cart item
            async updateCartItem(itemId, quantity) {
                if (quantity < 1) {
                    await this.removeFromCart(itemId);
                    return;
                }

                const result = await this.fetchApi(`cart/update/${itemId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ quantity: quantity })
                });

                if (result && result.success) {
                    await this.loadCart();
                    this.nav('cart');
                }
            },

            // Checkout
            async checkout() {
                if (!this.cart || this.cart.totalItems === 0) {
                    this.showToast('Корзина пуста', 'error');
                    return;
                }

                // Заполняем данные в модальном окне
                document.getElementById('checkout-items-count').textContent = `${this.cart.totalItems} шт`;
                
                // Показываем цену со скидкой если она есть
                const discount = this.cart.discount || 0;
                const totalAmount = this.cart.totalAmount || 0;
                const finalAmount = this.cart.finalAmount || totalAmount;
                const discountAmount = this.cart.discountAmount || 0;
                
                const totalAmountElement = document.getElementById('checkout-total-amount');
                if (discount > 0) {
                    totalAmountElement.innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                            <div style="text-decoration: line-through; color: var(--text-tertiary); font-size: 0.9rem;">
                                ${totalAmount.toFixed(2)} BYN
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                                             color: white; 
                                             padding: 4px 8px; 
                                             border-radius: 6px; 
                                             font-size: 0.75rem; 
                                             font-weight: 700;">
                                    -${discount}%
                                </span>
                                <span style="color: var(--success); font-weight: 700; font-size: 1.2rem;">
                                    ${finalAmount.toFixed(2)} BYN
                                </span>
                            </div>
                            <div style="color: var(--success); font-size: 0.75rem;">
                                Экономия: ${discountAmount.toFixed(2)} BYN
                            </div>
                        </div>
                    `;
                } else {
                    totalAmountElement.textContent = `${totalAmount.toFixed(2)} BYN`;
                }
                
                document.getElementById('order-comment').value = '';

                // Показываем модальное окно
                this.showModal('checkout-modal');
            },

            async confirmCheckout() {
                const comment = document.getElementById('order-comment')?.value?.trim() || null;

                const result = await this.fetchApi('cart/checkout', {
                    method: 'POST',
                    body: JSON.stringify({ comment: comment })
                });

                if (result && result.success) {
                    this.closeModal('checkout-modal');
                    this.showToast(`Заказ #${result.orderId} успешно оформлен!`, 'success');
                    await this.loadCart();
                    await this.loadOrders();
                    this.nav('orders');
                } else {
                    this.showToast(result?.error || 'Ошибка при оформлении заказа', 'error');
                }
            },

            // Favorites functionality
            favorites: [],

    async renderCart() {
                if (!this.cart || !this.cart.items || this.cart.items.length === 0) {
                    document.getElementById('content-mount').innerHTML = `
                        <div class="empty-state" style="padding: 80px 24px;">
                            <div class="empty-state-icon"><i class="fas fa-shopping-cart"></i></div>
                            <div class="empty-state-title">Корзина пуста</div>
                            <div class="empty-state-description">Добавьте товары из каталога</div>
                            <button class="btn btn-primary mt-4" onclick="app.nav('products')">
                                <i class="fas fa-tools"></i> Перейти в каталог
                            </button>
                        </div>`;
                    return '';
                }

                const html = await fetch('/templates/cart.html').then(r => r.text());
                document.getElementById('content-mount').innerHTML = html;

                const items = this.cart.items || [];
                const totalAmount = this.cart.totalAmount || 0;
                const discount = this.cart.discount || 0;
                const discountAmount = this.cart.discountAmount || 0;
                const finalAmount = this.cart.finalAmount || totalAmount;

                // Заполняем метки
                document.getElementById('cart-summary-title').textContent = 'Итого';
                document.getElementById('cart-items-label').textContent = 'Товаров';
                document.getElementById('cart-items-count').textContent = `${items.length} шт.`;
                
                // Показываем скидку если она есть
                if (discount > 0) {
                    document.getElementById('cart-total-label').textContent = 'Сумма без скидки';
                    document.getElementById('cart-total-amount').innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                            <div style="text-decoration: line-through; color: var(--text-tertiary); font-size: 0.9rem;">
                                ${totalAmount.toFixed(2)} BYN
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                                             color: white; 
                                             padding: 4px 8px; 
                                             border-radius: 6px; 
                                             font-size: 0.75rem; 
                                             font-weight: 700;">
                                    -${discount}%
                                </span>
                                <span style="color: var(--success); font-weight: 700; font-size: 1.1rem;">
                                    ${finalAmount.toFixed(2)} BYN
                                </span>
                            </div>
                            <div style="color: var(--success); font-size: 0.75rem;">
                                Экономия: ${discountAmount.toFixed(2)} BYN
                            </div>
                        </div>
                    `;
                } else {
                    document.getElementById('cart-total-label').textContent = 'Сумма';
                    document.getElementById('cart-total-amount').textContent = `${totalAmount.toFixed(2)} BYN`;
                }
                
                document.getElementById('cart-checkout-label').textContent = 'Оформить заказ';

                // Заполняем список товаров
                document.getElementById('cart-items-list').innerHTML = items.map(item => {
                    const imageUrl = this.getProductImage({ article: item.productArticle, imageUrl: item.imageUrl });
                    const imgHtml = imageUrl
                        ? `<img src="${imageUrl}" alt="${item.productName || ''}" onerror="this.style.display='none'">`
                        : `<i class="fas fa-tools" style="font-size:1.5rem;color:var(--text-light)"></i>`;
                    
                    // Применяем скидку к цене товара
                    const originalPrice = item.price || 0;
                    const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
                    const itemTotal = discountedPrice * item.quantity;
                    
                    return `
                        <div class="cart-item-card">
                            <div class="cart-item-main">
                                <div class="cart-item-img">${imgHtml}</div>
                                <div class="cart-item-info">
                                    <div class="cart-item-title">${item.productName || 'Товар'}</div>
                                    <div class="cart-item-sku">${item.productArticle || ''}</div>
                                    <div class="cart-item-price-text">
                                        ${discount > 0 ? `
                                            <span style="text-decoration: line-through; color: var(--text-tertiary); font-size: 0.85rem;">
                                                ${originalPrice.toFixed(2)} BYN
                                            </span>
                                            <span style="color: var(--success); font-weight: 600; margin-left: 6px;">
                                                ${discountedPrice.toFixed(2)} BYN / шт.
                                            </span>
                                            <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                                                         color: white; 
                                                         padding: 2px 6px; 
                                                         border-radius: 4px; 
                                                         font-size: 0.7rem; 
                                                         font-weight: 700;
                                                         margin-left: 6px;">
                                                -${discount}%
                                            </span>
                                        ` : `${originalPrice.toFixed(2)} BYN / шт.`}
                                    </div>
                                </div>
                                <div class="cart-item-controls">
                                    <div class="cart-qty-wrapper">
                                        <button class="cart-qty-btn" onclick="app.updateCartItem(${item.id}, ${item.quantity - 1})">
                                            <i class="fas fa-minus"></i>
                                        </button>
                                        <span class="cart-qty-value">${item.quantity}</span>
                                        <button class="cart-qty-btn" onclick="app.updateCartItem(${item.id}, ${item.quantity + 1})">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                    <div class="cart-item-total-price">
                                        ${discount > 0 ? `
                                            <div style="text-decoration: line-through; color: var(--text-tertiary); font-size: 0.85rem;">
                                                ${(originalPrice * item.quantity).toFixed(2)} BYN
                                            </div>
                                            <div style="color: var(--success); font-weight: 700;">
                                                ${itemTotal.toFixed(2)} BYN
                                            </div>
                                        ` : `${itemTotal.toFixed(2)} BYN`}
                                    </div>
                                    <button class="cart-delete-btn" onclick="app.removeFromCart(${item.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>`;
                }).join('');

                return '';
            },

});