<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# AGENT.md — Project Architecture & Development Rules

## 1. Role & Responsibilities

Act as a Senior Next.js Full-Stack Developer and Software Architect.

Your responsibility is to build a scalable, maintainable, production-ready application using clean code principles and a well-organized folder structure.

Before implementing any feature:
- Analyze the existing project structure.
- Understand the existing coding patterns and conventions.
- Reuse existing components, utilities, hooks, and services whenever possible.
- Never create duplicate functionality.
- Plan the implementation before modifying files.
- Follow the architecture defined in this document.

## 2. Technology Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: Reusable components
- State Management: React Hooks / Redux Toolkit when necessary
- API Handling: Axios or Fetch
- Backend: Node.js + Express.js (if applicable)
- Database: MongoDB + Mongoose (if applicable)
- Authentication: JWT with secure HTTP-only cookies (if applicable)

Do not introduce additional libraries without a valid technical reason.

## 3. Folder Architecture

Follow a Feature-Based Architecture.

Every major feature must have its own dedicated folder containing all related files.

Example structure:

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── products/
│   │   └── page.tsx
│   │
│   └── layout.tsx
│
├── features/
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductTable.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProductFilters.tsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useProducts.ts
│   │   │
│   │   ├── services/
│   │   │   └── product.service.ts
│   │   │
│   │   ├── types/
│   │   │   └── product.types.ts
│   │   │
│   │   ├── schemas/
│   │   │   └── product.schema.ts
│   │   │
│   │   ├── utils/
│   │   │   └── product.utils.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── orders/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── schemas/
│   │   └── index.ts
│   │
│   └── customers/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── index.ts
│
├── components/
│   ├── ui/
│   ├── shared/
│   └── layout/
│
├── lib/
│   ├── axios.ts
│   ├── utils.ts
│   └── constants.ts
│
├── hooks/
│
├── store/
│   ├── index.ts
│   └── hooks.ts
│
├── types/
│
└── config/
```

This structure is a reference. Adapt it to the actual project requirements without creating unnecessary folders.

## 4. Feature Isolation Rules

Whenever implementing a new feature, create a separate folder inside `src/features/`.

For example, when implementing the Products feature:

- Product listing components must be inside `features/products/components/`.
- Add Product functionality must be organized inside the Products feature.
- Edit Product functionality must remain inside the Products feature.
- Delete Product functionality must remain inside the Products feature.
- Product API calls must be inside `features/products/services/`.
- Product-specific hooks must be inside `features/products/hooks/`.
- Product types must be inside `features/products/types/`.
- Product validation schemas must be inside `features/products/schemas/`.

Do not mix product-related code with order-related or customer-related code.

Apply the same architecture to every new feature.

## 5. Component Architecture

- Build small, reusable components.
- Avoid putting the entire feature inside one large component.
- Separate UI components from business logic.
- Extract repeated UI into reusable shared components.
- Keep feature-specific components inside their respective feature folders.
- Keep globally reusable components inside `components/shared/` or `components/ui/`.
- Avoid unnecessary component abstraction.

Use Server Components by default in Next.js.

Only use `"use client"` when client-side interactivity or browser APIs are required.

## 6. State Management Rules

Use the simplest suitable state management solution.

Follow this priority:

1. React useState for local component state.
2. React Context for simple shared state.
3. Redux Toolkit when complex global state management is required.

Use Redux Toolkit when:
- Multiple unrelated components need the same application state.
- Complex state updates are required.
- State needs to be shared across multiple features.
- Global client-side state becomes difficult to manage with React Hooks or Context.

Do not use Redux for every feature unnecessarily.

If Redux is needed:
- Create feature-specific slices.
- Keep slices inside their respective feature folders when appropriate.
- Register reducers in the central store.
- Create typed Redux hooks.
- Keep Redux logic separate from UI components.

Example:

```text
src/
├── store/
│   ├── index.ts
│   └── hooks.ts
│
└── features/
    └── products/
        └── store/
            └── productSlice.ts
```

## 7. API & Service Layer

- Never write API requests directly inside large UI components.
- Keep API requests inside the relevant feature's services folder.
- Use a centralized Axios instance.
- Never hardcode API base URLs in individual services.
- Use environment variables for API configuration.
- Handle loading, success, and error states properly.
- Follow consistent API response and error-handling patterns.

Example:

```text
features/
└── products/
    └── services/
        └── product.service.ts
