package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"elo-insight/backend/database"
	"elo-insight/backend/routes"
)

func main() {
	// Load environment variables
	err := os.Getenv("JWT_SECRET")
	if err == "" {
		log.Println("Warning: No JWT_SECRET found in .env")
	}

	// Connect to the database
	database.ConnectDB()

	// Create a new router
	r := gin.Default()

	// Configure CORS, make sure to allow requests from the frontend server
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // ✅ Allow frontend requests
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

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
