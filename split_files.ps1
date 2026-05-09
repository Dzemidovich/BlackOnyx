# Split index.html into separate CSS and JS files
# Run from project root: .\split_files.ps1
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Reading index.html..."
$lines = Get-Content wwwroot/index.html -Encoding UTF8

Write-Host "Total lines: $($lines.Count)"

# ============================================================
# HELPER FUNCTIONS
# ============================================================

function Write-FileLines($path, $lineArray) {
    $dir = Split-Path $path -Parent
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    # Join lines and write as UTF8 without BOM
    $content = $lineArray -join "`n"
    [System.IO.File]::WriteAllText((Resolve-Path ".").Path + "\" + $path.Replace("/", "\"), $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  Written: $path ($($lineArray.Count) lines)"
}

function Get-Lines($startLine, $endLine) {
    # 1-indexed, inclusive
    return $lines[($startLine-1)..($endLine-1)]
}

# ============================================================
# CSS EXTRACTION
# ============================================================
Write-Host ""
Write-Host "=== Extracting CSS ==="

# CSS is inside <style> tag: lines 13-6942 (1-indexed)
# Content inside style tag: lines 14-6941

# variables.css - :root block (lines 14-98)
Write-FileLines "wwwroot/css/variables.css" (Get-Lines 14 98)

# base.css - reset, body, utility classes, scrollbar (lines 99-237)
Write-FileLines "wwwroot/css/base.css" (Get-Lines 99 237)

# layout.css - layout, sidebar, bottom nav, main, header, content area, page header (lines 238-912)
Write-FileLines "wwwroot/css/layout.css" (Get-Lines 238 912)

# components/buttons.css - buttons (lines 1040-1163)
Write-FileLines "wwwroot/css/components/buttons.css" (Get-Lines 1040 1163)

# components/cards.css - stats cards + cards + categories grid + product grid + loading + empty state
$cardsCss = (Get-Lines 913 1039) + (Get-Lines 1164 1590) + (Get-Lines 1687 1740)
Write-FileLines "wwwroot/css/components/cards.css" $cardsCss

# components/tables.css - tables + status badges (lines 1591-1686)
Write-FileLines "wwwroot/css/components/tables.css" (Get-Lines 1591 1686)

# components/modals.css - modal (lines 1741-1886) + order details modal (3888-4148)
$modalsCss = (Get-Lines 1741 1886) + (Get-Lines 3888 4148)
Write-FileLines "wwwroot/css/components/modals.css" $modalsCss

# components/forms.css - form elements (lines 2283-2365)
Write-FileLines "wwwroot/css/components/forms.css" (Get-Lines 2283 2365)

# pages/catalog.css - responsive + filters sidebar + categories sidebar + sort/filter controls (lines 1887-2282)
Write-FileLines "wwwroot/css/pages/catalog.css" (Get-Lines 1887 2282)

# pages/reviews.css - reviews styles (lines 2366-3887)
Write-FileLines "wwwroot/css/pages/reviews.css" (Get-Lines 2366 3887)

# pages/support.css - FAQ article cards + support system (lines 4149-6283)
Write-FileLines "wwwroot/css/pages/support.css" (Get-Lines 4149 6283)

# pages/admin.css - modern admin styles (lines 6284-6752)
Write-FileLines "wwwroot/css/pages/admin.css" (Get-Lines 6284 6752)

# pages/analytics.css - scroll to top + animations + scrollbar (lines 6753-6941)
Write-FileLines "wwwroot/css/pages/analytics.css" (Get-Lines 6753 6941)

Write-Host "CSS extraction complete!"

# ============================================================
# JS EXTRACTION
# ============================================================
Write-Host ""
Write-Host "=== Extracting JS ==="

# JS is inside <script> tag: lines 7757-18011 (1-indexed)
# Content inside script tag: lines 7758-18010
# Line 7758: // @ts-nocheck
# Line 7759: /* eslint-disable ... */
# Line 7760: (empty)
# Line 7761: // ===== COMPARISON MANAGER =====
# Line 7762-7818: ComparisonManager object
# Line 7819: const app = {
# Line 7819-18005: app object (ends with };)
# Line 18007-18010: DOMContentLoaded

# Header comment for all JS files
$jsHeader = @(
    "// @ts-nocheck",
    "/* eslint-disable no-unused-expressions, no-undef */"
)

# ---- modules/comparison.js ----
# ComparisonManager: lines 7761-7818
$comparisonJs = $jsHeader + @("") + (Get-Lines 7761 7818)
Write-FileLines "wwwroot/js/modules/comparison.js" $comparisonJs

# ---- core/api.js ----
# fetchApi method: lines 9423-9471
# Wrap as Object.assign addition
$apiJs = $jsHeader + @(
    "",
    "// Core API module - adds fetchApi to app object",
    "// Must be loaded after app.js",
    "Object.assign(app, {"
) + (Get-Lines 9423 9471) + @(
    "});"
)
Write-FileLines "wwwroot/js/core/api.js" $apiJs

# ---- core/router.js ----
# logout, scrollToTop, handleScroll, renderMenu, nav, updateBottomNav, updateCartBadge, updateComparisonBadge, updateFavoritesBadge
# Lines 8178-8555
$routerJs = $jsHeader + @(
    "",
    "// Router/Navigation module - adds navigation methods to app object",
    "// Must be loaded after app.js",
    "Object.assign(app, {"
) + (Get-Lines 8178 8555) + @(
    "});"
)
Write-FileLines "wwwroot/js/core/router.js" $routerJs

# ---- pages/manager.js ----
# Manager functionality: lines 8556-9422
$managerJs = $jsHeader + @(
    "",
    "// Manager page module - adds manager functionality to app object",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 8556 9422) + @(
    "});"
)
Write-FileLines "wwwroot/js/pages/manager.js" $managerJs

# ---- modules/products.js ----
# loadCategories, showCategoryProducts, searchCategories, loadProducts, goToPage, nextPage, prevPage
# loadFavorites, saveFavorites, toggleFavorite, isFavorite, updateFavoritesBadge (9917-9982)
# renderFavorites, checkoutFavorites (9983-10074)
# viewProduct, showProductModal, viewOrder (10075-10194)
# renderDashboard, renderProductCardCompact, setDashboardFilter, toggleCategoriesPanel (10195-10449)
# carousel, search methods (10450-10773)
# renderProducts (10774-10920)
# loadImagesMapping, getProductImage (10756-10773)
# Lines 9472-10920
$productsJs = $jsHeader + @(
    "",
    "// Products module - categories, products, favorites, dashboard, search",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 9472 10920) + @(
    "});"
)
Write-FileLines "wwwroot/js/modules/products.js" $productsJs

# ---- modules/cart.js ----
# loadCart, loadOrders, addToCart, showCartPreview, removeFromCart, updateCartItem, checkout
# Lines 9736-9916
# Note: these are inside products range, so we need to handle overlap
# Actually loadCart starts at 9736 which is inside 9472-10920
# We'll keep products.js as 9472-10920 (includes cart methods too)
# and create cart.js as a separate file with just the cart-specific methods
# But since they're all in the same range, let's just keep products.js as the combined file
# and create cart.js pointing to the same methods via a note

# Actually, let's restructure: products.js = 9472-9735 (categories + products loading)
# cart.js = 9736-9916 (cart operations)
# Then continue products.js from 9917 onwards

# Re-do products.js: categories + products loading only (9472-9735)
$productsJs = $jsHeader + @(
    "",
    "// Products module - categories, products loading, favorites, dashboard, search, rendering",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 9472 9735) + (Get-Lines 9917 10920) + @(
    "});"
)
Write-FileLines "wwwroot/js/modules/products.js" $productsJs

# cart.js: cart operations (9736-9916)
$cartJs = $jsHeader + @(
    "",
    "// Cart module - loadCart, addToCart, removeFromCart, updateCartItem, checkout",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 9736 9916) + @(
    "});"
)
Write-FileLines "wwwroot/js/modules/cart.js" $cartJs

# ---- modules/orders.js ----
# renderOrders, renderCompactOrderCard, filterOrders, reorderItems
# Lines 12644-12847
$ordersJs = $jsHeader + @(
    "",
    "// Orders module - renderOrders, filterOrders, reorderItems",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 12644 12847) + @(
    "});"
)
Write-FileLines "wwwroot/js/modules/orders.js" $ordersJs

# ---- modules/profile.js ----
# renderProfile, updateProfileInfo, changePassword
# Lines 12848-13068
$profileJs = $jsHeader + @(
    "",
    "// Profile module - renderProfile, updateProfileInfo, changePassword",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 12848 13068) + @(
    "});"
)
Write-FileLines "wwwroot/js/modules/profile.js" $profileJs

# ---- modules/notifications.js ----
# renderNotifications, refreshNotifications, markNotificationAsRead
# Lines 14507-14678
$notificationsJs = $jsHeader + @(
    "",
    "// Notifications module - renderNotifications, markNotificationAsRead",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 14507 14678) + @(
    "});"
)
Write-FileLines "wwwroot/js/modules/notifications.js" $notificationsJs

# ---- modules/auth.js ----
# showModal, closeModal, showUserMenu, showSendNotificationModal, sendNotification
# Lines 14679-14771
$authJs = $jsHeader + @(
    "",
    "// Auth/Modal utility module - showModal, closeModal, showUserMenu, sendNotification",
    "// Must be loaded after app.js",
    "Object.assign(app, {"
) + (Get-Lines 14679 14771) + @(
    "});"
)
Write-FileLines "wwwroot/js/modules/auth.js" $authJs

# ---- pages/admin.js ----
# renderAdmin, showAccessDenied, renderAdminProducts, renderAdminCategories, renderAdminImport
# renderAdminUsers, renderAdminOrders, debouncedSearchOrders, searchOrders, filterManagerOrdersByStatus
# refreshManagerOrders, renderAdminSupport, renderAdminFaq, renderUserMarkupsAdmin
# showCreateProductModal, deleteProduct, showCreateCategoryModal, editCategory, saveCategory, deleteCategory
# loadCategoriesForSelect, loadCategoriesForParentSelect, refreshAdminData
# renderProductsTable, renderProductsPagination, goToProductsPage, changeProductsPerPage, sortProducts
# inlineUpdateProduct, toggleSelectAllProducts, updateProductSelection, clearProductSelection
# getSelectedProductIds, bulkChangeCategory, bulkChangeStatus, bulkChangePrice, bulkDeleteProducts
# confirmDeleteProduct, searchAdminProducts, filterAdminProducts, populateAdminProductsFilters
# changeUserRole, toggleUserStatus, refreshAdminUsers, filterAdminOrdersByStatus, sortOrders
# changeOrderStatus, viewOrderDetails, refreshAdminOrders, printOrder, exportOrder
# exportProducts, exportOrders, exportUsers, handleFileSelect, importProducts
# handleModalFileSelect, importProductsFromModal, handleManagerImportFileSelect, importManagerProducts
# cleanupSystem
# Lines 11058-16061
$adminJs = $jsHeader + @(
    "",
    "// Admin pages module - all admin functionality",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 11058 16061) + @(
    "});"
)
Write-FileLines "wwwroot/js/pages/admin.js" $adminJs

# ---- pages/catalog.js (filters) ----
# toggleFilters, closeFilters, toggleCategories, closeCategories, loadCategoriesForSidebar
# selectCategoryFromSidebar, loadFilters, applyFilters, debouncedApplyFilters, resetFilters
# applySorting, toggleSortDirection, updateSortButton, applyQuickFilter, updateActiveFiltersCount
# Lines 16062-16507
$catalogJs = $jsHeader + @(
    "",
    "// Catalog/Filters module - filter and category sidebar functionality",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 16062 16507) + @(
    "});"
)
Write-FileLines "wwwroot/js/pages/catalog.js" $catalogJs

# ---- pages/reviews.js ----
# showOrderReviewModal, showAddReviewForProduct, viewProductReviews, generateStars
# showAddReviewModal, setRating, submitReview, showAdminReviewsModal, refreshPendingReviews
# approveReview, rejectReview
# Lines 16508-16882
$reviewsJs = $jsHeader + @(
    "",
    "// Reviews module - review functionality",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 16508 16882) + @(
    "});"
)
Write-FileLines "wwwroot/js/pages/reviews.js" $reviewsJs

# ---- pages/analytics.js ----
# showCreateUserMarkupModal, editUserMarkup, saveUserMarkup, toggleUserMarkupStatus
# deleteUserMarkup, viewUserMarkupHistory, debouncedFilterUserMarkups, filterUserMarkups
# sortUserMarkups, resetUserMarkupFilters
# updateSalesChart, renderSalesChart, updatePopularProducts, renderPopularProductsChart
# updateCategoryStats, renderCategoryStatsChart
# Lines 16883-17432
$analyticsJs = $jsHeader + @(
    "",
    "// Analytics module - charts, analytics, user markups",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 16883 17432) + @(
    "});"
)
Write-FileLines "wwwroot/js/pages/analytics.js" $analyticsJs

# ---- pages/product-detail.js ----
# showProductDetail, renderProductDetail, renderRelatedProductCard, renderProductNotFound
# renderError, renderCategoriesList, selectCategory, attachProductDetailHandlers
# Lines 17433-17738
$productDetailJs = $jsHeader + @(
    "",
    "// Product detail page module",
    "// Must be loaded after app.js and core/api.js",
    "Object.assign(app, {"
) + (Get-Lines 17433 17738) + @(
    "});"
)
Write-FileLines "wwwroot/js/pages/product-detail.js" $productDetailJs

# ---- pages/comparison.js ----
# showComparisonView, renderComparisonView, renderEmptyComparison, attachComparisonHandlers
# toggleComparison, updateCategoryMargin, updateProductMargin
# Lines 17739-17967
$comparisonPageJs = $jsHeader + @(
    "",
    "// Comparison view module",
    "// Must be loaded after app.js, core/api.js, and modules/comparison.js",
    "Object.assign(app, {"
) + (Get-Lines 17739 17967) + @(
    "});"
)
Write-FileLines "wwwroot/js/pages/comparison.js" $comparisonPageJs

# ---- app.js ----
# Main app object: base properties + init + demoLogin + admin import helpers + DOMContentLoaded
# Lines 7819-8177 (app object start through logout-1) + showToast (17968-18005) + DOMContentLoaded (18007-18010)
$appJs = $jsHeader + @(
    "",
    "// ===== MAIN APP OBJECT =====",
    "// Core app definition with state, configuration, and initialization",
    "// This file must be loaded FIRST among app files"
) + (Get-Lines 7819 8177) + @(
    "",
    "    // showToast - UI notification utility"
) + (Get-Lines 17968 18005) + @(
    "};",
    "",
    "document.addEventListener('DOMContentLoaded', function () {",
    "    app.init();",
    "});"
)
Write-FileLines "wwwroot/js/app.js" $appJs

Write-Host ""
Write-Host "JS extraction complete!"

# ============================================================
# UPDATE index.html
# ============================================================
Write-Host ""
Write-Host "=== Updating index.html ==="

# Build new head section (lines 1-12, replacing style block with link tags)
$headLines = Get-Lines 1 12  # lines before <style>

# CSS link tags
$cssLinks = @(
    "    <link rel=`"stylesheet`" href=`"/css/variables.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/base.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/layout.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/components/buttons.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/components/cards.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/components/tables.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/components/modals.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/components/forms.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/pages/catalog.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/pages/reviews.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/pages/support.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/pages/admin.css`">",
    "    <link rel=`"stylesheet`" href=`"/css/pages/analytics.css`">"
)

# HTML body (lines 6943-7756)
$htmlBody = Get-Lines 6943 7756

# JS script tags
$jsScripts = @(
    "    <script src=`"/js/modules/comparison.js`"></script>",
    "    <script src=`"/js/app.js`"></script>",
    "    <script src=`"/js/core/api.js`"></script>",
    "    <script src=`"/js/core/router.js`"></script>",
    "    <script src=`"/js/pages/manager.js`"></script>",
    "    <script src=`"/js/modules/products.js`"></script>",
    "    <script src=`"/js/modules/cart.js`"></script>",
    "    <script src=`"/js/modules/orders.js`"></script>",
    "    <script src=`"/js/modules/profile.js`"></script>",
    "    <script src=`"/js/modules/notifications.js`"></script>",
    "    <script src=`"/js/modules/auth.js`"></script>",
    "    <script src=`"/js/pages/admin.js`"></script>",
    "    <script src=`"/js/pages/catalog.js`"></script>",
    "    <script src=`"/js/pages/reviews.js`"></script>",
    "    <script src=`"/js/pages/analytics.js`"></script>",
    "    <script src=`"/js/pages/product-detail.js`"></script>",
    "    <script src=`"/js/pages/comparison.js`"></script>"
)

# Closing tags
$closingTags = Get-Lines 18012 18014

# Assemble new index.html
$newHtml = $headLines + $cssLinks + @("</head>", "") + $htmlBody + @("") + $jsScripts + $closingTags

$newHtmlContent = $newHtml -join "`n"
[System.IO.File]::WriteAllText((Resolve-Path ".").Path + "\wwwroot\index.html", $newHtmlContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "  Updated: wwwroot/index.html"

Write-Host ""
Write-Host "=== All done! ==="
Write-Host "Summary:"
Write-Host "  CSS files: 13 files in wwwroot/css/"
Write-Host "  JS files: 17 files in wwwroot/js/"
Write-Host "  index.html: updated with link/script tags"
