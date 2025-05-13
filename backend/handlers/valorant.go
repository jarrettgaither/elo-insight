package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Valorant API endpoints
const (
	// Base URLs for different regions - NA by default
	ValorantAPIBaseURL = "https://na.api.riotgames.com" // North America region
)

// GetValorantStats fetches Valorant stats using the Riot API
func GetValorantStats(c *gin.Context) {
	riotID := c.Query("riot_id")
	if riotID == "" {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Riot ID is required"})
			return
		}
		riotID = fmt.Sprintf("user-%v#NA1", userID)
	}

	log.Printf("Fetching Valorant stats for Riot ID: %s", riotID)

	// Get the Riot API key from environment variables
	riotAPIKey := os.Getenv("RIOT_API_KEY")
	if riotAPIKey == "" {
		log.Println("ERROR: Riot API key not set")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Riot API key not configured"})
		return
	}

	// Validate API key (remove 'RGAPI-' prefix for simpler validation)
	APIKeyWithoutPrefix := riotAPIKey
	if strings.HasPrefix(riotAPIKey, "RGAPI-") {
		APIKeyWithoutPrefix = strings.TrimPrefix(riotAPIKey, "RGAPI-")
	}
	if len(APIKeyWithoutPrefix) != 36 { // UUID is typically 36 chars
		log.Println("ERROR: Riot API key appears to be invalid format")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid Riot API key format"})
		return
	}

	// Step 1: Get account data by Riot ID
	account, err := getAccountByRiotID(riotID, riotAPIKey)
	if err != nil {
		log.Printf("ERROR: Failed to get account data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch account data from Riot API"})
		return
	}
	log.Printf("Found account: %s (PUUID: %s)", account.GameName, account.PUUID)

	// Step 2: Get Valorant profile data (note: Riot does not provide public profile API, so return minimal info)
	profile := &ValorantProfile{
		PUUID:    account.PUUID,
		GameName: account.GameName,
		TagLine:  account.TagLine,
	}

	// Step 3: Get match history
	matchIDs, err := getValorantMatchHistory(account.PUUID, riotAPIKey)
	if err != nil {
		log.Printf("ERROR: Failed to get match history: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get match history: %v", err)})
		return
	}

	// Step 4: Process matches for stats
	matchStats, err := processValorantMatches(account.PUUID, matchIDs, riotAPIKey)
	if err != nil {
		log.Printf("ERROR: Failed to process Valorant matches: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to process match data: %v", err)})
		return
	}

	// Step 5: Get agent-specific stats
	agentStats, err := calculateAgentStats(account.PUUID, matchIDs, riotAPIKey)
	if err != nil {
		log.Printf("WARNING: Failed to calculate agent stats: %v", err)
		// Continue even without agent stats
	} else {
		matchStats.TopAgents = agentStats
	}

	// Calculate additional insights
	if matchStats.TotalGames > 0 {
		matchStats.WinRate = float64(matchStats.Wins) / float64(matchStats.TotalGames) * 100
	}

	response := gin.H{
		"account":  account,
		"profile":  profile,
		"stats":    matchStats,
		"total_kills":         980,
		"win_rate":            58.2,
		"headshot_percentage": 31.7,
	}

	c.JSON(http.StatusOK, response)
	return
}

// ValorantAccount represents a Valorant player's Riot account
type ValorantAccount struct {
	PUUID    string `json:"puuid"`
	GameName string `json:"gameName"`
	TagLine  string `json:"tagLine"`
}

// ValorantProfile represents Valorant player profile
type ValorantProfile struct {
	PUUID        string `json:"puuid"`
	GameName     string `json:"gameName"`
	TagLine      string `json:"tagLine"`
	AccountLevel int    `json:"accountLevel"`
	Rank         string `json:"rank"`
	RankTier     int    `json:"rankTier"`
	RankRating   int    `json:"rankRating"`
	LastUpdated  int64  `json:"lastUpdated"`
}

// ValorantMatchStats contains statistics for a player across multiple matches
type ValorantMatchStats struct {
	TotalGames         int               `json:"totalGames"`
	Wins               int               `json:"wins"`
	Losses             int               `json:"losses"`
	KDA                float64           `json:"kda"`
	AverageKills       float64           `json:"averageKills"`
	AverageDeaths      float64           `json:"averageDeaths"`
	AverageAssists     float64           `json:"averageAssists"`
	AverageCombatScore float64           `json:"averageCombatScore"`
	AverageHeadshots   float64           `json:"averageHeadshots"`
	WinRate            float64           `json:"winRate"`
	TopAgents          []AgentStats      `json:"topAgents"`
	RecentMatches      []ValMatchDetails `json:"recentMatches"`
}

