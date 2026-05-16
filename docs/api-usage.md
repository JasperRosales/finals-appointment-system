# Finals Appointment System API Usage

## Base URL

Local:

```bash
http://localhost:8080
```

## Start the API

```bash
go run ./cmd/server
```

## Required Environment Variables

```env
PORT=8080
DATABASE_DSN=appointments.db
AUTH_BASE_URL=https://has-auth.onrender.com
MEDICAL_RECORDS_BASE_URL=<your-medical-records-service-url>
NOTIFICATION_BASE_URL=<your-notification-service-url>
```

Optional:

```env
HOST=
GIN_MODE=debug
HTTP_TIMEOUT_SECONDS=10
MEDICAL_RECORDS_DOCTORS_PATH=/doctors
MEDICAL_RECORDS_PATIENT_PATH_TEMPLATE=/patients/%s
NOTIFICATION_PATH=/notifications/appointments
```

## Public Endpoints (Auth Proxy)

These routes are exposed by this API and forwarded to the auth service.

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Secret123!"
}
```

### Login (creates `token` cookie)

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "john@example.com",
  "password": "Secret123!"
}
```

### Logout

```http
POST /api/auth/logout
```

### Current User

```http
GET /api/auth/me
```

## Protected Endpoints (Require JWT Cookie)

All endpoints below require `token` cookie from login.

### 1) Get Doctor Available Schedule by Date

```http
GET /api/doctors/:doctorId/schedule?date=YYYY-MM-DD
```

Example:

```bash
curl -b cookies.txt "http://localhost:8080/api/doctors/doc-1/schedule?date=2026-05-20"
```

### 2) Get Available Doctors by Date

```http
GET /api/doctors/available?date=YYYY-MM-DD
```

Example:

```bash
curl -b cookies.txt "http://localhost:8080/api/doctors/available?date=2026-05-20"
```

### 3) Create Appointment

```http
POST /api/appointments
Content-Type: application/json
```

```json
{
  "patientId": "patient-1",
  "doctorId": "doc-1",
  "appointmentDate": "2026-05-20T10:00:00Z"
}
```

Example:

```bash
curl -b cookies.txt -X POST "http://localhost:8080/api/appointments" \
  -H "Content-Type: application/json" \
  -d '{"patientId":"patient-1","doctorId":"doc-1","appointmentDate":"2026-05-20T10:00:00Z"}'
```

### 4) Cancel Appointment

```http
PATCH /api/appointments/:id/cancel
```

Example:

```bash
curl -b cookies.txt -X PATCH "http://localhost:8080/api/appointments/1/cancel"
```

### 5) Reschedule Appointment

```http
PATCH /api/appointments/:id/reschedule
Content-Type: application/json
```

```json
{
  "appointmentDate": "2026-05-21T11:00:00Z"
}
```

Example:

```bash
curl -b cookies.txt -X PATCH "http://localhost:8080/api/appointments/1/reschedule" \
  -H "Content-Type: application/json" \
  -d '{"appointmentDate":"2026-05-21T11:00:00Z"}'
```

## Cookie-Based Flow with `curl`

Login and save cookie:

```bash
curl -c cookies.txt -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Secret123!"}'
```

Use saved cookie for protected routes:

```bash
curl -b cookies.txt "http://localhost:8080/api/doctors/available?date=2026-05-20"
```

Logout:

```bash
curl -b cookies.txt -X POST "http://localhost:8080/api/auth/logout"
```

## Common Error Responses

- `400` invalid input or invalid schedule rules
- `401` missing/invalid token
- `404` doctor/patient/appointment not found
- `502` dependency service unavailable (auth, medical records, notifications)
