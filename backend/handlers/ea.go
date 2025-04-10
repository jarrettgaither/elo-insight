package handlers

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"elo-insight/backend/database"
	"elo-insight/backend/models"

	"github.com/gin-gonic/gin"
)

// LinkEAAccount links an EA account username to the user's profile
func LinkEAAccount(c *gin.Context) {
	// Get user ID from the context (set by the auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		log.Println("ERROR: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse request body
	var input struct {
		EAUsername string `json:"ea_username" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("ERROR: Invalid request data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Validate EA username (basic validation)
	if len(input.EAUsername) < 3 {
		log.Println("ERROR: EA username too short:", input.EAUsername)
		c.JSON(http.StatusBadRequest, gin.H{"error": "EA username must be at least 3 characters"})
		return
	}

	log.Println("Linking EA account:", input.EAUsername, "to user ID:", userID)

	// Retrieve user from database
	var user models.User
	result := database.DB.First(&user, userID)
	if result.Error != nil {
		log.Println("ERROR: User not found:", result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update user with EA username
	user.EAUsername = input.EAUsername
	
	// Update RiotID and SteamID to empty strings if they're NULL to avoid unique constraint violations
	if user.RiotID == "" {
		user.RiotID = ""
	}
	if user.SteamID == "" {
		user.SteamID = ""
	}
	
	if err := database.DB.Save(&user).Error; err != nil {
		log.Println("ERROR: Failed to save EA username to user:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save EA username"})
		return
	}

	log.Println("EA account successfully linked to user:", userID)
	c.JSON(http.StatusOK, gin.H{"message": "EA account linked successfully"})
}

// GetApexStats fetches Apex Legends stats from the tracker.gg API
func GetApexStats(c *gin.Context) {
	log.Println("➡️ Received request for Apex Legends stats")

	// Get the EA username from the query parameter or from the user profile
	eaUsername := c.Query("username")
	
	// If username is not provided in the query, get it from the user profile
	if eaUsername == "" {
		// Get user ID from the context (set by the auth middleware)
		userID, exists := c.Get("userID")
		if !exists {
			log.Println("ERROR: User ID not found in context and no username provided")
			c.JSON(http.StatusBadRequest, gin.H{"error": "EA username is required"})
			return
		}

		// Retrieve user from database
		var user models.User
		result := database.DB.First(&user, userID)
		if result.Error != nil {
			log.Println("ERROR: User not found:", result.Error)
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		eaUsername = user.EAUsername
		if eaUsername == "" {
			log.Println("ERROR: User has no linked EA account")
			c.JSON(http.StatusBadRequest, gin.H{"error": "EA account not linked"})
			return
		}
	}

	log.Println("Fetching Apex Legends stats for EA username:", eaUsername)

	// Get the tracker.gg API key from environment variables
	trackerAPIKey := os.Getenv("TRACKER_API_KEY")
	if trackerAPIKey == "" {
		log.Println("ERROR: Tracker.gg API key not set")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Tracker.gg API key not configured"})
		return
	}

	// Create a new HTTP client for the tracker.gg API request
	client := &http.Client{}
	
	// Build the API URL for the tracker.gg API
	// The platform is 'origin' for PC players
	// Try the search endpoint which might have different permissions
	apiURL := fmt.Sprintf("https://public-api.tracker.gg/v2/apex/standard/search?platform=origin&query=%s", eaUsername)
	
	// Create a new request
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		log.Println("ERROR: Failed to create request:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create API request"})
		return
	}
	
	// Add the API key to the request headers
	req.Header.Add("TRN-Api-Key", trackerAPIKey)
	
	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		log.Println("ERROR: Failed to fetch Apex Legends stats:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}
	defer resp.Body.Close()
	
	// Check the response status code
	if resp.StatusCode != http.StatusOK {
		log.Println("ERROR: Tracker.gg API returned status code:", resp.StatusCode)
		
		// Read and log the response body for debugging
		bodyBytes, err := io.ReadAll(resp.Body)
		if err == nil {
			log.Println("Response body:", string(bodyBytes))
			
			// Create a new reader with the same bytes for later use
			resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		}
		
		c.JSON(resp.StatusCode, gin.H{"error": "Failed to fetch stats from Tracker.gg API"})
		return
	}
	
	// Forward the response directly to the client
	c.DataFromReader(resp.StatusCode, resp.ContentLength, resp.Header.Get("Content-Type"), resp.Body, nil)
}
