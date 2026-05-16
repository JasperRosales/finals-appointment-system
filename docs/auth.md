# HAS Authentication API Guide

Base URL:

```txt
https://has-auth.onrender.com/api
```

---

# Test Admin Account

```txt
Email: admin@gmail.com
Password: Admin123@
Role: admin
```

---

# Authentication Flow

```txt
Register → Login → Cookie Created → Access Protected Routes
```

The API uses:
- JWT
- HTTP-only Cookies
- Role-Based Access Control (RBAC)

---

# 1. Register User

## Route

```http
POST /auth/register
```

## Full URL

```txt
https://has-auth.onrender.com/api/auth/register
```

## Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@gmail.com",
  "password": "123456"
}
```

## Success Response

```json
{
  "message": "User created"
}
```

New users automatically receive the `patient` role.

---

# 2. Login User

## Route

```http
POST /auth/login
```

## Full URL

```txt
https://has-auth.onrender.com/api/auth/login
```

## Body

```json
{
  "email": "admin@gmail.com",
  "password": "Admin123@"
}
```

## Success Response

```json
{
  "message": "Login successful"
}
```

After login, the server automatically creates a secure authentication cookie.

---

# 3. Get All Users

Returns all registered users.

## Route

```http
GET /all
```

## Full URL

```txt
https://has-auth.onrender.com/api/all
```

## Success Response

```json
[
  {
    "id": "USER_ID",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@gmail.com",
    "role": "patient"
  }
]
```

---

# 4. Assign User Role (Admin Only)

Changes the role of a specific user.

## Route

```http
PATCH /users/:userId/role
```

## Full URL Example

```txt
https://has-auth.onrender.com/api/users/USER_ID/role
```

## Body

```json
{
  "role": "doctor"
}
```

## Allowed Roles

```txt
patient
doctor
staff
admin
```

Only admins can assign roles.

---

# Example Admin Flow

## Step 1 — Login

```http
POST https://has-auth.onrender.com/api/auth/login
```

```json
{
  "email": "admin@gmail.com",
  "password": "Admin123@"
}
```

---

## Step 2 — Assign Role

```http
PATCH https://has-auth.onrender.com/api/users/USER_ID/role
```

```json
{
  "role": "staff"
}
```

---

# Common Errors

## Invalid Token

```json
{
  "message": "Invalid or expired token"
}
```

---

## Access Denied

```json
{
  "message": "Access denied"
}
```

---

## Invalid Role

```json
{
  "message": "Invalid role"
}
```

---

## User Not Found

```json
{
  "message": "User not found"
}
```

---

# Current Roles

| Role | Access |
|---|---|
| patient | Basic access |
| doctor | Doctor access |
| staff | Staff access |
| admin | Full access |

---

# Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Supabase
- JWT
- Cookies
- Render