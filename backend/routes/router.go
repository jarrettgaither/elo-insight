package routes

import (
	"elo-insight/backend/handlers"
	"elo-insight/backend/middleware"

	"github.com/gin-gonic/gin"
)

// Setups up routes for the application
func SetupRoutes(r *gin.Engine) {
	// Auth routes (Public)
	auth := r.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.GET("/steam/login", handlers.SteamLogin)
		auth.GET("/steam/callback", handlers.SteamCallback)
	}

	// User routes (Protected)
	userRoutes := r.Group("/user")
	userRoutes.Use(middleware.RequireAuth())
	{
		userRoutes.GET("/profile", handlers.GetProfile)
	}
	r.GET("/api/stats/cs2", handlers.GetCS2Stats)
}
