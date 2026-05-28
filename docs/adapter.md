
# HAS Adapter Layer

The **HAS Adapter Layer** is a middleware service that bridges a modern healthcare application with a legacy hospital appointment system. It translates modern API data formats into legacy system schemas and vice versa, enabling seamless communication between the two systems while enforcing strict Role-Based Access Control (RBAC).

---

## 🚀 Base URL

All Adapter Layer API requests should be prefixed with the following base URL:

```text
https://has-adapter-layer.onrender.com/api/adapter

```

---

## 🔐 Authentication & Authorization

All Adapter Layer endpoints require a Bearer token in the `Authorization` header:

```text
Authorization: Bearer <your_token>

```

To obtain this token, you must log in via the central **Authentication and Authorization System**. You can read the full documentation in its [GitHub repository](https://github.com/John-Patrick-Russel-Lalo/authentication-and-authorization.git), or refer to the quick guide below.

### Test Admin Account

You can use the following credentials to test admin access (which grants access to all routes):

```text
Email: admin@gmail.com
Password: Admin123@
Role: admin

```

### Authentication API Flow

```text
Register → Login → Cookie/Token Created → Access Protected Adapter Routes

```

The Auth API utilizes JWT, HTTP-only Cookies, and Role-Based Access Control (RBAC).

**Base Auth URL:** `https://has-auth.onrender.com/api`

#### 1. Login User (Obtain Auth Token)

* **Method:** `POST`
* **URL:** `https://has-auth.onrender.com/api/auth/login`
* **Body (JSON):**
```json
{
  "email": "admin@gmail.com",
  "password": "Admin123@"
}

```



*(Upon success, the server automatically creates a secure authentication cookie / token).*

#### 2. Register New User (Defaults to 'Patient' role)

* **Method:** `POST`
* **URL:** `https://has-auth.onrender.com/api/auth/register`
* **Body (JSON):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@gmail.com",
  "password": "123456"
}

```



#### 3. Assign User Role (Admin Only)

* **Method:** `PATCH`
* **URL:** `https://has-auth.onrender.com/api/users/:userId/role`
* **Body (JSON):**
```json
{
  "role": "doctor"
}

```



*(Allowed Roles: `patient`, `doctor`, `staff`, `admin`)*

#### 4. Get All Users (Find User IDs)

* **Method:** `GET`
* **URL:** `https://has-auth.onrender.com/api/all`

---

## 🧪 Testing Guide: Adapter Layer API Endpoints

Use the following Postman setups to test the core Adapter Layer endpoints. Ensure your `Authorization: Bearer <token>` header is set for all requests.

### 🧑‍⚕️ Patients

#### Create Patient

* **Method:** `POST`
* **URL:** `/patients/create`
* **Headers:** `Content-Type: application/json`
* **Body (JSON):**
```json
{
  "firstName": "Moscov",
  "lastName": "Dela Cruz",
  "dob": "1985-03-15",
  "streetAddress": "123 Rizal Avenue, Barangay 4",
  "city": "Balayan",
  "contactNumber": "0917-123-4567"
}

```



#### Get All Patients

* **Method:** `GET`
* **URL:** `/patients`

#### Get Patient by ID

* **Method:** `GET`
* **URL:** `/patients/69b6947d833e04011f7406bd`

---

### 📅 Appointments

#### Create Appointment

* **Method:** `POST`
* **URL:** `/appointments/create`
* **Headers:** `Content-Type: application/json`
* **Body (JSON):**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "doctor": "Dr. Santos",
  "dept": "Cardiology",
  "date": "2026-06-01",
  "status": "Scheduled"
}

```



#### Get Patient Appointments

* **Method:** `GET`
* **URL:** `/appointments/patient/69b6947d833e04011f7406bd`

---

### 🩺 Consultations

#### Create Consultation

* **Method:** `POST`
* **URL:** `/consultations/create`
* **Headers:** `Content-Type: application/json`
* **Body (JSON):**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "appointmentId": "609a2b3c4f5a6b7c8d9e0f01",
  "clinicalFinding": "Patient presents with mild chest pain",
  "rx": "Aspirin 100mg, Metoprolol 25mg",
  "doctorNotes": "Follow up in 2 weeks"
}

```



#### Get Consultation History

* **Method:** `GET`
* **URL:** `/consultations/history/69b6947d833e04011f7406bd`

---

### 💳 Billing

#### Create Billing Record

* **Method:** `POST`
* **URL:** `/billing/create`
* **Headers:** `Content-Type: application/json`
* **Body (JSON):**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "description": "Cardiology consultation",
  "cost": 150.00,
  "issuedDate": "2026-05-16",
  "status": "Unpaid"
}

```



#### Get Billing History

* **Method:** `GET`
* **URL:** `/billing/history/69b6947d833e04011f7406bd`

#### Mark Billing as Paid

* **Method:** `PUT`
* **URL:** `/billing/69b6947d833e04011f7406bd/mark-paid`

---

## 📦 Response Format

All responses from the Adapter Layer follow a standardized JSON structure:

**Success Response:**

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}

```

**Error Response:**

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}

```

---

## 🚦 Common Status Codes & Errors

| Code | Status | Description | Example Cause |
| --- | --- | --- | --- |
| **200** | OK | Request succeeded. | Data was successfully fetched or updated. |
| **201** | Created | Resource successfully created. | A new patient or appointment was added. |
| **400** | Bad Request | Validation error. | Missing required fields in the JSON body. |
| **401** | Unauthorized | Authentication failed. | Missing token or `Invalid or expired token`. |
| **403** | Forbidden | Authorization failed. | `Access denied` or `Invalid role` (e.g., patient trying to access billing). |
| **404** | Not Found | Resource does not exist. | `User not found` or incorrect ID provided. |
| **500** | Server Error | Internal Server Error. | Legacy system timeout or database failure. |

```

```