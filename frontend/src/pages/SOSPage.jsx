import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sosAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Loader from '../components/Loader';

export default function SOSPage() {
  const { user } = useAuthStore();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sosAPI.listIncidents()
      .then((res) => setIncidents(res.data.data.incidents))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColors = {
    triggered: 'badge-danger',
    acknowledged: 'badge-warning',
    dispatched: 'badge-info',
    resolved: 'badge-success',
    closed: 'bg-gray-100 text-gray-600',
  };

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  const activeIncidents = incidents.filter((i) => ['triggered', 'acknowledged', 'dispatched'].includes(i.status));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOS Center</h1>
          <p className="text-gray-500 text-sm mt-1">{activeIncidents.length} active incidents</p>
        </div>
      </div>

      {activeIncidents.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-3 h-3 bg-danger-500 rounded-full animate-pulse" />
            <span className="font-semibold text-danger-700">Active SOS Incidents</span>
          </div>
          <div className="space-y-2">
            {activeIncidents.map((inc) => (
              <div key={inc.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{inc.trek_name || 'Unknown Trek'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(inc.created_at).toLocaleString()} · ({parseFloat(inc.latitude).toFixed(4)}, {parseFloat(inc.longitude).toFixed(4)})
                  </p>
                </div>
                <span className={statusColors[inc.status]}>{inc.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Incidents</h2>
        {incidents.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No SOS incidents</p>
            <p className="text-gray-400 text-sm mt-1">You're all clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div key={inc.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{inc.trek_name || 'SOS Alert'}</h3>
                      <span className={statusColors[inc.status]}>{inc.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(inc.created_at).toLocaleString()}
                      {inc.message && ` · ${inc.message}`}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p className="font-mono">{parseFloat(inc.latitude).toFixed(4)}, {parseFloat(inc.longitude).toFixed(4)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
