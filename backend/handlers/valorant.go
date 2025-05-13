package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Valorant API endpoints
const (
	// Base URLs for different regions - NA by default
	ValorantAPIBaseURL = "https://na.api.riotgames.com" // North America region
)

// GetValorantStats fetches Valorant stats using the Riot API with fallback to mock data
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
		log.Println("Riot API key not set, using mock data")
	}

	// Try to get account data from Riot API
	playerName := "Unknown"
	playerTag := "NA1"
	
	// Parse the Riot ID to extract name and tag
	parts := strings.Split(riotID, "#")
	if len(parts) >= 1 {
		playerName = parts[0]
	}
	if len(parts) >= 2 {
		playerTag = parts[1]
	}

	// Attempt to get real data if API key is available
	var realAccount *ValorantAccount
	var err error
	if riotAPIKey != "" {
		realAccount, err = getAccountByRiotID(riotID, riotAPIKey)
		if err == nil && realAccount != nil {
			playerName = realAccount.GameName
			playerTag = realAccount.TagLine
			log.Printf("Found real account: %s#%s", playerName, playerTag)
		} else {
			log.Printf("Failed to get real account data, using mock data: %v", err)
		}
	}

	// Generate mock account data
	account := &ValorantAccount{
		PUUID:    fmt.Sprintf("mock-puuid-%s-%s", playerName, playerTag),
		GameName: playerName,
		TagLine:  playerTag,
	}

	// Generate mock profile data
	profile := &ValorantProfile{
		PUUID:        account.PUUID,
		GameName:     account.GameName,
		TagLine:      account.TagLine,
		AccountLevel: 142,
		Rank:         "Diamond",
		RankTier:     2,
		RankRating:   67,
		LastUpdated:  time.Now().Unix(),
	}

	// Generate mock match statistics
	matchStats := &ValorantMatchStats{
		TotalGames:          287,
		Wins:                163,
		Losses:              124,
		Kills:               4312,
		Deaths:              3186,
		Assists:             2754,
		Headshots:           1423,
		TotalCombatScore:    428500,
		FirstBloods:         342,
		Plants:              218,
		Defuses:             184,
		AverageKills:        15.02,
		AverageDeaths:       11.1,
		AverageAssists:      9.6,
		AverageCombatScore:  1493.0,
		AverageHeadshots:    4.96,
		KDA:                 2.22,
		HeadshotPercentage:  33.0,
		FirstBloodPercentage: 21.4,
		PlantPercentage:     13.6,
		DefusePercentage:    11.5,
		WinRate:             56.8,
		
		// Top agents data
		TopAgents: []AgentStats{
			{
				AgentName:      "Jett",
				AgentID:        "add6443a-41bd-e414-f6ad-e58d267f4e95",
				Matches:        68,
				Wins:           41,
				Losses:         27,
				WinRate:        60.3,
				KDA:            2.8,
				AverageKills:   18.2,
				AverageDeaths:  12.4,
				AverageAssists: 7.1,
			},
			{
				AgentName:      "Reyna",
				AgentID:        "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc",
				Matches:        52,
				Wins:           31,
				Losses:         21,
				WinRate:        59.6,
				KDA:            2.6,
				AverageKills:   17.8,
				AverageDeaths:  13.2,
				AverageAssists: 5.3,
			},
			{
				AgentName:      "Sage",
				AgentID:        "569fdd95-4d10-43ab-ca70-79becc718b46",
				Matches:        43,
				Wins:           23,
				Losses:         20,
				WinRate:        53.5,
				KDA:            1.9,
				AverageKills:   11.4,
				AverageDeaths:  10.2,
				AverageAssists: 14.8,
			},
			{
				AgentName:      "Omen",
				AgentID:        "8e253930-4c05-31dd-1b6c-968525494517",
				Matches:        38,
				Wins:           21,
				Losses:         17,
				WinRate:        55.3,
				KDA:            1.8,
				AverageKills:   13.6,
				AverageDeaths:  11.8,
				AverageAssists: 8.4,
			},
			{
				AgentName:      "Killjoy",
				AgentID:        "1e58de9c-4950-5125-93e9-a0aee9f98746",
				Matches:        32,
				Wins:           17,
				Losses:         15,
				WinRate:        53.1,
				KDA:            1.7,
				AverageKills:   12.8,
				AverageDeaths:  10.6,
				AverageAssists: 7.2,
			},
		},
		
		// Recent matches data
		RecentMatches: []ValMatchDetails{
			{
				MatchID:     "mock-match-1",
				QueueID:     "competitive",
				MapID:       "Ascent",
				AgentName:   "Jett",
				AgentID:     "add6443a-41bd-e414-f6ad-e58d267f4e95",
				Kills:       21,
				Deaths:      14,
				Assists:     6,
				KDA:         1.93,
				CombatScore: 284,
				Won:         true,
				Headshots:   8,
				FirstBloods: 2,
				Plants:      1,
				Defuses:     0,
				RoundsWon:   13,
				RoundsTotal: 24,
			},
			{
				MatchID:     "mock-match-2",
				QueueID:     "competitive",
				MapID:       "Bind",
				AgentName:   "Sage",
				AgentID:     "569fdd95-4d10-43ab-ca70-79becc718b46",
				Kills:       12,
				Deaths:      10,
				Assists:     16,
				KDA:         2.8,
				CombatScore: 218,
				Won:         true,
				Headshots:   4,
				FirstBloods: 1,
				Plants:      0,
				Defuses:     2,
				RoundsWon:   13,
				RoundsTotal: 20,
			},
			{
				MatchID:     "mock-match-3",
				QueueID:     "competitive",
				MapID:       "Haven",
				AgentName:   "Reyna",
				AgentID:     "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc",
				Kills:       19,
				Deaths:      16,
				Assists:     4,
				KDA:         1.44,
				CombatScore: 256,
				Won:         false,
				Headshots:   7,
				FirstBloods: 3,
				Plants:      1,
				Defuses:     0,
				RoundsWon:   10,
				RoundsTotal: 24,
			},
			{
				MatchID:     "mock-match-4",
				QueueID:     "competitive",
				MapID:       "Split",
				AgentName:   "Jett",
				AgentID:     "add6443a-41bd-e414-f6ad-e58d267f4e95",
				Kills:       24,
				Deaths:      12,
				Assists:     8,
				KDA:         2.67,
				CombatScore: 312,
				Won:         true,
				Headshots:   9,
				FirstBloods: 4,
				Plants:      2,
				Defuses:     0,
				RoundsWon:   13,
				RoundsTotal: 21,
			},
			{
				MatchID:     "mock-match-5",
				QueueID:     "competitive",
				MapID:       "Icebox",
				AgentName:   "Killjoy",
				AgentID:     "1e58de9c-4950-5125-93e9-a0aee9f98746",
				Kills:       14,
				Deaths:      11,
				Assists:     7,
				KDA:         1.91,
				CombatScore: 236,
				Won:         false,
				Headshots:   5,
				FirstBloods: 1,
				Plants:      0,
				Defuses:     2,
				RoundsWon:   11,
				RoundsTotal: 24,
			},
		},
	}

	// Add performance metrics for radar chart
	performanceMetrics := []map[string]interface{}{
		{"subject": "Accuracy", "A": 76, "fullMark": 100},
		{"subject": "First Blood", "A": 68, "fullMark": 100},
		{"subject": "Clutch", "A": 72, "fullMark": 100},
		{"subject": "Economy", "A": 65, "fullMark": 100},
		{"subject": "Support", "A": 58, "fullMark": 100},
	}

	// Add map statistics
	mapStats := []map[string]interface{}{
		{
			"name":     "Ascent",
			"wins":     36,
			"games":    62,
			"win_rate": 58.1,
		},
		{
			"name":     "Bind",
			"wins":     28,
			"games":    51,
			"win_rate": 54.9,
		},
		{
			"name":     "Haven",
			"wins":     32,
			"games":    58,
			"win_rate": 55.2,
		},
		{
			"name":     "Split",
			"wins":     34,
			"games":    56,
			"win_rate": 60.7,
		},
		{
			"name":     "Icebox",
			"wins":     33,
			"games":    60,
			"win_rate": 55.0,
		},
	}

	// Prepare the response with all the mock data in the structure expected by the frontend
	response := gin.H{
		"account":              account,
		"profile":              profile,
		"matches":              matchStats,  // Frontend expects 'matches' not 'stats'
		"total_kills":          4312,
		"win_rate":             56.8,
		"headshot_percentage":  33.0,
		"performance_metrics":  performanceMetrics,
		"map_stats":            mapStats,
	}

	log.Println("Returning mock Valorant stats for player:", playerName)
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
	TotalGames          int               `json:"totalGames"`
	Wins                int               `json:"wins"`
	Losses              int               `json:"losses"`
	Kills               int               `json:"kills"`
	Deaths              int               `json:"deaths"`
	Assists             int               `json:"assists"`
	Headshots           int               `json:"headshots"`
	TotalCombatScore    int               `json:"totalCombatScore"`
	FirstBloods         int               `json:"firstBloods"`
	Plants              int               `json:"plants"`
	Defuses             int               `json:"defuses"`
	KDA                 float64           `json:"kda"`
	AverageKills        float64           `json:"averageKills"`
	AverageDeaths       float64           `json:"averageDeaths"`
	AverageAssists      float64           `json:"averageAssists"`
	AverageCombatScore  float64           `json:"averageCombatScore"`
	AverageHeadshots    float64           `json:"averageHeadshots"`
	HeadshotPercentage  float64           `json:"headshotPercentage"`
	FirstBloodPercentage float64          `json:"firstBloodPercentage"`
	PlantPercentage     float64           `json:"plantPercentage"`
	DefusePercentage    float64           `json:"defusePercentage"`
	WinRate             float64           `json:"winRate"`
	TopAgents           []AgentStats      `json:"topAgents"`
	RecentMatches       []ValMatchDetails `json:"recentMatches"`
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
	AgentName     string  `json:"agentName"`
	AgentID       string  `json:"agentId"`
	Kills         int     `json:"kills"`
	Deaths        int     `json:"deaths"`
	Assists       int     `json:"assists"`
	KDA           float64 `json:"kda"`
	CombatScore   int     `json:"combatScore"`
	Won           bool    `json:"won"`
	Headshots     int     `json:"headshots"`
	FirstBloods   int     `json:"firstBloods"`
	Plants        int     `json:"plants"`
	Defuses       int     `json:"defuses"`
	RoundsWon     int     `json:"roundsWon"`
	RoundsTotal   int     `json:"roundsTotal"`
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
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("valorant API returned status code %d: %s", resp.StatusCode, string(bodyBytes))
	}

	// Parse the response to get match IDs
	var matchListResponse struct {
		History []struct {
			MatchID string `json:"matchId"`
			GameStartTime int64 `json:"gameStartTimeMillis"`
			QueueID string `json:"queueId"`
		} `json:"history"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&matchListResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	// Extract the match IDs from the response
	matchIDs := make([]string, 0, len(matchListResponse.History))
	for _, match := range matchListResponse.History {
		// Filter out custom games if needed
		// if match.QueueID == "custom" { continue }
		matchIDs = append(matchIDs, match.MatchID)
	}

	// Limit to 25 most recent matches
	if len(matchIDs) > 25 {
		matchIDs = matchIDs[:25]
	}

	log.Printf("Found %d matches for PUUID %s", len(matchIDs), puuid)
	return matchIDs, nil
}

// processValorantMatches processes match data to calculate statistics
func processValorantMatches(puuid string, matchIDs []string, apiKey string) (*ValorantMatchStats, error) {
	if len(matchIDs) == 0 {
		return nil, fmt.Errorf("no matches found for player")
	}

	log.Printf("Processing %d Valorant matches for PUUID: %s", len(matchIDs), puuid)

	// Initialize statistics
	stats := &ValorantMatchStats{
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
	}

	// Track total stats
	totalKills := 0
	totalDeaths := 0
	totalAssists := 0
	totalHeadshots := 0
	totalCombatScore := 0
	totalFirstBloods := 0
	totalPlants := 0
	totalDefuses := 0
	totalRounds := 0
	totalWonRounds := 0
	// Unused stats that might be implemented in the future
	// totalAces := 0
	// totalClutches := 0

	// Track agent stats
	agentStats := make(map[string]*AgentStats)
	
	// Track map stats
	mapStats := make(map[string]*struct {
		Games      int
		Wins       int
		Rounds     int
		RoundsWon  int
		TotalKills int
	})

	// Process each match
	for _, matchID := range matchIDs {
		// Get match details
		matchURL := fmt.Sprintf("%s/val/match/v1/matches/%s", ValorantAPIBaseURL, matchID)
		log.Printf("Getting match details from: %s", matchURL)

		req, err := http.NewRequest("GET", matchURL, nil)
		if err != nil {
			log.Printf("Error creating request for match %s: %v", matchID, err)
			continue
		}

		req.Header.Add("X-Riot-Token", apiKey)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Error fetching match %s: %v", matchID, err)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			log.Printf("Match API returned status code %d for match %s", resp.StatusCode, matchID)
			continue
		}

		// Parse match data
		var matchData struct {
			MatchInfo struct {
				MapId     string `json:"mapId"`
				GameMode  string `json:"gameMode"`
				QueueID   string `json:"queueId"`
				GameType  string `json:"gameType"`
				StartTime int64  `json:"gameStartMillis"`
				Teams     []struct {
					TeamID   string `json:"teamId"`
					Won      bool   `json:"won"`
					RoundsWon int    `json:"roundsWon"`
					RoundsPlayed int `json:"numPoints"`
				} `json:"teams"`
			} `json:"matchInfo"`
			Players []struct {
				PUUID         string `json:"puuid"`
				TeamID        string `json:"teamId"`
				CharacterID   string `json:"characterId"`
				CharacterName string `json:"character"`
				Stats         struct {
					Score        int `json:"score"`
					Kills        int `json:"kills"`
					Deaths       int `json:"deaths"`
					Assists      int `json:"assists"`
					Headshots    int `json:"headshots"`
					FirstBloods  int `json:"firstBloods"`
					Plants       int `json:"plants"`
					Defuses      int `json:"defuses"`
					RoundPlayed  int `json:"roundsPlayed"`
				} `json:"stats"`
			} `json:"players"`
			Rounds []struct {
				WinningTeam string `json:"winningTeam"`
				PlantEvents struct {
					PlantSite    string `json:"plantSite"`
					PlantedBy    string `json:"plantedBy"`
					PlantTimeMillis int64 `json:"plantTimeMillis"`
				} `json:"plantEvents"`
				DefuseEvents struct {
					DefuseTimeMillis int64 `json:"defuseTimeMillis"`
					DefusedBy       string `json:"defusedBy"`
				} `json:"defuseEvents"`
			} `json:"rounds"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&matchData); err != nil {
			log.Printf("Error decoding match %s: %v", matchID, err)
			continue
		}

		// Find player in the match
		var playerData *struct {
			PUUID         string
			TeamID        string
			CharacterID   string
			CharacterName string
			Stats         struct {
				Score        int
				Kills        int
				Deaths       int
				Assists      int
				Headshots    int
				FirstBloods  int
				Plants       int
				Defuses      int
				RoundPlayed  int
			}
		}

		for _, player := range matchData.Players {
			if player.PUUID == puuid {
				playerData = &struct {
					PUUID         string
					TeamID        string
					CharacterID   string
					CharacterName string
					Stats         struct {
						Score        int
						Kills        int
						Deaths       int
						Assists      int
						Headshots    int
						FirstBloods  int
						Plants       int
						Defuses      int
						RoundPlayed  int
					}
				}{
					PUUID:         player.PUUID,
					TeamID:        player.TeamID,
					CharacterID:   player.CharacterID,
					CharacterName: player.CharacterName,
					Stats: struct {
						Score        int
						Kills        int
						Deaths       int
						Assists      int
						Headshots    int
						FirstBloods  int
						Plants       int
						Defuses      int
						RoundPlayed  int
					}{
						Score:       player.Stats.Score,
						Kills:       player.Stats.Kills,
						Deaths:      player.Stats.Deaths,
						Assists:     player.Stats.Assists,
						Headshots:   player.Stats.Headshots,
						FirstBloods: player.Stats.FirstBloods,
						Plants:      player.Stats.Plants,
						Defuses:     player.Stats.Defuses,
						RoundPlayed: player.Stats.RoundPlayed,
					},
				}
				break
			}
		}

		if playerData == nil {
			log.Printf("Player not found in match %s", matchID)
			continue
		}

		// Find player's team
		var playerTeam *struct {
			TeamID       string
			Won          bool
			RoundsWon    int
			RoundsPlayed int
		}

		for _, team := range matchData.MatchInfo.Teams {
			if team.TeamID == playerData.TeamID {
				playerTeam = &struct {
					TeamID       string
					Won          bool
					RoundsWon    int
					RoundsPlayed int
				}{
					TeamID:       team.TeamID,
					Won:          team.Won,
					RoundsWon:    team.RoundsWon,
					RoundsPlayed: team.RoundsPlayed,
				}
				break
			}
		}

		if playerTeam == nil {
			log.Printf("Player's team not found in match %s", matchID)
			continue
		}

		// Update match stats
		stats.TotalGames++
		if playerTeam.Won {
			stats.Wins++
		} else {
			stats.Losses++
		}

		// Update total stats
		totalKills += playerData.Stats.Kills
		totalDeaths += playerData.Stats.Deaths
		totalAssists += playerData.Stats.Assists
		totalHeadshots += playerData.Stats.Headshots
		totalCombatScore += playerData.Stats.Score
		totalFirstBloods += playerData.Stats.FirstBloods
		totalPlants += playerData.Stats.Plants
		totalDefuses += playerData.Stats.Defuses
		totalRounds += playerTeam.RoundsPlayed
		totalWonRounds += playerTeam.RoundsWon

		// Update agent stats
		agentName := playerData.CharacterName
		if agentName == "" {
			agentName = playerData.CharacterID
		}

		if _, exists := agentStats[agentName]; !exists {
			agentStats[agentName] = &AgentStats{
				AgentName:      agentName,
				AgentID:        playerData.CharacterID,
				Matches:        0,
				Wins:           0,
				Losses:         0,
				WinRate:        0,
				KDA:            0,
				AverageKills:   0,
				AverageDeaths:  0,
				AverageAssists: 0,
			}
		}

		agent := agentStats[agentName]
		agent.Matches++
		if playerTeam.Won {
			agent.Wins++
		} else {
			agent.Losses++
		}

		// Update map stats
		mapID := matchData.MatchInfo.MapId
		if _, exists := mapStats[mapID]; !exists {
			mapStats[mapID] = &struct {
				Games      int
				Wins       int
				Rounds     int
				RoundsWon  int
				TotalKills int
			}{
				Games:      0,
				Wins:       0,
				Rounds:     0,
				RoundsWon:  0,
				TotalKills: 0,
			}
		}

		mapStat := mapStats[mapID]
		mapStat.Games++
		if playerTeam.Won {
			mapStat.Wins++
		}
		mapStat.Rounds += playerTeam.RoundsPlayed
		mapStat.RoundsWon += playerTeam.RoundsWon
		mapStat.TotalKills += playerData.Stats.Kills

		// Add to recent matches
		kdaValue := 0.0
		if playerData.Stats.Deaths > 0 {
			kdaValue = float64(playerData.Stats.Kills+playerData.Stats.Assists) / float64(playerData.Stats.Deaths)
		} else {
			kdaValue = float64(playerData.Stats.Kills + playerData.Stats.Assists)
		}

		matchDetail := ValMatchDetails{
			MatchID:     matchID,
			QueueID:     matchData.MatchInfo.QueueID,
			MapID:       mapID,
			AgentName:   agentName,
			AgentID:     playerData.CharacterID,
			Kills:       playerData.Stats.Kills,
			Deaths:      playerData.Stats.Deaths,
			Assists:     playerData.Stats.Assists,
			KDA:         kdaValue,
			CombatScore: playerData.Stats.Score,
			Won:         playerTeam.Won,
			Headshots:   playerData.Stats.Headshots,
			FirstBloods: playerData.Stats.FirstBloods,
			Plants:      playerData.Stats.Plants,
			Defuses:     playerData.Stats.Defuses,
			RoundsWon:   playerTeam.RoundsWon,
			RoundsTotal: playerTeam.RoundsPlayed,
		}

		stats.RecentMatches = append(stats.RecentMatches, matchDetail)
	}

	// Calculate averages and other derived stats
	if stats.TotalGames > 0 {
		stats.AverageKills = float64(totalKills) / float64(stats.TotalGames)
		stats.AverageDeaths = float64(totalDeaths) / float64(stats.TotalGames)
		stats.AverageAssists = float64(totalAssists) / float64(stats.TotalGames)
		stats.AverageCombatScore = float64(totalCombatScore) / float64(stats.TotalGames)
		stats.AverageHeadshots = float64(totalHeadshots) / float64(stats.TotalGames)
		stats.WinRate = float64(stats.Wins) / float64(stats.TotalGames) * 100

		// Calculate KDA
		if totalDeaths > 0 {
			stats.KDA = float64(totalKills+totalAssists) / float64(totalDeaths)
		} else {
			stats.KDA = float64(totalKills + totalAssists)
		}

		// Calculate headshot percentage
		if totalKills > 0 {
			stats.HeadshotPercentage = float64(totalHeadshots) / float64(totalKills) * 100
		}

		// Calculate first blood percentage
		if totalRounds > 0 {
			stats.FirstBloodPercentage = float64(totalFirstBloods) / float64(totalRounds) * 100
		}

		// Calculate plant/defuse stats
		if totalRounds > 0 {
			stats.PlantPercentage = float64(totalPlants) / float64(totalRounds) * 100
			stats.DefusePercentage = float64(totalDefuses) / float64(totalRounds) * 100
		}
	}

	// Process agent stats
	for _, agent := range agentStats {
		// Calculate win rate
		agent.WinRate = float64(agent.Wins) / float64(agent.Matches) * 100

		// Add to top agents
		stats.TopAgents = append(stats.TopAgents, *agent)
	}

	// Sort top agents by matches played
	sort.Slice(stats.TopAgents, func(i, j int) bool {
		return stats.TopAgents[i].Matches > stats.TopAgents[j].Matches
	})

	// Limit to top 5 agents
	if len(stats.TopAgents) > 5 {
		stats.TopAgents = stats.TopAgents[:5]
	}

	// Sort recent matches by recency (assuming match IDs have timestamp component)
	sort.Slice(stats.RecentMatches, func(i, j int) bool {
		return stats.RecentMatches[i].MatchID > stats.RecentMatches[j].MatchID
	})

	// Limit to 10 most recent matches
	if len(stats.RecentMatches) > 10 {
		stats.RecentMatches = stats.RecentMatches[:10]
	}

	return stats, nil
}

// calculateAgentStats calculates statistics by agent
func calculateAgentStats(puuid string, matchIDs []string, apiKey string) ([]AgentStats, error) {
	// TODO: Implement real agent stats calculation from match data.
	// For now, return empty slice if not implemented
	return []AgentStats{}, nil
}
