import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <p className="text-2xl text-white mt-4">Page Not Found</p>
        <p className="text-gray-400 mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block mt-8 btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

