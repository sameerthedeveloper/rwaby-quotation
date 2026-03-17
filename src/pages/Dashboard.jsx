import { useState, useEffect } from 'react';
import { 
  FileText, 
  ClipboardList, 
  CheckCircle2, 
  TrendingUp,
  Clock,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getQuotations, getJobCards } from '@/services/firestoreService';
import { format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalQuotations: 0,
    pendingJobs: 0,
    completedJobs: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [quotations, jobCards] = await Promise.all([
          getQuotations(),
          getJobCards()
        ]);

        const pending = jobCards.filter(j => j.Status?.status !== 'completed').length;
        const completed = jobCards.filter(j => j.Status?.status === 'completed').length;
        
        // Combine recent activity manually (first 5 of each, sorted by date)
        const allActivity = [
          ...quotations.map(q => ({
            id: q.id,
            type: 'quotation',
            title: `Quotation for ${q.Customer?.customerName}`,
            status: q.Status?.status,
            date: q.Metadata?.createdAt?.seconds ? new Date(q.Metadata.createdAt.seconds * 1000) : new Date()
          })),
          ...jobCards.map(j => ({
            id: j.id,
            type: 'job',
            title: `Job Card for ${j.Customer?.customerName}`,
            status: j.Status?.status,
            date: j.createdAt?.seconds ? new Date(j.createdAt.seconds * 1000) : new Date()
          }))
        ];

        // Sort descending by date, take top 8
        const recent = allActivity.sort((a, b) => b.date - a.date).slice(0, 8);

        setStats({
          totalQuotations: quotations.length,
          pendingJobs: pending,
          completedJobs: completed,
          recentActivity: recent
        });

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500">Welcome back to Crystal Workshop System</p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Quotations</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? "-" : stats.totalQuotations}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Jobs</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? "-" : stats.pendingJobs}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Completed Jobs</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? "-" : stats.completedJobs}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
            <h3 className="text-2xl font-bold text-slate-900">
               {loading || stats.totalQuotations === 0 
                  ? "-" : 
                  Math.round(((stats.pendingJobs + stats.completedJobs) / stats.totalQuotations) * 100)
                }%
            </h3>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white shadow-sm border border-slate-100 rounded-xl">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="p-6 text-center text-slate-500">Loading activity...</div>
            ) : stats.recentActivity.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No recent activity.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.recentActivity.map((activity, i) => (
                  <li key={`${activity.id}-${i}`} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-4 ${
                          activity.type === 'job' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {activity.type === 'job' ? <ClipboardList size={18} /> : <FileText size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                          <p className="text-xs text-slate-500">
                            {format(activity.date, 'MMM dd, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/quotations/new" className="block w-full p-3 bg-slate-50 border border-transparent hover:border-primary/30 rounded-lg transition-colors group">
              <div className="flex items-center text-primary font-medium">
                <FileText className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Create Quotation
              </div>
            </Link>
            <Link to="/quotations" className="block w-full p-3 bg-slate-50 border border-transparent hover:border-primary/30 rounded-lg transition-colors group">
              <div className="flex items-center text-slate-700 font-medium group-hover:text-primary transition-colors">
                <Search className="mr-2 h-5 w-5" />
                Search Quotations
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
