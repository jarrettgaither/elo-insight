package database

import (
	"fmt"
	"log"
	"os"

	"elo-insight/backend/models"


	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() { 
	// Create postgres gorm connection string
	dbVars := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"), os.Getenv("DB_PORT"))

	// Connect to database with enhanced logging for development
	db, err := gorm.Open(postgres.Open(dbVars), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // Enhanced logging for development
	}) 
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}


	// Run migrations for all models
	err = db.AutoMigrate(&models.User{}, &models.UserStat{}, &models.Friendship{})
	if err != nil {
		log.Fatal("Migration failed:", err)
	}

	DB = db
	
	// Initialize OpenTelemetry tracing for database operations
	InitTracing()
	
	fmt.Println("Database connected successfully with tracing enabled!")
}
