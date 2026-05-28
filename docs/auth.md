# HAS Authentication API Guide

Base URL:

```txt
https://has-auth.onrender.com/api
```

JWT_SECRET:
```
JWT_SECRET=wkzg15151515@
```
jwt secret for verifying the token.


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
Register → Login → Receive JWT Token → Access Protected Routes
```

The API uses:

* JWT
* Bearer Token Authentication
* Role-Based Access Control (RBAC)

---

# Authorization Header Format

Protected routes require a JWT token in the request headers.

```http
Authorization: Bearer YOUR_TOKEN
```

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
  "message": "Login successful",
  "token": "YOUR_JWT_TOKEN"
}
```

After login, the API returns a JWT token that must be included in protected requests.

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

## Headers

```http
Authorization: Bearer YOUR_TOKEN
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

## Headers

```http
Authorization: Bearer YOUR_TOKEN
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

## Response

```json
{
  "message": "Login successful",
  "token": "YOUR_JWT_TOKEN"
}
```

---

## Step 2 — Use Token

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Step 3 — Assign Role

```http
PATCH https://has-auth.onrender.com/api/users/USER_ID/role
```

```json
{
  "role": "staff"
}
```

---

# Frontend Example

## Store Token

```js
localStorage.setItem("token", data.token);
```

---

## Send Token

```js
const token = localStorage.getItem("token");

fetch("https://has-auth.onrender.com/api/all", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
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

| Role    | Access        |
| ------- | ------------- |
| patient | Basic access  |
| doctor  | Doctor access |
| staff   | Staff access  |
| admin   | Full access   |

---

# Tech Stack

* Node.js
* Express.js
* PostgreSQL
* Supabase
* JWT
* Render