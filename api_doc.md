# TraceX API Documentation

Base URL: `/` (e.g. `http://localhost:3000`). All JSON responses use `success: boolean` and either `error` (string) on failure or endpoint-specific data on success.

**Versioning:** Routes are available under **`/api/v1`** and **`/api`** (e.g. `POST /api/v1/auth/signup` or `POST /api/auth/signup`).

**Rate limits:** Global API: **200 requests per 15 minutes** per IP. Auth routes (`/api/auth/*`): **20 requests per 15 minutes** per IP. Exceeding returns `429` with `{ "success": false, "error": "..." }`.

**OpenAPI / Swagger UI:** Interactive docs at **`GET /api-docs`** (serve the app and open `http://localhost:3000/api-docs`).

---

## Health

### `GET /health`

No auth. Returns server status.

**Sample request**

```http
GET /health
```

**Response** `200`

```json
{
  "status": "ok",
  "timestamp": "2025-02-21T12:00:00.000Z"
}
```

---

## Authentication (Phase 1)

All auth routes are under `/api/auth`. Rate limit: **20 requests per 15 minutes per IP**. Exceeding returns `429` with `{ "success": false, "error": "Too many attempts; try again later" }`.

Protected routes require header: `Authorization: Bearer <token>`.

---

### `POST /api/auth/signup`

Register a new user.

**Request body**

| Field    | Type   | Required | Description                          |
|----------|--------|----------|--------------------------------------|
| `email`  | string | yes      | Valid email format                   |
| `password` | string | yes    | Min 6 characters                     |

**Sample request**

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Success** `201`

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": null
  },
  "token": "eyJ..."
}
```

**Errors**

| Status | Condition | Body example |
|--------|-----------|--------------|
| 400 | Validation (invalid email or short password) | `{ "success": false, "error": "Invalid email" }` |
| 400 | Email already registered | `{ "success": false, "error": "Email already registered" }` |

---

### `POST /api/auth/signin`

Sign in with email and password.

**Request body**

| Field     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `email`   | string | yes      | Valid email |
| `password` | string | yes    | User password |

**Sample request**

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Success** `200`

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": null
  },
  "token": "eyJ..."
}
```

**Errors**

| Status | Condition | Body example |
|--------|-----------|--------------|
| 400 | Validation (invalid body) | `{ "success": false, "error": "Invalid email" }` |
| 401 | Wrong email or password | `{ "success": false, "error": "Invalid email or password" }` |

---

### `GET /api/auth/me`

Return the current authenticated user. Requires valid JWT.

**Headers**

- `Authorization: Bearer <token>`

**Sample request**

```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success** `200`

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Optional Name"
  }
}
```

**Errors**

| Status | Condition | Body example |
|--------|-----------|--------------|
| 401 | Missing or invalid `Authorization` | `{ "success": false, "error": "Missing or invalid authorization" }` |
| 401 | Invalid or expired token | `{ "success": false, "error": "Invalid or expired token" }` |
| 404 | User not found (e.g. deleted) | `{ "success": false, "error": "User not found" }` |

---

### `PATCH /api/auth/me`

Update current user profile (name). Requires valid JWT.

**Headers:** `Authorization: Bearer <token>`

**Request body**

| Field | Type   | Required | Description                    |
|-------|--------|----------|--------------------------------|
| `name` | string \| null | no | Display name; max 255 chars; `null` to clear |

**Success** `200` — Same shape as `GET /api/auth/me`: `{ "success": true, "user": { "id", "email", "name" } }`.

**Errors:** 400 (validation), 401, 404.

---

### `POST /api/auth/change-password`

Change password. Requires valid JWT.

**Headers:** `Authorization: Bearer <token>`

**Request body**

| Field              | Type   | Required | Description        |
|--------------------|--------|----------|--------------------|
| `currentPassword`  | string | yes      | Current password   |
| `newPassword`      | string | yes      | Min 6 characters   |

**Success** `204` — No body.

**Errors**

| Status | Condition           | Body example |
|--------|--------------------|--------------|
| 400 | Validation (e.g. short new password) | `{ "success": false, "error": "New password must be at least 6 characters" }` |
| 401 | Wrong current password              | `{ "success": false, "error": "Current password is incorrect" }` |
| 404 | User not found                      | `{ "success": false, "error": "User not found" }` |

---

## JWT

