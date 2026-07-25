import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Rocket, Layers, Users, LogOut, Search, 
  Sparkles, ShieldCheck
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen flex bg-[#090d16] text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950/80 border-r border-slate-800/80 backdrop-blur-xl flex flex-col fixed inset-y-0 left-0 z-40">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              TechLead Hub
            </h1>
            <span className="text-[11px] text-indigo-400/90 font-semibold tracking-wider uppercase block -mt-0.5">
              Engineering Workspace
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Workspace
          </div>

          <NavLink
            to="/features"
            className={({ isActive }) => `
              flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
              ${isActive || location.pathname.startsWith('/features') 
                ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm font-semibold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}
            `}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Features</span>
          </NavLink>

          <NavLink
            to="/people"
            className={({ isActive }) => `
              flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
              ${isActive || location.pathname.startsWith('/people') 
                ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm font-semibold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}
            `}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Team Directory</span>
          </NavLink>
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-inner"
              style={{ backgroundColor: user?.avatar_color || '#6366f1' }}
            >
              {user ? getInitials(user.name) : 'TL'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                {user?.name}
                <ShieldCheck className="w-3 h-3 text-indigo-400 inline" />
              </div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-medium text-slate-300">Tech Lead Control Room</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Active
            </div>
          </div>
        </header>

        {/* Dynamic Page Output */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
