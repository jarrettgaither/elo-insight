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
	"github.com/yohcop/openid-go"
)

func SteamLogin(c *gin.Context) {

	// Get Steam OpenID info from env
	redirectURL := os.Getenv("STEAM_CALLBACK_URL")
	openIDURL := os.Getenv("STEAM_OPENID_URL")

	if openIDURL == "" || redirectURL == "" {
		log.Println("ERROR: Steam OpenID environment variables not set!")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Steam OpenID variables not set"})
		return
	}

	// Generate OpenID redirect URL
	authURL, err := openid.RedirectURL(openIDURL, redirectURL, "http://localhost:8080")
	if err != nil {
		log.Println("ERROR: Failed to generate OpenID URL:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate OpenID URL"})
		return
	}

	log.Println("Redirecting user to Steam:", authURL)
	c.Redirect(http.StatusFound, authURL)
}

func SteamCallback(c *gin.Context) {
	// ✅ Extract JWT from cookies (since Steam doesn’t send our cookies back)
	token, err := c.Cookie("token")
	if err != nil {
		log.Println("ERROR: Missing JWT cookie in Steam callback request")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// ✅ Extract user ID from JWT
	userID, err := extractUserIDFromToken(token)
	if err != nil {
		log.Println("ERROR: Invalid JWT token:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	// ✅ Extract Steam ID from OpenID response
	steamID := extractSteamID(c.Query("openid.claimed_id"))
	if steamID == "" {
		log.Println("ERROR: Failed to extract Steam ID from OpenID response")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Steam authentication failed"})
		return
	}

	log.Println("Steam Authentication Successful! Steam ID:", steamID)

	// ✅ Retrieve user from database
	var user models.User
	result := database.DB.First(&user, userID)
	if result.Error != nil {
		log.Println("ERROR: User not found:", result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// ✅ Store Steam ID in the database
	user.SteamID = steamID
	if err := database.DB.Save(&user).Error; err != nil {
		log.Println("ERROR: Failed to save Steam ID to user:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save Steam ID"})
		return
	}

	log.Println("Steam ID successfully linked to user:", userID)

	// ✅ Redirect user back to frontend profile page
	frontendURL := os.Getenv("FRONTEND_URL")
	redirectTo := fmt.Sprintf("%s/profile", frontendURL)
	log.Println("Redirecting user to:", redirectTo)
	c.Redirect(http.StatusFound, redirectTo)
}

// ✅ Extract User ID from JWT stored in Cookies
func extractUserIDFromToken(tokenString string) (uint, error) {
	claims := jwt.MapClaims{}

	// ✅ Parse JWT with claims
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		return 0, fmt.Errorf("invalid or expired token")
	}

	// ✅ Extract user ID
	userIDFloat, ok := claims["sub"].(float64)
	if !ok {
		return 0, fmt.Errorf("invalid token payload")
	}

	return uint(userIDFloat), nil
}

// ✅ Extract Steam ID from OpenID response
func extractSteamID(claimedID string) string {
	if claimedID == "" {
		return ""
	}

	parsedURL, err := url.Parse(claimedID)
	if err != nil {
		log.Println("ERROR: Failed to parse Steam OpenID URL:", err)
		return ""
	}

	steamID := parsedURL.Path[len("/openid/id/"):]
	return steamID
}
