package handlers

import (
	"net/http"

	"elo-insight/backend/database"
	"elo-insight/backend/models"

	"github.com/gin-gonic/gin"
)

// Returns the authenticated user's profile
func GetProfile(c *gin.Context) {
	// Extract user ID from jwt claims
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Find user in the database
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Return user profile data
	c.JSON(http.StatusOK, gin.H{
		"username":        user.Username,
		"email":           user.Email,
		"steam_id":        user.SteamID,
		"ea_username":     user.EAUsername,
		"riot_id":         user.RiotID,
		"riot_game_name":  user.RiotGameName,
		"riot_tagline":    user.RiotTagline,
		"riot_puuid":      user.RiotPUUID,
		"xbox_id":         user.XboxID,
		"playstation_id":  user.PlayStationID,
	})
}
