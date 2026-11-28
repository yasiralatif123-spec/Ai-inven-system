# Graph Report - inv_system  (2026-11-28)

## Corpus Check
- 285 files · ~181,329 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 2308 nodes · 6214 edges · 148 communities (114 shown, 34 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 234 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6b81d80`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- auth.service.ts
- SupplierDetailPage.tsx
- Purchase Controller
- Test Db
- Sale Order Controller
- SalesOrdersView.tsx
- SuppliersView
- customer.controller.js
- units.ts
- Create Owner
- Sales Orders View
- DeleteOrderDialog.tsx
- Product Controller
- Purchase Data
- Package Group
- InventoryPage
- Purchases Utilities
- EditSupplierDialog.tsx
- supplier.controller.js
- Brand Controller
- suppliers/utils.ts
- CustomersView.tsx
- AddSupplierForm.tsx
- react
- Supplier Detail Data
- Auth Controller
- customers/utils.ts
- Dashboard Utilities
- inventory.controller.js
- OpeningBalancePaymentSection.tsx
- Invite Service
- Auth Validator
- Pricing Contract Test
- Brands View
- apiFetch
- DashboardPreview.tsx
- EditCustomerDialog.tsx
- app.js
- Payment Integrity Test
- CustomerProfile.tsx
- PurchasesView
- Brands Utilities
- Brand Service
- supplier.service.ts
- Tsconfig Group
- Units Group
- Create Purchase View
- Password Reset Service
- financials.js
- App Shell
- Brand Filters
- opening-balance-payments.test.js
- customers/types.ts
- Brand Detail Dialog
- Lifecycle Integrity Test
- customers/index.ts
- Auth Api
- Package Group
- User Controller
- sale-order-cancellation.test.js
- Brand Autocomplete
- useCustomerProfile
- profile.ts
- devDependencies
- migrate-auth-tenancy.js
- Migrate Indexes
- Origin Middleware
- formatDate
- Setup Dotenv Test
- Supplier Financials Test
- ProductPickerProps
- Receive Purchase Dialog
- OrderFormDialog.tsx
- multer
- RegisterView.tsx
- Customer Financials Test
- formatRs
- Inventory Api
- Implementation Progress
- Agents Group
- Stock Table
- next
- Skill Group
- Sales Orders Api
- Purchases Api
- Tenancy Group
- stock-integrity.test.js
- BrandStatusDialog.tsx
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
- SalesOrder
- Purchases Toolbar
- Supplier Actions Menu
- Customers Api
- SalesOrdersHeader.tsx
- Purchase Context Card
- Purchases Table
- Purchase Summary Card
- MovementsLedger.tsx
- proxy.ts
- Sales Filters
- Suppliers Header
- Suppliers Api
- lifecycle.js
- Project Memory
- Agents Group
- SupplierPurchaseLedger.tsx
- Implementation Progress
- RecordPurchasePaymentDialog.tsx
- CustomerOrdersLedger.tsx
- ProductAutocompleteProps
- EditOrderDialog.tsx
- AdjustStockPanel
- suppliers/types.ts
- RecordPaymentDialog.tsx
- LoginView.tsx
- Window Group
- backend/package.json
- phase6b-tenant.test.js
- Globe Group
- Next Group
- Project Memory
- File Group
- Vercel Group
- Readme Group
- Project Memory
- CustomerFiltersProps
- formatRs
- useBrands.ts
- CreatePurchaseHeaderProps
- ProductAutocomplete
- AuthContextValue
- PurchasesHeaderProps
- dependencies
- AdjustStockPanelProps
- BrandFormDialogProps
- SupplierAutocompleteProps
- helmet

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

## Communities (148 total, 34 thin omitted)

### Community 0 - "auth.service.ts"
Cohesion: 0.14
Nodes (18): inter, jetbrainsMono, metadata, RootLayout(), AuthContext, AuthProvider(), acceptInvite(), ApiError (+10 more)

### Community 1 - "SupplierDetailPage.tsx"
Cohesion: 0.13
Nodes (25): BADGE_TONES, METRIC_SURFACES, PROFILE_BUTTON_DANGER_ICON, PROFILE_BUTTON_ICON, PROFILE_BUTTON_PRIMARY, PROFILE_BUTTON_QUIET, PROFILE_CARD, PROFILE_METRIC_GRID (+17 more)

### Community 2 - "Purchase Controller"
Cohesion: 0.14
Nodes (46): applyStockReceipt(), basePurchasePrice(), buildPurchaseChanges(), clamp(), cleanString(), ConflictError, createPurchase(), createReceiptEntry() (+38 more)

### Community 3 - "Test Db"
Cohesion: 0.07
Nodes (49): authTokenSchema, mongoose, mongoose, refreshSessionSchema, mongoose, userSchema, cookieHeader(), loginAs() (+41 more)

### Community 4 - "Sale Order Controller"
Cohesion: 0.15
Nodes (40): applyStockAdjustments(), buildOrderChanges(), clamp(), cleanString(), ConflictError, createSaleOrder(), customerIdOf(), deleteSaleOrder() (+32 more)

### Community 5 - "SalesOrdersView.tsx"
Cohesion: 0.17
Nodes (23): SalesFilters(), STATUS_TABS, handleExport(), DateFilter, DateGroup, DraftOrderInput, DraftOrderItemInput, HubFilter (+15 more)

### Community 6 - "SuppliersView"
Cohesion: 0.14
Nodes (12): SuppliersView(), applySupplierList(), confirmSupplierDelete(), handleExport(), handleSupplierSaved(), load(), downloadCsv(), escapeCsv() (+4 more)

### Community 7 - "customer.controller.js"
Cohesion: 0.15
Nodes (29): buildCustomerChanges(), CITIES, cleanString(), createCustomer(), CUSTOMER_TYPES, customerResponse(), deleteCustomer(), financialBusinessId() (+21 more)

### Community 8 - "units.ts"
Cohesion: 0.06
Nodes (59): CANONICAL_PRICE_DECIMALS, convertPrice(), fromBasePieces(), normalizeUnit(), parseMoneyInput(), PIECES_PER_UNIT, priceForUnit(), pricePerPiece() (+51 more)

### Community 9 - "Create Owner"
Cohesion: 0.10
Nodes (20): bcrypt, main(), mongoose, normalizeEmail(), parseArgs(), path, runCreateOwner(), slugify() (+12 more)

### Community 10 - "Sales Orders View"
Cohesion: 0.18
Nodes (21): handleCreateSale(), handleRecordPayment(), SalesOrdersView(), handleCancelConfirm(), handleCreateOrder(), handleDeleteOrder(), handleRecordPayment(), handleUpdateOrder() (+13 more)

### Community 11 - "DeleteOrderDialog.tsx"
Cohesion: 0.15
Nodes (11): CancelOrderDialog(), CancelOrderDialogProps, DeleteOrderDialog(), DeleteOrderDialogProps, SalesKpis(), SalesKpisProps, formatNumber(), formatRs() (+3 more)

### Community 12 - "Product Controller"
Cohesion: 0.13
Nodes (30): ensureCloudinaryConfigured(), getCloudinaryConfig(), buildProductMovement(), ConflictError, createProduct(), deleteProduct(), destroyCloudinaryImage(), findOwnedProduct() (+22 more)

### Community 13 - "Purchase Data"
Cohesion: 0.11
Nodes (21): DeletePurchaseDialog(), DeletePurchaseDialogProps, ACTIONS, PurchaseActionsMenu(), PurchaseActionsMenuProps, PurchasesHeader(), PurchasesSummary(), PurchasesSummaryProps (+13 more)

### Community 14 - "Package Group"
Cohesion: 0.10
Nodes (26): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.4.6, tailwindcss@4.3.3, @tailwindcss/turbopack@4.3.3, @types/node@^20, @types/react@^19 (+18 more)

### Community 15 - "InventoryPage"
Cohesion: 0.17
Nodes (8): InventoryEmptyState(), InventoryEmptyStateProps, InventoryPage(), handleAdjusted(), handleDeleteMovement(), isAlertRow(), isToday(), refreshedStockRow()

### Community 16 - "Purchases Utilities"
Cohesion: 0.18
Nodes (19): formatStockWithPieces(), ProductPicker(), handleKeyDown(), selectProduct(), PurchaseDetailDialog(), PurchaseDetailDialogProps, PurchaseItemsTable(), calculateLineTotal() (+11 more)

### Community 17 - "EditSupplierDialog.tsx"
Cohesion: 0.11
Nodes (20): EMPTY_FORM, FieldProps, EditSupplierDialog(), handleOpeningBalancePayment(), handleSubmit(), EditSupplierDialogProps, Field(), SelectShell() (+12 more)

### Community 18 - "supplier.controller.js"
Cohesion: 0.17
Nodes (26): buildSupplierChanges(), cleanString(), createSupplier(), deleteSupplier(), findOwnedSupplier(), generateSupplierCode(), getNextSupplierCode(), getSupplierByCode() (+18 more)

### Community 19 - "Brand Controller"
Cohesion: 0.22
Nodes (23): cleanString(), ConflictError, createBrand(), escapeRegex(), findOwnedBrand(), getBrandById(), handleControllerError(), isTenantEnforced() (+15 more)

### Community 20 - "suppliers/utils.ts"
Cohesion: 0.15
Nodes (12): DeleteSupplierDialog(), DeleteSupplierDialogProps, SupplierActionsMenu(), PAGE_SIZES, SuppliersFooter(), SuppliersFooterProps, PayableCell(), SuppliersTable() (+4 more)

### Community 21 - "CustomersView.tsx"
Cohesion: 0.12
Nodes (13): CustomerFilters(), CustomersFooter(), CustomersFooterProps, CustomersHeader(), CustomersHeaderProps, BALANCE_TABS, PAGE_SIZES, ROUTE_FILTER_OPTIONS (+5 more)

### Community 22 - "AddSupplierForm.tsx"
Cohesion: 0.29
Nodes (8): AddSupplierForm(), handleSubmit(), loadCode(), resetForm(), save(), Field(), SectionCard(), fetchNextSupplierCode()

### Community 23 - "react"
Cohesion: 0.10
Nodes (33): Direction, ADJUSTMENT_REASONS, MovementEntry, StockMovementDto, StockRow, StockStatus, load(), InventoryTab (+25 more)

### Community 24 - "Supplier Detail Data"
Cohesion: 0.12
Nodes (24): DOT_CLASSES, SupplierActivityTimelineProps, MasterProfileRow, Purchase, PurchaseDelivery, PurchaseLine, PurchaseStatus, SupplierFinancials (+16 more)

### Community 25 - "Auth Controller"
Cohesion: 0.17
Nodes (23): bcrypt, clearAuthCookies(), cookieOptions(), DUMMY_PASSWORD_HASH, login(), logout(), me(), refresh() (+15 more)

### Community 26 - "customers/utils.ts"
Cohesion: 0.10
Nodes (20): CustomerActionsMenu(), CustomerKpis(), CustomerKpisProps, CustomersTable(), OutstandingCell(), CustomersView(), confirmCustomerDelete(), handleExport() (+12 more)

### Community 27 - "Dashboard Utilities"
Cohesion: 0.16
Nodes (28): deriveStockStatus(), toStockRows(), parseCanonicalPrice(), fetchDashboardSnapshot(), PERIODS, ActivitySeed, addDays(), chartGeometry() (+20 more)

### Community 28 - "inventory.controller.js"
Cohesion: 0.13
Nodes (25): adjustStock(), cleanString(), ConflictError, deleteStockMovement(), findOwnedMovement(), getMovements(), handleControllerError(), isTenantEnforced() (+17 more)

### Community 29 - "OpeningBalancePaymentSection.tsx"
Cohesion: 0.21
Nodes (10): OPENING_BALANCE_PAYMENT_METHODS, formatDate(), formatRs(), newPaymentKey(), OpeningBalancePaymentSection(), handleSubmit(), OpeningBalancePaymentSectionProps, OpeningBalancePaymentInput (+2 more)

### Community 30 - "Invite Service"
Cohesion: 0.17
Nodes (19): acceptInvite(), bcrypt, businessIdFor(), createInvite(), listInvites(), revokeInvite(), validateInvite(), normalizeEmail() (+11 more)

### Community 31 - "Auth Validator"
Cohesion: 0.14
Nodes (20): clientIp(), createLimiter(), forgotPasswordLimiter, inviteValidateLimiter, loginLimiter, optionsFor(), { rateLimit, ipKeyGenerator }, refreshLimiter (+12 more)

### Community 32 - "Pricing Contract Test"
Cohesion: 0.10
Nodes (20): mongoose, paymentRecordSchema, paymentRecordsField, mongoose, purchaseItemSchema, purchaseReceiptSchema, purchaseSchema, mongoose (+12 more)

### Community 33 - "Brands View"
Cohesion: 0.10
Nodes (11): BrandFilters(), BrandsFooter(), BrandsFooterProps, BrandsHeader(), BrandsHeaderProps, BrandsView(), confirmStatus(), FormState (+3 more)

### Community 34 - "apiFetch"
Cohesion: 0.27
Nodes (19): apiFetch(), isAuthEndpoint(), isBrowser(), isPublicAuthPath(), redirectToExpiredSession(), refreshSession(), save(), assertOk() (+11 more)

### Community 35 - "DashboardPreview.tsx"
Cohesion: 0.18
Nodes (12): ForgotPasswordPage(), metadata, metadata, ResetPasswordPage(), DashboardPreview(), tiltStyle, ForgotPasswordForm(), ForgotPasswordView() (+4 more)

### Community 36 - "EditCustomerDialog.tsx"
Cohesion: 0.14
Nodes (24): AddCustomerForm(), handleSubmit(), loadCode(), resetForm(), EMPTY_FORM, Field(), SectionCard(), SelectShell() (+16 more)

### Community 37 - "app.js"
Cohesion: 0.14
Nodes (13): allowedOrigins, cookieParser, cors, express, helmet, errorHandler(), router, router (+5 more)

### Community 38 - "Payment Integrity Test"
Cohesion: 0.18
Nodes (15): cookieHeader(), createCustomer(), createProduct(), createPurchase(), createSale(), createSupplier(), customerPayload(), loginAs() (+7 more)

### Community 39 - "CustomerProfile.tsx"
Cohesion: 0.18
Nodes (11): CustomerPayments(), CustomerPaymentsProps, CustomerProfile(), handleDeleteCustomer(), CustomerProfileProps, ProfileTab, TABS, DeleteCustomerDialog() (+3 more)

### Community 40 - "PurchasesView"
Cohesion: 0.15
Nodes (12): PurchasesFooter(), PurchasesFooterProps, PurchasesView(), applyUpdatedPurchase(), handleAction(), handleDeleteConfirm(), handleExport(), handlePaymentConfirm() (+4 more)

### Community 41 - "Brands Utilities"
Cohesion: 0.32
Nodes (13): BRAND_DESCRIPTION_MAX_LENGTH, BRAND_NAME_MAX_LENGTH, BrandSummary, CreateBrandInput, asBoolean(), asNumber(), asString(), filterBrands() (+5 more)

### Community 42 - "Brand Service"
Cohesion: 0.22
Nodes (15): BrandFormDialog(), submit(), assertOk(), BrandQueryOptions, BrandSearchResult, createBrand(), extractBrand(), JsonObject (+7 more)

### Community 43 - "supplier.service.ts"
Cohesion: 0.38
Nodes (13): load(), assertOk(), createSupplier(), deleteSupplier(), fetchSupplier(), fetchSuppliers(), formatDate(), readJson() (+5 more)

### Community 44 - "Tsconfig Group"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 45 - "Units Group"
Cohesion: 0.21
Nodes (20): canonicalPriceFromBody(), resolvePricing(), assertPositiveQuantity(), CANONICAL_UNITS, cleanString(), convertPrice(), formatStock(), fromBasePieces() (+12 more)

### Community 46 - "Create Purchase View"
Cohesion: 0.24
Nodes (18): availableStock(), CreatePurchaseView(), addProductRow(), handleBarcodeScan(), handleProductSelect(), handlePurchaseDateChange(), handleRemoveItem(), handleSupplierQueryChange() (+10 more)

### Community 47 - "Password Reset Service"
Cohesion: 0.24
Nodes (13): bcrypt, forgotPassword(), resetPassword(), isConfigured(), { Resend }, resendClient(), sendEmail(), consumePasswordResetToken() (+5 more)

### Community 48 - "financials.js"
Cohesion: 0.10
Nodes (43): evaluateCustomerCreditLimit(), nonNegativeMoney(), aggregateCustomerFinancials(), deriveCustomerFinancialSummary(), mongoose, nonNegativeMoney(), openingBalanceFields(), PAYMENT_TERMS_LABELS (+35 more)

### Community 49 - "App Shell"
Cohesion: 0.11
Nodes (20): BrandsPage(), AppShell(), intelligenceMenu, mainMenu, NavGroup(), NavItem, roleLabel(), SidebarIcon() (+12 more)

### Community 50 - "Brand Filters"
Cohesion: 0.31
Nodes (5): BrandFiltersProps, SORT_OPTIONS, STATUS_FILTER_OPTIONS, BrandSort, BrandStatusFilter

### Community 51 - "opening-balance-payments.test.js"
Cohesion: 0.36
Nodes (11): cookieHeader(), createCustomer(), createProduct(), createPurchase(), createSale(), createSupplier(), loginAs(), payCustomer() (+3 more)

### Community 52 - "customers/types.ts"
Cohesion: 0.13
Nodes (9): DeleteCustomerDialogProps, CreditStatus, Customer, CustomerFilters, GracePeriod, PaymentTerms, CustomerAutocompleteProps, useCustomerLookup() (+1 more)

### Community 53 - "Brand Detail Dialog"
Cohesion: 0.17
Nodes (7): BrandDetailDialog(), BrandDetailDialogProps, DetailItem(), BrandsTable(), BrandsTableProps, formatBrandDate(), formatProductCount()

### Community 54 - "Lifecycle Integrity Test"
Cohesion: 0.22
Nodes (10): cookieHeader(), createApiProduct(), createApiSupplier(), loginAs(), purchasePayload(), randomSuffix(), request, seedAuth() (+2 more)

### Community 55 - "customers/index.ts"
Cohesion: 0.38
Nodes (14): assertOk(), createCustomer(), deleteCustomer(), fetchCustomer(), fetchCustomers(), fetchNextCustomerCode(), readJson(), recordCustomerOpeningBalancePayment() (+6 more)

### Community 56 - "Auth Api"
Cohesion: 0.14
Nodes (14): Auth API Contract, Auth Identity Model, Invite Role Rules, Auth OpenAPI Contract, Origin And Referer Check, Password Reset Flow, Auth Phase 3 Endpoints, Auth Rate Limits (+6 more)

### Community 57 - "Package Group"
Cohesion: 0.15
Nodes (13): dependencies, bcryptjs@^2.4.3, cloudinary@^2.5.1, cookie-parser@^1.4.7, cors@^2.8.5, jsonwebtoken@^9.0.2, mongoose@^8.9.5, zod@^4.6.7 (+5 more)

### Community 58 - "User Controller"
Cohesion: 0.31
Nodes (11): businessIdFor(), canManage(), changeRole(), deactivateUser(), listUsers(), authenticate(), getAccessToken(), findActiveSessionBySid() (+3 more)

### Community 59 - "sale-order-cancellation.test.js"
Cohesion: 0.15
Nodes (12): customerSchema, mongoose, createCustomerRequest(), createProduct(), customerPayload(), randomSuffix(), request, customerSeed() (+4 more)

### Community 60 - "Brand Autocomplete"
Cohesion: 0.13
Nodes (12): BrandAutocomplete(), handleKeyDown(), selectBrand(), BrandAutocompleteProps, DropdownPosition, BrandSelect(), BrandSelectProps, BRAND_SEARCH_LIMIT (+4 more)

### Community 61 - "useCustomerProfile"
Cohesion: 0.36
Nodes (7): useCustomerProfile(), load(), applyCustomerOrderMetrics(), customerMatchesOrder(), findCustomerForOrder(), phoneDigits(), handleOpenCustomer()

### Community 62 - "profile.ts"
Cohesion: 0.23
Nodes (12): CustomerAccountDossier(), CustomerAccountDossierProps, DetailRow(), TONE_CLASSES, CustomerNotes(), CustomerNotesProps, TONE_CLASSES, buildCustomerActivity() (+4 more)

### Community 63 - "devDependencies"
Cohesion: 0.33
Nodes (6): devDependencies, jest@^30.5.2, nodemon@^3.1.9, supertest@^7.3.2, jest, nodemon

### Community 64 - "migrate-auth-tenancy.js"
Cohesion: 0.12
Nodes (19): applyBackfill(), collectCounts(), databaseNameFromUri(), main(), missingBusinessIdFilter(), mongoose, parseArgs(), path (+11 more)

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

### Community 71 - "Receive Purchase Dialog"
Cohesion: 0.24
Nodes (8): initialValues(), itemKey(), ReceivedValues, ReceivePurchaseDialog(), handleSubmit(), receiveAll(), ReceivePurchaseDialogProps, PurchaseReceiveInput

### Community 72 - "OrderFormDialog.tsx"
Cohesion: 0.09
Nodes (27): CustomerAutocomplete(), handleKeyDown(), selectCustomer(), NewOrderDialog(), NewOrderDialogProps, canonicalSalePrice(), EditableItem, emptyItem() (+19 more)

### Community 74 - "RegisterView.tsx"
Cohesion: 0.33
Nodes (10): metadata, RegisterPage(), InviteRegisterForm(), loadInvite(), RegisterView(), ResetPasswordForm(), validateInvite(), doPasswordsMatch() (+2 more)

### Community 75 - "Customer Financials Test"
Cohesion: 0.35
Nodes (9): cookieHeader(), createCustomer(), createProduct(), createSale(), customerPayload(), loginAs(), randomSuffix(), request (+1 more)

### Community 76 - "formatRs"
Cohesion: 0.16
Nodes (19): CreatePurchaseHeader(), PurchaseContextCard(), PurchasePreviewDialog(), PurchasePreviewDialogProps, PurchaseSummaryCard(), SupplierAutocomplete(), handleKeyDown(), selectSupplier() (+11 more)

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
Cohesion: 0.18
Nodes (9): SEVERITY_ORDER, SortKey, STATUS_BADGE_CLASS, STATUS_BAR_CLASS, STATUS_ROW_CLASS, STATUS_VALUE_CLASS, StockTable(), StockTableProps (+1 more)

### Community 81 - "next"
Cohesion: 0.11
Nodes (34): InventoryKpis(), InventoryKpisProps, formatCompactRs(), formatNumber(), formatRs(), CriticalLowStock(), DashboardKpis(), Trend() (+26 more)

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

### Community 86 - "stock-integrity.test.js"
Cohesion: 0.25
Nodes (7): moveCount(), movementsFor(), productApiPayload(), randomSku(), request, seedProduct(), seedSupplier()

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

### Community 99 - "SalesOrder"
Cohesion: 0.11
Nodes (6): OrderActionsMenu(), OrderActionsMenuProps, itemLabel(), OrdersTable(), OrdersTableProps, SalesOrder

### Community 102 - "Customers Api"
Cohesion: 0.33
Nodes (6): Customers API Contract, Customer Create Rules, Customer DTO, Customer Ledger Code, Customer Phone Normalization, Customer Update Preservation

### Community 107 - "MovementsLedger.tsx"
Cohesion: 0.18
Nodes (8): FILTERS, MOVEMENT_BADGE_CLASS, MOVEMENT_ROW_CLASS, MovementFilter, MovementsLedger(), MovementsLedgerProps, MOVEMENT_META, MovementKind

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

### Community 115 - "SupplierPurchaseLedger.tsx"
Cohesion: 0.24
Nodes (9): PROFILE_BUTTON_SECONDARY, PROFILE_TABLE_ROW, exportPurchases(), FILTERS, PurchaseRow(), STATUS_TONES, StatusFilter, SupplierPurchaseLedger() (+1 more)

### Community 116 - "Implementation Progress"
Cohesion: 0.50
Nodes (4): Conditional Role Authorization, Lifecycle Transition Rules, Phase 4 Sales And Purchase Lifecycle Integrity, Tenant Fail Closed

### Community 117 - "RecordPurchasePaymentDialog.tsx"
Cohesion: 0.29
Nodes (4): newPaymentKey(), RecordPurchasePaymentDialog(), RecordPurchasePaymentDialogProps, PurchasePaymentInput

### Community 118 - "CustomerOrdersLedger.tsx"
Cohesion: 0.20
Nodes (12): priceBasisLabel(), CustomerInvoices(), CustomerInvoicesProps, CustomerOrdersLedger(), CustomerOrdersLedgerProps, exportOrders(), FILTERS, PaymentFilter (+4 more)

### Community 120 - "EditOrderDialog.tsx"
Cohesion: 0.40
Nodes (3): EditOrderDialog(), EditOrderDialogProps, draftOrderFromSalesOrder()

### Community 121 - "AdjustStockPanel"
Cohesion: 0.36
Nodes (9): AdjustStockPanel(), changeDirection(), changeQuantity(), changeUnit(), clampQuantity(), handleSubmit(), stepQuantity(), adjustStock() (+1 more)

### Community 122 - "suppliers/types.ts"
Cohesion: 0.18
Nodes (18): PAYABLE_TABS, SupplierFilters(), SupplierKpis(), SupplierKpisProps, SuppliersHeader(), EMPTY_SUMMARY, CreateSupplierInput, PayableFilter (+10 more)

### Community 123 - "RecordPaymentDialog.tsx"
Cohesion: 0.33
Nodes (3): newPaymentKey(), RecordPaymentDialog(), RecordPaymentDialogProps

### Community 124 - "LoginView.tsx"
Cohesion: 0.39
Nodes (5): LoginPage(), metadata, useAuthContext(), LoginForm(), LoginView()

### Community 125 - "Window Group"
Cohesion: 1.00
Nodes (3): Three window-control dots depicted in the icon, Window Icon SVG (16x16 gray line-art), Window frame glyph depicted in the icon

### Community 126 - "backend/package.json"
Cohesion: 0.18
Nodes (10): express@^4.21.2, express-rate-limit@^8.7.5, resend@^6.39.0, main, name, private, version, express (+2 more)

### Community 127 - "phase6b-tenant.test.js"
Cohesion: 0.46
Nodes (7): cookieHeader(), createCustomer(), createProduct(), createSupplier(), loginAs(), request, seed()

### Community 137 - "formatRs"
Cohesion: 0.48
Nodes (6): CustomerProfileSummary(), CustomerProfileSummaryProps, getCustomerFinancials(), paymentTermsLabel(), formatRs(), ProfileMetric()

### Community 138 - "useBrands.ts"
Cohesion: 0.60
Nodes (4): useBrands(), load(), UseBrandsOptions, fetchBrands()

### Community 140 - "ProductAutocomplete"
Cohesion: 0.50
Nodes (4): formatPrice(), ProductAutocomplete(), handleKeyDown(), selectProduct()

### Community 143 - "dependencies"
Cohesion: 0.50
Nodes (4): dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0

## Ambiguous Edges - Review These
- `Movement Deletion Contract` → `Compensating Stock Movement Reversal`  [AMBIGUOUS]
  backend/docs/inventory-api.md · relation: conceptually_related_to
- `Public Business API Decision` → `Brands Enforce Tenant Auth`  [AMBIGUOUS]
  PROJECT_MEMORY.md · relation: conceptually_related_to

## Knowledge Gaps
- **79 isolated node(s):** `Customer DTO`, `Customer Ledger Code`, `Customer Phone Normalization`, `Customer Update Preservation`, `Supplier Code Generator` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 694 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `auth.service.ts`, `SupplierDetailPage.tsx`, `SalesOrdersView.tsx`, `units.ts`, `useBrands.ts`, `DeleteOrderDialog.tsx`, `Purchase Data`, `Package Group`, `InventoryPage`, `Purchases Utilities`, `EditSupplierDialog.tsx`, `dependencies`, `suppliers/utils.ts`, `CustomersView.tsx`, `OpeningBalancePaymentSection.tsx`, `Brands View`, `DashboardPreview.tsx`, `EditCustomerDialog.tsx`, `CustomerProfile.tsx`, `Brands Utilities`, `App Shell`, `Brand Filters`, `customers/types.ts`, `Brand Detail Dialog`, `Brand Autocomplete`, `useCustomerProfile`, `formatDate`, `Receive Purchase Dialog`, `OrderFormDialog.tsx`, `RegisterView.tsx`, `formatRs`, `Stock Table`, `next`, `BrandStatusDialog.tsx`, `SalesOrder`, `MovementsLedger.tsx`, `SupplierPurchaseLedger.tsx`, `RecordPurchasePaymentDialog.tsx`, `CustomerOrdersLedger.tsx`, `suppliers/types.ts`, `RecordPaymentDialog.tsx`, `LoginView.tsx`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **What connects `Customer DTO`, `Customer Ledger Code`, `Customer Phone Normalization` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `auth.service.ts`, `SupplierDetailPage.tsx`, `SalesOrdersView.tsx`, `units.ts`, `Purchase Data`, `Package Group`, `dependencies`, `EditSupplierDialog.tsx`, `CustomersView.tsx`, `DashboardPreview.tsx`, `EditCustomerDialog.tsx`, `CustomerProfile.tsx`, `App Shell`, `Brand Autocomplete`, `RegisterView.tsx`, `formatRs`, `proxy.ts`, `suppliers/types.ts`, `LoginView.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `SupplierDetailPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1330049261083744 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Movement Deletion Contract` and `Compensating Stock Movement Reversal`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Public Business API Decision` and `Brands Enforce Tenant Auth`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._