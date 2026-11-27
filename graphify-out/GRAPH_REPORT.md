# Graph Report - inv_system  (2026-11-28)

## Corpus Check
- 277 files · ~173,503 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 1912 nodes · 5636 edges · 83 communities (80 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 209 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3ffbaef`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- brands/index.ts
- apiFetch
- auth.service.ts
- supplier.controller.js
- purchase.controller.js
- sale-order.controller.js
- SalesOrdersView
- PurchasesView.tsx
- mongoose
- frontend/package.json
- product.controller.js
- createBusiness
- inventory/utils.ts
- dashboard/utils.ts
- SalesOrdersView.tsx
- customer.controller.js
- units.js
- next
- CustomerProfile.tsx
- customers/utils.ts
- apiFetch
- payment-accounting.js
- supplierProfile.ts
- inventory.controller.js
- auth.js
- migrate-auth-tenancy.js
- purchases/utils.ts
- react
- suppliers/utils.ts
- auth.routes.js
- invite.controller.js
- SaleOrder.js
- AddCustomerForm
- AddSupplierForm.tsx
- token.service.js
- AddCustomerForm.tsx
- CreatePurchaseView.tsx
- OrderFormDialog.tsx
- customers/types.ts
- formatRs
- payment-integrity.test.js
- sales-orders/utils.ts
- migrate-indexes.js
- profile.ts
- CustomerOrdersLedger.tsx
- CreatePurchaseView
- AddSupplierForm
- suppliers/types.ts
- compilerOptions
- password-reset.controller.js
- SuppliersView
- app
- CustomersView
- dependencies
- app.js
- lifecycle-integrity.test.js
- react
- SupplierPurchaseLedger.tsx
- PurchasesView
- middlewares.test.js
- SalesOverview.tsx
- setup-dotenv.test.js
- supplier-financials.test.js
- backend/package.json
- customer-financials.test.js
- stock-integrity.test.js
- ReceivePurchaseDialog.tsx
- customers/index.ts
- toUserDto
- rate-limit.middleware.js
- brand-product.test.js
- scripts
- templates.js
- RecordPaymentDialog.tsx
- AdjustStockPanel
- upload.middleware.js
- cors
- profile-ui.tsx
- proxy.ts
- enforcement.middleware.js
- lifecycle.js
- cloudinary

## God Nodes (most connected - your core abstractions)
1. `react` - 75 edges
2. `apiFetch()` - 60 edges
3. `CreatePurchaseView()` - 38 edges
4. `SalesOrdersView()` - 37 edges
5. `mongoose` - 36 edges
6. `next` - 35 edges
7. `AppShell()` - 33 edges
8. `PurchasesView()` - 32 edges
9. `CustomersView()` - 31 edges
10. `CustomerProfile()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `submit()` --calls--> `apiFetch()`  [EXTRACTED]
  frontend/app/products/components/EditProductModal.tsx → frontend/app/lib/api.ts
- `handleDelete()` --calls--> `apiFetch()`  [EXTRACTED]
  frontend/app/products/components/ProductDetailModal.tsx → frontend/app/lib/api.ts
- `load()` --calls--> `apiFetch()`  [EXTRACTED]
  frontend/app/products/page.tsx → frontend/app/lib/api.ts
- `handleCreateSale()` --calls--> `createSaleOrder()`  [EXTRACTED]
  frontend/features/customers/components/CustomerProfile.tsx → frontend/features/sales-orders/services/sale-order.service.ts
- `handleDeleteCustomer()` --calls--> `deleteCustomer()`  [EXTRACTED]
  frontend/features/customers/components/CustomerProfile.tsx → frontend/features/customers/services/customer.service.ts

## Import Cycles
- None detected.

## Communities (83 total, 3 thin omitted)

### Community 0 - "brands/index.ts"
Cohesion: 0.05
Nodes (71): BrandsPage(), BrandAutocomplete(), handleKeyDown(), selectBrand(), BrandAutocompleteProps, DropdownPosition, BrandDetailDialog(), BrandDetailDialogProps (+63 more)

### Community 1 - "apiFetch"
Cohesion: 0.05
Nodes (69): AppShell(), intelligenceMenu, mainMenu, NavGroup(), NavItem, roleLabel(), SidebarIcon(), sidebarIcons (+61 more)

### Community 2 - "auth.service.ts"
Cohesion: 0.06
Nodes (46): ForgotPasswordPage(), metadata, inter, jetbrainsMono, metadata, RootLayout(), LoginPage(), metadata (+38 more)

### Community 3 - "supplier.controller.js"
Cohesion: 0.08
Nodes (55): cleanString(), ConflictError, createBrand(), escapeRegex(), findOwnedBrand(), getBrandById(), handleControllerError(), isTenantEnforced() (+47 more)

### Community 4 - "purchase.controller.js"
Cohesion: 0.14
Nodes (46): applyStockReceipt(), basePurchasePrice(), buildPurchaseChanges(), clamp(), cleanString(), ConflictError, createPurchase(), createReceiptEntry() (+38 more)

### Community 5 - "sale-order.controller.js"
Cohesion: 0.15
Nodes (39): applyStockAdjustments(), buildOrderChanges(), clamp(), cleanString(), ConflictError, createSaleOrder(), customerIdOf(), deleteSaleOrder() (+31 more)

### Community 6 - "SalesOrdersView"
Cohesion: 0.12
Nodes (29): SalesOrdersPage(), useCustomerProfile(), load(), applyCustomerOrderMetrics(), customerMatchesOrder(), findCustomerForOrder(), phoneDigits(), SalesFilters() (+21 more)

### Community 7 - "PurchasesView.tsx"
Cohesion: 0.10
Nodes (31): DeletePurchaseDialog(), DeletePurchaseDialogProps, ACTIONS, PurchaseActionsMenu(), PurchaseActionsMenuProps, PurchasesFooter(), PurchasesFooterProps, PurchasesHeader() (+23 more)

### Community 8 - "mongoose"
Cohesion: 0.09
Nodes (24): authTokenSchema, mongoose, mongoose, refreshSessionSchema, request, clearTestDB(), connectTestDB(), databaseNameFromUri() (+16 more)

### Community 9 - "frontend/package.json"
Cohesion: 0.10
Nodes (26): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.4.6, tailwindcss@4.3.3, @tailwindcss/turbopack@4.3.3, @types/node@^20, @types/react@^19 (+18 more)

### Community 10 - "product.controller.js"
Cohesion: 0.17
Nodes (24): ensureCloudinaryConfigured(), getCloudinaryConfig(), buildProductMovement(), ConflictError, createProduct(), deleteProduct(), destroyCloudinaryImage(), findOwnedProduct() (+16 more)

### Community 11 - "createBusiness"
Cohesion: 0.17
Nodes (21): cookieHeader(), loginAs(), request, seed(), bcrypt, createBusiness(), createUser(), seedAuth() (+13 more)

### Community 12 - "inventory/utils.ts"
Cohesion: 0.07
Nodes (42): AdjustStockPanelProps, Direction, InventoryEmptyState(), InventoryEmptyStateProps, InventoryKpis(), InventoryKpisProps, FILTERS, MOVEMENT_BADGE_CLASS (+34 more)

### Community 13 - "dashboard/utils.ts"
Cohesion: 0.17
Nodes (26): load(), fetchDashboardSnapshot(), PERIODS, SalesPeriod, ActivitySeed, addDays(), collectLowStockRows(), getActivityItems() (+18 more)

### Community 14 - "SalesOrdersView.tsx"
Cohesion: 0.19
Nodes (19): SalesFiltersProps, STATUS_TABS, DATE_OPTIONS, HUB_OPTIONS, ORDER_STATUS_OPTIONS, PAYMENT_OPTIONS, PAYMENT_STATUS_OPTIONS, DateFilter (+11 more)

### Community 15 - "customer.controller.js"
Cohesion: 0.10
Nodes (41): buildCustomerChanges(), CITIES, cleanString(), createCustomer(), CUSTOMER_TYPES, customerResponse(), deleteCustomer(), financialBusinessId() (+33 more)

### Community 16 - "units.js"
Cohesion: 0.23
Nodes (17): resolvePricing(), assertPositiveQuantity(), CANONICAL_UNITS, cleanString(), convertPrice(), formatStock(), fromBasePieces(), isSupportedUnit() (+9 more)

### Community 17 - "next"
Cohesion: 0.14
Nodes (23): DashboardPage(), CriticalLowStock(), DashboardQuickActions(), DashboardView(), DataSourceStrip(), ICON, OperationalActivity(), TONE_CLASS (+15 more)

### Community 18 - "CustomerProfile.tsx"
Cohesion: 0.13
Nodes (21): CustomerProfilePage(), SupplierProfilePage(), CustomerProfile(), handleCreateSale(), handleDeleteCustomer(), handleRecordPayment(), PROFILE_BUTTON_PRIMARY, PROFILE_BUTTON_QUIET (+13 more)

### Community 19 - "customers/utils.ts"
Cohesion: 0.14
Nodes (22): CustomerActionsMenu(), CustomerKpis(), CustomerKpisProps, CustomersFooter(), CustomersFooterProps, CustomersHeader(), CustomersHeaderProps, CustomersTable() (+14 more)

### Community 20 - "apiFetch"
Cohesion: 0.27
Nodes (19): apiFetch(), isAuthEndpoint(), isBrowser(), isPublicAuthPath(), redirectToExpiredSession(), refreshSession(), save(), assertOk() (+11 more)

### Community 21 - "payment-accounting.js"
Cohesion: 0.28
Nodes (15): buildLegacyBalancePayment(), buildPaymentLabel(), buildPaymentRecord(), cleanString(), crypto, derivePurchasePaidAmount(), deriveSalePaymentState(), findPaymentByKey() (+7 more)

### Community 22 - "supplierProfile.ts"
Cohesion: 0.13
Nodes (22): DOT_CLASSES, SupplierActivityTimelineProps, MasterProfileRow, PurchaseDelivery, PurchaseLine, PurchaseStatus, SupplierInvoiceRow, SupplierPaymentRow (+14 more)

### Community 23 - "inventory.controller.js"
Cohesion: 0.17
Nodes (19): express@^4.21.2, adjustStock(), cleanString(), ConflictError, deleteStockMovement(), findOwnedMovement(), getMovements(), handleControllerError() (+11 more)

### Community 24 - "auth.js"
Cohesion: 0.14
Nodes (18): bcrypt, main(), mongoose, normalizeEmail(), parseArgs(), path, runCreateOwner(), slugify() (+10 more)

### Community 25 - "migrate-auth-tenancy.js"
Cohesion: 0.11
Nodes (21): applyBackfill(), collectCounts(), databaseNameFromUri(), main(), missingBusinessIdFilter(), mongoose, parseArgs(), path (+13 more)

### Community 26 - "purchases/utils.ts"
Cohesion: 0.19
Nodes (20): formatStockWithPieces(), ProductPicker(), handleKeyDown(), selectProduct(), PurchaseDetailDialog(), PurchaseDetailDialogProps, PurchaseItemsTable(), PurchaseItemsTableProps (+12 more)

### Community 27 - "react"
Cohesion: 0.16
Nodes (14): CancelOrderDialog(), CancelOrderDialogProps, DeleteOrderDialog(), DeleteOrderDialogProps, OrderActionsMenu(), OrderActionsMenuProps, itemLabel(), OrdersTable() (+6 more)

### Community 28 - "suppliers/utils.ts"
Cohesion: 0.15
Nodes (17): SupplierActionsMenu(), SupplierActionsMenuProps, SupplierKpis(), SupplierKpisProps, PAGE_SIZES, SuppliersFooter(), SuppliersFooterProps, PayableCell() (+9 more)

### Community 29 - "auth.routes.js"
Cohesion: 0.15
Nodes (21): bcrypt, clearAuthCookies(), cookieOptions(), DUMMY_PASSWORD_HASH, login(), logout(), me(), refresh() (+13 more)

### Community 30 - "invite.controller.js"
Cohesion: 0.17
Nodes (19): acceptInvite(), bcrypt, businessIdFor(), createInvite(), listInvites(), revokeInvite(), validateInvite(), normalizeEmail() (+11 more)

### Community 31 - "SaleOrder.js"
Cohesion: 0.11
Nodes (18): mongoose, paymentRecordSchema, paymentRecordsField, mongoose, purchaseItemSchema, purchaseReceiptSchema, purchaseSchema, mongoose (+10 more)

### Community 32 - "AddCustomerForm"
Cohesion: 0.16
Nodes (13): AddCustomerForm(), handleSubmit(), loadCode(), resetForm(), Field(), SectionCard(), SelectShell(), EditCustomerDialog() (+5 more)

### Community 33 - "AddSupplierForm.tsx"
Cohesion: 0.14
Nodes (20): EMPTY_FORM, FieldProps, EditSupplierDialog(), handleSubmit(), EditSupplierDialogProps, Field(), SelectShell(), toInput() (+12 more)

### Community 34 - "token.service.js"
Cohesion: 0.21
Nodes (17): authenticate(), getAccessToken(), createSession(), findActiveSessionBySid(), mongoose, rawId(), revokeSessionByRefreshToken(), rotateSession() (+9 more)

### Community 35 - "AddCustomerForm.tsx"
Cohesion: 0.18
Nodes (19): EMPTY_FORM, CustomerFilters(), CustomerFiltersProps, EditCustomerDialogProps, BALANCE_TABS, CITY_OPTIONS, CUSTOMER_TYPE_OPTIONS, ROUTE_FILTER_OPTIONS (+11 more)

### Community 36 - "CreatePurchaseView.tsx"
Cohesion: 0.17
Nodes (17): CreatePurchaseHeader(), CreatePurchaseHeaderProps, PurchasePreviewDialog(), PurchasePreviewDialogProps, PurchaseSummaryCard(), PurchaseSummaryCardProps, DEFAULT_TAX_RATE, PAYMENT_METHODS (+9 more)

### Community 37 - "OrderFormDialog.tsx"
Cohesion: 0.10
Nodes (28): CustomerAutocomplete(), handleKeyDown(), selectCustomer(), EditOrderDialog(), EditOrderDialogProps, NewOrderDialog(), NewOrderDialogProps, canonicalSalePrice() (+20 more)

### Community 38 - "customers/types.ts"
Cohesion: 0.23
Nodes (8): CustomerActionsMenuProps, DeleteCustomerDialogProps, Customer, GracePeriod, PaymentTerms, CustomerAutocompleteProps, useCustomerLookup(), load()

### Community 39 - "formatRs"
Cohesion: 0.18
Nodes (13): DateTextInput(), commit(), DateTextInputProps, PurchaseContextCard(), PurchaseContextCardProps, PurchaseReceiptsDialog(), PurchaseReceiptsDialogProps, SupplierAutocomplete() (+5 more)

### Community 40 - "payment-integrity.test.js"
Cohesion: 0.18
Nodes (15): cookieHeader(), createCustomer(), createProduct(), createPurchase(), createSale(), createSupplier(), customerPayload(), loginAs() (+7 more)

### Community 41 - "sales-orders/utils.ts"
Cohesion: 0.17
Nodes (14): SalesKpis(), SalesKpisProps, SalesOrdersHeader(), SalesOrdersHeaderProps, handleExport(), downloadCsv(), escapeCsv(), filterOrders() (+6 more)

### Community 42 - "migrate-indexes.js"
Cohesion: 0.19
Nodes (14): databaseNameFromUri(), findCompoundUniqueIndex(), findOldGlobalUniqueIndex(), getIndexes(), main(), mongoose, parseArgs(), path (+6 more)

### Community 43 - "profile.ts"
Cohesion: 0.20
Nodes (15): CustomerAccountDossier(), CustomerAccountDossierProps, DetailRow(), TONE_CLASSES, CustomerNotes(), CustomerNotesProps, TONE_CLASSES, buildCustomerActivity() (+7 more)

### Community 44 - "CustomerOrdersLedger.tsx"
Cohesion: 0.16
Nodes (23): CustomerInvoices(), CustomerInvoicesProps, CustomerOrdersLedger(), CustomerOrdersLedgerProps, exportOrders(), FILTERS, PaymentFilter, CustomerPayments() (+15 more)

### Community 45 - "CreatePurchaseView"
Cohesion: 0.23
Nodes (19): availableStock(), CreatePurchaseView(), addProductRow(), handleBarcodeScan(), handleProductSelect(), handlePurchaseDateChange(), handleRemoveItem(), handleSupplierQueryChange() (+11 more)

### Community 46 - "AddSupplierForm"
Cohesion: 0.21
Nodes (17): AddSupplierForm(), handleSubmit(), loadCode(), resetForm(), save(), Field(), SectionCard(), assertOk() (+9 more)

### Community 47 - "suppliers/types.ts"
Cohesion: 0.16
Nodes (21): DeleteSupplierDialogProps, PAYABLE_TABS, SupplierFilters(), SupplierFiltersProps, EMPTY_SUMMARY, REGION_FILTER_OPTIONS, SORT_OPTIONS, STATUS_FILTER_OPTIONS (+13 more)

### Community 48 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 49 - "password-reset.controller.js"
Cohesion: 0.23
Nodes (14): bcrypt, forgotPassword(), resetPassword(), isConfigured(), { Resend }, resendClient(), sendEmail(), consumePasswordResetToken() (+6 more)

### Community 50 - "SuppliersView"
Cohesion: 0.12
Nodes (12): SuppliersPage(), DeleteSupplierDialog(), SuppliersHeader(), SuppliersHeaderProps, SuppliersView(), applySupplierList(), confirmSupplierDelete(), handleExport() (+4 more)

### Community 51 - "app"
Cohesion: 0.16
Nodes (10): app, connectDB(), mongoose, isPlaceholder(), REQUIRED_SECRETS, validateAuthEnv(), http, path (+2 more)

### Community 52 - "CustomersView"
Cohesion: 0.12
Nodes (6): CustomersView(), confirmCustomerDelete(), handleExport(), load(), DeleteCustomerDialog(), downloadCsv()

### Community 53 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, bcryptjs@^2.4.3, cookie-parser@^1.4.7, helmet@^8.3.0, mongoose@^8.9.5, resend@^6.39.0, zod@^4.6.7, cookie-parser (+3 more)

### Community 54 - "app.js"
Cohesion: 0.14
Nodes (13): allowedOrigins, cookieParser, cors, express, helmet, errorHandler(), router, router (+5 more)

### Community 55 - "lifecycle-integrity.test.js"
Cohesion: 0.23
Nodes (9): cookieHeader(), createApiProduct(), createApiSupplier(), loginAs(), purchasePayload(), randomSuffix(), request, seedProduct() (+1 more)

### Community 56 - "react"
Cohesion: 0.11
Nodes (26): load(), AdjustStockPayload, AdjustStockResult, deleteStockMovement(), DeleteStockMovementResult, fetchInventoryProducts(), fetchStockMovements(), readJson() (+18 more)

### Community 57 - "SupplierPurchaseLedger.tsx"
Cohesion: 0.25
Nodes (10): priceBasisLabel(), PROFILE_BUTTON_SECONDARY, exportPurchases(), FILTERS, PurchaseRow(), STATUS_TONES, StatusFilter, SupplierPurchaseLedger() (+2 more)

### Community 58 - "PurchasesView"
Cohesion: 0.20
Nodes (11): PurchasesPage(), PurchasesView(), applyUpdatedPurchase(), handleAction(), handleDeleteConfirm(), handleExport(), handlePaymentConfirm(), handleReceiveConfirm() (+3 more)

### Community 59 - "middlewares.test.js"
Cohesion: 0.22
Nodes (10): requireRole(), allowedOrigins(), checkOrigin(), requestOrigin(), UNSAFE_METHODS, validate(), express, { ipKeyGenerator } (+2 more)

### Community 60 - "SalesOverview.tsx"
Cohesion: 0.36
Nodes (8): formatCompactRs(), formatRs(), DashboardKpis(), Trend(), PERIODS, SalesOverview(), SalesOverviewProps, chartGeometry()

### Community 61 - "setup-dotenv.test.js"
Cohesion: 0.17
Nodes (9): dotenv@^16.6.1, backendDir, dotenv, envPath, { execFileSync }, fs, path, setupPath (+1 more)

### Community 62 - "supplier-financials.test.js"
Cohesion: 0.33
Nodes (10): cookieHeader(), createProduct(), createPurchase(), createSupplier(), item(), loginAs(), purchasePayload(), randomSuffix() (+2 more)

### Community 63 - "backend/package.json"
Cohesion: 0.18
Nodes (10): express-rate-limit@^8.7.5, jsonwebtoken@^9.0.2, nodemon@^3.1.9, main, name, private, version, express-rate-limit (+2 more)

### Community 64 - "customer-financials.test.js"
Cohesion: 0.35
Nodes (9): cookieHeader(), createCustomer(), createProduct(), createSale(), customerPayload(), loginAs(), randomSuffix(), request (+1 more)

### Community 65 - "stock-integrity.test.js"
Cohesion: 0.16
Nodes (12): devDependencies, jest@^30.5.2, supertest@^7.3.2, moveCount(), movementsFor(), productApiPayload(), randomSku(), request (+4 more)

### Community 66 - "ReceivePurchaseDialog.tsx"
Cohesion: 0.31
Nodes (8): initialValues(), itemKey(), ReceivedValues, ReceivePurchaseDialog(), handleSubmit(), receiveAll(), ReceivePurchaseDialogProps, PurchaseReceiveInput

### Community 67 - "customers/index.ts"
Cohesion: 0.42
Nodes (12): assertOk(), createCustomer(), deleteCustomer(), fetchCustomer(), fetchCustomers(), fetchNextCustomerCode(), readJson(), toCustomer() (+4 more)

### Community 68 - "toUserDto"
Cohesion: 0.50
Nodes (7): businessIdFor(), canManage(), changeRole(), deactivateUser(), listUsers(), revokeAllSessionsForUser(), toUserDto()

### Community 69 - "rate-limit.middleware.js"
Cohesion: 0.28
Nodes (8): clientIp(), createLimiter(), forgotPasswordLimiter, inviteValidateLimiter, loginLimiter, optionsFor(), { rateLimit, ipKeyGenerator }, refreshLimiter

### Community 70 - "brand-product.test.js"
Cohesion: 0.29
Nodes (7): brandSchema, mongoose, cookieHeader(), createBrandAs(), loginAs(), request, seedTwoBusinesses()

### Community 71 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, create-owner, dev, migrate:auth-tenancy, migrate:indexes, start, test, test:watch

### Community 72 - "templates.js"
Cohesion: 0.61
Nodes (7): APP_URL(), escapeHtml(), formatDate(), invitationEmail(), layout(), passwordChangedEmail(), passwordResetEmail()

### Community 73 - "RecordPaymentDialog.tsx"
Cohesion: 0.40
Nodes (4): newPaymentKey(), RecordPaymentDialog(), RecordPaymentDialogProps, PAYMENT_METHODS

### Community 74 - "AdjustStockPanel"
Cohesion: 0.36
Nodes (9): AdjustStockPanel(), changeDirection(), changeQuantity(), changeUnit(), clampQuantity(), handleSubmit(), stepQuantity(), adjustStock() (+1 more)

### Community 75 - "upload.middleware.js"
Cohesion: 0.33
Nodes (5): multer@^1.4.5-lts.1, multer, storage, upload, multer

### Community 77 - "profile-ui.tsx"
Cohesion: 0.19
Nodes (13): CustomerProfileSummaryProps, BADGE_TONES, METRIC_SURFACES, PROFILE_CARD, PROFILE_METRIC_GRID, ProfileMetric(), ProfileTabItem, ProfileTone (+5 more)

### Community 79 - "proxy.ts"
Cohesion: 0.47
Nodes (5): config, hasAuthCookie(), isPublicPath(), proxy(), PUBLIC_PATHS

### Community 80 - "enforcement.middleware.js"
Cohesion: 0.70
Nodes (4): enforceTenantAuth(), hasValidBusinessContext(), isEnabled(), requireRoleWhenEnforced()

### Community 81 - "lifecycle.js"
Cohesion: 0.40
Nodes (4): PURCHASE_FLOW, PURCHASE_STATUSES, SALE_FLOW, SALE_STATUSES

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `brands/index.ts`, `apiFetch`, `auth.service.ts`, `SalesOrdersView`, `PurchasesView.tsx`, `frontend/package.json`, `inventory/utils.ts`, `SalesOrdersView.tsx`, `next`, `CustomerProfile.tsx`, `customers/utils.ts`, `purchases/utils.ts`, `react`, `suppliers/utils.ts`, `AddSupplierForm.tsx`, `AddCustomerForm.tsx`, `CreatePurchaseView.tsx`, `OrderFormDialog.tsx`, `customers/types.ts`, `formatRs`, `sales-orders/utils.ts`, `CustomerOrdersLedger.tsx`, `suppliers/types.ts`, `SupplierPurchaseLedger.tsx`, `SalesOverview.tsx`, `ReceivePurchaseDialog.tsx`, `RecordPaymentDialog.tsx`, `profile-ui.tsx`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Should `brands/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0537714712471994 - nodes in this community are weakly interconnected._
- **Why does `mongoose` connect `mongoose` to `token.service.js`, `supplier.controller.js`, `purchase.controller.js`, `sale-order.controller.js`, `brand-product.test.js`, `migrate-indexes.js`, `product.controller.js`, `createBusiness`, `customer.controller.js`, `app`, `dependencies`, `inventory.controller.js`, `auth.js`, `migrate-auth-tenancy.js`, `SaleOrder.js`, `invite.controller.js`, `backend/package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `apiFetch` be split into smaller, more focused modules?**
  _Cohesion score 0.05067920585161965 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `brands/index.ts`, `apiFetch`, `auth.service.ts`, `AddCustomerForm.tsx`, `CreatePurchaseView.tsx`, `AddSupplierForm.tsx`, `PurchasesView.tsx`, `sales-orders/utils.ts`, `frontend/package.json`, `CustomerOrdersLedger.tsx`, `suppliers/types.ts`, `proxy.ts`, `CustomerProfile.tsx`, `customers/utils.ts`, `react`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `auth.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06105834464043419 - nodes in this community are weakly interconnected._
- **Should `supplier.controller.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08158508158508158 - nodes in this community are weakly interconnected._