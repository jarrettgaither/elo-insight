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

// LoL API endpoints
const (
	// Base URLs for different regions
	RiotAPIBaseURL = "https://na1.api.riotgames.com"      // North America region
	MatchV5BaseURL = "https://americas.api.riotgames.com" // Americas region for match data
)

// GetLeagueOfLegendsStats fetches LoL stats using the Riot API
func GetLeagueOfLegendsStats(c *gin.Context) {
	log.Println("➡️ Received request for League of Legends stats")

	// Check for ALL possible Riot identifiers in the query parameters
	riotID := c.Query("riot_id")
	riotGameName := c.Query("riot_game_name")
	riotTagline := c.Query("riot_tagline")
	riotPUUID := c.Query("riot_puuid")
	
	log.Printf("Riot identifiers from query: ID=%s, GameName=%s, Tagline=%s, PUUID=%s",
		riotID, riotGameName, riotTagline, riotPUUID)
	
	// Check if we have at least one valid identifier
	hasValidIdentifier := riotID != "" || (riotGameName != "" && riotTagline != "") || riotPUUID != ""
	
	if !hasValidIdentifier {
		// If no identifiers provided, try to get from the authenticated user
		userIDValue, exists := c.Get("userID")
		if !exists {
			log.Println("ERROR: User ID not found in context and no Riot identifiers provided")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Riot account information is required"})
			return
		}
		
		// Convert and log the user ID that we would use to query the database
		userID, ok := userIDValue.(uint)
		if !ok {
			log.Printf("ERROR: User ID is not of the expected type: %v", userIDValue)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
			return
		}
		
		// Log that we would query the database with this user ID
		log.Printf("Would query database for Riot info with user ID: %d", userID)

		// Check if user has a linked Riot account - expanded struct to include all fields
		var user struct {
			RiotID       string `json:"riot_id"`
			RiotGameName string `json:"riot_game_name"`
			RiotTagline  string `json:"riot_tagline"`
			RiotPUUID    string `json:"riot_puuid"`
		}

		// In a real implementation, we'd query the database for the user's Riot info
		// For example:
		// if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		//     log.Printf("ERROR: Failed to retrieve user: %v", err)
		//     c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		//     return
		// }
		
		// For testing only - simulate empty values
		user.RiotID = ""
		user.RiotGameName = ""
		user.RiotTagline = ""
		user.RiotPUUID = ""

		// Check if any Riot identifiers are available
		hasAnyIdentifier := user.RiotID != "" || 
			(user.RiotGameName != "" && user.RiotTagline != "") || 
			user.RiotPUUID != ""

		if !hasAnyIdentifier {
			log.Println("ERROR: User has no linked Riot account information")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Riot account not linked"})
			return
		}

		// Set any available identifiers
		riotID = user.RiotID
		riotGameName = user.RiotGameName
		riotTagline = user.RiotTagline
		riotPUUID = user.RiotPUUID
	}

	// Log all the Riot identifiers we'll be using
	log.Printf("Fetching League of Legends stats using identifiers: ID=%s, GameName=%s, Tagline=%s, PUUID=%s",
		riotID, riotGameName, riotTagline, riotPUUID)

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

	log.Printf("Using Riot API key: %s...[REDACTED]", riotAPIKey[:10])

	// Prioritize using PUUID if available, otherwise fall back to riot_id
	var summoner *Summoner
	var err error
	
	// Check if PUUID is available first
	if riotPUUID != "" {
		log.Printf("Using saved PUUID directly: %s", riotPUUID)
		// Create a direct request to get summoner by PUUID
		summonerURL := fmt.Sprintf("%s/lol/summoner/v4/summoners/by-puuid/%s", RiotAPIBaseURL, riotPUUID)
		
		client := &http.Client{}
		req, err := http.NewRequest("GET", summonerURL, nil)
		if err != nil {
			log.Printf("ERROR: Failed to create request: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create API request"})
			return
		}
		
		req.Header.Add("X-Riot-Token", riotAPIKey)
		
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("ERROR: Failed to send request: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to communicate with Riot API"})
			return
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			log.Printf("ERROR: API returned status %d: %s", resp.StatusCode, string(body))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch summoner data from Riot API"})
			return
		}
		
		summoner = &Summoner{}
		if err := json.NewDecoder(resp.Body).Decode(summoner); err != nil {
			log.Printf("ERROR: Failed to decode response: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse API response"})
			return
		}
		
		log.Printf("Successfully fetched summoner data using PUUID: %s", summoner.Name)
	} else if riotID != "" {
		// Fall back to using riot_id if no PUUID is available
		log.Printf("No PUUID available, falling back to riot_id: %s", riotID)
		summoner, err = getSummonerByName(riotID, riotAPIKey)
		if err != nil {
			log.Printf("ERROR: Failed to get summoner by name: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch summoner data from Riot API"})
			return
		}
	} else {
		// No valid identifiers at all
		log.Println("ERROR: No Riot PUUID or ID available")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Riot account information is required"})
		return
	}
	
	// Handle any errors from the summoner lookup
	if err != nil {
		log.Printf("ERROR: Failed to get summoner: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch summoner data from Riot API"})
		return
	}
	log.Printf("Found summoner: %s (PUUID: %s)", summoner.Name, summoner.PUUID)

	// Step 2: Get ranked data for the summoner using multiple endpoints
	rankedData, err := getRankedData(summoner.ID, riotAPIKey)
	if err != nil {
		log.Printf("WARNING: Failed to get ranked data via summoner ID, trying PUUID: %v", err)
		// Try alternative endpoint using PUUID
		rankedData, err = getRankedDataByPUUID(summoner.PUUID, riotAPIKey)
		if err != nil {
			log.Printf("WARNING: Failed to get ranked data, proceeding anyway: %v", err)
			// Continue even if we can't get ranked data - we'll focus on other stats
			rankedData = []RankedEntry{}
		}
	}

	// Step 3: Get match history
	matchIDs, err := getMatchHistory(summoner.PUUID, riotAPIKey)
	if err != nil {
		log.Printf("ERROR: Failed to get match history: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get match history: %v", err)})
		return
	}

	// Check for empty match history
	if len(matchIDs) == 0 {
		log.Println("WARNING: No matches found for summoner")
		c.JSON(http.StatusOK, gin.H{
			"summoner": summoner,
			"ranked":   rankedData,
			"matches":  nil,
			"message":  "No recent matches found",
		})
		return
	}

	// Step 4: Process match data to calculate statistics with enhanced KDA calculation
	matchStats, err := processMatches(summoner.PUUID, matchIDs, riotAPIKey)
	if err != nil {
		log.Printf("ERROR: Failed to process matches: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to process match data: %v", err)})
		return
	}

	// Step 5: Get champion-specific stats like win rates and KDA per champion
	championStats, err := calculateChampionStats(summoner.PUUID, matchIDs, riotAPIKey)
	if err != nil {
		log.Printf("WARNING: Failed to calculate champion-specific stats: %v", err)
		// Continue even without champion stats
	} else {
		// Add the champion stats to the match stats
		matchStats.TopChampions = championStats
	}

	// Combine all data into a response
	response := gin.H{
		"summoner": summoner,
		"ranked":   rankedData,
		"matches":  matchStats,
	}

	c.JSON(http.StatusOK, response)
}

