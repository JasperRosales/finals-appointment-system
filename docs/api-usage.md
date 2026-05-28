# Finals Appointment System API Usage

## Base URL

Local:

```bash
http://localhost:8080
```

## Run the API

```bash
npm install
npm start
```

## Required Environment Variables

```env
PORT=8080
HOST=0.0.0.0
AUTH_BASE_URL=https://has-auth.onrender.com
MEDICAL_RECORDS_BASE_URL=<your-medical-records-service-url>
NOTIFICATION_BASE_URL=<your-notification-service-url>
ADAPTER_URL=<your-adapter-service-url>
```

Optional:

```env
NODE_ENV=development
HTTP_TIMEOUT_SECONDS=10
MEDICAL_RECORDS_DOCTORS_PATH=/doctors
MEDICAL_RECORDS_PATIENT_PATH_TEMPLATE=/patients/%s
NOTIFICATION_PATH=/api/notify
ADAPTER_APPOINTMENTS_GET_PATH_TEMPLATE=/api/adapter/appointments/%s
ADAPTER_APPOINTMENTS_PATIENT_PATH_TEMPLATE=/api/adapter/appointments/patient/%s
ADAPTER_APPOINTMENTS_DOCTOR_PATH_TEMPLATE=/api/adapter/appointments/doctor/%s
ADAPTER_APPOINTMENTS_CREATE_PATH=/api/adapter/appointments/create
ADAPTER_APPOINTMENTS_UPDATE_PATH_TEMPLATE=/api/adapter/appointments/%s
ADAPTER_APPOINTMENTS_CANCEL_PATH_TEMPLATE=/api/adapter/appointments/%s/cancel
```

## Health Check

```http
GET /health
```

## Public Endpoints (Auth Proxy)

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

**Content:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Secret123!"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

**Content:**
```json
{
  "email": "john@example.com",
  "password": "Secret123!"
}
```

Login returns a JWT token in the response. Use this token in the `Authorization` header for protected routes.

**Response:**
```json
{
  "message": "Login successful",
  "token": "YOUR_JWT_TOKEN"
}
```

### Logout

```http
POST /api/auth/logout
```

### Current User

```http
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

## Protected Endpoints

All protected routes require the JWT token via the `Authorization` header with `Bearer` token format:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Doctor Available Schedule by Date

```http
GET /api/doctors/:doctorId/schedule?date=YYYY-MM-DD
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Available Doctors by Date

```http
GET /api/doctors/available?date=YYYY-MM-DD
Authorization: Bearer YOUR_JWT_TOKEN
```

### Create Appointment

```http
POST /api/appointments
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Content:**
```json
{
  "patientId": "patient-1",
  "doctorId": "doc-1",
  "appointmentDate": "2026-05-20T10:00:00Z"
}
```

### Cancel Appointment

```http
PATCH /api/appointments/:id/cancel
Authorization: Bearer YOUR_JWT_TOKEN
```

### Reschedule Appointment

```http
PATCH /api/appointments/:id/reschedule
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Content:**
```json
{
  "appointmentDate": "2026-05-21T11:00:00Z"
}
```

## Bearer Token Flow with `curl`

Login and extract token:

```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Secret123!"}'
```

Response will contain your JWT token:
```json
{
  "message": "Login successful",
  "token": "YOUR_JWT_TOKEN"
}
```

Use the token in subsequent requests:

```bash
curl -X GET "http://localhost:8080/api/doctors/available?date=2026-05-20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Common Errors

- `400` invalid input, date, or schedule rules
- `401` missing or invalid token
- `404` route, doctor, patient, or appointment not found
- `409` double booking conflict
- `502` dependency service unavailable or malformed response
