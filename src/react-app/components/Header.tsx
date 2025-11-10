import { useAuth } from "@/react-app/hooks/useAuth";
import { useLocation, Link } from "react-router";
import { LogOut, Users, Clock, BarChart3, Menu, X, UploadCloud } from 'lucide-react';
import { useState, useRef } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [otaOpen, setOtaOpen] = useState(false);
  const versionRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: Clock },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <img 
              src="https://mocha-cdn.com/019a4ead-1cfb-71c4-914c-dc2317d59ceb/image.png_8322.png" 
              alt="AutoAttend" 
              className="w-8 h-8 rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoAttend
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">Employee Management System</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username || 'Admin'}</p>
                <p className="text-xs text-gray-500">HR Admin</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(user?.username || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Logout Button */}
              {/* OTA Update Button */}
              <button
                onClick={() => setOtaOpen(true)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="OTA Update"
              >
                <UploadCloud className="w-5 h-5" />
              </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile User Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 px-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {(user?.username || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.username || 'Admin'}</p>
                  <p className="text-sm text-gray-500">HR Administrator</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* OTA Modal */}
      {otaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">ESP32 OTA Update</h3>
              <button onClick={() => setOtaOpen(false)} className="p-1 text-gray-500 hover:text-gray-700"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm text-gray-700">Version</label>
                <input ref={versionRef} type="text" placeholder="e.g. 1.0.3" className="w-full px-3 py-2 border rounded-md"/>
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-700">Firmware (.bin)</label>
                <input ref={fileRef} type="file" accept=".bin" className="w-full"/>
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setOtaOpen(false)} className="px-3 py-2 text-gray-700 bg-gray-100 rounded-md">Cancel</button>
                <button
                  onClick={async () => {
                    const version = versionRef.current?.value?.trim();
                    const file = fileRef.current?.files?.[0];
                    if (!version) { alert('Enter version'); return; }
                    if (!file) { alert('Select firmware .bin'); return; }
                    const form = new FormData();
                    form.append('version', version);
                    form.append('firmware', file);
                    try {
                      const res = await fetch('/api/ota/upload', { method: 'POST', body: form });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(data.error || 'Upload failed');
                      }
                      alert('Firmware uploaded. Devices will update on next check.');
                      setOtaOpen(false);
                    } catch (e) {
                      alert(e instanceof Error ? e.message : 'Upload error');
                    }
                  }}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