// Summoner represents a League of Legends player
type Summoner struct {
	ID            string `json:"id"`
	AccountID     string `json:"accountId"`
	PUUID         string `json:"puuid"`
	Name          string `json:"name"`
	ProfileIconID int    `json:"profileIconId"`
	RevisionDate  int64  `json:"revisionDate"`
	SummonerLevel int    `json:"summonerLevel"`
}

// RankedEntry represents ranked queue data for a player
type RankedEntry struct {
	QueueType    string `json:"queueType"`
	Tier         string `json:"tier"`
	Rank         string `json:"rank"`
	LeaguePoints int    `json:"leaguePoints"`
	Wins         int    `json:"wins"`
	Losses       int    `json:"losses"`
	MiniSeries   struct {
		Losses   int    `json:"losses"`
		Progress string `json:"progress"`
		Target   int    `json:"target"`
		Wins     int    `json:"wins"`
	} `json:"miniSeries"`
}

// MatchStats contains statistics for a player across multiple matches
type MatchStats struct {
	TotalGames        int             `json:"totalGames"`
	Wins              int             `json:"wins"`
	Losses            int             `json:"losses"`
	KDA               float64         `json:"kda"`
	AverageKills      float64         `json:"averageKills"`
	AverageDeaths     float64         `json:"averageDeaths"`
	AverageAssists    float64         `json:"averageAssists"`
	AverageCS         float64         `json:"averageCS"`
	AverageVision     float64         `json:"averageVision,averageVisionScore"`
	AverageDamage     float64         `json:"averageDamage"`                           // Average damage per game
	WinRate           float64         `json:"winRate"`                                 // Win percentage
	KillParticipation float64         `json:"killParticipation"`                       // Kill participation percentage
	ObjectiveControl  float64         `json:"objectiveControl,objectiveParticipation"` // Objective control score
	TopChampions      []ChampionStats `json:"topChampions"`
	RecentMatches     []MatchDetails  `json:"recentMatches"`
	QuickPlayStats    QuickPlayStats  `json:"quickPlayStats"` // Quick play specific stats
}

