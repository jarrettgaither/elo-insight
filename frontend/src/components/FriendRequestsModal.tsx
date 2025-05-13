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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center p-4 z-50">
      <div className="bg-surface-dark border border-primary-700 text-content-primary !rounded-none shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-primary-800">
          <h2 className="text-2xl font-bold text-content-primary">Friend Requests</h2>
          <button
            onClick={onClose}
            className="bg-transparent hover:text-white text-content-secondary border-none p-0"
            aria-label="Close"
            type="button"
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

          {loading ? (
            <div className="text-center py-4 text-content-secondary">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-6 text-content-secondary">
              You don't have any pending friend requests.
            </div>
          ) : (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {requests.map((request: Friend) => (
              <div
                key={request.id}
                className="bg-primary-900/50 border border-primary-800 p-3 !rounded-none"
              >
                <div className="mb-2">
                  <div className="text-content-primary font-medium">{request.username}</div>
                  <div className="text-content-secondary text-sm">{request.email}</div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleRespondToRequest(request.id, 'reject')}
                    variant="destructive"
                    size="sm"
                    disabled={loading}
                    type="button"
                    className="bg-red-700 hover:bg-red-800 text-white border-none !rounded-none"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleRespondToRequest(request.id, 'accept')}
                    size="sm"
                    disabled={loading}
                    type="button"
                    className="bg-accent-600 hover:bg-accent-700 text-white border-none !rounded-none"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={onClose} 
              variant="outline" 
              type="button"
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

export default FriendRequestsModal;