```

## 8. TypeScript Rules

- Use proper TypeScript types.
- Avoid `any`.
- Reuse existing types where possible.
- Keep feature-specific types inside their respective feature folders.
- Use interfaces or types based on the situation.
- Properly type API responses, component props, and function parameters.

## 9. Naming Conventions

Follow consistent naming conventions:

- Components: PascalCase (ProductTable.tsx)
- Hooks: camelCase with use prefix (useProducts.ts)
- Services: feature name + service (product.service.ts)
- Types: feature name + types (product.types.ts)
- Schemas: feature name + schema (product.schema.ts)
- Utilities: feature name + utils (product.utils.ts)
- Variables and functions: camelCase
- Constants: UPPER_SNAKE_CASE

## 10. Code Quality Rules

- Follow DRY principles (Don't Repeat Yourself).
- Follow Single Responsibility Principle.
- Avoid unnecessary abstractions.
- Avoid deeply nested components and conditions.
- Keep functions small and focused.
- Remove unused imports and variables.
- Never duplicate existing functionality.
- Do not introduce unnecessary dependencies.
- Write readable and maintainable code.

## 11. Development Workflow

For every new feature, follow these steps:

1. Analyze the existing codebase.
2. Identify the feature's requirements.
3. Plan the required folder structure.
4. Identify reusable components and existing utilities.
5. Create the feature folder and necessary files.
6. Implement business logic separately from UI.
7. Implement API integration through services.
8. Add validation and error handling where required.
9. Integrate Redux only if genuinely necessary.
10. Test the implementation.
11. Verify that existing features are not broken.

## 12. Important Restrictions

- Do not put all application code inside `app/`.
- Do not put every component inside one global components folder.
- Do not create one giant file for an entire feature.
- Do not create unnecessary folders or empty files.
- Do not introduce Redux without a genuine requirement.
- Do not modify unrelated features.
- Do not overwrite existing project architecture without understanding it.
- Do not remove existing functionality while implementing new features.

## 13. Final Requirement

Every feature must be modular, independent, reusable, and maintainable.

When adding a new feature, its components, hooks, services, types, schemas, and state management must remain organized inside its own feature folder.

Prioritize maintainability, scalability, clean architecture, and consistency over writing less code.

Before finishing any task, provide a brief summary of:
- Files created.
- Files modified.
- Features implemented.
- Dependencies added (if any).
- Testing performed.
- Any remaining issues.


## 14. Image Storage & Cloudinary Integration

Use **Cloudinary** for storing and managing all product images.

Whenever implementing the Add Product or Edit Product functionality, integrate Cloudinary for image uploads.

### Upload Requirements

- Use Cloudinary to upload product images.
- Allow multiple images for a single product.
- Support image preview before uploading.
- Allow users to remove selected images before submission.
- Allow users to remove or replace existing images when editing a product.
- Show upload progress and handle upload errors.
- Validate image file types and file sizes.
- Optimize images for better loading performance.
- Never store actual image files or binary data in MongoDB.

### Database Requirements

Store only Cloudinary image information in MongoDB, such as:

- `url`: Cloudinary image URL.
- `public_id`: Cloudinary public ID.

Example:

```ts
images: [
  {
    url: "https://res.cloudinary.com/example/image/upload/shirt.jpg",
    public_id: "products/shirt"
  }
]
```

### Security Requirements

- Store Cloudinary credentials in environment variables.
- Never expose Cloudinary API Secret on the frontend.
- Perform authenticated image uploads through a secure backend API or a properly configured signed upload flow.
- Never hardcode API credentials.
- Use `public_id` to manage image deletion from Cloudinary.

### Architecture Requirements

Keep Cloudinary-related logic organized and reusable.

Example:

```text
src/
├── features/
│   └── products/
│       ├── components/
│       │   ├── ProductForm.tsx
│       │   └── ProductImageUpload.tsx
│       ├── services/
│       │   └── product.service.ts
│       └── types/
│           └── product.types.ts
│
└── lib/
    └── cloudinary.ts
```

Adapt this structure to the existing project architecture.

### Important Rules

- Every new product image upload must use Cloudinary.
- Never use local filesystem storage for production product images.
- Never store image binaries in MongoDB.
- When a product is deleted, handle its associated Cloudinary images appropriately.
- When replacing an image, delete the old Cloudinary image only after the new image has been uploaded and the database update succeeds.
- Avoid orphaned images and broken image URLs.

<!-- END:nextjs-agent-rules -->