// QuickPlayStats contains statistics specific to Quick Play mode
type QuickPlayStats struct {
	Games            int                  `json:"games"`
	Wins             int                  `json:"wins"`
	WinRate          float64              `json:"winRate"`
	RolePrefStats    map[string]RoleStats `json:"rolePrefStats"`    // Stats by preferred role
	CarryScore       float64              `json:"carryScore"`       // Measure of how much player carries games
	VersatilityScore float64              `json:"versatilityScore"` // Measure of champion/role diversity
}

// RoleStats contains statistics for a specific role
type RoleStats struct {
	Games          int     `json:"games"`
	Wins           int     `json:"wins"`
	WinRate        float64 `json:"winRate"`
	KDA            float64 `json:"kda"`
	AvgImpactScore float64 `json:"avgImpactScore"` // Average impact score in this role
}

// ChampionStats contains statistics for a specific champion
type ChampionStats struct {
	ChampionID             int     `json:"championId"`
	ChampionName           string  `json:"championName"`
	Games                  int     `json:"games"`
	Wins                   int     `json:"wins"`
	Losses                 int     `json:"losses"`
	KDA                    float64 `json:"kda"`
	AverageVisionScore     float64 `json:"averageVisionScore"`
	ObjectiveParticipation float64 `json:"objectiveParticipation"`
}

// MatchDetails contains basic information about a match
type MatchDetails struct {
	MatchID      string    `json:"matchId"`
	ChampionID   int       `json:"championId"`
	ChampionName string    `json:"championName"`
	Win          bool      `json:"win"`
	Kills        int       `json:"kills"`
	Deaths       int       `json:"deaths"`
	Assists      int       `json:"assists"`
	CS           int       `json:"cs"`
	Role         string    `json:"role"`
	Lane         string    `json:"lane"`
	Timestamp    time.Time `json:"timestamp"`
}

// RiotAccount represents a Riot Games account from the Account V1 API
type RiotAccount struct {
	PUUID    string `json:"puuid"`
	GameName string `json:"gameName"`
	TagLine  string `json:"tagLine"`
}

// getSummonerByName retrieves summoner data using the Riot API
// This uses the modern two-step approach: first get PUUID, then get summoner
func getSummonerByName(riotID string, apiKey string) (*Summoner, error) {
	// Step 1: Parse the Riot ID into gameName and tagLine
	gameName := riotID
	tagLine := "NA1" // Default region tag

	if idx := strings.Index(riotID, "#"); idx >= 0 {
		gameName = riotID[:idx]
		tagLine = riotID[idx+1:]
	}

	log.Printf("Looking up Riot account for %s#%s", gameName, tagLine)

	// Step 2: Use the Account V1 API to get the PUUID
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

	var riotAccount RiotAccount
	if err := json.NewDecoder(resp.Body).Decode(&riotAccount); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	log.Printf("Found Riot account with PUUID: %s", riotAccount.PUUID)

	// Step 3: Use the PUUID to get the summoner data
	summonerURL := fmt.Sprintf("%s/lol/summoner/v4/summoners/by-puuid/%s", RiotAPIBaseURL, riotAccount.PUUID)

	req, err = http.NewRequest("GET", summonerURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Add("X-Riot-Token", apiKey)

	resp, err = client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Summoner API returned status code %d: %s", resp.StatusCode, string(body))
	}

	var summoner Summoner
	if err := json.NewDecoder(resp.Body).Decode(&summoner); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	// Set the name field to use the gameName from the Riot account
	// This ensures the display name is correctly shown in the UI
	if summoner.Name == "" {
		summoner.Name = riotAccount.GameName
		log.Printf("Using gameName '%s' for summoner display name", riotAccount.GameName)
	}

	return &summoner, nil
}

