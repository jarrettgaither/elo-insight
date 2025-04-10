package database

import (
	"fmt"
	"log"
	"os"

	"elo-insight/backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() { //Create postgres gorm connection string
	dbVars := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", //create
		os.Getenv("DB_HOST"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"), os.Getenv("DB_PORT"))

	db, err := gorm.Open(postgres.Open(dbVars), &gorm.Config{}) //connect to database
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations in case user model has changed
	err = db.AutoMigrate(&models.User{}, &models.UserStat{})
	if err != nil {
		log.Fatal("Migration failed:", err)
	}

	DB = db
	fmt.Println("Database connected successfully!")
}
