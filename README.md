# ResHub — Role-Based Community Management (Angular)

A role-aware Angular application for community management, built against the supplied
`fourdotz-backend-1` test API. It covers authentication, dynamic role-based navigation,
resident management, announcement management (feed UI with pin/unpin), document management
and expiry notifications.

> **New to Angular or to this codebase? Start with [LEARN.md](LEARN.md)** — a plain-English
> walkthrough of how the app is wired together, what every folder is for, and how to make
> common changes.

---

## Quick start

```bash
# 1. Install dependencies (Node 20+ recommended; built on Node 22)
npm install

# 2. Run the dev server
npm start                  # http://localhost:4200

# 3. Production build
npm run build              # output in dist/res-hub
```

No environment setup is required — the API base URL is already configured in
[`src/environments/environment.ts`](src/environments/environment.ts).

### Demo accounts

The login screen has two **Demo accounts** buttons that fill the form for you:

| Role        | Email               | Password    |
| ----------- | ------------------- | ----------- |
| Super Admin | `admin@gmail.com`   | `Admin@123` |
| Resident    | `newuser@gmail.com` | `test@123`  |

The backend runs on Render's free tier, so the very first request after an idle period
can take 30–60 seconds while the instance wakes up. The global progress bar stays visible
for the whole wait.

---

## Features

### Landing page

`/` serves a public, 3D landing page for signed-out visitors — a pointer-tilted card deck built
with `preserve-3d`, blurred colour orbs, a perspective grid floor and tilt-on-hover feature cards.
Signed-in users are redirected straight to their dashboard by `guestGuard`. All motion is disabled
under `prefers-reduced-motion`.

### Authentication

- Reactive login form with email-format and password validation, show/hide password.
- JWT is decoded client-side for `user_id`, `user_type` and `exp`; the session is persisted
  in `localStorage` and restored on reload (expired tokens are discarded).
- Redirect after login is role-based, and honours a `returnUrl` — but only when that URL
  belongs to the signed-in role's section.

### Role-based navigation

| Route prefix   | Role                                  |
| -------------- | ------------------------------------- |
| `/admin/**`    | Super Admin (`user_type === "admin"`) |
| `/resident/**` | Resident (any other `user_type`)      |

The sidebar is generated from [`core/config/navigation.ts`](src/app/core/config/navigation.ts) —
no role checks live in templates. `/` shows the landing page to guests and bounces signed-in users
to their own dashboard; a signed-in user who types another role's URL lands on a friendly
**Access denied** page.

### Super Admin

- **Dashboard** — KPI tiles, recent announcements, documents expiring today, quick actions.
- **Create Resident** — first/last name, email, phone, password, property number, resident type
  (Owner/Tenant), with per-field validation and "save & add another".
- **Resident List** — Name, Email, Phone, Property No., Resident Type, Created Date, with
  debounced search and pagination (page-size selector).
- **Create Announcement** — category/title/summary/event date plus drag-and-drop image upload
  with live preview, type and size validation. The image is optional; the API accepts an
  announcement without one.
- **Announcement List** — LinkedIn-style feed with search and category filter chips.
- **Create Document** — title, category (with suggestions), expiry date, remarks and file upload.
- **Document List** — title, category, expiry date (with colour-coded status), remarks, and
  View / Download links, plus search and pagination.
- **Notifications** — three highlighted groups: **expires today** (the case named in the brief),
  **already expired**, and **expiring within 30 days**. Each entry shows the document name,
  category, expiry date and how far past or short of it today is.
  The sidebar/topbar badge counts only _unread_ items from the first two groups: opening the
  page marks the current ones as seen and clears the badge, while the lists stay on screen — an
  expired document is still expired after you have read about it. A newly expiring document
  brings the badge back.

### Resident

- **Dashboard** — announcement/pinned/upcoming-event counts and the latest posts.
- **Announcement Feed** — `All Announcements` and `Pinned Announcements` as separate routes
  (`/resident/announcements/all` and `/resident/announcements/pinned`) _and_ as filter chips.
- **Pin / Unpin** — optimistic: the card flips instantly and rolls back with a toast if the
  API call fails.

---

## Architecture

```
src/app/
├── core/                        # singletons — no UI
│   ├── config/navigation.ts     # role → sidebar tree
│   ├── guards/auth.guards.ts    # authGuard, guestGuard, roleGuard
│   ├── interceptors/            # loading → auth → error
│   ├── models/                  # API envelope + domain models
│   ├── services/                # ApiService + one service per resource
│   ├── utils/                   # date + collection normalisation
│   └── validators/              # reusable validators & error-message mapper
├── shared/                      # presentational, reusable
│   ├── components/              # icon, page-header, search-box, pagination,
│   │                            # empty-state, stat-card, announcement-card, toasts
│   └── pipes/api-date.pipe.ts   # {$date} formatting + "time ago"
├── layout/                      # shell, sidebar, topbar
└── features/                    # lazy-loaded routed pages
    ├── landing                  # public 3D landing page at /
    ├── auth/login
    ├── admin/{dashboard,residents,announcements,documents,notifications}
    ├── resident/{dashboard,announcements}
    └── errors/{forbidden,not-found}
```

