# TraceX API — Postman Testing Guide

Base URL (local): **`http://localhost:3000`**  
Use **`/api`** or **`/api/v1`** for all API routes below.

---

## Environment variables (Postman)

| Variable   | Example / Description                    |
|-----------|------------------------------------------|
| `baseUrl` | `http://localhost:3000`                  |
| `token`   | Set from **Sign in** response (see below) |

After **Sign in**, copy `data.access_token` into `token`. Use `{{token}}` in the **Authorization** header for protected requests.

---

## 1. Health

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `{{baseUrl}}/health` | No | Health check |

**Example:** `GET http://localhost:3000/health`

---

## 2. Auth

### Sign up
- **Method:** POST  
- **URL:** `{{baseUrl}}/api/auth/signup`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
- **Response:** `201` — `{ success, data: { user: { id, email, name }, access_token } }`. Save `data.access_token` as `token`.

### Sign in
- **Method:** POST  
- **URL:** `{{baseUrl}}/api/auth/signin`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
- **Response:** `200` — `{ success, data: { user, access_token } }`. Save `data.access_token` as `token`.

### Current user (me)
- **Method:** GET  
- **URL:** `{{baseUrl}}/api/auth/me`  
- **Headers:** `Authorization: Bearer {{token}}`  
- **Response:** `200` — `{ success, data: { id, email, name } }`

---

## 3. Categories

All require **`Authorization: Bearer {{token}}`**.

### List categories
- **Method:** GET  
- **URL:** `{{baseUrl}}/api/categories`  
- **Response:** `200` — `{ success, data: [ { id, name, color?, icon?, userId? }, ... ] }`

### Get category by ID
- **Method:** GET  
- **URL:** `{{baseUrl}}/api/categories/{{categoryId}}`  
- **Response:** `200` — single category

### Create category
- **Method:** POST  
- **URL:** `{{baseUrl}}/api/categories`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
```json
{
  "name": "Subscriptions",
  "color": "#8b5cf6",
  "icon": "credit-card"
}
```
- **Response:** `201` — created category

### Update category
- **Method:** PATCH  
- **URL:** `{{baseUrl}}/api/categories/{{categoryId}}`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):** partial, e.g. `{ "name": "New name", "color": "#000" }`  
- **Response:** `200` — updated category

### Delete category
- **Method:** DELETE  
- **URL:** `{{baseUrl}}/api/categories/{{categoryId}}`  
- **Response:** `204` No Content

---

## 4. Expenses

All require **`Authorization: Bearer {{token}}`**. Use category **names** from predefined or your categories (e.g. `Food`, `Transport`).

### List expenses
- **Method:** GET  
- **URL:** `{{baseUrl}}/api/expenses`  
- **Query params (optional):**

| Param      | Example    | Description        |
|------------|------------|--------------------|
| page       | 1          | Page number        |
| limit      | 20         | Page size (max 100) |
| from       | 2025-02-01 | Date from (inclusive) |
| to         | 2025-02-28 | Date to (inclusive) |
| category   | Food       | Filter by category |
| minAmount  | 0          | Min amount         |
| maxAmount  | 1000       | Max amount         |
| search     | lunch      | Search in description |
| sort       | date       | date \| amount \| createdAt |
| order      | desc       | asc \| desc        |

- **Example URL:** `{{baseUrl}}/api/expenses?page=1&limit=10&sort=date&order=desc`  
- **Response:** `200` — `{ success, data: [...], pagination: { page, limit, total, totalPages } }`

### Get expense by ID
- **Method:** GET  
- **URL:** `{{baseUrl}}/api/expenses/{{expenseId}}`  
- **Response:** `200` — single expense

### Create expense
- **Method:** POST  
- **URL:** `{{baseUrl}}/api/expenses`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
```json
{
  "date": "2025-02-21",
  "amount": 29.99,
  "category": "Food",
  "description": "Lunch at cafe"
}
```
- **Response:** `201` — created expense (save `data.id` as `expenseId` for later requests)

### Bulk create expenses
- **Method:** POST  
- **URL:** `{{baseUrl}}/api/expenses/bulk`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
```json
{
  "expenses": [
    { "date": "2025-02-20", "amount": 15, "category": "Food", "description": "Breakfast" },
    { "date": "2025-02-21", "amount": 50, "category": "Transport" }
  ]
}
```
- **Response:** `201` — `{ success, data: [...], count }` (max 100 items)

### Update expense
- **Method:** PATCH  
- **URL:** `{{baseUrl}}/api/expenses/{{expenseId}}`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):** partial, e.g. `{ "amount": 35, "description": "Updated" }`  
- **Response:** `200` — updated expense

### Restore expense (soft-deleted)
- **Method:** POST  
- **URL:** `{{baseUrl}}/api/expenses/{{expenseId}}/restore`  
- **Response:** `200` — restored expense

### Delete expense (soft delete)
- **Method:** DELETE  
- **URL:** `{{baseUrl}}/api/expenses/{{expenseId}}`  
- **Response:** `204` No Content

---

## 5. Summary & Export

Require **`Authorization: Bearer {{token}}`**.

### Summary by period
- **Method:** GET  
- **URL:** `{{baseUrl}}/api/expenses/summary`  
- **Query (optional):** `from`, `to` (dates), `groupBy` = `day` \| `week` \| `month`  
- **Example:** `{{baseUrl}}/api/expenses/summary?from=2025-02-01&to=2025-02-28&groupBy=month`  
- **Response:** `200` — `{ success, data: { total, count, byPeriod? } }`

### Summary by category
- **Method:** GET  
- **URL:** `{{baseUrl}}/api/expenses/summary/by-category`  
- **Query (optional):** `from`, `to`  
- **Example:** `{{baseUrl}}/api/expenses/summary/by-category?from=2025-02-01&to=2025-02-28`  
- **Response:** `200` — `{ success, data: { total, count, byCategory: [ { category, total, count }, ... ] } }`

### Export CSV
- **Method:** GET  
- **URL:** `{{baseUrl}}/api/expenses/export`  
- **Query (optional):** `from`, `to`, `format=csv`  
- **Example:** `{{baseUrl}}/api/expenses/export?from=2025-02-01&to=2025-02-28`  
- **Response:** `200` — CSV file (download)

---

## Suggested test flow

1. **Health** — `GET /health`  
2. **Sign up** — `POST /api/auth/signup` (or use existing user)  
3. **Sign in** — `POST /api/auth/signin` → copy `access_token` to `token`  
4. **Me** — `GET /api/auth/me` with `Authorization: Bearer {{token}}`  
5. **List categories** — `GET /api/categories`  
6. **Create expense** — `POST /api/expenses` (use a category name from step 5)  
7. **List expenses** — `GET /api/expenses`  
8. **Summary** — `GET /api/expenses/summary`, `GET /api/expenses/summary/by-category`  
9. **Export** — `GET /api/expenses/export`  

---

## Import Postman collection

Import the file **`postman/TraceX-API.postman_collection.json`** into Postman, then create an environment with:

- `baseUrl` = `http://localhost:3000`  
- `token` = (leave empty; set after Sign in or use “Tests” script to auto-save token)  

The collection includes the same requests as above, with `{{baseUrl}}` and `{{token}}` variables.
