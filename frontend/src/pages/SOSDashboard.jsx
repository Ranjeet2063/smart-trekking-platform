import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { sosAPI } from '../services/api';
import { connectSocket, joinSOSRoom, leaveSOSRoom } from '../store/socketStore';
import MapView from '../components/MapView';
import Loader from '../components/Loader';

export default function SOSDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await sosAPI.getActive();
        setIncidents(res.data.data.incidents);
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);

    const socket = connectSocket();
    if (socket) {
      socket.on('sos:alert', (data) => {
        toast.error('New SOS Alert!', { duration: 10000 });
        fetchIncidents();
      });
      socket.on('sos:status_update', () => fetchIncidents());
    }

    return () => {
      clearInterval(interval);
      if (selected) leaveSOSRoom(selected.id);
    };
  }, []);

  const handleSelect = (inc) => {
    if (selected) leaveSOSRoom(selected.id);
    setSelected(inc);
    setNotes('');
    joinSOSRoom(inc.id);
  };

  const handleStatusUpdate = async (status) => {
    if (!selected) return;
    try {
      await sosAPI.updateStatus(selected.id, { status, notes });
      toast.success(`SOS ${status}`);
      const res = await sosAPI.getActive();
      setIncidents(res.data.data.incidents);
      setSelected(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const statusColors = {
    triggered: 'badge-danger',
    acknowledged: 'badge-warning',
    dispatched: 'badge-info',
    resolved: 'badge-success',
    closed: 'bg-gray-100 text-gray-600',
  };

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rescue Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-danger-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-danger-600">{incidents.length} Active Incidents</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {incidents.length === 0 ? (
            <div className="card text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No active incidents</p>
              <p className="text-gray-400 text-sm">All clear!</p>
            </div>
          ) : (
            incidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => handleSelect(inc)}
                className={`card w-full text-left hover:shadow-md transition-shadow ${
                  selected?.id === inc.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{inc.user_name}</span>
                  <span className={statusColors[inc.status]}>{inc.status}</span>
                </div>
                <p className="text-sm text-gray-500">{inc.trek_name || 'Unknown trek'}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(inc.created_at).toLocaleString()}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selected ? (
            <>
              <div className="card">
                <div className="h-64 mb-4">
                  <MapView
                    center={[parseFloat(selected.latitude), parseFloat(selected.longitude)]}
                    zoom={14}
                    markers={[{ lat: parseFloat(selected.latitude), lng: parseFloat(selected.longitude), label: `${selected.user_name} (SOS)` }]}
                    height="100%"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Trekker</p>
                    <p className="font-medium">{selected.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium">{selected.phone || selected.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Coordinates</p>
                    <p className="font-mono text-sm">{parseFloat(selected.latitude).toFixed(6)}, {parseFloat(selected.longitude).toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{new Date(selected.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {selected.message && (
                  <div className="mt-4 p-3 bg-danger-50 rounded-lg">
                    <p className="text-sm text-danger-700">{selected.message}</p>
                  </div>
                )}
              </div>

              {selected.status !== 'closed' && (
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selected.status === 'triggered' && (
                      <button onClick={() => handleStatusUpdate('acknowledged')} className="btn-primary">
                        Acknowledge
                      </button>
                    )}
                    {selected.status === 'acknowledged' && (
                      <button onClick={() => handleStatusUpdate('dispatched')} className="btn-primary">
                        Dispatch Team
                      </button>
                    )}
                    {['triggered', 'acknowledged', 'dispatched'].includes(selected.status) && (
                      <button onClick={() => handleStatusUpdate('resolved')} className="btn-success bg-success-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-success-700">
                        Mark Resolved
                      </button>
                    )}
                    {selected.status === 'resolved' && (
                      <button onClick={() => handleStatusUpdate('closed')} className="btn-secondary">
                        Close Incident
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rescue Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input-field"
                      rows={3}
                      placeholder="Add notes about the rescue operation..."
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card flex items-center justify-center py-16">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-gray-500">Select an incident to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
