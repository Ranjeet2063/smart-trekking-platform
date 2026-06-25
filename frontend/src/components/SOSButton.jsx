import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sosAPI } from '../services/api';

export default function SOSButton({ trekId, className = '' }) {
  const [isActive, setIsActive] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const handleSOS = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      setTimeout(() => setIsConfirming(false), 5000);
      return;
    }

    if (!navigator.geolocation) {
      toast.error('GPS not available on this device');
      return;
    }

    setIsSending(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await sosAPI.trigger({
        trek_id: trekId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude_meters: position.coords.altitude || null,
        accuracy_meters: position.coords.accuracy,
        message: 'SOS Alert - Need immediate assistance!',
      });

      toast.success('SOS sent! Emergency contacts notified.');
      setIsActive(true);
      setIsConfirming(false);
      navigate('/sos');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send SOS');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      onClick={handleSOS}
      disabled={isSending}
      className={`relative group ${className}`}
    >
      {isConfirming ? (
        <div className="flex flex-col items-center space-y-2">
          <div className="w-32 h-32 rounded-full bg-danger-600 text-white flex items-center justify-center animate-pulse shadow-lg shadow-danger-600/50">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <span className="text-danger-600 font-bold text-lg animate-pulse">TAP AGAIN TO CONFIRM SOS!</span>
        </div>
      ) : isActive ? (
        <div className="flex flex-col items-center space-y-2">
          <div className="w-32 h-32 rounded-full bg-gray-400 text-white flex items-center justify-center">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-gray-500 font-medium">SOS Active - Help is on the way</span>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="w-32 h-32 rounded-full bg-danger-500 text-white flex items-center justify-center hover:bg-danger-600 transition-colors shadow-lg hover:shadow-xl">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
          </div>
          <span className="text-gray-700 font-medium">SOS Emergency</span>
          <span className="text-gray-400 text-sm">Tap twice to activate</span>
        </div>
      )}
    </button>
  );
}
