# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo has a leftover empty Maven module (`pom.xml`) at the root — it declares no dependencies and no source code exists under it. **The actual application lives entirely in `my-client/`**, a Next.js 14 + TypeScript app. All development happens there.

```
cd my-client
```

## Common commands

Run these from `my-client/`:

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run a production build
- `npm run lint` — ESLint (`next/core-web-vitals` + `eslint:recommended` + `plugin:react/recommended`)

There is no test runner configured in this project (no test script, no test files).

Node engine is pinned to `18.x` (`package.json#engines`).

## Architecture

**Stack**: Next.js 14 (pages router, not app router), React 18, TypeScript, MUI v5, Firebase Realtime Database, SWR for data fetching.

**Domain**: an English word/exam verification app with two user-facing sides:
- **Admin/teacher side** (`pages/admin/**`): create exams (`quiz.tsx`), manage examinations (`examination.tsx`, `examination/[examinationId].tsx`), assign and track homework (`examination/[examinationId]/homework.tsx`, `.../homework/[homeworkId]/completed-students.tsx`), plus teacher utilities (`admin/utils/oral-checking.tsx`, `admin/utils/arrange-wrong-answers.tsx`).
- **Student side** (`pages/index.tsx`, `pages/join.tsx`): students join an exam/homework via a link and take it.

There is **no auth/route-guarding** on `/admin/*` — anyone with the URL can reach admin pages.

**API layer** (`pages/api/**`): thin Next.js API routes that read/write directly to Firebase Realtime Database (no separate backend service). Key routes: `exams.ts`, `exams/[examId].ts`, `exams/[examId]/homeworks.ts`, `exams/[examId]/homeworks/[homeworkId].ts`, `answers.ts`, `answers/current-state.ts`, `answers/search.ts`, `join.ts` (resolves join-link tokens). Validation is done inline per-route (e.g. `getInvalidMessage` helpers) rather than via a shared schema layer.

**Firebase**: only the Realtime Database is used (no Firestore, Auth, Storage, or Functions). Initialized in `modules/firebase/FirebaseService.ts` via `initializeApp`/`getDatabase`. Note: the Firebase config there is **hardcoded**, not read from the `NEXT_PUBLIC_*` env vars defined in `.env.local` (`NEXT_PUBLIC_API_KEY`, `NEXT_PUBLIC_AUTH_DOMAIN`, `NEXT_PUBLIC_DATABASE_URL`, `NEXT_PUBLIC_PROJECT_ID`, `NEXT_PUBLIC_APP_ID`, `NEXT_PUBLIC_ENCODING_KEY`) — these currently appear unused; be aware of this mismatch if working on Firebase config.

**Data fetching**: SWR is used directly inside pages/components (no shared `hooks/` directory). Keys are typically array-form, e.g. `useSWR(['/api/exams', 'get'], fetcher)`. Fetcher functions (`fetcher`, `fetcherWithForm`, etc.) are defined locally in whichever file needs them rather than shared.

**State/UI patterns**:
- `pages/_app.tsx` is a bare wrapper — no global theme or context provider setup.
- MUI is used with default theming (no `ThemeProvider`/`createTheme` customization).
- One React Context exists: `TimeoutContext` (`modules/join/context.ts`), scoped to the student exam-taking timeout flow in `pages/join.tsx`.
- Styling mixes MUI components with CSS Modules (`*.module.css`) per component/page.
- `layout/Admin.tsx` wraps admin pages with a shared search app bar + footer.

**Key module directories** (`modules/`):
- `firebase/` — Firebase Realtime DB init
- `join/` — student join/exam-taking flow (context + `display/DisplayService.ts`)
- `configuration/Configuration.ts` — app-wide config
- `utils/` — color, date, data-mapping, Excel import (`read-excel-file`) helpers, and word-verification logic

**Shared components** (`components/`): generic MUI wrappers prefixed `My*` (`MyButton`, `MyInput`, `MyDateTimePicker`, `MyFileUpload`, `MyToast`, `MySpinner`, `MyCircularProgress`, `MySearchAppBar`, `MyFooter`) plus feature-specific widgets (`AssignHomeWorkModal`, `HomeworkSplitButton`, `ProgressQuestionBar`, `StartingQuestion`).
