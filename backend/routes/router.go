package routes

import (
	"elo-insight/backend/handlers"
	"elo-insight/backend/middleware"

	"github.com/gin-gonic/gin"
)

// Set up routes for the application
func SetupRoutes(r *gin.Engine) {
	// Auth routes (Public)
	auth := r.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.GET("/steam/callback", handlers.SteamCallback)
		auth.GET("/riot/callback", handlers.RiotCallback)
		auth.POST("/logout", handlers.Logout)
	}
	// Protected routes (Requires JWT)
	protected := r.Group("/")
	protected.Use(middleware.RequireAuth())
	{
		protected.GET("/user/profile", handlers.GetProfile)
		protected.GET("/steam/login", handlers.SteamLogin)
		protected.GET("/riot/login", handlers.RiotLogin)
		protected.POST("/ea/link", handlers.LinkEAAccount) // Add EA account linking endpoint
	}
	// User stats routes
	stats := r.Group("/user/stats")
	stats.Use(middleware.RequireAuth()) // Requires authentication
	{
		stats.POST("/save", handlers.SaveStatSelection) // Save selected game & platform
		stats.GET("/", handlers.GetUserStats)           // Fetch saved stat cards
		stats.DELETE("/:id", handlers.DeleteStatCard)   // Delete a stat card
	}
	// Public stats routes
	r.GET("/api/stats/cs2", handlers.GetCS2Stats)
	r.GET("/api/stats/apex", handlers.GetApexStats) // Apex Legends stats from tracker.gg API
}
