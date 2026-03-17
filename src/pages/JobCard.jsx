import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, Trash2, Edit } from 'lucide-react';
import { getJobCards, updateJobCardStatus, deleteJobCard } from '@/services/firestoreService';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function JobCard() {
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobCards();
  }, []);

  const fetchJobCards = async () => {
    try {
      const data = await getJobCards();
      setJobCards(data);
    } catch (error) {
      console.error("Failed to fetch job cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (jobCard) => {
    if (!window.confirm(`Mark job card for ${jobCard.Customer.customerName} as completed?`)) return;

    try {
      const signatures = {
        managerSignature: "Manager Approved", // In a real app, this might be an actual digital signature or logged-in user name
        workerSignature: "Completed by Staff",
        completedAt: new Date().toISOString()
      };
      // Pass the reference quotationId to ensure it syncs up to "completed" in Quotations list
      await updateJobCardStatus(jobCard.id, "completed", signatures, jobCard.Reference?.quotationId);
      alert("Job marked as completed!");
      fetchJobCards();
    } catch (error) {
      console.error("Failed to update job card:", error);
      alert("Failed to update status.");
    }
  };

  const handleDeleteJobCard = async (jobCard) => {
    if (!window.confirm(`Are you sure you want to delete the job card for ${jobCard.Customer.customerName}?`)) return;

    try {
      await deleteJobCard(jobCard.id);
      alert("Job card deleted successfully!");
      fetchJobCards();
    } catch (error) {
      console.error("Failed to delete job card:", error);
      alert("Failed to delete job card.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-slate-900">Job Cards</h1>
      </div>

      <div className="w-full">
        {loading ? (
        <div className="text-center py-12 text-slate-500">Loading job cards...</div>
      ) : jobCards.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No job cards found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {jobCards.map((job) => (
            <div 
              key={job.id} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md"
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                    {job.Customer.customerName}
                  </h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    job.Status?.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {(job.Status?.status || 'Unknown').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-slate-500 font-mono">
                  <span className="truncate">{job.id.slice(0, 8)}...</span>
                  <span className="mx-2">•</span>
                  <span>{job.Customer.phone}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Material</p>
                    <p className="font-medium text-sm sm:text-base text-slate-900">
                      {job.Material?.materialType}
                    </p>
                    <p className="text-xs text-slate-400">{job.Material?.thickness}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Target Delivery</p>
                    <p className="font-medium text-sm sm:text-base text-slate-900">
                      {job.Delivery?.deliveryDate ? format(new Date(job.Delivery.deliveryDate), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 sm:p-4 rounded-lg space-y-3 border border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cuts Required:</span>
                    <span className="font-medium text-slate-900">{job.CuttingDetails?.cuts || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Bends Required:</span>
                    <span className="font-medium text-slate-900">{job.BendingDetails?.bends || 0}</span>
                  </div>
                </div>

                 <div className="flex justify-between items-center pt-2">
                   <div>
                     <p className="text-xs text-slate-500">Advance Paid</p>
                     <p className="font-medium text-green-600 text-sm sm:text-base">OMR {job.Payments?.advanceReceived || 0}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-slate-500">Balance Due</p>
                     <p className="font-bold text-red-600 text-sm sm:text-base">OMR {job.Payments?.balanceAmount || 0}</p>
                   </div>
                 </div>
              </div>

              {/* Actions */}
              <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 mt-auto flex items-center gap-2">
                {job.Status?.status === 'in_progress' ? (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm" 
                    onClick={() => handleMarkCompleted(job)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                ) : (
                  <div className="flex-1 text-center text-xs sm:text-sm text-slate-500 py-2 flex items-center justify-center gap-1.5 bg-white rounded-md border border-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Done {job.Completion?.completedAt ? format(new Date(job.Completion.completedAt), 'MMM dd') : ''}</span>
                  </div>
                )}
                
                <div className="flex gap-1 ml-auto">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="text-slate-500 hover:text-primary hover:bg-slate-100 bg-white"
                    title="Edit Job Card"
                    onClick={() => navigate(`/job-cards/${job.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 bg-white"
                    title="Delete Job Card"
                    onClick={() => handleDeleteJobCard(job)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
