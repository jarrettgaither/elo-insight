package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"

	"elo-insight/backend/database"
	"elo-insight/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// RiotLogin redirects the user to the Riot OpenID authentication page
func RiotLogin(c *gin.Context) {
	if err := godotenv.Load(); err != nil {
		log.Println("WARNING: Failed to load .env file. Using system environment variables.")
	}

	token := c.Query("token")
	if token == "" {
		log.Println("Missing token in Riot login request")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	riotAuthURL := "https://auth.riotgames.com/authorize"
	riotRedirectURI := os.Getenv("RIOT_CALLBACK_URL")

	if riotRedirectURI == "" {
		log.Println("🚨 ERROR: Riot OpenID environment variables not set!")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Riot OpenID variables not set"})
		return
	}

	authURL := fmt.Sprintf(
		"%s?response_type=code&redirect_uri=%s&state=%s",
		riotAuthURL, url.QueryEscape(riotRedirectURI), url.QueryEscape(token),
	)

	log.Println("✅ Redirecting to Riot OpenID:", authURL)
	c.Redirect(http.StatusFound, authURL)
}

// RiotCallback handles the Riot OpenID callback and links the Riot ID to the user
func RiotCallback(c *gin.Context) {
	if err := godotenv.Load(); err != nil {
		log.Println("🚨 WARNING: No .env file found, using system environment variables.")
	}

	code := c.Query("code")
	state := c.Query("state") // This is the token passed earlier

	if code == "" || state == "" {
		log.Println("🚨 ERROR: Missing authorization code or state in Riot callback")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization failed"})
		return
	}

	riotTokenURL := "https://auth.riotgames.com/token"
	riotRedirectURI := os.Getenv("RIOT_CALLBACK_URL")

	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("redirect_uri", riotRedirectURI)

	resp, err := http.PostForm(riotTokenURL, data)
	if err != nil {
		log.Println("🚨 ERROR: Failed to request Riot access token:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to authenticate with Riot"})
		return
	}
	defer resp.Body.Close()

	var tokenResponse struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
		log.Println("🚨 ERROR: Failed to decode Riot token response:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process Riot response"})
		return
	}

	// Get Riot ID from user info endpoint
	riotUserURL := "https://auth.riotgames.com/userinfo"
	req, _ := http.NewRequest("GET", riotUserURL, nil)
	req.Header.Set("Authorization", "Bearer "+tokenResponse.AccessToken)

	client := &http.Client{}
	userResp, err := client.Do(req)
	if err != nil {
		log.Println("🚨 ERROR: Failed to fetch Riot user info:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Riot user info"})
		return
	}
	defer userResp.Body.Close()

	var userInfo struct {
		RiotID string `json:"sub"`
	}
	if err := json.NewDecoder(userResp.Body).Decode(&userInfo); err != nil {
		log.Println("🚨 ERROR: Failed to decode Riot user response:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process Riot user data"})
		return
	}

	log.Println("✅ Riot Authentication Successful! Riot ID:", userInfo.RiotID)

	// Extract user ID from JWT token
	userID, err := extractUserIDFromToken(state)
	if err != nil {
		log.Println("🚨 ERROR: Failed to extract user ID from token:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	log.Println("🔍 Associating Riot ID with User ID:", userID)

	// Update the user in the database to associate with Riot ID
	var user models.User
	result := database.DB.First(&user, userID)
	if result.Error != nil {
		log.Println("🚨 ERROR: User not found:", result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.RiotID = userInfo.RiotID
	if err := database.DB.Save(&user).Error; err != nil {
		log.Println("🚨 ERROR: Failed to save Riot ID to user:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save Riot ID"})
		return
	}

	log.Println("✅ Riot ID successfully linked to user:", userID)

	// Redirect user to frontend
	frontendURL := os.Getenv("FRONTEND_URL")
	redirectTo := fmt.Sprintf("%s/profile", frontendURL)
	log.Println("✅ Redirecting user to:", redirectTo)
	c.Redirect(http.StatusFound, redirectTo)
}
