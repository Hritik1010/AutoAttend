import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Legacy OAuth callback route no longer used. Redirect to home/login.
    const timer = setTimeout(() => navigate('/'), 200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
}
