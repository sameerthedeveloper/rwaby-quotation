import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

export default function EditJobCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // We are not using strict Zod here because Job Cards edits are often quick supervisor overrides
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    async function fetchJobCard() {
      try {
        const docRef = doc(db, "jobCards", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          reset({
            customerName: data.Customer?.customerName || "",
            phone: data.Customer?.phone || "",
            materialType: data.Material?.materialType || "",
            thickness: data.Material?.thickness || "",
            cuts: data.CuttingDetails?.cuts || 0,
            bends: data.BendingDetails?.bends || 0,
            advanceReceived: data.Payments?.advanceReceived || 0,
            balanceAmount: data.Payments?.balanceAmount || 0,
            deliveryDate: data.Delivery?.deliveryDate || "",
            status: data.Status?.status || "in_progress"
          });
        } else {
          alert("Job Card not found");
          navigate("/job-cards");
        }
      } catch (error) {
        console.error("Error fetching job card:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchJobCard();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "jobCards", id);
      await updateDoc(docRef, {
        "Customer.customerName": data.customerName,
        "Customer.phone": data.phone,
        "Material.materialType": data.materialType,
        "Material.thickness": data.thickness,
        "CuttingDetails.cuts": Number(data.cuts),
        "BendingDetails.bends": Number(data.bends),
        "Payments.advanceReceived": Number(data.advanceReceived),
        "Payments.balanceAmount": Number(data.balanceAmount),
        "Delivery.deliveryDate": data.deliveryDate,
        "Status.status": data.status
      });
      alert("Job Card updated successfully!");
      navigate('/job-cards');
    } catch (error) {
      console.error("Error updating job card:", error);
      alert("Failed to update job card.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading job card data...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Job Card</h1>
        <Button variant="outline" onClick={() => navigate('/job-cards')}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Job Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input {...register("customerName")} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select {...register("status")} className="w-full">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Material Type</Label>
              <Input {...register("materialType")} />
            </div>
            <div className="space-y-2">
              <Label>Thickness</Label>
              <Input {...register("thickness")} />
            </div>
            <div className="space-y-2">
              <Label>Target Delivery</Label>
              <Input type="date" {...register("deliveryDate")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Work Required</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Total Cuts</Label>
              <Input type="number" min="0" {...register("cuts")} />
            </div>
            <div className="space-y-2">
              <Label>Total Bends</Label>
              <Input type="number" min="0" {...register("bends")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Payments Update</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Advance Received (OMR)</Label>
              <Input type="number" min="0" {...register("advanceReceived")} />
            </div>
            <div className="space-y-2">
              <Label>Balance Due (OMR)</Label>
              <Input type="number" min="0" className="border-red-300" {...register("balanceAmount")} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating Job Card..." : "Save Job Card Updates"}
        </Button>
      </form>
    </div>
  );
}
