package appointments

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/JasperRosales/finals-appointment-system/internal/integrations/medical"
	"github.com/JasperRosales/finals-appointment-system/internal/integrations/notification"
)

type MedicalRecordsClient interface {
	ListDoctors(ctx context.Context) ([]medical.Doctor, error)
	GetPatient(ctx context.Context, patientID string) (medical.Patient, error)
}

type NotificationClient interface {
	SendAppointmentEvent(ctx context.Context, event string, appointment notification.AppointmentPayload) error
}

type Service struct {
	db       *gorm.DB
	medical  MedicalRecordsClient
	notifier NotificationClient
	now      func() time.Time
}

func NewService(db *gorm.DB, medical MedicalRecordsClient, notifier NotificationClient, now func() time.Time) *Service {
	if now == nil {
		now = time.Now
	}

	return &Service{
		db:       db,
		medical:  medical,
		notifier: notifier,
		now:      now,
	}
}

func (s *Service) GetDoctorAvailability(ctx context.Context, doctorID string, date time.Time) ([]string, error) {
	doctors, err := s.medical.ListDoctors(ctx)
	if err != nil {
		return nil, err
	}

	if _, ok := findDoctor(doctors, doctorID); !ok {
		return nil, ErrDoctorNotFound
	}

	busySlots, err := s.findBusySlotsByDoctorAndDate(ctx, doctorID, date)
	if err != nil {
		return nil, err
	}

	return getAvailableSlots(busySlots, date), nil
}

func (s *Service) GetAvailableDoctors(ctx context.Context, date time.Time) ([]DoctorAvailability, error) {
	doctors, err := s.medical.ListDoctors(ctx)
	if err != nil {
		return nil, err
	}

	available := make([]DoctorAvailability, 0, len(doctors))
	for _, doctor := range doctors {
		busySlots, err := s.findBusySlotsByDoctorAndDate(ctx, doctor.ID, date)
		if err != nil {
			return nil, err
		}

		slots := getAvailableSlots(busySlots, date)
		if len(slots) == 0 {
			continue
		}

		available = append(available, DoctorAvailability{
			DoctorID:          doctor.ID,
			DoctorName:        doctor.Name,
			Department:        doctor.Department,
			AvailableSchedule: slots,
		})
	}

	return available, nil
}

func (s *Service) CreateAppointment(ctx context.Context, req CreateAppointmentRequest) (Appointment, error) {
	if !isValidSchedule(req.AppointmentDate) {
		return Appointment{}, ErrInvalidSchedule
	}
	if !req.AppointmentDate.UTC().After(s.now().UTC()) {
		return Appointment{}, ErrScheduleAlreadyPassed
	}

	if _, err := s.medical.GetPatient(ctx, req.PatientID); err != nil {
		if errors.Is(err, medical.ErrPatientNotFound) {
			return Appointment{}, ErrPatientNotFound
		}

		return Appointment{}, err
	}

	doctors, err := s.medical.ListDoctors(ctx)
	if err != nil {
		return Appointment{}, err
	}

	doctor, ok := findDoctor(doctors, req.DoctorID)
	if !ok {
		return Appointment{}, ErrDoctorNotFound
	}

	available, err := s.isDoctorAvailableAt(ctx, req.DoctorID, req.AppointmentDate, 0)
	if err != nil {
		return Appointment{}, err
	}
	if !available {
		return Appointment{}, ErrDoctorUnavailable
	}

	appointment := Appointment{
		PatientID:       req.PatientID,
		DoctorID:        req.DoctorID,
		Department:      doctor.Department,
		AppointmentDate: req.AppointmentDate.UTC(),
		Status:          StatusScheduled,
	}

	tx := s.db.WithContext(ctx).Begin()
	if err := tx.Create(&appointment).Error; err != nil {
		tx.Rollback()
		return Appointment{}, err
	}

	if err := s.notifier.SendAppointmentEvent(ctx, "created", toNotificationPayload(appointment)); err != nil {
		tx.Rollback()
		return Appointment{}, err
	}

	if err := tx.Commit().Error; err != nil {
		return Appointment{}, err
	}

	return appointment, nil
}

func (s *Service) CancelAppointment(ctx context.Context, appointmentID uint) (Appointment, error) {
	appointment, err := s.findAppointmentByID(ctx, appointmentID)
	if err != nil {
		return Appointment{}, err
	}

	if appointment.Status == StatusCancelled {
		return appointment, nil
	}
	if !canModifyScheduleUntilPreviousDay(s.now(), appointment.AppointmentDate) {
		return Appointment{}, ErrAppointmentImmutable
	}

	appointment.Status = StatusCancelled

	tx := s.db.WithContext(ctx).Begin()
	if err := tx.Save(&appointment).Error; err != nil {
		tx.Rollback()
		return Appointment{}, err
	}

	if err := s.notifier.SendAppointmentEvent(ctx, "cancelled", toNotificationPayload(appointment)); err != nil {
		tx.Rollback()
		return Appointment{}, err
	}

	if err := tx.Commit().Error; err != nil {
		return Appointment{}, err
	}

	return appointment, nil
}

func (s *Service) RescheduleAppointment(ctx context.Context, appointmentID uint, newDate time.Time) (Appointment, error) {
	if !isValidSchedule(newDate) {
		return Appointment{}, ErrInvalidSchedule
	}
	if !newDate.UTC().After(s.now().UTC()) {
		return Appointment{}, ErrScheduleAlreadyPassed
	}

	appointment, err := s.findAppointmentByID(ctx, appointmentID)
	if err != nil {
		return Appointment{}, err
	}

	if appointment.Status == StatusCancelled || !canModifyScheduleUntilPreviousDay(s.now(), appointment.AppointmentDate) {
		return Appointment{}, ErrAppointmentImmutable
	}

	available, err := s.isDoctorAvailableAt(ctx, appointment.DoctorID, newDate, appointment.ID)
	if err != nil {
		return Appointment{}, err
	}
	if !available {
		return Appointment{}, ErrDoctorUnavailable
	}

	appointment.AppointmentDate = newDate.UTC()
	appointment.Status = StatusScheduled

	tx := s.db.WithContext(ctx).Begin()
	if err := tx.Save(&appointment).Error; err != nil {
		tx.Rollback()
		return Appointment{}, err
	}

	if err := s.notifier.SendAppointmentEvent(ctx, "rescheduled", toNotificationPayload(appointment)); err != nil {
		tx.Rollback()
		return Appointment{}, err
	}

	if err := tx.Commit().Error; err != nil {
		return Appointment{}, err
	}

	return appointment, nil
}
