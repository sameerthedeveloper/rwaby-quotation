import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-slate-50 pb-safe">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden max-h-screen relative">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
