import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
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

// Define stat data interface
interface StatData {
  ID?: number;
  game: string;
  platform: string;
  data: any;
  onDelete?: (id: number) => void;
}

const StatCard = ({ stat }: { stat: StatData }) => {
  const [expanded, setExpanded] = useState(false);

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
    const kills = stat.data.total_kills || 0;
    const deaths = stat.data.total_deaths || 0;
    return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
  };

  // Calculate accuracy percentage
  const calculateAccuracy = () => {
    const shotsFired = stat.data.total_shots_fired || 0;
    const shotsHit = stat.data.total_shots_hit || 0;
    return shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(2) : "0";
  };

  // Calculate headshot percentage
  const calculateHeadshotPercentage = () => {
    const kills = stat.data.total_kills || 0;
    const headshots = stat.data.total_kills_headshot || 0;
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
    switch (stat.game) {
      case "CS2":
        return renderCS2Stats();
      case "Apex Legends":
        return renderApexStats();
      default:
        return (
          <div className="text-center p-4">
            <p className="text-yellow-400">Stats visualization for {stat.game} coming soon!</p>
          </div>
        );
    }
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
    const weaponData = [];
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
    const mvps = stat.data.total_mvps || 0;
    
    // Create weapon data for chart
    const weaponData = getTopWeapons();
    
    // Create map data for chart
    const mapData = getMapStats();
    
    // Create performance data for radar chart
    const performanceData = getPerformanceData();
    
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
              <p className="text-gray-400 text-sm">Accuracy</p>
              <p className="text-2xl font-bold">{accuracy}%</p>
            </div>
          </div>
        </div>
        
        {weaponData.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Top Weapons</h3>
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
                  <Bar dataKey="kills" name="Kills" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {mapData.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Map Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mapData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} 
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="wins" name="Wins" fill="#8884d8" />
                  <Bar dataKey="rounds" name="Rounds" fill="#01cdfe" />
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
              <p className="text-gray-400 text-sm">MVPs</p>
              <p className="text-2xl font-bold">{mvps}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Headshot %</p>
              <p className="text-2xl font-bold">{headshotPercentage}%</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-4">Radar Chart</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                <PolarGrid stroke="#444" />
                <PolarAngleAxis dataKey="subject" stroke="#fff" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#fff" />
                <Radar name="Player" dataKey="A" stroke="#ff71ce" fill="#ff71ce" fillOpacity={0.6} />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} labelStyle={{ color: '#fff' }} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  if (!stat.data) {
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
  }

  // Collapsed view (small card)
  if (!expanded) {
    return (
      <Card 
        className="bg-gray-800 text-white p-6 rounded-lg shadow-lg cursor-pointer transform transition-transform hover:scale-105 relative"
        onClick={toggleExpanded}
      >
        <CardContent>
          <h3 className="text-2xl font-bold mb-2">{stat.game}</h3>
          <p className="text-gray-400 text-sm">Platform: {stat.platform}</p>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <span className="text-red-500 text-3xl">💀</span>
              <p className="text-lg font-semibold">{stat.data?.total_kills ?? "N/A"}</p>
              <span className="text-gray-400 text-sm">Kills</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-yellow-500 text-3xl">🏆</span>
              <p className="text-lg font-semibold">{stat.data?.total_matches_won ?? "N/A"}</p>
              <span className="text-gray-400 text-sm">Wins</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-blue-400 text-3xl">🎖️</span>
              <p className="text-lg font-semibold">{stat.data?.total_mvps ?? "N/A"}</p>
              <span className="text-gray-400 text-sm">MVPs</span>
            </div>
          </div>
          <p className="text-center text-gray-400 mt-4 text-sm">Click to expand</p>
          
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
  }

  // Expanded view (full detailed card)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-800 text-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-gray-900 p-6 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-3xl font-bold">{stat.game} Stats</h2>
          <button 
            onClick={toggleExpanded}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {renderGameStats()}
        </div>
        
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
      </div>
    </div>
  );
};

export default StatCard;
