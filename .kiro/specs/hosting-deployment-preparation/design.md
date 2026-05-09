# Hosting Deployment Preparation Design

## Overview

This design addresses the preparation of an ASP.NET Core + SPA application for production hosting deployment. The solution involves creating database initialization scripts, implementing sales reporting functionality with CSV export, and providing comprehensive deployment documentation. The approach ensures the application can be successfully deployed to a hosting environment with a complete database structure, test data, and all required features for diploma defense.

## Glossary

- **Bug_Condition (C)**: The condition where deployment artifacts are missing - when developer attempts to deploy but lacks SQL scripts, reporting functionality, or deployment instructions
- **Property (P)**: The desired state where all deployment artifacts exist and are functional - SQL scripts create database structure, reports display sales data, CSV export works, deployment instructions are complete
- **Preservation**: Existing application functionality that must remain unchanged - catalog, cart, orders, authentication, admin panel
- **Database_PRODUCTION.sql**: SQL script containing complete database schema for production deployment
- **Database_SEED_DATA.sql**: SQL script containing test data (products, users, orders) for demonstration
- **ReportsController**: New ASP.NET Core controller providing sales analytics endpoints
- **CSV Export**: Functionality to export report data in CSV format for Excel compatibility
- **DEPLOYMENT_INSTRUCTIONS.md**: Step-by-step guide for deploying the application to hosting

## Bug Details

### Bug Condition

The bug manifests when a developer attempts to deploy the application to a production hosting environment. The deployment process fails or is incomplete because critical artifacts are missing: database initialization scripts, reporting functionality required for diploma requirements, and deployment documentation.

**Formal Specification:**
```
FUNCTION isBugCondition(deploymentAttempt)
  INPUT: deploymentAttempt of type DeploymentProcess
  OUTPUT: boolean
  
  RETURN NOT EXISTS(deploymentAttempt.sqlScripts.productionSchema)
         OR NOT EXISTS(deploymentAttempt.sqlScripts.seedData)
         OR NOT EXISTS(deploymentAttempt.features.salesReports)
         OR NOT EXISTS(deploymentAttempt.features.csvExport)
         OR NOT EXISTS(deploymentAttempt.documentation.deploymentInstructions)
END FUNCTION
```

### Examples

- **Example 1**: Developer creates PostgreSQL database on hosting → No SQL script available → Must manually recreate all tables → Time-consuming and error-prone
- **Example 2**: Database created but empty → No test data script → Must manually insert products, users, orders → Cannot demonstrate functionality during diploma defense
- **Example 3**: Admin opens application → No "Reports" section → Cannot show sales analytics → Fails diploma requirement for reporting functionality
- **Example 4**: Admin views report → No "Export" button → Cannot export data to CSV → Fails diploma requirement for data export
- **Edge case**: Developer follows deployment guide → Instructions incomplete or missing → Deployment fails → Cannot present working application

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Existing catalog functionality (search, filters, sorting) must continue to work
- Cart and checkout process must remain functional
- Order management for customers and admins must work as before
- User authentication and authorization must remain unchanged
- Product CRUD operations in admin panel must continue working
- B2B registration and moderation must remain functional

**Scope:**
All inputs and operations that do NOT involve deployment preparation, reporting, or CSV export should be completely unaffected by this implementation. This includes:
- All existing API endpoints (Auth, Products, Orders, Users, Cart)
- All existing UI pages (catalog, cart, orders, profile, admin panels)
- All existing database operations through Entity Framework
- All existing authentication and authorization flows

## Hypothesized Root Cause

Based on the bug description, the root causes are:

1. **Missing Database Scripts**: No SQL scripts were created during development
   - Database was created through EF Core migrations or manual operations
   - No export of final schema was performed
   - No seed data script was prepared for production deployment

2. **Incomplete Feature Set**: Reporting functionality was not implemented
   - Diploma requirements include sales reports and data export
   - Focus was on core e-commerce functionality
   - Analytics and reporting were deferred

3. **Missing Documentation**: Deployment process was not documented
   - Development focused on local environment
   - Production deployment steps were not formalized
   - Configuration for hosting environment not specified

4. **No Export Functionality**: CSV export capability was not added
   - Standard requirement for business applications
   - Needed for diploma demonstration
   - Integration with reporting system required

## Correctness Properties

Property 1: Bug Condition - Deployment Artifacts Availability

_For any_ deployment attempt where the bug condition holds (missing SQL scripts, reports, or documentation), the fixed system SHALL provide complete Database_PRODUCTION.sql script with all table schemas, Database_SEED_DATA.sql script with test data, ReportsController with sales analytics endpoints, CSV export functionality, and DEPLOYMENT_INSTRUCTIONS.md with step-by-step deployment guide.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Existing Functionality

_For any_ user interaction that does NOT involve deployment preparation, sales reports, or CSV export (catalog browsing, cart operations, order placement, admin product management), the system SHALL produce exactly the same behavior as before the changes, preserving all existing e-commerce functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `Database_PRODUCTION.sql` (NEW)

**Purpose**: Complete PostgreSQL database schema for production deployment

