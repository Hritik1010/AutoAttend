import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from "@getmocha/users-service/react";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        setStatus('success');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (err) {
        console.error('Authentication error:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {status === 'loading' && (
            <>
              <LoadingSpinner size="lg" />
              <h2 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                Completing Sign In
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your credentials...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to AutoAttend!
              </h2>
              <p className="text-gray-600">
                Authentication successful. Redirecting to dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'Something went wrong during sign in.'}
              </p>
              <p className="text-sm text-gray-500">
                Redirecting back to login page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
