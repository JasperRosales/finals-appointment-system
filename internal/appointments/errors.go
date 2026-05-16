package appointments

import "errors"

var (
	ErrDoctorNotFound        = errors.New("doctor not found")
	ErrPatientNotFound       = errors.New("patient not found")
	ErrDoctorUnavailable     = errors.New("doctor is not available for this schedule")
	ErrAppointmentNotFound   = errors.New("appointment not found")
	ErrAppointmentImmutable  = errors.New("appointment can only be modified until the day before the schedule")
	ErrInvalidSchedule       = errors.New("appointment must be in 30-minute slots from 09:00 to 16:30 UTC")
	ErrScheduleAlreadyPassed = errors.New("appointment schedule must be in the future")
)
