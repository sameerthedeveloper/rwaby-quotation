import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, ArrowRight, Trash2, Edit, Download } from 'lucide-react';

import { getQuotations, createJobCard, deleteQuotation } from '@/services/firestoreService';
import { generateQuotationPDF } from '@/utils/pdfGenerator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { format } from 'date-fns';

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const data = await getQuotations();
      setQuotations(data);
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToJobCard = async (quotation) => {
    if (!window.confirm(`Convert quotation for ${quotation.Customer.customerName} to a Job Card?`)) return;

    try {
      const jobCardData = {
        Reference: {
          quotationId: quotation.id
        },
        Customer: quotation.Customer,
        Job: {
          jobDate: new Date().toISOString()
        },
        Material: quotation.Material,
        CuttingDetails: {
          cuts: quotation.Cutting.numberOfCuts,
          rate: quotation.Cutting.ratePerCut,
          total: quotation.Cutting.totalCutting
        },
        BendingDetails: {
          bends: quotation.Bending.numberOfBends,
          rate: quotation.Bending.ratePerBend,
          total: quotation.Bending.totalBending
        },
        Finishing: {
          cladding: "",
          finishing: ""
        },
        Delivery: quotation.Delivery,
        Payments: quotation.Payments,
        Status: {
          status: "in_progress"
        }
      };

      await createJobCard(jobCardData);
      alert("Successfully converted to Job Card!");
      fetchQuotations(); // Refresh list to update status
      // navigate('/job-cards');
    } catch (error) {
      console.error("Failed to convert to job card:", error);
      alert("Failed to create Job Card.");
    }
  };

  const handleDeleteQuotation = async (id, customerName) => {
    if (!window.confirm(`Are you sure you want to delete the quotation for ${customerName}? This action cannot be undone.`)) return;
    
    try {
      await deleteQuotation(id);
      alert("Quotation deleted successfully!");
      fetchQuotations(); // Refresh list
    } catch (error) {
      console.error("Failed to delete quotation:", error);
      alert("Failed to delete quotation.");
    }
  };

  const filteredQuotations = quotations.filter(q => 
    q.Customer?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.Customer?.phone?.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Quotations
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage and view all customer quotations</p>
        </div>
        
        <Link to="/quotations/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by customer name or phone..." 
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          {/* Add filters here if needed */}
        </div>
      </div>

      {/* Quotations List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading quotations...</div>
        ) : filteredQuotations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No quotations found.</div>
        ) : (
          <>
            {/* Unified Responsive Table View */}
            <div className="table-container no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px] md:min-w-0">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <th className="px-4 md:px-6 py-4 font-medium text-sm">Quotation ID</th>
                    <th className="px-4 md:px-6 py-4 font-medium text-sm">Customer</th>
                    <th className="px-4 md:px-6 py-4 font-medium text-sm">Material</th>
                    <th className="px-4 md:px-6 py-4 font-medium text-sm">Amount</th>
                    <th className="px-4 md:px-6 py-4 font-medium text-sm">Date</th>
                    <th className="px-4 md:px-6 py-4 font-medium text-sm">Status</th>
                    <th className="px-4 md:px-6 py-4 font-medium text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 uppercase">
                  {filteredQuotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 md:px-6 py-4 text-xs font-mono text-slate-400">
                        {quotation.id.slice(0, 8)}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm md:text-base">
                          {quotation.Customer?.customerName || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium tracking-tight">
                          {quotation.Customer?.phone}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-xs md:text-sm font-medium">
                          {quotation.Material?.materialType} <span className="text-slate-400 font-normal">({quotation.Material?.thickness})</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="font-bold text-primary text-sm">OMR {quotation.Totals?.grandTotal}</div>
                        <div className="text-slate-400 text-[10px] font-medium">BAL: OMR {quotation.Payments?.balanceAmount}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {quotation.createdAt ? format(quotation.createdAt.toDate ? quotation.createdAt.toDate() : new Date(quotation.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                          quotation.Status?.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          quotation.Status?.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {(quotation.Status?.status || 'Unknown').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 md:gap-2">
                          {quotation.Status?.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 w-8 p-0 md:w-auto md:px-3 text-primary border-primary/20 hover:bg-primary/5"
                              onClick={() => handleConvertToJobCard(quotation)}
                              title="Convert to Job Card"
                            >
                              <ArrowRight className="h-4 w-4" />
                              <span className="hidden md:inline ml-1">Job</span>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Download PDF"
                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => generateQuotationPDF(quotation)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            title="Edit Quotation"
                            onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete Quotation"
                            onClick={() => handleDeleteQuotation(quotation.id, quotation.Customer?.customerName)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
