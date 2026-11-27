# Graph Report - inv_system  (2026-11-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1906 nodes · 5613 edges · 86 communities (83 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 205 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8cc3151d`
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
- PurchasesView
- inventory/page.tsx
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
- suppliers/types.ts
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
- SuppliersView.tsx
- compilerOptions
- password-reset.controller.js
- SuppliersView
- app
- CustomersView
- dependencies
- app.js
- lifecycle-integrity.test.js
- inventory.service.ts
- SupplierPurchaseLedger.tsx
- EditSupplierDialog
- middlewares.test.js
- SalesOverview.tsx
- setup-dotenv.test.js
- supplier-financials.test.js
- backend/package.json
- customer-financials.test.js
- stock-integrity.test.js
- ReceivePurchaseDialog.tsx
- financials.js
- toUserDto
- rate-limit.middleware.js
- supertest
- scripts
- templates.js
- ProductAutocomplete.tsx
- AdjustStockPanel
- upload.middleware.js
- CustomerProfile
- SupplierDetailSummary.tsx
- RecordPurchasePaymentDialog.tsx
- proxy.ts
- enforcement.middleware.js
- lifecycle.js
- fetchSuppliers
- cloudinary
- helmet

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
10. `SuppliersView()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `handleDeleteCustomer()` --calls--> `deleteCustomer()`  [EXTRACTED]
  frontend/features/customers/components/CustomerProfile.tsx → frontend/features/customers/services/customer.service.ts
- `loadProducts()` --calls--> `fetchInventoryProducts()`  [EXTRACTED]
  frontend/features/purchases/hooks/usePurchaseLookups.ts → frontend/app/inventory/services/inventory.service.ts
- `handleCreateSale()` --calls--> `createSaleOrder()`  [EXTRACTED]
  frontend/features/customers/components/CustomerProfile.tsx → frontend/features/sales-orders/services/sale-order.service.ts
- `handleRecordPayment()` --calls--> `recordSaleOrderPayment()`  [EXTRACTED]
  frontend/features/customers/components/CustomerProfile.tsx → frontend/features/sales-orders/services/sale-order.service.ts
- `BrandsPage()` --calls--> `AppShell()`  [EXTRACTED]
  frontend/app/brands/page.tsx → frontend/app/components/AppShell.tsx

## Import Cycles
- None detected.

## Communities (86 total, 3 thin omitted)

### Community 0 - "brands/index.ts"
Cohesion: 0.05
Nodes (71): BrandsPage(), BrandAutocomplete(), handleKeyDown(), selectBrand(), BrandAutocompleteProps, DropdownPosition, BrandDetailDialog(), BrandDetailDialogProps (+63 more)

### Community 1 - "apiFetch"
Cohesion: 0.05
Nodes (77): AppShell(), intelligenceMenu, mainMenu, NavGroup(), NavItem, roleLabel(), SidebarIcon(), sidebarIcons (+69 more)

### Community 2 - "auth.service.ts"
Cohesion: 0.06
Nodes (46): ForgotPasswordPage(), metadata, inter, jetbrainsMono, metadata, RootLayout(), LoginPage(), metadata (+38 more)

### Community 3 - "supplier.controller.js"
Cohesion: 0.09
Nodes (54): cleanString(), ConflictError, createBrand(), escapeRegex(), findOwnedBrand(), getBrandById(), handleControllerError(), isTenantEnforced() (+46 more)

### Community 4 - "purchase.controller.js"
Cohesion: 0.13
Nodes (46): applyStockReceipt(), basePurchasePrice(), buildPurchaseChanges(), clamp(), cleanString(), ConflictError, createPurchase(), createReceiptEntry() (+38 more)

### Community 5 - "sale-order.controller.js"
Cohesion: 0.14
Nodes (42): applyStockAdjustments(), buildOrderChanges(), clamp(), cleanString(), ConflictError, createSaleOrder(), customerIdOf(), deleteSaleOrder() (+34 more)

### Community 6 - "SalesOrdersView"
Cohesion: 0.11
Nodes (31): SalesOrdersPage(), useCustomerProfile(), load(), applyCustomerOrderMetrics(), customerMatchesOrder(), findCustomerForOrder(), phoneDigits(), SalesOrdersView() (+23 more)

### Community 7 - "PurchasesView.tsx"
Cohesion: 0.10
Nodes (26): DeletePurchaseDialog(), DeletePurchaseDialogProps, ACTIONS, PurchaseActionsMenu(), PurchaseActionsMenuProps, PurchaseDetailDialogProps, PurchasesFooter(), PurchasesFooterProps (+18 more)

### Community 8 - "mongoose"
Cohesion: 0.11
Nodes (22): authTokenSchema, mongoose, mongoose, refreshSessionSchema, request, clearTestDB(), connectTestDB(), databaseNameFromUri() (+14 more)

### Community 9 - "frontend/package.json"
Cohesion: 0.08
Nodes (31): eslintConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9, eslint-config-next@16.4.6 (+23 more)

### Community 10 - "product.controller.js"
Cohesion: 0.18
Nodes (26): ensureCloudinaryConfigured(), getCloudinaryConfig(), buildProductMovement(), ConflictError, createProduct(), deleteProduct(), destroyCloudinaryImage(), findOwnedProduct() (+18 more)

### Community 11 - "createBusiness"
Cohesion: 0.12
Nodes (26): mongoose, productSchema, cookieHeader(), loginAs(), request, seed(), cookieHeader(), createBrandAs() (+18 more)

### Community 12 - "inventory/utils.ts"
Cohesion: 0.09
Nodes (25): AdjustStockPanelProps, Direction, FILTERS, MOVEMENT_BADGE_CLASS, MOVEMENT_ROW_CLASS, MovementFilter, MovementsLedgerProps, SEVERITY_ORDER (+17 more)

### Community 13 - "dashboard/utils.ts"
Cohesion: 0.16
Nodes (28): fetchStockMovements(), useDashboard(), load(), fetchDashboardSnapshot(), PERIODS, DashboardSnapshot, ActivitySeed, addDays() (+20 more)

### Community 14 - "SalesOrdersView.tsx"
Cohesion: 0.15
Nodes (22): newPaymentKey(), RecordPaymentDialog(), RecordPaymentDialogProps, SalesFilters(), SalesFiltersProps, STATUS_TABS, SalesOrdersHeader(), SalesOrdersHeaderProps (+14 more)

### Community 15 - "customer.controller.js"
Cohesion: 0.15
Nodes (26): buildCustomerChanges(), CITIES, cleanString(), createCustomer(), CUSTOMER_TYPES, deleteCustomer(), generateLedgerCode(), getCustomerByCode() (+18 more)

### Community 16 - "units.js"
Cohesion: 0.16
Nodes (26): buildLegacyBalancePayment(), buildPaymentLabel(), buildPaymentRecord(), cleanString(), crypto, derivePurchasePaidAmount(), deriveSalePaymentState(), hasUniquePaymentKeys() (+18 more)

### Community 17 - "next"
Cohesion: 0.15
Nodes (20): DashboardPage(), CriticalLowStock(), DashboardQuickActions(), DashboardView(), DataSourceStrip(), ICON, OperationalActivity(), TONE_CLASS (+12 more)

### Community 18 - "CustomerProfile.tsx"
Cohesion: 0.14
Nodes (24): SupplierProfilePage(), CustomerProfileProps, ProfileTab, TABS, BADGE_TONES, METRIC_SURFACES, PROFILE_BUTTON_DANGER_ICON, PROFILE_BUTTON_PRIMARY (+16 more)

### Community 19 - "customers/utils.ts"
Cohesion: 0.15
Nodes (22): CustomerActionsMenu(), CustomerKpis(), CustomerKpisProps, CustomersFooter(), CustomersFooterProps, CustomersHeader(), CustomersHeaderProps, CustomersTable() (+14 more)

### Community 20 - "PurchasesView"
Cohesion: 0.16
Nodes (24): save(), PurchasesView(), applyUpdatedPurchase(), handleAction(), handleDeleteConfirm(), handleExport(), handlePaymentConfirm(), handleReceiveConfirm() (+16 more)

### Community 21 - "inventory/page.tsx"
Cohesion: 0.14
Nodes (18): InventoryEmptyState(), InventoryEmptyStateProps, InventoryKpis(), InventoryKpisProps, MovementsLedger(), StockTable(), InventoryPage(), handleAdjusted() (+10 more)

### Community 22 - "supplierProfile.ts"
Cohesion: 0.13
Nodes (22): DOT_CLASSES, SupplierActivityTimelineProps, Purchase, PurchaseDelivery, PurchaseLine, PurchaseStatus, SupplierInvoiceRow, SupplierPaymentRow (+14 more)

### Community 23 - "inventory.controller.js"
Cohesion: 0.15
Nodes (20): express@^4.21.2, adjustStock(), cleanString(), ConflictError, deleteStockMovement(), findOwnedMovement(), getMovements(), handleControllerError() (+12 more)

### Community 24 - "auth.js"
Cohesion: 0.14
Nodes (19): bcrypt, main(), mongoose, normalizeEmail(), parseArgs(), path, runCreateOwner(), slugify() (+11 more)

### Community 25 - "migrate-auth-tenancy.js"
Cohesion: 0.12
Nodes (19): applyBackfill(), collectCounts(), databaseNameFromUri(), main(), missingBusinessIdFilter(), mongoose, parseArgs(), path (+11 more)

### Community 26 - "purchases/utils.ts"
Cohesion: 0.18
Nodes (20): formatStockWithPieces(), DropdownPosition, ProductPicker(), handleKeyDown(), selectProduct(), ProductPickerProps, PurchaseItemsTable(), PurchaseItemsTableProps (+12 more)

### Community 27 - "react"
Cohesion: 0.16
Nodes (15): CancelOrderDialog(), CancelOrderDialogProps, DeleteOrderDialog(), DeleteOrderDialogProps, OrderActionsMenu(), OrderActionsMenuProps, itemLabel(), OrdersTable() (+7 more)

### Community 28 - "suppliers/utils.ts"
Cohesion: 0.14
Nodes (18): DeleteSupplierDialog(), DeleteSupplierDialogProps, SupplierActionsMenu(), SupplierActionsMenuProps, PAGE_SIZES, SuppliersFooter(), SuppliersFooterProps, PayableCell() (+10 more)

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
Cohesion: 0.13
Nodes (22): AddCustomerForm(), handleSubmit(), loadCode(), resetForm(), Field(), SectionCard(), SelectShell(), confirmCustomerDelete() (+14 more)

### Community 33 - "suppliers/types.ts"
Cohesion: 0.24
Nodes (18): EMPTY_FORM, FieldProps, EditSupplierDialogProps, GRACE_DAY_OPTIONS, HUB_OPTIONS, PAYMENT_TERM_OPTIONS, TAX_STATUS_OPTIONS, CreateSupplierInput (+10 more)

### Community 34 - "token.service.js"
Cohesion: 0.21
Nodes (17): authenticate(), getAccessToken(), createSession(), findActiveSessionBySid(), mongoose, rawId(), revokeSessionByRefreshToken(), rotateSession() (+9 more)

### Community 35 - "AddCustomerForm.tsx"
Cohesion: 0.18
Nodes (19): EMPTY_FORM, CustomerFilters(), CustomerFiltersProps, EditCustomerDialogProps, BALANCE_TABS, CITY_OPTIONS, CUSTOMER_TYPE_OPTIONS, ROUTE_FILTER_OPTIONS (+11 more)

### Community 36 - "CreatePurchaseView.tsx"
Cohesion: 0.19
Nodes (14): CreatePurchaseHeader(), CreatePurchaseHeaderProps, PurchasePreviewDialogProps, PurchaseSummaryCardProps, DEFAULT_TAX_RATE, PAYMENT_METHODS, PURCHASE_FORM_STATUSES, PurchaseAmountView (+6 more)

### Community 37 - "OrderFormDialog.tsx"
Cohesion: 0.14
Nodes (20): CustomerAutocomplete(), handleKeyDown(), selectCustomer(), canonicalSalePrice(), EditableItem, emptyItem(), OrderFormDialog(), addItem() (+12 more)

### Community 38 - "customers/types.ts"
Cohesion: 0.19
Nodes (15): CustomerActionsMenuProps, load(), DeleteCustomerDialogProps, fetchCustomers(), CreateCustomerInput, Customer, CustomerDto, CustomerFilters (+7 more)

### Community 39 - "formatRs"
Cohesion: 0.18
Nodes (18): DateTextInput(), commit(), DateTextInputProps, PurchaseContextCard(), PurchaseContextCardProps, PurchaseDetailDialog(), PurchasePreviewDialog(), PurchaseReceiptsDialog() (+10 more)

### Community 40 - "payment-integrity.test.js"
Cohesion: 0.18
Nodes (15): cookieHeader(), createCustomer(), createProduct(), createPurchase(), createSale(), createSupplier(), customerPayload(), loginAs() (+7 more)

### Community 41 - "sales-orders/utils.ts"
Cohesion: 0.14
Nodes (16): EditOrderDialog(), EditOrderDialogProps, NewOrderDialog(), NewOrderDialogProps, SalesKpis(), SalesKpisProps, handleExport(), DraftOrderInput (+8 more)

### Community 42 - "migrate-indexes.js"
Cohesion: 0.15
Nodes (16): databaseNameFromUri(), findCompoundUniqueIndex(), findOldGlobalUniqueIndex(), getIndexes(), main(), mongoose, parseArgs(), path (+8 more)

### Community 43 - "profile.ts"
Cohesion: 0.19
Nodes (16): CustomerAccountDossier(), CustomerAccountDossierProps, DetailRow(), TONE_CLASSES, CustomerNotes(), CustomerNotesProps, TONE_CLASSES, CustomerProfileSummary() (+8 more)

### Community 44 - "CustomerOrdersLedger.tsx"
Cohesion: 0.20
Nodes (17): CustomerInvoices(), CustomerInvoicesProps, CustomerOrdersLedger(), CustomerOrdersLedgerProps, exportOrders(), FILTERS, PaymentFilter, CustomerPayments() (+9 more)

### Community 45 - "CreatePurchaseView"
Cohesion: 0.23
Nodes (19): availableStock(), CreatePurchaseView(), addProductRow(), handleBarcodeScan(), handleProductSelect(), handlePurchaseDateChange(), handleRemoveItem(), handleSupplierQueryChange() (+11 more)

### Community 46 - "AddSupplierForm"
Cohesion: 0.17
Nodes (17): AddSupplierForm(), handleSubmit(), loadCode(), resetForm(), save(), Field(), SectionCard(), handleSubmit() (+9 more)

### Community 47 - "SuppliersView.tsx"
Cohesion: 0.15
Nodes (15): PAYABLE_TABS, SupplierFilters(), SupplierFiltersProps, SupplierKpis(), SupplierKpisProps, SuppliersHeader(), SuppliersHeaderProps, EMPTY_SUMMARY (+7 more)

### Community 48 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 49 - "password-reset.controller.js"
Cohesion: 0.23
Nodes (14): bcrypt, forgotPassword(), resetPassword(), isConfigured(), { Resend }, resendClient(), sendEmail(), consumePasswordResetToken() (+6 more)

### Community 50 - "SuppliersView"
Cohesion: 0.16
Nodes (10): SuppliersPage(), SuppliersView(), applySupplierList(), confirmSupplierDelete(), handleExport(), handleSupplierSaved(), load(), deleteSupplier() (+2 more)

### Community 51 - "app"
Cohesion: 0.16
Nodes (10): app, connectDB(), mongoose, isPlaceholder(), REQUIRED_SECRETS, validateAuthEnv(), http, path (+2 more)

### Community 52 - "CustomersView"
Cohesion: 0.13
Nodes (5): CustomersPage(), CustomersView(), handleExport(), DeleteCustomerDialog(), downloadCsv()

### Community 53 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, bcryptjs@^2.4.3, cookie-parser@^1.4.7, cors@^2.8.5, express-rate-limit@^8.7.5, jsonwebtoken@^9.0.2, mongoose@^8.9.5, resend@^6.39.0 (+7 more)

### Community 54 - "app.js"
Cohesion: 0.14
Nodes (13): allowedOrigins, cookieParser, cors, express, helmet, errorHandler(), router, router (+5 more)

### Community 55 - "lifecycle-integrity.test.js"
Cohesion: 0.22
Nodes (10): cookieHeader(), createApiProduct(), createApiSupplier(), loginAs(), purchasePayload(), randomSuffix(), request, seedAuth() (+2 more)

### Community 56 - "inventory.service.ts"
Cohesion: 0.20
Nodes (12): handleSubmit(), StockMovementDto, load(), adjustStock(), AdjustStockPayload, AdjustStockResult, DeleteStockMovementResult, fetchInventoryProducts() (+4 more)

### Community 57 - "SupplierPurchaseLedger.tsx"
Cohesion: 0.20
Nodes (12): priceBasisLabel(), PROFILE_NUMERIC, PROFILE_SUBHEADER, SupplierMasterProfileProps, exportPurchases(), FILTERS, PurchaseRow(), STATUS_TONES (+4 more)

### Community 58 - "EditSupplierDialog"
Cohesion: 0.15
Nodes (9): EditSupplierDialog(), Field(), SelectShell(), toInput(), DropdownPosition, ProductMultiSelect(), handleKeyDown(), toggleProduct() (+1 more)

### Community 59 - "middlewares.test.js"
Cohesion: 0.22
Nodes (10): requireRole(), allowedOrigins(), checkOrigin(), requestOrigin(), UNSAFE_METHODS, validate(), express, { ipKeyGenerator } (+2 more)

### Community 60 - "SalesOverview.tsx"
Cohesion: 0.26
Nodes (10): formatCompactRs(), formatRs(), DashboardKpis(), Trend(), RecentOrders(), RecentOrdersProps, PERIODS, SalesOverview() (+2 more)

### Community 61 - "setup-dotenv.test.js"
Cohesion: 0.17
Nodes (9): dotenv@^16.6.1, backendDir, dotenv, envPath, { execFileSync }, fs, path, setupPath (+1 more)

### Community 62 - "supplier-financials.test.js"
Cohesion: 0.33
Nodes (10): cookieHeader(), createProduct(), createPurchase(), createSupplier(), item(), loginAs(), purchasePayload(), randomSuffix() (+2 more)

### Community 63 - "backend/package.json"
Cohesion: 0.22
Nodes (10): devDependencies, jest@^30.5.2, nodemon@^3.1.9, supertest@^7.3.2, main, name, private, version (+2 more)

### Community 64 - "customer-financials.test.js"
Cohesion: 0.35
Nodes (9): cookieHeader(), createCustomer(), createProduct(), createSale(), customerPayload(), loginAs(), randomSuffix(), request (+1 more)

### Community 65 - "stock-integrity.test.js"
Cohesion: 0.25
Nodes (7): moveCount(), movementsFor(), productApiPayload(), randomSku(), request, seedProduct(), seedSupplier()

### Community 66 - "ReceivePurchaseDialog.tsx"
Cohesion: 0.29
Nodes (9): initialValues(), itemKey(), ReceivedValues, ReceivePurchaseDialog(), handleSubmit(), receiveAll(), ReceivePurchaseDialogProps, PurchaseReceiveInput (+1 more)

### Community 67 - "financials.js"
Cohesion: 0.38
Nodes (9): mongoose, nonNegativeMoney(), PAYMENT_TERMS_LABELS, recalculateCustomerFinancials(), recalculateSupplierFinancials(), recalculationKey(), recalculationQueues, runSerialized() (+1 more)

### Community 68 - "toUserDto"
Cohesion: 0.50
Nodes (7): businessIdFor(), canManage(), changeRole(), deactivateUser(), listUsers(), revokeAllSessionsForUser(), toUserDto()

### Community 69 - "rate-limit.middleware.js"
Cohesion: 0.28
Nodes (8): clientIp(), createLimiter(), forgotPasswordLimiter, inviteValidateLimiter, loginLimiter, optionsFor(), { rateLimit, ipKeyGenerator }, refreshLimiter

### Community 70 - "supertest"
Cohesion: 0.28
Nodes (4): createOrder(), request, salePayload(), supertest

### Community 71 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, create-owner, dev, migrate:auth-tenancy, migrate:indexes, start, test, test:watch

### Community 72 - "templates.js"
Cohesion: 0.61
Nodes (7): APP_URL(), escapeHtml(), formatDate(), invitationEmail(), layout(), passwordChangedEmail(), passwordResetEmail()

### Community 73 - "ProductAutocomplete.tsx"
Cohesion: 0.32
Nodes (6): DropdownPosition, formatPrice(), ProductAutocomplete(), handleKeyDown(), selectProduct(), ProductAutocompleteProps

### Community 74 - "AdjustStockPanel"
Cohesion: 0.48
Nodes (7): AdjustStockPanel(), changeDirection(), changeQuantity(), changeUnit(), clampQuantity(), stepQuantity(), toBasePieces()

### Community 75 - "upload.middleware.js"
Cohesion: 0.33
Nodes (5): multer@^1.4.5-lts.1, multer, storage, upload, multer

### Community 76 - "CustomerProfile"
Cohesion: 0.33
Nodes (4): CustomerProfile(), handleCreateSale(), handleDeleteCustomer(), handleRecordPayment()

### Community 77 - "SupplierDetailSummary.tsx"
Cohesion: 0.33
Nodes (5): PROFILE_CARD, PROFILE_METRIC_GRID, SupplierDetailSummaryProps, SupplierFinancials, formatNumber()

### Community 78 - "RecordPurchasePaymentDialog.tsx"
Cohesion: 0.40
Nodes (4): newPaymentKey(), RecordPurchasePaymentDialog(), RecordPurchasePaymentDialogProps, PurchasePaymentInput

### Community 79 - "proxy.ts"
Cohesion: 0.47
Nodes (5): config, hasAuthCookie(), isPublicPath(), proxy(), PUBLIC_PATHS

### Community 80 - "enforcement.middleware.js"
Cohesion: 0.70
Nodes (4): enforceTenantAuth(), hasValidBusinessContext(), isEnabled(), requireRoleWhenEnforced()

### Community 81 - "lifecycle.js"
Cohesion: 0.40
Nodes (4): PURCHASE_FLOW, PURCHASE_STATUSES, SALE_FLOW, SALE_STATUSES

### Community 82 - "fetchSuppliers"
Cohesion: 0.60
Nodes (4): usePurchaseLookups(), loadProducts(), loadSuppliers(), fetchSuppliers()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `brands/index.ts`, `apiFetch`, `auth.service.ts`, `SalesOrdersView`, `PurchasesView.tsx`, `frontend/package.json`, `inventory/utils.ts`, `dashboard/utils.ts`, `SalesOrdersView.tsx`, `CustomerProfile.tsx`, `customers/utils.ts`, `inventory/page.tsx`, `purchases/utils.ts`, `suppliers/utils.ts`, `suppliers/types.ts`, `AddCustomerForm.tsx`, `CreatePurchaseView.tsx`, `OrderFormDialog.tsx`, `customers/types.ts`, `formatRs`, `CustomerOrdersLedger.tsx`, `SuppliersView.tsx`, `inventory.service.ts`, `SupplierPurchaseLedger.tsx`, `EditSupplierDialog`, `SalesOverview.tsx`, `ReceivePurchaseDialog.tsx`, `ProductAutocomplete.tsx`, `RecordPurchasePaymentDialog.tsx`, `fetchSuppliers`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Should `brands/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0537714712471994 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `brands/index.ts`, `apiFetch`, `auth.service.ts`, `AddCustomerForm.tsx`, `CreatePurchaseView.tsx`, `suppliers/types.ts`, `PurchasesView.tsx`, `frontend/package.json`, `SalesOrdersView.tsx`, `SuppliersView.tsx`, `proxy.ts`, `CustomerProfile.tsx`, `customers/utils.ts`, `SalesOverview.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `apiFetch` be split into smaller, more focused modules?**
  _Cohesion score 0.050917336631622345 - nodes in this community are weakly interconnected._
- **Why does `mongoose` connect `mongoose` to `token.service.js`, `supplier.controller.js`, `purchase.controller.js`, `sale-order.controller.js`, `financials.js`, `migrate-indexes.js`, `product.controller.js`, `createBusiness`, `customer.controller.js`, `app`, `dependencies`, `inventory.controller.js`, `auth.js`, `migrate-auth-tenancy.js`, `SaleOrder.js`, `invite.controller.js`, `backend/package.json`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `auth.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06105834464043419 - nodes in this community are weakly interconnected._
- **Should `supplier.controller.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08653353814644137 - nodes in this community are weakly interconnected._