- Payload: `sub` (user id), `email`. Expiry: 7 days.
- Send in header: `Authorization: Bearer <token>` for protected routes.

---

## Categories (Phase 2)

All category routes require auth: `Authorization: Bearer <token>`.

- **Predefined categories** have `userId: null` (e.g. Food, Transport, Bills). They are read-only; only **user categories** (`userId` set) can be updated or deleted.
- List returns predefined + current user’s categories. Get/update/delete enforce ownership for user categories.

---

### `GET /api/categories`

List predefined and current user’s categories.

**Sample request**

```http
GET /api/categories
Authorization: Bearer <token>
```

**Success** `200`

```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Food", "userId": null, "color": null, "icon": null },
    { "id": "uuid", "name": "My Category", "userId": "user-uuid", "color": "#ff0000", "icon": "tag" }
  ]
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid token |

---

### `GET /api/categories/:id`

Get one category by id. Predefined categories are visible to all; user categories only to the owner.

**Sample request**

```http
GET /api/categories/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Success** `200`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Food",
    "userId": null,
    "color": null,
    "icon": null
  }
}
```

**Errors**

| Status | Condition | Body example |
|--------|-----------|--------------|
| 400 | Invalid UUID | `{ "success": false, "error": "Invalid category id" }` |
| 401 | Missing or invalid token | `{ "success": false, "error": "..." }` |
| 404 | Not found or not allowed | `{ "success": false, "error": "Category not found" }` |

---

### `POST /api/categories`

Create a user category. Duplicate name per user is rejected.

**Request body**

| Field  | Type   | Required | Description              |
|--------|--------|----------|--------------------------|
| `name` | string | yes      | 1–100 characters         |
| `color`| string | no       | Max 20 characters        |
| `icon` | string | no       | Max 50 characters        |

**Sample request**

```json
{
  "name": "Groceries",
  "color": "#22c55e",
  "icon": "shopping-cart"
}
```

**Success** `201`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Category",
    "userId": "user-uuid",
    "color": "#00ff00",
    "icon": "tag"
  }
}
```

**Errors**

| Status | Condition | Body example |
|--------|-----------|--------------|
| 400 | Validation (name missing/long, etc.) | `{ "success": false, "error": "Name is required" }` |
| 400 | Duplicate name for this user | `{ "success": false, "error": "You already have a category with this name" }` |
| 401 | Missing or invalid token | `{ "success": false, "error": "..." }` |

---

### `PATCH /api/categories/:id`

Update a user category (partial). Predefined categories cannot be updated.

**Request body** (all optional)

| Field  | Type   | Description   |
|--------|--------|---------------|
| `name` | string | 1–100 chars   |
| `color`| string | Max 20        |
| `icon` | string | Max 50        |

**Sample request**

```http
PATCH /api/categories/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Groceries",
  "color": "#3b82f6"
}
```

**Success** `200`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "userId": "user-uuid",
    "color": "#0000ff",
    "icon": null
  }
}
```

**Errors**

| Status | Condition | Body example |
|--------|-----------|--------------|
| 400 | Invalid UUID or validation | `{ "success": false, "error": "Invalid category id" }` |
| 400 | Duplicate name for this user | `{ "success": false, "error": "You already have a category with this name" }` |
| 401 | Missing or invalid token | `{ "success": false, "error": "..." }` |
| 403 | Not your category | `{ "success": false, "error": "You can only update your own categories" }` |
| 404 | Category not found | `{ "success": false, "error": "Category not found" }` |

---

### `DELETE /api/categories/:id`

Delete a user category. Predefined categories cannot be deleted.

**Sample request**

```http
DELETE /api/categories/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Success** `204` (no body)

**Errors**

| Status | Condition | Body example |
|--------|-----------|--------------|
| 400 | Invalid UUID | `{ "success": false, "error": "Invalid category id" }` |
| 401 | Missing or invalid token | `{ "success": false, "error": "..." }` |
| 403 | Not your category | `{ "success": false, "error": "You can only delete your own categories" }` |
| 404 | Category not found | `{ "success": false, "error": "Category not found" }` |

---

## Expenses (Phase 3)

All expense routes require auth: `Authorization: Bearer <token>`. Only the current user’s expenses are visible. Soft-deleted expenses (`deletedAt` set) are excluded from list, summary, and export.

---

### `GET /api/expenses`

List current user’s expenses (excluding soft-deleted) with pagination and filters.

