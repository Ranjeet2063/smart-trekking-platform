import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trekAPI } from '../services/api';
import Loader from '../components/Loader';

export default function Treks() {
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    trekAPI.list()
      .then((res) => setTreks(res.data.data.treks))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? treks : treks.filter((t) => t.status === filter);

  const statusColors = {
    draft: 'badge-info',
    upcoming: 'badge-warning',
    active: 'badge-success',
    completed: 'bg-gray-100 text-gray-600',
    aborted: 'badge-danger',
  };

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Treks</h1>
          <p className="text-gray-500 text-sm mt-1">{treks.length} treks total</p>
        </div>
        <Link to="/treks/new" className="btn-primary">+ New Trek</Link>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['all', 'active', 'upcoming', 'completed', 'draft', 'aborted'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-500">No {filter !== 'all' ? filter : ''} treks found</p>
          <Link to="/treks/new" className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block">
            Create your first trek →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trek) => (
            <Link key={trek.id} to={`/treks/${trek.id}`} className="card block hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-900 truncate">{trek.name}</h3>
                    <span className={statusColors[trek.status]}>{trek.status}</span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Difficulty: {trek.difficulty}</span>
                    <span>{new Date(trek.start_date).toLocaleDateString()} - {new Date(trek.end_date).toLocaleDateString()}</span>
                    {trek.participant_count && <span>{trek.participant_count} participants</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {trek.status === 'active' && (
                    <Link
                      to={`/treks/${trek.id}/live`}
                      onClick={(e) => e.stopPropagation()}
                      className="btn-primary text-sm px-3 py-1.5"
                    >
                      Live Map
                    </Link>
                  )}
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
