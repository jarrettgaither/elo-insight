package handlers

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"

	"elo-insight/backend/database"
	"elo-insight/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"github.com/yohcop/openid-go"
)

func SteamLogin(c *gin.Context) {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("🚨 WARNING: Failed to load .env file. Using system environment variables.")
	}

	token := c.Query("token")
	if token == "" {
		log.Println("🚨 ERROR: Missing token in Steam login request")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get Steam OpenID info from env
	redirectURL := fmt.Sprintf("%s?token=%s", os.Getenv("STEAM_CALLBACK_URL"), url.QueryEscape(token))
	openIDURL := os.Getenv("STEAM_OPENID_URL")

	log.Println("🔍 Steam OpenID URL:", openIDURL)
	log.Println("🔍 Steam Callback URL:", redirectURL)

	// Make sure openid variables are set
	if openIDURL == "" || redirectURL == "" {
		log.Println("🚨 ERROR: Steam OpenID environment variables not set!")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Steam OpenID variables not set"})
		return
	}

	//Create OpenID Authentication URL using openid library
	authURL, err := openid.RedirectURL(openIDURL, redirectURL, "http://localhost:8080")
	log.Println(authURL)
	if err != nil {
		log.Println("🚨 ERROR: Failed to generate OpenID URL:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate OpenID URL"})
		return
	}

	log.Println("✅ Redirecting to Steam:", authURL)
	// Send an HTTP redirect to steam login
	c.Redirect(http.StatusFound, authURL)
}

// Steam openid callback
func SteamCallback(c *gin.Context) {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("🚨 WARNING: No .env file found, using system environment variables.")
	}

	// Get openid response from Steam
	query := c.Request.URL.Query()
	openIDResponse := query.Encode()

	log.Println("🔍 Received OpenID Response:", openIDResponse)

	// Verify Steam openid repsonse
	openIDURL := os.Getenv("STEAM_OPENID_URL")
	if openIDURL == "" {
		log.Println("🚨 ERROR: Missing STEAM_OPENID_URL in environment variables")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Missing STEAM_OPENID_URL"})
		return
	}

	// Extract JWT token from request headers
	tokenString := c.Query("token")
	if tokenString == "" {
		log.Println("🚨 ERROR: Missing token in Steam callback request")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Extract the claimed steam ID
	steamID := extractSteamID(c.Query("openid.claimed_id"))
	if steamID == "" {
		log.Println("🚨 ERROR: Failed to extract Steam ID from OpenID response")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Steam authentication failed"})
		return
	}

	log.Println("Steam Authentication Successful! Steam ID:", steamID)

	//Extract user ID from JWT token
	userID, err := extractUserIDFromToken(tokenString)
	if err != nil {
		log.Println("🚨 ERROR: Failed to extract user ID from token:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	log.Println("🔍 Associating Steam ID with User ID:", userID)

	// Update the user in the database to associate it with steam account
	var user models.User
	result := database.DB.First(&user, userID)
	if result.Error != nil {
		log.Println("🚨 ERROR: User not found:", result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.SteamID = steamID
	if err := database.DB.Save(&user).Error; err != nil {
		log.Println("🚨 ERROR: Failed to save Steam ID to user:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save Steam ID"})
		return
	}

	log.Println("✅ Steam ID successfully linked to user:", userID)

	// Redirect user to frontend
	frontendURL := os.Getenv("FRONTEND_URL")
	redirectTo := fmt.Sprintf("%s/profile", frontendURL)
	log.Println("✅ Redirecting user to:", redirectTo)
	c.Redirect(http.StatusFound, redirectTo)
}

func extractUserIDFromToken(tokenString string) (uint, error) {
	claims := jwt.MapClaims{}

	// Parse token and check if valid
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		return 0, fmt.Errorf("invalid or expired token")
	}

	userIDFloat, ok := claims["sub"].(float64)
	if !ok {
		return 0, fmt.Errorf("invalid token payload")
	}

	return uint(userIDFloat), nil
}

// Extracts Steam ID from openid `claimed_id`
func extractSteamID(claimedID string) string {
	if claimedID == "" {
		return ""
	}

	parsedURL, err := url.Parse(claimedID)
	if err != nil {
		log.Println("🚨 ERROR: Failed to parse Steam OpenID URL:", err)
		return ""
	}

	// Extract Steam ID from parsed url
	pathSegments := parsedURL.Path
	steamID := pathSegments[len("/openid/id/"):]
	return steamID
}
