package auth

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterPublicRoutes(router *gin.Engine, client *Client) {
	authGroup := router.Group("/api/auth")
	{
		authGroup.POST("/register", func(c *gin.Context) {
			payload, err := io.ReadAll(c.Request.Body)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
				return
			}

			status, body, err := client.Register(c.Request.Context(), payload)
			if err != nil {
				c.JSON(http.StatusBadGateway, gin.H{"message": err.Error()})
				return
			}

			c.Data(status, "application/json", body)
		})

		authGroup.POST("/login", func(c *gin.Context) {
			payload, err := io.ReadAll(c.Request.Body)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
				return
			}

			token, status, body, err := client.Login(c.Request.Context(), payload)
			if err != nil {
				c.JSON(http.StatusBadGateway, gin.H{"message": err.Error()})
				return
			}

			if status < http.StatusOK || status >= http.StatusMultipleChoices {
				c.Data(status, "application/json", body)
				return
			}

			c.SetCookie("token", token, 24*60*60, "/", "", false, true)
			c.Data(status, "application/json", body)
		})

		authGroup.POST("/logout", func(c *gin.Context) {
			token, _ := c.Cookie("token")
			if _, _, err := client.Logout(c.Request.Context(), token); err != nil {
				c.JSON(http.StatusBadGateway, gin.H{"message": err.Error()})
				return
			}

			c.SetCookie("token", "", -1, "/", "", false, true)
			c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
		})

		authGroup.GET("/me", Middleware(client), func(c *gin.Context) {
			user, ok := c.Get(ContextUserKey)
			if !ok {
				c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid or expired token"})
				return
			}

			c.JSON(http.StatusOK, gin.H{"user": user})
		})
	}
}
