import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, AlertCircle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

import { quotationSchema } from "@/utils/validators";
import {
  calculateCuttingTotal,
  calculateBendingTotal,
  calculateGrandTotal,
  calculateBalanceAmount
} from "@/utils/calculations";

import { createQuotation, createCustomer, getActiveTemplateSettings, getWorkshopCostTemplate } from "@/services/firestoreService";
import { useCostCalculator } from "@/hooks/useCostCalculator";
import { useAuth } from "@/context/AuthContext";

export default function NewQuotation() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricingMode, setPricingMode] = useState('manual');
  const [activeTemplateName, setActiveTemplateName] = useState('');
  const [noActiveTemplate, setNoActiveTemplate] = useState(false);
  const calc = useCostCalculator();
  const { currentUser } = useAuth();
  
  // Assume basic admin check via email for now, or check claims if available
  const isAdmin = currentUser?.email === 'admin@admin.com' || currentUser?.email === 'admin@rwaby.com';
  const isNormalUser = !isAdmin;

  useEffect(() => {
    const loadActiveTemplate = async () => {
      try {
        const activeId = await getActiveTemplateSettings();
        if (!activeId) {
          setNoActiveTemplate(true);
          return;
        }
        
        const templateData = await getWorkshopCostTemplate(activeId);
        if (templateData) {
          calc.loadData(templateData);
          setActiveTemplateName(templateData.name || '');
        } else {
          setNoActiveTemplate(true);
        }
      } catch (e) {
        console.error('Failed to load active template:', e);
        setNoActiveTemplate(true);
      }
    };
    loadActiveTemplate();
  }, []);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      materialType: "",
      thickness: "",
      numberOfCuts: 0,
      ratePerCut: 0,
      numberOfBends: 0,
      ratePerBend: 0,
      otherCharges: 0,
      advanceReceived: 0,
      // Default to today for delivery date
      deliveryDate: new Date().toISOString().split('T')[0] 
    }
  });

  // Watch fields for real-time calculation
  const numberOfCuts = useWatch({ control, name: "numberOfCuts" });
  const ratePerCut = useWatch({ control, name: "ratePerCut" });
  const numberOfBends = useWatch({ control, name: "numberOfBends" });
  const ratePerBend = useWatch({ control, name: "ratePerBend" });
  const otherCharges = useWatch({ control, name: "otherCharges" });
  const advanceReceived = useWatch({ control, name: "advanceReceived" });

  // Calculated values
  const totalCutting = calculateCuttingTotal(numberOfCuts, ratePerCut);
  const totalBending = calculateBendingTotal(numberOfBends, ratePerBend);
  const manualGrandTotal = calculateGrandTotal(totalCutting, totalBending, otherCharges);
  const grandTotal = pricingMode === 'workshop' ? (calc.finalPrice + (Number(otherCharges) || 0)) : manualGrandTotal;
  const balanceAmount = calculateBalanceAmount(grandTotal, advanceReceived);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const quotationData = {
        Customer: {
          customerName: data.customerName,
          phone: data.phone,
        },
        Material: {
          materialType: data.materialType,
          thickness: data.thickness,
        },
        Cutting: {
          numberOfCuts: data.numberOfCuts,
          ratePerCut: data.ratePerCut,
          totalCutting
        },
        Bending: {
          numberOfBends: data.numberOfBends,
          ratePerBend: data.ratePerBend,
          totalBending
        },
        ExtraCharges: {
          otherCharges: data.otherCharges
        },
        Totals: {
          grandTotal,
          pricingMode,
        },
        // Workshop cost breakdown (only for workshop mode)
        ...(pricingMode === 'workshop' && {
          WorkshopCost: {
            workshopTotal: calc.workshopTotal,
            margin: calc.margin,
            finalPrice: calc.finalPrice,
            profit: calc.profit,
            costBreakdown: calc.itemTotals,
          }
        }),
        Payments: {
          advanceReceived: data.advanceReceived,
          balanceAmount
        },
        Delivery: {
          deliveryDate: data.deliveryDate
        },
        Status: {
          status: "pending"
        },
        Metadata: {
          createdAt: new Date().toISOString()
        }
      };

      const docId = await createQuotation(quotationData);
      console.log("Created quotation with ID:", docId);
      // Create Customer document (Optional caching here)
      try {
        await createCustomer({ name: data.customerName, phone: data.phone });
      } catch (e) {
        console.warn("Could not save customer (maybe exists):", e);
      }
      
      alert("Quotation generated successfully!");
      navigate('/quotations');

    } catch (error) {
      console.error("Error creating quotation:", error);
      alert("Failed to generate quotation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Quotation</h1>
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
                    placeholder="e.g. 9876543210" 
                    {...register("phone")} 
                  />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Material Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Material Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="materialType">Material Type (e.g., SS, MS)</Label>
                  <Input 
                    id="materialType" 
                    placeholder="SS 304" 
                    {...register("materialType")} 
                  />
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
                    className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border transition-all ${
                      pricingMode === 'manual'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Manual Pricing
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('workshop')}
                    className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border transition-all ${
                      pricingMode === 'workshop'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Workshop Cost
                  </button>
                </div>

                {pricingMode === 'workshop' && (
                  <div className="space-y-4 pt-4">
                    
                    {noActiveTemplate ? (
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm">
                        <AlertCircle className="h-4 w-4 inline mr-2 text-amber-500" />
                        No active workshop template configured. Contact an administrator.
                      </div>
                    ) : (
                      <>
                        <div className="bg-slate-50 border rounded-lg p-3 flex justify-between items-center mb-4">
                           <span className="text-sm font-medium text-slate-700">Active Template:</span>
                           <span className="text-sm font-bold text-primary px-2 py-1 bg-blue-100 rounded-md">{activeTemplateName}</span>
                        </div>

                        {!isNormalUser && (
                          <p className="text-[11px] text-slate-500 italic pb-2">
                            Base costs are locked by the administrator. Only input the <strong>Hours Used</strong>.
                          </p>
                        )}

                        {/* Hourly cost items - Read Only Base Costs */}
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {calc.hourlyRows.map(row => (
                            <div key={row.key} className="flex items-center gap-2 bg-slate-50 rounded-md p-2">
                              <span className="text-xs font-medium text-slate-700 min-w-[90px] truncate">{row.label}</span>
                              {!isNormalUser && (
                                <div className="h-8 min-w-[5rem] px-2 flex items-center border rounded-md bg-white border-slate-200 text-slate-500 text-xs">
                                  {(row.amount || 0).toFixed(2)}
                                </div>
                              )}
                              <Input type="number" min="0" className="h-8 text-xs w-16 px-2 text-center" placeholder="Hrs" value={row.hoursUsed || ''} onChange={e => calc.updateHours(row.hoursField, e.target.value)} />
                              <span className="text-xs font-mono text-primary font-semibold min-w-[50px] text-right ml-auto">{row.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                    {/* Fixed operations */}
                    <h5 className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider pt-1">Fixed Operations</h5>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {calc.fixedRows.map(row => (
                        <div key={row.key} className="flex items-center gap-2 bg-slate-50 rounded-md p-2">
                          <span className="text-xs font-medium text-slate-700 flex-1 truncate">{row.label}</span>
                          {!isNormalUser && (
                            <span className="text-slate-400 text-[10px] uppercase font-semibold pr-2">Fixed</span>
                          )}
                          <span className="text-xs font-mono text-primary font-semibold min-w-[50px] text-right ml-auto">
                             {(row.amount || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-slate-100 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Workshop Total:</span>
                        <span className="font-mono font-medium">{calc.workshopTotal.toFixed(2)} OMR</span>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Margin (%)</Label>
                        <div className="h-8 min-w-[4rem] px-2 flex items-center border rounded-md bg-white border-slate-200 text-slate-500 font-mono text-xs">
                          {calc.margin || 0}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-green-700">
                        <span>Profit:</span>
                        <span className="font-mono font-semibold">{calc.profit.toFixed(2)} OMR</span>
                      </div>

                      <div className="flex justify-between text-base font-bold text-primary pt-1">
                        <span>Final Price:</span>
                        <span className="font-mono">{calc.finalPrice.toFixed(2)} OMR</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
            </Card>

            {/* Work Details */}
            {pricingMode === 'manual' && (
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
                      <div className="h-9 px-3 py-1 flex items-center border rounded-md bg-slate-50 text-slate-700 font-medium">
                        OMR {totalCutting.toFixed(2)}
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
                      <div className="h-9 px-3 py-1 flex items-center border rounded-md bg-slate-50 text-slate-700 font-medium">
                        OMR {totalBending.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                </CardContent>
              </Card>
            )}

            {/* Extra Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                  <Label htmlFor="otherCharges">Other Charges (OMR)</Label>
                  <Input 
                    id="otherCharges" 
                    type="number" 
                    min="0"
                    {...register("otherCharges")} 
                  />
                  {errors.otherCharges && <p className="text-red-500 text-sm">{errors.otherCharges.message}</p>}
                </div>
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
          <div className="md:col-span-1">
            <div className="sticky top-6 space-y-6">
              <Card className="border-primary/20 shadow-md">
                <CardHeader className="bg-primary/5 border-b pb-4">
                  <CardTitle className="text-lg">Quotation Summary</CardTitle>
                </CardHeader>
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
                    <span>Grand Total:</span>
                    <span className="text-primary">OMR {grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label htmlFor="advanceReceived">Advance Received (OMR)</Label>
                    <Input 
                      id="advanceReceived" 
                      type="number" 
                      min="0"
                      className="border-green-300 focus-visible:ring-green-500"
                      {...register("advanceReceived")} 
                    />
                    {errors.advanceReceived && <p className="text-red-500 text-sm">{errors.advanceReceived.message}</p>}
                  </div>

                  <div className="flex justify-between text-base font-bold bg-red-50 p-3 rounded-md text-red-700 mt-2">
                    <span>Balance Due:</span>
                    <span>OMR {balanceAmount.toFixed(2)}</span>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-6 flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Generate Quotation"}
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
