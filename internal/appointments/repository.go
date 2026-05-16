package appointments

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
)

func (s *Service) findAppointmentByID(ctx context.Context, appointmentID uint) (Appointment, error) {
	var appointment Appointment
	if err := s.db.WithContext(ctx).First(&appointment, appointmentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return Appointment{}, ErrAppointmentNotFound
		}

		return Appointment{}, err
	}

	return appointment, nil
}

func (s *Service) findBusySlotsByDoctorAndDate(ctx context.Context, doctorID string, date time.Time) (map[string]struct{}, error) {
	start, end := dayRangeUTC(date)
	var appointments []Appointment
	if err := s.db.WithContext(ctx).
		Where(
			"doctor_id = ? AND status = ? AND appointment_date >= ? AND appointment_date < ?",
			doctorID,
			StatusScheduled,
			start,
			end,
		).
		Find(&appointments).Error; err != nil {
		return nil, err
	}

	busy := make(map[string]struct{}, len(appointments))
	for _, appointment := range appointments {
		busy[appointment.AppointmentDate.UTC().Format("15:04")] = struct{}{}
	}

	return busy, nil
}

func (s *Service) isDoctorAvailableAt(ctx context.Context, doctorID string, date time.Time, excludedAppointmentID uint) (bool, error) {
	query := s.db.WithContext(ctx).
		Model(&Appointment{}).
		Where("doctor_id = ? AND status = ? AND appointment_date = ?", doctorID, StatusScheduled, date.UTC())

	if excludedAppointmentID > 0 {
		query = query.Where("id != ?", excludedAppointmentID)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count == 0, nil
}
