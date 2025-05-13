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
		protected.POST("/link/ea", handlers.LinkEAAccount) // EA account linking endpoint
		protected.POST("/link/xbox", handlers.LinkXboxAccount) // Xbox account linking endpoint
		protected.POST("/link/playstation", handlers.LinkPlayStationAccount) // PlayStation account linking endpoint
		protected.POST("/link/riot", handlers.LinkRiotAccount) // Riot account linking endpoint
	}
	// User stats routes
	stats := r.Group("/user/stats")
	stats.Use(middleware.RequireAuth()) // Requires authentication
	{
		stats.POST("/save", handlers.SaveStatSelection) // Save selected game & platform
		stats.GET("/", handlers.GetUserStats)           // Fetch saved stat cards
		stats.DELETE("/:id", handlers.DeleteStatCard)   // Delete a stat card
	}
	// Friends routes
	friends := r.Group("/friends")
	friends.Use(middleware.RequireAuth()) // Requires authentication
	{
		friends.GET("/", handlers.GetFriends)                      // Get friends list
		friends.GET("/requests", handlers.GetFriendRequests)        // Get friend requests
		friends.POST("/request", handlers.SendFriendRequest)        // Send friend request
		friends.PUT("/request/:id", handlers.RespondToFriendRequest) // Accept/reject request
		friends.DELETE("/:id", handlers.RemoveFriend)              // Remove friend
		friends.GET("/search", handlers.SearchUsers)               // Search users to add
	}
	// Public test route for debugging
	r.GET("/friends-test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Friends test endpoint working"})
	})

	// Public stats routes
	r.GET("/api/stats/cs2", handlers.GetCS2Stats)
	r.GET("/api/stats/apex", handlers.GetApexStats) // Apex Legends stats from tracker.gg API
	r.GET("/api/stats/lol", handlers.GetLeagueOfLegendsStats) // League of Legends stats from Riot API
	r.GET("/api/stats/valorant", handlers.GetValorantStats) // Valorant stats from Riot API
}
