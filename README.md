# Claims Intake Wizard

A TypeScript Turborepo for a multi-step insurance claim intake flow. The project was built as an AI coding interview exercise with a focus on clean UI, shared form state, validation, document upload progress, and review-before-submit behavior.

## What It Does

The web app guides a claimant through five steps:

1. Claim type selection: outpatient, inpatient, or dental.
2. Member and policy information: pre-filled mock policy data, editable fields, and dependent selection.
3. Diagnosis and treatment: diagnosis details, ICD-10 autocomplete, provider suggestions, and treatment dates.
4. Document upload: required and optional documents based on claim type, file validation, temporary backend upload, and progress display.
5. Review and submit: summary of all data, edit navigation, confirmation checkbox, and mock submission.

## Tech Stack

- Turborepo
- Yarn workspaces
- TypeScript
- Next.js app router
- React
- TailwindCSS
- Ant Design
- Zustand with persistence
- Axios for frontend API requests
- Express for the upload API
- Multer for local temporary document storage

## Repository Structure

```text
apps/
  server/        Express API for health checks and document uploads
  web/           Next.js claim wizard frontend
packages/
  eslint-config/ Shared ESLint config
  typescript-config/ Shared TypeScript config
```

Important web folders:

```text
apps/web/app/          Next.js routes and global styles
apps/web/components/   Wizard shell, step components, and reusable form controls
apps/web/data/         Mock policy, diagnosis, and document requirement data
apps/web/lib/          Centralized frontend API clients
apps/web/stores/       Persisted wizard draft state
apps/web/utils/        Form data and date utilities
```

## Local Development

Install dependencies:

```sh
yarn install
```

Run both apps:

```sh
yarn dev
```

Default local URLs:

- Web: `http://localhost:3000`
- Server: `http://localhost:3001`

Run checks:

```sh
yarn check-types
yarn lint
yarn build
```

## Environment Variables

The app works with defaults in local development.

Optional variables:

```sh
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000
DRAFT_DOCUMENT_RETENTION_DAYS=30
DRAFT_DOCUMENT_CLEANUP_HOURS=24
```

## Document Upload Flow

The frontend uploads files immediately during Step 4 so the user can see real upload progress. The successful API response metadata is stored in the shared Ant Design form state under `documents.files`.

The server stores uploaded files locally in:

```text
apps/server/uploads/documents
```

Temporary uploads are cleaned up by a retention job. The frontend also asks the server to delete replaced or removed temporary documents when possible.

Allowed files:

- PDF
- JPG/JPEG
- PNG
- Max 10MB per file

## Form State Notes

The wizard uses one Ant Design form across all steps. Step panels stay mounted and are hidden instead of conditionally unmounted, so form fields remain registered for validation and review.

Zustand stores the persisted draft and current step, but the live form remains the source of truth while the user is editing. Draft persistence happens on navigation, upload changes, and submit to avoid input lag.

Hidden or no-longer-applicable fields are sanitized before persistence and submission, such as inpatient-only treatment fields or document types from a previous claim type.

## Date Handling

Date fields use a reusable Ant Design `DatePicker` wrapper. The form stores dates as `YYYY-MM-DD` strings while the picker receives Dayjs values. Date-of-birth disables future date cells with AntD's `disabledDate` prop.