**Query**

| Param      | Type   | Default | Description                                    |
|------------|--------|---------|------------------------------------------------|
| `page`     | number | 1       | Page number                                   |
| `limit`    | number | 20      | Page size (1–100)                             |
| `from`     | string | —       | Start date (YYYY-MM-DD)                       |
| `to`       | string | —       | End date (YYYY-MM-DD)                         |
| `category` | string | —       | Exact category name                           |
| `minAmount`| number | —       | Minimum amount                                |
| `maxAmount`| number | —       | Maximum amount                                |
| `search`   | string | —       | Substring in description (case-insensitive)   |
| `sort`     | string | date    | `date` \| `amount` \| `category` \| `createdAt` |
| `order`    | string | desc    | `asc` \| `desc`                               |

**Sample request**

```http
GET /api/expenses?page=1&limit=20&from=2025-02-01&to=2025-02-28&sort=date&order=desc
Authorization: Bearer <token>
```

**Success** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2025-02-21",
      "amount": 25.5,
      "category": "Food",
      "description": "Lunch",
      "userId": "user-uuid",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3, "hasNext": true, "hasPrev": false }
}
```

---

### `GET /api/expenses/:id`

Get one expense. 404 if not found or not owner.

**Sample request**

```http
GET /api/expenses/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Success** `200` — same expense object as in list.

**Errors** — 400 (invalid UUID), 401, 404 (expense not found).

---

### `POST /api/expenses`

Create an expense. Category must exist (predefined or user’s).

**Body**

| Field        | Type   | Required | Description              |
|--------------|--------|----------|--------------------------|
| `date`       | string | yes      | YYYY-MM-DD               |
| `amount`     | number | yes      | > 0                      |
| `category`   | string | yes      | 1–100 chars; must exist  |
| `description`| string | no       | Max 5000 chars           |

**Sample request**

```json
{
  "date": "2025-02-21",
  "amount": 25.5,
  "category": "Food",
  "description": "Lunch at cafe"
}
```

**Success** `201` — `{ "success": true, "data": <expense> }`.

**Errors** — 400 (validation or category does not exist), 401.

---

### `PATCH /api/expenses/:id`

Partial update. Category if provided must exist.

**Body** — all optional: `date`, `amount`, `category`, `description` (same rules as create).

**Sample request**

```http
PATCH /api/expenses/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 30,
  "description": "Lunch and coffee"
}
```

**Success** `200` — `{ "success": true, "data": <expense> }`.

**Errors** — 400, 401, 404.

---

### `DELETE /api/expenses/:id`

Soft delete: sets `deletedAt`. Returns 204 no body.

**Sample request**