// getRankedData retrieves ranked queue data for a summoner using summoner ID
func getRankedData(summonerID string, apiKey string) ([]RankedEntry, error) {
	url := fmt.Sprintf("%s/lol/league/v4/entries/by-summoner/%s", RiotAPIBaseURL, summonerID)

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
		return nil, fmt.Errorf("API returned status code %d", resp.StatusCode)
	}

	var rankedEntries []RankedEntry
	if err := json.NewDecoder(resp.Body).Decode(&rankedEntries); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	return rankedEntries, nil
}

// getRankedDataByPUUID retrieves ranked queue data for a summoner using PUUID
func getRankedDataByPUUID(puuid string, apiKey string) ([]RankedEntry, error) {
	url := fmt.Sprintf("%s/lol/league/v4/entries/by-puuid/%s", RiotAPIBaseURL, puuid)

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
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status code %d: %s", resp.StatusCode, string(body))
	}

	var rankedEntries []RankedEntry
	if err := json.NewDecoder(resp.Body).Decode(&rankedEntries); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	return rankedEntries, nil
}

// calculateChampionStats calculates statistics per champion from match data
func calculateChampionStats(puuid string, matchIDs []string, apiKey string) ([]ChampionStats, error) {
	log.Printf("Calculating champion stats for PUUID: %s from %d matches", puuid, len(matchIDs))

	// Map to track stats per champion
	champStats := make(map[int]*struct {
		ChampionName string
		Games        int
		Wins         int
		Losses       int
		Kills        int
		Deaths       int
		Assists      int
		VisionScore  int
		Objectives   int
	})

	// Process each match to extract champion data
	processedMatches := 0
	for _, matchID := range matchIDs {
		if processedMatches >= 20 { // Limit to last 20 matches
			break
		}

		// Get match details
		match, err := getMatchDetails(matchID, apiKey)
		if err != nil {
			log.Printf("WARNING: Failed to get match details for %s: %v", matchID, err)
			continue
		}

		// Find player in participants
		var found bool
		for _, p := range match.Info.Participants {
			if p.PUUID == puuid {
				championID := p.ChampionID
				championName := p.ChampionName

				// Create entry if not exists
				if _, exists := champStats[championID]; !exists {
					champStats[championID] = &struct {
						ChampionName string
						Games        int
						Wins         int
						Losses       int
						Kills        int
						Deaths       int
						Assists      int
						VisionScore  int
						Objectives   int
					}{
						ChampionName: championName,
						Games:        0,
						Wins:         0,
						Losses:       0,
						Kills:        0,
						Deaths:       0,
						Assists:      0,
						VisionScore:  0,
						Objectives:   0,
					}
				}

				// Update stats
				stats := champStats[championID]
				stats.Games++
				stats.Kills += p.Kills
				stats.Deaths += p.Deaths
				stats.Assists += p.Assists
				stats.VisionScore += p.VisionScore
				stats.Objectives += p.DragonKills + p.BaronKills + p.TurretKills

				if p.Win {
					stats.Wins++
				} else {
					stats.Losses++
				}

				found = true
				break
			}
		}

		if found {
			processedMatches++
		}
	}

	// Convert map to sorted slice
	var result []ChampionStats
	for champID, stats := range champStats {
		// Calculate KDA
		kda := 0.0
		if stats.Deaths > 0 {
			kda = float64(stats.Kills+stats.Assists) / float64(stats.Deaths)
		} else if stats.Kills > 0 || stats.Assists > 0 {
			// Perfect KDA (no deaths)
			kda = float64(stats.Kills + stats.Assists)
		}

		result = append(result, ChampionStats{
			ChampionID:             champID,
			ChampionName:           stats.ChampionName,
			Games:                  stats.Games,
			Wins:                   stats.Wins,
			Losses:                 stats.Losses,
			KDA:                    kda,
			AverageVisionScore:     float64(stats.VisionScore) / float64(stats.Games),
			ObjectiveParticipation: float64(stats.Objectives) / float64(stats.Games),
		})
	}

	// Sort by games played (descending)
	sort.Slice(result, func(i, j int) bool {
		return result[i].Games > result[j].Games
	})

	// Take top 5 champions
	if len(result) > 5 {
		result = result[:5]
	}

	return result, nil
}

