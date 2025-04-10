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
      setProfile(response.data);
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
    // Use the current stats from state parameter instead of the stats variable
    // to avoid closure issues and prevent infinite loops
    setStats(currentStats => {
      // Don't update if there are no stats
      if (currentStats.length === 0) {
        console.log("No stats to update");
        return currentStats;
      }
      
      console.log("Updating stats for:", currentStats);
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
              }
              
              return { ...stat, data: null };
            }
            else {
              console.warn(`⚠️ Cannot fetch stats for ${stat.game}: Missing required account info`);
              return { ...stat, data: null };
            }
          } catch (error) {
            console.error(`❌ Error fetching updated stats for ${stat.game}:`, error);
            return { ...stat, data: null };
          }
        })
      ).then(updatedStats => {
        // Only update state if we have results and component is still mounted
        if (updatedStats.length > 0) {
          console.log("Setting updated stats:", updatedStats);
          setStats(updatedStats);
        }
      }).catch(error => {
        console.error("❌ Error updating stats:", error);
      });
      
      // Return the current stats while the async operation is in progress
      return currentStats;
    });
  }, [profile]); // Only depend on profile, not stats
  
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

  const saveStatSelection = async (game: string, platform: string) => {
    if (!profile) {
      throw new Error("❌ Profile must be loaded before saving stats.");
    }
    
    // Check if required accounts are linked
    if (game === "CS2" && !profile.steam_id) {
      throw new Error("❌ Steam account must be linked before saving CS2 stats.");
    }
    
    if (game === "Apex Legends" && !profile.ea_username) {
      throw new Error("❌ EA account must be linked before saving Apex Legends stats.");
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

  useEffect(() => {
    console.log("Initial fetch of profile and user stats");
    fetchProfile();
    fetchUserStats();
  }, [fetchProfile, fetchUserStats]);

  // Only run this effect when profile changes, not when stats change
  useEffect(() => {
    if (profile && stats.length > 0) {
      console.log("Profile or stats changed, fetching updated stats");
      fetchUpdatedStats();
    }
  }, [profile, fetchUpdatedStats, stats.length]);

  return { stats, profile, fetchUpdatedStats, saveStatSelection, deleteStatCard };
};

export default useStats;
