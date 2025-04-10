package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"

	"elo-insight/backend/database"
	"elo-insight/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Fetch CS2 stats from Steam Web API
func GetCS2Stats(c *gin.Context) {
	log.Println("➡️ Received request for CS2 stats")

	steamID := c.Query("steam_id")
	if steamID == "" {
		log.Println("Missing steam_id in request")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing steam_id"})
		return
	}

	apiKey := os.Getenv("STEAM_API_KEY")
	if apiKey == "" {
		log.Println("Missing Steam API key")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Missing Steam API key"})
		return
	}

	apiURL := fmt.Sprintf("https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?appid=730&key=%s&steamid=%s", apiKey, steamID)
	log.Println("Fetching CS2 stats from:", apiURL)

	resp, err := http.Get(apiURL)
	if err != nil {
		log.Println("Failed to fetch CS2 stats:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}
	defer resp.Body.Close()

	log.Println("Steam API Response Status:", resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Failed to read response body:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read API response"})
		return
	}

	log.Println("📝 Raw Steam API Response:", string(body))

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		log.Println("Failed to decode API response:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding API response"})
		return
	}

	playerStats, ok := result["playerstats"].(map[string]interface{})
	if !ok {
		log.Println("No 'playerstats' field in API response")
		c.JSON(http.StatusNotFound, gin.H{"error": "No stats found for this user"})
		return
	}

	statsList, ok := playerStats["stats"].([]interface{})
	if !ok {
		log.Println("No 'stats' array in playerstats")
		c.JSON(http.StatusNotFound, gin.H{"error": "No stats available for this player"})
		return
	}

	cs2Stats := make(map[string]interface{})
	for _, stat := range statsList {
		statMap, ok := stat.(map[string]interface{})
		if !ok {
			continue
		}
		name := statMap["name"].(string)
		value := statMap["value"]
		cs2Stats[name] = value
	}

	log.Println("Fetched CS2 Stats:", cs2Stats)

	c.JSON(http.StatusOK, cs2Stats)
}

func SaveStatSelection(c *gin.Context) {
	userID, exists := c.Get("userID") // ✅ Get authenticated user ID
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input models.UserStat
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("Invalid request:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userStat := models.UserStat{
		UserID:   userID.(uint), // ✅ Correctly reference `UserID`
		Game:     input.Game,
		Platform: input.Platform,
	}

	if err := database.DB.Create(&userStat).Error; err != nil {
		log.Println("Failed to save user stat:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save stat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stat saved successfully"})
}

// Fetch user stats
func GetUserStats(c *gin.Context) {
	userID, exists := c.Get("userID") // ✅ Get `ID` from JWT
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var stats []models.UserStat
	if err := database.DB.Where("user_id = ?", userID).Find(&stats).Error; err != nil {
		log.Println("Failed to fetch user stats:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Delete a user stat card
func DeleteStatCard(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the stat ID from the URL
	statID := c.Param("id")
	if statID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing stat ID"})
		return
	}

	// Convert string ID to uint
	id, err := strconv.ParseUint(statID, 10, 64)
	if err != nil {
		log.Println("Invalid stat ID:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid stat ID"})
		return
	}

	// Find the stat and check if it belongs to the user
	var stat models.UserStat
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&stat).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Stat not found or doesn't belong to user"})
		} else {
			log.Println("Failed to find stat:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find stat"})
		}
		return
	}

	// Delete the stat
	if err := database.DB.Delete(&stat).Error; err != nil {
		log.Println("Failed to delete stat:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete stat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stat deleted successfully"})
}