**Specific Changes**:
1. **Table Creation Scripts**: Generate CREATE TABLE statements for all entities
   - users (with B2B fields, moderation fields)
   - products (with attributes, indexes)
   - categories (hierarchical structure)
   - orders and order_items (with comment field)
   - carts and cart_items
   - notifications
   - import_jobs, import_rows, import_logs (import system)

2. **Indexes**: Include all performance indexes
   - IX_Products_Article (unique)
   - IX_Products_Name
   - IX_Attributes_Name
   - IX_Users_Email (unique)

3. **Constraints**: Define foreign keys and check constraints
   - User roles (Admin, Customer)
   - Order statuses (Новый, В обработке, Завершен, Отменен)
   - Registration statuses (pending, approved, rejected)

4. **Default Values**: Set appropriate defaults
   - CreatedAt = NOW()
   - IsActive = true
   - RegistrationStatus = 'pending'

5. **Sequences**: PostgreSQL sequences for auto-increment IDs

---

**File**: `Database_SEED_DATA.sql` (NEW)

**Purpose**: Test data for demonstration and diploma defense

**Specific Changes**:
1. **Admin User**: Create admin account
   - Email: admin@blackonyx.by
   - Password: Admin123! (BCrypt hashed)
   - Role: Admin

2. **Test Customers**: Create 3-5 customer accounts
   - Mix of B2C and B2B customers
   - Some with approved, some with pending registration status

3. **Categories**: Create product categories
   - Электроинструменты
   - Ручной инструмент
   - Измерительные приборы
   - Расходные материалы
   - Оборудование

4. **Products**: Insert 20-30 products
   - Diverse categories
   - Various price ranges (50-5000 BYN)
   - Different stock levels
   - Realistic descriptions and specifications
   - Image URLs (placeholder or real)

5. **Orders**: Create 5-10 test orders
   - Different customers
   - Various statuses
   - Different dates (last 30 days)
   - Realistic order totals

---

**File**: `Controllers/ReportsController.cs` (NEW)

**Purpose**: Sales analytics and reporting endpoints

**Specific Changes**:
1. **GetSalesReport Endpoint**: GET /api/reports/sales
   - Query parameters: startDate, endDate
   - Returns: sales summary, order count, total revenue, average order value
   - Authorization: [Authorize(Roles = "Admin")]

2. **GetSalesDetails Endpoint**: GET /api/reports/sales/details
   - Query parameters: startDate, endDate
   - Returns: detailed list of orders with items
   - Includes: order ID, date, customer, items, total

3. **GetTopProducts Endpoint**: GET /api/reports/products/top
   - Query parameters: startDate, endDate, limit (default 10)
   - Returns: most sold products by quantity and revenue

4. **GetCustomerStats Endpoint**: GET /api/reports/customers
   - Returns: customer statistics, order frequency, average order value

5. **ExportSalesCSV Endpoint**: GET /api/reports/sales/export
   - Query parameters: startDate, endDate
   - Returns: CSV file download
   - Content-Type: text/csv
   - Filename: sales_report_YYYY-MM-DD.csv

---

**File**: `wwwroot/templates/reports.html` (NEW)

**Purpose**: Admin UI for viewing and exporting reports

**Specific Changes**:
1. **Date Range Selector**: Input fields for start and end dates
   - Default: last 30 days
   - Date pickers for user-friendly selection

2. **Sales Summary Cards**: Display key metrics
   - Total Revenue
   - Order Count
   - Average Order Value
   - Top Product

3. **Sales Details Table**: Detailed order list
   - Columns: Order ID, Date, Customer, Items Count, Total
   - Sortable columns
   - Pagination

4. **Export Button**: Download CSV functionality
   - Triggers API call to /api/reports/sales/export
   - Downloads file with current date range

5. **Charts (Optional)**: Visual representation
   - Sales trend line chart
   - Top products bar chart
   - Using Chart.js or similar library

---

**File**: `wwwroot/js/pages/reports.js` (NEW)

**Purpose**: Frontend logic for reports page

**Specific Changes**:
1. **Initialize Reports**: Load default date range and fetch data
2. **Fetch Sales Data**: API call to get sales report
3. **Render Summary**: Display metrics in cards
4. **Render Table**: Populate sales details table
5. **Export CSV**: Handle download button click
6. **Date Range Change**: Refresh data when dates change

---

**File**: `wwwroot/css/pages/reports.css` (NEW)

**Purpose**: Styling for reports page

**Specific Changes**:
1. **Summary Cards Layout**: Grid layout for metric cards
2. **Table Styling**: Consistent with existing admin tables
3. **Date Picker Styling**: Match existing form inputs
4. **Export Button**: Prominent call-to-action styling
5. **Responsive Design**: Mobile-friendly layout

---

**File**: `DEPLOYMENT_INSTRUCTIONS.md` (NEW)

**Purpose**: Complete deployment guide for hosting

**Specific Changes**:
1. **Prerequisites Section**: List requirements
   - Hosting with ASP.NET Core 7.0+ support
   - PostgreSQL database access
   - SSL certificate (recommended)

2. **Database Setup**: Step-by-step database creation
   - Create PostgreSQL database
   - Execute Database_PRODUCTION.sql
   - Execute Database_SEED_DATA.sql
   - Verify tables and data

