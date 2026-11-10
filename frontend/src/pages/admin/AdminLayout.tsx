import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../shared/components/Button';
import { LogOut, Layers, Home } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isObjects = location.pathname.startsWith('/admin/objects');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/admin" className="flex items-center gap-2.5 font-bold text-lg text-slate-900">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <Layers className="w-5 h-5" />
              </div>
              <span>360 Panorama</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-slate-100 text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Home className="w-4 h-4" />
                  <span>Главная</span>
                </div>
              </Link>
              <Link
                to="/admin/objects"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isObjects
                    ? 'bg-slate-100 text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Объекты</span>
                </div>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden sm:inline-block text-sm text-slate-600 font-medium">
                {user.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Выйти
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

