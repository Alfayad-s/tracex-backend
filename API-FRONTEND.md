# TraceX API — Frontend Reference

Use this doc to integrate the TraceX backend from your frontend. All routes are under **`/api`** or **`/api/v1`** (equivalent).

---

## Base URL

- **Local:** `http://localhost:3000`
- **Production (Render):** `https://<your-service-name>.onrender.com`

Use a single base in your app (e.g. `import.meta.env.VITE_API_URL` or `process.env.REACT_APP_API_URL`).

---

## Request / Response Conventions

- **Content-Type:** `application/json` for request bodies.
- **Success:** `{ success: true, data: ... }` (sometimes `data` includes nested objects).
- **Error:** `{ success: false, error: string }`. Check HTTP status (4xx/5xx).
- **Auth:** Send the JWT in the header:  
  `Authorization: Bearer <access_token>`

Optional: send **`X-Request-ID`** for tracing; response may echo it.

---

## Auth (no token required for signup/signin)

### POST `/api/auth/signup`

Register a new user.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "at-least-6-chars"
}
```

| Field     | Type   | Required | Notes                          |
|----------|--------|----------|--------------------------------|
| `email`  | string | Yes      | Valid email                    |
| `password` | string | Yes    | Min 6 characters               |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": null
    },
    "access_token": "eyJ..."
  }
}
```

Store `access_token` and use it for all protected requests. Optionally store `user`.

**Errors:** `400` — Email already registered.

---

### POST `/api/auth/signin`

Sign in.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": null
    },
    "access_token": "eyJ..."
  }
}
```

**Errors:** `401` — Invalid email or password.

---

### GET `/api/auth/me`

Current user. **Requires:** `Authorization: Bearer <access_token>`.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": null
  }
}
```

**Errors:** `401` — Not authenticated or user not found.

---

## Categories (require auth)

All category routes require: `Authorization: Bearer <access_token>`.

### GET `/api/categories`

List predefined + current user’s categories.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Food",
      "userId": null,
      "color": null,
      "icon": null,
      "createdAt": "2025-02-21T...",
      "updatedAt": "2025-02-21T..."
    },
    {
      "id": "uuid",
      "name": "My Category",
      "userId": "user-uuid",
      "color": "#ff0000",
      "icon": "tag",
      "createdAt": "2025-02-21T...",
      "updatedAt": "2025-02-21T..."
    }
  ]
}
```

- `userId: null` = predefined (Food, Transport, Bills, etc.).  
- Use category `name` when creating/updating expenses.

---

### GET `/api/categories/:id`

Get one category by ID.

**Response:** `200 OK` — same category object as in the list.  
**Errors:** `404` — Category not found.

---

### POST `/api/categories`

Create a user category (for expenses).

**Request body:**

```json
{
  "name": "Subscriptions",
  "color": "#3498db",
  "icon": "credit-card"
}
```

| Field   | Type   | Required | Notes           |
|--------|--------|----------|-----------------|
| `name` | string | Yes      | 1–100 chars     |
| `color`| string | No       | Max 20 chars    |
| `icon` | string | No       | Max 50 chars    |

**Response:** `201 Created` — created category object.  
**Errors:** `400` — Name already exists for you, or name is reserved (predefined).

---

### PATCH `/api/categories/:id`

Update a user category (only your own).

**Request body:** any subset of:

```json
{
  "name": "New name",
  "color": "#2ecc71",
  "icon": "tag"
}
```

All fields optional. Use `null` to clear `color` or `icon`.

**Response:** `200 OK` — updated category object.  
**Errors:** `404` — Not found. `400` — Duplicate name or reserved name.

---

### DELETE `/api/categories/:id`

Delete a user category (only your own).

**Response:** `204 No Content`.  
**Errors:** `404` — Not found. Predefined categories cannot be deleted via API.

---

## Expenses (require auth)

All expense routes require: `Authorization: Bearer <access_token>`.

**Expense object** (in responses):

```ts
{
  id: string;           // UUID
  date: string;         // ISO date "YYYY-MM-DD"
  amount: number;
  category: string;     // category name
  description: string | null;
  userId: string;
  deletedAt: string | null;  // set when soft-deleted
  createdAt: string;     // ISO datetime
  updatedAt: string;     // ISO datetime
}
```

List/summary endpoints **exclude** soft-deleted expenses (`deletedAt != null`).

---

### GET `/api/expenses`

List current user’s expenses (paginated, excludes deleted).

**Query parameters:**

| Param      | Type   | Default | Description                    |
|-----------|--------|---------|--------------------------------|
| `page`    | number | 1       | Page number                    |
| `limit`   | number | 20      | Per page (1–100)               |
| `from`    | date   | —       | Filter from date (inclusive)   |
| `to`      | date   | —       | Filter to date (inclusive)    |
| `category`| string | —       | Filter by category name        |
| `minAmount` | number | —     | Min amount                     |
| `maxAmount` | number | —     | Max amount                     |
| `search`  | string | —       | Search in description         |
| `sort`    | string | `date`  | `date` \| `amount` \| `createdAt` |
| `order`   | string | `desc`  | `asc` \| `desc`                |

Dates: ISO date string, e.g. `2025-02-21`.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [ { /* expense */ }, ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### GET `/api/expenses/:id`

Get one expense.

**Response:** `200 OK` — single expense object.  
**Errors:** `404` — Not found (or not yours).

---

### POST `/api/expenses`

Create an expense.

**Request body:**

```json
{
  "date": "2025-02-21",
  "amount": 29.99,
  "category": "Food",
  "description": "Lunch"
}
```

| Field         | Type   | Required | Notes              |
|---------------|--------|----------|--------------------|
| `date`        | string | Yes      | ISO date YYYY-MM-DD|
| `amount`      | number | Yes      | Positive           |
| `category`    | string | Yes      | Predefined or user category name |
| `description` | string | No       | Max 5000 chars     |

**Response:** `201 Created` — created expense object.  
**Errors:** `400` — Invalid category (must exist in predefined or your categories).

---

### PATCH `/api/expenses/:id`

Update an expense (partial).

**Request body:** any subset of:

```json
{
  "date": "2025-02-22",
  "amount": 35.00,
  "category": "Transport",
  "description": "Updated note"
}
```

All fields optional. `description: null` clears it.

**Response:** `200 OK` — updated expense object.  
**Errors:** `404` — Not found. `400` — Invalid category.

---

### DELETE `/api/expenses/:id`

Soft-delete an expense (sets `deletedAt`; excluded from lists/summaries).

**Response:** `204 No Content`.  
**Errors:** `404` — Not found.

---

### POST `/api/expenses/:id/restore`

Restore a soft-deleted expense.

**Response:** `200 OK` — restored expense object.  
**Errors:** `404` — Not found. `400` — Expense is not deleted.

---

### POST `/api/expenses/bulk`

Bulk create expenses (max 100 per request).

**Request body:**

```json
{
  "expenses": [
    {
      "date": "2025-02-21",
      "amount": 10.50,
      "category": "Food",
      "description": "Snack"
    },
    {
      "date": "2025-02-21",
      "amount": 5.00,
      "category": "Transport"
    }
  ]
}
```

Each item: same shape as POST `/api/expenses` body. `category` must be valid.

**Response:** `201 Created`

```json
{
  "success": true,
  "data": [ { /* expense */ }, ... ],
  "count": 2
}
```

**Errors:** `400` — Invalid category in one or more items (message includes index).

---

### GET `/api/expenses/summary`

Summary for date range.

**Query parameters:**

| Param    | Type | Description                |
|----------|------|----------------------------|
| `from`   | date | Start date (optional)      |
| `to`     | date | End date (optional)        |
| `groupBy`| string | `day` \| `week` \| `month` — adds `byPeriod` |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "total": 1234.56,
    "count": 42,
    "byPeriod": [
      { "period": "2025-02-01", "total": 500, "count": 10 },
      { "period": "2025-02-08", "total": 734.56, "count": 32 }
    ]
  }
}
```

