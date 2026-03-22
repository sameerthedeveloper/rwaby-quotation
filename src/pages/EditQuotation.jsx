import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Calculator, AlertCircle, DollarSign, Save } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import CostTable from "@/components/cost/CostTable";
import CostSummary from "@/components/cost/CostSummary";
import ExtraCosts from "@/components/cost/ExtraCosts";
import { quotationSchema } from "@/utils/validators";
import { 
  calculateCuttingTotal, 
  calculateBendingTotal, 
  calculateGrandTotal, 
  calculateBalanceAmount 
} from "@/utils/calculations";
import { getActiveTemplateSettings, getWorkshopCostTemplate } from "@/services/firestoreService";
import { useCostCalculator } from "@/hooks/useCostCalculator";
import { useAuth } from "@/context/AuthContext";

export default function EditQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricingMode, setPricingMode] = useState('manual');
  const [activeTemplateName, setActiveTemplateName] = useState('');

  const calc = useCostCalculator();
  const { isAdmin } = useAuth();
  const isNormalUser = !isAdmin;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(quotationSchema),
  });

  // Watch fields for real-time calculation
  const numberOfCuts = useWatch({ control, name: "numberOfCuts" }) || 0;
  const ratePerCut = useWatch({ control, name: "ratePerCut" }) || 0;
  const numberOfBends = useWatch({ control, name: "numberOfBends" }) || 0;
  const ratePerBend = useWatch({ control, name: "ratePerBend" }) || 0;
  const advanceReceived = useWatch({ control, name: "advanceReceived" }) || 0;

  useEffect(() => {
    const loadActiveTemplate = async () => {
      try {
        const activeId = await getActiveTemplateSettings();
        if (activeId) {
          const templateData = await getWorkshopCostTemplate(activeId);
          if (templateData) {
            // Only load basic costs from template, don't overwrite if we are loading saved data later
            calc.loadData({ costs: templateData.costs });
            setActiveTemplateName(templateData.name || '');
          }
        }
      } catch (e) {
        console.error('Failed to load active template:', e);
      }
    };
    loadActiveTemplate();
  }, []);

  useEffect(() => {
    async function fetchQuotation() {
      try {
        const docRef = doc(db, "quotations", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Restore form fields
          reset({
            customerName: data.Customer?.customerName || "",
            phone: data.Customer?.phone || "",
            materialType: data.Material?.materialType || "",
            thickness: data.Material?.thickness || "",
            numberOfCuts: data.Cutting?.numberOfCuts || 0,
            ratePerCut: data.Cutting?.ratePerCut || 0,
            numberOfBends: data.Bending?.numberOfBends || 0,
            ratePerBend: data.Bending?.ratePerBend || 0,
            advanceReceived: data.Payments?.advanceReceived || 0,
            deliveryDate: data.Delivery?.deliveryDate || new Date().toISOString().split('T')[0]
          });

          // Restore pricing mode
          if (data.Totals?.pricingMode) {
            setPricingMode(data.Totals.pricingMode);
          }

          // Restore extra costs
          if (data.ExtraCosts) {
            calc.loadData({ extraCosts: data.ExtraCosts });
          } else if (data.ExtraCharges?.otherCharges) {
            // Migration for old data
            calc.loadData({ 
              extraCosts: [{ id: Date.now(), description: 'Other Charges', amount: data.ExtraCharges.otherCharges }] 
            });
          }

          // Restore workshop details
          if (data.WorkshopCost) {
            calc.loadData(data.WorkshopCost);
          }

        } else {
          alert("Quotation not found");
          navigate("/quotations");
        }
      } catch (error) {
        console.error("Error fetching quotation:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchQuotation();
  }, [id, reset, navigate]);

  const totalCutting = calculateCuttingTotal(numberOfCuts, ratePerCut);
  const totalBending = calculateBendingTotal(numberOfBends, ratePerBend);
  
  const manualGrandTotal = calculateGrandTotal(totalCutting, totalBending, calc.workshopResult.extraTotal);
  
  const grandTotal = pricingMode === 'workshop' 
    ? (calc.finalPrice) 
    : manualGrandTotal;
    
  const balanceAmount = calculateBalanceAmount(grandTotal, advanceReceived);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "quotations", id);
      
      const updateData = {
        "Customer.customerName": data.customerName,
        "Customer.phone": data.phone,
        "Material.materialType": data.materialType,
        "Material.thickness": data.thickness,
        "Cutting.numberOfCuts": Number(data.numberOfCuts),
        "Cutting.ratePerCut": Number(data.ratePerCut),
        "Cutting.totalCutting": totalCutting,
        "Bending.numberOfBends": Number(data.numberOfBends),
        "Bending.ratePerBend": Number(data.ratePerBend),
        "Bending.totalBending": totalBending,
        "ExtraCosts": calc.extraCosts,
        "ExtraTotal": calc.workshopResult.extraTotal,
        "Totals.grandTotal": grandTotal,
        "Totals.pricingMode": pricingMode,
        "Payments.advanceReceived": Number(data.advanceReceived),
        "Payments.balanceAmount": balanceAmount,
        "Delivery.deliveryDate": data.deliveryDate,
      };

      // Handle WorkshopCost update
      if (pricingMode === 'workshop') {
        updateData.WorkshopCost = calc.getSnapshot();
      } else {
        // Optional: clear WorkshopCost if switched back to manual? 
        // Better to keep it for history or maybe clear it to save space.
        // For now let's keep it or clear it. Let's clear it to avoid confusion.
        // updateData.WorkshopCost = null; 
        // Wait, Firestore updateDoc uses dots for nested fields. 
        // If I want to update the whole object I just use the key.
      }

      await updateDoc(docRef, updateData);
      
      alert("Quotation updated successfully!");
      navigate('/quotations');
    } catch (error) {
      console.error("Error updating quotation:", error);
      alert("Failed to update quotation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading quotation data...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4 shadow-sm bg-slate-50/20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Quotation</h1>
          <p className="text-slate-500 text-sm mt-1">Update the details below for this quotation.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/quotations')}>Cancel</Button>
          <div className="flex flex-col items-end border-l pl-4 ml-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ref ID</span>
            <span className="text-xs font-mono font-bold text-slate-600">{id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

          {/* Main Form Fields */}
          <div className="md:col-span-2 space-y-6">

            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    {...register("customerName")}
                  />
                  {errors.customerName && <p className="text-red-500 text-sm">{errors.customerName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. 71234567"
                    {...register("phone")}
                  />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Pricing Mode Toggle */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Pricing Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPricingMode('manual')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${pricingMode === 'manual'
                        ? 'bg-white text-primary shadow-md'
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Manual Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('workshop')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${pricingMode === 'workshop'
                        ? 'bg-white text-primary shadow-md'
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Workshop Mode
                  </button>
                </div>

                {pricingMode === 'workshop' && (
                  <div className="space-y-4 pt-4">
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Material Details</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="materialType">Material Type:</Label>
                              <Select
                                id="materialType"
                                {...register("materialType")}
                              >
                                <option value="">Select Material Type</option>
                                <option value="SS">SS </option>
                                <option value="MS">MS</option>
                              </Select>
                              {errors.materialType && <p className="text-red-500 text-sm">{errors.materialType.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="thickness">Thickness</Label>
                              <Select
                                id="thickness"
                                {...register("thickness")}
                              >
                                <option value="">Select Thickness</option>
                                <option value="0.8">0.8 mm</option>
                                <option value="1.0">1.0 mm</option>
                                <option value="1.2">1.2 mm</option>
                                <option value="1.5">1.5 mm</option>
                                <option value="2.0">2.0 mm</option>
                              </Select>
                              {errors.thickness && <p className="text-red-500 text-sm">{errors.thickness.message}</p>}
                            </div>
                          </CardContent>
                        </Card>
                        <div className="bg-slate-50 border rounded-lg p-3 flex justify-between items-center mb-4">
                          <span className="text-sm font-medium text-slate-700">Workshop Template:</span>
                          <span className="text-sm font-bold text-primary px-2 py-1 bg-blue-100 rounded-md">{activeTemplateName || 'Saved Data'}</span>
                        </div>

                        {isNormalUser && (
                          <p className="text-[11px] text-slate-500 italic pb-2">
                            Base costs are locked by the administrator. Only input the <strong>Hours Used</strong>.
                          </p>
                        )}

                        <CostTable
                          hourlyRows={calc.hourlyRows}
                          fixedRows={calc.fixedRows}
                          onCostChange={calc.updateCost}
                          onHoursChange={calc.updateHours}
                          onFixedChange={calc.updateFixed}
                          workshopTotal={calc.workshopTotal}
                          readOnlyAmount={isNormalUser}
                          hidePrices={isNormalUser}
                        />

                        <CostSummary
                          workshopTotal={calc.workshopTotal}
                          margin={calc.margin}
                          finalPrice={calc.finalPrice}
                          profit={calc.profit}
                          onMarginChange={calc.setMargin}
                          readOnly={false}
                          hidePrices={isNormalUser}
                        />
                      </>
                  </div>
                )}
              </CardContent>
            </Card>

            <ExtraCosts
              extraCosts={calc.extraCosts}
              onAdd={calc.addExtraCost}
              onRemove={calc.removeExtraCost}
              onUpdate={calc.updateExtraCost}
              hidePrices={isNormalUser}
            />

            {pricingMode === 'manual' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Material Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="materialType">Material Type (e.g., SS, MS)</Label>
                      <Select
                        id="materialType"
                        {...register("materialType")}
                      >
                        <option value="">Select Material Type</option>
                        <option value="SS">SS </option>
                        <option value="MS">MS</option>
                      </Select>
                      {errors.materialType && <p className="text-red-500 text-sm">{errors.materialType.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thickness">Thickness</Label>
                      <Input
                        id="thickness"
                        placeholder="e.g., 2mm"
                        {...register("thickness")}
                      />
                      {errors.thickness && <p className="text-red-500 text-sm">{errors.thickness.message}</p>}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cutting & Bending Work</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Cutting */}
                    <div>
                      <h4 className="font-medium text-sm mb-3">Cutting</h4>
                      <div className="grid gap-4 md:grid-cols-3 items-end">
                        <div className="space-y-2">
                          <Label htmlFor="numberOfCuts">Number of Cuts</Label>
                          <Input
                            id="numberOfCuts"
                            type="number"
                            min="0"
                            {...register("numberOfCuts")}
                          />
                          {errors.numberOfCuts && <p className="text-red-500 text-sm">{errors.numberOfCuts.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ratePerCut">Rate per Cut (OMR)</Label>
                          <Input
                            id="ratePerCut"
                            type="number"
                            min="0"
                            {...register("ratePerCut")}
                          />
                          {errors.ratePerCut && <p className="text-red-500 text-sm">{errors.ratePerCut.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Total Cutting</Label>
                          <div className="h-9 px-3 py-1 flex items-center border rounded-md bg-slate-50 text-slate-700 font-medium font-mono text-sm uppercase">
                            OMR {(totalCutting || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Bending */}
                    <div>
                      <h4 className="font-medium text-sm mb-3">Bending</h4>
                      <div className="grid gap-4 md:grid-cols-3 items-end">
                        <div className="space-y-2">
                          <Label htmlFor="numberOfBends">Number of Bends</Label>
                          <Input
                            id="numberOfBends"
                            type="number"
                            min="0"
                            {...register("numberOfBends")}
                          />
                          {errors.numberOfBends && <p className="text-red-500 text-sm">{errors.numberOfBends.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ratePerBend">Rate per Bend (OMR)</Label>
                          <Input
                            id="ratePerBend"
                            type="number"
                            min="0"
                            {...register("ratePerBend")}
                          />
                          {errors.ratePerBend && <p className="text-red-500 text-sm">{errors.ratePerBend.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Total Bending</Label>
                          <div className="h-9 px-3 py-1 flex items-center border rounded-md bg-slate-50 text-slate-700 font-medium font-mono text-sm uppercase">
                            OMR {(totalBending || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Extra Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Target Delivery Date</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    {...register("deliveryDate")}
                  />
                  {errors.deliveryDate && <p className="text-red-500 text-sm">{errors.deliveryDate.message}</p>}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sticky Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <Card className="border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden backdrop-blur-sm bg-white/90">
                <CardHeader className="bg-slate-900 border-b border-slate-800 px-6 py-5">
                  <CardTitle className="text-white flex items-center gap-2 text-lg tracking-tight">
                    <Calculator className="w-5 h-5 text-primary-foreground/70" />
                    Quotation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 space-y-5">
                    <div className="space-y-3">
                      {pricingMode === 'workshop' && (
                        <>
                          <div className="flex justify-between text-sm items-center group">
                            <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Workshop Production:</span>
                            <span className="font-mono font-medium text-slate-900">OMR {(calc.workshopTotal || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm items-center group">
                            <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Profit Margin ({calc.margin}%):</span>
                            <span className="font-mono font-medium text-emerald-600">+ OMR {(calc.profit || 0).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      
                      {(totalCutting > 0 || totalBending > 0) && pricingMode === 'manual' && (
                        <div className="space-y-3 pb-3 border-b border-slate-100">
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-slate-500">Operation Totals:</span>
                            <span className="font-mono font-medium text-slate-900">OMR {(totalCutting + totalBending).toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between text-sm items-center group pt-1">
                        <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Other Costs Total:</span>
                        <span className="font-mono font-medium text-slate-900">OMR {(calc.workshopResult.extraTotal || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-lg shadow-slate-900/20">
                      <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Total Quotation Value</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-white tracking-tighter">
                            {(grandTotal || 0).toFixed(2)}
                          </span>
                          <span className="text-sm font-bold text-primary tracking-wide">OMR</span>
                        </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <Calculator size={100} className="text-white rotate-12" />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="advanceReceived" className="text-xs font-bold uppercase text-slate-400">Advance Payment</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">OMR</span>
                          <Input
                            id="advanceReceived"
                            type="number"
                            min="0"
                            className="pl-12 border-slate-200 focus:ring-primary/20 font-mono"
                            {...register("advanceReceived")}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-primary/70">Balance Due</span>
                          <span className="text-xl font-bold text-primary font-mono tracking-tight">OMR {balanceAmount.toFixed(2)}</span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full py-7 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex gap-3 uppercase tracking-wider"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin text-xl">⏳</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-6 h-6" />
                          Update Quotation
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
