// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Reviews module - review functionality
// Must be loaded after app.js and core/api.js
Object.assign(app, {
            async showOrderReviewModal(orderId) {
                try {
                    const orderDetails = await this.fetchApi(`orders/${orderId}/details`);

                    if (orderDetails && orderDetails.items && orderDetails.items.length > 0) {
                        // Create modal content with order products
                        let productsHtml = orderDetails.items.map(item => `
                            <div class="product-review-item" style="border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px; background: var(--bg-card);">
                                <div class="product-info" style="display: flex; gap: 16px; margin-bottom: 12px;">
                                    <div class="product-details" style="flex: 1;">
                                        <div class="product-name" style="font-weight: 600; color: var(--text-main); margin-bottom: 4px;">
                                            ${item.productName}
                                        </div>
                                        <div class="product-article" style="font-size: 0.9rem; color: var(--text-secondary);">
                                            Артикул: ${item.productArticle}
                                        </div>
                                        <div class="product-price" style="font-size: 0.9rem; color: var(--primary); margin-top: 4px;">
                                            Цена: ${item.price.toFixed(2)} BYN × ${item.quantity} шт. = ${item.total.toFixed(2)} BYN
                                        </div>
                                    </div>
                                    <button class="btn btn-primary btn-sm" data-product-id="${item.productId}" data-product-name="${item.productName.replace(/\"/g, '&quot;')}" onclick="app.showAddReviewForProduct(Number(this.dataset.productId), this.dataset.productName)">
                                        <i class="fas fa-star"></i> Написать отзыв
                                    </button>
                                </div>
                            </div>
                        `).join('');

                        const modalContent = `
                            <div class="order-review-header" style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border);">
                                <h4 style="margin: 0; color: var(--text-main);">Заказ #${orderDetails.id}</h4>
                                <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                                    ${new Date(orderDetails.createdAt).toLocaleDateString('ru-RU')} •
                                    Сумма: ${orderDetails.totalAmount.toFixed(2)} BYN
                                </p>
                            </div>
                            <div class="order-products">
                                <h5 style="margin-bottom: 16px; color: var(--text-main);">Выберите товар для отзыва:</h5>
                                ${productsHtml}
                            </div>
                        `;

                        // Create or update modal for order reviews
                        let orderReviewModal = document.getElementById('order-review-modal');
                        if (!orderReviewModal) {
                            orderReviewModal = document.createElement('div');
                            orderReviewModal.id = 'order-review-modal';
                            orderReviewModal.className = 'modal-overlay';
                            orderReviewModal.innerHTML = `
                                <div class="modal">
                                    <div class="modal-header">
                                        <h3 class="modal-title">Написать отзыв о товарах</h3>
                                        <button class="modal-close" onclick="app.closeModal('order-review-modal')">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div class="modal-body" id="order-review-modal-content">
                                        ${modalContent}
                                    </div>
                                    <div class="modal-footer">
                                        <button class="btn btn-outline" onclick="app.closeModal('order-review-modal')">Закрыть</button>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(orderReviewModal);
                        } else {
                            document.getElementById('order-review-modal-content').innerHTML = modalContent;
                        }

                        this.showModal('order-review-modal');
                    } else {
                        this.showToast('Не удалось загрузить товары заказа', 'error');
                    }
                } catch (error) {
                    this.showToast('Ошибка загрузки товаров заказа', 'error');
                }
            },

            showAddReviewForProduct(productId, productName) {
                // Close order review modal and open add review modal
                this.closeModal('order-review-modal');
                this.showModal('add-review-modal');

                // Update modal title
                document.querySelector('#add-review-modal .modal-title').innerText = `Отзыв о "${productName}"`;

                // Set product ID
                document.getElementById('review-product-id').value = productId;

                // Generate star rating interface
                const ratingStars = document.getElementById('rating-stars');
                ratingStars.innerHTML = '';

                for (let i = 1; i <= 5; i++) {
                    const star = document.createElement('button');
                    star.type = 'button';
                    star.className = 'star-btn';
                    star.innerHTML = '<i class="far fa-star"></i>';
                    star.dataset.rating = i;
                    star.onclick = () => this.setRating(i);
                    ratingStars.appendChild(star);
                }
            },

            // Reviews functions
            async viewProductReviews(productId) {
                // Store product ID for add review modal
                document.getElementById('review-product-id').value = productId;

                try {
                    const [reviews, stats] = await Promise.all([
                        this.fetchApi(`reviews/product/${productId}`),
                        this.fetchApi(`reviews/product/${productId}/stats`)
                    ]);

                    const product = this.products.find(p => p.id === productId);

                    document.getElementById('reviews-modal-title').innerText = `Отзывы о товаре "${product?.name || 'товар'}"`;

                    let reviewsHtml = '';

                    if (reviews && reviews.length > 0) {
                        reviewsHtml = reviews.map(review => `
                            <div class="review-item" style="border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px; background: var(--bg-card);">
                                <div class="review-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <div class="review-author" style="font-weight: 600; color: var(--text-main);">
                                        ${review.userName}
                                    </div>
                                    <div class="review-rating">
                                        ${this.generateStars(review.rating)}
                                    </div>
                                </div>
                                ${review.comment ? `<div class="review-comment" style="color: var(--text-secondary); line-height: 1.5;">${review.comment}</div>` : ''}
                                <div class="review-date" style="margin-top: 8px; font-size: 0.8rem; color: var(--text-tertiary);">
                                    ${review.createdAt ? new Date(review.createdAt).toLocaleDateString('ru-RU') : ''}
                                </div>
                            </div>
                        `).join('');
                    } else {
                        reviewsHtml = `
                            <div class="empty-state" style="text-align: center; padding: 40px;">
                                <div class="empty-state-icon">
                                    <i class="fas fa-comments"></i>
                                </div>
                                <div class="empty-state-title">Отзывов пока нет</div>
                                <div class="empty-state-description">Будьте первым, кто оставит отзыв об этом товаре</div>
                            </div>
                        `;
                    }

                    // Add product stats if available
                    if (stats && stats.totalReviews > 0) {
                        reviewsHtml = `
                            <div class="product-stats" style="background: var(--primary-light); padding: 16px; border-radius: var(--radius-md); margin-bottom: 24px; display: flex; justify-content: space-around; align-items: center;">
                                <div class="stat-item" style="text-align: center;">
                                    <div class="stat-value" style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${stats.averageRating}</div>
                                    <div class="stat-label" style="font-size: 0.8rem; color: var(--text-secondary);">Средний рейтинг</div>
                                </div>
                                <div class="stat-item" style="text-align: center;">
                                    <div class="stat-value" style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${stats.totalReviews}</div>
                                    <div class="stat-label" style="font-size: 0.8rem; color: var(--text-secondary);">Всего отзывов</div>
                                </div>
                                <div class="stat-item" style="text-align: center;">
                                    <div class="rating-distribution">
                                        ${[5, 4, 3, 2, 1].map(stars => `
                                            <div style="display: flex; align-items: center; gap: 4px; font-size: 0.7rem;">
                                                <span>${stars}★</span>
                                                <div style="flex: 1; height: 4px; background: var(--border-light); border-radius: 2px; margin: 0 4px;">
                                                    <div class="rating-bar-fill" data-pct="${(stats.ratingDistribution[stars] / stats.totalReviews * 100) || 0}"></div>
                                                </div>
                                                <span>${stats.ratingDistribution[stars] || 0}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            ${reviewsHtml}
                        `;
                    }

                    document.getElementById('reviews-modal-content').innerHTML = reviewsHtml;
                    document.querySelectorAll('#reviews-modal-content .rating-bar-fill').forEach(el => { el.style.width = (el.dataset.pct || 0) + '%'; });
                    this.showModal('reviews-modal');
                } catch (error) {
                    this.showToast('Ошибка загрузки отзывов', 'error');
                }
            },

            generateStars(rating) {
                let stars = '';
                for (let i = 1; i <= 5; i++) {
                    stars += `<i class="fas fa-star" style="color: ${i <= rating ? 'var(--warning)' : 'var(--text-light)'}"></i>`;
                }
                return stars;
            },

            showAddReviewModal() {
                // Close reviews modal and open add review modal
                this.closeModal('reviews-modal');
                this.showModal('add-review-modal');

                // Generate star rating interface
                const ratingStars = document.getElementById('rating-stars');
                ratingStars.innerHTML = '';

                for (let i = 1; i <= 5; i++) {
                    const star = document.createElement('button');
                    star.type = 'button';
                    star.className = 'star-btn';
                    star.innerHTML = '<i class="far fa-star"></i>';
                    star.dataset.rating = i;
                    star.onclick = () => this.setRating(i);
                    ratingStars.appendChild(star);
                }
            },

            setRating(rating) {
                document.getElementById('review-rating').value = rating;

                const stars = document.querySelectorAll('#rating-stars .star-btn');
                stars.forEach((star, index) => {
                    const icon = star.querySelector('i');
                    if (index < rating) {
                        icon.className = 'fas fa-star';
                        icon.style.color = 'var(--warning)';
                    } else {
                        icon.className = 'far fa-star';
                        icon.style.color = 'var(--text-secondary)';
                    }
                });
            },

            async submitReview() {
                const productId = document.getElementById('review-product-id').value;
                const rating = document.getElementById('review-rating').value;
                const comment = document.getElementById('review-comment').value.trim();

                if (!rating || rating < 1 || rating > 5) {
                    this.showToast('Пожалуйста, выберите рейтинг', 'error');
                    return;
                }

                const reviewData = {
                    productId: parseInt(productId),
                    rating: parseInt(rating),
                    comment: comment || null
                };

                try {
                    const result = await this.fetchApi('reviews', {
                        method: 'POST',
                        body: JSON.stringify(reviewData)
                    });

                    if (result) {
                        this.showToast('Отзыв успешно отправлен и ожидает модерации!', 'success');
                        this.closeModal('add-review-modal');

                        // Clear form
                        document.getElementById('review-product-id').value = '';
                        document.getElementById('review-rating').value = '5';
                        document.getElementById('review-comment').value = '';
                    }
                } catch (error) {
                    this.showToast('Ошибка при отправке отзыва', 'error');
                }
            },

            async showAdminReviewsModal() {
                await this.refreshPendingReviews();
                this.showModal('admin-reviews-modal');
            },

            async refreshPendingReviews() {
                try {
                    const reviews = await this.fetchApi('reviews/pending');

                    let reviewsHtml = '';

                    if (reviews && reviews.length > 0) {
                        reviewsHtml = reviews.map(review => `
                            <div class="review-item" style="border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px; background: var(--bg-card);">
                                <div class="review-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <div>
                                        <div class="review-product" style="font-weight: 600; color: var(--text-main);">
                                            ${review.productName}
                                        </div>
                                        <div class="review-author" style="font-size: 0.9rem; color: var(--text-secondary);">
                                            ${review.userName}
                                        </div>
                                    </div>
                                    <div class="review-rating">
                                        ${this.generateStars(review.rating)}
                                    </div>
                                </div>
                                ${review.comment ? `<div class="review-comment" style="color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">${review.comment}</div>` : ''}
                                <div class="review-date" style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 12px;">
                                    ${review.createdAt ? new Date(review.createdAt).toLocaleDateString('ru-RU') : ''}
                                </div>
                                <div class="review-actions" style="display: flex; gap: 8px;">
                                    <button class="btn btn-success btn-sm" onclick="app.approveReview(${review.id})">
                                        <i class="fas fa-check"></i> Одобрить
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="app.rejectReview(${review.id})">
                                        <i class="fas fa-times"></i> Отклонить
                                    </button>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        reviewsHtml = `
                            <div class="empty-state" style="text-align: center; padding: 40px;">
                                <div class="empty-state-icon">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <div class="empty-state-title">Все отзывы проверены</div>
                                <div class="empty-state-description">Новых отзывов на модерацию нет</div>
                            </div>
                        `;
                    }

                    document.getElementById('admin-reviews-modal-content').innerHTML = reviewsHtml;
                } catch (error) {
                    this.showToast('Ошибка загрузки отзывов на модерацию', 'error');
                }
            },

            async approveReview(reviewId) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}reviews/${reviewId}/approve`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (response.ok) {
                        this.showToast('Отзыв одобрен', 'success');
                        await this.refreshPendingReviews();
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        this.showToast(errorData.message || 'Ошибка при одобрении отзыва', 'error');
                    }
                } catch (error) {
                    console.error('Approve review error:', error);
                    this.showToast('Ошибка при одобрении отзыва', 'error');
                }
            },

            async rejectReview(reviewId) {
                if (!confirm('Вы уверены, что хотите отклонить этот отзыв? Он будет удален безвозвратно.')) {
                    return;
                }

                try {
                    const response = await fetch(`${this.apiBaseUrl}reviews/${reviewId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (response.ok) {
                        this.showToast('Отзыв отклонен и удален', 'success');
                        await this.refreshPendingReviews();
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        this.showToast(errorData.message || 'Ошибка при отклонении отзыва', 'error');
                    }
                } catch (error) {
                    console.error('Reject review error:', error);
                    this.showToast('Ошибка при отклонении отзыва', 'error');
                }
            },

            // User Markup functions
});