// MatchDetailResponse represents the response from the match-v5 API
type MatchDetailResponse struct {
	Metadata struct {
		DataVersion  string   `json:"dataVersion"`
		MatchID      string   `json:"matchId"`
		Participants []string `json:"participants"`
	} `json:"metadata"`
	Info struct {
		GameCreation       int64         `json:"gameCreation"`
		GameDuration       int           `json:"gameDuration"`
		GameEndTimestamp   int64         `json:"gameEndTimestamp"`
		GameID             int64         `json:"gameId"`
		GameMode           string        `json:"gameMode"`
		GameName           string        `json:"gameName"`
		GameStartTimestamp int64         `json:"gameStartTimestamp"`
		GameType           string        `json:"gameType"`
		GameVersion        string        `json:"gameVersion"`
		MapID              int           `json:"mapId"`
		Participants       []Participant `json:"participants"`
		QueueID            int           `json:"queueId"`
	} `json:"info"`
}

// Participant represents a player in a match
type Participant struct {
	Assists                     int    `json:"assists"`
	BaronKills                  int    `json:"baronKills"`
	ChampionID                  int    `json:"championId"`
	ChampionName                string `json:"championName"`
	Deaths                      int    `json:"deaths"`
	DragonKills                 int    `json:"dragonKills"`
	Kills                       int    `json:"kills"`
	Lane                        string `json:"lane"`
	ObjectivesStolenAssists     int    `json:"objectivesStolenAssists"`
	ObjectivesStolen            int    `json:"objectivesStolen"`
	ParticipantID               int    `json:"participantId"`
	PentaKills                  int    `json:"pentaKills"`
	PUUID                       string `json:"puuid"`
	Role                        string `json:"role"`
	SummonerID                  string `json:"summonerId"`
	SummonerLevel               int    `json:"summonerLevel"`
	SummonerName                string `json:"summonerName"`
	TeamID                      int    `json:"teamId"`
	TotalDamageDealtToChampions int    `json:"totalDamageDealtToChampions"`
	TotalMinionsKilled          int    `json:"totalMinionsKilled"`
	TurretKills                 int    `json:"turretKills"`
	VisionScore                 int    `json:"visionScore"`
	Win                         bool   `json:"win"`
}

// getMatchDetails retrieves detailed information about a match
func getMatchDetails(matchID string, apiKey string) (*MatchDetailResponse, error) {
	url := fmt.Sprintf("%s/lol/match/v5/matches/%s", MatchV5BaseURL, matchID)

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
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Match API returned status code %d: %s", resp.StatusCode, string(body))
	}

	var matchDetail MatchDetailResponse
	if err := json.NewDecoder(resp.Body).Decode(&matchDetail); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	return &matchDetail, nil
}

