package middleware

import (
	"elo-insight/backend/models"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

var jwtSecret []byte

func Init() {
	if err := godotenv.Load(); err != nil {
		log.Println("WARNING: No .env file found, using system environment variables.")
	}
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Println("WARNING: JWT_SECRET is not set! Using a default value (not secure).")
		secret = "default-secret-key"
	}
	jwtSecret = []byte(secret)
}

// RequireAuth is middleware to protect routes with JWT
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Debug logging for troubleshooting
		log.Printf("[DEBUG] Auth middleware triggered for path: %s", c.Request.URL.Path)

		// Extract and log headers for debugging
		log.Printf("[DEBUG] Authorization header: %s", c.GetHeader("Authorization"))
		log.Printf("[DEBUG] Cookie header: %s", c.GetHeader("Cookie"))

		tokenString := ExtractToken(c)
		if tokenString == "" {
			log.Printf("[DEBUG] No token found for request to: %s", c.Request.URL.Path)
			// Add CORS headers before aborting
			c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			log.Printf("[DEBUG] Invalid token: %v", err)
			// Add CORS headers before aborting
			c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		userID, ok := claims["sub"].(float64)
		if !ok {
			log.Printf("[DEBUG] Invalid token payload - sub claim missing or not a number")
			// Add CORS headers before aborting
			c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token payload"})
			c.Abort()
			return
		}

		// Attach user ID to the context
		c.Set("userID", uint(userID))
		c.Next()
	}
}

func ExtractToken(c *gin.Context) string {
	// Try to get token from HttpOnly cookie first
	token, err := c.Cookie("token")
	if err == nil {
		return token
	}

	// If not in cookie, try to get from Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		return authHeader[7:]
	}

	return ""
}

// Function to generate JWT Token
func GenerateJWT(user models.User) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := jwt.MapClaims{
		"sub": user.ID,
		"exp": expirationTime.Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(jwtSecret)
	if err != nil {
		log.Println("ERROR: Failed to sign JWT:", err)
	}
	return signedToken, err
}
