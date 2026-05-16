package appointments

import (
	"time"

	"github.com/JasperRosales/finals-appointment-system/internal/integrations/medical"
	"github.com/JasperRosales/finals-appointment-system/internal/integrations/notification"
)

func findDoctor(doctors []medical.Doctor, doctorID string) (medical.Doctor, bool) {
	for _, doctor := range doctors {
		if doctor.ID == doctorID {
			return doctor, true
		}
	}

	return medical.Doctor{}, false
}

func getAvailableSlots(busySlots map[string]struct{}, date time.Time) []string {
	available := make([]string, 0, 16)
	day := date.UTC()
	for hour := 9; hour < 17; hour++ {
		for _, minute := range []int{0, 30} {
			slot := time.Date(day.Year(), day.Month(), day.Day(), hour, minute, 0, 0, time.UTC)
			slotTime := slot.Format("15:04")
			if _, busy := busySlots[slotTime]; !busy {
				available = append(available, slotTime)
			}
		}
	}

	return available
}

func isValidSchedule(date time.Time) bool {
	utc := date.UTC()
	if utc.Second() != 0 || utc.Nanosecond() != 0 {
		return false
	}

	if utc.Minute() != 0 && utc.Minute() != 30 {
		return false
	}

	return utc.Hour() >= 9 && utc.Hour() <= 16
}

func canModifyScheduleUntilPreviousDay(now, appointmentDate time.Time) bool {
	currentDay := time.Date(now.UTC().Year(), now.UTC().Month(), now.UTC().Day(), 0, 0, 0, 0, time.UTC)
	appointmentDay := time.Date(appointmentDate.UTC().Year(), appointmentDate.UTC().Month(), appointmentDate.UTC().Day(), 0, 0, 0, 0, time.UTC)

	return currentDay.Before(appointmentDay)
}

func dayRangeUTC(date time.Time) (time.Time, time.Time) {
	start := time.Date(date.UTC().Year(), date.UTC().Month(), date.UTC().Day(), 0, 0, 0, 0, time.UTC)
	return start, start.Add(24 * time.Hour)
}

func toNotificationPayload(appointment Appointment) notification.AppointmentPayload {
	return notification.AppointmentPayload{
		ID:              appointment.ID,
		PatientID:       appointment.PatientID,
		DoctorID:        appointment.DoctorID,
		Department:      appointment.Department,
		AppointmentDate: appointment.AppointmentDate,
		Status:          appointment.Status,
	}
}
