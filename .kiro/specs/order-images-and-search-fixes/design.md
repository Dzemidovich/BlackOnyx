# Order Images and Search Fixes Design

## Overview

This design addresses two critical bugs in the e-commerce platform:

1. **Order Images Display Bug**: Product images in the "My Orders" page display vertically (stacked) instead of horizontally (in a row), despite inline styles and CSS rules attempting to force horizontal layout. The root cause is likely CSS specificity conflicts or missing/overridden flexbox styles.

2. **Product Search Bug**: The search functionality only searches products on the currently loaded page (~50 products) instead of searching the entire database (~10,000 products). The root cause is that the frontend applies search filters to already-loaded products rather than triggering a new API request with search parameters.

## Glossary

- **Bug_Condition_Images (C1)**: The condition that triggers the images bug - when order cards render product images in the "My Orders" page
- **Bug_Condition_Search (C2)**: The condition that triggers the search bug - when a user enters a search query in the catalog page
- **Property_Images (P1)**: The desired behavior for order images - images should display horizontally in a row with flexbox layout
- **Property_Search (P2)**: The desired behavior for search - search should query the entire database, not just loaded products
- **Preservation**: Existing functionality that must remain unchanged (order data display, pagination, filters, etc.)
- **renderOrderCard**: The function in `wwwroot/js/modules/orders.js` that generates HTML for order cards
- **loadProducts**: The function in `wwwroot/js/modules/products.js` that fetches products from the API
- **applyFilters**: The function that applies search and filter criteria to products
- **GetProducts**: The API endpoint in `Controllers/ProductsController.cs` that handles product queries

## Bug Details

### Bug 1: Order Images Display

#### Bug Condition

The bug manifests when the "My Orders" page renders order cards with product images. The `renderOrderCard` function generates HTML with inline styles (`display: flex !important; flex-direction: row !important;`) and CSS file contains correct flexbox rules, but images still display vertically in a column instead of horizontally in a row.

**Formal Specification:**
```
FUNCTION isBugCondition_Images(context)
  INPUT: context of type OrderRenderContext
  OUTPUT: boolean
  
  RETURN context.page == 'orders'
         AND context.orderCard.hasProductImages == true
         AND context.orderCard.imagesLayout == 'vertical'
         AND context.expectedLayout == 'horizontal'
END FUNCTION
```

#### Examples

- **Example 1**: Order #123 with 3 products displays images stacked vertically (one above another) instead of side-by-side
- **Example 2**: Inline styles `display: flex !important; flex-direction: row !important;` are applied to `.order-items-preview-list` but have no effect
- **Example 3**: CSS file `wwwroot/css/pages/orders.css` lines 475-550 contain correct horizontal layout styles but they are not applied
- **Edge Case**: Order with 1 product should still display in the same horizontal layout container (not vertically)

### Bug 2: Product Search

#### Bug Condition

The bug manifests when a user enters a search query in the catalog search field. The system only searches products that are currently loaded in memory (~50 products from the current page) instead of sending a new API request to search the entire database (~10,000 products).

**Formal Specification:**
```
FUNCTION isBugCondition_Search(context)
  INPUT: context of type SearchContext
  OUTPUT: boolean
  
  RETURN context.searchQuery.length > 0
         AND context.searchScope == 'currentPageOnly'
         AND context.expectedScope == 'entireDatabase'
         AND context.productsSearched < context.totalProductsInDatabase
END FUNCTION
```

#### Examples

- **Example 1**: User searches for "Bosch GBH 2-26" on page 1 (showing products 1-50), but the product exists on page 150 → returns empty results
- **Example 2**: User searches for "сварочный" (welding) and only gets 2 results from current page, but 50+ matching products exist in database
- **Example 3**: Search query is entered, `pageSize=10000` is set in `loadProducts()`, but API still returns limited results because search is applied client-side after loading
- **Edge Case**: Exact article match should work regardless of which page the product is on

## Expected Behavior

### Bug 1: Order Images Display

**Correct Behavior:**
- Images SHALL display horizontally in a row from left to right using flexbox layout
- Each image SHALL be 100x100px with border-radius 12px and proper spacing (12px gap)
- The layout order SHALL be: Date → Photos → Item Count → Price → Status → Actions
- CSS styles from `wwwroot/css/pages/orders.css` SHALL be applied correctly
- Inline styles with `!important` SHALL override any conflicting CSS

### Bug 2: Product Search

**Correct Behavior:**
- Search SHALL query the entire database (~10,000 products) via API request
- Search SHALL use large pageSize (10000) when search query is active
- Search SHALL perform case-insensitive matching on name, article, and description
- Search results SHALL display all matching products from the entire database
- API endpoint SHALL handle search parameter and return all matching results

### Preservation Requirements

