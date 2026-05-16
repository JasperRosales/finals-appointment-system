package auth

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

const ContextUserKey = "authenticatedUser"

func Middleware(verifier Verifier) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("token")
		if err != nil || token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "No token provided"})
			c.Abort()
			return
		}

		user, err := verifier.Verify(c.Request.Context(), token)
		if err != nil {
			statusCode := http.StatusUnauthorized
			message := "Invalid or expired token"
			if !errors.Is(err, ErrUnauthorized) {
				statusCode = http.StatusBadGateway
				message = err.Error()
			}

			c.JSON(statusCode, gin.H{"message": message})
			c.Abort()
			return
		}

		c.Set(ContextUserKey, user)
		c.Next()
	}
}