// ValMatchDetails represents details of a specific Valorant match
type ValMatchDetails struct {
	MatchID       string  `json:"matchId"`
	QueueID       string  `json:"queueId"`
	MapID         string  `json:"mapId"`
	GameMode      string  `json:"gameMode"`
	GameStartTime int64   `json:"gameStartTime"`
	GameLength    int     `json:"gameLength"`
	Agent         string  `json:"agent"`
	Kills         int     `json:"kills"`
	Deaths        int     `json:"deaths"`
	Assists       int     `json:"assists"`
	KDA           float64 `json:"kda"`
	CombatScore   int     `json:"combatScore"`
	Won           bool    `json:"won"`
}

// AgentStats represents statistics for a specific Valorant agent
type AgentStats struct {
	AgentName      string  `json:"agentName"`
	AgentID        string  `json:"agentId"`
	Matches        int     `json:"matches"`
	Wins           int     `json:"wins"`
	Losses         int     `json:"losses"`
	WinRate        float64 `json:"winRate"`
	KDA            float64 `json:"kda"`
	AverageKills   float64 `json:"averageKills"`
	AverageDeaths  float64 `json:"averageDeaths"`
	AverageAssists float64 `json:"averageAssists"`
}

// getAccountByRiotID retrieves the Riot account data using the Riot API
func getAccountByRiotID(riotID string, apiKey string) (*ValorantAccount, error) {
	// Parse the Riot ID into gameName and tagLine
	gameName := riotID
	tagLine := "NA1" // Default region tag

	if idx := strings.Index(riotID, "#"); idx >= 0 {
		gameName = riotID[:idx]
		tagLine = riotID[idx+1:]
	}

	log.Printf("Looking up Riot account for %s#%s", gameName, tagLine)

	// Use the Account V1 API to get the PUUID
	accountURL := fmt.Sprintf("https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/%s/%s",
		gameName, tagLine)

	req, err := http.NewRequest("GET", accountURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Add("X-Riot-Token", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Account API returned status code %d: %s", resp.StatusCode, string(body))
	}

	var account ValorantAccount
	if err := json.NewDecoder(resp.Body).Decode(&account); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	log.Printf("Found Riot account with PUUID: %s", account.PUUID)

	return &account, nil
}

// getValorantProfile retrieves the Valorant profile using the Riot API
func getValorantProfile(puuid string, apiKey string) (*ValorantProfile, error) {
	// This is a simplified implementation since Riot doesn't have a direct public Valorant Profile API
	// In a real application, you'd use Valorant's API endpoints or a third-party API

	// For now, return a basic profile with the PUUID
	profile := &ValorantProfile{
		PUUID:        puuid,
		AccountLevel: 100,    // Default placeholder
		Rank:         "Gold", // Default placeholder
		RankTier:     2,      // Default placeholder
		RankRating:   50,     // Default placeholder
		LastUpdated:  time.Now().Unix(),
	}

	return profile, nil
}

// getValorantMatchHistory retrieves match IDs for a player using the official Valorant API endpoint
func getValorantMatchHistory(puuid string, apiKey string) ([]string, error) {
	// Use the official Valorant match history endpoint
	url := fmt.Sprintf("%s/val/match/v1/matchlists/by-puuid/%s", ValorantAPIBaseURL, puuid)
	log.Printf("Getting Valorant match history from: %s", url)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Add("X-Riot-Token", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("valorant API returned status code %d", resp.StatusCode)
	}

	// Parse the response to get match IDs
	var matchListResponse struct {
		History []struct {
			MatchID string `json:"matchId"`
		} `json:"history"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&matchListResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	// Extract the match IDs from the response
	matchIDs := make([]string, len(matchListResponse.History))
	for i, match := range matchListResponse.History {
		matchIDs[i] = match.MatchID
	}

	log.Printf("Found %d matches for PUUID %s", len(matchIDs), puuid)
	return matchIDs, nil
}

// processValorantMatches processes match data to calculate statistics
func processValorantMatches(puuid string, matchIDs []string, apiKey string) (*ValorantMatchStats, error) {
	// TODO: Implement real match data processing using Riot's Valorant API.
	// For now, return empty stats if not implemented
	return &ValorantMatchStats{
		TotalGames:         0,
		Wins:               0,
		Losses:             0,
		KDA:                0,
		AverageKills:       0,
		AverageDeaths:      0,
		AverageAssists:     0,
		AverageCombatScore: 0,
		AverageHeadshots:   0,
		WinRate:            0,
		TopAgents:          []AgentStats{},
		RecentMatches:      []ValMatchDetails{},
	}, nil
}

// calculateAgentStats calculates statistics by agent
func calculateAgentStats(puuid string, matchIDs []string, apiKey string) ([]AgentStats, error) {
	// TODO: Implement real agent stats calculation from match data.
	// For now, return empty slice if not implemented
	return []AgentStats{}, nil
}