**Unchanged Behaviors:**
- Order cards SHALL CONTINUE TO display other information (date, item count, price, status, actions) correctly
- Orders with >3 products SHALL CONTINUE TO show "+N" indicator for additional items
- Failed product images SHALL CONTINUE TO display fallback icon (fa-tools)
- Order data fetching and rendering SHALL CONTINUE TO work correctly
- Pagination SHALL CONTINUE TO work for non-search browsing (default 50 products per page)
- Filters (category, price, stock) SHALL CONTINUE TO work with pagination when no search is active
- Sorting SHALL CONTINUE TO work correctly
- Exact article/name matches SHALL CONTINUE TO be prioritized

**Scope:**
All inputs that do NOT involve rendering order images or performing product search should be completely unaffected by these fixes.

## Hypothesized Root Cause

### Bug 1: Order Images Display

Based on the code analysis, the most likely issues are:

1. **CSS Specificity Conflict**: Another CSS rule with higher specificity is overriding the flexbox styles
   - Possible conflicting rules in `wwwroot/css/layout.css`, `wwwroot/css/base.css`, or `wwwroot/css/components/cards.css`
   - Grid or table layout styles may be forcing vertical stacking

2. **CSS File Not Loaded**: The `wwwroot/css/pages/orders.css` file may not be properly linked in the HTML
   - Missing `<link>` tag in the page header
   - Incorrect file path or caching issue

3. **Parent Container Constraints**: The parent `.order-col` or `.order-row` may have conflicting layout styles
   - Parent may be using `display: block` or `display: grid` that prevents flexbox from working
   - Width constraints may be forcing wrapping

4. **Inline Styles Not Applied**: The JavaScript-generated inline styles may be stripped or overridden
   - DOM manipulation timing issue
   - Another script modifying the styles after rendering

### Bug 2: Product Search

Based on the code analysis, the most likely issues are:

1. **Client-Side Filtering**: The `applyFilters()` function filters already-loaded products instead of triggering a new API request
   - Search is applied to `this.products` array (already in memory) rather than calling `loadProducts()` with search parameter
   - The `loadProducts()` function correctly sets `pageSize=10000` when search is active, but `applyFilters()` may not be calling it

2. **Missing API Request**: When search query changes, the system doesn't call `loadProducts()` to fetch new results
   - `applyFilters()` may be using client-side `.filter()` on existing products
   - No API request is triggered when search input changes

3. **Pagination Override**: Even though `loadProducts()` sets `pageSize=10000` for search, pagination parameters may override it
   - `currentProductPage` and `productsPerPage` may be applied even during search
   - API may be limiting results despite large pageSize

## Correctness Properties

Property 1: Bug Condition - Order Images Horizontal Layout

_For any_ order card rendering where product images exist, the fixed code SHALL display images horizontally in a row from left to right using flexbox layout with 12px gap, 100x100px image size, and proper border-radius styling.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Bug Condition - Product Search Database-Wide

_For any_ search query entered in the catalog page, the fixed code SHALL query the entire database (~10,000 products) via API request with large pageSize, perform case-insensitive matching, and return all matching products regardless of current page.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 3: Preservation - Order Card Information Display

_For any_ order card rendering that does NOT involve image layout, the fixed code SHALL produce exactly the same behavior as the original code, preserving display of date, item count, price, status, actions, "+N" indicator, and fallback icons.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 4: Preservation - Non-Search Product Browsing

_For any_ product browsing that does NOT involve search queries, the fixed code SHALL produce exactly the same behavior as the original code, preserving pagination (50 products per page), filters, sorting, and exact match prioritization.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Bug 1: Order Images Display

Assuming our root cause analysis is correct:

**File**: `wwwroot/css/pages/orders.css` and potentially HTML template

**Specific Changes**:

1. **Verify CSS File Loading**: Ensure `wwwroot/css/pages/orders.css` is properly linked in the orders page HTML
   - Check for `<link rel="stylesheet" href="/css/pages/orders.css">` in the page header
   - Verify file path is correct and file is accessible

2. **Increase CSS Specificity**: Add more specific selectors to override conflicting styles
   - Change `.order-items-preview-list` to `.order-row .order-items-preview-col .order-items-preview-list`
   - Add `!important` flags to critical flexbox properties if not already present

3. **Fix Parent Container**: Ensure parent `.order-items-preview-col` doesn't constrain the flexbox
   - Add `display: flex` to `.order-items-preview-col` if needed
   - Remove any `display: block` or width constraints that prevent horizontal layout

4. **Verify Inline Styles**: Ensure JavaScript-generated inline styles are applied correctly
   - Check that `renderOrderCard()` generates correct HTML with inline styles
   - Verify no other script is modifying these styles after rendering

5. **Remove Conflicting Styles**: Search for and remove any CSS rules that force vertical layout
   - Look for `flex-direction: column` on parent containers
   - Look for `display: block` or `display: grid` that overrides flexbox

### Bug 2: Product Search

Assuming our root cause analysis is correct:

**File**: `wwwroot/js/modules/products.js`

**Function**: `applyFilters`

**Specific Changes**:

1. **Trigger API Request on Search**: Modify `applyFilters()` to call `loadProducts()` instead of filtering client-side
   - Remove client-side `.filter()` logic for search
   - Call `await this.loadProducts(true)` to fetch new results from API

