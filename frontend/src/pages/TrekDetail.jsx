import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { trekAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import MapView from '../components/MapView';
import SOSButton from '../components/SOSButton';
import Loader from '../components/Loader';

export default function TrekDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [trek, setTrek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trekAPI.getById(id)
      .then((res) => setTrek(res.data.data.trek))
      .catch(() => { toast.error('Trek not found'); navigate('/treks'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (action) => {
    try {
      await trekAPI[action](id);
      const res = await trekAPI.getById(id);
      setTrek(res.data.data.trek);
      toast.success(`Trek ${action}ed!`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} trek`);
    }
  };

  const isOwner = trek?.user_id === user?.id;

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;
  if (!trek) return null;

  const routeCoords = trek.route_data?.map((r) => [r.lat, r.lng]) || [];
  const checkpointMarkers = trek.checkpoints?.map((c) => ({ lat: parseFloat(c.latitude), lng: parseFloat(c.longitude), label: c.name })) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/treks" className="text-sm text-gray-500 hover:text-gray-700">← Back to Treks</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{trek.name}</h1>
        </div>
        <div className="flex items-center space-x-3">
          {trek.status === 'active' && (
            <>
              <Link to={`/treks/${id}/live`} className="btn-primary">Live Map</Link>
              {isOwner && <SOSButton trekId={id} />}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="h-64">
              <MapView
                markers={checkpointMarkers}
                route={routeCoords}
                height="100%"
              />
            </div>
          </div>

          {trek.description && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{trek.description}</p>
            </div>
          )}

          {trek.checkpoints?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Checkpoints ({trek.checkpoints.length})</h3>
              <div className="space-y-2">
                {trek.checkpoints.sort((a, b) => a.order_index - b.order_index).map((cp) => (
                  <div key={cp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-700">
                        {cp.order_index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cp.name}</p>
                        <p className="text-xs text-gray-500">
                          {parseFloat(cp.latitude).toFixed(4)}, {parseFloat(cp.longitude).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trek.participants?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Participants ({trek.participants.length})</h3>
              <div className="space-y-2">
                {trek.participants.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                        {p.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{p.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Trek Details</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd><span className="badge-success">{trek.status}</span></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Difficulty</dt>
                <dd className="font-medium capitalize">{trek.difficulty}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Start Date</dt>
                <dd className="font-medium">{new Date(trek.start_date).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">End Date</dt>
                <dd className="font-medium">{new Date(trek.end_date).toLocaleDateString()}</dd>
              </div>
              {trek.total_distance_km && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Distance</dt>
                  <dd className="font-medium">{trek.total_distance_km} km</dd>
                </div>
              )}
              {trek.estimated_duration_hours && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="font-medium">{trek.estimated_duration_hours} hrs</dd>
                </div>
              )}
            </dl>
          </div>

          {isOwner && trek.status === 'upcoming' && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-gray-900">Actions</h3>
              <button onClick={() => handleStatusChange('start')} className="btn-primary w-full">
                Start Trek
              </button>
            </div>
          )}

          {isOwner && trek.status === 'active' && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-gray-900">Manage Trek</h3>
              <button onClick={() => handleStatusChange('complete')} className="btn-primary w-full">
                Complete Trek
              </button>
              <button onClick={() => handleStatusChange('abort')} className="btn-danger w-full">
                Abort Trek
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
