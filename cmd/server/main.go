package main

import (
	"log"
	"net/http"
	"time"

	"github.com/JasperRosales/finals-appointment-system/internal/appointments"
	"github.com/JasperRosales/finals-appointment-system/internal/auth"
	"github.com/JasperRosales/finals-appointment-system/internal/config"
	"github.com/JasperRosales/finals-appointment-system/internal/database"
	"github.com/JasperRosales/finals-appointment-system/internal/integrations/medical"
	"github.com/JasperRosales/finals-appointment-system/internal/integrations/notification"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	gin.SetMode(cfg.GinMode)

	router := gin.Default()
	router.SetTrustedProxies(nil)

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Finals Appointment Scheduling API",
		})
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	db, err := database.Open(cfg.DatabaseDSN)
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	if err := db.AutoMigrate(&appointments.Appointment{}); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	httpClient := &http.Client{Timeout: cfg.HTTPTimeout}
	authClient := auth.NewClient(httpClient, cfg.AuthBaseURL)
	auth.RegisterPublicRoutes(router, authClient)

	medicalClient := medical.NewClient(
		httpClient,
		cfg.MedicalRecordsBaseURL,
		cfg.MedicalRecordsDoctorsPath,
		cfg.MedicalRecordsPatientPathTemplate,
	)
	notifier := notification.NewClient(httpClient, cfg.NotificationBaseURL, cfg.NotificationPath)
	service := appointments.NewService(db, medicalClient, notifier, time.Now)
	controller := appointments.NewController(service)

	appointments.RegisterRoutes(router, auth.Middleware(authClient), controller)

	if err := router.Run(cfg.Host + ":" + cfg.Port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
