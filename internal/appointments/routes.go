package appointments

import "github.com/gin-gonic/gin"

func RegisterRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc, controller *Controller) {
	api := router.Group("/api")
	api.Use(authMiddleware)
	{
		api.GET("/doctors/:doctorId/schedule", controller.GetDoctorSchedule)
		api.GET("/doctors/available", controller.GetAvailableDoctors)
		api.POST("/appointments", controller.CreateAppointment)
		api.PATCH("/appointments/:id/cancel", controller.CancelAppointment)
		api.PATCH("/appointments/:id/reschedule", controller.RescheduleAppointment)
	}
}
