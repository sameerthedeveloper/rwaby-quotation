import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import NewQuotation from '@/pages/NewQuotation';
import EditQuotation from '@/pages/EditQuotation';
import Quotations from '@/pages/Quotations';
import JobCard from '@/pages/JobCard';
import EditJobCard from '@/pages/EditJobCard';
import WorkshopCostCalculator from '@/pages/WorkshopCostCalculator';
import AdminSettings from '@/pages/AdminSettings';

import { AuthProvider } from '@/context/AuthContext';
import PrivateRoute from '@/components/layout/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="quotations" element={<Quotations />} />
              <Route path="quotations/new" element={<NewQuotation />} />
              <Route path="quotations/:id/edit" element={<EditQuotation />} />
              <Route path="job-cards" element={<JobCard />} />
              <Route path="job-cards/:id/edit" element={<EditJobCard />} />
              <Route path="workshop-cost" element={<WorkshopCostCalculator />} />
              
              {/* Admin Only Routes */}
              <Route element={<PrivateRoute adminOnly={true} />}>
                <Route path="admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