3. **Application Configuration**: Production settings
   - Update appsettings.Production.json
   - Set connection string
   - Generate and set JWT secret key
   - Configure CORS for production domain

4. **Build and Publish**: Compilation steps
   - Command: dotnet publish -c Release -o ./publish
   - Files to upload
   - Directory structure

5. **Hosting Deployment**: Platform-specific instructions
   - Azure App Service deployment
   - DigitalOcean/VPS deployment with Nginx
   - Somee.com deployment
   - Environment variables configuration

6. **Post-Deployment Verification**: Testing checklist
   - Test login (admin and customer)
   - Test catalog browsing
   - Test order placement
   - Test admin reports
   - Test CSV export

7. **Troubleshooting**: Common issues and solutions
   - Database connection errors
   - JWT authentication issues
   - Static files not loading
   - CORS errors

---

**File**: `Program.cs` (MODIFY)

**Purpose**: Register ReportsController and ensure CSV support

**Specific Changes**:
1. **No changes required**: Controllers are auto-discovered
2. **Verify**: CSV formatter support (should be default)

---

**File**: `wwwroot/index.html` or navigation (MODIFY)

**Purpose**: Add Reports link to admin navigation

**Specific Changes**:
1. **Admin Menu**: Add "Отчеты" link
   - Only visible for Admin role
   - Links to reports.html
   - Icon: chart or analytics icon

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify that deployment artifacts are missing on the current system (exploratory), then verify that all artifacts are created correctly and function as expected after implementation.

### Exploratory Bug Condition Checking

**Goal**: Confirm that deployment artifacts are currently missing BEFORE implementing the fix. Document the current state to validate the bug condition.

**Test Plan**: Check for existence of required files and functionality in the current codebase. Run these checks on the UNFIXED code to confirm the bug.

**Test Cases**:
1. **Database Script Check**: Search for Database_PRODUCTION.sql file (will not exist on unfixed code)
2. **Seed Data Check**: Search for Database_SEED_DATA.sql file (will not exist on unfixed code)
3. **Reports Controller Check**: Search for ReportsController.cs (will not exist on unfixed code)
4. **Reports UI Check**: Search for reports.html and reports.js (will not exist on unfixed code)
5. **Deployment Instructions Check**: Search for DEPLOYMENT_INSTRUCTIONS.md (will not exist on unfixed code)

**Expected Counterexamples**:
- Files do not exist in the repository
- No reporting endpoints in API
- No reports section in admin UI
- No deployment documentation

### Fix Checking

**Goal**: Verify that for all deployment scenarios where the bug condition holds, the fixed system provides all required artifacts and functionality.

**Pseudocode:**
```
FOR ALL deploymentScenario WHERE isBugCondition(deploymentScenario) DO
  result := checkDeploymentArtifacts(deploymentScenario)
  ASSERT result.hasDatabaseScript = true
  ASSERT result.hasSeedDataScript = true
  ASSERT result.hasReportsController = true
  ASSERT result.hasReportsUI = true
  ASSERT result.hasDeploymentInstructions = true
  ASSERT result.csvExportWorks = true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all user interactions that do NOT involve deployment preparation or reporting, the system produces the same result as before the changes.

**Pseudocode:**
```
FOR ALL userInteraction WHERE NOT isDeploymentOrReporting(userInteraction) DO
  ASSERT systemBehavior_original(userInteraction) = systemBehavior_fixed(userInteraction)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across different user flows
- It catches edge cases in existing functionality that manual tests might miss
- It provides strong guarantees that catalog, cart, orders, and admin functions remain unchanged

**Test Plan**: Test existing functionality before and after implementing deployment preparation features.

**Test Cases**:
1. **Catalog Preservation**: Verify product browsing, search, filters, sorting work identically
2. **Cart Preservation**: Verify add to cart, update quantity, remove items work identically
3. **Order Preservation**: Verify order placement, order viewing, order management work identically
4. **Admin Preservation**: Verify product CRUD, user management, order management work identically
5. **Auth Preservation**: Verify login, registration, JWT tokens work identically

### Unit Tests

- Test ReportsController endpoints with mock data
- Test date range filtering logic
- Test CSV generation with various data sets
- Test sales calculations (totals, averages)
- Test top products ranking algorithm
- Test SQL scripts execute without errors (syntax validation)

### Property-Based Tests

- Generate random date ranges and verify reports return valid data
- Generate random order sets and verify sales calculations are correct
- Generate random product sets and verify top products ranking is accurate
- Test CSV export with various data sizes and special characters
- Verify existing API endpoints continue to work with random valid inputs

### Integration Tests

- Deploy to test environment using Database_PRODUCTION.sql
- Populate database using Database_SEED_DATA.sql
- Verify all tables created correctly with proper constraints
- Test full report generation flow (API → UI → CSV export)
- Test admin can access reports page and view data
- Test CSV file downloads correctly and opens in Excel
- Verify existing features work after deployment (catalog, cart, orders)
- Test complete deployment process following DEPLOYMENT_INSTRUCTIONS.md
