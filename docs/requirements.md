# Appointment Scheduling System Requirements

## Functional Requirements

### Schedule Management
- The system must be able to fetch the available schedule for a specific doctor.
- The system must be able to fetch the available doctors on a specific date.

### Appointment Management
- The system must be able to schedule a new appointment.
- The system must validate the availability of the doctor before scheduling a new appointment.
- The system must prevent double booking for each doctor.
- The system must allow cancellation and rescheduling of an appointment until the day before the scheduled appointment.

### Notification Handling
- Upon creation, cancellation, or rescheduling of an appointment, the system must trigger the Notification System for custom notifications.

### Security and Authorization
- The system must not process requests from unauthorized users.

---

# Integration Requirements

### Medical Record Management System
- The system must retrieve data from the Medical Record Management System.

### Legacy System Integration
- The system must connect to the Legacy System through an Adapter Layer for appointment-related tasks and data.
- The system must not directly access the Legacy System.
- Any updates in the data must be reflected in the Legacy System.

### Authentication and Authorization
- The system must use the Authentication and Authorization System for login and identity verification.

### Notification System
- The system must trigger the Notification System to send notifications.

---

# Constraints

- The system must be independent.
- The system must handle errors properly if integrated systems are unavailable or malfunctioning.
- The system must not directly access the Legacy System.
- Any updates in the data must be synchronized with the Legacy System.