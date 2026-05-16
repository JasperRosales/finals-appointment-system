package config

import (
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type Config struct {
	Host                              string
	Port                              string
	GinMode                           string
	DatabaseDSN                       string
	HTTPTimeout                       time.Duration
	AuthBaseURL                       string
	MedicalRecordsBaseURL             string
	MedicalRecordsDoctorsPath         string
	MedicalRecordsPatientPathTemplate string
	NotificationBaseURL               string
	NotificationPath                  string
}

func Load() Config {
	_ = godotenv.Load()

	return Config{
		Host:                              getEnv("HOST", ""),
		Port:                              getEnv("PORT", "8080"),
		GinMode:                           getEnv("GIN_MODE", gin.DebugMode),
		DatabaseDSN:                       getEnv("DATABASE_DSN", "appointments.db"),
		HTTPTimeout:                       getDurationFromSeconds("HTTP_TIMEOUT_SECONDS", 10),
		AuthBaseURL:                       getEnv("AUTH_BASE_URL", "https://has-auth.onrender.com"),
		MedicalRecordsBaseURL:             getEnv("MEDICAL_RECORDS_BASE_URL", ""),
		MedicalRecordsDoctorsPath:         getEnv("MEDICAL_RECORDS_DOCTORS_PATH", "/doctors"),
		MedicalRecordsPatientPathTemplate: getEnv("MEDICAL_RECORDS_PATIENT_PATH_TEMPLATE", "/patients/%s"),
		NotificationBaseURL:               getEnv("NOTIFICATION_BASE_URL", ""),
		NotificationPath:                  getEnv("NOTIFICATION_PATH", "/notifications/appointments"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}

	return fallback
}

func getDurationFromSeconds(key string, fallback int) time.Duration {
	value := getEnv(key, "")
	if value == "" {
		return time.Duration(fallback) * time.Second
	}

	seconds, err := strconv.Atoi(value)
	if err != nil || seconds <= 0 {
		return time.Duration(fallback) * time.Second
	}

	return time.Duration(seconds) * time.Second
}
