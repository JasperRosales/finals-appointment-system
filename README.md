
# Finals Appointment System

Express + JavaScript appointment API for the integrated HAS services.

## Run

```bash
npm install
npm start
```

## Environment

Copy `.sample.env` to `.env` and set the service URLs:

- `AUTH_BASE_URL`
- `MEDICAL_RECORDS_BASE_URL`
- `NOTIFICATION_BASE_URL`
- `ADAPTER_URL`

## Notes

- The system is adapter-driven; appointment writes go through the adapter layer.
- No local database is used.
- Protected routes require the auth cookie or bearer token from the auth service.
