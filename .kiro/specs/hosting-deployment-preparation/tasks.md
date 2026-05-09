# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Deployment Artifacts Missing
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate deployment artifacts are missing
  - **Scoped PBT Approach**: Check for existence of specific required files and functionality
  - Test that Database_PRODUCTION.sql does not exist in repository
  - Test that Database_SEED_DATA.sql does not exist in repository
  - Test that Controllers/ReportsController.cs does not exist
  - Test that wwwroot/templates/reports.html does not exist
  - Test that wwwroot/js/pages/reports.js does not exist
  - Test that DEPLOYMENT_INSTRUCTIONS.md does not exist
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (missing files and functionality)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Functionality Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for existing features
  - Test catalog functionality (search, filters, sorting) works correctly
  - Test cart operations (add, update, remove) work correctly
  - Test order placement and viewing work correctly
  - Test admin product CRUD operations work correctly
  - Test authentication and authorization work correctly
  - Write property-based tests capturing observed behavior patterns
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Implement deployment preparation artifacts

  - [ ] 3.1 Create Database_PRODUCTION.sql script
    - Generate CREATE TABLE statements for all entities (users, products, categories, orders, order_items, carts, cart_items, notifications, import_jobs, import_rows, import_logs)
    - Include all indexes (IX_Products_Article, IX_Products_Name, IX_Attributes_Name, IX_Users_Email)
    - Define foreign keys and check constraints (user roles, order statuses, registration statuses)
    - Set appropriate default values (CreatedAt = NOW(), IsActive = true, RegistrationStatus = 'pending')
    - Include PostgreSQL sequences for auto-increment IDs
    - _Bug_Condition: isBugCondition(deploymentAttempt) where NOT EXISTS(deploymentAttempt.sqlScripts.productionSchema)_
    - _Expected_Behavior: EXISTS(Database_PRODUCTION.sql) with complete schema_
    - _Preservation: No changes to existing database operations through Entity Framework_
    - _Requirements: 2.1_

  - [ ] 3.2 Create Database_SEED_DATA.sql script
    - Create admin user (admin@blackonyx.by, BCrypt hashed password, Admin role)
    - Create 3-5 test customer accounts (mix of B2C and B2B, various registration statuses)
    - Create product categories (Электроинструменты, Ручной инструмент, Измерительные приборы, Расходные материалы, Оборудование)
    - Insert 20-30 products (diverse categories, price ranges 50-5000 BYN, various stock levels, realistic descriptions)
    - Create 5-10 test orders (different customers, various statuses, dates within last 30 days, realistic totals)
    - _Bug_Condition: isBugCondition(deploymentAttempt) where NOT EXISTS(deploymentAttempt.sqlScripts.seedData)_
    - _Expected_Behavior: EXISTS(Database_SEED_DATA.sql) with test data_
    - _Preservation: No changes to existing data or data access patterns_
    - _Requirements: 2.2_

  - [ ] 3.3 Implement ReportsController
    - Create Controllers/ReportsController.cs with [Authorize(Roles = "Admin")]
    - Implement GET /api/reports/sales endpoint (query params: startDate, endDate; returns: sales summary, order count, total revenue, average order value)
    - Implement GET /api/reports/sales/details endpoint (query params: startDate, endDate; returns: detailed order list with items)
    - Implement GET /api/reports/products/top endpoint (query params: startDate, endDate, limit; returns: most sold products by quantity and revenue)
    - Implement GET /api/reports/customers endpoint (returns: customer statistics, order frequency, average order value)
    - Implement GET /api/reports/sales/export endpoint (query params: startDate, endDate; returns: CSV file download with Content-Type: text/csv)
    - _Bug_Condition: isBugCondition(deploymentAttempt) where NOT EXISTS(deploymentAttempt.features.salesReports)_
    - _Expected_Behavior: EXISTS(ReportsController) with all analytics endpoints_
    - _Preservation: No changes to existing controllers or API endpoints_
    - _Requirements: 2.3, 2.4_

  - [ ] 3.4 Create reports UI
    - Create wwwroot/templates/reports.html with date range selector (default: last 30 days)
    - Add sales summary cards (Total Revenue, Order Count, Average Order Value, Top Product)
    - Add sales details table (columns: Order ID, Date, Customer, Items Count, Total; sortable, paginated)
    - Add export button (triggers CSV download with current date range)
    - Create wwwroot/js/pages/reports.js with initialization, data fetching, rendering, and export logic
    - Create wwwroot/css/pages/reports.css with responsive layout, card grid, table styling
    - Add "Отчеты" link to admin navigation (visible only for Admin role)
    - _Bug_Condition: isBugCondition(deploymentAttempt) where NOT EXISTS(deploymentAttempt.features.salesReports)_
    - _Expected_Behavior: EXISTS(reports UI) with functional date selection, data display, and CSV export_
    - _Preservation: No changes to existing UI pages or navigation structure_
    - _Requirements: 2.3, 2.4_

  - [ ] 3.5 Create DEPLOYMENT_INSTRUCTIONS.md
    - Add Prerequisites section (hosting requirements, PostgreSQL, SSL certificate)
    - Add Database Setup section (create database, execute Database_PRODUCTION.sql, execute Database_SEED_DATA.sql, verify)
    - Add Application Configuration section (update appsettings.Production.json, set connection string, generate JWT secret, configure CORS)
    - Add Build and Publish section (dotnet publish command, files to upload, directory structure)
    - Add Hosting Deployment section (Azure App Service, DigitalOcean/VPS with Nginx, Somee.com, environment variables)
    - Add Post-Deployment Verification section (test login, catalog, orders, reports, CSV export)
    - Add Troubleshooting section (database connection errors, JWT issues, static files, CORS errors)
    - _Bug_Condition: isBugCondition(deploymentAttempt) where NOT EXISTS(deploymentAttempt.documentation.deploymentInstructions)_
    - _Expected_Behavior: EXISTS(DEPLOYMENT_INSTRUCTIONS.md) with complete step-by-step guide_
    - _Preservation: No changes to existing documentation or configuration files_
    - _Requirements: 2.5_

  - [ ] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Deployment Artifacts Available
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify Database_PRODUCTION.sql exists and contains complete schema
    - Verify Database_SEED_DATA.sql exists and contains test data
    - Verify ReportsController.cs exists with all endpoints
    - Verify reports UI files exist (reports.html, reports.js, reports.css)
    - Verify DEPLOYMENT_INSTRUCTIONS.md exists with complete guide
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Functionality Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify catalog functionality still works (search, filters, sorting)
    - Verify cart operations still work (add, update, remove)
    - Verify order placement and viewing still work
    - Verify admin product CRUD still works
    - Verify authentication and authorization still work
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Integration testing and validation

  - [ ] 4.1 Test database scripts
    - Create test PostgreSQL database
    - Execute Database_PRODUCTION.sql and verify all tables created
    - Verify indexes, constraints, and default values are correct
    - Execute Database_SEED_DATA.sql and verify data inserted
    - Verify admin user, customers, products, categories, and orders exist
    - Test SQL scripts execute without errors

  - [ ] 4.2 Test reports functionality
    - Start application and login as admin
    - Navigate to Reports section
    - Test date range selection and data loading
    - Verify sales summary displays correct metrics
    - Verify sales details table shows orders
    - Test CSV export downloads file correctly
    - Open CSV in Excel and verify data format
    - Test with various date ranges and edge cases

  - [ ] 4.3 Test deployment process
    - Follow DEPLOYMENT_INSTRUCTIONS.md step-by-step
    - Deploy to test environment (or simulate deployment)
    - Verify application starts correctly
    - Test all existing features work (catalog, cart, orders, admin)
    - Test new reports feature works
    - Verify no regressions in existing functionality

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise
  - Verify all deployment artifacts are created and functional
  - Verify existing functionality is preserved without regressions
  - Confirm application is ready for production deployment
