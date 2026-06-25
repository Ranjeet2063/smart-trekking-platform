import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Treks from './pages/Treks';
import TrekDetail from './pages/TrekDetail';
import CreateTrek from './pages/CreateTrek';
import LiveMap from './pages/LiveMap';
import SOSPage from './pages/SOSPage';
import SOSDashboard from './pages/SOSDashboard';
import Profile from './pages/Profile';
import EmergencyContacts from './pages/EmergencyContacts';
import NotFound from './pages/NotFound';

export default function App() {
  const { isLoading } = useAuthStore();

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/treks" element={<Treks />} />
        <Route path="/treks/new" element={<CreateTrek />} />
        <Route path="/treks/:id" element={<TrekDetail />} />
        <Route path="/treks/:id/live" element={<LiveMap />} />
        <Route path="/sos" element={<SOSPage />} />
        <Route path="/sos/dashboard" element={<SOSDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/emergency-contacts" element={<EmergencyContacts />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
