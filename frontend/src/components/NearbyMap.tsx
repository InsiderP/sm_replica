'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const nearbyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type User = {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  latitude: number;
  longitude: number;
  gender?: string;
  distance_km: number;
  is_available: boolean;
};

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function NearbyMap({
  userLocation,
  nearbyUsers,
  onSendRequest,
  sendingRequest,
  allHangoutRequests,
  userProfile,
}: {
  userLocation: [number, number];
  nearbyUsers: User[];
  onSendRequest: (userId: string) => void;
  sendingRequest?: string | null;
  allHangoutRequests?: any[];
  userProfile?: any;
}) {
  const mapRef = useRef<L.Map>(null);

  return (
    <MapContainer
      center={userLocation}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater center={userLocation} zoom={13} />

      {/* User location */}
      <Marker position={userLocation} icon={userIcon}>
        <Popup>
          <div className="text-center">
            <h3 className="font-bold">You are here</h3>
          </div>
        </Popup>
      </Marker>

      {/* 5km radius */}
      <Circle
        center={userLocation}
        radius={5000}
        pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1, weight: 2 }}
      />

      {/* Nearby users */}
      {nearbyUsers.map((user) => (
        <Marker key={user.id} position={[user.latitude, user.longitude]} icon={nearbyIcon}>
          <Popup>
            <div className="text-center min-w-[220px]">
              <div className="flex items-center gap-3 mb-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.userName} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{user.userName}</h3>
                  <p className="text-sm text-gray-600">
                    {user.firstName} {user.lastName}
                  </p>
                  {user.gender && (
                    <p className="text-xs text-gray-500 capitalize">{user.gender}</p>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold text-green-600 mb-3">
                {user.distance_km?.toFixed(1)} km away
              </p>
              {(() => {
                // Check if there's already a pending request between these users
                const existingRequest = allHangoutRequests?.find((req: any) => 
                  (req.from?.id === userProfile?.id && req.to?.id === user.id) ||
                  (req.from?.id === user.id && req.to?.id === userProfile?.id)
                );
                
                const hasPendingRequest = existingRequest && existingRequest.status === 'pending';
                
                return (
                  <button
                    onClick={() => onSendRequest(user.id)}
                    disabled={sendingRequest === user.id || hasPendingRequest}
                    className={`w-full px-4 py-2 rounded-lg transition ${
                      hasPendingRequest 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {sendingRequest === user.id 
                      ? 'Sending...' 
                      : hasPendingRequest 
                        ? 'Request Pending' 
                        : 'Send Hangout Request'
                    }
                  </button>
                );
              })()}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}


