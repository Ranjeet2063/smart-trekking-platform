import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { trekAPI, sosAPI } from '../services/api';
import Loader from '../components/Loader';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [treks, setTreks] = useState([]);
  const [activeSOS, setActiveSOS] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trekRes, sosRes] = await Promise.all([
          trekAPI.list(),
          sosAPI.listIncidents().catch(() => ({ data: { data: { incidents: [] } } })),
        ]);
        setTreks(trekRes.data.data.treks);
        setActiveSOS(sosRes.data.data.incidents.filter((i) => ['triggered', 'acknowledged', 'dispatched'].includes(i.status)));
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeTreks = treks.filter((t) => t.status === 'active');
  const upcomingTreks = treks.filter((t) => t.status === 'upcoming');
  const completedTreks = treks.filter((t) => t.status === 'completed');

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-gray-500 mt-1">Here's your trekking overview</p>
        </div>
        <Link to="/treks/new" className="btn-primary">
          + New Trek
        </Link>
      </div>

      {activeSOS.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-danger-500 rounded-full animate-pulse" />
            <span className="font-medium text-danger-700">
              {activeSOS.length} active SOS incident{activeSOS.length > 1 ? 's' : ''}
            </span>
            <Link to="/sos" className="text-danger-600 hover:text-danger-700 font-medium text-sm ml-auto">
              View Details →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-primary-600">{activeTreks.length}</p>
              <p className="text-gray-500 text-sm">Active Treks</p>
            </div>
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-success-600">{upcomingTreks.length}</p>
              <p className="text-gray-500 text-sm">Upcoming</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-700">{completedTreks.length}</p>
              <p className="text-gray-500 text-sm">Completed</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Treks</h2>
        {activeTreks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No active treks</p>
            <Link to="/treks/new" className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block">
              Start a new trek →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTreks.map((trek) => (
              <Link key={trek.id} to={`/treks/${trek.id}`} className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{trek.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {trek.participant_count} participants · {trek.difficulty}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link to={`/treks/${trek.id}/live`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Live Map →
                    </Link>
                    <span className="badge-success">Active</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Treks</h2>
          {upcomingTreks.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No upcoming treks planned</p>
          ) : (
            <div className="space-y-2">
              {upcomingTreks.slice(0, 5).map((trek) => (
                <Link key={trek.id} to={`/treks/${trek.id}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{trek.name}</p>
                    <p className="text-xs text-gray-500">{new Date(trek.start_date).toLocaleDateString()}</p>
                  </div>
                  <span className="badge-info">Upcoming</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/treks/new" className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors">
              <svg className="w-6 h-6 text-primary-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium text-gray-700">New Trek</span>
            </Link>
            <Link to="/emergency-contacts" className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors">
              <svg className="w-6 h-6 text-primary-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Emergency Contacts</span>
            </Link>
            <Link to="/profile" className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors">
              <svg className="w-6 h-6 text-primary-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">My Profile</span>
            </Link>
            <Link to="/sos" className="p-4 border border-gray-200 rounded-lg text-center hover:bg-danger-50 transition-colors">
              <svg className="w-6 h-6 text-danger-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
              <span className="text-sm font-medium text-danger-600">SOS Center</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