`byPeriod` only present when `groupBy` is set. `period`: `YYYY-MM-DD` for day/week, `YYYY-MM` for month.

---

### GET `/api/expenses/summary/by-category`

Totals per category for date range.

**Query parameters:** `from`, `to` (optional, same as summary).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "total": 1234.56,
    "count": 42,
    "byCategory": [
      { "category": "Food", "total": 400, "count": 15 },
      { "category": "Transport", "total": 200, "count": 8 }
    ]
  }
}
```

---

### GET `/api/expenses/export`

CSV export. Returns file download.

**Query parameters:**

| Param  | Type  | Default | Description   |
|--------|-------|---------|---------------|
| `format` | string | `csv` | Only `csv`   |
| `from` | date   | —      | Filter from   |
| `to`   | date   | —      | Filter to     |

**Response:** `200 OK` — `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="expenses-YYYY-MM-DD.csv"`.

Body: CSV with columns `date`, `amount`, `category`, `description`.  
In browser, use `fetch` and create object URL or trigger download from `Blob`.

---

## Health

### GET `/health`

No auth. Use to check if the API is up.

**Response:** `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2025-02-21T12:00:00.000Z"
}
```

---

## Rate limits

- **Auth routes** (`/api/auth/*`): 20 requests per 15 minutes per IP.
- **Other API routes**: 200 requests per 15 minutes per IP.

When exceeded, API returns **429 Too Many Requests**.

---

## CORS

Backend allows cross-origin requests; set your frontend origin in env if you restrict origins. For local dev, `http://localhost:*` is typically allowed.

---

## Quick checklist for frontend

1. **Base URL** — Use one env variable for local vs production.
2. **Auth** — After signup/signin, store `access_token`; send `Authorization: Bearer <token>` on every request except signup/signin and `/health`.
3. **Errors** — Parse `{ success: false, error }` and HTTP status; show `error` to the user when appropriate.
4. **Dates** — Send dates as `YYYY-MM-DD` for `date` fields; receive ISO strings in responses.
5. **Categories** — Load `/api/categories` once (or after login); use `name` for expense `category`. Predefined categories have `userId: null`.
6. **Pagination** — Use `page` and `limit` with GET `/api/expenses`; use `pagination.totalPages` and `pagination.total` for UI.
