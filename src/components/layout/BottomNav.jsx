import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusSquare, ClipboardList, Calculator, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Quotations', path: '/quotations', icon: FileText },
  { name: 'New', path: '/quotations/new', icon: PlusSquare },
  { name: 'Job Cards', path: '/job-cards', icon: ClipboardList },
  { name: 'Costing', path: '/workshop-cost', icon: Calculator },
  { name: 'Admin', path: '/admin/settings', icon: Settings },
];

export default function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.05)] z-50 pb-safe">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
                  <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