// getMatchHistory retrieves match IDs for a player
func getMatchHistory(puuid string, apiKey string) ([]string, error) {
	// Get last 25 matches
	url := fmt.Sprintf("%s/lol/match/v5/matches/by-puuid/%s/ids?count=25", MatchV5BaseURL, puuid)
	log.Printf("Getting match history from: %s", url)

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
		return nil, fmt.Errorf("Match API returned status code %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var matchIDs []string
	if err := json.NewDecoder(resp.Body).Decode(&matchIDs); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	log.Printf("Found %d matches for PUUID %s", len(matchIDs), puuid)
	return matchIDs, nil
}

// processMatches processes match data to calculate statistics
func processMatches(puuid string, matchIDs []string, apiKey string) (*MatchStats, error) {
	if len(matchIDs) == 0 {
		return nil, fmt.Errorf("no matches found for player")
	}

	log.Printf("Processing %d matches for PUUID: %s", len(matchIDs), puuid)

	// Initialize statistics
	stats := &MatchStats{
		TotalGames:     0,
		Wins:           0,
		Losses:         0,
		KDA:            0,
		AverageKills:   0,
		AverageDeaths:  0,
		AverageAssists: 0,
		AverageCS:      0,
		AverageVision:  0,
		AverageDamage:  0,
		TopChampions:   []ChampionStats{},
		RecentMatches:  []MatchDetails{},
		QuickPlayStats: QuickPlayStats{
			RolePrefStats: make(map[string]RoleStats),
		},
	}

	// Champion statistics map
	championStats := make(map[string]*ChampionStats)

	// Aggregated stats
	totalKills := 0
	totalDeaths := 0
	totalAssists := 0
	totalCS := 0
	totalVision := 0
	totalDamage := 0
	totalTeamKills := 0 // For kill participation calculation
	totalObjectiveScore := 0
	totalGames := 0

	// Process each match (limit to 10 for API call efficiency)
	maxMatches := 10
	if len(matchIDs) < maxMatches {
		maxMatches = len(matchIDs)
	}

	// Track which game modes we've seen
	seenGameModes := make(map[string]int)

	for i := 0; i < maxMatches; i++ {
		totalGames++
		matchID := matchIDs[i]

		// Get detailed match data from the Riot API
		url := fmt.Sprintf("%s/lol/match/v5/matches/%s", MatchV5BaseURL, matchID)

		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			log.Printf("Error creating match request: %v", err)
			continue
		}

		req.Header.Add("X-Riot-Token", apiKey)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Error fetching match data: %v", err)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			log.Printf("API error for match %s: %d %s", matchID, resp.StatusCode, string(body))
			continue
		}

		// Decode the match data
		var match struct {
			Metadata struct {
				DataVersion  string   `json:"dataVersion"`
				MatchID      string   `json:"matchId"`
				Participants []string `json:"participants"`
			} `json:"metadata"`
			Info struct {
				GameCreation     int64  `json:"gameCreation"`
				GameDuration     int    `json:"gameDuration"`
				GameEndTimestamp int64  `json:"gameEndTimestamp"`
				GameMode         string `json:"gameMode"`
				GameType         string `json:"gameType"`
				MapID            int    `json:"mapId"`
				Participants     []struct {
					Assists                     int    `json:"assists"`
					ChampionName                string `json:"championName"`
					ChampionID                  int    `json:"championId"`
					Deaths                      int    `json:"deaths"`
					Kills                       int    `json:"kills"`
					Lane                        string `json:"lane"`
					PUUID                       string `json:"puuid"`
					Role                        string `json:"role"`
					TeamID                      int    `json:"teamId"`
					TotalMinionsKilled          int    `json:"totalMinionsKilled"`
					VisionScore                 int    `json:"visionScore"`
					Win                         bool   `json:"win"`
					TotalDamageDealtToChampions int    `json:"totalDamageDealtToChampions"`
					NeutralMinionsKilled        int    `json:"neutralMinionsKilled"`
					ObjectivesStolen            int    `json:"objectivesStolen"`
					ObjectivesStolenAssists     int    `json:"objectivesStolenAssists"`
					DragonKills                 int    `json:"dragonKills"`
					BaronKills                  int    `json:"baronKills"`
					TurretKills                 int    `json:"turretKills"`
				} `json:"participants"`
				Teams []struct {
					TeamID     int  `json:"teamId"`
					Win        bool `json:"win"`
					Objectives struct {
						Baron struct {
							Kills int `json:"kills"`
						} `json:"baron"`
						Dragon struct {
							Kills int `json:"kills"`
						} `json:"dragon"`
						Tower struct {
							Kills int `json:"kills"`
						} `json:"tower"`
					} `json:"objectives"`
				} `json:"teams"`
			} `json:"info"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&match); err != nil {
			log.Printf("Error decoding match data: %v", err)
			continue
		}

		// Track game modes seen
		seenGameModes[match.Info.GameMode]++

		// Process all game types - both ranked and quick play
		// We want comprehensive stats across all game modes

		// Find player in the match participants
		var playerData *struct {
			Assists                     int    `json:"assists"`
			ChampionName                string `json:"championName"`
			ChampionID                  int    `json:"championId"`
			Deaths                      int    `json:"deaths"`
			Kills                       int    `json:"kills"`
			Lane                        string `json:"lane"`
			PUUID                       string `json:"puuid"`
			Role                        string `json:"role"`
			TeamID                      int    `json:"teamId"`
			TotalMinionsKilled          int    `json:"totalMinionsKilled"`
			VisionScore                 int    `json:"visionScore"`
			Win                         bool   `json:"win"`
			TotalDamageDealtToChampions int    `json:"totalDamageDealtToChampions"`
			ObjectivesStolen            int    `json:"objectivesStolen"`
			ObjectivesStolenAssists     int    `json:"objectivesStolenAssists"`
			DragonKills                 int    `json:"dragonKills"`
			BaronKills                  int    `json:"baronKills"`
			TurretKills                 int    `json:"turretKills"`
		}

		for i := range match.Info.Participants {
			if match.Info.Participants[i].PUUID == puuid {
				// Aggregate vision and objectives for performance stats
				totalVision += match.Info.Participants[i].VisionScore
				totalObjectiveScore += match.Info.Participants[i].DragonKills + match.Info.Participants[i].BaronKills + match.Info.Participants[i].TurretKills
				participant := match.Info.Participants[i]
				playerData = &struct {
					Assists                     int    `json:"assists"`
					ChampionName                string `json:"championName"`
					ChampionID                  int    `json:"championId"`
					Deaths                      int    `json:"deaths"`
					Kills                       int    `json:"kills"`
					Lane                        string `json:"lane"`
					PUUID                       string `json:"puuid"`
					Role                        string `json:"role"`
					TeamID                      int    `json:"teamId"`
					TotalMinionsKilled          int    `json:"totalMinionsKilled"`
					VisionScore                 int    `json:"visionScore"`
					Win                         bool   `json:"win"`
					TotalDamageDealtToChampions int    `json:"totalDamageDealtToChampions"`
					ObjectivesStolen            int    `json:"objectivesStolen"`
					ObjectivesStolenAssists     int    `json:"objectivesStolenAssists"`
					DragonKills                 int    `json:"dragonKills"`
					BaronKills                  int    `json:"baronKills"`
					TurretKills                 int    `json:"turretKills"`
				}{
					Assists:                     participant.Assists,
					ChampionName:                participant.ChampionName,
					ChampionID:                  participant.ChampionID,
					Deaths:                      participant.Deaths,
					Kills:                       participant.Kills,
					Lane:                        participant.Lane,
					PUUID:                       participant.PUUID,
					Role:                        participant.Role,
					TeamID:                      participant.TeamID,
					TotalMinionsKilled:          participant.TotalMinionsKilled,
					VisionScore:                 participant.VisionScore,
					Win:                         participant.Win,
					TotalDamageDealtToChampions: participant.TotalDamageDealtToChampions,
					ObjectivesStolen:            participant.ObjectivesStolen,
					ObjectivesStolenAssists:     participant.ObjectivesStolenAssists,
					DragonKills:                 participant.DragonKills,
					BaronKills:                  participant.BaronKills,
					TurretKills:                 participant.TurretKills,
				}
				break
			}
		}

		if playerData == nil {
			log.Printf("Player not found in match %s", matchID)
			continue
		}

		// Count team kills for KP calculation
		teamKills := 0
		for _, p := range match.Info.Participants {
			if p.TeamID == playerData.TeamID {
				teamKills += p.Kills
			}
		}
		totalTeamKills += teamKills

		// Calculate objective control score
		objectiveScore := playerData.DragonKills*3 + playerData.BaronKills*5 + playerData.TurretKills*2 +
			playerData.ObjectivesStolen*4 + playerData.ObjectivesStolenAssists*2
		totalObjectiveScore += objectiveScore

		// Update general stats
		stats.TotalGames++
		if playerData.Win {
			stats.Wins++
		} else {
			stats.Losses++
		}

		// Accumulate stats
		totalKills += playerData.Kills
		totalDeaths += playerData.Deaths
		totalAssists += playerData.Assists
		totalCS += playerData.TotalMinionsKilled
		totalVision += playerData.VisionScore
		totalDamage += playerData.TotalDamageDealtToChampions

		// Add to champion statistics
		champKey := playerData.ChampionName
		if _, exists := championStats[champKey]; !exists {
			championStats[champKey] = &ChampionStats{
				ChampionID:   playerData.ChampionID,
				ChampionName: playerData.ChampionName,
				Games:        0,
				Wins:         0,
				Losses:       0,
				KDA:          0,
			}
		}

		cs := championStats[champKey]
		cs.Games++
		if playerData.Win {
			cs.Wins++
		} else {
			cs.Losses++
		}

		// KDA calculation for champion
		kdaValue := float64(playerData.Kills + playerData.Assists)
		if playerData.Deaths > 0 {
			kdaValue = kdaValue / float64(playerData.Deaths)
		}
		cs.KDA = (cs.KDA*float64(cs.Games-1) + kdaValue) / float64(cs.Games)

		// Role stats for quick play
		role := playerData.Role
		if role == "" || role == "NONE" {
			role = playerData.Lane
		}
		if role == "" || role == "NONE" {
			role = "OTHER"
		}

		if _, exists := stats.QuickPlayStats.RolePrefStats[role]; !exists {
			stats.QuickPlayStats.RolePrefStats[role] = RoleStats{
				Games:          0,
				Wins:           0,
				WinRate:        0,
				KDA:            0,
				AvgImpactScore: 0,
			}
		}

		roleStats := stats.QuickPlayStats.RolePrefStats[role]
		roleStats.Games++
		if playerData.Win {
			roleStats.Wins++
		}

		if playerData.Deaths > 0 {
			roleStats.KDA = (roleStats.KDA*float64(roleStats.Games-1) + kdaValue) / float64(roleStats.Games)
		} else {
			roleStats.KDA = (roleStats.KDA*float64(roleStats.Games-1) + float64(playerData.Kills+playerData.Assists)) / float64(roleStats.Games)
		}

		// Impact score calculation
		impactScore := float64(kdaValue)*0.4 + float64(playerData.TotalDamageDealtToChampions)/1000.0*0.3 +
			float64(objectiveScore)*0.3
		roleStats.AvgImpactScore = (roleStats.AvgImpactScore*float64(roleStats.Games-1) + impactScore) / float64(roleStats.Games)
		roleStats.WinRate = float64(roleStats.Wins) / float64(roleStats.Games) * 100

		// Update the role stats in the map
		stats.QuickPlayStats.RolePrefStats[role] = roleStats

		// Add to recent matches
		matchDetail := MatchDetails{
			MatchID:      matchID,
			ChampionID:   playerData.ChampionID,
			ChampionName: playerData.ChampionName,
			Win:          playerData.Win,
			Kills:        playerData.Kills,
			Deaths:       playerData.Deaths,
			Assists:      playerData.Assists,
			CS:           playerData.TotalMinionsKilled,
			Role:         playerData.Role,
			Lane:         playerData.Lane,
			Timestamp:    time.Unix(match.Info.GameCreation/1000, 0),
		}
		stats.RecentMatches = append(stats.RecentMatches, matchDetail)
	}

	// After all matches processed, calculate averages
	if totalGames > 0 {
		stats.AverageKills = float64(totalKills) / float64(totalGames)
		stats.AverageDeaths = float64(totalDeaths) / float64(totalGames)
		stats.AverageAssists = float64(totalAssists) / float64(totalGames)
		stats.AverageCS = float64(totalCS) / float64(totalGames)
		stats.AverageVision = float64(totalVision) / float64(totalGames)
		stats.AverageDamage = float64(totalDamage) / float64(totalGames)
		stats.ObjectiveControl = float64(totalObjectiveScore) / float64(totalGames)
	}

	// Calculate KDA if we have the raw components
	if stats.AverageDeaths != 0 {
		deaths := stats.AverageDeaths
		kills := stats.AverageKills
		assists := stats.AverageAssists
		stats.KDA = (kills + assists) / deaths
	}

	// Quick play specific stats
	stats.QuickPlayStats.Games = stats.TotalGames
	stats.QuickPlayStats.Wins = stats.Wins
	stats.QuickPlayStats.WinRate = stats.WinRate

	// Kill participation
	if totalTeamKills > 0 {
		stats.KillParticipation = float64(totalKills+totalAssists) / float64(totalTeamKills) * 100
	}

	// Objective control metric
	stats.ObjectiveControl = float64(totalObjectiveScore) / float64(stats.TotalGames)

	// Calculate versatility score based on champion and role diversity
	stats.QuickPlayStats.VersatilityScore = float64(len(championStats))*5 + float64(len(stats.QuickPlayStats.RolePrefStats))*10
	if stats.QuickPlayStats.VersatilityScore > 100 {
		stats.QuickPlayStats.VersatilityScore = 100
	}

	// Calculate carry score based on KDA, damage, and win contribution
	stats.QuickPlayStats.CarryScore = stats.KDA*5 + stats.AverageDamage/1000.0*3 + stats.WinRate*0.2
	if stats.QuickPlayStats.CarryScore > 100 {
		stats.QuickPlayStats.CarryScore = 100
	}

	// Convert champion map to slice and sort by games played
	for _, cs := range championStats {
		stats.TopChampions = append(stats.TopChampions, *cs)
	}

	// Sort top champions by games played
	sort.Slice(stats.TopChampions, func(i, j int) bool {
		return stats.TopChampions[i].Games > stats.TopChampions[j].Games
	})

	// Limit to top 5 champions
	if len(stats.TopChampions) > 5 {
		stats.TopChampions = stats.TopChampions[:5]
	}

	return stats, nil
}
