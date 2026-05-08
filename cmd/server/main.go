package main

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		panic(err)
	}

	gin.SetMode(getEnv("GIN_MODE", gin.DebugMode))

	host := getEnv("HOST", "")
	port := getEnv("PORT", "8080")

	router := gin.Default()

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Gin server is running",
		})
	})

	if err := router.Run(host + ":" + port); err != nil {
		panic(err)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}
