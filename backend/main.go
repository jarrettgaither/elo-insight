package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"

	"elo-insight/backend/database"
	"elo-insight/backend/middleware"
	"elo-insight/backend/routes"
)

func main() {

	middleware.Init() // Load environment variables

	// Connect to the database
	database.ConnectDB()

	// Create a new router
	r := gin.Default()

	// Set up CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Set up routes AFTER applying CORS
	routes.SetupRoutes(r)

	for _, route := range r.Routes() {
		log.Println("Registered Route:", route.Method, route.Path)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("🚀 Server running on port:", port)
	log.Fatal(r.Run(":" + port))
}
