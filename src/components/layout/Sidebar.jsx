import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusSquare, ClipboardList, Calculator, LogOut, Settings } from 'lucide-react';

import { useAuth } from '@/hooks';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Cost Calculator', path: '/workshop-cost', icon: Calculator },
  { name: 'Quotations', path: '/quotations', icon: FileText },
  { name: 'New Quotation', path: '/quotations/new', icon: PlusSquare },
  { name: 'Job Cards', path: '/job-cards', icon: ClipboardList },
  { name: 'Admin Settings', path: '/admin/settings', icon: Settings }
];

export default function Sidebar() {
  const { logout, isAdmin } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    if (item.path === '/admin/settings') return isAdmin;
    return true;
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };
  return (
    <aside className="w-64 bg-slate-50/50 backdrop-blur-xl border-r border-slate-200 text-slate-600 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-200/60 bg-white/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-sm text-white font-bold text-lg">
            R
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-slate-800 font-bold text-xs leading-tight tracking-wide">RWABY ALWLJH ALMTHDH</h1>
            <span className="text-[9px] font-bold text-slate-500 tracking-wider">LIMITED PARTNERSHIP</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1.5">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end
              className="block group"
            >
              {({ isActive }) => (
                <div
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary/10 to-blue-50/80 text-primary shadow-sm shadow-primary/5 ring-1 ring-primary/20'
                      : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                  <item.icon 
                    className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                      isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary/70'
                    }`} 
                    aria-hidden="true" 
                  />
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-200/60 bg-white/40">
        <button 
          onClick={handleLogout}
          className="group flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
        >
          <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-red-400 group-hover:text-red-600 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