2. **Reset Pagination on Search**: When search query is active, reset to page 1
   - Set `this.currentProductPage = 1` when search query changes
   - Ensure `loadProducts()` uses `pageSize=10000` for search (already implemented)

3. **Clear Search on Empty Query**: When search is cleared, return to normal pagination
   - Check if search query is empty in `applyFilters()`
   - If empty, use default `pageSize` and current page number

4. **Update Search Input Handler**: Ensure search input triggers `applyFilters()` correctly
   - Verify `filter-search` input has proper event listener
   - Add debouncing if needed to avoid excessive API calls

5. **Verify API Integration**: Ensure `loadProducts()` correctly passes search parameter to API
   - Already implemented: `if (search) params.append('search', search);`
   - Verify API endpoint `GetProducts` handles search correctly (already implemented)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate both bugs BEFORE implementing the fixes. Confirm or refute the root cause analysis.

**Test Plan**: Write tests that simulate order rendering and product search, then observe failures on UNFIXED code to understand root causes.

**Test Cases**:

1. **Order Images Layout Test**: Render order card with 3 products and check computed CSS styles (will fail on unfixed code)
   - Expected failure: Images display with `flex-direction: column` or `display: block` instead of `flex-direction: row`

2. **Order Images CSS Loading Test**: Check if `orders.css` is loaded and styles are applied (will fail on unfixed code)
   - Expected failure: CSS file not loaded or styles overridden by higher specificity rules

3. **Product Search Scope Test**: Search for product that exists on page 150 while on page 1 (will fail on unfixed code)
   - Expected failure: Empty results because search only checks current page products

4. **Product Search API Request Test**: Monitor network requests when search is performed (will fail on unfixed code)
   - Expected failure: No API request triggered, or API request uses small pageSize

**Expected Counterexamples**:
- Order images display vertically due to missing/overridden CSS or parent container constraints
- Product search returns empty results for products not on current page
- Possible causes: CSS specificity conflict, CSS file not loaded, client-side filtering, missing API request

### Fix Checking

**Goal**: Verify that for all inputs where the bug conditions hold, the fixed functions produce the expected behavior.

**Pseudocode for Bug 1:**
```
FOR ALL orderCard WHERE isBugCondition_Images(orderCard) DO
  result := renderOrderCard_fixed(orderCard)
  ASSERT result.imagesLayout == 'horizontal'
  ASSERT result.imageStyles.display == 'flex'
  ASSERT result.imageStyles.flexDirection == 'row'
  ASSERT result.imageStyles.gap == '12px'
END FOR
```

**Pseudocode for Bug 2:**
```
FOR ALL searchQuery WHERE isBugCondition_Search(searchQuery) DO
  result := applyFilters_fixed(searchQuery)
  ASSERT result.apiRequestTriggered == true
  ASSERT result.pageSize >= 10000
  ASSERT result.searchScope == 'entireDatabase'
  ASSERT result.matchingProducts.length == totalMatchesInDatabase
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed functions produce the same results as the original functions.

**Pseudocode for Bug 1:**
```
FOR ALL orderCard WHERE NOT isBugCondition_Images(orderCard) DO
  ASSERT renderOrderCard_original(orderCard) == renderOrderCard_fixed(orderCard)
END FOR
```

**Pseudocode for Bug 2:**
```
FOR ALL productBrowsing WHERE NOT isBugCondition_Search(productBrowsing) DO
  ASSERT loadProducts_original(productBrowsing) == loadProducts_fixed(productBrowsing)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-bug scenarios, then write property-based tests capturing that behavior.

**Test Cases**:

1. **Order Card Non-Image Elements Preservation**: Verify date, item count, price, status, actions display correctly after fix
2. **Order "+N" Indicator Preservation**: Verify orders with >3 products show "+N" indicator correctly
3. **Order Fallback Icon Preservation**: Verify failed images show fallback icon correctly
4. **Product Pagination Preservation**: Verify pagination works correctly when no search is active (50 products per page)
5. **Product Filters Preservation**: Verify category, price, stock filters work correctly without search
6. **Product Sorting Preservation**: Verify sorting works correctly after fix
7. **Exact Match Preservation**: Verify exact article/name matches are prioritized correctly

### Unit Tests

- Test order card rendering with 0, 1, 3, and 5 products
- Test CSS styles are applied correctly to image containers
- Test search triggers API request with correct parameters
- Test search with empty query returns to pagination mode
- Test pagination parameters are correct for search vs non-search

### Property-Based Tests

- Generate random order data and verify images always display horizontally
- Generate random search queries and verify all matching products are returned from database
- Generate random product browsing scenarios (no search) and verify pagination works correctly
- Test that all non-search filters continue to work across many scenarios

### Integration Tests

- Test full order page rendering with multiple orders containing various product counts
- Test full search flow: enter query → API request → results display → clear search → return to pagination
- Test switching between search mode and pagination mode
- Test search combined with filters (category, price, stock)
- Test visual feedback and UI updates during search
