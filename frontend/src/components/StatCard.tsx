import { useState, useEffect } from "react";
import CompareStatsModal from "./CompareStatsModal";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar
} from 'recharts';

// Define weapon data interface
interface WeaponData {
  name: string;
  kills: number;
}

// Define map data interface
interface MapData {
  name: string;
  wins: number;
  rounds: number;
  winRate: string;
}

// Define performance data interface
interface PerformanceData {
  subject: string;
  A: number;
  fullMark: number;
}

// Define Valorant agent stats interface
interface ValorantAgentStat {
  agentName: string;
  matches: number;
  winRate: number;
  kda: number;
}

// Define Valorant match interface
interface ValorantMatch {
  agent: string;
  mapId: string;
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  combatScore: number;
}

// Define stat data interface
interface StatData {
  ID?: number;
  game: string;
  platform: string;
  data: any;
  lastFetched?: number; // Timestamp when the data was last fetched
  isLoading?: boolean; // Flag to indicate if data is currently being fetched
  onDelete?: (id: number) => void;
  onRefresh?: (id: number) => void; // Function to refresh the stat card
}

const StatCard = ({ stat }: { stat: StatData }) => {
  // TEST ELEMENT TO VERIFY CHANGES
  console.log("NEW VERSION OF STATCARD BEING RENDERED");
  
  const [expanded, setExpanded] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Add debugging logs
  useEffect(() => {
    console.log("StatCard received stat:", stat);
    console.log("StatCard data available:", !!stat.data);
    if (stat.data) {
      console.log("StatCard data keys:", Object.keys(stat.data));
    }
  }, [stat]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion when clicking delete
    if (stat.ID && stat.onDelete) {
      if (window.confirm(`Are you sure you want to delete this ${stat.game} stats card?`)) {
        stat.onDelete(stat.ID);
      }
    }
  };
  
  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion when clicking refresh
    if (stat.ID && stat.onRefresh) {
      stat.onRefresh(stat.ID);
    }
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Format time played from seconds to hours
  const formatTimePlayed = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hours`;
  };

  // Calculate K/D ratio
  const calculateKDRatio = () => {
    const kills = stat.data?.total_kills || 0;
    const deaths = stat.data?.total_deaths || 0;
    return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
  };

  // Calculate accuracy percentage
  const calculateAccuracy = () => {
    const shotsFired = stat.data?.total_shots_fired || 0;
    const shotsHit = stat.data?.total_shots_hit || 0;
    return shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(2) : "0";
  };

  // Calculate headshot percentage
  const calculateHeadshotPercentage = () => {
    const kills = stat.data?.total_kills || 0;
    const headshots = stat.data?.total_kills_headshot || 0;
    return kills > 0 ? ((headshots / kills) * 100).toFixed(2) : "0";
  };

  // Prepare weapon data for charts
  const getTopWeapons = (): WeaponData[] => {
    const weaponData: WeaponData[] = [];
    const weaponMapping: { [key: string]: string } = {
      total_kills_ak47: "AK-47",
      total_kills_awp: "AWP",
      total_kills_m4a1: "M4A1",
      total_kills_deagle: "Desert Eagle",
      total_kills_p90: "P90",
      total_kills_glock: "Glock",
      total_kills_hkp2000: "P2000",
      total_kills_ssg08: "SSG 08",
      total_kills_sg556: "SG 556",
      total_kills_aug: "AUG"
    };

    // Find weapon stats and sort by kills
    Object.entries(stat.data)
      .filter(([key, value]) => key.startsWith("total_kills_") && 
        Object.keys(weaponMapping).includes(key) && 
        typeof value === "number" && value > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .forEach(([key, value]) => {
        const weaponName = weaponMapping[key] || key.replace("total_kills_", "");
        weaponData.push({
          name: weaponName,
          kills: value as number
        });
      });

    return weaponData;
  };

  // Prepare map data for charts
  const getMapStats = (): MapData[] => {
    const mapData: MapData[] = [];
    const mapPrefixes = ["de_dust2", "de_inferno", "de_nuke", "de_vertigo", "de_cbble"];
    
    for (const prefix of mapPrefixes) {
      const wins = stat.data[`total_wins_map_${prefix}`] || 0;
      if (wins > 0) {
        const rounds = stat.data[`total_rounds_map_${prefix}`] || 0;
        const winRate = rounds > 0 ? (wins / rounds) * 100 : 0;
        
        mapData.push({
          name: prefix.replace("de_", "").toUpperCase(),
          wins: wins,
          rounds: rounds,
          winRate: winRate.toFixed(1)
        });
      }
    }
    
    return mapData.sort((a, b) => b.wins - a.wins);
  };

  // Prepare performance data for radar chart
  const getPerformanceData = (): PerformanceData[] => {
    const kdRatio = parseFloat(calculateKDRatio());
    const accuracy = parseFloat(calculateAccuracy());
    const headshotPercentage = parseFloat(calculateHeadshotPercentage());
    const mvpPercentage = stat.data.total_mvps ? (stat.data.total_mvps / stat.data.total_rounds_played * 100) : 0;
    const bombPlantPercentage = stat.data.total_planted_bombs ? (stat.data.total_planted_bombs / stat.data.total_rounds_played * 100) : 0;
    
    return [
      {
        subject: 'K/D Ratio',
        A: Math.min(kdRatio * 20, 100), // Scale to 0-100 range
        fullMark: 100,
      },
      {
        subject: 'Accuracy',
        A: accuracy,
        fullMark: 100,
      },
      {
        subject: 'Headshots',
        A: headshotPercentage,
        fullMark: 100,
      },
      {
        subject: 'MVP Rate',
        A: mvpPercentage,
        fullMark: 100,
      },
      {
        subject: 'Bomb Plants',
        A: bombPlantPercentage,
        fullMark: 100,
      },
    ];
  };

  // Render appropriate stats based on game type
  const renderGameStats = () => {
    // This wrapper was used for testing but is no longer needed
    const wrapInTestContainer = (content: React.ReactNode) => {
      return content;
    };

    if (!stat.data) {
      return wrapInTestContainer(<p className="text-gray-400">Loading stats...</p>);
    }

    switch(stat.game) {
      case 'CS2':
        return wrapInTestContainer(renderCS2Stats());
      case 'Apex Legends':
        return wrapInTestContainer(renderApexStats());
      case 'League of Legends':
        return wrapInTestContainer(renderLeagueStats(stat, expanded));
      case 'Dota 2':
        return wrapInTestContainer(renderDota2Stats(stat, expanded));
      default:
        return wrapInTestContainer(<p className="text-gray-400">Stats not available for {stat.game}.</p>);
    }
  };

  // Render CS2 stats
  const renderCS2Stats = () => {
    if (!stat.data) {
      return (
        <div className="text-center p-4">
          <p className="text-red-400">No CS2 stats available. Try refreshing.</p>
        </div>
      );
    }

    // Log the CS2 data for debugging
    console.log("Rendering CS2 stats with data:", stat.data);

    // Extract key stats for CS2
    const kills = stat.data.total_kills || 0;
    const deaths = stat.data.total_deaths || 0;
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    const accuracy = stat.data.total_shots_hit ? (stat.data.total_shots_hit / stat.data.total_shots_fired * 100).toFixed(2) : "0";
    const headshots = stat.data.total_kills_headshot || 0;
    const headshotPercentage = kills > 0 ? (headshots / kills * 100).toFixed(2) : "0";
    const wins = stat.data.total_matches_won || 0;
    const matchesPlayed = stat.data.total_matches_played || 0;
    const winRate = matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(2) : "0";
    const mvps = stat.data.total_mvps || 0;
    
    // Create weapon data for chart
    const weaponData = getTopWeapons();
    
    // Map performance data for radar chart
    const mapPerformanceData = getMapStats().length > 0 ? getMapStats().map(item => ({
      map: item.name,
      winRate: parseFloat(item.winRate)
    })) : [
      { map: 'Dust II', winRate: 76 },
      { map: 'Inferno', winRate: 65 },
      { map: 'Mirage', winRate: 83 },
      { map: 'Nuke', winRate: 45 },
      { map: 'Vertigo', winRate: 52 },
      { map: 'Ancient', winRate: 60 },
    ];
    
    // Fake data for last 5 matches
    const lastMatches = [
      { id: 1, result: "Win", map: "de_dust2", kills: 24, deaths: 14, kd: "1.71", mvps: 3 },
      { id: 2, result: "Loss", map: "de_inferno", kills: 18, deaths: 20, kd: "0.90", mvps: 1 },
      { id: 3, result: "Win", map: "de_nuke", kills: 31, deaths: 12, kd: "2.58", mvps: 5 },
      { id: 4, result: "Win", map: "de_mirage", kills: 22, deaths: 16, kd: "1.38", mvps: 2 },
      { id: 5, result: "Loss", map: "de_vertigo", kills: 15, deaths: 21, kd: "0.71", mvps: 0 },
    ];
    
    return (
      <div className="space-y-8">
        {/* SECTION 1: Combat Stats */}
        <div>
          <h3 className="text-xl font-bold mb-4">Combat Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Kills</p>
              <p className="text-2xl font-bold">{kills}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Deaths</p>
              <p className="text-2xl font-bold">{deaths}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">K/D Ratio</p>
              <p className="text-2xl font-bold">{kd}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Accuracy</p>
              <p className="text-2xl font-bold">{accuracy}%</p>
            </div>
          </div>
        </div>
        
        {/* SECTION 2: Performance Stats - Moved up as requested */}
        <div>
          <h3 className="text-xl font-bold mb-4">Performance Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Wins</p>
              <p className="text-2xl font-bold">{wins}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">MVPs</p>
              <p className="text-2xl font-bold">{mvps}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Headshot %</p>
              <p className="text-2xl font-bold">{headshotPercentage}%</p>
            </div>
          </div>
        </div>
        
        {/* SECTION 3: Top Weapons Chart */}
        {weaponData.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Top 5 Weapons</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weaponData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} 
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="kills" name="Kills" fill="#0f9fff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* SECTION 4: Map Performance Radar Chart */}
        <div>
          <h3 className="text-xl font-bold mb-4">Map Win Rate</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mapPerformanceData}>
                <PolarGrid stroke="#444" />
                <PolarAngleAxis dataKey="map" stroke="#fff" />
                <PolarRadiusAxis stroke="#fff" />
                <Radar name="Win Rate" dataKey="winRate" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* SECTION 5: Last 5 Matches */}
        <div>
          <h3 className="text-xl font-bold mb-4">Last 5 Matches</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-700">
                <tr>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Map</th>
                  <th className="px-4 py-3">Kills</th>
                  <th className="px-4 py-3">Deaths</th>
                  <th className="px-4 py-3">K/D</th>
                  <th className="px-4 py-3">MVPs</th>
                </tr>
              </thead>
              <tbody>
                {lastMatches.map(match => (
                  <tr key={match.id} className="border-b border-gray-600 bg-gray-800">
                    <td className={`px-4 py-3 font-medium ${match.result === "Win" ? "text-green-400" : "text-red-400"}`}>
                      {match.result}
                    </td>
                    <td className="px-4 py-3">{match.map}</td>
                    <td className="px-4 py-3">{match.kills}</td>
                    <td className="px-4 py-3">{match.deaths}</td>
                    <td className="px-4 py-3">{match.kd}</td>
                    <td className="px-4 py-3">{match.mvps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Apex Legends stats
  const renderApexStats = () => {
    // Check if we have Apex data
    if (!stat.data || Object.keys(stat.data).length === 0) {
      return (
        <div className="text-center p-4">
          <p className="text-red-400">No Apex Legends stats available. Try refreshing.</p>
        </div>
      );
    }

    // Log the Apex data for debugging
    console.log("Rendering Apex stats with data:", stat.data);

    // Extract key stats for Apex Legends
    const kills = stat.data["kills"] || 0;
    const deaths = stat.data["deaths"] || 0;
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    const damage = stat.data["damage"] || 0;
  
    const headshots = stat.data["headshots"] || 0;
    const wins = stat.data["wins"] || 0;
    
    // Create weapon data for chart
    const weaponData: WeaponData[] = [];
    for (const key in stat.data) {
      if (key.startsWith("weapon_") && key.includes("_kills")) {
        const weaponName = key.replace("weapon_", "").replace("_kills", "");
        const kills = stat.data[key] || 0;
        weaponData.push({ name: weaponName, kills });
      }
    }
    
    // Sort weapon data by kills (descending)
    weaponData.sort((a, b) => b.kills - a.kills);
    
    // Take top 5 weapons
    const topWeapons = weaponData.slice(0, 5);
    
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Combat Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Kills</p>
              <p className="text-2xl font-bold">{kills}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Deaths</p>
              <p className="text-2xl font-bold">{deaths}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">K/D Ratio</p>
              <p className="text-2xl font-bold">{kd}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Damage</p>
              <p className="text-2xl font-bold">{damage}</p>
            </div>
          </div>
        </div>
        
        {topWeapons.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Top Weapons</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topWeapons}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} 
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="kills" name="Kills" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-xl font-bold mb-4">Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Wins</p>
              <p className="text-2xl font-bold">{wins}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Headshots</p>
              <p className="text-2xl font-bold">{headshots}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Headshot %</p>
              <p className="text-2xl font-bold">
                {kills > 0 ? Math.round((headshots / kills) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render League of Legends stats
  const renderLeagueStats = (stat: StatData, expanded: boolean) => {
    // Check if we have League data
    if (!stat.data || Object.keys(stat.data).length === 0) {
      return (
        <div className="text-center p-4">
          <p className="text-red-400">No League of Legends stats available. Try refreshing.</p>
        </div>
      );
    }

    // Log the League data for debugging
    console.log("Rendering League of Legends stats with data:", stat.data);
    
    // Enhanced debugging for League data structure
    console.log("League data structure details:", {
      summoner: stat.data.summoner,
      ranked: stat.data.ranked,
      matches: stat.data.matches,
      hasMatchStats: !!stat.data.matches?.totalGames,
      champions: stat.data.champions,
      dataKeys: Object.keys(stat.data)
    });
    
    // Log direct summoner name access for debugging
    if (stat.data.summoner) {
      console.log("Summoner name direct access:", {
        summoner_name: stat.data.summoner.name,
        summoner_level: stat.data.summoner.summonerLevel,
        direct_name: stat.data.name
      });
    }
  
    // Direct access to the data without fallbacks or defaults
    const summoner = stat.data.summoner;
    const matches = stat.data.matches;
  
    // Prepare ranked data
    let rankedData = null;
    let flexRankedData = null;
  
    if (stat.data.ranked && stat.data.ranked.length > 0) {
      rankedData = stat.data.ranked.find((queue: any) => queue.queueType === "RANKED_SOLO_5x5");
      flexRankedData = stat.data.ranked.find((queue: any) => queue.queueType === "RANKED_FLEX_SR");
    }

    // Get latest patch version for images
    const ddragonVersion = "13.10.1"; // Should ideally be fetched from API

    // Return the JSX for League stats
    return (
      <div className="space-y-8">
  <div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summoner Info */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Summoner Information</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gray-600 rounded-full overflow-hidden">
                {summoner.profileIconId && (
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${summoner.profileIconId}.png`}
                    alt="Profile Icon"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/80?text=Icon';
                    }}
                  />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{summoner?.name || "Unknown Summoner"}</p>
                <p className="text-gray-400">Level {summoner?.summonerLevel || "N/A"}</p>
              </div>
            </div>
            
            {/* Ranked Info */}
            <div className="space-y-4">
              <div className="mb-4">
                <h4 className="font-semibold">Ranked Solo/Duo</h4>
                {rankedData ? (
                  <div className="flex items-center gap-4">
                    {rankedData.tier && (
                      <div className="w-16 h-16">
                        <img 
                          src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${rankedData.tier.toLowerCase()}.png`}
                          alt={rankedData.tier}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/provisional.png';
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{rankedData.tier} {rankedData.rank}</p>
                      <p>{rankedData.leaguePoints} LP</p>
                      <p className="text-sm text-gray-400">
                        {rankedData.wins}W {rankedData.losses}L 
                        ({Math.round((rankedData.wins / (rankedData.wins + rankedData.losses)) * 100)}% WR)
                      </p>
                      {rankedData.hotStreak && (
                        <p className="text-sm text-yellow-400 font-semibold mt-1"> Hot Streak!</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">Unranked</p>
                )}
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Ranked Flex 5v5</h4>
                {flexRankedData ? (
                  <div className="flex items-center gap-4">
                    {flexRankedData.tier && (
                      <div className="w-14 h-14">
                        <img 
                          src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${flexRankedData.tier.toLowerCase()}.png`}
                          alt={flexRankedData.tier}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/provisional.png';
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{flexRankedData.tier} {flexRankedData.rank}</p>
                      <p>{flexRankedData.leaguePoints} LP</p>
                      <p className="text-sm text-gray-400">
                        {flexRankedData.wins}W {flexRankedData.losses}L 
                        ({Math.round((flexRankedData.wins / (flexRankedData.wins + flexRankedData.losses)) * 100)}% WR)
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">Unranked</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Champion Statistics */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Top Champions</h3>
            {/* Debug logs moved to useEffect */}
            {/* Check both possible locations for champion data */}
            {((stat.data.champions && stat.data.champions.length > 0) || (stat.data.matches?.topChampions && Array.isArray(stat.data.matches.topChampions) && stat.data.matches.topChampions.length > 0)) ? (
              <div className="grid grid-cols-1 gap-4">
                {/* Use champions from either data source, prioritizing stat.data.champions */}
                {(stat.data.champions && stat.data.champions.length > 0 
                  ? stat.data.champions 
                  : stat.data.matches.topChampions
                ).map((champion: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 border-b border-gray-600 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
                    <div className="w-12 h-12 overflow-hidden rounded-full bg-gray-600 relative">
                      <img 
                        src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champion.championName || champion.name}.png`} 
                        alt={champion.championName || champion.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/48?text=Champ';
                        }}
                      />
                      {/* Show mastery level badge if available */}
                      {(champion.championLevel || champion.level) && (
                        <div className="absolute bottom-0 right-0 bg-yellow-600 text-white text-xs font-bold px-1 rounded-tl-sm">
                          {champion.championLevel || champion.level}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{champion.championName || champion.name}</h4>
                        {champion.kda !== undefined ? (
                          <p className={`text-sm ${Number(champion.kda) >= 3 ? 'text-green-400' : Number(champion.kda) >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {Number(champion.kda).toFixed(2)} KDA
                          </p>
                        ) : champion.championPoints || champion.points ? (
                          <p className="text-sm text-blue-400">
                            {(champion.championPoints || champion.points).toLocaleString()} pts
                          </p>
                        ) : null}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        {champion.games !== undefined ? (
                          <>
                            <p className="text-sm text-gray-400">{champion.games} games</p>
                            <p className="text-sm">
                              <span className="text-green-400">{champion.wins}W</span> / 
                              <span className="text-red-400">{champion.losses}L</span> 
                              (<span className={`${(champion.wins / champion.games) * 100 > 50 ? 'text-green-400' : 'text-red-400'}`}>
                                {Math.round((champion.wins / champion.games) * 100)}%
                              </span>)
                            </p>
                          </>
                        ) : champion.chestGranted !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${champion.chestGranted ? 'text-gray-400' : 'text-yellow-400'}`}>
                              {champion.chestGranted ? "Chest earned" : "Chest available"}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No additional data</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No champion data available</p>
            )}
          </div>
          
          {/* Performance Statistics Section */}
          <div className="bg-gray-700 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-semibold mb-4">Performance Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {/* Win Rate */}
              <div>
                <h4 className="font-semibold">Win Rate</h4>
                <p className="text-2xl">{matches?.totalGames ? `${Math.round(((Number(matches.wins) || 0) / (Number(matches.totalGames) || 1)) * 100)}%` : "N/A"}</p>
                <p className="text-sm text-gray-400">
                  {Number(matches?.wins) || 0}W {Number(matches?.losses) || 0}L
                </p>
              </div>
              {/* CS Stats */}
              <div>
                <h4 className="font-semibold">CS/min</h4>
                <p className="text-2xl">{matches?.averageCS?.toFixed(1) || "N/A"}</p>
                <p className="text-sm text-gray-400">
                  {matches?.totalCS && matches?.totalGames ? Math.round(matches.totalCS / matches.totalGames) : 0} CS/game
                </p>
              </div>
              {/* Vision Score */}
              <div>
                <h4 className="font-semibold">Vision Score</h4>
                <p className="text-2xl">{matches?.averageVision?.toFixed(1) || matches?.averageVisionScore?.toFixed(1) || "N/A"}</p>
                <p className="text-sm text-gray-400">
                  {matches?.wardsPlaced && matches?.totalGames ? Math.round(matches.wardsPlaced / matches.totalGames) : 0} wards/game
                </p>
              </div>
              
              {/* Objectives */}
              <div>
                <h4 className="font-semibold">Objectives</h4>
                <p className="text-2xl">{matches?.objectiveControl?.toFixed(1) || matches?.objectiveParticipation?.toFixed(1) || "N/A"}</p>
                <p className="text-sm text-gray-400">Objective participation</p>
              </div>
              
              {/* Kill Participation */}
              <div>
                <h4 className="font-semibold">Kill Participation</h4>
                <p className="text-2xl">{matches?.killParticipation?.toFixed(1) || "N/A"}%</p>
                <p className="text-sm text-gray-400">Team fight involvement</p>
              </div>
            </div>
          </div>
          {/* Radar Chart for stats */}
          <div className="bg-gray-700 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-semibold mb-4">Performance Radar</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={[
                    { subject: 'KDA', A: Number(matches?.kda) * 20 || 0, fullMark: 100 },
                    { subject: 'Win Rate', A: matches?.totalGames ? ((Number(matches?.wins) / (Number(matches?.totalGames) || 1)) * 100) : 0, fullMark: 100 },
                    { subject: 'CS/min', A: matches?.averageCS ? Number(matches?.averageCS) * 10 : 0, fullMark: 100 },
                    { subject: 'Vision', A: matches?.averageVisionScore ? Number(matches?.averageVisionScore) * 10 : 0, fullMark: 100 },
                    { subject: 'Objectives', A: matches?.objectiveParticipation ? Number(matches?.objectiveParticipation) : 0, fullMark: 100 },
                    { subject: 'Kill Part.', A: matches?.killParticipation ? Number(matches?.killParticipation) : 0, fullMark: 100 },
                  ]}
                >
                  <PolarGrid stroke="#444" />
                  <PolarAngleAxis dataKey="subject" stroke="#fff" />
                  <PolarRadiusAxis stroke="#fff" />
                  <Radar name="Performance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Close expanded section */}
        </div>
{/* Role Performance */}
        {matches?.roleStats && Object.keys(matches.roleStats).length > 0 && (
          <div className="bg-gray-700 p-6 rounded-lg mt-8">
              <h3 className="text-xl font-semibold mb-4">Role Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(matches.roleStats).map(([role, stats]: [string, any], index: number) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src={`/images/roles/${role.toLowerCase()}.png`}
                        alt={role}
                        className="w-6 h-6"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/24?text=R';
                        }}
                      />
                      <p className="font-semibold">{role}</p>
                    </div>
                    <p className="text-sm">
                      <span className="text-green-400">{stats.winRate.toFixed(0)}%</span> Win Rate
                    </p>
                    <p className="text-sm text-gray-400">{stats.games} games</p>
                    <p className="text-sm text-gray-400">{stats.kda.toFixed(2)} KDA</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Matches */}
          <div className="bg-gray-700 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-semibold mb-4">Recent Matches</h3>
            {matches?.recentMatches && matches.recentMatches.length > 0 ? (
              <div className="space-y-3">
                {matches.recentMatches.map((match: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg flex justify-between items-center ${match.win ? 'bg-blue-900/30' : 'bg-red-900/30'}`}>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold">{match.championName}</p>
                        <p className="text-sm text-gray-400">{match.lane} • {match.win ? 'Victory' : 'Defeat'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{match.kills}/{match.deaths}/{match.assists}</p>
                      <p className="text-sm text-gray-400">{match.cs} CS</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No recent match data available</p>
            )}
          </div>
        </div>
      </div>
  );
}; // End of renderLeagueStats

  // Render Dota 2 stats
  const renderDota2Stats = (stat: StatData, expanded: boolean) => {
    // Check if we have the necessary data
    if (!stat.data || stat.data.error) {
      return (
        <div className="text-center py-4">
          <p className="text-red-400">{stat.data?.error || "No Dota 2 stats available"}</p>
        </div>
      );
    }

    // Basic stats for compact view
    if (!expanded) {
      return (
        <div className="bg-gradient-to-br from-red-900/20 to-red-600/10 rounded-md p-4">
          <div className="text-center mb-2">
            <h3 className="text-xl font-bold text-white">{stat.data.player_name || "Dota 2 Player"}</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-black/30 p-2 rounded-md text-center">
              <p className="text-lg font-bold text-green-400">{stat.data.win_rate || "0"}%</p>
              <p className="text-xs text-gray-300">Win Rate</p>
            </div>
            <div className="bg-black/30 p-2 rounded-md text-center">
              <p className="text-lg font-bold text-blue-400">{stat.data.kda || "0"}</p>
              <p className="text-xs text-gray-300">KDA</p>
            </div>
            <div className="bg-black/30 p-2 rounded-md text-center">
              <p className="text-lg font-bold text-yellow-400">{stat.data.games_played || 0}</p>
              <p className="text-xs text-gray-300">Games</p>
            </div>
          </div>
          
          {/* Show top hero if available */}
          {stat.data.heroes && stat.data.heroes.length > 0 && (
            <div className="flex items-center justify-center mt-2">
              <div className="flex items-center">
                {stat.data.heroes[0].icon ? (
                  <img src={stat.data.heroes[0].icon} alt={stat.data.heroes[0].name} className="w-8 h-8 rounded-full mr-2" />
                ) : (
                  <div className="w-8 h-8 bg-gray-700 rounded-full mr-2 flex items-center justify-center">
                    <span>{stat.data.heroes[0].name.charAt(0)}</span>
                  </div>
                )}
                <span className="text-sm text-gray-300">Top Hero: {stat.data.heroes[0].name}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Expanded view with detailed stats
    return (
      <div className="space-y-8">
        {/* Header with player info */}
        <div className="bg-gradient-to-br from-red-900/20 to-red-600/10 rounded-lg p-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">{stat.data.player_name || "Dota 2 Player"}</h2>
          <div className="flex justify-center space-x-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stat.data.win_rate || "0"}%</p>
              <p className="text-sm text-gray-300">Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stat.data.kda || "0"}</p>
              <p className="text-sm text-gray-300">KDA</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{stat.data.games_played || 0}</p>
              <p className="text-sm text-gray-300">Games</p>
            </div>
          </div>
        </div>

        {/* Overview section */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-white">{stat.data.games_played || 0}</p>
              <p className="text-sm text-gray-400">Games Played</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">{stat.data.wins || 0}</p>
              <p className="text-sm text-gray-400">Wins</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">{stat.data.losses || 0}</p>
              <p className="text-sm text-gray-400">Losses</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-400">{stat.data.win_rate || "0"}%</p>
              <p className="text-sm text-gray-400">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Combat stats */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Combat Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">{stat.data.kills || 0}</p>
              <p className="text-sm text-gray-400">Kills</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">{stat.data.deaths || 0}</p>
              <p className="text-sm text-gray-400">Deaths</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-400">{stat.data.assists || 0}</p>
              <p className="text-sm text-gray-400">Assists</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-400">{stat.data.kda || "0"}</p>
              <p className="text-sm text-gray-400">KDA Ratio</p>
            </div>
          </div>
        </div>

        {/* Performance radar chart */}
        {stat.data.performance && stat.data.performance.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">Performance</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="80%" data={stat.data.performance}>
                  <PolarGrid stroke="#444" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#ccc' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#ccc' }} />
                  <Radar name="Player" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Hero stats */}
        {stat.data.heroes && stat.data.heroes.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">Top Heroes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stat.data.heroes.slice(0, 5).map((hero: any, index: number) => (
                <div key={index} className="bg-gray-800/80 p-4 rounded-lg flex items-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-4">
                    {hero.icon ? (
                      <img src={hero.icon} alt={hero.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span>{hero.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{hero.name}</p>
                      <p className="text-sm text-gray-400">
                        {hero.matches} matches, {hero.win_rate}% win rate
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last updated timestamp */}
        {stat.lastFetched && (
          <p className="text-xs text-gray-500 text-right">
            Last updated: {new Date(stat.lastFetched).toLocaleString()}
          </p>
        )}
      </div>
    );
  };

  // Render Valorant stats
  const renderValorantStats = (stat: StatData, expanded: boolean) => {
    // Check if we have Valorant data
    if (!stat.data || Object.keys(stat.data).length === 0) {
      return (
        <div className="text-center p-4">
          <p className="text-red-400">No Valorant stats available. Try refreshing.</p>
        </div>
      );
    }

    // Log the Valorant data for debugging
    console.log("Rendering Valorant stats with data:", stat.data);

    // Extract account information
    const playerName = stat.data.account?.name || "Unknown Player";
    const playerTag = stat.data.account?.tagLine || "";
    const displayName = playerTag ? `${playerName}#${playerTag}` : playerName;
    
    // Extract profile information
    const accountLevel = stat.data.profile?.accountLevel || 0;
    const rank = stat.data.profile?.rank || "Unranked";
    const rankTier = stat.data.profile?.rankTier || 0;
    
    // Extract match statistics
    const matchStats = stat.data.matchStats || {};
    const winRate = matchStats.winRate || 0;
    const kdRatio = matchStats.kdRatio || 0;
    const totalMatches = matchStats.totalMatches || 0;
    const wins = matchStats.wins || 0;
    const losses = matchStats.losses || 0;
    const averageKills = matchStats.averageKills || 0;
    const averageDeaths = matchStats.averageDeaths || 0;
    const averageAssists = matchStats.averageAssists || 0;
    const averageCombatScore = matchStats.averageCombatScore || 0;
    
    // Extract agent stats
    const agentStats = stat.data.agentStats || [] as ValorantAgentStat[];
    
    // Extract recent matches
    const recentMatches = stat.data.recentMatches || [] as ValorantMatch[];
    
    // Create data for performance radar chart
    const performanceData = [
      {
        subject: 'Kills',
        A: averageKills * 10, // Scale for better display
        fullMark: 100,
      },
      {
        subject: 'KD Ratio',
        A: kdRatio * 20, // Scale for better display
        fullMark: 100,
      },
      {
        subject: 'Win Rate',
        A: winRate,
        fullMark: 100,
      },
      {
        subject: 'Combat Score',
        A: Math.min(averageCombatScore / 4, 100), // Scale for better display
        fullMark: 100,
      },
      {
        subject: 'Assists',
        A: averageAssists * 10, // Scale for better display
        fullMark: 100,
      },
    ];
    
    // Determine content based on expanded state
    if (!expanded) {
      // Unexpanded view
      return (
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-600/10 rounded-md p-4">
          <div className="text-center mb-2">
            <h3 className="text-xl font-bold text-white">{displayName}</h3>
            <p className="text-gray-300">Level {accountLevel} • {rank} {rankTier > 0 ? rankTier : ''}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-black/30 p-2 rounded-md text-center">
              <p className="text-lg font-bold text-green-400">{winRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-300">Win Rate</p>
            </div>
            <div className="bg-black/30 p-2 rounded-md text-center">
              <p className="text-lg font-bold text-blue-400">{kdRatio.toFixed(2)}</p>
              <p className="text-xs text-gray-300">K/D</p>
            </div>
            <div className="bg-black/30 p-2 rounded-md text-center">
              <p className="text-lg font-bold text-yellow-400">{totalMatches}</p>
              <p className="text-xs text-gray-300">Matches</p>
            </div>
          </div>
          
          {/* Show top agent if available */}
          {agentStats.length > 0 && (
            <div className="flex items-center justify-center mt-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-700 rounded-full mr-2 flex items-center justify-center">
                  <span>{agentStats[0].agentName.charAt(0)}</span>
                </div>
                <span className="text-sm text-gray-300">Top Agent: {agentStats[0].agentName}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Expanded view
    return (
      <div className="space-y-8">
        {/* Header with player info */}
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-600/10 rounded-lg p-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">{displayName}</h2>
          <p className="text-gray-300">Level {accountLevel} • {rank} {rankTier > 0 ? rankTier : ''}</p>
          <div className="flex justify-center space-x-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{winRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-300">Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{kdRatio.toFixed(2)}</p>
              <p className="text-sm text-gray-300">K/D</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{totalMatches}</p>
              <p className="text-sm text-gray-300">Matches</p>
            </div>
          </div>
        </div>
        
        {/* Overview section */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-white">{totalMatches}</p>
              <p className="text-sm text-gray-400">Matches Played</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">{wins}</p>
              <p className="text-sm text-gray-400">Wins</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">{losses}</p>
              <p className="text-sm text-gray-400">Losses</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-400">{winRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-400">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Combat stats */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Combat Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">{averageKills.toFixed(1)}</p>
              <p className="text-sm text-gray-400">Avg. Kills</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">{averageDeaths.toFixed(1)}</p>
              <p className="text-sm text-gray-400">Avg. Deaths</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-400">{averageAssists.toFixed(1)}</p>
              <p className="text-sm text-gray-400">Avg. Assists</p>
            </div>
            <div className="bg-gray-800/80 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-400">{kdRatio.toFixed(2)}</p>
              <p className="text-sm text-gray-400">K/D Ratio</p>
            </div>
          </div>
        </div>
        
        {/* Performance radar chart */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Performance</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius="80%" data={performanceData}>
                <PolarGrid stroke="#444" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#ccc' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#ccc' }} />
                <Radar name="Player" dataKey="A" stroke="#9333ea" fill="#9333ea" fillOpacity={0.6} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent stats */}
        {agentStats.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">Top Agents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agentStats.slice(0, 5).map((agent: ValorantAgentStat, index: number) => (
                <div key={index} className="bg-gray-800/80 p-4 rounded-lg flex items-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">{agent.agentName.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-white">{agent.agentName}</h4>
                      <span className="text-sm text-green-400">{agent.winRate.toFixed(1)}% Win Rate</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{agent.matches} matches</span>
                      <span className="text-blue-400">KDA: {agent.kda.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent matches */}
        {recentMatches.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">Recent Matches</h3>
            <div className="space-y-3">
              {recentMatches.slice(0, 5).map((match: ValorantMatch, index: number) => (
                <div key={index} className={`bg-gray-800/80 p-4 rounded-lg border-l-4 ${match.won ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                        <span>{match.agent.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{match.agent}</h4>
                        <p className="text-xs text-gray-400">{match.mapId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${match.won ? 'text-green-400' : 'text-red-400'}`}>
                        {match.won ? 'Victory' : 'Defeat'}
                      </p>
                      <p className="text-xs text-gray-400">{match.kills}/{match.deaths}/{match.assists}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render error state for any game stats
  const renderErrorState = () => {
    return (
      <Card className="bg-gray-800 text-white p-6 rounded-lg shadow-lg relative">
        <CardContent>
          <h3 className="text-2xl font-bold mb-2">{stat.game}</h3>
          <p className="text-gray-400 text-sm">Platform: {stat.platform}</p>
          <p className="text-red-400 mt-2">⚠️ No data available. Try refreshing.</p>
          
          {/* Delete button */}
          {stat.ID && stat.onDelete && (
            <button 
              onClick={handleDelete}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
              title="Delete stat card"
            >
              ✕
            </button>
          )}
        </CardContent>
      </Card>
    );
  };

  // Collapsed view (small card)
  if (!expanded) {
    return (
      <Card 
        className="bg-surface-dark border border-primary-700 text-white p-5 !rounded-sm shadow-xl cursor-pointer transform transition-transform hover:scale-102 hover:shadow-2xl relative"
        onClick={toggleExpanded}
      >
        <CardContent className="p-0">
          {/* Header with game name and platform */}
          <div className="bg-gradient-to-r from-black to-primary-900 px-4 py-3 -m-5 mb-4">
            <div className="flex items-center gap-2">
              {/* Game Icon */}
              <div className="w-8 h-8 bg-accent-600 flex items-center justify-center border border-white/20 flex-shrink-0">
                {stat.game === 'CS2' && <span className="text-white text-sm font-bold">CS2</span>}
                {stat.game === 'League of Legends' && <span className="text-white text-xs font-bold">LoL</span>}
                {stat.game === 'Dota 2' && <span className="text-white text-xs font-bold">D2</span>}
                {stat.game === 'Valorant' && <span className="text-white text-xs font-bold">VAL</span>}
                {stat.game === 'Apex Legends' && <span className="text-white text-xs font-bold">AL</span>}
                {stat.game === 'Call of Duty' && <span className="text-white text-xs font-bold">CoD</span>}
                {!['CS2', 'League of Legends', 'Dota 2', 'Valorant', 'Apex Legends', 'Call of Duty'].includes(stat.game) && 
                  <span className="text-white text-xs font-bold">?</span>}
              </div>
              <div>
                <h3 className="text-xl font-bold">{stat.game}</h3>
                <p className="text-gray-400 text-xs">{stat.platform}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            {/* First stat - Different per game (Kills, Level for League) */}
            <div className="flex flex-col items-center">
              <span className="text-red-500 text-3xl">{stat.game === "League of Legends" ? "💯" : "💀"}</span>
              <p className="text-lg font-semibold">
                {stat.game === "CS2" ? stat.data?.total_kills :
                 stat.game === "Apex Legends" ? stat.data?.kills :
                 stat.game === "Fortnite" ? stat.data?.total_kills :
                 stat.game === "Marvel Rivals" ? stat.data?.total_kills :
                 stat.game === "Valorant" ? (stat.data?.total_kills ?? stat.data?.matchStats?.totalKills) :
                 stat.game === "League of Legends" ? (stat.data?.summoner?.summonerLevel || "0") :
                 "N/A"}
              </p>
              <span className="text-gray-400 text-sm">
                {stat.game === "League of Legends" ? "Level" : "Kills"}
              </span>
            </div>

            {/* Second stat - Wins or Win Rate (based on game) */}
            <div className="flex flex-col items-center">
              <span className="text-green-500 text-3xl">🏆</span>
              <p className="text-lg font-semibold">
                {stat.game === "CS2" ? stat.data?.total_matches_won :
                 stat.game === "Apex Legends" ? stat.data?.wins :
                 stat.game === "Fortnite" ? `${stat.data?.win_rate || 0}%` :
                 stat.game === "Marvel Rivals" ? stat.data?.wins :
                 stat.game === "Valorant" ? `${stat.data?.win_rate ?? stat.data?.matchStats?.winRate ?? 0}%` :
                 stat.game === "League of Legends" ? (stat.data?.matches?.totalGames && stat.data?.matches?.wins ? `${Math.round((stat.data.matches.wins / stat.data.matches.totalGames) * 100)}%` : (stat.data?.ranked && stat.data.ranked.length > 0 ? `${Math.round((stat.data.ranked[0].wins / (stat.data.ranked[0].wins + stat.data.ranked[0].losses)) * 100)}%` : "0%")) :
                 "N/A"}
              </p>
              <span className="text-gray-400 text-sm">
                {stat.game === "Fortnite" || stat.game === "Valorant" || stat.game === "League of Legends" ? "Win Rate" : "Wins"}
              </span>
            </div>

            {/* Third stat - Game specific */}
            <div className="flex flex-col items-center">
              {stat.game === "CS2" && (
                <>
                  <span className="text-yellow-400 text-3xl">🏅</span>
                  <p className="text-lg font-semibold">{stat.data?.total_mvps || 0}</p>
                  <span className="text-gray-400 text-sm">MVPs</span>
                </>
              )}
              {stat.game === "Apex Legends" && (
                <>
                  <span className="text-blue-400 text-3xl">⚡</span>
                  <p className="text-lg font-semibold">{stat.data?.damage ? `${(stat.data.damage / 1000).toFixed(1)}K` : "N/A"}</p>
                  <span className="text-gray-400 text-sm">Damage</span>
                </>
              )}
              {stat.game === "Fortnite" && (
                <>
                  <span className="text-blue-400 text-3xl">🏢</span>
                  <p className="text-lg font-semibold">{stat.data?.building_rate || "N/A"}</p>
                  <span className="text-gray-400 text-sm">Building</span>
                </>
              )}
              {stat.game === "Marvel Rivals" && (
                <>
                  <span className="text-blue-400 text-3xl">👊</span>
                  <p className="text-lg font-semibold">{stat.data?.avg_damage || "N/A"}</p>
                  <span className="text-gray-400 text-sm">Avg DMG</span>
                </>
              )}
              {stat.game === "Valorant" && (
  <>
    <span className="text-blue-400 text-3xl">🎯</span>
    <p className="text-lg font-semibold">
      {stat.data?.headshot_percentage ??
       (stat.data?.matchStats?.headshotPercentage ??
        (
          stat.data?.total_kills || stat.data?.matchStats?.totalKills
            ? `${(
                ((stat.data?.total_kills_headshot ?? 0) /
                  (stat.data?.total_kills ?? stat.data?.matchStats?.totalKills ?? 1)) *
                100
              ).toFixed(1)}%`
            : "N/A")
       )}
    </p>
    <span className="text-gray-400 text-sm">HS %</span>
  </>
)}

              {stat.game === "League of Legends" && (
                <>
                  <span className="text-yellow-400 text-3xl">⚔️</span>
                  <p className="text-lg font-semibold">
                    {stat.data?.matches?.kda ? stat.data.matches.kda.toFixed(2) : "N/A"}
                  </p>
                  <span className="text-gray-400 text-sm">KDA</span>
                </>
              )}
              {!stat.game || (
                stat.game !== "CS2" && 
                stat.game !== "Apex Legends" && 
                stat.game !== "Fortnite" && 
                stat.game !== "Marvel Rivals" && 
                stat.game !== "Valorant" && 
                stat.game !== "League of Legends"
              ) && (
                <>
                  <span className="text-blue-400 text-3xl">⭐</span>
                  <p className="text-lg font-semibold">N/A</p>
                  <span className="text-gray-400 text-sm">Rating</span>
                </>
              )}
            </div>
          </div>
          
          {/* Bottom action area */}
          <div className="mt-5 border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-accent-400 text-xs">Click to expand</span>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {stat.ID && stat.onRefresh && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRefresh(e);
                    }}
                    className={`hover:text-accent-400 text-gray-400 bg-transparent p-1 ${stat.isLoading ? 'animate-spin' : ''}`}
                    title="Refresh stats"
                    disabled={stat.isLoading}
                  >
                    <span className="text-sm">↻</span>
                  </button>
                )}
                {stat.ID && stat.onDelete && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(e);
                    }}
                    className="text-red-500 hover:text-red-300 bg-transparent p-1"
                    title="Delete stat card"
                  >
                    <span className="text-sm">✕</span>
                  </button>
                )}
              </div>
            </div>
            
            <Button 
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setShowCompareModal(true);
              }}
              className="bg-accent-600 hover:bg-accent-700 text-white border-0 !rounded-none w-full"
              size="sm"
            >
              Compare with Friends
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure we return the card JSX
  return (
    <>
      {expanded ? (
        // Full expanded view
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center overflow-y-auto z-50">
          <div className="max-w-6xl w-full h-full max-h-screen p-4 flex items-center justify-center">
            <div className="bg-surface-dark border border-primary-700 text-content-primary !rounded-none w-full max-h-[90vh] overflow-y-auto relative">
              {/* Fixed header that stays at the top when scrolling */}
              <div className="sticky top-0 left-0 right-0 bg-surface-dark p-6 flex justify-between items-center border-b border-primary-800 z-10 w-full">
                <h2 className="text-2xl font-bold text-content-primary">{stat.game} Stats</h2>
                <div className="flex space-x-3 items-center">
                  {stat.ID && stat.onRefresh && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefresh(e);
                      }}
                      className={`text-content-secondary hover:text-white bg-transparent border-none p-0 ${stat.isLoading ? 'animate-spin' : ''}`}
                      title="Refresh stat card"
                      disabled={stat.isLoading}
                    >
                      <span className="text-xl">↻</span>
                    </button>
                  )}
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCompareModal(true);
                    }}
                    className="bg-accent-600 hover:bg-accent-700 text-white border-none !rounded-none"
                    size="sm"
                  >
                    Compare Stats
                  </Button>
                  <button 
                    onClick={() => toggleExpanded()}
                    className="text-content-secondary hover:text-white bg-transparent border-none p-0"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                  {stat.ID && stat.onDelete && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(e);
                      }}
                      className="text-red-500 hover:text-red-400 bg-transparent border-none p-0"
                      title="Delete stat card"
                    >
                      <span className="text-xl">✕</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {renderGameStats()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // COMPLETELY NEW DESIGN with debugging
        <div 
          className="bg-red-900 border-4 border-yellow-400 shadow-xl !rounded-none overflow-hidden max-w-md"
          onClick={() => toggleExpanded()}
          style={{transform: 'scale(1)', transition: 'all 0.2s ease'}}
        >
          {/* Dark gradient header with game name and action buttons */}
          <div className="bg-gradient-to-r from-black to-primary-900 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {/* Game Icon Badge */}
              <div className="w-8 h-8 bg-accent-600 flex items-center justify-center border border-white/20">
                {stat.game === 'CS2' && <span className="text-white text-sm font-bold">CS2</span>}
                {stat.game === 'League of Legends' && <span className="text-white text-xs font-bold">LoL</span>}
                {stat.game === 'Dota 2' && <span className="text-white text-xs font-bold">D2</span>}
                {stat.game === 'Valorant' && <span className="text-white text-xs font-bold">VAL</span>}
                {stat.game === 'Apex Legends' && <span className="text-white text-xs font-bold">AL</span>}
                {stat.game === 'Call of Duty' && <span className="text-white text-xs font-bold">CoD</span>}
              </div>
              <div>
                <h3 className="text-white font-bold">{stat.game}</h3>
                <p className="text-gray-400 text-xs">{stat.platform}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-3">
              {stat.ID && stat.onRefresh && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh(e);
                  }}
                  className={`text-content-secondary hover:text-white bg-transparent border-none p-0 ${stat.isLoading ? 'animate-spin' : ''}`}
                  title="Refresh stats"
                  disabled={stat.isLoading}
                >
                  <span className="text-xl">↻</span>
                </button>
              )}
              {stat.ID && stat.onDelete && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(e);
                  }}
                  className="text-red-500 hover:text-red-300 bg-transparent border-none p-0"
                  title="Delete stat card"
                >
                  <span className="text-xl">✕</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Stats content in a dark panel */}
          <div className="p-4 bg-surface-dark">
            {/* Stat metrics */}
            <div className="grid grid-cols-3 gap-3 pb-3">
              {renderGameStats()}
            </div>
            
            {/* Bottom action bar */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-700">
              <span className="text-accent-400 text-xs">Tap for details</span>
              
              {/* Action buttons */}
              <Button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setShowCompareModal(true);
                }}
                className="bg-accent-600 hover:bg-accent-700 border-0 rounded-none text-white text-xs px-3 py-1"
                size="sm"
              >
                Compare
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {showCompareModal && (
        <CompareStatsModal
          onClose={() => setShowCompareModal(false)}
          userStat={stat}
        />
      )}
    </>
  );
};

export default StatCard;
