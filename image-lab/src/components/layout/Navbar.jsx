import { NavLink, useNavigate } from 'react-router-dom';
import {
  Wind,
  Layers,
  Blend,
  ScanLine,
  LogOut,
  User,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/app/noise', label: 'Bruit & Filtre', icon: Wind },
  { to: '/app/convolution', label: 'Convolution', icon: Layers },
  { to: '/app/blur', label: 'Flou', icon: Blend },
  { to: '/app/edge', label: 'Détection de Contour', icon: ScanLine },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-14 px-4 gap-2 flex items-center border-b
      ${
        isDark
          ? 'glass-strong border-surface-border'
          : 'bg-white/95 backdrop-blur-md border-slate-200 shadow-sm'
      }`}
    >
      {/* LOGO */}
      <NavLink to="/app/noise" className="flex items-center gap-2 mr-6 shrink-0">
        <span
          className={`font-bold text-lg hidden sm:block ${
            isDark ? 'text-slate-100' : 'text-slate-800'
          }`}
        >
          Tswir<span className="text-blue-500">Ti</span>
        </span>
      </NavLink>

      {/* NAVIGATION */}
      <nav className="flex items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${
                isActive
                  ? isDark
                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
              }`
            }
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden md:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* THEME TOGGLE */}
      <button
        onClick={toggle}
        title={isDark ? 'Mode clair' : 'Mode sombre'}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border
        ${
          isDark
            ? 'border-surface-border text-slate-400 hover:text-white hover:bg-white/5'
            : 'border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
        }`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-yellow-400" />
        ) : (
          <Moon className="w-4 h-4 text-blue-600" />
        )}
      </button>

      {/* PROFILE */}
      <div className="relative shrink-0">
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
          ${isDark ? 'hover:bg-white/5' : 'hover:bg-blue-50'}`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
            ${
              isDark
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {user?.nom?.[0]?.toUpperCase() || '?'}
          </div>

          <span
            className={`text-sm hidden sm:block max-w-[180px] truncate ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {user?.nom}
          </span>

          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>

        {profileOpen && (
          <div
            className={`absolute right-0 top-full mt-2 w-56 rounded-xl border overflow-hidden shadow-xl z-50
            ${
              isDark
                ? 'glass-strong border-surface-border'
                : 'bg-white border-slate-200'
            }`}
          >
            {/* USER INFO */}
            <div
              className={`px-4 py-3 border-b ${
                isDark ? 'border-surface-border' : 'border-slate-200'
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {user?.nom}
              </p>

              <p className="text-xs text-slate-500 truncate">
                {user?.email}
              </p>
            </div>

            {/* HISTORY */}
            <button
              onClick={() => {
                setProfileOpen(false);
                navigate('/app/history');
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-all
              ${
                isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-blue-50'
              }`}
            >
              <User className="w-4 h-4" />
              Mon historique
            </button>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}