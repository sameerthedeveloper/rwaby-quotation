import { z } from "zod";

export const quotationSchema = z.object({
  // Customer
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  phone: z.string()
    .regex(/^[279]\d{7}$/, "Oman phone number must be 8 digits (starting with 2, 7, or 9)"),
  
  // Material
  materialType: z.string().min(1, "Material type is required"),
  thickness: z.string().min(1, "Thickness is required"),

  // Cutting
  numberOfCuts: z.coerce.number().min(0, "Number of cuts cannot be negative"),
  ratePerCut: z.coerce.number().min(0, "Rate per cut cannot be negative"),

  // Bending
  numberOfBends: z.coerce.number().min(0, "Number of bends cannot be negative"),
  ratePerBend: z.coerce.number().min(0, "Rate per bend cannot be negative"),

  // Charges
  otherCharges: z.coerce.number().min(0, "Other charges cannot be negative").optional().default(0),

  // Payments
  advanceReceived: z.coerce.number().min(0, "Advance cannot be negative").optional().default(0),

  // Delivery
  deliveryDate: z.string().refine((val) => {
    if (!val) return false;
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for fair comparison
    return date >= today;
  }, {
    message: "Delivery date cannot be in the past",
  }),
});
