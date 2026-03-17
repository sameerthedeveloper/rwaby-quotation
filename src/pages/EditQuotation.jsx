import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { quotationSchema } from "@/utils/validators";
import { calculateCuttingTotal, calculateBendingTotal, calculateGrandTotal, calculateBalanceAmount } from "@/utils/calculations";

export default function EditQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    async function fetchQuotation() {
      try {
        const docRef = doc(db, "quotations", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
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
  const grandTotal = calculateGrandTotal(totalCutting, totalBending, otherCharges);
  const balanceAmount = calculateBalanceAmount(grandTotal, advanceReceived);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "quotations", id);
      await updateDoc(docRef, {
        "Customer.customerName": data.customerName,
        "Customer.phone": data.phone,
        "Material.materialType": data.materialType,
        "Material.thickness": data.thickness,
        "Cutting.numberOfCuts": data.numberOfCuts,
        "Cutting.ratePerCut": data.ratePerCut,
        "Cutting.totalCutting": totalCutting,
        "Bending.numberOfBends": data.numberOfBends,
        "Bending.ratePerBend": data.ratePerBend,
        "Bending.totalBending": totalBending,
        "ExtraCharges.otherCharges": data.otherCharges,
        "Totals.grandTotal": grandTotal,
        "Payments.advanceReceived": data.advanceReceived,
        "Payments.balanceAmount": balanceAmount,
        "Delivery.deliveryDate": data.deliveryDate,
      });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
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
                    <div className="space-y-2">
                      <Label>Total Cutting</Label>
                      <div className="h-9 px-3 py-1 flex items-center border rounded-md bg-slate-50 text-slate-700 font-medium">OMR {totalCutting.toFixed(2)}</div>
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
                    <div className="space-y-2">
                      <Label>Total Bending</Label>
                      <div className="h-9 px-3 py-1 flex items-center border rounded-md bg-slate-50 text-slate-700 font-medium">OMR {totalBending.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Total Cutting:</span><span className="font-medium">OMR {totalCutting.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Total Bending:</span><span className="font-medium">OMR {totalBending.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Other Charges:</span><span className="font-medium">OMR {Number(otherCharges).toFixed(2)}</span></div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between text-base font-bold text-slate-900">
                    <span>Grand Total:</span><span className="text-primary">OMR {grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label>Advance Received (OMR)</Label>
                    <Input type="number" min="0" className="border-green-300" {...register("advanceReceived")} />
                  </div>
                  <div className="flex justify-between text-base font-bold bg-red-50 p-3 rounded-md text-red-700 mt-2">
                    <span>Balance Due:</span><span>OMR {balanceAmount.toFixed(2)}</span>
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
