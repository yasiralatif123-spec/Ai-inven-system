# Graph Report - inv_system  (2026-11-28)

## Corpus Check
- 284 files · ~180,546 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 2299 nodes · 6179 edges · 138 communities (104 shown, 34 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 233 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9e26a048`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Auth Service
- Profile Ui
- Purchase Controller
- Test Db
- Sale Order Controller
- SalesOrdersView.tsx
- Suppliers View
- customer.controller.js
- Edit Product Modal
- Create Owner
- Sales Orders View
- react
- Product Controller
- Purchase Data
- Package Group
- Inventory Page
- Purchases Utilities
- EditSupplierDialog.tsx
- dashboard/types.ts
- Brand Controller
- EditProductModal.tsx
- createBusiness
- AddSupplierForm.tsx
- Data Group
- Supplier Detail Data
- Auth Controller
- customers/utils.ts
- Dashboard Utilities
- Inventory Controller
- OpeningBalancePaymentSection.tsx
- Invite Service
- Auth Validator
- Pricing Contract Test
- Brands View
- apiFetch
- fetchInventoryProducts
- customers/types.ts
- app.js
- Payment Integrity Test
- units.ts
- PurchasesView
- Brands Utilities
- Brand Service
- supplier.service.ts
- Tsconfig Group
- Units Group
- Create Purchase View
- Password Reset Service
- Payment Accounting
- App Shell
- Brand Filters
- opening-balance-payments.test.js
- CustomerAutocomplete.tsx
- Brand Detail Dialog
- Lifecycle Integrity Test
- Product Utils
- Auth Api
- Package Group
- User Controller
- stock-integrity.test.js
- Brand Autocomplete
- useCustomerProfile
- EditCustomerDialogProps
- devDependencies
- migrate-auth-tenancy.js
- Migrate Indexes
- Origin Middleware
- formatDate
- Setup Dotenv Test
- Supplier Financials Test
- products/types.ts
- Receive Purchase Dialog
- OrderFormDialog.tsx
- upload.middleware.js
- rate-limit.middleware.js
- Customer Financials Test
- formatRs
- Inventory Api
- Implementation Progress
- Agents Group
- Stock Table
- DashboardView.tsx
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
- OrdersTableProps
- Purchases Toolbar
- Supplier Actions Menu
- Customers Api
- SalesOrdersHeader.tsx
- Purchase Context Card
- Purchases Table
- Purchase Summary Card
- OrderActionsMenuProps
- next
- Sales Filters
- Suppliers Header
- Suppliers Api
- lifecycle.js
- Project Memory
- Agents Group
- Product Detail Modal
- Implementation Progress
- purchases/types.ts
- Customer Invoices
- ProductAutocompleteProps
- EditOrderDialogProps
- EditProductModalProps
- suppliers/types.ts
- formatRs
- CancelOrderDialogProps
- Window Group
- backend/package.json
- RecordPaymentDialogProps
- Globe Group
- Next Group
- Project Memory
- File Group
- Vercel Group
- Readme Group
- Project Memory
- jsonwebtoken
- CustomerOrdersLedgerProps

## God Nodes (most connected - your core abstractions)
1. `react` - 76 edges
2. `apiFetch()` - 64 edges
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

## Communities (138 total, 34 thin omitted)

### Community 0 - "Auth Service"
Cohesion: 0.06
Nodes (46): ForgotPasswordPage(), metadata, inter, jetbrainsMono, metadata, RootLayout(), LoginPage(), metadata (+38 more)

### Community 1 - "Profile Ui"
Cohesion: 0.07
Nodes (73): priceBasisLabel(), CustomerAccountDossier(), CustomerAccountDossierProps, DetailRow(), TONE_CLASSES, CustomerInvoices(), CustomerNotes(), CustomerNotesProps (+65 more)

### Community 2 - "Purchase Controller"
Cohesion: 0.13
Nodes (47): applyStockReceipt(), basePurchasePrice(), buildPurchaseChanges(), clamp(), cleanString(), ConflictError, createPurchase(), createReceiptEntry() (+39 more)

### Community 3 - "Test Db"
Cohesion: 0.08
Nodes (35): authTokenSchema, mongoose, businessSchema, mongoose, mongoose, productSchema, mongoose, refreshSessionSchema (+27 more)

### Community 4 - "Sale Order Controller"
Cohesion: 0.16
Nodes (36): applyStockAdjustments(), buildOrderChanges(), clamp(), cleanString(), ConflictError, createSaleOrder(), customerIdOf(), deleteSaleOrder() (+28 more)

### Community 5 - "SalesOrdersView.tsx"
Cohesion: 0.13
Nodes (22): EditOrderDialog(), NewOrderDialog(), NewOrderDialogProps, SalesFilters(), STATUS_TABS, handleExport(), DateFilter, DraftOrderInput (+14 more)

### Community 6 - "Suppliers View"
Cohesion: 0.09
Nodes (27): SuppliersPage(), DeleteSupplierDialog(), SupplierActionsMenu(), SupplierKpis(), SupplierKpisProps, PAGE_SIZES, SuppliersFooter(), SuppliersFooterProps (+19 more)

### Community 7 - "customer.controller.js"
Cohesion: 0.05
Nodes (83): buildCustomerChanges(), CITIES, cleanString(), createCustomer(), CUSTOMER_TYPES, customerResponse(), deleteCustomer(), financialBusinessId() (+75 more)

### Community 8 - "Edit Product Modal"
Cohesion: 0.14
Nodes (17): AddProductForm(), resetForm(), setPrice(), setPriceUnit(), submit(), AddProductPage(), blankForm(), emptyCanonicalPrices() (+9 more)

### Community 9 - "Create Owner"
Cohesion: 0.10
Nodes (20): bcrypt, main(), mongoose, normalizeEmail(), parseArgs(), path, runCreateOwner(), slugify() (+12 more)

### Community 10 - "Sales Orders View"
Cohesion: 0.18
Nodes (22): SalesOrdersPage(), SalesOrdersView(), handleCancelConfirm(), handleCreateOrder(), handleDeleteOrder(), handleRecordPayment(), handleUpdateOrder(), loadData() (+14 more)

### Community 11 - "react"
Cohesion: 0.13
Nodes (15): CancelOrderDialog(), DeleteOrderDialog(), DeleteOrderDialogProps, OrderActionsMenu(), itemLabel(), OrdersTable(), DateGroup, OrderFinancials (+7 more)

### Community 12 - "Product Controller"
Cohesion: 0.16
Nodes (27): ensureCloudinaryConfigured(), getCloudinaryConfig(), buildProductMovement(), canonicalPriceFromBody(), ConflictError, createProduct(), deleteProduct(), destroyCloudinaryImage() (+19 more)

### Community 13 - "Purchase Data"
Cohesion: 0.10
Nodes (23): DeletePurchaseDialog(), DeletePurchaseDialogProps, ACTIONS, PurchaseActionsMenu(), PurchaseActionsMenuProps, PurchasesFooter(), PurchasesFooterProps, PurchasesSummary() (+15 more)

### Community 14 - "Package Group"
Cohesion: 0.08
Nodes (30): eslintConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9, eslint-config-next@16.4.6 (+22 more)

### Community 15 - "Inventory Page"
Cohesion: 0.11
Nodes (24): InventoryEmptyState(), InventoryEmptyStateProps, InventoryKpis(), InventoryKpisProps, MovementsLedger(), StockTable(), InventoryPage(), handleAdjusted() (+16 more)

### Community 16 - "Purchases Utilities"
Cohesion: 0.17
Nodes (20): formatStockWithPieces(), ProductPicker(), handleKeyDown(), selectProduct(), PurchaseDetailDialog(), PurchaseDetailDialogProps, PurchaseItemsTable(), UNIT_OPTIONS (+12 more)

### Community 17 - "EditSupplierDialog.tsx"
Cohesion: 0.15
Nodes (10): EditSupplierDialog(), handleOpeningBalancePayment(), handleSubmit(), EditSupplierDialogProps, Field(), SelectShell(), toInput(), ProductMultiSelect() (+2 more)

### Community 18 - "dashboard/types.ts"
Cohesion: 0.18
Nodes (18): StockStatus, ICON, TONE_CLASS, useDashboard(), load(), fetchDashboardSnapshot(), PERIODS, ActivityItem (+10 more)

### Community 19 - "Brand Controller"
Cohesion: 0.22
Nodes (23): cleanString(), ConflictError, createBrand(), escapeRegex(), findOwnedBrand(), getBrandById(), handleControllerError(), isTenantEnforced() (+15 more)

### Community 20 - "EditProductModal.tsx"
Cohesion: 0.20
Nodes (16): StockUnit, initialForm, buildInitialForm(), CatalogStatus, FormState, toDateInput(), CanonicalPrices, canonicalPricesFromProduct() (+8 more)

### Community 21 - "createBusiness"
Cohesion: 0.15
Nodes (19): cookieHeader(), loginAs(), request, seed(), request, cookieHeader(), createBrandAs(), loginAs() (+11 more)

### Community 22 - "AddSupplierForm.tsx"
Cohesion: 0.16
Nodes (13): AddSupplierPage(), AddSupplierForm(), handleSubmit(), loadCode(), resetForm(), save(), EMPTY_FORM, Field() (+5 more)

### Community 23 - "Data Group"
Cohesion: 0.09
Nodes (27): AdjustStockPanel(), changeDirection(), changeQuantity(), changeUnit(), clampQuantity(), handleSubmit(), stepQuantity(), AdjustStockPanelProps (+19 more)

### Community 24 - "Supplier Detail Data"
Cohesion: 0.12
Nodes (24): DOT_CLASSES, SupplierActivityTimelineProps, MasterProfileRow, Purchase, PurchaseDelivery, PurchaseLine, PurchaseStatus, SupplierFinancials (+16 more)

### Community 25 - "Auth Controller"
Cohesion: 0.21
Nodes (17): authenticate(), getAccessToken(), createSession(), findActiveSessionBySid(), mongoose, rawId(), revokeSessionByRefreshToken(), rotateSession() (+9 more)

### Community 26 - "customers/utils.ts"
Cohesion: 0.07
Nodes (28): CustomerActionsMenu(), CustomerFilters(), CustomerKpis(), CustomerKpisProps, CustomersFooter(), CustomersFooterProps, CustomersHeader(), CustomersHeaderProps (+20 more)

### Community 27 - "Dashboard Utilities"
Cohesion: 0.22
Nodes (19): ActivitySeed, addDays(), collectLowStockRows(), getActivityItems(), getDashboardKpis(), getSalesBuckets(), inRange(), isSameDay() (+11 more)

### Community 28 - "Inventory Controller"
Cohesion: 0.21
Nodes (16): adjustStock(), cleanString(), ConflictError, deleteStockMovement(), findOwnedMovement(), getMovements(), handleControllerError(), isTenantEnforced() (+8 more)

### Community 29 - "OpeningBalancePaymentSection.tsx"
Cohesion: 0.21
Nodes (10): OPENING_BALANCE_PAYMENT_METHODS, formatDate(), formatRs(), newPaymentKey(), OpeningBalancePaymentSection(), handleSubmit(), OpeningBalancePaymentSectionProps, OpeningBalancePaymentInput (+2 more)

### Community 30 - "Invite Service"
Cohesion: 0.17
Nodes (19): acceptInvite(), bcrypt, businessIdFor(), createInvite(), listInvites(), revokeInvite(), validateInvite(), normalizeEmail() (+11 more)

### Community 31 - "Auth Validator"
Cohesion: 0.15
Nodes (21): bcrypt, clearAuthCookies(), cookieOptions(), DUMMY_PASSWORD_HASH, login(), logout(), me(), refresh() (+13 more)

### Community 32 - "Pricing Contract Test"
Cohesion: 0.10
Nodes (24): customerSchema, mongoose, mongoose, paymentRecordSchema, paymentRecordsField, mongoose, purchaseItemSchema, purchaseReceiptSchema (+16 more)

### Community 33 - "Brands View"
Cohesion: 0.11
Nodes (10): BrandsPage(), BrandFilters(), BrandsHeader(), BrandsHeaderProps, BrandStatusDialog(), BrandsView(), confirmStatus(), FormState (+2 more)

### Community 34 - "apiFetch"
Cohesion: 0.29
Nodes (18): apiFetch(), isAuthEndpoint(), isBrowser(), isPublicAuthPath(), redirectToExpiredSession(), refreshSession(), save(), assertOk() (+10 more)

### Community 35 - "fetchInventoryProducts"
Cohesion: 0.33
Nodes (8): fetchInventoryProducts(), usePurchaseLookups(), loadProducts(), loadSuppliers(), load(), useSupplierProducts(), loadProducts(), fetchSuppliers()

### Community 36 - "customers/types.ts"
Cohesion: 0.08
Nodes (51): AddCustomerPage(), AddCustomerForm(), handleSubmit(), loadCode(), resetForm(), EMPTY_FORM, Field(), SectionCard() (+43 more)

### Community 37 - "app.js"
Cohesion: 0.14
Nodes (13): allowedOrigins, cookieParser, cors, express, helmet, errorHandler(), router, router (+5 more)

### Community 38 - "Payment Integrity Test"
Cohesion: 0.18
Nodes (15): cookieHeader(), createCustomer(), createProduct(), createPurchase(), createSale(), createSupplier(), customerPayload(), loginAs() (+7 more)

### Community 39 - "units.ts"
Cohesion: 0.31
Nodes (10): CANONICAL_PRICE_DECIMALS, convertPrice(), fromBasePieces(), normalizeUnit(), PIECES_PER_UNIT, priceForUnit(), pricePerPiece(), roundCanonicalPrice() (+2 more)

### Community 40 - "PurchasesView"
Cohesion: 0.13
Nodes (13): PurchasesPage(), PurchasesHeader(), PurchasesHeaderProps, PurchasesView(), applyUpdatedPurchase(), handleAction(), handleDeleteConfirm(), handleExport() (+5 more)

### Community 41 - "Brands Utilities"
Cohesion: 0.19
Nodes (15): BrandFormDialog(), submit(), BrandFormDialogProps, BRAND_DESCRIPTION_MAX_LENGTH, BRAND_NAME_MAX_LENGTH, CreateBrandInput, asBoolean(), asNumber() (+7 more)

### Community 42 - "Brand Service"
Cohesion: 0.22
Nodes (18): useBrands(), load(), UseBrandsOptions, assertOk(), BrandQueryOptions, BrandSearchResult, createBrand(), extractBrand() (+10 more)

### Community 43 - "supplier.service.ts"
Cohesion: 0.37
Nodes (13): load(), assertOk(), createSupplier(), deleteSupplier(), fetchNextSupplierCode(), fetchSupplier(), formatDate(), readJson() (+5 more)

### Community 44 - "Tsconfig Group"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 45 - "Units Group"
Cohesion: 0.24
Nodes (16): assertPositiveQuantity(), CANONICAL_UNITS, cleanString(), convertPrice(), formatStock(), fromBasePieces(), normalizeQuantity(), normalizeUnit() (+8 more)

### Community 46 - "Create Purchase View"
Cohesion: 0.21
Nodes (19): CreatePurchasePage(), availableStock(), CreatePurchaseView(), addProductRow(), handleBarcodeScan(), handleProductSelect(), handlePurchaseDateChange(), handleRemoveItem() (+11 more)

### Community 47 - "Password Reset Service"
Cohesion: 0.23
Nodes (14): bcrypt, forgotPassword(), resetPassword(), isConfigured(), { Resend }, resendClient(), sendEmail(), consumePasswordResetToken() (+6 more)

### Community 48 - "Payment Accounting"
Cohesion: 0.24
Nodes (21): recordSaleOrderPayment(), buildLegacyBalancePayment(), buildPaymentLabel(), buildPaymentRecord(), cleanString(), crypto, derivePurchasePaidAmount(), deriveSalePaymentState() (+13 more)

### Community 49 - "App Shell"
Cohesion: 0.19
Nodes (12): AppShell(), intelligenceMenu, mainMenu, NavGroup(), NavItem, roleLabel(), SidebarIcon(), sidebarIcons (+4 more)

### Community 50 - "Brand Filters"
Cohesion: 0.18
Nodes (8): BrandFiltersProps, BrandsFooter(), BrandsFooterProps, PAGE_SIZES, SORT_OPTIONS, STATUS_FILTER_OPTIONS, BrandSort, BrandStatusFilter

### Community 51 - "opening-balance-payments.test.js"
Cohesion: 0.36
Nodes (11): cookieHeader(), createCustomer(), createProduct(), createPurchase(), createSale(), createSupplier(), loginAs(), payCustomer() (+3 more)

### Community 52 - "CustomerAutocomplete.tsx"
Cohesion: 0.24
Nodes (5): CustomerAutocomplete(), handleKeyDown(), selectCustomer(), CustomerAutocompleteProps, useCustomerLookup()

### Community 53 - "Brand Detail Dialog"
Cohesion: 0.17
Nodes (7): BrandDetailDialog(), BrandDetailDialogProps, DetailItem(), BrandsTable(), BrandsTableProps, formatBrandDate(), formatProductCount()

### Community 54 - "Lifecycle Integrity Test"
Cohesion: 0.22
Nodes (10): cookieHeader(), createApiProduct(), createApiSupplier(), loginAs(), purchasePayload(), randomSuffix(), request, seedAuth() (+2 more)

### Community 55 - "Product Utils"
Cohesion: 0.37
Nodes (12): DetailItem(), Flag(), ProductDetailModal(), handleDelete(), ProductsPage(), load(), formatDate(), formatPricePerPiece() (+4 more)

### Community 56 - "Auth Api"
Cohesion: 0.14
Nodes (14): Auth API Contract, Auth Identity Model, Invite Role Rules, Auth OpenAPI Contract, Origin And Referer Check, Password Reset Flow, Auth Phase 3 Endpoints, Auth Rate Limits (+6 more)

### Community 57 - "Package Group"
Cohesion: 0.15
Nodes (13): dependencies, bcryptjs@^2.4.3, cookie-parser@^1.4.7, cors@^2.8.5, express-rate-limit@^8.7.5, mongoose@^8.9.5, resend@^6.39.0, zod@^4.6.7 (+5 more)

### Community 58 - "User Controller"
Cohesion: 0.50
Nodes (7): businessIdFor(), canManage(), changeRole(), deactivateUser(), listUsers(), revokeAllSessionsForUser(), toUserDto()

### Community 59 - "stock-integrity.test.js"
Cohesion: 0.09
Nodes (19): mongoose, stockMovementSchema, customerSeed(), seedCustomer(), createProduct(), createSupplier(), productApiPayload(), randomSku() (+11 more)

### Community 60 - "Brand Autocomplete"
Cohesion: 0.19
Nodes (9): BrandAutocomplete(), handleKeyDown(), selectBrand(), BrandAutocompleteProps, DropdownPosition, BRAND_SEARCH_LIMIT, dedupeBrands(), useBrandSearch() (+1 more)

### Community 61 - "useCustomerProfile"
Cohesion: 0.38
Nodes (7): useCustomerProfile(), load(), applyCustomerOrderMetrics(), customerMatchesOrder(), findCustomerForOrder(), phoneDigits(), handleOpenCustomer()

### Community 63 - "devDependencies"
Cohesion: 0.33
Nodes (6): devDependencies, jest@^30.5.2, nodemon@^3.1.9, supertest@^7.3.2, jest, nodemon

### Community 64 - "migrate-auth-tenancy.js"
Cohesion: 0.27
Nodes (12): applyBackfill(), collectCounts(), databaseNameFromUri(), main(), missingBusinessIdFilter(), mongoose, parseArgs(), path (+4 more)

### Community 65 - "Migrate Indexes"
Cohesion: 0.21
Nodes (14): databaseNameFromUri(), findCompoundUniqueIndex(), findOldGlobalUniqueIndex(), getIndexes(), main(), mongoose, parseArgs(), path (+6 more)

### Community 66 - "Origin Middleware"
Cohesion: 0.22
Nodes (10): requireRole(), allowedOrigins(), checkOrigin(), requestOrigin(), UNSAFE_METHODS, validate(), express, { ipKeyGenerator } (+2 more)

### Community 67 - "formatDate"
Cohesion: 0.25
Nodes (7): DateTextInput(), commit(), DateTextInputProps, PurchaseReceiptsDialog(), PurchaseReceiptsDialogProps, formatDate(), toIsoDate()

### Community 68 - "Setup Dotenv Test"
Cohesion: 0.17
Nodes (9): dotenv@^16.6.1, backendDir, dotenv, envPath, { execFileSync }, fs, path, setupPath (+1 more)

### Community 69 - "Supplier Financials Test"
Cohesion: 0.33
Nodes (10): cookieHeader(), createProduct(), createPurchase(), createSupplier(), item(), loginAs(), purchasePayload(), randomSuffix() (+2 more)

### Community 70 - "products/types.ts"
Cohesion: 0.18
Nodes (9): parseMoneyInput(), Product, DropdownPosition, ProductPickerProps, DropdownPosition, formatPrice(), DropdownPosition, ProductMultiSelectProps (+1 more)

### Community 71 - "Receive Purchase Dialog"
Cohesion: 0.24
Nodes (8): initialValues(), itemKey(), ReceivedValues, ReceivePurchaseDialog(), handleSubmit(), receiveAll(), ReceivePurchaseDialogProps, PurchaseReceiveInput

### Community 72 - "OrderFormDialog.tsx"
Cohesion: 0.10
Nodes (25): canonicalSalePrice(), EditableItem, emptyItem(), OrderFormDialog(), addItem(), applyExactProductMatch(), handleSubmit(), productForItem() (+17 more)

### Community 73 - "upload.middleware.js"
Cohesion: 0.33
Nodes (5): multer@^1.4.5-lts.1, multer, storage, upload, multer

### Community 74 - "rate-limit.middleware.js"
Cohesion: 0.28
Nodes (8): clientIp(), createLimiter(), forgotPasswordLimiter, inviteValidateLimiter, loginLimiter, optionsFor(), { rateLimit, ipKeyGenerator }, refreshLimiter

### Community 75 - "Customer Financials Test"
Cohesion: 0.35
Nodes (9): cookieHeader(), createCustomer(), createProduct(), createSale(), customerPayload(), loginAs(), randomSuffix(), request (+1 more)

### Community 76 - "formatRs"
Cohesion: 0.20
Nodes (11): PurchaseContextCard(), PurchasePreviewDialog(), PurchasePreviewDialogProps, PurchaseSummaryCard(), SupplierAutocomplete(), handleKeyDown(), selectSupplier(), SupplierAutocompleteProps (+3 more)

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

### Community 81 - "DashboardView.tsx"
Cohesion: 0.17
Nodes (17): formatCompactRs(), formatRs(), DashboardPage(), DashboardKpis(), Trend(), DashboardQuickActions(), DashboardView(), DataSourceStrip() (+9 more)

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
Cohesion: 0.29
Nodes (8): enforceTenantAuth(), hasValidBusinessContext(), isEnabled(), requireRoleWhenEnforced(), express, express, router, sensitive

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

### Community 108 - "next"
Cohesion: 0.20
Nodes (9): CriticalLowStock(), LowStockRow, nextConfig, config, hasAuthCookie(), isPublicPath(), proxy(), PUBLIC_PATHS (+1 more)

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

### Community 117 - "purchases/types.ts"
Cohesion: 0.12
Nodes (13): CreatePurchaseHeader(), CreatePurchaseHeaderProps, newPaymentKey(), RecordPurchasePaymentDialog(), RecordPurchasePaymentDialogProps, PAYMENT_METHODS, PURCHASE_FORM_STATUSES, CreatePurchasePayload (+5 more)

### Community 122 - "suppliers/types.ts"
Cohesion: 0.15
Nodes (20): DeleteSupplierDialogProps, PAYABLE_TABS, SupplierFilters(), REGION_FILTER_OPTIONS, SORT_OPTIONS, STATUS_FILTER_OPTIONS, CreateSupplierInput, HubKey (+12 more)

### Community 123 - "formatRs"
Cohesion: 0.29
Nodes (6): newPaymentKey(), RecordPaymentDialog(), SalesKpis(), SalesKpisProps, formatRs(), SalesKpisData

### Community 125 - "Window Group"
Cohesion: 1.00
Nodes (3): Three window-control dots depicted in the icon, Window Icon SVG (16x16 gray line-art), Window frame glyph depicted in the icon

### Community 126 - "backend/package.json"
Cohesion: 0.18
Nodes (10): cloudinary@^2.5.1, express@^4.21.2, helmet@^8.3.0, main, name, private, version, cloudinary (+2 more)

## Ambiguous Edges - Review These
- `Movement Deletion Contract` → `Compensating Stock Movement Reversal`  [AMBIGUOUS]
  backend/docs/inventory-api.md · relation: conceptually_related_to
- `Public Business API Decision` → `Brands Enforce Tenant Auth`  [AMBIGUOUS]
  PROJECT_MEMORY.md · relation: conceptually_related_to

## Knowledge Gaps
- **79 isolated node(s):** `Customer DTO`, `Customer Ledger Code`, `Customer Phone Normalization`, `Customer Update Preservation`, `Supplier Code Generator` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 693 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `Auth Service`, `Profile Ui`, `SalesOrdersView.tsx`, `Suppliers View`, `Purchase Data`, `Package Group`, `Inventory Page`, `Purchases Utilities`, `EditSupplierDialog.tsx`, `dashboard/types.ts`, `EditProductModal.tsx`, `AddSupplierForm.tsx`, `Data Group`, `customers/utils.ts`, `OpeningBalancePaymentSection.tsx`, `Brands View`, `fetchInventoryProducts`, `customers/types.ts`, `Brands Utilities`, `Brand Service`, `Create Purchase View`, `App Shell`, `Brand Filters`, `CustomerAutocomplete.tsx`, `Brand Detail Dialog`, `Product Utils`, `Brand Autocomplete`, `formatDate`, `products/types.ts`, `Receive Purchase Dialog`, `OrderFormDialog.tsx`, `formatRs`, `Stock Table`, `DashboardView.tsx`, `Brand Select`, `purchases/types.ts`, `suppliers/types.ts`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **What connects `Customer DTO`, `Customer Ledger Code`, `Customer Phone Normalization` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Service` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Why does `apiFetch()` connect `apiFetch` to `Auth Service`, `fetchInventoryProducts`, `customers/types.ts`, `Edit Product Modal`, `Brand Service`, `Sales Orders View`, `supplier.service.ts`, `Inventory Page`, `EditProductModal.tsx`, `Product Utils`, `Data Group`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `Profile Ui` be split into smaller, more focused modules?**
  _Cohesion score 0.06739811912225706 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Movement Deletion Contract` and `Compensating Stock Movement Reversal`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Public Business API Decision` and `Brands Enforce Tenant Auth`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._