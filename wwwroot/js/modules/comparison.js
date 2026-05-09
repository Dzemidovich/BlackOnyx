// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

        // ===== COMPARISON MANAGER =====
        const ComparisonManager = {
            STORAGE_KEY: 'product_comparison_list',
            MAX_PRODUCTS: 4,
            
            // Get current comparison list
            getList() {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                return stored ? JSON.parse(stored) : [];
            },
            
            // Add product to comparison
            add(productId) {
                const list = this.getList();
                if (list.length >= this.MAX_PRODUCTS) {
                    return { success: false, reason: 'max_reached' };
                }
                if (list.includes(productId)) {
                    return { success: false, reason: 'already_added' };
                }
                list.push(productId);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
                this.notifyChange();
                return { success: true };
            },
            
            // Remove product from comparison
            remove(productId) {
                let list = this.getList();
                list = list.filter(id => id !== productId);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
                this.notifyChange();
            },
            
            // Check if product is in comparison
            has(productId) {
                return this.getList().includes(productId);
            },
            
            // Get count of products in comparison
            getCount() {
                return this.getList().length;
            },
            
            // Clear all products
            clear() {
                localStorage.removeItem(this.STORAGE_KEY);
                this.notifyChange();
            },
            
            // Notify UI of changes
            notifyChange() {
                window.dispatchEvent(new CustomEvent('comparison-changed', {
                    detail: { count: this.getCount(), list: this.getList() }
                }));
            }
        };
        