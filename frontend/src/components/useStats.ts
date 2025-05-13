import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Define the backend stat type with capitalized fields
interface BackendStat {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  UserID: number;
  Game: string;
  Platform: string;
}

// Define the frontend stat type with lowercase fields
interface FrontendStat {
  ID?: number;  // Keep the ID for deletion
  game: string;
  platform: string;
  data: any;
}

const useStats = () => {
  const [stats, setStats] = useState<FrontendStat[]>([]);
  const [profile, setProfile] = useState<{ 
    steam_id?: string;
    ea_username?: string;
    riot_id?: string;
    // Add the newer Riot fields from the backend User model
    riot_game_name?: string;
    riot_tagline?: string;
    riot_puuid?: string;
    xbox_id?: string;
    playstation_id?: string;
  } | null>(null);

  // Convert backend stat format to frontend format
  const convertStat = (backendStat: BackendStat): FrontendStat => {
    return {
      ID: backendStat.ID,
      game: backendStat.Game,
      platform: backendStat.Platform,
      data: null
    };
  };

  const fetchUserStats = useCallback(async () => {
    try {
      console.log("Fetching user stats...");
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/stats/`, {
        withCredentials: true,
      });
      console.log("User stats fetched:", response.data);
      
      // Convert backend stats to frontend format
      const convertedStats = response.data.map((stat: BackendStat) => convertStat(stat));
      console.log("Converted stats:", convertedStats);
      
      setStats(convertedStats);
    } catch (error) {
      console.error("❌ Error fetching saved stats:", error);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      console.log("Fetching user profile...");
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/profile`, {
        withCredentials: true,
      });
      console.log("User profile fetched:", response.data);
      
      // Enhanced logging for profile data
      if (response.data) {
        console.log("Profile account IDs:", {
          riot_id: response.data.riot_id,
          steam_id: response.data.steam_id,
          ea_username: response.data.ea_username
        });
      }
      
      // Ensure null fields are converted to undefined for cleaner conditionals
      const cleanedProfile = Object.fromEntries(
        Object.entries(response.data || {}).map(([key, value]) => 
          [key, value === null ? undefined : value]
        )
      );
      
      console.log("Cleaned profile:", cleanedProfile);
      setProfile(cleanedProfile);
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
    }
  }, []);

  const fetchUpdatedStats = useCallback(async () => {
    if (!profile) {
      console.warn("⚠️ Skipping stat fetch: Profile not loaded.");
      return;
    }
  
    console.log("Starting fetchUpdatedStats with stats:", stats);
    console.log("Current profile:", profile);
    // Print key debugging info about the profile
    console.log("Profile riot_id available:", !!profile.riot_id);
    console.log("Profile steam_id available:", !!profile.steam_id);
    console.log("Profile platform IDs:", {
      riot_id: profile.riot_id,
      steam_id: profile.steam_id,
      ea_username: profile.ea_username,
      xbox_id: profile.xbox_id,
      playstation_id: profile.playstation_id
    });
    
    // Use the current stats from state parameter instead of the stats variable
    // to avoid closure issues and prevent infinite loops
    setStats(currentStats => {
      // Don't update if there are no stats
      if (currentStats.length === 0) {
        console.log("No stats to update");
        return currentStats;
      }
      
      console.log("Updating stats for:", currentStats);
      // Log each stat card type for debugging
      currentStats.forEach(stat => {
        console.log(`Stat card: game=${stat.game}, platform=${stat.platform}, hasData=${!!stat.data}`);
      });
      // Start the async update process
      Promise.all(
        currentStats.map(async (stat) => {
          if (!stat.game) {
            console.warn("⚠️ Skipping stat with missing game field:", stat);
            return { ...stat, data: null };
          }
    
          try {
            // Handle different game types
            if (stat.game === "CS2" && profile.steam_id) {
              console.log(`Fetching CS2 stats with steam_id: ${profile.steam_id}`);
              const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/stats/cs2`,
                { params: { steam_id: profile.steam_id } }
              );
              console.log(`Stats for ${stat.game} fetched:`, response.data);
              return { ...stat, data: response.data };
            } 
            else if (stat.game === "Apex Legends" && profile.ea_username) {
              console.log(`Fetching Apex Legends stats for EA username: ${profile.ea_username}`);
              const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/stats/apex`,
                { params: { username: profile.ea_username } }
              );
              console.log(`Stats for ${stat.game} fetched:`, response.data);
              
              // Process tracker.gg API response
              if (response.data && response.data.data) {
                return { ...stat, data: processApexStats(response.data.data) };
              } else {
                return { ...stat, data: { error: "No data available" } };
              }
            }
            else if (stat.game === "Dota 2" && profile.steam_id) {
              console.log(`Fetching Dota 2 stats with steam_id: ${profile.steam_id}`);
              const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/stats/dota2`,
                { params: { steam_id: profile.steam_id } }
              );
              console.log(`Stats for ${stat.game} fetched:`, response.data);
              
              // Process Dota 2 stats
              if (response.data) {
                return { ...stat, data: processDota2Stats(response.data) };
              } else {
                console.error(`No data in response for ${stat.game}`);
                return { ...stat, data: { error: "No data available" } };
              }
            }
            else if (stat.game === "League of Legends") {
              // Check if ANY Riot fields are available
              const hasRiotId = !!profile?.riot_id;
              const hasRiotGameName = !!profile?.riot_game_name;
              const hasRiotTagline = !!profile?.riot_tagline;
              const hasRiotPuuid = !!profile?.riot_puuid;
              
              console.log(`League of Legends API call - Riot fields available:`, {
                hasRiotId,
                hasRiotGameName,
                hasRiotTagline,
                hasRiotPuuid
              });
              
              if (!hasRiotId && !hasRiotGameName && !hasRiotTagline && !hasRiotPuuid) {
                console.error("Cannot fetch League of Legends stats - no Riot account information available");
                return { ...stat, data: { error: "Riot account required" } };
              }
              
              // Build request parameters using all available Riot fields
              const params: Record<string, string> = {};
              
              if (profile?.riot_id) {
                params.riot_id = profile.riot_id;
              }
              if (profile?.riot_game_name) {
                params.riot_game_name = profile.riot_game_name;
              }
              if (profile?.riot_tagline) {
                params.riot_tagline = profile.riot_tagline;
              }
              if (profile?.riot_puuid) {
                params.riot_puuid = profile.riot_puuid;
              }
              
              console.log(`Fetching League of Legends stats with params:`, params);
              
              try {
                const response = await axios.get(
                  `${process.env.REACT_APP_API_URL}/api/stats/lol`,
                  { params }
                );
                console.log(`Stats for ${stat.game} fetched:`, response.data);
                return { ...stat, data: response.data };
              } catch (error) {
                console.error(`Error fetching League of Legends stats:`, error);
                return { 
                  ...stat, 
                  data: { 
                    error: "Failed to load League of Legends stats", 
                    details: error instanceof Error ? error.message : String(error)
                  } 
                };
              }
            }
            else if (stat.game === "Valorant" && profile.riot_id) {
              console.log(`Fetching Valorant stats for Riot ID: ${profile.riot_id}`);
              
              try {
                const response = await axios.get(
                  `${process.env.REACT_APP_API_URL}/api/stats/valorant`,
                  { params: { riot_id: profile.riot_id } }
                );
                console.log(`Valorant stats fetched:`, response.data);
                
                if (response.data) {
                  return { ...stat, data: processValorantStats(response.data) };
                } else {
                  console.error("No data in Valorant response");
                  return { ...stat, data: { error: "No Valorant data available" } };
                }
              } catch (error) {
                console.error("Error fetching Valorant stats:", error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return { ...stat, data: { error: `Valorant API error: ${errorMessage}` } };
              }
            }
            else if (stat.game === "Call of Duty") {
              // Determine the account to use based on platform
              let username;
              let platform = stat.platform.toLowerCase();
              
              if (platform === "playstation" && profile.playstation_id) {
                username = profile.playstation_id;
              } else if (platform === "xbox" && profile.xbox_id) {
                username = profile.xbox_id;
              } else if (platform === "battle.net") {
                username = profile.ea_username; // Temporarily use EA username for testing
              }
              
              if (!username) {
                return { ...stat, data: { error: "No linked account for selected platform" } };
              }
              
              console.log(`Fetching Call of Duty stats for username: ${username} on platform: ${platform}`);
              const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/stats/cod`,
                { params: { username, platform } }
              );
              console.log(`Stats for ${stat.game} fetched:`, response.data);
              
              // Process response
              if (response.data) {
                return { ...stat, data: processCoDStats(response.data) };
              } else {
                return { ...stat, data: { error: "No data available" } };
              }
            } else {
              console.warn(`⚠️ Cannot fetch stats for ${stat.game}: Missing required account info`);
              return { ...stat, data: null };
            }
          } catch (error) {
            console.error(`❌ Error fetching updated stats for ${stat.game}:`, error);
            return { ...stat, data: null };
          }
        })
      ).then(updatedStats => {
        // This actually updates the state with the fetched data
        console.log("Updating stats with freshly fetched data:", updatedStats);
        setStats(updatedStats);
      })
      .catch(error => {
        console.error("Error in fetchUpdatedStats:", error);
      }); 
      
      // Return the current stats while the async operation is in progress
      return currentStats;
    });
  }, [profile]); // Only depend on profile, not stats
  
  // Process Dota 2 stats from the backend API
  const processDota2Stats = (data: any) => {
    if (!data) {
      return { error: "No data available" };
    }
    
    const result: any = {
      playerName: data.profile?.personaname || "Unknown Player",
      avatar: data.profile?.avatarfull || "",
      steamId: data.profile?.steamid || ""
    };
    
    // Process overall stats
    if (data.stats) {
      result.matches_played = data.stats.matches_played || 0;
      result.wins = data.stats.wins || 0;
      result.losses = data.stats.losses || 0;
      result.win_rate = data.stats.win_rate || 0;
      result.kills = data.stats.kills || 0;
      result.deaths = data.stats.deaths || 0;
      result.assists = data.stats.assists || 0;
      result.kda = data.stats.kda || 0;
      result.gpm = data.stats.gpm || 0; // Gold per minute
      result.xpm = data.stats.xpm || 0; // Experience per minute
    }
    
    // Process hero stats
    if (data.heroes && data.heroes.length > 0) {
      result.heroes = data.heroes.map((hero: any) => ({
        name: hero.name || "Unknown Hero",
        matches_played: hero.matches_played || 0,
        wins: hero.wins || 0,
        losses: hero.losses || 0,
        win_rate: hero.win_rate || 0,
        kills: hero.kills || 0,
        deaths: hero.deaths || 0,
        assists: hero.assists || 0,
        kda: hero.kda || 0
      }));
    }
    
    // Process recent matches
    if (data.recent_matches && data.recent_matches.length > 0) {
      result.recent_matches = data.recent_matches.map((match: any) => ({
        match_id: match.match_id || 0,
        hero_name: match.hero_name || "Unknown Hero",
        result: match.win ? "Win" : "Loss",
        duration: match.duration || 0,
        kills: match.kills || 0,
        deaths: match.deaths || 0,
        assists: match.assists || 0,
        gpm: match.gpm || 0,
        xpm: match.xpm || 0,
        date: match.start_time || ""
      }));
    }
    
    return result;
  };

  // Process Apex Legends stats from tracker.gg API
  const processApexStats = (data: any) => {
    const result: any = {};
    
    // Extract basic player info
    if (data.platformInfo) {
      result.playerName = data.platformInfo.platformUserHandle;
      result.platform = data.platformInfo.platformSlug;
    }
    
    // Extract segment data (overall stats)
    if (data.segments) {
      // Get overall stats
      const overviewSegment = data.segments.find((segment: any) => segment.type === "overview");
      if (overviewSegment && overviewSegment.stats) {
        const stats = overviewSegment.stats;
        
        // Map common stats
        if (stats.kills) result.kills = stats.kills.value;
        if (stats.damage) result.damage = stats.damage.value;
        if (stats.headshots) result.headshots = stats.headshots.value;
        if (stats.matchesPlayed) result.matches_played = stats.matchesPlayed.value;
        if (stats.level) result.level = stats.level.value;
        if (stats.rankScore) result.rank_score = stats.rankScore.value;
        if (stats.deaths) result.deaths = stats.deaths.value;
        if (stats.killsPerMatch) result.kills_per_match = stats.killsPerMatch.value;
        if (stats.winningKills) result.winning_kills = stats.winningKills.value;
        if (stats.wins) result.wins = stats.wins.value;
        if (stats.kd) result.kd = stats.kd.value;
      }
      
      // Get legend-specific stats
      const legendSegments = data.segments.filter((segment: any) => segment.type === "legend");
      if (legendSegments && legendSegments.length > 0) {
        result.legends = legendSegments.map((segment: any) => ({
          name: segment.metadata?.name || "Unknown Legend",
          imageUrl: segment.metadata?.imageUrl,
          stats: segment.stats ? Object.keys(segment.stats).reduce((acc: any, key: string) => {
            acc[key] = segment.stats[key].value;
            return acc;
          }, {}) : {}
        }));
      }
    }
    
    return result;
  };

  // Process Valorant stats from the backend API
  const processValorantStats = (data: any) => {
    console.log("Processing Valorant stats from raw data:", data);
    
    // Enhanced error checking and debugging
    if (!data) {
      console.error("Valorant data is null or undefined");
      return { error: "No Valorant data received" };
    }
    
    if (Object.keys(data).length === 0) {
      console.error("Valorant data is an empty object");
      return { error: "Empty Valorant data received" };
    }
    
    // Log extra debug information to help troubleshoot API response issues
    console.log("Raw Valorant API response keys:", Object.keys(data));
    console.log("Raw account data:", data.account);
    
    // Create a new simplified structure with all stats combined to make display easier
    const result: any = {};
    
    // Add account data
    if (data.account) {
      result.account = {
        name: data.account.gameName || "Unknown Player",
        tagLine: data.account.tagLine || "#NA",
        puuid: data.account.puuid || ""
      };
      
      console.log("Extracted account data:", result.account);
    } else {
      result.account = { name: "Unknown Player", tagLine: "#NA" };
    }
    
    // Copy profile data if available
    if (data.profile) {
      result.profile = {
        accountLevel: data.profile.accountLevel || 0,
        rank: data.profile.rank || "Unranked",
        rankTier: data.profile.rankTier || 0
      };
    } else {
      result.profile = { accountLevel: 0, rank: "Unranked", rankTier: 0 };
    }
    
    // Process match statistics
    if (data.matches) {
      result.matchStats = {
        winRate: data.matches.winRate || 0,
        kdRatio: data.matches.kdRatio || 0,
        totalMatches: data.matches.totalGames || 0,
        wins: data.matches.wins || 0,
        losses: data.matches.losses || 0,
        averageKills: data.matches.averageKills || 0,
        averageDeaths: data.matches.averageDeaths || 0,
        averageAssists: data.matches.averageAssists || 0,
        averageCombatScore: data.matches.averageCombatScore || 0
      };
    } else {
      result.matchStats = {
        winRate: 0,
        kdRatio: 0,
        totalMatches: 0,
        wins: 0,
        losses: 0
      };
    }
    
    // Process agent stats
    if (data.matches && data.matches.topAgents && data.matches.topAgents.length > 0) {
      result.agentStats = data.matches.topAgents.map((agent: any) => ({
        agentName: agent.agentName,
        matches: agent.matches,
        wins: agent.wins,
        winRate: agent.winRate,
        kda: agent.kda
      }));
    } else {
      result.agentStats = [];
    }
    
    // Process recent matches
    if (data.matches && data.matches.recentMatches && data.matches.recentMatches.length > 0) {
      result.recentMatches = data.matches.recentMatches.map((match: any) => ({
        matchId: match.matchId,
        agent: match.agent,
        gameMode: match.gameMode,
        mapId: match.mapId,
        kills: match.kills,
        deaths: match.deaths,
        assists: match.assists,
        kda: match.kda,
        combatScore: match.combatScore,
        won: match.won,
        gameLength: match.gameLength,
        timestamp: new Date(match.gameStartTime * 1000)
      }));
    } else {
      result.recentMatches = [];
    }
    
    console.log("Processed Valorant data:", result);
    return result;
  };

  // Process League of Legends stats
  const processLeagueStats = (data: any) => {
    console.log("Processing League of Legends stats from raw data:", data);
    
    // Enhanced error checking and debugging
    if (!data) {
      console.error("League data is null or undefined");
      return { error: "No League of Legends data received" };
    }
    
    if (Object.keys(data).length === 0) {
      console.error("League data is an empty object");
      return { error: "Empty League of Legends data received" };
    }
    
    // Log extra debug information to help troubleshoot API response issues
    console.log("Raw League API response keys:", Object.keys(data));
    console.log("Raw summoner data:", data.summoner);
    
    // Create a new simplified structure with all stats combined to make display easier
    const result: any = {};
    
    // Add summoner data with better handling of different response formats
    if (data.summoner) {
      // Create a clean summoner object with all required fields
      result.summoner = {
        // Extract name from various possible locations in response
        name: data.summoner.name || data.summoner.gameName || data.name || data.gameName || "Unknown Summoner",
        summonerLevel: data.summoner.summonerLevel || data.summonerLevel || 0,
        profileIconId: data.summoner.profileIconId || data.profileIconId || 1, // Default icon if missing
        lastPlayTime: data.summoner.revisionDate || data.revisionDate || new Date().toISOString()
      };
      
      // Log summoner info for debugging
      console.log("Extracted summoner data:", result.summoner);
    } else {
      // Create a default summoner object if missing entirely
      result.summoner = { name: "Unknown Summoner", summonerLevel: 0, profileIconId: 1 };
    }
    
    // Copy ranked data if available
    if (data.ranked && data.ranked.length > 0) {
      result.ranked = data.ranked;
    } else {
      result.ranked = []; // Empty array if no ranked data
    }
    
    // Combine match stats from all sources
    let matchStats: any = {};
    
    // Import regular match stats if available
    if (data.matches) {
      matchStats = { ...data.matches };
    }
    
    // Import quick play stats if available and merge them with match stats
    if (data.quickPlay) {
      // If we have both quickPlay and match data, combine them
      if (matchStats.totalGames) {
        // Calculate weighted averages for combined stats
        const totalGames = (matchStats.totalGames || 0) + (data.quickPlay.totalGames || 0);
        const totalWins = (matchStats.wins || 0) + (data.quickPlay.wins || 0);
        
        // Combine stats with weighting by number of games
        if (totalGames > 0) {
          matchStats.totalGames = totalGames;
          matchStats.wins = totalWins;
          matchStats.losses = totalGames - totalWins;
          
          // Weight the averages by number of games in each category
          const getWeightedAvg = (matchStat: string) => {
            const matchValue = matchStats[matchStat] || 0;
            const quickValue = data.quickPlay[matchStat] || 0;
            const matchWeight = matchStats.totalGames / totalGames;
            const quickWeight = data.quickPlay.totalGames / totalGames;
            return (matchValue * matchWeight) + (quickValue * quickWeight);
          };
          
          // Calculate weighted averages for key stats
          matchStats.averageKills = getWeightedAvg('averageKills');
          matchStats.averageDeaths = getWeightedAvg('averageDeaths');
          matchStats.averageAssists = getWeightedAvg('averageAssists');
        }
      } else {
        // If we only have quickPlay stats, just use those
        matchStats = { ...data.quickPlay };
      }
    }
    
    // Calculate additional stats from our combined data
    if (matchStats) {
      // Calculate KDA if we have the raw components
      if (!matchStats.kda && matchStats.averageDeaths !== undefined) {
        const deaths = matchStats.averageDeaths || 1; // Avoid division by zero
        const kills = matchStats.averageKills || 0;
        const assists = matchStats.averageAssists || 0;
        matchStats.kda = Number(((kills + assists) / Math.max(1, deaths)).toFixed(2));
      }
      
      // Calculate win rate from total games and wins
      if (matchStats.totalGames && matchStats.wins !== undefined) {
        matchStats.winRate = Number((matchStats.wins / matchStats.totalGames * 100).toFixed(1));
      }
    }
    
    // Add processed match stats to the result
    result.matches = matchStats;
    
    // Add champion stats if available
    if (data.champions && data.champions.length > 0) {
      result.champions = data.champions;
    }
    
    // Log the final processed structure
    console.log("Final processed League data:", result);
    
    return result;
  };
  
  // Process Call of Duty stats
  const processCoDStats = (data: any) => {
    const result: any = {};
    
    console.log("Processing Call of Duty stats from data:", data);
    
    // Process lifetime stats
    if (data.lifetime) {
      result.level = data.lifetime.level;
      result.prestige = data.lifetime.prestige;
      result.time_played = data.lifetime.time_played;
      result.games_played = data.lifetime.games_played;
      result.wins = data.lifetime.wins;
      result.losses = data.lifetime.losses;
      result.win_rate = data.lifetime.win_percentage;
      result.kills = data.lifetime.kills;
      result.deaths = data.lifetime.deaths;
      result.kd_ratio = data.lifetime.kd_ratio;
      result.accuracy = data.lifetime.accuracy;
      result.headshots = data.lifetime.headshots;
    }
    
    // Process weapon stats
    if (data.weapons && data.weapons.length > 0) {
      result.weapons = data.weapons.map((weapon: any) => ({
        name: weapon.name,
        kills: weapon.kills,
        accuracy: weapon.accuracy,
        headshots: weapon.headshots
      }));
    }
    
    // Process map stats
    if (data.maps && data.maps.length > 0) {
      result.maps = data.maps.map((map: any) => ({
        name: map.name,
        wins: map.wins,
        losses: map.losses,
        win_rate: map.win_percentage
      }));
    }
    
    return result;
  };

  const saveStatSelection = async (game: string, platform: string) => {
    if (!profile) {
      throw new Error("❌ Profile must be loaded before saving stats.");
    }
    
    // Check if required accounts are linked based on game and platform
    if ((game === "CS2" || game === "Dota 2") && !profile.steam_id) {
      throw new Error(`❌ Steam account must be linked before saving ${game} stats.`);
    }
    
    // For League of Legends, completely bypass the Riot ID check
    if (game === "League of Legends") {
      console.log("BYPASS: Skipping Riot ID validation for League of Legends");
      // Deliberately NOT checking profile.riot_id for League of Legends
    }
    // Normal check for other Riot games
    else if (game === "Valorant") {
      console.log(`Checking Riot ID for Valorant:`, profile.riot_id);
      
      if (!profile.riot_id) {
        throw new Error(`❌ Riot account must be linked before saving Valorant stats.`);
      } else {
        console.log(`✅ Riot ID validation passed: ${profile.riot_id}`);
      }
    }
    
    if (game === "Apex Legends") {
      const platformLower = platform.toLowerCase();
      if (platformLower === "ea" && !profile.ea_username) {
        throw new Error("❌ EA account must be linked before saving Apex Legends stats.");
      }
      if (platformLower === "playstation" && !profile.playstation_id) {
        throw new Error("❌ PlayStation account must be linked before saving Apex Legends stats.");
      }
      if (platformLower === "xbox" && !profile.xbox_id) {
        throw new Error("❌ Xbox account must be linked before saving Apex Legends stats.");
      }
    }
    
    
    // Validation logic for Riot games
    if (game === "Valorant" || game === "League of Legends") {
      // For both Riot games, we need to check for ALL possible Riot account fields
      // as the backend now uses the newer fields (riot_game_name, riot_tagline, riot_puuid)
      // but may still have the older riot_id field
      
      // Log all Riot fields for debugging
      console.log(`Checking ALL Riot fields for ${game}:`, {
        // The older field
        "riot_id": profile.riot_id,
        
        // Check if newer fields exist in the profile object
        "has_game_name": Object.prototype.hasOwnProperty.call(profile, 'riot_game_name'),
        "has_tagline": Object.prototype.hasOwnProperty.call(profile, 'riot_tagline'),
        "has_puuid": Object.prototype.hasOwnProperty.call(profile, 'riot_puuid'),
        
        // And their values if they exist
        "game_name_value": profile.riot_game_name,
        "tagline_value": profile.riot_tagline, 
        "puuid_value": profile.riot_puuid
      });
      
      // Check if ANY of the Riot fields exist and have values
      const hasRiotId = !!profile.riot_id;
      const hasRiotGameName = Object.prototype.hasOwnProperty.call(profile, 'riot_game_name') && !!profile.riot_game_name;
      const hasRiotTagline = Object.prototype.hasOwnProperty.call(profile, 'riot_tagline') && !!profile.riot_tagline;
      const hasRiotPuuid = Object.prototype.hasOwnProperty.call(profile, 'riot_puuid') && !!profile.riot_puuid;
      
      const hasAnyRiotField = hasRiotId || hasRiotGameName || hasRiotTagline || hasRiotPuuid;
      
      console.log(`Riot field detection results for ${game}:`, {
        hasRiotId,
        hasRiotGameName,
        hasRiotTagline,
        hasRiotPuuid,
        hasAnyRiotField
      });
      
      if (!hasAnyRiotField) {
        console.error(`No Riot account fields found for ${game}`);
        throw new Error(`\u274c Riot account must be linked before saving ${game} stats.`);
      } else {
        console.log(`\u2705 Riot account validation passed for ${game}`);
      }
    }
    
    if (game === "Call of Duty") {
      const platformLower = platform.toLowerCase();
      if (platformLower === "playstation" && !profile.playstation_id) {
        throw new Error("❌ PlayStation account must be linked before saving Call of Duty stats.");
      }
      if (platformLower === "xbox" && !profile.xbox_id) {
        throw new Error("❌ Xbox account must be linked before saving Call of Duty stats.");
      }
    }

    try {
      console.log(`Saving stat selection: game=${game}, platform=${platform}`);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/user/stats/save`, { game, platform }, {
        withCredentials: true,
      });
      
      // Add the new stat to the state with the ID from the response
      setStats(prevStats => {
        const newStat: FrontendStat = { 
          ID: response.data.ID, 
          game, 
          platform, 
          data: null 
        };
        const newStats = [...prevStats, newStat];
        console.log("Stats after adding new selection:", newStats);
        return newStats;
      });
      
      // Trigger a fetch of updated stats after adding a new one
      // This is now safe because fetchUpdatedStats doesn't depend on stats
      console.log("Triggering fetchUpdatedStats after saving stat selection");
      setTimeout(() => fetchUpdatedStats(), 500);
    } catch (error) {
      console.error("❌ Error saving stat selection:", error);
      throw error;
    }
  };

  const deleteStatCard = async (id: number) => {
    try {
      console.log(`Deleting stat card with ID: ${id}`);
      await axios.delete(`${process.env.REACT_APP_API_URL}/user/stats/${id}`, {
        withCredentials: true,
      });
      
      // Remove the deleted stat from the state
      setStats(prevStats => {
        const newStats = prevStats.filter(stat => stat.ID !== id);
        console.log("Stats after deletion:", newStats);
        return newStats;
      });
    } catch (error) {
      console.error("❌ Error deleting stat card:", error);
      throw error;
    }
  };

  // Track which games have been fetched to prevent duplicate calls
  const [fetchedGames, setFetchedGames] = useState<Record<string, number>>({});
  
  // Create a wrapped version of fetchUpdatedStats that prevents duplicate API calls
  const throttledFetchStats = useCallback(async () => {
    if (!profile) return;
    
    console.log("Running throttled fetch stats");
    
    // Only fetch stats for games that haven't been fetched recently (within 30 seconds)
    const now = Date.now();
    const staleFetchWindow = 30000; // 30 seconds
    
    // Determine which games we need to update based on recency
    const gamesToUpdate = stats.filter(stat => {
      const gameKey = `${stat.game}_${stat.platform}`;
      const lastFetchTime = fetchedGames[gameKey] || 0;
      const shouldUpdate = now - lastFetchTime > staleFetchWindow;
      
      console.log(`Game ${stat.game}: Last fetched ${(now - lastFetchTime)/1000}s ago, should update: ${shouldUpdate}`);
      return shouldUpdate;
    });
    
    if (gamesToUpdate.length === 0) {
      console.log("All games have been recently fetched, skipping API calls");
      return;
    }
    
    // Update the fetch timestamps before making API calls to prevent race conditions
    const newFetchedGames = {...fetchedGames};
    gamesToUpdate.forEach(stat => {
      const gameKey = `${stat.game}_${stat.platform}`;
      newFetchedGames[gameKey] = now;
    });
    setFetchedGames(newFetchedGames);
    
    console.log(`Fetching updated stats for ${gamesToUpdate.length} games:`, 
      gamesToUpdate.map(s => s.game).join(", "));
    
    // Now call the actual update function
    await fetchUpdatedStats();
  }, [profile, stats, fetchedGames, fetchUpdatedStats]);
  
  // Initial setup - fetch profile and user stats only once
  useEffect(() => {
    console.log("Initial fetch of profile and user stats");
    fetchProfile();
    fetchUserStats();
  }, [fetchProfile, fetchUserStats]);

  // Only update game stats once on initial load
  const [initialStatsFetched, setInitialStatsFetched] = useState(false);
  useEffect(() => {
    if (profile && stats.length > 0 && !initialStatsFetched) {
      console.log("Initial stats available, performing first fetch");
      // Force immediate fetch of game stats after profile and stats are loaded
      fetchUpdatedStats().then(() => {
        console.log("✅ Initial stats fetch completed successfully");
      }).catch(error => {
        console.error("❌ Error during initial stats fetch:", error);
      });
      setInitialStatsFetched(true);
    }
  }, [profile, stats.length, initialStatsFetched, fetchUpdatedStats]);

  // Use the throttled fetch for refreshing to prevent duplicate calls
  return { 
    stats, 
    profile, 
    // Replace the direct fetchUpdatedStats with our throttled version for external use
    fetchUpdatedStats: throttledFetchStats, 
    saveStatSelection, 
    deleteStatCard 
  };
};

export default useStats;