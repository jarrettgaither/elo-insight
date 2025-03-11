package handlers

import (
	"log"
	"net/http"
	"os"
	"time"

	"elo-insight/backend/database"
	"elo-insight/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Function to load the JWT token for authentication from env
func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Println("🚨 WARNING: JWT_SECRET is not set! Using a default value (not secure).")
		secret = "default-secret-key" // ❗ Change this to a secure value in production!
	}
	return []byte(secret)
}

var jwtSecret = getJWTSecret()

// Function to register a new user
func Register(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil { //Bind the request data to the user model
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

	log.Println("Registering user:", user.Email, "Hashed Password:", user.Password)

	result := database.DB.Create(&user) //create user in database
	if result.Error != nil {
		log.Println("ERROR: Failed to create user in DB:", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	log.Println("✅ User registered successfully:", user.Email)
	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully!"})
}

// Function to login user and issue JWT token
func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil { //Bind the request data to the user model
		log.Println("ERROR: Invalid request data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Println("User attempting login:", input.Email)

	var user models.User
	result := database.DB.Where("email = ?", input.Email).First(&user) //find user in database
	if result.Error != nil {
		log.Println("ERROR: User not found for email:", input.Email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	log.Println("Stored password hash for user:", user.Password)
	log.Println("User entered password:", input.Password)

	if !user.CheckPassword(input.Password) { //check if password matches
		log.Println("ERROR: Password mismatch for user:", input.Email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token if matches
	token, err := generateJWT(user)
	if err != nil {
		log.Println("🚨 ERROR: Failed to generate JWT:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	log.Println("✅ User logged in successfully:", input.Email)
	c.JSON(http.StatusOK, gin.H{"token": token})
}

// Function to generate JWT Token
func generateJWT(user models.User) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := jwt.MapClaims{
		"sub": user.ID,
		"exp": expirationTime.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(jwtSecret)

	if err != nil {
		log.Println("🚨 ERROR: Failed to sign JWT:", err)
	} else {
		log.Println("✅ JWT generated successfully for:", user.Email)
	}

	return signedToken, err
}
