package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
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
