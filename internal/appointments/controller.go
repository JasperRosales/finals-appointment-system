package appointments

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	service *Service
}

func NewController(service *Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) GetDoctorSchedule(c *gin.Context) {
	date, ok := parseDateQuery(c)
	if !ok {
		return
	}

	schedule, err := ctrl.service.GetDoctorAvailability(c.Request.Context(), c.Param("doctorId"), date)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"availableSchedule": schedule})
}

func (ctrl *Controller) GetAvailableDoctors(c *gin.Context) {
	date, ok := parseDateQuery(c)
	if !ok {
		return
	}

	available, err := ctrl.service.GetAvailableDoctors(c.Request.Context(), date)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, available)
}

func (ctrl *Controller) CreateAppointment(c *gin.Context) {
	var req CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	appointment, err := ctrl.service.CreateAppointment(c.Request.Context(), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, appointment)
}

func (ctrl *Controller) CancelAppointment(c *gin.Context) {
	appointmentID, ok := parseAppointmentID(c)
	if !ok {
		return
	}

	appointment, err := ctrl.service.CancelAppointment(c.Request.Context(), appointmentID)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, appointment)
}

func (ctrl *Controller) RescheduleAppointment(c *gin.Context) {
	appointmentID, ok := parseAppointmentID(c)
	if !ok {
		return
	}

	var req RescheduleAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	appointment, err := ctrl.service.RescheduleAppointment(c.Request.Context(), appointmentID, req.AppointmentDate)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, appointment)
}

func parseDateQuery(c *gin.Context) (time.Time, bool) {
	dateValue := c.Query("date")
	date, err := time.Parse("2006-01-02", dateValue)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "date must use YYYY-MM-DD format"})
		return time.Time{}, false
	}

	return date, true
}

func parseAppointmentID(c *gin.Context) (uint, bool) {
	value := c.Param("id")
	id, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid appointment id"})
		return 0, false
	}

	return uint(id), true
}

func handleServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrDoctorNotFound), errors.Is(err, ErrPatientNotFound), errors.Is(err, ErrAppointmentNotFound):
		c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
	case errors.Is(err, ErrDoctorUnavailable), errors.Is(err, ErrAppointmentImmutable), errors.Is(err, ErrInvalidSchedule), errors.Is(err, ErrScheduleAlreadyPassed):
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
	default:
		c.JSON(http.StatusBadGateway, gin.H{"message": err.Error()})
	}
}