```http
DELETE /api/expenses/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Errors** — 400 (invalid UUID), 401, 404.

---

### `POST /api/expenses/:id/restore`

Clear `deletedAt` to restore the expense.

**Sample request**

```http
POST /api/expenses/550e8400-e29b-41d4-a716-446655440000/restore
Authorization: Bearer <token>
```

**Success** `200` — `{ "success": true, "data": <expense> }`.

**Errors** — 400, 401, 404.

---

### `POST /api/expenses/bulk`

Create up to 100 expenses in one request. Same validation as single create; each category must exist.

**Body**

| Field       | Type  | Description                    |
|-------------|-------|--------------------------------|
| `expenses`  | array | 1–100 items (date, amount, category, description?) |

**Sample request**

```json
{
  "expenses": [
    { "date": "2025-02-21", "amount": 10.5, "category": "Food", "description": "Morning snack" },
    { "date": "2025-02-21", "amount": 45, "category": "Transport", "description": "Train ticket" },
    { "date": "2025-02-22", "amount": 8, "category": "Food" }
  ]
}
```

**Success** `201` — `{ "success": true, "data": [ <expense>, ... ], "count": N }`.

**Errors** — 400 (validation, category not found, or > 100 items), 401.

---

### `GET /api/expenses/summary`

Aggregate total and count; optional grouping by period.

**Query** — `from`, `to` (YYYY-MM-DD, optional), `groupBy` (optional: `day` \| `week` \| `month`).

**Sample request**

```http
GET /api/expenses/summary?from=2025-02-01&to=2025-02-28&groupBy=week
Authorization: Bearer <token>
```

**Success** `200` (no groupBy):

```json
{
  "success": true,
  "data": { "total": 150.5, "count": 12 }
}
```

**Success** `200` (with groupBy):

```json
{
  "success": true,
  "data": {
    "total": 150.5,
    "count": 12,
    "byPeriod": [
      { "period": "2025-02-01", "total": 80, "count": 5 },
      { "period": "2025-02-08", "total": 70.5, "count": 7 }
    ]
  }
}
```

---

### `GET /api/expenses/summary/by-category`

Totals and counts per category.

**Query** — `from`, `to` (optional, YYYY-MM-DD).

**Sample request**

```http
GET /api/expenses/summary/by-category?from=2025-02-01&to=2025-02-28
Authorization: Bearer <token>
```

**Success** `200`

```json
{
  "success": true,
  "data": {
    "total": 150.5,
    "count": 12,
    "byCategory": [
      { "category": "Food", "total": 80, "count": 5 },
      { "category": "Transport", "total": 70.5, "count": 7 }
    ]
  }
}
```

---

### `GET /api/expenses/export`

Export expenses as CSV. Requires `format=csv`.

**Query** — `format=csv` (required), `from`, `to` (optional).

**Sample request**

```http
GET /api/expenses/export?format=csv&from=2025-02-01&to=2025-02-28
Authorization: Bearer <token>
```

**Success** `200` — `Content-Disposition: attachment; filename="expenses.csv"`, body: CSV with columns date, amount, category, description.

**Errors** — 400 (missing or invalid format), 401.

---

## Budgets (Phase 6)

All budget routes require auth. A budget has **category** (omit or `""` for overall), **year**, **month** (0 = yearly, 1–12 = month), and **limit**. Compare endpoint returns spending vs limit.

### `GET /api/budgets`

List current user’s budgets.

**Sample request:** `GET /api/budgets` with `Authorization: Bearer <token>`.

**Success** `200` — `{ "success": true, "data": [ { "id", "userId", "category?", "year", "month?", "limit" }, ... ] }`.

### `GET /api/budgets/:id`

Get one budget.

**Success** `200` — same shape.

### `POST /api/budgets`

Create a budget. **Body:** `category` (optional, `""` = overall), `year` (2000–2100), `month` (0 = yearly, 1–12), `limit` (positive number). Duplicate (user, category, year, month) returns 400.

**Sample request:** `{ "category": "Food", "year": 2025, "month": 2, "limit": 300 }`.

**Success** `201`.

### `PATCH /api/budgets/:id`

Update a budget (partial). **Body:** optional `category`, `year`, `month`, `limit`.

**Success** `200`.

### `DELETE /api/budgets/:id`

Delete a budget. **Success** `204`.

### `GET /api/budgets/:id/compare`

Spending vs limit for the budget’s period. **Success** `200` — `{ "success": true, "data": { "budget", "spending", "limit", "remaining", "percentUsed", "expenseCount" } }`.

---

## Recurring expenses (Phase 6)

All recurring routes require auth. **Frequency:** `day` \| `week` \| `month`. **POST /api/recurring/run** creates expense entries for all due recurring items (call from cron or manually).

### `GET /api/recurring`

List current user’s recurring expenses.

**Success** `200` — `{ "success": true, "data": [ { "id", "userId", "category", "amount", "description?", "frequency", "startDate", "nextRunAt", "lastRunAt?" }, ... ] }`.

### `GET /api/recurring/:id`

Get one recurring expense.

**Success** `200`.

### `POST /api/recurring`

Create a recurring expense. **Body:** `category`, `amount`, `description?`, `frequency` (day|week|month), `startDate` (YYYY-MM-DD). Category must exist.

**Sample request:** `{ "category": "Food", "amount": 15, "frequency": "week", "startDate": "2025-02-24" }`.

**Success** `201`.

### `PATCH /api/recurring/:id`

Update (partial). **Body:** optional `category`, `amount`, `description`, `frequency`, `startDate`. If `startDate` is updated, `nextRunAt` is set to the new start date.

**Success** `200`.

### `DELETE /api/recurring/:id`

Delete a recurring expense. **Success** `204`.

### `POST /api/recurring/run`

Create expense entries for all recurring items whose `nextRunAt` ≤ today; then advance `nextRunAt` by the frequency and set `lastRunAt`. Call from a cron job (e.g. daily) or manually.

**Success** `200` — `{ "success": true, "data": { "processed": N, "created": [ { "id", "date", "amount", "category" }, ... ] } }`.
