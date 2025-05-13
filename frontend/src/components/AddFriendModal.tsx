import { useState } from 'react';
import { searchUsers, sendFriendRequest, UserSearchResult } from '../lib/friendsService';
import { Button } from './ui/button';

interface AddFriendModalProps {
  onClose: () => void;
  onFriendAdded: () => void;
}

const AddFriendModal = ({ onClose, onFriendAdded }: AddFriendModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError('');
      const results = await searchUsers(searchQuery);
      
      // Ensure results is always an array before setting state
      const safeResults = Array.isArray(results) ? results : [];
      setSearchResults(safeResults);
      
      if (safeResults.length === 0) {
        setError('No users found matching your search.');
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search for users. Please try again.');
      // Reset search results to empty array in case of error
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: number) => {
    try {
      setLoading(true);
      await sendFriendRequest(userId);
      setSuccessMessage('Friend request sent successfully!');
      // Clear search results to show the success message more clearly
      setSearchResults([]);
      setSearchQuery('');
      // Refresh the friends list in case the request was auto-accepted
      if (typeof onFriendAdded === 'function') {
        onFriendAdded();
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError('Failed to send friend request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Add Friend</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500 text-white p-3 rounded-md mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or email"
              className="flex-1 p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !searchQuery.trim()}>
              Search
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-4 text-gray-400">Searching...</div>
        ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-2">Results:</h3>
            <div className="space-y-2">
              {/* Ensure searchResults is an array before mapping */}
              {Array.isArray(searchResults) && searchResults.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-700 p-3 rounded-md flex justify-between items-center"
                >
                  <div>
                    <div className="text-white font-medium">{user.username}</div>
                    <div className="text-gray-400 text-sm">{user.email}</div>
                  </div>
                  <Button
                    onClick={() => handleSendRequest(user.id)}
                    size="sm"
                    disabled={loading}
                  >
                    Add Friend
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;
