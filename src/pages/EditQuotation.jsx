import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Calculator, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import CostTable from "@/components/cost/CostTable";
import CostSummary from "@/components/cost/CostSummary";
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
  const [noActiveTemplate, setNoActiveTemplate] = useState(false);
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
  const otherCharges = useWatch({ control, name: "otherCharges" }) || 0;
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
            otherCharges: data.ExtraCharges?.otherCharges || 0,
            advanceReceived: data.Payments?.advanceReceived || 0,
            deliveryDate: data.Delivery?.deliveryDate || new Date().toISOString().split('T')[0]
          });

          // Restore pricing mode
          if (data.Totals?.pricingMode) {
            setPricingMode(data.Totals.pricingMode);
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
  const manualGrandTotal = calculateGrandTotal(totalCutting, totalBending, otherCharges);
  
  const grandTotal = pricingMode === 'workshop' 
    ? (calc.finalPrice + (Number(otherCharges) || 0)) 
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
        "ExtraCharges.otherCharges": Number(data.otherCharges),
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
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Quotation</h1>
        <Button variant="outline" onClick={() => navigate('/quotations')}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          <div className="md:col-span-2 space-y-6">
            
            {/* Customer Details */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Customer Information</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input {...register("customerName")} />
                  {errors.customerName && <p className="text-red-500 text-sm">{errors.customerName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input {...register("phone")} />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Material Details */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Material Details</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Material Type</Label>
                  <Input {...register("materialType")} />
                </div>
                <div className="space-y-2">
                  <Label>Thickness</Label>
                  <Input {...register("thickness")} />
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPricingMode('manual')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      pricingMode === 'manual' 
                        ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <span className="font-bold">Manual Pricing</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">Cut & Bend Rates</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('workshop')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      pricingMode === 'workshop' 
                        ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <span className="font-bold">Workshop Cost</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">Production Based</span>
                  </button>
                </div>

                {pricingMode === 'workshop' && (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-slate-900">Workshop Production Details</h4>
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase">
                        Template: {activeTemplateName || 'Loading...'}
                      </span>
                    </div>
                    
                      <div className="space-y-3">
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
                          readOnly={isNormalUser}
                          hidePrices={isNormalUser}
                        />
                      </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {pricingMode === 'manual' && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Cutting & Bending Work</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm mb-3">Cutting</h4>
                    <div className="grid gap-4 md:grid-cols-3 items-end">
                      <div className="space-y-2">
                        <Label>Number of Cuts</Label>
                        <Input type="number" min="0" {...register("numberOfCuts")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Rate per Cut (OMR)</Label>
                        <Input type="number" min="0" {...register("ratePerCut")} />
                      </div>
                      <div className="space-y-2 text-right">
                        <Label className="text-right block">Total Cutting</Label>
                        <div className="h-9 px-3 py-1 flex items-center justify-end border rounded-md bg-slate-50 text-slate-700 font-mono font-bold">OMR {totalCutting.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  <hr className="border-slate-200" />
                  <div>
                    <h4 className="font-medium text-sm mb-3">Bending</h4>
                    <div className="grid gap-4 md:grid-cols-3 items-end">
                      <div className="space-y-2">
                        <Label>Number of Bends</Label>
                        <Input type="number" min="0" {...register("numberOfBends")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Rate per Bend (OMR)</Label>
                        <Input type="number" min="0" {...register("ratePerBend")} />
                      </div>
                      <div className="space-y-2 text-right">
                        <Label className="text-right block">Total Bending</Label>
                        <div className="h-9 px-3 py-1 flex items-center justify-end border rounded-md bg-slate-50 text-slate-700 font-mono font-bold">OMR {totalBending.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-lg">Additional Details</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                  <Label>Other Charges (OMR)</Label>
                  <Input type="number" min="0" {...register("otherCharges")} />
                </div>
                <div className="space-y-2">
                  <Label>Target Delivery Date</Label>
                  <Input type="date" {...register("deliveryDate")} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-6 space-y-6">
              <Card className="border-primary/20 shadow-md">
                <CardHeader className="bg-primary/5 border-b pb-4"><CardTitle className="text-lg">Quotation Summary</CardTitle></CardHeader>
                <CardContent className="pt-6 space-y-4">
                  
                  {pricingMode === 'manual' ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total Cutting:</span>
                        <span className="font-medium">OMR {totalCutting.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total Bending:</span>
                        <span className="font-medium">OMR {totalBending.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Workshop Cost:</span>
                        <span className="font-medium">OMR {calc.workshopTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-700">
                        <span className="text-slate-500">Profit ({calc.margin}%):</span>
                        <span className="font-medium">OMR {calc.profit.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Other Charges:</span>
                    <span className="font-medium">OMR {Number(otherCharges).toFixed(2)}</span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between text-base font-bold text-slate-900">
                    <span>Grand Total:</span><span className="text-primary font-mono">OMR {grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label>Advance Received (OMR)</Label>
                    <Input type="number" min="0" className="border-green-300" {...register("advanceReceived")} />
                  </div>
                  <div className="flex justify-between text-base font-bold bg-red-50 p-3 rounded-md text-red-700 mt-2">
                    <span>Balance Due:</span><span className="font-mono">OMR {balanceAmount.toFixed(2)}</span>
                  </div>
                  <Button type="submit" className="w-full mt-6 flex justify-center py-2.5" disabled={isSubmitting}>
                    {isSubmitting ? "Saving Updates..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