Every component is split into `.ts` / `.html` / `.css`.

**Technical choices**

- Angular 21 standalone components with Zone.js change detection. State is held in plain class
  properties, inputs and outputs use `@Input()` / `@Output()`, and there are no signals,
  `computed`, `effect` or RxJS operators beyond `map`/`tap` — the code stays close to what the
  Angular tutorials show. See [LEARN.md](LEARN.md).
- Reactive Forms throughout, with typed non-nullable form groups.
- Service-layer architecture on `HttpClient`: `ApiService` owns the base URL and the response
  envelope; resource services map envelopes into domain models.
- Three functional interceptors:
  1. `loadingInterceptor` — request counter driving the global progress bar.
  2. `authInterceptor` — attaches `Authorization: Bearer <token>` to everything but `/login`.
  3. `errorInterceptor` — converts any failure into a readable `Error`, and signs the user out
     on a rejected token (401).
- Every route below the shell is lazy-loaded (`loadComponent`).

**Error handling & loading states**

- API errors surface both inline (alert above the form / empty-state on lists) and as toasts.
- Network failure (`status 0`) gets its own message rather than a generic one.
- Lists show skeleton rows, dashboards show skeleton tiles, buttons show inline spinners, and
  the shell shows a top progress bar while any request is in flight.

---

## Notes on the supplied API

Behaviour observed while integrating (all handled in the service layer):

| Observation                                                                                                                                                                                                                                                                            | How it is handled                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`list_user` and `list_document` are `find_one` on the server** — they always return the _same single record_, so a resident or document you just created never appears, even though `create_user` / `create_document` answer `"created successfully"`. Verified with probe requests. | Creation genuinely succeeds. [`LocalRecordsService`](src/app/core/services/local-records.service.ts) keeps a copy of each created record in `localStorage`; the resident and document services merge it into the list response and de-duplicate by server id, email, or title+category+expiry, so the row disappears again the moment the API starts returning it. Merged rows carry a small **New** badge and the list explains why. |
| `list_user` and `list_document` return a **single object**, not an array (`list_announcement` returns an array). An empty result is `{}`.                                                                                                                                              | `toArray()` in `core/utils/collection.utils.ts` normalises every list response.                                                                                                                                                                                                                                                                                                                                                       |
| Dates arrive as Mongo extended JSON: `{"$date": 1783382400000}`.                                                                                                                                                                                                                       | `parseApiDate()` + the `apiDate` pipe.                                                                                                                                                                                                                                                                                                                                                                                                |
| Date-only fields (`event_date`, `expiry_date`) are stored at **UTC midnight**.                                                                                                                                                                                                         | Rendered in UTC so they don't shift a day in western time zones; `created_time` is rendered locally.                                                                                                                                                                                                                                                                                                                                  |
| A resident's `user_type` comes back as `user`, not `owner`/`tenant`.                                                                                                                                                                                                                   | Anything that isn't `admin` maps to the `resident` role.                                                                                                                                                                                                                                                                                                                                                                              |
| `create_user` responses don't echo `property_no` for older records.                                                                                                                                                                                                                    | The table renders `—` for missing values.                                                                                                                                                                                                                                                                                                                                                                                             |
| No search/pagination parameters exist on the list endpoints.                                                                                                                                                                                                                           | Search and pagination are client-side.                                                                                                                                                                                                                                                                                                                                                                                                |
| There is no notification endpoint.                                                                                                                                                                                                                                                     | Notifications are derived from documents whose `expiry_date` is today.                                                                                                                                                                                                                                                                                                                                                                |
| `pin_unpin_announcement` **toggles** and the `pinned` flag is global, not per-user.                                                                                                                                                                                                    | The UI treats pinning as a community-wide toggle and updates optimistically.                                                                                                                                                                                                                                                                                                                                                          |
| Uploaded files return S3 URLs that are sometimes unreachable.                                                                                                                                                                                                                          | Feed images fall back to a text-only card when the image fails to load.                                                                                                                                                                                                                                                                                                                                                               |

---

## Available scripts

| Command         | Description                                    |
| --------------- | ---------------------------------------------- |
| `npm start`     | Dev server with HMR on `http://localhost:4200` |
| `npm run build` | Production build into `dist/res-hub`           |
| `npm run watch` | Development build in watch mode                |

To change the API host, edit `apiBaseUrl` in `src/environments/environment.ts`.
