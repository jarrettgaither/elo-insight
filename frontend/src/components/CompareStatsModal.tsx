import { useState, useEffect } from 'react';
import { getFriends, Friend } from '../lib/friendsService';
import { Button } from './ui/button';

interface CompareStatsModalProps {
  onClose: () => void;
  userStat: any; // Your user's stat to compare with
}

const CompareStatsModal = ({ onClose, userStat }: CompareStatsModalProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [compareData, setCompareData] = useState<any>(null);
  const [platform, setPlatform] = useState('steam'); // Default platform
  
  // Load friends on component mount
  useEffect(() => {
    loadFriends();
  }, []);
  
  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await getFriends();
      setFriends(Array.isArray(friendsData) ? friendsData : []);
      setFilteredFriends(Array.isArray(friendsData) ? friendsData : []);
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter friends based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend => 
        friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);
  
  // When a friend is selected, fetch their stats (simulated for now)
  const handleSelectFriend = (friendId: number) => {
    setSelectedFriendId(friendId);
    
    // For demo purposes, create mock data based on user's stat but with slight variations
    const friend = friends.find(f => f.friend_id === friendId || f.user_id === friendId);
    
    // Create a deep copy of the user's stat data and modify some values
    const friendStatData = JSON.parse(JSON.stringify(userStat.data));
    
    // Modify many values to create comprehensive differences (for demo purposes)
    if (userStat.game === 'CS2') {
      // Combat stats
      friendStatData.total_kills = Math.floor(friendStatData.total_kills * (0.7 + Math.random() * 0.6));
      friendStatData.total_deaths = Math.floor(friendStatData.total_deaths * (0.7 + Math.random() * 0.6));
      friendStatData.total_shots_fired = Math.floor(friendStatData.total_shots_fired * (0.7 + Math.random() * 0.6));
      friendStatData.total_shots_hit = Math.floor(friendStatData.total_shots_hit * (0.7 + Math.random() * 0.6));
      friendStatData.total_kills_headshot = Math.floor(friendStatData.total_kills_headshot * (0.7 + Math.random() * 0.6));
      
      // Performance metrics
      friendStatData.total_mvps = Math.floor(friendStatData.total_mvps * (0.7 + Math.random() * 0.6));
      friendStatData.total_matches_won = Math.floor(friendStatData.total_matches_won * (0.7 + Math.random() * 0.6));
      friendStatData.total_rounds_played = Math.floor(friendStatData.total_rounds_played * (0.7 + Math.random() * 0.6));
      friendStatData.total_matches_played = Math.floor(friendStatData.total_matches_played * (0.7 + Math.random() * 0.6));
      friendStatData.total_planted_bombs = Math.floor(friendStatData.total_planted_bombs * (0.7 + Math.random() * 0.6));
      friendStatData.total_defused_bombs = Math.floor(friendStatData.total_defused_bombs * (0.7 + Math.random() * 0.6));

      // Map stats - modify all map data
      const mapPrefixes = ["de_dust2", "de_inferno", "de_nuke", "de_vertigo", "de_cbble"];
      for (const prefix of mapPrefixes) {
        if (friendStatData[`total_wins_map_${prefix}`]) {
          friendStatData[`total_wins_map_${prefix}`] = Math.floor(
            friendStatData[`total_wins_map_${prefix}`] * (0.7 + Math.random() * 0.6)
          );
          friendStatData[`total_rounds_map_${prefix}`] = Math.floor(
            friendStatData[`total_rounds_map_${prefix}`] * (0.7 + Math.random() * 0.6)
          );
        }
      }

      // Weapon stats - modify all weapon data
      const weaponKeys = Object.keys(friendStatData).filter(key => key.startsWith("total_kills_"));
      for (const key of weaponKeys) {
        friendStatData[key] = Math.floor(friendStatData[key] * (0.7 + Math.random() * 0.6));
      }
    } else if (userStat.game === 'Apex Legends') {
      // Basic stats
      friendStatData.kills = Math.floor(friendStatData.kills * (0.7 + Math.random() * 0.6));
      friendStatData.deaths = Math.floor(friendStatData.deaths * (0.7 + Math.random() * 0.6));
      friendStatData.damage = Math.floor(friendStatData.damage * (0.7 + Math.random() * 0.6));
      friendStatData.headshots = Math.floor(friendStatData.headshots * (0.7 + Math.random() * 0.6));
      
      // Performance metrics
      friendStatData.wins = Math.floor(friendStatData.wins * (0.7 + Math.random() * 0.6));
      friendStatData.top3 = Math.floor(friendStatData.top3 * (0.7 + Math.random() * 0.6));
      friendStatData.matches = Math.floor(friendStatData.matches * (0.7 + Math.random() * 0.6));
      
      // Weapon stats - modify all weapon data
      const weaponKeys = Object.keys(friendStatData).filter(key => 
        key.startsWith("weapon_") && key.includes("_kills")
      );
      for (const key of weaponKeys) {
        friendStatData[key] = Math.floor(friendStatData[key] * (0.7 + Math.random() * 0.6));
      }
      
      // Legend stats - modify all legend data
      const legendKeys = Object.keys(friendStatData).filter(key => 
        key.startsWith("legend_") && key.includes("_kills")
      );
      for (const key of legendKeys) {
        friendStatData[key] = Math.floor(friendStatData[key] * (0.7 + Math.random() * 0.6));
      }
    }
    
    setCompareData({
      game: userStat.game,
      platform: platform,
      data: friendStatData,
      friendName: friend?.username || 'Friend'
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-800 text-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-6 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-3xl font-bold">Compare Stats</h2>
          <button 
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {!compareData ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Platform
                </label>
                <select 
                  className="w-full p-3 bg-gray-700 rounded-md text-white"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="steam">Steam</option>
                  <option value="riot">Riot</option>
                  <option value="ea">EA</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Friends
                </label>
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  className="w-full p-3 bg-gray-700 rounded-md text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-4">Select a Friend</h3>
                {loading ? (
                  <div className="text-center text-gray-400 py-4">Loading friends...</div>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-center text-gray-400 py-4">No friends found</div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {filteredFriends.map(friend => (
                      <div
                        key={friend.id}
                        className={`p-3 rounded-md cursor-pointer ${
                          selectedFriendId === friend.friend_id || selectedFriendId === friend.user_id
                            ? 'bg-blue-700'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => handleSelectFriend(
                          friend.user_id === userStat.userID ? friend.friend_id : friend.user_id
                        )}
                      >
                        <div className="font-medium">{friend.username}</div>
                        <div className="text-sm text-gray-400">{friend.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => handleSelectFriend(selectedFriendId || 0)}
                  disabled={selectedFriendId === null}
                >
                  Compare Stats
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-col md:flex-row gap-8 mb-6">
                <div className="w-full md:w-1/2">
                  <h3 className="text-xl font-bold mb-4 text-center">You</h3>
                  <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <div className="flex justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">{userStat.game}</h4>
                        <p className="text-sm text-gray-400">Platform: {userStat.platform}</p>
                      </div>
                    </div>
                    
                    <h5 className="text-lg font-semibold mb-2">Combat Stats</h5>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* For kills, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Kills</p>
                        <p className="text-2xl font-bold">{userStat.data.total_kills || 0}</p>
                        {compareData.data.total_kills !== undefined && userStat.data.total_kills !== undefined && (
                          <div className="absolute top-2 right-2">
                            {userStat.data.total_kills > compareData.data.total_kills ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : userStat.data.total_kills < compareData.data.total_kills ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For deaths, lower is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Deaths</p>
                        <p className="text-2xl font-bold">{userStat.data.total_deaths || 0}</p>
                        {compareData.data.total_deaths !== undefined && userStat.data.total_deaths !== undefined && (
                          <div className="absolute top-2 right-2">
                            {userStat.data.total_deaths < compareData.data.total_deaths ? (
                              <span className="text-green-500 text-sm font-bold">▼</span>
                            ) : userStat.data.total_deaths > compareData.data.total_deaths ? (
                              <span className="text-red-500 text-sm font-bold">▲</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For K/D ratio, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">K/D Ratio</p>
                        <p className="text-2xl font-bold">
                          {userStat.data.total_deaths ? 
                            (userStat.data.total_kills / userStat.data.total_deaths).toFixed(2) : 
                            userStat.data.total_kills}
                        </p>
                        {compareData.data.total_kills !== undefined && compareData.data.total_deaths !== undefined && 
                          userStat.data.total_kills !== undefined && userStat.data.total_deaths !== undefined && (
                          <div className="absolute top-2 right-2">
                            {(userStat.data.total_kills / Math.max(1, userStat.data.total_deaths)) > 
                             (compareData.data.total_kills / Math.max(1, compareData.data.total_deaths)) ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : (userStat.data.total_kills / Math.max(1, userStat.data.total_deaths)) < 
                               (compareData.data.total_kills / Math.max(1, compareData.data.total_deaths)) ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For accuracy, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Accuracy</p>
                        <p className="text-2xl font-bold">
                          {userStat.data.total_shots_fired ? 
                            ((userStat.data.total_shots_hit / userStat.data.total_shots_fired) * 100).toFixed(2) : 
                            0}%
                        </p>
                        {compareData.data.total_shots_hit !== undefined && compareData.data.total_shots_fired !== undefined &&
                          userStat.data.total_shots_hit !== undefined && userStat.data.total_shots_fired !== undefined && (
                          <div className="absolute top-2 right-2">
                            {(userStat.data.total_shots_hit / Math.max(1, userStat.data.total_shots_fired)) > 
                             (compareData.data.total_shots_hit / Math.max(1, compareData.data.total_shots_fired)) ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : (userStat.data.total_shots_hit / Math.max(1, userStat.data.total_shots_fired)) < 
                               (compareData.data.total_shots_hit / Math.max(1, compareData.data.total_shots_fired)) ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h5 className="text-lg font-semibold mb-2">Performance Stats</h5>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* For headshot %, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Headshot %</p>
                        <p className="text-xl font-bold">
                          {userStat.data.total_kills ? 
                            ((userStat.data.total_kills_headshot / userStat.data.total_kills) * 100).toFixed(2) : 
                            0}%
                        </p>
                        {compareData.data.total_kills_headshot !== undefined && compareData.data.total_kills !== undefined &&
                          userStat.data.total_kills_headshot !== undefined && userStat.data.total_kills !== undefined && (
                          <div className="absolute top-2 right-2">
                            {(userStat.data.total_kills_headshot / Math.max(1, userStat.data.total_kills)) > 
                             (compareData.data.total_kills_headshot / Math.max(1, compareData.data.total_kills)) ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : (userStat.data.total_kills_headshot / Math.max(1, userStat.data.total_kills)) < 
                               (compareData.data.total_kills_headshot / Math.max(1, compareData.data.total_kills)) ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For MVPs, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">MVPs</p>
                        <p className="text-xl font-bold">{userStat.data.total_mvps || 0}</p>
                        {compareData.data.total_mvps !== undefined && userStat.data.total_mvps !== undefined && (
                          <div className="absolute top-2 right-2">
                            {userStat.data.total_mvps > compareData.data.total_mvps ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : userStat.data.total_mvps < compareData.data.total_mvps ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For Win Rate, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Win Rate</p>
                        <p className="text-xl font-bold">
                          {userStat.data.total_matches_played ? 
                            ((userStat.data.total_matches_won / userStat.data.total_matches_played) * 100).toFixed(2) : 
                            0}%
                        </p>
                        {compareData.data.total_matches_won !== undefined && compareData.data.total_matches_played !== undefined &&
                          userStat.data.total_matches_won !== undefined && userStat.data.total_matches_played !== undefined && (
                          <div className="absolute top-2 right-2">
                            {(userStat.data.total_matches_won / Math.max(1, userStat.data.total_matches_played)) > 
                             (compareData.data.total_matches_won / Math.max(1, compareData.data.total_matches_played)) ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : (userStat.data.total_matches_won / Math.max(1, userStat.data.total_matches_played)) < 
                               (compareData.data.total_matches_won / Math.max(1, compareData.data.total_matches_played)) ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For Bombs Planted, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Bombs Planted</p>
                        <p className="text-xl font-bold">{userStat.data.total_planted_bombs || 0}</p>
                        {compareData.data.total_planted_bombs !== undefined && userStat.data.total_planted_bombs !== undefined && (
                          <div className="absolute top-2 right-2">
                            {userStat.data.total_planted_bombs > compareData.data.total_planted_bombs ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : userStat.data.total_planted_bombs < compareData.data.total_planted_bombs ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h5 className="text-lg font-semibold mb-2">Top Weapons</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(userStat.data)
                        .filter(([key]) => key.startsWith('total_kills_') && key !== 'total_kills_headshot')
                        .sort(([, a], [, b]) => Number(b) - Number(a))
                        .slice(0, 4)
                        .map(([key, value]) => {
                          const weaponName = key.replace('total_kills_', '').toUpperCase();
                          return (
                            <div key={key} className="flex justify-between bg-gray-800 p-2 rounded">
                              <span>{weaponName}</span>
                              <span className="font-bold">{Number(value)} kills</span>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <h3 className="text-xl font-bold mb-4 text-center">{compareData.friendName}</h3>
                  <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <div className="flex justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">{compareData.game}</h4>
                        <p className="text-sm text-gray-400">Platform: {compareData.platform}</p>
                      </div>
                    </div>
                    
                    <h5 className="text-lg font-semibold mb-2">Combat Stats</h5>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* For kills, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Kills</p>
                        <p className="text-2xl font-bold">{compareData.data.total_kills || 0}</p>
                        {compareData.data.total_kills !== undefined && userStat.data.total_kills !== undefined && (
                          <div className="absolute top-2 right-2">
                            {compareData.data.total_kills > userStat.data.total_kills ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : compareData.data.total_kills < userStat.data.total_kills ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For deaths, lower is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Deaths</p>
                        <p className="text-2xl font-bold">{compareData.data.total_deaths || 0}</p>
                        {compareData.data.total_deaths !== undefined && userStat.data.total_deaths !== undefined && (
                          <div className="absolute top-2 right-2">
                            {compareData.data.total_deaths < userStat.data.total_deaths ? (
                              <span className="text-green-500 text-sm font-bold">▼</span>
                            ) : compareData.data.total_deaths > userStat.data.total_deaths ? (
                              <span className="text-red-500 text-sm font-bold">▲</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For K/D ratio, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">K/D Ratio</p>
                        <p className="text-2xl font-bold">
                          {compareData.data.total_deaths ? 
                            (compareData.data.total_kills / compareData.data.total_deaths).toFixed(2) : 
                            compareData.data.total_kills}
                        </p>
                        {compareData.data.total_kills !== undefined && compareData.data.total_deaths !== undefined && 
                          userStat.data.total_kills !== undefined && userStat.data.total_deaths !== undefined && (
                          <div className="absolute top-2 right-2">
                            {(compareData.data.total_kills / Math.max(1, compareData.data.total_deaths)) > 
                             (userStat.data.total_kills / Math.max(1, userStat.data.total_deaths)) ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : (compareData.data.total_kills / Math.max(1, compareData.data.total_deaths)) < 
                               (userStat.data.total_kills / Math.max(1, userStat.data.total_deaths)) ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For accuracy, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Accuracy</p>
                        <p className="text-2xl font-bold">
                          {compareData.data.total_shots_fired ? 
                            ((compareData.data.total_shots_hit / compareData.data.total_shots_fired) * 100).toFixed(2) : 
                            0}%
                        </p>
                        {compareData.data.total_shots_hit !== undefined && compareData.data.total_shots_fired !== undefined &&
                          userStat.data.total_shots_hit !== undefined && userStat.data.total_shots_fired !== undefined && (
                          <div className="absolute top-2 right-2">
                            {(compareData.data.total_shots_hit / Math.max(1, compareData.data.total_shots_fired)) > 
                             (userStat.data.total_shots_hit / Math.max(1, userStat.data.total_shots_fired)) ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : (compareData.data.total_shots_hit / Math.max(1, compareData.data.total_shots_fired)) < 
                               (userStat.data.total_shots_hit / Math.max(1, userStat.data.total_shots_fired)) ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h5 className="text-lg font-semibold mb-2">Performance Stats</h5>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* For headshot %, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Headshot %</p>
                        <p className="text-xl font-bold">
                          {compareData.data.total_kills ? 
                            ((compareData.data.total_kills_headshot / compareData.data.total_kills) * 100).toFixed(2) : 
                            0}%
                        </p>
                        {compareData.data.total_kills_headshot !== undefined && compareData.data.total_kills !== undefined &&
                          userStat.data.total_kills_headshot !== undefined && userStat.data.total_kills !== undefined && (
                          <div className="absolute top-2 right-2">
                            {(compareData.data.total_kills_headshot / Math.max(1, compareData.data.total_kills)) > 
                             (userStat.data.total_kills_headshot / Math.max(1, userStat.data.total_kills)) ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : (compareData.data.total_kills_headshot / Math.max(1, compareData.data.total_kills)) < 
                               (userStat.data.total_kills_headshot / Math.max(1, userStat.data.total_kills)) ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For MVPs, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">MVPs</p>
                        <p className="text-xl font-bold">{compareData.data.total_mvps || 0}</p>
                        {compareData.data.total_mvps !== undefined && userStat.data.total_mvps !== undefined && (
                          <div className="absolute top-2 right-2">
                            {compareData.data.total_mvps > userStat.data.total_mvps ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : compareData.data.total_mvps < userStat.data.total_mvps ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For Win Rate, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Win Rate</p>
                        <p className="text-xl font-bold">
                          {compareData.data.total_matches_played ? 
                            ((compareData.data.total_matches_won / compareData.data.total_matches_played) * 100).toFixed(2) : 
                            0}%
                        </p>
                        {compareData.data.total_matches_won !== undefined && compareData.data.total_matches_played !== undefined &&
                          userStat.data.total_matches_won !== undefined && userStat.data.total_matches_played !== undefined && (
                          <div className="absolute top-2 right-2">
                            {(compareData.data.total_matches_won / Math.max(1, compareData.data.total_matches_played)) > 
                             (userStat.data.total_matches_won / Math.max(1, userStat.data.total_matches_played)) ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : (compareData.data.total_matches_won / Math.max(1, compareData.data.total_matches_played)) < 
                               (userStat.data.total_matches_won / Math.max(1, userStat.data.total_matches_played)) ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* For Bombs Planted, higher is better */}
                      <div className="bg-gray-800 p-3 rounded-lg relative">
                        <p className="text-gray-400 text-sm">Bombs Planted</p>
                        <p className="text-xl font-bold">{compareData.data.total_planted_bombs || 0}</p>
                        {compareData.data.total_planted_bombs !== undefined && userStat.data.total_planted_bombs !== undefined && (
                          <div className="absolute top-2 right-2">
                            {compareData.data.total_planted_bombs > userStat.data.total_planted_bombs ? (
                              <span className="text-green-500 text-sm font-bold">▲</span>
                            ) : compareData.data.total_planted_bombs < userStat.data.total_planted_bombs ? (
                              <span className="text-red-500 text-sm font-bold">▼</span>
                            ) : (
                              <span className="text-yellow-500 text-sm font-bold">=</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h5 className="text-lg font-semibold mb-2">Top Weapons</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(compareData.data)
                        .filter(([key]) => key.startsWith('total_kills_') && key !== 'total_kills_headshot')
                        .sort(([, a], [, b]) => Number(b) - Number(a))
                        .slice(0, 4)
                        .map(([key, value]) => {
                          const weaponName = key.replace('total_kills_', '').toUpperCase();
                          return (
                            <div key={key} className="flex justify-between bg-gray-800 p-2 rounded">
                              <span>{weaponName}</span>
                              <span className="font-bold">{Number(value)} kills</span>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => setCompareData(null)}
                  variant="outline"
                  className="mr-2"
                >
                  Select Different Friend
                </Button>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareStatsModal;
