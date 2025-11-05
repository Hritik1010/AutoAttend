import { useState } from 'react';
import { useAuth } from "@/react-app/hooks/useAuth";
import { Shield, Users, Clock } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('Pass@123');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="https://mocha-cdn.com/019a4ead-1cfb-71c4-914c-dc2317d59ceb/image.png_8322.png" 
              alt="AutoAttend Logo" 
              className="w-16 h-16 rounded-xl shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AutoAttend
          </h1>
          <p className="text-gray-600 text-lg">
            Smart Attendance Tracking System
          </p>
          <p className="text-sm text-gray-500 mt-2">
            HR/Admin Access Required
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Secure Access Portal
            </h2>
            <p className="text-gray-600">
              Sign in with your authorized Google account to access the employee management system
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Admin"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Pass@123"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-2">
              For authorized personnel only
            </p>
            <p className="text-xs text-blue-700">
              This system is restricted to HR staff and administrators. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Employee Management</span>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Attendance Tracking</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            AutoAttend v2.0 - ESP32 Powered Attendance System
          </p>
        </div>
      </div>
    </div>
  );
}
