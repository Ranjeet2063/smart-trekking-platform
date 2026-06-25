import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { locationAPI, trekAPI } from '../services/api';
import { connectSocket, joinTrekRoom, leaveTrekRoom } from '../store/socketStore';
import MapView from '../components/MapView';
import Loader from '../components/Loader';
import SOSButton from '../components/SOSButton';
import toast from 'react-hot-toast';

export default function LiveMap() {
  const { id: trekId } = useParams();
  const [trek, setTrek] = useState(null);
  const [locations, setLocations] = useState([]);
  const [latestLocation, setLatestLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const socketCleanupRef = useRef(null);

  useEffect(() => {
    const tid = trekId;
    trekAPI.getById(tid).then((res) => {
      setTrek(res.data.data.trek);
    }).catch(console.error);

    locationAPI.getLatest(tid).then((res) => {
      if (res.data.data.location) {
        setLatestLocation(res.data.data.location);
      }
    }).catch(() => {});

    const socket = connectSocket();
    if (socket) {
      joinTrekRoom(tid);

      const handler = (data) => {
        setLatestLocation(data);
        setLocations((prev) => {
          const updated = [...prev, { lat: data.latitude, lng: data.longitude }];
          return updated.slice(-500);
        });
      };

      socket.on('location:update', handler);
      socketCleanupRef.current = () => {
        socket.off('location:update', handler);
      };
    }

    setLoading(false);

    return () => {
      leaveTrekRoom(tid);
      if (socketCleanupRef.current) {
        socketCleanupRef.current();
      }
    };
  }, [trekId]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('GPS not available');
      return;
    }

    setIsTracking(true);

    const watchIdVal = navigator.geolocation.watchPosition(
      async (position) => {
        const data = {
          trek_id: trekId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude_meters: position.coords.altitude,
          speed_kmh: position.coords.speed,
          heading_degrees: position.coords.heading,
          accuracy_meters: position.coords.accuracy,
          battery_level: null,
          timestamp: new Date().toISOString(),
        };

        setLatestLocation(data);
        setLocations((prev) => {
          const updated = [...prev, { lat: data.latitude, lng: data.longitude }];
          return updated.slice(-1000);
        });

        try {
          await locationAPI.update(data);
        } catch (error) {
          console.error('Location update failed:', error);
        }
      },
      (error) => {
        console.error('GPS error:', error);
        toast.error('GPS error: ' + error.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    setWatchId(watchIdVal);
  }, [trekId]);

  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  const routeCoords = trek?.route_data?.map((r) => [r.lat, r.lng]) || [];
  const currentLatLng = latestLocation ? [latestLocation.latitude, latestLocation.longitude] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/treks/${trekId}`} className="text-sm text-gray-500 hover:text-gray-700">← Back to Trek</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Live Tracking: {trek?.name}</h1>
        </div>
        <div className="flex items-center space-x-3">
          {!isTracking ? (
            <button onClick={startTracking} className="btn-primary">Start GPS Tracking</button>
          ) : (
            <button onClick={stopTracking} className="btn-danger">Stop Tracking</button>
          )}
          <SOSButton trekId={trekId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden" style={{ height: '500px' }}>
            <MapView
              center={currentLatLng || [20.5937, 78.9629]}
              zoom={currentLatLng ? 14 : 5}
              markers={currentLatLng ? [{ lat: currentLatLng[0], lng: currentLatLng[1], label: 'You' }] : []}
              route={routeCoords}
              height="100%"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">GPS Status</h3>
            <div className="space-y-3">
              {latestLocation ? (
                <>
                  <div className="flex justify-between"><span className="text-gray-500">Latitude</span><span className="font-mono text-sm">{latestLocation.latitude?.toFixed(6)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Longitude</span><span className="font-mono text-sm">{latestLocation.longitude?.toFixed(6)}</span></div>
                  {latestLocation.altitude_meters && <div className="flex justify-between"><span className="text-gray-500">Altitude</span><span className="font-medium">{latestLocation.altitude_meters} m</span></div>}
                  {latestLocation.speed_kmh !== undefined && <div className="flex justify-between"><span className="text-gray-500">Speed</span><span className="font-medium">{latestLocation.speed_kmh?.toFixed(1) || 0} km/h</span></div>}
                  {latestLocation.heading_degrees !== undefined && <div className="flex justify-between"><span className="text-gray-500">Heading</span><span className="font-medium">{latestLocation.heading_degrees?.toFixed(0)}°</span></div>}
                  <div className="pt-2 border-t border-gray-100">
                    <div className={`flex items-center space-x-2 ${isTracking ? 'text-success-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-success-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-sm font-medium">{isTracking ? 'Live' : 'Not tracking'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">Waiting for GPS data...</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <SOSButton trekId={trekId} className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
