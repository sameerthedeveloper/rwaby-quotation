import { Bell, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm z-10 sticky top-0 md:relative pt-safe">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Mobile Header Title (Hidden on desktop as sidebar handles it) */}
        <div className="md:hidden flex items-center gap-2 text-primary font-bold text-lg tracking-wider">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-sm text-white font-bold text-lg">
            C
          </div>
          CRYSTAL
        </div>
        
        {/* Desktop Header Title placeholder if needed */}
        <div className="hidden md:block">
          <h2 className="text-xl font-semibold text-slate-800">Workshop App</h2>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button className="text-slate-400 hover:text-primary transition-colors p-2 bg-slate-50 hover:bg-blue-50 rounded-full">
            <Bell size={20} />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 shadow-sm flex items-center justify-center text-white ring-2 ring-white cursor-pointer hover:scale-105 transition-transform">
              <User size={16} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
