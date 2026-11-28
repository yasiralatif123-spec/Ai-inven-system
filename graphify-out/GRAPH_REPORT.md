# Graph Report - inv_system  (2026-11-28)

## Corpus Check
- 279 files · ~176,358 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 2246 nodes · 5975 edges · 140 communities (103 shown, 37 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 224 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `98e1d8f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Auth Service
- Profile Ui
- Purchase Controller
- Test Db
- Sale Order Controller
- sales-orders/types.ts
- Suppliers View
- Customer Controller
- Edit Product Modal
- Create Owner
- Sales Orders View
- Cancel Order Dialog
- Product Controller
- Purchase Data
- Package Group
- Inventory Page
- Purchases Utilities
- Edit Supplier Dialog
- Dashboard Types
- Brand Controller
- EditProductModal.tsx
- SuppliersView
- Supplier Controller
- Data Group
- Supplier Detail Data
- Auth Controller
- Customers View
- Dashboard Utilities
- Inventory Controller
- SupplierDetailPage.tsx
- Invite Service
- Auth Validator
- Pricing Contract Test
- Brands View
- api.ts
- fetchInventoryProducts
- customers/types.ts
- app.js
- Payment Integrity Test
- units.ts
- apiFetch
- Brands Utilities
- Brand Service
- suppliers/index.ts
- Tsconfig Group
- Units Group
- Create Purchase View
- Password Reset Service
- Payment Accounting
- App Shell
- Brand Filters
- CustomersFooter.tsx
- CustomerAutocompleteProps
- Brand Detail Dialog
- Lifecycle Integrity Test
- Product Utils
- Auth Api
- Package Group
- User Controller
- stock-integrity.test.js
- Brand Autocomplete
- Customers Utilities
- EditCustomerDialogProps
- devDependencies
- mongoose
- Migrate Indexes
- Origin Middleware
- fetchCustomers
- Setup Dotenv Test
- Supplier Financials Test
- Product Autocomplete
- Receive Purchase Dialog
- OrderFormDialog.tsx
- PurchasesFooter.tsx
- rate-limit.middleware.js
- Customer Financials Test
- formatRs
- Inventory Api
- Implementation Progress
- Agents Group
- Stock Table
- Sales Overview
- Skill Group
- Sales Orders Api
- Purchases Api
- Tenancy Group
- product.routes.js
- Brand Select
- Customers Table
- Supplier Filters
- Suppliers Table
- Readme Group
- Package Group
- Templates Group
- Project Memory
- Brands Api
- Implementation Progress
- PurchaseItemsTableProps
- Customer Actions Menu
- Customer Filters
- Purchases Toolbar
- Supplier Actions Menu
- Customers Api
- PurchasesHeaderProps
- Purchase Context Card
- Purchases Table
- Purchase Summary Card
- SalesOrder
- proxy.ts
- Sales Filters
- Suppliers Header
- Suppliers Api
- lifecycle.js
- Project Memory
- Agents Group
- Product Detail Modal
- Implementation Progress
- CreatePurchaseHeaderProps
- Customer Invoices
- DeleteCustomerDialogProps
- EditOrderDialog.tsx
- NewOrderDialog.tsx
- DeleteSupplierDialogProps
- RecordPaymentDialog.tsx
- cloudinary
- Window Group
- backend/package.json
- cors
- Globe Group
- Next Group
- Project Memory
- File Group
- Vercel Group
- Readme Group
- Project Memory
- DeletePurchaseDialogProps
- PurchaseActionsMenuProps
- RecordPurchasePaymentDialogProps
- SuppliersFooterProps

## God Nodes (most connected - your core abstractions)
1. `react` - 75 edges
2. `apiFetch()` - 60 edges
3. `SalesOrdersView()` - 37 edges
4. `CreatePurchaseView()` - 37 edges
5. `mongoose` - 36 edges
6. `next` - 35 edges
7. `AppShell()` - 33 edges
8. `PurchasesView()` - 32 edges
9. `CustomersView()` - 31 edges
10. `CustomerProfile()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Purchase Standalone Compensation` --semantically_similar_to--> `Standalone Compensation Rollback`  [INFERRED] [semantically similar]
  backend/docs/purchases-api.md → IMPLEMENTATION_PROGRESS.md
- `Preserve Existing Behavior During Redesign` --semantically_similar_to--> `Plan Then Approval Workflow`  [INFERRED] [semantically similar]
  .agents/skills/redesign-existing-projects/SKILL.md → PROJECT_MEMORY.md
- `Goods Receipt Idempotency` --semantically_similar_to--> `Payment Idempotency Key`  [INFERRED] [semantically similar]
  backend/docs/purchases-api.md → IMPLEMENTATION_PROGRESS.md
- `Public Business API Decision` --conceptually_related_to--> `Brands Enforce Tenant Auth`  [AMBIGUOUS]
  PROJECT_MEMORY.md → backend/docs/brands-api.md
- `Movement Deletion Contract` --conceptually_related_to--> `Compensating Stock Movement Reversal`  [AMBIGUOUS]
  backend/docs/inventory-api.md → IMPLEMENTATION_PROGRESS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Window icon visual elements** — frontend_public_window_icon, frontend_public_window_window_frame, frontend_public_window_control_dots [EXTRACTED 1.00]
- **Auth And Tenancy Rollout Stack** — backend_docs_auth_api_contract, backend_docs_tenancy_foundation, backend_readme_rollout_flags, backend_docs_brands_api_enforce_tenant_auth, implementation_progress_tenant_fail_closed [INFERRED 0.85]
- **Integrity Phase Progression** — implementation_progress_phase1_financial_records, implementation_progress_phase2_payment_accounting, implementation_progress_phase3_stock_integrity, implementation_progress_phase4_lifecycle_integrity [INFERRED 0.85]
- **Payment Integrity Mechanisms** — implementation_progress_payment_record_schema, implementation_progress_idempotency_key, implementation_progress_conditional_atomic_updates, implementation_progress_opening_balance_immutability [INFERRED 0.85]

## Communities (140 total, 37 thin omitted)

### Community 0 - "Auth Service"
Cohesion: 0.06
Nodes (46): ForgotPasswordPage(), metadata, inter, jetbrainsMono, metadata, RootLayout(), LoginPage(), metadata (+38 more)

### Community 1 - "Profile Ui"
Cohesion: 0.07
Nodes (65): CustomerProfilePage(), priceBasisLabel(), CustomerAccountDossier(), CustomerAccountDossierProps, DetailRow(), TONE_CLASSES, CustomerInvoices(), CustomerNotes() (+57 more)

### Community 2 - "Purchase Controller"
Cohesion: 0.13
Nodes (46): applyStockReceipt(), basePurchasePrice(), buildPurchaseChanges(), clamp(), cleanString(), ConflictError, createPurchase(), createReceiptEntry() (+38 more)

### Community 3 - "Test Db"
Cohesion: 0.08
Nodes (45): mongoose, refreshSessionSchema, mongoose, userSchema, cookieHeader(), loginAs(), request, seed() (+37 more)

### Community 4 - "Sale Order Controller"
Cohesion: 0.19
Nodes (30): applyStockAdjustments(), cleanString(), ConflictError, createSaleOrder(), customerIdOf(), deleteSaleOrder(), findOrder(), findProductForItem() (+22 more)

### Community 5 - "sales-orders/types.ts"
Cohesion: 0.21
Nodes (18): STATUS_TABS, DATE_OPTIONS, HUB_OPTIONS, PAYMENT_OPTIONS, formatOrderTime(), pad(), DateFilter, DateGroup (+10 more)

### Community 6 - "Suppliers View"
Cohesion: 0.13
Nodes (26): DeleteSupplierDialog(), SupplierActionsMenu(), PAYABLE_TABS, SupplierFilters(), SupplierKpis(), SupplierKpisProps, PAGE_SIZES, SuppliersFooter() (+18 more)

### Community 7 - "Customer Controller"
Cohesion: 0.10
Nodes (41): buildCustomerChanges(), CITIES, cleanString(), createCustomer(), CUSTOMER_TYPES, customerResponse(), deleteCustomer(), financialBusinessId() (+33 more)

### Community 8 - "Edit Product Modal"
Cohesion: 0.20
Nodes (14): AddProductForm(), resetForm(), setPrice(), submit(), AddProductPage(), blankForm(), emptyCanonicalPrices(), initialForm (+6 more)

### Community 9 - "Create Owner"
Cohesion: 0.10
Nodes (20): bcrypt, main(), mongoose, normalizeEmail(), parseArgs(), path, runCreateOwner(), slugify() (+12 more)

### Community 10 - "Sales Orders View"
Cohesion: 0.11
Nodes (28): SalesOrdersPage(), handleCreateSale(), handleRecordPayment(), SalesFilters(), SalesOrdersHeader(), SalesOrdersHeaderProps, SalesOrdersView(), handleCancelConfirm() (+20 more)

### Community 11 - "Cancel Order Dialog"
Cohesion: 0.13
Nodes (15): CancelOrderDialog(), CancelOrderDialogProps, DeleteOrderDialog(), DeleteOrderDialogProps, SalesKpis(), SalesKpisProps, filterOrders(), formatNumber() (+7 more)

### Community 12 - "Product Controller"
Cohesion: 0.18
Nodes (23): ensureCloudinaryConfigured(), getCloudinaryConfig(), buildProductMovement(), ConflictError, createProduct(), deleteProduct(), destroyCloudinaryImage(), findOwnedProduct() (+15 more)

### Community 13 - "Purchase Data"
Cohesion: 0.11
Nodes (27): DeletePurchaseDialog(), ACTIONS, PurchaseActionsMenu(), PurchaseReceiptsDialog(), PurchaseReceiptsDialogProps, PurchasesSummary(), PurchasesSummaryProps, PurchasesTable() (+19 more)

### Community 14 - "Package Group"
Cohesion: 0.08
Nodes (31): eslintConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9, eslint-config-next@16.4.6 (+23 more)

### Community 15 - "Inventory Page"
Cohesion: 0.11
Nodes (24): InventoryEmptyState(), InventoryEmptyStateProps, InventoryKpis(), InventoryKpisProps, MovementsLedger(), StockTable(), InventoryPage(), handleAdjusted() (+16 more)

### Community 16 - "Purchases Utilities"
Cohesion: 0.12
Nodes (29): formatStockWithPieces(), toBasePieces(), DateTextInput(), commit(), DateTextInputProps, ProductPicker(), handleKeyDown(), selectProduct() (+21 more)

### Community 17 - "Edit Supplier Dialog"
Cohesion: 0.10
Nodes (23): EMPTY_FORM, FieldProps, EditSupplierDialog(), handleSubmit(), EditSupplierDialogProps, Field(), SelectShell(), toInput() (+15 more)

### Community 18 - "Dashboard Types"
Cohesion: 0.13
Nodes (25): DashboardPage(), CriticalLowStock(), DashboardQuickActions(), DashboardView(), DataSourceStrip(), ICON, OperationalActivity(), TONE_CLASS (+17 more)

### Community 19 - "Brand Controller"
Cohesion: 0.22
Nodes (23): cleanString(), ConflictError, createBrand(), escapeRegex(), findOwnedBrand(), getBrandById(), handleControllerError(), isTenantEnforced() (+15 more)

### Community 20 - "EditProductModal.tsx"
Cohesion: 0.12
Nodes (19): setPriceUnit(), buildInitialForm(), CatalogStatus, EditProductModal(), setPriceUnit(), submit(), EditProductModalProps, Field() (+11 more)

### Community 21 - "SuppliersView"
Cohesion: 0.15
Nodes (11): SuppliersPage(), SuppliersView(), applySupplierList(), confirmSupplierDelete(), handleExport(), handleSupplierSaved(), load(), downloadCsv() (+3 more)

### Community 22 - "Supplier Controller"
Cohesion: 0.18
Nodes (24): buildSupplierChanges(), cleanString(), createSupplier(), deleteSupplier(), findOwnedSupplier(), generateSupplierCode(), getNextSupplierCode(), getSupplierByCode() (+16 more)

### Community 23 - "Data Group"
Cohesion: 0.09
Nodes (26): AdjustStockPanel(), changeDirection(), changeQuantity(), changeUnit(), clampQuantity(), handleSubmit(), stepQuantity(), AdjustStockPanelProps (+18 more)

### Community 24 - "Supplier Detail Data"
Cohesion: 0.12
Nodes (24): DOT_CLASSES, SupplierActivityTimelineProps, MasterProfileRow, Purchase, PurchaseDelivery, PurchaseLine, PurchaseStatus, SupplierFinancials (+16 more)

### Community 25 - "Auth Controller"
Cohesion: 0.21
Nodes (17): authenticate(), getAccessToken(), createSession(), findActiveSessionBySid(), mongoose, rawId(), revokeSessionByRefreshToken(), rotateSession() (+9 more)

### Community 26 - "Customers View"
Cohesion: 0.10
Nodes (9): CustomersHeader(), CustomersHeaderProps, CustomersView(), handleExport(), csvCell(), customersToCsv(), downloadCsv(), filterCustomers() (+1 more)

### Community 27 - "Dashboard Utilities"
Cohesion: 0.19
Nodes (24): fetchDashboardSnapshot(), PERIODS, ActivitySeed, addDays(), collectLowStockRows(), getActivityItems(), getDashboardKpis(), getLowStockRows() (+16 more)

### Community 28 - "Inventory Controller"
Cohesion: 0.17
Nodes (20): adjustStock(), cleanString(), ConflictError, deleteStockMovement(), findOwnedMovement(), getMovements(), handleControllerError(), isTenantEnforced() (+12 more)

### Community 29 - "SupplierDetailPage.tsx"
Cohesion: 0.22
Nodes (11): SupplierProfilePage(), DetailTab, SupplierDetailPage(), load(), SupplierDetailPageProps, TABS, SupplierDetailSummary(), SupplierDetailSummaryProps (+3 more)

### Community 30 - "Invite Service"
Cohesion: 0.17
Nodes (19): acceptInvite(), bcrypt, businessIdFor(), createInvite(), listInvites(), revokeInvite(), validateInvite(), normalizeEmail() (+11 more)

### Community 31 - "Auth Validator"
Cohesion: 0.15
Nodes (21): bcrypt, clearAuthCookies(), cookieOptions(), DUMMY_PASSWORD_HASH, login(), logout(), me(), refresh() (+13 more)

### Community 32 - "Pricing Contract Test"
Cohesion: 0.12
Nodes (20): mongoose, paymentRecordSchema, paymentRecordsField, mongoose, purchaseItemSchema, purchaseReceiptSchema, purchaseSchema, mongoose (+12 more)

### Community 33 - "Brands View"
Cohesion: 0.11
Nodes (10): BrandsPage(), BrandFilters(), BrandsHeader(), BrandsHeaderProps, BrandStatusDialog(), BrandsView(), confirmStatus(), FormState (+2 more)

### Community 34 - "api.ts"
Cohesion: 0.53
Nodes (5): isAuthEndpoint(), isBrowser(), isPublicAuthPath(), redirectToExpiredSession(), refreshSession()

### Community 35 - "fetchInventoryProducts"
Cohesion: 0.47
Nodes (5): fetchInventoryProducts(), usePurchaseLookups(), loadProducts(), loadSuppliers(), loadProducts()

### Community 36 - "customers/types.ts"
Cohesion: 0.17
Nodes (25): EMPTY_FORM, CustomerFilters(), BALANCE_TABS, CITY_OPTIONS, CUSTOMER_TYPE_OPTIONS, ROUTE_FILTER_OPTIONS, ROUTE_OPTIONS, SORT_OPTIONS (+17 more)

### Community 37 - "app.js"
Cohesion: 0.14
Nodes (13): allowedOrigins, cookieParser, cors, express, helmet, errorHandler(), router, router (+5 more)

### Community 38 - "Payment Integrity Test"
Cohesion: 0.18
Nodes (15): cookieHeader(), createCustomer(), createProduct(), createPurchase(), createSale(), createSupplier(), customerPayload(), loginAs() (+7 more)

### Community 39 - "units.ts"
Cohesion: 0.15
Nodes (11): CANONICAL_PRICE_DECIMALS, convertPrice(), fromBasePieces(), PIECES_PER_UNIT, pricePerPiece(), roundCanonicalPrice(), STOCK_UNITS, StockUnit (+3 more)

### Community 40 - "apiFetch"
Cohesion: 0.17
Nodes (25): apiFetch(), PurchasesPage(), save(), PurchasesView(), applyUpdatedPurchase(), handleAction(), handleDeleteConfirm(), handleExport() (+17 more)

### Community 41 - "Brands Utilities"
Cohesion: 0.19
Nodes (15): BrandFormDialog(), submit(), BrandFormDialogProps, BRAND_DESCRIPTION_MAX_LENGTH, BRAND_NAME_MAX_LENGTH, CreateBrandInput, asBoolean(), asNumber() (+7 more)

### Community 42 - "Brand Service"
Cohesion: 0.22
Nodes (18): useBrands(), load(), UseBrandsOptions, assertOk(), BrandQueryOptions, BrandSearchResult, createBrand(), extractBrand() (+10 more)

### Community 43 - "suppliers/index.ts"
Cohesion: 0.19
Nodes (21): AddSupplierForm(), handleSubmit(), loadCode(), resetForm(), save(), Field(), SectionCard(), assertOk() (+13 more)

### Community 44 - "Tsconfig Group"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 45 - "Units Group"
Cohesion: 0.24
Nodes (15): assertPositiveQuantity(), CANONICAL_UNITS, cleanString(), convertPrice(), formatStock(), fromBasePieces(), normalizeQuantity(), parseCanonicalPrice() (+7 more)

### Community 46 - "Create Purchase View"
Cohesion: 0.17
Nodes (22): normalizeUnit(), CreatePurchasePage(), CreatePurchaseHeader(), availableStock(), CreatePurchaseView(), addProductRow(), handleBarcodeScan(), handleProductSelect() (+14 more)

### Community 47 - "Password Reset Service"
Cohesion: 0.23
Nodes (14): bcrypt, forgotPassword(), resetPassword(), isConfigured(), { Resend }, resendClient(), sendEmail(), consumePasswordResetToken() (+6 more)

### Community 48 - "Payment Accounting"
Cohesion: 0.19
Nodes (24): buildOrderChanges(), clamp(), recordSaleOrderPayment(), requireCanonicalPrice(), requireMoney(), toWholeNumber(), ValidationError, buildLegacyBalancePayment() (+16 more)

### Community 49 - "App Shell"
Cohesion: 0.19
Nodes (12): AppShell(), intelligenceMenu, mainMenu, NavGroup(), NavItem, roleLabel(), SidebarIcon(), sidebarIcons (+4 more)

### Community 50 - "Brand Filters"
Cohesion: 0.18
Nodes (8): BrandFiltersProps, BrandsFooter(), BrandsFooterProps, PAGE_SIZES, SORT_OPTIONS, STATUS_FILTER_OPTIONS, BrandSort, BrandStatusFilter

### Community 51 - "CustomersFooter.tsx"
Cohesion: 0.33
Nodes (3): CustomersFooter(), CustomersFooterProps, PAGE_SIZES

### Community 53 - "Brand Detail Dialog"
Cohesion: 0.17
Nodes (7): BrandDetailDialog(), BrandDetailDialogProps, DetailItem(), BrandsTable(), BrandsTableProps, formatBrandDate(), formatProductCount()

### Community 54 - "Lifecycle Integrity Test"
Cohesion: 0.23
Nodes (9): cookieHeader(), createApiProduct(), createApiSupplier(), loginAs(), purchasePayload(), randomSuffix(), request, seedProduct() (+1 more)

### Community 55 - "Product Utils"
Cohesion: 0.34
Nodes (13): DetailItem(), Flag(), ProductDetailModal(), handleDelete(), ProductsPage(), load(), formatDate(), formatPricePerPiece() (+5 more)

### Community 56 - "Auth Api"
Cohesion: 0.14
Nodes (14): Auth API Contract, Auth Identity Model, Invite Role Rules, Auth OpenAPI Contract, Origin And Referer Check, Password Reset Flow, Auth Phase 3 Endpoints, Auth Rate Limits (+6 more)

### Community 57 - "Package Group"
Cohesion: 0.17
Nodes (12): dependencies, bcryptjs@^2.4.3, cookie-parser@^1.4.7, express@^4.21.2, helmet@^8.3.0, mongoose@^8.9.5, multer@^1.4.5-lts.1, zod@^4.6.7 (+4 more)

### Community 58 - "User Controller"
Cohesion: 0.50
Nodes (7): businessIdFor(), canManage(), changeRole(), deactivateUser(), listUsers(), revokeAllSessionsForUser(), toUserDto()

### Community 59 - "stock-integrity.test.js"
Cohesion: 0.10
Nodes (18): customerSeed(), seedCustomer(), clearTestDB(), createProduct(), createSupplier(), productApiPayload(), randomSku(), request (+10 more)

### Community 60 - "Brand Autocomplete"
Cohesion: 0.19
Nodes (9): BrandAutocomplete(), handleKeyDown(), selectBrand(), BrandAutocompleteProps, DropdownPosition, BRAND_SEARCH_LIMIT, dedupeBrands(), useBrandSearch() (+1 more)

### Community 61 - "Customers Utilities"
Cohesion: 0.18
Nodes (18): CustomerActionsMenu(), CustomerKpis(), CustomerKpisProps, CustomersTable(), OutstandingCell(), useCustomerProfile(), load(), fetchCustomer() (+10 more)

### Community 63 - "devDependencies"
Cohesion: 0.33
Nodes (6): devDependencies, jest@^30.5.2, nodemon@^3.1.9, supertest@^7.3.2, jest, nodemon

### Community 64 - "mongoose"
Cohesion: 0.08
Nodes (33): applyBackfill(), collectCounts(), databaseNameFromUri(), main(), missingBusinessIdFilter(), mongoose, parseArgs(), path (+25 more)

### Community 65 - "Migrate Indexes"
Cohesion: 0.21
Nodes (14): databaseNameFromUri(), findCompoundUniqueIndex(), findOldGlobalUniqueIndex(), getIndexes(), main(), mongoose, parseArgs(), path (+6 more)

### Community 66 - "Origin Middleware"
Cohesion: 0.22
Nodes (10): requireRole(), allowedOrigins(), checkOrigin(), requestOrigin(), UNSAFE_METHODS, validate(), express, { ipKeyGenerator } (+2 more)

### Community 67 - "fetchCustomers"
Cohesion: 0.11
Nodes (26): AddCustomerForm(), handleSubmit(), loadCode(), resetForm(), Field(), SectionCard(), SelectShell(), handleDeleteCustomer() (+18 more)

### Community 68 - "Setup Dotenv Test"
Cohesion: 0.17
Nodes (9): dotenv@^16.6.1, backendDir, dotenv, envPath, { execFileSync }, fs, path, setupPath (+1 more)

### Community 69 - "Supplier Financials Test"
Cohesion: 0.33
Nodes (10): cookieHeader(), createProduct(), createPurchase(), createSupplier(), item(), loginAs(), purchasePayload(), randomSuffix() (+2 more)

### Community 70 - "Product Autocomplete"
Cohesion: 0.21
Nodes (7): parseMoneyInput(), DropdownPosition, formatPrice(), ProductAutocomplete(), handleKeyDown(), selectProduct(), ProductAutocompleteProps

### Community 71 - "Receive Purchase Dialog"
Cohesion: 0.27
Nodes (7): initialValues(), itemKey(), ReceivedValues, ReceivePurchaseDialog(), handleSubmit(), receiveAll(), ReceivePurchaseDialogProps

### Community 72 - "OrderFormDialog.tsx"
Cohesion: 0.11
Nodes (24): priceForUnit(), roundMoney(), CustomerAutocomplete(), handleKeyDown(), selectCustomer(), canonicalSalePrice(), EditableItem, emptyItem() (+16 more)

### Community 74 - "rate-limit.middleware.js"
Cohesion: 0.28
Nodes (8): clientIp(), createLimiter(), forgotPasswordLimiter, inviteValidateLimiter, loginLimiter, optionsFor(), { rateLimit, ipKeyGenerator }, refreshLimiter

### Community 75 - "Customer Financials Test"
Cohesion: 0.35
Nodes (9): cookieHeader(), createCustomer(), createProduct(), createSale(), customerPayload(), loginAs(), randomSuffix(), request (+1 more)

### Community 76 - "formatRs"
Cohesion: 0.21
Nodes (11): PurchaseContextCard(), PurchaseSummaryCard(), SupplierAutocomplete(), handleKeyDown(), selectSupplier(), SupplierAutocompleteProps, PAYMENT_METHODS, PURCHASE_FORM_STATUSES (+3 more)

### Community 77 - "Inventory Api"
Cohesion: 0.20
Nodes (10): Adjust Stock Endpoint, Inventory API Contract, Movement Flavor Breakdown, Movement Deletion Contract, Stock Movement Ledger, Movement Party Name Snapshot, Compensating Stock Movement Reversal, Immutable Stock Movements (+2 more)

### Community 78 - "Implementation Progress"
Cohesion: 0.20
Nodes (9): Purchase Standalone Compensation, Centralized Financial Recalculation, Standalone Compensation Rollback, Opening Balance Immutability, Phase 1 Customer And Supplier Financial Records, roundMoney Helper, runWithSession Helper, Serialized Recomputation Queue (+1 more)

### Community 79 - "Agents Group"
Cohesion: 0.20
Nodes (8): Cloudinary Upload Requirements, Feature Based Architecture, Next.js Breaking Changes Notice, Frontend Agent Rules, API Service Layer Rules, State Management Priority, TypeScript Rules, Cloudinary Configuration

### Community 80 - "Stock Table"
Cohesion: 0.20
Nodes (8): SEVERITY_ORDER, SortKey, STATUS_BADGE_CLASS, STATUS_BAR_CLASS, STATUS_ROW_CLASS, STATUS_VALUE_CLASS, StockTableProps, STOCK_STATUS_META

### Community 81 - "Sales Overview"
Cohesion: 0.36
Nodes (8): formatCompactRs(), formatRs(), DashboardKpis(), Trend(), PERIODS, SalesOverview(), SalesOverviewProps, chartGeometry()

### Community 82 - "Skill Group"
Cohesion: 0.22
Nodes (6): Design Audit, Fix Priority, Redesign Skill, Scan Diagnose Fix Workflow, Upgrade Techniques, Read Memory First Workflow

### Community 83 - "Sales Orders Api"
Cohesion: 0.22
Nodes (6): Brand Status Endpoint, Base Piece Stock Behavior, Sale Order Cancellation Behavior, Sales Orders API Contract, Sale Order Pricing Behavior, Piece Box Carton Conversion

### Community 84 - "Purchases Api"
Cohesion: 0.22
Nodes (9): Purchase Server Actor Names, Purchases API Contract, Purchase Payment Endpoint, Purchase Price Basis, Purchase Pricing Behavior, Purchase Number Generator, Goods Receipt Idempotency, Purchase Stock Receiving (+1 more)

### Community 85 - "Tenancy Group"
Cohesion: 0.22
Nodes (8): businessId Isolation Boundary, Planned Compound Unique Indexes, Tenancy Foundation Phase 5, Tenant Helpers, Index Migration Script, Auth Tenancy Migration, Planned Number Generator Scoping, Tenant Migration Operator Checklist

### Community 86 - "product.routes.js"
Cohesion: 0.19
Nodes (12): enforceTenantAuth(), hasValidBusinessContext(), isEnabled(), requireRoleWhenEnforced(), multer, storage, upload, express (+4 more)

### Community 87 - "Brand Select"
Cohesion: 0.22
Nodes (4): BrandSelect(), BrandSelectProps, BrandStatusDialogProps, Brand

### Community 91 - "Readme Group"
Cohesion: 0.25
Nodes (8): First Owner Bootstrap Contract, Auth Phase 8 Deferrals, Auth Foundation Phase 2, First Owner Bootstrap, Backend Phase 8 Deferrals, Backend Rollout Flags, Backend StockFlow API, Test Database Guard

### Community 92 - "Package Group"
Cohesion: 0.25
Nodes (8): scripts, create-owner, dev, migrate:auth-tenancy, migrate:indexes, start, test, test:watch

### Community 93 - "Templates Group"
Cohesion: 0.61
Nodes (7): APP_URL(), escapeHtml(), formatDate(), invitationEmail(), layout(), passwordChangedEmail(), passwordResetEmail()

### Community 94 - "Project Memory"
Cohesion: 0.25
Nodes (7): Products And Inventory Under app, Auth And Tenancy State, Verified Current State Snapshot, Known Bugs Issues And Risks, Business Models Overview, Stale Documentation Risk, StockFlow Tech Stack

### Community 95 - "Brands Api"
Cohesion: 0.29
Nodes (7): Brand DTO, Brands API Contract, Cross Business Brand Returns 404, Brands Enforce Tenant Auth, Brand Product Relationship, Brand Search And Pagination, Phase 6A Product And Inventory Enforcement

### Community 96 - "Implementation Progress"
Cohesion: 0.29
Nodes (6): Sale Order Endpoints, Sale Payment Stock Invariance, Conditional Atomic Payment Updates, Legacy Paid Balance Migration, Embedded Payment Record Schema, Phase 2 Internal Payment Accounting

### Community 102 - "Customers Api"
Cohesion: 0.33
Nodes (6): Customers API Contract, Customer Create Rules, Customer DTO, Customer Ledger Code, Customer Phone Normalization, Customer Update Preservation

### Community 107 - "SalesOrder"
Cohesion: 0.11
Nodes (6): OrderActionsMenu(), OrderActionsMenuProps, itemLabel(), OrdersTable(), OrdersTableProps, SalesOrder

### Community 108 - "proxy.ts"
Cohesion: 0.47
Nodes (5): config, hasAuthCookie(), isPublicPath(), proxy(), PUBLIC_PATHS

### Community 111 - "Suppliers Api"
Cohesion: 0.40
Nodes (5): Supplier Code Generator, Suppliers API Contract, Supplier DTO, Supplier Product ID Pruning, Supplier Update Preservation

### Community 112 - "lifecycle.js"
Cohesion: 0.40
Nodes (4): PURCHASE_FLOW, PURCHASE_STATUSES, SALE_FLOW, SALE_STATUSES

### Community 113 - "Project Memory"
Cohesion: 0.40
Nodes (5): Auth Phases 1 And 2, Invite Only Registration, JWT Refresh Session Lifecycle, Phase 8 Auth Deferrals, Auth And Tenant Rollout Flags

### Community 116 - "Implementation Progress"
Cohesion: 0.50
Nodes (4): Conditional Role Authorization, Lifecycle Transition Rules, Phase 4 Sales And Purchase Lifecycle Integrity, Tenant Fail Closed

### Community 120 - "EditOrderDialog.tsx"
Cohesion: 0.40
Nodes (3): EditOrderDialog(), EditOrderDialogProps, draftOrderFromSalesOrder()

### Community 121 - "NewOrderDialog.tsx"
Cohesion: 0.40
Nodes (3): NewOrderDialog(), NewOrderDialogProps, createEmptyDraftOrder()

### Community 123 - "RecordPaymentDialog.tsx"
Cohesion: 0.29
Nodes (4): newPaymentKey(), RecordPaymentDialog(), RecordPaymentDialogProps, PAYMENT_METHODS

### Community 125 - "Window Group"
Cohesion: 1.00
Nodes (3): Three window-control dots depicted in the icon, Window Icon SVG (16x16 gray line-art), Window frame glyph depicted in the icon

### Community 126 - "backend/package.json"
Cohesion: 0.18
Nodes (10): express-rate-limit@^8.7.5, jsonwebtoken@^9.0.2, resend@^6.39.0, main, name, private, version, express-rate-limit (+2 more)

## Ambiguous Edges - Review These
- `Movement Deletion Contract` → `Compensating Stock Movement Reversal`  [AMBIGUOUS]
  backend/docs/inventory-api.md · relation: conceptually_related_to
- `Public Business API Decision` → `Brands Enforce Tenant Auth`  [AMBIGUOUS]
  PROJECT_MEMORY.md · relation: conceptually_related_to

## Knowledge Gaps
- **79 isolated node(s):** `Customer DTO`, `Customer Ledger Code`, `Customer Phone Normalization`, `Customer Update Preservation`, `Supplier Code Generator` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 688 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Edit Supplier Dialog` to `Auth Service`, `Profile Ui`, `sales-orders/types.ts`, `Suppliers View`, `Edit Product Modal`, `Sales Orders View`, `Cancel Order Dialog`, `Purchase Data`, `Package Group`, `Inventory Page`, `Purchases Utilities`, `Dashboard Types`, `EditProductModal.tsx`, `Data Group`, `SupplierDetailPage.tsx`, `Brands View`, `fetchInventoryProducts`, `customers/types.ts`, `units.ts`, `Brands Utilities`, `Brand Service`, `Create Purchase View`, `App Shell`, `Brand Filters`, `Brand Detail Dialog`, `Product Utils`, `Brand Autocomplete`, `Customers Utilities`, `Product Autocomplete`, `Receive Purchase Dialog`, `OrderFormDialog.tsx`, `formatRs`, `Stock Table`, `Sales Overview`, `Brand Select`, `SalesOrder`, `RecordPaymentDialog.tsx`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **What connects `Customer DTO`, `Customer Ledger Code`, `Customer Phone Normalization` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Service` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Why does `apiFetch()` connect `apiFetch` to `Auth Service`, `api.ts`, `fetchInventoryProducts`, `customers/types.ts`, `fetchCustomers`, `sales-orders/types.ts`, `Edit Product Modal`, `Brand Service`, `Sales Orders View`, `suppliers/index.ts`, `Inventory Page`, `EditProductModal.tsx`, `Product Utils`, `Data Group`, `Customers Utilities`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `Profile Ui` be split into smaller, more focused modules?**
  _Cohesion score 0.0653417645287564 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Movement Deletion Contract` and `Compensating Stock Movement Reversal`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Public Business API Decision` and `Brands Enforce Tenant Auth`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._