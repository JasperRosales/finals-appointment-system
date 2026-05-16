package appointments

import "time"

const (
	StatusScheduled = "scheduled"
	StatusCancelled = "cancelled"
)

type Appointment struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	PatientID       string    `json:"patientId" gorm:"index;not null"`
	DoctorID        string    `json:"doctorId" gorm:"index;not null"`
	Department      string    `json:"department" gorm:"not null"`
	AppointmentDate time.Time `json:"appointmentDate" gorm:"index;not null"`
	Status          string    `json:"status" gorm:"index;not null"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type CreateAppointmentRequest struct {
	PatientID       string    `json:"patientId" binding:"required"`
	DoctorID        string    `json:"doctorId" binding:"required"`
	AppointmentDate time.Time `json:"appointmentDate" binding:"required"`
}

type RescheduleAppointmentRequest struct {
	AppointmentDate time.Time `json:"appointmentDate" binding:"required"`
}

type DoctorAvailability struct {
	DoctorID          string   `json:"doctorId"`
	DoctorName        string   `json:"doctorName"`
	Department        string   `json:"department"`
	AvailableSchedule []string `json:"availableSchedule"`
}
