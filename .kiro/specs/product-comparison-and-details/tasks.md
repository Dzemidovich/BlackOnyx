# Implementation Tasks

## 1. Backend API Enhancement

### 1.1 Create DTOs for Product Details
- [ ] Create `ProductDetailDto` class in DTOs folder
- [ ] Create `RelatedProductDto` class in DTOs folder
- [ ] Create `BreadcrumbItem` class in DTOs folder

### 1.2 Implement Product Details Endpoint
- [ ] Add `GetProductDetails` method to ProductsController
- [ ] Implement category breadcrumb building logic
- [ ] Implement related products fetching (same category, exclude current, limit 4)
- [ ] Add error handling for invalid/inactive products

## 2. Frontend - Comparison Manager

### 2.1 Create ComparisonManager Module
- [ ] Implement localStorage-based comparison list management
- [ ] Add methods: getList, add, remove, has, getCount, clear
- [ ] Implement max 4 products limit
- [ ] Add event notification system for UI updates

## 3. Frontend - Router Enhancement

### 3.1 Add Product Detail Route
- [ ] Add route handler for `/product/{id}` pattern
- [ ] Implement `navigateToProduct` function
- [ ] Add browser history management

### 3.2 Add Comparison Route
- [ ] Add route handler for `/comparison` pattern
- [ ] Implement `navigateToComparison` function

## 4. Frontend - Product Detail View

### 4.1 Create Product Detail View Component
- [ ] Implement `showProductDetail` function with API call
- [ ] Create `renderProductDetail` function with full layout
- [ ] Add breadcrumb navigation rendering
- [ ] Add product image, name, article, price display
- [ ] Add availability status display
- [ ] Add description section
- [ ] Add specifications table
- [ ] Add related products section

### 4.2 Add Product Detail Interactions
- [ ] Implement "Add to Cart" button handler
- [ ] Implement "Add to Comparison" toggle button handler
- [ ] Add related product click navigation
- [ ] Add breadcrumb navigation handlers
- [ ] Add error handling and loading states

## 5. Frontend - Comparison View

### 5.1 Create Comparison View Component
- [ ] Implement `showComparisonView` function
- [ ] Create `renderComparisonView` with side-by-side table layout
- [ ] Implement attribute alignment logic
- [ ] Highlight differences between products
- [ ] Add empty state for no products

### 5.2 Add Comparison Interactions
- [ ] Implement "Add to Cart" buttons in comparison
- [ ] Implement "Remove" buttons for each product
- [ ] Add "Clear All" button
- [ ] Add loading and error states

## 6. Frontend - Product Card Enhancement

### 6.1 Update Product Cards
- [ ] Add comparison button to product cards
- [ ] Implement `toggleComparison` function
- [ ] Update card rendering to show comparison state
- [ ] Add visual feedback for products in comparison

## 7. Frontend - Header Enhancement

### 7.1 Add Comparison Indicator
- [ ] Create comparison count indicator in header
- [ ] Add click handler to navigate to comparison
- [ ] Listen to comparison-changed events
- [ ] Update indicator dynamically

## 8. Styling and Responsive Design

### 8.1 Product Detail Page Styles
- [ ] Add CSS for product detail layout
- [ ] Style breadcrumb navigation
- [ ] Style product image and info sections
- [ ] Style specifications table
- [ ] Style related products grid
- [ ] Add mobile responsive styles (single column)

### 8.2 Comparison View Styles
- [ ] Add CSS for comparison table layout
- [ ] Style product headers in comparison
- [ ] Style attribute rows with highlighting
- [ ] Add horizontal scroll for mobile
- [ ] Ensure touch-friendly button sizes (44px min)

### 8.3 Product Card Styles
- [ ] Update product card styles for comparison button
- [ ] Add active state styling for comparison button
- [ ] Ensure responsive layout

## 9. Testing and Polish

### 9.1 Functionality Testing
- [ ] Test product detail page loading
- [ ] Test comparison list management (add/remove)
- [ ] Test localStorage persistence
- [ ] Test navigation between views
- [ ] Test error handling (404, network errors)

### 9.2 Responsive Testing
- [ ] Test on mobile devices (< 768px)
- [ ] Test on tablets (768px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Verify touch targets on mobile

### 9.3 Performance Testing
- [ ] Verify single API call for detail page
- [ ] Test batch loading for comparison
- [ ] Check image caching
- [ ] Test with slow network

## 10. Documentation and Cleanup

### 10.1 Code Documentation
- [ ] Add JSDoc comments to key functions
- [ ] Document ComparisonManager API
- [ ] Add inline comments for complex logic

### 10.2 Final Review
- [ ] Review code for consistency with existing style
- [ ] Check accessibility (keyboard navigation, alt text)
- [ ] Verify SEO elements (page titles, semantic HTML)
- [ ] Clean up console logs and debug code
