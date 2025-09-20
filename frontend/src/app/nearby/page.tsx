'use client';
import { useEffect, useState } from 'react';
import { api, loadAuthTokenFromStorage } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import dynamic from 'next/dynamic';

const NearbyMap = dynamic(() => import('@/components/NearbyMap'), { ssr: false });

type User = {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  is_available: boolean;
};

type HangoutRequest = {
  id: string;
  from: { id: string; userName: string; firstName?: string; avatarUrl?: string };
  to?: { id: string; userName: string; firstName?: string; avatarUrl?: string }; // Optional for received requests
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
};

export default function NearbyPage() {
  const router = useRouter();
  const { socket, isConnected, notifications } = useWebSocket();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<User[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [hangoutRequests, setHangoutRequests] = useState<HangoutRequest[]>([]);
  const [allHangoutRequests, setAllHangoutRequests] = useState<HangoutRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);

  // Derived: number of pending requests (safe for any shape)
  const pendingCount = Array.isArray(hangoutRequests)
    ? hangoutRequests.filter(r => r?.status === 'pending').length
    : 0;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    loadAuthTokenFromStorage();
    getCurrentLocation();
    fetchUserProfile();
    fetchHangoutRequests();
  }, [router]);

  // Handle WebSocket notifications
  useEffect(() => {
    if (notifications.length > 0) {
      // Refresh hangout requests when new notifications arrive
      fetchHangoutRequests();
      
      // Auto-show the requests panel when a new hangout request notification arrives
      const hasHangoutRequest = notifications.some(notif => notif.type === 'hangout_request');
      if (hasHangoutRequest) {
        setShowRequests(true);
        // No alert popup - just show in the requests panel
      }
    }
  }, [notifications]);

  async function getCurrentLocation() {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        
        // Update user location in backend
        try {
          await api.patch('/users/me/location', {
            latitude,
            longitude,
            is_available: true,
          });
          
          // Fetch nearby users
          await fetchNearbyUsers(latitude, longitude);
        } catch (err: any) {
          setError(err?.response?.data?.message || err.message || 'Failed to update location');
        }
      },
      (error) => {
        setError(`Location error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  async function fetchUserProfile() {
    try {
      const { data } = await api.get('/users/me');
      setUserProfile(data?.data ?? data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
    }
  }

  async function fetchNearbyUsers(lat: number, lon: number) {
    try {
      const { data } = await api.get('/users/nearby', {
        params: { latitude: lat, longitude: lon, radiusKm: 5 }
      });
      const rows = data?.data ?? data ?? [];
      setNearbyUsers(rows.map((u: any) => ({
        ...u,
        distance_km: u.distance_km ?? u.distanceKm ?? u.distancekm,
      })));
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch nearby users');
    } finally {
      setLoading(false);
    }
  }

  async function fetchHangoutRequests() {
    try {
      console.log('Fetching hangout requests...');
      const { data } = await api.get('/hangouts/requests');
      console.log('Raw API response:', data);
      
      const payload = data?.data ?? data ?? {};
      console.log('Hangout requests payload:', payload);
      
      // Backend returns { sent:[], received:[] }; combine both for duplicate checking
      const sent = Array.isArray(payload?.sent) ? payload.sent : [];
      const received = Array.isArray(payload?.received) ? payload.received : [];
      
      console.log('Sent requests:', sent);
      console.log('Received requests:', received);
      
      // Combine sent and received requests for duplicate checking
      const allRequests = [...sent, ...received];
      console.log('All requests:', allRequests);
      
      // Store all requests for duplicate checking
      setAllHangoutRequests(allRequests);
      
      // For display, show received requests (incoming requests)
      setHangoutRequests(received);
      console.log('Set hangout requests to:', received);
    } catch (err: any) {
      console.error('Failed to fetch hangout requests:', err);
    }
  }

  async function sendHangoutRequest(userId: string) {
    setSendingRequest(userId);
    try {
      const user = nearbyUsers.find(u => u.id === userId);
      if (!user) {
        alert('User not found');
        return;
      }
      
      // Check if there's already a pending request between these users
      const existingRequest = allHangoutRequests.find(req => 
        (req.from?.id === userProfile?.id && req.to?.id === userId) ||
        (req.from?.id === userId && req.to?.id === userProfile?.id)
      );
      
      if (existingRequest && existingRequest.status === 'pending') {
        alert('You already have a pending request with this user!');
        setSendingRequest(null);
        return;
      }
      
      // Create a personalized message with the sender's name
      const senderName = userProfile?.userName || userProfile?.firstName || 'Someone';
      const message = `Hey ${user.userName || user.firstName}! ${senderName} wants to hang out with you!`;
      
      console.log('Sending hangout request with data:', { 
        to_profile_id: userId,
        message: message
      });
      
      const response = await api.post('/hangouts/send', { 
        to_profile_id: userId,
        message: message
      });
      
      console.log('Hangout request response:', response);
      
      // Show success notification with real names
      const displayName = user.userName || user.firstName || 'User';
      alert(`Hangout request sent to ${displayName}!`);
      
      // Refresh requests
      await fetchHangoutRequests();
    } catch (err: any) {
      console.error('Error sending hangout request:', err);
      console.error('Error response:', err?.response?.data);
      console.error('Error status:', err?.response?.status);
      alert(`Failed to send hangout request: ${err?.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setSendingRequest(null);
    }
  }

  async function respondToRequest(requestId: string, status: 'accepted' | 'declined') {
    try {
      await api.post(`/hangouts/respond/${requestId}`, { accept: status === 'accepted' });
      
      if (status === 'accepted') {
        // If accepted, share location with the person
        try {
          // Get current location
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            });
          });
          
          const { latitude, longitude } = position.coords;
          
          // Create a location message
          const locationMessage = `📍 I'm at: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}. Let's meet up!`;
          
          // Send location message to the other person
          // For now, we'll just show it in an alert
          // In a real app, you'd send this via WebSocket or API
          alert(`Request accepted! Location shared: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          
          // TODO: Send location message to the other person via WebSocket
          // socket?.emit('send_location_message', { requestId, message: locationMessage });
          
        } catch (locationError) {
          alert(`Request accepted! (Location sharing failed: ${locationError})`);
        }
      } else {
        alert(`Request declined.`);
      }
      
      // Refresh requests to update the count
      await fetchHangoutRequests();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to respond to request');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your location and nearby users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">📍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Location Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={getCurrentLocation}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">📍</div>
          <p className="text-gray-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">People Nearby</h1>
              <p className="text-gray-600">Find people within 5km to hang out with</p>
            </div>
            <div className="flex items-center gap-4">
              {/* WebSocket Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Notifications */}
              {notifications.length > 0 && (
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 animate-pulse">
                  <span className="text-sm text-yellow-800 font-semibold">
                    🔔 {notifications.length} new notification{notifications.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              <button
                onClick={() => {
                  console.log('Hangout Requests button clicked, current state:', showRequests);
                  console.log('Current hangout requests:', hangoutRequests);
                  console.log('Pending count:', pendingCount);
                  setShowRequests(!showRequests);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition relative"
              >
                Hangout Requests
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => getCurrentLocation()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Refresh Location
              </button>
              <button
                onClick={() => {
                  console.log('Test button clicked - forcing panel to show');
                  setShowRequests(true);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Test Panel
              </button>
              <button
                onClick={() => {
                  console.log('Adding test request');
                  const testRequest = {
                    id: 'test-123',
                    from: {
                      id: 'test-user',
                      userName: 'Test User',
                      firstName: 'Test',
                      avatarUrl: undefined
                    },
                    message: 'Test hangout request - Click Accept or Decline!',
                    status: 'pending' as const,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                  };
                  setHangoutRequests([testRequest]);
                  setShowRequests(true);
                  console.log('Modal should be visible now!');
                }}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition font-bold text-lg"
              >
                🧪 TEST MODAL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container (client-only) */}
      <div className="h-[calc(100vh-120px)] relative">
        <NearbyMap
          userLocation={userLocation}
          nearbyUsers={nearbyUsers}
          onSendRequest={(id) => sendHangoutRequest(id)}
          sendingRequest={sendingRequest}
          allHangoutRequests={allHangoutRequests}
          userProfile={userProfile}
        />

        {/* Modal for requests */}
        {showRequests && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowRequests(false);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-2xl w-96 max-h-[80vh] overflow-y-auto border-4 border-blue-500">
              {(() => {
                console.log('Rendering modal, showRequests:', showRequests, 'hangoutRequests:', hangoutRequests);
                return null;
              })()}
              <div className="p-4 border-b-2 border-blue-500 flex justify-between items-center bg-blue-50">
                <h3 className="font-bold text-xl text-blue-800">🎉 Hangout Requests</h3>
                <button
                  onClick={() => setShowRequests(false)}
                  className="text-red-500 hover:text-red-700 text-3xl font-bold bg-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                {(() => {
                  console.log('Rendering hangout requests in modal:', hangoutRequests);
                  return null;
                })()}
                {hangoutRequests.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No hangout requests yet</p>
                ) : (
                  <div className="space-y-4">
                    {hangoutRequests.map((request) => {
                      // Safety check to prevent undefined errors
                      if (!request || !request.from) {
                        console.warn('Invalid request object:', request);
                        return null;
                      }
                      
                      return (
                        <div key={request.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center gap-3 mb-3">
                            {request.from.avatarUrl ? (
                              <img
                                src={request.from.avatarUrl}
                                alt={request.from.userName || 'User'}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                {request.from.userName?.charAt(0) || request.from.firstName?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-base">
                                {request.from.userName || request.from.firstName || 'Unknown User'}
                              </span>
                              <p className="text-xs text-gray-500">
                                {new Date(request.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {request.message && (
                            <p className="text-sm text-gray-700 mb-3 bg-white p-2 rounded border">
                              "{request.message}"
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className={`font-medium px-2 py-1 rounded text-xs ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          
                          {request.status === 'pending' && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  console.log('Accept button clicked for request:', request.id);
                                  respondToRequest(request.id, 'accepted');
                                }}
                                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-medium"
                              >
                                ✅ Accept
                              </button>
                              <button
                                onClick={() => {
                                  console.log('Decline button clicked for request:', request.id);
                                  respondToRequest(request.id, 'declined');
                                }}
                                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium"
                              >
                                ❌ Decline
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}