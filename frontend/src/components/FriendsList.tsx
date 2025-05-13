import { useState, useEffect } from 'react';
import { getFriends, removeFriend, Friend } from '../lib/friendsService';
import AddFriendModal from './AddFriendModal';
import FriendRequestsModal from './FriendRequestsModal';
import { Button } from './ui/button';

const FriendsList = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  // Load friends on component mount
  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await getFriends();
      // Ensure friendsData is not null before setting state
      setFriends(Array.isArray(friendsData) ? friendsData : []);
      setError('');
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends. Please try again.');
      // Reset friends to empty array in case of error
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendshipId: number) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      await removeFriend(friendshipId);
      // Update the friends list by removing the deleted friend
      // Add defensive check to ensure friends is an array
      if (Array.isArray(friends)) {
        setFriends(friends.filter(friend => friend.id !== friendshipId));
      }
    } catch (err) {
      console.error('Error removing friend:', err);
      setError('Failed to remove friend. Please try again.');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Friends List</h1>
        <div className="space-x-2">
          <Button onClick={() => setShowRequestsModal(true)} variant="outline">
            Friend Requests
          </Button>
          <Button onClick={() => setShowAddFriendModal(true)}>
            Add Friend
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400">Loading friends...</div>
      ) : !Array.isArray(friends) || friends.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p>You haven't added any friends yet.</p>
          <p className="mt-2">
            Click "Add Friend" to start building your network!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Double check that friends is an array before mapping */}
          {Array.isArray(friends) && friends.map(friend => (
            <div
              key={friend.id}
              className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {friend.username}
                </h3>
                <p className="text-gray-400 text-sm">{friend.email}</p>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <Button
                  onClick={() => handleRemoveFriend(friend.id)}
                  variant="destructive"
                  size="sm"
                >
                  Remove Friend
                </Button>
                {/* Compare stats button will be added in batch 3 */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddFriendModal && (
        <AddFriendModal
          onClose={() => setShowAddFriendModal(false)}
          onFriendAdded={loadFriends}
        />
      )}

      {showRequestsModal && (
        <FriendRequestsModal
          onClose={() => setShowRequestsModal(false)}
          onRequestAccepted={loadFriends}
        />
      )}
    </div>
  );
};

export default FriendsList;
