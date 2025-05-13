package handlers

import (
	"log"
	"net/http"
	"os"
	"fmt"
	"net/url"
	"encoding/json"

	"elo-insight/backend/database"
	"elo-insight/backend/models"

	"github.com/gin-gonic/gin"
)

// LinkXboxAccount links an Xbox Live Gamertag to the user's profile
func LinkXboxAccount(c *gin.Context) {
	// Get user ID from the context (set by the auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		log.Println("ERROR: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse request body
	var input struct {
		XboxID string `json:"xbox_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("ERROR: Invalid request data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Validate Xbox ID (basic validation)
	if len(input.XboxID) < 3 {
		log.Println("ERROR: Xbox ID too short:", input.XboxID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Xbox ID must be at least 3 characters"})
		return
	}

	log.Println("Linking Xbox account:", input.XboxID, "to user ID:", userID)

	// Retrieve user from database
	var user models.User
	result := database.DB.First(&user, userID)
	if result.Error != nil {
		log.Println("ERROR: User not found:", result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update user with Xbox ID
	user.XboxID = input.XboxID
	
	// Save user
	if err := database.DB.Save(&user).Error; err != nil {
		log.Println("ERROR: Failed to save Xbox ID to user:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save Xbox ID"})
		return
	}

	log.Println("Xbox account successfully linked to user:", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Xbox account linked successfully"})
}

// LinkPlayStationAccount links a PlayStation Network ID to the user's profile
func LinkPlayStationAccount(c *gin.Context) {
	// Get user ID from the context (set by the auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		log.Println("ERROR: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse request body
	var input struct {
		PlayStationID string `json:"playstation_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("ERROR: Invalid request data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Validate PlayStation ID (basic validation)
	if len(input.PlayStationID) < 3 {
		log.Println("ERROR: PlayStation ID too short:", input.PlayStationID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "PlayStation ID must be at least 3 characters"})
		return
	}

	log.Println("Linking PlayStation account:", input.PlayStationID, "to user ID:", userID)

	// Retrieve user from database
	var user models.User
	result := database.DB.First(&user, userID)
	if result.Error != nil {
		log.Println("ERROR: User not found:", result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update user with PlayStation ID
	user.PlayStationID = input.PlayStationID
	
	// Save user
	if err := database.DB.Save(&user).Error; err != nil {
		log.Println("ERROR: Failed to save PlayStation ID to user:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save PlayStation ID"})
		return
	}

	log.Println("PlayStation account successfully linked to user:", userID)
	c.JSON(http.StatusOK, gin.H{"message": "PlayStation account linked successfully"})
}

// LinkRiotAccount links a Riot account (GameName, Tagline, PUUID) to the user's profile
func LinkRiotAccount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		log.Println("ERROR: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input struct {
		RiotGameName string `json:"riot_game_name" binding:"required"`
		RiotTagline  string `json:"riot_tagline" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("ERROR: Invalid request data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Fetch user from DB
	var user models.User
	result := database.DB.First(&user, userID)
	if result.Error != nil {
		log.Println("ERROR: User not found:", result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Call Riot API to get PUUID
	riotAPIKey := os.Getenv("RIOT_API_KEY")
	if riotAPIKey == "" {
		log.Println("ERROR: Riot API key not set in environment")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Riot API key missing"})
		return
	}

	accountURL := fmt.Sprintf("https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/%s/%s", url.PathEscape(input.RiotGameName), url.PathEscape(input.RiotTagline))
	req, err := http.NewRequest("GET", accountURL, nil)
	if err != nil {
		log.Println("ERROR: Failed to create Riot API request:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Riot API request"})
		return
	}
	req.Header.Set("X-Riot-Token", riotAPIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println("ERROR: Riot API request failed:", err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to contact Riot API"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("ERROR: Riot API returned status %d", resp.StatusCode)
		c.JSON(http.StatusBadGateway, gin.H{"error": "Riot API error", "status": resp.StatusCode})
		return
	}

	var riotResp struct {
		PUUID    string `json:"puuid"`
		GameName string `json:"gameName"`
		TagLine  string `json:"tagLine"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&riotResp); err != nil {
		log.Println("ERROR: Failed to decode Riot API response:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode Riot API response"})
		return
	}

	// Save to user profile
	user.RiotGameName = riotResp.GameName
	user.RiotTagline = riotResp.TagLine
	user.RiotPUUID = riotResp.PUUID

	if err := database.DB.Save(&user).Error; err != nil {
		log.Println("ERROR: Failed to save Riot account to user:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save Riot account"})
		return
	}

	log.Printf("Riot account linked: %s#%s (PUUID: %s) for user %v", riotResp.GameName, riotResp.TagLine, riotResp.PUUID, userID)
	c.JSON(http.StatusOK, gin.H{"message": "Riot account linked successfully"})
}
