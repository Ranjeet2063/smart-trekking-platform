import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { trekAPI } from '../services/api';

export default function CreateTrek() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', difficulty: 'moderate',
    start_date: '', end_date: '', total_distance_km: '',
    estimated_duration_hours: '', max_participants: 20,
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.end_date) < new Date(form.start_date)) {
      return toast.error('End date must be after start date');
    }
    setLoading(true);
    try {
      const { data } = await trekAPI.create({
        ...form,
        total_distance_km: form.total_distance_km ? parseFloat(form.total_distance_km) : undefined,
        estimated_duration_hours: form.estimated_duration_hours ? parseFloat(form.estimated_duration_hours) : undefined,
      });
      toast.success('Trek created!');
      navigate(`/treks/${data.data.trek.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create trek');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Trek</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trek Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="Everest Base Camp Trek" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="input-field" rows={3} placeholder="Describe your trek..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange} className="input-field">
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
              <option value="extreme">Extreme</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="input-field" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Distance (km)</label>
              <input type="number" name="total_distance_km" value={form.total_distance_km} onChange={handleChange} className="input-field" placeholder="130" min="0" step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Duration (hours)</label>
              <input type="number" name="estimated_duration_hours" value={form.estimated_duration_hours} onChange={handleChange} className="input-field" placeholder="312" min="0" step="0.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
            <input type="number" name="max_participants" value={form.max_participants} onChange={handleChange} className="input-field" min="1" max="100" />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5">
              {loading ? 'Creating...' : 'Create Trek'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-6 py-2.5">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
