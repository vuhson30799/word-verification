# Student progress deployment

The application now uses direct Firebase progress signals and snapshots. Final
results continue through the application API. A Firebase service account is
required by the new server-only REST adapter; no private key is sent to clients.

## Environment

Set these in local `.env.local` and the corresponding Vercel environment:

```dotenv
FIREBASE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Use a service account belonging to `NEXT_PUBLIC_PROJECT_ID` with Firebase
Realtime Database read/write access. Keep the existing public Firebase settings,
including the correct `NEXT_PUBLIC_DATABASE_URL`. Never commit service account
keys or put them in `NEXT_PUBLIC_*` variables. The server uses Google's OAuth
token endpoint and conditional REST writes with ETags; the existing JWT library
signs custom tokens and verifies Firebase ID tokens using Google's certificates.

Enable **Anonymous** sign-in in Firebase Authentication and configure authorized
domains for local and production hosting. Students keep a persistent anonymous
browser identity. Clearing site data removes that identity and local recovery.
Selecting a roster name does not prove real-world student identity; this retains
the public homework link's existing identity model while protecting ownership of
each registered attempt.

## Rules

Merge the top-level branches from `progress.rules.json` into the existing
Realtime Database rules. This file is a fragment, not a replacement for the
application's other rules. Review existing parent `.read` and `.write` grants:
**a permissive rule at the database root overrides restrictive child rules**.
Remove permissive ancestor grants and move necessary legacy permissions to their
individual branches before enabling this feature. Do not make new paths public.

- `attemptOwners/{homeworkId}/{attemptId}`: only server credentials can register attempts.
- `progressAccess`: only server credentials can grant homework signal access.
- `completedAttempts/{homeworkId}/{attemptId}`: only server credentials can read
  and finalize results. Client progress cannot change these records.
- `progress/{examId}/{homeworkId}/signal`: registered students can listen;
  scoped, time-limited teacher credentials can publish signals.
- `progress/{examId}/{homeworkId}/snapshots/{attemptId}`: students can transact on
  their owned attempts with validated metadata and nondecreasing revisions;
  scoped teachers can read responses. Finalized attempts reject further writes.

Keep `.indexOn: ["examId"]` on `/answers` for legacy result queries. Existing
routes still use the application's current Firebase access for legacy data.
The new result path does not require a query index because reads are scoped by
homework ID. Existing `/answers` records stay readable for backward compatibility;
old `/api/answers/current-state` clients must reload (the endpoint returns 410).
Both the teacher results API and the legacy answer-search API merge old records
with the new result store. Homework/exam deletion atomically removes legacy
answers, completed attempts, snapshots, owner metadata, and associated grants.

Teacher Firebase credentials are issued only after checking the application
session cookie. They are isolated from student Firebase authentication, scoped
to one homework, and limited by an `accessUntil` claim of one hour. Each manual
refresh obtains fresh credentials. Polling uses the authenticated results API
and does not need a persistent teacher Firebase listener.

## Operational checks

1. Verify rules in the Firebase emulator before deployment.
2. Start a student attempt; confirm another anonymous identity cannot edit it.
3. Click Refresh progress as an authenticated teacher and confirm responses.
4. Disconnect a student, finish, reconnect, and confirm one final result is saved.
5. Retry with a lower score; confirm the previous best remains displayed.

Firebase Spark allows 100 simultaneous database connections; account for student
listeners and other application connections when sizing classes. Schedule cleanup
of old progress snapshots and access grants according to your retention policy.
Do not delete completed attempts as part of temporary snapshot cleanup.

If authentication, rules, credentials, or indexes cause a Firebase error, update
the relevant Firebase configuration first. Do not enable public writes or use a
broad-read workaround to hide the error.

## Local verification

From `my-client`, run the Node tests and production build:

```sh
node --test tests/*.test.mjs
npm run build
```

To include the database security checks, start the Firebase Realtime Database
emulator on localhost, then run:

```sh
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 node --test tests/*.test.mjs
```

The browser regression test requires Playwright and Google Chrome. Start the
application locally and run:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 \
node tests/progress.browser.cjs
```

`PLAYWRIGHT_MODULE` can be omitted when Playwright is resolvable in the project.
`WV_TEST_BASE_URL` defaults to `http://127.0.0.1:3000`. The browser test mocks the
application API and Firebase Authentication and redirects Firebase WebSockets to
the local emulator. It uses only the `demo-wv-browser` database namespace. The
rules test uses `demo-wv-rules`. Neither test writes to the live database.

The browser test checks polling timing and pause conditions, manual refresh,
question-order recovery, multi-tab ownership, offline submissions across Play
Again, retry acknowledgment, best-score preservation, interruption recovery,
and the storage-unavailable warning. It checks browser errors and creates
temporary desktop/mobile screenshots, removing them when the run finishes.
Set `WV_ARTIFACTS` to an output directory to retain screenshots for inspection.

These checks verify the implementation against local test services. Live project
verification still requires the Authentication, credentials, and rules setup
above; configure them before deploying this change.
