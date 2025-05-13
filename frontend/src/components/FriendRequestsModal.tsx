import React, { useState, useEffect } from 'react';
import { getFriendRequests, respondToFriendRequest, Friend } from '../lib/friendsService';
import { Button } from './ui/button';

interface FriendRequestsModalProps {
  onClose: () => void;
  onRequestAccepted: () => void;
}

const FriendRequestsModal = ({ onClose, onRequestAccepted }: FriendRequestsModalProps) => {
  const [requests, setRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFriendRequests();
  }, []);

  const loadFriendRequests = async (): Promise<void> => {
    try {
      setLoading(true);
      const requestsData = await getFriendRequests();
      // Ensure requestsData is always an array, even if the API returns null
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (err) {
      console.error('Error loading friend requests:', err);
      setError('Failed to load friend requests. Please try again.');
      // Reset requests to empty array in case of error
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: number, action: 'accept' | 'reject'): Promise<void> => {
    try {
      setLoading(true);
      await respondToFriendRequest(requestId, action);
      
      // Remove the request from the list
      setRequests(requests.filter(request => request.id !== requestId));
      
      // Refresh the friends list if a request was accepted
      if (action === 'accept') {
        onRequestAccepted();
      }
    } catch (err) {
      console.error(`Error ${action}ing friend request:`, err);
      setError(`Failed to ${action} friend request. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Friend Requests</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-4 text-gray-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            You don't have any pending friend requests.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {requests.map((request: Friend) => (
              <div
                key={request.id}
                className="bg-gray-700 p-3 rounded-md"
              >
                <div className="mb-2">
                  <div className="text-white font-medium">{request.username}</div>
                  <div className="text-gray-400 text-sm">{request.email}</div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleRespondToRequest(request.id, 'reject')}
                    variant="destructive"
                    size="sm"
                    disabled={loading}
                    type="button"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleRespondToRequest(request.id, 'accept')}
                    size="sm"
                    disabled={loading}
                    type="button"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline" type="button">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FriendRequestsModal;
