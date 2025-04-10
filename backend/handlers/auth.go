package handlers

import (
	"log"
	"net/http"

	"elo-insight/backend/database"
	"elo-insight/backend/middleware"
	"elo-insight/backend/models"

	"github.com/gin-gonic/gin"
)

// Function to register a new user
func Register(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		log.Println("ERROR: Invalid request data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password before storing
	if err := user.HashPassword(); err != nil {
		log.Println("ERROR: Password hashing failed:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing failed"})
		return
	}

	log.Println("Registering user:", user.Email)

	result := database.DB.Create(&user)
	if result.Error != nil {
		log.Println("ERROR: Failed to create user in DB:", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	log.Println("User registered successfully:", user.Email)
	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully!"})
}

// Function to login user and issue JWT token
func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("ERROR: Invalid request data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Println("User attempting login:", input.Email)

	var user models.User
	result := database.DB.Where("email = ?", input.Email).First(&user)
	if result.Error != nil {
		log.Println("ERROR: User not found for email:", input.Email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !user.CheckPassword(input.Password) {
		log.Println("ERROR: Password mismatch for user:", input.Email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateJWT(user)
	if err != nil {
		log.Println("ERROR: Failed to generate JWT:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	log.Println("User logged in successfully:", input.Email)

	// Send JWT as an HttpOnly cookie
	c.SetCookie("token", token, 86400, "/", "localhost", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
}

// Function to logout user
func Logout(c *gin.Context) {
	// Expire the token cookie by setting MaxAge to -1
	c.SetCookie("token", "", -1, "/", "localhost", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logout successful"})
}
