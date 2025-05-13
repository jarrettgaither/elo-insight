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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center p-4 z-50">
      <div className="bg-surface-dark border border-primary-700 text-content-primary !rounded-none shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-primary-800">
          <h2 className="text-2xl font-bold text-content-primary">Add Friend</h2>
          <button
            onClick={onClose}
            className="bg-transparent hover:text-white text-content-secondary border-none p-0"
            aria-label="Close"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-900/40 text-red-300 p-3 mb-4 border-l-4 border-red-600 !rounded-none">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-900/40 text-green-300 p-3 mb-4 border-l-4 border-green-600 !rounded-none">
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
              className="flex-1 p-3 bg-surface-dark border border-primary-800 !rounded-none text-content-primary focus:border-accent-600 focus:outline-none"
              disabled={loading}
            />
            <Button 
              type="submit" 
              disabled={loading || !searchQuery.trim()}
              className="bg-accent-600 hover:bg-accent-700 text-white border-none !rounded-none"
            >
              Search
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-4 text-content-secondary">Searching...</div>
        ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-content-primary mb-2">Results:</h3>
            <div className="space-y-2">
              {/* Ensure searchResults is an array before mapping */}
              {Array.isArray(searchResults) && searchResults.map((user) => (
                <div
                  key={user.id}
                  className="bg-primary-900/50 border border-primary-800 p-3 !rounded-none flex justify-between items-center"
                >
                  <div>
                    <div className="text-content-primary font-medium">{user.username}</div>
                    <div className="text-content-secondary text-sm">{user.email}</div>
                  </div>
                  <Button
                    onClick={() => handleSendRequest(user.id)}
                    size="sm"
                    disabled={loading}
                    className="bg-accent-600 hover:bg-accent-700 text-white border-none !rounded-none"
                  >
                    Add Friend
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={onClose} 
            variant="outline"
            className="border-primary-700 text-content-secondary hover:bg-primary-800 !rounded-none"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default AddFriendModal;
