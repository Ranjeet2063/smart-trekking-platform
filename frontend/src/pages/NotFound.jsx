import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <h1 className="text-8xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Trail Not Found</h2>
        <p className="text-primary-200 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="inline-flex items-center px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
          Back to Base Camp
        </Link>
      </div>
    </div>
  );
}
