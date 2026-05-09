# Bugfix Requirements Document

## Introduction

This document addresses two critical bugs affecting the e-commerce platform:

1. **Order Images Display Bug**: Product images in the "My Orders" page are displaying vertically (stacked in a column) instead of horizontally (in a row from left to right), despite inline styles being added to force horizontal layout.

2. **Product Search Bug**: The search functionality only searches products on the currently loaded page (~50 products) instead of searching across the entire database (~10,000 products across 200+ pages), resulting in empty search results for products not on the current page.

Both bugs significantly impact user experience - the first affects visual presentation and usability of the orders page, while the second prevents users from finding products they're looking for.

## Bug Analysis

### Bug 1: Order Images Display

#### Current Behavior (Defect)

1.1 WHEN the "My Orders" page renders order cards with product images THEN the system displays images vertically in a column layout instead of horizontally

1.2 WHEN inline styles `display: flex !important; flex-direction: row !important;` are applied to `.order-items-preview-list` in JavaScript THEN the system ignores these styles and continues displaying images vertically

1.3 WHEN browser cache is cleared and page is hard-refreshed THEN the system still displays images in vertical layout

1.4 WHEN CSS file `wwwroot/css/pages/orders.css` contains correct horizontal layout styles (lines 475-550) THEN the system does not apply these styles to the rendered elements

#### Expected Behavior (Correct)

2.1 WHEN the "My Orders" page renders order cards with product images THEN the system SHALL display images horizontally in a row from left to right

2.2 WHEN product images are displayed THEN the system SHALL render each image as 100x100px with border-radius of 12px (rounded corners)

2.3 WHEN multiple product images exist in an order THEN the system SHALL display them with 12px gap between images using flexbox row layout

2.4 WHEN order card layout is rendered THEN the system SHALL follow this order: Date → Photos → Item Count → Price → Status → Actions button

2.5 WHEN CSS styles are defined in `wwwroot/css/pages/orders.css` THEN the system SHALL apply these styles to the corresponding HTML elements

2.6 WHEN inline styles with `!important` flags are applied THEN the system SHALL respect these styles and override any conflicting CSS

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN order cards display other information (date, item count, price, status, actions) THEN the system SHALL CONTINUE TO display this information correctly in their designated columns

3.2 WHEN an order has more than 3 products THEN the system SHALL CONTINUE TO display a "+N" indicator showing the count of additional items

3.3 WHEN a product image fails to load THEN the system SHALL CONTINUE TO display a fallback icon (fa-tools)

3.4 WHEN orders are loaded and rendered THEN the system SHALL CONTINUE TO fetch and display all order data correctly

### Bug 2: Product Search

#### Current Behavior (Defect)

1.1 WHEN a user enters a search query in the catalog search field THEN the system only searches products on the currently loaded page (~50 products) instead of the entire database

1.2 WHEN a user searches for a product that exists in the database but not on the current page THEN the system returns empty results

1.3 WHEN search is active and `pageSize=10000` is set in the API request THEN the system still returns limited results

1.4 WHEN the ProductsController uses `.ToLower().Contains()` for case-insensitive search THEN the system still fails to find products that should match the search query

#### Expected Behavior (Correct)

2.1 WHEN a user enters a search query THEN the system SHALL search across all products in the database (~10,000 products) regardless of current page

2.2 WHEN a search query matches products in the database THEN the system SHALL return all matching products from the entire database

2.3 WHEN search is active THEN the system SHALL use a large pageSize (e.g., 10000) to retrieve all matching results in a single request

2.4 WHEN search query is submitted THEN the system SHALL perform case-insensitive matching against product name, article, and description fields

2.5 WHEN search results are returned THEN the system SHALL display all matching products to the user

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN no search query is entered THEN the system SHALL CONTINUE TO use pagination with default page size (50 products per page)

3.2 WHEN filters (category, price range, stock status) are applied without search THEN the system SHALL CONTINUE TO work with paginated results

3.3 WHEN search is cleared THEN the system SHALL CONTINUE TO return to normal paginated browsing mode

3.4 WHEN sorting is applied THEN the system SHALL CONTINUE TO sort results correctly

3.5 WHEN exact article or name matches are found THEN the system SHALL CONTINUE TO prioritize and return these exact matches first
